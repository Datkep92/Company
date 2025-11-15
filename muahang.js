

function renderModePreview(mode, fileCount) {
    if (mode === 'immediate') {
        return `
            <div class="preview-immediate">
                <h4>⚡ Sẽ xử lý ngay:</h4>
                <ul>
                    <li>Hiển thị popup sửa lỗi trực tiếp</li>
                    <li>Cập nhật ngay vào Mua Hàng & Kho</li>
                    <li>Phù hợp cho <strong>${fileCount} file</strong></li>
                    <li>Hoàn thành ngay trong vài phút</li>
                </ul>
            </div>
        `;
    } else {
        return `
            <div class="preview-batch">
                <h4>📦 Sẽ xử lý hàng loạt:</h4>
                <ul>
                    <li>Chuyển sang tab "NHẬP HÓA ĐƠN ĐẦU VÀO"</li>
                    <li>Quản lý tập trung tất cả hóa đơn</li>
                    <li>Xử lý <strong>${fileCount} file</strong> theo lô</li>
                    <li>Phù hợp cho số lượng lớn</li>
                </ul>
            </div>
        `;
    }
}


// =======================
// THÊM HÀM XỬ LÝ LỖI TỨC THÌ
// =======================
async function processImmediateErrors(results) {
    console.log(`⚠️ Có ${results.errorCount} hóa đơn cần xử lý`);
    
    // Hiển thị thông báo về hóa đơn lỗi
    if (results.errorCount === 1) {
        const userChoice = confirm(`⚠️ Phát hiện 1 hóa đơn có chênh lệch.\n\nBạn có muốn xử lý thủ công ngay không?`);
        if (userChoice) {
            // TODO: Hiển thị popup chỉnh sửa hóa đơn
            console.log('🎯 Sẽ hiển thị popup chỉnh sửa hóa đơn');
            alert('📝 Chức năng chỉnh sửa hóa đơn đang được phát triển...');
        }
    } else if (results.errorCount > 1) {
        alert(`⚠️ Phát hiện ${results.errorCount} hóa đơn có chênh lệch.\n\nCác hóa đơn này sẽ được chuyển sang tab xử lý chuyên dụng.`);
    }
}




