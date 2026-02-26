import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { matchProspectToTeams, type TeamFitMatch } from './teamSchemeFit'

type CombineDay = 'Day 1' | 'Day 2' | 'Day 3' | 'Day 4'

type Player = {
  id: number | string
  name: string
  position: string
  college: string
  day: CombineDay
  fortyYard: number | null
  tenYardSplit: number | null
  vertical: number | null
  broadJump: number | null
  shuttle: number | null
  threeCone: number | null
  benchReps: number | null
  weightLbs: number | null
  throwVelocity: number | null
  armLength: number | null
  updates: number
}

type ScoredPlayer = Player & {
  totalScore: number
  roundProjection: string
}

type ViewMode = 'overview' | 'speed' | 'board' | 'risers' | 'analytics' | 'settings'

type AnalyticsPlayer = Player & {
  accelerationScore: number | null
  explosivenessIndex: number | null
  agilityComposite: number | null
  powerRating: number | null
  throwVelocityScore: number | null
  athleticScore: number
  positionAdjustedPercentile: number | null
}

type NormalizedApiResponse = {
  source?: string
  fetchedAt?: string
  players?: Player[]
  rawCount?: number
}

const initialPlayers: Player[] = [
  { id: 1, name: 'Trey Hollis', position: 'WR', college: 'Texas', day: 'Day 1', fortyYard: 4.41, tenYardSplit: 1.52, vertical: 38, broadJump: 127, shuttle: 4.19, threeCone: 6.91, benchReps: 14, weightLbs: 197, throwVelocity: null, armLength: 31.2, updates: 1 },
  { id: 2, name: 'Keenan Wallace', position: 'CB', college: 'Ohio State', day: 'Day 1', fortyYard: 4.35, tenYardSplit: 1.48, vertical: 40, broadJump: 132, shuttle: 4.08, threeCone: 6.82, benchReps: 15, weightLbs: 192, throwVelocity: null, armLength: 32.4, updates: 1 },
  { id: 3, name: 'Mason Boyd', position: 'RB', college: 'Georgia', day: 'Day 2', fortyYard: 4.49, tenYardSplit: 1.55, vertical: 36, broadJump: 123, shuttle: 4.24, threeCone: 7.06, benchReps: 19, weightLbs: 214, throwVelocity: null, armLength: 30.8, updates: 1 },
  { id: 4, name: 'Jalen Porter', position: 'WR', college: 'USC', day: 'Day 2', fortyYard: null, tenYardSplit: null, vertical: null, broadJump: null, shuttle: null, threeCone: null, benchReps: null, weightLbs: 201, throwVelocity: null, armLength: 31.6, updates: 0 },
  { id: 5, name: 'Noah Banks', position: 'EDGE', college: 'Alabama', day: 'Day 3', fortyYard: 4.61, tenYardSplit: 1.64, vertical: 35, broadJump: 121, shuttle: 4.36, threeCone: 7.21, benchReps: 24, weightLbs: 262, throwVelocity: null, armLength: 33.1, updates: 1 },
  { id: 6, name: 'Tyler Green', position: 'LB', college: 'Michigan', day: 'Day 3', fortyYard: null, tenYardSplit: null, vertical: null, broadJump: null, shuttle: null, threeCone: null, benchReps: null, weightLbs: 236, throwVelocity: null, armLength: 32.0, updates: 0 },
  { id: 7, name: 'Dylan Reed', position: 'QB', college: 'Oregon', day: 'Day 4', fortyYard: 4.73, tenYardSplit: 1.69, vertical: 33, broadJump: 118, shuttle: 4.42, threeCone: 7.32, benchReps: 12, weightLbs: 221, throwVelocity: 58, armLength: 31.0, updates: 1 },
  { id: 8, name: 'Roman Hayes', position: 'TE', college: 'Notre Dame', day: 'Day 4', fortyYard: null, tenYardSplit: null, vertical: null, broadJump: null, shuttle: null, threeCone: null, benchReps: null, weightLbs: 245, throwVelocity: null, armLength: 33.2, updates: 0 },
]

const randomInRange = (min: number, max: number, precision = 2) => {
  const value = Math.random() * (max - min) + min
  return Number(value.toFixed(precision))
}

