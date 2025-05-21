# Barter Trading System

## Overview
This project is a barter trading system that allows users to trade items with each other. It includes features for user authentication, item management, trade creation, and more.

## Features
- **User Authentication:** Register, login, and manage user profiles.
- **Item Management:** Create, update, and delete items for trade.
- **Trade Creation:** Propose trades between users with offered and requested items.
- **Trade Status Updates:** Accept or reject trades, which updates the status of the items involved.
- **Messaging:** Users can send messages within a trade to communicate.

## Testing
The project includes comprehensive tests to ensure functionality and reliability.

### Running Tests
To run the tests, use the following command:
```bash
npm test
```

To run the tests serially (recommended to avoid race conditions), use:
```bash
npm test -- --runInBand
```



## Technologies Used
- **Node.js:** Backend runtime environment.
- **Express.js:** Web framework for building the API.
- **MongoDB:** Database for storing user and item data.
- **Mongoose:** ODM for MongoDB.
- **Jest:** Testing framework for unit and integration tests.
- **Cypress:** End-to-end testing framework.

## Getting Started
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables (e.g., `MONGODB_URI`).
4. Run the application:
   ```bash
   npm run dev
   ```
5. Run the tests:
   ```bash
   npm test
   ```

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License.
