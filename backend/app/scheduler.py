"""APScheduler setup — registers daily phrase generation and scraping jobs."""

import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="Asia/Shanghai")


def start_scheduler():
    from app.agents.generator import generate_phrases_job
    from app.agents.scraper import scrape_phrases_job

    scheduler.add_job(
        generate_phrases_job, "cron", hour=8, minute=0,
        id="generator", replace_existing=True,
    )
    scheduler.add_job(
        scrape_phrases_job, "cron", hour=8, minute=5,
        id="scraper", replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started: generator@08:00, scraper@08:05 (Asia/Shanghai)")


def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler shut down")
