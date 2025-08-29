// 全局变量
let htmlEditor, cssEditor, jsEditor;
let socket;
let currentCode = {
    html: '',
    css: '',
    javascript: ''
};

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    initializeEditors();
    initializeSocket();
    setupEventListeners();
    loadInitialCode();
});

// 初始化代码编辑器
function initializeEditors() {
    // HTML编辑器
    htmlEditor = CodeMirror(document.getElementById('htmlEditor'), {
        mode: 'xml',
        theme: 'monokai',
        lineNumbers: true,
        autoCloseTags: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 4,
        tabSize: 4,
        lineWrapping: true,
        extraKeys: {
            'Ctrl-Space': 'autocomplete'
        }
    });

    // CSS编辑器
    cssEditor = CodeMirror(document.getElementById('cssEditor'), {
        mode: 'css',
        theme: 'monokai',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 4,
        tabSize: 4,
        lineWrapping: true
    });

    // JavaScript编辑器
    jsEditor = CodeMirror(document.getElementById('javascriptEditor'), {
        mode: 'javascript',
        theme: 'monokai',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 4,
        tabSize: 4,
        lineWrapping: true,
        extraKeys: {
            'Ctrl-Space': 'autocomplete'
        }
    });

    // 设置编辑器大小
    setTimeout(() => {
        htmlEditor.refresh();
        cssEditor.refresh();
        jsEditor.refresh();
    }, 100);
}

// 初始化Socket.IO连接
function initializeSocket() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('已连接到服务器');
    });
    
    socket.on('codeUpdate', (code) => {
        updateEditors(code);
    });
    
    socket.on('disconnect', () => {
        console.log('与服务器断开连接');
    });
}

// 设置事件监听器
function setupEventListeners() {
    // 标签切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    // 按钮事件
    document.getElementById('apiBtn').addEventListener('click', showApiDialog);
    document.getElementById('runBtn').addEventListener('click', runCode);
    document.getElementById('clearBtn').addEventListener('click', clearCode);
    document.getElementById('saveBtn').addEventListener('click', saveCode);
    document.getElementById('publishBtn').addEventListener('click', showPublishDialog);
    document.getElementById('publishedListBtn').addEventListener('click', showPublishedList);
    document.getElementById('editBtn').addEventListener('click', toggleEditMode);
    document.getElementById('refreshBtn').addEventListener('click', refreshPreview);
    document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
    
    // 文件上传事件
    document.getElementById('uploadHtmlBtn').addEventListener('click', () => {
        document.getElementById('htmlFileUpload').click();
    });
    
    document.getElementById('htmlFileUpload').addEventListener('change', handleHtmlFileUpload);

    // 编辑器内容变化事件
    htmlEditor.on('change', debounce(updatePreview, 500));
    cssEditor.on('change', debounce(updatePreview, 500));
    jsEditor.on('change', debounce(updatePreview, 500));

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            runCode();
        }
    });
}

// 加载初始代码
function loadInitialCode() {
    fetch('/api/code')
        .then(response => response.json())
        .then(code => {
            updateEditors(code);
            updatePreview();
        })
        .catch(error => {
            console.error('加载代码失败:', error);
            // 使用默认代码
            const defaultCode = {
                html: '<!DOCTYPE html>\n<html>\n<head>\n    <title>我的网页</title>\n</head>\n<body>\n    <h1>欢迎使用网页渲染器！</h1>\n    <p>在左侧编辑代码，右侧将实时显示渲染结果。</p>\n</body>\n</html>',
                css: 'body {\n    font-family: Arial, sans-serif;\n    margin: 40px;\n    background-color: #f5f5f5;\n}\n\nh1 {\n    color: #333;\n    text-align: center;\n}\n\np {\n    color: #666;\n    line-height: 1.6;\n}',
                javascript: '// 在这里编写JavaScript代码\nconsole.log("页面已加载");\n\ndocument.addEventListener("DOMContentLoaded", function() {\n    console.log("DOM加载完成");\n});'
            };
            updateEditors(defaultCode);
            updatePreview();
        });
}

