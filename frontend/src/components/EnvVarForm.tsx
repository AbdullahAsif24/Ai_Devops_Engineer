import { useState, type FormEvent } from 'react'
import { AlertIcon, PlusIcon, TrashIcon } from './icons'

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
    Object.entries(initialVars).map(([key, value]) => ({ key, value })),
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

  const handleSubmit = (e: FormEvent) => {
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
          `Invalid key "${envVar.key}": must start with letter or underscore, contain only letters, numbers, and underscores`,
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
    <div className="view-in card p-5 sm:p-6">
      <h3 className="text-base font-semibold tracking-tight">Environment variables</h3>
      <p className="mt-1 max-w-xl text-sm text-muted">
        These are injected during deployment on Vercel or Render and are available to your running app.
      </p>

      {errors.length > 0 && (
        <div role="alert" className="mt-4 flex gap-2.5 rounded-lg bg-bad-soft p-3 text-sm text-bad-text ring-1 ring-inset ring-bad/30">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <ul className="min-w-0 space-y-1 break-words">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        {envVars.length === 0 && (
          <p className="rounded-lg border border-dashed border-line-strong px-4 py-5 text-center text-sm text-muted">
            No variables yet. Add one to pass secrets or config to your app.
          </p>
        )}

        {envVars.map((envVar, index) => (
          <div key={index} className="view-in flex items-center gap-2">
            <input
              type="text"
              aria-label={`Variable ${index + 1} name`}
              placeholder="DATABASE_URL"
              value={envVar.key}
              onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="input min-w-0 flex-1 font-mono text-[13px]"
            />
            <input
              type="text"
              aria-label={`Variable ${index + 1} value`}
              placeholder="Value"
              value={envVar.value}
              onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="input min-w-0 flex-[1.4] font-mono text-[13px]"
            />
            <button
              type="button"
              onClick={() => removeEnvVar(index)}
              aria-label={`Remove variable ${index + 1}`}
              className="btn btn-ghost btn-danger btn-icon shrink-0"
            >
              <TrashIcon />
            </button>
          </div>
        ))}

        <button type="button" onClick={addEnvVar} className="btn btn-ghost btn-sm -ml-2 text-accent-text">
          <PlusIcon className="h-4 w-4" />
          Add variable
        </button>

        <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => setEnvVars([])} className="btn btn-secondary">
            Clear all
          </button>
          <button type="submit" className="btn btn-primary">
            Save variables
          </button>
        </div>
      </form>
    </div>
  )
}
