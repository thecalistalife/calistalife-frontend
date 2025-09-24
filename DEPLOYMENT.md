# TheCalista - Deployment Guide

## 🚀 Development

### Start Development Server
```bash
npm run dev
```
Development server will be available at: **http://localhost:5173/**

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🌐 Deployment

### Deploy to Vercel

#### Option 1: Vercel CLI (Recommended)
```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy from project root
vercel

# For production deployment
vercel --prod
```

#### Option 2: GitHub Integration
1. Push your code to GitHub:
   ```bash
   git remote add origin https://github.com/yourusername/thecalista.git
   git branch -M main
   git push -u origin main
   ```

2. Connect your GitHub repo to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect Vite settings
   - Deploy!

### Deploy to Other Platforms

#### Netlify
```bash
npm run build
# Upload the 'dist' folder to Netlify, or use the Netlify CLI:
npx netlify deploy --prod --dir=dist
```

#### GitHub Pages
```bash
npm install --save-dev gh-pages
npm run build
npx gh-pages -d dist
```

## 📦 Project Structure

```
thecalista/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Navigation.tsx  # Header with mobile/desktop nav
│   │   ├── Hero.tsx       # Homepage hero section
│   │   ├── ProductCard.tsx # Product display card
│   │   └── Footer.tsx     # Site footer
│   ├── pages/             # Route components
│   │   ├── Home.tsx       # Homepage
│   │   ├── Collections.tsx # Products listing with filters
│   │   ├── Product.tsx    # Product detail page
│   │   └── index.tsx      # Page exports
│   ├── store/             # Zustand state management
│   ├── data/              # Mock data and API calls
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── assets/            # Images and static files
├── vercel.json            # Vercel SPA configuration
└── vite.config.ts         # Vite configuration
```

## ✨ Features Implemented

### 🛍️ E-commerce Core
- **Product Catalog** - Browse products with images, prices, descriptions
- **Search & Filter** - Search by name/brand/tags, filter by category, price, size, color
- **Sort Options** - Featured, newest, price (high/low), alphabetical
- **Shopping Cart** - Add/remove items, persistent cart with Zustand
- **Wishlist** - Save favorite items, heart toggle
- **Product Details** - Size/color selection, image gallery, quantity picker

### 🎨 UI/UX
- **Mobile-First Responsive** - Works perfectly on all screen sizes
- **Modern Design** - Clean, minimalist streetwear aesthetic
- **Smooth Animations** - Hover effects, transitions, loading states
- **Accessibility** - Proper ARIA labels, keyboard navigation

### ⚡ Technical
- **React 18** with TypeScript for type safety
- **Vite** for lightning-fast development and builds
- **Tailwind CSS v4** for utility-first styling
- **React Router** for client-side navigation
- **Zustand** for simple, fast state management
- **Lucide React** for consistent iconography

### 📱 Pages & Navigation
- **Home** - Hero, featured collections, new arrivals, newsletter
- **Collections** - Product grid with advanced filtering
- **Product Detail** - Full product information, size/color selection
- **Cart** - Shopping cart management
- **Wishlist** - Saved items
- **About** - Brand story and values
- **Contact** - Contact form and information
- **404** - Custom not found page

## 🔧 Configuration

### Environment Variables (Optional)
Create `.env.local` for any API keys or configuration:
```env
VITE_API_URL=https://api.example.com
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

### Tailwind CSS v4
The project uses the latest Tailwind CSS v4 with Vite plugin for optimal performance.

## 📋 TODO for Production

- [ ] Add real product images and data
- [ ] Implement user authentication
- [ ] Add payment processing (Stripe/PayPal)
- [ ] Set up email notifications
- [ ] Add product reviews and ratings
- [ ] Implement inventory management
- [ ] Add analytics (Google Analytics/Mixpanel)
- [ ] Set up error monitoring (Sentry)
- [ ] Add SEO meta tags and sitemap
- [ ] Implement email marketing integration

## 🚨 Quick Commands Summary

```bash
# Development
npm run dev                 # Start dev server

# Production
npm run build              # Build for production
npm run preview            # Preview production build

# Deployment
vercel                     # Deploy to Vercel
vercel --prod             # Deploy to production

# Git workflow
git add .                  # Stage changes
git commit -m "message"    # Commit changes
git push                   # Push to remote
```

## 🌟 Local Development URL

Your development server is running at:
**http://localhost:5173/**

Enjoy building with TheCalista! 🎉