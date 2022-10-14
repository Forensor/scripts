const fs = require('fs')
const path = require('path')
const minimist = require('./helpers/minimist')

const CONFIG = minimist(process.argv.slice(2))


const dateDiff = (now, then) => Number((now - then) / (1000 * 60 * 60 * 24))

const getDirChildFiles = (dir) => {
  let dirElems = []
  try {
    dirElems = fs.readdirSync(dir)
  } catch (error) {
    if (CONFIG.e)
      console.error(
        `\x1b[31mCould not read '${dir}' directory. ${error}\x1b[0m`
      )
  }
  dirElems.forEach((e) => {
    const filePath = path.resolve(dir, e)
    let fileLstats
    try {
      fileLstats = fs.lstatSync(filePath)
    } catch (error) {
      if (CONFIG.e)
        console.error(
          `\x1b[31mCould not lstat '${dir}' directory. ${error}\x1b[0m`
        )
      return
    }
    if (fileLstats.isDirectory()) {
      getDirChildFiles(filePath)
    } else {
      const fileSize = fileLstats.size
      const fileLastTimeUsed = fileLstats.atime
      let msg = filePath

      if (mb(fileSize) < 100) {
        msg += ` | \x1b[32m${humanSize(fileSize)}\x1b[0m`
      }
      if (mb(fileSize) >= 100 && gb(fileSize) < 1) {
        msg += ` | \x1b[33m${humanSize(fileSize)}\x1b[0m`
      }
      if (gb(fileSize) > 1) {
        msg += ` | \x1b[31m${humanSize(fileSize)}\x1b[0m`
      }

      if (dateDiff(new Date(), fileLastTimeUsed) < 30) {
        msg += ` | \x1b[32m${fileLastTimeUsed.toUTCString()}\x1b[0m`
      }
      if (
        dateDiff(new Date(), fileLastTimeUsed) >= 30 &&
        dateDiff(new Date(), fileLastTimeUsed) < 6 * 30
      ) {
        msg += ` | \x1b[33m${fileLastTimeUsed.toUTCString()}\x1b[0m`
      }
      if (dateDiff(new Date(), fileLastTimeUsed) > 6 * 30) {
        msg += ` | \x1b[31m${fileLastTimeUsed.toUTCString()}\x1b[0m`
      }

      if (
        [
          mb(fileSize) >= 100,
          dateDiff(new Date(), fileLastTimeUsed) > 6 * 30 && mb(fileSize) >= 5,
        ].some((p) => p === true)
      )
        console.log(msg)
    }
  })
}

const humanSize = (b) =>
  Math.floor(gb(b)) >= 1 ? `${gb(b).toFixed(2)} GB` : `${mb(b).toFixed(2)} MB`
const gb = (b) => b / 1024 ** 3
const mb = (b) => b / 1024 ** 2

console.log('-= thrash-finder =-')

if (process.argv.slice(2).length === 0 || CONFIG.help) {
    console.log('Usage:\n')
    console.log('  thrash-finder \x1b[34m[options]\x1b[0m \x1b[33m<path>\x1b[0m\n')
    console.log('-'.repeat(67) + '\n')
    console.log('  Params:\n')
    console.log('    \x1b[33m<path>\x1b[0m The path to do the search. Use "." to search in current.\n')
    console.log('  Options:\n')
    console.log('    \x1b[34m-e\x1b[0m         Prompts errors when passed.')
    console.log('    \x1b[34m-h, --help\x1b[0m Prompts this message.')
} else {
    const PATH = path.resolve(__dirname, CONFIG['_'][0])
    console.log(`Looking for thrash in`, `\x1b[33m${PATH}\x1b[0m...`)
    getDirChildFiles(PATH)
}
