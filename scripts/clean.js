const { rename, readdirSync, existsSync, mkdirSync } = require('fs')
const { join } = require('path')

let now = new Date()
let name = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_`
let num = 0
while(existsSync(`${name}${num.toString().padStart(2, '0')}`)) num++
name = `${name}${num.toString().padStart(2, '0')}`
let maked = false
for(let file of readdirSync('.')) {
  if(file.endsWith('.log') || file.endsWith('.log.json') || file.endsWith('.pcap') || file == 'result.json') {
    if(!maked) {
      mkdirSync(name)
      maked = true
    }
    console.log(`Move ${file} to ${name}`)
    rename(file, join(name, file), () => {})
  }
}