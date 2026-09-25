import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  FileText, 
  AlertTriangle, 
  Copy, 
  Hash,
  ChevronDown,
  ChevronUp,
  Eye,
  Flag,
  Download,
  Loader2,
  Database,
  Zap,
  Shield,
  CheckCircle,
  X,
  MoreHorizontal,
  HelpCircle
} from 'lucide-react'
import { useDataset } from '../context/DatasetContext'
import api from '../utils/api'
import { clsx } from 'clsx'

const FILE_TYPE_CONFIG = {
  JPEG: { color: 'purple', icon: FileText, label: 'JPEG Image' },
  PNG: { color: 'blue', icon: FileText, label: 'PNG Image' },
  PDF: { color: 'red', icon: FileText, label: 'PDF Document' },
  DOCX: { color: 'blue', icon: FileText, label: 'DOCX Document' },
  ZIP: { color: 'amber', icon: FileText, label: 'ZIP Archive' },
  TXT: { color: 'green', icon: FileText, label: 'Text File' },
  HTML: { color: 'orange', icon: FileText, label: 'HTML Document' },
  ENCRYPTED: { color: 'red', icon: Shield, label: 'Encrypted Data' },
  UNKNOWN: { color: 'slate', icon: HelpCircle, label: 'Unknown' },
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

function ConfidenceBadge({ score }) {
  if (score >= 0.7) return <span className="badge badge-high">High {(score * 100).toFixed(0)}%</span>
  if (score >= 0.4) return <span className="badge badge-medium">Medium {(score * 100).toFixed(0)}%</span>
  return <span className="badge badge-low">Low {(score * 100).toFixed(0)}%</span>
}

function FileTypeBadge({ type }) {
  const config = FILE_TYPE_CONFIG[type] || FILE_TYPE_CONFIG.UNKNOWN
  const Icon = config.icon
  return (
    <span className={clsx('badge flex items-center gap-1.5 px-2.5 py-1', COLOR_MAP[config.color] || COLOR_MAP.slate)}>
      <Icon className="w-3 h-3" />
      {type}
    </span>
  )
}

function SuspiciousIndicators({ indicators }) {
  if (!indicators || indicators.length === 0) return null
  
  return (
    <div className="mt-3 pt-3 border-t border-[var(--border-primary)] space-y-2">
      <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Suspicious Indicators</p>
      {indicators.map((ind, idx) => (
        <div key={idx} className={clsx('flex items-center gap-2 p-2.5 rounded-lg text-xs', 
          ind.severity === 'high' && 'bg-[var(--accent-danger-dim)] text-[var(--accent-danger)] border border-[var(--accent-danger)]/30',
          ind.severity === 'medium' && 'bg-[var(--accent-warning-dim)] text-[var(--accent-warning)] border border-[var(--accent-warning)]/30',
          ind.severity === 'low' && 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border-primary)]'
        )}>
          <span className="font-mono font-medium">{ind.type.replace(/_/g, ' ')}</span>
          <span className="flex-1">{ind.description}</span>
          {ind.value !== undefined && (
            <span className="font-mono text-[var(--text-secondary)]">{typeof ind.value === 'number' ? ind.value.toFixed(2) : ind.value}</span>
          )}
        </div>
      ))}
    </div>
  )
}

