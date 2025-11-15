// =======================
// Cập nhật hàm thống kê file
// =======================
function updateFileStats(total, success, error, duplicate, stockPosted = 0) {
    document.getElementById('total-files').textContent = total;
    document.getElementById('success-count').textContent = success;
    document.getElementById('duplicate-count').textContent = duplicate;
    document.getElementById('error-count').textContent = error;
    
    // Thêm hiển thị số lượng đã chuyển kho
    const stockPostedElement = document.getElementById('stock-posted-count');
    if (stockPostedElement) {
        stockPostedElement.textContent = stockPosted;
    }
    
    document.getElementById('file-stats').classList.remove('hidden');
}


// =======================
// Hàm tạo options MSP
// =======================
function generateMSPOptions(productName, unit, category) {
    // Tạo MSP tự động
    const autoMSP = generateMSP('', productName, unit, 0, category, window.currentCompany);
    
    // Lấy tất cả MSP hiện có từ tồn kho để gợi ý
    const existingMSPs = [];
    if (window.currentCompany && hkdData[window.currentCompany]) {
        const hkd = hkdData[window.currentCompany];
        hkd.tonkhoMain.forEach(item => {
            if (!existingMSPs.includes(item.msp)) {
                existingMSPs.push(item.msp);
            }
        });
    }
    
    let options = `<option value="${autoMSP}">${autoMSP} (Tự động)</option>`;
    
    // Thêm các MSP hiện có phù hợp
    existingMSPs.forEach(msp => {
        if (msp.includes('_CK') || msp.includes('_KM')) {
            // Bỏ qua chiết khấu và khuyến mãi
            return;
        }
        options += `<option value="${msp}">${msp} (Hiện có)</option>`;
    });
    
    return options;
}

