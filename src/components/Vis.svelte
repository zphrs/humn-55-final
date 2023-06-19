<script lang="ts">
	import PannableCanvas from '$lib/PannableCanvas'
	import type { ContextWrapper } from '$lib/Surface/context'
	import type { Context2D } from '$lib/Contexts/2d/Context2D'
	import Surface from '$lib/Surface/Surface.svelte'
	let context: ContextWrapper<Context2D> | undefined = undefined
	const init = () => {
		if (!context) throw new Error('Context is null after init')
		let dot = context.ctx.addDot(0, 0, 10)
	}
</script>

<Surface width={50} height={10} {context} on:initialized={init}>
	<PannableCanvas bind:context on:initialized={init} />
</Surface>
```
