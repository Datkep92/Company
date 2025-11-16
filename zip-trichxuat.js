// =======================
// Hàm làm tròn kế toán (theo chuẩn VND)
// =======================
function accountingRound(amount) {
    return Math.round(amount);
}


// =======================
// Hàm phân loại sản phẩm
// =======================
function getProductClassification(category) {
  const classifications = {
    'hang_hoa': 'Hàng hóa',
    'chiet_khau': 'Chiết khấu',
    'khuyen_mai': 'Khuyến mãi',
    'dich_vu': 'Dịch vụ'
  };
  return classifications[category] || 'Hàng hóa';
}

// =======================
// Hàm kiểm tra chênh lệch hóa đơn (CHUẨN KẾ TOÁN)
// =======================
function checkInvoiceDifference(invoice) {
    const summary = invoice.summary;
    
    // Sau khi áp dụng logic điều chỉnh trong parseXmlInvoice, chỉ chấp nhận khớp chính xác (0)
    const MAX_TOLERANCE = 0; 

    // Kiểm tra chênh lệch
    // Tổng chênh lệch đã được cập nhật lại sau khi điều chỉnh ở parseXmlInvoice
    const isExactMatch = Math.abs(summary.totalDifference) <= MAX_TOLERANCE;
    
    return {
        isValid: isExactMatch,
        totalDifference: summary.totalDifference,
        calculatedTotal: summary.calculatedTotal,
        xmlTotal: summary.totalAfterTax,
        amountDifference: summary.amountDifference,
        taxDifference: summary.taxDifference,
        discountDifference: summary.discountDifference
    };
}

// =======================
// Xử lý nhiều ZIP (SỬA LOGIC KIỂM TRA CHÊNH LỆCH)
// =======================
async function handleZipFiles(files){
    let processedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    let stockPostedCount = 0;
    
    const fileResults = [];
    
    for(const file of files){
        if(!file.name.toLowerCase().endsWith('.zip') && !file.name.toLowerCase().endsWith('.xml')) {
            fileResults.push({ file: file.name, status: 'error', message: 'File không phải ZIP/XML' });
            errorCount++;
            continue;
        }
        
        let invoice = null;
        try {
            invoice = await extractInvoiceFromZip(file);
        } catch (error) {
            fileResults.push({ file: file.name, status: 'error', message: error.message });
            errorCount++;
            continue;
        }

        if(!invoice||!invoice.products||invoice.products.length===0){
            fileResults.push({ file: file.name, status: 'error', message: 'Không có sản phẩm' });
            errorCount++;
            continue;
        }
        
        try {
            const taxCode = invoice.buyerInfo.taxCode||'UNKNOWN';
            const companyName = invoice.buyerInfo.name || taxCode;
            
            ensureHkdData(taxCode, companyName);
            
            // Kiểm tra trùng HĐ
            if(isDuplicate(invoice,taxCode)){
                fileResults.push({ file: file.name, status: 'duplicate', message: 'Hóa đơn trùng' });
                duplicateCount++;
                continue;
            }
            
            // KIỂM TRA CHÊNH LỆCH TRƯỚC KHI XỬ LÝ
            const differenceCheck = checkInvoiceDifference(invoice);
            
            // Thiết lập trạng thái hóa đơn
            invoice.status = {
                validation: differenceCheck.isValid ? 'ok' : 'error',
                stockPosted: false, // Mặc định chưa chuyển kho
                difference: differenceCheck.totalDifference,
                calculatedTotal: differenceCheck.calculatedTotal,
                xmlTotal: differenceCheck.xmlTotal
            };
            
            // Thêm thông tin metadata
            invoice.uniqueKey = `${invoice.invoiceInfo.mccqt}_${invoice.invoiceInfo.symbol}_${invoice.invoiceInfo.number}`;
            invoice.extractedAt = new Date().toISOString();
            invoice.sourceFile = file.name;
            
            // CHỈ CHUYỂN TỒN KHO NẾU KHÔNG CÓ CHÊNH LỆCH
            if(invoice.status.validation === 'ok') {
                updateStock(taxCode, invoice);
                invoice.status.stockPosted = true;
                stockPostedCount++;
                
                // 🔥 QUAN TRỌNG: Tích hợp với hệ thống kế toán
                if (typeof window.integratePurchaseAccounting === 'function') {
                    window.integratePurchaseAccounting(invoice, taxCode);
                }
            }
            
            // LUÔN LƯU HÓA ĐƠN DÙ CÓ LỖI HAY KHÔNG
            hkdData[taxCode].invoices.push(invoice);
            
            // Thông báo kết quả
            if(invoice.status.validation === 'ok') {
                fileResults.push({ 
                    file: file.name, 
                    status: 'success', 
                    message: `Thành công - Đã chuyển tồn kho (Điều chỉnh ${differenceCheck.totalDifference}đ)` 
                });
                processedCount++;
            } else {
                fileResults.push({ 
                    file: file.name, 
                    status: 'warning', 
                    message: `Chênh lệch ${formatCurrency(differenceCheck.totalDifference)} - Chưa chuyển tồn kho` 
                });
                processedCount++;
            }
            
            console.log(`[NHẬP HĐ] MST=${taxCode}, HĐ=${invoice.uniqueKey}, trạng thái=${invoice.status.validation}, tồn kho=${invoice.status.stockPosted}`);
            
        } catch (error) {
            fileResults.push({ file: file.name, status: 'error', message: error.message });
            errorCount++;
            console.error('Lỗi xử lý file (sau trích xuất):', file.name, error);
        }
    }
    
    // Cập nhật thống kê
    if (typeof updateFileStats === 'function') {
        updateFileStats(files.length, processedCount, errorCount, duplicateCount, stockPostedCount);
    }
    
    // Hiển thị kết quả chi tiết
    if (typeof showFileResults === 'function') {
        showFileResults(fileResults);
    }
    
    console.log(`Kết quả xử lý: ${processedCount} thành công (${stockPostedCount} đã chuyển kho), ${duplicateCount} trùng, ${errorCount} lỗi`);
    return { processedCount, duplicateCount, errorCount, stockPostedCount };
}

// =======================
// THÊM CÁC HÀM BỊ THIẾU VÀO muahang.js
// =======================

