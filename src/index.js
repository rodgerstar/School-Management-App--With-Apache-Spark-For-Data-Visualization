const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { globalErrorHandler } = require('./utils/errorhandler');
const { authMiddleware } = require('./middleware/auth');  // X-API-Key gateway
const { jwtAuth } = require('./middleware/jwtAuth');      // JWT user auth

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to Database
connectDB();

// Root health check (public)
app.get('/', (req, res) => {
  res.send('School Management API is running!');
});

// PUBLIC: Tenant registration
app.use('/api/v1/auth/register-tenant', require('./routes/auth/registerTenantRoutes'));

// GATEWAY: X-API-Key for all /api/v1
app.use(authMiddleware);

// PUBLIC LOGIN: Only X-API-Key, no JWT
app.use('/api/v1/auth/login', require('./routes/auth/loginroutes'));

// PROTECTED: JWT required for everything below
app.use(jwtAuth);

// All other protected routes
app.use('/api/v1/auth/users', require('./routes/auth/userManagementRoutes'));
app.use('/api/v1/roles', require('./routes/roles'));
app.use('/api/v1/students', require('./routes/students'));
app.use('/api/v1/branches', require('./routes/branches'));
app.use('/api/v1/classes', require('./routes/classes'));  // 👈 ADD THIS LINE
app.use('/api/v1/performance', require('./routes/performance'));

// 404 and error
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Public: POST /api/v1/auth/register-tenant`);
  console.log(`Login: POST /api/v1/auth/login (X-API-Key only)` );
  console.log(`All other routes: X-API-Key + Authorization: Bearer <token>`);
});