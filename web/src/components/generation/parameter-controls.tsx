'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface ParameterControlsProps {
  parameters: Record<string, any>
  onChange: (parameters: Record<string, any>) => void
  generationType: 'text' | 'image' | 'video' | 'audio'
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

  // Different parameters for different generation types
  const getParameters = () => {
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

    // Text generation parameters
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
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">Advanced Settings</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            expanded ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {expanded && (
        <div className="border-t border-gray-200 px-4 py-4 space-y-4 bg-gray-50">
          {params.map((param) => (
            <div key={param.key}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">{param.label}</label>
                {param.type === 'range' && (
                  <span className="text-xs text-gray-500">
                    {(parameters[param.key] ?? param.default).toFixed(2)}
                  </span>
                )}
                {param.type === 'number' && (
                  <span className="text-xs text-gray-500">{parameters[param.key] ?? param.default}</span>
                )}
              </div>

              {param.type === 'select' && 'options' in param && (
                <select
                  value={parameters[param.key] ?? param.default}
                  onChange={(e) => handleChange(param.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {param.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}

              {param.type === 'range' && 'min' in param && (
                <input
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  value={parameters[param.key] ?? param.default}
                  onChange={(e) => handleChange(param.key, parseFloat(e.target.value))}
                  className="w-full"
                />
              )}

              {param.type === 'number' && 'min' in param && (
                <input
                  type="number"
                  min={param.min}
                  max={param.max}
                  value={parameters[param.key] ?? param.default}
                  onChange={(e) => handleChange(param.key, parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              )}

              {'help' in param && param.help && <p className="text-xs text-gray-500 mt-1">{param.help}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
