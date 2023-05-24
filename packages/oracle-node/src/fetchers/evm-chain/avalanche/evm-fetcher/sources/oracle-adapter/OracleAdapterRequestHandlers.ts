import { Decimal } from "decimal.js";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-prices";
import { oracleAdapterContractsDetails } from ".";
import { MulticallParsedResponses } from "../../../../../../types";
import { TEN_AS_BASE_OF_POWER } from "../../../../shared/contants";

export type OracleAdapterDetailsKeys =
  keyof typeof oracleAdapterContractsDetails;

const ORACLE_ADAPTER_PRICE_PRECISION = 8;

export class OracleAdapterRequestHandlers implements IEvmRequestHandlers {
  prepareMulticallRequest(id: OracleAdapterDetailsKeys) {
    const { abi, address } = oracleAdapterContractsDetails[id];
    const functionsNamesWithValues = [{ name: "latestAnswer" }];
    return buildMulticallRequests(abi, address, functionsNamesWithValues);
  }

  extractPrice(
    response: MulticallParsedResponses,
    id: OracleAdapterDetailsKeys
  ): number | undefined {
    const { address } = oracleAdapterContractsDetails[id];
    const latestAnswer = new Decimal(
      extractValueFromMulticallResponse(response, address, "latestAnswer")
    );
    const decimalDivider = new Decimal(TEN_AS_BASE_OF_POWER).toPower(
      ORACLE_ADAPTER_PRICE_PRECISION
    );
    const latestAnswerSerialized = latestAnswer.div(decimalDivider);
    return latestAnswerSerialized.toNumber();
  }
}
