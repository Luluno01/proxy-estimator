import { SocksClient, /* SocksClientOptions */ } from 'socks'
import { HTTPConnectOpts, createConnection as hCreateConnection } from './helpers/httpProxy'
import { createConnection, createServer, Socket } from 'net'
import { SocksClientEstablishedEvent } from 'socks/typings/common/constants'
import { ProxyType } from './types'


/**
 * @description RTT time pairs: [ sendTime, ackTime ].
 */
export type Times = [ number, undefined | number ][]

/**
 * @description RTT-related values.
 */
export type RTT = {
  times: Times  // RTT time pairs
  RTT: number[]  // RTT (mapped from `times`)
  SRTT: number[]  // Smoothed RTT
  s2: number  // Mean square deviation
  s: number  // Standard deviation
  delay?: number  // Times of occurred delays when writing token
  err?: any  // Reason of interruption
}

/**
 * @description RTT test tokens.
 */
export const TOKEN = {
  // Length: 150
  short: '48I,6F>b%32"i15q2@?%ie7^tf?gkK|$O4%MO/!4Vo\\6otkKYq+PJ(]%uKX\'Z{Ivp;m}Z2kzD"+xf`Z+Nt:iyq\'Z"56VmTi.OH3O}.z|pLbs|(q$%A`&IF@n/=\'{eY.55R2!6fFjN^t.SSLU\\EcKL$',
  // Length: 500
  medium: '~HQ!O`?B+q8yvoa/0MVO;@3)%VdWG0|(s.bI$:0R=#U%n"`hJc\'z_edp)Y@efCdcL^:^K]U&*,w1(8I%>jZ)u|\\@o{}iWP\\q?\\vLK<]<D~3Y+HNlj-d^WD;f|v]Ysw:ENizHO;VS6995Adm1<L=kQMc&Wo@pej8$zU!%4{ufzF-M$BeV)Ubxc+RCsOR}OC`K7<$X&pb]X@A>)v8_8W<0$zKVo!![,,6Vz6Tq9OlPhCHWs,:oSF4hMoL!cb=_Jv/LjJ;FFuF*h"p^GgT;m#7/R]2/pYx&%;[.%H4wR8{$KpWk%fO]m/{F~Vwp/C?nIlu^utLiIn^/L66!dd*zp{WR#+%#.#=C]8Hk5W4z[[;7[}\'qBg%WCt,r>MN}k!(KAR6"\'Zp9*SZl53Qc?P^k[xVb9zB:SD:jeB:V3[qWSQ@lT4g5\'?:oe$n|}pCS)wS1oyX0o#<R&;D8nalg$8GnR9`"o[[^y%sR)2Oz|j|{N*uDFAb^2E],zbC4',
  // Length: 1200
  long: 'S#e}Igr+V{D[;Y~\\i43\'0Qn5I*Uf6RIzr^2Yo~T@^I~UJxjc9\'j7zYB-=DP~$<UQY-QQbimwm:8YdJl%it%4yaO.Yj:4d+W8!HWr3"Sp)ruhZS8EH3)=Mu\\*X~k!)D_z$+f/#QdQqM;<\'b{t5D\'I~W#kGNM~%8?OyOByp-|_\'\'!K*311s*N#p~`38e;6p60*?/EdI1ga+pj&`@}v"h6@72;L0<UoEa!0cRb!%ajE8`G{W!!J#43;Th"q%x?>A-{1p2:0l3VPUN~0@23=vT4uwy(|VD4GfO-R5#9r>D%h$)T@/[FhJMu!gc\\cvbt[s|tv^!*~Fz=fI[K3{+a~CnMs0&nQ.T5yuJ/{gU~)SZ"VpYlI"K{GC?@j$ScZIu!}GZdE:Q<q@"`+h%`PU\'/"3Uzq<F1vSY&")vWy*K}4}!/)LUfji:c:R.F^s"L2"=,Oc(UQ\\|*wM[(cs;W>8:/@bdahs:P$1MQ9^k6,6}<,qZ!gSv\'=1n}%R~!|&=Q&/Ov~@@|l}Y^Ayid@wcicK\'q<t4K}\'mF&ZK\\KQ")o?@Fx>vQN*G)0z{S!C3=PI)ydCOpD~DJMR$dk;gjw^`m}I]P{4:HstfBc#?-P.Fh<.=0x,EWA1Tt(^dfF7V1#?{^S!gOT;7q2j^=C`PoLtxk?IFfXoWgy4KKa%~YLx*Etas"TrWlB9}~|gIMVlT7r}C!H^9}b^;}7%0|uJOxr4}j^u.W(PyArxkVV3.co1}PfB)`vvxP!PN9iI\\MU4^GP1CyGv+:F61wj2nFEuxk,j{so3\\_x$"4br(r!0g{4sn5f<$XJuH/]$k8WE=$^id22so"IyMuYA`wNspw4IyA?P/;Nv=;*-f859{<BYfES<G:m^ywNz2U]2i11(2QlF{1W|\\HN2GEO^WZvULzg*Z]Ex:6j0{(_`7msLZ-S:dgwn]Fjj1J\'=duWVW1L{x%B`h(a0sj?M(Xf#$()zrw+t%t(z4#(e>o"Et^(|e?K,GoAy%Ndrd"sOLW{IKvG8zRCyV0}Q}jAX?zDK~+><q`[AQaLd]V;[4u#/iO-K3D6y"|=42c"?dH%&d6/3gV20rXRmC.+,:iOIg*U9#cXGZ2y{e_D#Bj=^q5b}c8_m|.fOJg\'Wjp`ac=x5167x\\BD(2HOr<>*!e(kRTV?vYnbD-srUyMK9MP(;DIzpKPR[j}H^H0I"x)j@l>5E#wx{8D/OjgO'
}

