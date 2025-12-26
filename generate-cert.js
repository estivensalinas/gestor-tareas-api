const forge = require('node-forge');
const fs = require('fs');

// Generate a new key pair
const keys = forge.pki.rsa.generateKeyPair(2048);

// Create a new certificate
const cert = forge.pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1); // 1 year validity

// Set certificate subject
const attrs = [{
  name: 'commonName',
  value: 'esalinas'
}, {
  name: 'countryName',
  value: 'ES'
}, {
  name: 'stateOrProvinceName',
  value: 'Desarrollo'
}, {
  name: 'localityName',
  value: 'Pruebas'
}, {
  name: 'organizationName',
  value: 'esalinas'
}, {
  name: 'organizationalUnitName',
  value: 'API'
}];
cert.setSubject(attrs);

// Set certificate issuer (same as subject for self-signed)
cert.setIssuer(attrs);

// Set basic constraints
cert.setExtensions([{
  name: 'basicConstraints',
  cA: false
}, {
  name: 'keyUsage',
  keyEncipherment: true,
  digitalSignature: true
}, {
  name: 'extKeyUsage',
  serverAuth: true
}, {
  name: 'subjectAltName',
  altNames: [{
    type: 6, // URI
    value: 'localhost'
  }, {
    type: 7, // IP
    ip: '127.0.0.1'
  }]
}]);

// Sign the certificate with its own private key
cert.sign(keys.privateKey, forge.md.sha256.create());

// Convert to PEM format
const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
const certPem = forge.pki.certificateToPem(cert);

// Write to files
fs.writeFileSync('./key.pem', privateKeyPem);
fs.writeFileSync('./cert.pem', certPem);

console.log('New certificate and key have been generated and saved as cert.pem and key.pem');