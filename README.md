# 🌾 SmartSeason Field Monitoring System

[![Live Demo](https://img.shields.io/badge/Live-Demo-green)](https://shamba-records-smartseason-field-mo.vercel.app/)
[![API Docs](https://img.shields.io/badge/API-Docs-blue)](https://shamba-records-smartseason-field.onrender.com/api/docs/)
[![Uptime](https://img.shields.io/badge/Uptime-99.3%25-brightgreen)](https://uptimerobot.com/)
[![Django](https://img.shields.io/badge/Django-4.2-green)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-cyan)](https://tailwindcss.com/)

A comprehensive field monitoring system for tracking crop progress across multiple fields during growing seasons. Built for agricultural coordinators and field agents to manage crops, record observations, and monitor field health in real-time.

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| **Frontend Application** | [https://shamba-records-smartseason-field-mo.vercel.app](https://shamba-records-smartseason-field-mo.vercel.app) |
| **Backend API** | [https://shamba-records-smartseason-field.onrender.com](https://shamba-records-smartseason-field.onrender.com) |
| **API Documentation** | [https://shamba-records-smartseason-field.onrender.com/api/docs/](https://shamba-records-smartseason-field.onrender.com/api/docs/) |


## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `adminshambarecords@gmail.com` | `Admin@123` |
| **Field Agent** | `agentshambarecords@gmail.com` | `agent123` |

> These credentials are pre-configured in the backend. Use them to test both roles.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Live Demo](#live-demo)
- [Demo Credentials](#demo-credentials)
- [Installation Guide](#installation-guide)
- [API Documentation](#api-documentation)
- [Design Decisions](#design-decisions)
- [Status Logic Explanation](#status-logic-explanation)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Assumptions--trade-offs](#assumptions--trade-offs)
- [Deployment](#deployment)
- [Monitoring--automation](#monitoring--automation)
- [Future Improvements](#future-improvements)
- [Troubleshooting](#troubleshooting)
- [Acknowledgements](#acknowledgements)
- [Contact](#contact)

---

## 🎯 Overview

SmartSeason helps agricultural organizations track crop progress across multiple fields. The system supports two user roles:

- **Admin (Coordinator):** Full system access - create fields, assign agents, monitor all activities
- **Field Agent:** Manage assigned fields, add observations, update crop stages

The application automatically computes field status (Active/At Risk/Completed) based on planting dates, helping teams identify fields needing attention before issues escalate.

---

## ✨ Features

### Core Features

| Feature | Description |
|---------|-------------|
| **Role-Based Authentication** | JWT authentication with Admin and Field Agent roles |
| **Field Management** | Create, read, update, delete fields with crop details |
| **Field Assignment** | Admins can assign fields to specific agents |
| **Observations System** | Agents add notes, update stages, record crop health |
| **Smart Status Logic** | Automatic status calculation (Active/At Risk/Completed) |
| **Role-Specific Dashboards** | Tailored views for Admins and Agents |
| **Analytics & Reporting** | Charts, trends, and CSV export |
| **User Management** | Admins can create, activate, deactivate users |
| **API Documentation** | Interactive Swagger/OpenAPI docs |

## 🔐 Security Considerations

- **Role-Based Access Control (RBAC):** Enforced at the API level to ensure Admins and Field Agents only access permitted resources.

- **Restricted Admin Creation:** Admin accounts cannot be created via public registration. Only existing admins can create new admin users through a protected endpoint. This prevents privilege escalation and mirrors real-world system design.

- **JWT Authentication:** Secure token-based authentication used for all protected endpoints.

- **Protected Routes:** All sensitive operations (field creation, assignment, user management) require authentication.

- **CORS Configuration:** Configured to allow only trusted frontend origins.

## 🏗️ System Architecture

The application follows a client-server architecture:

- **Frontend (React):** Handles UI, routing, and user interactions. Communicates with backend via REST APIs.

- **Backend (Django + DRF):** Handles business logic, authentication, and data processing. Exposes RESTful endpoints.

- **Database (PostgreSQL):** Stores users, fields, and observations.

### Data Flow:
1. User logs in → receives JWT token
2. Frontend stores token and sends it with requests
3. Backend validates token and enforces permissions
4. Data is processed and returned to frontend

### Field Lifecycle Stages

Planted → Growing → Ready → Harvested

### Status Logic

| Status | Condition |
|--------|-----------|
| **Active** | Stage is not Harvested AND planted within 90 days |
| **At Risk** | Stage is not Harvested AND planted more than 90 days ago |
| **Completed** | Stage is Harvested |

---

## 🛠️ Tech Stack

### Backend

| Technology | Purpose |
|------------|---------|
| **Django 4.2** | Web framework |
| **Django REST Framework** | API development |
| **Simple JWT** | Authentication |
| **PostgreSQL** | Production database |
| **SQLite** | Development database |
| **drf-spectacular** | OpenAPI/Swagger documentation |

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool |
| **Tailwind CSS** | Styling |
| **Axios** | HTTP client |
| **React Router DOM** | Routing |
| **Recharts** | Data visualization |
| **Lucide React** | Icons |

### Deployment

| Service | Purpose |
|---------|---------|
| **Render** | Backend hosting (PostgreSQL + web service) |
| **Vercel** | Frontend hosting |

---

## 🚀 Installation Guide

### Prerequisites

- Python 3.11+ installed
- Node.js 18+ installed
- Git installed
- PostgreSQL (optional, SQLite works for development)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Dama5323/shamba-records-smartseason-field-monitoring.git
cd shamba-records-smartseason-field-monitoring
```

### Step 2: Backend Setup

#### 2.1 Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

#### 2.2 Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### 2.3 Configure Environment Variables
Create a `.env` file in the `backend/` directory:
```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///db.sqlite3
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

#### 2.4 Run Migrations
```bash
python manage.py migrate
```

#### 2.5 Create Admin User (Optional for Development)
```bash
python manage.py createsuperuser
```

#### 2.6 Run Development Server
```bash
python manage.py runserver
```
Backend will run at: `http://localhost:8000`

### Step 3: Frontend Setup
#### Install Dependencies
```bash
cd ../frontend
npm install
```

#### Configure Environment Variables
Create a .env file in the frontend/ directory:
```
env
VITE_API_URL=http://localhost:8000/api
```
 
#### Run Development Server
```
bash
npm run dev
```
Frontend will run at: http://localhost:5173


## 📚 API Documentation

Once the backend is running, access interactive API documentation:

| Format | URL |
|--------|-----|
| **Swagger UI** | `http://localhost:8000/api/docs/` |
| **ReDoc** | `http://localhost:8000/api/redoc/` |
| **OpenAPI Schema** | `http://localhost:8000/api/schema/` |

> 💡 **Tip:** The Swagger UI provides an interactive interface to test all API endpoints directly from your browser.

### 2. Key API Endpoints

```markdown

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register/` | Register new user | Public |
| POST | `/api/auth/login/` | Login user | Public |
| GET | `/api/auth/profile/` | Get user profile | Authenticated |
| GET | `/api/fields/` | List fields | Authenticated |
| POST | `/api/fields/` | Create field | Admin only |
| GET | `/api/fields/{id}/` | Get field details | Authenticated |
| POST | `/api/fields/{id}/add_observation/` | Add observation | Agent/Admin |
| GET | `/api/fields/statistics/` | Dashboard statistics | Authenticated |
| POST | `/api/fields/assign/{id}/` | Assign field to agent | Admin only |
| GET | `/api/auth/users/` | List users | Admin only |
| POST | `/api/auth/admin/create/` | Create admin user | Admin only |
```


## 🧠 Design Decisions

### 1. Status Logic Implementation

**Decision:** Compute status as a property on the Field model rather than storing in database.

**Why:** Status is derived from existing data (planting_date + current_stage). Computing on-the-fly ensures it's always accurate without needing to update timestamps.

**Status Calculation:**
```python
@property
def status(self):
    if self.current_stage == 'harvested':
        return 'Completed'
    if self.planting_date:
        days_since_planting = (date.today() - self.planting_date).days
        if days_since_planting > 90:
            return 'At Risk'
    return 'Active'

```

### 2. Authentication Approach
**Decision:** JWT (JSON Web Tokens) with djangorestframework-simplejwt

**Why:**

Stateless authentication works well for SPA + API architecture

Tokens can be stored client-side

Easy integration with React frontend

### 3. Database Choice
**Decision:** SQLite for development, PostgreSQL for production

**Why:**

SQLite has zero configuration for local development

PostgreSQL offers better concurrency and features for production

### 4. Frontend Styling
**Decision:** Tailwind CSS with custom color scheme (Shamba brand colors)

**Why:**

Utility-first approach enables rapid UI development

Consistent design system across components

Responsive out-of-the-box

### 5. API Structure
**Decision:** REST with Django REST Framework + ViewSets

**Why:**

Clean separation between views, serializers, and models

DRF ViewSets reduce boilerplate code

Browsable API for easy debugging

## 📊 Database Schema

### Accounts App (User Model)

| Field | Type | Description |
|-------|------|-------------|
| email | EmailField (unique) | User email (used for login) |
| username | CharField | Display username |
| role | CharField | `admin` or `agent` |
| phone_number | CharField | Contact number |
| location | CharField | Geographic location |
| farm_name | CharField | Farm/business name |
| is_active | BooleanField | Account status |
| is_email_verified | BooleanField | Email verification status |

### Field Model

| Field | Type | Description |
|-------|------|-------------|
| name | CharField | Field identifier |
| crop_type | CharField | Type of crop planted |
| planting_date | DateField | Date crop was planted |
| current_stage | CharField | planted / growing / ready / harvested |
| field_size | DecimalField | Size in acres/hectares |
| location | CharField | Physical location |
| assigned_to | ForeignKey | Assigned agent |
| created_by | ForeignKey | Creator (admin) |

### Observation Model

| Field | Type | Description |
|-------|------|-------------|
| field | ForeignKey | Associated field |
| agent | ForeignKey | Observation creator |
| note | TextField | Observation notes |
| stage_at_observation | CharField | Field stage when observed |
| crop_health | CharField | excellent / good / fair / poor |
| created_at | DateTimeField | Timestamp |


### Assumptions & Trade-offs
#### Assumptions
**Gmail-only registration** - Assumed the organization uses Gmail for communication

**90-day risk threshold** - Fields become "At Risk" after 90 days without harvest (adjustable based on crop type in production)

**No mobile app** - Web-based only, but fully responsive

**Single timezone** - All dates stored in UTC

#### Trade-offs

| Trade-off | Why Acceptable |
|-----------|----------------|
| Status computed in real-time (not stored) | Simpler, no sync issues, minimal performance impact |
| SQLite in development | Faster setup, PostgreSQL same schema in production |
| No real-time notifications | Out of scope for initial version |
| Simple password validation | Sufficient for demo; can add complexity later |


## 📁 Project Structure
```text
shamba-records-smartseason-field-monitoring/
├── backend/
│   ├── accounts/
│   │   ├── models.py          # Custom User model
│   │   ├── views.py           # Auth endpoints
│   │   ├── serializers.py     # User serializers
│   │   ├── urls.py
│   │   └── management/
│   │       └── commands/      # ensure_admin command
│   ├── fields/
│   │   ├── models.py          # Field, Observation models
│   │   ├── views.py           # CRUD + dashboard endpoints
│   │   ├── serializers.py
│   │   ├── permissions.py     # Role-based permissions
│   │   └── urls.py
│   ├── smartseason/
│   │   ├── settings.py        # Base settings
│   │   ├── settings_production.py  # Production settings
│   │   └── urls.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/          # Login, Register
│   │   │   ├── dashboard/     # AdminDashboard, AgentDashboard
│   │   │   ├── fields/        # FieldList, FieldDetail, CreateField
│   │   │   ├── admin/         # UserManagement
│   │   │   ├── common/        # Navbar, ProtectedRoute
│   │   │   └── layout/        # DashboardLayout, Sidebar, Header
│   │   ├── contexts/          # AuthContext
│   │   ├── services/          # API service layer
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## ☁️ Deployment
### Backend Deployment (Render)
Push code to GitHub

Create new Web Service on Render

Connect to GitHub repository

Configure settings:

Build Command: pip install -r requirements.txt && python manage.py migrate && python manage.py ensure_admin && python manage.py collectstatic --noinput

Start Command: gunicorn smartseason.wsgi:application

Add environment variables:

DATABASE_URL (Render PostgreSQL)

DJANGO_SETTINGS_MODULE = smartseason.settings_production

### Frontend Deployment (Vercel)
Push code to GitHub

Import project in Vercel

Configure:

Framework Preset: Vite

Build Command: npm run build

Output Directory: dist

Add environment variable:

VITE_API_URL = https://your-backend-url.onrender.com/api


## 📡 Monitoring & Automation
To ensure the application remains accessible 24/7 on Render's free tier, the following monitoring and automation systems are in place:

### Uptime Monitoring (Uptime Robot)

- Purpose: Prevents the Render backend from sleeping after 15 minutes of inactivity

- Interval: Every 5 minutes

- Endpoint: GET /health/

- Current Uptime: 99.3%

- Status: ✅ Operational

The health check endpoint returns a simple JSON response confirming the server is running:

```json
{"status": "ok", "message": "Server is running"}
```

#### Automated Database Renewal (cron-job.org)

- Purpose: Prevents the free-tier PostgreSQL database from expiring after 30 days

- Schedule: Every 25 days at midnight (Africa/Nairobi timezone)

- Endpoint: POST /api/renew-database/

- Authentication: X-API-Key header

- Test Status: ✅ Successful (200 OK, 416ms response)

The renewal webhook triggers a management command that:

1. Creates a database backup

2. Deletes the expiring database

3. Provisions a new free-tier database

4. Restores all data from the backup

#### Automation Architecture
```text
┌─────────────────────────────────────────────────────────┐
│                    UPTIME ROBOT                         │
│  ✅ Every 5 minutes → /health/ → Keeps app awake       │
│  📊 Uptime: 99.3% (excellent for free tier)            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    CRON-JOB.ORG                         │
│  ⏰ Every 25 days → /api/renew-database/ → Renews DB   │
│  🔐 X-API-Key authentication → Secure                   │
│  📅 Prevents 30-day database expiration                 │
└─────────────────────────────────────────────────────────┘
```

#### Verify Monitoring Status
```bash
# Check health endpoint
curl https://shamba-records-smartseason-field.onrender.com/health/

# Test webhook (requires valid API key)
curl -X POST https://shamba-records-smartseason-field.onrender.com/api/renew-database/ \
  -H "X-API-Key: your-secret-key"

```


## 🔮 Future Improvements
Real-time notifications for at-risk fields

Weather API integration for planting recommendations

Bulk import fields via CSV

Email/SMS alerts for critical updates

Mobile app (React Native)

Multi-language support

Advanced analytics with ML predictions

Integration with IoT sensors

## 🐛 Troubleshooting

### Common Issues

**CORS errors**
- Ensure `CORS_ALLOWED_ORIGINS` includes your frontend URL

**401 Unauthorized**
- Token expired - login again

**404 Not Found**
- Check API endpoint URL matches frontend configuration

**Database migrations fail**
- Run `python manage.py makemigrations` then `migrate`

**Admin user missing**
- Run `python manage.py ensure_admin`

### Getting Help

1. Check the API documentation at `/api/docs/`
2. Review Django server logs for backend errors
3. Check browser console for frontend errors


## 🙏 Acknowledgements
Shamba Records for the opportunity

Django REST Framework community

React and Tailwind CSS communities

## 📧 Contact
Developer: Damaris Chege
GitHub: @Dama5323
Project Repository: [GitHub Link](https://github.com/Dama5323/shamba-records-smartseason-field-monitoring.git)