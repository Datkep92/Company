
window.loadMoreInvoices = loadMoreInvoices; // Xuất toàn cục
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
// =======================
// HÀM LỌC VÀ HIỂN THỊ HÓA ĐƠN MUA HÀNG NÂNG CAO (ĐÃ SỬA LỖI)
// =======================




// =======================
// HÀM LỌC HÓA ĐƠN CHÍNH
// =======================

function filterPurchaseInvoices() {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoices = hkd.invoices || [];
    
    if (invoices.length === 0) {
        renderFilteredPurchaseInvoices([]);
        return;
    }
    
    // Lấy giá trị bộ lọc
    const searchTerm = document.getElementById('search-purchase-invoices')?.value.toLowerCase() || '';
    const dateFilter = document.getElementById('purchase-date-filter')?.value || 'all';
    const showErrorsFirst = document.getElementById('show-error-invoices')?.checked || false;
    
    // Lọc theo từ khóa tìm kiếm
    let filteredInvoices = invoices.filter(invoice => {
        const searchTerms = searchTerm.split(' ').filter(term => term.length > 0);
        
        if (searchTerms.length === 0) return true;
        
        return searchTerms.every(term => 
            invoice.invoiceInfo.symbol.toLowerCase().includes(term) ||
            invoice.invoiceInfo.number.toLowerCase().includes(term) ||
            invoice.sellerInfo.taxCode.toLowerCase().includes(term) ||
            invoice.sellerInfo.name.toLowerCase().includes(term) ||
            (invoice.invoiceInfo.symbol + '/' + invoice.invoiceInfo.number).toLowerCase().includes(term)
        );
    });
    
    // Lọc theo ngày
    filteredInvoices = filterInvoicesByDate(filteredInvoices, dateFilter);
    
    // Sắp xếp: hóa đơn lỗi lên đầu (nếu được chọn)
    if (showErrorsFirst) {
        filteredInvoices.sort((a, b) => {
            const aIsError = a.status && a.status.validation === 'error' && !a.status.stockPosted;
            const bIsError = b.status && b.status.validation === 'error' && !b.status.stockPosted;
            
            if (aIsError && !bIsError) return -1;
            if (!aIsError && bIsError) return 1;
            
            // Nếu cùng trạng thái, sắp xếp theo ngày (mới nhất trước)
            return new Date(b.invoiceInfo.date) - new Date(a.invoiceInfo.date);
        });
    } else {
        // Mặc định: sắp xếp theo ngày (mới nhất trước)
        filteredInvoices.sort((a, b) => new Date(b.invoiceInfo.date) - new Date(a.invoiceInfo.date));
    }
    
    // Giới hạn hiển thị 5 hóa đơn gần nhất
    window.currentPurchaseDisplayLimit = 5;
    const displayedInvoices = filteredInvoices.slice(0, window.currentPurchaseDisplayLimit);
    
    // Hiển thị kết quả
    renderFilteredPurchaseInvoices(displayedInvoices, filteredInvoices.length);
    
    console.log(`🔍 Lọc hoàn tất: ${displayedInvoices.length}/${filteredInvoices.length} hóa đơn`);
}

// =======================
// HIỂN THỊ HÓA ĐƠN ĐÃ LỌC VỚI NÚT XEM THÊM
// =======================

