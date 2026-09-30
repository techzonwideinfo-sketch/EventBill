import Bill from '../models/Bill.js';
import Customer from '../models/Customer.js';
import { calculateBillTotals } from '../utils/calculations.js';
import { generateBillNumber } from '../utils/billNumberGenerator.js';
import crypto from 'crypto';

export const getBills = async (req, res) => {
  try {
    const bills = await Bill.find({ userId: req.user.id }).populate('customerId').sort({ createdAt: -1 });
    res.json({ success: true, data: bills });
  } catch (err) { 
    console.error('getBills error:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching bills' }); 
  }
};

export const getBill = async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, userId: req.user.id }).populate('customerId');
    if (!bill) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: bill });
  } catch (err) { 
    console.error('getBill error:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching bill' }); 
  }
};

export const createBill = async (req, res) => {
  try {
    const totals = calculateBillTotals(req.body.items || [], req.body.discount, req.body.tax, req.body.additionalCharges, req.body.advancePaid, req.body.additionalPayment);
    const billNumber = await generateBillNumber(req.user.id);
    const publicToken = crypto.randomBytes(16).toString('hex');
    
    let customerSnapshot = req.body.customerSnapshot;
    let customerId = req.body.customerId;
    if (customerId && !customerSnapshot) {
       const c = await Customer.findById(customerId);
       if(c) customerSnapshot = { name: c.name, phone: c.phone, email: c.email, address: c.address };
    } else if (!customerId && customerSnapshot && customerSnapshot.name && customerSnapshot.phone) {
       const existing = await Customer.findOne({ userId: req.user.id, phone: customerSnapshot.phone.trim() });
       if (existing) {
         customerId = existing._id;
       } else {
         const newCust = await Customer.create({
           userId: req.user.id,
           name: customerSnapshot.name.trim(),
           phone: customerSnapshot.phone.trim(),
           address: customerSnapshot.address || ''
         });
         customerId = newCust._id;
       }
    }

    const bill = await Bill.create({ 
      ...req.body, 
      ...totals,
      userId: req.user.id, 
      billNumber,
      customerId,
      customerSnapshot,
      publicToken 
    });
    res.status(201).json({ success: true, data: bill });
  } catch (err) { 
    console.error('createBill error:', err);
    res.status(500).json({ success: false, message: 'Server error while creating bill' }); 
  }
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
  } catch (err) { 
    console.error('updateBill error:', err);
    res.status(500).json({ success: false, message: 'Server error while updating bill' }); 
  }
};

export const deleteBill = async (req, res) => {
  try {
    await Bill.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { 
    console.error('deleteBill error:', err);
    res.status(500).json({ success: false, message: 'Server error while deleting bill' }); 
  }
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
  } catch (err) { 
    console.error('useAsNew error:', err);
    res.status(500).json({ success: false, message: 'Server error while duplicating bill' }); 
  }
};
