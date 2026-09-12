
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_current_admin_or_hr,
    get_current_admin_hr_manager,
    get_current_user,
)
from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.employee_shift import EmployeeShift
from app.models.shift import Shift
from app.schemas.attendance import (
    AttendanceAnalyticsResponse,
    AttendanceCheckIn,
    AttendanceCheckOut,
    AttendanceCreate,
    AttendanceResponse,
)
from app.services.audit_log import create_audit_log


router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"],
)


# ============================================================
# HELPER — GET EMPLOYEE FOR LOGGED-IN USER
# ============================================================

def get_employee_for_user(
    db: Session,
    user_id: int,
):
    employee = (
        db.query(Employee)
        .filter(Employee.user_id == user_id)
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee profile not found.",
        )

    return employee


# ============================================================
# HELPER — GET CURRENT SHIFT
# ============================================================

def get_current_shift(
    db: Session,
    employee_id: int,
    attendance_date: date,
):
    assignment = (
        db.query(EmployeeShift)
        .filter(
            EmployeeShift.employee_id == employee_id,
            EmployeeShift.is_active.is_(True),
            EmployeeShift.effective_from <= attendance_date,
            (
                (EmployeeShift.effective_to.is_(None))
                | (EmployeeShift.effective_to >= attendance_date)
            ),
        )
        .first()
    )

    if not assignment:
        return None

    shift = (
        db.query(Shift)
        .filter(
            Shift.id == assignment.shift_id,
            Shift.is_active.is_(True),
        )
        .first()
    )

    return shift


# ============================================================
# ADMIN / HR — CREATE ATTENDANCE
# ============================================================

@router.post(
    "",
    response_model=AttendanceResponse,
    status_code=201,
)
def create_attendance(
    attendance_data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_hr),
):
    employee = (
        db.query(Employee)
        .filter(
            Employee.id == attendance_data.employee_id
        )
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found.",
        )

    existing = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id
            == attendance_data.employee_id,
            Attendance.attendance_date
            == attendance_data.attendance_date,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail=(
                "Attendance record already exists "
                "for this employee and date."
            ),
        )

    attendance = Attendance(
        employee_id=attendance_data.employee_id,
        attendance_date=attendance_data.attendance_date,
        status="PRESENT",
        remarks=attendance_data.remarks,
    )

    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    # Automatic audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        module="ATTENDANCE",
        description=(
            f"Attendance record for employee "
            f"{employee.employee_code} "
            f"was created successfully."
        ),
        entity_type="ATTENDANCE",
        entity_id=attendance.id,
    )

    return attendance


# ============================================================
# EMPLOYEE — CHECK IN
# ============================================================

@router.post(
    "/check-in",
    response_model=AttendanceResponse,
)
def check_in(
    attendance_data: AttendanceCheckIn,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    employee = get_employee_for_user(
        db,
        current_user.id,
    )

    attendance_date = (
        attendance_data.attendance_date
        or date.today()
    )

    existing = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee.id,
            Attendance.attendance_date == attendance_date,
        )
        .first()
    )

    if existing and existing.check_in is not None:
        raise HTTPException(
            status_code=400,
            detail=(
                "Employee has already checked in "
                "for this date."
            ),
        )

    # --------------------------------------------------------
    # USE PROVIDED CHECK-IN TIME WHEN TESTING
    # Otherwise use current UTC time.
    # --------------------------------------------------------

    if attendance_data.check_in is not None:
        now = attendance_data.check_in
    else:
        now = datetime.utcnow()

    shift = get_current_shift(
        db,
        employee.id,
        attendance_date,
    )

    late_minutes = 0
    attendance_status = "PRESENT"

    if shift:
        scheduled_start = datetime.combine(
            attendance_date,
            shift.start_time,
        )

        difference = (
            now - scheduled_start
        ).total_seconds() / 60

        if difference > shift.grace_minutes:
            late_minutes = int(difference)
            attendance_status = "LATE"

    if existing:
        attendance = existing

        attendance.check_in = now
        attendance.status = attendance_status
        attendance.late_minutes = late_minutes

        if attendance_data.remarks:
            attendance.remarks = attendance_data.remarks

    else:
        attendance = Attendance(
            employee_id=employee.id,
            attendance_date=attendance_date,
            check_in=now,
            status=attendance_status,
            late_minutes=late_minutes,
            remarks=attendance_data.remarks,
        )

        db.add(attendance)

    db.commit()
    db.refresh(attendance)

    # Automatic audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CHECK_IN",
        module="ATTENDANCE",
        description=(
            f"Employee {employee.employee_code} "
            f"checked in successfully."
        ),
        entity_type="ATTENDANCE",
        entity_id=attendance.id,
    )

    return attendance


