import { newVec2, addVec, type Vec2, divScalar, subVec, vecToIter } from '$lib/Utils/vec2'
import {
  createAnimationInfo,
  getCurrentState,
  modifyTo,
  newTo,
  updateAnimationInfo
} from '../Animate'
import type { DrawableShape } from '../DrawableShape'
import type { Interp } from '../Interp'

export type Line = DrawableShape<{ p1: Vec2; p2: Vec2; thickness: number }> & {
  p1: Vec2
  p2: Vec2
  thickness: number
  color: string
  setP1: (x: number, y: number) => void
  setP2: (x: number, y: number) => void
  setThickness: (thickness: number) => void
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
    p1: newVec2(x1, y1),
    p2: newVec2(x2, y2),
    thickness,
    color,
    animationInfo: animInfo,
    needsUpdate: true,
    deleteWhenDoneUpdating: false,
    update(dt) {
      this.needsUpdate = updateAnimationInfo(this.animationInfo, dt)
      return this.needsUpdate
    },
    draw(ctx) {
      const { p1, p2, thickness } = getCurrentState(this.animationInfo)
      const canvasCtx = ctx.canvasCtx
      canvasCtx.strokeStyle = this.color
      canvasCtx.save()
      canvasCtx.lineCap = 'round'
      canvasCtx.lineWidth = thickness
      canvasCtx.beginPath()
      canvasCtx.moveTo(...vecToIter(p1))
      canvasCtx.lineTo(...vecToIter(p2))
      canvasCtx.stroke()
      canvasCtx.restore()
    },
    setP1(x: number, y: number) {
      this.p1 = newVec2(x, y)
      modifyTo(this.animationInfo, { p1: this.p1 })
      this.needsUpdate = true
    },
    setP2(x: number, y: number) {
      this.p2 = newVec2(x, y)
      modifyTo(this.animationInfo, { p2: this.p2 })
      this.needsUpdate = true
    },
    setThickness(thickness: number) {
      this.thickness = thickness
      modifyTo(this.animationInfo, { thickness })
      this.needsUpdate = true
    },
    delete() {
      modifyTo(this.animationInfo, { thickness: 0 })
      this.needsUpdate = true
      this.deleteWhenDoneUpdating = true
    }
  }
}
