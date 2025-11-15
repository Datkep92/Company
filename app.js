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
 * @param {number} amount - Số tiền cần định dạng
 * @returns {string} - Chuỗi tiền tệ (ví dụ: 123.456.789)
 */
function formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) return '0';
    return accountingRound(amount).toLocaleString('vi-VN');
}
window.formatCurrency = formatCurrency;

/**
 * Định dạng ngày tháng
 * @param {string} dateString - Chuỗi ngày (yyyy-mm-dd)
 * @returns {string} - Chuỗi ngày (dd/mm/yyyy)
 */
function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    } catch {
        return dateString; // Trả về nguyên gốc nếu lỗi
    }
}
window.formatDate = formatDate;

/**
 * Hiển thị Modal tùy chỉnh (thay thế cho alert/confirm truyền thống)
 * @param {string} title - Tiêu đề Modal
 * @param {string} content - Nội dung HTML của Modal
 */
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

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = 'white';
    modalContent.style.padding = '30px';
    modalContent.style.borderRadius = '10px';
    modalContent.style.maxWidth = '90%';
    modalContent.style.maxHeight = '90%';
    modalContent.style.overflow = 'auto';
    modalContent.style.width = '800px';
    modalContent.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';

    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
            <h3 style="margin: 0; color: var(--primary);">${title}</h3>
            <button id="close-modal" style="background: var(--danger); color: white; border: none; font-size: 24px; cursor: pointer; padding: 5px 12px; border-radius: 5px;">&times;</button>
        </div>
        <div class="modal-body">${content}</div>
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

// =======================================================
// QUẢN LÝ DỮ LIỆU (localStorage)
// =======================================================

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
        window.hkdData = {}; // Khôi phục về rỗng nếu có lỗi
    }
}
function accountingRound(amount) {
    return Math.round(amount);
}
window.accountingRound = accountingRound;


// SỬA: Kiểm tra tồn tại trước khi ghi đè
if (typeof window.handleZipFiles === 'function') {
    const originalHandleZipFiles = window.handleZipFiles;
    window.handleZipFiles = async function(...args) {
        const result = await originalHandleZipFiles(...args);
        saveData();
        renderCompanyList();
        if (window.currentCompany) selectCompany(window.currentCompany); // Cập nhật lại nếu đang chọn công ty
        return result;
    };
} else {
    console.warn('handleZipFiles chưa được định nghĩa, bỏ qua ghi đè');
}
// Thêm vào ketoan.js
function debugAccountingData() {
    if (!window.currentCompany) {
        console.log('❌ Chưa chọn công ty');
        return;
    }
    
    const hkd = hkdData[window.currentCompany];
    console.log('🐛 DEBUG DỮ LIỆU KẾ TOÁN:', {
        company: window.currentCompany,
        companyName: hkd.name,
        hasAccountingData: !!hkd.accountingTransactions,
        accountingTransactions: hkd.accountingTransactions,
        allCompanies: Object.keys(hkdData).map(key => ({
            company: key,
            name: hkdData[key].name,
            hasAccounting: !!hkdData[key].accountingTransactions,
            count: hkdData[key].accountingTransactions ? hkdData[key].accountingTransactions.length : 0
        }))
    });
}

// Gọi hàm debug khi cần
window.debugAccountingData = debugAccountingData;
function saveData() {
    try {
        // Lưu dữ liệu kế toán trước khi lưu toàn bộ
        if (typeof window.saveAccountingData === 'function') {
            window.saveAccountingData();
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(window.hkdData));
        console.log('Dữ liệu đã được lưu vào LocalStorage.');
    } catch (e) {
        console.error('Lỗi khi lưu dữ liệu vào LocalStorage:', e);
    }
}

// Ghi đè các hàm cần lưu dữ liệu sau khi thực thi
const originalHandleZipFiles = window.handleZipFiles;
window.handleZipFiles = async function(...args) {
    const result = await originalHandleZipFiles(...args);
    saveData();
    renderCompanyList();
    if (window.currentCompany) selectCompany(window.currentCompany); // Cập nhật lại nếu đang chọn công ty
    return result;
};

// =======================================================
// QUẢN LÝ CÔNG TY VÀ GIAO DIỆN CHÍNH
// =======================================================

