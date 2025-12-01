// GLOBAL VARIABLES
let margin = 60;
let h_name = 400;
let h_email = h_name + margin;
let h_message = h_name + margin * 2.5;

let nameInput, emailInput, submitButton, msgInput;
const msgBox = { x: 40, y: h_message, w: 355, h: 245 };

let canvas;
// let socket;

const socket = io();


socket.on('startGift', (data) => {

  console.log("startGift received on loading screen:", data);

  // Build URL for mobile.html with a query param
  const params = new URLSearchParams();
  if (data.drinkName) {
    params.set('drink', data.drinkName);
  }
  if (data.drinkIndex !== undefined) {
    params.set('idx', data.drinkIndex);
  }

  const url = '/mobile.html?' + params.toString();

  // Redirect this phone from loading.html → mobile.html
  window.location.href = url;
});


// --------------------

function setup() {
  canvas = createCanvas(426, 874);               // 426 x 874 POSTER SIZE (VERTICAL) 
  pixelDensity(1);
  background("#FCF5F0");
  noStroke();

  fill(200);  rect(40, 50, 346, 300);  

  fill(100);  text("WRITE OR DRAW MESSAGE", 40, h_message - 10);
              text("NAME", 40, h_name + 25);
              text("EMAIL", 40, h_email + 25);
  fill(255);  rect(msgBox.x, msgBox.y, msgBox.w, msgBox.h, 10);

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

  // noLoop();

  socket = io();
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

  // ✅ ALSO CLEAR INPUTS:
  nameInput.value('');   // clear name field
  emailInput.value('');  // clear email field

  // Clear drawing box
  noStroke();
  fill(255);
  rect(msgBox.x, msgBox.y, msgBox.w, msgBox.h, 10);
}
