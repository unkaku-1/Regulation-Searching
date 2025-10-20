# Regulation-Searching 部署指南

本文档详细说明如何在Windows Server 2019的WSL2 Ubuntu环境中部署Regulation-Searching系统。

## 1. 环境准备

### 1.1 系统要求

**硬件要求**:
- CPU: 4核心以上
- 内存: 16GB以上（推荐32GB，用于运行LLM模型）
- 硬盘: 100GB以上可用空间
- GPU: 可选，支持CUDA的NVIDIA显卡可加速推理

**软件要求**:
- Windows Server 2019
- WSL2 (Ubuntu 22.04)
- Docker Desktop for Windows
- Git

### 1.2 安装WSL2和Ubuntu

如果您还没有安装WSL2，请按照以下步骤操作：

**步骤1**: 以管理员身份打开PowerShell，运行以下命令启用WSL：

```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

**步骤2**: 重启计算机。

**步骤3**: 下载并安装WSL2 Linux内核更新包：
- 访问 https://aka.ms/wsl2kernel
- 下载并安装更新包

**步骤4**: 将WSL2设置为默认版本：

```powershell
wsl --set-default-version 2
```

**步骤5**: 安装Ubuntu 22.04：

```powershell
wsl --install -d Ubuntu-22.04
```

**步骤6**: 首次启动Ubuntu，设置用户名和密码。

### 1.3 安装Docker Desktop

**步骤1**: 下载Docker Desktop for Windows：
- 访问 https://www.docker.com/products/docker-desktop
- 下载并安装

**步骤2**: 启动Docker Desktop，在设置中确保：
- 勾选 "Use the WSL 2 based engine"
- 在 "Resources" > "WSL Integration" 中启用Ubuntu-22.04

**步骤3**: 在WSL2 Ubuntu中验证Docker安装：

```bash
docker --version
docker-compose --version
```

### 1.4 安装Git

在WSL2 Ubuntu中安装Git：

```bash
sudo apt update
sudo apt install git -y
```

## 2. 克隆项目代码

**步骤1**: 在WSL2 Ubuntu中打开终端。

**步骤2**: 克隆项目仓库：

```bash
cd ~
git clone https://github.com/unkaku-1/Regulation-Searching.git
cd Regulation-Searching
```

## 3. 配置环境变量

**步骤1**: 创建环境变量文件：

```bash
cp .env.example .env
```

**步骤2**: 编辑`.env`文件，配置以下参数：

```bash
nano .env
```

**环境变量说明**:

```env
# 数据库配置
POSTGRES_USER=regulation_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=regulation_db
DATABASE_URL=postgresql://regulation_user:your_secure_password_here@postgres:5432/regulation_db

# JWT密钥（请生成一个随机字符串）
SECRET_KEY=your_secret_key_here

# Ollama配置
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=qwen2.5:7b

# ChromaDB配置
CHROMA_HOST=chromadb
CHROMA_PORT=8001

# 前端配置
VITE_API_BASE_URL=http://localhost:8000/api
```

**生成SECRET_KEY的方法**:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

将生成的字符串复制到`.env`文件中的`SECRET_KEY`字段。

## 4. 构建和启动服务

### 4.1 使用Docker Compose部署

**步骤1**: 构建Docker镜像：

```bash
docker-compose build
```

这个过程可能需要10-20分钟，取决于您的网络速度。

**步骤2**: 启动所有服务：

```bash
docker-compose up -d
```

**步骤3**: 查看服务状态：

```bash
docker-compose ps
```

您应该看到以下服务都处于运行状态：
- frontend
- backend
- ollama
- postgres
- chromadb

### 4.2 下载LLM模型

首次启动时，需要下载Ollama模型。

**步骤1**: 进入Ollama容器：

```bash
docker-compose exec ollama bash
```

**步骤2**: 下载模型（以Qwen2.5:7b为例）：

```bash
ollama pull qwen2.5:7b
```

模型下载可能需要较长时间（约4-5GB），请耐心等待。

**步骤3**: 验证模型是否下载成功：

```bash
ollama list
```

**步骤4**: 退出容器：

```bash
exit
```

### 4.3 初始化数据库

**步骤1**: 运行数据库迁移：

```bash
docker-compose exec backend alembic upgrade head
```

**步骤2**: 创建管理员账户（可选）：

```bash
docker-compose exec backend python -m app.scripts.create_admin
```

按照提示输入管理员用户名和密码。

## 5. 上传法规文档

### 5.1 准备法规文档

将您的法规文档（PDF、Word、TXT格式）放在`data/documents`目录下：

```bash
mkdir -p data/documents
# 将您的文档复制到这个目录
```

### 5.2 执行文档向量化

**步骤1**: 运行文档处理脚本：

```bash
docker-compose exec backend python -m app.scripts.process_documents
```

**步骤2**: 查看处理进度：

脚本会显示每个文档的处理状态。处理时间取决于文档数量和大小。

## 6. 访问系统

### 6.1 访问前端界面

在Windows主机的浏览器中访问：

```
http://localhost
```

或者在WSL2中查看分配的IP地址：

```bash
ip addr show eth0 | grep inet
```

使用显示的IP地址访问，例如：`http://172.x.x.x`

