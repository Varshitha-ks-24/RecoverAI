import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Database, 
  FileText, 
  Puzzle, 
  AlertTriangle, 
  Copy, 
  CheckCircle,
  XCircle,
  HelpCircle,
  Plus,
  RefreshCw,
  TrendingUp,
  Activity,
  Zap,
  Shield,
  Search,
  BarChart3,
  PieChart,
  ExternalLink,
  ChevronRight,
  Brain,
  GitBranch,
  MessageCircle,
  Send,
  Trash2,
  Loader2,
  FolderOpen
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts'
import api from '../utils/api'
import { useDataset } from '../context/DatasetContext'
import { clsx } from 'clsx'

const COLORS = {
  primary: '#00d4aa',
  secondary: '#0099ff',
  warning: '#ffb800',
  danger: '#ff4757',
  purple: '#a855f7',
  info: '#00ccff',
}

const CHART_COLORS = ['#00d4aa', '#0099ff', '#ffb800', '#ff4757', '#a855f7', '#00ccff']

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function StatCard({ title, value, icon: Icon, trend, color, onClick, description, sparkline }) {
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
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{title}</p>
            <p className="font-display font-bold text-3xl text-[var(--text-primary)] mt-1">{value}</p>
            {description && <p className="text-[11px] text-[var(--text-muted)] mt-1">{description}</p>}
          </div>
          <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', `bg-[${color}]-dim`)} style={{ background: `linear-gradient(135deg, ${COLORS[color]}20, ${COLORS[color]}10)` }}>
            <Icon className={clsx('w-6 h-6', `text-[${color}]`)} />
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1.5 text-[var(--accent-primary)] text-sm font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>{trend}</span>
          </div>
        )}
        {sparkline && (
          <div className="mt-4 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkline} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`color-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[color]} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={COLORS[color]} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke={COLORS[color]} strokeWidth={2} fillOpacity={1} fill={`url(#color-${color})`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

function ConfidenceChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="card h-64 flex items-center justify-center">
        <div className="text-center">
          <RechartsPieChart className="w-12 h-12 text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-muted)]">No confidence data available</p>
        </div>
      </div>
    )
  }

  const chartData = Object.entries(data).map(([name, value], index) => ({ 
    name: name.charAt(0).toUpperCase() + name.slice(1), 
    value, 
    color: CHART_COLORS[index % CHART_COLORS.length]
  }))
    const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title flex items-center gap-2">
          <RechartsPieChart className="w-5 h-5" />
          Confidence Distribution
        </h3>
      </div>
      <div className="h-64 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
              labelLine={false}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [value, 'Reconstructions']} 
              contentStyle={{ 
                backgroundColor: 'var(--bg-card)', 
                border: '1px solid var(--border-secondary)', 
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
              }} 
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-3 mt-5 justify-center">
        {chartData.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2 px-3 py-1.5 glass rounded-full">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-sm font-medium text-[var(--text-primary)]">{item.name}</span>
            <span className="font-display font-bold text-[var(--text-secondary)]">{item.value}</span>
              <span className="text-xs text-[var(--accent-primary)] font-semibold">
                {total > 0 ? `${((item.value / total) * 100).toFixed(0)}%` : '0%'}
              </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FileTypeChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="card h-64 flex items-center justify-center">
        <div className="text-center">
          <Database className="w-12 h-12 text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-muted)]">No file type data available</p>
        </div>
      </div>
    )
  }

  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }))

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title flex items-center gap-2">
          <Database className="w-5 h-5" />
          File Type Distribution
        </h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="var(--border-primary)" vertical={false} />
            <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border-primary)' }} tickLine={{ stroke: 'var(--border-primary)' }} />
            <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-card)', 
                border: '1px solid var(--border-secondary)', 
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
              }} 
              formatter={(value) => [value, 'Fragments']}
              labelStyle={{ color: 'var(--text-primary)' }}
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="var(--accent-primary)" maxBarSize={28} >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={`url(#bar-gradient-${index})`} />
              ))}
            </Bar>
            <defs>
              {chartData.map((_, index) => (
                <linearGradient key={index} id={`bar-gradient-${index}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} />
                  <stop offset="100%" stopColor={CHART_COLORS[(index + 1) % CHART_COLORS.length]} stopOpacity={0.8} />
                </linearGradient>
              ))}
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function IntegrityChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="card h-64 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-muted)]">No integrity data available</p>
        </div>
      </div>
    )
  }

  const chartData = Object.entries(data).map(([name, value], index) => ({ 
    name: name.charAt(0).toUpperCase() + name.slice(1), 
    value, 
    color: CHART_COLORS[index % CHART_COLORS.length]
  }))
  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Integrity Status
        </h3>
      </div>
      <div className="h-64 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
              labelLine={false}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [value, 'Files']} 
              contentStyle={{ 
                backgroundColor: 'var(--bg-card)', 
                border: '1px solid var(--border-secondary)', 
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
              }} 
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-3 mt-5 justify-center">
        {chartData.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2 px-3 py-1.5 glass rounded-full">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-sm font-medium text-[var(--text-primary)] capitalize">{item.name}</span>
            <span className="font-display font-bold text-[var(--text-secondary)]">{item.value}</span>
            <span className="text-xs text-[var(--accent-primary)] font-semibold">
              {total > 0 ? `${((item.value / total) * 100).toFixed(0)}%` : '0%'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentActivity({ datasets }) {
  const recent = datasets.slice(0, 5)
  
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Datasets
        </h3>
        <Link to="/dataset" className="text-[var(--accent-secondary)] text-sm font-medium hover:text-[var(--accent-primary)] flex items-center gap-1">
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Dataset</th>
              <th>Fragments</th>
              <th>Reconstructions</th>
              <th>Status</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-[var(--text-muted)]">
                  <div className="flex flex-col items-center gap-3">
                    <Database className="w-12 h-12 text-[var(--border-secondary)]" />
                    <p>No datasets yet</p>
                    <Link to="/dataset" className="btn btn-primary text-sm px-4 py-2">
                      <Plus className="w-4 h-4 mr-2" />
                      Load Demo Dataset
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              recent.map((dataset) => (
                <tr key={dataset.id} className="group">
                  <td className="font-mono text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">{dataset.name}</td>
                  <td><span className="font-display font-bold text-[var(--accent-secondary)]">{dataset.total_fragments || 0}</span></td>
                  <td><span className="font-display font-bold text-[var(--accent-primary)]">{dataset.reconstructions?.length || 0}</span></td>
                  <td>
                    <span className={clsx('badge', 
                      dataset.status === 'completed' && 'badge-high',
                      dataset.status === 'processing' && 'badge-warning',
                      dataset.status === 'pending' && 'badge-info',
                      dataset.status === 'failed' && 'badge-danger'
                    )}>
                      {dataset.status}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-[var(--text-muted)]">{new Date(dataset.created_at).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/dataset/${dataset.id}`} className="text-[var(--accent-secondary)] hover:text-[var(--accent-primary)] text-sm font-medium flex items-center gap-1">
                      View <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function QuickActions({ onDemoClick, onUploadClick, onStorageClick, onReportClick, onEvidenceClick, loading, hasDataset }) {
  return (
    <div className="card w-full lg:w-[34rem] shrink-0">
      <div className="card-header">
        <h3 className="card-title flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Quick Actions
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button onClick={onDemoClick} className="btn btn-primary w-full min-h-11 justify-start group whitespace-nowrap" disabled={loading}>
          <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
          <span>Load Demo Dataset</span>
        </button>
        <button onClick={onUploadClick} className="btn btn-secondary w-full min-h-11 justify-start group whitespace-nowrap" disabled={loading}>
          <Search className="w-4 h-4 mr-2" />
          <span>Manual Upload</span>
        </button>
        <button onClick={onStorageClick} className="btn btn-secondary w-full min-h-11 justify-start group whitespace-nowrap" disabled={loading}>
          <FolderOpen className="w-4 h-4 mr-2" />
          <span>Scan Device Storage</span>
        </button>
        <button onClick={onReportClick} className="btn btn-secondary w-full min-h-11 justify-start group whitespace-nowrap" disabled={loading || !hasDataset}>
          <BarChart3 className="w-4 h-4 mr-2" />
          <span>Generate Report</span>
        </button>
        <button onClick={onEvidenceClick} className="btn btn-secondary w-full min-h-11 justify-start group whitespace-nowrap" disabled={loading || !hasDataset}>
          <ExternalLink className="w-4 h-4 mr-2" />
          <span>Export Evidence</span>
        </button>
      </div>
    </div>
  )
}

function SystemStatus() {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title flex items-center gap-2">
          <Shield className="w-5 h-5" />
          System Status
        </h3>
      </div>
      <div className="space-y-4">
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
  )
}

function AIInsights({ stats }) {
  const methods = Object.entries(stats?.classification_methods || {})
  const hashCounts = stats?.hash_status_counts || {}
  const duplicateGroups = stats?.duplicate_groups?.length || 0
  const similarityGroups = stats?.similarity_groups?.length || 0

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI Analysis Insights
        </h3>
        <span className="badge badge-high">Live models</span>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="glass rounded-xl p-3 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Anomalies</p>
          <p className="font-display font-bold text-2xl text-[var(--accent-danger)] mt-1">{stats?.anomalies || 0}</p>
          <p className="text-xs text-[var(--text-muted)] truncate">Isolation Forest flags</p>
        </div>
        <div className="glass rounded-xl p-3 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Avg anomaly</p>
          <p className="font-display font-bold text-2xl text-[var(--accent-warning)] mt-1">{((stats?.average_anomaly_score || 0) * 100).toFixed(0)}%</p>
          <p className="text-xs text-[var(--text-muted)] truncate">Batch score</p>
        </div>
        <div className="glass rounded-xl p-3 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Duplicate groups</p>
          <p className="font-display font-bold text-2xl text-[var(--accent-secondary)] mt-1">{duplicateGroups}</p>
          <p className="text-xs text-[var(--text-muted)] truncate">SHA-256 matches</p>
        </div>
        <div className="glass rounded-xl p-3 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Similar groups</p>
          <p className="font-display font-bold text-2xl text-[var(--accent-primary)] mt-1">{similarityGroups}</p>
          <p className="text-xs text-[var(--text-muted)] truncate">Content similarity</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--text-muted)]">Classification:</span>
        {methods.length > 0 ? methods.map(([method, count]) => (
          <span key={method} className="badge badge-info">{method.replace('_', ' ')}: {count}</span>
        )) : <span className="text-[var(--text-muted)]">No model results yet</span>}
        <span className="font-semibold text-[var(--text-muted)] ml-2">Hashes:</span>
        <span className="text-[var(--accent-primary)]">{hashCounts.verified || 0} verified</span>
        <span className="text-[var(--accent-danger)]">{hashCounts.mismatch || 0} mismatch</span>
        <span className="text-[var(--text-muted)]">{hashCounts.unverified || 0} unverified</span>
      </div>
    </div>
  )
}

