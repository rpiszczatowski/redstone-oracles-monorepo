import { IEvmRequestHandlers } from "../IEvmRequestHandlers";

export const getRequestHandlersForDataFeedId = (
  id: string,
  requestHandlers: Record<string, IEvmRequestHandlers>
) => {
  const requestHandlersForDataFeedId = requestHandlers[id];
  if (!requestHandlersForDataFeedId) {
    throw new Error(`Asset ${id} not supported by multicall builder`);
  }
  return requestHandlersForDataFeedId;
};
