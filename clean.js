import { existsSync, rmSync } from 'node:fs'

const target = process.argv[2]

if (!target) {
	console.error('Please provide a target directory to clean.')
	process.exit(1)
}

if (target && existsSync(target)) {
	rmSync(target, { recursive: true, force: true })
}
