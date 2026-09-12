import json
import os
from sqlalchemy import func

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.ai.attrition_model import (
    predict_attrition,
    train_attrition_models,
)
from app.ai.risk_engine import (
    calculate_risk_level,
)
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.dataset import Dataset
from app.models.prediction import AttritionPrediction
from app.models.user import User, UserRole
from app.schemas.prediction import (
    PredictionHistoryResponse,
    PredictionRequest,
    PredictionResponse,
    TrainingResponse,
)


router = APIRouter(
    prefix="/predictions",
    tags=["AI Attrition Predictions"],
)


def require_admin_hr_manager(
    current_user: User,
):
    if current_user.role not in [
        UserRole.ADMIN,
        UserRole.HR,
        UserRole.MANAGER,
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Only ADMIN, HR, or MANAGER users "
                "can use attrition prediction."
            ),
        )


def get_dataset_or_404(
    dataset_id: int,
    db: Session,
):
    dataset = (
        db.query(Dataset)
        .filter(
            Dataset.id == dataset_id
        )
        .first()
    )

    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found.",
        )

    return dataset


# ============================================================
# TRAIN ATTRITION MODEL
# ============================================================

@router.post(
    "/train/{dataset_id}",
    response_model=TrainingResponse,
)
def train_model(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin_hr_manager(
        current_user
    )

    dataset = get_dataset_or_404(
        dataset_id,
        db,
    )

    if not dataset.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Dataset is inactive. "
                "Activate the dataset before training."
            ),
        )

    if not dataset.file_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dataset file path is missing.",
        )

    if not os.path.exists(
        dataset.file_path
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset file could not be found.",
        )

    try:
        dataframe = pd.read_csv(
            dataset.file_path
        )

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unable to read dataset: {str(exc)}"
            ),
        )

    try:
        result = train_attrition_models(
            dataframe
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                f"Model training failed: {str(exc)}"
            ),
        )

    return result


# ============================================================
# PREDICT EMPLOYEE ATTRITION
# ============================================================

@router.post(
    "/predict",
    response_model=PredictionResponse,
)
def predict_employee_attrition(
    request: PredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin_hr_manager(
        current_user
    )

    try:
        result = predict_attrition(
            request.employee_data
        )

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Prediction failed: {str(exc)}"
            ),
        )

    risk_level = calculate_risk_level(
        result["attrition_probability"]
    )

    prediction_record = AttritionPrediction(
        employee_id=request.employee_id,
        dataset_id=None,
        prediction=result["prediction"],
        attrition_probability=(
            result["attrition_probability"]
        ),
        risk_level=risk_level,
        model_name=result["model_name"],
        input_data=json.dumps(
            request.employee_data,
            default=str,
        ),
    )

    db.add(
        prediction_record
    )

    db.commit()
    db.refresh(
        prediction_record
    )

    return {
        "id": prediction_record.id,
        "employee_id": (
            prediction_record.employee_id
        ),
        "prediction": (
            prediction_record.prediction
        ),
        "attrition_probability": (
            prediction_record.attrition_probability
        ),
        "risk_level": (
            prediction_record.risk_level
        ),
        "model_name": (
            prediction_record.model_name
        ),
        "created_at": (
            prediction_record.created_at
        ),
    }


# ============================================================
# GET ALL PREDICTIONS
# ============================================================

@router.get(
    "",
    response_model=list[
        PredictionHistoryResponse
    ],
)
def list_predictions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin_hr_manager(
        current_user
    )

    predictions = (
        db.query(
            AttritionPrediction
        )
        .order_by(
            AttritionPrediction.created_at.desc()
        )
        .all()
    )

    return predictions


# ============================================================
# GET SINGLE PREDICTION
# ============================================================

@router.get(
    "/{prediction_id}",
    response_model=PredictionHistoryResponse,
)
def get_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin_hr_manager(
        current_user
    )

    prediction = (
        db.query(
            AttritionPrediction
        )
        .filter(
            AttritionPrediction.id
            == prediction_id
        )
        .first()
    )

    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found.",
        )

    return prediction