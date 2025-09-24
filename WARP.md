# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

TheCalista is a full-stack e-commerce application for a streetwear brand. The frontend is built with React 19 + TypeScript + Vite, while the backend uses Node.js + Express + MongoDB. It features a complete shopping experience with user authentication, product browsing, filtering, cart management, and wishlist functionality.

## Development Commands

### Frontend Development
```bash
# Start frontend development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run linter
npm run lint
```

### Backend Development
```bash
# Navigate to backend directory
cd backend

# Start backend development server (runs on http://localhost:5000)
npm run dev

# Build backend
npm run build

# Start production server
npm start

# Seed database with sample data
npm run seed
```

### Full-Stack Development
```bash
# Terminal 1: Start frontend
npm run dev

# Terminal 2: Start backend
cd backend && npm run dev
```

### Deployment Commands
```bash
# Deploy to Vercel (production)
vercel --prod

# Deploy to Vercel (preview)
vercel

# Build and deploy to Netlify
npm run build
npx netlify deploy --prod --dir=dist

# Deploy to GitHub Pages
npm run build
npx gh-pages -d dist
```

## Architecture Overview

### Tech Stack

#### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7 with React plugin
- **Styling**: Tailwind CSS v4 with Vite plugin
- **Routing**: React Router DOM v7
- **State Management**: Zustand with persistence middleware
- **Data Fetching**: TanStack Query (React Query)
- **Icons**: Lucide React

#### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt
- **Security**: Helmet, CORS, Rate limiting
- **Validation**: Express Validator
- **File Uploads**: Multer (configured)
- **Payments**: Stripe integration (ready)

### Project Structure

#### Frontend Structure
```
src/
├── components/          # Reusable UI components
│   ├── Navigation.tsx   # Header with mobile/desktop nav
│   ├── Hero.tsx        # Homepage hero section
│   ├── ProductCard.tsx # Product display component
│   └── Footer.tsx      # Site footer
├── pages/              # Route components
│   ├── Home.tsx        # Homepage with hero and featured content
│   ├── Collections.tsx # Product listing with filters and search
│   ├── Product.tsx     # Individual product detail page
│   └── index.tsx       # Page exports and placeholder pages
├── store/              # Zustand stores
│   └── index.ts        # Cart, wishlist, and search state management
├── data/               # Mock data and constants
│   └── index.ts        # Products, collections, categories, etc.
├── types/              # TypeScript type definitions
│   └── index.ts        # Product, CartItem, WishlistItem, etc.
├── utils/              # Utility functions
│   └── index.ts        # Filtering, sorting, formatting utilities
└── assets/             # Images and static files
```

#### Backend Structure
```
backend/
├── src/
│   ├── controllers/     # Route controllers
│   │   ├── auth.ts     # Authentication endpoints
│   │   ├── products.ts # Product CRUD operations
│   │   └── cart.ts     # Cart and wishlist management
│   ├── models/         # Mongoose models
│   │   ├── User.ts     # User model with authentication
│   │   ├── Product.ts  # Product model with full e-commerce features
│   │   ├── Cart.ts     # Shopping cart model
│   │   └── index.ts    # Additional models (Order, Wishlist, Collection)
│   ├── routes/         # Express routes
│   │   ├── auth.ts     # Authentication routes
│   │   ├── products.ts # Product API routes
│   │   ├── cart.ts     # Cart and wishlist routes
│   │   └── orders.ts   # Order management routes
│   ├── middleware/     # Express middleware
│   │   ├── auth.ts     # JWT authentication middleware
│   │   └── index.ts    # Error handling, validation, rate limiting
│   ├── utils/          # Utility functions
│   │   └── auth.ts     # JWT utilities
│   ├── types/          # TypeScript interfaces
│   │   └── index.ts    # API types and interfaces
│   ├── scripts/        # Database scripts
│   │   └── seed.ts     # Database seeding script
│   └── index.ts        # Main server file
├── uploads/            # File upload directory
├── .env                # Environment variables
└── package.json        # Backend dependencies
```

