const authService = require("../services/authService");

/**
 * Registrar nuevo usuario
 */
const register = async (req, res) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({
      message: "Usuario creado exitosamente",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    const statusCode = error.name === 'ValidationError' ? 400 :
      error.message.includes('ya está registrado') ? 409 : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * Iniciar sesión
 */
const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);

    // Si requiere MFA, retornar indicador
    if (result.requiresMfa) {
      return res.status(200).json({
        requiresMfa: true,
        message: result.message
      });
    }

    res.json({
      message: "Login exitoso",
      token: result.token,
      user: result.user
    });
  } catch (error) {
    const statusCode = error.message.includes('bloqueada') ? 423 : 401;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * Obtener usuario actual
 */
const me = async (req, res) => {
  try {
    const user = await authService.me(req.userId);
    res.json(user);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

/**
 * Configurar MFA - Generar QR
 */
const setupMfa = async (req, res) => {
  try {
    const result = await authService.setupMfa(req.userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Habilitar MFA con código de verificación
 */
const enableMfa = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "El código de verificación es requerido" });
    }
    const result = await authService.enableMfa(req.userId, token);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Deshabilitar MFA
 */
const disableMfa = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "El código de verificación es requerido" });
    }
    const result = await authService.disableMfa(req.userId, token);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  me,
  setupMfa,
  enableMfa,
  disableMfa
};
