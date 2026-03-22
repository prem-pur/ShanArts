# Printing Management System — Complete Shop Management Solution

**Project:** Y2S2-WE-DS-G13  
**Supervisor:** Dr.Kapila Dissanayake
**Stack:** Node.js / Express · React · MongoDB · JWT Authentication  
**Status:** Core system complete; module integration in progress

---

## Project Overview

The Printing Management System is a production-grade, web-based digital printing shop management system built for Shan Art Advertising. It replaces fragmented manual workflows with an integrated, AI-assisted platform covering the full operational lifecycle — from customer order intake and production scheduling, through inventory control and automated billing, to real-time delay risk detection.

The system addresses the real operational challenges identified directly with the client: inaccurate order records, production delays caused by poor coordination, and the absence of any predictive mechanism for identifying risk early. A Random Forest ML model is embedded in the platform to provide real-time delay prediction and scheduling recommendations.

### Key Capabilities

- **Order Management** — Complete order lifecycle from customer request through production to delivery.
- **User Management** — Role-based access control for staff and customers with granular permission enforcement.
- **Inventory Management** — Real-time tracking of materials, equipment, and stock thresholds.
- **Pricing & Billing** — Automated invoicing, cost calculation, and payment status tracking.
- **Schedule Management** — Production scheduling, resource allocation, and machine assignment.
- **Feedback & Notifications** — Customer feedback collection and automated status notifications.
- **AI Delay Detection** — ML-powered prediction of job delays with scheduling recommendations via FastAPI microservice.

### Architecture Highlights

- JWT-based authentication with role-based access control across 8 defined roles
- Modular backend architecture — each business domain is an independent Express module
- Python FastAPI microservice for AI model serving with fallback to status-based alerts if offline
- Multi-role customer and staff portals served from a single React frontend
- Auto-initialized MongoDB collections on first run via Mongoose schema definitions
- Real-time stock deduction integrated between Order and Inventory modules

---

## Team Assignments

| Member | Module | Responsibilities |
|---|---|---|
| Fernando | User Management | Registration, JWT lifecycle, RBAC, staff and customer account management |
| Gunathunga | Order Management | Order creation, status lifecycle, customer order tracking, order history |
| Premachandra | Schedule Management | Production scheduling, machine assignment, resource allocation, timeline views |
| Anuheesara | Inventory Management | Material tracking, machine records, stock threshold alerts, supplier data |
| Wijesinghe | Pricing & Billing Management | Invoice generation, cost calculation, payment tracking, billing reports |
| Martinus | Feedback & Notification Management | Customer feedback collection, automated notifications, alert engine |

---

## Project Structure

```
printing-management-system/
├── client/                                   # React frontend
│   ├── src/
│   │   ├── components/                       # Reusable UI components
│   │   ├── pages/                            # Full page views
│   │   │   ├── OrderManagement/
│   │   │   ├── UserManagement/
│   │   │   ├── InventoryManagement/
│   │   │   ├── BillingManagement/
│   │   │   └── ScheduleManagement/
│	│	│	└── FeedbackNotificationManagement/
│   │   └── services/                         # Axios API service layer
│   ├── package.json
│   └── .env.example
│
├── server/                                   # Node.js/Express backend
│   ├── modules/                              # Domain-separated business logic
│   │   ├── UserManagement/
│   │   ├── OrderManagement/
│   │   ├── InventoryManagement/
│   │   ├── BillingManagement/
│   │   ├── ScheduleManagement/
│   │   └── FeedbackNotificationManagement/
│   ├── middleware/                           # Auth, RBAC, validation, error handling
│   ├── config/                               # Database and app configuration
│   ├── package.json
│   └── .env.example
│
├── ai-service/                               # AI integration microservice
│   ├── /data               # Training datasets
│   ├── /models             # Saved models
│   ├── /notebooks          # Experiments
│   ├── /src                # Source code
│   └── requirements.txt    # Python deps
├── package.json                              # Root orchestration scripts
└── README.md
```

---

## Prerequisites

