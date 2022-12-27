import { SignedDataPackage } from "redstone-protocol";
import { Broadcaster } from "../Broadcaster";
// @ts-ignore  
import { evmSignature } from "warp-contracts-plugin-signature/server"
import { Wallet } from "ethers";
import { Contract, WarpFactory } from 'warp-contracts';

export class WarpBroadcaster implements Broadcaster {
    private readonly contract: Contract;

    constructor(
        private readonly contractAddress: string,
        private readonly evmPrivateKey: string
    ) {
        const signer = evmSignature(new Wallet(this.evmPrivateKey))
        const warp = WarpFactory.forMainnet();
        this.contract = warp
            .contract(this.contractAddress)
            .setEvaluationOptions({ useKVStorage: true })
            .connect({
                signer,
                type: 'ethereum'
            });
    }

    async broadcast(signedDataPackages: SignedDataPackage[]): Promise<void> {
        // pop big data package
        signedDataPackages.pop();

        const profiles = signedDataPackages
            .filter(
                dataPackage => {
                    const data = dataPackage.toObj();

                    // should never happen only single data source
                    if (data.dataPoints.length !== 1) {
                        return false;
                    }

                    // omit errors
                    if (data.dataPoints[0].value === 'error') {
                        return false;
                    }

                    return true;
                }
            )
            .map(
                dataPackage => {
                    const data = dataPackage.toObj();

                    const owner = Buffer.from(data.dataPoints[0].value.toString(), 'base64').toString();

                    return {
                        profileId: data.dataPoints[0].dataFeedId,
                        owner
                    }
                }
            )

        if (profiles.length > 0) {
            try {
                await this.contract.writeInteraction(
                    { function: 'newProfiles', profiles },
                    { strict: true }
                );
            } catch (e) {
                console.error(e);
            }
        }
    }

}
