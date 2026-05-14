from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from app.logger import get_logger

logger = get_logger("exceptions")

def register_exception_handlers(app):
    @app.exception_handler(HTTPException)
    async def http_exception(request: Request, exc: HTTPException):
        logger.warning(
            f"HTTP {exc.status_code} | {request.method} {request.url.path} | {exc.detail}"
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status": False,
                "message": exc.detail,
                "error": str(exc)
            }
        )

    @app.exception_handler(Exception)
    async def global_exception(request: Request, exc: Exception):
        logger.error(
            f"Unhandled exception | {request.method} {request.url.path} | {type(exc).__name__}: {exc}",
            exc_info=True
        )
        return JSONResponse(
            status_code=500,
            content={
                "status": False,
                "message": "Internal server error",
                "error": str(exc)
            }
        )
