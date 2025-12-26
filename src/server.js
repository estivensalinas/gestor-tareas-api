const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const https = require("https");
const fs = require("fs");
const rateLimit = require("express-rate-limit");

const dotenv = require("dotenv");
dotenv.config();

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");

const app = express();

// Middleware de parsing
app.use(express.json({ limit: '10kb' })); // Limitar tamaño de body

// Configuración de CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: {
    message: "Demasiadas solicitudes desde esta IP, por favor intenta de nuevo en 15 minutos."
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting estricto para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Solo 10 intentos de login por ventana
  message: {
    message: "Demasiados intentos de autenticación, por favor intenta de nuevo en 15 minutos."
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Aplicar rate limiting
app.use("/api/", globalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rutas de la API
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  // No exponer stack traces en producción
  const errorResponse = {
    message: err.message || 'Error interno del servidor'
  };

  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }

  res.status(err.statusCode || 500).json(errorResponse);
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    // Verificar si estamos en producción (Render usa HTTP, no HTTPS directo)
    const PORT = process.env.PORT || 3001;

    if (process.env.NODE_ENV === 'production') {
      // En producción (Render), usar HTTP ya que Render maneja SSL
      app.listen(PORT, () => {
        console.log(`🚀 Servidor HTTP corriendo en puerto ${PORT}`);
      });
    } else {
      // En desarrollo, usar HTTPS con certificados locales
      const httpsOptions = {
        cert: fs.readFileSync('./cert.pem'),
        key: fs.readFileSync('./key.pem')
      };

      https.createServer(httpsOptions, app).listen(PORT, () => {
        console.log(`🔒 Servidor HTTPS corriendo en puerto ${PORT}`);
      });
    }
  } catch (error) {
    console.error("❌ Error al iniciar servidor:", error.message);
    process.exit(1);
  }
};

startServer();
