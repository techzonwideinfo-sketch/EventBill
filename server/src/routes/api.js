import express from 'express';
import { register, login, getMe, updateProfile, updatePassword, forgotPassword, resetPassword } from '../controllers/authController.js';
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController.js';
import { getBills, getBill, createBill, updateBill, deleteBill, useAsNew } from '../controllers/billController.js';
import { getEventTypes, createEventType, updateEventType, deleteEventType } from '../controllers/eventTypeController.js';
import { getPdf, getPublicBill } from '../controllers/pdfController.js';
import { shareBillViaWhatsApp } from '../controllers/whatsappController.js';
import { getStats } from '../controllers/dashboardController.js';
import { recordPayment, updatePaymentSettings, createDynamicQR, handleWebhook, getPaymentStatus } from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: "Event Bill API is running" });
});

router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/forgot-password', forgotPassword);
router.put('/auth/reset-password/:token', resetPassword);
router.get('/auth/me', protect, getMe);
router.put('/auth/profile', protect, updateProfile);
router.put('/auth/password', protect, updatePassword);

router.get('/event-types', protect, getEventTypes);
router.post('/event-types', protect, createEventType);
router.put('/event-types/:id', protect, updateEventType);
router.delete('/event-types/:id', protect, deleteEventType);


router.get('/customers', protect, getCustomers);
router.get('/customers/:id', protect, getCustomer);
router.post('/customers', protect, createCustomer);
router.put('/customers/:id', protect, updateCustomer);
router.delete('/customers/:id', protect, deleteCustomer);

router.get('/bills', protect, getBills);
router.get('/bills/:id', protect, getBill);
router.post('/bills', protect, createBill);
router.put('/bills/:id', protect, updateBill);
router.delete('/bills/:id', protect, deleteBill);
router.post('/bills/:id/use-as-new', protect, useAsNew);
router.post('/bills/:id/whatsapp', protect, shareBillViaWhatsApp);
router.get('/bills/:id/pdf', protect, getPdf);
router.post('/bills/:id/payments', protect, recordPayment);
router.post('/bills/:id/dynamic-qr', protect, createDynamicQR);
router.get('/payments/:id/status', protect, getPaymentStatus);
router.post('/payments/webhook', handleWebhook);
router.get('/bills/public/:token', getPublicBill);

router.put('/settings/payments', protect, updatePaymentSettings);

router.get('/dashboard/stats', protect, getStats);

export default router;
