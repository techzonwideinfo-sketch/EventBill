import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../services/api';
import { generateHTML } from '../utils/billTemplate';

const PrintBill = () => {
  const { id } = useParams();
  const [html, setHtml] = useState(null);
  const width = localStorage.getItem('receiptWidth') || '80mm';

  useEffect(() => {
    API.get(`/bills/${id}`).then(res => {
      const generated = generateHTML(res.data.data, '', width);
      setHtml(generated);
    }).catch(err => {
      alert("Error loading bill: " + err.message);
    });
  }, [id, width]);

  const handlePrintClick = () => {
    window.print();
  };

  const handleClose = () => {
    window.close();
  };

  if (!html) return <div style={{ padding: '20px' }}>Loading receipt...</div>;

  return (
    <div>
      <style>
        {`
          @media print {
            @page {
              size: ${width} auto;
              margin: 0;
            }
            html, body {
              width: ${width};
              margin: 0;
              padding: 0;
              background: white;
            }
            .print-receipt {
              width: ${width};
              max-width: ${width};
              margin: 0;
              padding: 4mm;
              box-sizing: border-box;
            }
            .no-print {
              display: none !important;
            }
          }
          body {
            background-color: #f3f4f6;
          }
        `}
      </style>
      
      {/* Action Bar (hidden when printing) */}
      <div className="no-print sticky top-0 bg-white border-b border-gray-200 shadow-sm z-50 p-4 flex justify-between items-center max-w-[800px] mx-auto mb-6 rounded-b-lg">
        <h2 className="text-xl font-bold text-[#253C6D]">Receipt Preview</h2>
        <div className="flex gap-3">
          <button 
            onClick={handleClose}
            className="px-5 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          <button 
            onClick={handlePrintClick}
            className="px-5 py-2 bg-[#253C6D] text-white font-bold rounded-lg hover:bg-[#30497D] transition-colors shadow-md flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print
          </button>
        </div>
      </div>

      <div className="flex justify-center pb-12">
        <div className="print-receipt shadow-xl bg-white border border-gray-200" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
};

export default PrintBill;
