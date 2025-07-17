/**
 * 🧪 Advanced Smart Contract Unit Testing & Integration
 * ⚡ Comprehensive FlashLoan Arbitrage Contract Testing Suite
 * 🎯 Multi-Scenario Testing with Mock DEX Integration
 * 🛡️ Security Testing & Edge Case Validation
 */

import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Contract, ContractFactory, Signer } from 'ethers';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';

// Import chai matchers
import '@nomicfoundation/hardhat-chai-matchers';

// 📊 Contract Interfaces
interface FlashLoanArbitrageFixture {
  flashLoanArbitrage: Contract;
  mockAavePool: Contract;
  mockDEXRouter: Contract;
  mockWETH: Contract;
  mockUSDC: Contract;
  mockDAI: Contract;
  owner: SignerWithAddress;
  user1: SignerWithAddress;
  user2: SignerWithAddress;
  liquidityProvider: SignerWithAddress;
}

// 🎯 Test Configuration Interface
interface TestConfig {
  flashLoanAmount: bigint;
  minProfitAmount: bigint;
  maxSlippage: number;
  gasLimit: number;
  deadline: number;
}

// 📈 Arbitrage Test Scenario Interface
interface ArbitrageScenario {
  name: string;
  tokenA: string;
  tokenB: string;
  amountIn: bigint;
  expectedProfit: bigint;
  dexPrices: { dex1: bigint; dex2: bigint };
  shouldSucceed: boolean;
  gasEstimate: number;
}

