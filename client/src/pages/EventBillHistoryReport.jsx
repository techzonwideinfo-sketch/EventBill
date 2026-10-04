import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../services/api';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-IN');
};

const EventBillHistoryReport = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const eventFilter = queryParams.get('event');
  const dateFilter = queryParams.get('dateFilter');
  const customStart = queryParams.get('customStart');
  const customEnd = queryParams.get('customEnd');
  const statusFilter = queryParams.get('status');

  useEffect(() => {
    if (!eventFilter) {
      setError("No event specified for the report.");
      setLoading(false);
      return;
    }

    let params = { eventType: eventFilter };
    if (statusFilter) params.status = statusFilter;

    if (dateFilter) {
      const today = new Date();
      if (dateFilter === 'Today') {
        params.startDate = today.toISOString().split('T')[0];
        params.endDate = params.startDate;
      } else if (dateFilter === 'Yesterday') {
        const yest = new Date(today);
        yest.setDate(yest.getDate() - 1);
        params.startDate = yest.toISOString().split('T')[0];
        params.endDate = params.startDate;
      } else if (dateFilter === 'This Week') {
        const first = today.getDate() - today.getDay();
        const firstDay = new Date(today.setDate(first));
        params.startDate = firstDay.toISOString().split('T')[0];
      } else if (dateFilter === 'This Month') {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        params.startDate = firstDay.toISOString().split('T')[0];
      } else if (dateFilter === 'Custom') {
        if (customStart) params.startDate = customStart;
        if (customEnd) params.endDate = customEnd;
      }
    }

    API.get('/bills', { params })
      .then(res => {
        setBills(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Failed to fetch matching bills: " + err.message);
        setLoading(false);
      });
  }, [eventFilter, statusFilter, dateFilter, customStart, customEnd]);

  useEffect(() => {
    // Only print once loading is complete and no errors occurred
    if (!loading && !error && bills.length > 0) {
      // Small timeout to ensure rendering/fonts are fully painted
      setTimeout(() => {
        window.print();
      }, 800);
    }
  }, [loading, error, bills]);

  const handleClose = () => {
    window.close();
  };

  if (loading) return <div style={{ padding: '20px', fontSize: '18px' }}>Preparing report, please wait...</div>;
  if (error) return (
    <div style={{ padding: '20px', color: 'red' }}>
      <h2>Error Preparing Report</h2>
      <p>{error}</p>
      <button onClick={handleClose} style={{ marginTop: '10px', padding: '10px 20px', cursor: 'pointer' }}>Close Window</button>
    </div>
  );
  if (bills.length === 0) return (
    <div style={{ padding: '20px' }}>
      <h2>No Records Found</h2>
      <p>No bills match the selected criteria for this report.</p>
      <button onClick={handleClose} style={{ marginTop: '10px', padding: '10px 20px', cursor: 'pointer' }}>Close Window</button>
    </div>
  );

  let dateStr = dateFilter || 'All Time';
  if (dateFilter === 'Custom') {
    dateStr = `${customStart} to ${customEnd}`;
  }

  const totalBills = bills.length;
  const totalAmount = bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalPaid = bills.reduce((sum, b) => sum + (b.totalPaid || 0), 0);
  const totalBalance = bills.reduce((sum, b) => sum + (b.balanceAmount || 0), 0);

  const fullyPaidCount = bills.filter(b => b.paymentStatus === 'Paid').length;
  const partialCount = bills.filter(b => b.paymentStatus === 'Partially Paid').length;
  const pendingCount = bills.filter(b => b.paymentStatus === 'Pending' || !b.paymentStatus).length;

  return (
    <div>
      <style>
        {`
          @page { size: A4 landscape; margin: 10mm; }
          body { font-family: Arial, sans-serif; background: white; margin: 0; padding: 0; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .report-container { width: 100%; max-width: 100%; padding: 20px; box-sizing: border-box; }
          .report-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .report-title { font-size: 24px; font-weight: bold; text-transform: uppercase; margin: 0 0 5px 0; }
          .report-meta { display: flex; justify-content: space-between; font-size: 12px; margin-top: 10px; }
          .report-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; page-break-inside: auto; }
          .report-table thead { display: table-header-group; }
          .report-table tr { page-break-inside: avoid; page-break-after: auto; }
          .report-table th, .report-table td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          .report-table th { background-color: #f3f4f6; font-weight: bold; text-transform: uppercase; }
          .text-right { text-align: right !important; }
          .text-center { text-align: center !important; }
          .report-summary { margin-top: 30px; page-break-inside: avoid; border: 2px solid #000; padding: 15px; display: flex; justify-content: space-between; }
          .summary-col { width: 48%; }
          .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
          .summary-row.total { font-weight: bold; font-size: 16px; border-top: 1px solid #000; padding-top: 8px; margin-top: 8px; }
          .status-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
          .status-paid { background-color: #dcfce7; color: #166534; }
          .status-partial { background-color: #dbeafe; color: #1e40af; }
          .status-pending { background-color: #ffedd5; color: #9a3412; }
          .no-print { display: none !important; }
          @media print {
             .report-container { padding: 0; }
          }
        `}
      </style>
      
      {/* Action Bar (hidden when printing) */}
      <div className="no-print" style={{ background: '#f8f9fa', padding: '15px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#253C6D' }}>Report Preview</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleClose} style={{ padding: '8px 16px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Close</button>
          <button onClick={() => window.print()} style={{ padding: '8px 16px', background: '#253C6D', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Print Report</button>
        </div>
      </div>

      <div className="report-container">
        <div className="report-header">
          <h1 className="report-title">E-MOI Event Bill History Report</h1>
          <div className="report-meta">
            <div>
              <strong>Event:</strong> {eventFilter} <br/>
              <strong>Date Range:</strong> {dateStr}
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
                  <td className="text-right" style={{ fontWeight: 'bold' }}>{formatCurrency(b.totalAmount)}</td>
                  <td className="text-right">{formatCurrency(b.totalPaid)}</td>
                  <td className="text-right">{formatCurrency(b.balanceAmount)}</td>
                  <td className="text-center">
                    <span className={`status-badge ${statusClass}`}>{b.paymentStatus || 'Pending'}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

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
      </div>
    </div>
  );
};

export default EventBillHistoryReport;
