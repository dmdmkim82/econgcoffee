import {
  useState,
  type FormEvent,
} from 'react'
import {
  fetchStarbucksDrinkCatalog,
  type StarbucksCatalogMenu,
} from '../lib/api'
import {
  type MenuItem,
  type NutritionInfo,
  STARBUCKS_CAFE_NAME,
  type TemperatureOption,
} from '../lib/meeting'
import { formatVisiblePrice } from '../lib/menu'

type MenuPanelProps = {
  menuItems: MenuItem[]
  cafeName: string
  showPrices: boolean
  onAddMenu: (
    name: string,
    price: number,
    availableTemperatures: TemperatureOption[],
  ) => void
  onUpdateMenu: (
    menuItemId: string,
    field: keyof MenuItem,
    value: string | number | TemperatureOption[] | NutritionInfo | null,
  ) => void
  onRemoveMenu: (menuItemId: string) => void
  onLoadLatelierMenu: () => void
  onLoadPaulBassettMenu: () => void
  onLoadStarbucksMenu: (
    menus: StarbucksCatalogMenu[],
    categoryNames: string[],
  ) => void
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
  cafeName,
  showPrices,
  onAddMenu,
  onUpdateMenu,
  onRemoveMenu,
  onLoadLatelierMenu,
  onLoadPaulBassettMenu,
  onLoadStarbucksMenu,
  onTogglePriceVisibility,
}: MenuPanelProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [isLoadingStarbucks, setIsLoadingStarbucks] = useState(false)
  const [availableTemperatures, setAvailableTemperatures] = useState<
    TemperatureOption[]
  >(['HOT', 'ICE'])
  const isStarbucksMeeting = cafeName === STARBUCKS_CAFE_NAME

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

  async function handleLoadStarbucksMenus() {
    setIsLoadingStarbucks(true)

    try {
      const payload = await fetchStarbucksDrinkCatalog()
      const categoryNames = [
        ...new Set(payload.menus.map((menu: StarbucksCatalogMenu) => menu.categoryName)),
      ]
      onLoadStarbucksMenu(payload.menus, categoryNames)
    } catch {
      // 실패 시 사용자에게 알릴 방법 없음 — 버튼이 다시 활성화되므로 재시도 가능
    } finally {
      setIsLoadingStarbucks(false)
    }
  }

  return (
    <section className="panel panel-wide">
      <div className="panel-head">
        <div>
          <span className="panel-kicker">현재 메뉴</span>
          <h2>참석자가 바로 고를 수 있는 메뉴</h2>
        </div>
        <span className="status-pill neutral">{menuItems.length}개 메뉴</span>
      </div>

      <div className="button-row compact-toolbar">
        <button
          className="button secondary small"
          type="button"
          onClick={onLoadLatelierMenu}
        >
          L'atelier 메뉴 불러오기
        </button>
        <button
          className="button secondary small"
          type="button"
          onClick={onLoadPaulBassettMenu}
        >
          폴 바셋 메뉴 불러오기
        </button>
        <button
          className="button secondary small"
          type="button"
          disabled={isLoadingStarbucks}
          onClick={() => { void handleLoadStarbucksMenus() }}
        >
          {isLoadingStarbucks ? '스타벅스 불러오는 중' : '스타벅스 메뉴 불러오기'}
        </button>
        <button
          className="button ghost small"
          type="button"
          onClick={onTogglePriceVisibility}
        >
          {showPrices ? '금액 숨기기' : '금액 보기'}
        </button>
      </div>

      <p className="panel-note">
        현재 카페: {cafeName || '미정'} · 버튼으로 카페별 메뉴를 불러오거나 아래에서
        직접 추가할 수 있습니다.
      </p>
      {menuItems.length === 0 ? (
        <div className="empty-state">
          {isStarbucksMeeting ? (
            <>
              <p>스타벅스 미팅은 메뉴를 먼저 불러와야 주문을 받을 수 있습니다.</p>
              <div className="button-row">
                <button
                  className="button"
                  type="button"
                  disabled={isLoadingStarbucks}
                  onClick={() => { void handleLoadStarbucksMenus() }}
                >
                  {isLoadingStarbucks ? '스타벅스 메뉴를 불러오는 중' : '스타벅스 메뉴 불러오기'}
                </button>
              </div>
            </>
          ) : (
            <>
              아직 등록된 메뉴가 없습니다. 아래 관리 섹션에서 이미지 메뉴를 올리거나
              수동으로 추가해주세요.
            </>
          )}
        </div>
      ) : (
        <div className="catalog-list menu-catalog-board">
          {menuItems.map((item) => (
            <article className="catalog-row menu-catalog-row" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <p>{item.availableTemperatures.join(' / ')}</p>
              </div>
              <strong>{formatVisiblePrice(item.price, showPrices)}</strong>
            </article>
          ))}
        </div>
      )}

      <details className="admin-details">
        <summary>메뉴 직접 수정</summary>
        <div className="admin-details-body">
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
                        Math.max(
                          0,
                          Number(event.target.value.replace(/[^\d]/g, '')),
                        ),
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
        </div>
      </details>
    </section>
  )
}
