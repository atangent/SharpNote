//Server Code
const http = require("http"); //need to http
const fs = require("fs"); //need to read static files
const url = require("url"); //to parse url strings

const ROOT_DIR = "html"; //dir to serve static files from

const MIME_TYPES = {
  css: "text/css",
  gif: "image/gif",
  htm: "text/html",
  html: "text/html",
  ico: "image/x-icon",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "application/javascript",
  json: "application/json",
  png: "image/png",
  svg: "image/svg+xml",
  txt: "text/plain"
}

const get_mime = function (filename) {
  //Use file extension to determine the correct response MIME type
  for (let ext in MIME_TYPES) {
    if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
      return MIME_TYPES[ext]
    }
  }
  return MIME_TYPES["txt"]
}


http.createServer(function (request, response) {
  var urlObj = url.parse(request.url, true, false)
  console.log("\n============================")
  console.log("PATHNAME: " + urlObj.pathname)
  console.log("REQUEST: " + ROOT_DIR + urlObj.pathname)
  console.log("METHOD: " + request.method)

  var receivedData = ""

  //Event handlers to collect the message data
  request.on("data", function (chunk) {
    receivedData += chunk;
  })

  //Event handler for the end of the message
  request.on("end", function () {
    console.log("received data: ", receivedData)
    console.log("type: ", typeof receivedData)

    //if it is a POST request then echo back the data.
    if (request.method == "POST") {
      //Handle POST requests
      var dataObj = JSON.parse(receivedData)
      console.log("received data object: ", dataObj)
      console.log("type: ", typeof dataObj)
      //Here we can decide how to process the data object and what
      //object to send back to client.

      console.log("USER REQUEST: " + dataObj.text)
      let returnObj = {}

      //Sends the text file string to the client
      returnObj.text = dataObj.text;

      if (dataObj.songtext) {
        fs.writeFile(`../songs/${dataObj.title}.txt`, dataObj.songtext, function (err, data) {
          if (err) { throw err }
          returnObj = JSON.stringify({
            text: "Saved"
          })
        })
      } else {
        fs.readFile(`../songs/${dataObj.text}.txt`, function (err, data) {
          if (err) {
            console.log("No File Found");
          } else {
            let lines = [];
            let array = data.toString().split("\n")

            for (let line of array) {
              let chordLine = "";
              let lyrics = line;
              const chords = lyrics.match(/\[.*?\]/g);

              if (chords) {
                for (let chord of chords) {
                  let index = 0;

                  if (lyrics.indexOf(chord) - chordLine.length < 0 && line.indexOf(chord)) {
                    index = lyrics.indexOf(chord);
                    lyrics = lyrics.substring(0, index) + " ".repeat(chordLine.length - index) + lyrics.substring(index);
                    index = lyrics.indexOf(chord);
                  }

                  index = lyrics.indexOf(chord);
                  lyrics = lyrics.replace(chord, '');

                  for (let x = 0; x < (index - chordLine.length); x++) {
                    chordLine += " ";
                  }
                  chordLine += chord.replace("]", '] ');
                }
              }

              lines.push({ text: chordLine, isChord: true });
              lines.push({ text: lyrics, isChord: false });
            }

            returnObj.wordArray = ""

            for (let i = 0; i < lines.length; i++) {
              if (lines[i].isChord) {
                returnObj.wordArray += lines[i].text;
              } else {
                returnObj.wordArray += lines[i].text;
              }
              if (i != 1) {
                returnObj.wordArray += "\n";
              }
            }

            //object to return to client
            response.writeHead(200, { "Content-Type": MIME_TYPES["txt"] })
            response.end(JSON.stringify(returnObj)) //send just the JSON object as plain text
          }
        });
      }
    }


    if (request.method == "GET") {
      //Handle GET requests
      //Treat GET requests as request for static file
      var filePath = ROOT_DIR + urlObj.pathname
      if (urlObj.pathname === "/") filePath = ROOT_DIR + "/index.html"

      fs.readFile(filePath, function (err, data) {
        if (err) {
          //report error to console
          console.log("ERROR: " + JSON.stringify(err))
          //respond with not found 404 to client
          response.writeHead(404)
          response.end(JSON.stringify(err))
          return
        }

        //respond with file contents
        response.writeHead(200, { "Content-Type": get_mime(filePath) })
        response.end(data)
      })
    }
  })
}).listen(3000)

console.log("Server Running at PORT 3000  CNTL-C to quit")
console.log("To Test:")
console.log("http://localhost:3000/assignment2.html")