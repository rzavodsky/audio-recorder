const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const port = 3000;
const savedAudioPath = "/home/node/audio";

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

app.post("/api/upload", upload.single('audioFile'), (req, res, next) => {
  if (req.file) {
    console.log(req.file);
    const filename = path.basename(req.file.filename, path.extname(req.file.filename));
    const content = JSON.stringify(req.body);
    fs.writeFileSync(path.join(req.file.destination, `${filename}.txt`), content);
    res.sendStatus(204);
  } else {
    res.sendStatus(400);
  }
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
})
