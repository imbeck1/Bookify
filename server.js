import express from "express";
import fetch from "node-fetch";

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use('/styles', express.static('public/styles'));
app.use('/images', express.static('public/images'));
app.use('/fonts', express.static('public/fonts'));

app.get('/', function(req, res) {
    res.render('/index.html')
});

app.get('/authorize', (req, res) => {
    var auth_query_params = new URLSearchParams({
        response_type: "code",
        client_id: "570af0a2076e4abf80da315a7a192e74",
        scope: "",
        redirect_uri: "http://localhost:3000/callback"
    })

    res.redirect("https://accounts.spotify.com/authorize?" + auth_query_params.toString());
});

app.get('/callback', (req, res) => {
    const code = req.query.code;
    console.log(code);
});

// Listening on port 3000
app.listen(port, () => console.info(`Listening on port ${port}`));
