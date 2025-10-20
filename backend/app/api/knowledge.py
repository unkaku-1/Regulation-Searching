"""
知识库管理API路由
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from typing import List
import os
import shutil
from pathlib import Path
from app.models.user import User
from app.api.auth import get_current_user
from app.services.rag.document_processor import document_processor
from app.services.vector.chroma_service import chroma_service

router = APIRouter(prefix="/knowledge", tags=["知识库管理"])

# 文档存储目录
UPLOAD_DIR = Path("data/documents")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    上传法规文档
    """
    # 检查文件类型
    allowed_extensions = ['.pdf', '.docx', '.doc', '.txt']
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的文件类型。支持的类型: {', '.join(allowed_extensions)}"
        )
    
    # 保存文件
    file_path = UPLOAD_DIR / file.filename
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 处理文档
        result = document_processor.process_document(str(file_path))
        
        # 添加到向量数据库
        chroma_service.add_documents(
            documents=result["chunks"],
            metadatas=result["metadatas"]
        )
        
        return {
            "message": "文档上传成功",
            "filename": file.filename,
            "chunks_count": len(result["chunks"])
        }
    
    except Exception as e:
        # 如果处理失败，删除文件
        if file_path.exists():
            file_path.unlink()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"文档处理失败: {str(e)}"
        )


@router.get("/documents")
async def list_documents(current_user: User = Depends(get_current_user)):
    """
    获取已上传的文档列表
    """
    documents = []
    
    for file_path in UPLOAD_DIR.iterdir():
        if file_path.is_file():
            documents.append({
                "filename": file_path.name,
                "size": file_path.stat().st_size,
                "created_at": file_path.stat().st_ctime
            })
    
    return {
        "documents": documents,
        "total": len(documents)
    }


@router.delete("/documents/{filename}")
async def delete_document(
    filename: str,
    current_user: User = Depends(get_current_user)
):
    """
    删除文档（注意：这只会删除文件，不会从向量数据库中删除）
    """
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文档不存在"
        )
    
    try:
        file_path.unlink()
        return {"message": "文档已删除"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除失败: {str(e)}"
        )


@router.get("/stats")
async def get_knowledge_stats(current_user: User = Depends(get_current_user)):
    """
    获取知识库统计信息
    """
    try:
        vector_count = chroma_service.count()
        document_count = len(list(UPLOAD_DIR.iterdir()))
        
        return {
            "document_count": document_count,
            "vector_count": vector_count
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取统计信息失败: {str(e)}"
        )


@router.post("/rebuild")
async def rebuild_knowledge_base(current_user: User = Depends(get_current_user)):
    """
    重建知识库（重新处理所有文档）
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有管理员可以执行此操作"
        )
    
    try:
        # 删除现有集合
        chroma_service.delete_collection()
        
        # 重新初始化
        from app.services.vector.chroma_service import ChromaService
        global chroma_service
        chroma_service = ChromaService()
        
        # 处理所有文档
        results = document_processor.process_directory(str(UPLOAD_DIR))
        
        total_chunks = 0
        for result in results:
            chroma_service.add_documents(
                documents=result["chunks"],
                metadatas=result["metadatas"]
            )
            total_chunks += len(result["chunks"])
        
        return {
            "message": "知识库重建成功",
            "documents_processed": len(results),
            "total_chunks": total_chunks
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"重建知识库失败: {str(e)}"
        )

