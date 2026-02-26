import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const app = express()
const port = Number(process.env.PORT ?? 8787)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = path.resolve(__dirname, '../dist')
const hasDistBuild = fs.existsSync(distPath)

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : null

let lastGoodNormalizedPayload = null

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

app.use(
  cors(
    allowedOrigins
      ? {
          origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
              callback(null, true)
              return
            }

            callback(new Error('CORS origin not allowed'))
          },
        }
      : undefined,
  ),
)
app.use(express.json())

const getByPath = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return current[key]
    }
    return undefined
  }, obj)
}

const pickFirst = (obj, paths) => {
  for (const path of paths) {
    const value = getByPath(obj, path)
    if (value !== undefined && value !== null && value !== '') {
      return value
    }
  }
  return null
}

const toNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const normalizeDay = (rawDay, index) => {
  if (typeof rawDay === 'string' && rawDay.trim().length > 0) {
    if (/^day\s*[1-4]$/i.test(rawDay.trim())) {
      const dayNumber = rawDay.replace(/\D/g, '')
      return `Day ${dayNumber}`
    }
    return `Day ${((index % 4) + 1)}`
  }
  if (typeof rawDay === 'number' && rawDay >= 1 && rawDay <= 4) {
    return `Day ${rawDay}`
  }
  return `Day ${((index % 4) + 1)}`
}

const normalizePlayer = (rawPlayer, index) => {
  const firstName = pickFirst(rawPlayer, ['first_name', 'firstName'])
  const lastName = pickFirst(rawPlayer, ['last_name', 'lastName'])
  const combinedName = `${firstName ?? ''} ${lastName ?? ''}`.trim()

  const name =
    pickFirst(rawPlayer, ['full_name', 'name', 'player_name', 'prospect_name']) ??
    (combinedName.length > 0 ? combinedName : `Prospect ${index + 1}`)

  const fortyYard = toNumber(
    pickFirst(rawPlayer, [
      'forty_yard',
      'forty',
      'forty_time',
      'combine.forty_yard',
      'combine.forty_time',
      'drills.forty_yard',
      'drills.forty_time',
      'metrics.forty_yard',
      'metrics.forty_time',
    ]),
  )

  const vertical = toNumber(
    pickFirst(rawPlayer, [
      'vertical',
      'vertical_jump',
      'combine.vertical',
      'combine.vertical_jump',
      'drills.vertical',
      'drills.vertical_jump',
      'metrics.vertical',
      'metrics.vertical_jump',
    ]),
  )

  const broadJump = toNumber(
    pickFirst(rawPlayer, [
      'broad_jump',
      'broad',
      'combine.broad_jump',
      'drills.broad_jump',
      'metrics.broad_jump',
    ]),
  )

  const tenYardSplit = toNumber(
    pickFirst(rawPlayer, [
      'ten_yard_split',
      'ten_split',
      'split_10_yard',
      'combine.ten_yard_split',
      'drills.ten_yard_split',
      'metrics.ten_yard_split',
    ]),
  )

  const shuttle = toNumber(
    pickFirst(rawPlayer, [
      'shuttle',
      'shuttle_time',
      'short_shuttle',
      'combine.shuttle',
      'combine.short_shuttle',
      'drills.shuttle',
      'metrics.shuttle',
    ]),
  )

  const threeCone = toNumber(
    pickFirst(rawPlayer, [
      'three_cone',
      'three_cone_drill',
      'combine.three_cone',
      'drills.three_cone',
      'metrics.three_cone',
    ]),
  )

  const benchReps = toNumber(
    pickFirst(rawPlayer, [
      'bench',
      'bench_reps',
      'combine.bench_reps',
      'drills.bench_reps',
      'metrics.bench_reps',
    ]),
  )

  const weightLbs = toNumber(
    pickFirst(rawPlayer, [
      'weight',
      'weight_lbs',
      'weight_lb',
      'profile.weight',
      'combine.weight',
      'metrics.weight',
    ]),
  )

  const throwVelocity = toNumber(
    pickFirst(rawPlayer, [
      'throw_velocity',
      'throwing_velocity',
      'combine.throw_velocity',
      'drills.throw_velocity',
      'metrics.throw_velocity',
    ]),
  )

  const armLength = toNumber(
    pickFirst(rawPlayer, [
      'arm_length',
      'arm',
      'arms',
      'measurements.arm_length',
      'combine.arm_length',
      'metrics.arm_length',
    ]),
  )

  return {
    id: pickFirst(rawPlayer, ['id', 'player_id', 'prospect_id', 'sr_id']) ?? `prospect-${index + 1}`,
    name,
    position: pickFirst(rawPlayer, ['position', 'position_abbreviation', 'pos']) ?? 'N/A',
    college: pickFirst(rawPlayer, ['college', 'school', 'college_name']) ?? 'N/A',
    day: normalizeDay(pickFirst(rawPlayer, ['day', 'combine_day', 'combine.day']), index),
    fortyYard,
    tenYardSplit,
    vertical,
    broadJump,
    shuttle,
    threeCone,
    benchReps,
    weightLbs,
    throwVelocity,
    armLength,
    updates: 1,
  }
}

