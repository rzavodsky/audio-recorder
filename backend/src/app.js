const express = require("express");
const multer = require("multer");

const port = 3000;
const savedAudioPath = "/home/node/audio";

const app = express();
const upload = multer({ dest: savedAudioPath, fileFilter: fileFilter });

function fileFilter(req, file, cb) {
  cb(null, file.mimetype === "audio/ogg");
}

app.post("/api/upload", upload.single('audioFile'), (req, res, next) => {
  if (req.file) {
    res.sendStatus(204);
  } else {
    res.sendStatus(400);
  }
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
})
