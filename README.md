# Proyecto API - Certificados Digitales Autofirmados

## Descripción General
Este es un servidor API de Express.js con soporte HTTPS que implementa funcionalidades de autenticación y gestión de tareas. Este proyecto demuestra la implementación de certificados SSL autofirmados para desarrollo local.

## Implementación de Certificados Autofirmados

### Métodos para Generar Certificados Autofirmados

Investigamos dos métodos comunes para generar certificados autofirmados:

#### Método 1: OpenSSL
Comando para generar una clave privada y un certificado autofirmado:
```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=ES/ST=Desarrollo/L=Pruebas/O=API/CN=localhost"
```

#### Método 2: PowerShell (Windows)
Comando para generar un certificado autofirmado en PowerShell:
```powershell
New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "cert:\LocalMachine\My" -KeyAlgorithm RSA -KeyLength 2048 -NotAfter (Get-Date).AddYears(1)
```

### Enfoque Anterior (Ahora Actualizado)
- Usaba un archivo `localhost.pfx` como fuente para los certificados SSL
- Requería un script de conversión para extraer el certificado y la clave privada del formato PFX al PEM
- Agregaba una complejidad innecesaria al proceso de gestión de certificados

### Enfoque Actual (Simplificado)
- Genera certificados SSL directamente usando Node.js y la biblioteca `node-forge`
- Elimina la dependencia de archivos PFX y el paso de conversión
- Los nuevos certificados pueden generarse usando un script npm simple

## Cómo Generar Certificados SSL

### Opción 1: Generar certificados directamente con node-forge (recomendado)
Para generar nuevos certificados SSL usando node-forge con "esalinas" en el nombre, ejecute:
```bash
npm run gen-cert
```

Esto creará:
- `cert.pem` - El certificado SSL con "esalinas" en el nombre
- `key.pem` - La clave privada

El script `generate-cert.js` crea un certificado autofirmado válido por un año con las extensiones adecuadas y el nombre "esalinas".

### Opción 2: Usar certificado de Windows
Si ha creado un certificado autofirmado en Windows usando PowerShell con `New-SelfSignedCertificate`, puede exportarlo e integrarlo en el proyecto:

1. Cree el certificado en PowerShell **como administrador**:
```powershell
New-SelfSignedCertificate -DnsName "esalinas" -CertStoreLocation "cert:\LocalMachine\My" -KeyAlgorithm RSA -KeyLength 2048 -NotAfter (Get-Date).AddYears(1) -Subject "CN=esalinas,OU=API,O=esalinas"
```

2. Exporte el certificado usando el script (ejecutar desde una terminal con permisos elevados si se accede al almacén LocalMachine):
```bash
npm run export-cert
```

Esto extraerá el certificado y la clave privada del almacén de certificados de Windows y los guardará como `cert.pem` y `key.pem`.

**Nota:** Puede que necesite ejecutar npm run export-cert desde una terminal elevada (como administrador) para poder acceder al almacén de certificados LocalMachine.

## Verificación del Certificado

Para verificar que el certificado actual es el que deseas usar, puedes ejecutar:

```bash
npm run verify-cert
```

Esto mostrará información detallada sobre el certificado actual y confirmará si contiene "esalinas" en el nombre del sujeto.

## Iniciar el Servidor

Para iniciar el servidor, ejecute:
```bash
npm start
```

El servidor se ejecutará en HTTPS en `https://localhost:3001`

## Dependencias

- Express.js (v5.1.0)
- node-forge (v1.3.1) - Usado para la generación de certificados
- Otras dependencias como se especifica en `package.json`

## Configuración

La aplicación usa variables de entorno almacenadas en el archivo `.env` para la configuración:
- `MONGO_URI` - Cadena de conexión a MongoDB

## Configuración del Servidor para HTTPS

El servidor está configurado para usar HTTPS con la siguiente configuración en `src/server.js`:
```javascript
const https = require('https');
const fs = require('fs');

// Configurar certificados SSL
const options = {
  cert: fs.readFileSync('./cert.pem'),
  key: fs.readFileSync('./key.pem')
};

// Crear servidor HTTPS
https.createServer(options, app).listen(3001, () => {
  console.log("Servidor HTTPS corriendo en puerto 3001");
});
```