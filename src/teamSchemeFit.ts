export type ProspectCombineData = {
  id?: string | number
  name?: string
  position?: string | null
  weight?: number | null
  weight_lbs?: number | null
  forty_time?: number | null
  fortyYard?: number | null
  ten_yard_split?: number | null
  tenYardSplit?: number | null
  arm_length?: number | null
  armLength?: number | null
}

type Rule = {
  metric: 'ten_yard_split' | 'forty_time' | 'weight' | 'arm_length'
  operator: 'lte' | 'gte'
  value: number
  label: string
}

type TeamPrototype = {
  team: string
  style: string
  position: 'OL' | 'CB'
  rules: Rule[]
}

export type TeamFitMatch = {
  team: string
  matchPercentage: number
  reason: string
}

const TEAM_PROTOTYPES: TeamPrototype[] = [
  {
    team: 'San Francisco 49ers',
    style: 'Outside zone OL profile',
    position: 'OL',
    rules: [
      { metric: 'ten_yard_split', operator: 'lte', value: 1.75, label: '10-yard split under 1.75s' },
    ],
  },
  {
    team: 'Miami Dolphins',
    style: 'Outside zone OL profile',
    position: 'OL',
    rules: [
      { metric: 'ten_yard_split', operator: 'lte', value: 1.75, label: '10-yard split under 1.75s' },
    ],
  },
  {
    team: 'Green Bay Packers',
    style: 'RAS/athletic CB profile',
    position: 'CB',
    rules: [
      { metric: 'forty_time', operator: 'lte', value: 4.4, label: 'sub-4.40 speed' },
      { metric: 'weight', operator: 'gte', value: 190, label: 'weight over 190 lbs' },
    ],
  },
  {
    team: 'Indianapolis Colts',
    style: 'RAS/athletic CB profile',
    position: 'CB',
    rules: [
      { metric: 'forty_time', operator: 'lte', value: 4.4, label: 'sub-4.40 speed' },
      { metric: 'weight', operator: 'gte', value: 190, label: 'weight over 190 lbs' },
    ],
  },
  {
    team: 'Kansas City Chiefs',
    style: 'Press-man CB profile',
    position: 'CB',
    rules: [
      { metric: 'arm_length', operator: 'gte', value: 32, label: 'arm length over 32 inches' },
    ],
  },
  {
    team: 'New York Jets',
    style: 'Press-man CB profile',
    position: 'CB',
    rules: [
      { metric: 'arm_length', operator: 'gte', value: 32, label: 'arm length over 32 inches' },
    ],
  },
]

const normalizeMetric = (prospect: ProspectCombineData, metric: Rule['metric']) => {
  if (metric === 'forty_time') {
    return prospect.forty_time ?? prospect.fortyYard ?? null
  }
  if (metric === 'ten_yard_split') {
    return prospect.ten_yard_split ?? prospect.tenYardSplit ?? null
  }
  if (metric === 'weight') {
    return prospect.weight ?? prospect.weight_lbs ?? null
  }
  if (metric === 'arm_length') {
    return prospect.arm_length ?? prospect.armLength ?? null
  }
  return null
}

const isOffensiveLine = (position: string) => ['C', 'G', 'OT', 'OG', 'OL', 'T'].includes(position)
const isCorner = (position: string) => position === 'CB'

const positionMatchScore = (prospectPosition: string, targetPosition: TeamPrototype['position']) => {
  if (targetPosition === 'OL' && isOffensiveLine(prospectPosition)) {
    return 1
  }
  if (targetPosition === 'CB' && isCorner(prospectPosition)) {
    return 1
  }
  return 0.05
}

const ruleScore = (metricValue: number | null, rule: Rule) => {
  if (metricValue === null) {
    return { score: 0, met: false, missing: true }
  }

  if (rule.operator === 'lte') {
    if (metricValue <= rule.value) {
      return { score: 1, met: true, missing: false }
    }
    const overshoot = metricValue - rule.value
    return { score: Math.max(0, 1 - overshoot * 3.2), met: false, missing: false }
  }

  if (metricValue >= rule.value) {
    return { score: 1, met: true, missing: false }
  }
  const shortfall = rule.value - metricValue
  return { score: Math.max(0, 1 - shortfall * 0.08), met: false, missing: false }
}

export const matchProspectToTeams = (prospect: ProspectCombineData): TeamFitMatch[] => {
  const normalizedPosition = (prospect.position ?? '').toUpperCase().trim()

  const matches = TEAM_PROTOTYPES.map((prototype) => {
    const posScore = positionMatchScore(normalizedPosition, prototype.position)
    const evaluatedRules = prototype.rules.map((rule) => {
      const value = normalizeMetric(prospect, rule.metric)
      return {
        ...rule,
        ...ruleScore(value, rule),
      }
    })

    const avgRuleScore =
      evaluatedRules.length === 0
        ? 0
        : evaluatedRules.reduce((acc, item) => acc + item.score, 0) / evaluatedRules.length

    const weighted = (posScore * 0.45 + avgRuleScore * 0.55) * 100
    const matchPercentage = Math.max(0, Math.min(100, Number(weighted.toFixed(1))))

    const metRules = evaluatedRules.filter((rule) => rule.met).map((rule) => rule.label)
    const missingRules = evaluatedRules.filter((rule) => rule.missing).map((rule) => rule.label)

    let reason = `${prototype.style}: `
    if (metRules.length > 0) {
      reason += `hits ${metRules.join(', ')}`
    } else {
      reason += `does not currently hit key thresholds`
    }

    if (missingRules.length > 0) {
      reason += `. Missing data: ${missingRules.join(', ')}`
    }

    return {
      team: prototype.team,
      matchPercentage,
      reason,
    }
  })

  return matches
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 3)
}
