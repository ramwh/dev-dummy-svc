# Dev Dummy Service

A robust Node.js + TypeScript + Fastify starter project with MySQL, Redis, and comprehensive tooling for building scalable backend services.

## 🚀 Features

- **Modern Tech Stack**: Node.js 18+, TypeScript 5.2+, Fastify 4.24+
- **Database**: MySQL with primary/replica setup (no ORM, raw SQL)
- **Caching**: Redis integration with error handling and fallbacks
- **Validation**: Joi validation with TypeScript interfaces
- **Logging**: Structured logging with Pino (file + console output)
- **Documentation**: Auto-generated Swagger/OpenAPI documentation
- **Testing**: Jest with comprehensive test setup
- **Code Quality**: ESLint, Prettier, and Husky pre-commit hooks
- **Containerization**: Docker and Docker Compose setup
- **Environment Management**: Config system with environment-based settings
- **Error Handling**: Centralized error handling with custom error classes
- **Health Checks**: Built-in health check endpoints

## 📁 Project Structure

```
src/
├── components/           # Feature-based components
│   └── user/            # User component example
│       ├── controller.ts
│       ├── service.ts
│       ├── routes.ts
│       ├── types.ts
│       ├── validation.ts
│       ├── service.test.ts
│       └── index.ts
├── config/              # Configuration management
│   └── index.ts
├── database/            # Database connection and utilities
│   └── connection.ts
├── cache/               # Redis cache management
│   └── manager.ts
├── utils/               # Utility functions
│   ├── errors.ts        # Custom error classes
│   ├── response.ts      # Response handling
│   └── logger.ts        # Logging utilities
├── types/               # TypeScript type definitions
│   └── config.ts
├── test/                # Test setup and utilities
│   └── setup.ts
└── index.ts             # Application entry point
```

## 🔧 Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Docker and Docker Compose (for containerized setup)

## 🚀 Getting Started

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd dev-dummy-svc
npm install
```

### 2. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Application Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database Configuration (MySQL)
DB_PRIMARY_HOST=localhost
DB_PRIMARY_PORT=3306
DB_PRIMARY_USER=root
DB_PRIMARY_PASSWORD=password
DB_PRIMARY_NAME=dev_dummy_svc

DB_REPLICA_HOST=localhost
DB_REPLICA_PORT=3307
DB_REPLICA_USER=root
DB_REPLICA_PASSWORD=password
DB_REPLICA_NAME=dev_dummy_svc

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_ENABLED=true
LOG_FILE_PATH=./logs/app.log

# Development Settings
SWAGGER_ENABLED=true
PRETTY_LOGS=true
```

### 3. Development Setup (Docker Compose)

Start the development environment with all services:

```bash
# Start all services including development tools
docker-compose --profile dev up -d

# Or start just the core services
docker-compose up -d
```

This will start:
- Application (port 3000)
- MySQL Primary (port 3306)
- MySQL Replica (port 3307)
- Redis (port 6379)
- phpMyAdmin (port 8080) - dev profile only
- Redis Commander (port 8081) - dev profile only

### 4. Local Development (without Docker)

If you prefer to run the application locally:

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev
```

Make sure you have MySQL and Redis running locally and configured in your `.env` file.

## 📚 API Documentation

When running in development mode (`NODE_ENV=development`), Swagger UI is available at:
- http://localhost:3000/docs

The API provides the following endpoints:

### Health Check
- `GET /health` - Application and dependency health status

### Users API
- `POST /api/v1/users` - Create a new user
- `GET /api/v1/users` - Get users with filtering and pagination
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🔍 Code Quality

The project includes comprehensive linting and formatting:

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

Pre-commit hooks will automatically run linting and tests before each commit.

## 🏗️ Building and Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Production Docker Deployment

```bash
# Build and start production containers
docker-compose up -d app mysql-primary mysql-replica redis

# View logs
docker-compose logs -f app

