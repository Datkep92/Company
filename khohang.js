// Module quản lý kho hàng
function initKhoHangModule() {
    // Lắng nghe sự kiện tìm kiếm sản phẩm
    const searchInput = document.getElementById('search-products');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            loadProductCatalog(e.target.value);
        });
    }

    // Lắng nghe sự kiện tạo báo cáo tồn kho
    const generateReportButton = document.getElementById('generate-stock-report');
    if (generateReportButton) {
        generateReportButton.addEventListener('click', generateStockReport);
    }

    // Tải danh mục hàng hóa
    loadProductCatalog();
    
    // Tải thẻ kho
    loadStockCards();
}

function loadProductCatalog(searchTerm = '') {
    const productList = document.getElementById('product-catalog-list');
    if (!productList) return;

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        productList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Vui lòng chọn công ty</td></tr>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const aggregatedStock = getAggregatedStock(hkd);
    const stockItems = Object.values(aggregatedStock);

    productList.innerHTML = '';

    if (stockItems.length === 0) {
        productList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Chưa có dữ liệu hàng hóa</td></tr>';
        return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    let filteredItems = stockItems;

    if (searchTerm) {
        filteredItems = stockItems.filter(item => 
            item.msp.toLowerCase().includes(lowerSearchTerm) ||
            item.name.toLowerCase().includes(lowerSearchTerm)
        );
    }

    if (filteredItems.length === 0) {
        productList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Không tìm thấy sản phẩm phù hợp</td></tr>';
        return;
    }

    filteredItems.forEach((product, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td><strong>${product.msp}</strong></td>
            <td>${product.name}</td>
            <td>${product.unit}</td>
            <td>${product.quantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
            <td>${window.formatCurrency(product.avgPrice)}</td>
            <td>${window.formatCurrency(product.totalAmount)}</td>
            <td>
                <button class="btn-sm btn-info" onclick="viewStockCard('${product.msp}')">Thẻ kho</button>
                <button class="btn-sm btn-warning" onclick="adjustStock('${product.msp}')">Điều chỉnh</button>
            </td>
        `;
        
        productList.appendChild(row);
    });
}

function loadStockCards() {
    const container = document.getElementById('stock-card-container');
    if (!container) return;

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Vui lòng chọn công ty</p>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const aggregatedStock = getAggregatedStock(hkd);
    const stockItems = Object.values(aggregatedStock);

    if (stockItems.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Chưa có dữ liệu thẻ kho</p>';
        return;
    }

    // Hiển thị 5 sản phẩm có số lượng tồn cao nhất
    const topProducts = stockItems
        .filter(item => item.quantity > 0)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    let html = `
        <h4>Top 5 Sản Phẩm Tồn Kho Cao Nhất</h4>
        <table class="table">
            <thead>
                <tr>
                    <th>MSP</th>
                    <th>Tên hàng hóa</th>
                    <th>Số lượng tồn</th>
                    <th>Giá trị tồn</th>
                    <th>Thao tác</th>
                </tr>
            </thead>
            <tbody>
    `;

    topProducts.forEach(product => {
        html += `
            <tr>
                <td>${product.msp}</td>
                <td>${product.name}</td>
                <td>${product.quantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
                <td>${window.formatCurrency(product.totalAmount)}</td>
                <td>
                    <button class="btn-sm btn-info" onclick="viewStockCard('${product.msp}')">Xem thẻ kho</button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function viewStockCard(msp) {
    if (!window.currentCompany) return;
    
    const hkd = window.hkdData[window.currentCompany];
    
    // Lấy tất cả giao dịch liên quan đến sản phẩm
    const transactions = [];
    
    // Giao dịch từ hóa đơn mua hàng (nhập)
    (hkd.invoices || []).forEach(invoice => {
        invoice.products.filter(p => p.msp === msp && p.category === 'hang_hoa').forEach(item => {
            transactions.push({
                date: invoice.invoiceInfo.date,
                type: 'NHẬP',
                reference: `HD ${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}`,
                quantityIn: parseFloat(item.quantity),
                quantityOut: 0,
                unitPrice: item.amount / parseFloat(item.quantity),
                amount: item.amount
            });
        });
    });
    
    // Giao dịch từ xuất hàng
    (hkd.exports || []).forEach(exportRecord => {
        exportRecord.products.filter(p => p.msp === msp).forEach(item => {
            transactions.push({
                date: exportRecord.date,
                type: 'XUẤT',
                reference: `PX ${exportRecord.id}`,
                quantityIn: 0,
                quantityOut: parseFloat(item.quantity),
                unitPrice: item.price,
                amount: -item.amount
            });
        });
    });
    
    // Sắp xếp theo ngày
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let runningQuantity = 0;
    let runningAmount = 0;
    
    let detailHtml = `
        <div class="card">
            <div class="card-header">Thẻ Kho - MSP: ${msp}</div>
            <table class="table">
                <thead>
                    <tr>
                        <th>Ngày</th>
                        <th>Diễn giải</th>
                        <th>Nhập</th>
                        <th>Xuất</th>
                        <th>Tồn</th>
                        <th>Đơn giá</th>
                        <th>Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    transactions.forEach(tx => {
        runningQuantity += tx.quantityIn - tx.quantityOut;
        runningAmount += tx.amount;
        
        detailHtml += `
            <tr>
                <td>${window.formatDate(tx.date)}</td>
                <td>${tx.type} - ${tx.reference}</td>
                <td>${tx.quantityIn > 0 ? tx.quantityIn.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : ''}</td>
                <td>${tx.quantityOut > 0 ? tx.quantityOut.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) : ''}</td>
                <td>${runningQuantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
                <td>${window.formatCurrency(tx.unitPrice)}</td>
                <td>${window.formatCurrency(runningAmount)}</td>
            </tr>
        `;
    });
    
    detailHtml += `
                </tbody>
            </table>
        </div>
        <div style="text-align: center; margin-top: 20px;">
            <button class="btn-primary" onclick="printStockCard('${msp}')">In Thẻ Kho</button>
        </div>
    `;
    
    window.showModal(`Thẻ Kho - ${msp}`, detailHtml);
}

function adjustStock(msp) {
    const hkd = window.hkdData[window.currentCompany];
    const aggregatedStock = getAggregatedStock(hkd);
    const product = aggregatedStock[msp];
    
    if (!product) {
        alert('Không tìm thấy sản phẩm');
        return;
    }

    const modalContent = `
        <div class="form-grid">
            <div class="form-group">
                <label for="adjust-date">Ngày điều chỉnh</label>
                <input type="date" id="adjust-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label for="adjust-type">Loại điều chỉnh</label>
                <select id="adjust-type" class="form-control">
                    <option value="increase">Tăng tồn kho</option>
                    <option value="decrease">Giảm tồn kho</option>
                    <option value="set">Đặt lại số lượng</option>
                </select>
            </div>
            <div class="form-group">
                <label for="adjust-quantity">Số lượng</label>
                <input type="number" id="adjust-quantity" class="form-control" placeholder="Nhập số lượng" step="0.01">
            </div>
            <div class="form-group">
                <label for="adjust-reason">Lý do</label>
                <input type="text" id="adjust-reason" class="form-control" placeholder="Nhập lý do điều chỉnh">
            </div>
        </div>
        <div class="card">
            <div class="card-header">Thông Tin Hiện Tại</div>
            <p><strong>Sản phẩm:</strong> ${product.name} (${msp})</p>
            <p><strong>Tồn kho hiện tại:</strong> ${product.quantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} ${product.unit}</p>
        </div>
        <div style="text-align: right; margin-top: 20px;">
            <button id="confirm-adjust" class="btn-success">Xác Nhận Điều Chỉnh</button>
            <button class="btn-secondary" onclick="document.getElementById('custom-modal').style.display = 'none'">Hủy</button>
        </div>
    `;

    window.showModal('Điều Chỉnh Tồn Kho', modalContent);

    document.getElementById('confirm-adjust').addEventListener('click', function() {
        processStockAdjustment(msp, product);
    });
}

function processStockAdjustment(msp, product) {
    const date = document.getElementById('adjust-date').value;
    const type = document.getElementById('adjust-type').value;
    const quantity = parseFloat(document.getElementById('adjust-quantity').value) || 0;
    const reason = document.getElementById('adjust-reason').value;

    if (!date || quantity <= 0 || !reason) {
        alert('Vui lòng nhập đầy đủ thông tin điều chỉnh.');
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    
    // Tính toán số lượng mới
    let newQuantity = product.quantity;
    switch (type) {
        case 'increase':
            newQuantity += quantity;
            break;
        case 'decrease':
            newQuantity -= quantity;
            break;
        case 'set':
            newQuantity = quantity;
            break;
    }

    if (newQuantity < 0) {
        alert('Số lượng tồn kho không thể âm.');
        return;
    }

    // Tạo bút toán điều chỉnh
    createStockAdjustmentAccountingEntry(msp, product.name, date, type, quantity, reason, newQuantity);

    // Cập nhật tồn kho
    updateStockAfterAdjustment(msp, newQuantity);

    alert(`Đã điều chỉnh tồn kho thành công! Số lượng mới: ${newQuantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}`);
    document.getElementById('custom-modal').style.display = 'none';
    
    // Cập nhật giao diện
    loadProductCatalog();
    loadStockCards();
    
    // Lưu dữ liệu
    if (typeof window.saveData === 'function') {
        window.saveData();
    }
}

function updateStockAfterAdjustment(msp, newQuantity) {
    const hkd = window.hkdData[window.currentCompany];
    
    // Tìm sản phẩm trong tồn kho
    const stockItem = hkd.tonkhoMain.find(item => item.msp === msp);
    
    if (stockItem) {
        // Cập nhật số lượng
        stockItem.quantity = newQuantity;
        
        // Giữ nguyên giá trị (trong thực tế có thể cần tính toán lại)
        // stockItem.amount = newQuantity * (stockItem.amount / stockItem.quantity);
    }
}

function createStockAdjustmentAccountingEntry(msp, productName, date, type, quantity, reason, newQuantity) {
    const hkd = window.hkdData[window.currentCompany];
    if (!hkd.accountingTransactions) {
        hkd.accountingTransactions = [];
    }

    const transactionId = `ADJ_${Date.now()}`;
    const description = `Điều chỉnh tồn kho ${productName} - ${reason}`;

    // Bút toán điều chỉnh tồn kho
    // Trong kế toán, điều chỉnh tăng: Nợ 156/Có 711
    // Điều chỉnh giảm: Nợ 632/Có 156

    if (type === 'increase') {
        hkd.accountingTransactions.push({
            id: transactionId,
            date: date,
            type: 'STOCK_ADJUST',
            account: '156',
            debit: quantity * 1000, // Giả sử đơn giá 1000
            credit: 0,
            description: description,
            reference: msp
        });

        hkd.accountingTransactions.push({
            id: transactionId,
            date: date,
            type: 'STOCK_ADJUST',
            account: '711',
            debit: 0,
            credit: quantity * 1000,
            description: description,
            reference: msp
        });
    } else {
        hkd.accountingTransactions.push({
            id: transactionId,
            date: date,
            type: 'STOCK_ADJUST',
            account: '632',
            debit: quantity * 1000,
            credit: 0,
            description: description,
            reference: msp
        });

        hkd.accountingTransactions.push({
            id: transactionId,
            date: date,
            type: 'STOCK_ADJUST',
            account: '156',
            debit: 0,
            credit: quantity * 1000,
            description: description,
            reference: msp
        });
    }
}

function generateStockReport() {
    const reportDate = document.getElementById('stock-report-date').value;
    const resultContainer = document.getElementById('stock-report-result');
    
    if (!reportDate) {
        alert('Vui lòng chọn ngày báo cáo.');
        return;
    }

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        alert('Vui lòng chọn công ty.');
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const aggregatedStock = getAggregatedStock(hkd);
    const stockItems = Object.values(aggregatedStock).filter(item => item.quantity > 0);

    let html = `
        <div class="card">
            <div class="card-header">Báo Cáo Tồn Kho Ngày ${window.formatDate(reportDate)}</div>
            <table class="table">
                <thead>
                    <tr>
                        <th>MSP</th>
                        <th>Tên hàng hóa</th>
                        <th>ĐVT</th>
                        <th>Số lượng</th>
                        <th>Đơn giá TB</th>
                        <th>Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let totalQuantity = 0;
    let totalValue = 0;

    stockItems.forEach(item => {
        totalQuantity += item.quantity;
        totalValue += item.totalAmount;

        html += `
            <tr>
                <td>${item.msp}</td>
                <td>${item.name}</td>
                <td>${item.unit}</td>
                <td>${item.quantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
                <td>${window.formatCurrency(item.avgPrice)}</td>
                <td>${window.formatCurrency(item.totalAmount)}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
                <tfoot>
                    <tr style="font-weight: bold;">
                        <td colspan="3">Tổng cộng</td>
                        <td>${totalQuantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
                        <td></td>
                        <td>${window.formatCurrency(totalValue)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
        <div style="text-align: center; margin-top: 20px;">
            <button class="btn-primary" onclick="printStockReport('${reportDate}')">In Báo Cáo</button>
        </div>
    `;

    resultContainer.innerHTML = html;
    resultContainer.classList.remove('hidden');
}

// Hàm tiện ích tổng hợp tồn kho
function getAggregatedStock(hkd) {
    const aggregatedStock = {};
    
    (hkd.tonkhoMain || []).forEach(product => {
        if (product.quantity <= 0 && product.category !== 'chiet_khau') return;
        
        const productCategory = product.category || 'hang_hoa';
        
        if (!aggregatedStock[product.msp]) {
            aggregatedStock[product.msp] = {
                msp: product.msp,
                name: product.name,
                unit: product.unit,
                quantity: 0,
                totalAmount: 0,
                avgPrice: 0,
                category: productCategory
            };
        }
        
        if (productCategory === 'hang_hoa') {
            aggregatedStock[product.msp].quantity += parseFloat(product.quantity);
        }
        
        aggregatedStock[product.msp].totalAmount += parseFloat(product.amount);
    });
    
    Object.values(aggregatedStock).forEach(product => {
        if (product.quantity > 0 && product.category === 'hang_hoa') {
            product.avgPrice = Math.abs(product.totalAmount) / product.quantity;
        }
    });
    
    return aggregatedStock;
}

// Hàm in ấn
function printStockCards() {
    alert('Chức năng in thẻ kho đang được phát triển');
}

function printStockLedger() {
    alert('Chức năng in sổ nhập-xuất-tồn đang được phát triển');
}

function printStockReport(reportDate = '') {
    alert('Chức năng in báo cáo tồn kho đang được phát triển');
}

// Exports toàn cục
window.initKhoHangModule = initKhoHangModule;
window.loadProductCatalog = loadProductCatalog;
window.viewStockCard = viewStockCard;
window.adjustStock = adjustStock;
window.generateStockReport = generateStockReport;