# ============================================================
# EMPLOYEE — CHECK OUT
# ============================================================

@router.post(
    "/check-out",
    response_model=AttendanceResponse,
)
def check_out(
    attendance_data: AttendanceCheckOut,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    employee = get_employee_for_user(
        db,
        current_user.id,
    )

    attendance_date = date.today()

    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee.id,
            Attendance.attendance_date == attendance_date,
        )
        .first()
    )

    if not attendance:
        raise HTTPException(
            status_code=404,
            detail=(
                "No attendance record found for today. "
                "Please check in first."
            ),
        )

    if attendance.check_in is None:
        raise HTTPException(
            status_code=400,
            detail="Employee has not checked in yet.",
        )

    if attendance.check_out is not None:
        raise HTTPException(
            status_code=400,
            detail=(
                "Employee has already checked out "
                "for today."
            ),
        )

    # --------------------------------------------------------
    # USE PROVIDED CHECK-OUT TIME WHEN TESTING
    # Otherwise use current UTC time.
    # --------------------------------------------------------

    if attendance_data.check_out is not None:
        now = attendance_data.check_out
    else:
        now = datetime.utcnow()

    working_seconds = (
        now - attendance.check_in
    ).total_seconds()

    if working_seconds < 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Check-out time cannot be earlier "
                "than check-in time."
            ),
        )

    working_hours = round(
        working_seconds / 3600,
        2,
    )

    attendance.check_out = now
    attendance.working_hours = working_hours

    # --------------------------------------------------------
    # ATTENDANCE STATUS
    # --------------------------------------------------------

    if working_hours < 4:
        attendance.status = "HALF_DAY"
    else:
        attendance.status = "FULL_DAY"

    if attendance_data.remarks:
        attendance.remarks = attendance_data.remarks

    db.commit()
    db.refresh(attendance)

    # Automatic audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CHECK_OUT",
        module="ATTENDANCE",
        description=(
            f"Employee {employee.employee_code} "
            f"checked out successfully."
        ),
        entity_type="ATTENDANCE",
        entity_id=attendance.id,
    )

    return attendance


# ============================================================
# ADMIN / HR / MANAGER — ATTENDANCE HISTORY
# ============================================================

@router.get(
    "",
    response_model=list[AttendanceResponse],
)
def list_attendance(
    employee_id: int | None = None,
    attendance_date: date | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_hr_manager),
):
    query = db.query(Attendance)

    if employee_id is not None:
        query = query.filter(
            Attendance.employee_id == employee_id
        )

    if attendance_date is not None:
        query = query.filter(
            Attendance.attendance_date == attendance_date
        )

    if status is not None:
        query = query.filter(
            Attendance.status == status
        )

    return (
        query
        .order_by(
            Attendance.attendance_date.desc(),
            Attendance.id.desc(),
        )
        .all()
    )


# ============================================================
# EMPLOYEE — MY ATTENDANCE
# ============================================================

@router.get(
    "/my",
    response_model=list[AttendanceResponse],
)
def my_attendance(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    employee = get_employee_for_user(
        db,
        current_user.id,
    )

    return (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee.id
        )
        .order_by(
            Attendance.attendance_date.desc()
        )
        .all()
    )


# ============================================================
# EMPLOYEE — TODAY'S ATTENDANCE
# ============================================================

@router.get(
    "/my/today",
    response_model=AttendanceResponse,
)
def my_today_attendance(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    employee = get_employee_for_user(
        db,
        current_user.id,
    )

    today = date.today()

    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee.id,
            Attendance.attendance_date == today,
        )
        .first()
    )

    if not attendance:
        raise HTTPException(
            status_code=404,
            detail="No attendance record found for today.",
        )

    return attendance


# ============================================================
# ADMIN / HR / MANAGER — ATTENDANCE ANALYTICS
# ============================================================

