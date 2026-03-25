const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const pool   = require('../config/db')

// ── POST /api/auth/login ───────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    // 1. Find admin by email in MySQL
    const [rows] = await pool.query(
      'SELECT * FROM admins WHERE email = ?', [email]
    )

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const admin = rows[0]

    // 2. Compare password with bcrypt hash
    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // 3. Create JWT token (valid 24 hours)
    const token = jwt.sign(
      {
        admin_id: admin.admin_id,
        name:     admin.name,
        email:    admin.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    // 4. Send token + admin info back to React
    res.json({
      message: 'Login successful',
      token,
      admin: {
        id:    admin.admin_id,
        name:  admin.name,
        email: admin.email,
      }
    })

  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error. Please try again.' })
  }
}

// ── POST /api/auth/change-password ────────────────────────
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const adminId = req.admin.admin_id   // from JWT token via middleware

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both passwords are required' })
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' })
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM admins WHERE admin_id = ?', [adminId]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' })
    }

    const admin = rows[0]

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password)
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' })
    }

    // Hash new password
    const hashedNew = await bcrypt.hash(newPassword, 10)

    // Update in DB
    await pool.query(
      'UPDATE admins SET password = ? WHERE admin_id = ?',
      [hashedNew, adminId]
    )

    res.json({ message: 'Password changed successfully' })

  } catch (err) {
    console.error('Change password error:', err)
    res.status(500).json({ error: 'Server error' })
  }
}

// ── GET /api/auth/me ───────────────────────────────────────
// Returns current admin info from token
const getMe = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT admin_id, name, email, created_at FROM admins WHERE admin_id = ?',
      [req.admin.admin_id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}

module.exports = { login, changePassword, getMe }
