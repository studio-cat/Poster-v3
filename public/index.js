let letters = [];   
let drinks = [];
let currentDrink = 0;
let cx = 650, cy = 600; 
let baseSize = 260;  
let hoverAmt = 0;
let clickAmt = 0;
let latestSubmission = null;
let orderTextStart = 0;
let orderVisible = false;

const socket = io();
socket.on('giftWarmth', (data) => {
  latestSubmission = data;
  latestSubmission.drink = drinks[currentDrink].name; // if you want!
  showOrderTexts(latestSubmission.name || "Anonymous");
});


let giftText = "GIFT THIS!";
let giftHitbox = { x: 0, y: 0, w: 0, h: 0 };

// --------------------------------------------------------------------------------------------

// LOAD IMAGES
function preload() {

  const files = [
    { file: "assets/americano.png",      name: "Americano" },
    { file: "assets/cappucino.png",      name: "Cinnamon Cappucino" },
    { file: "assets/hotchocolate.png",   name: "Peppermint Hot Chocolate" },
    { file: "assets/latte.png",         name: "Oatmilk Latte" },
    { file: "assets/matcha.png",    name: "Vanilla Matcha Latte" },
    { file: "assets/gingerbread.png",    name: "Gingerbread Latte" }
  ];

  files.forEach(d => {
    d.img = loadImage(d.file);
    drinks.push(d);
  });
}

// -----------------------

function setup() { 

  createCanvas(900, 1600); // 900 x 1600 POSTER SIZE (VERTICAL)
  textAlign(LEFT, TOP);
  noStroke();

  const lines   = ["GIFT", "a CUP","of", "WARMTH"];
  const baseX   = 40;
  const baseY   = 320;
  const gapY    = 175;
  const size    = 96;
  const delayStepLetter = 60;   // ms between letters
  const delayStepLine   = 300;  // extra gap per line

  textSize(size);

  let delay = 0;
  lines.forEach((line, li) => {
    let x = baseX;
    const y = baseY + li * gapY;

    for (const ch of line) {
      const w = textWidth(ch);
      if (ch !== " ") {
        letters.push({
          ch,
          x,
          y,
          startTime: millis() + delay,
          angleTarget: random(-PI / 32, PI / 32)
        });
        delay += delayStepLetter;
      } else {
        delay += delayStepLetter * 0.3;
      }
      x += 1.7 * w;
    }
    delay += delayStepLine;
  });
}

function draw() {
  background("#FCF5F0");

  // LOGO & CREDITS -----------------
  fill("#644436");
  textFont("sans-serif");
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  textSize(24); text("BULLDOG COFFEE COMPANY", 30, 30);
  textSize(24); text("CITY OF NEW HAVEN", 625, 30);
  textSize(16); textStyle(NORMAL);
  text(
    "GIFT A CUP® is a collaborative project between BULLDOG COFFEE COMPANY™ and the City of New Haven aimed at revitalizing the city's coffee market while keeping the community warm during record lows this winter.\n\nDesigned by STUDIOCAT 2025.",
    30, 1485, 840
  );

  // TITLE LETTERS -----------------
  textSize(200);
  fill("#111");

  letters.forEach(l => {
    const t = millis() - l.startTime;
    if (t < 0) return;

    const dur = 600;
    const u = constrain(t / dur, 0, 1);
    const s = easeOutBack(u);
    const angle = l.angleTarget * s;

    push();
    translate(l.x, l.y - 10); // tiny lift
    scale(s);
    rotate(angle);
    text(l.ch, 0, 0);
    pop();
  });


  // FLOATING DRINK -----------------
  if (drinks.length > 0) {
  const d = drinks[currentDrink];

  const t = millis() / 1000;
  const floatScale = 1 + 0.04 * sin(t * 2.0);

  const targetW = baseSize;
  const ratio = d.img.height ? d.img.height / d.img.width : 1;
  const targetH = targetW * ratio;

  const halfW = targetW * floatScale / 2;
  const halfH = targetH * floatScale / 2;

  const hovering =
    mouseX > cx - halfW && mouseX < cx + halfW &&
    mouseY > cy - halfH && mouseY < cy + halfH;

  const targetHover = hovering ? 1 : 0;
  hoverAmt = lerp(hoverAmt, targetHover, 0.15); // smooth hover
  clickAmt = lerp(clickAmt, 0, 0.2);            // ease back after click

  const s = 1.5*(floatScale + hoverAmt * 0.15 + clickAmt); // final scale
  const drawW = targetW * s;
  const drawH = targetH * s;

  imageMode(CENTER);
  image(d.img, cx, cy, drawW, drawH);
}

  // --- GIFT THIS! clickable text ---
  textAlign(CENTER, TOP);
  textFont('Bagel Fat One');
  textSize(28);

  const giftY = 300; 
  const w = textWidth(giftText);
  const h = 32;

  // simple hover effect
  const hoveringGift =
    mouseX > (cx - w / 2) &&
    mouseX < (cx + w / 2) &&
    mouseY > giftY &&
    mouseY < giftY + h;

  if (hoveringGift) {
    textStyle(BOLD);
  } else {
    textStyle(NORMAL);
  }

  fill("#644436");
  text(giftText, cx, giftY);

  // store hitbox for clicks
  giftHitbox.x = cx - w / 2;
  giftHitbox.y = giftY;
  giftHitbox.w = w;
  giftHitbox.h = h;

  textStyle(NORMAL);




  // --- CURRENT SUBMISSION DISPLAY  ---
   if (latestSubmission) drawOrderTexts(latestSubmission.name || "Anonymous");
   else {
      textFont('Courier New'); 
      textAlign(LEFT, TOP);
      textSize(24);   text("waiting for orders...", 50, height - 500)
   }

    drawOrderTexts(latestSubmission?.name || "Anonymous"); 

}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const x = t - 1;
  return 1 + c3 * x * x * x + c1 * x * x;
}