const updatePlayerResult = (player: Player): Player => {
  const nextForty = player.fortyYard ?? randomInRange(4.32, 4.9)
  const nextTenSplit = player.tenYardSplit ?? randomInRange(1.45, 1.78)
  const nextVertical = player.vertical ?? randomInRange(31, 42, 0)
  const nextBroad = player.broadJump ?? randomInRange(112, 134, 0)
  const nextShuttle = player.shuttle ?? randomInRange(4.0, 4.6)
  const nextThreeCone = player.threeCone ?? randomInRange(6.7, 7.5)
  const nextBench = player.benchReps ?? randomInRange(10, 30, 0)
  const nextWeight = player.weightLbs ?? randomInRange(190, 320, 0)
  const nextThrowVelocity = player.throwVelocity ?? (player.position === 'QB' ? randomInRange(51, 63, 0) : null)
  const nextArmLength = player.armLength ?? randomInRange(30, 34.5, 1)

  const improvedForty = Math.max(4.25, Number((nextForty - randomInRange(0, 0.03)).toFixed(2)))
  const improvedTenSplit = Math.max(1.4, Number((nextTenSplit - randomInRange(0, 0.02)).toFixed(2)))
  const improvedVertical = Math.min(44, Math.round(nextVertical + randomInRange(0, 1, 0)))
  const improvedBroad = Math.min(136, Math.round(nextBroad + randomInRange(0, 2, 0)))
  const improvedShuttle = Math.max(3.85, Number((nextShuttle - randomInRange(0, 0.03)).toFixed(2)))
  const improvedThreeCone = Math.max(6.55, Number((nextThreeCone - randomInRange(0, 0.03)).toFixed(2)))
  const improvedBench = Math.min(40, Math.round(nextBench + randomInRange(0, 1, 0)))
  const improvedWeight = Math.round(nextWeight)
  const improvedThrowVelocity = nextThrowVelocity !== null ? Math.min(70, Math.round(nextThrowVelocity + randomInRange(0, 1, 0))) : null
  const improvedArmLength = Number(nextArmLength.toFixed(1))

  return {
    ...player,
    fortyYard: improvedForty,
    tenYardSplit: improvedTenSplit,
    vertical: improvedVertical,
    broadJump: improvedBroad,
    shuttle: improvedShuttle,
    threeCone: improvedThreeCone,
    benchReps: improvedBench,
    weightLbs: improvedWeight,
    throwVelocity: improvedThrowVelocity,
    armLength: improvedArmLength,
    updates: player.updates + 1,
  }
}

const computeAccelerationScore = (player: Player) => {
  if (player.tenYardSplit === null || player.fortyYard === null || player.fortyYard === 0) {
    return null
  }
  return Number((player.tenYardSplit / player.fortyYard).toFixed(3))
}

const computeExplosivenessIndex = (player: Player) => {
  if (player.vertical === null || player.broadJump === null) {
    return null
  }
  return player.vertical + player.broadJump
}

const computeAgilityComposite = (player: Player) => {
  if (player.shuttle === null || player.threeCone === null) {
    return null
  }
  return Number((player.shuttle + player.threeCone).toFixed(2))
}

const computePowerRating = (player: Player) => {
  if (player.benchReps === null || player.weightLbs === null || player.weightLbs === 0) {
    return null
  }
  return Number(((player.benchReps / player.weightLbs) * 225).toFixed(1))
}

const computeAthleticScore = (metrics: {
  accelerationScore: number | null
  explosivenessIndex: number | null
  agilityComposite: number | null
  powerRating: number | null
  throwVelocityScore: number | null
}) => {
  let score = 0

  if (metrics.accelerationScore !== null) {
    score += Math.max(0, (0.4 - metrics.accelerationScore) * 450)
  }
  if (metrics.explosivenessIndex !== null) {
    score += Math.max(0, (metrics.explosivenessIndex - 130) * 1.1)
  }
  if (metrics.agilityComposite !== null) {
    score += Math.max(0, (12.8 - metrics.agilityComposite) * 23)
  }
  if (metrics.powerRating !== null) {
    score += Math.max(0, metrics.powerRating * 1.8)
  }
  if (metrics.throwVelocityScore !== null) {
    score += Math.max(0, (metrics.throwVelocityScore - 40) * 1.6)
  }

  return Number(score.toFixed(1))
}

