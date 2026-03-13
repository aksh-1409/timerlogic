const { MongoClient } = require('mongodb');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://Letsbunk:<is mine>@cluster0.9mxhgcc.mongodb.net/?appName=Cluster0';

async function testMongoDBAtlas() {
    console.log('🔍 Testing MongoDB Atlas Connection...');
    console.log('📡 URI:', MONGODB_URI.replace(/:[^:@]*@/, ':****@')); // Hide password in logs
    
    let client;
    
    try {
        // Connect to MongoDB Atlas
        console.log('\n⏳ Connecting to MongoDB Atlas...');
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        
        console.log('✅ Successfully connected to MongoDB Atlas!');
        
        // Get database list
        console.log('\n📋 Available Databases:');
        const adminDb = client.db().admin();
        const databases = await adminDb.listDatabases();
        
        databases.databases.forEach((db, index) => {
            console.log(`${index + 1}. ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
        });
        
        // Check specific databases for LetsBunk/TimerLogic data
        const commonDbNames = ['letsbunk', 'timerlogic', 'attendance', 'attendance_app', 'test'];
        
        for (const dbName of commonDbNames) {
            try {
                const db = client.db(dbName);
                const collections = await db.listCollections().toArray();
                
                if (collections.length > 0) {
                    console.log(`\n📊 Database: ${dbName}`);
                    console.log('📁 Collections:');
                    
                    for (const collection of collections) {
                        const coll = db.collection(collection.name);
                        const count = await coll.countDocuments();
                        console.log(`   - ${collection.name}: ${count} documents`);
                        
                        // Show sample data for small collections
                        if (count > 0 && count <= 5) {
                            const samples = await coll.find({}).limit(2).toArray();
                            console.log(`     Sample: ${JSON.stringify(samples[0], null, 2).substring(0, 100)}...`);
                        }
                    }
                }
            } catch (error) {
                // Database doesn't exist, skip
            }
        }
        
    } catch (error) {
        console.error('❌ MongoDB Atlas Connection Error:');
        console.error('Error:', error.message);
        
        if (error.message.includes('authentication failed')) {
            console.log('\n🔐 Authentication Issue:');
            console.log('- Check username and password');
            console.log('- Verify user has proper permissions');
        }
        
        if (error.message.includes('network')) {
            console.log('\n🌐 Network Issue:');
            console.log('- Check internet connection');
            console.log('- Verify IP whitelist in MongoDB Atlas');
        }
        
    } finally {
        if (client) {
            await client.close();
            console.log('\n🔌 Connection closed');
        }
    }
}

// Run the test
testMongoDBAtlas().catch(console.error);