
// =======================
// MODULE KẾ TOÁN NÂNG CAO - BỔ SUNG CÁC SỔ CÒN THIẾU
// =======================

// =======================
// 1. SỔ CHI TIẾT CÔNG NỢ PHẢI THU (TK 131)
// =======================

class CustomerLedger {
    constructor() {
        this.customers = new Map(); // Map<customerTaxCode, customerData>
    }

    // Thêm khách hàng mới
    addCustomer(taxCode, name, address = '') {
        if (!this.customers.has(taxCode)) {
            this.customers.set(taxCode, {
                taxCode,
                name,
                address,
                openingBalance: 0,
                debit: 0,
                credit: 0,
                balance: 0,
                transactions: []
            });
        }
        return this.customers.get(taxCode);
    }

    // Ghi nhận phát sinh công nợ
    recordTransaction(customerTaxCode, date, description, debit = 0, credit = 0, reference = '') {
        const customer = this.customers.get(customerTaxCode);
        if (!customer) return null;

        const transaction = {
            date,
            description,
            debit,
            credit,
            reference,
            balance: customer.balance + debit - credit
        };

        customer.debit += debit;
        customer.credit += credit;
        customer.balance = transaction.balance;
        customer.transactions.push(transaction);

        return transaction;
    }

    // Lấy số dư khách hàng
    getCustomerBalance(customerTaxCode) {
        const customer = this.customers.get(customerTaxCode);
        return customer ? customer.balance : 0;
    }

    // Xuất sổ chi tiết công nợ phải thu
    generateReceivableLedger(startDate = null, endDate = null) {
        const result = [];
        
        this.customers.forEach(customer => {
            let filteredTransactions = customer.transactions;
            
            if (startDate && endDate) {
                filteredTransactions = customer.transactions.filter(t => 
                    t.date >= startDate && t.date <= endDate
                );
            }

            if (filteredTransactions.length > 0 || customer.balance !== 0) {
                result.push({
                    customer: customer,
                    transactions: filteredTransactions
                });
            }
        });

        return result;
    }
}

// =======================
// 2. SỔ CHI TIẾT CÔNG NỢ PHẢI TRẢ (TK 331)
// =======================

class SupplierLedger {
    constructor() {
        this.suppliers = new Map(); // Map<supplierTaxCode, supplierData>
    }

    // Thêm nhà cung cấp mới
    addSupplier(taxCode, name, address = '') {
        if (!this.suppliers.has(taxCode)) {
            this.suppliers.set(taxCode, {
                taxCode,
                name,
                address,
                openingBalance: 0,
                debit: 0,
                credit: 0,
                balance: 0,
                transactions: []
            });
        }
        return this.suppliers.get(taxCode);
    }

    // Ghi nhận phát sinh công nợ
    recordTransaction(supplierTaxCode, date, description, debit = 0, credit = 0, reference = '') {
        const supplier = this.suppliers.get(supplierTaxCode);
        if (!supplier) return null;

        const transaction = {
            date,
            description,
            debit,
            credit,
            reference,
            balance: supplier.balance + credit - debit // Ngược với công nợ phải thu
        };

        supplier.debit += debit;
        supplier.credit += credit;
        supplier.balance = transaction.balance;
        supplier.transactions.push(transaction);

        return transaction;
    }

    // Lấy số dư nhà cung cấp
    getSupplierBalance(supplierTaxCode) {
        const supplier = this.suppliers.get(supplierTaxCode);
        return supplier ? supplier.balance : 0;
    }

    // Xuất sổ chi tiết công nợ phải trả
    generatePayableLedger(startDate = null, endDate = null) {
        const result = [];
        
        this.suppliers.forEach(supplier => {
            let filteredTransactions = supplier.transactions;
            
            if (startDate && endDate) {
                filteredTransactions = supplier.transactions.filter(t => 
                    t.date >= startDate && t.date <= endDate
                );
            }

            if (filteredTransactions.length > 0 || supplier.balance !== 0) {
                result.push({
                    supplier: supplier,
                    transactions: filteredTransactions
                });
            }
        });

        return result;
    }
}

// =======================
// 3. SỔ QUỸ TIỀN MẶT (TK 111)
// =======================

