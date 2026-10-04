import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../services/api';

const formatCurrency = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-IN');
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null, errorObj: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, errorObj: error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Report ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo, errorObj: error });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', backgroundColor: '#fff', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
          <h2>Report Rendering Error</h2>
          <p>Something went wrong while displaying the report.</p>
          <pre style={{ fontSize: '12px', background: '#f1f5f9', padding: '10px', overflowX: 'auto' }}>
            {this.state.errorObj?.toString()}
            {'\n'}
            {this.state.errorInfo?.componentStack}
          </pre>
          <button onClick={() => window.close()} style={{ marginTop: '10px', padding: '10px 20px', cursor: 'pointer', backgroundColor: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '4px' }}>Close Window</button>
        </div>
      );
    }
    return this.props.children; 
  }
}

const ROWS_PER_PAGE = 20;

const EventBillHistoryReportContent = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const eventId = queryParams.get('eventId');
  const eventFilterFallback = queryParams.get('event'); // for backwards compat
  const dateFilter = queryParams.get('dateFilter');
  const customStart = queryParams.get('customStart');
  const customEnd = queryParams.get('customEnd');
  const statusFilter = queryParams.get('status');

  const [eventName, setEventName] = useState(eventFilterFallback || '');

  useEffect(() => {
    if (!eventId && !eventFilterFallback) {
      setError("No event specified for the report.");
      setLoading(false);
      return;
    }

    let params = {};
    if (eventId) {
      params.eventId = eventId;
      API.get(`/event-types/` + eventId).then(res => {
        if (res.data?.data?.name) {
          setEventName(res.data.data.name);
        }
      }).catch(err => console.error("Error fetching event type:", err));
    } else {
      params.eventType = eventFilterFallback;
    }
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
        // Robust response parsing
        const rawData = res.data?.data || res.data?.bills || res.data || [];
        const finalBills = Array.isArray(rawData) ? rawData : (rawData.docs || []);
        
        if (!Array.isArray(finalBills)) {
          console.error("API returned non-array data:", res.data);
          setError("Invalid data format received from server.");
          setBills([]);
        } else {
          setBills(finalBills);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Failed to fetch matching bills: " + (err.response?.data?.message || err.message));
        setLoading(false);
      });
  }, [eventId, eventFilterFallback, statusFilter, dateFilter, customStart, customEnd]);

  useEffect(() => {
    // Only print when data is loaded, there is no error, and the array is truly present.
    if (!loading && !error && Array.isArray(bills) && bills.length > 0) {
      setTimeout(() => {
        window.print();
      }, 800);
    }
  }, [loading, error, bills]);

  const handleClose = () => {
    window.close();
  };

  const renderShell = (content) => (
    <div>
      <style>
        {`
          body { font-family: Arial, sans-serif; background: white; margin: 0; padding: 0; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .report-container { width: 100%; max-width: 100%; padding: 20px; box-sizing: border-box; }
          .report-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .report-title { font-size: 24px; font-weight: bold; text-transform: uppercase; margin: 0 0 5px 0; }
          .no-print { display: none !important; }
          @media print {
             .report-container { padding: 0; }
          }
        `}
      </style>
      <div className="no-print" style={{ background: '#f8f9fa', padding: '15px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#253C6D' }}>Report Preview</h2>
        <button onClick={handleClose} style={{ padding: '8px 16px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Close</button>
      </div>
      <div className="report-container">
        <div className="report-header">
          <h1 className="report-title">E-MOI Event Bill History Report</h1>
        </div>
        {content}
      </div>
    </div>
  );

  if (loading) return renderShell(<div style={{ padding: '20px', fontSize: '18px', textAlign: 'center' }}>Preparing report, please wait...</div>);
  if (error) return renderShell(
    <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
      <h2>Error Preparing Report</h2>
      <p>{error}</p>
      <button onClick={() => window.location.reload()} style={{ marginTop: '10px', padding: '10px 20px', cursor: 'pointer', backgroundColor: '#253C6D', color: '#fff', border: 'none', borderRadius: '4px' }}>Retry</button>
    </div>
  );
  
  const safeBills = Array.isArray(bills) ? bills : [];
  if (safeBills.length === 0) return renderShell(
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>No Records Found</h2>
      <p>No bills match the selected criteria for this report.</p>
    </div>
  );

  let dateStr = dateFilter || 'All Time';
  if (dateFilter === 'Custom') {
    dateStr = customStart + ' to ' + customEnd;
  }

  // Calculate chunks safely
  const pages = [];
  for (let i = 0; i < safeBills.length; i += ROWS_PER_PAGE) {
    pages.push(safeBills.slice(i, i + ROWS_PER_PAGE));
  }

  // Grand totals safely
  const totalBills = safeBills.length;
  const totalPaid = safeBills.reduce((sum, b) => {
    const p = Number(b?.totalPaid);
    return sum + (isNaN(p) ? 0 : p);
  }, 0);

  return (
    <div>
      <style>
        {`
          @page { size: A4 landscape; margin: 10mm; }
          body { font-family: Arial, sans-serif; background: white; margin: 0; padding: 0; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-wrapper { width: 100%; box-sizing: border-box; page-break-after: always; padding: 10mm 15mm; min-height: 100vh; display: flex; flex-direction: column; }
          @media print {
            .page-wrapper { min-height: auto; height: 100%; padding: 0; }
          }
          .page-wrapper:last-child { page-break-after: auto; }
          .report-header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; flex-shrink: 0; }
          .report-title { font-size: 22px; font-weight: bold; text-transform: uppercase; margin: 0 0 5px 0; }
          .report-meta { display: flex; justify-content: space-between; font-size: 12px; margin-top: 10px; }
          .report-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 15px; }
          .report-table th, .report-table td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          .report-table th { background-color: #f3f4f6; font-weight: bold; text-transform: uppercase; }
          .text-right { text-align: right !important; }
          .text-center { text-align: center !important; }
          
          .spacer { flex-grow: 1; }
          
          .page-summary { border: 1px solid #000; padding: 10px; display: flex; justify-content: space-around; background-color: #f8f9fa; font-size: 14px; font-weight: bold; margin-bottom: 10px; }
          .grand-summary { border: 2px solid #000; padding: 12px; display: flex; justify-content: space-around; background-color: #e2e8f0; font-size: 16px; font-weight: bold; margin-bottom: 10px; }
          
          .status-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
          .status-paid { background-color: #dcfce7; color: #166534; }
          .status-partial { background-color: #dbeafe; color: #1e40af; }
          .status-pending { background-color: #ffedd5; color: #9a3412; }
          .page-footer { text-align: right; font-size: 10px; color: #555; border-top: 1px solid #ddd; padding-top: 5px; }
          
          .no-print { display: none !important; }
          @media screen {
            .page-wrapper { border: 1px solid #ddd; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin: 20px auto; max-width: 297mm; background: white; }
            body { background: #f0f2f5; }
          }
        `}
      </style>
      
      {/* Action Bar (hidden when printing) */}
      <div className="no-print" style={{ background: '#f8f9fa', padding: '15px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <h2 style={{ margin: 0, color: '#253C6D' }}>Report Preview</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleClose} style={{ padding: '8px 16px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Close</button>
          <button onClick={() => window.print()} style={{ padding: '8px 16px', background: '#253C6D', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Print Report</button>
        </div>
      </div>

      {pages.map((pageBills, pageIndex) => {
        const pageNum = pageIndex + 1;
        const totalPages = pages.length;
        const isLastPage = pageNum === totalPages;
        
        const pageBillCount = pageBills.length;
        const pagePaidTotal = pageBills.reduce((sum, b) => {
          const p = Number(b?.totalPaid);
          return sum + (isNaN(p) ? 0 : p);
        }, 0);
        
        return (
          <div key={'page-' + pageNum} className="page-wrapper">
            <div className="report-header">
              <h1 className="report-title">E-MOI Event Bill History Report</h1>
              <div className="report-meta">
                <div>
                  <strong>Event:</strong> {eventName || 'All Events'} <br/>
                  <strong>Date Range:</strong> {dateStr}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>Generated:</strong> {new Date().toLocaleString('en-IN')} <br/>
                </div>
              </div>
            </div>

            <table className="report-table">
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>No.</th>
                  <th style={{ width: '20%' }}>Customer Name</th>
                  <th style={{ width: '15%' }}>S/O Name</th>
                  <th style={{ width: '15%' }}>Native Place</th>
                  <th style={{ width: '12%' }}>Phone</th>
                  <th style={{ width: '13%' }}>Event</th>
                  <th className="text-right" style={{ width: '10%' }}>Paid</th>
                  <th className="text-center" style={{ width: '10%' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {pageBills.map((b, index) => {
                  const globalIndex = (pageIndex * ROWS_PER_PAGE) + index + 1;
                  
                  // Safely handle potentially null/undefined objects
                  const custSnap = b?.customerSnapshot || {};
                  const custRef = b?.customerId || {};
                  
                  const custName = custSnap.name || custRef.name || '-';
                  const sonOf = custSnap.sonOf || '-';
                  const nativePlace = custSnap.nativePlace || '-';
                  const phone = custSnap.phone || custRef.phone || '-';
                  
                  let statusClass = 'status-pending';
                  if (b?.paymentStatus === 'Paid') statusClass = 'status-paid';
                  if (b?.paymentStatus === 'Partially Paid') statusClass = 'status-partial';

                  return (
                    <tr key={b?._id || globalIndex}>
                      <td>{globalIndex}</td>
                      <td>{custName}</td>
                      <td>{sonOf}</td>
                      <td>{nativePlace}</td>
                      <td>{phone}</td>
                      <td>
                        <div style={{ fontWeight: 'bold', fontSize: '10px' }}>{b?.eventType || '-'}</div>
                        <div style={{ fontSize: '9px', color: '#555' }}>{formatDate(b?.eventDate || b?.createdAt)}</div>
                      </td>
                      <td className="text-right" style={{ fontWeight: 'bold' }}>{formatCurrency(b?.totalPaid)}</td>
                      <td className="text-center">
                        <span className={`status-badge ` + statusClass}>{b?.paymentStatus || 'Pending'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="spacer"></div>

            <div className="page-summary">
              <div>Page {pageNum} Bill Count: {pageBillCount}</div>
              <div>Page {pageNum} Paid Total: {formatCurrency(pagePaidTotal)}</div>
            </div>

            {isLastPage && (
              <div className="grand-summary">
                <div>GRAND TOTAL - ENTIRE REPORT</div>
                <div>Total Bills: {totalBills}</div>
                <div>Total Amount Paid: {formatCurrency(totalPaid)}</div>
              </div>
            )}

            <div className="page-footer">
              Page {pageNum} of {totalPages}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const EventBillHistoryReport = () => (
  <ErrorBoundary>
    <EventBillHistoryReportContent />
  </ErrorBoundary>
);

export default EventBillHistoryReport;
