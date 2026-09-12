from datetime import date
from pydantic import BaseModel


class ReportFilter(BaseModel):
    start_date: date | None = None
    end_date: date | None = None
    department_id: int | None = None
    employee_id: int | None = None


class WorkforceReportResponse(BaseModel):
    report_type: str
    generated_at: str
    total_employees: int
    active_employees: int
    on_leave: int
    resigned: int
    terminated: int
    departments: list[dict]


class AttendanceReportResponse(BaseModel):
    report_type: str
    generated_at: str
    total_records: int
    present_days: int
    late_days: int
    half_days: int
    absent_days: int
    attendance_percentage: float


class LeaveReportResponse(BaseModel):
    report_type: str
    generated_at: str
    total_requests: int
    pending: int
    approved: int
    rejected: int
    cancelled: int


class PayrollReportResponse(BaseModel):
    report_type: str
    generated_at: str
    total_records: int
    pending: int
    processed: int
    paid: int
    total_gross_salary: float
    total_net_salary: float


class AttritionReportResponse(BaseModel):
    report_type: str
    generated_at: str
    total_employees: int
    monitored_employees: int
    low_risk: int
    medium_risk: int
    high_risk: int
    critical_risk: int
    average_attrition_probability: float


class WorkforceStabilityReportResponse(BaseModel):
    report_type: str
    generated_at: str
    total_employees: int
    high_risk_employees: int
    critical_risk_employees: int
    active_interventions: int
    unresolved_alerts: int
    estimated_attrition_rate: float
    stability_status: str