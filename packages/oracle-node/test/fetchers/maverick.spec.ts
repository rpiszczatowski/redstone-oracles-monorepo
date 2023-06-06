import { MockContract, MockProvider } from "ethereum-waffle";
import { deployMockContract } from "@ethereum-waffle/mock-contract";
import { MaverickFetcher } from "../../src/fetchers/maverick/MaverickFetcher";
import { saveMockPriceInLocalDb } from "./_helpers";
import {
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";
import { BigNumber } from "ethers";
import { MAVERICK_POOL_INFORMATION_ABI } from "../../src/fetchers/maverick/pool-information.abi";

describe("Maverick", () => {
  let mockContract: MockContract;
  let provider: MockProvider;

  beforeAll(async () => {
    setupLocalDb();
    provider = new MockProvider();
    const [wallet] = provider.getWallets();
    mockContract = await deployMockContract(
      wallet,
      MAVERICK_POOL_INFORMATION_ABI
    );
    // sample data taken from https://etherscan.io/address/0xadc6ced7666779ede88e82c95e363450ac59bfd3#readContract#F5 0x991322eE666ec384eEb31bbD97b4DC0C2DF14ce1
    await mockContract.mock.getSqrtPrice.returns(
      BigNumber.from("1010994351122103028")
    );
  });

  beforeEach(async () => {
    await clearPricesSublevel();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  test("Should properly fetch data", async () => {
    const fetcher = new MaverickFetcher({
      poolInformationAddress: mockContract.address,
      provider: provider,
      tokens: {
        SWETH: {
          poolAddress: mockContract.address,
          pairedToken: "WETH",
        },
      },
    });

    await saveMockPriceInLocalDb(1850, "ETH");

    const result = await fetcher.fetchAll(["SWETH"]);

    expect(result).toEqual([{ symbol: "SWETH", value: 1890.902719301484 }]);
  });
});
