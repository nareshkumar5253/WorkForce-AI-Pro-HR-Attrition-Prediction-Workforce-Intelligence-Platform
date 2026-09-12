from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_admin_or_hr
from app.models.shift import Shift
from app.schemas.shift import (
    ShiftCreate,
    ShiftResponse,
    ShiftUpdate,
)

router = APIRouter(
    prefix="/shifts",
    tags=["Shifts"],
)


@router.post(
    "",
    response_model=ShiftResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_shift(
    shift_data: ShiftCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_hr),
):
    existing_name = (
        db.query(Shift)
        .filter(Shift.name == shift_data.name)
        .first()
    )

    if existing_name:
        raise HTTPException(
            status_code=400,
            detail="Shift name already exists.",
        )

    existing_code = (
        db.query(Shift)
        .filter(Shift.code == shift_data.code)
        .first()
    )

    if existing_code:
        raise HTTPException(
            status_code=400,
            detail="Shift code already exists.",
        )

    shift = Shift(
        name=shift_data.name,
        code=shift_data.code,
        start_time=shift_data.start_time,
        end_time=shift_data.end_time,
        grace_minutes=shift_data.grace_minutes,
        description=shift_data.description,
        is_active=True,
    )

    db.add(shift)
    db.commit()
    db.refresh(shift)

    return shift


@router.get(
    "",
    response_model=list[ShiftResponse],
)
def list_shifts(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_hr),
):
    return (
        db.query(Shift)
        .order_by(Shift.id.asc())
        .all()
    )


@router.get(
    "/{shift_id}",
    response_model=ShiftResponse,
)
def get_shift(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_hr),
):
    shift = (
        db.query(Shift)
        .filter(Shift.id == shift_id)
        .first()
    )

    if not shift:
        raise HTTPException(
            status_code=404,
            detail="Shift not found.",
        )

    return shift


@router.put(
    "/{shift_id}",
    response_model=ShiftResponse,
)
def update_shift(
    shift_id: int,
    shift_data: ShiftUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_hr),
):
    shift = (
        db.query(Shift)
        .filter(Shift.id == shift_id)
        .first()
    )

    if not shift:
        raise HTTPException(
            status_code=404,
            detail="Shift not found.",
        )

    if shift_data.name is not None:
        existing_name = (
            db.query(Shift)
            .filter(
                Shift.name == shift_data.name,
                Shift.id != shift_id,
            )
            .first()
        )

        if existing_name:
            raise HTTPException(
                status_code=400,
                detail="Shift name already exists.",
            )

    if shift_data.code is not None:
        existing_code = (
            db.query(Shift)
            .filter(
                Shift.code == shift_data.code,
                Shift.id != shift_id,
            )
            .first()
        )

        if existing_code:
            raise HTTPException(
                status_code=400,
                detail="Shift code already exists.",
            )

    update_data = shift_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(shift, field, value)

    db.commit()
    db.refresh(shift)

    return shift


@router.delete(
    "/{shift_id}",
    response_model=ShiftResponse,
)
def deactivate_shift(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_hr),
):
    shift = (
        db.query(Shift)
        .filter(Shift.id == shift_id)
        .first()
    )

    if not shift:
        raise HTTPException(
            status_code=404,
            detail="Shift not found.",
        )

    shift.is_active = False

    db.commit()
    db.refresh(shift)

    return shift