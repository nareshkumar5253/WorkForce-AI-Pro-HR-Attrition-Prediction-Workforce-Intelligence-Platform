from datetime import datetime

from pydantic import BaseModel


# ============================================================
# EXISTING ANALYTICS SCHEMAS
# ============================================================

class EmployeeSummaryResponse(BaseModel):
    total_employees: int
    active_employees: int
    on_leave_employees: int
    resigned_employees: int
    terminated_employees: int
    retired_employees: int


class DepartmentEmployeeResponse(BaseModel):
    department_id: int
    department_name: str
    employee_count: int


class EmploymentStatusResponse(BaseModel):
    ACTIVE: int
    ON_LEAVE: int
    RESIGNED: int
    TERMINATED: int
    RETIRED: int


class AttendanceSummaryResponse(BaseModel):
    total_records: int
    present: int
    late: int
    absent: int
    half_day: int


class AttendanceRateResponse(BaseModel):
    total_records: int
    attendance_rate: float


class PayrollSummaryResponse(BaseModel):
    total_records: int
    pending: int
    processed: int
    paid: int
    total_gross_salary: float
    total_net_salary: float


class LeaveSummaryResponse(BaseModel):
    total_requests: int
    pending: int
    approved: int
    rejected: int
    cancelled: int


class RoleEmployeeResponse(BaseModel):
    role_id: int
    role_title: str
    employee_count: int


class AttendanceTrendResponse(BaseModel):
    date: object
    total_records: int
    present: int
    late: int
    absent: int
    half_day: int


class LeaveByTypeResponse(BaseModel):
    leave_type_id: int
    leave_type_name: str
    request_count: int


class SalaryAnalyticsResponse(BaseModel):
    total_employees: int
    average_basic_salary: float
    average_gross_salary: float
    average_net_salary: float
    highest_gross_salary: float
    lowest_gross_salary: float


class WorkforceTrendResponse(BaseModel):
    year: int
    month: int
    joined: int
    attrition: int


class WorkforceDashboardResponse(BaseModel):
    workforce: EmployeeSummaryResponse
    attendance: AttendanceSummaryResponse
    attendance_rate: AttendanceRateResponse
    payroll: PayrollSummaryResponse
    leave: LeaveSummaryResponse


# ============================================================
# ATTRITION ANALYTICS SCHEMAS
# ============================================================

class AttritionOverviewResponse(BaseModel):
    total_employees: int
    monitored_employees: int
    unmonitored_employees: int
    average_attrition_probability: float
    low_risk: int
    medium_risk: int
    high_risk: int
    critical_risk: int
    total_high_or_critical: int


class AttritionRiskDistributionResponse(BaseModel):
    risk_level: str
    employee_count: int


class AttritionDepartmentResponse(BaseModel):
    department: str
    employee_count: int
    average_attrition_probability: float
    high_or_critical_risk: int
    risk_level: str


class AttritionRoleResponse(BaseModel):
    job_role: str
    employee_count: int
    average_attrition_probability: float
    high_or_critical_risk: int
    risk_level: str


class AttritionRiskFactorResponse(BaseModel):
    factor: str
    employee_count: int


class AttritionHighRiskEmployeeResponse(BaseModel):
    employee_id: int
    employee_code: str
    employee_name: str
    department: str | None
    job_role: str | None
    attrition_probability: float
    risk_level: str
    model_name: str
    prediction_id: int
    created_at: datetime


class AttritionDashboardResponse(BaseModel):
    overview: AttritionOverviewResponse
    risk_distribution: list[AttritionRiskDistributionResponse]
    by_department: list[AttritionDepartmentResponse]
    by_role: list[AttritionRoleResponse]
    risk_factors: list[AttritionRiskFactorResponse]
    high_risk_employees: list[AttritionHighRiskEmployeeResponse]