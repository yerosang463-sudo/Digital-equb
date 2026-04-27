# Digital Equb - Developer 
## 1. Developer Documentation
## Overview

Digital Equb is a full-stack web application built with React (frontend) and Node.js/Express (backend) that modernizes the traditional Ethiopian savings circle (Equb) system.

## Tech Stack
### Frontend
- React 18
- React Router v6
- Vite (build tool)
- Tailwind CSS (styling)
- shadcn/ui (UI components)
- Lucide React (icons)

### Backend
- Node.js
- Express.js
- MySQL (database)
- Nodemailer (email sending)
- JWT (authentication)

## Project Structure

```
digital-equb/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/        # Reusable components
│   │   │   │   ├── admin/        # Admin dashboard components
│   │   │   │   ├── sections/     # Page sections (Hero, Features, etc.)
│   │   │   │   └── ui/           # UI components (Button, Card, etc.)
│   │   │   ├── layouts/          # Layout components
│   │   │   ├── pages/            # Page components
│   │   │   ├── providers/        # Context providers (Auth, etc.)
│   │   │   ├── routes.jsx        # React Router configuration
│   │   │   └── App.jsx           # Main app component
│   │   ├── main.jsx              # Entry point
│   │   └── index.html            # HTML template
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── config/               # Configuration files
│   │   │   └── db.js             # Database connection
│   │   ├── controllers/          # Route controllers
│   │   ├── database/             # Database migrations and SQL files
│   │   │   └── sql/
│   │   ├── middleware/           # Express middleware
│   │   ├── models/               # Database models
│   │   ├── routes/               # API routes
│   │   │   ├── admin.js
│   │   │   ├── auth.js
│   │   │   ├── contact.js
│   │   │   └── dashboard.js
│   │   └── index.js              # Backend entry point
│   └── package.json
├── render.yaml                   # Render deployment configuration
└── README.txt                    # User documentation
```

## Getting Started Locally

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MySQL database
- Git

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file (`.env`):
```
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

4. Start development server:
```bash
npm run dev
```

Frontend will run on: http://localhost:5173

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file (`.env`):
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=digital_equb
JWT_SECRET=your-jwt-secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=admin@example.com
```

4. Set up MySQL database:
```bash
# Create database
mysql -u root -p
CREATE DATABASE digital_equb;
```

5. Run migrations:
```bash
# Execute SQL files from backend/src/database/sql/
mysql -u root -p digital_equb < backend/src/database/sql/migration_v3.sql
```

6. Start backend server:
```bash
node src/index.js
```

Backend will run on: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user info

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/groups` - Get user's groups
- `POST /api/dashboard/groups` - Create new group

### Groups
- `GET /api/dashboard/groups/:groupId` - Get group details
- `PUT /api/dashboard/groups/:groupId` - Update group
- `DELETE /api/dashboard/groups/:groupId` - Delete group

### Payments
- `GET /api/dashboard/payments` - Get payment history
- `POST /api/dashboard/payments` - Make a payment

### Contact
- `POST /api/contact` - Submit contact form

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/groups` - Get all groups
- `GET /api/admin/payments` - Get all payments
- `GET /api/admin/audit` - Get audit logs

## Database Schema

### Users Table
- `id` - Primary key
- `full_name` - User's full name
- `email` - User's email (unique)
- `phone` - User's phone number
- `password_hash` - Hashed password
- `role` - User role (user/admin)
- `created_at` - Timestamp

### Groups Table
- `id` - Primary key
- `name` - Group name
- `description` - Group description
- `admin_id` - Foreign key to users
- `contribution_amount` - Amount per contribution
- `cycle_frequency` - Frequency (weekly/monthly)
- `max_members` - Maximum members
- `created_at` - Timestamp

### Group Members Table
- `id` - Primary key
- `group_id` - Foreign key to groups
- `user_id` - Foreign key to users
- `joined_at` - Timestamp

### Payments Table
- `id` - Primary key
- `group_id` - Foreign key to groups
- `user_id` - Foreign key to users
- `amount` - Payment amount
- `status` - Payment status
- `created_at` - Timestamp

## Environment Variables

### Frontend (.env)
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID

### Backend (.env)
- `DB_HOST` - Database host
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `JWT_SECRET` - JWT secret key
- `EMAIL_USER` - Email for sending notifications
- `EMAIL_PASS` - Email app password
- `ADMIN_EMAIL` - Admin email address

## Deployment

### Render Deployment

The application is deployed on Render using the `render.yaml` configuration:

**Frontend:**
- Type: Static site
- Build command: `npm run build`
- Output directory: `dist`

**Backend:**
- Type: Node.js
- Build command: `npm install`
- Start command: `node src/index.js`

To deploy:
1. Push code to GitHub
2. Connect repository to Render
3. Render automatically detects the `render.yaml` configuration
4. Services are deployed automatically

## Key Components

### Frontend Components

**Navbar.jsx** - Main navigation component with responsive mobile menu

**HeroSection.jsx** - Landing page hero with CTA buttons

**FeaturesSection.jsx** - Feature cards with hover effects

**HowItWorksSection.jsx** - Step-by-step guide section

**PricingSection.jsx** - Pricing plans with tiered options

**ContactSection.jsx** - Contact form with email submission

**AuthProvider.jsx** - Authentication context provider

**DashboardLayout.jsx** - Dashboard layout with sidebar navigation

### Backend Routes

**auth.js** - User authentication and registration

**dashboard.js** - Dashboard data and group management

**contact.js** - Contact form handling with email sending

**admin.js** - Admin dashboard endpoints

## Authentication Flow

1. User registers or logs in
2. Backend generates JWT token
3. Token stored in localStorage
4. Token sent with each API request
5. Backend validates token on protected routes
6. Protected components check authentication status

## Google OAuth Setup

1. Create Google Cloud Project
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs
5. Copy Client ID to environment variables

## Email Configuration

Uses Nodemailer with Gmail SMTP:
1. Enable 2-factor authentication on Gmail
2. Generate app-specific password
3. Add EMAIL_USER and EMAIL_PASS to environment variables
4. Configure transporter in backend routes

## Common Issues

### Frontend Build Errors
- Check node_modules are installed
- Verify environment variables are set
- Clear Vite cache: `npm run build -- --force`

### Backend Connection Errors
- Verify MySQL is running
- Check database credentials in .env
- Ensure database exists and migrations are run

### Email Not Sending
- Verify Gmail app password is correct
- Check EMAIL_USER and EMAIL_PASS in .env
- Ensure 2FA is enabled on Gmail account

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software. All rights reserved.

## Contact

For technical questions or support:
- Email: yerosang463@gmail.com
- GitHub: https://github.com/yerosang463-sudo/Digital-equb