// =======================
// Hàm hiển thị popup sửa hóa đơn và nhập tồn kho (90% màn hình)
// =======================
function showFixInvoicePopup(invoiceId) {
    if (!window.currentCompany) {
        alert('Vui lòng chọn công ty.');
        return;
    }
    
    const hkd = hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === invoiceId);
    
    if (!invoice) {
        alert('Không tìm thấy hóa đơn.');
        return;
    }
    
    // Kiểm tra nếu đã chuyển kho rồi
    if (invoice.status.stockPosted) {
        alert('Hóa đơn này đã được chuyển tồn kho trước đó.');
        return;
    }
    
    // Tạo popup với 2 cột: HTML preview và bảng chỉnh sửa
    const popupContent = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; height: 70vh; overflow: hidden;">
            <!-- Cột 1: HTML Preview -->
            <div class="card" style="display: flex; flex-direction: column; height: 100%;">
                <div class="card-header">Hóa Đơn Gốc</div>
                <div style="flex: 1; overflow: auto; border: 1px solid #ddd; border-radius: 4px;">
                    ${invoice.htmlUrl ? 
                        `<iframe src="${invoice.htmlUrl}" width="100%" height="100%" style="border: none;"></iframe>` :
                        `<div style="padding: 20px; text-align: center; color: #666;">
                            <p>Không có bản xem HTML</p>
                            <p><strong>${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</strong></p>
                            <p>Ngày: ${formatDate(invoice.invoiceInfo.date)}</p>
                            <p>Nhà cung cấp: ${invoice.sellerInfo.name}</p>
                            <p>Tổng tiền: ${formatCurrency(invoice.summary.totalAfterTax)}</p>
                        </div>`
                    }
                </div>
            </div>
            
            <!-- Cột 2: Bảng chỉnh sửa -->
            <div class="card" style="display: flex; flex-direction: column; height: 100%;">
                <div class="card-header">Chỉnh Sửa & Nhập Kho</div>
                <div style="flex: 1; overflow: auto;">
                    <table class="table" style="font-size: 11px; min-width: 600px;">
                        <thead style="position: sticky; top: 0; background: white; z-index: 1;">
                            <tr>
                                <th>STT</th>
                                <th>Tên SP</th>
                                <th>ĐVT</th>
                                <th>SL</th>
                                <th>Đơn giá</th>
                                <th>Chiết khấu</th>
                                <th>Thuế (%)</th>
                                <th>Thành tiền</th>
                                <th>MSP</th>
                            </tr>
                        </thead>
                        <tbody id="edit-invoice-products">
                            ${invoice.products.map((product, index) => `
                                <tr>
                                    <td>${product.stt}</td>
                                    <td title="${product.name}" style="max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${product.name}</td>
                                    <td>${product.unit}</td>
                                    <td>${product.quantity}</td>
                                    <td>${formatCurrency(product.price)}</td>
                                    <td>
                                        <input type="number" class="discount-input" 
                                               data-index="${index}" 
                                               value="${accountingRound(product.discount)}" 
                                               style="width: 70px;">
                                    </td>
                                    <td>
                                        <input type="number" class="tax-rate-input" 
                                               data-index="${index}" 
                                               value="${product.taxRate}" 
                                               step="1" min="0" max="100" 
                                               style="width: 60px;">
                                        <div style="font-size: 9px; color: #666;">
                                            <button type="button" class="tax-adjust-btn" data-index="${index}" data-adjust="-1" style="padding: 1px 3px; font-size: 8px; margin: 1px;">-1%</button>
                                            <button type="button" class="tax-adjust-btn" data-index="${index}" data-adjust="+1" style="padding: 1px 3px; font-size: 8px; margin: 1px;">+1%</button>
                                        </div>
                                    </td>
                                    <td>
                                        <input type="number" class="amount-input" 
                                               data-index="${index}" 
                                               value="${accountingRound(product.amount)}" 
                                               style="width: 90px;">
                                    </td>
                                    <td>
                                        <select class="msp-select" data-index="${index}" style="width: 100px; font-size: 10px;">
                                            <option value="auto">Tự động</option>
                                            ${generateMSPOptions(product.name, product.unit, product.category)}
                                        </select>
                                        <div style="margin-top: 2px;">
                                            <input type="text" class="custom-msp-suffix" 
                                                   data-index="${index}" 
                                                   placeholder="Đuôi MSP" 
                                                   style="width: 80px; font-size: 10px; display: none;">
                                            <div class="msp-preview" data-index="${index}" style="font-size: 9px; color: #666; margin-top: 2px;"></div>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <!-- Tổng hợp -->
                <div class="card" style="margin-top: 10px; flex-shrink: 0;">
                    <div class="card-header">Tổng Hợp</div>
                    <table style="width: 100%; font-size: 12px;">
                        <tr>
                            <td><strong>Tổng trước thuế:</strong></td>
                            <td id="edit-total-before-tax">${formatCurrency(invoice.summary.calculatedAmountAfterDiscount)}</td>
                        </tr>
                        <tr>
                            <td><strong>Thuế GTGT:</strong></td>
                            <td id="edit-total-tax">${formatCurrency(invoice.summary.calculatedTax)}</td>
                        </tr>
                        <tr style="font-weight: bold;">
                            <td><strong>Tổng thanh toán:</strong></td>
                            <td id="edit-total-amount">${formatCurrency(invoice.summary.calculatedTotal)}</td>
                        </tr>
                        <tr>
                            <td><strong>Chênh lệch:</strong></td>
                            <td id="edit-difference" style="color: ${invoice.status.difference === 0 ? 'green' : 'red'}">
                                ${formatCurrency(invoice.status.difference)}
                            </td>
                        </tr>
                    </table>
                </div>
                
                <!-- Lựa chọn MSP -->
                <div class="card" style="margin-top: 10px; flex-shrink: 0;">
                    <div class="card-header">Lựa Chọn Nhập Kho</div>
                    <div style="font-size: 12px;">
                        <label>
                            <input type="radio" name="msp-option" value="auto" checked> 
                            Cập nhật vào MSP tự động (theo logic hiện tại)
                        </label>
                        <br>
                        <label>
                            <input type="radio" name="msp-option" value="custom"> 
                            Cập nhật vào MSP mới (tạo mã mới với đuôi tùy chỉnh)
                        </label>
                    </div>
                </div>
            </div>
        </div>
        
        <div style="text-align: right; margin-top: 15px; border-top: 1px solid #ddd; padding-top: 15px; flex-shrink: 0;">
            <button id="calculate-edit" class="btn-secondary" style="margin-right: 10px;">Tính Lại Tự Động</button>
            <button id="round-tax-edit" class="btn-secondary" style="margin-right: 10px;">Làm Tròn Thuế</button>
            <button id="save-edit-stock" class="btn-success" style="margin-right: 10px;">Lưu & Nhập Kho</button>
            <button id="cancel-edit" class="btn-danger">Hủy</button>
        </div>
    `;
    
    // Hiển thị modal 90% màn hình
    const modal = window.showModal('Chỉnh Sửa Hóa Đơn & Nhập Tồn Kho', popupContent);
    const modalContent = document.querySelector('#custom-modal > div');
    modalContent.style.width = '90%';
    modalContent.style.maxWidth = '90%';
    modalContent.style.height = '90vh';
    modalContent.style.maxHeight = '90vh';
    
    // Xử lý sự kiện chọn MSP
    document.querySelectorAll('.msp-select').forEach(select => {
        select.addEventListener('change', function() {
            const index = this.getAttribute('data-index');
            const suffixInput = document.querySelector(`.custom-msp-suffix[data-index="${index}"]`);
            const preview = document.querySelector(`.msp-preview[data-index="${index}"]`);
            
            if (this.value === 'custom') {
                suffixInput.style.display = 'block';
                // Tạo MSP mặc định với đuôi
                const product = invoice.products[index];
                const baseMSP = generateMSP('', product.name, product.unit, index, product.category, window.currentCompany);
                const defaultSuffix = '01';
                suffixInput.value = defaultSuffix;
                preview.textContent = `MSP: ${baseMSP}_${defaultSuffix}`;
                preview.style.display = 'block';
            } else {
                suffixInput.style.display = 'none';
                preview.style.display = 'none';
                suffixInput.value = '';
            }
        });
    });
    
    // Xử lý nhập đuôi MSP
    document.querySelectorAll('.custom-msp-suffix').forEach(input => {
        input.addEventListener('input', function() {
            const index = this.getAttribute('data-index');
            const preview = document.querySelector(`.msp-preview[data-index="${index}"]`);
            const product = invoice.products[index];
            const baseMSP = generateMSP('', product.name, product.unit, index, product.category, window.currentCompany);
            const suffix = this.value.trim();
            
            if (suffix) {
                preview.textContent = `MSP: ${baseMSP}_${suffix}`;
            } else {
                preview.textContent = `MSP: ${baseMSP}`;
            }
        });
    });
    
    // Xử lý điều chỉnh thuế
    document.querySelectorAll('.tax-adjust-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            const adjust = parseInt(this.getAttribute('data-adjust'));
            const taxInput = document.querySelector(`.tax-rate-input[data-index="${index}"]`);
            const currentTax = parseFloat(taxInput.value) || 0;
            const newTax = Math.max(0, Math.min(100, currentTax + adjust));
            taxInput.value = newTax;
            recalculateEditedInvoice(invoice);
        });
    });
    
    // Xử lý tính lại
    document.getElementById('calculate-edit').addEventListener('click', function() {
        recalculateEditedInvoice(invoice);
    });
    
    // Xử lý làm tròn thuế
    document.getElementById('round-tax-edit').addEventListener('click', function() {
        roundTaxForAllProducts(invoice);
    });
    
    // Xử lý lưu và nhập kho
    document.getElementById('save-edit-stock').addEventListener('click', function() {
        saveEditedInvoiceAndPostStock(invoice);
    });
    
    // Xử lý hủy
    document.getElementById('cancel-edit').addEventListener('click', function() {
        document.getElementById('custom-modal').remove();
    });
    
    // Tính toán ban đầu
    recalculateEditedInvoice(invoice);
}

