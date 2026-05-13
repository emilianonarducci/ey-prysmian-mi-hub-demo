from sqlalchemy.orm import Session
from sqlalchemy import select
from backend.db.models import MiningProject

class ProjectsGoldRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_projects(self, country: str | None = None, status: str | None = None,
                      owner: str | None = None, capex_min: float | None = None,
                      capacity_min: float | None = None, start_year_min: int | None = None,
                      page: int = 1, page_size: int = 50):
        q = select(MiningProject)
        if country:
            q = q.where(MiningProject.country == country)
        if status:
            q = q.where(MiningProject.status == status)
        if owner:
            q = q.where(MiningProject.owner.ilike(f"%{owner}%"))
        if capex_min is not None:
            q = q.where(MiningProject.capex_estimate_musd >= capex_min)
        if capacity_min is not None:
            q = q.where(MiningProject.capacity_mw >= capacity_min)
        if start_year_min is not None:
            q = q.where(MiningProject.start_year >= start_year_min)
        total = self.db.execute(q.with_only_columns(MiningProject.id)).scalars().all()
        items = self.db.execute(
            q.order_by(MiningProject.curated_at.desc())
             .offset((page - 1) * page_size)
             .limit(page_size)
        ).scalars().all()
        return items, len(total)

    def get_by_id(self, project_id):
        return self.db.get(MiningProject, project_id)
