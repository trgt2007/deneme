// Logger test dosyası
try {
  console.log('1. Logger import ediliyor...');
  const { Logger } = require('./build/utils/Logger');
  
  console.log('2. Logger instance oluşturuluyor...');
  const logger = Logger.getInstance();
  
  console.log('3. Logger test mesajı gönderiliyor...');
  logger.info('Test mesajı - Logger çalışıyor! 🎉');
  
  console.log('4. Test başarılı! ✅');
} catch (error) {
  console.error('❌ Logger test hatası:', error);
  console.error('Stack trace:', error.stack);
}
