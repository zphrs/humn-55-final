import type { DrawableObject } from '$lib/Surface/context'
import type { Context2D } from './2d/Context2D'
import type { AnimationInfo, RecursiveAnimatable } from './Animate/Animatable'
type Animated<Animating extends RecursiveAnimatable<unknown>> = {
	animationInfo: AnimationInfo<Animating>
}

export type DrawableShape<Animating extends RecursiveAnimatable<unknown>> = Animated<Animating> &
	DrawableObject<Context2D>
