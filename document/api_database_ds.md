# API_AND_DATABASE_SPEC.md

# Brain Training Platform

## Database Design (MongoDB)

---

# Collection: users

```ts
{
  _id: ObjectId,

  name: string,
  email: string,
  passwordHash: string,

  role: "admin" | "user",

  status: "active" | "inactive",

  avatar?: string,

  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

```txt
email (unique)
role
status
```

---

# Collection: challenge_settings

```ts
{
  _id: ObjectId,

  date?: string,

  codeCount: number,

  codeLength: number,

  generateTime: string,

  isDefault: boolean,

  createdBy: ObjectId,

  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

```txt
date
isDefault
```

---

# Collection: challenges

```ts
{
  _id: ObjectId,

  date: string,

  codes: [
    {
      code: string,
      order: number
    }
  ],

  totalCodes: number,

  codeLength: number,

  generatedAt: Date,

  generatedBy: "system" | "admin",

  status: "active" | "locked",

  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

```txt
date (unique)
status
```

---

# Collection: user_submissions

```ts
{
  _id: ObjectId,

  userId: ObjectId,

  challengeId: ObjectId,

  date: string,

  answers: [
    {
      inputCode: string,

      matchedCode?: string,

      isCorrect: boolean,

      order: number,

      submittedAt: Date
    }
  ],

  totalSubmitted: number,

  totalCorrect: number,

  totalWrong: number,

  accuracy: number,

  startedAt: Date,

  completedAt?: Date,

  status: "in_progress" | "completed",

  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

```txt
userId + date (unique)
challengeId
status
date
```

---

# Collection: activity_logs

```ts
{
  _id: ObjectId,

  actorId?: ObjectId,

  actorRole?: "admin" | "user" | "system",

  action: string,

  targetType?: string,

  targetId?: ObjectId,

  metadata?: object,

  createdAt: Date
}
```

### Indexes

```txt
actorId
action
createdAt
```

---

# API Specification

Base URL

```txt
/api/v1
```

---

# AUTH

## Register

```http
POST /auth/register
```

Request

```json
{
  "name": "Nguyen Van A",
  "email": "user@gmail.com",
  "password": "123456"
}
```

---

## Login

```http
POST /auth/login
```

Request

```json
{
  "email": "admin@gmail.com",
  "password": "123456"
}
```

Response

```json
{
  "accessToken": "...",
  "user": {
    "id": "...",
    "name": "Admin",
    "role": "admin"
  }
}
```

---

## Get Profile

```http
GET /auth/me
```

---

## Logout

```http
POST /auth/logout
```

---

# USER APIs

## Get Today Challenge

```http
GET /user/challenges/today
```

Response

```json
{
  "date": "2026-06-08",
  "totalCodes": 20,
  "submitted": 12,
  "correct": 10,
  "wrong": 2,
  "status": "in_progress"
}
```

---

## Submit Code

```http
POST /user/challenges/today/submit
```

Request

```json
{
  "code": "AVBCOMMN"
}
```

Response

```json
{
  "isCorrect": true,
  "submitted": 13,
  "correct": 11,
  "wrong": 2,
  "completed": false
}
```

---

## Get Today Result

```http
GET /user/challenges/today/result
```

---

## Get My History

```http
GET /user/submissions
```

Query

```txt
?page=1
&limit=10
&status=completed
```

---

## Get Submission Detail

```http
GET /user/submissions/:date
```

Example

```http
GET /user/submissions/2026-06-08
```

---

## Get My Statistics

```http
GET /user/statistics
```

Response

```json
{
  "totalChallenges": 14,
  "completedChallenges": 12,
  "totalCorrect": 180,
  "totalWrong": 20,
  "accuracy": 90,
  "streak": 7
}
```

---

# ADMIN DASHBOARD

## Overview

```http
GET /admin/dashboard/overview
```

Response

```json
{
  "totalUsers": 1248,
  "completedToday": 856,
  "completionRateToday": 68.6,
  "accuracyRateToday": 89.45,
  "todayCodes": 20
}
```

---

## Dashboard Charts

```http
GET /admin/dashboard/charts
```

Query

```txt
?range=7d
```

---

## Recent Activities

```http
GET /admin/activities
```

---

# USER MANAGEMENT

## Get Users

```http
GET /admin/users
```

Query

```txt
?page=1
&limit=20
&keyword=
&status=
```

---

## Create User

```http
POST /admin/users
```

---

## Get User Detail

```http
GET /admin/users/:userId
```

---

## Update User

```http
PATCH /admin/users/:userId
```

---

## Disable User

```http
PATCH /admin/users/:userId/disable
```

---

## Enable User

```http
PATCH /admin/users/:userId/enable
```

---

## User Submission History

```http
GET /admin/users/:userId/submissions
```

---

## User Submission Detail

```http
GET /admin/users/:userId/submissions/:date
```

---

# CHALLENGE MANAGEMENT

## Challenge List

```http
GET /admin/challenges
```

---

## Challenge Detail

```http
GET /admin/challenges/:challengeId
```

---

## Get Challenge By Date

```http
GET /admin/challenges/date/:date
```

---

## Generate Challenge

```http
POST /admin/challenges/generate
```

Request

```json
{
  "date": "2026-06-09",
  "codeCount": 20,
  "codeLength": 8
}
```

---

## Regenerate Challenge

```http
POST /admin/challenges/:challengeId/regenerate
```

---

## Lock Challenge

```http
PATCH /admin/challenges/:challengeId/lock
```

---

## Unlock Challenge

```http
PATCH /admin/challenges/:challengeId/unlock
```

---

## Challenge Submissions

```http
GET /admin/challenges/:challengeId/submissions
```

---

# CODE MANAGEMENT

## Get Challenge Codes

```http
GET /admin/challenges/:challengeId/codes
```

Response

```json
{
  "date": "2026-06-08",
  "codes": [
    {
      "order": 1,
      "code": "AVBCOMMN",
      "usedCount": 642,
      "correctCount": 580,
      "wrongCount": 62
    }
  ]
}
```

---

## Export Codes

```http
GET /admin/challenges/:challengeId/codes/export
```

---

# SETTINGS

## Get Default Setting

```http
GET /admin/settings/challenge/default
```

---

## Update Default Setting

```http
PATCH /admin/settings/challenge/default
```

Request

```json
{
  "codeCount": 20,
  "codeLength": 8,
  "generateTime": "03:00"
}
```

---

## Get Daily Settings

```http
GET /admin/settings/challenge/daily
```

---

## Create Daily Setting

```http
POST /admin/settings/challenge/daily
```

Request

```json
{
  "date": "2026-06-09",
  "codeCount": 15,
  "codeLength": 8,
  "generateTime": "03:00"
}
```

---

## Update Daily Setting

```http
PATCH /admin/settings/challenge/daily/:settingId
```

---

## Delete Daily Setting

```http
DELETE /admin/settings/challenge/daily/:settingId
```

---

# NestJS Modules

```txt
AuthModule
UsersModule
ChallengesModule
SubmissionsModule
SettingsModule
DashboardModule
ActivitiesModule
StatisticsModule
CommonModule
```

---

# Security Rules

## Important

User APIs MUST NOT return challenge codes.

Wrong:

```json
{
  "codes": [
    "AVBCOMMN",
    "KZPQRTAA"
  ]
}
```

Correct:

```json
{
  "totalCodes": 20,
  "submitted": 12,
  "correct": 10,
  "wrong": 2
}
```

Reason:

```txt
Prevent user cheating through DevTools / Network inspection.
```
