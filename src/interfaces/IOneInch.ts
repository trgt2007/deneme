/**
 * 🔄 1inch DEX Aggregator Interface Tanımları
 * 1inch API ile etkileşim için gerekli interface'ler
 */

export interface IOneInchApi {
    getQuote(params: QuoteParams): Promise<QuoteResponse>;
    getSwap(params: SwapParams): Promise<SwapResponse>;
    getTokens(): Promise<TokensResponse>;
    getProtocols(): Promise<ProtocolsResponse>;
}

export interface QuoteParams {
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    protocols?: string;
    fee?: string;
    gasPrice?: string;
    complexityLevel?: string;
    connectorTokens?: string;
    gasLimit?: string;
    mainRouteParts?: string;
    parts?: string;
}

export interface SwapParams extends QuoteParams {
    fromAddress: string;
    slippage: number;
    destReceiver?: string;
    referrerAddress?: string;
    disableEstimate?: boolean;
    allowPartialFill?: boolean;
}

export interface QuoteResponse {
    fromToken: Token;
    toToken: Token;
    toTokenAmount: string;
    fromTokenAmount: string;
    protocols: Protocol[][];
    estimatedGas: number;
}

export interface SwapResponse extends QuoteResponse {
    tx: Transaction;
}

export interface Token {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    logoURI: string;
}

export interface Protocol {
    name: string;
    part: number;
    fromTokenAddress: string;
    toTokenAddress: string;
}

export interface Transaction {
    from: string;
    to: string;
    data: string;
    value: string;
    gasPrice: string;
    gas: string;
}

export interface TokensResponse {
    tokens: { [address: string]: Token };
}

export interface ProtocolsResponse {
    protocols: Protocol[];
}

// 1inch API endpoints
export const ONEINCH_BASE_URL = 'https://api.1inch.dev/swap/v5.2/1';
export const ONEINCH_ENDPOINTS = {
    QUOTE: '/quote',
    SWAP: '/swap',
    TOKENS: '/tokens',
    PROTOCOLS: '/liquidity-sources'
};
