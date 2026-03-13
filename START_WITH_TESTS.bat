@echo off
echo ========================================
echo 🚀 LETSBUNK STARTUP WITH TESTS
echo ========================================
echo.

echo 🔍 Step 1: Verifying Configuration...
node verify-local-config.js
echo.

echo 🗄️ Step 2: Testing MongoDB Connection...
node test-mongodb-connection.js
echo.

echo 📡 Step 3: Starting Server...
echo Server URL: https://aprilbunk.onrender.com
echo MongoDB: mongodb://localhost:27017/letsbunk
echo.
echo ⏳ Starting server (Press Ctrl+C to stop)...
echo.

npm start

echo.
echo ❌ Server stopped
pause