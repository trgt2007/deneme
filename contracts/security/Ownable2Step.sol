// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title Ownable2Step
 * @author Arbitrage Bot System
 * @notice 2 aşamalı güvenli ownership transfer mekanizması
 * @dev OpenZeppelin Ownable'ın geliştirilmiş versiyonu - yanlışlıkla ownership kaybını önler
 */
abstract contract Ownable2Step is Context {
    // ============ State Variables ============
    
    /**
     * @notice Mevcut owner adresi
     */
    address private _owner;
    
    /**
     * @notice Bekleyen yeni owner adresi
     */
    address private _pendingOwner;
    
    /**
     * @notice Emergency admin adresi (owner dışında acil durum yetkilisi)
     */
    address private _emergencyAdmin;
    
    /**
     * @notice Ownership transfer başlatma zamanı
     */
    uint256 private _ownershipTransferInitiatedAt;
    
    /**
     * @notice Ownership transfer timeout süresi (48 saat)
     */
    uint256 public constant OWNERSHIP_TRANSFER_TIMEOUT = 48 hours;
    
    /**
     * @notice Emergency action cooldown süresi
     */
    uint256 public constant EMERGENCY_COOLDOWN = 24 hours;
    
    /**
     * @notice Son emergency action zamanı
     */
    uint256 private _lastEmergencyAction;
    
    /**
     * @notice Contract pause durumu
     */
    bool private _paused;
    
    /**
     * @notice Emergency withdrawal limiti (günlük)
     */
    mapping(uint256 => uint256) private _dailyEmergencyWithdrawals;
    uint256 public constant MAX_DAILY_EMERGENCY_WITHDRAWAL = 100 ether;
    
    // ============ Events ============
    
    /**
     * @notice Ownership transfer başlatıldığında emit edilir
     */
    event OwnershipTransferStarted(
        address indexed previousOwner, 
        address indexed newOwner,
        uint256 initiatedAt
    );
    
    /**
     * @notice Ownership transfer tamamlandığında emit edilir
     */
    event OwnershipTransferred(
        address indexed previousOwner, 
        address indexed newOwner
    );
    
    /**
     * @notice Ownership transfer iptal edildiğinde emit edilir
     */
    event OwnershipTransferCancelled(
        address indexed pendingOwner
    );
    
    /**
     * @notice Emergency admin değiştiğinde emit edilir
     */
    event EmergencyAdminUpdated(
        address indexed previousAdmin,
        address indexed newAdmin
    );
    
    /**
     * @notice Emergency action gerçekleştiğinde emit edilir
     */
    event EmergencyActionExecuted(
        string action,
        address indexed executor,
        uint256 timestamp
    );
    
    /**
     * @notice Contract pause durumu değiştiğinde emit edilir
     */
    event PausedStateChanged(bool isPaused);
    
    // ============ Errors ============
    
    /**
     * @notice Yetkisiz erişim hatası
     */
    error OwnableUnauthorizedAccount(address account);
    
    /**
     * @notice Geçersiz owner adresi hatası
     */
    error OwnableInvalidOwner(address owner);
    
    /**
     * @notice Pending owner yok hatası
     */
    error NoPendingOwner();
    
    /**
     * @notice Transfer timeout hatası
     */
    error OwnershipTransferExpired();
    
    /**
     * @notice Emergency cooldown hatası
     */
    error EmergencyCooldownActive();
    
    /**
     * @notice Günlük limit aşımı hatası
     */
    error DailyLimitExceeded();
    
    /**
     * @notice Contract paused hatası
     */
    error ContractPaused();
    
    // ============ Modifiers ============
    
    /**
     * @notice Sadece owner tarafından çağrılabilir
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }
    
    /**
     * @notice Sadece pending owner tarafından çağrılabilir
     */
    modifier onlyPendingOwner() {
        if (_msgSender() != _pendingOwner) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
        _;
    }
    
    /**
     * @notice Owner veya emergency admin tarafından çağrılabilir
     */
    modifier onlyOwnerOrEmergencyAdmin() {
        if (_msgSender() != _owner && _msgSender() != _emergencyAdmin) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
        _;
    }
    
    /**
     * @notice Contract pause edilmemişse çalışır
     */
    modifier whenNotPaused() {
        if (_paused) {
            revert ContractPaused();
        }
        _;
    }
    
    /**
     * @notice Emergency cooldown kontrolü
     */
    modifier checkEmergencyCooldown() {
        if (block.timestamp < _lastEmergencyAction + EMERGENCY_COOLDOWN) {
            revert EmergencyCooldownActive();
        }
        _;
    }
    
    // ============ Constructor ============
    
    /**
     * @notice Contract constructor
     * @param initialOwner İlk owner adresi
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }
    
    // ============ Public View Functions ============
    
    /**
     * @notice Mevcut owner'ı döndürür
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }
    
    /**
     * @notice Bekleyen owner'ı döndürür
     */
    function pendingOwner() public view virtual returns (address) {
        return _pendingOwner;
    }
    
    /**
     * @notice Emergency admin'i döndürür
     */
    function emergencyAdmin() public view virtual returns (address) {
        return _emergencyAdmin;
    }
    
    /**
     * @notice Contract'ın pause durumunu döndürür
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }
    
    /**
     * @notice Ownership transfer'in ne zaman başlatıldığını döndürür
     */
    function ownershipTransferInitiatedAt() public view virtual returns (uint256) {
        return _ownershipTransferInitiatedAt;
    }
    
    /**
     * @notice Bugünkü emergency withdrawal miktarını döndürür
     */
    function todayEmergencyWithdrawals() public view virtual returns (uint256) {
        uint256 today = block.timestamp / 1 days;
        return _dailyEmergencyWithdrawals[today];
    }
    
    // ============ Ownership Management Functions ============
    
    /**
     * @notice Ownership transfer'i başlatır (1. adım)
     * @param newOwner Yeni owner adresi
     * @dev Sadece mevcut owner çağırabilir
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        
        if (newOwner == _owner) {
            revert OwnableInvalidOwner(newOwner);
        }
        
        _pendingOwner = newOwner;
        _ownershipTransferInitiatedAt = block.timestamp;
        
        emit OwnershipTransferStarted(_owner, newOwner, block.timestamp);
    }
    
    /**
     * @notice Ownership transfer'i tamamlar (2. adım)
     * @dev Sadece pending owner çağırabilir ve timeout süresi içinde olmalı
     */
    function acceptOwnership() public virtual onlyPendingOwner {
        if (_pendingOwner == address(0)) {
            revert NoPendingOwner();
        }
        
        if (block.timestamp > _ownershipTransferInitiatedAt + OWNERSHIP_TRANSFER_TIMEOUT) {
            revert OwnershipTransferExpired();
        }
        
        address previousOwner = _owner;
        _transferOwnership(_pendingOwner);
        
        delete _pendingOwner;
        delete _ownershipTransferInitiatedAt;
        
        emit OwnershipTransferred(previousOwner, _owner);
    }
    
    /**
     * @notice Bekleyen ownership transfer'i iptal eder
     * @dev Sadece mevcut owner çağırabilir
     */
    function cancelOwnershipTransfer() public virtual onlyOwner {
        if (_pendingOwner == address(0)) {
            revert NoPendingOwner();
        }
        
        address cancelledPendingOwner = _pendingOwner;
        
        delete _pendingOwner;
        delete _ownershipTransferInitiatedAt;
        
        emit OwnershipTransferCancelled(cancelledPendingOwner);
    }
    
    /**
     * @notice Ownership'i tamamen bırakır
     * @dev Dikkat: Bu işlem geri alınamaz!
     */
    function renounceOwnership() public virtual onlyOwner {
        // İki aşamalı onay gerektirir
        if (_pendingOwner != address(0xdead)) {
            // İlk aşama: dead address'e transfer başlat
            transferOwnership(address(0xdead));
        } else {
            // İkinci aşama: dead address olarak accept et
            _transferOwnership(address(0));
            delete _pendingOwner;
            delete _ownershipTransferInitiatedAt;
            emit OwnershipTransferred(_owner, address(0));
        }
    }
    
    // ============ Emergency Management Functions ============
    
    /**
     * @notice Emergency admin'i günceller
     * @param newEmergencyAdmin Yeni emergency admin adresi
     * @dev Sadece owner çağırabilir
     */
    function setEmergencyAdmin(address newEmergencyAdmin) public virtual onlyOwner {
        address previousAdmin = _emergencyAdmin;
        _emergencyAdmin = newEmergencyAdmin;
        
        emit EmergencyAdminUpdated(previousAdmin, newEmergencyAdmin);
    }
    
    /**
     * @notice Contract'ı pause eder
     * @dev Owner veya emergency admin çağırabilir
     */
    function pause() public virtual onlyOwnerOrEmergencyAdmin {
        _paused = true;
        _recordEmergencyAction("pause");
        
        emit PausedStateChanged(true);
    }
    
    /**
     * @notice Contract'ı unpause eder
     * @dev Sadece owner çağırabilir
     */
    function unpause() public virtual onlyOwner {
        _paused = false;
        
        emit PausedStateChanged(false);
    }
    
    /**
     * @notice Emergency fund withdrawal
     * @param token Token adresi (ETH için address(0))
     * @param amount Çekilecek miktar
     * @param recipient Alıcı adresi
     * @dev Emergency durumlar için, günlük limit ile kısıtlı
     */
    function emergencyWithdraw(
        address token,
        uint256 amount,
        address recipient
    ) public virtual onlyOwnerOrEmergencyAdmin checkEmergencyCooldown {
        if (recipient == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        
        // Günlük limit kontrolü
        uint256 today = block.timestamp / 1 days;
        uint256 ethValue = _getETHValue(token, amount);
        
        if (_dailyEmergencyWithdrawals[today] + ethValue > MAX_DAILY_EMERGENCY_WITHDRAWAL) {
            revert DailyLimitExceeded();
        }
        
        _dailyEmergencyWithdrawals[today] += ethValue;
        
        // Transfer işlemi
        if (token == address(0)) {
            // ETH transfer
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            // Token transfer
            _safeTransfer(token, recipient, amount);
        }
        
        _recordEmergencyAction("withdraw");
    }
    
    // ============ Internal Functions ============
    
    /**
     * @notice Owner kontrolü yapar
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }
    
    /**
     * @notice Internal ownership transfer
     */
    function _transferOwnership(address newOwner) internal virtual {
        _owner = newOwner;
    }
    
    /**
     * @notice Emergency action'ı kaydeder
     */
    function _recordEmergencyAction(string memory action) internal virtual {
        _lastEmergencyAction = block.timestamp;
        emit EmergencyActionExecuted(action, _msgSender(), block.timestamp);
    }
    
    /**
     * @notice Token'ın ETH değerini hesaplar (basitleştirilmiş)
     * @dev Gerçek implementasyonda oracle kullanılmalı
     */
    function _getETHValue(address token, uint256 amount) internal pure virtual returns (uint256) {
        if (token == address(0)) {
            return amount;
        }
        // Simplified: assume 1:1 for stablecoins, would use oracle in production
        return amount / 1000; // Assume 1 ETH = 1000 tokens
    }
    
    /**
     * @notice Güvenli token transfer
     */
    function _safeTransfer(address token, address to, uint256 amount) internal virtual {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(0xa9059cbb, to, amount) // transfer(address,uint256)
        );
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "Token transfer failed"
        );
    }
    
    // ============ Security Hook Functions ============
    
    /**
     * @notice Before ownership transfer hook
     * @dev Alt kontratlar tarafından override edilebilir
     */
    function _beforeOwnershipTransfer(address previousOwner, address newOwner) internal virtual {}
    
    /**
     * @notice After ownership transfer hook
     * @dev Alt kontratlar tarafından override edilebilir
     */
    function _afterOwnershipTransfer(address previousOwner, address newOwner) internal virtual {}
}