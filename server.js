import express from "express";
import cors from "cors";
import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const app = express();
app.use(cors());

const PORT = 3000;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

let accessToken;
let tokenExpiration;

// consider the token as expired if less than an hour is left until the token expires
const isTokenExpired = () => tokenExpiration - Date.now() < 1000 * 60 * 60;

const fetchAccessToken = async () => {
  if (accessToken && tokenExpiration && !isTokenExpired()) {
    return accessToken;
  }

  const url = "https://id.twitch.tv/oauth2/token";
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "client_credentials",
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Twitch OAuth token: ${response.status}`);
    }

    const res = await response.json();
    accessToken = res.access_token;
    tokenExpiration = Date.now() + res.expires_in * 1000;
    return accessToken;
  } catch (e) {
    console.error("Error fetching Twitch OAuth token:", e);
    return null;
  }
};

const attachToken = async (req, res, next) => {
  const token = await fetchAccessToken();
  if (!token) {
    res.status(500).json({ error: "Failed to get access token" });
  }
  req.accessToken = token;
  next();
};

// return data if the streamer is live, if they are not, returns an empty array
app.get("/streamer", attachToken, async (req, res) => {
  const streamer = req.query.login;
  const url = `https://api.twitch.tv/helix/users?login=${streamer}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Client-ID": CLIENT_ID,
        Authorization: `Bearer ${req.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Error fetching info on streamer's livestream");
    }

    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ message: "Failed to get information on the streamer" });
  }
});

app.get("/vod", attachToken, async (req, res) => {
  const videoId = req.query.id;

  try {
    const url = `https://api.twitch.tv/helix/videos?id=${videoId}`;

    const response = await fetch(url, {
      headers: {
        "Client-ID": CLIENT_ID,
        Authorization: `Bearer ${req.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Error fetching VOD data");
    }

    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to complete VOD request" });
  }
});

app.get("/livestream", attachToken, async (req, res) => {
  const username = req.query.username;

  try {
    const response = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${username}`,
      {
        headers: {
          "Client-ID": CLIENT_ID,
          Authorization: `Bearer ${req.accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Error fetching livestream data");
    }

    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to complete livestream request" });
  }
});

app.get("/vods/:streamerId", attachToken, async (req, res) => {
  const streamerId = req.params.streamerId;

  try {
    const response = await fetch(
      `https://api.twitch.tv/helix/videos?user_id=${streamerId}&type=archive`,
      {
        headers: {
          "Client-ID": CLIENT_ID,
          Authorization: `Bearer ${req.accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Error fetching the streamer's VODs");
    }

    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ message: "Failed to complete request for streamer's VODs" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