class CashBook {
    constructor() {
        this.transactions = [];
        this.openingBalance = 0;
        this.closingBalance = 0;
    }

    // Ghi nhận thu tiền mặt
    recordReceipt(date, description, amount, reference = '') {
        const transaction = {
            date,
            description,
            receipt: amount,
            payment: 0,
            reference,
            balance: this.closingBalance + amount
        };

        this.transactions.push(transaction);
        this.closingBalance = transaction.balance;
        
        return transaction;
    }

    // Ghi nhận chi tiền mặt
    recordPayment(date, description, amount, reference = '') {
        const transaction = {
            date,
            description,
            receipt: 0,
            payment: amount,
            reference,
            balance: this.closingBalance - amount
        };

        this.transactions.push(transaction);
        this.closingBalance = transaction.balance;
        
        return transaction;
    }

    // Xuất sổ quỹ tiền mặt
    generateCashBook(startDate = null, endDate = null) {
        let filteredTransactions = this.transactions;
        
        if (startDate && endDate) {
            filteredTransactions = this.transactions.filter(t => 
                t.date >= startDate && t.date <= endDate
            );
        }

        // Tính số dư đầu kỳ
        let openingBalance = this.openingBalance;
        if (startDate) {
            const previousTransactions = this.transactions.filter(t => t.date < startDate);
            openingBalance = previousTransactions.reduce((balance, t) => 
                balance + t.receipt - t.payment, this.openingBalance
            );
        }

        return {
            openingBalance,
            closingBalance: this.closingBalance,
            transactions: filteredTransactions
        };
    }
}

// =======================
// 4. SỔ CHI TIẾT THUẾ GTGT (TK 133, 3331)
// =======================

class VatLedger {
    constructor() {
        this.vatTransactions = [];
    }

    // Ghi nhận thuế GTGT đầu vào
    recordInputVAT(date, description, amount, invoiceReference = '') {
        const transaction = {
            date,
            description,
            inputVAT: amount,
            outputVAT: 0,
            reference: invoiceReference,
            type: 'input'
        };

        this.vatTransactions.push(transaction);
        return transaction;
    }

    // Ghi nhận thuế GTGT đầu ra
    recordOutputVAT(date, description, amount, invoiceReference = '') {
        const transaction = {
            date,
            description,
            inputVAT: 0,
            outputVAT: amount,
            reference: invoiceReference,
            type: 'output'
        };

        this.vatTransactions.push(transaction);
        return transaction;
    }

    // Tính số thuế được khấu trừ
    getDeductibleVAT(startDate = null, endDate = null) {
        const transactions = this.getVATTransactions(startDate, endDate);
        const totalInputVAT = transactions.reduce((sum, t) => sum + t.inputVAT, 0);
        const totalOutputVAT = transactions.reduce((sum, t) => sum + t.outputVAT, 0);
        
        return {
            totalInputVAT,
            totalOutputVAT,
            deductibleVAT: Math.max(0, totalInputVAT - totalOutputVAT),
            payableVAT: Math.max(0, totalOutputVAT - totalInputVAT)
        };
    }

    // Xuất sổ chi tiết thuế GTGT
    getVATTransactions(startDate = null, endDate = null) {
        if (!startDate && !endDate) {
            return this.vatTransactions;
        }
        
        return this.vatTransactions.filter(t => {
            if (startDate && t.date < startDate) return false;
            if (endDate && t.date > endDate) return false;
            return true;
        });
    }
}

// =======================
// 5. BÁO CÁO LƯU CHUYỂN TIỀN TỆ
// =======================

class CashFlowStatement {
    constructor(accountingSystem) {
        this.accountingSystem = accountingSystem;
    }