@router.get(
    "/analytics",
    response_model=AttendanceAnalyticsResponse,
)
def attendance_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_hr_manager),
):
    today = date.today()
    start_date = today.replace(day=1)
    end_date = today

    records = (
        db.query(Attendance)
        .filter(
            Attendance.attendance_date >= start_date,
            Attendance.attendance_date <= end_date,
        )
        .all()
    )

    total_records = len(records)

    present_days = sum(
        1
        for record in records
        if record.status == "PRESENT"
    )

    late_days = sum(
        1
        for record in records
        if record.status == "LATE"
    )

    half_days = sum(
        1
        for record in records
        if record.status == "HALF_DAY"
    )

    absent_days = sum(
        1
        for record in records
        if record.status == "ABSENT"
    )

    full_days = sum(
        1
        for record in records
        if record.status == "FULL_DAY"
    )

    total_working_hours = round(
        sum(
            float(record.working_hours or 0)
            for record in records
        ),
        2,
    )

    completed_records = [
        record
        for record in records
        if record.working_hours is not None
    ]

    average_working_hours = (
        round(
            total_working_hours
            / len(completed_records),
            2,
        )
        if completed_records
        else 0.0
    )

    attendance_percentage = (
        round(
            (
                (
                    present_days
                    + late_days
                    + full_days
                    + (half_days * 0.5)
                )
                / total_records
            )
            * 100,
            2,
        )
        if total_records > 0
        else 0.0
    )

    return AttendanceAnalyticsResponse(
        employee_id=None,
        start_date=start_date,
        end_date=end_date,
        total_records=total_records,
        present_days=present_days,
        late_days=late_days,
        half_days=half_days,
        absent_days=absent_days,
        attendance_percentage=attendance_percentage,
        total_working_hours=total_working_hours,
        average_working_hours=average_working_hours,
    )


# ============================================================
# EMPLOYEE — MY ATTENDANCE ANALYTICS
# ============================================================

@router.get(
    "/analytics/my",
    response_model=AttendanceAnalyticsResponse,
)
def my_attendance_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    employee = get_employee_for_user(
        db,
        current_user.id,
    )

    today = date.today()
    start_date = today.replace(day=1)
    end_date = today

    records = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee.id,
            Attendance.attendance_date >= start_date,
            Attendance.attendance_date <= end_date,
        )
        .all()
    )

    total_records = len(records)

    present_days = sum(
        1
        for record in records
        if record.status == "PRESENT"
    )

    late_days = sum(
        1
        for record in records
        if record.status == "LATE"
    )

    half_days = sum(
        1
        for record in records
        if record.status == "HALF_DAY"
    )

    absent_days = sum(
        1
        for record in records
        if record.status == "ABSENT"
    )

    full_days = sum(
        1
        for record in records
        if record.status == "FULL_DAY"
    )

    total_working_hours = round(
        sum(
            float(record.working_hours or 0)
            for record in records
        ),
        2,
    )

    completed_records = [
        record
        for record in records
        if record.working_hours is not None
    ]

    average_working_hours = (
        round(
            total_working_hours
            / len(completed_records),
            2,
        )
        if completed_records
        else 0.0
    )

    attendance_percentage = (
        round(
            (
                (
                    present_days
                    + late_days
                    + full_days
                    + (half_days * 0.5)
                )
                / total_records
            )
            * 100,
            2,
        )
        if total_records > 0
        else 0.0
    )

    return AttendanceAnalyticsResponse(
        employee_id=employee.id,
        start_date=start_date,
        end_date=end_date,
        total_records=total_records,
        present_days=present_days,
        late_days=late_days,
        half_days=half_days,
        absent_days=absent_days,
        attendance_percentage=attendance_percentage,
        total_working_hours=total_working_hours,
        average_working_hours=average_working_hours,
    )


# ============================================================
# GET ATTENDANCE BY ID
# ============================================================

@router.get(
    "/{attendance_id}",
    response_model=AttendanceResponse,
)
def get_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_hr_manager),
):
    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.id == attendance_id
        )
        .first()
    )

    if not attendance:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found.",
        )

    return attendance


# ============================================================
# ADMIN / HR — DELETE ATTENDANCE
# ============================================================

@router.delete(
    "/{attendance_id}",
    status_code=204,
)
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_hr),
):
    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.id == attendance_id
        )
        .first()
    )

    if not attendance:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found.",
        )

    employee = (
        db.query(Employee)
        .filter(
            Employee.id == attendance.employee_id
        )
        .first()
    )

    employee_code = (
        employee.employee_code
        if employee
        else str(attendance.employee_id)
    )

    db.delete(attendance)
    db.commit()

    # Automatic audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="DELETE",
        module="ATTENDANCE",
        description=(
            f"Attendance record for employee "
            f"{employee_code} was deleted successfully."
        ),
        entity_type="ATTENDANCE",
        entity_id=attendance_id,
    )

    return None
