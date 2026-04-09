import { useState, type FormEvent } from 'react'
import { type MenuItem } from '../lib/meeting'

type MenuPanelProps = {
  menuItems: MenuItem[]
  onAddMenu: (name: string, price: number) => void
  onUpdateMenu: (menuItemId: string, field: keyof MenuItem, value: string | number) => void
  onRemoveMenu: (menuItemId: string) => void
}

export function MenuPanel({
  menuItems,
  onAddMenu,
  onUpdateMenu,
  onRemoveMenu,
}: MenuPanelProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedPrice = Number(price.replace(/[^\d]/g, ''))

    if (!name.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return
    }

    onAddMenu(name.trim(), parsedPrice)
    setName('')
    setPrice('')
  }

  return (
    <section className="panel panel-wide">
      <div className="panel-head">
        <div>
          <span className="panel-kicker">메뉴 관리</span>
          <h2>메뉴 편집</h2>
        </div>
        <span className="status-pill neutral">{menuItems.length}개 메뉴</span>
      </div>
      <form className="inline-form" onSubmit={handleSubmit}>
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
        <button className="button" type="submit">
          메뉴 추가
        </button>
      </form>
      {menuItems.length === 0 ? (
        <div className="empty-state">
          아직 등록된 메뉴가 없습니다. 메뉴판 사진을 올리거나 직접 메뉴를 추가해주세요.
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
              </label>
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
