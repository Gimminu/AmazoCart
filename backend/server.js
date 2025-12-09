const express = require('express');
const cors = require('cors');
const compression = require('compression');
const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3004;
const DIST_DIR = path.join(__dirname, '../dist');
let hasCategorySummary = false;
let hasCountrySummary = false;
let hasPopularSnapshot = false;
let productPartitions = new Map();

const {
  DB_HOST = '127.0.0.1',
  DB_PORT = 3306,
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'amazon_db'
} = process.env;

const pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 8,
  queueLimit: 10,
  enableKeepAlive: true,
  charset: 'utf8mb4',
  maxIdle: 10000
});

// DB 연결 에러 핸들링
pool.on('error', (err) => {
  console.error('MySQL pool error:', err.code, err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed');
  }
  if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
    console.error('Database had a fatal error and connections are closed');
  }
  if (err.code === 'PROTOCOL_ENQUEUE_AFTER_DESTROY') {
    console.error('Database connection was destroyed');
  }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(compression());

// 전역 에러 핸들러
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // 안전하게 서버 재시작을 위해 약간의 시간 후 종료
  setTimeout(() => process.exit(1), 1000);
});

const cache = new Map();
const CACHE_TTL_SHORT = 15 * 60 * 1000;  // 2분 -> 15분
const CACHE_TTL_MED = 30 * 60 * 1000;     // 10분 -> 30분
const CACHE_TTL_LONG = 2 * 60 * 60 * 1000; // 30분 -> 2시간
const CACHE_TTL_SEARCH = 30 * 60 * 1000;   // 10분 -> 30분
const CACHE_TTL_POPULAR = 30 * 60 * 1000;  // 10분 -> 30분
const HOT_CACHE_TTL = 30 * 60 * 1000;      // 5분 -> 30분
const HOT_CACHE_LIMIT = 500;                // 240 -> 500
const HOT_CACHE_REFRESH_INTERVAL = 20 * 60 * 1000; // 4분 -> 20분
const DEFAULT_COUNTRIES = ['US', 'UK', 'CA', 'IN'];
const HOT_SORTS = ['popular', 'rating', 'price-low', 'price-high', 'newest'];
const FAST_SEARCH_TERMS = new Set([
  'best seller',
  'best sellers',
  'bestseller',
  'best-selling',
  'best selling',
  'top seller',
  'top sellers',
  'popular items',
  '인기 상품',
  '베스트셀러',
  '베스트 셀러'
]);
const hotCache = new Map();
let hotCacheCountries = new Set(['ALL', ...DEFAULT_COUNTRIES]);
function getCache(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expires <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}
function setCache(key, value, ttlMs = CACHE_TTL_SHORT) {
  cache.set(key, { value, expires: Date.now() + ttlMs });
}
function setCacheHeaders(res, ttlMs) {
  const seconds = Math.floor(ttlMs / 1000);
  res.set('Cache-Control', `public, max-age=${seconds}`);
}

const makeHotKey = (sort, country) => `${sort}:${country || 'ALL'}`;
const setHotEntry = (sort, country, rows) => {
  hotCache.set(makeHotKey(sort, country), { rows, timestamp: Date.now() });
};
const getHotList = (sort, country) => {
  const entry = hotCache.get(makeHotKey(sort, country));
  if (!entry) return null;
  if (Date.now() - entry.timestamp > HOT_CACHE_TTL) return null;
  return entry.rows;
};

async function refreshHotTargets() {
  try {
    const rows = await query('SELECT DISTINCT country_id FROM Product LIMIT 20');
    const ids = rows.map((row) => row.country_id).filter(Boolean);
    hotCacheCountries = new Set(['ALL', ...DEFAULT_COUNTRIES, ...ids]);
  } catch (err) {
    console.warn('Failed to refresh country targets for hot cache', err?.message);
    hotCacheCountries = new Set(['ALL', ...DEFAULT_COUNTRIES]);
  }
}

function buildSortClause(sort = 'popular') {
  switch (sort) {
    case 'price-low':
      return { order: 'ORDER BY p.price ASC, p.product_id DESC', index: 'idx_product_price_sort' };
    case 'price-high':
      return { order: 'ORDER BY p.price DESC, p.product_id DESC', index: 'idx_product_price_sort' };
    case 'rating':
      return {
        order: 'ORDER BY p.rating DESC, p.review_count DESC, p.product_id DESC',
        index: 'idx_product_rating_sort'
      };
    case 'newest':
      return { order: 'ORDER BY p.product_id DESC', index: 'PRIMARY' };
    case 'popular':
    default:
      return {
        order: 'ORDER BY p.review_count DESC, p.rating DESC, p.product_id DESC',
        index: 'idx_product_sort_popular'
      };
  }
}

async function refreshHotEntry(sort, country) {
  const { order, index } = buildSortClause(sort);
  const hasCountry = country && country !== 'ALL';
  const where = hasCountry ? 'WHERE p.country_id = ?' : '';
  const params = hasCountry ? [country, HOT_CACHE_LIMIT] : [HOT_CACHE_LIMIT];
  const productTable = resolveProductTable(country);
  const rows = await query(
    `
    SELECT
      p.product_id, p.product_name, p.price, p.image,
      p.rating AS avg_rating, p.review_count,
      p.category_id, p.country_id,
      c.category AS category_name
    FROM ${productTable} p
    LEFT JOIN Category c
      ON p.category_id = c.category_id
     AND p.country_id = c.country_id
    ${where}
    ${order}
    LIMIT ?
  `,
    params
  );
  setHotEntry(sort, country, rows.map(mapProductRow));
}

