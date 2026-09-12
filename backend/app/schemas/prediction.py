from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class ModelMetricsResponse(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float


class ModelComparisonResponse(BaseModel):
    logistic_regression: ModelMetricsResponse
    random_forest: ModelMetricsResponse


class FeatureSummaryResponse(BaseModel):
    total_features: int
    numerical_features: list[str]
    categorical_features: list[str]


class TrainingResponse(BaseModel):
    success: bool

    target_column: str

    total_rows: int
    training_rows: int
    testing_rows: int

    total_features: int

    feature_summary: FeatureSummaryResponse

    models: ModelComparisonResponse

    best_model: str

    best_model_metrics: ModelMetricsResponse

    model_path: str


class PredictionRequest(BaseModel):
    employee_id: int | None = None

    employee_data: dict[str, Any]


class PredictionResponse(BaseModel):
    id: int | None = None

    employee_id: int | None = None

    prediction: int

    attrition_probability: float

    risk_level: str

    model_name: str

    created_at: datetime | None = None

    model_config = ConfigDict(
        from_attributes=True
    )


class PredictionHistoryResponse(BaseModel):
    id: int

    employee_id: int | None

    dataset_id: int | None

    prediction: int

    attrition_probability: float

    risk_level: str

    model_name: str

    input_data: str | None

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )
class RiskSummaryResponse(BaseModel):
    total_predictions: int
    high_risk: int
    medium_risk: int
    low_risk: int
    high_risk_percentage: float


class RiskEmployeeResponse(BaseModel):
    employee_id: int | None
    employee_name: str | None
    attrition_probability: float
    risk_level: str
    prediction: int
    model_name: str
    created_at: datetime


class EmployeeRiskHistoryResponse(BaseModel):
    id: int
    employee_id: int | None
    prediction: int
    attrition_probability: float
    risk_level: str
    model_name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

from datetime import datetime

from pydantic import BaseModel, Field


class ModelMetricsResponse(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float


class ModelTrainingResponse(BaseModel):
    success: bool
    target_column: str
    total_rows: int
    training_rows: int
    testing_rows: int
    total_features: int
    feature_summary: dict
    models: dict
    best_model: str
    best_model_metrics: ModelMetricsResponse
    model_path: str


class AttritionPredictionRequest(BaseModel):
    employee_id: int | None = None

    employee_data: dict = Field(
        ...,
        description="Employee feature values used by the trained model.",
    )


class AttritionPredictionResponse(BaseModel):
    id: int
    employee_id: int | None
    dataset_id: int | None
    prediction: int
    attrition_probability: float
    risk_level: str
    model_name: str
    created_at: datetime