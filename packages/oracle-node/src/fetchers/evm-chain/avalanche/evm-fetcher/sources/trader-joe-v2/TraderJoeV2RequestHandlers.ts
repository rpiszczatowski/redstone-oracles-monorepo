import { Decimal } from "decimal.js";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-value-from-multicall-response";
import { traderJoeV2TokensContractDetails } from "./traderJoeV2TokensContractDetails";
import { MulticallParsedResponses } from "../../../../../../types";

// Price calculation based on https://docs.traderjoexyz.com/guides/price-from-id

const ONE_AS_DECIMAL = new Decimal(1);
const BIN_STEP_DIVIDER = 10000;
const BIN_ID_DEFAULT_SUBTRACTION = 8388608;

export type TraderJoeV2DetailsKeys =
  keyof typeof traderJoeV2TokensContractDetails;

export class TraderJoeV2RequestHandlers implements IEvmRequestHandlers {
  prepareMulticallRequest(id: TraderJoeV2DetailsKeys) {
    const { abi, address } = traderJoeV2TokensContractDetails[id];
    const functionsNamesWithValues = [
      { name: "getActiveId" },
      { name: "getBinStep" },
    ];
    return buildMulticallRequests(abi, address, functionsNamesWithValues);
  }

  extractPrice(
    response: MulticallParsedResponses,
    id: TraderJoeV2DetailsKeys
  ): number | undefined {
    const { address } = traderJoeV2TokensContractDetails[id];
    const binId = new Decimal(
      extractValueFromMulticallResponse(response, address, "getActiveId")
    );
    const binStep = new Decimal(
      extractValueFromMulticallResponse(response, address, "getBinStep")
    );
    const binStepDivided = binStep.div(BIN_STEP_DIVIDER);
    const binStepPlusOne = ONE_AS_DECIMAL.add(binStepDivided);
    const binIdSerialized = binId.minus(BIN_ID_DEFAULT_SUBTRACTION);

    return binStepPlusOne.pow(binIdSerialized).toNumber();
  }
}
