import * as _winston from 'winston'
import { createLogger, format } from 'winston'


export const winston = _winston

let form = format.combine(
  format.timestamp(),
  format.printf(info => `[${info.timestamp}] [${info.level}] ${info.message}`)
)

let conf = {
  level: 'info',
  format: form,
  transports: [
    new winston.transports.File({
      filename: 'tester.log.json',
      format: format.json()
    }),
    new winston.transports.File({
      filename: 'tester.log'
    }),
    new winston.transports.Console({
      handleExceptions: true,
      format: format.combine(format.colorize(), form)
    })
  ]
}
export const logger = createLogger(conf)

let sublog: string | null = null
let subconf = Object.assign({}, conf)
const subconfTransportIndex = conf.transports.length
// Reconfigure to avoid no transport bug
// let sublogTransport: [_winston.transports.FileTransportInstance, _winston.transports.FileTransportInstance] | null = null
Object.defineProperty(logger, 'sublog', {
  get: () => sublog,
  set: (newPath: string | null) => {
    // Reconfigure to avoid no transport bug
    // if(sublogTransport) {
    //   logger.remove(sublogTransport[0])
    //   logger.remove(sublogTransport[1])
    // }
    // sublogTransport = [ undefined, undefined ]
    if(newPath) {
      // Reconfigure to avoid no transport bug
      // logger.add(sublogTransport[0] = new winston.transports.File({
      //   filename: newPath + '.log.json',
      //   format: format.json()
      // }))
      // logger.add(sublogTransport[1] = new winston.transports.File({
      //   filename: newPath + '.log'
      // }))
      subconf.transports[subconfTransportIndex] = new winston.transports.File({
        filename: newPath + '.log.json',
        format: format.json()
      })
      subconf.transports[subconfTransportIndex + 1] = new winston.transports.File({
        filename: newPath + '.log'
      })
      logger.configure(subconf)
    } else {
      logger.configure(conf)  // Should be equivalent to remove `sublogTransport`
    }
  },
  enumerable: true,
  configurable: true
})

export default logger as typeof logger & { sublog: string }