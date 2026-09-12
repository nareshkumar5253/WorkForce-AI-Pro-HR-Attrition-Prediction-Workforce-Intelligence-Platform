from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_current_admin_or_hr,
    get_current_admin_hr_manager,
    get_current_user,
)
from app.models.employee import Employee
from app.models.employee_shift import EmployeeShift
from app.models.shift import Shift
from app.schemas.employee_shift import (
    EmployeeShiftCreate,
    EmployeeShiftResponse,
    EmployeeShiftUpdate,
)

router = APIRouter(
    prefix="/employee-shifts",
    tags=["Employee Shift Assignments"],
)


@router.post(
    "",
    response_model=EmployeeShiftResponse,
    status_code=status.HTTP_201_CREATED,
)
def assign_employee_shift(
    assignment_data: EmployeeShiftCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_hr),
):
    employee = (
        db.query(Employee)
        .filter(Employee.id == assignment_data.employee_id)
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found.",
        )

    if employee.employment_status.value != "ACTIVE":
        raise HTTPException(
            status_code=400,
            detail="Only active employees can be assigned to a shift.",
        )

    shift = (
        db.query(Shift)
        .filter(
            Shift.id == assignment_data.shift_id,
            Shift.is_active.is_(True),
        )
        .first()
    )

    if not shift:
        raise HTTPException(
            status_code=404,
            detail="Active shift not found.",
        )

    if (
        assignment_data.effective_to is not None
        and assignment_data.effective_to
        < assignment_data.effective_from
    ):
        raise HTTPException(
            status_code=400,
            detail="effective_to cannot be before effective_from.",
        )

    active_assignment = (
        db.query(EmployeeShift)
        .filter(
            EmployeeShift.employee_id
            == assignment_data.employee_id,
            EmployeeShift.is_active.is_(True),
        )
        .first()
    )

    if active_assignment:
        raise HTTPException(
            status_code=400,
            detail="Employee already has an active shift assignment.",
        )

    assignment = EmployeeShift(
        employee_id=assignment_data.employee_id,
        shift_id=assignment_data.shift_id,
        effective_from=assignment_data.effective_from,
        effective_to=assignment_data.effective_to,
        is_active=True,
    )

    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return assignment


@router.get(
    "",
    response_model=list[EmployeeShiftResponse],
)
def list_employee_shift_assignments(
    employee_id: int | None = None,
    shift_id: int | None = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_hr_manager),
):
    query = db.query(EmployeeShift)

    if employee_id is not None:
        query = query.filter(
            EmployeeShift.employee_id == employee_id
        )

    if shift_id is not None:
        query = query.filter(
            EmployeeShift.shift_id == shift_id
        )

    if active_only:
        query = query.filter(
            EmployeeShift.is_active.is_(True)
        )

    return (
        query
        .order_by(EmployeeShift.id.desc())
        .all()
    )


@router.get(
    "/{assignment_id}",
    response_model=EmployeeShiftResponse,
)
def get_employee_shift_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_hr_manager),
):
    assignment = (
        db.query(EmployeeShift)
        .filter(EmployeeShift.id == assignment_id)
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Shift assignment not found.",
        )

    return assignment


@router.get(
    "/employee/{employee_id}/current",
    response_model=EmployeeShiftResponse,
)
def get_current_employee_shift(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_hr_manager),
):
    today = date.today()

    assignment = (
        db.query(EmployeeShift)
        .filter(
            EmployeeShift.employee_id == employee_id,
            EmployeeShift.is_active.is_(True),
            EmployeeShift.effective_from <= today,
            (
                (EmployeeShift.effective_to.is_(None))
                | (EmployeeShift.effective_to >= today)
            ),
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="No current shift assignment found.",
        )

    return assignment


@router.put(
    "/{assignment_id}",
    response_model=EmployeeShiftResponse,
)
def update_employee_shift_assignment(
    assignment_id: int,
    assignment_data: EmployeeShiftUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_hr),
):
    assignment = (
        db.query(EmployeeShift)
        .filter(EmployeeShift.id == assignment_id)
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Shift assignment not found.",
        )

    if assignment_data.shift_id is not None:
        shift = (
            db.query(Shift)
            .filter(
                Shift.id == assignment_data.shift_id,
                Shift.is_active.is_(True),
            )
            .first()
        )

        if not shift:
            raise HTTPException(
                status_code=404,
                detail="Active shift not found.",
            )

    effective_from = (
        assignment_data.effective_from
        if assignment_data.effective_from is not None
        else assignment.effective_from
    )

    effective_to = (
        assignment_data.effective_to
        if assignment_data.effective_to is not None
        else assignment.effective_to
    )

    if (
        effective_to is not None
        and effective_to < effective_from
    ):
        raise HTTPException(
            status_code=400,
            detail="effective_to cannot be before effective_from.",
        )

    update_data = assignment_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(assignment, field, value)

    db.commit()
    db.refresh(assignment)

    return assignment


@router.delete(
    "/{assignment_id}",
    response_model=EmployeeShiftResponse,
)
def deactivate_employee_shift_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_hr),
):
    assignment = (
        db.query(EmployeeShift)
        .filter(EmployeeShift.id == assignment_id)
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Shift assignment not found.",
        )

    assignment.is_active = False

    db.commit()
    db.refresh(assignment)

    return assignment