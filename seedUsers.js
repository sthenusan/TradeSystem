require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/barter', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('✅ MongoDB connected');

  const users = [
    {
      name: 'Demo Trader',
      email: 'demo@example.com',
      password: 'password123'
    },
    {
      name: 'Test Trader 2',
      email: 'test2@example.com',
      password: 'password123'
    }
  ];

  for (let user of users) {
    const existing = await User.findOne({ email: user.email });
    if (existing) {
      console.log(`⚠️  User already exists: ${user.email}`);
      continue;
    }

    const hashed = await bcrypt.hash(user.password, 10);
    await User.create({ name: user.name, email: user.email, password: hashed });
    console.log(`✅ Created: ${user.email}`);
  }

  mongoose.connection.close();
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});