function mousePressed() {

    if (isInGift(mouseX, mouseY)) {
    handleGiftClick();
    return; // don’t also treat it as a drink click
  }

  if (!drinks.length) return;

  const d = drinks[currentDrink];
  const t = millis() / 1000;
  const floatScale = 1 + 0.04 * sin(t * 2.0);
  const targetW = baseSize;
  const ratio = d.img.height ? d.img.height / d.img.width : 1;
  const targetH = targetW * ratio;

  const halfW = targetW * floatScale / 2;
  const halfH = targetH * floatScale / 2;
  const inside =
    mouseX > cx - halfW && mouseX < cx + halfW &&
    mouseY > cy - halfH && mouseY < cy + halfH;

  if (inside) {
    currentDrink = (currentDrink + 1) % drinks.length;
    clickAmt = 0.35; // click "pop" amount
  }
}


function showOrderTexts(displayName) {
  orderTextStart = millis();
  orderVisible = true;
  orderVisibleProgress = 0;
}

function drawOrderTexts(displayName) {
  if (!orderVisible) return;

  const t = millis() - orderTextStart;
  const fadeTime = 1000; // 1s for fade in per line
  const stagger  = 1000; // 1s between line *starts*

  const lines = [
    'Order received for ' + displayName + '!',
    'packaging...',
    'sending...',
    'delivered! thanks for sharing warmth this winter!'
  ];

  const totalTime = (lines.length - 1) * stagger + fadeTime;
  const clearAfter = totalTime + 4000; 

  textFont('Courier New');
  textAlign(LEFT, TOP);
  textSize(24);
  noStroke();

  for (let i = 0; i < lines.length; i++) {
    const lineStart = i * stagger;
    const u = constrain((t - lineStart) / fadeTime, 0, 1);
    const a = 255 * u;

    if (t >= lineStart && t < clearAfter) {
      fill(100, 68, 54, a); // #644436 but fading
      if (i === 0) textStyle(BOLD);
      else textStyle(NORMAL);
      text(lines[i], 50, height - 500 + i * 50);
    }
  }

  textStyle(NORMAL);

  if (t > clearAfter) {
    latestSubmission = null;
    orderVisible = false;
  }
}


function isInGift(x, y) {
  return (
    x >= giftHitbox.x &&
    x <= giftHitbox.x + giftHitbox.w &&
    y >= giftHitbox.y &&
    y <= giftHitbox.y + giftHitbox.h
  );
}

function handleGiftClick() {
  const d = drinks[currentDrink]; // { file, name, img }

  const payload = {
    drinkName: d.name,
    drinkIndex: currentDrink
  };

  console.log("Starting gift for:", payload);
  socket.emit('startGift', payload);
}