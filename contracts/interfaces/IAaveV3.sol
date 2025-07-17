// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IAaveV3
 * @author Arbitrage Bot System
 * @notice Aave V3 protokolü ile etkileşim için gerekli tüm interface tanımlamaları
 * @dev Bu dosya Aave V3'ün core interface'lerini içerir
 */

// ============ Core Interfaces ============

/**
 * @title IPool
 * @notice Aave V3 Pool ana interface'i
 * @dev Flashloan ve temel lending işlemleri için kullanılır
 */
interface IPool {
    /**
     * @notice Flashloan parametreleri için event
     */
    event FlashLoan(
        address indexed target,
        address indexed initiator,
        address indexed asset,
        uint256 amount,
        uint256 premium,
        uint16 referralCode
    );
    
    /**
     * @notice Basit flashloan fonksiyonu (tek asset)
     * @param receiverAddress Flashloan'ı alacak kontrat adresi
     * @param asset Ödünç alınacak token adresi
     * @param amount Ödünç alınacak miktar
     * @param params Callback'e gönderilecek parametreler
     * @param referralCode Referans kodu (genelde 0)
     */
    function flashLoanSimple(
        address receiverAddress,
        address asset,
        uint256 amount,
        bytes calldata params,
        uint16 referralCode
    ) external;
    
    /**
     * @notice Çoklu asset flashloan fonksiyonu
     * @param receiverAddress Flashloan'ı alacak kontrat adresi
     * @param assets Ödünç alınacak token adresleri array'i
     * @param amounts Her token için ödünç alınacak miktarlar
     * @param modes Flash loan modları (0 = flash loan olarak geri öde)
     * @param onBehalfOf Borç kimin adına alınacak (flash loan için address(0))
     * @param params Callback'e gönderilecek parametreler
     * @param referralCode Referans kodu
     */
    function flashLoan(
        address receiverAddress,
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata modes,
        address onBehalfOf,
        bytes calldata params,
        uint16 referralCode
    ) external;
    
    /**
     * @notice Get reserve data from the pool
     * @param asset Token address
     * @return configuration The configuration bitmap
     * @return liquidityIndex The liquidity index
     * @return variableBorrowIndex The variable borrow index
     * @return currentLiquidityRate The current liquidity rate
     * @return currentVariableBorrowRate The current variable borrow rate
     * @return currentStableBorrowRate The current stable borrow rate
     * @return lastUpdateTimestamp The timestamp of the last update
     * @return aTokenAddress The address of the aToken
     * @return stableDebtTokenAddress The address of the stable debt token
     * @return variableDebtTokenAddress The address of the variable debt token
     * @return interestRateStrategyAddress The address of the interest rate strategy
     * @return id The reserve id
     */
    function getReserveData(address asset) external view returns (
        uint256 configuration,
        uint128 liquidityIndex,
        uint128 variableBorrowIndex,
        uint128 currentLiquidityRate,
        uint128 currentVariableBorrowRate,
        uint128 currentStableBorrowRate,
        uint40 lastUpdateTimestamp,
        address aTokenAddress,
        address stableDebtTokenAddress,
        address variableDebtTokenAddress,
        address interestRateStrategyAddress,
        uint8 id
    );
    
    /**
     * @notice Kullanıcı verisini getir
     */
    function getUserAccountData(address user) external view returns (
        uint256 totalCollateralETH,
        uint256 totalDebtETH,
        uint256 availableBorrowsETH,
        uint256 currentLiquidationThreshold,
        uint256 ltv,
        uint256 healthFactor
    );
    
    /**
     * @notice Supply (deposit) fonksiyonu
     */
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;
    
    /**
     * @notice Withdraw fonksiyonu
     */
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);
    
    /**
     * @notice Borrow fonksiyonu
     */
    function borrow(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        uint16 referralCode,
        address onBehalfOf
    ) external;
    
    /**
     * @notice Repay fonksiyonu
     */
    function repay(
        address asset,
        uint256 amount,
        uint256 rateMode,
        address onBehalfOf
    ) external returns (uint256);
}

/**
 * @title IFlashLoanSimpleReceiver
 * @notice Basit flashloan receiver interface'i
 * @dev FlashLoanArbitrage kontratımız bu interface'i implement eder
 */
