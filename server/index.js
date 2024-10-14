import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { Readable, Transform } from 'node:stream';
import { WritableStream, TransformStream } from 'node:stream/web';
import { setTimeout } from 'node:timers/promises';
import csvtojson from "csvtojson"

createServer(async (req, res) => {
  const headers = {
    "Access-Control-Allow-Origin": '*',
    "Access-Control-Allow-Methods": '*',
  }

  if (req.method === "OPTIONS") {
    // "curl -i -X OPTIONS localhost:3000"
    res.writeHead(204, headers)
    res.end()
    return
  }

  let items = 0
  req.once('close', _ => console.log("close", items))
  Readable.toWeb(createReadStream('./animeflv.csv'))
    .pipeThrough(Transform.toWeb(csvtojson()))
    .pipeThrough(new TransformStream({
      transform(chunk, controller) {
        const data = JSON.parse(Buffer.from(chunk))
        controller.enqueue(JSON.stringify({
          title: data.title,
          description: data.description,
          url_anime: data.url_anime
        }).concat('\n'))
      }
    }))
    .pipeTo(new WritableStream({
      async write(chunk) {
        await setTimeout(300)
        items++
        res.write(chunk)
      },
      close() {
        res.end()
      }
    }))

  res.writeHead(200, headers)
})
  .listen(3000)
  .on("listening", _ => console.log("server is running"))