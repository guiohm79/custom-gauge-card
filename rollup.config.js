import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/custom-gauge-card.js',
    format: 'iife',
    name: 'CustomGaugeCard',
    sourcemap: false,
  },
  plugins: [
    resolve(),
    postcss({
      inject: false,
      extract: false,
      minimize: true,
      modules: false,
    }),
    terser({
      format: {
        comments: false,
      },
      compress: {
        drop_console: false,
        passes: 2,
      },
      mangle: {
        properties: false,
      },
    }),
  ],
};
