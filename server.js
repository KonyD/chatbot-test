const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cheerio = require("cheerio");
const path = require("path");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

async function getWeatherData() {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=istanbul&appid=${API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new Error("An error occurred while fetching the weather data.");
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

async function getAcademiCalendar(params) {
  const url = "https://www.iku.edu.tr/en/academic-calendar";
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Error fetching URL: ${error}`);
  }

  const html = await response.text();

  // Load HTML into Cheerio
  const $ = cheerio.load(html);

  // Extract table data
  const rows = [];
  $("table tbody tr").each((i, row) => {
    const columns = $(row)
      .find("td")
      .map((j, cell) => $(cell).text().trim())
      .get();
    if (columns.length) rows.push(columns);
  });

  if (rows.length > 0) {
    const formattedData = rows.map((row) => ({
      event: row[0] || "N/A", 
      date: row[1] || "N/A",  
    }));

    return formattedData;
  }

  return "No data found in the table.";
}

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

async function chatbotResponse(message) {
  if (message.toLowerCase().includes("hello")) {
    return "Hi there! How can I assist you today?";
  }
  if (message.toLowerCase().includes("bye")) {
    return "Goodbye! Have a great day!";
  }
  if (message.toLowerCase().includes("weather")) {
    const weatherData = await getWeatherData();

    const temp = weatherData.main.temp;
    const weather = weatherData.weather[0].description;

    return `The weather in Istanbul is currently ${temp}°C with ${weather}.`;
  }
  if (message.toLowerCase().includes("academic calendar")) {
    return await getAcademiCalendar();
  }
  return "I'm sorry, I didn't understand that. Can you rephrase?";
}

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("message", async (msg) => {
    console.log(`User: ${msg}`);

    const response = await chatbotResponse(msg);

    if (msg.toLowerCase().includes("calendar")) {
      socket.emit("calendar", response);
    } else {
      socket.emit("response", response);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
