"""
RAG (检索增强生成) 服务模块
"""
from typing import List, Dict, Optional
from app.services.llm.ollama_service import ollama_service
from app.services.vector.chroma_service import chroma_service
from app.core.config import settings


class RAGService:
    """RAG服务类"""
    
    def __init__(self):
        self.llm_service = ollama_service
        self.vector_service = chroma_service
    
    def _build_context(self, search_results: Dict) -> str:
        """
        构建上下文
        
        Args:
            search_results: 向量搜索结果
            
        Returns:
            格式化的上下文字符串
        """
        documents = search_results.get("documents", [[]])[0]
        metadatas = search_results.get("metadatas", [[]])[0]
        
        if not documents:
            return ""
        
        context_parts = []
        for i, (doc, metadata) in enumerate(zip(documents, metadatas), 1):
            source = metadata.get("source", "未知来源") if metadata else "未知来源"
            context_parts.append(f"[参考资料 {i}] (来源: {source})\n{doc}\n")
        
        return "\n".join(context_parts)
    
    def _build_prompt(self, query: str, context: str) -> str:
        """
        构建提示词
        
        Args:
            query: 用户查询
            context: 检索到的上下文
            
        Returns:
            完整的提示词
        """
        if context:
            prompt = f"""你是一个专业的法规咨询助手。请基于以下参考资料回答用户的问题。

参考资料：
{context}

用户问题：{query}

请注意：
1. 优先使用参考资料中的信息来回答问题
2. 如果参考资料中没有相关信息，请明确告知用户
3. 回答要准确、专业、易懂
4. 如果引用了参考资料，请标注来源

回答："""
        else:
            prompt = f"""你是一个专业的法规咨询助手。用户向你提出了以下问题，但是知识库中没有找到相关的法规信息。

用户问题：{query}

请礼貌地告知用户当前知识库中没有相关信息，并建议用户：
1. 尝试用不同的关键词重新提问
2. 提供更多背景信息
3. 联系管理员添加相关法规文档

回答："""
        
        return prompt
    
    async def query(
        self,
        question: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        top_k: int = None
    ) -> Dict[str, any]:
        """
        执行RAG查询
        
        Args:
            question: 用户问题
            conversation_history: 对话历史
            top_k: 检索文档数量
            
        Returns:
            包含回答和来源的字典
        """
        # 检索相关文档
        search_results = self.vector_service.search(question, top_k=top_k)
        
        # 构建上下文
        context = self._build_context(search_results)
        
        # 构建提示词
        prompt = self._build_prompt(question, context)
        
        # 生成回答
        answer = await self.llm_service.generate(
            prompt=prompt,
            temperature=0.7,
            max_tokens=2048
        )
        
        # 提取来源信息
        sources = []
        metadatas = search_results.get("metadatas", [[]])[0]
        for metadata in metadatas:
            if metadata:
                source = metadata.get("source", "")
                if source and source not in sources:
                    sources.append(source)
        
        return {
            "answer": answer,
            "sources": sources,
            "context": context
        }
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        use_rag: bool = True
    ) -> str:
        """
        对话接口
        
        Args:
            messages: 消息历史
            use_rag: 是否使用RAG
            
        Returns:
            助手回复
        """
        if not use_rag or not messages:
            # 不使用RAG，直接调用LLM
            return await self.llm_service.chat(messages)
        
        # 获取最后一条用户消息
        last_user_message = None
        for msg in reversed(messages):
            if msg.get("role") == "user":
                last_user_message = msg.get("content")
                break
        
        if not last_user_message:
            return await self.llm_service.chat(messages)
        
        # 使用RAG
        result = await self.query(last_user_message)
        return result["answer"]


# 创建全局实例
rag_service = RAGService()

