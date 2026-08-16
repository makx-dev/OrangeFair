# The Orange Fare

The Orange Fare is a MERN-stack scaffold for a Nagpur auto-rickshaw fare fairness and driver trust platform.

## Tech Stack

- **Frontend:** React (Vite), React Router, Axios, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **Auth:** JWT + bcrypt password hashing

## Repository Structure

```text
/client   # React app
/server   # Express + MongoDB API
```

## Backend API (Scaffold)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/plates/:plateNumber`
- `POST /api/rides`
- `POST /api/rides/split`
- `POST /api/reports`
- `GET /api/reports/:id/status`
- `POST /api/comments`
- `GET /api/routewatch`

## Local Setup

### 1) Server

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Set values in `.env`:
- `MONGODB_URI`
- `JWT_SECRET`
- `PORT`

### 2) Client

```bash
cd client
npm install
npm run dev
```

Client defaults to `http://localhost:5000/api` for backend requests.
