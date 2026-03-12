# 🔗 Offline Timer Integration Guide

## Quick Integration Steps for App.js

### Step 1: Import OfflineTimerService

Add to the top of `App.js`:

```javascript
import OfflineTimerService from './OfflineTimerService';
```

### Step 2: Initialize Service

Add this useEffect after login:

```javascript
// Initialize Offline Timer Service
useEffect(() => {
  if (selectedRole === 'student' && studentId && !showLogin) {
    console.log('🔧 Initializing Offline Timer Service...');
    OfflineTimerService.initialize(studentId, SOCKET_URL)
      .then(success => {
        if (success) {
          console.log('✅ Offline Timer Service ready');
        } else {
          console.warn('⚠️ Offline Timer Service initialization failed');
        }
      });
  }
  
  return () => {
    if (selectedRole === 'student') {
      OfflineTimerService.cleanup();
    }
  };
}, [selectedRole, studentId, showLogin]);
```

### Step 3: Listen to Timer Events

Add this useEffect to handle timer events:

```javascript
// Listen to Offline Timer events
useEffect(() => {
  if (selectedRole !== 'student') return;
  
  const unsubscribe = OfflineTimerService.addListener((event) => {
    console.log('📡 Offline Timer Event:', event.type);
    
    switch (event.type) {
      case 'timer_tick':
        // Update display time
        setDisplayTime(event.timerSeconds);
        break;
        
      case 'timer_started':
        setIsRunning(true);
        setDisplayTime(event.timerSeconds);
        break;
        
      case 'timer_stopped':
        setIsRunning(false);
        Alert.alert('Timer Stopped', `Reason: ${event.reason}`);
        break;
        
      case 'timer_paused':
        setIsRunning(false);
        Alert.alert('Timer Paused', `Reason: ${event.reason}`);
        break;
        
      case 'timer_resumed':
        setIsRunning(true);
        break;
        
      case 'missed_random_ring':
        // Show random ring dialog
        setRandomRingDialogOpen(true);
        setActiveRandomRing(event.randomRing);
        Alert.alert(
          '🔔 Random Ring Verification',
          'Please verify your presence within 1 minute!',
          [{ text: 'Verify Now', onPress: () => handleRandomRingResponse('present') }]
        );
        break;
        
      case 'bssid_unauthorized':
        Alert.alert(
          '📶 WiFi Changed',
          'Timer stopped - You are no longer in the authorized classroom WiFi.',
          [{ text: 'OK' }]
        );
        break;
    }
  });
  
  return unsubscribe;
}, [selectedRole]);
```

### Step 4: Modify Start Timer Function

Replace the existing start timer logic:

```javascript
const handleStartTimer = async () => {
  try {
    // Check if we have current class info
    if (!currentClassInfo) {
      Alert.alert('No Class', 'No class is currently scheduled');
      return;
    }
    
    // Start offline timer with BSSID validation
    const result = await OfflineTimerService.startTimer({
      subject: currentClassInfo.subject,
      teacher: currentClassInfo.teacher || 'Unknown',
      room: currentClassInfo.room,
      startTime: currentClassInfo.startTime,
      endTime: currentClassInfo.endTime
    });
    
    if (result.success) {
      console.log('✅ Timer started successfully');
      setIsRunning(true);
      setDisplayTime(result.timerSeconds);
      
      if (result.isNewLecture) {
        Alert.alert('New Lecture', 'Timer reset for new lecture');
      } else {
        Alert.alert('Continuing', 'Timer continues from previous value');
      }
    } else {
      console.error('❌ Failed to start timer:', result.error);
      Alert.alert('Cannot Start Timer', result.error);
    }
  } catch (error) {
    console.error('❌ Error starting timer:', error);
    Alert.alert('Error', 'Failed to start timer');
  }
};
```

### Step 5: Modify Stop Timer Function

Replace the existing stop timer logic:

```javascript
const handleStopTimer = async () => {
  try {
    const result = await OfflineTimerService.stopTimer('manual');
    
    if (result.success) {
      console.log('✅ Timer stopped successfully');
      setIsRunning(false);
    } else {
      console.error('❌ Failed to stop timer:', result.error);
    }
  } catch (error) {
    console.error('❌ Error stopping timer:', error);
  }
};
```

### Step 6: Add Random Ring Response Handler

Add this function to handle random ring responses:

