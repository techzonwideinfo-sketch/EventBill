const fs = require('fs');
const path = require('path');

const files = {
  'src/config/db.js': `import mongoose from 'mongoose';
export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
`,
  'src/middleware/auth.js': `import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};
`,
  'src/utils/calculations.js': `
export const calculateBillTotals = (items, discount = 0, tax = 0, additionalCharges = 0, advancePaid = 0, additionalPayment = 0) => {
  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
  const totalAmount = subtotal - discount + tax + additionalCharges;
  const totalPaid = advancePaid + additionalPayment;
  const balanceAmount = totalAmount - totalPaid;
  
  let paymentStatus = 'Pending';
  if (totalPaid >= totalAmount && totalAmount > 0) {
    paymentStatus = 'Paid';
  } else if (totalPaid > 0) {
    paymentStatus = 'Partially Paid';
  }

  return { subtotal, discount, tax, additionalCharges, totalAmount, totalPaid, balanceAmount, paymentStatus };
};
`,
  'src/utils/billNumberGenerator.js': `import Bill from '../models/Bill.js';
export const generateBillNumber = async (userId) => {
  const latestBill = await Bill.findOne({ userId }).sort({ createdAt: -1 });
  if (!latestBill || !latestBill.billNumber) {
    return 'EVT-0001';
  }
  const lastNum = parseInt(latestBill.billNumber.split('-')[1], 10);
  const nextNum = (lastNum + 1).toString().padStart(4, '0');
  return \`EVT-\${nextNum}\`;
};
`,
  'src/controllers/authController.js': `import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });
};

export const register = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ success: false, message: 'User already exists' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email, mobile, password: hashedPassword });
    res.status(201).json({ success: true, data: { _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({ success: true, data: { _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) }});
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
`,
  'src/controllers/customerController.js': `import Customer from '../models/Customer.js';
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: customers });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
export const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, userId: req.user.id });
    if (!customer) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: customer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
export const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, data: customer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, req.body, { new: true });
    res.json({ success: true, data: customer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
export const deleteCustomer = async (req, res) => {
  try {
    await Customer.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
`,
  'src/controllers/billController.js': `import Bill from '../models/Bill.js';
import Customer from '../models/Customer.js';
import { calculateBillTotals } from '../utils/calculations.js';
import { generateBillNumber } from '../utils/billNumberGenerator.js';
import crypto from 'crypto';

export const getBills = async (req, res) => {
  try {
    const bills = await Bill.find({ userId: req.user.id }).populate('customerId').sort({ createdAt: -1 });
    res.json({ success: true, data: bills });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getBill = async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, userId: req.user.id }).populate('customerId');
    if (!bill) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: bill });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const createBill = async (req, res) => {
  try {
    const totals = calculateBillTotals(req.body.items || [], req.body.discount, req.body.tax, req.body.additionalCharges, req.body.advancePaid, req.body.additionalPayment);
    const billNumber = await generateBillNumber(req.user.id);
    const publicToken = crypto.randomBytes(16).toString('hex');
    
    let customerSnapshot = req.body.customerSnapshot;
    if (req.body.customerId && !customerSnapshot) {
       const c = await Customer.findById(req.body.customerId);
       if(c) customerSnapshot = { name: c.name, phone: c.phone, email: c.email, address: c.address };
    }

    const bill = await Bill.create({ 
      ...req.body, 
      ...totals,
      userId: req.user.id, 
      billNumber,
      customerSnapshot,
      publicToken 
    });
    res.status(201).json({ success: true, data: bill });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateBill = async (req, res) => {
  try {
    const totals = calculateBillTotals(req.body.items || [], req.body.discount, req.body.tax, req.body.additionalCharges, req.body.advancePaid, req.body.additionalPayment);
    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { ...req.body, ...totals },
      { new: true }
    );
    res.json({ success: true, data: bill });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteBill = async (req, res) => {
  try {
    await Bill.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const useAsNew = async (req, res) => {
  try {
    const oldBill = await Bill.findOne({ _id: req.params.id, userId: req.user.id });
    if (!oldBill) return res.status(404).json({ success: false, message: 'Not found' });
    const billNumber = await generateBillNumber(req.user.id);
    const publicToken = crypto.randomBytes(16).toString('hex');
    
    const newBillData = oldBill.toObject();
    delete newBillData._id;
    delete newBillData.createdAt;
    delete newBillData.updatedAt;
    delete newBillData.pdfUrl;
    
    newBillData.billNumber = billNumber;
    newBillData.publicToken = publicToken;
    newBillData.advancePaid = 0;
    newBillData.additionalPayment = 0;
    newBillData.totalPaid = 0;
    const totals = calculateBillTotals(newBillData.items, newBillData.discount, newBillData.tax, newBillData.additionalCharges, 0, 0);
    
    const newBill = await Bill.create({ ...newBillData, ...totals });
    res.status(201).json({ success: true, data: newBill });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
`,
  'src/controllers/dashboardController.js': `import Bill from '../models/Bill.js';
export const getStats = async (req, res) => {
  try {
    const bills = await Bill.find({ userId: req.user.id });
    const stats = {
      totalBills: bills.length,
      totalAmount: bills.reduce((acc, b) => acc + b.totalAmount, 0),
      totalPaid: bills.reduce((acc, b) => acc + b.totalPaid, 0),
      totalPending: bills.reduce((acc, b) => acc + b.balanceAmount, 0),
      recentBills: await Bill.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(5).populate('customerId')
    };
    res.json({ success: true, data: stats });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
`,
  'src/routes/api.js': `import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController.js';
import { getBills, getBill, createBill, updateBill, deleteBill, useAsNew } from '../controllers/billController.js';
import { getStats } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', protect, getMe);

router.get('/customers', protect, getCustomers);
router.get('/customers/:id', protect, getCustomer);
router.post('/customers', protect, createCustomer);
router.put('/customers/:id', protect, updateCustomer);
router.delete('/customers/:id', protect, deleteCustomer);

router.get('/bills', protect, getBills);
router.get('/bills/:id', protect, getBill);
router.post('/bills', protect, createBill);
router.put('/bills/:id', protect, updateBill);
router.delete('/bills/:id', protect, deleteBill);
router.post('/bills/:id/use-as-new', protect, useAsNew);

router.get('/dashboard/stats', protect, getStats);

export default router;
`,
  'src/index.js': `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/api.js';

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
`,
  '.env': `PORT=5000
MONGODB_URI=mongodb://localhost:27017/eventbill
JWT_SECRET=supersecret12345
JWT_EXPIRES_IN=30d
CLIENT_URL=http://localhost:5173
`
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filepath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content);
}
console.log('Backend scaffolded successfully');
