// GLOBAL VARIABLES
let margin = 60;
let h_name = 400;
let h_email = h_name + margin;
let h_message = h_name + margin * 2.5;

let nameInput, emailInput, submitButton, msgInput;
const msgBox = { x: 40, y: h_message, w: 355, h: 245 };

let canvas;

const socket = io();

let drinkInfo = null;
let drinkImg = null;
let uiInitialized = false;
const DRINK_IMAGES = {
  "Americano": "assets/americano.png",
  "Cinnamon Cappucino": "assets/cappucino.png",
  "Peppermint Hot Chocolate": "assets/hotchocolate.png",
  "Oatmilk Latte": "assets/latte.png",
  "Vanilla Matcha Latte": "assets/matcha.png",
  "Gingerbread Latte": "assets/gingerbread.png",
};

// --------------------

function setup() {
  canvas = createCanvas(426, 874);               // 426 x 874 POSTER SIZE (VERTICAL) 
  pixelDensity(1);

  // INITIAL STATE: blank-ish screen with center prompt
  background("#FCF5F0");
  textAlign(CENTER, CENTER);
  textFont("Helvetica");
  textStyle(ITALIC);
  textSize(24);
  fill(80);
  text("Choose a drink to gift!", width / 2, height / 2);

  socket.on('connect', () => {
  console.log("Mobile: connected, id =", socket.id);
});

socket.on('startGift', (data) => {
  console.log("Mobile: received startGift", data);
  handleStartGift(data);
});
}

function draw() {
  }

// HELPER FUNCTIONS

function insideMsgBox(x, y) {
  return (
    x >= msgBox.x &&
    x <= msgBox.x + msgBox.w &&
    y >= msgBox.y &&
    y <= msgBox.y + msgBox.h
  );
}

function mouseDragged() {
  if (insideMsgBox(mouseX, mouseY) && insideMsgBox(pmouseX, pmouseY)) {
    stroke(50);
    strokeWeight(3);
    line(pmouseX, pmouseY, mouseX, mouseY);
  }
}

function touchMoved() {
  if (insideMsgBox(touchX, touchY) && insideMsgBox(ptouchX, ptouchY)) {
    stroke(50);
    strokeWeight(3);
    line(ptouchX, ptouchY, touchX, touchY);
  }
  return false; // prevent page scroll
}

function handleSubmit() {
  const name = nameInput.value().trim();
  const email = emailInput.value().trim();

  const srcCanvas = canvas.elt;

  const tmp = document.createElement('canvas');
  tmp.width  = msgBox.w;
  tmp.height = msgBox.h;
  const ctx = tmp.getContext('2d');

  ctx.drawImage(
    srcCanvas,
    msgBox.x, msgBox.y, msgBox.w, msgBox.h,
    0, 0, msgBox.w, msgBox.h
  );

  const drawingDataURL = tmp.toDataURL('image/png');

  const payload = { name, email, drawing: drawingDataURL };

  console.log("sending payload", payload);
  socket.emit('giftWarmth', payload);
  
 if (nameInput) {
    nameInput.value('');
    if (nameInput.elt) nameInput.elt.value = '';
  }
  if (emailInput) {
    emailInput.value('');
    if (emailInput.elt) emailInput.elt.value = '';
  }

  // Clear drawing box
  noStroke();
  fill(255);
  rect(msgBox.x, msgBox.y, msgBox.w, msgBox.h, 10);
}

function handleStartGift(data) {

  drinkInfo = data || {};
  const imgPath = DRINK_IMAGES[drinkInfo.drinkName];
  if (imgPath) {
    // load image, then init UI once it's ready
    loadImage(imgPath, (img) => {
      drinkImg = img;
      initUI();   // draw everything + create inputs
    }, () => {
      // if image fails to load, still init UI without image
      drinkImg = null;
      initUI();
    });
  } 
  
  else {
    initUI();
  }
}


function initUI() {
  // if (uiInitialized) {
  //   redrawUI();
  //   return;
  // }

  uiInitialized = true;

  // Draw full layout
  redrawUI();

  // NAME INPUT BOX
  nameInput = createInput('');
  nameInput.attribute('placeholder', 'who is this for? :)');
  nameInput.position(100, h_name + 7);
  nameInput.size(275,25);
  

 // EMAIL INPUT BOX
  emailInput = createInput('');
  emailInput.attribute('placeholder', 'where should we send it?');
  emailInput.position(100, h_email + 7);
  emailInput.size(275,25);

  // SUBMIT BUTTON
  submitButton = createButton('Send');
  submitButton.position(width/2, height - 20);
  submitButton.mousePressed(handleSubmit);


 [nameInput, emailInput].forEach(inp => inp.addClass("pretty-input"));
  const style = document.createElement("style");
  style.innerHTML = `
    .pretty-input {
      font-family: sans-serif;
      font-size: 16px;
      border: 0px solid #C6A68B;
      border-radius: 20px;
      padding: 8px 12px;
      width: 330px;
      height: 35px;
      outline: none;
      transition: border 0.2s ease, transform 0.2s ease;
    }
    .pretty-input:focus {
      border-color: #8B5E3C;
      transform: scale(1.02);
    }
  `;
  document.head.appendChild(style);
}

function redrawUI() {

  background("#FCF5F0");
  noStroke();

  if (drinkImg) {
    imageMode(CENTER);
    const imgY = 160;
    const targetW = 260;
    const ratio = drinkImg.height ? drinkImg.height / drinkImg.width : 1;
    const targetH = targetW * ratio;
    image(drinkImg, width / 2, imgY, targetW, targetH);

    textAlign(CENTER, TOP);
    // textFont("DynaPuff");
    textStyle(NORMAL);
    textSize(28);
    fill("#644436");
    const label = drinkInfo?.drinkName || "Your drink";
    text(label, width / 2, imgY + targetH / 2 + 16);
  }

  fill(100);  text("WRITE OR DRAW MESSAGE", 40, h_message - 10);
              text("NAME", 40, h_name + 25);
              text("EMAIL", 40, h_email + 25);
  fill(255);  rect(msgBox.x, msgBox.y, msgBox.w, msgBox.h, 10);

}