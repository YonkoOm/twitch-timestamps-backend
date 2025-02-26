const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors()); // Allow browser requests

const CLIENT_ID = process.env.CLIENT_ID;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

app.get("/user", async (req, res) => {
  const streamer = req.query.login;
  const url = `https://api.twitch.tv/helix/users?login=${streamer}`;

  const response = await fetch(url, {
    headers: {
      "Client-ID": CLIENT_ID,
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  });

  const data = await response.json();
  res.json(data);
});

app.get("/video", async (req, res) => {
  const videoId = req.query.id;
  const url = `https://api.twitch.tv/helix/videos?id=${videoId}`;

  const response = await fetch(url, {
    headers: {
      "Client-ID": CLIENT_ID,
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  });

  const data = await response.json();
  res.json(data);
});

app.get("/livestream", async (req, res) => {
  const username = req.query.username;
  const response = await fetch(
    `https://api.twitch.tv/helix/streams?user_login=${username}`,
    {
      headers: {
        "Client-ID": CLIENT_ID,
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    },
  );

  const data = await response.json();

  return res.json(data);
});

app.get("/vods/:streamerId", async (req, res) => {
  const streamerId = req.params.streamerId;
  const response = await fetch(
    `https://api.twitch.tv/helix/videos?user_id=${streamerId}&type=archive`,
    {
      headers: {
        "Client-ID": CLIENT_ID,
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    },
  );
  const data = await response.json();

  res.json(data);
});

app.listen(3000, () => console.log("Server running on port 3000"));
