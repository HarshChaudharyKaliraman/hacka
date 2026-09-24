# 🛡️ Autonomous API Fuzzing Generator

A MERN stack tool that automatically generates synthetic test cases for API validation testing and anomaly detection.

---

## 📁 Project Structure

```
hacka/
├── server/                   ← Express + Node.js backend
│   ├── server.js             ← Main entry point
│   ├── .env                  ← Your environment variables (update this!)
│   ├── .env.example          ← Template for .env
│   ├── config/
│   │   └── db.js             ← MongoDB Atlas connection
│   ├── models/
│   │   └── TestRun.js        ← Mongoose schema for test runs
│   ├── routes/
│   │   ├── testRoutes.js     ← /api/tests/* and /api/test-runs routes
│   │   └── demoRoutes.js     ← /api/products (local demo API)
│   ├── controllers/
│   │   └── testController.js ← Request handlers
│   └── services/
│       ├── testGenerator.js  ← Synthetic test case generator
│       ├── testRunner.js     ← HTTP request executor
│       └── resultAnalyzer.js ← Result classification
│
└── client/                   ← React + Vite frontend
    ├── index.html
    ├── vite.config.js        ← Proxy config
    └── src/
        ├── main.jsx
        ├── App.jsx           ← Main app + state management
        ├── index.css         ← All styles
        └── components/
            ├── ApiConfig.jsx       ← API config form
            ├── TestCaseList.jsx    ← Generated test cases table
            ├── ResultsDashboard.jsx← Results + findings
            └── PreviousRuns.jsx    ← History from MongoDB
```

---

## ⚙️ MongoDB Atlas Setup

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and create a free account.
2. Create a **new project** and a **free M0 cluster**.
3. In **Database Access**, create a database user with a username and password.
4. In **Network Access**, add your IP address (or `0.0.0.0/0` for all IPs during hackathon).
5. Click **Connect** → **Connect your application** → copy the connection string.
6. Open `server/.env` and replace the `MONGO_URI` line:
   ```
   MONGO_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/api-fuzzer?retryWrites=true&w=majority
   ```

---

## 🚀 Installation & Running

### Step 1: Install backend dependencies
```bash
cd server
npm install
```

### Step 2: Configure environment variables
```bash
# Edit server/.env and set your real MONGO_URI
```

### Step 3: Start the backend
```bash
cd server
npm run dev
```
> Backend runs on http://localhost:5000

### Step 4: Install frontend dependencies (separate terminal)
```bash
cd client
npm install
```

### Step 5: Start the frontend
```bash
cd client
npm run dev
```
> Frontend runs on http://localhost:5173

---

## 🎯 Demo Flow (for Hackathon Judges)

1. Open **http://localhost:5173** in your browser.
2. The default URL is already set to `http://localhost:5000/api/products`.
3. Method is **POST**, and a sample JSON body is pre-filled.
4. Click **⚡ Generate Test Cases** — the backend creates ~15 synthetic cases.
5. Review the cases in the **Generated Test Cases** table.
6. Click **▶ Run Tests** — all cases are sent to the demo API.
7. Watch the **Results Dashboard** show Passed/Failed/Unexpected counts.
8. Check the **Findings** section for flagged issues (like the 500 error on price=99999).
9. Scroll down to **Previous Test Runs** to see the saved run in MongoDB.

### 🧪 Demo Anomaly to Highlight
The demo API returns **500 Internal Server Error** when `price = 99999`.
This demonstrates anomaly detection — the fuzzing tool flags it as **UNEXPECTED**.

---

## 🧪 API Testing with Postman / curl

### Test the demo API directly:
```bash
# Valid product
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Laptop", "price": 45000, "quantity": 2}'

# Missing name (should return 400)
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{"price": 45000, "quantity": 2}'

# Trigger demo anomaly (returns 500)
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "price": 99999, "quantity": 1}'
```

### Generate test cases:
```bash
curl -X POST http://localhost:5000/api/tests/generate \
  -H "Content-Type: application/json" \
  -d '{"method": "POST", "requestBody": {"name": "Laptop", "price": 45000, "quantity": 2}}'
```

### Get all test runs:
```bash
curl http://localhost:5000/api/test-runs
```

---

## 📊 Data Flow Explained (Beginner-Friendly)

```
[User types JSON in browser]
        ↓
[React App.jsx calls POST /api/tests/generate]
        ↓
[testController.js receives the request]
        ↓
[testGenerator.js creates ~15 mutated test cases]
        ↓
[Test cases returned to React, displayed in table]
        ↓
[User clicks Run Tests]
        ↓
[React calls POST /api/tests/run with test cases]
        ↓
[testRunner.js sends each case to the demo API]
        ↓
[Demo API (demoRoutes.js) validates and responds]
        ↓
[resultAnalyzer.js classifies each result]
        ↓
[TestRun saved to MongoDB Atlas]
        ↓
[Results returned to React, displayed in dashboard]
```

---

## ✅ Implemented Features

- [x] JSON body parsing and field-by-field mutation
- [x] 10–15 synthetic test case types (missing field, null, wrong type, boundary, etc.)
- [x] HTTP test runner with Axios (timeout, error handling)
- [x] PASSED / FAILED / ERROR / UNEXPECTED classification
- [x] Findings / anomaly section
- [x] MongoDB Atlas persistence (TestRun model)
- [x] Previous runs history
- [x] Local demo API with intentional 500-error anomaly
- [x] URL and JSON body validation
- [x] Loading states and error messages

---

## ⚠️ Limitations & Future Improvements

- Currently supports simple flat JSON objects (not deeply nested or array bodies)
- Test cases are rule-based, not AI-driven
- No authentication support
- No concurrent request mode (sequential only)
- Cannot save individual test cases as reusable templates
- Future: add support for custom headers, auth tokens, and file uploads
