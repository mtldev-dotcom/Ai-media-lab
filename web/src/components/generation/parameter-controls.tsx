'use client'

import { useState } from 'react'
import { ChevronDown, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ParameterControlsProps {
  parameters: Record<string, any>
  onChange: (parameters: Record<string, any>) => void
  generationType: 'text' | 'image' | 'video' | 'audio'
}

interface ParamConfig {
  key: string
  label: string
  type: 'select' | 'range' | 'number'
  options?: string[]
  min?: number
  max?: number
  step?: number
  default: any
  help?: string
}

export function ParameterControls({
  parameters,
  onChange,
  generationType,
}: ParameterControlsProps) {
  const [expanded, setExpanded] = useState(false)

  const handleChange = (key: string, value: any) => {
    onChange({ ...parameters, [key]: value })
  }

  const getParameters = (): ParamConfig[] => {
    if (generationType === 'image') {
      return [
        {
          key: 'size',
          label: 'Image Size',
          type: 'select',
          options: ['256x256', '512x512', '1024x1024', '1024x1792', '1792x1024'],
          default: '1024x1024',
        },
        {
          key: 'quality',
          label: 'Quality',
          type: 'select',
          options: ['standard', 'hd'],
          default: 'standard',
        },
        {
          key: 'style',
          label: 'Style',
          type: 'select',
          options: ['natural', 'vivid'],
          default: 'natural',
        },
      ]
    }

    return [
      {
        key: 'temperature',
        label: 'Temperature',
        type: 'range',
        min: 0,
        max: 2,
        step: 0.1,
        default: 0.7,
        help: 'Higher = more creative, Lower = more focused',
      },
      {
        key: 'max_tokens',
        label: 'Max Tokens',
        type: 'number',
        min: 100,
        max: 4000,
        default: 1000,
        help: 'Maximum length of the response',
      },
      {
        key: 'top_p',
        label: 'Top P',
        type: 'range',
        min: 0,
        max: 1,
        step: 0.05,
        default: 0.9,
        help: 'Controls diversity via nucleus sampling',
      },
    ]
  }

  const params = getParameters()

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Advanced Settings
          </span>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-400 transition-transform',
            expanded && 'rotate-180'
          )}
        />
      </button>

      {expanded && (
        <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-4 space-y-4 bg-slate-50 dark:bg-slate-800/30">
          {params.map((param) => (
            <div key={param.key}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {param.label}
                </label>
                {param.type === 'range' && (
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {(parameters[param.key] ?? param.default).toFixed(param.step && param.step < 0.1 ? 2 : 1)}
                  </span>
                )}
                {param.type === 'number' && (
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {parameters[param.key] ?? param.default}
                  </span>
                )}
              </div>

              {param.type === 'select' && param.options && (
                <select
                  value={parameters[param.key] ?? param.default}
                  onChange={(e) => handleChange(param.key, e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {param.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}

              {param.type === 'range' && param.min !== undefined && (
                <input
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  value={parameters[param.key] ?? param.default}
                  onChange={(e) => handleChange(param.key, parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              )}

              {param.type === 'number' && param.min !== undefined && (
                <input
                  type="number"
                  min={param.min}
                  max={param.max}
                  value={parameters[param.key] ?? param.default}
                  onChange={(e) => handleChange(param.key, parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              {param.help && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{param.help}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
