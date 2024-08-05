/* eslint-disable @typescript-eslint/class-methods-use-this */
import EventEmitter from "events";
import { DI } from "../../src/fetchers/binance-ws/di";
import { WebsocketClientAdapter } from "../../src/fetchers/binance-ws/WebsocketClientAdapter";
import fetchers from "../../src/fetchers/index";

describe("binance-ws fetcher", () => {
  const sut = fetchers["binance-ws"]!;

  it("should properly fetch data", async () => {
    const result = await sut.fetchAll(["BTC", "ETH"]);

    expect(result).toEqual([
      { symbol: "BTC", value: "32228.4" },
      { symbol: "ETH", value: "2008.25" },
    ]);
  });

  it("should properly fetch data in parallel", async () => {
    const result = await Promise.all(
      ["BTC", "ETH"].map((symbol) => sut.fetchAll([symbol]))
    );

    expect(result).toEqual([
      [{ symbol: "BTC", value: "32228.4" }],
      [{ symbol: "ETH", value: "2008.25" }],
    ]);
  });

  it("should handle bad request response", async () => {
    // given
    FakeWebsocketClientAdapter.replyWithError = true;

    // when
    const result = sut.fetchAll(["BTC", "ETH"]);

    // then
    await expect(result).rejects.toThrow("request failed");
  });
});

class FakeWebsocketClientAdapter {
  emitter = new EventEmitter();
  url = "";
  name = "";
  connected = false;
  static replyWithError = false;

  on(eventName: string, callback: (data: unknown) => void) {
    this.emitter.on(eventName, callback);
  }

  onReplyError(callback: (data: unknown) => void) {
    this.emitter.on("replyError", callback);
  }

  connectToWsUrl(url: string, name: string) {
    if (this.connected) {
      throw new Error("Already connected");
    }
    this.url = url;
    this.name = name;
    this.connected = true;
    this.emitter.emit("open");
  }

  tryWsSend(name: string, message: string) {
    if (!this.connected) {
      throw new Error("Not connected");
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsedMessage = JSON.parse(message);
    if (FakeWebsocketClientAdapter.replyWithError) {
      this.emitter.emit("replyError", {
        data: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          id: parsedMessage.id,
          error: {
            code: -32000,
            message: "Internal error",
          },
        },
      });
      return;
    }
    this.emitter.emit("reply", {
      data: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        id: parsedMessage.id,
        result: [
          { symbol: "BTCUSDT", price: "32228.4" },
          { symbol: "ETHUSDT", price: "2008.25" },
        ],
      },
    });
  }
}

DI.WebsocketClientAdapter =
  FakeWebsocketClientAdapter as unknown as typeof WebsocketClientAdapter;
