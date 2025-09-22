// server.js
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

let lobbies = {};

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    let data = JSON.parse(msg);

    if (data.type === "create") {
      let code = Math.random().toString(36).substr(2, 5).toUpperCase();
      lobbies[code] = [ws];
      ws.lobbyCode = code;
      ws.send(JSON.stringify({ type: "code", code }));
    }

    if (data.type === "join") {
      let code = data.code;
      if (lobbies[code] && lobbies[code].length === 1) {
        lobbies[code].push(ws);
        ws.lobbyCode = code;
        ws.send(JSON.stringify({ type: "code", code }));
      } else {
        ws.send(JSON.stringify({ type: "error", message: "Invalid code" }));
      }
    }

    if (data.type === "move") {
      if (ws.lobbyCode && lobbies[ws.lobbyCode]) {
        lobbies[ws.lobbyCode].forEach((client) => {
          if (client !== ws) client.send(JSON.stringify(data));
        });
      }
    }
  });

  ws.on("close", () => {
    if (ws.lobbyCode && lobbies[ws.lobbyCode]) {
      lobbies[ws.lobbyCode] = lobbies[ws.lobbyCode].filter((c) => c !== ws);
      if (lobbies[ws.lobbyCode].length === 0) {
        delete lobbies[ws.lobbyCode];
      }
    }
  });
});

console.log(`✅ WebSocket server running on port ${PORT}`);
