#!/usr/bin/env node

/**
 * MongoDB Connection Test Script
 * Tests connection to local MongoDB database 'letsbunk'
 */

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/letsbunk';

console.log('🔍 TESTING MONGODB CONNECTION');
console.log('=============================');
console.log(`📡 Connection URI: ${MONGODB_URI}`);
console.log('');

async function testConnection() {
    try {
        console.log('⏳ Connecting to MongoDB...');
        
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 10000,
        });
        
        console.log('✅ Successfully connected to MongoDB!');
        console.log(`📍 Database: ${mongoose.connection.name}`);
        console.log(`🔌 Connection state: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
        console.log(`🏠 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
        
        // List collections
        console.log('\n📋 EXISTING COLLECTIONS:');
        console.log('========================');
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        
        if (collections.length === 0) {
            console.log('📝 No collections found - Database is empty');
            console.log('   Collections will be created automatically when data is added');
        } else {
            collections.forEach((collection, index) => {
                console.log(`${index + 1}. ${collection.name}`);
            });
            
            // Get document counts for each collection
            console.log('\n📊 COLLECTION STATISTICS:');
            console.log('=========================');
            
            for (const collection of collections) {
                try {
                    const count = await mongoose.connection.db.collection(collection.name).countDocuments();
                    console.log(`📄 ${collection.name}: ${count} documents`);
                } catch (error) {
                    console.log(`📄 ${collection.name}: Error counting documents`);
                }
            }
        }
        
        console.log('\n🎯 EXPECTED COLLECTIONS FOR LETSBUNK:');
        console.log('=====================================');
        console.log('📚 studentmanagements - Student records');
        console.log('👨‍🏫 teachers - Teacher records');
        console.log('📅 timetables - Class schedules');
        console.log('📊 attendancerecords - Attendance data');
        console.log('🏫 classrooms - Room and BSSID data');
        console.log('🔔 randomrings - Random verification data');
        
        console.log('\n✅ CONNECTION TEST SUCCESSFUL');
        console.log('============================');
        console.log('🚀 Your server is ready to use the "letsbunk" database');
        console.log('📱 Admin panel will connect to the same database');
        console.log('⚡ All data will be stored in your existing MongoDB instance');
        
    } catch (error) {
        console.log('\n❌ CONNECTION TEST FAILED');
        console.log('=========================');
        console.error('Error:', error.message);
        
        console.log('\n🔧 TROUBLESHOOTING STEPS:');
        console.log('=========================');
        console.log('1. Check if MongoDB is running:');
        console.log('   - Windows: Check Services for "MongoDB"');
        console.log('   - Command: net start MongoDB');
        console.log('');
        console.log('2. Verify MongoDB is listening on port 27017:');
        console.log('   - Command: netstat -an | findstr 27017');
        console.log('');
        console.log('3. Test MongoDB connection manually:');
        console.log('   - Command: mongo mongodb://localhost:27017/letsbunk');
        console.log('');
        console.log('4. Check MongoDB logs for errors');
        
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

testConnection();