// =======================
// THÊM CSS CHO MODAL
// =======================
function addProcessingModalStyles() {
    const styles = `
        <style>
        .processing-choice-modal .mode-option {
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: flex-start;
        }
        
        .processing-choice-modal .mode-option:hover {
            border-color: #007bff;
            background: #f8f9fa;
        }
        
        .processing-choice-modal .mode-option.recommended {
            border-color: #28a745;
            background: #f8fff9;
        }
        
        .processing-choice-modal input[type="radio"] {
            margin-right: 10px;
            margin-top: 5px;
        }
        
        .processing-choice-modal .mode-icon {
            font-size: 24px;
            margin-right: 15px;
        }
        
        .processing-choice-modal .mode-content {
            flex: 1;
        }
        
        .processing-choice-modal .mode-title {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 5px;
        }
        
        .processing-choice-modal .mode-desc {
            font-size: 14px;
            color: #666;
            line-height: 1.4;
        }
        
        .mode-preview {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #007bff;
        }
        
        .mode-preview h4 {
            margin: 0 0 10px 0;
            color: #333;
        }
        
        .mode-preview ul {
            margin: 0;
            padding-left: 20px;
        }
        
        .mode-preview li {
            margin-bottom: 5px;
        }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
}

// =======================
// HÀM PHỤ TRỢ
// =======================
function showLoading(message) {
    console.log('⏳ ' + message);
    // Có thể thêm spinner UI sau
}

function showSuccessMessage(message) {
    alert(message);
}

function showBatchResultsSummary(results, totalFiles) {
    const message = `
📊 KẾT QUẢ TRÍCH XUẤT HÀNG LOẠT

📁 Tổng số file: ${totalFiles}
✅ Hóa đơn hợp lệ: ${results.processedCount}
⚠️ Hóa đơn cần sửa: ${results.errorCount}
🔄 Trùng lặp: ${results.duplicateCount}
📦 Đã chuyển kho: ${results.stockPostedCount}

Đang chuyển sang tab xử lý chuyên dụng...
    `;
    
    alert(message);
}

function switchToImportTab() {
    console.log('🔄 Chuyển sang tab NHẬP HÓA ĐƠN ĐẦU VÀO');
    // Sẽ triển khai khi có tab mới
    alert('📦 Đã chuyển hóa đơn sang tab xử lý chuyên dụng. Tab này đang được phát triển.');
}

// =======================
// KHỞI TẠO
// =======================
// =======================
// SỬA HÀM VIEWPURCHASEINVOICEDETAIL - THÊM CỘT CHIẾT KHẤU
// =======================
function viewPurchaseInvoiceDetail(invoiceId) {
    if (!window.currentCompany) {
        alert('👈 Vui lòng chọn công ty trước.');
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === invoiceId);
    
    if (!invoice) {
        alert('❌ Không tìm thấy hóa đơn');
        return;
    }

    let detailHtml = `
        <div class="card">
            <div class="card-header">📄 Thông Tin Hóa Đơn</div>
            <div class="card-body">
                <div class="row">
                    <div class="col-6">
                        <p><strong>📋 Số HĐ:</strong> ${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</p>
                        <p><strong>📅 Ngày HĐ:</strong> ${window.formatDate(invoice.invoiceInfo.date)}</p>
                        <p><strong>🏢 Nhà cung cấp:</strong> ${invoice.sellerInfo.name}</p>
                    </div>
                    <div class="col-6">
                        <p><strong>🔢 MST NCC:</strong> ${invoice.sellerInfo.taxCode}</p>
                        <p><strong>📍 Địa chỉ:</strong> ${invoice.sellerInfo.address || 'Không có'}</p>
                        <p><strong>📞 Điện thoại:</strong> ${invoice.sellerInfo.phone || 'Không có'}</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">💰 Tổng Hợp Thanh Toán</div>
            <div class="card-body">
                <table class="table table-bordered">
                    <tr><th>Tổng tiền hàng trước thuế</th><td style="text-align: right;">${window.formatCurrency(invoice.summary.calculatedAmountAfterDiscount)}</td></tr>
                    <tr><th>Thuế GTGT</th><td style="text-align: right;">${window.formatCurrency(invoice.summary.calculatedTax)}</td></tr>
                    <tr style="font-weight: bold; background: #f8f9fa;"><th>Tổng thanh toán</th><td style="text-align: right;">${window.formatCurrency(invoice.summary.calculatedTotal)}</td></tr>
                    <tr><th>Trạng thái</th><td>${invoice.status && invoice.status.stockPosted ? '✅ Đã nhập kho' : '⚠️ Chưa nhập kho'}</td></tr>
                </table>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">📦 Chi Tiết Hàng Hóa</div>
            <div class="card-body" style="max-height: 400px; overflow-y: auto;">
                <table class="table table-striped table-sm">
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>MSP</th>
                            <th>Tên hàng hóa</th>
                            <th>ĐVT</th>
                            <th>SL</th>
                            <th>Đơn giá</th>
                            <th>Chiết khấu</th>
                            <th>Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    invoice.products.forEach(product => {
        // Lấy thông tin chiết khấu từ XML, nếu không có thì hiển thị 0
        const discount = product.discount || product.discountAmount || product.discountRate || 0;
        const discountFormatted = typeof discount === 'number' ? window.formatCurrency(discount) : discount;
        
        detailHtml += `
            <tr>
                <td>${product.stt}</td>
                <td><code>${product.msp}</code></td>
                <td>${product.name}</td>
                <td>${product.unit}</td>
                <td style="text-align: right;">${product.quantity}</td>
                <td style="text-align: right;">${window.formatCurrency(product.price)}</td>
                <td style="text-align: right;">${discountFormatted}</td>
                <td style="text-align: right;">${window.formatCurrency(product.amount)}</td>
            </tr>
        `;
    });
    
    detailHtml += `
                    </tbody>
                </table>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <button class="btn btn-primary" onclick="printPurchaseInvoice('${invoiceId}')">🖨️ In Hóa Đơn</button>
            ${(!invoice.status || !invoice.status.stockPosted) ? 
              `<button class="btn btn-success" onclick="createPurchaseReceipt('${invoiceId}')">📦 Tạo Phiếu Nhập Kho</button>` : 
              ''}
        </div>
    `;
    
    window.showModal(`📄 Chi Tiết Hóa Đơn - ${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}`, detailHtml, 'modal-lg');
}

// =======================
// SỬA HÀM EDITPURCHASEINVOICE - THÊM CỘT CHIẾT KHẤU
// =======================
function editPurchaseInvoice(invoiceId) {
    if (!window.currentCompany) {
        alert('👈 Vui lòng chọn công ty trước.');
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === invoiceId);
    
    if (!invoice) {
        alert('❌ Không tìm thấy hóa đơn');
        return;
    }

    console.log('🎯 Bắt đầu mở popup chỉnh sửa hóa đơn:', invoiceId);

    // Tạo form chỉnh sửa
    let editHtml = `
        <div class="card">
            <div class="card-header">📝 Chỉnh Sửa Hóa Đơn</div>
            <div class="card-body">
                <div class="row">
                    <div class="col-6">
                        <div class="form-group">
                            <label><strong>📋 Số HĐ:</strong></label>
                            <input type="text" class="form-control" id="edit-invoice-number" value="${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}">
                        </div>
                        <div class="form-group">
                            <label><strong>📅 Ngày HĐ:</strong></label>
                            <input type="date" class="form-control" id="edit-invoice-date" value="${invoice.invoiceInfo.date}">
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="form-group">
                            <label><strong>🏢 Nhà cung cấp:</strong></label>
                            <input type="text" class="form-control" id="edit-supplier-name" value="${invoice.sellerInfo.name}">
                        </div>
                        <div class="form-group">
                            <label><strong>🔢 MST NCC:</strong></label>
                            <input type="text" class="form-control" id="edit-supplier-taxcode" value="${invoice.sellerInfo.taxCode}">
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">💰 Tổng Hợp Thanh Toán</div>
            <div class="card-body">
                <div class="row">
                    <div class="col-4">
                        <div class="form-group">
                            <label><strong>Tổng tiền hàng:</strong></label>
                            <input type="number" class="form-control" id="edit-total-amount" value="${invoice.summary.calculatedAmountAfterDiscount}" step="0.01" oninput="calculateTotalPayment()">
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="form-group">
                            <label><strong>Thuế GTGT:</strong></label>
                            <input type="number" class="form-control" id="edit-tax-amount" value="${invoice.summary.calculatedTax}" step="0.01" oninput="calculateTotalPayment()">
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="form-group">
                            <label><strong>Tổng thanh toán:</strong></label>
                            <input type="number" class="form-control" id="edit-total-payment" value="${invoice.summary.calculatedTotal}" step="0.01" readonly>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">📦 Chi Tiết Hàng Hóa</div>
            <div class="card-body" style="max-height: 400px; overflow-y: auto;">
                <table class="table table-striped table-sm">
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>MSP</th>
                            <th>Tên hàng hóa</th>
                            <th>ĐVT</th>
                            <th>SL</th>
                            <th>Đơn giá</th>
                            <th>Chiết khấu</th>
                            <th>Thành tiền</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody id="edit-products-body">
    `;
    
    // Hiển thị các dòng sản phẩm hiện tại với cột chiết khấu
    invoice.products.forEach((product, index) => {
        const discount = product.discount || product.discountAmount || product.discountRate || 0;
        
        editHtml += `
            <tr id="product-row-${index}">
                <td>${product.stt}</td>
                <td><input type="text" class="form-control form-control-sm" value="${product.msp}" onchange="updateProductField('${invoiceId}', ${index}, 'msp', this.value)"></td>
                <td><input type="text" class="form-control form-control-sm" value="${product.name}" onchange="updateProductField('${invoiceId}', ${index}, 'name', this.value)"></td>
                <td><input type="text" class="form-control form-control-sm" value="${product.unit}" onchange="updateProductField('${invoiceId}', ${index}, 'unit', this.value)"></td>
                <td><input type="number" class="form-control form-control-sm" value="${product.quantity}" step="0.001" onchange="updateProductField('${invoiceId}', ${index}, 'quantity', this.value)"></td>
                <td><input type="number" class="form-control form-control-sm" value="${product.price}" step="0.01" onchange="updateProductField('${invoiceId}', ${index}, 'price', this.value)"></td>
                <td><input type="number" class="form-control form-control-sm" value="${discount}" step="0.01" onchange="updateProductField('${invoiceId}', ${index}, 'discount', this.value)"></td>
                <td><input type="number" class="form-control form-control-sm" value="${product.amount}" step="0.01" onchange="updateProductField('${invoiceId}', ${index}, 'amount', this.value)"></td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="removeProduct('${invoiceId}', ${index})">🗑️</button>
                </td>
            </tr>
        `;
    });
    
    editHtml += `
                    </tbody>
                </table>
                <button class="btn btn-sm btn-success" onclick="addNewProduct('${invoiceId}')">➕ Thêm dòng</button>
            </div>
        </div>
        
        <div class="alert alert-info">
            <strong>💡 Lưu ý:</strong> Thay đổi sẽ tự động cập nhật vào tồn kho nếu hóa đơn đã được nhập kho.
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <button class="btn btn-primary" onclick="saveInvoiceChanges('${invoiceId}')">💾 Lưu Thay Đổi</button>
            <button class="btn btn-secondary" onclick="closeModal()">❌ Hủy</button>
        </div>
    `;
    
    // KIỂM TRA HÀM showModal TỒN TẠI
    if (typeof window.showModal !== 'function') {
        console.error('❌ Hàm showModal không tồn tại');
        alert('❌ Lỗi: Không thể mở popup chỉnh sửa. Hàm showModal không tồn tại.');
        return;
    }
    
    try {
        window.showModal(`📝 Chỉnh Sửa Hóa Đơn - ${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}`, editHtml, 'modal-xl');
        console.log('✅ Đã gọi hàm showModal thành công');
    } catch (error) {
        console.error('❌ Lỗi khi gọi showModal:', error);
        alert('❌ Lỗi khi mở popup chỉnh sửa: ' + error.message);
    }
}

// =======================
// SỬA HÀM UPDATEPRODUCTFIELD - XỬ LÝ CẬP NHẬT CHIẾT KHẤU
// =======================
function updateProductField(invoiceId, productIndex, field, value) {
    if (!window.currentCompany || !window.hkdData) {
        console.error('❌ Chưa chọn công ty hoặc dữ liệu không tồn tại');
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === invoiceId);
    
    if (invoice && invoice.products[productIndex]) {
        // Xử lý đặc biệt cho trường hợp chiết khấu
        if (field === 'discount') {
            // Lưu chiết khấu vào các trường có thể có trong XML
            invoice.products[productIndex].discount = parseFloat(value) || 0;
            invoice.products[productIndex].discountAmount = parseFloat(value) || 0;
        } else {
            invoice.products[productIndex][field] = value;
        }
        
        // Tự động tính toán thành tiền nếu thay đổi số lượng, đơn giá hoặc chiết khấu
        if (field === 'quantity' || field === 'price' || field === 'discount') {
            const quantity = parseFloat(invoice.products[productIndex].quantity) || 0;
            const price = parseFloat(invoice.products[productIndex].price) || 0;
            const discount = parseFloat(invoice.products[productIndex].discount) || 0;
            
            // Tính thành tiền: (số lượng * đơn giá) - chiết khấu
            invoice.products[productIndex].amount = (quantity * price - discount).toFixed(2);
            
            // Cập nhật giá trị trên form (cột thành tiền là cột thứ 8, index 7)
            const amountInput = document.querySelector(`#product-row-${productIndex} input[type="number"]:nth-child(8)`);
            if (amountInput) {
                amountInput.value = invoice.products[productIndex].amount;
            }
        }
        
        console.log(`✅ Đã cập nhật ${field} cho sản phẩm ${productIndex}:`, value);
    }
}

// =======================
// SỬA HÀM ADDNEWPRODUCT - THÊM CHIẾT KHẤU MẶC ĐỊNH
// =======================
function addNewProduct(invoiceId) {
    if (!window.currentCompany || !window.hkdData) {
        console.error('❌ Chưa chọn công ty hoặc dữ liệu không tồn tại');
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === invoiceId);
    
    if (invoice) {
        const newProduct = {
            stt: invoice.products.length + 1,
            msp: 'NEW',
            name: 'Sản phẩm mới',
            unit: 'cái',
            quantity: 1,
            price: 0,
            discount: 0,
            discountAmount: 0,
            amount: 0
        };
        
        invoice.products.push(newProduct);
        
        closeModal();
        setTimeout(() => {
            editPurchaseInvoice(invoiceId);
        }, 100);
        
        console.log('✅ Đã thêm sản phẩm mới với chiết khấu');
    }
}

function addStatusBadgeStyles() {
    const styles = `
        <style>
        .badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
        }
        
        .badge-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .badge-warning {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        
        .badge-danger {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .badge-info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        
        .table-success { background-color: #d4edda !important; }
        .table-warning { background-color: #fff3cd !important; }
        .table-danger { background-color: #f8d7da !important; }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
}
async function processPurchaseInvoices() {
    const fileInput = document.getElementById('purchase-invoice-files');
    if (!fileInput || !fileInput.files.length) {
        alert('📁 Vui lòng chọn file XML/ZIP trước.');
        return;
    }

    if (!window.currentCompany) {
        alert('👈 Vui lòng chọn công ty trước.');
        return;
    }

    try {
        console.log('🔄 Bắt đầu xử lý hóa đơn mua hàng...');
        
        // Hiển thị trạng thái loading
        showLoading('Đang xử lý hóa đơn...');

        const files = Array.from(fileInput.files);
        console.log(`📁 Số file cần xử lý: ${files.length}`);

        // Gọi hàm xử lý từ module trích xuất
        if (typeof window.processZipFiles === 'function') {
            const results = await window.processZipFiles(files, window.currentCompany);
            
            // Cập nhật thống kê
            updatePurchaseFileStats(
                files.length,
                results.processedCount,
                results.errorCount,
                results.duplicateCount,
                results.stockPostedCount
            );
            
            // Hiển thị kết quả
            showPurchaseSuccessMessage(results);
            
            // Reload danh sách
            loadPurchaseInvoices();
            loadPayableList();
            
        } else {
            throw new Error('Hàm processZipFiles không tồn tại');
        }

    } catch (error) {
        console.error('❌ Lỗi xử lý hóa đơn:', error);
        alert(`❌ Lỗi xử lý hóa đơn: ${error.message}`);
    } finally {
        // Reset file input
        fileInput.value = '';
    }
}
function initFileInputListener() {
    const fileInput = document.getElementById('purchase-invoice-files');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const files = e.target.files;
            if (files.length > 0) {
                console.log(`📁 Đã chọn ${files.length} file`);
                // Tự động tạo container thống kê nếu chưa có
                createPurchaseStatsContainer();
            }
        });
    }
}
function initMuaHangModule() {
    console.log('🔄 Đang khởi tạo module Mua Hàng...');
    
    // Kiểm tra hàm modal
    checkModalFunction();
    
    // Thêm CSS
    addProcessingModalStyles();
    addEditModalStyles();
    
    // Khởi tạo event listeners
    initFileInputListener();
    
    // Lắng nghe sự kiện xử lý hóa đơn mua hàng
    const processButton = document.getElementById('process-purchase-invoices');
    if (processButton) {
        processButton.addEventListener('click', processPurchaseInvoices);
        console.log('✅ Đã gắn sự kiện cho nút xử lý hóa đơn');
    } else {
        console.error('❌ Không tìm thấy nút process-purchase-invoices');
    }

    // Tạo container thống kê
    createPurchaseStatsContainer();
    
    // Tải dữ liệu ban đầu
    loadPurchaseInvoices();
    loadPayableList();
    
    console.log('✅ Module Mua Hàng đã khởi tạo xong');
}


function updateFileStats(total, success, error, duplicate, stockPosted = 0) {
    console.log('📊 Cập nhật thống kê:', {total, success, error, duplicate, stockPosted});
    
    // KIỂM TRA XEM ĐANG Ở TAB NÀO
    const currentTab = document.querySelector('.nav-tab.active')?.getAttribute('data-tab');
    console.log('📍 Tab hiện tại:', currentTab);
    
    if (currentTab === 'mua-hang') {
        // Nếu đang ở tab Mua Hàng, sử dụng hàm của tab Mua Hàng
        if (typeof updatePurchaseFileStats === 'function') {
        } else {
            console.warn('⚠️ Hàm updatePurchaseFileStats không tồn tại');
        }
        return;
    }
    
    // Nếu đang ở tab Trích Xuất HĐ (tab cũ), cập nhật các phần tử cũ
    try {
        const totalFilesElem = document.getElementById('total-files');
        const successCountElem = document.getElementById('success-count');
        const duplicateCountElem = document.getElementById('duplicate-count');
        const errorCountElem = document.getElementById('error-count');
        const stockPostedElem = document.getElementById('stock-posted-count');
        
        // CHỈ CẬP NHẬT NẾU PHẦN TỬ TỒN TẠI
        if (totalFilesElem) totalFilesElem.textContent = total;
        if (successCountElem) successCountElem.textContent = success;
        if (duplicateCountElem) duplicateCountElem.textContent = duplicate;
        if (errorCountElem) errorCountElem.textContent = error;
        if (stockPostedElem) stockPostedElem.textContent = stockPosted;
        
        // Hiển thị container thống kê nếu tồn tại
        const fileStatsElem = document.getElementById('file-stats');
        if (fileStatsElem) {
            fileStatsElem.classList.remove('hidden');
        }
        
    } catch (error) {
        console.warn('⚠️ Không thể cập nhật thống kê tab cũ:', error.message);
    }
}
// XÓA HÀM TRÙNG LẶP NÀY (đã có trong zip-trichxuat.js)
/*
function updateFileStats(total, success, error, duplicate, stockPosted = 0) {
    // XÓA TOÀN BỘ HÀM NÀY
}
*/

// GIỮ LẠI HÀM createPurchaseStatsContainer VÀ updatePurchaseFileStats
function createPurchaseStatsContainer() {
    // KIỂM TRA KỸ TRƯỚC KHI TẠO
    const existingStats = document.getElementById('purchase-file-stats');
    if (existingStats) {
        existingStats.remove(); // Xóa cái cũ nếu tồn tại
    }
    
    const fileInputSection = document.querySelector('#mua-hang .card:first-child');
    if (!fileInputSection) {
        console.error('❌ Không tìm thấy section file input');
        return;
    }
    
    // Tạo HTML cho thống kê
    const statsHtml = `
        <div class="card" id="purchase-file-stats">
            <div class="card-header">📊 Thống Kê Xử Lý</div>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-label">Tổng số file</div>
                    <div id="purchase-total-files" class="stat-value">0</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label text-success">Thành công</div>
                    <div id="purchase-success-count" class="stat-value">0</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label text-warning">Trùng lặp</div>
                    <div id="purchase-duplicate-count" class="stat-value">0</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label text-danger">Lỗi</div>
                    <div id="purchase-error-count" class="stat-value">0</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label text-info">Đã chuyển kho</div>
                    <div id="purchase-stock-posted-count" class="stat-value">0</div>
                </div>
            </div>
        </div>
    `;
    
    fileInputSection.insertAdjacentHTML('afterend', statsHtml);
    console.log('✅ Đã tạo container thống kê');
}

// THÊM HÀM HIỂN THỊ KẾT QUẢ FILE BỊ THIẾU
function showPurchaseFileResults(fileResults) {
    let resultsHtml = `
        <div class="card">
            <div class="card-header">📋 Chi Tiết Kết Quả Xử Lý</div>
            <div style="max-height: 300px; overflow-y: auto;">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>File</th>
                            <th>Trạng thái</th>
                            <th>Thông báo</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    fileResults.forEach(result => {
        let statusClass = '';
        let statusIcon = '';
        
        switch(result.status) {
            case 'success':
                statusClass = 'text-success';
                statusIcon = '✅';
                break;
            case 'duplicate':
                statusClass = 'text-warning';
                statusIcon = '⚠️';
                break;
            case 'error':
                statusClass = 'text-danger';
                statusIcon = '❌';
                break;
            default:
                statusClass = 'text-secondary';
                statusIcon = '🔍';
        }
        
        resultsHtml += `
            <tr>
                <td><small>${result.file}</small></td>
                <td class="${statusClass}">${statusIcon} ${result.status}</td>
                <td><small>${result.message}</small></td>
            </tr>
        `;
    });
    
    resultsHtml += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Hiển thị trong modal
    window.showModal('📋 Kết Quả Xử Lý Chi Tiết', resultsHtml);
}

// THÊM HÀM HIỂN THỊ KẾT QUẢ CUỐI CÙNG
function showPurchaseFinalResult(results, totalFiles) {
    const successRate = totalFiles > 0 ? (results.processedCount / totalFiles * 100).toFixed(1) : 0;
    
    const message = `
🎯 **XỬ LÝ HOÀN TẤT!**

📊 **Tổng kết:**
• 📁 Tổng file: ${totalFiles}
• ✅ Thành công: ${results.processedCount}
• 🔄 Trùng lặp: ${results.duplicateCount}
• 📦 Đã chuyển kho: ${results.stockPostedCount}
• ❌ Lỗi: ${results.errorCount}
• 📈 Tỷ lệ thành công: ${successRate}%

🏢 **Tình trạng công ty:**
• Đang chọn: ${window.currentCompany ? window.hkdData[window.currentCompany]?.name : 'Chưa chọn'}
• Tổng công ty: ${Object.keys(window.hkdData).length}

💡 **Tiếp theo:**
• Hóa đơn đã được gom theo MST người mua
• Tự động tạo công ty nếu chưa có
• Dữ liệu đã sẵn sàng trong tab Mua Hàng
    `;
    
    // Sử dụng console.log để debug
    console.log('🔍 DEBUG - Danh sách công ty sau xử lý:', Object.keys(window.hkdData));
    console.log('🔍 DEBUG - Hóa đơn trong công ty hiện tại:', 
        window.currentCompany ? window.hkdData[window.currentCompany]?.invoices?.length : 'Chưa chọn công ty');
    
    alert(message);
}
// THÊM HÀM DEBUG VÀO muahang.js
function debugCompanyData() {
    console.log('🔍 DEBUG COMPANY DATA:');
    console.log('- Số công ty:', Object.keys(window.hkdData).length);
    
    Object.keys(window.hkdData).forEach(taxCode => {
        const company = window.hkdData[taxCode];
        console.log(`- ${taxCode}: ${company.name}`);
        console.log(`  Số HĐ: ${company.invoices?.length || 0}`);
        console.log(`  Tồn kho: ${company.tonkhoMain?.length || 0} sản phẩm`);
        
        // Log chi tiết hóa đơn
        if (company.invoices && company.invoices.length > 0) {
            company.invoices.forEach((inv, idx) => {
                console.log(`  HĐ ${idx + 1}: ${inv.invoiceInfo.symbol}/${inv.invoiceInfo.number} - ${inv.summary.calculatedTotal}`);
            });
        }
    });
}


function updatePurchaseFileStats(total, success, error, duplicate, stockPosted = 0) {
    console.log('🔄 Cập nhật thống kê:', {total, success, error, duplicate, stockPosted});
    
    // Cập nhật các phần tử thống kê
    const elements = {
        'purchase-total-files': total,
        'purchase-success-count': success,
        'purchase-duplicate-count': duplicate,
        'purchase-error-count': error,
        'purchase-stock-posted-count': stockPosted
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        } else {
            console.warn(`⚠️ Không tìm thấy phần tử #${id}`);
        }
    });
    
    // Hiển thị container thống kê
    const statsContainer = document.getElementById('purchase-file-stats');
    if (statsContainer) {
        statsContainer.classList.remove('hidden');
    }
}



