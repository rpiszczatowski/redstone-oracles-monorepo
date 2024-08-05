import { WebSocketFetcher } from "../../src/fetchers/WebSocketFetcher";
import WebSocket from "ws";
import { EventEmitter } from "events";
interface MockWebSocket {
  on: jest.Mock;
  emit: jest.Mock;
  send: jest.Mock;
  close: jest.Mock;
  removeAllListeners?: jest.Mock;
  readyState?: number;
}

type Call = [string, jest.Mock];
jest.mock("ws");

describe("WebSocketFetcher", () => {
  let fetcher: WebSocketFetcher;
  let mockWsInstance: MockWebSocket;
  let calls: Call[];
  const url = "ws://example.com";
  const pingIntervalMs = 10000;

  beforeEach(() => {
    fetcher = new WebSocketFetcher(url, pingIntervalMs);
    mockWsInstance = {
      on: jest.fn(),
      emit: jest.fn(),
      send: jest.fn(),
      close: jest.fn(),
      removeAllListeners: jest.fn(),
      readyState: WebSocket.CLOSED,
    };
    (WebSocket as unknown as jest.Mock).mockImplementation(
      () => mockWsInstance
    );
    calls = mockWsInstance.on.mock.calls as unknown as Call[];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize correctly", () => {
    expect(fetcher).toBeInstanceOf(EventEmitter);
  });

  it("should connect to WebSocket", () => {
    fetcher.connect();
    expect(WebSocket).toHaveBeenCalledWith(url);
  });
  it("should handle open event", () => {
    const emitSpy = jest.spyOn(fetcher, "emit");
    fetcher.connect();

    const openHandler = calls.find((call) => call[0] === "open")?.[1];

    if (openHandler) {
      openHandler();
    }

    expect(emitSpy).toHaveBeenCalledWith("open");
  });
  it("should handle message event", () => {
    const emitSpy = jest.spyOn(fetcher, "emit");
    fetcher.connect();

    const messageHandler = calls.find((call) => call[0] === "message")?.[1];
    const data = JSON.stringify({ id: "1", method: "test", params: {} });
    if (messageHandler) {
      messageHandler(data);
    }

    expect(emitSpy).toHaveBeenCalledWith("data", data);
  });

  it("should handle error event", () => {
    const emitSpy = jest.spyOn(fetcher, "emit");
    fetcher.connect();

    const errorHandler = calls.find((call) => call[0] === "error")?.[1];
    const error = new Error("Test error");
    if (errorHandler) {
      try {
        errorHandler(error);
      } catch (e) {
        console.error(e);
      }
    }
    expect(emitSpy).toHaveBeenCalledWith("error", error);
  });

  it("should handle close event", () => {
    const emitSpy = jest.spyOn(fetcher, "emit");
    fetcher.connect();

    const closeHandler = calls.find((call) => call[0] === "close")?.[1];
    if (closeHandler) {
      closeHandler();
    }

    expect(emitSpy).toHaveBeenCalledWith("close");
  });

  it("should send message when WebSocket is open", () => {
    mockWsInstance.readyState = WebSocket.OPEN;

    const message = { id: "1", method: "test", params: {} };
    fetcher.connect();
    fetcher.sendMessage(message);

    expect(mockWsInstance.send).toHaveBeenCalledWith(JSON.stringify(message));
  });

  it("should not send message when WebSocket is not open", () => {
    const message = { id: "1", method: "test", params: {} };
    fetcher.connect();
    fetcher.sendMessage(message);

    expect(mockWsInstance.send).not.toHaveBeenCalled();
  });

  it("should close WebSocket connection", () => {
    fetcher.connect();
    fetcher.close();

    expect(mockWsInstance.close).toHaveBeenCalled();
    expect(mockWsInstance.removeAllListeners).toHaveBeenCalled(); // Ensure removeAllListeners is called
  });
});