### State Management Architecture

The application uses Zustand for client-side state management with three main stores:

1. **Cart Store** (`useCartStore`): Manages shopping cart items with persistence
   - Add/remove/update cart items with size and color variants
   - Cart visibility toggle
   - Total calculations

2. **Wishlist Store** (`useWishlistStore`): Manages saved favorite items with persistence
   - Add/remove wishlist items
   - Wishlist status checking

3. **Search Store** (`useSearchStore`): Manages product filtering and search
   - Search query handling
   - Filter options (categories, collections, brands, price range, sizes, colors)
   - Sort options (featured, newest, price, name)

### Data Layer

- **Mock Data**: Products and collections are currently defined in `src/data/index.ts`
- **Product Model**: Comprehensive product schema with images, variants, pricing, inventory
- **Filtering System**: Advanced filtering by category, collection, brand, price, size, color, and stock status
- **Sorting Options**: Featured (best sellers + new + rating), newest, price (low/high), alphabetical

### Component Architecture

- **Atomic Design**: Components are organized into reusable UI elements
- **Route-based Code Splitting**: Pages are separate components for better performance
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **TypeScript**: Full type safety across all components and utilities

## Development Guidelines

### Working with Products
- Product data is currently mock data in `src/data/index.ts`
- Each product has comprehensive metadata: variants (size/color), pricing, inventory, ratings
- Use the `filterProducts` and `sortProducts` utilities for consistent data handling

### State Management Patterns
- Use Zustand stores for global state (cart, wishlist, search)
- Cart and wishlist state is persisted to localStorage automatically
- Search/filter state is ephemeral and resets on page refresh

### Styling Guidelines
- Tailwind CSS v4 with Vite plugin for optimal performance
- Mobile-first responsive design
- Consistent spacing and typography scale
- Brand colors: Black primary, orange accent (#ff6b35)

### Route Structure
- SPA with client-side routing (React Router)
- Vercel.json configured for proper SPA deployment
- SEO-friendly URLs with product IDs and category slugs

### TypeScript Patterns
- Strict type checking enabled
- Comprehensive type definitions in `src/types/index.ts`
- Use of discriminated unions for product variants and states

## Testing and Quality

### Linting
- ESLint configured with TypeScript support
- React hooks and refresh plugins enabled
- Strict configuration for production applications

### Build Process
- TypeScript compilation with strict checking
- Vite build with optimizations
- Production builds output to `dist/` directory

## Deployment Configuration

### Vercel (Recommended)
- `vercel.json` configured for SPA routing
- Automatic deployments from Git branches
- CORS headers pre-configured for API routes

### Environment Variables
For production deployment, create `.env.local`:
```env
VITE_API_URL=https://api.example.com
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

## Key Files to Understand

- `src/App.tsx`: Main application component with routing setup
- `src/store/index.ts`: Global state management configuration
- `src/utils/index.ts`: Core utility functions for product filtering/sorting
- `vite.config.ts`: Build configuration with path aliases
- `vercel.json`: Deployment configuration for SPA routing

## Common Development Tasks

### Adding New Products
1. Add product data to `src/data/index.ts`
2. Ensure all required fields match the `Product` interface
3. Add corresponding product images to assets

### Creating New Pages
1. Create component in `src/pages/`
2. Add route to `src/App.tsx`
3. Export from `src/pages/index.tsx`
4. Update navigation in `src/components/Navigation.tsx`

### Modifying Filters
1. Update `FilterOptions` type in `src/types/index.ts`
2. Modify `filterProducts` function in `src/utils/index.ts`
3. Update search store in `src/store/index.ts`
4. Add UI controls in Collections page

### Working with Cart/Wishlist
- Cart items include product + size + color variants
- Both stores use Zustand persistence middleware
- State is automatically synced across browser tabs