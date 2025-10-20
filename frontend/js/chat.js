// Chat Page Logic
let currentConversationId = null;
let conversations = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!Utils.isAuthenticated()) {
        window.location.href = '../index.html';
        return;
    }

    // Initialize
    await initializePage();
    setupEventListeners();
    loadConversations();
    
    // Auto-resize textarea
    const messageInput = document.getElementById('messageInput');
    messageInput?.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
});

async function initializePage() {
    try {
        const user = Utils.getUser();
        if (user) {
            const userNameEl = document.getElementById('userName');
            const userInitialEl = document.getElementById('userInitial');
            
            if (userNameEl) userNameEl.textContent = user.username;
            if (userInitialEl) userInitialEl.textContent = user.username.charAt(0).toUpperCase();
        }
    } catch (error) {
        console.error('Failed to initialize page:', error);
    }
}

function setupEventListeners() {
    // New chat button
    document.getElementById('newChatBtn')?.addEventListener('click', startNewChat);
    
    // Chat form
    document.getElementById('chatForm')?.addEventListener('submit', handleSendMessage);
    
    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    
    // Clear all conversations
    document.getElementById('clearAllBtn')?.addEventListener('click', handleClearAll);
    
    // Toggle sidebar (mobile)
    document.getElementById('toggleSidebar')?.addEventListener('click', toggleSidebar);
    
    // Enter to send, Shift+Enter for new line
    document.getElementById('messageInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.getElementById('chatForm')?.dispatchEvent(new Event('submit'));
        }
    });
}

function startNewChat() {
    currentConversationId = null;
    document.getElementById('chatTitle').textContent = 'New Conversation';
    document.getElementById('messagesContainer').innerHTML = `
        <div id="welcomeMessage" class="text-center py-12">
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 mb-6 shadow-lg">
                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">欢迎使用法规智能检索系统</h3>
            <p class="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                我是您的AI助手，可以帮助您查询和理解公司的各项法规制度。请输入您的问题开始对话。
            </p>
        </div>
    `;
    document.getElementById('messageInput').value = '';
    document.getElementById('messageInput').focus();
    
    // Remove active state from all conversations
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('sidebar-item-active');
    });
}

async function handleSendMessage(e) {
    e.preventDefault();
    
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    // Disable input
    messageInput.disabled = true;
    document.getElementById('sendBtn').disabled = true;
    
    // Hide welcome message
    document.getElementById('welcomeMessage')?.remove();
    
    // Add user message to UI
    addMessageToUI('user', message);
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    // Show typing indicator
    const typingId = showTypingIndicator();
    
    try {
        // Send message to API
        const response = await API.chat(message, currentConversationId);
        
        // Remove typing indicator
        removeTypingIndicator(typingId);
        
        // Update conversation ID if new
        if (!currentConversationId) {
            currentConversationId = response.conversation_id;
            await loadConversations();
        }
        
        // Add assistant response to UI
        addMessageToUI('assistant', response.response.content);
        
    } catch (error) {
        removeTypingIndicator(typingId);
        addMessageToUI('assistant', '抱歉，处理您的请求时出现错误。请稍后重试。', true);
        console.error('Chat error:', error);
    } finally {
        // Re-enable input
        messageInput.disabled = false;
        document.getElementById('sendBtn').disabled = false;
        messageInput.focus();
    }
}

