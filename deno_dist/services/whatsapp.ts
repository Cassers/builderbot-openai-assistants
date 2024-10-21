import process from "node:node:process";
const __dirname = (() => {
    const { url: urlStr } = import.meta;
    const url = new URL(urlStr);
    const __filename = (url.protocol === "file:" ? url.pathname : urlStr)
        .replace(/[/][^/]*$/, '');

    const isWindows = (() => {

        let NATIVE_OS: typeof Deno.build.os = "linux";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const navigator = (globalThis as any).navigator;
        if (globalThis.Deno != null) {
            NATIVE_OS = Deno.build.os;
        } else if (navigator?.appVersion?.includes?.("Win") ?? false) {
            NATIVE_OS = "windows";
        }

        return NATIVE_OS == "windows";

    })();

    return isWindows ?
        __filename.split("/").join("\\").substring(1) :
        __filename;
})();

const __filename = (() => {
    const { url: urlStr } = import.meta;
    const url = new URL(urlStr);
    const __filename = (url.protocol === "file:" ? url.pathname : urlStr);

    const isWindows = (() => {

        let NATIVE_OS: typeof Deno.build.os = "linux";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const navigator = (globalThis as any).navigator;
        if (globalThis.Deno != null) {
            NATIVE_OS = Deno.build.os;
        } else if (navigator?.appVersion?.includes?.("Win") ?? false) {
            NATIVE_OS = "windows";
        }

        return NATIVE_OS == "windows";

    })();

    return isWindows ?
        __filename.split("/").join("\\").substring(1) :
        __filename;
})();

import "npm:dotenv@16.4.5/config"

import { createBot, createProvider, createFlow, addKeyword, EVENTS } from 'npm:@builderbot/bot@1.1.7'
import { MemoryDB as Database } from 'npm:@builderbot/bot@1.1.7'
import { BaileysProvider as Provider } from 'npm:@builderbot/provider-baileys@1.1.7'
import { toAsk, httpInject } from "npm:@builderbot-plugins/openai-assistants@0.0.2"
import { typing } from "../utils/presence.ts"
//import { pipeline, WhisperProcessor, WhisperForConditionalGeneration } from '@xenova/transformers';
import { dirname } from "node:path"
import { fileURLToPath } from "node:url";
import { MorfisImagePathList } from "../ImagePathList.ts";
import { speechToText } from "../audioToText/audioToText.ts"
import { formatAIResponse } from "./formatAIResponse.ts"


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env?.PORT ?? 3007
const ASSISTANT_ID = process.env?.ASSISTANT_ID ?? ''
const IA_ACTIVE = process.env?.IA_ACTIVE ?? 'false'
const isIAActive = IA_ACTIVE === 'true'

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
  .addAction(async (ctx, { flowDynamic, state, provider }) => {
    try {
      console.log("Welcome Flow")
      console.log(ctx)
      //console.log(state)
      //console.log(provider)
      console.log(ctx.message)
      console.log(ctx.message?.extendedTextMessage)
      console.log(ctx.message?.extendedTextMessage?.contextInfo)
      /*console.log(ctx.message?.extendedTextMessage?.contextInfo?.quotedMessage)
      console.log(ctx.message?.extendedTextMessage?.contextInfo?.quotedMessage?.productMessage)
      console.log(ctx.message?.extendedTextMessage?.contextInfo?.quotedMessage?.productMessage?.product?.title)
      */

      await typing(ctx, provider)
      await responseText(ctx.body, state, flowDynamic, getQuoted(ctx))
    } catch (error) {
      console.error(error)
    }
  })



async function responseText(text: string, state: any, flowDynamic: any, quotedMessage: string | null = null) {
  //console.log("Response Text Start")
  const response = await responseFromAI(text, state, quotedMessage)
  if (response == "") {
    await flowDynamic([{ body: "Ahora mismo no puedo responder" }])
    return
  }
  //console.log("Response From AI")
  const chunks = response.split(/\n\n+/);
  for (const chunk of chunks) {
    await showResponseFlowDynamic(chunk, flowDynamic);
  }
}

