const socket = io();

const messagesDiv = document.getElementById("messages");
const input = document.getElementById("input");
const sendButton = document.getElementById("send");

sendButton.addEventListener("click", () => {
  const message = input.value;
  if (!message) return;
  addMessage(`You: ${message}`);
  socket.emit("message", message);
  input.value = "";
});

socket.on("response", (response) => {
  addMessage(`Bot: ${response}`);
});

socket.on("calendar", (response) => {
  const container = document.createElement("div");
  container.textContent = "Bot: Here is the academic calendar"; 
  
  var ul = document.createElement("ul");
  response.forEach(element => {
    if (element["event"] !== "N/A" && element["date"] === "N/A") {
      var h1 = document.createElement("h1");
      h1.innerHTML = `${element["event"]}`;
      ul.appendChild(h1);
    } else {
      var li = document.createElement("li");
      li.innerHTML = `${element["event"]} - ${element["date"]}`;
      ul.appendChild(li);
    }
  });

  container.appendChild(ul);
  messagesDiv.appendChild(container);
});


const addMessage = (message) => {
  const div = document.createElement("div");
  div.textContent = message;
  messagesDiv.appendChild(div);
};
