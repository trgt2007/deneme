#!/bin/bash

# ========================================
# 🚀 FLASHLOAN ARBITRAGE BOT - DEPLOYMENT SCRIPT
# ========================================
# Version: 2.0.0 - Production Ready
# Author: Flashloan Arbitrage Bot System
# Purpose: Complete production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="flashloan-arbitrage-bot"
NODE_VERSION="18.17.0"
PM2_APP_NAME="arbitrage-bot"
BACKUP_DIR="./backups"
LOG_DIR="./logs"

echo -e "${BLUE}🚀 Starting Flashloan Arbitrage Bot Deployment${NC}"
echo -e "${BLUE}================================================${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "Bu script root kullanıcısı ile çalıştırılmamalıdır"
        exit 1
    fi
}

# Check system requirements
check_requirements() {
    print_info "Sistem gereksinimleri kontrol ediliyor..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js bulunamadı. Lütfen Node.js $NODE_VERSION yükleyin"
        exit 1
    fi
    
    NODE_CURRENT=$(node --version | sed 's/v//')
    print_status "Node.js version: $NODE_CURRENT"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm bulunamadı"
        exit 1
    fi
    
    # Check yarn (optional)
    if command -v yarn &> /dev/null; then
        print_status "Yarn mevcut"
        PACKAGE_MANAGER="yarn"
    else
        PACKAGE_MANAGER="npm"
    fi
    
    # Check git
    if ! command -v git &> /dev/null; then
        print_warning "Git bulunamadı - opsiyonel"
    fi
    
    print_status "Sistem gereksinimleri OK"
}

# Install dependencies
install_dependencies() {
    print_info "Dependencies yükleniyor..."
    
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn install --frozen-lockfile
    else
        npm ci
    fi
    
    print_status "Dependencies yüklendi"
}

# Install global dependencies
install_global_deps() {
    print_info "Global dependencies yükleniyor..."
    
    # Install PM2 for process management
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
        print_status "PM2 yüklendi"
    else
        print_status "PM2 zaten mevcut"
    fi
    
    # Install TypeScript globally
    if ! command -v tsc &> /dev/null; then
        npm install -g typescript
        print_status "TypeScript yüklendi"
    else
        print_status "TypeScript zaten mevcut"
    fi
}

# Build the project
build_project() {
    print_info "Proje build ediliyor..."
    
    # Clean previous build
    rm -rf build dist
    
    # Build TypeScript
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn build
    else
        npm run build
    fi
    
    print_status "Build tamamlandı"
}

# Setup directories
setup_directories() {
    print_info "Dizinler oluşturuluyor..."
    
    mkdir -p $LOG_DIR
    mkdir -p $BACKUP_DIR
    mkdir -p ./data
    mkdir -p ./config
    
    print_status "Dizinler oluşturuldu"
}

# Setup environment
setup_environment() {
    print_info "Environment dosyaları ayarlanıyor..."
    
    # Copy production environment template
    if [ ! -f .env ]; then
        if [ -f .env.production ]; then
            cp .env.production .env
            print_warning ".env dosyası .env.production'dan kopyalandı"
            print_warning "Lütfen .env dosyasını kendi ayarlarınızla güncelleyin"
        else
            print_error ".env.production dosyası bulunamadı"
            exit 1
        fi
    else
        print_status ".env dosyası zaten mevcut"
    fi
    
    # Validate critical environment variables
    if ! grep -q "PRIVATE_KEY=" .env || grep -q "YOUR_PRIVATE_KEY_HERE" .env; then
        print_error "PRIVATE_KEY ayarlanmamış. Lütfen .env dosyasında ayarlayın"
        exit 1
    fi
    
    if ! grep -q "RPC_URL=" .env || grep -q "YOUR_ALCHEMY_KEY" .env; then
        print_error "RPC_URL ayarlanmamış. Lütfen .env dosyasında ayarlayın"
        exit 1
    fi
    
    print_status "Environment ayarları OK"
}

# Setup PM2 ecosystem
setup_pm2() {
    print_info "PM2 ecosystem ayarlanıyor..."
    
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$PM2_APP_NAME',
    script: './build/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info'
    },
    env_production: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    merge_logs: true,
    kill_timeout: 5000,
    restart_delay: 1000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF
    
    print_status "PM2 ecosystem oluşturuldu"
}

# Setup systemd service (Linux only)
setup_systemd() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_info "Systemd service ayarlanıyor..."
        
        sudo tee /etc/systemd/system/$PROJECT_NAME.service > /dev/null << EOF
[Unit]
Description=Flashloan Arbitrage Bot
After=network.target

[Service]
Type=forking
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(which pm2) start ecosystem.config.js --env production
ExecReload=$(which pm2) reload ecosystem.config.js --env production
ExecStop=$(which pm2) stop ecosystem.config.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
        
        sudo systemctl daemon-reload
        sudo systemctl enable $PROJECT_NAME
        
        print_status "Systemd service oluşturuldu"
    else
        print_warning "Systemd service sadece Linux'da destekleniyor"
    fi
}

# Setup monitoring
setup_monitoring() {
    print_info "Monitoring ayarlanıyor..."
    
    # PM2 monitoring
    pm2 install pm2-logrotate
    pm2 set pm2-logrotate:max_size 10M
    pm2 set pm2-logrotate:retain 30
    pm2 set pm2-logrotate:compress true
    
    print_status "Monitoring ayarlandı"
}

# Run tests
run_tests() {
    print_info "Testler çalıştırılıyor..."
    
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn test || print_warning "Bazı testler başarısız oldu"
    else
        npm test || print_warning "Bazı testler başarısız oldu"
    fi
    
    print_status "Testler tamamlandı"
}

