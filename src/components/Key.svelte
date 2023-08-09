<div>
	<span class="blm">Black Lives Matter</span>
	<span class="bluelm">Blue Lives Matter</span>
	<span class="climate">Climate</span>
	<span class="meToo">Me Too</span>
</div>

<style>
	div {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		justify-content: space-around;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.25rem;
		padding: 0.25rem 0.25rem;
		background-color: var(--gray-900);
	}
	@media screen and (max-width: 800px) {
		div {
			grid-template-columns: 1fr 1fr;
			grid-template-rows: 1fr 1fr;
		}
	}
	div > span {
		padding: 0.125rem 0.5rem;
		border-radius: 0.5rem;
		text-align: center;
	}
	.blm {
		background-color: var(--fire-900);
	}
	.bluelm {
		background-color: var(--violet-900);
	}
	.climate {
		background-color: var(--sea-900);
	}
	.meToo {
		background-color: var(--gold-900);
	}
</style>