function renderFilteredPurchaseInvoices(invoices, totalCount = 0) {
    const invoiceList = document.getElementById('purchase-invoice-list');
    if (!invoiceList) return;
    
    invoiceList.innerHTML = '';
    
    if (invoices.length === 0) {
        invoiceList.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">📭 Không tìm thấy hóa đơn phù hợp</td></tr>';
        updateFilterStats(0, totalCount);
        return;
    }
    
    // Hiển thị từng hóa đơn
    invoices.forEach((invoice, index) => {
        const row = document.createElement('tr');
        
        // Xác định trạng thái
        let statusBadge = '';
        let statusClass = '';
        
        if (invoice.status && invoice.status.stockPosted) {
            statusBadge = '<span class="badge badge-success">✅ Đã nhập kho</span>';
            statusClass = 'table-success';
        } else if (invoice.status && invoice.status.validation === 'error') {
            statusBadge = '<span class="badge badge-danger">❌ Lỗi</span>';
            statusClass = 'table-danger';
        } else {
            statusBadge = '<span class="badge badge-warning">⚠️ Chưa xử lý</span>';
            statusClass = 'table-warning';
        }

        row.className = statusClass;
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</strong></td>
            <td>${window.formatDate(invoice.invoiceInfo.date)}</td>
            <td>${invoice.sellerInfo.name}</td>
            <td><code>${invoice.sellerInfo.taxCode}</code></td>
            <td style="text-align: right;">${window.formatCurrency(invoice.summary.calculatedTotal)}</td>
            <td style="text-align: right;">${window.formatCurrency(invoice.summary.calculatedTax)}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="button-group-small">
                    <button class="btn-sm btn-info" onclick="viewPurchaseInvoiceDetail('${invoice.originalFileId}')">👁️ Xem</button>
                    <button class="btn-sm btn-warning" onclick="editPurchaseInvoice('${invoice.originalFileId}')">✏️ Sửa</button>
                    ${(!invoice.status || !invoice.status.stockPosted) ? 
                      `<button class="btn-sm btn-primary" onclick="createPurchaseReceipt('${invoice.originalFileId}')">📦 Tạo PN</button>` : 
                      ''}
                </div>
            </td>
        `;
        
        invoiceList.appendChild(row);
    });
    
    // Hiển thị nút "Xem thêm" nếu còn nhiều hóa đơn
    const loadMoreContainer = document.getElementById('load-more-container');
    if (loadMoreContainer) {
        loadMoreContainer.remove();
    }
    
    if (totalCount > invoices.length) {
        const loadMoreRow = document.createElement('tr');
        loadMoreRow.id = 'load-more-container';
        loadMoreRow.innerHTML = `
            <td colspan="9" style="text-align: center; padding: 15px;">
                <button id="load-more-invoices" class="btn btn-outline-primary btn-sm">
                    📋 Xem thêm ${totalCount - invoices.length} hóa đơn
                </button>
            </td>
        `;
        invoiceList.appendChild(loadMoreRow);
        
        // Gắn sự kiện cho nút xem thêm
        document.getElementById('load-more-invoices').addEventListener('click', loadMorePurchaseInvoices);
    }
    
    // Cập nhật thống kê
    updateFilterStats(invoices.length, totalCount);
}

// =======================
// XEM THÊM HÓA ĐƠN
// =======================

function loadMorePurchaseInvoices() {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) return;
    
    const hkd = window.hkdData[window.currentCompany];
    let invoices = hkd.invoices || [];
    
    // Áp dụng lại bộ lọc hiện tại
    const searchTerm = document.getElementById('search-purchase-invoices')?.value.toLowerCase() || '';
    const dateFilter = document.getElementById('purchase-date-filter')?.value || 'all';
    const showErrorsFirst = document.getElementById('show-error-invoices')?.checked || false;
    
    // Lọc theo từ khóa
    let filteredInvoices = invoices.filter(invoice => {
        const searchTerms = searchTerm.split(' ').filter(term => term.length > 0);
        if (searchTerms.length === 0) return true;
        
        return searchTerms.every(term => 
            invoice.invoiceInfo.symbol.toLowerCase().includes(term) ||
            invoice.invoiceInfo.number.toLowerCase().includes(term) ||
            invoice.sellerInfo.taxCode.toLowerCase().includes(term) ||
            invoice.sellerInfo.name.toLowerCase().includes(term)
        );
    });
    
    // Lọc theo ngày
    filteredInvoices = filterInvoicesByDate(filteredInvoices, dateFilter);
    
    // Sắp xếp
    if (showErrorsFirst) {
        filteredInvoices.sort((a, b) => {
            const aIsError = a.status && a.status.validation === 'error' && !a.status.stockPosted;
            const bIsError = b.status && b.status.validation === 'error' && !b.status.stockPosted;
            
            if (aIsError && !bIsError) return -1;
            if (!aIsError && bIsError) return 1;
            
            return new Date(b.invoiceInfo.date) - new Date(a.invoiceInfo.date);
        });
    } else {
        filteredInvoices.sort((a, b) => new Date(b.invoiceInfo.date) - new Date(a.invoiceInfo.date));
    }
    
    // Tăng giới hạn hiển thị (thêm 10 hóa đơn mỗi lần nhấn)
    window.currentPurchaseDisplayLimit = (window.currentPurchaseDisplayLimit || 5) + 10;
    const displayedInvoices = filteredInvoices.slice(0, window.currentPurchaseDisplayLimit);
    
    // Hiển thị lại
    renderFilteredPurchaseInvoices(displayedInvoices, filteredInvoices.length);
}

// =======================
// CẬP NHẬT THỐNG KÊ BỘ LỌC
// =======================

function updateFilterStats(displayed, total) {
    const displayedElement = document.getElementById('displayed-count');
    const totalElement = document.getElementById('total-count');
    const statsElement = document.getElementById('purchase-filter-stats');
    
    if (displayedElement && totalElement && statsElement) {
        displayedElement.textContent = displayed;
        totalElement.textContent = total;
        
        if (displayed === 0) {
            statsElement.style.background = '#fff5f5';
            statsElement.innerHTML = '<small style="color: #dc3545;">❌ Không tìm thấy hóa đơn phù hợp</small>';
        } else {
            statsElement.style.background = '#f8f9fa';
            let statsText = `<small>Đang hiển thị: <strong>${displayed}</strong>/<strong>${total}</strong> hóa đơn</small>`;
            
            // Thêm thông báo "5 hóa đơn gần nhất" nếu đang hiển thị ít hơn tổng số
            if (displayed < total && displayed === 5) {
                statsText += `<br><small style="color: #007bff;">📋 Đang hiển thị 5 hóa đơn gần nhất</small>`;
            }
            
            statsElement.innerHTML = statsText;
        }
    }
}



window.loadPurchaseInvoices = function() {
    // Gọi hàm gốc trước để đảm bảo dữ liệu được tải
    if (originalLoadPurchaseInvoices) {
        originalLoadPurchaseInvoices();
    }
    
    // Sau đó áp dụng bộ lọc nếu đang ở tab Mua Hàng
    const isMuaHangTabActive = document.getElementById('mua-hang')?.classList.contains('active');
    if (isMuaHangTabActive) {
        setTimeout(() => {
            filterPurchaseInvoices();
        }, 100);
    }
};



function renderFilteredPayableList(suppliers, totalCount = 0, allInvoices = []) {
    const payableList = document.getElementById('payable-list');
    if (!payableList) {
        console.error('❌ Không tìm thấy payable-list');
        return;
    }
    
    payableList.innerHTML = '';
    
    if (suppliers.length === 0) {
        payableList.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">📭 Không tìm thấy NCC phù hợp</td></tr>';
        updatePayableFilterStats(0, totalCount);
        return;
    }
    
    // Hiển thị từng NCC
    suppliers.forEach((supplier, index) => {
        const row = document.createElement('tr');
        
        const debtLevel = supplier.remaining > 0 ? 'table-warning' : '';
        const debtStatus = supplier.remaining > 0 ? 'text-danger' : 'text-success';
        
        row.className = debtLevel;
        row.innerHTML = `
            <td>
                <strong class="supplier-name" style="cursor: pointer; color: #007bff;" 
                        onclick="showSupplierHistory('${supplier.taxCode}')">
                    ${supplier.name}
                </strong>
            </td>
            <td><code>${supplier.taxCode}</code></td>
            <td style="text-align: right;">${window.formatCurrency(supplier.totalDebt)}</td>
            <td style="text-align: right;">${window.formatCurrency(supplier.paid)}</td>
            <td style="text-align: right; font-weight: bold;" class="${debtStatus}">
                ${window.formatCurrency(supplier.remaining)}
            </td>
            <td>
                <div class="button-group-small">
                    <button class="btn-sm btn-primary" onclick="showSupplierHistory('${supplier.taxCode}')">📊 Lịch sử</button>
                    ${supplier.remaining > 0 ? 
                      `<button class="btn-sm btn-success" onclick="makePayment('${supplier.taxCode}')">💳 Thanh toán</button>` : 
                      ''}
                </div>
            </td>
        `;
        
        payableList.appendChild(row);
    });
    
    // Hiển thị nút "Xem thêm" nếu còn nhiều NCC
    const loadMoreContainer = document.getElementById('load-more-payable-container');
    if (loadMoreContainer) {
        loadMoreContainer.remove();
    }
    
    if (totalCount > suppliers.length) {
        const loadMoreRow = document.createElement('tr');
        loadMoreRow.id = 'load-more-payable-container';
        loadMoreRow.innerHTML = `
            <td colspan="6" style="text-align: center; padding: 15px;">
                <button id="load-more-payable" class="btn btn-outline-primary btn-sm">
                    📋 Xem thêm ${totalCount - suppliers.length} NCC
                </button>
            </td>
        `;
        payableList.appendChild(loadMoreRow);
        
        // Gắn sự kiện cho nút xem thêm
        document.getElementById('load-more-payable').addEventListener('click', loadMorePayable);
    }
    
    // Cập nhật thống kê
    updatePayableFilterStats(suppliers.length, totalCount);
}



// CẬP NHẬT THỐNG KÊ CÔNG NỢ (THÊM HÀM BỊ THIẾU)
// =======================

function updatePayableFilterStats(displayed, total) {
    const displayedElement = document.getElementById('payable-displayed-count');
    const totalElement = document.getElementById('payable-total-count');
    const statsElement = document.getElementById('payable-filter-stats');
    
    if (displayedElement && totalElement && statsElement) {
        displayedElement.textContent = displayed;
        totalElement.textContent = total;
        
        if (displayed === 0) {
            statsElement.style.background = '#fff5f5';
            statsElement.innerHTML = '<small style="color: #dc3545;">❌ Không tìm thấy NCC phù hợp</small>';
        } else {
            statsElement.style.background = '#f8f9fa';
            let statsText = `<small>Đang hiển thị: <strong>${displayed}</strong>/<strong>${total}</strong> NCC</small>`;
            
            // Thêm thông báo "5 NCC" nếu đang hiển thị ít hơn tổng số
            if (displayed < total && displayed === 5) {
                statsText += `<br><small style="color: #007bff;">📋 Đang hiển thị 5 NCC có nợ nhiều nhất</small>`;
            }
            
            statsElement.innerHTML = statsText;
        }
    }
}

// =======================
// HIỂN THỊ LỊCH SỬ HÓA ĐƠN CỦA NCC
// =======================

function showSupplierHistory(taxCode) {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        alert('👈 Vui lòng chọn công ty trước.');
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoices = hkd.invoices || [];
    
    // Lọc hóa đơn của NCC này và sắp xếp theo ngày (mới nhất trước)
    const supplierInvoices = invoices
        .filter(inv => inv.sellerInfo.taxCode === taxCode)
        .sort((a, b) => new Date(b.invoiceInfo.date) - new Date(a.invoiceInfo.date));
    
    if (supplierInvoices.length === 0) {
        alert('📭 Không tìm thấy hóa đơn nào của NCC này.');
        return;
    }
    
    const supplierName = supplierInvoices[0].sellerInfo.name;
    
    // Tạo nội dung modal
    let historyHtml = `
        <div class="card">
            <div class="card-header">
                <h4>📊 Lịch Sử Hóa Đơn - ${supplierName}</h4>
                <small>MST: ${taxCode} | Tổng số: ${supplierInvoices.length} hóa đơn</small>
            </div>
            <div class="card-body" style="max-height: 60vh; overflow-y: auto;">
                <table class="table table-striped table-sm">
                    <thead style="position: sticky; top: 0; background: white;">
                        <tr>
                            <th>STT</th>
                            <th>Số HĐ</th>
                            <th>Ngày</th>
                            <th>Tổng tiền</th>
                            <th>Thuế GTGT</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    let totalAmount = 0;
    let totalTax = 0;
    
    supplierInvoices.forEach((invoice, index) => {
        totalAmount += invoice.summary.calculatedTotal;
        totalTax += invoice.summary.calculatedTax;
        
        let statusBadge = '';
        if (invoice.status && invoice.status.stockPosted) {
            statusBadge = '<span class="badge badge-success">✅ Đã nhập kho</span>';
        } else if (invoice.status && invoice.status.validation === 'error') {
            statusBadge = '<span class="badge badge-danger">❌ Lỗi</span>';
        } else {
            statusBadge = '<span class="badge badge-warning">⚠️ Chưa xử lý</span>';
        }
        
        historyHtml += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</strong></td>
                <td>${window.formatDate(invoice.invoiceInfo.date)}</td>
                <td style="text-align: right;">${window.formatCurrency(invoice.summary.calculatedTotal)}</td>
                <td style="text-align: right;">${window.formatCurrency(invoice.summary.calculatedTax)}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn-sm btn-info" onclick="viewPurchaseInvoiceDetail('${invoice.originalFileId}')">👁️</button>
                    <button class="btn-sm btn-warning" onclick="editPurchaseInvoice('${invoice.originalFileId}')">✏️</button>
                </td>
            </tr>
        `;
    });
    
    historyHtml += `
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="card mt-3">
            <div class="card-header">📈 Tổng Hợp</div>
            <div class="card-body">
                <div class="row">
                    <div class="col-6">
                        <p><strong>Tổng số hóa đơn:</strong> ${supplierInvoices.length}</p>
                        <p><strong>Tổng giá trị:</strong> ${window.formatCurrency(totalAmount)}</p>
                    </div>
                    <div class="col-6">
                        <p><strong>Tổng thuế GTGT:</strong> ${window.formatCurrency(totalTax)}</p>
                        <p><strong>Giá trị trung bình/HĐ:</strong> ${window.formatCurrency(totalAmount / supplierInvoices.length)}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Hiển thị modal
    window.showModal(`📊 Lịch Sử Hóa Đơn - ${supplierName}`, historyHtml, 'modal-lg');
}



function initPayableFilter() {
    console.log('🔄 initPayableFilter() called');
    
    // KIỂM TRA TAB CÓ ACTIVE KHÔNG
    const isMuaHangActive = document.getElementById('mua-hang')?.classList.contains('active');
    console.log('🔍 Tab Mua Hang active:', isMuaHangActive);
    
    if (!isMuaHangActive) {
        console.log('⏳ Tab Mua Hàng chưa active, đợi 1 giây rồi thử lại...');
        setTimeout(initPayableFilter, 1000);
        return;
    }
    
    // KIỂM TRA ĐÃ KHỞI TẠO CHƯA
    if (window.payableFilterInitialized) {
        console.log('✅ Bộ lọc công nợ đã được khởi tạo trước đó');
        setTimeout(filterPayableList, 100);
        return;
    }
    
    console.log('🎯 Bắt đầu khởi tạo bộ lọc công nợ...');
    
    // Tạo HTML cho bộ lọc CÔNG NỢ
    createPayableFilterUI();
    
    // TỰ ĐỘNG CHẠY FILTER
    setTimeout(() => {
        filterPayableList();
        console.log('🎯 Đã tự động chạy filter hiển thị 5 NCC gần nhất');
    }, 500);
    
    window.payableFilterInitialized = true;
    console.log('✅ Đã khởi tạo bộ lọc công nợ NCC');
}

// =======================
// KHỞI TẠO BỘ LỌC HÓA ĐƠN (SỬA LỖI TAB CHƯA ACTIVE)
// =======================

function initPurchaseInvoiceFilter() {
    console.log('🔄 initPurchaseInvoiceFilter() called');
    
    // KIỂM TRA TAB CÓ ACTIVE KHÔNG - NẾU KHÔNG THÌ ĐỢI
    const isMuaHangActive = document.getElementById('mua-hang')?.classList.contains('active');
    console.log('🔍 Tab Mua Hang active:', isMuaHangActive);
    
    if (!isMuaHangActive) {
        console.log('⏳ Tab Mua Hàng chưa active, đợi 1 giây rồi thử lại...');
        setTimeout(initPurchaseInvoiceFilter, 1000);
        return;
    }
    
    if (window.purchaseFilterInitialized) {
        console.log('✅ Bộ lọc hóa đơn đã được khởi tạo trước đó');
        setTimeout(filterPurchaseInvoices, 100);
        return;
    }
    
    console.log('🎯 Bắt đầu khởi tạo bộ lọc hóa đơn...');
    
    // Tạo HTML cho bộ lọc HÓA ĐƠN
    createFilterUI();
    
    // TỰ ĐỘNG CHẠY FILTER
    setTimeout(() => {
        filterPurchaseInvoices();
        console.log('🎯 Đã tự động chạy filter hiển thị 5 hóa đơn gần nhất');
    }, 500);
    
    window.purchaseFilterInitialized = true;
    console.log('✅ Đã khởi tạo bộ lọc hóa đơn mua hàng');
}





// =======================
// BIẾN THEO DÕI TRẠNG THÁI
// =======================
window.filterModulesInitialized = false;


function setupPurchaseFilterEvents() {
    console.log('🔧 setupPurchaseFilterEvents() called');
    
    const searchInput = document.getElementById('search-purchase-invoices');
    if (searchInput) {
        searchInput.addEventListener('input', filterPurchaseInvoices);
        console.log('✅ Đã gắn sự kiện search input');
    } else {
        console.warn('⚠️ Không tìm thấy search-purchase-invoices');
    }
    
    const dateFilter = document.getElementById('purchase-date-filter');
    if (dateFilter) {
        dateFilter.addEventListener('change', function() {
            filterPurchaseInvoices();
        });
        console.log('✅ Đã gắn sự kiện date filter');
    }
    
    const showErrorsCheckbox = document.getElementById('show-error-invoices');
    if (showErrorsCheckbox) {
        showErrorsCheckbox.addEventListener('change', filterPurchaseInvoices);
        console.log('✅ Đã gắn sự kiện error checkbox');
    }
}



// =======================
// HÀM LỌC CÔNG NỢ NCC (SỬA LẠI CHI TIẾT)
// =======================

function filterPayableList() {
    console.log('🔍 filterPayableList() called');
    
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        console.log('⏳ Chưa chọn công ty, không thể lọc công nợ');
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoices = hkd.invoices || [];
    
    console.log('📊 Tổng số hóa đơn:', invoices.length);
    
    if (invoices.length === 0) {
        renderFilteredPayableList([]);
        return;
    }
    
    // Tính toán công nợ theo nhà cung cấp
    const supplierDebt = calculateSupplierDebt(invoices);
    const suppliers = Object.values(supplierDebt);
    
    console.log('📊 Tổng số NCC:', suppliers.length);
    
    // Lấy giá trị bộ lọc
    const searchTerm = document.getElementById('search-payable')?.value.toLowerCase() || '';
    const debtFilter = document.getElementById('show-only-debt')?.value || 'all';
    
    console.log('🔍 Filter values - search:', searchTerm, 'debtFilter:', debtFilter);
    
    // Lọc theo từ khóa tìm kiếm
    let filteredSuppliers = suppliers.filter(supplier => {
        const searchTerms = searchTerm.split(' ').filter(term => term.length > 0);
        
        if (searchTerms.length === 0) return true;
        
        const match = searchTerms.every(term => 
            supplier.name.toLowerCase().includes(term) ||
            supplier.taxCode.toLowerCase().includes(term)
        );
        
        console.log(`🔍 NCC "${supplier.name}" - search match:`, match);
        return match;
    });
    
    console.log('📊 Sau khi lọc search:', filteredSuppliers.length);
    
    // Lọc theo trạng thái nợ
    if (debtFilter === 'debt') {
        filteredSuppliers = filteredSuppliers.filter(supplier => {
            const hasDebt = supplier.remaining > 0;
            console.log(`🔍 NCC "${supplier.name}" - có nợ:`, hasDebt, 'số nợ:', supplier.remaining);
            return hasDebt;
        });
    } else if (debtFilter === 'paid') {
        filteredSuppliers = filteredSuppliers.filter(supplier => {
            const isPaid = supplier.remaining <= 0;
            console.log(`🔍 NCC "${supplier.name}" - đã trả:`, isPaid, 'số nợ:', supplier.remaining);
            return isPaid;
        });
    }
    
    console.log('📊 Sau khi lọc trạng thái:', filteredSuppliers.length);
    
    // Sắp xếp theo số nợ giảm dần (nhiều nợ nhất lên đầu)
    filteredSuppliers.sort((a, b) => b.remaining - a.remaining);
    
    // Giới hạn hiển thị 5 NCC
    window.currentPayableDisplayLimit = 5;
    const displayedSuppliers = filteredSuppliers.slice(0, window.currentPayableDisplayLimit);
    
    console.log('📊 Hiển thị:', displayedSuppliers.length, 'Tổng:', filteredSuppliers.length);
    
    // Hiển thị kết quả
    renderFilteredPayableList(displayedSuppliers, filteredSuppliers.length, invoices);
    
    console.log(`🔍 Lọc công nợ hoàn tất: ${displayedSuppliers.length}/${filteredSuppliers.length} NCC`);
}

// =======================
// TÍNH TOÁN CÔNG NỢ THEO NCC (THÊM DEBUG)
// =======================

function calculateSupplierDebt(invoices) {
    console.log('🧮 calculateSupplierDebt() called với', invoices.length, 'hóa đơn');
    
    const supplierDebt = {};
    
    invoices.forEach(invoice => {
        const supplierKey = invoice.sellerInfo.taxCode;
        if (!supplierDebt[supplierKey]) {
            supplierDebt[supplierKey] = {
                name: invoice.sellerInfo.name,
                taxCode: supplierKey,
                totalDebt: 0,
                paid: 0,
                remaining: 0,
                invoices: []
            };
        }
        
        supplierDebt[supplierKey].totalDebt += invoice.summary.calculatedTotal;
        supplierDebt[supplierKey].invoices.push(invoice);
    });

    // Tính toán số đã thanh toán và còn nợ
    Object.values(supplierDebt).forEach(supplier => {
        supplier.paid = supplier.totalDebt * 0.3; // Giả sử đã thanh toán 30%
        supplier.remaining = supplier.totalDebt - supplier.paid;
        
        // Sắp xếp hóa đơn theo ngày (mới nhất trước)
        supplier.invoices.sort((a, b) => new Date(b.invoiceInfo.date) - new Date(a.invoiceInfo.date));
        
        console.log(`💰 NCC "${supplier.name}": Tổng nợ ${supplier.totalDebt}, Đã trả ${supplier.paid}, Còn nợ ${supplier.remaining}`);
    });
    
    console.log('📊 Tổng số NCC:', Object.keys(supplierDebt).length);
    return supplierDebt;
}


// =======================
// KHỞI TẠO BỘ LỌC CÔNG NỢ (THÊM DEBUG)
// =======================


// =======================
function createFilterUI() {
    console.log('🔄 createFilterUI() called');
    
    // KIỂM TRA ĐÃ TỒN TẠI CHƯA
    if (document.getElementById('purchase-invoice-filter')) {
        console.log('✅ Bộ lọc hóa đơn đã tồn tại, bỏ qua');
        return;
    }
    
    // TÌM CARD HÓA ĐƠN TRONG .content-body
    let invoiceListSection = null;
    const allCards = document.querySelectorAll('#mua-hang .content-body .card');
    
    console.log('📋 Tìm card Hóa Đơn trong', allCards.length, 'cards');
    
    for (let card of allCards) {
        const header = card.querySelector('.card-header');
        if (header && header.textContent.includes('Danh Sách Hóa Đơn Mua Hàng')) {
            invoiceListSection = card;
            console.log('✅ Đã tìm thấy card Hóa Đơn:', header.textContent);
            break;
        }
    }
    
    if (!invoiceListSection) {
        console.error('❌ Không tìm thấy card Danh Sách Hóa Đơn Mua Hàng');
        return;
    }
    
    // Tạo HTML cho bộ lọc
    const filterHtml = `
        <div class="card" id="purchase-invoice-filter">
            <div class="card-header">🔍 Bộ Lọc Hóa Đơn</div>
            <div class="card-body">
                <div class="filter-grid">
                    <div class="form-group">
                        <label for="search-purchase-invoices">Tìm kiếm nhanh</label>
                        <input type="text" id="search-purchase-invoices" 
                               placeholder="Tên NCC, MST, Số HĐ..." 
                               class="form-control">
                    </div>
                    
                    <div class="form-group">
                        <label for="purchase-date-filter">Lọc theo ngày</label>
                        <select id="purchase-date-filter" class="form-control">
                            <option value="all">Tất cả ngày</option>
                            <option value="today">Hôm nay</option>
                            <option value="yesterday">Hôm qua</option>
                            <option value="week">Tuần này</option>
                            <option value="month">Tháng này</option>
                            <option value="last-month">Tháng trước</option>
                            <option value="custom">Tùy chọn...</option>
                        </select>
                    </div>
                    
                    <div class="form-group" id="custom-date-range" style="display: none;">
                        <label>Khoảng ngày tùy chọn</label>
                        <div style="display: flex; gap: 10px;">
                            <input type="date" id="start-date" class="form-control" style="flex: 1;">
                            <input type="date" id="end-date" class="form-control" style="flex: 1;">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="show-error-invoices" style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="show-error-invoices">
                            <span>Ưu tiên hiển thị hóa đơn lỗi</span>
                        </label>
                    </div>
                </div>
                
                <div class="filter-stats" id="purchase-filter-stats" style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                    <small>Đang hiển thị: <span id="displayed-count">0</span>/<span id="total-count">0</span> hóa đơn</small>
                </div>
            </div>
        </div>
    `;
    
    try {
        invoiceListSection.insertAdjacentHTML('beforebegin', filterHtml);
        console.log('✅ Đã tạo bộ lọc hóa đơn thành công');
    } catch (error) {
        console.error('❌ Lỗi khi tạo bộ lọc hóa đơn:', error);
    }
}


// =======================
// CẬP NHẬT HÀM KHỞI TẠO ĐỂ ĐẢM BẢO THỨ TỰ
// =======================

function initPurchaseInvoiceFilter() {
    if (window.purchaseFilterInitialized) {
        console.log('✅ Bộ lọc hóa đơn đã được khởi tạo trước đó');
        setTimeout(filterPurchaseInvoices, 100);
        return;
    }
    
    console.log('🔄 Đang khởi tạo bộ lọc hóa đơn mua hàng...');
    
    const isMuaHangActive = document.getElementById('mua-hang')?.classList.contains('active');
    if (!isMuaHangActive) {
        console.log('⏳ Tab Mua Hàng chưa active');
        return;
    }
    
    // Tạo HTML cho bộ lọc HÓA ĐƠN TRƯỚC
    createFilterUI();
    
    // Gắn sự kiện
    setupPurchaseFilterEvents();
    
    // TỰ ĐỘNG CHẠY FILTER
    setTimeout(() => {
        filterPurchaseInvoices();
        console.log('🎯 Đã tự động chạy filter hiển thị 5 hóa đơn gần nhất');
    }, 200);
    
    window.purchaseFilterInitialized = true;
    console.log('✅ Đã khởi tạo bộ lọc hóa đơn mua hàng');
}


// Ghi đè hàm loadPurchaseInvoices gốc để sử dụng bộ lọc
const originalLoadPurchaseInvoices = window.loadPurchaseInvoices;

window.loadPurchaseInvoices = function() {
    // Gọi hàm gốc trước để đảm bảo dữ liệu được tải
    if (originalLoadPurchaseInvoices) {
        originalLoadPurchaseInvoices();
    }
    
    // TỰ ĐỘNG CHẠY FILTER KHI DỮ LIỆU THAY ĐỔI
    setTimeout(() => {
        if (window.purchaseFilterInitialized) {
            filterPurchaseInvoices();
            console.log('🔄 Đã tự động cập nhật filter sau khi load dữ liệu');
        }
    }, 300);
};

// =======================
// CẬP NHẬT HÀM LOADPAYABLELIST GỐC
// =======================

// Ghi đè hàm loadPayableList gốc để sử dụng bộ lọc
const originalLoadPayableList = window.loadPayableList;

window.loadPayableList = function() {
    // Gọi hàm gốc trước để đảm bảo dữ liệu được tải
    if (originalLoadPayableList) {
        originalLoadPayableList();
    }
    
    // TỰ ĐỘNG CHẠY FILTER KHI DỮ LIỆU THAY ĐỔI
    setTimeout(() => {
        if (window.payableFilterInitialized) {
            filterPayableList();
            console.log('🔄 Đã tự động cập nhật filter công nợ sau khi load dữ liệu');
        }
    }, 300);
};

function resetPurchaseFilter() {
    console.log('🔄 Reset bộ lọc hóa đơn');
    
    // Reset các input filter
    const searchInput = document.getElementById('search-purchase-invoices');
    const dateFilter = document.getElementById('purchase-date-filter');
    const showErrorsCheckbox = document.getElementById('show-error-invoices');
    
    if (searchInput) searchInput.value = '';
    if (dateFilter) dateFilter.value = 'all';
    if (showErrorsCheckbox) showErrorsCheckbox.checked = false;
    
    // Ẩn custom date range nếu có
    const customDateRange = document.getElementById('custom-date-range');
    if (customDateRange) customDateRange.style.display = 'none';
    
    // Chạy lại filter
    filterPurchaseInvoices();
}


// THÊM NÚT RESET VÀO BỘ LỌC
// =======================

function addResetButtons() {
    console.log('🔧 addResetButtons() called');
    
    // Thêm nút reset cho filter hóa đơn
    const purchaseFilter = document.getElementById('purchase-invoice-filter');
    if (purchaseFilter && !purchaseFilter.querySelector('.reset-filter-btn')) {
        const resetBtn = document.createElement('button');
        resetBtn.className = 'btn btn-sm btn-outline-secondary reset-filter-btn';
        resetBtn.innerHTML = '🔄 Reset';
        resetBtn.style.marginLeft = '10px';
        resetBtn.onclick = resetPurchaseFilter;
        
        const cardHeader = purchaseFilter.querySelector('.card-header');
        if (cardHeader) {
            cardHeader.appendChild(resetBtn);
            console.log('✅ Đã thêm nút reset cho filter hóa đơn');
        }
    }
    
    // Thêm nút reset cho filter công nợ
    const payableFilter = document.getElementById('payable-filter');
    if (payableFilter && !payableFilter.querySelector('.reset-filter-btn')) {
        const resetBtn = document.createElement('button');
        resetBtn.className = 'btn btn-sm btn-outline-secondary reset-filter-btn';
        resetBtn.innerHTML = '🔄 Reset';
        resetBtn.style.marginLeft = '10px';
        resetBtn.onclick = resetPayableFilter;
        
        const cardHeader = payableFilter.querySelector('.card-header');
        if (cardHeader) {
            cardHeader.appendChild(resetBtn);
            console.log('✅ Đã thêm nút reset cho filter công nợ');
        }
    }
}



window.filterPayableList = filterPayableList;
window.loadMorePayable = loadMorePayable;
window.showSupplierHistory = showSupplierHistory;


// =======================
// EXPORT FUNCTIONS
// =======================
// =======================
// HÀM HIỂN THỊ TỔNG TRÊN TIÊU ĐỀ
// =======================

function updateCardHeadersWithTotals() {
    console.log('🔄 Đang cập nhật tổng trên tiêu đề...');
    
    // 1. CẬP NHẬT TIÊU ĐỀ DANH SÁCH HÓA ĐƠN MUA HÀNG
    updateInvoiceListHeader();
    
    // 2. CẬP NHẬT TIÊU ĐỀ CÔNG NỢ PHẢI TRẢ NCC
    updatePayableListHeader();
}

// =======================
// CẬP NHẬT TIÊU ĐỀ DANH SÁCH HÓA ĐƠN MUA HÀNG
// =======================

function updateInvoiceListHeader() {
    const invoiceCard = document.querySelector('#mua-hang .card:nth-child(2)');
    if (!invoiceCard) {
        console.log('❌ Không tìm thấy card Danh Sách Hóa Đơn');
        return;
    }
    
    const header = invoiceCard.querySelector('.card-header');
    if (!header) return;
    
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        // Nếu chưa có dữ liệu, hiển thị mặc định
        header.innerHTML = '2. Danh Sách Hóa Đơn Mua Hàng <span class="badge badge-secondary">0 HĐ</span>';
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoices = hkd.invoices || [];
    
    // Tính tổng
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.summary.calculatedTotal || 0), 0);
    const errorInvoices = invoices.filter(inv => 
        inv.status && inv.status.validation === 'error' && !inv.status.stockPosted
    ).length;
    
    // Tạo badge với màu sắc
    let badgeClass = 'badge-primary';
    if (errorInvoices > 0) {
        badgeClass = 'badge-danger';
    } else if (totalInvoices === 0) {
        badgeClass = 'badge-secondary';
    }
    
    header.innerHTML = `
        2. Danh Sách Hóa Đơn Mua Hàng 
        <span class="badge ${badgeClass}">
            ${totalInvoices} HĐ | ${window.formatCurrency(totalAmount)}
            ${errorInvoices > 0 ? ` | ⚠️ ${errorInvoices} lỗi` : ''}
        </span>
    `;
    
    console.log(`✅ Đã cập nhật tiêu đề HĐ: ${totalInvoices} HĐ, ${window.formatCurrency(totalAmount)}`);
}

// =======================
// CẬP NHẬT TIÊU ĐỀ CÔNG NỢ PHẢI TRẢ NCC
// =======================

function updatePayableListHeader() {
    const payableCard = document.querySelector('#mua-hang .content-body .card:nth-child(3)');
    if (!payableCard) {
        console.log('❌ Không tìm thấy card Công Nợ Phải Trả');
        return;
    }
    
    const header = payableCard.querySelector('.card-header');
    if (!header) return;
    
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        // Nếu chưa có dữ liệu, hiển thị mặc định
        header.innerHTML = `
            <div class="header-with-stats">
                <div class="header-title">3. Công Nợ Phải Trả NCC (331)</div>
                <div class="header-stats">
                    <span class="stat-badge badge-secondary">0 NCC</span>
                </div>
            </div>
        `;
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    let invoices = hkd.invoices || [];
    
    if (invoices.length === 0) {
        header.innerHTML = `
            <div class="header-with-stats">
                <div class="header-title">3. Công Nợ Phải Trả NCC (331)</div>
                <div class="header-stats">
                    <span class="stat-badge badge-secondary">0 NCC</span>
                </div>
            </div>
        `;
        return;
    }
    
    // LẤY DỮ LIỆU ĐANG ĐƯỢC FILTER (nếu có)
    const searchTerm = document.getElementById('search-payable')?.value.toLowerCase() || '';
    const debtFilter = document.getElementById('show-only-debt')?.value || 'all';
    
    // Tính toán công nợ với dữ liệu gốc trước
    const supplierDebt = calculateSupplierDebt(invoices);
    let suppliers = Object.values(supplierDebt);
    
    // Áp dụng filter tương tự như hàm filterPayableList
    if (searchTerm) {
        const searchTerms = searchTerm.split(' ').filter(term => term.length > 0);
        if (searchTerms.length > 0) {
            suppliers = suppliers.filter(supplier => {
                return searchTerms.every(term => 
                    supplier.name.toLowerCase().includes(term) ||
                    supplier.taxCode.toLowerCase().includes(term)
                );
            });
        }
    }
    
    // Lọc theo trạng thái nợ
    if (debtFilter === 'debt') {
        suppliers = suppliers.filter(supplier => supplier.remaining > 0);
    } else if (debtFilter === 'paid') {
        suppliers = suppliers.filter(supplier => supplier.remaining <= 0);
    }
    
    const totalSuppliers = suppliers.length;
    const totalDebt = suppliers.reduce((sum, supplier) => sum + supplier.totalDebt, 0);
    const totalRemaining = suppliers.reduce((sum, supplier) => sum + supplier.remaining, 0);
    const debtSuppliers = suppliers.filter(supplier => supplier.remaining > 0).length;
    
    // Tạo badge với màu sắc
    let badgeClass = 'stat-badge badge-success';
    let badgeText = `${totalSuppliers} NCC • ${window.formatCurrency(totalRemaining)} còn nợ`;
    
    if (totalRemaining > 0) {
        badgeClass = 'stat-badge badge-warning';
        badgeText += ` • 💰 ${debtSuppliers} NCC có nợ`;
    } else if (totalSuppliers === 0) {
        badgeClass = 'stat-badge badge-secondary';
        badgeText = `${totalSuppliers} NCC`;
    } else {
        badgeText += ' • ✅ Đã trả hết';
    }
    
    // Thêm thông tin filter nếu đang áp dụng
    if (searchTerm || debtFilter !== 'all') {
        badgeText += ` • 🔍 Đang lọc`;
    }
    
    header.innerHTML = `
        <div class="header-with-stats">
            <div class="header-title">3. Công Nợ Phải Trả NCC (331)</div>
            <div class="header-stats">
                <span class="${badgeClass}">${badgeText}</span>
            </div>
        </div>
    `;
    
    console.log(`✅ Đã cập nhật tiêu đề công nợ: ${totalSuppliers} NCC, ${window.formatCurrency(totalRemaining)} còn nợ`);
}


// =======================
// CẬP NHẬT CÁC HÀM HIỆN CÓ ĐỂ TỰ ĐỘNG CẬP NHẬT TIÊU ĐỀ
// =======================

// Cập nhật hàm filterPurchaseInvoices
const originalFilterPurchaseInvoices = window.filterPurchaseInvoices;
window.filterPurchaseInvoices = function() {
    if (originalFilterPurchaseInvoices) {
        originalFilterPurchaseInvoices();
    }
    // Cập nhật tiêu đề sau khi lọc
    setTimeout(updateInvoiceListHeader, 100);
};

// Cập nhật hàm filterPayableList
const originalFilterPayableList = window.filterPayableList;
window.filterPayableList = function() {
    if (originalFilterPayableList) {
        originalFilterPayableList();
    }
    // Cập nhật tiêu đề sau khi lọc
    setTimeout(updatePayableListHeader, 100);
};

// Cập nhật hàm loadPurchaseInvoices
const originalLoadPurchaseInvoicesWithHeader = window.loadPurchaseInvoices;
window.loadPurchaseInvoices = function() {
    if (originalLoadPurchaseInvoicesWithHeader) {
        originalLoadPurchaseInvoicesWithHeader();
    }
    // Cập nhật tiêu đề sau khi load
    setTimeout(updateInvoiceListHeader, 200);
};

// Cập nhật hàm loadPayableList
const originalLoadPayableListWithHeader = window.loadPayableList;
window.loadPayableList = function() {
    if (originalLoadPayableListWithHeader) {
        originalLoadPayableListWithHeader();
    }
    // Cập nhật tiêu đề sau khi load
    setTimeout(updatePayableListHeader, 200);
};

// Cập nhật khi chọn công ty
const originalSelectCompany = window.selectCompany;
window.selectCompany = function(taxCode) {
    if (originalSelectCompany) {
        originalSelectCompany(taxCode);
    }
    // Cập nhật tiêu đề sau khi chọn công ty
    setTimeout(updateCardHeadersWithTotals, 500);
};

// Cập nhật khi xử lý hóa đơn
function updateHeadersAfterInvoiceProcessing() {
    setTimeout(updateCardHeadersWithTotals, 1000);
}

// =======================
// THÊM CSS CHO BADGE
// =======================

function addHeaderBadgeStyles() {
    const styles = `
        <style>
        .card-header .badge {
            font-size: 12px;
            padding: 4px 8px;
            margin-left: 8px;
            font-weight: normal;
        }
        .badge-primary { background-color: #007bff; color: white; }
        .badge-secondary { background-color: #6c757d; color: white; }
        .badge-success { background-color: #28a745; color: white; }
        .badge-warning { background-color: #ffc107; color: #212529; }
        .badge-danger { background-color: #dc3545; color: white; }
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .card-header-text {
            flex: 1;
        }
        </style>
    `;
    
    if (!document.getElementById('header-badge-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'header-badge-styles';
        styleElement.innerHTML = styles;
        document.head.appendChild(styleElement);
    }
}
function updateCardHeadersWithTotals() {
    console.log('🔄 Đang cập nhật tổng trên tiêu đề...');
    
    // 1. CẬP NHẬT TIÊU ĐỀ DANH SÁCH HÓA ĐƠN MUA HÀNG
    updateInvoiceListHeader();
    
    // 2. CẬP NHẬT TIÊU ĐỀ CÔNG NỢ PHẢI TRẢ NCC
    updatePayableListHeader();
}

// =======================
// CẬP NHẬT TIÊU ĐỀ DANH SÁCH HÓA ĐƠN MUA HÀNG (LỚN HƠN)
// =======================

function updateInvoiceListHeader() {
    const invoiceCard = document.querySelector('#mua-hang .content-body .card:nth-child(2)');
    if (!invoiceCard) {
        console.log('❌ Không tìm thấy card Danh Sách Hóa Đơn');
        return;
    }
    
    const header = invoiceCard.querySelector('.card-header');
    if (!header) return;
    
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        // Nếu chưa có dữ liệu, hiển thị mặc định
        header.innerHTML = `
            <div class="header-with-stats">
                <div class="header-title">2. Danh Sách Hóa Đơn Mua Hàng</div>
                <div class="header-stats">
                    <span class="stat-badge badge-secondary">0 HĐ</span>
                </div>
            </div>
        `;
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    let invoices = hkd.invoices || [];
    
    // LẤY DỮ LIỆU ĐANG ĐƯỢC FILTER (nếu có)
    const searchTerm = document.getElementById('search-purchase-invoices')?.value.toLowerCase() || '';
    const dateFilter = document.getElementById('purchase-date-filter')?.value || 'all';
    const showErrorsFirst = document.getElementById('show-error-invoices')?.checked || false;
    
    // Áp dụng filter tương tự như hàm filterPurchaseInvoices
    if (searchTerm) {
        const searchTerms = searchTerm.split(' ').filter(term => term.length > 0);
        if (searchTerms.length > 0) {
            invoices = invoices.filter(invoice => {
                return searchTerms.every(term => 
                    invoice.invoiceInfo.symbol.toLowerCase().includes(term) ||
                    invoice.invoiceInfo.number.toLowerCase().includes(term) ||
                    invoice.sellerInfo.taxCode.toLowerCase().includes(term) ||
                    invoice.sellerInfo.name.toLowerCase().includes(term)
                );
            });
        }
    }
    
    // Tính tổng theo dữ liệu đã filter
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.summary.calculatedTotal || 0), 0);
    const errorInvoices = invoices.filter(inv => 
        inv.status && inv.status.validation === 'error' && !inv.status.stockPosted
    ).length;
    
    // Tạo badge với màu sắc
    let badgeClass = 'stat-badge badge-primary';
    let badgeText = `${totalInvoices} HĐ • ${window.formatCurrency(totalAmount)}`;
    
    if (errorInvoices > 0) {
        badgeClass = 'stat-badge badge-danger';
        badgeText += ` • ⚠️ ${errorInvoices} lỗi`;
    } else if (totalInvoices === 0) {
        badgeClass = 'stat-badge badge-secondary';
    }
    
    // Thêm thông tin filter nếu đang áp dụng
    if (searchTerm || dateFilter !== 'all') {
        badgeText += ` • 🔍 Đang lọc`;
    }
    
    header.innerHTML = `
        <div class="header-with-stats">
            <div class="header-title">2. Danh Sách Hóa Đơn Mua Hàng</div>
            <div class="header-stats">
                <span class="${badgeClass}">${badgeText}</span>
            </div>
        </div>
    `;
    
    console.log(`✅ Đã cập nhật tiêu đề HĐ: ${totalInvoices} HĐ, ${window.formatCurrency(totalAmount)}`);
}

// =======================
// KHỞI TẠO KHI TẢI TRANG
// =======================

document.addEventListener('DOMContentLoaded', function() {
    // Thêm CSS
    addHeaderBadgeStyles();
    
    // Cập nhật tiêu đề sau khi trang load
    setTimeout(updateCardHeadersWithTotals, 1000);
});


// =======================
// HỆ THỐNG LỌC ĐƠN GIẢN - TÌM KIẾM THỜI GIAN THỰC
// =======================

// =======================
// 1. LỌC HÓA ĐƠN MUA HÀNG (REAL-TIME)
// =======================

function setupSimplePurchaseFilters() {
    console.log('🔄 Thiết lập bộ lọc đơn giản real-time...');
    
    // Tạo HTML bộ lọc đơn giản
    createSimpleFilterUI();
    
    // Gắn sự kiện real-time
    setupRealTimeFilterEvents();
    
    console.log('✅ Đã thiết lập bộ lọc real-time');
}

function createSimpleFilterUI() {
    // Xóa bộ lọc cũ nếu có
    const oldFilter = document.getElementById('purchase-invoice-filter');
    if (oldFilter) oldFilter.remove();
    
    // Tìm card danh sách hóa đơn
    const invoiceListSection = document.querySelector('#mua-hang .content-body .card:nth-child(2)');
    if (!invoiceListSection) return;
    
    // Tạo HTML đơn giản - KHÔNG CÓ NÚT ÁP DỤNG
    const filterHtml = `
        <div class="card" id="purchase-invoice-filter">
            <div class="card-header">
                🔍 Tìm Kiếm Hóa Đơn
                <button class="btn btn-sm btn-outline-secondary" onclick="resetSimpleFilters()" style="margin-left: 10px;">
                    🔄 Xóa
                </button>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <input type="text" id="simple-search-invoices" 
                           placeholder="Tên NCC, MST, Số HĐ..." 
                           class="form-control">
                </div>
            </div>
        </div>
    `;
    
    invoiceListSection.insertAdjacentHTML('beforebegin', filterHtml);
}

function setupRealTimeFilterEvents() {
    // Tìm kiếm real-time khi nhập
    const searchInput = document.getElementById('simple-search-invoices');
    if (searchInput) {
        let timeoutId;
        
        searchInput.addEventListener('input', function(e) {
            // Debounce để tránh chạy quá nhiều lần
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                applySimpleFilters();
            }, 300); // Chờ 300ms sau khi ngừng nhập
        });
    }
}

