import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  type CafePresetName,
  type Team,
} from '../lib/meeting'

type CreateMeetingSheetProps = {
  open: boolean
  title: string
  cafeName: CafePresetName | ''
  teams: Team[]
  onClose: () => void
  onSubmit: (payload: {
    attendeeNames: string[]
  }) => void
}

function parseAttendeeNames(rawValue: string) {
  const deduped = new Set<string>()
  const attendeeNames: string[] = []

  for (const rawName of rawValue.split(/[\n,]/)) {
    const trimmed = rawName.trim().replace(/\s+/g, ' ')

    if (!trimmed) {
      continue
    }

    const dedupeKey = trimmed.normalize('NFKC').toLocaleLowerCase('ko-KR')

    if (deduped.has(dedupeKey)) {
      continue
    }

    deduped.add(dedupeKey)
    attendeeNames.push(trimmed)
  }

  return attendeeNames
}

type AttendeePreset = {
  id: string
  label: string
  description: string
  names: string[]
}

function teamsToPresets(teams: Team[]): AttendeePreset[] {
  return teams
    .filter((team) => team.members.length > 0)
    .map((team) => ({
      id: team.id,
      label: team.name,
      description: `${team.name} 인원 ${team.members.length}명 자동 입력`,
      names: team.members,
    }))
}

export function CreateMeetingSheet({
  open,
  title,
  cafeName,
  teams,
  onClose,
  onSubmit,
}: CreateMeetingSheetProps) {
  const [attendeeInput, setAttendeeInput] = useState('')
  const [presetFeedback, setPresetFeedback] = useState<{
    label: string
    addedCount: number
  } | null>(null)
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const attendeeNames = useMemo(
    () => parseAttendeeNames(attendeeInput),
    [attendeeInput],
  )
  const presets = useMemo(() => teamsToPresets(teams), [teams])

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current)
      }
    }
  }, [])

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

  function resetForm() {
    setAttendeeInput('')
    setPresetFeedback(null)
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current)
      feedbackTimeoutRef.current = null
    }
  }

  function handlePresetClick(preset: AttendeePreset) {
    const beforeCount = parseAttendeeNames(attendeeInput).length
    const merged = parseAttendeeNames(
      [...parseAttendeeNames(attendeeInput), ...preset.names].join('\n'),
    )
    const addedCount = merged.length - beforeCount

    setAttendeeInput(merged.join('\n'))
    setPresetFeedback({ label: preset.label, addedCount })

    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current)
    }
    feedbackTimeoutRef.current = setTimeout(() => {
      setPresetFeedback(null)
      feedbackTimeoutRef.current = null
    }, 4000)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    onSubmit({
      attendeeNames,
    })

    resetForm()
  }

  return (
    <div
      className="summary-sheet-overlay create-sheet-overlay"
      role="presentation"
      onClick={handleClose}
    >
      <section
        aria-label="새 미팅 만들기"
        aria-modal="true"
        className="summary-sheet create-meeting-sheet"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="summary-sheet-head">
          <div>
            <span className="panel-kicker">새 미팅 만들기</span>
            <h2>참석자 이름을 먼저 적어주세요</h2>
          </div>
          <button className="button ghost small" type="button" onClick={handleClose}>
            닫기
          </button>
        </div>

        <p className="panel-note">
          홈에서 정한 미팅 이름과 카페를 기준으로 미팅을 만들고, 참석자는 링크를 열어
          자기 이름을 누른 뒤 바로 메뉴를 고를 수 있습니다.
        </p>

        <form className="quick-order-composer" onSubmit={handleSubmit}>
          <div className="participant-meta-grid quick-order-meta">
            <article className="mini-stat">
              <span>선택 카페</span>
              <strong>{cafeName || '선택 필요'}</strong>
            </article>
            <article className="mini-stat">
              <span>미팅 이름</span>
              <strong>{title.trim() || '기본 이름 사용'}</strong>
            </article>
            <article className="mini-stat">
              <span>링크 방식</span>
              <strong>이름 선택 후 주문</strong>
            </article>
          </div>

          <label className="field field-full">
            <div className="field-head-row">
              <span>초기 참석자 이름</span>
              <div className="team-preset-row">
                {presets.length === 0 ? (
                  <span className="team-preset-empty">
                    팀 관리에서 팀을 만들면 여기에 칩으로 보입니다.
                  </span>
                ) : (
                  presets.map((preset) => (
                    <button
                      className="team-preset-button"
                      key={preset.id}
                      type="button"
                      title={preset.description}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handlePresetClick(preset)}
                    >
                      {preset.label}
                    </button>
                  ))
                )}
              </div>
            </div>
            <textarea
              autoFocus
              value={attendeeInput}
              onChange={(event) => setAttendeeInput(event.target.value)}
              placeholder={'한 줄에 한 명씩 입력하세요\n예: 김대리\n이주임\n박과장'}
            />
          </label>

          {presetFeedback ? (
            <div className="status-callout success-callout" role="status">
              {presetFeedback.label} {presetFeedback.addedCount}명을 추가했어요.
              {' '}추가로 더 입력하거나, 다 됐으면 아래 "새 미팅 만들기" 를 눌러주세요.
            </div>
          ) : (
            <div className="status-callout">
              참석자 이름은 줄바꿈이나 쉼표로 구분할 수 있습니다. 자주 쓰는 팀은
              우측 버튼으로 한 번에 추가할 수 있어요.
            </div>
          )}

          <div className="button-row">
            <button className="button" type="submit">
              새 미팅 만들기
            </button>
            <button className="button secondary" type="button" onClick={handleClose}>
              취소
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