    generateCashFlowStatement(startDate, endDate) {
        // Lấy dữ liệu từ sổ kế toán
        const journalEntries = this.accountingSystem.getGeneralJournal(startDate, endDate);
        
        let cashFromOperations = 0;
        let cashFromInvesting = 0;
        let cashFromFinancing = 0;

        journalEntries.forEach(entry => {
            entry.transactions.forEach(transaction => {
                // Phân loại theo tài khoản
                if (this.isOperatingActivity(transaction.account)) {
                    if (transaction.debit > 0 && this.isCashAccount(transaction.account)) {
                        cashFromOperations += transaction.debit;
                    }
                    if (transaction.credit > 0 && this.isCashAccount(transaction.account)) {
                        cashFromOperations -= transaction.credit;
                    }
                }
                // Có thể mở rộng cho hoạt động đầu tư và tài chính
            });
        });

        const netCashFlow = cashFromOperations + cashFromInvesting + cashFromFinancing;

        return {
            operatingActivities: {
                cashFromOperations,
                details: this.getOperatingDetails(journalEntries)
            },
            investingActivities: {
                cashFromInvesting,
                details: this.getInvestingDetails(journalEntries)
            },
            financingActivities: {
                cashFromFinancing,
                details: this.getFinancingDetails(journalEntries)
            },
            netCashFlow,
            period: { startDate, endDate }
        };
    }

    isOperatingActivity(accountNumber) {
        const operatingAccounts = ['511', '512', '515', '521', '531', '532', '641', '642', '635'];
        return operatingAccounts.some(acc => accountNumber.startsWith(acc));
    }

    isCashAccount(accountNumber) {
        return accountNumber.startsWith('111') || accountNumber.startsWith('112');
    }

    getOperatingDetails(journalEntries) {
        // Chi tiết hoạt động kinh doanh
        const details = [];
        journalEntries.forEach(entry => {
            if (entry.description.includes('Thu tiền') || entry.description.includes('Chi tiền')) {
                details.push({
                    date: entry.date,
                    description: entry.description,
                    amount: entry.transactions.reduce((sum, t) => sum + t.debit - t.credit, 0)
                });
            }
        });
        return details;
    }

    getInvestingDetails(journalEntries) {
        // Chi tiết hoạt động đầu tư (có thể mở rộng)
        return [];
    }

    getFinancingDetails(journalEntries) {
        // Chi tiết hoạt động tài chính (có thể mở rộng)
        return [];
    }
}

// =======================
// 6. HỆ THỐNG KẾ TOÁN NÂNG CAO
// =======================

class AdvancedAccountingSystem extends AccountingSystem {
    constructor(taxCode) {
        super(taxCode);
        this.customerLedger = new CustomerLedger();
        this.supplierLedger = new SupplierLedger();
        this.cashBook = new CashBook();
        this.vatLedger = new VatLedger();
        this.cashFlowStatement = new CashFlowStatement(this);
    }

    // Ghi đè hàm hạch toán mua hàng để cập nhật sổ chi tiết
    recordPurchase(invoice, taxCode) {
        const entry = super.recordPurchase(invoice, taxCode);
        
        // Cập nhật sổ chi tiết nhà cung cấp
        const supplier = this.supplierLedger.addSupplier(
            invoice.sellerInfo.taxCode,
            invoice.sellerInfo.name,
            invoice.sellerInfo.address
        );
        
        this.supplierLedger.recordTransaction(
            invoice.sellerInfo.taxCode,
            invoice.invoiceInfo.date,
            `Mua hàng - HĐ ${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}`,
            0, // debit
            entry.transactions.find(t => t.account === '331').credit, // credit
            invoice.originalFileId
        );

        // Cập nhật sổ thuế GTGT
        const vatTransaction = entry.transactions.find(t => t.account === '133');
        if (vatTransaction && vatTransaction.debit > 0) {
            this.vatLedger.recordInputVAT(
                invoice.invoiceInfo.date,
                `VAT đầu vào - HĐ ${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}`,
                vatTransaction.debit,
                invoice.originalFileId
            );
        }

        return entry;
    }

    // Ghi đè hàm hạch toán xuất bán để cập nhật sổ chi tiết
    recordSale(exportRecord, taxCode) {
        const entry = super.recordSale(exportRecord, taxCode);
        
        // Có thể thêm logic cập nhật sổ chi tiết khách hàng ở đây
        // khi có thông tin khách hàng từ phiếu xuất

        return entry;
    }

