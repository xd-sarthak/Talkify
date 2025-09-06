# Talkify Backend API

A language learning chat application backend built with Node.js, Express, MongoDB, and Stream Chat for real-time messaging.

## 🚀 Features

- **User Authentication**: JWT-based authentication with refresh tokens
- **Real-time Chat**: Powered by Stream Chat for instant messaging
- **User Management**: Complete user profile and onboarding system
- **API Documentation**: Comprehensive Swagger/OpenAPI documentation
- **Security**: Secure password hashing, JWT tokens, and cookie-based authentication

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Stream Chat account and API keys

## 🛠️ Installation

1. Clone the repository
```bash
git clone <repository-url>
cd Talkify/backend
```

2. Install dependencies
```bash
npm install
```

3. Create environment variables
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/talkify
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
NODE_ENV=development
```

5. Start the development server
```bash
npm run dev
```

## 📚 API Documentation

The API is fully documented using Swagger/OpenAPI 3.0 specification. Once the server is running, you can access the interactive API documentation at:

**🔗 [http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

### API Endpoints

#### Authentication (`/api/auth`)
- `POST /signup` - Register a new user
- `POST /login` - Login user
- `POST /logout` - Logout user
- `POST /onboarding` - Complete user onboarding
- `GET /is-logged-in` - Check if user is logged in

#### Chat (`/api/chat`)
- `GET /stream-token` - Get Stream chat token for real-time messaging

#### Users (`/api/users`)
- User management endpoints (to be implemented)

### Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the access token in the Authorization header:

```bash
Authorization: Bearer <your_access_token>
```

For endpoints that support cookie-based authentication, the refresh token is automatically sent via HTTP-only cookies.

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── swagger.js          # Swagger configuration
│   ├── controllers/
│   │   ├── auth.controller.js  # Authentication logic
│   │   ├── chat.controller.js  # Chat functionality
│   │   └── user.controller.js  # User management
│   ├── lib/
│   │   ├── db.js              # Database connection
│   │   └── stream.js          # Stream Chat integration
│   ├── middlewares/
│   │   └── auth.middleware.js # Authentication middleware
│   ├── models/
│   │   └── User.js            # User data model
│   ├── routes/
│   │   ├── auth.route.js      # Authentication routes
│   │   ├── chat.route.js      # Chat routes
│   │   └── user.route.js      # User routes
│   ├── utils/
│   │   ├── APIerror.js        # Error handling utilities
│   │   ├── APIresponse.js     # Response formatting
│   │   └── asyncHandler.js    # Async error handling
│   └── server.js              # Main server file
├── package.json
└── README.md
```

## 🔧 Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **Stream Chat** - Real-time messaging
- **Swagger/OpenAPI** - API documentation
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## 📖 API Usage Examples

### Register a new user
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Login user
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Stream chat token
```bash
curl -X GET http://localhost:3000/api/chat/stream-token \
  -H "Authorization: Bearer <your_access_token>"
```

## 🔒 Security Features

- Password hashing using bcryptjs
- JWT access and refresh tokens
- HTTP-only cookies for refresh tokens
- CORS protection
- Input validation and sanitization
- Secure cookie settings for production

## 🚀 Deployment

1. Set `NODE_ENV=production` in your environment variables
2. Ensure all required environment variables are set
3. Use a process manager like PM2 for production
4. Set up proper logging and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please refer to the API documentation at `/api-docs` or create an issue in the repository.

---

**Happy Coding! 🎉**