# Scale the application
docker-compose up -d --scale app=3
```

## 📊 Monitoring and Logs

### Logging

The application uses structured logging with Pino:

- **Console Output**: Pretty-printed in development, JSON in production
- **File Output**: Configurable via `LOG_FILE_ENABLED` and `LOG_FILE_PATH`
- **Log Levels**: error, warn, info, debug
- **Contextual Logging**: Each component has its own logger context

Log locations:
- Development: Console (pretty) + `./logs/app.log`
- Production: Console (JSON) + `./logs/app.log`
- Docker: Stdout + mounted volume `./logs/`

### Health Monitoring

The `/health` endpoint provides detailed health information:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2023-01-01T00:00:00.000Z",
    "version": "1.0.0",
    "environment": "development",
    "uptime": 123.456,
    "dependencies": {
      "database": "healthy",
      "redis": "healthy"
    }
  }
}
```

## 🛠️ Development Tools

### Database Management

- **phpMyAdmin**: http://localhost:8080 (dev profile)
- **Direct MySQL Access**: 
  ```bash
  docker-compose exec mysql-primary mysql -u root -p
  ```

### Redis Management

- **Redis Commander**: http://localhost:8081 (dev profile)
- **Direct Redis Access**: 
  ```bash
  docker-compose exec redis redis-cli
  ```

## 🔧 Configuration

The application supports environment-based configuration:

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Server port | `3000` | No |
| `HOST` | Server host | `0.0.0.0` | No |
| `DB_PRIMARY_HOST` | Primary DB host | `localhost` | No |
| `DB_PRIMARY_PORT` | Primary DB port | `3306` | No |
| `DB_PRIMARY_USER` | Primary DB user | `root` | No |
| `DB_PRIMARY_PASSWORD` | Primary DB password | `password` | No |
| `DB_PRIMARY_NAME` | Primary DB name | `dev_dummy_svc` | No |
| `REDIS_HOST` | Redis host | `localhost` | No |
| `REDIS_PORT` | Redis port | `6379` | No |
| `LOG_LEVEL` | Logging level | `info` | No |
| `SWAGGER_ENABLED` | Enable Swagger UI | `true` (dev only) | No |

### Environment Modes

- **development**: Pretty logs, Swagger enabled, debug logging
- **production**: JSON logs, Swagger disabled, optimized performance
- **test**: Minimal logging, test-specific configurations

## 🧩 Extending the Project

### Adding New Components

1. Create a new directory in `src/components/`
2. Follow the user component structure:
   - `types.ts` - TypeScript interfaces
   - `validation.ts` - Joi validation schemas
   - `service.ts` - Business logic
   - `controller.ts` - Request handlers
   - `routes.ts` - Route definitions
   - `*.test.ts` - Unit tests
   - `index.ts` - Export file

3. Register routes in `src/index.ts`

### Database Schema Changes

1. Add migration scripts to `docker/mysql/init/`
2. Update TypeScript interfaces
3. Update service layer methods
4. Add/update tests

### Adding New Dependencies

```bash
# Add runtime dependency
npm install package-name

# Add development dependency
npm install --save-dev package-name
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check if MySQL is running
   docker-compose ps mysql-primary
   
   # View MySQL logs
   docker-compose logs mysql-primary
   ```

2. **Redis Connection Errors**
   ```bash
   # Check if Redis is running
   docker-compose ps redis
   
   # Test Redis connection
   docker-compose exec redis redis-cli ping
   ```

3. **Port Already in Use**
   ```bash
   # Find process using port 3000
   lsof -i :3000
   
   # Change port in .env file
   PORT=3001
   ```

### Debug Mode

Enable debug logging:

```bash
# Set log level to debug
LOG_LEVEL=debug npm run dev

# Enable pretty logs in production
PRETTY_LOGS=true npm start
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and add tests
4. Run tests and linting: `npm test && npm run lint`
5. Commit changes: `git commit -am 'Add my feature'`
6. Push to the branch: `git push origin feature/my-feature`
7. Create a Pull Request

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Review the troubleshooting section above
- Check the application logs for error details