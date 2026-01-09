# School Management API – Full Project Documentation

**Date:** January 09, 2026  
**Author:** Rodgers Okwemba  
**Repository:** https://github.com/rodgerstar/School-Management-App--With-Apache-Spark-For-Data-Visualization

## Overview

This is a multi-tenant Node.js/Express backend API for a school management system.  
It supports multiple schools (tenants), optional branches (campuses), classes (forms & streams), students, teachers, configurable roles & permissions (RBAC), performance (marks & ranking), and fees.

Key design principles:
- **No hard-coded roles** – all roles and permissions are created dynamically by the superadmin
- **Light collections** – denormalized fields (e.g., student name in fee records) for fast queries
- **Layered security** – X-API-Key (gateway) + JWT (user session)
- **Superadmin bypass** – first user per tenant has full access via `isSuperAdmin: true`

## Current Features (January 09, 2026)

- Tenant registration (minimal – organization name only)
- Superadmin creation with `isSuperAdmin: true`
- Branches (optional – HQ if none)
- Configurable roles with page-level permissions
- Users (superadmin, admin, teacher, parent, student, bursar, dean)
- Classes (form level, stream, year, teacher)
- Students (auto-user account, parent link, class assignment)
- Performance (add marks per subject, class ranking with average & rank)
- Fees (add fees per student/term, denormalized student name, auto-balance calculation)

## Technology Stack

- Node.js v24.9.0
- Express.js
- MongoDB (Mongoose ODM)
- bcryptjs (password hashing)
- jsonwebtoken (JWT)
- uuid (ID generation)
- dotenv (environment variables)

## Project Structure
src/
├── config/
│   └── db.js
├── middleware/
│   ├── auth.js          # X-API-Key gateway
│   ├── jwtAuth.js       # JWT verification
│   └── permissionCheck.js # RBAC middleware
├── models/
│   ├── branch.js
│   ├── class.js
│   ├── fee.js
│   ├── performance.js
│   ├── role.js
│   ├── student.js
│   ├── tenant.js
│   └── user.js
├── routes/
│   ├── auth/
│   │   ├── registerTenantRoutes.js
│   │   ├── loginroutes.js
│   │   └── usermanagementroutes.js
│   ├── branches/
│   ├── classes/
│   ├── fees/
│   ├── performance/
│   ├── roles/
│   └── students/
├── utils/
│   └── errorhandler.js
└── index.js


## Setup & Running

1. Clone the repo
2. `npm install`
3. Create `.env` :

 PORT=5000
   MONGO_URI=mongodb://localhost:27017/schoolDB
   JWT_SECRET=your_very_long_random_secret
   API_KEY=your_gateway_secret_key

4. `npm run dev`

## Authentication Flow

1. **Register Tenant** – public endpoint  
`POST /api/v1/auth/register-tenant`  
→ creates tenant + superadmin (`isSuperAdmin: true`)

2. **Login** – X-API-Key only  
`POST /api/v1/auth/login`  
→ returns JWT with `isSuperAdmin`, `roleId`, `tenantId`, `branchId`

3. **All other endpoints** – X-API-Key + `Authorization: Bearer <token>`

## Models Summary

| Model       | Key Fields                                                                 | Notes |
|-------------|----------------------------------------------------------------------------|-------|
| Tenant      | tenantId, organizationName                                                 | Minimal |
| Branch      | branchId, tenantId, name, location                                         | Optional |
| User        | userId, tenantId, branchId, name, email, password, isSuperAdmin, roleId    | Auth |
| Role        | tenantId, roleName, permissions[] (page + canView/canCreate/etc.)          | RBAC |
| Class       | classId, tenantId, branchId, name, formLevel, stream, year, teacherId      | Forms/streams |
| Student     | studentId, userId, tenantId, branchId, classId, name, parentId, etc.       | Linked to user |
| Performance | studentId, classId, term, year, subject, score, grade                       | Ranking |
| Fee         | feeId, studentId, studentName (denorm), tenantId, term, year, amount, paid | Fast queries |

## API Endpoints

### Public
- `POST /api/v1/auth/register-tenant`

### Auth (X-API-Key only for login)
- `POST /api/v1/auth/login`

### Protected (X-API-Key + JWT)

| Method | Endpoint                        | Permission Required          | Description |
|--------|---------------------------------|------------------------------|-------------|
| POST   | /api/v1/roles                   | superadmin                   | Create role |
| GET    | /api/v1/roles                   | any                          | List roles |
| PUT    | /api/v1/roles/:id               | superadmin                   | Update permissions |
| POST   | /api/v1/branches                | superadmin                   | Create branch |
| GET    | /api/v1/branches                | any                          | List branches |
| POST   | /api/v1/classes                 | classes.canCreate            | Create class |
| GET    | /api/v1/classes                 | classes.canView              | List classes |
| GET    | /api/v1/classes/:id             | classes.canView              | Get class |
| PUT    | /api/v1/classes/:id             | classes.canUpdate            | Update class |
| DELETE | /api/v1/classes/:id             | classes.canDelete            | Delete class |
| POST   | /api/v1/students                | students.canCreate           | Add student (auto-user) |
| GET    | /api/v1/students                | students.canView             | List (filtered by role) |
| GET    | /api/v1/students/:id            | students.canView             | Get one |
| PUT    | /api/v1/students/:id            | students.canUpdate           | Update |
| DELETE | /api/v1/students/:id            | students.canDelete           | Delete |
| POST   | /api/v1/performance             | performance.canAdd           | Add marks |
| GET    | /api/v1/performance/ranking/:classId?term=...&year=... | performance.canView | Class ranking |
| POST   | /api/v1/fees                    | fees.canAdd                  | Add fee |
| GET    | /api/v1/fees                    | fees.canView                 | List fees (parent sees own) |
| PUT    | /api/v1/fees/:id                | fees.canUpdate               | Record payment |

## How to Feed Data (Example Flow)

1. Register tenant → superadmin created
2. Login as superadmin → get token
3. Create branch (optional)
4. Create roles (Teacher, Parent, Bursar, Dean of Studies, Student)
5. Create users (assign roleId)
6. Create classes (Form 1 Blue, etc.)
7. Teachers add students (auto-user account)
8. Dean adds performance marks
9. Bursar adds fees
10. Parents/students view ranking & fees

## Git & Documentation

- Repository is **public** 
- `.gitignore` excludes `node_modules` and `.env`
- `README.md` in root (basic project info)
- `PROJECT_DOCUMENTATION.md` – full API docs, updated daily
- Commit regularly:
  ```bash
  git add .
  git commit -m "Add performance module and ranking"
  git push