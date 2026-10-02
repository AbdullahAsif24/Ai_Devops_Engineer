# AI DevOps Engineer - Multi-User Deployment Platform

An intelligent, multi-user DevOps platform that transforms any GitHub repository into a deployed application with automatic Dockerfile generation, smart deployment detection, and seamless integration with Vercel and Render.

## 🚀 Overview

This platform uses AI to analyze your GitHub repository, automatically generate optimized Dockerfiles, and deploy your applications to production platforms (Vercel for frontends, Render for backends) with zero manual configuration. It features complete multi-user support with OAuth authentication, persistent job history, and advanced DevOps capabilities.

### Key Features

- **🤖 AI-Powered Analysis**: Uses Groq LLM to intelligently analyze codebases and generate production-ready Dockerfiles
- **🎯 Smart Deployment Detection**: Automatically detects whether your app is a static site, Node.js app, Python service, or container-based
- **🔄 Multi-Platform Deployment**: Deploy to Vercel (frontends) and Render (backends) with a single click
- **👥 Multi-User Support**: Full authentication with GitHub OAuth, user isolation, and persistent job history
- **🔒 OAuth Integration**: Connect your Vercel and Render accounts via OAuth for secure deployments
- **🌐 Private Repository Support**: Deploy private GitHub repositories with GitHub OAuth
- **🔧 Environment Variables**: Add custom environment variables per deployment
- **📦 Auto-Deploy on Push**: Set up webhooks for automatic deployments on git push
- **🔐 Secrets Vault**: Military-grade encrypted secret management with rotation and audit logs
- **🌍 Custom Domains**: Add custom domains with automatic SSL and health monitoring
- **📊 Real-Time Progress**: Live WebSocket streaming of deployment progress
- **🛡️ Self-Healing**: Automatic retry and Dockerfile patching on build failures

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           React Frontend (TypeScript)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │   Auth   │  │  Deploy  │  │ History  │  │ Secrets  │  │ Domains  │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ HTTP/WebSocket
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend (Python)                                │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         API Layer                                     │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│  │  │  Jobs   │ │  Auth   │ │  OAuth  │ │ Secrets │ │ Domains │       │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │   │
│  └───────────────────────────────┬──────────────────────────────────────┘   │
│                                  │                                           │
│  ┌───────────────────────────────▼──────────────────────────────────────┐   │
│  │                         Service Layer                               │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │   Agent  │ │  Cloner  │ │Fingerprint│ │   OAuth  │ │  Deploy  │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │  Groq    │ │ Database │ │Secrets   │ │Auto-Deploy│ │Domains   │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └───────────────────────────────┬──────────────────────────────────────┘   │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼──────────────────────────┐
        │                           │                          │
        ▼                           ▼                          ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│   Supabase    │         │   Groq LLM    │         │  Deployment    │
