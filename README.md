# Medical Camp Registration Portal

> **Sysslan IT Solutions — Full-Stack Software Development Task (Levels 1–5)**  
> Built with **Node.js**, **Express.js**, **MongoDB**, **Mongoose**, **EJS**, and **Bootstrap 5**.

---

## 🏥 Project Overview

The **Medical Camp Registration Portal** is a production-ready, responsive healthcare web application designed to connect community members with free medical screening clinics and doctor consultations. The platform provides:

1. **A public patient portal** to discover medical camps, filter by medical specialty, review available diagnostic services, and register for instant, printable passes.
2. **An administrative control panel** for healthcare organizers and hospital administrators to manage camp listings, monitor capacity utilization, and process participant admissions and cancellations safely.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+), Bootstrap 5.3, Bootstrap Icons, EJS Templates (`ejs-mate`) |
| **Backend** | Node.js (v18+), Express.js 4.x |
| **Database** | MongoDB 7.x, Mongoose 8.x ODM |
| **Authentication & Sessions** | `express-session`, `connect-mongo` (MongoDB-backed store), `bcryptjs` (password hashing) |
| **Validation & Security** | `express-validator` (server-side), client-side constraint validation, `method-override` |
| **Feedback & Logging** | `connect-flash` (session flash alerts), `morgan` (HTTP request logging) |
| **Automated Testing** | `jest`, `supertest` (23 integration tests) |

---

## 📂 Project Architecture

```
medical-camp-registration-portal/
├── app.js                          # Main Express application & middleware pipeline
├── package.json                    # Project dependencies & scripts
├── .env.example                    # Environment variable template
├── .env                            # Local configuration (excluded from git)
├── .gitignore                      # Git ignore file
├── README.md                       # Comprehensive project documentation
│
├── config/
│   └── database.js                 # MongoDB connection & Mongoose initialization
│
├── models/
│   ├── Camp.js                     # Camp schema, virtuals, and compound indexes
│   ├── Registration.js             # Registration schema, unique reference generator
│   └── Admin.js                    # Admin user schema with bcrypt hashing
│
├── controllers/
│   ├── campController.js           # Public camp listing, search, details, and informational pages
│   ├── registrationController.js   # Registration submission, validation, race-condition safety, pass display
│   └── adminController.js          # Authentication, dashboard KPIs, camp CRUD, registration management
│
├── routes/
│   ├── campRoutes.js               # Public routes: /, /camps, /about, /contact
│   ├── registrationRoutes.js       # Registration routes: /register, /registrations/*
│   └── adminRoutes.js              # Admin routes: /admin/login, /admin/dashboard, /admin/camps, etc.
│
├── middleware/
│   ├── authentication.js           # Session auth guards: ensureAuthenticated, forwardAuthenticated
│   └── errorHandler.js             # 404 handler and global centralized error middleware
│
├── validators/
│   ├── campValidator.js            # express-validator rules for medical camp CRUD
│   └── registrationValidator.js    # express-validator rules for participant registrations
│
├── scripts/
│   ├── createAdmin.js              # Initial administrator creation seed script
│   └── seedCamps.js                # Realistic demonstration camps and sample registrations
│
├── views/
│   ├── layouts/
│   │   └── boilerplate.ejs         # Reusable HTML5 layout with SEO tags, Bootstrap 5, and partials
│   ├── partials/
│   │   ├── navbar.ejs              # Responsive navigation with active route highlighting
│   │   ├── footer.ejs              # Medical mission statement, quick links, and emergency notice
│   │   └── flash.ejs               # Dismissible alert banners for user feedback
│   ├── camps/
│   │   ├── index.ejs               # Camp directory with search, filter, and sorting
│   │   └── show.ejs                # Full camp details, schedule, capacity bar, and registration CTA
│   ├── registrations/
│   │   ├── new.ejs                 # Accessible registration form with live camp preview
│   │   ├── success.ejs             # High-contrast, print-friendly confirmation pass
│   │   └── lookup.ejs              # Self-service pass lookup by reference code or contact
│   ├── admin/
│   │   ├── login.ejs               # Dedicated admin login interface with credentials hint
│   │   ├── dashboard.ejs           # Executive KPI cards, capacity feed, and recent registrations
│   │   ├── camps.ejs               # Camp management table with Edit/Delete/Archive actions
│   │   ├── campForm.ejs            # Reusable create & edit camp form
│   │   └── registrations.ejs       # Searchable registration table with Attended/Cancel controls
│   ├── home.ejs                    # Modern homepage (Hero, Purpose, Featured Camps, Workflow)
│   ├── about.ejs                   # Healthcare equity mission and clinical commitments
│   ├── contact.ejs                 # Outreach helpdesk form and emergency disclaimer
│   ├── 404.ejs                     # Friendly 404 resource not found page
│   └── error.ejs                   # Central error handling display
│
├── public/
│   ├── css/
│   │   └── style.css               # Medical design system, custom teal palette, print stylesheets
│   ├── js/
│   │   └── main.js                 # Dynamic camp preview, client-side validation, print trigger
│   └── images/
│       └── camp-default.svg        # Scalable vector medical placeholder banner
│
└── tests/
    ├── camps.test.js               # Integration tests for public pages, search, and details
    ├── registrations.test.js       # Integration tests for validation, duplicates, and capacity
    └── admin.test.js               # Integration tests for auth protection, login, and camp CRUD
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18.0.0 or higher
- **MongoDB** running locally on port 27017 or a MongoDB Atlas URI

### 2. Installation
```bash
# Clone or navigate to the project directory
cd /Users/anurag/.gemini/antigravity-ide/scratch/medical-camp-registration-portal

