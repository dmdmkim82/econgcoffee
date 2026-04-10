import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchStarbucksDrinkCatalog,
  type StarbucksCatalogMenu,
} from '../lib/api'
import {
  CAFE_PRESETS,
  STARBUCKS_CAFE_NAME,
  type CafePresetName,
  type CreateMenuSeed,
  type Snapshot,
} from '../lib/meeting'
import { BrandLogo } from './BrandLogo'
import { CreateMeetingSheet } from './CreateMeetingSheet'
import { StarbucksCategorySheet } from './StarbucksCategorySheet'

type CreateMeetingPayload = {
  title: string
  cafeName: CafePresetName
  attendeeNames: string[]
  menuSeeds?: CreateMenuSeed[]
}

type PendingStarbucksMeeting = Omit<CreateMeetingPayload, 'menuSeeds'>

type MeetingRouteState = {
  openStarbucksCategorySheet?: boolean
}

type HomePageProps = {
  meetings: Snapshot[]
  theme: 'light' | 'dark'
  onCreateMeeting: (payload: CreateMeetingPayload) => string
  onDeleteMeeting: (shareCode: string) => void
  onToggleTheme: () => void
}

function getStarbucksMenuKey(menu: StarbucksCatalogMenu) {
  return `${menu.categoryName}::${menu.name}`
}

function toMenuSeeds(menus: StarbucksCatalogMenu[]): CreateMenuSeed[] {
  return menus.map((menu) => ({
    name: menu.name,
    price: menu.price,
    availableTemperatures: menu.availableTemperatures,
    nutritionInfo: menu.nutritionInfo,
  }))
}

function isClosed(snapshot: Snapshot) {
  return (
    snapshot.meeting.manuallyClosed ||
    (Boolean(snapshot.meeting.deadline) &&
      new Date(snapshot.meeting.deadline).getTime() <= Date.now())
  )
}

function countCompleted(snapshot: Snapshot) {
  return snapshot.attendees.filter(
    (attendee) => attendee.skipped || attendee.menuItemId,
  ).length
}

