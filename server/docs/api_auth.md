# Authentication & RBAC API Specification
**Smart Event Management Platform — PromptWars × AbhiyantriX**

All API endpoints are prefixed with `/api`.

---

## 1. POST `/api/auth/register`
* **Description**: Register a new participant account.
* **Authentication**: None (Public).
* **Role Policy**: **Always** assigns `role: 'participant'`. Client cannot self-assign `judge` or `organizer`. Mass assignment of protected fields is blocked.
* **Request Body**:
```json
{
  "name": "Jordan Lee",
  "email": "jordan.lee@example.com",
  "password": "SecurePassword123!",
  "skills": ["Python", "PyTorch"],
  "preferred_roles": ["ML Engineer"],
  "interests": ["AI/ML", "Healthcare"],
  "bio": "Deep learning builder."
}
```
* **Success Response** (`201 Created`):
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "usr_c342f1b8-6a3d-4c8d-bf8d-e4b7bca40231",
    "name": "Jordan Lee",
    "email": "jordan.lee@example.com",
    "role": "participant",
    "skills": ["Python", "PyTorch"],
    "preferred_roles": ["ML Engineer"],
    "interests": ["AI/ML", "Healthcare"],
    "bio": "Deep learning builder.",
    "checked_in": false,
    "is_demo": false
  }
}
```
* **Common Errors**:
  * `400 Bad Request`: Validation failure (name < 2 chars, invalid email, password < 8 chars).
  * `409 Conflict`: Email address already registered.

---

## 2. POST `/api/auth/login`
* **Description**: Authenticate with email and password.
* **Authentication**: None (Public).
* **Security Protection**: Generic error message prevents user enumeration.
* **Request Body**:
```json
{
  "email": "alex@hackathon.dev",
  "password": "password123"
}
```
* **Success Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "usr_alex_01",
    "name": "Alex Chen",
    "email": "alex@hackathon.dev",
    "role": "participant",
    "skills": ["React", "TypeScript", "Node.js", "TailwindCSS"],
    "preferred_roles": ["Frontend Developer", "Fullstack Engineer"],
    "interests": ["AI/ML", "Healthcare", "FinTech"],
    "bio": "Fullstack builder passionate about applying AI to patient diagnostics.",
    "checked_in": false,
    "is_demo": true
  }
}
```
* **Common Errors**:
  * `400 Bad Request`: Missing or malformed email/password.
  * `401 Unauthorized`: "Invalid email or password" (returned identically for wrong password or nonexistent account).

---

## 3. GET `/api/auth/me`
* **Description**: Retrieve current authenticated user profile.
* **Authentication**: Required (`Bearer <token>` in `Authorization` header).
* **Success Response** (`200 OK`):
```json
{
  "success": true,
  "user": {
    "id": "usr_alex_01",
    "name": "Alex Chen",
    "email": "alex@hackathon.dev",
    "role": "participant",
    "skills": ["React", "TypeScript"],
    "preferred_roles": ["Frontend Developer"],
    "interests": ["AI/ML"],
    "bio": "...",
    "checked_in": false,
    "is_demo": true
  }
}
```
* **Common Errors**:
  * `401 Unauthorized`: Missing, expired, or tampered JWT token.

---

## 4. POST `/api/auth/demo-login`
* **Description**: 1-click test login for hackathon evaluation.
* **Authentication**: None (Controlled by `DEMO_MODE=true` server environment flag).
* **Security**: Client can only supply `demoRole: "participant" | "judge" | "organizer"`. The server maps the role to a seeded account and never accepts arbitrary user IDs.
* **Request Body**:
```json
{
  "demoRole": "participant"
}
```
* **Success Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Authenticated as demo participant",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": { ... }
}
```
* **Common Errors**:
  * `400 Bad Request`: Invalid `demoRole` not in allowlist.
  * `403 Forbidden`: Demo login disabled in production.

---

## 5. POST `/api/auth/logout`
* **Description**: Stateless logout endpoint.
* **Authentication**: Required.
* **JWT Strategy**: As a stateless JWT architecture, the client discards the token from memory / local storage upon calling this endpoint.
* **Success Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Logged out successfully. Please discard your authentication token."
}
```

---

## 6. Role-Based Access Control (RBAC) Specification

| Route Guard | Participant | Judge | Organizer | Unauthenticated |
|---|:---:|:---:|:---:|:---:|
| `requireRole('participant')` | `200 OK` | `403 Forbidden` | `403 Forbidden` | `401 Unauthorized` |
| `requireRole('judge')` | `403 Forbidden` | `200 OK` | `403 Forbidden` | `401 Unauthorized` |
| `requireRole('organizer')` | `403 Forbidden` | `403 Forbidden` | `200 OK` | `401 Unauthorized` |
| `requireRole(['judge', 'organizer'])` | `403 Forbidden` | `200 OK` | `200 OK` | `401 Unauthorized` |
