import express from "express";

import bodyParser from "body-parser";

import path from "path";
import fs from "fs"

const app = express()
const port = 4000

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

let project_dir = process.argv[2] + "/.nuxt/php_bindings.json";

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/', (req, res) => {
    let data = req.body;

    let json = JSON.parse(fs.readFileSync(project_dir));
    json[data.uuid] = data.data
    

    fs.writeFileSync(project_dir, JSON.stringify(json));

    res.send(json);
});
  
  
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});