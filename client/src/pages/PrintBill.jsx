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
      const generated = generateHTML(res.data.data, '/Event%20Logo.png', width);
      setHtml(generated);
      // Automatically trigger browser print dialogue after a tiny delay for rendering
      setTimeout(() => {
        window.print();
      }, 500);
    }).catch(err => {
      alert("Error loading bill: " + err.message);
    });
  }, [id, width]);

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
        `}
      </style>
      <div className="print-receipt" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
};

export default PrintBill;
