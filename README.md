# Forrest of Notes
Visualizing a notebook as a forrest using WebGL (regl). The forrest is created by representing the notebook structure of topics, subtopics and notes as a stored javascript object. Then that object is parsed in realtime. Topics become trees with the associated subtopics as its brances and the individual notes as its leaves. The collection of topics form the forrest.

The forrest spins so that the user can interact and explore, clicking on leaves to read the note it represents.

<img width="1440" alt="screen shot 2018-10-31 at 11 06 52 am" src="https://user-images.githubusercontent.com/40576412/47797836-7dc99680-dcfd-11e8-99bd-74bc8849e7d5.png">
<img width="1440" alt="screen shot 2018-10-31 at 11 07 32 am" src="https://user-images.githubusercontent.com/40576412/47797833-7c986980-dcfd-11e8-853d-c9c7342d7afe.png">
<img width="1440" alt="screen shot 2018-10-31 at 11 07 06 am" src="https://user-images.githubusercontent.com/40576412/47797837-7e622d00-dcfd-11e8-9344-c3992b10d2ae.png">
<img width="1440" alt="screen shot 2018-10-31 at 11 06 22 am" src="https://user-images.githubusercontent.com/40576412/47797841-802bf080-dcfd-11e8-85ed-b157c81f68c9.png">

# To Play With It:
At the terminal:
1. Clone this repository
  `git clone git@github.com:chromoboto/Forrest-of-Notes.git`
2. Navigate into the directory that was just created
  `cd Forrest-of-Notes`
3. Install dependencies
  `npm install`
Then open index.html in the dist subdirectory
