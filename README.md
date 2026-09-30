# Event Bill Management System

A production-ready bilingual (English & Tamil) billing application for event management businesses.

## Features
- **Authentication**: JWT-based secure login and registration.
- **Dashboard**: Real-time overview of total bills, amounts, and recent invoices.
- **Bilingual Interface**: Seamlessly switch between English and Tamil.
- **Bill Management**: Create, Edit, and Delete bills with dynamic service items.
- **"Use as New"**: Effortlessly clone an old bill to create a brand-new one without modifying the original.
- **PDF Generation**: Professional A4 PDF generation (using Puppeteer) with built-in Tamil Unicode font support (`Noto Sans Tamil`).
- **Customer Management**: Maintain a central customer repository. Customer data is snapshotted inside bills to preserve historical accuracy.
- **Secure Architecture**: Complete data isolation. A user can only access their own bills and customers. Financials are securely recalculated on the backend.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, React Router, Context API, Axios.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Puppeteer, JWT, bcryptjs.

## Local Setup

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)

### 2. Backend Setup
\`\`\`bash
cd server
npm install
# Add .env configuration if necessary (default provided works for local MongoDB)
npm run start
\`\`\`

### 3. Frontend Setup
\`\`\`bash
cd client
npm install
npm run dev
\`\`\`

## Seed Demo Data (Important for Demo)
To populate the database with realistic sample data for demonstration:
\`\`\`bash
cd server
node src/seeds/demoSeed.js
\`\`\`
**Demo Credentials:**
- Email: \`demo@eventbill.local\`
- Password: \`Demo@12345\`

## PDF Engine Setup
The backend uses Puppeteer. It will download the appropriate Chrome binary automatically during `npm install`. If you run into issues on production platforms (like Render), you may need to configure the Puppeteer build cache or rely on external Chrome dependencies.

## Production Checklist
- Change \`JWT_SECRET\` to a strong random string.
- Point \`MONGODB_URI\` to a secure MongoDB Atlas cluster.
- In \`client/src/services/api.js\`, update the Axios base URL to the production backend URL.
- Run \`npm run build\` in the \`client\` folder and deploy the \`dist\` folder to Vercel/Netlify.
- Deploy the \`server\` folder to Render, ensuring all environment variables are correctly mapped.
