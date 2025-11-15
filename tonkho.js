// File: tonkho.js (Phiên bản Hoàn thiện & Khắc phục lỗi Tham Chiếu V2)

// =======================================================
// UTILITIES (Các hàm tiện ích)
// =======================================================

function accountingRound(amount) {
    return window.accountingRound ? window.accountingRound(amount) : Math.round(amount);
}

function formatCurrency(amount) {
    return window.formatCurrency ? window.formatCurrency(amount) : amount.toLocaleString('vi-VN');
}

function getProductClassification(category) {
    const classifications = {
        'hang_hoa': 'Hàng hóa',
        'chiet_khau': 'Chiết khấu',
        'khuyen_mai': 'Khuyến mãi',
        'dich_vu': 'Dịch vụ'
    };
    return classifications[category] || 'Hàng hóa';
}

function getClassificationBadgeClass(category) {
    const classes = {
        'hang_hoa': 'badge-primary',
        'chiet_khau': 'badge-warning',
        'khuyen_mai': 'badge-info',
        'dich_vu': 'badge-secondary'
    };
    return classes[category] || 'badge-secondary';
}

/**
 * Hàm tiện ích: Tổng hợp tồn kho hiện tại theo MSP
 */
function getAggregatedStock() {
    if (!window.hkdData || !window.currentCompany) return {};
    const hkd = hkdData[window.currentCompany];
    const aggregatedStock = {};

    (hkd.tonkhoMain || []).forEach(product => {
        const productCategory = product.category || 'hang_hoa';
        if (!aggregatedStock[product.msp]) {
            aggregatedStock[product.msp] = {
                msp: product.msp,
                name: product.name,
                unit: product.unit,
                quantity: 0,
                totalAmount: 0,
                category: productCategory,
                avgPrice: 0
            };
        }

        if (productCategory === 'hang_hoa' || productCategory === 'dich_vu') {
            aggregatedStock[product.msp].quantity += parseFloat(product.quantity);
            aggregatedStock[product.msp].totalAmount += parseFloat(product.amount);
        }
    });

    Object.values(aggregatedStock).forEach(product => {
        if (product.quantity > 0 && product.category === 'hang_hoa') {
            product.avgPrice = Math.abs(product.totalAmount) / product.quantity;
        } else {
            product.avgPrice = 0;
        }
    });

    return aggregatedStock;
}

// =======================================================
// HÀM XỬ LÝ NGHIỆP VỤ KHO
// =======================================================

/**
 * HIỂN THỊ MODAL ĐIỀU CHỈNH TỒN KHO
 */
function showEditStockModal(msp) {
    const stockMap = getAggregatedStock();
    const product = stockMap[msp];

    if (!product) {
        alert('Không tìm thấy sản phẩm này.');
        return;
    }

    const modalContent = `
        <p><strong>MSP:</strong> ${product.msp} - <strong>Tên:</strong> ${product.name}</p>
        <p><strong>Tồn kho hiện tại:</strong> ${product.quantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} ${product.unit}</p>
        <p><strong>Giá trị vốn hiện tại:</strong> ${formatCurrency(product.totalAmount)}</p>
        <hr/>
        
        <div class="form-group">
            <label for="adjustment-date">Ngày Điều Chỉnh:</label>
            <input type="date" id="adjustment-date" class="form-control" value="${new Date().toISOString().substring(0, 10)}">
        </div>
        
        <div class="form-group">
            <label for="new-quantity">Số Lượng Sau Điều Chỉnh:</label>
            <input type="number" id="new-quantity" class="form-control" value="${product.quantity.toFixed(2)}" step="0.01">
        </div>
        
        <div class="form-group">
            <label for="new-unit-price">Đơn Giá Vốn Mới (Nếu có thay đổi):</label>
            <input type="number" id="new-unit-price" class="form-control" value="${product.avgPrice.toFixed(0)}" step="1">
        </div>

        <div class="form-group">
            <label for="adjustment-reason">Lý Do Điều Chỉnh:</label>
            <textarea id="adjustment-reason" class="form-control" placeholder="Kiểm kê thừa/thiếu, Hỏng hóc..."></textarea>
        </div>
        
        <div style="text-align: right; margin-top: 20px;">
            <button id="confirm-adjustment" class="btn-success">Xác Nhận Điều Chỉnh</button>
            <button class="btn-secondary" onclick="document.getElementById('custom-modal').style.display = 'none'">Hủy</button>
        </div>
    `;

    window.showModal(`Điều Chỉnh Tồn Kho: ${product.msp}`, modalContent);

    document.getElementById('confirm-adjustment').addEventListener('click', function() {
        const newQuantity = parseFloat(document.getElementById('new-quantity').value);
        const newUnitPrice = parseFloat(document.getElementById('new-unit-price').value);
        const reason = document.getElementById('adjustment-reason').value;
        const date = document.getElementById('adjustment-date').value;

        if (isNaN(newQuantity) || newQuantity < 0 || !reason) {
            alert('Vui lòng nhập số lượng hợp lệ và lý do điều chỉnh.');
            return;
        }

        processStockAdjustment(product, newQuantity, newUnitPrice, reason, date);

        document.getElementById('custom-modal').style.display = 'none';
    });
}

