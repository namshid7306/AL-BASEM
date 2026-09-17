# AL BASEM

**Public Health Pest Control & Cleaning Management System**  
Operating in Dubai, United Arab Emirates.

---

## 1. Overview

**AL BASEM** is a full-stack, enterprise-grade operations and accounting management system purpose-built for pest control and cleaning service providers in the UAE. It integrates customer management, service scheduling, contract life cycles with automatic recurring visits, quotation conversions, tax invoices with authoritative 5% UAE VAT calculations, payment receipts, expense logging, and background notification automations.

---

## 2. Features

* **Customer Management**: Centralized customer records (Commercial & Residential), address book, transaction histories, and real-time financial balances.
* **Services & Scheduling**: Single-visit and on-demand pest control booking with direct rate calculation, technician notes, and auto-generated tax invoices.
* **Contracts & Recurring Visits**: Annual and multi-period service contracts with automatic visit date calculation, automated renewal tracking, and version history.
* **Quotation Lifecycle**: Draft, send, accept, and one-click convert quotations to official Tax Invoices.
* **Tax Invoices & UAE VAT**: Authoritative 5% UAE Federal Tax Authority (FTA) compliant tax invoices calculated with Decimal.js arbitrary-precision arithmetic.
* **Payment Tracking**: Multi-method payment collection (Cash, Card, Bank Transfer, Cheque) with double-payment idempotency protection.
* **Expense Management**: Categorized operational expenses with strict recoverable vs. non-recoverable VAT accounting.
* **Financial Reports & P&L**: Automated Profit & Loss statements, revenue breakdowns, and UAE VAT returns.
* **Interactive Calendar**: Full month, week, and day calendar views for scheduled pest control operations.
* **Automated Background Jobs**: 5 cron tasks scheduled in `Asia/Dubai` timezone for appointment reminders, contract expirations, payment due alerts, invoice overdue transitions, and nightly customer balance reconciliation.
* **Global Search**: Multi-entity instant search across customers, services, invoices, quotations, and expenses.

---

## 3. Technology Stack

### Backend
* **Runtime**: Node.js (`>= 18.0.0`)
* **Framework**: Express.js (ES Modules)
* **Database**: MongoDB & Mongoose ODM
* **Authentication**: Short-lived JWT access tokens + HttpOnly refresh token rotation (SHA-256 hashed with family replay attack detection)
* **Financial Engine**: Decimal.js arbitrary-precision mathematical operations
* **Validation**: Zod schema validation
* **Automation**: Node-cron (`Asia/Dubai` timezone UTC+4)
* **Security**: Helmet, CORS, Express Mongo Sanitize, Rate Limiting, file-type magic-number validation

### Frontend
* **Framework**: React 19, Vite, React Router v7
* **Styling**: Tailwind CSS v4, Lucide React, React Icons
* **Data Management**: TanStack React Query v5, Axios with automatic token refresh queueing
* **Forms & Validation**: React Hook Form, Zod

---

## 4. Project Structure

```text
AL BASEM/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment validation (Zod), MongoDB connection, constants
│   │   ├── controllers/     # API request handlers
│   │   ├── jobs/            # Node-cron background schedulers (Dubai timezone UTC+4)
│   │   ├── middleware/      # Auth (JWT), validation (Zod), idempotency, uploads, rate limiter
│   │   ├── models/          # Mongoose database models
│   │   ├── routes/          # Express API route definitions
│   │   ├── services/        # Business & financial logic layer
│   │   ├── utils/           # Decimal.js money engine, sequence generators, timezone utilities
│   │   ├── validators/      # Zod request schemas
│   │   ├── app.js           # Express application setup & security middleware
│   │   └── server.js        # Server bootstrap & database initialization
│   ├── tests/               # Test suites (unit, integration, concurrency, notifications)
│   ├── uploads/             # Local file upload directory
│   ├── .env.example         # Backend environment template
│   ├── package.json         # Backend dependencies & test scripts
│   └── package-lock.json
│
├── frontend/
│   ├── public/              # Static branding assets and logos
│   ├── src/
│   │   ├── assets/          # Application image assets
│   │   ├── components/      # Common and layout UI components
│   │   ├── constants/       # System constants, service types, property types
│   │   ├── context/         # AuthContext and ToastContext providers
│   │   ├── features/        # Feature modules (auth, customers, services, contracts, invoices, etc.)
│   │   ├── routes/          # Application routing configuration
│   │   ├── services/        # Axios API clients
│   │   ├── utils/           # Formatting and VAT calculation helpers
│   │   ├── App.jsx          # Root React component
│   │   └── main.jsx         # Application entry point
│   ├── .env.example         # Frontend environment template
│   ├── .oxlintrc.json       # Oxlint linter configuration
│   ├── index.html           # HTML template
│   ├── package.json         # Frontend dependencies & scripts
│   ├── package-lock.json
│   └── vite.config.js       # Vite configuration
│
├── .gitignore               # Unified root Git ignore
└── README.md                # Project documentation
```

