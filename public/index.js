let letters = [];   
let drinks = [];
let currentDrink = 0;
let cx = 650, cy = 600; 
let baseSize = 260;  
let hoverAmt = 0;
let clickAmt = 0;
let latestSubmission = null;

const socket = io();
socket.on('giftWarmth', (data) => {
  latestSubmission = data;  
});

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
  textAlign(LEFT, TOP);
  textSize(24); text("BULLDOG COFFEE COMPANY", 30, 50);
  textSize(24); text("CITY OF NEW HAVEN", 625, 50);
  textSize(16);
  text(
    "GIFT A CUP® is a collaborative project between BULLDOG COFFEE COMPANY™ and the City of New Haveb aimed at revitalizing the city's coffee market while keeping the community warm during record lows this winter.\n\nDesigned by STUDIOCAT 2025.",
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


  // --- CURRENT SUBMISSION DISPLAY  ---
  if (latestSubmission) {

    const displayName  = latestSubmission.name  || "Anonymous";
    // const displayDrink = latestSubmission.drink || "A warm drink";

    textFont('sans-serif'); 
    textAlign(LEFT, TOP);
    textSize(32);   text('Order received for ' + displayName + '!', 50, height - 500)

    // add delay here.. 

    textSize(32);   text('PACKAGING...' , 50, height - 450)
    textSize(32);   text('DELIVERING...' , 50, height - 400)
    textSize(32);   text('SENT! thanks for sharing warmth this winter!' , 50, height - 350)

      // add delay and wipe after some time?

    }

  else{
    // add a delay here.. 
    // typing effect animaion?
    textAlign(LEFT, TOP);
    textSize(32);   text("waiting for orders...", 50, height - 500)
  }




}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const x = t - 1;
  return 1 + c3 * x * x * x + c1 * x * x;
}
function mousePressed() {
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