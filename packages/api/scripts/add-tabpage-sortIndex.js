const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
	// Ensure TabPage.sortIndex exists and is defaulted to 0 without destructive changes
	await prisma.$executeRawUnsafe(`
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'TabPage'
          AND column_name = 'sortIndex'
    ) THEN
        ALTER TABLE "public"."TabPage" ADD COLUMN "sortIndex" INTEGER DEFAULT 0;
    END IF;
    UPDATE "public"."TabPage" SET "sortIndex" = COALESCE("sortIndex", 0);
END
$$;
`);
	console.log('Ensured TabPage.sortIndex exists with default 0.');
}

main()
	.catch((err) => {
		console.error(err);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});


