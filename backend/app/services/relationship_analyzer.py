from typing import Dict, List, Tuple, Optional, Any
import numpy as np
from collections import defaultdict

FILE_TYPE_COMPATIBILITY = {
    "JPEG": ["JPEG", "UNKNOWN"],
    "PNG": ["PNG", "UNKNOWN"],
    "PDF": ["PDF", "UNKNOWN"],
    "DOCX": ["DOCX", "ZIP", "UNKNOWN"],
    "ZIP": ["ZIP", "DOCX", "UNKNOWN"],
    "TXT": ["TXT", "HTML", "UNKNOWN"],
    "HTML": ["HTML", "TXT", "UNKNOWN"],
    "ENCRYPTED": ["ENCRYPTED", "UNKNOWN"],
    "UNKNOWN": ["JPEG", "PNG", "PDF", "DOCX", "ZIP", "TXT", "HTML", "ENCRYPTED", "UNKNOWN"],
}


def calculate_signature_compatibility(frag_a: Dict, frag_b: Dict) -> float:
    type_a = frag_a.get("file_type", "UNKNOWN")
    type_b = frag_b.get("file_type", "UNKNOWN")
    
    if type_a == type_b and type_a != "UNKNOWN":
        return 1.0
    
    compatible = FILE_TYPE_COMPATIBILITY.get(type_a, [])
    if type_b in compatible:
        return 0.7
    
    if type_a == "UNKNOWN" or type_b == "UNKNOWN":
        return 0.5
    
    return 0.1


def calculate_structural_compatibility(frag_a: Dict, frag_b: Dict) -> float:
    entropy_a = frag_a.get("entropy", 0)
    entropy_b = frag_b.get("entropy", 0)
    entropy_diff = abs(entropy_a - entropy_b)
    
    if entropy_diff < 0.5:
        return 1.0
    elif entropy_diff < 1.0:
        return 0.8
    elif entropy_diff < 2.0:
        return 0.5
    return 0.2


def calculate_metadata_consistency(frag_a: Dict, frag_b: Dict) -> float:
    score = 0.0
    factors = 0
    
    size_a = frag_a.get("size", 0)
    size_b = frag_b.get("size", 0)
    if size_a > 0 and size_b > 0:
        size_ratio = min(size_a, size_b) / max(size_a, size_b)
        score += size_ratio
        factors += 1
    
    printable_a = frag_a.get("printable_ratio", 0)
    printable_b = frag_b.get("printable_ratio", 0)
    printable_diff = abs(printable_a - printable_b)
    if printable_diff < 0.1:
        score += 1.0
    elif printable_diff < 0.3:
        score += 0.7
    else:
        score += 0.3
    factors += 1
    
    magic_a = frag_a.get("magic_bytes")
    magic_b = frag_b.get("magic_bytes")
    if magic_a and magic_b:
        if magic_a == magic_b:
            score += 1.0
        else:
            score += 0.2
        factors += 1
    
    return score / factors if factors > 0 else 0.5


def calculate_content_similarity(frag_a: Dict, frag_b: Dict) -> float:
    features_a = frag_a.get("features", {})
    features_b = frag_b.get("features", {})
    
    freq_a = features_a.get("byte_frequency", [])
    freq_b = features_b.get("byte_frequency", [])
    
    if not freq_a or not freq_b or len(freq_a) != 256 or len(freq_b) != 256:
        return 0.5
    
    freq_a = np.array(freq_a)
    freq_b = np.array(freq_b)
    
    dot_product = np.dot(freq_a, freq_b)
    norm_a = np.linalg.norm(freq_a)
    norm_b = np.linalg.norm(freq_b)
    
    if norm_a == 0 or norm_b == 0:
        return 0.5
    
    cosine_sim = dot_product / (norm_a * norm_b)
    return max(0.0, min(1.0, cosine_sim))


def analyze_relationship(frag_a: Dict, frag_b: Dict) -> Dict[str, Any]:
    sig_score = calculate_signature_compatibility(frag_a, frag_b)
    struct_score = calculate_structural_compatibility(frag_a, frag_b)
    meta_score = calculate_metadata_consistency(frag_a, frag_b)
    content_score = calculate_content_similarity(frag_a, frag_b)
    
    weights = {
        "signature": 0.35,
        "structural": 0.25,
        "metadata": 0.20,
        "content": 0.20,
    }
    
    total_score = (
        weights["signature"] * sig_score +
        weights["structural"] * struct_score +
        weights["metadata"] * meta_score +
        weights["content"] * content_score
    )
    
    relationship_type = "unknown"
    if sig_score > 0.8 and struct_score > 0.7:
        relationship_type = "strong_candidate"
    elif sig_score > 0.6:
        relationship_type = "signature_compatible"
    elif struct_score > 0.7 and meta_score > 0.7:
        relationship_type = "structurally_similar"
    elif content_score > 0.8:
        relationship_type = "content_similar"
    elif total_score > 0.5:
        relationship_type = "weak_candidate"
    
    return {
        "relationship_type": relationship_type,
        "score": round(total_score, 4),
        "details": {
            "signature_compatibility": round(sig_score, 4),
            "structural_compatibility": round(struct_score, 4),
            "metadata_consistency": round(meta_score, 4),
            "content_similarity": round(content_score, 4),
        }
    }


def build_relationship_graph(fragments: List[Dict], threshold: float = 0.4) -> Dict[str, Any]:
    nodes = []
    edges = []
    
    for i, frag in enumerate(fragments):
        nodes.append({
            "id": frag["fragment_id"],
            "label": frag["fragment_id"],
            "type": frag.get("file_type", "UNKNOWN"),
            "size": frag.get("size", 0),
            "confidence": frag.get("classification_confidence", 0),
            "entropy": frag.get("entropy", 0),
        })
    
    for i in range(len(fragments)):
        for j in range(i + 1, len(fragments)):
            rel = analyze_relationship(fragments[i], fragments[j])
            if rel["score"] >= threshold:
                edges.append({
                    "source": fragments[i]["fragment_id"],
                    "target": fragments[j]["fragment_id"],
                    "score": rel["score"],
                    "type": rel["relationship_type"],
                    "details": rel["details"],
                })
    
    return {"nodes": nodes, "edges": edges}


def find_reconstruction_chains(fragments: List[Dict], min_score: float = 0.5) -> List[List[Dict]]:
    chains = []
    used = set()
    
    sorted_frags = sorted(fragments, key=lambda x: (x.get("file_type", ""), x.get("original_offset", 0) or 0))
    
    for frag in sorted_frags:
        fid = frag["fragment_id"]
        if fid in used:
            continue
        
        chain = [frag]
        used.add(fid)
        current = frag
        
        while True:
            best_next = None
            best_score = 0
            
            for candidate in sorted_frags:
                cfid = candidate["fragment_id"]
                if cfid in used:
                    continue
                
                rel = analyze_relationship(current, candidate)
                if rel["score"] > best_score and rel["score"] >= min_score:
                    best_score = rel["score"]
                    best_next = candidate
            
            if best_next:
                chain.append(best_next)
                used.add(best_next["fragment_id"])
                current = best_next
            else:
                break
        
        if len(chain) > 1:
            chains.append(chain)
    
    return chains