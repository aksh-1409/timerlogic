const { MongoClient, ServerApiVersion } = require('mongodb');

async function testDirectConnection() {
    console.log('🔍 Testing Direct MongoDB Connection (bypassing SRV)...\n');
    
    // Direct connection to the resolved MongoDB servers
    const directUris = [
        // Using the resolved IP addresses from nslookup
        "mongodb://Letsbunk:jAYkWZy1%2FL0qAK5U@20.204.248.151:27017/?authSource=admin&ssl=true",
        // Alternative: try with the hostname
        "mongodb://Letsbunk:jAYkWZy1%2FL0qAK5U@ac-nz9w7qn-shard-00-00.9mxhgcc.mongodb.net:27017/?authSource=admin&ssl=true"
    ];
    
    for (let i = 0; i < directUris.length; i++) {
        const uri = directUris[i];
        const maskedUri = uri.replace(/jAYkWZy1%2FL0qAK5U/, '****');
        
        console.log(`${i + 1}. Testing: ${maskedUri}`);
        
        let client;
        try {
            client = new MongoClient(uri, {
                serverApi: {
                    version: ServerApiVersion.v1,
                    strict: true,
                    deprecationErrors: true,
                },
                serverSelectionTimeoutMS: 10000,
                connectTimeoutMS: 10000
            });
            
            console.log('   ⏳ Connecting...');
            await client.connect();
            
            console.log('   ✅ CONNECTION SUCCESSFUL!');
            
            // Test ping
            await client.db("admin").command({ ping: 1 });
            console.log('   📡 Ping successful!');
            
            // Get databases
            const adminDb = client.db().admin();
            const databases = await adminDb.listDatabases();
            
            console.log(`   📊 Found ${databases.databases.length} databases:`);
            databases.databases.forEach(db => {
                const sizeInMB = (db.sizeOnDisk / 1024 / 1024).toFixed(2);
                console.log(`      - ${db.name} (${sizeInMB} MB)`);
            });
            
            // Check for data
            const targetDbs = ['letsbunk', 'timerlogic', 'attendance', 'test'];
            let foundData = false;
            
            for (const dbName of targetDbs) {
                try {
                    const db = client.db(dbName);
                    const collections = await db.listCollections().toArray();
                    
                    if (collections.length > 0) {
                        foundData = true;
                        console.log(`\n   🎯 Database "${dbName}" found:`);
                        for (const collection of collections) {
                            const coll = db.collection(collection.name);
                            const count = await coll.countDocuments();
                            console.log(`      📄 ${collection.name}: ${count} documents`);
                        }
                    }
                } catch (error) {
                    // Skip if database doesn't exist
                }
            }
            
            if (!foundData) {
                console.log('\n   📭 No LetsBunk data found in common database names');
                
                // Check default database
                const defaultDb = client.db();
                const defaultCollections = await defaultDb.listCollections().toArray();
                if (defaultCollections.length > 0) {
                    console.log('   📁 Default database collections:');
                    for (const collection of defaultCollections) {
                        const coll = defaultDb.collection(collection.name);
                        const count = await coll.countDocuments();
                        console.log(`      📄 ${collection.name}: ${count} documents`);
                    }
                }
            }
            
            await client.close();
            console.log('   🔌 Connection closed\n');
            
            console.log('🎉 SUCCESS! Your MongoDB Atlas cluster is online and accessible!');
            return true;
            
        } catch (error) {
            console.log(`   ❌ FAILED: ${error.message}\n`);
            
            if (client) {
                try {
                    await client.close();
                } catch (closeError) {
                    // Ignore
                }
            }
        }
    }
    
    console.log('❌ All direct connection attempts failed.');
    console.log('\n💡 This suggests the cluster might be paused or have connectivity issues.');
    
    return false;
}

testDirectConnection().catch(console.error);