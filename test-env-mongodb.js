const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

async function testEnvMongoConnection() {
    console.log('🔍 Testing MongoDB Connection from .env file...\n');
    
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
        console.log('❌ No MONGODB_URI found in .env file');
        return;
    }
    
    // Mask the password for display
    const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
    console.log('📡 Connection String:', maskedUri);
    
    // Extract details from URI
    const uriMatch = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/]+)\/([^?]+)/);
    if (uriMatch) {
        console.log('👤 Username:', uriMatch[1]);
        console.log('🏗️  Cluster:', uriMatch[3]);
        console.log('💾 Database:', uriMatch[4]);
    }
    
    let client;
    
    try {
        // Create MongoDB client
        client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000
        });
        
        console.log('\n⏳ Connecting to MongoDB Atlas...');
        await client.connect();
        
        console.log('✅ Successfully connected to MongoDB Atlas!');
        
        // Test ping
        await client.db("admin").command({ ping: 1 });
        console.log('📡 Ping successful!');
        
        // Get server info
        const adminDb = client.db().admin();
        const serverStatus = await adminDb.command({ serverStatus: 1 });
        console.log(`🖥️  MongoDB Version: ${serverStatus.version}`);
        console.log(`⏰ Server Uptime: ${Math.floor(serverStatus.uptime / 3600)} hours`);
        
        // Get all databases
        const databases = await adminDb.listDatabases();
        console.log(`\n📊 Found ${databases.databases.length} databases:`);
        
        let totalSize = 0;
        databases.databases.forEach((db, index) => {
            const sizeInMB = (db.sizeOnDisk / 1024 / 1024).toFixed(2);
            totalSize += parseFloat(sizeInMB);
            console.log(`${index + 1}. ${db.name} (${sizeInMB} MB)`);
        });
        
        console.log(`💾 Total Storage Used: ${totalSize.toFixed(2)} MB`);
        
        // Check the main database (attendance_app)
        const mainDb = client.db('attendance_app');
        const collections = await mainDb.listCollections().toArray();
        
        if (collections.length > 0) {
            console.log('\n🎯 Main Database "attendance_app":');
            console.log('📁 Collections:');
            
            let totalDocuments = 0;
            for (const collection of collections) {
                const coll = mainDb.collection(collection.name);
                const count = await coll.countDocuments();
                totalDocuments += count;
                console.log(`   📄 ${collection.name}: ${count} documents`);
                
                // Show sample data for key collections
                if (count > 0 && ['students', 'teachers', 'attendance', 'timetables', 'users'].includes(collection.name)) {
                    const sample = await coll.findOne({});
                    if (sample) {
                        const keys = Object.keys(sample).slice(0, 5).join(', ');
                        console.log(`      Sample keys: ${keys}${Object.keys(sample).length > 5 ? '...' : ''}`);
                    }
                }
            }
            
            console.log(`📊 Total Documents in attendance_app: ${totalDocuments}`);
            
            if (totalDocuments > 0) {
                console.log('\n🎉 SUCCESS! Your MongoDB cluster contains LetsBunk data!');
            } else {
                console.log('\n📭 Database exists but appears to be empty');
            }
        } else {
            console.log('\n📭 Main database "attendance_app" has no collections');
        }
        
        // Check other potential LetsBunk databases
        const otherDbNames = ['letsbunk', 'timerlogic', 'test'];
        for (const dbName of otherDbNames) {
            try {
                const db = client.db(dbName);
                const colls = await db.listCollections().toArray();
                if (colls.length > 0) {
                    console.log(`\n📊 Additional database "${dbName}":`);
                    for (const coll of colls) {
                        const count = await db.collection(coll.name).countDocuments();
                        console.log(`   📄 ${coll.name}: ${count} documents`);
                    }
                }
            } catch (error) {
                // Database doesn't exist or no access
            }
        }
        
    } catch (error) {
        console.error('\n❌ Connection Error:', error.message);
        
        if (error.message.includes('authentication failed')) {
            console.log('\n🔐 Authentication Issue:');
            console.log('   - Check username and password in .env file');
            console.log('   - Verify user exists in MongoDB Atlas');
            console.log('   - Check user permissions');
        }
        
        if (error.message.includes('ECONNREFUSED') || error.message.includes('querySrv')) {
            console.log('\n🌐 Network/DNS Issue:');
            console.log('   - Cluster might be paused');
            console.log('   - Check IP whitelist in MongoDB Atlas');
            console.log('   - Verify cluster hostname');
        }
        
        if (error.message.includes('IP not in whitelist')) {
            console.log('\n🚫 IP Access Issue:');
            console.log('   - Add your IP to MongoDB Atlas Network Access');
            console.log('   - Current IP should be whitelisted: 192.168.1.8');
        }
        
    } finally {
        if (client) {
            await client.close();
            console.log('\n🔌 Connection closed');
        }
    }
}

// Run the test
testEnvMongoConnection().catch(console.error);