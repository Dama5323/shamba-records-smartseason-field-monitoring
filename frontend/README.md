# 🌾 SmartSeason - Frontend

A modern, responsive field monitoring dashboard for agricultural crop management. Built with React, Vite, and Tailwind CSS.

**Live Demo:** https://shamba-records-smartseason-field-mo.vercel.app/

## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `adminshambarecords@gmail.com` | `Admin@123` |
| **Field Agent** | `agentshambarecords@gmail.com` | `agent123` |

> These credentials are pre-configured in the backend. Use them to test both roles.

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI Framework |
| Vite | 5.x | Build Tool |
| Tailwind CSS | 3.x | Styling |
| React Router DOM | 6.x | Routing |
| Axios | 1.x | API Client |
| Recharts | 2.x | Charts & Graphs |
| Lucide React | Latest | Icons |
| React Hot Toast | Latest | Notifications |

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Required - Backend API URL
VITE_API_URL=http://localhost:8000/api

# For production deployment
# VITE_API_URL=https://your-backend.onrender.com/api
```


### 5. **Installation & Setup (Step by Step)**


## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Step 1: Clone & Navigate
```bash
git clone https://github.com/Dama5323/shamba-records-smartseason-field-monitoring.git
cd shamba-records-smartseason-field-monitoring/frontend
```

### Step 2 install dependancies
```bash
npm install
```

### Step 3: Configure Environment
```bash
cp .env.example .env
```

### Step 4: Run Development Server
```bash
npm run dev
The app will be available at http://localhost:5173
```

### Step 5: Build for Production
```bash
npm run build
npm run preview
```


## 📁 Project Structure
```markdown
frontend/
├── src/
│ ├── components/
│ │ ├── auth/ # Login, Register
│ │ ├── dashboard/ # AdminDashboard, AgentDashboard
│ │ ├── fields/ # FieldList, FieldDetail, CreateField
│ │ ├── admin/ # UserManagement
│ │ ├── common/ # Navbar, ProtectedRoute
│ │ ├── layout/ # DashboardLayout, Sidebar, Header
│ │ └── observations/ # ObservationList
│ ├── contexts/ # AuthContext
│ ├── services/ # API service layer
│ ├── utils/ # Helpers, constants
│ ├── App.jsx
│ └── main.jsx
├── public/ # Static assets
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── .env
```

## 🔌 API Integration

The frontend communicates with the backend REST API:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login/` | POST | User authentication |
| `/auth/register/` | POST | New user registration |
| `/auth/profile/` | GET | Get user profile |
| `/fields/` | GET/POST | List/Create fields |
| `/fields/{id}/` | GET/PUT/DELETE | Field operations |
| `/fields/{id}/add_observation/` | POST | Add observation |
| `/dashboard/stats/` | GET | Dashboard statistics |
| `/auth/users/` | GET | List users (Admin) |
| `/auth/admin/create/` | POST | Create admin user |

All API calls are handled in `src/services/api.js` with:
- Automatic JWT token injection
- Token refresh on 401 responses
- Global error handling

## 👥 Role-Based Access Control

| Feature | Admin | Field Agent |
|---------|-------|-------------|
| Create fields | ✅ | ❌ |
| Assign fields to agents | ✅ | ❌ |
| Update field stages | ✅ | ✅ |
| Add observations | ✅ | ✅ |
| View all fields | ✅ | ❌ |
| View assigned fields | ✅ | ✅ |
| Manage users | ✅ | ❌ |
| Create admin users | ✅ | ❌ |
| Export data | ✅ | ❌ |

Routes are protected using `ProtectedRoute` component:
- Admin-only routes require `adminOnly` prop
- Agent-only routes restrict to assigned fields only

## 🎨 Styling

### Design System
- **Primary Color:** Emerald/Green (#2E7D32) - Agricultural theme
- **Secondary:** Gray palette for clean UI
- **Accent:** Amber for warnings/alerts

### Responsive Breakpoints
- Mobile: < 768px (single column)
- Tablet: 768px - 1024px (2 columns)
- Desktop: > 1024px (4 columns)

### Tailwind Configuration
Custom colors defined in `tailwind.config.js`:
```javascript
colors: {
  shamba: {
    light: '#4CAF50',
    DEFAULT: '#2E7D32',
    dark: '#1B5E20',
  }
}
```


### Key Components Explained
## 📦 Key Components

### AuthContext
Manages authentication state, stores JWT tokens, provides login/register/logout functions.

### ProtectedRoute
Wraps routes requiring authentication, redirects to login if not authenticated.

### AdminDashboard
Main dashboard for admin users with stats, charts, and management tools.

### AgentDashboard
Dashboard for field agents showing only assigned fields and observations.

### FieldList
Displays fields with filters (All/Active/At Risk/Completed) and search.

### ObservationForm
Modal/form for adding observations with crop health and stage options.


## 🐛 Troubleshooting

### CORS Errors
Ensure backend CORS settings include your frontend URL:
```javascript
CORS_ALLOWED_ORIGINS = ["http://localhost:5173", "http://localhost:3000"]
```

## 📧 Contact

**Developer:** Damaris Chege  
**GitHub:** [@Dama5323](https://github.com/Dama5323)  
**Email:** deenyashke@gmail.com  
**Project Repository:** [GitHub Link](https://github.com/Dama5323/shamba-records-smartseason-field-monitoring)