function showPurchaseSuccessMessage(results) {
    const message = `
✅ ĐÃ XỬ LÝ HÓA ĐƠN THÀNH CÔNG!

📊 Kết quả:
• 🎯 Thành công: ${results.processedCount} hóa đơn
• 🔄 Trùng lặp: ${results.duplicateCount} hóa đơn  
• 📦 Đã chuyển kho: ${results.stockPostedCount} hóa đơn
• ❌ Lỗi: ${results.errorCount} file

💡 Dữ liệu đã được cập nhật tự động vào:
• Danh sách hóa đơn mua hàng
• Tồn kho (nếu hợp lệ)
• Công nợ phải trả
• Sổ sách kế toán
    `;
    
    alert(message);
}



function loadPayableList() {
    const payableList = document.getElementById('payable-list');
    if (!payableList) {
        console.error('❌ Không tìm thấy danh sách công nợ');
        return;
    }

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        payableList.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">👈 Vui lòng chọn công ty</td></tr>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const invoices = hkd.invoices || [];
    
    // Tính toán công nợ theo nhà cung cấp
    const supplierDebt = {};
    
    invoices.forEach(invoice => {
        const supplierKey = invoice.sellerInfo.taxCode;
        if (!supplierDebt[supplierKey]) {
            supplierDebt[supplierKey] = {
                name: invoice.sellerInfo.name,
                taxCode: supplierKey,
                totalDebt: 0,
                paid: 0,
                remaining: 0
            };
        }
        
        supplierDebt[supplierKey].totalDebt += invoice.summary.calculatedTotal;
    });

    payableList.innerHTML = '';

    if (Object.keys(supplierDebt).length === 0) {
        payableList.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">💳 Chưa có công nợ phải trả</td></tr>';
        return;
    }

    console.log(`🏢 Đang tải ${Object.keys(supplierDebt).length} nhà cung cấp`);

    Object.values(supplierDebt).forEach((supplier, index) => {
        // Giả sử đã thanh toán 30% (trong thực tế sẽ lấy từ dữ liệu thanh toán)
        supplier.paid = supplier.totalDebt * 0.3;
        supplier.remaining = supplier.totalDebt - supplier.paid;

        const row = document.createElement('tr');
        const debtLevel = supplier.remaining > 0 ? 'table-warning' : '';
        
        row.className = debtLevel;
        row.innerHTML = `
            <td><strong>${supplier.name}</strong></td>
            <td><code>${supplier.taxCode}</code></td>
            <td style="text-align: right;">${window.formatCurrency(supplier.totalDebt)}</td>
            <td style="text-align: right;">${window.formatCurrency(supplier.paid)}</td>
            <td style="text-align: right; font-weight: bold;">${window.formatCurrency(supplier.remaining)}</td>
            <td>
                <div class="button-group-small">
                    <button class="btn-sm btn-primary" onclick="viewSupplierDetail('${supplier.taxCode}')">📊 Chi tiết</button>
                    ${supplier.remaining > 0 ? 
                      `<button class="btn-sm btn-success" onclick="makePayment('${supplier.taxCode}')">💳 Thanh toán</button>` : 
                      ''}
                </div>
            </td>
        `;
        
        payableList.appendChild(row);
    });
    
    console.log('✅ Đã tải danh sách công nợ');
}
function updateStockAfterPurchase(invoice) {
    if (!window.currentCompany || !window.hkdData) {
        console.error('❌ Chưa chọn công ty hoặc dữ liệu không tồn tại');
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    
    if (!hkd.tonkhoMain) {
        hkd.tonkhoMain = [];
    }

    // Thêm từng sản phẩm vào tồn kho
    invoice.products.forEach(product => {
        const existingProduct = hkd.tonkhoMain.find(p => p.msp === product.msp);
        
        if (existingProduct) {
            // Cập nhật số lượng tồn kho
            existingProduct.quantity = (parseFloat(existingProduct.quantity) || 0) + (parseFloat(product.quantity) || 0);
            existingProduct.amount = (parseFloat(existingProduct.amount) || 0) + (parseFloat(product.amount) || 0);
            
            // Cập nhật giá nhập mới nhất
            existingProduct.price = product.price;
        } else {
            // Thêm sản phẩm mới vào tồn kho
            hkd.tonkhoMain.push({
                msp: product.msp,
                name: product.name,
                unit: product.unit,
                quantity: product.quantity,
                price: product.price,
                amount: product.amount,
                source: 'PURCHASE',
                sourceInvoiceId: invoice.originalFileId,
                sourceInvoiceNumber: `${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}`,
                supplier: invoice.sellerInfo.name,
                importDate: invoice.invoiceInfo.date
            });
        }
    });

    console.log('📦 Đã cập nhật tồn kho sau mua hàng');
}


function createPurchaseReceipt(invoiceId) {
    if (!window.currentCompany) {
        alert('👈 Vui lòng chọn công ty trước.');
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === invoiceId);
    
    if (!invoice) {
        alert('❌ Không tìm thấy hóa đơn');
        return;
    }

    if (invoice.status && invoice.status.stockPosted) {
        alert('✅ Hóa đơn này đã được tạo phiếu nhập kho trước đó.');
        return;
    }

    // Tạo phiếu nhập kho
    const receipt = {
        id: `PN_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        invoiceId: invoiceId,
        invoiceNumber: `${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}`,
        supplier: invoice.sellerInfo.name,
        products: invoice.products.map(product => ({
            msp: product.msp,
            name: product.name,
            unit: product.unit,
            quantity: product.quantity,
            price: product.price,
            amount: product.amount
        })),
        totalAmount: invoice.summary.calculatedTotal
    };

    // Lưu phiếu nhập kho
    if (!hkd.purchaseReceipts) {
        hkd.purchaseReceipts = [];
    }
    hkd.purchaseReceipts.push(receipt);

    // Đánh dấu hóa đơn đã nhập kho
    if (!invoice.status) {
        invoice.status = {};
    }
    invoice.status.stockPosted = true;

    // Cập nhật tồn kho
    if (typeof window.updateStock === 'function') {
        window.updateStock(window.currentCompany, invoice);
    } else {
        // Fallback: tự cập nhật tồn kho
        updateStockAfterPurchase(invoice);
    }

    // Tạo bút toán kế toán
    createPurchaseAccountingEntry(invoice);

    alert(`✅ Đã tạo phiếu nhập kho ${receipt.id} thành công!\n\n📦 Sản phẩm đã được cập nhật vào tồn kho.`);
    
    // Cập nhật giao diện
    loadPurchaseInvoices();
    if (typeof window.renderStock === 'function') window.renderStock();
    
    // Lưu dữ liệu
    if (typeof window.saveData === 'function') {
        window.saveData();
    }
}



function createPurchaseAccountingEntry(invoice) {
    const hkd = window.hkdData[window.currentCompany];
    if (!hkd.accountingTransactions) {
        hkd.accountingTransactions = [];
    }

    const transactionId = `PUR_${Date.now()}`;
    const transactionDate = invoice.invoiceInfo.date;

    // Bút toán mua hàng
    hkd.accountingTransactions.push({
        id: transactionId,
        date: transactionDate,
        type: 'PURCHASE',
        account: '156',
        debit: invoice.summary.calculatedAmountAfterDiscount,
        credit: 0,
        description: `Mua hàng từ ${invoice.sellerInfo.name} - ${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}`,
        reference: invoice.originalFileId
    });

    hkd.accountingTransactions.push({
        id: transactionId,
        date: transactionDate,
        type: 'PURCHASE',
        account: '133',
        debit: invoice.summary.calculatedTax,
        credit: 0,
        description: `Thuế GTGT đầu vào - ${invoice.sellerInfo.name}`,
        reference: invoice.originalFileId
    });

    hkd.accountingTransactions.push({
        id: transactionId,
        date: transactionDate,
        type: 'PURCHASE',
        account: '331',
        debit: 0,
        credit: invoice.summary.calculatedTotal,
        description: `Phải trả ${invoice.sellerInfo.name}`,
        reference: invoice.originalFileId
    });
    
    console.log(`📒 Đã tạo bút toán mua hàng: ${transactionId}`);
}

// Các hàm phụ trợ khác
function viewSupplierDetail(taxCode) {
    alert(`📊 Chi tiết nhà cung cấp ${taxCode}\n\nChức năng đang được phát triển...`);
}

function makePayment(taxCode) {
    alert(`💳 Thanh toán cho nhà cung cấp ${taxCode}\n\nChức năng đang được phát triển...`);
}

// Hàm in ấn
function printPurchaseInvoices() {
    alert('🖨️ Chức năng in hóa đơn mua hàng đang được phát triển');
}

function printPurchaseReceipts() {
    alert('🖨️ Chức năng in phiếu nhập kho đang được phát triển');
}

function printPurchaseLedger() {
    alert('🖨️ Chức năng in sổ chi tiết mua hàng đang được phát triển');
}



// 🔥 THÊM HÀM FALLBACK ĐỂ HIỂN THỊ DANH SÁCH CÔNG TY
function renderCompanyListFallback() {
    const companyList = document.getElementById('company-list');
    if (!companyList) {
        console.error('❌ Không tìm thấy #company-list');
        return;
    }

    companyList.innerHTML = '';

    if (!window.hkdData || Object.keys(window.hkdData).length === 0) {
        companyList.innerHTML = '<div class="company-item no-company">📭 Chưa có công ty nào</div>';
        return;
    }

    const companies = Object.keys(window.hkdData).sort();
    
    companies.forEach(taxCode => {
        const company = window.hkdData[taxCode];
        const companyItem = document.createElement('div');
        companyItem.className = 'company-item';
        if (taxCode === window.currentCompany) {
            companyItem.classList.add('active');
        }
        
        // Tính tổng số lượng tồn kho
        const totalStock = Array.isArray(company.tonkhoMain) 
            ? company.tonkhoMain.reduce((sum, p) => sum + (p.quantity || 0), 0)
            : 0;

        companyItem.innerHTML = `
            <div class="company-name">${company.name || 'Chưa có tên'}</div>
            <div class="company-mst">MST: ${taxCode}</div>
            <div class="company-info">
                <small>🧾 HĐ: ${company.invoices?.length || 0} | 📦 Tồn kho: ${totalStock.toLocaleString('vi-VN')} SP</small>
            </div>
        `;

        companyItem.addEventListener('click', () => {
            if (typeof window.selectCompany === 'function') {
                window.selectCompany(taxCode);
            } else {
                // Fallback selection
                window.currentCompany = taxCode;
                updateCurrentCompanyDisplay();
                renderCompanyListFallback();
                loadPurchaseInvoices();
                loadPayableList();
            }
        });

        companyList.appendChild(companyItem);
    });
    
    console.log(`✅ Đã render ${companies.length} công ty`);
}
function loadPurchaseInvoices() {
    const invoiceList = document.getElementById('purchase-invoice-list');
    if (!invoiceList) {
        console.error('❌ Không tìm thấy danh sách hóa đơn');
        return;
    }

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        invoiceList.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">👈 Vui lòng chọn công ty</td></tr>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const invoices = hkd.invoices || [];

    invoiceList.innerHTML = '';

    if (invoices.length === 0) {
        invoiceList.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">📭 Chưa có hóa đơn mua hàng nào</td></tr>';
        return;
    }

    // Sắp xếp hóa đơn theo ngày (mới nhất trước)
    const sortedInvoices = [...invoices].sort((a, b) => 
        new Date(b.invoiceInfo.date) - new Date(a.invoiceInfo.date)
    );

    console.log(`📄 Đang tải ${sortedInvoices.length} hóa đơn`);

    sortedInvoices.forEach((invoice, index) => {
        const row = document.createElement('tr');
        
        // Xác định trạng thái
        let statusBadge = '';
        let statusClass = '';
        
        if (invoice.status && invoice.status.stockPosted) {
            statusBadge = '<span class="badge badge-success">✅ Đã nhập kho</span>';
            statusClass = 'table-success';
        } else if (invoice.status && invoice.status.validation === 'error') {
            statusBadge = '<span class="badge badge-danger">❌ Lỗi</span>';
            statusClass = 'table-danger';
        } else {
            statusBadge = '<span class="badge badge-warning">⚠️ Chưa xử lý</span>';
            statusClass = 'table-warning';
        }

        row.className = statusClass;
        row.innerHTML = `
            <td><strong>${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</strong></td>
            <td>${window.formatDate(invoice.invoiceInfo.date)}</td>
            <td>${invoice.sellerInfo.name}</td>
            <td><code>${invoice.sellerInfo.taxCode}</code></td>
            <td style="text-align: right;">${window.formatCurrency(invoice.summary.calculatedTotal)}</td>
            <td style="text-align: right;">${window.formatCurrency(invoice.summary.calculatedTax)}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="button-group-small">
                    <button class="btn-sm btn-info" onclick="viewPurchaseInvoiceDetail('${invoice.originalFileId}')">👁️ Xem</button>
                    ${(!invoice.status || !invoice.status.stockPosted) ? 
                      `<button class="btn-sm btn-primary" onclick="createPurchaseReceipt('${invoice.originalFileId}')">📦 Tạo PN</button>` : 
                      ''}
                </div>
            </td>
        `;
        
        invoiceList.appendChild(row);
    });
    
    console.log('✅ Đã tải danh sách hóa đơn');
}
// 🔥 THÊM HÀM CẬP NHẬT HIỂN THỊ CÔNG TY ĐANG CHỌN
function updateCurrentCompanyDisplay() {
    const currentCompanyElem = document.getElementById('current-company');
    if (currentCompanyElem && window.currentCompany && window.hkdData[window.currentCompany]) {
        const companyName = window.hkdData[window.currentCompany].name || window.currentCompany;
        currentCompanyElem.textContent = `Đang chọn: ${companyName} (MST: ${window.currentCompany})`;
    }
}

// 🔥 ĐẢM BẢO CÁC HÀM NÀY ĐƯỢC EXPORT
window.renderCompanyListFallback = renderCompanyListFallback;
window.updateCurrentCompanyDisplay = updateCurrentCompanyDisplay;
function printPurchaseInvoice(invoiceId) {
    alert(`🖨️ In hóa đơn ${invoiceId}\n\nChức năng đang được phát triển...`);
}

// Exports toàn cục
window.initMuaHangModule = initMuaHangModule;
window.loadPurchaseInvoices = loadPurchaseInvoices;
window.viewPurchaseInvoiceDetail = viewPurchaseInvoiceDetail;
window.createPurchaseReceipt = createPurchaseReceipt;
window.printPurchaseInvoices = printPurchaseInvoices;
window.printPurchaseReceipts = printPurchaseReceipts;
window.printPurchaseLedger = printPurchaseLedger;

// =======================
// HÀM CHỈNH SỬA HÓA ĐƠN (ĐÃ SỬA LỖI)
// =======================

// =======================
// HÀM CHỈNH SỬA HÓA ĐƠN (ĐÃ SỬA LỖI HIỂN THỊ)
// =======================
// THÊM HÀM KIỂM TRA MODAL (nếu chưa có)
function checkModalFunction() {
    console.log('🔍 Kiểm tra hàm modal:');
    console.log('- showModal:', typeof window.showModal);
    console.log('- closeModal:', typeof window.closeModal);
    
    if (typeof window.showModal !== 'function') {
        console.error('❌ Hàm showModal không tồn tại, đang thêm fallback...');
        
        // Fallback modal đơn giản
        window.showModal = function(title, content, size = '') {
            const modalHtml = `
                <div id="custom-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
                    <div style="background: white; padding: 20px; border-radius: 8px; max-width: 90%; max-height: 90%; overflow: auto; width: ${size === 'modal-xl' ? '1200px' : '800px'}">
                        <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 15px;">
                            <h3 style="margin: 0; flex: 1;">${title}</h3>
                            <button onclick="closeModal()" style="background: none; border: none; font-size: 20px; cursor: pointer;">❌</button>
                        </div>
                        <div>${content}</div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        };
        
        window.closeModal = function() {
            const modal = document.getElementById('custom-modal');
            if (modal) modal.remove();
        };
        
        console.log('✅ Đã thêm fallback modal');
    }
}



// Tính toán tổng thanh toán
function calculateTotalPayment() {
    const totalAmountInput = document.getElementById('edit-total-amount');
    const taxAmountInput = document.getElementById('edit-tax-amount');
    const totalPaymentInput = document.getElementById('edit-total-payment');
    
    if (!totalAmountInput || !taxAmountInput || !totalPaymentInput) {
        console.warn('⚠️ Không tìm thấy phần tử input để tính toán');
        return;
    }
    
    const totalAmount = parseFloat(totalAmountInput.value) || 0;
    const taxAmount = parseFloat(taxAmountInput.value) || 0;
    const totalPayment = totalAmount + taxAmount;
    
    totalPaymentInput.value = totalPayment.toFixed(2);
}



// Xóa sản phẩm
function removeProduct(invoiceId, productIndex) {
    if (!confirm('❌ Bạn có chắc muốn xóa sản phẩm này?')) {
        return;
    }
    
    if (!window.currentCompany || !window.hkdData) {
        console.error('❌ Chưa chọn công ty hoặc dữ liệu không tồn tại');
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === invoiceId);
    
    if (invoice && invoice.products[productIndex]) {
        invoice.products.splice(productIndex, 1);
        
        // Cập nhật lại STT
        invoice.products.forEach((product, index) => {
            product.stt = index + 1;
        });
        
        // Đóng và mở lại popup để refresh dữ liệu
        closeModal();
        setTimeout(() => {
            editPurchaseInvoice(invoiceId);
        }, 100);
        
        console.log(`✅ Đã xóa sản phẩm ${productIndex}`);
    }
}



// Lưu thay đổi hóa đơn
function saveInvoiceChanges(invoiceId) {
    if (!window.currentCompany || !window.hkdData) {
        alert('❌ Chưa chọn công ty hoặc dữ liệu không tồn tại');
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === invoiceId);
    
    if (!invoice) {
        alert('❌ Không tìm thấy hóa đơn');
        return;
    }

    // Cập nhật thông tin cơ bản
    const invoiceNumberInput = document.getElementById('edit-invoice-number');
    const invoiceDateInput = document.getElementById('edit-invoice-date');
    const supplierNameInput = document.getElementById('edit-supplier-name');
    const supplierTaxCodeInput = document.getElementById('edit-supplier-taxcode');
    
    if (invoiceNumberInput) {
        const invoiceNumber = invoiceNumberInput.value;
        const numberParts = invoiceNumber.split('/');
        if (numberParts.length === 2) {
            invoice.invoiceInfo.symbol = numberParts[0];
            invoice.invoiceInfo.number = numberParts[1];
        }
    }
    
    if (invoiceDateInput) {
        invoice.invoiceInfo.date = invoiceDateInput.value;
    }
    
    if (supplierNameInput) {
        invoice.sellerInfo.name = supplierNameInput.value;
    }
    
    if (supplierTaxCodeInput) {
        invoice.sellerInfo.taxCode = supplierTaxCodeInput.value;
    }
    
    // Cập nhật tổng hợp
    const totalAmountInput = document.getElementById('edit-total-amount');
    const taxAmountInput = document.getElementById('edit-tax-amount');
    const totalPaymentInput = document.getElementById('edit-total-payment');
    
    if (totalAmountInput) {
        invoice.summary.calculatedAmountAfterDiscount = parseFloat(totalAmountInput.value) || 0;
    }
    
    if (taxAmountInput) {
        invoice.summary.calculatedTax = parseFloat(taxAmountInput.value) || 0;
    }
    
    if (totalPaymentInput) {
        invoice.summary.calculatedTotal = parseFloat(totalPaymentInput.value) || 0;
    }

    // Cập nhật tồn kho nếu hóa đơn đã được nhập kho
    if (invoice.status && invoice.status.stockPosted) {
        updateStockAfterInvoiceEdit(invoice);
    }

    // Lưu dữ liệu
    if (typeof window.saveData === 'function') {
        window.saveData();
    }

    // Đóng popup
    closeModal();
    
    // Cập nhật giao diện
    loadPurchaseInvoices();
    if (typeof window.renderStock === 'function') window.renderStock();
    
    alert('✅ Đã lưu thay đổi thành công!');
    console.log('💾 Đã lưu thay đổi hóa đơn:', invoiceId);
}

// Cập nhật tồn kho sau khi chỉnh sửa hóa đơn
function updateStockAfterInvoiceEdit(updatedInvoice) {
    if (!window.currentCompany || !window.hkdData) {
        console.error('❌ Chưa chọn công ty hoặc dữ liệu không tồn tại');
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    
    if (!hkd.tonkhoMain) {
        hkd.tonkhoMain = [];
    }

    // Xóa các sản phẩm cũ của hóa đơn này khỏi tồn kho
    hkd.tonkhoMain = hkd.tonkhoMain.filter(item => 
        !item.sourceInvoiceId || item.sourceInvoiceId !== updatedInvoice.originalFileId
    );

    // Thêm lại các sản phẩm mới vào tồn kho
    updatedInvoice.products.forEach(product => {
        const existingProduct = hkd.tonkhoMain.find(p => 
            p.msp === product.msp && p.sourceInvoiceId === updatedInvoice.originalFileId
        );

        if (existingProduct) {
            // Cập nhật sản phẩm tồn tại
            existingProduct.quantity = product.quantity;
            existingProduct.price = product.price;
            existingProduct.amount = product.amount;
            existingProduct.name = product.name;
            existingProduct.unit = product.unit;
        } else {
            // Thêm sản phẩm mới
            hkd.tonkhoMain.push({
                msp: product.msp,
                name: product.name,
                unit: product.unit,
                quantity: product.quantity,
                price: product.price,
                amount: product.amount,
                source: 'PURCHASE',
                sourceInvoiceId: updatedInvoice.originalFileId,
                sourceInvoiceNumber: `${updatedInvoice.invoiceInfo.symbol}/${updatedInvoice.invoiceInfo.number}`,
                supplier: updatedInvoice.sellerInfo.name,
                importDate: updatedInvoice.invoiceInfo.date
            });
        }
    });

    console.log('📦 Đã cập nhật tồn kho sau chỉnh sửa hóa đơn');
}


// =======================
// THÊM CSS CHO POPUP CHỈNH SỬA
// =======================

function addEditModalStyles() {
    const styles = `
        <style>
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            font-weight: bold;
            margin-bottom: 5px;
            display: block;
        }
        
        .form-control {
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 8px 12px;
            width: 100%;
        }
        
        .form-control-sm {
            padding: 4px 8px;
            font-size: 12px;
        }
        
        .button-group-small .btn-sm {
            margin: 2px;
            padding: 4px 8px;
            font-size: 12px;
        }
        
        .table input.form-control-sm {
            border: 1px solid #ccc;
        }
        
        .table input.form-control-sm:focus {
            border-color: #007bff;
            box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
        }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
}



// Export các hàm mới
window.editPurchaseInvoice = editPurchaseInvoice;
window.updateProductField = updateProductField;
window.removeProduct = removeProduct;
window.addNewProduct = addNewProduct;
window.saveInvoiceChanges = saveInvoiceChanges;
window.calculateTotalPayment = calculateTotalPayment;
// Export toàn cục các hàm mới
window.processPurchaseInvoices = processPurchaseInvoices;
window.updateStockAfterPurchase = updateStockAfterPurchase;
window.updateStockAfterInvoiceEdit = updateStockAfterInvoiceEdit;
window.debugCompanyData = debugCompanyData;

// Gọi khởi tạo khi load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initMuaHangModule, 1000); // Delay để đảm bảo DOM đã sẵn sàng
});