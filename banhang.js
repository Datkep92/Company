// Module quản lý bán hàng
function initBanHangModule() {
    // Lắng nghe sự kiện tạo đơn bán hàng
    const createSaleButton = document.getElementById('create-sale-order');
    if (createSaleButton) {
        createSaleButton.addEventListener('click', createSaleOrder);
    }

    // Tải danh sách sản phẩm bán
    loadSaleProducts();
    
    // Tải danh sách đơn bán hàng
    loadSaleOrders();
    
    // Tải công nợ phải thu
    loadReceivableList();
}

function loadSaleProducts() {
    const container = document.getElementById('sale-products-container');
    if (!container) return;

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Vui lòng chọn công ty</p>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const aggregatedStock = getAggregatedStock(hkd);
    const availableProducts = Object.values(aggregatedStock).filter(item => 
        item.quantity > 0 && item.category === 'hang_hoa'
    );

    let html = `
        <table class="table">
            <thead>
                <tr>
                    <th>Chọn</th>
                    <th>MSP</th>
                    <th>Tên SP</th>
                    <th>ĐVT</th>
                    <th>Tồn kho</th>
                    <th>Giá vốn TB</th>
                    <th>Giá bán</th>
                    <th>Số lượng</th>
                    <th>Thành tiền</th>
                </tr>
            </thead>
            <tbody>
    `;

    availableProducts.forEach(product => {
        const sellingPrice = product.avgPrice * 1.2; // Giá bán = giá vốn * 1.2
        
        html += `
            <tr>
                <td><input type="checkbox" class="sale-product-check" data-msp="${product.msp}" data-price="${sellingPrice}"></td>
                <td>${product.msp}</td>
                <td>${product.name}</td>
                <td>${product.unit}</td>
                <td>${product.quantity.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
                <td>${window.formatCurrency(product.avgPrice)}</td>
                <td>
                    <input type="number" class="sale-price" data-msp="${product.msp}" 
                           value="${Math.round(sellingPrice)}" style="width: 100px;">
                </td>
                <td>
                    <input type="number" class="sale-quantity" data-msp="${product.msp}" 
                           min="0" max="${product.quantity}" value="0" step="0.01" style="width: 80px;">
                </td>
                <td class="sale-amount" data-msp="${product.msp}">0</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;

    // Gắn sự kiện tính toán
    document.querySelectorAll('.sale-product-check').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const msp = this.getAttribute('data-msp');
            const qtyInput = document.querySelector(`.sale-quantity[data-msp="${msp}"]`);
            if (this.checked) {
                qtyInput.value = '1';
                qtyInput.focus();
            } else {
                qtyInput.value = '0';
            }
            calculateSaleAmount(msp);
        });
    });

    document.querySelectorAll('.sale-quantity, .sale-price').forEach(input => {
        input.addEventListener('input', function() {
            const msp = this.getAttribute('data-msp');
            calculateSaleAmount(msp);
        });
    });
}

function calculateSaleAmount(msp) {
    const qtyInput = document.querySelector(`.sale-quantity[data-msp="${msp}"]`);
    const priceInput = document.querySelector(`.sale-price[data-msp="${msp}"]`);
    const amountCell = document.querySelector(`.sale-amount[data-msp="${msp}"]`);
    
    const quantity = parseFloat(qtyInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    const amount = quantity * price;
    
    amountCell.textContent = window.formatCurrency(amount);
}

function createSaleOrder() {
    if (!window.currentCompany) {
        alert('Vui lòng chọn công ty trước.');
        return;
    }

    const customer = document.getElementById('sale-customer').value;
    const saleDate = document.getElementById('sale-date').value;
    const paymentMethod = document.getElementById('sale-payment-method').value;

    if (!customer || !saleDate) {
        alert('Vui lòng nhập đầy đủ thông tin khách hàng và ngày bán.');
        return;
    }

    // Lấy danh sách sản phẩm được chọn
    const saleProducts = [];
    let totalAmount = 0;
    let totalCost = 0;

    document.querySelectorAll('.sale-product-check:checked').forEach(checkbox => {
        const msp = checkbox.getAttribute('data-msp');
        const qtyInput = document.querySelector(`.sale-quantity[data-msp="${msp}"]`);
        const priceInput = document.querySelector(`.sale-price[data-msp="${msp}"]`);
        
        const quantity = parseFloat(qtyInput.value) || 0;
        const sellingPrice = parseFloat(priceInput.value) || 0;
        const amount = quantity * sellingPrice;

        if (quantity > 0) {
            // Tính giá vốn
            const hkd = window.hkdData[window.currentCompany];
            const aggregatedStock = getAggregatedStock(hkd);
            const product = aggregatedStock[msp];
            const costPrice = product.avgPrice;
            const costAmount = quantity * costPrice;

            saleProducts.push({
                msp: msp,
                name: product.name,
                unit: product.unit,
                quantity: quantity,
                price: sellingPrice,
                amount: amount,
                costPrice: costPrice,
                costAmount: costAmount
            });

            totalAmount += amount;
            totalCost += costAmount;
        }
    });

    if (saleProducts.length === 0) {
        alert('Vui lòng chọn ít nhất một sản phẩm để bán.');
        return;
    }

    // Tạo đơn bán hàng
    const saleOrder = {
        id: `DH_${Date.now()}`,
        date: saleDate,
        customer: customer,
        paymentMethod: paymentMethod,
        products: saleProducts,
        totalAmount: totalAmount,
        totalCost: totalCost,
        profit: totalAmount - totalCost,
        status: paymentMethod === 'credit' ? 'pending' : 'completed',
        createdAt: new Date().toISOString()
    };

    // Lưu đơn bán hàng
    const hkd = window.hkdData[window.currentCompany];
    if (!hkd.saleOrders) {
        hkd.saleOrders = [];
    }
    hkd.saleOrders.push(saleOrder);

    // Cập nhật tồn kho
    updateStockAfterSale(saleProducts);

    // Tạo hóa đơn đầu ra (nếu cần)
    if (paymentMethod !== 'credit') {
        createSaleInvoice(saleOrder);
    }

    // Tạo bút toán kế toán
    createSaleAccountingEntry(saleOrder);

    alert(`Đã tạo đơn bán hàng ${saleOrder.id} thành công!\nTổng tiền: ${window.formatCurrency(totalAmount)}`);
    
    // Reset form
    document.getElementById('sale-customer').value = '';
    document.getElementById('sale-date').value = '';
    document.querySelectorAll('.sale-product-check').forEach(cb => cb.checked = false);
    document.querySelectorAll('.sale-quantity').forEach(input => input.value = '0');
    document.querySelectorAll('.sale-amount').forEach(td => td.textContent = '0');
    
    // Cập nhật giao diện
    loadSaleOrders();
    loadReceivableList();
    if (typeof window.renderStock === 'function') window.renderStock();
    
    // Lưu dữ liệu
    if (typeof window.saveData === 'function') {
        window.saveData();
    }
}

function updateStockAfterSale(saleProducts) {
    const hkd = window.hkdData[window.currentCompany];
    
    saleProducts.forEach(item => {
        let stockItem = hkd.tonkhoMain.find(p => p.msp === item.msp);
        
        if (stockItem) {
            // Trừ số lượng tồn kho
            stockItem.quantity -= item.quantity;
            
            // Đảm bảo số lượng không âm
            if (stockItem.quantity < 0) {
                stockItem.quantity = 0;
            }
            
            // Cập nhật giá trị tồn kho (theo phương pháp bình quân)
            if (stockItem.quantity > 0) {
                stockItem.amount = stockItem.quantity * (stockItem.amount / (stockItem.quantity + item.quantity));
            } else {
                stockItem.amount = 0;
            }
        }
    });
}

function createSaleAccountingEntry(saleOrder) {
    const hkd = window.hkdData[window.currentCompany];
    if (!hkd.accountingTransactions) {
        hkd.accountingTransactions = [];
    }

    const transactionId = `SALE_${Date.now()}`;

    // Bút toán bán hàng:
    if (saleOrder.paymentMethod === 'cash') {
        // Nợ 111 - Tiền mặt
        // Có 511 - Doanh thu bán hàng
        // Có 3331 - Thuế GTGT đầu ra
        // Đồng thời: Nợ 632 - Giá vốn hàng bán / Có 156 - Hàng hóa
        
        hkd.accountingTransactions.push({
            id: transactionId,
            date: saleOrder.date,
            type: 'SALE_CASH',
            account: '111',
            debit: saleOrder.totalAmount,
            credit: 0,
            description: `Bán hàng cho ${saleOrder.customer}`,
            reference: saleOrder.id
        });

        hkd.accountingTransactions.push({
            id: transactionId,
            date: saleOrder.date,
            type: 'SALE_CASH',
            account: '511',
            debit: 0,
            credit: saleOrder.totalAmount / 1.1, // Doanh thu chưa thuế
            description: `Doanh thu bán hàng`,
            reference: saleOrder.id
        });

        hkd.accountingTransactions.push({
            id: transactionId,
            date: saleOrder.date,
            type: 'SALE_CASH',
            account: '3331',
            debit: 0,
            credit: saleOrder.totalAmount - (saleOrder.totalAmount / 1.1), // Thuế GTGT
            description: `Thuế GTGT đầu ra`,
            reference: saleOrder.id
        });
    } else if (saleOrder.paymentMethod === 'bank') {
        // Tương tự nhưng tài khoản 112 - Tiền gửi ngân hàng
        hkd.accountingTransactions.push({
            id: transactionId,
            date: saleOrder.date,
            type: 'SALE_BANK',
            account: '112',
            debit: saleOrder.totalAmount,
            credit: 0,
            description: `Bán hàng cho ${saleOrder.customer}`,
            reference: saleOrder.id
        });

        // ... các bút toán doanh thu và thuế tương tự
    } else if (saleOrder.paymentMethod === 'credit') {
        // Nợ 131 - Phải thu khách hàng
        hkd.accountingTransactions.push({
            id: transactionId,
            date: saleOrder.date,
            type: 'SALE_CREDIT',
            account: '131',
            debit: saleOrder.totalAmount,
            credit: 0,
            description: `Bán hàng công nợ cho ${saleOrder.customer}`,
            reference: saleOrder.id
        });

        // ... các bút toán doanh thu và thuế tương tự
    }

    // Bút toán giá vốn
    hkd.accountingTransactions.push({
        id: transactionId + '_COST',
        date: saleOrder.date,
        type: 'COST_OF_SALES',
        account: '632',
        debit: saleOrder.totalCost,
        credit: 0,
        description: `Giá vốn hàng bán cho ${saleOrder.customer}`,
        reference: saleOrder.id
    });

    hkd.accountingTransactions.push({
        id: transactionId + '_COST',
        date: saleOrder.date,
        type: 'COST_OF_SALES',
        account: '156',
        debit: 0,
        credit: saleOrder.totalCost,
        description: `Xuất kho hàng bán`,
        reference: saleOrder.id
    });
}

function loadSaleOrders() {
    const orderList = document.getElementById('sale-orders-list');
    if (!orderList) return;

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        orderList.innerHTML = '<tr><td colspan="6" style="text-align: center;">Vui lòng chọn công ty</td></tr>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const saleOrders = hkd.saleOrders || [];

    orderList.innerHTML = '';

    if (saleOrders.length === 0) {
        orderList.innerHTML = '<tr><td colspan="6" style="text-align: center;">Chưa có đơn bán hàng</td></tr>';
        return;
    }

    // Sắp xếp theo ngày (mới nhất trước)
    const sortedOrders = [...saleOrders].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );

    sortedOrders.forEach((order, index) => {
        const row = document.createElement('tr');
        
        let statusBadge = '';
        if (order.status === 'completed') {
            statusBadge = '<span class="badge badge-success">Hoàn thành</span>';
        } else {
            statusBadge = '<span class="badge badge-warning">Chờ thanh toán</span>';
        }

        row.innerHTML = `
            <td>${order.id}</td>
            <td>${window.formatDate(order.date)}</td>
            <td>${order.customer}</td>
            <td>${window.formatCurrency(order.totalAmount)}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn-sm btn-info" onclick="viewSaleOrderDetail('${order.id}')">Xem</button>
                <button class="btn-sm btn-primary" onclick="createSaleInvoice('${order.id}')">Tạo HĐ</button>
                ${order.status === 'pending' ? `<button class="btn-sm btn-success" onclick="receivePayment('${order.id}')">Thu tiền</button>` : ''}
            </td>
        `;
        
        orderList.appendChild(row);
    });
}

function loadReceivableList() {
    const receivableList = document.getElementById('receivable-list');
    if (!receivableList) return;

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        receivableList.innerHTML = '<tr><td colspan="6" style="text-align: center;">Vui lòng chọn công ty</td></tr>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const saleOrders = hkd.saleOrders || [];
    
    // Tính toán công nợ theo khách hàng
    const customerDebt = {};
    
    saleOrders.forEach(order => {
        if (order.status === 'pending') {
            if (!customerDebt[order.customer]) {
                customerDebt[order.customer] = {
                    name: order.customer,
                    totalDebt: 0,
                    paid: 0,
                    remaining: 0
                };
            }
            
            customerDebt[order.customer].totalDebt += order.totalAmount;
        }
    });

    receivableList.innerHTML = '';

    if (Object.keys(customerDebt).length === 0) {
        receivableList.innerHTML = '<tr><td colspan="6" style="text-align: center;">Chưa có công nợ phải thu</td></tr>';
        return;
    }

    Object.values(customerDebt).forEach((customer, index) => {
        customer.remaining = customer.totalDebt - customer.paid;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.name}</td>
            <td>-</td>
            <td>${window.formatCurrency(customer.totalDebt)}</td>
            <td>${window.formatCurrency(customer.paid)}</td>
            <td>${window.formatCurrency(customer.remaining)}</td>
            <td>
                <button class="btn-sm btn-primary" onclick="viewCustomerDetail('${customer.name}')">Chi tiết</button>
                <button class="btn-sm btn-success" onclick="receiveCustomerPayment('${customer.name}')">Thu nợ</button>
            </td>
        `;
        
        receivableList.appendChild(row);
    });
}

