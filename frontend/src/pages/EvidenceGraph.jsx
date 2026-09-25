import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  GitBranch, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Minimize2,
  Maximize2,
  Search,
  Info,
  AlertTriangle,
  CheckCircle,
  X,
  Loader2,
  Target,
  Layers,
  Share2,
  Download,
  Settings,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react'
import { useDataset } from '../context/DatasetContext'
import api from '../utils/api'
import { clsx } from 'clsx'

const NODE_COLORS = {
  JPEG: '#a855f7',
  PNG: '#3b82f6',
  PDF: '#ef4444',
  DOCX: '#3b82f6',
  ZIP: '#f59e0b',
  TXT: '#22c55e',
  HTML: '#f97316',
  ENCRYPTED: '#ef4444',
  UNKNOWN: '#64748b',
}

const NODE_ICONS = {
  JPEG: 'JPG',
  PNG: 'PNG',
  PDF: 'PDF',
  DOCX: 'DOCX',
  ZIP: 'ZIP',
  TXT: 'TXT',
  HTML: 'HTML',
  ENCRYPTED: 'ENC',
  UNKNOWN: '???',
}

const REL_COLORS = {
  strong_candidate: '#22c55e',
  signature_compatible: '#3b82f6',
  structurally_similar: '#a855f7',
  content_similar: '#f59e0b',
  weak_candidate: '#64748b',
}

const REL_LABELS = {
  strong_candidate: 'Strong Candidate',
  signature_compatible: 'Signature Match',
  structurally_similar: 'Structural Similarity',
  content_similar: 'Content Similarity',
  weak_candidate: 'Weak Candidate',
}

function Legend({ showNodeTypes, showRelTypes }) {
  return (
    <div className="absolute bottom-4 left-4 bg-[var(--bg-card)]/95 backdrop-blur-2xl border border-[var(--border-primary)] rounded-xl p-4 shadow-2xl z-10 min-w-[220px] animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-display font-semibold text-[var(--text-primary)]">Legend</h4>
        <div className="flex gap-1">
          <button onClick={() => showNodeTypes(!showNodeTypes())} className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]">Nodes</button>
          <button onClick={() => showRelTypes(!showRelTypes())} className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]">Edges</button>
        </div>
      </div>
      {showNodeTypes && (
        <div className="space-y-2 mb-3">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Node Types</p>
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold font-mono text-xs text-white" style={{ backgroundColor: color }}>{NODE_ICONS[type]}</div>
              <span className="text-[var(--text-secondary)] capitalize">{type.toLowerCase()}</span>
            </div>
          ))}
        </div>
      )}
      {showRelTypes && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Relationship Types</p>
          {Object.entries(REL_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2 text-sm">
              <div className="w-6 h-1 rounded" style={{ backgroundColor: color }} />
              <span className="text-[var(--text-secondary)]">{REL_LABELS[type]}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-sm pt-2 border-t border-[var(--border-primary)]">
            <div className="w-6 h-1 rounded border-2 border-dashed border-[var(--border-secondary)]" />
            <span className="text-[var(--text-muted)]">Missing Fragment</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-6 h-6 rounded-full border-2 border-[var(--accent-danger)] flex items-center justify-center">
              <AlertTriangle className="w-3 h-3 text-[var(--accent-danger)]" />
            </div>
            <span className="text-[var(--text-muted)]">Suspicious Node</span>
          </div>
        </div>
      )}
    </div>
  )
}

