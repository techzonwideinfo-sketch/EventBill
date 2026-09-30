import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String }
}, { timestamps: true });

customerSchema.index({ userId: 1 });

export default mongoose.model('Customer', customerSchema);
