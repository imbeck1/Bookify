import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: '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'
});

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));
app.use('/styles', express.static('public/styles'));
app.use('/images', express.static('public/images'));
app.use('/fonts', express.static('public/fonts'));

app.set("views", "./views");
app.set("view engine", "ejs");

const redirect_uri = "http://localhost:3000/callback";
const client_id = "c283739fecd040e3b4828481d15c6ac2";
const client_secret = "731dc4df1ebb44e5930b8c340d783c80";
const genres = "acoustic, afrobeat, alt-rock, alternative, ambient, anime, black-metal, bluegrass, blues, bossanova, brazil, breakbeat, british, cantopop, chicago-house, children, chill, classical, club, comedy, country, dance, dancehall, death-metal, deep-house, detroit-techno, disco, disney, drum-and-bass, dub, dubstep, edm, electro, electronic, emo, folk, forro, french, funk, garage, german, gospel, goth, grindcore, groove, grunge, guitar, happy, hard-rock, hardcore, hardstyle, heavy-metal, hip-hop, holidays, honky-tonk, house, idm, indian, indie, indie-pop, industrial, iranian, j-dance, j-idol, j-pop, j-rock, jazz, k-pop, kids, latin, latino, malay, mandopop, metal, metal-misc, metalcore, minimal-techno, movies, mpb, new-age, new-release, opera, pagode, party, philippines-opm, piano, pop, pop-film, post-dubstep, power-pop, progressive-house, psych-rock, punk, punk-rock, r-n-b, rainy-day, reggae, reggaeton, road-trip, rock, rock-n-roll, rockabilly, romance, sad, salsa, samba, sertanejo, show-tunes, singer-songwriter, ska, sleep, songwriter, soul, soundtracks, spanish, study, summer, swedish, synth-pop, tango, techno, trance, trip-hop, turkish, work-out, world-music";

global.access_token;
global.user_id;
global.userBook;

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
        Authorization: "Bearer " + global.access_token,
      },
    });
  
    const data = await response.json();
    return data;
  }



const createPlaylist = async (user_id, access_token, book) => {
    // Define the parameters for creating the playlist
    const playlistData = {
        name: "Your Bookify Created '" + book + "' Playlist",
        public: true,
        collaborative: false,
        description: "Listen along while you read " + book,
    };

    // Make the POST request to create the playlist
    const response = await fetch(`https://api.spotify.com/v1/users/${user_id}/playlists`, {
        method: "post",
        headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-type": "application/json",
        },
        body: JSON.stringify(playlistData),
    });

    // Check if the playlist was created successfully
    if (response.status === 201) {
        // Successfully created the playlist
        return { success: true, message: "Playlist created successfully.", id: (await response.json()).id };
    } else {
        // Failed to create the playlist
        const data = await response.json();
        return { success: false, status: response.status, error: data };
    }
};

