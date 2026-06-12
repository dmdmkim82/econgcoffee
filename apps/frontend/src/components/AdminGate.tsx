import { useState, type FormEvent, type ReactNode } from 'react'

// 간단한 클라이언트 측 PIN 게이트. 보안 장치가 아니라 실수로 팀 명단을
// 건드리는 것을 막기 위한 소프트 잠금이다 (사내 공유 앱 전제).
const ADMIN_PIN = '0000'
const SESSION_KEY = 'ekong-coffee-admin-unlocked'

type AdminGateProps = {
  children: ReactNode
}

export function AdminGate({ children }: AdminGateProps) {
  const [unlocked, setUnlocked] = useState(
    () => window.sessionStorage.getItem(SESSION_KEY) === 'true',
  )
  const [pinInput, setPinInput] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pinInput === ADMIN_PIN) {
      setUnlocked(true)
      setError('')
      setPinInput('')
      try {
        window.sessionStorage.setItem(SESSION_KEY, 'true')
      } catch {
        // sessionStorage 불가 환경에서도 이번 화면에서는 열린 상태 유지.
      }
    } else {
      setError('암호가 올바르지 않습니다.')
      setPinInput('')
    }
  }

  function handleLock() {
    setUnlocked(false)
    setPinInput('')
    setError('')
    try {
      window.sessionStorage.removeItem(SESSION_KEY)
    } catch {
      // ignore
    }
  }

  if (!unlocked) {
    return (
      <div className="admin-gate">
        <p className="panel-note">
          팀 명단 변경은 관리자만 할 수 있어요. 암호를 입력해 주세요.
        </p>
        <form className="inline-form stacked admin-gate-form" onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={pinInput}
            onChange={(event) => {
              setPinInput(event.target.value.replace(/\D/g, ''))
              setError('')
            }}
            placeholder="암호 4자리"
            aria-label="관리자 암호"
          />
          <button className="button small" type="submit" disabled={pinInput.length < 4}>
            잠금 해제
          </button>
        </form>
        {error ? (
          <div className="status-callout admin-gate-error" role="alert">
            {error}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="admin-gate unlocked">
      <div className="admin-gate-lock-row">
        <span className="status-pill live">잠금 해제됨</span>
        <button className="button ghost small" type="button" onClick={handleLock}>
          다시 잠그기
        </button>
      </div>
      {children}
    </div>
  )
}