async function warmHotCache() {
  try {
    await refreshHotTargets();
  } catch (_) {
    // handled inside refreshHotTargets
  }
  if (!hotCacheCountries?.size) {
    hotCacheCountries = new Set(['ALL', ...DEFAULT_COUNTRIES]);
  }
  for (const country of hotCacheCountries) {
    for (const sort of HOT_SORTS) {
      try {
        await refreshHotEntry(sort, country);
      } catch (err) {
        console.warn(`Failed to warm cache for ${country}/${sort}`, err?.message);
      }
    }
  }
}

const slugify = (text = '') =>
  text
    .toString()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

async function query(sql, params = []) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(sql, params);
    return rows;
  } catch (err) {
    console.error('Query error:', err.code, err.message);
    throw err;
  } finally {
    if (connection) await connection.release();
  }
}

async function execute(sql, params = []) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.execute(sql, params);
    return result;
  } catch (err) {
    console.error('Execute error:', err.code, err.message);
    throw err;
  } finally {
    if (connection) await connection.release();
  }
}

function mapProductRow(row = {}) {
  const categoryName = row.category_name || row.category || null;
  return {
    product_id: row.product_id,
    product_name: row.product_name,
    price: Number(row.price ?? 0),
    image: row.image,
    avg_rating: row.avg_rating != null ? Number(row.avg_rating) : null,
    review_count: Number(row.review_count ?? 0),
    category_id: row.category_id,
    category_name: categoryName,
    category_slug: categoryName ? slugify(categoryName) : null,
    country_id: row.country_id
  };
}

function resolveProductTable(countryId) {
  const key = typeof countryId === 'string' ? countryId.toUpperCase() : '';
  if (key && productPartitions.has(key)) {
    return productPartitions.get(key);
  }
  return 'Product';
}

