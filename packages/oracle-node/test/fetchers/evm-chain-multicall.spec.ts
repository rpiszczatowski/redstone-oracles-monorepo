import { Contract } from "ethers";
import { Interface } from "ethers/lib/utils";
import { deployContract, MockProvider } from "ethereum-waffle";
import { EvmMulticallService } from "../../src/fetchers/evm-chain/shared/EvmMulticallService";
import Multicall2 from "../../src/fetchers/evm-chain/shared/abis/Multicall2.abi.json";
import { extractValueFromMulticallResponse } from "../../src/fetchers/evm-chain/shared/utils/extract-value-from-multicall-response";
import { extractValuesWithTheSameNameFromMulticall } from "../../src/fetchers/evm-chain/shared/utils/extract-values-with-same-name-from-multicall-response";

jest.setTimeout(10000);

describe("EVM chain multicall service", () => {
  let multicallService: EvmMulticallService;
  let multicallContract: Contract;

  beforeEach(async () => {
    const provider = new MockProvider();
    const [wallet] = provider.getWallets();
    multicallContract = await deployContract(wallet, {
      bytecode: Multicall2.bytecode,
      abi: Multicall2.abi,
    });
    multicallService = new EvmMulticallService(
      provider,
      multicallContract.address
    );
  });

  test("Should perform multicall", async () => {
    const blockNumberData = new Interface(Multicall2.abi).encodeFunctionData(
      "getBlockNumber"
    );
    const requests = [
      {
        address: multicallContract.address,
        data: blockNumberData,
        name: "getBlockNumber",
      },
    ];
    const result = await multicallService.performMulticall(requests);
    expect(result).toEqual({
      [multicallContract.address]: [
        {
          getBlockNumber: {
            value:
              "0x0000000000000000000000000000000000000000000000000000000000000001",
            data: "0x42cbb15c",
          },
        },
      ],
    });
  });

  test("Should return undefined value for failed call", async () => {
    const theOneThatFailsData = new Interface(
      Multicall2.abi
    ).encodeFunctionData("theOneThatFails");
    const blockNumberData = new Interface(Multicall2.abi).encodeFunctionData(
      "getBlockNumber"
    );
    const requests = [
      {
        address: multicallContract.address,
        data: theOneThatFailsData,
        name: "theOneThatFails",
      },
      {
        address: multicallContract.address,
        data: blockNumberData,
        name: "getBlockNumber",
      },
    ];

    const result = await multicallService.performMulticall(requests);
    expect(result).toEqual({
      [multicallContract.address]: [
        {
          theOneThatFails: undefined,
        },
        {
          getBlockNumber: {
            value:
              "0x0000000000000000000000000000000000000000000000000000000000000001",
            data: "0x42cbb15c",
          },
        },
      ],
    });
  });

  test("Should properly extract value from multicall response", () => {
    const expectedValue =
      "0x0000000000000000000000000000000000000000000000000000000000000001";
    const response = {
      [multicallContract.address]: [
        {
          getBlockNumber: {
            value: expectedValue,
            data: "0x42cbb15c",
          },
        },
      ],
    };

    const valueExtracted = extractValueFromMulticallResponse(
      response,
      multicallContract.address,
      "getBlockNumber"
    );
    expect(valueExtracted).toBe(expectedValue);
  });

  test("Should properly extract multiple values from multicall response", () => {
    const response = {
      [multicallContract.address]: [
        {
          getBlockNumber: {
            value:
              "0x0000000000000000000000000000000000000000000000000000000000000001",
            data: "0x42cbb112",
          },
        },
        {
          getBlockNumber: {
            value:
              "0x0000000000000000000000000000000000000000000000000000000000000001",
            data: "0x42cbb143",
          },
        },
        {
          getBlockNumber: {
            value:
              "0x0000000000000000000000000000000000000000000000000000000000000002",
            data: "0x42cbb15c",
          },
        },
      ],
    };

    const responses = extractValuesWithTheSameNameFromMulticall(
      response,
      multicallContract.address,
      "getBlockNumber"
    );
    const expectedResponses = [
      {
        data: "0x42cbb112",
        value:
          "0x0000000000000000000000000000000000000000000000000000000000000001",
      },
      {
        data: "0x42cbb143",
        value:
          "0x0000000000000000000000000000000000000000000000000000000000000001",
      },
      {
        data: "0x42cbb15c",
        value:
          "0x0000000000000000000000000000000000000000000000000000000000000002",
      },
    ];
    expect(responses).toEqual(expectedResponses);
  });
});
