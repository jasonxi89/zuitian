# Zuitian — AI-Powered Chat Reply Assistant

> Don't know what to say? Let AI help you rizz!

A phrase library + AI chat assistant web app that helps you become a better conversationalist.

## Features

### Chat Phrases Library
- 200+ curated phrases across 8 categories (openers / humorous replies / cheesy pickup lines / confessions / flirtation / date invitations / morning & night greetings / holiday wishes)
- Keyword search + category filtering
- One-click copy to clipboard

### AI Assistant
- Input the other person's message, AI generates 3 high-EQ reply suggestions
- 4 response styles: Humorous / Gentle / Direct / Literary
- Streaming output with typewriter effect
- Add chat context for more accurate suggestions

### Random Pickup Lines
- Random cheesy pickup line generator
- Card flip animation
- One-click copy

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | FastAPI + SQLAlchemy + SQLite |
| AI | Claude API (Sonnet) SSE streaming |
| DevOps | Docker + GitHub Actions CI/CD |

## Quick Start

### Docker Compose

```yaml
services:
  zuitian:
    image: jasonxi89/zuitian:latest
    container_name: zuitian
    ports:
      - "8901:8901"
    volumes:
      - ./data:/app/data
    environment:
      - TZ=Asia/Shanghai
      - ANTHROPIC_API_KEY=your_key_here
      - ANTHROPIC_MODEL=claude-opus-4-7
    restart: unless-stopped
```

```bash
docker compose up -d
```

Visit `http://localhost:8901`

### Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --port 8901

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
# Visit http://localhost:5173
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/phrases` | Phrase list (supports category, search, limit, offset) |
| GET | `/api/phrases/random` | Random phrase |
| GET | `/api/phrases/categories` | Category list |
| POST | `/api/chat` | AI chat (SSE streaming response) |
| GET | `/api/health` | Health check |

---

# 嘴甜 — AI 高情商回复助手

> 不会聊天？让AI教你嘴甜！

话术库 + AI聊天助手，一个帮你变身聊天高手的Web应用。

## 功能

### 话术库
- 200+ 条精选话术，8大分类（开场白 / 幽默回复 / 土味情话 / 表白句子 / 暧昧升温 / 约会邀请 / 早安晚安 / 节日祝福）
- 关键词搜索 + 分类筛选
- 一键复制到剪贴板

### AI助手
- 输入对方消息，AI生成3条高情商回复建议
- 4种风格：幽默型 / 温柔型 / 直球型 / 文艺型
- 流式输出，打字机效果
- 可添加聊天背景信息，回复更精准

### 土味情话
- 随机生成土味情话
- 卡片翻转动画
- 一键复制

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | React 18 + Vite + TailwindCSS |
| 后端 | FastAPI + SQLAlchemy + SQLite |
| AI | Claude API (Sonnet) SSE流式 |
| 部署 | Docker + GitHub Actions CI/CD |

## 快速部署

### Docker Compose

```yaml
services:
  zuitian:
    image: jasonxi89/zuitian:latest
    container_name: zuitian
    ports:
      - "8901:8901"
    volumes:
      - ./data:/app/data
    environment:
      - TZ=Asia/Shanghai
      - ANTHROPIC_API_KEY=your_key_here
      - ANTHROPIC_MODEL=claude-opus-4-7
    restart: unless-stopped
```

```bash
docker compose up -d
```

访问 `http://localhost:8901`

### 本地开发

```bash
# 后端
cd backend
pip install -r requirements.txt
uvicorn app.main:app --port 8901

# 前端（另一个终端）
cd frontend
npm install
npm run dev
# 访问 http://localhost:5173
```

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/phrases` | 话术列表（支持 category, search, limit, offset） |
| GET | `/api/phrases/random` | 随机一条话术 |
| GET | `/api/phrases/categories` | 分类列表 |
| POST | `/api/chat` | AI聊天（SSE流式返回） |
| GET | `/api/health` | 健康检查 |
