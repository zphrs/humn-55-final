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
	import { createEventDispatcher, onDestroy } from 'svelte'

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

	export let canvas: HTMLCanvasElement | undefined = undefined
	let destroy: (() => void) | undefined = undefined
	$: if (canvas) {
		;({ destroy } = addMoreEvents(canvas, dispatch))
	}
	// on unmount, destroy
	$: if (destroy) {
		onDestroy(destroy)
	}
</script>
