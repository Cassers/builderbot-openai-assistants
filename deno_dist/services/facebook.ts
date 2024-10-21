import process from "node:node:process";

import "npm:dotenv@16.4.5/config"
import express from 'npm:express@4.19.2';
import { askIA } from "node:~/bot/openAI";
import { fileLog, lastLogName, lastLogPath } from "node:~/utils/filelog";
import { mainPath } from "node:~/utils/path";
import { formatAIResponse } from "./formatAIResponse.ts";

const app = express();
const port = 3009;
const validToken = process.env.FACEBOOK_VALIDATION_TOKEN


async function responseMessage(pageID, accessToken, userMessage) {
  /*
  curl -X POST -H "Content-Type: application/json" -d '{
    "recipient":{
      "id":"{PSID}"
    },
    "messaging_type": "RESPONSE",
    "message":{
      "text":"Hello, world!"
    }
  }' "https://graph.facebook.com/v20.0/{PAGE-ID}/messages?access_token={PAGE-ACCESS-TOKEN}"
      
  */

  if (userMessage.message.text == undefined || userMessage.message.text == "") {
    return
  }

  const clientID = userMessage.sender.id;
  const userID = userMessage.recipient.id;

  if (clientID == '391605557364637') { // This is the ID of the page
    return
  }

  const responseIA = await askIA(userID, clientID, userMessage.message.text);
  //const responseIA = "Hello, world!";
  console.log(`\u{1F7EA} Response IA: ${responseIA}`);
  fileLog(`\u{1F7EA} Response IA: ${responseIA}`);



  const url = `https://graph.facebook.com/v20.0/me/messages?access_token=${accessToken}`;

  const chunks = responseIA.split(/\n\n+/);

  for (let i = 0; i < chunks.length; i++) {

    const formatChunk = formatAIResponse(chunks[i]);


    const data = {
      "recipient": {
        "id": userMessage.sender.id
      },
      "messaging_type": "RESPONSE",
      "message": {
        "text": formatChunk
      }
    };

    /* Exanple data
    {
      "recipient":{
        "id":"{PSID}"
      },
      "messaging_type": "RESPONSE",
      "message":{
        "text":"Hello, world!"
      }
    }

    */
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    };

    fetch(url, options)
      .then(response => response.json())
      .then(data => {
        console.log(data);
        fileLog(data);
      })
      .catch((error) => {
        console.error('Error:', error);
        fileLog(error);
      });
  }
}


function webhookHandler(req, res) {
  /*

  🟪 Received webhook:
  {
    object: 'page',
    entry: [
      { time: 1721765646608, id: '391605557364637', messaging: [Array] }
    ]
  }
  🟪 Entry:
  {
    time: 1721765646608,
    id: '391605557364637',
    messaging: [
      {
        sender: [Object],
        recipient: [Object],
        timestamp: 1721765645907,
        message: [Object]
      }
    ]
  }
  🟪 WebhookEvent:
  {
    sender: { id: '7980168192028663' },
    recipient: { id: '391605557364637' },
    timestamp: 1721765645907,
    message: {
      mid: 'm_qj5VIfblHfzB0oVFdfmHPjkD7BlyR7NaR31cRF2aH961R_Ts1D-Qgts2Cm5BRsOiGXFggqz6IxPjXok-REShDQ',
      text: 'x8',
      reply_to: {
        mid: 'm_CwPXUSt_e6bxNWHkrMXnGjkD7BlyR7NaR31cRF2aH96jE2tljRzjqDnYqvqmEsYcmoOIk4kzjPvhrrJ50m4l3Q'
      }
    }
  }
  */
  const body = req.body;

  console.log(`\u{1F7EA} Received webhook:`);
  console.dir(body, { depth: null });

  fileLog(`\u{1F7EA} Received webhook:`);
  fileLog(body);

  // Check if this is an event from a page subscription
  if (body.object === "page") {
    // Returns a '200 OK' response to all requests
    res.status(200).send("EVENT_RECEIVED");

    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(async function (entry) {

      console.log(`\u{1F7EA} Entry:`);
      console.log(entry);
      fileLog(`\u{1F7EA} Entry:`);
      fileLog(entry);

      // Iterate over webhook events - there may be multiple
      entry.messaging.forEach(async function (webhookEvent) {
        console.log(`\u{1F7EA} WebhookEvent:`);
        console.log(webhookEvent);
        fileLog(`\u{1F7EA} WebhookEvent:`);
        fileLog(webhookEvent);
      });
    });

    //response to facebook
    responseMessage(
      body.entry[0].id,
      process.env.FACEBOOK_APLICATION_TOKEN,
      body.entry[0].messaging[0]
    );

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
}

export function startBotFacebook() {

  app.use(express.json()); // Middleware para parsear JSON


  app.post('/webhook', (req, res) => {
    webhookHandler(req, res);
  });

  app.get('/webhook', (req, res) => {
    // Verificar que el webhook proviene de Facebook
    if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === validToken) {

      res.status(200).send(req.query['hub.challenge']);
    } else {
      console.error('La verificación falló. La token no coincide.');
      res.sendStatus(403);
    }
  });

  app.get('/downloadLog', (req, res) => {
    const fileName = req.query['fileName']
    const path = !fileName ? `${lastLogPath}` : `${mainPath}/logs/${fileName}`
    res.download(path);
  });

  app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}/webhook`);
  });
}
