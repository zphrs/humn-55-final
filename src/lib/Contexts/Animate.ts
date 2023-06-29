import { clamp, lerpFunc } from '$lib/Utils/vec2'
import type { Interp } from './Interp'

export type KeyToKeyOrNumber = { [key: string]: number | KeyToKeyOrNumber }
// make sure generic has key
export type AnimationInfo<Animating extends KeyToKeyOrNumber> = {
	time: number
	timingFunction: Interp
	from: Animating
	to: Animating | null
}

function recursiveCopy<Animating extends KeyToKeyOrNumber>(obj: Animating) {
	const cpy: KeyToKeyOrNumber = {} as Animating
	for (const key in obj) {
		if (typeof obj[key] === 'object') {
			cpy[key] = recursiveCopy(obj[key] as KeyToKeyOrNumber)
		} else {
			cpy[key] = obj[key]
		}
	}
	return cpy as Animating
}

type RecursivePartial<T> = {
	[P in keyof T]?: RecursivePartial<T[P]>
}

function recursiveCopyWithPartial<Animating extends KeyToKeyOrNumber>(
	obj: Animating,
	partial: RecursivePartial<Animating>
): Animating {
	const cpy: KeyToKeyOrNumber = {} as Animating
	for (const key in obj) {
		const partialKey = partial[key]
		let cpyVal: Animating | number
		if (typeof obj[key] === 'object') {
			if (partialKey != undefined) {
				cpyVal = recursiveCopyWithPartial(obj[key] as KeyToKeyOrNumber, partialKey) as Animating
			} else {
				cpyVal = recursiveCopy(obj[key] as KeyToKeyOrNumber) as Animating
			}
		} else {
			cpyVal = (partial[key] != undefined ? partial[key] : obj[key]) as number
		}
		cpy[key] = cpyVal
	}
	return cpy as Animating
}

function getProgress<Animating extends KeyToKeyOrNumber>(info: AnimationInfo<Animating>) {
	return clamp(0, info.timingFunction(info.time), 1)
}

export function animationNeedsUpdate<Animating extends KeyToKeyOrNumber>(
	info: AnimationInfo<Animating>
) {
	return getProgress(info) < 0.999 && info.to != null
}

function lerpKeyToKeyOrNumber(from: KeyToKeyOrNumber, to: KeyToKeyOrNumber, progress: number) {
	const out = {} as KeyToKeyOrNumber
	// use recursion
	for (const key in from) {
		if (typeof from[key] === 'object') {
			out[key] = lerpKeyToKeyOrNumber(
				from[key] as KeyToKeyOrNumber,
				to[key] as KeyToKeyOrNumber,
				progress
			)
		} else {
			out[key] = lerpFunc(from[key] as number, to[key] as number, progress)
		}
	}
	return out
}

export function createAnimationInfo<Animating extends KeyToKeyOrNumber>(
	init: Animating,
	timing: Interp
): AnimationInfo<Animating> {
	// create a shallow copy of init
	let cpy = recursiveCopy(init)
	return {
		time: 0,
		timingFunction: timing,
		from: cpy,
		to: null
	}
}
/**
 *
 * @param info
 * @param dt
 * @returns whether the animation needs to be updated again
 */
export function updateAnimationInfo<Animating extends KeyToKeyOrNumber>(
	info: AnimationInfo<Animating>,
	dt: number
): boolean {
	info.time += dt
	return animationNeedsUpdate(info)
}

export function saveState<Animating extends KeyToKeyOrNumber>(
	info: AnimationInfo<Animating>,
	state: Animating
) {
	info.from = recursiveCopy(state) as Animating
	info.to = null
	info.time = 0
}

export function getCurrentState<Animating extends KeyToKeyOrNumber>(
	info: AnimationInfo<Animating>
) {
	if (info.to == null) {
		return info.from
	}
	const progress = getProgress(info)
	return lerpKeyToKeyOrNumber(info.from, info.to, progress) as Animating
}

export function newTo<Animating extends KeyToKeyOrNumber>(
	info: AnimationInfo<Animating>,
	to: Animating
) {
	// save current state based on current progress and from/to
	const newFrom = getCurrentState(info)
	info.from = newFrom
	info.to = recursiveCopy(to)
	info.time = 0
}

export function modifyTo<Animating extends KeyToKeyOrNumber>(
	info: AnimationInfo<Animating>,
	to: RecursivePartial<Animating>
) {
	// save current state based on current progress and from/to
	const newFrom = getCurrentState(info)
	info.from = newFrom
	info.to = recursiveCopyWithPartial(info.to ?? info.from, to)
	info.time = 0
}

export function changeInterpFunction<Animating extends KeyToKeyOrNumber>(
	info: AnimationInfo<Animating>,
	interp: Interp
) {
	const newFrom = getCurrentState(info)
	info.from = newFrom
	info.time = 0
	info.timingFunction = interp
}