function Node({ node, x, y, scale, selected, hovered, onClick, onMouseEnter, onMouseLeave, showMissing, showSuspicious }) {
  const color = NODE_COLORS[node.type] || NODE_COLORS.UNKNOWN
  const isMissing = node.is_missing
  const isSuspicious = node.status === 'suspicious'
  const icon = NODE_ICONS[node.type] || '???'
  
  if (isMissing && !showMissing) return null

  return (
    <g 
      transform={`translate(${x * scale}, ${y * scale})`} 
      onClick={(e) => { e.stopPropagation(); onClick(node) }}
      onMouseEnter={() => onMouseEnter(node)}
      onMouseLeave={onMouseLeave}
      className="cursor-pointer"
    >
      {!isMissing && (
        <>
          <circle
            r={selected ? 26 : hovered ? 24 : 22}
            fill="none"
            stroke={selected ? '#00d4aa' : (hovered ? color : 'transparent')}
            strokeWidth={selected ? 3 : hovered ? 2 : 0}
            className="transition-all duration-200"
            filter="drop-shadow(0 0 8px rgba(0, 212, 170, 0.4))"
          />
          <circle
            r={20}
            fill={color}
            stroke={isSuspicious && showSuspicious ? '#ff4757' : 'rgba(255,255,255,0.1)'}
            strokeWidth={isSuspicious && showSuspicious ? 2.5 : 1}
            className="transition-all duration-200"
            filter="drop-shadow(0 4px 12px rgba(0,0,0,0.4))"
          />
          <text 
            x={0} 
            y={4} 
            textAnchor="middle" 
            fill="white" 
            fontSize="11" 
            fontWeight="600"
            fontFamily="monospace"
            className="transition-all duration-200"
          >
            {icon}
          </text>
          {isSuspicious && showSuspicious && (
            <circle cx={16} cy={-16} r={8} fill="#ff4757" stroke="var(--bg-primary)" strokeWidth={2} />
          )}
          {selected && (
            <circle cx={0} cy={-24} r={8} fill="#00d4aa" stroke="var(--bg-primary)" strokeWidth={2} />
          )}
        </>
      )}
      {isMissing && (
        <>
          <circle
            r={18}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeDasharray="6 6"
            className="transition-all duration-200"
            style={{ opacity: 0.6 }}
          />
          <text 
            x={0} 
            y={4} 
            textAnchor="middle" 
            fill="var(--text-muted)" 
            fontSize="9" 
            fontWeight="500"
            fontFamily="monospace"
            opacity="0.7"
          >
            {icon}?
          </text>
        </>
      )}
    </g>
  )
}

function Edge({ edge, nodes, scale, showWeak }) {
  if (edge.type === 'weak_candidate' && !showWeak) return null
  
  const source = nodes.find(n => n.id === edge.source)
  const target = nodes.find(n => n.id === edge.target)
  if (!source || !target) return null
  
  const color = REL_COLORS[edge.type] || '#64748b'
  const width = Math.max(1.5, edge.score * 4)
  const isStrong = edge.type === 'strong_candidate'
  
  return (
    <g className="transition-opacity duration-200">
      <line
        x1={source.x * scale}
        y1={source.y * scale}
        x2={target.x * scale}
        y2={target.y * scale}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={edge.type === 'weak_candidate' ? '6 4' : 'none'}
        strokeLinecap="round"
        opacity={isStrong ? 0.8 : 0.5}
        className="transition-all duration-200"
      />
      {isStrong && (
        <line
          x1={source.x * scale}
          y1={source.y * scale}
          x2={target.x * scale}
          y2={target.y * scale}
          stroke={color}
          strokeWidth={width + 2}
          strokeLinecap="round"
          opacity={0.15}
          className="animate-pulse"
        />
      )}
      <defs>
        <marker id={`arrow-${edge.source}-${edge.target}`} markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill={color} opacity={0.6} />
        </marker>
      </defs>
    </g>
  )
}