| Requirement | Minimum Version |
|---|---|
| Node.js | 16.0+ |
| npm | 8.0+ |
| MongoDB | 5.0+ (or MongoDB Atlas free tier) |
| Git | Latest |

Recommended development tools: Visual Studio Code, Chrome or Firefox (latest), Postman or Insomnia for API testing.

---

## Setup & Installation

**1. Clone the repository.**

```bash
git clone [repository-url]
cd printing-management-system
```

**2. Install all dependencies.**

```bash
# Install root, server, and client dependencies in one command
npm run install-all

# Or install manually
npm install
cd server && npm install
cd ../client && npm install
```

**3. Configure environment files.**

Backend — `server/.env`
```
PORT=5001
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name
JWT_SECRET=your-secret-key-here
```

Frontend — `client/.env`
```
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_ENV=development
```

**4. Start MongoDB.**

```bash
# Local instance
mongod

# If using MongoDB Atlas, update MONGO_URI in server/.env
```

The application will auto-create all required collections on first run.

---

## Running the Application

**Development mode — both services concurrently**
```bash
npm run dev
```

**Development mode — individually**
```bash
npm run dev-server    # Backend only — http://localhost:5001
npm run dev-client    # Frontend only — http://localhost:3000
```

**Production mode**
```bash
cd client && npm run build
cd ../server && npm start
```

### Service URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5001/api |
| API Health Check | http://localhost:5001/api/health |

---

## Authentication Flow

### Login

```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

- Verifies credentials via bcrypt comparison
- Issues JWT access token on success
- Role is embedded in the token payload and enforced on all protected routes
- Returns: `{ token, user: { _id, name, email, role } }`

### Registration

```
POST /api/auth/register
{
  "name": "Sachintha Fernando",
  "email": "sachi@example.com",
  "password": "SecurePassword123",
  "role": "admin"
}
```

- Password hashed with bcrypt before storage
- Role defaults to `customer` unless assigned by admin
- Returns: `{ user: { _id, name, email, role } }`

### Logout

```
POST /api/auth/logout
Authorization: Bearer <token>
```

- Invalidates the current session token
- Clears client-side token storage

### Profile

```
GET /api/auth/profile
Authorization: Bearer <token>
```

- Returns the authenticated user's full profile

---

## Role-Based Access Control

### Defined Roles

| Role | Description |
|---|---|
| `admin` | Full system access across all modules |
| `staff_inventory` | Inventory and material management |
| `staff_finance` | Billing, invoicing, and payment tracking |
| `staff_operator` | Production operations and machine management |
| `staff_schedule` | Schedule creation and resource allocation |
| `staff_system` | System configuration and user provisioning |
| `staff_designer` | Design template creation and management |
| `customer` | Order placement, tracking, and own billing view |

### Access Matrix

| Feature | Admin | Inventory | Finance | Operator | Schedule | System | Designer | Customer |
|---|---|---|---|---|---|---|---|---|
| User Management | Yes | No | No | No | No | Yes | No | No |
| Order Management | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Own only |
| Inventory | Yes | Yes | No | No | No | No | No | No |
| Billing | Yes | No | Yes | No | No | No | No | Own only |
| Scheduling | Yes | No | No | Yes | Yes | No | No | No |
| Design Templates | Yes | No | No | No | No | Yes | Yes | No |

### Enforcement

**Middleware (Backend)**
```javascript
router.get('/admin/users',
  authenticate,                        // Verify JWT
  authorize(['admin', 'staff_system']),// Enforce role
  listUsers                            // Execute handler
);
```

**Route Guards (Frontend)**
```jsx
<Route
  path="/admin/users"
  element={
    <ProtectedRoute requiredRoles={['admin', 'staff_system']}>
      <UserManagementPage />
    </ProtectedRoute>
  }
