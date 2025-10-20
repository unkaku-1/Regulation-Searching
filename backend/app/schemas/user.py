"""
用户数据模式
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """用户基础模式"""
    username: str
    email: Optional[EmailStr] = None


class UserCreate(UserBase):
    """用户创建模式"""
    password: str


class UserUpdate(BaseModel):
    """用户更新模式"""
    email: Optional[EmailStr] = None
    password: Optional[str] = None


class UserInDB(UserBase):
    """数据库中的用户模式"""
    id: str
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class User(UserInDB):
    """用户响应模式"""
    pass


class Token(BaseModel):
    """令牌模式"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """令牌数据模式"""
    username: Optional[str] = None

