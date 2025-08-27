// server.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let messages = []; // store chat history

// Serve frontend with React inside HTML
app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Real-Time Chat</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; background: #f5f5f5; }
        #root { display: flex; justify-content: center; padding: 20px; }
        .chat-box { width: 400px; background: white; border-radius: 12px; 
                    padding: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); 
                    display: flex; flex-direction: column; height: 500px; }
        .messages { flex: 1; overflow-y: auto; margin-bottom: 10px; }
        .msg { padding: 8px; margin: 4px 0; border-radius: 6px; background: #e1f5fe; }
        .input-area { display: flex; }
        input { flex: 1; padding: 8px; border-radius: 6px; border: 1px solid #ccc; }
        button { margin-left: 5px; padding: 8px 12px; border: none; background: #2196f3; color: white; border-radius: 6px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div id="root"></div>

      <!-- React + Babel -->
      <script src="https://unpkg.com/react@17/umd/react.development.js"></script>
      <script src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
      <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>

      <script type="text/babel">
        function ChatApp() {
          const [messages, setMessages] = React.useState([]);
          const [input, setInput] = React.useState("");
          const wsRef = React.useRef(null);

          React.useEffect(() => {
            const ws = new WebSocket("ws://" + window.location.host);
            wsRef.current = ws;

            ws.onmessage = (event) => {
              const data = JSON.parse(event.data);
              setMessages(data.messages);
            };

            return () => ws.close();
          }, []);

          const sendMessage = () => {
            if(input.trim() !== ""){
              wsRef.current.send(JSON.stringify({ text: input }));
              setInput("");
            }
          };

          return (
            <div className="chat-box">
              <div className="messages">
                {messages.map((msg, i) => (
                  <div key={i} className="msg">{msg}</div>
                ))}
              </div>
              <div className="input-area">
                <input 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()} 
                  placeholder="Type a message..." 
                />
                <button onClick={sendMessage}>Send</button>
              </div>
            </div>
          );
        }

        ReactDOM.render(<ChatApp />, document.getElementById("root"));
      </script>
    </body>
  </html>
  `);
});

// WebSocket logic
wss.on("connection", (ws) => {
  // send history to new user
  ws.send(JSON.stringify({ messages }));

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);
    messages.push(data.text);
    if (messages.length > 50) messages.shift(); // keep latest 50 messages

    // broadcast to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ messages }));
      }
    });
  });
});

server.listen(3000, () => console.log("Server runninhttp://localhost:3000"));