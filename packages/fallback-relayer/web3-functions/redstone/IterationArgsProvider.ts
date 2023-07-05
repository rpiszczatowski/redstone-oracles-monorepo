import { Web3FunctionUserArgs } from "@gelatonetwork/web3-functions-sdk";
import { Contract, providers } from "ethers";
import {
  getAbiForAdapter,
  getIterationArgs,
  IRedstoneAdapter,
  IterationConfig,
  UpdatePricesArgs,
} from "redstone-on-chain-relayer";
import {
  IterationArgs,
  IterationArgsProviderInterface,
} from "../IterationArgsProviderInterface";

export class IterationArgsProvider
  implements IterationArgsProviderInterface<UpdatePricesArgs>
{
  async getArgs(
    userArgs: Web3FunctionUserArgs,
    provider: providers.StaticJsonRpcProvider
  ): Promise<IterationArgs<UpdatePricesArgs>> {
    const abi = getAbiForAdapter(
      userArgs.adapterContractType as unknown as string
    );

    const adapterContract = new Contract(
      userArgs.adapterContractAddress as unknown as string,
      abi,
      provider
    ) as IRedstoneAdapter;

    userArgs.minDeviationPercentage =
      (userArgs.minDeviationPermillage as number) / 10;

    return await getIterationArgs(
      userArgs as unknown as IterationConfig,
      adapterContract
    );
  }

  async getTransactionData({
    adapterContract,
    wrapContract,
    proposedTimestamp,
  }: UpdatePricesArgs): Promise<string | undefined> {
    const wrappedContract = wrapContract(adapterContract);

    const { data } =
      await wrappedContract.populateTransaction.updateDataFeedsValues(
        proposedTimestamp
      );

    return data;
  }
}
