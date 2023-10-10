import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import { obfuscator } from 'rollup-obfuscator';
import nodeResolve from "@rollup/plugin-node-resolve";

export default {
    external: id => {
        // bundle only @redstone-finance modules
        // rest import from node_modules
        if (id.includes('node_modules') && !id.includes('@redstone-finance')) {
            return true;
        }
        return false;
    },
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
        nodeResolve(),
        json(),
        obfuscator(),
    ]
};