// 切换标签
function switchTab(tabName) {
    // 更新标签按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // 更新编辑器显示
    document.querySelectorAll('.code-editor').forEach(editor => {
        editor.classList.remove('active');
    });
    document.getElementById(`${tabName}Editor`).classList.add('active');

    // 刷新当前编辑器
    setTimeout(() => {
        if (tabName === 'html') htmlEditor.refresh();
        else if (tabName === 'css') cssEditor.refresh();
        else if (tabName === 'javascript') jsEditor.refresh();
    }, 100);
}

// 运行代码
function runCode() {
    updatePreview();
    showNotification('代码已运行', 'success');
}

// 清空代码
function clearCode() {
    if (confirm('确定要清空所有代码吗？')) {
        const emptyCode = {
            html: '',
            css: '',
            javascript: ''
        };
        updateEditors(emptyCode);
        updatePreview();
        showNotification('代码已清空', 'info');
    }
}

// 保存代码
function saveCode() {
    const code = getCurrentCode();
    
    // 显示确认对话框
    if (confirm('是否要将代码保存为文件并下载？')) {
        // 先保存到服务器
        fetch('/api/code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(code)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 然后下载文件
                downloadCodeFile(code);
                showNotification('代码已保存并下载', 'success');
            } else {
                showNotification('保存失败', 'error');
            }
        })
        .catch(error => {
            console.error('保存失败:', error);
            showNotification('保存失败', 'error');
        });
    }
}

// 下载代码文件
function downloadCodeFile(code) {
    fetch('/api/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(code)
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'webpage.html';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    })
    .catch(error => {
        console.error('下载失败:', error);
        showNotification('下载失败', 'error');
    });
}

// 更新预览
function updatePreview() {
    const code = getCurrentCode();
    const previewFrame = document.getElementById('previewFrame');
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>预览</title>
            <style>${code.css}</style>
        </head>
        <body>
            ${code.html}
            <script>${code.javascript}</script>
        </body>
        </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    previewFrame.src = url;
    
    // 清理URL对象
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);
}

// 刷新预览
function refreshPreview() {
    updatePreview();
    showNotification('预览已刷新', 'info');
}

// 切换全屏
function toggleFullscreen() {
    const previewFrame = document.getElementById('previewFrame');
    
    if (previewFrame.requestFullscreen) {
        previewFrame.requestFullscreen();
    } else if (previewFrame.webkitRequestFullscreen) {
        previewFrame.webkitRequestFullscreen();
    } else if (previewFrame.msRequestFullscreen) {
        previewFrame.msRequestFullscreen();
    }
}

// 可视化编辑模式
let isEditMode = false;
let editModeObserver = null;

function toggleEditMode() {
    const previewSection = document.querySelector('.preview-section');
    const editBtn = document.getElementById('editBtn');
    
    isEditMode = !isEditMode;
    
    if (isEditMode) {
        previewSection.classList.add('edit-mode');
        editBtn.textContent = '退出编辑';
        editBtn.classList.add('btn-warning');
        setupVisualEditor();
        showNotification('已进入可视化编辑模式', 'info');
    } else {
        previewSection.classList.remove('edit-mode');
        editBtn.textContent = '编辑';
        editBtn.classList.remove('btn-warning');
        cleanupVisualEditor();
        showNotification('已退出可视化编辑模式', 'info');
    }
}

function setupVisualEditor() {
    const previewFrame = document.getElementById('previewFrame');
    
    // 等待iframe加载完成
    previewFrame.onload = function() {
        try {
            const frameDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
            const frameBody = frameDoc.body;
            
            if (frameBody) {
                // 添加可编辑样式
                addEditableStyles(frameDoc);
                
                // 为所有可编辑元素添加点击事件
                addClickHandlers(frameDoc);
                
                // 监听DOM变化
                observeDOMChanges(frameDoc);
            }
        } catch (e) {
            console.error('无法访问iframe内容:', e);
            showNotification('无法进入编辑模式，请检查预览内容', 'error');
        }
    };
    
    // 如果iframe已经加载，立即设置
    if (previewFrame.contentDocument && previewFrame.contentDocument.readyState === 'complete') {
        previewFrame.onload();
    }
    
    // 添加超时处理
    setTimeout(() => {
        if (!document.querySelector('.edit-mode .editable-element')) {
            console.warn('编辑模式设置超时，尝试重新设置');
            previewFrame.onload();
        }
    }, 2000);
}

