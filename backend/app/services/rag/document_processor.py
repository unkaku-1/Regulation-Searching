"""
文档处理模块
"""
import os
from typing import List, Dict
from pathlib import Path
from pypdf import PdfReader
from docx import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from app.core.config import settings


class DocumentProcessor:
    """文档处理类"""
    
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            separators=["\n\n", "\n", "。", "！", "？", "；", " ", ""]
        )
    
    def read_pdf(self, file_path: str) -> str:
        """
        读取PDF文件
        
        Args:
            file_path: PDF文件路径
            
        Returns:
            文本内容
        """
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    
    def read_docx(self, file_path: str) -> str:
        """
        读取Word文档
        
        Args:
            file_path: Word文件路径
            
        Returns:
            文本内容
        """
        doc = Document(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    
    def read_txt(self, file_path: str) -> str:
        """
        读取文本文件
        
        Args:
            file_path: 文本文件路径
            
        Returns:
            文本内容
        """
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    
    def read_file(self, file_path: str) -> str:
        """
        根据文件类型读取文件
        
        Args:
            file_path: 文件路径
            
        Returns:
            文本内容
        """
        ext = Path(file_path).suffix.lower()
        
        if ext == '.pdf':
            return self.read_pdf(file_path)
        elif ext in ['.docx', '.doc']:
            return self.read_docx(file_path)
        elif ext == '.txt':
            return self.read_txt(file_path)
        else:
            raise ValueError(f"不支持的文件类型: {ext}")
    
    def split_text(self, text: str) -> List[str]:
        """
        分割文本
        
        Args:
            text: 文本内容
            
        Returns:
            文本块列表
        """
        return self.text_splitter.split_text(text)
    
    def process_document(self, file_path: str) -> Dict:
        """
        处理文档
        
        Args:
            file_path: 文件路径
            
        Returns:
            包含文本块和元数据的字典
        """
        # 读取文件
        text = self.read_file(file_path)
        
        # 分割文本
        chunks = self.split_text(text)
        
        # 生成元数据
        file_name = Path(file_path).name
        metadatas = [
            {
                "source": file_name,
                "chunk_index": i,
                "total_chunks": len(chunks)
            }
            for i in range(len(chunks))
        ]
        
        return {
            "chunks": chunks,
            "metadatas": metadatas,
            "source": file_name
        }
    
    def process_directory(self, directory: str) -> List[Dict]:
        """
        处理目录中的所有文档
        
        Args:
            directory: 目录路径
            
        Returns:
            处理结果列表
        """
        results = []
        supported_extensions = ['.pdf', '.docx', '.doc', '.txt']
        
        for root, _, files in os.walk(directory):
            for file in files:
                file_path = os.path.join(root, file)
                ext = Path(file_path).suffix.lower()
                
                if ext in supported_extensions:
                    try:
                        result = self.process_document(file_path)
                        results.append(result)
                        print(f"✓ 处理成功: {file}")
                    except Exception as e:
                        print(f"✗ 处理失败: {file} - {str(e)}")
        
        return results


# 创建全局实例
document_processor = DocumentProcessor()

