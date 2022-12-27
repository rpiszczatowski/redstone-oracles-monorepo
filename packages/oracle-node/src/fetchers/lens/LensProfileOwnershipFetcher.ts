import { BlockTag } from "@ethersproject/abstract-provider";
import { Contract, providers } from "ethers";
import { Fetcher, PriceDataFetched } from "../../types";
import { promises as fs, existsSync, writeFileSync, readFileSync } from 'fs';
import * as path from 'path';
import { config } from "../../config";

const LENS_HUB_TESTNET = "0x7582177F9E536aB0b6c721e11f383C326F2Ad1D5";
const LENS_HUB_ABI = [
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];
const BLOCKS_QUERY_RANGE = 500;

export class LensProfileOwnershipFetcher implements Fetcher {

    private readonly name = "lens-profiles";

    static create(polygonProvider: providers.Provider) {
        return new LensProfileOwnershipFetcher(
            new LensHub(polygonProvider),
            new FsBlocksCheckpointer(LENS_HUB_TESTNET)
        )
    }

    constructor(
        private readonly lensHub: LensHub,
        private readonly blockCheckpointer: FsBlocksCheckpointer
    ) {
    }

    getName(): string {
        return this.name;
    }

    // TODO: retry logic
    async fetchAll(): Promise<PriceDataFetched[]> {
        const fromBlock = await this.blockCheckpointer.lastSeen();
        const maxNextBlock = Number(fromBlock) + BLOCKS_QUERY_RANGE;
        const currentBlock = await this.lensHub.currentBlock();
        const toBlock = Math.min(currentBlock, maxNextBlock);

        const occurredEvents = await this.lensHub.fetchProfiles(
            fromBlock,
            toBlock
        );

        await this.blockCheckpointer.checkpoint(toBlock);

        return occurredEvents.map(event => ({
            symbol: event.profileId,
            value: event.to
        }))
    }

}


export class LensHub {
    private readonly contract: Contract;

    constructor(private readonly provider: providers.Provider) {
        this.contract = new Contract(LENS_HUB_TESTNET, LENS_HUB_ABI, this.provider);
    }

    async fetchProfiles(fromBlock: BlockTag, toBlock: BlockTag) {
        const events = await this.contract.queryFilter(
            "Transfer",
            fromBlock,
            toBlock
        )

        return events.map(event => ({
            from: event.args?.from,
            to: event.args?.to,
            profileId: event.args?.tokenId.toHexString()
        }));
    }

    async currentBlock(): Promise<number> {
        return await this.provider.getBlockNumber();
    }
}

export class FsBlocksCheckpointer {
    private filePath: string;

    constructor(contractAddress: string) {
        this.filePath = path.join(config.levelDbLocation, FsBlocksCheckpointer.name, contractAddress);
    }

    async checkpoint(blockNumber: BlockTag) {
        const dir = path.dirname(this.filePath);
        if (!existsSync(dir)) {
            await fs.mkdir(dir, { recursive: true })
        }
        writeFileSync(this.filePath, blockNumber.toString())
    }

    async lastSeen(): Promise<BlockTag> {
        if (!existsSync(this.filePath)) {
            // file has not yet been created so we have not seen any blocks yet
            return 0;
        }
        const blockNumber = Number.parseInt(readFileSync(this.filePath).toString());
        if (isNaN(blockNumber)) {
            throw Error(`file ${this.filePath} is corrupted`);
        }
        return blockNumber;
    }

    async reset() {
        if (existsSync(this.filePath)) {
            await fs.rm(this.filePath, { recursive: true });
        }
    }
}

