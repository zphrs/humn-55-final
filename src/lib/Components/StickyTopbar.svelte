<script lang="ts">
  import { browser } from '$app/environment'
  import Surface from '$lib/Surface/Surface.svelte'
  import { isMobile } from '$lib/stores'
  import type { SvelteComponent } from 'svelte'
  import { onMount } from 'svelte'
  let nav: HTMLDivElement
  let transformY = 0
  let prevY = 0
  $: if ($isMobile) transformY = 0

  $: nav && whenNavReady(nav)
  $: navSize = nav && nav.clientHeight

  // listen to resize events on nav
  onMount(() => {
    if (!browser) return
    const unsubReisize = whenNavReady(nav)
    const unsubScroll = setupScrollListener()
    return () => {
      unsubReisize()
      unsubScroll()
    }
  })

  let whenNavReady = (nav: HTMLElement) => {
    let timeout: NodeJS.Timeout | null = null
    const listener = () => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => {
        navSize = nav.clientHeight
      }, 50)
    }
    addEventListener('resize', listener)

    return () => window.removeEventListener('resize', listener)
  }

  function setupScrollListener() {
    prevY = window.scrollY
    const listener = () => {
      if ($isMobile) {
        transformY = 0
        return
      }
      const change = window.scrollY - prevY
      prevY = window.scrollY
      if (change > 0) {
        // scrolling down
        if (transformY > -navSize) {
          transformY -= change
          if (transformY < -navSize) transformY = -navSize
        }
      } else {
        // scrolling up
        if (transformY < 0) {
          transformY -= change
          if (transformY > 0) transformY = 0
        }
      }
    }
    window.addEventListener('scroll', listener)
    return () => window.removeEventListener('scroll', listener)
  }
  $: if (nav) {
    nav.style.transform = `translateY(${transformY}px)`
  }

  // before unmounting, remove the event listeners
</script>

<Surface fixed {...$$props} bind:elem={nav} alignTo={{ top: 0, left: 0, right: 0 }}>
  <slot />
</Surface>
<div style={`height: ${navSize}px`} />

<style>
</style>
