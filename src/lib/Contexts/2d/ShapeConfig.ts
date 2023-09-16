import type { Interp } from '../Animate/Interp'

export type CompleteShapeConfig = {
  interp: Interp
  color: string
  zIndex: number
}

export type ShapeConfig = Partial<CompleteShapeConfig>
