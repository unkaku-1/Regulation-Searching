# Regulation-Searching 后端开发说明

本文档详细解释后端系统的架构、各模块的功能以及关键代码的工作原理。

## 目录

1. [系统架构概览](#系统架构概览)
2. [核心模块详解](#核心模块详解)
3. [API接口说明](#api接口说明)
4. [数据流程](#数据流程)
5. [关键技术点](#关键技术点)

## 系统架构概览

后端系统采用分层架构设计：

```
┌─────────────────────────────────────────┐
│           API Layer (FastAPI)           │  ← 接收HTTP请求
├─────────────────────────────────────────┤
│         Business Logic Layer            │  ← 处理业务逻辑
│  (Services: LLM, RAG, Vector)          │
├─────────────────────────────────────────┤
│          Data Access Layer              │  ← 数据库操作
│     (Models, Schemas, Database)         │
├─────────────────────────────────────────┤
│         External Services               │  ← 外部服务
│  (Ollama, ChromaDB, File System)       │
└─────────────────────────────────────────┘
```

## 核心模块详解

### 1. 配置模块 (`app/core/`)

#### `config.py` - 应用配置

这个文件使用Pydantic的`BaseSettings`类来管理所有配置项。

**关键配置项**：

```python
class Settings(BaseSettings):
    # Ollama配置
    OLLAMA_BASE_URL: str = "http://localhost:11434"  # Ollama服务器地址
    OLLAMA_MODEL: str = "llama3.1:8b"                # 使用的模型
    
    # RAG配置
    CHUNK_SIZE: int = 1000      # 文档分块大小
    CHUNK_OVERLAP: int = 200    # 块之间的重叠字符数
    TOP_K: int = 5              # 检索返回的文档数量
```

**工作原理**：
- 从`.env`文件读取配置
- 提供类型验证
- 创建全局配置实例`settings`供其他模块使用

#### `security.py` - 安全认证

提供密码加密和JWT令牌管理功能。

**关键函数**：

```python
def get_password_hash(password: str) -> str:
    """使用bcrypt算法加密密码"""
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    """创建JWT访问令牌"""
    # 添加过期时间
    # 使用SECRET_KEY签名
    # 返回编码后的令牌
```

**安全特性**：
- 密码使用bcrypt加密（不可逆）
- JWT令牌有过期时间
- 令牌包含用户信息但不包含密码

#### `database.py` - 数据库连接

管理SQLAlchemy数据库连接。

```python
engine = create_engine(DATABASE_URL)  # 创建数据库引擎
SessionLocal = sessionmaker(bind=engine)  # 创建会话工厂

def get_db():
    """依赖注入：为每个请求提供数据库会话"""
    db = SessionLocal()
    try:
        yield db  # 返回会话
    finally:
        db.close()  # 请求结束后关闭会话
```

### 2. 数据模型 (`app/models/`)

#### `user.py` - 用户模型

```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True)
    username = Column(String(50), unique=True)
    hashed_password = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    # 关系：一个用户可以有多个对话
    conversations = relationship("Conversation", back_populates="user")
```

#### `conversation.py` - 对话和消息模型

```python
class Conversation(Base):
    """对话模型 - 存储对话元信息"""
    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id"))
    title = Column(String(200))
    
    # 关系
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation")

class Message(Base):
    """消息模型 - 存储具体的对话内容"""
    id = Column(String(36), primary_key=True)
    conversation_id = Column(String(36), ForeignKey("conversations.id"))
    role = Column(String(20))  # "user" 或 "assistant"
    content = Column(Text)
```

**数据关系**：
```
User (1) ──── (N) Conversation (1) ──── (N) Message
```

### 3. 服务层 (`app/services/`)

#### `llm/ollama_service.py` - Ollama LLM服务

负责与Ollama服务器通信。

**核心方法**：

```python
async def generate(self, prompt: str) -> str:
    """
    调用Ollama生成文本
    
    工作流程：
    1. 构建请求payload
    2. 发送POST请求到 /api/generate
    3. 解析响应并返回生成的文本
    """
    url = f"{self.base_url}/api/generate"
    payload = {
        "model": self.model,
        "prompt": prompt,
        "stream": False  # 不使用流式输出
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        return response.json()["response"]
```

**为什么使用异步**：
- FastAPI是异步框架
- 避免阻塞其他请求
- 提高并发处理能力

#### `vector/chroma_service.py` - 向量数据库服务

管理文档的向量化和检索。

**核心方法**：

```python
def embed_texts(self, texts: List[str]) -> List[List[float]]:
    """
    将文本转换为向量
    
    使用sentence-transformers模型：
    - 输入：文本列表
    - 输出：向量列表（每个向量是一个浮点数数组）
    """
    embeddings = self.embedding_model.encode(texts)
    return embeddings.tolist()

def search(self, query: str, top_k: int = 5) -> Dict:
    """
    搜索相关文档
    
    工作流程：
    1. 将查询文本向量化
    2. 在向量数据库中查找最相似的K个向量
    3. 返回对应的文档内容
    """
    query_embedding = self.embed_texts([query])[0]
    results = self.collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k
    )
    return results
```

**向量相似度原理**：
- 文本被转换为高维向量（例如768维）
- 使用余弦相似度计算向量之间的相似性
- 相似的文本在向量空间中距离较近

#### `rag/rag_service.py` - RAG服务

整合向量检索和LLM生成。

**核心工作流程**：

```python
async def query(self, question: str) -> Dict:
    """
    RAG查询流程：
    
    1. 向量检索阶段
       ├─ 将用户问题向量化
       ├─ 在向量数据库中检索相关文档
       └─ 获取Top-K个最相关的文档片段
    
    2. 上下文构建阶段
       ├─ 将检索到的文档格式化
       └─ 构建包含上下文的提示词
    
    3. 生成阶段
       ├─ 将提示词发送给LLM
       └─ 获取并返回生成的回答
    """
    # 1. 检索
    search_results = self.vector_service.search(question)
    
    # 2. 构建上下文
    context = self._build_context(search_results)
    prompt = self._build_prompt(question, context)
    
    # 3. 生成
    answer = await self.llm_service.generate(prompt)
    
    return {"answer": answer, "sources": [...]}
```

**提示词模板示例**：

```
你是一个专业的法规咨询助手。请基于以下参考资料回答用户的问题。

参考资料：
[参考资料 1] (来源: 劳动法.pdf)
第三十六条 国家实行劳动者每日工作时间不超过八小时...

[参考资料 2] (来源: 劳动合同法.pdf)
第四条 用人单位应当依法建立和完善劳动规章制度...

用户问题：员工每天的工作时间是多少？

请注意：
1. 优先使用参考资料中的信息来回答问题
2. 如果参考资料中没有相关信息，请明确告知用户
3. 回答要准确、专业、易懂

回答：
```

#### `rag/document_processor.py` - 文档处理

处理不同格式的文档并分块。

**文档处理流程**：

```python
def process_document(self, file_path: str) -> Dict:
    """
    文档处理流程：
    
    1. 读取文件
       ├─ PDF: 使用pypdf提取文本
       ├─ Word: 使用python-docx提取文本
       └─ TXT: 直接读取
    
    2. 文本分块
       ├─ 使用RecursiveCharacterTextSplitter
       ├─ 按照chunk_size分割
       └─ 保持chunk_overlap重叠
    
    3. 生成元数据
       └─ 记录来源文件、块索引等信息
    """
    text = self.read_file(file_path)
    chunks = self.split_text(text)
    metadatas = [{"source": file_name, "chunk_index": i} 
                 for i in range(len(chunks))]
    
    return {"chunks": chunks, "metadatas": metadatas}
```

**为什么要分块**：
- LLM有输入长度限制
- 小块更容易匹配用户查询
- 提高检索精度

### 4. API路由 (`app/api/`)

#### `auth.py` - 认证API

```python
@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm, db: Session):
    """
    登录流程：
    1. 验证用户名和密码
    2. 检查用户是否激活
    3. 生成JWT令牌
    4. 返回令牌
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}
```

**认证流程**：
```
客户端 ──[用户名+密码]──> 服务器
                           ├─ 验证密码
                           └─ 生成JWT令牌
客户端 <──[access_token]── 服务器

后续请求：
客户端 ──[Authorization: Bearer token]──> 服务器
                                          ├─ 解析令牌
                                          ├─ 验证签名
                                          └─ 获取用户信息
```

#### `chat.py` - 聊天API

```python
@router.post("")
async def chat(request: ChatRequest, current_user: User, db: Session):
    """
    聊天流程：
    
    1. 验证或创建对话
       ├─ 如果有conversation_id，验证对话存在
       └─ 如果没有，创建新对话
    
    2. 保存用户消息
       └─ 存入messages表
    
    3. 获取对话历史
       └─ 查询该对话的所有消息
    
    4. 调用RAG服务生成回答
       ├─ 检索相关文档
       └─ 生成回答
    
    5. 保存AI回答
       └─ 存入messages表
    
    6. 返回结果
    """
```

#### `knowledge.py` - 知识库管理API

```python
@router.post("/upload")
async def upload_document(file: UploadFile):
    """
    文档上传流程：
    
    1. 验证文件类型
       └─ 只允许PDF、DOCX、TXT
    
    2. 保存文件
       └─ 存到data/documents目录
    
    3. 处理文档
       ├─ 提取文本
       └─ 分块
    
    4. 向量化并存储
       ├─ 将文本块转换为向量
       └─ 存入ChromaDB
    
    5. 返回结果
    """
```

## 数据流程

### 用户查询流程

```
用户输入问题
    ↓
[前端] 发送POST /api/chat
    ↓
[后端] 接收请求
    ↓
[认证] 验证JWT令牌
    ↓
[数据库] 保存用户消息
    ↓
[RAG服务] 开始处理
    ├─ [向量服务] 将问题向量化
    ├─ [ChromaDB] 检索相关文档
    ├─ [RAG服务] 构建提示词
    └─ [Ollama] 生成回答
    ↓
[数据库] 保存AI回答
    ↓
[后端] 返回响应
    ↓
[前端] 显示回答
```

### 文档上传流程

```
管理员上传文档
    ↓
[后端] 保存文件到磁盘
    ↓
[文档处理器] 读取文件
    ├─ PDF → pypdf提取文本
    ├─ Word → python-docx提取文本
    └─ TXT → 直接读取
    ↓
[文档处理器] 文本分块
    └─ RecursiveCharacterTextSplitter
    ↓
[向量服务] 文本向量化
    └─ sentence-transformers模型
    ↓
[ChromaDB] 存储向量
    ↓
完成
```

## 关键技术点

### 1. 异步编程

**为什么使用async/await**：

```python
# 同步方式（阻塞）
def slow_function():
    time.sleep(5)  # 阻塞5秒，期间无法处理其他请求
    return "done"

# 异步方式（非阻塞）
async def fast_function():
    await asyncio.sleep(5)  # 等待期间可以处理其他请求
    return "done"
```

**FastAPI中的异步**：
- 路由函数使用`async def`
- 调用外部服务使用`await`
- 提高并发处理能力

### 2. 依赖注入

FastAPI的依赖注入系统：

```python
# 定义依赖
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 使用依赖
@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    # db会自动注入
    # 请求结束后自动关闭
    return db.query(User).all()
```

**优点**：
- 自动管理资源
- 代码复用
- 易于测试

### 3. Pydantic模型验证

```python
class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str  # 必填字段

# FastAPI自动验证
@router.post("/chat")
async def chat(request: ChatRequest):
    # 如果message为空，自动返回422错误
    # 如果类型不对，自动返回422错误
    pass
```

### 4. 向量相似度搜索

**原理**：

```
文本 "劳动时间" → 向量化 → [0.23, 0.45, 0.12, ...]
                                    ↓
                              计算余弦相似度
                                    ↓
数据库中的向量 [0.25, 0.43, 0.15, ...] → 相似度: 0.95
数据库中的向量 [0.01, 0.89, 0.32, ...] → 相似度: 0.32
```

**余弦相似度公式**：
```
similarity = (A · B) / (||A|| × ||B||)
```

值越接近1，越相似。

### 5. RAG提示词工程

**好的提示词特点**：
1. 明确角色定位
2. 提供上下文
3. 给出具体指令
4. 设定输出格式

**示例对比**：

❌ 差的提示词：
```
回答这个问题：员工工作时间是多少？
```

✅ 好的提示词：
```
你是一个专业的法规咨询助手。

参考资料：
[劳动法第36条] 国家实行劳动者每日工作时间不超过八小时...

用户问题：员工工作时间是多少？

请基于参考资料回答，如果参考资料中没有信息，请明确说明。
```

## 性能优化建议

### 1. 数据库查询优化

```python
# ❌ N+1查询问题
conversations = db.query(Conversation).all()
for conv in conversations:
    messages = db.query(Message).filter(
        Message.conversation_id == conv.id
    ).all()  # 每次循环都查询数据库

# ✅ 使用join一次性获取
conversations = db.query(Conversation).options(
    joinedload(Conversation.messages)
).all()
```

### 2. 缓存常用查询

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_user_by_id(user_id: str):
    # 结果会被缓存
    return db.query(User).filter(User.id == user_id).first()
```

### 3. 批量处理

```python
# ❌ 逐个添加文档
for chunk in chunks:
    chroma_service.add_documents([chunk], [metadata])

# ✅ 批量添加
chroma_service.add_documents(chunks, metadatas)
```

## 常见问题

### Q: 为什么使用UUID而不是自增ID？

A: 
- UUID是全局唯一的，适合分布式系统
- 不会泄露数据量信息
- 可以在客户端生成

### Q: 为什么密码要加密存储？

A:
- 即使数据库泄露，攻击者也无法获取明文密码
- bcrypt是单向加密，无法解密
- 每次加密结果不同（加盐）

### Q: 为什么要分块存储文档？

A:
- LLM输入长度有限制
- 小块更精确匹配查询
- 减少无关信息干扰

### Q: 如何调整RAG效果？

A:
可以调整以下参数：
- `CHUNK_SIZE`: 文档块大小
- `CHUNK_OVERLAP`: 块之间重叠
- `TOP_K`: 检索文档数量
- 提示词模板
- 嵌入模型

## 总结

后端系统的核心是**RAG（检索增强生成）**技术：

1. **检索**：从向量数据库中找到相关文档
2. **增强**：将文档作为上下文添加到提示词
3. **生成**：LLM基于上下文生成准确回答

这种方式结合了：
- 传统搜索的精确性
- LLM的理解和生成能力
- 本地部署的安全性

通过合理的架构设计和模块划分，系统具有良好的可维护性和可扩展性。

