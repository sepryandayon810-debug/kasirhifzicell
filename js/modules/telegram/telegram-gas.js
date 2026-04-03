/**
 * Telegram GAS Module
 * File: js/modules/telegram/telegram-gas.js
 */

const TelegramGas = {
    GAS_CODE: `/**
 * Google Apps Script untuk Telegram + Saldo Integration
 * Deploy sebagai Web App (Execute as: Me, Access: Anyone)
 */

const SHEET_TOPUP = 'TOP UP';
const SHEET_STEP = 'STEP';

function doGet(e) {
  console.log('doGet called:', JSON.stringify(e.parameter));
  
  try {
    if (e.parameter._method === 'POST' && e.parameter._body) {
      try {
        const postData = JSON.parse(decodeURIComponent(e.parameter._body));
        return handleAction(postData);
      } catch (err) {
        return jsonResponse({ success: false, error: 'Invalid _body JSON: ' + err.toString() });
      }
    }
    
    const action = e.parameter.action;
    
    if (action === 'test') {
      return jsonResponse({ 
        success: true, 
        message: 'Koneksi berhasil!',
        timestamp: new Date().toISOString()
      });
    }
    
    return jsonResponse({ 
      success: false, 
      error: 'Action tidak valid: ' + action,
      received: e.parameter
    });
    
  } catch (error) {
    console.error('Error in doGet:', error);
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function doPost(e) {
  console.log('doPost called');
  
  try {
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      return jsonResponse({ success: false, error: 'No post data' });
    }
    
    return handleAction(data);
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function handleAction(data) {
  const action = data.action;
  console.log('Action:', action);
  
  switch(action) {
    case 'initSaldo':
      return initSaldoTransaction(data);
    case 'completeSaldo':
      return completeSaldoTransaction(data);
    case 'append':
      return appendToSheet(data);
    case 'test':
      return jsonResponse({ success: true, message: 'POST test OK' });
    default:
      return jsonResponse({ success: false, error: 'Unknown action: ' + action });
  }
}

function initSaldoTransaction(data) {
  try {
    const sheetId = data.sheetId;
    const chatId = data.chatId || 'HTML_' + Date.now();
    const namaItem = data.namaItem;
    
    if (!sheetId || !namaItem) {
      return jsonResponse({ success: false, error: 'Sheet ID dan Nama Item diperlukan' });
    }
    
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    let sheetStep = spreadsheet.getSheetByName(SHEET_STEP);
    
    if (!sheetStep) {
      sheetStep = spreadsheet.insertSheet(SHEET_STEP);
      const headers = ['TRANSAKSI ID', 'CHAT ID', 'resumeUrl', 'SALDO TOP UP', 'STATUS', 'MATCH_KEY', 'NAMA ITEM', 'Timestamp'];
      sheetStep.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheetStep.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
    
    const now = new Date();
    const transaksiId = chatId + '_' + now.getTime();
    const matchKey = chatId + '-waiting';
    
    const stepRow = [
      transaksiId, chatId, '', '', 'waiting', matchKey, namaItem, now.toISOString()
    ];
    
    const newRow = sheetStep.getLastRow() + 1;
    sheetStep.getRange(newRow, 1, 1, stepRow.length).setValues([stepRow]);
    
    return jsonResponse({ 
      success: true, 
      transaksiId: transaksiId,
      matchKey: matchKey,
      row: newRow,
      message: 'Silahkan input nominal'
    });
    
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function completeSaldoTransaction(data) {
  try {
    const sheetId = data.sheetId;
    const matchKey = data.matchKey;
    const nominal = parseInt(data.nominal);
    
    if (!sheetId || !matchKey || !nominal) {
      return jsonResponse({ success: false, error: 'Data tidak lengkap' });
    }
    
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const sheetStep = spreadsheet.getSheetByName(SHEET_STEP);
    
    let sheetTopup = spreadsheet.getSheetByName(SHEET_TOPUP);
    if (!sheetTopup) {
      sheetTopup = spreadsheet.insertSheet(SHEET_TOPUP);
      const headers = ['BULAN', 'TANGGAL', 'NAMA ITEM', 'SALDO TOP UP'];
      sheetTopup.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheetTopup.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
    
    const lastRow = sheetStep.getLastRow();
    const matchKeys = sheetStep.getRange(2, 6, lastRow - 1, 1).getValues().flat();
    const rowIndex = matchKeys.indexOf(matchKey);
    
    if (rowIndex === -1) {
      return jsonResponse({ success: false, error: 'Transaksi tidak ditemukan' });
    }
    
    const actualRow = rowIndex + 2;
    const namaItem = sheetStep.getRange(actualRow, 7).getValue();
    
    sheetStep.getRange(actualRow, 4).setValue(nominal);
    sheetStep.getRange(actualRow, 5).setValue('DONE');
    
    const now = new Date();
    const bulanIndo = ["JANUARI","FEBRUARI","MARET","APRIL","MEI","JUNI","JULI","AGUSTUS","SEPTEMBER","OKTOBER","NOVEMBER","DESEMBER"];
    
    const topupRow = [
      bulanIndo[now.getMonth()],
      Utilities.formatDate(now, 'Asia/Jakarta', 'dd/MM/yyyy'),
      namaItem,
      nominal
    ];
    
    const newTopupRow = sheetTopup.getLastRow() + 1;
    sheetTopup.getRange(newTopupRow, 1, 1, topupRow.length).setValues([topupRow]);
    sheetTopup.getRange(newTopupRow, 4).setNumberFormat('#,##0');
    
    return jsonResponse({ 
      success: true,
      message: 'Transaksi selesai!',
      data: {
        bulan: topupRow[0],
        tanggal: topupRow[1],
        namaItem: namaItem,
        nominal: nominal,
        row: newTopupRow
      }
    });
    
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function appendToSheet(data) {
  try {
    const sheetId = data.sheetId;
    const sheetName = data.sheetName;
    const rowData = data.data;
    
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      const headers = Object.keys(rowData);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
    
    const row = Object.values(rowData);
    const newRow = sheet.getLastRow() + 1;
    sheet.getRange(newRow, 1, 1, row.length).setValues([row]);
    
    return jsonResponse({ success: true, row: newRow });
    
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}`,
    
    renderSection: function() {
        const isVisible = TelegramConfig.sectionVisibility.gasSetup;
        
        return TelegramUI.renderSectionHeader('Setup Google Apps Script (GAS)', '📋', 'gasSetup') +
            (isVisible ? `
            <div class="tg-section-content" style="padding: 20px; border-top: 1px solid #e0e0e0;">
                <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 16px; margin-bottom: 16px; border-radius: 8px;">
                    <strong>🚀 Cara Setup:</strong>
                    <ol style="margin: 10px 0; padding-left: 20px; font-size: 14px; color: #555; line-height: 1.8;">
                        <li>Buka <a href="https://script.google.com" target="_blank" style="color: #2196f3;">script.google.com</a></li>
                        <li>Klik "New Project" → Hapus code default</li>
                        <li>Copy kode di bawah → Paste → Save (Ctrl+S)</li>
                        <li>Deploy → New deployment → Web app</li>
                        <li><strong>Execute as:</strong> Me | <strong>Access:</strong> Anyone</li>
                        <li>Copy URL Web App ke kolom "Script URL" di atas</li>
                    </ol>
                </div>
                
                <button id="btnShowGasCode" 
                        style="padding: 10px 20px; background: #ff9800; color: white; border: none; 
                               border-radius: 8px; cursor: pointer; font-weight: 600;">
                    📋 Copy Kode GAS
                </button>
                
                <div id="gasCodeContainer" style="display: none; margin-top: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; 
                                background: #333; color: white; padding: 10px 16px; border-radius: 8px 8px 0 0;">
                        <span>Code.gs</span>
                        <button id="btnCopyGas" style="padding: 6px 12px; background: #555; color: white; 
                                                       border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            📋 Copy
                        </button>
                    </div>
                    <pre id="gasCodeDisplay" style="background: #f5f5f5; padding: 16px; margin: 0; 
                                                    border-radius: 0 0 8px 8px; overflow-x: auto; 
                                                    font-size: 12px; line-height: 1.5; max-height: 400px; overflow-y: auto;"></pre>
                </div>
            </div>
            ` : '');
    },
    
    bindEvents: function() {
        const btnShow = document.getElementById('btnShowGasCode');
        const btnCopy = document.getElementById('btnCopyGas');
       
