/* Pure TypeScript inverse map projections: map X/Y to longitude/latitude with no ArcGIS projection
   engine. The engine is a WebAssembly module that cannot always load (the Experience Builder
   Developer Edition client is one such place), and without it a map in State Plane or another
   projected coordinate system could only show raw X/Y. Formulas follow EPSG Guidance Note 7-2
   (Lambert Conformal Conic, Transverse Mercator by the Krueger series, Albers Equal Area).
   No datum shift is applied: the table only holds systems on GRS 1980 or WGS 1984, which agree
   with WGS 1984 to about two metres. */
import { PROJ_PARAMS, PROJ_WKIDS } from './projTable'

const UNIT_TO_METRE = [1, 1200 / 3937, 0.3048]
const RAD = Math.PI / 180

let index: Map<number, [number, number]> | null = null

function getIndex (): Map<number, [number, number]> {
  if (!index) {
    index = new Map()
    const rows = PROJ_WKIDS.split(' ')
    for (let i = 0; i < rows.length; i++) {
      const parts = rows[i].split(':')
      if (parts.length !== 3) continue
      index.set(parseInt(parts[0], 36), [parseInt(parts[1], 36), parseInt(parts[2], 10)])
    }
  }
  return index
}

function lookup (spatialReference: any): [number, number] | null {
  if (!spatialReference) return null
  const idx = getIndex()
  const ids = [spatialReference.wkid, spatialReference.latestWkid]
  for (let i = 0; i < ids.length; i++) {
    const id = Number(ids[i])
    if (id > 0 && idx.has(id)) return idx.get(id) as [number, number]
  }
  return null
}

/** True when projectedToLonLat can convert coordinates in this spatial reference. */
export function canProjectToLonLat (spatialReference: any): boolean {
  return lookup(spatialReference) !== null
}

function tsfn (phi: number, e: number): number {
  const es = e * Math.sin(phi)
  return Math.tan(Math.PI / 4 - phi / 2) / Math.pow((1 - es) / (1 + es), e / 2)
}

function msfn (phi: number, e: number): number {
  const s = Math.sin(phi)
  return Math.cos(phi) / Math.sqrt(1 - e * e * s * s)
}

function qsfn (phi: number, e: number): number {
  const s = Math.sin(phi)
  const es = e * s
  return (1 - e * e) * (s / (1 - es * es) - (1 / (2 * e)) * Math.log((1 - es) / (1 + es)))
}

function lccInverse (a: number, e: number, lat0: number, lon0: number, n: number, aF: number, r0: number, x: number, y: number): [number, number] {
  const dx = x
  const dy = r0 - y
  const sign = n < 0 ? -1 : 1
  const r = sign * Math.sqrt(dx * dx + dy * dy)
  const t = Math.pow(r / aF, 1 / n)
  const theta = Math.atan2(sign * dx, sign * dy)
  let phi = Math.PI / 2 - 2 * Math.atan(t)
  for (let i = 0; i < 12; i++) {
    const es = e * Math.sin(phi)
    const next = Math.PI / 2 - 2 * Math.atan(t * Math.pow((1 - es) / (1 + es), e / 2))
    const done = Math.abs(next - phi) < 1e-13
    phi = next
    if (done) break
  }
  return [lon0 + theta / n, phi]
}

function tmInverse (a: number, f: number, e: number, lat0: number, lon0: number, k0: number, x: number, y: number): [number, number] {
  const n = f / (2 - f)
  const n2 = n * n
  const n3 = n2 * n
  const n4 = n3 * n
  const B = (a / (1 + n)) * (1 + n2 / 4 + n4 / 64)

  // Meridional arc distance from the equator to the latitude of origin
  let M0 = 0
  if (lat0 !== 0) {
    const h1 = n / 2 - (2 / 3) * n2 + (5 / 16) * n3 + (41 / 180) * n4
    const h2 = (13 / 48) * n2 - (3 / 5) * n3 + (557 / 1440) * n4
    const h3 = (61 / 240) * n3 - (103 / 140) * n4
    const h4 = (49561 / 161280) * n4
    const Q0 = Math.asinh(Math.tan(lat0)) - e * Math.atanh(e * Math.sin(lat0))
    const xi0 = Math.atan(Math.sinh(Q0))
    M0 = B * (xi0 + h1 * Math.sin(2 * xi0) + h2 * Math.sin(4 * xi0) + h3 * Math.sin(6 * xi0) + h4 * Math.sin(8 * xi0))
  }

  const g1 = n / 2 - (2 / 3) * n2 + (37 / 96) * n3 - (1 / 360) * n4
  const g2 = (1 / 48) * n2 + (1 / 15) * n3 - (437 / 1440) * n4
  const g3 = (17 / 480) * n3 - (37 / 840) * n4
  const g4 = (4397 / 161280) * n4

  const eta = x / (B * k0)
  const xi = (y + k0 * M0) / (B * k0)
  const xi0p = xi - (g1 * Math.sin(2 * xi) * Math.cosh(2 * eta) + g2 * Math.sin(4 * xi) * Math.cosh(4 * eta) +
    g3 * Math.sin(6 * xi) * Math.cosh(6 * eta) + g4 * Math.sin(8 * xi) * Math.cosh(8 * eta))
  const eta0p = eta - (g1 * Math.cos(2 * xi) * Math.sinh(2 * eta) + g2 * Math.cos(4 * xi) * Math.sinh(4 * eta) +
    g3 * Math.cos(6 * xi) * Math.sinh(6 * eta) + g4 * Math.cos(8 * xi) * Math.sinh(8 * eta))

  const beta = Math.asin(Math.sin(xi0p) / Math.cosh(eta0p))
  const Qp = Math.asinh(Math.tan(beta))
  let Qpp = Qp + e * Math.atanh(e * Math.tanh(Qp))
  for (let i = 0; i < 12; i++) {
    const next = Qp + e * Math.atanh(e * Math.tanh(Qpp))
    const done = Math.abs(next - Qpp) < 1e-13
    Qpp = next
    if (done) break
  }
  return [lon0 + Math.asin(Math.tanh(eta0p) / Math.cos(beta)), Math.atan(Math.sinh(Qpp))]
}

