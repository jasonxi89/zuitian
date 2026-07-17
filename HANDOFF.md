# HANDOFF — 嘴甜 (zuitian)
> 跨 agent/IDE 接手文档 | 最后更新: 2026-07-17 | 改动项目后请同步更新此文档

## 项目定位
面向公众的 Web App：话术库 + AI 高情商回复助手 + 随机土味情话，帮用户在聊天中快速找到合适的话。
React + FastAPI 单体应用，前端构建产物由后端直接 serve。部署在极空间 Z4 Pro NAS，Docker 端口 8901。
GitHub: `jasonxi89/zuitian`，本地路径 `C:\Users\goodb\rizz-app`。

## 当前状态
- 版本 **v2.0.0**（唯一版本号来源：`frontend/package.json`；后端无 APP_VERSION）
- 最新 commit `984b5ff`（2026-06-16，迁移到 OpenRouter 统一网关），分支 **main**（已无 master）
- AI 走 **OpenRouter**（openai SDK）：纯文字用 `deepseek/deepseek-v4-pro`，带图请求用 `anthropic/claude-opus-4.8`
- 已上线 NAS 8901；CI（GitHub Actions）test 门控 → 构建推 DockerHub（latest + commit SHA tag）
- 测试：后端 pytest（CI 覆盖率门槛 85%），前端 vitest（含 coverage）

## 技术栈与结构
- 前端：React 18 + Vite 6 + TailwindCSS 3 + TypeScript
- 后端：FastAPI + SQLAlchemy + SQLite；AI 用 openai SDK（`base_url=https://openrouter.ai/api/v1`）
```
rizz-app/
├── frontend/          # React SPA
│   └── src/
│       ├── App.tsx            # 主应用（3 页面: 话术库/AI聊天/随机）
│       ├── api/client.ts      # API 封装 + SSE 流式解析
│       └── components/        # 组件
├── backend/app/
│   ├── main.py               # FastAPI 入口 + SPA 静态文件 catch-all
│   ├── config.py             # 所有 env（OPENROUTER_* / DATABASE_URL / AGENT_ENABLED）
│   ├── routers/
│   │   ├── phrases.py        # 话术 CRUD
│   │   └── chat.py           # AI 聊天 SSE 流式 + 模型路由（带图→vision 模型）
│   ├── agents/               # 每日话术更新（generator 生成 / scraper 爬取 / utils 去重）
│   ├── scheduler.py          # APScheduler 定时任务
│   └── seed_data.py          # 种子话术
├── Dockerfile               # multi-stage: node build → python runtime
├── docker-compose.yml       # 本地用（image 为 :latest）
└── .github/workflows/docker.yml
```

## 常用命令
```bash
# 前端开发（localhost:5173，/api 代理到 8901）
cd frontend && npm install && npm run dev
# 前端构建 / 测试
cd frontend && npm run build          # tsc && vite build
cd frontend && npm test               # vitest run

# 后端开发（本机用 py launcher；venv 在 backend/.venv）
cd backend && uvicorn app.main:app --port 8901
cd backend && pytest --cov=app        # 测试

# Docker 本地
docker compose up -d --build          # 访问 http://localhost:8901
```

## 约定与坑
- **commit 不加 Co-Authored-By 行**，不把 Claude 写进 contributor 列表
- **切 AI 模型**：改 NAS compose 的 `OPENROUTER_MODEL`（文字）/ `OPENROUTER_VISION_MODEL`（带图）env 后 recreate；不改代码
- **NAS 部署**：image 必须用 commit SHA tag，**绝不用 `:latest`**（registry mirror 会缓存旧 manifest）；zuitian 与 daodichishayou-backend **共用 `-p compose_config` project**，`up -d` 时要带两个 `-f`（否则产生孤儿容器）
- **每次功能更新必须 bump 版本**：改 `frontend/package.json` version（semver：新功能 +minor，fix +patch）
- **API 路径带尾斜杠**：如 `/api/phrases/`（SPA catch-all 会抢无尾斜杠的路由）
- **前端 tsconfig 必须 exclude 测试文件**，否则 Docker 里 `tsc` build 会因 `global` 等报错挂掉
- SSE 流式格式：`data: {"content": "..."}\n\n`，以 `data: [DONE]\n\n` 结束
- 本机无独立 `python`（App Store stub 会 exit 49），用 `py` launcher；后端 venv 在 `backend/.venv`
- ⚠️ 旧坑「httpx 必须 <0.28」**已作废**（那是 anthropic SDK 时代；现已迁 openai SDK，requirements 为 `httpx>=0.27` 无上界）

## 进行中 / TODO
- [ ] 用户自定义话术（添加/收藏）
- [ ] 聊天历史持久化（LocalStorage）
- [ ] 更多话术数据 / 分享功能
- [ ] **文档欠债**：`README.md` 仍写「Claude API (Sonnet)」和 `ANTHROPIC_API_KEY/MODEL`，已随 OpenRouter 迁移过时，需更新
- [ ] **元数据欠债**：`backend/app/main.py` 的 FastAPI `title="撩妹话术 API"`、`version="1.0.0"` 已过时；`/api/health` 只返回 `{"status":"ok"}` 不含版本，NAS 验证只能靠镜像 SHA / 容器日志

## 相关资源
- Memory（可能过时，以仓库实况为准）：`rizz_app.md`（项目主档）、`nas_deployment.md`（部署流程+版本规则）、`openrouter_gateway.md`（统一网关约定）
  - 目录：`C:\Users\goodb\.claude\projects\C--Users-goodb\memory\`
- NAS 凭据位置指引（**不在此写任何密钥**）：SSH/部署工具脚本 `C:\Users\goodb\nas_ssh.py`（SSH `192.168.1.64:10000`，用户 `18363877578`，有 sudo）；真实 API key 只存 NAS compose 的 env 与本机 `backend/.env`（已在 .gitignore）
- GitHub: https://github.com/jasonxi89/zuitian
