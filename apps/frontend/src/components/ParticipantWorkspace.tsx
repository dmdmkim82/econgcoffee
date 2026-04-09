import { useMemo, useState, type FormEvent } from 'react'
import { type Attendee, type Snapshot } from '../lib/meeting'
import { formatVisiblePrice } from '../lib/menu'
import { TemperatureSelector } from './TemperatureSelector'

type ParticipantWorkspaceProps = {
  snapshot: Snapshot
  meetingClosed: boolean
  showPrices: boolean
  onAddAttendee: (name: string, team: string) => string
  onUpdateAttendee: (
    attendeeId: string,
    field: keyof Attendee,
    value: string | number,
  ) => void
  onSkipAttendee: (attendeeId: string, skipped: boolean) => void
}

export function ParticipantWorkspace({
  snapshot,
  meetingClosed,
  showPrices,
  onAddAttendee,
  onUpdateAttendee,
  onSkipAttendee,
}: ParticipantWorkspaceProps) {
  const { meeting, attendees, menuItems } = snapshot
  const [selectedAttendeeId, setSelectedAttendeeId] = useState('')
  const [newName, setNewName] = useState('')
  const [newTeam, setNewTeam] = useState('')

  const activeAttendeeId = attendees.some(
    (attendee) => attendee.id === selectedAttendeeId,
  )
    ? selectedAttendeeId
    : attendees[0]?.id ?? ''

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
  const statusTone = selectedAttendee?.skipped
    ? 'skip'
    : selectedAttendee?.menuItemId
      ? 'live'
      : 'neutral'
  const statusLabel = selectedAttendee?.skipped
    ? '스킵'
    : selectedAttendee?.menuItemId
      ? '선택 완료'
      : '미선택'

  return (
    <div className="participant-layout">
      <section className="panel participant-summary">
        <div className="panel-head">
          <div>
            <span className="panel-kicker">참석자 화면</span>
            <h2>{meeting.title || '에콩커피 주문'}</h2>
          </div>
          <span className={`status-pill ${meetingClosed ? 'danger' : 'live'}`}>
            {meetingClosed ? '마감됨' : '주문 가능'}
          </span>
        </div>
        <div className="participant-meta-grid">
          <article className="mini-stat">
            <span>카페</span>
            <strong>{meeting.cafeName || '미정'}</strong>
          </article>
          <article className="mini-stat">
            <span>장소</span>
            <strong>{meeting.place || '미정'}</strong>
          </article>
          <article className="mini-stat">
            <span>응답 현황</span>
            <strong>
              {completionStats.completed}/{completionStats.total}
            </strong>
          </article>
        </div>
      </section>

      <section className="panel panel-wide participant-entry-panel">
        <div className="panel-head">
          <div>
            <span className="panel-kicker">빠른 주문</span>
            <h2>맨 위에서 이름 쓰고 바로 메뉴 고르기</h2>
          </div>
          {selectedAttendee ? (
            <span className={`status-pill ${statusTone}`}>{statusLabel}</span>
          ) : null}
        </div>

        <div className="field-grid">
          <label className="field">
            <span>기존 이름 선택</span>
            <select
              value={activeAttendeeId}
              onChange={(event) => setSelectedAttendeeId(event.target.value)}
            >
              <option value="">이름을 선택해주세요</option>
              {attendees.map((attendee) => (
                <option key={attendee.id} value={attendee.id}>
                  {attendee.name}
                  {attendee.team ? ` · ${attendee.team}` : ''}
                  {attendee.skipped
                    ? ' (스킵)'
                    : attendee.menuItemId
                      ? ' (완료)'
                      : ''}
                </option>
              ))}
            </select>
          </label>
          <form className="participant-add-form" onSubmit={handleAddSelf}>
            <div className="field-grid">
              <label className="field">
                <span>새 이름</span>
                <input
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="이름 입력"
                />
              </label>
              <label className="field">
                <span>팀/부서</span>
                <input
                  value={newTeam}
                  onChange={(event) => setNewTeam(event.target.value)}
                  placeholder="선택 입력"
                />
              </label>
            </div>
            <button className="button" type="submit" disabled={meetingClosed}>
              이 이름으로 시작
            </button>
          </form>
        </div>

        {attendees.length > 0 ? (
          <div className="quick-attendee-list">
            {attendees.map((attendee) => (
              <button
                className={`quick-attendee-chip ${
                  attendee.id === activeAttendeeId ? 'active' : ''
                }`}
                key={attendee.id}
                type="button"
                onClick={() => setSelectedAttendeeId(attendee.id)}
              >
                {attendee.name}
              </button>
            ))}
          </div>
        ) : null}

        {!selectedAttendee ? (
          <div className="empty-state compact">
            위에서 이름을 추가하거나 기존 이름을 선택하면 바로 메뉴를 고를 수
            있습니다.
          </div>
        ) : (
          <div className="participant-order-stack">
            <div className="participant-order-form">
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
                        : '메뉴를 선택해주세요'}
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
                    <div className="selection-hint">메뉴를 먼저 선택해주세요.</div>
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
                    <option value="Large">대</option>
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
                    placeholder="샷 추가, 얼음 적게, 덜 달게"
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
            </div>

            <div className="preview-grid">
              <div className="preview-card">
                <h3>내 주문 미리보기</h3>
                {selectedAttendee.skipped ? (
                  <div className="personal-summary">
                    <strong>이번 주문은 스킵</strong>
                    <p>음료를 마시지 않는 참석자로 취합됩니다.</p>
                    <span>필요하면 스킵을 취소하고 메뉴를 다시 골라주세요.</span>
                  </div>
                ) : selectedMenu ? (
                  <div className="personal-summary">
                    <strong>{selectedMenu.name}</strong>
                    <p>
                      {selectedAttendee.quantity}잔 ·{' '}
                      {formatVisiblePrice(selectedMenu.price, showPrices)}
                    </p>
                    <span>
                      {selectedAttendee.temperature || '온도 미선택'} /{' '}
                      {selectedAttendee.size || '기본 사이즈'} /{' '}
                      {selectedAttendee.note || '추가 요청 없음'}
                    </span>
                  </div>
                ) : (
                  <div className="empty-state compact">
                    아직 선택한 메뉴가 없습니다.
                  </div>
                )}
              </div>

              <div className="preview-card">
                <h3>주문 가능한 메뉴</h3>
                {menuItems.length === 0 ? (
                  <div className="empty-state compact">
                    아직 등록된 메뉴가 없습니다.
                  </div>
                ) : (
                  <div className="catalog-list">
                    {menuItems.map((item) => (
                      <div className="catalog-row" key={item.id}>
                        <div>
                          <strong>{item.name}</strong>
                          <p>{item.availableTemperatures.join(' / ')}</p>
                        </div>
                        <span>{formatVisiblePrice(item.price, showPrices)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {meeting.notes ? (
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="panel-kicker">안내 메모</span>
              <h2>취합자가 남긴 안내</h2>
            </div>
          </div>
          <div className="notice-box">
            <p>{meeting.notes}</p>
          </div>
        </section>
      ) : null}
    </div>
  )
}
