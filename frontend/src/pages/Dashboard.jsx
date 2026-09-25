import { useEffect, useState } from 'react'
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
  ChevronRight
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

function QuickActions({ onDemoClick, loading }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Quick Actions
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button onClick={onDemoClick} className="btn btn-primary w-full justify-start group" disabled={loading}>
          <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
          <span>Load Demo Dataset</span>
        </button>
        <button className="btn btn-secondary w-full justify-start group" disabled>
          <Search className="w-4 h-4 mr-2" />
          <span>Upload Custom Data</span>
        </button>
        <button className="btn btn-secondary w-full justify-start group" disabled>
          <BarChart3 className="w-4 h-4 mr-2" />
          <span>Generate Report</span>
        </button>
        <button className="btn btn-secondary w-full justify-start group" disabled>
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

export function Dashboard() {
  const { datasets, fetchDatasets, createDemoDataset, loading, currentDataset, loadDataset } = useDataset()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

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
      navigate(`/dataset/${result.dataset_id}`)
    } catch (err) {
      console.error('Failed to create demo dataset:', err)
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-[var(--text-primary)]">Dashboard</h1>
          <p className="text-[var(--text-muted)] mt-1">Intelligent Data Recovery & Digital Evidence Reconstruction</p>
        </div>
        <div className="flex gap-3">
          <QuickActions onDemoClick={handleDemoClick} loading={loading} />
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentActivity datasets={datasets} />
        <SystemStatus />
      </div>
    </div>
  )
}