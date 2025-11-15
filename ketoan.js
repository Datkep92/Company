// =======================
// MODULE KẾ TOÁN HOÀN CHỈNH THEO CHUẨN VAS
// =======================

// Danh mục tài khoản theo Thông tư 200/TT-BTC
const CHART_OF_ACCOUNTS = {
    // Tài sản ngắn hạn
    '111': { name: 'Tiền mặt', type: 'asset', category: 'current_asset' },
    '112': { name: 'Tiền gửi ngân hàng', type: 'asset', category: 'current_asset' },
    '131': { name: 'Phải thu khách hàng', type: 'asset', category: 'current_asset' },
    '133': { name: 'Thuế GTGT được khấu trừ', type: 'asset', category: 'current_asset' },
    '136': { name: 'Phải thu nội bộ', type: 'asset', category: 'current_asset' },
    '138': { name: 'Phải thu khác', type: 'asset', category: 'current_asset' },
    '141': { name: 'Tạm ứng', type: 'asset', category: 'current_asset' },
    '151': { name: 'Hàng mua đang đi đường', type: 'asset', category: 'current_asset' },
    '152': { name: 'Nguyên liệu, vật liệu', type: 'asset', category: 'current_asset' },
    '153': { name: 'Công cụ, dụng cụ', type: 'asset', category: 'current_asset' },
    '154': { name: 'Chi phí sản xuất kinh doanh dở dang', type: 'asset', category: 'current_asset' },
    '155': { name: 'Thành phẩm', type: 'asset', category: 'current_asset' },
    '156': { name: 'Hàng hóa', type: 'asset', category: 'current_asset' },
    '157': { name: 'Hàng gửi đi bán', type: 'asset', category: 'current_asset' },
    
    // Tài sản dài hạn
    '211': { name: 'Tài sản cố định hữu hình', type: 'asset', category: 'fixed_asset' },
    '214': { name: 'Hao mòn TSCĐ', type: 'asset', category: 'fixed_asset', is_contra: true },
    
    // Nợ phải trả
    '331': { name: 'Phải trả người bán', type: 'liability', category: 'current_liability' },
    '333': { name: 'Thuế và các khoản phải nộp Nhà nước', type: 'liability', category: 'current_liability' },
    '3331': { name: 'Thuế GTGT phải nộp', type: 'liability', category: 'current_liability' },
    '3332': { name: 'Thuế tiêu thụ đặc biệt', type: 'liability', category: 'current_liability' },
    '3333': { name: 'Thuế xuất nhập khẩu', type: 'liability', category: 'current_liability' },
    '3334': { name: 'Thuế thu nhập doanh nghiệp', type: 'liability', category: 'current_liability' },
    '3335': { name: 'Thuế thu nhập cá nhân', type: 'liability', category: 'current_liability' },
    '3336': { name: 'Thuế tài nguyên', type: 'liability', category: 'current_liability' },
    '3337': { name: 'Thuế nhà đất, tiền thuê đất', type: 'liability', category: 'current_liability' },
    '3338': { name: 'Các loại thuế khác', type: 'liability', category: 'current_liability' },
    '3339': { name: 'Phí, lệ phí và các khoản phải nộp khác', type: 'liability', category: 'current_liability' },
    '334': { name: 'Phải trả người lao động', type: 'liability', category: 'current_liability' },
    '335': { name: 'Chi phí phải trả', type: 'liability', category: 'current_liability' },
    '338': { name: 'Phải trả, phải nộp khác', type: 'liability', category: 'current_liability' },
    
    // Vốn chủ sở hữu
    '411': { name: 'Vốn đầu tư của chủ sở hữu', type: 'equity', category: 'equity' },
    '421': { name: 'Lợi nhuận chưa phân phối', type: 'equity', category: 'equity' },
    
    // Doanh thu
    '511': { name: 'Doanh thu bán hàng và cung cấp dịch vụ', type: 'revenue', category: 'revenue' },
    '515': { name: 'Doanh thu hoạt động tài chính', type: 'revenue', category: 'revenue' },
    '521': { name: 'Các khoản giảm trừ doanh thu', type: 'revenue', category: 'revenue', is_contra: true },
    
    // Chi phí
    '632': { name: 'Giá vốn hàng bán', type: 'expense', category: 'cost_of_goods_sold' },
    '641': { name: 'Chi phí bán hàng', type: 'expense', category: 'operating_expense' },
    '642': { name: 'Chi phí quản lý doanh nghiệp', type: 'expense', category: 'operating_expense' },
    '635': { name: 'Chi phí tài chính', type: 'expense', category: 'financial_expense' },
    '811': { name: 'Chi phí khác', type: 'expense', category: 'other_expense' }
};

class AccountingSystem {
    constructor(taxCode) {
        this.taxCode = taxCode;
        this.journalEntries = [];
        this.generalLedger = {};
        this.initLedger();
    }

    initLedger() {
        // Khởi tạo sổ cái cho tất cả tài khoản
        Object.keys(CHART_OF_ACCOUNTS).forEach(account => {
            this.generalLedger[account] = {
                account: account,
                name: CHART_OF_ACCOUNTS[account].name,
                type: CHART_OF_ACCOUNTS[account].type,
                debit: 0,
                credit: 0,
                balance: 0,
                transactions: []
            };
        });
    }