const addItem = async (playlist_id, uris, access_token) => {
    const itemData = {
        uris: uris,
    };

    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`, {
        method: "post",
        headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-type": "application/json",
        },
        body: JSON.stringify(itemData),
    });

    if (response.status === 201) {
        // Successfully created the playlist
        return { success: true, message: "Item added successfully." };
    } else {
        // Failed to create the playlist
        const data = await response.json();
        return { success: false, status: response.status, error: data };
    }

};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.post('/success', async (req, res) => {
    try {
        const userVariable = req.body.userVariable;

        global.userBook = userVariable;
        console.log('User entered variable:', global.userBook);

        var bookTruth = await isBook(global.userBook);
        
        if (!bookTruth) {
            res.redirect("/homepage?error=invalidBook");
            return;
        }

        var chapters = await howManyChapters(global.userBook);
        console.log(chapters);
        const result = await createPlaylist(global.user_id, global.access_token, global.userBook);

        if (!result.success) {
            console.log("Playlist creation unsuccessful. " + result.status);
            res.redirect('/homepage');
            return;
        }

        var playlistId = result.id;
        var playlistDuration = 0;

        var bookDuration = await time(global.userBook);
        console.log(bookDuration);
        bookDuration = timeToMilliseconds(bookDuration);

        let songsInPlaylist = [];
        
        for (let i = 0; i < chapters; i++) {
            var analysis = await songAnalysis(global.userBook, i);
            var analArray = analysis.split("\n");
            
            for (let j = 0; j < analArray.length; j++) {
                const params = new URLSearchParams({
                    q: analArray[j],
                    type: "track",
                    limit: 1
                });
                
                const data = await getData("/search?" + params);

                if (data.tracks.items[0]) {
                    console.log(data.tracks.items[0].uri);

                    playlistDuration += data.tracks.items[0].duration_ms;

                    var uris = [data.tracks.items[0].uri];
                    
                    if(!songsInPlaylist.includes(uris))
                    {
                        songsInPlaylist.push(uris);
                        var r = await addItem(playlistId, uris, global.access_token);
                        console.log(r);
                    }
                    else{
                        console.log("Item already in playlist.")
                    }
                } else {
                    console.log("No track found in the data.");
                }
            }
            //await delay(1000);
            if(playlistDuration > bookDuration)
            {
                i = chapters;
            }
        }

        const playlists = await getData(`/users/${global.user_id}/playlists?limit=1`);
        res.render("success", { playlists: playlists });
    } catch (error) {
        console.error("An error occurred:", error);
        restartServer();
        res.redirect('/homepage');
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


async function isBook(book) {
    const completion = await openai.chat.completions.create({
      messages: [
        {"role": "system", "content": "Given a book, please tell me whether or not it is a book. Provide only true or false"},
        { "role": "user", "content": "Is " + book + " a book?"}
    ],
      model: "ft:gpt-3.5-turbo-0613:personal::8QSqHWDP"
    })
  
    const messageContent = completion.choices[0].message.content;
  
    if(messageContent === 'yes')
    {
      return true;
    }
    else{
      return false;
    }
  
}
  
  async function howManyChapters(book) {
    const completion = await openai.chat.completions.create({
      messages: [
        {"role": "system", "content": "How many chapters are in a given book? Provide only a number."},
        { "role": "user", "content": "How many chapters are in "+ book + "?"}
    ],
      model: "ft:gpt-3.5-turbo-0613:personal::8QSqHWDP"
    })
  
    const messageContent = completion.choices[0].message.content;
    return messageContent;
  }

  async function fullAnalysis(book, gen, chapterNum){
    const completion = await openai.chat.completions.create({
      messages: [
        {"role": "system", "content": "Given a chapter in a given book, analyze the chapter in that book and list themes as they appear in each chapter. After the list of themes is compiled, assign each theme a short list of given genres. Output only up to five genres that exist in the given list. Output each list on a new line."},
        { "role": "user", "content": "Please analyze chapter " + chapterNum + "from " + book + " and assign it a list of genres that exist within the following list: " + gen + "Please limit to 5 lists per chapter."}
      ],
      model: "ft:gpt-3.5-turbo-0613:personal::8QSqHWDP"
    })
  
    const messageContent = completion.choices[0].message.content;
    return messageContent;
  }

  async function songAnalysis(book, chapterNum){
    const completion = await openai.chat.completions.create({
      messages: [
        {"role": "system", "content": "Given a chapter in a given book, analyze the chapter in that book and list themes as they appear in each chapter. After the list of themes is compiled, assign each theme a song that would best relate to that theme."},
        {"role": "user", "content": "Please analyze chapter " + chapterNum + " from " + book + " and assign it a song that would best relate to its themes."}
      ],
      model: "ft:gpt-3.5-turbo-0613:personal::8QSqHWDP"
    })
  
    const messageContent = completion.choices[0].message.content;
    return messageContent;
  }

  async function time(book) {
    const completion = await openai.chat.completions.create({
      messages: [
        {"role": "system", "content": "Given a book, how much time does it take to read that book?"},
        { "role": "user", "content": "How much time does it take to read " + book + "? Answer in hours and minutes in XX:XX format."}],
      model: "ft:gpt-3.5-turbo-0613:personal::8QSqHWDP"
    });
  
    const messageContent = completion.choices[0].message.content;
    return messageContent;
  }


  function timeToMilliseconds(timeString) {
    // Split the time string into hours and minutes
    const [hours, minutes] = timeString.split(':').map(Number);
  
    // Calculate the total milliseconds
    const totalMilliseconds = (hours * 60 + minutes) * 60 * 1000;
  
    return totalMilliseconds;
  }

  function restartServer() {
    console.log("Restarting the server...");

    // Close the server gracefully before restarting.
    app.close(() => {
        // You can perform any cleanup or additional actions before restarting.
        console.log("Server closed. Restarting...");

        // Start the server again.
        const childProcess = require('child_process');
        const path = require('path');
        const scriptPath = path.join(__dirname, 'server.js');

        // The process is spawned detached to allow the parent to exit.
        const newServerProcess = childProcess.spawn('node', [scriptPath], {
            detached: true,
            stdio: 'inherit'
        });

        // Exit the parent process to allow the new server process to take over.
        newServerProcess.unref();
        process.exit();
    });
}