// Hiển thị danh sách công ty
function renderCompanyList() {
    const companyList = document.getElementById('company-list');
    companyList.innerHTML = '';

    const companies = Object.keys(window.hkdData).sort();

    if (companies.length === 0) {
        companyList.innerHTML = '<div class="company-item no-company">Chưa có công ty nào</div>';
        return;
    }

    companies.forEach(taxCode => {
        const company = window.hkdData[taxCode];
        const companyItem = document.createElement('div');
        companyItem.className = 'company-item';
        if (taxCode === window.currentCompany) {
            companyItem.classList.add('active');
        }
        
        // Cần đảm bảo tonkhoMain là mảng để reduce hoạt động, mặc dù init đã có
        const totalStock = Array.isArray(company.tonkhoMain) 
            ? company.tonkhoMain.reduce((sum, p) => sum + (p.quantity || 0), 0)
            : 0;

        companyItem.innerHTML = `
            <div class="company-name">${company.name || 'Chưa có tên'}</div>
            <div class="company-mst">MST: ${taxCode}</div>
            <div class="company-info">
                <small>HĐ: ${company.invoices.length} | Tồn kho: ${totalStock.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} SP</small>
            </div>
        `;

        companyItem.addEventListener('click', () => {
            selectCompany(taxCode);
        });

        companyList.appendChild(companyItem);
    });
}

// Chọn công ty và cập nhật các tab
function selectCompany(taxCode) {
    if (window.currentCompany === taxCode) return; // Không làm gì nếu đã chọn
    
    window.currentCompany = taxCode;
    saveData(); // Lưu lại công ty đang chọn

    // 1. Cập nhật giao diện sidebar và header
    renderCompanyList();
    const companyName = window.hkdData[taxCode].name || taxCode;
    document.getElementById('current-company').textContent = `Đang chọn: ${companyName} (MST: ${taxCode})`;
    
    const companyNameKeToanElement = document.getElementById('company-name-ke-toan');
    if (companyNameKeToanElement) {
        companyNameKeToanElement.textContent = companyName; // Cập nhật tab Kế toán
    }

    // 2. Kích hoạt các module
    // Lấy tên tab đang active để đảm bảo sau khi chọn công ty, tab đó vẫn được hiển thị
    const currentTab = document.querySelector('.nav-tab.active')?.getAttribute('data-tab') || 'trich-xuat';
    showTab(currentTab); 

    // 3. Cập nhật dữ liệu cho các tab
    if (typeof window.renderInvoices === 'function') window.renderInvoices();
    if (typeof window.renderStock === 'function') window.renderStock();
    if (typeof window.updateExportProductsList === 'function') window.updateExportProductsList();
    if (typeof window.renderExportHistory === 'function') window.renderExportHistory();
    if (typeof window.updateAccountingStats === 'function') window.updateAccountingStats();
    
    console.log(`Đã chọn công ty: ${taxCode}`);
}

// Chuyển đổi tab
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
    } else {
        console.warn(`[showTab] Không tìm thấy tab: ${tabName}`);
        
        // Fallback: hiển thị tab đầu tiên có sẵn
        const firstTab = document.querySelector('.nav-tab');
        if (firstTab) {
            const fallbackTabName = firstTab.getAttribute('data-tab');
            const fallbackTabContent = document.getElementById(fallbackTabName);
            if (fallbackTabContent) {
                fallbackTabContent.classList.add('active');
                firstTab.classList.add('active');
            }
        }
    }
}

// Thiết lập sự kiện chuyển tab
function setupTabSwitching() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            showTab(tabName);
        });
    });
}

// =======================================================
// KHỞI TẠO ỨNG DỤNG
// =======================================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. Tải dữ liệu từ LocalStorage
    loadData();
    
    // 2. Khởi tạo các module con (nằm trong các file JS khác)
    if (typeof window.initInvoiceModule === 'function') window.initInvoiceModule();
    if (typeof window.initStockModule === 'function') window.initStockModule();
    if (typeof window.initExportModule === 'function') window.initExportModule();
    if (typeof window.initAccountingModule === 'function') window.initAccountingModule();
     if (typeof window.initInvoiceModule === 'function') window.initInvoiceModule();
    if (typeof window.initStockModule === 'function') window.initStockModule();
    if (typeof window.initExportModule === 'function') window.initExportModule();
    if (typeof window.initAccountingModule === 'function') window.initAccountingModule();

    // 3. Thiết lập chuyển đổi tab
    setupTabSwitching();

    // 4. Hiển thị danh sách công ty
    renderCompanyList();

    // 5. Kiểm tra nếu có công ty đang được chọn (từ lần trước)
    if (window.currentCompany && window.hkdData[window.currentCompany]) {
        selectCompany(window.currentCompany);
    } else {
        // Hiển thị tab đầu tiên tồn tại thay vì cứng 'trich-xuat'
        const firstTab = document.querySelector('.nav-tab');
        if (firstTab) {
            const tabName = firstTab.getAttribute('data-tab');
            showTab(tabName);
        }
    }

    // 6. Gắn sự kiện cho nút "Xóa hết dữ liệu" (Chỉ dành cho debug/reset)
    const clearDataButton = document.getElementById('clear-all-data');
    if (clearDataButton) {
        clearDataButton.addEventListener('click', function() {
            showModal('Xác Nhận Xóa Dữ Liệu', `
                <p><strong>CẢNH BÁO:</strong> Thao tác này sẽ xóa <strong>HẾT TẤT CẢ</strong> dữ liệu hóa đơn, tồn kho, và công ty đã lưu trong trình duyệt.</p>
                <p>Bạn có chắc chắn muốn tiếp tục không?</p>
                <div style="text-align: right; margin-top: 20px;">
                    <button id="confirm-clear" class="btn-danger" style="margin-right: 10px;">Xóa Ngay</button>
                    <button id="cancel-clear" class="btn-secondary">Hủy</button>
                </div>
            `);
            
            document.getElementById('confirm-clear').addEventListener('click', function() {
                localStorage.removeItem(STORAGE_KEY);
                window.hkdData = {};
                window.currentCompany = null;
                const modal = document.getElementById('custom-modal');
                if (modal) modal.remove(); // Đóng modal
                window.location.reload(); // Tải lại trang
            });

            document.getElementById('cancel-clear').addEventListener('click', function() {
                const modal = document.getElementById('custom-modal');
                if (modal) modal.remove(); // Đóng modal
            });
        });
    }

    console.log('Ứng dụng đã khởi động hoàn tất.');
});

