// Module quản lý số dư đầu kỳ
function initSoDuDauKyModule() {
    // Lắng nghe sự kiện lưu số dư đầu kỳ
    const saveButton = document.getElementById('save-opening-balance');
    if (saveButton) {
        saveButton.addEventListener('click', saveOpeningBalance);
    }

    // Lắng nghe sự kiện in số dư đầu kỳ
    const printButton = document.getElementById('print-opening-balance');
    if (printButton) {
        printButton.addEventListener('click', printOpeningBalance);
    }

    // Lắng nghe sự kiện thêm tài sản
    const addAssetButton = document.getElementById('add-fixed-asset');
    if (addAssetButton) {
        addAssetButton.addEventListener('click', showAddFixedAssetModal);
    }

    // Tải dữ liệu số dư đầu kỳ nếu có
    loadOpeningBalance();
    loadFixedAssets();
}

function saveOpeningBalance() {
    if (!window.currentCompany) {
        alert('Vui lòng chọn công ty trước.');
        return;
    }

    const openingBalance = {
        stock: parseFloat(document.getElementById('opening-stock').value) || 0,
        cash: parseFloat(document.getElementById('opening-cash').value) || 0,
        bank: parseFloat(document.getElementById('opening-bank').value) || 0,
        receivable: parseFloat(document.getElementById('opening-receivable').value) || 0,
        payable: parseFloat(document.getElementById('opening-payable').value) || 0,
        updatedAt: new Date().toISOString()
    };

    // Lưu vào dữ liệu công ty
    const hkd = window.hkdData[window.currentCompany];
    hkd.openingBalance = openingBalance;

    // Tạo bút toán kế toán cho số dư đầu kỳ
    createOpeningBalanceAccountingEntries(openingBalance);

    alert('Đã lưu số dư đầu kỳ thành công!');
    
    // Lưu dữ liệu
    if (typeof window.saveData === 'function') {
        window.saveData();
    }
}

function loadOpeningBalance() {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) return;

    const hkd = window.hkdData[window.currentCompany];
    const openingBalance = hkd.openingBalance;

    if (openingBalance) {
        document.getElementById('opening-stock').value = openingBalance.stock || '';
        document.getElementById('opening-cash').value = openingBalance.cash || '';
        document.getElementById('opening-bank').value = openingBalance.bank || '';
        document.getElementById('opening-receivable').value = openingBalance.receivable || '';
        document.getElementById('opening-payable').value = openingBalance.payable || '';
    }
}

function showAddFixedAssetModal() {
    const modalContent = `
        <div class="form-grid">
            <div class="form-group">
                <label for="asset-name">Tên tài sản</label>
                <input type="text" id="asset-name" class="form-control" placeholder="Nhập tên tài sản">
            </div>
            <div class="form-group">
                <label for="asset-code">Mã tài sản</label>
                <input type="text" id="asset-code" class="form-control" placeholder="Nhập mã tài sản">
            </div>
            <div class="form-group">
                <label for="asset-value">Nguyên giá</label>
                <input type="number" id="asset-value" class="form-control" placeholder="Nhập nguyên giá">
            </div>
            <div class="form-group">
                <label for="asset-depreciation">Khấu hao lũy kế</label>
                <input type="number" id="asset-depreciation" class="form-control" placeholder="Nhập khấu hao lũy kế">
            </div>
            <div class="form-group">
                <label for="asset-purchase-date">Ngày mua</label>
                <input type="date" id="asset-purchase-date" class="form-control">
            </div>
        </div>
        <div style="text-align: right; margin-top: 20px;">
            <button id="save-fixed-asset" class="btn-success">Lưu Tài Sản</button>
            <button class="btn-secondary" onclick="document.getElementById('custom-modal').style.display = 'none'">Hủy</button>
        </div>
    `;

    window.showModal('Thêm Tài Sản Cố Định', modalContent);

    document.getElementById('save-fixed-asset').addEventListener('click', saveFixedAsset);
}

