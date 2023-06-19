export type Sides = {
  TOP: 'top'
  BOTTOM: 'bottom'
  LEFT: 'left'
  RIGHT: 'right'
}

export type Side = Sides[keyof Sides]
export const SIDES = ['top', 'bottom', 'left', 'right']
export type SideOffset = { [key in Side]?: number }

export const defaultSideOffset = () => {
  let sideOffset: SideOffset = {
    top: undefined,
    bottom: undefined,
    left: undefined,
    right: undefined
  }
  return sideOffset
}
