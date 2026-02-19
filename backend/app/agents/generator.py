"""AI phrase generator agent — uses Claude Sonnet to generate fresh phrases daily."""

import json
import logging
import random
from datetime import datetime

import anthropic
import httpx

from app.config import CLAUDE_API_KEY
from app.database import SessionLocal
from app.agents.utils import save_new_phrases

logger = logging.getLogger(__name__)

ALL_CATEGORIES = [
    "开场白", "幽默回复", "土味情话", "高甜语录",
    "早安问候", "晚安问候", "关心体贴", "表白金句",
    "节日祝福", "朋友圈评论",
]

SEASON_MAP = {1: "冬", 2: "冬", 3: "春", 4: "春", 5: "春", 6: "夏",
              7: "夏", 8: "夏", 9: "秋", 10: "秋", 11: "秋", 12: "冬"}

# Public trending topic API endpoints (best-effort, failures are fine)
TRENDING_URLS = [
    "https://weibo.com/ajax/side/hotSearch",
    "https://tenapi.cn/v2/baiduhot",
]


def _get_season(month: int) -> str:
    return SEASON_MAP.get(month, "")


def _get_holiday_hint(date: datetime) -> str:
    md = (date.month, date.day)
    holidays = {
        (1, 1): "元旦", (2, 14): "情人节", (3, 8): "妇女节",
        (5, 1): "劳动节", (5, 20): "520表白日", (6, 1): "儿童节",
        (7, 7): "七夕（农历）", (8, 4): "七夕（大约）",
        (10, 1): "国庆节", (11, 11): "双十一/光棍节",
        (12, 24): "平安夜", (12, 25): "圣诞节",
    }
    return holidays.get(md, "")


async def _fetch_trending_topics() -> str:
    """Try to fetch trending topics from public APIs. Returns a string summary."""
    topics = []
    async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
        for url in TRENDING_URLS:
            try:
                resp = await client.get(url, headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                })
                if resp.status_code != 200:
                    continue
                data = resp.json()
                # Weibo format
                if "data" in data and "realtime" in data["data"]:
                    for item in data["data"]["realtime"][:10]:
                        if "word" in item:
                            topics.append(item["word"])
                # tenapi format
                elif "data" in data and isinstance(data["data"], list):
                    for item in data["data"][:10]:
                        if "name" in item:
                            topics.append(item["name"])
                if topics:
                    break
            except Exception as e:
                logger.debug("Failed to fetch trending from %s: %s", url, e)
                continue

    if not topics:
        return "（未获取到热点，请根据当前季节和日期自由创作）"
    return "\n".join(f"- {t}" for t in topics[:10])


def _build_prompt(trending: str, date: datetime, categories: list[str], n: int) -> str:
    season = _get_season(date.month)
    holiday = _get_holiday_hint(date)
    holiday_line = f"今天是{holiday}，请结合节日氛围创作。" if holiday else ""

    return f"""你是一个话术创作专家。先参考以下当前社交媒体热点，然后为指定分类各生成{n}条全新话术。

当前热点（来自社交媒体）：
{trending}

要求：
1. 结合热点创作，但不要直接抄袭
2. 自然有趣不油腻，适合微信社交场景，性别中立
3. 每条 15-80 字
今天：{date.strftime('%Y-%m-%d')}，季节：{season}季。{holiday_line}
分类：{', '.join(categories)}
返回纯JSON数组（不要markdown代码块）: [{{"content":"...","category":"...","tags":"tag1,tag2"}}]"""


async def generate_phrases_job():
    """Main job entry point — called by scheduler."""
    if not CLAUDE_API_KEY:
        logger.warning("CLAUDE_API_KEY not set, skipping phrase generation")
        return

    logger.info("Starting AI phrase generation job")
    now = datetime.now()

    # Pick 3-4 random categories
    categories = random.sample(ALL_CATEGORIES, k=min(4, len(ALL_CATEGORIES)))
    n_per_category = random.randint(3, 4)

    # Fetch trending topics
    trending = await _fetch_trending_topics()
    prompt = _build_prompt(trending, now, categories, n_per_category)

    try:
        client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        )

        raw_text = response.content[0].text.strip()
        # Strip markdown code fences if present
        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[-1]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3].strip()

        phrases = json.loads(raw_text)
        if not isinstance(phrases, list):
            logger.error("Claude returned non-list: %s", type(phrases))
            return

        # Filter valid entries
        valid = []
        for p in phrases:
            content = p.get("content", "").strip()
            if 15 <= len(content) <= 80 and p.get("category"):
                valid.append(p)

        db = SessionLocal()
        try:
            added = save_new_phrases(db, valid)
            logger.info("AI generator: %d new phrases added (from %d generated)", added, len(valid))
        finally:
            db.close()

    except json.JSONDecodeError as e:
        logger.error("Failed to parse Claude response as JSON: %s", e)
    except anthropic.APIError as e:
        logger.error("Claude API error: %s", e)
    except Exception as e:
        logger.error("Unexpected error in generator: %s", e)
