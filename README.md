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

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