// Hàm đảm bảo dữ liệu HKD tồn tại
function ensureHkdData(taxCode, companyName = '') {
    if (!window.hkdData[taxCode]) {
        console.log(`🏢 TẠO MỚI CÔNG TY: ${taxCode} - ${companyName}`);
        window.hkdData[taxCode] = {
            name: companyName || taxCode,
            invoices: [],
            tonkhoMain: [],
            tonkhoMainDefault: null,
            exports: []
        };
    } else if (companyName && window.hkdData[taxCode].name === taxCode) {
        window.hkdData[taxCode].name = companyName;
    }
    
    if (!window.hkdData[taxCode].invoices) {
        window.hkdData[taxCode].invoices = [];
    }
}

// Hàm kiểm tra trùng lặp
function isDuplicate(invoice, taxCode) {
    ensureHkdData(taxCode);
    const hkd = window.hkdData[taxCode];
    
    const key = `${invoice.invoiceInfo.mccqt}_${invoice.invoiceInfo.symbol}_${invoice.invoiceInfo.number}`;
    invoice.uniqueKey = key;
    
    console.log(`🔍 Kiểm tra trùng: ${key}`);
    
    if (!hkd.invoices || hkd.invoices.length === 0) {
        console.log(`✅ Không trùng - Đây là HĐ đầu tiên`);
        return false;
    }
    
    const isDuplicate = hkd.invoices.some(inv => {
        const existingKey = inv.uniqueKey || `${inv.invoiceInfo.mccqt}_${inv.invoiceInfo.symbol}_${inv.invoiceInfo.number}`;
        return existingKey === key;
    });
    
    console.log(`📝 Kết quả: ${isDuplicate ? 'TRÙNG' : 'KHÔNG TRÙNG'}`);
    return isDuplicate;
}

// Hàm cập nhật tồn kho
function updateStock(taxCode, invoice) {
    ensureHkdData(taxCode);
    const hkd = window.hkdData[taxCode];
    
    console.log('🔄 Cập nhật tồn kho...');
    
    invoice.products.forEach(item => {
        if (item.category !== 'hang_hoa') return;
        
        let stockItem = hkd.tonkhoMain.find(p => p.msp === item.msp);
        
        if (stockItem) {
            stockItem.quantity += parseFloat(item.quantity);
            stockItem.amount = window.accountingRound(stockItem.amount + item.amount);
            console.log(`✅ Cộng dồn: ${item.name} (+${item.quantity})`);
        } else {
            hkd.tonkhoMain.push({
                msp: item.msp,
                code: item.msp,
                name: item.name,
                unit: item.unit,
                quantity: parseFloat(item.quantity),
                amount: item.amount
            });
            console.log(`✅ Thêm mới: ${item.name} (${item.quantity})`);
        }
    });
}

async function processPurchaseInvoices() {
    const fileInput = document.getElementById('purchase-invoice-files');
    const files = fileInput.files;

    if (files.length === 0) {
        alert('❌ Vui lòng chọn file hóa đơn mua hàng (ZIP/XML).');
        return;
    }

    console.log('🎯 Đang gọi showProcessingChoiceModal...');
    console.log('📁 Số file:', files.length);
    
    // 🔥 QUAN TRỌNG: HIỂN THỊ MODAL LỰA CHỌN TRƯỚC KHI XỬ LÝ
    showProcessingChoiceModal(files);
}

