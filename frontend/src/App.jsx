import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { DatasetAnalysis } from './pages/DatasetAnalysis'
import { Fragments } from './pages/Fragments'
import { Reconstructions } from './pages/Reconstructions'
import { EvidenceGraph } from './pages/EvidenceGraph'
import { AuditLog } from './pages/AuditLog'
import { About } from './pages/About'
import { DatasetProvider } from './context/DatasetContext'
import api from './utils/api'

function DatasetFeatureRoute({ feature }) {
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, error: null })

  useEffect(() => {
    let active = true
    api.get('/datasets')
      .then(({ data }) => {
        if (!active) return
        if (data.length > 0) {
          navigate(`/${feature}/${data[0].id}`, { replace: true })
        } else {
          setState({ loading: false, error: 'No dataset is available yet. Load a demo dataset from the dashboard first.' })
        }
      })
      .catch((error) => {
        if (active) setState({ loading: false, error: error.message })
      })
    return () => { active = false }
  }, [feature, navigate])

  if (state.loading) {
    return <div className="card min-h-48 flex items-center justify-center text-[var(--text-muted)]">Loading dataset...</div>
  }

  return (
    <div className="card max-w-2xl">
      <h1 className="font-display font-bold text-2xl text-[var(--text-primary)]">Dataset required</h1>
      <p className="mt-2 text-[var(--text-secondary)]">{state.error}</p>
      <button onClick={() => navigate('/')} className="btn btn-primary mt-6">Back to Dashboard</button>
    </div>
  )
}

function App() {
  return (
    <DatasetProvider>
      <div className="min-h-screen bg-dark-bg flex">
        <Sidebar />
        <main className="flex-1 min-w-0 ml-72 transition-all duration-300 min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8 min-w-0">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dataset" element={<DatasetFeatureRoute feature="dataset" />} />
              <Route path="/fragments" element={<DatasetFeatureRoute feature="fragments" />} />
              <Route path="/reconstructions" element={<DatasetFeatureRoute feature="reconstructions" />} />
              <Route path="/graph" element={<DatasetFeatureRoute feature="graph" />} />
              <Route path="/audit" element={<DatasetFeatureRoute feature="audit" />} />
              <Route path="/dataset/:id" element={<DatasetAnalysis />} />
              <Route path="/fragments/:id" element={<Fragments />} />
              <Route path="/reconstructions/:id" element={<Reconstructions />} />
              <Route path="/graph/:id" element={<EvidenceGraph />} />
              <Route path="/audit/:id" element={<AuditLog />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </div>
        </main>
      </div>
    </DatasetProvider>
  )
}

export default App