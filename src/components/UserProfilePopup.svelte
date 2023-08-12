<script lang="ts">
	import { onDestroy } from 'svelte'
	import { getTweetsStore } from '../DotsStore'
	import type { SaturatedUserProfile, TimestampRange, UserProfile } from '../TweetsStore'
	import TweetsList from './TweetsList/TweetsList.svelte'

	export let user: UserProfile
	export let beginningDate: Date
	export let latestTimestamp: Date
	$: range = [beginningDate, latestTimestamp].map((date) => date.getTime() / 1000) as TimestampRange
	export let db: IDBDatabase
	let controller = new AbortController()
	$: saturatedUserStore = getTweetsStore(db, user, range, controller.signal)
	onDestroy(() => controller.abort())
	let newSaturatedUser: SaturatedUserProfile | undefined = $saturatedUserStore
	let showLoading = false
	let loadingTimeout = setTimeout(() => {
		showLoading = true
	}, 500)
	$: {
		if ($saturatedUserStore) {
			newSaturatedUser = $saturatedUserStore
			showLoading = false
			clearTimeout(loadingTimeout)
		} else {
			clearTimeout(loadingTimeout)
			newSaturatedUser = undefined
			loadingTimeout = setTimeout(() => {
				showLoading = true
			}, 500)
		}
	}
	$: console.log($saturatedUserStore)
	$: tweets = $saturatedUserStore ? $saturatedUserStore.tweets : []
</script>

<div class="main">
	{#if newSaturatedUser}
		<h1>
			<a href={'https://twitter.com/' + newSaturatedUser.user}>@{newSaturatedUser.user}</a>
		</h1>
		{#if tweets.length == 0}
			<p class="tweet">
				<a href={'https://twitter.com/' + newSaturatedUser.user}>@{newSaturatedUser.user}</a> hasn't
				tweeted yet. {new Date(user.activeDateRanges[0][0] * 1000).toLocaleDateString('default', {
					month: 'long',
					year: 'numeric',
					day: 'numeric'
				})} is the earliest date available.
			</p>
		{/if}
		<TweetsList bind:tweets />
	{:else}
		<h1>
			<a href={'https://twitter.com/' + user.user}>@{user.user}</a>
		</h1>
		{#if showLoading}
			{#each Array(2) as _}
				<div class="tweet loading mh-100" />
			{/each}
		{/if}
	{/if}
</div>

<style>
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
		top: 5rem;
		right: 1rem;
		z-index: 100;
		background-color: var(--gray-950);
		max-height: 40vh;
		width: min(100%, 400px);
		display: flex;
		padding: 0.5rem;
		flex-direction: column;
	}
	@media screen and (max-width: 500px) {
		.main {
			width: 100%;
			bottom: 5rem;
			right: 0;
			height: auto;
			border: none;
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