/**
 * @description Alpha for smoothed RTT calculation.
 */
export const ALPHA = 0.125  // RFC 2988 recommendation

/**
 * @description Calculate RTT-related values.
 * @param times Raw RTT time pairs.
 */
export function calcRTT(times: Times): RTT {
  let RTT: number[] = []
  let sum: number = 0
  try {
    times.forEach(([from, to]) => {
      const _RTT = to - from
      if(to) {
        RTT.push(_RTT)
        sum += _RTT
      } else throw null  // break
    })
  } catch {}

  const avg = sum / RTT.length
  let s2: number = 0
  let SRTT: number[] = []
  RTT.forEach((_RTT, index) => {
    s2 += (_RTT - avg) * (_RTT - avg)
    if(index == 0) SRTT.push(_RTT)
    else SRTT.push((1 - ALPHA) * SRTT[index - 1] + ALPHA * _RTT)
  })
  s2 /= RTT.length - 1
  return {
    times,
    RTT,
    SRTT,
    s2,
    s: Math.sqrt(s2)
  }
}


/**
 * @description RTT evaluation client.
 * @param opt RTT evaluation option.
 */
export async function RTTEvaluator({
  socket=undefined as Socket,  // A connected socket
  interval=500,  // RTT test interval in milliseconds
  duration=200 * 1000,  // RTT test duration in milliseconds
  token=TOKEN.short  // Token should be used to test RTT
}): Promise<RTT> {
  const tokenLength: number = token.length
  socket.setNoDelay(true)
  let times: [ number, number | undefined ][] = []
  let index: number = 0
  let delay: number = 0

  
  let alive: NodeJS.Timer = setTimeout(() => {
    try {
      socket.end()
    } catch {}
  }, duration + 1000)

  /**
   * @description Send RTT test bytes and record sending time.
   */
  function send(): Promise<RTT> {
    return new Promise(resolve => {
      let int: NodeJS.Timer
      function doSend() {
        let waitTime: number = (times[0] && times[0][1]) ? (times[0][1] - times[0][0] + 500) : interval
        try {
          delay += !socket.write(token) as any as number
        } catch(err) {
          if(times[times.length - 1][1]) waitTime = 0  // No more tokens to wait for
          // Wait for the rest of tokens to arrive
          setTimeout(() => {
            resolve({
              ...calcRTT(times),
              delay,
              err
            })
          }, waitTime)
          // Stop sending remainder tokens
          clearInterval(int)
          int = null
          return
        }
        const now: number = Date.now()
        times.push([ now, undefined ])
        if(times[0] && now - times[0][0] > duration) {
          // Time up, end test
          socket.end()
          clearInterval(int)
          int = null
          // TODO: calculate RTT
          // Wait for the rest of tokens to arrive
          setTimeout(() => {
            resolve({
              ...calcRTT(times),
              delay
            })
          }, waitTime)
        }
      }
      setImmediate(doSend)
      int = setInterval(doSend, interval)
    })
  }

  let recvLength: number = 0
  socket.on('data', ({length}) => {
    recvLength += length
    if(recvLength >= tokenLength) {
      times[index++][1] = Date.now()
      recvLength -= tokenLength
    }
  })

  return await send()
}
export default RTTEvaluator

