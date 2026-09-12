from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_current_admin,
    get_current_user,
)
from app.models.user import User
from app.schemas.auth import UserResponse
from app.utils.enums import UserRole


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.get(
    "",
    response_model=list[UserResponse],
)
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):

    return db.query(User).order_by(
        User.id.asc()
    ).all()