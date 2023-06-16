export type UpdatableAndDrawable<Context> = {
	/**
	 * @returns {boolean} whether or not to update next frame
	 */
	update(dt: number): boolean
	/**
	 * Called after any update is called
	 * @param ctx the context to draw to
	 */
	draw(ctx: Context): void
}

export type DrawableObject<Context> = UpdatableAndDrawable<Context> & {
	needsUpdate: boolean
	deleteWhenDoneUpdating?: boolean
}

type CleanUp = () => void

export type ContextWrapper<Context> = UpdatableAndDrawable<Context> & {
	ctx: Context
	objects: { [zIndex: number]: Set<DrawableObject<Context>> }
	init(parent: HTMLDivElement): CleanUp | void
	addRestartListener(listener: () => void): void
	removeRestartListener(listener: () => void): void
}

function defaultContext(): ContextWrapper<null> {
	return {
		ctx: null,
		init: () => {},
		draw: (_ctx) => {},
		objects: {},
		update(dt) {
			return false
		},
		addRestartListener: () => {},
		removeRestartListener: () => {}
	}
}

export const NO_CONTEXT: ContextWrapper<null> = defaultContext()

/**
 *
 * @param objects Objects to update and draw
 * @param keysInObjects
 * @param zIndex
 * @param obj
 * @returns {boolean} whether or not the object needs to be updated
 */
export function addObjectWithZIndex<
	Context,
	Objects extends { [zIndex: number]: Set<DrawableObject<Context>> }
>(objects: Objects, keysInObjects: number[], zIndex: number, obj: DrawableObject<Context>) {
	if (!(zIndex in objects)) {
		objects[zIndex] = new Set([obj])
		keysInObjects.push(zIndex)
		keysInObjects.sort() // might be better to do insertion sort?
	} else {
		objects[zIndex].add(obj)
	}
	return obj.needsUpdate
}
