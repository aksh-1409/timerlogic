const { MongoClient } = require('mongodb');

// You can set your password here or pass it as an argument
const PASSWORD = process.argv[2] || 'YOUR_PASSWORD_HERE';
const MONGODB_URI = `mongodb+srv://Letsbunk:${PASSWORD}@cluster0.9mxhgcc.mongodb.net/?appName=Cluster0`;

async function checkAtlasCluster() {
    console.log('🔍 Checking MongoDB Atlas Cluster...');
    console.log('📡 Cluster: cluster0.9mxhgcc.mongodb.net');
    console.log('👤 Username: Letsbunk');
    
    if (PASSWORD === 'YOUR_PASSWORD_HERE') {
        console.log('\n❌ Please provide password as argument:');
        console.log('node check-atlas-cluster.js YOUR_ACTUAL_PASSWORD');
        return;
    }
    
    let client;
    
    try {
        // Test DNS resolution first
        console.log('\n⏳ Testing DNS resolution...');
        const dns = require('dns').promises;
        await dns.lookup('cluster0.9mxhgcc.mongodb.net');
        console.log('✅ DNS resolution successful');
        
        // Connect to MongoDB Atlas
        console.log('\n⏳ Connecting to MongoDB Atlas...');
        client = new MongoClient(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000
        });
        
        await client.connect();
        console.log('✅ Successfully connected to MongoDB Atlas!');
        
        // Get cluster info
        console.log('\n📊 Cluster Information:');
        const adminDb = client.db().admin();
        const serverStatus = await adminDb.command({ serverStatus: 1 });
        console.log(`   MongoDB Version: ${serverStatus.version}`);
        console.log(`   Uptime: ${Math.floor(serverStatus.uptime / 3600)} hours`);
        
        // Get database list
        console.log('\n📋 Available Databases:');
        const databases = await adminDb.listDatabases();
        
        let totalSize = 0;
        databases.databases.forEach((db, index) => {
            const sizeInMB = (db.sizeOnDisk / 1024 / 1024).toFixed(2);
            totalSize += parseFloat(sizeInMB);
            console.log(`${index + 1}. ${db.name} (${sizeInMB} MB)`);
        });
        
        console.log(`\n💾 Total Storage Used: ${totalSize.toFixed(2)} MB`);
        
        // Check for LetsBunk/TimerLogic related databases
        const targetDatabases = ['letsbunk', 'timerlogic', 'attendance', 'attendance_app', 'test'];
        let foundData = false;
        
        for (const dbName of targetDatabases) {
            try {
                const db = client.db(dbName);
                const collections = await db.listCollections().toArray();
                
                if (collections.length > 0) {
                    foundData = true;
                    console.log(`\n📊 Database: "${dbName}"`);
                    console.log('📁 Collections and Data:');
                    
                    let totalDocuments = 0;
                    for (const collection of collections) {
                        const coll = db.collection(collection.name);
                        const count = await coll.countDocuments();
                        totalDocuments += count;
                        console.log(`   📄 ${collection.name}: ${count} documents`);
                        
                        // Show sample data for key collections
                        if (count > 0 && ['students', 'teachers', 'attendance', 'timetables'].includes(collection.name)) {
                            const sample = await coll.findOne({});
                            console.log(`      Sample keys: ${Object.keys(sample).join(', ')}`);
                        }
                    }
                    console.log(`   📊 Total Documents: ${totalDocuments}`);
                }
            } catch (error) {
                // Database doesn't exist or no access
            }
        }
        
        if (!foundData) {
            console.log('\n⚠️  No LetsBunk/TimerLogic data found in common database names');
            console.log('   The cluster might be empty or data might be in other databases');
        }
        
        // Check default database (test)
        console.log('\n🔍 Checking default database...');
        const defaultDb = client.db(); // Uses default database from connection string
        const defaultCollections = await defaultDb.listCollections().toArray();
        
        if (defaultCollections.length > 0) {
            console.log('📁 Default database collections:');
            for (const collection of defaultCollections) {
                const coll = defaultDb.collection(collection.name);
                const count = await coll.countDocuments();
                console.log(`   📄 ${collection.name}: ${count} documents`);
            }
        }
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        
        if (error.message.includes('authentication failed')) {
            console.log('\n🔐 Authentication failed:');
            console.log('   - Check if password is correct');
            console.log('   - Verify username "Letsbunk" exists');
            console.log('   - Check user permissions in MongoDB Atlas');
        }
        
        if (error.message.includes('IP not in whitelist')) {
            console.log('\n🌐 IP Access Issue:');
            console.log('   - Add your IP to MongoDB Atlas Network Access');
            console.log('   - Or add 0.0.0.0/0 for testing (not recommended for production)');
        }
        
    } finally {
        if (client) {
            await client.close();
            console.log('\n🔌 Connection closed');
        }
    }
}

// Run the check
checkAtlasCluster().catch(console.error);