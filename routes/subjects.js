const express = require('express')
const router  = express.Router()
const pool    = require('../config/db')

// GET /api/subjects — all subjects with their assigned teachers
router.get('/', async (req, res) => {
  try {
    const [subjects] = await pool.query(
      'SELECT * FROM subjects ORDER BY subject_id ASC'
    )
    const result = await Promise.all(subjects.map(async (sub) => {
      const [teachers] = await pool.query(
        `SELECT t.teacher_id, t.name, t.email
         FROM teacher_subjects ts
         JOIN teachers t ON ts.teacher_id = t.teacher_id
         WHERE ts.subject_id = ?`,
        [sub.subject_id]
      )
      return { ...sub, teachers }
    }))
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
