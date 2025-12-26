const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El correo electrónico es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/, 'Por favor, introduce un correo electrónico válido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
    select: false // No incluir password en consultas por defecto
  },

  // Sistema de roles
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  // Bloqueo por intentos fallidos
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },

  // MFA (Two-Factor Authentication)
  twoFactorSecret: {
    type: String,
    select: false // No incluir en consultas por defecto
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },

  // Auditoría
  passwordChangedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Constantes de bloqueo
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutos en milisegundos

// Virtual para verificar si la cuenta está bloqueada
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash de contraseña antes de guardar
userSchema.pre('save', async function (next) {
  // Solo hashear si la contraseña fue modificada
  if (!this.isModified('password')) return next();

  // Validar complejidad de contraseña
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(this.password)) {
    const error = new Error('La contraseña debe contener al menos: 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)');
    error.name = 'ValidationError';
    return next(error);
  }

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = Date.now();
  next();
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para incrementar intentos de login fallidos
userSchema.methods.incLoginAttempts = async function () {
  // Si el bloqueo ha expirado, reiniciar
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Bloquear cuenta si se exceden los intentos
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }

  return this.updateOne(updates);
};

// Método para resetear intentos después de login exitoso
userSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set: { loginAttempts: 0, lastLogin: Date.now() },
    $unset: { lockUntil: 1 }
  });
};

// Exportar constantes para uso externo
userSchema.statics.MAX_LOGIN_ATTEMPTS = MAX_LOGIN_ATTEMPTS;
userSchema.statics.LOCK_TIME = LOCK_TIME;

module.exports = mongoose.model('User', userSchema);
