const http = require('http');

const data = JSON.stringify({
  authorId: 'test',
  text: 'Hello World'
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/feed',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', console.error);
req.write(data);
req.end();
