"""
ChromaDB向量数据库服务模块
"""
import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Optional
from sentence_transformers import SentenceTransformer
from app.core.config import settings


class ChromaService:
    """ChromaDB服务类"""
    
    def __init__(self):
        """初始化ChromaDB客户端和嵌入模型"""
        # 初始化ChromaDB客户端
        self.client = chromadb.HttpClient(
            host=settings.CHROMA_HOST,
            port=settings.CHROMA_PORT,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        
        # 初始化嵌入模型
        self.embedding_model = SentenceTransformer(
            settings.EMBEDDING_MODEL,
            device=settings.EMBEDDING_DEVICE
        )
        
        # 获取或创建集合
        self.collection = self.client.get_or_create_collection(
            name=settings.CHROMA_COLLECTION_NAME,
            metadata={"description": "法规文档向量集合"}
        )
    
    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """
        将文本转换为向量
        
        Args:
            texts: 文本列表
            
        Returns:
            向量列表
        """
        embeddings = self.embedding_model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()
    
    def add_documents(
        self,
        documents: List[str],
        metadatas: Optional[List[Dict]] = None,
        ids: Optional[List[str]] = None
    ) -> None:
        """
        添加文档到向量数据库
        
        Args:
            documents: 文档文本列表
            metadatas: 元数据列表
            ids: 文档ID列表
        """
        embeddings = self.embed_texts(documents)
        
        if ids is None:
            import uuid
            ids = [str(uuid.uuid4()) for _ in documents]
        
        self.collection.add(
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
    
    def search(
        self,
        query: str,
        top_k: int = None
    ) -> Dict:
        """
        搜索相关文档
        
        Args:
            query: 查询文本
            top_k: 返回结果数量
            
        Returns:
            搜索结果
        """
        if top_k is None:
            top_k = settings.TOP_K
        
        query_embedding = self.embed_texts([query])[0]
        
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )
        
        return results
    
    def delete_collection(self) -> None:
        """删除集合"""
        self.client.delete_collection(settings.CHROMA_COLLECTION_NAME)
    
    def count(self) -> int:
        """获取文档数量"""
        return self.collection.count()


# 创建全局实例
chroma_service = ChromaService()

