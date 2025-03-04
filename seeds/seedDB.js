import mongoose from "mongoose";
import Product from "../model/productModel.js";
import 'dotenv/config';

// 'mongodb://127.0.0.1:27017/MERN1'
const dbURL = process.env.DB_URL;
mongoose.connect(dbURL,
    {
        family: 4, // Force IPv4
        serverSelectionTimeoutMS: 30000,
    }
)
    .then(() => console.log('MERN DB connected.'))
    .catch(err => console.log('DB connection error...', err));

const categories = ['Electronics', 'Fashion', 'Beauty', 'Home', 'Books', 'Grocery', 'Art & Craft']
const brand = ['Adidas', 'P&G', 'Dell', 'Seiko', 'Sony', 'LG', 'Everest'];
const images = ['https://m.media-amazon.com/images/I/51brdXeugJL._SX679_.jpg', 'https://m.media-amazon.com/images/I/61++T836jiL._SL1500_.jpg', 'https://m.media-amazon.com/images/I/61QC7BpBq7L._SL1500_.jpg',
    'https://m.media-amazon.com/images/I/71Kyp-Z7JOL._SL1500_.jpg', 'https://m.media-amazon.com/images/I/81XbFaNe2LL._SL1500_.jpg', 'https://m.media-amazon.com/images/I/51HrJO56iFL._SL1500_.jpg',
    'https://m.media-amazon.com/images/I/71l2-gWOnpL._SL1500_.jpg', 'https://m.media-amazon.com/images/I/71swO3GTDwL._SL1500_.jpg', 'https://m.media-amazon.com/images/I/51NKPZx0a6L._SL1500_.jpg',
    'https://m.media-amazon.com/images/I/71iKNJ6rVIL._SL1000_.jpg', 'https://m.media-amazon.com/images/I/71D-9au0J1L._SX695_.jpg'
]

const seedData = async () => {
    try {
        await Product.deleteMany({});
        for (let i = 0; i < 10; i++) {
            const p = new Product({
                title: `Product-${i + 1}`,
                price: Math.ceil(Math.random() * 200),
                category: categories[Math.floor(Math.random() * categories.length)],
                stock: Math.ceil(Math.random() * 50),
                brand: brand[Math.floor(Math.random() * brand.length)],
                image: images[Math.floor(Math.random() * images.length)],
                createdAt: new Date(),
                updatedAt: ''
            });
            await p.save();
        }
    }
    catch (err) { console.log(err) }

}

seedData().then(() => mongoose.connection.close())
    .catch(err => console.log('Closing error:', err));
