// resetAdmin.js
// Run this ONCE to create/reset the admin account in MySQL
// Command: node resetAdmin.js

const bcrypt = require('bcryptjs')
const mysql  = require('mysql2/promise')
require('dotenv').config()

async function resetAdmin() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  const plainPassword = 'admin123'
  const hashed = await bcrypt.hash(plainPassword, 10)

  console.log('Generated hash:', hashed)

  // Delete any existing admin with this email
  await conn.query(`DELETE FROM admins WHERE email = 'admin@school.com'`)

  // Insert fresh admin with correct hash
  await conn.query(
    `INSERT INTO admins (name, email, password) VALUES (?, ?, ?)`,
    ['Administrator', 'admin@school.com', hashed]
  )

  console.log('✅ Admin account created successfully!')
  console.log('   Email:    admin@school.com')
  console.log('   Password: admin123')

  await conn.end()
}

resetAdmin().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})