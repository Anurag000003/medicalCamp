# Medical Camp Registration Portal

Built with Node.js, Express.js, MongoDB, Mongoose, EJS, and Bootstrap 5.

---

## Project Overview

The Medical Camp Registration Portal is a responsive healthcare web application designed to connect community members with free medical screening clinics and doctor consultations. The platform provides:

1. Public patient portal to discover medical camps, filter by medical specialty, review diagnostic services, and register for printable passes.
2. Administrative control panel for healthcare organizers to manage camp listings, monitor capacity utilization, and manage participant records.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (ES6+), Bootstrap 5.3, Bootstrap Icons, EJS (`ejs-mate`) |
| Backend | Node.js (v18+), Express.js 4.x |
| Database | MongoDB 7.x, Mongoose 8.x ODM |
| Authentication & Sessions | express-session, connect-mongo, bcryptjs |
| Validation & Security | express-validator, method-override |
| Feedback & Logging | connect-flash, morgan |
| Testing | jest, supertest (23 integration tests) |

---

## Project Architecture

```
medical-camp-registration-portal/
├── app.js                          # Express application and middleware pipeline
├── package.json                    # Project dependencies and scripts
├── .env.example                    # Environment variable template
├── .env                            # Local configuration (excluded from git)
├── .gitignore                      # Git ignore file
├── README.md                       # Project documentation
│
├── config/
│   └── database.js                 # MongoDB connection and Mongoose initialization
│
├── models/
│   ├── Camp.js                     # Camp schema, virtuals, and indexes
│   ├── Registration.js             # Registration schema, unique reference generator
│   └── Admin.js                    # Admin user schema with bcrypt hashing
│
├── controllers/
│   ├── campController.js           # Camp listing, search, details, and informational pages
│   ├── registrationController.js   # Registration handling, validation, pass display
│   └── adminController.js          # Authentication, dashboard KPIs, camp CRUD, registrations
│
├── routes/
│   ├── campRoutes.js               # Public routes: /, /camps, /about, /contact
│   ├── registrationRoutes.js       # Registration routes: /register, /registrations/*
│   └── adminRoutes.js              # Admin routes: /admin/login, /admin/dashboard, /admin/camps
│
├── middleware/
│   ├── authentication.js           # Session auth guards: ensureAuthenticated, forwardAuthenticated
│   └── errorHandler.js             # 404 handler and global error middleware
│
├── validators/
│   ├── campValidator.js            # express-validator rules for medical camp CRUD
│   └── registrationValidator.js    # express-validator rules for registrations
│
├── scripts/
│   ├── createAdmin.js              # Administrator account creation script
│   └── seedCamps.js                # Demonstration camps and sample registrations
│
├── views/
│   ├── layouts/
│   │   └── boilerplate.ejs         # HTML5 layout with Bootstrap 5 and partials
│   ├── partials/
│   │   ├── navbar.ejs              # Navigation bar with active route highlighting
│   │   ├── footer.ejs              # Footer links and emergency notice
│   │   └── flash.ejs               # Flash alerts for user feedback
│   ├── camps/
│   │   ├── index.ejs               # Camp directory with search, filter, and sorting
│   │   └── show.ejs                # Full camp details, schedule, capacity bar, registration CTA
│   ├── registrations/
│   │   ├── new.ejs                 # Registration form with camp preview
│   │   ├── success.ejs             # Confirmation pass view
│   │   └── lookup.ejs              # Pass lookup by reference code or contact
│   ├── admin/
│   │   ├── login.ejs               # Admin login interface
│   │   ├── dashboard.ejs           # KPI cards, capacity feed, recent registrations
│   │   ├── camps.ejs               # Camp management table
│   │   ├── campForm.ejs            # Create and edit camp form
│   │   └── registrations.ejs       # Registration table with status controls
│   ├── home.ejs                    # Homepage
│   ├── about.ejs                   # About page
│   ├── contact.ejs                 # Contact page
│   ├── 404.ejs                     # 404 page
│   └── error.ejs                   # Error page
│
├── public/
│   ├── css/
│   │   └── style.css               # Stylesheet and print styles
│   ├── js/
│   │   └── main.js                 # Camp preview, client validation, print trigger
│   └── images/
│       └── camp-default.svg        # Placeholder banner
│
└── tests/
    ├── camps.test.js               # Tests for public pages, search, details
    ├── registrations.test.js       # Tests for validation, duplicates, capacity
    └── admin.test.js               # Tests for authentication, login, camp CRUD
```

---

## Quick Start Guide

### 1. Prerequisites
- Node.js v18.0.0 or higher
- MongoDB running locally on port 27017 or a MongoDB Atlas URI

### 2. Installation
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the project root:
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
```bash
# Create admin account
npm run seed:admin

# Populate sample camps and registrations
npm run seed
```

