import Razorpay from 'razorpay';
import crypto from 'crypto';
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

export const createDynamicQR = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Bill.findOne({ _id: id, userId: req.user.id });
    
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    if (bill.paymentStatus === 'Paid') {
      return res.status(400).json({ success: false, message: 'Bill is already paid' });
    }

    // Check for an existing pending QR payment request
    const existingPayment = await Payment.findOne({
      billId: bill._id,
      method: 'DynamicQR',
      status: 'Pending'
    });

    if (existingPayment) {
      // Re-use if possible, assuming gatewayPayload holds the original QR URL
      if (existingPayment.gatewayPayload && existingPayment.gatewayPayload.image_url) {
        return res.status(200).json({
          success: true,
          data: {
            paymentId: existingPayment._id,
            qrImage: existingPayment.gatewayPayload.image_url,
            amount: existingPayment.amount
          }
        });
      }
    }

    const amountDue = bill.balanceAmount || (bill.totalAmount - bill.totalPaid);
    if (amountDue <= 0) {
      return res.status(400).json({ success: false, message: 'No outstanding balance' });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ success: false, message: 'Razorpay keys not configured in environment' });
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    // Create a Razorpay QR Code
    const qrOptions = {
      type: 'upi_qr',
      name: bill.customerSnapshot?.name || 'Customer',
      usage: 'single_use',
      fixed_amount: true,
      payment_amount: Math.round(amountDue * 100), // in paise
      description: 'Bill Payment ' + bill.billNumber,
      close_by: Math.round(Date.now() / 1000) + 30 * 60, // 30 minutes expiry
      notes: {
        billId: bill._id.toString(),
        userId: req.user.id
      }
    };

    const qrResponse = await instance.qrCode.create(qrOptions);

    const payment = await Payment.create({
      userId: req.user.id,
      billId: bill._id,
      amount: amountDue,
      method: 'DynamicQR',
      status: 'Pending',
      gatewayTransactionId: qrResponse.id,
      gatewayPayload: qrResponse
    });

    res.status(201).json({
      success: true,
      data: {
        paymentId: payment._id,
        qrImage: qrResponse.image_url,
        amount: amountDue
      }
    });

  } catch (err) {
    console.error('Create Dynamic QR Error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate Dynamic QR', error: err.message });
  }
};

export const getPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findOne({ _id: id, userId: req.user.id });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    res.status(200).json({ success: true, data: { status: payment.status } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch status' });
  }
};

export const handleWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, message: 'Webhook secret not configured' });
    }

    const signature = req.headers['x-razorpay-signature'];
    const body = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);

    const expectedSignature = crypto.createHmac('sha256', secret)
                                    .update(body)
                                    .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const payload = JSON.parse(body);

    // Process only if it is qr_code.credited or payment.captured
    if (payload.event === 'qr_code.credited' || payload.event === 'payment.captured') {
      const entity = payload.event === 'qr_code.credited' ? payload.payload.qr_code.entity : payload.payload.payment.entity;
      const amountPaid = (payload.event === 'qr_code.credited' ? payload.payload.payment.entity.amount : entity.amount) / 100;
      const notes = entity.notes || {};
      const qrId = payload.event === 'qr_code.credited' ? entity.id : null;
      
      let payment;
      if (qrId) {
        payment = await Payment.findOne({ gatewayTransactionId: qrId, status: 'Pending' });
      } else if (notes.billId) {
        payment = await Payment.findOne({ billId: notes.billId, method: 'DynamicQR', status: 'Pending' }).sort({ createdAt: -1 });
      }

      if (payment) {
        if (payment.status === 'Verified') {
          return res.status(200).json({ status: 'ok', message: 'Already processed' });
        }

        // Mark payment as Verified
        payment.status = 'Verified';
        payment.reference = payload.event === 'qr_code.credited' ? payload.payload.payment.entity.id : entity.id;
        await payment.save();

        // Update Bill
        const bill = await Bill.findById(payment.billId);
        if (bill) {
          bill.totalPaid += amountPaid;
          bill.balanceAmount = bill.totalAmount - bill.totalPaid;
          
          if (bill.balanceAmount <= 0) {
            bill.paymentStatus = 'Paid';
            bill.balanceAmount = 0;
          } else {
            bill.paymentStatus = 'Partially Paid';
          }
          
          bill.paymentMethod = 'DynamicQR';
          bill.paymentReference = payment.reference;
          await bill.save();
        }
      }
    }

    res.status(200).json({ status: 'ok' });

  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};

