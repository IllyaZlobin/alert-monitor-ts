# Alert Monitor - Telegram Bot

A sophisticated Telegram bot system for real-time alert monitoring and notification delivery, built with NestJS and TypeScript. The system monitors public alert channels, processes messages for location-based matching, and delivers personalized notifications to users.

## 💡 Motivation & Context

### The Problem
Many people disable notifications in air threat alert groups due to information overload, missing critical alerts for their specific locations. This creates a gap between receiving timely, relevant safety information and avoiding notification fatigue.

### The Solution
This project automates the alert filtering process by creating **targeted, location-based notifications**. Instead of receiving all alerts, users only get notifications relevant to their subscribed locations, ensuring they stay informed without being overwhelmed.

### Project Goals
- **Non-commercial Initiative** - Built to demonstrate technical skills and provide genuine value to the community
- **Public Safety Focus** - Helping people stay safe by delivering relevant, timely alert information
- **Open Source Contribution** - Sharing the solution for others to use, improve, or learn from

### Data Source: Aeris Rimor
The system monitors the popular [Aeris Rimor](https://t.me/AerisRimor) Telegram channel, one of Ukraine's most trusted and timely air threat alert sources. 

> **About Aeris Rimor**: An information platform for reporting and processing open-source information related to air threats, including strategic aviation. With over 104,000 subscribers, it's known for reliable and prompt alert notifications.

This channel was chosen as the primary data source due to its:
- **Reliability** - Consistently accurate and timely alerts
- **Popularity** - Large, engaged community of users
- **Quality** - Well-formatted, informative messages
- **Accessibility** - Public channel with open information

## 🚀 Features

### Core Functionality
- **Real-time Alert Monitoring** - Continuously monitors public Telegram channels for alert messages
- **Location-based Filtering** - Users can subscribe to alerts for specific locations/cities
- **Smart Message Processing** - Advanced text processing with PostgreSQL full-text search
- **Bulk Notification System** - Efficient batch processing with Telegram rate limiting
- **Auto-cleanup** - Automatic cleanup of expired messages and data

### Bot Commands
- `/start` - Register and start using the bot
- `/help` - Display comprehensive help information  
- `/add_location <name>` - Subscribe to alerts for a specific location
- `/list_locations` - View and manage your subscribed locations

### Technical Features
- **Queue-based Processing** - BullMQ with Redis for reliable message processing
- **Full-text Search** - PostgreSQL tsvector for efficient location matching
- **Rate Limiting** - Smart batching to respect Telegram API limits
- **Health Monitoring** - Built-in health checks and monitoring endpoints
- **Production Ready** - Docker support with security best practices


## 🏗️ Architecture

### Database Schema

**Users Table**
- User registration and Telegram integration
- Many-to-many relationship with locations

**Locations Table** 
- Location names with full-text search vectors
- Normalized location storage

**Messages Table**
- Scraped alert messages with metadata
- Full-text search capabilities for location matching
- Automatic expiration (1 hour TTL)

## 🛠️ Technology Stack

### Backend Framework
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe JavaScript
- **TypeORM** - Database ORM with migration support

### Database & Caching
- **PostgreSQL 15** - Primary database with full-text search
- **Redis 7** - Queue management and caching

### Telegram Integration
- **nestjs-telegraf** - Telegram Bot API integration
- **Telegraf** - Modern Telegram Bot framework

### Queue System
- **BullMQ** - Redis-based queue for background processing
- **Job scheduling** - Automatic task execution

### Utilities
- **Cheerio** - HTML parsing for message scraping
- **Axios** - HTTP client for web scraping
- **Day.js** - Date/time manipulation with timezone support
- **Lodash** - Utility functions

## 📦 Installation

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd alert-monitor-ts
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Telegram Bot Configuration
   BOT_TOKEN=your_telegram_bot_token
   PUBLIC_ALERT_GROUP_URL=https://t.me/your_alert_channel
   
   # Database Configuration
   DATABASE_HOST=postgres
   DATABASE_PORT=5432
   DATABASE_USERNAME=postgres
   DATABASE_PASSWORD=your_secure_password
   DATABASE_NAME=alert_bot
   
   # Redis Configuration  
   REDIS_URL=redis://redis:6379
   
   # Application Configuration
   APP_PORT=3000
   APP_ENV=production
   PARSE_INTERVAL_SECONDS=30
   ```

3. **Start the services**
   ```bash
   # Development environment
   docker-compose up -d
   
   # Production environment
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Run database migrations**
   ```bash
   npm run typeorm migration:run
   ```

### Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development services**
   ```bash
   docker-compose up -d postgres redis
   ```

3. **Run migrations**
   ```bash
   npm run typeorm -- migration:run --env=local
   ```

4. **Start development server**
   ```bash
   npm run start:dev
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `BOT_TOKEN` | Telegram Bot API token | - | ✅ |
| `PUBLIC_ALERT_GROUP_URL` | Public alert channel URL | - | ✅ |
| `DATABASE_HOST` | PostgreSQL host | localhost | ✅ |
| `DATABASE_PORT` | PostgreSQL port | 5432 | ✅ |
| `DATABASE_USERNAME` | Database username | postgres | ✅ |
| `DATABASE_PASSWORD` | Database password | - | ✅ |
| `DATABASE_NAME` | Database name | alert_bot | ✅ |
| `REDIS_URL` | Redis connection URL | redis://localhost:6379 | ✅ |
| `APP_PORT` | Application port | 3000 | ✅ |
| `APP_ENV` | Environment | local | ✅ |
| `PARSE_INTERVAL_SECONDS` | Scraping interval | 30 | ✅ |


### Queue Configuration

BullMQ queues with Redis:

- **Message Processing Queue**: Handles alert message processing
- **Parsing Scheduler Queue**: Manages periodic scraping tasks
- **Rate Limiting**: Respects Telegram API limits (30 messages/second)
- **Job Retries**: Exponential backoff for failed jobs

## 🚀 Deployment

### Docker Production Deployment

The application includes production-ready Docker configuration:

**Deployment Commands:**
```bash
# Build production image
docker build -t alert-monitor .

# Run with production compose
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Run migrations**
   ```bash
   npm run typeorm migration:run
   ```

3. **Start production server**
   ```bash
   npm run start:prod
   ```

## 📊 System Monitoring

### Health Checks

The application provides health check endpoints:

- **HTTP Health Check**: `GET /api/health`
- **Docker Health Check**: Built-in container health monitoring
- **Database Health**: Connection and migration status
- **Redis Health**: Queue system status

### Logging

Comprehensive logging with different levels:

- **Info**: General operational information
- **Debug**: Detailed debugging information (message filtering, etc.)
- **Warning**: Non-critical issues (blocked users, etc.)
- **Error**: Critical errors with stack traces

### Performance Monitoring

- **Queue Metrics**: Job processing statistics
- **Message Processing**: Processing time tracking
- **Notification Delivery**: Success/failure rates
- **Database Performance**: Query execution time monitoring

## 🔄 Message Processing Flow

1. **Scraping**: Monitor scrapes public alert channel every 30 seconds
2. **Filtering**: Messages longer than 500 characters are filtered out
3. **Storage**: New messages are saved to database with full-text vectors
4. **Queuing**: Messages are queued for background processing
5. **Matching**: System finds location matches using PostgreSQL full-text search
6. **Grouping**: Notifications are grouped by user to avoid duplicates
7. **Delivery**: Batch delivery with rate limiting and error handling
8. **Cleanup**: Old messages are automatically removed after 1 hour

### Development Tools
```bash
# Linting
npm run lint

# Code formatting
npm run format

# Type checking
npm run build
```

### Database Migrations

Creating new migrations:
```bash
npm run typeorm -- migration:create --env local migrations/{migration_name} 
```

Running migrations:
```bash
npm run typeorm -- migration:run --env local
```

Generate migrations:
```bash
npm run typeorm -- migration:generate --env local migrations/{migration_name}
```