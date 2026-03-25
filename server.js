const express = require('express')
const cors    = require('cors')
require('dotenv').config()

const app  = express()
const PORT = process.env.PORT || 3000

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// ── Import routes ──────────────────────────────────────────
const authRoutes    = require('./routes/auth')
const studentRoutes = require('./routes/students')
const teacherRoutes = require('./routes/teachers')
const subjectRoutes = require('./routes/subjects')

const { verifyToken } = require('./middleware/authMiddleware')

// ── Public routes (no token needed) ───────────────────────
app.use('/api/auth', authRoutes)

// ── Protected routes (JWT required) ───────────────────────
app.use('/api/students', verifyToken, studentRoutes)
app.use('/api/teachers', verifyToken, teacherRoutes)
app.use('/api/subjects', verifyToken, subjectRoutes)

// ── Health check ───────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Vidya Mandir API is running ✅' })
})

// ── 404 handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ── Start server ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`)
})