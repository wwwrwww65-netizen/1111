import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      isVerified: true,
    },
  });

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      name: 'Regular User',
      role: 'USER',
      isVerified: true,
    },
  });

  // Create categories
  const electronics = await prisma.category.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: { name: 'Electronics' },
  });

  const clothing = await prisma.category.upsert({
    where: { name: 'Clothing' },
    update: {},
    create: { name: 'Clothing' },
  });

  const books = await prisma.category.upsert({
    where: { name: 'Books' },
    update: {},
    create: { name: 'Books' },
  });

  // Create products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { name: 'iPhone 15 Pro' },
      update: {},
      create: {
        name: 'iPhone 15 Pro',
        description: 'The latest iPhone with advanced features and powerful performance.',
        price: 999.99,
        stock: 50,
        sku: 'IPHONE-15-PRO',
        weight: 0.187,
        dimensions: '6.1 x 2.8 x 0.3 inches',
        images: [
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500',
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500',
        ],
        categories: {
          connect: [{ id: electronics.id }],
        },
      },
    }),

    prisma.product.upsert({
      where: { name: 'MacBook Air M2' },
      update: {},
      create: {
        name: 'MacBook Air M2',
        description: 'Ultra-thin laptop with M2 chip for incredible performance.',
        price: 1199.99,
        stock: 30,
        sku: 'MACBOOK-AIR-M2',
        weight: 2.7,
        dimensions: '11.97 x 8.46 x 0.44 inches',
        images: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
        ],
        categories: {
          connect: [{ id: electronics.id }],
        },
      },
    }),

    prisma.product.upsert({
      where: { name: 'Nike Air Max 270' },
      update: {},
      create: {
        name: 'Nike Air Max 270',
        description: 'Comfortable running shoes with Air Max technology.',
        price: 150.00,
        stock: 100,
        sku: 'NIKE-AIR-MAX-270',
        weight: 0.8,
        dimensions: '12 x 8 x 4 inches',
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
        ],
        categories: {
          connect: [{ id: clothing.id }],
        },
      },
    }),

    prisma.product.upsert({
      where: { name: 'The Great Gatsby' },
      update: {},
      create: {
        name: 'The Great Gatsby',
        description: 'Classic American novel by F. Scott Fitzgerald.',
        price: 12.99,
        stock: 200,
        sku: 'BOOK-GATSBY',
        weight: 0.5,
        dimensions: '8 x 5.5 x 0.8 inches',
        images: [
          'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500',
          'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500',
        ],
        categories: {
          connect: [{ id: books.id }],
        },
      },
    }),
  ]);

  // Create product variants
  await Promise.all([
    prisma.productVariant.create({
      data: {
        productId: products[0].id, // iPhone
        name: 'Color',
        value: 'Space Black',
        stock: 25,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: products[0].id, // iPhone
        name: 'Color',
        value: 'Silver',
        stock: 25,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: products[2].id, // Nike shoes
        name: 'Size',
        value: 'US 10',
        stock: 20,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: products[2].id, // Nike shoes
        name: 'Size',
        value: 'US 11',
        stock: 20,
      },
    }),
  ]);

  // Create reviews
  await Promise.all([
    prisma.review.create({
      data: {
        productId: products[0].id,
        userId: user.id,
        rating: 5,
        comment: 'Amazing phone! The camera quality is outstanding.',
      },
    }),
    prisma.review.create({
      data: {
        productId: products[0].id,
        userId: admin.id,
        rating: 4,
        comment: 'Great performance, but a bit expensive.',
      },
    }),
    prisma.review.create({
      data: {
        productId: products[1].id,
        userId: user.id,
        rating: 5,
        comment: 'Perfect for work and entertainment!',
      },
    }),
  ]);

  // Create carts for users
  await Promise.all([
    prisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
      },
    }),
    prisma.cart.upsert({
      where: { userId: admin.id },
      update: {},
      create: {
        userId: admin.id,
      },
    }),
  ]);

  console.log('✅ Database seeded successfully!');
  console.log(`👤 Created users: ${admin.email}, ${user.email}`);
  console.log(`📦 Created ${products.length} products`);
  console.log(`📚 Created ${await prisma.category.count()} categories`);
  console.log(`⭐ Created ${await prisma.review.count()} reviews`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });