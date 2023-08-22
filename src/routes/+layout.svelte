<script>
	import './css/global.css'
	import './css/reset.css'
</script>

<main>
	<slot />
</main>

<style>
	main {
		padding: 0.5rem;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>
