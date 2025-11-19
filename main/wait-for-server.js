const { app } = require('electron');
const http = require('http');
const https = require('https');
const { URL } = require('url');

function pingServer(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const req = client.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname,
        method: 'GET',
        timeout: 2000
      },
      (res) => {
        res.resume();
        resolve(res.statusCode && res.statusCode < 500);
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error('timeout'));
    });

    req.on('error', reject);
    req.end();
  });
}

const waitForServer = async (url, maxAttempts = 30, delay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const isOk = await pingServer(url);
      if (isOk) {
        console.log(`✅ Сервер доступен после ${attempt} попыток`);
        return true;
      }
    } catch (error) {
      console.log(`⏳ Ожидание сервера... Попытка ${attempt}/${maxAttempts}`, error.message || error);
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  console.error('❌ Не удалось подключиться к серверу разработки');
  throw new Error('Не удалось подключиться к серверу разработки');
};

module.exports = waitForServer;