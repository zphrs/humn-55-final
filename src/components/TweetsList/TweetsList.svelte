<script lang="ts">
	import type { Tweet } from '../../TweetsStore'
	import TweetBox from './TweetBox.svelte'

	export let tweets: Tweet[]
	console.log(tweets)
	const tweetsReversed = tweets.slice().reverse()
</script>

<div class="tweets">
	{#each tweetsReversed as tweet}
		<TweetBox {tweet} />
	{/each}
</div>

<style>
	.tweets {
		overflow: auto;
	}
</style>
