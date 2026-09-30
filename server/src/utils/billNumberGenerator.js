import Bill from '../models/Bill.js';
export const generateBillNumber = async (userId) => {
  const latestBill = await Bill.findOne({ userId }).sort({ createdAt: -1 });
  if (!latestBill || !latestBill.billNumber) {
    return 'EVT-0001';
  }
  const lastNum = parseInt(latestBill.billNumber.split('-')[1], 10);
  const nextNum = (lastNum + 1).toString().padStart(4, '0');
  return `EVT-${nextNum}`;
};
