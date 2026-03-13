// Debug script to check BSSID authorization issues
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function debugBSSIDAuthorization() {
    console.log('🔍 Debugging BSSID Authorization Issue...\n');
    
    let client;
    
    try {
        // Connect to MongoDB
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.log('❌ No MONGODB_URI found in .env file');
            return;
        }
        
        client = new MongoClient(uri);
        await client.connect();
        console.log('✅ Connected to MongoDB\n');
        
        const db = client.db('attendance_app');
        
        // 1. Check timetables and their room assignments
        console.log('📚 Checking Timetables and Room Assignments:');
        console.log('=' .repeat(50));
        
        const timetables = await db.collection('timetables').find({}).toArray();
        
        if (timetables.length === 0) {
            console.log('❌ No timetables found in database');
        } else {
            timetables.forEach((tt, index) => {
                console.log(`${index + 1}. Timetable: ${tt.branch} Semester ${tt.semester}`);
                
                // Check each day for room assignments
                Object.keys(tt.timetable).forEach(day => {
                    const daySchedule = tt.timetable[day];
                    if (daySchedule && daySchedule.length > 0) {
                        daySchedule.forEach((period, periodIndex) => {
                            if (period.room && period.subject && period.subject !== 'Break') {
                                console.log(`   ${day} Period ${periodIndex + 1}: ${period.subject} in Room ${period.room}`);
                            }
                        });
                    }
                });
                console.log('');
            });
        }
        
        // 2. Check classrooms collection for BSSID configuration
        console.log('🏢 Checking Classroom BSSID Configuration:');
        console.log('=' .repeat(50));
        
        const classrooms = await db.collection('classrooms').find({}).toArray();
        
        if (classrooms.length === 0) {
            console.log('❌ No classrooms found in database');
            console.log('💡 This is likely the issue! You need to configure classroom BSSIDs.');
            console.log('\nTo fix this, you need to:');
            console.log('1. Add classroom documents to the "classrooms" collection');
            console.log('2. Each classroom should have: roomNumber, wifiBSSID, isActive: true');
            console.log('\nExample classroom document:');
            console.log(JSON.stringify({
                roomNumber: "101",
                wifiBSSID: "aa:bb:cc:dd:ee:ff",
                building: "Main Building",
                capacity: 60,
                isActive: true
            }, null, 2));
        } else {
            console.log(`✅ Found ${classrooms.length} classroom(s):`);
            classrooms.forEach((classroom, index) => {
                console.log(`${index + 1}. Room ${classroom.roomNumber}:`);
                console.log(`   BSSID: ${classroom.wifiBSSID || 'NOT SET'}`);
                console.log(`   Building: ${classroom.building || 'Not specified'}`);
                console.log(`   Active: ${classroom.isActive ? '✅' : '❌'}`);
                console.log('');
            });
        }
        
        // 3. Cross-reference timetable rooms with classroom BSSIDs
        console.log('🔗 Cross-Reference Analysis:');
        console.log('=' .repeat(50));
        
        // Get all unique rooms from timetables
        const timetableRooms = new Set();
        timetables.forEach(tt => {
            Object.values(tt.timetable).forEach(daySchedule => {
                if (daySchedule) {
                    daySchedule.forEach(period => {
                        if (period.room && period.subject && period.subject !== 'Break') {
                            timetableRooms.add(period.room);
                        }
                    });
                }
            });
        });
        
        console.log(`📋 Rooms used in timetables: ${Array.from(timetableRooms).join(', ')}`);
        
        // Check which rooms have BSSID configuration
        const configuredRooms = classrooms.filter(c => c.isActive && c.wifiBSSID).map(c => c.roomNumber);
        console.log(`🔧 Rooms with BSSID configured: ${configuredRooms.join(', ')}`);
        
        // Find missing configurations
        const missingBSSIDs = Array.from(timetableRooms).filter(room => !configuredRooms.includes(room));
        
        if (missingBSSIDs.length > 0) {
            console.log(`\n❌ Rooms missing BSSID configuration: ${missingBSSIDs.join(', ')}`);
            console.log('\n💡 SOLUTION: Add these rooms to the classrooms collection with their WiFi BSSIDs');
            
            console.log('\n📝 Example MongoDB commands to add missing rooms:');
            missingBSSIDs.forEach(room => {
                console.log(`db.classrooms.insertOne({
  roomNumber: "${room}",
  wifiBSSID: "YOUR_WIFI_BSSID_HERE",
  building: "Main Building",
  capacity: 60,
  isActive: true
});`);
            });
        } else {
            console.log('\n✅ All timetable rooms have BSSID configuration');
        }
        
        // 4. Check current time and active classes
        console.log('\n⏰ Current Time Analysis:');
        console.log('=' .repeat(50));
        
        const now = new Date();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = days[now.getUTCDay()];
        const currentTime = now.getUTCHours() * 60 + now.getUTCMinutes();
        
        console.log(`Current Day: ${currentDay}`);
        console.log(`Current Time: ${Math.floor(currentTime / 60)}:${(currentTime % 60).toString().padStart(2, '0')} UTC`);
        
        // Find active classes right now
        let activeClasses = [];
        timetables.forEach(tt => {
            const daySchedule = tt.timetable[currentDay];
            if (daySchedule) {
                daySchedule.forEach((period, index) => {
                    if (period.subject && period.subject !== 'Break' && tt.periods[index]) {
                        const periodInfo = tt.periods[index];
                        const periodStart = timeToMinutes(periodInfo.startTime);
                        const periodEnd = timeToMinutes(periodInfo.endTime);
                        
                        if (currentTime >= periodStart && currentTime <= periodEnd) {
                            activeClasses.push({
                                subject: period.subject,
                                room: period.room,
                                branch: tt.branch,
                                semester: tt.semester,
                                teacher: period.teacher,
                                time: `${periodInfo.startTime} - ${periodInfo.endTime}`
                            });
                        }
                    }
                });
            }
        });
        
        if (activeClasses.length > 0) {
            console.log('\n📚 Currently Active Classes:');
            activeClasses.forEach((cls, index) => {
                console.log(`${index + 1}. ${cls.subject} - ${cls.branch} Sem ${cls.semester}`);
                console.log(`   Room: ${cls.room}`);
                console.log(`   Teacher: ${cls.teacher}`);
                console.log(`   Time: ${cls.time}`);
                
                // Check if this room has BSSID
                const roomConfig = classrooms.find(c => c.roomNumber === cls.room && c.isActive);
                if (roomConfig && roomConfig.wifiBSSID) {
                    console.log(`   BSSID: ${roomConfig.wifiBSSID} ✅`);
                } else {
                    console.log(`   BSSID: NOT CONFIGURED ❌`);
                }
                console.log('');
            });
        } else {
            console.log('\n📭 No active classes right now');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

// Helper function to convert time string to minutes
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Run the debug
debugBSSIDAuthorization().catch(console.error);