# SMS App - Backend Connection & Multi-School Setup Guide

## ✅ What's Been Implemented

### Backend (Express.js)
1. **`GET /api/v1/schools/config`** - Public endpoint returning school branding info:
   - School name, motto, address
   - Region, district, phone, email
   - Logo URL

2. **`POST /api/v1/auth/parent/lookup`** - Parent authentication:
   - Takes mobile number, returns list of children + auth token
   - Token stored in async storage on the app

3. **`GET /api/v1/portal/child/:studentId`** - Portal data for parents:
   - Attendance stats & records
   - Fee payments & balance
   - Results & grades
   - Term remarks

### Frontend (React Native)
1. **SchoolContext** (`src/context/SchoolContext.js`) - Fetches school config on app startup
2. **Updated AuthScreen** - Shows school name & logo dynamically
3. **Updated HomeScreen** - Displays real data:
   - Parent welcome message with student name
   - Class & teacher info
   - Attendance percentage
   - Latest grades
   - Fee balance

## 🔧 Configuration for Multiple Schools

### Step 1: Backend Environment Variables

Create a `.env` file in `backend/` for each school deployment:

```bash
# School Identity (shown in mobile app & web portals)
SCHOOL_NAME=My Secondary School
SCHOOL_MOTTO=Excellence in Education
SCHOOL_ADDRESS=123 School Lane, Accra
SCHOOL_REGION=Greater Accra
SCHOOL_DISTRICT=Accra Metropolitan
SCHOOL_PHONE=+233 30 123 4567
SCHOOL_EMAIL=admin@myschool.edu.gh
SCHOOL_LOGO=https://myschool.edu.gh/logo.png

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sms_school1

# JWT
JWT_SECRET=your-secret-key-here

# SMS Gateway (Hubtel / Arkesel)
HUBTEL_API_KEY=...
HUBTEL_CLIENT_ID=...

# Server
PORT=5000
NODE_ENV=production
```

### Step 2: Frontend API Configuration

Update `src/config/api.js` to point to the correct backend:

```javascript
export const API_BASE = 'http://your-school-backend.com:5000/api/v1';
// For development on LAN:
export const API_BASE = 'http://192.168.1.100:5000/api/v1';
// For emulator (uses special host):
export const API_BASE = 'http://10.0.2.2:5000/api/v1';
```

### Step 3: Deployment Pattern

For each school, you'll:

1. **Clone the backend repo**
   ```bash
   git clone <backend-repo>
   cd SMS/backend
   ```

2. **Set up school-specific environment**
   ```bash
   cp .env.example .env
   # Edit .env with school details
   ```

3. **Initialize database**
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

4. **Deploy**
   ```bash
   npm start
   # Or use PM2: pm2 start ecosystem.config.js --env production
   ```

5. **Build mobile app pointing to this school's backend**
   - Update `src/config/api.js` with the school's backend URL
   - Rebuild & distribute the APK/IPA

## 🎨 School Branding on Mobile App

The app automatically fetches and displays:
- **School name** - Replaces "EduTrack" on AuthScreen
- **School logo** - If SCHOOL_LOGO URL is provided, it's shown instead of default icon
- **School motto** - Displayed below school name if available

When the parent opens the auth screen, they immediately see their school's identity.

## 📋 Data Flow

```
Mobile App
  ├─ On startup
  │  └─ SchoolContext fetches GET /schools/config
  │     └─ Display school name/logo on AuthScreen
  │
  ├─ Parent enters phone number
  │  └─ Calls POST /auth/parent/lookup
  │     └─ Returns { children, token }
  │
  └─ Parent selects child
     ├─ Token stored in AsyncStorage
     ├─ Navigate to HomeScreen
     └─ HomeScreen queries GET /portal/child/:studentId
        └─ Displays attendance, grades, fees
```

## 🚀 Scaling for Multiple Schools

### Option 1: Separate Deployments (Recommended)
- One backend instance per school (isolated database)
- Each school has its own mobile app build pointing to their backend
- Clean data separation, easy backups, school-independent

### Option 2: Multi-Tenant Backend (Advanced)
- Single backend serves multiple schools via `schoolId` parameter
- Requires row-level security in database
- More complex but saves hosting costs

## 🔒 Security Notes

- **JWT tokens** are school-specific (issued by that school's backend)
- **API_BASE** should match the deployed backend URL exactly
- For production, use HTTPS URLs: `https://school-backend.com/api/v1`
- Each school's database is isolated in Option 1

## 📱 Real Device Testing

For testing on physical devices on LAN:
1. Find backend machine IP: `ipconfig` (Windows) or `ifconfig` (Linux/Mac)
2. Update `src/config/api.js`:
   ```javascript
   export const API_BASE = 'http://192.168.1.X:5000/api/v1';
   ```
3. Rebuild app
4. Both phone and backend must be on same network

---

**Status**: Mobile app is now fully connected to backend with dynamic school branding.
All endpoints are ready to serve multiple schools independently.
