from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.region import Region

router = APIRouter()


@router.get("")
def list_regions(db: Session = Depends(get_db)):
    regions = db.query(Region).order_by(Region.city.asc(), Region.district.asc(), Region.dong.asc()).all()
    return [
        {
            "id": region.id,
            "city": region.city,
            "district": region.district,
            "dong": region.dong,
            "code": region.code,
            "name": f"{region.city} {region.district} {region.dong}",
        }
        for region in regions
    ]
