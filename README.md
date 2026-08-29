# Smart Event Management Platform

A unified, role-based event management platform designed to streamline the complete lifecycle of hackathons, tech fests, and other large-scale events — from participant registration and QR-based check-in to team formation, project submissions, judging, and organizer analytics.

Built for **PromptWars × AbhiyantriX 2026**.

---

## 🚀 Overview

Organizing large-scale events often requires multiple disconnected systems for registration, attendance, team formation, submissions, judging, and event monitoring.

The **Smart Event Management Platform** brings these workflows together into a single web application with dedicated experiences for:

* 👤 Participants
* ⚖️ Judges
* 🧑‍💼 Organizers

The platform uses a centralized backend and SQLite database so that important event operations are backed by real application data rather than frontend mock states.

---

## ✨ Key Features

### 👤 Participant Portal

* Secure participant authentication
* Digital participant pass
* Unique QR-based attendance credential
* Attendance/check-in status
* Team discovery and team membership
* Team information
* Project submission management
* Repository and demo URL support
* Participant profile with skills, interests, and preferred roles

### 📱 QR Attendance & Check-in

* Cryptographically generated attendance tokens
* QR code generation for participants
* Organizer-only verification terminal
* Manual token entry fallback
* Server-side token validation
* Duplicate check-in prevention
* Atomic database update
* Check-in timestamp tracking
* Safe attendee information returned to organizers

### 🤝 Smart Team Formation

Participants can discover and form teams based on:

* Skills
* Preferred roles
* Interests
* Project requirements

The backend enforces team membership constraints, including one-team-per-participant behavior.

### 📂 Project Submissions

Team leads can:

* Create a project submission
* Update their team's submission
* Add project title and tagline
* Provide a project description
* Add repository URL
* Add demo URL
* Select a track

Security and ownership are enforced server-side.

Each team is limited to one project submission.

### ⚖️ Judge Dashboard

Judges can review project submissions and evaluate them using a structured rubric.

Evaluation categories include:

* Innovation
* Technical implementation
* Impact
* Presentation
* Structured feedback

Each judge can submit one evaluation per submission.

### 🧑‍💼 Organizer Dashboard

Organizers have access to event-level information including:

* Total participants
* Checked-in participants
* Attendance percentage
* Teams formed
* Unassigned participants
* Projects submitted
* Judging progress
* Average score
* Attendee roster
* Check-in verification

Analytics are calculated from the actual SQLite database.

---

## 🔐 Security

The platform includes server-side security controls such as:

* Role-based access control (RBAC)
* Authentication middleware
* Server-side ownership checks
* Zod request validation
* Password hashing with bcrypt
* Cryptographically generated attendance credentials
* SHA-256 token hashing
* Timing-safe token comparison
* Protection against duplicate attendance
* Database uniqueness constraints
* Restricted access to organizer and judge functionality
* Sensitive-field filtering in API responses

Attendance QR codes contain an opaque token rather than passwords, JWTs, or unnecessary personal information.

---

## 🏗️ System Architecture

```text
┌──────────────────────────────────────────┐
│              React Frontend              │
│                                          │
│ Participant │ Judge │ Organizer          │
└────────────────────┬─────────────────────┘
                     │
                     │ REST API
                     ▼
┌──────────────────────────────────────────┐
│            Express Backend               │
│                                          │
│ Authentication                           │
│ RBAC                                     │
│ Validation                               │
│ QR Check-in                              │
│ Teams                                    │
│ Submissions                              │
│ Judging                                  │
│ Analytics                                │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│                 SQLite                   │
│                                          │
│ Users                                    │
│ Teams                                    │
│ Team Members                             │
│ Submissions                              │
│ Evaluations                              │
│ Announcements                            │
└──────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* JavaScript
* Axios
* Lucide React

### Backend

* Node.js
* Express.js
* JavaScript (ES Modules)
* Zod
* bcryptjs
* JSON Web Tokens
* QRCode

### Database

* SQLite

### Testing

* Vitest
* Supertest

### Development Tools

* Git
* GitHub
* VS Code / Antigravity IDE

---

## 📁 Project Structure

```text
smart-event-management-platform/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── validations/
│   │   └── ...
│   ├── tests/
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## ⚙️ Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/shabnamk-dev/smart-event-management-platform.git
cd smart-event-management-platform
```

### 2. Install dependencies

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies:

```bash
cd ../client
npm install
```

### 3. Configure environment variables

Create the required environment configuration for the backend.

Example:

```env
PORT=5000
JWT_SECRET=your_secure_secret
```

Use a strong secret in production.

### 4. Start the backend

From the `server` directory:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

### 5. Start the frontend

From the `client` directory:

```bash
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

