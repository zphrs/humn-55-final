import { writable } from 'svelte/store'
import { readable } from 'svelte/store'
import { browser } from '$app/environment'
const mobileThreshold = 600

const gridUnit = writable(0)

export function getGridUnit() {
	return gridUnit
}

export function setGridUnit(value: number) {
	gridUnit.set(value)
}

export const isMobile = readable(false, function start(set) {
	if (browser) {
		function update() {
			set(window.innerWidth <= mobileThreshold)
		}
		update()
		window.addEventListener('resize', update)
		return function stop() {
			window.removeEventListener('resize', update)
		}
	}
})