async function showResponseFlowDynamic(chunk, flowDynamic) {
  //Original chunk: Antonella - Tallas 27 al 33, Precio: $4,400, Color: Negro ![Antonella](attachment:3-Antonella)
  //Format chunk:  Antonella - Tallas 27 al 33, Precio: $4,400, Color: Negro
  const formatChunk = formatAIResponse(chunk)
  //get Images

  // reformat from ![Antonella](attachment:3-Antonella) to [image:3-Antonella]
  // reformat from ![Alaska Azul](https://res.cloudinary.com/dubmc8beu/image/upload/v1727352658/Clock%20Footwear/lkqcvgncfq8jidbmurvt.jpg) to [image:https://res.cloudinary.com/dubmc8beu/image/upload/v1727352658/Clock%20Footwear/lkqcvgncfq8jidbmurvt.jpg]
  let imagesChunk = chunk
  imagesChunk = imagesChunk.replaceAll(/!\[.*?]\(attachment:(.*?)\)/g, '[image:$1]');
  imagesChunk = imagesChunk.replaceAll(/!\[.*?]\(image:(.*?)\)/g, '[image:$1]');
  imagesChunk = imagesChunk.replaceAll(/!\[.*?\]\((.*?)\)/g, '[image:$1]')

  const images1 = imagesChunk.match(/\[image:(.*?)\]/g)

  const images = [...(images1 || [])].filter(Boolean)



  console.log('Original')
  console.log(chunk)
  console.log('Format')
  console.log(formatChunk)
  console.log('Images')
  console.log(images)
  // if number of images is 0 then show text
  if (images == null || images.length === 0 || images.length > 1) {
    await flowDynamic([{ body: formatChunk.trim() }]);
  }

  if (images == null || images.length === 0) {
    return
  }

  // if number of images is 1 then show only a flow Dynamic    
  if (images.length === 1) {
    console.log("Print one image")
    const formatImage = images[0].replaceAll('[image:', '').replaceAll(']', '')
      //remove ()[]
      .replaceAll(/\[.*?\]/g, '')
    let pathImage = ''
    if (formatImage.startsWith('http')) {
      pathImage = formatImage
    } else {
      MorfisImagePathList[formatImage]
    }


    console.log('Path Image: ' + pathImage)
    await flowDynamic(
      [{
        body: formatChunk.trim(),
        media: pathImage
      }]);
  }

  // if number of images is more then show first a flow Dynamic with text and imagen and then show a flow Dynamic for each image
  if (images.length > 1) {
    console.log("Print multiple images")
    for (const image of images) {
      const formatImage = image.replaceAll('[image:', '').replaceAll(']', '')
    let pathImage = ''
      if (formatImage.startsWith('http')) {
        pathImage = formatImage
        if (pathImage == 'https://link_de_la_imagen') {
          continue
        }
      } else {
        MorfisImagePathList[formatImage]
      }
      console.log('Path Image: ' + pathImage)
      await flowDynamic(
        [{
          body: '.',
          media: pathImage
        }]);
    }
  }

}

async function responseFromAI(text, state, quotedMessage) {
  if (!isIAActive) {
    return ""
  }
  const dialog = quotedMessage ? `{quote: ${quotedMessage}, text: ${text}}` : text
  const response = await toAsk(ASSISTANT_ID, dialog, state)
  return response
}