const findPlayerArray = (payload) => {
  if (Array.isArray(payload)) {
    return payload
  }

  const directPaths = [
    'players',
    'prospects',
    'results',
    'athletes',
    'data.players',
    'data.prospects',
    'data.results',
    'draft.prospects',
  ]

  for (const path of directPaths) {
    const candidate = getByPath(payload, path)
    if (Array.isArray(candidate)) {
      return candidate
    }
  }

  const stack = [payload]
  while (stack.length > 0) {
    const current = stack.pop()
    if (!current || typeof current !== 'object') {
      continue
    }

    for (const value of Object.values(current)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        return value
      }
      if (value && typeof value === 'object') {
        stack.push(value)
      }
    }
  }

  return []
}

const buildSportradarUrl = () => {
  const baseUrl = process.env.SPORTRADAR_COMBINE_URL
  const apiKey = process.env.SPORTRADAR_API_KEY

  if (!baseUrl || !apiKey) {
    return null
  }

  const url = new URL(baseUrl)
  url.searchParams.set('api_key', apiKey)
  return url.toString()
}

const fetchSportradarPayload = async () => {
  const url = buildSportradarUrl()
  if (!url) {
    throw new Error('Missing SPORTRADAR_COMBINE_URL or SPORTRADAR_API_KEY')
  }

  let lastError = null

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 20000)

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'draft-day-app/1.0',
        },
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`Sportradar request failed (${response.status}): ${body.slice(0, 240)}`)
      }

      return response.json()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown Sportradar request failure')

      if (attempt < 3) {
        await sleep(600 * attempt)
      }
    }
  }

  throw lastError ?? new Error('Sportradar request failed after retries')
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    sportradarConfigured: Boolean(process.env.SPORTRADAR_API_KEY && process.env.SPORTRADAR_COMBINE_URL),
  })
})

app.get('/api/combine/raw', async (_req, res) => {
  try {
    const payload = await fetchSportradarPayload()
    res.json(payload)
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch raw combine data',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.get('/api/combine/normalized', async (_req, res) => {
  try {
    const payload = await fetchSportradarPayload()
    const rawPlayers = findPlayerArray(payload)
    const players = rawPlayers.map(normalizePlayer)

    const normalizedPayload = {
      source: 'sportradar',
      fetchedAt: new Date().toISOString(),
      players,
      rawCount: rawPlayers.length,
      stale: false,
    }

    lastGoodNormalizedPayload = normalizedPayload

    res.json(normalizedPayload)
  } catch (error) {
    if (lastGoodNormalizedPayload) {
      res.json({
        ...lastGoodNormalizedPayload,
        stale: true,
        warning: 'Using last successful combine snapshot due to temporary upstream issue',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
      return
    }

    res.json({
      source: 'fallback-empty',
      fetchedAt: new Date().toISOString(),
      players: [],
      rawCount: 0,
      stale: true,
      warning: 'Combine feed temporarily unavailable; returning empty snapshot',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

if (hasDistBuild) {
  app.use(express.static(distPath))

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next()
      return
    }

    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(port, () => {
  console.log(`Draft Day server listening on http://localhost:${port}`)
})
