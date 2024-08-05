import { WebsocketClient, DefaultLogger } from "binance";
import EventEmitter from "events";
import { z } from "zod";

const ReplyErrorSchema = z.object({
  error: z.object({}),
  id: z.string(),
});

export class WebsocketClientAdapter {
  private readonly innerClient: WebsocketClient;
  private readonly emitter = new EventEmitter();
  constructor(
    options: {
      wsUrl: string;
    },
    logger: typeof DefaultLogger
  ) {
    this.innerClient = new WebsocketClient(options, logger);
  }

  on: WebsocketClient["on"] = (...args) =>
    this.innerClient.on(...(args as Parameters<WebsocketClient["on"]>));

  onReplyError(
    listener: (error: { data: { id: string; error: unknown } }) => void
  ): void {
    this.emitter.on("replyError", listener);
  }

  connectToWsUrl(url: string, wsKey: string): void {
    const ws = this.innerClient.connectToWsUrl(url, wsKey);
    ws.on("message", (data) => {
      const parsedData: unknown = JSON.parse(String(data));
      const result = ReplyErrorSchema.safeParse(parsedData);
      if (result.success) {
        this.emitter.emit("replyError", { data: parsedData });
      }
    });
  }
  tryWsSend(wsKey: string, wsMessage: string): void {
    this.innerClient.tryWsSend(wsKey, wsMessage);
  }

  closeAll(recreate?: boolean): void {
    this.innerClient.closeAll(recreate);
  }

  removeAllListeners(): void {
    this.innerClient.removeAllListeners();
  }
}
