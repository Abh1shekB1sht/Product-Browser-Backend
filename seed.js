const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Product = require('./model/Product.js');

dotenv.config();

const categories = [
  'Electronics',
  'Books',
  'Fashion',
  'Shoes',
  'Sports',
  'Home',
  'Kitchen',
  'Gaming',
  'Health',
  'Beauty',
];

const randomCategory = () => {
    return categories[Math.floor(Math.random() * categories.length)];
}

const randomPrice = () => {
    return Math.floor(Math.random() * 10000) + 1;
}

const generateProduct = (count) => {
    let products = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
        products.push({
            unique_id: `PROD-${now}-${i}-${Math.floor(Math.random() * 1000)}`,
            name: `Product ${i + 1}`,
            category: randomCategory(),
            price: randomPrice(),
            created_at: new Date(now - Math.floor(Math.random() * 1000000000)),
            updated_at: new Date(now - Math.floor(Math.random() * 1000000000)),
        })
    }

    return products;
}

const seedProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        await Product.deleteMany({});
        console.log("Deleted existing products");

        const TOTAL = 2 * 100000;
        const BATCH = 5000;

        for (let i = 0; i < TOTAL; i += BATCH) {
            const products = generateProduct(BATCH);
            await Product.insertMany(products, { ordered: false});
            console.log(`Inserted ${i + BATCH} products`);
        }

        console.log("Seeding completed");
        process.exit();
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

seedProducts();