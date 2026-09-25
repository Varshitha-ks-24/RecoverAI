import hashlib
import os
import random
from typing import Dict, List, Tuple, Any
from app.services.ai_pipeline import FragmentAIPipeline


JPEG_HEADER = bytes.fromhex("FF D8 FF E0 00 10 4A 46 49 46 00 01")
JPEG_FOOTER = bytes.fromhex("FF D9")

PNG_HEADER = bytes.fromhex("89 50 4E 47 0D 0A 1A 0A")
PNG_IHDR = bytes.fromhex("00 00 00 0D 49 48 44 52")
PNG_FOOTER = bytes.fromhex("49 45 4E 44 AE 42 60 82")

PDF_HEADER = b"%PDF-1.7\n"
PDF_FOOTER = b"%%EOF\n"

DOCX_HEADER = bytes.fromhex("50 4B 03 04")
DOCX_CONTENT = b"[Content_Types].xml"
DOCX_WORD = b"word/document.xml"

ZIP_HEADER = bytes.fromhex("50 4B 03 04")

TXT_CONTENT = b"This is a sample text file for forensic analysis.\nIt contains multiple lines of text.\nSome lines are longer than others to simulate realistic data.\n"

HTML_CONTENT = b"<!DOCTYPE html>\n<html>\n<head><title>Test</title></head>\n<body><h1>Sample HTML</h1><p>Content here.</p></body>\n</html>"

ENCRYPTED_SAMPLE = os.urandom(1024)


def create_jpeg_fragments() -> List[Tuple[bytes, Dict]]:
    base_data = JPEG_HEADER + b"\x00" * 500 + JPEG_FOOTER
    fragments = []
    
    frag1 = base_data[:200]
    fragments.append((frag1, {"original_offset": 0, "expected_type": "JPEG"}))
    
    frag2 = base_data[150:400]
    fragments.append((frag2, {"original_offset": 150, "expected_type": "JPEG"}))
    
    frag3 = base_data[350:]
    fragments.append((frag3, {"original_offset": 350, "expected_type": "JPEG"}))
    
    duplicate = base_data[:200]
    fragments.append((duplicate, {"original_offset": 0, "expected_type": "JPEG", "is_decoy": True}))
    
    corrupted = bytearray(base_data[:200])
    corrupted[10:20] = os.urandom(10)
    fragments.append((bytes(corrupted), {"original_offset": 0, "expected_type": "JPEG", "is_corrupted": True}))
    
    return fragments


def create_png_fragments() -> List[Tuple[bytes, Dict]]:
    base_data = PNG_HEADER + PNG_IHDR + b"\x00" * 400 + PNG_FOOTER
    fragments = []
    
    frag1 = base_data[:150]
    fragments.append((frag1, {"original_offset": 0, "expected_type": "PNG"}))
    
    frag2 = base_data[100:350]
    fragments.append((frag2, {"original_offset": 100, "expected_type": "PNG"}))
    
    frag3 = base_data[300:]
    fragments.append((frag3, {"original_offset": 300, "expected_type": "PNG"}))
    
    return fragments


def create_pdf_fragments() -> List[Tuple[bytes, Dict]]:
    base_data = PDF_HEADER + b"Sample PDF content for testing. " * 50 + PDF_FOOTER
    fragments = []
    
    frag1 = base_data[:200]
    fragments.append((frag1, {"original_offset": 0, "expected_type": "PDF"}))
    
    frag2 = base_data[150:400]
    fragments.append((frag2, {"original_offset": 150, "expected_type": "PDF"}))
    
    frag3 = base_data[350:]
    fragments.append((frag3, {"original_offset": 350, "expected_type": "PDF"}))
    
    return fragments


def create_docx_fragments() -> List[Tuple[bytes, Dict]]:
    base_data = DOCX_HEADER + b"\x00" * 100 + DOCX_CONTENT + b"\x00" * 200 + DOCX_WORD + b"\x00" * 300
    fragments = []
    
    frag1 = base_data[:250]
    fragments.append((frag1, {"original_offset": 0, "expected_type": "DOCX"}))
    
    frag2 = base_data[200:500]
    fragments.append((frag2, {"original_offset": 200, "expected_type": "DOCX"}))
    
    frag3 = base_data[450:]
    fragments.append((frag3, {"original_offset": 450, "expected_type": "DOCX"}))
    
    return fragments


def create_txt_fragments() -> List[Tuple[bytes, Dict]]:
    base_data = TXT_CONTENT * 3
    fragments = []
    
    frag1 = base_data[:200]
    fragments.append((frag1, {"original_offset": 0, "expected_type": "TXT"}))
    
    frag2 = base_data[150:400]
    fragments.append((frag2, {"original_offset": 150, "expected_type": "TXT"}))
    
    frag3 = base_data[350:]
    fragments.append((frag3, {"original_offset": 350, "expected_type": "TXT"}))
    
    return fragments


def create_decoy_fragments() -> List[Tuple[bytes, Dict]]:
    fragments = []
    
    decoy1 = b"DECOY_FRAGMENT_MARKER_" + os.urandom(100)
    fragments.append((decoy1, {"original_offset": None, "expected_type": "UNKNOWN", "is_decoy": True}))
    
    decoy2 = b"FAKE_EVIDENCE_" + b"X" * 200
    fragments.append((decoy2, {"original_offset": None, "expected_type": "UNKNOWN", "is_decoy": True}))
    
    decoy3 = JPEG_HEADER[:4] + os.urandom(200)
    fragments.append((decoy3, {"original_offset": None, "expected_type": "UNKNOWN", "is_decoy": True, "fake_magic": "JPEG"}))
    
    decoy4 = PDF_HEADER[:4] + os.urandom(200)
    fragments.append((decoy4, {"original_offset": None, "expected_type": "UNKNOWN", "is_decoy": True, "fake_magic": "PDF"}))
    
    return fragments


