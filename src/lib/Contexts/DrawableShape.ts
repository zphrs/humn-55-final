import type { DrawableObject } from '$lib/Surface/context'
import type { Context2D } from './2d/Context2D'
import type { AnimationInfo, KeyToKeyOrNumber } from './Animate'
type Animated<Animating extends KeyToKeyOrNumber> = {
  animationInfo: AnimationInfo<Animating>
}

export type DrawableShape<Animating extends KeyToKeyOrNumber> = Animated<Animating> &
  DrawableObject<Context2D>
