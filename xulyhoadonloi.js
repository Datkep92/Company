// File: popup-sua-hoadon.js
// Popup chỉnh sửa hóa đơn dùng chung cho cả 2 chế độ

// =======================
// POPUP CHỈNH SỬA HÓA ĐƠN DÙNG CHUNG
// =======================
function showFixInvoicePopup(invoiceId) {
    if (!window.currentCompany) {
        alert('Vui lòng chọn công ty.');
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === invoiceId);
    
    if (!invoice) {
        alert('Không tìm thấy hóa đơn.');
        return;
    }
    
    console.log('🛠️ Mở popup chỉnh sửa hóa đơn:', invoice.invoiceInfo.symbol + '/' + invoice.invoiceInfo.number);
    
    // Tạo popup chỉnh sửa
    createFixInvoicePopup(invoice);
}

// =======================
// TẠO GIAO DIỆN POPUP CHỈNH SỬA
// =======================
function createFixInvoicePopup(invoice) {
    const popupContent = `
        <div class="fix-invoice-popup">
            <div class="popup-header">
                <h3>🛠️ Chỉnh Sửa Hóa Đơn</h3>
                <p><strong>Hóa đơn:</strong> ${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</p>
                <p><strong>Nhà cung cấp:</strong> ${invoice.sellerInfo.name}</p>
                <p><strong>Chênh lệch hiện tại:</strong> <span style="color: #dc3545; font-weight: bold;">${formatCurrency(invoice.status.difference)}</span></p>
            </div>
            
            <div class="popup-body">
                <div class="invoice-preview">
                    <h4>📄 Xem Trước Hóa Đơn</h4>
                    <div class="preview-content">
                        ${invoice.htmlUrl ? 
                            `<iframe src="${invoice.htmlUrl}" width="100%" height="300" style="border: 1px solid #ddd; border-radius: 4px;"></iframe>` :
                            `<div style="padding: 20px; text-align: center; background: #f8f9fa; border-radius: 4px;">
                                <p>Không có bản xem HTML</p>
                                <p><strong>${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</strong></p>
                                <p>Ngày: ${formatDate(invoice.invoiceInfo.date)}</p>
                                <p>Tổng tiền: ${formatCurrency(invoice.summary.totalAfterTax)}</p>
                            </div>`
                        }
                    </div>
                </div>
                
                <div class="edit-section">
                    <h4>✏️ Chỉnh Sửa Chi Tiết</h4>
                    <div class="edit-table-container">
                        <table class="table edit-table">
                            <thead>
                                <tr>
                                    <th>STT</th>
                                    <th>Tên SP</th>
                                    <th>ĐVT</th>
                                    <th>SL</th>
                                    <th>Đơn giá</th>
                                    <th>Chiết khấu</th>
                                    <th>Thuế (%)</th>
                                    <th>Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody id="edit-products-body">
                                ${renderEditProducts(invoice.products)}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="summary-section">
                    <div class="summary-card">
                        <h5>💰 Tổng Hợp Thanh Toán</h5>
                        <table class="summary-table">
                            <tr>
                                <td>Tổng trước thuế:</td>
                                <td id="edit-total-before-tax">${formatCurrency(invoice.summary.calculatedAmountAfterDiscount)}</td>
                            </tr>
                            <tr>
                                <td>Thuế GTGT:</td>
                                <td id="edit-total-tax">${formatCurrency(invoice.summary.calculatedTax)}</td>
                            </tr>
                            <tr class="total-row">
                                <td><strong>Tổng thanh toán:</strong></td>
                                <td id="edit-total-amount"><strong>${formatCurrency(invoice.summary.calculatedTotal)}</strong></td>
                            </tr>
                            <tr>
                                <td>Chênh lệch:</td>
                                <td id="edit-difference" style="color: ${invoice.status.difference === 0 ? 'green' : '#dc3545'}; font-weight: bold;">
                                    ${formatCurrency(invoice.status.difference)}
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <div class="tools-section">
                        <h5>🛠️ Công Cụ Hỗ Trợ</h5>
                        <div class="tool-buttons">
                            <button type="button" class="btn-secondary" onclick="recalculateInvoice()">
                                🔄 Tính Lại Tự Động
                            </button>
                            <button type="button" class="btn-secondary" onclick="roundTaxAmounts()">
                                🎯 Làm Tròn Thuế
                            </button>
                            <button type="button" class="btn-secondary" onclick="distributeDifference()">
                                📊 Phân Bổ Chênh Lệch
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="popup-actions">
                <button type="button" class="btn-success" onclick="saveFixedInvoice('${invoice.originalFileId}')">
                    💾 Lưu Chỉnh Sửa & Nhập Kho
                </button>
                <button type="button" class="btn-warning" onclick="testCalculation()">
                    🧪 Test Tính Toán
                </button>
                <button type="button" class="btn-secondary" onclick="closeFixPopup()">
                    ❌ Hủy
                </button>
            </div>
        </div>
    `;
    
    // Hiển thị popup
    showLargeModal('Chỉnh Sửa Hóa Đơn', popupContent);
}

// =======================
// RENDER BẢNG CHỈNH SỬA SẢN PHẨM
// =======================
function renderEditProducts(products) {
    return products.map((product, index) => `
        <tr class="edit-product-row" data-index="${index}">
            <td>${product.stt}</td>
            <td title="${product.name}" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;">
                ${product.name}
            </td>
            <td>${product.unit}</td>
            <td>
                <input type="number" class="edit-quantity" value="${product.quantity}" 
                       data-index="${index}" step="0.001" style="width: 80px;">
            </td>
            <td>
                <input type="number" class="edit-price" value="${product.price}" 
                       data-index="${index}" step="1" style="width: 100px;">
            </td>
            <td>
                <input type="number" class="edit-discount" value="${accountingRound(product.discount)}" 
                       data-index="${index}" step="1" style="width: 80px;">
            </td>
            <td>
                <input type="number" class="edit-tax-rate" value="${product.taxRate}" 
                       data-index="${index}" step="1" min="0" max="100" style="width: 60px;">
                <div class="tax-adjust-buttons">
                    <button type="button" class="btn-tax-adjust" data-index="${index}" data-adjust="-1">-1%</button>
                    <button type="button" class="btn-tax-adjust" data-index="${index}" data-adjust="+1">+1%</button>
                </div>
            </td>
            <td>
                <input type="number" class="edit-amount" value="${accountingRound(product.amount)}" 
                       data-index="${index}" step="1" style="width: 120px;">
                <div class="amount-difference" data-index="${index}" style="font-size: 10px; color: #666;"></div>
            </td>
        </tr>
    `).join('');
}

// =======================
// HÀM TÍNH TOÁN LẠI
// =======================
function recalculateInvoice() {
    console.log('🔄 Tính lại toàn bộ hóa đơn...');
    
    // Lấy tất cả dòng sản phẩm
    const productRows = document.querySelectorAll('.edit-product-row');
    
    productRows.forEach(row => {
        const index = row.getAttribute('data-index');
        const quantity = parseFloat(document.querySelector(`.edit-quantity[data-index="${index}"]`).value) || 0;
        const price = parseFloat(document.querySelector(`.edit-price[data-index="${index}"]`).value) || 0;
        const discount = parseFloat(document.querySelector(`.edit-discount[data-index="${index}"]`).value) || 0;
        
        // Tính toán lại thành tiền
        const amountWithoutTax = accountingRound(quantity * price);
        const amountAfterDiscount = accountingRound(amountWithoutTax - discount);
        
        // Cập nhật giá trị
        document.querySelector(`.edit-amount[data-index="${index}"]`).value = amountAfterDiscount;
    });
    
    // Tính toán lại tổng
    updateInvoiceSummary();
}

// =======================
// CẬP NHẬT TỔNG HỢP
// =======================
function updateInvoiceSummary() {
    let totalAmountBeforeTax = 0;
    let totalDiscount = 0;
    let totalAmountAfterDiscount = 0;
    let totalTax = 0;
    
    // Tính tổng từng dòng
    document.querySelectorAll('.edit-product-row').forEach(row => {
        const index = row.getAttribute('data-index');
        const quantity = parseFloat(document.querySelector(`.edit-quantity[data-index="${index}"]`).value) || 0;
        const price = parseFloat(document.querySelector(`.edit-price[data-index="${index}"]`).value) || 0;
        const discount = parseFloat(document.querySelector(`.edit-discount[data-index="${index}"]`).value) || 0;
        const amount = parseFloat(document.querySelector(`.edit-amount[data-index="${index}"]`).value) || 0;
        const taxRate = parseFloat(document.querySelector(`.edit-tax-rate[data-index="${index}"]`).value) || 0;
        
        const amountWithoutTax = accountingRound(quantity * price);
        const taxAmount = accountingRound(amount * taxRate / 100);
        
        totalAmountBeforeTax += amountWithoutTax;
        totalDiscount += discount;
        totalAmountAfterDiscount += amount;
        totalTax += taxAmount;
    });
    
    const totalAmount = accountingRound(totalAmountAfterDiscount + totalTax);
    
    // Cập nhật UI
    document.getElementById('edit-total-before-tax').textContent = formatCurrency(totalAmountAfterDiscount);
    document.getElementById('edit-total-tax').textContent = formatCurrency(totalTax);
    document.getElementById('edit-total-amount').textContent = formatCurrency(totalAmount);
    
    // TODO: So sánh với tổng gốc và tính chênh lệch
    // document.getElementById('edit-difference').textContent = formatCurrency(difference);
}

// =======================
// LÀM TRÒN THUẾ
// =======================
function roundTaxAmounts() {
    console.log('🎯 Làm tròn thuế...');
    alert('Chức năng làm tròn thuế đang được phát triển...');
}

// =======================
// PHÂN BỔ CHÊNH LỆCH
// =======================
function distributeDifference() {
    console.log('📊 Phân bổ chênh lệch...');
    alert('Chức năng phân bổ chênh lệch đang được phát triển...');
}

// =======================
// LƯU HÓA ĐƠN ĐÃ CHỈNH SỬA
// =======================
function saveFixedInvoice(invoiceId) {
    if (!window.currentCompany) {
        alert('Vui lòng chọn công ty.');
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === invoiceId);
    
    if (!invoice) {
        alert('Không tìm thấy hóa đơn.');
        return;
    }
    
    console.log('💾 Lưu hóa đơn đã chỉnh sửa:', invoice.invoiceInfo.symbol + '/' + invoice.invoiceInfo.number);
    
    // TODO: Cập nhật dữ liệu hóa đơn từ form
    // TODO: Kiểm tra chênh lệch
    // TODO: Cập nhật tồn kho
    // TODO: Cập nhật kế toán
    
    alert('✅ Đã lưu chỉnh sửa hóa đơn!\n\nChức năng đầy đủ đang được hoàn thiện...');
    closeFixPopup();
    
    // Cập nhật giao diện
    if (typeof loadErrorInvoices === 'function') {
        loadErrorInvoices();
    }
    if (typeof loadPurchaseInvoices === 'function') {
        loadPurchaseInvoices();
    }
}

// =======================
// HÀM TEST TÍNH TOÁN
// =======================
function testCalculation() {
    console.log('🧪 Test tính toán...');
    recalculateInvoice();
    alert('Đã test tính toán tự động!');
}

// =======================
// ĐÓNG POPUP
// =======================
function closeFixPopup() {
    const modal = document.getElementById('custom-modal');
    if (modal) {
        modal.remove();
    }
}

// =======================
// MODAL LỚN CHO POPUP CHỈNH SỬA
// =======================
function showLargeModal(title, content) {
    const modal = document.createElement('div');
    modal.id = 'custom-modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content large-modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <span class="close" onclick="closeFixPopup()">&times;</span>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// =======================
// EXPORTS
// =======================
window.showFixInvoicePopup = showFixInvoicePopup;
window.recalculateInvoice = recalculateInvoice;
window.roundTaxAmounts = roundTaxAmounts;
window.distributeDifference = distributeDifference;
window.saveFixedInvoice = saveFixedInvoice;
window.testCalculation = testCalculation;
window.closeFixPopup = closeFixPopup;

// Kiểm tra dữ liệu
console.log('🔍 KIỂM TRA DỮ LIỆU:');
console.log('- currentCompany:', window.currentCompany);
console.log('- hkdData:', window.hkdData);

if (window.currentCompany && window.hkdData[window.currentCompany]) {
    const company = window.hkdData[window.currentCompany];
    console.log('- Tổng HĐ:', company.invoices.length);
    
    const errorInvoices = company.invoices.filter(inv => 
        inv.status && !inv.status.stockPosted
    );
    console.log('- HĐ lỗi:', errorInvoices.length);
    errorInvoices.forEach(inv => {
        console.log(`  - ${inv.invoiceInfo.symbol}/${inv.invoiceInfo.number}:`, inv.status);
    });
}

// Test load lại
if (typeof loadErrorInvoices === 'function') {
    loadErrorInvoices();
}