/**
 * XỬ LÝ LOGIC ĐIỀU CHỈNH TỒN KHO & LIÊN KẾT KẾ TOÁN
 */
function processStockAdjustment(product, newQuantity, newUnitPrice, reason, date) {
    const hkd = hkdData[window.currentCompany];
    
    const currentQuantity = product.quantity;
    const currentTotalAmount = product.totalAmount;
    
    const newTotalAmount = accountingRound(newQuantity * newUnitPrice); 
    
    const quantityDifference = newQuantity - currentQuantity;
    const amountDifference = newTotalAmount - currentTotalAmount;

    if (quantityDifference === 0 && amountDifference === 0) {
        alert('Không có thay đổi nào để ghi nhận.');
        return;
    }

    const adjustmentEntry = {
        id: `ADJ_${Date.now()}`, 
        type: 'ADJUSTMENT',
        date: date,
        description: `Điều chỉnh tồn kho: ${reason}`,
        msp: product.msp,
        name: product.name,
        unit: product.unit,
        category: product.category,
        
        quantity: quantityDifference, 
        amount: amountDifference,
        price: newUnitPrice 
    };
    
    hkd.tonkhoMain.push(adjustmentEntry);
    
    // Tích hợp Kế toán (cần triển khai trong ketoan.js)
    if (typeof window.integrateStockAdjustment === 'function') {
        window.integrateStockAdjustment(adjustmentEntry); 
    } else {
        if (typeof window.showToast === 'function') {
            window.showToast('Chưa tích hợp bút toán điều chỉnh kế toán (TK 156 vs TK 711/632).', 5000, 'warning');
        }
    }
    
    renderStock();
    window.saveAccountingData(); 
    alert(`Đã ghi nhận điều chỉnh cho ${product.msp}: Số lượng thay đổi ${quantityDifference.toFixed(2)}, Giá trị thay đổi ${formatCurrency(amountDifference)}.`);
}

// File: tonkho.js

/**
 * XEM CHI TIẾT THẺ KHO (STOCK CARD) - ĐÃ LOẠI BỎ ID DÒNG
 */
