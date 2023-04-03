import { JsonRpcProvider, Provider } from "@ethersproject/providers";
import { Contract, PopulatedTransaction, Signer } from "ethers";
import { ErrorCode } from "@ethersproject/logger";
import { config } from "./config";

export class FallbackContractDecorator {
  constructor(private readonly config: { propagatedErrors: ErrorCode[] }) {}

  decorate(
    contract: Contract,
    providersOrSigners: Signer[] | Provider[]
  ): Contract {
    const contractPrototype = Object.getPrototypeOf(contract);
    const wrappedContract = Object.assign(
      Object.create(contractPrototype),
      contract
    );

    if (providersOrSigners.length < 1) {
      throw new Error("At least one provider should be supplied.");
    }

    const functionNames: string[] = Object.keys(contract.functions);
    functionNames.forEach((functionName) => {
      if (!functionName.includes("(")) {
        this.overwriteFunction({
          contract: wrappedContract,
          functionName,
          providersOrSigners,
        });
      }
    });

    return wrappedContract;
  }

  private overwriteFunction({
    contract,
    functionName,
    providersOrSigners,
  }: {
    contract: Contract;
    providersOrSigners: Provider[] | Signer[];
    functionName: string;
  }) {
    const isCall = contract.interface.getFunction(functionName).constant;
    const isDryRun = functionName.endsWith("DryRun");

    (contract[functionName] as any) = async (...args: any[]) => {
      const tx = await contract.populateTransaction[functionName](...args);

      for (
        let providerIndex = 0;
        providerIndex < providersOrSigners.length;
        providerIndex++
      ) {
        const connectedContract = contract.connect(
          providersOrSigners[providerIndex]
        );
        try {
          return await this.callContract(
            connectedContract,
            tx,
            functionName,
            isDryRun || isCall
          );
        } catch (error: any) {
          this.handleContractCallError(
            error,
            providerIndex,
            providersOrSigners
          );
        }
      }
    };
  }

  private async callContract(
    connectedContract: Contract,
    tx: PopulatedTransaction,
    functionName: string,
    isStaticCall: boolean
  ) {
    if (isStaticCall) {
      const shouldUseSigner = Signer.isSigner(connectedContract.signer);
      const result = await connectedContract[
        shouldUseSigner ? "signer" : "provider"
      ].call(tx);

      const decoded = connectedContract.interface.decodeFunctionResult(
        functionName,
        result
      );

      return decoded.length == 1 ? decoded[0] : decoded;
    } else {
      const sentTx = await connectedContract.signer.sendTransaction(tx);

      return sentTx;
    }
  }

  private handleContractCallError(
    error: any,
    providerIndex: number,
    providersOrSigners: Signer[] | Provider[]
  ) {
    const providerName = extractRpcUrl(providerIndex);

    if (error?.code && this.config.propagatedErrors.includes(error.code)) {
      throw error;
    }

    console.log(
      `Provider ${providerName} failed with error: ${error?.code} ${error.message}`
    );

    const nextProviderOrSigner = providersOrSigners[providerIndex + 1];
    if (!nextProviderOrSigner) {
      throw error;
    }

    const nextProviderName = extractRpcUrl(providerIndex + 1);

    console.log(`Fallback in to next provider ${nextProviderName}.`);
  }
}

const extractRpcUrl = (providerIndex: number): string | undefined => {
  return config.rpcUrls[providerIndex];
};
