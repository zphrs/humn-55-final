import {
	addObjectWithZIndex,
	type ContextWrapper,
	type DrawableObject,
	type UpdatableAndDrawable
} from '$lib/Surface/context'
import { newVec2, vecToIter, type Vec2 } from '$lib/Utils/vec2'
import {
	createAnimationInfo,
	type AnimationInfo,
	type KeyToKeyOrNumber,
	modifyTo,
	getCurrentState,
	updateAnimationInfo,
	newTo
} from '../Animate'
import type { DrawableShape } from '../DrawableShape'
import { getSlerp, NO_INTERP, type Interp } from '../Interp'
import { createDot, type Dot } from './Dot'
import { createLine, type Line } from './Line'
import { createRect, type Rect } from './Rect'

export type HasZIndex = { zIndex: number }

export type HasColor = { color: string }

export type HasInterp = { interp: Interp }

export type ShapeConfig = {
	interp?: Interp
	color?: string
	zIndex?: number
}

export type CompleteShapeConfig = {
	interp: Interp
	color: string
	zIndex: number
}

const DEFAULT_SHAPE_CONFIG: CompleteShapeConfig = {
	interp: NO_INTERP,
	color: 'black',
	zIndex: 0
}

export function completeShapeConfig(
	config: ShapeConfig,
	parentConfig: ShapeConfig = {}
): CompleteShapeConfig {
	return { ...DEFAULT_SHAPE_CONFIG, ...parentConfig, ...config }
}

export type Context2D = Readonly<{
	canvasCtx: CanvasRenderingContext2D
	setScale: (scale: number) => void
	setPos: (x: number, y: number) => void
	setPosToVec: (pos: Vec2) => void
	getScale: () => number
	getPos: () => Vec2
	delete: () => void
	addDot: (x: number, y: number, r: number, shapeConfig?: ShapeConfig) => Dot
	removeDot: (dot: Dot) => void
	moveDot: (dot: Dot, x: number, y: number) => void
	setDotRadius: (dot: Dot, r: number) => void
	addLine: (x1: number, y1: number, x2: number, y2: number, shapeConfig?: ShapeConfig) => Line
	setLineP1: (line: Line, x: number, y: number) => void
	setLineP2: (line: Line, x: number, y: number) => void
	setLineThickness: (line: Line, thickness: number) => void
	removeLine: (line: Line) => void
	addRect: (cX: number, cY: number, w: number, h: number, shapeConfig?: ShapeConfig) => Rect
	moveRect: (rect: Rect, cX: number, cY: number) => void
	setRectWidth: (rect: Rect, w: number) => void
	setRectHeight: (rect: Rect, h: number) => void
	removeRect: (rect: Rect) => void
	addChild: (
		x: number,
		y: number,
		scale: number,
		shapeConfig?: ShapeConfig
	) => ContextWrapper<Context2D> & DrawableShape<ScalePos>
	setChildScale: (child: ContextWrapper<Context2D> & DrawableShape<ScalePos>, scale: number) => void
	setChildPos: (
		child: ContextWrapper<Context2D> & DrawableShape<ScalePos>,
		x: number,
		y: number
	) => void
}> & { pos: Vec2; scale: number }

export type ScalePos = { scale: number; pos: Vec2 }

