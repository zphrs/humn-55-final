<script lang="ts">
	import PannableCanvas from '$lib/PannableCanvas'
	import type { ContextWrapper } from '$lib/Surface/context'
	import type { Context2D } from '$lib/Contexts/2d/Context2D'
	import Surface from '$lib/Surface/Surface.svelte'
	import { db, getUsersFromRect, type UserProfile } from '../TweetsStore'
	import { Rect } from '$lib/PannableCanvas/sizes'
	import type { Dot } from '$lib/Contexts/2d/Dot'
	import { getSlerp } from '$lib/Contexts/Interp'
	import DotElem from './Dot.svelte'
	import Key from './Key.svelte'
	import { addVec, clamp, distanceTo, newVec2, subVec, type Vec2 } from '$lib/Utils/vec2'
	import type { PEvent } from '$lib/Gestures/addMoreEvents'
	import { createEventDispatcher } from 'svelte'
	import UserProfilePopup from './UserProfilePopup.svelte'
	let context: ContextWrapper<Context2D> | undefined = undefined
	let getScreenSize: () => Rect
	let sliderValue = 0
	let dotsContext: ContextWrapper<Context2D> | undefined = undefined
	let usersOnScreen: UserProfile[] = []
	const init = () => {
		if (!context) throw new Error('Context is null after init')
		context.ctx.setScale(
			clamp(
				2000,
				Math.max(context.ctx.canvasCtx.canvas.width, context.ctx.canvasCtx.canvas.height),
				100000
			)
		)
		dotsContext = context.ctx.addChild(-0.5, -0.5, 1, { color: '#000', interp: getSlerp(0.5) })
		// let dot = context.ctx.addDot(0, 0, 10)
	}
	$: console.log($db)

	$: if (context && $db) getDots()
	$: if (context && $db) addBlankDots()

	const dispatch = createEventDispatcher<{
		userTapped: UserProfile
	}>()

	function addBlankDots() {
		if (!dotsContext) throw new Error('Context is null after init')
		const { ctx } = dotsContext
		if (!$db) return
		const rect = new Rect(0, 0, 1, 1)
		getUsersFromRect($db, rect).then((users) => {
			for (let user of users) {
				ctx.addDot(...user.randomPos, 0.001, {
					color: '#979998'
				})
			}
		})
	}
	let timeout: number | undefined = undefined
	function getDots(fromTimeout = false) {
		loaded = false
		if (!fromTimeout) {
			if (timeout) clearTimeout(timeout)
			timeout = setTimeout(() => {
				getDots(true)
			}, 1000)
			return
		}
		if (!dotsContext) throw new Error('Context is null after init')
		const { ctx } = dotsContext
		if (!$db) return
		const rect = getScreenSize()
		rect.x += 0.5
		rect.y += 0.5
		getUsersFromRect($db, rect).then((users) => {
			usersOnScreen = users
			resetAllSaturated()
		})
	}

	function resetAllSaturated() {
		allSaturated = new Set(usersOnScreen.map((u) => u.user))
		loaded = allSaturated.size == 0
	}

	const start = new Date('January 1 2009').getTime()
	const range = new Date('January 1 2023').getTime() - start

	$: startDate = new Date(start + range * sliderValue)
	$: endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
	$: timestampRange = [startDate, endDate] as [Date, Date]
	let newTimestampRange = timestampRange
	let sliderTimeout = 0
	function setTimestampRange(timestampRange: [Date, Date]) {
		loaded = false
		clearTimeout(sliderTimeout)
		sliderTimeout = setTimeout(() => {
			newTimestampRange = timestampRange
		}, 1000)
	}
	$: setTimestampRange(timestampRange)
	$: newTimestampRange && resetAllSaturated()
	let allSaturated = new Set(usersOnScreen.map((u) => u.user))
	let loaded = false
	// $: window.getUsersFromRect = getUsersFromRect.bind(null, $db, new Rect(0, 0, 0.01, 0.01))
	let screenSpaceToCanvasSpace: (x: number, y: number) => Vec2
	function getTappedUser(e: PEvent) {
		e.relativeX
		const pos = screenSpaceToCanvasSpace(e.relativeX, e.relativeY)
		console.log('HERE', pos)
		// find all users on screen
		const users = usersOnScreen.filter((u) => {
			const posVec = subVec(newVec2(...u.randomPos), newVec2(0.5, 0.5))
			const dist = distanceTo(posVec, pos)
			return dist < 0.002
		})
		// sort users by distance
		users.sort((a, b) => {
			const posVecA = subVec(newVec2(...a.randomPos), newVec2(0.5, 0.5))
			const posVecB = subVec(newVec2(...b.randomPos), newVec2(0.5, 0.5))
			const distA = distanceTo(posVecA, pos)
			const distB = distanceTo(posVecB, pos)
			return distA - distB
		})
		// get closest user
		const user = users[0]
		if (!user) return
		console.log(user)
		return user
	}

	function broadcastIfUserTapped(e: CustomEvent<PEvent>) {
		const user = getTappedUser(e.detail)
		userSelected = user
	}
	let userSelected: UserProfile | undefined = undefined
