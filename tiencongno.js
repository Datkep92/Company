// Module quản lý tiền và công nợ
function initTienCongNoModule() {
    // Lắng nghe sự kiện tạo chứng từ
    const createVoucherButton = document.getElementById('create-voucher');
    if (createVoucherButton) {
        createVoucherButton.addEventListener('click', createVoucher);
    }

    // Tải sổ quỹ tiền mặt
    loadCashBook();
    
    // Tải sổ tiền gửi ngân hàng
    loadBankBook();
    
    // Tải bảng tuổi nợ
    loadAgingReport();
}

function createVoucher() {
    if (!window.currentCompany) {
        alert('Vui lòng chọn công ty trước.');
        return;
    }

    const voucherType = document.getElementById('voucher-type').value;
    const voucherDate = document.getElementById('voucher-date').value;
    const voucherAmount = parseFloat(document.getElementById('voucher-amount').value) || 0;
    const voucherDescription = document.getElementById('voucher-description').value;

    if (!voucherDate || voucherAmount <= 0 || !voucherDescription) {
        alert('Vui lòng nhập đầy đủ thông tin chứng từ.');
        return;
    }

    // Tạo chứng từ
    const voucher = {
        id: `${voucherType === 'receipt' ? 'PT' : 'PC'}_${Date.now()}`,
        type: voucherType,
        date: voucherDate,
        amount: voucherAmount,
        description: voucherDescription,
        status: 'completed',
        createdAt: new Date().toISOString()
    };

    // Lưu chứng từ
    const hkd = window.hkdData[window.currentCompany];
    if (!hkd.vouchers) {
        hkd.vouchers = [];
    }
    hkd.vouchers.push(voucher);

    // Tạo bút toán kế toán
    createVoucherAccountingEntry(voucher);

    alert(`Đã tạo ${voucherType === 'receipt' ? 'phiếu thu' : 'phiếu chi'} ${voucher.id} thành công!`);
    
    // Reset form
    document.getElementById('voucher-amount').value = '';
    document.getElementById('voucher-description').value = '';
    
    // Cập nhật giao diện
    loadCashBook();
    loadBankBook();
    
    // Lưu dữ liệu
    if (typeof window.saveData === 'function') {
        window.saveData();
    }
}

function createVoucherAccountingEntry(voucher) {
    const hkd = window.hkdData[window.currentCompany];
    if (!hkd.accountingTransactions) {
        hkd.accountingTransactions = [];
    }

    const transactionId = voucher.id;

    if (voucher.type === 'receipt') {
        // Phiếu thu: Nợ 111 / Có các tài khoản liên quan
        hkd.accountingTransactions.push({
            id: transactionId,
            date: voucher.date,
            type: 'RECEIPT_VOUCHER',
            account: '111',
            debit: voucher.amount,
            credit: 0,
            description: voucher.description,
            reference: voucher.id
        });

        // Tài khoản có phụ thuộc vào nội dung phiếu thu
        // Ở đây giả sử là thu tiền bán hàng (Có 511)
        hkd.accountingTransactions.push({
            id: transactionId,
            date: voucher.date,
            type: 'RECEIPT_VOUCHER',
            account: '511',
            debit: 0,
            credit: voucher.amount,
            description: voucher.description,
            reference: voucher.id
        });
    } else {
        // Phiếu chi: Nợ các tài khoản liên quan / Có 111
        hkd.accountingTransactions.push({
            id: transactionId,
            date: voucher.date,
            type: 'PAYMENT_VOUCHER',
            account: '641', // Chi phí quản lý
            debit: voucher.amount,
            credit: 0,
            description: voucher.description,
            reference: voucher.id
        });

        hkd.accountingTransactions.push({
            id: transactionId,
            date: voucher.date,
            type: 'PAYMENT_VOUCHER',
            account: '111',
            debit: 0,
            credit: voucher.amount,
            description: voucher.description,
            reference: voucher.id
        });
    }
}