// =======================
// Hàm làm tròn thuế cho tất cả sản phẩm
// =======================
function roundTaxForAllProducts(invoice) {
    let totalAdjustment = 0;
    
    invoice.products.forEach((product, index) => {
        if (product.category === 'hang_hoa') {
            const amountInput = document.querySelector(`.amount-input[data-index="${index}"]`);
            const taxInput = document.querySelector(`.tax-rate-input[data-index="${index}"]`);
            
            const amount = parseFloat(amountInput.value) || 0;
            const currentTaxRate = parseFloat(taxInput.value) || 0;
            
            if (amount > 0 && currentTaxRate > 0) {
                // Tính thuế hiện tại
                const currentTax = accountingRound(amount * currentTaxRate / 100);
                
                // Tính thuế lý tưởng (10%)
                const idealTaxRate = 10;
                const idealTax = accountingRound(amount * idealTaxRate / 100);
                
                // Điều chỉnh thuế suất để thuế làm tròn đẹp
                let adjustedTaxRate = idealTaxRate;
                if (Math.abs(currentTax - idealTax) > 1) {
                    // Tìm thuế suất gần nhất để thuế làm tròn đẹp
                    const possibleRates = [8, 9, 10, 11, 12];
                    let bestRate = currentTaxRate;
                    let minDiff = Math.abs(currentTax - idealTax);
                    
                    possibleRates.forEach(rate => {
                        const taxAmount = accountingRound(amount * rate / 100);
                        const diff = Math.abs(taxAmount - idealTax);
                        if (diff < minDiff) {
                            minDiff = diff;
                            bestRate = rate;
                        }
                    });
                    
                    adjustedTaxRate = bestRate;
                    totalAdjustment += Math.abs(adjustedTaxRate - currentTaxRate);
                }
                
                taxInput.value = adjustedTaxRate;
            }
        }
    });
    
    // Tính lại toàn bộ
    recalculateEditedInvoice(invoice);
    
    if (totalAdjustment > 0) {
        alert(`Đã điều chỉnh thuế suất cho ${totalAdjustment} sản phẩm để làm tròn thuế.`);
    } else {
        alert('Thuế suất đã tối ưu, không cần điều chỉnh.');
    }
}

// =======================
// Hàm tính lại hóa đơn sau khi chỉnh sửa (CẬP NHẬT VỚI CHIẾT KHẤU)
// =======================
function recalculateEditedInvoice(originalInvoice) {
    const products = originalInvoice.products;
    let totalAmountWithoutTax = 0;
    let totalDiscount = 0;
    let totalAmountAfterDiscount = 0;
    let totalTax = 0;
    
    products.forEach((product, index) => {
        // Lấy giá trị từ form
        const discountInput = document.querySelector(`.discount-input[data-index="${index}"]`);
        const taxRateInput = document.querySelector(`.tax-rate-input[data-index="${index}"]`);
        const amountInput = document.querySelector(`.amount-input[data-index="${index}"]`);
        
        const quantity = parseFloat(product.quantity) || 0;
        const price = parseFloat(product.price) || 0;
        const newDiscount = parseFloat(discountInput.value) || 0;
        const newTaxRate = parseFloat(taxRateInput.value) || 0;
        const newAmount = parseFloat(amountInput.value) || 0;
        
        // Tính toán lại nếu cần
        let calculatedAmount = newAmount;
        if (newAmount === 0 && quantity > 0 && price > 0) {
            // Tự động tính từ SL * Đơn giá - Chiết khấu
            calculatedAmount = accountingRound(quantity * price - newDiscount);
            amountInput.value = calculatedAmount;
        }
        
        // Tính thuế mới
        const newTaxAmount = accountingRound(calculatedAmount * newTaxRate / 100);
        
        // Cập nhật tổng
        const amountWithoutTax = accountingRound(quantity * price);
        totalAmountWithoutTax = accountingRound(totalAmountWithoutTax + amountWithoutTax);
        totalDiscount = accountingRound(totalDiscount + newDiscount);
        totalAmountAfterDiscount = accountingRound(totalAmountAfterDiscount + calculatedAmount);
        totalTax = accountingRound(totalTax + newTaxAmount);
    });
    
    const newTotal = accountingRound(totalAmountAfterDiscount + totalTax);
    const difference = accountingRound(newTotal - originalInvoice.summary.totalAfterTax);
    
    // Cập nhật UI
    document.getElementById('edit-total-before-tax').textContent = formatCurrency(totalAmountAfterDiscount);
    document.getElementById('edit-total-tax').textContent = formatCurrency(totalTax);
    document.getElementById('edit-total-amount').textContent = formatCurrency(newTotal);
    document.getElementById('edit-difference').textContent = formatCurrency(difference);
    document.getElementById('edit-difference').style.color = difference === 0 ? 'green' : difference <= 1 ? 'orange' : 'red';
    
    return {
        totalAmountWithoutTax,
        totalDiscount,
        totalAmountAfterDiscount,
        totalTax,
        total: newTotal,
        difference
    };
}

