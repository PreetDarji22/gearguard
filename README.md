# 🛡️ GearGuard — Smart Equipment Maintenance & Reliability Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-gearguard--tracker.web.app-blue?style=for-the-badge&logo=firebase)](https://gearguard-tracker.web.app)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646C99?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-v12-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)

**GearGuard** is an enterprise-grade Computerized Maintenance Management System (CMMS) designed to streamline equipment lifecycle tracking, preventive/corrective maintenance workflows, team allocation, and downtime analytics.

---

## 📌 Problem Statement (PS)

Industrial facilities, labs, and modern enterprises constantly face challenges with unexpected machinery breakdowns, untracked maintenance histories, fragmented communication between operators and technicians, and lack of real-time visibility into equipment health.

### Challenges:
1. **Unplanned Downtime & Cost Leaks**: Manual logging leads to missed preventive maintenance routines, causing costly emergency repairs and operational bottlenecks.
2. **Disorganized Work Orders**: Requests get lost in chat threads, paper forms, or scattered spreadsheets without clear SLA or stage transitions.
3. **Inefficient Workforce Allocation**: Managers lack visibility into technician workloads, leading to overworked teams or idle capacity.
4. **Lack of Actionable Analytics**: Critical reliability metrics like **MTTR** (Mean Time to Repair) and **MTBF** (Mean Time Between Failures) are rarely calculated accurately.

### The GearGuard Solution:
GearGuard bridges operators, maintenance teams, and management into a unified, reactive dashboard with automated scheduling, Kanban-based work order tracking, role-gated permissions, and real-time reliability reports.

---

## ✨ Features

### 1. 📋 Interactive Kanban Work Order Board
- **Drag-and-Drop Workflow**: Move maintenance requests seamlessly across stages (`New`, `In Progress`, `Repaired`, `Scrap`) powered by `@dnd-kit`.
- **Priority & Status Badges**: Visual indicators for urgent, high, medium, and low priority tasks.
- **Quick Filters & Search**: Filter requests by team, equipment, technician, or date.
- **Dual View Modes**: Switch between dynamic Kanban Board and tabular List views.

### 2. ⚙️ Equipment & Asset Lifecycle Management
- **Detailed Asset Profiles**: Track serial numbers, purchase dates, warranty expiry, assigned departments, and status (`Active`, `Under Maintenance`, `Scrapped`).
- **Comprehensive Work Order History**: Every repair request, cost, and resolution logged against individual equipment.
- **Direct Action Buttons**: Create maintenance requests directly from equipment detail screens.

### 3. 👥 Maintenance Teams & Technician Workload
- **Team Hierarchy & Allocation**: Organize technicians into specialized teams (e.g., Electrical, Mechanical, HVAC, IT).
- **Skill & Capacity Tracking**: View team member assignments, active request count, and workload balance.
- **Granular Roles**: Role-based access for Admins, Managers, Technicians, and Operators.

### 4. 📊 Analytics, KPIs & Reliability Reports
- **Reliability Metrics**: Automated computation of **MTTR** (Mean Time to Repair) and **MTBF** (Mean Time Between Failures).
- **Interactive Charts (Recharts)**:
  - Monthly breakdown vs preventive maintenance trends.
  - Equipment downtime distribution by category and team.
  - Maintenance expenditure and parts cost analysis.
- **KPI Summary Cards**: Live counts of open work orders, average resolution times, and equipment availability rate.

### 5. 🔒 Role-Based Security & Permissions
- **Firebase Authentication**: Secure email/password login and registration.
- **Firestore Security Rules**: Role-enforced document access rules protecting equipment, teams, and requests.
- **Protected UI Routes**: Automatic route protection ensuring users only access authorized modules.

---

## 🛠️ Tech Stack

| Category | Technology | Description |
|---|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) | Modern reactive component architecture |
| **Build Tool** | [Vite 8](https://vitejs.dev/) | Ultra-fast HMR and optimized production bundles |
| **Routing** | [React Router v7](https://reactrouter.com/) | Client-side routing with nested routes & role guards |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first, responsive modern styling |
| **Drag & Drop** | [@dnd-kit](https://dndkit.com/) | Accessible, modular drag and drop for Kanban boards |
| **Data Visualization** | [Recharts](https://recharts.org/) | Composable SVG chart library for maintenance metrics |
| **Icons & UI Feedback** | [Lucide React](https://lucide.dev/), [React Hot Toast](https://react-hot-toast.com/) | Crisp icons and toast alerts |
| **Date Utilities** | [date-fns](https://date-fns.org/) | Modular date manipulation and formatting |
| **Backend & Database** | [Google Firebase v12](https://firebase.google.com/) | Cloud Firestore, Firebase Auth, and Firebase Hosting |

---

## 📂 Project Structure

```
gearguard/
├── public/                 # Static public assets
├── src/
│   ├── assets/             # Images, logos, and svg assets
│   ├── components/
│   │   └── layout/         # Navbar, Sidebar, ProtectedRoute, RoleRoute
│   ├── context/
│   │   └── AuthContext.jsx # Firebase authentication and user session state
│   ├── lib/
│   │   └── firebase.js     # Firebase SDK initialization & Firestore references
│   ├── pages/
│   │   ├── auth/           # Login & Register views
│   │   ├── dashboard/      # Executive overview, metrics & activity feed
│   │   ├── equipment/      # Equipment list, inventory & detail views
│   │   ├── reports/        # Analytics, MTTR/MTBF charts & reliability reports
│   │   ├── requests/       # Kanban Board, Request List & Work Order Form
│   │   └── teams/          # Team directory, technician allocation & detail
│   ├── App.jsx             # Route definitions & global context providers
│   ├── index.css           # Global Tailwind CSS imports & theme directives
│   └── main.jsx            # Application root entrypoint
├── .env.example            # Sample environment variables
├── .firebaserc             # Firebase project alias configuration
├── firebase.json           # Firebase Hosting & Firestore rules configuration
├── firestore.rules         # Security and role-based access rules
└── package.json            # Project dependencies and build scripts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.x` or higher
- **npm** or **yarn** / **pnpm**
- A **Firebase Project** with Authentication and Firestore enabled

### 1. Clone the Repository
```bash
git clone https://github.com/PreetDarji22/gearguard.git
cd gearguard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory and provide your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🚀 Deployment

### Building for Production
```bash
npm run build
```

### Deploying to Firebase Hosting & Rules
```bash
npx firebase-tools deploy
```

---

## 🔐 Security & Role Matrix

| Resource / Action | Admin | Manager | Technician | Operator |
|---|:---:|:---:|:---:|:---:|
| **View Dashboard & Equipment** | ✅ | ✅ | ✅ | ✅ |
| **Create Maintenance Request** | ✅ | ✅ | ✅ | ✅ |
| **Update / Move Request Status** | ✅ | ✅ | ✅ | ❌ |
| **Create / Edit Equipment** | ✅ | ✅ | ❌ | ❌ |
| **Manage Teams & Technicians** | ✅ | ✅ | ❌ | ❌ |
| **Access Reports & Analytics** | ✅ | ✅ | ❌ | ❌ |
| **Delete Records / Admin Settings** | ✅ | ❌ | ❌ | ❌ |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
