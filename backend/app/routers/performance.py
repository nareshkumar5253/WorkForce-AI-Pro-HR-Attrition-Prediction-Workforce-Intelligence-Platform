from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_current_admin_hr_manager,
    get_current_user,
)
from app.models.employee import Employee
from app.models.performance import PerformanceReviewStatus
from app.models.user import User

from app.schemas.performance import (
    DepartmentPerformanceResponse,
    EmployeePerformanceAnalyticsResponse,
    PerformanceAnalyticsSummaryResponse,
    PerformanceRatingDistributionResponse,
    PerformanceReviewCreate,
    PerformanceReviewResponse,
    PerformanceReviewUpdate,
    PerformanceStatusDistributionResponse,
)

from app.services.audit_log import create_audit_log

from app.services.performance_service import (
    create_performance_review,
    delete_performance_review,
    get_employee_performance_reviews,
    get_performance_review,
    list_performance_reviews,
    update_performance_review,
)

from app.services.performance_analytics_service import (
    get_department_performance,
    get_employee_performance_analytics,
    get_performance_summary,
    get_rating_distribution,
    get_status_distribution,
)


router = APIRouter(
    prefix="/performance",
    tags=["Performance Reviews"],
)


def get_employee_for_user(
    db: Session,
    user_id: int,
) -> Employee | None:
    return (
        db.query(Employee)
        .filter(Employee.user_id == user_id)
        .first()
    )


# ============================================================
# PERFORMANCE REVIEW CRUD
# ============================================================

@router.post(
    "",
    response_model=PerformanceReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    review_data: PerformanceReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_hr_manager),
):
    review = create_performance_review(
        db=db,
        review_data=review_data,
        current_user=current_user,
    )

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        module="PERFORMANCE_REVIEWS",
        description=(
            f"Performance review {review.id} was created "
            f"for employee {review.employee_id}."
        ),
        entity_type="PERFORMANCE_REVIEW",
        entity_id=review.id,
    )

    return review


@router.get(
    "",
    response_model=list[PerformanceReviewResponse],
)
def get_all_reviews(
    employee_id: int | None = Query(
        default=None,
        description="Filter reviews by employee ID.",
    ),
    review_status: PerformanceReviewStatus | None = Query(
        default=None,
        alias="status",
        description="Filter reviews by status.",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_hr_manager),
):
    return list_performance_reviews(
        db=db,
        employee_id=employee_id,
        status_filter=review_status,
    )


@router.get(
    "/my",
    response_model=list[PerformanceReviewResponse],
)
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_for_user(
        db=db,
        user_id=current_user.id,
    )

    if employee is None:
        return []

    return get_employee_performance_reviews(
        db=db,
        employee_id=employee.id,
    )


@router.get(
    "/employee/{employee_id}",
    response_model=list[PerformanceReviewResponse],
)
def get_employee_reviews(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_hr_manager),
):
    return get_employee_performance_reviews(
        db=db,
        employee_id=employee_id,
    )


# ============================================================
# PERFORMANCE ANALYTICS
# ============================================================

@router.get(
    "/analytics/summary",
    response_model=PerformanceAnalyticsSummaryResponse,
)
def performance_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_hr_manager),
):
    return get_performance_summary(db=db)


@router.get(
    "/analytics/rating-distribution",
    response_model=list[PerformanceRatingDistributionResponse],
)
def performance_rating_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_hr_manager),
):
    return get_rating_distribution(db=db)


@router.get(
    "/analytics/status-distribution",
    response_model=list[PerformanceStatusDistributionResponse],
)
def performance_status_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_hr_manager),
):
    return get_status_distribution(db=db)


@router.get(
    "/analytics/department",
    response_model=list[DepartmentPerformanceResponse],
)
def performance_department_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_hr_manager),
):
    return get_department_performance(db=db)


@router.get(
    "/analytics/employee/{employee_id}",
    response_model=EmployeePerformanceAnalyticsResponse,
)
def performance_employee_analytics(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_hr_manager),
):
    analytics = get_employee_performance_analytics(
        db=db,
        employee_id=employee_id,
    )

    if analytics is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found.",
        )

    return analytics


# ============================================================
# SINGLE PERFORMANCE REVIEW
# ============================================================

@router.get(
    "/{review_id}",
    response_model=PerformanceReviewResponse,
)
def get_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_hr_manager),
):
    return get_performance_review(
        db=db,
        review_id=review_id,
    )


@router.put(
    "/{review_id}",
    response_model=PerformanceReviewResponse,
)
def update_review(
    review_id: int,
    review_data: PerformanceReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_hr_manager),
):
    review = update_performance_review(
        db=db,
        review_id=review_id,
        review_data=review_data,
    )

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE",
        module="PERFORMANCE_REVIEWS",
        description=(
            f"Performance review {review.id} was updated successfully."
        ),
        entity_type="PERFORMANCE_REVIEW",
        entity_id=review.id,
    )

    return review


@router.delete(
    "/{review_id}",
)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_hr_manager),
):
    review = get_performance_review(
        db=db,
        review_id=review_id,
    )

    review_id_value = review.id

    delete_performance_review(
        db=db,
        review_id=review_id,
    )

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="DELETE",
        module="PERFORMANCE_REVIEWS",
        description=(
            f"Performance review {review_id_value} was deleted successfully."
        ),
        entity_type="PERFORMANCE_REVIEW",
        entity_id=review_id_value,
    )

    return {
        "message": "Performance review deleted successfully.",
        "review_id": review_id_value,
    }