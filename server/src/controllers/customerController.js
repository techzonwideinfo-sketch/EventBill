import Customer from '../models/Customer.js';
import Bill from '../models/Bill.js';
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    
    const billsInfo = await Bill.aggregate([
      { $match: { userId: req.user.id } },
      { $group: { 
          _id: '$customerId', 
          billsCount: { $sum: 1 }, 
          lastBillDate: { $max: '$createdAt' } 
      } }
    ]);
    
    const billsMap = billsInfo.reduce((acc, curr) => {
      if (curr._id) {
        acc[curr._id.toString()] = { count: curr.billsCount, lastDate: curr.lastBillDate };
      }
      return acc;
    }, {});
    
    const enriched = customers.map(c => ({
      ...c,
      billsCount: billsMap[c._id.toString()]?.count || 0,
      lastBillDate: billsMap[c._id.toString()]?.lastDate || null
    }));
    
    res.json({ success: true, data: enriched });
  } catch (err) { 
    console.error('getCustomers error:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching customers' }); 
  }
};
export const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, userId: req.user.id });
    if (!customer) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: customer });
  } catch (err) { 
    console.error('getCustomer error:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching customer' }); 
  }
};
export const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, data: customer });
  } catch (err) { 
    console.error('createCustomer error:', err);
    res.status(500).json({ success: false, message: 'Server error while creating customer' }); 
  }
};
export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, req.body, { new: true });
    res.json({ success: true, data: customer });
  } catch (err) { 
    console.error('updateCustomer error:', err);
    res.status(500).json({ success: false, message: 'Server error while updating customer' }); 
  }
};
export const deleteCustomer = async (req, res) => {
  try {
    await Customer.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { 
    console.error('deleteCustomer error:', err);
    res.status(500).json({ success: false, message: 'Server error while deleting customer' }); 
  }
};
