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
		real live meetings and discussions but those are just the tips of the iceberg. Today, the
		majority of the conversations and collaboration toward change occur online.
	</p>
	<p>
		We created our visualization to explore how different social movements captured the attention of
		social media users, or in other words, to examine their visibility and reach. This is because
		traditional media used to operate as a monopoly on public attention - it could decide not to
		cover a movement for ideological or corporate reasons. Thus movements used to rely on mass media
		to publicize their cause and events to tell their story. Since today’s movements are largely
		online, there is less of a reliance on mass media to tell this story. Instead, movements rely on
		social media to tell their story which means that it is important for modern-day social
		movements to understand how and why movements go viral so that they can take advantage of 'the
		algorithm' to get their message out.
	</p>
	<p>
		We wanted to help future movement leaders figure out how to navigate what happens below the
		surface. What they, in large part, don’t get to see. Sure they see their tweets but that is only
		the slice that algorithms want to show them. By displaying a random sample of around 12k twitter
		users and their tweeting behavior, especially users picked from the total list of users who
		tweeted about Black Lives Matter and/or the Me Too movement, it makes it obvious that these
		movements are driven by attention-driven algorithms. This emphasizes the need for movements to
		both be prepared for spikes in engagement and for the hijacking of movements.
	</p>
	<p>
		Some key months to examine are November 2014 (Black Lives Matter), July 2016 (Blue Lives
		Matter), September-October 2017 (Me Too), and May-June 2020 (Black Lives Matter). Climate
		generally appears throughout the timeline but one subtle spike of activity is in November 2021.
		Note how quickly people move on to the next issue, and stop paying attention to the previous
		issue.
	</p>
	<h2>Visualization (WIP)</h2>
	{#if browser}
		<Vis />
	{:else}
		<Surface width={50} height={30} />
	{/if}
	<p>
		As shown above, digital movements appear to experience spikes of activity followed by periods of
		near-silence. Movements should prepare for these viral spikes and also be sure to encourage
		off-platform engagement with the movement during those spikes so that passionate supporters
		continue to support the movement even when the algorithm moves onto the next viral topic.
	</p>
</main>

<style>
	main {
		padding: 1rem;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	p {
		max-width: 800px;
		margin-top: 1rem;
		line-height: 1.5;
	}
</style>
