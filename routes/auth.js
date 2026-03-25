const express = require('express')
const router  = express.Router()
const { login, changePassword, getMe } = require('../controllers/authController')
const { verifyToken } = require('../middleware/authMiddleware')

router.post('/login',           login)
router.post('/change-password', verifyToken, changePassword)
router.get('/me',               verifyToken, getMe)

module.exports = router
