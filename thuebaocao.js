// Module quản lý thuế và báo cáo
function initThueBaoCaoModule() {
    // Tải sổ thuế GTGT đầu vào
    loadVATInputList();
    
    // Tải sổ thuế GTGT đầu ra
    loadVATOutputList();
    
    // Tải tổng hợp thuế
    loadVATSummary();
    
    // Tải báo cáo tài chính
    loadFinancialReports();
}

function showTaxTab(tabName) {
    // Ẩn tất cả các tab
    document.querySelectorAll('.tax-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Bỏ active tất cả các nút
    document.querySelectorAll('.tax-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Hiển thị tab được chọn
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Active nút được chọn
    document.querySelector(`.tax-tab-btn[onclick="showTaxTab('${tabName}')"]`).classList.add('active');
}

function showFinancialTab(tabName) {
    // Ẩn tất cả các tab
    document.querySelectorAll('.financial-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Bỏ active tất cả các nút
    document.querySelectorAll('.financial-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Hiển thị tab được chọn
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Active nút được chọn
    document.querySelector(`.financial-tab-btn[onclick="showFinancialTab('${tabName}')"]`).classList.add('active');
}

function loadVATInputList() {
    const vatInputList = document.getElementById('vat-input-list');
    if (!vatInputList) return;

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        vatInputList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Vui lòng chọn công ty</td></tr>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const invoices = hkd.invoices || [];

    vatInputList.innerHTML = '';

    if (invoices.length === 0) {
        vatInputList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Chưa có hóa đơn đầu vào</td></tr>';
        return;
    }

    // Nhóm hóa đơn theo kỳ (tháng)
    const invoicesByPeriod = {};
    
    invoices.forEach(invoice => {
        const period = invoice.invoiceInfo.date.substring(0, 7); // YYYY-MM
        
        if (!invoicesByPeriod[period]) {
            invoicesByPeriod[period] = [];
        }
        
        invoicesByPeriod[period].push(invoice);
    });

    Object.keys(invoicesByPeriod).sort().reverse().forEach(period => {
        const periodInvoices = invoicesByPeriod[period];
        
        periodInvoices.forEach(invoice => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${period}</td>
                <td>${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</td>
                <td>${window.formatDate(invoice.invoiceInfo.date)}</td>
                <td>${invoice.sellerInfo.taxCode}</td>
                <td>${window.formatCurrency(invoice.summary.calculatedAmountAfterDiscount)}</td>
                <td>${window.formatCurrency(invoice.summary.calculatedTax)}</td>
                <td>${window.formatCurrency(invoice.summary.calculatedTotal)}</td>
            `;
            
            vatInputList.appendChild(row);
        });
    });
}

function loadVATOutputList() {
    const vatOutputList = document.getElementById('vat-output-list');
    if (!vatOutputList) return;

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        vatOutputList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Vui lòng chọn công ty</td></tr>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const saleInvoices = hkd.saleInvoices || [];

    vatOutputList.innerHTML = '';

    if (saleInvoices.length === 0) {
        vatOutputList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Chưa có hóa đơn đầu ra</td></tr>';
        return;
    }

    // Nhóm hóa đơn theo kỳ (tháng)
    const invoicesByPeriod = {};
    
    saleInvoices.forEach(invoice => {
        const period = invoice.date.substring(0, 7); // YYYY-MM
        
        if (!invoicesByPeriod[period]) {
            invoicesByPeriod[period] = [];
        }
        
        invoicesByPeriod[period].push(invoice);
    });

    Object.keys(invoicesByPeriod).sort().reverse().forEach(period => {
        const periodInvoices = invoicesByPeriod[period];
        
        periodInvoices.forEach(invoice => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${period}</td>
                <td>${invoice.id}</td>
                <td>${window.formatDate(invoice.date)}</td>
                <td>-</td>
                <td>${window.formatCurrency(invoice.totalAmount - invoice.taxAmount)}</td>
                <td>${window.formatCurrency(invoice.taxAmount)}</td>
                <td>${window.formatCurrency(invoice.totalAmount)}</td>
            `;
            
            vatOutputList.appendChild(row);
        });
    });
}

function loadVATSummary() {
    const container = document.getElementById('vat-summary-container');
    if (!container) return;

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Vui lòng chọn công ty</p>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const currentDate = new Date();
    const currentPeriod = currentDate.toISOString().substring(0, 7); // YYYY-MM

    // Tính tổng hợp thuế GTGT
    let totalVATInput = 0;
    let totalVATOutput = 0;
    
    // Thuế đầu vào từ hóa đơn mua hàng
    (hkd.invoices || []).forEach(invoice => {
        if (invoice.invoiceInfo.date.startsWith(currentPeriod)) {
            totalVATInput += invoice.summary.calculatedTax;
        }
    });
    
    // Thuế đầu ra từ hóa đơn bán hàng
    (hkd.saleInvoices || []).forEach(invoice => {
        if (invoice.date.startsWith(currentPeriod)) {
            totalVATOutput += invoice.taxAmount;
        }
    });
    
    const vatPayable = totalVATOutput - totalVATInput;
    
    let html = `
        <div class="card">
            <div class="card-header">Tổng Hợp Thuế GTGT Kỳ ${currentPeriod}</div>
            <table class="table">
                <tr>
                    <th>Chỉ tiêu</th>
                    <th>Giá trị</th>
                </tr>
                <tr>
                    <td>Thuế GTGT đầu vào</td>
                    <td>${window.formatCurrency(totalVATInput)}</td>
                </tr>
                <tr>
                    <td>Thuế GTGT đầu ra</td>
                    <td>${window.formatCurrency(totalVATOutput)}</td>
                </tr>
                <tr style="font-weight: bold;">
                    <td>Thuế GTGT phải nộp</td>
                    <td style="color: ${vatPayable > 0 ? '#e74c3c' : '#27ae60'}">
                        ${window.formatCurrency(Math.max(0, vatPayable))}
                    </td>
                </tr>
                <tr>
                    <td>Thuế GTGT được khấu trừ chuyển kỳ sau</td>
                    <td>${window.formatCurrency(Math.max(0, -vatPayable))}</td>
                </tr>
            </table>
        </div>
        
        <div class="card">
            <div class="card-header">Thuế TNDN & TNCN</div>
            <table class="table">
                <tr>
                    <th>Loại thuế</th>
                    <th>Số phải nộp</th>
                    <th>Hạn nộp</th>
                </tr>
                <tr>
                    <td>Thuế TNDN tạm tính</td>
                    <td>${window.formatCurrency(calculateCorporateTax(hkd))}</td>
                    <td>${getNextQuarterDeadline()}</td>
                </tr>
                <tr>
                    <td>Thuế TNCN</td>
                    <td>${window.formatCurrency(calculatePersonalIncomeTax(hkd))}</td>
                    <td>20/${(currentDate.getMonth() + 2) % 12 || 12}/${currentDate.getFullYear()}</td>
                </tr>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

function calculateCorporateTax(hkd) {
    // Tính thuế TNDN tạm tính (20% trên lợi nhuận)
    const saleOrders = hkd.saleOrders || [];
    let totalProfit = 0;
    
    saleOrders.forEach(order => {
        if (order.status === 'completed') {
            totalProfit += order.profit || 0;
        }
    });
    
    return totalProfit * 0.2; // 20% thuế TNDN
}

function calculatePersonalIncomeTax(hkd) {
    // Giả sử thuế TNCN cố định (trong thực tế sẽ tính theo biểu thuế lũy tiến)
    return 5000000; // 5 triệu VND
}

function getNextQuarterDeadline() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    let nextQuarterMonth = 0;
    
    if (currentMonth <= 3) nextQuarterMonth = 4;
    else if (currentMonth <= 6) nextQuarterMonth = 7;
    else if (currentMonth <= 9) nextQuarterMonth = 10;
    else nextQuarterMonth = 1;
    
    const year = nextQuarterMonth === 1 ? currentDate.getFullYear() + 1 : currentDate.getFullYear();
    return `30/${nextQuarterMonth}/${year}`;
}

function loadFinancialReports() {
    loadBalanceSheet();
    loadTransactionBalance();
    loadProfitLoss();
}

function loadBalanceSheet() {
    const balanceSheetList = document.getElementById('balance-sheet-list');
    if (!balanceSheetList) return;

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        balanceSheetList.innerHTML = '<tr><td colspan="8" style="text-align: center;">Vui lòng chọn công ty</td></tr>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const transactions = hkd.accountingTransactions || [];
    
    // Tính số dư các tài khoản
    const accountBalances = {};
    
    transactions.forEach(transaction => {
        if (!accountBalances[transaction.account]) {
            accountBalances[transaction.account] = {
                debit: 0,
                credit: 0
            };
        }
        
        accountBalances[transaction.account].debit += transaction.debit;
        accountBalances[transaction.account].credit += transaction.credit;
    });
    
    balanceSheetList.innerHTML = '';

    // Danh sách tài khoản cơ bản
    const accounts = [
        { code: '111', name: 'Tiền mặt' },
        { code: '112', name: 'Tiền gửi ngân hàng' },
        { code: '131', name: 'Phải thu khách hàng' },
        { code: '133', name: 'Thuế GTGT được khấu trừ' },
        { code: '156', name: 'Hàng hóa' },
        { code: '211', name: 'TSCĐ hữu hình' },
        { code: '331', name: 'Phải trả người bán' },
        { code: '333', name: 'Thuế và các khoản phải nộp' },
        { code: '411', name: 'Vốn chủ sở hữu' },
        { code: '511', name: 'Doanh thu bán hàng' },
        { code: '632', name: 'Giá vốn hàng bán' },
        { code: '641', name: 'Chi phí bán hàng' },
        { code: '642', name: 'Chi phí quản lý DN' }
    ];

    accounts.forEach(account => {
        const balance = accountBalances[account.code] || { debit: 0, credit: 0 };
        const endingDebit = Math.max(0, balance.debit - balance.credit);
        const endingCredit = Math.max(0, balance.credit - balance.debit);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${account.code}</td>
            <td>${account.name}</td>
            <td>0</td>
            <td>0</td>
            <td>${window.formatCurrency(balance.debit)}</td>
            <td>${window.formatCurrency(balance.credit)}</td>
            <td>${window.formatCurrency(endingDebit)}</td>
            <td>${window.formatCurrency(endingCredit)}</td>
        `;
        
        balanceSheetList.appendChild(row);
    });
}

function loadTransactionBalance() {
    const transactionBalanceList = document.getElementById('transaction-balance-list');
    if (!transactionBalanceList) return;

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        transactionBalanceList.innerHTML = '<tr><td colspan="4" style="text-align: center;">Vui lòng chọn công ty</td></tr>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const transactions = hkd.accountingTransactions || [];
    
    // Tính phát sinh các tài khoản
    const accountTransactions = {};
    
    transactions.forEach(transaction => {
        if (!accountTransactions[transaction.account]) {
            accountTransactions[transaction.account] = {
                debit: 0,
                credit: 0
            };
        }
        
        accountTransactions[transaction.account].debit += transaction.debit;
        accountTransactions[transaction.account].credit += transaction.credit;
    });
    
    transactionBalanceList.innerHTML = '';

    // Danh sách tài khoản có phát sinh
    Object.keys(accountTransactions).sort().forEach(accountCode => {
        const transaction = accountTransactions[accountCode];
        const accountName = getAccountName(accountCode);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${accountCode}</td>
            <td>${accountName}</td>
            <td>${window.formatCurrency(transaction.debit)}</td>
            <td>${window.formatCurrency(transaction.credit)}</td>
        `;
        
        transactionBalanceList.appendChild(row);
    });
}

function loadProfitLoss() {
    const profitLossList = document.getElementById('profit-loss-list');
    if (!profitLossList) return;

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        profitLossList.innerHTML = '<tr><td colspan="2" style="text-align: center;">Vui lòng chọn công ty</td></tr>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    
    // Tính toán kết quả kinh doanh
    const saleOrders = hkd.saleOrders || [];
    let totalRevenue = 0;
    let totalCost = 0;
    let totalExpense = 0;
    
    saleOrders.forEach(order => {
        if (order.status === 'completed') {
            totalRevenue += order.totalAmount || 0;
            totalCost += order.totalCost || 0;
        }
    });
    
    // Giả sử chi phí cố định
    totalExpense = 10000000; // 10 triệu VND
    
    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalExpense;
    
    profitLossList.innerHTML = '';
    
    const indicators = [
        { name: 'Doanh thu bán hàng', value: totalRevenue },
        { name: 'Giá vốn hàng bán', value: totalCost },
        { name: 'Lợi nhuận gộp', value: grossProfit },
        { name: 'Chi phí quản lý', value: totalExpense },
        { name: 'Lợi nhuận thuần', value: netProfit }
    ];
    
    indicators.forEach(indicator => {
        const row = document.createElement('tr');
        const isProfit = indicator.name.includes('Lợi nhuận');
        
        row.innerHTML = `
            <td>${indicator.name}</td>
            <td style="font-weight: ${isProfit ? 'bold' : 'normal'}; color: ${isProfit && indicator.value < 0 ? '#e74c3c' : 'inherit'}">
                ${window.formatCurrency(indicator.value)}
            </td>
        `;
        
        profitLossList.appendChild(row);
    });
}

function getAccountName(accountCode) {
    const accountNames = {
        '111': 'Tiền mặt',
        '112': 'Tiền gửi ngân hàng',
        '131': 'Phải thu khách hàng',
        '133': 'Thuế GTGT được khấu trừ',
        '156': 'Hàng hóa',
        '211': 'TSCĐ hữu hình',
        '331': 'Phải trả người bán',
        '333': 'Thuế và các khoản phải nộp',
        '411': 'Vốn chủ sở hữu',
        '511': 'Doanh thu bán hàng',
        '632': 'Giá vốn hàng bán',
        '641': 'Chi phí bán hàng',
        '642': 'Chi phí quản lý DN'
    };
    
    return accountNames[accountCode] || 'Tài khoản khác';
}

// Hàm in ấn
function printVATDeclaration() {
    alert('Chức năng in tờ khai thuế GTGT đang được phát triển');
}

function printCorporateTaxReport() {
    alert('Chức năng in báo cáo thuế TNDN đang được phát triển');
}

function printFinancialStatements() {
    alert('Chức năng in báo cáo tài chính đang được phát triển');
}

// Exports toàn cục
window.initThueBaoCaoModule = initThueBaoCaoModule;
window.showTaxTab = showTaxTab;
window.showFinancialTab = showFinancialTab;
window.loadVATSummary = loadVATSummary;