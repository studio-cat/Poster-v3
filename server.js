// SETUP
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

const BASE_URL = 'https://interactiveposter.onrender.com/assets2/'
const DRINK_IMAGES = {
  "Americano": `${BASE_URL}americano.png`,
  "Cinnamon Cappucino": `${BASE_URL}cappucino.png`,
  "Peppermint Hot Chocolate": `${BASE_URL}hotchocolate.png`,
  "Oatmilk Latte": `${BASE_URL}latte.png`,
  "Vanilla Matcha Latte": `${BASE_URL}matcha.png`,
  "Gingerbread Latte": `${BASE_URL}gingerbread.png`
};

// MAILER
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'daye.catherine@gmail.com', 
    pass:'ovlo iljz luta igem',  
  },
});

// console.log("Email user:", process.env.EMAIL_USER);
// console.log("Email pass exists:", !!process.env.EMAIL_PASSWORD);


// SOCKET.IO LOGIC 
io.on('connection', (socket) => {
  console.log("Client connected:", socket.id);

  socket.on('startGift', (payload) => {
    console.log("Server: received startGift", payload);
    io.emit('startGift', payload);  
  });

 socket.on('giftWarmth', async (payload) => {

    console.log('Server: received giftWarmth', payload);
    io.emit('giftWarmth', payload);  

    const { name, email, drink, image } = payload;

    const html = buildGiftCardHTML({ name, drink, image });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `A warm ${drink} for you ☕`,
      html
    });
  });

});

// START SERVER 
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});


function buildGiftCardHTML({ name, drink, image }) {
  const drinkImg = DRINK_IMAGES[drink];

  return `
  <body style="margin:0; padding:0; background:#f7dfcc; font-family:'Helvetica Neue',Arial,sans-serif;">
    <table width="100%" style="padding:36px 0;">
      <tr>
        <td align="center">
          <table width="420"
                 style="background:#fff6ee; border-radius:26px; padding:24px; box-shadow:0 6px 22px rgba(0,0,0,0.07);">

            <tr><td align="center" style="padding-bottom:14px;">
              <div style="font-size:26px; font-weight:700; color:#553208; text-transform:uppercase; letter-spacing:0.07em;">
                Warm Gift Card
              </div>
            </td></tr>

            <tr><td align="center" style="padding-bottom:6px;">
              <div style="font-size:15px; color:#8a5a2f;">
                ${name ? `${name} sent you` : `You received`}
              </div>
            </td></tr>

            <tr><td align="center" style="padding-bottom:18px;">
              <div style="font-size:22px; font-weight:700; color:#553208;">
                ${drink || 'Cozy Drink'}
              </div>
            </td></tr>

            ${
              drinkImg ? `
<tr><td align="center" style="padding-bottom:18px;">
  <img src="${drinkImg}" 
       style="width:140px; height:auto; display:block; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.14));" />
</td></tr>
              ` : ''
            }

<tr><td align="center" style="padding:6px 0 18px;">
  <div style="font-size:13px; color:#a1774f; max-width:310px; line-height:1.5;">
    A little warmth, a little caffeine, and a reminder that someone’s thinking of you today. 💌 Redeem at any participating location of BULLDOG COFFEE.
  </div>
</td></tr>

            ${
              image ? `
<tr><td align="center" style="padding-bottom:4px;">
  <img src="${image}" 
       alt="drawing message"
       style="max-width:320px; border-radius:20px; border:2px solid #f0d5b9; display:block;" />
</td></tr>
              ` : ''
            }
          </table>
        </td>
      </tr>
    </table>
  </body>`;
}