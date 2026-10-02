import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  billId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['Cash', 'StaticQR', 'DynamicQR', 'Other'], required: true },
  status: { type: String, enum: ['Pending', 'Verified', 'Failed', 'Refunded'], default: 'Pending' },
  reference: { type: String },
  gatewayTransactionId: { type: String },
  gatewayPayload: { type: Object }
}, { timestamps: true });

paymentSchema.index({ userId: 1 });
paymentSchema.index({ billId: 1 });

export default mongoose.model('Payment', paymentSchema);
