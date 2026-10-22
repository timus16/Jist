import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { FieldMap } from '../FieldMap'
import {
  DEFAULT_BOUNDARY_RADIUS_M,
  WEDGE_RADIUS,
  clampToRadius,
  makeBoundaryPolygon,
  metersToSvg,
  resolvePick,
  scaleFor,
  sectorPath,
  svgToMeters,
} from '../geometry'

const R = 68
const SCALE = scaleFor(R)
const VIEW = 220

function mockRect(el: Element, size = VIEW) {
  const rect = {
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: size,
    bottom: size,
    width: size,
    height: size,
    toJSON: () => ({}),
  }
  el.getBoundingClientRect = () => rect as DOMRect
}

describe('geometry', () => {
  it('round-trips metres through svg space', () => {
    const p = { x: 30, y: -12 }
    const svg = metersToSvg(p, SCALE)
    const back = svgToMeters(svg.x, svg.y, SCALE)
    expect(back.x).toBeCloseTo(p.x, 6)
    expect(back.y).toBeCloseTo(p.y, 6)
  })

  it('defaults to the fallback radius when no ground is given', () => {
    expect(resolvePick(110, 110, SCALE, DEFAULT_BOUNDARY_RADIUS_M).zoneId).toBe(0)
  })

  it('clamps points outside the boundary back to the rope', () => {
    const clamped = clampToRadius({ x: 1000, y: 0 }, R)
    expect(Math.hypot(clamped.x, clamped.y)).toBeCloseTo(R, 6)
  })

  it('builds a 32-point circular boundary polygon', () => {
    const poly = makeBoundaryPolygon(R, 32)
    expect(poly).toHaveLength(32)
    for (const p of poly) expect(Math.hypot(p.x, p.y)).toBeCloseTo(R, 6)
  })

  it('draws a closed sector wedge path', () => {
    expect(sectorPath(WEDGE_RADIUS, 0, 22.5)).toMatch(/^M .* Z$/)
  })
})

describe('resolvePick (snap-to-zone)', () => {
  it('straight up -> zone 0', () => {
    expect(resolvePick(110, 20, SCALE, R).zoneId).toBe(0)
  })

  it('square to the right -> zone 4', () => {
    expect(resolvePick(200, 110, SCALE, R).zoneId).toBe(4)
  })

  it('straight behind the wicket -> zone 8', () => {
    expect(resolvePick(110, 200, SCALE, R).zoneId).toBe(8)
  })

  it('square to the left -> zone 12', () => {
    expect(resolvePick(20, 110, SCALE, R).zoneId).toBe(12)
  })

  it('always returns a valid zone id even at the centre', () => {
    const { zoneId } = resolvePick(110, 110, SCALE, R)
    expect(zoneId).toBeGreaterThanOrEqual(0)
    expect(zoneId).toBeLessThan(16)
  })
})

describe('FieldMap', () => {
  it('renders fielder role labels', () => {
    const { getByText, container } = render(
      <FieldMap fielders={[{ playerId: 'p1', role: 'Cover', x: 20, y: 10 }]} />,
    )
    expect(container.querySelector('svg')).toBeTruthy()
    expect(getByText('Cover')).toBeTruthy()
  })

  it('reports a snapped zone on an interactive tap', () => {
    const onPick = vi.fn()
    const { container } = render(<FieldMap interactive onPick={onPick} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    if (svg) mockRect(svg)
    fireEvent.pointerDown(svg as SVGSVGElement, { clientX: 200, clientY: 110 })
    expect(onPick).toHaveBeenCalledTimes(1)
    const arg = onPick.mock.calls[0][0] as { zoneId: number; landingPoint: { x: number; y: number } }
    expect(arg.zoneId).toBe(4)
    expect(Math.hypot(arg.landingPoint.x, arg.landingPoint.y)).toBeLessThanOrEqual(R + 0.001)
  })

  it('ignores taps when not interactive', () => {
    const onPick = vi.fn()
    const { container } = render(<FieldMap onPick={onPick} />)
    const svg = container.querySelector('svg')
    if (svg) mockRect(svg)
    fireEvent.pointerDown(svg as SVGSVGElement, { clientX: 200, clientY: 110 })
    expect(onPick).not.toHaveBeenCalled()
  })
})
