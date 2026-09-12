from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def create_audit_log(
    db: Session,
    user_id: int | None,
    action: str,
    module: str,
    description: str,
    entity_type: str | None = None,
    entity_id: int | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
):
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        module=module,
        description=description,
        entity_type=entity_type,
        entity_id=entity_id,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)

    return audit_log


def get_audit_logs(
    db: Session,
    user_id: int | None = None,
    action: str | None = None,
    module: str | None = None,
    entity_type: str | None = None,
):
    query = db.query(AuditLog)

    if user_id is not None:
        query = query.filter(AuditLog.user_id == user_id)

    if action is not None:
        query = query.filter(AuditLog.action == action)

    if module is not None:
        query = query.filter(AuditLog.module == module)

    if entity_type is not None:
        query = query.filter(AuditLog.entity_type == entity_type)

    return (
        query
        .order_by(AuditLog.created_at.desc())
        .all()
    )


def get_audit_log_summary(db: Session):
    logs = db.query(AuditLog).all()

    create_actions = sum(
        1 for log in logs if log.action == "CREATE"
    )

    update_actions = sum(
        1 for log in logs if log.action == "UPDATE"
    )

    delete_actions = sum(
        1 for log in logs if log.action == "DELETE"
    )

    login_actions = sum(
        1 for log in logs if log.action == "LOGIN"
    )

    other_actions = sum(
        1
        for log in logs
        if log.action not in {
            "CREATE",
            "UPDATE",
            "DELETE",
            "LOGIN",
        }
    )

    return {
    "total_logs": len(logs),
    "create_actions": create_actions,
    "update_actions": update_actions,
    "delete_actions": delete_actions,
    "login_actions": login_actions,
    "other_actions": other_actions,
}