const fs = require('fs');
const https = require('https');
const { exec } = require('child_process');
const httpProxy = require('http-proxy');

const certOptions = {
  key: fs.readFileSync('./certs/localhost-key.pem'),
  cert: fs.readFileSync('./certs/localhost.pem'),
};

https
  .createServer(certOptions, (req, res) => {
    const proxy = httpProxy.createProxyServer({
      target: 'http://localhost:3000',
      secure: false,
    });

    proxy.web(req, res);
  })
  .listen(3443, () => {
    console.log('🚀 HTTPS Proxy running at https://localhost:3443');

    // Start the React app
    exec('HTTPS=true npx react-scripts start', (err, stdout, stderr) => {
  if (err) {
        console.error('❌ Error starting React app:', err);
        return;
      }
      console.log(stdout);
      console.error(stderr);
    });
  });