interface IFlashLoanSimpleReceiver {
    /**
     * @notice Aave Pool tarafından flashloan sonrası çağrılan fonksiyon
     * @param asset Ödünç alınan token
     * @param amount Ödünç alınan miktar
     * @param premium Ödenecek ücret
     * @param initiator Flashloan'ı başlatan adres
     * @param params İşlem parametreleri
     * @return True döndürmeli, aksi halde işlem revert olur
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bool);
}

/**
 * @title IFlashLoanReceiver
 * @notice Çoklu asset flashloan receiver interface'i
 */
interface IFlashLoanReceiver {
    /**
     * @notice Çoklu asset flashloan callback fonksiyonu
     */
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external returns (bool);
}

/**
 * @title IPoolAddressesProvider
 * @notice Aave V3 adres provider interface'i
 * @dev Pool ve diğer core kontratların adreslerini sağlar
 */
interface IPoolAddressesProvider {
    /**
     * @notice Market ID'sini döndürür
     */
    function getMarketId() external view returns (string memory);
    
    /**
     * @notice Pool adresini döndürür
     */
    function getPool() external view returns (address);
    
    /**
     * @notice Pool'u güncelle
     */
    function setPoolImpl(address pool) external;
    
    /**
     * @notice Pool Configurator adresini döndürür
     */
    function getPoolConfigurator() external view returns (address);
    
    /**
     * @notice Price Oracle adresini döndürür
     */
    function getPriceOracle() external view returns (address);
    
    /**
     * @notice ACL Manager adresini döndürür
     */
    function getACLManager() external view returns (address);
    
    /**
     * @notice ACL Admin adresini döndürür
     */
    function getACLAdmin() external view returns (address);
    
    /**
     * @notice Pool Data Provider adresini döndürür
     */
    function getPoolDataProvider() external view returns (address);
}

/**
 * @title IPoolDataProvider
 * @notice Aave V3 Pool data provider interface'i
 * @dev Detaylı pool ve reserve verileri için kullanılır
 */
interface IPoolDataProvider {
    /**
     * @notice Tüm reserve'lerin listesini döndürür
     */
    function getAllReservesTokens() external view returns (TokenData[] memory);
    
    /**
     * @notice Tüm aToken'ların listesini döndürür
     */
    function getAllATokens() external view returns (TokenData[] memory);
    
    /**
     * @notice Reserve configuration verilerini döndürür
     */
    function getReserveConfigurationData(address asset) external view returns (
        uint256 decimals,
        uint256 ltv,
        uint256 liquidationThreshold,
        uint256 liquidationBonus,
        uint256 reserveFactor,
        bool usageAsCollateralEnabled,
        bool borrowingEnabled,
        bool stableBorrowRateEnabled,
        bool isActive,
        bool isFrozen
    );
    
    /**
     * @notice Reserve caps (limits) verilerini döndürür
     */
    function getReserveCaps(address asset) external view returns (
        uint256 borrowCap,
        uint256 supplyCap
    );
    
    /**
     * @notice Kullanıcının reserve verilerini döndürür
     */
    function getUserReserveData(address asset, address user) external view returns (
        uint256 currentATokenBalance,
        uint256 currentStableDebt,
        uint256 currentVariableDebt,
        uint256 principalStableDebt,
        uint256 scaledVariableDebt,
        uint256 stableBorrowRate,
        uint256 liquidityRate,
        uint40 stableRateLastUpdated,
        bool usageAsCollateralEnabled
    );
    
    /**
     * @notice Token data struct
     */
    struct TokenData {
        string symbol;
        address tokenAddress;
    }
}

/**
 * @title IPriceOracle
 * @notice Aave V3 Price Oracle interface'i
 * @dev Asset fiyatlarını almak için kullanılır
 */
interface IPriceOracle {
    /**
     * @notice Asset'in ETH cinsinden fiyatını döndürür
     * @param asset Token adresi
     * @return Fiyat (WEI cinsinden)
     */
    function getAssetPrice(address asset) external view returns (uint256);
    
    /**
     * @notice Birden fazla asset'in fiyatını döndürür
     */
    function getAssetsPrices(address[] calldata assets) external view returns (uint256[] memory);
    
    /**
     * @notice Fiyat kaynağını döndürür
     */
    function getSourceOfAsset(address asset) external view returns (address);
    
