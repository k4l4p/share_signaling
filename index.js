const express = require('express')
const SocketServer = require('ws').Server

const PORT = 8000

const server = express()
   .listen(PORT, () => console.log(`Listening on ${PORT}`))

const wss = new SocketServer({ server })

wss.on('connection', ws => {
   console.log('Client connected')
   ws.on('message', (data) => {
      let temp = JSON.parse(data)
      console.log(temp)
      switch (temp.side) {
         case 'start':
            if (temp.action === 'req_key') {
               let key = Math.floor(Math.random() * (899) + 100)
               ws.key = key
               ws.ice = []
               ws.established = false
               ws.send(JSON.stringify({
                  side: 'start',
                  action: 'req_key',
                  key: key
               }))
            }
            if (temp.action === 'send_decr') {
               ws.decr = temp.decr
            }
            if (temp.action === 'send_ice') {
               if (ws.established) {
                  wss.clients.forEach(c => {
                     c.send(JSON.stringify({
                        side: 'recv',
                        action: 'send_ice',
                        ice: temp.ice
                     }))
                  })
               } else {
                  ws.ice.push(temp.ice)
               }
            }
            if (temp.action === 'get_ice') {
               ws.established = true
               wss.clients.forEach(c => {
                  if (c?.matchKey === ws.key) {
                     c.established = true
                     c?.ice.map((e) => {
                        ws.send(JSON.stringify({
                           side: 'start',
                           action: 'send_ice',
                           ice: e
                        }))
                     })
                     ws?.ice.map((e)=>{
                        c.send(JSON.stringify({
                           side: 'recv',
                           action: 'send_ice',
                           ice: e
                        }))
                     })
                  }
               })
            }
            break
         case 'recv':
            // read()
            if (temp.action === 'send_key') {
               ws.matchKey = Number.parseInt(temp.key)
               ws.ice = []
               ws.established = false
               // let temp_decr = globalData[temp.key]?.in
               let temp_decr = null
               wss.clients.forEach(c => {
                  console.log(c?.key, temp.key)
                  if (c?.key === ws.matchKey) {
                     temp_decr = c.decr
                  }
               })
               if (temp_decr) {
                  ws.send(JSON.stringify({
                     side: 'recv',
                     action: 'send_decr',
                     decr: temp_decr
                  }))
               } else {
                  ws.send(JSON.stringify({
                     side: 'recv',
                     action: 'error',
                     content: 'Wrong ID'
                  }))
               }

            }
            if (temp.action === 'send_decr') {
               // save decr to JSON
               // globalData[temp.key].out = temp.decr
               // write()
               ws.decr = temp.decr
               wss.clients.forEach(c => {
                  if (c?.key === Number.parseInt(temp.key)) {
                     // check if ice packet were stored before connecting to recv
                     c?.ice.map((e) => {
                        c.send(JSON.stringify({
                           side: 'recv',
                           action: 'send_ice',
                           ice: e
                        }))
                     })

                     // send recv decr back to start
                     c.send(JSON.stringify({
                        side: 'start',
                        action: 'send_decr',
                        decr: temp.decr
                     }))
                  }
               })
            }
            if (temp.action === 'send_ice') {
               if (ws.established) {
                  wss.clients.forEach(c => {
                     if (c?.key === ws.matchKey) {
                        c.send(JSON.stringify({
                           side: 'start',
                           action: 'send_ice',
                           ice: temp.ice
                        }))
                     }
                  })
               } else {
                  ws.ice.push(temp.ice)
               }
            }
            break
         case 'close':
            // delete globalData[ws.key]
            console.log('delete key')
            break
      }
   })

   ws.on('close', () => {
      console.log('delete key: ', ws.key)
      console.log('Close connected')
   })
})