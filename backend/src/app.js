const express = require("express");
const multer = require("multer");
const fs = require("node:fs/promises");
const path = require("path");

const port = 3000;
const savedAudioPath = "/home/node/audio";
const audioClipsPath = "/home/node/clips";

const app = express();

const storage = multer.diskStorage({
  destination: savedAudioPath,
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1E9) + ".ogg";
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage, fileFilter: fileFilter });

function fileFilter(req, file, cb) {
  cb(null, file.mimetype === "audio/ogg");
}

async function getClipNames() {
    const files = await fs.readdir(audioClipsPath);
    let clipNames = {};
    for (const file of files) {
        const name = path.basename(file, path.extname(file));
        if (name.startsWith(".")) continue;
        clipNames[name] = path.join(audioClipsPath, file);
    }
    return clipNames;
}

app.post("/api/upload", upload.single('audioFile'), async (req, res, next) => {
  if (req.file) {
    console.log(req.file);
    const filename = path.basename(req.file.filename, path.extname(req.file.filename));
    const content = JSON.stringify(req.body);
    await fs.writeFile(path.join(req.file.destination, `${filename}.json`), content);
    res.sendStatus(204);
  } else {
    res.sendStatus(400);
  }
});

app.get("/api/clips", async (req, res) => {
    const clipNames = await getClipNames();
    res.json({clips: Object.keys(clipNames)});
});

app.get("/api/clip/:name", async (req, res) => {
    const clipNames = await getClipNames();
    if (!(req.params.name in clipNames)) {
        res.sendStatus(404);
        return;
    }
    res.sendFile(clipNames[req.params.name]);
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
})