function getAgentAnswer(question, context) {
  const normalized = question.toLowerCase()
  const { dataset, auditLog, graph, stats } = context
  const fragments = dataset.fragments || []
  const reconstructions = dataset.reconstructions || []
  const anomalous = fragments.filter((fragment) => fragment.anomaly_label === 'anomaly')
  const suspicious = fragments.filter((fragment) => fragment.status === 'suspicious' || (fragment.suspicious_indicators || []).length > 0)
  const mismatches = fragments.filter((fragment) => fragment.hash_analysis?.status === 'mismatch')
  const duplicateGroups = stats?.duplicate_groups || []
  const similarityGroups = stats?.similarity_groups || []

  if (normalized.includes('summarize') || normalized.includes('summary')) {
    return `Based on the current RecoverAI investigation, ${fragments.length} fragments and ${reconstructions.length} reconstruction candidates are recorded. ${anomalous.length} fragments are flagged by anomaly analysis, ${mismatches.length} hash mismatches are recorded, and ${auditLog.length} audit entries are available.`
  }
  if (normalized.includes('attention') || normalized.includes('review') || normalized.includes('next')) {
    const attentionIds = [...new Set([...anomalous, ...mismatches, ...suspicious].map((fragment) => fragment.fragment_id))].slice(0, 8)
    if (!attentionIds.length && !reconstructions.length) return "I don't have enough information in the current RecoverAI investigation data to answer that."
    return `The current evidence indicates ${attentionIds.length} highlighted fragment${attentionIds.length === 1 ? '' : 's'}${attentionIds.length ? ` (${attentionIds.join(', ')})` : ''} and ${reconstructions.length} reconstruction candidate${reconstructions.length === 1 ? '' : 's'} require review. Check anomaly indicators, hash status, reconstruction confidence, and integrity before accepting a result.`
  }
  if (normalized.includes('anomal') || normalized.includes('suspicious') || normalized.includes('damage') || normalized.includes('corrupt')) {
    if (!anomalous.length && !suspicious.length) return 'The current RecoverAI data contains no recorded anomaly or suspicious fragment flags.'
    const ids = [...new Set([...anomalous, ...suspicious].map((fragment) => fragment.fragment_id))].slice(0, 12)
    return `RecoverAI recorded ${anomalous.length} Isolation Forest anomal${anomalous.length === 1 ? 'y' : 'ies'} and ${suspicious.length} fragment${suspicious.length === 1 ? '' : 's'} with suspicious indicators. Affected fragment IDs include: ${ids.join(', ')}.`
  }
  if (normalized.includes('duplicate')) {
    if (!duplicateGroups.length) return 'The current RecoverAI data contains no duplicate groups.'
    return `RecoverAI detected ${duplicateGroups.length} duplicate group${duplicateGroups.length === 1 ? '' : 's'} using SHA-256 hashes: ${duplicateGroups.slice(0, 8).map((group) => group.fragment_ids.join(' = ')).join('; ')}.`
  }
  if (normalized.includes('relationship') || normalized.includes('related') || normalized.includes('similar')) {
    const edgeCount = graph?.edges?.length || 0
    if (!edgeCount && !similarityGroups.length) return "I don't have enough information in the current RecoverAI investigation data to answer that."
    return `RecoverAI recorded ${edgeCount} fragment relationship${edgeCount === 1 ? '' : 's'} in the evidence graph and ${similarityGroups.length} content-similarity group${similarityGroups.length === 1 ? '' : 's'}. The graph and group IDs are the available evidence for related fragments.`
  }
  if (normalized.includes('reconstruction') || normalized.includes('recovery')) {
    if (!reconstructions.length) return 'The current RecoverAI data contains no reconstruction candidates.'
    return reconstructions.map((reconstruction) => `${reconstruction.name}: ${(Number(reconstruction.confidence_score || 0) * 100).toFixed(1)}% recorded confidence, ${reconstruction.integrity_status || 'unknown'} integrity, status ${reconstruction.status}.`).join(' ')
  }
  if (normalized.includes('explain') || normalized.includes('analysis') || normalized.includes('evidence')) {
    return `The current evidence includes ${fragments.length} fragment records, ${stats?.classification_methods ? JSON.stringify(stats.classification_methods) : 'no recorded classifier summary'}, ${anomalous.length} anomaly flags, ${duplicateGroups.length} duplicate groups, ${similarityGroups.length} similarity groups, ${reconstructions.length} reconstruction candidates, and ${auditLog.length} audit entries. No external data was used.`
  }
  return "I don't have enough information in the current RecoverAI investigation data to answer that."
}

