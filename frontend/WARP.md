# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.
``

Project type and tooling
- React 19 + TypeScript app built with Vite 7
- Styling and motion: Tailwind CSS (via @tailwindcss/vite), framer-motion, GSAP, Lenis, Locomotive Scroll
- State and data: Zustand (persisted), TanStack Query, Axios
- Monitoring: Sentry + Web Vitals
- PWA: simple service worker at public/sw.js

Commands
- Install deps
  - npm install
- Start dev server (frontend only)
  - npm run dev
  - Vite dev server runs on http://localhost:5174 (strictPort) and proxies /api to http://localhost:3001
- Start dev from monorepo root (per README)
  - From repo root: npm run dev (starts both backend and frontend)
- Build
  - npm run build
  - Output: dist (sourcemaps enabled, chunkSizeWarningLimit: 1500kb)
- Preview a production build
  - npm run preview
- Lint
  - npm run lint

Notes on linting configuration
- ESLint uses the flat config at eslint.config.js (ESLint 9). It targets **/*.ts,tsx with React Hooks and React Refresh presets. Dist is globally ignored.
- A legacy .eslintrc.json exists and extends ../eslint.config.js; with the flat config present, ESLint will typically ignore .eslintrc.*. Prefer the flat config.

Environment and dev server
- VITE_API_URL: If unset or set to "/api", Axios baseURL is empty string and requests use relative paths. With Vite dev proxy (vite.config.ts), /api/* is forwarded to http://localhost:3001.
- VITE_ADMIN_BASE_PATH: Customizes admin route base (default: cl-private-dashboard-2024). Used both in routing and in AdminAPI endpoints.
- VITE_BREVO_MA_SITE_KEY: Enables Brevo (Sendinblue) marketing automation boot/identify/track.
- VITE_SENTRY_DSN: Enables Sentry monitoring initialization.
- VITE_STRIPE_PUBLIC_KEY: Flags whether Stripe features should be enabled (stripe.ts placeholder).

High-level architecture
- Entry and bootstrap (src/main.tsx)
  - Imports global styles (src/index.css), initializes monitoring (src/lib/monitoring.ts: Sentry + Web Vitals), registers a very simple service worker (public/sw.js), and mounts <App /> into #root.
- Application shell and routing (src/App.tsx)
  - Providers: wraps app in TanStack QueryClientProvider. Uses React Router for all navigation.
  - Global UI: NavigationAnimated, FreeShippingBar, MiniCartDrawer, Toaster, ThemeShiftController, ColorGradeOverlay; SmoothScrollProvider wraps content for smooth scrolling.
  - Protected routes: A minimal ProtectedRoute component redirects unauthenticated users to /login. Sensitive pages like Checkout, OrderSuccess, Orders, OrderDetails, and Profile are wrapped with it.
  - Admin area: AdminLogin, AdminDashboard and management pages live under src/admin and are mounted under a dynamic base path (VITE_ADMIN_BASE_PATH).
- State management (src/store)
  - Auth store (src/store/auth.ts) persists user/token, coordinates with AuthAPI, and synchronizes cart data (merge guest cart on login/register, clear on logout) via cartSync helpers.
- Data layer (src/lib)
  - Axios client (src/lib/api.ts) sets baseURL based on VITE_API_URL and attaches Bearer tokens from localStorage. It implements a 401 refresh flow with request queuing to avoid thundering herds.
  - API groupings: AuthAPI, PaymentsAPI (Stripe intent + Razorpay), OrdersAPI (customer endpoints), MarketingAPI, CartAPI, and AdminAPI (admin endpoints use the dynamic admin base path).
  - Monitoring (src/lib/monitoring.ts): Sentry/init + Web Vitals forwarding to Sentry breadcrumbs.
  - Marketing automation: hooks/useBrevo.ts and lib/brevoTracker.ts load Brevo, identify users, and track key events like product views and cart updates.
- Features and pages (src/pages, src/components)
  - Pages implement the e-commerce flow (Home, Collections, Category alias, Product, Cart, Checkout, Orders, OrderDetails, Auth screens). Index re-exports provide simple aliases for some routes.
  - Components include commerce UI (ProductCard/Gallery, MiniCartDrawer, RazorpayCheckout/StripeCheckoutForm) and animation/UX helpers. Tailwind CSS utilities are used throughout.
- PWA
  - public/sw.js provides a network-first cache strategy for basic offline support and caching of core assets.

Repository guidance integration
- README.md highlights dev commands: from repo root, npm run dev starts both backend and frontend; inside ./frontend, npm run dev starts only the frontend. Those behaviors are preserved above.
- No CLAUDE.md, Cursor rules, or Copilot instruction files were found in this repository.

Testing
- No test runner or scripts were found (no Jest/Vitest/Cypress/Playwright configs). Test commands are therefore not defined in package.json.
