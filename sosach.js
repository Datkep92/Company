// Module quản lý sổ sách
function initSoSachModule() {
    // Lắng nghe sự kiện xem nhật ký chung
    const generateJournalButton = document.getElementById('generate-journal');
    if (generateJournalButton) {
        generateJournalButton.addEventListener('click', loadGeneralJournal);
    }

    // Lắng nghe sự kiện xem sổ cái
    const viewLedgerButton = document.getElementById('view-ledger');
    if (viewLedgerButton) {
        viewLedgerButton.addEventListener('click', loadLedgerDetail);
    }

    // Tải sổ chi tiết tài khoản
    loadAccountDetail();
}

function loadGeneralJournal() {
    const journalList = document.getElementById('general-journal-list');
    if (!journalList) return;

    const period = document.getElementById('journal-period').value;
    
    if (!period) {
        alert('Vui lòng chọn kỳ kế toán.');
        return;
    }

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        journalList.innerHTML = '<tr><td colspan="6" style="text-align: center;">Vui lòng chọn công ty</td></tr>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const transactions = hkd.accountingTransactions || [];
    
    // Lọc giao dịch theo kỳ
    const periodTransactions = transactions.filter(t => 
        t.date.startsWith(period)
    );

    journalList.innerHTML = '';

    if (periodTransactions.length === 0) {
        journalList.innerHTML = '<tr><td colspan="6" style="text-align: center;">Không có giao dịch trong kỳ này</td></tr>';
        return;
    }

    // Nhóm giao dịch theo ID (các bút toán cùng một nghiệp vụ)
    const transactionsByGroup = {};
    
    periodTransactions.forEach(transaction => {
        if (!transactionsByGroup[transaction.id]) {
            transactionsByGroup[transaction.id] = [];
        }
        
        transactionsByGroup[transaction.id].push(transaction);
    });

    Object.values(transactionsByGroup).forEach(transactionGroup => {
        const firstTransaction = transactionGroup[0];
        
        transactionGroup.forEach((transaction, index) => {
            const row = document.createElement('tr');
            
            if (index === 0) {
                // Dòng đầu tiên của nhóm
                row.innerHTML = `
                    <td>${window.formatDate(transaction.date)}</td>
                    <td>${transaction.id}</td>
                    <td>${transaction.description}</td>
                    <td>${transaction.account}</td>
                    <td>${transaction.credit > 0 ? '' : window.formatCurrency(transaction.debit)}</td>
                    <td>${transaction.debit > 0 ? '' : window.formatCurrency(transaction.credit)}</td>
                `;
            } else {
                // Các dòng tiếp theo
                row.innerHTML = `
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>${transaction.account}</td>
                    <td>${transaction.credit > 0 ? '' : window.formatCurrency(transaction.debit)}</td>
                    <td>${transaction.debit > 0 ? '' : window.formatCurrency(transaction.credit)}</td>
                `;
            }
            
            journalList.appendChild(row);
        });
        
        // Thêm dòng trống giữa các nhóm
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="6" style="height: 10px; background: #f8f9fa;"></td>';
        journalList.appendChild(emptyRow);
    });
}

