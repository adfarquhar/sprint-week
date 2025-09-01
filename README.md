# Sprint Task Tracker 🚀

A modern React application for managing sprint tasks, built with Vite, Firebase, and Tailwind CSS.

## Features

- 📋 **Task Management** - Drag & drop Kanban board
- ⏱️ **Pomodoro Timer** - Built-in productivity timer
- 👥 **Standup Timer** - Meeting time management
- 📊 **Progress Tracking** - Sprint velocity and progress metrics
- 📅 **Session Scheduler** - Schedule work sessions and meetings
- 🙋 **Excuse Tracker** - Track team attendance and excuses
- 🔥 **Firebase Integration** - Real-time data sync

## Quick Start

### Prerequisites
- Node.js (v16+)
- Firebase CLI
- Git

### Installation

```bash
# Clone and setup
pnpm sprint:setup

# Or manually:
pnpm install
pnpm dev
```

## Custom Commands

### PNPM Scripts
```bash
# Sprint-specific commands
pnpm sprint:start      # Start development server
pnpm sprint:build      # Build for production
pnpm sprint:deploy     # Build and deploy to Firebase
pnpm sprint:clean      # Clean build artifacts
pnpm sprint:test       # Run linting and tests

# Quick commands
pnpm q:start          # Quick start
pnpm q:build          # Quick build
pnpm q:deploy         # Quick deploy

# Database helpers
pnpm db:backup        # Backup Firestore data
pnpm logs:clear       # Clear Firebase logs
```

### Shell Script Commands
```bash
# Make script executable and run commands
./sprint-commands.sh status    # Project status
./sprint-commands.sh start     # Start server
./sprint-commands.sh build     # Build project
./sprint-commands.sh deploy    # Deploy to Firebase
./sprint-commands.sh clean     # Clean artifacts
./sprint-commands.sh logs      # Show logs
```

### Shell Aliases (Optional)
Add to your `~/.zshrc` or `~/.bashrc`:
```bash
source /Users/amy/Projects/sprint-week/.sprint-aliases
```

Then use:
```bash
sprint-status    # Project status
sprint-start     # Start server
ss              # Quick start
sb              # Quick build
sd              # Quick deploy
```

### VS Code Tasks
Available in Command Palette:
- **Sprint Tracker: Start** - Start development server
- **Sprint Tracker: Full Setup** - Complete setup
- **Firebase Deploy** - Deploy to Firebase
- **Clean Build** - Clean build artifacts

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **Backend**: Firebase (Firestore, Auth)
- **UI**: Lucide React icons, React DnD
- **Build**: Vite, ESLint, PostCSS

## Environment Setup

1. Copy `.env.local` and update Firebase config:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config
```

2. Initialize Firebase (if needed):
```bash
pnpm sprint:firebase-init
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── TaskBoard.jsx    # Main task management
│   ├── PomodoroTimer.jsx # Productivity timer
│   ├── StandupTimer.jsx  # Meeting timer
│   └── ...
├── contexts/            # React contexts
├── pages/              # Route components
├── firebase.js         # Firebase configuration
└── main.jsx           # App entry point
```

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### VS Code Extensions Recommended
- ES7+ React/Redux/React-Native snippets
- Prettier
- ESLint
- Tailwind CSS IntelliSense
- Firebase

## Deployment

The app is configured for Firebase Hosting:

```bash
pnpm sprint:deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run sprint:test`
5. Submit a pull request

## License

This project is private and proprietary.
