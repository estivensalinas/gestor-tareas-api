const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

/**
 * Generar secreto TOTP para MFA
 * @param {string} email - Email del usuario para el label
 * @returns {Object} - Secreto base32 y otpauth URL
 */
const generateSecret = (email) => {
    const secret = speakeasy.generateSecret({
        name: `GestorTareas:${email}`,
        issuer: 'GestorTareas',
        length: 20
    });

    return {
        secret: secret.base32,
        otpauthUrl: secret.otpauth_url
    };
};

/**
 * Generar QR code como Data URL
 * @param {string} otpauthUrl - URL otpauth para generar QR
 * @returns {Promise<string>} - QR code como base64 data URL
 */
const generateQRCode = async (otpauthUrl) => {
    try {
        const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
            width: 256,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
        return qrCodeDataUrl;
    } catch (error) {
        throw new Error('Error al generar código QR');
    }
};

/**
 * Verificar código TOTP
 * @param {string} secret - Secreto base32 del usuario
 * @param {string} token - Código de 6 dígitos ingresado por el usuario
 * @returns {boolean} - Si el código es válido
 */
const verifyToken = (secret, token) => {
    return speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 1 // Permitir 1 intervalo de tolerancia (30 segundos antes/después)
    });
};

/**
 * Generar código TOTP (para testing)
 * @param {string} secret - Secreto base32
 * @returns {string} - Código TOTP actual
 */
const generateToken = (secret) => {
    return speakeasy.totp({
        secret: secret,
        encoding: 'base32'
    });
};

module.exports = {
    generateSecret,
    generateQRCode,
    verifyToken,
    generateToken
};
