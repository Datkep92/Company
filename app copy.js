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
// Thêm vào app.js
function setupNoteTagButtons() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-note')) {
            const taxCode = e.target.getAttribute('data-tax');
            showQuickNoteModal(taxCode);
        }
        
        if (e.target.classList.contains('btn-tag')) {
            const taxCode = e.target.getAttribute('data-tax');
            showQuickTagModal(taxCode);
        }
    });
}

function showQuickNoteModal(taxCode) {
    const company = window.hkdData[taxCode];
    const modalContent = `
        <div class="quick-note-modal">
            <h4>📝 Thêm ghi chú cho ${company.name}</h4>
            <div class="form-group">
                <textarea id="quick-note-content" placeholder="Nội dung ghi chú..." rows="4" style="width: 100%; padding: 10px;"></textarea>
            </div>
            <div class="form-group">
                <label>🏷️ Thẻ (tùy chọn):</label>
                <input type="text" id="quick-note-tags" placeholder="vd: urgent, congno, quantrong">
                <small style="color: #666;">Phân cách bằng dấu phẩy</small>
            </div>
            <div class="modal-actions">
                <button id="save-quick-note" class="btn-success">💾 Lưu</button>
                <button class="btn-secondary" onclick="closeModal()">❌ Hủy</button>
            </div>
        </div>
    `;
    
    showModal('Thêm Ghi Chú Nhanh', modalContent);
    
    document.getElementById('save-quick-note').addEventListener('click', function() {
        saveQuickNote(taxCode);
    });
}

function saveQuickNote(taxCode) {
    const content = document.getElementById('quick-note-content').value.trim();
    const tagsInput = document.getElementById('quick-note-tags').value.trim();
    
    if (!content) {
        alert('Vui lòng nhập nội dung ghi chú');
        return;
    }
    
    // Khởi tạo notes nếu chưa có
    if (!window.hkdData[taxCode].notes) {
        window.hkdData[taxCode].notes = [];
    }
    
    // Tách tags
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    // Thêm note mới
    const newNote = {
        id: 'note_' + Date.now(),
        content: content,
        tags: tags,
        createdAt: new Date().toISOString(),
        type: 'quick'
    };
    
    window.hkdData[taxCode].notes.push(newNote);
    saveData();
    
    // Cập nhật tags công ty (gộp tất cả tags từ các note)
    updateCompanyTags(taxCode);
    
    closeModal();
    renderCompanyList(); // Refresh sidebar
    
    showToast('✅ Đã thêm ghi chú thành công!', 2000, 'success');
}

function showQuickTagModal(taxCode) {
    const company = window.hkdData[taxCode];
    const currentTags = company.tags || [];
    
    const modalContent = `
        <div class="quick-tag-modal">
            <h4>🏷️ Gán thẻ cho ${company.name}</h4>
            <div class="form-group">
                <label>Thẻ hiện tại:</label>
                <div id="current-tags" style="margin: 10px 0;">
                    ${currentTags.length > 0 ? 
                        currentTags.map(tag => `
                            <span class="tag-item">
                                #${tag}
                                <span class="remove-tag" data-tag="${tag}">×</span>
                            </span>
                        `).join('') : 
                        '<em>Chưa có thẻ nào</em>'
                    }
                </div>
            </div>
            <div class="form-group">
                <label>Thêm thẻ mới:</label>
                <input type="text" id="new-tag-input" placeholder="Nhập thẻ mới...">
                <small style="color: #666;">Enter để thêm</small>
            </div>
            <div class="suggested-tags">
                <strong>Thẻ đề xuất:</strong>
                <div class="tag-suggestions">
                    <span class="tag-suggestion" data-tag="urgent">urgent</span>
                    <span class="tag-suggestion" data-tag="congno">congno</span>
                    <span class="tag-suggestion" data-tag="quantrong">quantrong</span>
                    <span class="tag-suggestion" data-tag="theodoi">theodoi</span>
                    <span class="tag-suggestion" data-tag="hoadonloi">hoadonloi</span>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn-primary" onclick="closeModal()">✅ Xong</button>
            </div>
        </div>
    `;
    
    showModal('Quản Lý Thẻ', modalContent);
    
    // Xử lý thêm thẻ mới
    document.getElementById('new-tag-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addNewTag(taxCode, this.value.trim());
            this.value = '';
        }
    });
    
    // Xử lý gợi ý thẻ
    document.querySelectorAll('.tag-suggestion').forEach(suggestion => {
        suggestion.addEventListener('click', function() {
            addNewTag(taxCode, this.getAttribute('data-tag'));
        });
    });
    
    // Xử lý xóa thẻ
    document.querySelectorAll('.remove-tag').forEach(btn => {
        btn.addEventListener('click', function() {
            removeTag(taxCode, this.getAttribute('data-tag'));
        });
    });
}
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

/**
 * Đóng modal
 */
function closeModal() {
    const modal = document.getElementById('custom-modal');
    if (modal) {
        modal.remove();
    }
}
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
// XỬ LÝ MOBILE SIDEBAR
// =======================================================



