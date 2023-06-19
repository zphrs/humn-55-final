import { writable } from 'svelte/store'
import { defaultContext, type ContextWrapper } from './context'
export type Sides = {
  TOP: 'top'
  BOTTOM: 'bottom'
  LEFT: 'left'
  RIGHT: 'right'
}

type Side = Sides[keyof Sides]
type SideOffset = { [key in Side]?: number }
type Surface<Ctx> = {
  /** sides of the parent surface to align to. If no parent it will align to the top of  */
  alignTo: SideOffset
  /** multiplier of 4 pixels */
  padding: number
  context: ContextWrapper<Ctx>
  /** number of tiles */
  width?: number
  /** number of tiles */
  height?: number
}

export function surfaceToCss(surface: Surface<any>): string {
  let out = `\
--width: ${surface.width};
--height: ${surface.height};
--padding: ${surface.padding};`
  for (const side in surface.alignTo) {
    if (!surface.alignTo.hasOwnProperty(side)) continue
    out += `--${side}: ${surface.alignTo[side as Side]};`
  }
  return out
}

function defaultSurface(): Surface<null> {
  return {
    alignTo: {},
    padding: 1,
    context: defaultContext()
  }
}

export function surfaceStoreFactory() {
  const surface = writable(defaultSurface())
  return {
    subscribe: surface.subscribe,
    /** number of cells on grid */
    setWidth: (width: number) =>
      surface.update((value) => {
        value.width = width
        return value
      }),
    /** number of cells on grid */
    setHeight: (height: number) =>
      surface.update((value) => {
        value.width = height
        return value
      })
  }
}
