# MediSense Updated Backend

Node.js + Express + Mongoose backend for the updated MediSense frontend (Next.js). Provides authentication, patient onboarding, doctor assignment, AI report placeholder logic, and notification scaffolding.

## Features

- JWT Authentication (Admin / Doctor / Facilitator roles)
- Patient CRUD & queue (status + priority)
- Doctor assignment & case status updates
- Regenerate AI report (placeholder endpoint)
- Notifications scaffold (in-memory / Mongo-ready)
- Validation with Joi
- Centralized error handling & logging (pino + morgan)
- Environment-based configuration

## Project Structure

```
updated-backend/
  src/
    config/
      env.js            # Loads and validates environment variables
      db.js             # Mongoose connection
    models/
      User.js
      Patient.js
      Notification.js
    middleware/
      auth.js           # JWT verification & role guard
      error.js          # Not found + error handler
      validate.js       # Request body/schema validator
    utils/
      logger.js
      asyncHandler.js
      ApiError.js
      ApiResponse.js
    controllers/
      authController.js
      patientController.js
      doctorController.js
      notificationController.js
    routes/
      authRoutes.js
      patientRoutes.js
      doctorRoutes.js
      notificationRoutes.js
      index.js          # Base router
    server.js           # Express app bootstrap
    app.js              # App factory (for tests)
  .env.example
  package.json
```

## Environment Variables

See `.env.example` for all variables.

## Quick Start

```bash
# Install deps
npm install

# Copy env
cp .env.example .env

# Run dev
npm run dev
```

Server runs at http://localhost:5000 by default.

## API Overview (Brief)

- POST /api/auth/register (admin only initial manual seed, or use seed script)
- POST /api/auth/login
- GET /api/patients
- POST /api/patients
- GET /api/patients/:id
- PATCH /api/patients/:id (update details / status)
- POST /api/patients/:id/assign-doctor
- POST /api/patients/:id/regenerate-report
- GET /api/doctors (list doctors)
- GET /api/notifications

## Roles

- admin: full access
- doctor: can view assigned patients, update status & add responses
- facilitator: can create patients, view queue, reassign

## Placeholder AI

`/api/patients/:id/regenerate-report` simply re-generates a mock summary based on current patient data.

## Testing

A minimal Node test harness can be added (supertest, etc.) — scaffold left minimal for now.

## Next Steps / Enhancements

- Add pagination & filtering in patient list
- Persist notifications & add websocket (Socket.IO)
- Audit logging
- Rate limiting & security headers tuning
- File uploads to object storage (S3 / GCS)

---

MIT License
