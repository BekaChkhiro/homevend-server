# Homevend Backend API

A complete Node.js backend API for the Homevend real estate platform, built with Express.js, TypeScript, and PostgreSQL.

## Tech Stack

- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod
- **Security**: Helmet, CORS, bcrypt
- **File Upload**: Multer (ready for property images)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Configure your PostgreSQL database in `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=homevend
```

4. Create the database:
```sql
CREATE DATABASE homevend;
```

5. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "role": "user"  // optional: "user" or "admin"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

#### Get Profile (Protected)
```http
GET /api/auth/profile
Authorization: Bearer <jwt_token>
```

### Health Check
```http
GET /health
```

## Database Models

### User Model
- `id` (UUID, Primary Key)
- `fullName` (string, required)
- `email` (string, unique, required)
- `password` (string, hashed, required)
- `role` (enum: 'user' | 'admin', default: 'user')
- `createdAt`, `updatedAt` (timestamps)

### Property Model (Ready for implementation)
- Complete property schema matching frontend requirements
- Support for Georgian real estate market specifics
- Image upload capability
- Advanced filtering and search features

## Authentication & Authorization

The API uses JWT tokens for authentication with the following features:

- **Token Generation**: 7-day expiration by default
- **Password Hashing**: bcrypt with 12 salt rounds
- **Role-based Access**: User and Admin roles
- **Middleware Protection**: `authenticate` and `authorize` middlewares

### Using Authentication

1. Register or login to get a JWT token
2. Include token in requests:
```
Authorization: Bearer <your_jwt_token>
```

### Test Accounts (for development)
Match frontend mock users:
- **User**: test@example.com / password
- **Admin**: admin@example.com / adminpass

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Ready to implement
- **Input Validation**: Zod schemas
- **SQL Injection Protection**: TypeORM parameterized queries
- **Password Hashing**: bcrypt

## Project Structure

```
src/
├── config/          # Database configuration
├── controllers/     # Route handlers
├── middleware/      # Express middleware
├── models/          # TypeORM entities
├── routes/          # API routes
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── index.ts         # Application entry point
```

## Next Steps

1. **Start PostgreSQL** and create the database
2. **Run the server**: `npm run dev`
3. **Test the API** using Postman or curl
4. **Integrate with frontend** by updating the AuthContext

## Frontend Integration

Update your frontend AuthContext to connect to this API:

```typescript
// Replace mock authentication with real API calls
const login = async (email: string, password: string): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      const { user, token } = data.data;
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
};
```