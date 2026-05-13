from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from backend.db.connection import get_db
from backend.db.models import EvidenceMetadata
from backend.schemas.evidence import EvidenceMetadataOut

router = APIRouter(prefix="/evidence", tags=["evidence"])


@router.get("/{evidence_id}", response_model=EvidenceMetadataOut)
def get_evidence(evidence_id: UUID, db: Session = Depends(get_db)):
    e = db.get(EvidenceMetadata, evidence_id)
    if e is None:
        raise HTTPException(404, "Evidence not found")
    return EvidenceMetadataOut.model_validate(e)
