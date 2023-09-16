import { newVec2, type Vec2, vecToIter } from '$lib/Utils/vec2'
import {
  createAnimationInfo,
  getCurrentStateWithChildren,
  modifyTo,
  updateAnimationInfo
} from '../Animate/Animatable'
import type { DrawableShape } from '../DrawableShape'
import type { Interp } from '../Animate/Interp'

export type Line = DrawableShape<{ p1: Vec2; p2: Vec2; thickness: number }> & {
  getP1: () => Vec2
  getP2: () => Vec2
  setP1: (p1: Vec2) => void
  setP2: (p2: Vec2) => void
  getThickness: () => number
  setThickness: (thickness: number) => void
  color: string
  delete: () => void
}

export function createLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  thickness: number,
  color: string,
  interp: Interp
): Line {
  const animInfo = createAnimationInfo(
    { p1: newVec2(x1, y1), p2: newVec2(x2, y2), thickness: 0 },
    interp
  )
  modifyTo(animInfo, { thickness })
  return {
    getP1() {
      return getCurrentStateWithChildren(this.animationInfo).p1
    },
    getP2() {
      return getCurrentStateWithChildren(this.animationInfo).p2
    },

    setP1(p1: Vec2) {
      modifyTo(this.animationInfo, { p1 })
      this.needsUpdate = true
    },
    setP2(p2: Vec2) {
      modifyTo(this.animationInfo, { p2 })
      this.needsUpdate = true
    },

    getThickness() {
      return getCurrentStateWithChildren(this.animationInfo).thickness
    },
    setThickness(thickness: number) {
      modifyTo(this.animationInfo, { thickness })
      this.needsUpdate = true
    },
    color,
    animationInfo: animInfo,
    needsUpdate: true,
    deleteWhenDoneUpdating: false,
    update(dt) {
      this.needsUpdate = updateAnimationInfo(this.animationInfo, dt)
      return this.needsUpdate
    },
    draw(ctx) {
      const { p1, p2, thickness } = getCurrentStateWithChildren(this.animationInfo)
      const canvasCtx = ctx.canvasCtx
      canvasCtx.save()
      canvasCtx.strokeStyle = this.color
      canvasCtx.lineCap = 'round'
      canvasCtx.lineWidth = thickness
      canvasCtx.beginPath()
      canvasCtx.moveTo(...vecToIter(p1))
      canvasCtx.lineTo(...vecToIter(p2))
      canvasCtx.stroke()
      canvasCtx.restore()
    },
    delete() {
      modifyTo(this.animationInfo, { thickness: 0 })
      this.needsUpdate = true
      this.deleteWhenDoneUpdating = true
    }
  }
}