function albersInverse (a: number, e: number, lat0: number, lon0: number, lat1: number, lat2: number, x: number, y: number): [number, number] {
  const m1 = msfn(lat1, e)
  const m2 = msfn(lat2, e)
  const q0 = qsfn(lat0, e)
  const q1 = qsfn(lat1, e)
  const q2 = qsfn(lat2, e)
  const n = Math.abs(lat1 - lat2) < 1e-12 ? Math.sin(lat1) : (m1 * m1 - m2 * m2) / (q2 - q1)
  const C = m1 * m1 + n * q1
  const rho0 = (a * Math.sqrt(C - n * q0)) / n
  const sign = n < 0 ? -1 : 1
  const dy = rho0 - y
  const rho = Math.sqrt(x * x + dy * dy)
  const theta = Math.atan2(sign * x, sign * dy)
  const q = (C - (rho * rho * n * n) / (a * a)) / n
  let phi = Math.asin(Math.max(-1, Math.min(1, q / 2)))
  for (let i = 0; i < 20; i++) {
    const s = Math.sin(phi)
    const es = e * s
    const d = ((1 - es * es) * (1 - es * es)) / (2 * Math.cos(phi)) *
      (q / (1 - e * e) - s / (1 - es * es) + (1 / (2 * e)) * Math.log((1 - es) / (1 + es)))
    phi += d
    if (Math.abs(d) < 1e-13) break
  }
  return [lon0 + theta / n, phi]
}

/**
 * Converts map X/Y in a projected spatial reference to [longitude, latitude] in degrees.
 * Returns null when the spatial reference is not in the table or the result is not a valid position.
 */
export function projectedToLonLat (spatialReference: any, x: number, y: number): [number, number] | null {
  const hit = lookup(spatialReference)
  if (!hit) return null
  const p = PROJ_PARAMS[hit[0]]
  const toMetre = UNIT_TO_METRE[hit[1]]
  if (!p || !toMetre || !isFinite(x) || !isFinite(y)) return null

  const method = p[0]
  const a = 6378137
  const f = 1 / (p[1] === 1 ? 298.257223563 : 298.257222101)
  const e = Math.sqrt(2 * f - f * f)
  const lat0 = p[2] * RAD
  const lon0 = p[3] * RAD
  const xm = x * toMetre - p[6]
  const ym = y * toMetre - p[7]

  let out: [number, number]
  if (method === 0) {
    const lat1 = p[4] * RAD
    const lat2 = p[5] * RAD
    const m1 = msfn(lat1, e)
    const t1 = tsfn(lat1, e)
    const n = Math.abs(lat1 - lat2) < 1e-12 ? Math.sin(lat1) : (Math.log(m1) - Math.log(msfn(lat2, e))) / (Math.log(t1) - Math.log(tsfn(lat2, e)))
    const F = m1 / (n * Math.pow(t1, n))
    const r0 = a * F * Math.pow(tsfn(lat0, e), n)
    out = lccInverse(a, e, lat0, lon0, n, a * F, r0, xm, ym)
  } else if (method === 1) {
    const n = Math.sin(lat0)
    const t0 = tsfn(lat0, e)
    const F = msfn(lat0, e) / (n * Math.pow(t0, n))
    const aF = a * F * p[4]
    out = lccInverse(a, e, lat0, lon0, n, aF, aF * Math.pow(t0, n), xm, ym)
  } else if (method === 2) {
    out = tmInverse(a, f, e, lat0, lon0, p[4], xm, ym)
  } else if (method === 3) {
    out = albersInverse(a, e, lat0, lon0, p[4] * RAD, p[5] * RAD, xm, ym)
  } else {
    return null
  }

  let lon = out[0] / RAD
  const lat = out[1] / RAD
  if (!isFinite(lon) || !isFinite(lat) || lat < -90 || lat > 90) return null
  while (lon > 180) lon -= 360
  while (lon < -180) lon += 360
  return [lon, lat]
}
