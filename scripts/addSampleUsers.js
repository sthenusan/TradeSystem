const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function addSampleUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        const passwordHash = await bcrypt.hash('Thenu@1197', 10);

        const users = [
            {
                firstName: 'Thenusan',
                lastName: 'Sivananthan',
                email: 'sthenusan.17@cse.mrt.ac.lk',
                password: passwordHash,
                location: 'Colombo'
            },
            {
                firstName: 'Thenusan',
                lastName: 'Nimal',
                email: 'thenusan1997@gmail.com',
                password: passwordHash,
                location: 'Jaffna'
            }
        ];

        for (const user of users) {
            const existing = await User.findOne({ email: user.email });
            if (!existing) {
                await User.create(user);
                console.log(`Created user: ${user.email}`);
            } else {
                console.log(`User already exists: ${user.email}`);
            }
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
    }
}

addSampleUsers(); 