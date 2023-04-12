import { utils } from "ethers";
import { priceFeedAddresses } from "../config/price-feed-addresses";
import { getNumberFromStarknet } from "../starknet/IPriceManagerContractAdapter";
import { ContractConnectorFactory } from "../starknet/ContractConnectorFactory";

(async () => {
  for (const feedAddress of [priceFeedAddresses.BTC, priceFeedAddresses.ETH]) {
    try {
      const latestRoundData = await (
        await ContractConnectorFactory.makePriceFeedContractConnector(
          feedAddress
        ).getAdapter()
      ).readLatestRoundData();

      const price = utils.formatUnits(
        getNumberFromStarknet(latestRoundData.answer),
        8
      );

      console.log(price);
    } catch (e) {
      console.error(e);
    }
  }
})();
