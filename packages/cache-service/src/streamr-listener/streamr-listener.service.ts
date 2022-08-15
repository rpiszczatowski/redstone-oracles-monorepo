import { Injectable } from "@nestjs/common";
import { getOracleRegistryState } from "redstone-sdk";
import { StreamrClient, Subscription } from "streamr-client";
import { DataPackage } from "../data-packages/data-packages.model";
import { DataPackagesService } from "../data-packages/data-packages.service";

interface StreamrSubscriptions {
  [nodeEvmAddress: string]: Subscription;
}

@Injectable()
export class StreamrListenerService {
  constructor(
    private dataPackageService: DataPackagesService,
    private streamrClient: StreamrClient = new StreamrClient(),
    private subscriptionsState: StreamrSubscriptions = {}
  ) {}

  async syncStreamrListening() {
    const oracleRegistryState = await getOracleRegistryState();
    const nodeEvmAddresses = Object.values(oracleRegistryState.nodes).map(
      ({ evmAddress }) => evmAddress
    );

    // Start listening to new nodes' streams
    for (const nodeEvmAddress of nodeEvmAddresses) {
      if (this.subscriptionsState[nodeEvmAddress] === undefined) {
        this.listenToNodeStream(nodeEvmAddress);
      }
    }

    // Stop listening to removed nodes' streams
    for (const subscribedNodeEvmAddress of Object.keys(
      this.subscriptionsState
    )) {
      const nodeIsRegistered = nodeEvmAddresses.some(
        (address) =>
          address.toLowerCase() === subscribedNodeEvmAddress.toLowerCase()
      );
      if (!nodeIsRegistered) {
        this.cancelListeningToNodeStream(subscribedNodeEvmAddress);
      }
    }
  }

  async listenToNodeStream(nodeEvmAddress: string) {
    // TODO: move the logic of stream id creation to redstone-sdk
    const streamId = `${nodeEvmAddress}/redstone-oracles`;

    const subscription = await this.streamrClient.subscribe(
      streamId,
      async (message: string) => {
        try {
          const dataPackagesToSave =
            await this.dataPackageService.prepareReceivedDataPackagesForBulkSaving(
              JSON.parse(message),
              nodeEvmAddress
            );
          console.log(`Data packages parsed for node: ${nodeEvmAddress}`);
          await DataPackage.insertMany(dataPackagesToSave);
          console.log(
            `Saved ${dataPackagesToSave.length} data packages for node: ${nodeEvmAddress}`
          );
        } catch (e) {
          console.error(e);
        }
      }
    );
    this.subscriptionsState[nodeEvmAddress] = subscription;
  }

  async cancelListeningToNodeStream(nodeEvmAddress: string) {
    const subscription = this.subscriptionsState[nodeEvmAddress];
    if (!!subscription) {
      await this.streamrClient.unsubscribe(subscription);
      delete this.subscriptionsState[nodeEvmAddress];
    }
  }
}
