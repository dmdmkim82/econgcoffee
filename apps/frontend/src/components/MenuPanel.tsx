import { useState, type FormEvent } from 'react'
import { type MenuItem, type TemperatureOption } from '../lib/meeting'
import { formatVisiblePrice } from '../lib/menu'

type MenuPanelProps = {
  menuItems: MenuItem[]
  showPrices: boolean
  onAddMenu: (
    name: string,
    price: number,
    availableTemperatures: TemperatureOption[],
  ) => void
  onUpdateMenu: (
    menuItemId: string,
    field: keyof MenuItem,
    value: string | number | TemperatureOption[],
  ) => void
  onRemoveMenu: (menuItemId: string) => void
  onLoadPresetMenu: () => void
  onTogglePriceVisibility: () => void
}

const TEMPERATURE_ORDER: TemperatureOption[] = ['HOT', 'ICE']

function toggleTemperatureSelection(
  currentValue: TemperatureOption[],
  target: TemperatureOption,
) {
  const exists = currentValue.includes(target)

  if (exists && currentValue.length === 1) {
    return currentValue
  }

  const nextValue = exists
    ? currentValue.filter((temperature) => temperature !== target)
    : [...currentValue, target]

  return TEMPERATURE_ORDER.filter((temperature) => nextValue.includes(temperature))
}

export function MenuPanel({
  menuItems,
  showPrices,
  onAddMenu,
  onUpdateMenu,
  onRemoveMenu,
  onLoadPresetMenu,
  onTogglePriceVisibility,
}: MenuPanelProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [availableTemperatures, setAvailableTemperatures] = useState<
    TemperatureOption[]
  >(['HOT', 'ICE'])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedPrice = Number(price.replace(/[^\d]/g, ''))

    if (
      !name.trim() ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice <= 0 ||
      availableTemperatures.length === 0
    ) {
      return
    }

    onAddMenu(name.trim(), parsedPrice, availableTemperatures)
    setName('')
    setPrice('')
    setAvailableTemperatures(['HOT', 'ICE'])
  }

  return (
    <section className="panel panel-wide">
      <div className="panel-head">
        <div>
          <span className="panel-kicker">메뉴 관리</span>
          <h2>음료 메뉴 직접 편집</h2>
        </div>
        <span className="status-pill neutral">{menuItems.length}개 메뉴</span>
      </div>

      <div className="button-row compact-toolbar">
        <button className="button secondary small" type="button" onClick={onLoadPresetMenu}>
          이미지 메뉴 추가
        </button>
        <button
          className="button ghost small"
          type="button"
          onClick={onTogglePriceVisibility}
        >
          {showPrices ? '금액 숨기기' : '금액 보기'}
        </button>
      </div>

      <form className="inline-form stacked" onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="수동 메뉴명"
        />
        <input
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder="가격"
          inputMode="numeric"
        />
        <div className="checkbox-group">
          {TEMPERATURE_ORDER.map((temperature) => (
            <label
              className={`checkbox-chip ${
                availableTemperatures.includes(temperature) ? 'active' : ''
              }`}
              key={temperature}
            >
              <input
                checked={availableTemperatures.includes(temperature)}
                type="checkbox"
                onChange={() =>
                  setAvailableTemperatures((currentValue) =>
                    toggleTemperatureSelection(currentValue, temperature),
                  )
                }
              />
              <span>{temperature}</span>
            </label>
          ))}
        </div>
        <button className="button" type="submit">
          메뉴 추가
        </button>
      </form>

      {menuItems.length === 0 ? (
        <div className="empty-state">
          아직 등록된 메뉴가 없습니다. 이미지 메뉴 추가 버튼을 누르거나 직접
          메뉴를 입력해주세요.
        </div>
      ) : (
        <div className="menu-list">
          {menuItems.map((item) => (
            <article className="menu-row" key={item.id}>
              <label className="field">
                <span>메뉴명</span>
                <input
                  value={item.name}
                  onChange={(event) =>
                    onUpdateMenu(item.id, 'name', event.target.value)
                  }
                />
              </label>

              <label className="field">
                <span>가격</span>
                <input
                  value={String(item.price)}
                  inputMode="numeric"
                  onChange={(event) =>
                    onUpdateMenu(
                      item.id,
                      'price',
                      Math.max(0, Number(event.target.value.replace(/[^\d]/g, ''))),
                    )
                  }
                />
                <small>{formatVisiblePrice(item.price, showPrices)}</small>
              </label>

              <div className="field field-full">
                <span>가능 온도</span>
                <div className="checkbox-group">
                  {TEMPERATURE_ORDER.map((temperature) => (
                    <label
                      className={`checkbox-chip ${
                        item.availableTemperatures.includes(temperature)
                          ? 'active'
                          : ''
                      }`}
                      key={`${item.id}-${temperature}`}
                    >
                      <input
                        checked={item.availableTemperatures.includes(temperature)}
                        type="checkbox"
                        onChange={() =>
                          onUpdateMenu(
                            item.id,
                            'availableTemperatures',
                            toggleTemperatureSelection(
                              item.availableTemperatures,
                              temperature,
                            ),
                          )
                        }
                      />
                      <span>{temperature}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="menu-meta">
                <span
                  className={`status-pill ${
                    item.source === 'ocr' ? 'soft' : 'neutral'
                  }`}
                >
                  {item.source === 'ocr' ? 'OCR' : '수동'}
                </span>
                <button
                  className="button ghost small"
                  type="button"
                  onClick={() => onRemoveMenu(item.id)}
                >
                  삭제
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
