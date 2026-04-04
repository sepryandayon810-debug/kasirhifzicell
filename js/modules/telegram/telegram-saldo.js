/**
 * Telegram Saldo Module
 * File: js/modules/telegram/telegram-saldo.js
 */

const TelegramSaldo = {
    STORAGE_KEY: 'tg_saldo_config',
    STORAGE_KEY_TRANS: 'saldo_transaksi_aktif',
    
    data: {
        jenisSaldo: ['DANA', 'DIGIPOS', 'MASTERLOAD'],
        sheetId: '1fvLqdzZJL0Nuf627MNuNPkLDu_HZ0oALR6-mGED5Ihs',
        sheetTopup: 'TOP UP',
        sheetStep: 'STEP',
        scriptUrl: ''
    },
    
    transaksiAktif: null,
    
    init: function() {
        this.loadData();
    },
    
    loadData: function() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) this.data = { ...this.data, ...JSON.parse(saved) };
            
            const savedTrans = localStorage.getItem(this.STORAGE_KEY_TRANS);
            if (savedTrans) this.transaksiAktif = JSON.parse(savedTrans);
        } catch (e) {
            console.error('[TelegramSaldo] Error loading:', e);
        }
    },
    
    saveData: function() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        if (this.transaksiAktif) {
            localStorage.setItem(this.STORAGE_KEY_TRANS, JSON.stringify(this.transaksiAktif));
        } else {
            localStorage.removeItem(this.STORAGE_KEY_TRANS);
        }
    },
    
    validateConfig: function() {
        const errors = [];
        if (!this.data.scriptUrl || this.data.scriptUrl.trim() === '') {
            errors.push('Script URL GAS belum diisi');
        }
        if (!this.data.sheetId || this.data.sheetId.trim() === '') {
            errors.push('Sheet ID belum diisi');
        }
        return { valid: errors.length === 0, errors: errors };
    },
    
    renderSection: function() {
        const isWaiting = this.transaksiAktif !== null;
        const validation = this.validateConfig();
        const isFileProtocol = window.location.protocol === 'file:';
        
        let fileWarning = '';
        if (isFileProtocol) {
            fileWarning = TelegramUI.renderInfoBox('warning', 'ℹ️ Mode File Lokal Terdeteksi', 
                `Menggunakan proxy untuk koneksi ke Google Sheets.<br>
                <button class="tg-btn tg-btn-outline" onclick="TelegramModule.testProxy()" style="margin-top: 12px;">
                    🧪 Test Proxy
                </button>`);
        }
        
        let warningHtml = '';
        if (!validation.valid && !isWaiting) {
            warningHtml = TelegramUI.renderInfoBox('error', '⚠️ Konfigurasi Belum Lengkap',
                `<ul>${validation.errors.map(e => `<li>${e}</li>`).join('')}</ul>
                <div style="margin-top: 12px; font-size: 12px;">
                    ⬇️ Isi konfigurasi di bagian "☁️ Konfigurasi Google Sheet" di bawah
                </div>`);
        }
        
        const content = isWaiting ? this.renderInputNominal() : this.renderPilihJenis();
        
        return `
            <div class="tg-saldo-section">
                <div class="tg-saldo-header">
                    <div class="tg-saldo-header-icon">💰</div>
                    <span>Input Saldo ke Google Sheets</span>
                </div>
                ${fileWarning}
                ${warningHtml}
                ${content}
                ${this.renderDebugInfo()}
            </div>
        `;
    },
    
    renderPilihJenis: function() {
        const validation = this.validateConfig();
        const disabled = !validation.valid;
        
        const buttons = this.data.jenisSaldo.map(jenis => `
            <button class="tg-jenis-btn" onclick="TelegramModule.pilihJenisSaldo('${jenis}')" 
                    ${disabled ? 'disabled' : ''}>
                <span class="tg-jenis-icon">${this.getIcon(jenis)}</span>
                <span class="tg-jenis-label">${jenis}</span>
            </button>
        `).join('');
        
        return `
            ${TelegramUI.renderInfoBox('success', '📋 Cara Penggunaan', [
                'Klik jenis saldo yang ingin diinput (DANA/DIGIPOS/MASTERLOAD)',
                'Masukkan nominal saldo yang diterima',
                'Klik tombol "✅ Simpan ke Sheet"'
            ])}
            <div style="font-weight: 600; margin-bottom: 16px; color: var(--text-primary); font-size: 16px;">
                Pilih Jenis Saldo:
            </div>
            <div class="tg-jenis-grid">
                ${buttons}
            </div>
        `;
    },
    
    renderInputNominal: function() {
        const jenis = this.transaksiAktif?.namaItem || '';
        const icon = this.getIcon(jenis);
        
        return `
            <div class="tg-saldo-input-card">
                <div class="tg-saldo-input-header">
                    <div class="tg-saldo-input-icon">${icon}</div>
                    <div class="tg-saldo-input-title">
                        <div class="label">Input Saldo</div>
                        <div class="value">${jenis}</div>
                    </div>
                </div>
                
                <div class="tg-nominal-input-wrapper">
                    <label>Masukkan Nominal Saldo (Rp)</label>
                    <input type="number" id="saldoNominal" class="tg-nominal-input" placeholder="0"
                           onkeyup="TelegramSaldo.formatRupiah(this)"
                           onkeypress="if(event.key==='Enter')TelegramModule.kirimNominalSaldo()">
                    <div id="nominalDisplay" class="tg-nominal-display"></div>
                </div>
                
                <div class="tg-saldo-actions">
                    <button class="tg-btn-primary" onclick="TelegramModule.kirimNominalSaldo()">
                        ✅ SIMPAN KE SHEET
                    </button>
                    <button class="tg-btn-secondary" onclick="TelegramModule.batalSaldo()">
                        ❌ BATAL
                    </button>
                </div>
            </div>
        `;
    },
    
    renderDebugInfo: function() {
        const validation = this.validateConfig();
        return `
            <div class="tg-debug-box">
                <div class="tg-debug-title">🔧 Debug Info</div>
                <div class="tg-debug-item">
                    <span>Protocol:</span>
                    <span>${window.location.protocol}</span>
                </div>
                <div class="tg-debug-item">
                    <span>Script URL:</span>
                    <span>${this.data.scriptUrl ? '✅ Set' : '❌ Empty'}</span>
                </div>
                <div class="tg-debug-item">
                    <span>Sheet ID:</span>
                    <span>${this.data.sheetId ? '✅ Set' : '❌ Empty'}</span>
                </div>
                <div class="tg-debug-item">
                    <span>Config Valid:</span>
                    <span>${validation.valid ? '✅ Yes' : '❌ No'}</span>
                </div>
                <div class="tg-debug-item">
                    <span>Transaksi Aktif:</span>
                    <span>${this.transaksiAktif ? '✅ ' + this.transaksiAktif.namaItem : '❌ No'}</span>
                </div>
            </div>
        `;
    }
    
    getIcon: function(jenis) {
        const icons = { 'DANA': '💙', 'DIGIPOS': '🟡', 'MASTERLOAD': '🟢' };
        return icons[jenis] || '💰';
    },
    
    formatRupiah: function(input) {
        const value = input.value.replace(/\D/g, '');
        const formatted = new Intl.NumberFormat('id-ID').format(value);
        const display = document.getElementById('nominalDisplay');
        if (display) {
            display.textContent = value ? `Rp ${formatted}` : '';
        }
    },
    
    buildGetUrl: function(baseUrl, data) {
        const params = new URLSearchParams();
        params.append('_method', 'POST');
        params.append('_body', JSON.stringify(data));
        return `${baseUrl}?${params.toString()}`;
    },
    
    async apiCall(payload) {
        const targetUrl = this.data.scriptUrl;
        if (!targetUrl) throw new Error('Script URL belum diisi');
        
        // Try direct fetch first (if not file://)
        if (window.location.protocol !== 'file:') {
            try {
                const response = await fetch(targetUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                return await response.json();
            } catch (e) {
                console.log('Direct fetch failed, trying proxy...');
            }
        }
        
        // Use proxy for file:// or CORS issues
        const getUrl = this.buildGetUrl(targetUrl, payload);
        const response = await fetch(getUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        if (result.contents) return JSON.parse(result.contents);
        return result;
    },
    
    pilihJenis: async function(jenis) {
        const validation = this.validateConfig();
        if (!validation.valid) {
            alert('❌ Konfigurasi belum lengkap:\n\n' + validation.errors.join('\n'));
            return;
        }
        
        TelegramUtils.showToast(`⏳ Memulai transaksi ${jenis}...`);
        
        try {
            const payload = {
                action: 'initSaldo',
                sheetId: this.data.sheetId,
                chatId: 'HTML_' + Date.now(),
                namaItem: jenis
            };
            
            const result = await this.apiCall(payload);
            
            if (result.success) {
                this.transaksiAktif = {
                    transaksiId: result.transaksiId,
                    matchKey: result.matchKey,
                    namaItem: jenis,
                    row: result.row
                };
                this.saveData();
                
                TelegramUtils.showToast(`✅ Input nominal untuk ${jenis}`);
                TelegramMain.renderPage();
                
                setTimeout(() => {
                    const input = document.getElementById('saldoNominal');
                    if (input) {
                        input.focus();
                        input.select();
                    }
                }, 200);
            } else {
                throw new Error(result.error || 'Unknown error');
            }
        } catch (error) {
            console.error('[Saldo] Error:', error);
            alert('❌ Error:\n\n' + error.message);
        }
    },
    
    kirimNominal: async function() {
        const nominalInput = document.getElementById('saldoNominal');
        const nominal = parseInt(nominalInput.value.replace(/\D/g, ''));
        
        if (!nominal || nominal <= 0) {
            alert('❌ Nominal tidak valid!');
            nominalInput.focus();
            return;
        }
        
        if (!this.transaksiAktif) {
            alert('❌ Tidak ada transaksi aktif!');
            return;
        }
        
        TelegramUtils.showToast('⏳ Menyimpan ke Google Sheets...');
        
        try {
            const payload = {
                action: 'completeSaldo',
                sheetId: this.data.sheetId,
                matchKey: this.transaksiAktif.matchKey,
                nominal: nominal,
                transaksiId: this.transaksiAktif.transaksiId
            };
            
            const result = await this.apiCall(payload);
            
            if (result.success) {
                // Add to topups list
                const topup = {
                    id: this.transaksiAktif.transaksiId,
                    amount: nominal,
                    sender: 'Input Manual',
                    method: this.transaksiAktif.namaItem,
                    transactionId: this.transaksiAktif.transaksiId,
                    timestamp: Date.now(),
                    status: 'confirmed',
                    source: 'html_saldo',
                    syncedToSheet: true,
                    sheetRow: result.data?.row,
                    bulan: result.data?.bulan,
                    tanggal: result.data?.tanggal
                };
                
                TelegramTopup.addTopup(topup);
                
                const jenisTemp = this.transaksiAktif.namaItem;
                this.transaksiAktif = null;
                this.saveData();
                
                const formattedNominal = new Intl.NumberFormat('id-ID').format(nominal);
                alert(`✅ BERHASIL!\n\n${jenisTemp}: Rp ${formattedNominal}\nTanggal: ${result.data?.tanggal}\nSheet: TOP UP (Row ${result.data?.row})`);
                
                TelegramUtils.showToast(`✅ ${jenisTemp}: Rp ${formattedNominal} tersimpan!`);
                TelegramMain.renderPage();
            } else {
                throw new Error(result.error || 'Gagal menyimpan');
            }
        } catch (error) {
            console.error('[Saldo] Error:', error);
            alert('❌ Error saat menyimpan:\n\n' + error.message);
        }
    },
    
    batal: function() {
        this.transaksiAktif = null;
        this.saveData();
        TelegramUtils.showToast('Transaksi dibatalkan');
        TelegramMain.renderPage();
    },
    
    testProxy: async function() {
        TelegramUtils.showToast('🧪 Testing proxy...');
        try {
            const testUrl = 'https://api.allorigins.win/get?url=' + 
                           encodeURIComponent('https://httpbin.org/get');
            const response = await fetch(testUrl);
            const result = await response.json();
            
            if (result.contents) {
                alert('✅ Proxy berfungsi!');
            } else {
                alert('⚠️ Proxy response tidak sesuai format');
            }
        } catch (error) {
            alert('❌ Proxy error:\n\n' + error.message);
        }
    },
    
    checkPending: function() {
        // Already loaded in init
        console.log('[Saldo] Checked pending:', this.transaksiAktif);
    },
    
    bindEvents: function() {
        // Events bound via onclick in HTML
    }
};
