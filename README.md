# CodeSense — Code Quality & Complexity Analyzer

CodeSense is a browser-based, multi-language code analysis tool that detects common programming errors, highlights code quality issues, estimates complexity, and provides actionable suggestions to improve readability and efficiency. It now includes **user accounts (login/signup)** with **profile-based history** saved on a local server.

## Features
- **Login/signup required:** users must login or sign up before analyzing code
- **Multi-language analysis:** JavaScript, Python, Java, C++
- **Error & quality detection:** heuristic/static checks for common mistakes, code smells, and basic security risks (e.g. unsafe patterns, hardcoded secrets, weak hash hints, SQL concatenation hints)
- **Complexity estimation:** cyclomatic complexity, nesting depth, function count, duplication/comment metrics, maintainability and health scores
- **Actionable suggestions:** readability and efficiency recommendations based on findings
- **Smart language handling:** auto-detect mode + mismatch warning with options (switch & analyze / analyze as selected)
- **Interactive editor experience:** line numbers, issue markers, click-to-jump from issues to code lines, drag-and-drop/file upload, sample snippets
- **Reports & sharing:** copy summary, export JSON, download HTML report, print view, shareable link
- **Profiles & history:** per-user analysis history saved permanently on the server (`data/db.json`)
- **Duplicate signup prevention:** if an email is already registered, the app prompts the user to login instead of signing up again
- **Productivity extras:** light/dark theme, trailing-space cleanup, issue search and severity filters, updated emerald/teal UI

## Tech Stack
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Analysis engine:** Custom heuristic/rule-based analyzer (client-side)
- **Backend (for auth/profile history):** Node.js built-in `http` server (no external dependencies), JSON file storage

## How to Run

### Run with Login, Analysis & Profile History
1. Open terminal in the `CodeSense` folder.
2. Run:
   ```bash
   node server.js
   ```
3. Open in browser:
   - [http://localhost:3000](http://localhost:3000)
4. **Sign up** (new user) or **Login** (existing user).
   - Login is required before running analysis.
   - After signing up, login with your email and password to continue.
   - If you have already signed up with an email, use **Login** instead of signing up again.
5. Analyze code and view reports. Your analysis history will be saved to your profile on the server (`CodeSense/data/db.json`).

> Note: Opening `index.html` directly without the server will not support login/profile-based analysis. Use the local server flow above.

## Project Structure
```text
CodeSense/
├─ index.html
├─ server.js        # Node server: static files + auth/history APIs
├─ css/
│  └─ style.css
├─ js/
│  ├─ analyzer.js   # analysis, complexity, detection, suggestions
│  └─ app.js        # UI, auth, history sync, reports
├─ data/
│  └─ db.json       # created/used by server (users + profile history)
└─ README.md
```

## Notes
- This project uses **rule-based/static heuristics** for fast, explainable feedback in the browser.
- Profile history is persisted in `data/db.json` on the machine running the server ("permanent" for that environment). For multi-device/cloud persistence, deploy the server with a hosted database.
- Passwords are hashed (scrypt) before storage; this is a local/demo implementation and should be hardened further for production use.
- Core analysis works offline; web fonts may fall back without internet.
