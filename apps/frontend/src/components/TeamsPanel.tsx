import { useState, type FormEvent } from 'react'
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

export function TeamsPanel({
  teams,
  onCreateTeam,
  onRenameTeam,
  onDeleteTeam,
  onAddMember,
  onRemoveMember,
  onApplyTeamToMeeting,
}: TeamsPanelProps) {
  const [newTeamName, setNewTeamName] = useState('')
  const [memberDrafts, setMemberDrafts] = useState<Record<string, string>>({})
  const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>({})

  function handleCreateTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = newTeamName.trim()
    if (!trimmed) return
    onCreateTeam(trimmed)
    setNewTeamName('')
  }

  function handleAddMember(teamId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = (memberDrafts[teamId] ?? '').trim()
    if (!value) return
    const lines = value.split(/[\n,，;；]/).map((n) => n.trim()).filter(Boolean)
    for (const line of lines) {
      onAddMember(teamId, line)
    }
    setMemberDrafts((prev) => ({ ...prev, [teamId]: '' }))
  }

  function handleRenameSubmit(team: Team, event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = (renameDrafts[team.id] ?? team.name).trim()
    if (!next || next === team.name) {
      setRenameDrafts((prev) => {
        const { [team.id]: _, ...rest } = prev
        return rest
      })
      return
    }
    onRenameTeam(team.id, next)
    setRenameDrafts((prev) => {
      const { [team.id]: _, ...rest } = prev
      return rest
    })
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <span className="panel-kicker">팀 관리</span>
          <h2>자주 쓰는 팀과 멤버</h2>
        </div>
        <span className="status-pill neutral">{teams.length}개 팀</span>
      </div>

      <p className="panel-note">
        팀을 만들고 멤버를 등록해 두면 새 미팅 만들기에서 칩 한 번으로 바로
        명단을 추가할 수 있어요.
      </p>

      <form className="inline-form stacked" onSubmit={handleCreateTeam}>
        <input
          value={newTeamName}
          onChange={(event) => setNewTeamName(event.target.value)}
          placeholder="새 팀 이름 (예: 마케팅팀)"
        />
        <button className="button" type="submit">
          팀 추가
        </button>
      </form>

      {teams.length === 0 ? (
        <div className="empty-state compact">
          아직 팀이 없습니다. 위 입력창에서 팀을 만들어 보세요.
        </div>
      ) : (
        <div className="team-list">
          {teams.map((team) => {
            const isRenaming = renameDrafts[team.id] !== undefined
            return (
              <article className="team-card" key={team.id}>
                <header className="team-card-head">
                  {isRenaming ? (
                    <form
                      className="inline-form stacked"
                      onSubmit={(event) => handleRenameSubmit(team, event)}
                    >
                      <input
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus
                        value={renameDrafts[team.id] ?? ''}
                        onChange={(event) =>
                          setRenameDrafts((prev) => ({
                            ...prev,
                            [team.id]: event.target.value,
                          }))
                        }
                      />
                      <button className="button small" type="submit">
                        저장
                      </button>
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
                          onClick={() => {
                            if (
                              window.confirm(
                                `"${team.name}" 팀을 삭제할까요? 멤버 ${team.members.length}명도 함께 삭제됩니다.`,
                              )
                            ) {
                              onDeleteTeam(team.id)
                            }
                          }}
                        >
                          팀 삭제
                        </button>
                      </div>
                    </>
                  )}
                </header>

                {team.members.length === 0 ? (
                  <div className="empty-state compact">
                    멤버가 없습니다. 아래에서 이름을 추가하세요.
                  </div>
                ) : (
                  <div className="team-member-row">
                    {team.members.map((memberName) => (
                      <span className="team-member-chip" key={memberName}>
                        {memberName}
                        <button
                          aria-label={`${memberName} 멤버 삭제`}
                          className="team-member-remove"
                          type="button"
                          onClick={() => onRemoveMember(team.id, memberName)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
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
