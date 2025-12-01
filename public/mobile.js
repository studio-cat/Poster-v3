// GLOBAL VARIABLES
let canvas;
 const socket = io();
let margin = 80;
let h_name = 430;
let h_email = h_name + margin;
let h_message = h_name + margin * 2;
let nameInput, emailInput, submitButton, msgInput;
const msgBox = { x: 40, y: h_message, w: 355, h: 200 };
let drinkInfo = null;
let drinkImg = null;
let uiInitialized = false;
const DRINK_IMAGES = {
  "Americano": "assets2/americano.png",
  "Cinnamon Cappucino": "assets2/cappucino.png",
  "Peppermint Hot Chocolate": "assets2/hotchocolate.png",
  "Oatmilk Latte": "assets2/latte.png",
  "Vanilla Matcha Latte": "assets2/matcha.png",
  "Gingerbread Latte": "assets2/gingerbread.png",
};
let decoImg ;
function preload() {
  decoImg = loadImage("assets2/decoration.png");
}

// --------------------------------------------------------------------------------------------

function setup() {
  // 426 x 874 MOBILE SIZE (VERTICAL) 
  canvas = createCanvas(426, 874);               
  pixelDensity(1);

  // INITIAL STATE: blank-ish screen with center prompt
  background("#FCF5F0");
  textAlign(CENTER, CENTER);
  textFont("Helvetica");
  textStyle(ITALIC);
  textSize(24);
  fill(80);
  text("Choose a drink to gift!", width / 2, height / 2);

  // SOCKET.IO SETUP
  socket.on('startGift', (data) => {
    console.log("Mobile: received startGift", data);
    handleStartGift(data);
    });
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
  return false; 
}

function handleSubmit() {
  const name = nameInput.value().trim();
  const email = emailInput.value().trim();
  const drink = drinkInfo?.drinkName;

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
  const payload = { name: name, email: email, drink: drink, image: drawingDataURL };

  console.log("sending payload", payload);
  socket.emit('giftWarmth', payload);
  
  // Clear input fields
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
    loadImage(imgPath, (img) => {
      drinkImg = img;
      initUI(); 
    }, () => {
      drinkImg = null;
      initUI();
    });
  } 
  
  else {
    initUI();
  }
}

function initUI() {

  uiInitialized = true;
  redrawUI();

  // NAME INPUT BOX
  nameInput = createInput('');
  nameInput.position(40, h_name + 7);
  nameInput.size(330,25);
  

 // EMAIL INPUT BOX
  emailInput = createInput('');
  emailInput.position(40, h_email + 7);
  emailInput.size(330,25);

  // SUBMIT BUTTON
  submitButton = createButton('SEND :)');
  submitButton.position((width-72)/2, height - 50);
  submitButton.style('background-color', '#a79582ff'); // beige
  submitButton.style('border', 'none');             // removes outline
  submitButton.style('outline', 'none');            // extra insurance
  submitButton.style('color', 'white');             // text white
  submitButton.style('font-family', 'Helvetica');   // helvetica
  submitButton.style('font-weight', 'bold');        // bold
  submitButton.style('padding', '10px 24px');       // nicer proportions
  submitButton.style('border-radius', '999px');     // pill shaped, super round
  submitButton.style('cursor', 'pointer');          // feels clickable
  submitButton.mouseOver(() => submitButton.style('transform', 'scale(1.07)'));
  submitButton.mouseOut(() => submitButton.style('transform', 'scale(1)'));
  submitButton.mousePressed(() => {
    submitButton.style('transform', 'scale(0.95)');
    submitButton.style('transition', 'transform 0.1s ease');
  });
  submitButton.mouseReleased(() => {
    submitButton.style('transform', 'scale(1.07)');
  });
  submitButton.mouseReleased(handleSubmit);

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
    const targetW = 180;
    const ratio = drinkImg.height ? drinkImg.height / drinkImg.width : 1;
    const targetH = targetW * ratio;
    image(drinkImg, width/2 + 10, imgY+20, targetW, targetH);

    // DRINK NAME
    textAlign(CENTER, TOP);
    textFont("DynaPuff");
    textStyle(BOLD); 
    textSize(28);
    fill("#7b5d50ff");
    text(drinkInfo?.drinkName.toUpperCase(), width / 2, imgY + targetH / 2 + 40);

    // COMMENTARY
    textFont("Helvetica");
    textStyle(ITALIC);textSize(12);  text("great for the weather!", width / 2, imgY + targetH / 2 + 75);
    
    // "YOU SELECTED" LABEL
    fill("#c47878ff");
    textStyle(BOLD);  textSize(14);  text("YOU SELECTED", width / 2, imgY - 90);

  }

  textAlign(CENTER, CENTER);
  textFont("Helvetica");
  textStyle(BOLD);
  textSize(16);
  fill("#c47878ff");  text("WRITE OR DRAW MESSAGE", width/2, h_message - 15);
              text("YOUR NAME", width/2, h_name - 20);
              text("RECIPIENT's EMAIL", width/2, h_email - 20);
  fill(255);  rect(msgBox.x, msgBox.y, msgBox.w, msgBox.h, 10);

  image(decoImg, 210, 20, 426,80);
}