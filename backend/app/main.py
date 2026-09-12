from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.routers.payroll import router as payroll_router
from app.routers.notifications import router as notifications_router
from app.routers.chat import router as chat_router
from app.routers.chat_websocket import router as chat_websocket_router
from app.routers.documents import router as documents_router
from app.routers.analytics import router as analytics_router
from app.routers.datasets import router as datasets_router
from app.routers.predictions import router as predictions_router
from app.routers.risk_monitoring import router as risk_monitoring_router
from app.routers.forecasting import router as forecasting_router
from app.routers.interventions import router as interventions_router
from app.routers.alerts import router as alerts_router
from app.routers.workforce_monitoring import router as workforce_monitoring_router
from app.routers.reports import router as reports_router
from app.routers.report_export import router as report_export_router
from app.routers.audit_logs import router as audit_logs_router
from app.routers.tasks import router as tasks_router
from app.routers.performance import router as performance_router
from app.routers.recommendations import router as recommendations_router
# ============================================================
# IMPORT ALL MODELS
# ============================================================
# This ensures SQLAlchemy knows about every model before
# create_all() runs.
import app.models


# ============================================================
# IMPORT ROUTERS
# ============================================================
from app.routers import (
    attendance,
    auth,
    departments,
    employees,
    roles,
    shifts,
    users,
    employee_shifts,
)

from app.routers.leaves import (
    router as leave_types_router,
    leave_router,
)


# ============================================================
# CREATE DATABASE TABLES
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "WorkForce AI Pro - HR Attrition Prediction "
        "and Workforce Intelligence Platform"
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(departments.router)
app.include_router(roles.router)
app.include_router(employees.router)
app.include_router(shifts.router)
app.include_router(employee_shifts.router)
app.include_router(attendance.router)
app.include_router(payroll_router)
app.include_router(notifications_router)
app.include_router(chat_router)
app.include_router(chat_websocket_router)
app.include_router(documents_router)
app.include_router(datasets_router)
app.include_router(predictions_router)
app.include_router(risk_monitoring_router)
app.include_router(forecasting_router)
app.include_router(interventions_router)
app.include_router(alerts_router)
app.include_router(workforce_monitoring_router)
app.include_router(reports_router)
app.include_router(report_export_router)
app.include_router(audit_logs_router)
app.include_router(tasks_router)
app.include_router(performance_router)
app.include_router(recommendations_router)
# Leave Types
app.include_router(leave_types_router)
app.include_router(analytics_router)
# Leave Requests
app.include_router(leave_router)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "application": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "application": settings.APP_NAME,
    }


# ============================================================
# DATABASE HEALTH CHECK
# ============================================================

@app.get("/health/database")
def database_health_check():

    db: Session = SessionLocal()

    try:
        db.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "MySQL",
            "connection": "successful",
        }

    except Exception as exc:

        return {
            "status": "unhealthy",
            "database": "MySQL",
            "connection": "failed",
            "error": str(exc),
        }

    finally:
        db.close()