function addMessageToUI(role, content, isError = false) {
    const messagesContainer = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `flex gap-3 ${role === 'user' ? 'justify-end message-user' : 'message-assistant'}`;
    
    if (role === 'user') {
        messageDiv.innerHTML = `
            <div class="max-w-3xl">
                <div class="bg-primary-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-lg">
                    <p class="text-sm whitespace-pre-wrap">${escapeHtml(content)}</p>
                </div>
            </div>
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold flex-shrink-0">
                ${Utils.getUser()?.username.charAt(0).toUpperCase() || 'U'}
            </div>
        `;
    } else {
        const bgClass = isError ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-gray-100 dark:bg-gray-700';
        const textClass = isError ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white';
        
        messageDiv.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
            </div>
            <div class="max-w-3xl">
                <div class="${bgClass} border rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg">
                    <div class="message-content ${textClass} text-sm">${marked.parse(content)}</div>
                </div>
            </div>
        `;
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('messagesContainer');
    const typingDiv = document.createElement('div');
    const typingId = 'typing-' + Date.now();
    typingDiv.id = typingId;
    typingDiv.className = 'flex gap-3 message-assistant';
    typingDiv.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
        </div>
        <div class="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg">
            <div class="flex gap-1">
                <div class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full typing-dot"></div>
                <div class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full typing-dot"></div>
                <div class="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full typing-dot"></div>
            </div>
        </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return typingId;
}

function removeTypingIndicator(typingId) {
    document.getElementById(typingId)?.remove();
}

async function loadConversations() {
    try {
        conversations = await API.getConversations();
        renderConversations();
    } catch (error) {
        console.error('Failed to load conversations:', error);
    }
}

function renderConversations() {
    const conversationsList = document.getElementById('conversationsList');
    const emptyState = document.getElementById('emptyState');
    
    if (conversations.length === 0) {
        conversationsList.innerHTML = '';
        emptyState?.classList.remove('hidden');
        return;
    }
    
    emptyState?.classList.add('hidden');
    
    conversationsList.innerHTML = conversations.map(conv => `
        <div class="conversation-item p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors ${conv.id === currentConversationId ? 'sidebar-item-active' : ''}" data-id="${conv.id}">
            <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white truncate">${escapeHtml(conv.title)}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${conv.message_count} messages</p>
                </div>
                <button class="delete-conv-btn p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" data-id="${conv.id}" title="删除对话">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
    
    // Add click handlers
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.addEventListener('click', async (e) => {
            if (e.target.closest('.delete-conv-btn')) return;
            const convId = item.dataset.id;
            await loadConversation(convId);
        });
    });
    
    // Add delete handlers
    document.querySelectorAll('.delete-conv-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const convId = btn.dataset.id;
            if (confirm('确定要删除这个对话吗？')) {
                await deleteConversation(convId);
            }
        });
    });
}

async function loadConversation(conversationId) {
    Utils.showLoading();
    
    try {
        const messages = await API.getMessages(conversationId);
        const conversation = conversations.find(c => c.id === conversationId);
        
        currentConversationId = conversationId;
        document.getElementById('chatTitle').textContent = conversation?.title || 'Conversation';
        
        // Clear messages
        document.getElementById('messagesContainer').innerHTML = '';
        
        // Render messages
        messages.forEach(msg => {
            addMessageToUI(msg.role, msg.content);
        });
        
        // Update active state
        document.querySelectorAll('.conversation-item').forEach(item => {
            if (item.dataset.id === conversationId) {
                item.classList.add('sidebar-item-active');
            } else {
                item.classList.remove('sidebar-item-active');
            }
        });
        
    } catch (error) {
        console.error('Failed to load conversation:', error);
        alert('加载对话失败');
    } finally {
        Utils.hideLoading();
    }
}

async function deleteConversation(conversationId) {
    try {
        await API.deleteConversation(conversationId);
        
        if (currentConversationId === conversationId) {
            startNewChat();
        }
        
        await loadConversations();
    } catch (error) {
        console.error('Failed to delete conversation:', error);
        alert('删除对话失败');
    }
}

async function handleClearAll() {
    if (!confirm('确定要删除所有对话吗？此操作不可恢复。')) {
        return;
    }
    
    Utils.showLoading();
    
    try {
        await Promise.all(conversations.map(conv => API.deleteConversation(conv.id)));
        startNewChat();
        await loadConversations();
    } catch (error) {
        console.error('Failed to clear conversations:', error);
        alert('删除对话失败');
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

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar?.classList.toggle('-translate-x-full');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

