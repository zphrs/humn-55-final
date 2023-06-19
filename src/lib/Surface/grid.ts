export type Grid = {
  cellWidth: number | null
  cellHeight: number | null
  gap: number | null
}

export let gridToCSSVariables = (grid: Grid): string => {
  let { cellWidth, cellHeight, gap } = grid
  return `
            --cell-width: ${cellWidth ? cellWidth * 16 + 'px' : 'auto'};
            --cell-height: ${cellHeight ? cellHeight * 16 + 'px' : 'auto'};
            --gap: ${gap ? gap * 16 + 'px' : '0px'};
        `
}

export let gridCSSTemplate = (): string => {
  return `
            grid-template-columns: repeat(auto-fill, minmax(var(--cell-width), 1fr));
            grid-template-rows: repeat(auto-fill, minmax(var(--cell-height), 1fr));
            gap: var(--gap);
        `
}