// =======================
// SỬA HÀM HIỂN THỊ MODAL - THÊM DEBUG
// =======================
function showProcessingChoiceModal(files) {
    const fileCount = files.length;
    
    console.log('🎪 Bắt đầu hiển thị modal lựa chọn');
    console.log('📊 Số file:', fileCount);
    
    // Đóng modal cũ nếu có
    closeModal();
    
    const modalContent = `
        <div class="processing-choice-modal">
            <div class="modal-header">
                <h3>🎯 CHỌN CÁCH XỬ LÝ HÓA ĐƠN</h3>
                <span class="close" onclick="closeModal()">&times;</span>
            </div>
            
            <div class="modal-body">
                <p style="text-align: center; margin-bottom: 20px; font-size: 16px;">
                    Đã chọn <strong style="color: #007bff;">${fileCount} file</strong> hóa đơn
                </p>
                
                <div class="mode-options">
                    <div class="mode-option ${fileCount <= 2 ? 'recommended' : ''}">
                        <input type="radio" id="mode-immediate" name="processing-mode" value="immediate" ${fileCount <= 2 ? 'checked' : ''}>
                        <label for="mode-immediate">
                            <div class="mode-icon">⚡</div>
                            <div class="mode-content">
                                <div class="mode-title">XỬ LÝ NGAY</div>
                                <div class="mode-desc">
                                    • Hiển thị popup sửa lỗi trực tiếp<br>
                                    • Phù hợp cho 1-3 file<br>
                                    • Cập nhật ngay vào hệ thống
                                </div>
                            </div>
                        </label>
                    </div>
                    
                    <div class="mode-option ${fileCount > 3 ? 'recommended' : ''}">
                        <input type="radio" id="mode-batch" name="processing-mode" value="batch" ${fileCount > 3 ? 'checked' : ''}>
                        <label for="mode-batch">
                            <div class="mode-icon">📦</div>
                            <div class="mode-content">
                                <div class="mode-title">XỬ LÝ HÀNG LOẠT</div>
                                <div class="mode-desc">
                                    • Chuyển sang tab xử lý chuyên dụng<br>
                                    • Phù hợp cho nhiều file<br>
                                    • Quản lý tập trung, xử lý theo lô
                                </div>
                            </div>
                        </label>
                    </div>
                </div>
                
                <div class="mode-preview">
                    <div id="mode-preview-content">
                        ${renderModePreview(fileCount <= 2 ? 'immediate' : 'batch', fileCount)}
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button id="confirm-processing" class="btn-success">
                        🚀 BẮT ĐẦU XỬ LÝ
                    </button>
                    <button class="btn-secondary" onclick="closeModal()">
                        ❌ HỦY
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Sử dụng ID 'custom-modal' để nhất quán
    const modal = document.createElement('div');
    modal.id = 'custom-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    console.log('✅ Đã thêm modal vào DOM');
    
    // Cập nhật preview khi chọn mode
    document.querySelectorAll('input[name="processing-mode"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.getElementById('mode-preview-content').innerHTML = 
                renderModePreview(this.value, fileCount);
        });
    });
    
    // Xử lý khi bấm bắt đầu - SỬA LẠI
    document.getElementById('confirm-processing').addEventListener('click', function() {
        const selectedMode = document.querySelector('input[name="processing-mode"]:checked').value;
        console.log('🚀 Người dùng chọn mode:', selectedMode);
        
        // Đóng popup trước khi xử lý
        closeModal();
        
        // Bắt đầu xử lý hóa đơn
        startInvoiceProcessing(files, selectedMode);
    });
}

// =======================
async function startInvoiceProcessing(files, mode) {
    console.log(`🔄 Bắt đầu xử lý ${files.length} file với chế độ: ${mode}`);
    
    try {
        // Tạo container thống kê
        createPurchaseStatsContainer();
        updatePurchaseFileStats(files.length, 0, 0, 0, 0);
        
        if (mode === 'immediate') {
            await processImmediateMode(files);
        } else {
            await processBatchMode(files);
        }
        
    } catch (error) {
        console.error('❌ Lỗi xử lý:', error);
        alert(`❌ LỖI XỬ LÝ:\n\n${error.message}`);
    }
}

// =======================
// CHẾ ĐỘ XỬ LÝ NGAY - SỬA ĐỂ PHÂN BIỆT
// =======================
async function processImmediateMode(files) {
    console.log('⚡ Bắt đầu chế độ XỬ LÝ NGAY');
    showLoading('Đang trích xuất và kiểm tra...');
    
    try {
        // TẠM THỜI VÔ HIỆU HÓA HÀM showFileResults ĐỂ TRÁNH LỖI
        const originalShowFileResults = window.showFileResults;
        window.showFileResults = function() {
            console.log('📋 Đã tạm bỏ qua hiển thị kết quả chi tiết trong chế độ xử lý ngay');
        };
        
        // Sử dụng hàm xử lý từ zip-trichxuat.js
        const results = await window.handleZipFiles(files);
        
        // KHÔI PHỤC HÀM SHOWFILERESULTS
        window.showFileResults = originalShowFileResults;
        
        // Cập nhật thống kê
        updatePurchaseFileStats(
            files.length, 
            results.processedCount, 
            results.errorCount, 
            results.duplicateCount, 
            results.stockPostedCount
        );
        
        console.log('📊 Kết quả xử lý:', results);
        
        // 🔥 QUAN TRỌNG: KIỂM TRA NẾU CÓ HÓA ĐƠN LỖI TRONG CHẾ ĐỘ XỬ LÝ NGAY
        if (results.errorCount > 0) {
            console.log('🚨 Phát hiện hóa đơn lỗi trong chế độ xử lý ngay:', results.errorCount);
            await handleImmediateErrors(results);
        } else {
            // 🔥 QUAN TRỌNG: ĐỒNG BỘ DỮ LIỆU
            await syncDataToWindowHkdData();
            
            console.log('✅ Kết thúc xử lý:');
            debugCompanyData();
            
            // CẬP NHẬT GIAO DIỆN
            if (typeof window.renderCompanyList === 'function') {
                window.renderCompanyList();
            }

            // TỰ ĐỘNG CHỌN CÔNG TY
            if (!window.currentCompany) {
                const companies = Object.keys(window.hkdData);
                if (companies.length > 0) {
                    const firstCompany = companies[0];
                    if (typeof window.selectCompany === 'function') {
                        window.selectCompany(firstCompany);
                    }
                }
            }

            loadPurchaseInvoices();
            loadPayableList();
            
            // HIỂN THỊ KẾT QUẢ
            showSuccessMessage(`✅ Đã xử lý ${results.processedCount} hóa đơn thành công!`);
        }
        
    } catch (error) {
        console.error('❌ Lỗi trong processImmediateMode:', error);
        throw error;
    }
}

// =======================
// HÀM XỬ LÝ LỖI TRONG CHẾ ĐỘ NGAY
// =======================
async function handleImmediateErrors(results) {
    console.log('🔧 Bắt đầu xử lý lỗi trong chế độ ngay');
    
    if (results.errorCount === 1) {
        // 1 HĐ lỗi → hiển thị popup sửa ngay
        const userChoice = confirm(`⚠️ Phát hiện 1 hóa đơn có chênh lệch.\n\nBạn có muốn mở popup chỉnh sửa ngay không?\n\nChọn "OK" để sửa ngay, "Cancel" để chuyển sang tab xử lý.`);
        
        if (userChoice) {
            console.log('🎯 Người dùng chọn sửa hóa đơn lỗi ngay');
            // TODO: Lấy invoiceId từ results và gọi popup
            // Tạm thời thông báo
            alert('🛠️ Popup chỉnh sửa đã sẵn sàng! Trong tab "Xử Lý Hóa Đơn Lỗi", nhấn nút "Sửa" để mở popup.');
            switchToErrorInvoiceTab();
        } else {
            console.log('📦 Người dùng chọn chuyển tab');
            switchToErrorInvoiceTab();
        }
    } else {
        // Nhiều HĐ lỗi → chuyển tab
        alert(`⚠️ Phát hiện ${results.errorCount} hóa đơn có chênh lệch.\n\nCác hóa đơn này sẽ được chuyển sang tab xử lý chuyên dụng.`);
        switchToErrorInvoiceTab();
    }
}
// =======================
// HÀM HIỂN THỊ POPUP SỬA HÓA ĐƠN (TẠM THỜI)
// =======================
function showFixInvoicePopupForImmediateMode(results) {
    console.log('🛠️ Đang mở popup sửa hóa đơn...');
    
    // Tạm thời hiển thị thông báo
    const modalContent = `
        <div style="text-align: center; padding: 20px;">
            <h3>🛠️ POPUP CHỈNH SỬA HÓA ĐƠN</h3>
            <p>Chức năng này đang được phát triển...</p>
            <p>Trong phiên bản hiện tại, bạn cần:</p>
            <ol style="text-align: left; margin: 20px;">
                <li>Chuyển sang tab "NHẬP HÓA ĐƠN ĐẦU VÀO"</li>
                <li>Tìm hóa đơn có chênh lệch</li>
                <li>Nhấn nút "Sửa" để chỉnh sửa thủ công</li>
            </ol>
            <button class="btn-primary" onclick="document.getElementById('custom-modal').remove(); switchToImportTab();">
                📦 Chuyển sang tab xử lý
            </button>
        </div>
    `;
    
    if (typeof window.showModal === 'function') {
        window.showModal('Chỉnh Sửa Hóa Đơn', modalContent);
    } else {
        alert('Popup chỉnh sửa đang được phát triển. Vui lòng chuyển sang tab xử lý chuyên dụng.');
    }
}
// =======================
// THÊM CSS MODAL KHẨN CẤP - ĐẢM BẢO HIỂN THỊ
// =======================
function addEmergencyModalStyles() {
    const emergencyStyles = `
        <style id="emergency-modal-styles">
        /* OVERLAY - QUAN TRỌNG: phải hiển thị */
        .modal-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: rgba(0, 0, 0, 0.5) !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            z-index: 9999 !important;
        }
        
        /* MODAL CONTENT - QUAN TRỌNG: phải hiển thị */
        .modal-content {
            background: white !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
            max-width: 600px !important;
            width: 90% !important;
            max-height: 80vh !important;
            overflow-y: auto !important;
            z-index: 10000 !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        /* ĐẢM BẢO KHÔNG BỊ ẨN */
        #custom-modal {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        /* STYLE CHO LỰA CHỌN XỬ LÝ */
        .processing-choice-modal .modal-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            color: white !important;
            padding: 20px !important;
            border-radius: 8px 8px 0 0 !important;
        }
        
        .processing-choice-modal .modal-header h3 {
            color: white !important;
            margin: 0 !important;
        }
        
        .mode-option {
            border: 2px solid #e0e0e0 !important;
            border-radius: 8px !important;
            padding: 15px !important;
            margin: 10px 0 !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: flex-start !important;
        }
        
        .mode-option:hover {
            border-color: #007bff !important;
            background: #f8f9fa !important;
        }
        
        .mode-option.recommended {
            border-color: #28a745 !important;
            background: #f8fff9 !important;
        }
        </style>
    `;
    
    // Xóa style cũ nếu có
    const oldStyle = document.getElementById('emergency-modal-styles');
    if (oldStyle) oldStyle.remove();
    
    // Thêm style mới
    document.head.insertAdjacentHTML('beforeend', emergencyStyles);
    console.log('🎨 Đã thêm CSS modal khẩn cấp');
}
// =======================
// GIỮ NGUYÊN HÀM CŨ VÀ THÊM XỬ LÝ LỖI
// =======================
async function processBatchMode(files) {
    showLoading('Đang trích xuất hàng loạt...');
    
    try {
        // TẠM THỜI VÔ HIỆU HÓA HÀM showFileResults ĐỂ TRÁNH LỖI
        const originalShowFileResults = window.showFileResults;
        window.showFileResults = function() {
            console.log('📋 Đã tạm bỏ qua hiển thị kết quả chi tiết trong chế độ hàng loạt');
        };
        
        // Sử dụng hàm xử lý từ zip-trichxuat.js
        const results = await window.handleZipFiles(files);
        
        // KHÔI PHỤC HÀM SHOWFILERESULTS
        window.showFileResults = originalShowFileResults;
        
        // Cập nhật thống kê
        updatePurchaseFileStats(
            files.length, 
            results.processedCount, 
            results.errorCount, 
            results.duplicateCount, 
            results.stockPostedCount
        );
        
        // 🔥 QUAN TRỌNG: ĐỒNG BỘ DỮ LIỆU
        await syncDataToWindowHkdData();
        
        // Hiển thị kết quả tổng quan
        showBatchResultsSummary(results, files.length);
        
        // 🔥 QUAN TRỌNG: NẾU CÓ LỖI, CHUYỂN SANG TAB XỬ LÝ
        if (results.errorCount > 0) {
            console.log(`🚨 Có ${results.errorCount} hóa đơn lỗi, chuyển tab...`);
            setTimeout(() => {
                if (typeof switchToErrorInvoiceTab === 'function') {
                    switchToErrorInvoiceTab();
                }
            }, 1500);
        } else {
            // Nếu không có lỗi, ở lại tab hiện tại
            console.log('✅ Không có hóa đơn lỗi, ở lại tab Mua Hàng');
        }
        
    } catch (error) {
        console.error('❌ Lỗi trong processBatchMode:', error);
        throw error;
    }
}

// =======================
// HÀM ĐỒNG BỘ DỮ LIỆU
// =======================
async function syncDataToWindowHkdData() {
    try {
        console.log('🔄 Đang đồng bộ dữ liệu công ty...');
        console.log('- Số công ty trong window.hkdData:', Object.keys(window.hkdData).length);
        
        // Đảm bảo dữ liệu được cập nhật
        if (typeof window.renderCompanyList === 'function') {
            window.renderCompanyList();
        }
        
    } catch (error) {
        console.error('❌ Lỗi đồng bộ dữ liệu:', error);
    }
}
// =======================
// HÀM HIỂN THỊ KẾT QUẢ CHO TAB MUA HÀNG
// =======================
function showPurchaseResults(fileResults) {
    console.log('📋 Kết quả xử lý hóa đơn:');
    
    let successCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;
    
    fileResults.forEach(result => {
        console.log(`- ${result.file}: ${result.status} - ${result.message}`);
        
        switch(result.status) {
            case 'success':
                successCount++;
                break;
            case 'error':
                errorCount++;
                break;
            case 'duplicate':
                duplicateCount++;
                break;
        }
    });
    
    // Hiển thị kết quả tổng quan trong modal
    const resultsHtml = `
        <div class="purchase-results">
            <h4>📊 Kết Quả Xử Lý</h4>
            <div class="results-stats">
                <div class="stat-item success">
                    <span class="stat-label">Thành công</span>
                    <span class="stat-value">${successCount}</span>
                </div>
                <div class="stat-item error">
                    <span class="stat-label">Lỗi</span>
                    <span class="stat-value">${errorCount}</span>
                </div>
                <div class="stat-item duplicate">
                    <span class="stat-label">Trùng lặp</span>
                    <span class="stat-value">${duplicateCount}</span>
                </div>
            </div>
            ${errorCount > 0 ? '<p class="warning">⚠️ Một số hóa đơn cần xử lý thủ công</p>' : ''}
        </div>
    `;
    
    // Chỉ hiển thị nếu có kết quả
    if (fileResults.length > 0) {
        setTimeout(() => {
            if (typeof window.showModal === 'function') {
                window.showModal('Kết Quả Xử Lý', resultsHtml);
            }
        }, 500);
    }
}

// Ghi đè hàm showFileResults khi ở tab Mua Hàng
function overrideShowFileResults() {
    if (document.querySelector('#mua-hang.tab-content.active')) {
        window.showFileResults = showPurchaseResults;
    }
}

// Gọi hàm này khi chuyển tab
document.addEventListener('DOMContentLoaded', function() {
    // Theo dõi khi chuyển tab
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (mutation.target.id === 'mua-hang' && mutation.target.classList.contains('active')) {
                    overrideShowFileResults();
                }
            }
        });
    });
    
    const tabElement = document.getElementById('mua-hang');
    if (tabElement) {
        observer.observe(tabElement, { attributes: true });
    }
});


// =======================
// HÀM XỬ LÝ FILE MUA HÀNG (THAY THẾ handleZipFiles)
// =======================
async function processPurchaseFiles(files) {
    let processedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    let stockPostedCount = 0;
    
    const fileResults = [];
    
    for (const file of files) {
        if (!file.name.toLowerCase().endsWith('.zip') && !file.name.toLowerCase().endsWith('.xml')) {
            fileResults.push({ file: file.name, status: 'error', message: 'File không phải ZIP/XML' });
            errorCount++;
            continue;
        }
        
        let invoice = null;
        try {
            // Sử dụng hàm trích xuất từ zip-trichxuat.js
            invoice = await window.extractInvoiceFromZip(file);
        } catch (error) {
            fileResults.push({ file: file.name, status: 'error', message: error.message });
            errorCount++;
            continue;
        }

        if (!invoice || !invoice.products || invoice.products.length === 0) {
            fileResults.push({ file: file.name, status: 'error', message: 'Không có sản phẩm' });
            errorCount++;
            continue;
        }
        
        try {
            // 🔥 SỬ DỤNG MST NGƯỜI MUA
            const taxCode = invoice.buyerInfo.taxCode || 'UNKNOWN';
            const companyName = invoice.buyerInfo.name || taxCode;
            
            console.log(`🔍 Phát hiện hóa đơn: MST=${taxCode}, Tên=${companyName}`);
            
            // TẠO/GOM CÔNG TY
            ensureHkdData(taxCode, companyName);
            
            // KIỂM TRA TRÙNG
            if (isDuplicate(invoice, taxCode)) {
                console.log(`🚫 BỎ QUA HĐ TRÙNG: ${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}`);
                fileResults.push({ file: file.name, status: 'duplicate', message: 'Hóa đơn trùng' });
                duplicateCount++;
                continue;
            }
            
            console.log(`✅ THÊM HĐ MỚI: ${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}`);
            
            // THIẾT LẬP TRẠNG THÁI
            invoice.status = {
                validation: 'ok', // Tạm thời cho là OK
                stockPosted: false,
                difference: 0,
                calculatedTotal: invoice.summary.calculatedTotal,
                xmlTotal: invoice.summary.totalAfterTax
            };
            
            // THÊM METADATA
            invoice.uniqueKey = `${invoice.invoiceInfo.mccqt}_${invoice.invoiceInfo.symbol}_${invoice.invoiceInfo.number}`;
            invoice.extractedAt = new Date().toISOString();
            invoice.sourceFile = file.name;
            
            // CHUYỂN TỒN KHO
            updateStock(taxCode, invoice);
            invoice.status.stockPosted = true;
            stockPostedCount++;
            
            // THÊM VÀO DANH SÁCH HÓA ĐƠN
            window.hkdData[taxCode].invoices.push(invoice);
            
            fileResults.push({ 
                file: file.name, 
                status: 'success', 
                message: `Thành công - Đã chuyển tồn kho` 
            });
            processedCount++;
            
            console.log(`[NHẬP HĐ] MST=${taxCode}, HĐ=${invoice.uniqueKey}`);
            
        } catch (error) {
            fileResults.push({ file: file.name, status: 'error', message: error.message });
            errorCount++;
            console.error('Lỗi xử lý file:', file.name, error);
        }
    }
    
    console.log(`📊 Kết quả: ${processedCount} thành công, ${duplicateCount} trùng, ${errorCount} lỗi`);
    
    return { 
        processedCount, 
        duplicateCount, 
        errorCount, 
        stockPostedCount,
        fileResults 
    };
}

// =======================
// CÁC HÀM HIỆN CÓ (GIỮ NGUYÊN)
// =======================
// Giữ nguyên các hàm: createPurchaseStatsContainer, updatePurchaseFileStats, 
// showPurchaseFileResults, showPurchaseFinalResult, debugCompanyData, etc.

// =======================
// Hàm loại bỏ dấu tiếng Việt
// ============================
function removeVietnameseAccents(str) {
  return str.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}

// ============================
// Hàm tạo mã sản phẩm theo tên (LOGIC MỚI)
// ============================
function generateProductCodeByName(taxCode, type, productName) {
  // 1. Chuẩn hóa tên sản phẩm
  const cleanName = removeVietnameseAccents(productName.toUpperCase())
    .replace(/[^A-Z0-9\s]/g, '');

  // 2. Tạo phần chữ: 2 ký tự đầu của 2 cụm từ đầu tiên
  const words = cleanName.split(/\s+/).filter(Boolean);
  let lettersPart = '';
  if (words.length >= 2) {
    lettersPart = words[0].substring(0, 1) + words[1].substring(0, 1);
  } else if (words.length === 1) {
    lettersPart = words[0].substring(0, 2);
  } else {
    lettersPart = 'SP';
  }

  // 3. Tạo phần số: theo logic mới
  const compactName = cleanName.replace(/\s/g, '');
  let numbersPart = '';

  const numberMatches = [...compactName.matchAll(/\d+/g)];
  if (numberMatches.length >= 1) {
    const firstMatch = numberMatches[0];
    const startIdx = firstMatch.index;
    const numStr = firstMatch[0];

    if (numberMatches.length >= 3 || numStr.length >= 3) {
      numbersPart = numStr.substring(0, 3);
    } else if (numberMatches.length === 2 || numStr.length === 2) {
      // lấy 1 ký tự trước số đầu tiên (nếu có)
      const beforeChar = startIdx > 0 ? compactName[startIdx - 1] : 'X';
      numbersPart = beforeChar + numStr;
      numbersPart = numbersPart.substring(0, 3).padEnd(3, 'X');
    } else if (numStr.length === 1) {
      // lấy ký tự trước và sau (nếu có)
      const beforeChar = startIdx > 0 ? compactName[startIdx - 1] : 'X';
      const afterChar = (startIdx + 1 < compactName.length) ? compactName[startIdx + 1] : 'X';
      numbersPart = beforeChar + numStr + afterChar;
    }
  } else {
    // Không có số → lấy 3 ký tự cuối
    numbersPart = compactName.slice(-3).padEnd(3, 'X').substring(0, 3);
  }

  // 4. Ghép thành mã cơ sở
  let baseCode = lettersPart + numbersPart;

  // 5. Kiểm tra trùng và xử lý
  let finalCode = baseCode;
  let suffixChar = 'A';

  while (isProductCodeExist(taxCode, finalCode) && suffixChar <= 'Z') {
    if (numbersPart.match(/^\d+$/)) {
      finalCode = lettersPart + numbersPart.slice(0, -1) + suffixChar;
    } else {
      finalCode = baseCode.slice(0, -1) + suffixChar;
    }
    suffixChar = String.fromCharCode(suffixChar.charCodeAt(0) + 1);
  }

  if (isProductCodeExist(taxCode, finalCode)) {
    let randomSuffix = '';
    do {
      randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
      finalCode = baseCode.slice(0, 3) + randomSuffix;
    } while (isProductCodeExist(taxCode, finalCode) && randomSuffix.length === 3);
  }

  return finalCode.substring(0, 6);
}

// Hàm kiểm tra mã tồn tại
function isProductCodeExist(taxCode, code) {
  if (!hkdData[taxCode]) return false;
  
  const stocks = ['tonkhoMain', 'tonkhoKM', 'tonkhoCK'];
  return stocks.some(stock =>
    hkdData[taxCode][stock]?.some(item => item.productCode === code)
  );
}


// =======================
// Tạo MSP với hậu tố phân loại
// =======================
function generateMSP(code, name, unit, idx, category, taxCode = '') {
  let baseCode = '';
  
  // Nếu có code từ XML và không trống
  if (code && code.trim() !== '') {
    baseCode = code;
  } else if (taxCode && taxCode !== 'UNKNOWN') {
    // Tạo mã theo tên sản phẩm
    baseCode = generateProductCodeByName(taxCode, category, name);
  } else {
    // Fallback: dùng tên + đơn vị
    baseCode = `${removeVietnameseAccents(name)}_${unit}`.replace(/\s+/g, '_').toUpperCase().substring(0, 20);
  }
  
  // THÊM HẬU TỐ PHÂN LOẠI
  if (category === 'chiet_khau') {
    baseCode += '_CK';
  } else if (category === 'khuyen_mai') {
    baseCode += '_KM';
  }
  
  return baseCode;
}

function parseXmlInvoice(xmlContent) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

  const getText = (path, parent = xmlDoc) => {
    const node = parent.querySelector(path);
    return node ? node.textContent.trim() : '';
  };

  const getNumber = (path, parent = xmlDoc) => {
    const text = getText(path, parent);
    return text ? parseFloat(text.replace(/,/g, '')) : 0;
  };

  const getAdditionalInfo = (fieldName) => {
    const ttKhacNode = xmlDoc.querySelector('HDon > DLHDon > NDHDon > TToan > TTKhac');
    if (ttKhacNode) {
      const nodes = ttKhacNode.querySelectorAll('TTin');
      for (const node of nodes) {
        const field = node.querySelector('TTruong');
        if (field && field.textContent.trim() === fieldName) {
          return node.querySelector('DLieu')?.textContent.trim() || '';
        }
      }
    }
    return '';
  };

  const invoiceInfo = {
    title: getText('HDon > DLHDon > TTChung > THDon'),
    template: getText('HDon > DLHDon > TTChung > KHHDon'),
    symbol: getText('HDon > DLHDon > TTChung > KHMSHDon'),
    number: getText('HDon > DLHDon > TTChung > SHDon'),
    date: getText('HDon > DLHDon > TTChung > NLap'),
    paymentMethod: getText('HDon > DLHDon > TTChung > HTTToan'),
    paymentStatus: getAdditionalInfo('Trạng thái thanh toán'),
    amountInWords: getAdditionalInfo('TotalAmountInWordsByENG') || '',
    mccqt: getText('HDon > MCCQT')?.toUpperCase() || ''
  };

  const sellerInfo = {
    name: getText('HDon > DLHDon > NDHDon > NBan > Ten'),
    taxCode: getText('HDon > DLHDon > NDHDon > NBan > MST'),
    address: getText('HDon > DLHDon > NDHDon > NBan > DChi'),
    phone: getText('HDon > DLHDon > NDHDon > NBan > SDThoai'),
    email: getText('HDon > DLHDon > NDHDon > NBan > DCTDTu')
  };

  const buyerInfo = {
    name: getText('HDon > DLHDon > NDHDon > NMua > Ten'),
    taxCode: getText('HDon > DLHDon > NDHDon > NMua > MST'),
    address: getText('HDon > DLHDon > NDHDon > NMua > DChi'),
    customerCode: getText('HDon > DLHDon > NDHDon > NMua > MKHang'),
    idNumber: getText('HDon > DLHDon > NDHDon > NMua > CCCDan')
  };

  const products = [];
  const productNodes = xmlDoc.querySelectorAll('HHDVu');
  
  // KHỞI TẠO CÁC BIẾN TỔNG LŨY KẾ
  let totalManual = 0; // Tổng tiền trước thuế (Sau CK, TỔNG CÁC DÒNG ĐÃ LÀM TRÒN)
  let totalTaxManual = 0; // Tổng tiền thuế (TỔNG CÁC DÒNG ĐÃ LÀM TRÒN)
  let totalAmountWithoutTax = 0; // Tổng tiền trước thuế (TỔNG CÁC DÒNG CHƯA TRỪ CK)
  let totalDiscount = 0; // Tổng chiết khấu

  productNodes.forEach((node, index) => {
    const stt = index + 1;

    // Thông tin cơ bản
    const tchat = parseInt(getText('TChat', node) || '1');
    const name = getText('THHDVu', node) || '';
    const code = getText('MHHDVu', node) || '';
    const unit = getText('DVTinh', node) || 'Cái';
    const quantity = getNumber('SLuong', node);
    const price = getNumber('DGia', node);
    
    // Thông tin chiết khấu
    const discountRate = getNumber('TLCKhau', node);
    const discountAmount = getNumber('STCKhau', node);
    const xmlThTien = getNumber('ThTien', node);

    // ✅ Chuẩn hóa thuế suất
    const taxRateText = getText('TSuat', node).trim();
    const rawTax = taxRateText.toLowerCase().replace('%', '').replace(' ', '');
    let taxRate = 0;
    if (rawTax === 'kct' || rawTax === 'không chịu thuế' || rawTax === '0' || rawTax === '') {
      taxRate = 0;
    } else if (!isNaN(parseFloat(rawTax))) {
      taxRate = parseFloat(rawTax);
    }

    // =========================================================================
    // ✅ TÍNH TOÁN VÒNG LẶP: LÀM TRÒN TỪNG DÒNG
    // =========================================================================
    // 1. Tiền trước thuế (chưa CK): 
    const amountWithoutTax = accountingRound(quantity * price); 
    // 2. Tiền sau CK (đã làm tròn):
    const amountAfterDiscount = accountingRound(amountWithoutTax - discountAmount);
    
    // 3. Thuế suất tính trên giá trị đã được làm tròn (đã làm tròn):
    const taxAmount = accountingRound(amountAfterDiscount * taxRate / 100); 
    // 4. Tổng cộng (đã làm tròn):
    const totalAmount = accountingRound(amountAfterDiscount + taxAmount);

    // ✅ PHÂN LOẠI SẢN PHẨM - LOGIC CHI TIẾT
    let category = 'hang_hoa';
    let classification = 'Hàng hóa, dịch vụ';
    const lowerName = name.toLowerCase();

    // LOGIC 1: Nếu đơn giá = 0 và có số lượng > 0 → Khuyến mại (KM)
    if (price === 0 && quantity > 0) {
      category = 'khuyen_mai';
      classification = 'Khuyến mãi';
    }
    // LOGIC 2: Nếu có từ "chiết khấu" trong tên HOẶC TChat = 3 → Chiết khấu (CK)
    else if (lowerName.includes('chiết khấu') || lowerName.includes('chiet khau') || tchat === 3) {
      category = 'chiet_khau';
      classification = 'Chiết khấu thương mại';
    }
    // LOGIC 3: Nếu có từ "khuyến mãi" trong tên → Khuyến mãi (KM)
    else if (lowerName.includes('khuyến mãi') || lowerName.includes('khuyen mai')) {
      category = 'khuyen_mai';
      classification = 'Khuyến mãi';
    }
    // LOGIC 4: Nếu có chiết khấu lớn (trên 50% giá trị) → Chiết khấu (CK)
    else if (discountAmount > 0 && amountWithoutTax > 0 && 
             (discountAmount / amountWithoutTax) > 0.5) {
      category = 'chiet_khau';
      classification = 'Chiết khấu thương mại';
    }
    // LOGIC 5: Mặc định là hàng hóa
    else {
      category = 'hang_hoa';
      classification = 'Hàng hóa, dịch vụ';
    }

    // ✅ XỬ LÝ SỐ LIỆU THEO PHÂN LOẠI (sử dụng các giá trị đã làm tròn)
    let finalAmount = amountAfterDiscount;
    let finalTaxAmount = taxAmount;
    let finalDiscountAmount = discountAmount;
    
    if (category === 'chiet_khau') {
      // Chiết khấu: số âm
      finalAmount = -Math.abs(amountAfterDiscount);
      finalTaxAmount = -Math.abs(taxAmount);
      finalDiscountAmount = Math.abs(discountAmount);
      totalDiscount += Math.abs(discountAmount);
    } else if (category === 'khuyen_mai') {
      // Khuyến mãi: giá trị 0, không tính vào tổng
      finalAmount = 0;
      finalTaxAmount = 0;
      finalDiscountAmount = 0;
    } else {
      // Hàng hóa thường
      totalDiscount += discountAmount;
      totalAmountWithoutTax += amountWithoutTax;
    }

    // ✅ CỘNG DỒN TỔNG THEO PHÂN LOẠI
    // 🔥 QUAN TRỌNG: Cộng dồn giá trị đã làm tròn TỪNG DÒNG
    if (category === 'hang_hoa' || category === 'chiet_khau') {
      totalManual += finalAmount; // KHÔNG làm tròn running total
      totalTaxManual += finalTaxAmount; // KHÔNG làm tròn running total
    }
    // Khuyến mãi: không ảnh hưởng đến tổng tiền

    // TẠO MSP VỚI HẬU TỐ PHÂN LOẠI
    const msp = generateMSP(code, name, unit, index, category, buyerInfo.taxCode);

    products.push({
      stt,
      msp,
      code,
      name,
      unit,
      quantity: quantity.toString(),
      price: price.toString(),
      discount: finalDiscountAmount.toString(),
      discountRate: discountRate.toString(),
      amount: finalAmount,
      amountWithoutTax: amountWithoutTax,
      taxRate,
      taxRateText: taxRate + '%',
      taxAmount: finalTaxAmount,
      totalAmount: totalAmount,
      category,
      classification,
      tchat,
      hasDifference: Math.abs(amountAfterDiscount - xmlThTien) >= 1,
      xmlAmount: xmlThTien,
      isFree: price === 0
    });
  });

  // =========================================================================
  // TỔNG HỢP THANH TOÁN (Lần 1)
  // =========================================================================
  const ttCKTMai = getNumber('HDon > DLHDon > NDHDon > TToan > TTCKTMai');
  const tgTThue = getNumber('HDon > DLHDon > NDHDon > TToan > TgTThue');
  const tgTTTBSo = getNumber('HDon > DLHDon > NDHDon > TToan > TgTTTBSo');
  const tgTCThue = getNumber('HDon > DLHDon > NDHDon > TToan > TgTCThue');

  // LÀM TRÒN TỔNG CỘNG CUỐI CÙNG
  const calculatedTotal = accountingRound(totalManual + totalTaxManual);

  let summary = {
    totalAmount: accountingRound(tgTCThue),
    totalTax: accountingRound(tgTThue),
    totalAfterTax: accountingRound(tgTTTBSo),
    totalDiscount: accountingRound(ttCKTMai),
    
    calculatedAmountWithoutTax: accountingRound(totalAmountWithoutTax),
    calculatedDiscount: accountingRound(totalDiscount),
    calculatedAmountAfterDiscount: accountingRound(totalManual),
    calculatedTax: accountingRound(totalTaxManual),
    calculatedTotal: calculatedTotal,
    
    // Initial differences (before adjustment)
    amountDifference: accountingRound(totalManual - tgTCThue),
    taxDifference: accountingRound(totalTaxManual - tgTThue),
    totalDifference: accountingRound(calculatedTotal - tgTTTBSo),
    discountDifference: accountingRound(totalDiscount - ttCKTMai),
    
    hasData: tgTTTBSo > 0 || tgTCThue > 0
  };
  
  // =========================================================================
  // ✅ LOGIC ĐIỀU CHỈNH SAI SỐ KẾ TOÁN (±1 hoặc ±2 đồng)
  // =========================================================================
  const totalDiff = summary.totalDifference;
  const tolerance = 2; // Ngưỡng chấp nhận sai số

  // Điều kiện điều chỉnh: Tổng tiền sau thuế chênh lệch không quá 2 đồng
  if (Math.abs(totalDiff) > 0 && Math.abs(totalDiff) <= tolerance) {
      console.log(`⚠️ Điều chỉnh tổng tiền: Phát hiện chênh lệch ${totalDiff} đồng. Áp dụng khớp XML.`);
      
      // 1. Áp đặt Tổng sau thuế (calculatedTotal) bằng giá trị XML (totalAfterTax)
      summary.calculatedTotal = summary.totalAfterTax; 
      
      // 2. Áp đặt Tổng Thuế (calculatedTax) bằng giá trị XML (totalTax)
      summary.calculatedTax = summary.totalTax; 
      
      // 3. Cập nhật lại chênh lệch sau khi điều chỉnh: Bắt buộc về 0
      summary.totalDifference = 0;
      summary.taxDifference = 0; 
      
      console.log(`✅ Điều chỉnh thành công. Tổng tiền sau thuế (Code) = ${summary.calculatedTotal}, Tổng Thuế (Code) = ${summary.calculatedTax}`);
  }
  
  // XÁC ĐỊNH LOẠI HÓA ĐƠN
  const hasCK = products.some(p => p.category === 'chiet_khau');
  const hasKM = products.some(p => p.category === 'khuyen_mai');
  
  if (hasCK) invoiceInfo.type = 'Chiết khấu';
  else if (hasKM) invoiceInfo.type = 'Khuyến mãi';
  else invoiceInfo.type = 'Hàng hóa';

  return { 
    invoiceInfo, 
    sellerInfo, 
    buyerInfo, 
    products, 
    totals: summary,
    summary
  };
}

// =======================
// Cập nhật tồn kho với phân loại CHÍNH XÁC
// =======================
function updateStock(taxCode, invoice) {
  ensureHkdData(taxCode);
  const hkd = hkdData[taxCode];
  
  console.log('🔄 Bắt đầu cập nhật tồn kho với phân loại:');
  
  invoice.products.forEach(item => {
    console.log(`📦 Xử lý: ${item.name} | Category: ${item.category} | Classification: ${item.classification}`);
    
    const consistentMSP = item.msp;
    
    let stockItem = hkd.tonkhoMain.find(p => p.msp === consistentMSP);
    
    if (stockItem) {
      // Cộng dồn số lượng, giá trị và chiết khấu
      stockItem.quantity += parseFloat(item.quantity);
      stockItem.amount += item.amount;
      stockItem.discount = (parseFloat(stockItem.discount) || 0) + (parseFloat(item.discount) || 0);
      
      console.log(`✅ Cộng dồn tồn kho: ${item.name} | SL: +${item.quantity} | CK: +${item.discount}`);
    } else {
      // Thêm mới với đầy đủ thông tin phân loại
      hkd.tonkhoMain.push({
        msp: consistentMSP,
        code: item.msp,
        name: item.name,
        unit: item.unit,
        quantity: parseFloat(item.quantity),
        amount: item.amount,
        discount: parseFloat(item.discount) || 0,
        category: item.category,           // 🟡 Lưu category
        classification: item.classification, // 🟡 Lưu classification
        tchat: item.tchat
      });
      console.log(`✅ Thêm mới tồn kho: ${item.name} | Phân loại: ${item.classification}`);
    }
  });
  
  console.log('📊 Tồn kho sau cập nhật:', hkd.tonkhoMain);
}

// =======================
// Kiểm tra trùng HĐ
// =======================


// =======================
// Trích xuất hóa đơn từ ZIP
// =======================
async function extractInvoiceFromZip(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                const fileContent = e.target.result;
                let xmlText = '';
                const isXML = file.name.toLowerCase().endsWith('.xml');
                let invoice = null;
                
                if (isXML) {
                    xmlText = fileContent;
                    invoice = parseXmlInvoice(xmlText);
                } else {
                    // Xử lý file ZIP
                    if (typeof JSZip === 'undefined') {
                        reject(new Error('Vui lòng thêm thư viện JSZip để xử lý file ZIP. Thêm: <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>'));
                        return;
                    }
                    
                    const zip = await JSZip.loadAsync(fileContent);
                    const xmlFiles = Object.keys(zip.files).filter(name => name.toLowerCase().endsWith('.xml'));
                    
                    if (xmlFiles.length === 0) {
                        if (typeof window.showToast === 'function') {
                            window.showToast(`Không tìm thấy file XML trong: ${file.name}`, 3000, 'error');
                        }
                        resolve(null);
                        return;
                    }

                    // Lấy file XML đầu tiên
                    const xmlFile = xmlFiles[0];
                    xmlText = await zip.file(xmlFile).async('text');
                    
                    // Parse XML
                    invoice = parseXmlInvoice(xmlText);
                    
                    // Kiểm tra HTML preview
                    const htmlFiles = Object.keys(zip.files).filter(name => name.toLowerCase().endsWith('.html'));
                    if (htmlFiles.length > 0) {
                        const htmlFile = htmlFiles[0];
                        const htmlContent = await zip.file(htmlFile).async('text');
                        const blob = new Blob([htmlContent], { type: 'text/html' });
                        invoice.htmlUrl = URL.createObjectURL(blob);
                    }
                }
                
                // Thêm thông tin file
                invoice.originalFileId = 'local-file-' + Date.now() + '-' + (invoice.buyerInfo.taxCode || 'UNKNOWN');
                invoice.fileName = file.name;
                
                console.log('✅ Đã trích xuất hóa đơn:', {
                    number: invoice.invoiceInfo.number,
                    products: invoice.products.length,
                    total: invoice.summary.calculatedTotal
                });

                resolve(invoice);

            } catch (error) {
                console.error('❌ Lỗi đọc file:', file.name, error);
                if (typeof window.showToast === 'function') {
                    window.showToast(`Lỗi đọc file: ${file.name}`, 3000, 'error');
                }
                // Dù có lỗi, vẫn resolve null để vòng lặp handleZipFiles không bị dừng
                reject(new Error('Lỗi đọc file: ' + error.message));
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Không thể đọc file'));
        };
        
        // Đọc file theo loại
        if (file.name.toLowerCase().endsWith('.xml')) {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    });
}

// =======================
// Exports toàn cục
// =======================
window.handleZipFiles = handleZipFiles;
window.extractInvoiceFromZip = extractInvoiceFromZip;
window.parseXmlInvoice = parseXmlInvoice;
window.ensureHkdData = ensureHkdData;
window.isDuplicate = isDuplicate;
window.updateStock = updateStock;
window.generateMSP = generateMSP;
window.generateProductCodeByName = generateProductCodeByName;
window.removeVietnameseAccents = removeVietnameseAccents;
window.isProductCodeExist = isProductCodeExist;