# Project Guidelines & Agent Instructions

This file documents the workspace specifications, setup commands, and developer policies for this repository to guide AI coding assistants in future sessions.

---

## 🚀 Build, Run, & Test Commands

- **Environment Setup:**
  ```bash
  python3 -m venv .venv
  source .venv/bin/activate
  pip install flask requests
  ```
- **Run Development Server:**
  ```bash
  .venv/bin/python3 app.py
  ```
- **Local Address:** `http://127.0.0.1:5001`

---

## 🛠️ Project Structure

- `app.py` — Flask server & Atom XML feed parser (includes caching)
- `templates/index.html` — Main UI with search, pills, and the Tweet composer modal
- `static/css/style.css` — Dark space styling system
- `static/js/main.js` — Client-side state filtering, copy helpers, and CSV export
- `.gitignore` — Ignores local caches and Python virtual environments

---

## 📋 Developer Policies & Rules

> [!IMPORTANT]
> **Implementation Plans for New Features:**
> Before starting the implementation of **any new feature** (whether minor or major), the agent MUST first create a detailed implementation plan in `plan.md` and request the user's explicit review and approval. Do not write or modify project files for new features until approval is granted.

> [!IMPORTANT]
> **Testing & GitHub Push Approval:**
> Once a new feature is implemented, the agent must ensure it is thoroughly tested locally. The agent is **not allowed** to commit and push new features to the remote GitHub repository until the user has explicitly verified the local changes and granted approval to push.