// =======================
// 2. HÀM LỌC CHÍNH - REAL-TIME
// =======================

function applySimpleFilters() {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    let invoices = hkd.invoices || [];
    
    if (invoices.length === 0) {
        renderSimpleFilteredInvoices([]);
        return;
    }
    
    // Lấy giá trị tìm kiếm
    const searchTerm = document.getElementById('simple-search-invoices')?.value.toLowerCase() || '';
    
    // Lọc theo từ khóa (CHỈ khi có từ khóa)
    if (searchTerm) {
        const searchTerms = searchTerm.split(' ').filter(term => term.length > 0);
        if (searchTerms.length > 0) {
            invoices = invoices.filter(invoice => {
                return searchTerms.every(term => 
                    invoice.invoiceInfo.symbol.toLowerCase().includes(term) ||
                    invoice.invoiceInfo.number.toLowerCase().includes(term) ||
                    invoice.sellerInfo.taxCode.toLowerCase().includes(term) ||
                    invoice.sellerInfo.name.toLowerCase().includes(term)
                );
            });
        }
    }
    
    // SẮP XẾP MẶC ĐỊNH: Hóa đơn lỗi lên đầu
    invoices.sort((a, b) => {
        const aIsError = a.status && a.status.validation === 'error' && !a.status.stockPosted;
        const bIsError = b.status && b.status.validation === 'error' && !b.status.stockPosted;
        
        if (aIsError && !bIsError) return -1;
        if (!aIsError && bIsError) return 1;
        
        // Nếu cùng trạng thái, sắp xếp theo ngày (mới nhất trước)
        return new Date(b.invoiceInfo.date) - new Date(a.invoiceInfo.date);
    });
    
    // Hiển thị kết quả
    renderSimpleFilteredInvoices(invoices);
}

