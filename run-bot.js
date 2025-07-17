#!/usr/bin/env node

console.log('🚀 Starting Flashloan Arbitrage Bot...');
console.log('📁 Working Directory:', process.cwd());
console.log('🔧 Node Version:', process.version);
console.log('🕐 Start Time:', new Date().toISOString());
console.log('─'.repeat(50));

try {
    // Change to correct directory
    process.chdir('C:\\Users\\WIN10\\Desktop\\flashloan-arbitrage-bot');
    
    // Load and run the main application
    require('./build/index.js');
    
} catch (error) {
    console.error('❌ Error starting bot:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}
