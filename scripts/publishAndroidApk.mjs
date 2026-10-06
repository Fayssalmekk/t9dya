import { access, copyFile, mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { log } from 'node:console'
import process from 'node:process'

const projectRoot = process.cwd()
const candidates = [
  process.env.ANDROID_APK_PATH,
  'android/app/build/outputs/apk/release/app-release.apk',
  'android/app/release/app-release.apk',
  'android/app/build/outputs/apk/debug/app-debug.apk'
].filter(Boolean)

let sourcePath = null
for (const candidate of candidates) {
  const absolutePath = path.resolve(projectRoot, candidate)
  try {
    await access(absolutePath)
    sourcePath = absolutePath
    break
  } catch {
    // Continue until an existing, installable APK is found.
  }
}

if (!sourcePath) {
  throw new Error('Aucun APK trouvé. Générez d’abord un APK Android avec Android Studio ou Gradle.')
}

const outputDirectory = path.resolve(projectRoot, 'public/downloads')
const outputPath = path.join(outputDirectory, 'notre-espace.apk')
await mkdir(outputDirectory, { recursive: true })
await copyFile(sourcePath, outputPath)

const file = await stat(outputPath)
const sizeInMb = (file.size / 1024 / 1024).toFixed(1)
log(`APK publié pour le Web : ${path.relative(projectRoot, sourcePath)} -> public/downloads/notre-espace.apk (${sizeInMb} Mo)`)
