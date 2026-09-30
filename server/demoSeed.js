import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import EventType from './src/models/EventType.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    const user = await User.findOne({ email: 'demo@eventbill.local' });
    if (!user) {
      console.log('Demo user not found. Please register first.');
      process.exit(1);
    }

    const defaultEvents = [
      { name: 'Marriage', tamilName: 'திருமணம்' },
      { name: 'Engagement', tamilName: 'நிச்சயதார்த்தம்' },
      { name: 'Reception', tamilName: 'வரவேற்பு' },
      { name: 'Housewarming', tamilName: 'வீட்டு விழா' },
      { name: 'Baby Shower', tamilName: 'குழந்தை பிறப்பு விழா' },
      { name: 'Birthday', tamilName: 'பிறந்தநாள்' },
      { name: 'Naming Ceremony', tamilName: 'பெயர் சூட்டும் விழா' },
      { name: 'Anniversary', tamilName: 'திருமண நாள் விழா' },
      { name: 'Other', tamilName: 'மற்றவை' }
    ].map(e => ({ ...e, userId: user._id, isActive: true }));

    // clear existing to avoid dupes
    await EventType.deleteMany({ userId: user._id });
    await EventType.insertMany(defaultEvents);

    console.log('Event types seeded successfully for demo user.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding:', error);
    process.exit(1);
  }
};

seed();
