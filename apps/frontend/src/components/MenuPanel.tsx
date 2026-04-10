import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
import { StarbucksCategorySheet } from './StarbucksCategorySheet'

type MenuPanelProps = {
  menuItems: MenuItem[]
  cafeName: string
  showPrices: boolean
  autoOpenStarbucksCategorySheet?: boolean
  openStarbucksSheetRequestKey?: number
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
  onLoadStarbucksMenu: (
    menus: StarbucksCatalogMenu[],
    categoryNames: string[],
  ) => void
  onTogglePriceVisibility: () => void
}

const TEMPERATURE_ORDER: TemperatureOption[] = ['HOT', 'ICE']

function getStarbucksMenuKey(menu: StarbucksCatalogMenu) {
  return `${menu.categoryName}::${menu.name}`
}

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
  autoOpenStarbucksCategorySheet = false,
  openStarbucksSheetRequestKey = 0,
  onAddMenu,
  onUpdateMenu,
  onRemoveMenu,
  onLoadLatelierMenu,
  onLoadStarbucksMenu,
  onTogglePriceVisibility,
}: MenuPanelProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [isLoadingStarbucks, setIsLoadingStarbucks] = useState(false)
  const [isStarbucksSheetOpen, setIsStarbucksSheetOpen] = useState(false)
  const [starbucksMenus, setStarbucksMenus] = useState<StarbucksCatalogMenu[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedMenuKeys, setSelectedMenuKeys] = useState<string[]>([])
  const [starbucksError, setStarbucksError] = useState('')
  const [availableTemperatures, setAvailableTemperatures] = useState<
    TemperatureOption[]
  >(['HOT', 'ICE'])
  const hasAutoOpenedStarbucksSheet = useRef(false)
  const lastHandledOpenRequestKey = useRef(0)
  const isStarbucksMeeting = cafeName === STARBUCKS_CAFE_NAME

  const starbucksCategories = useMemo(() => {
    const counts = new Map<string, number>()

    for (const menu of starbucksMenus) {
      counts.set(menu.categoryName, (counts.get(menu.categoryName) ?? 0) + 1)
    }

    return [...counts.entries()]
      .map(([categoryName, count]) => ({
        name: categoryName,
        count,
      }))
      .sort((left, right) => left.name.localeCompare(right.name, 'ko-KR'))
  }, [starbucksMenus])

  const filteredStarbucksMenus = useMemo(
    () =>
      starbucksMenus.filter((menu) => selectedCategories.includes(menu.categoryName)),
    [selectedCategories, starbucksMenus],
  )

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

  const handleOpenStarbucksSheet = useCallback(async () => {
    if (starbucksMenus.length > 0) {
      setIsStarbucksSheetOpen(true)
      return
    }

    setIsLoadingStarbucks(true)
    setStarbucksError('')

    try {
      const payload = await fetchStarbucksDrinkCatalog()
      const nextSelectedCategories = [
        ...new Set(payload.menus.map((menu) => menu.categoryName)),
      ].sort((left, right) => left.localeCompare(right, 'ko-KR'))
      setStarbucksMenus(payload.menus)
      setSelectedCategories(nextSelectedCategories)
      setSelectedMenuKeys(payload.menus.map(getStarbucksMenuKey))
      setIsStarbucksSheetOpen(true)
    } catch {
      setStarbucksError('스타벅스 메뉴를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsLoadingStarbucks(false)
    }
  }, [starbucksMenus.length])

  function handleToggleCategory(categoryName: string) {
    const categoryMenuKeys = starbucksMenus
      .filter((menu) => menu.categoryName === categoryName)
      .map(getStarbucksMenuKey)

    setSelectedCategories((currentCategories) => {
      const nextCategories = currentCategories.includes(categoryName)
        ? currentCategories.filter((item) => item !== categoryName)
        : [...currentCategories, categoryName].sort((left, right) =>
            left.localeCompare(right, 'ko-KR'),
          )

      setSelectedMenuKeys((currentMenuKeys) => {
        if (currentCategories.includes(categoryName)) {
          return currentMenuKeys.filter((menuKey) => !categoryMenuKeys.includes(menuKey))
        }

        return [...new Set([...currentMenuKeys, ...categoryMenuKeys])]
      })

      return nextCategories
    })
  }

  function handleToggleMenu(menuKey: string) {
    setSelectedMenuKeys((currentMenuKeys) =>
      currentMenuKeys.includes(menuKey)
        ? currentMenuKeys.filter((item) => item !== menuKey)
        : [...currentMenuKeys, menuKey],
    )
  }

  function handleConfirmStarbucksCategories() {
    const filteredMenus = starbucksMenus.filter((menu) =>
      selectedCategories.includes(menu.categoryName) &&
      selectedMenuKeys.includes(getStarbucksMenuKey(menu)),
    )

    onLoadStarbucksMenu(filteredMenus, selectedCategories)
    setIsStarbucksSheetOpen(false)
  }

  useEffect(() => {
    if (
      hasAutoOpenedStarbucksSheet.current ||
      (!autoOpenStarbucksCategorySheet &&
        !(isStarbucksMeeting && menuItems.length === 0))
    ) {
      return
    }

    hasAutoOpenedStarbucksSheet.current = true
    void handleOpenStarbucksSheet()
  }, [
    autoOpenStarbucksCategorySheet,
    handleOpenStarbucksSheet,
    isStarbucksMeeting,
    menuItems.length,
  ])

  useEffect(() => {
    if (
      openStarbucksSheetRequestKey <= 0 ||
      openStarbucksSheetRequestKey === lastHandledOpenRequestKey.current
    ) {
      return
    }

    lastHandledOpenRequestKey.current = openStarbucksSheetRequestKey
    void handleOpenStarbucksSheet()
  }, [handleOpenStarbucksSheet, openStarbucksSheetRequestKey])

  return (
    <>
      <StarbucksCategorySheet
        open={isStarbucksSheetOpen}
        loading={isLoadingStarbucks}
        error={starbucksError}
        categories={starbucksCategories}
        menus={filteredStarbucksMenus.map((menu) => ({
          key: getStarbucksMenuKey(menu),
          name: menu.name,
          categoryName: menu.categoryName,
          availableTemperatures: menu.availableTemperatures,
        }))}
        selectedCategories={selectedCategories}
        selectedMenuKeys={selectedMenuKeys}
        onClose={() => setIsStarbucksSheetOpen(false)}
        onToggleCategory={handleToggleCategory}
        onSelectAll={() => {
          setSelectedCategories(starbucksCategories.map((category) => category.name))
          setSelectedMenuKeys(starbucksMenus.map(getStarbucksMenuKey))
        }}
        onClearAll={() => {
          setSelectedCategories([])
          setSelectedMenuKeys([])
        }}
        onToggleMenu={handleToggleMenu}
        onSelectAllMenus={() =>
          setSelectedMenuKeys((currentMenuKeys) => [
            ...new Set([
              ...currentMenuKeys,
              ...filteredStarbucksMenus.map(getStarbucksMenuKey),
            ]),
          ])
        }
        onClearMenus={() =>
          setSelectedMenuKeys((currentMenuKeys) =>
            currentMenuKeys.filter(
              (menuKey) =>
                !filteredStarbucksMenus
                  .map(getStarbucksMenuKey)
                  .includes(menuKey),
            ),
          )
        }
        onConfirm={handleConfirmStarbucksCategories}
      />

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
            disabled={isLoadingStarbucks}
            onClick={() => {
              void handleOpenStarbucksSheet()
            }}
          >
            {isLoadingStarbucks
              ? '스타벅스 불러오는 중'
              : '스타벅스 카테고리 선택'}
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
          현재 카페: {cafeName || '미정'} · 스타벅스 메뉴는 카테고리별로 골라서 불러올 수
          있고, 가격은 공식 사이트에 없어 `가격 미정`으로 들어옵니다.
        </p>
        {menuItems.length === 0 ? (
          <div className="empty-state">
            {isStarbucksMeeting ? (
              <>
                <p>스타벅스 미팅은 먼저 카테고리와 메뉴를 골라야 주문을 받을 수 있습니다.</p>
                <div className="button-row">
                  <button
                    className="button"
                    type="button"
                    disabled={isLoadingStarbucks}
                    onClick={() => {
                      void handleOpenStarbucksSheet()
                    }}
                  >
                    {isLoadingStarbucks ? '스타벅스 메뉴를 불러오는 중' : '스타벅스 메뉴 선택'}
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
    </>
  )
}
