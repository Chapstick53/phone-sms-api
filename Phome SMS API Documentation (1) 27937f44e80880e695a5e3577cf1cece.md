# Phome SMS API Documentation (1)

## Overview

The Phone SMS API is a robust Node.js application that provides programmatic access to virtual phone numbers and their received SMS messages. The system scrapes data from [SMS24.me](http://sms24.me/), a free SMS reception service, and exposes it through a RESTful API with rate limiting and error handling.

## Project Structure

```
phone-sms-api/
├── chrome-sms24/                 # Chrome browser instance data
├── cookies/
│   ├── sms24.json               # Authentication cookies for SMS24.me
├── debug.html                   # Sample HTML structure for debugging
├── package-lock.json            # Dependency lock file
├── package.json                 # Project configuration and dependencies
├── scripts/
│   ├── test-messages.js         # Script to test message retrieval
│   ├── test-numbers.js          # Script to test number scraping
├── server.js                    # Main Express server application
├── src/
│   ├── providers/
│   │   ├── sms24.js             # SMS24.me scraping provider
│   ├── utils/
│   │   ├── http.js              # HTTP request utilities
│   │   ├── normalize.js         # Data normalization functions
│   │   ├── simple.js            # Simple utility functions

```

## Technology Stack

### Core Dependencies

- **Express.js** (v5.1.0) - Web application framework
- **Puppeteer** (v24.22.2) - Headless browser automation for web scraping
- **Puppeteer Extra** (v3.3.6) - Enhanced Puppeteer with plugin support
- **Puppeteer Stealth Plugin** (v2.11.2) - Avoids detection as a bot
- **CORS** (v2.8.5) - Cross-Origin Resource Sharing middleware
- **Express Rate Limit** (v8.1.0) - Rate limiting middleware
- **Cheerio** (v1.1.2) - Server-side jQuery implementation for HTML parsing
- **Node Fetch** (v2.7.0) - HTTP request library

### Development Dependencies

- **Nodemon** (v3.1.10) - Auto-restart development server

## API Endpoints

### 1. Health Check

**Endpoint:** `GET /api/health`

**Description:** Verifies that the API is running correctly.

**Response:**

```json
{
  "ok": true
}

```

### 2. Get All Available Numbers

**Endpoint:** `GET /api/numbers`

**Description:** Retrieves a list of all available virtual phone numbers from [SMS24.me](http://sms24.me/).

**Response:**

```json
{
  "provider": "sms24",
  "count": 15,
  "numbers": [
    {
      "phone": "+12746497285",
      "country": "United States",
      "url": "/en/numbers/12746497285"
    }
  ]
}

```

### 3. Get Messages for a Number

**Endpoint:** `GET /api/numbers/:id/messages`

**Parameters:**

- `id` (path parameter): Phone number without country code (e.g., `12746497285`)

**Description:** Retrieves all SMS messages received by a specific phone number.

**Response:**

```json
{
  "phone": "+12746497285",
  "count": 10,
  "messages": [
    {
      "time": "18 minutes ago",
      "from": "139邮箱",
      "content": "【139邮箱】验证码：1255，请在15分钟内完成验证...",
      "otp": "1255",
      "timestamp": "2025-09-25T09:34:11.000Z"
    }
  ]
}

```

### 4. Get Latest OTP

**Endpoint:** `GET /api/numbers/:id/otp`

**Parameters:**

- `id` (path parameter): Phone number without country code

**Description:** Retrieves the most recent OTP (One-Time Password) from messages for a specific number.

**Response:**

```json
{
  "phone": "+12746497285",
  "otp": "1255",
  "from": "139邮箱",
  "time": "18 minutes ago"
}

```

**No OTP Found Response:**

```json
{
  "phone": "+12746497285",
  "otp": null,
  "message": "No OTP found"
}

```

### 5. API Status

**Endpoint:** `GET /api/status`

**Description:** Provides overall API status and statistics.

**Response:**

```json
{
  "ok": true,
  "provider": "sms24",
  "available_numbers": 15,
  "timestamp": "2025-09-25T10:00:00.000Z"
}

```

## Error Handling

The API uses consistent error responses:

### Rate Limit Exceeded

```json
{
  "error": "Too many requests, slow down."
}

```

### Upstream Service Failure

```json
{
  "error": "upstream_failed",
  "message": "Detailed error message"
}

```

## Rate Limiting

The API implements rate limiting with the following configuration:

- **Window:** 10 seconds
- **Maximum Requests:** 25 requests per window
- **Headers:** Standard rate limit headers

## Scraping Mechanism

### How It Works

1. **Browser Automation:** Uses Puppeteer with stealth plugin to avoid detection
2. **Cookie Management:** Persists authentication cookies in `cookies/sms24.json`
3. **HTML Parsing:** Uses Cheerio to extract data from [SMS24.me](http://sms24.me/) pages
4. **Data Normalization:** Processes and structures the scraped data

### Key Features

- **Stealth Mode:** Mimics human browsing behavior to avoid blocking
- **Cookie Persistence:** Maintains session across restarts
- **Error Recovery:** Handles network issues and site changes gracefully
- **Data Extraction:** Parses message content, timestamps, and sender information
- **OTP Detection:** Automatically identifies and extracts verification codes

## Setup and Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation Steps

1. **Clone the repository**
    
    ```bash
    git clone <repository-url>
    cd phone-sms-api
    
    ```
    
2. **Install dependencies**
    
    ```bash
    npm install
    
    ```
    
3. **Configure environment (optional)**
    
    ```bash
    export PORT=4000  # Default is 4000
    
    ```
    
4. **Start the server**
    
    ```bash
    # Production
    npm start
    
    # Development (with auto-restart)
    npx nodemon server.js
    
    ```
    

### Testing Scripts

The project includes utility scripts for testing:

```bash
# Test number scraping
npm run scrape:numbers

# Test message retrieval
npm run scrape:messages

```

## Usage Examples

### JavaScript Client

```jsx
// Get all available numbers
const response = await fetch('<http://localhost:4000/api/numbers>');
const data = await response.json();

// Get messages for a specific number
const messages = await fetch('<http://localhost:4000/api/numbers/12746497285/messages>');

// Get latest OTP
const otp = await fetch('<http://localhost:4000/api/numbers/12746497285/otp>');

```

### cURL Examples

```bash
# Health check
curl <http://localhost:4000/api/health>

# Get numbers
curl <http://localhost:4000/api/numbers>

# Get messages
curl <http://localhost:4000/api/numbers/12746497285/messages>

# Get OTP
curl <http://localhost:4000/api/numbers/12746497285/otp>

```

## Data Flow

1. **Client Request** → API Endpoint
2. **Rate Limit Check** → Allow/Deny based on IP
3. **Provider Call** → [SMS24.me](http://sms24.me/) scraping function
4. **Web Scraping** → Puppeteer fetches and parses data
5. **Data Processing** → Normalize and structure response
6. **API Response** → JSON data to client

## Security Features

- **Rate Limiting:** Prevents abuse and ensures fair usage
- **CORS Enabled:** Configurable cross-origin requests
- **Input Validation:** Sanitizes phone number parameters
- **Error Masking:** Generic error messages to avoid information leakage

## Monitoring and Maintenance

### Health Indicators

- API health endpoint for monitoring
- Error logging for troubleshooting
- Rate limit tracking

### Performance Considerations

- Efficient HTML parsing with Cheerio
- Browser instance management
- Cookie persistence for reduced authentication overhead

## Troubleshooting

### Common Issues

1. **Rate Limit Errors:** Wait 10 seconds between batches of requests
2. **Upstream Failures:** [SMS24.me](http://sms24.me/) may be down or changed their structure
3. **No Messages:** Number may not have received any messages yet
4. **Authentication Issues:** Clear cookies and re-authenticate if needed

### Debugging Tools

- Use `debug.html` to analyze page structure changes
- Check browser automation with Chrome devtools
- Monitor network requests for failures

## Future Enhancements

Potential improvements for the API:

- Multiple provider support
- Webhook notifications for new messages
- Database persistence for messages
- Advanced filtering and search
- Real-time updates via WebSockets
- Docker containerization
- API key authentication

This documentation provides a comprehensive overview of the Phone SMS API system, its architecture, usage, and maintenance procedures.