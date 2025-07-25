/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedListener,
  TypedContractMethod,
} from "../../../common";

export interface IUniswapV3QuoterInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "quoteExactInput"
      | "quoteExactInputSingle"
      | "quoteExactOutputSingle"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "quoteExactInput",
    values: [BytesLike, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "quoteExactInputSingle",
    values: [AddressLike, AddressLike, BigNumberish, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "quoteExactOutputSingle",
    values: [AddressLike, AddressLike, BigNumberish, BigNumberish, BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "quoteExactInput",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "quoteExactInputSingle",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "quoteExactOutputSingle",
    data: BytesLike
  ): Result;
}

export interface IUniswapV3Quoter extends BaseContract {
  connect(runner?: ContractRunner | null): IUniswapV3Quoter;
  waitForDeployment(): Promise<this>;

  interface: IUniswapV3QuoterInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  quoteExactInput: TypedContractMethod<
    [path: BytesLike, amountIn: BigNumberish],
    [bigint],
    "nonpayable"
  >;

  quoteExactInputSingle: TypedContractMethod<
    [
      tokenIn: AddressLike,
      tokenOut: AddressLike,
      fee: BigNumberish,
      amountIn: BigNumberish,
      sqrtPriceLimitX96: BigNumberish
    ],
    [bigint],
    "nonpayable"
  >;

  quoteExactOutputSingle: TypedContractMethod<
    [
      tokenIn: AddressLike,
      tokenOut: AddressLike,
      fee: BigNumberish,
      amountOut: BigNumberish,
      sqrtPriceLimitX96: BigNumberish
    ],
    [bigint],
    "nonpayable"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "quoteExactInput"
  ): TypedContractMethod<
    [path: BytesLike, amountIn: BigNumberish],
    [bigint],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "quoteExactInputSingle"
  ): TypedContractMethod<
    [
      tokenIn: AddressLike,
      tokenOut: AddressLike,
      fee: BigNumberish,
      amountIn: BigNumberish,
      sqrtPriceLimitX96: BigNumberish
    ],
    [bigint],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "quoteExactOutputSingle"
  ): TypedContractMethod<
    [
      tokenIn: AddressLike,
      tokenOut: AddressLike,
      fee: BigNumberish,
      amountOut: BigNumberish,
      sqrtPriceLimitX96: BigNumberish
    ],
    [bigint],
    "nonpayable"
  >;

  filters: {};
}
