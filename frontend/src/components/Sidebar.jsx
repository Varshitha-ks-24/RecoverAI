import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Database, 
  FileText, 
  Puzzle, 
  GitBranch, 
  ListChecks, 
  Info,
  ChevronLeft,
  ChevronRight,
  Shield,
  Search,
  Zap,
  Settings
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { clsx } from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, desc: 'Overview & statistics' },
  { name: 'Dataset Analysis', href: '/dataset', icon: Database, desc: 'Upload & analyze data' },
  { name: 'Fragments', href: '/fragments', icon: FileText, desc: 'Fragment inspection' },
  { name: 'Reconstructions', href: '/reconstructions', icon: Puzzle, desc: 'File reconstruction' },
  { name: 'Evidence Graph', href: '/graph', icon: GitBranch, desc: 'Relationship visualization' },
  { name: 'Audit Log', href: '/audit', icon: ListChecks, desc: 'Chain of custody' },
  { name: 'About', href: '/about', icon: Info, desc: 'Project information' },
]

export function Sidebar() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [stats, setStats] = useState({ datasets: 0, fragments: 0, reconstructions: 0 })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats')
        if (res.ok) {
          const data = await res.json()
          setStats({
            datasets: data.total_datasets || 0,
            fragments: data.total_fragments || 0,
            reconstructions: data.total_reconstructions || 0
          })
        }
      } catch (e) {
        // Silently fail
      }
    }
    fetchStats()
  }, [])

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname.startsWith(href)
  }

  return (
    <aside 
      className={clsx(
        'fixed left-0 top-0 z-50 h-screen bg-[var(--bg-card)]/95 backdrop-blur-2xl border-r border-[var(--border-primary)] transition-all duration-500 ease-out',
        collapsed ? 'w-22' : 'w-72'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className={clsx('flex items-center justify-between h-16 px-4 border-b border-[var(--border-primary)] transition-all duration-300', collapsed && 'justify-center')}>
          <NavLink to="/" className={clsx('flex items-center gap-3 transition-all duration-300', collapsed && 'justify-center')}>
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center flex-shrink-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] animate-pulse opacity-50" />
              <Database className="w-5 h-5 text-[var(--bg-primary)] relative z-10" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <span className="font-display font-bold text-lg text-[var(--text-primary)]">RecoverAI</span>
                <span className="block text-[10px] text-[var(--text-muted)] tracking-widest uppercase">Digital Forensics</span>
              </div>
            )}
          </NavLink>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={clsx('p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all duration-200', collapsed && 'ml-auto')}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {navigation.map((item, index) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => clsx(
                'sidebar-link group relative overflow-hidden',
                isActive && 'active',
                collapsed && 'justify-center px-2'
              )}
              style={{ transitionDelay: `${index * 30}ms` }}
              title={collapsed ? item.name : undefined}
            >
              <div className="relative z-10 flex-shrink-0">
                <item.icon className="w-5 h-5" aria-hidden="true" />
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <span className="block font-medium truncate">{item.name}</span>
                  <span className="block text-[11px] text-[var(--text-muted)] truncate">{item.desc}</span>
                </div>
              )}
              {isActive(item.href) && !collapsed && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--accent-primary)] rounded-r-full" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Quick Stats */}
        {!collapsed && (
          <div className="px-3 py-4 border-t border-[var(--border-primary)] space-y-3 animate-slide-up">
            <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1">Quick Stats</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="glass rounded-xl p-3 text-center">
                <p className="font-display font-bold text-[var(--accent-primary)] text-lg">{stats.datasets}</p>
                <p className="text-[10px] text-[var(--text-muted)]">Datasets</p>
              </div>
              <div className="glass rounded-xl p-3 text-center">
                <p className="font-display font-bold text-[var(--accent-secondary)] text-lg">{stats.fragments}</p>
                <p className="text-[10px] text-[var(--text-muted)]">Fragments</p>
              </div>
              <div className="glass rounded-xl p-3 text-center">
                <p className="font-display font-bold text-[var(--accent-warning)] text-lg">{stats.reconstructions}</p>
                <p className="text-[10px] text-[var(--text-muted)]">Reconstructed</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={clsx('px-4 py-4 border-t border-[var(--border-primary)] transition-all duration-300', collapsed && 'hidden')}>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
              <span className="text-sm font-medium text-[var(--text-primary)]">System Online</span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] space-y-1">
              <p>v1.0.0 • Hackathon Prototype</p>
              <p className="font-mono">Cybersecurity & AI Track</p>
            </div>
          </div>
        </div>

        {collapsed && !hovered && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-2 h-20 rounded-l-xl bg-[var(--accent-primary-dim)] border border-[var(--border-primary)] border-r-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </aside>
  )
}