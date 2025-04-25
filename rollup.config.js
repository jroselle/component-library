import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { string } from 'rollup-plugin-string';

export default [
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      string({ include: ['**/*.html', '**/*.css'] })
    ],
  },
  {
    input: 'src/hello-world/hello-world.ts',
    output: {
      file: 'dist/hello-world.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      string({ include: ['**/*.html', '**/*.css'] })
    ],
  },
  {
    input: 'src/donut-chart/donut-chart.ts',
    output: {
      file: 'dist/donut-chart.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      string({ include: ['**/*.html', '**/*.css'] })
    ],
  },
  {
    input: 'src/timeline-chart/timeline-chart.ts',
    output: {
      file: 'dist/timeline-chart.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      string({ include: ['**/*.html', '**/*.css'] })
    ],
  },
];
