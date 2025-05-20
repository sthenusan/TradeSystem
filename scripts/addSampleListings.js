const mongoose = require('mongoose');
const User = require('../models/User');
const Item = require('../models/Item');
require('dotenv').config();

const sampleItems = [
    {
        title: "iPhone 12 Pro",
        description: "Excellent condition iPhone 12 Pro, 128GB, Pacific Blue. Comes with original box and accessories.",
        category: "Electronics",
        condition: "Like New",
        location: "Colombo",
        images: ["iphone12.jpg"]
    },
    {
        title: "Samsung 4K Smart TV",
        description: "55-inch Samsung 4K Smart TV, 2022 model. Perfect condition, includes wall mount.",
        category: "Electronics",
        condition: "Good",
        location: "Kandy",
        images: ["samsungtv.jpg"]
    },
    {
        title: "Nike Air Max",
        description: "Nike Air Max 270, Size 10, Black/White. Worn only a few times.",
        category: "Clothing",
        condition: "Good",
        location: "Galle",
        images: ["nikeairmax.jpg"]
    },
    {
        title: "Harry Potter Book Set",
        description: "Complete Harry Potter book series, hardcover edition. Excellent condition.",
        category: "Books",
        condition: "Like New",
        location: "Colombo",
        images: ["harrypotter.jpg"]
    },
    {
        title: "Gaming Laptop",
        description: "ASUS ROG Gaming Laptop, RTX 3060, 16GB RAM, 512GB SSD. Perfect for gaming and work.",
        category: "Electronics",
        condition: "Good",
        location: "Jaffna",
        images: ["gaminglaptop.jpg"]
    }
];

async function addSampleListings() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Find users
        const user1 = await User.findOne({ email: 'thenusan1997@gmail.com' });
        const user2 = await User.findOne({ email: 'sthenusan.17@cse.mrt.ac.lk' });

        if (!user1 || !user2) {
            console.error('One or both users not found');
            return;
        }

        // Add items for first user
        for (let i = 0; i < 3; i++) {
            const item = new Item({
                ...sampleItems[i],
                owner: user1._id,
                status: 'Available'
            });
            await item.save();
            console.log(`Added item for ${user1.email}: ${item.title}`);
        }

        // Add items for second user
        for (let i = 3; i < sampleItems.length; i++) {
            const item = new Item({
                ...sampleItems[i],
                owner: user2._id,
                status: 'Available'
            });
            await item.save();
            console.log(`Added item for ${user2.email}: ${item.title}`);
        }

        console.log('Sample listings added successfully');
    } catch (error) {
        console.error('Error adding sample listings:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the script
addSampleListings(); 