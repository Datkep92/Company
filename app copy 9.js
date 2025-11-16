// =======================================================
// KHỞI TẠO DỮ LIỆU VÀ BIẾN TOÀN CỤC
// =======================================================
window.hkdData = {}; // Dữ liệu toàn bộ các công ty (MST -> {name, invoices, tonkhoMain, exports})
window.currentCompany = null; // MST của công ty đang được chọn

const STORAGE_KEY = 'hkd_manager_data';

function setupNoteTagButtons() {
    console.log('🔄 Đang setup nút note/tag...');
    
    // Dùng event delegation trên document
    document.addEventListener('click', function(e) {
        console.log('🎯 Click detected on:', e.target);
        console.log('🎯 Tag name:', e.target.tagName);
        console.log('🎯 Class list:', e.target.classList.toString());
        
        // Tìm phần tử được click thực sự
        let target = e.target;
        
        // Nếu click vào icon bên trong button, tìm đến button parent
        if (target.tagName === 'BUTTON' || 
            (target.parentElement && target.parentElement.classList.contains('btn-note'))) {
            
            target = target.classList.contains('btn-note') ? target : target.parentElement;
            
            if (target.classList.contains('btn-note')) {
                const taxCode = target.getAttribute('data-tax');
                console.log('📝 CLICKED NOTE BUTTON:', taxCode);
                e.preventDefault();
                e.stopPropagation();
                showQuickNoteModal(taxCode);
                return;
            }
        }
        
        if (target.tagName === 'BUTTON' || 
            (target.parentElement && target.parentElement.classList.contains('btn-tag'))) {
            
            target = target.classList.contains('btn-tag') ? target : target.parentElement;
            
            if (target.classList.contains('btn-tag')) {
                const taxCode = target.getAttribute('data-tax');
                console.log('🏷️ CLICKED TAG BUTTON:', taxCode);
                e.preventDefault();
                e.stopPropagation();
                showQuickTagModal(taxCode);
                return;
            }
        }
        
        // Debug: Log tất cả các button được tìm thấy
        console.log('🔍 All note buttons:', document.querySelectorAll('.btn-note'));
        console.log('🔍 All tag buttons:', document.querySelectorAll('.btn-tag'));
    });
    
    // THÊM: Direct event listeners cho chắc chắn
    setTimeout(() => {
        document.querySelectorAll('.btn-note').forEach(btn => {
            btn.addEventListener('click', function(e) {
                console.log('🎯 DIRECT NOTE CLICK:', this.getAttribute('data-tax'));
                e.preventDefault();
                e.stopPropagation();
                showQuickNoteModal(this.getAttribute('data-tax'));
            });
        });
        
        document.querySelectorAll('.btn-tag').forEach(btn => {
            btn.addEventListener('click', function(e) {
                console.log('🎯 DIRECT TAG CLICK:', this.getAttribute('data-tax'));
                e.preventDefault();
                e.stopPropagation();
                showQuickTagModal(this.getAttribute('data-tax'));
            });
        });
        
        console.log('✅ Đã thêm direct event listeners');
    }, 1000);
}
function addNewTag(taxCode, tag) {
    if (!tag) return;
    
    console.log('🏷️ Adding tag to company:', taxCode, tag);
    
    ensureCompanyData(taxCode);
    const company = window.hkdData[taxCode];
    
    // Thêm vào tags của công ty (nếu chưa có)
    if (!company.tags.includes(tag)) {
        company.tags.push(tag);
    }
    
    // Thêm vào savedTags của công ty (nếu chưa có)
    if (!company.savedTags.includes(tag)) {
        company.savedTags.push(tag);
    }
    
    saveData();
    console.log('✅ Tag added to company:', tag);
    
    // Refresh modal
    showQuickTagModal(taxCode);
    
    // Refresh company list
    renderCompanyList();
    
    showToast(`✅ Đã thêm thẻ "#${tag}" vào công ty`, 2000, 'success');
}

function removeTag(taxCode, tag) {
    console.log('🗑️ Removing tag from company:', taxCode, tag);
    
    if (window.hkdData[taxCode]) {
        const company = window.hkdData[taxCode];
        
        // Xóa khỏi tags của công ty
        if (company.tags) {
            company.tags = company.tags.filter(t => t !== tag);
        }
        
        // Xóa khỏi savedTags của công ty
        if (company.savedTags) {
            company.savedTags = company.savedTags.filter(t => t !== tag);
        }
        
        // Xóa tag khỏi tất cả notes của công ty
        if (company.notes) {
            company.notes.forEach(note => {
                if (note.tags && Array.isArray(note.tags)) {
                    note.tags = note.tags.filter(t => t !== tag);
                }
            });
        }
        
        // Xóa tag khỏi tất cả reminders của công ty
        if (company.reminders) {
            company.reminders.forEach(reminder => {
                if (reminder.tags && Array.isArray(reminder.tags)) {
                    reminder.tags = reminder.tags.filter(t => t !== tag);
                }
            });
        }
        
        saveData();
        console.log('✅ Tag removed from company:', tag);
        
        // Refresh modal
        showQuickTagModal(taxCode);
        // Refresh company list để cập nhật hiển thị
        renderCompanyList();
    }
}

function saveQuickNote(taxCode) {
    const content = document.getElementById('quick-note-content')?.value.trim();
    
    if (!content) {
        alert('Vui lòng nhập nội dung ghi chú');
        return;
    }
    
    console.log('💾 Saving note for company:', taxCode);
    
    // Khởi tạo notes nếu chưa có
    if (!window.hkdData[taxCode].notes) {
        window.hkdData[taxCode].notes = [];
    }
    
    // Tách tags
    const tagsInput = document.getElementById('quick-note-tags')?.value.trim() || '';
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
    
    console.log('✅ Note saved successfully!');
    
    // Hiển thị thông báo
    if (typeof showToast === 'function') {
        showToast('✅ Đã thêm ghi chú thành công!', 2000, 'success');
    } else {
        alert('✅ Đã thêm ghi chú thành công!');
    }
}

function updateCompanyTags(taxCode) {
    // Gộp tất cả tags từ các note
    const allTags = [];
    if (window.hkdData[taxCode].notes) {
        window.hkdData[taxCode].notes.forEach(note => {
            if (note.tags) {
                allTags.push(...note.tags);
            }
        });
    }
    
    // Loại bỏ trùng lặp
    const uniqueTags = [...new Set(allTags)];
    window.hkdData[taxCode].tags = uniqueTags;
    saveData();
}
function removeTagFromCompanyInNoteModal(taxCode, tag) {
    if (confirm(`Bạn có chắc muốn xóa thẻ "#${tag}" khỏi công ty này?\n\nThao tác này sẽ xóa thẻ khỏi danh sách thẻ đã lưu của công ty.`)) {
        console.log('🗑️ Removing tag from company in note modal:', taxCode, tag);
        
        if (window.hkdData[taxCode]) {
            const company = window.hkdData[taxCode];
            
            // Xóa khỏi savedTags
            if (company.savedTags) {
                company.savedTags = company.savedTags.filter(t => t !== tag);
            }
            
            // Xóa khỏi selected tags nếu có
            if (window.selectedNoteTags && window.selectedNoteTags.has(tag)) {
                window.selectedNoteTags.delete(tag);
            }
            
            saveData();
            console.log('✅ Tag removed from company in note modal:', tag);
            
            // Refresh hiển thị
            updateCompanySavedTagsDisplay(taxCode);
            updateSelectedTagsDisplay();
            updateTagHighlights();
            
            showToast(`✅ Đã xóa thẻ "#${tag}" khỏi công ty`, 2000, 'success');
        }
    }
}
function showGlobalTagManager() {
    const allTags = getAllGlobalTags();
    
    const modalContent = `
        <div class="global-tag-manager">
            <h4 style="margin-bottom: 15px; color: #1976d3;">🌐 Quản Lý Thẻ Toàn Hệ Thống</h4>
            
            <div style="background: #fff3cd; padding: 12px; border-radius: 6px; margin-bottom: 15px; border: 1px solid #ffeaa7;">
                <p style="margin: 0; color: #856404; font-size: 13px;">
                    <strong>⚠️ Cảnh báo:</strong> Xóa thẻ ở đây sẽ xóa khỏi TOÀN BỘ hệ thống (tất cả công ty, ghi chú, nhắc nhở)
                </p>
            </div>
            
            <div id="global-tags-list" style="max-height: 400px; overflow-y: auto;">
                ${allTags.length > 0 ? 
                    allTags.map(tag => `
                        <div class="global-tag-item-manager" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; margin-bottom: 8px; background: #f8f9fa; border-radius: 6px; border: 1px solid #e9ecef;">
                            <div>
                                <span style="font-weight: 600; color: #333; font-size: 14px;">#${tag}</span>
                                <div style="font-size: 11px; color: #666; margin-top: 2px;">
                                    ${countTagUsage(tag)} công ty sử dụng
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button onclick="removeGlobalTag('${tag}')" 
                                        class="btn-danger" 
                                        style="padding: 6px 12px; font-size: 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    🗑️ Xóa toàn hệ thống
                                </button>
                            </div>
                        </div>
                    `).join('') :
                    '<div style="text-align: center; padding: 20px; color: #666;">Chưa có thẻ nào trong hệ thống</div>'
                }
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
                <button onclick="closeModal()" class="btn-secondary" style="padding: 8px 16px;">✅ Đóng</button>
            </div>
        </div>
    `;
    
    showModal('Quản Lý Thẻ Toàn Hệ Thống', modalContent);
}
function countTagUsage(tag) {
    let count = 0;
    
    Object.values(window.hkdData).forEach(company => {
        let found = false;
        
        // Kiểm tra trong tags
        if (company.tags && company.tags.includes(tag)) {
            found = true;
        }
        
        // Kiểm tra trong savedTags
        if (!found && company.savedTags && company.savedTags.includes(tag)) {
            found = true;
        }
        
        // Kiểm tra trong notes
        if (!found && company.notes) {
            for (const note of company.notes) {
                if (note.tags && note.tags.includes(tag)) {
                    found = true;
                    break;
                }
            }
        }
        
        // Kiểm tra trong reminders
        if (!found && company.reminders) {
            for (const reminder of company.reminders) {
                if (reminder.tags && reminder.tags.includes(tag)) {
                    found = true;
                    break;
                }
            }
        }
        
        if (found) {
            count++;
        }
    });
    
    return count;
}
function showQuickNoteModal(taxCode) {
    console.log('🎪 OPENING NOTE MODAL FOR:', taxCode);
    
    const company = window.hkdData[taxCode];
    if (!company) {
        console.error('❌ Company not found:', taxCode);
        return;
    }
    
    // Lấy danh sách thẻ toàn cục VÀ thẻ đã lưu của công ty
    const globalTags = getAllGlobalTags();
    const companySavedTags = company.savedTags || [];

    const modalContent = `
        <div class="quick-note-modal">
            <h4 style="margin-bottom: 15px; color: #1976d3;">📝 Thêm ghi chú cho ${company.name}</h4>
            
            <div class="form-group" style="margin-bottom: 15px;">
                <textarea id="quick-note-content" placeholder="Nội dung ghi chú..." rows="4" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; resize: vertical;"></textarea>
            </div>
            
            <!-- PHẦN QUẢN LÝ THẺ - ĐÃ THÊM NÚT XÓA/GỠ THẺ -->
            <div class="form-group" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold;">🏷️ Quản lý thẻ:</label>
                
                <!-- THẺ ĐÃ LƯU CỦA CÔNG TY - CÓ NÚT XÓA -->
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #666;">Thẻ đã lưu của công ty:</label>
                    <div id="company-saved-tags" style="display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; min-height: 30px; padding: 8px; border: 1px solid #e0e0e0; border-radius: 4px; background: #f8f9fa;">
                        ${companySavedTags.length > 0 ? 
                            companySavedTags.map(tag => `
                                <span class="saved-tag-choice" data-tag="${tag}" 
                                      style="background: ${window.selectedNoteTags.has(tag) ? '#2196f3' : '#4caf50'}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;"
                                      onclick="toggleSavedTagSelection('${tag}')">
                                    #${tag}
                                    <span class="remove-saved-tag" onclick="event.stopPropagation(); removeTagFromCompanyInNoteModal('${taxCode}', '${tag}')" 
                                          style="cursor: pointer; margin-left: 3px; font-size: 10px; color: white; background: rgba(0,0,0,0.2); border-radius: 50%; width: 14px; height: 14px; display: inline-flex; align-items: center; justify-content: center; line-height: 1;">
                                        ×
                                    </span>
                                </span>
                            `).join('') : 
                            '<em style="color: #999; font-size: 12px;">Chưa có thẻ nào được lưu</em>'
                        }
                    </div>
                </div>
                
                <!-- THÊM THẺ MỚI VÀ LƯU -->
                <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                    <input type="text" id="new-tag-input" placeholder="Thêm thẻ mới và lưu..." style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <button onclick="addNewTagAndSave('${taxCode}')" class="btn-success" style="padding: 8px 12px;">➕ Thêm & Lưu</button>
                </div>
                
                <!-- THẺ TOÀN CỤC - CÓ NÚT XÓA TOÀN HỆ THỐNG -->
                <div style="margin-bottom: 10px;">
                    <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 5px;">
                        <label style="font-size: 13px; color: #666;">Thẻ toàn cục:</label>
                        <button onclick="showGlobalTagManager()" class="btn-small" style="padding: 2px 6px; font-size: 10px; background: #ff9800; color: white; border: none; border-radius: 3px; cursor: pointer;">
                            🗑️ Quản lý thẻ hệ thống
                        </button>
                    </div>
                    <div id="global-tags-container" style="display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; min-height: 40px; max-height: 120px; overflow-y: auto; padding: 8px; border: 1px solid #eee; border-radius: 4px;">
                        ${renderGlobalTagsForNote(globalTags)}
                    </div>
                </div>
                
                <!-- THẺ ĐÃ CHỌN - CÓ NÚT XÓA -->
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 13px; font-weight: bold;">Thẻ đã chọn cho ghi chú:</label>
                    <div id="selected-tags-display" style="min-height: 40px; padding: 10px; border: 2px dashed #4caf50; border-radius: 4px; background: #f8fff9;">
                        ${renderSelectedTagsWithRemove()}
                    </div>
                </div>
            </div>
            
            <div class="form-group" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold;">⏰ Nhắc nhở:</label>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="date" id="reminder-date" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <input type="time" id="reminder-time" value="09:00" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
            </div>
            
            <div class="modal-actions" style="display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid #eee; padding-top: 15px;">
                <button onclick="closeModal()" class="btn-secondary" style="padding: 8px 16px;">❌ Hủy</button>
                <button onclick="saveQuickNoteWithTags('${taxCode}')" class="btn-success" style="padding: 8px 16px;">💾 Lưu ghi chú & Thẻ</button>
            </div>
        </div>
    `;
    
    showModal('Thêm Ghi Chú - Gán Thẻ', modalContent);
    
    // Reset selected tags khi mở modal
    window.selectedNoteTags = new Set();
}

