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
            fileWarning = `
                <div style="background: #e3f2fd; border: 2px solid #2196f3; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                    <div style="color: #1565c0; font-weight: 600; margin-bottom: 8px;">ℹ️ Mode File Lokal Terdeteksi</div>
                    <div style="color: #1565c0; font-size: 13px; margin-bottom: 12px;">
                        Menggunakan proxy untuk koneksi ke Google Sheets.
                    </div>
                    <button onclick="TelegramModule.testProxy()" 
                            style="background: #2196f3; color: white; border: none; padding: 8px 16px; 
                                   border-radius: 6px; cursor: pointer; font-size: 12px; margin-right: 8px;">
                        🧪 Test Proxy
                    </button>
                </div>
            `;
        }
        
        let warningHtml = '';
        if (!validation.valid && !isWaiting) {
            warningHtml = `
                <div style="background: #fff3e0; border: 2px solid #ff9800; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                    <div style="color: #e65100; font-weight: 600; margin-bottom: 8px;">⚠️ Konfigurasi Belum Lengkap</div>
                    <ul style="margin: 0; padding-left: 20px; color: #e65100; font-size: 13px;">
                        ${validation.errors.map(e => `<li>${e}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        return `
            <div class="tg-saldo-section" style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); 
                        border: 2px solid #4caf50; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px 0; color: #2e7d32; display: flex; align-items: center; gap: 8px;">
                    💰 Input Saldo ke Google Sheets
                </h3>
                ${fileWarning}
                ${warningHtml}
                ${isWaiting ? this.renderInputNominal() : this.renderPilihJenis()}
                ${this.renderDebugInfo()}
            </div>
        `;
    },
    
    renderPilihJenis: function() {
        const validation = this.validateConfig();
        const disabled = !validation.valid;
        
        const buttons = this.data.jenisSaldo.map(jenis => `
            <button onclick="TelegramModule.pilihJenisSaldo('${jenis}')" 
                    ${disabled ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
                    style="background: white; border: 2px solid #4caf50; color: #4caf50; padding: 20px; 
                           border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s;
                           display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%;">
                <span style="font-size: 32px;">${this.getIcon(jenis)}</span>
                <span style="font-size: 16px;">${jenis}</span>
            </button>
        `).join('');
        
        return `
            <div style="background: white; border-left: 4px solid #4caf50; padding: 16px; margin-bottom: 16px; border-radius: 8px;">
                <strong style="color: #2e7d32;">📋 Cara Penggunaan:</strong>
                <ol style="margin: 10px 0; padding-left: 20px; font-size: 14px; color: #555; line-height: 1.8;">
                    <li>Klik jenis saldo yang ingin diinput (DANA/DIGIPOS/MASTERLOAD)</li>
                    <li>Masukkan nominal saldo yang diterima</li>
                    <li>Klik tombol "✅ Simpan ke Sheet"</li>
                </ol>
            </div>
            <div style="font-weight: 600; margin-bottom: 12px; color: #333; font-size: 16px;">Pilih Jenis Saldo:</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px;">
                ${buttons}
            </div>
        `;
    },
    
    renderInputNominal: function() {
        const jenis = this.transaksiAktif?.namaItem || '';
        const icon = this.getIcon(jenis);
        
        return `
            <div style="background: white; padding: 24px; border-radius: 16px; border: 3px solid #4caf50; 
                        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2); animation: slideIn 0.3s ease;">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding-bottom: 16px; 
                            border-bottom: 2px solid #e8f5e9;">
                    <div style="font-size: 48px; background: #e8f5e9; width: 80px; height: 80px; 
                                display: flex; align-items: center; justify-content: center; border-radius: 50%;">
                        ${icon}
                    </div>
                    <div>
                        <div style="font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
                            Input Saldo
                        </div>
                        <div style="font-size: 28px; font-weight: 700; color: #2e7d32;">${jenis}</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <label style="display: block; margin-bottom: 12px; font-weight: 600; color: #555; font-size: 15px;">
                        Masukkan Nominal Saldo (Rp)
                    </label>
                    <input type="number" id="saldoNominal" placeholder="0" 
                           style="width: 100%; padding: 20px; font-size: 32px; font-weight: 700; 
                                  border: 2px solid #ddd; border-radius: 12px; text-align: center;"
                           onkeyup="TelegramSaldo.formatRupiah(this)"
                           onkeypress="if(event.key==='Enter')TelegramModule.kirimNominalSaldo()">
                    <div id="nominalDisplay" style="text-align: center; margin-top: 12px; font-size: 18px; 
                                                    color: #4caf50; font-weight: 600; min-height: 24px;"></div>
                </div>
                
                <div style="display: flex; gap: 12px;">
                    <button onclick="TelegramModule.kirimNominalSaldo()" 
                            style="flex: 2; background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%); 
                                   color: white; padding: 18px; border: none; border-radius: 12px; 
                                   font-weight: 700; cursor: pointer; font-size: 16px;">
                        ✅ SIMPAN KE SHEET
                    </button>
                    <button onclick="TelegramModule.batalSaldo()" 
                            style="flex: 1; background: #f5f5f5; color: #666; padding: 18px; 
                                   border: 2px solid #ddd; border-radius: 12px; font-weight: 600; 
                                   cursor: pointer; font-size: 14px;">
                        ❌ BATAL
                    </button>
                </div>
            </div>
        `;
    },
    
    renderDebugInfo: function() {
        const validation = this.validateConfig();
        return `
            <div style="margin-top: 16px; padding: 12px; background: #f5f5f5; border-radius: 8px; 
                        font-size: 11px; font-family: monospace;">
                <div style="font-weight: 600; margin-bottom: 8px;">🔧 Debug Info:</div>
                <div>Protocol: ${window.location.protocol}</div>
                <div>Script URL: ${this.data.scriptUrl ? '✅ Set' : '❌ Empty'}</div>
                <div>Sheet ID: ${this.data.sheetId ? '✅ Set' : '❌ Empty'}</div>
                <div>Config Valid: ${validation.valid ? '✅ Yes' : '❌ No'}</div>
                <div>Transaksi Aktif: ${this.transaksiAktif ? '✅ ' + this.transaksiAktif.namaItem : '❌ No'}</div>
            </div>
        `;
    },
    
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
