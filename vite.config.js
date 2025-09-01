import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['lucide-react', 'react-dnd', 'react-dnd-html5-backend'],
          'form-vendor': ['react-hook-form'],

          // Feature chunks
          'auth': ['./src/contexts/AuthContext', './src/components/Login'],
          'dashboard': ['./src/pages/Dashboard'],
          'task-management': [
            './src/components/TaskBoard',
            './src/components/TaskColumn',
            './src/components/AddTaskModal'
          ],
          'timers': [
            './src/components/PomodoroTimer',
            './src/components/StandupTimer'
          ],
          'analytics': [
            './src/components/ProgressMeter',
            './src/components/VelocityChart'
          ],
          'other-features': [
            './src/components/ExcuseTracker',
            './src/components/SessionScheduler'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
