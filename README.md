# Regulation-Searching

基于本地LLM（Ollama）和RAG技术的企业级法规智能检索系统

## 项目概述

Regulation-Searching是一个完整的企业级法规智能检索解决方案，结合了大语言模型（LLM）和检索增强生成（RAG）技术，为企业提供准确、高效的法规查询服务。

### 核心特性

- 🤖 **本地LLM部署**：使用Ollama运行Llama3.1:8b模型，确保数据隐私
- 📚 **RAG技术**：检索增强生成，提供准确的法规引用和回答
- 🎨 **现代化界面**：基于Figma设计的AI对话界面，支持浅色/深色主题
- 👥 **多用户系统**：支持管理员和员工两种角色，权限分级管理
- 📊 **管理后台**：文档上传、知识库管理、系统监控
- 🔒 **安全认证**：JWT令牌认证，密码加密存储
- 🐳 **容器化部署**：Docker Compose一键部署

## 技术栈

### 后端
- **框架**: FastAPI (Python 3.11)
- **LLM**: Ollama (Llama3.1:8b)
- **向量数据库**: ChromaDB
- **嵌入模型**: BAAI/bge-large-zh-v1.5
- **关系数据库**: SQLite / PostgreSQL
- **认证**: JWT
- **容器化**: Docker + Docker Compose

### 前端
- **技术**: HTML5 + Tailwind CSS 3 + Vanilla JavaScript
- **字体**: Nunito (英文) + Noto Sans SC (中文)
- **动画**: Anime.js
- **图表**: Apache ECharts 5
- **Markdown渲染**: Marked.js
- **部署**: 静态托管（Vercel/Netlify/GitHub Pages）

## 项目结构

```
Regulation-Searching/
├── backend/                 # 后端代码
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── core/           # 核心配置
│   │   ├── models/         # 数据模型
│   │   ├── schemas/        # Pydantic模式
│   │   ├── services/       # 业务逻辑
│   │   └── main.py         # 应用入口
│   ├── scripts/            # 工具脚本
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/               # 前端代码
│   ├── index.html         # 登录页面
│   ├── pages/             # 其他页面
│   ├── js/                # JavaScript
│   ├── css/               # 样式
│   └── assets/            # 资源文件
├── docs/                  # 文档
│   ├── architecture.md    # 架构文档
│   └── deployment.md      # 部署指南
├── docker-compose.yml     # Docker Compose配置
└── README.md
```

## 快速开始

### 前提条件

1. 已部署Ollama服务器并运行Llama3.1:8b模型
2. 安装Docker和Docker Compose
3. Git

### 1. 克隆项目

```bash
git clone https://github.com/unkaku-1/Regulation-Searching.git
cd Regulation-Searching
```

### 2. 配置后端

```bash
# 复制环境配置文件
cp backend/.env.example backend/.env

# 编辑配置文件
nano backend/.env
```

**必须修改的配置项**：

```env
# Ollama服务器地址
OLLAMA_BASE_URL=http://your-ollama-server:11434
OLLAMA_MODEL=llama3.1:8b

# JWT密钥（生成随机字符串）
SECRET_KEY=your-secret-key-here

# CORS设置（添加前端域名）
CORS_ORIGINS=http://localhost:8080,https://your-frontend-domain.com
```

### 3. 启动后端服务

```bash
# 使用Docker Compose启动
docker-compose up -d

# 查看日志
docker-compose logs -f
```

服务将在以下端口启动：
- 后端API: http://localhost:8000
- ChromaDB: http://localhost:8001

### 4. 创建管理员账户

```bash
docker-compose exec backend python scripts/create_admin.py
```

按提示输入用户名、邮箱和密码。

### 5. 上传法规文档

```bash
# 将文档放到data/documents目录
mkdir -p backend/data/documents
cp /path/to/your/regulations.pdf backend/data/documents/

# 处理文档
docker-compose exec backend python scripts/process_documents.py
```

### 6. 配置并部署前端

```bash
cd frontend

# 编辑config.js，修改后端API地址
nano js/config.js
```

修改 `BASE_URL`:

```javascript
const API_CONFIG = {
    BASE_URL: 'http://your-backend-server:8000',
    // ...
};
```

**部署选项**：

**选项1：本地开发**

```bash
# 使用Python启动本地服务器
python -m http.server 8080

# 或使用Node.js
npx serve
```