### 5. Running the Application
```bash
# Production mode
npm start

# Development mode
npm run dev
```

Application URLs:
- Public Patient Portal: http://localhost:3000
- Medical Camps Directory: http://localhost:3000/camps
- Patient Registration: http://localhost:3000/register
- Pass Lookup: http://localhost:3000/registrations/lookup
- Administrator Login: http://localhost:3000/admin/login

Default Admin Credentials:
- Email / Username: `admin@medicalcamp.org` or `admin`
- Password: `Admin@12345`

---

## Testing

Run the test suite:
```bash
npm test
```

Test Coverage:
- `tests/camps.test.js`: Homepage loading, camp listings, search, filter, camp view, 404 handling.
- `tests/registrations.test.js`: Form rendering, input validation, atomic capacity increment, unique reference generation, duplicate prevention, capacity limits, pass lookup.
- `tests/admin.test.js`: Route protection, login authentication, session management, camp CRUD, registration status updates, capacity release on cancellation.

---

## Security and Capacity Architecture

### 1. Atomic Capacity Tracking
Registration counts use atomic increments to prevent overbooking:
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
  return res.status(400).render('registrations/new', { ...errorMsg });
}
```
If saving fails, the count is rolled back with `$inc: { registrationCount: -1 }`.

### 2. Duplicate Detection
Active registrations use compound indexes on `{ campId: 1, email: 1, registrationStatus: 1 }` and `{ campId: 1, contactNumber: 1, registrationStatus: 1 }`. Duplicate attempts return HTTP 409.

### 3. Safe Deletion
When deleting a camp with active registrations, the system sets `isArchived = true` and `status = 'Cancelled'` to retain patient records.

### 4. Cancellation and Capacity Release
Cancelling a registration decrements `registrationCount` on the associated Camp document.

### 5. Administrative Authentication
- Passwords hashed with bcryptjs.
- Sessions stored in MongoDB via connect-mongo.
- Cookies configured with `httpOnly: true` and `sameSite: 'lax'`.
- `ensureAuthenticated` middleware guards admin routes.

---

## Verification Checklist

| # | Scenario | Status | Verification Method |
|---|---|:---:|---|
| 1 | Homepage loads successfully | Passed | GET / returns 200 |
| 2 | Navigation links work correctly | Passed | Active route highlighting verified |
| 3 | Camp listings display records | Passed | GET /camps displays records |
| 4 | Camp details load for valid IDs | Passed | GET /camps/:id returns 200 |
| 5 | Invalid camp IDs return 404 | Passed | Invalid ObjectId returns 404 |
| 6 | Search and filters work correctly | Passed | Verified by keyword, specialty, city, status, sort |
| 7 | Valid registrations are saved | Passed | Record created and capacity updated |
| 8 | Invalid form submissions rejected | Passed | Server and client validation rules |
| 9 | Duplicate registrations prevented | Passed | Matching email/phone returns 409 |
| 10 | Full camps reject registrations | Passed | Returns capacity error |
| 11 | Closed camps reject registrations | Passed | Returns closed registration message |
| 12 | Registration references generated | Passed | MCR-YYYY-XXXXXX format verified |
| 13 | Admin login works | Passed | Valid credentials issue session cookie |
| 14 | Invalid login attempts rejected | Passed | Returns 401 |
| 15 | Unauthorized admin access blocked | Passed | Redirects to /admin/login |
| 16 | Camp CRUD operations work | Passed | Create, Read, Update, Delete/Archive verified |
| 17 | Registration management works | Passed | Status toggle and search verified |
| 18 | Capacity released on cancellation | Passed | registrationCount decremented |
| 19 | Database errors handled gracefully | Passed | Central error handler renders error view |
| 20 | Responsive interface | Passed | Bootstrap 5 grid layout |

---

## Production Deployment Guide

### Deploying to Render, Railway, or Heroku

1. Push code to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Medical Camp Registration Portal"
   ```

2. Create a MongoDB Atlas cluster and get the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/medical_camp_portal?retryWrites=true&w=majority
   ```

3. Set Environment Variables in your hosting dashboard:
   - `NODE_ENV`: `production`
   - `PORT`: `3000` (or leave default for cloud platforms)
   - `MONGODB_URI`: `<your-atlas-connection-string>`
   - `SESSION_SECRET`: `<secure-random-string>`
   - `ADMIN_DEFAULT_EMAIL`: `admin@yourhospital.org`
   - `ADMIN_DEFAULT_PASSWORD`: `<your-strong-password>`

4. Configure Build and Start Commands:
   - **Build Command:** `npm install`
   - **Start Command:** `node scripts/createAdmin.js && node scripts/seedCamps.js && node app.js`

---

## License & Attribution

All sample hospitals, doctors, and patient registrations are demonstration data.
