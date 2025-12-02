const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main(){
	await prisma.$executeRawUnsafe(`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='TabPageStat' AND column_name='blocks'
  ) THEN
    ALTER TABLE "public"."TabPageStat" ADD COLUMN "blocks" JSONB NULL;
  END IF;
END$$;`);
	console.log('Ensured TabPageStat.blocks exists');
}

main().catch(e=>{ console.error(e); process.exit(1); }).finally(()=> prisma.$disconnect());


