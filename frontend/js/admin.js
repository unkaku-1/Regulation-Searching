// Admin Page Logic
let activityChart = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication and admin role
    if (!Utils.isAuthenticated()) {
        window.location.href = '../index.html';
        return;
    }

    const user = Utils.getUser();
    if (!user || !user.is_superuser) {
        alert('您没有权限访问管理后台');
        window.location.href = 'chat.html';
        return;
    }

    // Initialize
    await initializePage();
    setupEventListeners();
    await loadDashboardData();
    initializeChart();
});

async function initializePage() {
    const user = Utils.getUser();
    if (user) {
        const userNameEl = document.getElementById('userName');
        const userInitialEl = document.getElementById('userInitial');
        
        if (userNameEl) userNameEl.textContent = user.username;
        if (userInitialEl) userInitialEl.textContent = user.username.charAt(0).toUpperCase();
    }
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.dataset.tab;
            switchTab(tab);
        });
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

    // Upload document
    document.getElementById('uploadBtn')?.addEventListener('click', handleUpload);
}

function switchTab(tabName) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.dataset.tab === tabName) {
            item.classList.add('active', 'bg-primary-50', 'dark:bg-primary-900/20', 'text-primary-600', 'dark:text-primary-400');
        } else {
            item.classList.remove('active', 'bg-primary-50', 'dark:bg-primary-900/20', 'text-primary-600', 'dark:text-primary-400');
            item.classList.add('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
        }
    });

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });

    const activeTab = document.getElementById(`${tabName}Tab`);
    if (activeTab) {
        activeTab.classList.remove('hidden');

        // Load data for specific tabs
        if (tabName === 'knowledge') {
            loadDocuments();
        }
    }
}

async function loadDashboardData() {
    try {
        const stats = await API.getKnowledgeStats();
        
        document.getElementById('documentCount').textContent = stats.document_count || 0;
        document.getElementById('vectorCount').textContent = stats.vector_count || 0;
        
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

function initializeChart() {
    const chartDom = document.getElementById('activityChart');
    if (!chartDom) return;

    activityChart = echarts.init(chartDom);

    // Sample data - in production, this would come from the API
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            axisLine: {
                lineStyle: {
                    color: '#9CA3AF'
                }
            }
        },
        yAxis: {
            type: 'value',
            axisLine: {
                lineStyle: {
                    color: '#9CA3AF'
                }
            }
        },
        series: [
            {
                name: 'Queries',
                type: 'bar',
                data: [120, 200, 150, 80, 70, 110, 130],
                itemStyle: {
                    color: '#3B82F6',
                    borderRadius: [4, 4, 0, 0]
                }
            }
        ]
    };

    activityChart.setOption(option);

    // Responsive
    window.addEventListener('resize', () => {
        activityChart?.resize();
    });

    // Update chart colors on theme change
    const observer = new MutationObserver(() => {
        updateChartTheme();
    });
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
    });
}

function updateChartTheme() {
    if (!activityChart) return;

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#E5E7EB' : '#374151';
    const lineColor = isDark ? '#4B5563' : '#9CA3AF';

    activityChart.setOption({
        xAxis: {
            axisLine: {
                lineStyle: { color: lineColor }
            },
            axisLabel: {
                color: textColor
            }
        },
        yAxis: {
            axisLine: {
                lineStyle: { color: lineColor }
            },
            axisLabel: {
                color: textColor
            }
        }
    });
}

async function loadDocuments() {
    Utils.showLoading();

    try {
        const data = await API.getDocuments();
        const documents = data.documents || [];

        const documentsList = document.getElementById('documentsList');
        const documentsEmpty = document.getElementById('documentsEmpty');

        if (documents.length === 0) {
            documentsList.innerHTML = '';
            documentsEmpty?.classList.remove('hidden');
            return;
        }

        documentsEmpty?.classList.add('hidden');

        documentsList.innerHTML = documents.map(doc => `
            <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        <svg class="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 dark:text-white truncate">${escapeHtml(doc.filename)}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${formatFileSize(doc.size)} • ${formatDate(doc.created_at)}</p>
                    </div>
                </div>
                <button class="delete-doc-btn p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" data-filename="${escapeHtml(doc.filename)}" title="删除文档">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        `).join('');

        // Add delete handlers
        document.querySelectorAll('.delete-doc-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const filename = btn.dataset.filename;
                if (confirm(`确定要删除文档 "${filename}" 吗？`)) {
                    await deleteDocument(filename);
                }
            });
        });

    } catch (error) {
        console.error('Failed to load documents:', error);
        alert('加载文档列表失败');
    } finally {
        Utils.hideLoading();
    }
}

async function handleUpload() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('请选择文件');
        return;
    }

    // Check file type
    const allowedTypes = ['.pdf', '.docx', '.doc', '.txt'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExt)) {
        alert('不支持的文件类型。支持的类型: PDF, Word (DOCX/DOC), TXT');
        return;
    }

    Utils.showLoading();

    try {
        const result = await API.uploadDocument(file);
        
        alert(`文档上传成功！\n文件名: ${result.filename}\n处理的文本块: ${result.chunks_count}`);
        
        // Clear input
        fileInput.value = '';
        
        // Reload documents list and stats
        await loadDocuments();
        await loadDashboardData();

    } catch (error) {
        console.error('Upload error:', error);
        alert('文档上传失败: ' + (error.message || '未知错误'));
    } finally {
        Utils.hideLoading();
    }
}

async function deleteDocument(filename) {
    Utils.showLoading();

    try {
        // Note: This only deletes the file, not the vectors
        // In production, you might want to add an API endpoint to also remove vectors
        alert('文档删除功能需要后端API支持。\n注意：删除文件不会自动删除向量数据库中的数据。');
        
        await loadDocuments();
        await loadDashboardData();

    } catch (error) {
        console.error('Delete error:', error);
        alert('删除文档失败');
    } finally {
        Utils.hideLoading();
    }
}

async function handleLogout() {
    if (confirm('确定要退出登录吗？')) {
        try {
            await API.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            Utils.clearAuth();
            window.location.href = '../index.html';
        }
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

