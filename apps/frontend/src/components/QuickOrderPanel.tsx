import { useMemo, useState, type FormEvent } from 'react'
import { formatCountdown, type Attendee, type Snapshot } from '../lib/meeting'
import { formatVisiblePrice } from '../lib/menu'
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
    value: string | number,
  ) => void
  onSkipAttendee: (attendeeId: string, skipped: boolean) => void
}

function getAttendeeStatus(attendee: Attendee) {
  if (attendee.skipped) {
    return {
      tone: 'skip',
      label: '안마심',
    }
  }

  if (attendee.menuItemId) {
    return {
      tone: 'live',
      label: '선택 완료',
    }
  }

  return {
    tone: 'neutral',
    label: '메뉴 미선택',
  }
}

export function QuickOrderPanel({
  snapshot,
  meetingClosed,
  showPrices,
  variant = 'participant',
  onAddAttendee,
  onUpdateAttendee,
  onSkipAttendee,
}: QuickOrderPanelProps) {
  const { meeting, attendees, menuItems } = snapshot
  const [selectedAttendeeId, setSelectedAttendeeId] = useState('')
  const [newName, setNewName] = useState('')
  const [newTeam, setNewTeam] = useState('')

  const activeAttendeeId = attendees.some(
    (attendee) => attendee.id === selectedAttendeeId,
  )
    ? selectedAttendeeId
    : ''

  const selectedAttendee = attendees.find(
    (attendee) => attendee.id === activeAttendeeId,
  )
  const selectedMenu = menuItems.find(
    (item) => item.id === selectedAttendee?.menuItemId,
  )

  const completionStats = useMemo(() => {
    const completed = attendees.filter(
      (attendee) => attendee.skipped || attendee.menuItemId,
    ).length

    return {
      completed,
      total: attendees.length,
    }
  }, [attendees])

  function handleAddSelf(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (meetingClosed || !newName.trim()) {
      return
    }

    const attendeeId = onAddAttendee(newName.trim(), newTeam.trim())
    setSelectedAttendeeId(attendeeId)
    setNewName('')
    setNewTeam('')
  }

  const orderFieldsDisabled =
    meetingClosed || !selectedAttendee || selectedAttendee.skipped
  const selectedStatus = selectedAttendee
    ? getAttendeeStatus(selectedAttendee)
    : null
  const heading =
    variant === 'organizer'
      ? '참석자 이름과 메뉴를 바로 입력하세요'
      : '내 이름을 적고 바로 메뉴를 고르세요'
  const description =
    variant === 'organizer'
      ? '취합자가 참석자 주문을 상단에서 바로 입력할 수 있게 구성했습니다.'
      : '이름을 입력하거나 이미 등록된 이름을 선택한 뒤 바로 주문하면 됩니다.'
  const countdownLabel = meetingClosed ? '주문 마감' : formatCountdown(meeting.deadline)

  return (
    <section className="panel panel-wide participant-entry-panel quick-order-panel">
      <div className="panel-head">
        <div>
          <span className="panel-kicker">
            {variant === 'organizer' ? '상단 빠른 주문' : '내 주문 입력'}
          </span>
          <h2>{heading}</h2>
        </div>
        <span className={`status-pill ${meetingClosed ? 'danger' : 'live'}`}>
          {meetingClosed ? '주문 마감' : '주문 가능'}
        </span>
      </div>

      <p className="panel-note">{description}</p>

      <div className="participant-meta-grid quick-order-meta">
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
        <article className="mini-stat">
          <span>마감</span>
          <strong>{countdownLabel}</strong>
        </article>
      </div>

      <form className="participant-add-form" onSubmit={handleAddSelf}>
        <div className="field-grid">
          <label className="field">
            <span>참석자 이름</span>
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="이름을 입력하세요"
            />
          </label>
          <label className="field">
            <span>팀 / 부서</span>
            <input
              value={newTeam}
              onChange={(event) => setNewTeam(event.target.value)}
              placeholder="선택 입력"
            />
          </label>
        </div>
        <div className="button-row">
          <button className="button" type="submit" disabled={meetingClosed}>
            이 이름으로 주문 시작
          </button>
        </div>
      </form>

      {attendees.length > 0 ? (
        <>
          <label className="field quick-order-inline-select">
            <span>이미 등록된 이름 선택</span>
            <select
              value={activeAttendeeId}
              onChange={(event) => setSelectedAttendeeId(event.target.value)}
            >
              <option value="">이름을 선택하세요</option>
              {attendees.map((attendee) => (
                <option key={attendee.id} value={attendee.id}>
                  {attendee.name}
                  {attendee.team ? ` · ${attendee.team}` : ''}
                  {attendee.skipped
                    ? ' · 안마심'
                    : attendee.menuItemId
                      ? ' · 선택 완료'
                      : ''}
                </option>
              ))}
            </select>
          </label>

          <div className="quick-attendee-list">
            {attendees.map((attendee) => {
              const status = getAttendeeStatus(attendee)

              return (
                <button
                  className={`quick-attendee-chip ${
                    attendee.id === activeAttendeeId ? 'active' : ''
                  }`}
                  key={attendee.id}
                  type="button"
                  onClick={() => setSelectedAttendeeId(attendee.id)}
                >
                  {attendee.name} · {status.label}
                </button>
              )
            })}
          </div>
        </>
      ) : null}

      {!selectedAttendee ? (
        <div className="empty-state compact">
          먼저 이름을 입력하거나 이미 등록된 이름을 선택하면 바로 메뉴를 고를 수 있습니다.
        </div>
      ) : (
        <div className="participant-order-stack">
          <div className="preview-card quick-order-preview">
            <div className="panel-head">
              <div>
                <span className="panel-kicker">선택한 참석자</span>
                <h3>{selectedAttendee.name}</h3>
              </div>
              {selectedStatus ? (
                <span className={`status-pill ${selectedStatus.tone}`}>
                  {selectedStatus.label}
                </span>
              ) : null}
            </div>

            <div className="order-fields">
              <label className="field field-full">
                <span>메뉴 선택</span>
                <select
                  value={selectedAttendee.menuItemId}
                  disabled={orderFieldsDisabled || menuItems.length === 0}
                  onChange={(event) =>
                    onUpdateAttendee(
                      selectedAttendee.id,
                      'menuItemId',
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    {menuItems.length === 0
                      ? '등록된 메뉴가 없습니다'
                      : '메뉴를 선택하세요'}
                  </option>
                  {menuItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {showPrices
                        ? ` (${formatVisiblePrice(item.price, showPrices)})`
                        : ''}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>수량</span>
                <input
                  type="number"
                  min={1}
                  max={9}
                  value={selectedAttendee.quantity}
                  disabled={orderFieldsDisabled}
                  onChange={(event) =>
                    onUpdateAttendee(
                      selectedAttendee.id,
                      'quantity',
                      Math.min(9, Math.max(1, Number(event.target.value || 1))),
                    )
                  }
                />
              </label>

              <div className="field">
                <span>온도</span>
                {selectedMenu ? (
                  <TemperatureSelector
                    availableTemperatures={selectedMenu.availableTemperatures}
                    disabled={orderFieldsDisabled}
                    value={selectedAttendee.temperature}
                    onChange={(value) =>
                      onUpdateAttendee(selectedAttendee.id, 'temperature', value)
                    }
                  />
                ) : (
                  <div className="selection-hint">메뉴를 먼저 선택하세요.</div>
                )}
              </div>

              <label className="field">
                <span>사이즈</span>
                <select
                  value={selectedAttendee.size}
                  disabled={orderFieldsDisabled}
                  onChange={(event) =>
                    onUpdateAttendee(selectedAttendee.id, 'size', event.target.value)
                  }
                >
                  <option value="">기본</option>
                  <option value="Regular">기본</option>
                  <option value="Large">라지</option>
                </select>
              </label>

              <label className="field field-full">
                <span>추가 요청</span>
                <input
                  value={selectedAttendee.note}
                  disabled={orderFieldsDisabled}
                  onChange={(event) =>
                    onUpdateAttendee(selectedAttendee.id, 'note', event.target.value)
                  }
                  placeholder="샷 추가, 덜 달게, 얼음 적게"
                />
              </label>
            </div>

            <div className="button-row order-card-actions">
              <button
                aria-pressed={selectedAttendee.skipped}
                className="button ghost small"
                type="button"
                disabled={meetingClosed}
                onClick={() =>
                  onSkipAttendee(selectedAttendee.id, !selectedAttendee.skipped)
                }
              >
                {selectedAttendee.skipped ? '스킵 취소' : '안마심'}
              </button>
            </div>

            {selectedAttendee.skipped ? (
              <div className="personal-summary">
                <strong>이번 주문은 안마심으로 처리됩니다.</strong>
                <p>음료를 마시지 않는 참석자로 집계됩니다.</p>
              </div>
            ) : selectedMenu ? (
              <div className="personal-summary">
                <strong>{selectedMenu.name}</strong>
                <p>
                  {selectedAttendee.quantity}잔 ·{' '}
                  {formatVisiblePrice(
                    selectedMenu.price * selectedAttendee.quantity,
                    showPrices,
                  )}
                </p>
                <span>
                  {selectedAttendee.temperature || '온도 미선택'} /{' '}
                  {selectedAttendee.size || '기본 사이즈'} /{' '}
                  {selectedAttendee.note || '추가 요청 없음'}
                </span>
              </div>
            ) : (
              <div className="personal-summary">
                <strong>아직 메뉴를 고르지 않았습니다.</strong>
                <p>위에서 원하는 메뉴를 선택해 주세요.</p>
              </div>
            )}
          </div>
        </div>
      )}

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
                    <strong>{formatVisiblePrice(item.price, showPrices)}</strong>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </details>
    </section>
  )
}
