# CL - Change List for tests (jam)

Purpose:
- Track test changes, notes, and steps for branch `jam`.

Template:
- Date: YYYY-MM-DD
- Author: <name>
- Context: <what is being tested>
- Changes:
  - [ ] Item 1
  - [ ] Item 2
- Notes:
  - ...
- Rollback:
  - Steps if needed

Usage:
- Append entries per test session. Keep concise and actionable.

---

Date: 2025-10-31
Author: GPT-5 Codex
Context: Retire categories page manager/designer and clean dependent surfaces
Changes:
  - [x] تم حذف مسارات `/api/admin/categories/page*` وحذف بيانات `Setting` المرتبطة بها.
  - [x] تم تحديث تطبيق mweb والوثائق لإزالة الاعتماد على مصمم صفحة الفئات.
Notes:
  - تأكد من تحديث سيناريوهات QA لإزالة أي خطوات تعتمد على المصمم القديم.
  - تشغيل `pnpm exec tsc -p packages/api/tsconfig.json` يضمن عدم وجود مراجع متبقية للكائنات المحذوفة.
Rollback:
  - في حال الحاجة لاستعادة السلوك السابق يجب إعادة نشر النسخة السابقة وإلغاء ترحيل قاعدة البيانات `20251031_remove_categories_page_settings`.
