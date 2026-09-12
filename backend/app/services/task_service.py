from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate


def validate_assigned_employee(
    db: Session,
    employee_id: int,
) -> Employee:
    employee = (
        db.query(Employee)
        .filter(Employee.id == employee_id)
        .first()
    )

    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assigned employee not found.",
        )

    employment_status = (
        employee.employment_status.value
        if hasattr(employee.employment_status, "value")
        else str(employee.employment_status)
    )

    if employment_status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tasks can only be assigned to active employees.",
        )

    return employee


def create_task(
    db: Session,
    task_data: TaskCreate,
    current_user: User,
) -> Task:
    validate_assigned_employee(
        db,
        task_data.assigned_to,
    )

    task = Task(
        title=task_data.title,
        description=task_data.description,
        assigned_to=task_data.assigned_to,
        created_by=current_user.id,
        priority=task_data.priority,
        status=TaskStatus.TODO,
        due_date=task_data.due_date,
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return task


def get_task(
    db: Session,
    task_id: int,
) -> Task:
    task = (
        db.query(Task)
        .filter(Task.id == task_id)
        .first()
    )

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found.",
        )

    return task


def list_tasks(
    db: Session,
    assigned_to: int | None = None,
    status_filter: TaskStatus | None = None,
    priority: str | None = None,
) -> list[Task]:
    query = db.query(Task)

    if assigned_to is not None:
        query = query.filter(
            Task.assigned_to == assigned_to
        )

    if status_filter is not None:
        query = query.filter(
            Task.status == status_filter
        )

    if priority is not None:
        query = query.filter(
            Task.priority == priority
        )

    return query.order_by(
        Task.created_at.desc()
    ).all()


def update_task(
    db: Session,
    task_id: int,
    task_data: TaskUpdate,
) -> Task:
    task = get_task(db, task_id)

    update_data = task_data.model_dump(
        exclude_unset=True
    )

    if "assigned_to" in update_data:
        validate_assigned_employee(
            db,
            update_data["assigned_to"],
        )

    if "status" in update_data:
        new_status = update_data["status"]

        if new_status == TaskStatus.COMPLETED:
            task.completed_at = datetime.utcnow()

        elif new_status != TaskStatus.COMPLETED:
            task.completed_at = None

    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)

    return task


def delete_task(
    db: Session,
    task_id: int,
) -> Task:
    task = get_task(db, task_id)

    db.delete(task)
    db.commit()

    return task