function buildVariantSearchTerm(name = '') {
  const cleaned = name
    .replace(/\b\d+\s*pack\b/gi, ' ')
    .replace(/\b\d+-pack\b/gi, ' ')
    .replace(/\bpack of \d+\b/gi, ' ')
    .replace(/[_/:-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  const stop = new Set([
    'pack',
    'count',
    'ct',
    'volt',
    'voltage',
    'performance',
    'alkaline',
    'lithium',
    'batteries',
    'battery',
    'cells',
    'cell',
    'appearance',
    'may',
    'vary',
    'original',
    'professional',
    'high'
  ]);
  const tokens = cleaned
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .filter((t) => !stop.has(t) && !/^[0-9]+$/.test(t) && t.length > 1);

  let keyTokens = tokens.slice(0, 4);
  if (!keyTokens.length) {
    const rawTokens = cleaned
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .slice(0, 3);
    keyTokens = rawTokens;
  }
  if (!keyTokens.length) return cleaned;
  return keyTokens.map((t) => `${t}*`).join(' ');
}

function buildVariantKey(name = '') {
  const cleaned = name
    .toLowerCase()
    .replace(/amazon basics|high[- ]?performance|alkaline|batter(y|ies)|battery|professional|original|appearance may vary/gi, ' ')
    .replace(/\b\d+\s*(?:pack|count|ct)\b/gi, ' ')
    .replace(/\b\d+-?pack\b/gi, ' ')
    .replace(/[_/:-]+/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';
  const stop = new Set(['amazon', 'basics', 'pack', 'count', 'ct', 'alkaline', 'battery', 'batteries']);
  const tokens = cleaned
    .split(' ')
    .filter(Boolean)
    .filter((t) => !stop.has(t) && !/^[0-9]+$/.test(t) && t.length > 1);
  return (tokens.length ? tokens : cleaned.split(' ')).slice(0, 3).join('-');
}

async function getOrCreateCart(userId) {
  const [existing] = await query(
    'SELECT * FROM Cart WHERE user_id = ? AND is_active = TRUE ORDER BY cart_id DESC LIMIT 1',
    [userId]
  );
  if (existing) return existing;

  const result = await execute(
    `INSERT INTO Cart (user_id, cart_name, is_active, created_at)
     VALUES (?, ?, TRUE, NOW())`,
    [userId, `Cart-${Date.now()}`]
  );
  const [cart] = await query('SELECT * FROM Cart WHERE cart_id = ?', [result.insertId]);
  return cart;
}

async function resolveCategoryFilters(value, countryId = null) {
  if (!value) return [];
  const normalized = slugify(value);
  const params = [value, value.toLowerCase()];
  let where = 'WHERE category = ? OR LOWER(category) = ?';
  if (countryId) {
    where += ' AND country_id = ?';
    params.push(countryId);
  }
  try {
    const exact = await query(
      `SELECT category_id, country_id, category FROM Category ${where}`,
      params
    );
    if (exact.length) return exact;

    const all = await query(
      countryId
        ? 'SELECT category_id, country_id, category FROM Category WHERE country_id = ?'
        : 'SELECT category_id, country_id, category FROM Category',
      countryId ? [countryId] : []
    );
    return all.filter((row) => slugify(row.category) === normalized);
  } catch (err) {
    console.error('Error resolving category filters:', err.message);
    return [];
  }
}

async function detectAggregates() {
  try {
    const [cat] = await query(
      `SELECT COUNT(*) AS cnt
       FROM information_schema.tables
       WHERE table_schema = ? AND table_name = 'Category_Summary'`,
      [DB_NAME]
    );
    hasCategorySummary = Number(cat?.cnt || 0) > 0;

    const [country] = await query(
      `SELECT COUNT(*) AS cnt
       FROM information_schema.tables
       WHERE table_schema = ? AND table_name = 'Country_Summary'`,
      [DB_NAME]
    );
    hasCountrySummary = Number(country?.cnt || 0) > 0;

    const [popular] = await query(
      `SELECT COUNT(*) AS cnt
       FROM information_schema.tables
       WHERE table_schema = ? AND table_name = 'Popular_Snapshot'`,
      [DB_NAME]
    );
    hasPopularSnapshot = Number(popular?.cnt || 0) > 0;

    // Detect country-partitioned product views/tables (e.g., Product_US, Product_UK, etc.)
    const partitions = await query(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = ?
        AND table_name LIKE 'Product\\_%'
      `,
      [DB_NAME]
    );
    productPartitions = new Map();
    partitions.forEach((row) => {
      const match = row.table_name.match(/^Product_([A-Z]{2,3})$/);
      if (match) {
        productPartitions.set(match[1].toUpperCase(), row.table_name);
      }
    });
  } catch (err) {
    console.warn('Aggregate table detection failed (falling back to raw queries)', err?.message);
    hasCategorySummary = false;
    hasCountrySummary = false;
    hasPopularSnapshot = false;
    productPartitions = new Map();
  }
}

app.post('/api/auth/login', async (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const username = name || email.split('@')[0];

  try {
    let users = await query('SELECT * FROM `User` WHERE email = ?', [email]);
    if (!users.length) {
      await execute('INSERT INTO `User` (name, email) VALUES (?, ?)', [username, email]);
      users = await query('SELECT * FROM `User` WHERE email = ?', [email]);
    }
    const user = users[0];
    await getOrCreateCart(user.user_id);
    res.json({ user_id: user.user_id, email: user.email, name: user.name });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const {
      limit = 24,
      offset = 0,
      category,
      minPrice,
      maxPrice,
      sort = 'popular',
      q,
      cursor,
      country
    } = req.query;
    const countryFilter =
      typeof country === 'string' && country.trim().length ? country.trim().toUpperCase() : null;
    const params = [];
    const limitNum = Math.min(parseInt(limit, 10) || 20, 48);
    const offsetNum = parseInt(offset, 10) || 0;
    const cursorId = cursor ? parseInt(cursor, 10) : null;
    const hasSearch = typeof q === 'string' && q.trim().length >= 2;
    const searchTerm = hasSearch ? q.trim() : '';
    const hasCategoryFilter = Boolean(category);

    const isCacheable =
      !q && !category && !minPrice && !maxPrice && offsetNum === 0 && limitNum <= 64;
    const cacheKey = isCacheable ? `products:${countryFilter || 'ALL'}:${sort}:${limitNum}` : null;
    if (cacheKey) {
      const cached = getCache(cacheKey);
      if (cached) {
        setCacheHeaders(res, CACHE_TTL_SHORT);
        return res.json(cached);
      }
    }

    const canUseHotCache =
      !hasSearch &&
      !category &&
      !minPrice &&
      !maxPrice &&
      !cursorId &&
      HOT_SORTS.includes(sort) &&
      offsetNum + limitNum <= HOT_CACHE_LIMIT;
    if (canUseHotCache) {
      const hotList = getHotList(sort, countryFilter || 'ALL');
      if (hotList?.length) {
        const slice = hotList.slice(offsetNum, offsetNum + limitNum);
        if (cacheKey) {
          setCache(cacheKey, slice, CACHE_TTL_SHORT);
          setCacheHeaders(res, CACHE_TTL_SHORT);
        }
        return res.json(slice);
      }
    }

    // Fast path for search: limit to a small scored window, then paginate.
    if (hasSearch) {
      const searchKey = `search:${countryFilter || 'ALL'}:${searchTerm}:${category || 'all'}:${sort}:${minPrice || ''
        }:${maxPrice || ''}:${limitNum}:${offsetNum}`;
      const cached = getCache(searchKey);
      if (cached) {
        setCacheHeaders(res, CACHE_TTL_SEARCH);
        return res.json(cached);
      }

      const filters = category ? await resolveCategoryFilters(category) : [];
      if (category && !filters.length) {
        return res.json([]);
      }

      const candidateLimit = Math.min(80, Math.max(limitNum * 2, 60));
      const whereParts = ['MATCH(product_name) AGAINST (? IN BOOLEAN MODE)', 'review_count > 0'];
      const innerParams = [searchTerm, searchTerm]; // first for SELECT score, second for WHERE
      if (countryFilter) {
        whereParts.push('country_id = ?');
        innerParams.push(countryFilter);
      }

      if (minPrice) {
        whereParts.push('price >= ?');
        innerParams.push(parseFloat(minPrice));
      }
      if (maxPrice) {
        whereParts.push('price <= ?');
        innerParams.push(parseFloat(maxPrice));
      }
      if (filters.length) {
        const clause = filters.map(() => '(category_id = ? AND country_id = ?)').join(' OR ');
        whereParts.push(`(${clause})`);
        filters.forEach((f) => {
          innerParams.push(f.category_id, f.country_id);
        });
      }

      let orderClause =
        'ORDER BY ps.ft_score DESC, ps.review_count DESC, ps.rating DESC, ps.product_id DESC';
      switch (sort) {
        case 'price-low':
          orderClause = 'ORDER BY ps.price ASC, ps.product_id DESC';
          break;
        case 'price-high':
          orderClause = 'ORDER BY ps.price DESC, ps.product_id DESC';
          break;
        case 'rating':
          orderClause = 'ORDER BY ps.rating DESC, ps.review_count DESC, ps.product_id DESC';
          break;
        case 'newest':
          orderClause = 'ORDER BY ps.product_id DESC';
          break;
        case 'popular':
        default:
          orderClause =
            'ORDER BY ps.ft_score DESC, ps.review_count DESC, ps.rating DESC, ps.product_id DESC';
          break;
      }

      const normalizedSearch = searchTerm.toLowerCase().replace(/\s+/g, ' ').trim();
      if (FAST_SEARCH_TERMS.has(normalizedSearch)) {
        const hotPopular = getHotList('popular', countryFilter || 'ALL');
        if (hotPopular?.length) {
          const slice = hotPopular.slice(offsetNum, offsetNum + limitNum);
          setCache(searchKey, slice, CACHE_TTL_SEARCH);
          setCacheHeaders(res, CACHE_TTL_SEARCH);
          return res.json(slice);
        }
      }

      const productTable = resolveProductTable(countryFilter);
      const sql = `
        SELECT
          ps.product_id,
          ps.product_name,
          ps.price,
          ps.image,
          ps.rating AS avg_rating,
          ps.review_count,
          ps.category_id,
          ps.country_id,
          c.category AS category_name,
          ps.ft_score
        FROM (
          SELECT /*+ MAX_EXECUTION_TIME(5000) */
            product_id,
            product_name,
            price,
            image,
            rating,
            review_count,
            category_id,
            country_id,
            MATCH(product_name) AGAINST (? IN BOOLEAN MODE) AS ft_score
          FROM ${productTable}
          WHERE ${whereParts.join(' AND ')}
          ORDER BY ft_score DESC
          LIMIT ${candidateLimit}
        ) ps
        LEFT JOIN Category c
          ON ps.category_id = c.category_id
         AND ps.country_id = c.country_id
        ${orderClause}
        LIMIT ? OFFSET ?
      `;
      const rows = await query(sql, [...innerParams, limitNum, offsetNum]);
      const mapped = rows.map(mapProductRow);
      setCache(searchKey, mapped, CACHE_TTL_SEARCH);
      setCacheHeaders(res, CACHE_TTL_SEARCH);
      return res.json(mapped);
    }

    // Fast path for popular landing: use snapshot table when available
    if (
      hasPopularSnapshot &&
      !hasSearch &&
      !category &&
      !minPrice &&
      !maxPrice &&
      sort === 'popular' &&
      offsetNum === 0
    ) {
      const rows = await query(
        `
        SELECT
          p.product_id, p.product_name, p.price, p.image,
          p.rating AS avg_rating, p.review_count,
          p.category_id, p.country_id,
          c.category AS category_name
        FROM Popular_Snapshot p
        LEFT JOIN Category c
          ON p.category_id = c.category_id
         AND p.country_id = c.country_id
        ${countryFilter ? 'WHERE p.country_id = ?' : ''}
        ORDER BY p.review_count DESC, p.rating DESC, p.product_id DESC
        LIMIT ?
      `,
        countryFilter ? [countryFilter, limitNum] : [limitNum]
      );
      const mapped = rows.map(mapProductRow);
      return res.json(mapped);
    }

    // Index hints disabled - using MySQL optimizer instead
    let indexHint = '';

    const productTable = resolveProductTable(countryFilter);
    let sql = `
      SELECT
        p.product_id, p.product_name, p.price, p.image,
        p.rating AS avg_rating, p.review_count,
        p.category_id, p.country_id,
        c.category AS category_name
      FROM ${productTable} p${indexHint}
      LEFT JOIN Category c
        ON p.category_id = c.category_id
       AND p.country_id = c.country_id
      WHERE 1=1
    `;

    if (category) {
      const filters = await resolveCategoryFilters(category, countryFilter);
      if (!filters.length) {
        return res.json([]);
      }
      const clause = filters.map(() => '(p.category_id = ? AND p.country_id = ?)').join(' OR ');
      sql += ` AND (${clause})`;
      filters.forEach((f) => {
        params.push(f.category_id, f.country_id);
      });
    }

    if (countryFilter) {
      sql += ' AND p.country_id = ?';
      params.push(countryFilter);
    }

    if (minPrice) {
      sql += ' AND p.price >= ?';
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      sql += ' AND p.price <= ?';
      params.push(parseFloat(maxPrice));
    }

    if (hasSearch) {
      sql += ' AND MATCH(p.product_name) AGAINST (? IN BOOLEAN MODE)';
      params.push(searchTerm);
    }

    if (cursorId && sort === 'newest') {
      sql += ' AND p.product_id < ?';
      params.push(cursorId);
    }

    switch (sort) {
      case 'price-low':
        sql += ' ORDER BY p.price ASC, p.product_id DESC';
        break;
      case 'price-high':
        sql += ' ORDER BY p.price DESC, p.product_id DESC';
        break;
      case 'rating':
        sql += ' ORDER BY p.rating DESC, p.review_count DESC, p.product_id DESC';
        break;
      case 'newest':
        sql += ' ORDER BY p.product_id DESC';
        break;
      case 'popular':
      default:
        if (hasSearch) {
          sql +=
            ' ORDER BY MATCH(p.product_name) AGAINST (? IN BOOLEAN MODE) DESC, p.review_count DESC, p.rating DESC, p.product_id DESC';
          params.push(searchTerm);
        } else {
          sql += ' ORDER BY p.review_count DESC, p.rating DESC, p.product_id DESC';
        }
        break;
    }

    sql += ' LIMIT ? OFFSET ?';
    params.push(limitNum, offsetNum);

    const rows = await query(sql, params);
    const mapped = rows.map(mapProductRow);
    if (cursorId && sort === 'newest') {
      const nextCursor = mapped.length === limitNum ? mapped[mapped.length - 1].product_id : null;
      if (nextCursor) res.set('X-Next-Cursor', String(nextCursor));
    }
    if (cacheKey) {
      setCache(cacheKey, mapped, CACHE_TTL_SHORT);
      setCacheHeaders(res, CACHE_TTL_SHORT);
    }
    res.json(mapped);
  } catch (err) {
    console.error('Error fetching products', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/products/popular', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 64);
  const countryParam =
    typeof req.query.country === 'string' && req.query.country.trim().length
      ? req.query.country.trim().toUpperCase()
      : null;
  try {
    const cacheKey = `popular:${countryParam || 'ALL'}:${limit}`;
    const cached = getCache(cacheKey);
    if (cached) {
      setCacheHeaders(res, CACHE_TTL_POPULAR);
      return res.json(cached);
    }

    let rows;
    const productTable = resolveProductTable(countryParam);
    if (hasPopularSnapshot) {
      rows = await query(
        `
        SELECT
          p.product_id,
          p.product_name,
          p.price,
          p.image,
          p.rating AS avg_rating,
          p.review_count,
          p.category_id,
          p.country_id,
          c.category AS category_name
        FROM Popular_Snapshot p
        LEFT JOIN Category c
          ON p.category_id = c.category_id
         AND p.country_id = c.country_id
        ${countryParam ? 'WHERE p.country_id = ?' : ''}
        ORDER BY p.review_count DESC, p.rating DESC, p.product_id DESC
        LIMIT ?
      `,
        countryParam ? [countryParam, limit] : [limit]
      );
    } else {
      rows = await query(
        `
        SELECT
          p.product_id,
          p.product_name,
          p.price,
          p.image,
          p.rating AS avg_rating,
          p.review_count,
          p.category_id,
          p.country_id,
          c.category AS category_name
        FROM ${productTable} p
        LEFT JOIN Category c
          ON p.category_id = c.category_id
         AND p.country_id = c.country_id
        ${countryParam ? 'WHERE p.country_id = ?' : ''}
        ORDER BY p.review_count DESC, p.rating DESC, p.product_id DESC
        LIMIT ?
      `,
        countryParam ? [countryParam, limit] : [limit]
      );
    }
    const mapped = rows.map(mapProductRow);
    setCache(cacheKey, mapped, CACHE_TTL_POPULAR);
    setCacheHeaders(res, CACHE_TTL_POPULAR);
    res.json(mapped);
  } catch (err) {
    console.error('Error fetching popular products', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/products/category/:categoryId', async (req, res) => {
  const categoryId = parseInt(req.params.categoryId, 10);
  const limit = parseInt(req.query.limit, 10) || 20;
  const countryParam =
    typeof req.query.country === 'string' && req.query.country.trim().length
      ? req.query.country.trim().toUpperCase()
      : null;
  if (Number.isNaN(categoryId)) return res.status(400).json({ error: 'Invalid category id' });

  try {
    const productTable = resolveProductTable(countryParam);
    const rows = await query(
      `
      SELECT
        p.product_id,
        p.product_name,
        p.price,
        p.image,
        p.rating AS avg_rating,
        p.review_count,
        p.category_id,
        p.country_id,
        c.category AS category_name
      FROM ${productTable} p
      LEFT JOIN Category c
        ON p.category_id = c.category_id
       AND p.country_id = c.country_id
      WHERE p.category_id = ?
      ${countryParam ? 'AND p.country_id = ?' : ''}
      ORDER BY p.review_count DESC, p.rating DESC
      LIMIT ?
    `,
      countryParam ? [categoryId, countryParam, limit] : [categoryId, limit]
    );
    res.json(rows.map(mapProductRow));
  } catch (err) {
    console.error('Error fetching category products:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  const countryParam =
    typeof req.query.country === 'string' && req.query.country.trim().length
      ? req.query.country.trim().toUpperCase()
      : null;

  // 캐시 키 생성
  const cacheKey = `product:${req.params.id}:${countryParam || 'ALL'}`;
  const cached = getCache(cacheKey);
  if (cached) {
    setCacheHeaders(res, CACHE_TTL_LONG);
    return res.json(cached);
  }

  try {
    const productTable = resolveProductTable(countryParam);
    const rows = await query(
      `
      SELECT
        p.product_id,
        p.product_name,
        p.price,
        p.image,
        p.rating AS avg_rating,
        p.review_count,
        p.category_id,
        p.country_id,
        c.category AS category_name
      FROM ${productTable} p
      LEFT JOIN Category c
        ON p.category_id = c.category_id
       AND p.country_id = c.country_id
      WHERE p.product_id = ?
      ${countryParam ? 'AND p.country_id = ?' : ''}
    `,
      countryParam ? [req.params.id, countryParam] : [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });

    const product = mapProductRow(rows[0]);
    setCache(cacheKey, product, CACHE_TTL_LONG);
    setCacheHeaders(res, CACHE_TTL_LONG);
    res.json(product);
  } catch (err) {
    console.error('Error fetching product', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Variants: find similar products (same brand/family) using full-text search
app.get('/api/products/:id/variants', async (req, res) => {
  const countryParam =
    typeof req.query.country === 'string' && req.query.country.trim().length
      ? req.query.country.trim().toUpperCase()
      : null;
  try {
    const productTable = resolveProductTable(countryParam);
    const cacheKey = `variants:${req.params.id}:${countryParam || 'ALL'}`;
    const cached = getCache(cacheKey);
    if (cached) {
      setCacheHeaders(res, CACHE_TTL_SHORT);
      return res.json(cached);
    }

    const [target] = await query(
      `
      SELECT
        p.product_id,
        p.product_name,
        p.price,
        p.image,
        p.rating AS avg_rating,
        p.review_count,
        p.category_id,
        p.country_id,
        c.category AS category_name
      FROM ${productTable} p
      LEFT JOIN Category c
        ON p.category_id = c.category_id
       AND p.country_id = c.country_id
      WHERE p.product_id = ?
      ${countryParam ? 'AND p.country_id = ?' : ''}
      `,
      countryParam ? [req.params.id, countryParam] : [req.params.id]
    );

    if (!target) return res.status(404).json({ error: 'Product not found' });

    const term = buildVariantSearchTerm(target.product_name);
    if (!term) return res.json({ variants: [mapProductRow(target)], searchTerm: null });

    let rows = await query(
      `
      SELECT
        p.product_id,
        p.product_name,
        p.price,
        p.image,
        p.rating AS avg_rating,
        p.review_count,
        p.category_id,
        p.country_id,
        c.category AS category_name
      FROM ${productTable} p
      LEFT JOIN Category c
        ON p.category_id = c.category_id
       AND p.country_id = c.country_id
      WHERE MATCH(p.product_name) AGAINST (? IN BOOLEAN MODE)
      ${countryParam ? 'AND p.country_id = ?' : ''}
      ORDER BY p.review_count DESC, p.rating DESC, p.product_id DESC
      LIMIT 30
      `,
      countryParam ? [term, countryParam] : [term]
    );

    // Additional fallback using LIKE on leading token if still few results
    if (rows.length < 3) {
      const likeToken = term.split(' ')[0]?.replace('*', '');
      if (likeToken) {
        rows = await query(
          `
          SELECT
            p.product_id,
            p.product_name,
            p.price,
            p.image,
            p.rating AS avg_rating,
            p.review_count,
            p.category_id,
            p.country_id,
            c.category AS category_name
          FROM ${productTable} p
          LEFT JOIN Category c
            ON p.category_id = c.category_id
           AND p.country_id = c.country_id
         WHERE LOWER(p.product_name) LIKE CONCAT('%', ?, '%')
            ${countryParam ? 'AND p.country_id = ?' : ''}
          ORDER BY p.review_count DESC, p.rating DESC, p.product_id DESC
          LIMIT 30
          `,
          countryParam ? [likeToken, countryParam] : [likeToken]
        );
      }
    }

    // Fallback: same category/country with partial name match (first 2 tokens)
    if (rows.length < 3 && target.category_id) {
      const firstTwo = target.product_name
        .toLowerCase()
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .join(' ');
      if (firstTwo) {
        rows = await query(
          `
          SELECT
            p.product_id,
            p.product_name,
            p.price,
            p.image,
            p.rating AS avg_rating,
            p.review_count,
            p.category_id,
            p.country_id,
            c.category AS category_name
          FROM ${productTable} p
          LEFT JOIN Category c
            ON p.category_id = c.category_id
           AND p.country_id = c.country_id
         WHERE p.category_id = ? AND p.country_id = ?
            AND LOWER(p.product_name) LIKE CONCAT('%', ?, '%')
          ORDER BY p.review_count DESC, p.rating DESC, p.product_id DESC
          LIMIT 30
          `,
          [target.category_id, target.country_id, firstTwo]
        );
      }
    }

    if (rows.length < 2 && target.category_id) {
      rows = await query(
        `
        SELECT
          p.product_id,
          p.product_name,
          p.price,
          p.image,
          p.rating AS avg_rating,
          p.review_count,
          p.category_id,
          p.country_id,
          c.category AS category_name
        FROM ${productTable} p
        LEFT JOIN Category c
          ON p.category_id = c.category_id
         AND p.country_id = c.country_id
        WHERE p.category_id = ? AND p.country_id = ?
        ORDER BY p.review_count DESC, p.rating DESC, p.product_id DESC
        LIMIT 30
        `,
        [target.category_id, target.country_id]
      );
    }

    // Group by lightweight variant key to avoid noisy near-duplicates.
    const targetKey = buildVariantKey(target.product_name);
    let mapped = rows.map(mapProductRow);
    if (targetKey) {
      const filtered = mapped.filter((p) => buildVariantKey(p.product_name) === targetKey);
      // If the heuristic filtered almost everything out, fall back to the broader set so users still see options.
      mapped = filtered.length >= 2 ? filtered : mapped;
    }

    // Always include the target product.
    const exists = mapped.find((p) => p.product_id === target.product_id);
    const variants = exists ? mapped : [mapProductRow(target), ...mapped];

    const payload = { variants, searchTerm: term };
    setCache(cacheKey, payload, CACHE_TTL_SHORT);
    setCacheHeaders(res, CACHE_TTL_SHORT);
    res.json(payload);
  } catch (err) {
    console.error('Error fetching variants', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/categories', async (req, res) => {
  const countryParam =
    typeof req.query.country === 'string' && req.query.country.trim().length
      ? req.query.country.trim().toUpperCase()
      : null;
  try {
    const cacheKey = `categories:${countryParam || 'ALL'}`;
    const cached = getCache(cacheKey);
    if (cached) {
      setCacheHeaders(res, CACHE_TTL_LONG);
      return res.json(cached);
    }

    const rows = await query(
      hasCategorySummary
        ? `
        SELECT
          c.category_id,
          c.country_id,
          c.category,
          COALESCE(cs.product_count, 0) AS product_count
        FROM Category c
        LEFT JOIN Category_Summary cs
          ON c.category_id = cs.category_id
         AND c.country_id = cs.country_id
        ${countryParam ? 'WHERE c.country_id = ?' : ''}
        ORDER BY c.country_id, c.category
      `
        : `
        SELECT
          c.category_id,
          c.country_id,
          c.category,
          COUNT(p.product_id) AS product_count
        FROM Category c
        LEFT JOIN Product p
          ON c.category_id = p.category_id
         AND c.country_id = p.country_id
        ${countryParam ? 'WHERE c.country_id = ?' : ''}
        GROUP BY c.category_id, c.country_id, c.category
        ORDER BY c.country_id, c.category
      `,
      countryParam ? [countryParam] : []
    );
    const mapped = rows.map((row) => ({
      ...row,
      product_count: Number(row.product_count || 0),
      slug: slugify(row.category)
    }));
    setCache(cacheKey, mapped, CACHE_TTL_LONG);
    setCacheHeaders(res, CACHE_TTL_LONG);
    res.json(mapped);
  } catch (err) {
    console.error('Error fetching categories', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/stats/countries', async (req, res) => {
  try {
    const cached = getCache('stats:countries');
    if (cached) {
      setCacheHeaders(res, CACHE_TTL_LONG);
      return res.json(cached);
    }

    const rows = await query(
      hasCountrySummary
        ? `
        SELECT
          country_id,
          country,
          product_count,
          avg_price,
          avg_rating
        FROM Country_Summary
        ORDER BY country
      `
        : `
        SELECT
          c.country_id,
          c.country,
          COUNT(p.product_id) AS product_count,
          AVG(p.price) AS avg_price,
          AVG(p.rating) AS avg_rating
        FROM Country c
        LEFT JOIN Product p ON c.country_id = p.country_id
        GROUP BY c.country_id, c.country
        ORDER BY c.country
      `
    );
    const mapped = rows.map((row) => ({
      country_id: row.country_id,
      country: row.country,
      product_count: Number(row.product_count || 0),
      avg_price: row.avg_price != null ? Number(row.avg_price) : null,
      avg_rating: row.avg_rating != null ? Number(row.avg_rating) : null
    }));
    setCache('stats:countries', mapped, CACHE_TTL_LONG);
    setCacheHeaders(res, CACHE_TTL_LONG);
    res.json(mapped);
  } catch (err) {
    console.error('Error fetching country stats', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/cart', async (req, res) => {
  const userId = parseInt(req.query.userId, 10);
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const cart = await getOrCreateCart(userId);
    const items = await query(
      `
      SELECT
        ci.product_id,
        ci.quantity,
        p.product_name,
        p.image,
        p.price,
        (ci.quantity * p.price) AS line_total
      FROM Cart_Item ci
      JOIN Product p ON ci.product_id = p.product_id
      WHERE ci.cart_id = ?
    `,
      [cart.cart_id]
    );
    res.json({ cart_id: cart.cart_id, items });
  } catch (err) {
    console.error('Error fetching cart', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/cart/add', async (req, res) => {
  const { userId, productId, quantity = 1 } = req.body;
  if (!userId || !productId) return res.status(400).json({ error: 'userId and productId required' });

  try {
    const cart = await getOrCreateCart(userId);
    const existing = await query(
      'SELECT cart_item_id FROM Cart_Item WHERE cart_id = ? AND product_id = ?',
      [cart.cart_id, productId]
    );
    if (existing.length) {
      await execute(
        'UPDATE Cart_Item SET quantity = quantity + ? WHERE cart_id = ? AND product_id = ?',
        [quantity, cart.cart_id, productId]
      );
    } else {
      await execute(
        'INSERT INTO Cart_Item (cart_id, product_id, quantity, added_at) VALUES (?, ?, ?, NOW())',
        [cart.cart_id, productId, quantity]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error adding to cart', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/cart/update', async (req, res) => {
  const { userId, productId, quantity } = req.body;
  if (!userId || !productId || quantity == null) {
    return res.status(400).json({ error: 'userId, productId, quantity required' });
  }

  try {
    const cart = await getOrCreateCart(userId);
    if (quantity <= 0) {
      await execute('DELETE FROM Cart_Item WHERE cart_id = ? AND product_id = ?', [
        cart.cart_id,
        productId
      ]);
    } else {
      const existing = await query(
        'SELECT cart_item_id FROM Cart_Item WHERE cart_id = ? AND product_id = ?',
        [cart.cart_id, productId]
      );
      if (existing.length) {
        await execute('UPDATE Cart_Item SET quantity = ? WHERE cart_id = ? AND product_id = ?', [
          quantity,
          cart.cart_id,
          productId
        ]);
      } else {
        await execute(
          'INSERT INTO Cart_Item (cart_id, product_id, quantity, added_at) VALUES (?, ?, ?, NOW())',
          [cart.cart_id, productId, quantity]
        );
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating cart', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/cart/item/:productId', async (req, res) => {
  const productId = req.params.productId;
  const userId = parseInt(req.query.userId, 10);
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const cart = await getOrCreateCart(userId);
    await execute('DELETE FROM Cart_Item WHERE cart_id = ? AND product_id = ?', [
      cart.cart_id,
      productId
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting cart item', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/orders', async (req, res) => {
  const userId = parseInt(req.query.userId, 10);
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const orders = await query(
      'SELECT * FROM Orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    const response = [];
    for (const order of orders) {
      const items = await query(
        `
        SELECT
          oi.product_id,
          oi.quantity,
          oi.price_at_order,
          oi.amount,
          oi.product_name,
          p.image
        FROM Order_Item oi
        LEFT JOIN Product p ON oi.product_id = p.product_id
        WHERE oi.order_id = ?
      `,
        [order.order_id]
      );
      response.push({ ...order, items });
    }
    res.json(response);
  } catch (err) {
    console.error('Error fetching orders', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/orders/checkout', async (req, res) => {
  const userId = parseInt(req.body.userId, 10);
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const cart = await getOrCreateCart(userId);
    const items = await query(
      `
      SELECT ci.product_id, ci.quantity, p.price, p.product_name
      FROM Cart_Item ci
      JOIN Product p ON ci.product_id = p.product_id
      WHERE ci.cart_id = ?
    `,
      [cart.cart_id]
    );
    if (!items.length) return res.status(400).json({ error: 'Cart is empty' });

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderId = `ORD-${Date.now()}`;

    await execute(
      `INSERT INTO Orders (order_id, user_id, shipping_country, total_amount, status, address, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?, NOW())`,
      [orderId, userId, 'Republic of Korea', total, 'Default address']
    );

    for (const item of items) {
      await execute(
        `INSERT INTO Order_Item (order_id, product_id, quantity, price_at_order, amount, product_name)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price, item.price * item.quantity, item.product_name]
      );
    }

    await execute('DELETE FROM Cart_Item WHERE cart_id = ?', [cart.cart_id]);

    res.json({ success: true, order_id: orderId, total_amount: total });
  } catch (err) {
    console.error('Error during checkout', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const startTime = Date.now();
    await query('SELECT 1');
    const queryTime = Date.now() - startTime;

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: DB_NAME,
      host: DB_HOST,
      port: DB_PORT,
      queryTimeMs: queryTime,
      uptime: process.uptime(),
      memoryUsage: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB'
      }
    });
  } catch (err) {
    console.error('Health check failed:', err.message);
    res.status(500).json({
      status: 'DOWN',
      error: err.message,
      code: err.code,
      timestamp: new Date().toISOString()
    });
  }
});

