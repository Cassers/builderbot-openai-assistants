import typescript from 'rollup-plugin-typescript2'

export default {
    input: 'src/index.ts',
    output: {
        file: 'public/index.js',
        format: 'esm',
    },
    plugins: [
      typescript({
        tsconfigOverride: {
          compilerOptions: {
            allowImportingTsExtensions: true
          }
        }
      })
    ]
}
