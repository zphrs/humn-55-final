<script>
	import { browser } from '$app/environment'
	import Surface from '$lib/Surface/Surface.svelte'
	import Vis from '../components/Vis.svelte'
</script>

<main>
	<h1>How Viral Spikes Shape Digital Movements</h1>
	<p>
		Before social media, movements met up in person, disrupted events with protests, and made noise
		in real life. Today, most of that happens online. There are still protests and there are still
		real live meetings and discussions but those are just the tips of the iceberg. The majority of
		the conversations and collaboration toward change occur online today.
	</p>
	<p>
		We created our visualization to explore how different social movements captured the attention of
		social media users, or in other words, to examine their visibility and reach. This is because
		traditional media used to operate as a monopoly on public attention - it could decide not to
		cover a movement for ideological or corporate reasons. Thus movements relied on mass media to
		publicize their cause and events to tell their story. Today, mass media can distort or
		trivialize causes of movements.
	</p>
	<p>
		We wanted to help future movement leaders figure out how to navigate what happens below the
		surface. What they, in large part, don’t get to see. Sure they see their tweets but that is only
		the slice that algorithms want to show them. By displaying a dashboard of people and their
		tweeting behavior, it makes it obvious that these movements are driven by attention-driven
		algorithms. This emphasizes the need for movements to both be prepared for spikes in engagement
		and for the hijacking of movements.
	</p>
	<h2>Visualization (WIP)</h2>
	{#if browser}
		<Vis />
	{:else}
		<Surface width={50} height={30} />
	{/if}
	<h2>How we incorporated Data Feminism</h2>
	<p>By making the visualization interractive, we allow the user to explore the data themselves.</p>
	<p>
		We ideally want to curate certain key moments throughout the visualization to emphasize hoe
		movements shift over time. Unfortunately, we ran out of time to do so by the deadline but we
		still intend to add this to the visualization at some point.
	</p>
</main>

<style>
	main {
		padding: 1rem;
		max-width: 800px;
		margin: 0 auto;
	}
	p {
		margin-top: 1rem;
		line-height: 1.5;
	}
</style>
