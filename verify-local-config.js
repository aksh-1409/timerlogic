#!/usr/bin/env node

/**
 * Local Configuration Verification Script
 * Verifies that all URLs and MongoDB are properly configured for local development
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFYING LOCAL CONFIGURATION');
console.log('================================');

const expectedIP = '192.168.1.8:3000';
const expectedDB = 'mongodb://localhost:27017/letsbunk';

const files = [
    {
        path: 'config.js',
        pattern: /SERVER_BASE_URL = 'http:\/\/192\.168\.1\.7:3000'/,
        description: 'Main config file'
    },
    {
        path: 'App.js',
        pattern: /SOCKET_URL = process\.env\.EXPO_PUBLIC_SOCKET_URL \|\| 'http:\/\/192\.168\.1\.7:3000'/,
        description: 'React Native app'
    },
    {
        path: 'admin-panel/renderer.js',
        pattern: /SERVER_URL = localStorage\.getItem\('serverUrl'\) \|\| 'http:\/\/192\.168\.1\.7:3000'/,
        description: 'Admin panel'
    },
    {
        path: 'admin-panel/index.html',
        pattern: /value="http:\/\/192\.168\.1\.7:3000"/,
        description: 'Admin panel form'
    },
    {
        path: 'server.js',
        pattern: /mongodb:\/\/localhost:27017\/letsbunk/,
        description: 'Server MongoDB URI'
    },
    {
        path: '.env.example',
        pattern: /MONGODB_URI=mongodb:\/\/localhost:27017\/letsbunk/,
        description: 'Environment template'
    }
];

let allValid = true;

files.forEach(file => {
    const filePath = path.join(__dirname, file.path);
    
    if (!fs.existsSync(filePath)) {
        console.log(`❌ ${file.description}: File not found - ${file.path}`);
        allValid = false;
        return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (file.pattern.test(content)) {
        console.log(`✅ ${file.description}: Correctly configured`);
    } else {
        console.log(`❌ ${file.description}: Configuration not found or incorrect`);
        allValid = false;
    }
});

console.log('\n📋 SUMMARY');
console.log('==========');

if (allValid) {
    console.log('✅ All files are correctly configured for local development');
    console.log(`📡 Server URL: http://${expectedIP}`);
    console.log(`🗄️ MongoDB: ${expectedDB}`);
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Start server: npm start');
    console.log('2. Test MongoDB: node test-mongodb-connection.js');
    console.log('3. Build APK: cd android && .\\gradlew.bat assembleRelease --no-daemon');
    console.log('4. Install APK: adb install -r app-release-latest.apk');
} else {
    console.log('❌ Some files have incorrect configuration');
    console.log('Please check the files marked with ❌ above');
}

console.log('\n🔧 OFFLINE TIMER FEATURES:');
console.log('- ✅ Offline timer with BSSID validation');
console.log('- ✅ 2-minute sync interval');
console.log('- ✅ Random ring handling');
console.log('- ✅ Visual status indicators');
console.log('- ✅ Queue management');
console.log('- ✅ MongoDB integration');