import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobile: { type: String, required: true },
  password: { type: String, required: true },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  paymentSettings: {
    staticQrImage: String,
    upiId: String,
    dynamicQrProvider: { type: String, enum: ['Razorpay', 'None'], default: 'None' }
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
