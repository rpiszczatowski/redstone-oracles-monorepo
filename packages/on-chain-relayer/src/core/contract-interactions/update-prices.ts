import { TransactionResponse } from "@ethersproject/providers";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { Contract } from "ethers";
import { DataPackagesResponse } from "redstone-sdk";
import { config } from "../../config";
import {
  MentoContracts,
  prepareLinkedListLocationsForMentoAdapterReport,
} from "../../custom-integrations/mento/mento-utils";

import { getSortedOraclesContractAtAddress } from "./get-contract";

interface UpdatePricesArgs {
  adapterContract: Contract;
  wrappedAdapterContract: Contract;
  proposedRound: number;
  proposedTimestamp: number;
}

const TX_CONFIG = { gasLimit: config.gasLimit };

// TODO: refactor this function
export const updatePrices = async (
  dataPackages: DataPackagesResponse,
  adapterContract: Contract,
  lastUpdateTimestamp: number,
  lastRound: number
): Promise<void> => {
  const dataPackagesTimestamps = Object.values(dataPackages).flatMap(
    (dataPackages) =>
      dataPackages.map(
        (dataPackage) => dataPackage.dataPackage.timestampMilliseconds
      )
  );
  const minimalTimestamp = Math.min(...dataPackagesTimestamps);
  const wrappedAdapterContract =
    WrapperBuilder.wrap(adapterContract).usingDataPackages(dataPackages);

  if (lastUpdateTimestamp >= minimalTimestamp) {
    console.log("Cannot update prices, proposed prices are not newer");
  } else {
    const updatePricesArgs: UpdatePricesArgs = {
      adapterContract,
      wrappedAdapterContract,
      proposedTimestamp: minimalTimestamp,
      proposedRound: lastRound + 1,
    };

    // TODO: improve handling of undefined functions
    const txBuilderFunctions: {
      [adapterType: string]: (
        args: UpdatePricesArgs
      ) => Promise<TransactionResponse>;
    } = {
      "price-feeds": updatePricesInPriceFeedsAdapter,
      mento: updatePricesInMentoAdapter,
    };

    const updateTx = await txBuilderFunctions[config.adapterContractType](
      updatePricesArgs
    );
    console.log(`Update prices tx sent: ${updateTx.hash}`);
    await updateTx.wait();
    console.log(`Successfully updated prices: ${updateTx.hash}`);
  }
};

const updatePricesInPriceFeedsAdapter = async ({
  wrappedAdapterContract,
  proposedRound,
  proposedTimestamp,
}: UpdatePricesArgs): Promise<TransactionResponse> => {
  return await wrappedAdapterContract.updateDataFeedsValues(
    proposedRound,
    proposedTimestamp,
    TX_CONFIG
  );
};

const updatePricesInMentoAdapter = async ({
  adapterContract,
  wrappedAdapterContract,
  proposedRound,
  proposedTimestamp,
}: UpdatePricesArgs): Promise<TransactionResponse> => {
  const sortedOraclesAddress = await adapterContract.sortedOracles();
  const sortedOracles = getSortedOraclesContractAtAddress(sortedOraclesAddress);
  const linkedListPositions = prepareLinkedListLocationsForMentoAdapterReport({
    mentoAdapter: adapterContract,
    wrappedMentoAdapter: wrappedAdapterContract,
    sortedOracles,
  } as MentoContracts);

  return await wrappedAdapterContract.updatePriceValueAndCleanOldReports(
    proposedRound,
    proposedTimestamp,
    linkedListPositions
  );
};