/>
```

---

## Database Models

### `users`

```json
{
  "_id": "ObjectId",
  "name": "String",
  "email": "String (unique)",
  "passwordHash": "String (bcrypt)",
  "role": "String (enum: admin | staff_* | customer)",
  "phone": "String",
  "isActive": "Boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### `orders`

```json
{
  "_id": "ObjectId",
  "orderNumber": "String (unique)",
  "customer": "ObjectId (ref: users)",
  "items": "[OrderItem]",
  "status": "String (enum: pending | confirmed | in_production | completed | cancelled)",
  "totalAmount": "Number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### `machines`

```json
{
  "_id": "ObjectId",
  "name": "String",
  "type": "String",
  "status": "String (enum: available | busy | maintenance)",
  "specifications": "Object",
  "location": "String",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### `materials`

```json
{
  "_id": "ObjectId",
  "name": "String",
  "type": "String",
  "quantity": "Number",
  "unit": "String",
  "minimumStock": "Number",
  "supplier": "String",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### `invoices`

```json
{
  "_id": "ObjectId",
  "orderId": "ObjectId (ref: orders)",
  "customer": "ObjectId (ref: users)",
  "lineItems": "[InvoiceItem]",
  "totalAmount": "Number",
  "status": "String (enum: draft | issued | paid | overdue)",
  "issuedAt": "Date",
  "dueDate": "Date",
  "createdAt": "Date"
}
```

### `schedules`

```json
{
  "_id": "ObjectId",
  "orderId": "ObjectId (ref: orders)",
  "machineId": "ObjectId (ref: machines)",
  "assignedOperator": "ObjectId (ref: users)",
  "startTime": "Date",
  "endTime": "Date",
  "status": "String (enum: scheduled | in_progress | completed | cancelled)",
  "createdAt": "Date"
}
```

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Authenticate and issue JWT |
| POST | `/api/auth/register` | Create user account |
| POST | `/api/auth/logout` | Invalidate session token |
| GET | `/api/auth/profile` | Retrieve current user profile |

### User Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all users (admin / staff_system) |
| GET | `/api/users/:id` | Get user details |
| PUT | `/api/users/:id` | Update user profile |
| POST | `/api/users/:id/activate` | Activate user account |
| POST | `/api/users/:id/deactivate` | Deactivate user account |
| POST | `/api/users/:id/assign-role` | Assign role (admin only) |

### Order Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/orders` | List all orders |
| POST | `/api/orders` | Create new order |
| GET | `/api/orders/:id` | Get order details |
| PUT | `/api/orders/:id` | Update order |
| DELETE | `/api/orders/:id` | Delete order |
| PUT | `/api/orders/:id/status` | Update order status |

### Inventory Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/machines` | List all machines |
| POST | `/api/machines` | Add machine |
| PUT | `/api/machines/:id` | Update machine details |
| GET | `/api/inventory` | List all materials |
| POST | `/api/inventory` | Add material |
| PUT | `/api/inventory/:id` | Update material stock |

### Pricing & Billing Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/invoices` | List all invoices |
| POST | `/api/invoices` | Create invoice |
| GET | `/api/invoices/:id` | Get invoice details |
| PUT | `/api/invoices/:id` | Update invoice |
| PUT | `/api/invoices/:id/status` | Update payment status |

### Schedule Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/schedule` | Get production schedule |
| POST | `/api/schedule` | Create schedule entry |
| PUT | `/api/schedule/:id` | Update schedule entry |
| DELETE | `/api/schedule/:id` | Remove schedule entry |

### Feedback & Notifications

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/feedback` | List all feedback |
| POST | `/api/feedback` | Submit feedback |
| GET | `/api/notifications` | List user notifications |
| PUT | `/api/notifications/:id/read` | Mark notification as read |

---

## Frontend Pages

| Route | Component | Access |
|---|---|---|
| `/` | HomePage | Public |
| `/dashboard` | DashboardPage | All authenticated roles |
| `/staff/login` | StaffLoginPage | Public |
| `/customer/login` | CustomerLoginPage | Public |
| `/register` | RegisterPage | Public |
| `/orders` | OrderWorkspacePage | All authenticated roles |
| `/machines` | MachinesPage | admin, staff_operator, staff_inventory |
| `/inventory` | InventoryPage | admin, staff_inventory |
| `/invoices` | InvoicesPage | admin, staff_finance, customer (own only) |
| `/schedule` | SchedulePage | admin, staff_operator, staff_schedule |
| `/customer` | CustomerPortalPage | customer |
| `/admin/users` | UserManagementPage | admin, staff_system |

**DashboardPage** — Role-specific dashboard displaying relevant KPI cards, quick-access navigation, and pending action counts per module.

**OrderWorkspacePage** — Full order management interface with status pipeline view, order creation form, and filtering by status, date, and customer.

**InvoicesPage** — Invoice listing with payment status indicators, invoice generation from orders, and PDF export.

**SchedulePage** — Calendar and list view of production schedule with drag-and-drop machine assignment and operator allocation.

**CustomerPortalPage** — Self-service portal for customers to place orders, track production status, view invoices, and submit feedback.

---

## Testing

### Backend

```bash
cd server
npm test                     # Run all Jest tests
npm run test:unit            # Unit tests only
npm run test:integration     # Integration tests only
```

### Frontend

```bash
cd client
npm test                     # Run all React tests
npm run test:coverage        # Generate coverage report
```

### Manual Test Checklist

**Authentication**
- [ ] Registration creates hashed password and assigns correct role
- [ ] Login succeeds with valid credentials and fails with invalid
- [ ] JWT token is present in response and accepted on protected routes
- [ ] Logout invalidates session

**RBAC**
- [ ] Admin can access all modules
- [ ] staff_finance is blocked from inventory routes
- [ ] customer can only view own orders and own invoices
- [ ] Unauthorized access returns 403

**Order Management**
- [ ] Order creation persists with correct customer reference
- [ ] Status transitions follow the defined lifecycle
- [ ] Customer can view own orders only

**Inventory Management**
- [ ] Material stock updates correctly on edit
- [ ] Low-stock threshold triggers alert
- [ ] Machine status transitions work correctly

**Billing Management**
- [ ] Invoice generates from order with correct line items
- [ ] Payment status update reflects immediately
- [ ] Customer can view own invoices only

**Schedule Management**
- [ ] Schedule entry links correctly to order and machine
- [ ] Conflicting machine assignments are flagged
- [ ] Completed schedules update order status

---

## Deployment

### Docker

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:6.0
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: password
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  backend:
    build: ./server
    environment:
      MONGO_URI: mongodb://root:password@mongodb:27017/printingdb
      NODE_ENV: production
      JWT_SECRET: your-production-secret
    ports:
      - "5001:5001"
    depends_on:
      - mongodb

  frontend:
    build: ./client
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  mongo_data:
```

```bash
docker-compose up -d
```

### Manual Production Deployment

```bash
# 1. Build frontend
cd client && npm run build

# 2. Set production environment variables in server/.env
NODE_ENV=production
PORT=80
MONGO_URI=[production-mongodb-uri]
JWT_SECRET=[production-jwt-secret]

# 3. Start backend
cd ../server && npm start

# 4. Configure Nginx as reverse proxy for API and to serve frontend build
```

---

## Troubleshooting

**Database connection fails**
```bash
# Test connection string directly
mongosh [connection-string]

# Confirm env var is loaded
echo $MONGO_URI

# Check Atlas IP whitelist — ensure your server IP is allowed
```

**Port already in use**
```bash
# Find and kill the conflicting process
lsof -i :5001
lsof -i :3000
kill -9 [PID]
```

**Dependency or module errors**
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**JWT errors**
- Confirm `JWT_SECRET` is set in `server/.env`
- Verify the `Authorization: Bearer <token>` header is sent with every protected request
- Check token expiry — re-login to obtain a fresh token

**CORS errors**
- Confirm the frontend origin is listed in the backend CORS config
- Ensure no proxy is stripping the `Authorization` header

**Authentication not working after role change**
- The role is embedded in the JWT at login time — user must log out and log in again after a role update for the new permissions to take effect

---

## External References

- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Express.js Documentation](https://expressjs.com)
- [React Documentation](https://react.dev)
- [JSON Web Tokens](https://jwt.io)
- [Mongoose Documentation](https://mongoosejs.com)