    // Hàm hạch toán nghiệp vụ mua hàng nhập kho
    recordPurchase(invoice, taxCode) {
        const entry = {
            id: `PE-${Date.now()}`,
            date: invoice.invoiceInfo.date,
            description: `Mua hàng từ ${invoice.sellerInfo.name} - HĐ ${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}`,
            reference: invoice.originalFileId,
            transactions: []
        };

        // Phân loại sản phẩm để hạch toán
        let inventoryAmount = 0;    // Hàng hóa thường
        let discountAmount = 0;     // Chiết khấu
        let promotionAmount = 0;    // Khuyến mãi
        let inputVAT = 0;           // VAT đầu vào

        invoice.products.forEach(product => {
            if (product.category === 'hang_hoa') {
                inventoryAmount += product.amount || 0;
                inputVAT += product.taxAmount || 0;
            } else if (product.category === 'chiet_khau') {
                discountAmount += Math.abs(product.amount || 0);
            } else if (product.category === 'khuyen_mai') {
                promotionAmount += product.amount || 0;
            }
        });

        // Định khoản nghiệp vụ mua hàng
        if (inventoryAmount > 0) {
            // Nợ 156 - Hàng hóa
            entry.transactions.push({
                account: '156',
                debit: inventoryAmount,
                credit: 0,
                description: 'Nhập kho hàng hóa'
            });
        }

        if (inputVAT > 0) {
            // Nợ 133 - Thuế GTGT được khấu trừ
            entry.transactions.push({
                account: '133',
                debit: inputVAT,
                credit: 0,
                description: 'VAT đầu vào được khấu trừ'
            });
        }

        if (discountAmount > 0) {
            // Có 521 - Chiết khấu thương mại
            entry.transactions.push({
                account: '521',
                debit: 0,
                credit: discountAmount,
                description: 'Chiết khấu thương mại được hưởng'
            });
        }

        // Có 331 - Phải trả người bán (tổng giá trị thanh toán)
        const totalPayable = inventoryAmount + inputVAT - discountAmount;
        entry.transactions.push({
            account: '331',
            debit: 0,
            credit: totalPayable,
            description: 'Phải trả nhà cung cấp'
        });

        this.journalEntries.push(entry);
        this.postToLedger(entry);
        
        console.log('✅ Đã hạch toán nghiệp vụ mua hàng:', entry);
        return entry;
    }

    // Hàm hạch toán nghiệp vụ xuất hàng bán
    recordSale(exportRecord, taxCode) {
        const entry = {
            id: `SE-${Date.now()}`,
            date: exportRecord.date,
            description: `Xuất bán hàng - Phiếu ${exportRecord.id}`,
            reference: exportRecord.id,
            transactions: []
        };

        const totalCost = exportRecord.totalValue || 0;

        // Định khoản nghiệp vụ xuất bán
        // Nợ 632 - Giá vốn hàng bán
        entry.transactions.push({
            account: '632',
            debit: totalCost,
            credit: 0,
            description: 'Giá vốn hàng xuất bán'
        });

        // Có 156 - Hàng hóa
        entry.transactions.push({
            account: '156',
            debit: 0,
            credit: totalCost,
            description: 'Xuất kho hàng bán'
        });

        this.journalEntries.push(entry);
        this.postToLedger(entry);
        
        console.log('✅ Đã hạch toán nghiệp vụ xuất bán:', entry);
        return entry;
    }

    // Hàm hạch toán nghiệp vụ thu tiền
    recordCashReceipt(amount, description, customer = '') {
        const entry = {
            id: `CR-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            description: description,
            reference: '',
            transactions: []
        };

        // Nợ 111/112 - Tiền mặt/Tiền gửi ngân hàng
        entry.transactions.push({
            account: '111',
            debit: amount,
            credit: 0,
            description: 'Thu tiền ' + description
        });

        // Có 131 - Phải thu khách hàng hoặc 511 - Doanh thu
        entry.transactions.push({
            account: customer ? '131' : '511',
            debit: 0,
            credit: amount,
            description: customer ? `Thu nợ ${customer}` : 'Doanh thu bán hàng'
        });

        this.journalEntries.push(entry);
        this.postToLedger(entry);
        
        return entry;
    }

    // Hàm hạch toán nghiệp vụ chi tiền
    recordCashPayment(amount, description, supplier = '') {
        const entry = {
            id: `CP-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            description: description,
            reference: '',
            transactions: []
        };

        // Nợ 331 - Phải trả nhà cung cấp hoặc 641/642 - Chi phí
        entry.transactions.push({
            account: supplier ? '331' : '641',
            debit: amount,
            credit: 0,
            description: supplier ? `Trả nợ ${supplier}` : description
        });

        // Có 111/112 - Tiền mặt/Tiền gửi ngân hàng
        entry.transactions.push({
            account: '111',
            debit: 0,
            credit: amount,
            description: 'Chi tiền ' + description
        });

        this.journalEntries.push(entry);
        this.postToLedger(entry);
        
        return entry;
    }

    // Phân loại vào sổ cái
    postToLedger(entry) {
        entry.transactions.forEach(transaction => {
            const account = this.generalLedger[transaction.account];
            if (account) {
                account.debit += transaction.debit;
                account.credit += transaction.credit;
                
                // Tính số dư
                if (account.type === 'asset' || account.type === 'expense') {
                    account.balance = account.debit - account.credit;
                } else {
                    account.balance = account.credit - account.debit;
                }

                account.transactions.push({
                    date: entry.date,
                    description: entry.description,
                    debit: transaction.debit,
                    credit: transaction.credit,
                    reference: entry.reference
                });
            }
        });
    }

    // Lấy số dư tài khoản
    getAccountBalance(accountNumber) {
        const account = this.generalLedger[accountNumber];
        return account ? account.balance : 0;
    }

