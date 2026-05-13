from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from backend.db.connection import get_db
from backend.db.repositories.projects_gold import ProjectsGoldRepository
from backend.schemas.projects import MiningProjectOut, ProjectListResponse

router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("", response_model=ProjectListResponse)
def list_projects(
    country: str | None = None,
    status: str | None = None,
    owner: str | None = None,
    capex_min: float | None = None,
    capacity_min: float | None = None,
    start_year_min: int | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    repo = ProjectsGoldRepository(db)
    items, total = repo.list_projects(country, status, owner, capex_min, capacity_min,
                                       start_year_min, page, page_size)
    return ProjectListResponse(
        items=[MiningProjectOut.model_validate(p) for p in items],
        total=total, page=page, page_size=page_size
    )

@router.get("/{project_id}", response_model=MiningProjectOut)
def get_project(project_id: UUID, db: Session = Depends(get_db)):
    repo = ProjectsGoldRepository(db)
    p = repo.get_by_id(project_id)
    if p is None:
        raise HTTPException(404, "Project not found")
    return MiningProjectOut.model_validate(p)