function viewSaleOrderDetail(orderId) {
    if (!window.currentCompany) return;
    
    const hkd = window.hkdData[window.currentCompany];
    const order = hkd.saleOrders.find(o => o.id === orderId);
    
    if (!order) {
        alert('Không tìm thấy đơn hàng');
        return;
    }

    let detailHtml = `
        <div class="card">
            <div class="card-header">Thông Tin Đơn Hàng</div>
            <p><strong>Mã đơn:</strong> ${order.id}</p>
            <p><strong>Ngày bán:</strong> ${window.formatDate(order.date)}</p>
            <p><strong>Khách hàng:</strong> ${order.customer}</p>
            <p><strong>Phương thức TT:</strong> ${order.paymentMethod}</p>
            <p><strong>Trạng thái:</strong> ${order.status === 'completed' ? 'Đã thanh toán' : 'Chờ thanh toán'}</p>
        </div>
        
        <div class="card">
            <div class="card-header">Chi Tiết Sản Phẩm</div>
            <table class="table">
                <thead>
                    <tr>
                        <th>MSP</th>
                        <th>Tên SP</th>
                        <th>ĐVT</th>
                        <th>SL</th>
                        <th>Đơn giá</th>
                        <th>Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    order.products.forEach(product => {
        detailHtml += `
            <tr>
                <td>${product.msp}</td>
                <td>${product.name}</td>
                <td>${product.unit}</td>
                <td>${product.quantity}</td>
                <td>${window.formatCurrency(product.price)}</td>
                <td>${window.formatCurrency(product.amount)}</td>
            </tr>
        `;
    });
    
    detailHtml += `
                </tbody>
                <tfoot>
                    <tr style="font-weight: bold;">
                        <td colspan="5">Tổng cộng</td>
                        <td>${window.formatCurrency(order.totalAmount)}</td>
                    </tr>
                    <tr>
                        <td colspan="5">Giá vốn</td>
                        <td>${window.formatCurrency(order.totalCost)}</td>
                    </tr>
                    <tr>
                        <td colspan="5">Lợi nhuận</td>
                        <td>${window.formatCurrency(order.profit)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <button class="btn-primary" onclick="printSaleOrder('${orderId}')">In Đơn Hàng</button>
            ${!order.invoiceId ? `<button class="btn-success" onclick="createSaleInvoice('${orderId}')">Tạo Hóa Đơn</button>` : ''}
            ${order.status === 'pending' ? `<button class="btn-warning" onclick="receivePayment('${orderId}')">Xác Nhận Thanh Toán</button>` : ''}
        </div>
    `;
    
    window.showModal(`Chi Tiết Đơn Hàng - ${order.id}`, detailHtml);
}

function createSaleInvoice(orderId) {
    if (!window.currentCompany) return;
    
    const hkd = window.hkdData[window.currentCompany];
    const order = hkd.saleOrders.find(o => o.id === orderId);
    
    if (!order) {
        alert('Không tìm thấy đơn hàng');
        return;
    }

    if (order.invoiceId) {
        alert('Đơn hàng này đã có hóa đơn.');
        return;
    }

    // Tạo hóa đơn đầu ra
    const invoice = {
        id: `HD_OUT_${Date.now()}`,
        orderId: orderId,
        date: new Date().toISOString().split('T')[0],
        customer: order.customer,
        products: order.products,
        totalAmount: order.totalAmount,
        taxAmount: order.totalAmount - (order.totalAmount / 1.1),
        status: 'issued'
    };

    // Lưu hóa đơn
    if (!hkd.saleInvoices) {
        hkd.saleInvoices = [];
    }
    hkd.saleInvoices.push(invoice);

    // Cập nhật đơn hàng
    order.invoiceId = invoice.id;
    order.status = 'completed';

    alert(`Đã tạo hóa đơn ${invoice.id} thành công!`);
    
    // Cập nhật giao diện
    loadSaleOrders();
    loadReceivableList();
    
    // Lưu dữ liệu
    if (typeof window.saveData === 'function') {
        window.saveData();
    }
}

function receivePayment(orderId) {
    const modalContent = `
        <div class="form-grid">
            <div class="form-group">
                <label for="receive-date">Ngày thu tiền</label>
                <input type="date" id="receive-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label for="receive-amount">Số tiền</label>
                <input type="number" id="receive-amount" class="form-control" placeholder="Nhập số tiền thu">
            </div>
            <div class="form-group">
                <label for="receive-method">Phương thức</label>
                <select id="receive-method" class="form-control">
                    <option value="cash">Tiền mặt</option>
                    <option value="bank">Chuyển khoản</option>
                </select>
            </div>
            <div class="form-group">
                <label for="receive-description">Nội dung</label>
                <input type="text" id="receive-description" class="form-control" placeholder="Nội dung thu tiền">
            </div>
        </div>
        <div style="text-align: right; margin-top: 20px;">
            <button id="confirm-receive" class="btn-success">Xác Nhận Thu Tiền</button>
            <button class="btn-secondary" onclick="document.getElementById('custom-modal').style.display = 'none'">Hủy</button>
        </div>
    `;

    window.showModal('Thu Tiền Bán Hàng', modalContent);

    document.getElementById('confirm-receive').addEventListener('click', function() {
        processReceivePayment(orderId);
    });
}

function processReceivePayment(orderId) {
    const receiveDate = document.getElementById('receive-date').value;
    const amount = parseFloat(document.getElementById('receive-amount').value) || 0;
    const method = document.getElementById('receive-method').value;
    const description = document.getElementById('receive-description').value;

    if (!receiveDate || amount <= 0) {
        alert('Vui lòng nhập đầy đủ thông tin thu tiền.');
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const order = hkd.saleOrders.find(o => o.id === orderId);
    
    if (!order) {
        alert('Không tìm thấy đơn hàng');
        return;
    }

    // Cập nhật trạng thái đơn hàng
    order.status = 'completed';

    // Tạo bút toán thu tiền
    createReceivePaymentAccountingEntry(order, receiveDate, amount, method, description);

    alert(`Đã xác nhận thu tiền ${window.formatCurrency(amount)} thành công!`);
    document.getElementById('custom-modal').style.display = 'none';
    
    // Cập nhật giao diện
    loadSaleOrders();
    loadReceivableList();
    
    // Lưu dữ liệu
    if (typeof window.saveData === 'function') {
        window.saveData();
    }
}

function createReceivePaymentAccountingEntry(order, date, amount, method, description) {
    const hkd = window.hkdData[window.currentCompany];
    if (!hkd.accountingTransactions) {
        hkd.accountingTransactions = [];
    }

    const transactionId = `RECEIVE_${Date.now()}`;
    const accountDebit = method === 'cash' ? '111' : '112';
    const accountCredit = '131';

    hkd.accountingTransactions.push({
        id: transactionId,
        date: date,
        type: 'RECEIVE',
        account: accountDebit,
        debit: amount,
        credit: 0,
        description: description || `Thu tiền bán hàng từ ${order.customer}`,
        reference: order.id
    });

    hkd.accountingTransactions.push({
        id: transactionId,
        date: date,
        type: 'RECEIVE',
        account: accountCredit,
        debit: 0,
        credit: amount,
        description: description || `Giảm công nợ khách hàng ${order.customer}`,
        reference: order.id
    });
}

// Hàm in ấn
function printSaleOrders() {
    alert('Chức năng in đơn hàng đang được phát triển');
}

function printSaleInvoices() {
    alert('Chức năng in hóa đơn đầu ra đang được phát triển');
}

function printSaleReport() {
    alert('Chức năng in báo cáo doanh thu đang được phát triển');
}

// Exports toàn cục
window.initBanHangModule = initBanHangModule;
window.loadSaleProducts = loadSaleProducts;
window.createSaleOrder = createSaleOrder;
window.viewSaleOrderDetail = viewSaleOrderDetail;
window.createSaleInvoice = createSaleInvoice;
window.receivePayment = receivePayment;