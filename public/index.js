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

let isDraggingDrink = false;
let dragStartY = 0;
let isTransitioning = false;
let transitionStart = 0;
let transitionDuration = 500; // ms
let transitionDir = 0;        // +1 = next, -1 = previous
let prevDrinkIndex = 0;

const socket = io();

socket.on('connect', () => {
    console.log("Main: connected, id =", socket.id);
  });

socket.on('giftWarmth', (data) => {
  latestSubmission = data;
  latestSubmission.drink = drinks[currentDrink].name; 
  showOrderTexts(latestSubmission.name);
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

// TITLE: HELPER FUNCTIONS

function computePositionTiming(lines, baseX, baseY, gapY, delayStepLetter, delayStepLine) {

  lines.forEach((line, li) => {

    let x = baseX;
    const y = baseY + li * gapY;
    let delay = 0;

    for (const ch of line) {
      const w = textWidth(ch);

      // FOR REGULAR CHARACTERS
      if (ch !== " ") {

        // Add: character, x-y position, startTime, targetAngle
        letters.push({
          ch,
          x,
          y,
          startTime: millis() + delay,
          angleTarget: random(-PI / 32, PI / 32)
        });

        delay += delayStepLetter;
      } 
      
      // FOR BLANK SPACES
      else {
        delay += delayStepLetter * 0.3;
      }

      x += 1.7 * w;
    }
    delay += delayStepLine;
  });

}

function animateTitle(letters) {
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
      textSize(200);
      fill("#111");
      translate(l.x, l.y - 10); // tiny lift
      scale(s);
      rotate(angle);
      text(l.ch, 0, 0);
    pop();
  });
}

// LOGO & CREDITS 
function drawCredits() {
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
}



// ------------------------------------------------------------------------------------------------------------
// SETUP & DRAW FUNCTIONS
// ------------------------------------------------------------------------------------------------------------

function setup() { 

  createCanvas(900, 1600); // 900 x 1600 POSTER SIZE (VERTICAL)
  textAlign(LEFT, TOP);
  noStroke();
  textSize(96);

  const lines   = ["GIFT", "a CUP","of", "WARMTH"];
  const baseX   = 40;
  const baseY   = 320;
  const gapY    = 175;
  const delayStepLetter = 60;  
  const delayStepLine   = 300; 
  computePositionTiming(lines, baseX, baseY, gapY, delayStepLetter, delayStepLine)

}

