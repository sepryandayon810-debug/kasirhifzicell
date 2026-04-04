/**
 * Telegram UI Module - Updated for WebPOS Theme
 * File: js/modules/telegram/telegram-ui.js
 */

const TelegramUI = {
    renderHeader: function() {
        const isConfigured = TelegramConfig.data.botToken && TelegramConfig.data.botToken.length > 10;
        const statusClass = isConfigured ? (TelegramConfig.data.isPolling ? 'active' : 'ready') : 'inactive';
        const statusText = isConfigured ? (TelegramConfig.data.isPolling ? 'Aktif' : 'Siap') : 'Belum Setup';
        
        return `
            <div class="tg-header">
                <div class="tg-title-area">
                    <div class="tg-icon-large">📱</div>
                    <div class="tg-header-title">
                        <h2>Telegram + Saldo</h2>
                        <p>Integrasi Bot n8n & Input Manual</p>
                    </div>
                </div>
                <div class="tg-status-badge ${statusClass}">${statusText}</div>
            </div>
        `;
    },
    
    renderStats: function(stats) {
        const filterButtons = Object.entries(TelegramTopup.TIME_FILTERS).map(([key, value]) => `
            <button class="tg-filter-btn ${TelegramTopup.currentTimeFilter === key ? 'active' : ''}" 
                    onclick="TelegramModule.setTimeFilter('${key}')">
                ${value.icon} ${value.label}
            </button>
        `).join('');
        
        const customDateInput = TelegramTopup.currentTimeFilter === 'custom' ? `
            <div class="tg-custom-date">
                <div class="tg-date-group">
                    <label>Dari Tanggal</label>
                    <input type="date" id="customStart" value="${TelegramTopup.customDateRange.start || ''}">
                </div>
                <div class="tg-date-group">
                    <label>Sampai Tanggal</label>
                    <input type="date" id="customEnd" value="${TelegramTopup.customDateRange.end || ''}">
                </div>
                <button class="tg-btn tg-btn-success" onclick="TelegramModule.applyCustomDate()">
                    ✅ Terapkan
                </button>
            </div>
        ` : '';
        
        return `
            <div class="tg-stats-section">
                <div class="tg-filter-bar">
                    <span class="tg-filter-label">📊 Filter Waktu:</span>
                    ${filterButtons}
                </div>
                ${customDateInput}
                <div class="tg-stats-grid">
                    <div class="tg-stat-card primary">
                        <div class="tg-stat-label">Total (${TelegramTopup.getFilterLabel()})</div>
                        <div class="tg-stat-value">${TelegramUtils.formatMoney(stats.total)}</div>
                        <div class="tg-stat-desc">${stats.count} transaksi</div>
                        <div class="tg-stat-icon">💰</div>
                    </div>
                    <div class="tg-stat-card outline-success">
                        <div class="tg-stat-label">Dikonfirmasi</div>
                        <div class="tg-stat-value" style="color: #059669;">${stats.confirmed}</div>
                        <div class="tg-stat-desc" style="color: #10b981;">transaksi</div>
                    </div>
                    <div class="tg-stat-card outline-warning">
                        <div class="tg-stat-label">Pending</div>
                        <div class="tg-stat-value" style="color: #d97706;">${stats.pending}</div>
                        <div class="tg-stat-desc" style="color: #f59e0b;">menunggu</div>
                    </div>
                    <div class="tg-stat-card outline-info">
                        <div class="tg-stat-label">Tersync Sheet</div>
                        <div class="tg-stat-value" style="color: #2563eb;">${stats.synced}</div>
                        <div class="tg-stat-desc" style="color: #3b82f6;">data tersimpan</div>
                    </div>
                </div>
            </div>
        `;
    },
    
    renderSectionHeader: function(title, icon, sectionKey, extraInfo = '') {
        const isVisible = TelegramConfig.sectionVisibility[sectionKey];
        const arrowIcon = isVisible ? '🔽' : '▶️';
        const buttonText = isVisible ? 'Sembunyikan' : 'Tampilkan';
        
        return `
            <div class="tg-section-card">
                <div class="tg-section-header" onclick="TelegramModule.toggleSection('${sectionKey}')">
                    <h3 class="tg-section-title">
                        <span class="tg-section-icon">${icon}</span>
                        <span>${title}</span>
                        ${extraInfo}
                    </h3>
                    <button class="tg-section-toggle" onclick="event.stopPropagation(); TelegramModule.toggleSection('${sectionKey}')">
                        <span>${arrowIcon}</span>
                        <span>${buttonText}</span>
                    </button>
                </div>
        `;
    },
    
    renderSectionFooter: function() {
        return `</div>`;
    },
    
    renderInfoBox: function(type, title, items) {
        const listItems = Array.isArray(items) 
            ? items.map(item => `<li>${item}</li>`).join('')
            : items;
        
        return `
            <div class="tg-info-box ${type}">
                <div class="tg-info-title">${title}</div>
                ${Array.isArray(items) ? `<ol class="tg-info-list">${listItems}</ol>` : listItems}
            </div>
        `;
    }
};
