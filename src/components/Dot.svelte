<script lang="ts">
	import type { Context2D } from '$lib/Contexts/2d/Context2D'
	import { getContext, onMount } from 'svelte'

	export let username: string
	export let timestamps: [number, number][] = []
	export let currentTimestampRange: [Date, Date]
	let db
	let tweetsOnScreen = []
	if (!context) throw new Error('Context is null after init')
	onMount(() => {
		let context = getContext<Context2D>('context')
	})
	let child = context.addChild
</script>
