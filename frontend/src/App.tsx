import { useEffect, useState } from 'react'
import { apiUrl } from './api/config'
import './App.css'

type HealthResponse = {
  status: string
  application: string
  message: string
}

type LoadState =
  | { status: 'loading' }
  | { status: 'success'; data: HealthResponse }
  | { status: 'error'; message: string }

function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    async function checkHealth() {
      try {
        const response = await fetch(apiUrl('/api/health'), {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = (await response.json()) as HealthResponse
        setState({ status: 'success', data })
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        const message =
          error instanceof Error ? error.message : 'Unable to reach backend'
        setState({ status: 'error', message })
      }
    }

    void checkHealth()

    return () => controller.abort()
  }, [])

  return (
    <main className="page">
      <h1>ShopSphere</h1>
      <p className="subtitle">Frontend foundation</p>

      <section className="panel" aria-live="polite">
        <h2>Backend health</h2>

        {state.status === 'loading' && <p>Checking backend…</p>}

        {state.status === 'success' && (
          <dl className="health">
            <div>
              <dt>Status</dt>
              <dd>{state.data.status}</dd>
            </div>
            <div>
              <dt>Application</dt>
              <dd>{state.data.application}</dd>
            </div>
            <div>
              <dt>Message</dt>
              <dd>{state.data.message}</dd>
            </div>
          </dl>
        )}

        {state.status === 'error' && (
          <p className="error">
            Backend unreachable ({state.message}). Start the Spring Boot app on
            port 8080, then refresh.
          </p>
        )}
      </section>
    </main>
  )
}

export default App
