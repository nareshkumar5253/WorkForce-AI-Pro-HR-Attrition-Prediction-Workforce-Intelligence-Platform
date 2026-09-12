from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_current_admin_or_hr,
    get_current_admin_hr_manager,
    get_current_user,
)
from app.models.employee import Employee
from app.models.task import TaskPriority, TaskStatus
from app.models.user import User
from app.schemas.task import (
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)
from app.services.audit_log import create_audit_log
from app.services.task_service import (
    create_task,
    delete_task,
    get_task,
    list_tasks,
    update_task,
)

router = APIRouter(
    prefix="/tasks",
    tags=["Workflow & Task Management"],
)


def get_employee_for_user(
    db: Session,
    user_id: int,
) -> Employee | None:
    return (
        db.query(Employee)
        .filter(Employee.user_id == user_id)
        .first()
    )


@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_task_endpoint(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_hr),
):
    task = create_task(
        db=db,
        task_data=task_data,
        current_user=current_user,
    )

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        module="TASKS",
        description=(
            f"Task {task.id} was created successfully "
            f"and assigned to employee {task.assigned_to}."
        ),
        entity_type="TASK",
        entity_id=task.id,
    )

    return task


@router.get(
    "",
    response_model=list[TaskResponse],
)
def get_all_tasks(
    assigned_to: int | None = Query(
        default=None,
        description="Filter tasks by assigned employee ID.",
    ),
    task_status: TaskStatus | None = Query(
        default=None,
        alias="status",
        description="Filter tasks by status.",
    ),
    priority: TaskPriority | None = Query(
        default=None,
        description="Filter tasks by priority.",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_hr_manager),
):
    return list_tasks(
        db=db,
        assigned_to=assigned_to,
        status_filter=task_status,
        priority=priority,
    )


@router.get(
    "/my",
    response_model=list[TaskResponse],
)
def get_my_tasks(
    task_status: TaskStatus | None = Query(
        default=None,
        alias="status",
        description="Filter my tasks by status.",
    ),
    priority: TaskPriority | None = Query(
        default=None,
        description="Filter my tasks by priority.",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = get_employee_for_user(
        db,
        current_user.id,
    )

    if employee is None:
        return []

    return list_tasks(
        db=db,
        assigned_to=employee.id,
        status_filter=task_status,
        priority=priority,
    )


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
)
def get_task_endpoint(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_hr_manager),
):
    return get_task(
        db=db,
        task_id=task_id,
    )


@router.put(
    "/{task_id}",
    response_model=TaskResponse,
)
def update_task_endpoint(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_hr),
):
    task = update_task(
        db=db,
        task_id=task_id,
        task_data=task_data,
    )

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE",
        module="TASKS",
        description=(
            f"Task {task.id} was updated successfully."
        ),
        entity_type="TASK",
        entity_id=task.id,
    )

    return task


@router.delete(
    "/{task_id}",
)
def delete_task_endpoint(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_hr),
):
    task = get_task(
        db=db,
        task_id=task_id,
    )

    task_id_value = task.id

    delete_task(
        db=db,
        task_id=task_id,
    )

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="DELETE",
        module="TASKS",
        description=(
            f"Task {task_id_value} was deleted successfully."
        ),
        entity_type="TASK",
        entity_id=task_id_value,
    )

    return {
        "message": "Task deleted successfully.",
        "task_id": task_id_value,
    }