/* Autogenerated file. Do not edit manually. */

/* tslint:disable */
/* eslint-disable */

/*
  Fuels version: 0.37.1
  Forc version: 0.35.5
  Fuel-Core version: 0.17.3
*/

import type {
  BigNumberish,
  BN,
  BytesLike,
  Contract,
  DecodedValue,
  FunctionFragment,
  Interface,
  InvokeFunction,
} from "fuels";

import type { Vec } from "./common";

export type U256Input = {
  a: BigNumberish;
  b: BigNumberish;
  c: BigNumberish;
  d: BigNumberish;
};
export type U256Output = { a: BN; b: BN; c: BN; d: BN };

interface PricesAbiInterface extends Interface {
  functions: {
    get_prices: FunctionFragment;
    init: FunctionFragment;
    read_prices: FunctionFragment;
    read_timestamp: FunctionFragment;
    write_prices: FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "get_prices",
    values: [Vec<U256Input>, Vec<BigNumberish>]
  ): Uint8Array;
  encodeFunctionData(
    functionFragment: "init",
    values: [Vec<string>, BigNumberish, BigNumberish]
  ): Uint8Array;
  encodeFunctionData(
    functionFragment: "read_prices",
    values: [Vec<U256Input>]
  ): Uint8Array;
  encodeFunctionData(
    functionFragment: "read_timestamp",
    values: []
  ): Uint8Array;
  encodeFunctionData(
    functionFragment: "write_prices",
    values: [Vec<U256Input>, Vec<BigNumberish>]
  ): Uint8Array;

  decodeFunctionData(
    functionFragment: "get_prices",
    data: BytesLike
  ): DecodedValue;
  decodeFunctionData(functionFragment: "init", data: BytesLike): DecodedValue;
  decodeFunctionData(
    functionFragment: "read_prices",
    data: BytesLike
  ): DecodedValue;
  decodeFunctionData(
    functionFragment: "read_timestamp",
    data: BytesLike
  ): DecodedValue;
  decodeFunctionData(
    functionFragment: "write_prices",
    data: BytesLike
  ): DecodedValue;
}

export class PricesAbi extends Contract {
  interface: PricesAbiInterface;
  functions: {
    get_prices: InvokeFunction<
      [feed_ids: Vec<U256Input>, payload: Vec<BigNumberish>],
      [
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output
      ]
    >;
    init: InvokeFunction<
      [
        signers: Vec<string>,
        signer_count_threshold: BigNumberish,
        skip_setting_owner: BigNumberish
      ],
      void
    >;
    read_prices: InvokeFunction<
      [feed_ids: Vec<U256Input>],
      [
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output
      ]
    >;
    read_timestamp: InvokeFunction<[], BN>;
    write_prices: InvokeFunction<
      [feed_ids: Vec<U256Input>, payload: Vec<BigNumberish>],
      [
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output,
        U256Output
      ]
    >;
  };
}
