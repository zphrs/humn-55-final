<script lang="ts">
	import type { Tweet } from '../../TweetsStore'

	export let tweet: Tweet
</script>

<div
	class="tweet"
	class:blacklm={tweet.containsBlackLivesMatter}
	class:bluelm={tweet.containsBlueLivesMatter}
	class:metoo={tweet.containsMeToo}
	class:climate={tweet.containsClimate}
>
	<p class="date">
		{tweet.date.toLocaleDateString('default', {
			year: 'numeric',
			month: 'numeric',
			day: 'numeric'
		})}
	</p>
	<p class="text">{tweet.rawContent}</p>
	{#if tweet.media}
		{#each tweet.media as media}
			{#if typeof media == 'string'}
				<img src={media} />
			{:else}
				<img src={media.thumbnailUrl} />
				<a href={media.variants[0]} target="_blank" rel="noopener noreferrer">
					{media.variants[0]}
				</a>
			{/if}
		{/each}
	{/if}
</div>

<style>
	.tweet {
		margin-bottom: 0.5rem;
		padding: 0.5rem;
		border-radius: 0.5rem;
	}
	img {
		max-height: 40vh;
		width: auto;
		margin: auto;
	}
	.date {
		text-align: right;
	}
	.blacklm {
		background-color: var(--fire-900);
	}
	.bluelm {
		background-color: var(--violet-900);
	}
	.metoo {
		background-color: var(--gold-900);
	}
	.climate {
		background-color: var(--sea-900);
	}
</style>