### 6.2 API文档

访问后端API文档（Swagger UI）：

```
http://localhost:8000/docs
```

## 7. 日常运维

### 7.1 查看日志

**查看所有服务日志**:
```bash
docker-compose logs -f
```

**查看特定服务日志**:
```bash
docker-compose logs -f backend
docker-compose logs -f ollama
```

### 7.2 重启服务

**重启所有服务**:
```bash
docker-compose restart
```

**重启特定服务**:
```bash
docker-compose restart backend
```

### 7.3 停止服务

```bash
docker-compose down
```

**停止并删除所有数据**（谨慎使用）:
```bash
docker-compose down -v
```

### 7.4 备份数据

**备份数据库**:
```bash
docker-compose exec postgres pg_dump -U regulation_user regulation_db > backup_$(date +%Y%m%d).sql
```

**备份向量数据库**:
```bash
docker-compose exec chromadb tar -czf /tmp/chroma_backup.tar.gz /chroma/data
docker cp regulation-searching_chromadb_1:/tmp/chroma_backup.tar.gz ./chroma_backup_$(date +%Y%m%d).tar.gz
```

### 7.5 更新系统

**步骤1**: 拉取最新代码：

```bash
git pull origin master
```

**步骤2**: 重新构建镜像：

```bash
docker-compose build
```

**步骤3**: 重启服务：

```bash
docker-compose down
docker-compose up -d
```

**步骤4**: 运行数据库迁移（如有）：

```bash
docker-compose exec backend alembic upgrade head
```

## 8. 故障排查

### 8.1 常见问题

**问题1**: Docker服务无法启动

**解决方案**:
- 确保Docker Desktop正在运行
- 检查WSL2集成是否启用
- 重启Docker Desktop

**问题2**: Ollama模型加载失败

**解决方案**:
- 检查内存是否充足（至少需要8GB可用内存）
- 重新下载模型：`docker-compose exec ollama ollama pull qwen2.5:7b`

**问题3**: 前端无法连接后端

**解决方案**:
- 检查`.env`文件中的`VITE_API_BASE_URL`配置
- 确认后端服务正在运行：`docker-compose ps backend`
- 查看后端日志：`docker-compose logs backend`

**问题4**: 数据库连接失败

**解决方案**:
- 检查`.env`文件中的数据库配置
- 确认PostgreSQL服务正在运行：`docker-compose ps postgres`
- 查看数据库日志：`docker-compose logs postgres`

### 8.2 性能优化建议

**优化1**: 如果系统响应较慢，可以考虑：
- 使用更小的模型（如qwen2.5:3b）
- 增加服务器内存
- 使用GPU加速（需要NVIDIA GPU和CUDA支持）

**优化2**: 如果检索不准确，可以调整RAG参数：
- 修改`backend/app/services/rag/config.py`中的检索参数
- 调整chunk_size和chunk_overlap
- 尝试不同的embedding模型

## 9. 安全建议

### 9.1 网络安全

- 不要将服务直接暴露到公网
- 使用防火墙限制访问
- 定期更新系统和依赖包

### 9.2 数据安全

- 定期备份数据
- 使用强密码
- 加密敏感数据

### 9.3 访问控制

- 为不同用户设置不同的权限
- 定期审查用户访问日志
- 及时删除不再使用的账户

## 10. 获取帮助

如果您在部署过程中遇到问题，可以：

1. 查看项目的GitHub Issues：https://github.com/unkaku-1/Regulation-Searching/issues
2. 查阅相关文档：
   - [需求文档](../requirements.md)
   - [架构文档](./architecture.md)
3. 提交新的Issue描述您的问题

---

**文档版本**: 1.0
**创建日期**: 2025年10月20日
**作者**: Manus AI

