from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_current_admin_hr_manager,
    get_current_user,
)
from app.models.recommendation import RecommendationStatus
from app.models.user import User
from app.schemas.recommendation import (
    RecommendationCreate,
    RecommendationResponse,
    RecommendationSummaryResponse,
    RecommendationUpdate,
)
from app.services.audit_log import create_audit_log
from app.services.recommendation_service import (
    create_recommendation,
    generate_employee_recommendations,
    get_recommendation,
    get_recommendation_summary,
    list_recommendations,
    update_recommendation,
)


router = APIRouter(
    prefix="/recommendations",
    tags=["AI Recommendations"],
)


@router.post(
    "/generate/{employee_id}",
    response_model=list[RecommendationResponse],
)
def generate_recommendations(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_admin_hr_manager
    ),
):
    try:
        recommendations = generate_employee_recommendations(
            db=db,
            employee_id=employee_id,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )

    for recommendation in recommendations:
        create_audit_log(
            db=db,
            user_id=current_user.id,
            action="CREATE",
            module="AI_RECOMMENDATIONS",
            description=(
                f"AI recommendation {recommendation.id} "
                f"was generated for employee "
                f"{employee_id}."
            ),
            entity_type="AI_RECOMMENDATION",
            entity_id=recommendation.id,
        )

    return recommendations


@router.post(
    "",
    response_model=RecommendationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_manual_recommendation(
    recommendation_data: RecommendationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_admin_hr_manager
    ),
):
    try:
        recommendation = create_recommendation(
            db=db,
            employee_id=recommendation_data.employee_id,
            recommendation_type=(
                recommendation_data.recommendation_type
            ),
            priority=recommendation_data.priority,
            title=recommendation_data.title,
            recommendation=(
                recommendation_data.recommendation
            ),
            reason=recommendation_data.reason
            or "Manually created HR recommendation.",
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        module="AI_RECOMMENDATIONS",
        description=(
            f"AI recommendation {recommendation.id} "
            f"was created for employee "
            f"{recommendation.employee_id}."
        ),
        entity_type="AI_RECOMMENDATION",
        entity_id=recommendation.id,
    )

    return recommendation


@router.get(
    "",
    response_model=list[RecommendationResponse],
)
def get_all_recommendations(
    employee_id: int | None = Query(
        default=None,
        description="Filter by employee ID.",
    ),
    recommendation_status: RecommendationStatus | None = Query(
        default=None,
        alias="status",
        description="Filter by recommendation status.",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_admin_hr_manager
    ),
):
    return list_recommendations(
        db=db,
        employee_id=employee_id,
        recommendation_status=recommendation_status,
    )


@router.get(
    "/my",
    response_model=list[RecommendationResponse],
)
def get_my_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.employee import Employee

    employee = (
        db.query(Employee)
        .filter(
            Employee.user_id == current_user.id
        )
        .first()
    )

    if employee is None:
        return []

    return list_recommendations(
        db=db,
        employee_id=employee.id,
    )


@router.get(
    "/employee/{employee_id}",
    response_model=list[RecommendationResponse],
)
def get_employee_recommendations(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_admin_hr_manager
    ),
):
    return list_recommendations(
        db=db,
        employee_id=employee_id,
    )


@router.get(
    "/summary",
    response_model=RecommendationSummaryResponse,
)
def recommendation_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_admin_hr_manager
    ),
):
    return get_recommendation_summary(
        db=db,
    )


@router.get(
    "/{recommendation_id}",
    response_model=RecommendationResponse,
)
def get_single_recommendation(
    recommendation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_admin_hr_manager
    ),
):
    try:
        return get_recommendation(
            db=db,
            recommendation_id=recommendation_id,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )


@router.put(
    "/{recommendation_id}",
    response_model=RecommendationResponse,
)
def update_single_recommendation(
    recommendation_id: int,
    recommendation_data: RecommendationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_admin_hr_manager
    ),
):
    try:
        recommendation = update_recommendation(
            db=db,
            recommendation_id=recommendation_id,
            update_data=(
                recommendation_data.model_dump(
                    exclude_unset=True
                )
            ),
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE",
        module="AI_RECOMMENDATIONS",
        description=(
            f"AI recommendation {recommendation.id} "
            "was updated successfully."
        ),
        entity_type="AI_RECOMMENDATION",
        entity_id=recommendation.id,
    )

    return recommendation