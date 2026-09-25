import hashlib
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from app.services.relationship_analyzer import analyze_relationship, find_reconstruction_chains
from app.services.fragment_analyzer import heuristic_classify


@dataclass
class ConfidenceBreakdown:
    signature_compatibility: float
    fragment_relationship_score: float
    structural_consistency: float
    integrity_verification: float
    missing_penalty: float
    contradiction_penalty: float
    total: float
    reasons: List[str]


def calculate_confidence_score(
    fragments: List[Dict],
    relationships: List[Dict],
    integrity_verified: bool,
    expected_hash: Optional[str] = None,
    actual_hash: Optional[str] = None
) -> ConfidenceBreakdown:
    reasons = []
    
    if not fragments:
        return ConfidenceBreakdown(0, 0, 0, 0, 0, 0, 0, ["No fragments provided"])
    
    file_types = [f.get("file_type", "UNKNOWN") for f in fragments]
    unique_types = set(file_types)
    
    sig_score = 0.0
    if len(unique_types) == 1 and "UNKNOWN" not in unique_types:
        sig_score = 1.0
        reasons.append(f"All fragments share same file type: {list(unique_types)[0]}")
    elif len(unique_types) == 1 and "UNKNOWN" in unique_types:
        sig_score = 0.3
        reasons.append("All fragments are UNKNOWN type")
    else:
        compatible = True
        for ft in unique_types:
            if ft != "UNKNOWN":
                from app.services.relationship_analyzer import FILE_TYPE_COMPATIBILITY
                for other in unique_types:
                    if other != "UNKNOWN" and other not in FILE_TYPE_COMPATIBILITY.get(ft, []):
                        compatible = False
                        break
        if compatible:
            sig_score = 0.7
            reasons.append(f"Fragments have compatible types: {unique_types}")
        else:
            sig_score = 0.2
            reasons.append(f"Fragments have conflicting types: {unique_types}")
    
    rel_scores = [r.get("score", 0) for r in relationships]
    rel_score = sum(rel_scores) / len(rel_scores) if rel_scores else 0.0
    if rel_score > 0.7:
        reasons.append(f"Strong fragment relationships (avg: {rel_score:.2f})")
    elif rel_score > 0.4:
        reasons.append(f"Moderate fragment relationships (avg: {rel_score:.2f})")
    else:
        reasons.append(f"Weak fragment relationships (avg: {rel_score:.2f})")
    
    entropies = [f.get("entropy", 0) for f in fragments]
    if entropies:
        entropy_std = np.std(entropies) if len(entropies) > 1 else 0
        if entropy_std < 0.5:
            struct_score = 1.0
            reasons.append("Consistent entropy across fragments")
        elif entropy_std < 1.0:
            struct_score = 0.7
            reasons.append("Moderately consistent entropy")
        else:
            struct_score = 0.4
            reasons.append("Inconsistent entropy across fragments")
    else:
        struct_score = 0.5
    
    integrity_score = 1.0 if integrity_verified else 0.0
    if integrity_verified:
        reasons.append("Integrity hash verified")
    elif expected_hash and actual_hash:
        reasons.append("Integrity hash mismatch")
    else:
        reasons.append("Integrity not verified (no reference hash)")
    
    total_fragments = len(fragments)
    missing_count = sum(1 for f in fragments if f.get("is_missing", False))
    missing_penalty = min(0.5, missing_count / max(1, total_fragments) * 0.5)
    if missing_count > 0:
        reasons.append(f"{missing_count} missing fragment(s) inferred")
    
    contradiction_penalty = 0.0
    for f in fragments:
        if f.get("suspicious_indicators"):
            for ind in f["suspicious_indicators"]:
                if ind.get("severity") == "high":
                    contradiction_penalty += 0.15
                    reasons.append(f"High-severity indicator: {ind['description']}")
                elif ind.get("severity") == "medium":
                    contradiction_penalty += 0.08
                    reasons.append(f"Medium-severity indicator: {ind['description']}")
    contradiction_penalty = min(0.5, contradiction_penalty)
    
    total = (
        sig_score * 0.25 +
        rel_score * 0.25 +
        struct_score * 0.20 +
        integrity_score * 0.20 -
        missing_penalty -
        contradiction_penalty
    )
    total = max(0.0, min(1.0, total))
    
    return ConfidenceBreakdown(
        signature_compatibility=round(sig_score, 4),
        fragment_relationship_score=round(rel_score, 4),
        structural_consistency=round(struct_score, 4),
        integrity_verification=round(integrity_score, 4),
        missing_penalty=round(missing_penalty, 4),
        contradiction_penalty=round(contradiction_penalty, 4),
        total=round(total, 4),
        reasons=reasons
    )


