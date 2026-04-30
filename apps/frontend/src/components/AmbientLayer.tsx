import { type CSSProperties } from 'react'

// 크레마 배경 (느린 라디얼 블롭 + 작은 거품 + 그레인) + 스팀 puff.
// Claude Design "사내 커피 취합 주문" 핸드오프(② Steam + ④ Crema) 의
// CremaBackground / SteamLayer 를 우리 앱의 모바일 프레임(.shell) 바깥
// body 영역에 입혀, 데스크탑/태블릿에선 디바이스 frame 뒤가 일렁이고
// 모바일에서도 frame 뒤 브라우저 배경이 일렁이도록 합니다.

const BUBBLE_COUNT = 24
const STEAM_PUFFS: Array<{
  left: string
  size: number
  dur: number
  delay: number
  sx: string
  tint: string
}> = [
  { left: '12%', size: 220, dur: 14, delay: 0, sx: '20px', tint: 'rgba(255,245,225,0.45)' },
  { left: '28%', size: 180, dur: 17, delay: 4, sx: '-15px', tint: 'rgba(255,240,220,0.38)' },
  { left: '50%', size: 260, dur: 19, delay: 2, sx: '30px', tint: 'rgba(255,250,235,0.5)' },
  { left: '72%', size: 200, dur: 16, delay: 7, sx: '-25px', tint: 'rgba(255,242,222,0.4)' },
  { left: '88%', size: 170, dur: 15, delay: 10, sx: '10px', tint: 'rgba(255,238,218,0.35)' },
  { left: '38%', size: 140, dur: 13, delay: 12, sx: '20px', tint: 'rgba(255,245,225,0.3)' },
  { left: '62%', size: 230, dur: 18, delay: 5, sx: '-20px', tint: 'rgba(255,240,222,0.42)' },
]

export function AmbientLayer() {
  return (
    <div className="ambient-layer" aria-hidden="true">
      <div className="ambient-blob ambient-blob-a" />
      <div className="ambient-blob ambient-blob-b" />
      <div className="ambient-blob ambient-blob-c" />
      <div className="ambient-blob ambient-blob-d" />

      {Array.from({ length: BUBBLE_COUNT }, (_, i) => {
        const top = (i * 37 + 13) % 100
        const left = (i * 71 + 7) % 100
        const size = 2 + (i % 4)
        const dur = 4 + (i % 5)
        const delay = (i * 0.4) % 6
        const style: CSSProperties = {
          top: `${top}%`,
          left: `${left}%`,
          width: size,
          height: size,
          animationDuration: `${dur}s`,
          animationDelay: `${delay}s`,
        }
        return <span className="ambient-bubble" key={i} style={style} />
      })}

      <div className="ambient-grain" />

      <div className="ambient-steam">
        {STEAM_PUFFS.map((p, i) => {
          const style: CSSProperties = {
            left: p.left,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle at 50% 50%, ${p.tint}, transparent 65%)`,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            ['--steam-sx' as string]: p.sx,
          }
          return <span className="ambient-steam-puff" key={i} style={style} />
        })}
      </div>
    </div>
  )
}

export function HeroCrema() {
  return (
    <div className="hero-crema" aria-hidden="true">
      <div className="hero-crema-blob hero-crema-blob-a" />
      <div className="hero-crema-blob hero-crema-blob-b" />
      {Array.from({ length: 12 }, (_, i) => {
        const top = (i * 41 + 10) % 90
        const left = (i * 67 + 5) % 95
        const dur = 3 + (i % 4)
        const delay = (i * 0.3) % 4
        const style: CSSProperties = {
          top: `${top}%`,
          left: `${left}%`,
          animationDuration: `${dur}s`,
          animationDelay: `${delay}s`,
        }
        return <span className="hero-crema-spark" key={i} style={style} />
      })}
    </div>
  )
}