const getRoundProjection = (score: number) => {
  if (score >= 265) {
    return 'Round 1'
  }
  if (score >= 245) {
    return 'Round 2'
  }
  if (score >= 230) {
    return 'Round 3'
  }
  return 'Day 3 Pick'
}

const mergeIncomingPlayers = (currentPlayers: Player[], incomingPlayers: Player[]) => {
  const currentById = new Map(currentPlayers.map((player) => [String(player.id), player]))

  return incomingPlayers.map((incomingPlayer, index) => {
    const existing = currentById.get(String(incomingPlayer.id))
    if (!existing) {
      return {
        ...incomingPlayer,
        updates: incomingPlayer.updates > 0 ? incomingPlayer.updates : 1,
      }
    }

    const hasNewData =
      existing.fortyYard !== incomingPlayer.fortyYard ||
      existing.tenYardSplit !== incomingPlayer.tenYardSplit ||
      existing.vertical !== incomingPlayer.vertical ||
      existing.broadJump !== incomingPlayer.broadJump ||
      existing.shuttle !== incomingPlayer.shuttle ||
      existing.threeCone !== incomingPlayer.threeCone ||
      existing.benchReps !== incomingPlayer.benchReps ||
      existing.weightLbs !== incomingPlayer.weightLbs ||
      existing.throwVelocity !== incomingPlayer.throwVelocity ||
      existing.armLength !== incomingPlayer.armLength

    return {
      ...existing,
      ...incomingPlayer,
      day: incomingPlayer.day ?? `Day ${((index % 4) + 1)}`,
      updates: hasNewData ? existing.updates + 1 : existing.updates,
    }
  })
}