    // Kiểm tra cân đối số phát sinh
    checkTrialBalance() {
        let totalDebit = 0;
        let totalCredit = 0;

        Object.values(this.generalLedger).forEach(account => {
            totalDebit += account.debit;
            totalCredit += account.credit;
        });

        return {
            totalDebit,
            totalCredit,
            isBalanced: totalDebit === totalCredit,
            difference: Math.abs(totalDebit - totalCredit)
        };
    }

    // Báo cáo kết quả kinh doanh
    generateIncomeStatement(startDate, endDate) {
        const revenue = this.getAccountBalance('511') - this.getAccountBalance('521');
        const costOfGoodsSold = this.getAccountBalance('632');
        const operatingExpenses = this.getAccountBalance('641') + this.getAccountBalance('642');
        const financialExpenses = this.getAccountBalance('635');
        const otherExpenses = this.getAccountBalance('811');

        const grossProfit = revenue - costOfGoodsSold;
        const operatingProfit = grossProfit - operatingExpenses;
        const netProfit = operatingProfit - financialExpenses - otherExpenses;

        return {
            revenue,
            costOfGoodsSold,
            grossProfit,
            operatingExpenses,
            operatingProfit,
            financialExpenses,
            otherExpenses,
            netProfit,
            period: { startDate, endDate }
        };
    }

    // Bảng cân đối kế toán
    generateBalanceSheet(asOfDate) {
        // Tài sản
        const currentAssets = 
            this.getAccountBalance('111') + 
            this.getAccountBalance('112') + 
            this.getAccountBalance('131') + 
            this.getAccountBalance('133') + 
            this.getAccountBalance('156');
        
        const fixedAssets = 
            this.getAccountBalance('211') - 
            this.getAccountBalance('214');

        const totalAssets = currentAssets + fixedAssets;

        // Nợ phải trả
        const currentLiabilities = 
            this.getAccountBalance('331') + 
            this.getAccountBalance('333') + 
            this.getAccountBalance('334');

        const totalLiabilities = currentLiabilities;

        // Vốn chủ sở hữu
        const equity = 
            this.getAccountBalance('411') + 
            this.getAccountBalance('421');

        return {
            assets: {
                currentAssets,
                fixedAssets,
                totalAssets
            },
            liabilities: {
                currentLiabilities,
                totalLiabilities
            },
            equity: {
                capital: this.getAccountBalance('411'),
                retainedEarnings: this.getAccountBalance('421'),
                totalEquity: equity
            },
            asOfDate,
            isBalanced: totalAssets === (totalLiabilities + equity)
        };
    }

    // Sổ nhật ký chung
    getGeneralJournal(startDate = null, endDate = null) {
        let entries = this.journalEntries;

        if (startDate && endDate) {
            entries = entries.filter(entry => 
                entry.date >= startDate && entry.date <= endDate
            );
        }

        return entries;
    }

    // Sổ cái chi tiết
    getGeneralLedger(accountNumber, startDate = null, endDate = null) {
        const account = this.generalLedger[accountNumber];
        if (!account) return null;

        let transactions = account.transactions;

        if (startDate && endDate) {
            transactions = transactions.filter(t => 
                t.date >= startDate && t.date <= endDate
            );
        }

        return {
            account: accountNumber,
            name: account.name,
            openingBalance: 0,
            transactions,
            closingBalance: account.balance
        };
    }
}

// Quản lý hệ thống kế toán cho từng công ty
window.accountingSystems = {};

// Hàm lấy hệ thống kế toán của công ty hiện tại
function getCurrentAccountingSystem() {
    if (!window.currentCompany) {
        console.warn('Chưa chọn công ty');
        return null;
    }
    
    if (!window.accountingSystems[window.currentCompany]) {
        window.accountingSystems[window.currentCompany] = new AccountingSystem(window.currentCompany);
        console.log(`✅ Đã khởi tạo hệ thống kế toán cho công ty: ${window.currentCompany}`);
    }
    
    return window.accountingSystems[window.currentCompany];
}

// Hàm lấy hệ thống kế toán theo MST
function getAccountingSystem(taxCode) {
    if (!taxCode) return null;
    
    if (!window.accountingSystems[taxCode]) {
        window.accountingSystems[taxCode] = new AccountingSystem(taxCode);
    }
    return window.accountingSystems[taxCode];
}

// Hàm khởi tạo hệ thống kế toán từ dữ liệu đã lưu
function initAccountingFromSavedData() {
    if (!window.hkdData) return;
    
    Object.keys(window.hkdData).forEach(taxCode => {
        const company = window.hkdData[taxCode];
        if (company.accountingData) {
            // Khôi phục dữ liệu kế toán từ localStorage
            window.accountingSystems[taxCode] = new AccountingSystem(taxCode);
            const accountingSystem = window.accountingSystems[taxCode];
            
            accountingSystem.journalEntries = company.accountingData.journalEntries || [];
            accountingSystem.generalLedger = company.accountingData.generalLedger || {};
            
            console.log(`✅ Đã khôi phục dữ liệu kế toán cho công ty: ${taxCode}`);
        }
    });
}

// Hàm lưu dữ liệu kế toán vào hkdData
function saveAccountingData() {
    if (!window.hkdData || !window.accountingSystems) return;
    
    Object.keys(window.accountingSystems).forEach(taxCode => {
        const accountingSystem = window.accountingSystems[taxCode];
        if (accountingSystem && window.hkdData[taxCode]) {
            window.hkdData[taxCode].accountingData = {
                journalEntries: accountingSystem.journalEntries,
                generalLedger: accountingSystem.generalLedger,
                lastUpdated: new Date().toISOString()
            };
        }
    });
}

// File: ketoan.js

