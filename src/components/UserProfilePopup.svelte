<script lang="ts">
	import { onDestroy } from 'svelte'
	import { getTweetsStore } from '../DotsStore'
	import type { TimestampRange, UserProfile } from '../TweetsStore'
	import TweetsList from './TweetsList/TweetsList.svelte'

	export let user: UserProfile
	export let beginningDate: Date
	export let latestTimestamp: Date
	$: range = [beginningDate, latestTimestamp].map((date) => date.getTime() / 1000) as TimestampRange
	export let db: IDBDatabase
	let controller = new AbortController()
	$: saturatedUserStore = getTweetsStore(db, user, range, controller.signal)
	onDestroy(() => controller.abort())
	$: console.log($saturatedUserStore)
	$: tweets = $saturatedUserStore ? $saturatedUserStore.tweets : []
</script>

<div class="main">
	{#if $saturatedUserStore}
		<h1>
			<a href={'https://twitter.com/' + $saturatedUserStore.user}>@{$saturatedUserStore.user}</a>
		</h1>
		<TweetsList bind:tweets />
	{/if}
</div>

<style>
	.main {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		z-index: 100;
		border: 2px solid var(--gray-100);
		border-radius: 0.5rem;
		background-color: var(--gray-950);
		max-height: 40vh;
		max-width: min(100%, 500px);
		overflow: auto;
	}
</style>
