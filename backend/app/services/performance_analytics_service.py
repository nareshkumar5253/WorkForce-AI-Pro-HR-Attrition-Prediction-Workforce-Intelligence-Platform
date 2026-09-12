from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.department import Department
from app.models.employee import Employee
from app.models.performance import (
    PerformanceRating,
    PerformanceReview,
    PerformanceReviewStatus,
)


def get_performance_summary(db: Session):
    total_reviews = db.query(PerformanceReview).count()

    draft_reviews = (
        db.query(PerformanceReview)
        .filter(PerformanceReview.status == PerformanceReviewStatus.DRAFT)
        .count()
    )

    submitted_reviews = (
        db.query(PerformanceReview)
        .filter(PerformanceReview.status == PerformanceReviewStatus.SUBMITTED)
        .count()
    )

    acknowledged_reviews = (
        db.query(PerformanceReview)
        .filter(PerformanceReview.status == PerformanceReviewStatus.ACKNOWLEDGED)
        .count()
    )

    completed_reviews = (
        db.query(PerformanceReview)
        .filter(PerformanceReview.status == PerformanceReviewStatus.COMPLETED)
        .count()
    )

    averages = db.query(
        func.avg(PerformanceReview.overall_score),
        func.avg(PerformanceReview.goals_achievement),
        func.avg(PerformanceReview.productivity_score),
        func.avg(PerformanceReview.teamwork_score),
        func.avg(PerformanceReview.communication_score),
    ).one()

    return {
        "total_reviews": total_reviews,
        "draft_reviews": draft_reviews,
        "submitted_reviews": submitted_reviews,
        "acknowledged_reviews": acknowledged_reviews,
        "completed_reviews": completed_reviews,
        "average_overall_score": (
            float(averages[0]) if averages[0] is not None else None
        ),
        "average_goals_achievement": (
            float(averages[1]) if averages[1] is not None else None
        ),
        "average_productivity_score": (
            float(averages[2]) if averages[2] is not None else None
        ),
        "average_teamwork_score": (
            float(averages[3]) if averages[3] is not None else None
        ),
        "average_communication_score": (
            float(averages[4]) if averages[4] is not None else None
        ),
    }


def get_rating_distribution(db: Session):
    results = (
        db.query(
            PerformanceReview.rating,
            func.count(PerformanceReview.id),
        )
        .filter(PerformanceReview.rating.isnot(None))
        .group_by(PerformanceReview.rating)
        .all()
    )

    return [
        {
            "rating": rating,
            "count": count,
        }
        for rating, count in results
    ]


def get_status_distribution(db: Session):
    results = (
        db.query(
            PerformanceReview.status,
            func.count(PerformanceReview.id),
        )
        .group_by(PerformanceReview.status)
        .all()
    )

    return [
        {
            "status": review_status,
            "count": count,
        }
        for review_status, count in results
    ]


def get_department_performance(db: Session):
    results = (
        db.query(
            Department.id,
            Department.name,
            func.count(PerformanceReview.id),
            func.avg(PerformanceReview.overall_score),
        )
        .join(
            Employee,
            Employee.department_id == Department.id,
        )
        .join(
            PerformanceReview,
            PerformanceReview.employee_id == Employee.id,
        )
        .group_by(
            Department.id,
            Department.name,
        )
        .all()
    )

    response = []

    for department_id, department_name, total_reviews, average_score in results:
        completed_reviews = (
            db.query(PerformanceReview)
            .join(
                Employee,
                PerformanceReview.employee_id == Employee.id,
            )
            .filter(
                Employee.department_id == department_id,
                PerformanceReview.status == PerformanceReviewStatus.COMPLETED,
            )
            .count()
        )

        response.append(
            {
                "department_id": department_id,
                "department_name": department_name,
                "total_reviews": total_reviews,
                "average_overall_score": (
                    float(average_score)
                    if average_score is not None
                    else None
                ),
                "completed_reviews": completed_reviews,
            }
        )

    return response


def get_employee_performance_analytics(
    db: Session,
    employee_id: int,
):
    employee = (
        db.query(Employee)
        .filter(Employee.id == employee_id)
        .first()
    )

    if employee is None:
        return None

    reviews = (
        db.query(PerformanceReview)
        .filter(PerformanceReview.employee_id == employee_id)
        .order_by(PerformanceReview.created_at.desc())
        .all()
    )

    total_reviews = len(reviews)

    completed_reviews = sum(
        1
        for review in reviews
        if review.status == PerformanceReviewStatus.COMPLETED
    )

    def average(field_name: str):
        values = [
            getattr(review, field_name)
            for review in reviews
            if getattr(review, field_name) is not None
        ]

        if not values:
            return None

        return float(sum(float(value) for value in values) / len(values))

    latest_review = reviews[0] if reviews else None

    employee_name = f"{employee.first_name} {employee.last_name}".strip()

    return {
        "employee_id": employee.id,
        "employee_name": employee_name,
        "total_reviews": total_reviews,
        "completed_reviews": completed_reviews,
        "average_overall_score": average("overall_score"),
        "average_goals_achievement": average("goals_achievement"),
        "average_productivity_score": average("productivity_score"),
        "average_teamwork_score": average("teamwork_score"),
        "average_communication_score": average("communication_score"),
        "latest_rating": latest_review.rating if latest_review else None,
        "latest_status": latest_review.status if latest_review else None,
    }