export interface VariantGroup<T> {
  key: string;
  representative: T;
  variants: T[];
  images: string[];
  variantCount: number;
}

interface VariantCandidate {
  product_name: string;
  product_id?: string;
  image?: string;
  category_id?: number;
  country_id?: string;
  review_count?: number;
  avg_rating?: number;
  price?: number;
}

// Heuristic variant key builder: normalize brand/adjectives/pack counts and keep core tokens.
export function buildVariantKey(name: string) {
  const base = (name || '').toLowerCase();

  // Special case: Amazon Basics batteries – group by cell type only (AA/AAA/C/D/9V/CR2032)
  const cellMatch = base.match(/\b(aaa?|aa|c|d|9v|cr2032)\b/);
  if (base.includes('amazon basics') && cellMatch) {
    return `amazon-basics-battery-${cellMatch[1].toLowerCase()}`;
  }

  const cleaned = base
    // remove common descriptors/brand boilerplate
    .replace(/amazon basics|high[- ]?performance|alkaline|batter(y|ies)|battery|professional|original|appearance may vary/gi, ' ')
    // strip pack/count patterns
    .replace(/\b\d+\s*(?:pack|count|ct)\b/gi, ' ')
    .replace(/\b\d+-?pack\b/gi, ' ')
    // normalize separators and punctuation
    .replace(/[_/:-]+/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  const stopWords = new Set([
    'amazon',
    'basics',
    'pack',
    'count',
    'ct',
    'alkaline',
    'battery',
    'batteries',
    'cells',
    'cell',
    'button',
    'performance',
    'high',
    'lithium',
    'original',
    'professional',
    'blister',
    'appearance',
    'may',
    'vary',
    'year',
    'shelf',
    'life'
  ]);

  const tokens = cleaned.split(' ').filter(Boolean);
  const filtered = tokens.filter((t) => {
    if (stopWords.has(t)) return false;
    if (/^[0-9]+$/.test(t)) return false;
    return t.length > 1;
  });

  // keep first 2 tokens after filtering to group variants aggressively (e.g., brand + size)
  const baseTokens = (filtered.length ? filtered : tokens).slice(0, 2);
  return baseTokens.join('-');
}

// Group products (or any item with product_name) by variant key to reduce duplicates in UI.
export function groupByVariant<T extends VariantCandidate>(items: T[] = []): VariantGroup<T>[] {
  const map = new Map<
    string,
    { key: string; representative: T; variants: T[]; score: number; images: string[] }
  >();

  const addImage = (images: string[], src?: string) => {
    if (src && !images.includes(src)) images.push(src);
  };

  const score = (item: VariantCandidate) => {
    const reviews = Number(item.review_count ?? 0);
    const rating = Number(item.avg_rating ?? 0);
    const priceWeight = Number(item.price ?? 0) * 0.0001; // tiny tie-breaker
    return reviews * 10 + rating + priceWeight;
  };

  for (const item of items) {
    const variantKey = buildVariantKey(item.product_name);
    const scopedKey = variantKey || `sku:${item.product_id || item.product_name}`;

    const existing = map.get(scopedKey);
    const candidateScore = score(item);
    if (!existing) {
      map.set(scopedKey, {
        key: scopedKey,
        representative: item,
        variants: [],
        score: candidateScore,
        images: item.image ? [item.image] : []
      });
      continue;
    }

    const isDuplicate =
      (item.product_id &&
        (existing.representative.product_id === item.product_id ||
          existing.variants.some((v) => v.product_id === item.product_id))) ||
      item.product_name === existing.representative.product_name;

    addImage(existing.images, item.image);

    if (candidateScore > existing.score && !isDuplicate) {
      existing.variants.unshift(existing.representative);
      existing.representative = item;
      existing.score = candidateScore;
    } else if (!isDuplicate) {
      existing.variants.push(item);
    }
  }

  return Array.from(map.values()).map(({ key, representative, variants, images }) => ({
    key,
    representative,
    variants,
    images,
    variantCount: variants.length + 1
  }));
}