function showStockDetail(msp) {
    if (!window.currentCompany) return;
    const hkd = hkdData[window.currentCompany];

    // Lấy tất cả giao dịch liên quan: Hóa đơn (Nhập), Xuất hàng, Điều chỉnh
    const transactions = [];

    // --- Hàm tiện ích truy vấn tham chiếu chính xác (Giữ nguyên) ---
    function getInvoiceReference(inv) {
        if (inv.invoiceInfo) {
            const symbol = inv.invoiceInfo.symbol || '';
            const number = inv.invoiceInfo.number || '';
            if (symbol && number) return `${symbol}/${number}`;
            if (number) return number;
        }
        const ref = inv.invNumber || inv.invoiceNumber || inv.soHDon || inv.id;
        return ref || 'Không rõ số HD';
    }

    function getInvoiceDate(inv) {
        if (inv.invoiceInfo && inv.invoiceInfo.date) {
            return inv.invoiceInfo.date;
        }
        const date = inv.date || inv.transactionDate || inv.tDate;
        return date || new Date().toISOString().substring(0, 10);
    }
    // ----------------------------------------------------

    // Giao dịch Nhập (Từ Hóa đơn)
    (hkd.invoices || []).forEach(invoice => {
        
        const invDate = getInvoiceDate(invoice);
        const invRef = getInvoiceReference(invoice);
        
        invoice.products.filter(p => p.msp === msp && p.category === 'hang_hoa').forEach(item => {
            
            const unitPrice = parseFloat(item.quantity) !== 0 ? item.amount / parseFloat(item.quantity) : 0;
            
            transactions.push({
                date: invDate, 
                type: 'NHẬP',
                reference: `HD ${invRef}`, 
                quantity: parseFloat(item.quantity),
                unitPrice: unitPrice,
                amount: item.amount,
                source: 'hoadon'
                // LOẠI BỎ: lineId: item.lineId || 'N/A' 
            });
        });
    });

    // Giao dịch Xuất (Từ Phiếu xuất)
    (hkd.exports || []).forEach(exp => {
        exp.products.filter(p => p.msp === msp).forEach(item => {
            transactions.push({
                date: exp.date || new Date().toISOString().substring(0, 10),
                type: 'XUẤT',
                reference: `PX ${item.id || exp.id || 'N/A'}`,
                quantity: -parseFloat(item.quantity), 
                unitPrice: item.price, 
                amount: -item.amount, 
                source: 'xuathang'
            });
        });
    });
    
    // Giao dịch Điều chỉnh (Từ tonkhoMain)
    (hkd.tonkhoMain || []).filter(p => p.msp === msp && p.type === 'ADJUSTMENT').forEach(adj => {
         transactions.push({
            date: adj.date || new Date().toISOString().substring(0, 10),
            type: 'ĐIỀU CHỈNH',
            reference: adj.description || adj.id,
            quantity: adj.quantity,
            unitPrice: adj.price, 
            amount: adj.amount,
            source: 'tonkho'
        });
    });

    // Sắp xếp theo ngày
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Bảng chi tiết
    let detailHtml = `
        <h5 style="margin-bottom: 15px;">Thẻ Kho (Stock Card) - MSP: ${msp}</h5>
        <table class="table report-table">
            <thead>
                <tr>
                    <th>Ngày</th>
                    <th>Nghiệp Vụ</th>
                    <th>Tham Chiếu</th>
                    <th>SL Nhập</th>
                    <th>SL Xuất</th>
                    <th>Đơn Giá Vốn</th>
                    <th>Giá Trị Vốn</th>
                    <th>Tồn Cuối SL</th>
                    <th>Tồn Cuối Giá Trị</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    let runningQuantity = 0;
    let runningAmount = 0;

    transactions.forEach(tx => {
        const dateDisplay = window.formatDate ? window.formatDate(tx.date) : new Date(tx.date).toLocaleDateString('vi-VN');
        const displayDate = dateDisplay.includes('2000') ? 'N/A' : dateDisplay;

        const quantityIn = tx.quantity > 0 && tx.type !== 'XUẤT' ? tx.quantity : 0;
        const quantityOut = tx.quantity < 0 || tx.type === 'XUẤT' ? Math.abs(tx.quantity) : 0;
        const absAmount = Math.abs(tx.amount); 

        runningQuantity += tx.quantity;
        runningAmount += tx.amount;

        detailHtml += `
            <tr>
                <td>${displayDate}</td>
                <td>${tx.type}</td>
                <td>${tx.reference}</td>
                <td style="text-align: right;">${quantityIn.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
                <td style="text-align: right;">${quantityOut.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
                <td style="text-align: right;">${formatCurrency(tx.unitPrice)}</td>
                <td style="text-align: right;">${formatCurrency(absAmount)}</td>
                <td style="text-align: right; font-weight: bold;">${runningQuantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
                <td style="text-align: right; font-weight: bold;">${formatCurrency(runningAmount)}</td>
            </tr>
        `;
    });

    detailHtml += `
            </tbody>
        </table>
    `;

    window.showModal(`Chi Tiết Tồn Kho: ${msp}`, detailHtml, 'modal-lg');
}

// =======================================================
// CORE RENDER FUNCTIONS (Giữ nguyên)
// =======================================================

function initStockModule() {
    const searchInput = document.getElementById('search-stock');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            renderStock(e.target.value);
        });
    }

    const filterButtons = document.querySelectorAll('.stock-filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const filterType = this.getAttribute('data-filter');
            renderStock('', filterType);
            
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function updateStockStats() {
    const statsContainer = document.getElementById('stock-stats');
    if (!statsContainer || !window.currentCompany || !window.hkdData[window.currentCompany]) return;

    // SỬA LỖI: Gọi hàm getAggregatedStock() không có tham số
    const aggregatedStock = getAggregatedStock();
    
    let totalQuantity = 0;
    let totalProducts = 0;
    let totalValue = 0;

    Object.values(aggregatedStock).forEach(product => {
        if (product.category === 'hang_hoa' && product.quantity > 0) { 
            totalQuantity += product.quantity;
            totalValue += product.totalAmount;
            totalProducts++;
        }
    });

    statsContainer.innerHTML = `
        <div class="stats-grid-stock">
            <div class="stat-card-stock">
                <div class="stat-icon">📦</div>
                <div class="stat-value-stock">${totalQuantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</div>
                <div class="stat-label-stock">Tổng số lượng (HH)</div>
            </div>
            <div class="stat-card-stock">
                <div class="stat-icon">🏷️</div>
                <div class="stat-value-stock">${totalProducts}</div>
                <div class="stat-label-stock">Tổng mặt hàng (HH)</div>
            </div>
            <div class="stat-card-stock">
                <div class="stat-icon">💰</div>
                <div class="stat-value-stock">${formatCurrency(totalValue)}</div>
                <div class="stat-label-stock">Tổng giá trị (HH)</div>
            </div>
        </div>
    `;
}

function renderStock(searchTerm = '', filterType = 'all') {
    const stockList = document.getElementById('stock-list');
    if (!stockList) return;

    if (!window.hkdData || !window.currentCompany) {
        stockList.innerHTML = '<tr><td colspan="15" style="text-align: center;">Vui lòng chọn công ty</td></tr>';
        return;
    }

    stockList.innerHTML = '';
    
    const hkd = hkdData[window.currentCompany];
    let productCount = 0;
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    updateStockStats();
    
    const aggregatedStock = {};
    
    // Bước 1: Tổng hợp dữ liệu từ tonkhoMain
    hkd.tonkhoMain.forEach(product => {
        const currentQuantity = Math.abs(parseFloat(product.quantity)); 
        
        if (currentQuantity === 0 && product.category !== 'chiet_khau') return; 

        const productCategory = product.category || 'hang_hoa'; 

        if (filterType === 'ck' && productCategory !== 'chiet_khau') return;
        if (filterType === 'km' && productCategory !== 'khuyen_mai') return;
        if (filterType === 'normal' && productCategory !== 'hang_hoa') return;
        
        if (!aggregatedStock[product.msp]) {
            aggregatedStock[product.msp] = {
                msp: product.msp,
                name: product.name,
                unit: product.unit,
                quantity: 0,
                totalAmount: 0,
                totalDiscount: 0,
                avgPrice: 0,
                category: productCategory, 
                classification: product.classification || getProductClassification(productCategory),
                discountRate: 0 
            };
        }
        
        if (productCategory === 'hang_hoa') {
            aggregatedStock[product.msp].quantity += parseFloat(product.quantity);
        }
        
        // Luôn cộng dồn giá trị (kể cả CK/KM)
        aggregatedStock[product.msp].totalAmount += parseFloat(product.amount);
        
        if (product.discount) {
            aggregatedStock[product.msp].totalDiscount += parseFloat(product.discount) || 0;
        }
    });
    
    // Bước 2: Tính toán các chỉ số và hiển thị
    Object.values(aggregatedStock).forEach((product, index) => {
        if (searchTerm && 
            !product.msp.toLowerCase().includes(lowerSearchTerm) &&
            !product.name.toLowerCase().includes(lowerSearchTerm) &&
            !product.classification.toLowerCase().includes(lowerSearchTerm)) {
            return;
        }
        
        if (product.category === 'hang_hoa' && product.quantity <= 0) return;
        
        const absoluteAmount = Math.abs(product.totalAmount);
        product.avgPrice = product.quantity > 0 && product.category === 'hang_hoa' ? 
            absoluteAmount / product.quantity : 0;
            
        product.discountRate = absoluteAmount > 0 ? 
            (product.totalDiscount / absoluteAmount * 100) : 0;
        
        
        const amountBeforeTax = product.totalAmount;
        
        let taxRate = 10;
        if (product.category !== 'hang_hoa') {
            taxRate = 0;
        }
        
        const taxAmount = accountingRound(amountBeforeTax * taxRate / 100);
        const amountAfterTax = accountingRound(amountBeforeTax + taxAmount);
        
        const suggestedPrice = product.category === 'hang_hoa' ? 
            accountingRound(product.avgPrice * 1.2) : 0;

        const row = document.createElement('tr');
        
        if (product.category === 'chiet_khau') {
            row.style.backgroundColor = '#fff3cd';
        } else if (product.category === 'khuyen_mai') {
            row.style.backgroundColor = '#d1ecf1';
        }
        
        const quantityDisplay = product.category === 'hang_hoa' ? 
            product.quantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : 
            '--'; 
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${product.msp}</strong></td>
            <td>${product.name}</td>
            <td>${product.unit}</td>
            <td>${quantityDisplay}</td>
            <td>${product.category === 'hang_hoa' ? formatCurrency(product.avgPrice) : '0'}</td>
            <td><strong>${formatCurrency(product.totalDiscount)}</strong></td>
            <td>${product.discountRate.toFixed(2)}%</td>
            <td>${formatCurrency(amountBeforeTax)}</td>
            <td>${taxRate}% (${formatCurrency(taxAmount)})</td>
            <td>${formatCurrency(amountAfterTax)}</td>
            <td>${product.category === 'hang_hoa' ? formatCurrency(suggestedPrice) : '0'}</td>
            <td><span class="badge ${getClassificationBadgeClass(product.category)}">${product.classification}</span></td>
            <td>
                <button class="btn-sm btn-detail" onclick="showStockDetail('${product.msp}')">Chi tiết</button>
                <button class="btn-sm btn-info" onclick="showEditStockModal('${product.msp}')">Sửa</button>
                <button class="btn-sm btn-danger" onclick="deleteStockItem('${product.msp}')">Xóa</button>
            </td>
        `;
        
        stockList.appendChild(row);
        productCount++;
    });
    
    if (productCount === 0) {
        stockList.innerHTML = `<tr><td colspan="15" style="text-align: center;">${searchTerm ? 'Không tìm thấy sản phẩm nào' : 'Chưa có dữ liệu tồn kho'}</td></tr>`;
    }
}

// Hàm xóa sản phẩm tồn kho (Giữ nguyên logic cũ)
function deleteStockItem(msp) {
    if (!window.currentCompany || !confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi tồn kho? (Lưu ý: Thao tác này KHÔNG hủy bút toán kế toán đã ghi nhận trước đó, chỉ loại bỏ khỏi danh sách tồn kho hiện tại)')) return;
    
    const hkd = hkdData[window.currentCompany];
    
    hkd.tonkhoMain = hkd.tonkhoMain.filter(p => p.msp !== msp);
    
    renderStock();
    if (typeof window.updateAccountingStats === 'function') window.updateAccountingStats();
    alert('Đã xóa sản phẩm khỏi tồn kho.');
}

// =======================
// Exports toàn cục
// =======================
window.initStockModule = initStockModule;
window.renderStock = renderStock;
window.updateStockStats = updateStockStats;
window.showEditStockModal = showEditStockModal; 
window.showStockDetail = showStockDetail; 
window.deleteStockItem = deleteStockItem;