function integrateStockAdjustment(adjustmentEntry) {
    const system = getCurrentAccountingSystem();
    const isIncrease = adjustmentEntry.amount > 0;
    const absAmount = Math.abs(adjustmentEntry.amount);
    
    if (absAmount === 0) return;

    const transaction = {
        date: adjustmentEntry.date,
        description: adjustmentEntry.description,
        reference: adjustmentEntry.id,
        details: []
    };
    
    // ... (Giữ nguyên logic tạo bút toán Nợ/Có)
    if (isIncrease) {
        // Nợ 156 / Có 711
        transaction.details.push({
            debitAccount: '156', 
            creditAccount: '711', 
            amount: absAmount,
            description: `Điều chỉnh tăng tồn kho ${adjustmentEntry.msp} (Thừa). Chi tiết: ${adjustmentEntry.description}`
        });
    } else {
        // Nợ 632 / Có 156
        transaction.details.push({
            debitAccount: '632', 
            creditAccount: '156', 
            amount: absAmount,
            description: `Điều chỉnh giảm tồn kho ${adjustmentEntry.msp} (Thiếu/Hỏng). Chi tiết: ${adjustmentEntry.description}`
        });
    }

    // Ghi nhận bút toán vào sổ nhật ký chung và sổ cái
    system.generalJournal.push(transaction);
    transaction.details.forEach(detail => {
        system.ledger.recordEntry(detail.debitAccount, transaction.date, transaction.description, detail.amount, 'debit', transaction.reference);
        system.ledger.recordEntry(detail.creditAccount, transaction.date, transaction.description, detail.amount, 'credit', transaction.reference);
    });

    // Cập nhật lại thống kê và LƯU DỮ LIỆU BẮT BUỘC
    window.updateAccountingStats();
    window.saveAccountingData(); // <--- ĐÃ THÊM LƯU DỮ LIỆU BẮT BUỘC

    if (typeof window.showToast === 'function') {
        window.showToast(`✅ Đã tích hợp bút toán điều chỉnh kho (TK 156).`, 3000, 'success');
    }
}
// Tích hợp tự động khi nhập hóa đơn
function integratePurchaseAccounting(invoice, taxCode) {
    const accountingSystem = getAccountingSystem(taxCode);
    if (!accountingSystem) {
        console.error('Không thể lấy hệ thống kế toán cho MST:', taxCode);
        return;
    }
    
    try {
        accountingSystem.recordPurchase(invoice, taxCode);
        saveAccountingData();
        console.log(`✅ Đã tích hợp hạch toán mua hàng cho công ty ${taxCode}`);
    } catch (error) {
        console.error(`❌ Lỗi hạch toán mua hàng cho công ty ${taxCode}:`, error);
    }
}

// Tích hợp tự động khi xuất hàng
function integrateSaleAccounting(exportRecord, taxCode) {
    const accountingSystem = getAccountingSystem(taxCode);
    if (!accountingSystem) {
        console.error('Không thể lấy hệ thống kế toán cho MST:', taxCode);
        return;
    }
    
    try {
        accountingSystem.recordSale(exportRecord, taxCode);
        saveAccountingData();
        console.log(`✅ Đã tích hợp hạch toán xuất bán cho công ty ${taxCode}`);
    } catch (error) {
        console.error(`❌ Lỗi hạch toán xuất bán cho công ty ${taxCode}:`, error);
    }
}

function setupAccountingUI() {
    const accountingTabs = `
        <div class="accounting-container">
            <div class="accounting-tabs">
                <button class="accounting-tab-btn active" onclick="showAccountingTab('general-ledger')">
                    📊 Sổ Cái
                </button>
                <button class="accounting-tab-btn" onclick="showAccountingTab('general-journal')">
                    📝 Nhật Ký Chung
                </button>
                <button class="accounting-tab-btn" onclick="showAccountingTab('balance-sheet')">
                    ⚖️ CĐKT
                </button>
                <button class="accounting-tab-btn" onclick="showAccountingTab('income-statement')">
                    💰 KQKD
                </button>
                <button class="accounting-tab-btn" onclick="showAccountingTab('trial-balance')">
                    🎯 Cân Đối TK
                </button>
            </div>
            
            <div id="accounting-tab-content" class="accounting-tab-content">
                <div class="accounting-card">
                    <div class="accounting-card-header">
                        🏢 Hệ Thống Kế Toán
                    </div>
                    <div class="accounting-card-body">
                        <div style="text-align: center; padding: 40px;">
                            <div style="font-size: 48px; margin-bottom: 20px;">📈</div>
                            <h3>Chào mừng đến với Hệ thống Kế toán</h3>
                            <p style="color: #6c757d; margin-top: 10px;">
                                Chọn một tab ở trên để xem thông tin kế toán của công ty
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const keToanTab = document.getElementById('ke-toan');
    if (keToanTab) {
        const existingTabs = keToanTab.querySelector('.accounting-tabs');
        if (!existingTabs) {
            keToanTab.querySelector('.content-body').innerHTML = accountingTabs;
        }
    }
}

function showAccountingTab(tabName) {
    const contentDiv = document.getElementById('accounting-tab-content');
    if (!contentDiv) return;

    // Cập nhật active state cho các nút tab
    document.querySelectorAll('.accounting-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Tìm và active nút tab được click
    const activeBtn = document.querySelector(`.accounting-tab-btn[onclick*="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    switch(tabName) {
        case 'general-ledger':
            showGeneralLedger();
            break;
        case 'general-journal':
            showGeneralJournal();
            break;
        case 'balance-sheet':
            showBalanceSheet();
            break;
        case 'income-statement':
            showIncomeStatement();
            break;
        case 'trial-balance':
            showTrialBalance();
            break;
        default:
            showGeneralLedger();
    }
}

