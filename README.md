# Wilbur - Trading Room Platform

A real-time trading room platform built with React, TypeScript, Supabase, and LiveKit.

## 🚀 Features

### Core Functionality
- **Real-time Video/Audio** - LiveKit integration for high-quality streaming
- **Trading Rooms** - Create and join trading rooms with role-based permissions
- **Live Chat** - Real-time messaging with emoji support
- **Alerts System** - Post and view trading alerts with media support
- **Polls** - Create and vote on polls within rooms
- **Screen Sharing** - Share your screen with room participants
- **Recording** - Record room sessions (host/moderator only)

### User Features
- **Single Session Enforcement** - Auto-logout when logging in from another device
- **Member Location Tracking** - See where members are joining from (city/state)
- **Custom Themes** - Fully customizable room themes and branding
- **Profile Management** - Avatar, display name, and bio
- **Responsive Design** - Works on desktop, tablet, and mobile

### Integrations
- **Spotify** - Connect and control Spotify playback (Web Player + API)
- **LinkedIn** - Connect your LinkedIn profile
- **X (Twitter)** - Connect your X/Twitter account

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Real-time**: Supabase Realtime, LiveKit
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Edge Functions**: Supabase Edge Functions (Deno)

## 📦 Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run development server
npm run dev
```

## 🔧 Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_LIVEKIT_URL=your_livekit_url
VITE_LIVEKIT_API_KEY=your_livekit_api_key
VITE_LIVEKIT_API_SECRET=your_livekit_api_secret
```

## 🗄️ Database

Run migrations:
```bash
supabase db push
```

## 🚀 Deployment

```bash
# Build for production
npm run build

# Deploy to your hosting provider
# (Netlify, Vercel, etc.)
```

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.
