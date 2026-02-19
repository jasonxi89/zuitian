"""Web scraper agent — fetches phrases from public 情话/语录 websites."""

import logging
import random
import re

import httpx
from bs4 import BeautifulSoup

from app.database import SessionLocal
from app.agents.utils import save_new_phrases

logger = logging.getLogger(__name__)

# Public 情话/语录 sources (static HTML, easy to parse)
SOURCES = [
    {
        "url": "https://www.lz13.cn/jingdianyulu/qinghua.html",
        "selector": "div.content p, div.content li, div.article p",
        "name": "励志一生-情话",
    },
    {
        "url": "https://www.gexings.com/qinghua/",
        "selector": "div.list ul li a, div.content p",
        "name": "个性说-情话",
    },
    {
        "url": "https://www.duanwenxue.com/article/qinghua/",
        "selector": "div.list-box li a, div.content p",
        "name": "短文学-情话",
    },
]

SENSITIVE_WORDS = ["死", "杀", "恨你", "分手", "离婚", "自杀", "色情", "赌博"]

CATEGORY_KEYWORDS = {
    "土味情话": ["土味", "撩", "甜", "情话"],
    "表白金句": ["表白", "喜欢你", "爱你", "告白"],
    "早安问候": ["早安", "早上好", "清晨", "起床"],
    "晚安问候": ["晚安", "好梦", "夜", "入睡", "星星", "月亮"],
    "关心体贴": ["照顾", "注意身体", "天冷", "吃饭", "别熬夜"],
    "幽默回复": ["哈哈", "搞笑", "笑", "有趣"],
}


def _classify(text: str) -> str:
    """Simple keyword-based classification."""
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return category
    return "高甜语录"


def _is_valid(text: str) -> bool:
    """Check if text is a valid phrase."""
    if not text or len(text) < 15 or len(text) > 80:
        return False
    if any(w in text for w in SENSITIVE_WORDS):
        return False
    # Skip lines that look like titles, dates, or navigation
    if re.match(r"^\d{4}", text) or text.startswith("http"):
        return False
    return True


async def scrape_phrases_job():
    """Main job entry point — called by scheduler."""
    logger.info("Starting web scraper job")

    source = random.choice(SOURCES)
    logger.info("Scraping from: %s", source["name"])

    phrases = []
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(source["url"], headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            })
            if resp.status_code != 200:
                logger.warning("Got status %d from %s", resp.status_code, source["url"])
                return

            # Try to detect encoding
            content_type = resp.headers.get("content-type", "")
            if "gbk" in content_type.lower() or "gb2312" in content_type.lower():
                html = resp.content.decode("gbk", errors="replace")
            else:
                html = resp.text

        soup = BeautifulSoup(html, "html.parser")
        elements = soup.select(source["selector"])

        for el in elements:
            text = el.get_text(strip=True)
            # Some pages have numbered lists like "1. 情话内容"
            text = re.sub(r"^\d+[.、\s]+", "", text).strip()
            if _is_valid(text):
                phrases.append({
                    "content": text,
                    "category": _classify(text),
                    "tags": "爬取",
                })

    except Exception as e:
        logger.error("Scraper error from %s: %s", source["name"], e)
        return

    if not phrases:
        logger.info("No valid phrases found from %s", source["name"])
        return

    # Take 5-10 random phrases
    selected = random.sample(phrases, k=min(random.randint(5, 10), len(phrases)))

    db = SessionLocal()
    try:
        added = save_new_phrases(db, selected)
        logger.info("Scraper: %d new phrases added (from %d scraped)", added, len(selected))
    finally:
        db.close()