const audioFlow = addKeyword<Provider, Database>(EVENTS.VOICE_NOTE)
  .addAction(async (ctx, { flowDynamic, state, provider }) => {
    try {
      await typing(ctx, provider)
      //console.log(ctx)

      ///mnt/f/Proyectos/builderbot-openai-assistants/src/bots
      //remove last folder
      const path = __dirname.split('/').slice(0, -1).join('/')
      //console.log(path)

      //write the audio file
      const localPath = await provider.saveFile(ctx, { path: path + "/tmp" });
      //console.log(localPath)

      const text = await speechToText(localPath);
      if (text == "") {
        await showResponseFlowDynamic("Ahora mismo no puedo escuchar", flowDynamic)
        return
      }

      //const text2 = await speechToText(localPath);
      //console.log(text);
      //await flowDynamic([{ body: "En esta demo no se admite audio" }]);
      await responseText(text, state, flowDynamic, getQuoted(ctx))
    } catch (error) {
      await showResponseFlowDynamic("Ahora mismo no puedo escuchar", flowDynamic)
    }
  })


const documentFlow = addKeyword<Provider, Database>(EVENTS.DOCUMENT)
  .addAction(async (ctx, { flowDynamic, state, provider }) => {
    console.log("Document Flow")
    console.log(ctx)
    console.log(state)
    console.log(provider)
  })

const locationFlow = addKeyword<Provider, Database>(EVENTS.LOCATION)
  .addAction(async (ctx, { flowDynamic, state, provider }) => {
    console.log("Location Flow")
    console.log(ctx)
    console.log(state)
    console.log(provider)
  })

const mediaFlow = addKeyword<Provider, Database>(EVENTS.MEDIA)
  .addAction(async (ctx, { flowDynamic, state, provider }) => {
    console.log("Media Flow")
    console.log(ctx)
    console.log(state)
    console.log(provider)
  })

const orderFlow = addKeyword<Provider, Database>(EVENTS.ORDER)
  .addAction(async (ctx, { flowDynamic, state, provider }) => {
    console.log("Order Flow")
    console.log(ctx)
    console.log(state)
    console.log(provider)
  })

const templateFlow = addKeyword<Provider, Database>(EVENTS.TEMPLATE)
  .addAction(async (ctx, { flowDynamic, state, provider }) => {
    console.log("Template Flow")
    console.log(ctx)
    console.log(state)
    console.log(provider)
  })


const actionFlow = addKeyword<Provider, Database>(EVENTS.ACTION)
  .addAction(async (ctx, { flowDynamic, state, provider }) => {
    console.log("Action Flow")
    console.log(ctx)
    console.log(state)
    console.log(provider)
  })



function getQuoted(ctx) {
  try {
    let conversation = ctx?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation?.trim();
    conversation = conversation === undefined || conversation === "" ? null : conversation;
    let caption = ctx?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage?.caption.trim();
    caption = caption === undefined || caption === "" ? null : caption;

    const productTitle = ctx.message?.extendedTextMessage?.contextInfo?.quotedMessage?.productMessage?.product?.title
    if (productTitle !== undefined && productTitle !== null) {
      caption = "Se ha seleccionado el producto: " + productTitle
    }

    //console.log("Conversation: ")
    //console.log(conversation)
    //console.log("Caption: ")
    //console.log(caption)
    //console.log("CTX: ")
    //console.log(ctx)
    //console.log("quotedMessage: ")
    //console.log(ctx?.message?.extendedTextMessage?.contextInfo?.quotedMessage)
    let quotedMessage = conversation !== undefined || conversation !== null || conversation !== "" ? conversation : null;
    if (quotedMessage == null) {
      quotedMessage = caption !== undefined || caption !== null ? caption : null;
    }
    if (quotedMessage == null && productTitle !== undefined && productTitle !== null) {
      quotedMessage = productTitle
    }

    console.log("quoted: ")
    console.log(quotedMessage)
    return quotedMessage;
  }
  catch (error) {
    console.error(error);
    return null;
  }
}
export const startBotWhatsApp = async () => {
  const adapterFlow = createFlow([welcomeFlow, audioFlow, documentFlow, locationFlow, mediaFlow, orderFlow, templateFlow, actionFlow])
  const adapterProvider = createProvider(Provider)
  const adapterDB = new Database()

  const { httpServer } = await createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  })

  httpInject(adapterProvider.server)
  httpServer(+PORT)
}

