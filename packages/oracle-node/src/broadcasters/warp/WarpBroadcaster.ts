import { SignedDataPackage } from "redstone-protocol";
import { Broadcaster } from "../Broadcaster";
// @ts-ignore
import { buildEvmSignature } from "warp-contracts-plugin-signature/server"
import { Wallet } from "ethers";
import { Contract, WarpFactory } from 'warp-contracts';


export class WarpBroadcaster implements Broadcaster {
    private readonly contract: Contract;

    constructor(
        private readonly contractAddress: string,
        private readonly evmPrivateKey: string
    ) {
        const signer = buildEvmSignature(new Wallet(this.evmPrivateKey))
        const warp = WarpFactory.forMainnet();
        this.contract = warp
            .contract(this.contractAddress)
            // @ts-ignore
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
                        throw Error(`failed to broadcast profiles because it contains more than one dataPoints: ${data.dataPoints.length}`);
                    }

                    // throw errors
                    if (data.dataPoints[0].value === 'error') {
                        throw Error(`failed to broadcast new lens profile ${data.dataPoints[0]}, because it contains error`);
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
                );
            } catch (e) {
                console.error(e);
            }
        }
    }

}
