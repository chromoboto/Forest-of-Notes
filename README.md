# Forrest of Notes
Visualizing a notebook as a forrest using WebGL (regl). The forrest is created by representing the notebook structure of topics, subtopics and notes as a stored javascript object. Then that object is parsed in realtime and transpiled into the language of the forrest. Topics become trees with the associated subtopics as its brances and the individual notes as its leaves. The collection of topics form the forrest.

The forrest spins so that the user can interact and explore, clicking on leaves to read the note it represents.

![forestofnotes](https://user-images.githubusercontent.com/40576412/47810555-f0486f80-dd19-11e8-89bb-dc08188bc729.gif)

# To Play With It:
At the terminal:
1. Clone this repository
  `git clone git@github.com:chromoboto/Forrest-of-Notes.git`
2. Navigate into the directory that was just created
  `cd Forrest-of-Notes`
3. Install dependencies
  `npm install`

Then open index.html in the dist subdirectory
