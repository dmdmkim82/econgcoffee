import { useId } from 'react'
import { type TemperatureOption } from '../lib/meeting'

type TemperatureSelectorProps = {
  availableTemperatures: TemperatureOption[]
  value: '' | TemperatureOption
  disabled?: boolean
  onChange: (value: '' | TemperatureOption) => void
}

export function TemperatureSelector({
  availableTemperatures,
  value,
  disabled = false,
  onChange,
}: TemperatureSelectorProps) {
  const baseId = useId()

  if (availableTemperatures.length === 0) {
    return <p className="field-disabled-note">선택 가능한 온도가 없습니다.</p>
  }

  return (
    <div className="checkbox-group temperature-group">
      {availableTemperatures.map((temperature) => {
        const inputId = `${baseId}-${temperature}`

        return (
          <label
            className={`checkbox-chip ${value === temperature ? 'active' : ''}`}
            htmlFor={inputId}
            key={temperature}
          >
            <input
              checked={value === temperature}
              disabled={disabled}
              id={inputId}
              type="checkbox"
              onChange={(event) =>
                onChange(event.target.checked ? temperature : '')
              }
            />
            <span>{temperature}</span>
          </label>
        )
      })}
    </div>
  )
}
