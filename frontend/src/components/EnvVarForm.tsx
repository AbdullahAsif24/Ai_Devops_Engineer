import { useState } from 'react'

interface EnvVar {
  key: string
  value: string
}

interface EnvVarFormProps {
  onSubmit: (envVars: Record<string, string>) => void
  initialVars?: Record<string, string>
}

export function EnvVarForm({ onSubmit, initialVars = {} }: EnvVarFormProps) {
  const [envVars, setEnvVars] = useState<EnvVar[]>(
    Object.entries(initialVars).map(([key, value]) => ({ key, value }))
  )
  const [errors, setErrors] = useState<string[]>([])

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }])
  }

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index))
  }

  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...envVars]
    updated[index][field] = value
    setEnvVars(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    // Validate
    const validationErrors: string[] = []
    const envVarMap: Record<string, string> = {}

    envVars.forEach((envVar, index) => {
      if (!envVar.key.trim()) {
        validationErrors.push(`Environment variable ${index + 1} key cannot be empty`)
        return
      }

      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(envVar.key)) {
        validationErrors.push(
          `Invalid key "${envVar.key}": must start with letter or underscore, contain only letters, numbers, and underscores`
        )
        return
      }

      if (envVar.key.length > 100) {
        validationErrors.push(`Key "${envVar.key}" exceeds 100 character limit`)
        return
      }

      if (envVar.value.length > 10000) {
        validationErrors.push(`Value for "${envVar.key}" exceeds 10000 character limit`)
        return
      }

      if (envVarMap[envVar.key]) {
        validationErrors.push(`Duplicate key "${envVar.key}"`)
        return
      }

      envVarMap[envVar.key] = envVar.value
    })

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    onSubmit(envVarMap)
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Environment Variables</h3>
      <p className="text-sm text-slate-400 mb-4">
        Add environment variables that will be injected during deployment. These are
        platform-specific (Vercel/Render) and will be available to your deployed application.
      </p>

      {errors.length > 0 && (
        <div className="mb-4 rounded-lg bg-rose-500/10 px-4 py-2 text-xs text-rose-300 ring-1 ring-rose-500/30">
          {errors.map((error, i) => (
            <div key={i}>• {error}</div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {envVars.map((envVar, index) => (
          <div key={index} className="flex gap-2 items-start">
            <div className="flex-1">
              <input
                type="text"
                placeholder="KEY"
                value={envVar.key}
                onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="VALUE"
                value={envVar.value}
                onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              type="button"
              onClick={() => removeEnvVar(index)}
              className="mt-1 rounded-lg p-2 text-slate-400 transition hover:text-rose-400 hover:bg-rose-500/10"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addEnvVar}
          className="flex items-center gap-2 text-sm text-indigo-400 transition hover:text-indigo-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Environment Variable
        </button>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Save Environment Variables
          </button>
          <button
            type="button"
            onClick={() => setEnvVars([])}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            Clear All
          </button>
        </div>
      </form>
    </div>
  )
}