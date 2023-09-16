<script lang="ts">
	import type { Context2D } from '$lib/Contexts/2d/Context2D'
	import { getContext, onDestroy, createEventDispatcher } from 'svelte'
	import type { SaturatedUserProfile, TimestampRange, Tweet, UserProfile } from '../TweetsStore'
	import type { DrawableShape } from '$lib/Contexts/DrawableShape'
	import { mulScalar, vecToIter, type Vec2, normalize } from '$lib/Utils/vec2'
	import type { DrawableObject } from '$lib/Surface/context'
	import type { Dot } from '$lib/Contexts/2d/Dot'
	import { SQRT_3_OVER_2 } from '$lib/Utils/constants'
	import { getSlerp } from '$lib/Contexts/Animate/Interp'
	import { getTweetsStore } from '../DotsStore'
	import type { Readable } from 'svelte/store'

	export let user: UserProfile
	export let currentTimestampRange: [Date, Date]
	export let db: IDBDatabase
	export let selected: boolean = false
	let tweets: Tweet[] = []
	let context: Context2D | undefined = getContext('context')
	if (!context) throw new Error('Context is null after init')
	let controller = new AbortController()
	let animIntervalId = 0
	const interp = getSlerp(0.25)
	const dispatch = createEventDispatcher<{
		load: void
	}>()
	export let drawable = context.addChild(
		...(user.randomPos.map((v) => v * 1000 - 500) as [number, number]),
		0.001
	)
	const dots = {
		metoo: drawable.ctx.addDot(0, 1, 0, {
			color: '#ffd14080',
			interp
		}),
		blacklm: drawable.ctx.addDot(1, 0, 0, {
			color: '#f58f5380',
			interp
		}),
		bluelm: drawable.ctx.addDot(-1, 0, 0, {
			color: '#a8a9f480',
			interp
		}),
		climate: drawable.ctx.addDot(0, -1, 0, {
			color: '#ace9c580',
			interp
		})
	}
	const loadingIndicator = drawable.ctx.addDot(0, 0, 0, {
		color: '#000',
		interp,
		zIndex: 10
	})
	const selectedIndicator = drawable.ctx.addDot(0, 0, 0, {
		color: '#b0b3b0',
		interp,
		zIndex: 0
	})
	$: drawable.ctx.setDotRadius(selectedIndicator, selected ? 3 : 0)
	let saturatedUser: Readable<SaturatedUserProfile | undefined> | undefined = undefined
	$: if (saturatedUser != undefined && $saturatedUser != undefined && user) dispatch('load')
	function saturateUser(range: TimestampRange) {
		saturatedUser = getTweetsStore(db, user, range, controller.signal)
	}
	$: saturateUser(currentTimestampRange.map((date) => date.getTime() / 1000) as TimestampRange)
	$: onSaturatedUserChange($saturatedUser)
	function onSaturatedUserChange(saturatedUser: SaturatedUserProfile | undefined) {
		if (saturatedUser == undefined) {
			Object.values(dots).map((dot) => {
				const scale = dot.getRadius() / 2
				drawable.ctx.setDotRadius(dot, scale)
				const vec = normalize(dot.getPos())
				const newVec = mulScalar(vec, Math.max(scale, 1))
				drawable.ctx.moveDot(dot, ...vecToIter(newVec))
			})
			animIntervalId = setInterval(async () => {
				loadingIndicator.color = '#fff'
				drawable.ctx.setDotRadius(loadingIndicator, 0.75)
				await new Promise((resolve) => setTimeout(resolve, 300))
				if (animIntervalId == 0) return
				drawable.ctx.setDotRadius(loadingIndicator, 0.45)
			}, 3000)
			return
		}
		controller.abort()
		clearTimeout(animIntervalId)
		animIntervalId = 0
		controller = new AbortController()
		tweets = saturatedUser.tweets

		if (tweets.length == 0) {
			loadingIndicator.color = '#fff8'
		} else {
			loadingIndicator.color = '#000'
		}
		drawable.ctx.setDotRadius(loadingIndicator, 1.01)
		// sort tweets chronologically
		tweets.sort((a, b) => a.date.getTime() - b.date.getTime())

		// add dot for each tweet color coded based on:
		// containsBlackLivesMatter: boolean
		// containsBlueLivesMatter: boolean
		// containsMeToo: boolean
		// containsClimate: boolean

		if (!context) return

		if (tweets.length == 0) {
			Object.values(dots).map((dot) => {
				drawable.ctx.setDotRadius(dot, 0)
			})
			return
		}

		const stats = {
			blacklm: 0,
			bluelm: 0,
			metoo: 0,
			climate: 0
		}

		for (const tweet of tweets) {
			if (tweet.containsBlackLivesMatter) {
				stats.blacklm++
			}
			if (tweet.containsBlueLivesMatter) {
				stats.bluelm++
			}
			if (tweet.containsClimate) {
				stats.climate++
			}
			if (tweet.containsMeToo) {
				stats.metoo++
			}
		}
		for (const key in stats) {
			if (Object.prototype.hasOwnProperty.call(stats, key)) {
				let k = key as keyof typeof stats
				const countLogged = Math.log(stats[k] + 1)
				stats[k] = countLogged * 5
			}
		}

		for (const key in dots) {
			const dot = dots[key as keyof typeof dots]
			const scale = stats[key as keyof typeof stats]
			drawable.ctx.setDotRadius(dot, scale)
			const vec = normalize(dot.getPos())
			const newVec = mulScalar(vec, Math.max(scale, 1))
			drawable.ctx.moveDot(dot, ...vecToIter(newVec))
		}
	}
	onDestroy(() => {
		controller.abort()
		if (!context) return
		clearInterval(animIntervalId)
		animIntervalId = 0
		context.removeChild(drawable)
	})
</script>
