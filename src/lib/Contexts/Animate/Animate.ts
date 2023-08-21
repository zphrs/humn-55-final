import {
	recursiveCopy,
	type DictTree,
	type OptionalDictTree,
	dictTreeGet,
	dictTreeToGenerator,
	mergeDictTrees,
	dictTreeSet
} from '$lib/Utils/DictTree'
import { clamp, lerpFunc } from '$lib/Utils/vec2'
import type { Interp } from './Interp'

export type Animatable = DictTree<number>

export type PartialAnimatable = OptionalDictTree<number>
export type Bounds = {
	lower?: Animatable
	upper?: Animatable
}
// make sure generic has key
export type AnimationInfo<Animating extends Animatable> = {
	time: number
	timingFunction: Interp
	from: Animating
	to: Animating | null
	bounds?: RecursivePartial<Bounds>
	finalListeners: Set<(final: Animating) => void>
	changeListeners: Listeners<Animatable>
}

type RecursivePartial<T> = {
	[P in keyof T]?: RecursivePartial<T[P]>
}

export type Listeners<T> = OptionalDictTree<Set<(newValue: T) => void>>

function getProgress<Animating extends Animatable>(info: AnimationInfo<Animating>) {
	return clamp(0, info.timingFunction(info.time), 1)
}

export function animationNeedsUpdate<Animating extends Animatable>(info: AnimationInfo<Animating>) {
	return info.to != null && getProgress(info) < 1 - Number.EPSILON
}

function lerpAnimatable<Animating extends Animatable>(
	from: Animating,
	to: Animating,
	progress: number
) {
	const out = {} as Animatable
	for (const key in from) {
		if (typeof from[key] === 'object') {
			out[key] = lerpAnimatable(from[key] as Animatable, to[key] as Animatable, progress)
		} else {
			out[key] = lerpFunc(from[key] as number, to[key] as number, progress)
		}
	}

	return out
}

export function createAnimationInfo<Animating extends Animatable>(
	init: Animating,
	timing: Interp,
	bounds?: Bounds
): AnimationInfo<Animating> {
	let initCpy = recursiveCopy(init) as Animating
	let boundsCpy = bounds ? recursiveCopy<typeof bounds>(bounds) : undefined
	return {
		time: 0,
		timingFunction: timing,
		from: initCpy,
		to: null,
		bounds: boundsCpy,
		finalListeners: new Set(),
		changeListeners: {}
	}
}

export function addChangeListener<Animating extends Animatable>(
	info: AnimationInfo<Animating>,
	key: (string | number | symbol)[],
	listener: (newValue: number) => void
) {
	const keyString = key.join('.')
	if (!(keyString in info.changeListeners)) {
		info.changeListeners[keyString] = new Set()
	}
	let listeners = info.changeListeners[keyString]
	if (!(keyString in info.changeListeners)) {
		info.changeListeners[keyString] = new Set()
		listeners = info.changeListeners[keyString]
	}
}

/**
 * Modifies the bounds of an animation.
 * @param info The animation info to modify.
 * @param bounds The new bounds to set.
 * @returns whether the animation needs to be updated.
 */
export function modifyAnimationBounds<Animating extends Animatable>(
	info: AnimationInfo<Animating>,
	bounds: RecursivePartial<Bounds>
) {
	console.log(info.bounds, bounds)
	info.bounds = info.bounds ? mergeDictTrees(info.bounds, bounds) : recursiveCopy(bounds as Bounds)
	boundAnimation(info)
	console.log(info.bounds.lower)
	return animationNeedsUpdate(info)
}
export async function waitForFinal<Animating extends Animatable>(info: AnimationInfo<Animating>) {
	let resFunc = (value: Animating) => {}
	const out = await new Promise<Animating>((resolve) => {
		resFunc = resolve
		addFinalListener(info, resFunc)
	})
	removeFinalListener(info, resFunc)
	return out
}

function boundAnimation<Animating extends Animatable>(info: AnimationInfo<Animating>) {
	const currentState = getCurrentState(info)
	if (info.bounds) {
		const valuesToClamp = {} as RecursivePartial<Animating>
		let needsToUpdate = false
		for (const { value: currentVal, key } of dictTreeToGenerator<number>(currentState)) {
			const lower =
				info.bounds.lower && (dictTreeGet(info.bounds.lower, ...key) as number | undefined)
			const upper =
				info.bounds.upper && (dictTreeGet(info.bounds.upper, ...key) as number | undefined)
			const newValue = clamp(lower, currentVal, upper)
			if (newValue !== currentVal) {
				dictTreeSet(valuesToClamp, key, newValue)
				needsToUpdate = true
			}
		}
		needsToUpdate && modifyTo(info, valuesToClamp)
	}
}

/**
 *
 * @param info
 * @param dt
 * @returns whether the animation needs to be updated again
 */
export function updateAnimationInfo<Animating extends Animatable>(
	info: AnimationInfo<Animating>,
	dt: number
): boolean {
	info.time += dt
	if (!animationNeedsUpdate(info)) {
		boundAnimation(info)
	}
	const out = animationNeedsUpdate(info)
	if (!out) {
		if (info.to) saveState(info, info.to as Animating)
		info.finalListeners.forEach((listener) => listener(info.from))
	}
	return out
}

export function saveState<Animating extends Animatable>(
	info: AnimationInfo<Animating>,
	state: Animating
) {
	info.from = recursiveCopy(state) as Animating
	info.to = null
	info.time = 0
}

export function getCurrentState<Animating extends Animatable>(info: AnimationInfo<Animating>) {
	if (info.to == null) {
		return info.from
	}
	const progress = getProgress(info)
	return lerpAnimatable(info.from, info.to, progress) as Animating
}

export function newTo<Animating extends Animatable>(info: AnimationInfo<Animating>, to: Animating) {
	// save current state based on current progress and from/to
	const newFrom = getCurrentState(info)
	info.from = newFrom
	info.to = recursiveCopy(to) as Animating
	info.time = 0
}

export function modifyTo<Animating extends Animatable>(
	info: AnimationInfo<Animating>,
	to: RecursivePartial<Animating>
) {
	// save current state based on current progress and from/to
	const newFrom = getCurrentState(info)
	info.from = newFrom
	info.to = mergeDictTrees(info.to ?? info.from, to) as Animating
	info.time = 0
}

export function addFinalListener<Animating extends Animatable>(
	info: AnimationInfo<Animating>,
	listener: (finalValue: Animating) => void
) {
	info.finalListeners.add(listener)
}

export function removeFinalListener<Animating extends Animatable>(
	info: AnimationInfo<Animating>,
	listener: (finalValue: Animating) => void
) {
	info.finalListeners.delete(listener)
}

export function changeInterpFunction<Animating extends Animatable>(
	info: AnimationInfo<Animating>,
	interp: Interp
) {
	const newFrom = getCurrentState(info)
	info.from = newFrom
	info.time = 0
	info.timingFunction = interp
}