// Hàm render thẻ đã chọn với nút xóa
function renderSelectedTagsWithRemove() {
    if (!window.selectedNoteTags || window.selectedNoteTags.size === 0) {
        return '<em style="color: #999;">Chưa chọn thẻ nào</em>';
    }
    
    return Array.from(window.selectedNoteTags).map(tag => `
        <span class="selected-tag-item" style="background: #4caf50; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; display: inline-flex; align-items: center; gap: 5px; margin: 2px; font-weight: bold;">
            #${tag}
            <span class="remove-selected-tag" onclick="removeSelectedTag('${tag}')" 
                  style="cursor: pointer; margin-left: 3px; font-size: 14px; color: white; background: rgba(0,0,0,0.2); border-radius: 50%; width: 16px; height: 16px; display: inline-flex; align-items: center; justify-content: center; line-height: 1;">
                ×
            </span>
        </span>
    `).join('');
}

// Hàm xóa thẻ đã chọn
function removeSelectedTag(tag) {
    if (window.selectedNoteTags.has(tag)) {
        window.selectedNoteTags.delete(tag);
        updateSelectedTagsDisplay();
        updateTagHighlights();
    }
}

// Cập nhật highlight cho thẻ
function updateTagHighlights() {
    // Cập nhật thẻ đã lưu
    const savedTags = document.querySelectorAll('.saved-tag-choice');
    savedTags.forEach(element => {
        const tag = element.getAttribute('data-tag');
        if (window.selectedNoteTags.has(tag)) {
            element.style.background = '#2196f3';
        } else {
            element.style.background = '#4caf50';
        }
    });
    
    // Cập nhật thẻ toàn cục
    const globalTags = document.querySelectorAll('.global-tag-item');
    globalTags.forEach(element => {
        const tag = element.getAttribute('data-tag');
        if (window.selectedNoteTags.has(tag)) {
            element.style.background = '#2196f3';
            element.style.color = 'white';
        } else {
            element.style.background = '#e3f2fd';
            element.style.color = '#1976d2';
        }
    });
}

// Sửa hàm toggle để cập nhật highlight
function toggleSavedTagSelection(tag) {
    if (window.selectedNoteTags.has(tag)) {
        window.selectedNoteTags.delete(tag);
    } else {
        window.selectedNoteTags.add(tag);
    }
    updateSelectedTagsDisplay();
    updateTagHighlights();
}

// Sửa hàm updateSelectedTagsDisplay
function updateSelectedTagsDisplay() {
    const display = document.getElementById('selected-tags-display');
    if (!display) return;
    
    display.innerHTML = renderSelectedTagsWithRemove();
}

// Biến toàn cục để lưu thẻ đã chọn
window.selectedNoteTags = new Set();

// Thêm thẻ mới và lưu vào công ty
function addNewTagAndSave(taxCode) {
    const input = document.getElementById('new-tag-input');
    const tag = input.value.trim();
    
    if (!tag) {
        alert('Vui lòng nhập tên thẻ');
        return;
    }
    
    // Thêm vào thẻ đã chọn
    toggleSavedTagSelection(tag);
    
    // Lưu thẻ vào công ty
    ensureCompanyData(taxCode);
    const company = window.hkdData[taxCode];
    
    if (!company.savedTags) {
        company.savedTags = [];
    }
    
    if (!company.savedTags.includes(tag)) {
        company.savedTags.push(tag);
        saveData();
        
        // Cập nhật hiển thị thẻ đã lưu
        updateCompanySavedTagsDisplay(taxCode);
    }
    
    input.value = '';
    showToast('✅ Đã thêm và lưu thẻ mới', 2000, 'success');
}

function updateCompanySavedTagsDisplay(taxCode) {
    const company = window.hkdData[taxCode];
    const container = document.getElementById('company-saved-tags');
    
    if (container && company.savedTags) {
        container.innerHTML = company.savedTags.map(tag => `
            <span class="saved-tag-choice" data-tag="${tag}" 
                  style="background: ${window.selectedNoteTags.has(tag) ? '#2196f3' : '#4caf50'}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;"
                  onclick="toggleSavedTagSelection('${tag}')">
                #${tag}
                <span class="remove-saved-tag" onclick="event.stopPropagation(); removeTagFromCompanyInNoteModal('${taxCode}', '${tag}')" 
                      style="cursor: pointer; margin-left: 3px; font-size: 10px; color: white; background: rgba(0,0,0,0.2); border-radius: 50%; width: 14px; height: 14px; display: inline-flex; align-items: center; justify-content: center; line-height: 1;">
                    ×
                </span>
            </span>
        `).join('') || '<em style="color: #999; font-size: 12px;">Chưa có thẻ nào được lưu</em>';
    }
}
function showRemoveGlobalTagConfirm(tag) {
    const usageCount = countTagUsage(tag);
    
    if (confirm(`Bạn có chắc muốn xóa thẻ "#${tag}" khỏi TOÀN BỘ HỆ THỐNG?\n\n⚠️ Thao tác này sẽ:\n• Xóa khỏi ${usageCount} công ty\n• Xóa khỏi tất cả ghi chú\n• Xóa khỏi tất cả nhắc nhở\n• KHÔNG THỂ HOÀN TÁC!`)) {
        removeGlobalTag(tag);
    }
}
// Render thẻ toàn cục cho ghi chú
function renderGlobalTagsForNote(tags) {
    if (tags.length === 0) {
        return '<div style="color: #999; text-align: center; width: 100%;">Chưa có thẻ toàn cục nào</div>';
    }
    
    return tags.map(tag => `
        <span class="global-tag-item" data-tag="${tag}" 
              style="background: ${window.selectedNoteTags.has(tag) ? '#2196f3' : '#e3f2fd'}; color: ${window.selectedNoteTags.has(tag) ? 'white' : '#1976d2'}; padding: 4px 8px; border-radius: 12px; display: inline-flex; align-items: center; gap: 5px; cursor: pointer; font-size: 12px;"
              onclick="toggleSavedTagSelection('${tag}')">
            #${tag}
            <span class="remove-global-tag" onclick="event.stopPropagation(); showRemoveGlobalTagConfirm('${tag}')" 
                  style="color: #f44336; cursor: pointer; font-size: 10px; margin-left: 3px; background: rgba(0,0,0,0.1); border-radius: 50%; width: 14px; height: 14px; display: inline-flex; align-items: center; justify-content: center;">
                ×
            </span>
        </span>
    `).join('');
}

function saveQuickNoteWithTags(taxCode) {
    const content = document.getElementById('quick-note-content')?.value.trim();
    const tags = Array.from(window.selectedNoteTags);
    
    // CHO PHÉP LƯU CHỈ CÓ THẺ, KHÔNG CẦN GHÍ CHÚ
    if (!content && tags.length === 0) {
        alert('Vui lòng nhập nội dung ghi chú hoặc chọn ít nhất một thẻ');
        return;
    }
    
    console.log('💾 Saving note/tags for company:', taxCode);
    
    ensureCompanyData(taxCode);
    const company = window.hkdData[taxCode];
    
    // NẾU CÓ GHÍ CHÚ, TẠO NOTE MỚI
    if (content) {
        // Khởi tạo notes nếu chưa có
        if (!company.notes) {
            company.notes = [];
        }
        
        // Tạo note mới
        const newNote = {
            id: 'note_' + Date.now(),
            content: content,
            tags: tags,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'pending',
            type: 'quick'
        };
        
        // Thêm reminder nếu có
        const reminderDate = document.getElementById('reminder-date')?.value;
        const reminderTime = document.getElementById('reminder-time')?.value;
        
        if (reminderDate) {
            const reminderId = 'reminder_' + Date.now();
            const newReminder = {
                id: reminderId,
                title: `Nhắc: ${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`,
                description: content,
                dueDate: reminderDate,
                dueTime: reminderTime || '09:00',
                priority: 'medium',
                status: 'pending',
                tags: tags,
                noteId: newNote.id,
                createdAt: new Date().toISOString()
            };
            
            if (!company.reminders) company.reminders = [];
            company.reminders.push(newReminder);
            newNote.reminderId = reminderId;
        }
        
        company.notes.push(newNote);
    }
    
    // LUÔN CẬP NHẬT TAGS CỦA CÔNG TY (dù có ghi chú hay không)
    if (tags.length > 0) {
        if (!company.savedTags) {
            company.savedTags = [];
        }
        
        tags.forEach(tag => {
            if (!company.savedTags.includes(tag)) {
                company.savedTags.push(tag);
            }
        });
    }
    
    saveData();
    
    // Reset selected tags
    window.selectedNoteTags.clear();
    
    closeModal();
    renderCompanyList();
    
    console.log('✅ Note/tags saved successfully!');
    
    if (content && tags.length > 0) {
        showToast('✅ Đã lưu ghi chú và thẻ thành công!', 2000, 'success');
    } else if (content) {
        showToast('✅ Đã lưu ghi chú thành công!', 2000, 'success');
    } else if (tags.length > 0) {
        showToast('✅ Đã lưu thẻ thành công!', 2000, 'success');
    }
}
function getAllGlobalTags() {
    const allTags = new Set();
    
    Object.values(window.hkdData).forEach(company => {
        // Thêm tags từ tags của công ty
        if (company.tags) {
            company.tags.forEach(tag => allTags.add(tag));
        }
        
        // Thêm tags từ savedTags của công ty
        if (company.savedTags) {
            company.savedTags.forEach(tag => allTags.add(tag));
        }
        
        // Thêm tags từ notes
        if (company.notes) {
            company.notes.forEach(note => {
                if (note.tags) {
                    note.tags.forEach(tag => allTags.add(tag));
                }
            });
        }
        
        // Thêm tags từ reminders
        if (company.reminders) {
            company.reminders.forEach(reminder => {
                if (reminder.tags) {
                    reminder.tags.forEach(tag => allTags.add(tag));
                }
            });
        }
    });
    
    return Array.from(allTags).sort();
}
let selectedTags = new Set();

function toggleTagSelection(tag) {
    if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
    } else {
        selectedTags.add(tag);
    }
    updateSelectedTagsDisplay();
}



