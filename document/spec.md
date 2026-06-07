# Brain Training Platform

## Overview

Brain Training Platform là hệ thống luyện tập nhập mã hằng ngày.

Mỗi ngày hệ thống tự động sinh danh sách mã ngẫu nhiên. Người dùng đăng nhập và nhập mã theo danh sách của ngày hiện tại. Hệ thống kiểm tra đúng/sai, lưu lịch sử và thống kê kết quả.

---

# Roles

## Admin

### Chức năng

* Quản lý User
* Quản lý Challenge
* Quản lý mã theo ngày
* Quản lý cấu hình sinh mã
* Xem thống kê
* Xem lịch sử nhập mã của User
* Export mã theo ngày
* Export result 

---

## User

### Chức năng

* Đăng nhập
* Nhập mã hằng ngày
* Xem kết quả ngày hiện tại
* Xem lịch sử toàn bộ mã đã nhập
* Xem thống kê cá nhân

---

# Daily Challenge

## Generate Code

Hệ thống tự động tạo mã lúc:

```txt
03:00 AM
```

Cron Job:

```txt
0 3 * * *
```

Ví dụ:

```txt
AVBCOMMN
KZPQRTAA
PLMNKJHG
XCVBNMAS
```

---

## Rule

Mỗi ngày chỉ có:

```txt
1 Challenge
```

Mỗi Challenge gồm:

```txt
N codes
```

Trong đó:

```txt
N = Admin Setting
```

Ví dụ:

```txt
08/06/2026 = 20 codes
09/06/2026 = 15 codes
10/06/2026 = 25 codes
```

---

# User Flow

## Challenge Today

Hiển thị:

* Ngày hiện tại
* Tổng số mã
* Đã nhập
* Đúng
* Sai
* Thời gian bắt đầu

---

## Submit Code

User nhập:

```txt
AVBCOMMN
```

API kiểm tra:

### Correct

```txt
Correct
```

### Wrong

```txt
Wrong
```

---

## Completion

Khi User nhập đủ số lượng mã:

```txt
Completed
```

Toast:

```txt
Đã nhập xong
```

Lưu ý:

* Dù có mã sai vẫn được tính Completed
* Hệ thống vẫn lưu thống kê đúng/sai

---

# User History

User xem lịch sử toàn bộ Challenge.

Ví dụ:

| Date       | Correct | Wrong | Accuracy |
| ---------- | ------- | ----- | -------- |
| 08/06/2026 | 18      | 2     | 90%      |
| 07/06/2026 | 20      | 0     | 100%     |

---

# Admin Dashboard

## KPI

* Total Users
* Active Users
* Completion Rate
* Accuracy Rate
* Today's Challenge
* Top Users

---

# User Management

## List User

Thông tin:

* Name
* Email
* Status
* Join Date

---

## User Detail

Thông tin:

* Profile
* Challenge History
* Accuracy
* Completion Rate

---

# Challenge Management

## Challenge List

Thông tin:

* Date
* Total Codes
* Generated At
* Status

Action:

* View
* Regenerate
* Lock

---

## Challenge Detail

Thông tin:

* Date
* Total Codes
* Code Length
* Generated Time
* User Completed
* Accuracy

Danh sách mã:

```txt
AVBCOMMN
KZPQRTAA
PLMNKJHG
```

---

# Code Settings

## Default Setting

```txt
Code Count: 20
Code Length: 8
Generate Time: 03:00
```

---

## Daily Override

Ví dụ:

```txt
Date: 09/06/2026
Code Count: 15
Code Length: 8
```

---

# Statistics

## User Statistics

* Total Challenge
* Completed Challenge
* Accuracy
* Streak

---

## System Statistics

* Daily Completion
* Daily Accuracy
* Top Ranking
* Active Users

---

# Database Collections

## users

```js
{
  name,
  email,
  password,
  role,
  status,
  createdAt
}
```

---

## challenges

```js
{
  date,
  codes,
  totalCodes,
  codeLength,
  generatedAt,
  status
}
```

---

## challenge_settings

```js
{
  date,
  codeCount,
  codeLength,
  generateTime,
  isDefault
}
```

---

## user_submissions

```js
{
  userId,
  challengeId,
  answers,
  totalCorrect,
  totalWrong,
  totalSubmitted,
  status,
  completedAt
}
```

---

## activity_logs

```js
{
  action,
  actorId,
  payload,
  createdAt
}
```

---

# Frontend Architecture

## Admin

```txt
src/
├── layouts
├── pages
├── components
├── stores
├── services
├── router
├── types
└── utils
```

---

## User

```txt
src/
├── layouts
├── pages
├── components
├── stores
├── services
├── router
├── types
└── utils
```

---

# Deployment

## Domains

```txt
admin.domain.com
app.domain.com
api.domain.com
```

## Services

```txt
Admin -> Vercel
User -> Vercel
API -> Railway
MongoDB -> Atlas
```

---

# Future Features

* Leaderboard
* Achievement
* Badge
* Streak
* Export Excel
* Notification
* Email Reminder
* PWA
* Mobile App
