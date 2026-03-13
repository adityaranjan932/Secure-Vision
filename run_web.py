#!/usr/bin/env python3
"""
Secure Vision - Web Application Launcher

This script launches the FastAPI web server for the Secure Vision
violence detection system with video upload and live camera streaming.
"""

import uvicorn
import sys


def main():
    """Start the Secure Vision web server"""

    print("\n" + "=" * 60)
    print("SECURE VISION - WEB INTERFACE")
    print("=" * 60)
    print("\nStarting web server...")
    print("\nOnce the server is running, open your browser and go to:")
    print("  → http://localhost:8000")
    print("\nPress Ctrl+C to stop the server")
    print("=" * 60 + "\n")

    try:
        # Run uvicorn server
        uvicorn.run(
            "api.app:app",
            host="0.0.0.0",
            port=8000,
            reload=True,  # Auto-reload on code changes (disable in production)
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n\nShutting down gracefully...")
        sys.exit(0)
    except Exception as e:
        print(f"\nError starting server: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
