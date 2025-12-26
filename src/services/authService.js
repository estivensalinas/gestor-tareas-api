const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const mfaService = require("./mfaService");

/**
 * Registrar un nuevo usuario
 */
const register = async ({ name, email, password }) => {
  // Verificar si el email ya existe
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error("El correo electrónico ya está registrado");
  }

  const user = new User({ name, email, password });
  await user.save();

  // Retornar usuario sin password
  const userObject = user.toObject();
  delete userObject.password;
  return userObject;
};

/**
 * Login con manejo de bloqueo por intentos fallidos y MFA
 */
const login = async ({ email, password, mfaToken }) => {
  // Buscar usuario incluyendo password y twoFactorSecret
  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+password +twoFactorSecret');

  if (!user) {
    throw new Error("Credenciales inválidas");
  }

  // Verificar si la cuenta está bloqueada
  if (user.isLocked) {
    const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
    throw new Error(`Cuenta bloqueada. Intenta de nuevo en ${remainingTime} minutos.`);
  }

  // Verificar contraseña
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    // Incrementar intentos fallidos
    await user.incLoginAttempts();

    const attemptsLeft = User.MAX_LOGIN_ATTEMPTS - user.loginAttempts - 1;
    if (attemptsLeft > 0) {
      throw new Error(`Credenciales inválidas. Te quedan ${attemptsLeft} intentos.`);
    } else {
      throw new Error(`Cuenta bloqueada por ${User.LOCK_TIME / 60000} minutos debido a múltiples intentos fallidos.`);
    }
  }

  // Verificar MFA si está habilitado
  if (user.twoFactorEnabled) {
    if (!mfaToken) {
      // Retornar indicador de que se requiere MFA
      return {
        requiresMfa: true,
        message: "Se requiere el código de autenticación de dos factores"
      };
    }

    const isValidMfa = mfaService.verifyToken(user.twoFactorSecret, mfaToken);
    if (!isValidMfa) {
      throw new Error("Código de autenticación inválido");
    }
  }

  // Login exitoso - resetear intentos
  await user.resetLoginAttempts();

  // Generar token JWT
  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled
    }
  };
};

/**
 * Obtener datos del usuario autenticado
 */
const me = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("Usuario no encontrado");
  }
  return user;
};

/**
 * Configurar MFA - Generar secreto y QR
 */
const setupMfa = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  if (user.twoFactorEnabled) {
    throw new Error("MFA ya está habilitado");
  }

  // Generar nuevo secreto
  const { secret, otpauthUrl } = mfaService.generateSecret(user.email);

  // Guardar secreto sin habilitar aún
  await User.findByIdAndUpdate(userId, { twoFactorSecret: secret });

  // Generar QR code
  const qrCode = await mfaService.generateQRCode(otpauthUrl);

  return {
    secret,
    qrCode,
    message: "Escanea el código QR con tu app autenticadora (Google Authenticator, Authy, etc.)"
  };
};

/**
 * Verificar y habilitar MFA
 */
const enableMfa = async (userId, token) => {
  const user = await User.findById(userId).select('+twoFactorSecret');

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  if (!user.twoFactorSecret) {
    throw new Error("Primero debes configurar MFA con /api/auth/mfa/setup");
  }

  if (user.twoFactorEnabled) {
    throw new Error("MFA ya está habilitado");
  }

  // Verificar que el código sea válido
  const isValid = mfaService.verifyToken(user.twoFactorSecret, token);

  if (!isValid) {
    throw new Error("Código inválido. Asegúrate de ingresar el código actual de tu app autenticadora.");
  }

  // Habilitar MFA
  await User.findByIdAndUpdate(userId, { twoFactorEnabled: true });

  return {
    message: "MFA habilitado exitosamente",
    twoFactorEnabled: true
  };
};

/**
 * Deshabilitar MFA
 */
const disableMfa = async (userId, token) => {
  const user = await User.findById(userId).select('+twoFactorSecret');

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  if (!user.twoFactorEnabled) {
    throw new Error("MFA no está habilitado");
  }

  // Verificar código antes de deshabilitar
  const isValid = mfaService.verifyToken(user.twoFactorSecret, token);

  if (!isValid) {
    throw new Error("Código inválido");
  }

  // Deshabilitar MFA
  await User.findByIdAndUpdate(userId, {
    twoFactorEnabled: false,
    twoFactorSecret: null
  });

  return {
    message: "MFA deshabilitado exitosamente",
    twoFactorEnabled: false
  };
};

module.exports = {
  register,
  login,
  me,
  setupMfa,
  enableMfa,
  disableMfa
};
