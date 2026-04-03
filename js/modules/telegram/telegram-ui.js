/**
 * Telegram UI Module
 * File: js/modules/telegram/telegram-ui.js
 */

const TelegramUI = {
    renderHeader: function() {
        const isConfigured = TelegramConfig.data.botToken && TelegramConfig.data.botToken.length > 10;
        const statusClass = isConfigured ? (TelegramConfig.data.isPolling ? 'active' : 'ready') : 'inactive';
        const statusText = isConfigured ? (TelegramConfig.data.isPolling ? 'Aktif' : 'Siap') : 'Belum Setup';
        
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; 
                        background: white; padding: 20px; border-radius: 16px; margin-bottom: 24px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="width: 56px; height: 56px; border-radius: 16px; 
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                display: flex; align-items: center; justify-content: center;
                                color: white; font-size: 28px;">
                        📱
                    </div>
                    <div>
                        <h2 style="margin: 0; color: #333; font-size: 24px;">Telegram + Saldo</h2>
                        <p style="margin: 4px 0 0 0; color: #666; font-size: 14px;">
                            Integrasi Bot n8n & Input Manual
                        </p>
                    </div>
                </div>
                <div style="padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;
                            ${statusClass === 'active' ? 'background: #e8f5e9; color: #2e7d32;' : 
                              statusClass === 'ready' ? 'background: #e3f2fd; color: #1565c0;' : 
                              'background: #ffebee; color: #c62828;'}">
                    ${statusText}
                </div>
            </div>
        `;
    },
    
    renderStats: function(stats) {
        const filterButtons = Object.entries(TelegramTopup.TIME_FILTERS).map(([key, value]) => `
            <button onclick="TelegramModule.setTimeFilter('${key}')"
                    style="padding: 8px 16px; border: 2px solid ${TelegramTopup.currentTimeFilter === key ? '#4caf50' : '#e0e0e0'}; 
                           background: ${TelegramTopup.currentTimeFilter === key ? '#4caf50' : 'white'}; 
                           color: ${TelegramTopup.currentTimeFilter === key ? 'white' : '#666'}; 
                           border-radius: 20px; cursor: pointer; font-size: 13px; font-weight: 500;
                           transition: all 0.3s;">
                ${value.icon} ${value.label}
            </button>
        `).join('');
        
        const customDateInput = TelegramTopup.currentTimeFilter === 'custom' ? `
            <div style="display: flex; gap: 12px; align-items: center; margin-top: 12px; padding: 12px; 
                        background: #f5f5f5; border-radius: 8px;">
                <div>
                    <label style="font-size: 12px; color: #666; font-weight: 500;">Dari Tanggal</label>
                    <input type="date" id="customStart" value="${TelegramTopup.customDateRange.start || ''}"
                           style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                <div style="color: #999;">→</div>
                <div>
                    <label style="font-size: 12px; color: #666; font-weight: 500;">Sampai Tanggal</label>
                    <input type="date" id="customEnd" value="${TelegramTopup.customDateRange.end || ''}"
                           style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px;">
                </div>
                <button onclick="TelegramModule.applyCustomDate()" 
                        style="background: #4caf50; color: white; border: none; padding: 10px 20px; 
                               border-radius: 6px; cursor: pointer; font-weight: 600; margin-top: 16px;">
                    ✅ Terapkan
                </button>
            </div>
        ` : '';
        
        return `
            <div style="background: white; border-radius: 16px; padding: 20px; margin-bottom: 24px; 
                        box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                
                <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
                    <span style="font-weight: 600; color: #333; margin-right: 8px; font-size: 14px;">📊 Filter:</span>
                    ${filterButtons}
                </div>
                
                ${customDateInput}
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; 
                                padding: 20px; border-radius: 12px; position: relative; overflow: hidden;">
                        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; margin-bottom: 8px;">
                            Total (${TelegramTopup.getFilterLabel()})
                        </div>
                        <div style="font-size: 24px; font-weight: 700;">${TelegramUtils.formatMoney(stats.total)}</div>
                        <div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">${stats.count} transaksi</div>
                        <div style="position: absolute; top: -20px; right: -20px; font-size: 80px; opacity: 0.1;">💰</div>
                    </div>
                    
                    <div style="border: 2px solid #4caf50; background: #e8f5e9; padding: 20px; border-radius: 12px;">
                        <div style="font-size: 11px; color: #2e7d32; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                            Dikonfirmasi
                        </div>
                        <div style="font-size: 24px; font-weight: 700; color: #2e7d32;">${stats.confirmed}</div>
                        <div style="font-size: 12px; color: #4caf50; margin-top: 4px;">transaksi</div>
                    </div>
                    
                    <div style="border: 2px solid #ff9800; background: #fff3e0; padding: 20px; border-radius: 12px;">
                        <div style="font-size: 11px; color: #e65100; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                            Pending
                        </div>
                        <div style="font-size: 24px; font-weight: 700; color: #e65100;">${stats.pending}</div>
                        <div style="font-size: 12px; color: #ff9800; margin-top: 4px;">menunggu</div>
                    </div>
                    
                    <div style="border: 2px solid #2196f3; background: #e3f2fd; padding: 20px; border-radius: 12px;">
                        <div style="font-size: 11px; color: #1565c0; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                            Tersync Sheet
                        </div>
                        <div style="font-size: 24px; font-weight: 700; color: #1565c0;">${stats.synced}</div>
                        <div style="font-size: 12px; color: #2196f3; margin-top: 4px;">data tersimpan</div>
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
            <div style="background: white; border-radius: 16px; margin-bottom: 24px; 
                        box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden;">
                <div style="display: flex; justify-content: space-between; align-items: center; 
                            cursor: pointer; user-select: none; padding: 16px 20px; 
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;"
                     onclick="TelegramModule.toggleSection('${sectionKey}')">
                    <h3 style="margin: 0; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 20px;">${icon}</span>
                        <span>${title}</span>
                        ${extraInfo ? `<span style="margin-left: 8px;">${extraInfo}</span>` : ''}
                    </h3>
                    <button style="background: rgba(255,255,255,0.2); border: none; padding: 8px 14px; 
                                   border-radius: 8px; cursor: pointer; font-size: 14px; color: white;
                                   display: flex; align-items: center; gap: 6px;"
                            onclick="event.stopPropagation(); TelegramModule.toggleSection('${sectionKey}')">
                        <span>${arrowIcon}</span>
                        <span style="font-size: 12px; font-weight: 500;">${buttonText}</span>
                    </button>
                </div>
        `;
    }
};
