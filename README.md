# Barter Trading System

A modern web application for barter trading, allowing users to exchange goods and services.

## Overview
This project is a barter trading system that allows users to trade items with each other. It includes features for user authentication, item management, trade creation, and more.

## Features

- **User Authentication:** Register, login, and manage user profiles
- **Item Management:** Create, update, and delete items for trade
- **Trade Creation:** Propose trades between users with offered and requested items
- **Trade Status Updates:** Accept or reject trades, which updates the status of the items involved
- **Messaging:** Users can send messages within a trade to communicate
- **Search and Filter:** Advanced search and filtering functionality
- **User Ratings:** Rate and review other users
- **Responsive Design:** Works on all devices

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

### Running the Application

1. Install MongoDB

- **On Windows:**
  - Download the MongoDB Community Server from the [official website](https://www.mongodb.com/try/download/community)
  - Run the installer and follow the setup instructions
  - Start MongoDB:
    ```bash
    net start MongoDB
    ```

- **On MacOS:**
  ```bash
  brew tap mongodb/brew
  brew install mongodb-community
  brew services start mongodb-community
  ```

- **On Ubuntu:**
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

2. Start the development server
```bash
npm run dev
```

### Running Tests

1. Unit Tests
```bash
npm test
```

2. UI Tests
```bash
npm run test:ui
```

3. End-to-End Tests
```bash
npm run test:e2e
```

4. Run Tests Serially (recommended to avoid race conditions)
```bash
npm test -- --runInBand
```

### Troubleshooting

#### MongoDB Connection Issues
1. Check MongoDB status:
```bash
mongo --eval 'db.runCommand({ connectionStatus: 1 })'
```

2. Verify MongoDB is running:
```bash
# On Windows
net start MongoDB

# On MacOS
brew services list | grep mongodb

# On Ubuntu
sudo systemctl status mongod
```

## API Documentation

API documentation is available at `/api-docs` when running the server.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
