import WebSocket from "ws";
import { websocketMockClient } from "./mocks/websocket-mock-client";
import { WebSocketFetcher } from "../../src/fetchers/base-websocket-fetcher/WebSocketFetcher";
import { WebSocketClientOptions } from "../../src/fetchers/base-websocket-fetcher/WebSocketClient";

jest.mock("../../src/fetchers/base-websocket-fetcher/WebSocketClient", () => {
  return {
    WebSocketClient: jest.fn().mockImplementation(() => websocketMockClient),
  };
});

type Response = {
  id: string;
  price: number;
};

type Request = {
  id: string;
};

class ConcreteWebSocketFetcher extends WebSocketFetcher<Request, Response> {
  constructor(
    name: string,
    wsClientOptions: WebSocketClientOptions,
    pendingResponseTimoutMs: number
  ) {
    super(name, wsClientOptions, pendingResponseTimoutMs);
  }

  getPriceFromResponse(response: Response) {
    return response.price;
  }

  prepareWsRequest(dataFeedId: string) {
    return { id: dataFeedId };
  }

  extractRequestIdFromRequest(wsRequest: Request) {
    return wsRequest.id;
  }

  extractRequestIdFromResponse(wsResponse: Response) {
    return wsResponse.id;
  }

  serializeRequest(wsRequest: Request) {
    return JSON.stringify(wsRequest);
  }

  parseResponse(data: WebSocket.Data) {
    return JSON.parse(data.toString());
  }

  checkResponseOkUnlessThrow(response: Response) {}
}

describe("WebSocketFetcher", () => {
  const wsClientOptions = { url: "wss://example.com" };
  const pendingResponseTimoutMs = 1000;

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("makeRequest resolves the correct request", async () => {
    const dataFeedId = "123";
    const response = { id: "123", price: 42, ok: true };

    let onResponse = (data: any) => {};
    websocketMockClient.onResponse = jest
      .fn()
      .mockImplementation((callback) => {
        onResponse = callback;
      });

    const fetcher = new ConcreteWebSocketFetcher(
      "test-fetcher",
      wsClientOptions,
      pendingResponseTimoutMs
    );

    websocketMockClient.sendMessage = jest
      .fn()
      .mockImplementation((message) => {
        onResponse(JSON.stringify(response));
      });

    const promise = fetcher.makeRequest(dataFeedId);

    await expect(promise).resolves.toEqual(response);
  });

  test("makeRequest resolves with response within timeout", async () => {
    const dataFeedId = "123";
    const response = { id: "123", price: 42, ok: true };

    let onResponse = (data: any) => {};
    websocketMockClient.onResponse = jest
      .fn()
      .mockImplementation((callback) => {
        onResponse = callback;
      });

    const fetcher = new ConcreteWebSocketFetcher(
      "test-fetcher",
      wsClientOptions,
      pendingResponseTimoutMs
    );

    websocketMockClient.sendMessage = jest
      .fn()
      .mockImplementation((message) => {
        // simulate a delay in the response
        setTimeout(() => onResponse(JSON.stringify(response)), 500);
      });

    const promise = fetcher.makeRequest(dataFeedId);

    await expect(promise).resolves.toEqual(response);
  });

  test("makeRequest rejects on timeout", async () => {
    const dataFeedId = "123";
    const response = { id: "123", price: 42, ok: true };

    let onResponse = (data: any) => {};
    websocketMockClient.onResponse = jest
      .fn()
      .mockImplementation((callback) => {
        onResponse = callback;
      });

    const fetcher = new ConcreteWebSocketFetcher(
      "test-fetcher",
      wsClientOptions,
      pendingResponseTimoutMs
    );

    websocketMockClient.sendMessage = jest
      .fn()
      .mockImplementation((message) => {
        // simulate a delay in the response
        setTimeout(
          () => onResponse(JSON.stringify(response)),
          pendingResponseTimoutMs + 100
        );
      });

    const promise = fetcher.makeRequest(dataFeedId);

    await expect(promise).rejects.toThrow(
      `Request timed out after ${pendingResponseTimoutMs}ms`
    );
  });
});
