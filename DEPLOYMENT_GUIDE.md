# Regulation-Searching 部署指南

本指南将帮助您在Windows Server 2019的WSL2 Ubuntu环境中部署Regulation-Searching后端系统。

## 前提条件

在开始之前，请确保您已经：

1. ✅ 在Windows Server 2019上安装了WSL2和Ubuntu 22.04
2. ✅ 安装了Docker Desktop for Windows并启用了WSL2集成
3. ✅ 在另一台服务器上部署了Ollama并运行了Llama3.1:8b模型
4. ✅ 安装了Git

## 第一步：克隆项目代码

打开WSL2 Ubuntu终端，执行以下命令：

```bash
# 进入主目录
cd ~

# 克隆项目
git clone https://github.com/unkaku-1/Regulation-Searching.git

# 进入项目目录
cd Regulation-Searching
```

## 第二步：配置环境变量

### 2.1 创建环境配置文件

```bash
# 复制示例配置文件
cp backend/.env.example backend/.env
```

### 2.2 编辑配置文件

使用文本编辑器打开`.env`文件：

```bash
nano backend/.env
```

**重要配置项说明**：

```env
# Ollama服务器配置（必须修改）
OLLAMA_BASE_URL=http://你的Ollama服务器IP:11434
OLLAMA_MODEL=llama3.1:8b

# JWT密钥（必须修改，用于用户认证）
SECRET_KEY=请生成一个随机字符串替换这里

# 其他配置可以保持默认值
```

**生成SECRET_KEY的方法**：

在终端执行以下命令生成随机密钥：

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

将生成的字符串复制到`.env`文件的`SECRET_KEY`字段。

**保存文件**：
- 按`Ctrl + O`保存
- 按`Enter`确认
- 按`Ctrl + X`退出

### 2.3 验证Ollama服务器连接

测试是否能连接到Ollama服务器：

```bash
curl http://你的Ollama服务器IP:11434/api/tags
```

如果返回JSON格式的模型列表，说明连接正常。

## 第三步：启动服务

### 3.1 使用Docker Compose启动

```bash
# 确保在项目根目录
cd ~/Regulation-Searching

# 启动所有服务
docker-compose up -d
```

这个命令会：
- 构建后端Docker镜像（首次运行需要几分钟）
- 启动后端API服务（端口8000）
- 启动ChromaDB向量数据库（端口8001）

### 3.2 查看服务状态

```bash
# 查看运行中的容器
docker-compose ps

# 查看日志
docker-compose logs -f
```

您应该看到类似这样的输出：

```
NAME                    STATUS              PORTS
regulation-backend      Up 2 minutes        0.0.0.0:8000->8000/tcp
regulation-chromadb     Up 2 minutes        0.0.0.0:8001->8000/tcp
```

按`Ctrl + C`退出日志查看。

## 第四步：创建管理员账户

```bash
# 进入后端容器
docker-compose exec backend bash

# 创建管理员用户
python scripts/create_admin.py
```

按照提示输入：
- Username（用户名）
- Email（邮箱，可选）
- Password（密码）
- Confirm Password（确认密码）

创建成功后，输入`exit`退出容器。

## 第五步：上传法规文档

### 5.1 准备文档

将您的法规文档（PDF、Word、TXT格式）放到`backend/data/documents`目录：

```bash
# 创建文档目录（如果不存在）
mkdir -p backend/data/documents

# 复制您的文档到这个目录
# 例如：
# cp /path/to/your/regulation.pdf backend/data/documents/
```

### 5.2 处理文档并添加到知识库

```bash
# 进入后端容器
docker-compose exec backend bash

# 处理所有文档
python scripts/process_documents.py

# 退出容器
exit
```

脚本会显示处理进度和结果。

## 第六步：测试API

### 6.1 访问API文档

在浏览器中打开：

```
http://你的服务器IP:8000/docs
```

您会看到Swagger UI界面，可以测试所有API接口。

### 6.2 健康检查

