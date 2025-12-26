const forge = require('node-forge');
const fs = require('fs');
const { execSync } = require('child_process');

// Function to export certificate and key from Windows certificate store
function exportCertFromStore() {
  try {
    console.log('Searching for certificate in Windows certificate store...');
    
    // Try CurrentUser first (doesn't require admin privileges)
    let pfxExportCmd = `powershell -Command "$cert = Get-ChildItem -Path 'Cert:\\CurrentUser\\My' | Where-Object {$_.Subject -like '*esalinas*'} | Select-Object -First 1; if ($cert) { try { Export-PfxCertificate -Cert $cert -FilePath 'temp_cert.pfx' -Password (ConvertTo-SecureString -String 'temp123' -Force -AsPlainText); Write-Host 'Found certificate in CurrentUser store' } catch { Write-Host 'Error: Private key is not exportable. To fix this, recreate the certificate with exportable private key.' } } else { Write-Host 'No certificate found in CurrentUser store' }"`;
    
    console.log('Searching in CurrentUser store...');
    execSync(pfxExportCmd, { stdio: 'inherit' });
    
    // Check if the temp file was created
    let tempFileExists = fs.existsSync('temp_cert.pfx');
    
    if (!tempFileExists) {
      console.log('Certificate not found in CurrentUser store, trying LocalMachine store...');
      console.log('(This may require running as administrator)');
      
      // If not found in CurrentUser, try LocalMachine (requires admin)
      pfxExportCmd = `powershell -Command "$cert = Get-ChildItem -Path 'Cert:\\LocalMachine\\My' | Where-Object {$_.Subject -like '*esalinas*'} | Select-Object -First 1; if ($cert) { try { Export-PfxCertificate -Cert $cert -FilePath 'temp_cert.pfx' -Password (ConvertTo-SecureString -String 'temp123' -Force -AsPlainText); Write-Host 'Found certificate in LocalMachine store' } catch { Write-Host 'Error: Private key is not exportable. To fix this, recreate the certificate with exportable private key.' } } else { Write-Host 'No certificate found in LocalMachine store' }"`;
      
      execSync(pfxExportCmd, { stdio: 'inherit' });
      tempFileExists = fs.existsSync('temp_cert.pfx');
    }
    
    if (!tempFileExists) {
      console.log('If you already have an esalinas certificate that is not exportable, you have two options:');
      console.log('1. Recreate the certificate with exportable private key');
      console.log('2. Use the generate-cert.js script instead'); 
      throw new Error('Could not find exportable certificate with "esalinas" in the subject in either CurrentUser or LocalMachine stores');
    }
    
    console.log('Certificate exported to temp_cert.pfx');
    
    // Read the PFX file
    const pfxBuffer = fs.readFileSync('temp_cert.pfx');
    const pfxAsn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));

    // Extract the certificate and private key from the PFX
    const password = 'temp123';
    const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, false, password);

    // Extract the private key and certificate
    const bags = pfx.getBags({
      bagType: forge.pki.oids.certBag
    });
    const certBag = bags[forge.pki.oids.certBag] ? bags[forge.pki.oids.certBag][0] : null;
    
    const privateKeyBags = pfx.getBags({
      bagType: forge.pki.oids.pkcs8ShroudedKeyBag
    });
    const privateKeyBag = privateKeyBags[forge.pki.oids.pkcs8ShroudedKeyBag] ? privateKeyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0] : null;

    if (!certBag || !privateKeyBag) {
      throw new Error('Could not extract certificate or private key from PFX');
    }

    // Get the certificate and private key
    const certificate = forge.pki.certificateToPem(certBag.cert);
    const privateKey = forge.pki.privateKeyToPem(privateKeyBag.key);

    // Write to files
    fs.writeFileSync('./cert.pem', certificate);
    fs.writeFileSync('./key.pem', privateKey);

    // Clean up temp PFX file
    if (fs.existsSync('temp_cert.pfx')) {
      fs.unlinkSync('temp_cert.pfx');
    }

    console.log('Certificate and key have been exported and saved as cert.pem and key.pem');
    console.log('You can now use npm start to run your server with the new certificate');
  } catch (error) {
    console.error('Error exporting certificate:', error.message);
    process.exit(1);
  }
}

exportCertFromStore();