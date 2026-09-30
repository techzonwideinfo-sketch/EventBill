
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
