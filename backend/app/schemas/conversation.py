"""
对话和消息数据模式
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class MessageBase(BaseModel):
    """消息基础模式"""
    role: str
    content: str


class MessageCreate(MessageBase):
    """消息创建模式"""
    conversation_id: str


class Message(MessageBase):
    """消息响应模式"""
    id: str
    conversation_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ConversationBase(BaseModel):
    """对话基础模式"""
    title: str


class ConversationCreate(BaseModel):
    """对话创建模式"""
    title: Optional[str] = "新对话"


class ConversationUpdate(BaseModel):
    """对话更新模式"""
    title: str


class Conversation(ConversationBase):
    """对话响应模式"""
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    messages: List[Message] = []
    
    class Config:
        from_attributes = True


class ConversationList(BaseModel):
    """对话列表模式"""
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    
    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    """聊天请求模式"""
    conversation_id: Optional[str] = None
    message: str


class ChatResponse(BaseModel):
    """聊天响应模式"""
    conversation_id: str
    message: Message
    response: Message

