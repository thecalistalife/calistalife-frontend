# TheCalista Monorepo (Frontend + Backend)

This repo is now structured with separate frontend and backend apps:

- frontend/ — Vite + React + TypeScript app
- backend/ — Express + TypeScript API

Run both apps:

- npm run dev — starts backend (port 3001) and frontend (port 5174)
- Frontend proxies /api/* to http://localhost:3001

Build:

- npm run build — builds frontend and backend

Environment:

- backend/.env controls API config
- Frontend dev uses proxy; no extra env needed

# TheCalista - Full-Stack E-commerce Application

A modern, full-stack e-commerce application for a streetwear brand, built with React, Node.js, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### 1. Clone and Setup

```bash
git clone <repository-url>
cd thecalista
```

### 2. Frontend Setup

```bash
# Install frontend dependencies
npm install

# Start frontend development server
npm run dev
```

Frontend will be available at: **http://localhost:5174**

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install backend dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env file with your MongoDB connection string
# MONGODB_URI=mongodb://localhost:27017/thecalista

# Start backend development server
npm run dev
```

Backend will be available at: **http://localhost:5000**

### 4. Database Setup

```bash
# In the backend directory, seed the database with sample data
npm run seed
```

## 🏗️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS v4** for styling
- **React Router v7** for routing
- **Zustand** for state management
- **TanStack Query** for data fetching
- **Lucide React** for icons

### Backend
- **Node.js** with TypeScript
- **Express.js** web framework
- **MongoDB** with Mongoose ODM
- **JWT** authentication with bcrypt
- **Express Validator** for input validation
- **Helmet** and CORS for security
- **Rate limiting** for API protection

## 📁 Project Structure

```
thecalista/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/             # Route components
│   ├── store/             # Zustand state management
│   ├── types/             # TypeScript definitions
│   └── utils/             # Utility functions
├── backend/               # Backend Node.js API
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   └── types/         # TypeScript interfaces
│   └── .env              # Environment variables
└── README.md             # This file
```

## 🛠️ Development

### Running Both Frontend and Backend

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

### Available Scripts

#### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

#### Backend Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data

## 🌟 Features

### E-commerce Core
- **Product Catalog** - Browse products with images, prices, descriptions
- **Advanced Filtering** - Filter by category, collection, brand, price, size, color
- **Search & Sort** - Full-text search with multiple sorting options
- **Shopping Cart** - Add/remove items with size and color variants
- **Wishlist** - Save favorite products
- **User Authentication** - Register, login, profile management
- **Address Management** - Multiple shipping addresses

### Technical Features
- **Responsive Design** - Mobile-first approach
- **Type Safety** - Full TypeScript implementation
- **Data Persistence** - Cart and wishlist persist across sessions
- **API Integration** - RESTful API with proper error handling
- **Security** - JWT authentication, input validation, rate limiting
- **Database** - MongoDB with proper indexing and relationships

## 🔧 Environment Configuration

### Backend Environment Variables
Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/thecalista

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# CORS
CLIENT_URL=http://localhost:5174
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Products
- `GET /api/products` - Get all products (with filtering/sorting)
- `GET /api/products/:id` - Get single product
- `GET /api/products/featured` - Get featured products
- `GET /api/products/new-arrivals` - Get new arrivals
- `GET /api/products/best-sellers` - Get best sellers

### Cart & Wishlist
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item
- `DELETE /api/cart/remove` - Remove from cart
- `GET /api/cart/wishlist` - Get wishlist
- `POST /api/cart/wishlist/toggle` - Toggle wishlist item

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run build
vercel --prod
```

### Backend (Railway/Heroku)
```bash
cd backend
npm run build
# Deploy to your preferred platform
```

## 📝 Development Notes

- The frontend currently uses Zustand for client-side state management
- The backend implements comprehensive error handling and validation
- Database models include proper relationships and indexing
- Authentication uses JWT tokens with secure cookie options
- All API endpoints include proper TypeScript typing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**TheCalista** - Built with ❤️ by the development team

---

## Brevo Conversations Chat (optional)

Enable the Brevo chat widget on the storefront.

1) Set environment variables (frontend)
- In frontend/.env.local (or your hosting env):

```
VITE_ENABLE_BREVO_CHAT=true
VITE_BREVO_CONVERSATIONS_ID=68d1094bd5c93c660e0b1fd6
```

2) How it works
- index.html loads the widget only when VITE_ENABLE_BREVO_CHAT === 'true' and the ID is present.
- No build-time secrets; values are read by Vite at runtime.

3) Disable anytime
- Set VITE_ENABLE_BREVO_CHAT=false and redeploy or refresh dev.

## Order email BCC monitor (optional)

Add a mailbox to receive a blind-copy of every order email (confirmed/processing/shipped/etc.).

1) Backend .env

```
# Comma-separated emails
ORDER_EMAIL_BCC=ops@calistalife.com
```

2) Behavior
- The backend automatically BCCs this address (all providers: smtp, brevo, sendgrid, mailgun).
- Orders still succeed even if the BCC delivery fails; failures are logged and queued for retry when applicable.
