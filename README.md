# Dispatch — AI Email Generator

A lightweight tool that turns a few form fields (recipient, tone, purpose, key points) into a ready-to-send email draft, powered by Google's Gemini API. No frameworks, no build tools — plain HTML/CSS/JS on the frontend, plain Node.js + Express on the backend.

## Features

- **Form-to-draft generation** — fill in recipient, tone, purpose, and key points; get back a subject line + email body
- **System prompt / user prompt separation** — the AI's fixed rules (never invent facts, match the requested tone, stay concise) are kept completely separate from the user's input, so form data can't override the AI's core behavior
- **Truncation protection** — explicitly checks Gemini's `finishReason` for `MAX_TOKENS` so a cut-off draft is never silently shown as complete
- **Centralized error handling** — every error flows through a single `errorHandler.js` middleware for one consistent response format
- **Request logging** — every incoming request is logged to the terminal for easy debugging
- **Copy to clipboard** — one-click copy of the finished draft

## Tech Stack

- Node.js + Express 5
- Google Gemini API (`gemini-3.6-flash`, called via REST)
- Vanilla HTML, CSS, JavaScript (no frontend framework)
- `cors`, `dotenv`

## Prerequisites

- Node.js (v18 or newer)
- A free Gemini API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

## Project Structure

```
dispatch/
├── .env.example              # template for your API key
├── package.json
│
├── server/
│   ├── server.js              # entry point — wires middleware, routes, error handler
│   ├── systemPrompt.js        # the AI's fixed instructions (system prompt)
│   ├── routes/
│   │   └── emailRoutes.js     # maps POST /api/generate-email → controller
│   ├── controllers/
│   │   └── emailController.js # validates input, builds prompts, calls Gemini
│   └── middleware/
│       ├── logger.js          # logs every incoming request
│       └── errorHandler.js    # single place that formats all error responses
│
└── public/
    ├── index.html              # form + letter display UI
    ├── style.css                # "writing desk" theme
    └── script.js                # form submission + fetch to backend
```

## Installation & Setup

**1. Clone the repo**
```bash
git clone <your-repo-url>
cd dispatch
```

**2. Install dependencies**
```bash
npm install
```

**3. Add your API key**

Copy the example env file:
```bash
cp .env.example .env
```

Open `.env` and paste your key:
```
GEMINI_API_KEY=your_actual_key_here
PORT=3000
```

## Running the App

```bash
npm start
```

You should see:
```
✉️  Email Generator running at: http://localhost:3000
```

Open `http://localhost:3000` in your browser.

## API Endpoints

| Method | Endpoint                | Description                                              |
|--------|---------------------------|------------------------------------------------------------|
| POST   | `/api/generate-email`     | Generates an email draft from `tone`, `recipientName`, `recipientRole`, `intent`, `keyPoints`, `senderName` |

## Troubleshooting

- **"No Gemini API key found"** — check your `.env` has the key pasted correctly, with no extra spaces, and restart the server after adding it.
- **Nothing happens when you click the button** — open DevTools (F12) → Console tab and check for errors.
- **404 "model not found"** — Google occasionally retires older Gemini model versions. Check the current model list at [ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models) and update `MODEL_NAME` in `emailController.js`.

## Author

Built by Turrab as part of an AI internship project.
