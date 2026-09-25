import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  ListChecks, 
  Filter, 
  Search,
  Download,
  Loader2,
  Clock,
  User,
  Hash,
  Copy,
  ChevronDown,
  ChevronUp,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit3,
  Flag,
  Database,
  FileText,
  Puzzle,
  GitBranch,
  Shield,
  Zap,
  Trash2,
  MoreHorizontal
} from 'lucide-react'
import { useDataset } from '../context/DatasetContext'
import api from '../utils/api'
import { clsx } from 'clsx'

const ACTION_CONFIG = {
  created: { color: 'blue', icon: Database, label: 'Dataset Created' },
  analyzed: { color: 'blue', icon: FileText, label: 'Fragment Analyzed' },
  classified: { color: 'purple', icon: Puzzle, label: 'Fragment Classified' },
  related: { color: 'indigo', icon: GitBranch, label: 'Relationship Found' },
  reconstructed: { color: 'green', icon: Puzzle, label: 'Reconstruction Built' },
  accepted: { color: 'green', icon: CheckCircle, label: 'Accepted' },
  rejected: { color: 'red', icon: XCircle, label: 'Rejected' },
  marked_suspicious: { color: 'amber', icon: Flag, label: 'Marked Suspicious' },
  overridden: { color: 'orange', icon: Edit3, label: 'Overridden' },
}

const COLOR_MAP = {
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  indigo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
}

const ICON_MAP = {
  Database, FileText, Puzzle, GitBranch, CheckCircle, XCircle, Flag, Edit3,
}

function ActionBadge({ action }) {
  const config = ACTION_CONFIG[action] || { color: 'slate', icon: Database, label: action }
  const Icon = ICON_MAP[config.icon.name] || Database
  return (
    <span className={clsx('badge flex items-center gap-1.5 px-2.5 py-1', COLOR_MAP[config.color] || COLOR_MAP.blue)}>
      <Icon className="w-3 h-3" />
      <span className="hidden sm:inline">{config.label}</span>
      <span className="sm:hidden">{action}</span>
    </span>
  )
}

function StatusBadge({ status }) {
  if (!status) return <span className="text-[var(--text-muted)] text-xs">—</span>
  return (
    <span className={clsx('badge px-2.5 py-1',
      status === 'accepted' || status === 'verified' && 'badge-high',
      status === 'rejected' || status === 'failed' && 'badge-danger',
      status === 'suspicious' || status === 'partial' && 'badge-warning',
      status === 'candidate' || status === 'unknown' && 'badge-info'
    )}>
      {status}
    </span>
  )
}

