from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.leave import (
    LeaveRequest,
    LeaveRequestStatus,
    LeaveType,
)
from app.models.leave import LeaveRequest, LeaveRequestStatus


def get_leave_summary(db: Session):
    total_requests = (
        db.query(func.count(LeaveRequest.id))
        .scalar()
        or 0
    )

    pending_count = (
        db.query(func.count(LeaveRequest.id))
        .filter(
            LeaveRequest.status == LeaveRequestStatus.PENDING
        )
        .scalar()
        or 0
    )

    approved_count = (
        db.query(func.count(LeaveRequest.id))
        .filter(
            LeaveRequest.status == LeaveRequestStatus.APPROVED
        )
        .scalar()
        or 0
    )

    rejected_count = (
        db.query(func.count(LeaveRequest.id))
        .filter(
            LeaveRequest.status == LeaveRequestStatus.REJECTED
        )
        .scalar()
        or 0
    )

    cancelled_count = (
        db.query(func.count(LeaveRequest.id))
        .filter(
            LeaveRequest.status == LeaveRequestStatus.CANCELLED
        )
        .scalar()
        or 0
    )

    return {
        "total_requests": total_requests,
        "pending": pending_count,
        "approved": approved_count,
        "rejected": rejected_count,
        "cancelled": cancelled_count,
    }
def get_leave_by_type(db: Session):
    results = (
        db.query(
            LeaveRequest.leave_type_id,
            LeaveType.name.label("leave_type_name"),
            func.count(LeaveRequest.id).label("request_count"),
        )
        .join(
            LeaveType,
            LeaveType.id == LeaveRequest.leave_type_id,
        )
        .group_by(
            LeaveRequest.leave_type_id,
            LeaveType.name,
        )
        .order_by(
            LeaveType.name.asc()
        )
        .all()
    )

    return [
        {
            "leave_type_id": row.leave_type_id,
            "leave_type_name": row.leave_type_name,
            "request_count": row.request_count,
        }
        for row in results
    ]