import puppeteer from 'puppeteer';
import Bill from '../models/Bill.js';
import { generatePdfBuffer } from '../services/pdfService.js';

import fs from 'fs';
import path from 'path';

export const getPdf = async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, userId: req.user.id }).populate('customerId');
    if (!bill) return res.status(404).json({ success: false, message: 'Not found' });

    const pdfBuffer = await generatePdfBuffer(bill);

    const safeCustomerName = bill.customerSnapshot?.name ? bill.customerSnapshot.name.replace(/[^a-z0-9]/gi, '_') : 'Customer';
    const filename = `MOI-BILL-${bill.billNumber}-${safeCustomerName}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (err) { 
    console.error('getPdf error:', err);
    res.status(500).json({ success: false, message: 'Server error while generating PDF' }); 
  }
};


export const getPublicBill = async (req, res) => {
  try {
    const bill = await Bill.findOne({ publicToken: req.params.token });
    if (!bill) return res.status(404).json({ success: false, message: 'Not found' });
    // Remove sensitive data before sending
    const sanitizedBill = bill.toObject();
    delete sanitizedBill.userId;
    delete sanitizedBill._id;
    delete sanitizedBill.customerId;
    res.json({ success: true, data: sanitizedBill });
  } catch (err) { 
    console.error('getPublicBill error:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching public bill' }); 
  }
};
