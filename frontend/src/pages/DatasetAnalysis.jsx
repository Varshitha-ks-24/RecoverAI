import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Database, 
  FileText, 
  Puzzle, 
  GitBranch, 
  ListChecks,
  RefreshCw,
  Download,
  Trash2,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
  BarChart3,
  ExternalLink,
  MoreHorizontal,
  Eye,
  Edit3,
  Copy,
  Hash,
  Flag,
  XCircle,
  HelpCircle,
  ChevronRight
} from 'lucide-react'
import { useDataset } from '../context/DatasetContext'
import api from '../utils/api'
import { clsx } from 'clsx'

const FILE_TYPE_CONFIG = {
  JPEG: { color: 'purple', icon: 'JPG' },
  PNG: { color: 'blue', icon: 'PNG' },
  PDF: { color: 'red', icon: 'PDF' },
  DOCX: { color: 'blue', icon: 'DOCX' },
  ZIP: { color: 'amber', icon: 'ZIP' },
  TXT: { color: 'green', icon: 'TXT' },
  HTML: { color: 'orange', icon: 'HTML' },
  ENCRYPTED: { color: 'red', icon: 'ENC' },
  UNKNOWN: { color: 'slate', icon: '???' },
}

const COLOR_MAP = {
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  slate: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

function StatCard({ title, value, icon: Icon, color, description, trend, onClick }) {
  const colors = {
    primary: 'from-[var(--accent-secondary)] to-[var(--accent-primary)]',
    success: 'from-[var(--accent-primary)] to-[var(--accent-secondary)]',
    warning: 'from-[var(--accent-warning)] to-[#ffcc00]',
    danger: 'from-[var(--accent-danger)] to-[#ff6b7a]',
    purple: 'from-[var(--accent-purple)] to-[#c084fc]',
  }

  return (
    <div className={clsx('stat-card card-interactive group relative', `stat-card-${color}`)} onClick={onClick}>
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300" style={{ background: colors[color] }} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{title}</p>
            <p className="font-display font-bold text-3xl text-[var(--text-primary)] mt-1">{value}</p>
            {description && <p className="text-[11px] text-[var(--text-muted)] mt-1">{description}</p>}
          </div>
          <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', `bg-[var(--accent-${color}-dim)]`)} style={{ background: `linear-gradient(135deg, ${color === 'primary' ? 'var(--accent-secondary)' : color === 'success' ? 'var(--accent-primary)' : color === 'warning' ? 'var(--accent-warning)' : color === 'danger' ? 'var(--accent-danger)' : 'var(--accent-purple)'}20, transparent)` }}>
            <Icon className={clsx('w-6 h-6', `text-[var(--accent-${color})]`)} />
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1.5 text-[var(--accent-primary)] text-sm font-medium">
            <Zap className="w-4 h-4" />
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function ConfidenceBar({ score, label, color }) {
  const colors = {
    success: 'confidence-high',
    warning: 'confidence-medium',
    danger: 'confidence-low',
    info: 'confidence-high',
  }
  return (
    <div className="flex items-center gap-3 min-w-[160px]">
      <div className="confidence-bar flex-1 max-w-xs">
        <div className={clsx('confidence-fill', colors[color] || 'confidence-high')} style={{ width: `${score * 100}%` }} />
      </div>
      <span className="font-display font-bold text-[var(--text-primary)] font-mono whitespace-nowrap">{(score * 100).toFixed(1)}%</span>
      <span className={clsx('badge px-2.5 py-1 font-medium text-xs', 
        score >= 0.7 && 'badge-high',
        score >= 0.4 && score < 0.7 && 'badge-medium',
        score < 0.4 && 'badge-low'
      )}>
        {label}
      </span>
    </div>
  )
}

function FileTypeBadge({ type }) {
  const config = FILE_TYPE_CONFIG[type] || FILE_TYPE_CONFIG.UNKNOWN
  return (
    <span className={clsx('badge flex items-center gap-1.5 px-2.5 py-1', COLOR_MAP[config.color] || COLOR_MAP.slate)}>
      <span className="font-mono text-xs">{config.icon}</span>
      <span className="hidden sm:inline">{type}</span>
    </span>
  )
}

function StatusBadge({ status }) {
  const config = {
    candidate: { class: 'badge-info', label: 'Candidate' },
    accepted: { class: 'badge-high', label: 'Accepted' },
    rejected: { class: 'badge-danger', label: 'Rejected' },
    suspicious: { class: 'badge-warning', label: 'Suspicious' },
  }
  const c = config[status] || config.candidate
  return <span className={clsx('badge px-3 py-1 font-medium', c.class)}>{c.label}</span>
}

function IntegrityBadge({ status, actualHash, expectedHash }) {
  const config = {
    verified: { class: 'badge-high', icon: CheckCircle, color: 'accent-primary' },
    partial: { class: 'badge-medium', icon: AlertTriangle, color: 'accent-warning' },
    failed: { class: 'badge-danger', icon: XCircle, color: 'accent-danger' },
    unknown: { class: 'badge-info', icon: HelpCircle, color: 'accent-secondary' },
  }
  const c = config[status] || config.unknown
  const Icon = c.icon
  return (
    <div className="flex flex-col gap-1.5">
      <span className={clsx('badge px-3 py-1.5 font-medium flex items-center gap-1.5', c.class)}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
      {actualHash && (
        <button onClick={() => navigator.clipboard.writeText(actualHash)} className="font-mono text-xs text-[var(--accent-secondary)] hover:text-[var(--accent-primary)] transition-colors flex items-center gap-1">
          <Hash className="w-3 h-3" />
          {actualHash.slice(0, 24)}...
        </button>
      )}
      {expectedHash && expectedHash !== actualHash && (
        <div className="flex items-center gap-1.5 p-2 glass rounded-lg bg-[var(--accent-danger-dim)]">
          <AlertTriangle className="w-4 h-4 text-[var(--accent-danger)]" />
          <span className="text-sm text-[var(--accent-danger)]">Hash mismatch</span>
        </div>
      )}
    </div>
  )
}

export function DatasetAnalysis() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentDataset, loadDataset, fetchDatasets, datasets } = useDataset()
  const [dataset, setDataset] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    fragments: true,
    reconstructions: true,
  })

  useEffect(() => {
    const loadData = async () => {
      if (currentDataset && currentDataset.id == id) {
        setDataset(currentDataset)
        setLoading(false)
      } else {
        try {
          setLoading(true)
          const data = await loadDataset(id)
          setDataset(data)
        } catch (err) {
          setError(err.message)
        } finally {
          setLoading(false)
        }
      }
    }
    loadData()
  }, [id, currentDataset, loadDataset])

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) return
    try {
      await api.delete(`/datasets/${id}`)
      fetchDatasets()
      navigate('/')
    } catch (err) {
      alert('Failed to delete dataset: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="page-enter space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)]">Loading dataset...</h1>
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
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="card text-center py-16">
          <AlertTriangle className="w-16 h-16 text-[var(--accent-danger)] mx-auto mb-4" />
          <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-2">Failed to load dataset</h2>
          <p className="text-[var(--text-muted)] mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">Back to Dashboard</button>
        </div>
      </div>
    )
  }

  if (!dataset) return null

  const fragments = dataset.fragments || []
  const reconstructions = dataset.reconstructions || []
  
  const fileTypes = fragments.reduce((acc, f) => {
    acc[f.file_type] = (acc[f.file_type] || 0) + 1
    return acc
  }, {})
  
  const duplicates = fragments.filter(f => f.is_duplicate).length
  const suspicious = fragments.filter(f => f.status === 'suspicious').length
  const corrupted = fragments.filter(f => 
    f.suspicious_indicators?.some(i => ['high_entropy', 'magic_mismatch', 'encrypted_content'].includes(i.type))
  ).length

  const confidenceStats = reconstructions.reduce((acc, r) => {
    if (r.confidence_score >= 0.7) acc.high++
    else if (r.confidence_score >= 0.4) acc.medium++
    else acc.low++
    return acc
  }, { high: 0, medium: 0, low: 0 })

  const integrityStats = reconstructions.reduce((acc, r) => {
    const status = r.integrity_status || 'unknown'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="page-enter animate-fade-in space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div className="flex items-start gap-4 min-w-0 lg:flex-1">
          <button onClick={() => navigate('/')} className="btn btn-secondary p-2">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] truncate">{dataset.name}</h1>
            <p className="text-[var(--text-muted)] mt-1 break-words">{dataset.description || 'No description provided'}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-[32rem] shrink-0">
          <Link to={`/fragments/${id}`} className="btn btn-secondary group min-w-0 whitespace-nowrap">
            <FileText className="w-4 h-4 mr-2" /> Fragments
          </Link>
          <Link to={`/reconstructions/${id}`} className="btn btn-primary group min-w-0 whitespace-nowrap">
            <Puzzle className="w-4 h-4 mr-2" /> Reconstructions
          </Link>
          <Link to={`/graph/${id}`} className="btn btn-secondary group min-w-0 whitespace-nowrap">
            <GitBranch className="w-4 h-4 mr-2" /> Evidence Graph
          </Link>
          <Link to={`/audit/${id}`} className="btn btn-secondary group min-w-0 whitespace-nowrap">
            <ListChecks className="w-4 h-4 mr-2" /> Audit Log
          </Link>
          <button onClick={handleDelete} className="btn btn-danger group min-w-0 whitespace-nowrap">
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Fragments"
          value={fragments.length}
          icon={FileText}
          color="secondary"
          description="Analyzed"
          onClick={() => navigate(`/fragments/${id}`)}
        />
        <StatCard
          title="Reconstructions"
          value={reconstructions.length}
          icon={Puzzle}
          color="warning"
          description={confidenceStats.high + ' high confidence'}
          onClick={() => navigate(`/reconstructions/${id}`)}
        />
        <StatCard
          title="Corrupted"
          value={corrupted}
          icon={AlertTriangle}
          color="danger"
          description="Flagged items"
        />
        <StatCard
          title="Duplicates"
          value={duplicates}
          icon={Copy}
          color="purple"
          description="SHA-256 matches"
        />
        <StatCard
          title="Suspicious"
          value={suspicious}
          icon={Flag}
          color="warning"
          description="Needs review"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section>
            <button onClick={() => toggleSection('overview')} className="w-full card-header">
              <h2 className="card-title flex items-center gap-2">
                <Info className="w-5 h-5" />
                Dataset Overview
              </h2>
              <span className={clsx('text-[var(--text-muted)] transition-transform', expandedSections.overview && 'rotate-180')}>
                <ChevronDown className="w-5 h-5" />
              </span>
            </button>
            {expandedSections.overview && (
              <div className="card mt-2 animate-slide-up space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</p>
                    <p className="font-medium text-[var(--text-primary)] capitalize mt-1">{dataset.status}</p>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Created</p>
                    <p className="font-mono text-[var(--text-primary)] text-sm mt-1">{new Date(dataset.created_at).toLocaleString()}</p>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">File Types</p>
                    <p className="font-display font-bold text-[var(--accent-secondary)] text-2xl mt-1">{Object.keys(fileTypes).length}</p>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">High Confidence</p>
                    <p className="font-display font-bold text-[var(--accent-primary)] text-2xl mt-1">{confidenceStats.high}</p>
                  </div>
                </div>
                <div className="border-t border-[var(--border-primary)] pt-5">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-[var(--accent-secondary)]" />
                    File Type Breakdown
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(fileTypes).map(([type, count]) => {
                      const config = FILE_TYPE_CONFIG[type] || FILE_TYPE_CONFIG.UNKNOWN
                      return (
                        <div key={type} className={clsx('badge px-3 py-1.5 flex items-center gap-2', COLOR_MAP[config.color] || COLOR_MAP.slate)}>
                          <span className="font-mono text-xs">{config.icon}</span>
                          <span className="font-medium">{type}</span>
                          <span className="font-display font-bold text-[var(--text-primary)]">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section>
            <button onClick={() => toggleSection('reconstructions')} className="w-full card-header">
              <h2 className="card-title flex items-center gap-2">
                <Puzzle className="w-5 h-5" />
                Reconstructions ({reconstructions.length})
              </h2>
              <span className={clsx('text-[var(--text-muted)] transition-transform', expandedSections.reconstructions && 'rotate-180')}>
                <ChevronDown className="w-5 h-5" />
              </span>
            </button>
            {expandedSections.reconstructions && (
              <div className="card mt-2 animate-slide-up">
                {reconstructions.length === 0 ? (
                  <div className="text-center py-12">
                    <Puzzle className="w-16 h-16 text-[var(--border-secondary)] mx-auto mb-4" />
                    <p className="text-[var(--text-muted)]">No reconstructions found</p>
                    <Link to={`/fragments/${id}`} className="btn btn-primary inline-flex mt-4">
                      <FileText className="w-4 h-4 mr-2" />
                      Analyze Fragments
                    </Link>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Type</th>
                          <th>Fragments</th>
                          <th>Missing</th>
                          <th>Confidence</th>
                          <th>Integrity</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {reconstructions.map((recon) => (
                          <tr key={recon.id}>
                            <td className="font-mono text-sm text-[var(--text-primary)]">{recon.name}</td>
                            <td><FileTypeBadge type={recon.file_type} /></td>
                            <td><span className="font-display font-bold text-[var(--accent-secondary)]">{recon.fragment_count}</span></td>
                            <td>{recon.missing_fragments > 0 ? <span className="badge badge-warning">{recon.missing_fragments}</span> : <span className="badge badge-high">0</span>}</td>
                            <td>
                              <ConfidenceBar score={recon.confidence_score} label={recon.confidence_score >= 0.7 ? 'High' : recon.confidence_score >= 0.4 ? 'Med' : 'Low'} color={recon.confidence_score >= 0.7 ? 'success' : recon.confidence_score >= 0.4 ? 'warning' : 'danger'} />
                            </td>
                            <td><IntegrityBadge status={recon.integrity_status} actualHash={recon.integrity_hash} expectedHash={recon.expected_hash} /></td>
                            <td><StatusBadge status={recon.status} /></td>
                            <td>
                              <Link to={`/reconstructions/${id}/${recon.id}`} className="text-[var(--accent-secondary)] hover:text-[var(--accent-primary)] text-sm font-medium flex items-center gap-1">
                                Details <ChevronRight className="w-3 h-3" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Quick Actions
              </h3>
            </div>
            <div className="space-y-2">
              <Link to={`/fragments/${id}`} className="btn btn-secondary inline-flex items-center w-full min-h-11 justify-start group whitespace-nowrap">
                <FileText className="w-4 h-4 mr-2" />
                <span>Analyze Fragments</span>
              </Link>
              <Link to={`/reconstructions/${id}`} className="btn btn-primary inline-flex items-center w-full min-h-11 justify-start group whitespace-nowrap">
                <Puzzle className="w-4 h-4 mr-2" />
                <span>Review Reconstructions</span>
              </Link>
              <Link to={`/graph/${id}`} className="btn btn-secondary inline-flex items-center w-full min-h-11 justify-start group whitespace-nowrap">
                <GitBranch className="w-4 h-4 mr-2" />
                <span>View Evidence Graph</span>
              </Link>
              <Link to={`/audit/${id}`} className="btn btn-secondary inline-flex items-center w-full min-h-11 justify-start group whitespace-nowrap">
                <ListChecks className="w-4 h-4 mr-2" />
                <span>View Audit Log</span>
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <Shield className="w-5 h-5" />
                System Status
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 glass rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                  <span className="font-medium text-[var(--text-primary)]">API Server</span>
                </div>
                <span className="badge badge-high">Online</span>
              </div>
              <div className="flex items-center justify-between p-3 glass rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                  <span className="font-medium text-[var(--text-primary)]">Database</span>
                </div>
                <span className="badge badge-high">Connected</span>
              </div>
              <div className="flex items-center justify-between p-3 glass rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent-warning)] animate-pulse" />
                  <span className="font-medium text-[var(--text-primary)]">ML Classifier</span>
                </div>
                <span className="badge badge-warning">Heuristic Mode</span>
              </div>
              <div className="flex items-center justify-between p-3 glass rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                  <span className="font-medium text-[var(--text-primary)]">Storage</span>
                </div>
                <span className="badge badge-info">SQLite</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <ExternalLink className="w-5 h-5" />
                Export Options
              </h3>
            </div>
            <div className="space-y-2">
              <button className="btn btn-secondary w-full justify-start group" disabled>
                <Download className="w-4 h-4 mr-2" />
                <span>Export Fragments (JSON)</span>
              </button>
              <button className="btn btn-secondary w-full justify-start group" disabled>
                <Download className="w-4 h-4 mr-2" />
                <span>Export Reconstructions (JSON)</span>
              </button>
              <button className="btn btn-secondary w-full justify-start group" disabled>
                <Download className="w-4 h-4 mr-2" />
                <span>Export Audit Log (CSV)</span>
              </button>
              <button className="btn btn-secondary w-full justify-start group" disabled>
                <Download className="w-4 h-4 mr-2" />
                <span>Full Evidence Package</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}