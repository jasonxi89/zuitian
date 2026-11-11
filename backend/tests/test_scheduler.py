from app.scheduler import scheduler, shutdown_scheduler, start_scheduler


async def test_should_register_only_generator_job_when_scheduler_starts():
    start_scheduler()
    try:
        registered_job_ids = [job.id for job in scheduler.get_jobs()]
    finally:
        shutdown_scheduler()

    assert registered_job_ids == ["generator"]
