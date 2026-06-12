import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { type Team } from '../lib/meeting'

type TeamsPanelProps = {
  teams: Team[]
  onCreateTeam: (name: string) => void
  onRenameTeam: (teamId: string, name: string) => void
  onDeleteTeam: (teamId: string) => void
  onAddMember: (teamId: string, name: string) => void
  onRemoveMember: (teamId: string, memberName: string) => void
  onApplyTeamToMeeting?: (teamId: string) => void
}

function splitNames(raw: string): string[] {
  return raw
    .split(/[\n,，;；]/)
    .map((part) => part.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
}

function dedupeKey(name: string): string {
  return name.normalize('NFKC').toLocaleLowerCase('ko-KR')
}

export function TeamsPanel({
  teams,
  onCreateTeam,
  onRenameTeam,
  onDeleteTeam,
  onAddMember,
  onRemoveMember,
  onApplyTeamToMeeting,
}: TeamsPanelProps) {
  const [newTeamInput, setNewTeamInput] = useState('')
  const [memberDrafts, setMemberDrafts] = useState<Record<string, string>>({})
  const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>({})
  const [movingMemberId, setMovingMemberId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current)
      }
    }
  }, [])

  function flashFeedback(message: string) {
    setFeedback(message)
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current)
    }
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback('')
      feedbackTimerRef.current = null
    }, 4000)
  }

  const emptyTeams = useMemo(
    () => teams.filter((team) => team.members.length === 0),
    [teams],
  )

  const totalMembers = useMemo(
    () => teams.reduce((sum, team) => sum + team.members.length, 0),
    [teams],
  )

  function handleCreateTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const names = splitNames(newTeamInput)
    if (names.length === 0) return

    const existingKeys = new Set(teams.map((team) => dedupeKey(team.name)))
    let createdCount = 0
    let skippedCount = 0

    for (const name of names) {
      const key = dedupeKey(name)
      if (existingKeys.has(key)) {
        skippedCount++
        continue
      }
      existingKeys.add(key)
      onCreateTeam(name)
      createdCount++
    }

    setNewTeamInput('')
    if (createdCount > 0 && skippedCount > 0) {
      flashFeedback(`팀 ${createdCount}개 추가 · 중복 ${skippedCount}개는 건너뛰었어요.`)
    } else if (createdCount > 0) {
      flashFeedback(`팀 ${createdCount}개를 추가했어요.`)
    } else if (skippedCount > 0) {
      flashFeedback(`이미 있는 팀이라 추가하지 않았어요.`)
    }
  }

  function handleAddMember(teamId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = (memberDrafts[teamId] ?? '').trim()
    if (!value) return

    const team = teams.find((entry) => entry.id === teamId)
    const existingKeys = new Set((team?.members ?? []).map(dedupeKey))
    const names = splitNames(value)

    let added = 0
    for (const name of names) {
      const key = dedupeKey(name)
      if (existingKeys.has(key)) continue
      existingKeys.add(key)
      onAddMember(teamId, name)
      added++
    }

    setMemberDrafts((prev) => ({ ...prev, [teamId]: '' }))
    if (added > 0) {
      flashFeedback(`멤버 ${added}명을 추가했어요.`)
    }
  }

  function clearRenameDraft(teamId: string) {
    setRenameDrafts((prev) => {
      const rest = { ...prev }
      delete rest[teamId]
      return rest
    })
  }

  function handleRenameSubmit(team: Team, event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = (renameDrafts[team.id] ?? team.name).trim()
    if (next && next !== team.name) {
      onRenameTeam(team.id, next)
    }
    clearRenameDraft(team.id)
  }

  function handleDeleteTeam(team: Team) {
    // 멤버 없는 빈 팀은 가벼우니 확인 다이얼로그를 생략해 부담을 낮춘다.
    if (team.members.length > 0) {
      const ok = window.confirm(
        `"${team.name}" 팀을 삭제할까요? 멤버 ${team.members.length}명도 함께 삭제됩니다.`,
      )
      if (!ok) return
    }
    onDeleteTeam(team.id)
    flashFeedback(`"${team.name}" 팀을 삭제했어요.`)
  }

  function handleDuplicateTeam(team: Team) {
    const baseName = team.name
    const existingKeys = new Set(teams.map((entry) => dedupeKey(entry.name)))
    let suffix = 2
    let candidate = `${baseName} 사본`
    while (existingKeys.has(dedupeKey(candidate))) {
      suffix += 1
      candidate = `${baseName} 사본 ${suffix}`
    }
    onCreateTeam(candidate)
    // 새 팀의 id 는 onCreateTeam 결과로 알 수 없으므로, 가장 가까운 시점에 같은
    // 이름을 가진 팀을 찾아 멤버를 한 번에 옮기지 않고, 호출자가 자체적으로
    // 멤버를 추가하도록 위임한다. 호출자 컨텍스트(App.tsx) 에서 새 팀 등장 후
    // 다음 렌더에 멤버 추가를 트리거하기보다 간단히 안내만 띄운다.
    flashFeedback(
      `"${candidate}" 빈 팀을 만들었어요. 멤버는 옆에서 옮기거나 새로 추가하세요.`,
    )
  }

  function handlePurgeEmptyTeams() {
    if (emptyTeams.length === 0) return
    if (
      !window.confirm(
        `멤버 0명인 팀 ${emptyTeams.length}개를 모두 삭제할까요?`,
      )
    ) {
      return
    }
    for (const team of emptyTeams) {
      onDeleteTeam(team.id)
    }
    flashFeedback(`빈 팀 ${emptyTeams.length}개를 정리했어요.`)
  }

  function handleMoveMember(
    sourceTeamId: string,
    memberName: string,
    targetTeamId: string,
  ) {
    const target = teams.find((team) => team.id === targetTeamId)
    if (!target) return
    const alreadyExists = target.members.some(
      (existing) => dedupeKey(existing) === dedupeKey(memberName),
    )
    if (!alreadyExists) {
      onAddMember(targetTeamId, memberName)
    }
    onRemoveMember(sourceTeamId, memberName)
    setMovingMemberId(null)
    flashFeedback(
      alreadyExists
        ? `"${memberName}" 은 이미 ${target.name} 에 있어 옮기지 않고 원래 팀에서 제거했어요.`
        : `"${memberName}" 을 ${target.name} 으로 옮겼어요.`,
    )
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <span className="panel-kicker">팀 관리</span>
          <h2>자주 쓰는 팀과 멤버</h2>
        </div>
        <span className="status-pill neutral">
          {teams.length}팀 · {totalMembers}명
        </span>
      </div>

      <p className="panel-note">
        조직 개편이 잦은 환경을 가정해 만들었습니다. 새 팀은 여러 개를 한 번에
        붙여넣어 만들고, 멤버는 다른 팀으로 바로 옮기거나 칩의 ✕ 로 빼고, 빈
        팀은 한 번에 정리할 수 있어요.
      </p>

      <form className="inline-form stacked" onSubmit={handleCreateTeam}>
        <textarea
          value={newTeamInput}
          onChange={(event) => setNewTeamInput(event.target.value)}
          placeholder={'새 팀 이름 — 여러 개는 줄바꿈/쉼표로 구분\n예: 마케팅팀\n   영업1팀, 영업2팀'}
          rows={2}
        />
        <div className="button-row">
          <button className="button" type="submit">
            팀 추가
          </button>
          {emptyTeams.length > 0 ? (
            <button
              className="button ghost small"
              type="button"
              onClick={handlePurgeEmptyTeams}
            >
              빈 팀 {emptyTeams.length}개 모두 삭제
            </button>
          ) : null}
        </div>
      </form>

      {feedback ? (
        <div className="status-callout success-callout" role="status">
          {feedback}
        </div>
      ) : null}

      {teams.length === 0 ? (
        <div className="empty-state compact">
          아직 팀이 없습니다. 위 입력창에서 팀을 만들어 보세요.
        </div>
      ) : (
        <div className="team-list">
          {teams.map((team) => {
            const isRenaming = renameDrafts[team.id] !== undefined
            const otherTeams = teams.filter((entry) => entry.id !== team.id)
            return (
              <article className="team-card" key={team.id}>
                <header className="team-card-head">
                  {isRenaming ? (
                    <form
                      className="inline-form stacked team-rename-form"
                      onSubmit={(event) => handleRenameSubmit(team, event)}
                    >
                      <input
                        autoFocus
                        value={renameDrafts[team.id] ?? ''}
                        onChange={(event) =>
                          setRenameDrafts((prev) => ({
                            ...prev,
                            [team.id]: event.target.value,
                          }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') {
                            event.preventDefault()
                            clearRenameDraft(team.id)
                          }
                        }}
                      />
                      <div className="button-row">
                        <button className="button small" type="submit">
                          저장
                        </button>
                        <button
                          className="button ghost small"
                          type="button"
                          onClick={() => clearRenameDraft(team.id)}
                        >
                          취소
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="team-card-title">
                        <strong>{team.name}</strong>
                        <span>{team.members.length}명</span>
                      </div>
                      <div className="button-row">
                        {onApplyTeamToMeeting ? (
                          <button
                            className="button secondary small"
                            type="button"
                            onClick={() => onApplyTeamToMeeting(team.id)}
                            disabled={team.members.length === 0}
                          >
                            현재 미팅에 추가
                          </button>
                        ) : null}
                        <button
                          className="button ghost small"
                          type="button"
                          onClick={() =>
                            setRenameDrafts((prev) => ({
                              ...prev,
                              [team.id]: team.name,
                            }))
                          }
                        >
                          이름 변경
                        </button>
                        <button
                          className="button ghost small"
                          type="button"
                          onClick={() => handleDuplicateTeam(team)}
                          title="같은 이름으로 빈 팀 한 개를 더 만들어요"
                        >
                          복제
                        </button>
                        <button
                          className="button ghost small team-delete-button"
                          type="button"
                          onClick={() => handleDeleteTeam(team)}
                        >
                          팀 삭제
                        </button>
                      </div>
                    </>
                  )}
                </header>

                {team.members.length === 0 ? (
                  <div className="empty-state compact">
                    멤버가 없습니다. 아래에서 이름을 추가하거나 다른 팀에서 옮겨오세요.
                  </div>
                ) : (
                  <div className="team-member-row">
                    {team.members.map((memberName) => {
                      const memberId = `${team.id}::${memberName}`
                      const isMoving = movingMemberId === memberId
                      return (
                        <span className="team-member-chip" key={memberName}>
                          <span className="team-member-name">{memberName}</span>
                          {otherTeams.length > 0 ? (
                            isMoving ? (
                              <select
                                className="team-member-move"
                                autoFocus
                                defaultValue=""
                                onChange={(event) => {
                                  const targetTeamId = event.target.value
                                  if (targetTeamId) {
                                    handleMoveMember(
                                      team.id,
                                      memberName,
                                      targetTeamId,
                                    )
                                  } else {
                                    setMovingMemberId(null)
                                  }
                                }}
                                onBlur={() => setMovingMemberId(null)}
                              >
                                <option value="">옮길 팀 선택…</option>
                                {otherTeams.map((other) => (
                                  <option key={other.id} value={other.id}>
                                    {other.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <button
                                aria-label={`${memberName} 다른 팀으로 이동`}
                                className="team-member-move-button"
                                type="button"
                                title="다른 팀으로 이동"
                                onClick={() => setMovingMemberId(memberId)}
                              >
                                ↔
                              </button>
                            )
                          ) : null}
                          <button
                            aria-label={`${memberName} 멤버 삭제`}
                            className="team-member-remove"
                            type="button"
                            onClick={() => onRemoveMember(team.id, memberName)}
                          >
                            ×
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}

                <form
                  className="inline-form stacked"
                  onSubmit={(event) => handleAddMember(team.id, event)}
                >
                  <input
                    value={memberDrafts[team.id] ?? ''}
                    onChange={(event) =>
                      setMemberDrafts((prev) => ({
                        ...prev,
                        [team.id]: event.target.value,
                      }))
                    }
                    placeholder="멤버 이름 (여러 명은 줄바꿈/쉼표로 구분)"
                  />
                  <button className="button secondary small" type="submit">
                    멤버 추가
                  </button>
                </form>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
