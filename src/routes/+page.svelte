<script>
	import { browser } from '$app/environment'
	import Surface from '$lib/Surface/Surface.svelte'
	import Vis from '../components/Vis.svelte'
</script>

<h1>How Viral Spikes Shape Digital Movements</h1>
<h2>Visualization</h2>
{#if browser}
	<Vis />
{:else}
	<Surface width={50} height={30} />
{/if}
<p>
	Each user is a gray dot. Scroll around to see all of the users. Click near a user in order to view
	that user's tweets up to the current timeline date. Drag through the timeline to explore different
	months of user activity. A user will light up with colored circles and turn black if they have
	tweeted that month, color coded to coorespond with the colors listed below. A light gray user
	indicates that the user hasn't tweeted within the month.
</p>
<p>
	Some key months to examine are November 2014 (Black Lives Matter), July 2016 (Blue Lives Matter),
	September-October 2017 (Me Too), and May-June 2020 (Black Lives Matter). Climate generally appears
	throughout the timeline but one subtle spike of activity is in November 2021. Note how quickly
	people move on to the next issue, and stop paying attention to the previous issue.
</p>
<h2>Analysis</h2>
<p>
	Before social media, movements met up in person, disrupted events with protests, and made noise in
	real life. Today, most of that happens online. There are still protests and there are still real
	live meetings and discussions but those are just the tips of the iceberg. Today, the majority of
	the conversations and collaboration toward change occur online.
</p>
<p>
	We created our visualization to explore how different social movements captured the attention of
	social media users, or in other words, to examine their visibility and reach. This is because
	traditional media used to operate as a monopoly on public attention - it could decide not to cover
	a movement for ideological or corporate reasons. Thus movements used to rely on mass media to
	publicize their cause and events to tell their story. Since today’s movements are largely online,
	there is less of a reliance on mass media to tell this story. Instead, movements rely on social
	media to tell their story which means that it is important for modern-day social movements to
	understand how and why movements go viral so that they can take advantage of 'the algorithm' to
	get their message out.
</p>
<p>
	We wanted to help future movement leaders figure out how to navigate what happens below the
	surface. What they, in large part, don’t get to see. Sure they see some tweets but that is only
	the slice that algorithms want to show them. The above visualizaiton displays a random sample of
	around 12k twitter users randomly picked from the total list of tweets about about Black Lives
	Matter and the Me Too movement. Movement leaders can watch as movements thrive and wilt and how
	individual users become engaged and subsequently become disengaged with the movement. The cyclical
	pulsing of these movements makes it obvious that these movements are driven by attention-driven
	algorithms. This emphasizes the need for movements to both be prepared for spikes in engagement
	and for the hijacking of movements (such as how Blue Lives Matter hijacked Black Lives Matter in
	2016).
</p>
<p>
	As shown above, digital movements appear to experience spikes of activity followed by periods of
	relative quiet. Movements should prepare for these viral spikes and also be sure to encourage
	off-platform engagement with the movement during those spikes so that passionate supporters can
	continue to support the movement even when the algorithm moves onto the next viral topic.
</p>

<style>
	p {
		max-width: 800px;
		margin: 0.5rem 0;
		line-height: 1.5;
		padding: 0 1rem;
	}
	h2 {
		width: 100%;
		margin: 0.5rem 0;
		max-width: 800px;
		padding: 0 0.5rem;
	}
	h1 {
		width: 100%;
		max-width: 800px;
	}
</style>
