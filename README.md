# Dispatch: AI Email Generator

A simple tool that turns a few form fields (recipient, tone, purpose, key points)
into a ready-to-send email draft, using Google's Gemini AI.

Built with plain **HTML/CSS/JavaScript** on the frontend and **Node.js + Express**
on the backend — no frameworks, no build tools, nothing to compile.

---

## 1. Running it for the first time

**You need:** [Node.js](https://nodejs.org) installed (version 18 or newer), and a
free Gemini API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

**Step 1 — Install dependencies**

Open a terminal in the project folder and run:

```
npm install
```

This downloads the 3 small libraries the backend needs (Express, dotenv, cors).

**Step 2 — Add your API key**

There's a file called `.env.example` in the project. Make a copy of it named `.env`:

```
cp .env.example .env
```

(On Windows, just duplicate the file in File Explorer and rename it to `.env`)

Open `.env` in any text editor and paste your Gemini API key:

```
GEMINI_API_KEY=your_actual_key_here
```

**Step 3 — Start the server**

```
npm start
```

You should see:

```
✉️  Email Generator running at: http://localhost:3000
```

**Step 4 — Open it in your browser**

Go to **http://localhost:3000** — the app should load.

---

## 2. Running it again later

Every time after the first setup, you only need:

```
npm start
```

(You only need `npm install` again if you delete the `node_modules` folder, and
you only need to touch `.env` again if your API key changes.)

---

## 3. File structure — what each file does

```
ai-email-generator/
│
├── .env                  ← your secret API key lives here (you create this, never share it)
├── .env.example          ← a template showing what .env should look like
├── package.json          ← lists the project's dependencies and the "npm start" command
│
├── server/
│   ├── server.js               ← entry point: wires everything together (middleware, routes, error handler)
│   ├── systemPrompt.js         ← the AI's fixed instructions (the "system prompt")
│   │
│   ├── routes/
│   │   └── emailRoutes.js      ← defines which URL triggers which controller function
│   │
│   ├── controllers/
│   │   └── emailController.js  ← the actual logic: builds prompts, calls Gemini, sends response
│   │
│   └── middleware/
│       ├── logger.js           ← logs every incoming request to the terminal
│       └── errorHandler.js     ← one central place that formats all error responses
│
└── public/               ← everything the browser actually loads
    ├── index.html        ← the page structure (the form + the letter display)
    ├── style.css          ← all the visual styling (the "writing desk" theme)
    └── script.js          ← handles form submission and talks to the backend
```

---

## 4. How the code works, step by step

### The big picture

```
[ Your browser ]  --(1) fills form, clicks button-->  [ script.js ]
       ^                                                    |
       |                                          (2) sends form data as JSON
       |                                                    v
       |                                          [ server.js  (POST /api/generate-email) ]
       |                                                    |
       |                                    (3) combines system prompt + user data
       |                                                    v
       |                                          [ Gemini API ]
       |                                                    |
       |                                    (4) returns generated email text
       |                                                    v
       |<--(5) sends the draft back as JSON----- [ server.js ]
       |
(6) script.js displays it in the "letter" panel
```

### Backend walkthrough — how a request flows through the pieces

The backend used to be one big file. It's now split the way most real
Express projects are organized, so each file has exactly one job:

```
request comes in
      │
      v
[ server.js ]  ─── just wires everything below together, in order
      │
      v
[ middleware/logger.js ]      ─── prints "[time] METHOD /path" to the terminal
      │
      v
[ routes/emailRoutes.js ]     ─── sees POST /api/generate-email, calls the controller
      │
      v
[ controllers/emailController.js ] ─── the real logic:
      │                                 - reads form data
      │                                 - validates it
      │                                 - builds system + user prompts
      │                                 - calls Gemini
      │                                 - sends back the draft
      │
      v (only if something throws or calls next(err))
[ middleware/errorHandler.js ] ─── catches it, sends one consistent error format
```

**server.js** — the entry point. It doesn't contain any "email generating"
logic at all anymore. It just does `app.use(...)` for each middleware and
route, in the order they should run. Order matters: `errorHandler` is always
added last, because Express only treats it as an error handler once every
normal route has had a chance to run first.

**middleware/logger.js** — a small function that runs on *every* request,
before it reaches any route. It logs the method and URL, then calls `next()`
to let the request continue. This is a real example of what "middleware"
means in Express: something that sits in between the request arriving and
the response being sent.

**middleware/errorHandler.js** — instead of every route writing its own
`try/catch` and its own `res.status(500).json(...)`, routes can just call
`next(error)` and this file becomes the *one* place that decides how errors
look to the user. Express recognizes this as an error handler specifically
because it takes 4 arguments: `(err, req, res, next)`.

**routes/emailRoutes.js** — a short file that only maps URLs to functions:
"if someone POSTs to `/generate-email`, call `generateEmail` from the
controller." It doesn't know *how* that function works, only that it exists.

**controllers/emailController.js** — this is where `server.js`'s old logic
moved to. It reads `req.body`, validates it, builds the system prompt and
user prompt, calls the Gemini API, and either sends back `res.json(...)` on
success or calls `next(error)` on failure so `errorHandler.js` can take over.

### System prompt vs. user prompt (the core concept of this project)

This is the most important part to understand, and it lives entirely
inside `controllers/emailController.js`:

- **System prompt** (`server/systemPrompt.js`) — This is a fixed set of rules
  that never changes, no matter what the user types. It tells the AI things like
  "only output the email, don't add extra commentary" and "never make up facts
  that weren't given to you." It's kept in its own file on purpose, so it's easy
  to see it's completely separate from user input.

- **User prompt** (built inside `emailController.js`) — This is built fresh
  on every request, using whatever the person typed into the form (recipient
  name, tone, purpose, key points). It changes every time.

When we call Gemini, we send these as two separate pieces:
`system_instruction` (the rules) and `contents` (the actual user request).
This separation matters because it stops the user's input from being able to
override the AI's core behavior — the rules always apply on top of whatever
the user asks for.

### Frontend walkthrough (`public/script.js`)

1. Listens for clicks on the tone buttons (Formal, Friendly, etc.) and remembers
   which one is selected.
2. Listens for the form being submitted:
   - Stops the page from doing a normal refresh
   - Collects all the field values into one object
   - Shows a "Drafting your letter…" loading state
   - Sends the data to `/api/generate-email` using `fetch`
   - Once it gets a response, splits it into a subject line and a body
   - Displays it in the letter panel on the right
3. Also handles the "Copy" button, which copies the subject + body to your clipboard.

### Styling (`public/style.css`)

The whole page is themed like a **writing desk**: paper background, navy ink,
a brick-red wax-stamp accent, and the output styled like an actual folded letter
with a postmark that stamps in once your draft is ready. All colors and fonts
are defined once at the top of the file under `:root`, so they're easy to change
later if you want a different look.

---

## 5. If something goes wrong

- **"No Gemini API key found"** — check your `.env` file has the key pasted in
  correctly, with no extra spaces, and that you restarted the server after adding it.
- **Page loads but nothing happens when you click the button** — open your
  browser's DevTools (F12) → Console tab, and check for red error messages.
- **"npm: command not found"** — Node.js isn't installed yet. Install it from
  nodejs.org first.

## Author
 
Built by Turrab as part of an AI internship project.