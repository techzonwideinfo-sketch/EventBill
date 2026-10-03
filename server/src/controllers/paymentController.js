import Bill from '../models/Bill.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';

export const recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method, reference, amountReceived, changeReturned } = req.body;

    const bill = await Bill.findOne({ _id: id, userId: req.user.id });
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    // Manual reconciliation assumes verification by the merchant directly for Cash/StaticQR
    const status = (method === 'Cash' || method === 'StaticQR' || method === 'Other') ? 'Verified' : 'Pending';

    const payment = await Payment.create({
      userId: req.user.id,
      billId: bill._id,
      amount: Number(amount),
      method,
      reference,
      status
    });

    if (status === 'Verified') {
      bill.totalPaid += Number(amount);
      bill.balanceAmount = bill.totalAmount - bill.totalPaid;
      
      if (bill.balanceAmount <= 0) {
        bill.paymentStatus = 'Paid';
        bill.balanceAmount = 0;
      } else {
        bill.paymentStatus = 'Partially Paid';
      }
      
      bill.paymentMethod = method;
      bill.paymentReference = reference;
      if (amountReceived !== undefined) bill.amountReceived = Number(amountReceived);
      if (changeReturned !== undefined) bill.changeReturned = Number(changeReturned);

      await bill.save();
    }

    res.status(201).json({
      success: true,
      data: {
        payment,
        bill
      }
    });

  } catch (err) {
    console.error('Record Payment Error:', err);
    res.status(500).json({ success: false, message: 'Server error while recording payment' });
  }
};

export const updatePaymentSettings = async (req, res) => {
  try {
    const { paymentSettings } = req.body;
    
    // Simple mock mode / DB update
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { paymentSettings },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user.paymentSettings
    });
  } catch (err) {
    console.error('Update Payment Settings Error:', err);
    res.status(500).json({ success: false, message: 'Server error updating payment settings' });
  }
};
