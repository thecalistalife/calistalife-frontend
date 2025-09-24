# Database Setup Guide

## Option 1: MongoDB Atlas (Recommended for Production)

1. **Create MongoDB Atlas Account**:
   - Go to https://www.mongodb.com/atlas
   - Sign up for a free account
   - Create a new project called "TheCalista"

2. **Create a Cluster**:
   - Choose "M0 Sandbox" (free tier)
   - Select a region close to you
   - Name it "thecalista-cluster"

3. **Set up Database Access**:
   - Go to "Database Access" in sidebar
   - Click "Add New Database User"
   - Username: `thecalista_user`
   - Password: Generate a secure password
   - Database User Privileges: "Read and write to any database"

4. **Configure Network Access**:
   - Go to "Network Access" in sidebar
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (0.0.0.0/0) for development
   - For production, add specific IP addresses

5. **Get Connection String**:
   - Go to "Database" and click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Update your `.env` file:
     ```
     MONGODB_URI=mongodb+srv://thecalista_user:<password>@thecalista-cluster.xxxxx.mongodb.net/thecalista?retryWrites=true&w=majority
     ```

## Option 2: Local MongoDB (For Development)

1. **Install MongoDB Community Server**:
   - Download from https://www.mongodb.com/try/download/community
   - Follow installation instructions for Windows
   - MongoDB will run on port 27017 by default

2. **Update .env file**:
   ```
   MONGODB_URI=mongodb://localhost:27017/thecalista
   ```

## Testing Database Connection

1. **Start your backend server**:
   ```bash
   npm run dev
   ```

2. **Look for success message**:
   ```
   ✅ MongoDB Connected Successfully
   📍 Database: thecalista
   ```

3. **Test API endpoint**:
   - Visit: http://localhost:10000/api/health
   - Should return: `{"success": true, "message": "TheCalista API is running"}`

## Initial Data Setup

Once connected, you can:

1. **Create a test user** via the API:
   ```bash
   # Using PowerShell
   $body = @{ name = "Test User"; email = "test@example.com"; password = "password123" } | ConvertTo-Json
   Invoke-RestMethod -Method POST -Uri "http://localhost:10000/api/auth/register" -ContentType "application/json" -Body $body
   ```

2. **Verify user creation**:
   - Check the MongoDB database
   - User password should be hashed with bcrypt

## Troubleshooting

- **Connection timeout**: Check network access settings in Atlas
- **Authentication failed**: Verify username/password in connection string
- **Database not found**: MongoDB will create the database automatically when first document is inserted
- **Local MongoDB not running**: Start MongoDB service or check installation