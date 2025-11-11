# Analytics Privacy & Compliance

- RBAC: All analytics endpoints require `analytics.read` (enforced).
- Rate limiting: Recent events endpoint limited to 60 req/min per user/IP.
- PII:
  - IP addresses are hashed in sessions; avoid exposing raw IPs in UI by default.
  - Show sensitive fields only to privileged roles.
- Consent:
  - Respect DNT and implement consent banner prior to non-essential tracking.
- Data retention:
  - Define retention windows for raw events vs. aggregates (e.g., 90 days raw, 2 years aggregates).
- Exports:
  - CSV exports available. Ensure access is restricted and logged.
- Logs/Audit:
  - Record access to sensitive analytics and exports via audit logs.


