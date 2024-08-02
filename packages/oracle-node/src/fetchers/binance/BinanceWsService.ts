import WebSocket from 'ws';
import { Consola } from 'consola';

// https://developers.binance.com/docs/binance-spot-api-docs/web-socket-api#symbol-price-ticker
export class BinanceWsPriceRequest {
    readonly id: string;
    // Get the latest market price for a symbol
    readonly method: string = "ticker.price";
    readonly params: { symbols: string [] };

    // symbols: e.g. [BNBBTC]
    constructor(id: string, symbols: string[]) {
        this.id = id;
        this.params = { symbols };
    }
}

type BinanceWsRateLimit = {
    rateLimitType: string;
    interval: string;
    intervalNum: number;
    limit: number;
    count: number;
}

export type BinanceWsPriceResult = {
    symbol: string;
    price: string;
}

export type BinanceWsPriceResponseType = {
    id: string;
    status: number;
    result: BinanceWsPriceResult[];
    rateLimits: BinanceWsRateLimit[];
}

// This is stateless service, 1 instance = 1 WS connection.
// WS connection is established after 1st send function call.
// It has auto-reconnect mechanism, no manual re-connection is required.
// Binance disconnects connection after ~24h, re-connect will be done automatically.
export class BinanceWsService {

    private ws?: WebSocket;
    private readonly responseMap: Map<string, {
        resolve: (res: BinanceWsPriceResponseType) => void,
        reject: (reason?: any) => void
    }> = new Map();
    private reconnectAttempts: number = 0;
    private isConnected: boolean = false;
    private isConnecting: boolean = false;
    // when true - don't try to reconnect
    private disconnected: boolean = false;
    private readonly reconnectDelayMs: number = 2000;
    private queue: BinanceWsPriceRequest[] = [];
    private readonly wsUrl: string;

    constructor(private readonly logger: Consola, wsUrl: string) {
        this.wsUrl = wsUrl;
    }

    private connect() {
        if (this.isConnected) {
            this.logger.info('Binance Websocket connect skipped - already connected!');
            return;
        }
        if (this.isConnecting) {
            this.logger.info('Binance Websocket connect skipped - connection attempt in progress!');
            return;
        }
        this.isConnecting = true;
        this.logger.info('Connecting to Binance WebSocket API...');
        this.ws = new WebSocket(this.wsUrl);

        this.ws.on('open', () => {
            this.logger.info('Binance WebSocket connection opened');
            this.isConnected = true;
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            // process messages in queue
            this.queue.forEach((request) => this.sendGetPriceMessage(request));
            this.queue = [];
        });

        // Binance requires that - sends ping request every ~3 minutes
        // Don't remove that!
        this.ws.on('ping', (data) => {
            this.logger.info('Received ping with payload:', data.toString());
            this.ws?.pong(data); // Send pong with the same payload as the ping
        });

        this.ws.on('message', (message) => {
            const messageJson: BinanceWsPriceResponseType = JSON.parse(message.toString());
            this.logger.info('Received message.', messageJson);
            if (this.responseMap.has(messageJson.id)) {
                const response = this.responseMap.get(messageJson.id);
                if (response) {
                    if (messageJson.status === 200) {
                        response.resolve(messageJson);
                    } else {
                        const errorMessage = `Binance response message has unexpected (error) response code: ${messageJson.status}. Response message: ${message}`;
                        this.logger.error(errorMessage, messageJson);
                        response.reject(new Error(errorMessage));
                    }
                }
                this.responseMap.delete(messageJson.id);
            }
        });

        this.ws.on('close', (code: number, reason: string) => {
            this.isConnected = false;
            this.isConnecting = false;
            this.logger.info(`Binance WebSocket connection closed. Code: ${code}, Reason: ${reason}. Proceeding re-connection.`);
            this.handleReconnection();
        });

        this.ws.on('error', (error: Error) => {
            this.isConnected = false;
            this.isConnecting = false;
            this.logger.error(`Binance WebSocket error. Proceeding re-connection.`, error);
            this.handleReconnection();
        });
    }

    private handleReconnection(): void {
        if (this.disconnected) {
            this.logger.info(`Re-connection canceled. Disconnected manually, not proceeding with re-connection.`);
            return;
        }
        if (this.isConnected) {
            this.logger.info(`Re-connection canceled. Already connected.`);
            return;
        }
        this.reconnectAttempts++;
        this.logger.info(`Attempting to reconnect. Attempt: ${this.reconnectAttempts}`);
        setTimeout(() => this.connect(), this.reconnectDelayMs);
    }

    public async send(request: BinanceWsPriceRequest): Promise<BinanceWsPriceResponseType> {
        const resPromise: Promise<BinanceWsPriceResponseType> = new Promise((resolve: (res: BinanceWsPriceResponseType) => void, reject: (reason?: any) => void) => {
            this.responseMap.set(request.id, {resolve, reject});
            // resolve/reject will be done in WS on.message event
        });
        if (this.isConnected) {
            this.logger.info('Sending message: ', request);
            this.sendGetPriceMessage(request);
        } else {
            this.connect();
            this.logger.info(`Not yet connected. Message request added to queue. Will be processed after connection is established. Message:`, request);
            this.queue.push(request);
        }
        return resPromise;
    }

    private sendGetPriceMessage(request: BinanceWsPriceRequest): void {
        this.ws?.send(JSON.stringify(request), () => {
            this.logger.info('Sent websocket request', request);
        });
    }

    // after disconnect, no auto re-connection will be done
    public disconnect(): void {
        if (this.isConnected) {
            this.disconnected = true;
            this.isConnected = false;
            this.ws?.close();
            this.ws?.removeAllListeners();
        }
    }
}