```javascript
const handleRandomRingResponse = async (response) => {
  try {
    if (!activeRandomRing) {
      Alert.alert('Error', 'No active random ring');
      return;
    }
    
    const result = await fetch(`${SOCKET_URL}/api/attendance/random-ring-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: studentId,
        randomRingId: activeRandomRing.id,
        response: response,
        timestamp: Date.now()
      })
    });
    
    const data = await result.json();
    
    if (data.success) {
      Alert.alert('✅ Verified', 'Your presence has been verified!');
      setRandomRingDialogOpen(false);
      setActiveRandomRing(null);
    } else {
      Alert.alert('❌ Failed', data.error || 'Verification failed');
      setRandomRingDialogOpen(false);
      setActiveRandomRing(null);
      setIsRunning(false);
    }
  } catch (error) {
    console.error('❌ Error responding to random ring:', error);
    Alert.alert('Error', 'Failed to send response');
  }
};
```

### Step 7: Display Timer State

Update the timer display to show offline status:

```javascript
// Get offline timer state
const offlineTimerState = OfflineTimerService.getState();

// In your render:
<View style={styles.timerContainer}>
  <CircularTimer
    theme={theme}
    initialTime={displayTime}
    isRunning={isRunning}
    onToggleTimer={handleStartTimer}
    onReset={handleStopTimer}
    // ... other props
  />
  
  {/* Offline indicator */}
  {!offlineTimerState.isOnline && isRunning && (
    <View style={styles.offlineIndicator}>
      <Text style={styles.offlineText}>
        📶 Offline - Syncing when connected
      </Text>
      <Text style={styles.offlineSubtext}>
        Last sync: {offlineTimerState.lastSyncTime ? 
          new Date(offlineTimerState.lastSyncTime).toLocaleTimeString() : 
          'Never'}
      </Text>
    </View>
  )}
  
  {/* Queued syncs indicator */}
  {offlineTimerState.queuedSyncs > 0 && (
    <View style={styles.queueIndicator}>
      <Text style={styles.queueText}>
        ⏳ {offlineTimerState.queuedSyncs} updates queued
      </Text>
    </View>
  )}
</View>
```

### Step 8: Add Styles

Add these styles to your StyleSheet:

```javascript
const styles = StyleSheet.create({
  // ... existing styles
  
  offlineIndicator: {
    backgroundColor: '#ff9800',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  offlineText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  offlineSubtext: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  queueIndicator: {
    backgroundColor: '#2196f3',
    padding: 8,
    borderRadius: 8,
    marginTop: 5,
    alignItems: 'center',
  },
  queueText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
```

---

## Testing the Integration

### Test 1: Basic Timer Start
1. Login as student
2. Click "Start Timer"
3. Verify timer starts counting
4. Check console for BSSID validation logs

### Test 2: Offline Operation
1. Start timer
2. Turn off WiFi
3. Verify timer continues counting
4. Turn on WiFi
5. Verify sync happens automatically

### Test 3: BSSID Change
1. Start timer in authorized WiFi
2. Switch to different WiFi
3. Verify timer stops automatically
4. Check alert message

### Test 4: Lecture Continuity
1. Start timer for Lecture 1 (Math)
2. Stop timer
3. Start timer again for same lecture
4. Verify timer continues from previous value

### Test 5: Lecture Reset
1. Start timer for Lecture 1 (Math)
2. Stop timer
3. Start timer for Lecture 2 (Physics)
4. Verify timer resets to 0

### Test 6: Background Operation
1. Start timer
2. Press home button (app goes to background)
3. Wait 2 minutes
4. Return to app
5. Verify timer continued in background

### Test 7: Random Ring
1. Start timer
2. Turn off WiFi
3. Have teacher send random ring
4. Turn on WiFi
5. Verify random ring dialog appears
6. Respond within 1 minute
7. Verify response is recorded

---

## Troubleshooting

### Timer doesn't start
- Check if BSSID validation is passing
- Verify WiFiManager is initialized
- Check console logs for errors

### Timer doesn't sync
- Check internet connection
- Verify server URL is correct
- Check server logs for errors

### BSSID validation fails
- Verify authorized BSSIDs are loaded
- Check if connected to correct WiFi
- Enable location permissions on Android

### Random ring not appearing
- Check if random ring was sent during offline period
- Verify sync is working
- Check server logs for random ring data

---

## Complete Integration Checklist

- [ ] Import OfflineTimerService
- [ ] Initialize service on login
- [ ] Add event listener
- [ ] Modify start timer function
- [ ] Modify stop timer function
- [ ] Add random ring response handler
- [ ] Update timer display
- [ ] Add offline indicators
- [ ] Add styles
- [ ] Test all scenarios
- [ ] Deploy to production

---

**Status:** Ready for Integration
**Estimated Time:** 30-45 minutes
**Difficulty:** Medium
