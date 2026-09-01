# LaunchLens — AI Startup Idea Validator

LaunchLens is a web application for student founders and young entrepreneurs to validate startup ideas. Instead of generic encouragement, it runs your idea through a **3-pass AI debate pipeline (Optimist → Skeptic → Synthesizer)** using Google's Gemini API to deliver structured, honest, and actionable feedback in under 2 minutes.

---

## Features

- **Landing page** — product overview and how the validation flow works
- **Auth** — sign up or log in with PBKDF2-hashed passwords, client-side rate limiting
- **Idea submission** — 4-question form with live loading progress tied to each AI pass
- **Results report** — scorecard (5 dimensions), Devil's Advocate critiques, and a 4-week validation roadmap
- **Dashboard** — view and reopen your saved analyses
- **Shareable links** — copy a URL to share a full report with mentors or classmates

---

## Security

This application has been hardened against common client-side vulnerabilities:

| Measure | Details |
|---------|---------|
| **Password hashing** | PBKDF2 with SHA-256, 100K iterations, per-user random salt via Web Crypto API |
| **Rate limiting** | 5 failed login attempts triggers a 5-minute cooldown |
| **Route protection** | All authenticated routes guarded; `/results/:id` requires login |
| **ID generation** | `crypto.randomUUID()` instead of `Math.random()` |
| **Input sanitization** | User input stripped of backticks/newlines before AI prompts |
| **Prototype pollution guards** | URL-decoded data sanitized to strip `__proto__`, `constructor`, `prototype` |
| **Content Security Policy** | Strict CSP with `script-src 'self'`, `base-uri`, `form-action` |
| **Error sanitization** | API errors and internal details never leaked to the client |
| **No data in console logs** | All `console.error`/`console.warn` calls that logged untrusted data removed |
| **Uniform auth errors** | Login and signup return identical error messages to prevent account enumeration |
| **HTTPS warning** | Production builds warn if served over HTTP (non-localhost) |

### Known Architectural Limitations

These require a backend server to fully resolve:

- **API key in client bundle** — Vite inlines `VITE_*` env vars into JavaScript. A backend proxy is needed to keep the Gemini key server-side.
- **Client-only auth** — All authentication is localStorage-based. No server sessions or CSRF protection exist yet.
- **Client-side rate limiting** — Can be bypassed via DevTools. Server-side enforcement is needed for production.

---

## Required Software

1. **Node.js (LTS recommended)**
   - Download: [https://nodejs.org/](https://nodejs.org/)
   - Verify: `node -v` and `npm -v`

2. **Git** (optional but recommended)
   - Download: [https://git-scm.com/](https://git-scm.com/)

---

## Installation & Setup

1. **Clone or download** this repository to your machine.

2. **Install dependencies** from the `launchlens-app` directory:

   ```bash
   cd launchlens-app
   npm install
   ```

3. **Configure the Gemini API key (optional)**

   For live AI analysis, create a `.env` file in `launchlens-app/` (you can copy from `.env.example`):

   ```bash
   cp .env.example .env
   ```

   Then add your key from [Google AI Studio](https://aistudio.google.com/apikey):

   ```env
   VITE_GEMINI_KEY=your-gemini-api-key-here
   ```

   - `.env` is listed in `.gitignore` — do not commit your API key.
   - Restart the dev server after creating or changing `.env`.
   - **Mock mode:** If no API key is set, the app still works. It simulates the 3-pass pipeline with staged delays and returns realistic mock scores, critiques, and a roadmap.

---

## Running the Application

From the `launchlens-app` folder:

```bash
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173/`).

### Quick start flow

1. Open the landing page and click **Validate My Idea — Free**
2. **Sign up** for a free account (takes ~30 seconds)
3. Fill in the 4-question form and click **Analyse My Idea**
4. Watch the loading bar advance through Optimist → Skeptic → Synthesizer
5. Review your scorecard, critiques, and 4-week plan on the results page
6. Find past analyses anytime on **Dashboard**

---

## Building for Production

```bash
npm run build
```

The production bundle is output to `launchlens-app/dist`. Deploy that folder to Netlify, Vercel, or any static host.

For production deployments with live AI, set `VITE_GEMINI_KEY` in your hosting provider's environment variables (not in source control).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + TypeScript |
| Routing | React Router v7 |
| Icons | Lucide React |
| AI | Google Gemini API (`gemini-2.5-flash`) — 3 sequential calls per analysis |
| Storage | localStorage (ideas + demo auth) |
| Security | PBKDF2 hashing, CSP headers, input sanitization |
| Styling | Custom CSS (pastel design system) |

---

## Project Structure

```
launchlens-app/
├── src/
│   ├── pages/          # Landing, Auth, Submit, Results, Dashboard
│   ├── components/     # Navbar, Footer
│   ├── context/        # AuthContext (PBKDF2 hashing, rate limiting)
│   ├── services/       # ai.ts (Gemini pipeline), storage.ts (UUID generation)
│   └── utils/          # encoding.ts (UTF-8 base64 helpers)
├── .env.example        # Template for API key setup
└── package.json
```

---

## Security Audit

A full security audit was conducted across all source files. See the Security section above for mitigations applied. Two architectural items (API key proxy, server-side auth) require a backend implementation and are tracked as known limitations.
