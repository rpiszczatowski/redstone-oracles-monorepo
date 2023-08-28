import { Decimal } from "decimal.js";
import { IEvmRequestHandlers } from "../IEvmRequestHandlers";
import { buildMulticallRequests } from "../utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../utils/extract-value-from-multicall-response";
import { getContractDetailsFromConfig } from "../utils/get-contract-details-from-config";
import { getLastPrice } from "../../../../db/local-db";
import { MulticallParsedResponses } from "../../../../types";
import BeefyVaultAbi from "../abis/BeefyVault.abi.json";

interface BeefyContractDetails {
  address: string;
  tokenToFetch: string;
}

export class BeefyTokensRequestHandlers implements IEvmRequestHandlers {
  constructor(
    private readonly beefyContractDetails: Record<string, BeefyContractDetails>
  ) {}

  prepareMulticallRequest(id: string) {
    const { address } = getContractDetailsFromConfig<
      string,
      BeefyContractDetails
    >(this.beefyContractDetails, id);

    const functionsNamesWithValues = [
      { name: "balance" },
      { name: "totalSupply" },
    ];
    return buildMulticallRequests(
      BeefyVaultAbi,
      address,
      functionsNamesWithValues
    );
  }

  extractPrice(
    response: MulticallParsedResponses,
    id: string
  ): number | undefined {
    const { address, tokenToFetch } = getContractDetailsFromConfig<
      string,
      BeefyContractDetails
    >(this.beefyContractDetails, id);

    const balance = new Decimal(
      extractValueFromMulticallResponse(response, address, "balance")
    );
    const totalSupply = new Decimal(
      extractValueFromMulticallResponse(response, address, "totalSupply")
    );

    const tokenValue = balance.div(totalSupply);
    const tokenToFetchPrice = getLastPrice(tokenToFetch);
    if (tokenToFetchPrice) {
      return tokenValue.mul(tokenToFetchPrice.value).toNumber();
    }
  }
}
