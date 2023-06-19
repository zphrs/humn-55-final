<script lang="ts">
	import { type SideOffset, SIDES, type Side, defaultSideOffset } from './surface'
	import { NO_CONTEXT, type ContextWrapper } from './context'
	import { getContext, onMount, setContext } from 'svelte'
	import { gridToCSSVariables } from './grid'
	import type { Grid } from './grid'
	import { onDestroy } from 'svelte/internal'
	import { browser } from '$app/environment'
	/** sides of the parent surface to align to. If no parent it will align to the top of the
	 * window
	 */
	export let alignTo = defaultSideOffset()
	/** multiplier of 4 pixels */
	export let padding: number = 0
	export let fixed: any | undefined = undefined
	export let sticky: any | undefined = undefined

	export let context: ContextWrapper<unknown> = NO_CONTEXT
	export let gridParams: Grid | undefined = undefined
	let setGridParams = (params: Grid) => {
		gridParams = params
	}

	$: hasAlign = Object.values(alignTo).some((v) => v != undefined)
	setContext('setGridParams', setGridParams)
	$: context && setContext('context', context.ctx)
	getContext('gestures')
	/** number of tiles */
	export let width: number | undefined = undefined
	/** number of tiles */
	export let height: number | undefined = undefined
	export let elem: HTMLDivElement | undefined = undefined
	function surfaceToCss(
		alignTo: SideOffset,
		width: number | undefined,
		height: number | undefined,
		xPadding: number,
		yPadding: number
	): string {
		let out = `--padding-x: ${xPadding}px;`
		out += `--padding-y: ${yPadding}px;`
		width != undefined && (out += `max-width: ${width * 16}px;`)
		height != undefined && (out += `height: ${height * 16}px;`)
		for (const SIDE of SIDES) {
			let sideValue = alignTo[SIDE as Side]
			if (sideValue != undefined) {
				out += `--${SIDE}: ${sideValue};`
			} else {
				out += `--${SIDE}: auto;`
			}
		}
		return out
	}

	let lastTime: number | null = null

	function restartUpdateLoop() {
		if (lastTime == null) {
			lastTime = performance.now()
			requestAnimationFrame(updateLoop)
		}
	}

	function updateLoop(time: number) {
		let dt = 0
		if (lastTime != null) {
			dt = time - lastTime
		}

		lastTime = time

		let renderNextFrame = context?.update(dt / 1000)
		context.draw(context.ctx)
		if (renderNextFrame) {
			requestAnimationFrame(updateLoop)
			return
		}
		lastTime = null
	}

	function setupContext() {
		if (elem && context) {
			context.addRestartListener(restartUpdateLoop)
			restartUpdateLoop()
			return context.init(elem) || (() => {})
		}
		return () => {}
	}
	$: context != undefined && onDestroy(setupContext())
</script>

<div
	bind:this={elem}
	class={'surface'}
	class:grid={gridParams != undefined}
	class:absolute={hasAlign}
	class:fixed
	class:sticky
	style={surfaceToCss(alignTo, width, height, padding * 4, padding * 4) +
		(gridParams ? gridToCSSVariables(gridParams) : '')}
>
	<slot />
</div>

<style>
	.surface {
		display: grid;
		box-sizing: border-box;
		grid-gap: 4px;
		padding: var(--padding-y, 0px) var(--padding-x, 0px);
		top: var(--top, auto);
		bottom: var(--bottom, auto);
		left: var(--left, auto);
		right: var(--right, auto);
		margin-left: auto;
		margin-right: auto;
		position: relative;
	}
	.absolute {
		position: absolute;
		background-color: inherit;
	}
	.fixed {
		position: fixed;
	}
	.sticky {
		position: sticky;
	}
	.grid {
		grid-template-columns: repeat(auto-fill, minmax(var(--cell-width), 1fr));
		grid-template-rows: repeat(auto-fill, minmax(var(--cell-height), 1fr));
		gap: var(--gap);
	}
</style>
