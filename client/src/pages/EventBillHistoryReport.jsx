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

const ROWS_PER_PAGE = 28;

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
        const rawData = res.data?.data || res.data?.bills || res.data || [];
        const finalBills = Array.isArray(rawData) ? rawData : (rawData.docs || []);
        
        if (!Array.isArray(finalBills)) {
          setError("Invalid data format received from server.");
          setBills([]);
        } else {
          setBills(finalBills);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Failed to fetch matching bills.");
        setLoading(false);
      });
  }, [eventId, eventFilterFallback, statusFilter, dateFilter, customStart, customEnd]);

  useEffect(() => {
    if (!loading && !error && Array.isArray(bills) && bills.length > 0) {
      setTimeout(() => {
        window.print();
      }, 800);
    }
  }, [loading, error, bills]);

  const handleClose = () => window.close();

  const renderShell = (content) => (
    <div>
      <div className="no-print" style={{ background: '#f8f9fa', padding: '15px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#253C6D' }}>Report Preview</h2>
        <button onClick={handleClose} style={{ padding: '8px 16px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Close</button>
      </div>
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        {content}
      </div>
    </div>
  );

  if (loading) return renderShell(<div style={{ fontSize: '18px', textAlign: 'center' }}>Preparing report, please wait...</div>);
  if (error) return renderShell(<div style={{ color: 'red', textAlign: 'center' }}><h2>Error</h2><p>{error}</p></div>);
  
  const safeBills = Array.isArray(bills) ? bills : [];
  if (safeBills.length === 0) return renderShell(<div style={{ textAlign: 'center' }}><h2>No Records Found</h2></div>);

  let dateStr = dateFilter || 'All Time';
  if (dateFilter === 'Custom') dateStr = `${customStart} to ${customEnd}`;

  const pages = [];
  for (let i = 0; i < safeBills.length; i += ROWS_PER_PAGE) {
    pages.push(safeBills.slice(i, i + ROWS_PER_PAGE));
  }

  return (
    <div>
      <style>
        {`
          @page { size: A4 portrait; margin: 10mm; }
          body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            background: #f0f2f5; 
            margin: 0; 
            padding: 0; 
            color: #000; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          
          /* Container matching A4 dimensions */
          .page-wrapper {
            width: 210mm;
            min-height: 297mm;
            margin: 20px auto;
            background: white;
            box-sizing: border-box;
            padding: 10mm 15mm;
            border: 1px solid #ddd;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            page-break-after: always;
            break-after: page;
            display: flex; 
            flex-direction: column;
          }
          .page-wrapper:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          
          /* Typography for Print */
          .report-header { text-align: center; margin-bottom: 8px; flex-shrink: 0; }
          .brand-title { font-size: 14px; font-weight: bold; letter-spacing: 1px; color: #555; margin: 0; }
          .report-title { font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 2px 0 6px 0; }
          .report-meta { display: flex; justify-content: space-between; font-size: 10px; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; }
          
          /* Table Styles */
          .table-container { flex-grow: 0; margin-bottom: 10px; }
          .report-table { width: 100%; border-collapse: collapse; font-size: 9px; table-layout: fixed; }
          .report-table th, .report-table td { 
            border: 1px solid #444; 
            padding: 5px 3px; 
            text-align: left; 
            vertical-align: middle; 
            overflow-wrap: anywhere; 
            word-break: break-word; 
            line-height: 1.1;
          }
          .report-table th { background-color: #f3f4f6; font-weight: bold; text-transform: uppercase; }
          
          .text-right { text-align: right !important; }
          .text-center { text-align: center !important; }
          
          /* Summary and Footer */
          .page-summary { 
            border: 1px solid #000; 
            padding: 6px 10px; 
            display: flex; 
            justify-content: space-between; 
            background-color: #f8f9fa; 
            font-size: 11px; 
            font-weight: bold; 
            border-radius: 2px;
            flex-shrink: 0;
          }
          .footer-spacer { flex-grow: 1; }
          .page-footer { text-align: right; font-size: 9px; color: #333; margin-top: auto; padding-top: 10px; flex-shrink: 0; }
          
          /* Badges */
          .status-badge { display: inline-block; padding: 2px 3px; border-radius: 2px; font-size: 8px; font-weight: bold; text-transform: uppercase; }
          .status-paid { background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
          .status-partial { background-color: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
          .status-pending { background-color: #ffedd5; color: #9a3412; border: 1px solid #fed7aa; }
          
          .no-print { display: none !important; }

          /* Print Overrides */
          @media print {
            @page { size: A4 portrait; margin: 0; }
            body { background: white; margin: 0; padding: 0; }
            .page-wrapper { margin: 0; padding: 10mm 10mm; border: none; box-shadow: none; width: 210mm; height: 297mm; min-height: 297mm; }
            .report-table th, .report-table td { padding: 4px 3px; }
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
        
        const pageBillCount = pageBills.length;
        const pagePaidTotal = pageBills.reduce((sum, b) => sum + (Number(b?.totalPaid) || 0), 0);
        
        return (
          <div key={`page-${pageNum}`} className="page-wrapper a4-report-page">
            <div className="report-header">
              <h2 className="brand-title">MOI BILL</h2>
              <h1 className="report-title">E-MOI BILL HISTORY REPORT</h1>
              <div className="report-meta">
                <div>
                  <strong>Event:</strong> {eventName || 'All Events'} <br/>
                  <strong>Date Range:</strong> {dateStr}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>Generated:</strong> {new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
            </div>

            <div className="table-container">
              <table className="report-table">
              <thead>
                <tr>
                  <th style={{ width: '4%' }} className="text-center">No</th>
                  <th style={{ width: '18%' }}>Customer</th>
                  <th style={{ width: '14%' }}>S/O</th>
                  <th style={{ width: '18%' }}>Native Place</th>
                  <th style={{ width: '12%' }}>Phone</th>
                  <th style={{ width: '14%' }}>Event</th>
                  <th style={{ width: '12%' }} className="text-right">Paid</th>
                  <th style={{ width: '8%' }} className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {pageBills.map((b, index) => {
                  const globalIndex = (pageIndex * ROWS_PER_PAGE) + index + 1;
                  
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
                      <td className="text-center">{globalIndex}</td>
                      <td>{custName}</td>
                      <td>{sonOf}</td>
                      <td>{nativePlace}</td>
                      <td>{phone}</td>
                      <td>
                        <div style={{ fontWeight: 'bold' }}>{b?.eventType || '-'}</div>
                        <div>{formatDate(b?.eventDate || b?.createdAt)}</div>
                      </td>
                      <td className="text-right" style={{ fontWeight: 'bold' }}>{formatCurrency(b?.totalPaid)}</td>
                      <td className="text-center">
                        <span className={`status-badge ${statusClass}`}>{b?.paymentStatus || 'PENDING'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>

            <div className="page-summary">
              <span>Page {pageNum} Bill Count: {pageBillCount}</span>
              <span>Page {pageNum} Total Paid: {formatCurrency(pagePaidTotal)}</span>
            </div>
            
            <div className="footer-spacer"></div>

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
