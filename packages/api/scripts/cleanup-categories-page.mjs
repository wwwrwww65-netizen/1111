#!/usr/bin/env node
// Cleanup script: deletes Categories Page settings keys from the database

import { db } from '@repo/db';

async function main(){
  try {
    const before = await db.setting.count({ where: { key: { startsWith: 'categoriesPage:' } } });
    const res = await db.setting.deleteMany({ where: { key: { startsWith: 'categoriesPage:' } } });
    const after = await db.setting.count({ where: { key: { startsWith: 'categoriesPage:' } } });
    console.log(JSON.stringify({ ok: true, deleted: res.count, before, after }, null, 2));
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: err?.message || String(err) }));
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}

main();


