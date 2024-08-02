import WebSocket from 'ws';

export const WS_SERVER_PORT = 1111;

// starts a Websocket server for testing purposes
export const createWsServer = (messageResponse: any): WebSocket.Server => {
    const server = new WebSocket.Server({ port: WS_SERVER_PORT });
    server.on('connection', (ws: any) => {
        ws.on('message', () => {
            ws.send(JSON.stringify(messageResponse));
        });
        ws.on('ping', (data: any) => {
            ws.pong(data);
        });
    });
    return server;
}