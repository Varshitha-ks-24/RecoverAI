from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import os
import shutil
import json
from datetime import datetime

from app.core.database import get_db
from app.models import Dataset, Fragment, FragmentRelationship, Reconstruction, ReconstructionFragment, AuditLog
from app.services.fragment_analyzer import analyze_fragment, FragmentClassifier, find_duplicates
from app.services.relationship_analyzer import analyze_relationship, build_relationship_graph, find_reconstruction_chains
from app.services.reconstruction_engine import generate_reconstructions, check_overlapping_candidates
from app.services.demo_data_generator import generate_demo_dataset

router = APIRouter()

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

classifier = FragmentClassifier()


@router.post("/datasets/upload")
async def upload_dataset(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(""),
    db: Session = Depends(get_db)
):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    dataset = Dataset(name=name, description=description, file_path=file_path, status="processing")
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    
    background_tasks.add_task(process_dataset, dataset.id, file_path)
    
    return {"dataset_id": dataset.id, "status": "processing", "message": "Dataset uploaded, processing started"}


@router.post("/datasets/demo")
async def load_demo_dataset(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    db.query(AuditLog).delete()
    db.query(ReconstructionFragment).delete()
    db.query(Reconstruction).delete()
    db.query(FragmentRelationship).delete()
    db.query(Fragment).delete()
    db.query(Dataset).delete()
    db.commit()
    
    demo = generate_demo_dataset()
    
    dataset = Dataset(
        name=demo["name"],
        description=demo["description"],
        file_path=None,
        total_fragments=len(demo["fragments"]),
        status="completed"
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    
    fragment_data_map = demo["fragment_data_map"]
    
    for frag_data in demo["fragments"]:
        unique_fragment_id = f"ds{dataset.id}_{frag_data['fragment_id']}"
        fragment = Fragment(
            dataset_id=dataset.id,
            fragment_id=unique_fragment_id,
            original_offset=frag_data.get("original_offset"),
            size=frag_data["size"],
            file_type=frag_data["file_type"],
            mime_type=None,
            entropy=frag_data["entropy"],
            printable_ratio=frag_data["printable_ratio"],
            magic_bytes=frag_data["magic_bytes"],
            sha256_hash=frag_data["sha256_hash"],
            is_duplicate=frag_data.get("is_duplicate", False),
            duplicate_of=frag_data.get("duplicate_of"),
            classification_confidence=frag_data["classification_confidence"],
            classification_method=frag_data["classification_method"],
            features=frag_data["features"],
            suspicious_indicators=frag_data.get("suspicious_indicators", []),
            status="analyzed" if not frag_data.get("is_decoy") else "suspicious",
        )
        db.add(fragment)
    
    db.commit()
    
    fragments = db.query(Fragment).filter(Fragment.dataset_id == dataset.id).all()
    frag_dicts = [frag_to_dict(f) for f in fragments]
    fragment_data_map_db = {}
    for f in fragments:
        original_fid = f.fragment_id.replace(f"ds{dataset.id}_", "")
        if original_fid in fragment_data_map:
            fragment_data_map_db[f.fragment_id] = fragment_data_map[original_fid]
    
    relationships = []
    for i in range(len(frag_dicts)):
        for j in range(i + 1, len(frag_dicts)):
            rel = analyze_relationship(frag_dicts[i], frag_dicts[j])
            if rel["score"] >= 0.3:
                rel_obj = FragmentRelationship(
                    fragment_a_id=frag_dicts[i]["id"],
                    fragment_b_id=frag_dicts[j]["id"],
                    relationship_type=rel["relationship_type"],
                    score=rel["score"],
                    details=rel["details"],
                )
                db.add(rel_obj)
                relationships.append(rel)
    
    db.commit()
    
    reconstructions = generate_reconstructions(frag_dicts, fragment_data_map_db)
    reconstructions = check_overlapping_candidates(reconstructions)
    
    for recon_data in reconstructions:
        recon = Reconstruction(
            dataset_id=dataset.id,
            name=recon_data["name"],
            file_type=recon_data["file_type"],
            estimated_size=recon_data["estimated_size"],
            actual_size=recon_data["actual_size"],
            fragment_count=recon_data["fragment_count"],
            missing_fragments=recon_data["missing_fragments"],
            confidence_score=recon_data["confidence_score"],
            confidence_breakdown=recon_data["confidence_breakdown"],
            integrity_status=recon_data["integrity_status"],
            integrity_hash=recon_data["integrity_hash"],
            expected_hash=recon_data.get("expected_hash"),
            status=recon_data["status"],
        )
        db.add(recon)
        db.flush()
        
        for idx, frag_info in enumerate(recon_data["fragments"]):
            if not frag_info.get("is_missing"):
                frag = db.query(Fragment).filter(Fragment.fragment_id == frag_info["fragment_id"]).first()
                if frag:
                    rf = ReconstructionFragment(
                        reconstruction_id=recon.id,
                        fragment_id=frag.id,
                        sequence_order=idx,
                        is_missing=False,
                        confidence=frag_info.get("classification_confidence"),
                    )
                    db.add(rf)
            else:
                rf = ReconstructionFragment(
                    reconstruction_id=recon.id,
                    fragment_id=0,
                    sequence_order=idx,
                    is_missing=True,
                    confidence=None,
                )
                db.add(rf)
        
        log = AuditLog(
            dataset_id=dataset.id,
            reconstruction_id=recon.id,
            action="reconstructed",
            new_status="candidate",
            details={"confidence": recon_data["confidence_score"], "fragments": recon_data["fragment_count"]},
            hash_value=recon_data["integrity_hash"],
        )
        db.add(log)
    
    db.commit()
    
    return {"dataset_id": dataset.id, "status": "completed", "fragments": len(frag_dicts), "reconstructions": len(reconstructions)}


@router.get("/datasets")
async def list_datasets(db: Session = Depends(get_db)):
    datasets = db.query(Dataset).order_by(Dataset.created_at.desc()).all()
    return [
        {
            "id": d.id,
            "name": d.name,
            "description": d.description,
            "total_fragments": d.total_fragments,
            "status": d.status,
            "created_at": d.created_at.isoformat(),
        }
        for d in datasets
    ]


@router.get("/datasets/{dataset_id}")
async def get_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    
    fragments = db.query(Fragment).filter(Fragment.dataset_id == dataset_id).all()
    reconstructions = db.query(Reconstruction).filter(Reconstruction.dataset_id == dataset_id).all()
    
    return {
        "id": dataset.id,
        "name": dataset.name,
        "description": dataset.description,
        "status": dataset.status,
        "total_fragments": dataset.total_fragments,
        "fragments": [frag_to_dict(f) for f in fragments],
        "reconstructions": [recon_to_dict(r) for r in reconstructions],
        "created_at": dataset.created_at.isoformat(),
    }


@router.get("/datasets/{dataset_id}/fragments")
async def get_fragments(dataset_id: int, db: Session = Depends(get_db)):
    fragments = db.query(Fragment).filter(Fragment.dataset_id == dataset_id).all()
    return [frag_to_dict(f) for f in fragments]


@router.get("/datasets/{dataset_id}/fragments/{fragment_id}")
async def get_fragment(dataset_id: int, fragment_id: str, db: Session = Depends(get_db)):
    fragment = db.query(Fragment).filter(
        Fragment.dataset_id == dataset_id,
        Fragment.fragment_id == fragment_id
    ).first()
    if not fragment:
        raise HTTPException(404, "Fragment not found")
    return frag_to_dict(fragment)


@router.get("/datasets/{dataset_id}/reconstructions")
async def get_reconstructions(dataset_id: int, db: Session = Depends(get_db)):
    reconstructions = db.query(Reconstruction).filter(Reconstruction.dataset_id == dataset_id).all()
    return [recon_to_dict(r) for r in reconstructions]


@router.get("/datasets/{dataset_id}/reconstructions/{recon_id}")
async def get_reconstruction(dataset_id: int, recon_id: int, db: Session = Depends(get_db)):
    recon = db.query(Reconstruction).filter(
        Reconstruction.id == recon_id,
        Reconstruction.dataset_id == dataset_id
    ).first()
    if not recon:
        raise HTTPException(404, "Reconstruction not found")
    
    recon_dict = recon_to_dict(recon)
    
    frag_links = db.query(ReconstructionFragment).filter(
        ReconstructionFragment.reconstruction_id == recon_id
    ).all()
    
    fragments_detail = []
    for link in frag_links:
        if link.is_missing:
            fragments_detail.append({
                "sequence_order": link.sequence_order,
                "is_missing": True,
                "fragment_id": None,
            })
        else:
            frag = db.query(Fragment).filter(Fragment.id == link.fragment_id).first()
            if frag:
                fragments_detail.append({
                    "sequence_order": link.sequence_order,
                    "is_missing": False,
                    "fragment": frag_to_dict(frag),
                })
    
    recon_dict["fragments_detail"] = fragments_detail
    
    rels = db.query(FragmentRelationship).filter(
        FragmentRelationship.fragment_a_id.in_([f["fragment"]["id"] for f in fragments_detail if not f["is_missing"]])
    ).all()
    recon_dict["relationships"] = [rel_to_dict(r) for r in rels]
    
    return recon_dict


@router.post("/datasets/{dataset_id}/reconstructions/{recon_id}/accept")
async def accept_reconstruction(dataset_id: int, recon_id: int, notes: str = "", db: Session = Depends(get_db)):
    recon = db.query(Reconstruction).filter(
        Reconstruction.id == recon_id,
        Reconstruction.dataset_id == dataset_id
    ).first()
    if not recon:
        raise HTTPException(404, "Reconstruction not found")
    
    prev_status = recon.status
    recon.status = "accepted"
    recon.investigator_notes = notes
    recon.updated_at = datetime.utcnow()
    
    log = AuditLog(
        dataset_id=dataset_id,
        reconstruction_id=recon_id,
        fragment_id=None,
        action="accepted",
        previous_status=prev_status,
        new_status="accepted",
        user_action=f"Investigator accepted reconstruction: {notes}",
        hash_value=recon.integrity_hash,
    )
    db.add(log)
    db.commit()
    
    return {"status": "accepted", "reconstruction_id": recon_id}


@router.post("/datasets/{dataset_id}/reconstructions/{recon_id}/reject")
async def reject_reconstruction(dataset_id: int, recon_id: int, notes: str = "", db: Session = Depends(get_db)):
    recon = db.query(Reconstruction).filter(
        Reconstruction.id == recon_id,
        Reconstruction.dataset_id == dataset_id
    ).first()
    if not recon:
        raise HTTPException(404, "Reconstruction not found")
    
    prev_status = recon.status
    recon.status = "rejected"
    recon.investigator_notes = notes
    recon.updated_at = datetime.utcnow()
    
    log = AuditLog(
        dataset_id=dataset_id,
        reconstruction_id=recon_id,
        fragment_id=None,
        action="rejected",
        previous_status=prev_status,
        new_status="rejected",
        user_action=f"Investigator rejected reconstruction: {notes}",
        hash_value=recon.integrity_hash,
    )
    db.add(log)
    db.commit()
    
    return {"status": "rejected", "reconstruction_id": recon_id}


@router.post("/datasets/{dataset_id}/fragments/{fragment_id}/mark-suspicious")
async def mark_fragment_suspicious(dataset_id: int, fragment_id: str, reason: str = "", db: Session = Depends(get_db)):
    fragment = db.query(Fragment).filter(
        Fragment.dataset_id == dataset_id,
        Fragment.fragment_id == fragment_id
    ).first()
    if not fragment:
        raise HTTPException(404, "Fragment not found")
    
    prev_status = fragment.status
    fragment.status = "suspicious"
    fragment.updated_at = datetime.utcnow()
    
    log = AuditLog(
        dataset_id=dataset_id,
        fragment_id=fragment_id,
        action="marked_suspicious",
        previous_status=prev_status,
        new_status="suspicious",
        user_action=f"Investigator marked fragment as suspicious: {reason}",
        hash_value=fragment.sha256_hash,
    )
    db.add(log)
    db.commit()
    
    return {"status": "suspicious", "fragment_id": fragment_id}


@router.post("/datasets/{dataset_id}/reconstructions/{recon_id}/override")
async def override_reconstruction(dataset_id: int, recon_id: int, new_status: str, notes: str = "", db: Session = Depends(get_db)):
    recon = db.query(Reconstruction).filter(
        Reconstruction.id == recon_id,
        Reconstruction.dataset_id == dataset_id
    ).first()
    if not recon:
        raise HTTPException(404, "Reconstruction not found")
    
    prev_status = recon.status
    recon.status = new_status
    recon.investigator_notes = notes
    recon.updated_at = datetime.utcnow()
    
    log = AuditLog(
        dataset_id=dataset_id,
        reconstruction_id=recon_id,
        fragment_id=None,
        action="overridden",
        previous_status=prev_status,
        new_status=new_status,
        user_action=f"Investigator overrode AI recommendation: {notes}",
        hash_value=recon.integrity_hash,
    )
    db.add(log)
    db.commit()
    
    return {"status": new_status, "reconstruction_id": recon_id}


@router.get("/datasets/{dataset_id}/audit-log")
async def get_audit_log(dataset_id: int, db: Session = Depends(get_db)):
    logs = db.query(AuditLog).filter(AuditLog.dataset_id == dataset_id).order_by(AuditLog.timestamp.desc()).all()
    return [
        {
            "id": log.id,
            "timestamp": log.timestamp.isoformat(),
            "action": log.action,
            "fragment_id": log.fragment_id,
            "reconstruction_id": log.reconstruction_id,
            "previous_status": log.previous_status,
            "new_status": log.new_status,
            "user_action": log.user_action,
            "details": log.details,
            "hash_value": log.hash_value,
        }
        for log in logs
    ]


@router.get("/datasets/{dataset_id}/graph")
async def get_relationship_graph(dataset_id: int, db: Session = Depends(get_db)):
    fragments = db.query(Fragment).filter(Fragment.dataset_id == dataset_id).all()
    frag_dicts = [frag_to_dict(f) for f in fragments]
    graph = build_relationship_graph(frag_dicts, threshold=0.3)
    return graph


@router.get("/dashboard/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    total_datasets = db.query(Dataset).count()
    total_fragments = db.query(Fragment).count()
    total_reconstructions = db.query(Reconstruction).count()
    
    fragments = db.query(Fragment).all()
    reconstructions = db.query(Reconstruction).all()
    
    file_types = {}
    for f in fragments:
        ft = f.file_type or "UNKNOWN"
        file_types[ft] = file_types.get(ft, 0) + 1
    
    confidence_counts = {"high": 0, "medium": 0, "low": 0}
    for r in reconstructions:
        if r.confidence_score >= 0.7:
            confidence_counts["high"] += 1
        elif r.confidence_score >= 0.4:
            confidence_counts["medium"] += 1
        else:
            confidence_counts["low"] += 1
    
    integrity_counts = {"verified": 0, "partial": 0, "failed": 0, "unknown": 0}
    for r in reconstructions:
        status = r.integrity_status or "unknown"
        integrity_counts[status] = integrity_counts.get(status, 0) + 1
    
    duplicates = sum(1 for f in fragments if f.is_duplicate)
    suspicious = sum(1 for f in fragments if f.status == "suspicious")
    corrupted = sum(1 for f in fragments if f.suspicious_indicators and any(i.get("type") in ["high_entropy", "magic_mismatch"] for i in f.suspicious_indicators))
    
    return {
        "total_datasets": total_datasets,
        "total_fragments": total_fragments,
        "total_reconstructions": total_reconstructions,
        "file_type_distribution": file_types,
        "confidence_distribution": confidence_counts,
        "integrity_distribution": integrity_counts,
        "duplicates": duplicates,
        "suspicious_fragments": suspicious,
        "corrupted_fragments": corrupted,
    }


def frag_to_dict(f: Fragment) -> Dict:
    return {
        "id": f.id,
        "fragment_id": f.fragment_id,
        "original_offset": f.original_offset,
        "size": f.size,
        "file_type": f.file_type,
        "mime_type": f.mime_type,
        "entropy": f.entropy,
        "printable_ratio": f.printable_ratio,
        "magic_bytes": f.magic_bytes,
        "sha256_hash": f.sha256_hash,
        "is_duplicate": f.is_duplicate,
        "duplicate_of": f.duplicate_of,
        "classification_confidence": f.classification_confidence,
        "classification_method": f.classification_method,
        "features": f.features,
        "suspicious_indicators": f.suspicious_indicators,
        "status": f.status,
        "created_at": f.created_at.isoformat() if f.created_at else None,
    }


def recon_to_dict(r: Reconstruction) -> Dict:
    return {
        "id": r.id,
        "name": r.name,
        "file_type": r.file_type,
        "estimated_size": r.estimated_size,
        "actual_size": r.actual_size,
        "fragment_count": r.fragment_count,
        "missing_fragments": r.missing_fragments,
        "confidence_score": r.confidence_score,
        "confidence_breakdown": r.confidence_breakdown,
        "integrity_status": r.integrity_status,
        "integrity_hash": r.integrity_hash,
        "expected_hash": r.expected_hash,
        "status": r.status,
        "investigator_notes": r.investigator_notes,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


def rel_to_dict(r: FragmentRelationship) -> Dict:
    return {
        "id": r.id,
        "fragment_a_id": r.fragment_a_id,
        "fragment_b_id": r.fragment_b_id,
        "relationship_type": r.relationship_type,
        "score": r.score,
        "details": r.details,
    }


async def process_dataset(dataset_id: int, file_path: str):
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            return
        
        with open(file_path, "rb") as f:
            data = f.read()
        
        chunk_size = 1024 * 512
        fragments_data = []
        for i in range(0, len(data), chunk_size):
            chunk = data[i:i+chunk_size]
            fid = f"chunk_{i//chunk_size:04d}"
            result = analyze_fragment(fid, chunk, classifier)
            result["original_offset"] = i
            fragments_data.append(result)
        
        fragments_data = find_duplicates(fragments_data)
        
        for frag_data in fragments_data:
            fragment = Fragment(
                dataset_id=dataset_id,
                fragment_id=frag_data["fragment_id"],
                original_offset=frag_data.get("original_offset"),
                size=frag_data["size"],
                file_type=frag_data["file_type"],
                mime_type=None,
                entropy=frag_data["entropy"],
                printable_ratio=frag_data["printable_ratio"],
                magic_bytes=frag_data["magic_bytes"],
                sha256_hash=frag_data["sha256_hash"],
                is_duplicate=frag_data.get("is_duplicate", False),
                duplicate_of=frag_data.get("duplicate_of"),
                classification_confidence=frag_data["classification_confidence"],
                classification_method=frag_data["classification_method"],
                features=frag_data["features"],
                suspicious_indicators=frag_data.get("suspicious_indicators", []),
                status="analyzed",
            )
            db.add(fragment)
        
        db.commit()
        
        fragments = db.query(Fragment).filter(Fragment.dataset_id == dataset_id).all()
        frag_dicts = [frag_to_dict(f) for f in fragments]
        
        fragment_data_map = {}
        with open(file_path, "rb") as f:
            for frag in fragments:
                f.seek(frag.original_offset or 0)
                fragment_data_map[frag.fragment_id] = f.read(frag.size)
        
        for i in range(len(frag_dicts)):
            for j in range(i + 1, len(frag_dicts)):
                rel = analyze_relationship(frag_dicts[i], frag_dicts[j])
                if rel["score"] >= 0.3:
                    rel_obj = FragmentRelationship(
                        fragment_a_id=frag_dicts[i]["id"],
                        fragment_b_id=frag_dicts[j]["id"],
                        relationship_type=rel["relationship_type"],
                        score=rel["score"],
                        details=rel["details"],
                    )
                    db.add(rel_obj)
        
        db.commit()
        
        reconstructions = generate_reconstructions(frag_dicts, fragment_data_map)
        reconstructions = check_overlapping_candidates(reconstructions)
        
        for recon_data in reconstructions:
            recon = Reconstruction(
                dataset_id=dataset_id,
                name=recon_data["name"],
                file_type=recon_data["file_type"],
                estimated_size=recon_data["estimated_size"],
                actual_size=recon_data["actual_size"],
                fragment_count=recon_data["fragment_count"],
                missing_fragments=recon_data["missing_fragments"],
                confidence_score=recon_data["confidence_score"],
                confidence_breakdown=recon_data["confidence_breakdown"],
                integrity_status=recon_data["integrity_status"],
                integrity_hash=recon_data["integrity_hash"],
                expected_hash=recon_data.get("expected_hash"),
                status=recon_data["status"],
            )
            db.add(recon)
            db.flush()
            
            for idx, frag_info in enumerate(recon_data["fragments"]):
                if not frag_info.get("is_missing"):
                    frag = db.query(Fragment).filter(Fragment.fragment_id == frag_info["fragment_id"]).first()
                    if frag:
                        rf = ReconstructionFragment(
                            reconstruction_id=recon.id,
                            fragment_id=frag.id,
                            sequence_order=idx,
                            is_missing=False,
                            confidence=frag_info.get("classification_confidence"),
                        )
                        db.add(rf)
                else:
                    rf = ReconstructionFragment(
                        reconstruction_id=recon.id,
                        fragment_id=0,
                        sequence_order=idx,
                        is_missing=True,
                        confidence=None,
                    )
                    db.add(rf)
            
            log = AuditLog(
                dataset_id=dataset_id,
                reconstruction_id=recon.id,
                action="reconstructed",
                new_status="candidate",
                details={"confidence": recon_data["confidence_score"], "fragments": recon_data["fragment_count"]},
                hash_value=recon_data["integrity_hash"],
            )
            db.add(log)
        
        dataset.total_fragments = len(fragments_data)
        dataset.status = "completed"
        db.commit()
        
    except Exception as e:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if dataset:
            dataset.status = "failed"
            db.commit()
        print(f"Error processing dataset: {e}")
    finally:
        db.close()