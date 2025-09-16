// Upsert admin user using Prisma and bcrypt
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const email = process.env.ADMIN_EMAIL || "admin@example.com";
const password = process.env.ADMIN_PASSWORD || "admin123";
const name = process.env.ADMIN_NAME || "Admin";

async function main() {
  const prisma = new PrismaClient();
  const hash = bcrypt.hashSync(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { password: hash, role: "ADMIN", name },
    create: { email, password: hash, role: "ADMIN", name },
  });
  await prisma.$disconnect();
  console.log(`admin upserted: ${email}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

