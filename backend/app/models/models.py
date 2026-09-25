from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean, JSON, Index
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
from typing import Optional

Base = declarative_base()


class Dataset(Base):
    __tablename__ = "datasets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String(512), nullable=True)
    total_fragments = Column(Integer, default=0)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    fragments = relationship("Fragment", back_populates="dataset", cascade="all, delete-orphan")
    reconstructions = relationship("Reconstruction", back_populates="dataset", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="dataset", cascade="all, delete-orphan")


class Fragment(Base):
    __tablename__ = "fragments"
    
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    fragment_id = Column(String(100), unique=True, nullable=False, index=True)
    original_offset = Column(Integer, nullable=True)
    size = Column(Integer, nullable=False)
    file_type = Column(String(50), nullable=True)
    mime_type = Column(String(100), nullable=True)
    entropy = Column(Float, nullable=True)
    printable_ratio = Column(Float, nullable=True)
    magic_bytes = Column(String(100), nullable=True)
    sha256_hash = Column(String(64), nullable=False, index=True)
    is_duplicate = Column(Boolean, default=False)
    duplicate_of = Column(String(100), nullable=True)
    classification_confidence = Column(Float, nullable=True)
    classification_method = Column(String(50), nullable=True)
    features = Column(JSON, nullable=True)
    suspicious_indicators = Column(JSON, nullable=True)
    status = Column(String(50), default="analyzed")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    dataset = relationship("Dataset", back_populates="fragments")
    relationships = relationship("FragmentRelationship", 
                                  foreign_keys="FragmentRelationship.fragment_a_id",
                                  back_populates="fragment_a",
                                  cascade="all, delete-orphan")
    relationships_b = relationship("FragmentRelationship",
                                    foreign_keys="FragmentRelationship.fragment_b_id",
                                    back_populates="fragment_b",
                                    cascade="all, delete-orphan")
    reconstruction_fragments = relationship("ReconstructionFragment", back_populates="fragment")


class FragmentRelationship(Base):
    __tablename__ = "fragment_relationships"
    
    id = Column(Integer, primary_key=True, index=True)
    fragment_a_id = Column(Integer, ForeignKey("fragments.id"), nullable=False)
    fragment_b_id = Column(Integer, ForeignKey("fragments.id"), nullable=False)
    relationship_type = Column(String(50), nullable=False)
    score = Column(Float, nullable=False)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    fragment_a = relationship("Fragment", foreign_keys=[fragment_a_id], back_populates="relationships")
    fragment_b = relationship("Fragment", foreign_keys=[fragment_b_id], back_populates="relationships_b")
    
    __table_args__ = (
        Index('ix_fragment_relationship_pair', 'fragment_a_id', 'fragment_b_id', unique=True),
    )


class Reconstruction(Base):
    __tablename__ = "reconstructions"
    
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    estimated_size = Column(Integer, nullable=True)
    actual_size = Column(Integer, nullable=True)
    fragment_count = Column(Integer, default=0)
    missing_fragments = Column(Integer, default=0)
    confidence_score = Column(Float, nullable=False)
    confidence_breakdown = Column(JSON, nullable=True)
    integrity_status = Column(String(50), nullable=True)
    integrity_hash = Column(String(64), nullable=True)
    expected_hash = Column(String(64), nullable=True)
    status = Column(String(50), default="candidate")
    investigator_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    dataset = relationship("Dataset", back_populates="reconstructions")
    fragments = relationship("ReconstructionFragment", back_populates="reconstruction", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="reconstruction", cascade="all, delete-orphan")


class ReconstructionFragment(Base):
    __tablename__ = "reconstruction_fragments"
    
    id = Column(Integer, primary_key=True, index=True)
    reconstruction_id = Column(Integer, ForeignKey("reconstructions.id"), nullable=False)
    fragment_id = Column(Integer, ForeignKey("fragments.id"), nullable=False)
    sequence_order = Column(Integer, nullable=False)
    is_missing = Column(Boolean, default=False)
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    reconstruction = relationship("Reconstruction", back_populates="fragments")
    fragment = relationship("Fragment", back_populates="reconstruction_fragments")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    reconstruction_id = Column(Integer, ForeignKey("reconstructions.id"), nullable=True)
    fragment_id = Column(String(100), nullable=True)
    action = Column(String(100), nullable=False)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=True)
    user_action = Column(String(255), nullable=True)
    details = Column(JSON, nullable=True)
    hash_value = Column(String(64), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    dataset = relationship("Dataset", back_populates="audit_logs")
    reconstruction = relationship("Reconstruction", back_populates="audit_logs")