import { newVec2, vecToIter, type Vec2 } from '$lib/Utils/vec2'
import {
  createAnimationInfo,
  getCurrentStateWithChildren,
  modifyTo,
  updateAnimationInfo,
  getInterpingTo
} from '../Animate/Animatable'
import type { DrawableShape } from '../DrawableShape'
import type { Interp } from '../Animate/Interp'

type AnimatableProperties = {
  pos: Vec2
  r: number
}

export type Dot = DrawableShape<{ pos: Vec2; r: number }> & {
  color: string
  getRadius: () => number
  getPos: () => Vec2
  setRadius: (r: number) => void
  setPos: (pos: Vec2) => void
  delete: () => void
}

export function createDot(x: number, y: number, r: number, color: string, interp: Interp): Dot {
  const animInfo = createAnimationInfo({ pos: newVec2(x, y), r: 0 }, interp)
  modifyTo(animInfo, { r })
  return {
    getRadius() {
      return getInterpingTo(this.animationInfo).r
    },
    getPos() {
      return getInterpingTo(this.animationInfo.children.pos)
    },

    setRadius(r: number) {
      modifyTo(this.animationInfo, { r })
      this.needsUpdate = true
    },
    setPos(pos: Vec2) {
      modifyTo(this.animationInfo, { pos })
      this.needsUpdate = true
    },

    color,
    animationInfo: animInfo,
    needsUpdate: true,
    deleteWhenDoneUpdating: false,
    update(dt) {
      this.needsUpdate = updateAnimationInfo(animInfo, dt)
      return this.needsUpdate
    },
    draw(ctx) {
      const { pos: displayPos, r: displayRadius } = getCurrentStateWithChildren(animInfo)
      const canvasCtx = ctx.canvasCtx
      canvasCtx.fillStyle = this.color
      canvasCtx.beginPath()
      canvasCtx.arc(...vecToIter(displayPos), displayRadius, 0, 2 * Math.PI)
      canvasCtx.fill()
    },
    delete() {
      this.setRadius(0)
      this.deleteWhenDoneUpdating = true
    }
  }
}
