/** @description broadcasts events 
 - pdown - with detail of PointerEvent + {e.relativeX, e.relativeY} 
 - pup - with detail of PointerEvent + {e.relativeX, e.relativeY}
 - pmove - with detail of PointerEvent + {e.relativeX, e.relativeY} 
 - ppinch - with detail of PointerEvent + {e.relativeX, e.relativeY}
 - ppinchdown - with detail of PointerEvent + {e.relativeX, e.relativeY}
 - ppan - with detail of PointerEvent + {e.relativeX, e.relativeY}
 - ptap - with detail of PointerEvent + {e.relativeX, e.relativeY}
 - pholdup - with detail of PointerEvent + {e.relativeX, e.relativeY}
 on the input elem */

import type { createEventDispatcher } from 'svelte'

export type HasScaleAmount = {
	scaleAmount: number
}

export type HasRelativePos = {
	relativeX: number
	relativeY: number
}

export type HasClientPos = {
	clientX: number
	clientY: number
}

export type HasDownAt = {
	downAt: number
	downX: number
	downY: number
}

export type PEvent = PointerEvent & HasRelativePos & HasDownAt

export type PanEvent = PEvent & {
	fromPointer: boolean
}

export type WEvent = WheelEvent & HasRelativePos

export type ZoomEvent = HasScaleAmount & HasRelativePos

export type PPinchEvent = HasScaleAmount & {
	points: [PEvent, PEvent]
}

export type PointersDict = { [id: number]: PointerEvent & HasRelativePos }

export type Events = {
	ppanstart: PEvent
	ppinchdown: PPinchEvent
	ppinchup: PPinchEvent
	pholdup: PEvent
	ppanup: PEvent
	ppinch: PPinchEvent
	zoom: ZoomEvent
	pmove: PointerEvent & HasRelativePos
	pout: PointerEvent & HasRelativePos
	penter: PointerEvent & HasRelativePos
	ppan: PanEvent
	ptap: PEvent
}

