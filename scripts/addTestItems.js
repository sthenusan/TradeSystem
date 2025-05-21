const mongoose = require('mongoose');
const User = require('../models/User');
const Item = require('../models/Item');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function addTestItems() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Create test users if they don't exist
        const user1 = await User.findOneAndUpdate(
            { email: 'thenusan1997@gmail.com' },
            {
                firstName: 'Thenusan',
                lastName: 'User1',
                email: 'thenusan1997@gmail.com',
                password: 'Thenusan@1997',
                location: 'Auckland'
            },
            { upsert: true, new: true }
        );

        const user2 = await User.findOneAndUpdate(
            { email: 'sthenusan.17@cse.mrt.ac.lk' },
            {
                firstName: 'Thenusan',
                lastName: 'User2',
                email: 'sthenusan.17@cse.mrt.ac.lk',
                password: 'Thenusan@1997',
                location: 'Wellington'
            },
            { upsert: true, new: true }
        );

        // Items for User1
        const user1Items = [
            {
                title: 'MacBook Pro 2019',
                description: 'Excellent condition MacBook Pro, 16GB RAM, 512GB SSD',
                category: 'Electronics',
                condition: 'Like New',
                location: 'Auckland',
                owner: user1._id,
                status: 'Available',
                images: ['macbook.jpg']
            },
            {
                title: 'Nike Air Max 270',
                description: 'Barely worn Nike Air Max 270, size 10',
                category: 'Clothing',
                condition: 'Like New',
                location: 'Auckland',
                owner: user1._id,
                status: 'Available',
                images: ['nike.jpg']
            },
            {
                title: 'IKEA Bookshelf',
                description: 'White IKEA Billy bookshelf, perfect condition',
                category: 'Furniture',
                condition: 'Good',
                location: 'Auckland',
                owner: user1._id,
                status: 'Available',
                images: ['bookshelf.jpg']
            },
            {
                title: 'Harry Potter Book Set',
                description: 'Complete Harry Potter book set, hardcover',
                category: 'Books',
                condition: 'Good',
                location: 'Auckland',
                owner: user1._id,
                status: 'Available',
                images: ['harrypotter.jpg']
            },
            {
                title: 'Yoga Mat',
                description: 'Premium yoga mat, used only a few times',
                category: 'Sports',
                condition: 'Like New',
                location: 'Auckland',
                owner: user1._id,
                status: 'Available',
                images: ['yoga.jpg']
            }
        ];

        // Items for User2
        const user2Items = [
            {
                title: 'Samsung Galaxy S21 Ultra',
                description: 'Samsung Galaxy S21 Ultra, 256GB, Phantom Black',
                category: 'Electronics',
                condition: 'Like New',
                location: 'Wellington',
                owner: user2._id,
                status: 'Available',
                images: ['samsung.jpg']
            },
            {
                title: 'Canon EOS 80D Camera',
                description: 'Professional DSLR camera with 18-55mm lens',
                category: 'Electronics',
                condition: 'Good',
                location: 'Wellington',
                owner: user2._id,
                status: 'Available',
                images: ['camera.jpg']
            },
            {
                title: 'Adidas Running Shoes',
                description: 'Adidas Ultraboost running shoes, size 8',
                category: 'Clothing',
                condition: 'Good',
                location: 'Wellington',
                owner: user2._id,
                status: 'Available',
                images: ['adidas.jpg']
            },
            {
                title: 'Wooden Study Desk',
                description: 'Solid wood study desk with drawers',
                category: 'Furniture',
                condition: 'Good',
                location: 'Wellington',
                owner: user2._id,
                status: 'Available',
                images: ['desk.jpg']
            },
            {
                title: 'Complete A Song of Ice and Fire Set',
                description: 'All 5 books in the series, hardcover',
                category: 'Books',
                condition: 'Like New',
                location: 'Wellington',
                owner: user2._id,
                status: 'Available',
                images: ['got.jpg']
            }
        ];

        // Delete existing items
        await Item.deleteMany({});
        console.log('Deleted existing items');

        // Add new items
        await Item.insertMany([...user1Items, ...user2Items]);
        console.log('Added test items successfully');

        console.log('\nTest users created:');
        console.log('1. User1 (thenusan1997@gmail.com / Thenu@1997)');
        console.log('2. User2 (sthenusan.17@cse.mrt.ac.lk / Thenu@1997)');

        console.log('\nItems added for User1:');
        user1Items.forEach(item => console.log(`- ${item.title}`));

        console.log('\nItems added for User2:');
        user2Items.forEach(item => console.log(`- ${item.title}`));

        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Run the script
addTestItems(); 