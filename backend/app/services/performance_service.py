from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.models.performance import (
    PerformanceReview,
    PerformanceReviewStatus,
)
from app.models.user import User
from app.schemas.performance import (
    PerformanceReviewCreate,
    PerformanceReviewUpdate,
)


def validate_employee(db: Session, employee_id: int) -> Employee:
    employee = (
        db.query(Employee)
        .filter(Employee.id == employee_id)
        .first()
    )

    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found.",
        )

    employment_status = (
        employee.employment_status.value
        if hasattr(employee.employment_status, "value")
        else str(employee.employment_status)
    )

    if employment_status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Performance reviews can only be created for active employees.",
        )

    return employee


def create_performance_review(
    db: Session,
    review_data: PerformanceReviewCreate,
    current_user: User,
) -> PerformanceReview:

    if review_data.review_period_end < review_data.review_period_start:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Review period end date cannot be before start date.",
        )

    validate_employee(db, review_data.employee_id)

    existing_review = (
        db.query(PerformanceReview)
        .filter(
            PerformanceReview.employee_id == review_data.employee_id,
            PerformanceReview.review_period_start
            == review_data.review_period_start,
            PerformanceReview.review_period_end
            == review_data.review_period_end,
        )
        .first()
    )

    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A performance review already exists for this employee and review period.",
        )

    review = PerformanceReview(
        employee_id=review_data.employee_id,
        reviewer_id=current_user.id,
        review_period_start=review_data.review_period_start,
        review_period_end=review_data.review_period_end,
        rating=review_data.rating,
        overall_score=review_data.overall_score,
        goals_achievement=review_data.goals_achievement,
        productivity_score=review_data.productivity_score,
        teamwork_score=review_data.teamwork_score,
        communication_score=review_data.communication_score,
        strengths=review_data.strengths,
        areas_for_improvement=review_data.areas_for_improvement,
        manager_comments=review_data.manager_comments,
        status=PerformanceReviewStatus.DRAFT,
    )

    db.add(review)
    db.commit()
    db.refresh(review)

    return review


def get_performance_review(
    db: Session,
    review_id: int,
) -> PerformanceReview:

    review = (
        db.query(PerformanceReview)
        .filter(PerformanceReview.id == review_id)
        .first()
    )

    if review is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Performance review not found.",
        )

    return review


def list_performance_reviews(
    db: Session,
    employee_id: int | None = None,
    status_filter: PerformanceReviewStatus | None = None,
) -> list[PerformanceReview]:

    query = db.query(PerformanceReview)

    if employee_id is not None:
        query = query.filter(
            PerformanceReview.employee_id == employee_id
        )

    if status_filter is not None:
        query = query.filter(
            PerformanceReview.status == status_filter
        )

    return (
        query
        .order_by(PerformanceReview.created_at.desc())
        .all()
    )


def get_employee_performance_reviews(
    db: Session,
    employee_id: int,
) -> list[PerformanceReview]:

    validate_employee(db, employee_id)

    return (
        db.query(PerformanceReview)
        .filter(PerformanceReview.employee_id == employee_id)
        .order_by(PerformanceReview.created_at.desc())
        .all()
    )


def update_performance_review(
    db: Session,
    review_id: int,
    review_data: PerformanceReviewUpdate,
) -> PerformanceReview:

    review = get_performance_review(
        db=db,
        review_id=review_id,
    )

    update_data = review_data.model_dump(
        exclude_unset=True
    )

    new_status = update_data.get("status")

    if new_status == PerformanceReviewStatus.SUBMITTED:
        review.reviewed_at = datetime.utcnow()

    elif new_status == PerformanceReviewStatus.ACKNOWLEDGED:
        if review.reviewed_at is None:
            review.reviewed_at = datetime.utcnow()

        review.acknowledged_at = datetime.utcnow()

    elif new_status == PerformanceReviewStatus.COMPLETED:
        if review.reviewed_at is None:
            review.reviewed_at = datetime.utcnow()

        if review.acknowledged_at is None:
            review.acknowledged_at = datetime.utcnow()

    for field, value in update_data.items():
        setattr(review, field, value)

    db.commit()
    db.refresh(review)

    return review


def delete_performance_review(
    db: Session,
    review_id: int,
) -> PerformanceReview:

    review = get_performance_review(
        db=db,
        review_id=review_id,
    )

    db.delete(review)
    db.commit()

    return review