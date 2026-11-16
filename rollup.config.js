import typescript from 'rollup-plugin-typescript2'

export default {
    input: 'src/app.ts',
    output: {
        file: 'dist/app.js',
        format: 'esm',
    },
    onwarn: (warning) => {
        if (warning.code === 'UNRESOLVED_IMPORT') return
    },
    // Explicit globs avoid the legacy plugin's empty extglob alternative.
    plugins: [typescript({ include: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'] })],
}
