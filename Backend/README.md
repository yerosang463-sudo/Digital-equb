# Digital Equb - Backend API

Node.js + Express + MySQL backend for the Digital Equb savings group platform.

## Requirements

- Node.js v18+
- MySQL 8.0+
- npm or yarn

## Database Setup

Connect to MySQL as root and run:

```sql
CREATE USER 'yero'@'localhost' IDENTIFIED BY '@yero54321';
GRANT ALL PRIVILEGES ON `digital-equb`.* TO 'yero'@'localhost';
FLUSH PRIVILEGES;
```

Then set up the schema and seed data:

```bash
mysql -u yero -p'@yero54321' < src/database/schema.sql
mysql -u yero -p'@yero54321' < src/database/seed.sql
```

## Environment Variables

Copy or edit `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=yero
DB_PASSWORD=@yero54321
DB_NAME=digital-equb

JWT_SECRET=digital-equb-jwt-secret-key-2024
JWT_EXPIRES_IN=7d

PORT=5000
NODE_ENV=development
```

## Installation

```bash
npm install
```

## Running

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /api/auth/register | Register new user | No |
| POST | /api/auth/login | Login | No |
| GET | /api/auth/me | Get current user | Yes |
| POST | /api/auth/logout | Logout | Yes |

### Users
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /api/users | List all users | Yes |
| GET | /api/users/profile | Get my profile | Yes |
| PUT | /api/users/profile | Update my profile | Yes |
| PUT | /api/users/change-password | Change password | Yes |
| GET | /api/users/:id | Get user by ID | Yes |

### Equb Groups
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /api/groups | List all groups | Yes |
| GET | /api/groups/my | My groups | Yes |
| GET | /api/groups/:id | Get group details | Yes |
| POST | /api/groups | Create group | Yes |
| PUT | /api/groups/:id | Update group (admin) | Yes |
| POST | /api/groups/:id/join | Join a group | Yes |
| DELETE | /api/groups/:id/leave | Leave a group | Yes |
| GET | /api/groups/:id/members | List group members | Yes |

### Payments
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /api/payments | My payments | Yes |
| GET | /api/payments/summary/me | My payment summary | Yes |
| GET | /api/payments/group/:groupId | Group payments | Yes |
| GET | /api/payments/:id | Get payment | Yes |
| POST | /api/payments | Create payment | Yes |
| PUT | /api/payments/:id/confirm | Confirm payment | Yes |

### Notifications
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /api/notifications | My notifications | Yes |
| PUT | /api/notifications/read-all | Mark all read | Yes |
| PUT | /api/notifications/:id/read | Mark one read | Yes |
| DELETE | /api/notifications/:id | Delete notification | Yes |

### Dashboard
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /api/dashboard/stats | Overview stats | Yes |
| GET | /api/dashboard/recent-activity | Recent activity | Yes |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Server health check |

## Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens are returned from `/api/auth/login` and `/api/auth/register`.

## Example Requests

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"John Doe","email":"john@example.com","password":"password123","phone":"+251911234567"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### Get Groups
```bash
curl http://localhost:5000/api/groups \
  -H "Authorization: Bearer <token>"
```

### Create Group
```bash
curl -X POST http://localhost:5000/api/groups \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Equb","contribution_amount":1000,"frequency":"monthly","max_members":10}'
```

## Frontend Integration

In your frontend (`vite.config.js`), set up a proxy or use the base URL:

```javascript
const API_BASE_URL = 'http://localhost:5000';
```

Then make API calls like:

```javascript
const login = async (email, password) => {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.token) localStorage.setItem('token', data.token);
  return data;
};

const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  return fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
};
```
