# 🔄 Offline Timer Implementation - Complete Guide

## 📋 Overview

This document describes the implementation of the **Offline Timer with BSSID Validation** feature for the LetsBunk attendance tracking system.

---

## 🎯 Feature Summary

The offline timer allows students to track attendance even when internet connection is lost, with the following key capabilities:

1. **Local BSSID Validation** - Timer only runs when connected to authorized classroom WiFi
2. **Offline Operation** - Timer continues running locally without internet
3. **2-Minute Sync Interval** - Automatic sync to server every 2 minutes when online
4. **Lecture Continuity** - Timer continues for same lecture (subject + teacher + room)
5. **Lecture Reset** - Timer resets to 0 for different lectures
6. **BSSID Change Detection** - Auto-stop when WiFi changes
7. **Background Operation** - Timer runs in background if connected to authorized WiFi
8. **Random Ring Validation** - Detects and handles missed random rings during offline periods
9. **Teacher Notifications** - Real-time alerts for offline students and failed verifications

---

## 📁 Files Created/Modified

### **New Files Created:**

1. **`OfflineTimerService.js`** - Core offline timer management
   - Local timer counting
   - BSSID validation
   - Sync queue management
   - Background operation handling
   - Lecture continuity logic

### **Modified Files:**

1. **`server.js`** - Enhanced server endpoints
   - `/api/attendance/offline-sync` - Enhanced for 2-minute sync
   - `/api/attendance/random-ring-response` - Handle delayed random ring responses

---

## 🔧 Implementation Details

### **1. Offline Timer Service (`OfflineTimerService.js`)**

#### **Key Features:**

```javascript
// Initialize service
await OfflineTimerService.initialize(studentId, serverUrl);

// Start timer with BSSID validation
const result = await OfflineTimerService.startTimer(lectureInfo);

// Stop timer
await OfflineTimerService.stopTimer('manual');

// Get current state
const state = OfflineTimerService.getState();
```

#### **BSSID Validation:**
- Validates current WiFi BSSID against authorized BSSIDs before starting
- Continuously monitors BSSID every 10 seconds
- Auto-stops timer if BSSID changes

#### **Lecture Continuity Logic:**
```javascript
// Same lecture = Continue timer
if (subject === prevSubject && teacher === prevTeacher && room === prevRoom) {
    // Timer continues from current value
}

// Different lecture = Reset timer
else {
    // Timer resets to 0
}
```

#### **Background Operation:**
```javascript
// App goes to background
if (connectedToAuthorizedWiFi) {
    // Timer continues in background
} else {
    // Timer stops
}
```

#### **Sync Interval:**
- Syncs to server every **2 minutes** (120 seconds)
- Queues updates when offline
- Retries automatically on failure

---

### **2. Server Endpoints**

#### **A. Offline Sync Endpoint**

**Endpoint:** `POST /api/attendance/offline-sync`

**Request Body:**
```json
{
    "studentId": "string",
    "timerSeconds": number,
    "lecture": {
        "subject": "string",
        "teacher": "string",
        "room": "string"
    },
    "timestamp": number,
    "isRunning": boolean,
    "isPaused": boolean
}
```

**Response:**
```json
{
    "success": true,
    "timerSeconds": 3600,
    "missedRandomRing": {
        "id": "ring_123",
        "timestamp": "2024-01-01T10:00:00Z",
        "expiresAt": "2024-01-01T10:01:00Z",
        "message": "Random ring verification required",
        "lecture": {...}
    },
    "message": "Sync successful - Random ring verification required"
}
```

**Logic:**
1. Validates student exists
2. Updates timer value
3. Checks for missed random rings during offline period
4. Broadcasts update to teachers
5. Returns missed random ring if any

---

#### **B. Random Ring Response Endpoint**

**Endpoint:** `POST /api/attendance/random-ring-response`

**Request Body:**
```json
{
    "studentId": "string",
    "randomRingId": "string",
    "response": "present" | "absent",
    "timestamp": number
}
```

**Response (Success):**
```json
{
    "success": true,
    "message": "Random ring verification successful",
    "timeTaken": 45000,
    "status": "present"
}
```

**Response (Expired):**
```json
{
    "success": false,
    "error": "Random ring expired - Marked absent",
    "timeTaken": 75000,
    "status": "absent"
}
```

**Logic:**
1. Finds student and random ring
2. Checks if already responded
3. Validates response time (1 minute deadline)
4. If expired → Mark absent
5. If valid → Mark present
6. Notifies teacher of result