    // Ghi đè hàm thu tiền
    recordCashReceipt(amount, description, customer = '') {
        const entry = super.recordCashReceipt(amount, description, customer);
        
        // Cập nhật sổ quỹ tiền mặt
        this.cashBook.recordReceipt(
            entry.date,
            entry.description,
            amount,
            entry.id
        );

        // Cập nhật sổ chi tiết khách hàng nếu có
        if (customer) {
            const customerTaxCode = this.extractTaxCodeFromCustomer(customer);
            if (customerTaxCode) {
                this.customerLedger.recordTransaction(
                    customerTaxCode,
                    entry.date,
                    entry.description,
                    0, // debit
                    amount, // credit
                    entry.id
                );
            }
        }

        return entry;
    }

    // Ghi đè hàm chi tiền
    recordCashPayment(amount, description, supplier = '') {
        const entry = super.recordCashPayment(amount, description, supplier);
        
        // Cập nhật sổ quỹ tiền mặt
        this.cashBook.recordPayment(
            entry.date,
            entry.description,
            amount,
            entry.id
        );

        // Cập nhật sổ chi tiết nhà cung cấp nếu có
        if (supplier) {
            const supplierTaxCode = this.extractTaxCodeFromSupplier(supplier);
            if (supplierTaxCode) {
                this.supplierLedger.recordTransaction(
                    supplierTaxCode,
                    entry.date,
                    entry.description,
                    amount, // debit
                    0, // credit
                    entry.id
                );
            }
        }

        return entry;
    }

    extractTaxCodeFromCustomer(customerInfo) {
        // Logic trích xuất MST từ thông tin khách hàng
        // Có thể cải tiến để phù hợp với cấu trúc dữ liệu thực tế
        return customerInfo.split(' ').pop(); // Giả định MST là từ cuối cùng
    }

    extractTaxCodeFromSupplier(supplierInfo) {
        // Logic trích xuất MST từ thông tin nhà cung cấp
        return supplierInfo.split(' ').pop();
    }

    // =======================
    // CÁC PHƯƠNG THỨC XUẤT BÁO CÁO MỚI
    // =======================

    // Sổ chi tiết công nợ phải thu
    getReceivableLedger(startDate = null, endDate = null) {
        return this.customerLedger.generateReceivableLedger(startDate, endDate);
    }

    // Sổ chi tiết công nợ phải trả
    getPayableLedger(startDate = null, endDate = null) {
        return this.supplierLedger.generatePayableLedger(startDate, endDate);
    }

    // Sổ quỹ tiền mặt
    getCashBook(startDate = null, endDate = null) {
        return this.cashBook.generateCashBook(startDate, endDate);
    }

    // Sổ chi tiết thuế GTGT
    getVATLedger(startDate = null, endDate = null) {
        return this.vatLedger.getVATTransactions(startDate, endDate);
    }

    // Báo cáo lưu chuyển tiền tệ
    generateCashFlowReport(startDate, endDate) {
        return this.cashFlowStatement.generateCashFlowStatement(startDate, endDate);
    }

    // Báo cáo tổng hợp công nợ
    getDebtSummary() {
        const totalReceivable = Array.from(this.customerLedger.customers.values())
            .reduce((sum, customer) => sum + customer.balance, 0);
            
        const totalPayable = Array.from(this.supplierLedger.suppliers.values())
            .reduce((sum, supplier) => sum + supplier.balance, 0);

        return {
            totalReceivable,
            totalPayable,
            netDebt: totalReceivable - totalPayable,
            customerCount: this.customerLedger.customers.size,
            supplierCount: this.supplierLedger.suppliers.size
        };
    }
}

// =======================
// TÍCH HỢP VỚI HỆ THỐNG HIỆN TẠI
// =======================

// Cập nhật hàm lấy hệ thống kế toán để sử dụng phiên bản nâng cao
function getCurrentAdvancedAccountingSystem() {
    if (!window.currentCompany) {
        console.warn('Chưa chọn công ty');
        return null;
    }
    
    if (!window.accountingSystems[window.currentCompany]) {
        window.accountingSystems[window.currentCompany] = new AdvancedAccountingSystem(window.currentCompany);
        console.log(`✅ Đã khởi tạo hệ thống kế toán NÂNG CAO cho công ty: ${window.currentCompany}`);
    } else if (!(window.accountingSystems[window.currentCompany] instanceof AdvancedAccountingSystem)) {
        // Nâng cấp hệ thống cơ bản lên nâng cao
        const basicSystem = window.accountingSystems[window.currentCompany];
        const advancedSystem = new AdvancedAccountingSystem(window.currentCompany);
        
        // Chuyển dữ liệu cơ bản sang hệ thống nâng cao
        advancedSystem.journalEntries = basicSystem.journalEntries;
        advancedSystem.generalLedger = basicSystem.generalLedger;
        
        window.accountingSystems[window.currentCompany] = advancedSystem;
        console.log(`🔄 Đã nâng cấp hệ thống kế toán lên phiên bản NÂNG CAO cho công ty: ${window.currentCompany}`);
    }
    
    return window.accountingSystems[window.currentCompany];
}