const App = () => {
  const useRealData = import.meta.env.VITE_USE_REAL_DATA === 'true'
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [lastUpdate, setLastUpdate] = useState<string>('Waiting for first update...')
  const [dataSource, setDataSource] = useState<'simulation' | 'sportradar'>(useRealData ? 'sportradar' : 'simulation')
  const [useSimulationFallback, setUseSimulationFallback] = useState(!useRealData)
  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const [refreshMs, setRefreshMs] = useState(30000)
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark')

  const runSimulationTick = useCallback(() => {
    setPlayers((prev) => {
      const selectedIndex = Math.floor(Math.random() * prev.length)
      const selectedPlayer = prev[selectedIndex]
      const updatedPlayer = updatePlayerResult(selectedPlayer)
      setLastUpdate(`Live simulation: ${updatedPlayer.name} posted ${updatedPlayer.fortyYard?.toFixed(2)} in the 40`)

      return prev.map((player, index) => (index === selectedIndex ? updatedPlayer : player))
    })
  }, [])

  const fetchRealData = useCallback(async () => {
    if (!useRealData) {
      return false
    }

    try {
      const response = await fetch('/api/combine/normalized')

      if (!response.ok) {
        throw new Error(`Backend error ${response.status}`)
      }

      const payload = (await response.json()) as NormalizedApiResponse
      const incomingPlayers = Array.isArray(payload.players) ? payload.players : []

      if (incomingPlayers.length === 0) {
        setUseSimulationFallback(true)
        setDataSource('simulation')
        setLastUpdate('Sportradar connected but no combine drill rows were returned yet; simulation is active.')
        return false
      }

      setPlayers((current) => mergeIncomingPlayers(current, incomingPlayers))
      setUseSimulationFallback(false)
      setDataSource('sportradar')

      const timestamp = payload.fetchedAt ? new Date(payload.fetchedAt).toLocaleTimeString() : new Date().toLocaleTimeString()
      setLastUpdate(`Live API update: ${incomingPlayers.length} players refreshed at ${timestamp}`)
      return true
    } catch {
      setUseSimulationFallback(true)
      setDataSource('simulation')
      setLastUpdate('Sportradar is unavailable right now, using simulation fallback so your board stays live.')
      return false
    }
  }, [useRealData])

  const handleManualRefresh = useCallback(async () => {
    if (useRealData) {
      const ok = await fetchRealData()
      if (!ok) {
        runSimulationTick()
      }
      return
    }

    runSimulationTick()
  }, [fetchRealData, runSimulationTick, useRealData])

  const toggleAlerts = useCallback(() => {
    setAlertsEnabled((current) => {
      const next = !current
      if (next) {
        setBannerDismissed(false)
      }
      return next
    })
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeMode((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  useEffect(() => {
    if (!useRealData) {
      return
    }

    void fetchRealData()
    const interval = setInterval(() => {
      void fetchRealData()
    }, refreshMs)

    return () => {
      clearInterval(interval)
    }
  }, [fetchRealData, refreshMs, useRealData])

  useEffect(() => {
    if (!useSimulationFallback) {
      return
    }

    const interval = setInterval(runSimulationTick, 3000)

    return () => clearInterval(interval)
  }, [runSimulationTick, useSimulationFallback])

  useEffect(() => {
    document.body.setAttribute('data-theme', themeMode)
  }, [themeMode])

  const fastestByDay = useMemo(() => {
    const days: CombineDay[] = ['Day 1', 'Day 2', 'Day 3', 'Day 4']

    return days.map((day) => {
      const dayPlayers = players.filter((player) => player.day === day && player.fortyYard !== null)
      if (dayPlayers.length === 0) {
        return { day, player: null as Player | null }
      }

      const fastest = [...dayPlayers].sort((a, b) => (a.fortyYard as number) - (b.fortyYard as number))[0]
      return { day, player: fastest }
    })
  }, [players])

  const scoredBoard = useMemo<ScoredPlayer[]>(() => {
    const valid = players.filter((player) => player.fortyYard !== null && player.vertical !== null && player.broadJump !== null)

    return valid
      .map((player) => {
        const speedScore = (5 - (player.fortyYard as number)) * 50
        const explosionScore = (player.vertical as number) * 1.8 + (player.broadJump as number) * 0.8
        const totalScore = Number((speedScore + explosionScore).toFixed(1))

        return {
          ...player,
          totalScore,
          roundProjection: getRoundProjection(totalScore),
        }
      })
      .sort((a, b) => b.totalScore - a.totalScore)
  }, [players])

  const draftProjection = useMemo(() => {
    return scoredBoard
      .slice(0, 8)
  }, [scoredBoard])

  const fortyLeaderboard = useMemo(() => {
    return players
      .filter((player) => player.fortyYard !== null)
      .sort((a, b) => (a.fortyYard as number) - (b.fortyYard as number))
      .slice(0, 10)
  }, [players])

  const positionLeaders = useMemo(() => {
    const leaders = new Map<string, ScoredPlayer>()

    for (const player of scoredBoard) {
      const existing = leaders.get(player.position)
      if (!existing || player.totalScore > existing.totalScore) {
        leaders.set(player.position, player)
      }
    }

    return [...leaders.entries()]
      .sort((a, b) => b[1].totalScore - a[1].totalScore)
      .slice(0, 6)
  }, [scoredBoard])

  const stockWatch = useMemo(() => {
    return [...scoredBoard]
      .sort((a, b) => {
        if (b.updates !== a.updates) {
          return b.updates - a.updates
        }
        return b.totalScore - a.totalScore
      })
      .slice(0, 5)
  }, [scoredBoard])

  const analyticsBoard = useMemo<AnalyticsPlayer[]>(() => {
    const withMetrics = players.map((player) => {
      const accelerationScore = computeAccelerationScore(player)
      const explosivenessIndex = computeExplosivenessIndex(player)
      const agilityComposite = computeAgilityComposite(player)
      const powerRating = computePowerRating(player)
      const throwVelocityScore = player.throwVelocity

      const athleticScore = computeAthleticScore({
        accelerationScore,
        explosivenessIndex,
        agilityComposite,
        powerRating,
        throwVelocityScore,
      })

      return {
        ...player,
        accelerationScore,
        explosivenessIndex,
        agilityComposite,
        powerRating,
        throwVelocityScore,
        athleticScore,
        positionAdjustedPercentile: null,
      }
    })

    const byPosition = new Map<string, AnalyticsPlayer[]>()
    for (const player of withMetrics) {
      const bucket = byPosition.get(player.position) ?? []
      bucket.push(player)
      byPosition.set(player.position, bucket)
    }

    const percentileMap = new Map<string | number, number>()
    for (const group of byPosition.values()) {
      const sorted = [...group].sort((a, b) => b.athleticScore - a.athleticScore)
      const denominator = Math.max(sorted.length - 1, 1)

      sorted.forEach((player, index) => {
        const percentile = sorted.length === 1 ? 100 : Number((((denominator - index) / denominator) * 100).toFixed(1))
        percentileMap.set(player.id, percentile)
      })
    }

    return withMetrics
      .map((player) => ({
        ...player,
        positionAdjustedPercentile: percentileMap.get(player.id) ?? null,
      }))
      .sort((a, b) => (b.positionAdjustedPercentile ?? 0) - (a.positionAdjustedPercentile ?? 0))
  }, [players])

  const teamFitsByPlayerId = useMemo(() => {
    const fitMap = new Map<string | number, TeamFitMatch[]>()

    for (const player of players) {
      fitMap.set(
        player.id,
        matchProspectToTeams({
          id: player.id,
          name: player.name,
          position: player.position,
          weight: player.weightLbs,
          forty_time: player.fortyYard,
          ten_yard_split: player.tenYardSplit,
          arm_length: player.armLength,
        }),
      )
    }

    return fitMap
  }, [players])

  const projectionByPlayerId = useMemo(() => {
    return new Map(scoredBoard.map((player) => [player.id, player.roundProjection]))
  }, [scoredBoard])

  const topProjectedPick = draftProjection[0] ?? null
  const topFortyTime = fortyLeaderboard[0] ?? null
  const playersWithForty = players.filter((player) => player.fortyYard !== null).length
  const combineProgress = Math.round((playersWithForty / Math.max(players.length, 1)) * 100)
  const pulseStatus = combineProgress >= 70 ? 'high_signal' : combineProgress >= 35 ? 'building' : 'early'
  const alertMessage = useSimulationFallback
    ? 'Using simulation fallback while waiting for full official drill results.'
    : 'Live combine feed connected and updating.'

  const formatMetric = (value: number | null, decimals = 2, suffix = '') => {
    if (value === null) {
      return '--'
    }
    return `${value.toFixed(decimals)}${suffix}`
  }

  const getPercentileBand = (percentile: number | null) => {
    if (percentile === null) {
      return 'unknown'
    }
    if (percentile >= 85) {
      return 'elite'
    }
    if (percentile >= 65) {
      return 'high'
    }
    if (percentile >= 40) {
      return 'mid'
    }
    return 'low'
  }

  return (
    <main className="container">
      <header className="app-topbar">
        <div className="app-title-wrap">
          <span className="app-logo" aria-hidden="true">🏈</span>
          <div>
            <h1>Draft Day Live</h1>
            <small>Combine Command Center</small>
          </div>
        </div>
        <div className="app-actions">
          <button className="icon-btn" type="button" onClick={() => void handleManualRefresh()} aria-label="Refresh data">⟳</button>
          <button className="icon-btn" type="button" onClick={toggleAlerts} aria-label="Toggle alerts">{alertsEnabled ? '🔔' : '🔕'}</button>
          <button className="icon-btn" type="button" onClick={() => setViewMode('settings')} aria-label="Open settings">⚙</button>
        </div>
      </header>

      <section className="chip-row" aria-label="Quick views">
        <button className={`view-chip ${viewMode === 'overview' ? 'active' : ''}`} type="button" onClick={() => setViewMode('overview')}>Overview</button>
        <button className={`view-chip ${viewMode === 'speed' ? 'active' : ''}`} type="button" onClick={() => setViewMode('speed')}>40Y Live</button>
        <button className={`view-chip ${viewMode === 'board' ? 'active' : ''}`} type="button" onClick={() => setViewMode('board')}>Draft Board</button>
        <button className={`view-chip ${viewMode === 'risers' ? 'active' : ''}`} type="button" onClick={() => setViewMode('risers')}>Risers</button>
        <button className={`view-chip ${viewMode === 'analytics' ? 'active' : ''}`} type="button" onClick={() => setViewMode('analytics')}>Analytics</button>
        <button className={`view-chip ${viewMode === 'settings' ? 'active' : ''}`} type="button" onClick={() => setViewMode('settings')}>Settings</button>
      </section>

      {alertsEnabled && !bannerDismissed && (
      <section className="alert-strip">
        <span aria-hidden="true">⚠</span>
        <p><strong>Combine Watch:</strong> {alertMessage}</p>
        <button className="close-btn" type="button" onClick={() => setBannerDismissed(true)} aria-label="Dismiss alert">✕</button>
      </section>
      )}

      <section className="hero-card">
        <div className="hero-header">
          <h2>Current Draft Pulse</h2>
          <p><span className="live-dot" /> Live</p>
        </div>
        <p className="hero-subtitle">Tracking incoming official metrics and projection movement in real time.</p>

        <div className="pulse-ring" role="img" aria-label="Combine progress">
          <div>
            <strong>{combineProgress}%</strong>
            <p>{pulseStatus}</p>
          </div>
        </div>

        <div className="stats-grid">
          <article className="stat-chip">
            <span aria-hidden="true">⚡</span>
            <div>
              <small>FASTEST 40</small>
              <strong>{topFortyTime ? `${topFortyTime.fortyYard?.toFixed(2)}s` : '--'}</strong>
            </div>
          </article>
          <article className="stat-chip">
            <span aria-hidden="true">🎯</span>
            <div>
              <small>TOP PROSPECT</small>
              <strong>{topProjectedPick ? topProjectedPick.name : 'TBD'}</strong>
            </div>
          </article>
          <article className="stat-chip">
            <span aria-hidden="true">📊</span>
            <div>
              <small>PLAYERS TRACKED</small>
              <strong>{players.length}</strong>
            </div>
          </article>
          <article className="stat-chip">
            <span aria-hidden="true">🛰️</span>
            <div>
              <small>DATA SOURCE</small>
              <strong>{dataSource === 'sportradar' ? 'Sportradar' : 'Fallback'}</strong>
            </div>
          </article>
        </div>
      </section>

      <section className="card live-update">
        <h2>Live Update Feed</h2>
        <p>{lastUpdate}</p>
      </section>

      {viewMode === 'overview' && (
      <section className="grid">
        <article className="card">
          <h2>Fastest By Day</h2>
          <ul>
            {fastestByDay.map(({ day, player }) => (
              <li key={day}>
                <strong>{day}:</strong>{' '}
                {player ? `${player.name} (${player.position}) - ${player.fortyYard?.toFixed(2)}s` : 'No times yet'}
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h2>Likely Highest Draft Picks</h2>
          <ol>
            {draftProjection.map((player) => (
              <li key={player.id}>
                <strong>{player.name}</strong> ({player.position}, {player.college}) - Score {player.totalScore}
              </li>
            ))}
          </ol>
        </article>
      </section>
      )}

      {viewMode === 'speed' && (
      <section className="grid">
        <article className="card">
          <h2>40-Yard Dash Leaderboard</h2>
          <ol className="rank-list">
            {fortyLeaderboard.map((player) => (
              <li key={player.id}>
                <strong>{player.name}</strong> ({player.position}) - {player.fortyYard?.toFixed(2)}s
              </li>
            ))}
          </ol>
        </article>
        <article className="card">
          <h2>Fastest By Day</h2>
          <ul>
            {fastestByDay.map(({ day, player }) => (
              <li key={day}>
                <strong>{day}:</strong>{' '}
                {player ? `${player.name} (${player.position}) - ${player.fortyYard?.toFixed(2)}s` : 'No times yet'}
              </li>
            ))}
          </ul>
        </article>
      </section>
      )}

      {viewMode === 'board' && (
      <>
      <section className="grid">
        <article className="card">
          <h2>Position Leaders</h2>
          <ul className="rank-list">
            {positionLeaders.map(([position, player]) => (
              <li key={position}>
                <strong>{position}</strong>: {player.name} - Score {player.totalScore}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="card">
        <h2>Current Combine Board</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th>Pos</th>
                <th>Day</th>
                <th>40Y</th>
                <th>Vertical</th>
                <th>Broad</th>
                <th>Projection</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id}>
                  <td>{player.name}</td>
                  <td>{player.position}</td>
                  <td>{player.day}</td>
                  <td>{player.fortyYard !== null ? `${player.fortyYard.toFixed(2)}s` : '-'}</td>
                  <td>{player.vertical !== null ? `${player.vertical} in` : '-'}</td>
                  <td>{player.broadJump !== null ? `${player.broadJump} in` : '-'}</td>
                  <td>{projectionByPlayerId.get(player.id) ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      </>
      )}

      {viewMode === 'risers' && (
      <section className="grid">
        <article className="card">
          <h2>Draft Stock Watch</h2>
          <ul className="rank-list">
            {stockWatch.map((player) => (
              <li key={player.id}>
                <strong>{player.name}</strong> ({player.position}) - {player.updates} recent jumps
              </li>
            ))}
          </ul>
        </article>
        <article className="card">
          <h2>Likely Highest Draft Picks</h2>
          <ol>
            {draftProjection.map((player) => (
              <li key={player.id}>
                <strong>{player.name}</strong> ({player.position}, {player.college}) - Score {player.totalScore}
              </li>
            ))}
          </ol>
        </article>
      </section>
      )}

      {viewMode === 'analytics' && (
      <section className="card">
        <h2>Advanced Combine Analytics</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th>Pos</th>
                <th>Acceleration</th>
                <th>Explosive</th>
                <th>Agility</th>
                <th>Power</th>
                <th>Throw Vel</th>
                <th>Pos %ile</th>
                <th>Top Team Fits</th>
              </tr>
            </thead>
            <tbody>
              {analyticsBoard.map((player) => (
                <tr key={player.id} className={`analytics-row analytics-row--${getPercentileBand(player.positionAdjustedPercentile)}`}>
                  <td>{player.name}</td>
                  <td>{player.position}</td>
                  <td>{formatMetric(player.accelerationScore, 3)}</td>
                  <td>{formatMetric(player.explosivenessIndex, 1)}</td>
                  <td>{formatMetric(player.agilityComposite, 2)}</td>
                  <td>{formatMetric(player.powerRating, 1)}</td>
                  <td>{formatMetric(player.throwVelocityScore, 0, ' mph')}</td>
                  <td>
                    <span className={`metric-pill metric-pill--${getPercentileBand(player.positionAdjustedPercentile)}`}>
                      {formatMetric(player.positionAdjustedPercentile, 1, '%')}
                    </span>
                  </td>
                  <td>
                    <ul className="fit-list">
                      {(teamFitsByPlayerId.get(player.id) ?? []).map((fit) => (
                        <li key={`${player.id}-${fit.team}`}>
                          <strong>{fit.team}</strong> — {fit.matchPercentage.toFixed(1)}% · {fit.reason}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {viewMode === 'settings' && (
      <section className="card settings-card">
        <h2>Settings</h2>
        <div className="setting-row">
          <label htmlFor="refresh-select">Refresh interval</label>
          <select id="refresh-select" value={refreshMs} onChange={(event) => setRefreshMs(Number(event.target.value))}>
            <option value={15000}>15 seconds</option>
            <option value={30000}>30 seconds</option>
            <option value={60000}>60 seconds</option>
          </select>
        </div>
        <div className="setting-row">
          <span>Alerts</span>
          <button type="button" onClick={toggleAlerts}>{alertsEnabled ? 'On' : 'Off'}</button>
        </div>
        <div className="setting-row">
          <span>Theme</span>
          <button type="button" onClick={toggleTheme}>{themeMode === 'dark' ? 'Dark' : 'Light'}</button>
        </div>
        <div className="setting-row">
          <span>Data source</span>
          <strong>{dataSource === 'sportradar' ? 'Sportradar API' : 'Simulation fallback'}</strong>
        </div>
        <button className="refresh-btn" type="button" onClick={() => void handleManualRefresh()}>Refresh now</button>
      </section>
      )}

      <nav className="bottom-nav" aria-label="Primary">
        <button className={`nav-item ${viewMode === 'overview' ? 'active' : ''}`} type="button" onClick={() => setViewMode('overview')}><span>🏠</span><small>Home</small></button>
        <button className={`nav-item ${viewMode === 'board' ? 'active' : ''}`} type="button" onClick={() => setViewMode('board')}><span>🧾</span><small>Board</small></button>
        <button className={`nav-item ${viewMode === 'speed' ? 'active' : ''}`} type="button" onClick={() => setViewMode('speed')}><span>⚡</span><small>Speed</small></button>
        <button className={`nav-item ${viewMode === 'risers' ? 'active' : ''}`} type="button" onClick={() => setViewMode('risers')}><span>📈</span><small>Risers</small></button>
        <button className={`nav-item ${viewMode === 'analytics' ? 'active' : ''}`} type="button" onClick={() => setViewMode('analytics')}><span>🧠</span><small>Metrics</small></button>
        <button className={`nav-item ${viewMode === 'settings' ? 'active' : ''}`} type="button" onClick={() => setViewMode('settings')}><span>⚙</span><small>Prefs</small></button>
      </nav>
    </main>
  )
}

export default App
