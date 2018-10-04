import { spawn, ChildProcess } from 'child_process'
import { ProxyType } from './types'
import * as targets from './targets.json'
import * as targetAddress from './conf.json'
import { tester, TesterOpt, TestTarget, TestResult } from './RTT'
import logger from './helpers/log'
import { writeFile } from 'fs'
import { promisify } from 'util'


/**
 * @description Sleep for some time.
 * @param time Sleep time in seconds.
 */
async function sleep(time: number): Promise<void> {
  await new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, time * 1000)
  })
}

/**
 * @description Dump `obj` to a file named `file`(.json)
 * @param file Name of JSON file.
 * @param obj Object to dump.
 */
async function dump(file: string, obj: object) {
  if(!file.endsWith('.json')) file += '.json'
  await promisify(writeFile)(file, JSON.stringify(obj))
}


/**
 * @description Test driver.
 * @param rounds The number of rounds of tests.
 */
export async function main(rounds?: number) {
  let res = []
  let tcpdump: ChildProcess
  const { host, port } = targetAddress
  logger.info(`Test target address: ${host}:${port}`)
  rounds = rounds || parseInt(process.env.ROUNDS) || parseInt(process.argv[1]) || 10
  for(let i = 0; i < rounds; i++) {
    logger.info(`Starting test round ${i + 1}`)
    for(let target of targets) {
      let testName = `${target.name}_${i.toString().padStart(2, '0')}`
      logger.sublog = testName
      logger.info(`Starting test: ${testName}`)
      .info('Starting tcpdump')
      tcpdump = spawn('tcpdump', [ '-w', `${testName}.pcap` ])
      tcpdump.stdout.on('data', data => logger.info(`[tcpdump] ${data}`))
      tcpdump.stderr.on('data', data => logger.info(`[tcpdump] ${data}`))
      setTimeout(() => logger.info('Run tester in 10 seconds'), 100)
      await sleep(10)  // Wait for a while
      // Start test
      logger.info('Tester running')
      try {
        res.push({
          ...(await tester({
            targets: [{
              ...target,
              type: ProxyType[target.type]
            }],
            host,
            port
          }))[0],
          testName
        })
      } catch(err) {
        logger.error(`An error has occurred: ${err instanceof Error ? err.stack : err}`)
      }
      // Wait for a while
      logger.info('Stopping tcpdump in 10 seconds')
      await sleep(10)
      spawn('pkill', [ 'tcpdump' ])
      logger.info(`Test ${testName} done`)
      .info(`Start next test in 5 seconds`)
      await sleep(5)
    }
    logger.sublog = null
    logger.info(`Test round ${i + 1} done`)
  }
  dump('result.json', res)
  logger.info('All tests done')
}

export default main