function addEditableStyles(frameDoc) {
    const style = frameDoc.createElement('style');
    style.textContent = `
        .editable-element {
            outline: 2px dashed #667eea !important;
            cursor: pointer;
            transition: outline 0.2s ease;
        }
        .editable-element:hover {
            outline: 2px solid #667eea !important;
            background-color: rgba(102, 126, 234, 0.1) !important;
        }
    `;
    frameDoc.head.appendChild(style);
}

function addClickHandlers(frameDoc) {
    const editableElements = frameDoc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, a, button, input, textarea, label, li, td, th');
    
    editableElements.forEach(element => {
        try {
            // 检查元素是否可以被编辑
            if (isElementEditable(element)) {
                element.classList.add('editable-element');
                
                // 为元素添加唯一标识符
                if (!element.dataset.editId) {
                    element.dataset.editId = 'edit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                }
                
                element.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    showEditDialog(element, frameDoc);
                });
            }
        } catch (error) {
            console.warn('无法为元素添加编辑功能:', error);
        }
    });
}

// 检查元素是否可以被编辑
function isElementEditable(element) {
    // 排除脚本和样式标签
    if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
        return false;
    }
    
    // 排除在脚本或样式标签内的元素
    if (element.closest('script, style')) {
        return false;
    }
    
    // 排除CodeMirror相关的元素
    if (element.closest('.CodeMirror')) {
        return false;
    }
    
    // 排除iframe内的元素
    if (element.closest('iframe')) {
        return false;
    }
    
    // 排除已经添加了编辑功能的元素
    if (element.classList.contains('editable-element')) {
        return false;
    }
    
    // 检查元素是否有内容或可编辑属性
    const hasContent = element.textContent && element.textContent.trim().length > 0;
    const isInput = element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
    const hasValue = element.value !== undefined;
    
    return hasContent || isInput || hasValue;
}

function showEditDialog(element, frameDoc) {
    try {
        const elementType = element.tagName.toLowerCase();
        const currentText = element.textContent || element.value || '';
        const editId = element.dataset.editId;
        
        // 转义文本内容，防止XSS攻击
        const escapedText = currentText.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        
        // 创建对话框
        const dialog = document.createElement('div');
        dialog.className = 'edit-dialog';
        dialog.innerHTML = `
            <h3>编辑 ${elementType.toUpperCase()} 元素</h3>
            <label>内容:</label>
            ${elementType === 'input' ? 
                `<input type="text" id="editContent" value="${escapedText}" placeholder="输入新内容">` :
                `<textarea id="editContent" placeholder="输入新内容">${escapedText}</textarea>`
            }
            <div class="dialog-buttons">
                <button class="btn btn-secondary" onclick="closeEditDialog()">取消</button>
                <button class="btn btn-primary" onclick="applyEdit(this, '${elementType}', '${editId}')">确定</button>
            </div>
        `;
        
        // 添加遮罩层
        const overlay = document.createElement('div');
        overlay.className = 'edit-overlay';
        overlay.onclick = closeEditDialog;
        
        document.body.appendChild(overlay);
        document.body.appendChild(dialog);
        
        // 聚焦到输入框
        setTimeout(() => {
            const input = dialog.querySelector('#editContent');
            if (input) input.focus();
        }, 100);
        
    } catch (error) {
        console.error('创建编辑对话框时出错:', error);
        showNotification('创建编辑对话框失败', 'error');
    }
}

// 关闭编辑对话框
window.closeEditDialog = function() {
    const overlay = document.querySelector('.edit-overlay');
    const dialog = document.querySelector('.edit-dialog');
    if (overlay) overlay.remove();
    if (dialog) dialog.remove();
};

