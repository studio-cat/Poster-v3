// GLOBAL VARIABLES

let letters = [];   
let drinks = [];
let currentDrink = 0;
let cx = 650, cy = 650; 
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
let transitionDuration = 500;
let transitionDir = 0;
let prevDrinkIndex = 0;

let DRINK_COLORS;

let currentDrinkKey = 'americano';

let prevTitleColor;
let targetTitleColor;
let colorBlendStart = 0;
const COLOR_BLEND_DUR = 500;

// SOCKET.IO SETUP
const socket = io();
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

      if (ch !== " ") {
        letters.push({
          ch,
          x,
          y,
          startTime: millis() + delay,
          angleTarget: random(-PI / 32, PI / 32),

          // 🌊 floating-phase params
          floatPhase: random(TWO_PI),
          floatAmpX: random(2, 8),
          floatAmpY: random(2, 10),
          floatAngleAmp: random(0.02, 0.06)
        });

        delay += delayStepLetter;
      } else {
        delay += delayStepLetter * 0.3;
      }

      x += 1.8 * w;
    }
    delay += delayStepLine;
  });

}

function animateTitle(letters) {
  const now = millis();
  const dur = 600;
  const tFloat = now / 1000.0;

  const baseColor = getCurrentTitleBaseColor(); // 👈 melt color

  letters.forEach(l => {
    const t = now - l.startTime;
    if (t < 0) return;

    let s, angle, offsetX = 0, offsetY = 0, alpha = 0;

    if (t <= dur) {
      const u = constrain(t / dur, 0, 1);
      const ease = easeOutBack(u);
      s = ease;
      angle = l.angleTarget * ease;
      alpha = map(u, 0, 1, 0, 255);
    } else {
      s = 1;
      const tt = tFloat + l.floatPhase;

      offsetX = sin(tt * 0.8) * l.floatAmpX;
      offsetY = cos(tt * 0.6) * l.floatAmpY;
      angle   = l.angleTarget + sin(tt * 0.7) * l.floatAngleAmp;
      alpha   = map(sin(tt * 0.9), -1, 1, 150, 255);
    }

    push();

      textFont('Helvetica');
            // textFont('DynaPuff');

      textStyle(BOLD);
      textSize(200);

      // combine melted base color + per-letter alpha
      const c = color(
        red(baseColor),
        green(baseColor),
        blue(baseColor),
        alpha
      );
      fill(c);

      translate(l.x + offsetX, l.y - 10 + offsetY);
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

function showOrderTexts(displayName) {
  orderTextStart = millis();
  orderVisible = true;
  orderVisibleProgress = 0;
}

function drawOrderTexts(displayName) {
  if (!orderVisible) return;

  const t = millis() - orderTextStart;
  const fadeTime = 1000; 
  const stagger  = 1000; 
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
      fill(100, 68, 54, a);
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

  transitionDir = dir;   
  isTransitioning = true;
  transitionStart = millis();
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const x = t - 1;
  return 1 + c3 * x * x * x + c1 * x * x;
}

function setCurrentDrink(drinkKey) {
  currentDrinkKey = drinkKey;

  const nextColor = DRINK_COLORS[drinkKey] || color('#553208');
  prevTitleColor  = getCurrentTitleBaseColor(); 
  targetTitleColor = nextColor;
  colorBlendStart  = millis();
}

function getCurrentTitleBaseColor() {
  if (!prevTitleColor || !targetTitleColor) {
    return targetTitleColor ;
  }

  const elapsed = millis() - colorBlendStart;
  const u = constrain(elapsed / COLOR_BLEND_DUR, 0, 1);

  // lerpColor makes a new color between the two
  return lerpColor(prevTitleColor, targetTitleColor, u);
}

// ------------------------------------------------------------------------------------------------------------
// SETUP & DRAW FUNCTIONS
// ------------------------------------------------------------------------------------------------------------

function setup() { 

  createCanvas(900, 1600); // 900 x 1600 POSTER SIZE (VERTICAL)
  textAlign(LEFT, TOP);
  noStroke();
  textSize(96);

  const lines   = ["GIFT","a", "CUP","of", "WARMTH"];
  const baseX   = 40;
  const baseY   = 150;
  const gapY    = 180;
  const delayStepLetter = 60;  
  const delayStepLine   = 300; 
  computePositionTiming(lines, baseX, baseY, gapY, delayStepLetter, delayStepLine)


  DRINK_COLORS = {
    americano: color('#8B4513'),
    latte:     color('#C89F7B'),
    matcha:    color('#5C8A3C'),
    gingerbread:      color('#B26A3C'),
    hotchoco:  color('#5A3A2E'),
    cappucino:  color('#D2B48C')
  };

  targetTitleColor = DRINK_COLORS[currentDrinkKey];
  prevTitleColor   = targetTitleColor;
  colorBlendStart  = millis();

socket.on('giftWarmth', (data) => {

    console.log("Poster: received giftWarmth", data);
    latestSubmission = data;
    latestSubmission.drink = drinks[currentDrink].name; 
    showOrderTexts(latestSubmission.name);
  });

}

function draw() {

  // BACKGROUND & CREDITS
  background("#FCF5F0");
    // background("#ffffffff");
  drawCredits()

  // TITLE LETTERS 
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

      let drinklist = ['americano', 'cappucino', 'hotchoco','latte', 'matcha', 'gingerbread'];
      let drinkKey = drinklist[currentDrink];
      setCurrentDrink(drinkKey);

      // end transition
      if (u >= 1) {
        isTransitioning = false;
      }
    }
  }

  // --- IF THERE IS A SUBMISSION  ---
   if (latestSubmission) {
    drawOrderTexts(latestSubmission.name);
   }

   else {
      textFont('Courier New'); 
      textAlign(LEFT, TOP);
      textSize(24);   text("waiting for orders...", 50, height - 500)
   }
  drawOrderTexts(latestSubmission?.name); 
}

// ADDITIONAL HELPER FUNCTIONS

function mousePressed() {
  if (!isTransitioning && isInDrink(mouseX, mouseY)) {
    isDraggingDrink = true;
    dragStartY = mouseY;
  }
}

function mouseReleased() {
  if (!isDraggingDrink) return;

  const dy = mouseY - dragStartY;
  const threshold = 40; 

  // BELOW THRESHOLD: TREAT AS TAP = GIFT DRINK
  if (Math.abs(dy) < threshold) {
    handleGiftClick();
    } 
  else {
    // SWIPING MOTION
    const dir = dy < 0 ? +1 : -1; 
    startDrinkTransition(dir);
  }

  isDraggingDrink = false;
}

function handleGiftClick() {
  const d = drinks[currentDrink]; 

  const payload = {
    drinkName: d.name,
    drinkIndex: currentDrink
  };

  console.log("Poster: emitting startGift", payload);
  socket.emit('startGift', payload);
}
