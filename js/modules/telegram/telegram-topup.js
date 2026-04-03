/**
 * Telegram Topup Module
 * File: js/modules/telegram/telegram-topup.js
 */

const TelegramTopup = {
    STORAGE_KEY: 'tg_standalone_topups',
    STORAGE_KEY_FILTER: 'tg_time_filter',
    STORAGE_KEY_CUSTOM_RANGE: 'tg_custom_range',
    STORAGE_KEY_VISIBLE: 'tg_topup_list_visible',
    
    data: [],
    currentFilter: 'all',
    currentTimeFilter: 'month',
    customDateRange: { start: null, end: null },
    isVisible: true,
    
    TIME_FILTERS: {
        today: { label: 'Hari Ini', icon: '📅' },
        yesterday: { label: 'Kemarin', icon: '📆' },
        month: { label: 'Bulan Ini', icon: '📊' },
        year: { label: 'Tahun Ini', icon: '📈' },
        custom: { label: 'Custom', icon: '📋' }
    },
    
    init: function() {
        this.loadData();
    },
    
    loadData: function() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) this.data = JSON.parse(saved);
            
            const savedFilter = localStorage.getItem(this.STORAGE_KEY_FILTER);
            if (savedFilter) this.currentTimeFilter = savedFilter;
            
            const savedRange = localStorage.getItem(this.STORAGE_KEY_CUSTOM_RANGE);
            if (savedRange) this.customDateRange = JSON.parse(savedRange);
            
            const savedVisible = localStorage.getItem(this.STORAGE_KEY_VISIBLE);
            if (savedVisible !== null) this.isVisible = JSON.parse(savedVisible);
        } catch (e) {
            console.error('[TelegramTopup] Error loading:', e);
        }
    },
    
    saveData: function() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        localStorage.setItem(this.STORAGE_KEY_FILTER, this.currentTimeFilter);
        localStorage.setItem(this.STORAGE_KEY_CUSTOM_RANGE, JSON.stringify(this.customDateRange));
        localStorage.setItem(this.STORAGE_KEY_VISIBLE, JSON.stringify(this.isVisible));
    },
    
    addTopup: function(topup) {
        this.data.push(topup);
        this.saveData();
    },
    
    getFilteredByTime: function() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        return this.data.filter(t => {
            const d = new Date(t.timestamp);
            
            switch(this.currentTimeFilter) {
                case 'today':
                    return d >= today;
                case 'yesterday':
                    return d >= yesterday && d < today;
                case 'month':
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                case 'year':
                    return d.getFullYear() === now.getFullYear();
                case 'custom':
                    if (!this.customDateRange.start || !this.customDateRange.end) return true;
                    const start = new Date(this.customDateRange.start);
                    const end = new Date(this.customDateRange.end);
                    end.setHours(23, 59, 59, 999);
                    return d >= start && d <= end;
                default:
                    return true;
            }
        });
    },
    
    getFilterLabel: function() {
        if (this.currentTimeFilter === 'custom' && this.customDateRange.start && this.customDateRange.end) {
            const start = new Date(this.customDateRange.start).toLocaleDateString('id-ID');
            const end = new Date(this.customDateRange.end).toLocaleDateString('id-ID');
            return `${start} - ${end}`;
        }
        return this.TIME_FILTERS[this.currentTimeFilter].label;
    },
    
    getStats: function() {
        const filtered = this.getFilteredByTime();
        let total = 0, confirmed = 0, pending = 0, rejected = 0, synced = 0;
        
        filtered.forEach(t => {
            if (t.status === 'confirmed') {
                total += parseFloat(t.amount) || 0;
                confirmed++;
            } else if (t.status === 'pending') {
                pending++;
            } else if (t.status === 'rejected') {
                rejected++;
            }
            if (t.syncedToSheet) synced++;
        });
        
        return { total, confirmed, pending, rejected, synced, count: filtered.length };
    },
    
    getSyncStatus: function() {
        const unsynced = this.data.filter(t => !t.syncedToSheet).length;
        if (unsynced === 0) {
            return '<div style="color: green;">✅ Semua data tersync</div>';
        }
        return `<div style="color: orange;">⏳ ${unsynced} data belum tersync</div>`;
    },
    
    setTimeFilter: function(filter) {
        this.currentTimeFilter = filter;
        if (filter !== 'custom') {
            this.customDateRange = { start: null, end: null };
        }
        this.saveData();
    },
    
    applyCustomDate: function() {
        const start = document.getElementById('customStart').value;
        const end = document.getElementById('customEnd').value;
        
        if (!start || !end) {
            alert('⚠️ Pilih tanggal mulai dan tanggal akhir!');
            return;
        }
        
        if (new Date(start) > new Date(end)) {
            alert('⚠️ Tanggal mulai tidak boleh lebih besar dari tanggal akhir!');
            return;
        }
        
        this.customDateRange = { start, end };
        this.saveData();
        TelegramUtils.showToast(`✅ Filter: ${new Date(start).toLocaleDateString('id-ID')} - ${new Date(end).toLocaleDateString('id-ID')}`);
    },
    
    toggleVisibility: function() {
        this.isVisible = !this.isVisible;
        this.saveData();
    },
    
    setStatusFilter: function(filter) {
        this.currentFilter = filter;
    },
    
    renderManualAddSection: function() {
        const isVisible = TelegramConfig.sectionVisibility.manualTopup;
        
        return TelegramUI.renderSectionHeader('Tambah Topup Manual (Lainnya)', '➕', 'manualTopup') +
            (isVisible ? `
            <div class="tg-section-content" style="padding: 20px; border-top: 1px solid #e0e0e0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 100px; gap: 12px; align-items: end;">
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 13px;">Jumlah (Rp)</label>
                        <input type="number" id="manualAmount" placeholder="100000" 
                               style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 13px;">Pengirim</label>
                        <input type="text" id="manualSender" placeholder="Nama" 
                               style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 13px;">Metode</label>
                        <select id="manualMethod" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                            <option>Transfer BCA</option>
                            <option>Transfer BNI</option>
                            <option>Transfer BRI</option>
                            <option>Transfer Mandiri</option>
                            <option>DANA</option>
                            <option>GoPay</option>
                            <option>OVO</option>
                            <option>ShopeePay</option>
                            <option>Lainnya</option>
                        </select>
                    </div>
                    <div>
                        <button onclick="TelegramModule.addManual()" 
                                style="width: 100%; padding: 10px; background: #4caf50; color: white; 
                                       border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                            Tambah
                        </button>
                    </div>
                </div>
            </div>
            ` : '');
    },
    
    renderTopupListSection: function() {
        const timeFiltered = this.getFilteredByTime();
        let statusFiltered = timeFiltered;
        if (this.currentFilter !== 'all') {
            statusFiltered = timeFiltered.filter(t => t.status === this.currentFilter);
        }
        const filtered = statusFiltered.sort((a, b) => b.timestamp - a.timestamp);
        
        const arrowIcon = this.isVisible ? '🔽' : '▶️';
        const containerDisplay = this.isVisible ? 'block' : 'none';
        
        let html = `
            <div style="background: white; border-radius: 16px; padding: 20px; margin-bottom: 24px; 
                        box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                
                <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" 
                     onclick="TelegramModule.toggleTopupList()">
                    <h3 style="margin: 0; color: #333; display: flex; align-items: center; gap: 8px; font-size: 18px;">
                        📨 Daftar Topup 
                        <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                     color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px;">
                            ${filtered.length}
                        </span>
                        <span style="font-size: 13px; color: #666; font-weight: 400; margin-left: 8px;">
                            (${this.getFilterLabel()})
                        </span>
                    </h3>
                    <button style="background: #f5f5f5; border: none; padding: 8px 16px; border-radius: 8px; 
                                   cursor: pointer; font-size: 16px;">
                        <span>${arrowIcon}</span>
                        <span style="font-size: 12px; color: #666; font-weight: 500; margin-left: 6px;">
                            ${this.isVisible ? 'Sembunyikan' : 'Tampilkan'}
                        </span>
                    </button>
                </div>
        `;
        
        if (this.isVisible) {
            html += `
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e0e0e0;">
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 16px;">
                        <span style="font-size: 13px; color: #666; font-weight: 500;">Filter Status:</span>
                        ${['all', 'pending', 'confirmed', 'rejected'].map(f => `
                            <button onclick="event.stopPropagation(); TelegramModule.setFilter('${f}')" 
                                    style="padding: 6px 14px; border: 2px solid ${this.currentFilter === f ? 
                                        (f === 'all' ? '#667eea' : f === 'pending' ? '#ff9800' : 
                                         f === 'confirmed' ? '#4caf50' : '#f44336') : '#e0e0e0'}; 
                                   background: ${this.currentFilter === f ? 
                                        (f === 'all' ? '#667eea' : f === 'pending' ? '#ff9800' : 
                                         f === 'confirmed' ? '#4caf50' : '#f44336') : 'white'}; 
                                   color: ${this.currentFilter === f ? 'white' : '#666'}; 
                                   border-radius: 16px; cursor: pointer; font-size: 12px; font-weight: 500;">
                                ${f === 'all' ? 'Semua' : f === 'pending' ? 'Pending' : 
                                  f === 'confirmed' ? 'Dikonfirmasi' : 'Ditolak'}
                            </button>
                        `).join('')}
                    </div>
                    ${this.renderTopupItems(filtered)}
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    },
    
    renderTopupItems: function(items) {
        if (items.length === 0) {
            return `
                <div style="text-align: center; padding: 40px 20px; color: #999;">
                    <div style="font-size: 48px; margin-bottom: 12px;">📭</div>
                    <div style="font-size: 16px; font-weight: 500; color: #666; margin-bottom: 4px;">
                        Tidak ada data topup
                    </div>
                    <div style="font-size: 13px; color: #999;">
                        untuk periode ${this.getFilterLabel().toLowerCase()}
                    </div>
                </div>
            `;
        }
        
        return `
            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${items.map(t => this.renderTopupItem(t)).join('')}
            </div>
        `;
    },
    
    renderTopupItem: function(t) {
        const date = new Date(t.timestamp);
        const dateStr = date.toLocaleDateString('id-ID');
        const timeStr = date.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
        const isSynced = t.syncedToSheet ? '✓' : '';
        
        let statusBg, statusText, actions;
        
        if (t.status === 'confirmed') {
            statusBg = '#e8f5e9';
            statusText = '✅ Dikonfirmasi';
            actions = '';
        } else if (t.status === 'rejected') {
            statusBg = '#ffebee';
            statusText = '❌ Ditolak';
            actions = '';
        } else {
            statusBg = '#fff3e0';
            statusText = '⏳ Pending';
            actions = `
                <button onclick="event.stopPropagation(); TelegramModule.confirmTopup('${t.id}')" 
                        style="background: #4caf50; color: white; border: none; padding: 6px 12px; 
                               border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;">
                    Konfirmasi
                </button>
                <button onclick="event.stopPropagation(); TelegramModule.rejectTopup('${t.id}')" 
                        style="background: #f44336; color: white; border: none; padding: 6px 12px; 
                               border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;">
                    Tolak
                </button>
            `;
        }
        
        return `
            <div style="background: ${statusBg}; border-radius: 12px; padding: 16px; 
                        border-left: 4px solid ${t.status === 'confirmed' ? '#4caf50' : 
                                                t.status === 'rejected' ? '#f44336' : '#ff9800'};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                    <div style="flex: 1;">
                        <div style="font-size: 20px; font-weight: 700; color: #333; margin-bottom: 4px;">
                            ${TelegramUtils.formatMoney(t.amount)} 
                            <span style="font-size: 12px; color: #4caf50; margin-left: 4px;">${isSynced}</span>
                        </div>
                        <div style="font-size: 13px; color: #666;">
                            <span style="font-weight: 500; color: #333;">${TelegramUtils.escapeHtml(t.sender || 'Unknown')}</span>
                            <span style="color: #ccc; margin: 0 6px;">•</span>
                            <span>${TelegramUtils.escapeHtml(t.method || '-')}</span>
                            <span style="color: #ccc; margin: 0 6px;">•</span>
                            <span>${dateStr} ${timeStr}</span>
                            ${t.sheetRow ? `<span style="color: #ccc; margin: 0 6px;">•</span><span style="color: #2196f3;">Row: ${t.sheetRow}</span>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                        <span style="font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 12px; 
                                     background: white; color: ${t.status === 'confirmed' ? '#2e7d32' : 
                                                                t.status === 'rejected' ? '#c62828' : '#e65100'};">
                            ${statusText}
                        </span>
                        <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end;">
                            ${actions}
                            <button onclick="event.stopPropagation(); TelegramModule.deleteTopup('${t.id}')" 
                                    style="background: #9e9e9e; color: white; border: none; padding: 6px 12px; 
                                           border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;">
                                🗑️ Hapus
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    addManual: function() {
        const amount = parseFloat(document.getElementById('manualAmount').value);
        const sender = document.getElementById('manualSender').value.trim();
        const method = document.getElementById('manualMethod').value;
        
        if (!amount || amount <= 0) {
            alert('Jumlah tidak valid');
            return;
        }
        
        const topup = {
            id: 'MANUAL_' + Date.now(),
            amount: amount,
            sender: sender || 'Manual',
            method: method,
            transactionId: 'MANUAL_' + Math.floor(Math.random() * 10000),
            timestamp: Date.now(),
            status: 'pending',
            source: 'manual',
            syncedToSheet: false
        };
        
        this.addTopup(topup);
        
        document.getElementById('manualAmount').value = '';
        document.getElementById('manualSender').value = '';
        
        TelegramUtils.showToast('✅ Topup ditambahkan!');
        TelegramMain.renderPage();
        
        // Auto sync jika ada config
        if (TelegramConfig.data.sheetId && TelegramConfig.data.scriptUrl) {
            setTimeout(() => this.syncToSheet(), 500);
        }
    },
    
    confirm: function(id) {
        const t = this.data.find(x => x.id === id);
        if (!t) return;
        
        if (confirm(`Konfirmasi topup ${TelegramUtils.formatMoney(t.amount)} dari ${t.sender}?`)) {
            t.status = 'confirmed';
            t.confirmedAt = Date.now();
            t.syncedToSheet = false;
            this.saveData();
            TelegramUtils.showToast('✅ Topup dikonfirmasi!');
            TelegramMain.renderPage();
        }
    },
    
    reject: function(id) {
        const t = this.data.find(x => x.id === id);
        if (!t) return;
        
        if (confirm(`Tolak topup ${TelegramUtils.formatMoney(t.amount)}?`)) {
            t.status = 'rejected';
            t.rejectedAt = Date.now();
            t.syncedToSheet = false;
            this.saveData();
            TelegramUtils.showToast('❌ Topup ditolak!');
            TelegramMain.renderPage();
        }
    },
    
    deleteTopup: function(id) {
        const t = this.data.find(x => x.id === id);
        if (!t) return;
        
        const confirmMsg = `🗑️ HAPUS DATA INI?\n\n` +
            `Jumlah: ${TelegramUtils.formatMoney(t.amount)}\n` +
            `Pengirim: ${t.sender}\n` +
            `Metode: ${t.method}\n` +
            `Tanggal: ${new Date(t.timestamp).toLocaleDateString('id-ID')}\n\n` +
            `⚠️ Data ini hanya dihapus dari tampilan HTML (localStorage)\n` +
            `• Data di Google Sheet TIDAK terhapus`;
        
        if (confirm(confirmMsg)) {
            const index = this.data.findIndex(x => x.id === id);
            if (index > -1) {
                this.data.splice(index, 1);
                this.saveData();
                TelegramUtils.showToast('🗑️ Data dihapus dari daftar');
                TelegramMain.renderPage();
            }
        }
    },
    
    syncToSheet: async function() {
        if (!TelegramConfig.data.sheetId || !TelegramConfig.data.scriptUrl) {
            TelegramUtils.showToast('❌ Sheet ID dan Script URL harus diisi!', 'error');
            return;
        }
        
        const unsynced = this.data.filter(t => !t.syncedToSheet);
        if (unsynced.length === 0) {
            TelegramUtils.showToast('✅ Tidak ada data yang perlu disync');
            return;
        }
        
        const resultDiv = document.getElementById('tgSyncResult');
        resultDiv.innerHTML = '<div style="color: blue;">⏳ Syncing...</div>';
        
        let successCount = 0, failCount = 0;
        
        for (const topup of unsynced) {
            try {
                const result = await this.sendToSheet(topup);
                if (result.success) {
                    topup.syncedToSheet = true;
                    topup.sheetRow = result.row;
                    topup.syncedAt = Date.now();
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (e) {
                console.error('Sync error:', e);
                failCount++;
            }
        }
        
        this.saveData();
        
        if (failCount === 0) {
            resultDiv.innerHTML = `<div style="color: green;">✅ ${successCount} data berhasil disync</div>`;
            TelegramUtils.showToast(`✅ ${successCount} data tersync ke Sheet!`);
        } else {
            resultDiv.innerHTML = `<div style="color: orange;">⚠️ ${successCount} sukses, ${failCount} gagal</div>`;
        }
        
        TelegramMain.renderPage();
    },
    
    async sendToSheet(topup) {
        const data = {
            action: 'append',
            sheetId: TelegramConfig.data.sheetId,
            sheetName: TelegramConfig.data.sheetName,
            data: {
                ID: topup.id,
                Timestamp: new Date(topup.timestamp).toISOString(),
                Tanggal: new Date(topup.timestamp).toLocaleDateString('id-ID'),
                Waktu: new Date(topup.timestamp).toLocaleTimeString('id-ID'),
                Jumlah: topup.amount,
                Pengirim: topup.sender,
                Metode: topup.method,
                ID_Transaksi: topup.transactionId || '',
                Status: topup.status,
                Sumber: topup.source,
                Confirmed_At: topup.confirmedAt ? new Date(topup.confirmedAt).toISOString() : ''
            }
        };
        
        const response = await fetch(TelegramConfig.data.scriptUrl, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        return await response.json();
    }
};