// =======================
// 3. LỌC CÔNG NỢ NCC REAL-TIME
// =======================

function setupSimplePayableFilters() {
    // Tạo HTML bộ lọc công nợ đơn giản
    createSimplePayableFilterUI();
    
    // Gắn sự kiện real-time
    setupRealTimePayableEvents();
}

function createSimplePayableFilterUI() {
    // Xóa bộ lọc cũ
    const oldFilter = document.getElementById('payable-filter');
    if (oldFilter) oldFilter.remove();
    
    // Tìm card công nợ
    const payableSection = document.querySelector('#mua-hang .content-body .card:nth-child(3)');
    if (!payableSection) return;
    
    const filterHtml = `
        <div class="card" id="payable-filter">
            <div class="card-header">
                🔍 Tìm Kiếm NCC
                <button class="btn btn-sm btn-outline-secondary" onclick="resetSimplePayableFilter()" style="margin-left: 10px;">
                    🔄 Xóa
                </button>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <input type="text" id="simple-search-payable" 
                           placeholder="Tên nhà cung cấp, MST..." 
                           class="form-control">
                </div>
            </div>
        </div>
    `;
    
    payableSection.insertAdjacentHTML('beforebegin', filterHtml);
}

function setupRealTimePayableEvents() {
    // Tìm kiếm real-time khi nhập
    const searchInput = document.getElementById('simple-search-payable');
    if (searchInput) {
        let timeoutId;
        
        searchInput.addEventListener('input', function(e) {
            // Debounce để tránh chạy quá nhiều lần
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                applySimplePayableFilter();
            }, 300);
        });
    }
}

