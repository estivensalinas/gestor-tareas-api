const forge = require('node-forge');
const fs = require('fs');

// Read the certificate file
const certPem = fs.readFileSync('./cert.pem', 'utf8');

// Parse the certificate
const cert = forge.pki.certificateFromPem(certPem);

// Display certificate information
console.log('=== Información del Certificado ===');
console.log('Subject (Sujeto):', cert.subject.attributes.map(attr => `${attr.name}=${attr.value}`).join(', '));
console.log('Issuer (Emisor):', cert.issuer.attributes.map(attr => `${attr.name}=${attr.value}`).join(', '));
console.log('Fecha de inicio:', cert.validity.notBefore);
console.log('Fecha de expiración:', cert.validity.notAfter);
console.log('Versión:', cert.version + 1);

// Check the signature algorithm
let signatureAlgorithm = 'Unknown';
if (cert.signatureOid) {
  signatureAlgorithm = cert.signatureOid;
} else if (cert.md && cert.md.signatureOid) {
  signatureAlgorithm = cert.md.signatureOid;
}
console.log('Algoritmo de firma:', signatureAlgorithm);

// Check if the certificate contains 'esalinas'
const hasEsalinas = cert.subject.attributes.some(attr => 
  attr.value && attr.value.toLowerCase().includes('esalinas')
);

console.log('\n=== Resultado ===');
if (hasEsalinas) {
  console.log('✓ El certificado contiene "esalinas" en el nombre del sujeto');
  console.log('✓ El servidor usará tu certificado personalizado');
} else {
  console.log('✗ El certificado NO contiene "esalinas" en el nombre del sujeto');
  console.log('✗ El certificado actual no es el que creaste con "esalinas"');
}