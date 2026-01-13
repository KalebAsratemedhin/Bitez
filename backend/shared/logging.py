"""Structured logging configuration."""
import logging, sys
from typing import Optional
from pythonjsonlogger import jsonlogger

def setup_logging(
    service_name: str,
    log_level: str = "INFO",
    json_format: bool = True
) -> logging.Logger:
    logger = logging.getLogger(service_name)
    logger.setLevel(getattr(logging, log_level.upper()))

    logger.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)

    if json_format:
        # JSON formatter for structured logging (K8s-friendly)
        formatter = jsonlogger.JsonFormatter(
            fmt='%(asctime)s %(name)s %(levelname)s %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    else:
        # Standard formatter for local development
        formatter = logging.Formatter(
            fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )

    handler.setFormatter(formatter)
    logger.addHandler(handler)

    return logger

def get_logger(service_name: str) -> logging.Logger:
    return logging.getLogger(service_name)
