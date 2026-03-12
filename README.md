# TimerLogic - Advanced Attendance Management System

A comprehensive React Native mobile application with Node.js backend for automated attendance tracking using timer-based logic and WiFi detection.

## 🚀 Features

### Mobile App (React Native + Expo)
- **Smart Timer System**: Automated attendance tracking with pause/resume functionality
- **WiFi-Based Detection**: Automatic presence detection using WiFi connectivity
- **Real-time Synchronization**: Live updates with WebSocket integration
- **Offline Support**: Works without internet with local data sync
- **Student Dashboard**: View attendance records, timetables, and statistics
- **Face Verification**: Secure identity verification (configurable)

### Admin Panel (Electron Desktop App)
- **Real-time Monitoring**: Live student timer tracking
- **Student Management**: Add, edit, and manage student profiles
- **Teacher Dashboard**: Manage subjects, timetables, and attendance
- **Analytics**: Comprehensive attendance reports and statistics
- **Configuration**: System settings and threshold management

### Backend Server (Node.js + Express)
- **RESTful API**: Complete API for mobile and admin panel
- **WebSocket Support**: Real-time bidirectional communication
- **MongoDB Integration**: Robust data storage and management
- **Security**: Rate limiting, authentication, and data validation
- **Scalable Architecture**: Designed for multi-user environments

## 📱 Technology Stack

- **Frontend**: React Native, Expo
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Real-time**: Socket.IO
- **Desktop**: Electron
- **Authentication**: JWT tokens
- **File Storage**: Cloudinary (optional)

## 🛠️ Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Android Studio (for Android development)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aksh-1409/timerlogic.git
   cd timerlogic
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the backend server**
   ```bash
   npm start
   ```

5. **Build and install mobile app**
   ```bash
   # For Android
   .\BUILD_FAST.bat
   ```

6. **Start admin panel**
   ```bash
   .\START_ADMIN_PANEL.bat
   ```

## 📖 Documentation

- [Setup Guide](START_HERE.md)
- [API Documentation](TECH_STACK_DOCUMENTATION.md)
- [Mobile Installation](MOBILE_DEVICE_SETUP.md)
- [Admin Panel Guide](ADMIN_PANEL_RUNNING.md)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    TimerLogic System                     │
├─────────────────────────────────────────────────────────┤
│  Mobile App (React Native)                              │
│  ├─ Timer Management                                    │
│  ├─ WiFi Detection                                      │
│  ├─ Offline Sync                                        │
│  └─ Real-time Updates                                   │
├─────────────────────────────────────────────────────────┤
│  Admin Panel (Electron)                                 │
│  ├─ Student Management                                  │
│  ├─ Live Monitoring                                     │
│  ├─ Reports & Analytics                                 │
│  └─ System Configuration                                │
├─────────────────────────────────────────────────────────┤
│  Backend Server (Node.js)                               │
│  ├─ REST API                                            │
│  ├─ WebSocket Server                                    │
│  ├─ Authentication                                      │
│  └─ Business Logic                                      │
├─────────────────────────────────────────────────────────┤
│  Database (MongoDB)                                     │
│  ├─ Student Records                                     │
│  ├─ Attendance Data                                     │
│  ├─ Timetables                                          │
│  └─ System Configuration                                │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Configuration

### Server Configuration
- **Port**: 3000 (configurable)
- **Database**: MongoDB (local or Atlas)
- **Environment**: Development/Production modes

### Mobile App Configuration
- **API URL**: Automatically configured for local network
- **WebSocket**: Real-time connection to server
- **Offline Mode**: Local storage with sync capabilities

## � Key Features

### Smart Attendance Logic
- Automatic timer start when entering class WiFi range
- Pause/resume functionality for breaks
- Minimum attendance threshold enforcement
- Grace period management for network issues

### Real-time Monitoring
- Live student status updates
- Instant notifications for attendance events
- Real-time dashboard for administrators
- WebSocket-based communication

### Data Management
- Comprehensive student profiles
- Detailed attendance records
- Flexible timetable management
- Export capabilities for reports

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## � License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in the `/docs` folder
- Review the troubleshooting guides

## 🔄 Version History

- **v2.6**: Current version with enhanced timer logic and offline support
- **v2.5**: Added real-time monitoring and admin panel improvements
- **v2.0**: Major refactor with React Native and modern architecture
- **v1.0**: Initial release with basic attendance functionality

---

**TimerLogic** - Making attendance management intelligent and automated.