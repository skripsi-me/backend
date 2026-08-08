# Plans — Perbaikan Backend E-Commerce

Index semua plan perbaikan. Status diperbarui manual setelah eksekusi.

## Legend

- **Status**: `pending` | `in_progress` | `done`
- **Prioritas**: tinggi | sedang | rendah

---

| # | Plan | Status | Prioritas |
|---|------|--------|-----------|
| [001](001-cors-origin-allowlist.md) | CORS origin allowlist via env | done | tinggi |
| [002](002-checkout-stock-atomic.md) | Checkout stock atomic update | done | tinggi |
| [003](003-cart-ownership-check.md) | Cart item ownership check | done | sedang |
| [004](004-trust-proxy.md) | trustProxy untuk proxy/Vercel | done | sedang |
| [005](005-refresh-token-hash.md) | Refresh token hash storage | done | sedang |
| [006](006-order-status-enum.md) | Order status MySQL ENUM | done | rendah |
| [007](007-type-safety-whereclause.md) | Type safety products.list whereClause | done | rendah |
| [008](008-dead-code-cleanup.md) | Bersihkan dead code | done | rendah |
| [009](009-register-safe-return.md) | Register return safe subset | done | rendah |
| [010](010-dry-product-mapping.md) | DRY mapping produk | done | rendah |
| [011](011-dev-workflow-ci.md) | Dev workflow: script lint/typecheck + CI | done | rendah |
| [012](012-api-documentation.md) | Dokumentasi API untuk frontend | done | tinggi |

---

## Urutan Eksekusi

```
001 → 002 → 003 → 004 → 005 → 006 → 007 → 008 → 009 → 010 → 011
```

Tinggi (001-002) → Sedang (003-005) → Rendah (006-011)

## Referensi

- [Assessment awal](../ARCHITECTURE.md) — temuan yang jadi dasar plan ini
- [API Reference](../API_REFERENCE.md) — endpoint yang terpengaruh
- [Environment Config](../ENVIRONMENT.md) — env vars yang perlu ditambah
