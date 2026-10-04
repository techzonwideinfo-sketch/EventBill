import mongoose from 'mongoose';
import Bill from '../models/Bill.js';
import Payment from '../models/Payment.js';

export const getStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    const billStats = await Bill.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalBills: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          totalPending: { $sum: "$balanceAmount" },
          fullyPaid: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "Paid"] }, 1, 0] }
          },
          partiallyPaid: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "Partially Paid"] }, 1, 0] }
          },
          pendingBills: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "Pending"] }, 1, 0] }
          }
        }
      }
    ]);

    const paymentStats = await Payment.aggregate([
      { $match: { userId: userId, status: { $in: ['Verified', 'Paid'] } } },
      {
        $group: {
          _id: "$method",
          total: { $sum: "$amount" }
        }
      }
    ]);

    let cashCollection = 0;
    let qrCollection = 0;

    paymentStats.forEach(stat => {
      if (stat._id === 'Cash') {
        cashCollection += stat.total;
      } else if (stat._id === 'StaticQR' || stat._id === 'DynamicQR' || stat._id === 'UPI') {
        qrCollection += stat.total;
      }
    });

    const totalCollection = cashCollection + qrCollection;

    const result = billStats.length > 0 ? billStats[0] : { 
      totalBills: 0, 
      totalAmount: 0, 
      totalPending: 0,
      fullyPaid: 0,
      partiallyPaid: 0,
      pendingBills: 0
    };
    delete result._id;

    result.cashCollection = cashCollection;
    result.qrCollection = qrCollection;
    result.totalCollection = totalCollection;

    result.recentBills = await Bill.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('customerId', 'name phone email');

    res.json({ success: true, data: result });
  } catch (err) { 
    console.error('Dashboard Stats Error:', err);
    res.status(500).json({ success: false, message: 'An unexpected error occurred while fetching dashboard statistics.' }); 
  }
};
