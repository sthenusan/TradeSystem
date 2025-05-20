# Barter Trading System

A modern web application for barter trading, allowing users to exchange goods and services.

## Features

- User authentication and authorization
- Item listing and management
- Search and filter functionality
- Real-time messaging between users
- Trade proposal and negotiation system
- User ratings and reviews
- Responsive design for all devices

## Tech Stack

### Frontend

- HTML5
- CSS3
- JavaScript (ES6+)
- Materialize CSS Framework
- EJS (Embedded JavaScript) templating

### Backend

- Node.js
- Express.js
- MongoDB with Mongoose ODM
- RESTful API

### Testing

- Unit Testing: Jest, Mocha, Chai
- UI Testing: Cypress
- End-to-End Testing: Cypress

## Project Structure

```
barter-trading-system/
├── config/             # Configuration files
├── controllers/        # Route controllers
├── middleware/        # Middleware handlers
├── models/            # Database models
├── routes/            # API routes
├── services/          # Business logic
├── public/            # Static files
│   ├── css/
│   ├── js/
│   └── images/
├── views/             # EJS templates
├── tests/             # Test files
│   ├── unit/
│   ├── ui/
│   └── e2e/
└── utils/             # Utility functions
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone [repository-url]
cd barter-trading-system
```

2. Install dependencies

```bash
npm install
```

3. Set up local environment variables (OPTIONAL)

```bash
cp .env.example .env
```

4. Install MongoDB

- On Windows:

  - Download the MongoDB Community Server from the [official website](https://www.mongodb.com/try/download/community).
  - Run the installer and follow the setup instructions.
  - After installation, you can start MongoDB as a Windows service or run it manually from the command prompt:
    ```bash
    "C:\Program Files\MongoDB\Server\<version>\bin\mongod.exe"
    ```

- On MacOS:

  ```bash
  brew tap mongodb/brew
  brew install mongodb-community
  brew services start mongodb-community
  ```

  This will install and start MongoDB as a background service.

- On Ubuntu:

  ```bash
  sudo apt update
  sudo apt install -y gnupg
  wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
  echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
  sudo apt update
  sudo apt install -y mongodb-org
  sudo systemctl start mongod
  sudo systemctl enable mongod
  ```

  This will install and start MongoDB as a service.

- To verify MongoDB is running:
  ```bash
  mongo --eval 'db.runCommand({ connectionStatus: 1 })'
  ```
  You should see a response with `"ok" : 1`.

### Run & Test

#### 1. Start & Stop MongoDB

- **On Windows**

  - Start MongoDB (as a service):
    ```bash
    net start MongoDB
    ```
  - Stop MongoDB (as a service):
    ```bash
    net stop MongoDB
    ```
  - Or run manually (if not installed as a service):
    ```bash
    "C:\Program Files\MongoDB\Server\<version>\bin\mongod.exe"
    ```

- **On macOS** (with Homebrew)

  - Start MongoDB:
    ```bash
    brew services start mongodb-community
    ```
  - Stop MongoDB:
    ```bash
    brew services stop mongodb-community
    ```

- **On Ubuntu/Linux**
  - Start MongoDB:
    ```bash
    sudo systemctl start mongod
    ```
  - Stop MongoDB:
    ```bash
    sudo systemctl stop mongod
    ```
  - Check status:
    ```bash
    sudo systemctl status mongod
    ```

#### 2. Start the development server

```bash
npm run dev
```

#### 3. Run tests

```bash
npm test           # Run unit tests
npm run test:ui    # Run UI tests
npm run test:e2e   # Run end-to-end tests
```

## API Documentation

API documentation is available at `/api-docs` when running the server.

## User Management API Documentation

### Authentication

#### Register a New User
```http
POST /api/auth/register
```

Request Body:
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
}
```

Response (201 Created):
```json
{
    "token": "jwt_token_here",
    "user": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
    }
}
```

#### Login
```http
POST /api/auth/login
```

Request Body:
```json
{
    "email": "john@example.com",
    "password": "securepassword123"
}
```

Response (200 OK):
```json
{
    "token": "jwt_token_here",
    "user": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
    }
}
```

### User Profile Management

#### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

Response (200 OK):
```json
{
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "profilePicture": "url_to_profile_picture",
    "bio": "User bio",
    "location": "User location",
    "createdAt": "2024-03-20T10:00:00Z"
}
```

#### Update User Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
```

Request Body:
```json
{
    "name": "John Updated",
    "bio": "New bio",
    "location": "New location",
    "profilePicture": "new_profile_picture_url"
}
```

Response (200 OK):
```json
{
    "id": "user_id",
    "name": "John Updated",
    "email": "john@example.com",
    "bio": "New bio",
    "location": "New location",
    "profilePicture": "new_profile_picture_url",
    "updatedAt": "2024-03-20T11:00:00Z"
}
```

#### Change Password
```http
PUT /api/users/change-password
Authorization: Bearer <token>
```

Request Body:
```json
{
    "currentPassword": "currentpassword123",
    "newPassword": "newpassword123"
}
```

Response (200 OK):
```json
{
    "message": "Password updated successfully"
}
```

#### Upload Profile Picture
```http
POST /api/users/profile/picture
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Request Body:
```
profilePicture: (file)
```

Response (200 OK):
```json
{
    "profilePicture": "url_to_uploaded_picture"
}
```

### User Settings

#### Get User Settings
```http
GET /api/users/settings
Authorization: Bearer <token>
```

Response (200 OK):
```json
{
    "notifications": {
        "email": true,
        "push": true,
        "tradeUpdates": true
    },
    "privacy": {
        "showEmail": false,
        "showLocation": true
    },
    "preferences": {
        "language": "en",
        "timezone": "UTC"
    }
}
```

#### Update User Settings
```http
PUT /api/users/settings
Authorization: Bearer <token>
```

Request Body:
```json
{
    "notifications": {
        "email": false,
        "push": true,
        "tradeUpdates": true
    },
    "privacy": {
        "showEmail": true,
        "showLocation": false
    },
    "preferences": {
        "language": "es",
        "timezone": "EST"
    }
}
```

Response (200 OK):
```json
{
    "notifications": {
        "email": false,
        "push": true,
        "tradeUpdates": true
    },
    "privacy": {
        "showEmail": true,
        "showLocation": false
    },
    "preferences": {
        "language": "es",
        "timezone": "EST"
    }
}
```

### Error Responses

All endpoints may return the following error responses:

#### 400 Bad Request
```json
{
    "error": "Validation error",
    "message": "Detailed error message"
}
```

#### 401 Unauthorized
```json
{
    "error": "Unauthorized",
    "message": "Authentication required"
}
```

#### 403 Forbidden
```json
{
    "error": "Forbidden",
    "message": "Insufficient permissions"
}
```

#### 404 Not Found
```json
{
    "error": "Not Found",
    "message": "Resource not found"
}
```

#### 500 Internal Server Error
```json
{
    "error": "Internal Server Error",
    "message": "An unexpected error occurred"
}
```

### Security Notes

1. All endpoints except registration and login require a valid JWT token in the Authorization header
2. Passwords must be at least 8 characters long and contain:
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character
3. JWT tokens expire after 24 hours
4. Rate limiting is applied to all authentication endpoints
5. All passwords are hashed using bcrypt before storage
6. Email verification is required for new accounts

### Best Practices

1. Always use HTTPS in production
2. Store tokens securely (e.g., in HttpOnly cookies)
3. Implement proper error handling
4. Use appropriate HTTP methods for each operation
5. Validate all input data
6. Implement proper logging for security events
7. Regular security audits and updates

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