</script>

<div class="outer" class:loaded>
	{#if userSelected && $db}
		<UserProfilePopup
			bind:user={userSelected}
			beginningDate={new Date('January 1 2009')}
			latestTimestamp={newTimestampRange[1]}
			db={$db}
		/>
	{/if}
	<Key />
	<Surface width={60} height={30} {context} on:initialized={init}>
		<PannableCanvas
			bind:getScreenSize
			bind:screenSpaceToCanvasSpace
			on:canvasWindowChanged={() => getDots()}
			bind:context
			on:initialized={init}
			on:ptap={broadcastIfUserTapped}
		/>
		{#if usersOnScreen.length > 0 && usersOnScreen.length < 20000 && $db}
			{#each usersOnScreen as user (user.user)}
				<DotElem
					on:load={() => {
						allSaturated.delete(user.user)
						loaded = allSaturated.size == 0
					}}
					{user}
					currentTimestampRange={newTimestampRange}
					db={$db}
				/>
			{/each}
		{/if}
	</Surface>
	<div class="timeline">
		<input type="range" min="0" max="1" step=".001" bind:value={sliderValue} />
		<span class="label left">2009</span>
		<span
			class="label middle"
			class:loaded
			style={`--progress: ${sliderValue * 100}%; --progress-decimal: ${sliderValue};`}
			>{endDate.toLocaleDateString('en-us', { year: 'numeric', month: 'short' })}</span
		>
		<span class="label right">2023</span>
	</div>
</div>

<style>
	div.outer {
		border: 2px solid black;
		max-width: 960px;
		width: 100%;
		position: relative;
	}
	.timeline {
		position: absolute;
		width: calc(100% - 2rem);
		margin: 0 1rem;
		left: 0;
		bottom: 0;
	}
	input {
		width: 100%;
	}
	.label {
		position: absolute;
	}
	.label.left {
		left: 0;
		top: 0;
		transform: translate(0%, 50%);
	}
	.label.right {
		right: 0;
		top: 0;
		transform: translate(0%, 50%);
	}
	.label.middle {
		position: relative;
		display: block;
		width: 5.5rem;
		padding: 0 0.25rem;
		border-radius: 0.5rem;
		text-align: center;
		top: -3.5rem;
		left: calc(var(--progress) - var(--progress-decimal) * 5.5rem);
		background-color: var(--gold-700);
		background: linear-gradient(
			135deg,
			var(--sea-900),
			var(--fire-900),
			var(--gold-900),
			var(--violet-900),
			var(--sea-900),
			var(--fire-900),
			var(--gold-900),
			var(--violet-900)
		);
		background-size: 600% 600%;
		background-repeat: repeat;
		background-position: 0% 50%;
		animation: gradient 4s infinite linear;
		z-index: 5;
	}
	@keyframes gradient {
		0% {
			background-position: 0% 0%;
		}
		100% {
			background-position: 70% 70%;
		}
	}
	.label.middle.loaded {
		background: var(--gray-900);
	}

	@keyframes pulse {
		0% {
			background-color: var(--sea-700);
		}
		25% {
			background-color: var(--gold-700);
		}
		50% {
			background-color: var(--violet-700);
		}
		75% {
			background-color: var(--fire-700);
		}
		100% {
			background-color: var(--sea-700);
		}
	}
</style>
