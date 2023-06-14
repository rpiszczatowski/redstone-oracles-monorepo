import * as hardhat from "hardhat";

export async function deployCounter() {
  const ContractFactory = await hardhat.ethers.getContractFactory("Counter");
  const contract = await ContractFactory.deploy();
  await contract.deployed();
  return contract;
}

export const RPC_ERROR_CODES = {
  invalidInput: -32000,
  resourceNotFound: -32001,
  resourceUnavailable: -32002,
  transactionRejected: -32003,
  methodNotSupported: -32004,
  limitExceeded: -32005,
  parse: -32700,
  invalidRequest: -32600,
  methodNotFound: -32601,
  invalidParams: -32602,
  internal: -32603,
};