function showGeneralJournal() {
    const contentDiv = document.getElementById('accounting-tab-content');
    const accountingSystem = getCurrentAccountingSystem();
    
    if (!accountingSystem) {
        contentDiv.innerHTML = '<div class="card"><div class="card-header">Thông báo</div><p>Vui lòng chọn công ty để xem sổ kế toán.</p></div>';
        return;
    }
    
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const journalEntries = accountingSystem.getGeneralJournal(firstDay, lastDay);
    
    let html = `
        <div class="card">
            <div class="card-header">Sổ Nhật Ký Chung - ${window.hkdData[window.currentCompany]?.name || window.currentCompany} - Tháng ${now.getMonth() + 1}/${now.getFullYear()}</div>
    `;

    if (journalEntries.length === 0) {
        html += `<p style="text-align: center; padding: 20px;">Chưa có nghiệp vụ kế toán nào trong tháng này.</p>`;
    } else {
        html += `
            <table class="table">
                <thead>
                    <tr>
                        <th>Ngày</th>
                        <th>Chứng từ</th>
                        <th>Diễn giải</th>
                        <th>Tài khoản</th>
                        <th>Phát sinh Nợ</th>
                        <th>Phát sinh Có</th>
                    </tr>
                </thead>
                <tbody>
        `;

        journalEntries.forEach(entry => {
            entry.transactions.forEach((transaction, index) => {
                html += `
                    <tr>
                        <td>${index === 0 ? window.formatDate(entry.date) : ''}</td>
                        <td>${index === 0 ? entry.reference : ''}</td>
                        <td>${index === 0 ? entry.description : ''}</td>
                        <td>${transaction.account} - ${CHART_OF_ACCOUNTS[transaction.account]?.name || ''}</td>
                        <td>${transaction.debit > 0 ? window.formatCurrency(transaction.debit) : ''}</td>
                        <td>${transaction.credit > 0 ? window.formatCurrency(transaction.credit) : ''}</td>
                    </tr>
                `;
            });
            
            html += `<tr style="height: 10px; background-color: #f8f9fa;"><td colspan="6"></td></tr>`;
        });

        html += `</tbody></table>`;
    }

    html += `</div>`;
    contentDiv.innerHTML = html;
}

