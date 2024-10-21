import "npm:dotenv@16.4.5/config"

import { startBotWhatsApp } from "./services/whatsapp.ts";
//import { startBotFacebook } from "./services/facebook";

startBotWhatsApp()
//startBotFacebook();
