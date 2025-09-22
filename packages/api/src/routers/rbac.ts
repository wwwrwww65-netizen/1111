import { Router } from 'express';
import { db } from '../db/ensure';

const r = Router();

r.get('/permissions', async (_req, res) => {
  try { const permissions = await db.permission.findMany({ orderBy: { key: 'asc' } }); res.json({ permissions }); }
  catch { res.status(500).json({ error: 'Failed to list permissions' }); }
});

r.get('/roles', async (_req, res) => {
  try { const roles = await db.role.findMany({ include: { permissions: { include: { permission: true } } }, orderBy: { name: 'asc' } });
    res.json({ roles: roles.map((r) => ({ id: r.id, name: r.name, permissions: r.permissions.map((p) => ({ id: p.permission.id, key: p.permission.key })) })) });
  } catch { res.status(500).json({ error: 'Failed to list roles' }); }
});

r.post('/roles', async (req, res) => {
  try { const name = String(req.body?.name || '').trim(); if (!name) return res.status(400).json({ error: 'name required' });
    const role = await db.role.create({ data: { name } }); res.json({ role }); }
  catch { res.status(500).json({ error: 'Failed to create role' }); }
});

r.post('/roles/:id/permissions', async (req, res) => {
  try {
    const roleId = String(req.params.id);
    const permissionIds: string[] = Array.isArray(req.body?.permissionIds) ? req.body.permissionIds : [];
    // Replace permissions set
    await db.rolePermission.deleteMany({ where: { roleId } });
    await db.rolePermission.createMany({ data: permissionIds.map((pid) => ({ roleId, permissionId: pid })) });
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed to update role permissions' }); }
});

export default r;