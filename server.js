// server.js
import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 3000;
const wss = new WebSocketServer({ port: PORT });

let lobbies = {};

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch (err) {
      console.error("Invalid JSON received:", msg);
      return;
    }

    // Create a new lobby
    if (data.type === "create") {
      let code = Math.random().toString(36).substring(2, 7).toUpperCase();
      lobbies[code] = [ws];
      ws.send(JSON.stringify({ type: "code", code }));
    }

    // Join an existing lobby
    else if (data.type === "join") {
      let lobby = lobbies[data.code];
      if (lobby && lobby.length === 1) {
        lobby.push(ws);
        ws.send(JSON.stringify({ type: "joined" }));
        lobby[0].send(JSON.stringify({ type: "opponentJoined" }));
      } else {
        ws.send(JSON.stringify({ type: "error", message: "Invalid or full lobby code." }));
      }
    }

    // Handle moves
    else if (data.type === "move") {
      for (let code in lobbies) {
        let players = lobbies[code];
        if (players.includes(ws)) {
          players.forEach(p => {
            if (p !== ws) p.send(JSON.stringify(data));
          });
        }
      }
    }
  });

  // Optional: handle connection close
  ws.on("close", () => {
    for (let code in lobbies) {
      let players = lobbies[code];
      if (players.includes(ws)) {
        // Remove the disconnected player
        lobbies[code] = players.filter(p => p !== ws);
        // Notify remaining player
        if (lobbies[code].length > 0) {
          lobbies[code][0].send(JSON.stringify({ type: "opponentLeft" }));
        } else {
          // Delete empty lobby
          delete lobbies[code];
        }
      }
    }
  });
});

console.log(`✅ WebSocket server running on port ${PORT}`);