│  (Database +  │         │   (AI Engine) │         │   Platforms   │
│   Auth)       │         │               │         │  Vercel/Render │
└───────────────┘         └───────────────┘         └───────────────┘
```

### Data Flow

1. **User Authentication**: Users sign in via GitHub OAuth (managed by Supabase)
2. **Repository Analysis**: User submits GitHub URL → Backend clones repo → AI analyzes structure
3. **Dockerfile Generation**: Groq LLM generates optimized Dockerfile based on detected framework
4. **Self-Healing**: If build fails, error feedback loop patches Dockerfile automatically
5. **Platform Detection**: System detects optimal deployment platform (Vercel for static/Node, Render for Python/containers)
6. **OAuth Deployment**: Uses user's OAuth tokens to deploy to their Vercel/Render account
7. **Real-Time Updates**: WebSocket streams live progress to frontend
8. **Persistence**: All jobs, credentials, and secrets stored in Supabase database

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS 4
- **State Management**: React Context API
- **Real-Time**: WebSocket client
- **Icons**: Custom SVG icons
- **Fonts**: Hanken Grotesk, JetBrains Mono, Syne (variable fonts)

### Backend
- **Framework**: FastAPI 0.115 (Async Python)
- **Server**: Uvicorn with uvloop
- **Validation**: Pydantic v2
- **AI/LLM**: Groq SDK (openai/gpt-oss-120b model)
- **Git Operations**: GitPython
- **Container Ops**: Docker SDK
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + JWT
- **IaC**: Pulumi (optional)
- **HTTP Client**: httpx

### Database (Supabase)
- **Tables**:
  - `user_credentials` - OAuth tokens per user/platform
  - `jobs` - Persistent job storage with user association
  - `environment_variables` - User-provided env vars per job
  - `auto_deploy_configs` - Webhook configurations for auto-deploy
  - `webhook_events` - Webhook event logs
  - `secrets` - Encrypted secret storage
  - `secret_audit_logs` - Audit trail for secret operations
  - `custom_domains` - Custom domain configurations
- **Security**: Row Level Security (RLS) for user data isolation

### Deployment Platforms
- **Vercel**: Frontend deployments (static sites, Next.js, React)
- **Render**: Backend services (Python, Node.js, containers)

---

## 📋 Complete Feature List

### Core Deployment Features
- ✅ GitHub repository URL input
- ✅ Automatic repository cloning (shallow clone for speed)
- ✅ AI-powered codebase analysis
- ✅ Smart framework detection (React, Next.js, Express, FastAPI, Flask, etc.)
- ✅ Automatic Dockerfile generation
- ✅ Self-healing build retry loop
- ✅ Multi-platform deployment (Vercel/Render)
- ✅ Private repository support via GitHub OAuth
- ✅ Environment variable injection
- ✅ Real-time progress streaming via WebSocket

### Authentication & Multi-User
- ✅ GitHub OAuth authentication
- ✅ Supabase JWT verification
- ✅ User session management
- ✅ User-specific job isolation
- ✅ Persistent job history per user
- ✅ Row Level Security (RLS) for data protection

### OAuth Integration
- ✅ Vercel OAuth connection
- ✅ Render OAuth connection
- ✅ Token storage and refresh
- ✅ Credential management UI
- ✅ Platform disconnection

### Advanced DevOps Features
- ✅ Auto-deploy on push (GitHub webhooks)
- ✅ Webhook event logging
- ✅ Auto-rollback on failure
- ✅ Secrets vault with encryption
- ✅ Secret rotation scheduling
- ✅ Secret audit logging
- ✅ Role-based secret sharing
- ✅ Custom domain management
- ✅ Automatic SSL provisioning
- ✅ Health monitoring with uptime tracking
- ✅ DNS verification

### Developer Experience
- ✅ Real-time log streaming
- ✅ Job history with filtering
- ✅ Deployment status tracking
- ✅ Error reporting and debugging
- ✅ Mock mode for development
- ✅ Responsive UI design
- ✅ Dark/light ambient effects

---

## 🔄 Complete Deployment Flow

### 1. User Authentication Flow
```
User clicks "Sign in with GitHub"
    ↓
Frontend calls GET /auth/github/authorize
    ↓
Backend returns Supabase GitHub OAuth URL
    ↓
User authorizes on GitHub
    ↓
GitHub redirects with authorization code
    ↓
Frontend OAuthCallback handles the redirect
    ↓
Frontend calls POST /auth/github/callback with code
    ↓
Backend exchanges code with Supabase for access token
    ↓
Backend returns user data + access token
    ↓
Frontend stores token in localStorage
    ↓
User authenticated and ready to deploy
```

### 2. Repository Deployment Flow
```
User submits GitHub repository URL
    ↓
Frontend validates URL format
    ↓
POST /jobs with repo_url and optional env_vars
    ↓
Backend validates user authentication
    ↓
Backend creates job record in database
    ↓
Background worker starts:
    ↓
┌─ Cloning Stage ──────────────────────┐
│  - Shallow clone to temp directory    │
│  - Private repo: use GitHub token     │
└───────────────────────────────────────┘
    ↓
┌─ Analysis Stage ─────────────────────┐
│  - Scan file tree                      │
│  - Detect package.json/requirements   │
│  - Identify entry point                │
│  - Determine framework & language     │
└───────────────────────────────────────┘
    ↓
┌─ Detection Stage ─────────────────────┐
│  - AI or rule-based detection         │
│  - Classify: static/node/python/cont  │
│  - Recommend optimal platform         │
└───────────────────────────────────────┘
    ↓
┌─ Generation Stage ────────────────────┐
│  - Select base template               │
│  - Query Groq LLM for Dockerfile      │
│  - Validate JSON response             │
└───────────────────────────────────────┘
    ↓
┌─ Build Validation (Optional) ────────┐
│  - Test Dockerfile build              │
│  - If fails: Self-healing loop        │
│  - Feed error to Groq → Patch         │
│  - Retry up to MAX_HEAL_RETRIES       │
└───────────────────────────────────────┘
    ↓
┌─ Deployment Stage ────────────────────┐
│  - Choose platform (Vercel/Render)    │
│  - Use user's OAuth token             │
│  - Upload/Configure deployment        │
│  - Inject environment variables       │
└───────────────────────────────────────┘
    ↓
