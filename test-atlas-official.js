const { MongoClient, ServerApiVersion } = require('mongodb');

// Replace <db_password> with actual password (URL encoded)
const uri = "mongodb+srv://Letsbunk:jAYkWZy1%2FL0qAK5U@cluster0.9mxhgcc.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    console.log('🔍 Testing MongoDB Atlas Connection...');
    console.log('📡 Cluster: cluster0.9mxhgcc.mongodb.net');
    console.log('👤 Username: Letsbunk');
    console.log('🔑 Password: jAYkWZy1/L0qAK5U');
    
    // Connect the client to the server (optional starting in v4.7)
    console.log('\n⏳ Connecting to MongoDB Atlas...');
    await client.connect();
    
    // Send a ping to confirm a successful connection
    console.log('📡 Sending ping to server...');
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Pinged your deployment. You successfully connected to MongoDB!");
    
    // Now let's check what data is in the cluster
    console.log('\n📊 Checking cluster data...');
    
    // Get list of databases
    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();
    
    console.log(`\n📋 Found ${databases.databases.length} databases:`);
    databases.databases.forEach((db, index) => {
      const sizeInMB = (db.sizeOnDisk / 1024 / 1024).toFixed(2);
      console.log(`${index + 1}. ${db.name} (${sizeInMB} MB)`);
    });
    
    // Check for LetsBunk/TimerLogic data
    const targetDatabases = ['letsbunk', 'timerlogic', 'attendance', 'attendance_app', 'test'];
    let foundData = false;
    
    for (const dbName of targetDatabases) {
      try {
        const db = client.db(dbName);
        const collections = await db.listCollections().toArray();
        
        if (collections.length > 0) {
          foundData = true;
          console.log(`\n🎯 Database: "${dbName}"`);
          console.log('📁 Collections:');
          
          let totalDocuments = 0;
          for (const collection of collections) {
            const coll = db.collection(collection.name);
            const count = await coll.countDocuments();
            totalDocuments += count;
            console.log(`   📄 ${collection.name}: ${count} documents`);
            
            // Show sample data for important collections
            if (count > 0 && ['students', 'teachers', 'attendance', 'timetables', 'users'].includes(collection.name)) {
              const sample = await coll.findOne({});
              if (sample) {
                console.log(`      Sample keys: ${Object.keys(sample).slice(0, 5).join(', ')}${Object.keys(sample).length > 5 ? '...' : ''}`);
              }
            }
          }
          console.log(`   📊 Total Documents: ${totalDocuments}`);
        }
      } catch (error) {
        // Database doesn't exist, skip
      }
    }
    
    if (!foundData) {
      console.log('\n⚠️  No LetsBunk/TimerLogic data found in common database names');
      
      // Check the default database
      const defaultDb = client.db();
      const defaultCollections = await defaultDb.listCollections().toArray();
      
      if (defaultCollections.length > 0) {
        console.log('\n📁 Default database collections:');
        for (const collection of defaultCollections) {
          const coll = defaultDb.collection(collection.name);
          const count = await coll.countDocuments();
          console.log(`   📄 ${collection.name}: ${count} documents`);
        }
      } else {
        console.log('\n📭 Cluster appears to be empty (no collections found)');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Connection Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n🔐 Authentication Issue:');
      console.log('   - Username: Letsbunk');
      console.log('   - Password: ismine');
      console.log('   - Check if these credentials are correct in MongoDB Atlas');
    }
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('querySrv')) {
      console.log('\n🌐 Network/DNS Issue:');
      console.log('   - Cluster might be paused');
      console.log('   - Check cluster status in MongoDB Atlas dashboard');
    }
    
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
    console.log('\n🔌 Connection closed');
  }
}

run().catch(console.dir);