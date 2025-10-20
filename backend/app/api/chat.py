"""
聊天API路由
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.conversation import Conversation, Message
from app.schemas.conversation import ChatRequest, ChatResponse, Message as MessageSchema
from app.api.auth import get_current_user
from app.services.rag.rag_service import rag_service

router = APIRouter(prefix="/chat", tags=["聊天"])


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    发送消息并获取AI回复
    """
    # 如果没有提供conversation_id，创建新对话
    if not request.conversation_id:
        conversation = Conversation(
            user_id=current_user.id,
            title=request.message[:50] if len(request.message) > 50 else request.message
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    else:
        # 验证对话是否存在且属于当前用户
        conversation = db.query(Conversation).filter(
            Conversation.id == request.conversation_id,
            Conversation.user_id == current_user.id
        ).first()
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="对话不存在"
            )
    
    # 保存用户消息
    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)
    
    # 获取对话历史
    messages = db.query(Message).filter(
        Message.conversation_id == conversation.id
    ).order_by(Message.created_at.asc()).all()
    
    # 构建消息历史
    message_history = [
        {"role": msg.role, "content": msg.content}
        for msg in messages
    ]
    
    try:
        # 使用RAG服务生成回复
        ai_response = await rag_service.chat(message_history, use_rag=True)
        
        # 保存AI回复
        assistant_message = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=ai_response
        )
        db.add(assistant_message)
        db.commit()
        db.refresh(assistant_message)
        
        return ChatResponse(
            conversation_id=conversation.id,
            message=MessageSchema.from_orm(user_message),
            response=MessageSchema.from_orm(assistant_message)
        )
    
    except Exception as e:
        # 如果生成失败，返回错误消息
        error_message = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=f"抱歉，处理您的请求时出现错误：{str(e)}"
        )
        db.add(error_message)
        db.commit()
        db.refresh(error_message)
        
        return ChatResponse(
            conversation_id=conversation.id,
            message=MessageSchema.from_orm(user_message),
            response=MessageSchema.from_orm(error_message)
        )

