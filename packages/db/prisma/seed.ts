import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
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
      name: 'Regular User',
      password: userPassword,
      role: 'USER',
      isVerified: true,
    },
  });

  console.log('✅ Users created');

  // Create categories (idempotent)
  const electronics = await (async () => {
    const existing = await prisma.category.findFirst({ where: { name: 'Electronics' } });
    if (existing) return existing;
    return prisma.category.create({
      data: {
        name: 'Electronics',
        description: 'Electronic devices and gadgets',
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
      },
    });
  })();

  const clothing = await (async () => {
    const existing = await prisma.category.findFirst({ where: { name: 'Clothing' } });
    if (existing) return existing;
    return prisma.category.create({
      data: {
        name: 'Clothing',
        description: 'Fashion and apparel',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
      },
    });
  })();

  const books = await (async () => {
    const existing = await prisma.category.findFirst({ where: { name: 'Books' } });
    if (existing) return existing;
    return prisma.category.create({
      data: {
        name: 'Books',
        description: 'Books and literature',
        image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      },
    });
  })();

  // Create subcategories
  const smartphones = await (async () => {
    const existing = await prisma.category.findFirst({ where: { name: 'Smartphones' } });
    if (existing) return existing;
    return prisma.category.create({
      data: {
        name: 'Smartphones',
        description: 'Mobile phones and accessories',
        parentId: electronics.id,
      },
    });
  })();

  const laptops = await (async () => {
    const existing = await prisma.category.findFirst({ where: { name: 'Laptops' } });
    if (existing) return existing;
    return prisma.category.create({
      data: {
        name: 'Laptops',
        description: 'Portable computers',
        parentId: electronics.id,
      },
    });
  })();

  console.log('✅ Categories created');

  // Create products (use sku as unique for upsert)
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'IPHONE15PRO' },
      update: {},
      create: {
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with advanced features and titanium design',
        price: 999.99,
        images: [
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
        ],
        categoryId: smartphones.id,
        stockQuantity: 50,
        sku: 'IPHONE15PRO',
        weight: 187,
        dimensions: '146.7 x 71.5 x 8.25 mm',
        brand: 'Apple',
        tags: ['smartphone', 'apple', 'iphone', '5g'],
      },
    }),

    prisma.product.upsert({
      where: { sku: 'MBP16M3' },
      update: {},
      create: {
        name: 'MacBook Pro 16"',
        description: 'Powerful laptop for professionals with M3 chip',
        price: 2499.99,
        images: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
        ],
        categoryId: laptops.id,
        stockQuantity: 25,
        sku: 'MBP16M3',
        weight: 2200,
        dimensions: '355.7 x 248.1 x 16.8 mm',
        brand: 'Apple',
        tags: ['laptop', 'apple', 'macbook', 'professional'],
      },
    }),

    prisma.product.upsert({
      where: { sku: 'SAMSUNGS24' },
      update: {},
      create: {
        name: 'Samsung Galaxy S24',
        description: 'Premium Android smartphone with AI features',
        price: 799.99,
        images: [
          'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400',
          'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400',
        ],
        categoryId: smartphones.id,
        stockQuantity: 40,
        sku: 'SAMSUNGS24',
        weight: 168,
        dimensions: '147.0 x 70.6 x 7.6 mm',
        brand: 'Samsung',
        tags: ['smartphone', 'samsung', 'android', '5g'],
      },
    }),

    prisma.product.upsert({
      where: { sku: 'DELLXPS13' },
      update: {},
      create: {
        name: 'Dell XPS 13',
        description: 'Ultra-thin laptop with InfinityEdge display',
        price: 1299.99,
        images: [
          'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400',
          'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400',
        ],
        categoryId: laptops.id,
        stockQuantity: 30,
        sku: 'DELLXPS13',
        weight: 1200,
        dimensions: '302 x 199 x 14.8 mm',
        brand: 'Dell',
        tags: ['laptop', 'dell', 'ultrabook', 'windows'],
      },
    }),

    prisma.product.upsert({
      where: { sku: 'NIKEAIRMAX270' },
      update: {},
      create: {
        name: 'Nike Air Max 270',
        description: 'Comfortable running shoes with Air Max technology',
        price: 150.0,
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
        ],
        categoryId: clothing.id,
        stockQuantity: 100,
        sku: 'NIKEAIRMAX270',
        weight: 320,
        dimensions: 'Various sizes',
        brand: 'Nike',
        tags: ['shoes', 'nike', 'running', 'sports'],
      },
    }),

    prisma.product.upsert({
      where: { sku: 'BOOKGATSBY' },
      update: {},
      create: {
        name: 'The Great Gatsby',
        description: 'Classic American novel by F. Scott Fitzgerald',
        price: 12.99,
        images: [
          'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
          'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
        ],
        categoryId: books.id,
        stockQuantity: 200,
        sku: 'BOOKGATSBY',
        weight: 250,
        dimensions: 'Paperback',
        brand: 'Scribner',
        tags: ['book', 'classic', 'fiction', 'literature'],
      },
    }),
  ]);

  console.log('✅ Products created');

  // Create product variants
  const productVariants = await Promise.all([
    // iPhone variants
    prisma.productVariant.createMany({
      data: [
        { productId: products[0].id, name: 'Color', value: 'Natural Titanium', price: 999.99 },
        { productId: products[0].id, name: 'Color', value: 'Blue Titanium', price: 999.99 },
        { productId: products[0].id, name: 'Storage', value: '128GB', price: 999.99 },
        { productId: products[0].id, name: 'Storage', value: '256GB', price: 1099.99 },
        { productId: products[0].id, name: 'Storage', value: '512GB', price: 1299.99 },
      ],
      skipDuplicates: true,
    }),

    // MacBook variants
    prisma.productVariant.createMany({
      data: [
        { productId: products[1].id, name: 'Color', value: 'Space Black', price: 2499.99 },
        { productId: products[1].id, name: 'Color', value: 'Silver', price: 2499.99 },
        { productId: products[1].id, name: 'Storage', value: '512GB', price: 2499.99 },
        { productId: products[1].id, name: 'Storage', value: '1TB', price: 2699.99 },
      ],
      skipDuplicates: true,
    }),

    // Nike shoes variants
    prisma.productVariant.createMany({
      data: [
        { productId: products[4].id, name: 'Size', value: 'US 7', price: 150.0 },
        { productId: products[4].id, name: 'Size', value: 'US 8', price: 150.0 },
        { productId: products[4].id, name: 'Size', value: 'US 9', price: 150.0 },
        { productId: products[4].id, name: 'Size', value: 'US 10', price: 150.0 },
        { productId: products[4].id, name: 'Color', value: 'Black', price: 150.0 },
        { productId: products[4].id, name: 'Color', value: 'White', price: 150.0 },
      ],
      skipDuplicates: true,
    }),
  ]);

  console.log('✅ Product variants created');

  // Create reviews
  const reviews = await Promise.all([
    prisma.review.createMany({
      data: [
        {
          productId: products[0].id,
          userId: user.id,
          rating: 5,
          comment: 'Amazing phone! The camera quality is outstanding.',
        },
        {
          productId: products[0].id,
          userId: admin.id,
          rating: 4,
          comment: 'Great performance, but a bit expensive.',
        },
        {
          productId: products[1].id,
          userId: user.id,
          rating: 5,
          comment: 'Perfect for my development work. Super fast!',
        },
        {
          productId: products[4].id,
          userId: user.id,
          rating: 4,
          comment: 'Very comfortable for running. Good quality.',
        },
        {
          productId: products[5].id,
          userId: admin.id,
          rating: 5,
          comment: 'A true classic. Must read for everyone.',
        },
      ],
      skipDuplicates: true,
    }),
  ]);

  console.log('✅ Reviews created');

  // Create coupons
  const coupons = await Promise.all([
    prisma.coupon.createMany({
      data: [
        {
          code: 'WELCOME10',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          minOrderAmount: 50,
          maxUses: 100,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          isActive: true,
        },
        {
          code: 'SAVE20',
          discountType: 'PERCENTAGE',
          discountValue: 20,
          minOrderAmount: 100,
          maxUses: 50,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          isActive: true,
        },
        {
          code: 'FREESHIP',
          discountType: 'FIXED',
          discountValue: 15,
          minOrderAmount: 75,
          maxUses: 200,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
          isActive: true,
        },
        {
          code: 'FLASH25',
          discountType: 'PERCENTAGE',
          discountValue: 25,
          minOrderAmount: 150,
          maxUses: 25,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          isActive: true,
        },
      ],
      skipDuplicates: true,
    }),
  ]);

  console.log('✅ Coupons created');

  // Create addresses for users
  const addresses = await Promise.all([
    prisma.address.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        street: '123 Main Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
        isDefault: true,
      },
    }),
    prisma.address.upsert({
      where: { userId: admin.id },
      update: {},
      create: {
        userId: admin.id,
        street: '456 Admin Avenue',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90210',
        country: 'USA',
        isDefault: true,
      },
    }),
  ]);

  console.log('✅ Addresses created');

  // Create carts for users
  const carts = await Promise.all([
    prisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    }),
    prisma.cart.upsert({
      where: { userId: admin.id },
      update: {},
      create: { userId: admin.id },
    }),
  ]);

  console.log('✅ Carts created');

  // Add some items to user's cart
  const cartItems = await Promise.all([
    prisma.cartItem.createMany({
      data: [
        {
          cartId: carts[0].id,
          productId: products[0].id,
          quantity: 1,
        },
        {
          cartId: carts[0].id,
          productId: products[4].id,
          quantity: 2,
        },
      ],
      skipDuplicates: true,
    }),
  ]);

  console.log('✅ Cart items created');

  // Add some items to wishlist
  const wishlistItems = await Promise.all([
    prisma.wishlistItem.createMany({
      data: [
        {
          userId: user.id,
          productId: products[1].id,
        },
        {
          userId: user.id,
          productId: products[2].id,
        },
        {
          userId: admin.id,
          productId: products[3].id,
        },
      ],
      skipDuplicates: true,
    }),
  ]);

  console.log('✅ Wishlist items created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('📋 Created:');
  console.log(`  👥 Users: ${admin.email} (admin), ${user.email} (user)`);
  console.log(`  📦 Products: ${products.length} products with variants`);
  console.log(`  🏷️ Categories: ${electronics.name}, ${clothing.name}, ${books.name}`);
  console.log(`  ⭐ Reviews: ${reviews[0].count} reviews`);
  console.log(`  🎫 Coupons: ${coupons[0].count} active coupons`);
  console.log(`  🛒 Carts: ${carts.length} user carts`);
  console.log(`  ❤️ Wishlist: ${wishlistItems[0].count} wishlist items`);
  console.log('');
  console.log('🔑 Login credentials:');
  console.log(`  Admin: ${admin.email} / admin123`);
  console.log(`  User: ${user.email} / user123`);
  console.log('');
  console.log('🎫 Available coupons:');
  console.log('  WELCOME10 - 10% off (min $50)');
  console.log('  SAVE20 - 20% off (min $100)');
  console.log('  FREESHIP - $15 off shipping (min $75)');
  console.log('  FLASH25 - 25% off (min $150)');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });