/**
 * @title Main Entry Point - Ana Giriş Noktası
 * @author Flashloan Arbitrage Bot Sistemi
 * @notice Production entry point for the arbitrage bot
 */

import { FlashLoanArbitrageBot } from './FlashLoanArbitrageBot';
import { Logger } from './utils/Logger';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  const logger = Logger.getInstance().createChildLogger('Main');
  
  logger.info('🚀 Flashloan Arbitrage Bot başlatılıyor...');
  logger.info('📍 Version: 2.0.0 - Production Ready');
  logger.info('⏰ Start Time:', { timestamp: new Date().toISOString() });
  logger.info('─'.repeat(60));

  try {
    // Initialize bot with configuration
    const bot = new FlashLoanArbitrageBot({
      rpcUrl: process.env.RPC_URL,
      privateKey: process.env.PRIVATE_KEY,
      chainId: parseInt(process.env.CHAIN_ID || '1'),
      scanInterval: parseInt(process.env.SCAN_INTERVAL || '5000'),
      maxConcurrentTrades: parseInt(process.env.MAX_CONCURRENT_TRADES || '3'),
      emergencyStopEnabled: process.env.EMERGENCY_STOP_ENABLED === 'true',
      monitoredTokens: process.env.MONITORED_TOKENS?.split(',') || [
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        '0xA0b86a33E6417c8E2Cc5d6cdBe5db4E0b8D2fCe7', // USDC
        '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
        '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
      ]
    });

    // Start the bot
    await bot.start();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('🛑 SIGINT alındı, bot kapatılıyor...');
      await bot.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('🛑 SIGTERM alındı, bot kapatılıyor...');
      await bot.stop();
      process.exit(0);
    });

    // Keep the process running
    logger.info('✅ Bot başarıyla başlatıldı ve çalışıyor...');
    logger.info('💡 Bot durumunu görmek için CTRL+C ile durdurun');

  } catch (error) {
    logger.error('❌ Bot başlatma hatası:', { error });
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  const logger = Logger.getInstance().createChildLogger('Main');
  main().catch(error => {
    logger.error('❌ Unhandled error:', { error });
    process.exit(1);
  });
}

export { FlashLoanArbitrageBot };
