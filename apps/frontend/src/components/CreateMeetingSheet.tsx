import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  type CafePresetName,
} from '../lib/meeting'

type CreateMeetingSheetProps = {
  open: boolean
  title: string
  cafeName: CafePresetName | ''
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

const ATTENDEE_PRESETS = [
  {
    label: '연료전지영업팀',
    description: '자주 쓰는 팀 인원 16명 자동 입력',
    names: [
      '정용훈',
      '송용원',
      '이충봉',
      '김가혁',
      '김기선',
      '김동민',
      '김산',
      '김영선',
      '김창섭',
      '박민범',
      '송상현',
      '심현진',
      '이설하',
      '이용훈',
      '주환범',
      '최성원',
    ],
  },
] as const

export function CreateMeetingSheet({
  open,
  title,
  cafeName,
  onClose,
  onSubmit,
}: CreateMeetingSheetProps) {
  const [attendeeInput, setAttendeeInput] = useState('')
  const attendeeNames = useMemo(
    () => parseAttendeeNames(attendeeInput),
    [attendeeInput],
  )

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
    <div className="summary-sheet-overlay" role="presentation" onClick={handleClose}>
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
            <span>초기 참석자 이름</span>
            <textarea
              autoFocus
              value={attendeeInput}
              onChange={(event) => setAttendeeInput(event.target.value)}
              placeholder={'한 줄에 한 명씩 입력하세요\n예: 김대리\n이주임\n박과장'}
            />
            <div className="button-row inline-chip-row">
              {ATTENDEE_PRESETS.map((preset) => (
                <button
                  className="button ghost small"
                  key={preset.label}
                  type="button"
                  title={preset.description}
                  onClick={() => {
                    setAttendeeInput((current) => {
                      const merged = [
                        ...parseAttendeeNames(current),
                        ...preset.names,
                      ]
                      return parseAttendeeNames(merged.join('\n')).join('\n')
                    })
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </label>

          <div className="status-callout">
            참석자 이름은 줄바꿈이나 쉼표로 구분할 수 있습니다. 자주 쓰는 팀은 위 버튼으로 한 번에 추가할 수 있어요.
          </div>

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