# Install all dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in the project root (or copy `.env.example`):
```bash
cp .env.example .env
```

Configuration variables:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/medical_camp_portal
SESSION_SECRET=medical_camp_super_secret_session_key_2026_dev
ADMIN_DEFAULT_EMAIL=admin@medicalcamp.org
ADMIN_DEFAULT_PASSWORD=Admin@12345
ADMIN_DEFAULT_NAME=Chief Medical Administrator
```

### 4. Database Seeding
Seed the database with the administrator account and 6 demonstration medical camps:
```bash
# Create initial administrator account
npm run seed:admin

# Populate demonstration camps and registrations
npm run seed
```

### 5. Running the Application
```bash
# Start server in production mode
npm start

# Or with automatic reload during development
npm run dev
```

Visit the application in your browser:
- **Public Patient Portal:** [http://localhost:3000](http://localhost:3000)
- **Medical Camps Directory:** [http://localhost:3000/camps](http://localhost:3000/camps)
- **Patient Registration:** [http://localhost:3000/register](http://localhost:3000/register)
- **Find My Pass:** [http://localhost:3000/registrations/lookup](http://localhost:3000/registrations/lookup)
- **Administrator Login:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

**Default Administrator Credentials:**
- **Email / Username:** `admin@medicalcamp.org` or `admin`
- **Password:** `Admin@12345`

---

## 🧪 Automated Testing

The project includes 23 automated integration tests verifying backend endpoints, capacity race conditions, validation rules, duplicate detection, and administrator authorization.

Run the test suite:
```bash
npm test
```

### Test Coverage Highlights:
- **`tests/camps.test.js`**: Homepage loading, public camp listings, search by keyword, filter by specialty, single camp view, invalid ObjectId handling, missing 404 pages.
- **`tests/registrations.test.js`**: Form rendering, validation error handling (invalid age, phone, email, missing consent), atomic capacity increment, unique reference generation, confirmation pass loading, duplicate registration prevention, rejection when camp is full, and pass lookup.
- **`tests/admin.test.js`**: Session route protection, invalid login rejection with 401, session issuance on valid login, admin dashboard access, Camp CRUD operations (Create, Read, Update, Delete/Archive), registration status updates, and cancellation with atomic capacity release.

---

## 🔒 Security & Capacity Architecture

### 1. Atomic Capacity Tracking & Race Condition Protection
To prevent overbooking when multiple users register simultaneously, registration counts are updated atomically at the database level:
```javascript
const updatedCamp = await Camp.findOneAndUpdate(
  {
    _id: camp._id,
    status: { $in: ['Upcoming', 'Ongoing'] },
    isArchived: false,
    $expr: { $lt: ['$registrationCount', '$capacity'] }
  },
  { $inc: { registrationCount: 1 } },
  { new: true }
);