function Tooltip({ node, x, y, scale }) {
  if (!node) return null
  
  const color = NODE_COLORS[node.type] || NODE_COLORS.UNKNOWN
  const icon = NODE_ICONS[node.type] || '???'
  
  return (
    <div className="absolute bg-[var(--bg-card)]/95 backdrop-blur-2xl border border-[var(--border-primary)] rounded-xl p-4 shadow-2xl pointer-events-none z-20 animate-scale-in" style={{ left: x + 20, top: y - 60, minWidth: '260px' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold font-mono text-xs text-white" style={{ backgroundColor: color }}>{icon}</div>
        <div>
          <p className="font-display font-semibold text-[var(--text-primary)]">{node.id}</p>
          <p className="text-[var(--text-muted)] text-sm capitalize">{node.type}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="glass rounded-lg p-3">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Size</p>
          <p className="font-mono text-[var(--text-primary)]">{node.size.toLocaleString()} B</p>
        </div>
        <div className="glass rounded-lg p-3">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Confidence</p>
          <p className="font-display font-bold text-[var(--accent-primary)]">{(node.confidence * 100).toFixed(1)}%</p>
        </div>
        <div className="glass rounded-lg p-3">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Entropy</p>
          <p className="font-mono text-[var(--text-primary)]">{node.entropy?.toFixed(2)}</p>
        </div>
        <div className="glass rounded-lg p-3">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Status</p>
          <p className="font-medium capitalize">{node.status}</p>
        </div>
      </div>
      <Link to={`/fragments/${node.datasetId}/${node.id}`} className="mt-3 btn btn-primary w-full text-center text-sm">
        <Eye className="w-4 h-4 mr-2" />
        View Details
      </Link>
    </div>
  )
}

function Minimap({ nodes, edges, viewport, onClick, scale }) {
  const minimapScale = 0.1
  const width = 200
  const height = 150
  
  return (
    <div className="absolute bottom-4 right-4 bg-[var(--bg-card)]/95 backdrop-blur-2xl border border-[var(--border-primary)] rounded-xl p-2 shadow-2xl z-10">
      <div className="relative w-[200px] h-[150px] bg-[var(--bg-secondary)] rounded-lg overflow-hidden cursor-pointer" onClick={onClick}>
        <svg width={width} height={height}>
          {edges.map((edge) => {
            const source = nodes.find(n => n.id === edge.source)
            const target = nodes.find(n => n.id === edge.target)
            if (!source || !target) return null
            return (
              <line
                key={`${edge.source}-${edge.target}`}
                x1={source.x * minimapScale}
                y1={source.y * minimapScale}
                x2={target.x * minimapScale}
                y2={target.y * minimapScale}
                stroke={REL_COLORS[edge.type] || '#64748b'}
                strokeWidth={0.5}
                opacity={0.3}
              />
            )
          })}
          {nodes.map((node) => (
            <circle
              key={node.id}
              cx={node.x * minimapScale}
              cy={node.y * minimapScale}
              r={node.is_missing ? 1.5 : 2.5}
              fill={node.is_missing ? 'transparent' : (NODE_COLORS[node.type] || NODE_COLORS.UNKNOWN)}
              stroke={node.is_missing ? (NODE_COLORS[node.type] || NODE_COLORS.UNKNOWN) : 'rgba(255,255,255,0.3)'}
              strokeWidth={0.5}
              strokeDasharray={node.is_missing ? '2 2' : 'none'}
              opacity={0.6}
            />
          ))}
          <rect
            x={(-viewport.x / scale) * minimapScale}
            y={(-viewport.y / scale) * minimapScale}
            width={(width / scale) * minimapScale}
            height={(height / scale) * minimapScale}
            fill="none"
            stroke="#00d4aa"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        </svg>
      </div>
    </div>
  )
}

function Controls({ scale, pan, onZoomIn, onZoomOut, onReset, onFit, showMissing, onToggleMissing, showSuspicious, onToggleSuspicious, showWeak, onToggleWeak, showNodeTypes, onToggleNodeTypes, showRelTypes, onToggleRelTypes }) {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
      <div className="flex gap-2">
        <button onClick={onZoomOut} className="btn btn-secondary p-2" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
        <div className="flex items-center px-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl">
          <span className="font-display font-bold text-[var(--accent-primary)] w-16 text-right">{(scale * 100).toFixed(0)}%</span>
        </div>
        <button onClick={onZoomIn} className="btn btn-secondary p-2" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
      </div>
      <div className="flex gap-2">
        <button onClick={onFit} className="btn btn-secondary" title="Fit to View"><Maximize2 className="w-4 h-4 mr-2" />Fit</button>
        <button onClick={onReset} className="btn btn-secondary" title="Reset View"><RotateCcw className="w-4 h-4 mr-2" />Reset</button>
      </div>
      <div className="flex flex-col gap-1 bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] rounded-xl p-2">
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
          <input type="checkbox" checked={showMissing} onChange={(e) => onToggleMissing(e.target.checked)} className="w-4 h-4 accent-[var(--accent-primary)]" />
          Show Missing
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
          <input type="checkbox" checked={showSuspicious} onChange={(e) => onToggleSuspicious(e.target.checked)} className="w-4 h-4 accent-[var(--accent-warning)]" />
          Highlight Suspicious
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
          <input type="checkbox" checked={showWeak} onChange={(e) => onToggleWeak(e.target.checked)} className="w-4 h-4 accent-[var(--text-muted)]" />
          Show Weak Links
        </label>
      </div>
    </div>
  )
}

export function EvidenceGraph() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentDataset, loadDataset } = useDataset()
  const [graph, setGraph] = useState({ nodes: [], edges: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [selectedNode, setSelectedNode] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [viewport, setViewport] = useState({ x: 0, y: 0 })
  const [showMissing, setShowMissing] = useState(true)
  const [showSuspicious, setShowSuspicious] = useState(true)
  const [showWeak, setShowWeak] = useState(true)
  const [showNodeTypes, setShowNodeTypes] = useState(true)
  const [showRelTypes, setShowRelTypes] = useState(false)
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/datasets/${id}/graph`)
        const nodesWithPos = response.data.nodes.map((node, i) => ({
          ...node,
          x: node.x || (Math.random() * 800 + 100),
          y: node.y || (Math.random() * 600 + 100),
          datasetId: id,
        }))
        setGraph({ ...response.data, nodes: nodesWithPos })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.min(Math.max(scale * delta, 0.05), 3)
    
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      const newPanX = mouseX - (mouseX - pan.x) * (newScale / scale)
      const newPanY = mouseY - (mouseY - pan.y) * (newScale / scale)
      
      setPan({ x: newPanX, y: newPanY })
    }
    setScale(newScale)
  }

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'svg' || e.target.classList.contains('graph-bg')) {
      isPanning.current = true
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
      e.target.style.cursor = 'grabbing'
    }
  }

  const handleMouseMove = (e) => {
    if (isPanning.current) {
      const newPan = { x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y }
      setPan(newPan)
      setViewport({ x: -newPan.x, y: -newPan.y })
    }
    
    if (hoveredNode && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      setShowTooltip(true)
    }
  }

  const handleMouseUp = () => {
    isPanning.current = false
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab'
    }
  }

  const handleMouseLeave = () => {
    setShowTooltip(false)
  }

  const fitToScreen = () => {
    if (!svgRef.current || graph.nodes.length === 0) return
    
    const svg = svgRef.current
    const bbox = svg.getBBox()
    const container = containerRef.current
    
    if (!container) return
    
    const width = container.clientWidth
    const height = container.clientHeight
    
    const padding = 50
    const newScale = Math.min(
      (width - padding * 2) / bbox.width, 
      (height - padding * 2) / bbox.height
    ) * 0.9
    
    const newPanX = (width - bbox.width * newScale) / 2 - bbox.x * newScale
    const newPanY = (height - bbox.height * newScale) / 2 - bbox.y * newScale
    
    setScale(Math.max(0.05, Math.min(newScale, 3)))
    setPan({ x: newPanX, y: newPanY })
    setViewport({ x: -newPanX, y: -newPanY })
  }

  const resetView = () => {
    setScale(1)
    setPan({ x: 0, y: 0 })
    setViewport({ x: 0, y: 0 })
  }

  const handleMinimapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    const minimapScale = 0.1
    
    const newPanX = -clickX / minimapScale + 100 / scale
    const newPanY = -clickY / minimapScale + 75 / scale
    
    setPan({ x: newPanX, y: newPanY })
    setViewport({ x: -newPanX, y: -newPanY })
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-[var(--border-primary)] border-t-[var(--accent-primary)] animate-spin" />
          <p className="text-[var(--text-muted)]">Loading evidence graph...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="card text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-[var(--accent-danger)] mx-auto mb-4" />
          <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-2">Failed to load graph</h2>
          <p className="text-[var(--text-muted)] mb-6">{error}</p>
          <button onClick={() => navigate(`/dataset/${id}`)} className="btn btn-primary">Back to Dataset</button>
        </div>
      </div>
    )
  }

  if (graph.nodes.length === 0) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="card text-center max-w-md">
          <GitBranch className="w-16 h-16 text-[var(--border-secondary)] mx-auto mb-4" />
          <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-2">No Relationship Data</h2>
          <p className="text-[var(--text-muted)] mb-6">No fragment relationships were detected above the threshold.</p>
          <Link to={`/fragments/${id}`} className="btn btn-primary">Analyze Fragments</Link>
        </div>
      </div>
    )
  }

  const visibleNodes = graph.nodes.filter(n => !n.is_missing || showMissing)
  const visibleEdges = graph.edges.filter(e => 
    (showWeak || e.type !== 'weak_candidate') &&
    (showMissing || (graph.nodes.find(n => n.id === e.source)?.is_missing !== true && graph.nodes.find(n => n.id === e.target)?.is_missing !== true))
  )

  return (
    <div className="h-[calc(100vh-80px)] relative">
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <button onClick={() => navigate(`/dataset/${id}`)} className="btn btn-secondary">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-display font-bold text-xl text-[var(--text-primary)]">Evidence Relationship Graph</h1>
            <p className="text-[var(--text-muted)] text-sm">
              {visibleNodes.length} nodes, {visibleEdges.length} relationships 
              {graph.nodes.some(n => n.is_missing) && <span className="ml-2 badge badge-warning">Missing: {graph.nodes.filter(n => n.is_missing).length}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button className="btn btn-secondary p-2" title="Share Graph" disabled><Share2 className="w-4 h-4" /></button>
          <button className="btn btn-secondary p-2" title="Export Image" disabled><Download className="w-4 h-4" /></button>
          <button className="btn btn-secondary p-2" title="Settings" disabled><Settings className="w-4 h-4" /></button>
        </div>
      </div>

      <Controls
        scale={scale}
        pan={pan}
        onZoomIn={() => setScale(Math.min(3, scale * 1.3))}
        onZoomOut={() => setScale(Math.max(0.05, scale / 1.3))}
        onReset={resetView}
        onFit={fitToScreen}
        showMissing={showMissing}
        onToggleMissing={setShowMissing}
        showSuspicious={showSuspicious}
        onToggleSuspicious={setShowSuspicious}
        showWeak={showWeak}
        onToggleWeak={setShowWeak}
        showNodeTypes={showNodeTypes}
        onToggleNodeTypes={setShowNodeTypes}
        showRelTypes={showRelTypes}
        onToggleRelTypes={setShowRelTypes}
      />

      <Legend showNodeTypes={showNodeTypes} showRelTypes={showRelTypes} />

      <Minimap 
        nodes={visibleNodes} 
        edges={visibleEdges} 
        viewport={viewport} 
        onClick={handleMinimapClick}
        scale={scale}
      />

      <div 
        ref={containerRef}
        className="w-full h-full bg-[var(--bg-primary)] overflow-hidden cursor-grab touch-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <svg 
          ref={svgRef}
          className="graph-bg touch-none"
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
          }}
        >
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="edge-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {visibleEdges.map((edge) => (
            <Edge 
              key={`${edge.source}-${edge.target}`} 
              edge={edge} 
              nodes={visibleNodes} 
              scale={scale}
              showWeak={showWeak}
            />
          ))}
          
          {visibleNodes.map((node) => (
            <Node
              key={node.id}
              node={node}
              x={node.x}
              y={node.y}
              scale={scale}
              selected={selectedNode?.id === node.id}
              hovered={hoveredNode?.id === node.id}
              onClick={setSelectedNode}
              onMouseEnter={setHoveredNode}
              onMouseLeave={() => { setHoveredNode(null); setShowTooltip(false); }}
              showMissing={showMissing}
              showSuspicious={showSuspicious}
            />
          ))}
        </svg>
        
        {showTooltip && hoveredNode && (
          <Tooltip node={hoveredNode} x={tooltipPos.x} y={tooltipPos.y} scale={scale} />
        )}
      </div>

      {selectedNode && (
        <div className="absolute bottom-4 right-4 bg-[var(--bg-card)]/95 backdrop-blur-2xl border border-[var(--border-primary)] rounded-xl p-4 shadow-2xl z-10 min-w-[300px] max-w-[400px] animate-slide-up">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold font-mono text-xs text-white" style={{ backgroundColor: NODE_COLORS[selectedNode.type] || NODE_COLORS.UNKNOWN }}>
                {NODE_ICONS[selectedNode.type] || '???'}
              </div>
              <div>
                <p className="font-display font-semibold text-[var(--text-primary)]">{selectedNode.id}</p>
                <p className="text-[var(--text-muted)] text-sm capitalize">{selectedNode.type}</p>
              </div>
            </div>
            <button onClick={() => setSelectedNode(null)} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between p-2 glass rounded-lg">
              <dt className="text-[var(--text-muted)]">Fragment ID</dt>
              <dd className="font-mono text-[var(--text-primary)] truncate max-w-[180px]">{selectedNode.id}</dd>
            </div>
            <div className="flex justify-between p-2 glass rounded-lg">
              <dt className="text-[var(--text-muted)]">Type</dt>
              <dd><span className="badge badge-info text-xs">{selectedNode.type}</span></dd>
            </div>
            <div className="flex justify-between p-2 glass rounded-lg">
              <dt className="text-[var(--text-muted)]">Size</dt>
              <dd className="font-mono text-[var(--text-primary)]">{selectedNode.size.toLocaleString()} bytes</dd>
            </div>
            <div className="flex justify-between p-2 glass rounded-lg">
              <dt className="text-[var(--text-muted)]">Confidence</dt>
              <dd className="font-display font-bold text-[var(--accent-primary)]">{(selectedNode.confidence * 100).toFixed(1)}%</dd>
            </div>
            <div className="flex justify-between p-2 glass rounded-lg">
              <dt className="text-[var(--text-muted)]">Entropy</dt>
              <dd className="font-mono text-[var(--text-primary)]">{selectedNode.entropy?.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between p-2 glass rounded-lg">
              <dt className="text-[var(--text-muted)]">Status</dt>
              <dd><span className={clsx('badge', selectedNode.status === 'suspicious' ? 'badge-warning' : 'badge-high')}>{selectedNode.status}</span></dd>
            </div>
          </dl>
          <div className="mt-4 pt-4 border-t border-[var(--border-primary)]">
            <Link to={`/fragments/${id}/${selectedNode.id}`} className="btn btn-primary w-full text-center">
              <Eye className="w-4 h-4 mr-2" />
              View Fragment Details
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}