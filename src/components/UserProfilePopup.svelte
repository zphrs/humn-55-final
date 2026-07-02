<script lang="ts">
	import { createEventDispatcher, onDestroy } from 'svelte'
	import { getTweetsStore } from '../DotsStore'
	import type { SaturatedUserProfile, TimestampRange, UserProfile } from '../TweetsStore'
	import TweetsList from './TweetsList/TweetsList.svelte'

	export let user: UserProfile
	export let beginningDate: Date
	export let latestTimestamp: Date
	$: range = [beginningDate, latestTimestamp].map((date) => date.getTime() / 1000) as TimestampRange
	export let db: IDBDatabase
	let controller = new AbortController()
	let saturatedUserStore = getTweetsStore(
		db,
		user,
		[beginningDate, latestTimestamp].map((date) => date.getTime() / 1000) as TimestampRange,
		controller.signal
	)
	$: {
		controller.abort()
		controller = new AbortController()
		saturatedUserStore = getTweetsStore(db, user, range, controller.signal)
	}
	onDestroy(() => controller.abort())
	let newSaturatedUser: SaturatedUserProfile | undefined = $saturatedUserStore
	let showLoading = false
	let showUpdating = false
	let loadingTimeout = setTimeout(() => {
		showLoading = true
	}, 500)
	let updatingTimeout: number | undefined = undefined
	function onRangeChange(_range: any) {
		if (updatingTimeout === undefined) {
			updatingTimeout = setTimeout(() => {
				showUpdating = true
			}, 50)
		}
	}
	$: onRangeChange(range)
	function onUserChange(_user: any) {
		showUpdating = false
		clearTimeout(updatingTimeout)
		updatingTimeout = undefined
		clearTimeout(loadingTimeout)
		loadingTimeout = setTimeout(() => {
			newSaturatedUser = undefined
			showLoading = true
		}, 500)
	}
	$: onUserChange(user)
	$: {
		if ($saturatedUserStore) {
			newSaturatedUser = $saturatedUserStore
			showLoading = false
			showUpdating = false
			clearTimeout(loadingTimeout)
			clearTimeout(updatingTimeout)
			updatingTimeout = undefined
			tweets = newSaturatedUser.tweets
		}
	}
	$: console.log($saturatedUserStore)
	let tweets = newSaturatedUser ? newSaturatedUser.tweets : []
	const dispatch = createEventDispatcher<{
		close: void
	}>()
</script>

<svelte:document
	on:keydown={(e) => {
		console.log(e)
		if (e.key === 'Escape') {
			dispatch('close')
		}
	}}
/>

<div class="main">
	{#if showUpdating}
		<div
			style="position: absolute; top: 0; left: 0; width: 100%; height: 0.25rem"
			class="loading"
		/>
	{/if}
	<button class="x" on:click={() => dispatch('close')}>Close <kbd>esc</kbd></button>
	{#if newSaturatedUser}
		<h1 class:updating={showUpdating}>
			<a href={'https://twitter.com/' + newSaturatedUser.user}>@{newSaturatedUser.user}</a>
		</h1>
		{#if tweets.length == 0}
			<p class="tweet">
				<a
					href={'https://twitter.com/' + newSaturatedUser.user}
					target="_blank"
					rel="noopener noreferrer">@{newSaturatedUser.user}</a
				>
				hasn't tweeted about one of the topics listed above yet. Try going past {new Date(
					user.activeDateRanges[0][0] * 1000
				).toLocaleDateString('default', {
					month: 'long',
					year: 'numeric',
					day: 'numeric'
				})} to see some of their tweets.
			</p>
		{:else}
			<TweetsList updating={showUpdating} {tweets} />
		{/if}
	{:else}
		<h1 class:updating={showUpdating}>
			<a href={'https://twitter.com/' + user.user} target="_blank" rel="noopener noreferrer"
				>@{user.user}</a
			>
		</h1>
		{#if showLoading}
			{#each Array(2) as _, i}
				<div class="tweet loading mh-100" class:updating={showUpdating} />
			{/each}
		{/if}
	{/if}
</div>

<style>
	kbd {
		background-color: var(--gray-900);
		border-radius: 0.25rem;
		border-top: 1px solid var(--gray-400);
		border-left: 1px solid var(--gray-400);
		border-right: 2px solid var(--gray-600);
		border-bottom: 2px solid var(--gray-600);
	}
	h1 {
		max-width: calc(100% - 3.75rem);
	}
	.x {
		position: absolute;
		top: 0.75rem;
		right: 0.5rem;
		background-color: var(--gray-950);
		border: 1px solid var(--gray-100);
		border-radius: 1rem;
		cursor: pointer;
		padding: 0.125rem 0.5rem;
		color: inherit;
		font: inherit;
	}
	.updating {
		filter: grayscale(1);
	}
	.x:hover {
		background-color: var(--gray-900);
	}
	.x:active {
		background-color: var(--gray-800);
	}
	.loading {
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
	}
	@keyframes gradient {
		0% {
			background-position: 0% 0%;
		}
		100% {
			background-position: 70% 70%;
		}
	}
	.main {
		position: absolute;
		border: 2px solid var(--gray-100);
		top: 3rem;
		right: 1rem;
		z-index: 100;
		background-color: var(--gray-950);
		max-height: min(22rem, 80vh - 7.5rem);
		width: min(100%, 400px);
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
	}
	@media screen and (max-width: 500px) {
		.main {
			width: 100%;
			bottom: 6rem;
			right: 0;
			border-left: none;
			border-right: none;
		}
	}
	.tweet {
		margin-bottom: 0.5rem;
		background-color: var(--gray-900);
		padding: 0.5rem;
		border-radius: 0.5rem;
		display: block;
		width: 100%;
	}
	.mh-100 {
		min-height: 100px;
	}
</style>