function saveFixedAsset() {
    const asset = {
        name: document.getElementById('asset-name').value,
        code: document.getElementById('asset-code').value,
        value: parseFloat(document.getElementById('asset-value').value) || 0,
        depreciation: parseFloat(document.getElementById('asset-depreciation').value) || 0,
        purchaseDate: document.getElementById('asset-purchase-date').value,
        netValue: 0
    };

    asset.netValue = asset.value - asset.depreciation;

    if (!asset.name || !asset.code) {
        alert('Vui lòng nhập đầy đủ thông tin tài sản.');
        return;
    }

    // Lưu tài sản vào dữ liệu
    const hkd = window.hkdData[window.currentCompany];
    if (!hkd.fixedAssets) {
        hkd.fixedAssets = [];
    }
    
    hkd.fixedAssets.push(asset);
    loadFixedAssets();

    document.getElementById('custom-modal').style.display = 'none';
    alert('Đã thêm tài sản cố định thành công!');
    
    // Lưu dữ liệu
    if (typeof window.saveData === 'function') {
        window.saveData();
    }
}

function loadFixedAssets() {
    const container = document.getElementById('fixed-assets-container');
    if (!container) return;

    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Vui lòng chọn công ty</p>';
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const fixedAssets = hkd.fixedAssets || [];

    if (fixedAssets.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Chưa có tài sản cố định nào</p>';
        return;
    }

    let html = `
        <table class="table">
            <thead>
                <tr>
                    <th>Mã TS</th>
                    <th>Tên tài sản</th>
                    <th>Nguyên giá</th>
                    <th>Khấu hao</th>
                    <th>Giá trị còn lại</th>
                    <th>Ngày mua</th>
                    <th>Thao tác</th>
                </tr>
            </thead>
            <tbody>
    `;

    fixedAssets.forEach((asset, index) => {
        html += `
            <tr>
                <td>${asset.code}</td>
                <td>${asset.name}</td>
                <td>${window.formatCurrency(asset.value)}</td>
                <td>${window.formatCurrency(asset.depreciation)}</td>
                <td>${window.formatCurrency(asset.netValue)}</td>
                <td>${window.formatDate(asset.purchaseDate)}</td>
                <td>
                    <button class="btn-sm btn-danger" onclick="deleteFixedAsset(${index})">Xóa</button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function deleteFixedAsset(index) {
    if (!confirm('Bạn có chắc chắn muốn xóa tài sản này?')) return;

    const hkd = window.hkdData[window.currentCompany];
    hkd.fixedAssets.splice(index, 1);
    loadFixedAssets();
    
    // Lưu dữ liệu
    if (typeof window.saveData === 'function') {
        window.saveData();
    }
}

function createOpeningBalanceAccountingEntries(balance) {
    const hkd = window.hkdData[window.currentCompany];
    if (!hkd.accountingTransactions) {
        hkd.accountingTransactions = [];
    }

    const transactionDate = new Date().toISOString().split('T')[0];
    const transactionId = `OPEN_${Date.now()}`;

    // Tạo các bút toán số dư đầu kỳ
    const entries = [];

    // Tồn kho (156)
    if (balance.stock > 0) {
        entries.push({
            account: '156',
            debit: balance.stock,
            credit: 0,
            description: 'Số dư tồn kho đầu kỳ'
        });
    }

    // Tiền mặt (111)
    if (balance.cash > 0) {
        entries.push({
            account: '111',
            debit: balance.cash,
            credit: 0,
            description: 'Số dư tiền mặt đầu kỳ'
        });
    }

    // Tiền gửi ngân hàng (112)
    if (balance.bank > 0) {
        entries.push({
            account: '112',
            debit: balance.bank,
            credit: 0,
            description: 'Số dư tiền gửi ngân hàng đầu kỳ'
        });
    }

    // Công nợ phải thu (131)
    if (balance.receivable > 0) {
        entries.push({
            account: '131',
            debit: balance.receivable,
            credit: 0,
            description: 'Số dư công nợ phải thu đầu kỳ'
        });
    }

    // Công nợ phải trả (331)
    if (balance.payable > 0) {
        entries.push({
            account: '331',
            debit: 0,
            credit: balance.payable,
            description: 'Số dư công nợ phải trả đầu kỳ'
        });
    }

    // Thêm vào nhật ký chung
    entries.forEach(entry => {
        hkd.accountingTransactions.push({
            id: transactionId,
            date: transactionDate,
            type: 'OPENING_BALANCE',
            account: entry.account,
            debit: entry.debit,
            credit: entry.credit,
            description: entry.description,
            reference: 'SỐ_DƯ_ĐẦU_KỲ'
        });
    });
}

function printOpeningBalance() {
    if (!window.currentCompany) {
        alert('Vui lòng chọn công ty trước.');
        return;
    }

    const hkd = window.hkdData[window.currentCompany];
    const openingBalance = hkd.openingBalance;
    const fixedAssets = hkd.fixedAssets || [];

    let printContent = `
        <html>
        <head>
            <title>Bảng Số Dư Đầu Kỳ</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .company-name { font-size: 18px; font-weight: bold; }
                .report-title { font-size: 16px; margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                th { background-color: #f0f0f0; }
                .text-right { text-align: right; }
                .total-row { font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-name">${hkd.name}</div>
                <div class="report-title">BẢNG SỐ DƯ ĐẦU KỲ</div>
                <div>Ngày in: ${new Date().toLocaleDateString('vi-VN')}</div>
            </div>
    `;

    // Bảng số dư tài khoản
    if (openingBalance) {
        printContent += `
            <h3>Số Dư Tài Khoản</h3>
            <table>
                <thead>
                    <tr>
                        <th>Tài khoản</th>
                        <th>Tên tài khoản</th>
                        <th>Số dư</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (openingBalance.stock > 0) {
            printContent += `
                <tr>
                    <td>156</td>
                    <td>Hàng hóa tồn kho</td>
                    <td class="text-right">${window.formatCurrency(openingBalance.stock)}</td>
                </tr>
            `;
        }

        if (openingBalance.cash > 0) {
            printContent += `
                <tr>
                    <td>111</td>
                    <td>Tiền mặt</td>
                    <td class="text-right">${window.formatCurrency(openingBalance.cash)}</td>
                </tr>
            `;
        }

        if (openingBalance.bank > 0) {
            printContent += `
                <tr>
                    <td>112</td>
                    <td>Tiền gửi ngân hàng</td>
                    <td class="text-right">${window.formatCurrency(openingBalance.bank)}</td>
                </tr>
            `;
        }

        if (openingBalance.receivable > 0) {
            printContent += `
                <tr>
                    <td>131</td>
                    <td>Phải thu khách hàng</td>
                    <td class="text-right">${window.formatCurrency(openingBalance.receivable)}</td>
                </tr>
            `;
        }

        if (openingBalance.payable > 0) {
            printContent += `
                <tr>
                    <td>331</td>
                    <td>Phải trả người bán</td>
                    <td class="text-right">${window.formatCurrency(openingBalance.payable)}</td>
                </tr>
            `;
        }

        printContent += '</tbody></table>';
    }

    // Bảng tài sản cố định
    if (fixedAssets.length > 0) {
        printContent += `
            <h3>Tài Sản Cố Định</h3>
            <table>
                <thead>
                    <tr>
                        <th>Mã TS</th>
                        <th>Tên tài sản</th>
                        <th>Nguyên giá</th>
                        <th>Khấu hao</th>
                        <th>Giá trị còn lại</th>
                        <th>Ngày mua</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let totalValue = 0;
        let totalDepreciation = 0;
        let totalNetValue = 0;

        fixedAssets.forEach(asset => {
            totalValue += asset.value;
            totalDepreciation += asset.depreciation;
            totalNetValue += asset.netValue;

            printContent += `
                <tr>
                    <td>${asset.code}</td>
                    <td>${asset.name}</td>
                    <td class="text-right">${window.formatCurrency(asset.value)}</td>
                    <td class="text-right">${window.formatCurrency(asset.depreciation)}</td>
                    <td class="text-right">${window.formatCurrency(asset.netValue)}</td>
                    <td>${window.formatDate(asset.purchaseDate)}</td>
                </tr>
            `;
        });

        printContent += `
                <tr class="total-row">
                    <td colspan="2">Tổng cộng</td>
                    <td class="text-right">${window.formatCurrency(totalValue)}</td>
                    <td class="text-right">${window.formatCurrency(totalDepreciation)}</td>
                    <td class="text-right">${window.formatCurrency(totalNetValue)}</td>
                    <td></td>
                </tr>
            </tbody>
            </table>
        `;
    }

    printContent += '</body></html>';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

// Exports toàn cục
window.initSoDuDauKyModule = initSoDuDauKyModule;
window.saveOpeningBalance = saveOpeningBalance;
window.printOpeningBalance = printOpeningBalance;