function FragmentRow({ fragment, expanded, onToggle, onView, onFlag, onCopyHash }) {
  const config = FILE_TYPE_CONFIG[fragment.file_type] || FILE_TYPE_CONFIG.UNKNOWN
  const hasHighSeverity = fragment.suspicious_indicators?.some(i => i.severity === 'high')
  const hasMediumSeverity = fragment.suspicious_indicators?.some(i => i.severity === 'medium')

  return (
    <React.Fragment>
      <tr className={clsx('cursor-pointer transition-all duration-150', expanded && 'bg-[var(--bg-tertiary)]/50')} onClick={onToggle}>
        <td className="w-10">
          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold', `bg-[var(--accent-${config.color}-dim)] text-[var(--accent-${config.color})]`)}>{fragment.fragment_id.slice(-4)}</div>
        </td>
        <td className="font-mono text-sm text-[var(--text-primary)]">{fragment.fragment_id}</td>
        <td><FileTypeBadge type={fragment.file_type} /></td>
        <td className="font-mono text-sm text-[var(--text-secondary)]">{fragment.size.toLocaleString()} B</td>
        <td className="font-mono text-sm">
          <span className={clsx('px-2 py-0.5 rounded font-mono text-xs', fragment.entropy > 7 ? 'bg-[var(--accent-danger-dim)] text-[var(--accent-danger)]' : 'text-[var(--text-secondary)]')}>
            {fragment.entropy?.toFixed(2) || 'N/A'}
          </span>
        </td>
        <td><ConfidenceBadge score={fragment.classification_confidence || 0} /></td>
        <td className="font-mono text-xs max-w-[140px] truncate">
          <button onClick={(e) => { e.stopPropagation(); onCopyHash(fragment.sha256_hash) }} className="flex items-center gap-1 hover:text-[var(--accent-primary)] transition-colors" title="Copy SHA-256">
            <Hash className="w-3 h-3" />
            {fragment.sha256_hash.slice(0, 16)}...
          </button>
        </td>
        <td>
          <span className={clsx('badge',
            fragment.status === 'analyzed' && 'badge-high',
            fragment.status === 'suspicious' && 'badge-warning',
            fragment.status === 'ignored' && 'badge-low'
          )}>
            {fragment.status}
          </span>
        </td>
        <td>
          <div className="flex items-center gap-1">
            {fragment.is_duplicate && (
              <span className="badge badge-info flex items-center gap-1" title="Duplicate fragment">
                <Copy className="w-3 h-3" />
              </span>
            )}
            {hasHighSeverity && <span className="badge badge-danger" title="High severity indicator"><AlertTriangle className="w-3 h-3" /></span>}
            {hasMediumSeverity && !hasHighSeverity && <span className="badge badge-warning" title="Medium severity indicator"><Zap className="w-3 h-3" /></span>}
            {fragment.classification_method === 'ml' && <span className="badge badge-purple" title="ML classified"><Zap className="w-3 h-3" /></span>}
          </div>
        </td>
        <td className="w-32">
          <div className="flex items-center justify-end gap-1">
            <button onClick={(e) => { e.stopPropagation(); onView() }} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-tertiary)] transition-colors" title="View Details">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onFlag() }} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-warning)] hover:bg-[var(--accent-warning-dim)] transition-colors" title="Mark Suspicious">
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-[var(--bg-tertiary)]/30">
          <td colSpan={11} className="p-0">
            <div className="p-5 border-t border-[var(--border-primary)] animate-slide-up">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="glass rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Original Offset</p>
                      <p className="font-mono text-[var(--text-primary)]">{fragment.original_offset || 'N/A'}</p>
                    </div>
                    <div className="glass rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Printable Ratio</p>
                      <p className="font-mono text-[var(--text-primary)]">{(fragment.printable_ratio * 100).toFixed(1)}%</p>
                    </div>
                    <div className="glass rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Magic Bytes</p>
                      <p className="font-mono text-xs text-[var(--text-secondary)] truncate">{fragment.magic_bytes || 'None detected'}</p>
                    </div>
                    <div className="glass rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Classification</p>
                      <p className="font-medium text-[var(--text-primary)] capitalize">{fragment.classification_method}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Null Byte Ratio</p>
                      <p className="font-mono text-[var(--text-primary)]">{fragment.features?.null_byte_ratio ? (fragment.features.null_byte_ratio * 100).toFixed(1) + '%' : 'N/A'}</p>
                    </div>
                    <div className="glass rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">High Byte Ratio</p>
                      <p className="font-mono text-[var(--text-primary)]">{fragment.features?.high_byte_ratio ? (fragment.features.high_byte_ratio * 100).toFixed(1) + '%' : 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <SuspiciousIndicators indicators={fragment.suspicious_indicators} />
                </div>
                <div className="glass rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Byte Frequency (Top 10)</p>
                  <div className="space-y-1.5">
                    {fragment.features?.byte_frequency && (
                      Object.entries(fragment.features.byte_frequency)
                        .filter(([,v]) => v > 0)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 10)
                        .map(([byte, freq]) => (
                          <div key={byte} className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[var(--text-muted)] w-10">0x{parseInt(byte).toString(16).padStart(2, '0').toUpperCase()}</span>
                            <div className="flex-1 h-2 bg-[var(--bg-secondary)] rounded overflow-hidden">
                              <div className="h-full bg-[var(--accent-primary)] rounded" style={{ width: `${Math.min(freq * 100, 100)}%` }} />
                            </div>
                            <span className="font-mono text-xs text-[var(--text-secondary)] w-14 text-right">{(freq * 100).toFixed(1)}%</span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  )
}

export function Fragments() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentDataset, loadDataset } = useDataset()
  const [fragments, setFragments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortConfig, setSortConfig] = useState({ key: 'fragment_id', direction: 'asc' })
  const [expandedRows, setExpandedRows] = useState(new Set())

  useEffect(() => {
    const loadData = async () => {
      if (currentDataset && currentDataset.id == id && currentDataset.fragments) {
        setFragments(currentDataset.fragments)
        setLoading(false)
      } else {
        try {
          setLoading(true)
          const data = await loadDataset(id)
          setFragments(data.fragments || [])
        } catch (err) {
          setError(err.message)
        } finally {
          setLoading(false)
        }
      }
    }
    loadData()
  }, [id, currentDataset, loadDataset])

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const filteredFragments = useMemo(() => {
    let result = [...fragments]
    
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(f => 
        f.fragment_id.toLowerCase().includes(s) ||
        f.file_type.toLowerCase().includes(s) ||
        f.sha256_hash.toLowerCase().includes(s)
      )
    }
    
    if (typeFilter !== 'all') {
      result = result.filter(f => f.file_type === typeFilter)
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(f => f.status === statusFilter)
    }
    
    result.sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    
    return result
  }, [fragments, search, typeFilter, statusFilter, sortConfig])

  const fileTypes = useMemo(() => [...new Set(fragments.map(f => f.file_type))].sort(), [fragments])

  const toggleRow = (fragmentId) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(fragmentId)) next.delete(fragmentId)
      else next.add(fragmentId)
      return next
    })
  }

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash)
    // Could add toast notification here
  }

  const markSuspicious = async (fragmentId) => {
    try {
      await api.post(`/datasets/${id}/fragments/${fragmentId}/mark-suspicious`, { reason: 'Marked by investigator' })
      window.location.reload()
    } catch (err) {
      alert('Failed to mark fragment: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="page-enter space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/dataset/${id}`)} className="btn btn-secondary">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)]">Loading fragments...</h1>
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
          <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-2">Failed to load fragments</h2>
          <p className="text-[var(--text-muted)] mb-6">{error}</p>
          <button onClick={() => navigate(`/dataset/${id}`)} className="btn btn-primary">Back to Dataset</button>
        </div>
      </div>
    )
  }

  const typeCounts = useMemo(() => {
    const counts = {}
    fragments.forEach(f => { counts[f.file_type] = (counts[f.file_type] || 0) + 1 })
    return counts
  }, [fragments])

  return (
    <div className="page-enter animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/dataset/${id}`)} className="btn btn-secondary">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)]">Fragments Analysis</h1>
            <p className="text-[var(--text-muted)] mt-1">
              {filteredFragments.length} of {fragments.length} fragments • 
              {Object.keys(typeCounts).length} file types • 
              {fragments.filter(f => f.is_duplicate).length} duplicates
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary group" disabled>
            <Download className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 mb-5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search fragments by ID, type, or hash..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-12"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input select w-48"
            >
              <option value="all">All Types</option>
              {fileTypes.map(t => <option key={t} value={t}>{t} ({typeCounts[t]})</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input select w-40"
            >
              <option value="all">All Status</option>
              <option value="analyzed">Analyzed</option>
              <option value="suspicious">Suspicious</option>
              <option value="ignored">Ignored</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="w-10"></th>
                <th onClick={() => handleSort('fragment_id')} className="cursor-pointer flex items-center gap-1">
                  Fragment ID <ChevronDown className={clsx('w-4 h-4', sortConfig.key === 'fragment_id' && sortConfig.direction === 'desc' && 'rotate-180')} />
                </th>
                <th onClick={() => handleSort('file_type')} className="cursor-pointer flex items-center gap-1">
                  Type <ChevronDown className={clsx('w-4 h-4', sortConfig.key === 'file_type' && sortConfig.direction === 'desc' && 'rotate-180')} />
                </th>
                <th onClick={() => handleSort('size')} className="cursor-pointer flex items-center gap-1">
                  Size <ChevronDown className={clsx('w-4 h-4', sortConfig.key === 'size' && sortConfig.direction === 'desc' && 'rotate-180')} />
                </th>
                <th onClick={() => handleSort('entropy')} className="cursor-pointer flex items-center gap-1">
                  Entropy <ChevronDown className={clsx('w-4 h-4', sortConfig.key === 'entropy' && sortConfig.direction === 'desc' && 'rotate-180')} />
                </th>
                <th onClick={() => handleSort('classification_confidence')} className="cursor-pointer flex items-center gap-1">
                  Confidence <ChevronDown className={clsx('w-4 h-4', sortConfig.key === 'classification_confidence' && sortConfig.direction === 'desc' && 'rotate-180')} />
                </th>
                <th>SHA-256 Hash</th>
                <th>Status</th>
                <th>Flags</th>
                <th className="w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFragments.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-16 text-[var(--text-muted)]">
                    <div className="flex flex-col items-center gap-3">
                      <Search className="w-12 h-12 text-[var(--border-secondary)]" />
                      <p>No fragments match the current filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFragments.map((fragment) => (
                  <FragmentRow
                    key={fragment.fragment_id}
                    fragment={fragment}
                    expanded={expandedRows.has(fragment.fragment_id)}
                    onToggle={() => toggleRow(fragment.fragment_id)}
                    onView={() => navigate(`/fragments/${id}/${fragment.fragment_id}`)}
                    onFlag={() => markSuspicious(fragment.fragment_id)}
                    onCopyHash={copyHash}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}