<script lang="ts">
	import type {
		ZoomEvent,
		PanEvent,
		PEvent,
		PPinchEvent,
		PointersDict,
		HasRelativePos
	} from '$lib/Gestures/addMoreEvents'
	import { createEventDispatcher } from 'svelte'
	import { writable, type Writable } from 'svelte/store'
	import GestureCanvas from '../GestureCanvas.svelte'
	import { Rect } from './sizes'
	import {
		addVec,
		divScalar,
		mulScalar,
		newVec2,
		subVec,
		vecToIter,
		type Vec2
	} from '$lib/Utils/vec2'
	import {
		type ShapeConfig,
		type ScalePos,
		type Context2D,
		createContext2D,
		completeShapeConfig
	} from '$lib/Contexts/2d/Context2D'
	import type { ContextWrapper } from '$lib/Surface/context'
	import type { DrawableShape } from '$lib/Contexts/DrawableShape'
	import { getCubicBezier, getLinearInterp, getSlerp } from '$lib/Contexts/Interp'
	import {
		createAnimationInfo,
		type AnimationInfo,
		modifyTo,
		updateAnimationInfo
	} from '$lib/Contexts/Animate'
	import { browser } from '$app/environment'

	let canvas: HTMLCanvasElement | undefined = undefined
	export let pointersWritable: Writable<PointersDict> = writable({})
	export let pointersWritableProxy: Writable<PointersDict> = writable({})
	export let pPan: (e: CustomEvent<PanEvent>, ctx: CanvasRenderingContext2D) => boolean = () => true
	export let context: ContextWrapper<Context2D> | undefined = undefined

	const dispatch = createEventDispatcher<{
		ppanstart: PEvent
		ppinchdown: PPinchEvent
		ppinchup: PPinchEvent
		pholdup: PEvent
		ppanup: PEvent
		ppinch: PPinchEvent
		zoom: ZoomEvent
		pmove: PointerEvent & HasRelativePos
		ppan: PanEvent
		ptap: PEvent
		initialized: void
		canvasWindowChanged: void
	}>()
	let ctx: CanvasRenderingContext2D | null
	$: {
		if (browser) {
			context = createContext2D({
				interp: getLinearInterp(0.05)
			})
			ctx = context.ctx.canvasCtx
			canvas = ctx.canvas
			dispatch('initialized')
		}
	}

	pointersWritableProxy.subscribe((pointers) => {
		// deep copy
		const pointersCopy: PointersDict = JSON.parse(JSON.stringify(pointers))
		Object.values(pointersCopy).forEach((pointer) => {
			if (!ctx) return
			const relative = screenSpaceToCanvasSpace(pointer.relativeX, pointer.relativeY)
			pointer.relativeX = relative.x
			pointer.relativeY = relative.y
		})
		pointersWritable.set(pointersCopy)
	})

	export function screenSpaceToCanvasSpace(x: number, y: number) {
		return vecScreenSpaceToCanvasSpace(newVec2(x, y))
	}

	export function vecScreenSpaceToCanvasSpace(vec: Vec2) {
		if (!context || !ctx) return newVec2(0, 0)
		return subVec(
			divScalar(
				subVec(vec, newVec2(ctx.canvas.width / 2, ctx.canvas.height / 2)),
				context.ctx.getScale()
			),
			context.ctx.getPos()
		)
	}

	export function getScale() {
		return context?.ctx.getScale() ?? 1
	}

	export function getContext() {
		return ctx
	}

	export function canvasSpaceToScreenSpace(x: number, y: number): Vec2 {
		if (!context || !ctx) return newVec2(0, 0)
		const zoomAmount = context.ctx.getScale()
		const zoomTranslate = context.ctx.getPos()
		return newVec2(
			(x + zoomTranslate.x) * zoomAmount + ctx.canvas.width / 2,
			(y + zoomTranslate.y) * zoomAmount + ctx.canvas.height / 2
		)
	}

	export function vecCanvasSpaceToScreenSpace(vec: Vec2) {
		if (!ctx || !context) return
		const zoomAmount = context.ctx.getScale()
		const zoomTranslate = context.ctx.getPos()
		return addVec(
			mulScalar(addVec(vec, zoomTranslate), zoomAmount),
			newVec2(ctx.canvas.width / 2, ctx.canvas.height / 2)
		)
	}

	export function getScreenSize() {
		if (!ctx || !context) return new Rect(0, 0, 0, 0)
		const xy = screenSpaceToCanvasSpace(0, 0)
		const zoomAmount = context.ctx.getScale()
		return new Rect(xy.x, xy.y, ctx.canvas.width / zoomAmount, ctx.canvas.height / zoomAmount)
	}

	let zoomTranslateOnDown: Vec2 | null = null
	function saveZoomTranslate() {
		if (!context) return
		zoomTranslateOnDown = context?.ctx.getPos()
	}

	function onZoom(e: CustomEvent<ZoomEvent>) {
		if (!ctx || !canvas || !context) return
		const { scaleAmount, relativeX, relativeY } = e.detail
		const oldZoom = context.ctx.getScale()
		const newZoom = oldZoom * scaleAmount
		context.ctx.setScale(newZoom)
		const xOffset = relativeX - ctx.canvas.width / 2 / devicePixelRatio
		const yOffset = relativeY - ctx.canvas.height / 2 / devicePixelRatio
		context.ctx.setPosToVec(
			addVec(
				context.ctx.getPos(),
				newVec2(xOffset / newZoom - xOffset / oldZoom, yOffset / newZoom - yOffset / oldZoom)
			)
		)
		dispatch('zoom', e.detail)
		dispatch('canvasWindowChanged')
	}
	function onPPan(e: CustomEvent<PanEvent>) {
		if (!ctx || !canvas || !context || !pPan(e, ctx) || !zoomTranslateOnDown) return
		const { relativeX, relativeY, downX, downY } = e.detail
		const deltaX = relativeX - downX
		const deltaY = relativeY - downY
		const zoomAmount = context.ctx.getScale()
		const newZoomTranslate = addVec(
			zoomTranslateOnDown,
			newVec2(deltaX / zoomAmount, deltaY / zoomAmount)
		)
		context.ctx.setPosToVec(newZoomTranslate)
		dispatch('ppan', e.detail)
		dispatch('canvasWindowChanged')
	}
</script>

<GestureCanvas
	canvas={context && context.ctx.canvasCtx.canvas ? context.ctx.canvasCtx.canvas : undefined}
	on:ppanstart={(e) => {
		saveZoomTranslate()
		dispatch('ppanstart', e.detail)
	}}
	on:zoom={onZoom}
	on:ppan={onPPan}
	on:ppanup
	on:pholdup
	on:ptap
	on:pmove
/>
