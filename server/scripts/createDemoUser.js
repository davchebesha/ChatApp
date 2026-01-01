const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createDemoUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nexuschat');
    console.log('📦 Connected to MongoDB');

    // Check if demo user already exists
    const existingUser = await User.findOne({ email: 'demo@nexuschat.com' });
    if (existingUser) {
      console.log('✅ Demo user already exists');
      console.log('📧 Email: demo@nexuschat.com');
      console.log('🔑 Password: demo123');
      process.exit(0);
    }

    // Create demo user
    const demoUser = await User.create({
      username: 'DemoUser',
      email: 'demo@nexuschat.com',
      password: 'demo123',
      bio: 'Demo user for testing NexusChat',
      status: 'online'
    });

    console.log('🎉 Demo user created successfully!');
    console.log('📧 Email: demo@nexuschat.com');
    console.log('🔑 Password: demo123');
    console.log('👤 Username:', demoUser.username);
    console.log('🆔 User ID:', demoUser._id);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating demo user:', error);
    process.exit(1);
  }
};

createDemoUser();