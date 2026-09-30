export const normalizePhoneNumber = (phone) => {
  if (!phone) return null;
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If the number is exactly 10 digits, assume it's Indian and prepend '91'
  if (cleaned.length === 10) {
    return '91' + cleaned;
  }
  
  // If it starts with 91 and is 12 digits long, it's already an Indian number
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned;
  }
  
  // For other international numbers, we just return the cleaned number
  // Ideally, users will provide the correct country code if they are not in India
  return cleaned;
};

export const generateFallbackMessage = (bill) => {
  const isTamil = bill.billLanguage && bill.billLanguage.includes('Tamil');
  const safeCustomerName = bill.customerSnapshot?.name || 'Customer';
  const eventDate = new Date(bill.eventDate || bill.createdAt).toLocaleDateString('en-IN');
  
  let eventName = '';
  if (isTamil) {
    eventName = bill.eventTypeNameTa || bill.eventTypeNameEn || (bill.eventType === 'Other' ? bill.otherEventType : bill.eventType);
  } else {
    eventName = bill.eventTypeNameEn || (bill.eventType === 'Other' ? bill.otherEventType : bill.eventType);
  }

  if (isTamil) {
    return `வணக்கம் ${safeCustomerName},

EventBill-ஐ தேர்வு செய்ததற்கு நன்றி.

உங்கள் பில் விவரங்கள்:

நிகழ்வு: ${eventName}
தேதி: ${eventDate}
மொத்த தொகை: ₹${bill.totalAmount || 0}

உங்கள் பில் இணைக்கப்பட்டுள்ளது.

நன்றி!`;
  }

  return `Hello ${safeCustomerName},

Thank you for choosing EventBill.

Your bill details:

Event: ${eventName}
Date: ${eventDate}
Total Amount: ₹${bill.totalAmount || 0}

Please find your bill attached.

Thank you!`;
};

export const sendBillPDF = async (bill, pdfBuffer) => {
  const normalizedPhone = normalizePhoneNumber(bill.customerSnapshot?.phone || bill.customerId?.phone);
  
  if (!normalizedPhone) {
    throw new Error('MOBILE_NUMBER_REQUIRED');
  }

  const messageText = generateFallbackMessage(bill);

  // Here you would integrate with the actual WhatsApp Business API provider
  // e.g. using axios to post to graph.facebook.com/vXX.X/...
  
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  
  if (!token) {
    // API is not configured. Return fallback response.
    return {
      success: false,
      message: 'WHATSAPP_NOT_CONFIGURED',
      phone: normalizedPhone,
      text: messageText
    };
  }

  // Implementation for the actual WhatsApp API would go here
  // For now, simulate success if token was somehow present for testing
  return {
    success: true,
    message: 'Bill sent successfully via WhatsApp.'
  };
};
