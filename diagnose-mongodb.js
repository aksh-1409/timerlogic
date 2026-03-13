const { MongoClient } = require('mongodb');
const dns = require('dns').promises;

async function diagnoseMongoDBConnection() {
    console.log('🔍 MongoDB Atlas Connection Diagnosis');
    console.log('=====================================\n');
    
    // Test different possible connection strings
    const possibleConnections = [
        'mongodb+srv://admin:aksh%4012345@cluster0.xchedic.mongodb.net/?appName=Cluster0',
        'mongodb+srv://admin:aksh@cluster0.xchedic.mongodb.net/?appName=Cluster0',
        'mongodb+srv://admin:aksh%4012345@cluster0.xchedic.mongodb.net/letsbunk?appName=Cluster0',
        'mongodb+srv://admin:aksh@cluster0.xchedic.mongodb.net/letsbunk?appName=Cluster0'
    ];
    
    // Check DNS resolution
    console.log('1. 🌐 DNS Resolution Test:');
    try {
        const addresses = await dns.lookup('cluster0.xchedic.mongodb.net');
        console.log('✅ DNS resolved:', addresses);
    } catch (error) {
        console.log('❌ DNS resolution failed:', error.message);
        console.log('   This suggests the cluster hostname is incorrect or cluster doesn\'t exist');
    }
    
    // Check SRV records
    console.log('\n2. 📋 SRV Record Test:');
    try {
        const srvRecords = await dns.resolveSrv('_mongodb._tcp.cluster0.xchedic.mongodb.net');
        console.log('✅ SRV records found:', srvRecords);
    } catch (error) {
        console.log('❌ SRV records not found:', error.message);
    }
    
    // Test connections
    console.log('\n3. 🔌 Connection Tests:');
    for (let i = 0; i < possibleConnections.length; i++) {
        const uri = possibleConnections[i];
        const maskedUri = uri.replace(/:[^:@]*@/, ':****@');
        
        console.log(`\nTest ${i + 1}: ${maskedUri}`);
        
        try {
            const client = new MongoClient(uri, { 
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 5000 
            });
            
            await client.connect();
            console.log('✅ Connection successful!');
            
            // Quick database check
            const adminDb = client.db().admin();
            const databases = await adminDb.listDatabases();
            console.log(`📊 Found ${databases.databases.length} databases`);
            
            await client.close();
            return uri; // Return successful connection string
            
        } catch (error) {
            console.log('❌ Connection failed:', error.message);
        }
    }
    
    console.log('\n4. 💡 Troubleshooting Suggestions:');
    console.log('- Verify cluster name and hostname in MongoDB Atlas dashboard');
    console.log('- Check if cluster is paused or deleted');
    console.log('- Verify username and password');
    console.log('- Check IP whitelist (add 0.0.0.0/0 for testing)');
    console.log('- Ensure cluster is in active state');
    
    return null;
}

diagnoseMongoDBConnection().catch(console.error);