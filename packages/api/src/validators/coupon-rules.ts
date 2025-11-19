import { z } from 'zod';

export const CouponScheduleSchema = z.object({
	from: z.string().datetime().nullable().optional(),
	to: z.string().datetime().nullable().optional(),
}).partial().optional();

export const CouponAudienceSchema = z.union([
	z.object({ target: z.enum(['all','users','new']).optional() }).partial(),
	z.enum(['all','users','new']),
	z.string()
]).optional();

export const CouponRulesSchema = z.object({
	enabled: z.boolean().optional(),
	min: z.number().nullable().optional(),
	max: z.number().nullable().optional(),
	includes: z.array(z.string()).optional(),
	excludes: z.array(z.string()).optional(),
	schedule: CouponScheduleSchema,
	limitPerUser: z.number().int().nullable().optional(),
	paymentMethods: z.array(z.string()).nullable().optional(),
	matchMode: z.enum(['all','any']).optional(),
	// metadata/UX fields
	title: z.string().optional(),
	kind: z.string().optional(),
	audience: CouponAudienceSchema,
}).strict();

export type CouponRules = z.infer<typeof CouponRulesSchema>;

export function normalizeAudience(aud: unknown): 'all'|'users'|'new'|'' {
	try{
		if (typeof aud === 'string') return normalizeAudienceString(aud);
		if (aud && typeof aud === 'object' && 'target' in (aud as any)) {
			return normalizeAudienceString((aud as any).target);
		}
		return '';
	}catch{ return ''; }
}

function normalizeAudienceString(v: unknown): 'all'|'users'|'new'|'' {
	const s = String(v||'').trim().toLowerCase();
	if (!s) return '';
	if (s === 'all' || s === '*' || s.includes('الجميع')) return 'all';
	if (s === 'users' || s === 'registered' || s === 'existing' || s.includes('مسجل')) return 'users';
	if (s === 'new' || s === 'new_users' || s === 'first' || s === 'first_order' || s.includes('الجدد') || s.includes('الجديدة')) return 'new';
	return '';
}


