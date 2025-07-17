/**
 * @title OneInchHandler
 * @author Arbitrage Bot System
 * @notice 1inch aggregator protokol entegrasyonu - Stub Implementation
 * @dev API integration, optimal routing ve CHI gas token desteği
 */
import { JsonRpcProvider } from 'ethers';
interface OneInchConfig {
    provider: JsonRpcProvider;
    apiUrl?: string;
    apiKey?: string;
    routerAddress?: string;
    oracleAddress?: string;
    walletAddress?: string;
    burnChi?: boolean;
}
interface OneInchQuoteParams {
    fee?: number;
    gasPrice?: bigint;
    complexityLevel?: number;
    connectorTokens?: string[];
    gasLimit?: bigint;
    mainRouteParts?: number;
    parts?: number;
    protocols?: string[];
    excludeProtocols?: string[];
}
interface OneInchRoute {
    name: string;
    part: number;
    fromTokenAddress: string;
    toTokenAddress: string;
}
interface OneInchToken {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    logoURI?: string;
    tags?: string[];
}
interface SwapParams {
    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    recipient?: string;
    fromAddress?: string;
    slippage?: number;
    protocols?: string[];
    referrerAddress?: string;
    fee?: number;
    gasPrice?: bigint;
    permit?: string;
    burnChi?: boolean;
    complexityLevel?: number;
    connectorTokens?: string[];
    allowPartialFill?: boolean;
    disableEstimate?: boolean;
    gasLimit?: bigint;
}
interface QuoteResult {
    amountOut: bigint;
    priceImpact: number;
    fee: number;
    sqrtPriceX96After: bigint;
    tickAfter: number;
    gasEstimate: bigint;
    route: Array<{
        tokenIn: string;
        tokenOut: string;
        fee: number;
        pool: string;
    }>;
}
/**
 * @class OneInchHandler
 * @notice 1inch aggregator handler sınıfı - Stub Implementation
 * @dev API v5.0 ve on-chain router entegrasyonu
 */
export declare class OneInchHandler {
    private config;
    private logger;
    private mathHelpers;
    private provider;
    private router;
    private oracle;
    private apiClient;
    private chainId;
    private tokenCache;
    private protocolCache;
    private quoteCache;
    private lastApiCall;
    private supportedProtocols;
    private metrics;
    /**
     * @notice OneInchHandler constructor - Stub Implementation
     * @param config Handler konfigürasyonu
     */
    constructor(config: OneInchConfig);
    /**
     * @notice Token çifti için fiyat teklifi alır - Stub Implementation
     * @param tokenIn Giriş token adresi
     * @param tokenOut Çıkış token adresi
     * @param amountIn Giriş miktarı
     * @param params Additional parameters
     * @return Quote result
     */
    getQuote(tokenIn: string, tokenOut: string, amountIn: bigint, params?: OneInchQuoteParams): Promise<QuoteResult | null>;
    /**
     * @notice Multi-path quote alır - Stub Implementation
     * @param path Token path
     * @param amountIn Giriş miktarı
     * @return Quote result
     */
    getQuoteMultihop(path: string[], amountIn: bigint): Promise<QuoteResult | null>;
    /**
     * @notice Swap parametreleri oluşturur - Stub Implementation
     * @param params Swap parameters
     * @return Encoded swap data
     */
    buildSwapTransaction(params: SwapParams): Promise<string>;
    /**
     * @notice Token listesini döndürür - Stub Implementation
     * @return Token list
     */
    getTokenList(): Promise<OneInchToken[]>;
    /**
     * @notice Desteklenen protokolleri döndürür - Stub Implementation
     * @return Protocol list
     */
    getProtocols(): Promise<string[]>;
    /**
     * @notice Token approve transaction oluşturur - Stub Implementation
     * @param tokenAddress Token adresi
     * @param amount Approve miktarı
     * @return Approve transaction data
     */
    buildApproveTransaction(tokenAddress: string, amount?: bigint): Promise<string>;
    /**
     * @notice Token allowance kontrol eder - Stub Implementation
     * @param tokenAddress Token adresi
     * @param walletAddress Wallet adresi
     * @return Current allowance
     */
    checkAllowance(tokenAddress: string, walletAddress: string): Promise<bigint>;
    /**
     * @notice Detaylı route bilgisi ile quote alır - Stub Implementation
     * @param tokenIn Giriş token
     * @param tokenOut Çıkış token
     * @param amountIn Giriş miktarı
     * @param params Quote parameters
     * @return Detailed quote with route info
     */
    getDetailedQuote(tokenIn: string, tokenOut: string, amountIn: bigint, params?: OneInchQuoteParams): Promise<{
        quote: QuoteResult;
        routes: OneInchRoute[];
        protocols: string[];
    } | null>;
    /**
     * @notice CHI gas token integration - Stub Implementation
     * @param enable Enable/disable CHI burning
     */
    enableChiGasToken(enable: boolean): void;
    /**
     * @notice Event monitoring başlatır - Stub Implementation
     * @param callback Event callback
     * @return Unsubscribe function
     */
    subscribeToEvents(callback: (event: any) => void): Promise<() => void>;
    /**
     * @notice Pool adresi döndürür - Stub Implementation
     * @param token0 İlk token
     * @param token1 İkinci token
     * @return Pool address
     */
    getPoolAddress(token0: string, token1: string): Promise<string>;
    /**
     * @notice Rezervleri döndürür - Stub Implementation
     * @param token0 İlk token
     * @param token1 İkinci token
     * @return Null (not applicable for aggregator)
     */
    getReserves(token0: string, token1: string): Promise<any>;
    /**
     * @notice Pool fee döndürür - Stub Implementation
     * @param poolAddress Pool address
     * @return Fee (always 0 for 1inch)
     */
    getPoolFee(poolAddress: string): Promise<number>;
    /**
     * @notice Volume döndürür - Stub Implementation
     * @return Zero (not tracked)
     */
    get24hVolume(token0: string, token1: string): Promise<bigint>;
    /**
     * @notice Total supply döndürür - Stub Implementation
     * @return Zero (not applicable)
     */
    getTotalSupply(token0: string, token1: string): Promise<bigint>;
    /**
     * @notice API client'ı initialize eder - Stub Implementation
     */
    private initializeApiClient;
    /**
     * @notice Contract'ları initialize eder - Stub Implementation
     */
    private initializeContracts;
    /**
     * @notice Chain ID'yi initialize eder - Stub Implementation
     */
    private initializeChainId;
}
export {};
//# sourceMappingURL=OneInchHandler.d.ts.map