---

## 5. Environment Configuration

### Backend Setup (`backend/.env`)
Create a `.env` file in the `backend/` directory by copying `backend/.env.example`:

```bash
cd backend
cp .env.example .env
```

Configure the environment variables in `backend/.env`:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Backend HTTP server port | `5000` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |
| `MONGO_URL` | MongoDB connection URI | `mongodb://127.0.0.1:27017/al_basem_db` |
| `JWT_SECRET` | Secret key for signing access tokens (min 16 chars) | *Your secure secret* |
| `JWT_EXPIRES_IN` | Access token lifespan | `15m` |
| `REFRESH_TOKEN_SECRET` | Secret key for refresh tokens (min 16 chars) | *Your secure secret* |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token lifespan | `7d` |
| `CORS_ORIGIN` | Allowed CORS frontend origins | `http://localhost:5173` |
| `UPLOAD_DIR` | Local storage folder for uploads | `uploads` |
| `TIMEZONE` | System operational timezone | `Asia/Dubai` |
| `CONTRACT_REMINDER_DAYS` | Days before contract expiry to trigger alert | `30` |
| `CONTRACT_FINAL_REMINDER_DAYS` | Days before contract expiry for final alert | `7` |
| `SERVICE_REMINDER_HOURS` | Hours before service appointment for reminder | `24` |
| `PAYMENT_REMINDER_DAYS` | Days before invoice due date for payment reminder | `3` |
| `ADMIN_EMAIL` | Default administrator login email | *Your admin email* |
| `ADMIN_PASSWORD` | Default administrator login password | *Your secure password* |

> [!CAUTION]
> Never commit `.env` files containing real production credentials to Git or GitHub.

### Frontend Setup (`frontend/.env`)
Create a `.env` file in the `frontend/` directory by copying `frontend/.env.example`:

```bash
cd frontend
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Backend REST API base URL | `http://localhost:5000/api` |

---

## 6. Running the Project

### 1. Install Dependencies
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 2. Start Development Servers
```bash
# In terminal 1 (Backend):
cd backend
npm run dev

# In terminal 2 (Frontend):
cd frontend
npm run dev
```

* **Frontend Client**: `http://localhost:5173`
* **Backend API**: `http://localhost:5000/api`
* **API Health Check**: `http://localhost:5000/health`

---

## 7. Testing & Production Build

### Running Backend Tests
The backend contains a comprehensive automated test suite utilizing in-memory MongoDB replica sets:

```bash
cd backend
npm test
```

Test coverage includes:
* **Authentication & Refresh Tokens**: Login, cookie setting, token rotation, replay attack revocation, single-admin sync.
* **E2E Workflows**: Full lifecycle flows (Customer $\rightarrow$ Service $\rightarrow$ Invoice $\rightarrow$ Payment $\rightarrow$ Dashboard).
* **Financial Calculations**: Decimal.js arithmetic, 5% UAE VAT, payment overpayment guards, idempotency keys.
* **Background Jobs**: Service 24h reminders, contract expiry alerts, payment due alerts, invoice overdue status transitions.
* **Upload Security**: MIME type verification, magic-number inspection.

### Running Frontend Production Build
```bash
cd frontend
npm run build
```

Production assets are bundled into `frontend/dist/`.

---

## 8. API Endpoints

