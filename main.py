#!/usr/bin/env python3
"""
ANIVOID RPG Bot - Main Entry Point
Runs the Telegram bot + keep-alive Flask server together.
"""
import logging
import time

from keep_alive import keep_alive

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

def start_bot_with_restart():
    """Start the bot with auto-restart on crash."""
    while True:
        try:
            logger.info("[BOT] Starting Telegram bot...")
            from bot import main as bot_main
            bot_main()
        except KeyboardInterrupt:
            logger.info("[BOT] Stopped by user.")
            break
        except Exception as e:
            logger.error(f"[BOT] Crashed: {e}. Restarting in 10 seconds...")
            time.sleep(10)

if __name__ == "__main__":
    print("=" * 40)
    print("  ANIVOID RPG BOT")
    print("  System Online")
    print("  Bot Running")
    print("  Web Server Active")
    print("=" * 40)

    keep_alive()

    start_bot_with_restart()
