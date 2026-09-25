import hashlib

from app.services.ai_pipeline import FragmentAIPipeline, duplicate_groups, similarity_groups


def test_random_forest_and_isolation_forest_execute():
    pipeline = FragmentAIPipeline()
    fragments = pipeline.analyze_batch([
        ("text-1", b"plain text evidence " * 20, {}),
        ("text-2", b"plain text evidence " * 18, {}),
        ("random-1", bytes(range(256)) * 2, {}),
    ])

    assert len(fragments) == 3
    assert all(fragment["classification_method"] == "random_forest" for fragment in fragments)
    assert all(fragment["features"]["ai_analysis"]["model"] == "isolation_forest" for fragment in fragments)
    assert all(0.0 <= fragment["anomaly_score"] <= 1.0 for fragment in fragments)


def test_hash_mismatch_and_duplicate_group_are_reported():
    content = b"same evidence"
    expected = hashlib.sha256(b"different evidence").hexdigest()
    pipeline = FragmentAIPipeline()
    fragments = pipeline.analyze_batch([
        ("first", content, {"expected_hash": expected}),
        ("duplicate", content, {}),
    ])

    assert fragments[0]["hash_analysis"]["status"] == "mismatch"
    assert fragments[1]["is_duplicate"] is True
    groups = duplicate_groups(fragments)
    assert groups[0]["count"] == 2
    assert set(groups[0]["fragment_ids"]) == {"first", "duplicate"}


def test_similarity_groups_use_fragment_features():
    pipeline = FragmentAIPipeline()
    fragments = pipeline.analyze_batch([
        ("one", b"similar readable evidence " * 20, {}),
        ("two", b"similar readable evidence " * 19, {}),
    ])

    groups = similarity_groups(fragments, threshold=0.7)
    assert groups
    assert set(groups[0]["fragment_ids"]) == {"one", "two"}
