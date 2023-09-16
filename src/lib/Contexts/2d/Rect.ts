import { newVec2, type Vec2 } from '$lib/Utils/vec2'
import {
  createAnimationInfo,
  getCurrentState,
  getCurrentStateWithChildren,
  modifyTo,
  updateAnimationInfo
} from '../Animate/Animatable'
import type { DrawableShape } from '../DrawableShape'
import type { Interp } from '../Animate/Interp'

export type Rect = DrawableShape<{ center: Vec2; width: number; height: number }> & {
  color: string
  getCenter: () => Vec2
  getWidth: () => number
  getHeight: () => number
  setCenter: (x: number, y: number) => void
  setWidth: (width: number) => void
  setHeight: (height: number) => void
  delete: () => void
}

export function createRect(
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  color: string,
  interp: Interp
): Rect {
  const center = newVec2(centerX, centerY)
  const animInfo = createAnimationInfo({ center, width: 0, height: 0 }, interp)
  modifyTo(animInfo, { width, height })
  return {
    color,
    animationInfo: animInfo,
    needsUpdate: true,
    deleteWhenDoneUpdating: false,
    update(dt: number) {
      this.needsUpdate = updateAnimationInfo(this.animationInfo, dt)
      return this.needsUpdate
    },
    draw(ctx) {
      const { center, width, height } = getCurrentStateWithChildren(this.animationInfo)
      const canvasCtx = ctx.canvasCtx
      canvasCtx.fillStyle = this.color
      canvasCtx.fillRect(center.x - width / 2, center.y - height / 2, width, height)
    },
    getCenter() {
      return getCurrentStateWithChildren(this.animationInfo).center
    },
    getWidth() {
      return getCurrentStateWithChildren(this.animationInfo).width
    },
    getHeight() {
      return getCurrentStateWithChildren(this.animationInfo).height
    },
    setCenter(x, y) {
      modifyTo(this.animationInfo, { center: { x, y } })
      this.needsUpdate = true
    },
    setWidth(width) {
      modifyTo(this.animationInfo, { width })
      this.needsUpdate = true
    },
    setHeight(height) {
      modifyTo(this.animationInfo, { height })
      this.needsUpdate = true
    },
    delete() {
      this.setWidth(0)
      this.setHeight(0)
      this.deleteWhenDoneUpdating = true
    }
  }
}
