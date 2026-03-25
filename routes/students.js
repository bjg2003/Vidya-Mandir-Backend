const express = require('express')
const router  = express.Router()
const pool    = require('../config/db')

// GET /api/students — get all students
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM students ORDER BY student_id ASC'
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/students/:id — get one student
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM students WHERE student_id = ?', [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Student not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/students — add student
router.post('/', async (req, res) => {
  const { name, class: cls, section, age } = req.body

  if (!name || !cls || !section || !age) {
    return res.status(400).json({ error: 'All fields are required: name, class, section, age' })
  }
  if (cls < 1 || cls > 5) {
    return res.status(400).json({ error: 'Class must be between 1 and 5' })
  }
  if (!['A', 'B'].includes(section)) {
    return res.status(400).json({ error: 'Section must be A or B' })
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO students (name, class, section, age) VALUES (?, ?, ?, ?)',
      [name, cls, section, age]
    )
    const [newRow] = await pool.query(
      'SELECT * FROM students WHERE student_id = ?', [result.insertId]
    )
    res.status(201).json(newRow[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/students/:id — update student
router.put('/:id', async (req, res) => {
  const { name, class: cls, section, age } = req.body

  if (!name || !cls || !section || !age) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  try {
    const [result] = await pool.query(
      'UPDATE students SET name=?, class=?, section=?, age=? WHERE student_id=?',
      [name, cls, section, age, req.params.id]
    )
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Student not found' })
    const [updated] = await pool.query(
      'SELECT * FROM students WHERE student_id = ?', [req.params.id]
    )
    res.json(updated[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/students/:id — delete student
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM students WHERE student_id = ?', [req.params.id]
    )
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Student not found' })
    res.json({ message: 'Student deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