def verify_integrity(reconstructed_data: bytes, expected_hash: Optional[str] = None) -> Dict[str, Any]:
    actual_hash = hashlib.sha256(reconstructed_data).hexdigest()
    
    result = {
        "verified": False,
        "actual_hash": actual_hash,
        "expected_hash": expected_hash,
        "match": False,
    }
    
    if expected_hash:
        result["match"] = (actual_hash.lower() == expected_hash.lower())
        result["verified"] = result["match"]
    
    return result


def attempt_reconstruction(chain: List[Dict], fragment_data_map: Dict[str, bytes]) -> Tuple[bytes, List[Dict]]:
    reconstructed = bytearray()
    used_fragments = []
    
    for frag in chain:
        fid = frag["fragment_id"]
        if fid in fragment_data_map:
            reconstructed.extend(fragment_data_map[fid])
            frag_copy = frag.copy()
            frag_copy["is_missing"] = False
            used_fragments.append(frag_copy)
        else:
            frag_copy = frag.copy()
            frag_copy["is_missing"] = True
            used_fragments.append(frag_copy)
    
    return bytes(reconstructed), used_fragments


def generate_reconstructions(
    fragments: List[Dict],
    fragment_data_map: Dict[str, bytes],
    min_chain_length: int = 2,
    min_relationship_score: float = 0.5
) -> List[Dict]:
    chains = find_reconstruction_chains(fragments, min_score=min_relationship_score)
    
    reconstructions = []
    
    for chain in chains:
        if len(chain) < min_chain_length:
            continue
        
        file_types = [f.get("file_type", "UNKNOWN") for f in chain]
        most_common_type = max(set(file_types), key=file_types.count)
        
        reconstructed_data, used_fragments = attempt_reconstruction(chain, fragment_data_map)
        
        relationships = []
        for i in range(len(chain) - 1):
            rel = analyze_relationship(chain[i], chain[i + 1])
            relationships.append(rel)
        
        integrity_result = verify_integrity(reconstructed_data)
        
        confidence = calculate_confidence_score(
            used_fragments,
            relationships,
            integrity_result["verified"],
            integrity_result.get("expected_hash"),
            integrity_result.get("actual_hash")
        )
        
        missing_count = sum(1 for f in used_fragments if f.get("is_missing", False))
        
        recon = {
            "name": f"reconstructed_{most_common_type.lower()}_{len(reconstructions) + 1}",
            "file_type": most_common_type,
            "estimated_size": sum(f.get("size", 0) for f in chain),
            "actual_size": len(reconstructed_data),
            "fragment_count": len(used_fragments),
            "missing_fragments": missing_count,
            "confidence_score": confidence.total,
            "confidence_breakdown": {
                "signature_compatibility": confidence.signature_compatibility,
                "fragment_relationship_score": confidence.fragment_relationship_score,
                "structural_consistency": confidence.structural_consistency,
                "integrity_verification": confidence.integrity_verification,
                "missing_penalty": confidence.missing_penalty,
                "contradiction_penalty": confidence.contradiction_penalty,
            },
            "confidence_reasons": confidence.reasons,
            "integrity_status": "verified" if integrity_result["verified"] else ("partial" if integrity_result["expected_hash"] else "unknown"),
            "integrity_hash": integrity_result["actual_hash"],
            "expected_hash": integrity_result.get("expected_hash"),
            "status": "candidate",
            "fragments": used_fragments,
            "relationships": relationships,
            "reconstructed_data": reconstructed_data,
        }
        
        reconstructions.append(recon)
    
    reconstructions.sort(key=lambda x: x["confidence_score"], reverse=True)
    return reconstructions


def check_overlapping_candidates(reconstructions: List[Dict]) -> List[Dict]:
    for i, recon_a in enumerate(reconstructions):
        frags_a = set(f["fragment_id"] for f in recon_a["fragments"] if not f.get("is_missing"))
        for j, recon_b in enumerate(reconstructions):
            if i >= j:
                continue
            frags_b = set(f["fragment_id"] for f in recon_b["fragments"] if not f.get("is_missing"))
            overlap = frags_a & frags_b
            if overlap:
                recon_a.setdefault("overlaps_with", []).append({
                    "reconstruction_index": j,
                    "shared_fragments": list(overlap),
                    "overlap_count": len(overlap),
                })
                recon_b.setdefault("overlaps_with", []).append({
                    "reconstruction_index": i,
                    "shared_fragments": list(overlap),
                    "overlap_count": len(overlap),
                })
    return reconstructions


import numpy as np