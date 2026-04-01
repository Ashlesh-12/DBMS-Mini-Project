# Deployment Guide

This repo is set up for Render deployment with two services:

1. `aeras-backend` (Node/Express in `server/`)
2. `aeras-frontend` (Vite static app in `DBMS Project/`)

## Prerequisites

- A MySQL database reachable from Render
- DB schema/data loaded (use `server/sql/01_schema.sql` and `server/sql/02_seed.sql`)

## Render (Blueprint)

1. Push this repo to GitHub.
2. In Render, create a new Blueprint from repo root (`render.yaml`).
3. Set backend env vars:
   - `DB_HOST`
   - `DB_PORT` (usually `3306`)
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `DB_SSL` (`true` if your provider requires TLS, else `false`)
4. After backend deploys, copy backend URL and set frontend env var:
   - `VITE_API_URL=https://<your-backend-host>`
5. Redeploy frontend.

## Smoke tests

- Backend health: `GET /health` should return `{ "status": "ok", "db": "connected" }`
- Frontend should load rooms and student records on dashboard/manage tabs.

## Local env templates

- Backend template: `server/.env.example`
- Frontend local testing: `DBMS Project/.env.local`
