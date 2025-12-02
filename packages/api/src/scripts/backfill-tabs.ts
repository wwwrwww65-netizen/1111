import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main(){
	// Example backfill: migrate legacy Setting key 'legacy:tabs' to TabPage/Version
	const legacy = await prisma.setting.findUnique({ where: { key: 'legacy:tabs' } }).catch(()=>null) as any
	if (!legacy?.value) { console.log('No legacy tabs found'); return }
	const items: Array<any> = Array.isArray(legacy.value?.tabs)? legacy.value.tabs : []
	for (const it of items){
		const slug = String(it.slug||'').trim().toLowerCase()
		if (!slug) continue
		const exists = await prisma.tabPage.findUnique({ where: { slug } }).catch(()=>null)
		if (exists) continue
		const page = await prisma.tabPage.create({ data: { slug, label: it.label||slug, device: (it.device||'MOBILE'), status: 'DRAFT' as any } })
		await prisma.tabPageVersion.create({ data: { tabPageId: page.id, version: 1, title: it.title||null, content: it.content||{ sections: [] } } })
		console.log('Backfilled', slug)
	}
}

main().catch((e)=>{ console.error(e); process.exit(1) }).finally(()=> prisma.$disconnect())


