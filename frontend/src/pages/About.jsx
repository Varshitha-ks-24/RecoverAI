import { 
  Shield, 
  Cpu, 
  Database, 
  Brain, 
  GitBranch, 
  FileText,
  CheckCircle,
  ExternalLink,
  Github,
  Linkedin,
  Twitter,
  Mail,
  Zap,
  ArrowRight,
  Star,
  Layers,
  BarChart3,
  Code,
  Terminal,
  Globe,
  Lock,
  Eye,
  Search,
  Hash,
  Download,
  Upload,
  Settings,
  Users,
  Award,
  Clock,
  Sparkles
} from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Forensic-Grade Analysis',
    description: 'Professional cybersecurity dashboard with fragment analysis, file-type detection, and evidence reconstruction capabilities.',
    highlight: 'Enterprise Ready',
  },
  {
    icon: Cpu,
    title: 'ML-Powered Classification',
    description: 'Scikit-learn based fragment classification using byte frequency, entropy, printable ratios, and magic byte signatures.',
    highlight: 'AI Enhanced',
  },
  {
    icon: Database,
    title: 'Relationship Graph',
    description: 'Visual evidence graph showing fragment relationships with signature compatibility, structural similarity, and content analysis.',
    highlight: 'Interactive',
  },
  {
    icon: Brain,
    title: 'Transparent Confidence Scoring',
    description: 'Multi-factor confidence scoring with detailed breakdown: signature compatibility, relationship strength, structural consistency, integrity verification.',
    highlight: 'Explainable AI',
  },
  {
    icon: GitBranch,
    title: 'Audit Trail & Chain of Custody',
    description: 'Complete audit logging with timestamped actions, investigator overrides, hash verification, and tamper detection.',
    highlight: 'Court Admissible',
  },
  {
    icon: FileText,
    title: 'Anti-Forensics Detection',
    description: 'Identifies decoy fragments, encrypted content, hash mismatches, wiped data, fake signatures, and overlapping candidates.',
    highlight: 'Threat Detection',
  },
]

const techStack = [
  { name: 'React 18', category: 'Frontend', color: 'blue' },
  { name: 'Vite 5', category: 'Build Tool', color: 'purple' },
  { name: 'Tailwind CSS', category: 'Styling', color: 'cyan' },
  { name: 'Recharts', category: 'Visualization', color: 'amber' },
  { name: 'FastAPI', category: 'Backend', color: 'green' },
  { name: 'SQLite + SQLAlchemy', category: 'Database', color: 'orange' },
  { name: 'Scikit-learn', category: 'ML/AI', color: 'pink' },
  { name: 'NumPy + Pandas', category: 'Data Processing', color: 'indigo' },
  { name: 'Uvicorn', category: 'ASGI Server', color: 'red' },
]

