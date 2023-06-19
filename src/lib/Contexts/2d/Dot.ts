import { newVec2, vecToIter, type Vec2 } from '$lib/Utils/vec2'
import {
  createAnimationInfo,
  getCurrentState,
  modifyTo,
  newTo,
  updateAnimationInfo
} from '../Animate'
import type { DrawableShape } from '../DrawableShape'
import type { Interp } from '../Interp'

export type Dot = DrawableShape<{ pos: Vec2; r: number }> & {
  pos: Vec2
  r: number
  color: string
  setPos: (x: number, y: number) => void
  setRadius: (r: number) => void
  delete: () => void
}

export function createDot(x: number, y: number, r: number, color: string, interp: Interp): Dot {
  const animInfo = createAnimationInfo({ pos: newVec2(x, y), r: 0 }, interp)
  newTo(animInfo, { pos: newVec2(x, y), r })
  return {
    pos: newVec2(x, y),
    r,
    color,
    animationInfo: animInfo,
    needsUpdate: true,
    deleteWhenDoneUpdating: false,
    update(dt) {
      this.needsUpdate = updateAnimationInfo(this.animationInfo, dt)
      return this.needsUpdate
    },
    draw(ctx) {
      const { pos: displayPos, r: displayRadius } = getCurrentState(this.animationInfo)
      const canvasCtx = ctx.canvasCtx
      canvasCtx.fillStyle = this.color
      canvasCtx.beginPath()
      canvasCtx.arc(...vecToIter(displayPos), displayRadius, 0, 2 * Math.PI)
      canvasCtx.fill()
    },
    setPos(x: number, y: number) {
      this.pos = newVec2(x, y)
      modifyTo(this.animationInfo, { pos: this.pos })
      this.needsUpdate = true
    },
    setRadius(r: number) {
      this.r = r
      modifyTo(this.animationInfo, { r })
      this.needsUpdate = true
    },
    delete() {
      this.setRadius(0)
      this.needsUpdate = true
      this.deleteWhenDoneUpdating = true
    }
  }
}
