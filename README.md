# Personal_Podcast
Scalable full-stack podcast platform with episode management, search functionality, JWT authentication, and Azure Kubernetes deployment

## Tech Stack
- Backend: .NET Web API
- Frontend: React
- Database: SQL Server
- Containerization: Docker & Docker Compose
- Cloud Storage: Cloudinary
- Authentication: JWT

---

## Sprint 1 Summary (84% complete)

**Sprint Goal:** Deliver a working local MVP including authentication, episode browsing, search functionality, and containerized setup.

### Completed
- JWT Authentication (login & protected routes)
- Admin Dashboard 
- Episode Details page with Audio Player
- Search & Pagination (backend + frontend integration)
- Dockerfile for Backend & Frontend
- Docker Compose setup
- Environment variable configuration (.env)
- Cloudinary integration for audio storage

### Partially Completed
- Minor UI refinements
- Additional testing improvements
- Play count increment
- Small role-based authorization adjustments
- Category/Season filtering

Unfinished tasks were moved to Sprint 2.

---

## Current Status
The application runs locally using Docker Compose and supports:
- User authentication
- Episode browsing & playback
- Search & filtering
- Admin episode and user management (basic structure)

---

# Sprint 2 Summary (90% complete)

## Sprint Goal
Transform the MVP into a production-ready system with improved UI/UX, role-based access control (Admin, Publisher, User), DevOps integration, and deployment readiness on Azure Kubernetes with CI/CD.

---

## Completed

- UI polishing and layout improvements  
- Duplicate logic refactoring (major components cleaned)  
- Profile page implementation  
- Orders section  
- Publisher Dashboard  
- Role-based access control (Admin, Publisher, User)  
- Protected routes (frontend + backend authorization)  
- DevOps and hosting setup  
- Azure Kubernetes deployment  
- CI/CD pipeline configuration  
- Testing and documentation improvements  
- General code cleanup and structural improvements  
- User navigation and panel structure refactoring  

---

## Partially Completed

- Clean Code refactoring across all frontend files (majority completed)  


## Not Completed
- Category and Season filtering 

---

## Current Status

The application is now production-ready and deployed with:

- Kubernetes-based infrastructure  
- CI/CD automated deployment (GitHub Actions)  
- Role-based system (Admin / Publisher / User)  
- Publisher content management  
- Improved UI/UX consistency  
- Cleaned architecture structure  
- Secure authentication and protected routes  
- Scalable containerized setup  

Sprint 2 significantly improved system structure, maintainability, scalability, and overall production readiness.