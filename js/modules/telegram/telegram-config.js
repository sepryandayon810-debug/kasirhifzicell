/**
 * Telegram Config Module
 * File: js/modules/telegram/telegram-config.js
 */

const TelegramConfig = {
    STORAGE_KEY: 'tg_standalone_config',
    STORAGE_KEY_SECTIONS: 'tg_section_visibility',
    
    data: {
        botToken: '',
        chatId: '',
        webhookUrl: '',
        secretKey: '',
        sheetId: '',
        sheetName: 'Topups',
        scriptUrl: '',
        isPolling: false,
        lastSync: 0
    },
    
    sectionVisibility: {
        telegramConfig: false,
        manualTopup: false,
        gasSetup: false,
        sheetConfig: false
    },
    
    init: function() {
        this.loadData();
    },
    
    loadData: function() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) this.data = { ...this.data, ...JSON.parse(saved) };
            
            const savedSections = localStorage.getItem(this.STORAGE_KEY_SECTIONS);
            if (savedSections) this.sectionVisibility = { ...this.sectionVisibility, ...JSON.parse(savedSections) };
        } catch (e) {
            console.error('[TelegramConfig] Error loading:', e);
        }
    },
    
    saveData: function() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        localStorage.setItem(this.STORAGE_KEY_SECTIONS, JSON.stringify(this.sectionVisibility));
    },
    
    toggleSection: function(sectionKey) {
        this.sectionVisibility[sectionKey] = !this.sectionVisibility[sectionKey];
        this.saveData();
    },
    
    getDefaultWebhook: function() {
        return window.location.origin + '/api/telegram-webhook';
    },
    
    renderTelegramSection: function() {
        const isVisible = this.sectionVisibility.telegramConfig;
        const isConfigured = this.data.botToken && this.data.botToken.length > 10;
        const statusClass = isConfigured ? (this.data.isPolling ? 'active' : 'ready') : 'inactive';
        const statusText = isConfigured ? (this.data.isPolling ? 'Aktif' : 'Siap') : 'Belum Setup';
        
        return TelegramUI.renderSectionHeader('Konfigurasi Bot Telegram', '🔧', 'telegramConfig') +
            (isVisible ? `
            <div class="tg-section-content" style="padding: 20px; border-top: 1px solid #e0e0e0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 13px;">Bot Token</label>
                        <input type="password" id="tgToken" value="${TelegramUtils.escapeHtml(this.data.botToken)}" 
                               placeholder="123456789:ABC..." 
                               style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 13px;">Chat ID (Opsional)</label>
                        <input type="text" id="tgChat" value="${TelegramUtils.escapeHtml(this.data.chatId)}" 
                               placeholder="-100123..." 
                               style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 13px;">Webhook URL</label>
                        <input type="text" id="tgWebhook" value="${TelegramUtils.escapeHtml(this.data.webhookUrl || this.getDefaultWebhook())}" 
                               placeholder="https://..." 
                               style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 13px;">Secret Key</label>
                        <input type="text" id="tgSecret" value="${TelegramUtils.escapeHtml(this.data.secretKey)}" 
                               placeholder="rahasia..." 
                               style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="TelegramModule.saveTelegramConfig()" 
                            style="padding: 10px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                   color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        💾 Simpan Config
                    </button>
                    <button onclick="TelegramModule.testConnection()" 
                            style="padding: 10px 20px; background: #f5f5f5; color: #666; border: 2px solid #e0e0e0; 
                                   border-radius: 8px; cursor: pointer; font-weight: 600;">
                        🔌 Test Bot
                    </button>
                </div>
                <div id="tgTestResult" style="margin-top: 12px;"></div>
            </div>
            ` : '');
    },
    
    renderSheetSection: function(syncStatus) {
        const isVisible = this.sectionVisibility.sheetConfig;
        const validation = TelegramSaldo.validateConfig();
        const statusBadge = validation.valid ? 
            '<span style="background: #4caf50; padding: 2px 8px; border-radius: 10px; font-size: 11px;">✅ Ready</span>' : 
            '<span style="background: #ff9800; padding: 2px 8px; border-radius: 10px; font-size: 11px;">⚠️ Setup Required</span>';
        
        return TelegramUI.renderSectionHeader('Konfigurasi Google Sheet (WAJIB untuk Input Saldo)', '☁️', 'sheetConfig', statusBadge) +
            (isVisible ? `
            <div class="tg-section-content" style="padding: 20px; border-top: 1px solid #e0e0e0;">
                <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 16px; margin-bottom: 16px; border-radius: 8px;">
                    <strong>✅ Penting:</strong> Input Saldo memerlukan konfigurasi ini untuk menyimpan ke Sheet "TOP UP"
                </div>
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 13px;">
                            Google Sheet ID <span style="color: red;">*</span>
                        </label>
                        <input type="text" id="tgSheetId" value="${TelegramUtils.escapeHtml(this.data.sheetId)}" 
                               placeholder="1fvLqdzZJL0Nuf627MNuNPkLDu_HZ0oALR6-mGED5Ihs" 
                               style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                        <div style="font-size: 12px; color: #666; margin-top: 4px;">
                            Dari URL: docs.google.com/spreadsheets/d/<strong>SheetID</strong>/edit
                        </div>
                    </div>
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 13px;">Nama Sheet (Tab)</label>
                        <input type="text" id="tgSheetName" value="${TelegramUtils.escapeHtml(this.data.sheetName || 'Topups')}" 
                               placeholder="Topups" 
                               style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                    </div>
                </div>
                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 13px;">
                        Script URL (GAS Web App) <span style="color: red;">*</span>
                    </label>
                    <input type="text" id="tgScriptUrl" value="${TelegramUtils.escapeHtml(this.data.scriptUrl || '')}" 
                           placeholder="https://script.google.com/macros/s/.../exec" 
                           style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                    <div style="font-size: 12px; color: #666; margin-top: 4px;">
                        <strong>WAJIB:</strong> Deploy sebagai Web App dengan "Access: Anyone"
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="TelegramModule.saveSheetConfig()" 
                            style="padding: 10px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                   color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        💾 Simpan Config
                    </button>
                    <button onclick="TelegramModule.syncToSheet()" 
                            style="padding: 10px 20px; background: #4caf50; color: white; border: none; 
                                   border-radius: 8px; cursor: pointer; font-weight: 600;">
                        🔄 Sync Sekarang
                    </button>
                    <button onclick="TelegramModule.testSheet()" 
                            style="padding: 10px 20px; background: #f5f5f5; color: #666; border: 2px solid #e0e0e0; 
                                   border-radius: 8px; cursor: pointer; font-weight: 600;">
                        🔗 Test Koneksi
                    </button>
                </div>
                <div id="tgSyncResult" style="margin-top: 12px;">${syncStatus}</div>
            </div>
            ` : '');
    },
    
    saveTelegramConfig: function() {
        const token = document.getElementById('tgToken').value.trim();
        const chat = document.getElementById('tgChat').value.trim();
        const webhook = document.getElementById('tgWebhook').value.trim();
        const secret = document.getElementById('tgSecret').value.trim();
        
        if (token && !token.includes(':')) {
            alert('Format token salah. Harus ada tanda :');
            return;
        }
        
        this.data.botToken = token;
        this.data.chatId = chat;
        this.data.webhookUrl = webhook;
        this.data.secretKey = secret;
        
        this.saveData();
        TelegramUtils.showToast('✅ Konfigurasi Bot disimpan!');
        TelegramMain.renderPage();
    },
    
    saveSheetConfig: function() {
        const sheetId = document.getElementById('tgSheetId').value.trim();
        const sheetName = document.getElementById('tgSheetName').value.trim();
        const scriptUrl = document.getElementById('tgScriptUrl').value.trim();
        
        this.data.sheetId = sheetId;
        this.data.sheetName = sheetName || 'Topups';
        this.data.scriptUrl = scriptUrl;
        
        // Update juga di Saldo config
        TelegramSaldo.data.sheetId = sheetId || '1fvLqdzZJL0Nuf627MNuNPkLDu_HZ0oALR6-mGED5Ihs';
        TelegramSaldo.data.scriptUrl = scriptUrl;
        TelegramSaldo.saveData();
        
        this.saveData();
        TelegramUtils.showToast('✅ Konfigurasi Sheet disimpan!');
        TelegramMain.renderPage();
    },
    
    testConnection: async function() {
        const resultDiv = document.getElementById('tgTestResult');
        const token = document.getElementById('tgToken').value.trim();
        
        if (!token) {
            resultDiv.innerHTML = '<div style="color: red;">❌ Isi token dulu</div>';
            return;
        }
        
        resultDiv.innerHTML = '<div style="color: blue;">⏳ Testing...</div>';
        
        try {
            const proxy = 'https://api.allorigins.win/get?url=';
            const url = encodeURIComponent(`https://api.telegram.org/bot${token}/getMe`);
            
            const res = await fetch(proxy + url);
            const data = await res.json();
            const result = JSON.parse(data.contents);
            
            if (result.ok) {
                resultDiv.innerHTML = `<div style="color: green;">✅ Bot: @${result.result.username}</div>`;
            } else {
                resultDiv.innerHTML = `<div style="color: red;">❌ ${result.description}</div>`;
            }
        } catch (e) {
            resultDiv.innerHTML = `<div style="color: red;">❌ Error: ${e.message}</div>`;
        }
    }
};