┌─ Completion ─────────────────────────┐
│  - Store deployment URL              │
│  - Update job status to "done"        │
│  - Emit final WebSocket event         │
└───────────────────────────────────────┘
```

### 3. Auto-Deploy on Push Flow
```
User configures auto-deploy for repo
    ↓
System generates webhook secret
    ↓
User adds webhook to GitHub repository
    ↓
Developer pushes to configured branch
    ↓
GitHub sends webhook to backend
    ↓
Backend verifies webhook signature
    ↓
Backend checks if auto-deploy is active
    ↓
Creates new deployment job
    ↓
Follows standard deployment flow
    ↓
Logs webhook event in database
    ↓
If auto-rollback enabled: monitors deployment
```

### 4. Secrets Management Flow
```
User creates secret in vault
    ↓
Secret encrypted with AES-256
    ↓
Stored in Supabase with masked value
    ↓
Audit log entry created
    ↓
User can reveal secret (temporary access)
    ↓
Audit log tracks reveal action
    ↓
Scheduled rotation checks expiration
    ↓
If expired: auto-rotate with new value
    ↓
All rotations logged in audit trail
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+** for backend
- **Node.js 18+** for frontend
- **Git** installed
- **Groq API Key** (free at [console.groq.com](https://console.groq.com/keys))
- **Supabase Project** (free at [supabase.com](https://supabase.com))
- **Vercel OAuth App** (for Vercel deployments)
- **Render OAuth App** (for Render deployments)
- **GitHub OAuth App** (configured in Supabase)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd final
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\Activate.ps1

# Linux/macOS
source .venv/bin/activate

pip install -r requirements.txt
```

#### Configure Environment Variables
```bash
cp .env.example .env
```

Edit `backend/.env`:
```env
# AI Functionality
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
GROQ_TEMPERATURE=0.1
MAX_HEAL_RETRIES=3

# Supabase (Authentication + Database)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OAuth Callback URLs
VERCEL_OAUTH_CALLBACK_URL=http://localhost:8000/oauth/vercel/callback
RENDER_OAUTH_CALLBACK_URL=http://localhost:8000/oauth/render/callback

# Vercel OAuth App
VERCEL_CLIENT_ID=your_vercel_client_id
VERCEL_CLIENT_SECRET=your_vercel_client_secret
VERCEL_TEAM_ID=optional_team_id

# Render OAuth App
RENDER_CLIENT_ID=your_render_client_id
RENDER_CLIENT_SECRET=your_render_client_secret
```

#### Run Database Migration
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the SQL from `backend/supabase_migrations.sql`

#### Configure GitHub OAuth in Supabase
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable **GitHub** provider
3. Add your GitHub OAuth app credentials (Client ID + Secret)
4. Set callback URL: `https://your-project.supabase.co/auth/v1/callback`

#### Start Backend Server
```bash
uvicorn app.main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`

### 3. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Configure Environment Variables
```bash
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_USE_MOCK=false
```

#### Start Frontend Dev Server
```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

### 4. Create OAuth Apps

#### Vercel OAuth App
1. Go to [Vercel Account Settings → OAuth Applications](https://vercel.com/account/tokens)
2. Click "Create OAuth Application"
3. Set callback URL: `http://localhost:8000/oauth/vercel/callback`
4. Copy Client ID and Client Secret to backend `.env`

#### Render OAuth App
1. Go to [Render Dashboard → OAuth Applications](https://dashboard.render.com/oauth/applications)
2. Click "New OAuth Application"
3. Set callback URL: `http://localhost:8000/oauth/render/callback`
4. Copy Client ID and Client Secret to backend `.env`

---

## 📡 API Documentation

### Core Endpoints

#### Authentication
- `GET /auth/github/authorize` - Get GitHub OAuth URL
- `POST /auth/github/callback` - Handle OAuth callback
- `GET /auth/session` - Get current session
- `POST /auth/logout` - Logout

#### Jobs
- `POST /jobs` - Create new deployment job
- `GET /jobs` - List user's jobs
- `GET /jobs/{job_id}` - Get job details
- `DELETE /jobs/{job_id}` - Delete job

#### WebSocket
- `WS /ws/jobs` - Real-time job event stream

#### OAuth (Vercel/Render)
- `GET /oauth/{platform}/authorize` - Get OAuth URL
- `POST /oauth/{platform}/callback` - Handle OAuth callback
- `GET /oauth/credentials/status` - Get credential status
- `DELETE /oauth/credentials/{platform}` - Disconnect platform

#### Environment Variables
- `POST /env-vars` - Set environment variables for job
- `GET /env-vars/{job_id}` - Get environment variables

#### Auto-Deploy
- `POST /auto-deploy/configs` - Create auto-deploy config
- `GET /auto-deploy/configs` - List auto-deploy configs
- `PUT /auto-deploy/configs/{id}` - Update config
- `DELETE /auto-deploy/configs/{id}` - Delete config
- `POST /auto-deploy/test` - Test push simulation

#### Secrets
- `POST /secrets` - Create secret
- `GET /secrets` - List secrets
- `GET /secrets/{id}` - Get secret details
- `PUT /secrets/{id}` - Update secret
- `DELETE /secrets/{id}` - Delete secret
- `POST /secrets/{id}/reveal` - Reveal secret value
- `POST /secrets/{id}/rotate` - Rotate secret
- `GET /secrets/audit` - Get audit logs

#### Custom Domains
- `POST /domains` - Add custom domain
- `GET /domains` - List domains
- `GET /domains/{id}` - Get domain details
- `DELETE /domains/{id}` - Delete domain
- `POST /domains/{id}/verify` - Verify DNS
- `POST /domains/{id}/health-check` - Run health check

#### Webhooks
- `POST /webhooks/github` - GitHub webhook handler

### Interactive API Documentation
Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 🗄 Database Schema

### Core Tables

#### `user_credentials`
Stores OAuth tokens for deployment platforms per user.
```sql
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- platform (TEXT: 'vercel' | 'render')
- access_token (TEXT)
- refresh_token (TEXT)
- token_expires_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE(user_id, platform)
```

#### `jobs`
Persistent job storage with user association and deployment metadata.
```sql
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- job_id (TEXT, UNIQUE)
- status (TEXT: 'queued' | 'cloning' | 'analyzing' | 'generating' | 'building' | 'healing' | 'deploying' | 'done' | 'failed' | 'needs_review')
- repo_url (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- result (JSONB)
- error (TEXT)
- detection (JSONB)
- deployment (JSONB)
- logs (JSONB)
- repo_path (TEXT)
```

#### `environment_variables`
User-provided environment variables per job.
```sql
- id (UUID, PK)
- job_id (UUID, FK to jobs)
- key (TEXT)
- value (TEXT)
- created_at (TIMESTAMP)
- UNIQUE(job_id, key)
```

### Advanced Features Tables

#### `auto_deploy_configs`
Configuration for automatic deployments on git push.
```sql
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- repo_url (TEXT)
- branch (TEXT, default: 'main')
- is_active (BOOLEAN)
- webhook_secret (TEXT)
- webhook_url (TEXT)
- auto_rollback (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `webhook_events`
Log of webhook events for tracking.
```sql
- id (UUID, PK)
- config_id (UUID, FK to auto_deploy_configs)
- user_id (UUID, FK to auth.users)
- repo_url (TEXT)
- branch (TEXT)
- commit_sha (TEXT)
- commit_message (TEXT)
- committer (TEXT)
- status (TEXT: 'triggered' | 'skipped' | 'failed')
- job_id (TEXT)
- error_message (TEXT)
- created_at (TIMESTAMP)
```

#### `secrets`
Encrypted secret storage with rotation support.
```sql
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- key (TEXT)
- environment (TEXT: 'production' | 'staging' | 'development')
- encrypted_value (TEXT)
- masked_value (TEXT)
- version (INT)
- rotation_interval_days (INT)
- last_rotated_at (TIMESTAMP)
- expires_at (TIMESTAMP)
- shared_roles (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE(user_id, key, environment)
```

#### `secret_audit_logs`
Audit trail for all secret operations.
```sql
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- secret_id (UUID, FK to secrets)
- secret_key (TEXT)
- environment (TEXT)
- action (TEXT: 'create' | 'reveal' | 'rotate' | 'update' | 'delete' | 'share')
- actor (TEXT)
- ip_address (TEXT)
- details (TEXT)
- timestamp (TIMESTAMP)
```

#### `custom_domains`
Custom domain configurations with SSL and health monitoring.
```sql
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- domain (TEXT)
- job_id (TEXT)
- target_url (TEXT)
- status (TEXT: 'active' | 'pending_dns' | 'verifying' | 'ssl_issuing' | 'failed')
- dns_type (TEXT: 'CNAME' | 'A')
- dns_host (TEXT)
- dns_target (TEXT)
- dns_ttl (INT)
- dns_verified (BOOLEAN)
- ssl_status (TEXT: 'issued' | 'pending' | 'renewing' | 'failed')
- ssl_issuer (TEXT)
- ssl_expires_at (TIMESTAMP)
- auto_ssl_renew (BOOLEAN)
- health_status (TEXT: 'healthy' | 'degraded' | 'down' | 'pending')
- latency_ms (INT)
- uptime_percent (REAL)
- http_status_code (INT)
- last_checked_at (TIMESTAMP)
- created_at (TIMESTAMP)
- UNIQUE(user_id, domain)
```

---

## 🔒 Security Features

### Authentication & Authorization
- **GitHub OAuth**: Secure authentication via GitHub
- **JWT Verification**: Supabase JWT validation on all protected routes
- **User Isolation**: Row Level Security (RLS) in database
- **Session Management**: Secure token storage in localStorage

### Data Protection
- **Encrypted Secrets**: AES-256 encryption for sensitive data
- **OAuth Tokens**: Stored securely in database with refresh support
- **Environment Variables**: Validated and injected securely
- **Audit Logging**: Complete audit trail for sensitive operations

### API Security
- **CORS Configuration**: Controlled cross-origin access
- **Input Validation**: Pydantic models for all inputs
- **Error Handling**: Secure error messages without stack traces
- **Rate Limiting**: Protected against abuse

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/
```

### Manual Testing Checklist
- [ ] User can sign in with GitHub
- [ ] User can connect Vercel account
- [ ] User can connect Render account
- [ ] User can deploy public repository
- [ ] User can deploy private repository
- [ ] Environment variables are injected correctly
- [ ] Auto-deploy webhook triggers deployment
- [ ] Secrets can be created and revealed
- [ ] Custom domains can be added and verified
- [ ] Real-time WebSocket streaming works
- [ ] Job history persists across sessions

---

## 📝 Development Notes

### Project Structure
```
final/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry
│   │   ├── config.py            # Configuration settings
│   │   ├── contracts.py         # Pydantic models
│   │   ├── auth.py              # Authentication middleware
│   │   ├── routes/              # API route handlers
│   │   │   ├── jobs.py
│   │   │   ├── auth.py
│   │   │   ├── oauth.py
│   │   │   ├── env_vars.py
│   │   │   ├── auto_deploy.py
│   │   │   ├── secrets.py
│   │   │   ├── domains.py
│   │   │   └── webhooks.py
│   │   └── services/            # Business logic
│   │       ├── agent.py         # AI orchestration
│   │       ├── cloner.py        # Git operations
│   │       ├── fingerprint.py   # Repo analysis
│   │       ├── groq_client.py   # LLM client
│   │       ├── vercel_deploy.py # Vercel deployment
│   │       ├── render_deploy.py # Render deployment
│   │       ├── database.py      # Database operations
│   │       └── ...
│   ├── requirements.txt
│   ├── supabase_migrations.sql
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Main application
│   │   ├── types.ts             # TypeScript types
│   │   ├── auth/                # Authentication context
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom hooks
│   │   └── lib/                 # Utilities and API client
│   ├── package.json
│   └── .env.example
└── README.md
```

### Adding New Features
1. Add Pydantic models in `backend/app/contracts.py`
2. Create service in `backend/app/services/`
3. Add route in `backend/app/routes/`
4. Register route in `backend/app/main.py`
5. Add TypeScript types in `frontend/src/types.ts`
6. Add API functions in `frontend/src/lib/api.ts`
7. Create UI components in `frontend/src/components/`

---

## 🚢 Deployment

### Backend Deployment
1. Deploy backend to a hosting platform (Render, Railway, etc.)
2. Set environment variables in production
3. Ensure CORS allows frontend origin
4. Update `VITE_API_BASE_URL` in frontend

### Frontend Deployment
1. Build frontend: `npm run build`
2. Deploy to Vercel/Netlify
3. Set environment variables
4. Configure OAuth callback URLs for production

### Production Checklist
- [ ] Use production database (Supabase)
- [ ] Enable RLS policies in database
- [ ] Use production OAuth apps
- [ ] Set secure CORS origins
- [ ] Enable HTTPS
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Review and harden security settings

---

## 🤝 Contributing

This project was built for the Bano Qabil Hackathon. Contributions are welcome!

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🙏 Acknowledgments

- **Groq** - For providing fast AI inference
- **Supabase** - For authentication and database
- **Vercel** - For frontend deployment platform
- **Render** - For backend deployment platform
- **FastAPI** - For the excellent Python web framework
- **React** - For the frontend library

---

## 📞 Support

For issues, questions, or contributions, please open an issue on the repository.

---

**Built with ❤️ for Bano Qabil Hackathon**
