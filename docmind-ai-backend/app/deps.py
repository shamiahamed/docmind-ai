from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.lib.supabase import get_supabase
from app.logger import get_logger

security = HTTPBearer()
logger = get_logger("deps.auth")

async def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validates the Supabase JWT using the Supabase client.
    This is more robust than manual decoding as it handles various algorithms (HS256, RS256, etc.)
    """
    supabase = get_supabase()
    try:
        # Verify the token with Supabase directly
        user_response = supabase.auth.get_user(token.credentials)
        
        if not user_response.user:
            logger.warning("Auth failed: No user returned from Supabase")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
            
        user = user_response.user
        logger.info(f"Auth success: {user.email} ({user.id})")
        
        return {
            "user_id": user.id,
            "email": user.email,
            "metadata": user.user_metadata
        }
    except Exception as e:
        logger.error(f"Auth error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
        )