def create_encrypted_fragments() -> List[Tuple[bytes, Dict]]:
    fragments = []
    
    enc1 = ENCRYPTED_SAMPLE[:300]
    fragments.append((enc1, {"original_offset": 0, "expected_type": "ENCRYPTED", "is_encrypted": True}))
    
    enc2 = ENCRYPTED_SAMPLE[250:550]
    fragments.append((enc2, {"original_offset": 250, "expected_type": "ENCRYPTED", "is_encrypted": True}))
    
    return fragments


def create_hash_mismatch_fragments() -> List[Tuple[bytes, Dict]]:
    base_data = b"Original content for hash verification. " * 20
    fragments = []
    
    frag1 = base_data[:300]
    fragments.append((frag1, {"original_offset": 0, "expected_type": "TXT", "expected_hash": hashlib.sha256(base_data).hexdigest()}))
    
    frag2 = base_data[250:550]
    fragments.append((frag2, {"original_offset": 250, "expected_type": "TXT", "expected_hash": hashlib.sha256(base_data).hexdigest()}))
    
    modified = bytearray(base_data)
    modified[100:110] = b"MODIFIED!!"
    fragments.append((bytes(modified), {"original_offset": 0, "expected_type": "TXT", "expected_hash": hashlib.sha256(base_data).hexdigest(), "is_tampered": True}))
    
    return fragments


def create_overlapping_candidates() -> List[Tuple[bytes, Dict]]:
    base_jpeg = JPEG_HEADER + b"A" * 300 + JPEG_FOOTER
    base_png = PNG_HEADER + PNG_IHDR + b"B" * 300 + PNG_FOOTER
    
    fragments = []
    
    shared = b"SHARED_SECTION_" + b"X" * 100
    
    frag1 = base_jpeg[:200]
    fragments.append((frag1, {"original_offset": 0, "expected_type": "JPEG"}))
    
    frag2 = base_jpeg[150:350]
    fragments.append((frag2, {"original_offset": 150, "expected_type": "JPEG"}))
    
    frag3 = base_png[:200]
    fragments.append((frag3, {"original_offset": 0, "expected_type": "PNG"}))
    
    frag4 = base_png[150:350]
    fragments.append((frag4, {"original_offset": 150, "expected_type": "PNG"}))
    
    frag5 = shared
    fragments.append((frag5, {"original_offset": None, "expected_type": "UNKNOWN", "is_shared": True}))
    
    return fragments


def create_anti_forensics_fragments() -> List[Tuple[bytes, Dict]]:
    fragments = []
    
    wiped = b"\x00" * 500
    fragments.append((wiped, {"original_offset": None, "expected_type": "UNKNOWN", "anti_forensics": "wiped"}))
    
    random_data = os.urandom(500)
    fragments.append((random_data, {"original_offset": None, "expected_type": "ENCRYPTED", "anti_forensics": "random_fill"}))
    
    fake_jpeg = JPEG_HEADER + os.urandom(400) + JPEG_FOOTER
    fragments.append((fake_jpeg, {"original_offset": None, "expected_type": "JPEG", "anti_forensics": "fake_signature"}))
    
    return fragments


def generate_demo_dataset() -> Dict[str, Any]:
    all_fragments = []
    fragment_data_map = {}
    fragment_meta = {}
    
    generators = [
        ("jpeg", create_jpeg_fragments),
        ("png", create_png_fragments),
        ("pdf", create_pdf_fragments),
        ("docx", create_docx_fragments),
        ("txt", create_txt_fragments),
        ("decoy", create_decoy_fragments),
        ("encrypted", create_encrypted_fragments),
        ("hash_mismatch", create_hash_mismatch_fragments),
        ("overlapping", create_overlapping_candidates),
        ("anti_forensics", create_anti_forensics_fragments),
    ]
    
    fragment_counter = 0
    for prefix, gen_func in generators:
        frags = gen_func()
        for data, meta in frags:
            fragment_counter += 1
            fid = f"{prefix}_{fragment_counter:04d}"
            all_fragments.append((fid, data, meta))
            fragment_data_map[fid] = data
            fragment_meta[fid] = meta
    
    random.shuffle(all_fragments)
    
    pipeline = FragmentAIPipeline()
    analyzed = pipeline.analyze_batch([(fid, data, meta) for fid, data, meta in all_fragments])
    for result in analyzed:
        result.update(result.pop("source_metadata", {}))
    
    return {
        "name": "Demo Dataset - Mixed Forensic Fragments",
        "description": "Synthetic dataset containing JPEG, PNG, PDF, DOCX, TXT fragments with duplicates, decoys, encrypted data, hash mismatches, and anti-forensics indicators.",
        "fragments": analyzed,
        "fragment_data_map": fragment_data_map,
        "fragment_meta": fragment_meta,
    }


if __name__ == "__main__":
    demo = generate_demo_dataset()
    print(f"Generated {len(demo['fragments'])} fragments")
    types = {}
    for f in demo['fragments']:
        t = f.get('file_type', 'UNKNOWN')
        types[t] = types.get(t, 0) + 1
    print("File type distribution:", types)
    duplicates = sum(1 for f in demo['fragments'] if f.get('is_duplicate'))
    print(f"Duplicates: {duplicates}")
    decoys = sum(1 for f in demo['fragments'] if f.get('is_decoy'))
    print(f"Decoys: {decoys}")
    encrypted = sum(1 for f in demo['fragments'] if f.get('is_encrypted'))
    print(f"Encrypted: {encrypted}")