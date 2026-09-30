import Bill from '../models/Bill.js';
import { generatePdfBuffer } from '../services/pdfService.js';
import { sendBillPDF } from '../services/whatsappService.js';

export const shareBillViaWhatsApp = async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, userId: req.user.id }).populate('customerId');
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    // Generate the PDF buffer
    let pdfBuffer;
    try {
      pdfBuffer = await generatePdfBuffer(bill);
    } catch (e) {
      console.error('Error generating PDF for WhatsApp:', e);
      return res.status(500).json({ success: false, message: 'Failed to generate PDF for sharing' });
    }

    // Call WhatsApp service
    try {
      const result = await sendBillPDF(bill, pdfBuffer);
      return res.json(result);
    } catch (err) {
      if (err.message === 'MOBILE_NUMBER_REQUIRED') {
        return res.status(400).json({ success: false, message: 'Customer mobile number is required to share via WhatsApp.' });
      }
      throw err;
    }
  } catch (err) {
    console.error('shareBillViaWhatsApp error:', err);
    res.status(500).json({ success: false, message: 'Server error while processing WhatsApp request' });
  }
};
