// =======================================================
// KHỞI TẠO DỮ LIỆU VÀ BIẾN TOÀN CỤC
// =======================================================
window.hkdData = {}; // Dữ liệu toàn bộ các công ty (MST -> {name, invoices, tonkhoMain, exports})
window.currentCompany = null; // MST của công ty đang được chọn

const STORAGE_KEY = 'hkd_manager_data';

// =======================================================
// CÁC HÀM TIỆN ÍCH CHUNG
// =======================================================

/**
 * Định dạng tiền tệ VND
 */
function formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) return '0';
    return accountingRound(amount).toLocaleString('vi-VN');
}
window.formatCurrency = formatCurrency;

/**
 * Định dạng ngày tháng
 */
function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    } catch {
        return dateString;
    }
}
window.formatDate = formatDate;

/**
 * Làm tròn kế toán
 */
function accountingRound(amount) {
    return Math.round(amount);
}
window.accountingRound = accountingRound;

/**
 * Hiển thị Modal tùy chỉnh
 */
// =======================
// THÊM HÀM CLOSE MODAL VÀO GLOBAL SCOPE
// =======================
function closeModal() {
    const modal = document.getElementById('custom-modal');
    if (modal) {
        modal.remove();
    }
}
window.closeModal = closeModal;

// =======================
// SỬA HÀM CHECKMODALFUNCTION ĐỂ ĐẢM BẢO CÓ CLOSEMODAL
// =======================
function checkModalFunction() {
    console.log('🔍 Kiểm tra hàm modal:');
    console.log('- showModal:', typeof window.showModal);
    console.log('- closeModal:', typeof window.closeModal);
    
    // Đảm bảo showModal tồn tại
    if (typeof window.showModal !== 'function') {
        console.error('❌ Hàm showModal không tồn tại, đang thêm fallback...');
        
        // Fallback modal đơn giản
        window.showModal = function(title, content, size = '') {
            const modalHtml = `
                <div id="custom-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
                    <div style="background: white; padding: 20px; border-radius: 8px; max-width: 90%; max-height: 90%; overflow: auto; width: ${size === 'modal-xl' ? '1200px' : '800px'}">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h3 style="margin: 0; flex: 1;">${title}</h3>
                            <button onclick="closeModal()" style="background: none; border: none; font-size: 20px; cursor: pointer;">❌</button>
                        </div>
                        <div>${content}</div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        };
    }
    
    // Đảm bảo closeModal tồn tại
    if (typeof window.closeModal !== 'function') {
        console.error('❌ Hàm closeModal không tồn tại, đang thêm...');
        window.closeModal = closeModal;
    }
    
    console.log('✅ Đã kiểm tra modal functions');
}
function showModal(title, content) {
    const existingModal = document.getElementById('custom-modal');
    if (existingModal) document.body.removeChild(existingModal);

    const modal = document.createElement('div');
    modal.id = 'custom-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.6)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';

    // Xác định kích thước modal dựa trên tiêu đề
    const isEditModal = title.includes('Chỉnh Sửa Hóa Đơn') || title.includes('Chi Tiết Hóa Đơn');
    
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = 'white';
    modalContent.style.padding = '25px';
    modalContent.style.borderRadius = '10px';
    modalContent.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
    
    if (isEditModal) {
        // Modal lớn 90% cho chỉnh sửa hóa đơn
        modalContent.style.width = '95%';
        modalContent.style.height = '95%';
        modalContent.style.maxWidth = '95%';
        modalContent.style.maxHeight = '95%';
        modalContent.style.overflow = 'auto';
    } else {
        // Modal thường cho các popup khác
        modalContent.style.maxWidth = '90%';
        modalContent.style.maxHeight = '90%';
        modalContent.style.overflow = 'auto';
        modalContent.style.width = '700px';
    }

    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid var(--primary); padding-bottom: 15px;">
            <h3 style="margin: 0; color: var(--primary); font-size: 24px; font-weight: bold;">${title}</h3>
            <button id="close-modal" style="background: var(--danger); color: white; border: none; font-size: 20px; cursor: pointer; padding: 8px 15px; border-radius: 5px; transition: background 0.3s;">&times;</button>
        </div>
        <div class="modal-body" style="${isEditModal ? 'max-height: calc(95vh - 150px); overflow-y: auto; padding: 10px;' : ''}">${content}</div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    document.getElementById('close-modal').addEventListener('click', function() {
        document.body.removeChild(modal);
    });

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

window.showModal = showModal;
// =======================
// SỬA HÀM SAVEINVOICECHANGES - THAY THẾ WINDOW.CLOSEMODAL() BẰNG CLOSEMODAL()
// =======================
function saveInvoiceChanges(invoiceId) {
    if (!window.currentCompany || !window.hkdData) {
        alert('❌ Chưa chọn công ty hoặc dữ liệu không tồn tại');
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === invoiceId);
    
    if (!invoice) {
        alert('❌ Không tìm thấy hóa đơn');
        return;
    }

    // Cập nhật thông tin cơ bản
    const invoiceNumberInput = document.getElementById('edit-invoice-number');
    const invoiceDateInput = document.getElementById('edit-invoice-date');
    const supplierNameInput = document.getElementById('edit-supplier-name');
    const supplierTaxCodeInput = document.getElementById('edit-supplier-taxcode');
    
    if (invoiceNumberInput) {
        const invoiceNumber = invoiceNumberInput.value;
        const numberParts = invoiceNumber.split('/');
        if (numberParts.length === 2) {
            invoice.invoiceInfo.symbol = numberParts[0];
            invoice.invoiceInfo.number = numberParts[1];
        }
    }
    
    if (invoiceDateInput) {
        invoice.invoiceInfo.date = invoiceDateInput.value;
    }
    
    if (supplierNameInput) {
        invoice.sellerInfo.name = supplierNameInput.value;
    }
    
    if (supplierTaxCodeInput) {
        invoice.sellerInfo.taxCode = supplierTaxCodeInput.value;
    }
    
    // Cập nhật tổng hợp
    const totalAmountInput = document.getElementById('edit-total-amount');
    const taxAmountInput = document.getElementById('edit-tax-amount');
    const totalPaymentInput = document.getElementById('edit-total-payment');
    
    if (totalAmountInput) {
        invoice.summary.calculatedAmountAfterDiscount = parseFloat(totalAmountInput.value) || 0;
    }
    
    if (taxAmountInput) {
        invoice.summary.calculatedTax = parseFloat(taxAmountInput.value) || 0;
    }
    
    if (totalPaymentInput) {
        invoice.summary.calculatedTotal = parseFloat(totalPaymentInput.value) || 0;
    }

    // Cập nhật tồn kho nếu hóa đơn đã được nhập kho
    if (invoice.status && invoice.status.stockPosted) {
        updateStockAfterInvoiceEdit(invoice);
    }

    // Lưu dữ liệu
    if (typeof window.saveData === 'function') {
        window.saveData();
    }

    // SỬA Ở ĐÂY: Thay window.closeModal() bằng closeModal()
    closeModal();
    
    // Cập nhật giao diện
    loadPurchaseInvoices();
    if (typeof window.renderStock === 'function') window.renderStock();
    
    alert('✅ Đã lưu thay đổi thành công!');
    console.log('💾 Đã lưu thay đổi hóa đơn:', invoiceId);
}

// =======================
// SỬA CÁC HÀM KHÁC CŨNG GỌI CLOSEMODAL
// =======================
function removeProduct(invoiceId, productIndex) {
    if (!confirm('❌ Bạn có chắc muốn xóa sản phẩm này?')) {
        return;
    }
    
    if (!window.currentCompany || !window.hkdData) {
        console.error('❌ Chưa chọn công ty hoặc dữ liệu không tồn tại');
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === invoiceId);
    
    if (invoice && invoice.products[productIndex]) {
        invoice.products.splice(productIndex, 1);
        
        // Cập nhật lại STT
        invoice.products.forEach((product, index) => {
            product.stt = index + 1;
        });
        
        // SỬA Ở ĐÂY: Thay window.closeModal() bằng closeModal()
        closeModal();
        setTimeout(() => {
            editPurchaseInvoice(invoiceId);
        }, 100);
        
        console.log(`✅ Đã xóa sản phẩm ${productIndex}`);
    }
}

function addNewProduct(invoiceId) {
    if (!window.currentCompany || !window.hkdData) {
        console.error('❌ Chưa chọn công ty hoặc dữ liệu không tồn tại');
        return;
    }
    
    const hkd = window.hkdData[window.currentCompany];
    const invoice = hkd.invoices.find(inv => inv.originalFileId === invoiceId);
    
    if (invoice) {
        const newProduct = {
            stt: invoice.products.length + 1,
            msp: 'NEW',
            name: 'Sản phẩm mới',
            unit: 'cái',
            quantity: 1,
            price: 0,
            amount: 0
        };
        
        invoice.products.push(newProduct);
        
        // SỬA Ở ĐÂY: Thay window.closeModal() bằng closeModal()
        closeModal();
        setTimeout(() => {
            editPurchaseInvoice(invoiceId);
        }, 100);
        
        console.log('✅ Đã thêm sản phẩm mới');
    }
}

// =======================
// THÊM HÀM CLOSE MODAL VÀO EXPORT
// =======================
window.closeModal = closeModal;
// =======================================================
// QUẢN LÝ DỮ LIỆU (localStorage)
// =======================================================

function loadData() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            window.hkdData = JSON.parse(savedData);
            console.log('Dữ liệu đã được tải từ LocalStorage.');
        }
    } catch (e) {
        console.error('Lỗi khi tải dữ liệu từ LocalStorage:', e);
        window.hkdData = {};
    }
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(window.hkdData));
        console.log('Dữ liệu đã được lưu vào LocalStorage.');
    } catch (e) {
        console.error('Lỗi khi lưu dữ liệu vào LocalStorage:', e);
    }
}

// =======================================================
// QUẢN LÝ CÔNG TY VÀ GIAO DIỆN CHÍNH
// =======================================================
// Toggle sidebar trên mobile
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('mobile-open');
}

// Đóng sidebar khi click overlay
function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('mobile-open');
}

// Gắn sự kiện
function renderCompanyList() {
    const companyList = document.getElementById('company-list');
    if (!companyList) {
        console.error('❌ Không tìm thấy #company-list');
        return;
    }

    companyList.innerHTML = '';

    if (!window.hkdData || Object.keys(window.hkdData).length === 0) {
        companyList.innerHTML = '<div class="company-item no-company">📭 Chưa có công ty nào</div>';
        return;
    }

    const companies = Object.keys(window.hkdData).sort();
    
    companies.forEach(taxCode => {
        const company = window.hkdData[taxCode];
        const companyItem = document.createElement('div');
        companyItem.className = 'company-item';
        if (taxCode === window.currentCompany) {
            companyItem.classList.add('active');
        }
        
        // Tính tổng số lượng tồn kho
        const totalStock = Array.isArray(company.tonkhoMain) 
            ? company.tonkhoMain.reduce((sum, p) => sum + (p.quantity || 0), 0)
            : 0;

        companyItem.innerHTML = `
            <div class="company-name">${company.name || 'Chưa có tên'}</div>
            <div class="company-mst">MST: ${taxCode}</div>
            <div class="company-info">
                <small>🧾 HĐ: ${company.invoices?.length || 0} | 📦 Tồn kho: ${totalStock.toLocaleString('vi-VN')} SP</small>
            </div>
        `;

        companyItem.addEventListener('click', () => {
            selectCompany(taxCode);
        });

        companyList.appendChild(companyItem);
    });
    
    console.log(`✅ Đã render ${companies.length} công ty`);
}



function setupTabSwitching() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            showTab(tabName);
        });
    });
}

// =======================================================
// KHỞI TẠO ỨNG DỤNG - SỬA LỖI
// =======================================================
// =======================
// SỬA HÀM SHOWTAB - CẬP NHẬT HEADER
// =======================
function showTab(tabName) {
    // Ẩn tất cả nội dung tab
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Bỏ active của tất cả nút tab
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Hiển thị nội dung tab và đánh dấu nút tab
    const tabContent = document.getElementById(tabName);
    const navTab = document.querySelector(`.nav-tab[data-tab="${tabName}"]`);

    if (tabContent && navTab) {
        tabContent.classList.add('active');
        navTab.classList.add('active');
        
        // CẬP NHẬT HEADER VỚI TAB HIỆN TẠI
        updateHeaderWithCurrentTab(tabName);
        
        // Khởi tạo module tương ứng khi chuyển tab
        setTimeout(() => {
            switch(tabName) {
                case 'so-du-dau-ky':
                    if (typeof window.initSoDuDauKyModule === 'function') window.initSoDuDauKyModule();
                    break;
                case 'mua-hang':
                    if (typeof window.initMuaHangModule === 'function') window.initMuaHangModule();
                    break;
                case 'kho-hang':
                    if (typeof window.initKhoHangModule === 'function') window.initKhoHangModule();
                    break;
                case 'ban-hang':
                    if (typeof window.initBanHangModule === 'function') window.initBanHangModule();
                    break;
                case 'tien-cong-no':
                    if (typeof window.initTienCongNoModule === 'function') window.initTienCongNoModule();
                    break;
                case 'thue-bao-cao':
                    if (typeof window.initThueBaoCaoModule === 'function') window.initThueBaoCaoModule();
                    break;
                case 'so-sach':
                    if (typeof window.initSoSachModule === 'function') window.initSoSachModule();
                    break;
                case 'xu-ly-hoa-don-loi':
                    if (typeof window.initXuLyHoaDonLoiModule === 'function') window.initXuLyHoaDonLoiModule();
                    break;
            }
        }, 100);
    }
}

// =======================
// HÀM CẬP NHẬT HEADER VỚI TAB HIỆN TẠI
// =======================
function updateHeaderWithCurrentTab(tabName) {
    const currentCompanyElem = document.getElementById('current-company');
    if (!currentCompanyElem) return;

    const tabNames = {
        'so-du-dau-ky': 'Số Dư Đầu Kỳ',
        'mua-hang': 'Mua Hàng',
        'kho-hang': 'Kho Hàng',
        'ban-hang': 'Bán Hàng',
        'tien-cong-no': 'Tiền & Công Nợ',
        'thue-bao-cao': 'Thuế & Báo Cáo',
        'so-sach': 'Sổ Sách',
        'xu-ly-hoa-don-loi': 'Xử Lý Hóa Đơn Lỗi'
    };

    const currentTabName = tabNames[tabName] || tabName;
    
    if (window.currentCompany && window.hkdData[window.currentCompany]) {
        const companyName = window.hkdData[window.currentCompany].name || window.currentCompany;
        currentCompanyElem.innerHTML = `
            <span class="current-tab">${currentTabName}</span>
            <span class="company-info">🏢 ${companyName} (MST: ${window.currentCompany})</span>
        `;
    } else {
        currentCompanyElem.innerHTML = `
            <span class="current-tab">${currentTabName}</span>
            <span class="company-info">👈 Chọn công ty để xem thông tin</span>
        `;
    }
}

// =======================
// SỬA HÀM SELECTCOMPANY - CẬP NHẬT HEADER
// =======================
function selectCompany(taxCode) {
    if (window.currentCompany === taxCode) return;
    
    window.currentCompany = taxCode;
    saveData();

    // Cập nhật giao diện sidebar và header
    renderCompanyList();
    
    // Lấy tab hiện tại và cập nhật header
    const currentTab = document.querySelector('.nav-tab.active')?.getAttribute('data-tab') || 'so-du-dau-ky';
    updateHeaderWithCurrentTab(currentTab);
    
    // Cập nhật tên công ty trên các tab
    const companyNameElements = [
        'company-name-so-du', 'company-name-mua-hang', 'company-name-kho-hang',
        'company-name-ban-hang', 'company-name-tien-cong-no', 
        'company-name-thue-bao-cao', 'company-name-so-sach', 'company-name-xu-ly'
    ];
    
    companyNameElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            const companyName = window.hkdData[taxCode].name || taxCode;
            element.textContent = companyName;
        }
    });

    // Kích hoạt các module
    showTab(currentTab);

    // Cập nhật dữ liệu cho các tab
    if (typeof window.loadOpeningBalance === 'function') window.loadOpeningBalance();
    if (typeof window.loadPurchaseInvoices === 'function') window.loadPurchaseInvoices();
    if (typeof window.loadProductCatalog === 'function') window.loadProductCatalog();
    if (typeof window.loadSaleOrders === 'function') window.loadSaleOrders();
    if (typeof window.loadCashBook === 'function') window.loadCashBook();
    if (typeof window.loadVATSummary === 'function') window.loadVATSummary();
    
    console.log(`Đã chọn công ty: ${taxCode}`);
}

// =======================
// THÊM CSS CHO HEADER
// =======================
function addHeaderStyles() {
    const styles = `
        <style>
        .current-company {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 4px;
        }
        
        .current-tab {
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .company-info {
            font-size: 14px;
            color: #7f8c8d;
            background: rgba(255, 255, 255, 0.1);
            padding: 4px 8px;
            border-radius: 4px;
        }
        
        @media (max-width: 768px) {
            .current-company {
                align-items: flex-start;
            }
            
            .current-tab {
                font-size: 16px;
            }
            
            .company-info {
                font-size: 12px;
            }
        }
        </style>
    `;
    
    // Chỉ thêm CSS nếu chưa tồn tại
    if (!document.getElementById('header-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'header-styles';
        styleElement.innerHTML = styles;
        document.head.appendChild(styleElement);
    }
}

// =======================
// CẬP NHẬT KHỞI TẠO ỨNG DỤNG
// =======================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Đang khởi động ứng dụng...');
    
    // 1. Tải dữ liệu từ LocalStorage
    loadData();
    
    // 2. Thêm CSS cho header
    addHeaderStyles();
    
    // 3. Thiết lập chuyển đổi tab
    setupTabSwitching();

    // 4. Hiển thị danh sách công ty
    renderCompanyList();

    // 5. Kiểm tra nếu có công ty đang được chọn
    if (window.currentCompany && window.hkdData[window.currentCompany]) {
        selectCompany(window.currentCompany);
    } else {
        // Hiển thị tab đầu tiên
        const firstTab = document.querySelector('.nav-tab');
        if (firstTab) {
            const tabName = firstTab.getAttribute('data-tab');
            showTab(tabName);
        }
    }

    // 6. Gắn sự kiện cho nút "Xóa hết dữ liệu"
    setTimeout(() => {
        setupClearDataButton();
    }, 100);

    console.log('✅ Ứng dụng đã khởi động hoàn tất.');
});

// =======================
// THÊM HÀM INIT CHO TAB XỬ LÝ HÓA ĐƠN LỖI (NẾU CHƯA CÓ)
// =======================
if (typeof window.initXuLyHoaDonLoiModule === 'undefined') {
    window.initXuLyHoaDonLoiModule = function() {
        console.log('🔄 Đang khởi tạo module Xử Lý Hóa Đơn Lỗi...');
        // Khởi tạo các chức năng cho tab xử lý hóa đơn lỗi
        if (typeof window.renderInvoices === 'function') {
            window.renderInvoices();
        }
    };
}

// =======================
// HÀM HIỂN THỊ XÁC NHẬN XÓA DỮ LIỆU
// =======================
function showClearDataConfirmation() {
    const companyCount = Object.keys(window.hkdData).length;
    let invoiceCount = 0;
    let stockCount = 0;
    
    // Đếm tổng số hóa đơn và sản phẩm tồn kho
    Object.values(window.hkdData).forEach(company => {
        invoiceCount += company.invoices ? company.invoices.length : 0;
        stockCount += company.tonkhoMain ? company.tonkhoMain.length : 0;
    });

    const confirmMessage = `
        <div class="clear-data-warning">
            <div class="warning-header">
                <span style="color: #dc3545; font-size: 24px;">⚠️</span>
                <h4 style="color: #dc3545; margin: 0;">CẢNH BÁO: XÓA TOÀN BỘ DỮ LIỆU</h4>
            </div>
            
            <div class="data-stats" style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Dữ liệu sẽ bị xóa:</strong></p>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>🏢 Số công ty: <strong>${companyCount}</strong></li>
                    <li>🧾 Số hóa đơn: <strong>${invoiceCount}</strong></li>
                    <li>📦 Sản phẩm tồn kho: <strong>${stockCount}</strong></li>
                    <li>💰 Dữ liệu kế toán: <strong>Tất cả</strong></li>
                </ul>
            </div>
            
            <p style="color: #856404;"><strong>Thao tác này KHÔNG THỂ HOÀN TÁC!</strong></p>
            <p>Tất cả dữ liệu sẽ bị xóa vĩnh viễn khỏi trình duyệt.</p>
            
            <div class="confirmation-check" style="margin: 15px 0;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" id="confirm-delete-checkbox" style="margin-right: 8px;">
                    <span>Tôi hiểu và chắc chắn muốn xóa toàn bộ dữ liệu</span>
                </label>
            </div>
        </div>
        
        <div style="text-align: right; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 15px;">
            <button id="confirm-clear" class="btn-danger" style="margin-right: 10px;" disabled>
                🗑️ XÓA NGAY
            </button>
            <button id="cancel-clear" class="btn-secondary">❌ Hủy</button>
        </div>
    `;
    
    // Sử dụng hàm showModal có sẵn hoặc tạo mới
    if (typeof window.showModal === 'function') {
        window.showModal('XÁC NHẬN XÓA DỮ LIỆU', confirmMessage);
    } else {
        // Fallback nếu hàm showModal không tồn tại
        const modal = document.createElement('div');
        modal.id = 'custom-modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>XÁC NHẬN XÓA DỮ LIỆU</h3>
                        <span class="close" onclick="document.getElementById('custom-modal').remove()">&times;</span>
                    </div>
                    <div class="modal-body">
                        ${confirmMessage}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Kích hoạt nút xóa khi tích checkbox
    setTimeout(() => {
        const checkbox = document.getElementById('confirm-delete-checkbox');
        const confirmButton = document.getElementById('confirm-clear');
        
        if (checkbox && confirmButton) {
            checkbox.addEventListener('change', function() {
                confirmButton.disabled = !this.checked;
            });
            
            // Xử lý xác nhận xóa
            document.getElementById('confirm-clear').addEventListener('click', function() {
                clearAllData();
            });

            // Xử lý hủy
            document.getElementById('cancel-clear').addEventListener('click', function() {
                const modal = document.getElementById('custom-modal');
                if (modal) modal.remove();
            });
        }
    }, 100);
}

// =======================
// HÀM XÓA TOÀN BỘ DỮ LIỆU - DÙNG localStorage.clear()
// =======================
function clearAllData() {
    try {
        console.log('🗑️ Đang xóa toàn bộ dữ liệu...');
        
        // 1. DEBUG: Kiểm tra dữ liệu trước khi xóa
        console.log('🔍 Dữ liệu trước khi xóa:');
        console.log('- window.hkdData:', window.hkdData);
        console.log('- Số công ty:', Object.keys(window.hkdData).length);
        console.log('- Toàn bộ localStorage:', localStorage);
        
        // 2. XÓA TOÀN BỘ LOCALSTORAGE - CÁCH TRIỆT ĐỂ
        localStorage.clear();
        console.log('✅ Đã xóa toàn bộ dữ liệu localStorage');
        
        // 3. Xóa dữ liệu trong memory
        window.hkdData = {};
        window.currentCompany = null;
        console.log('✅ Đã xóa dữ liệu memory');
        
        // 4. Đóng modal
        const modal = document.getElementById('custom-modal');
        if (modal) modal.remove();
        
        // 5. Hiển thị thông báo và reload
        setTimeout(() => {
            // Kiểm tra lại
            console.log('🔍 Kiểm tra sau khi xóa:');
            console.log('- localStorage:', localStorage);
            console.log('- window.hkdData:', window.hkdData);
            
            alert('✅ Đã xóa toàn bộ dữ liệu thành công! Ứng dụng sẽ reload...');
            
            // Reload trang
            window.location.reload();
        }, 300);
        
    } catch (error) {
        console.error('❌ Lỗi khi xóa dữ liệu:', error);
        alert('❌ Có lỗi xảy ra khi xóa dữ liệu: ' + error.message);
    }
}

// =======================
// HOẶC GÁN TRỰC TIẾP VÀO NÚT (Cách đơn giản)
// =======================
function setupClearDataButton() {
    const clearDataButton = document.getElementById('clear-all-data');
    if (clearDataButton) {
        clearDataButton.addEventListener('click', function() {
            if (confirm('🗑️ Bạn có chắc chắn muốn xóa TOÀN BỘ dữ liệu? Thao tác này không thể hoàn tác!')) {
                // XÓA TOÀN BỘ
                localStorage.clear();
                window.hkdData = {};
                window.currentCompany = null;
                
                console.log('✅ Đã xóa toàn bộ dữ liệu localStorage');
                alert('✅ Đã xóa toàn bộ dữ liệu thành công!');
                
                // Reload trang
                window.location.reload();
            }
        });
    }
}

// Gọi hàm này trong DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // ... các code khác
    
    // Thay thế phần gắn sự kiện cũ bằng:
    setupClearDataButton();
});

// =======================
// HÀM SHOW MODAL (nếu chưa có)
// =======================
if (typeof window.showModal === 'undefined') {
    window.showModal = function(title, content) {
        const modal = document.createElement('div');
        modal.id = 'custom-modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <span class="close" onclick="document.getElementById('custom-modal').remove()">&times;</span>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };
}