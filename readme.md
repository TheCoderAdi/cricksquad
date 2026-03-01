# 🏏 CrickSquad

> Less WhatsApp. More Cricket.

The all-in-one app for weekend cricket groups. RSVP, team balancing, scorecards, expenses, and AI insights.

## 🚀 Features

- ✅ **One-tap RSVP** — No more WhatsApp chaos
- ⚖️ **Smart Team Balancer** — Skill-based balanced teams
- 📊 **Scorecards & Stats** — Track runs, wickets, leaderboards
- 💰 **Expense Splitter** — Who owes what, payment tracking
- 📢 **Polls & Announcements** — Group decisions made easy
- 📸 **Match Gallery** — Shared photos from every game
- 🤖 **AI Insights (Gemini)** — Match summaries, player analysis, POTM suggestions
- 🎲 **Digital Toss** — Fair coin flip built-in

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Zustand, React Query, Framer Motion
- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **AI:** Google Gemini 1.5 Flash
- **Storage:** Cloudinary
- **Deployment:** Vercel (frontend) + Railway/Render (backend)

## 📦 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Cloudinary account
- Google AI Studio API key (Gemini)

### Installation

```bash
# Clone
git clone https://github.com/thecoderadi/cricksquad.git
cd cricksquad

# Install all dependencies
npm run install-all

# Set up environment variables
cp server/.env.example server/.env
# Edit server/.env with your credentials

# Run development
npm run dev
```
