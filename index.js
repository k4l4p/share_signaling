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
   ws.on('message', (data)=>{
      let temp = JSON.parse(data)
      switch (temp.phase){
         case 'req_key':
            let key = Math.floor(Math.random() * (899) + 100)
            ws.key = key
            read()
            globalData[key] = {
               in: null,
               out: null
            }
            write()
            ws.send(JSON.stringify({phase: 'req_key',key: key}))
            console.log('key: '+key)
            break
         case 'start':
            read()
            globalData[ws.key].in = temp.ice
            write()
            break
         case 'recv':
            read()
            if (temp?.ice) {
               globalData[temp.key].out = temp.ice
               wss.clients.forEach(c => {
                  console.log(c.key, temp.key)
                  if (c?.key === Number.parseInt(temp.key)){
                     console.log('hi')
                     c.send(JSON.stringify({
                        phase: 'start',
                        ice: temp.ice
                     }))
                  }
               })


            }else {
               let temp_ice = globalData[temp.key].in
               ws.send(JSON.stringify({
                  phase: 'recv',
                  ice: temp_ice
               }))   
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