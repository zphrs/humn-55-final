import { Vec2 } from './vec2'

type Point = Vec2

export class Bounds {
	constructor(public min: Point, public max: Point) {}
	asRect(): Rect {
		return new Rect(this.min.x, this.min.y, this.max.x - this.min.x, this.max.y - this.min.y)
	}
	union(other: Bounds): Bounds {
		return new Bounds(
			new Vec2(Math.min(this.min.x, other.min.x), Math.min(this.min.y, other.min.y)),
			new Vec2(Math.max(this.max.x, other.max.x), Math.max(this.max.y, other.max.y))
		)
	}
}

export type Shape = {
	insideOf(parent: Shape): boolean
	getBounding(): Rect
	getCenter(): Point
	contains(point: Point): boolean
} & Point

export class Rect extends Vec2 implements Shape {
	constructor(public x: number, public y: number, public width: number, public height: number) {
		super(x, y)
	}
	insideOf(parent: Shape): boolean {
		const { min, max } = this.toBounds()
		return parent.contains(min) && parent.contains(max)
	}
	getBounding(): Rect {
		return new Rect(this.x, this.y, this.width, this.height)
	}
	toBounds(): Bounds {
		return new Bounds(new Vec2(this.x, this.y), new Vec2(this.x + this.width, this.y + this.height))
	}
	getCenter(): Point {
		return new Vec2((this.x + this.width) / 2, (this.y + this.height) / 2)
	}
	contains(point: Point): boolean {
		return (
			point.x >= this.x &&
			point.x <= this.x + this.width &&
			point.y >= this.y &&
			point.y <= this.y + this.height
		)
	}
}

export class Circle extends Vec2 implements Shape {
	constructor(public x: number, public y: number, public radius: number) {
		super(x, y)
	}
	insideOf(parent: Shape): boolean {
		if (parent instanceof Circle) {
			if (parent.radius <= this.radius) return false
			const dist = this.distanceTo(parent)
			return dist + this.radius <= parent.radius
		} else if (parent instanceof Rect) {
			const { min, max } = this.getBounding().toBounds()
			return parent.contains(min) && parent.contains(max)
		} else {
			return false
		}
	}
	getBounding(): Rect {
		return {
			x: this.x + this.radius,
			y: this.y + this.radius,
			width: this.radius * 2,
			height: this.radius * 2
		} as Rect
	}
	getCenter(): Point {
		return new Vec2(this.x, this.y)
	}
	contains(point: Point): boolean {
		return this.distanceTo(point) <= this.radius
	}
}
