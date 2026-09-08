# Simplified Authentication Architecture

## Overview
Successfully refactored the system to use Supabase **only in the backend**, eliminating the need for Supabase credentials in the frontend. This makes the setup much simpler and more secure.

## Architecture Changes

### Previous Architecture (Supabase in both Frontend + Backend)
- **Frontend**: Direct Supabase client for GitHub OAuth
- **Backend**: Supabase for database operations
- **Problem**: Duplicate credentials, complex setup, security concerns

### New Architecture (Supabase only in Backend)
- **Frontend**: Only talks to backend API
- **Backend**: Handles all Supabase operations (auth + database)
- **Benefit**: Single source of truth, simpler setup, more secure

## Environment Variables (Simplified)

### **Backend Environment Variables** (`backend/.env`)

```env
# Required for AI functionality
GROQ_API_KEY=your_groq_api_key_here

# Required for authentication and database
SUPABASE_URL=https://ioxdvfqvpexdkoidgjrl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=you_need_to_get_this_from_supabase_dashboard

# Required for OAuth deployment features
VERCEL_OAUTH_CALLBACK_URL=http://localhost:8000/oauth/vercel/callback
RENDER_OAUTH_CALLBACK_URL=http://localhost:8000/oauth/render/callback
VERCEL_CLIENT_ID=get_from_vercel_oauth_app
VERCEL_CLIENT_SECRET=get_from_vercel_oauth_app
RENDER_CLIENT_ID=get_from_render_oauth_app
RENDER_CLIENT_SECRET=get_from_render_oauth_app
```

### **Frontend Environment Variables** (`frontend/.env.local`)

```env
# Only backend URL needed!
VITE_API_BASE_URL=http://127.0.0.1:8000

# Optional: force mock mode
VITE_USE_MOCK=false
```

## How to Get Missing Credentials

### 1. **Supabase Service Role Key**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `ioxdvfqvpexdkoidgjrl`
3. Go to **Settings → API**
4. Copy the **"service_role"** key (NOT the anon key)
5. This has full admin privileges - keep it secret!

### 2. **Vercel OAuth App**
1. Go to [Vercel Account Settings → OAuth Applications](https://vercel.com/account/tokens)
2. Click **"Create OAuth Application"**
3. Set callback URL: `http://localhost:8000/oauth/vercel/callback`
4. Copy **Client ID** and **Client Secret**

### 3. **Render OAuth App**
1. Go to [Render Dashboard → OAuth Applications](https://dashboard.render.com/oauth/applications)
2. Click **"New OAuth Application"**
3. Set callback URL: `http://localhost:8000/oauth/render/callback`
4. Copy **Client ID** and **Client Secret**

## Setup Steps

### Step 1: Create Backend `.env` File
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your actual values.

### Step 2: Create Frontend `.env.local` File
```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_USE_MOCK=false
```

### Step 3: Run Database Migration
Run the SQL from `backend/supabase_migrations.sql` in your Supabase SQL editor.

### Step 4: Configure GitHub OAuth in Supabase
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable **GitHub** provider
3. Add your GitHub OAuth app credentials

### Step 5: Install Dependencies
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend  
cd frontend
npm install
```

### Step 6: Start Services
```bash
# Backend (terminal 1)
cd backend
uvicorn app.main:app --reload

# Frontend (terminal 2)
cd frontend
npm run dev
```

## New Backend Authentication Endpoints

### GitHub OAuth Flow
- **GET** `/auth/github/authorize` - Get GitHub OAuth URL
- **POST** `/auth/github/callback` - Handle OAuth callback
- **GET** `/auth/session` - Get current session
- **POST** `/auth/logout` - Logout

### Vercel/Render OAuth (for deployment platforms)
- **GET** `/oauth/vercel/authorize` - Get Vercel OAuth URL
- **POST** `/oauth/vercel/callback` - Handle Vercel callback
- **GET** `/oauth/render/authorize` - Get Render OAuth URL
- **POST** `/oauth/render/callback` - Handle Render callback
- **GET** `/oauth/credentials/status` - Get OAuth status
- **DELETE** `/oauth/credentials/{platform}` - Disconnect platform

### Environment Variables
- **POST** `/env-vars` - Set environment variables for a job
- **GET** `/env-vars/{job_id}` - Get environment variables for a job

## Frontend Changes

### Removed
- ❌ Supabase client library
- ❌ Supabase credentials from frontend
- ❌ Direct Supabase API calls

### Added
- ✅ Backend-based authentication
- ✅ OAuth callback handling component
- ✅ Simplified environment variables
- ✅ Local storage for session tokens

## Authentication Flow

1. **User clicks "Sign in with GitHub"**
   - Frontend calls `GET /auth/github/authorize`
   - Backend returns Supabase GitHub OAuth URL
   - User is redirected to GitHub

2. **User authorizes on GitHub**
   - GitHub redirects back with authorization code
   - Frontend OAuthCallback component handles the callback
   - Frontend calls `POST /auth/github/callback` with code

3. **Backend processes callback**
   - Backend exchanges code with Supabase for access token
   - Backend gets user information from Supabase
   - Backend returns user data + access token to frontend

4. **Frontend stores session**
   - Frontend stores access token in localStorage
   - Frontend sets user state in AuthContext
   - Token is sent with all subsequent API calls

5. **Protected API calls**
   - Frontend includes `Authorization: Bearer {token}` header
   - Backend verifies token with Supabase
   - Backend extracts user_id and processes request

## Security Benefits

1. **Single Source of Truth**: Supabase credentials only in backend
2. **Reduced Attack Surface**: Frontend has no direct database access
3. **Simplified Secrets Management**: Only backend `.env` needs protection
4. **Centralized Auth Logic**: All auth logic in one place (backend)
5. **Easier Auditing**: Single place to audit authentication flows

## Key Files Changed

### Backend
- **New**: `backend/app/routes/auth.py` - Authentication endpoints
- **Updated**: `backend/app/config.py` - Simplified configuration
- **Updated**: `backend/.env.example` - Simplified environment variables

### Frontend
- **Updated**: `frontend/src/auth/AuthContext.tsx` - Backend-based auth
- **New**: `frontend/src/components/OAuthCallback.tsx` - OAuth callback handler
- **Updated**: `frontend/src/lib/api.ts` - Removed Supabase dependency
- **Updated**: `frontend/src/components/OAuthManager.tsx` - Uses localStorage tokens
- **Updated**: `frontend/.env.example` - Only backend URL needed
- **Removed**: `frontend/src/lib/supabase.ts` - No longer needed
- **Removed**: `@supabase/supabase-js` from dependencies

## Migration Notes

### Breaking Changes
- Frontend no longer uses Supabase directly
- All auth flows now go through backend
- Session tokens stored in localStorage instead of Supabase client

### Compatibility
- Backend API endpoints remain mostly the same
- Existing job creation/deployment flow unchanged
- WebSocket streaming unchanged

### Data Migration
- No database schema changes needed
- Existing database structure works with new auth flow
- User sessions will need to be re-established after update

## Benefits Summary

✅ **Simpler Setup**: Only backend needs Supabase credentials
✅ **More Secure**: Frontend has no direct database access  
✅ **Easier Maintenance**: Single auth implementation
✅ **Better Separation**: Clear frontend/backend boundaries
✅ **Reduced Dependencies**: Frontend has fewer dependencies
✅ **Cleaner Architecture**: Backend owns all data operations

The simplified architecture is much easier to understand, maintain, and secure!