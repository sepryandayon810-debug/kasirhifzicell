/**
 * Excel Handler Utility
 * Fungsi-fungsi helper untuk Excel operations
 */

const ExcelHandler = {
    /**
     * Convert array of objects to CSV
     */
    toCSV: function(data, headers = null) {
        if (!data || data.length === 0) return '';
        
        const cols = headers || Object.keys(data[0]);
        const csvRows = [];
        
        // Header
        csvRows.push(cols.join(','));
        
        // Data
        for (const row of data) {
            const values = cols.map(col => {
                const val = row[col] || '';
                // Escape quotes and wrap in quotes if contains comma
                const escaped = String(val).replace(/"/g, '""');
                return escaped.includes(',') ? `"${escaped}"` : escaped;
            });
            csvRows.push(values.join(','));
        }
        
        return csvRows.join('\n');
    },
    
    /**
     * Download CSV file
     */
    downloadCSV: function(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    },
    
    /**
     * Parse CSV to array
     */
    parseCSV: function(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const result = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = lines[i].split(',');
            const obj = {};
            headers.forEach((h, idx) => {
                obj[h] = values[idx] ? values[idx].trim() : '';
            });
            result.push(obj);
        }
        
        return result;
    },
    
    /**
     * Format number for Excel (avoid scientific notation)
     */
    formatNumber: function(num) {
        return num.toString();
    }
};

window.ExcelHandler = ExcelHandler;