访问 http://localhost:8080

**选项2：部署到静态托管**

- **Vercel**: `vercel --prod`
- **Netlify**: 拖拽frontend文件夹到Netlify
- **GitHub Pages**: 推送到GitHub仓库并启用Pages

### 7. 访问系统

- **登录页面**: http://your-frontend-url
- **API文档**: http://your-backend-url:8000/docs
- **健康检查**: http://your-backend-url:8000/health

## 用户角色

### 员工 (Employee)
- ✅ 访问AI对话界面
- ✅ 查询法规问题
- ✅ 查看对话历史
- ❌ 无法访问管理后台

### 管理员 (Admin)
- ✅ 所有员工权限
- ✅ 访问管理后台
- ✅ 上传和管理文档
- ✅ 查看系统统计
- ✅ 监控系统活动

## 功能特性

### AI对话界面

- 💬 实时对话，基于RAG技术的准确回答
- 📝 Markdown格式支持
- 💾 对话历史保存
- 🔄 会话管理（新建、删除、切换）
- 🌓 浅色/深色主题切换
- 📱 响应式设计，支持移动端

### 管理后台

- 📊 Dashboard：系统概览和统计图表
- 📚 Knowledge Base：文档上传和管理
- 🤖 AI Chat：内嵌对话界面
- 📈 Activity Chart：系统活动可视化

### RAG系统

1. **文档处理**：支持PDF、Word、TXT格式
2. **文本分块**：智能分割，保持上下文连贯
3. **向量化**：使用bge-large-zh-v1.5模型
4. **相似度检索**：从知识库中检索相关内容
5. **上下文增强**：将检索结果作为上下文提供给LLM
6. **准确回答**：基于实际法规内容生成回答

## API文档

后端提供完整的REST API，访问 http://your-backend-url:8000/docs 查看Swagger UI文档。

### 主要接口

**认证**
- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册
- `GET /api/auth/me` - 获取当前用户

**对话**
- `POST /api/chat` - 发送消息
- `GET /api/conversations` - 获取对话列表
- `GET /api/conversations/{id}/messages` - 获取消息

**知识库**
- `POST /api/knowledge/upload` - 上传文档
- `GET /api/knowledge/documents` - 文档列表
- `GET /api/knowledge/stats` - 统计信息

## 部署指南

详细的部署步骤请参考：

- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Windows Server 2019 WSL2环境部署指南
- [BACKEND_EXPLANATION.md](BACKEND_EXPLANATION.md) - 后端架构详解
- [backend/README.md](backend/README.md) - 后端快速开始
- [frontend/README.md](frontend/README.md) - 前端部署说明

## 常见问题

### 1. 无法连接到Ollama

- 检查Ollama服务器是否运行
- 验证`OLLAMA_BASE_URL`配置
- 测试连接：`curl http://your-ollama-server:11434/api/tags`

### 2. 前端无法连接后端

- 检查后端是否运行
- 验证`BASE_URL`配置
- 检查CORS设置
- 查看浏览器控制台错误

### 3. 文档上传失败

- 检查文件格式（支持PDF、Word、TXT）
- 确认文件大小合理
- 查看后端日志

### 4. AI回答不准确

- 上传更多相关文档
- 调整RAG参数（`CHUNK_SIZE`、`TOP_K`）
- 优化提示词模板

## 性能优化

### 后端优化

- 使用PostgreSQL替代SQLite（生产环境）
- 调整ChromaDB配置
- 优化嵌入模型（使用GPU加速）
- 实现查询缓存

### 前端优化

- 启用CDN加速
- 压缩静态资源
- 实现懒加载
- 使用Service Worker缓存

## 安全建议

1. ✅ 使用HTTPS
2. ✅ 修改默认SECRET_KEY
3. ✅ 使用强密码
4. ✅ 配置防火墙
5. ✅ 定期备份数据
6. ✅ 更新依赖包

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License

## 联系方式

- GitHub: https://github.com/unkaku-1/Regulation-Searching
- Issues: https://github.com/unkaku-1/Regulation-Searching/issues

## 致谢

- Ollama - 本地LLM部署
- FastAPI - 现代化Web框架
- ChromaDB - 向量数据库
- Tailwind CSS - 实用优先的CSS框架
- Llama3.1 - Meta开源LLM模型