function showGeneralLedger() {
    const contentDiv = document.getElementById('accounting-tab-content');
    const accountingSystem = getCurrentAccountingSystem();
    
    if (!accountingSystem) {
        contentDiv.innerHTML = `
            <div class="accounting-card">
                <div class="accounting-card-header">📊 Thông báo</div>
                <div class="accounting-card-body">
                    <p style="text-align: center; padding: 20px; color: #6c757d;">
                        Vui lòng chọn công ty để xem sổ kế toán.
                    </p>
                </div>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="accounting-card">
            <div class="accounting-card-header">📊 Sổ Cái Tổng Hợp - ${window.hkdData[window.currentCompany]?.name || window.currentCompany}</div>
            <div class="accounting-card-body">
    `;

    const hasData = Object.values(accountingSystem.generalLedger).some(account => account.debit > 0 || account.credit > 0);
    
    if (!hasData) {
        html += `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 20px;">📋</div>
                <h4>Chưa có số liệu kế toán</h4>
                <p style="color: #6c757d;">Dữ liệu sẽ xuất hiện khi bạn nhập hóa đơn hoặc xuất hàng.</p>
            </div>
        `;
    } else {
        html += `
            <div style="overflow-x: auto;">
                <table class="accounting-table">
                    <thead>
                        <tr>
                            <th>Tài khoản</th>
                            <th>Tên tài khoản</th>
                            <th>Dư nợ</th>
                            <th>Dư có</th>
                            <th>Số dư</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        Object.values(accountingSystem.generalLedger).forEach(account => {
            if (account.debit > 0 || account.credit > 0) {
                const balanceType = account.type === 'asset' || account.type === 'expense' ? 
                    (account.balance > 0 ? 'Nợ' : account.balance < 0 ? 'Có' : '') :
                    (account.balance > 0 ? 'Có' : account.balance < 0 ? 'Nợ' : '');
                
                const badgeClass = balanceType === 'Nợ' ? 'balance-badge balance-debit' : 'balance-badge balance-credit';
                    
                html += `
                    <tr>
                        <td><strong>${account.account}</strong></td>
                        <td>${account.name}</td>
                        <td style="text-align: right;">${window.formatCurrency(account.debit)}</td>
                        <td style="text-align: right;">${window.formatCurrency(account.credit)}</td>
                        <td style="text-align: right;">
                            ${window.formatCurrency(Math.abs(account.balance))} 
                            <span class="${badgeClass}">${balanceType}</span>
                        </td>
                        <td>
                            <button class="accounting-btn accounting-btn-info" onclick="showAccountDetail('${account.account}')">
                                👁️ Chi tiết
                            </button>
                        </td>
                    </tr>
                `;
            }
        });

        html += `</tbody></table></div>`;
    }

    html += `</div></div>`;
    contentDiv.innerHTML = html;
}
function showAccountDetail(accountNumber) {
    const accountingSystem = getCurrentAccountingSystem();
    if (!accountingSystem) {
        alert('Vui lòng chọn công ty.');
        return;
    }

    const ledger = accountingSystem.getGeneralLedger(accountNumber);
    if (!ledger) {
        alert('Không tìm thấy tài khoản: ' + accountNumber);
        return;
    }

    // Sử dụng CHART_OF_ACCOUNTS đã có sẵn
    const accountInfo = CHART_OF_ACCOUNTS[accountNumber];
    if (!accountInfo) {
        alert('Không tìm thấy thông tin tài khoản: ' + accountNumber);
        return;
    }

    let detailHtml = `
        <div class="accounting-card">
            <div class="accounting-card-header">Sổ Cái Chi Tiết - TK ${accountNumber} - ${ledger.name}</div>
            <div class="accounting-card-body">
                <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                    <strong>Loại tài khoản:</strong> ${accountInfo.type || 'Không xác định'} | 
                    <strong>Phân loại:</strong> ${accountInfo.category || 'Không xác định'}
                </div>
                <table class="accounting-table">
                    <thead>
                        <tr>
                            <th>Ngày</th>
                            <th>Diễn giải</th>
                            <th>Số hiệu CT</th>
                            <th>Nợ</th>
                            <th>Có</th>
                            <th>Số dư</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    let runningBalance = 0;
    const accountType = accountInfo.type || 'asset';
    
    ledger.transactions.forEach(transaction => {
        if (accountType === 'asset' || accountType === 'expense') {
            runningBalance += transaction.debit - transaction.credit;
        } else {
            runningBalance += transaction.credit - transaction.debit;
        }

        const balanceType = runningBalance > 0 ? 
            (accountType === 'asset' || accountType === 'expense' ? 'Nợ' : 'Có') :
            (runningBalance < 0 ? (accountType === 'asset' || accountType === 'expense' ? 'Có' : 'Nợ') : '');

        detailHtml += `
            <tr>
                <td>${window.formatDate(transaction.date)}</td>
                <td>${transaction.description}</td>
                <td>${transaction.reference}</td>
                <td>${transaction.debit > 0 ? window.formatCurrency(transaction.debit) : ''}</td>
                <td>${transaction.credit > 0 ? window.formatCurrency(transaction.credit) : ''}</td>
                <td>${window.formatCurrency(Math.abs(runningBalance))} ${balanceType}</td>
            </tr>
        `;
    });

    detailHtml += `
                    </tbody>
                </table>
                <div style="text-align: right; margin-top: 10px; font-weight: bold;">
                    Số dư cuối kỳ: ${window.formatCurrency(Math.abs(ledger.closingBalance))} 
                    ${ledger.closingBalance > 0 ? 
                        (accountType === 'asset' || accountType === 'expense' ? 'Nợ' : 'Có') : 
                        (ledger.closingBalance < 0 ? (accountType === 'asset' || accountType === 'expense' ? 'Có' : 'Nợ') : '')}
                </div>
            </div>
        </div>
    `;

    window.showModal(`Sổ Cái TK ${accountNumber}`, detailHtml);
}

function showBalanceSheet() {
    const contentDiv = document.getElementById('accounting-tab-content');
    const accountingSystem = getCurrentAccountingSystem();
    
    if (!accountingSystem) {
        contentDiv.innerHTML = '<div class="card"><div class="card-header">Thông báo</div><p>Vui lòng chọn công ty để xem báo cáo.</p></div>';
        return;
    }
    
    const balanceSheet = accountingSystem.generateBalanceSheet(new Date().toISOString().split('T')[0]);
    
    let html = `
        <div class="card">
            <div class="card-header">Bảng Cân Đối Kế Toán - ${window.hkdData[window.currentCompany]?.name || window.currentCompany} - ${window.formatDate(balanceSheet.asOfDate)}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h4>TÀI SẢN</h4>
                    <table class="table">
                        <tr>
                            <td><strong>A. TÀI SẢN NGẮN HẠN</strong></td>
                            <td style="text-align: right;">${window.formatCurrency(balanceSheet.assets.currentAssets)}</td>
                        </tr>
                        <tr>
                            <td><strong>B. TÀI SẢN DÀI HẠN</strong></td>
                            <td style="text-align: right;">${window.formatCurrency(balanceSheet.assets.fixedAssets)}</td>
                        </tr>
                        <tr style="border-top: 2px solid #333; font-weight: bold;">
                            <td><strong>TỔNG CỘNG TÀI SẢN</strong></td>
                            <td style="text-align: right;">${window.formatCurrency(balanceSheet.assets.totalAssets)}</td>
                        </tr>
                    </table>
                </div>
                <div>
                    <h4>NGUỒN VỐN</h4>
                    <table class="table">
                        <tr>
                            <td><strong>A. NỢ PHẢI TRẢ</strong></td>
                            <td style="text-align: right;">${window.formatCurrency(balanceSheet.liabilities.totalLiabilities)}</td>
                        </tr>
                        <tr>
                            <td><strong>B. VỐN CHỦ SỞ HỮU</strong></td>
                            <td style="text-align: right;">${window.formatCurrency(balanceSheet.equity.totalEquity)}</td>
                        </tr>
                        <tr style="border-top: 2px solid #333; font-weight: bold;">
                            <td><strong>TỔNG CỘNG NGUỒN VỐN</strong></td>
                            <td style="text-align: right;">${window.formatCurrency(balanceSheet.liabilities.totalLiabilities + balanceSheet.equity.totalEquity)}</td>
                        </tr>
                    </table>
                </div>
            </div>
            <div style="margin-top: 20px; text-align: center; color: ${balanceSheet.isBalanced ? 'green' : 'red'};">
                <strong>${balanceSheet.isBalanced ? '✓ CÂN ĐỐI' : '✗ KHÔNG CÂN ĐỐI'}</strong>
            </div>
        </div>
    `;

    contentDiv.innerHTML = html;
}

function showIncomeStatement() {
    const contentDiv = document.getElementById('accounting-tab-content');
    const accountingSystem = getCurrentAccountingSystem();
    
    if (!accountingSystem) {
        contentDiv.innerHTML = '<div class="card"><div class="card-header">Thông báo</div><p>Vui lòng chọn công ty để xem báo cáo.</p></div>';
        return;
    }
    
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const incomeStatement = accountingSystem.generateIncomeStatement(firstDay, lastDay);
    
    let html = `
        <div class="card">
            <div class="card-header">Báo Cáo Kết Quả Kinh Doanh - ${window.hkdData[window.currentCompany]?.name || window.currentCompany} - Tháng ${now.getMonth() + 1}/${now.getFullYear()}</div>
            <table class="table">
                <tr>
                    <td><strong>1. Doanh thu bán hàng và cung cấp dịch vụ</strong></td>
                    <td style="text-align: right;">${window.formatCurrency(incomeStatement.revenue)}</td>
                </tr>
                <tr>
                    <td><strong>2. Giá vốn hàng bán</strong></td>
                    <td style="text-align: right;">(${window.formatCurrency(incomeStatement.costOfGoodsSold)})</td>
                </tr>
                <tr style="border-top: 1px solid #333; font-weight: bold;">
                    <td><strong>LỢI NHUẬN GỘP</strong></td>
                    <td style="text-align: right;">${window.formatCurrency(incomeStatement.grossProfit)}</td>
                </tr>
                <tr>
                    <td>3. Chi phí bán hàng</td>
                    <td style="text-align: right;">(${window.formatCurrency(incomeStatement.operatingExpenses)})</td>
                </tr>
                <tr style="border-top: 1px solid #333; font-weight: bold;">
                    <td><strong>LỢI NHUẬN THUẦN TỪ HOẠT ĐỘNG KINH DOANH</strong></td>
                    <td style="text-align: right;">${window.formatCurrency(incomeStatement.operatingProfit)}</td>
                </tr>
                <tr>
                    <td>4. Chi phí tài chính</td>
                    <td style="text-align: right;">(${window.formatCurrency(incomeStatement.financialExpenses)})</td>
                </tr>
                <tr>
                    <td>5. Chi phí khác</td>
                    <td style="text-align: right;">(${window.formatCurrency(incomeStatement.otherExpenses)})</td>
                </tr>
                <tr style="border-top: 2px solid #333; font-weight: bold; background-color: #f8f9fa;">
                    <td><strong>LỢI NHUẬN SAU THUẾ</strong></td>
                    <td style="text-align: right;">${window.formatCurrency(incomeStatement.netProfit)}</td>
                </tr>
            </table>
        </div>
    `;

    contentDiv.innerHTML = html;
}

function showTrialBalance() {
    const contentDiv = document.getElementById('accounting-tab-content');
    const accountingSystem = getCurrentAccountingSystem();
    
    if (!accountingSystem) {
        contentDiv.innerHTML = '<div class="card"><div class="card-header">Thông báo</div><p>Vui lòng chọn công ty để xem báo cáo.</p></div>';
        return;
    }
    
    const trialBalance = accountingSystem.checkTrialBalance();
    
    let html = `
        <div class="card">
            <div class="card-header">Bảng Cân Đối Số Phát Sinh - ${window.hkdData[window.currentCompany]?.name || window.currentCompany}</div>
            <table class="table">
                <thead>
                    <tr>
                        <th>Tài khoản</th>
                        <th>Tên tài khoản</th>
                        <th>Phát sinh Nợ</th>
                        <th>Phát sinh Có</th>
                    </tr>
                </thead>
                <tbody>
    `;

    Object.values(accountingSystem.generalLedger).forEach(account => {
        if (account.debit > 0 || account.credit > 0) {
            html += `
                <tr>
                    <td>${account.account}</td>
                    <td>${account.name}</td>
                    <td>${window.formatCurrency(account.debit)}</td>
                    <td>${window.formatCurrency(account.credit)}</td>
                </tr>
            `;
        }
    });

    html += `
                </tbody>
                <tfoot style="border-top: 2px solid #333; font-weight: bold;">
                    <tr>
                        <td colspan="2"><strong>TỔNG CỘNG</strong></td>
                        <td>${window.formatCurrency(trialBalance.totalDebit)}</td>
                        <td>${window.formatCurrency(trialBalance.totalCredit)}</td>
                    </tr>
                </tfoot>
            </table>
            <div style="text-align: center; margin-top: 20px; color: ${trialBalance.isBalanced ? 'green' : 'red'};">
                <strong>${trialBalance.isBalanced ? '✓ CÂN ĐỐI' : `✗ KHÔNG CÂN ĐỐI - Chênh lệch: ${window.formatCurrency(trialBalance.difference)}`}</strong>
            </div>
        </div>
    `;

    contentDiv.innerHTML = html;
}

// =======================
// THỐNG KÊ VÀ BÁO CÁO
// =======================

function updateAccountingStats() {
    const statsContainer = document.getElementById('accounting-stats');
    if (!statsContainer || !window.currentCompany || !hkdData[window.currentCompany]) return;

    const hkd = hkdData[window.currentCompany];
    
    // DEBUG: Kiểm tra dữ liệu
    console.log('🔍 Kiểm tra thống kê kế toán:', {
        company: window.currentCompany,
        hasTransactions: !!hkd.accountingTransactions,
        transactionCount: hkd.accountingTransactions ? hkd.accountingTransactions.length : 0
    });

    if (!hkd.accountingTransactions || hkd.accountingTransactions.length === 0) {
        statsContainer.innerHTML = `
            <div class="stats-grid-accounting">
                <div class="stat-card-accounting">
                    <div class="stat-icon">📊</div>
                    <div class="stat-value-accounting">0</div>
                    <div class="stat-label-accounting">Tổng nghiệp vụ</div>
                </div>
                <div class="stat-card-accounting">
                    <div class="stat-icon">💰</div>
                    <div class="stat-value-accounting">0</div>
                    <div class="stat-label-accounting">Tổng phát sinh</div>
                </div>
            </div>
        `;
        return;
    }

    // Tính toán thống kê
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const monthlyEntries = hkd.accountingTransactions.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getMonth() + 1 === currentMonth && entryDate.getFullYear() === currentYear;
    });

    let totalAmount = 0;
    monthlyEntries.forEach(entry => {
        entry.transactions.forEach(t => {
            totalAmount += (t.debit || 0) + (t.credit || 0);
        });
    });

    statsContainer.innerHTML = `
        <div class="stats-grid-accounting">
            <div class="stat-card-accounting">
                <div class="stat-icon">📊</div>
                <div class="stat-value-accounting">${monthlyEntries.length}</div>
                <div class="stat-label-accounting">Tổng nghiệp vụ</div>
            </div>
            <div class="stat-card-accounting">
                <div class="stat-icon">💰</div>
                <div class="stat-value-accounting">${formatCurrency(totalAmount)}</div>
                <div class="stat-label-accounting">Tổng phát sinh</div>
            </div>
        </div>
    `;
}

