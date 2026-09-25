"""Reusable ML pipeline for fragment classification and anomaly analysis."""

from __future__ import annotations

import hashlib
from typing import Any, Dict, List, Optional, Sequence, Tuple

import numpy as np
from sklearn.ensemble import IsolationForest

from app.services.fragment_analyzer import FragmentClassifier, analyze_fragment, find_duplicates


class FragmentAIPipeline:
    """Run the evidence analysis stages that precede relationship/reconstruction work."""

    def __init__(self, classifier: Optional[FragmentClassifier] = None) -> None:
        self.classifier = classifier or FragmentClassifier()
        self.anomaly_model: Optional[IsolationForest] = None

    def analyze_batch(
        self,
        fragments: Sequence[Tuple[str, bytes, Optional[Dict[str, Any]]]],
    ) -> List[Dict[str, Any]]:
        analyzed = []
        for fragment_id, data, metadata in fragments:
            result = analyze_fragment(fragment_id, data, self.classifier)
            result["source_metadata"] = metadata or {}
            analyzed.append(result)

        if not analyzed:
            return []

        self._add_anomaly_scores(analyzed)
        self._add_hash_analysis(analyzed)
        return find_duplicates(analyzed)

    def _add_anomaly_scores(self, analyzed: List[Dict[str, Any]]) -> None:
        feature_rows = self.classifier.prepare_features([item["features"] for item in analyzed])
        scores = np.full(len(analyzed), 0.5, dtype=np.float32)
        labels = np.zeros(len(analyzed), dtype=np.int8)

        if len(analyzed) >= 2:
            self.anomaly_model = IsolationForest(
                n_estimators=128,
                contamination="auto",
                random_state=42,
                n_jobs=-1,
            )
            predictions = self.anomaly_model.fit_predict(feature_rows)
            raw_scores = -self.anomaly_model.decision_function(feature_rows)
            minimum = float(raw_scores.min())
            maximum = float(raw_scores.max())
            if maximum > minimum:
                scores = np.clip((raw_scores - minimum) / (maximum - minimum), 0.0, 1.0)
            else:
                scores = np.full(len(analyzed), 0.5, dtype=np.float32)
            labels = predictions

        for index, item in enumerate(analyzed):
            score = round(float(scores[index]), 4)
            is_anomaly = bool(labels[index] == -1 or score >= 0.7)
            item["anomaly_score"] = score
            item["anomaly_label"] = "anomaly" if is_anomaly else "normal"
            item["features"]["ai_analysis"] = {
                "model": "isolation_forest",
                "anomaly_score": score,
                "anomaly_label": item["anomaly_label"],
                "model_executed": len(analyzed) >= 2,
            }
            if is_anomaly and not any(
                indicator.get("type") == "isolation_forest_anomaly"
                for indicator in item["suspicious_indicators"]
            ):
                item["suspicious_indicators"].append({
                    "type": "isolation_forest_anomaly",
                    "severity": "high" if score >= 0.85 else "medium",
                    "description": f"Isolation Forest anomaly score {score:.2f}",
                    "value": score,
                })

    def _add_hash_analysis(self, analyzed: List[Dict[str, Any]]) -> None:
        for item in analyzed:
            metadata = item.get("source_metadata", {})
            expected_hash = metadata.get("expected_hash")
            actual_hash = item["sha256_hash"]
            hash_match = None if not expected_hash else actual_hash.lower() == expected_hash.lower()
            item["hash_analysis"] = {
                "algorithm": "SHA-256",
                "hash": actual_hash,
                "expected_hash": expected_hash,
                "match": hash_match,
                "status": "verified" if hash_match else "mismatch" if expected_hash else "unverified",
            }
            item["features"]["hash_analysis"] = item["hash_analysis"]


def duplicate_groups(fragments: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
    groups: Dict[str, List[str]] = {}
    for fragment in fragments:
        groups.setdefault(fragment.get("sha256_hash", ""), []).append(fragment["fragment_id"])
    return [
        {"hash": digest, "fragment_ids": ids, "count": len(ids)}
        for digest, ids in groups.items()
        if digest and len(ids) > 1
    ]


def similarity_groups(
    fragments: Sequence[Dict[str, Any]],
    threshold: float = 0.7,
) -> List[Dict[str, Any]]:
    """Group fragments with strong feature similarity without changing reconstruction logic."""
    from app.services.relationship_analyzer import analyze_relationship

    groups: List[set[str]] = []
    for index, fragment in enumerate(fragments):
        for candidate in fragments[index + 1:]:
            relationship = analyze_relationship(fragment, candidate)
            if relationship["details"]["content_similarity"] >= threshold:
                matching = next(
                    (group for group in groups if fragment["fragment_id"] in group or candidate["fragment_id"] in group),
                    None,
                )
                if matching is None:
                    groups.append({fragment["fragment_id"], candidate["fragment_id"]})
                else:
                    matching.update((fragment["fragment_id"], candidate["fragment_id"]))
    return [{"fragment_ids": sorted(group), "count": len(group)} for group in groups]