export function HomePage({
  meetings,
  theme,
  onCreateMeeting,
  onDeleteMeeting,
  onToggleTheme,
}: HomePageProps) {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)
  const [draftMeetingTitle, setDraftMeetingTitle] = useState('')
  const [draftCafeName, setDraftCafeName] = useState<CafePresetName | ''>('')
  const [isStarbucksSheetOpen, setIsStarbucksSheetOpen] = useState(false)
  const [isLoadingStarbucks, setIsLoadingStarbucks] = useState(false)
  const [starbucksMenus, setStarbucksMenus] = useState<StarbucksCatalogMenu[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedMenuKeys, setSelectedMenuKeys] = useState<string[]>([])
  const [starbucksError, setStarbucksError] = useState('')
  const [pendingStarbucksMeeting, setPendingStarbucksMeeting] =
    useState<PendingStarbucksMeeting | null>(null)
  const canCreateMeeting = Boolean(draftMeetingTitle.trim() && draftCafeName)

  const summary = useMemo(() => {
    return meetings.reduce(
      (accumulator, snapshot) => ({
        meetings: accumulator.meetings + 1,
        activeMeetings: accumulator.activeMeetings + (isClosed(snapshot) ? 0 : 1),
        attendees: accumulator.attendees + snapshot.attendees.length,
      }),
      {
        meetings: 0,
        activeMeetings: 0,
        attendees: 0,
      },
    )
  }, [meetings])

  const starbucksCategories = useMemo(() => {
    const counts = new Map<string, number>()

    for (const menu of starbucksMenus) {
      counts.set(menu.categoryName, (counts.get(menu.categoryName) ?? 0) + 1)
    }

    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => left.name.localeCompare(right.name, 'ko-KR'))
  }, [starbucksMenus])

  const filteredStarbucksMenus = useMemo(
    () =>
      starbucksMenus.filter((menu) => selectedCategories.includes(menu.categoryName)),
    [selectedCategories, starbucksMenus],
  )

  function resetCreateDraft() {
    setDraftMeetingTitle('')
    setDraftCafeName('')
    setIsCreateSheetOpen(false)
    setPendingStarbucksMeeting(null)
    setIsStarbucksSheetOpen(false)
    setStarbucksError('')
    setSelectedCategories([])
    setSelectedMenuKeys([])
  }

  function openMeeting(
    shareCode: string,
    role: 'organizer' | 'join',
    state?: MeetingRouteState,
  ) {
    navigate(`/meeting/${shareCode}/${role}`, state ? { state } : undefined)
  }

  function finalizeCreateMeeting(payload: CreateMeetingPayload) {
    const finalCafeName = draftCafeName || payload.cafeName
    const menuSeeds = payload.menuSeeds ?? []
    const shareCode = onCreateMeeting({
      ...payload,
      title: draftMeetingTitle.trim(),
      cafeName: finalCafeName,
      menuSeeds,
    })

    openMeeting(shareCode, 'organizer', {
      openStarbucksCategorySheet:
        finalCafeName === STARBUCKS_CAFE_NAME && menuSeeds.length === 0,
    })

    resetCreateDraft()
  }

  async function openStarbucksSelection() {
    setIsStarbucksSheetOpen(true)

    if (starbucksMenus.length > 0) {
      const nextSelectedCategories = [
        ...new Set(starbucksMenus.map((menu) => menu.categoryName)),
      ].sort((left, right) => left.localeCompare(right, 'ko-KR'))

      setSelectedCategories(
        selectedCategories.length > 0 ? selectedCategories : nextSelectedCategories,
      )
      setSelectedMenuKeys(
        selectedMenuKeys.length > 0
          ? selectedMenuKeys
          : starbucksMenus.map(getStarbucksMenuKey),
      )
      return
    }

    setIsLoadingStarbucks(true)
    setStarbucksError('')

    try {
      const payload = await fetchStarbucksDrinkCatalog()
      const nextSelectedCategories = [
        ...new Set(payload.menus.map((menu) => menu.categoryName)),
      ].sort((left, right) => left.localeCompare(right, 'ko-KR'))

      setStarbucksMenus(payload.menus)
      setSelectedCategories(nextSelectedCategories)
      setSelectedMenuKeys(payload.menus.map(getStarbucksMenuKey))
    } catch {
      setStarbucksError(
        '스타벅스 메뉴를 불러오지 못했습니다. 서버 연결을 확인한 뒤 다시 시도해주세요.',
      )
    } finally {
      setIsLoadingStarbucks(false)
    }
  }

  function handleCreateMeeting(payload: {
    attendeeNames: string[]
  }) {
    const nextCafeName = draftCafeName || CAFE_PRESETS[0]

    if (nextCafeName !== STARBUCKS_CAFE_NAME) {
      finalizeCreateMeeting({
        attendeeNames: payload.attendeeNames,
        title: draftMeetingTitle.trim(),
        cafeName: nextCafeName,
      })
      return
    }

    setPendingStarbucksMeeting({
      attendeeNames: payload.attendeeNames,
      title: draftMeetingTitle.trim(),
      cafeName: nextCafeName,
    })
    setIsCreateSheetOpen(false)
    void openStarbucksSelection()
  }

  function handleConfirmStarbucksMenus() {
    if (!pendingStarbucksMeeting) {
      return
    }

    const selectedMenus = starbucksMenus.filter(
      (menu) =>
        selectedCategories.includes(menu.categoryName) &&
        selectedMenuKeys.includes(getStarbucksMenuKey(menu)),
    )

    if (selectedMenus.length === 0) {
      return
    }

    finalizeCreateMeeting({
      ...pendingStarbucksMeeting,
      menuSeeds: toMenuSeeds(selectedMenus),
    })
  }

  function handleToggleCategory(categoryName: string) {
    const categoryMenuKeys = starbucksMenus
      .filter((menu) => menu.categoryName === categoryName)
      .map(getStarbucksMenuKey)

    setSelectedCategories((currentCategories) => {
      const nextCategories = currentCategories.includes(categoryName)
        ? currentCategories.filter((item) => item !== categoryName)
        : [...currentCategories, categoryName].sort((left, right) =>
            left.localeCompare(right, 'ko-KR'),
          )

      setSelectedMenuKeys((currentMenuKeys) => {
        if (currentCategories.includes(categoryName)) {
          return currentMenuKeys.filter((menuKey) => !categoryMenuKeys.includes(menuKey))
        }

        return [...new Set([...currentMenuKeys, ...categoryMenuKeys])]
      })

      return nextCategories
    })
  }

  function handleToggleMenu(menuKey: string) {
    setSelectedMenuKeys((currentMenuKeys) =>
      currentMenuKeys.includes(menuKey)
        ? currentMenuKeys.filter((item) => item !== menuKey)
        : [...currentMenuKeys, menuKey],
    )
  }

  function handleOpenCreateSheet() {
    if (!canCreateMeeting) {
      return
    }

    setIsCreateSheetOpen(true)
  }

  function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const shareCode = code.trim().toUpperCase()

    if (!shareCode) {
      return
    }

    openMeeting(shareCode, 'join')
  }

  return (
    <div className="shell">
      <CreateMeetingSheet
        open={isCreateSheetOpen}
        title={draftMeetingTitle}
        cafeName={draftCafeName}
        onClose={() => setIsCreateSheetOpen(false)}
        onSubmit={handleCreateMeeting}
      />

      <StarbucksCategorySheet
        open={isStarbucksSheetOpen}
        loading={isLoadingStarbucks}
        error={starbucksError}
        categories={starbucksCategories}
        menus={filteredStarbucksMenus.map((menu) => ({
          key: getStarbucksMenuKey(menu),
          name: menu.name,
          categoryName: menu.categoryName,
          availableTemperatures: menu.availableTemperatures,
        }))}
        selectedCategories={selectedCategories}
        selectedMenuKeys={selectedMenuKeys}
        onClose={() => {
          setIsStarbucksSheetOpen(false)
          setPendingStarbucksMeeting(null)
        }}
        onToggleCategory={handleToggleCategory}
        onSelectAll={() => {
          setSelectedCategories(starbucksCategories.map((category) => category.name))
          setSelectedMenuKeys(starbucksMenus.map(getStarbucksMenuKey))
        }}
        onClearAll={() => {
          setSelectedCategories([])
          setSelectedMenuKeys([])
        }}
        onToggleMenu={handleToggleMenu}
        onSelectAllMenus={() =>
          setSelectedMenuKeys((currentMenuKeys) => [
            ...new Set([
              ...currentMenuKeys,
              ...filteredStarbucksMenus.map(getStarbucksMenuKey),
            ]),
          ])
        }
        onClearMenus={() =>
          setSelectedMenuKeys((currentMenuKeys) =>
            currentMenuKeys.filter(
              (menuKey) =>
                !filteredStarbucksMenus
                  .map(getStarbucksMenuKey)
                  .includes(menuKey),
            ),
          )
        }
        onConfirm={handleConfirmStarbucksMenus}
      />

      <div className="compact-home">
        <div className="home-utility-row">
          <button className="button secondary small" type="button" onClick={onToggleTheme}>
            {theme === 'dark' ? '라이트 모드' : '다크 모드'}
          </button>
        </div>

        <section className="compact-home-hero">
          <article className="panel compact-home-copy home-brand-panel">
            <span className="eyebrow">SK에코플랜트 미팅 커피 취합</span>
            <BrandLogo size="hero" />
            <p className="hero-description">
              취합자가 카페를 먼저 정하고, 참석자는 자기 이름을 눌러 바로 메뉴를 고를
              수 있습니다.
            </p>
            <div className="compact-metric-grid">
              <article className="mini-stat">
                <span>전체 모임</span>
                <strong>{summary.meetings}</strong>
              </article>
              <article className="mini-stat">
                <span>진행 중</span>
                <strong>{summary.activeMeetings}</strong>
              </article>
              <article className="mini-stat">
                <span>참석자</span>
                <strong>{summary.attendees}</strong>
              </article>
            </div>
          </article>

          <aside className="panel quick-action-card">
            <div className="panel-head">
              <div>
                <span className="panel-kicker">바로 시작</span>
                <h2>미팅 이름과 카페를 먼저 정하고 시작하세요</h2>
              </div>
            </div>
            <div className="quick-action-grid">
              <label className="field field-full">
                <span>새 미팅 이름</span>
                <input
                  value={draftMeetingTitle}
                  onChange={(event) => setDraftMeetingTitle(event.target.value)}
                  placeholder="예: 공정회의 커피 주문"
                />
              </label>
              <div className="field field-full">
                <span>카페 선택</span>
                <div className="checkbox-group">
                  {CAFE_PRESETS.map((presetCafeName) => (
                    <button
                      className={`button ghost small ${
                        draftCafeName === presetCafeName ? 'active-chip' : ''
                      }`}
                      key={presetCafeName}
                      type="button"
                      onClick={() => setDraftCafeName(presetCafeName)}
                    >
                      {presetCafeName}
                    </button>
                  ))}
                </div>
              </div>
              {draftCafeName ? (
                <div className="status-callout">
                  {draftCafeName === STARBUCKS_CAFE_NAME
                    ? '스타벅스는 참석자 입력 뒤 카테고리와 메뉴를 먼저 고른 다음 미팅이 만들어집니다.'
                    : "L'atelier는 기본 메뉴가 포함된 상태로 바로 미팅이 열립니다."}
                </div>
              ) : (
                <div className="status-callout">
                  먼저 카페를 고르면 한 카페 기준으로만 미팅이 만들어집니다.
                </div>
              )}
              {!draftMeetingTitle.trim() ? (
                <div className="status-callout">
                  미팅 이름을 먼저 적어야 어떤 회의 주문인지 바로 구분할 수 있습니다.
                </div>
              ) : null}
              <button
                className="button"
                type="button"
                disabled={!canCreateMeeting}
                onClick={handleOpenCreateSheet}
              >
                새 미팅 만들기
              </button>
              <form className="join-form compact" onSubmit={handleJoin}>
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="모임 코드 입력"
                />
                <button className="button secondary" type="submit">
                  코드로 참석
                </button>
              </form>
            </div>
          </aside>
        </section>

        <section className="panel home-panel">
          <div className="panel-head">
            <div>
              <span className="panel-kicker">최근 모임</span>
              <h2>다시 이어서 보기</h2>
            </div>
            <span className="status-pill neutral">{meetings.length}개 저장됨</span>
          </div>

          {meetings.length === 0 ? (
            <div className="empty-state compact">
              아직 저장된 미팅이 없습니다. 첫 미팅을 만들어 커피 주문을 시작해보세요.
            </div>
          ) : (
            <div className="recent-card-list">
              {meetings.map((snapshot) => {
                const closed = isClosed(snapshot)
                const completed = countCompleted(snapshot)

                return (
                  <article
                    className="meeting-card recent-card"
                    key={snapshot.meeting.shareCode}
                  >
                    <div className="meeting-card-copy">
                      <div className="button-row">
                        <span className={`status-pill ${closed ? 'danger' : 'live'}`}>
                          {closed ? '마감' : '진행 중'}
                        </span>
                        <span className="status-pill neutral">
                          코드 {snapshot.meeting.shareCode}
                        </span>
                      </div>
                      <strong>{snapshot.meeting.title || '에콩커피 모임'}</strong>
                      <span>
                        {snapshot.meeting.cafeName || '카페 미정'} /{' '}
                        {snapshot.meeting.place || '장소 미정'}
                      </span>
                      <span>
                        주문 응답 {completed}/{snapshot.attendees.length}명 · 메뉴{' '}
                        {snapshot.menuItems.length}개
                      </span>
                    </div>

                    <div className="meeting-card-actions">
                      <button
                        className="button small"
                        type="button"
                        onClick={() =>
                          openMeeting(snapshot.meeting.shareCode, 'organizer')
                        }
                      >
                        취합 화면
                      </button>
                      <button
                        className="button secondary small"
                        type="button"
                        onClick={() => openMeeting(snapshot.meeting.shareCode, 'join')}
                      >
                        참석 화면
                      </button>
                      <button
                        className="button ghost small"
                        type="button"
                        onClick={() => onDeleteMeeting(snapshot.meeting.shareCode)}
                      >
                        삭제
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
