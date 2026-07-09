---
title: AERAS Examination Control System
emoji: 🏫
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# AERAS - Sahyadri College Examination Control System

AERAS is a modern, web-based examination seating and room allocation control system designed for college administrators and students. 

## Features

- **Automated Seating Allocation**: Distributes students from different semesters vertically/sequentially in examination rooms to prevent malpractices.
- **Faculty Duty Assignment**: Shuffles and assigns faculty members to examination rooms dynamically.
- **Interactive Seating Grid**: Visualizes seating plans showing filled and empty benches in real-time.
- **Student Lookup Portal**: Quick-search interface for students to check their allocated room, seat location, and side (left/center/right).
- **Automated Reports**: Generates occupancy statistics (capacity, occupied seats, and status) powered by MySQL cursors.

## Deployment Stack

- **Frontend**: React (Vite, Tailwind CSS, Axios)
- **Backend**: Node.js (Express, mysql2 pool connection)
- **Database**: MariaDB (packaged locally in Docker, runs rootless)
- **Deployment Platform**: Hugging Face Spaces (Docker SDK)

## Local Development Setup

To run this project locally:

1. **Start Local MySQL Server**:
   Ensure you have a local MySQL/MariaDB database server running. Create a database named `aeras_db` and apply scripts in `server/sql/`:
   ```bash
   mysql -u root -p aeras_db < server/sql/01_schema.sql
   mysql -u root -p aeras_db < server/sql/02_seed.sql
   ```

2. **Configure Environment Variables**:
   - Backend: Create `server/.env` with your DB credentials (see `server/.env.example`).
   - Frontend: Create `DBMS Project/.env.local` containing:
     ```env
     VITE_API_URL=http://localhost:3001
     ```

3. **Install & Run Backend**:
   ```bash
   cd server
   npm install
   npm run dev  # or node index.js
   ```

4. **Install & Run Frontend**:
   ```bash
   cd "DBMS Project"
   npm install
   npm run dev
   ```