// =======================
// GIAO DIỆN NGƯỜI DÙNG CHO CÁC SỔ MỚI
// =======================

function setupAdvancedAccountingUI() {
    const accountingTabs = document.querySelector('.accounting-tabs');
    if (!accountingTabs) return;

    // Thêm các tab mới vào giao diện hiện có
    const newTabs = `
        <button class="accounting-tab-btn" onclick="showAccountingTab('receivable-ledger')">
            👥 Công Nợ Phải Thu
        </button>
        <button class="accounting-tab-btn" onclick="showAccountingTab('payable-ledger')">
            🏭 Công Nợ Phải Trả
        </button>
        <button class="accounting-tab-btn" onclick="showAccountingTab('cash-book')">
            💰 Sổ Quỹ Tiền Mặt
        </button>
        <button class="accounting-tab-btn" onclick="showAccountingTab('vat-ledger')">
            🧾 Sổ Thuế GTGT
        </button>
        <button class="accounting-tab-btn" onclick="showAccountingTab('cash-flow')">
            📈 Lưu Chuyển Tiền
        </button>
        <button class="accounting-tab-btn" onclick="showAccountingTab('debt-summary')">
            📊 Tổng Hợp Công Nợ
        </button>
    `;

    accountingTabs.innerHTML += newTabs;
}

// =======================
// HÀM HIỂN THỊ CÁC SỔ MỚI
// =======================

function showReceivableLedger() {
    const contentDiv = document.getElementById('accounting-tab-content');
    const accountingSystem = getCurrentAdvancedAccountingSystem();
    
    if (!accountingSystem) {
        contentDiv.innerHTML = '<div class="card"><div class="card-header">Thông báo</div><p>Vui lòng chọn công ty để xem sổ kế toán.</p></div>';
        return;
    }
    
    const receivableLedger = accountingSystem.getReceivableLedger();
    
    let html = `
        <div class="card">
            <div class="card-header">Sổ Chi Tiết Công Nợ Phải Thu - ${window.hkdData[window.currentCompany]?.name || window.currentCompany}</div>
    `;

    if (receivableLedger.length === 0) {
        html += `<p style="text-align: center; padding: 20px;">Chưa có phát sinh công nợ phải thu.</p>`;
    } else {
        receivableLedger.forEach(({ customer, transactions }) => {
            html += `
                <div class="card" style="margin: 10px 0;">
                    <div class="card-header" style="background: #e3f2fd;">
                        <strong>${customer.name}</strong> (MST: ${customer.taxCode}) - 
                        Số dư: <span style="color: ${customer.balance > 0 ? 'red' : 'green'}">${window.formatCurrency(customer.balance)}</span>
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Ngày</th>
                                <th>Diễn giải</th>
                                <th>Nợ</th>
                                <th>Có</th>
                                <th>Số dư</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            transactions.forEach(transaction => {
                html += `
                    <tr>
                        <td>${window.formatDate(transaction.date)}</td>
                        <td>${transaction.description}</td>
                        <td>${transaction.debit > 0 ? window.formatCurrency(transaction.debit) : ''}</td>
                        <td>${transaction.credit > 0 ? window.formatCurrency(transaction.credit) : ''}</td>
                        <td>${window.formatCurrency(transaction.balance)}</td>
                    </tr>
                `;
            });
            
            html += `</tbody></table></div>`;
        });
    }

    html += `</div>`;
    contentDiv.innerHTML = html;
}

function showPayableLedger() {
    const contentDiv = document.getElementById('accounting-tab-content');
    const accountingSystem = getCurrentAdvancedAccountingSystem();
    
    if (!accountingSystem) {
        contentDiv.innerHTML = '<div class="card"><div class="card-header">Thông báo</div><p>Vui lòng chọn công ty để xem sổ kế toán.</p></div>';
        return;
    }
    
    const payableLedger = accountingSystem.getPayableLedger();
    
    let html = `
        <div class="card">
            <div class="card-header">Sổ Chi Tiết Công Nợ Phải Trả - ${window.hkdData[window.currentCompany]?.name || window.currentCompany}</div>
    `;

    if (payableLedger.length === 0) {
        html += `<p style="text-align: center; padding: 20px;">Chưa có phát sinh công nợ phải trả.</p>`;
    } else {
        payableLedger.forEach(({ supplier, transactions }) => {
            html += `
                <div class="card" style="margin: 10px 0;">
                    <div class="card-header" style="background: #fff3cd;">
                        <strong>${supplier.name}</strong> (MST: ${supplier.taxCode}) - 
                        Số dư: <span style="color: ${supplier.balance > 0 ? 'red' : 'green'}">${window.formatCurrency(supplier.balance)}</span>
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Ngày</th>
                                <th>Diễn giải</th>
                                <th>Nợ</th>
                                <th>Có</th>
                                <th>Số dư</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            transactions.forEach(transaction => {
                html += `
                    <tr>
                        <td>${window.formatDate(transaction.date)}</td>
                        <td>${transaction.description}</td>
                        <td>${transaction.debit > 0 ? window.formatCurrency(transaction.debit) : ''}</td>
                        <td>${transaction.credit > 0 ? window.formatCurrency(transaction.credit) : ''}</td>
                        <td>${window.formatCurrency(transaction.balance)}</td>
                    </tr>
                `;
            });
            
            html += `</tbody></table></div>`;
        });
    }

    html += `</div>`;
    contentDiv.innerHTML = html;
}

