const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3004; // 기존 포트로 변경

// /amazon 경로를 amazon.com으로 프록시
app.use('/amazon', createProxyMiddleware({
    target: 'https://www.amazon.com',
    changeOrigin: true,
    pathRewrite: {
        '^/amazon': '',
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`Proxying request to: ${proxyReq.path}`);
    },
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).send('Proxy error');
    }
}));

// 기본 라우트
app.get('/', (req, res) => {
    res.send('Proxy test server running. Try /amazon');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Proxy test server listening on port ${PORT} on all interfaces`);
});