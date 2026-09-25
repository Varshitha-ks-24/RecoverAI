import { createContext, useContext, useState, useCallback } from 'react'
import api from '../utils/api'

const DatasetContext = createContext(null)

export function DatasetProvider({ children }) {
  const [currentDataset, setCurrentDataset] = useState(null)
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchDatasets = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/datasets')
      setDatasets(response.data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDataset = useCallback(async (id) => {
    try {
      setLoading(true)
      const response = await api.get(`/datasets/${id}`)
      setCurrentDataset(response.data)
      setError(null)
      return response.data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createDemoDataset = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.post('/datasets/demo')
      await fetchDatasets()
      return response.data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchDatasets])

  const uploadDataset = useCallback(async (file, name, description) => {
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', name)
      formData.append('description', description)
      const response = await api.post('/datasets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      await fetchDatasets()
      return response.data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchDatasets])

  const uploadDatasetBatch = useCallback(async (files, name, description, source) => {
    try {
      setLoading(true)
      const formData = new FormData()
      files.forEach((file) => formData.append('files', file, file.name))
      formData.append('name', name)
      formData.append('description', description)
      formData.append('source', source)
      const response = await api.post('/datasets/upload-batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      await fetchDatasets()
      return response.data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchDatasets])

  const clearCurrentDataset = useCallback(() => {
    setCurrentDataset(null)
  }, [])

  const value = {
    currentDataset,
    datasets,
    loading,
    error,
    fetchDatasets,
    loadDataset,
    createDemoDataset,
    uploadDataset,
    uploadDatasetBatch,
    clearCurrentDataset,
  }

  return (
    <DatasetContext.Provider value={value}>
      {children}
    </DatasetContext.Provider>
  )
}

export function useDataset() {
  const context = useContext(DatasetContext)
  if (!context) {
    throw new Error('useDataset must be used within a DatasetProvider')
  }
  return context
}