from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.performance import PerformanceReview
from app.models.prediction import AttritionPrediction
from app.models.recommendation import (
    AIRecommendation,
    RecommendationPriority,
    RecommendationStatus,
    RecommendationType,
)


def get_employee(
    db: Session,
    employee_id: int,
) -> Employee:
    employee = (
        db.query(Employee)
        .filter(Employee.id == employee_id)
        .first()
    )

    if employee is None:
        raise ValueError("Employee not found.")

    return employee


def get_latest_attrition_prediction(
    db: Session,
    employee_id: int,
):
    return (
        db.query(AttritionPrediction)
        .filter(
            AttritionPrediction.employee_id == employee_id
        )
        .order_by(
            AttritionPrediction.created_at.desc()
        )
        .first()
    )


def get_latest_performance_review(
    db: Session,
    employee_id: int,
):
    return (
        db.query(PerformanceReview)
        .filter(
            PerformanceReview.employee_id == employee_id
        )
        .order_by(
            PerformanceReview.created_at.desc()
        )
        .first()
    )


def get_attendance_records(
    db: Session,
    employee_id: int,
):
    return (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee_id
        )
        .order_by(
            Attendance.attendance_date.desc()
        )
        .limit(30)
        .all()
    )


def create_recommendation(
    db: Session,
    employee_id: int,
    recommendation_type: RecommendationType,
    priority: RecommendationPriority,
    title: str,
    recommendation: str,
    reason: str,
):
    existing = (
        db.query(AIRecommendation)
        .filter(
            AIRecommendation.employee_id == employee_id,
            AIRecommendation.recommendation_type
            == recommendation_type,
            AIRecommendation.status.in_(
                [
                    RecommendationStatus.NEW,
                    RecommendationStatus.REVIEWED,
                    RecommendationStatus.ACCEPTED,
                ]
            ),
        )
        .first()
    )

    if existing:
        return existing

    recommendation_record = AIRecommendation(
        employee_id=employee_id,
        recommendation_type=recommendation_type,
        priority=priority,
        title=title,
        recommendation=recommendation,
        reason=reason,
        status=RecommendationStatus.NEW,
        generated_by="AI_RULE_ENGINE",
    )

    db.add(recommendation_record)
    db.commit()
    db.refresh(recommendation_record)

    return recommendation_record


