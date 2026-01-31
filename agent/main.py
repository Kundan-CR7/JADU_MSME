# main.py
import os
import structlog
from fastapi import FastAPI
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler

log = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("agent_startup")
    scheduler = BackgroundScheduler()
    scheduler.add_job(lambda: log.info("cron_tick"), 'interval', minutes=5)
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(lifespan=lifespan)

@app.get("/")
def read_root():
    return {"status": "Agent is alive"}