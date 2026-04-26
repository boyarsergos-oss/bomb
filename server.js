const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const LEVEL_FILE = path.join(__dirname, 'level.json');

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Serve the game HTML file
    if (req.url === '/' || req.url === '/drone-game.html') {
        fs.readFile(path.join(__dirname, 'drone-game.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading game');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
        return;
    }

    // Save level endpoint
    if (req.url === '/api/save' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const levelData = JSON.parse(body);
                fs.writeFileSync(LEVEL_FILE, JSON.stringify(levelData, null, 2));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Уровень сохранён в файл!' }));
                console.log('Уровень сохранён в level.json');
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
        return;
    }

    // Load level endpoint
    if (req.url === '/api/load' && req.method === 'GET') {
        if (fs.existsSync(LEVEL_FILE)) {
            fs.readFile(LEVEL_FILE, (err, data) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Ошибка чтения файла' }));
                    return;
                }
                try {
                    const levelData = JSON.parse(data);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, data: levelData }));
                } catch (e) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Ошибка парсинга файла' }));
                }
            });
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Файл уровня не найден' }));
        }
        return;
    }

    // 404 for other routes
    res.writeHead(404);
    res.end('Not Found');
});

server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log('Откройте браузер и перейдите по адресу http://localhost:3000');
    console.log('Данные уровня будут сохраняться в файл level.json');
});
