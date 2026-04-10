import { useEffect } from 'react'
import { type MenuItem } from '../lib/meeting'

type MenuNutritionSheetProps = {
  menuItem: MenuItem | null
  open: boolean
  onClose: () => void
}

const NUTRITION_FIELDS = [
  { key: 'caloriesKcal', label: '칼로리', unit: 'Kcal' },
  { key: 'sugarG', label: '당류', unit: 'g' },
  { key: 'proteinG', label: '단백질', unit: 'g' },
  { key: 'sodiumMg', label: '나트륨', unit: 'mg' },
  { key: 'saturatedFatG', label: '포화지방', unit: 'g' },
  { key: 'caffeineMg', label: '카페인', unit: 'mg' },
] as const satisfies Array<{
  key: keyof NonNullable<MenuItem['nutritionInfo']>
  label: string
  unit: string
}>

function formatNutritionValue(value: number) {
  if (Number.isInteger(value)) {
    return String(value)
  }

  return value.toFixed(1)
}

export function MenuNutritionSheet({
  menuItem,
  open,
  onClose,
}: MenuNutritionSheetProps) {
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

  if (!open || !menuItem) {
    return null
  }

  const nutritionInfo = menuItem.nutritionInfo

  return (
    <div className="summary-sheet-overlay" role="presentation" onClick={onClose}>
      <section
        aria-label="영양정보"
        aria-modal="true"
        className="summary-sheet menu-nutrition-sheet"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="summary-sheet-head">
          <div>
            <span className="panel-kicker">영양정보</span>
            <h2>{menuItem.name}</h2>
          </div>
          <button className="button ghost small" type="button" onClick={onClose}>
            닫기
          </button>
        </div>

        <p className="panel-note">
          메뉴 1잔 기준 영양정보입니다. 실제 제조 방식에 따라 차이가 있을 수 있습니다.
        </p>

        {nutritionInfo ? (
          <div className="nutrition-grid">
            {NUTRITION_FIELDS.map((field) => (
              <article className="nutrition-card" key={field.key}>
                <span>{field.label}</span>
                <strong>
                  {formatNutritionValue(nutritionInfo[field.key])}
                  <small>{field.unit}</small>
                </strong>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state compact">
            아직 등록된 영양정보가 없습니다. 메뉴 데이터가 쌓이면 자동으로 함께 보여줄 수
            있습니다.
          </div>
        )}
      </section>
    </div>
  )
}
