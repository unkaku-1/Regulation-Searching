# Regulation-Searching 系统架构文档

## 1. 系统概述

Regulation-Searching 是一个基于本地LLM和RAG技术的企业级法规智能检索系统。本文档详细描述了系统的整体架构、技术选型和各模块之间的交互关系。

## 2. 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户浏览器                                │
│                    (React + TypeScript)                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS/WebSocket
┌─────────────────────────▼───────────────────────────────────────┐
│                      Nginx反向代理                                │
└─────────────────────────┬───────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
┌───────▼────────┐                 ┌────────▼────────┐
│   前端静态资源   │                 │   后端API服务    │
│   (React SPA)  │                 │   (FastAPI)     │
└────────────────┘                 └────────┬────────┘
                                            │
                          ┌─────────────────┼─────────────────┐
                          │                 │                 │
                  ┌───────▼────────┐ ┌──────▼──────┐ ┌───────▼────────┐
                  │  Ollama LLM    │ │  向量数据库  │ │  关系型数据库   │
                  │   (本地模型)    │ │ (ChromaDB)  │ │ (PostgreSQL)  │
                  └────────────────┘ └─────────────┘ └────────────────┘
```

## 3. 核心模块

### 3.1 前端模块 (Frontend)

**技术栈**: React 18, TypeScript, Tailwind CSS, Vite

**主要功能**:
- 用户界面展示（基于Figma设计稿）
- 对话交互管理
- 历史记录展示
- 实时消息推送（WebSocket）

**目录结构**:
```
frontend/
├── src/
│   ├── components/      # React组件
│   ├── pages/          # 页面组件
│   ├── hooks/          # 自定义Hooks
│   ├── services/       # API调用服务
│   ├── store/          # 状态管理
│   ├── types/          # TypeScript类型定义
│   ├── utils/          # 工具函数
│   └── App.tsx         # 应用入口
├── public/             # 静态资源
└── package.json
```

### 3.2 后端模块 (Backend)

**技术栈**: Python 3.11, FastAPI, LangChain, ChromaDB

**主要功能**:
- RESTful API接口
- 用户认证与授权
- 对话管理
- RAG系统集成
- Ollama LLM调用
- 知识库管理

**目录结构**:
```
backend/
├── app/
│   ├── api/            # API路由
│   ├── core/           # 核心配置
│   ├── models/         # 数据模型
│   ├── services/       # 业务逻辑
│   │   ├── llm/        # LLM服务
│   │   ├── rag/        # RAG系统
│   │   └── vector/     # 向量数据库操作
│   ├── schemas/        # Pydantic模型
│   └── main.py         # 应用入口
├── requirements.txt
└── Dockerfile
```

### 3.3 RAG系统

**核心组件**:

| 组件 | 说明 |
| :--- | :--- |
| **文档加载器** | 支持PDF、Word、TXT等格式的法规文档加载 |
| **文本分割器** | 将长文档分割成适合向量化的文本块 |
| **向量化模型** | 使用开源嵌入模型（如BGE、M3E）将文本转换为向量 |
| **向量数据库** | 存储和检索文档向量（ChromaDB或Faiss） |
| **检索器** | 根据用户查询检索最相关的文档片段 |
| **提示工程** | 构建包含检索内容的提示词，引导LLM生成准确回答 |

**工作流程**:
1. 用户输入查询问题
2. 将查询问题向量化
3. 在向量数据库中检索最相关的K个文档片段
4. 将检索到的内容与用户问题组合成提示词
5. 发送给Ollama LLM生成回答
6. 返回结果给用户

### 3.4 Ollama LLM服务

**模型选择**:
- **推荐模型**: Qwen2.5:7b、Llama3.1:8b
- **部署方式**: Docker容器化部署
- **API接口**: 兼容OpenAI API格式

**配置参数**:
```yaml
temperature: 0.7        # 控制生成文本的随机性
max_tokens: 2048       # 最大生成token数
top_p: 0.9             # 核采样参数
```

### 3.5 数据库设计

#### 关系型数据库（PostgreSQL）

**主要表结构**:

**users 表** - 用户信息
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| id | UUID | 主键 |
| username | VARCHAR(50) | 用户名 |
| password_hash | VARCHAR(255) | 密码哈希 |
| created_at | TIMESTAMP | 创建时间 |

**conversations 表** - 对话记录
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| id | UUID | 主键 |
| user_id | UUID | 用户ID（外键） |
| title | VARCHAR(200) | 对话标题 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**messages 表** - 消息记录
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| id | UUID | 主键 |
| conversation_id | UUID | 对话ID（外键） |
| role | VARCHAR(20) | 角色（user/assistant） |
| content | TEXT | 消息内容 |
| created_at | TIMESTAMP | 创建时间 |

#### 向量数据库（ChromaDB）

**集合结构**:
- **collection_name**: regulations
- **embedding_model**: bge-large-zh-v1.5
- **metadata**: 包含文档来源、章节、更新时间等信息

## 4. API接口设计

### 4.1 用户认证

```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/register
```

### 4.2 对话管理

```
GET    /api/conversations          # 获取对话列表
POST   /api/conversations          # 创建新对话
GET    /api/conversations/{id}     # 获取对话详情
DELETE /api/conversations/{id}     # 删除对话
```

### 4.3 消息处理

```
POST   /api/messages               # 发送消息
GET    /api/messages/{conversation_id}  # 获取对话消息
```

### 4.4 知识库管理

```
POST   /api/knowledge/upload       # 上传法规文档
GET    /api/knowledge/documents    # 获取文档列表
DELETE /api/knowledge/documents/{id}  # 删除文档
```

## 5. 部署架构

### 5.1 Docker Compose配置

系统使用Docker Compose进行容器编排，主要包含以下服务：

| 服务名 | 镜像 | 端口 | 说明 |
| :--- | :--- | :--- | :--- |
| frontend | nginx:alpine | 80, 443 | 前端静态资源服务 |
| backend | python:3.11-slim | 8000 | 后端API服务 |
| ollama | ollama/ollama | 11434 | LLM服务 |
| postgres | postgres:15 | 5432 | 关系型数据库 |
| chromadb | chromadb/chroma | 8001 | 向量数据库 |

### 5.2 网络配置

- **前端**: 通过Nginx反向代理访问，支持HTTPS
- **后端**: 仅内部网络访问，通过Nginx转发
- **数据库**: 仅内部网络访问，不对外暴露

## 6. 安全性考虑

### 6.1 数据安全
- 所有敏感数据加密存储
- 使用HTTPS加密传输
- 定期备份数据库

### 6.2 访问控制
- JWT Token认证
- 基于角色的权限管理（RBAC）
- API请求频率限制

### 6.3 本地化部署
- 所有服务部署在内网
- 不依赖任何外部云服务
- 数据不出本地网络

## 7. 性能优化

### 7.1 缓存策略
- Redis缓存常用查询结果
- 向量检索结果缓存
- 静态资源CDN缓存

### 7.2 并发处理
- 异步API处理
- 连接池管理
- 负载均衡

### 7.3 模型优化
- 使用量化模型减少内存占用
- 批处理请求提高吞吐量
- GPU加速推理（可选）

---

**文档版本**: 1.0
**创建日期**: 2025年10月20日
**作者**: Manus AI