function AIAgent({ stats, datasets, currentDataset }) {
  const [messages, setMessages] = useState([{ role: 'agent', text: 'Hey! I’m EVIDEX 🔎 Your forensic AI companion. What evidence should we uncover next?' }])
  const [question, setQuestion] = useState('')
  const [agentLoading, setAgentLoading] = useState(false)

  const sendQuestion = async (event) => {
    event?.preventDefault()
    const asked = question.trim()
    if (!asked || agentLoading) return
    setMessages((current) => [...current, { role: 'investigator', text: asked }])
    setQuestion('')
    setAgentLoading(true)
    try {
      const datasetId = currentDataset?.id || datasets[0]?.id
      if (!datasetId) throw new Error("I don't have enough information in the current RecoverAI investigation data to answer that.")
      const [datasetResponse, auditResponse, graphResponse] = await Promise.all([
        api.get(`/datasets/${datasetId}`),
        api.get(`/datasets/${datasetId}/audit-log`),
        api.get(`/datasets/${datasetId}/graph`),
      ])
      const text = getAgentAnswer(asked, { dataset: datasetResponse.data, auditLog: auditResponse.data, graph: graphResponse.data, stats })
      setMessages((current) => [...current, { role: 'agent', text }])
    } catch (error) {
      setMessages((current) => [...current, { role: 'agent', text: error.message || "I don't have enough information in the current RecoverAI investigation data to answer that." }])
    } finally {
      setAgentLoading(false)
    }
  }

  return (
    <section className="card" aria-labelledby="ai-agent-title">
      <div className="card-header">
        <div>
          <h2 id="ai-agent-title" className="card-title flex items-center gap-2"><Brain className="w-5 h-5 text-[var(--accent-primary)]" />EVIDEX</h2>
          <p className="card-subtitle">Your forensic AI companion.</p>
        </div>
        <button type="button" onClick={() => setMessages([])} className="btn btn-ghost px-3 py-2" title="Clear chat"><Trash2 className="w-4 h-4 mr-2" />Clear</button>
      </div>
      <div className="glass rounded-xl p-3 h-40 overflow-y-auto space-y-2" aria-live="polite">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={clsx('flex gap-2 text-sm', message.role === 'investigator' ? 'justify-end' : 'justify-start')}>
            <div className={clsx('max-w-[85%] rounded-xl px-3 py-2 whitespace-pre-wrap', message.role === 'investigator' ? 'bg-[var(--accent-secondary-dim)] text-[var(--text-primary)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]')}>
              {message.text}
            </div>
          </div>
        ))}
        {agentLoading && <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]"><Loader2 className="w-4 h-4 animate-spin" />Reading RecoverAI evidence...</div>}
      </div>
      <form onSubmit={sendQuestion} className="mt-3 flex gap-2">
        <div className="relative flex-1"><MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" /><input className="input pl-10" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about the current RecoverAI evidence..." disabled={agentLoading} /></div>
        <button type="submit" className="btn btn-primary px-4" disabled={agentLoading || !question.trim()} title="Send question"><Send className="w-4 h-4" /></button>
      </form>
    </section>
  )
}

