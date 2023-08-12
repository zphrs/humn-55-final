<script lang="ts">
	import type { Tweet } from '../../TweetsStore'
	import TweetBox from './TweetBox.svelte'

	export let tweets: Tweet[]
	export let updating = false
	console.log(tweets)
	$: tweetsReversed = tweets.slice().reverse()
</script>

<div class="tweets" class:updating>
	{#each tweetsReversed as tweet (tweet.id)}
		<TweetBox {tweet} />
	{/each}
</div>

<style>
	.tweets {
		overflow: auto;
	}
	.updating {
		filter: grayscale(1);
	}
</style>