// =======================
// Hàm lưu hóa đơn đã chỉnh sửa và nhập tồn kho (CẬP NHẬT VỚI MSP MỚI)
// =======================
function saveEditedInvoiceAndPostStock(originalInvoice) {
    const recalculation = recalculateEditedInvoice(originalInvoice);
    
    // Kiểm tra chênh lệch
    if (recalculation.difference !== 0) {
        const confirmSave = confirm(`Vẫn còn chênh lệch ${formatCurrency(recalculation.difference)}. Bạn có chắc chắn muốn lưu?`);
        if (!confirmSave) {
            return;
        }
    }
    
    // Lấy lựa chọn MSP
    const mspOption = document.querySelector('input[name="msp-option"]:checked').value;
    const useCustomMSP = mspOption === 'custom';
    
    // Cập nhật thông tin hóa đơn
    originalInvoice.summary.calculatedAmountWithoutTax = recalculation.totalAmountWithoutTax;
    originalInvoice.summary.calculatedDiscount = recalculation.totalDiscount;
    originalInvoice.summary.calculatedAmountAfterDiscount = recalculation.totalAmountAfterDiscount;
    originalInvoice.summary.calculatedTax = recalculation.totalTax;
    originalInvoice.summary.calculatedTotal = recalculation.total;
    originalInvoice.summary.totalDifference = recalculation.difference;
    
    // Cập nhật thông tin sản phẩm
    originalInvoice.products.forEach((product, index) => {
        const discountInput = document.querySelector(`.discount-input[data-index="${index}"]`);
        const taxRateInput = document.querySelector(`.tax-rate-input[data-index="${index}"]`);
        const amountInput = document.querySelector(`.amount-input[data-index="${index}"]`);
        const mspSelect = document.querySelector(`.msp-select[data-index="${index}"]`);
        const suffixInput = document.querySelector(`.custom-msp-suffix[data-index="${index}"]`);
        
        // Cập nhật chiết khấu, thuế và thành tiền
        product.discount = parseFloat(discountInput.value) || 0;
        product.taxRate = parseFloat(taxRateInput.value) || 0;
        product.amount = parseFloat(amountInput.value) || 0;
        product.taxAmount = accountingRound(product.amount * product.taxRate / 100);
        product.totalAmount = accountingRound(product.amount + product.taxAmount);
        
        // Cập nhật MSP nếu chọn tùy chỉnh
        if (useCustomMSP) {
            const baseMSP = generateMSP('', product.name, product.unit, index, product.category, window.currentCompany);
            const suffix = suffixInput ? suffixInput.value.trim() : '';
            product.msp = suffix ? `${baseMSP}_${suffix}` : baseMSP;
            product.productCode = product.msp;
        } else if (mspSelect.value !== 'auto') {
            product.msp = mspSelect.value;
            product.productCode = product.msp;
        }
    });
    
    // Cập nhật trạng thái
    originalInvoice.status.validation = recalculation.difference === 0 ? 'ok' : 'manual_fixed';
    originalInvoice.status.stockPosted = true;
    originalInvoice.status.difference = recalculation.difference;
    originalInvoice.status.calculatedTotal = recalculation.total;
    originalInvoice.status.xmlTotal = originalInvoice.summary.totalAfterTax;
    
    // Nhập tồn kho
    updateStockWithEditedInvoice(window.currentCompany, originalInvoice, useCustomMSP);
    
    // 🔥 QUAN TRỌNG: Tích hợp với hệ thống kế toán
    if (typeof window.integratePurchaseAccounting === 'function') {
        window.integratePurchaseAccounting(originalInvoice, window.currentCompany);
    }
    
    // Cập nhật giao diện
    renderInvoices();
    if (typeof window.renderStock === 'function') window.renderStock();
    if (typeof window.updateAccountingStats === 'function') window.updateAccountingStats();
    if (typeof window.updateInvoiceStats === 'function') window.updateInvoiceStats();
    
    // Đóng popup
    document.getElementById('custom-modal').remove();
    
    alert('✅ Đã lưu chỉnh sửa và nhập tồn kho thành công!');
    
    // Lưu dữ liệu
    if (typeof window.saveData === 'function') {
        window.saveData();
    }
}

