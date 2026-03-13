const { MongoClient, ServerApiVersion } = require('mongodb');

async function testSRVConnection() {
    console.log('🔍 Testing SRV Connection with Different Approaches...\n');
    
    // Try different connection string formats
    const connectionStrings = [
        // Original format
        "mongodb+srv://Letsbunk:jAYkWZy1%2FL0qAK5U@cluster0.9mxhgcc.mongodb.net/?appName=Cluster0",
        // With explicit database
        "mongodb+srv://Letsbunk:jAYkWZy1%2FL0qAK5U@cluster0.9mxhgcc.mongodb.net/test?appName=Cluster0",
        // With auth source
        "mongodb+srv://Letsbunk:jAYkWZy1%2FL0qAK5U@cluster0.9mxhgcc.mongodb.net/?authSource=admin&appName=Cluster0",
        // With retry writes
        "mongodb+srv://Letsbunk:jAYkWZy1%2FL0qAK5U@cluster0.9mxhgcc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    ];
    
    for (let i = 0; i < connectionStrings.length; i++) {
        const uri = connectionStrings[i];
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
                serverSelectionTimeoutMS: 15000,
                connectTimeoutMS: 15000,
                socketTimeoutMS: 15000
            });
            
            console.log('   ⏳ Connecting...');
            await client.connect();
            
            console.log('   ✅ CONNECTION SUCCESSFUL!');
            
            // Test ping
            await client.db("admin").command({ ping: 1 });
            console.log('   📡 Ping successful!');
            
            // Get server info
            const adminDb = client.db().admin();
            const serverStatus = await adminDb.command({ serverStatus: 1 });
            console.log(`   🖥️  MongoDB Version: ${serverStatus.version}`);
            
            // Get databases
            const databases = await adminDb.listDatabases();
            console.log(`   📊 Found ${databases.databases.length} databases:`);
            
            let totalSize = 0;
            databases.databases.forEach(db => {
                const sizeInMB = (db.sizeOnDisk / 1024 / 1024).toFixed(2);
                totalSize += parseFloat(sizeInMB);
                console.log(`      - ${db.name} (${sizeInMB} MB)`);
            });
            
            console.log(`   💾 Total Storage: ${totalSize.toFixed(2)} MB`);
            
            // Check for LetsBunk data
            const letsbunkDatabases = ['letsbunk', 'timerlogic', 'attendance', 'attendance_app'];
            let foundLetsBunkData = false;
            
            for (const dbName of letsbunkDatabases) {
                try {
                    const db = client.db(dbName);
                    const collections = await db.listCollections().toArray();
                    
                    if (collections.length > 0) {
                        foundLetsBunkData = true;
                        console.log(`\n   🎯 LetsBunk Database "${dbName}":`);
                        
                        let totalDocs = 0;
                        for (const collection of collections) {
                            const coll = db.collection(collection.name);
                            const count = await coll.countDocuments();
                            totalDocs += count;
                            console.log(`      📄 ${collection.name}: ${count} documents`);
                            
                            // Show sample for key collections
                            if (count > 0 && ['students', 'teachers', 'attendance'].includes(collection.name)) {
                                const sample = await coll.findOne({});
                                if (sample) {
                                    const keys = Object.keys(sample).slice(0, 3).join(', ');
                                    console.log(`         Sample keys: ${keys}...`);
                                }
                            }
                        }
                        console.log(`      📊 Total Documents: ${totalDocs}`);
                    }
                } catch (dbError) {
                    // Database doesn't exist
                }
            }
            
            if (!foundLetsBunkData) {
                console.log('\n   ⚠️  No LetsBunk data found');
                console.log('   📭 Cluster appears to be empty or data is in other databases');
            } else {
                console.log('\n   🎉 LetsBunk data found in cluster!');
            }
            
            await client.close();
            console.log('   🔌 Connection closed\n');
            
            console.log('✅ SUCCESS! MongoDB Atlas cluster is online and accessible!');
            console.log('📝 Working connection string found!');
            
            return uri;
            
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
    
    console.log('❌ All SRV connection attempts failed.');
    console.log('\n💡 Possible issues:');
    console.log('   - User not fully created yet (wait 1-2 minutes)');
    console.log('   - User lacks proper privileges');
    console.log('   - Cluster still starting up');
    
    return null;
}

testSRVConnection().then(workingUri => {
    if (workingUri) {
        console.log('\n🎯 Use this connection string in your .env file:');
        console.log(`MONGODB_URI=${workingUri}`);
    }
}).catch(console.error);