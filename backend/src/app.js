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

async function parseUploadBody(body) {
    const clips = await getClipNames();

    let { markerBeginning, markerEnd, audioClipBefore, audioClipAfter, ...rest} = body;
    if (Object.keys(rest).length !== 0) { // Too many properties
        return null;
    }

    markerBeginning = parseFloat(markerBeginning);
    if (markerBeginning === NaN) {
        return null;
    }

    markerEnd = parseFloat(markerEnd);
    if (markerEnd === NaN) {
        return null;
    }

    if (audioClipBefore === "null") {
        audioClipBefore = null;
    } else {
        if (audioClipBefore in clips) {
            audioClipBefore = path.relative(audioClipsPath, clips[audioClipBefore]);
        } else {
            return null;
        }
    }

    if (audioClipAfter === "null") {
        audioClipAfter = null;
    } else {
        if (audioClipAfter in clips) {
            audioClipAfter = path.relative(audioClipsPath, clips[audioClipAfter]);
        } else {
            return null;
        }
    }
    return {
        audioClipBefore,
        audioClipAfter,
        markerBeginning,
        markerEnd,
    };
}

app.post("/api/upload", upload.single('audioFile'), async (req, res, next) => {
    if (!req.file) {
        res.sendStatus(400);
        return;
    }
    const filename = path.basename(req.file.filename, path.extname(req.file.filename));
    console.log(req.body);
    const body = await parseUploadBody(req.body);
    if (body === null) {
        res.sendStatus(400);
        fs.unlink(req.file.path);
        return;
    }

    await fs.writeFile(path.join(req.file.destination, `${filename}.json`), JSON.stringify(body));
    res.sendStatus(204);
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
