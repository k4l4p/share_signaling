const e = require('express');
const express = require('express')
const SocketServer = require('ws').Server
const fs = require('fs');

//指定開啟的 port
const PORT = 8000

//創建 express 的物件，並綁定及監聽 3000 port ，且設定開啟後在 console 中提示
const server = express()
   .listen(PORT, () => console.log(`Listening on ${PORT}`))

//將 express 交給 SocketServer 開啟 WebSocket 的服務
const wss = new SocketServer({ server })

//當 WebSocket 從外部連結時執行
wss.on('connection', ws => {

   //連結時執行此 console 提示
   console.log('Client connected')
   fs.readFile(__dirname + "/" + "data.json", 'utf8', function (err, data) {
      let temp = JSON.parse(data);
      ws.send(data)

   })

   ws.on('message', (data)=>{
      let temp = JSON.parse(data)
      console.log(temp.phase)
      switch (temp.phase){
         case 'req_key':
            let key = Math.floor(Math.random() * (899) + 100)
            ws.key = key
            let data = {}
            data[key] = null
            data = JSON.stringify(data)
            fs.writeFile(__dirname + "/" + "data.json", data, (err)=>{
               if (err) {
                  throw err
               }
            })
            break
         case 'start':
            break
         case 'recv':
            break
         case 'close':
            
            break
      }
   })

   //當 WebSocket 的連線關閉時執行
   ws.on('close', () => {
      console.log('Close connected')
   })
})