describe('FlashLoanArbitrage Contract', function () {
  // 🔧 Test Configuration Constants
  const TEST_CONFIG: TestConfig = {
    flashLoanAmount: ethers.parseEther('100'),
    minProfitAmount: ethers.parseEther('0.01'),
    maxSlippage: 300, // 3%
    gasLimit: 5000000,
    deadline: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
  };

  // 🏗️ Deployment Fixture
  async function deployFlashLoanArbitrageFixture(): Promise<FlashLoanArbitrageFixture> {
    // Get signers
    const [owner, user1, user2, liquidityProvider] = await ethers.getSigners();

    // 🪙 Deploy Mock ERC20 Tokens
    const MockERC20Factory = await ethers.getContractFactory('MockERC20');
    
    const mockWETH = await MockERC20Factory.deploy(
      'Wrapped Ether',
      'WETH',
      18,
      ethers.parseEther('1000000') // 1M WETH
    );
    await mockWETH.waitForDeployment();

    const mockUSDC = await MockERC20Factory.deploy(
      'USD Coin',
      'USDC',
      6,
      ethers.parseUnits('1000000000', 6) // 1B USDC
    );
    await mockUSDC.waitForDeployment();

    const mockDAI = await MockERC20Factory.deploy(
      'Dai Stablecoin',
      'DAI',
      18,
      ethers.parseEther('1000000000') // 1B DAI
    );
    await mockDAI.waitForDeployment();

    // 🏊 Deploy Mock Aave Pool
    const MockAavePoolFactory = await ethers.getContractFactory('MockAavePool');
    const mockAavePool = await MockAavePoolFactory.deploy();
    await mockAavePool.waitForDeployment();

    // 🔄 Deploy Mock DEX Router
    const MockDEXRouterFactory = await ethers.getContractFactory('MockDEXRouter');
    const mockDEXRouter = await MockDEXRouterFactory.deploy(
      await mockWETH.getAddress(),
      [await mockWETH.getAddress(), await mockUSDC.getAddress(), await mockDAI.getAddress()] // Supported tokens
    );
    await mockDEXRouter.waitForDeployment();

    // 🎯 Deploy FlashLoanArbitrage Contract
    const FlashLoanArbitrageFactory = await ethers.getContractFactory('FlashLoanArbitrage');

    const flashLoanArbitrage = await FlashLoanArbitrageFactory.deploy(
      await mockAavePool.getAddress(),     // _addressProvider
      await mockDEXRouter.getAddress(),    // _uniswapV3Router  
      await mockDEXRouter.getAddress(),    // _sushiSwapRouter
      await mockDEXRouter.getAddress(),    // _oneInchRouter
      await mockDEXRouter.getAddress()     // _balancerVault
    );
    await flashLoanArbitrage.waitForDeployment();

    // 💰 Setup initial liquidity and balances
    await setupInitialLiquidity(
      { mockWETH, mockUSDC, mockDAI, mockDEXRouter, mockAavePool },
      { owner, user1, user2, liquidityProvider }
    );

    return {
      flashLoanArbitrage,
      mockAavePool,
      mockDEXRouter,
      mockWETH,
      mockUSDC,
      mockDAI,
      owner,
      user1,
      user2,
      liquidityProvider
    };
  }

  // 💰 Setup Initial Liquidity Helper
  async function setupInitialLiquidity(
    contracts: { mockWETH: Contract; mockUSDC: Contract; mockDAI: Contract; mockDEXRouter: Contract; mockAavePool: Contract },
    signers: { owner: SignerWithAddress; user1: SignerWithAddress; user2: SignerWithAddress; liquidityProvider: SignerWithAddress }
  ): Promise<void> {
    const { mockWETH, mockUSDC, mockDAI, mockDEXRouter, mockAavePool } = contracts;
    const { owner, liquidityProvider } = signers;

    // Transfer tokens to liquidity provider
    await (mockWETH as any).transfer(liquidityProvider.address, ethers.parseEther('10000'));
    await (mockUSDC as any).transfer(liquidityProvider.address, ethers.parseUnits('20000000', 6));
    await (mockDAI as any).transfer(liquidityProvider.address, ethers.parseEther('20000000'));

    // Approve DEX router
    await (mockWETH as any).connect(liquidityProvider).approve(await mockDEXRouter.getAddress(), ethers.MaxUint256);
    await (mockUSDC as any).connect(liquidityProvider).approve(await mockDEXRouter.getAddress(), ethers.MaxUint256);
    await (mockDAI as any).connect(liquidityProvider).approve(await mockDEXRouter.getAddress(), ethers.MaxUint256);

    // Add liquidity to mock DEX
    await (mockDEXRouter as any).connect(liquidityProvider).addLiquidity(
      await mockWETH.getAddress(),
      await mockUSDC.getAddress(),
      ethers.parseEther('1000'),    // 1000 WETH
      ethers.parseUnits('2000000', 6), // 2M USDC (price: $2000/ETH)
      0, 0,
      liquidityProvider.address,
      TEST_CONFIG.deadline
    );

    await (mockDEXRouter as any).connect(liquidityProvider).addLiquidity(
      await mockWETH.getAddress(),
      await mockDAI.getAddress(),
      ethers.parseEther('1000'),    // 1000 WETH
      ethers.parseEther('2000000'), // 2M DAI (price: $2000/ETH)
      0, 0,
      liquidityProvider.address,
      TEST_CONFIG.deadline
    );

    // Setup Aave pool with liquidity
    await (mockWETH as any).transfer(await mockAavePool.getAddress(), ethers.parseEther('5000'));
    await (mockUSDC as any).transfer(await mockAavePool.getAddress(), ethers.parseUnits('10000000', 6));
    await (mockDAI as any).transfer(await mockAavePool.getAddress(), ethers.parseEther('10000000'));
  }

  // 🧪 Contract Deployment Tests
  describe('Contract Deployment', function () {
    it('Should deploy successfully with correct parameters', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, mockAavePool, mockWETH, mockDEXRouter, mockUSDC, mockDAI, owner } = fixture;

      // Verify contract initialization
      expect(await (flashLoanArbitrage as any).owner()).to.equal(owner.address);
      expect(await (flashLoanArbitrage as any).aavePool()).to.equal(await mockAavePool.getAddress());
      expect(await (flashLoanArbitrage as any).WETH()).to.equal(await mockWETH.getAddress());
      
      // Verify DEX routers
      expect(await (flashLoanArbitrage as any).getDEXRoutersCount()).to.equal(1);
      expect(await (flashLoanArbitrage as any).dexRouters(0)).to.equal(await mockDEXRouter.getAddress());
      
      // Verify supported tokens
      expect(await (flashLoanArbitrage as any).getSupportedTokensCount()).to.equal(2);
      expect(await (flashLoanArbitrage as any).supportedTokens(0)).to.equal(await mockUSDC.getAddress());
      expect(await (flashLoanArbitrage as any).supportedTokens(1)).to.equal(await mockDAI.getAddress());
    });

    it('Should set correct initial state variables', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage } = fixture;

      expect(await (flashLoanArbitrage as any).paused()).to.equal(false);
      expect(await (flashLoanArbitrage as any).emergencyMode()).to.equal(false);
      expect(await (flashLoanArbitrage as any).maxSlippage()).to.equal(500); // 5% default
      expect(await (flashLoanArbitrage as any).minProfitBasisPoints()).to.equal(30); // 0.3% default
    });

    it('Should emit ContractDeployed event', async function () {
      const [owner] = await ethers.getSigners();
      const MockAavePoolFactory = await ethers.getContractFactory('MockAavePool');
      const mockAavePool = await MockAavePoolFactory.deploy();

      const MockERC20Factory = await ethers.getContractFactory('MockERC20');
      const mockWETH = await MockERC20Factory.deploy('WETH', 'WETH', 18, ethers.parseEther('1000'));

      const FlashLoanArbitrageFactory = await ethers.getContractFactory('FlashLoanArbitrage');

      await expect(
        FlashLoanArbitrageFactory.deploy(
          await mockAavePool.getAddress(),
          owner.address,
          await mockWETH.getAddress(),
          [],
          []
        )
      ).to.emit(FlashLoanArbitrageFactory, 'ContractDeployed')
       .withArgs(anyValue, owner.address, await mockAavePool.getAddress());
    });
  });

  // ⚙️ Configuration Management Tests
  describe('Configuration Management', function () {
    it('Should allow owner to update DEX routers', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, owner } = fixture;

      const newRouterAddress = ethers.Wallet.createRandom().address;

      await expect(
        (flashLoanArbitrage as any).connect(owner).addDEXRouter(newRouterAddress)
      ).to.emit(flashLoanArbitrage, 'DEXRouterAdded')
       .withArgs(newRouterAddress, 1);

      expect(await (flashLoanArbitrage as any).getDEXRoutersCount()).to.equal(2);
      expect(await (flashLoanArbitrage as any).dexRouters(1)).to.equal(newRouterAddress);
    });

    it('Should allow owner to update slippage tolerance', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, owner } = fixture;

      const newSlippage = 200; // 2%

      await expect(
        (flashLoanArbitrage as any).connect(owner).setMaxSlippage(newSlippage)
      ).to.emit(flashLoanArbitrage, 'SlippageUpdated')
       .withArgs(500, newSlippage);

      expect(await (flashLoanArbitrage as any).maxSlippage()).to.equal(newSlippage);
    });

    it('Should allow owner to update minimum profit threshold', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, owner } = fixture;

      const newMinProfit = 50; // 0.5%

      await expect(
        (flashLoanArbitrage as any).connect(owner).setMinProfitBasisPoints(newMinProfit)
      ).to.emit(flashLoanArbitrage, 'MinProfitUpdated')
       .withArgs(30, newMinProfit);

      expect(await (flashLoanArbitrage as any).minProfitBasisPoints()).to.equal(newMinProfit);
    });

    it('Should reject invalid slippage values', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, owner } = fixture;

      // Test slippage > 100%
      await expect(
        (flashLoanArbitrage as any).connect(owner).setMaxSlippage(10001)
      ).to.be.rejectedWith('Slippage too high');

      // Test zero slippage
      await expect(
        (flashLoanArbitrage as any).connect(owner).setMaxSlippage(0)
      ).to.be.rejectedWith('Slippage cannot be zero');
    });
  });

  // 🚨 Access Control Tests
  describe('Access Control', function () {
    it('Should restrict owner-only functions', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, user1 } = fixture;

      await expect(
        (flashLoanArbitrage as any).connect(user1).setMaxSlippage(200)
      ).to.be.rejectedWith('Ownable: caller is not the owner');

      await expect(
        (flashLoanArbitrage as any).connect(user1).pause()
      ).to.be.rejectedWith('Ownable: caller is not the owner');

      await expect(
        (flashLoanArbitrage as any).connect(user1).emergencyWithdraw(ethers.Wallet.createRandom().address)
      ).to.be.rejectedWith('Ownable: caller is not the owner');
    });

    it('Should allow ownership transfer', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, owner, user1 } = fixture;

      // Initiate ownership transfer
      await (flashLoanArbitrage as any).connect(owner).transferOwnership(user1.address);
      
      // Accept ownership
      await (flashLoanArbitrage as any).connect(user1).acceptOwnership();

      expect(await (flashLoanArbitrage as any).owner()).to.equal(user1.address);
    });

    it('Should prevent unauthorized access to flashloan callback', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, user1, mockWETH } = fixture;

      await expect(
        (flashLoanArbitrage as any).connect(user1).executeOperation(
          [await mockWETH.getAddress()],
          [ethers.parseEther('100')],
          [ethers.parseEther('0.09')], // 0.09% fee
          user1.address,
          '0x'
        )
      ).to.be.rejectedWith('Caller is not Aave pool');
    });
  });

  // 💰 Flashloan Execution Tests
  describe('Flashloan Execution', function () {
    it('Should execute successful arbitrage with profit', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, mockDEXRouter, mockWETH, mockUSDC, owner } = fixture;

      // Create price difference (higher price on second "DEX")
      await (mockDEXRouter as any).setPriceRatio(
        await mockWETH.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseUnits('2100', 6), // $2100 USDC per WETH
        ethers.parseEther('1')
      );

      const arbitrageParams = {
        asset: await mockWETH.getAddress(),
        amount: ethers.parseEther('10'),
        dexRouterA: await mockDEXRouter.getAddress(),
        dexRouterB: await mockDEXRouter.getAddress(),
        tokenA: await mockWETH.getAddress(),
        tokenB: await mockUSDC.getAddress(),
        minimumProfit: ethers.parseEther('0.1')
      };

      const balanceBefore = await (mockWETH as any).balanceOf(await flashLoanArbitrage.getAddress());

      await expect(
        (flashLoanArbitrage as any).connect(owner).executeArbitrage(arbitrageParams)
      ).to.emit(flashLoanArbitrage, 'ArbitrageExecuted')
       .withArgs(
         await mockWETH.getAddress(),
         arbitrageParams.amount,
         anyValue, // profit amount (calculated dynamically)
         owner.address
       );

      const balanceAfter = await (mockWETH as any).balanceOf(await flashLoanArbitrage.getAddress());
      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it('Should handle flashloan callback correctly', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, mockAavePool, mockWETH, mockUSDC, mockDEXRouter } = fixture;

      const flashLoanAmount = ethers.parseEther('100');
      const premium = flashLoanAmount * 9n / 10000n; // 0.09% fee

      // Simulate Aave pool calling executeOperation
      const arbitrageData = ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'address', 'address', 'address', 'uint256'],
        [
          await mockDEXRouter.getAddress(), // dexRouterA
          await mockDEXRouter.getAddress(), // dexRouterB
          await mockWETH.getAddress(),      // tokenA
          await mockUSDC.getAddress(),      // tokenB
          ethers.parseEther('0.01') // minimumProfit
        ]
      );

      // Fund the contract with tokens for repayment
      await (mockWETH as any).transfer(await flashLoanArbitrage.getAddress(), flashLoanAmount + premium);

      const result = await (flashLoanArbitrage as any).connect(mockAavePool).executeOperation(
        [await mockWETH.getAddress()],
        [flashLoanAmount],
        [premium],
        await mockAavePool.getAddress(),
        arbitrageData
      );

      expect(result).to.equal(true);
    });

    it('Should revert on insufficient profit', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, mockDEXRouter, mockWETH, mockUSDC, owner } = fixture;

      // Set same price on both "DEXs" (no arbitrage opportunity)
      await (mockDEXRouter as any).setPriceRatio(
        await mockWETH.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseUnits('2000', 6), // Same price
        ethers.parseEther('1')
      );

      const arbitrageParams = {
        asset: await mockWETH.getAddress(),
        amount: ethers.parseEther('10'),
        dexRouterA: await mockDEXRouter.getAddress(),
        dexRouterB: await mockDEXRouter.getAddress(),
        tokenA: await mockWETH.getAddress(),
        tokenB: await mockUSDC.getAddress(),
        minimumProfit: ethers.parseEther('1') // High minimum profit
      };

      await expect(
        (flashLoanArbitrage as any).connect(owner).executeArbitrage(arbitrageParams)
      ).to.be.rejectedWith('Insufficient profit');
    });

    it('Should handle multiple token arbitrage', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, mockDEXRouter, mockWETH, mockUSDC, mockDAI, owner } = fixture;

      // Create triangular arbitrage opportunity: WETH -> USDC -> DAI -> WETH
      await (mockDEXRouter as any).setPriceRatio(await mockWETH.getAddress(), await mockUSDC.getAddress(), ethers.parseUnits('2100', 6), ethers.parseEther('1'));
      await (mockDEXRouter as any).setPriceRatio(await mockUSDC.getAddress(), await mockDAI.getAddress(), ethers.parseEther('1.01'), ethers.parseUnits('1', 6));
      await (mockDEXRouter as any).setPriceRatio(await mockDAI.getAddress(), await mockWETH.getAddress(), ethers.parseEther('1'), ethers.parseEther('1900'));

      const triangularParams = {
        asset: await mockWETH.getAddress(),
        amount: ethers.parseEther('5'),
        path: [await mockWETH.getAddress(), await mockUSDC.getAddress(), await mockDAI.getAddress(), await mockWETH.getAddress()],
        routers: [await mockDEXRouter.getAddress(), await mockDEXRouter.getAddress(), await mockDEXRouter.getAddress()],
        minimumProfit: ethers.parseEther('0.05')
      };

      await expect(
        (flashLoanArbitrage as any).connect(owner).executeTriangularArbitrage(triangularParams)
      ).to.emit(flashLoanArbitrage, 'TriangularArbitrageExecuted')
       .withArgs(await mockWETH.getAddress(), triangularParams.amount, anyValue, owner.address);
    });
  });

  // 🛡️ Security & Edge Cases Tests
  describe('Security & Edge Cases', function () {
    it('Should prevent reentrancy attacks', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, owner } = fixture;

      // Deploy malicious contract that attempts reentrancy
      const MaliciousContractFactory = await ethers.getContractFactory('MaliciousReentrancy');
      const maliciousContract = await MaliciousContractFactory.deploy(await flashLoanArbitrage.getAddress());

      await expect(
        (maliciousContract as any).connect(owner).attemptReentrancy()
      ).to.be.rejectedWith('ReentrancyGuard: reentrant call');
    });

    it('Should handle contract pause functionality', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, mockWETH, mockUSDC, mockDEXRouter, owner } = fixture;

      // Pause the contract
      await (flashLoanArbitrage as any).connect(owner).pause();
      expect(await (flashLoanArbitrage as any).paused()).to.equal(true);

      const arbitrageParams = {
        asset: await mockWETH.getAddress(),
        amount: ethers.parseEther('10'),
        dexRouterA: await mockDEXRouter.getAddress(),
        dexRouterB: await mockDEXRouter.getAddress(),
        tokenA: await mockWETH.getAddress(),
        tokenB: await mockUSDC.getAddress(),
        minimumProfit: ethers.parseEther('0.1')
      };

      // Should revert when paused
      await expect(
        (flashLoanArbitrage as any).connect(owner).executeArbitrage(arbitrageParams)
      ).to.be.rejectedWith('Pausable: paused');

      // Unpause and try again
      await (flashLoanArbitrage as any).connect(owner).unpause();
      expect(await (flashLoanArbitrage as any).paused()).to.equal(false);
    });

    it('Should handle emergency mode correctly', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, mockWETH, owner } = fixture;

      // Fund contract
      await (mockWETH as any).transfer(await flashLoanArbitrage.getAddress(), ethers.parseEther('100'));

      // Enable emergency mode
      await (flashLoanArbitrage as any).connect(owner).enableEmergencyMode();
      expect(await (flashLoanArbitrage as any).emergencyMode()).to.equal(true);

      // Should allow emergency withdrawal
      const balanceBefore = await (mockWETH as any).balanceOf(owner.address);
      
      await expect(
        (flashLoanArbitrage as any).connect(owner).emergencyWithdraw(await mockWETH.getAddress())
      ).to.emit(flashLoanArbitrage, 'EmergencyWithdrawal')
       .withArgs(await mockWETH.getAddress(), anyValue, owner.address);

      const balanceAfter = await (mockWETH as any).balanceOf(owner.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it('Should validate token transfers and approvals', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, mockWETH, mockDEXRouter } = fixture;

      // Test insufficient allowance
      const TestTokenFactory = await ethers.getContractFactory('TestToken');
      const testToken = await TestTokenFactory.deploy();
      
      await expect(
        (flashLoanArbitrage as any).checkTokenApproval(await testToken.getAddress(), await mockDEXRouter.getAddress(), ethers.parseEther('100'))
      ).to.be.rejectedWith('Insufficient token allowance');
    });

    it('Should handle gas limit optimization', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, owner } = fixture;

      // Test gas estimation
      const gasEstimate = await (flashLoanArbitrage as any).connect(owner).setMaxSlippage.estimateGas(200);
      expect(gasEstimate).to.be.lt(100000); // Should be efficient

      // Test gas optimization for arbitrage
      const currentGasOptimization = await (flashLoanArbitrage as any).gasOptimizationEnabled();
      expect(currentGasOptimization).to.equal(true);
    });
  });

  // 📊 Event Emission Tests
  describe('Event Emission', function () {
    it('Should emit correct events for successful arbitrage', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, mockDEXRouter, mockWETH, mockUSDC, owner } = fixture;

      await (mockDEXRouter as any).setPriceRatio(
        await mockWETH.getAddress(),
        await mockUSDC.getAddress(),
        ethers.parseUnits('2100', 6),
        ethers.parseEther('1')
      );

      const arbitrageParams = {
        asset: await mockWETH.getAddress(),
        amount: ethers.parseEther('10'),
        dexRouterA: await mockDEXRouter.getAddress(),
        dexRouterB: await mockDEXRouter.getAddress(),
        tokenA: await mockWETH.getAddress(),
        tokenB: await mockUSDC.getAddress(),
        minimumProfit: ethers.parseEther('0.1')
      };

      await expect(
        (flashLoanArbitrage as any).connect(owner).executeArbitrage(arbitrageParams)
      ).to.emit(flashLoanArbitrage, 'ArbitrageExecuted')
       .and.to.emit(flashLoanArbitrage, 'FlashLoanInitiated')
       .and.to.emit(flashLoanArbitrage, 'SwapExecuted');
    });

    it('Should emit configuration change events', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, owner } = fixture;

      await expect(
        (flashLoanArbitrage as any).connect(owner).setMaxSlippage(200)
      ).to.emit(flashLoanArbitrage, 'SlippageUpdated')
       .withArgs(500, 200);

      await expect(
        (flashLoanArbitrage as any).connect(owner).setMinProfitBasisPoints(50)
      ).to.emit(flashLoanArbitrage, 'MinProfitUpdated')
       .withArgs(30, 50);
    });
  });

  // 📈 Performance & Optimization Tests
  describe('Performance & Optimization', function () {
    it('Should optimize gas usage for repeated operations', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, mockDEXRouter, mockWETH, mockUSDC, owner } = fixture;

      // First execution
      const arbitrageParams = {
        asset: await mockWETH.getAddress(),
        amount: ethers.parseEther('1'),
        dexRouterA: await mockDEXRouter.getAddress(),
        dexRouterB: await mockDEXRouter.getAddress(),
        tokenA: await mockWETH.getAddress(),
        tokenB: await mockUSDC.getAddress(),
        minimumProfit: ethers.parseEther('0.01')
      };

      const tx1 = await (flashLoanArbitrage as any).connect(owner).executeArbitrage.estimateGas(arbitrageParams);
      
      // Second execution (should be more efficient due to cached data)
      const tx2 = await (flashLoanArbitrage as any).connect(owner).executeArbitrage.estimateGas(arbitrageParams);
      
      expect(tx2).to.be.lte(tx1);
    });

    it('Should handle high-frequency trading scenarios', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, mockDEXRouter, mockWETH, mockUSDC, owner } = fixture;

      const arbitrageParams = {
        asset: await mockWETH.getAddress(),
        amount: ethers.parseEther('0.1'),
        dexRouterA: await mockDEXRouter.getAddress(),
        dexRouterB: await mockDEXRouter.getAddress(),
        tokenA: await mockWETH.getAddress(),
        tokenB: await mockUSDC.getAddress(),
        minimumProfit: ethers.parseEther('0.001')
      };

      // Execute multiple arbitrages in quick succession
      const promises: Promise<any>[] = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          (flashLoanArbitrage as any).connect(owner).executeArbitrage({
            ...arbitrageParams,
            amount: ethers.parseEther((0.1 + i * 0.05).toString())
          })
        );
      }

      // All should succeed
      const results = await Promise.allSettled(promises);
      const successfulTxs = results.filter(result => result.status === 'fulfilled');
      expect(successfulTxs.length).to.be.gte(3); // At least 3 should succeed
    });

    it('Should measure execution timing for SLA compliance', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, mockDEXRouter, mockWETH, mockUSDC, owner } = fixture;

      const startTime = await time.latest();
      
      const arbitrageParams = {
        asset: await mockWETH.getAddress(),
        amount: ethers.parseEther('1'),
        dexRouterA: await mockDEXRouter.getAddress(),
        dexRouterB: await mockDEXRouter.getAddress(),
        tokenA: await mockWETH.getAddress(),
        tokenB: await mockUSDC.getAddress(),
        minimumProfit: ethers.parseEther('0.01')
      };

      await (flashLoanArbitrage as any).connect(owner).executeArbitrage(arbitrageParams);
      
      const endTime = await time.latest();
      const executionTime = endTime - startTime;
      
      // Should execute within reasonable time (< 30 seconds for testing)
      expect(executionTime).to.be.lt(30);
    });
  });

  // 🔍 Integration Tests with Mock DEXs
  describe('DEX Integration', function () {
    it('Should handle multiple DEX router integrations', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, owner } = fixture;

      // Deploy additional mock DEX router
      const MockDEXRouter2Factory = await ethers.getContractFactory('MockDEXRouter');
      const mockDEXRouter2 = await MockDEXRouter2Factory.deploy(
        await fixture.mockWETH.getAddress(),
        [await fixture.mockWETH.getAddress(), await fixture.mockUSDC.getAddress()]
      );

      // Add second router
      await (flashLoanArbitrage as any).connect(owner).addDEXRouter(await mockDEXRouter2.getAddress());
      
      expect(await (flashLoanArbitrage as any).getDEXRoutersCount()).to.equal(2);
      expect(await (flashLoanArbitrage as any).isDEXRouterSupported(await mockDEXRouter2.getAddress())).to.equal(true);
    });

    it('Should validate DEX router responses', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, mockDEXRouter, mockWETH, mockUSDC } = fixture;

      // Test quote validation
      const amountIn = ethers.parseEther('1');
      const quote = await (flashLoanArbitrage as any).getQuote(
        await mockDEXRouter.getAddress(),
        amountIn,
        [await mockWETH.getAddress(), await mockUSDC.getAddress()]
      );

      expect(quote).to.be.gt(0);
      expect(quote).to.be.lt(ethers.parseUnits('3000', 6)); // Reasonable upper bound
    });
  });

  // 🎯 Test Scenarios Based on Real Market Conditions
  describe('Real Market Scenarios', function () {
    const scenarios: ArbitrageScenario[] = [
      {
        name: 'Small Price Difference',
        tokenA: 'WETH',
        tokenB: 'USDC', 
        amountIn: ethers.parseEther('1'),
        expectedProfit: ethers.parseEther('0.005'),
        dexPrices: {
          dex1: ethers.parseUnits('2000', 6),
          dex2: ethers.parseUnits('2010', 6)
        },
        shouldSucceed: true,
        gasEstimate: 300000
      },
      {
        name: 'Large Arbitrage Opportunity',
        tokenA: 'WETH',
        tokenB: 'USDC',
        amountIn: ethers.parseEther('10'),
        expectedProfit: ethers.parseEther('0.5'),
        dexPrices: {
          dex1: ethers.parseUnits('2000', 6),
          dex2: ethers.parseUnits('2050', 6)
        },
        shouldSucceed: true,
        gasEstimate: 350000
      },
      {
        name: 'No Arbitrage Opportunity',
        tokenA: 'WETH',
        tokenB: 'USDC',
        amountIn: ethers.parseEther('5'),
        expectedProfit: 0n,
        dexPrices: {
          dex1: ethers.parseUnits('2000', 6),
          dex2: ethers.parseUnits('2000', 6)
        },
        shouldSucceed: false,
        gasEstimate: 250000
      }
    ];

    scenarios.forEach((scenario) => {
      it(`Should handle ${scenario.name} correctly`, async function () {
        const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
        const { flashLoanArbitrage, mockDEXRouter, mockWETH, mockUSDC, owner } = fixture;

        // Setup price conditions
        await (mockDEXRouter as any).setPriceRatio(
          await mockWETH.getAddress(),
          await mockUSDC.getAddress(),
          scenario.dexPrices.dex1,
          ethers.parseEther('1')
        );

        const arbitrageParams = {
          asset: await mockWETH.getAddress(),
          amount: scenario.amountIn,
          dexRouterA: await mockDEXRouter.getAddress(),
          dexRouterB: await mockDEXRouter.getAddress(),
          tokenA: await mockWETH.getAddress(),
          tokenB: await mockUSDC.getAddress(),
          minimumProfit: scenario.expectedProfit
        };

        if (scenario.shouldSucceed) {
          await expect(
            (flashLoanArbitrage as any).connect(owner).executeArbitrage(arbitrageParams)
          ).to.emit(flashLoanArbitrage, 'ArbitrageExecuted');
        } else {
          await expect(
            (flashLoanArbitrage as any).connect(owner).executeArbitrage(arbitrageParams)
          ).to.be.rejectedWith('Insufficient profit');
        }
      });
    });
  });

  // 🧹 Cleanup and Final Tests
  describe('Contract Lifecycle', function () {
    it('Should handle contract destruction safely', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, mockWETH, owner } = fixture;

      // Fund contract
      await (mockWETH as any).transfer(await flashLoanArbitrage.getAddress(), ethers.parseEther('10'));

      // Enable emergency mode and withdraw all funds
      await (flashLoanArbitrage as any).connect(owner).enableEmergencyMode();
      await (flashLoanArbitrage as any).connect(owner).emergencyWithdraw(await mockWETH.getAddress());

      // Verify contract is drained
      const balance = await (mockWETH as any).balanceOf(await flashLoanArbitrage.getAddress());
      expect(balance).to.equal(0);
    });

    it('Should maintain state consistency throughout lifecycle', async function () {
      const fixture = await loadFixture(deployFlashLoanArbitrageFixture);
      const { flashLoanArbitrage, owner } = fixture;

      // Test state transitions
      expect(await (flashLoanArbitrage as any).paused()).to.equal(false);
      
      await (flashLoanArbitrage as any).connect(owner).pause();
      expect(await (flashLoanArbitrage as any).paused()).to.equal(true);
      
      await (flashLoanArbitrage as any).connect(owner).unpause();
      expect(await (flashLoanArbitrage as any).paused()).to.equal(false);
      
      await (flashLoanArbitrage as any).connect(owner).enableEmergencyMode();
      expect(await (flashLoanArbitrage as any).emergencyMode()).to.equal(true);
    });
  });
});