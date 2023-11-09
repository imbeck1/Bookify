import express from "express";
import fetch from "node-fetch";

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use('/styles', express.static('public/styles'));
app.use('/images', express.static('public/images'));
app.use('/fonts', express.static('public/fonts'));

app.set("views", "./views");
app.set("view engine", "ejs");

const redirect_uri = "http://localhost:3000/callback";
const client_id = "570af0a2076e4abf80da315a7a192e74";
const client_secret = "93290bd5c7d54ae19077a53c4cf36f9a";

global.access_token;
global.user_id;

app.get('', (req, res) => {
    res.render('index');
});

app.get('/authorize', (req, res) => {
    var auth_query_params = new URLSearchParams({
        response_type: "code",
        client_id: client_id,
        scope: "user-library-read playlist-modify-public playlist-modify-private",
        redirect_uri: redirect_uri
    })

    res.redirect("https://accounts.spotify.com/authorize?" + auth_query_params.toString());
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    
    var body = new URLSearchParams({
        code: code,
        redirect_uri: redirect_uri,
        grant_type: "authorization_code"
    })

    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "post",
        body: body,
        headers: {
            "Content-type": "application/x-www-form-urlencoded",
            Authorization:
            "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64") 
        }
    })

    const data = await response.json();
    global.access_token = data.access_token;

    res.redirect("homepage");
});

async function getData(endpoint) {
    const response = await fetch("https://api.spotify.com/v1" + endpoint, {
        method: "get",
        headers: {
            Authorization: "Bearer " + global.access_token
        }
    });

    const data = await response.json();
    return data;
}

app.post('/createPlaylist', async (req, res) => {
    // Define the user ID for the user you want to create the playlist for
    const user_id = global.user_id; // Replace with the actual user ID

    // Define the parameters for creating the playlist
    const playlistData = {
        name: "Your Coolest Playlist", // Change to the desired playlist name
        public: true, // Set to true for a public playlist, false for a private one
        collaborative: false, // Set to true for a collaborative playlist, false otherwise
        description: "Your playlist description", // Provide a description if needed
    };

    // Make the POST request to create the playlist
    const response = await fetch(`https://api.spotify.com/v1/users/${user_id}/playlists`, {
        method: "post",
        headers: {
            Authorization: `Bearer ${global.access_token}`,
            "Content-type": "application/json",
        },
        body: JSON.stringify(playlistData),
    });

    // Check if the playlist was created successfully
    if (response.status === 201) {
        // Successfully created the playlist
        res.status(201).send("Playlist created successfully.");
    } else {
        // Failed to create the playlist
        const data = await response.json();
        res.status(response.status).json(data);
    }
});



app.get('/homepage', async (req, res) => {

    const userInfo = await getData("/me");
    const tracks = await getData("/me/tracks?limit=10");
    const playlists = await getData("/me/playlists?limit=10");

    global.user_id = userInfo.id;
    res.render('homepage', {userName: userInfo.display_name, track: tracks, playlists: playlists});
});

// Listening on port 3000
app.listen(port, () => console.info(`Listening on port ${port}`));
