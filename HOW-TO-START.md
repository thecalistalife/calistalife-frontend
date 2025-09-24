# 🚀 TheCalista Website - Start Instructions

## ✅ Ready to Launch!

Your TheCalista full-stack e-commerce website is configured and ready to run with the provided SXUDO credentials.

## 📋 What You Need

- **2 Terminal Windows** (PowerShell, Command Prompt, or any terminal)
- **Node.js** (already installed)

## 🎯 Step-by-Step Launch

### Terminal 1: Start Backend API

```powershell
# Navigate to project
cd C:\Users\khara\OneDrive\Desktop\thecalista\backend

# Start backend server
npm run dev
```

**✅ Success Output:**
```
🔧 Configuration loaded:
   - Supabase URL: Configured ✅
   - Google OAuth: Configured ✅  
   - Gemini AI: Configured ✅
🚀 TheCalista Backend Server Started
📍 Server running on port 3001
🔗 Local URL: http://localhost:3001
💚 Health Check: http://localhost:3001/api/health
🛍️  Products: http://localhost:3001/api/products
```

### Terminal 2: Start Frontend Website

```powershell
# Navigate to project root
cd C:\Users\khara\OneDrive\Desktop\thecalista

# Start frontend
npm run dev
```

**✅ Success Output:**
```
VITE v7.1.6  ready in 1894 ms

➜  Local:   http://localhost:5174/
➜  Network: use --host to expose
```

## 🌐 Access Your Website

Once both servers are running:

| Service | URL | Description |
|---------|-----|-------------|
| **🛍️ Main Website** | http://localhost:5174 | TheCalista e-commerce store |
| **🔧 Backend API** | http://localhost:3001 | API server |
| **💚 Health Check** | http://localhost:3001/api/health | Server status |
| **📊 API Status** | http://localhost:3001/api/status | Configuration info |
| **🛒 Products API** | http://localhost:3001/api/products | Sample products |

## ⚡ Quick Test

1. **Open** http://localhost:5174 in your browser
2. **Verify** you see the TheCalista website
3. **Check** that products load on the homepage
4. **Test** the navigation and shopping features

## 🛠️ Configuration Details

The backend is configured with your SXUDO credentials:

- ✅ **Supabase Database**: Connected and ready
- ✅ **Google OAuth**: Configured (disabled by default)
- ✅ **Gemini AI**: Ready for enhanced features  
- ✅ **Security**: JWT authentication enabled
- ✅ **CORS**: Configured for frontend communication

## 🎨 Website Features

Your website includes:

- 🛍️ **Product Catalog** - Browse streetwear products
- 🔍 **Search & Filter** - Advanced product filtering
- 🛒 **Shopping Cart** - Add/remove items with variants
- ❤️ **Wishlist** - Save favorite products
- 📱 **Responsive Design** - Works on all devices
- 🎯 **Modern UI** - Clean, minimalist streetwear aesthetic

## 🚨 Troubleshooting

### Backend Won't Start
- Check if port 3001 is available
- Verify `.env` file exists in `backend/` folder

### Frontend Won't Start  
- Vite will auto-select next available port
- Check terminal for any error messages

### Can't Connect
- Ensure both servers are running
- Check URLs are correct (5174 for frontend, 3001 for backend)

## 🔄 To Stop Servers

In each terminal window, press: **Ctrl + C**

## 🎉 You're All Set!

Your TheCalista e-commerce website is now running with:
- Modern React frontend
- Node.js API backend  
- Supabase database integration
- AI-ready configuration
- Production-ready architecture

**Enjoy building your streetwear empire!** 🔥