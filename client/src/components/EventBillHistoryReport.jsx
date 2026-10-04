import React from 'react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-IN');
};

const EventBillHistoryReport = ({ bills, eventName, dateRangeStr }) => {
  const totalBills = bills.length;
  
  const totalAmount = bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalPaid = bills.reduce((sum, b) => sum + (b.totalPaid || 0), 0);
  const totalBalance = bills.reduce((sum, b) => sum + (b.balanceAmount || 0), 0);

  const fullyPaidCount = bills.filter(b => b.paymentStatus === 'Paid').length;
  const partialCount = bills.filter(b => b.paymentStatus === 'Partially Paid').length;
  const pendingCount = bills.filter(b => b.paymentStatus === 'Pending' || !b.paymentStatus).length;

  return (
    <div className="report-container">
      <div className="report-header">
        <h1 className="report-title">E-MOI Event Bill History Report</h1>
        <div className="report-meta">
          <div>
            <strong>Event:</strong> {eventName || 'All Events'} <br/>
            <strong>Date Range:</strong> {dateRangeStr || 'All Time'}
          </div>
          <div style={{ textAlign: 'right' }}>
            <strong>Generated:</strong> {new Date().toLocaleString('en-IN')} <br/>
            <strong>Total Bills:</strong> {totalBills}
          </div>
        </div>
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>Customer Name</th>
            <th>S/O Name</th>
            <th>Native Place</th>
            <th>Phone</th>
            <th>Bill Date</th>
            <th className="text-right">Total</th>
            <th className="text-right">Paid</th>
            <th className="text-right">Balance</th>
            <th className="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((b, index) => {
            const custName = b.customerSnapshot?.name || (b.customerId ? b.customerId.name : '-');
            const sonOf = b.customerSnapshot?.sonOf || '-';
            const nativePlace = b.customerSnapshot?.nativePlace || '-';
            const phone = b.customerSnapshot?.phone || (b.customerId ? b.customerId.phone : '-');
            
            let statusClass = 'status-pending';
            if (b.paymentStatus === 'Paid') statusClass = 'status-paid';
            if (b.paymentStatus === 'Partially Paid') statusClass = 'status-partial';

            return (
              <tr key={b._id}>
                <td>{index + 1}</td>
                <td>{custName}</td>
                <td>{sonOf}</td>
                <td>{nativePlace}</td>
                <td>{phone}</td>
                <td>{formatDate(b.eventDate || b.createdAt)}</td>
                <td className="text-right font-bold">{formatCurrency(b.totalAmount)}</td>
                <td className="text-right">{formatCurrency(b.totalPaid)}</td>
                <td className="text-right">{formatCurrency(b.balanceAmount)}</td>
                <td className="text-center">
                  <span className={`status-badge ${statusClass}`}>{b.paymentStatus || 'Pending'}</span>
                </td>
              </tr>
            );
          })}
          {bills.length === 0 && (
            <tr>
              <td colSpan="10" className="text-center" style={{ padding: '20px' }}>No bills found for the selected criteria.</td>
            </tr>
          )}
        </tbody>
      </table>

      {bills.length > 0 && (
        <div className="report-summary">
          <div className="summary-col">
            <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Bill Counts</h3>
            <div className="summary-row"><span>Total Bills:</span> <strong>{totalBills}</strong></div>
            <div className="summary-row"><span>Fully Paid:</span> <strong>{fullyPaidCount}</strong></div>
            <div className="summary-row"><span>Partially Paid:</span> <strong>{partialCount}</strong></div>
            <div className="summary-row"><span>Pending:</span> <strong>{pendingCount}</strong></div>
          </div>
          <div className="summary-col">
            <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Financial Summary</h3>
            <div className="summary-row"><span>Total Bill Amount:</span> <strong>{formatCurrency(totalAmount)}</strong></div>
            <div className="summary-row"><span>Total Amount Paid:</span> <strong>{formatCurrency(totalPaid)}</strong></div>
            <div className="summary-row total"><span>Total Outstanding Balance:</span> <span>{formatCurrency(totalBalance)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventBillHistoryReport;
