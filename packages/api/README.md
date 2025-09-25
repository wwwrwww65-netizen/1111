API - Analyze Products

Overview
- Endpoint: POST /api/admin/products/analyze
- Input: { text?: string; images?: Array<string | { dataUrl: string }> }
- Output: { analyzed: { [field]: { value: any, source: 'rules' | 'vision', confidence: number } } }

Rules and Constraints
- Text cleaning: remove emojis/marketing noise, normalize whitespace, keep numerals, and convert Arabic-Indic digits to Latin for parsing.
- Name: <type> <attr> من <material> — <feature>, max 60 chars, feminine agreement (نسائية …).
- Prices: prefer lines containing الشمال/قديم/مشابه; ignore unrelated numbers (e.g., 2 الوان). Support decimals.
- Sizes: if weight range exists → فري سايز (A–B كجم). Also supports XL–XS tokens.
- Colors: normalize English to Arabic canonical names and deduplicate.
- SEO: filter stopwords/noise; cap at 6 keywords; add synonyms for materials (e.g., صوف → شتوي/دافئ).
- Limits: ≤ 6 images/request, ≤ 2MB per image. Timeout budget ~12–20s.

Debug
- Set ANALYZE_DEBUG=1 to enable minimal debug logs in the server output.

