//import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { defineConfig } from 'vite'
const mode = 'play';
const defaultSceneOrPrefab = "./assets/scenes/main.yaml";
const url = `/index.html?mode=${mode}&prefab=${encodeURIComponent(
    defaultSceneOrPrefab
)}`;
export default defineConfig({
    server: {
        open: url
    },
    plugins: [
        viteStaticCopy({
            targets: [
                {
                    src: 'assets',
                    dest: '.'
                }
            ]
        })
    ],
    build: {
        minify: false,
        outDir: './game-release/dist'
    }
})