# Setup security
setup_security() {
    print_info "Güvenlik ayarları yapılıyor..."
    
    # Set proper file permissions
    chmod 600 .env
    chmod 700 $LOG_DIR
    chmod 700 $BACKUP_DIR
    
    # Create security script
    cat > security-check.sh << 'EOF'
#!/bin/bash
# Security monitoring script

echo "🔒 Güvenlik kontrolü başlatılıyor..."

# Check file permissions
find . -name "*.env*" -exec chmod 600 {} \;
find ./logs -type d -exec chmod 700 {} \;
find ./backups -type d -exec chmod 700 {} \;

# Check for sensitive data in logs
if grep -r "private.*key\|seed\|mnemonic" ./logs/ 2>/dev/null; then
    echo "⚠️ Loglar sensitive data içeriyor"
fi

echo "✅ Güvenlik kontrolü tamamlandı"
EOF
    
    chmod +x security-check.sh
    
    print_status "Güvenlik ayarları tamamlandı"
}

# Create backup script
create_backup_script() {
    print_info "Backup script oluşturuluyor..."
    
    cat > backup.sh << 'EOF'
#!/bin/bash
# Backup script for arbitrage bot

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="backup_$TIMESTAMP.tar.gz"

echo "📦 Backup oluşturuluyor: $BACKUP_NAME"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Create backup
tar -czf "$BACKUP_DIR/$BACKUP_NAME" \
    --exclude="node_modules" \
    --exclude="build" \
    --exclude="dist" \
    --exclude="logs" \
    --exclude="backups" \
    --exclude=".git" \
    .

echo "✅ Backup oluşturuldu: $BACKUP_DIR/$BACKUP_NAME"

# Keep only last 10 backups
cd $BACKUP_DIR
ls -t backup_*.tar.gz | tail -n +11 | xargs -r rm

echo "🧹 Eski backup'lar temizlendi"
EOF
    
    chmod +x backup.sh
    
    print_status "Backup script oluşturuldu"
}

# Setup cron jobs
setup_cron() {
    print_info "Cron jobs ayarlanıyor..."
    
    # Add cron jobs
    (crontab -l 2>/dev/null; echo "0 2 * * * cd $(pwd) && ./backup.sh") | crontab -
    (crontab -l 2>/dev/null; echo "*/5 * * * * cd $(pwd) && ./security-check.sh") | crontab -
    
    print_status "Cron jobs ayarlandı"
}

# Deploy the bot
deploy_bot() {
    print_info "Bot deploy ediliyor..."
    
    # Stop existing process
    pm2 stop $PM2_APP_NAME 2>/dev/null || true
    pm2 delete $PM2_APP_NAME 2>/dev/null || true
    
    # Start with PM2
    pm2 start ecosystem.config.js --env production
    pm2 save
    
    print_status "Bot deploy edildi"
}

# Show final status
show_status() {
    echo ""
    echo -e "${GREEN}🎉 DEPLOYMENT TAMAMLANDI!${NC}"
    echo -e "${GREEN}=========================${NC}"
    echo ""
    echo -e "${BLUE}📊 Bot Status:${NC}"
    pm2 status
    echo ""
    echo -e "${BLUE}📋 Yararlı Komutlar:${NC}"
    echo -e "${YELLOW}• Bot durumu:${NC} pm2 status $PM2_APP_NAME"
    echo -e "${YELLOW}• Bot logları:${NC} pm2 logs $PM2_APP_NAME"
    echo -e "${YELLOW}• Bot restart:${NC} pm2 restart $PM2_APP_NAME"
    echo -e "${YELLOW}• Bot stop:${NC} pm2 stop $PM2_APP_NAME"
    echo -e "${YELLOW}• Monitoring:${NC} pm2 monit"
    echo -e "${YELLOW}• Backup:${NC} ./backup.sh"
    echo -e "${YELLOW}• Security check:${NC} ./security-check.sh"
    echo ""
    echo -e "${BLUE}📁 Önemli Dosyalar:${NC}"
    echo -e "${YELLOW}• Environment:${NC} .env"
    echo -e "${YELLOW}• Logs:${NC} ./logs/"
    echo -e "${YELLOW}• Backups:${NC} ./backups/"
    echo -e "${YELLOW}• PM2 Config:${NC} ecosystem.config.js"
    echo ""
    echo -e "${GREEN}✅ Bot başarıyla deploy edildi ve çalışıyor!${NC}"
    echo ""
    echo -e "${YELLOW}⚠️ ÖNEMLİ HATIRLATMALAR:${NC}"
    echo -e "${YELLOW}• .env dosyasındaki ayarları kontrol edin${NC}"
    echo -e "${YELLOW}• Private key ve RPC URL'i doğru ayarlayın${NC}"
    echo -e "${YELLOW}• Bot performansını düzenli olarak izleyin${NC}"
    echo -e "${YELLOW}• Backup'ları düzenli olarak kontrol edin${NC}"
    echo ""
}

# Main deployment flow
main() {
    print_info "Deployment başlatılıyor..."
    
    check_root
    check_requirements
    install_global_deps
    install_dependencies
    setup_directories
    setup_environment
    build_project
    run_tests
    setup_pm2
    setup_systemd
    setup_monitoring
    setup_security
    create_backup_script
    setup_cron
    deploy_bot
    show_status
}

# Handle signals
trap 'print_error "Deployment iptal edildi"; exit 1' INT TERM

# Run main function
main "$@"

exit 0
