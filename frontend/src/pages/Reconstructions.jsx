import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Puzzle, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  HelpCircle,
  Hash,
  Copy,
  Download,
  Loader2,
  Eye,
  Flag,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  Shield,
  Zap,
  BarChart3,
  MoreHorizontal
} from 'lucide-react'
import { useDataset } from '../context/DatasetContext'
import api from '../utils/api'
import { clsx } from 'clsx'

function ConfidenceBar({ score, reasons, breakdown }) {
  const getColor = () => {
    if (score >= 0.7) return 'confidence-high'
    if (score >= 0.4) return 'confidence-medium'
    return 'confidence-low'
  }

  const getLabel = () => {
    if (score >= 0.7) return 'High'
    if (score >= 0.4) return 'Medium'
    return 'Low'
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="confidence-bar w-56 flex-1 max-w-xs">
          <div className={clsx('confidence-fill', getColor())} style={{ width: `${score * 100}%` }} />
        </div>
        <span className="font-display font-bold text-lg text-[var(--text-primary)] font-mono ml-4 whitespace-nowrap">{(score * 100).toFixed(1)}%</span>
        <span className={clsx('badge px-3 py-1 font-medium', 
          score >= 0.7 && 'badge-high',
          score >= 0.4 && score < 0.7 && 'badge-medium',
          score < 0.4 && 'badge-low'
        )}>
          {getLabel()} Confidence
        </span>
      </div>
      
      {breakdown && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(breakdown).map(([key, value]) => (
            <div key={key} className="glass rounded-xl p-2.5 text-center">
              <p className="font-display font-bold text-[var(--accent-primary)] text-lg">{(value * 100).toFixed(0)}%</p>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{key.replace(/_/g, ' ')}</p>
            </div>
          ))}
        </div>
      )}
      
      {reasons && reasons.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-[var(--text-muted)] flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors">
            <Zap className="w-4 h-4" />
            <span>Confidence Breakdown & Reasoning</span>
            <ChevronDown className="w-4 h-4 ml-auto transition-transform group-open:rotate-180 text-[var(--text-muted)]" />
          </summary>
          <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)] pl-4 list-disc border-l-2 border-[var(--border-primary)] pl-4">
            {reasons.map((reason, i) => (
              <li key={i} className="relative pl-2">{reason}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

function IntegrityBadge({ status, actualHash, expectedHash }) {
  const labels = {
    verified: 'Verified',
    partial: 'Partial',
    failed: 'Failed',
    unknown: 'Unknown',
  }
  
  const config = {
    verified: { class: 'badge-high', icon: CheckCircle, color: 'accent-primary' },
    partial: { class: 'badge-medium', icon: AlertTriangle, color: 'accent-warning' },
    failed: { class: 'badge-danger', icon: XCircle, color: 'accent-danger' },
    unknown: { class: 'badge-unknown', icon: HelpCircle, color: 'text-muted' },
  }
  
  const c = config[status] || config.unknown
  const Icon = c.icon

  return (
    <div className="space-y-2">
      <span className={clsx('badge px-3 py-1.5 font-medium', c.class)}>
        <Icon className="w-3 h-3 mr-1.5" />
        {labels[status] || status}
      </span>
      {actualHash && (
        <div className="font-mono text-xs text-[var(--text-muted)] flex items-center gap-1">
          <Hash className="w-3 h-3" />
          <button onClick={() => navigator.clipboard.writeText(actualHash)} className="hover:text-[var(--accent-primary)] transition-colors">
            {actualHash.slice(0, 32)}...
          </button>
        </div>
      )}
      {expectedHash && expectedHash !== actualHash && (
        <div className="flex items-center gap-1.5 p-2 glass rounded-lg bg-[var(--accent-danger-dim)]">
          <AlertTriangle className="w-4 h-4 text-[var(--accent-danger)]" />
          <span className="text-sm text-[var(--accent-danger)]">Hash mismatch detected - possible tampering</span>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const config = {
    candidate: { label: 'Candidate', class: 'badge-info', icon: HelpCircle },
    accepted: { label: 'Accepted', class: 'badge-high', icon: CheckCircle },
    rejected: { label: 'Rejected', class: 'badge-danger', icon: XCircle },
    suspicious: { label: 'Suspicious', class: 'badge-warning', icon: AlertTriangle },
  }
  const c = config[status] || config.candidate
  const Icon = c.icon
  return (
    <span className={clsx('badge px-3 py-1 font-medium flex items-center gap-1.5', c.class)}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  )
}

function FileTypeIcon({ type }) {
  const icons = {
    JPEG: { color: 'purple', label: 'JPEG' },
    PNG: { color: 'blue', label: 'PNG' },
    PDF: { color: 'red', label: 'PDF' },
    DOCX: { color: 'blue', label: 'DOCX' },
    ZIP: { color: 'amber', label: 'ZIP' },
    TXT: { color: 'green', label: 'TXT' },
    HTML: { color: 'orange', label: 'HTML' },
    ENCRYPTED: { color: 'red', label: 'ENC' },
    UNKNOWN: { color: 'slate', label: '???' },
  }
  const config = icons[type] || icons.UNKNOWN
  return (
    <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center font-bold font-mono text-xs', `bg-[var(--accent-${config.color}-dim)] text-[var(--accent-${config.color})]`)}>{config.label}</div>
  )
}

export function Reconstructions() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentDataset, loadDataset } = useDataset()
  const [reconstructions, setReconstructions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      if (currentDataset && currentDataset.id == id && currentDataset.reconstructions) {
        setReconstructions(currentDataset.reconstructions)
        setLoading(false)
      } else {
        try {
          setLoading(true)
          const data = await loadDataset(id)
          setReconstructions(data.reconstructions || [])
        } catch (err) {
          setError(err.message)
        } finally {
          setLoading(false)
        }
      }
    }
    loadData()
  }, [id, currentDataset, loadDataset])

  const toggleRow = (reconId) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(reconId)) next.delete(reconId)
      else next.add(reconId)
      return next
    })
  }

  const handleAction = async (reconId, action, notes = '') => {
    setActionLoading(reconId)
    try {
      if (action === 'accept') {
        await api.post(`/datasets/${id}/reconstructions/${reconId}/accept`, { notes })
      } else if (action === 'reject') {
        await api.post(`/datasets/${id}/reconstructions/${reconId}/reject`, { notes })
      } else if (action === 'override') {
        const newStatus = prompt('Enter new status (candidate/accepted/rejected/suspicious):', 'suspicious')
        if (newStatus) {
          await api.post(`/datasets/${id}/reconstructions/${reconId}/override`, { new_status: newStatus, notes })
        }
      }
      window.location.reload()
    } catch (err) {
      alert(`Failed to ${action}: ` + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash)
  }

  if (loading) {
    return (
      <div className="page-enter space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/dataset/${id}`)} className="btn btn-secondary">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)]">Loading reconstructions...</h1>
          </div>
        </div>
        <div className="card">
          <div className="skeleton h-64"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-enter space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/dataset/${id}`)} className="btn btn-secondary">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="card text-center py-16">
          <AlertTriangle className="w-16 h-16 text-[var(--accent-danger)] mx-auto mb-4" />
          <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-2">Failed to load reconstructions</h2>
          <p className="text-[var(--text-muted)] mb-6">{error}</p>
          <button onClick={() => navigate(`/dataset/${id}`)} className="btn btn-primary">Back to Dataset</button>
        </div>
      </div>
    )
  }

  if (reconstructions.length === 0) {
    return (
      <div className="page-enter animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/dataset/${id}`)} className="btn btn-secondary">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="font-display font-bold text-2xl text-[var(--text-primary)]">Reconstructions</h1>
              <p className="text-[var(--text-muted)] mt-1">No candidate files found</p>
            </div>
          </div>
        </div>
        <div className="card text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-[var(--accent-primary-dim)] flex items-center justify-center mx-auto mb-6">
            <Puzzle className="w-10 h-10 text-[var(--accent-primary)]" />
          </div>
          <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-2">No Reconstructions Found</h2>
          <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">The analysis did not produce any candidate file reconstructions from the current fragments.</p>
          <Link to={`/fragments/${id}`} className="btn btn-primary inline-flex">
            <FileText className="w-4 h-4 mr-2" />
            Analyze Fragments
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-enter animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/dataset/${id}`)} className="btn btn-secondary">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)]">Reconstructions</h1>
            <p className="text-[var(--text-muted)] mt-1">{reconstructions.length} candidate files reconstructed</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary group" disabled>
            <Download className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
            Export Report
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {reconstructions.map((recon) => (
          <div key={recon.id} className="card card-interactive group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300" style={{ background: recon.confidence_score >= 0.7 ? 'linear-gradient(90deg, var(--accent-primary-dim), transparent)' : recon.confidence_score >= 0.4 ? 'linear-gradient(90deg, var(--accent-warning-dim), transparent)' : 'linear-gradient(90deg, var(--accent-danger-dim), transparent)' }} />
            
            <div className="relative z-10 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <FileTypeIcon type={recon.file_type} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-display font-semibold text-lg text-[var(--text-primary)] truncate">{recon.name}</h3>
                      <span className="badge badge-info font-mono text-xs">{recon.file_type}</span>
                      <StatusBadge status={recon.status} />
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-sm text-[var(--text-muted)]">
                      <span className="flex items-center gap-1.5"><Puzzle className="w-4 h-4" /> <span className="font-display font-bold text-[var(--accent-primary)]">{recon.fragment_count}</span> fragments</span>
                      {recon.missing_fragments > 0 && <span className="flex items-center gap-1.5 text-[var(--accent-warning)]"><AlertTriangle className="w-4 h-4" /> <span className="font-display font-bold">{recon.missing_fragments}</span> missing</span>}
                      <span className="flex items-center gap-1.5"><Hash className="w-4 h-4" /> <span className="font-mono text-xs">{recon.integrity_hash?.slice(0, 16)}...</span></span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <ConfidenceBar score={recon.confidence_score} reasons={recon.confidence_reasons} breakdown={recon.confidence_breakdown} />
                  <IntegrityBadge status={recon.integrity_status} actualHash={recon.integrity_hash} expectedHash={recon.expected_hash} />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleRow(recon.id)} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors">
                    <ChevronDown className={clsx('w-5 h-5 transition-transform', expandedRows.has(recon.id) && 'rotate-180')} />
                  </button>
                </div>
              </div>

              {expandedRows.has(recon.id) && (
                <div className="relative z-10 pt-5 mt-5 border-t border-[var(--border-primary)] animate-slide-up">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-5">
                      <div>
                        <h4 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-[var(--accent-primary)]" />
                          Detailed Confidence Analysis
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {recon.confidence_breakdown && Object.entries(recon.confidence_breakdown).map(([key, value]) => (
                            <div key={key} className="glass rounded-xl p-4">
                              <p className="font-display font-bold text-[var(--accent-primary)] text-2xl">{(value * 100).toFixed(1)}%</p>
                              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-1">{key.replace(/_/g, ' ')}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                          <Puzzle className="w-5 h-5 text-[var(--accent-secondary)]" />
                          Fragments Used ({recon.fragments?.length || 0})
                        </h4>
                        <div className="table-container max-h-72 overflow-y-auto">
                          <table className="table">
                            <thead>
                              <tr>
                                <th className="w-12">#</th>
                                <th>Fragment ID</th>
                                <th>Type</th>
                                <th>Size</th>
                                <th>Entropy</th>
                                <th>Confidence</th>
                                <th className="w-24">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {recon.fragments?.map((f, idx) => (
                                <tr key={idx} className={f.is_missing ? 'bg-[var(--accent-danger-dim)]/30' : ''}>
                                  <td className="font-display font-bold text-[var(--accent-secondary)]">{idx + 1}</td>
                                  <td className={clsx('font-mono text-sm', f.is_missing && 'text-[var(--accent-danger)]')}>{f.fragment_id || 'MISSING FRAGMENT'}</td>
                                  <td>{f.file_type ? <span className="badge badge-info text-xs">{f.file_type}</span> : <span className="text-[var(--accent-danger)] text-sm">MISSING</span>}</td>
                                  <td className="font-mono text-sm">{f.size ? f.size.toLocaleString() + ' B' : 'N/A'}</td>
                                  <td className="font-mono text-sm">{f.entropy?.toFixed(2) || 'N/A'}</td>
                                  <td>{f.classification_confidence ? <ConfidenceBadge score={f.classification_confidence} /> : '-'}</td>
                                  <td>
                                    {f.is_missing ? (
                                      <span className="badge badge-danger flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Missing</span>
                                    ) : (
                                      <span className="badge badge-high flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Present</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="glass rounded-xl p-4">
                        <h4 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                          <Shield className="w-5 h-5 text-[var(--accent-primary)]" />
                          Integrity Verification
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">Actual Hash (SHA-256)</span>
                            <button onClick={() => copyHash(recon.integrity_hash)} className="font-mono text-xs text-[var(--accent-secondary)] hover:text-[var(--accent-primary)] transition-colors flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              {recon.integrity_hash?.slice(0, 32)}...
                            </button>
                          </div>
                          {recon.expected_hash && (
                            <div className="flex justify-between">
                              <span className="text-[var(--text-muted)]">Expected Hash</span>
                              <span className="font-mono text-xs">{recon.expected_hash.slice(0, 32)}...</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t border-[var(--border-primary)]">
                            <span className="font-medium text-[var(--text-primary)]">Match Status</span>
                            <span className={clsx('font-display font-bold', recon.integrity_status === 'verified' ? 'text-[var(--accent-primary)]' : 'text-[var(--accent-danger)]')}>
                              {recon.integrity_status === 'verified' ? '✓ Verified' : '✗ Mismatch'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="glass rounded-xl p-4">
                        <h4 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                          <Zap className="w-5 h-5 text-[var(--accent-warning)]" />
                          Investigator Actions
                        </h4>
                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => handleAction(recon.id, 'accept', 'Accepted by investigator')} 
                            className="btn btn-success w-full justify-center group"
                            disabled={actionLoading === recon.id || recon.status === 'accepted'}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" /> Accept Reconstruction
                          </button>
                          <button 
                            onClick={() => handleAction(recon.id, 'reject', 'Rejected by investigator')} 
                            className="btn btn-danger w-full justify-center group"
                            disabled={actionLoading === recon.id || recon.status === 'rejected'}
                          >
                            <XCircle className="w-4 h-4 mr-2" /> Reject Reconstruction
                          </button>
                          <button 
                            onClick={() => handleAction(recon.id, 'override')} 
                            className="btn btn-warning w-full justify-center group"
                            disabled={actionLoading === recon.id}
                          >
                            <Edit3 className="w-4 h-4 mr-2" /> Override Status
                          </button>
                          <button 
                            onClick={() => { const r = prompt('Mark as suspicious? Reason:'); if (r) handleAction(recon.id, 'override', r) }} 
                            className="btn btn-secondary w-full justify-center group"
                          >
                            <Flag className="w-4 h-4 mr-2" /> Flag for Review
                          </button>
                        </div>
                        {recon.investigator_notes && (
                          <div className="mt-4 p-3 glass rounded-lg border border-[var(--border-primary)]">
                            <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1">Investigator Notes</p>
                            <p className="text-[var(--text-secondary)] text-sm">{recon.investigator_notes}</p>
                          </div>
                        )}
                      </div>

                      {recon.overlaps_with && recon.overlaps_with.length > 0 && (
                        <div className="glass rounded-xl p-4 border border-[var(--accent-warning)]/30 bg-[var(--accent-warning-dim)]/20">
                          <h4 className="font-semibold text-[var(--accent-warning)] mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Overlapping Candidates
                          </h4>
                          <div className="space-y-2 text-sm">
                            {recon.overlaps_with.map((overlap, idx) => (
                              <div key={idx} className="p-2 glass rounded-lg">
                                <p className="text-[var(--text-secondary)]">Shares <span className="font-display font-bold text-[var(--accent-warning)]">{overlap.overlap_count}</span> fragments with reconstruction #{overlap.reconstruction_index}</p>
                                <p className="font-mono text-xs text-[var(--text-muted)]">Shared: {overlap.shared_fragments.join(', ')}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}