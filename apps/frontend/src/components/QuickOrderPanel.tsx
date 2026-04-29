import { useMemo, useState } from 'react'
import {
  getMenuDisplayPrice,
  isCoffeeMenuName,
  type Attendee,
  type MenuItem,
  type Snapshot,
} from '../lib/meeting'
import { formatVisiblePrice } from '../lib/menu'
import { MenuNutritionSheet } from './MenuNutritionSheet'
import { TemperatureSelector } from './TemperatureSelector'

type QuickOrderPanelProps = {
  snapshot: Snapshot
  meetingClosed: boolean
  showPrices: boolean
  variant?: 'organizer' | 'participant'
  onAddAttendee: (name: string, team: string) => string
  onUpdateAttendee: (
    attendeeId: string,
    field: keyof Attendee,
    value: string | number | boolean,
  ) => void
  onSkipAttendee: (attendeeId: string, skipped: boolean) => void
  onCompleteOrder: (attendeeId: string, attendeeName: string) => void
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ko-KR')
}

function getAttendeeStatus(attendee: Attendee) {
  if (attendee.skipped) {
    return {
      tone: 'skip',
      label: '미주문',
      chipClass: 'skipped',
    }
  }

  if (attendee.orderCompleted) {
    return {
      tone: 'live',
      label: '주문 완료',
      chipClass: 'completed',
    }
  }

  if (attendee.menuItemId) {
    return {
      tone: 'soft',
      label: '선택 중',
      chipClass: 'in-progress',
    }
  }

  return {
    tone: 'neutral',
    label: '선택 전',
    chipClass: 'pending',
  }
}

function getAttendeeOrderRank(attendee: Attendee) {
  if (attendee.skipped) return 3
  if (attendee.orderCompleted) return 2
  if (attendee.menuItemId) return 1
  return 0
}

function sortAttendeesByStatus<T extends Attendee>(attendees: T[]) {
  return [...attendees].sort((left, right) => {
    const diff = getAttendeeOrderRank(left) - getAttendeeOrderRank(right)
    if (diff !== 0) return diff
    return left.name.localeCompare(right.name, 'ko-KR')
  })
}

