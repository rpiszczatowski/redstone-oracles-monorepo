import { IEvmRequestHandlers } from "../IEvmRequestHandlers";

export const getRequestHandlersForDataFeedId = (
  id: string,
  requestHandlers: Record<string, IEvmRequestHandlers | undefined>
) => {
  const requestHandlersForDataFeedId = requestHandlers[id];
  if (!requestHandlersForDataFeedId) {
    throw new Error(`Asset ${id} not supported by multicall builder`);
  }
  return requestHandlersForDataFeedId;
};
