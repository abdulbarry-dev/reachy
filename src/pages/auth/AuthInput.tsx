import { Form } from 'react-bootstrap'

interface AuthInputProps {
  label: string
  icon: string
  type: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  minLength?: number
  required?: boolean
  autoComplete?: string
}

/**
 * Labelled input with a leading icon.
 *
 * The label is a real `<Form.Label>` bound by `htmlFor` to an id derived from
 * the label text, so every field on every auth screen is announced correctly.
 */
export function AuthInput({ label, icon, type, placeholder, value, onChange, minLength, required, autoComplete }: AuthInputProps) {
  // Slug the label so ids are valid (no spaces/uppercase) and label/for still pair.
  const inputId = `auth-${label.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div className="auth-input-wrap">
      <Form.Label htmlFor={inputId}>{label}</Form.Label>
      <div className="auth-input-inner">
        <i className={`bi ${icon} auth-input-icon`} />
        <Form.Control
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="auth-input"
          minLength={minLength}
          required={required}
          autoComplete={autoComplete}
        />
      </div>
    </div>
  )
}