---

## 🧪 Testing

Run the complete backend test suite:

```bash
cd server
npx vitest run
```

The current implementation has been verified with:

```text
12 test files
89 tests
89 passed
0 failed
```

The test suite covers areas including:

* Authentication
* RBAC
* Users
* Teams
* Submissions
* Organizer functionality
* Security
* Database behavior
* Matching
* Scoring
* Critical end-to-end workflows

---

## 🔄 Critical Event Workflow

The platform supports the following core workflow:

```text
Participant Registration
        ↓
Participant Login
        ↓
Digital QR Pass Generated
        ↓
Organizer Scans / Enters Token
        ↓
Server Validates Attendance Token
        ↓
Participant Checked In
        ↓
Organizer Analytics Updated
        ↓
Participant Forms / Joins Team
        ↓
Team Lead Creates Submission
        ↓
Judge Reviews Submission
        ↓
Judge Scores Project
        ↓
Evaluation Stored
```

---

## 👥 User Roles

| Role        | Capabilities                                           |
| ----------- | ------------------------------------------------------ |
| Participant | Profile, teams, QR pass, project submission            |
| Judge       | View submissions, score projects, provide feedback     |
| Organizer   | Check-in, attendee roster, analytics, event management |

All role-sensitive operations are protected through backend RBAC rather than relying solely on frontend navigation.

---

## 🔗 API Highlights

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### QR / Attendance

```text
GET  /api/users/qr
POST /api/organizer/checkin
GET  /api/organizer/attendees
```

### Organizer Analytics

```text
GET /api/organizer/analytics
```

### Teams

```text
GET  /api/teams
POST /api/teams
POST /api/teams/join
GET  /api/teams/my
```

### Submissions

```text
GET /api/submissions
GET /api/submissions/my
POST /api/submissions
PUT /api/submissions
```

### Judging

Judge evaluation endpoints provide submission review, rubric scoring, and structured feedback functionality.

---

## 📊 Database Design

The SQLite relational schema contains:

* `users`
* `teams`
* `team_members`
* `submissions`
* `announcements`
* `evaluations`

Important constraints are enforced at the database level, including:

* Unique participant email
* One team per participant
* One submission per team
* One evaluation per judge per submission
* Valid role values
* Valid scoring ranges
* Attendance state constraints

---

## 🎯 Hackathon Problem Solved

The platform addresses the fragmentation problem in event management by bringing several workflows into one system:

```text
Registration
     +
Attendance
     +
Team Formation
     +
Project Submission
     +
Judging
     +
Analytics
     ↓
Unified Event Management Platform
```

Instead of organizers switching between multiple disconnected tools, event operations can be managed through role-specific dashboards backed by a shared data layer.

---

## 🏆 Project Status

**Hackathon MVP — Demo Ready**

Core workflows have been implemented and tested, including:

* Participant authentication
* QR attendance
* Organizer check-in
* Attendance analytics
* Team management
* Project submissions
* Judge evaluation
* Role-based access control
* Backend validation
* Security checks

Frontend production build has also been successfully verified.

---

## 👩‍💻 Team

Built for **PromptWars × AbhiyantriX 2026**.

---

## 📜 License

This project was developed as a hackathon project.
