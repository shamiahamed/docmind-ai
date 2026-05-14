import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE = LOG_DIR / "app.log"

def setup_logger(name: str = "docmind") -> logging.Logger:
    console_log = logging.StreamHandler()
    console_log.setLevel(logging.INFO)
    console_log.setFormatter(logging.Formatter(
        '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    ))

    file_log = RotatingFileHandler(LOG_FILE, maxBytes=1024 * 1024 * 4, backupCount=5)
    file_log.setLevel(logging.INFO)
    file_log.setFormatter(logging.Formatter(
        '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    ))

    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # Avoid duplicate handlers on reload
    if not logger.handlers:
        logger.addHandler(console_log)
        logger.addHandler(file_log)

    return logger

# Root logger instance — import this everywhere
logger = setup_logger("docmind")

def get_logger(module_name: str) -> logging.Logger:
    """Returns a child logger scoped to a specific module."""
    return logging.getLogger(f"docmind.{module_name}")
