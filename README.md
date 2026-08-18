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

## Running the Project After Downloading from GitHub

Git does not track `.env` files (for security) or `node_modules` (due to size). Follow these steps to run the project after cloning or downloading the ZIP:

### 1. Recreate your `.env` Files
Since Git ignores `.env` files, you must create them manually. 

**Backend (`server/.env`)**:
Create a file named `.env` inside the `server/` directory and paste this:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Ashlesh@12
DB_NAME=aeras_db
DB_SSL=false
```

**Frontend (`DBMS Project/.env`)**:
Create a file named `.env` inside the `DBMS Project/` directory and paste this:
```env
# VITE_API_URL=https://dbms-mini-project-1.onrender.com
```

### 2. Install Dependencies
You need to install the Node packages for both the server and frontend.

```bash
# Open a terminal in the server folder
cd server
npm install

# Open another terminal in the frontend folder
cd "DBMS Project"
npm install
```

### 3. Ensure Database is Running
Make sure your local MariaDB / MySQL server is running. The database `aeras_db` data is stored on your local PC, so it will still be there. 
*(If setting up on a new PC, you will need to import the SQL dump to recreate the database).*

### 4. Start the Project
**Start Backend:**
```bash
cd server
node index.js
```

**Start Frontend:**
```bash
cd "DBMS Project"
npm run dev
```