    /**
     * @notice Fallback oracle'ı döndürür
     */
    function getFallbackOracle() external view returns (address);
}

/**
 * @title IACLManager
 * @notice Access Control List Manager interface'i
 * @dev Yetkilendirme ve rol yönetimi için kullanılır
 */
interface IACLManager {
    /**
     * @notice Pool admin rolünü kontrol eder
     */
    function isPoolAdmin(address admin) external view returns (bool);
    
    /**
     * @notice Emergency admin rolünü kontrol eder
     */
    function isEmergencyAdmin(address admin) external view returns (bool);
    
    /**
     * @notice Risk admin rolünü kontrol eder
     */
    function isRiskAdmin(address admin) external view returns (bool);
    
    /**
     * @notice Flash borrower rolünü kontrol eder
     */
    function isFlashBorrower(address borrower) external view returns (bool);
    
    /**
     * @notice Bridge rolünü kontrol eder
     */
    function isBridge(address bridge) external view returns (bool);
    
    /**
     * @notice Asset listing admin rolünü kontrol eder
     */
    function isAssetListingAdmin(address admin) external view returns (bool);
}

/**
 * @title IPoolConfigurator
 * @notice Pool configuration interface'i
 * @dev Reserve parametrelerini ayarlamak için kullanılır (admin only)
 */
interface IPoolConfigurator {
    /**
     * @notice Reserve'ü başlatır
     */
    function initReserves(ConfigureReserveInput[] calldata input) external;
    
    /**
     * @notice Borrow cap'i günceller
     */
    function setBorrowCap(address asset, uint256 borrowCap) external;
    
    /**
     * @notice Supply cap'i günceller
     */
    function setSupplyCap(address asset, uint256 supplyCap) external;
    
    /**
     * @notice Liquidation bonus'u günceller
     */
    function setLiquidationBonus(address asset, uint256 bonus) external;
    
    /**
     * @notice Reserve'ü freeze/unfreeze eder
     */
    function setReserveFreeze(address asset, bool freeze) external;
    
    /**
     * @notice Borrowing'i enable/disable eder
     */
    function setReserveBorrowing(address asset, bool enabled) external;
    
    /**
     * @notice Reserve'ü active/inactive yapar
     */
    function setReserveActive(address asset, bool active) external;
    
    /**
     * @notice Reserve factor'ü günceller
     */
    function setReserveFactor(address asset, uint256 reserveFactor) external;
    
    /**
     * @notice Configure reserve input struct
     */
    struct ConfigureReserveInput {
        address aTokenImpl;
        address stableDebtTokenImpl;
        address variableDebtTokenImpl;
        uint8 underlyingAssetDecimals;
        address interestRateStrategyAddress;
        address underlyingAsset;
        address treasury;
        address incentivesController;
        string aTokenName;
        string aTokenSymbol;
        string variableDebtTokenName;
        string variableDebtTokenSymbol;
        string stableDebtTokenName;
        string stableDebtTokenSymbol;
        bytes params;
    }
}

/**
 * @title DataTypes
 * @notice Aave V3'te kullanılan veri tipleri
 */
library DataTypes {
    struct ReserveData {
        ReserveConfigurationMap configuration;
        uint128 liquidityIndex;
        uint128 variableBorrowIndex;
        uint128 currentLiquidityRate;
        uint128 currentVariableBorrowRate;
        uint128 currentStableBorrowRate;
        uint40 lastUpdateTimestamp;
        address aTokenAddress;
        address stableDebtTokenAddress;
        address variableDebtTokenAddress;
        address interestRateStrategyAddress;
        uint8 id;
    }
    
    struct ReserveConfigurationMap {
        uint256 data;
    }
    
    struct UserConfigurationMap {
        uint256 data;
    }
    
    enum InterestRateMode {
        NONE,
        STABLE,
        VARIABLE
    }
}

/**
 * @title FlashLoanSimpleReceiverBase
 * @notice Flashloan receiver base contract
 * @dev Bu abstract contract'ı FlashLoanArbitrage.sol import ediyor
 */
abstract contract FlashLoanSimpleReceiverBase is IFlashLoanSimpleReceiver {
    IPoolAddressesProvider public immutable ADDRESSES_PROVIDER;
    IPool public immutable POOL;
    
    constructor(IPoolAddressesProvider provider) {
        ADDRESSES_PROVIDER = provider;
        POOL = IPool(provider.getPool());
    }
}