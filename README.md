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
- RESTful API architecture

### Testing
- Unit Testing: Jest
- UI Testing: Cypress
- End-to-End Testing: Cypress

## Project Structure

```
barter-trading-system/
├── config/             # Configuration files
├── controllers/        # Route controllers
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

3. Set up environment variables
```bash
cp .env.example .env
```

4. Start the development server
```bash
npm run dev
```

5. Run tests
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