import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const srcDir = resolve(__dirname, 'themes')
const destDir = resolve(__dirname, 'app', 'themes')

if (!existsSync(srcDir)) {
	console.error(`Source directory (${srcDir}) doesn't exist.`)
	process.exit(1)
}

mkdirSync(destDir, { recursive: true })

for (const file of readdirSync(srcDir)) {
	const src = join(srcDir, file)
	const dest = join(destDir, file)

	if (lstatSync(src).isFile()) {
		copyFileSync(src, dest)
	}
}
