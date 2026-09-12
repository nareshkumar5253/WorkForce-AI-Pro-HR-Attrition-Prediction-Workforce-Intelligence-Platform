import io
import pandas as pd

from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.models.attendance import Attendance
from app.models.leave import LeaveRequest
from app.models.payroll import Payroll
from app.models.prediction import AttritionPrediction


def export_workforce_report(db: Session, file_format: str):
    employees = db.query(Employee).all()

    rows = []

    for employee in employees:
        rows.append(
            {
                "Employee ID": employee.id,
                "Employee Code": employee.employee_code,
                "First Name": employee.first_name,
                "Last Name": employee.last_name,
                "Department ID": employee.department_id,
                "Job Role ID": employee.job_role_id,
                "Employment Status": employee.employment_status,
                "Joining Date": employee.joining_date,
                "Salary": float(employee.salary or 0),
            }
        )

    df = pd.DataFrame(rows)

    return _create_file(
        df,
        "workforce_report",
        file_format,
    )


def export_attendance_report(db: Session, file_format: str):
    records = db.query(Attendance).all()

    rows = []

    for record in records:
        rows.append(
            {
                "Attendance ID": record.id,
                "Employee ID": record.employee_id,
                "Attendance Date": record.attendance_date,
                "Check In": record.check_in,
                "Check Out": record.check_out,
                "Status": record.status,
                "Late Minutes": record.late_minutes,
                "Working Hours": float(record.working_hours or 0),
                "Remarks": record.remarks,
            }
        )

    df = pd.DataFrame(rows)

    return _create_file(
        df,
        "attendance_report",
        file_format,
    )


def export_leave_report(db: Session, file_format: str):
    leaves = db.query(LeaveRequest).all()

    rows = []

    for leave in leaves:
        rows.append(
            {
                "Leave ID": leave.id,
                "Employee ID": leave.employee_id,
                "Leave Type ID": leave.leave_type_id,
                "Start Date": leave.start_date,
                "End Date": leave.end_date,
                "Total Days": leave.total_days,
                "Status": leave.status,
                "Reason": leave.reason,
            }
        )

    df = pd.DataFrame(rows)

    return _create_file(
        df,
        "leave_report",
        file_format,
    )


def export_payroll_report(db: Session, file_format: str):
    payrolls = db.query(Payroll).all()

    rows = []

    for payroll in payrolls:
        rows.append(
            {
                "Payroll ID": payroll.id,
                "Employee ID": payroll.employee_id,
                "Year": payroll.payroll_year,
                "Month": payroll.payroll_month,
                "Basic Salary": float(payroll.basic_salary or 0),
                "HRA": float(payroll.hra or 0),
                "Allowances": float(payroll.allowances or 0),
                "Bonus": float(payroll.bonus or 0),
                "Deductions": float(payroll.deductions or 0),
                "Gross Salary": float(payroll.gross_salary or 0),
                "Net Salary": float(payroll.net_salary or 0),
                "Status": payroll.status,
                "Payment Date": payroll.payment_date,
                "Remarks": payroll.remarks,
            }
        )

    df = pd.DataFrame(rows)

    return _create_file(
        df,
        "payroll_report",
        file_format,
    )


def export_attrition_report(db: Session, file_format: str):
    predictions = db.query(AttritionPrediction).all()

    latest_predictions = {}

    for prediction in predictions:
        if prediction.employee_id is None:
            continue

        employee_id = prediction.employee_id

        if (
            employee_id not in latest_predictions
            or prediction.created_at
            > latest_predictions[employee_id].created_at
        ):
            latest_predictions[employee_id] = prediction

    rows = []

    for prediction in latest_predictions.values():
        rows.append(
            {
                "Prediction ID": prediction.id,
                "Employee ID": prediction.employee_id,
                "Dataset ID": prediction.dataset_id,
                "Prediction": prediction.prediction,
                "Attrition Probability": float(
                    prediction.attrition_probability
                ),
                "Risk Level": prediction.risk_level,
                "Model Name": prediction.model_name,
                "Created At": prediction.created_at,
            }
        )

    df = pd.DataFrame(rows)

    return _create_file(
        df,
        "attrition_report",
        file_format,
    )


def _create_file(
    dataframe: pd.DataFrame,
    filename: str,
    file_format: str,
):
    file_format = file_format.lower()

    if file_format == "csv":
        content = dataframe.to_csv(index=False).encode("utf-8")

        return io.BytesIO(content), f"{filename}.csv", "text/csv"

    if file_format in {"excel", "xlsx"}:
        output = io.BytesIO()

        with pd.ExcelWriter(
            output,
            engine="openpyxl",
        ) as writer:
            dataframe.to_excel(
                writer,
                index=False,
                sheet_name="Report",
            )

        output.seek(0)

        return (
            output,
            f"{filename}.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

    raise ValueError(
        "Unsupported format. Use 'csv' or 'excel'."
    )