import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/api.js';

dotenv.config();
connectDB();

const app = express();
app.use(express.json({ 
  limit: '5mb',
  verify: (req, res, buf) => {
    if (req.originalUrl.includes('/webhook')) {
      req.rawBody = buf;
    }
  }
}));
const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, '') : null;
const allowedOrigins = [
  clientUrl,
  'http://localhost:5173',
  'http://localhost:3000',
  'app://index.html',
  'app://-', // Some versions of electron might send this
  'app://.'  // Other versions might send this
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet());

app.use('/api', apiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
