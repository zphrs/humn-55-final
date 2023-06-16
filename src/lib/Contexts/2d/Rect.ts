import { newVec2, type Vec2 } from '$lib/Utils/vec2'
import { createAnimationInfo, getCurrentState, modifyTo, updateAnimationInfo } from '../Animate'
import type { DrawableShape } from '../DrawableShape'
import type { Interp } from '../Interp'

export type Rect = DrawableShape<{ center: Vec2; width: number; height: number }> & {
	center: Vec2
	width: number
	height: number
	color: string
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
		center,
		width,
		height,
		color,
		animationInfo: animInfo,
		needsUpdate: true,
		deleteWhenDoneUpdating: false,
		update(dt: number) {
			this.needsUpdate = updateAnimationInfo(this.animationInfo, dt)
			return this.needsUpdate
		},
		draw(ctx) {
			const { center, width, height } = getCurrentState(this.animationInfo)
			const canvasCtx = ctx.canvasCtx
			canvasCtx.fillStyle = this.color
			canvasCtx.fillRect(center.x - width / 2, center.y - height / 2, width, height)
		},
		setCenter(x, y) {
			this.center = newVec2(x, y)
			modifyTo(this.animationInfo, { center: this.center })
			this.needsUpdate = true
		},
		setWidth(width) {
			this.width = width
			modifyTo(this.animationInfo, { width })
			this.needsUpdate = true
		},
		setHeight(height) {
			this.height = height
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
