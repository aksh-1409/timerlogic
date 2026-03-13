const dns = require('dns').promises;

async function testClusterVariations() {
    console.log('🔍 Testing MongoDB Atlas Cluster Hostname Variations...\n');
    
    // Possible variations of the cluster hostname
    const variations = [
        'cluster0.9mxhgcc.mongodb.net',
        'cluster0.9mxhgcc.mongodb.net.',  // with trailing dot
        'cluster0.9mxhgcc.mongodb.com',   // .com instead of .net
        'cluster0.9mxhgcc.mongodb.org',   // .org instead of .net
        'cluster0.9mxhgcc.mongodbgrid.io', // alternative domain
        'cluster0.9mxhgcc.mongodb.net',   // original
    ];
    
    for (let i = 0; i < variations.length; i++) {
        const hostname = variations[i];
        console.log(`${i + 1}. Testing: ${hostname}`);
        
        try {
            const result = await dns.lookup(hostname);
            console.log(`   ✅ SUCCESS: ${result.address} (${result.family})`);
            
            // Test SRV record for successful DNS
            try {
                const srvRecords = await dns.resolveSrv(`_mongodb._tcp.${hostname}`);
                console.log(`   📋 SRV Records: ${srvRecords.length} found`);
                srvRecords.forEach(srv => {
                    console.log(`      ${srv.name}:${srv.port} (priority: ${srv.priority})`);
                });
            } catch (srvError) {
                console.log(`   ⚠️  SRV lookup failed: ${srvError.message}`);
            }
            
        } catch (error) {
            console.log(`   ❌ FAILED: ${error.message}`);
        }
        console.log('');
    }
    
    console.log('💡 If none work, the cluster might be:');
    console.log('   - Paused or deleted');
    console.log('   - In a different region');
    console.log('   - Have a different hostname');
    console.log('   - Check your MongoDB Atlas dashboard for the exact connection string');
}

testClusterVariations().catch(console.error);