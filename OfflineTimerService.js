/**
 * Offline Timer Service
 * Manages timer operation when device is offline
 * Handles local timer counting, BSSID validation, and sync queue
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import WiFiManager from './WiFiManager';
import { getServerTime } from './ServerTime';

const OFFLINE_TIMER_KEY = '@offline_timer_state';
const SYNC_QUEUE_KEY = '@sync_queue';
const LECTURE_CONTEXT_KEY = '@lecture_context';

class OfflineTimerService {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.timerSeconds = 0;
    this.timerInterval = null;
    this.syncInterval = null;
    this.bssidMonitorInterval = null;
    
    // Lecture context
    this.currentLecture = null;
    this.lectureStartTime = null;
    this.authorizedBSSID = null;
    
    // Sync queue for offline updates
    this.syncQueue = [];
    
    // Listeners
    this.listeners = [];
    
    // App state
    this.appState = AppState.currentState;
    this.appStateSubscription = null;
    
    // Connection status
    this.isOnline = true;
    this.lastSyncTime = null;
    this.lastSyncAttempt = null;
    
    // Background timer tracking
    this.backgroundStartTime = null;
  }

  /**
   * Initialize offline timer service
   */
  async initialize(studentId, serverUrl) {
    try {
      console.log('🔧 Initializing Offline Timer Service...');
      
      this.studentId = studentId;
      this.serverUrl = serverUrl;
      
      // Load saved state
      await this.loadState();
      
      // Load sync queue
      await this.loadSyncQueue();
      
      // Setup app state listener
      this.setupAppStateListener();
      
      // Setup BSSID monitoring
      this.setupBSSIDMonitoring();
      
      // Setup sync interval (every 2 minutes)
      this.setupSyncInterval();
      
      console.log('✅ Offline Timer Service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Offline Timer Service:', error);
      return false;
    }
  }

  /**
   * Start timer with BSSID validation
   */
  async startTimer(lectureInfo) {
    try {
      console.log('▶️ Starting offline timer for lecture:', lectureInfo);
      
      // Validate BSSID before starting
      const bssidCheck = await this.validateBSSID(lectureInfo.room);
      
      if (!bssidCheck.authorized) {
        console.error('❌ BSSID validation failed:', bssidCheck.reason);
        return {
          success: false,
          error: 'Not in authorized classroom',
          reason: bssidCheck.reason,
          details: bssidCheck
        };
      }
      
      // Check if continuing same lecture
      const isSameLecture = this.isSameLecture(lectureInfo);
      
      if (!isSameLecture) {
        // New lecture - reset timer
        console.log('📚 New lecture detected - resetting timer');
        this.timerSeconds = 0;
      } else {
        // Same lecture - continue from current value
        console.log('📚 Continuing same lecture - timer continues from:', this.timerSeconds);
      }
      
      // Set lecture context
      this.currentLecture = lectureInfo;
      this.lectureStartTime = Date.now();
      this.authorizedBSSID = bssidCheck.expectedBSSID;
      
      // Start timer
      this.isRunning = true;
      this.isPaused = false;
      
      // Start counting
      this.startCounting();
      
      // Save state
      await this.saveState();
      
      // Notify listeners
      this.notifyListeners({
        type: 'timer_started',
        timerSeconds: this.timerSeconds,
        lecture: this.currentLecture
      });
      
      // Try to sync with server
      await this.syncToServer();
      
      console.log('✅ Offline timer started successfully');
      return {
        success: true,
        timerSeconds: this.timerSeconds,
        isNewLecture: !isSameLecture
      };
      
    } catch (error) {
      console.error('❌ Failed to start offline timer:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Stop timer
   */
  async stopTimer(reason = 'manual') {
    try {
      console.log('⏹️ Stopping offline timer, reason:', reason);
      
      // Stop counting
      this.stopCounting();
      
      // Final sync before stopping
      await this.syncToServer();
      
      // Reset state
      this.isRunning = false;
      this.isPaused = false;
      this.currentLecture = null;
      this.lectureStartTime = null;
      this.authorizedBSSID = null;
      
      // Save state
      await this.saveState();
      
      // Notify listeners
      this.notifyListeners({
        type: 'timer_stopped',
        reason: reason,
        finalSeconds: this.timerSeconds
      });
      
      console.log('✅ Offline timer stopped');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Failed to stop offline timer:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Pause timer
   */
  async pauseTimer(reason) {
    if (!this.isRunning || this.isPaused) return;
    
    console.log('⏸️ Pausing offline timer, reason:', reason);
    
    this.isPaused = true;
    this.stopCounting();
    
    await this.saveState();
    
    this.notifyListeners({
      type: 'timer_paused',
      reason: reason,
      timerSeconds: this.timerSeconds
    });
  }

  /**
   * Resume timer
   */
  async resumeTimer(reason) {
    if (!this.isRunning || !this.isPaused) return;
    
    console.log('▶️ Resuming offline timer, reason:', reason);
    
    this.isPaused = false;
    this.startCounting();
    
    await this.saveState();
    
    this.notifyListeners({
      type: 'timer_resumed',
      reason: reason,
      timerSeconds: this.timerSeconds
    });
  }

  /**
   * Start counting seconds
   */
  startCounting() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    this.timerInterval = setInterval(() => {
      if (this.isRunning && !this.isPaused) {
        this.timerSeconds++;
        
        // Save state every 10 seconds
        if (this.timerSeconds % 10 === 0) {
          this.saveState();
        }
        
        // Notify listeners every second
        this.notifyListeners({
          type: 'timer_tick',
          timerSeconds: this.timerSeconds
        });
      }
    }, 1000);
  }

  /**
   * Stop counting
   */
  stopCounting() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Validate BSSID for classroom
   */
  async validateBSSID(roomNumber) {
    try {
      console.log('📶 Validating BSSID for room:', roomNumber);
      
      const result = await WiFiManager.isAuthorizedForRoom(roomNumber);
      
      console.log('📶 BSSID validation result:', result);
      
      return result;
    } catch (error) {
      console.error('❌ BSSID validation error:', error);
      return {
        authorized: false,
        reason: 'validation_error',
        error: error.message
      };
    }
  }

  /**
   * Check if same lecture (same subject, teacher, room)
   */
  isSameLecture(newLecture) {
    if (!this.currentLecture) return false;
    
    return (
      this.currentLecture.subject === newLecture.subject &&
      this.currentLecture.teacher === newLecture.teacher &&
      this.currentLecture.room === newLecture.room
    );
  }

  /**
   * Setup BSSID monitoring
   */
  setupBSSIDMonitoring() {
    // Monitor BSSID every 10 seconds
    this.bssidMonitorInterval = setInterval(async () => {
      if (this.isRunning && !this.isPaused && this.currentLecture) {
        const bssidCheck = await this.validateBSSID(this.currentLecture.room);
        
        if (!bssidCheck.authorized) {
          console.warn('⚠️ BSSID changed - stopping timer');
          await this.stopTimer('bssid_changed');
          
          this.notifyListeners({
            type: 'bssid_unauthorized',
            reason: bssidCheck.reason,
            details: bssidCheck
          });
        }
      }
    }, 10000); // Every 10 seconds
  }

  /**
   * Setup sync interval (every 2 minutes)
   */
  setupSyncInterval() {
    this.syncInterval = setInterval(async () => {
      if (this.isRunning) {
        await this.syncToServer();
      }
    }, 120000); // 2 minutes
  }

  /**
   * Sync timer data to server
   */
  async syncToServer() {
    try {
      this.lastSyncAttempt = Date.now();
      
      console.log('🔄 Syncing offline timer to server...');
      console.log('   Timer seconds:', this.timerSeconds);
      console.log('   Lecture:', this.currentLecture?.subject);
      
      const response = await fetch(`${this.serverUrl}/api/attendance/offline-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: this.studentId,
          timerSeconds: this.timerSeconds,
          lecture: this.currentLecture,
          timestamp: Date.now(),
          isRunning: this.isRunning,
          isPaused: this.isPaused
        }),
        timeout: 5000 // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        this.isOnline = true;
        this.lastSyncTime = Date.now();
        
        // Check for missed random rings
        if (result.missedRandomRing) {
          console.log('🔔 Missed random ring detected!');
          this.notifyListeners({
            type: 'missed_random_ring',
            randomRing: result.missedRandomRing
          });
        }
        
        // Clear sync queue on successful sync
        this.syncQueue = [];
        await this.saveSyncQueue();
        
        console.log('✅ Sync successful');
        return { success: true };
      } else {
        throw new Error(result.error || 'Sync failed');
      }
      
    } catch (error) {
      console.warn('⚠️ Sync failed, queuing for later:', error.message);
      
      this.isOnline = false;
      
      // Add to sync queue
      this.syncQueue.push({
        timerSeconds: this.timerSeconds,
        lecture: this.currentLecture,
        timestamp: Date.now(),
        isRunning: this.isRunning,
        isPaused: this.isPaused
      });
      
      await this.saveSyncQueue();
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Setup app state listener for background handling
   */
  setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener('change', async (nextAppState) => {
      if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        console.log('📱 App resumed from background');
        
        if (this.backgroundStartTime && this.isRunning) {
          // Calculate time spent in background
          const backgroundDuration = Math.floor((Date.now() - this.backgroundStartTime) / 1000);
          console.log(`⏱️ Background duration: ${backgroundDuration} seconds`);
          
          // Check if still connected to authorized WiFi
          if (this.currentLecture) {
            const bssidCheck = await this.validateBSSID(this.currentLecture.room);
            
            if (bssidCheck.authorized) {
              // Still authorized - timer was running in background
              console.log('✅ Still in authorized WiFi - timer continued in background');
              
              // Sync immediately
              await this.syncToServer();
            } else {
              // Not authorized - stop timer
              console.warn('⚠️ No longer in authorized WiFi - stopping timer');
              await this.stopTimer('wifi_disconnected_background');
            }
          }
        }
        
        this.backgroundStartTime = null;
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background
        console.log('📱 App going to background');
        
        if (this.isRunning) {
          // Check if connected to authorized WiFi
          if (this.currentLecture) {
            const bssidCheck = await this.validateBSSID(this.currentLecture.room);
            
            if (bssidCheck.authorized) {
              // Authorized - timer will continue in background
              console.log('✅ In authorized WiFi - timer will continue in background');
              this.backgroundStartTime = Date.now();
            } else {
              // Not authorized - stop timer
              console.warn('⚠️ Not in authorized WiFi - stopping timer');
              await this.stopTimer('wifi_disconnected');
            }
          }
        }
      }
      
      this.appState = nextAppState;
    });
  }

  /**
   * Save timer state to storage
   */
  async saveState() {
    try {
      const state = {
        isRunning: this.isRunning,
        isPaused: this.isPaused,
        timerSeconds: this.timerSeconds,
        currentLecture: this.currentLecture,
        lectureStartTime: this.lectureStartTime,
        authorizedBSSID: this.authorizedBSSID,
        lastSyncTime: this.lastSyncTime,
        timestamp: Date.now()
      };
      
      await AsyncStorage.setItem(OFFLINE_TIMER_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('❌ Failed to save timer state:', error);
    }
  }

  /**
   * Load timer state from storage
   */
  async loadState() {
    try {
      const savedState = await AsyncStorage.getItem(OFFLINE_TIMER_KEY);
      
      if (savedState) {
        const state = JSON.parse(savedState);
        
        // Check if state is recent (within 1 hour)
        const stateAge = Date.now() - state.timestamp;
        if (stateAge < 3600000) { // 1 hour
          this.isRunning = state.isRunning;
          this.isPaused = state.isPaused;
          this.timerSeconds = state.timerSeconds;
          this.currentLecture = state.currentLecture;
          this.lectureStartTime = state.lectureStartTime;
          this.authorizedBSSID = state.authorizedBSSID;
          this.lastSyncTime = state.lastSyncTime;
          
          console.log('📦 Loaded timer state from storage:', {
            timerSeconds: this.timerSeconds,
            isRunning: this.isRunning,
            lecture: this.currentLecture?.subject
          });
          
          // Resume counting if was running
          if (this.isRunning && !this.isPaused) {
            this.startCounting();
          }
        } else {
          console.log('⚠️ Saved state too old, ignoring');
        }
      }
    } catch (error) {
      console.error('❌ Failed to load timer state:', error);
    }
  }

  /**
   * Save sync queue to storage
   */
  async saveSyncQueue() {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('❌ Failed to save sync queue:', error);
    }
  }

  /**
   * Load sync queue from storage
   */
  async loadSyncQueue() {
    try {
      const savedQueue = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      
      if (savedQueue) {
        this.syncQueue = JSON.parse(savedQueue);
        console.log(`📦 Loaded ${this.syncQueue.length} queued syncs`);
      }
    } catch (error) {
      console.error('❌ Failed to load sync queue:', error);
    }
  }

  /**
   * Get current timer state
   */
  getState() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      timerSeconds: this.timerSeconds,
      currentLecture: this.currentLecture,
      isOnline: this.isOnline,
      lastSyncTime: this.lastSyncTime,
      queuedSyncs: this.syncQueue.length
    };
  }

  /**
   * Add listener for timer events
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('❌ Error in timer listener:', error);
      }
    });
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.stopCounting();
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    if (this.bssidMonitorInterval) {
      clearInterval(this.bssidMonitorInterval);
      this.bssidMonitorInterval = null;
    }
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    this.listeners = [];
  }
}

// Export singleton instance
export default new OfflineTimerService();
