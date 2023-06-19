<script>
	import Vis from '../components/Vis.svelte'
</script>

<main>
	<h1>How to lead a social movement in the digital age:</h1>
	<p>
		So, you want to start a social movement. You've got the passion, you've got the motivation, and
		you've got a team. But how do you get your message out there? How do you get people to listen?
		How do you get people to care?
	</p>
	<p>
		Social media platforms such as Twitter, Instagram, and TikTok are run by recommendation
		algorithms. These algorithms actively strive to keep users on the app for as long as it possibly
		can. They do this by running experiments millions of times every second on billions of users
		worldwide. The algorithm then learns what content keeps people - especially people similar to
		you - on the platform for longer, watching more ads. Then it shows you that content which got
		others to stay on their app for longer. Don't believe me? Look at this visualization of Twitter:
	</p>
	<Vis />
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