function addGlobalTagFromInput() {
    const input = document.getElementById('new-global-tag-input');
    const tag = input.value.trim();
    
    if (!tag) {
        alert('Vui lòng nhập tên thẻ');
        return;
    }
    
    // Thêm vào danh sách thẻ toàn cục (không lưu trực tiếp vào company nào)
    selectedTags.add(tag);
    updateSelectedTagsDisplay();
    
    // Refresh danh sách thẻ
    const container = document.getElementById('global-tags-container');
    if (container) {
        const globalTags = getAllGlobalTags();
        container.innerHTML = renderGlobalTags(globalTags);
    }
    
    input.value = '';
}
function saveQuickNoteWithGlobalTags(taxCode) {
    const content = document.getElementById('quick-note-content')?.value.trim();
    
    if (!content) {
        alert('Vui lòng nhập nội dung ghi chú');
        return;
    }
    
    console.log('💾 Saving note for company:', taxCode);
    
    ensureCompanyData(taxCode);
    const company = window.hkdData[taxCode];
    
    // Khởi tạo notes nếu chưa có
    if (!company.notes) {
        company.notes = [];
    }
    
    // Lấy tags từ selectedTags
    const tags = Array.from(selectedTags);
    
    // Tạo note mới
    const newNote = {
        id: 'note_' + Date.now(),
        content: content,
        tags: tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'pending', // pending, completed
        type: 'quick'
    };
    
    // Thêm reminder nếu có
    const reminderDate = document.getElementById('reminder-date')?.value;
    const reminderTime = document.getElementById('reminder-time')?.value;
    
    if (reminderDate) {
        const reminderId = 'reminder_' + Date.now();
        const newReminder = {
            id: reminderId,
            title: `Nhắc: ${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`,
            description: content,
            dueDate: reminderDate,
            dueTime: reminderTime || '09:00',
            priority: 'medium',
            status: 'pending',
            tags: tags,
            noteId: newNote.id,
            createdAt: new Date().toISOString()
        };
        
        if (!company.reminders) company.reminders = [];
        company.reminders.push(newReminder);
        newNote.reminderId = reminderId;
    }
    
    // Cập nhật tags của công ty
    tags.forEach(tag => {
        if (!company.tags.includes(tag)) {
            company.tags.push(tag);
        }
    });
    
    company.notes.push(newNote);
    saveData();
    
    // Reset selected tags
    selectedTags.clear();
    
    closeModal();
    renderCompanyList();
    
    console.log('✅ Note saved with status tracking!');
    
    showToast('✅ Đã thêm ghi chú thành công!', 2000, 'success');
}
function removeGlobalTag(tag) {
    if (confirm(`Bạn có chắc muốn xóa thẻ "#${tag}" khỏi TOÀN BỘ HỆ THỐNG?\n\nThao tác này sẽ xóa thẻ khỏi tất cả công ty, ghi chú và nhắc nhở.`)) {
        console.log('🗑️ Removing global tag from system:', tag);
        
        let removedCount = 0;
        
        // Xóa thẻ khỏi tất cả công ty
        Object.values(window.hkdData).forEach(company => {
            // Xóa khỏi tags
            if (company.tags) {
                const before = company.tags.length;
                company.tags = company.tags.filter(t => t !== tag);
                const after = company.tags.length;
                if (before !== after) removedCount++;
            }
            
            // Xóa khỏi savedTags
            if (company.savedTags) {
                const before = company.savedTags.length;
                company.savedTags = company.savedTags.filter(t => t !== tag);
                const after = company.savedTags.length;
                if (before !== after) removedCount++;
            }
            
            // Xóa khỏi tất cả notes
            if (company.notes) {
                company.notes.forEach(note => {
                    if (note.tags && Array.isArray(note.tags)) {
                        const before = note.tags.length;
                        note.tags = note.tags.filter(t => t !== tag);
                        const after = note.tags.length;
                        if (before !== after) removedCount++;
                    }
                });
            }
            
            // Xóa khỏi tất cả reminders
            if (company.reminders) {
                company.reminders.forEach(reminder => {
                    if (reminder.tags && Array.isArray(reminder.tags)) {
                        const before = reminder.tags.length;
                        reminder.tags = reminder.tags.filter(t => t !== tag);
                        const after = reminder.tags.length;
                        if (before !== after) removedCount++;
                    }
                });
            }
        });
        
        saveData();
        
        console.log(`✅ Global tag removed: ${tag} (${removedCount} occurrences)`);
        
        // Refresh tất cả UI
        const currentModal = document.getElementById('custom-modal');
        if (currentModal) {
            const modalTitle = currentModal.querySelector('h3');
            if (modalTitle && modalTitle.textContent.includes('Thẻ')) {
                closeModal();
            }
        }
        
        // Update tag filter options
        updateTagFilterOptions();
        
        // Refresh company list
        renderCompanyList();
        
        showToast(`✅ Đã xóa thẻ "#${tag}" khỏi toàn hệ thống (${removedCount} vị trí)`, 3000, 'success');
    }
}
function renderGlobalTags(tags) {
    if (tags.length === 0) {
        return '<div style="color: #999; text-align: center; width: 100%;">Chưa có thẻ nào</div>';
    }
    
    return tags.map(tag => `
        <span class="global-tag-item" data-tag="${tag}" 
              style="background: #e3f2fd; padding: 4px 8px; border-radius: 12px; display: inline-flex; align-items: center; gap: 5px; cursor: pointer; font-size: 12px;"
              onclick="toggleTagSelection('${tag}')">
            #${tag}
            <span class="remove-global-tag" onclick="event.stopPropagation(); removeGlobalTag('${tag}')" 
                  style="color: #f44336; cursor: pointer; font-size: 14px; margin-left: 3px;">×</span>
        </span>
    `).join('');
}
function renderGlobalTagsManagement() {
    const allGlobalTags = getAllGlobalTags();
    
    if (allGlobalTags.length === 0) {
        return '<div style="color: #666; text-align: center; padding: 10px;">Chưa có thẻ nào trong hệ thống</div>';
    }
    
    return allGlobalTags.map(tag => `
        <div class="global-tag-management-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; margin-bottom: 5px; background: #f8f9fa; border-radius: 4px;">
            <span style="font-weight: 500; color: #333;">#${tag}</span>
            <div style="display: flex; gap: 5px;">
                <button onclick="removeGlobalTag('${tag}')" 
                        class="btn-danger" 
                        style="padding: 4px 8px; font-size: 11px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer;">
                    🗑️ Xóa toàn hệ thống
                </button>
            </div>
        </div>
    `).join('');
}
function showQuickTagModal(taxCode) {
    console.log('🎪 OPENING TAG MODAL FOR:', taxCode);
    
    const company = window.hkdData[taxCode];
    if (!company) {
        console.error('❌ Company not found:', taxCode);
        return;
    }
    
    const currentTags = company.tags || [];
    const savedTags = company.savedTags || [];
    
    const modalContent = `
        <div class="quick-tag-modal">
            <h4 style="margin-bottom: 15px; color: #1976d3;">🏷️ Quản Lý Thẻ - ${company.name}</h4>
            
            <!-- THẺ HIỆN TẠI CỦA CÔNG TY -->
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold;">📌 Thẻ đang gán cho công ty:</label>
                <div id="current-tags" style="margin: 10px 0; min-height: 40px; padding: 10px; border: 1px solid #e0e0e0; border-radius: 6px; background: #f8f9fa;">
                    ${currentTags.length > 0 ? 
                        currentTags.map(tag => `
                            <span class="tag-item" style="display: inline-block; background: #4caf50; color: white; padding: 6px 12px; margin: 4px; border-radius: 15px; font-size: 13px;">
                                #${tag}
                                <span class="remove-tag" data-tag="${tag}" 
                                      onclick="removeTag('${taxCode}', '${tag}')" 
                                      style="cursor: pointer; margin-left: 8px; color: white; background: rgba(0,0,0,0.2); border-radius: 50%; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px;">
                                    ×
                                </span>
                            </span>
                        `).join('') : 
                        '<div style="color: #666; text-align: center; padding: 10px;">Chưa có thẻ nào được gán</div>'
                    }
                </div>
                <small style="color: #666;">Click × để xóa thẻ khỏi công ty này</small>
            </div>
            
            <!-- THẺ ĐÃ LƯU CỦA CÔNG TY -->
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold;">💾 Thẻ đã lưu của công ty:</label>
                <div id="saved-tags" style="margin: 10px 0; min-height: 40px; padding: 10px; border: 1px solid #e0e0e0; border-radius: 6px; background: #f8fff9;">
                    ${savedTags.length > 0 ? 
                        savedTags.map(tag => `
                            <span class="saved-tag-item" style="display: inline-block; background: #2196f3; color: white; padding: 6px 12px; margin: 4px; border-radius: 15px; font-size: 13px;">
                                #${tag}
                                <span class="remove-saved-tag" data-tag="${tag}" 
                                      onclick="removeTag('${taxCode}', '${tag}')" 
                                      style="cursor: pointer; margin-left: 8px; color: white; background: rgba(0,0,0,0.2); border-radius: 50%; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px;">
                                    ×
                                </span>
                            </span>
                        `).join('') : 
                        '<div style="color: #666; text-align: center; padding: 10px;">Chưa có thẻ nào được lưu</div>'
                    }
                </div>
                <small style="color: #666;">Thẻ đã lưu có thể dùng cho nhiều ghi chú</small>
            </div>
            
            <!-- THÊM THẺ MỚI -->
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold;">➕ Thêm thẻ mới:</label>
                <input type="text" id="new-tag-input" placeholder="Nhập tên thẻ mới..." 
                       style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px;">
                <small style="color: #666;">Enter để thêm thẻ vào công ty</small>
            </div>
            
            <!-- QUẢN LÝ THẺ TOÀN HỆ THỐNG -->
            <div class="form-group" style="margin-bottom: 20px; padding: 15px; background: #fff3cd; border-radius: 6px; border: 1px solid #ffeaa7;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #856404;">🌐 Quản lý thẻ toàn hệ thống:</label>
                <div id="global-tags-management" style="max-height: 150px; overflow-y: auto; margin: 10px 0; padding: 10px; background: white; border-radius: 4px; border: 1px solid #ddd;">
                    ${renderGlobalTagsManagement()}
                </div>
                <small style="color: #856404;">Xóa thẻ khỏi toàn bộ hệ thống (tất cả công ty)</small>
            </div>
            
            <div class="modal-actions" style="display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid #eee; padding-top: 15px;">
                <button onclick="closeModal()" class="btn-secondary" style="padding: 8px 16px;">✅ Xong</button>
            </div>
        </div>
    `;
    
    showModal('Quản Lý Thẻ', modalContent);
    
    // Xử lý thêm thẻ mới
    const tagInput = document.getElementById('new-tag-input');
    if (tagInput) {
        tagInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const tag = this.value.trim();
                if (tag) {
                    console.log('🏷️ Adding new tag:', tag);
                    addNewTag(taxCode, tag);
                    this.value = '';
                }
            }
        });
    }
}
function formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) return '0';
    return accountingRound(amount).toLocaleString('vi-VN');
}
window.formatCurrency = formatCurrency;


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
    // Đóng tất cả các loại modal
    const modals = [
        'custom-modal',
        'processing-choice-modal',
        'quick-note-modal',
        'quick-tag-modal'
    ];
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    });
    
    // Đóng modal bằng class (nếu có)
    const modalElements = document.querySelectorAll('[id*="modal"]');
    modalElements.forEach(modal => {
        if (modal.style.display === 'flex' || modal.style.display === 'block') {
            modal.remove();
        }
    });
    
    console.log('✅ Đã đóng tất cả modal');
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


/**
 * Kiểm tra nhắc nhở quá hạn
 */
function checkOverdueReminders(reminders) {
    if (!reminders || reminders.length === 0) return false;
    
    const now = new Date();
    
    return reminders.some(reminder => {
        if (reminder.status !== 'pending') return false;
        
        const dueDateTime = new Date(`${reminder.dueDate}T${reminder.dueTime}`);
        return dueDateTime < now;
    });
}

/**
 * Format ngày tháng
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

/**
 * Format ngày giờ
 */
function formatDateTime(dateString, timeString) {
    if (!dateString) return '';
    try {
        const date = new Date(`${dateString}T${timeString || '00:00'}`);
        return date.toLocaleString('vi-VN');
    } catch {
        return `${dateString} ${timeString}`;
    }
}

// =======================
// HỆ THỐNG QUẢN LÝ THẺ
// =======================

/**
 * Render tag selector
 */
function renderTagSelector(company) {
    const savedTags = company.savedTags || [];
    const currentTags = company.tags || [];
    
    return savedTags.map(tag => `
        <label style="display: inline-flex; align-items: center; margin-right: 8px;">
            <input type="checkbox" value="${tag}" ${currentTags.includes(tag) ? 'checked' : ''} 
                   onchange="toggleNoteTag('${company.taxCode}', '${tag}')">
            <span style="margin-left: 4px;">#${tag}</span>
        </label>
    `).join('');
}

/**
 * Thêm thẻ mới từ input
 */
function addNewTagFromInput(taxCode) {
    const input = document.getElementById('new-tag-input');
    const tag = input.value.trim();
    
    if (!tag) {
        alert('Vui lòng nhập tên thẻ');
        return;
    }
    
    ensureCompanyData(taxCode);
    const company = window.hkdData[taxCode];
    
    // Thêm vào savedTags nếu chưa có
    if (!company.savedTags.includes(tag)) {
        company.savedTags.push(tag);
    }
    
    // Thêm vào tags hiện tại
    if (!company.tags.includes(tag)) {
        company.tags.push(tag);
    }
    
    saveData();
    
    // Refresh modal
    showNoteManagerModal(taxCode);
}

