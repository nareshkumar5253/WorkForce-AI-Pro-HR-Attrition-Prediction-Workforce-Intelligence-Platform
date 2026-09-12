from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.utils.enums import UserRole, UserStatus


class UserRegister(BaseModel):
    name: str = Field(
        ...,
        min_length=3,
        max_length=100,
    )

    email: EmailStr

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
    )

    role: UserRole = UserRole.EMPLOYEE


class UserLogin(BaseModel):
    email: EmailStr

    password: str = Field(
        ...,
        min_length=1,
        max_length=128,
    )


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    status: UserStatus
    is_verified: bool
    is_active: bool

    model_config = ConfigDict(
        from_attributes=True,
    )


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"