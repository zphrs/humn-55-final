<script lang="ts">
	import addMoreEvents, {
		type HasRelativePos,
		type PanEvent,
		type PEvent,
		type PointersDict,
		type PPinchEvent,
		type ZoomEvent,
		type Events
	} from './Gestures/addMoreEvents'
	import { createEventDispatcher } from 'svelte'

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
	}>()

	export let canvas: HTMLCanvasElement
</script>

<canvas bind:this={canvas} use:addMoreEvents={dispatch} />

<style>
	canvas {
		width: 100%;
		height: 100%;
	}
</style>
