#!/bin/bash

# Sprint Tracker - Project Specific Commands
# Source this file: source ./sprint-commands.sh
# Or run directly: ./sprint-commands.sh <command>

PROJECT_NAME="Sprint Tracker"
FIREBASE_PROJECT="sister-sprint-week"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}🚀 $PROJECT_NAME - $1${NC}"
    echo "========================================"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
check_project() {
    if [ ! -f "package.json" ] || ! grep -q '"name": "sprint-tracker"' package.json; then
        print_error "Not in Sprint Tracker project directory!"
        exit 1
    fi
}

# Sprint Tracker specific commands
sprint_status() {
    print_header "Project Status"
    echo "📁 Current directory: $(pwd)"
    echo "📦 Node version: $(node --version)"
    echo "📦 NPM version: $(npm --version)"

    if [ -f ".env.local" ]; then
        print_success "Environment file exists"
    else
        print_warning "Environment file missing (.env.local)"
    fi

    if [ -d "node_modules" ]; then
        print_success "Dependencies installed"
    else
        print_warning "Dependencies not installed - run 'npm install'"
    fi

    echo ""
    echo "Recent tasks:"
    if [ -d ".git" ]; then
        git log --oneline -5 2>/dev/null || echo "No git history"
    else
        echo "Not a git repository"
    fi
}

sprint_start() {
    print_header "Starting Sprint Tracker"
    check_project

    if [ ! -d "node_modules" ]; then
        print_warning "Installing dependencies..."
        pnpm install
    fi

    print_success "Starting development server..."
    pnpm dev
}

sprint_build() {
    print_header "Building Sprint Tracker"
    check_project

    print_success "Building for production..."
    pnpm build

    if [ $? -eq 0 ]; then
        print_success "Build completed successfully!"
        echo "📁 Build output: ./dist/"
    else
        print_error "Build failed!"
        exit 1
    fi
}

sprint_deploy() {
    print_header "Deploying Sprint Tracker"
    check_project

    print_success "Building and deploying to Firebase..."
    pnpm sprint:deploy
}

sprint_clean() {
    print_header "Cleaning Sprint Tracker"
    check_project

    print_warning "Cleaning build artifacts..."
    rm -rf dist
    rm -rf node_modules/.vite
    rm -rf .firebase
    rm -f firebase-debug.log

    print_success "Clean completed!"
}

sprint_logs() {
    print_header "Sprint Tracker Logs"
    if [ -f "firebase-debug.log" ]; then
        tail -20 firebase-debug.log
    else
        echo "No Firebase debug logs found"
    fi
}

sprint_backup() {
    print_header "Backing up Firebase data"
    print_success "Creating Firestore backup..."
    firebase firestore:export firestore-backup --project $FIREBASE_PROJECT
}

sprint_info() {
    print_header "Project Information"
    echo "📊 Project: $PROJECT_NAME"
    echo "🔥 Firebase Project: $FIREBASE_PROJECT"
    echo "📁 Location: $(pwd)"
    echo "📦 Tech Stack: React + Vite + Firebase + Tailwind"
    echo ""
    echo "Available commands:"
    echo "  sprint_status    - Show project status"
    echo "  sprint_start     - Start development server"
    echo "  sprint_build     - Build for production"
    echo "  sprint_deploy    - Deploy to Firebase"
    echo "  sprint_clean     - Clean build artifacts"
    echo "  sprint_logs      - Show Firebase logs"
    echo "  sprint_backup    - Backup Firestore data"
    echo "  sprint_info      - Show this information"
}

# Main command handler
case "$1" in
    "status")
        sprint_status
        ;;
    "start")
        sprint_start
        ;;
    "build")
        sprint_build
        ;;
    "deploy")
        sprint_deploy
        ;;
    "clean")
        sprint_clean
        ;;
    "logs")
        sprint_logs
        ;;
    "backup")
        sprint_backup
        ;;
    "info"|"-h"|"--help"|"")
        sprint_info
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        echo "Available commands:"
        echo "  status, start, build, deploy, clean, logs, backup, info"
        exit 1
        ;;
esac