// Đảm bảo thêm các hàm này nếu chưa có
function showUrgentNotes(taxCode) {
    const company = window.hkdData[taxCode];
    const urgentNotes = (company.notes || []).filter(note => 
        note.tags && note.tags.includes('urgent')
    );
    
    if (urgentNotes.length === 0) {
        showNotesQuickView(taxCode);
        return;
    }
    
    const modalContent = `
        <div class="urgent-notes">
            <h4 style="color: #f44336; margin-bottom: 15px;">🚨 Ghi chú quan trọng - ${company.name}</h4>
            <div style="max-height: 300px; overflow-y: auto;">
                ${urgentNotes.map(note => `
                    <div style="border: 2px solid #f44336; border-radius: 6px; padding: 10px; margin: 8px 0; background: #ffebee;">
                        <div style="font-weight: bold; margin-bottom: 5px;">${note.content}</div>
                        <div style="font-size: 11px; color: #666;">
                            🕒 ${formatDate(note.createdAt)}
                            ${note.tags.map(tag => `<span style="background: #ffcdd2; padding: 1px 4px; border-radius: 8px; margin-right: 4px;">#${tag}</span>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top: 15px; text-align: right;">
                <button onclick="showNotesQuickView('${taxCode}')" class="btn-primary">Xem tất cả ghi chú</button>
            </div>
        </div>
    `;
    
    showModal('Ghi Chú Quan Trọng', modalContent);
}
function setupCompanyFilters() {
    const companyList = document.getElementById('company-list');
    if (!companyList) return;
    
    // Tạo container cho bộ lọc
    const filterContainer = document.createElement('div');
    filterContainer.className = 'company-filters';
    filterContainer.style.cssText = `
        padding: 15px;
        border-bottom: 1px solid #eee;
        background: #f8f9fa;
    `;
    
    filterContainer.innerHTML = `
        <div style="margin-bottom: 10px;">
            <input type="text" id="company-search" placeholder="🔍 Tìm theo tên/MST công ty..." 
                   style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px;">
        </div>
        
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <select id="tag-filter" style="flex: 1; min-width: 150px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="">🏷️ Tất cả thẻ</option>
            </select>
            
            <!-- NÚT MỚI: Mở popup quản lý URL -->
            <button onclick="showUrlManagerPopup()" class="btn-primary" style="padding: 8px 12px; white-space: nowrap;">
                🌐 Quản lý URL
            </button>
            
            <select id="note-status-filter" style="flex: 1; min-width: 150px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="">📝 Tất cả trạng thái</option>
                <option value="has_notes">Có ghi chú</option>
                <option value="pending">Chưa hoàn thành</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="no_notes">Không có ghi chú</option>
            </select>
            
            <button onclick="clearFilters()" class="btn-secondary" style="padding: 8px 12px; white-space: nowrap;">
                🗑️ Xóa lọc
            </button>
        </div>
    `;
    
    // Chèn bộ lọc vào đầu danh sách
    companyList.parentNode.insertBefore(filterContainer, companyList);
    
    // Khởi tạo danh sách thẻ cho filter
    updateTagFilterOptions();
    
    // Thêm event listeners
    document.getElementById('company-search').addEventListener('input', applyCompanyFilters);
    document.getElementById('tag-filter').addEventListener('change', applyCompanyFilters);
    document.getElementById('note-status-filter').addEventListener('change', applyCompanyFilters);
}

function updateTagFilterOptions() {
    const tagFilter = document.getElementById('tag-filter');
    if (!tagFilter) return;
    
    const allTags = getAllGlobalTags();
    
    // Giữ option đầu tiên
    const firstOption = tagFilter.options[0];
    tagFilter.innerHTML = '';
    tagFilter.appendChild(firstOption);
    
    // Thêm các tag
    allTags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = `#${tag}`;
        tagFilter.appendChild(option);
    });
}
/*
function applyCompanyFilters() {
    const searchTerm = document.getElementById('company-search')?.value.toLowerCase() || '';
    const selectedTag = document.getElementById('tag-filter')?.value || '';
    const noteStatus = document.getElementById('note-status-filter')?.value || '';
    
    const companyItems = document.querySelectorAll('.company-item');
    
    console.log('🔍 Applying filters:', { searchTerm, selectedTag, noteStatus });
    
    let visibleCount = 0;
    
    companyItems.forEach(item => {
        let shouldShow = true;
        
        // Lọc theo search term
        if (searchTerm) {
            const companyName = item.getAttribute('data-name') || '';
            const companyTaxCode = item.getAttribute('data-taxcode') || '';
            
            if (!companyName.includes(searchTerm) && !companyTaxCode.includes(searchTerm)) {
                shouldShow = false;
            }
        }
        
        // Lọc theo tag
        if (shouldShow && selectedTag) {
            const companyTags = item.getAttribute('data-tags') || '';
            if (!companyTags.includes(selectedTag)) {
                shouldShow = false;
            }
        }
        
        // Lọc theo trạng thái ghi chú
        if (shouldShow && noteStatus) {
            const notesCount = parseInt(item.getAttribute('data-notes-count') || '0');
            const hasPendingNotes = item.getAttribute('data-has-pending-notes') === 'true';
            const allCompleted = item.getAttribute('data-all-completed') === 'true';
            
            switch(noteStatus) {
                case 'has_notes':
                    shouldShow = notesCount > 0;
                    break;
                case 'pending':
                    shouldShow = hasPendingNotes;
                    break;
                case 'completed':
                    shouldShow = allCompleted;
                    break;
                case 'no_notes':
                    shouldShow = notesCount === 0;
                    break;
            }
        }
        
        // HIỂN THỊ ĐÚNG CẤU TRÚC - KHÔNG THAY ĐỔI STYLE
        if (shouldShow) {
            item.style.display = 'flex'; // GIỮ NGUYÊN CẤU TRÚC FLEX
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    console.log(`✅ Filters applied: ${visibleCount}/${companyItems.length} companies visible`);
}
*/
function applyCompanyFilters() {
    const searchTerm = document.getElementById('company-search')?.value.toLowerCase() || '';
    const selectedTag = document.getElementById('tag-filter')?.value || '';
    const noteStatus = document.getElementById('note-status-filter')?.value || '';
    
    const companyItems = document.querySelectorAll('.company-item');
    
    console.log('🔍 Applying filters:', { searchTerm, selectedTag, noteStatus });
    
    let visibleCount = 0;
    
    companyItems.forEach(item => {
        let shouldShow = true;
        
        // Lọc theo search term
        if (searchTerm) {
            const companyName = item.querySelector('.company-name')?.textContent.toLowerCase() || '';
            const companyMST = item.querySelector('.company-mst')?.textContent.toLowerCase() || '';
            if (!companyName.includes(searchTerm) && !companyMST.includes(searchTerm)) {
                shouldShow = false;
            }
        }
        
        // Lọc theo tag - SỬA LẠI CÁCH TRÍCH XUẤT MST
        if (shouldShow && selectedTag) {
            const mstElement = item.querySelector('.company-mst');
            let companyTaxCode = null;
            
            if (mstElement) {
                // Cách 1: Lấy text và xử lý
                const mstText = mstElement.textContent.trim();
                companyTaxCode = mstText.replace('MST:', '').trim();
                
                // Cách 2: Tìm text node đầu tiên
                if (!companyTaxCode) {
                    const textNode = Array.from(mstElement.childNodes)
                        .find(node => node.nodeType === Node.TEXT_NODE);
                    if (textNode) {
                        companyTaxCode = textNode.textContent.replace('MST:', '').trim();
                    }
                }
            }
            
            console.log(`🏷️ Checking tag for ${companyTaxCode}:`, selectedTag);
            
            if (companyTaxCode && window.hkdData[companyTaxCode]) {
                const company = window.hkdData[companyTaxCode];
                
                // KIỂM TRA CẢ savedTags VÀ tags
                const companySavedTags = company.savedTags || [];
                const companyNoteTags = getAllTagsFromNotes(company.notes || []);
                
                // Gộp tất cả tags từ cả savedTags và notes
                const allCompanyTags = [...new Set([...companySavedTags, ...companyNoteTags])];
                
                console.log(`📊 Company ${companyTaxCode} tags:`, allCompanyTags);
                
                if (!allCompanyTags.includes(selectedTag)) {
                    shouldShow = false;
                    console.log(`❌ Company ${companyTaxCode} doesn't have tag: ${selectedTag}`);
                } else {
                    console.log(`✅ Company ${companyTaxCode} has tag: ${selectedTag}`);
                }
            } else {
                console.log(`❌ Company not found: ${companyTaxCode}`);
                shouldShow = false;
            }
        }
        
        // Lọc theo trạng thái ghi chú - SỬA LẠI CÁCH TRÍCH XUẤT MST
        if (shouldShow && noteStatus) {
            const mstElement = item.querySelector('.company-mst');
            let companyTaxCode = null;
            
            if (mstElement) {
                const mstText = mstElement.textContent.trim();
                companyTaxCode = mstText.replace('MST:', '').trim();
            }
            
            console.log(`📝 Checking notes for ${companyTaxCode}:`, noteStatus);
            
            if (companyTaxCode && window.hkdData[companyTaxCode]) {
                const company = window.hkdData[companyTaxCode];
                const notes = company.notes || [];
                
                console.log(`📋 Company ${companyTaxCode} has ${notes.length} notes`);
                
                let matches = false;
                switch(noteStatus) {
                    case 'has_notes':
                        matches = notes.length > 0;
                        break;
                    case 'pending':
                        matches = notes.some(note => note.status !== 'completed');
                        break;
                    case 'completed':
                        matches = notes.length > 0 && notes.every(note => note.status === 'completed');
                        break;
                    case 'no_notes':
                        matches = notes.length === 0;
                        break;
                }
                
                if (!matches) {
                    shouldShow = false;
                    console.log(`❌ Company ${companyTaxCode} doesn't match note status: ${noteStatus}`);
                } else {
                    console.log(`✅ Company ${companyTaxCode} matches note status: ${noteStatus}`);
                }
            } else {
                shouldShow = false;
            }
        }
        
        // HIỂN THỊ
        if (shouldShow) {
            item.style.display = 'block';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    console.log(`✅ Filters applied: ${visibleCount}/${companyItems.length} companies visible`);
}

// ĐẢM BẢO HÀM NÀY TỒN TẠI
function getAllTagsFromNotes(notes) {
    const allTags = [];
    notes.forEach(note => {
        if (note.tags && Array.isArray(note.tags)) {
            allTags.push(...note.tags);
        }
    });
    return [...new Set(allTags)];
}
// Hàm trích xuất MST từ company item
function extractTaxCodeFromItem(item) {
    const mstElement = item.querySelector('.company-mst');
    if (!mstElement) return null;
    
    // Lấy text từ MST element
    const mstText = mstElement.textContent.trim();
    const taxCode = mstText.replace('MST:', '').trim();
    
    return taxCode || null;
}

// Kiểm tra công ty có tag không
function checkCompanyHasTag(company, selectedTag) {
    // 1. Kiểm tra savedTags
    if (company.savedTags && company.savedTags.includes(selectedTag)) {
        return true;
    }
    
    // 2. Kiểm tra tags từ notes
    if (company.notes) {
        for (const note of company.notes) {
            if (note.tags && note.tags.includes(selectedTag)) {
                return true;
            }
        }
    }
    
    // 3. Kiểm tra tags từ reminders
    if (company.reminders) {
        for (const reminder of company.reminders) {
            if (reminder.tags && reminder.tags.includes(selectedTag)) {
                return true;
            }
        }
    }
    
    return false;
}

// Kiểm tra trạng thái ghi chú
function checkNotesMatchStatus(notes, noteStatus) {
    switch(noteStatus) {
        case 'has_notes':
            return notes.length > 0;
            
        case 'pending':
            return notes.some(note => note.status !== 'completed');
            
        case 'completed':
            return notes.length > 0 && notes.every(note => note.status === 'completed');
            
        case 'no_notes':
            return notes.length === 0;
            
        default:
            return true;
    }
}

// Hàm lấy tất cả tags từ notes
function getAllTagsFromNotes(notes) {
    const allTags = [];
    notes.forEach(note => {
        if (note.tags && Array.isArray(note.tags)) {
            allTags.push(...note.tags);
        }
    });
    return [...new Set(allTags)];
}

// Cập nhật danh sách thẻ cho filter
function updateTagFilterOptions() {
    const tagFilter = document.getElementById('tag-filter');
    if (!tagFilter) return;
    
    // Lấy tất cả tags từ tất cả công ty (cả savedTags và note tags)
    const allTags = new Set();
    Object.values(window.hkdData).forEach(company => {
        // Thêm savedTags
        if (company.savedTags) {
            company.savedTags.forEach(tag => allTags.add(tag));
        }
        // Thêm tags từ notes
        if (company.notes) {
            company.notes.forEach(note => {
                if (note.tags) {
                    note.tags.forEach(tag => allTags.add(tag));
                }
            });
        }
    });
    
    const sortedTags = Array.from(allTags).sort();
    
    // Giữ option đầu tiên
    const firstOption = tagFilter.options[0];
    tagFilter.innerHTML = '';
    tagFilter.appendChild(firstOption);
    
    // Thêm các tag
    sortedTags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = `#${tag}`;
        tagFilter.appendChild(option);
    });
}

function clearFilters() {
    document.getElementById('company-search').value = '';
    document.getElementById('tag-filter').value = '';
    document.getElementById('note-status-filter').value = '';
    applyCompanyFilters();
}
function showUrlManagerPopup() {
    const companies = Object.keys(window.hkdData);
    
    if (companies.length === 0) {
        alert('❌ Chưa có công ty nào. Vui lòng thêm công ty trước.');
        return;
    }

    const modalContent = `
        <div class="url-manager-modal">
            <h4 style="margin-bottom: 15px; color: #1976d3;">🌐 Quản Lý URL Toàn Hệ Thống</h4>
            
            <div style="background: #e8f5e8; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                <h5 style="margin: 0 0 10px 0; color: #2e7d32;">🌍 URL CHUNG CHO TOÀN BỘ CÔNG TY</h5>
                <p style="margin: 0; color: #555; font-size: 13px;">URL này sẽ được áp dụng cho tất cả ${companies.length} công ty trong hệ thống</p>
            </div>
            
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold;">URL mặc định toàn hệ thống:</label>
                <input type="url" id="global-default-url" value="${getGlobalDefaultUrl()}" 
                       placeholder="https://hoadondientu.gdt.gov.vn" 
                       style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                <small style="color: #666;">URL này sẽ dùng cho tất cả công ty khi chưa có URL riêng</small>
            </div>
            
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold;">📋 Danh sách URL chung:</label>
                <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                    <input type="url" id="new-global-url" placeholder="https://example.com" 
                           style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                    <button onclick="addGlobalUrl()" class="btn-success" style="padding: 10px 15px;">➕ Thêm URL Chung</button>
                </div>
                <div id="global-urls-list" style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 15px; border-radius: 6px; background: #f8f9fa;">
                    ${renderGlobalUrlsList()}
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid #eee; padding-top: 20px;">
                <button onclick="saveGlobalUrls()" class="btn-success" style="padding: 10px 20px;">💾 Lưu URL Toàn Hệ Thống</button>
                <button onclick="closeModal()" class="btn-secondary" style="padding: 10px 20px;">❌ Đóng</button>
            </div>
        </div>
    `;
    
    showModal('Quản Lý URL Toàn Hệ Thống', modalContent);
}
// Lưu URL mặc định toàn hệ thống
function saveGlobalDefaultUrl(url) {
    if (!window.hkdData._system) {
        window.hkdData._system = {};
    }
    window.hkdData._system.globalDefaultUrl = url;
    saveData();
}

// Lấy URL mặc định toàn hệ thống
function getGlobalDefaultUrl() {
    return window.hkdData._system?.globalDefaultUrl || 'https://hoadondientu.gdt.gov.vn';
}

// Lưu danh sách URL chung toàn hệ thống
function saveGlobalUrls(urls) {
    if (!window.hkdData._system) {
        window.hkdData._system = {};
    }
    window.hkdData._system.globalUrls = urls;
    saveData();
    showToast('✅ Đã lưu URL toàn hệ thống', 2000, 'success');
}

// Lấy danh sách URL chung toàn hệ thống
function getGlobalUrls() {
    return window.hkdData._system?.globalUrls || [];
}

// Thêm URL vào danh sách chung
function addGlobalUrl() {
    const urlInput = document.getElementById('new-global-url');
    const url = urlInput.value.trim();
    
    if (!url) {
        alert('❌ Vui lòng nhập URL');
        return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        alert('❌ URL phải bắt đầu với http:// hoặc https://');
        return;
    }
    
    const globalUrls = getGlobalUrls();
    if (globalUrls.includes(url)) {
        alert('❌ URL đã tồn tại trong danh sách chung');
        return;
    }
    
    globalUrls.push(url);
    saveGlobalUrls(globalUrls);
    
    // Cập nhật UI
    document.getElementById('global-urls-list').innerHTML = renderGlobalUrlsList();
    urlInput.value = '';
    
    showToast('✅ Đã thêm URL vào danh sách chung', 2000, 'success');
}

// Xóa URL khỏi danh sách chung
function removeGlobalUrl(url) {
    const globalUrls = getGlobalUrls();
    const index = globalUrls.indexOf(url);
    
    if (index !== -1) {
        globalUrls.splice(index, 1);
        saveGlobalUrls(globalUrls);
        document.getElementById('global-urls-list').innerHTML = renderGlobalUrlsList();
        showToast('✅ Đã xóa URL khỏi danh sách chung', 2000, 'success');
    }
}

// Render danh sách URL chung
function renderGlobalUrlsList() {
    const globalUrls = getGlobalUrls();
    
    if (globalUrls.length === 0) {
        return '<div style="color: #666; text-align: center; padding: 10px;">Chưa có URL nào trong danh sách chung</div>';
    }
    
    return globalUrls.map(url => `
        <div class="url-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; margin-bottom: 5px; background: white; border-radius: 4px; border: 1px solid #e0e0e0;">
            <span style="flex: 1; font-size: 12px; word-break: break-all;">${url}</span>
            <div style="display: flex; gap: 5px;">
                <button onclick="launchUrlPreview('${url}')" class="btn-small" style="padding: 4px 8px; background: #17a2b8; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">👁️ Xem</button>
                <button onclick="removeGlobalUrl('${url}')" class="btn-small btn-danger" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">🗑️ Xóa</button>
            </div>
        </div>
    `).join('');
}

// Lưu cài đặt URL toàn hệ thống
function saveGlobalUrls() {
    const defaultUrl = document.getElementById('global-default-url').value.trim();
    
    if (!defaultUrl) {
        alert('❌ Vui lòng nhập URL mặc định');
        return;
    }
    
    if (!defaultUrl.startsWith('http://') && !defaultUrl.startsWith('https://')) {
        alert('❌ URL mặc định phải bắt đầu với http:// hoặc https://');
        return;
    }
    
    saveGlobalDefaultUrl(defaultUrl);
    showToast('✅ Đã lưu cài đặt URL toàn hệ thống', 2000, 'success');
}
/*
// Load URLs của công ty được chọn
function loadCompanyUrls() {
    const companySelect = document.getElementById('company-urls-select');
    const companySection = document.getElementById('company-urls-section');
    const noCompanyMsg = document.getElementById('no-company-selected');
    const companyNameSpan = document.getElementById('current-company-name');
    
    const taxCode = companySelect.value;
    
    if (!taxCode) {
        companySection.style.display = 'none';
        noCompanyMsg.style.display = 'block';
        return;
    }
    
    const company = window.hkdData[taxCode];
    companyNameSpan.textContent = company.name;
    
    // Hiển thị section quản lý URLs công ty
    companySection.style.display = 'block';
    noCompanyMsg.style.display = 'none';
    
    // Load danh sách URLs của công ty
    const companyUrls = getProfileUrls(taxCode);
    const companyUrlsList = document.getElementById('company-urls-list');
    
    if (companyUrls.length === 0) {
        companyUrlsList.innerHTML = `
            <div style="color: #666; text-align: center; padding: 10px;">
                <p>📝 Chưa có URL riêng cho công ty này</p>
                <small>Công ty sẽ sử dụng URL toàn hệ thống</small>
            </div>
        `;
    } else {
        companyUrlsList.innerHTML = companyUrls.map(url => `
            <div class="url-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; margin-bottom: 5px; background: white; border-radius: 4px; border: 1px solid #e0e0e0;">
                <span style="flex: 1; font-size: 12px; word-break: break-all;">${url}</span>
                <div style="display: flex; gap: 5px;">
                    <button onclick="launchChromeProfile('${taxCode}', '${url}')" class="btn-small" style="padding: 4px 8px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">🚀 Mở</button>
                    <button onclick="removeCompanyUrl('${taxCode}', '${url}')" class="btn-small btn-danger" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">🗑️ Xóa</button>
                </div>
            </div>
        `).join('');
    }
}
*/
// Thêm URL cho công ty
function addCompanyUrl() {
    const companySelect = document.getElementById('company-urls-select');
    const urlInput = document.getElementById('new-company-url');
    const taxCode = companySelect.value;
    const url = urlInput.value.trim();
    
    if (!taxCode) {
        alert('❌ Vui lòng chọn công ty trước');
        return;
    }
    
    if (!url) {
        alert('❌ Vui lòng nhập URL');
        return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        alert('❌ URL phải bắt đầu với http:// hoặc https://');
        return;
    }
    
    const result = addProfileUrl(taxCode, url);
    
    if (result.success) {
        // Reload danh sách URLs
        loadCompanyUrls();
        urlInput.value = '';
        showToast('✅ Đã thêm URL cho công ty', 2000, 'success');
    } else {
        alert('❌ ' + result.message);
    }
}

function removeCompanyUrl(taxCode, url) {
    if (!confirm(`Bạn có chắc muốn xóa URL này khỏi công ty?`)) {
        return;
    }
    
    if (removeProfileUrl(taxCode, url)) {
        // THAY VÌ gọi loadCompanyUrls() (cho popup cũ)
        // HÃY reload lại popup "Chọn URL" hiện tại
        const currentModal = document.getElementById('custom-modal');
        if (currentModal && currentModal.querySelector('.url-selection-modal')) {
            // Nếu đang ở popup "Chọn URL", reload nó
            showUrlSelectionPopup(taxCode);
        }
        
        showToast('✅ Đã xóa URL khỏi công ty', 2000, 'success');
    }
}

// Lưu URLs của công ty
function saveCompanyUrls() {
    const companySelect = document.getElementById('company-urls-select');
    const taxCode = companySelect.value;
    
    if (!taxCode) {
        alert('❌ Vui lòng chọn công ty');
        return;
    }
    
    showToast('✅ Đã lưu URLs cho công ty', 2000, 'success');
}

// Reset URLs của công ty về dùng URL chung
function resetCompanyUrls() {
    const companySelect = document.getElementById('company-urls-select');
    const taxCode = companySelect.value;
    
    if (!taxCode) {
        alert('❌ Vui lòng chọn công ty');
        return;
    }
    
    if (!confirm(`Bạn có chắc muốn xóa tất cả URL riêng và dùng URL toàn hệ thống?`)) {
        return;
    }
    
    // Xóa tất cả URLs riêng
    saveProfileUrls(taxCode, []);
    loadCompanyUrls();
    
    showToast('✅ Đã reset URLs - Công ty sẽ dùng URL toàn hệ thống', 2000, 'success');
}
// Xem trước URL
function launchUrlPreview(url) {
    window.open(url, '_blank');
}

// Sửa hàm switchUrlTab cho 2 tab mới
function switchUrlTab(tabName) {
    // Ẩn tất cả tab content
    document.querySelectorAll('.url-tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Bỏ active tất cả tab buttons
    document.querySelectorAll('.url-manager-tabs .tab-btn').forEach(btn => {
        btn.style.background = '#f8f9fa';
        btn.style.color = '#000';
    });
    
    // Hiển thị tab được chọn
    const activeTab = document.getElementById(`${tabName}-tab`);
    if (activeTab) {
        activeTab.style.display = 'block';
    }
    
    // Active tab button
    const activeButton = document.querySelector(`.tab-btn[onclick="switchUrlTab('${tabName}')"]`);
    if (activeButton) {
        activeButton.style.background = '#007bff';
        activeButton.style.color = 'white';
    }
    
    // Reset khi chuyển tab
    if (tabName === 'company-urls') {
        document.getElementById('company-urls-section').style.display = 'none';
        document.getElementById('no-company-selected').style.display = 'block';
    }
}
function launchChromeProfile(taxCode, customUrl = '') {
    const company = window.hkdData[taxCode];
    if (!company) {
        alert('❌ Không tìm thấy thông tin công ty');
        return;
    }

    // Nếu có URL cụ thể được truyền vào, mở luôn
    if (customUrl) {
        openChromeWithUrl(taxCode, customUrl);
        return;
    }

    // LUÔN HIỂN THỊ POPUP CHỌN URL (không tự mở luôn)
    showUrlSelectionPopup(taxCode);
}


// Hàm mở Chrome với URL cụ thể
function openChromeWithUrl(taxCode, url) {
    const company = window.hkdData[taxCode];
    
    // Gọi protocol myacc://
    const protocolUrl = `myacc://mst=${taxCode};url=${encodeURIComponent(url)}`;
    
    console.log('🚀 Opening Chrome profile:', {
        taxCode: taxCode,
        company: company.name,
        url: url,
        protocol: protocolUrl
    });
    
    // Tạo link ảo để kích hoạt protocol
    try {
        const link = document.createElement('a');
        link.href = protocolUrl;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Thông báo thành công
        showToast(`🚀 Đang mở ${company.name}...`, 3000, 'success');
        
        console.log(`✅ Đã mở profile: ${company.name} (${taxCode}) với URL: ${url}`);
        
    } catch (error) {
        console.error('❌ Lỗi khi mở profile:', error);
        alert('❌ Không thể mở profile. Đảm bảo MyAcc Launcher đã được cài đặt.');
    }
}

// Hàm lấy danh sách URL có sẵn cho công ty
function getAvailableUrlsForCompany(taxCode) {
    const urls = [];
    
    // 1. Thêm URLs riêng của công ty (nếu có)
    const companyUrls = getProfileUrls(taxCode);
    if (companyUrls.length > 0) {
        urls.push(...companyUrls);
    }
    // 2. Thêm URLs toàn hệ thống (nếu công ty không có URL riêng)
    else {
        const globalUrls = getGlobalUrls();
        if (globalUrls.length > 0) {
            urls.push(...globalUrls);
        }
        // 3. Thêm URL mặc định toàn hệ thống
        else {
            urls.push(getGlobalDefaultUrl());
        }
    }
    
    return urls;
}
function showUrlSelectionPopup(taxCode, urls) {
    const company = window.hkdData[taxCode];
    const allUrls = getAvailableUrlsForCompany(taxCode);
    
    const modalContent = `
        <div class="url-selection-modal">
            
            
            
            <!-- PHẦN QUẢN LÝ URL RIÊNG -->
            <div style="margin-bottom: 20px; padding: 15px; background: #fff3cd; border-radius: 6px; border: 1px solid #ffeaa7;">
                <h5 style="margin: 0 0 10px 0; color: #856404;">🏢 Quản Lý URL Riêng Cho Công Ty</h5>
                
                <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                    <input type="url" id="new-company-url" placeholder="https://example.com" 
                           style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <button onclick="addCompanyUrl('${taxCode}')" class="btn-success" style="padding: 8px 12px;">➕ Thêm URL Riêng</button>
                    <button onclick="addVnptUrl('${taxCode}')" class="btn-primary" style="padding: 8px 12px; background: #e74c3c;">🔗 Thêm URL VNPT</button>
                </div>
                
                <div id="company-urls-management" style="max-height: 150px; overflow-y: auto;">
                    ${renderCompanyUrlsManagement(taxCode)}
                </div>
            </div>
            
            <!-- DANH SÁCH URL CÓ SẴN ĐỂ MỞ -->
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 10px; font-weight: bold;">📋 Chọn URL để mở:</label>
                <div id="url-selection-list" style="max-height: 250px; overflow-y: auto; border: 1px solid #ddd; border-radius: 6px;">
                    ${renderUrlSelectionList(allUrls, taxCode)}
                </div>
            </div>
            
           
            
            <div style="display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid #eee; padding-top: 15px;">
                <button onclick="closeModal()" class="btn-secondary" style="padding: 8px 16px;">❌ Đóng</button>
            </div>
        </div>
    `;
    
    showModal(`Chọn URL - ${company.name}`, modalContent);
}
function addVnptUrl(taxCode) {
    const company = window.hkdData[taxCode];
    
    // Tạo URL VNPT theo cú pháp: https://MST-tt78cadmin.vnpt-invoice.com.vn/
    const vnptUrl = `https://${taxCode}-tt78cadmin.vnpt-invoice.com.vn/`;
    
    // Thêm vào URLs riêng của công ty
    const result = addProfileUrl(taxCode, vnptUrl);
    
    if (result.success) {
        // Reload popup "Chọn URL" hiện tại
        const currentModal = document.getElementById('custom-modal');
        if (currentModal && currentModal.querySelector('.url-selection-modal')) {
            showUrlSelectionPopup(taxCode);
        }
        
        showToast('✅ Đã thêm URL VNPT tự động', 2000, 'success');
    } else {
        alert('❌ ' + result.message);
    }
}
function renderCompanyUrlsManagement(taxCode) {
    const companyUrls = getProfileUrls(taxCode);
    
    if (companyUrls.length === 0) {
        return `
            
        `;
    }
    
    return companyUrls.map(url => `
        <div class="company-url-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; margin-bottom: 5px; background: white; border-radius: 4px; border: 1px solid #e0e0e0;">
            <span style="flex: 1; font-size: 12px; word-break: break-all; color: #28a745;">${url}</span>
            <div style="display: flex; gap: 5px;">
                <button onclick="launchChromeProfile('${taxCode}', '${url}')" class="btn-small" style="padding: 4px 8px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">🚀 Mở</button>
                <button onclick="removeCompanyUrl('${taxCode}', '${url}')" class="btn-small btn-danger" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">🗑️ Xóa</button>
            </div>
        </div>
    `).join('');
}


// Render danh sách URL để lựa chọn
function renderUrlSelectionList(urls, taxCode) {
    if (urls.length === 0) {
        return `
            <div style="text-align: center; padding: 20px; color: #666;">
                <p>📝 Không có URL nào</p>
                <small>Vui lòng thêm URL trong mục Quản lý URL</small>
            </div>
        `;
    }
    
    return urls.map((url, index) => {
        // Xác định loại URL
        let urlType = '🌍 Chung';
        let typeColor = '#17a2b8';
        
        const companyUrls = getProfileUrls(taxCode);
        if (companyUrls.includes(url)) {
            urlType = '🏢 Riêng';
            typeColor = '#28a745';
        } else if (url === getGlobalDefaultUrl()) {
            urlType = '⭐ Mặc định';
            typeColor = '#ffc107';
        }
        
        return `
            <div class="url-selection-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; margin-bottom: 8px; background: white; border-radius: 6px; border: 1px solid #e0e0e0; cursor: pointer; transition: all 0.2s;"
                 onclick="openChromeWithUrl('${taxCode}', '${url}'); closeModal();">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span style="font-size: 12px; background: ${typeColor}; color: white; padding: 2px 6px; border-radius: 10px;">${urlType}</span>
                        <span style="font-size: 10px; color: #6c757d;">${index + 1}/${urls.length}</span>
                    </div>
                    <div style="font-size: 13px; color: #495057; word-break: break-all;">${url}</div>
                </div>
                <div style="margin-left: 10px;">
                    <button class="btn-success" style="padding: 6px 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; white-space: nowrap;">
                        🚀 Mở
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Mở URL tùy chỉnh
function launchCustomUrl(taxCode) {
    const urlInput = document.getElementById('custom-url-input');
    const url = urlInput.value.trim();
    
    if (!url) {
        alert('❌ Vui lòng nhập URL');
        return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        alert('❌ URL phải bắt đầu với http:// hoặc https://');
        return;
    }
    
    openChromeWithUrl(taxCode, url);
    closeModal();
}
// Thêm vào hàm addUrlManagerStyles()
function addUrlManagerStyles() {
    const styles = `
        <style>
        /* Nút mở profile trong sidebar */
        .company-profile-action {
            margin-top: 8px;
            text-align: center;
        }
        
        .btn-profile-launch {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 15px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.3s;
            width: 100%;
        }
        
        .btn-profile-launch:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        /* Quick URL items */
        .quick-url-item {
            transition: background-color 0.2s;
        }
        
        .quick-url-item:hover {
            background-color: #e3f2fd !important;
        }
        
        /* URL selection items */
        .url-selection-item:hover {
            background-color: #f8f9fa !important;
            border-color: #007bff !important;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .url-item {
            transition: background-color 0.2s;
        }
        
        .url-item:hover {
            background-color: #f8f9fa !important;
        }
        </style>
    `;
    
    // Chỉ thêm CSS nếu chưa tồn tại
    if (!document.getElementById('url-manager-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'url-manager-styles';
        styleElement.innerHTML = styles;
        document.head.appendChild(styleElement);
    }
}
function switchUrlTab(tabName) {
    // Ẩn tất cả tab content
    document.querySelectorAll('.url-tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Bỏ active tất cả tab buttons
    document.querySelectorAll('.url-manager-tabs .tab-btn').forEach(btn => {
        btn.style.background = '#f8f9fa';
        btn.style.color = '#000';
    });
    
    // Hiển thị tab được chọn
    const activeTab = document.getElementById(`${tabName}-tab`);
    if (activeTab) {
        activeTab.style.display = 'block';
    }
    
    // Active tab button
    const activeButton = document.querySelector(`.tab-btn[onclick="switchUrlTab('${tabName}')"]`);
    if (activeButton) {
        activeButton.style.background = '#007bff';
        activeButton.style.color = 'white';
    }
}
function updateQuickUrls() {
    const companySelect = document.getElementById('quick-company-select');
    const urlsList = document.getElementById('quick-urls-list');
    
    if (!companySelect || !urlsList) return;
    
    const taxCode = companySelect.value;
    
    if (!taxCode) {
        urlsList.innerHTML = '<em style="color: #666;">Chọn công ty để xem URLs</em>';
        return;
    }
    
    const company = window.hkdData[taxCode];
    const profileUrls = getProfileUrls(taxCode);
    
    if (profileUrls.length === 0) {
        urlsList.innerHTML = `
            <div style="color: #666; text-align: center; padding: 10px;">
                <p>📝 Chưa có URL nào được lưu</p>
                <small>Thêm URL trong tab "Quản Lý" hoặc dùng URL tùy chỉnh</small>
            </div>
        `;
        return;
    }
    
    // Hiển thị danh sách URLs
    urlsList.innerHTML = profileUrls.map((url, index) => `
        <div class="quick-url-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; margin-bottom: 5px; background: white; border-radius: 4px; border: 1px solid #e0e0e0;">
            <span style="flex: 1; font-size: 12px; word-break: break-all;">${url}</span>
            <button onclick="launchQuickUrl('${taxCode}', '${url}')" class="btn-small" style="padding: 4px 8px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px; margin-left: 8px;">🚀 Mở</button>
        </div>
    `).join('');
}
function launchQuickUrl(taxCode = '', customUrl = '') {
    let targetTaxCode = taxCode;
    let targetUrl = customUrl;
    
    // Nếu không có tham số, lấy từ form
    if (!targetTaxCode) {
        const companySelect = document.getElementById('quick-company-select');
        targetTaxCode = companySelect ? companySelect.value : '';
    }
    
    if (!targetUrl) {
        const customUrlInput = document.getElementById('custom-url');
        targetUrl = customUrlInput ? customUrlInput.value.trim() : '';
    }
    
    // Validate
    if (!targetTaxCode) {
        alert('❌ Vui lòng chọn công ty');
        return;
    }
    
    if (!targetUrl) {
        // Nếu không có URL tùy chỉnh, lấy URL đầu tiên từ profile
        const profileUrls = getProfileUrls(targetTaxCode);
        if (profileUrls.length > 0) {
            targetUrl = profileUrls[0];
        } else {
            alert('❌ Vui lòng nhập URL hoặc thêm URL vào profile trước');
            return;
        }
    }
    
    // Validate URL format
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        alert('❌ URL phải bắt đầu với http:// hoặc https://');
        return;
    }
    
    // Mở profile
    launchChromeProfile(targetTaxCode, targetUrl);
}
// Lưu URLs cho từng profile
function saveProfileUrls(taxCode, urls) {
    ensureCompanyData(taxCode);
    window.hkdData[taxCode].profileUrls = urls;
    saveData();
}

// Lấy URLs của profile
function getProfileUrls(taxCode) {
    return window.hkdData[taxCode]?.profileUrls || [];
}

// Thêm URL mới vào profile
function addProfileUrl(taxCode, url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return { success: false, message: 'URL phải bắt đầu với http:// hoặc https://' };
    }
    
    const urls = getProfileUrls(taxCode);
    if (!urls.includes(url)) {
        urls.push(url);
        saveProfileUrls(taxCode, urls);
        return { success: true, message: 'Đã thêm URL vào profile' };
    }
    return { success: false, message: 'URL đã tồn tại trong profile' };
}

// Xóa URL khỏi profile
function removeProfileUrl(taxCode, url) {
    const urls = getProfileUrls(taxCode);
    const index = urls.indexOf(url);
    if (index !== -1) {
        urls.splice(index, 1);
        saveProfileUrls(taxCode, urls);
        return true;
    }
    return false;
}

// Mở trình quản lý nâng cao
function openAdvancedUrlManager() {
    // Mở file HTML quản lý URLs (nếu có)
    window.open('openURL.html', '_blank');
    
    // Hoặc có thể đóng modal hiện tại
    closeModal();
}
// Hàm lấy tất cả tags của công ty
function getAllCompanyTags(company) {
    const tags = new Set();
    
    // Thêm savedTags
    if (company.savedTags) {
        company.savedTags.forEach(tag => tags.add(tag));
    }
    
    // Thêm tags từ notes
    if (company.notes) {
        company.notes.forEach(note => {
            if (note.tags) {
                note.tags.forEach(tag => tags.add(tag));
            }
        });
    }
    
    // Thêm tags từ reminders
    if (company.reminders) {
        company.reminders.forEach(reminder => {
            if (reminder.tags) {
                reminder.tags.forEach(tag => tags.add(tag));
            }
        });
    }
    
    return Array.from(tags);
}
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
        ensureCompanyData(taxCode);
        const company = window.hkdData[taxCode];
        const companyItem = document.createElement('div');
        companyItem.className = 'company-item';
        
        // THÊM DATA ATTRIBUTES ĐỂ LỌC (không ảnh hưởng hiển thị)
        companyItem.setAttribute('data-taxcode', taxCode);
        companyItem.setAttribute('data-name', (company.name || '').toLowerCase());
        
        const allTags = getAllCompanyTags(company);
        if (allTags.length > 0) {
            companyItem.setAttribute('data-tags', allTags.join(','));
        }
        
        const notesCount = company.notes?.length || 0;
        companyItem.setAttribute('data-notes-count', notesCount);
        
        const hasPendingNotes = company.notes?.some(note => note.status !== 'completed') || false;
        companyItem.setAttribute('data-has-pending-notes', hasPendingNotes);
        
        const allCompleted = notesCount > 0 && company.notes?.every(note => note.status === 'completed');
        companyItem.setAttribute('data-all-completed', allCompleted);
        
        // Kiểm tra cảnh báo
        const alertInfo = checkUrgentReminders(company.reminders || []);
        const hasNotes = company.notes && company.notes.length > 0;
        const pendingNotes = company.notes ? company.notes.filter(n => n.status !== 'completed').length : 0;
        
        // Thêm class active nếu là công ty đang chọn
        if (taxCode === window.currentCompany) {
            companyItem.classList.add('active');
        }
        
        // Thêm viền cảnh báo nếu có reminder khẩn cấp
        if (alertInfo.hasAlert && alertInfo.level === 'urgent') {
            companyItem.style.border = '2px solid #ff6b6b';
            companyItem.style.boxShadow = '0 0 10px rgba(255, 107, 107, 0.3)';
        }

        const totalStock = Array.isArray(company.tonkhoMain) 
            ? company.tonkhoMain.reduce((sum, p) => sum + (p.quantity || 0), 0)
            : 0;

        const noteCount = company.notes?.length || 0;
        const tags = company.tags || [];

        // Lấy ghi chú mới nhất để hiển thị tooltip
        const latestNote = company.notes && company.notes.length > 0 
            ? company.notes[company.notes.length - 1] 
            : null;

        // Lấy số URL có sẵn (kiểm tra hàm tồn tại trước)
        const urlCount = typeof getAvailableUrlsForCompany === 'function' ? 
            getAvailableUrlsForCompany(taxCode).length : 0;

        // Tạo HTML với NÚT MỞ PROFILE
        companyItem.innerHTML = `
           <div class="company-header">
    <div class="company-name">${company.name || 'Chưa có tên'}</div>
    <div class="company-actions">
        ${hasNotes ? `
            <span class="note-indicator" onclick="event.stopPropagation(); showNotesQuickView('${taxCode}')" 
                  title="${noteCount} ghi chú - ${pendingNotes} chưa hoàn thành">
                ${pendingNotes > 0 ? '📝🔴' : '📝'}
                ${noteCount > 1 ? noteCount : ''}
            </span>
        ` : `
            <span class="note-indicator" onclick="event.stopPropagation(); showQuickNoteModal('${taxCode}')" 
                  title="Thêm ghi chú">
                📝
            </span>
        `}
        ${alertInfo.hasAlert ? `
            <span class="alert-indicator" onclick="event.stopPropagation(); showAlertsModal('${taxCode}')"
                  title="${alertInfo.level === 'urgent' ? 'Cảnh báo khẩn cấp' : 'Có nhắc nhở'}">
                ${alertInfo.level === 'urgent' ? '🔴' : '🟡'}
            </span>
        ` : ''}
        <!-- NÚT PROFILE LAUNCH - NẰM RIÊNG NGOÀI NOTE INDICATOR -->
        <button class="btn-profile-launch" onclick="event.stopPropagation(); launchChromeProfile('${taxCode}')" 
                title="${urlCount} URL có sẵn - Click để chọn">
            🚀 (${urlCount})
        </button>
    </div>
</div>
            
            <div class="company-mst">
                <span>MST: ${taxCode}</span>
                ${alertInfo.hasAlert ? `
                    <span class="alert-indicator" onclick="event.stopPropagation(); showAlertsModal('${taxCode}')"
                          title="${alertInfo.level === 'urgent' ? 'Cảnh báo khẩn cấp' : 'Có nhắc nhở'}">
                        ${alertInfo.level === 'urgent' ? '🔴' : '🟡'}
                    </span>
                ` : ''}
            </div>
            
            <div class="company-info">
                <small>🧾 HĐ: ${company.invoices?.length || 0} | 📦 Tồn kho: ${totalStock.toLocaleString('vi-VN')} SP</small>
            </div>
            
            
            
            <!-- Tooltip hiển thị khi hover -->
            ${latestNote ? `
            <div class="company-tooltip">
                <strong>📝 Ghi chú mới nhất:</strong><br>
                ${latestNote.content.length > 50 ? latestNote.content.substring(0, 50) + '...' : latestNote.content}
                ${latestNote.tags && latestNote.tags.length > 0 ? `<br>🏷️ ${latestNote.tags.map(tag => `#${tag}`).join(' ')}` : ''}
                <br><small>Trạng thái: ${latestNote.status === 'completed' ? '✅ Đã hoàn thành' : '⏳ Chưa hoàn thành'}</small>
            </div>
            ` : ''}
        `;

        // Event listener cho click công ty
        companyItem.addEventListener('click', (e) => {
            if (e.target.closest('.note-indicator') || 
                e.target.closest('.alert-indicator') ||
                e.target.closest('.btn-profile-launch')) {
                e.stopPropagation();
                return;
            }
            
            console.log('🏢 Selecting company:', taxCode);
            selectCompany(taxCode);
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });

        companyList.appendChild(companyItem);
    });
    
    // Áp dụng bộ lọc nếu có
    applyCompanyFilters();
}


function addSavedTag(taxCode) {
    const input = document.getElementById('new-saved-tag');
    const tag = input.value.trim();
    
    if (!tag) {
        alert('Vui lòng nhập tên thẻ');
        return;
    }
    
    ensureCompanyData(taxCode);
    const company = window.hkdData[taxCode];
    
    if (!company.savedTags.includes(tag)) {
        company.savedTags.push(tag);
        saveData();
        
        // Clear input
        input.value = '';
        
        // Refresh tag list
        const tagsList = document.getElementById('saved-tags-list');
        if (tagsList) {
            tagsList.innerHTML = company.savedTags.map(t => `
                <span class="saved-tag-item" style="background: #e3f2fd; padding: 5px 10px; border-radius: 15px; display: flex; align-items: center; gap: 5px;">
                    #${t}
                    <button onclick="removeSavedTag('${taxCode}', '${t}')" class="btn-small" style="padding: 2px 5px; font-size: 10px;">×</button>
                </span>
            `).join('');
        }
    }
}

/**
 * Xóa thẻ đã lưu
 */
function removeSavedTag(taxCode, tag) {
    ensureCompanyData(taxCode);
    const company = window.hkdData[taxCode];
    
    company.savedTags = company.savedTags.filter(t => t !== tag);
    company.tags = company.tags.filter(t => t !== tag);
    
    saveData();
    showTagManagerModal(taxCode);
}

/**
 * Thêm thẻ cho công ty
 */
function addCompanyTag(taxCode, tag) {
    ensureCompanyData(taxCode);
    const company = window.hkdData[taxCode];
    
    if (!company.tags.includes(tag)) {
        company.tags.push(tag);
        saveData();
        
        // Refresh current tags list
        const currentTagsList = document.getElementById('current-tags-list');
        if (currentTagsList) {
            currentTagsList.innerHTML = company.tags.map(t => `
                <span class="current-tag" style="background: #4caf50; color: white; padding: 5px 10px; border-radius: 15px;">
                    #${t}
                    <button onclick="removeCompanyTag('${taxCode}', '${t}')" style="background: none; border: none; color: white; margin-left: 5px; cursor: pointer;">×</button>
                </span>
            `).join('');
        }
    }
}
function addCompanyUrl(taxCode) {
    const urlInput = document.getElementById('new-company-url');
    const url = urlInput ? urlInput.value.trim() : '';
    
    if (!url) {
        alert('❌ Vui lòng nhập URL');
        return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        alert('❌ URL phải bắt đầu với http:// hoặc https://');
        return;
    }
    
    const result = addProfileUrl(taxCode, url);
    
    if (result.success) {
        // Reload popup "Chọn URL" hiện tại
        const currentModal = document.getElementById('custom-modal');
        if (currentModal && currentModal.querySelector('.url-selection-modal')) {
            showUrlSelectionPopup(taxCode);
        }
        
        // Clear input nếu nó tồn tại
        if (urlInput) {
            urlInput.value = '';
        }
        
        showToast('✅ Đã thêm URL cho công ty', 2000, 'success');
    } else {
        alert('❌ ' + result.message);
    }
}
/**
 * Xóa thẻ khỏi công ty
 */
function removeCompanyTag(taxCode, tag) {
    ensureCompanyData(taxCode);
    const company = window.hkdData[taxCode];
    
    company.tags = company.tags.filter(t => t !== tag);
    saveData();
    showTagManagerModal(taxCode);
}

// =======================
// HỆ THỐNG QUẢN LÝ GHÍ CHÚ
// =======================

/**
 * Lưu ghi chú mới
 */
function saveNewNote(taxCode) {
    const contentInput = document.getElementById('new-note-content');
    const addReminderCheckbox = document.getElementById('add-reminder');
    const content = contentInput.value.trim();
    
    if (!content) {
        alert('Vui lòng nhập nội dung ghi chú');
        return;
    }
    
    ensureCompanyData(taxCode);
    const company = window.hkdData[taxCode];
    
    // Lấy các tag được chọn
    const selectedTags = Array.from(document.querySelectorAll('#tag-selector input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);
    
    // Tạo note mới
    const newNote = {
        id: 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        content: content,
        tags: selectedTags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Thêm nhắc nhở nếu được chọn
    if (addReminderCheckbox.checked) {
        const reminderDate = document.getElementById('reminder-date').value;
        const reminderTime = document.getElementById('reminder-time').value;
        const reminderPriority = document.getElementById('reminder-priority').value;
        
        if (reminderDate) {
            const reminderId = 'reminder_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const newReminder = {
                id: reminderId,
                title: `Nhắc: ${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`,
                description: content,
                dueDate: reminderDate,
                dueTime: reminderTime || '09:00',
                priority: reminderPriority,
                status: 'pending',
                tags: selectedTags,
                noteId: newNote.id,
                createdAt: new Date().toISOString()
            };
            
            company.reminders.push(newReminder);
            newNote.reminderId = reminderId;
        }
    }
    
    company.notes.push(newNote);
    saveData();
    
    // Clear form
    contentInput.value = '';
    document.getElementById('add-reminder').checked = false;
    document.getElementById('reminder-fields').style.display = 'none';
    
    // Refresh notes list
    const notesContainer = document.getElementById('notes-list-container');
    if (notesContainer) {
        notesContainer.innerHTML = renderNotesList(company.notes, taxCode);
    }
    
    // Refresh company list để hiển thị tooltip mới
    renderCompanyList();
    
    showToast('✅ Đã thêm ghi chú thành công!', 2000, 'success');
}
// =======================
// CÁC HÀM HỖ TRỢ BỊ THIẾU
// =======================

/**
 * Đếm reminder theo mức độ ưu tiên
 */
function countRemindersByPriority(reminders) {
    if (!reminders || reminders.length === 0) {
        return { urgent: 0, warning: 0, normal: 0, total: 0 };
    }
    
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const stats = {
        urgent: 0,
        warning: 0,
        normal: 0,
        total: 0
    };
    
    reminders.forEach(reminder => {
        if (reminder.status !== 'pending') return;
        
        stats.total++;
        const dueDateTime = new Date(`${reminder.dueDate}T${reminder.dueTime}`);
        
        if (dueDateTime <= now || dueDateTime <= oneHourFromNow) {
            stats.urgent++;
        } else if (dueDateTime <= oneDayFromNow) {
            stats.warning++;
        } else {
            stats.normal++;
        }
    });
    
    return stats;
}

/**
 * Kiểm tra có nhắc nhở sắp đến hạn không
 */
function checkUrgentReminders(reminders) {
    if (!reminders || reminders.length === 0) {
        return { hasAlert: false, level: 'none' };
    }
    
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    let hasUrgent = false;
    let hasWarning = false;
    let hasNormal = false;
    
    reminders.forEach(reminder => {
        if (reminder.status !== 'pending') return;
        
        const dueDateTime = new Date(`${reminder.dueDate}T${reminder.dueTime}`);
        
        if (dueDateTime <= now) {
            hasUrgent = true; // QUÁ HẠN
        } else if (dueDateTime <= oneHourFromNow) {
            hasUrgent = true; // SẮP ĐẾN HẠN TRONG 1H
        } else if (dueDateTime <= oneDayFromNow) {
            hasWarning = true; // SẮP ĐẾN HẠN TRONG 1 NGÀY
        } else {
            hasNormal = true;
        }
    });
    
    if (hasUrgent) return { hasAlert: true, level: 'urgent' };
    if (hasWarning) return { hasAlert: true, level: 'warning' };
    if (hasNormal) return { hasAlert: true, level: 'normal' };
    
    return { hasAlert: false, level: 'none' };
}

/**
 * Kiểm tra ghi chú mới/quan trọng
 */
function checkNewNotes(notes) {
    if (!notes || notes.length === 0) return false;
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return notes.some(note => {
        const noteDate = new Date(note.createdAt);
        // Ghi chú mới trong 24h hoặc có tag urgent
        return noteDate >= oneDayAgo || 
               (note.tags && note.tags.includes('urgent'));
    });
}

/**
 * Đảm bảo company data có đầy đủ structure
 */
function ensureCompanyData(taxCode) {
    if (!window.hkdData[taxCode]) {
        window.hkdData[taxCode] = {
            name: taxCode,
            invoices: [],
            tonkhoMain: [],
            exports: []
        };
    }
    
    // Đảm bảo có notes, reminders, tags
    if (!window.hkdData[taxCode].notes) window.hkdData[taxCode].notes = [];
    if (!window.hkdData[taxCode].reminders) window.hkdData[taxCode].reminders = [];
    if (!window.hkdData[taxCode].tags) window.hkdData[taxCode].tags = [];
    if (!window.hkdData[taxCode].savedTags) window.hkdData[taxCode].savedTags = [];
}

/**
 * Format ngày tháng
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

// =======================
// MODAL FUNCTIONS
// =======================

/**
 * Hiển thị modal quản lý ghi chú
 */
function showNoteManagerModal(taxCode) {
    const company = window.hkdData[taxCode];
    
    const modalContent = `
        <div class="note-manager-modal">
            <h4 style="margin-bottom: 15px; color: #1976d3;">📝 Quản lý ghi chú - ${company.name}</h4>
            
            <!-- FORM THÊM GHÍ CHÚ -->
            <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <h5 style="margin-bottom: 10px;">➕ Thêm ghi chú mới</h5>
                
                <div class="form-group" style="margin-bottom: 10px;">
                    <textarea id="new-note-content" placeholder="Nhập nội dung ghi chú..." 
                              rows="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
                </div>
                
                <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 200px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">🏷️ Thẻ:</label>
                        <select id="note-tags" multiple style="width: 100%; height: 80px; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
                            ${(company.savedTags || []).map(tag => 
                                `<option value="${tag}">#${tag}</option>`
                            ).join('')}
                        </select>
                        <small style="color: #666;">Giữ Ctrl để chọn nhiều thẻ</small>
                    </div>
                    
                    <div style="flex: 1; min-width: 200px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">⏰ Nhắc nhở:</label>
                        <div style="display: flex; gap: 8px; margin-bottom: 5px;">
                            <input type="date" id="reminder-date" style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                            <input type="time" id="reminder-time" value="09:00" style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <small style="color: #666;">Để trống nếu không cần nhắc</small>
                    </div>
                </div>
                
                <div style="text-align: right; margin-top: 15px;">
                    <button onclick="saveCompactNote('${taxCode}')" class="btn-success">💾 Lưu ghi chú</button>
                </div>
            </div>
            
            <!-- DANH SÁCH GHÍ CHÚ -->
            <div style="max-height: 300px; overflow-y: auto;">
                <h5 style="margin-bottom: 10px;">📋 Ghi chú hiện có (${company.notes?.length || 0})</h5>
                ${renderCompactNotesList(company.notes || [], taxCode)}
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
                <button onclick="closeModal()" class="btn-secondary">❌ Đóng</button>
            </div>
        </div>
    `;
    
    showModal('Quản Lý Ghi Chú', modalContent);
}

/**
 * Render danh sách ghi chú compact
 */
function renderCompactNotesList(notes, taxCode) {
    if (notes.length === 0) {
        return '<p style="text-align: center; color: #666; padding: 20px;">Chưa có ghi chú nào</p>';
    }
    
    return notes.map(note => `
        <div class="note-item-compact" style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 10px; margin: 8px 0; background: white;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="flex: 1;">
                    <div style="margin-bottom: 5px; line-height: 1.4;">${note.content}</div>
                    ${note.tags && note.tags.length > 0 ? `
                        <div style="margin-bottom: 5px;">
                            ${note.tags.map(tag => `<span style="background: #e3f2fd; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-right: 4px; display: inline-block; margin-bottom: 2px;">#${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div style="font-size: 11px; color: #666;">
                        🕒 ${formatDate(note.createdAt)}
                        ${note.reminderId ? ' | ⏰ Có nhắc nhở' : ''}
                    </div>
                </div>
                <div style="display: flex; gap: 5px; margin-left: 10px;">
                    <button onclick="editNote('${taxCode}', '${note.id}')" class="btn-small" title="Sửa" style="background: #ffc107; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 10px;">✏️</button>
                    <button onclick="deleteNote('${taxCode}', '${note.id}')" class="btn-small btn-danger" title="Xóa" style="background: #f44336; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 10px;">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Lưu ghi chú mới
 */
function saveCompactNote(taxCode) {
    const content = document.getElementById('new-note-content').value.trim();
    if (!content) {
        alert('Vui lòng nhập nội dung ghi chú');
        return;
    }
    
    ensureCompanyData(taxCode);
    const company = window.hkdData[taxCode];
    
    // Lấy tags được chọn
    const tagSelect = document.getElementById('note-tags');
    const selectedTags = Array.from(tagSelect.selectedOptions).map(opt => opt.value);
    
    // Tạo note
    const newNote = {
        id: 'note_' + Date.now(),
        content: content,
        tags: selectedTags,
        createdAt: new Date().toISOString()
    };
    
    // Thêm reminder nếu có
    const reminderDate = document.getElementById('reminder-date').value;
    const reminderTime = document.getElementById('reminder-time').value;
    
    if (reminderDate) {
        const reminderId = 'reminder_' + Date.now();
        const newReminder = {
            id: reminderId,
            title: `Nhắc: ${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`,
            description: content,
            dueDate: reminderDate,
            dueTime: reminderTime,
            priority: 'medium',
            status: 'pending',
            tags: selectedTags,
            noteId: newNote.id,
            createdAt: new Date().toISOString()
        };
        
        company.reminders.push(newReminder);
        newNote.reminderId = reminderId;
    }
    
    company.notes.push(newNote);
    saveData();
    
    // Đóng modal và refresh
    closeModal();
    renderCompanyList();
    showToast('✅ Đã thêm ghi chú thành công!', 2000, 'success');
}

/**
 * Xem nhanh ghi chú
 */
function showNotesQuickView(taxCode) {
    const company = window.hkdData[taxCode];
    const notes = company.notes || [];
    
    const modalContent = `
        <div class="notes-quickview">
            <h4 style="margin-bottom: 15px;">📝 Ghi chú - ${company.name}</h4>
            
            <div style="max-height: 400px; overflow-y: auto;">
                ${notes.map(note => `
                    <div class="note-item-compact" style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 10px; margin: 8px 0; background: #fafafa;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="flex: 1;">
                                <div style="margin-bottom: 5px;">${note.content}</div>
                                ${note.tags && note.tags.length > 0 ? `
                                    <div style="margin-bottom: 5px;">
                                        ${note.tags.map(tag => `<span style="background: #e3f2fd; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-right: 4px;">#${tag}</span>`).join('')}
                                    </div>
                                ` : ''}
                                <div style="font-size: 11px; color: #666;">
                                    🕒 ${formatDate(note.createdAt)}
                                    ${note.reminderId ? ' | ⏰ Có nhắc nhở' : ''}
                                </div>
                            </div>
                            <div style="display: flex; gap: 5px;">
                                <button onclick="editNote('${taxCode}', '${note.id}')" class="btn-small" title="Sửa" style="background: #ffc107; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 10px;">✏️</button>
                                <button onclick="deleteNote('${taxCode}', '${note.id}')" class="btn-small btn-danger" title="Xóa" style="background: #f44336; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 10px;">🗑️</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
                
                ${notes.length === 0 ? '<p style="text-align: center; color: #666; padding: 20px;">Chưa có ghi chú nào</p>' : ''}
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px;">
                <button onclick="closeModal()" class="btn-secondary">Đóng</button>
                <button onclick="showNoteManagerModal('${taxCode}')" class="btn-success">➕ Thêm ghi chú</button>
            </div>
        </div>
    `;
    
    showModal('Xem Nhanh Ghi Chú', modalContent);
}



/**
 * Hiển thị modal quản lý thẻ
 */
function showTagManagerModal(taxCode) {
    const company = window.hkdData[taxCode];
    const savedTags = company.savedTags || [];
    
    const modalContent = `
        <div class="tag-manager-modal">
            <h4 style="margin-bottom: 15px;">🏷️ Quản lý thẻ - ${company.name}</h4>
            
            <!-- THÊM THẺ MỚI -->
            <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <h5 style="margin-bottom: 10px;">➕ Thêm thẻ mới</h5>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="text" id="new-saved-tag" placeholder="Tên thẻ mới..." style="padding: 8px; flex: 1; border: 1px solid #ddd; border-radius: 4px;">
                    <button onclick="addSavedTag('${taxCode}')" class="btn-success">Thêm thẻ</button>
                </div>
            </div>
            
            <!-- THẺ ĐÃ LƯU -->
            <div style="margin-bottom: 20px;">
                <h5 style="margin-bottom: 10px;">📚 Thẻ đã lưu (${savedTags.length})</h5>
                <div id="saved-tags-list" style="display: flex; flex-wrap: wrap; gap: 5px; margin: 10px 0; min-height: 40px;">
                    ${savedTags.map(tag => `
                        <span class="saved-tag-item" style="background: #e3f2fd; padding: 5px 10px; border-radius: 15px; display: flex; align-items: center; gap: 5px;">
                            #${tag}
                            <button onclick="removeSavedTag('${taxCode}', '${tag}')" style="background: none; border: none; cursor: pointer; font-size: 12px; color: #666;">×</button>
                        </span>
                    `).join('')}
                    ${savedTags.length === 0 ? '<p style="color: #666; text-align: center; width: 100%;">Chưa có thẻ nào được lưu</p>' : ''}
                </div>
            </div>
            
            <div style="text-align: right;">
                <button onclick="closeModal()" class="btn-primary">✅ Xong</button>
            </div>
        </div>
    `;
    
    showModal('Quản Lý Thẻ', modalContent);
}

// Thêm các hàm này vào cuối file app.js
/**
 * Sửa ghi chú
 */
function editNote(taxCode, noteId) {
    ensureCompanyData(taxCode);
    const company = window.hkdData[taxCode];
    const note = company.notes.find(n => n.id === noteId);
    
    if (!note) return;
    
    const newContent = prompt('Sửa nội dung ghi chú:', note.content);
    if (newContent !== null && newContent.trim() !== '') {
        note.content = newContent.trim();
        note.updatedAt = new Date().toISOString();
        saveData();
        
        // Refresh notes list
        const notesContainer = document.getElementById('notes-list-container');
        if (notesContainer) {
            notesContainer.innerHTML = renderNotesList(company.notes, taxCode);
        }
        
        renderCompanyList();
        showToast('✅ Đã cập nhật ghi chú!', 2000, 'success');
    }
}

/**
 * Xóa ghi chú
 */
function deleteNote(taxCode, noteId) {
    if (!confirm('Bạn có chắc muốn xóa ghi chú này?')) return;
    
    ensureCompanyData(taxCode);
    const company = window.hkdData[taxCode];
    
    // Xóa note
    company.notes = company.notes.filter(n => n.id !== noteId);
    
    // Xóa reminder liên quan nếu có
    if (company.reminders) {
        company.reminders = company.reminders.filter(r => r.noteId !== noteId);
    }
    
    saveData();
    
    // Refresh UI
    const notesContainer = document.getElementById('notes-list-container');
    if (notesContainer) {
        notesContainer.innerHTML = company.notes.length > 0 
            ? renderNotesList(company.notes, taxCode) 
            : '<p style="text-align: center; color: #666;">Chưa có ghi chú nào</p>';
    }
    
    renderCompanyList();
    showToast('✅ Đã xóa ghi chú!', 2000, 'success');
}

// =======================
// TOAST NOTIFICATION
// =======================

function showToast(message, duration = 3000, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    toast.innerHTML = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, duration);
}

function showSmartNotification(reminder, companyName, taxCode) {
    const notificationId = 'smart-notification-' + Date.now();
    const note = reminder.noteId ? 
        window.hkdData[taxCode].notes.find(n => n.id === reminder.noteId) : null;
    
    const notificationHTML = `
        <div id="${notificationId}" class="smart-notification" style="
            position: fixed; top: 20px; right: 20px; 
            background: white; border: 2px solid #ff6b6b; 
            border-radius: 10px; padding: 20px; max-width: 400px; 
            z-index: 10000; box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease;
        ">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px; color: #ff6b6b;">⏰</span>
                    <div>
                        <strong style="color: #d63031; font-size: 16px;">NHẮC NHỞ CẦN XỬ LÝ</strong>
                        <div style="font-size: 12px; color: #666;">${companyName}</div>
                    </div>
                </div>
                <button onclick="closeNotification('${notificationId}')" 
                        style="background: none; border: none; font-size: 20px; cursor: pointer; color: #999; padding: 0;">×</button>
            </div>
            
            <div style="margin-bottom: 15px;">
                <div style="font-weight: bold; margin-bottom: 8px; font-size: 15px;">${reminder.title}</div>
                ${note ? `<div style="background: #f8f9fa; padding: 10px; border-radius: 6px; margin: 10px 0; font-size: 14px; border-left: 3px solid #74b9ff;">
                    <strong>📝 Ghi chú:</strong> ${note.content}
                </div>` : ''}
                <div style="font-size: 13px; color: #e17055;">
                    ⏳ Hạn: ${formatDate(reminder.dueDate)} ${reminder.dueTime}
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid #eee; padding-top: 15px;">
                <button onclick="markReminderAsPending('${taxCode}', '${reminder.id}'); closeNotification('${notificationId}')" 
                        style="background: #fd9644; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 5px;">
                    ⏳ Chưa xử lý
                </button>
                <button onclick="markReminderCompleted('${taxCode}', '${reminder.id}'); closeNotification('${notificationId}')" 
                        style="background: #2ecc71; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 5px;">
                    ✅ Đã xử lý
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', notificationHTML);
    
    // Phát âm thanh
    playPipSound();
    
    // Tự động đóng sau 30 giây
    setTimeout(() => closeNotification(notificationId), 30000);
}

function markReminderAsPending(taxCode, reminderId) {
    ensureCompanyData(taxCode);
    const company = window.hkdData[taxCode];
    const reminder = company.reminders.find(r => r.id === reminderId);
    
    if (reminder) {
        // Hoãn thêm 1 ngày
        const newDueTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
        reminder.dueDate = newDueTime.toISOString().split('T')[0];
        reminder.dueTime = newDueTime.toTimeString().split(' ')[0].substring(0, 5);
        reminder.status = 'pending';
        saveData();
        
        showToast('⏳ Đã đánh dấu "Chưa xử lý" và hoãn 1 ngày!', 2000, 'info');
    }
}

function playPipSound() {
    if (!isSoundEnabled) return;
    
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Âm thanh "pip pip" nhẹ nhàng
        for (let i = 0; i < 2; i++) {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.1);
            }, i * 200);
        }
    } catch (error) {
        console.log('Không thể phát âm thanh');
    }
}
function closeNotification(notificationId) {
    const notif = document.getElementById(notificationId);
    if (notif) {
        notif.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notif.remove(), 300);
    }
}


function renderNotesList(notes, taxCode) {
    return notes.map(note => `
        <div class="note-item" data-note-id="${note.id}" style="border: 1px solid #e0e0e0; border-radius: 5px; padding: 10px; margin: 10px 0; background: white;">
            <div style="display: flex; justify-content: between; align-items: start;">
                <div style="flex: 1;">
                    <div style="font-weight: bold; margin-bottom: 5px;">${note.content}</div>
                    ${note.tags && note.tags.length > 0 ? `
                        <div style="margin-bottom: 5px;">
                            ${note.tags.map(tag => `<span class="tag-badge">#${tag}</span>`).join(' ')}
                        </div>
                    ` : ''}
                    <div style="font-size: 11px; color: #666;">
                        🕒 ${formatDate(note.createdAt)}
                        ${note.reminderId ? ' | ⏰ Có nhắc nhở' : ''}
                    </div>
                </div>
                <div class="note-actions" style="display: flex; gap: 5px;">
                    <button onclick="editNote('${taxCode}', '${note.id}')" class="btn-small" title="Sửa">✏️</button>
                    <button onclick="deleteNote('${taxCode}', '${note.id}')" class="btn-small btn-danger" title="Xóa">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
}

// KIỂM TRA NHẮC NHỞ MỖI PHÚT
function startReminderChecker() {
    setInterval(() => {
        checkAllReminders();
    }, 60000); // Mỗi phút kiểm tra 1 lần
    
    // Kiểm tra ngay khi khởi động
    checkAllReminders();
}



/**
 * Kiểm tra và hiển thị cảnh báo
 */
function checkAllReminders() {
    let hasUrgentAlert = false;
    let hasWarningAlert = false;
    
    Object.keys(window.hkdData).forEach(taxCode => {
        const company = window.hkdData[taxCode];
        const reminders = company.reminders || [];
        
        reminders.forEach(reminder => {
            if (reminder.status === 'pending' && isReminderDue(reminder)) {
                const alertLevel = getReminderAlertLevel(reminder);
                
                
                showReminderNotification(reminder, company.name, taxCode);
                reminder.status = 'notified';
                saveData();
            }
        });
    });
    
    // Refresh UI để hiển thị cảnh báo
    renderCompanyList();
}

/**
 * Xác định mức độ cảnh báo
 */
function getReminderAlertLevel(reminder) {
    const now = new Date();
    const dueDateTime = new Date(`${reminder.dueDate}T${reminder.dueTime}`);
    const timeDiff = dueDateTime - now;
    
    if (timeDiff <= 0) return 'urgent'; // Quá hạn
    if (timeDiff <= 60 * 60 * 1000) return 'urgent'; // Trong 1 giờ
    if (timeDiff <= 24 * 60 * 60 * 1000) return 'warning'; // Trong 1 ngày
    
    return 'normal';
}

/**
 * Hiển thị thông báo cảnh báo nâng cao
 */
function showReminderNotification(reminder, companyName, taxCode) {
    const alertLevel = getReminderAlertLevel(reminder);
    const notificationId = 'reminder-' + reminder.id;
    
    // Kiểm tra xem đã có thông báo chưa
    if (document.getElementById(notificationId)) return;
    
    const notificationHTML = `
        <div id="${notificationId}" class="reminder-notification" 
             style="position: fixed; top: 20px; right: 20px; background: ${alertLevel === 'urgent' ? '#ffebee' : alertLevel === 'warning' ? '#fff3cd' : '#e3f2fd'}; 
                    border: 2px solid ${alertLevel === 'urgent' ? '#f44336' : alertLevel === 'warning' ? '#ffc107' : '#2196f3'}; 
                    border-radius: 8px; padding: 15px; max-width: 350px; z-index: 10000; 
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3); animation: slideIn 0.3s ease;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div style="display: flex; align-items: center;">
                    <span style="font-size: 20px; margin-right: 8px;">
                        ${alertLevel === 'urgent' ? '🔴' : alertLevel === 'warning' ? '🟡' : '🔵'}
                    </span>
                    <strong style="color: ${alertLevel === 'urgent' ? '#d32f2f' : alertLevel === 'warning' ? '#856404' : '#1976d2'};">
                        ${alertLevel === 'urgent' ? 'CẢNH BÁO KHẨN CẤP' : alertLevel === 'warning' ? 'NHẮC NHỞ' : 'THÔNG BÁO'}
                    </strong>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button onclick="markReminderCompleted('${taxCode}', '${reminder.id}')" 
                            style="background: #4caf50; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        ✅ Hoàn thành
                    </button>
                    <button onclick="snoozeReminder('${taxCode}', '${reminder.id}')" 
                            style="background: #ff9800; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        ⏰ Hoãn 1h
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            style="background: none; border: none; font-size: 16px; cursor: pointer; color: #666;">×</button>
                </div>
            </div>
            <div style="margin-bottom: 8px;">
                <strong>${reminder.title}</strong><br>
                ${companyName ? `🏢 ${companyName}<br>` : ''}
                ${reminder.description || ''}
            </div>
            <div style="font-size: 12px; color: #666;">
                ⏳ Hạn: ${formatDate(reminder.dueDate)} ${reminder.dueTime}
                ${alertLevel === 'urgent' ? '<br><span style="color: #f44336; font-weight: bold;">⚠️ CẦN XỬ LÝ NGAY!</span>' : ''}
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', notificationHTML);
    
    // Tự động ẩn sau thời gian khác nhau theo mức độ
    const autoHideTime = alertLevel === 'urgent' ? 30000 : 15000; // 30s cho urgent, 15s cho warning
    setTimeout(() => {
        const notif = document.getElementById(notificationId);
        if (notif) notif.remove();
    }, autoHideTime);
}

/**
 * Đánh dấu reminder đã hoàn thành
 */
function markReminderCompleted(taxCode, reminderId) {
    ensureCompanyData(taxCode);
    const company = window.hkdData[taxCode];
    const reminder = company.reminders.find(r => r.id === reminderId);
    
    if (reminder) {
        reminder.status = 'completed';
        reminder.completedAt = new Date().toISOString();
        saveData();
        
        // Đóng thông báo
        const notif = document.getElementById('reminder-' + reminderId);
        if (notif) notif.remove();
        
        // Refresh UI
        renderCompanyList();
        showToast('✅ Đã đánh dấu hoàn thành!', 2000, 'success');
    }
}

/**
 * Hoãn reminder 1 giờ
 */
function snoozeReminder(taxCode, reminderId) {
    ensureCompanyData(taxCode);
    const company = window.hkdData[taxCode];
    const reminder = company.reminders.find(r => r.id === reminderId);
    
    if (reminder) {
        const now = new Date();
        const newDueTime = new Date(now.getTime() + 60 * 60 * 1000); // +1 giờ
        
        reminder.dueDate = newDueTime.toISOString().split('T')[0];
        reminder.dueTime = newDueTime.toTimeString().split(' ')[0].substring(0, 5);
        reminder.status = 'pending';
        saveData();
        
        // Đóng thông báo
        const notif = document.getElementById('reminder-' + reminderId);
        if (notif) notif.remove();
        
        // Refresh UI
        renderCompanyList();
        showToast('⏰ Đã hoãn nhắc nhở 1 giờ!', 2000, 'info');
    }
}

/**
 * Modal xem tất cả cảnh báo
 */
function showAlertsModal(taxCode) {
    const company = window.hkdData[taxCode];
    const pendingReminders = (company.reminders || []).filter(r => r.status === 'pending');
    
    const modalContent = `
        <div class="alerts-modal">
            <h4>⚠️ Cảnh báo & Nhắc nhở - ${company.name}</h4>
            
            <div style="margin-bottom: 15px;">
                <label>
                    <input type="checkbox" id="sound-toggle" ${isSoundEnabled ? 'checked' : ''} onchange="toggleSound(this.checked)">
                    🔊 Bật âm thanh cảnh báo
                </label>
            </div>
            
            ${pendingReminders.length > 0 ? `
            <div class="alerts-list" style="max-height: 400px; overflow-y: auto;">
                ${pendingReminders.map(reminder => {
                    const alertLevel = getReminderAlertLevel(reminder);
                    return `
                    <div class="alert-item" style="border: 1px solid ${alertLevel === 'urgent' ? '#f44336' : alertLevel === 'warning' ? '#ffc107' : '#2196f3'}; 
                         border-radius: 5px; padding: 10px; margin: 10px 0; background: ${alertLevel === 'urgent' ? '#ffebee' : alertLevel === 'warning' ? '#fff3cd' : '#e3f2fd'};">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="flex: 1;">
                                <div style="font-weight: bold; margin-bottom: 5px;">${reminder.title}</div>
                                <div style="margin-bottom: 5px;">${reminder.description}</div>
                                <div style="font-size: 12px; color: #666;">
                                    ⏰ ${formatDate(reminder.dueDate)} ${reminder.dueTime}
                                    ${alertLevel === 'urgent' ? '<span style="color: #f44336; font-weight: bold;"> • KHẨN CẤP</span>' : ''}
                                </div>
                            </div>
                            <div style="display: flex; gap: 5px; flex-direction: column;">
                                <button onclick="markReminderCompleted('${taxCode}', '${reminder.id}')" class="btn-small btn-success">✅</button>
                                <button onclick="snoozeReminder('${taxCode}', '${reminder.id}')" class="btn-small btn-warning">⏰</button>
                                <button onclick="deleteReminder('${taxCode}', '${reminder.id}')" class="btn-small btn-danger">🗑️</button>
                            </div>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
            ` : '<p style="text-align: center; color: #666;">Không có cảnh báo nào</p>'}
            
            <div class="modal-actions" style="margin-top: 20px; text-align: right;">
                <button class="btn-primary" onclick="closeModal()">✅ Đóng</button>
            </div>
        </div>
    `;
    
    showModal('Quản Lý Cảnh Báo', modalContent);
}

/**
 * Bật/tắt âm thanh
 */
function toggleSound(enabled) {
    isSoundEnabled = enabled;
    showToast(enabled ? '🔊 Đã bật âm thanh cảnh báo' : '🔇 Đã tắt âm thanh cảnh báo', 2000);
}

/**
 * Xóa reminder
 */
function deleteReminder(taxCode, reminderId) {
    if (!confirm('Bạn có chắc muốn xóa nhắc nhở này?')) return;
    
    ensureCompanyData(taxCode);
    const company = window.hkdData[taxCode];
    company.reminders = company.reminders.filter(r => r.id !== reminderId);
    saveData();
    
    showAlertsModal(taxCode);
    renderCompanyList();
    showToast('✅ Đã xóa nhắc nhở!', 2000, 'success');
}

function isReminderDue(reminder) {
    const now = new Date();
    const dueDateTime = new Date(`${reminder.dueDate}T${reminder.dueTime}`);
    return now >= dueDateTime;
}

function showReminderNotification(reminder, companyName) {
    const notification = `
        <div class="reminder-notification" style="position: fixed; top: 20px; right: 20px; background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 15px; max-width: 300px; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 20px; margin-right: 8px;">⏰</span>
                <strong style="color: #856404;">NHẮC NHỞ</strong>
            </div>
            <div style="margin-bottom: 8px;">
                <strong>${reminder.title}</strong><br>
                ${companyName ? `🏢 ${companyName}<br>` : ''}
                ${reminder.description || ''}
            </div>
            <div style="font-size: 12px; color: #666;">
                ⏳ Hạn: ${formatDate(reminder.dueDate)} ${reminder.dueTime}
            </div>
            <button onclick="this.parentElement.remove()" style="position: absolute; top: 5px; right: 5px; background: none; border: none; font-size: 16px; cursor: pointer;">×</button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', notification);
    
    // Tự động ẩn sau 10 giây
    setTimeout(() => {
        const notif = document.querySelector('.reminder-notification');
        if (notif) notif.remove();
    }, 10000);
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
    font-size: 25px;
    color: #6429a3ff;
    background: #f7fafc;
    padding: 6px 10px;
    border-radius: 6px;
    font-weight: 600;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

// Hàm chính khởi động ứng// ...existing code...

// Hàm xóa toàn bộ dữ liệu ứng dụng (hkdData, tags, localStorage)
function clearAllData(confirmPrompt = true) {
    const key = typeof STORAGE_KEY !== 'undefined' ? STORAGE_KEY : 'hkd_manager_data';
    if (confirmPrompt) {
        if (!confirm('Xác nhận xóa toàn bộ dữ liệu? Hành động này không thể hoàn tác.')) return;
    }
    try {
        // xóa in-memory
        window.hkdData = {};
        window.currentCompany = null;
        window.globalTags = [];
        // xóa localStorage
        try { localStorage.removeItem(key); } catch (e) { console.warn('localStorage remove error', e); }
        // nếu có hàm saveData tùy chỉnh thì gọi để đồng bộ
        if (typeof window.saveData === 'function') {
            try { window.saveData(); } catch (e) { console.warn('saveData error', e); }
        }
        // cập nhật giao diện nếu có các hàm render
        if (typeof window.renderCompanyList === 'function') {
            try { window.renderCompanyList(); } catch (e) { console.warn('renderCompanyList error', e); }
        }
        if (typeof window.renderNotesList === 'function') {
            try { window.renderNotesList([], null); } catch (e) { console.warn('renderNotesList error', e); }
        }
        if (typeof window.renderStock === 'function') {
            try { window.renderStock(); } catch (e) { /* ignore */ }
        }
        alert('Đã xóa toàn bộ dữ liệu.');
    } catch (err) {
        console.error('clearAllData error', err);
        alert('Lỗi khi xóa dữ liệu. Kiểm tra console.');
    }
}
window.clearAllData = clearAllData;

// Gán sự kiện cho nút "clear-all-data" khi DOM ready
function bindClearAllButton() {
    document.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('clear-all-data');
        if (!btn) return;
        btn.addEventListener('click', () => clearAllData(true));
        // nếu nút bị ẩn bằng style, hiển thị
        btn.style.display = btn.style.display === 'none' ? '' : btn.style.display;
    });
}
bindClearAllButton();

// ...existing code... dụng
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Đang khởi động ứng dụng...');
    
    // 1. Tải dữ liệu từ LocalStorage
    loadData();
 setupCompanyFilters();
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

    startReminderChecker();
    setupNoteTagButtons();
    
    // THÊM: Kiểm tra cảnh báo ngay khi khởi động
    setTimeout(() => {
        checkAllReminders();
    }, 2000);
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
// Thêm CSS cho các element mới
function addUrlManagerStyles() {
    const styles = `
        <style>
        /* Nút mở profile trong sidebar */
        .company-profile-action {
            margin-top: 8px;
            text-align: center;
        }
        
        .btn-profile-launch {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 15px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.3s;
            width: 100%;
        }
        
        .btn-profile-launch:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        /* Quick URL items */
        .quick-url-item {
            transition: background-color 0.2s;
        }
        
        .quick-url-item:hover {
            background-color: #e3f2fd !important;
        }
        </style>
    `;
    
    // Chỉ thêm CSS nếu chưa tồn tại
    if (!document.getElementById('url-manager-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'url-manager-styles';
        styleElement.innerHTML = styles;
        document.head.appendChild(styleElement);
    }
}
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Đang khởi động ứng dụng...');
    
    // 1. Tải dữ liệu từ LocalStorage
    loadData();
    
    // 2. Thêm CSS
    addHeaderStyles();
    addUrlManagerStyles(); // THÊM DÒNG NÀY
    
    // 3. Thiết lập chuyển đổi tab
    setupTabSwitching();
    
    // 4. Hiển thị danh sách công ty
    renderCompanyList();
    
    // 5. Khởi tạo mobile sidebar nếu là mobile
    if (window.innerWidth <= 768) {
        initMobileSidebar();
    }
    
    
    // ... rest of existing code ...
});
console.log('📱 App.js đã được tải - Sẵn sàng với tính năng mobile!');