---

## 🔄 Workflow Diagrams

### **A. Timer Start Flow**

```
Student clicks "Start Timer"
         ↓
Check current WiFi BSSID
         ↓
    Authorized?
    ↙        ↘
  YES         NO
   ↓           ↓
Check if    Show error
same lecture  "Not in authorized
   ↓         classroom"
Same?
↙    ↘
YES   NO
 ↓     ↓
Continue  Reset to 0
timer     ↓
 ↓        ↓
Start counting locally
         ↓
Sync to server
```

---

### **B. Sync Flow (Every 2 Minutes)**

```
Timer running for 2 minutes
         ↓
Attempt sync to server
         ↓
    Online?
    ↙      ↘
  YES       NO
   ↓         ↓
Send timer  Queue for
to server   later sync
   ↓         ↓
Check for   Continue
random rings locally
   ↓
Any missed?
↙        ↘
YES       NO
 ↓         ↓
Send      Sync
immediate complete
random ring
 ↓
Student has
1 minute to
respond
```

---

### **C. BSSID Change Detection**

```
Timer running
     ↓
Monitor BSSID every 10 seconds
     ↓
BSSID changed?
    ↙      ↘
  YES       NO
   ↓         ↓
Stop timer  Continue
immediately monitoring
   ↓
Sync accumulated
time to server
   ↓
Require manual
restart in new
classroom
```

---

### **D. Background Operation**

```
App goes to background
         ↓
Connected to authorized WiFi?
    ↙              ↘
  YES               NO
   ↓                 ↓
Timer continues   Timer stops
in background     immediately
   ↓                 ↓
Track background  Sync stopped
time              timer value
   ↓                 ↓
App returns       Require
to foreground     manual restart
   ↓
Sync accumulated
time
```

---

## 📊 Data Structures

### **Offline Timer State (AsyncStorage)**

```javascript
{
    isRunning: boolean,
    isPaused: boolean,
    timerSeconds: number,
    currentLecture: {
        subject: string,
        teacher: string,
        room: string,
        startTime: string,
        endTime: string
    },
    lectureStartTime: number,
    authorizedBSSID: string,
    lastSyncTime: number,
    timestamp: number
}
```

### **Sync Queue (AsyncStorage)**

```javascript
[
    {
        timerSeconds: number,
        lecture: {...},
        timestamp: number,
        isRunning: boolean,
        isPaused: boolean
    },
    ...
]
```

### **Server-Side Attendance Session**

```javascript
{
    studentId: string,
    totalAttendedSeconds: number,
    currentLecture: {...},
    lastSyncTime: Date,
    isRunning: boolean,
    isPaused: boolean,
    randomRings: [
        {
            id: string,
            timestamp: Date,
            responded: boolean,
            responseTime: Date,
            responseStatus: 'success' | 'failed' | 'expired',
            timeTaken: number,
            lecture: {...}
        }
    ],
    offlineSyncs: [
        {
            syncTime: Date,
            timerSeconds: number,
            lecture: {...},
            isRunning: boolean,
            isPaused: boolean,
            missedRandomRing: boolean
        }
    ]
}
```

---

## 🎯 Integration Points

### **1. App.js Integration**

```javascript
import OfflineTimerService from './OfflineTimerService';

// Initialize on app start
useEffect(() => {
    if (studentId && serverUrl) {
        OfflineTimerService.initialize(studentId, serverUrl);
    }
}, [studentId, serverUrl]);

// Start timer
const handleStartTimer = async () => {
    const result = await OfflineTimerService.startTimer({
        subject: currentLecture.subject,
        teacher: currentLecture.teacher,
        room: currentLecture.room,
        startTime: currentLecture.startTime,
        endTime: currentLecture.endTime
    });
    
    if (result.success) {
        setIsRunning(true);
    } else {
        Alert.alert('Error', result.error);
    }
};

// Listen to timer events
useEffect(() => {
    const unsubscribe = OfflineTimerService.addListener((event) => {
        switch (event.type) {
            case 'timer_tick':
                setDisplayTime(event.timerSeconds);
                break;
            case 'timer_stopped':
                setIsRunning(false);
                break;
            case 'missed_random_ring':
                showRandomRingDialog(event.randomRing);
                break;
            case 'bssid_unauthorized':
                Alert.alert('WiFi Changed', 'Timer stopped - Wrong classroom WiFi');
                break;
        }
    });
    
    return unsubscribe;
}, []);
```

---

### **2. WiFiManager Integration**