function loadCashBook() {
    const cashBookList = document.getElementById('cash-book-list');
    if (!cashBookList) return;

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        cashBookList.innerHTML = '<tr><td colspan="5" style="text-align: center;">Vui lòng chọn công ty</td></tr>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const transactions = hkd.accountingTransactions || [];
    
    // Lọc các giao dịch liên quan đến tiền mặt (111)
    const cashTransactions = transactions.filter(t => 
        t.account === '111' && 
        (t.type.includes('VOUCHER') || t.type.includes('SALE_CASH') || t.type.includes('RECEIVE'))
    );

    cashBookList.innerHTML = '';

    if (cashTransactions.length === 0) {
        cashBookList.innerHTML = '<tr><td colspan="5" style="text-align: center;">Chưa có giao dịch tiền mặt</td></tr>';
        return;
    }

    // Sắp xếp theo ngày
    const sortedTransactions = [...cashTransactions].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );

    let runningBalance = hkd.openingBalance ? hkd.openingBalance.cash || 0 : 0;

    sortedTransactions.forEach(transaction => {
        const receipt = transaction.debit > 0 ? transaction.debit : 0;
        const payment = transaction.credit > 0 ? transaction.credit : 0;
        
        runningBalance += receipt - payment;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${window.formatDate(transaction.date)}</td>
            <td>${transaction.description}</td>
            <td>${receipt > 0 ? window.formatCurrency(receipt) : ''}</td>
            <td>${payment > 0 ? window.formatCurrency(payment) : ''}</td>
            <td>${window.formatCurrency(runningBalance)}</td>
        `;
        
        cashBookList.appendChild(row);
    });
}

function loadBankBook() {
    const bankBookList = document.getElementById('bank-book-list');
    if (!bankBookList) return;

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        bankBookList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Vui lòng chọn công ty</td></tr>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const transactions = hkd.accountingTransactions || [];
    
    // Lọc các giao dịch liên quan đến tiền gửi ngân hàng (112)
    const bankTransactions = transactions.filter(t => 
        t.account === '112' && 
        (t.type.includes('SALE_BANK') || t.type.includes('PAYMENT'))
    );

    bankBookList.innerHTML = '';

    if (bankTransactions.length === 0) {
        bankBookList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Chưa có giao dịch ngân hàng</td></tr>';
        return;
    }

    // Sắp xếp theo ngày
    const sortedTransactions = [...bankTransactions].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );

    let runningBalance = hkd.openingBalance ? hkd.openingBalance.bank || 0 : 0;

    sortedTransactions.forEach(transaction => {
        const receipt = transaction.debit > 0 ? transaction.debit : 0;
        const payment = transaction.credit > 0 ? transaction.credit : 0;
        
        runningBalance += receipt - payment;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${window.formatDate(transaction.date)}</td>
            <td>Vietcombank</td>
            <td>001100123456</td>
            <td>${transaction.description}</td>
            <td>${receipt > 0 ? window.formatCurrency(receipt) : ''}</td>
            <td>${payment > 0 ? window.formatCurrency(payment) : ''}</td>
            <td>${window.formatCurrency(runningBalance)}</td>
        `;
        
        bankBookList.appendChild(row);
    });
}

function loadAgingReport() {
    const container = document.getElementById('aging-report-container');
    if (!container) return;

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Vui lòng chọn công ty</p>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const saleOrders = hkd.saleOrders || [];
    
    // Tính toán bảng tuổi nợ
    const agingData = {};
    const currentDate = new Date();
    
    saleOrders.forEach(order => {
        if (order.status === 'pending') {
            const orderDate = new Date(order.date);
            const daysOverdue = Math.floor((currentDate - orderDate) / (1000 * 60 * 60 * 24));
            
            let agingBucket = 'current';
            if (daysOverdue > 90) agingBucket = 'over90';
            else if (daysOverdue > 60) agingBucket = 'over60';
            else if (daysOverdue > 30) agingBucket = 'over30';
            else if (daysOverdue > 0) agingBucket = 'over0';
            
            if (!agingData[order.customer]) {
                agingData[order.customer] = {
                    name: order.customer,
                    current: 0,
                    over0: 0,
                    over30: 0,
                    over60: 0,
                    over90: 0,
                    total: 0
                };
            }
            
            agingData[order.customer][agingBucket] += order.totalAmount;
            agingData[order.customer].total += order.totalAmount;
        }
    });

    if (Object.keys(agingData).length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Không có công nợ quá hạn</p>';
        return;
    }

    let html = `
        <table class="table">
            <thead>
                <tr>
                    <th>Khách hàng</th>
                    <th>Chưa đến hạn</th>
                    <th>1-30 ngày</th>
                    <th>31-60 ngày</th>
                    <th>61-90 ngày</th>
                    <th>Trên 90 ngày</th>
                    <th>Tổng cộng</th>
                </tr>
            </thead>
            <tbody>
    `;

    Object.values(agingData).forEach(customer => {
        html += `
            <tr>
                <td>${customer.name}</td>
                <td>${window.formatCurrency(customer.current)}</td>
                <td>${window.formatCurrency(customer.over0)}</td>
                <td>${window.formatCurrency(customer.over30)}</td>
                <td>${window.formatCurrency(customer.over60)}</td>
                <td>${window.formatCurrency(customer.over90)}</td>
                <td><strong>${window.formatCurrency(customer.total)}</strong></td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

// Hàm in ấn
function printReceipts() {
    alert('Chức năng in phiếu thu đang được phát triển');
}

function printPayments() {
    alert('Chức năng in phiếu chi đang được phát triển');
}

function printCashBook() {
    alert('Chức năng in sổ quỹ đang được phát triển');
}

function printBankStatement() {
    alert('Chức năng in sao kê ngân hàng đang được phát triển');
}

function printAgingReport() {
    alert('Chức năng in bảng tuổi nợ đang được phát triển');
}

// Exports toàn cục
window.initTienCongNoModule = initTienCongNoModule;
window.createVoucher = createVoucher;
window.loadCashBook = loadCashBook;
window.loadBankBook = loadBankBook;
window.loadAgingReport = loadAgingReport;