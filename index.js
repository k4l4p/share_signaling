const e = require('express');
const express = require('express')
const SocketServer = require('ws').Server
const fs = require('fs');

const PORT = 8000

const server = express()
   .listen(PORT, () => console.log(`Listening on ${PORT}`))

const wss = new SocketServer({ server })

let globalData = {}

const read = () => {
   let temp = fs.readFileSync(__dirname + "/" + "data.json", { encoding: 'utf8' })
   globalData = JSON.parse(temp)
   // fs.readFile(__dirname + "/" + "data.json", 'utf8', function (err, data) {
   //    globalData = JSON.parse(data)
   // })
}

const write = () => {
   let data = JSON.stringify(globalData)
   fs.writeFileSync(__dirname + "/" + "data.json", data)
   // fs.writeFile(__dirname + "/" + "data.json", data, (err)=>{
   //    if (err) {
   //       throw err
   //    }
   // })
}

wss.on('connection', ws => {
   console.log('Client connected')
   ws.on('message', (data) => {
      let temp = JSON.parse(data)
      // console.log(temp)
      switch (temp.side) {
         case 'start':
            if (temp.action === 'req_key') {
               let key = Math.floor(Math.random() * (899) + 100)
               ws.key = key
               read()
               globalData[key] = {
                  in: null,
                  out: null
               }
               write()
               ws.send(JSON.stringify({ 
                  side: 'start',
                  action: 'req_key',
                  key: key
               }))
               console.log('key: ' + key)
            }
            if (temp.action === 'send_decr') {
               read()
               globalData[ws.key].in = temp.decr
               write()
            }
            if (temp.action === 'send_ice') {
               wss.clients.forEach(c => {
                  if (c?.matchKey === ws.key) {
                     c.send(JSON.stringify({
                        side: 'recv',
                        action: 'send_ice',
                        ice: temp.ice
                     }))
                  }
               })
            }
            break
         case 'recv':
            read()
            if (temp.action === 'send_key'){
               ws.matchKey = Number.parseInt(temp.key)
               let temp_decr = globalData[temp.key]?.in
               if (temp_decr){
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
            if (temp.action === 'send_decr'){
               // save decr to JSON
               globalData[temp.key].out = temp.decr
               write()
               // send recv decr back to start
               wss.clients.forEach(c => {
                  console.log(c.key, temp.key)
                  if (c?.key === Number.parseInt(temp.key)) {
                     c.send(JSON.stringify({
                        side: 'start',
                        action: 'send_decr',
                        decr: temp.decr
                     }))
                  }
               })
            }
            if (temp.action === 'send_ice') {
               wss.clients.forEach(c => {
                  if (c?.key === ws.matchKey) {
                     c.send(JSON.stringify({
                        side: 'start',
                        action: 'send_ice',
                        ice: temp.ice
                     }))
                  }
               })
            }

            break
         case 'close':
            delete globalData[ws.key]
            console.log('delete key')
            break
      }
   })

   ws.on('close', () => {
      read()
      delete globalData[ws.key]
      write()
      console.log('delete key: ', ws.key)
      console.log('Close connected')
   })
})