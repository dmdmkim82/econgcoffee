import { useEffect, useMemo } from 'react'

type StarbucksCategorySheetProps = {
  open: boolean
  loading: boolean
  categories: Array<{
    name: string
    count: number
  }>
  menus: Array<{
    key: string
    name: string
    categoryName: string
    availableTemperatures: string[]
  }>
  selectedCategories: string[]
  selectedMenuKeys: string[]
  onClose: () => void
  onToggleCategory: (categoryName: string) => void
  onSelectAll: () => void
  onClearAll: () => void
  onToggleMenu: (menuKey: string) => void
  onSelectAllMenus: () => void
  onClearMenus: () => void
  onConfirm: () => void
}

export function StarbucksCategorySheet({
  open,
  loading,
  categories,
  menus,
  selectedCategories,
  selectedMenuKeys,
  onClose,
  onToggleCategory,
  onSelectAll,
  onClearAll,
  onToggleMenu,
  onSelectAllMenus,
  onClearMenus,
  onConfirm,
}: StarbucksCategorySheetProps) {
  const menuGroups = useMemo(() => {
    const groups = new Map<
      string,
      Array<{
        key: string
        name: string
        availableTemperatures: string[]
      }>
    >()

    for (const menu of menus) {
      const currentGroup = groups.get(menu.categoryName) ?? []
      currentGroup.push({
        key: menu.key,
        name: menu.name,
        availableTemperatures: menu.availableTemperatures,
      })
      groups.set(menu.categoryName, currentGroup)
    }

    return [...groups.entries()].map(([categoryName, items]) => ({
      categoryName,
      items,
    }))
  }, [menus])

  useEffect(() => {
    if (!open) {
      return undefined
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div className="summary-sheet-overlay" role="presentation" onClick={onClose}>
      <section
        aria-label="스타벅스 카테고리 선택"
        aria-modal="true"
        className="summary-sheet category-sheet"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="summary-sheet-head">
          <div>
            <span className="panel-kicker">스타벅스 메뉴</span>
            <h2>불러올 카테고리를 골라주세요</h2>
          </div>
          <button className="button ghost small" type="button" onClick={onClose}>
            닫기
          </button>
        </div>

        <p className="panel-note">
          필요한 카테고리만 선택해서 메뉴를 줄일 수 있습니다.
        </p>

        <div className="button-row">
          <button className="button ghost small" type="button" onClick={onSelectAll}>
            카테고리 전체 선택
          </button>
          <button className="button ghost small" type="button" onClick={onClearAll}>
            카테고리 전체 해제
          </button>
        </div>

        {loading ? (
          <div className="empty-state compact">스타벅스 카테고리를 불러오는 중입니다.</div>
        ) : categories.length === 0 ? (
          <div className="empty-state compact">불러올 스타벅스 카테고리가 없습니다.</div>
        ) : (
          <div className="category-sheet-list">
            {categories.map((category) => (
              <button
                className={`category-sheet-item ${
                  selectedCategories.includes(category.name) ? 'active' : ''
                }`}
                key={category.name}
                type="button"
                onClick={() => onToggleCategory(category.name)}
              >
                <div>
                  <strong>{category.name}</strong>
                  <span>{category.count}개 메뉴</span>
                </div>
                <em>{selectedCategories.includes(category.name) ? '선택됨' : '선택'}</em>
              </button>
            ))}
          </div>
        )}

        <div className="subhead">
          <h3>메뉴 개별 선택</h3>
          <span>
            {selectedMenuKeys.length}개 선택 / {menus.length}개 표시
          </span>
        </div>

        <div className="button-row">
          <button
            className="button ghost small"
            type="button"
            disabled={loading || menus.length === 0}
            onClick={onSelectAllMenus}
          >
            표시 메뉴 전체 선택
          </button>
          <button
            className="button ghost small"
            type="button"
            disabled={loading || menus.length === 0}
            onClick={onClearMenus}
          >
            표시 메뉴 전체 해제
          </button>
        </div>

        {loading ? (
          <div className="empty-state compact">메뉴 목록을 준비하고 있습니다.</div>
        ) : menus.length === 0 ? (
          <div className="empty-state compact">
            먼저 카테고리를 선택하면 해당 메뉴를 개별로 고를 수 있습니다.
          </div>
        ) : (
          <div className="category-menu-groups">
            {menuGroups.map((group) => (
              <section className="category-menu-group" key={group.categoryName}>
                <div className="subhead">
                  <h3>{group.categoryName}</h3>
                  <span>{group.items.length}개 메뉴</span>
                </div>
                <div className="category-menu-list">
                  {group.items.map((menu) => (
                    <button
                      className={`category-menu-item ${
                        selectedMenuKeys.includes(menu.key) ? 'active' : ''
                      }`}
                      key={menu.key}
                      type="button"
                      onClick={() => onToggleMenu(menu.key)}
                    >
                      <div>
                        <strong>{menu.name}</strong>
                        <span>{menu.availableTemperatures.join(' / ')}</span>
                      </div>
                      <em>
                        {selectedMenuKeys.includes(menu.key) ? '선택됨' : '선택'}
                      </em>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="summary-sheet-footer">
          <button className="button secondary" type="button" onClick={onClose}>
            취소
          </button>
          <button
            className="button"
            type="button"
            disabled={
              loading || selectedCategories.length === 0 || selectedMenuKeys.length === 0
            }
            onClick={onConfirm}
          >
            선택한 메뉴 불러오기
          </button>
        </div>
      </section>
    </div>
  )
}