function loadLedgerDetail() {
    const container = document.getElementById('ledger-detail-container');
    if (!container) return;

    const accountCode = document.getElementById('ledger-account').value;
    
    if (!accountCode) {
        alert('Vui lòng chọn tài khoản.');
        return;
    }

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Vui lòng chọn công ty</p>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const transactions = hkd.accountingTransactions || [];
    
    // Lọc giao dịch theo tài khoản
    const accountTransactions = transactions.filter(t => 
        t.account === accountCode
    ).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (accountTransactions.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Không có phát sinh trên tài khoản này</p>';
        return;
    }

    const accountName = getAccountName(accountCode);
    let runningBalance = 0;
    
    let html = `
        <div class="card">
            <div class="card-header">Sổ Cái Tài Khoản ${accountCode} - ${accountName}</div>
            <table class="table">
                <thead>
                    <tr>
                        <th>Ngày</th>
                        <th>Chứng từ</th>
                        <th>Diễn giải</th>
                        <th>Nợ</th>
                        <th>Có</th>
                        <th>Số dư</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // Số dư đầu kỳ
    const openingBalance = hkd.openingBalance ? calculateOpeningBalance(accountCode, hkd.openingBalance) : 0;
    runningBalance = openingBalance;
    
    html += `
        <tr style="font-weight: bold; background: #f8f9fa;">
            <td></td>
            <td></td>
            <td>Số dư đầu kỳ</td>
            <td></td>
            <td></td>
            <td>${window.formatCurrency(runningBalance)}</td>
        </tr>
    `;

    accountTransactions.forEach(transaction => {
        runningBalance += transaction.debit - transaction.credit;
        
        html += `
            <tr>
                <td>${window.formatDate(transaction.date)}</td>
                <td>${transaction.id}</td>
                <td>${transaction.description}</td>
                <td>${transaction.debit > 0 ? window.formatCurrency(transaction.debit) : ''}</td>
                <td>${transaction.credit > 0 ? window.formatCurrency(transaction.credit) : ''}</td>
                <td>${window.formatCurrency(runningBalance)}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
        <div style="text-align: center; margin-top: 20px;">
            <button class="btn-primary" onclick="printGeneralLedger('${accountCode}')">In Sổ Cái</button>
        </div>
    `;
    
    container.innerHTML = html;
}

function calculateOpeningBalance(accountCode, openingBalance) {
    // Tính số dư đầu kỳ cho tài khoản
    switch (accountCode) {
        case '111': return openingBalance.cash || 0;
        case '112': return openingBalance.bank || 0;
        case '131': return openingBalance.receivable || 0;
        case '156': return openingBalance.stock || 0;
        case '331': return -openingBalance.payable || 0; // Số dư có
        default: return 0;
    }
}

function loadAccountDetail() {
    const container = document.getElementById('account-detail-container');
    if (!container) return;

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Vui lòng chọn công ty</p>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    
    let html = `
        <div class="card">
            <div class="card-header">Sổ Chi Tiết Các Tài Khoản</div>
            <div class="form-grid">
                <div class="form-group">
                    <label for="detail-account">Chọn tài khoản</label>
                    <select id="detail-account" class="form-control">
                        <option value="131">131 - Phải thu khách hàng</option>
                        <option value="331">331 - Phải trả người bán</option>
                        <option value="156">156 - Hàng hóa</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="detail-period">Kỳ kế toán</label>
                    <input type="month" id="detail-period" class="form-control">
                </div>
            </div>
            <button class="btn-primary" onclick="loadAccountDetailData()">Xem Chi Tiết</button>
            
            <div id="account-detail-result" style="margin-top: 20px;">
                <!-- Kết quả sẽ được hiển thị ở đây -->
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function loadAccountDetailData() {
    const resultContainer = document.getElementById('account-detail-result');
    if (!resultContainer) return;

    const accountCode = document.getElementById('detail-account').value;
    const period = document.getElementById('detail-period').value;
    
    if (!period) {
        alert('Vui lòng chọn kỳ kế toán.');
        return;
    }

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        resultContainer.innerHTML = '<p style="text-align: center; padding: 20px;">Vui lòng chọn công ty</p>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    
    let html = '';
    
    if (accountCode === '131') {
        // Sổ chi tiết phải thu khách hàng
        html = loadReceivableDetail(hkd, period);
    } else if (accountCode === '331') {
        // Sổ chi tiết phải trả người bán
        html = loadPayableDetail(hkd, period);
    } else if (accountCode === '156') {
        // Sổ chi tiết hàng hóa
        html = loadInventoryDetail(hkd, period);
    }
    
    resultContainer.innerHTML = html;
}

function loadReceivableDetail(hkd, period) {
    const saleOrders = hkd.saleOrders || [];
    
    // Lọc đơn hàng công nợ trong kỳ
    const creditSales = saleOrders.filter(order => 
        order.status === 'pending' && 
        order.date.startsWith(period)
    );

    let html = `
        <h4>Sổ Chi Tiết Phải Thu Khách Hàng - Kỳ ${period}</h4>
        <table class="table">
            <thead>
                <tr>
                    <th>Khách hàng</th>
                    <th>Ngày</th>
                    <th>Đơn hàng</th>
                    <th>Phát sinh nợ</th>
                    <th>Phát sinh có</th>
                    <th>Số dư</th>
                </tr>
            </thead>
            <tbody>
    `;

    const customerBalances = {};
    
    creditSales.forEach(order => {
        if (!customerBalances[order.customer]) {
            customerBalances[order.customer] = 0;
        }
        
        customerBalances[order.customer] += order.totalAmount;
        
        html += `
            <tr>
                <td>${order.customer}</td>
                <td>${window.formatDate(order.date)}</td>
                <td>${order.id}</td>
                <td>${window.formatCurrency(order.totalAmount)}</td>
                <td></td>
                <td>${window.formatCurrency(customerBalances[order.customer])}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    return html;
}

function loadPayableDetail(hkd, period) {
    const invoices = hkd.invoices || [];
    
    // Lọc hóa đơn mua hàng trong kỳ
    const periodInvoices = invoices.filter(invoice => 
        invoice.invoiceInfo.date.startsWith(period)
    );

    let html = `
        <h4>Sổ Chi Tiết Phải Trả Người Bán - Kỳ ${period}</h4>
        <table class="table">
            <thead>
                <tr>
                    <th>Nhà cung cấp</th>
                    <th>Ngày</th>
                    <th>Hóa đơn</th>
                    <th>Phát sinh nợ</th>
                    <th>Phát sinh có</th>
                    <th>Số dư</th>
                </tr>
            </thead>
            <tbody>
    `;

    const supplierBalances = {};
    
    periodInvoices.forEach(invoice => {
        const supplier = invoice.sellerInfo.name;
        
        if (!supplierBalances[supplier]) {
            supplierBalances[supplier] = 0;
        }
        
        supplierBalances[supplier] += invoice.summary.calculatedTotal;
        
        html += `
            <tr>
                <td>${supplier}</td>
                <td>${window.formatDate(invoice.invoiceInfo.date)}</td>
                <td>${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</td>
                <td></td>
                <td>${window.formatCurrency(invoice.summary.calculatedTotal)}</td>
                <td>${window.formatCurrency(supplierBalances[supplier])}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    return html;
}

function loadInventoryDetail(hkd, period) {
    const aggregatedStock = getAggregatedStock(hkd);
    const stockItems = Object.values(aggregatedStock).filter(item => item.quantity > 0);

    let html = `
        <h4>Sổ Chi Tiết Hàng Hóa - Kỳ ${period}</h4>
        <table class="table">
            <thead>
                <tr>
                    <th>MSP</th>
                    <th>Tên hàng hóa</th>
                    <th>ĐVT</th>
                    <th>Số lượng tồn</th>
                    <th>Đơn giá TB</th>
                    <th>Thành tiền</th>
                </tr>
            </thead>
            <tbody>
    `;

    stockItems.forEach(item => {
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

    html += '</tbody></table>';
    return html;
}

// Hàm in ấn
function printGeneralJournal() {
    alert('Chức năng in nhật ký chung đang được phát triển');
}

function printGeneralLedger(accountCode = '') {
    alert('Chức năng in sổ cái đang được phát triển');
}

function printAccountLedger() {
    alert('Chức năng in sổ chi tiết tài khoản đang được phát triển');
}

function printFinancialReports() {
    alert('Chức năng in báo cáo tài chính đang được phát triển');
}

// Exports toàn cục
window.initSoSachModule = initSoSachModule;
window.loadGeneralJournal = loadGeneralJournal;
window.loadLedgerDetail = loadLedgerDetail;
window.loadAccountDetailData = loadAccountDetailData;