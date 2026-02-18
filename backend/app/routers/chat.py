import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import anthropic

from app.config import CLAUDE_API_KEY
from app.schemas import ChatRequest

router = APIRouter(prefix="/api", tags=["chat"])

STYLE_MAP = {
    "humorous": "幽默型",
    "gentle": "温柔型",
    "direct": "直球型",
    "literary": "文艺型",
}

SYSTEM_PROMPT = """你是一个专业的恋爱聊天回复助手，擅长高情商回复。

用户会给你对方发来的消息（文字或聊天截图），你需要根据指定的风格，生成恰好3条高情商回复建议。

如果用户上传了聊天截图，请仔细识别截图中的对话内容，理解对方说了什么，然后生成合适的回复。

回复要求：
1. 每条回复要自然、有趣、不油腻
2. 回复长度适中，像正常聊天一样
3. 要有层次感，3条回复从不同角度切入
4. 用编号格式输出：1️⃣ 2️⃣ 3️⃣
5. 直接给出回复内容，不要加解释

风格说明：
- 幽默型：用幽默感和机智化解，让对方忍不住笑
- 温柔型：温暖体贴，让对方感受到关心和在乎
- 直球型：直接表达心意，真诚不做作
- 文艺型：有文艺感和诗意，用优美的表达打动人心"""


async def stream_chat(request: ChatRequest):
    if not CLAUDE_API_KEY:
        yield f"data: {json.dumps({'error': 'API key not configured'})}\n\n"
        return

    if not request.their_message.strip() and not request.images:
        yield f"data: {json.dumps({'error': '请输入文字或上传截图'})}\n\n"
        return

    style_label = STYLE_MAP.get(request.style, "幽默型")

    # Build content blocks: images first, then text
    content_blocks = []
    if request.images:
        for img in request.images:
            content_blocks.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": img.media_type,
                    "data": img.data,
                },
            })

    text_parts = []
    if request.their_message.strip():
        text_parts.append(f"对方发来的消息：「{request.their_message}」")
    if request.images:
        text_parts.append("（请结合上面的聊天截图理解对方的意思）")
    text_parts.append(f"\n请用【{style_label}】风格生成3条回复。")
    if request.context:
        text_parts.append(f"\n聊天背景：{request.context}")

    content_blocks.append({"type": "text", "text": "\n".join(text_parts)})

    client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)

    try:
        with client.messages.stream(
            model="claude-sonnet-4-6-20250627",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": content_blocks}],
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {json.dumps({'content': text}, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"
    except anthropic.APIError as e:
        yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"


@router.post("/chat")
async def chat(request: ChatRequest):
    if not CLAUDE_API_KEY:
        raise HTTPException(status_code=500, detail="Claude API key not configured")
    return StreamingResponse(
        stream_chat(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