export default function addMoreEvents(
	elem: HTMLElement,
	dispatch: ReturnType<typeof createEventDispatcher<Events>>
) {
	let unsubscribers = [] as (() => void)[]
	let isDown = false,
		pointersDown: { [id: number]: PEvent } = {},
		pointersDownCt = 0,
		scaleAmount = 1,
		distAtDown: number | null = null,
		twoFingerPointer: PanEvent | null = null

	function addRelativePos<Type>(event: HasClientPos & Type) {
		// check if elem is display: contents
		// if so, getBoundingClientRect() will return null
		// therefore get child's bounding box
		let boundingElem: Element | null = elem
		if (getComputedStyle(elem).display == 'contents') {
			// get parent
			boundingElem = elem.children[0]
		}
		if (!boundingElem) {
			boundingElem = elem.parentElement
		}
		if (!boundingElem) {
			boundingElem = document.body
		}

		const rect = boundingElem.getBoundingClientRect()

		const out = event as HasClientPos & HasRelativePos & Type
		out.relativeX = event.clientX - rect.left
		out.relativeY = event.clientY - rect.top
		return out
	}

	function addDownAt(event: HasClientPos & HasRelativePos) {
		const out = event as HasClientPos & HasRelativePos & HasDownAt
		out.downAt = performance.now()
		out.downX = event.relativeX
		out.downY = event.relativeY
		return out
	}
	function onPointerDown(e: PointerEvent) {
		isDown = true
		const eWithRelative = addRelativePos(e)
		const pEvent = addDownAt(eWithRelative) as PEvent
		pointersDown[e.pointerId] = {
			...pEvent
		}

		if (pointersDownCt == 0) {
			dispatch('ppanstart', pEvent)
		}

		if (pointersDownCt == 1) {
			const keys = Object.keys(pointersDown).map((key) => parseInt(key))

			keys.forEach((key) => {
				addDownAt(pointersDown[key])
			})
			const p1 = pointersDown[keys[0]]
			const p2 = pointersDown[keys[1]]
			distAtDown = Math.sqrt(
				Math.pow(p1.relativeX - p2.relativeX, 2) + Math.pow(p1.relativeY - p2.relativeY, 2)
			)

			dispatch('ppinchdown', {
				points: [p1, p2],
				scaleAmount
			})

			const duplicate = { ...p2 }
			duplicate.relativeX = (p1.relativeX + p2.relativeX) / 2
			duplicate.relativeY = (p1.relativeY + p2.relativeY) / 2
			twoFingerPointer = addDownAt(duplicate) as PanEvent
			twoFingerPointer.fromPointer = false
			dispatch('ppanstart', twoFingerPointer)
		}
		pointersDownCt++
	}
	elem.addEventListener('pointerdown', onPointerDown)
	unsubscribers.push(() => elem.removeEventListener('pointerdown', onPointerDown))
	let onUp = (e: PointerEvent) => {
		const keys = Object.keys(pointersDown).map((key) => parseInt(key))
		if (pointersDownCt == 2) {
			dispatch('ppinchup', {
				points: [pointersDown[keys[0]], pointersDown[keys[1]]],
				scaleAmount
			})
			if (twoFingerPointer) {
				dispatch('ppanup', twoFingerPointer)
				twoFingerPointer = null
			}
		} else if (pointersDownCt == 1) {
			const smallDist = Math.sqrt(
				Math.pow(pointersDown[keys[0]].relativeX - pointersDown[keys[0]].downX, 2) +
					Math.pow(pointersDown[keys[0]].relativeY - pointersDown[keys[0]].downY, 2)
			)
			if (smallDist < 10) {
				if (performance.now() - pointersDown[keys[0]].downAt < 500) {
					dispatch('ptap', pointersDown[keys[0]])
				}
				// else broadcast pholdup
				else {
					dispatch('pholdup', pointersDown[keys[0]])
				}
			} else {
				dispatch('ppanup', pointersDown[keys[0]])
			}
		}
		delete pointersDown[e.pointerId]
		pointersDownCt--
		if (pointersDownCt <= 0) {
			isDown = false
			pointersDownCt = 0
		}
	}
	let onOut = (e: PointerEvent) => {
		dispatch('pout', addRelativePos(e))
	}
	let onEnter = (e: PointerEvent) => {
		dispatch('penter', addRelativePos(e))
	}
	elem.addEventListener('pointerup', onUp)
	elem.addEventListener('pointercancel', onUp)
	elem.addEventListener('pointerleave', onUp)
	elem.addEventListener('pointerenter', onEnter)
	elem.addEventListener('pointerout', (e) => {
		onUp(e), onOut(e)
	})
	const onUpUnsub = () => {
		const events: (
			| 'pointerup'
			| 'pointercancel'
			| 'pointerleave'
			| 'pointerenter'
			| 'pointerout'
		)[] = ['pointerup', 'pointercancel', 'pointerleave', 'pointerenter', 'pointerout']
		events.forEach((event) => {
			elem.removeEventListener(event, onUp)
		})
	}
	unsubscribers.push(onUpUnsub)

	function onPointerMove(e: PointerEvent) {
		const event = addRelativePos<PointerEvent>(e)
		if (pointersDownCt == 0) {
			dispatch('pmove', event)
		}
		let pointerDict = pointersDown[e.pointerId]
		if (!pointerDict) return
		pointerDict.relativeX = event.relativeX
		pointerDict.relativeY = event.relativeY
		if (isDown) {
			if (pointersDownCt == 2) {
				if (!distAtDown) {
					return
				}
				const keys = Object.keys(pointersDown).map((key) => parseInt(key))
				const p1 = pointersDown[keys[0]],
					p2 = pointersDown[keys[1]]
				const dist = Math.sqrt(
					Math.pow(p1.relativeX - p2.relativeX, 2) + Math.pow(p1.relativeY - p2.relativeY, 2)
				)
				dispatch('ppinch', {
					points: [p1, p2],
					scaleAmount: dist / distAtDown
				})
				if (twoFingerPointer) {
					twoFingerPointer.relativeX = (p1.relativeX + p2.relativeX) / 2
					twoFingerPointer.relativeY = (p1.relativeY + p2.relativeY) / 2
					dispatch('ppan', twoFingerPointer)
				}
				dispatch('zoom', {
					scaleAmount: dist / distAtDown,
					relativeX: (p1.relativeX + p2.relativeX) / 2,
					relativeY: (p1.relativeY + p2.relativeY) / 2
				})
				distAtDown = dist
			} else if (pointersDownCt == 1) {
				dispatch('ppan', {
					...pointerDict,
					fromPointer: true
				})
			}
		}
	}
	elem.addEventListener('pointermove', onPointerMove)
	unsubscribers.push(() => elem.removeEventListener('pointermove', onPointerMove))
	function onWheel(e: WheelEvent) {
		e.preventDefault()
		if (e.ctrlKey) {
			let event = e as WEvent

			addRelativePos(event)
			dispatch('zoom', {
				scaleAmount: e.deltaY > 0 ? (1 - e.deltaY * 0.01) / 1 : 1 / (1 + 0.01 * e.deltaY),
				relativeX: event.relativeX,
				relativeY: event.relativeY
			})
		} else {
			const pointerEvent = new PointerEvent('pointerdown', {
				clientX: e.clientX,
				clientY: e.clientY
			})
			const relativeEvent = addRelativePos(pointerEvent) as PEvent
			relativeEvent.downX = relativeEvent.relativeX
			relativeEvent.downY = relativeEvent.relativeY
			relativeEvent.downAt = performance.now()
			dispatch('ppanstart', relativeEvent)

			const pointerEvent2 = new PointerEvent('pointermove', {
				clientX: e.clientX + e.deltaX,
				clientY: e.clientY + e.deltaY
			}) as PointerEvent
			const relativeEvent2 = addRelativePos(pointerEvent2) as PEvent
			relativeEvent2.downX = relativeEvent.downX
			relativeEvent2.downY = relativeEvent.downY
			const secondEvent = relativeEvent2 as PanEvent
			secondEvent.fromPointer = false
			dispatch('ppan', secondEvent)
		}
	}
	elem.addEventListener('wheel', onWheel, {
		passive: false
	})
	unsubscribers.push(() => elem.removeEventListener('wheel', onWheel))

	return {
		destroy() {
			unsubscribers.forEach((unsub) => unsub())
		}
	}
}
