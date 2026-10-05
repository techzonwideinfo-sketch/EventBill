import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  billNumber: { type: String, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerSnapshot: { type: Object },
  eventType: { type: String, required: true },
  otherEventType: { type: String },
  eventTypeNameEn: { type: String },
  eventTypeNameTa: { type: String },
  eventDate: { type: Date, required: true },
  venue: { type: String },
  eventLogo: { type: String },
  guestCount: { type: Number },
  items: [{
    service: String,
    description: String,
    quantity: Number,
    rate: Number,
    discount: Number,
    tax: Number,
    amount: Number
  }],
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  additionalCharges: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  advancePaid: { type: Number, default: 0 },
  additionalPayment: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['Pending', 'Partially Paid', 'Paid'], default: 'Pending' },
  paymentMethod: { type: String },
  amountReceived: { type: Number },
  changeReturned: { type: Number },
  paymentReference: { type: String },
  billLanguage: { type: String, enum: ['English', 'Tamil', 'English + Tamil'], default: 'English' },
  notes: { type: String },
  terms: { type: String },
  publicToken: { type: String },
  pdfUrl: { type: String },
  denominationCounts: { type: Object },
  countedCashAmount: { type: Number },
  enteredCashAmount: { type: Number },
  cashDifference: { type: Number }
}, { timestamps: true });

billSchema.index({ userId: 1 });
billSchema.index({ billNumber: 1 });
billSchema.index({ createdAt: -1 });
billSchema.index({ customerId: 1 });
billSchema.index({ eventDate: 1 });
billSchema.index({ publicToken: 1 });

export default mongoose.model('Bill', billSchema);
