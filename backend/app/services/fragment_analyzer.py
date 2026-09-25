import hashlib
import math
import re
from typing import Dict, List, Tuple, Optional, Any
from collections import Counter
import numpy as np

FILE_SIGNATURES = {
    "JPEG": [b"\xFF\xD8\xFF"],
    "PNG": [b"\x89\x50\x4E\x47\x0D\x0A\x1A\x0A"],
    "PDF": [b"%PDF"],
    "DOCX": [b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08"],
    "ZIP": [b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08"],
    "GIF": [b"GIF87a", b"GIF89a"],
    "BMP": [b"BM"],
    "TIFF": [b"II\x2A\x00", b"MM\x00\x2A"],
    "MP3": [b"ID3", b"\xFF\xFB", b"\xFF\xF3", b"\xFF\xF2"],
    "MP4": [b"\x00\x00\x00\x18ftypmp4", b"\x00\x00\x00\x1Cftypmp4"],
    "ELF": [b"\x7FELF"],
    "GZIP": [b"\x1F\x8B"],
    "RAR": [b"Rar!\x1A\x07\x00", b"Rar!\x1A\x07\x01\x00"],
    "7Z": [b"7z\xBC\xAF\x27\x1C"],
}

MAGIC_BYTES_MAP = {}
for ftype, signatures in FILE_SIGNATURES.items():
    for sig in signatures:
        MAGIC_BYTES_MAP[sig] = ftype

DOCX_ZIP_TYPES = {"DOCX", "ZIP"}


def calculate_entropy(data: bytes) -> float:
    if not data:
        return 0.0
    counter = Counter(data)
    length = len(data)
    entropy = -sum((count / length) * math.log2(count / length) for count in counter.values())
    return entropy


def calculate_printable_ratio(data: bytes) -> float:
    if not data:
        return 0.0
    printable = sum(1 for b in data if 32 <= b <= 126 or b in (9, 10, 13))
    return printable / len(data)


def calculate_byte_frequency(data: bytes) -> np.ndarray:
    freq = np.zeros(256, dtype=np.float32)
    if data:
        counter = Counter(data)
        for byte_val, count in counter.items():
            freq[byte_val] = count / len(data)
    return freq


def detect_magic_bytes(data: bytes, max_check: int = 32) -> Tuple[Optional[str], Optional[bytes]]:
    header = data[:max_check]
    for sig, ftype in MAGIC_BYTES_MAP.items():
        if header.startswith(sig):
            return ftype, sig
    return None, None


def extract_features(data: bytes) -> Dict[str, Any]:
    features = {}
    features["size"] = len(data)
    features["entropy"] = calculate_entropy(data)
    features["printable_ratio"] = calculate_printable_ratio(data)
    features["byte_frequency"] = calculate_byte_frequency(data).tolist()
    
    magic_type, magic_bytes = detect_magic_bytes(data)
    features["magic_type"] = magic_type
    features["magic_bytes"] = magic_bytes.hex() if magic_bytes else None
    
    features["null_byte_ratio"] = data.count(0) / len(data) if data else 0
    features["high_byte_ratio"] = sum(1 for b in data if b > 127) / len(data) if data else 0
    features["docx_marker"] = float(b"[Content_Types].xml" in data[:4096] or b"word/" in data[:4096])
    features["html_marker"] = float(b"<html" in data[:4096].lower() or b"<!doctype html" in data[:4096].lower())
    features["pdf_marker"] = float(data.startswith(b"%PDF"))
    features["zip_marker"] = float(data.startswith(b"PK"))
    features["encrypted_hint"] = float(features["entropy"] > 7.5 and features["printable_ratio"] < 0.3)
    
    return features


def heuristic_classify(data: bytes) -> Tuple[str, float, Dict]:
    magic_type, magic_bytes = detect_magic_bytes(data)
    if magic_type:
        if magic_type in DOCX_ZIP_TYPES:
            if b"[Content_Types].xml" in data[:1024] or b"word/" in data[:1024]:
                return "DOCX", 0.95, {"method": "heuristic", "magic": magic_type, "detail": "DOCX structure detected"}
            return "ZIP", 0.9, {"method": "heuristic", "magic": magic_type}
        return magic_type, 0.95, {"method": "heuristic", "magic": magic_type}
    
    entropy = calculate_entropy(data)
    printable = calculate_printable_ratio(data)
    
    if entropy > 7.5 and printable < 0.3:
        return "ENCRYPTED", 0.85, {"method": "heuristic", "entropy": entropy, "printable": printable}
    
    if printable > 0.9:
        text_sample = data[:512].decode('ascii', errors='ignore')
        if text_sample.startswith('%PDF'):
            return "PDF", 0.9, {"method": "heuristic", "detail": "PDF text header"}
        if '<html' in text_sample.lower() or '<!doctype html' in text_sample.lower():
            return "HTML", 0.8, {"method": "heuristic", "detail": "HTML tags"}
        if text_sample.startswith('PK\x03\x04'):
            return "ZIP", 0.85, {"method": "heuristic", "detail": "ZIP header in text"}
        return "TXT", 0.7, {"method": "heuristic", "printable": printable}
    
    if 4.0 < entropy < 7.0 and printable > 0.4:
        return "UNKNOWN", 0.4, {"method": "heuristic", "entropy": entropy, "printable": printable}
    
    return "UNKNOWN", 0.3, {"method": "heuristic", "entropy": entropy, "printable": printable}


class FragmentClassifier:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.label_encoder = None
        self.is_trained = False
        self.feature_names = [
            "size", "entropy", "printable_ratio", "null_byte_ratio", "high_byte_ratio",
            "docx_marker", "html_marker", "pdf_marker", "zip_marker", "encrypted_hint"
        ] + [f"byte_freq_{i}" for i in range(256)]
    
    def prepare_features(self, features_list: List[Dict]) -> np.ndarray:
        X = []
        for f in features_list:
            row = [
                f.get("size", 0),
                f.get("entropy", 0),
                f.get("printable_ratio", 0),
                f.get("null_byte_ratio", 0),
                f.get("high_byte_ratio", 0),
                f.get("docx_marker", 0),
                f.get("html_marker", 0),
                f.get("pdf_marker", 0),
                f.get("zip_marker", 0),
                f.get("encrypted_hint", 0),
            ]
            byte_freq = f.get("byte_frequency", [0]*256)
            row.extend(byte_freq[:256])
            X.append(row)
        return np.array(X, dtype=np.float32)
    
    def train(self, features_list: List[Dict], labels: List[str]):
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.preprocessing import StandardScaler, LabelEncoder
        from sklearn.model_selection import train_test_split
        
        X = self.prepare_features(features_list)
        y = np.array(labels)
        
        self.label_encoder = LabelEncoder()
        y_encoded = self.label_encoder.fit_transform(y)
        
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
        )
        
        self.model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
        self.model.fit(X_train, y_train)
        
        self.is_trained = True

    def _build_training_set(self) -> Tuple[List[Dict], List[str]]:
        """Create a deterministic labelled corpus from file signatures and content traits."""
        rng = np.random.default_rng(42)
        examples: List[Dict] = []
        labels: List[str] = []
        prototypes = {
            "JPEG": b"\xff\xd8\xff" + b"JFIF" + b"\x00" * 300,
            "PNG": b"\x89PNG\r\n\x1a\n" + b"IHDR" + b"\x00" * 300,
            "PDF": b"%PDF-1.7\n" + b"PDF object content " * 25,
            "DOCX": b"PK\x03\x04[Content_Types].xml word/document.xml" + b"\x00" * 250,
            "ZIP": b"PK\x03\x04archive.bin" + b"\x00" * 300,
            "TXT": b"Plain text forensic fragment with readable content.\n" * 8,
            "HTML": b"<!doctype html><html><body>document</body></html>" * 8,
            "ENCRYPTED": bytes(rng.integers(0, 256, 400, dtype=np.uint8)),
            "UNKNOWN": bytes(rng.integers(0, 256, 180, dtype=np.uint8)),
        }
        for label, prototype in prototypes.items():
            for _ in range(32):
                sample = bytearray(prototype)
                mutation_count = max(1, len(sample) // 80)
                for position in rng.integers(0, len(sample), mutation_count):
                    sample[int(position)] = int(rng.integers(0, 256))
                examples.append(extract_features(bytes(sample)))
                labels.append(label)
        return examples, labels

    def ensure_trained(self) -> None:
        if not self.is_trained:
            features, labels = self._build_training_set()
            self.train(features, labels)
    
    def predict(self, features: Dict) -> Tuple[str, float, Dict]:
        self.ensure_trained()
        
        X = self.prepare_features([features])
        X_scaled = self.scaler.transform(X)
        
        probas = self.model.predict_proba(X_scaled)[0]
        pred_idx = np.argmax(probas)
        confidence = float(probas[pred_idx])
        predicted_label = self.label_encoder.inverse_transform([pred_idx])[0]
        
        return predicted_label, confidence, {
            "method": "random_forest",
            "model_executed": True,
            "probabilities": dict(zip(self.label_encoder.classes_, probas.tolist())),
        }
    
    def save(self, path: str):
        import joblib
        joblib.dump({
            "model": self.model,
            "scaler": self.scaler,
            "label_encoder": self.label_encoder,
            "is_trained": self.is_trained
        }, path)
    
    def load(self, path: str):
        import joblib
        data = joblib.load(path)
        self.model = data["model"]
        self.scaler = data["scaler"]
        self.label_encoder = data["label_encoder"]
        self.is_trained = data["is_trained"]


def analyze_fragment(fragment_id: str, data: bytes, classifier: Optional[FragmentClassifier] = None) -> Dict[str, Any]:
    sha256_hash = hashlib.sha256(data).hexdigest()
    features = extract_features(data)
    
    if classifier:
        file_type, confidence, classification_info = classifier.predict(features)
    else:
        file_type, confidence, classification_info = heuristic_classify(data)
    
    suspicious = detect_suspicious_indicators(data, features, file_type)
    
    return {
        "fragment_id": fragment_id,
        "size": len(data),
        "file_type": file_type,
        "entropy": features["entropy"],
        "printable_ratio": features["printable_ratio"],
        "magic_bytes": features["magic_bytes"],
        "sha256_hash": sha256_hash,
        "classification_confidence": confidence,
        "classification_method": classification_info.get("method", "heuristic"),
        "features": features,
        "suspicious_indicators": suspicious,
    }


def detect_suspicious_indicators(data: bytes, features: Dict, file_type: str) -> List[Dict]:
    indicators = []
    
    if features["entropy"] > 7.8 and file_type not in ["ENCRYPTED", "ZIP", "DOCX", "JPEG", "PNG"]:
        indicators.append({
            "type": "high_entropy",
            "severity": "medium",
            "description": f"Unusually high entropy ({features['entropy']:.2f}) for {file_type} file",
            "value": features["entropy"]
        })
    
    if file_type == "ENCRYPTED":
        indicators.append({
            "type": "encrypted_content",
            "severity": "high",
            "description": "Data appears to be encrypted or compressed",
            "value": features["entropy"]
        })
    
    if features["null_byte_ratio"] > 0.5:
        indicators.append({
            "type": "excessive_nulls",
            "severity": "low",
            "description": f"High ratio of null bytes ({features['null_byte_ratio']:.1%})",
            "value": features["null_byte_ratio"]
        })
    
    if len(data) < 100 and file_type != "UNKNOWN":
        indicators.append({
            "type": "fragment_too_small",
            "severity": "medium",
            "description": f"Fragment only {len(data)} bytes, may be incomplete",
            "value": len(data)
        })
    
    magic_type, _ = detect_magic_bytes(data)
    if magic_type and magic_type != file_type and file_type != "UNKNOWN":
        indicators.append({
            "type": "magic_mismatch",
            "severity": "high",
            "description": f"Magic bytes indicate {magic_type} but classified as {file_type}",
            "value": {"magic": magic_type, "classified": file_type}
        })
    
    return indicators


def find_duplicates(fragments: List[Dict]) -> List[Dict]:
    hash_map = {}
    for frag in fragments:
        h = frag["sha256_hash"]
        if h in hash_map:
            frag["is_duplicate"] = True
            frag["duplicate_of"] = hash_map[h]["fragment_id"]
            hash_map[h]["duplicates"].append(frag["fragment_id"])
        else:
            frag["is_duplicate"] = False
            frag["duplicate_of"] = None
            hash_map[h] = {"fragment_id": frag["fragment_id"], "duplicates": []}
    return fragments