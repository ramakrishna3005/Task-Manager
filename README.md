# AuraTasks - Full Stack Task Management Workspace

AuraTasks is a responsive, full-stack task management application featuring a modern Glassmorphism theme, user authentication, complete task CRUD workflows, and real-time synchronization across multiple active browser instances using WebSockets.

---

## 🚀 Key Features

* **User Authentication & Session Management**:
  - Secure User Registration and Login.
  - Password hashing on the backend using `bcryptjs`.
  - Secure state tracking with JSON Web Tokens (JWT).
  - Automatic session restoration on page reload.
* **Interactive Kanban Board**:
  - Tasks organized into four status columns: **To Do**, **In Progress**, **Under Review**, and **Done**.
  - Advanced filtering controls by Priority level (Low, Medium, High).
  - Dynamic Search bar filtering tasks by title and description.
  - Detail editing and deletion pop-ups for tasks.
* **Real-time Collaboration & Synchronization**:
  - Driven by a native WebSocket implementation.
  - Instantly broadcasts updates (`TASK_CREATED`, `TASK_UPDATED`, `TASK_DELETED`) to other active tabs logged in to the same account.
  - Displays sliding Toast Notifications describing changes made on other client sessions.
* **Responsive Visual Design**:
  - Sleek dark theme with glowing color gradients and glassmorphism styling (`backdrop-filter`).
  - Native SVG icons with responsive scaling.
  - Fully mobile-friendly grid layouts that stack columns dynamically based on viewport size.

---

## 🛠️ Technology Stack

* **Frontend**:
  - React (Vite-scaffolded Single Page Application)
  - Vanilla CSS (Tailwind-free custom variable styling)
* **Backend**:
  - Node.js & Express.js (REST API Server)
  - WebSockets (Native Node `ws` integration)
  - JSON File Database (Local transactions manager)

---

## 📁 Project Structure

```text
task-manager/
├── package.json          # Root scripts to run both apps concurrently
├── .gitignore            # Excludes node_modules, local db, and builds
├── README.md             # Project documentation
├── backend/
│   ├── package.json      # Backend dependencies
│   ├── server.js         # API and WebSocket server logic
│   └── database.js       # Transaction database helper for db.json
└── frontend/
    ├── package.json      # React dependencies
    ├── index.html        # HTML shell and Google Fonts loader
    └── src/
        ├── main.jsx      # React mounting entry point
        ├── App.jsx       # View routing and context wrapper
        ├── index.css     # Global variables and Glassmorphic layouts
        ├── components/
        │   ├── Auth.jsx          # Login/Signup forms card
        │   ├── Dashboard.jsx     # Main workspace grid and toolbar
        │   ├── TaskCard.jsx      # Single task card rendering
        │   ├── TaskModal.jsx     # Task editing dialog form
        │   └── Notification.jsx  # Floating toast system
        ├── context/
        │   ├── AuthContext.jsx       # User auth session provider
        │   └── WebSocketContext.jsx  # Socket connection and Toast broker
        └── services/
            └── api.js                # Fetch requests mapping layer
```

---

## 💻 Local Setup & Installation

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18.0.0+ recommended).

### 1. Clone or Download the Project
Ensure the project folder structure matches the layout above.

### 2. Install Dependencies
Run the installation command in the root folder to set up both backend and frontend environments automatically:
```bash
npm install && npm run install-all
```

### 3. Start the Development Servers
Launch both dev servers concurrently:
```bash
npm run dev
```
* **Frontend UI**: [http://localhost:5173/](http://localhost:5173/)
* **Backend REST Server**: `http://localhost:5000`

---

## 🧪 Verification & Testing

1. **Sign Up**: Open [http://localhost:5173/](http://localhost:5173/), click "Create Account" and sign up (e.g. username: `demo`, password: `password123`).
2. **Add Tasks**: Click **+ Create Task**, fill out details, and save. Verify the card pops up on the board.
3. **Edit Status**: Click the card to open the editing dialog, change status, and watch it animate into the correct column.
4. **WebSocket Sync (Multi-tab)**:
   - Open a second private/incognito window side-by-side.
   - Sign in using the exact same username (`demo`).
   - Create or update a task on one window; observe the change populate instantly in the other window accompanied by a toast alert.
