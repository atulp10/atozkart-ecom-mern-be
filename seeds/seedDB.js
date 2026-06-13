import 'dotenv/config';
import Product from '../model/productModel.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';

const categories = ['Electronics', 'Fashion', 'Beauty', 'Home', 'Books', 'Grocery', 'Art & Craft'];
const brands = ['Adidas', 'P&G', 'Dell', 'Seiko', 'Sony', 'LG', 'Everest'];
const images = [
  'https://m.media-amazon.com/images/I/51brdXeugJL._SX679_.jpg',
  'https://m.media-amazon.com/images/I/61++T836jiL._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/61QC7BpBq7L._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/71Kyp-Z7JOL._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/81XbFaNe2LL._SL1500_.jpg',
];

async function seedData() {
  await connectDatabase();
  await Product.deleteMany({});
  await Product.insertMany(Array.from({ length: 10 }, (_, index) => ({
    title: `Product-${index + 1}`,
    price: Math.ceil(Math.random() * 200),
    category: categories[Math.floor(Math.random() * categories.length)],
    stock: Math.ceil(Math.random() * 50),
    brand: brands[Math.floor(Math.random() * brands.length)],
    image: images[Math.floor(Math.random() * images.length)],
    description: 'Seed product for local development.',
  })));
}

try {
  await seedData();
  console.log('Seeded 10 products.');
} catch (error) {
  console.error('Database seed failed:', error.message);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
