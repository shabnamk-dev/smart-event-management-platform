# Participant Experience & Team Matching API Specification
**Smart Event Management Platform — PromptWars × AbhiyantriX**

All API endpoints are prefixed with `/api`.

---

## 1. GET `/api/users/profile`
* **Description**: Retrieve current authenticated user's profile.
* **Authentication**: Required (`Bearer <token>`).
* **Success Response** (`200 OK`):
```json
{
  "success": true,
  "user": {
    "id": "usr_alex_01",
    "name": "Alex Chen",
    "email": "alex@hackathon.dev",
    "role": "participant",
    "skills": ["React", "TypeScript", "Node.js"],
    "preferred_roles": ["Frontend Developer"],
    "interests": ["AI/ML", "Healthcare"],
    "bio": "Fullstack builder...",
    "checked_in": false,
    "checked_in_at": null,
    "is_demo": true
  }
}
```

---

## 2. PUT `/api/users/profile`
* **Description**: Update authenticated participant's profile.
* **Authentication**: Required (`Bearer <token>`).
* **Security Policy**: Strictly ignores/prevents mutation of `id`, `email`, `role`, `password_hash`, `is_demo`, `checked_in`, `attendance_token_hash`.
* **Request Body**:
```json
{
  "name": "Alex Chen Updated",
  "bio": "Building AI retinal diagnostics.",
  "skills": ["React", "TypeScript", "PyTorch"],
  "preferred_roles": ["Fullstack Engineer"],
  "interests": ["AI/ML", "Healthcare", "Robotics"]
}
```
* **Success Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { ... }
}
```

---

## 3. GET `/api/users/qr`
* **Description**: Generate digital QR Attendance Pass.
* **Authentication**: Required (`role: 'participant'`).
* **Security Policy**: Produces high-entropy opaque QR payload. Token hashes and credentials are never exposed.
* **Success Response** (`200 OK`):
```json
{
  "success": true,
  "qrDataUrl": "data:image/png;base64,iVBORw0KGgo...",
  "attendee": {
    "id": "usr_alex_01",
    "name": "Alex Chen",
    "email": "alex@hackathon.dev",
    "role": "participant",
    "checked_in": false,
    "checked_in_at": null
  }
}
```

---

## 4. GET `/api/teams/recommendations`
* **Description**: Return deterministic compatibility recommendations for available unassigned participants.
* **Authentication**: Required (`role: 'participant'`).
* **Success Response** (`200 OK`):
```json
{
  "success": true,
  "count": 1,
  "recommendations": [
    {
      "id": "usr_david_04",
      "name": "David Kim",
      "skills": ["Solidity", "Rust", "Web3"],
      "preferred_roles": ["Blockchain Developer"],
      "interests": ["Web3", "FinTech", "Security"],
      "bio": "Decentralized systems engineer...",
      "matchScore": 75,
      "matchFactors": {
        "interestAlignment": 60,
        "skillComplementarity": 100,
        "roleDiversity": 100
      },
      "matchReasons": [
        "Shared interests in FinTech",
        "Brings complementary skills (Solidity, Rust, Web3)",
        "High role diversity (diverse functional coverage)"
      ]
    }
  ]
}
```

---

## 5. POST `/api/teams`
* **Description**: Create a new team and make the creator the initial team lead.
* **Authentication**: Required (`role: 'participant'`).
* **Request Body**:
```json
{
  "name": "Quantum Health AI",
  "track": "AI/Healthcare"
}
```
* **Success Response** (`201 Created`):
```json
{
  "success": true,
  "message": "Team created successfully",
  "team": {
    "id": "team_8f3a1c2d...",
    "name": "Quantum Health AI",
    "invite_code": "TEAM-E4A1B2",
    "lead_user_id": "usr_alex_01",
    "track": "AI/Healthcare"
  }
}
```

---

## 6. POST `/api/teams/join`
* **Description**: Join a team via invite code.
* **Authentication**: Required (`role: 'participant'`).
* **Request Body**:
```json
{
  "inviteCode": "TEAM-E4A1B2"
}
```
* **Success Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Successfully joined Quantum Health AI",
  "team": { ... }
}
```

---

## 7. POST `/api/teams/leave`
* **Description**: Leave current team. Promotes next member to lead if current lead leaves, or dissolves team if empty.
* **Authentication**: Required (`role: 'participant'`).
* **Success Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Successfully left the team"
}
```

---

## 8. GET `/api/teams/my-team`
* **Description**: Retrieve active team details, member roster, and project submission status.
* **Authentication**: Required (`role: 'participant'`).
* **Success Response** (`200 OK`):
```json
{
  "success": true,
  "inTeam": true,
  "team": { ... },
  "members": [ ... ],
  "isLead": true,
  "submission": null
}
```
