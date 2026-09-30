import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Bill from '../models/Bill.js';
import { calculateBillTotals } from '../utils/calculations.js';
import crypto from 'crypto';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Clear old data
    await User.deleteMany({ email: 'demo@eventbill.local' });
    
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('Demo@12345', salt);
    
    const user = await User.create({
      name: 'Demo Admin',
      email: 'demo@eventbill.local',
      mobile: '9876543210',
      password
    });
    
    await Customer.deleteMany({ userId: user._id });
    await Bill.deleteMany({ userId: user._id });
    
    const customersData = [
      { name: 'Raj Kumar', phone: '9000000001', address: 'Chennai' },
      { name: 'Priya', phone: '9000000002', address: 'Madurai' },
      { name: 'Suresh', phone: '9000000003', address: 'Coimbatore' },
      { name: 'Anitha', phone: '9000000004', address: 'Trichy' },
      { name: 'Manoj', phone: '9000000005', address: 'Salem' }
    ];
    
    const customers = await Customer.insertMany(customersData.map(c => ({ ...c, userId: user._id })));
    
    const billsData = [
      {
        billNumber: 'EVT-0001', customerId: customers[0]._id, customerSnapshot: { name: 'Raj Kumar', phone: '9000000001' },
        eventType: 'Marriage', eventDate: new Date('2026-10-15'), venue: 'Grand Mahal, Chennai',
        items: [
          { service: 'Decoration', quantity: 1, rate: 50000 },
          { service: 'Photography', quantity: 1, rate: 30000 },
          { service: 'Catering', quantity: 1, rate: 75000 },
          { service: 'Stage', quantity: 1, rate: 15000 }
        ],
        advancePaid: 70000
      },
      {
        billNumber: 'EVT-0002', customerId: customers[1]._id, customerSnapshot: { name: 'Priya', phone: '9000000002' },
        eventType: 'Baby Shower', eventDate: new Date('2026-11-20'), venue: 'Home',
        items: [
          { service: 'Decoration', quantity: 1, rate: 15000 },
          { service: 'Catering', quantity: 1, rate: 25000 }
        ],
        advancePaid: 40000 // Fully paid
      }
    ];

    const eventTypesData = [
      { name: 'Marriage', tamilName: 'திருமணம்' },
      { name: 'Engagement', tamilName: 'நிச்சயதார்த்தம்' },
      { name: 'Reception', tamilName: 'வரவேற்பு' },
      { name: 'Birthday', tamilName: 'பிறந்தநாள்' },
      { name: 'Baby Shower', tamilName: 'வளைகாப்பு' },
      { name: 'House Warming', tamilName: 'புதுமனை புகுவிழா' },
      { name: 'Naming Ceremony', tamilName: 'பெயர் சூட்டு விழா' },
      { name: 'Anniversary', tamilName: 'திருமண நாள் விழா' },
      { name: 'Ear Piercing Ceremony', tamilName: 'காதணி விழா' },
      { name: 'Puberty Ceremony', tamilName: 'மஞ்சள் நீராட்டு விழா' },
      { name: 'Corporate Event', tamilName: 'நிறுவன நிகழ்வு' },
      { name: 'Other', tamilName: 'மற்றவை' }
    ];

    await import('../models/EventType.js').then(async (EventTypeModule) => {
      const EventType = EventTypeModule.default;
      await EventType.deleteMany({ userId: user._id });
      await EventType.insertMany(eventTypesData.map(e => ({ ...e, userId: user._id })));
    });
    
    for (const b of billsData) {
      const totals = calculateBillTotals(b.items, 0, 0, 0, b.advancePaid, 0);
      await Bill.create({ ...b, ...totals, userId: user._id, publicToken: crypto.randomBytes(16).toString('hex') });
    }
    
    console.log('Data Seeded Successfully');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
seedData();