// =======================
// Hàm cập nhật tồn kho với hóa đơn đã chỉnh sửa
// =======================
function updateStockWithEditedInvoice(taxCode, invoice, useCustomMSP) {
    ensureHkdData(taxCode);
    const hkd = hkdData[taxCode];
    
    invoice.products.forEach(item => {
        if (item.category !== 'hang_hoa') return;
        
        // Sử dụng MSP từ hóa đơn đã chỉnh sửa
        const msp = item.msp;
        
        // Tìm sản phẩm trong tồn kho
        let stockItem = hkd.tonkhoMain.find(p => p.msp === msp);
        
        if (stockItem && !useCustomMSP) {
            // Cộng dồn vào MSP hiện có
            stockItem.quantity += parseFloat(item.quantity);
            stockItem.amount = accountingRound(stockItem.amount + item.amount);
            console.log(`✅ Cộng dồn tồn kho: ${item.name} (${msp}) - SL: +${item.quantity}`);
        } else {
            // Thêm mới với MSP (có thể là MSP mới hoặc MSP hiện có nhưng chưa tồn tại)
            hkd.tonkhoMain.push({
                msp: msp,
                code: msp,
                name: item.name,
                unit: item.unit,
                quantity: parseFloat(item.quantity),
                amount: item.amount
            });
            console.log(`✅ Thêm mới tồn kho: ${item.name} (${msp}) - SL: ${item.quantity}`);
        }
    });
    
    console.log(`📊 Tồn kho sau cập nhật:`, hkd.tonkhoMain);
}
function showFileResults(results) {
    const resultsList = document.getElementById('file-results-list');
    resultsList.innerHTML = '';
    
    const resultsCard = document.getElementById('file-results-card');
    if (results.length > 0) {
        resultsCard.classList.remove('hidden');
    } else {
        resultsCard.classList.add('hidden');
        return;
    }

    results.forEach(result => {
        const row = document.createElement('tr');
        let statusClass = '';
        if (result.status === 'success') {
            statusClass = 'text-success';
        } else if (result.status === 'duplicate') {
            statusClass = 'text-warning';
        } else {
            statusClass = 'text-danger';
        }
        
        row.innerHTML = `
            <td>${result.file}</td>
            <td class="${statusClass}">${result.status === 'success' ? '✅ Thành công' : result.status === 'duplicate' ? '⚠️ Trùng' : '❌ Lỗi'}</td>
            <td>${result.message}</td>
        `;
        resultsList.appendChild(row);
    });
}

// =======================
// Hiển thị thống kê hóa đơn
// =======================
// =======================
// Hiển thị thống kê hóa đơn - COMPACT
// =======================
function updateInvoiceStats() {
    const statsContainer = document.getElementById('invoice-stats');
    if (!statsContainer || !window.currentCompany || !window.hkdData[window.currentCompany]) return;

    const hkd = window.hkdData[window.currentCompany];
    const invoices = hkd.invoices;

    let totalAmountBeforeTax = 0;
    let totalTax = 0;
    let totalAmountWithTax = 0;
    let validCount = 0;
    let warningCount = 0;

    invoices.forEach(invoice => {
        totalAmountBeforeTax += invoice.summary.calculatedAmountAfterDiscount;
        totalTax += invoice.summary.calculatedTax;
        totalAmountWithTax += invoice.summary.calculatedTotal;
        
        if (invoice.status.validation === 'ok') {
            validCount++;
        } else {
            warningCount++;
        }
    });

    statsContainer.innerHTML = `
        <div class="stats-grid-invoice">
            <div class="stat-card-invoice">
                <div class="stat-icon">💰</div>
                <div class="stat-value-invoice">${formatCurrency(totalAmountBeforeTax)}</div>
                <div class="stat-label-invoice">Chưa thuế</div>
            </div>
            <div class="stat-card-invoice">
                <div class="stat-icon">🧮</div>
                <div class="stat-value-invoice">${formatCurrency(totalTax)}</div>
                <div class="stat-label-invoice">Thuế GTGT</div>
            </div>
            <div class="stat-card-invoice">
                <div class="stat-icon">💵</div>
                <div class="stat-value-invoice">${formatCurrency(totalAmountWithTax)}</div>
                <div class="stat-label-invoice">Có thuế</div>
            </div>
            <div class="stat-card-invoice">
                <div class="stat-icon">🧾</div>
                <div class="stat-value-invoice">${invoices.length}</div>
                <div class="stat-label-invoice">Hóa đơn</div>
            </div>
            <div class="stat-card-invoice">
                <div class="stat-icon">✅</div>
                <div class="stat-value-invoice">${validCount}</div>
                <div class="stat-label-invoice">Hợp lệ</div>
            </div>
            <div class="stat-card-invoice">
                <div class="stat-icon">⚠️</div>
                <div class="stat-value-invoice">${warningCount}</div>
                <div class="stat-label-invoice">Cảnh báo</div>
            </div>
            <div class="stat-card-invoice">
                <div class="stat-icon">🏢</div>
                <div class="stat-value-invoice">${new Set(invoices.map(inv => inv.sellerInfo.taxCode)).size}</div>
                <div class="stat-label-invoice">NCC</div>
            </div>
        </div>
    `;
}