The existing `WiFiManager.js` is used for BSSID validation:

```javascript
// Load authorized BSSIDs
await WiFiManager.loadAuthorizedBSSIDs(serverUrl, studentData);

// Check authorization
const result = await WiFiManager.isAuthorizedForRoom(roomNumber);

if (result.authorized) {
    // Start timer
} else {
    // Show error
}
```

---

## 🔐 Security Features

### **1. BSSID Validation**
- Timer only runs when connected to authorized classroom WiFi
- Continuous monitoring every 10 seconds
- Auto-stop on BSSID change

### **2. Background Validation**
- Timer only runs in background if connected to authorized WiFi
- Stops immediately if WiFi disconnects

### **3. Random Ring Validation**
- Detects missed random rings during offline periods
- 1-minute response deadline
- Automatic absent marking on failure

### **4. Sync Validation**
- Server validates all sync requests
- Checks for suspicious patterns
- Maintains audit trail

---

## 📱 Teacher Notifications

### **1. Student Offline**
```javascript
io.emit('student_offline', {
    studentId: string,
    enrollmentNo: string,
    name: string,
    lastSyncTime: Date
});
```

### **2. Student Reconnected**
```javascript
io.emit('student_update', {
    studentId: string,
    enrollmentNo: string,
    name: string,
    status: 'attending',
    timerValue: number,
    lastSync: Date
});
```

### **3. Random Ring Failed**
```javascript
io.emit('random_ring_failed', {
    studentId: string,
    enrollmentNo: string,
    name: string,
    randomRingId: string,
    reason: 'expired' | 'failed_response',
    timeTaken: number
});
```

### **4. Random Ring Success**
```javascript
io.emit('random_ring_success', {
    studentId: string,
    enrollmentNo: string,
    name: string,
    randomRingId: string,
    timeTaken: number
});
```

---

## 🧪 Testing Checklist

### **Offline Timer:**
- [ ] Timer starts only with authorized BSSID
- [ ] Timer continues for same lecture
- [ ] Timer resets for different lecture
- [ ] Timer stops on BSSID change
- [ ] Timer runs in background with authorized WiFi
- [ ] Timer stops in background without WiFi
- [ ] Timer syncs every 2 minutes
- [ ] Sync queue works when offline

### **Random Ring:**
- [ ] Missed random ring detected after reconnection
- [ ] 1-minute response deadline enforced
- [ ] Absent marking on expired response
- [ ] Present marking on successful response
- [ ] Teacher receives notifications

### **Edge Cases:**
- [ ] App closed and reopened
- [ ] Multiple disconnections/reconnections
- [ ] Lecture change during offline period
- [ ] Multiple random rings during offline
- [ ] Sync failure and retry

---

## 🚀 Deployment Steps

1. **Deploy Server Changes:**
   ```bash
   # Upload modified server.js
   # Restart server
   pm2 restart server
   ```

2. **Build Mobile App:**
   ```bash
   # Build new APK with OfflineTimerService
   cd android
   ./gradlew assembleRelease
   ```

3. **Test on Device:**
   - Install new APK
   - Test offline timer functionality
   - Verify BSSID validation
   - Test random ring handling

4. **Monitor Logs:**
   ```bash
   # Server logs
   pm2 logs server
   
   # Mobile logs
   adb logcat | grep "OfflineTimer"
   ```

---

## 📝 Configuration

### **Sync Interval:**
Change in `OfflineTimerService.js`:
```javascript
// Current: 2 minutes (120000 ms)
this.syncInterval = setInterval(async () => {
    if (this.isRunning) {
        await this.syncToServer();
    }
}, 120000); // Change this value
```

### **BSSID Monitor Interval:**
Change in `OfflineTimerService.js`:
```javascript
// Current: 10 seconds (10000 ms)
this.bssidMonitorInterval = setInterval(async () => {
    // ...
}, 10000); // Change this value
```

### **Random Ring Deadline:**
Change in `server.js`:
```javascript
// Current: 1 minute (60000 ms)
const ringExpiry = ringTime + (60 * 1000); // Change this value
```

---

## 🎉 Summary

The offline timer feature is now fully implemented with:

✅ Local BSSID validation
✅ Offline operation with 2-minute sync
✅ Lecture continuity logic
✅ BSSID change detection
✅ Background operation support
✅ Random ring validation
✅ Teacher notifications
✅ Comprehensive error handling

The system is ready for testing and deployment!

---

**Implementation Date:** March 11, 2026
**Version:** 1.0.0
**Status:** ✅ Complete
