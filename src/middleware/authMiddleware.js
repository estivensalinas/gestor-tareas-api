const jwt = require("jsonwebtoken");

/**
 * Middleware de autenticación JWT
 * Verifica el token y extrae userId y role
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "No autorizado - Token no proporcionado"
    });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({
      message: "No autorizado - Formato de token inválido"
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Sesión expirada - Por favor inicia sesión nuevamente" });
    }
    res.status(401).json({ message: "Token inválido" });
  }
};

/**
 * Middleware para requerir rol de administrador
 */
const requireAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      message: "Acceso denegado - Se requieren permisos de administrador"
    });
  }
  next();
};

module.exports = authMiddleware;
module.exports.requireAdmin = requireAdmin;