// Module quản lý hóa đơn (Bao gồm logic tab Trích Xuất HĐ)
function initInvoiceModule() {
    // ------------------------------------
    // 1. Logic cho tab Trích Xuất HĐ
    // ------------------------------------
    const processButton = document.getElementById('process-files');
    if (processButton) {
        processButton.addEventListener('click', async function() {
            const fileInput = document.getElementById('zip-file-input');
            const files = fileInput.files;
            
            if (files.length === 0) {
                alert('Vui lòng chọn file ZIP hoặc XML.');
                return;
            }

            // Reset UI
            updateFileStats(files.length, 0, 0, 0);
            document.getElementById('file-results-list').innerHTML = '';
            
            // Xử lý file (sử dụng hàm từ zip-trichxuat.js)
            await window.handleZipFiles(files); 
            
            // Cập nhật giao diện sau khi xử lý
            window.renderCompanyList(); 
            const companies = Object.keys(window.hkdData);
            
            // Nếu chưa chọn công ty và có dữ liệu mới, chọn công ty đầu tiên
            if (companies.length > 0 && !window.currentCompany) {
                window.selectCompany(companies[0]);
            }
            
            // Cập nhật thống kê
            if (window.currentCompany) {
                renderInvoices();
                updateInvoiceStats();
                if (typeof window.updateAccountingStats === 'function') {
                    window.updateAccountingStats();
                }
            }
        });
    }

    // ------------------------------------
    // 2. Logic tìm kiếm hóa đơn
    // ------------------------------------
    const searchInput = document.getElementById('search-invoice');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            renderInvoices(e.target.value);
        });
    }
}
// =======================
// Hàm sửa hóa đơn và nhập tồn kho thủ công
// =======================
function fixInvoiceAndPostStock(invoiceId) {
    if (!window.currentCompany) {
        alert('Vui lòng chọn công ty.');
        return;
    }
    
    const hkd = hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === invoiceId);
    
    if (!invoice) {
        alert('Không tìm thấy hóa đơn.');
        return;
    }
    
    // Kiểm tra nếu đã chuyển kho rồi
    if (invoice.status.stockPosted) {
        alert('Hóa đơn này đã được chuyển tồn kho trước đó.');
        return;
    }
    
    // Hiển thị modal xác nhận
    const confirmMessage = `
        <div class="card">
            <div class="card-header">Xác Nhận Nhập Tồn Kho</div>
            <p><strong>Hóa đơn:</strong> ${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</p>
            <p><strong>Chênh lệch:</strong> ${formatCurrency(invoice.status.difference)}</p>
            <p><strong>Tổng tính toán:</strong> ${formatCurrency(invoice.status.calculatedTotal)}</p>
            <p><strong>Tổng từ XML:</strong> ${formatCurrency(invoice.status.xmlTotal)}</p>
            <p class="text-warning"><strong>⚠️ Cảnh báo:</strong> Hóa đơn có chênh lệch. Bạn có chắc chắn muốn nhập tồn kho?</p>
        </div>
    `;
    
    window.showModal('Xác Nhận Nhập Tồn Kho', `
        ${confirmMessage}
        <div style="text-align: right; margin-top: 20px;">
            <button id="confirm-post-stock" class="btn-success" style="margin-right: 10px;">Đồng Ý Nhập Kho</button>
            <button id="cancel-post-stock" class="btn-secondary">Hủy</button>
        </div>
    `);
    
    document.getElementById('confirm-post-stock').addEventListener('click', function() {
        // Thực hiện chuyển tồn kho
        updateStock(window.currentCompany, invoice);
        invoice.status.stockPosted = true;
        invoice.status.validation = 'manual_fixed'; // Đánh dấu đã sửa thủ công
        
        // 🔥 QUAN TRỌNG: Tích hợp với hệ thống kế toán
        if (typeof window.integratePurchaseAccounting === 'function') {
            window.integratePurchaseAccounting(invoice, window.currentCompany);
        }
        
        // Cập nhật giao diện
        renderInvoices();
        if (typeof window.renderStock === 'function') window.renderStock();
        if (typeof window.updateAccountingStats === 'function') window.updateAccountingStats();
        
        // Đóng modal
        document.getElementById('custom-modal').remove();
        
        alert('✅ Đã nhập tồn kho thành công!');
        
        // Lưu dữ liệu
        if (typeof window.saveData === 'function') {
            window.saveData();
        }
    });
    
    document.getElementById('cancel-post-stock').addEventListener('click', function() {
        document.getElementById('custom-modal').remove();
    });
}
// =======================
// Cập nhật hàm renderInvoices để hiển thị nút sửa
// =======================
function renderInvoices(searchTerm = '') {
    const invoiceList = document.getElementById('invoice-list');
    if (!invoiceList) return;
    
    invoiceList.innerHTML = '';
    
    if (!window.currentCompany || !hkdData[window.currentCompany]) {
        invoiceList.innerHTML = '<tr><td colspan="14" style="text-align: center;">Chưa chọn công ty</td></tr>';
        return;
    }
    
    const hkd = hkdData[window.currentCompany];
    let invoiceCount = 0;
    
    // Cập nhật thống kê
    updateInvoiceStats();
    
    // Sắp xếp hóa đơn theo ngày (mới nhất trước)
    const sortedInvoices = [...hkd.invoices].sort((a, b) => 
        new Date(b.invoiceInfo.date) - new Date(a.invoiceInfo.date)
    );
    
    sortedInvoices.forEach((invoice, index) => {
        // Lọc theo từ khóa tìm kiếm
        const searchTerms = searchTerm.toLowerCase().split(' ').filter(t => t);
        
        const isMatch = searchTerms.every(term => 
            invoice.invoiceInfo.symbol.toLowerCase().includes(term) ||
            invoice.invoiceInfo.number.toLowerCase().includes(term) ||
            invoice.sellerInfo.taxCode.toLowerCase().includes(term) ||
            invoice.sellerInfo.name.toLowerCase().includes(term)
        );
        
        if (searchTerm && !isMatch) {
            return;
        }

        const row = document.createElement('tr');
        // Thêm màu nền cho hóa đơn
        let rowClass = '';
        if (invoice.status.validation === 'error') {
            rowClass = 'table-danger';
        } else if (invoice.status.validation === 'manual_fixed') {
            rowClass = 'table-warning';
        } else if (invoice.products.some(p => p.hasDifference)) {
            rowClass = 'table-info';
        }

        row.className = rowClass;
        
        // Tính tổng chiết khấu
        const totalDiscount = invoice.products.reduce((sum, product) => {
            return sum + (parseFloat(product.discount) || 0);
        }, 0);
        
        // Xác định trạng thái và nút thao tác
        let statusBadge = '';
        let actionButtons = '';
        
        if (invoice.status.validation === 'ok' && invoice.status.stockPosted) {
            statusBadge = '<span class="badge badge-success">Đã nhập kho</span>';
            actionButtons = `
                <button class="btn-sm btn-info" onclick="showInvoiceDetail('${invoice.originalFileId}')">Chi tiết</button>
                <button class="btn-sm btn-danger" onclick="deleteInvoice('${invoice.originalFileId}')">Xóa</button>
            `;
        } else if ((invoice.status.validation === 'error' || invoice.status.validation === 'manual_fixed') && !invoice.status.stockPosted) {
            statusBadge = '<span class="badge badge-danger">Lỗi chênh lệch</span>';
            actionButtons = `
                <button class="btn-sm btn-warning" onclick="showFixInvoicePopup('${invoice.originalFileId}')">Sửa & Nhập kho</button>
                <button class="btn-sm btn-info" onclick="showInvoiceDetail('${invoice.originalFileId}')">Chi tiết</button>
                <button class="btn-sm btn-danger" onclick="deleteInvoice('${invoice.originalFileId}')">Xóa</button>
            `;
        } else if (invoice.status.validation === 'manual_fixed') {
            statusBadge = '<span class="badge badge-warning">Đã sửa thủ công</span>';
            actionButtons = `
                <button class="btn-sm btn-info" onclick="showInvoiceDetail('${invoice.originalFileId}')">Chi tiết</button>
                <button class="btn-sm btn-danger" onclick="deleteInvoice('${invoice.originalFileId}')">Xóa</button>
            `;
        } else {
            statusBadge = '<span class="badge badge-secondary">Không xác định</span>';
            actionButtons = `
                <button class="btn-sm btn-info" onclick="showInvoiceDetail('${invoice.originalFileId}')">Chi tiết</button>
                <button class="btn-sm btn-danger" onclick="deleteInvoice('${invoice.originalFileId}')">Xóa</button>
            `;
        }
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</td>
            <td>${formatDate(invoice.invoiceInfo.date)}</td>
            <td>${invoice.sellerInfo.name}</td>
            <td>${invoice.sellerInfo.taxCode}</td>
            <td>${invoice.invoiceInfo.type}</td>
            <td>${invoice.invoiceInfo.paymentMethod}</td>
            <td>${formatCurrency(invoice.summary.calculatedTotal)}</td>
            <td>${formatCurrency(invoice.summary.calculatedTax)}</td>
            <td>${formatCurrency(totalDiscount)}</td> <!-- Cột chiết khấu -->
            <td class="${invoice.status.difference > 0 ? 'text-danger' : ''}">
                ${formatCurrency(invoice.status.difference || 0)}
            </td>
            <td>${statusBadge}</td>
            <td>
                <div class="button-group-small">
                    ${actionButtons}
                </div>
            </td>
        `;
        
        invoiceList.appendChild(row);
        invoiceCount++;
    });
    
    if (invoiceCount === 0) {
        invoiceList.innerHTML = `<tr><td colspan="14" style="text-align: center;">${searchTerm ? 'Không tìm thấy hóa đơn' : 'Chưa có hóa đơn nào được nhập'}</td></tr>`;
    }
}

// Hiển thị chi tiết hóa đơn
function showInvoiceDetail(id) {
    if (!window.currentCompany) return;
    
    const hkd = hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === id);
    
    if (!invoice) {
        alert('Không tìm thấy hóa đơn');
        return;
    }

    // Hiển thị HTML preview nếu có
    if (invoice.htmlUrl) {
        window.open(invoice.htmlUrl, '_blank');
        return;
    }
    
    // Hiển thị chi tiết dưới dạng modal nếu không có HTML
    let detailHtml = `
        <div class="card">
            <div class="card-header">Thông tin chung</div>
            <p><strong>Ngày:</strong> ${formatDate(invoice.invoiceInfo.date)}</p>
            <p><strong>Mẫu/Ký hiệu/Số:</strong> ${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</p>
            <p><strong>Bên bán:</strong> ${invoice.sellerInfo.name} (MST: ${invoice.sellerInfo.taxCode})</p>
            <p><strong>Bên mua:</strong> ${invoice.buyerInfo.name} (MST: ${invoice.buyerInfo.taxCode})</p>
        </div>
        
        <div class="card">
            <div class="card-header">Tóm tắt thanh toán</div>
            <table>
                <tr><th>Tổng tiền hàng (trước thuế)</th><td>${formatCurrency(invoice.summary.calculatedAmountWithoutTax)}</td></tr>
                <tr><th>Chiết khấu</th><td>${formatCurrency(invoice.summary.calculatedDiscount)}</td></tr>
                <tr><th>Tổng tiền hàng (sau chiết khấu)</th><td>${formatCurrency(invoice.summary.calculatedAmountAfterDiscount)}</td></tr>
                <tr><th>Tổng thuế VAT</th><td>${formatCurrency(invoice.summary.calculatedTax)}</td></tr>
                <tr style="font-weight: bold;"><th>TỔNG CỘNG THANH TOÁN</th><td>${formatCurrency(invoice.summary.calculatedTotal)}</td></tr>
                <tr><th colspan="2" style="text-align: center; color: ${invoice.summary.totalDifference <= 1 ? 'green' : 'red'};">${invoice.summary.totalDifference > 1 ? `LỆCH ${formatCurrency(invoice.summary.totalDifference)} (Xem chi tiết sản phẩm)` : '✔ Tổng tiền hợp lệ'}</th></tr>
            </table>
        </div>
        
        <div class="card">
            <div class="card-header">Chi tiết Sản phẩm</div>
            <table class="table">
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>MSP</th>
                        <th>Tên sản phẩm</th>
                        <th>SL</th>
                        <th>Đơn giá</th>
                        <th>CK</th>
                        <th>TT Sau CK</th>
                        <th>Thuế</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    invoice.products.forEach(product => {
        const rowClass = product.hasDifference ? 'table-warning' : '';
        detailHtml += `
            <tr class="${rowClass}">
                <td>${product.stt}</td>
                <td>${product.msp}</td>
                <td>${product.name}</td>
                <td>${product.quantity}</td>
                <td>${formatCurrency(product.price)}</td>
                <td>${formatCurrency(product.discount)}</td>
                <td>${formatCurrency(product.amount)}</td>
                <td>${product.taxRate}% (${formatCurrency(product.taxAmount)})</td>
            </tr>
        `;
    });
    
    detailHtml += `
                </tbody>
            </table>
        </div>
    `;
    
    window.showModal(`Chi Tiết Hóa Đơn ${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}`, detailHtml);
}

// Xóa hóa đơn
function deleteInvoice(id) {
    if (!window.currentCompany || !confirm('Bạn có chắc chắn muốn xóa hóa đơn này?')) return;
    
    const hkd = hkdData[window.currentCompany];
    const index = hkd.invoices.findIndex(inv => inv.originalFileId === id);
    
    if (index !== -1) {
        const deletedInvoice = hkd.invoices[index];
        
        // 1. Xóa hóa đơn khỏi danh sách
        hkd.invoices.splice(index, 1);
        
        // 2. Cập nhật lại tồn kho (Hoàn nguyên)
        if (deletedInvoice.status.stockPosted) {
            deletedInvoice.products.forEach(item => {
                if (item.category !== 'hang_hoa') return;
                let stockItem = hkd.tonkhoMain.find(p => p.msp === item.msp);
                if (stockItem) {
                    // Trừ số lượng và giá trị (vì khi nhập là cộng vào)
                    stockItem.quantity -= parseFloat(item.quantity); 
                    stockItem.amount -= item.amount;
                }
            });
            
            // Xóa các sản phẩm có số lượng < 1
            hkd.tonkhoMain = hkd.tonkhoMain.filter(p => p.quantity >= 1);
        }
        
        // 3. Cập nhật giao diện
        window.renderInvoices();
        if (typeof window.renderStock === 'function') window.renderStock();
        if (typeof window.updateAccountingStats === 'function') window.updateAccountingStats();
        window.renderCompanyList();
        
        alert('Đã xóa hóa đơn và cập nhật tồn kho.');
    } else {
        alert('Không tìm thấy hóa đơn để xóa.');
    }
}

// Xuất toàn cục
window.initInvoiceModule = initInvoiceModule;
window.renderInvoices = renderInvoices;
window.showInvoiceDetail = showInvoiceDetail;
window.deleteInvoice = deleteInvoice;
window.updateInvoiceStats = updateInvoiceStats;
window.showFixInvoicePopup = showFixInvoicePopup;
window.recalculateEditedInvoice = recalculateEditedInvoice;
window.saveEditedInvoiceAndPostStock = saveEditedInvoiceAndPostStock;