function applySimplePayableFilter() {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) return;
    
    const hkd = window.hkdData[window.currentCompany];
    const invoices = hkd.invoices || [];
    
    // Tính toán công nợ
    const supplierDebt = calculateSupplierDebt(invoices);
    let suppliers = Object.values(supplierDebt);
    
    // Lọc theo từ khóa (CHỈ khi có từ khóa)
    const searchTerm = document.getElementById('simple-search-payable')?.value.toLowerCase() || '';
    if (searchTerm) {
        const searchTerms = searchTerm.split(' ').filter(term => term.length > 0);
        if (searchTerms.length > 0) {
            suppliers = suppliers.filter(supplier => {
                return searchTerms.every(term => 
                    supplier.name.toLowerCase().includes(term) ||
                    supplier.taxCode.toLowerCase().includes(term)
                );
            });
        }
    }
    
    // Sắp xếp theo số nợ giảm dần
    suppliers.sort((a, b) => b.remaining - a.remaining);
    
    // Hiển thị kết quả
    renderSimpleFilteredPayable(suppliers);
}

// =======================
// 4. HÀM RESET & TIỆN ÍCH
// =======================

function resetSimpleFilters() {
    document.getElementById('simple-search-invoices').value = '';
    // Load lại danh sách gốc (có sắp xếp lỗi trên cùng)
    loadPurchaseInvoicesWithDefaultSort();
}

