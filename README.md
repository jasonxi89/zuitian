# 撩妹话术 - 高情商回复助手

话术库工具 + AI聊天助手，帮你成为聊天高手。

## 功能

- **话术库**: 200+条精选话术，8大分类，搜索/随机/一键复制
- **AI助手**: 输入对方消息，AI生成3条高情商回复（幽默/温柔/直球/文艺）
- **土味情话**: 随机生成土味情话，卡片翻转动画

## 技术栈

- 前端: React + Vite + TailwindCSS
- 后端: FastAPI + SQLite
- AI: Claude API (Sonnet)
- 部署: Docker

## 本地开发

```bash
# 后端
cd backend
pip install -r requirements.txt
uvicorn app.main:app --port 8901

# 前端
cd frontend
npm install
npm run dev
```

## Docker 部署

```bash
# 设置环境变量
export CLAUDE_API_KEY=your_key_here

# 启动
docker compose up -d
```

访问 `http://localhost:8901`
