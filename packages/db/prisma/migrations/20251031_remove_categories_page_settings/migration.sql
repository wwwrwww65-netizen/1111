-- Remove legacy categories page builder settings and preview data
DELETE FROM "Setting" WHERE "key" LIKE 'categoriesPage:%';

-- Optional: purge cached preview tokens stored in Redis/other layers manually if applicable.
