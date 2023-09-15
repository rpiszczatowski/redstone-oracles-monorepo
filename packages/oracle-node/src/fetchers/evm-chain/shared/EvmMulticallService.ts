import { ethers, providers } from "ethers";
import { MulticallRequest, MulticallParsedResponses } from "../../../types";
import Multicall2 from "./abis/Multicall2.abi.json";

export class EvmMulticallService {
  constructor(
    private provider: providers.Provider,
    private multicallContractAddress: string
  ) {}

  async performMulticall(requests: MulticallRequest[]) {
    const multicallContract = new ethers.Contract(
      this.multicallContractAddress,
      Multicall2.abi,
      this.provider
    );
    const responses = (await multicallContract.callStatic.tryAggregate(
      false,
      requests.map(({ address, data }) => [address, data])
    )) as [boolean, string][];
    const parsedResponses: MulticallParsedResponses = {};
    for (let i = 0; i < requests.length; i++) {
      const { name, address } = requests[i];
      const [success, value] = responses[i];

      // omit values which comes from responses with error
      const parsedResponse = { [name]: success ? value : undefined };
      if (!parsedResponses[address]) {
        parsedResponses[address] = [];
      }
      parsedResponses[address]!.push(parsedResponse);
    }
    return parsedResponses;
  }
}
