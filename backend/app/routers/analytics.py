from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.analytics.attendance_analytics import (
    get_attendance_rate,
    get_attendance_summary,
    get_attendance_trend,
)

from app.analytics.leave_analytics import (
    get_leave_by_type,
    get_leave_summary,
)

from app.analytics.payroll_analytics import (
    get_payroll_summary,
    get_salary_analytics,
)

from app.analytics.workforce_analytics import (
    get_department_wise_employees,
    get_employee_summary,
    get_employment_status_summary,
    get_role_wise_employees,
    get_workforce_joining_attrition_trend,
)

from app.analytics.attrition_analytics import (
    get_attrition_by_department,
    get_attrition_by_role,
    get_attrition_dashboard,
    get_attrition_high_risk_employees,
    get_attrition_overview,
    get_attrition_risk_distribution,
    get_attrition_risk_factors,
)

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User

from app.schemas.analytics import (
    # Existing analytics schemas
    AttendanceRateResponse,
    AttendanceSummaryResponse,
    AttendanceTrendResponse,
    DepartmentEmployeeResponse,
    EmployeeSummaryResponse,
    EmploymentStatusResponse,
    LeaveByTypeResponse,
    LeaveSummaryResponse,
    PayrollSummaryResponse,
    RoleEmployeeResponse,
    SalaryAnalyticsResponse,
    WorkforceDashboardResponse,
    WorkforceTrendResponse,

    # Attrition analytics schemas
    AttritionDashboardResponse,
    AttritionDepartmentResponse,
    AttritionHighRiskEmployeeResponse,
    AttritionOverviewResponse,
    AttritionRiskDistributionResponse,
    AttritionRiskFactorResponse,
    AttritionRoleResponse,
)


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


# ============================================================
# 1. WORKFORCE SUMMARY
# ============================================================

@router.get(
    "/workforce/summary",
    response_model=EmployeeSummaryResponse,
)
def workforce_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_employee_summary(db)


# ============================================================
# 2. WORKFORCE BY DEPARTMENT
# ============================================================

@router.get(
    "/workforce/by-department",
    response_model=list[DepartmentEmployeeResponse],
)
def workforce_by_department(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_department_wise_employees(db)


# ============================================================
# 3. WORKFORCE BY EMPLOYMENT STATUS
# ============================================================

@router.get(
    "/workforce/by-status",
    response_model=EmploymentStatusResponse,
)
def workforce_by_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_employment_status_summary(db)


# ============================================================
# 4. WORKFORCE BY JOB ROLE
# ============================================================

@router.get(
    "/workforce/by-role",
    response_model=list[RoleEmployeeResponse],
)
def workforce_by_role(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_role_wise_employees(db)


# ============================================================
# 5. ATTENDANCE SUMMARY
# ============================================================

@router.get(
    "/attendance/summary",
    response_model=AttendanceSummaryResponse,
)
def attendance_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_attendance_summary(db)


# ============================================================
# 6. ATTENDANCE RATE
# ============================================================

@router.get(
    "/attendance/rate",
    response_model=AttendanceRateResponse,
)
def attendance_rate(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_attendance_rate(db)


# ============================================================
# 7. PAYROLL SUMMARY
# ============================================================

@router.get(
    "/payroll/summary",
    response_model=PayrollSummaryResponse,
)
def payroll_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_payroll_summary(db)


# ============================================================
# 8. LEAVE SUMMARY
# ============================================================

@router.get(
    "/leave/summary",
    response_model=LeaveSummaryResponse,
)
def leave_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_leave_summary(db)


# ============================================================
# 9. ATTENDANCE TREND
# ============================================================

@router.get(
    "/attendance/trend",
    response_model=list[AttendanceTrendResponse],
)
def attendance_trend(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_attendance_trend(db)


# ============================================================
# 10. LEAVE BY TYPE
# ============================================================

@router.get(
    "/leave/by-type",
    response_model=list[LeaveByTypeResponse],
)
def leave_by_type(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_leave_by_type(db)


# ============================================================
# 11. SALARY / PAYROLL ANALYTICS
# ============================================================

@router.get(
    "/payroll/salary-analytics",
    response_model=SalaryAnalyticsResponse,
)
def salary_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_salary_analytics(db)


# ============================================================
# 12. WORKFORCE JOINING & ATTRITION TREND
# ============================================================

@router.get(
    "/workforce/joining-attrition-trend",
    response_model=list[WorkforceTrendResponse],
)
def workforce_joining_attrition_trend(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_workforce_joining_attrition_trend(db)


# ============================================================
# 13. COMBINED WORKFORCE DASHBOARD
# ============================================================

@router.get(
    "/dashboard",
    response_model=WorkforceDashboardResponse,
)
def workforce_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return {
        "workforce": get_employee_summary(db),
        "attendance": get_attendance_summary(db),
        "attendance_rate": get_attendance_rate(db),
        "payroll": get_payroll_summary(db),
        "leave": get_leave_summary(db),
    }


# ============================================================
# 14. ATTRITION OVERVIEW
# ============================================================

@router.get(
    "/attrition/overview",
    response_model=AttritionOverviewResponse,
)
def attrition_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_attrition_overview(db)


# ============================================================
# 15. ATTRITION RISK DISTRIBUTION
# ============================================================

@router.get(
    "/attrition/risk-distribution",
    response_model=list[AttritionRiskDistributionResponse],
)
def attrition_risk_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_attrition_risk_distribution(db)


# ============================================================
# 16. ATTRITION BY DEPARTMENT
# ============================================================

@router.get(
    "/attrition/by-department",
    response_model=list[AttritionDepartmentResponse],
)
def attrition_by_department(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_attrition_by_department(db)


# ============================================================
# 17. ATTRITION BY JOB ROLE
# ============================================================

@router.get(
    "/attrition/by-role",
    response_model=list[AttritionRoleResponse],
)
def attrition_by_role(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_attrition_by_role(db)


# ============================================================
# 18. ATTRITION RISK FACTORS
# ============================================================

@router.get(
    "/attrition/factors",
    response_model=list[AttritionRiskFactorResponse],
)
def attrition_factors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_attrition_risk_factors(db)


# ============================================================
# 19. ATTRITION HIGH-RISK EMPLOYEES
# ============================================================

@router.get(
    "/attrition/high-risk",
    response_model=list[AttritionHighRiskEmployeeResponse],
)
def attrition_high_risk(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_attrition_high_risk_employees(db)


# ============================================================
# 20. ATTRITION ANALYTICS DASHBOARD
# ============================================================

@router.get(
    "/attrition/dashboard",
    response_model=AttritionDashboardResponse,
)
def attrition_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_attrition_dashboard(db)