import {
  MultiRequestFetcher,
  RequestIdToResponse,
} from "../MultiRequestFetcher";
import { WebSocketClient, WebSocketClientOptions } from "./WebSocketClient";
import WebSocket from "ws";

export abstract class WebSocketFetcher<
  WsRequestType,
  WsResponseType,
> extends MultiRequestFetcher {
  private readonly webSocketClient: WebSocketClient;
  private readonly pendingResponseTimoutMs: number = 5000;
  private pendingRequests: Map<
    string,
    {
      resolve: (response: WsResponseType) => void;
      reject: (reason?: Error) => void;
    }
  > = new Map();

  protected constructor(
    name: string,
    wsClientOptions: WebSocketClientOptions,
    pendingResponseTimoutMs: number
  ) {
    super(name);

    this.pendingResponseTimoutMs = pendingResponseTimoutMs;
    this.webSocketClient = new WebSocketClient(wsClientOptions);

    this.webSocketClient.onResponse((data: WebSocket.Data) => {
      this.handleResponse(data);
    });
  }

  override makeRequest(dataFeedId: string): Promise<unknown> {
    const request = this.prepareWsRequest(dataFeedId);
    const wsRequestId = this.extractRequestIdFromRequest(request);

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(wsRequestId);
        reject(
          new Error(`Request timed out after ${this.pendingResponseTimoutMs}ms`)
        );
      }, this.pendingResponseTimoutMs);

      this.pendingRequests.set(wsRequestId, {
        resolve: (response: WsResponseType) => {
          clearTimeout(timeoutId);
          resolve(response);
        },
        reject,
      });

      this.webSocketClient.sendMessage(this.serializeRequest(request));
    });
  }

  override extractPrice(
    dataFeedId: string,
    responses: RequestIdToResponse<WsResponseType>
  ): number | undefined {
    const response = responses[dataFeedId];

    if (response === undefined) {
      // TODO: how to handle this case?
      this.logger.error(`No response for data feed ID ${dataFeedId}`);
      return;
    }

    return this.getPriceFromResponse(response);
  }

  // TODO: Do we want to adjust price based on pair token price fluctuations?
  abstract getPriceFromResponse(response: WsResponseType): number;

  private handleResponse(data: WebSocket.Data): void {
    const response = this.parseResponse(data);
    this.checkResponseOkUnlessThrow(response);

    const requestId = this.extractRequestIdFromResponse(response);

    if (this.pendingRequests.has(requestId)) {
      const { resolve } = this.pendingRequests.get(requestId)!;
      this.pendingRequests.delete(requestId);
      resolve(response);
    }
  }

  abstract prepareWsRequest(dataFeedId: string): WsRequestType;
  abstract extractRequestIdFromRequest(wsRequest: WsRequestType): string;
  abstract extractRequestIdFromResponse(wsResponse: WsResponseType): string;
  abstract serializeRequest(wsRequest: WsRequestType): string;
  abstract parseResponse(data: WebSocket.Data): WsResponseType;
  abstract checkResponseOkUnlessThrow(response: WsResponseType): void;
}
