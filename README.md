# Aleen Clothing - Inventory & Sales Management System

A complete React application for managing women's clothing store inventory, invoices, and reports.

## Features

- **Dashboard**: Quick stats (today's sales, low-stock items, recent invoices)
- **Inventory Management**: Add, edit, delete items with search and filters
- **Invoice Generation**: Create invoices, auto-update inventory, export to PDF
- **Sales Reports**: Date range filters, charts, PDF export
- **Inventory Reports**: Stock level filters, CSV/PDF export
- **Authentication**: Secure login with Firebase

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Create Firestore Database (Start in test mode)
5. Get your Firebase config from Project Settings
6. Update `src/firebase.js` with your config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Create Firebase User

In Firebase Console > Authentication > Users, add a user with email/password.

### 4. Run the Application

```bash
npm start
```

The app will open at `http://localhost:3000`

## Project Structure

```
src/
├── components/
│   └── Layout.js          # Navigation layout
├── contexts/
│   ├── AuthContext.js     # Authentication state
│   └── DataContext.js     # Inventory & invoice state
├── pages/
│   ├── Dashboard.js       # Home page with stats
│   ├── Inventory.js       # Inventory management
│   ├── Invoices.js        # Invoice generation
│   ├── SalesReports.js    # Sales analytics
│   ├── InventoryReports.js # Inventory analytics
│   └── Login.js           # Authentication
├── App.js                 # Main app with routing
├── firebase.js            # Firebase configuration
└── index.js               # Entry point
```

## Deployment

### Deploy to Netlify

1. Build the app:
```bash
npm run build
```

2. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

3. Deploy:
```bash
netlify deploy --prod --dir=build
```

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel --prod
```

## Usage

1. **Login**: Use the email/password created in Firebase
2. **Add Inventory**: Navigate to Inventory > Add Item
3. **Create Invoice**: Navigate to Invoices > New Invoice
4. **View Reports**: Check Sales Reports or Inventory Reports with filters
5. **Export Data**: Use PDF/CSV export buttons in reports

## Technologies

- React 18 with Hooks
- React Router v6
- Material-UI v5
- Firebase (Auth + Firestore)
- Chart.js for visualizations
- jsPDF for PDF generation

## Theme

Soft pastel colors (pink/purple) optimized for women's clothing store aesthetic.

## Mobile Responsive

Fully responsive design works on desktop, tablet, and mobile devices.
