const express = require('express')
const router  = express.Router()
const pool    = require('../config/db')

// GET /api/teachers — get all teachers with their subjects
router.get('/', async (req, res) => {
  try {
    const [teachers] = await pool.query(
      'SELECT * FROM teachers ORDER BY teacher_id ASC'
    )
    // For each teacher, fetch their subjects
    const result = await Promise.all(teachers.map(async (t) => {
      const [subjects] = await pool.query(
        `SELECT s.subject_id, s.subject_name
         FROM teacher_subjects ts
         JOIN subjects s ON ts.subject_id = s.subject_id
         WHERE ts.teacher_id = ?`,
        [t.teacher_id]
      )
      return {
        ...t,
        subjects: subjects.map(s => s.subject_name),
        subject_ids: subjects.map(s => s.subject_id),
      }
    }))
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/teachers/:id — single teacher with subjects
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM teachers WHERE teacher_id = ?', [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Teacher not found' })
    const [subjects] = await pool.query(
      `SELECT s.subject_id, s.subject_name
       FROM teacher_subjects ts
       JOIN subjects s ON ts.subject_id = s.subject_id
       WHERE ts.teacher_id = ?`,
      [req.params.id]
    )
    res.json({
      ...rows[0],
      subjects: subjects.map(s => s.subject_name),
      subject_ids: subjects.map(s => s.subject_id),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/teachers — add teacher + subjects
router.post('/', async (req, res) => {
  const { name, email, phone, subject_ids = [] } = req.body

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'name, email and phone are required' })
  }
  if (subject_ids.length > 2) {
    return res.status(400).json({ error: 'A teacher can teach maximum 2 subjects' })
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [result] = await conn.query(
      'INSERT INTO teachers (name, email, phone) VALUES (?, ?, ?)',
      [name, email, phone]
    )
    const teacherId = result.insertId

    // Insert subject assignments
    if (subject_ids.length > 0) {
      const values = subject_ids.map(sid => [teacherId, sid])
      await conn.query(
        'INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ?', [values]
      )
    }

    await conn.commit()

    // Return full teacher with subjects
    const [subjects] = await pool.query(
      `SELECT s.subject_name FROM teacher_subjects ts
       JOIN subjects s ON ts.subject_id = s.subject_id
       WHERE ts.teacher_id = ?`, [teacherId]
    )
    res.status(201).json({
      teacher_id: teacherId, name, email, phone,
      subjects: subjects.map(s => s.subject_name),
    })
  } catch (err) {
    await conn.rollback()
    res.status(500).json({ error: err.message })
  } finally {
    conn.release()
  }
})

// PUT /api/teachers/:id — update teacher + subjects
router.put('/:id', async (req, res) => {
  const { name, email, phone, subject_ids = [] } = req.body
  const teacherId = req.params.id

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'name, email and phone are required' })
  }
  if (subject_ids.length > 2) {
    return res.status(400).json({ error: 'A teacher can teach maximum 2 subjects' })
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [result] = await conn.query(
      'UPDATE teachers SET name=?, email=?, phone=? WHERE teacher_id=?',
      [name, email, phone, teacherId]
    )
    if (result.affectedRows === 0) {
      await conn.rollback()
      return res.status(404).json({ error: 'Teacher not found' })
    }

    // Replace all subject assignments
    await conn.query(
      'DELETE FROM teacher_subjects WHERE teacher_id = ?', [teacherId]
    )
    if (subject_ids.length > 0) {
      const values = subject_ids.map(sid => [teacherId, sid])
      await conn.query(
        'INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ?', [values]
      )
    }

    await conn.commit()

    const [subjects] = await pool.query(
      `SELECT s.subject_name FROM teacher_subjects ts
       JOIN subjects s ON ts.subject_id = s.subject_id
       WHERE ts.teacher_id = ?`, [teacherId]
    )
    res.json({
      teacher_id: parseInt(teacherId), name, email, phone,
      subjects: subjects.map(s => s.subject_name),
    })
  } catch (err) {
    await conn.rollback()
    res.status(500).json({ error: err.message })
  } finally {
    conn.release()
  }
})

// DELETE /api/teachers/:id
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM teachers WHERE teacher_id = ?', [req.params.id]
    )
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Teacher not found' })
    res.json({ message: 'Teacher deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