function LogRow({ log, index, expanded, onToggle, onCopyHash }) {
  const config = ACTION_CONFIG[log.action] || { color: 'slate', icon: Database }
  const Icon = ICON_MAP[config.icon.name] || Database

  return (
    <React.Fragment>
      <tr className={clsx('cursor-pointer transition-all duration-150 hover:bg-[var(--bg-tertiary)]/50', expanded && 'bg-[var(--bg-tertiary)]/30')} onClick={() => onToggle(index)}>
        <td className="w-10">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLOR_MAP[config.color].replace('20', '40')}` }}>
            <Icon className="w-4 h-4" style={{ color: COLOR_MAP[config.color].split(' ')[1] }} />
          </div>
        </td>
        <td className="font-mono text-xs text-[var(--text-secondary)] whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
        <td><ActionBadge action={log.action} /></td>
        <td>
          <div className="flex items-center gap-2">
            {log.fragment_id && (
              <span className="font-mono text-xs text-[var(--accent-primary)] bg-[var(--accent-primary-dim)] px-2 py-0.5 rounded">{log.fragment_id}</span>
            )}
            {log.reconstruction_id && (
              <span className="font-mono text-xs text-[var(--accent-secondary)] bg-[var(--accent-secondary-dim)] px-2 py-0.5 rounded">Recon #{log.reconstruction_id}</span>
            )}
            {!log.fragment_id && !log.reconstruction_id && (
              <span className="text-[var(--text-muted)] text-xs px-2 py-0.5 rounded bg-[var(--bg-tertiary)]">Dataset Level</span>
            )}
          </div>
        </td>
        <td>
          <div className="flex items-center gap-1.5">
            {log.previous_status && <StatusBadge status={log.previous_status} />}
            {log.previous_status && log.new_status && <span className="text-[var(--text-muted)]">→</span>}
            {log.new_status && <StatusBadge status={log.new_status} />}
          </div>
        </td>
        <td className="max-w-[300px] text-[var(--text-secondary)] text-sm truncate">{log.user_action || '—'}</td>
        <td>
          {log.hash_value && (
            <button 
              onClick={(e) => { e.stopPropagation(); onCopyHash(log.hash_value) }} 
              className="font-mono text-xs text-[var(--accent-secondary)] hover:text-[var(--accent-primary)] transition-colors flex items-center gap-1"
              title="Copy SHA-256"
            >
              <Hash className="w-3 h-3" />
              {log.hash_value.slice(0, 12)}...
            </button>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-[var(--bg-tertiary)]/30">
          <td colSpan={7} className="p-0">
            <div className="p-5 border-t border-[var(--border-primary)] animate-slide-up">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Action Details</p>
                  <div className="space-y-2">
                    <div className="glass rounded-lg p-3">
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Action</p>
                      <ActionBadge action={log.action} />
                    </div>
                    <div className="glass rounded-lg p-3">
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Timestamp</p>
                      <p className="font-mono text-[var(--text-primary)]">{new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="glass rounded-lg p-3">
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Previous Status</p>
                      {log.previous_status ? <StatusBadge status={log.previous_status} /> : <span className="text-[var(--text-muted)]">—</span>}
                    </div>
                    <div className="glass rounded-lg p-3">
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">New Status</p>
                      {log.new_status ? <StatusBadge status={log.new_status} /> : <span className="text-[var(--text-muted)]">—</span>}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">User Action</p>
                  <div className="glass rounded-lg p-3">
                    <p className="text-[var(--text-secondary)] whitespace-pre-wrap">{log.user_action || 'No details provided'}</p>
                  </div>
                </div>
                <div>
                  {log.details && (
                    <>
                      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Additional Data</p>
                      <div className="glass rounded-lg p-3 max-h-48 overflow-auto">
                        <pre className="text-[10px] font-mono text-[var(--text-secondary)]">{JSON.stringify(log.details, null, 2)}</pre>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  )
}

export function AuditLog() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentDataset, loadDataset } = useDataset()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' })

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/datasets/${id}/audit-log`)
        setLogs(response.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        if (search) {
          const s = search.toLowerCase()
          if (!log.fragment_id?.toLowerCase().includes(s) &&
              !log.user_action?.toLowerCase().includes(s) &&
              !log.action.toLowerCase().includes(s) &&
              !log.hash_value?.toLowerCase().includes(s)) {
            return false
          }
        }
        if (actionFilter !== 'all' && log.action !== actionFilter) return false
        return true
      })
      .sort((a, b) => {
        const aVal = a[sortConfig.key]
        const bVal = b[sortConfig.key]
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
  }, [logs, search, actionFilter, sortConfig])

  const actions = useMemo(() => [...new Set(logs.map(l => l.action))].sort(), [logs])

  const stats = useMemo(() => {
    const actionCounts = {}
    logs.forEach(l => { actionCounts[l.action] = (actionCounts[l.action] || 0) + 1 })
    return {
      total: logs.length,
      actions: Object.keys(actionCounts).length,
      actionCounts,
      investigators: new Set(logs.filter(l => l.user_action).map(l => l.user_action)).size,
    }
  }, [logs])

  const toggleRow = (index) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
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
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)]">Loading audit log...</h1>
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
          <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-2">Failed to load audit log</h2>
          <p className="text-[var(--text-muted)] mb-6">{error}</p>
          <button onClick={() => navigate(`/dataset/${id}`)} className="btn btn-primary">Back to Dataset</button>
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
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)]">Audit Log</h1>
            <p className="text-[var(--text-muted)] mt-1">{logs.length} entries • {stats.actions} action types</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 glass rounded-xl px-4 py-2">
            <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Entries</div>
            <div className="font-display font-bold text-[var(--accent-primary)]">{stats.total}</div>
          </div>
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
              placeholder="Search audit log by action, fragment, hash, or user action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-12"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="input select w-56"
          >
            <option value="all">All Actions</option>
            {actions.map(a => <option key={a} value={a}>{ACTION_CONFIG[a]?.label || a}</option>)}
          </select>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="w-10"></th>
                <th onClick={() => handleSort('timestamp')} className="cursor-pointer flex items-center gap-1">
                  Timestamp <ChevronDown className={clsx('w-4 h-4', sortConfig.key === 'timestamp' && sortConfig.direction === 'desc' && 'rotate-180')} />
                </th>
                <th onClick={() => handleSort('action')} className="cursor-pointer flex items-center gap-1">
                  Action <ChevronDown className={clsx('w-4 h-4', sortConfig.key === 'action' && sortConfig.direction === 'desc' && 'rotate-180')} />
                </th>
                <th>Target</th>
                <th>Status Change</th>
                <th>User Action</th>
                <th>Hash</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[var(--text-muted)]">
                    <div className="flex flex-col items-center gap-3">
                      <Search className="w-12 h-12 text-[var(--border-secondary)]" />
                      <p>No audit log entries match the current filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <LogRow
                    key={log.id}
                    log={log}
                    index={index}
                    expanded={expandedRows.has(index)}
                    onToggle={toggleRow}
                    onCopyHash={copyHash}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Summary */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Action Summary
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.actionCounts).sort(([,a], [,b]) => b - a).map(([action, count]) => {
            const config = ACTION_CONFIG[action] || { color: 'slate', label: action }
            const IconComponent = ICON_MAP[config.icon.name] || Database
            return (
              <div key={action} className="glass rounded-xl p-3 flex items-center gap-3 min-w-[180px]">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLOR_MAP[config.color].replace('20', '40')}` }}>
                  <IconComponent className="w-5 h-5" style={{ color: COLOR_MAP[config.color].split(' ')[1] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text-primary)] truncate">{config.label}</p>
                  <p className="text-[var(--text-muted)] text-xs">{count} {count === 1 ? 'entry' : 'entries'}</p>
                </div>
                <span className="font-display font-bold text-[var(--accent-primary)] text-lg">{count}</span>
              </div>
            )}
          )}
        </div>
      </div>
    </div>
  )
}