function resetSimplePayableFilter() {
    document.getElementById('simple-search-payable').value = '';
    loadPayableListWithDefaultSort();
}


// =======================
// CẬP NHẬT TIÊU ĐỀ CÔNG NỢ VỚI THỐNG KÊ
// =======================

function createPayableFilterUI() {
    const cards = document.querySelectorAll('#mua-hang .content-body .card');
    let payableCard = null;
    
    for (let card of cards) {
        const header = card.querySelector('.card-header');
        if (header && header.textContent.includes('Công Nợ Phải Trả NCC')) {
            payableCard = card;
            break;
        }
    }
    
    if (!payableCard) return;
    
    const header = payableCard.querySelector('.card-header');
    
    // GỘP TIÊU ĐỀ + THỐNG KÊ + BỘ LỌC
    header.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <!-- BÊN TRÁI: TIÊU ĐỀ + THỐNG KÊ -->
            <div style="display: flex; align-items: center; gap: 15px;">
                <div>
                    <strong>3. Công Nợ Phải Trả NCC (331)</strong>
                </div>
                <div id="payable-stats" style="font-size: 13px; color: #666;">
                    <!-- Thống kê sẽ được cập nhật ở đây -->
                </div>
            </div>
            
            <!-- BÊN PHẢI: BỘ LỌC -->
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="display: flex; gap: 8px; align-items: center;">
                    <input type="text" id="search-payable" placeholder="Tìm NCC..." 
                           style="width: 180px; padding: 4px 8px; font-size: 12px; border: 1px solid #ddd; border-radius: 4px;">
                    <select id="debt-filter" style="padding: 4px 8px; font-size: 12px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="all">Tất cả NCC</option>
                        <option value="debt">Còn nợ</option>
                        <option value="paid">Đã trả</option>
                    </select>
                </div>
                <button class="btn btn-sm btn-outline-secondary" onclick="resetPayableFilter()">🔄</button>
            </div>
        </div>
    `;
    
    // Gắn sự kiện real-time
    setupPayableFilterEvents();
    
    // Cập nhật thống kê ban đầu
    updatePayableStats();
}

// =======================
// CẬP NHẬT THỐNG KÊ THEO BỘ LỌC
// =======================

function updatePayableStats() {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoices = hkd.invoices || [];
    const supplierDebt = calculateSupplierDebt(invoices);
    let suppliers = Object.values(supplierDebt);
    
    // Áp dụng bộ lọc hiện tại
    const searchTerm = document.getElementById('search-payable')?.value.toLowerCase() || '';
    const debtFilter = document.getElementById('debt-filter')?.value || 'all';
    
    // Lọc theo từ khóa
    if (searchTerm) {
        const searchTerms = searchTerm.split(' ').filter(term => term.length > 0);
        if (searchTerms.length > 0) {
            suppliers = suppliers.filter(supplier => {
                return searchTerms.every(term => 
                    supplier.name.toLowerCase().includes(term) ||
                    supplier.taxCode.toLowerCase().includes(term)
                );
            });
        }
    }
    
    // Lọc theo trạng thái nợ
    if (debtFilter === 'debt') {
        suppliers = suppliers.filter(supplier => supplier.remaining > 0);
    } else if (debtFilter === 'paid') {
        suppliers = suppliers.filter(supplier => supplier.remaining <= 0);
    }
    
    // Tính tổng hợp
    const totalSuppliers = suppliers.length;
    const totalDebt = suppliers.reduce((sum, supplier) => sum + supplier.totalDebt, 0);
    const totalRemaining = suppliers.reduce((sum, supplier) => sum + supplier.remaining, 0);
    const totalPaid = totalDebt - totalRemaining;
    
    // Hiển thị thống kê
    const statsElement = document.getElementById('payable-stats');
    if (statsElement) {
        if (totalSuppliers === 0) {
            statsElement.innerHTML = '<span style="color: #dc3545;">❌ Không có NCC</span>';
        } else {
            statsElement.innerHTML = `
                <span>📊 ${totalSuppliers} NCC</span> • 
                <span style="color: #e74c3c;">💰 ${window.formatCurrency(totalRemaining)} nợ</span> • 
                <span style="color: #27ae60;">💵 ${window.formatCurrency(totalPaid)} đã trả</span>
            `;
        }
    }
}

// =======================
// GẮN SỰ KIỆN REAL-TIME
// =======================

function setupPayableFilterEvents() {
    const searchInput = document.getElementById('search-payable');
    const debtFilter = document.getElementById('debt-filter');
    
    let timeoutId;
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                applyPayableFilters();
                updatePayableStats(); // CẬP NHẬT THỐNG KÊ
            }, 300);
        });
    }
    
    if (debtFilter) {
        debtFilter.addEventListener('change', function() {
            applyPayableFilters();
            updatePayableStats(); // CẬP NHẬT THỐNG KÊ
        });
    }
}
// =======================
// GIỚI HẠN HIỂN THỊ 5 NCC + NÚT XEM THÊM
// =======================

// BIẾN TOÀN CỤC
window.payableDisplayLimit = 5;

function renderSimpleFilteredPayable(suppliers) {
    const payableList = document.getElementById('payable-list');
    if (!payableList) return;
    
    payableList.innerHTML = '';
    
    if (suppliers.length === 0) {
        payableList.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">📭 Không tìm thấy NCC phù hợp</td></tr>';
        return;
    }
    
    // GIỚI HẠN HIỂN THỊ
    const displayedSuppliers = suppliers.slice(0, window.payableDisplayLimit);
    
    // HIỂN THỊ NCC
    displayedSuppliers.forEach((supplier, index) => {
        const row = document.createElement('tr');
        
        const debtLevel = supplier.remaining > 0 ? 'table-warning' : '';
        const debtStatus = supplier.remaining > 0 ? 'text-danger' : 'text-success';
        
        row.className = debtLevel;
        row.innerHTML = `
            <td>
                <strong class="supplier-name" style="cursor: pointer; color: #007bff;" 
                        onclick="showSupplierHistory('${supplier.taxCode}')">
                    ${supplier.name}
                </strong>
            </td>
            <td><code>${supplier.taxCode}</code></td>
            <td style="text-align: right;">${window.formatCurrency(supplier.totalDebt)}</td>
            <td style="text-align: right;">${window.formatCurrency(supplier.paid)}</td>
            <td style="text-align: right; font-weight: bold;" class="${debtStatus}">
                ${window.formatCurrency(supplier.remaining)}
            </td>
            <td>
                <div class="button-group-small">
                    <button class="btn-sm btn-primary" onclick="showSupplierHistory('${supplier.taxCode}')">📊</button>
                    ${supplier.remaining > 0 ? 
                      `<button class="btn-sm btn-success" onclick="makePayment('${supplier.taxCode}')">💳</button>` : 
                      ''}
                </div>
            </td>
        `;
        
        payableList.appendChild(row);
    });
    
    // HIỂN THỊ NÚT "XEM THÊM" NẾU CÒN NHIỀU NCC
    if (suppliers.length > window.payableDisplayLimit) {
        const loadMoreRow = document.createElement('tr');
        loadMoreRow.innerHTML = `
            <td colspan="6" style="text-align: center; padding: 15px;">
                <button onclick="loadMorePayable()" class="btn btn-outline-primary btn-sm">
                    📋 Xem thêm ${suppliers.length - window.payableDisplayLimit} NCC
                </button>
            </td>
        `;
        payableList.appendChild(loadMoreRow);
    }
}

// =======================
// XEM THÊM NCC
// =======================

function loadMorePayable() {
    // TĂNG GIỚI HẠN HIỂN THỊ
    window.payableDisplayLimit += 10;
    
    // RELOAD LẠI VỚI BỘ LỌC HIỆN TẠI
    applyPayableFilters();
}

// =======================
// RESET GIỚI HẠN KHI THAY ĐỔI BỘ LỌC
// =======================

function applyPayableFilters() {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) return;
    
    const hkd = window.hkdData[window.currentCompany];
    const invoices = hkd.invoices || [];
    const supplierDebt = calculateSupplierDebt(invoices);
    let suppliers = Object.values(supplierDebt);
    
    // Lọc theo từ khóa
    const searchTerm = document.getElementById('search-payable')?.value.toLowerCase() || '';
    if (searchTerm) {
        const searchTerms = searchTerm.split(' ').filter(term => term.length > 0);
        if (searchTerms.length > 0) {
            suppliers = suppliers.filter(supplier => {
                return searchTerms.every(term => 
                    supplier.name.toLowerCase().includes(term) ||
                    supplier.taxCode.toLowerCase().includes(term)
                );
            });
        }
    }
    
    // Lọc theo trạng thái nợ
    const debtFilter = document.getElementById('debt-filter')?.value || 'all';
    if (debtFilter === 'debt') {
        suppliers = suppliers.filter(supplier => supplier.remaining > 0);
    } else if (debtFilter === 'paid') {
        suppliers = suppliers.filter(supplier => supplier.remaining <= 0);
    }
    
    // Sắp xếp theo nợ giảm dần
    suppliers.sort((a, b) => b.remaining - a.remaining);
    
    // RESET GIỚI HẠN KHI THAY ĐỔI BỘ LỌC (chỉ giữ limit khi xem thêm)
    if (!window.keepPayableLimit) {
        window.payableDisplayLimit = 5;
    }
    window.keepPayableLimit = false;
    
    // Hiển thị kết quả
    renderSimpleFilteredPayable(suppliers);
    updatePayableStats();
}

// =======================
// CẬP NHẬT LOAD MORE ĐỂ GIỮ LIMIT
// =======================

function loadMorePayable() {
    // GIỮ NGUYÊN LIMIT HIỆN TẠI
    window.keepPayableLimit = true;
    window.payableDisplayLimit += 10;
    
    // RELOAD LẠI VỚI BỘ LỌC HIỆN TẠI
    applyPayableFilters();
}

// =======================
// RESET BỘ LỌC (RESET LIMIT)
// =======================

function resetPayableFilter() {
    document.getElementById('search-payable').value = '';
    document.getElementById('debt-filter').value = 'all';
    window.payableDisplayLimit = 5; // RESET VỀ 5
    window.keepPayableLimit = false;
    loadPayableListWithDefaultSort();
    updatePayableStats();
}


// =======================
// CẬP NHẬT KHI LOAD DỮ LIỆU
// =======================

function loadPayableListWithDefaultSort() {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) return;
    
    const hkd = window.hkdData[window.currentCompany];
    const invoices = hkd.invoices || [];
    const supplierDebt = calculateSupplierDebt(invoices);
    const suppliers = Object.values(supplierDebt);
    
    // Sắp xếp theo số nợ giảm dần
    suppliers.sort((a, b) => b.remaining - a.remaining);
    
    renderSimpleFilteredPayable(suppliers);
    updatePayableStats(); // CẬP NHẬT THỐNG KÊ KHI LOAD
}

// =======================
// GẮN SỰ KIỆN REAL-TIME
// =======================

function setupRealTimeEvents() {
    // Hóa đơn
    const searchInvoices = document.getElementById('search-invoices');
    const dateFilterInvoices = document.getElementById('date-filter-invoices');
    
    if (searchInvoices) {
        let timeoutId;
        searchInvoices.addEventListener('input', () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(applyInvoiceFilters, 300);
        });
    }
    
    if (dateFilterInvoices) {
        dateFilterInvoices.addEventListener('change', applyInvoiceFilters);
    }
    
    // Công nợ
    const searchPayable = document.getElementById('search-payable');
    const debtFilter = document.getElementById('debt-filter');
    
    if (searchPayable) {
        let timeoutId;
        searchPayable.addEventListener('input', () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(applyPayableFilters, 300);
        });
    }
    
    if (debtFilter) {
        debtFilter.addEventListener('change', applyPayableFilters);
    }
}



// =======================
// CẬP NHẬT THỐNG KÊ HÓA ĐƠN THEO BỘ LỌC
// =======================

function updateInvoiceStats() {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) {
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    let invoices = hkd.invoices || [];
    
    // Áp dụng bộ lọc hiện tại
    const searchTerm = document.getElementById('search-invoices')?.value.toLowerCase() || '';
    const dateFilter = document.getElementById('date-filter-invoices')?.value || 'all';
    
    // Lọc theo từ khóa
    if (searchTerm) {
        const searchTerms = searchTerm.split(' ').filter(term => term.length > 0);
        if (searchTerms.length > 0) {
            invoices = invoices.filter(invoice => {
                return searchTerms.every(term => 
                    invoice.invoiceInfo.symbol.toLowerCase().includes(term) ||
                    invoice.invoiceInfo.number.toLowerCase().includes(term) ||
                    invoice.sellerInfo.taxCode.toLowerCase().includes(term) ||
                    invoice.sellerInfo.name.toLowerCase().includes(term)
                );
            });
        }
    }
    
    // Lọc theo ngày
    if (dateFilter !== 'all') {
        invoices = filterInvoicesByDate(invoices, dateFilter);
    }
    
    // Tính tổng hợp
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.summary.calculatedTotal || 0), 0);
    const errorInvoices = invoices.filter(inv => 
        inv.status && inv.status.validation === 'error' && !inv.status.stockPosted
    ).length;
    
    // Hiển thị thống kê
    const statsElement = document.getElementById('invoice-stats');
    if (statsElement) {
        if (totalInvoices === 0) {
            statsElement.innerHTML = '<span style="color: #dc3545;">❌ Không có HĐ</span>';
        } else {
            statsElement.innerHTML = `
                <span>📊 ${totalInvoices} HĐ</span> • 
                <span style="color: #007bff;">💰 ${window.formatCurrency(totalAmount)}</span> • 
                <span style="color: #e74c3c;">⚠️ ${errorInvoices} lỗi</span>
            `;
        }
    }
}

// BIẾN TOÀN CỤC
window.invoiceDisplayLimit = 5;
window.currentFilteredInvoices = [];

function loadMoreInvoices() {
    console.log(`🔄 Nhấn xem thêm, limit hiện tại: ${window.invoiceDisplayLimit}`);
    
    // TĂNG GIỚI HẠN HIỂN THỊ
    window.keepInvoiceLimit = true;
    window.invoiceDisplayLimit += 10;
    
    console.log(`🔄 Limit mới: ${window.invoiceDisplayLimit}`);
    
    // HIỂN THỊ LẠI VỚI DỮ LIỆU ĐÃ LỌC
    if (window.currentFilteredInvoices && window.currentFilteredInvoices.length > 0) {
        renderSimpleFilteredInvoices(window.currentFilteredInvoices);
    } else {
        // Nếu không có dữ liệu đã lọc, chạy lại filter
        applyInvoiceFilters();
    }
}

// =======================
// HÀM LỌC HÓA ĐƠN (CẬP NHẬT)
// =======================

function applyInvoiceFilters() {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) return;
    
    const hkd = window.hkdData[window.currentCompany];
    let invoices = hkd.invoices || [];
    
    // Lọc theo từ khóa
    const searchTerm = document.getElementById('search-invoices')?.value.toLowerCase() || '';
    if (searchTerm) {
        const searchTerms = searchTerm.split(' ').filter(term => term.length > 0);
        if (searchTerms.length > 0) {
            invoices = invoices.filter(invoice => {
                return searchTerms.every(term => 
                    invoice.invoiceInfo.symbol.toLowerCase().includes(term) ||
                    invoice.invoiceInfo.number.toLowerCase().includes(term) ||
                    invoice.sellerInfo.taxCode.toLowerCase().includes(term) ||
                    invoice.sellerInfo.name.toLowerCase().includes(term)
                );
            });
        }
    }
    
    // Lọc theo ngày
    const dateFilter = document.getElementById('date-filter-invoices')?.value || 'all';
    if (dateFilter !== 'all') {
        invoices = filterInvoicesByDate(invoices, dateFilter);
    }
    
    // Sắp xếp: lỗi trên đầu
    invoices.sort((a, b) => {
        const aIsError = a.status && a.status.validation === 'error' && !a.status.stockPosted;
        const bIsError = b.status && b.status.validation === 'error' && !b.status.stockPosted;
        if (aIsError && !bIsError) return -1;
        if (!aIsError && bIsError) return 1;
        return new Date(b.invoiceInfo.date) - new Date(a.invoiceInfo.date);
    });
    
    // LƯU KẾT QUẢ LỌC ĐỂ DÙNG CHO LOAD MORE
    window.currentFilteredInvoices = invoices;
    
    // RESET GIỚI HẠN KHI THAY ĐỔI BỘ LỌC (không phải load more)
    if (!window.keepInvoiceLimit) {
        window.invoiceDisplayLimit = 5;
    }
    window.keepInvoiceLimit = false;
    
    // Hiển thị kết quả
    renderSimpleFilteredInvoices(window.currentFilteredInvoices);
    updateInvoiceStats();
}
function createInvoiceFilterUI() {
    const cards = document.querySelectorAll('#mua-hang .content-body .card');
    let invoiceCard = null;
    
    for (let card of cards) {
        const header = card.querySelector('.card-header');
        if (header && header.textContent.includes('Danh Sách Hóa Đơn Mua Hàng')) {
            invoiceCard = card;
            break;
        }
    }
    
    if (!invoiceCard) return;
    
    const header = invoiceCard.querySelector('.card-header');
    
    // GỘP TIÊU ĐỀ + THỐNG KÊ + BỘ LỌC (THÊM DROPDOWN NGÀY)
    header.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <!-- BÊN TRÁI: TIÊU ĐỀ + THỐNG KÊ -->
            <div style="display: flex; align-items: center; gap: 15px;">
                <div>
                    <strong>2. Danh Sách Hóa Đơn Mua Hàng</strong>
                </div>
                <div id="invoice-stats" style="font-size: 13px; color: #666;">
                    <!-- Thống kê sẽ được cập nhật ở đây -->
                </div>
            </div>
            
            <!-- BÊN PHẢI: BỘ LỌC (THÊM DROPDOWN NGÀY) -->
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="display: flex; gap: 8px; align-items: center;">
                    <input type="text" id="search-invoices" placeholder="Tìm HĐ, NCC..." 
                           style="width: 180px; padding: 4px 8px; font-size: 12px; border: 1px solid #ddd; border-radius: 4px;">
                    <select id="date-filter-invoices" style="padding: 4px 8px; font-size: 12px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="all">Tất cả thời gian</option>
                        <option value="today">Hôm nay</option>
                        <option value="yesterday">Hôm qua</option>
                        <option value="week">Tuần này</option>
                        <option value="month">Tháng này</option>
                        <option value="last-month">Tháng trước</option>
                        <option value="custom">Tùy chọn...</option>
                    </select>
                </div>
                <button class="btn btn-sm btn-outline-secondary" onclick="resetInvoiceFilter()">🔄</button>
            </div>
        </div>
        
        <!-- KHOẢNG NGÀY TÙY CHỌN (ẨN MẶC ĐỊNH) -->
        <div id="custom-date-range" style="display: none; margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
            <div style="display: flex; gap: 10px; align-items: center;">
                <div style="flex: 1;">
                    <label style="font-size: 12px; margin-bottom: 4px; display: block;">Từ ngày</label>
                    <input type="date" id="start-date" style="width: 100%; padding: 4px 8px; font-size: 12px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div style="flex: 1;">
                    <label style="font-size: 12px; margin-bottom: 4px; display: block;">Đến ngày</label>
                    <input type="date" id="end-date" style="width: 100%; padding: 4px 8px; font-size: 12px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div>
                    <button onclick="applyCustomDateRange()" class="btn btn-primary btn-sm" style="margin-top: 16px;">Áp dụng</button>
                </div>
            </div>
        </div>
    `;
    
    // Gắn sự kiện real-time
    setupInvoiceFilterEvents();
    
    // Cập nhật thống kê ban đầu
    updateInvoiceStats();
}

