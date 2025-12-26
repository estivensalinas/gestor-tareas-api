/**
 * Script para generar certificados SSL autofirmados para desarrollo local
 * Ejecutar con: node generate-certs.js
 */

const forge = require('node-forge');
const fs = require('fs');

console.log('🔐 Generando certificados SSL autofirmados para desarrollo local...\n');

// Generar par de claves RSA
const keys = forge.pki.rsa.generateKeyPair(2048);

// Crear certificado
const cert = forge.pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

const attrs = [
    { name: 'commonName', value: 'localhost' },
    { name: 'countryName', value: 'BO' },
    { name: 'organizationName', value: 'Gestor de Tareas Dev' }
];

cert.setSubject(attrs);
cert.setIssuer(attrs);
cert.setExtensions([
    { name: 'basicConstraints', cA: true },
    {
        name: 'subjectAltName', altNames: [
            { type: 2, value: 'localhost' },
            { type: 7, ip: '127.0.0.1' }
        ]
    }
]);

// Firmar certificado
cert.sign(keys.privateKey, forge.md.sha256.create());

// Convertir a PEM
const pemCert = forge.pki.certificateToPem(cert);
const pemKey = forge.pki.privateKeyToPem(keys.privateKey);

// Guardar archivos
fs.writeFileSync('cert.pem', pemCert);
fs.writeFileSync('key.pem', pemKey);

console.log('✅ Certificados generados exitosamente:');
console.log('   - cert.pem (certificado público)');
console.log('   - key.pem (llave privada)');
console.log('\n⚠️  Estos certificados son solo para desarrollo local.');
console.log('   El navegador mostrará una advertencia de seguridad que debes aceptar.');