function showCashBook() {
    const contentDiv = document.getElementById('accounting-tab-content');
    const accountingSystem = getCurrentAdvancedAccountingSystem();
    
    if (!accountingSystem) {
        contentDiv.innerHTML = '<div class="card"><div class="card-header">Thông báo</div><p>Vui lòng chọn công ty để xem sổ kế toán.</p></div>';
        return;
    }
    
    const cashBook = accountingSystem.getCashBook();
    
    let html = `
        <div class="card">
            <div class="card-header">Sổ Quỹ Tiền Mặt - ${window.hkdData[window.currentCompany]?.name || window.currentCompany}</div>
            <div style="padding: 15px; background: #f8f9fa; border-bottom: 1px solid #ddd;">
                <strong>Số dư đầu kỳ:</strong> ${window.formatCurrency(cashBook.openingBalance)} | 
                <strong>Số dư cuối kỳ:</strong> ${window.formatCurrency(cashBook.closingBalance)}
            </div>
    `;

    if (cashBook.transactions.length === 0) {
        html += `<p style="text-align: center; padding: 20px;">Chưa có phát sinh thu chi tiền mặt.</p>`;
    } else {
        html += `
            <table class="table">
                <thead>
                    <tr>
                        <th>Ngày</th>
                        <th>Diễn giải</th>
                        <th>Thu</th>
                        <th>Chi</th>
                        <th>Số dư</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        cashBook.transactions.forEach(transaction => {
            html += `
                <tr>
                    <td>${window.formatDate(transaction.date)}</td>
                    <td>${transaction.description}</td>
                    <td>${transaction.receipt > 0 ? window.formatCurrency(transaction.receipt) : ''}</td>
                    <td>${transaction.payment > 0 ? window.formatCurrency(transaction.payment) : ''}</td>
                    <td>${window.formatCurrency(transaction.balance)}</td>
                </tr>
            `;
        });
        
        html += `</tbody></table>`;
    }

    html += `</div>`;
    contentDiv.innerHTML = html;
}

function showVATLedger() {
    const contentDiv = document.getElementById('accounting-tab-content');
    const accountingSystem = getCurrentAdvancedAccountingSystem();
    
    if (!accountingSystem) {
        contentDiv.innerHTML = '<div class="card"><div class="card-header">Thông báo</div><p>Vui lòng chọn công ty để xem sổ kế toán.</p></div>';
        return;
    }
    
    const vatLedger = accountingSystem.getVATLedger();
    const vatSummary = accountingSystem.vatLedger.getDeductibleVAT();
    
    let html = `
        <div class="card">
            <div class="card-header">Sổ Chi Tiết Thuế GTGT - ${window.hkdData[window.currentCompany]?.name || window.currentCompany}</div>
            <div style="padding: 15px; background: #f8f9fa; border-bottom: 1px solid #ddd;">
                <strong>Tổng VAT đầu vào:</strong> ${window.formatCurrency(vatSummary.totalInputVAT)} | 
                <strong>Tổng VAT đầu ra:</strong> ${window.formatCurrency(vatSummary.totalOutputVAT)} | 
                <strong>Được khấu trừ:</strong> ${window.formatCurrency(vatSummary.deductibleVAT)} | 
                <strong>Phải nộp:</strong> ${window.formatCurrency(vatSummary.payableVAT)}
            </div>
    `;

    if (vatLedger.length === 0) {
        html += `<p style="text-align: center; padding: 20px;">Chưa có phát sinh thuế GTGT.</p>`;
    } else {
        html += `
            <table class="table">
                <thead>
                    <tr>
                        <th>Ngày</th>
                        <th>Diễn giải</th>
                        <th>VAT đầu vào</th>
                        <th>VAT đầu ra</th>
                        <th>Loại</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        vatLedger.forEach(transaction => {
            html += `
                <tr>
                    <td>${window.formatDate(transaction.date)}</td>
                    <td>${transaction.description}</td>
                    <td>${transaction.inputVAT > 0 ? window.formatCurrency(transaction.inputVAT) : ''}</td>
                    <td>${transaction.outputVAT > 0 ? window.formatCurrency(transaction.outputVAT) : ''}</td>
                    <td><span class="badge ${transaction.type === 'input' ? 'badge-info' : 'badge-warning'}">${transaction.type === 'input' ? 'Đầu vào' : 'Đầu ra'}</span></td>
                </tr>
            `;
        });
        
        html += `</tbody></table>`;
    }

    html += `</div>`;
    contentDiv.innerHTML = html;
}