### Authentication
* `POST /api/auth/login` — Authenticate admin, issue access token & HttpOnly refresh cookie
* `POST /api/auth/refresh` — Rotate refresh token & issue new access token
* `POST /api/auth/logout` — Revoke refresh token & clear cookie
* `GET /api/auth/me` — Current user profile
* `POST /api/auth/forgot-password` — Password reset request

### Customers
* `GET /api/customers` — List customers with search & filter
* `GET /api/customers/:id` — Customer profile with transaction history
* `POST /api/customers` — Create customer
* `PUT /api/customers/:id` — Update customer
* `DELETE /api/customers/:id` — Soft delete customer (Admin only)

### Services
* `GET /api/services` — List scheduled services
* `GET /api/services/:id` — Service details
* `POST /api/services` — Book new service (supports auto-invoice & payment)
* `PUT /api/services/:id` — Update service
* `DELETE /api/services/:id` — Soft delete service (Admin only)

### Contracts
* `GET /api/contracts` — List contracts
* `GET /api/contracts/:id` — Contract details and visit schedule
* `POST /api/contracts` — Create contract and generate scheduled visits
* `POST /api/contracts/:id/renew` — Renew contract with version tracking
* `PATCH /api/contracts/:id/status` — Update contract status

### Invoices & Payments
* `GET /api/invoices` — List tax invoices
* `GET /api/invoices/:id` — Tax invoice details with payment receipts
* `POST /api/invoices` — Create tax invoice
* `GET /api/payments` — List payments
* `POST /api/payments` — Record payment receipt (requires `Idempotency-Key`)

### Quotations
* `GET /api/quotations` — List quotations
* `GET /api/quotations/:id` — Quotation details
* `POST /api/quotations` — Create quotation
* `POST /api/quotations/:id/convert-to-invoice` — Convert quotation to Tax Invoice

### Expenses & Reports
* `GET /api/expenses` — List operational expenses
* `POST /api/expenses` — Log expense (with UAE FTA VAT classification)
* `DELETE /api/expenses/:id` — Delete expense (Admin only)
* `GET /api/reports` — Profit & Loss statement and UAE VAT returns
* `GET /api/dashboard` — Financial overview and KPI summary

### Notifications & Search
* `GET /api/notifications` — Notification list
* `PATCH /api/notifications/:id/read` — Mark notification as read
* `GET /api/search` — Global search across all entities
* `POST /api/upload` — Secure document/receipt upload

---

## 9. Background Jobs (Asia/Dubai Timezone)

Automated cron jobs run in the `Asia/Dubai` timezone (UTC+4):

1. **Hourly Service Reminder** (`0 * * * *`): Scans appointments in the next 24 hours and creates notification alerts.
2. **Daily Contract Expiry Scan** (`0 8 * * *`): Dispatches 30-day and 7-day contract expiry notifications.
3. **Daily Payment Due Scan** (`15 8 * * *`): Scans approaching invoice due dates (3-day reminder and due-today reminder).
4. **Daily Invoice Overdue Scan** (`30 8 * * *`): Transitions unpaid invoices past due date to `OVERDUE` and dispatches alerts.
5. **Nightly Financial Reconciliation** (`0 3 * * *`): Reconciles cached customer totals (revenue, paid totals, balance) against authoritative invoices and payments.

---

## 10. Security Highlights

* **Zero Hardcoded Secrets**: All sensitive keys, passwords, and connection strings are managed strictly via environment variables.
* **JWT & Refresh Token Architecture**: Short-lived access tokens with SHA-256 hashed refresh tokens stored in MongoDB, featuring family-based replay attack mitigation.
* **Single-Admin Credential Synchronization**: Environment-driven administrator credentials sync automatically at startup with bcrypt password hashing.
* **CORS & Security Headers**: Helmet middleware, strict CORS origin checks, and MongoSanitize query injection prevention.
* **Payment Double-Submission Guard**: Idempotency keys enforced on payment endpoints to prevent double-charging.

---

## 11. License

Proprietary software developed for **AL BASEM PUBLIC HEALTH PESTS CONTROL SERVICES L.L.C** (Dubai, UAE). All rights reserved.
