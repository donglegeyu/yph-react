interface DivisionRegion {
  code: string
  name: string
  children?: DivisionRegion[]
}

declare module 'china-division/dist/pca-code.json' {
  const data: DivisionRegion[]
  export default data
}