function setupSwipeGestures() {
    let startX = 0;
    let currentX = 0;
    let isSwiping = false;
    
    document.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        currentX = startX;
        isSwiping = true;
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        
        currentX = e.touches[0].clientX;
        const diff = currentX - startX;
        
        // Chỉ xử lý vuốt từ cạnh trái (trong vòng 50px từ mép trái)
        if (startX < 50 && diff > 0) {
            e.preventDefault();
            const sidebar = document.querySelector('.sidebar');
            const translateX = Math.min(diff, window.innerWidth * 0.8);
            sidebar.style.transform = `translateX(${translateX - sidebar.offsetWidth}px)`;
        }
    });
    
    document.addEventListener('touchend', () => {
        if (!isSwiping) return;
        
        const diff = currentX - startX;
        const threshold = 50; // Ngưỡng vuốt để mở sidebar
        
        if (startX < 50 && diff > threshold) {
            openSidebar();
        } else {
            closeSidebar();
        }
        
        isSwiping = false;
        
        // Reset transform
        const sidebar = document.querySelector('.sidebar');
        sidebar.style.transform = '';
    });
}




function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return; // THÊM KIỂM TRA
    
    if (sidebar.classList.contains('mobile-open')) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

function initMobileSidebar() {
    console.log('🔄 Đang khởi tạo mobile sidebar...');
    
    // Tạo overlay
    if (!document.querySelector('.sidebar-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 998;
            display: none;
        `;
        overlay.addEventListener('click', closeSidebar);
        document.body.appendChild(overlay);
    }
    
    // Tạo nút toggle
    if (!document.querySelector('.mobile-menu-toggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'mobile-menu-toggle';
        toggleBtn.innerHTML = '☰';
        toggleBtn.setAttribute('aria-label', 'Mở menu');
        toggleBtn.style.cssText = `
            position: fixed;
            top: 15px;
            left: 15px;
            z-index: 997;
            background: var(--primary);
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 18px;
            cursor: pointer;
            display: none;
        `;
        
        // CHỈ toggle sidebar, không đóng khi click
        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleSidebar();
        });
        
        document.body.appendChild(toggleBtn);
    }
    
    setupSwipeGestures();
}

function openSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar) sidebar.classList.add('mobile-open');
    if (overlay) overlay.style.display = 'block';
    
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (overlay) overlay.style.display = 'none';
    
    document.body.style.overflow = '';
}

// =======================================================
// QUẢN LÝ CÔNG TY VÀ GIAO DIỆN CHÍNH
// =======================================================

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
            // Đóng sidebar trên mobile sau khi chọn công ty
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
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
    
    console.log(`✅ Đã chọn công ty: ${taxCode}`);
}

// =======================================================
// XỬ LÝ XÓA DỮ LIỆU
// =======================================================

function setupClearDataButton() {
    const clearDataButton = document.getElementById('clear-all-data');
    if (clearDataButton) {
        clearDataButton.addEventListener('click', function() {
            showClearDataConfirmation();
        });
    }
}

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
    
    showModal('XÁC NHẬN XÓA DỮ LIỆU', confirmMessage);
    
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
                closeModal();
            });
        }
    }, 100);
}

function clearAllData() {
    try {
        console.log('🗑️ Đang xóa toàn bộ dữ liệu...');
        
        // 1. XÓA TOÀN BỘ LOCALSTORAGE
        localStorage.clear();
        console.log('✅ Đã xóa toàn bộ dữ liệu localStorage');
        
        // 2. Xóa dữ liệu trong memory
        window.hkdData = {};
        window.currentCompany = null;
        console.log('✅ Đã xóa dữ liệu memory');
        
        // 3. Đóng modal
        closeModal();
        
        // 4. Hiển thị thông báo và reload
        setTimeout(() => {
            alert('✅ Đã xóa toàn bộ dữ liệu thành công! Ứng dụng sẽ reload...');
            
            // Reload trang
            window.location.reload();
        }, 300);
        
    } catch (error) {
        console.error('❌ Lỗi khi xóa dữ liệu:', error);
        alert('❌ Có lỗi xảy ra khi xóa dữ liệu: ' + error.message);
    }
}

// =======================================================
// KHỞI TẠO ỨNG DỤNG
// =======================================================

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

// Hàm khởi tạo module xử lý hóa đơn lỗi (fallback)
if (typeof window.initXuLyHoaDonLoiModule === 'undefined') {
    window.initXuLyHoaDonLoiModule = function() {
        console.log('🔄 Đang khởi tạo module Xử Lý Hóa Đơn Lỗi...');
        if (typeof window.renderInvoices === 'function') {
            window.renderInvoices();
        }
    };
}

// Hàm chính khởi động ứng dụng
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Đang khởi động ứng dụng...');
    
    // 1. Tải dữ liệu từ LocalStorage
    loadData();
    setupNoteTagButtons(); // THÊM DÒNG NÀY

    // 2. Thêm CSS cho header
    addHeaderStyles();
    
    // 3. Thiết lập chuyển đổi tab
    setupTabSwitching();

    // 4. Hiển thị danh sách công ty
    renderCompanyList();

    // 5. Khởi tạo mobile sidebar nếu là mobile
    if (window.innerWidth <= 768) {
        initMobileSidebar();
    }

    // 6. Kiểm tra nếu có công ty đang được chọn
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

    // 7. Gắn sự kiện cho nút "Xóa hết dữ liệu"
    setupClearDataButton();

    console.log('✅ Ứng dụng đã khởi động hoàn tất.');
});

// Xử lý resize window
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        // Trên PC, đảm bảo sidebar hiển thị bình thường và đóng overlay
        closeSidebar();
        document.body.style.overflow = '';
    } else {
        // Trên mobile, khởi tạo sidebar nếu chưa có
        if (!document.querySelector('.mobile-menu-toggle')) {
            initMobileSidebar();
        }
    }
});

// Xử lý trước khi đóng trang - lưu dữ liệu
window.addEventListener('beforeunload', function() {
    saveData();
});

console.log('📱 App.js đã được tải - Sẵn sàng với tính năng mobile!');