function generateMonthlyReport() {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        alert('Vui lòng chọn công ty để tạo báo cáo.');
        return;
    }
    
    const reportMonthInput = document.getElementById('report-month');
    const reportDataEl = document.getElementById('report-data');
    const reportContainer = document.getElementById('monthly-report');

    if (!reportMonthInput || !reportDataEl || !reportContainer) return;
    
    const [yearStr, monthStr] = reportMonthInput.value.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    if (isNaN(year) || isNaN(month)) {
        alert('Vui lòng chọn tháng hợp lệ.');
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    
    // Lọc hóa đơn theo tháng
    const monthlyInvoices = (hkd.invoices || []).filter(invoice => {
        const invoiceDate = new Date(invoice.invoiceInfo.date);
        return invoiceDate.getFullYear() === year && invoiceDate.getMonth() + 1 === month;
    });

    // Lọc xuất hàng theo tháng
    const monthlyExports = (hkd.exports || []).filter(exportRecord => {
        const exportDate = new Date(exportRecord.date);
        return exportDate.getFullYear() === year && exportDate.getMonth() + 1 === month;
    });

    // Tính toán thống kê
    let totalInvoiceValue = 0;
    let totalExportValue = 0;

    monthlyInvoices.forEach(invoice => {
        totalInvoiceValue += invoice.summary.calculatedTotal || 0;
    });

    monthlyExports.forEach(exportRecord => {
        totalExportValue += exportRecord.totalValue || 0;
    });

    const grossProfit = totalInvoiceValue - totalExportValue;

    // Tạo báo cáo
    const report = {
        'Tổng số hóa đơn nhập': monthlyInvoices.length,
        'Tổng giá trị nhập kho': totalInvoiceValue,
        'Tổng số phiếu xuất': monthlyExports.length,
        'Tổng giá trị xuất kho': totalExportValue,
        'Lợi nhuận gộp (tham khảo)': grossProfit
    };
    
    // Hiển thị báo cáo
    reportDataEl.innerHTML = '';
    
    document.getElementById('report-month-display').textContent = `${month}/${year}`;

    for (const [key, value] of Object.entries(report)) {
        const row = document.createElement('tr');
        const isCalculation = key.includes('Lợi nhuận');
        
        if (isCalculation) {
            row.style.fontWeight = 'bold';
            row.style.borderTop = '2px solid var(--primary, #007bff)';
        }
        
        const displayValue = typeof value === 'number' && value >= 1000 ? 
            window.formatCurrency(value) : value.toLocaleString('vi-VN');

        row.innerHTML = `
            <td>${key}</td>
            <td style="text-align: right;">${displayValue}</td>
        `;
        reportDataEl.appendChild(row);
    }
    
    reportContainer.classList.remove('hidden');
}

