const https = require('https');
const { execSync } = require('child_process');

async function enableEmailPasswordAuth() {
  try {
    console.log('Attempting to enable Email/Password authentication...\n');

    // Get access token from Firebase CLI
    let accessToken;
    try {
      const result = execSync('firebase login:ci --no-localhost', { encoding: 'utf8' });
      const match = result.match(/token: ([^\s]+)/);
      if (match) {
        accessToken = match[1];
      }
    } catch (e) {
      // Token might already exist, try to get it
      try {
        accessToken = execSync('firebase login:ci --print-token', { encoding: 'utf8' }).trim();
      } catch (err) {
        console.error('Could not get Firebase access token');
        console.error('Please enable Email/Password authentication manually:');
        console.error('1. Go to https://console.firebase.google.com/project/mybackhaul-21112/authentication/providers');
        console.error('2. Click on "Email/Password"');
        console.error('3. Toggle "Enable" to ON');
        console.error('4. Click "Save"\n');
        process.exit(1);
      }
    }

    const postData = JSON.stringify({
      signIn: {
        email: {
          enabled: true,
          passwordRequired: true
        }
      }
    });

    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      port: 443,
      path: '/admin/v2/projects/mybackhaul-21112/config?updateMask=signIn.email.enabled',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length,
        'Authorization': `Bearer ${accessToken}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Email/Password authentication has been enabled successfully!\n');
          console.log('You can now:');
          console.log('1. Start the dev server: cd client && npm run dev');
          console.log('2. Go to /signup to create an account');
          console.log('3. Login with your credentials\n');
        } else {
          console.error(`❌ Failed to enable authentication (Status: ${res.statusCode})`);
          console.error('Response:', data);
          console.error('\nPlease enable manually in Firebase Console:');
          console.error('https://console.firebase.google.com/project/mybackhaul-21112/authentication/providers\n');
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
      console.error('\nPlease enable Email/Password authentication manually:');
      console.error('1. Go to https://console.firebase.google.com/project/mybackhaul-21112/authentication/providers');
      console.error('2. Click on "Email/Password"');
      console.error('3. Toggle "Enable" to ON');
      console.error('4. Click "Save"\n');
    });

    req.write(postData);
    req.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nPlease enable Email/Password authentication manually:');
    console.error('1. Go to https://console.firebase.google.com/project/mybackhaul-21112/authentication/providers');
    console.error('2. Click on "Email/Password"');
    console.error('3. Toggle "Enable" to ON');
    console.error('4. Click "Save"\n');
    process.exit(1);
  }
}

enableEmailPasswordAuth();