// =======================
// XỬ LÝ KHI CHỌN "TÙY CHỌN..." TRONG DROPDOWN
// =======================

function setupInvoiceFilterEvents() {
    const searchInput = document.getElementById('search-invoices');
    const dateFilter = document.getElementById('date-filter-invoices');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    let timeoutId;
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                applyInvoiceFilters();
                updateInvoiceStats();
            }, 300);
        });
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', function() {
            const customDateRange = document.getElementById('custom-date-range');
            
            if (this.value === 'custom') {
                // HIỆN KHOẢNG NGÀY TÙY CHỌN
                customDateRange.style.display = 'block';
            } else {
                // ẨN KHOẢNG NGÀY TÙY CHỌN VÀ ÁP DỤNG LỌC
                customDateRange.style.display = 'none';
                applyInvoiceFilters();
                updateInvoiceStats();
            }
        });
    }
    
    // TỰ ĐỘNG ÁP DỤNG KHI THAY ĐỔI NGÀY TÙY CHỌN
    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', function() {
            if (this.value && document.getElementById('end-date').value) {
                applyInvoiceFilters();
                updateInvoiceStats();
            }
        });
        
        endDateInput.addEventListener('change', function() {
            if (this.value && document.getElementById('start-date').value) {
                applyInvoiceFilters();
                updateInvoiceStats();
            }
        });
    }
}

