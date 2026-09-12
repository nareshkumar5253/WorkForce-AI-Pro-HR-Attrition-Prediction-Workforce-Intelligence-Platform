from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.ai.workforce_forecasting import (
    calculate_attrition_forecast,
    calculate_forecast_summary,
    calculate_workforce_forecast,
)
from app.core.database import get_db
from app.core.dependencies import get_current_user


router = APIRouter(
    prefix="/forecasting",
    tags=["Workforce Forecasting"],
)


@router.get("/workforce")
def get_workforce_forecast(
    horizon: int = Query(
        30,
        description="Forecast horizon in days: 7, 30, or 90.",
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        return calculate_workforce_forecast(
            db=db,
            horizon_days=horizon,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@router.get("/attrition")
def get_attrition_forecast(
    horizon: int = Query(
        30,
        description="Forecast horizon in days: 7, 30, or 90.",
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        return calculate_attrition_forecast(
            db=db,
            horizon_days=horizon,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@router.get("/summary")
def get_forecast_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return calculate_forecast_summary(db)