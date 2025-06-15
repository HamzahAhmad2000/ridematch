import threading
import time
import logging
from ..models.match import Match

logger = logging.getLogger(__name__)


def start_interest_updater(interval_hours: int = 24) -> None:
    """Start background thread that periodically refreshes user hobby data."""

    def _run():
        while True:
            try:
                logger.info("Running periodic interest update")
                Match.update_all_user_hobbies()
            except Exception as exc:
                logger.error(f"Interest update failed: {exc}")
            time.sleep(interval_hours * 3600)

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
