import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-300">{label}</label>}
      <input
        {...props}
        className={`
          w-full px-3 py-2 bg-gray-800 border rounded-lg text-sm text-gray-100
          placeholder-gray-500 outline-none transition-colors
          focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
          disabled:opacity-50
          ${error ? 'border-red-500' : 'border-gray-700'}
          ${className}
        `}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-300">{label}</label>}
      <textarea
        {...props}
        rows={props.rows ?? 3}
        className={`
          w-full px-3 py-2 bg-gray-800 border rounded-lg text-sm text-gray-100
          placeholder-gray-500 outline-none transition-colors resize-none
          focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
          disabled:opacity-50
          ${error ? 'border-red-500' : 'border-gray-700'}
          ${className}
        `}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
