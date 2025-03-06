const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables

const User = require('../../models/User');

async function migratePremiumFields() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB...');

    // Find all users that don't have isPremium field
    const users = await User.find({
      $or: [
        { isPremium: { $exists: false } },
        { premiumSince: { $exists: false } },
        { premiumUntil: { $exists: false } },
        { subscriptionStatus: { $exists: false } }
      ]
    });

    console.log(`Found ${users.length} users to update...`);

    // Update each user
    for (const user of users) {
      // Add premium fields with default values
      user.isPremium = false;
      user.premiumSince = null;
      user.premiumUntil = null;
      user.subscriptionStatus = 'none';

      await user.save();
      console.log(`Updated user: ${user.email}`);
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migratePremiumFields(); 