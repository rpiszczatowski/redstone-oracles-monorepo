import { IEvmRequestHandlers } from "../IEvmRequestHandlers";

export type Class<T, R = unknown> = new (args: Record<string, R>) => T;

export const buildRequestHandlersFromContractDetails = <T>(
  contractDetails: Record<string, T>,
  evmRequestHandlers: Class<IEvmRequestHandlers, T>
) =>
  Object.keys(contractDetails).reduce(
    (obj, id) => {
      obj[id] = new evmRequestHandlers(contractDetails);
      return obj;
    },
    {} as Record<string, IEvmRequestHandlers>
  );
