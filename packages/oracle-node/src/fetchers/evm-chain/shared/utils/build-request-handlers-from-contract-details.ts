import { IEvmRequestHandlers } from "../IEvmRequestHandlers";

type Class<T> = new (...args: any[]) => T;

export const buildRequestHandlersFromContractDetails = (
  contractDetails: Record<string, any>,
  evmRequestHandlers: Class<IEvmRequestHandlers>
) =>
  Object.keys(contractDetails).reduce((obj, id) => {
    obj[id] = new evmRequestHandlers(contractDetails);
    return obj;
  }, {} as Record<string, IEvmRequestHandlers>);
