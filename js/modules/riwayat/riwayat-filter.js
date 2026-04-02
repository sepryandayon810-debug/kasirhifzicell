/**
 * Riwayat Filter Module
 * Advanced filtering and search functionality
 */

const RiwayatFilter = {
    // Save current filter state
    saveState: function() {
        const state = {
            startDate: document.getElementById('filter-start-date')?.value,
            endDate: document.getElementById('filter-end-date')?.value,
            status: document.getElementById('filter-status')?.value,
            metode: document.getElementById('filter-metode')?.value,
            search: document.getElementById('filter-search')?.value
        };
        localStorage.setItem('riwayat_filter_state', JSON.stringify(state));
    },
    
    // Restore filter state
    restoreState: function() {
        const saved = localStorage.getItem('riwayat_filter_state');
        if (saved) {
            const state = JSON.parse(saved);
            if (state.startDate) document.getElementById('filter-start-date').value = state.startDate;
            if (state.endDate) document.getElementById('filter-end-date').value = state.endDate;
            if (state.status) document.getElementById('filter-status').value = state.status;
            if (state.metode) document.getElementById('filter-metode').value = state.metode;
            if (state.search) document.getElementById('filter-search').value = state.search;
        }
    },
    
    // Quick filter presets
    presets: {
        today: function() {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('filter-start-date').value = today;
            document.getElementById('filter-end-date').value = today;
            applyFilter();
        },
        
        yesterday: function() {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const dateStr = yesterday.toISOString().split('T')[0];
            document.getElementById('filter-start-date').value = dateStr;
            document.getElementById('filter-end-date').value = dateStr;
            applyFilter();
        },
        
        thisWeek: function() {
            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            
            document.getElementById('filter-start-date').value = startOfWeek.toISOString().split('T')[0];
            document.getElementById('filter-end-date').value = endOfWeek.toISOString().split('T')[0];
            applyFilter();
        },
        
        thisMonth: function() {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            
            document.getElementById('filter-start-date').value = startOfMonth.toISOString().split('T')[0];
            document.getElementById('filter-end-date').value = endOfMonth.toISOString().split('T')[0];
            applyFilter();
        },
        
        last7Days: function() {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 7);
            
            document.getElementById('filter-start-date').value = start.toISOString().split('T')[0];
            document.getElementById('filter-end-date').value = end.toISOString().split('T')[0];
            applyFilter();
        },
        
        last30Days: function() {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 30);
            
            document.getElementById('filter-start-date').value = start.toISOString().split('T')[0];
            document.getElementById('filter-end-date').value = end.toISOString().split('T')[0];
            applyFilter();
        }
    },
    
    // Advanced search with multiple criteria
    advancedSearch: function(criteria) {
        return transaksiData.filter(t => {
            // Date range
            if (criteria.dateFrom && t.created_at < new Date(criteria.dateFrom).getTime()) return false;
            if (criteria.dateTo && t.created_at > new Date(criteria.dateTo).getTime()) return false;
            
            // Amount range
            if (criteria.minAmount && (t.total || 0) < criteria.minAmount) return false;
            if (criteria.maxAmount && (t.total || 0) > criteria.maxAmount) return false;
            
            // Status array
            if (criteria.statuses && criteria.statuses.length > 0) {
                if (!criteria.statuses.includes(t.status)) return false;
            }
            
            // Metode array
            if (criteria.metodes && criteria.metodes.length > 0) {
                if (!criteria.metodes.includes(t.metode_pembayaran)) return false;
            }
            
            // Product search (check items)
            if (criteria.productSearch) {
                const items = Object.values(t.items || {});
                const hasProduct = items.some(item => 
                    (item.nama || '').toLowerCase().includes(criteria.productSearch.toLowerCase()) ||
                    (item.kode || '').toLowerCase().includes(criteria.productSearch.toLowerCase())
                );
                if (!hasProduct) return false;
            }
            
            return true;
        });
    },
    
    // Sort data
    sort: function(field, direction = 'desc') {
        const sorted = [...filteredData].sort((a, b) => {
            let valA, valB;
            
            switch(field) {
                case 'tanggal':
                    valA = a.created_at;
                    valB = b.created_at;
                    break;
                case 'total':
                    valA = a.total || 0;
                    valB = b.total || 0;
                    break;
                case 'kode':
                    valA = a.kode || '';
                    valB = b.kode || '';
                    break;
                case 'pelanggan':
                    valA = a.pelanggan?.nama || '';
                    valB = b.pelanggan?.nama || '';
                    break;
                default:
                    valA = a.created_at;
                    valB = b.created_at;
            }
            
            if (direction === 'asc') {
                return valA > valB ? 1 : -1;
            } else {
                return valA < valB ? 1 : -1;
            }
        });
        
        filteredData = sorted;
        renderTransaksi();
    },
    
    // Get filter summary
    getSummary: function() {
        const startDate = document.getElementById('filter-start-date')?.value;
        const endDate = document.getElementById('filter-end-date')?.value;
        const status = document.getElementById('filter-status')?.value;
        const metode = document.getElementById('filter-metode')?.value;
        
        return {
            dateRange: startDate && endDate ? `${startDate} s/d ${endDate}` : 'Semua tanggal',
            status: status ? `Status: ${status}` : 'Semua status',
            metode: metode ? `Metode: ${metode}` : 'Semua metode',
            totalRecords: filteredData.length
        };
    }
};

// Auto-save filter state on change
document.addEventListener('change', function(e) {
    if (e.target.matches('#filter-start-date, #filter-end-date, #filter-status, #filter-metode, #filter-search')) {
        RiwayatFilter.saveState();
    }
});

// Restore state on load
document.addEventListener('DOMContentLoaded', function() {
    // Restore after a short delay to ensure elements are loaded
    setTimeout(() => RiwayatFilter.restoreState(), 100);
});

window.RiwayatFilter = RiwayatFilter;
