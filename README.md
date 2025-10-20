# Regulation-Searching

基于本地LLM（Ollama）和RAG技术的企业级法规智能检索系统

## 项目简介

Regulation-Searching 是一个安全、高效、精准的法规查询解决方案，帮助企业员工快速获取并理解相关法规条文。本项目采用前后端分离架构，集成Ollama本地化大型语言模型和RAG（检索增强生成）技术，确保数据处理的私密性和安全性。

## 主要特性

- **本地化部署**：所有数据存储在本地服务器，确保数据安全和隐私
- **智能检索**：基于RAG技术，从法规知识库中精准检索相关信息
- **现代化界面**：基于Figma设计的用户友好对话式UI
- **高效响应**：平均查询响应时间在5秒以内
- **易于部署**：支持Docker容器化部署，简化安装和配置流程

## 技术栈

- **前端**: React, TypeScript, Tailwind CSS
- **后端**: Python, FastAPI
- **LLM**: Ollama (支持Llama3、Qwen2等模型)
- **RAG框架**: LangChain / LlamaIndex
- **向量数据库**: ChromaDB / Faiss
- **关系型数据库**: SQLite / PostgreSQL
- **容器化**: Docker, Docker Compose

## 项目文档

- [需求文档](requirements.md)

## 快速开始

### 前置要求

- Docker 和 Docker Compose
- Python 3.11+
- Node.js 22+

### 部署步骤

详细的部署步骤请参考[需求文档](requirements.md)中的第5章节。

## 项目状态

当前项目处于需求分析和架构设计阶段。

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过GitHub Issues联系我们。