// =======================
// ÁP DỤNG KHOẢNG NGÀY TÙY CHỌN
// =======================

function applyCustomDateRange() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!startDate || !endDate) {
        alert('Vui lòng chọn cả ngày bắt đầu và ngày kết thúc');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        alert('Ngày bắt đầu không thể lớn hơn ngày kết thúc');
        return;
    }
    
    applyInvoiceFilters();
    updateInvoiceStats();
}

// =======================
// CẬP NHẬT HÀM LỌC THEO NGÀY (THÊM XỬ LÝ TÙY CHỌN)
// =======================

function filterInvoicesByDate(invoices, dateFilter) {
    if (dateFilter === 'all') return invoices;
    
    const now = new Date();
    let startDate, endDate;
    
    switch(dateFilter) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            break;
            
        case 'yesterday':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
            
        case 'week':
            const dayOfWeek = now.getDay();
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            break;
            
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            break;
            
        case 'last-month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
            
        case 'custom':
            const startInput = document.getElementById('start-date')?.value;
            const endInput = document.getElementById('end-date')?.value;
            
            if (startInput && endInput) {
                startDate = new Date(startInput);
                endDate = new Date(endInput);
                endDate.setDate(endDate.getDate() + 1); // Bao gồm cả ngày kết thúc
            } else {
                return invoices; // Nếu không có ngày tùy chọn, hiển thị tất cả
            }
            break;
            
        default:
            return invoices;
    }
    
    return invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.invoiceInfo.date);
        return invoiceDate >= startDate && invoiceDate < endDate;
    });
}

// =======================
// RESET BỘ LỌC (THÊM RESET NGÀY TÙY CHỌN)
// =======================

function resetInvoiceFilter() {
    document.getElementById('search-invoices').value = '';
    document.getElementById('date-filter-invoices').value = 'all';
    
    // RESET NGÀY TÙY CHỌN
    document.getElementById('custom-date-range').style.display = 'none';
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    
    window.invoiceDisplayLimit = 5;
    window.keepInvoiceLimit = false;
    loadPurchaseInvoicesWithDefaultSort();
    updateInvoiceStats();
}

function loadPurchaseInvoicesWithDefaultSort() {
    if (!window.currentCompany || !window.hkdData[window.currentCompany]) return;
    
    const hkd = window.hkdData[window.currentCompany];
    let invoices = hkd.invoices || [];
    
    // Sắp xếp: lỗi trên đầu
    invoices.sort((a, b) => {
        const aIsError = a.status && a.status.validation === 'error' && !a.status.stockPosted;
        const bIsError = b.status && b.status.validation === 'error' && !b.status.stockPosted;
        if (aIsError && !bIsError) return -1;
        if (!aIsError && bIsError) return 1;
        return new Date(b.invoiceInfo.date) - new Date(a.invoiceInfo.date);
    });
    
    // LƯU KẾT QUẢ LỌC
    window.currentFilteredInvoices = invoices;
    
    // RESET LIMIT
    window.invoiceDisplayLimit = 5;
    window.keepInvoiceLimit = false;
    
    renderSimpleFilteredInvoices(invoices);
    updateInvoiceStats();
}
function checkDateInputSupport() {
    const testInput = document.createElement('input');
    testInput.setAttribute('type', 'date');
    return testInput.type === 'date';
}
function initSimpleFilters() {
    // Kiểm tra hỗ trợ input date
    const supportsDateInput = checkDateInputSupport();
    console.log('📅 Trình duyệt hỗ trợ input date:', supportsDateInput);
    
    if (!supportsDateInput) {
        // Nếu không hỗ trợ, thêm fallback
        addDatePickerFallback();
    }
    
    createPayableFilterUI();
    createInvoiceFilterUI();
    
    setupPayableFilterEvents();
    setupInvoiceFilterEvents();
    
    window.loadPurchaseInvoices = loadPurchaseInvoicesWithDefaultSort;
    window.loadPayableList = loadPayableListWithDefaultSort;
}
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initSimpleFilters, 1000);
});

// =======================
// 7. HIỂN THỊ KẾT QUẢ (GIỮ NGUYÊN)
// =======================

function renderSimpleFilteredInvoices(invoices) {
    const invoiceList = document.getElementById('purchase-invoice-list');
    if (!invoiceList) return;
    
    invoiceList.innerHTML = '';
    
    if (invoices.length === 0) {
        invoiceList.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">📭 Không tìm thấy hóa đơn phù hợp</td></tr>';
        return;
    }
    
    // GIỚI HẠN HIỂN THỊ THEO invoiceDisplayLimit
    const displayedInvoices = invoices.slice(0, window.invoiceDisplayLimit);
    
    console.log(`📊 Hiển thị ${displayedInvoices.length}/${invoices.length} hóa đơn, limit: ${window.invoiceDisplayLimit}`);
    
    // HIỂN THỊ HÓA ĐƠN
    displayedInvoices.forEach((invoice, index) => {
        const row = document.createElement('tr');
        
        let statusBadge = '';
        let statusClass = '';
        
        if (invoice.status && invoice.status.stockPosted) {
            statusBadge = '<span class="badge badge-success">✅ Đã nhập kho</span>';
            statusClass = 'table-success';
        } else if (invoice.status && invoice.status.validation === 'error') {
            statusBadge = '<span class="badge badge-danger">❌ Lỗi</span>';
            statusClass = 'table-danger';
        } else {
            statusBadge = '<span class="badge badge-warning">⚠️ Chưa xử lý</span>';
            statusClass = 'table-warning';
        }

        row.className = statusClass;
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${invoice.invoiceInfo.symbol}/${invoice.invoiceInfo.number}</strong></td>
            <td>${window.formatDate(invoice.invoiceInfo.date)}</td>
            <td>${invoice.sellerInfo.name}</td>
            <td><code>${invoice.sellerInfo.taxCode}</code></td>
            <td style="text-align: right;">${window.formatCurrency(invoice.summary.calculatedTotal)}</td>
            <td style="text-align: right;">${window.formatCurrency(invoice.summary.calculatedTax)}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="button-group-small">
                    <button class="btn-sm btn-info" onclick="viewPurchaseInvoiceDetail('${invoice.originalFileId}')">👁️</button>
                    <button class="btn-sm btn-warning" onclick="editPurchaseInvoice('${invoice.originalFileId}')">✏️</button>
                    ${(!invoice.status || !invoice.status.stockPosted) ? 
                      `<button class="btn-sm btn-primary" onclick="createPurchaseReceipt('${invoice.originalFileId}')">📦</button>` : 
                      ''}
                </div>
            </td>
        `;
        
        invoiceList.appendChild(row);
    });
    
    // HIỂN THỊ NÚT "XEM THÊM" NẾU CÒN NHIỀU HĐ
    if (invoices.length > window.invoiceDisplayLimit) {
        const remainingCount = invoices.length - window.invoiceDisplayLimit;
        const loadMoreRow = document.createElement('tr');
        loadMoreRow.innerHTML = `
            <td colspan="9" style="text-align: center; padding: 15px;">
                <button onclick="loadMoreInvoices()" class="btn btn-outline-primary btn-sm">
                    📋 Xem thêm ${remainingCount} HĐ
                </button>
            </td>
        `;
        invoiceList.appendChild(loadMoreRow);
        
        console.log(`🔍 Còn ${remainingCount} HĐ, hiển thị nút xem thêm`);
    } else {
        console.log(`✅ Đã hiển thị tất cả ${invoices.length} HĐ`);
    }
}

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initSimpleFilters, 1000);
});

// =======================
// EXPORT CÁC HÀM
// =======================

window.updateCardHeadersWithTotals = updateCardHeadersWithTotals;
window.updateInvoiceListHeader = updateInvoiceListHeader;
window.updatePayableListHeader = updatePayableListHeader;
window.updateHeadersAfterInvoiceProcessing = updateHeadersAfterInvoiceProcessing;
window.initPayableFilter = initPayableFilter;
window.filterPayableList = filterPayableList;
window.loadMorePayable = loadMorePayable;
window.calculateSupplierDebt = calculateSupplierDebt;
window.renderFilteredPayableList = renderFilteredPayableList;
window.updatePayableFilterStats = updatePayableFilterStats;
window.resetPurchaseFilter = resetPurchaseFilter;
window.resetPayableFilter = resetPayableFilter;