// =======================
// KHỞI TẠO MODULE
// =======================

function initAccountingModule() {
    // 1. Khởi tạo dữ liệu kế toán từ localStorage
    initAccountingFromSavedData();
    
    // 2. Tạo báo cáo theo tháng
    const generateReportButton = document.getElementById('generate-report');
    if (generateReportButton) {
        generateReportButton.addEventListener('click', function() {
            generateMonthlyReport();
        });
    }

    // 3. Thiết lập tháng mặc định
    const reportMonthInput = document.getElementById('report-month');
    if (reportMonthInput) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        reportMonthInput.value = `${year}-${month}`;
    }

    // 4. Khởi tạo giao diện kế toán
    setupAccountingUI();
    
    // 5. Cập nhật thống kê
    updateAccountingStats();
}

// =======================
// Exports toàn cục
// =======================
window.initAccountingModule = initAccountingModule;
window.updateAccountingStats = updateAccountingStats;
window.integratePurchaseAccounting = integratePurchaseAccounting;
window.integrateSaleAccounting = integrateSaleAccounting;
window.showAccountingTab = showAccountingTab;
window.showAccountDetail = showAccountDetail;
window.showGeneralJournal = showGeneralJournal;
window.showGeneralLedger = showGeneralLedger;
window.showBalanceSheet = showBalanceSheet;
window.showIncomeStatement = showIncomeStatement;
window.showTrialBalance = showTrialBalance;
window.saveAccountingData = saveAccountingData;
window.getCurrentAccountingSystem = getCurrentAccountingSystem;
window.generateMonthlyReport = generateMonthlyReport;
window.integrateStockAdjustment = integrateStockAdjustment;