if (!updatedCamp) {
  // Camp reached capacity or was closed concurrently
  return res.status(400).render('registrations/new', { ...errorMsg });
}
```
If saving the registration document fails, a rollback decrement (`$inc: { registrationCount: -1 }`) is automatically executed.

### 2. Duplicate Detection
Active registrations are guarded against duplicates using a compound index on `{ campId: 1, email: 1, registrationStatus: 1 }` and `{ campId: 1, contactNumber: 1, registrationStatus: 1 }`. Duplicate attempts return HTTP 409 with the existing registration reference.

### 3. Safe Deletion & Data Consistency
When an administrator deletes a camp that already has active participant registrations, the system automatically marks it as `isArchived = true` and `status = 'Cancelled'` instead of hard-deleting, preserving patient records.

### 4. Cancellation & Capacity Release
When an administrator cancels a confirmed registration, the system atomically decrements `registrationCount` on the associated Camp, releasing the seat for other community members.

### 5. Administrative Authentication
- Passwords hashed using `bcryptjs` with salt rounds.
- Session stored in MongoDB via `connect-mongo`.
- Cookies configured with `httpOnly: true`, `sameSite: 'lax'`, and dynamic `secure` flags.
- Route protection middleware (`ensureAuthenticated`) guards all `/admin/*` operations.

---

## 📋 Sysslan IT Solutions 20-Point Verification Checklist

| # | Scenario | Status | Verification Method |
|---|---|:---:|---|
| 1 | Homepage loads successfully | ✅ | Verified (`GET /` returns 200) |
| 2 | Navigation links work correctly | ✅ | Active highlighting on all pages |
| 3 | Camp listings display database records | ✅ | Verified (`GET /camps` displays seeded records) |
| 4 | Camp details load for valid camp IDs | ✅ | Verified (`GET /camps/:id` returns 200) |
| 5 | Invalid camp IDs return an appropriate response | ✅ | Verified (Invalid ObjectId returns 404) |
| 6 | Search and filters work correctly | ✅ | Tested by keyword, specialty, city, status, and sort |
| 7 | Valid registrations are saved successfully | ✅ | Verified (DB record created, capacity updated) |
| 8 | Invalid form submissions are rejected | ✅ | Verified (Client & server express-validator rules) |
| 9 | Duplicate registrations are handled correctly | ✅ | Verified (Same email/phone returns 409 conflict) |
| 10 | Full camps cannot accept additional registrations | ✅ | Verified (Rejected with 'Camp Full' alert) |
| 11 | Closed camps cannot accept registrations | ✅ | Verified (Rejected with 'Registration Closed') |
| 12 | Registration references are generated correctly | ✅ | Verified (`MCR-YYYY-XXXXXX` format) |
| 13 | Admin login works with valid credentials | ✅ | Verified (Issues session cookie and redirects) |
| 14 | Invalid login attempts are rejected | ✅ | Verified (Returns 401 with error message) |
| 15 | Unauthorized users cannot access admin routes | ✅ | Verified (Redirects unauthenticated users to `/admin/login`) |
| 16 | Camp CRUD operations work correctly | ✅ | Create, Read, Update, Delete/Archive fully tested |
| 17 | Registration management works correctly | ✅ | Attended status toggle and search/filtering |
| 18 | Capacity is updated correctly after cancellation | ✅ | Verified (Camp capacity released upon cancellation) |
| 19 | Database errors are handled gracefully | ✅ | Centralized error handler renders clean error view |
| 20 | Responsive on desktop, tablet, and mobile | ✅ | Bootstrap 5 fluid grid and custom media queries |

---

## 🌐 Production Deployment Guide

### Deploying to Render / Railway / Heroku:
1. Push code to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Medical Camp Registration Portal"
   ```
2. Provision a free **MongoDB Atlas** cluster and obtain your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/medical_camp_portal?retryWrites=true&w=majority
   ```
3. Set Environment Variables in your hosting dashboard:
   - `NODE_ENV=production`
   - `PORT=3000`
   - `MONGODB_URI=<your-atlas-connection-string>`
   - `SESSION_SECRET=<generate-a-strong-random-64-char-string>`
   - `ADMIN_DEFAULT_EMAIL=admin@yourhospital.org`
   - `ADMIN_DEFAULT_PASSWORD=YourStrongPasswordHere`
4. Set Build & Start Commands:
   - **Build Command:** `npm install`
   - **Start Command:** `node scripts/createAdmin.js && node scripts/seedCamps.js && node app.js`

---

## 📄 License & Attribution

Developed as a Software Development Project for **Sysslan IT Solutions**.  
All sample hospitals, doctors, and patient registrations are **fictional demonstration data** for educational and portfolio demonstration.
