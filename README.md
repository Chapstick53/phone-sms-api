# Phone SMS API - Quick Setup Guide

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### 1. Clone & Install
```bash
# Clone the repository
git clone <your-repo-url>
cd phone-sms-api

# Install dependencies
npm install
```

### 2. Start the API
```bash
# Development mode (auto-restart)
npm run dev

# Production mode
npm start
```

✅ API will run on: [http://localhost:4000](http://localhost:4000)

---

## 📡 API Endpoints

| Method | Endpoint                           | Description                 |
|--------|------------------------------------|-----------------------------|
| GET    | /api/health                        | Check API status            |
| GET    | /api/numbers                       | Get all available numbers   |
| GET    | /api/numbers/:id/messages          | Get messages for a number   |
| GET    | /api/numbers/:id/otp               | Get latest OTP code         |
| GET    | /api/countries                     | List available countries    |
| GET    | /api/status                        | API statistics              |

---

## 🛠️ Quick Usage Examples

### Command Line (CLI)
```bash
# Interactive mode
npx ./cli.js interactive

# Get all numbers
npx ./cli.js numbers

# Get messages for a number
npx ./cli.js messages --id 12746497285

# Get OTP
npx ./cli.js otp --id 12746497285
```

### cURL Examples
```bash
# Health check
curl http://localhost:4000/api/health

# Get numbers
curl http://localhost:4000/api/numbers

# Get messages
curl http://localhost:4000/api/numbers/12746497285/messages

# Get OTP
curl http://localhost:4000/api/numbers/12746497285/otp
```

### JavaScript Usage
```javascript
// Get all numbers
const numbers = await fetch('http://localhost:4000/api/numbers').then(r => r.json());

// Get messages
const messages = await fetch('http://localhost:4000/api/numbers/12746497285/messages');

// Get OTP
const otp = await fetch('http://localhost:4000/api/numbers/12746497285/otp');
```

---

## ⚙️ Environment Configuration

Optional environment variables:
```bash
export PORT=4000                    # Change port (default: 4000)
export SMS_API=http://your-api-url  # Custom API base URL
```

---

## 📋 Testing Scripts
```bash
# Test number scraping
npm run scrape:numbers

# Test message retrieval  
npm run scrape:messages
```

---

## 🔧 Troubleshooting

### Port already in use
```bash
# Kill process using port 4000
npx kill-port 4000

# Or change port
export PORT=4001 && npm start
```

### Dependencies issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Rate limiting
- Wait 10 seconds between request batches  
- Maximum 25 requests per 10 seconds  

### No messages showing
- Numbers rotate frequently – try different numbers  
- Some numbers may not have received messages yet  

---

## 📁 Project Structure
```
phone-sms-api/
├── cli.js                 # Command line interface
├── server.js              # Main API server
├── src/providers/sms24.js # SMS24.me scraper
├── cookies/sms24.json     # Authentication data
└── scripts/               # Testing utilities
```

---

## 🎯 Quick Start Checklist
- Node.js 18+ installed  
- npm install completed  
- API running on port 4000  
- Test with `curl http://localhost:4000/api/health`  
- Try CLI with `npx ./cli.js interactive`  

---

## ⚡ Performance Notes
- Cache: Numbers cached for 30 seconds  
- Rate Limit: 25 requests/10 seconds per IP  
- Auto-retry: Built-in error handling for failed requests  

---

## 🔒 Security Features
- CORS enabled  
- Rate limiting  
- Input validation  
- Error message sanitization  
