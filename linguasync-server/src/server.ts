import dotenv from 'dotenv';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { LingoMCP } from './mcp-client';
import http from 'http';

dotenv.config({ path: '../.env' });

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// 1. Initialize Strict MCP Client
const mcp = new LingoMCP();

// 2. Data Structures
// In a real app, use Redis. Here, memory.
const sockets = new Map<string, WebSocket>(); // socketId -> WS
const userLangs = new Map<string, string>(); // socketId -> 'en-US'

// Document storage (single shared document for demo)
interface DocumentState {
  originalContent: string;
  originalLang: string;
  lastEditor: string;
  lastUpdate: number;
}

const sharedDocument: DocumentState = {
  originalContent: '',
  originalLang: '',
  lastEditor: '',
  lastUpdate: Date.now()
};

// 3. Application Logic
async function startServer() {
  try {
    // STARTUP GATE: Block server boot until MCP connects
    await mcp.connect();

    // Only listen if MCP is healthy
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`[Server] Listening on port ${PORT}`);
      console.log(`[Server] Lingo.dev Integration: ACTIVE`);
    });

  } catch (error) {
    console.error(' [CRITICAL STARTUP FAILURE] ');
    console.error(error);
    process.exit(1); // Hard crash if Lingo is down
  }
}

// 4. WebSocket Flow
wss.on('connection', (ws: WebSocket) => {
    const socketId = 'sock_' + Math.random().toString(36).substr(2, 9);
    sockets.set(socketId, ws);
    
    
    // CRITICAL: Unconditional MCP readiness broadcast
    const mcpReadyPayload = JSON.stringify({ type: 'MCP_READY' });
    console.log(`[WS] Client connected: ${socketId}`);
     ws.send(JSON.stringify({
      type: 'INIT',
      socketId
     }));
    ws.send(mcpReadyPayload);
    console.log(`[WS] Sent MCP_READY to ${socketId}`);
    console.log(`[Backend] MCP_READY broadcast sent to clients`);

    ws.on('message', async (data) => {
        try {
            const msg = JSON.parse(data.toString());
            console.log(`[WS] Message from ${socketId}:`, msg.type);
            
            if (msg.type === 'join') {
                userLangs.set(socketId, msg.lang);
                console.log(`[WS] ${socketId} joined with lang: ${msg.lang}`);
                const confirmPayload = JSON.stringify({ type: 'JOIN_CONFIRMED', lang: msg.lang });
                ws.send(confirmPayload);
                console.log(`[WS] Sent JOIN_CONFIRMED to ${socketId}`);
            }

            if (msg.type === 'doc_edit') {
                // Handle document editing
                const sourceLang = userLangs.get(socketId) || 'en-US';
                const content = JSON.parse(msg.content).content;
                const docId = JSON.parse(msg.content).docId;

                console.log(`[WS] Document edit from ${socketId} (${sourceLang}): "${content.substring(0, 50)}..."`);

                // Update document state
                sharedDocument.originalContent = content;
                sharedDocument.originalLang = sourceLang;
                sharedDocument.lastEditor = socketId;
                sharedDocument.lastUpdate = Date.now();

                // Broadcast to all subscribers with per-recipient translation
                const targetSocketIds = Array.from(sockets.keys());
                
                for (const targetId of targetSocketIds) {
                    const targetWs = sockets.get(targetId);
                    const targetLang = userLangs.get(targetId) || 'en-US';

                    if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                        // Per-recipient translation
                        const translations = await mcp.routeText(content, sourceLang, [targetLang]);
                        const translatedContent = translations[targetLang] || content;

                        console.log(`[WS] → ${targetId} (${targetLang}): "${translatedContent.substring(0, 50)}..."`);

                        targetWs.send(JSON.stringify({
                            type: 'msg',
                            id: 'doc_' + Date.now() + '_' + targetId,
                            sender: socketId,
                            content: translatedContent,
                            targetLang: targetLang,
                            sourceLang: sourceLang
                        }));
                    }
                }
                console.log(`[WS] Document update broadcast complete`);
            }

            if (msg.type === 'chat') {
                const sourceLang = userLangs.get(socketId) || 'en-US';
                const senderText = msg.content;
                const targetSocketIds = Array.from(sockets.keys());

                console.log(`[WS] Processing message from ${socketId} (${sourceLang}): "${senderText}"`);
                console.log(`[WS] Broadcasting to ${targetSocketIds.length} recipients with per-user translation`);

                // Translate individually for EACH recipient
                for (const targetId of targetSocketIds) {
                    const targetWs = sockets.get(targetId);
                    const targetLang = userLangs.get(targetId) || 'en-US';

                    if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                        // Per-recipient translation via Lingo.dev MCP
                        const translations = await mcp.routeText(senderText, sourceLang, [targetLang]);
                        const translatedText = translations[targetLang] || senderText;

                        console.log(`[WS] → ${targetId} (${targetLang}): "${translatedText}"`);

                        targetWs.send(JSON.stringify({
                            type: 'msg',
                            id: 'msg_' + Date.now() + '_' + targetId,
                            sender: socketId,
                            content: translatedText,
                            targetLang: targetLang,
                            sourceLang: sourceLang
                        }));
                    }
                }
                console.log(`[WS] Per-recipient translation complete`);
            }

        } catch (e) {
            console.error(`[WS] Message handling error for ${socketId}:`, e);
        }
    });

    ws.on('close', () => {
        sockets.delete(socketId);
        userLangs.delete(socketId);
        console.log(`[WS] Client disconnected: ${socketId}`);
    });

    ws.on('error', (err) => {
        console.error(`[WS] WebSocket error for ${socketId}:`, err);
    });
});

startServer();