function draw() {

  // BACKGROUND & CREDITS
  background("#FCF5F0");
  drawCredits()

  // TITLE LETTERS 
  textSize(200);
  fill("#111");
  animateTitle(letters)

  // FLOATING DRINK -----------------
  if (drinks.length > 0) {
    const time = millis() / 1000;
    const floatScale = 1 + 0.04 * sin(time * 2.0);

    const baseW = baseSize;
    const dCurrent = drinks[currentDrink];
    const ratioCurrent = dCurrent.img.height ? dCurrent.img.height / dCurrent.img.width : 1;
    const baseHCurrent = baseW * ratioCurrent;

    // hover effect only when not transitioning
    let hovering = false;
    if (!isTransitioning) {
      const halfW = baseW * floatScale / 2;
      const halfH = baseHCurrent * floatScale / 2;
      hovering =
        mouseX > cx - halfW && mouseX < cx + halfW &&
        mouseY > cy - halfH && mouseY < cy + halfH;
    }

    const targetHover = hovering ? 1 : 0;
    hoverAmt = lerp(hoverAmt, targetHover, 0.15);
    clickAmt = lerp(clickAmt, 0, 0.2);

    imageMode(CENTER);

    if (!isTransitioning) {
      // normal state: just draw the current drink
      const s = 1.5 * (floatScale + hoverAmt * 0.15 + clickAmt);
      const drawW = baseW * s;
      const drawH = baseHCurrent * s;
      image(dCurrent.img, cx, cy, drawW, drawH);
    } else {
      // transition state: slide old one out, new one in
      const tRaw = (millis() - transitionStart) / transitionDuration;
      const u = constrain(tRaw, 0, 1);
      const e = u < 0.5
        ? 2 * u * u
        : 1 - pow(-2 * u + 2, 2) / 2; // easeInOutQuad

      // direction: +1 swipe up → next drink from below
      const slideDistance = 250; // px

      // OUTGOING (prev)
      const dPrev = drinks[prevDrinkIndex];
      const ratioPrev = dPrev.img.height ? dPrev.img.height / dPrev.img.width : 1;
      const baseHPrev = baseW * ratioPrev;
      const sPrev = 1.5 * floatScale;
      const drawWPrev = baseW * sPrev;
      const drawHPrev = baseHPrev * sPrev;

      const offsetPrevY = -slideDistance * e * transitionDir;
      const alphaPrev = 255 * (1 - e);

      push();
      tint(255, alphaPrev);
      image(dPrev.img, cx, cy + offsetPrevY, drawWPrev, drawHPrev);
      pop();

      // INCOMING (current)
      const sCur = 1.5 * floatScale;
      const drawWCur = baseW * sCur;
      const drawHCur = baseHCurrent * sCur;

      const offsetCurY = slideDistance * (1 - e) * transitionDir;
      const alphaCur = 255 * e;

      push();
      tint(255, alphaCur);
      image(dCurrent.img, cx, cy + offsetCurY, drawWCur, drawHCur);
      pop();

      // end transition
      if (u >= 1) {
        isTransitioning = false;
      }
    }
  }

  // --- IF THERE IS A SUBMISSION  ---
   if (latestSubmission) drawOrderTexts(latestSubmission.name);
   else {
      textFont('Courier New'); 
      textAlign(LEFT, TOP);
      textSize(24);   text("waiting for orders...", 50, height - 500)
   }
  drawOrderTexts(latestSubmission?.name); 
}

// HELPER FUNCTIONS

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const x = t - 1;
  return 1 + c3 * x * x * x + c1 * x * x;
}

function mousePressed() {
  // Start swipe on drink if pressed on it and not currently transitioning
  if (!isTransitioning && isInDrink(mouseX, mouseY)) {
    isDraggingDrink = true;
    dragStartY = mouseY;
  }
}


function mouseReleased() {
  if (!isDraggingDrink) return;

  const dy = mouseY - dragStartY;
  const threshold = 40; // how far you need to move to count as a swipe

  if (Math.abs(dy) < threshold) {
    // Very small movement → treat as tap on drink → gift it
    handleGiftClick();
  } else {
    // Swipe: one "motion" → one drink change
    const dir = dy < 0 ? +1 : -1; // swipe up → next, swipe down → previous
    startDrinkTransition(dir);
  }

  isDraggingDrink = false;
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

function isInDrink(x, y) {
  if (!drinks.length) return false;

  const d = drinks[currentDrink];
  const t = millis() / 1000;
  const floatScale = 1 + 0.04 * sin(t * 2.0);

  const targetW = baseSize;
  const ratio = d.img.height ? d.img.height / d.img.width : 1;
  const targetH = targetW * ratio;

  const halfW = (targetW * floatScale) / 2;
  const halfH = (targetH * floatScale) / 2;

  return (
    x > cx - halfW && x < cx + halfW &&
    y > cy - halfH && y < cy + halfH
  );
}

function startDrinkTransition(dir) {
  if (!drinks.length || isTransitioning) return;

  prevDrinkIndex = currentDrink;
  currentDrink = (currentDrink + dir + drinks.length) % drinks.length;

  transitionDir = dir;       // +1 = swipe up → next, -1 = swipe down → prev
  isTransitioning = true;
  transitionStart = millis();
}


function handleGiftClick() {
  const d = drinks[currentDrink]; // { file, name, img }

  const payload = {
    drinkName: d.name,
    drinkIndex: currentDrink
  };

  console.log("Poster: emitting startGift", payload);
  socket.emit('startGift', payload);
}