function showCashFlow() {
    const contentDiv = document.getElementById('accounting-tab-content');
    const accountingSystem = getCurrentAdvancedAccountingSystem();
    
    if (!accountingSystem) {
        contentDiv.innerHTML = '<div class="card"><div class="card-header">Thông báo</div><p>Vui lòng chọn công ty để xem báo cáo.</p></div>';
        return;
    }
    
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const cashFlow = accountingSystem.generateCashFlowReport(firstDay, lastDay);
    
    let html = `
        <div class="card">
            <div class="card-header">Báo Cáo Lưu Chuyển Tiền Tệ - ${window.hkdData[window.currentCompany]?.name || window.currentCompany} - Tháng ${now.getMonth() + 1}/${now.getFullYear()}</div>
            <table class="table">
                <tr style="background: #e3f2fd;">
                    <td><strong>A. LƯU CHUYỂN TIỀN TỪ HOẠT ĐỘNG KINH DOANH</strong></td>
                    <td style="text-align: right;">${window.formatCurrency(cashFlow.operatingActivities.cashFromOperations)}</td>
                </tr>
                <tr style="background: #fff3cd;">
                    <td><strong>B. LƯU CHUYỂN TIỀN TỪ HOẠT ĐỘNG ĐẦU TƯ</strong></td>
                    <td style="text-align: right;">${window.formatCurrency(cashFlow.investingActivities.cashFromInvesting)}</td>
                </tr>
                <tr style="background: #f3e5f5;">
                    <td><strong>C. LƯU CHUYỂN TIỀN TỪ HOẠT ĐỘNG TÀI CHÍNH</strong></td>
                    <td style="text-align: right;">${window.formatCurrency(cashFlow.financingActivities.cashFromFinancing)}</td>
                </tr>
                <tr style="background: #e8f5e8; font-weight: bold; border-top: 2px solid #333;">
                    <td><strong>LƯU CHUYỂN TIỀN THUẦN TRONG KỲ</strong></td>
                    <td style="text-align: right;">${window.formatCurrency(cashFlow.netCashFlow)}</td>
                </tr>
            </table>
        </div>
    `;

    contentDiv.innerHTML = html;
}