export function QuickOrderPanel({
  snapshot,
  meetingClosed,
  showPrices,
  variant = 'participant',
  onAddAttendee,
  onUpdateAttendee,
  onSkipAttendee,
  onCompleteOrder,
}: QuickOrderPanelProps) {
  const { meeting, attendees, menuItems } = snapshot
  const [selectedAttendeeId, setSelectedAttendeeId] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [nutritionMenuId, setNutritionMenuId] = useState('')
  const [isAddingAttendee, setIsAddingAttendee] = useState(false)
  const [menuSearch, setMenuSearch] = useState('')
  const isParticipantView = variant === 'participant'

  const matchedAttendee = useMemo(() => {
    const normalizedInput = normalizeName(nameInput)

    if (!normalizedInput) {
      return null
    }

    return (
      attendees.find(
        (attendee) => normalizeName(attendee.name) === normalizedInput,
      ) ?? null
    )
  }, [attendees, nameInput])

  const selectedAttendeeById =
    attendees.find((attendee) => attendee.id === selectedAttendeeId) ?? null
  const activeAttendee = matchedAttendee ?? selectedAttendeeById ?? null
  const activeAttendeeId = activeAttendee?.id ?? ''
  const selectedMenu = menuItems.find((item) => item.id === activeAttendee?.menuItemId)
  const nutritionMenu =
    menuItems.find((item) => item.id === nutritionMenuId) ?? null
  const canUseDecaf = Boolean(selectedMenu && isCoffeeMenuName(selectedMenu.name))
  const orderReady = Boolean(activeAttendee || nameInput.trim())
  const fieldsDisabled = meetingClosed || !orderReady || Boolean(activeAttendee?.skipped)
  const canCompleteOrder = Boolean(
    activeAttendee &&
      (activeAttendee.skipped ||
        (selectedMenu && activeAttendee.temperature)),
  )

  const filteredMenuItems = useMemo(() => {
    const q = menuSearch.trim().replace(/\s/g, '').toLowerCase()
    if (!q) return menuItems
    return menuItems.filter((item) =>
      item.name.replace(/\s/g, '').toLowerCase().includes(q),
    )
  }, [menuItems, menuSearch])

  const sortedAttendees = useMemo(
    () => sortAttendeesByStatus(attendees),
    [attendees],
  )

  const completionStats = useMemo(() => {
    const completed = attendees.filter(
      (attendee) => attendee.skipped || attendee.orderCompleted,
    ).length

    return {
      completed,
      total: attendees.length,
    }
  }, [attendees])

  const previewPrice =
    selectedMenu && activeAttendee
      ? getMenuDisplayPrice(selectedMenu, activeAttendee.decaf)
      : 0

  function syncSelectedAttendee(attendeeId: string) {
    const nextAttendee = attendees.find((attendee) => attendee.id === attendeeId)

    if (!nextAttendee) {
      setSelectedAttendeeId('')
      return
    }

    setIsAddingAttendee(false)
    setSelectedAttendeeId(attendeeId)
    setNameInput(nextAttendee.name)
  }

  function ensureActiveAttendeeId() {
    if (activeAttendeeId) {
      return activeAttendeeId
    }

    const trimmedName = nameInput.trim()

    if (!trimmedName || meetingClosed) {
      return ''
    }

    if (matchedAttendee) {
      setIsAddingAttendee(false)
      setSelectedAttendeeId(matchedAttendee.id)
      setNameInput(matchedAttendee.name)
      return matchedAttendee.id
    }

    const nextAttendeeId = onAddAttendee(trimmedName, '')
    setIsAddingAttendee(false)
    setSelectedAttendeeId(nextAttendeeId)
    setNameInput(trimmedName)
    return nextAttendeeId
  }

  function handleNameChange(nextValue: string) {
    setNameInput(nextValue)

    const selectedName = selectedAttendeeById?.name ?? ''
    if (selectedAttendeeId && normalizeName(selectedName) !== normalizeName(nextValue)) {
      setSelectedAttendeeId('')
    }
  }

  function handleStartAddingAttendee() {
    setIsAddingAttendee(true)
    setSelectedAttendeeId('')
    setNameInput('')
  }

  function handleCancelAddingAttendee() {
    setIsAddingAttendee(false)
    setNameInput(selectedAttendeeById?.name ?? '')
  }

  function handleMenuSelect(menuItemId: string) {
    const attendeeId = ensureActiveAttendeeId()

    if (!attendeeId) {
      return
    }

    onUpdateAttendee(attendeeId, 'menuItemId', menuItemId)
  }

  function handleTemperatureChange(nextTemperature: string) {
    const attendeeId = ensureActiveAttendeeId()

    if (!attendeeId) {
      return
    }

    onUpdateAttendee(attendeeId, 'temperature', nextTemperature)
  }

  function handleNoteChange(nextNote: string) {
    const attendeeId = ensureActiveAttendeeId()

    if (!attendeeId) {
      return
    }

    onUpdateAttendee(attendeeId, 'note', nextNote)
  }

  function handleDecafChange(nextChecked: boolean) {
    const attendeeId = ensureActiveAttendeeId()

    if (!attendeeId) {
      return
    }

    onUpdateAttendee(attendeeId, 'decaf', nextChecked)
  }

  function handleSkipToggle() {
    const attendeeId = ensureActiveAttendeeId()

    if (!attendeeId) {
      return
    }

    onSkipAttendee(attendeeId, !activeAttendee?.skipped)
  }

  function handleCompleteSelection() {
    if (!activeAttendee || !canCompleteOrder) {
      return
    }

    onCompleteOrder(activeAttendee.id, activeAttendee.name)
  }

  function openNutritionSheet(menuItem: MenuItem) {
    setNutritionMenuId(menuItem.id)
  }

  return (
    <>
      <MenuNutritionSheet
        menuItem={nutritionMenu}
        open={Boolean(nutritionMenu)}
        onClose={() => setNutritionMenuId('')}
      />

      <details
        className="panel panel-wide participant-entry-panel quick-order-panel collapsible-panel"
        open
      >
        <summary className="panel-head">
          <div>
            <span className="panel-kicker">
              {variant === 'organizer' ? '빠른 주문 입력' : '내 주문 입력'}
            </span>
            <h2>{isParticipantView ? '내 이름 선택 후 메뉴 고르기' : '이름 입력 후 바로 주문 받기'}</h2>
          </div>
          <span className={`status-pill ${meetingClosed ? 'danger' : 'live'}`}>
            {meetingClosed ? '주문 마감' : '주문 가능'}
          </span>
          <span aria-hidden="true" className="collapse-chevron">▾</span>
        </summary>

        {/* PARTICIPANT: name chips at the very top — immediately visible */}
        {isParticipantView && attendees.length > 0 ? (
          <div className="quick-order-name-picker">
            <div className="subhead">
              <h3>내 이름 선택</h3>
              <button
                className="button ghost small"
                type="button"
                onClick={isAddingAttendee ? handleCancelAddingAttendee : handleStartAddingAttendee}
              >
                {isAddingAttendee ? '이름 선택으로' : '이름 없으면 추가'}
              </button>
            </div>
            {!isAddingAttendee ? (
              <div className="quick-attendee-scroll" role="list" aria-label="기존 참석자">
                {sortedAttendees.map((attendee) => {
                  const status = getAttendeeStatus(attendee)

                  return (
                    <button
                      className={`quick-attendee-chip ${status.chipClass} ${
                        attendee.id === activeAttendeeId ? 'active' : ''
                      }`}
                      key={attendee.id}
                      type="button"
                      onClick={() => syncSelectedAttendee(attendee.id)}
                    >
                      <span aria-hidden="true" className="chip-avatar">
                        {attendee.name.slice(0, 1) || '?'}
                      </span>
                      <span className="chip-name">{attendee.name}</span>
                      <span className="chip-status">{status.label}</span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <label className="field field-full">
                <span>새 참석자 이름</span>
                <input
                  value={nameInput}
                  onChange={(event) => handleNameChange(event.target.value)}
                  placeholder="이름을 입력하면 새 참석자로 추가됩니다"
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                />
              </label>
            )}
            {!activeAttendee && !isAddingAttendee ? (
              <div className="status-callout">
                내 이름을 눌러 주문을 시작하세요.
              </div>
            ) : null}
            {nameInput.trim() && isAddingAttendee ? (
              <div className="status-callout">이름 확인 완료. 아래에서 메뉴를 선택해주세요.</div>
            ) : null}
          </div>
        ) : null}

        {/* PARTICIPANT: no attendees yet — show input at the top */}
        {isParticipantView && attendees.length === 0 ? (
          <>
            <label className="field field-full">
              <span>내 이름</span>
              <input
                value={nameInput}
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder="이름을 입력하면 새 참석자로 추가됩니다"
              />
            </label>
            {nameInput.trim() ? (
              <div className="status-callout">이름 확인 완료. 아래에서 메뉴를 선택해주세요.</div>
            ) : null}
          </>
        ) : null}

        {/* ORGANIZER: attendee chips first — pick name then menu */}
        {!isParticipantView ? (
          attendees.length > 0 ? (
            <div className="quick-order-name-picker">
              <div className="subhead">
                <h3>참석자 현황</h3>
                <span className="subhead-meta">
                  이름을 누르면 바로 메뉴를 선택할 수 있어요.
                </span>
              </div>
              <div className="quick-attendee-scroll" role="list" aria-label="참석자 현황">
                {sortedAttendees.map((attendee) => {
                  const status = getAttendeeStatus(attendee)

                  return (
                    <button
                      className={`quick-attendee-chip ${status.chipClass} ${
                        attendee.id === activeAttendeeId ? 'active' : ''
                      }`}
                      key={attendee.id}
                      type="button"
                      onClick={() => syncSelectedAttendee(attendee.id)}
                    >
                      <span aria-hidden="true" className="chip-avatar">
                        {attendee.name.slice(0, 1) || '?'}
                      </span>
                      <span className="chip-name">{attendee.name}</span>
                      <span className="chip-status">{status.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="empty-state compact">
              참석자가 아직 없어요. 아래 "참석자 수동 관리" 또는 새 미팅 만들기에서 이름을 추가해 주세요.
            </div>
          )
        ) : null}

        {/* Meta stats */}
        <div className="participant-meta-grid quick-order-meta two-col">
          <article className="mini-stat">
            <span>카페</span>
            <strong>{meeting.cafeName || '미정'}</strong>
          </article>
          <article className="mini-stat">
            <span>응답</span>
            <strong>
              {completionStats.completed}/{completionStats.total}
            </strong>
          </article>
        </div>

        {/* Order form */}
        <div className="quick-order-composer">
          <div className="quick-order-fields">
            <div className="field field-full">
              <span>메뉴 선택</span>
              {orderReady && menuItems.length > 0 ? (
                <input
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="메뉴 검색..."
                  autoComplete="off"
                />
              ) : null}
              <select
                value={activeAttendee?.menuItemId ?? ''}
                disabled={meetingClosed || menuItems.length === 0 || !orderReady}
                onChange={(event) => {
                  handleMenuSelect(event.target.value)
                  setMenuSearch('')
                }}
              >
                <option value="">
                  {!orderReady
                    ? isParticipantView && attendees.length > 0 && !isAddingAttendee
                      ? '먼저 내 이름을 선택해주세요'
                      : '먼저 이름을 입력해주세요'
                    : menuItems.length === 0
                      ? '등록된 메뉴가 없습니다'
                      : filteredMenuItems.length === 0
                        ? '검색 결과 없음'
                        : '메뉴를 선택해주세요'}
                </option>
                {filteredMenuItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {showPrices
                      ? ` (${formatVisiblePrice(item.price, showPrices)})`
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedMenu ? (
              <div className="field field-full">
                <div className="menu-info-actions">
                  <button
                    className="button secondary small"
                    type="button"
                    onClick={() => openNutritionSheet(selectedMenu)}
                  >
                    영양정보 보기
                  </button>
                  <span className="menu-info-note">
                    {selectedMenu.nutritionInfo
                      ? '칼로리와 당류, 카페인 정보와 함께 기준 메뉴도 확인할 수 있습니다.'
                      : '등록된 영양정보가 없으면 팝업에서 안내 문구가 표시됩니다.'}
                  </span>
                </div>
              </div>
            ) : null}

            <div className="field field-full">
              <span>온도</span>
              {selectedMenu ? (
                <TemperatureSelector
                  availableTemperatures={selectedMenu.availableTemperatures}
                  disabled={fieldsDisabled}
                  value={activeAttendee?.temperature ?? ''}
                  onChange={handleTemperatureChange}
                />
              ) : (
                <div className="selection-hint">
                  메뉴를 선택하면 HOT / ICE를 고를 수 있습니다.
                </div>
              )}
            </div>

            {canUseDecaf ? (
              <div className="field field-full">
                <span>커피 옵션</span>
                <div className="checkbox-group">
                  <label
                    className={`checkbox-chip ${activeAttendee?.decaf ? 'active' : ''}`}
                  >
                    <input
                      checked={Boolean(activeAttendee?.decaf)}
                      disabled={fieldsDisabled}
                      type="checkbox"
                      onChange={(event) => handleDecafChange(event.target.checked)}
                    />
                    <span>디카페인 변경 +700원</span>
                  </label>
                </div>
              </div>
            ) : null}

            <label className="field field-full">
              <span>추가 요청</span>
              <input
                value={activeAttendee?.note ?? ''}
                disabled={meetingClosed || !orderReady}
                onChange={(event) => handleNoteChange(event.target.value)}
                placeholder="샷 추가, 연하게, 얼음 적게"
              />
            </label>
          </div>

          <div className="button-row order-card-actions quick-order-actions">
            <button
              className="button small"
              type="button"
              disabled={!canCompleteOrder || meetingClosed}
              onClick={handleCompleteSelection}
            >
              선택 완료
            </button>
            <button
              aria-pressed={Boolean(activeAttendee?.skipped)}
              className="button ghost small"
              type="button"
              disabled={meetingClosed || !orderReady}
              onClick={handleSkipToggle}
            >
              {activeAttendee?.skipped ? '스킵 취소' : '안마심'}
            </button>
          </div>

          {!orderReady ? (
            <div className="personal-summary">
              <strong>
                {isParticipantView && attendees.length > 0 && !isAddingAttendee
                  ? '내 이름을 먼저 선택해주세요.'
                  : '이름을 먼저 입력해주세요.'}
              </strong>
              <span>
                {isParticipantView && attendees.length > 0 && !isAddingAttendee
                  ? '등록된 이름을 누르면 기존 주문도 바로 수정할 수 있습니다.'
                  : '이름을 입력한 뒤 메뉴를 고르면 바로 주문을 마무리할 수 있습니다.'}
              </span>
            </div>
          ) : activeAttendee?.skipped ? (
            <div className="personal-summary">
              <strong>{activeAttendee.name}님은 이번 주문에서 제외됩니다.</strong>
              <span>필요하면 스킵 취소를 눌러 다시 메뉴를 선택해주세요.</span>
            </div>
          ) : selectedMenu && activeAttendee ? (
            <div className="personal-summary">
              <strong>
                {activeAttendee.name} · {selectedMenu.name}
                {activeAttendee.decaf && canUseDecaf ? ' · 디카페인' : ''}
              </strong>
              <span>
                {activeAttendee.temperature || '온도 선택 전'} ·{' '}
                {formatVisiblePrice(previewPrice, showPrices)}
              </span>
              <span>{activeAttendee.note || '추가 요청 없음'}</span>
            </div>
          ) : (
            <div className="personal-summary">
              <strong>{nameInput.trim() || '참석자'}님의 메뉴를 선택해주세요.</strong>
              <span>온도까지 고른 뒤 선택 완료를 누르면 주문이 마무리됩니다.</span>
            </div>
          )}
        </div>

        <details className="admin-details quick-menu-details">
          <summary>메뉴 전체 보기</summary>
          <div className="admin-details-body">
            <div className="panel">
              {menuItems.length === 0 ? (
                <div className="empty-state compact">등록된 메뉴가 없습니다.</div>
              ) : (
                <div className="catalog-list quick-order-menu-list">
                  {menuItems.map((item) => (
                    <article className="catalog-row" key={item.id}>
                      <div>
                        <strong>{item.name}</strong>
                        <p>{item.availableTemperatures.join(' / ')}</p>
                      </div>
                      <div className="catalog-row-actions">
                        <strong>{formatVisiblePrice(item.price, showPrices)}</strong>
                        <button
                          className="button ghost small"
                          type="button"
                          onClick={() => openNutritionSheet(item)}
                        >
                          영양정보
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </details>
      </details>
    </>
  )
}
