<script lang="ts">
  import { getContext } from 'svelte'
  import type { Grid } from './grid'

  export let cellWidth: number | null = null
  export let cellHeight: number | null = null
  export let gap: number | null = null
  let setGridParams = getContext<(grid: Grid) => void>('setGridParams')
  if (setGridParams) {
    setGridParams({ cellWidth, cellHeight, gap })
  } else {
    console.warn('Surface grid requires a parent Surface component')
  }
</script>
