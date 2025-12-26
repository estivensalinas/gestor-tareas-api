const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const authMiddleware = require('../middleware/authMiddleware');

// Rutas públicas
router.post("/register", authController.register);
router.post("/login", authController.login);

// Rutas protegidas
router.get("/me", authMiddleware, authController.me);

// Rutas MFA (requieren autenticación)
router.post("/mfa/setup", authMiddleware, authController.setupMfa);
router.post("/mfa/enable", authMiddleware, authController.enableMfa);
router.post("/mfa/disable", authMiddleware, authController.disableMfa);

module.exports = router;
