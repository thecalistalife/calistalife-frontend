import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product, Collection, User } from '@/models';

// Load environment variables
dotenv.config();

// Sample collections data
const collectionsData = [
  {
    name: 'Urban Essentials',
    slug: 'urban-essentials',
    description: 'Minimalist streetwear for the modern urbanite',
    image: '/uploads/collections/urban-essentials.jpg',
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'Night Collection',
    slug: 'night-collection',
    description: 'Bold pieces for evening adventures',
    image: '/uploads/collections/night-collection.jpg',
    isActive: true,
    sortOrder: 2
  },
  {
    name: 'Weekend Vibes',
    slug: 'weekend-vibes',
    description: 'Comfortable luxury for your downtime',
    image: '/uploads/collections/weekend-vibes.jpg',
    isActive: true,
    sortOrder: 3
  },
  {
    name: 'Summer 2024',
    slug: 'summer-2024',
    description: 'Lightweight pieces for the warmer months',
    image: '/uploads/collections/summer-2024.jpg',
    isActive: true,
    sortOrder: 4
  }
];

// Sample products data
const productsData = [
  {
    name: 'Minimal Tee',
    brand: 'TheCalista',
    price: 49.99,
    images: ['/uploads/products/minimal-tee-1.jpg', '/uploads/products/minimal-tee-2.jpg'],
    description: 'A perfect blend of comfort and style. Made from 100% organic cotton with a relaxed fit that\'s perfect for everyday wear. Features a clean, minimalist design that pairs well with any outfit.',
    shortDescription: 'Comfortable organic cotton tee with minimalist design',
    category: 'T-Shirts',
    collection: 'Urban Essentials',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'White', 'Gray', 'Navy'],
    tags: ['minimalist', 'organic', 'everyday', 'cotton'],
    inStock: true,
    stockQuantity: 100,
    rating: 4.8,
    reviews: 156,
    isNew: true,
    isFeatured: true
  },
  {
    name: 'Monochrome Hoodie',
    brand: 'TheCalista',
    price: 89.99,
    images: ['/uploads/products/monochrome-hoodie-1.jpg', '/uploads/products/monochrome-hoodie-2.jpg'],
    description: 'Premium hoodie with a modern silhouette. Features a kangaroo pocket and adjustable drawstring hood. Made from a cotton-polyester blend for durability and comfort.',
    shortDescription: 'Premium hoodie with modern silhouette and kangaroo pocket',
    category: 'Hoodies',
    collection: 'Night Collection',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'Gray', 'White'],
    tags: ['premium', 'comfort', 'streetwear', 'hoodie'],
    inStock: true,
    stockQuantity: 75,
    rating: 4.6,
    reviews: 89,
    isBestSeller: true,
    isFeatured: true
  },
  {
    name: 'Blurred Joggers',
    brand: 'TheCalista',
    price: 79.99,
    originalPrice: 99.99,
    images: ['/uploads/products/blurred-joggers-1.jpg', '/uploads/products/blurred-joggers-2.jpg'],
    description: 'Comfortable joggers with a tapered fit. Perfect for both lounging and active wear. Features an elastic waistband with drawstring and side pockets.',
    shortDescription: 'Comfortable tapered joggers perfect for active wear',
    category: 'Pants',
    collection: 'Weekend Vibes',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Black', 'Navy', 'Olive', 'Gray'],
    tags: ['comfort', 'athletic', 'versatile', 'joggers'],
    inStock: true,
    stockQuantity: 60,
    rating: 4.7,
    reviews: 234,
    isOnSale: true,
    isFeatured: true
  },
  {
    name: 'Bokeh Jacket',
    brand: 'TheCalista',
    price: 129.99,
    images: ['/uploads/products/bokeh-jacket-1.jpg', '/uploads/products/bokeh-jacket-2.jpg'],
    description: 'Lightweight jacket with water-resistant coating. Features multiple pockets and adjustable cuffs. Perfect for transitional weather and urban exploration.',
    shortDescription: 'Lightweight water-resistant jacket with multiple pockets',
    category: 'Outerwear',
    collection: 'Urban Essentials',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'Navy', 'Olive'],
    tags: ['waterproof', 'functional', 'modern', 'jacket'],
    inStock: true,
    stockQuantity: 40,
    rating: 4.9,
    reviews: 67,
    isNew: true,
    isFeatured: true
  },
  {
    name: 'Gradient Sweater',
    brand: 'TheCalista',
    price: 99.99,
    images: ['/uploads/products/gradient-sweater-1.jpg', '/uploads/products/gradient-sweater-2.jpg'],
    description: 'Soft knit sweater with subtle gradient design. Perfect for layering or wearing alone. Made from a premium wool blend for warmth and comfort.',
    shortDescription: 'Soft knit sweater with subtle gradient design',
    category: 'Sweaters',
    collection: 'Weekend Vibes',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Gray', 'Navy', 'Cream', 'Black'],
    tags: ['knit', 'gradient', 'cozy', 'wool'],
    inStock: true,
    stockQuantity: 85,
    rating: 4.5,
    reviews: 123
  },
  {
    name: 'Vintage Denim',
    brand: 'TheCalista',
    price: 89.99,
    images: ['/uploads/products/vintage-denim-1.jpg', '/uploads/products/vintage-denim-2.jpg'],
    description: 'Classic straight-leg denim with vintage wash. Made from premium denim with stretch for comfort. Features traditional five-pocket styling.',
    shortDescription: 'Classic straight-leg denim with vintage wash',
    category: 'Jeans',
    collection: 'Summer 2024',
    sizes: ['26', '28', '30', '32', '34', '36', '38'],
    colors: ['Light Blue', 'Dark Blue', 'Black'],
    tags: ['denim', 'vintage', 'classic', 'straight-leg'],
    inStock: true,
    stockQuantity: 90,
    rating: 4.4,
    reviews: 178
  },
  {
    name: 'Studio T-Shirt',
    brand: 'TheCalista',
    price: 39.99,
    images: ['/uploads/products/studio-tshirt-1.jpg', '/uploads/products/studio-tshirt-2.jpg'],
    description: 'Graphic tee with studio-inspired design. Soft cotton blend with a regular fit. Features original artwork printed with eco-friendly inks.',
    shortDescription: 'Graphic tee with studio-inspired design',
    category: 'T-Shirts',
    collection: 'Urban Essentials',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Black', 'White'],
    tags: ['graphic', 'cotton', 'artistic', 'eco-friendly'],
    inStock: false,
    stockQuantity: 0,
    rating: 4.3,
    reviews: 92
  },
  {
    name: 'Abstract Print Shorts',
    brand: 'TheCalista',
    price: 59.99,
    images: ['/uploads/products/abstract-shorts-1.jpg', '/uploads/products/abstract-shorts-2.jpg'],
    description: 'Comfortable shorts with abstract print. Perfect for summer days and casual outings. Features an elastic waistband and side pockets.',
    shortDescription: 'Comfortable shorts with abstract print',
    category: 'Shorts',
    collection: 'Summer 2024',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Multi', 'Black', 'Navy'],
    tags: ['abstract', 'summer', 'casual', 'comfortable'],
    inStock: true,
    stockQuantity: 55,
    rating: 4.6,
    reviews: 45,
    isBestSeller: true
  },
  {
    name: 'Essential Polo',
    brand: 'TheCalista',
    price: 69.99,
    images: ['/uploads/products/essential-polo-1.jpg', '/uploads/products/essential-polo-2.jpg'],
    description: 'Classic polo shirt with modern updates. Made from premium pique cotton with a comfortable fit. Features a three-button placket and ribbed collar.',
    shortDescription: 'Classic polo shirt with modern updates',
    category: 'T-Shirts',
    collection: 'Urban Essentials',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Navy', 'White', 'Black', 'Gray'],
    tags: ['polo', 'classic', 'premium', 'cotton'],
    inStock: true,
    stockQuantity: 70,
    rating: 4.5,
    reviews: 98,
    isFeatured: true
  },
  {
    name: 'Tech Shorts',
    brand: 'TheCalista',
    price: 79.99,
    images: ['/uploads/products/tech-shorts-1.jpg', '/uploads/products/tech-shorts-2.jpg'],
    description: 'High-performance shorts with moisture-wicking technology. Perfect for workouts and active lifestyle. Features zip pockets and reflective details.',
    shortDescription: 'High-performance shorts with moisture-wicking technology',
    category: 'Shorts',
    collection: 'Summer 2024',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Black', 'Navy', 'Gray'],
    tags: ['tech', 'performance', 'athletic', 'moisture-wicking'],
    inStock: true,
    stockQuantity: 45,
    rating: 4.7,
    reviews: 76,
    isNew: true
  }
];

// Sample admin user
const adminUser = {
  name: 'Admin User',
  email: 'admin@thecalista.com',
  password: 'admin123456',
  role: 'admin'
};

// Connect to database
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thecalista';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await Product.deleteMany({});
    await Collection.deleteMany({});
    await User.deleteMany({ role: 'admin' });

    console.log('🗑️  Cleared existing data');

    // Seed collections
    const collections = await Collection.insertMany(collectionsData);
    console.log(`✅ Seeded ${collections.length} collections`);

    // Seed products
    const products = await Product.insertMany(productsData);
    console.log(`✅ Seeded ${products.length} products`);

    // Create admin user
    const admin = await User.create(adminUser);
    console.log(`✅ Created admin user: ${admin.email}`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   • ${collections.length} collections`);
    console.log(`   • ${products.length} products`);
    console.log('   • 1 admin user');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await seedDatabase();
    
    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main();
}