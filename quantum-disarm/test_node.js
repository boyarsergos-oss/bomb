// Тест игры в Node.js с jsdom
const { JSDOM } = require('jsdom');

const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
    <div id="game-container">
        <canvas id="gameCanvas" width="600" height="520"></canvas>
    </div>
    <div id="header">
        <div id="level-display"></div>
        <div id="timer-display"></div>
        <div id="moves-display"></div>
    </div>
    <div id="footer">
        <button></button>
    </div>
    <div id="message-overlay"></div>
</body>
</html>
`, { runScripts: "outside-only", resources: "usable" });

global.window = dom.window;
global.document = dom.window.document;

console.log("Loading game...");
try {
    const fs = require('fs');
    const gameCode = fs.readFileSync('./game.js', 'utf8');
    dom.window.eval(gameCode);
    
    console.log("Game loaded!");
    console.log("Game object:", typeof dom.window.game);
    console.log("Current level:", dom.window.game.currentLevel);
    console.log("Grid rows:", dom.window.game.grid.length);
    console.log("Player pos:", dom.window.game.playerPos);
} catch (e) {
    console.error("Error:", e.message);
}
