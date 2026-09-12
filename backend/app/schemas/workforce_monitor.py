from datetime import datetime

from pydantic import BaseModel, ConfigDict


class WorkforceMonitorCreate(BaseModel):
    employee_id: int
    attendance_id: int | None = None
    status: str = "OFFLINE"
    check_in_time: datetime | None = None
    check_out_time: datetime | None = None
    location: str | None = None
    device_info: str | None = None
    notes: str | None = None


class WorkforceMonitorUpdate(BaseModel):
    status: str | None = None
    check_in_time: datetime | None = None
    check_out_time: datetime | None = None
    last_activity: datetime | None = None
    location: str | None = None
    device_info: str | None = None
    notes: str | None = None


class WorkforceMonitorResponse(BaseModel):
    id: int
    employee_id: int
    attendance_id: int | None
    status: str
    check_in_time: datetime | None
    check_out_time: datetime | None
    last_activity: datetime
    location: str | None
    device_info: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class WorkforceLiveStatusResponse(BaseModel):
    employee_id: int
    employee_name: str
    status: str
    check_in_time: datetime | None
    check_out_time: datetime | None
    last_activity: datetime | None
    attrition_probability: float | None
    risk_level: str | None


class WorkforceMonitoringSummaryResponse(BaseModel):
    total_employees: int
    active: int
    present: int
    late: int
    absent: int
    on_leave: int
    offline: int
    high_risk: int
    critical_risk: int