```bash
curl http://localhost:8000/health
```

应该返回：

```json
{
  "status": "healthy",
  "database": "connected",
  "ollama": "connected"
}
```

### 6.3 测试登录

使用之前创建的管理员账户登录：

1. 在Swagger UI中找到`POST /api/auth/login`接口
2. 点击"Try it out"
3. 输入用户名和密码
4. 点击"Execute"
5. 复制返回的`access_token`

### 6.4 测试聊天

1. 在Swagger UI顶部点击"Authorize"按钮
2. 输入`Bearer 你的access_token`（注意Bearer后面有空格）
3. 点击"Authorize"
4. 找到`POST /api/chat`接口
5. 输入测试消息并执行

## 常用操作命令

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 只查看后端日志
docker-compose logs -f backend

# 只查看ChromaDB日志
docker-compose logs -f chromadb
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 只重启后端
docker-compose restart backend
```

### 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除所有数据（谨慎使用！）
docker-compose down -v
```

### 更新代码

```bash
# 拉取最新代码
git pull origin master

# 重新构建并启动
docker-compose up -d --build
```

## 故障排查

### 问题1：无法连接到Ollama

**症状**：API返回"ollama: disconnected"

**解决方案**：
1. 检查Ollama服务器是否运行：`curl http://Ollama服务器IP:11434/api/tags`
2. 检查`.env`文件中的`OLLAMA_BASE_URL`配置是否正确
3. 检查防火墙是否允许访问11434端口

### 问题2：ChromaDB连接失败

**症状**：后端日志显示ChromaDB连接错误

**解决方案**：
1. 检查ChromaDB容器是否运行：`docker-compose ps chromadb`
2. 重启ChromaDB：`docker-compose restart chromadb`
3. 查看ChromaDB日志：`docker-compose logs chromadb`

### 问题3：文档处理失败

**症状**：运行`process_documents.py`时报错

**解决方案**：
1. 检查文档格式是否支持（PDF、DOCX、TXT）
2. 确保文档没有损坏
3. 查看详细错误信息并根据提示修复

### 问题4：内存不足

**症状**：容器频繁重启或服务响应缓慢

**解决方案**：
1. 检查系统内存使用：`free -h`
2. 考虑使用更小的嵌入模型（修改`.env`中的`EMBEDDING_MODEL`）
3. 增加服务器内存

## 安全建议

1. **修改默认密钥**：确保修改了`.env`中的`SECRET_KEY`
2. **使用强密码**：为管理员账户设置强密码
3. **限制访问**：配置防火墙，只允许内网访问API
4. **定期备份**：定期备份数据库和文档
5. **更新系统**：定期更新Docker镜像和系统包

## 备份和恢复

### 备份数据

```bash
# 备份数据库
docker-compose exec backend tar -czf /tmp/backup.tar.gz data/

# 复制到主机
docker cp regulation-backend:/tmp/backup.tar.gz ./backup_$(date +%Y%m%d).tar.gz

# 备份ChromaDB
docker-compose exec chromadb tar -czf /tmp/chroma_backup.tar.gz /chroma/chroma
docker cp regulation-chromadb:/tmp/chroma_backup.tar.gz ./chroma_backup_$(date +%Y%m%d).tar.gz
```

### 恢复数据

```bash
# 恢复数据库
docker cp backup.tar.gz regulation-backend:/tmp/
docker-compose exec backend tar -xzf /tmp/backup.tar.gz -C /app/

# 恢复ChromaDB
docker cp chroma_backup.tar.gz regulation-chromadb:/tmp/
docker-compose exec chromadb tar -xzf /tmp/chroma_backup.tar.gz -C /
```

## 下一步

后端部署完成后，您可以：

1. 开始开发前端界面
2. 添加更多法规文档到知识库
3. 根据实际需求调整RAG参数
4. 配置HTTPS和域名（生产环境）

如有问题，请查看项目的GitHub Issues或联系技术支持。

