import { newVec2, vecToIter, type Vec2 } from '$lib/Utils/vec2'
import {
	createAnimationInfo,
	getCurrentState,
	getCurrentStateWithChildren,
	modifyTo,
	updateAnimationInfo
} from '../Animate/Animatable'
import type { DrawableShape } from '../DrawableShape'
import type { Interp } from '../Animate/Interp'

type AnimatableProperties = {
	pos: Vec2
	r: number
}

export type Dot = DrawableShape<{ pos: Vec2; r: number }> & {
	color: string
	setPos: (x: number, y: number) => void
	setRadius: (r: number) => void
	delete: () => void
} & AnimatableProperties

export function createDot(x: number, y: number, r: number, color: string, interp: Interp): Dot {
	const animInfo = createAnimationInfo({ pos: newVec2(x, y), r: 0 }, interp)
	modifyTo(animInfo, { pos: newVec2(x, y), r })
	return {
		pos: newVec2(x, y),
		r,
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
		setPos(x: number, y: number) {
			this.pos = newVec2(x, y)
			modifyTo(animInfo, { pos: this.pos })
			this.needsUpdate = true
		},
		setRadius(r: number) {
			this.r = r
			modifyTo(animInfo, { r })
			this.needsUpdate = true
		},
		delete() {
			this.setRadius(0)
			this.deleteWhenDoneUpdating = true
		}
	}
}