def generate_employee_recommendations(
    db: Session,
    employee_id: int,
):
    employee = get_employee(
        db=db,
        employee_id=employee_id,
    )

    prediction = get_latest_attrition_prediction(
        db=db,
        employee_id=employee_id,
    )

    performance = get_latest_performance_review(
        db=db,
        employee_id=employee_id,
    )

    attendance_records = get_attendance_records(
        db=db,
        employee_id=employee_id,
    )

    recommendations = []

    # =========================================================
    # 1. ATTRITION / RETENTION
    # =========================================================

    if prediction:
        probability = float(
            prediction.attrition_probability
        )

        if probability >= 85:
            recommendations.append(
                create_recommendation(
                    db=db,
                    employee_id=employee_id,
                    recommendation_type=(
                        RecommendationType.RETENTION
                    ),
                    priority=(
                        RecommendationPriority.URGENT
                    ),
                    title=(
                        "Immediate Retention Intervention"
                    ),
                    recommendation=(
                        "Schedule an immediate one-to-one "
                        "retention discussion with the employee "
                        "and manager. Identify the main reasons "
                        "behind the employee's attrition risk "
                        "and prepare a targeted retention plan."
                    ),
                    reason=(
                        f"AI attrition probability is "
                        f"{probability:.2f}%, indicating "
                        "critical attrition risk."
                    ),
                )
            )

        elif probability >= 70:
            recommendations.append(
                create_recommendation(
                    db=db,
                    employee_id=employee_id,
                    recommendation_type=(
                        RecommendationType.RETENTION
                    ),
                    priority=(
                        RecommendationPriority.HIGH
                    ),
                    title=(
                        "Retention Discussion Recommended"
                    ),
                    recommendation=(
                        "Arrange a manager discussion with the "
                        "employee to understand concerns and "
                        "identify appropriate retention actions."
                    ),
                    reason=(
                        f"AI attrition probability is "
                        f"{probability:.2f}%, indicating "
                        "high attrition risk."
                    ),
                )
            )

    # =========================================================
    # 2. PERFORMANCE
    # =========================================================

    if performance:
        score = (
            float(performance.overall_score)
            if performance.overall_score is not None
            else None
        )

        if score is not None and score < 60:
            recommendations.append(
                create_recommendation(
                    db=db,
                    employee_id=employee_id,
                    recommendation_type=(
                        RecommendationType.PERFORMANCE
                    ),
                    priority=(
                        RecommendationPriority.HIGH
                    ),
                    title=(
                        "Performance Improvement Plan"
                    ),
                    recommendation=(
                        "Create a structured performance "
                        "improvement plan with measurable goals, "
                        "regular manager reviews, and targeted "
                        "training or mentoring."
                    ),
                    reason=(
                        f"Latest overall performance score is "
                        f"{score:.2f}, which indicates "
                        "performance improvement is required."
                    ),
                )
            )

        elif score is not None and score >= 85:
            recommendations.append(
                create_recommendation(
                    db=db,
                    employee_id=employee_id,
                    recommendation_type=(
                        RecommendationType.CAREER_DEVELOPMENT
                    ),
                    priority=(
                        RecommendationPriority.MEDIUM
                    ),
                    title=(
                        "Career Development Opportunity"
                    ),
                    recommendation=(
                        "Consider the employee for advanced "
                        "responsibilities, leadership opportunities, "
                        "skill development, or a career progression plan."
                    ),
                    reason=(
                        f"Latest overall performance score is "
                        f"{score:.2f}, indicating strong performance."
                    ),
                )
            )

    # =========================================================
    # 3. ATTENDANCE
    # =========================================================

    if attendance_records:
        total_records = len(attendance_records)

        absent_count = sum(
            1
            for record in attendance_records
            if str(record.status) in {
                "ABSENT",
                "AttendanceStatus.ABSENT",
            }
        )

        late_count = sum(
            1
            for record in attendance_records
            if str(record.status) in {
                "LATE",
                "AttendanceStatus.LATE",
            }
        )

        absence_rate = (
            absent_count / total_records
        ) * 100

        if absence_rate >= 20:
            recommendations.append(
                create_recommendation(
                    db=db,
                    employee_id=employee_id,
                    recommendation_type=(
                        RecommendationType.ATTENDANCE
                    ),
                    priority=(
                        RecommendationPriority.HIGH
                    ),
                    title=(
                        "Attendance Monitoring Required"
                    ),
                    recommendation=(
                        "Review the employee's attendance pattern "
                        "with the manager and HR. Identify recurring "
                        "attendance issues and determine whether "
                        "support or corrective action is required."
                    ),
                    reason=(
                        f"{absence_rate:.2f}% of the latest "
                        f"{total_records} attendance records "
                        "were marked absent."
                    ),
                )
            )

        elif late_count >= 3:
            recommendations.append(
                create_recommendation(
                    db=db,
                    employee_id=employee_id,
                    recommendation_type=(
                        RecommendationType.ATTENDANCE
                    ),
                    priority=(
                        RecommendationPriority.MEDIUM
                    ),
                    title=(
                        "Monitor Late Attendance"
                    ),
                    recommendation=(
                        "Monitor the employee's late attendance "
                        "pattern and discuss possible scheduling "
                        "or workload issues with the employee."
                    ),
                    reason=(
                        f"The employee has {late_count} late "
                        "attendance records in the latest "
                        f"{total_records} records."
                    ),
                )
            )

    # =========================================================
    # 4. HIGH-RISK + HIGH-PERFORMANCE ENGAGEMENT
    # =========================================================

    if prediction and performance:
        probability = float(
            prediction.attrition_probability
        )

        score = (
            float(performance.overall_score)
            if performance.overall_score is not None
            else None
        )

        if (
            probability >= 70
            and score is not None
            and score >= 80
        ):
            recommendations.append(
                create_recommendation(
                    db=db,
                    employee_id=employee_id,
                    recommendation_type=(
                        RecommendationType.ENGAGEMENT
                    ),
                    priority=(
                        RecommendationPriority.HIGH
                    ),
                    title=(
                        "High Performer Retention Strategy"
                    ),
                    recommendation=(
                        "Prioritize engagement and retention "
                        "actions for this employee. Consider "
                        "career growth, recognition, compensation "
                        "review, mentoring, or increased responsibility."
                    ),
                    reason=(
                        f"The employee has a high attrition "
                        f"probability of {probability:.2f}% while "
                        f"maintaining a strong performance score "
                        f"of {score:.2f}."
                    ),
                )
            )

    # =========================================================
    # 5. MANAGER ACTION
    # =========================================================

    if prediction:
        probability = float(
            prediction.attrition_probability
        )

        if probability >= 70:
            recommendations.append(
                create_recommendation(
                    db=db,
                    employee_id=employee_id,
                    recommendation_type=(
                        RecommendationType.MANAGER_ACTION
                    ),
                    priority=(
                        RecommendationPriority.HIGH
                    ),
                    title=(
                        "Manager Follow-Up Required"
                    ),
                    recommendation=(
                        "Assign the employee's manager to conduct "
                        "a regular follow-up discussion and document "
                        "employee concerns, engagement level, "
                        "workload, and career expectations."
                    ),
                    reason=(
                        f"Employee attrition probability is "
                        f"{probability:.2f}%."
                    ),
                )
            )

    return recommendations