export function Dashboard() {
  const { datasets, fetchDatasets, createDemoDataset, uploadDatasetBatch, loading, currentDataset } = useDataset()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadFiles, setUploadFiles] = useState([])
  const [inputMode, setInputMode] = useState('manual')
  const [uploadName, setUploadName] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadError, setUploadError] = useState(null)
  const [exportError, setExportError] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)
  const fileInputRef = useRef(null)
  const [source, setSource] = useState(() => localStorage.getItem('recoverai_source') || null)

  useEffect(() => {
    fetchDatasets()
  }, [fetchDatasets])

  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true)
        const response = await api.get('/dashboard/stats')
        setStats(response.data)
      } catch (err) {
        console.error('Failed to load stats:', err)
      } finally {
        setStatsLoading(false)
      }
    }
    loadStats()
  }, [])

  const handleDemoClick = async () => {
    try {
      const result = await createDemoDataset()
      setSource(null)
      localStorage.removeItem('recoverai_source')
      navigate(`/dataset/${result.dataset_id}`)
    } catch (err) {
      console.error('Failed to create demo dataset:', err)
    }
  }

  const handleUpload = async (event) => {
    event.preventDefault()
    if (!uploadFiles.length) {
      setUploadError(inputMode === 'device' ? 'Select a file or folder from device storage.' : 'Select at least one file.')
      return
    }
    try {
      setUploadError(null)
      const selectedName = uploadName || uploadFiles[0].name || (inputMode === 'device' ? 'Device Storage Evidence' : 'Manual Upload Evidence')
      const selectedSource = inputMode === 'device' ? 'Device Storage' : 'Manual Upload'
      const result = await uploadDatasetBatch(uploadFiles, selectedName, uploadDescription, selectedSource)
      setUploadOpen(false)
      setUploadFiles([])
      setUploadName('')
      setUploadDescription('')
      setSource(selectedSource)
      localStorage.setItem('recoverai_source', selectedSource)
      navigate(`/dataset/${result.dataset_id}`)
    } catch (err) {
      setUploadError(err.message || 'Upload failed. Please try again.')
    }
  }

  const loadExportData = async () => {
    const datasetId = currentDataset?.id || datasets[0]?.id
    if (!datasetId) throw new Error('Load or upload a dataset before exporting.')
    const [datasetResponse, auditResponse] = await Promise.all([
      api.get(`/datasets/${datasetId}`),
      api.get(`/datasets/${datasetId}/audit-log`),
    ])
    return {
      dataset: datasetResponse.data,
      auditLog: auditResponse.data,
      dashboardStats: stats,
    }
  }

  const handleReportExport = async () => {
    try {
      setExportLoading(true)
      setExportError(null)
      const { dataset, auditLog, dashboardStats } = await loadExportData()
      const fragments = dataset.fragments || []
      const reconstructions = dataset.reconstructions || []
      const anomalyCount = fragments.filter((fragment) => fragment.anomaly_label === 'anomaly').length
      const reportHtml = `<!doctype html>
<html><head><meta charset="utf-8"><title>RecoverAI Investigation Report</title>
<style>body{font-family:Arial,sans-serif;color:#172033;max-width:960px;margin:40px auto;line-height:1.5}h1{color:#087f70}h2{border-bottom:1px solid #d6dce5;padding-bottom:6px}table{width:100%;border-collapse:collapse;margin:12px 0 28px}th,td{border:1px solid #d6dce5;padding:8px;text-align:left;font-size:13px}th{background:#eef5f7}.meta{background:#f5f8fa;padding:14px;border-radius:8px}</style></head>
<body><h1>RecoverAI Investigation Report</h1><div class="meta"><strong>Dataset:</strong> ${escapeHtml(dataset.name)}<br><strong>Status:</strong> ${escapeHtml(dataset.status)}<br><strong>Generated:</strong> ${escapeHtml(new Date().toISOString())}</div>
<h2>Summary</h2><p>${escapeHtml(dataset.description || 'No description provided')}</p><ul><li>Fragments: ${fragments.length}</li><li>Reconstructions: ${reconstructions.length}</li><li>Anomaly flags: ${anomalyCount}</li><li>Audit entries: ${auditLog.length}</li><li>Duplicate groups: ${(dashboardStats?.duplicate_groups || []).length}</li><li>Similarity groups: ${(dashboardStats?.similarity_groups || []).length}</li></ul>
<h2>Reconstructions</h2><table><tr><th>Name</th><th>Type</th><th>Confidence</th><th>Integrity</th><th>Status</th></tr>${reconstructions.map((reconstruction) => `<tr><td>${escapeHtml(reconstruction.name)}</td><td>${escapeHtml(reconstruction.file_type)}</td><td>${(Number(reconstruction.confidence_score || 0) * 100).toFixed(1)}%</td><td>${escapeHtml(reconstruction.integrity_status)}</td><td>${escapeHtml(reconstruction.status)}</td></tr>`).join('')}</table>
<h2>AI and Integrity Findings</h2><table><tr><th>Fragment</th><th>Classification</th><th>Confidence</th><th>Anomaly</th><th>Hash status</th></tr>${fragments.map((fragment) => `<tr><td>${escapeHtml(fragment.fragment_id)}</td><td>${escapeHtml(fragment.file_type)}</td><td>${(Number(fragment.classification_confidence || 0) * 100).toFixed(1)}%</td><td>${escapeHtml(fragment.anomaly_label || 'unknown')} (${(Number(fragment.anomaly_score || 0) * 100).toFixed(1)}%)</td><td>${escapeHtml(fragment.hash_analysis?.status || 'unverified')}</td></tr>`).join('')}</table>
<h2>Audit Log</h2><table><tr><th>Timestamp</th><th>Action</th><th>Status</th><th>Details</th></tr>${auditLog.map((entry) => `<tr><td>${escapeHtml(entry.timestamp)}</td><td>${escapeHtml(entry.action)}</td><td>${escapeHtml(entry.new_status || '')}</td><td>${escapeHtml(entry.user_action || '')}</td></tr>`).join('')}</table>
<p>AI fields are recommendations and evidence metadata. Investigator decisions are represented separately in the audit log.</p></body></html>`
      downloadFile(reportHtml, `recoverai-report-${dataset.id}.html`, 'text/html;charset=utf-8')
    } catch (err) {
      setExportError(err.message || 'Unable to generate report.')
    } finally {
      setExportLoading(false)
    }
  }

  const handleEvidenceExport = async () => {
    try {
      setExportLoading(true)
      setExportError(null)
      const exportData = await loadExportData()
      downloadFile(JSON.stringify({
        exportedAt: new Date().toISOString(),
        exportType: 'RecoverAI evidence package',
        ...exportData,
      }, null, 2), `recoverai-evidence-${exportData.dataset.id}.json`, 'application/json;charset=utf-8')
    } catch (err) {
      setExportError(err.message || 'Unable to export evidence.')
    } finally {
      setExportLoading(false)
    }
  }

  if (statsLoading) {
    return (
      <div className="page-enter space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-3xl text-[var(--text-primary)]">Dashboard</h1>
            <p className="text-[var(--text-muted)] mt-1">Loading system statistics...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="stat-card">
              <div className="skeleton h-4 w-1/4 mb-2"></div>
              <div className="skeleton h-10 w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="page-enter animate-fade-in space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display font-bold text-3xl text-[var(--text-primary)]">Dashboard</h1>
            {source && <span className="badge badge-info">Source: {source}</span>}
          </div>
          <p className="text-[var(--text-muted)] mt-1">Intelligent Data Recovery & Digital Evidence Reconstruction</p>
        </div>
        <div className="w-full lg:w-auto">
          <QuickActions
            onDemoClick={handleDemoClick}
            onUploadClick={() => setUploadOpen(true)}
            onStorageClick={() => { setInputMode('device'); setUploadOpen(true); setUploadError(null) }}
            onReportClick={handleReportExport}
            onEvidenceClick={handleEvidenceExport}
            loading={loading || exportLoading}
            hasDataset={datasets.length > 0 || Boolean(currentDataset)}
          />
        </div>
      </div>

      <AIAgent stats={stats} datasets={datasets} currentDataset={currentDataset} />

      {exportError && <div className="card border-[var(--accent-danger)]/50 text-sm text-[var(--accent-danger)]">{exportError}</div>}

      {uploadOpen && (
        <div className="card border-[var(--accent-secondary)]/50">
          <div className="card-header">
            <div>
              <h3 className="card-title">Upload Custom Data</h3>
              <p className="card-subtitle">Analyze a local file with the recovery pipeline.</p>
            </div>
            <button type="button" onClick={() => setUploadOpen(false)} className="btn btn-ghost px-3 py-2" aria-label="Close upload form">Close</button>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <button type="button" onClick={() => setInputMode('manual')} className={clsx('btn px-3 py-2', inputMode === 'manual' ? 'btn-primary' : 'btn-secondary')}>
              <FileText className="w-4 h-4 mr-2" />Manual Upload
            </button>
            <button type="button" onClick={() => setInputMode('device')} className={clsx('btn px-3 py-2', inputMode === 'device' ? 'btn-primary' : 'btn-secondary')}>
              <FolderOpen className="w-4 h-4 mr-2" />Scan Device Storage
            </button>
          </div>
          <form onSubmit={handleUpload} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                webkitdirectory={inputMode === 'device' ? '' : undefined}
                className="input"
                onChange={(event) => setUploadFiles(Array.from(event.target.files || []))}
                required
              />
              <p className="text-xs text-[var(--text-muted)]">
                {inputMode === 'device' ? 'Select a folder or files. RecoverAI reads only the location you explicitly choose.' : 'Select one or more evidence files for analysis.'}
              </p>
              <input
                type="text"
                className="input"
                placeholder="Dataset name"
                value={uploadName}
                onChange={(event) => setUploadName(event.target.value)}
              />
              <textarea
                className="input min-h-24 resize-y"
                placeholder="Description (optional)"
                value={uploadDescription}
                onChange={(event) => setUploadDescription(event.target.value)}
              />
            </div>
            <div className="flex flex-col justify-end gap-3">
              {uploadError && <p className="text-sm text-[var(--accent-danger)]">{uploadError}</p>}
              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? 'Uploading...' : 'Upload and Analyze'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Fragments"
          value={stats?.total_fragments || 0}
          icon={FileText}
          color="secondary"
          description="Analyzed fragments"
          onClick={() => currentDataset && navigate(`/fragments/${currentDataset.id}`)}
          sparkline={[{value: 12}, {value: 19}, {value: 15}, {value: 25}, {value: 22}, {value: 30}, {value: stats?.total_fragments || 0}]}
        />
        <StatCard
          title="Files Detected"
          value={Object.values(stats?.file_type_distribution || {}).reduce((a, b) => a + b, 0)}
          icon={Database}
          color="success"
          description="Unique file types"
        />
        <StatCard
          title="Reconstructed"
          value={stats?.total_reconstructions || 0}
          icon={Puzzle}
          color="warning"
          description="Candidate files"
          onClick={() => currentDataset && navigate(`/reconstructions/${currentDataset.id}`)}
        />
        <StatCard
          title="Anomalies"
          value={(stats?.corrupted_fragments || 0) + (stats?.suspicious_fragments || 0)}
          icon={AlertTriangle}
          color="danger"
          description="Flagged items"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ConfidenceChart data={stats?.confidence_distribution} />
        </div>
        <div>
          <StatCard
            title="Duplicates"
            value={stats?.duplicates || 0}
            icon={Copy}
            color="purple"
            description="SHA-256 matches"
          />
        </div>
        <div>
          <StatCard
            title="High Confidence"
            value={stats?.confidence_distribution?.high || 0}
            icon={CheckCircle}
            color="success"
            description="≥70% confidence"
          />
        </div>
        <div>
          <StatCard
            title="Medium Confidence"
            value={stats?.confidence_distribution?.medium || 0}
            icon={HelpCircle}
            color="warning"
            description="40-69% confidence"
          />
        </div>
        <div>
          <StatCard
            title="Low Confidence"
            value={stats?.confidence_distribution?.low || 0}
            icon={XCircle}
            color="danger"
            description="<40% confidence"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FileTypeChart data={stats?.file_type_distribution} />
        <IntegrityChart data={stats?.integrity_distribution} />
      </div>

      <AIInsights stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentActivity datasets={datasets} />
        <SystemStatus />
      </div>
    </div>
  )
}