<script lang="ts">
	import type { Context2D } from '$lib/Contexts/2d/Context2D'
	import { getContext, onMount } from 'svelte'
	import {
		getTweetsInRange,
		type TimestampRange,
		type Tweet,
		type UserProfile
	} from '../TweetsStore'
	import type { DrawableShape } from '$lib/Contexts/DrawableShape'
	import { mulScalar, vecToIter, type Vec2, normalize } from '$lib/Utils/vec2'
	import type { DrawableObject } from '$lib/Surface/context'
	import type { Dot } from '$lib/Contexts/2d/Dot'
	import { SQRT_3_OVER_2 } from '$lib/Utils/constants'
	import { getSlerp } from '$lib/Contexts/Interp'

	export let user: UserProfile
	export let currentTimestampRange: [Date, Date]
	export let db: IDBDatabase
	let tweets: Tweet[] = []
	let context: Context2D | undefined = getContext('context')
	if (!context) throw new Error('Context is null after init')
	const controller = new AbortController()
	$: tweetsPromise = getTweetsInRange(
		db,
		user,
		currentTimestampRange.map((date) => date.getTime() / 1000) as TimestampRange,
		controller.signal
	)
	$: loadTweets(tweetsPromise)
	const interp = getSlerp(0.25)
	export let drawable = context.addChild(
		...(user.randomPos.map((v) => v * 1000 - 500) as [number, number]),
		0.001
	)
	const loaded = drawable.ctx.addDot(0, 0, 0, {
		color: '#000',
		interp
	})
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
	async function loadTweets(promise: Promise<Tweet[]>) {
		tweets = await promise
		if (tweets.length == 0) {
			loaded.color = '#e5e6e2'
		}
		drawable.ctx.setDotRadius(loaded, 1.01)
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
				stats[key as keyof typeof stats] /= Math.min(Math.log(tweets.length) * 10, tweets.length)
			}
		}

		for (const key in dots) {
			const dot = dots[key as keyof typeof dots]
			const scale = stats[key as keyof typeof stats]
			drawable.ctx.setDotRadius(dot, scale)
			const vec = normalize(dot.pos)
			const newVec = mulScalar(vec, Math.max(scale, 1))
			drawable.ctx.moveDot(dot, ...vecToIter(newVec))
		}
	}
	onMount(() => {
		return () => {
			if (!context) return
			console.log('deleting')
			context.removeChild(drawable)
			controller.abort()
		}
	})
</script>