// 全局函数，用于对话框中的按钮调用
window.applyEdit = function(button, elementType, editId) {
    try {
        const dialog = button.closest('.edit-dialog');
        const content = dialog.querySelector('#editContent').value;
        
        const previewFrame = document.getElementById('previewFrame');
        const frameDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
        
        // 通过唯一标识符找到目标元素
        const targetElement = frameDoc.querySelector(`[data-edit-id="${editId}"]`);
        
        if (targetElement) {
            try {
                if (elementType === 'input') {
                    targetElement.value = content;
                } else {
                    targetElement.textContent = content;
                }
                
                // 更新代码编辑器
                updateCodeFromVisualEdit(frameDoc);
                showNotification('内容已更新', 'success');
            } catch (e) {
                console.error('更新元素内容时出错:', e);
                showNotification('更新内容失败', 'error');
            }
        } else {
            showNotification('未找到要编辑的元素', 'warning');
        }
        
    } catch (error) {
        console.error('应用编辑时出错:', error);
        showNotification('编辑失败', 'error');
    } finally {
        // 清理对话框
        closeEditDialog();
    }
};

function updateCodeFromVisualEdit(frameDoc) {
    try {
        const bodyHTML = frameDoc.body.innerHTML;
        
        // 提取CSS
        const styleTags = frameDoc.querySelectorAll('style');
        let cssContent = '';
        styleTags.forEach(style => {
            if (style.textContent) {
                cssContent += style.textContent + '\n';
            }
        });
        
        // 提取JavaScript
        const scriptTags = frameDoc.querySelectorAll('script');
        let jsContent = '';
        scriptTags.forEach(script => {
            if (script.textContent) {
                jsContent += script.textContent + '\n';
            }
        });
        
        // 更新编辑器
        htmlEditor.setValue(bodyHTML);
        cssEditor.setValue(cssContent);
        jsEditor.setValue(jsContent);
        
        showNotification('代码已同步更新', 'success');
    } catch (error) {
        console.error('更新代码编辑器时出错:', error);
        showNotification('代码同步失败', 'error');
    }
}

function observeDOMChanges(frameDoc) {
    try {
        if (editModeObserver) {
            editModeObserver.disconnect();
        }
        
        editModeObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // 为新添加的元素添加编辑功能
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            try {
                                addClickHandlers(frameDoc);
                            } catch (e) {
                                console.warn('为新元素添加编辑功能时出错:', e);
                            }
                        }
                    });
                }
            });
        });
        
        editModeObserver.observe(frameDoc.body, {
            childList: true,
            subtree: true
        });
    } catch (error) {
        console.error('设置DOM观察器时出错:', error);
    }
}

function cleanupVisualEditor() {
    try {
        if (editModeObserver) {
            editModeObserver.disconnect();
            editModeObserver = null;
        }
        
        const previewFrame = document.getElementById('previewFrame');
        if (previewFrame && previewFrame.contentDocument) {
            const frameDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
            const editableElements = frameDoc.querySelectorAll('.editable-element');
            editableElements.forEach(element => {
                try {
                    element.classList.remove('editable-element');
                } catch (e) {
                    console.warn('移除元素编辑样式时出错:', e);
                }
            });
        }
        
        // 清理可能残留的对话框
        closeEditDialog();
        
    } catch (e) {
        console.error('清理可视化编辑器时出错:', e);
    }
}

// 获取当前代码
function getCurrentCode() {
    return {
        html: htmlEditor.getValue(),
        css: cssEditor.getValue(),
        javascript: jsEditor.getValue()
    };
}

// 更新编辑器内容
function updateEditors(code) {
    htmlEditor.setValue(code.html || '');
    cssEditor.setValue(code.css || '');
    jsEditor.setValue(code.javascript || '');
    currentCode = code;
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 显示通知
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    // 根据类型设置背景色
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        info: '#17a2b8',
        warning: '#ffc107'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 错误处理
window.addEventListener('error', (e) => {
    console.error('JavaScript错误:', e.error);
    showNotification('JavaScript代码有错误，请检查控制台', 'error');
});

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    if (socket) {
        socket.disconnect();
    }
});

