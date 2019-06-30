const chords = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
const chordsflat = ["A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab"]
const chordsm = ["Am", "Bm", "Cm", "Dm", "Em", "Fm", "Gm", "Bbm", "Dbm", "Ebm", "Gbm", "Abm"];
const chordsmin = ["Amin", "Bmin", "Cmin", "Dmin", "Emin", "Fmin", "Gmin", "Bbmin", "Dbmin", "Ebmin", "Gbmin", "Abmin"];
const flatSpecific = ["Bb", "Db", "Eb", "Gb", "Ab"];

const SONGKEYS = { "SHARP": 0, "FLAT": 1 };
let songKey = 0;

let movingString = {
  xDirection: 1, //+1 for leftwards, -1 for rightwards
  yDirection: 1, //+1 for downwards, -1 for upwards
  stringWidth: 50, //will be updated when drawn
  stringHeight: 24
} //assumed height based on drawing point size

let wordBeingMoved;
let words = [];

let deltaX, deltaY //location where mouse is pressed
const canvas = document.getElementById('canvas1'); //our drawing canvas

function getWordObjects(song) {

  let context = canvas.getContext('2d');

  context.font = '16pt Courier New'
  context.fillStyle = 'cornflowerblue'
  context.strokeStyle = 'blue'

  const wordArray = [];
  const wordObjArray = [];
  //Splits text document by line
  let songWords = song.split("\n");

  let x = 20;
  let y = 50;
  let wordsChangedToObjs = 0;

  for (line in songWords) {
    //Spreads words from each line into an array
    wordArray.push(...songWords[line].split(" "));
    //Turns words in array into objects and assigns them locations
    let count = 0;
    for (word in wordArray) {
      if (count >= wordsChangedToObjs) {
        wordObjArray.push({ word: wordArray[word].replace("[", '').replace("]", ''), x: x, y: y, original: wordArray[word] });
        x += (context.measureText(wordArray[word]).width + 10);
      }
      count += 1;
    }
    wordsChangedToObjs = wordObjArray.length;
    y += 30;
    x = 20;
  }
  return wordObjArray;
}

function getWordAtLocation(aCanvasX, aCanvasY) {
  //locate the word near aCanvasX,aCanvasY
  let context = canvas.getContext('2d')
  for (let i = 0; i < words.length; i++) {
    if (Math.abs(words[i].x - aCanvasX) < context.measureText(words[i].word).width &&
      Math.abs(words[i].y - aCanvasY) < 20) return words[i]
  }
  return null
}

function lineEmpty(line) {
  let result = true;
  for (word in line) {
    if (!line[word].word == "") {
      result = false;
    }
  }
  return result;
}

function refreshTextField() {
  let rect = canvas.getBoundingClientRect()
  let canvasHeight = rect.bottom - rect.top;
  let linesCount = Math.ceil(canvasHeight / 18);
  let orderedWords = [];

  //Makes 2d Array where each inner array is a line in the canvas
  for (let x = 0; x < linesCount; x++) {
    orderedWords.push([]);
  }

  //Adds word to correct line array based on its y coordinate
  for (let word in words) {
    for (let x = 1; x < (linesCount + 1); x++) {
      yCoord = x * 18;
      if (words[word].y < yCoord && words[word].y > yCoord - 18) {
        words[word].row = (x - 1)
        orderedWords[(x - 1)].push(words[word]);
      }
    }
  }

  //Removes inner array from the array if it only consists of empty strings
  for (let line in orderedWords) {
    if (lineEmpty(orderedWords[line])) {
      delete orderedWords[line];
    }
  }

  //Clones the array, making a new instance for each word
  let divArray = orderedWords.map(a => Object.assign([], a));
  for(line in divArray){
    for(word in divArray[line]){
      divArray[line][word] = Object.assign({}, divArray[line][word]);
    }
  }

  //Order word objects by their x coord
  for (let line in divArray) {
    //console.log(divArray[line]);
    divArray[line].sort((a, b) => (a.x > b.x) ? 1 : -1)
  }

  let text = "";
  for (let line in mergeLines(divArray)) {
    for (word in divArray[line]) {
      const currentWordText = divArray[line][word].word;
      if (currentWordText === "" || divArray[line][word].original.includes("[")) {
        text += "&nbsp;";
      } else {
        text += `${currentWordText} `;
      }
    }
    text += "\n";
  }
  //make new variable to store this in
  let textDiv = document.getElementById("text-area")
  textDiv.innerHTML = `<p> ${text.replace(/\n/g, "<br />")} </p>`
  textDiv.style.font = "bold 14pt Courier New"
}

