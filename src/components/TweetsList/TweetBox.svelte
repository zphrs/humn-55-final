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
			month: 'short',
			day: 'numeric'
		})}
	</p>
	<p class="text">{tweet.rawContent}</p>
</div>

<style>
	.tweet {
		margin: 0.5rem;
		padding: 0.5rem;
		border-radius: 0.5rem;
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
