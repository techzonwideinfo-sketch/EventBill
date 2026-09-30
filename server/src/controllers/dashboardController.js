import mongoose from 'mongoose';
import Bill from '../models/Bill.js';

export const getStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const stats = await Bill.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalBills: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$totalPaid" },
          totalPending: { $sum: "$balanceAmount" }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : { totalBills: 0, totalAmount: 0, totalPaid: 0, totalPending: 0 };
    delete result._id;

    result.recentBills = await Bill.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('customerId', 'name phone email'); // Select useful fields

    res.json({ success: true, data: result });
  } catch (err) { 
    console.error('Dashboard Stats Error:', err);
    res.status(500).json({ success: false, message: 'An unexpected error occurred while fetching dashboard statistics.' }); 
  }
};
