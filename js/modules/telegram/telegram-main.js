/**
 * Telegram Main Module - Core Router
 * File: js/modules/telegram/telegram-main.js
 */

const TelegramMain = {
    modules: {},
    
    init: function() {
        console.log('[Telegram] Initializing modules...');
        
        // Load semua sub-modules
        this.modules.config = TelegramConfig;
        this.modules.saldo = TelegramSaldo;
        this.modules.topup = TelegramTopup;
        this.modules.gas = TelegramGas;
        this.modules.ui = TelegramUI;
        this.modules.utils = TelegramUtils;
        
        // Init semua modules
        Object.values(this.modules).forEach(mod => {
            if (mod.init) mod.init();
        });
        
        // Render halaman
        this.renderPage();
        
        // Check pending saldo transaction
        this.modules.saldo.checkPending();
        
        console.log('[Telegram] All modules ready');
    },
    
    renderPage: function() {
        const container = document.getElementById('mainContent');
        if (!container) {
            console.error('[Telegram] mainContent not found');
            return;
        }
        
        const stats = this.modules.topup.getStats();
        const syncStatus = this.modules.topup.getSyncStatus();
        
        container.innerHTML = `
            <div class="tg-container">
                ${this.modules.ui.renderHeader()}
                ${this.modules.ui.renderStats(stats)}
                ${this.modules.saldo.renderSection()}
                ${this.modules.config.renderTelegramSection()}
                ${this.modules.topup.renderManualAddSection()}
                ${this.modules.gas.renderSection()}
                ${this.modules.config.renderSheetSection(syncStatus)}
                ${this.modules.topup.renderTopupListSection()}
            </div>
        `;
        
        // Bind events setelah render
        this.modules.gas.bindEvents();
        this.modules.saldo.bindEvents();
    },
    
    // Global helpers yang diexpose ke window
    toggleSection: function(sectionKey) {
        TelegramConfig.toggleSection(sectionKey);
        this.renderPage();
    },
    
    setTimeFilter: function(filter) {
        TelegramTopup.setTimeFilter(filter);
        this.renderPage();
    },
    
    applyCustomDate: function() {
        TelegramTopup.applyCustomDate();
        this.renderPage();
    },
    
    toggleTopupList: function() {
        TelegramTopup.toggleVisibility();
        this.renderPage();
    },
    
    setFilter: function(filter) {
        TelegramTopup.setStatusFilter(filter);
        this.renderPage();
    },
    
    saveTelegramConfig: function() {
        TelegramConfig.saveTelegramConfig();
    },
    
    testConnection: function() {
        TelegramConfig.testConnection();
    },
    
    saveSheetConfig: function() {
        TelegramConfig.saveSheetConfig();
    },
    
    testSheet: function() {
        TelegramGas.testConnection();
    },
    
    syncToSheet: function() {
        TelegramTopup.syncToSheet();
    },
    
    addManual: function() {
        TelegramTopup.addManual();
    },
    
    confirmTopup: function(id) {
        TelegramTopup.confirm(id);
    },
    
    rejectTopup: function(id) {
        TelegramTopup.reject(id);
    },
    
    deleteTopup: function(id) {
        TelegramTopup.deleteTopup(id);
    },
    
    // Saldo functions
    pilihJenisSaldo: function(jenis) {
        TelegramSaldo.pilihJenis(jenis);
    },
    
    kirimNominalSaldo: function() {
        TelegramSaldo.kirimNominal();
    },
    
    batalSaldo: function() {
        TelegramSaldo.batal();
    },
    
    testProxy: function() {
        TelegramSaldo.testProxy();
    }
};

// Expose ke global
window.TelegramModule = TelegramMain;

// Initialize saat DOM ready
document.addEventListener('DOMContentLoaded', function() {
    TelegramMain.init();
});
