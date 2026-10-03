import mongoose from 'mongoose';

const eventServiceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventType', required: true },
  name: { type: String, required: true },
  description: { type: String },
  defaultUnitPrice: { type: Number, default: 0 },
  defaultQuantity: { type: Number, default: 1 },
  unitLabel: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

eventServiceSchema.index({ userId: 1, eventId: 1 });

export default mongoose.model('EventService', eventServiceSchema);
