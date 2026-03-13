const { MongoClient } = require('mongodb');

async function testDirectConnection() {
    console.log('🔍 Testing Direct MongoDB Atlas Connection...\n');
    
    // Test different domain variations
    const connectionStrings = [
        'mongodb+srv://Letsbunk:ismine@cluster0.9mxhgcc.mongodb.com/?appName=Cluster0',
        'mongodb+srv://Letsbunk:ismine@cluster0.9mxhgcc.mongodb.org/?appName=Cluster0',
        'mongodb+srv://Letsbunk:ismine@cluster0.9mxhgcc.mongodb.net/?appName=Cluster0',
        // Try without SRV (direct connection)
        'mongodb://Letsbunk:ismine@54.175.147.155:27017/?appName=Cluster0'
    ];
    
    for (let i = 0; i < connectionStrings.length; i++) {
        const uri = connectionStrings[i];
        const maskedUri = uri.replace(/ismine/, '****');
        
        console.log(`${i + 1}. Testing: ${maskedUri}`);
        
        let client;
        try {
            client = new MongoClient(uri, {
                serverSelectionTimeoutMS: 8000,
                connectTimeoutMS: 8000,
                socketTimeoutMS: 8000
            });
            
            console.log('   ⏳ Connecting...');
            await client.connect();
            
            console.log('   ✅ CONNECTION SUCCESSFUL!');
            
            // Quick database check
            const adminDb = client.db().admin();
            const databases = await adminDb.listDatabases();
            console.log(`   📊 Found ${databases.databases.length} databases:`);
            
            databases.databases.forEach(db => {
                const sizeInMB = (db.sizeOnDisk / 1024 / 1024).toFixed(2);
                console.log(`      - ${db.name} (${sizeInMB} MB)`);
            });
            
            // Check for LetsBunk data
            const letsbunkDb = client.db('letsbunk');
            const collections = await letsbunkDb.listCollections().toArray();
            
            if (collections.length > 0) {
                console.log('   🎯 LetsBunk database found with collections:');
                for (const collection of collections) {
                    const coll = letsbunkDb.collection(collection.name);
                    const count = await coll.countDocuments();
                    console.log(`      - ${collection.name}: ${count} documents`);
                }
            } else {
                console.log('   ⚠️  No LetsBunk database or collections found');
            }
            
            await client.close();
            console.log('   🔌 Connection closed\n');
            
            // If successful, update .env file
            console.log('🎉 SUCCESS! This connection string works.');
            console.log('📝 Updating .env file with working connection...');
            
            return uri; // Return working connection string
            
        } catch (error) {
            console.log(`   ❌ FAILED: ${error.message}\n`);
            
            if (client) {
                try {
                    await client.close();
                } catch (closeError) {
                    // Ignore close errors
                }
            }
        }
    }
    
    console.log('❌ All connection attempts failed.');
    console.log('\n💡 Possible issues:');
    console.log('   1. Cluster is paused - check MongoDB Atlas dashboard');
    console.log('   2. IP not whitelisted - add your IP in Network Access');
    console.log('   3. Wrong credentials - verify username/password');
    console.log('   4. Cluster deleted - check if cluster still exists');
    
    return null;
}

testDirectConnection().then(workingUri => {
    if (workingUri) {
        console.log('\n✅ Working connection string found!');
        console.log('Use this in your .env file:');
        console.log(`MONGODB_URI=${workingUri}`);
    }
}).catch(console.error);