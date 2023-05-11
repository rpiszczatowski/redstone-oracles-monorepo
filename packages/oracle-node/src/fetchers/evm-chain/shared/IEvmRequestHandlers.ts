import { MulticallParsedResponses, MulticallRequest } from "../../../types";

export interface IEvmRequestHandlers {
  prepareMulticallRequest(id: string): MulticallRequest[];
  extractPrice(
    response: MulticallParsedResponses,
    id: string
  ): number | undefined;
}
