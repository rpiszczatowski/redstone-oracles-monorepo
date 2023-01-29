import { Contract, PopulatedTransaction } from "ethers";
import { addContractWait } from "../helpers/add-contract-wait";

import {
    DataPackage,
    SignedDataPackage,
    RedstonePayload,
  } from "redstone-protocol";
  import {
    MockSignerAddress,
    getMockSignerPrivateKey,
  } from "../helpers/test-utils";
  import { BaseWrapper } from "./BaseWrapper";
  import { version } from "../../package.json";
  
  export interface MockDataPackageConfig {
    signer: MockSignerAddress;
    dataPackage: DataPackage;
  }
  
  export class MockStorageProxyWrapper extends BaseWrapper {
    constructor(private mockDataPackages: MockDataPackageConfig[]) {
      super();
    }
  
    getUnsignedMetadata(): string {
      return `${version}#mock`;
    }
  
    async dryRunToVerifyPayload(payloads: string[]): Promise<string> {
      return payloads[0];
    }
  
    async getBytesDataForAppending(): Promise<string> {
      const signedDataPackages: SignedDataPackage[] = [];
  
      for (const mockDataPackage of this.mockDataPackages) {
        const privateKey = getMockSignerPrivateKey(mockDataPackage.signer);
        const signedDataPackage = mockDataPackage.dataPackage.sign(privateKey);
        signedDataPackages.push(signedDataPackage);
      }
  
      const unsignedMetadata = this.getUnsignedMetadata();
  
      return RedstonePayload.prepare(signedDataPackages, unsignedMetadata);
    }

    override overwriteEthersContract(contract: Contract): Contract{

        const wrapper = this;
        const contractPrototype = Object.getPrototypeOf(contract);
        const wrappedContract = Object.assign(
          Object.create(contractPrototype),
          contract
        );
    
        const functionNames: string[] = Object.keys(contract.functions);
        functionNames.forEach((functionName) => {
          if (functionName.indexOf("(") == -1) {
            const isCall = contract.interface.getFunction(functionName).constant;
    
            (wrappedContract[functionName] as any) = async function (
              ...args: any[]
            ) {
              const tx = await contract.populateTransaction[functionName](...args);
    
              // Appending redstone data to the transaction calldata
              const dataToAppend = await wrapper.getBytesDataForAppending();
              tx.data = tx.data + dataToAppend;

              if (functionName.indexOf("DryRun") != -1) {
                const result = await contract.provider.call(tx);
                const decoded = contract.interface.decodeFunctionResult(
                  functionName,
                  result
                );
                return decoded.length == 1 ? decoded[0] : decoded;
              }
    
              else if (isCall) {
                const result = await contract.signer.call(tx);
                const decoded = contract.interface.decodeFunctionResult(
                  functionName,
                  result
                );
                return decoded.length == 1 ? decoded[0] : decoded;
              } else {
                const sentTx = await contract.signer.sendTransaction(tx);
    
                // Tweak the tx.wait so the receipt has extra properties
                addContractWait(contract, sentTx);
    
                return sentTx;
              }
            };
          }
        });
    
        return wrappedContract; return contract;
    }
  }
  