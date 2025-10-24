# DeepSeek Analyze: UI + CI fixes

- Enable DeepSeek toggle next to Analyze; persist in localStorage
- Add toasts for DeepSeek used/attempted (with reason)
- Lower quality threshold to 0.6 and include meta.reason
- CI: add forced DeepSeek smoke; accept attempt; use key when present

## Screenshots
- [ ] Admin → Products → New: Analyze with DeepSeek on (320/375/412 widths)

## Checks
- [ ] DeepSeek health passes
- [ ] Analyze forced passes in CI
- [ ] No horizontal scroll at mobile widths