// Thêm hàm khởi tạo tab xuất hàng
function initExportTab() {
    console.log('🔄 Đang khởi tạo tab xuất hàng...');
    
    // Đảm bảo container tồn tại
    const exportTab = document.getElementById('export-tab');
    if (!exportTab) {
        console.error('❌ Không tìm thấy tab xuất hàng');
        return;
    }
    
    // Render form xuất hàng nếu chưa có
    if (!document.getElementById('export-form')) {
        exportTab.innerHTML = `
            <div class="card">
                <div class="card-header">Tạo Phiếu Xuất Hàng</div>
                <div class="card-body">
                    <form id="export-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="export-date">Ngày xuất hàng</label>
                                <input type="date" id="export-date" class="form-control" value="${new Date().toISOString().substring(0, 10)}">
                            </div>
                            <div class="form-group">
                                <label for="customer-name">Tên khách hàng *</label>
                                <input type="text" id="customer-name" class="form-control" placeholder="Nhập tên khách hàng" required>
                            </div>
                            <div class="form-group">
                                <label for="customer-taxcode">Mã số thuế</label>
                                <input type="text" id="customer-taxcode" class="form-control" placeholder="MST khách hàng">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="export-description">Diễn giải</label>
                            <textarea id="export-description" class="form-control" placeholder="Ghi chú về phiếu xuất"></textarea>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">
                                Danh sách sản phẩm
                                <button type="button" id="add-export-product" class="btn-success btn-sm">Thêm sản phẩm</button>
                            </div>
                            <div class="card-body">
                                <div id="export-products-container">
                                    <!-- Các dòng sản phẩm sẽ được thêm ở đây -->
                                </div>
                            </div>
                        </div>
                        
                        <div style="text-align: right; margin-top: 20px;">
                            <button type="button" id="create-export-btn" class="btn-success">Tạo phiếu xuất</button>
                        </div>
                    </form>
                </div>
            </div>
            
            <div class="card" style="margin-top: 20px;">
                <div class="card-header">Danh sách phiếu xuất hàng</div>
                <div class="card-body">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>Mã phiếu</th>
                                <th>Ngày</th>
                                <th>Khách hàng</th>
                                <th>MST</th>
                                <th>SL SP</th>
                                <th>Tổng tiền</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody id="export-list">
                            <!-- Danh sách phiếu xuất sẽ được load ở đây -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    // Khởi tạo module xuất hàng
    if (typeof window.initExportModule === 'function') {
        setTimeout(() => {
            window.initExportModule();
        }, 100);
    }
}

// Cập nhật hàm xử lý tab
document.addEventListener('DOMContentLoaded', function() {
    const tabLinks = document.querySelectorAll('.tab-link');
    
    tabLinks.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Ẩn tất cả các tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            
            // Hiển thị tab được chọn
            const activeTab = document.getElementById(tabName + '-tab');
            if (activeTab) {
                activeTab.style.display = 'block';
            }
            
            // Khởi tạo module tương ứng
            setTimeout(() => {
                switch(tabName) {
                    case 'invoice':
                        if (typeof window.initInvoiceModule === 'function') window.initInvoiceModule();
                        break;
                    case 'stock':
                        if (typeof window.initStockModule === 'function') window.initStockModule();
                        break;
                    case 'export':
                        initExportTab(); // Sử dụng hàm mới
                        break;
                    case 'accounting':
                        if (typeof window.initAccountingModule === 'function') window.initAccountingModule();
                        break;
                }
            }, 50);
        });
    });
    
    // Khởi tạo tab mặc định
    const defaultTab = document.querySelector('.tab-link.active');
    if (defaultTab) {
        defaultTab.click();
    } else if (tabLinks.length > 0) {
        tabLinks[0].click();
    }
});