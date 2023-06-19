<script lang="ts">
	import PannableCanvas from '$lib/PannableCanvas'
	import type { ContextWrapper } from '$lib/Surface/context'
	import type { Context2D } from '$lib/Contexts/2d/Context2D'
	import Surface from '$lib/Surface/Surface.svelte'
	import { db, getUsersFromRect, type UserProfile } from '../TweetsStore'
	import { Rect } from '$lib/PannableCanvas/sizes'
	import type { Dot } from '$lib/Contexts/2d/Dot'
	import { getSlerp } from '$lib/Contexts/Interp'
	let context: ContextWrapper<Context2D> | undefined = undefined
	let userProfiles: UserProfile[] = []
	let dots: Map<string, Dot> = new Map()
	let getScreenSize: () => Rect
	let sliderValue = 0
	let dotsContext: ContextWrapper<Context2D> | undefined = undefined
	const init = () => {
		if (!context) throw new Error('Context is null after init')
		context.ctx.setScale(
			Math.max(context.ctx.canvasCtx.canvas.width, context.ctx.canvasCtx.canvas.height)
		)
		dotsContext = context.ctx.addChild(-0.5, -0.5, 1, { color: '#000', interp: getSlerp(0.5) })
		// let dot = context.ctx.addDot(0, 0, 10)
	}
	$: console.log($db)
	$: if ($db)
		getUsersFromRect($db, new Rect(0, 0, 1, 1)).then((users) => {
			userProfiles = users
		})

	$: if (context && $db) getDots()
	let timeout: number | undefined = undefined
	function getDots(fromTimeout = false) {
		if (!fromTimeout) {
			if (timeout) clearTimeout(timeout)
			timeout = setTimeout(() => {
				getDots(true)
			}, 50)
			return
		}
		if (!dotsContext) throw new Error('Context is null after init')
		const { ctx } = dotsContext
		if (!$db) return
		const rect = getScreenSize()
		rect.x += 0.5
		rect.y += 0.5
		getUsersFromRect($db, rect).then((users) => {
			userProfiles = users
			const usersOffScreen = new Set(dots.keys())
			for (let user of userProfiles) {
				usersOffScreen.delete(user.user)
				if (!dots.has(user.user)) {
					dots.set(user.user, ctx.addDot(...user.randomPos, 0.001))
				}
			}
			for (let user of usersOffScreen) {
				let dot = dots.get(user)
				if (dot) {
					ctx.removeDot(dot)
					if (!dots.delete(user)) throw new Error('Failed to delete dot')
				}
			}
		})
	}
	// $: window.getUsersFromRect = getUsersFromRect.bind(null, $db, new Rect(0, 0, 0.01, 0.01))
</script>

<div class="outer">
	<Surface width={50} height={30} {context} on:initialized={init}>
		<PannableCanvas
			bind:getScreenSize
			on:canvasWindowChanged={() => getDots()}
			bind:context
			on:initialized={init}
		/>
	</Surface>
	<div class="timeline">
		<input type="range" min="0" max="1" step="0.01" bind:value={sliderValue} />
		<span class="label left">2009</span>
		<span class="label right">Today</span>
	</div>
</div>
```

<style>
	div.outer {
		border: 2px solid black;
	}
	.timeline {
		margin: 1rem;
	}
	input {
		width: 100%;
	}
	.label {
		position: absolute;
	}
	.label.left {
		left: 0;
		transform: translate(100%, 50%);
	}
	.label.right {
		right: 0;
		transform: translate(-100%, 50%);
	}
</style>