/**
 * @description Create and start an echo server.
 * @param opt Server option.
 */
export function RTTEchoServer({
  host='0.0.0.0',  // Server host name
  port=12345  // Server port
}) {
  const server = createServer(socket => {
    console.log(`Incoming connection: ${socket.remoteAddress}:${socket.remotePort}`)
    socket.setNoDelay(true)
    socket.pipe(socket)
    socket.on('close', () => console.log(`Connection (${socket.remoteAddress}:${socket.remotePort}) closed`))
  }).listen(port, host, () => {
    let addr = server.address()
    addr = typeof addr == 'string'? addr : `${addr.address}:${addr.port}`
    console.log(`Listening at ${addr}`)
  })
  return server
}

export type TestTarget = {
  name: string  // Target proxy name
  type: ProxyType  // Target proxy type
  host?: string  // Target proxy host, defaults to '127.0.0.1'
  port?: number  // Target proxy port
}
export type TesterOpt = {
  host: string  // Receiver host
  port: number  // Receiver port
  targets: TestTarget[]  // Target proxies
}

/**
 * @description Get a connected socket.
 * @param opt Socket options including proxy and target address as well as proxy type.
 */
async function getSocket(opt: HTTPConnectOpts & { type: ProxyType }): Promise<Socket> {
  switch(opt.type) {
    case ProxyType.SOCKS5: {
      let info: SocksClientEstablishedEvent
      try {
        info = await SocksClient.createConnection({
          command: 'connect',
          destination: {
            host: opt.host || '127.0.0.1',
            port: opt.port
          },
          proxy: {
            ipaddress: opt.proxyHost || '127.0.0.1',
            port: opt.proxyPort,
            type: 5
          }
        })
        return info.socket
      } catch(err) {
        throw err
      }
    }
    case ProxyType.HTTP: {
      return await hCreateConnection(opt)
    }
    default: return await ((): Promise<Socket> => {
      // Direct connection
      return new Promise((resolve, reject) => {
        let socket = createConnection(opt.port, opt.host, () => resolve(socket))
        .on('error', err => reject(err))
        .on('timeout', () => reject('timeout'))
      })
    })()
  }
}

export type TestResult = {
  target: TestTarget,
  RTT: RTT
}[]

export async function tester(opt: TesterOpt): Promise<TestResult> {
  let { host, port } = opt
  let res: TestResult = []
  for(let target of opt.targets) {
    let socket = await getSocket({
      host,
      port,
      proxyHost: target.host,
      proxyPort: target.port,
      type: target.type
    })
    res.push({
      target,
      RTT: await RTTEvaluator({
        socket,
        interval: 500,
        duration: 200 * 1000,
        token: TOKEN.short
      })
    })
  }
  return res
}

/**
 * @description Calculate the distribution function and the cumulative distribution function of given RTT sequence.
 * @param rtt RTT sequence.
 */
export function getDF(rtt: number[]): { DF: number[], CDF: number[], min: number, max: number } {
  let min = rtt[0]
  let max = rtt[0]
  for(let val of rtt) {
    if(val < min) min = val
    else if(val > max) max = val
  }
  const sampleCount = rtt.length
  let DF: number[] = new Array(max - min + 1).fill(0)
  for(let val of rtt) DF[val - min] = (DF[val - min] || 0) + 1
  let currentCumulatedValue: number = 0
  return { DF: DF.map(val => val / sampleCount), CDF: DF.map(val => (currentCumulatedValue += val) / sampleCount), min, max }
}