// Serve built frontend assets from ../dist when available
app.use(
  express.static(DIST_DIR, {
    maxAge: '1h'
  })
);

// SPA fallback: send index.html for non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

async function startServer() {
  try {
    console.log('Attempting to connect to database...');
    await query('SELECT 1');
    console.log(`✓ Connected to MySQL database ${DB_NAME} at ${DB_HOST}:${DB_PORT}`);

    console.log('Detecting aggregate tables...');
    await detectAggregates();
    console.log(
      `✓ Aggregate tables available - Category_Summary: ${hasCategorySummary}, Country_Summary: ${hasCountrySummary}, Popular_Snapshot: ${hasPopularSnapshot}`
    );

    const server = app.listen(PORT, () => {
      console.log(`✓ AmazoCart backend running on http://localhost:${PORT}`);
    });

    // 서버 에러 핸들링
    server.on('error', (err) => {
      console.error('Server error:', err);
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        pool.end(() => {
          console.log('Database pool closed');
          process.exit(0);
        });
      });
      setTimeout(() => process.exit(1), 30000);
    });

  } catch (err) {
    console.error('✗ Failed to start server:', err.message);
    console.error('Error code:', err.code);
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      console.error('Cannot connect to database. Check if MariaDB is running and credentials are correct.');
    }
    process.exit(1);
  }
}

startServer();