def list_recommendations(
    db: Session,
    employee_id: int | None = None,
    recommendation_status: RecommendationStatus | None = None,
):
    query = db.query(AIRecommendation)

    if employee_id is not None:
        query = query.filter(
            AIRecommendation.employee_id == employee_id
        )

    if recommendation_status is not None:
        query = query.filter(
            AIRecommendation.status
            == recommendation_status
        )

    return (
        query
        .order_by(
            AIRecommendation.created_at.desc()
        )
        .all()
    )


def get_recommendation(
    db: Session,
    recommendation_id: int,
):
    recommendation = (
        db.query(AIRecommendation)
        .filter(
            AIRecommendation.id == recommendation_id
        )
        .first()
    )

    if recommendation is None:
        raise ValueError(
            "Recommendation not found."
        )

    return recommendation


def update_recommendation(
    db: Session,
    recommendation_id: int,
    update_data: dict,
):
    recommendation = get_recommendation(
        db=db,
        recommendation_id=recommendation_id,
    )

    for field, value in update_data.items():
        setattr(
            recommendation,
            field,
            value,
        )

    db.commit()
    db.refresh(recommendation)

    return recommendation


def get_recommendation_summary(
    db: Session,
):
    recommendations = (
        db.query(AIRecommendation)
        .all()
    )

    return {
        "total_recommendations": len(
            recommendations
        ),

        "new_recommendations": sum(
            1
            for item in recommendations
            if item.status
            == RecommendationStatus.NEW
        ),

        "reviewed_recommendations": sum(
            1
            for item in recommendations
            if item.status
            == RecommendationStatus.REVIEWED
        ),

        "accepted_recommendations": sum(
            1
            for item in recommendations
            if item.status
            == RecommendationStatus.ACCEPTED
        ),

        "implemented_recommendations": sum(
            1
            for item in recommendations
            if item.status
            == RecommendationStatus.IMPLEMENTED
        ),

        "dismissed_recommendations": sum(
            1
            for item in recommendations
            if item.status
            == RecommendationStatus.DISMISSED
        ),

        "low_priority": sum(
            1
            for item in recommendations
            if item.priority
            == RecommendationPriority.LOW
        ),

        "medium_priority": sum(
            1
            for item in recommendations
            if item.priority
            == RecommendationPriority.MEDIUM
        ),

        "high_priority": sum(
            1
            for item in recommendations
            if item.priority
            == RecommendationPriority.HIGH
        ),

        "urgent_priority": sum(
            1
            for item in recommendations
            if item.priority
            == RecommendationPriority.URGENT
        ),
    }