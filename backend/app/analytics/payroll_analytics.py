from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.payroll import Payroll, PayrollStatus


def get_payroll_summary(db: Session):
    total_records = (
        db.query(func.count(Payroll.id))
        .scalar()
        or 0
    )

    pending_count = (
        db.query(func.count(Payroll.id))
        .filter(Payroll.status == PayrollStatus.PENDING)
        .scalar()
        or 0
    )

    processed_count = (
        db.query(func.count(Payroll.id))
        .filter(Payroll.status == PayrollStatus.PROCESSED)
        .scalar()
        or 0
    )

    paid_count = (
        db.query(func.count(Payroll.id))
        .filter(Payroll.status == PayrollStatus.PAID)
        .scalar()
        or 0
    )

    total_gross_salary = (
        db.query(func.coalesce(func.sum(Payroll.gross_salary), 0))
        .scalar()
        or 0
    )

    total_net_salary = (
        db.query(func.coalesce(func.sum(Payroll.net_salary), 0))
        .scalar()
        or 0
    )

    return {
        "total_records": total_records,
        "pending": pending_count,
        "processed": processed_count,
        "paid": paid_count,
        "total_gross_salary": total_gross_salary,
        "total_net_salary": total_net_salary,
    }

def get_salary_analytics(db: Session):
    total_employees = (
        db.query(func.count(Payroll.employee_id.distinct()))
        .scalar()
        or 0
    )

    average_basic_salary = (
        db.query(func.coalesce(func.avg(Payroll.basic_salary), 0))
        .scalar()
        or 0
    )

    average_gross_salary = (
        db.query(func.coalesce(func.avg(Payroll.gross_salary), 0))
        .scalar()
        or 0
    )

    average_net_salary = (
        db.query(func.coalesce(func.avg(Payroll.net_salary), 0))
        .scalar()
        or 0
    )

    highest_salary = (
        db.query(func.coalesce(func.max(Payroll.gross_salary), 0))
        .scalar()
        or 0
    )

    lowest_salary = (
        db.query(func.coalesce(func.min(Payroll.gross_salary), 0))
        .scalar()
        or 0
    )

    return {
        "total_employees": total_employees,
        "average_basic_salary": round(float(average_basic_salary), 2),
        "average_gross_salary": round(float(average_gross_salary), 2),
        "average_net_salary": round(float(average_net_salary), 2),
        "highest_gross_salary": round(float(highest_salary), 2),
        "lowest_gross_salary": round(float(lowest_salary), 2),
    }