// 发布网页功能
function showPublishDialog() {
    const code = getCurrentCode();
    
    // 创建发布对话框
    const dialog = document.createElement('div');
    dialog.className = 'publish-dialog';
    dialog.innerHTML = `
        <h3>发布网页</h3>
        <div class="form-group">
            <label for="pageTitle">网页标题:</label>
            <input type="text" id="pageTitle" value="我的网页" placeholder="输入网页标题">
        </div>
        <div class="dialog-buttons">
            <button class="btn btn-secondary" onclick="closePublishDialog()">取消</button>
            <button class="btn btn-primary" onclick="publishPage()">发布</button>
        </div>
    `;
    
    // 添加遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'edit-overlay';
    overlay.onclick = closePublishDialog;
    
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
    
    // 聚焦到标题输入框
    setTimeout(() => {
        const titleInput = dialog.querySelector('#pageTitle');
        if (titleInput) titleInput.focus();
    }, 100);
}

// 关闭发布对话框
window.closePublishDialog = function() {
    const overlay = document.querySelector('.edit-overlay');
    const dialog = document.querySelector('.publish-dialog');
    if (overlay) overlay.remove();
    if (dialog) dialog.remove();
};

// 发布页面
window.publishPage = function() {
    const dialog = document.querySelector('.publish-dialog');
    const titleInput = dialog.querySelector('#pageTitle');
    const title = titleInput.value.trim() || '我的网页';
    
    const code = getCurrentCode();
    
    // 显示加载状态
    const publishBtn = dialog.querySelector('button[onclick="publishPage()"]');
    const originalText = publishBtn.textContent;
    publishBtn.textContent = '发布中...';
    publishBtn.disabled = true;
    
    fetch('/api/publish', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ...code,
            title: title
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closePublishDialog();
            showPublishSuccessDialog(data.url, data.fileName);
            showNotification('网页发布成功！', 'success');
        } else {
            showNotification('发布失败: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('发布失败:', error);
        showNotification('发布失败，请重试', 'error');
    })
    .finally(() => {
        publishBtn.textContent = originalText;
        publishBtn.disabled = false;
    });
};

// 显示发布成功对话框
function showPublishSuccessDialog(url, fileName) {
    const dialog = document.createElement('div');
    dialog.className = 'publish-dialog';
    dialog.innerHTML = `
        <h3>发布成功！</h3>
        <div class="form-group">
            <label>访问链接:</label>
            <input type="text" value="${url}" readonly onclick="this.select()">
        </div>
        <div class="form-group">
            <label>文件名:</label>
            <input type="text" value="${fileName}" readonly onclick="this.select()">
        </div>
        <div class="dialog-buttons">
            <button class="btn btn-primary" onclick="window.open('${url}', '_blank')">打开网页</button>
            <button class="btn btn-secondary" onclick="closePublishDialog()">关闭</button>
        </div>
    `;
    
    const overlay = document.createElement('div');
    overlay.className = 'edit-overlay';
    overlay.onclick = closePublishDialog;
    
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
}

// 显示已发布列表
function showPublishedList() {
    fetch('/api/published')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showPublishedListDialog(data.pages);
            } else {
                showNotification('获取发布列表失败', 'error');
            }
        })
        .catch(error => {
            console.error('获取发布列表失败:', error);
            showNotification('获取发布列表失败', 'error');
        });
}

