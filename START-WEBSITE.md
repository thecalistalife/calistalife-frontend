# 🚀 How to Start TheCalista Website

## Quick Start (2 Terminals Required)

### Prerequisites
- Node.js installed
- Two terminal windows/tabs

### Step 1: Start the Backend API (Terminal 1)
```bash
# Navigate to the project directory
cd C:\Users\khara\OneDrive\Desktop\thecalista

# Go to backend folder
cd backend

# Install dependencies (if not already done)
npm install

# Start the backend server
npm run dev
```

**Expected Output:**
```
🚀 TheCalista Backend Server Started
📍 Server running on port 3001
🌐 Environment: development
🔗 Local URL: http://localhost:3001
💚 Health Check: http://localhost:3001/api/health
📊 API Status: http://localhost:3001/api/status
🛍️  Products: http://localhost:3001/api/products
```

### Step 2: Start the Frontend (Terminal 2)
```bash
# Navigate to the project directory (if not already there)
cd C:\Users\khara\OneDrive\Desktop\thecalista

# Install dependencies (if not already done)
npm install

# Start the frontend development server
npm run dev
```

**Expected Output:**
```
VITE v7.1.6  ready in 1894 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

## 🌐 Access the Website

Once both servers are running:

- **Frontend (Website)**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health
- **API Status**: http://localhost:3001/api/status
- **Products API**: http://localhost:3001/api/products

## ✅ Verification Steps

1. **Backend Check**: Visit http://localhost:3001/api/health
   - Should return JSON with "success": true

2. **Frontend Check**: Visit http://localhost:5173
   - Should show TheCalista website

3. **API Integration**: Check if frontend can fetch data from backend
   - Products should load on the homepage

## 🛠️ Troubleshooting

### Backend Issues
- **Port 3001 already in use**: Change PORT in `backend/.env` file
- **Supabase connection issues**: Check the Supabase credentials in `backend/.env`

### Frontend Issues
- **Port 5173 already in use**: Vite will automatically try the next available port
- **API connection issues**: Ensure backend is running on port 3001

### Common Solutions
- **Stop servers**: Press `Ctrl + C` in the terminal
- **Restart servers**: Run the start commands again
- **Clear cache**: Delete `node_modules` and run `npm install` again

## 📁 Project Structure
```
thecalista/
├── src/                    # Frontend React app
├── backend/               # Backend API server
│   ├── src/server.ts     # Main server file
│   └── .env             # Configuration file
└── START-WEBSITE.md      # This file
```

## 🔧 Configuration Details

The project is configured with:
- **Backend Port**: 3001 (configurable in backend/.env)
- **Frontend Port**: 5173 (auto-assigned by Vite)
- **Database**: Supabase (configured with provided credentials)
- **AI Features**: Gemini AI enabled
- **OAuth**: Google OAuth configured but disabled by default

## 🎯 Next Steps

Once the website is running:
1. Browse the product catalog
2. Test the shopping cart functionality
3. Try the search and filter features
4. Explore the responsive design on different screen sizes

**Need help?** Check the console output in both terminals for any error messages.