function showDebtSummary() {
    const contentDiv = document.getElementById('accounting-tab-content');
    const accountingSystem = getCurrentAdvancedAccountingSystem();
    
    if (!accountingSystem) {
        contentDiv.innerHTML = '<div class="card"><div class="card-header">Thông báo</div><p>Vui lòng chọn công ty để xem báo cáo.</p></div>';
        return;
    }
    
    const debtSummary = accountingSystem.getDebtSummary();
    
    let html = `
        <div class="card">
            <div class="card-header">Báo Cáo Tổng Hợp Công Nợ - ${window.hkdData[window.currentCompany]?.name || window.currentCompany}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 20px;">
                <div class="card" style="background: #e3f2fd;">
                    <div class="card-header">CÔNG NỢ PHẢI THU</div>
                    <div style="padding: 15px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #1976d2;">${window.formatCurrency(debtSummary.totalReceivable)}</div>
                        <div style="margin-top: 10px;">Số lượng khách hàng: ${debtSummary.customerCount}</div>
                    </div>
                </div>
                <div class="card" style="background: #fff3cd;">
                    <div class="card-header">CÔNG NỢ PHẢI TRẢ</div>
                    <div style="padding: 15px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #f57c00;">${window.formatCurrency(debtSummary.totalPayable)}</div>
                        <div style="margin-top: 10px;">Số lượng nhà cung cấp: ${debtSummary.supplierCount}</div>
                    </div>
                </div>
            </div>
            <div class="card" style="margin-top: 20px; background: ${debtSummary.netDebt >= 0 ? '#e8f5e8' : '#ffebee'};">
                <div class="card-header">TỔNG HỢP</div>
                <div style="padding: 20px; text-align: center;">
                    <div style="font-size: 28px; font-weight: bold; color: ${debtSummary.netDebt >= 0 ? '#2e7d32' : '#c62828'};">
                        ${debtSummary.netDebt >= 0 ? '✔' : '⚠'} ${window.formatCurrency(Math.abs(debtSummary.netDebt))}
                    </div>
                    <div style="margin-top: 10px; font-size: 16px;">
                        ${debtSummary.netDebt >= 0 ? 'Công ty đang được thu' : 'Công ty đang nợ'} 
                        ${window.formatCurrency(Math.abs(debtSummary.netDebt))}
                    </div>
                </div>
            </div>
        </div>
    `;

    contentDiv.innerHTML = html;
}

// =======================
// CẬP NHẬT HÀM SHOW ACCOUNTING TAB ĐỂ BAO GỒM CÁC TAB MỚI
// =======================

const originalShowAccountingTab = window.showAccountingTab;
window.showAccountingTab = function(tabName) {
    switch(tabName) {
        case 'receivable-ledger':
            showReceivableLedger();
            break;
        case 'payable-ledger':
            showPayableLedger();
            break;
        case 'cash-book':
            showCashBook();
            break;
        case 'vat-ledger':
            showVATLedger();
            break;
        case 'cash-flow':
            showCashFlow();
            break;
        case 'debt-summary':
            showDebtSummary();
            break;
        default:
            originalShowAccountingTab(tabName);
    }
};

// =======================
// KHỞI TẠO MODULE NÂNG CAO
// =======================

function initAdvancedAccountingModule() {
    // 1. Thiết lập giao diện nâng cao
    setupAdvancedAccountingUI();
    
    // 2. Đảm bảo sử dụng hệ thống kế toán nâng cao
    getCurrentAdvancedAccountingSystem();
    
    console.log('✅ Đã khởi tạo module kế toán nâng cao');
}

// =======================
// Exports toàn cục
// =======================
window.initAdvancedAccountingModule = initAdvancedAccountingModule;
window.getCurrentAdvancedAccountingSystem = getCurrentAdvancedAccountingSystem;
window.showReceivableLedger = showReceivableLedger;
window.showPayableLedger = showPayableLedger;
window.showCashBook = showCashBook;
window.showVATLedger = showVATLedger;
window.showCashFlow = showCashFlow;
window.showDebtSummary = showDebtSummary;
