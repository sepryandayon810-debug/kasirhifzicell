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
        
        if (!isVisible) {
            return TelegramUI.renderSectionHeader('Tambah Topup Manual (Lainnya)', '➕', 'manualTopup') + 
                   TelegramUI.renderSectionFooter();
        }
        
        return TelegramUI.renderSectionHeader('Tambah Topup Manual (Lainnya)', '➕', 'manualTopup') + `
            <div class="tg-section-content">
                <div class="tg-form-grid" style="grid-template-columns: 1fr 1fr 1fr auto;">
                    <div class="tg-form-group">
                        <label>Jumlah (Rp)</label>
                        <input type="number" id="manualAmount" placeholder="100000">
                    </div>
                    <div class="tg-form-group">
                        <label>Pengirim</label>
                        <input type="text" id="manualSender" placeholder="Nama pengirim">
                    </div>
                    <div class="tg-form-group">
                        <label>Metode</label>
                        <select id="manualMethod">
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
                    <div class="tg-form-group">
                        <label>&nbsp;</label>
                        <button class="tg-btn tg-btn-success" onclick="TelegramModule.addManual()">
                            ➕ Tambah
                        </button>
                    </div>
                </div>
            </div>
        ` + TelegramUI.renderSectionFooter();
    },
    
    renderTopupListSection: function() {
        const timeFiltered = this.getFilteredByTime();
        let statusFiltered = timeFiltered;
        if (this.currentFilter !== 'all') {
            statusFiltered = timeFiltered.filter(t => t.status === this.currentFilter);
        }
        const filtered = statusFiltered.sort((a, b) => b.timestamp - a.timestamp);
        
        const arrowIcon = this.isVisible ? '🔽' : '▶️';
        
        let html = TelegramUI.renderSectionHeader(
            `📨 Daftar Topup <span class="tg-badge">${filtered.length}</span> <span style="font-size: 13px; opacity: 0.8;">(${this.getFilterLabel()})</span>`, 
            '📋', 
            'topupList'
        );
        
        if (this.isVisible) {
            html += `
                <div class="tg-section-content">
                    <div class="tg-list-header">
                        <div class="tg-list-filters">
                            ${['all', 'pending', 'confirmed', 'rejected'].map(f => `
                                <button class="tg-list-filter-btn ${this.currentFilter === f ? 'active' : ''}" 
                                        onclick="event.stopPropagation(); TelegramModule.setFilter('${f}')">
                                    ${f === 'all' ? 'Semua' : f === 'pending' ? '⏳ Pending' : f === 'confirmed' ? '✅ Dikonfirmasi' : '❌ Ditolak'}
                                </button>
                            `).join('')}
                        </div>
                        <button class="tg-btn tg-btn-ghost tg-btn-sm" onclick="event.stopPropagation(); TelegramModule.toggleTopupList()">
                            ${arrowIcon} Sembunyikan
                        </button>
                    </div>
                    ${filtered.length > 0 ? this.renderTopupItems(filtered) : this.renderEmptyState()}
                </div>
            `;
        }
        
        html += TelegramUI.renderSectionFooter();
        return html;
    },
    
    renderTopupItems: function(items) {
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
        
        let statusClass = t.status;
        let statusLabel = t.status === 'confirmed' ? '✅ Dikonfirmasi' : 
                         t.status === 'pending' ? '⏳ Pending' : '❌ Ditolak';
        
        let actions = '';
        if (t.status === 'pending') {
            actions = `
                <button class="tg-action-btn confirm" onclick="event.stopPropagation(); TelegramModule.confirmTopup('${t.id}')">
                    ✓ Konfirmasi
                </button>
                <button class="tg-action-btn reject" onclick="event.stopPropagation(); TelegramModule.rejectTopup('${t.id}')">
                    ✕ Tolak
                </button>
            `;
        }
        
        return `
            <div class="tg-topup-item ${statusClass}">
                <div class="tg-topup-main">
                    <div class="tg-topup-amount">
                        ${TelegramUtils.formatMoney(t.amount)}
                        ${t.syncedToSheet ? '<span class="tg-sync-indicator">✓ synced</span>' : ''}
                    </div>
                    <div class="tg-topup-meta">
                        <span style="font-weight: 600; color: var(--text-primary);">${TelegramUtils.escapeHtml(t.sender || 'Unknown')}</span>
                        <span class="dot">•</span>
                        <span>${TelegramUtils.escapeHtml(t.method || '-')}</span>
                        <span class="dot">•</span>
                        <span>${dateStr} ${timeStr}</span>
                        ${t.sheetRow ? `<span class="dot">•</span><span style="color: #3b82f6; font-weight: 500;">Row: ${t.sheetRow}</span>` : ''}
                    </div>
                </div>
                <div class="tg-topup-status">
                    <span class="tg-status-label ${statusClass}">${statusLabel}</span>
                    <div class="tg-topup-actions">
                        ${actions}
                        <button class="tg-action-btn delete" onclick="event.stopPropagation(); TelegramModule.deleteTopup('${t.id}')" title="Hapus dari tampilan">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    renderEmptyState: function() {
        return `
            <div class="tg-empty-state">
                <div class="tg-empty-icon">📭</div>
                <div class="tg-empty-title">Tidak ada data topup</div>
                <div class="tg-empty-desc">untuk periode ${this.getFilterLabel().toLowerCase()}</div>
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