function nextLineIndex(row, orderedWords){
  for(let x = (row + 1); x < orderedWords.length; x++){
    if(orderedWords[x] != undefined){
      return x;
    }
  }
  return row;
}

function chordBelongsInWord(chord, word) {
  let context = canvas.getContext('2d')
  context.font = '16pt Courier New'
  const wordLength = context.measureText(word.word).width;

  if(chord.x >=  word.x && chord.x < (word.x + wordLength + 11)){
    return true;
  } else {
    return false;
  }
}

function mergeWords(chord, word) {
  let context = canvas.getContext('2d')
  context.font = '16pt Courier New'
  const wordLength = context.measureText(word.word).width;
  const characterLength = wordLength / word.word.length;
  const xCoordDifference = chord.x - word.x;
  characterIndex = Math.ceil(characterLength / xCoordDifference);

  result = "";

  for(let i = 0; i < word.word.length; i++){
    if(i == 0 && chord.x == word.x){
      result += chord.original;
    }
    result += word.word.charAt(i);
    if(i == characterIndex){
      result += chord.original;
    }
  }

  return result
}

function mergeLines(orderedWords) {
  //Move chords to correct inner array
  for (let line in orderedWords) {
    for (let word in orderedWords[line]) {
      if (orderedWords[line][word].original.includes("[")) {
        let row = orderedWords[line][word].row;
        orderedWords[nextLineIndex(row, orderedWords)].push(orderedWords[line][word]);
        delete orderedWords[line][word];//idk if this will delete the object from the array or delete it from memory
      }
    }
  }
  for(line in orderedWords){
    for(chord in orderedWords[line]){
      let done = false;
      //checks which word in line the chord belongs in
      if(orderedWords[line][chord].original.includes("[")){
        for(word in orderedWords[line]){
          if(chordBelongsInWord(orderedWords[line][chord], orderedWords[line][word])){
            done = true;
            orderedWords[line][word].word = mergeWords(orderedWords[line][chord], orderedWords[line][word]);
            break;
          }
          if(done == true){break};
        }
      }
    }
  }
  return orderedWords;
}

    function drawCanvas() {
      let context = canvas.getContext('2d')

      context.fillStyle = 'white'
      context.fillRect(0, 0, canvas.width, canvas.height) //erase canvas
      context.font = '16pt Courier New'
      context.fillStyle = 'cornflowerblue'
      context.strokeStyle = 'blue'

      let chordIndices = getChords();

      for (let i = 0; i < words.length; i++) {
        let data = words[i]

        if (chordIndices.indexOf(i) != -1) {
          if (data.word.localeCompare(data.original.replace("[", '').replace("]", '')) === 0) {
            context.fillStyle = 'green';
            context.strokeStyle = 'green';
          } else {
            context.fillStyle = 'gold';
            context.strokeStyle = 'gold';
          }
        }
        context.fillText(data.word, data.x, data.y);
        context.strokeText(data.word, data.x, data.y)

        if (chordIndices.indexOf(i) != -1) {
          context.fillStyle = 'cornflowerblue'
          context.strokeStyle = 'blue'
        }
      }

      movingString.stringWidth = context.measureText(movingString.word).width
      context.fillText(movingString.word, movingString.x, movingString.y)
    }

    function handleMouseDown(e) {

      //get mouse location relative to canvas top left
      let rect = canvas.getBoundingClientRect()
      let canvasX = e.pageX - rect.left
      let canvasY = e.pageY - rect.top

      wordBeingMoved = getWordAtLocation(canvasX, canvasY)
      if (wordBeingMoved != null) {
        deltaX = wordBeingMoved.x - canvasX
        deltaY = wordBeingMoved.y - canvasY
        $("#canvas1").mousemove(handleMouseMove)
        $("#canvas1").mouseup(handleMouseUp)
      }

      e.stopPropagation()
      e.preventDefault()

      drawCanvas()
    }

    function handleMouseMove(e) {
      //get mouse location relative to canvas top left
      let rect = canvas.getBoundingClientRect()
      let canvasX = e.pageX - rect.left
      let canvasY = e.pageY - rect.top

      wordBeingMoved.x = canvasX + deltaX
      wordBeingMoved.y = canvasY + deltaY

      e.stopPropagation()

      drawCanvas()
    }

    function handleMouseUp(e) {
      e.stopPropagation()
      //remove mouse move and mouse up handlers but leave mouse down handler
      $("#canvas1").off("mousemove", handleMouseMove) //remove mouse move handler
      $("#canvas1").off("mouseup", handleMouseUp) //remove mouse up handler

      drawCanvas() //redraw the canvas
    }

    //KEY CODES
    const ENTER = 13
    const UP_ARROW = 38
    const DOWN_ARROW = 40

    function handleKeyDown(e) {

      let keyCode = e.which
      if (keyCode == UP_ARROW | keyCode == DOWN_ARROW) {
        //prevent browser from using these with text input drop downs
        e.stopPropagation()
        e.preventDefault()
      }
    }

    function handleKeyUp(e) {
      //console.log("key UP: " + e.which)
      if (e.which == UP_ARROW | e.which == DOWN_ARROW) {
        //create a JSON string representation of the data object
        let jsonString = JSON.stringify(dataObj)

        $.post("positionData", jsonString, function (data, status) {
          let wayPoint = JSON.parse(data)
          wayPoints.push(wayPoint)
          for (let i in wayPoints) console.log(wayPoints[i])
        })
      }

      if (e.which == ENTER) {
        handleSubmitButton() //treat ENTER key like you would a submit
        $('#userTextField').val('') //clear the user text field
      }

      e.stopPropagation()
      e.preventDefault()
    }

    function handleSubmitButton() {
      let userText = $('#userTextField').val(); //get text from user text input field
      if (userText && userText != '') {
        let userRequestObj = {
          text: userText
        } //make object to send to server
        let userRequestJSON = JSON.stringify(userRequestObj) //make JSON string
        $('#userTextField').val('') //clear the user text field

        //Prepare a POST message for the server and a call back function
        //to catch the server repsonse.
        $.post("userText", userRequestJSON, function (data, status) {
          let responseObj = JSON.parse(data)
          const originalText = responseObj.wordArray;
          movingString.word = responseObj.text
          songKey = SONGKEYS.SHARP
          //replace word array with new words if there are any
          if (originalText) {
            words = getWordObjects(originalText);
            let foundIndices = getChords();

            for (var a = 0; a < foundIndices.length; a++) {
              let chords = (words[foundIndices[a]].word).split("/");

              for (var b = 0; b < chords.length; b++) {
                if (flatSpecific.indexOf(chords[b]) != -1) {
                  // Identifies the key as flat
                  songKey = SONGKEYS.FLAT;
                }
              }
              if (songKey == SONGKEYS.FLAT)
                break;
            }

            //Prints text to textDiv based off canvas word coords
            refreshTextField();


            document.getElementById("tup").onclick = () => {
              transpose(1);
              drawCanvas();
            }

            document.getElementById("tdown").onclick = () => {
              transpose(-1);
              drawCanvas();
            }

            document.getElementById("refresh").onclick = () => {
              refreshTextField();
            }

            document.getElementById("save").onclick = () => {
              saveFile();
            }

            drawCanvas();
          }
        })
      }
    }

    // Finds and returns the indices of chords
    function getChords() {
      let foundIndices = [];
      for (let x in words) {
        if (chords.includes(words[x].word) || chordsflat.includes(words[x].word)) {
          foundIndices.push(parseInt(x));
        } else if (words[x].word.includes("/") || words[x].word.includes("#") || words[x].word.includes("7") || words[x].word.includes("sus")) {
          foundIndices.push(parseInt(x));
        } else if (chordsm.includes(words[x].word) || chordsmin.includes(words[x].word)) {
          foundIndices.push(parseInt(x));
        } else if (words[x].word.includes("[")) {
          foundIndices.push(parseInt(x));
        }
      }
      return foundIndices;
    }

    // Transposes chords
    function transpose(direction) {
      let foundIndices = getChords();

      for (var a = 0; a < foundIndices.length; a++) {
        foundChords = (words[foundIndices[a]].word).split("/");

        let chordString = "";
        // Loops through the chords between the brackets
        for (var b = 0; b < foundChords.length; b++) {

          // Creates a decrementing variable to use in a substring
          for (var c = foundChords[b].length; c > 0; c--) {
            let breakOut = false;

            // Loop through the chord array
            for (let y = 0; y < chords.length; y++) {
              if (songKey == SONGKEYS.SHARP && foundChords[b].substring(0, c).localeCompare(chords[y]) === 0) {
                switch (direction) {
                  // Transpose Up
                  case 1:
                    chordString += chords[(y + 1) % chords.length] + foundChords[b].substring(c);
                    breakOut = true;
                    break;

                  // Transpose Down
                  case -1:
                    let index = y - 1;
                    if (index < 0)
                      chordString += chords[chords.length + index] + foundChords[b].substring(c);
                    else if (index >= 0)
                      chordString += chords[index] + foundChords[b].substring(c);

                    breakOut = true;
                    break;
                }
              } else if (songKey == SONGKEYS.FLAT && foundChords[b].substring(0, c).localeCompare(chordsflat[y]) === 0) {
                switch (direction) {
                  // Transpose Up
                  case 1:
                    chordString += chordsflat[(y + 1) % chordsflat.length] + foundChords[b].substring(c);
                    breakOut = true;
                    break;

                  // Transpose Down
                  case -1:
                    let index = y - 1;
                    if (index < 0)
                      chordString += chordsflat[chordsflat.length + index] + foundChords[b].substring(c);
                    else if (index >= 0)
                      chordString += chordsflat[index] + foundChords[b].substring(c);

                    breakOut = true;
                    break;
                }
              }

              if (breakOut) {
                break;
              }
            }

            if (breakOut) {
              break;
            }
          }
          if (b != foundChords.length - 1)
            chordString += "/";
        }
        words[foundIndices[a]].word = `${chordString}`;
      }
    }

    // Saves text to txt file
    function saveFile(){
      let name = document.querySelector("#userTextField").value;
      let text = document.querySelector("#text-area").innerHTML;
      console.log(text);
      
      text = text.replace("<br>", "\n").replace(/&nbsp;/g, "").replace(/<br><br>/g, "\n").replace(/<br>/g, "\n").replace(/<\/{0,1}p>/g, "")

      if(name && name != ''){
        let userRequestObj = {
          title: name,
          songtext: text,
        }

        let sendObj = JSON.stringify(userRequestObj)
        document.getElementById('userTextField').value = "";

        $.post("userText", sendObj, function (data, status) {
          console.log(data);
        })
      }
    }

    $(document).ready(function () {
      //This is called after the broswer has loaded the web page

      //add mouse down listener to our canvas object
      $("#canvas1").mousedown(handleMouseDown)

      //add key handler for the document as a whole, not separate elements.
      $(document).keydown(handleKeyDown)
      $(document).keyup(handleKeyUp)

      drawCanvas()
    })
