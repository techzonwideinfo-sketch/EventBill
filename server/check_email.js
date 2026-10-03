import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const users = await mongoose.connection.collection('users').find({ 
    email: { $regex: 'v.hari2812@gmail.com', $options: 'i' } 
  }).toArray();
  
  console.log('Users found:', users.map(u => `'${u.email}'`));
  process.exit(0);
}).catch(console.error);