// 显示已发布列表对话框
function showPublishedListDialog(pages) {
    const dialog = document.createElement('div');
    dialog.className = 'published-list-dialog';
    
    if (pages.length === 0) {
        dialog.innerHTML = `
            <h3>已发布的网页</h3>
            <div class="empty-list">
                <p>暂无已发布的网页</p>
            </div>
            <div class="dialog-buttons">
                <button class="btn btn-secondary" onclick="closePublishedListDialog()">关闭</button>
            </div>
        `;
    } else {
        const pagesHtml = pages.map(page => {
            const date = new Date(page.createdAt).toLocaleString('zh-CN');
            const size = (page.size / 1024).toFixed(1) + ' KB';
            return `
                <div class="published-item">
                    <div class="item-info">
                        <div class="item-title">${page.fileName}</div>
                        <div class="item-url">${page.url}</div>
                        <div class="item-date">发布时间: ${date} | 大小: ${size}</div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-primary btn-small" onclick="window.open('${page.url}', '_blank')">打开</button>
                        <button class="btn btn-danger btn-small" onclick="deletePublishedPage('${page.fileName}')">删除</button>
                    </div>
                </div>
            `;
        }).join('');
        
        dialog.innerHTML = `
            <h3>已发布的网页 (${pages.length})</h3>
            <div class="published-pages">
                ${pagesHtml}
            </div>
            <div class="dialog-buttons">
                <button class="btn btn-secondary" onclick="closePublishedListDialog()">关闭</button>
            </div>
        `;
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'edit-overlay';
    overlay.onclick = closePublishedListDialog;
    
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
}

// 关闭已发布列表对话框
window.closePublishedListDialog = function() {
    const overlay = document.querySelector('.edit-overlay');
    const dialog = document.querySelector('.published-list-dialog');
    if (overlay) overlay.remove();
    if (dialog) dialog.remove();
};

// 删除已发布的页面
window.deletePublishedPage = function(fileName) {
    if (confirm(`确定要删除 "${fileName}" 吗？`)) {
        fetch(`/api/published/${fileName}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('删除成功', 'success');
                // 刷新列表
                closePublishedListDialog();
                showPublishedList();
            } else {
                showNotification('删除失败: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('删除失败:', error);
            showNotification('删除失败，请重试', 'error');
        });
    }
};

// 处理HTML文件上传
function handleHtmlFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 检查文件类型
    if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
        showNotification('请选择HTML文件 (.html 或 .htm)', 'error');
        return;
    }
    
    // 检查文件大小 (限制为1MB)
    if (file.size > 1024 * 1024) {
        showNotification('文件大小不能超过1MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            
            // 提取HTML内容（新方法会自动更新所有编辑器）
            const extractedContent = extractHtmlContent(content);
            
            // 自动切换到HTML标签
            switchTab('html');
            
            // 更新预览
            updatePreview();
            
            // 显示成功消息
            showNotification(`成功上传HTML文件: ${file.name}，已提取HTML、CSS和JavaScript内容`, 'success');
            
            // 清空文件输入框，允许重复上传同一文件
            event.target.value = '';
            
        } catch (error) {
            console.error('处理HTML文件失败:', error);
            showNotification('处理HTML文件失败，请检查文件格式', 'error');
        }
    };
    
    reader.onerror = function() {
        showNotification('读取文件失败，请重试', 'error');
    };
    
    reader.readAsText(file, 'UTF-8');
}

// 从HTML文件中提取内容
function extractHtmlContent(htmlContent) {
    try {
        // 解析完整的HTML文件
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        // 提取body内容
        const bodyContent = doc.body ? doc.body.innerHTML : '';
        
        // 提取head中的style标签内容
        const styleTags = doc.head.querySelectorAll('style');
        let cssContent = '';
        styleTags.forEach(style => {
            if (style.textContent) {
                cssContent += style.textContent + '\n';
            }
        });
        
        // 提取head和body中的script标签内容
        const scriptTags = doc.querySelectorAll('script');
        let jsContent = '';
        scriptTags.forEach(script => {
            if (script.textContent) {
                jsContent += script.textContent + '\n';
            }
        });
        
        // 更新所有编辑器
        htmlEditor.setValue(bodyContent);
        cssEditor.setValue(cssContent);
        jsEditor.setValue(jsContent);
        
        return {
            html: bodyContent,
            css: cssContent,
            js: jsContent
        };
        
    } catch (error) {
        console.error('解析HTML文件失败:', error);
        // 如果解析失败，使用原来的简单提取方法
        return fallbackExtractHtmlContent(htmlContent);
    }
}

// 备用提取方法（原来的简单逻辑）
function fallbackExtractHtmlContent(htmlContent) {
    // 移除DOCTYPE声明
    let content = htmlContent.replace(/<!DOCTYPE[^>]*>/i, '');
    
    // 提取body内容
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
        return bodyMatch[1].trim();
    }
    
    // 如果没有body标签，尝试提取html标签内的内容
    const htmlMatch = content.match(/<html[^>]*>([\s\S]*?)<\/html>/i);
    if (htmlMatch) {
        return htmlMatch[1].trim();
    }
    
    // 如果都没有，返回原始内容
    return content.trim();
}

// 显示API接口对话框
function showApiDialog() {
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'edit-overlay';
    
    // 创建对话框
    const dialog = document.createElement('div');
    dialog.className = 'api-dialog';
    dialog.innerHTML = `
        <h3>API接口文档</h3>
        <div class="api-content">
            <div class="api-section">
                <h4>发布网页接口</h4>
                <p>通过API接口发布网页，支持自定义标题。</p>
                <div class="code-block">
                    <span class="method">POST</span> <span class="url">/api/publish</span><br><br>
                    <span class="param">Content-Type:</span> <span class="value">application/json</span><br><br>
                    <span class="param">请求参数:</span><br>
                    {<br>
                    &nbsp;&nbsp;"title": <span class="value">"网页标题"</span>, <span class="param">// 可选，默认为"我的网页"</span><br>
                    &nbsp;&nbsp;"html": <span class="value">"HTML代码内容"</span>, <span class="param">// 必填</span><br>
                    &nbsp;&nbsp;"css": <span class="value">"CSS代码内容"</span>, <span class="param">// 可选</span><br>
                    &nbsp;&nbsp;"javascript": <span class="value">"JavaScript代码内容"</span> <span class="param">// 可选</span><br>
                    }<br><br>
                    <span class="param">响应示例:</span><br>
                    {<br>
                    &nbsp;&nbsp;"success": <span class="value">true</span>,<br>
                    &nbsp;&nbsp;"message": <span class="value">"网页发布成功"</span>,<br>
                    &nbsp;&nbsp;"url": <span class="value">"http://localhost:8765/published/page_1735441234567_a1b2.html"</span>,<br>
                    &nbsp;&nbsp;"fileName": <span class="value">"page_1735441234567_a1b2.html"</span><br>
                    }
                </div>
            </div>
            
            <div class="api-section">
                <h4>使用示例</h4>
                <p>使用curl命令调用API接口：</p>
                <div class="code-block">
                    curl -X POST <span class="url">http://localhost:8765/api/publish</span> \<br>
                    &nbsp;&nbsp;-H <span class="param">"Content-Type: application/json"</span> \<br>
                    &nbsp;&nbsp;-d '{<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;"title": <span class="value">"我的网页"</span>,<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;"html": <span class="value">"&lt;h1&gt;Hello World&lt;/h1&gt;"</span>,<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;"css": <span class="value">"h1 { color: blue; }"</span>,<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;"javascript": <span class="value">"console.log('Hello');"</span><br>
                    &nbsp;&nbsp;}'
                </div>
            </div>
            
            <div class="api-section">
                <h4>注意事项</h4>
                <p>• html参数是必填的，css和javascript参数是可选的</p>
                <p>• title参数是可选的，默认为"我的网页"</p>
                <p>• HTML内容会自动包装在完整的HTML结构中</p>
                <p>• 生成的URL是唯一的，可以重复访问</p>
                <p>• 服务器运行在端口8765上</p>
                <p>• 发布的文件保存在服务器的published目录中</p>
            </div>
        </div>
        <div class="dialog-buttons">
            <button class="btn btn-secondary" onclick="closeApiDialog()">关闭</button>
        </div>
    `;
    
    // 添加遮罩层点击事件
    overlay.onclick = closeApiDialog;
    
    // 添加到页面
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
    
    // 聚焦到对话框
    dialog.focus();
}

// 关闭API接口对话框
function closeApiDialog() {
    const dialog = document.querySelector('.api-dialog');
    const overlay = document.querySelector('.edit-overlay');
    
    if (dialog) dialog.remove();
    if (overlay) overlay.remove();
}