const COLOR_MAP = {
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  indigo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const workflow = [
  { step: 1, title: 'Dataset Ingestion', desc: 'Upload or generate synthetic fragmented dataset with various file types and anomalies', icon: Upload },
  { step: 2, title: 'Fragment Scanning', desc: 'Byte-level feature extraction including entropy, printable ratios, and frequency analysis', icon: Search },
  { step: 3, title: 'ML Classification', desc: 'File type identification (JPEG, PNG, PDF, DOCX, ZIP, TXT, ENCRYPTED) via heuristic + ML', icon: Brain },
  { step: 4, title: 'Duplicate Detection', desc: 'SHA-256 cryptographic hashing to identify and flag redundant fragments', icon: Hash },
  { step: 5, title: 'Relationship Analysis', desc: 'Multi-factor compatibility scoring: signature, structural, metadata, and content similarity', icon: GitBranch },
  { step: 6, title: 'Candidate Reconstruction', desc: 'Build file candidates from compatible fragment chains with missing fragment inference', icon: Layers },
  { step: 7, title: 'Integrity Verification', desc: 'SHA-256 hash comparison against expected values for tamper detection', icon: Shield },
  { step: 8, title: 'Confidence Scoring', desc: 'Transparent multi-factor scoring with detailed reasoning for each factor', icon: BarChart3 },
  { step: 9, title: 'Investigator Review', desc: 'Accept, reject, flag, or override AI recommendations with full audit trail', icon: Users },
  { step: 10, title: 'Chain of Custody', desc: 'Complete timestamped audit logging with hash values and before/after states', icon: Clock },
]

const demoCapabilities = [
  'Valid fragmented JPEG, PNG, PDF, DOCX, TXT samples with realistic structure',
  'Duplicate fragments with SHA-256 cryptographic verification',
  'Missing fragments inferred during reconstruction chain building',
  'Corrupted fragments with magic byte mismatches and entropy anomalies',
  'Decoy fragments with fake signatures designed to mislead analysis',
  'Overlapping reconstruction candidates sharing common fragments',
  'Encrypted/compressed data indicators (flagged only, never cracked)',
  'Hash mismatch examples demonstrating tamper detection capability',
  'Anti-forensics: wiped data (null bytes), random fill, fake signatures',
]

const securityFeatures = [
  {
    icon: Lock,
    title: 'Authorized Use Only',
    description: 'This prototype operates only on uploaded or synthetic datasets. It does not access live systems, perform credential recovery, password cracking, or unauthorized device acquisition.',
    color: 'blue',
  },
  {
    icon: Eye,
    title: 'Encrypted Data Handling',
    description: 'Encrypted or high-entropy content is identified and flagged for investigator review. No decryption attempts or credential recovery mechanisms are implemented.',
    color: 'amber',
  },
  {
    icon: Shield,
    title: 'Audit Integrity',
    description: 'All investigator actions are logged with timestamps, hash values, and before/after states to maintain chain of custody for forensic admissibility.',
    color: 'green',
  },
  {
    icon: Hash,
    title: 'Hash Verification',
    description: 'SHA-256 integrity checking on all reconstructed files with expected hash comparison for tamper evidence.',
    color: 'purple',
  },
]

export function About() {
  return (
    <div className="page-enter animate-fade-in space-y-8 max-w-6xl">
      {/* Hero Section */}
      <div className="text-center space-y-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary-dim)] via-transparent to-[var(--accent-secondary-dim)] rounded-3xl blur-3xl opacity-50" />
        <div className="relative">
          <div className="inline-flex items-center gap-3 px-6 py-2 glass rounded-full border border-[var(--accent-primary)]/30 mb-6 animate-slide-up">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
            <span className="text-sm font-medium text-[var(--accent-primary)]">Hackathon Prototype • Cybersecurity & AI Track</span>
            <Award className="w-4 h-4 text-[var(--accent-warning)]" />
          </div>
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center mx-auto mb-6 animate-scale-in shadow-2xl glow-primary">
            <Database className="w-12 h-12 text-white" />
          </div>
          <h1 className="font-display font-bold text-5xl lg:text-6xl text-[var(--text-primary)] mb-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
            RecoverAI
          </h1>
          <p className="text-xl lg:text-2xl text-[var(--text-muted)] max-w-3xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
            AI-Assisted Intelligent Data Recovery & Digital Evidence Reconstruction
          </p>
          <div className="flex flex-wrap justify-center gap-3 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <span className="badge badge-high px-4 py-2 text-sm">v1.0.0</span>
            <span className="badge badge-purple px-4 py-2 text-sm">24-Hour Build</span>
            <span className="badge badge-info px-4 py-2 text-sm">7 File Types</span>
            <span className="badge badge-warning px-4 py-2 text-sm">10+ Features</span>
          </div>
        </div>
      </div>

      {/* Project Overview */}
      <div className="card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary-dim)] via-transparent to-[var(--accent-secondary-dim)] opacity-30" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary-dim)] flex items-center justify-center">
              <Shield className="w-6 h-6 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">Project Overview</h2>
              <p className="text-[var(--text-muted)]">Forensic Data Recovery Platform</p>
            </div>
          </div>
          <p className="text-[var(--text-secondary)] leading-relaxed text-lg mb-8">
            RecoverAI is a functional web-based prototype for intelligent data recovery and digital evidence reconstruction.
            Designed for cybersecurity professionals and digital forensics investigators, it goes beyond simple file recovery
            by using AI-assisted analysis to identify relationships between recovered fragments, assess data integrity,
            and provide transparent confidence scoring for reconstructed evidence.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass rounded-xl p-5 text-center group">
              <p className="font-display font-bold text-4xl text-[var(--accent-primary)] mb-1">24h</p>
              <p className="text-[var(--text-muted)]">Development Time</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--accent-primary)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </div>
            <div className="glass rounded-xl p-5 text-center group">
              <p className="font-display font-bold text-4xl text-[var(--accent-secondary)] mb-1">7</p>
              <p className="text-[var(--text-muted)]">Supported File Types</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--accent-secondary)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </div>
            <div className="glass rounded-xl p-5 text-center group">
              <p className="font-display font-bold text-4xl text-[var(--accent-warning)] mb-1">10+</p>
              <p className="text-[var(--text-muted)]">Analysis Features</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--accent-warning)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </div>
          </div>
        </div>
      </div>

      {/* Core Features */}
      <div className="card">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-secondary-dim)] flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-[var(--accent-secondary)]" />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">Core Features</h2>
            <p className="text-[var(--text-muted)]">Advanced capabilities for digital forensics</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <div key={index} className="group relative glass rounded-2xl p-6 border border-[var(--border-primary)] hover:border-[var(--accent-primary)]/50 transition-all duration-300 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)]">
              <div className="absolute top-4 right-4 glass rounded-full px-3 py-1">
                <span className="text-[10px] font-semibold text-[var(--accent-primary)] uppercase tracking-wider">{feature.highlight}</span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent-primary-dim)] flex items-center justify-center mb-5 group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-all duration-300">
                <feature.icon className="w-7 h-7 text-[var(--accent-primary)] group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-display font-semibold text-xl text-[var(--text-primary)] mb-3">{feature.title}</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">{feature.description}</p>
              <div className="flex items-center gap-2 text-[var(--accent-primary)] font-medium">
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                Learn more
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis Workflow */}
      <div className="card">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-warning-dim)] flex items-center justify-center">
            <Zap className="w-6 h-6 text-[var(--accent-warning)]" />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">Analysis Workflow</h2>
            <p className="text-[var(--text-muted)]">End-to-end forensic data recovery pipeline</p>
          </div>
        </div>
        <div className="space-y-4">
          {workflow.map((step, index) => (
            <div key={index} className="group relative flex items-start gap-5 p-5 glass rounded-xl border border-[var(--border-primary)] hover:border-[var(--accent-primary)]/50 transition-all duration-300">
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center font-display font-bold text-lg text-[var(--bg-primary)]">
                  {step.step}
                </div>
                {index < workflow.length - 1 && (
                  <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gradient-to-b from-[var(--accent-primary)] to-transparent" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <step.icon className="w-5 h-5 text-[var(--accent-primary)]" />
                  <h3 className="font-display font-semibold text-lg text-[var(--text-primary)]">{step.title}</h3>
                </div>
                <p className="text-[var(--text-secondary)] ml-8">{step.desc}</p>
              </div>
              <div className="text-[var(--text-muted)] text-sm font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                Step {step.step.toString().padStart(2, '0')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technology Stack */}
      <div className="card">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-purple-dim)] flex items-center justify-center">
            <Code className="w-6 h-6 text-[var(--accent-purple)]" />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">Technology Stack</h2>
            <p className="text-[var(--text-muted)]">Modern, performant, and scalable</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {techStack.map((tech, index) => (
            <span key={index} className={clsx('badge px-4 py-2 flex items-center gap-2', COLOR_MAP[tech.color] || COLOR_MAP.blue)}>
              <Terminal className="w-4 h-4" />
              <span>{tech.name}</span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{tech.category}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Demo Dataset Capabilities */}
      <div className="card">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-secondary-dim)] flex items-center justify-center">
            <Database className="w-6 h-6 text-[var(--accent-secondary)]" />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">Demo Dataset Capabilities</h2>
            <p className="text-[var(--text-muted)]">Synthetic forensic scenarios for demonstration</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {demoCapabilities.map((item, index) => (
            <div key={index} className="group flex items-start gap-4 p-4 glass rounded-xl border border-[var(--border-primary)] hover:border-[var(--accent-primary)]/50 transition-all duration-300">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--accent-primary-dim)] flex items-center justify-center group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-all duration-300">
                <CheckCircle className="w-5 h-5 text-[var(--accent-primary)] group-hover:text-white transition-colors" />
              </div>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Security & Ethics */}
      <div className="card">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-danger-dim)] flex items-center justify-center">
            <Lock className="w-6 h-6 text-[var(--accent-danger)]" />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">Security & Ethics</h2>
            <p className="text-[var(--text-muted)]">Responsible AI for digital forensics</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {securityFeatures.map((feature, index) => (
            <div key={index} className="p-5 glass rounded-xl border-l-4" style={{ borderLeftColor: `var(--accent-${feature.color})` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `var(--accent-${feature.color}-dim)` }}>
                  <feature.icon className="w-5 h-5" style={{ color: `var(--accent-${feature.color})` }} />
                </div>
                <h3 className="font-display font-semibold text-[var(--text-primary)]">{feature.title}</h3>
              </div>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Links & Resources */}
      <div className="card text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary-dim)] via-transparent to-[var(--accent-secondary-dim)] opacity-30" />
        <div className="relative">
          <div className="flex items-center gap-3 justify-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary-dim)] flex items-center justify-center">
              <Github className="w-6 h-6 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">Links & Resources</h2>
              <p className="text-[var(--text-muted)]">Explore the project</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <a href="#" className="btn btn-primary group" target="_blank" rel="noopener noreferrer">
              <Github className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
              Source Code
            </a>
            <a href="#" className="btn btn-secondary group" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Documentation
            </a>
            <a href="#" className="btn btn-secondary group" target="_blank" rel="noopener noreferrer">
              <Twitter className="w-4 h-4 mr-2" />
              Updates
            </a>
          </div>
          <p className="text-[var(--text-muted)] text-sm">
            Built for the Cybersecurity & AI Hackathon Track • AI-Assisted Intelligent Data Recovery
          </p>
        </div>
      </div>
    </div>
  )
}