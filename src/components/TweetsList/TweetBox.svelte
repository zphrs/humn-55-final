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
	<span class="link">
		<a
			href={'https://twitter.com/' + tweet.username + '/status/' + tweet.id}
			target="_blank"
			rel="noopener noreferrer">𝕏</a
		>
	</span>
	<p class="date">
		{tweet.date.toLocaleDateString('default', {
			year: 'numeric',
			month: 'numeric',
			day: 'numeric'
		})}
	</p>
	<p class="text">{@html tweet.rawContent}</p>
	{#if tweet.media}
		{#each tweet.media as media}
			{#if typeof media == 'string'}
				<img src={media} />
			{:else}
				<a class="video" href={media.variants[0]} target="_blank" rel="noopener noreferrer">
					<img src={media.thumbnailUrl} />
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
		position: relative;
	}
	.video > img {
		border-radius: 2rem;
		overflow: hidden;
		position: relative;
	}
	.video {
		position: relative;
	}
	.video::after {
		content: '▶';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 2rem;
		color: white;
	}
	img {
		max-height: 250px;
		width: auto;
		margin: auto;
	}
	.date {
		text-align: right;
	}
	.blacklm {
		background-color: var(--fire-900);
		--color: var(--fire-300);
	}
	.bluelm {
		background-color: var(--violet-900);
		--color: var(--violet-300);
	}
	.metoo {
		background-color: var(--gold-900);
		--color: var(--gold-300);
	}
	.climate {
		background-color: var(--sea-900);
		--color: var(--sea-300);
	}
	.link a {
		color: var(--color);
		text-decoration: none;
		position: absolute;
		top: 0rem;
		left: 0.5rem;
		font-size: 1.4rem;
	}
</style>
