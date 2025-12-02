m.jeeey.com deployment and verification

1) Install dependencies and build

```bash
cd apps/mweb
pnpm install
pnpm build
```

2) Sync dist to server root

```bash
# Example: /var/www/ecom/apps/mweb/dist
rsync -avz --delete dist/ user@srv:/var/www/ecom/apps/mweb/dist/
```

3) Reload nginx after updating config

```bash
sudo nginx -t && sudo systemctl reload nginx
```

4) Quick checks

```bash
curl -I --http2 https://m.jeeey.com
curl -sI https://m.jeeey.com | grep -i content-security-policy
curl -sI https://m.jeeey.com/sw.js
curl -sI https://m.jeeey.com/manifest.webmanifest
curl -sI https://m.jeeey.com/assets/ | head -n 20
```

5) Asset caching

```bash
curl -sI https://m.jeeey.com/assets/index.js | grep -i cache-control
curl -sI https://m.jeeey.com/index.html | grep -i cache-control
```

6) DNS

```bash
dig m.jeeey.com A +short
dig m.jeeey.com AAAA +short
```

7) Real device test
- Test on iPhone Safari and Android Chrome (fresh tab, no cache).

8) API micro-cache & metrics

```bash
# API JSON micro-cache (expect X-Cache:HIT after the first request within 1 minute)
curl -sI https://api.jeeey.com/api/products?limit=12 | grep -i x-cache

# Basic API metrics
curl -s https://api.jeeey.com/metrics/basic
```

9) Same-origin API for mweb

```bash
# Ensure mweb proxies /api/* to API upstream
curl -sI https://m.jeeey.com/api/tabs/list | head -n 20
```


