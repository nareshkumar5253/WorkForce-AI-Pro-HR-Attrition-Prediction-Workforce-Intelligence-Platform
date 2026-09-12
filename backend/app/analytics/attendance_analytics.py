from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.attendance import Attendance


def get_attendance_summary(db: Session):
    total_records = (
        db.query(func.count(Attendance.id))
        .scalar()
        or 0
    )

    present_count = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.status == "PRESENT")
        .scalar()
        or 0
    )

    late_count = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.status == "LATE")
        .scalar()
        or 0
    )

    absent_count = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.status == "ABSENT")
        .scalar()
        or 0
    )

    half_day_count = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.status == "HALF_DAY")
        .scalar()
        or 0
    )

    return {
        "total_records": total_records,
        "present": present_count,
        "late": late_count,
        "absent": absent_count,
        "half_day": half_day_count,
    }


def get_attendance_rate(db: Session):
    total_records = (
        db.query(func.count(Attendance.id))
        .scalar()
        or 0
    )

    if total_records == 0:
        return {
            "total_records": 0,
            "attendance_rate": 0.0,
        }

    present_count = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.status == "PRESENT")
        .scalar()
        or 0
    )

    late_count = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.status == "LATE")
        .scalar()
        or 0
    )

    half_day_count = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.status == "HALF_DAY")
        .scalar()
        or 0
    )

    attendance_rate = (
        (
            present_count
            + late_count
            + (half_day_count * 0.5)
        )
        / total_records
    ) * 100

    return {
        "total_records": total_records,
        "attendance_rate": round(
            attendance_rate,
            2,
        ),
    }


# ============================================================
# ATTENDANCE TREND
# ============================================================

def get_attendance_trend(db: Session):
    results = (
        db.query(
            Attendance.attendance_date.label(
                "attendance_date"
            ),
            func.count(Attendance.id).label(
                "total_records"
            ),
        )
        .group_by(
            Attendance.attendance_date
        )
        .order_by(
            Attendance.attendance_date.asc()
        )
        .all()
    )

    trend = []

    for row in results:

        present_count = (
            db.query(func.count(Attendance.id))
            .filter(
                Attendance.attendance_date
                == row.attendance_date,
                Attendance.status == "PRESENT",
            )
            .scalar()
            or 0
        )

        late_count = (
            db.query(func.count(Attendance.id))
            .filter(
                Attendance.attendance_date
                == row.attendance_date,
                Attendance.status == "LATE",
            )
            .scalar()
            or 0
        )

        absent_count = (
            db.query(func.count(Attendance.id))
            .filter(
                Attendance.attendance_date
                == row.attendance_date,
                Attendance.status == "ABSENT",
            )
            .scalar()
            or 0
        )

        half_day_count = (
            db.query(func.count(Attendance.id))
            .filter(
                Attendance.attendance_date
                == row.attendance_date,
                Attendance.status == "HALF_DAY",
            )
            .scalar()
            or 0
        )

        trend.append(
            {
                "date": row.attendance_date,
                "total_records": row.total_records,
                "present": present_count,
                "late": late_count,
                "absent": absent_count,
                "half_day": half_day_count,
            }
        )

    return trend