export function createContext2D(
	config: ShapeConfig = {},
	canvasContext?: CanvasRenderingContext2D
): ContextWrapper<Context2D> & DrawableShape<ScalePos> {
	const fullConfig = completeShapeConfig(config)
	const { interp } = fullConfig
	const animationInfo = createAnimationInfo<ScalePos>({ scale: 1, pos: newVec2(0, 0) }, interp)
	let ctx: CanvasRenderingContext2D
	let canvas: HTMLCanvasElement | null = null
	if (canvasContext) {
		ctx = canvasContext
	} else {
		//create a canvas element
		canvas = document.createElement('canvas') as HTMLCanvasElement
		// get the 2d context
		const canvasContext = canvas.getContext('2d')
		if (!canvasContext) throw new Error('Could not get 2D context')
		ctx = canvasContext
		// make canvas absolute
		canvas.style.position = 'absolute'
		canvas.style.top = '0'
		canvas.style.left = '0'
	}
	let keysInObjects = [0]
	type extendableKeyToKeyOrNumber = unknown extends KeyToKeyOrNumber ? KeyToKeyOrNumber : never
	type Deletable = { delete: () => void }
	const restartListeners = new Set<() => void>()

	function restartListener() {
		restartListeners.forEach((listener) => listener())
	}
	const out: ContextWrapper<Context2D> & {
		objects: {
			[zIndex: number]: Set<DrawableObject<extendableKeyToKeyOrNumber> & Deletable>
		}
	} & DrawableShape<ScalePos> &
		Deletable = {
		animationInfo,
		needsUpdate: false,
		objects: { 0: new Set() },
		ctx: {
			pos: newVec2(0, 0),
			scale: 1,
			canvasCtx: ctx,
			addDot(x: number, y: number, r: number, shapeConfig: ShapeConfig = {}) {
				const { color, interp, zIndex } = completeShapeConfig(shapeConfig, config)
				const dot = createDot(x, y, r, color, interp)
				addObjectWithZIndex(out.objects, keysInObjects, zIndex, dot)
				restartListener()
				return dot
			},
			removeDot(dot: Dot) {
				dot.delete()
				restartListener()
			},
			moveDot(dot: Dot, x: number, y: number) {
				dot.setPos(x, y)
				restartListener()
			},
			setDotRadius(dot: Dot, r: number) {
				dot.setRadius(r)
				restartListener()
			},
			addLine: function (
				x1: number,
				y1: number,
				x2: number,
				y2: number,
				shapeConfig: ShapeConfig = {}
			): Line {
				const { color, interp, zIndex } = completeShapeConfig(shapeConfig, config)
				const line = createLine(x1, y1, x2, y2, 5 * devicePixelRatio, color, interp)
				addObjectWithZIndex(out.objects, keysInObjects, zIndex, line)
				restartListener()
				return line
			},
			setLineP1: function (line: Line, x: number, y: number): void {
				line.setP1(x, y)
				restartListener()
			},
			setLineP2: function (line: Line, x: number, y: number): void {
				line.setP2(x, y)
				restartListener()
			},
			setLineThickness: function (line: Line, thickness: number): void {
				line.setThickness(thickness)
				restartListener()
			},
			removeLine: function (line: Line): void {
				line.delete()
				restartListener()
			},
			addRect: function (
				cX: number,
				cY: number,
				w: number,
				h: number,
				shapeConfig: ShapeConfig = {}
			): Rect {
				const { color, interp, zIndex } = completeShapeConfig(shapeConfig, config)
				const rect = createRect(cX, cY, w, h, color, interp)
				addObjectWithZIndex(out.objects, keysInObjects, zIndex, rect)
				restartListener()
				return rect
			},
			moveRect: function (rect: Rect, cX: number, cY: number): void {
				rect.setCenter(cX, cY)
				restartListener()
			},
			setRectWidth: function (rect: Rect, w: number): void {
				rect.setWidth(w)
				restartListener()
			},
			setRectHeight: function (rect: Rect, h: number): void {
				rect.setHeight(h)
				restartListener()
			},
			removeRect: function (rect: Rect): void {
				rect.delete()
				restartListener()
			},
			setScale: function (scale: number): void {
				out.ctx.scale = scale
				modifyTo(animationInfo, { scale })
				restartListener()
			},
			getScale: function (): number {
				return out.ctx.scale
			},
			setPos: function (x: number, y: number): void {
				out.ctx.pos = newVec2(x, y)
				modifyTo(animationInfo, { pos: newVec2(x, y) })
				restartListener()
			},
			setPosToVec: function (pos: Vec2): void {
				out.ctx.pos = pos
				modifyTo(animationInfo, { pos })
				restartListener()
			},
			getPos: function (): Vec2 {
				return out.ctx.pos
			},
			delete: function () {
				// delete all objects
				for (const zIndex in keysInObjects) {
					for (const obj of out.objects[zIndex]) {
						obj.delete()
					}
				}
			},
			setChildScale: function (child: ContextWrapper<Context2D>, scale: number): void {
				child.ctx.setScale(scale)
				restartListener()
			},
			setChildPos: function (child: ContextWrapper<Context2D>, x: number, y: number): void {
				child.ctx.setPos(x, y)
				restartListener()
			},
			addChild: function (x: number, y: number, scale: number, shapeConfig: ShapeConfig = {}) {
				const { color, interp, zIndex } = completeShapeConfig(shapeConfig, config)
				const child = createContext2D({ color, interp, zIndex }, ctx)
				child.ctx.setScale(scale)
				child.ctx.setPos(x, y)
				addObjectWithZIndex(out.objects, keysInObjects, zIndex, child)
				restartListener()
				return child
			}
		},
		init: (parent) => {
			if (!canvas) {
				throw new Error(
					'This context was linkely created as a child and so does not need to be initialized.'
				)
			}
			out.addRestartListener(() => {
				out.needsUpdate = true
			})
			parent.prepend(canvas)
			// add a listener to resize the canvas when the parent resizes
			function setSizes() {
				if (!canvas) {
					throw new Error(
						'This context was linkely created as a child and so does not need to be initialized.'
					)
				}
				canvas.width = parent.clientWidth * devicePixelRatio
				canvas.height = parent.clientHeight * devicePixelRatio
				out.ctx.canvasCtx.scale(devicePixelRatio, devicePixelRatio)
			}
			// run to initially set sizes
			setSizes()
			if ('ResizeObserver' in window) {
				const observer = new ResizeObserver(setSizes)
				observer.observe(parent)
				return () => observer.disconnect()
			} else {
				// add a listener to the window
				addEventListener('resize', setSizes)
				return () => removeEventListener('resize', setSizes)
			}
		},
		update(dt) {
			let draw = false
			if (updateAnimationInfo(animationInfo, dt)) {
				draw = true
			} else if (out.deleteWhenDoneUpdating) {
				return false
			}
			// loop through the in-order keys
			for (const key of keysInObjects) {
				// loop through the objects
				for (const object of this.objects[key]) {
					if (object.needsUpdate) {
						draw = true
						object.update(dt)
					} else if (object.deleteWhenDoneUpdating) {
						this.objects[key].delete(object)
						if (this.objects[key].size === 0) {
							delete this.objects[key]
							keysInObjects = keysInObjects.filter((k) => k !== key)
						}
					}
				}
			}
			return draw
		},
		draw(ctx) {
			// clear the canvas
			if (canvas) {
				ctx.canvasCtx.clearRect(0, 0, ctx.canvasCtx.canvas.width, ctx.canvasCtx.canvas.height)
			}
			// transform the canvas
			const { pos, scale } = getCurrentState(animationInfo)
			// save the current state
			ctx.canvasCtx.save()
			ctx.canvasCtx.imageSmoothingEnabled = true
			ctx.canvasCtx.translate(ctx.canvasCtx.canvas.width / 2, ctx.canvasCtx.canvas.height / 2)
			ctx.canvasCtx.scale(scale, scale)
			ctx.canvasCtx.translate(...vecToIter(pos))
			for (const key of keysInObjects) {
				for (const object of this.objects[key]) {
					object.draw(ctx)
				}
			}
			// restore the state
			ctx.canvasCtx.restore()
		},
		addRestartListener: (listener: () => void) => {
			restartListeners.add(listener)
		},
		removeRestartListener: (listener: () => void) => {
			restartListeners.delete(listener)
		},
		delete: () => {
			modifyTo(animationInfo, { scale: 0 })
			out.deleteWhenDoneUpdating = true
		}
	}
	out.addRestartListener(() => {
		out.needsUpdate = true
	})
	return out
}
