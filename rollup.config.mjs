import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import { obfuscator } from 'rollup-obfuscator';


export default {
    input: process.env['ENTRYPOINT'],
    output: {
        file: 'dist/index.js',
        format: 'cjs',
    },
    plugins: [
        typescript({ composite: false }),
        commonjs({
            ignoreGlobal: false,
        }),
        json(),
        obfuscator(),
    ]
};
