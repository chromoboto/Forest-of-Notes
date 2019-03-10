import getNotes from './notes';

const nCanvas = document.getElementById('notes');
const regl = require('regl')({ canvas: nCanvas });
const mat4 = require('gl-mat4');
const vec3 = require('gl-vec3');
// window.addEventListener('resize', fit(canvas), false)
// const normals = require('angle-normals');
const mp = require('mouse-position')(nCanvas);
const mb = require('mouse-pressed')(nCanvas);

const notes = getNotes();

let viewMatrix = new Float32Array([1, -0, 0, 0, 0, 0.876966655254364,
  0.48055124282836914, 0, -0, -0.48055124282836914, 0.876966655254364,
  0, 0, 0, -11.622776985168457, 1]);
let projectionMatrix = new Float32Array(16);

const toggleBtn = document.getElementById('toggleBtn');
const noteCloseBtn = document.getElementById('closeNote');
const noteDisp = document.getElementById('noteDisplay');

let iSelectedMesh = -1;
// let rayOrigin;

function resizeCanvas() {
  nCanvas.height = window.innerHeight;
  nCanvas.width = window.innerWidth;
}

function initializeCanvas() {
  // Register an event listener to call the resizeCanvas() function
  // each time the window is resized.
  window.addEventListener('resize', resizeCanvas, false);
  // Draw canvas border for the first time.
  resizeCanvas();
}

let paused = false;

let selectedNote = -1;

const leaves = [];

function togglePause() {
  toggleBtn.textContent = 'Resume';
  if (paused === false) {
    toggleBtn.textContent = 'Click to Resume';
    paused = true;
  } else {
    toggleBtn.textContent = 'Click to Pause';
    paused = false;
  }
}

function showNote(n) {
  noteDisp.innerHTML = leaves[n];

  noteCloseBtn.style.visibility = 'visible';

  document.getElementById('drawer').classList.add('drawer-wide');
  document.getElementById('drawer').classList.remove('drawer-thin');
}

function closeNote() {
  noteCloseBtn.style.visibility = 'hidden';

  noteDisp.innerHTML = 'Click Leaves To Explore Notes';

  document.getElementById('drawer').classList.add('drawer-thin');
  document.getElementById('drawer').classList.remove('drawer-wide');

  iSelectedMesh = -1;
}

function initBtns() {
  toggleBtn.onclick = () => togglePause();
  noteCloseBtn.onclick = () => closeNote();
}


// Below is a slightly modified version of this code:
// https://github.com/substack/ray-triangle-intersection
// It does intersection between ray and triangle.
// With the original version, we had no way of accessing 't'
// But we really needed that value.
function intersectTriangle(out, pt, dir, tri) {
  const EPSILON = 0.000001;
  const edge1 = [0, 0, 0];
  const edge2 = [0, 0, 0];
  const tvec = [0, 0, 0];
  const pvec = [0, 0, 0];
  const qvec = [0, 0, 0];

  vec3.subtract(edge1, tri[1], tri[0]);
  vec3.subtract(edge2, tri[2], tri[0]);

  vec3.cross(pvec, dir, edge2);
  const det = vec3.dot(edge1, pvec);

  if (det < EPSILON) return null;

  vec3.subtract(tvec, pt, tri[0]);
  const u = vec3.dot(tvec, pvec);
  if (u < 0 || u > det) return null;
  vec3.cross(qvec, tvec, edge1);
  const v = vec3.dot(dir, qvec);
  if (v < 0 || u + v > det) return null;

  const t = vec3.dot(edge2, qvec) / det;

  const resultingOut = out;

  resultingOut[0] = pt[0] + (t * dir[0]);
  resultingOut[1] = pt[1] + (t * dir[1]);
  resultingOut[2] = pt[2] + (t * dir[2]);
  return t;
}


// ******************************* Tree geometry creation

const startSegLength = 10;

function rightOrLeftBranch() {
  if (Math.random() >= 0.5) {
    return '+';
  }
  return '-';
}

function randomNumE() {
  const numE = Math.floor((Math.random() * 4));
  let stringOfEs = '';
  for (let i = 0; i < numE; i += 1) {
    stringOfEs += 'E';
  }
  return stringOfEs;
}

function createForestExpression() {
  let theForestExpression = '';

  Object.keys(notes).forEach((treeKey) => {
    // key: the name of the object key
    // index: the ordinal position of the key within the object
    theForestExpression += `T${randomNumE()}`;

    Object.keys(notes[treeKey]).forEach((branchKey) => {
      theForestExpression += `E[${rightOrLeftBranch()}B`;
      Object.keys(notes[treeKey][branchKey]).forEach((leafKey) => {
        leaves.push(`<h6 style="display: inline; margin-top: 0px; padding-top: 0px"> Topic: </h6>${treeKey}<br> <h6 style="display: inline;"> Title: </h6>${branchKey}<br> <h6 style="display: inline;"> Note: </h6>${notes[treeKey][branchKey][leafKey]}`);
        theForestExpression += `E${rightOrLeftBranch()}[L]`;
      });
      // end the branch
      theForestExpression += `]${randomNumE()}`;
    });
  });
  return theForestExpression;
}


const plantVars = {
  drawSegLength: startSegLength,
  numLineSegmentsBuffered: 0,
  currentPosition: { x: 0, y: 0, z: 0 },
  savedPositions: { x: [0], y: [0], z: [0] },
  currentAngle: [0, 0, 0],
  savedAngles: [],
  currentSymbol: 'X',
  ExpressionToRun: '',
};

// all of the lines to draw that make up the plant
const plantBuffer = {};
// all of the triangles to draw that make up the leaves of the plant
const leafBuffer = {};

function drawForward(o, type) {
  const prevPositionX = plantVars.currentPosition.x;
  const prevPositionY = plantVars.currentPosition.y;
  const prevPositionZ = plantVars.currentPosition.z;

  let r = vec3.create();

  r = vec3.random(r, 5);

  const tx = (r[0] + o[0]) / 2;
  const ty = (r[1] + o[1]) / 2;
  const tz = (r[2] + o[2]) / 2;

  // normalize the vector
  const m = Math.sqrt((tx * tx) + (ty * ty) + (tz * tz));

  if (type === 'extend') {
    plantVars.currentPosition.x += (tx / m) * Math.random();
    plantVars.currentPosition.y += (ty / m) * Math.random();
    plantVars.currentPosition.z += (tz / m) * Math.random();
  } else if (type === 'leaf') {
    plantVars.currentPosition.x += tx / m / 5;
    plantVars.currentPosition.y += ty / m / 5;
    plantVars.currentPosition.z += tz / m / 5;

    // add to leaf buffer
    const segName = `segment${plantVars.numLineSegmentsBuffered}`;

    plantVars.numLineSegmentsBuffered += 1;

    const thirdx = prevPositionX;
    const thirdy = prevPositionY - 0.5;
    const thirdz = prevPositionZ;

    leafBuffer[segName] = [prevPositionX, prevPositionY, prevPositionZ,
      plantVars.currentPosition.x, plantVars.currentPosition.y, plantVars.currentPosition.z,
      thirdx, thirdy, thirdz];
  } else {
    plantVars.currentPosition.x += tx / m;
    plantVars.currentPosition.y += ty / m;
    plantVars.currentPosition.z += tz / m;
  }

  const segName = `segment${plantVars.numLineSegmentsBuffered}`;

  plantVars.numLineSegmentsBuffered += 1;

  // Save the line for drawing to the screen
  plantBuffer[segName] = [prevPositionX, prevPositionY, prevPositionZ,
    plantVars.currentPosition.x, plantVars.currentPosition.y, plantVars.currentPosition.z];
}

function plantRun() {
  // Move to the next symbol
  if (plantVars.ExpressionToRun.length === 0) {
    return;
  }

  plantVars.currentSymbol = plantVars.ExpressionToRun.slice(0, 1);
  plantVars.ExpressionToRun = plantVars.ExpressionToRun.substring(1);

  switch (plantVars.currentSymbol) {
    case 'T': {
      // MAKE A TREE

      // Reset the draw length size incase this is not the first tree
      plantVars.drawSegLength = startSegLength;

      // Make the base of the tree
      plantVars.currentPosition.x = (Math.random() * 25) - 12.5;
      plantVars.currentPosition.y = -2.0;
      plantVars.currentPosition.z = (Math.random() * 25) - 12.5;

      const oT = [0, 50, 0];

      plantVars.currentAngle = [0, 50, 0];
      plantVars.savedAngles.push[0, 50, 0];

      drawForward(oT, 'tree');
      break;
    }
    case 'B': {
      // MAKE A BRANCH
      const oB = plantVars.currentAngle;

      // Create the base of the Branch
      drawForward(oB, 'branch');
      break;
    }
    case 'L': {
      const oL = [0, 0, 0];
      drawForward(oL, 'leaf');
      break;
    }
    case 'E': {
      // EXTEND
      const oE = plantVars.currentAngle;
      drawForward(oE, 'extend');
      break;
    }
    case '[': {
      /* save the current values for position and angle, which are
      * restored when the corresponding "]" is executed.
      */
      plantVars.savedAngles.push(plantVars.currentAngle);

      plantVars.savedPositions.x.push(plantVars.currentPosition.x);
      plantVars.savedPositions.y.push(plantVars.currentPosition.y);
      plantVars.savedPositions.z.push(plantVars.currentPosition.z);
      break;
    }
    case ']':
      /* return to the previous position before beggining to draw the
       * latest offshoot
       */
      plantVars.currentAngle = plantVars.savedAngles.pop();

      plantVars.currentPosition.x = plantVars.savedPositions.x.pop();
      plantVars.currentPosition.y = plantVars.savedPositions.y.pop();
      plantVars.currentPosition.z = plantVars.savedPositions.z.pop();
      break;
    case '+':
      // + means "turn right 25°"
      plantVars.currentAngle = [plantVars.currentAngle[0] *
        Math.random(), plantVars.currentAngle[1] *
        Math.random(), plantVars.currentAngle[2] * Math.random()];
      break;
    case '-':
      // − means "turn left 25°"
      plantVars.currentAngle = [plantVars.currentAngle[0] *
        Math.random(), plantVars.currentAngle[1] *
        Math.random(), plantVars.currentAngle[2] * Math.random()];
      break;
    default:
      break;
  }
  plantVars.drawSegLength = plantVars.drawSegLength;// * 0.96;
  plantRun();
}

function plantInit() {
  plantVars.currentSymbol = '';
  plantVars.ExpressionToRun = createForestExpression();

  plantRun();
}

/*
function traversePlant(t) {
  // given a point p, figure out what point is next sequentially on the plant
  const arr = Object.values(plantBuffer);

  const indexIntoArr = Math.floor(t) % arr.length;

  return arr[indexIntoArr];
}
*/

// *****************************************************

//
// Create plane geometry
//

const planeElements = [];
const planePosition = [];
const planeNormal = [];

planePosition.push([-0.5, 0.0, -0.5]);
planePosition.push([+0.5, 0.0, -0.5]);
planePosition.push([-0.5, 0.0, +0.5]);
planePosition.push([+0.5, 0.0, +0.5]);

planeNormal.push([0.0, 1.0, 0.0]);
planeNormal.push([0.0, 1.0, 0.0]);
planeNormal.push([0.0, 1.0, 0.0]);
planeNormal.push([0.0, 1.0, 0.0]);

planeElements.push([3, 1, 0]);
planeElements.push([0, 2, 3]);


//
// Create box geometry.
//

const boxPosition = [
  // side faces
  [-0.5, +0.5, +0.5], [+0.5, +0.5, +0.5],
  [+0.5, -0.5, +0.5], [-0.5, -0.5, +0.5], // positive z face.
  [+0.5, +0.5, +0.5], [+0.5, +0.5, -0.5],
  [+0.5, -0.5, -0.5], [+0.5, -0.5, +0.5], // positive x face
  [+0.5, +0.5, -0.5], [-0.5, +0.5, -0.5],
  [-0.5, -0.5, -0.5], [+0.5, -0.5, -0.5], // negative z face
  [-0.5, +0.5, -0.5], [-0.5, +0.5, +0.5],
  [-0.5, -0.5, +0.5], [-0.5, -0.5, -0.5], // negative x face.
  [-0.5, +0.5, -0.5], [+0.5, +0.5, -0.5],
  [+0.5, +0.5, +0.5], [-0.5, +0.5, +0.5], // top face
  [-0.5, -0.5, -0.5], [+0.5, -0.5, -0.5],
  [+0.5, -0.5, +0.5], [-0.5, -0.5, +0.5], // bottom face
];

const boxElements = [
  [2, 1, 0], [2, 0, 3],
  [6, 5, 4], [6, 4, 7],
  [10, 9, 8], [10, 8, 11],
  [14, 13, 12], [14, 12, 15],
  [18, 17, 16], [18, 16, 19],
  [20, 21, 22], [23, 20, 22],
];

// all the normals of a single block.
const boxNormal = [
  // side faces
  [0.0, 0.0, +1.0], [0.0, 0.0, +1.0], [0.0, 0.0, +1.0], [0.0, 0.0, +1.0],
  [+1.0, 0.0, 0.0], [+1.0, 0.0, 0.0], [+1.0, 0.0, 0.0], [+1.0, 0.0, 0.0],
  [0.0, 0.0, -1.0], [0.0, 0.0, -1.0], [0.0, 0.0, -1.0], [0.0, 0.0, -1.0],
  [-1.0, 0.0, 0.0], [-1.0, 0.0, 0.0], [-1.0, 0.0, 0.0], [-1.0, 0.0, 0.0],
  // top
  [0.0, +1.0, 0.0], [0.0, +1.0, 0.0], [0.0, +1.0, 0.0], [0.0, +1.0, 0.0],
  // bottom
  [0.0, -1.0, 0.0], [0.0, -1.0, 0.0], [0.0, -1.0, 0.0], [0.0, -1.0, 0.0],
];

// keeps track of all global state.
const globalScope = regl({
  uniforms: {
    lightDir: [0.4, 0.6, 0.1],
    view: () => viewMatrix,
    projection: ({ viewportWidth, viewportHeight }) =>
      mat4.perspective(
        projectionMatrix,
        Math.PI / 4,
        viewportWidth / viewportHeight,
        0.01,
        1000,
      ),
  },
});

let savedTick = 0;

let offset = 0;

// render object with phong shading.
const drawNormal = regl({
  frag: `
  precision mediump float;
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float ambientLightAmount;
  uniform float diffuseLightAmount;
  uniform vec3 color;
  uniform vec3 lightDir;
  void main () {
    vec3 ambient = ambientLightAmount * color;
    float cosTheta = dot(vNormal, lightDir);
    vec3 diffuse = diffuseLightAmount * color * clamp(cosTheta , 0.0, 1.0 );
    gl_FragColor = vec4((ambient + diffuse), 1.0);
  }`,
  vert: `
  precision mediump float;
  attribute vec3 position;
  attribute vec3 normal;
  varying vec3 vPosition;
  varying vec3 vNormal;
  uniform mat4 projection, view, model;
  void main() {
    vec4 worldSpacePosition = model * vec4(position, 1);
    vPosition = worldSpacePosition.xyz;
    vNormal = normal;
    gl_Position = projection * view * worldSpacePosition;
  }`,
  uniforms: {
    angle: ({ tick }) => {
      if (paused === false) {
        savedTick = tick - offset;
      } else {
        offset = tick - savedTick;
      }
      return 0.1 * (tick - offset);
    },
    model: mat4.identity([]),
    view: ({ tick }) => {
      if (paused === false) {
        savedTick = tick - offset;
      } else {
        offset = tick - savedTick;
      }
      const t = 0.01 * (tick - offset);


      viewMatrix = mat4.lookAt(
        [],
        [30 * Math.cos(t), 2.5, 30 * Math.sin(t)],
        [0, 2.5, 0],
        [0, 1, 0],
      );

      return viewMatrix;
    },
    projection: ({ viewportWidth, viewportHeight }) => {
      projectionMatrix = mat4.perspective(
        [],
        Math.PI / 4,
        viewportWidth / viewportHeight,
        0.01,
        1000,
      );

      return projectionMatrix;
    },
  },
});

// render the object slightly bigger than it should be.  this is used
// to draw the outline.  but we don't write to the depth buffer.  this
// allows us to draw the object(that we wish to draw the outline for)
// onto the slightly bigger object, thus forming the outine.
const drawOutline = regl({
  frag: `
  precision mediump float;
  void main () {
    gl_FragColor = vec4(vec3(0.7, 0.8, 0.9), 1.0);
  }`,
  vert: `
  precision mediump float;
  attribute vec3 position;
  attribute vec3 normal;
  uniform mat4 projection, view, model;
  uniform bool isRound;
  void main() {
    float s = 1.0;
    vec4 worldSpacePosition = model * vec4(
      // for objects with lots of jagged edges, the ususal approach doesn't work.
      // We use an alternative way of enlarging the object for such objects.
      isRound ? (position + normal * s) : (position * (0.3*s+1.0)),
      1);
    gl_Position = projection * view * worldSpacePosition;
  }`,
  uniforms: {
    angle: ({ tick }) => {
      if (paused === false) {
        savedTick = tick - offset;
      } else {
        offset = tick - savedTick;
      }
      return 0.1 * (tick - offset);
    },
    model: mat4.identity([]),
    view: ({ tick }) => {
      if (paused === false) {
        savedTick = tick - offset;
      } else {
        offset = tick - savedTick;
      }
      const t = 0.01 * (tick - offset);


      viewMatrix = mat4.lookAt(
        [],
        [30 * Math.cos(t), 2.5, 30 * Math.sin(t)],
        [0, 2.5, 0],
        [0, 1, 0],
      );

      return viewMatrix;
    },
    projection: ({ viewportWidth, viewportHeight }) => {
      projectionMatrix = mat4.perspective(
        [],
        Math.PI / 4,
        viewportWidth / viewportHeight,
        0.01,
        1000,
      );
      return projectionMatrix;
    },
  },

  depth: {
    enable: true,
    mask: false, // DONT write to depth buffer!
  },
});

function Mesh(elements, position, normal) {
  this.elements = elements;
  this.position = position;
  this.normal = normal;
}

function createModelMatrix(props) {
  const m = mat4.identity([]);

  mat4.translate(m, m, props.translate);

  const s = props.scale;
  mat4.scale(m, m, [s, s, s]);

  return m;
}

Mesh.prototype.draw = regl({
  uniforms: {
    model: (_, props) => createModelMatrix(props),
    ambientLightAmount: 0.56,
    diffuseLightAmount: 0.64,
    color: regl.prop('color'),
    isRound: regl.prop('isRound'),
  },
  attributes: {
    position: regl.this('position'),
    normal: regl.this('normal'),
  },
  elements: regl.this('elements'),
  cull: {
    enable: true,
  },
});

const boxMesh = new Mesh(boxElements, boxPosition, boxNormal);
const planeMesh = new Mesh(planeElements, planePosition, planeNormal);

const meshes = [
  /*
  {scale: 0.2, translate: [0.0, 0.0, 0.0], color: [0.6, 0.0, 0.0], mesh: bunnyMesh},

  {scale: 2.0, translate: [4.0, 1.0, 0.0], color: [0.6, 0.0, 0.0], mesh: boxMesh},
  */
];


function setUpMeshes() {
  Object.keys(leafBuffer).forEach((keyL) => {
    // key: the name of the object key
    // index: the ordinal position of the key within the object
    meshes.push({
      scale: 0.5,
      translate: leafBuffer[keyL],
      color: [0.1, 0.99, 0.1],
      mesh: boxMesh,
    });
  });
}

// RENDER THE LEAF MESHES
function drawLeafMeshes() {
  regl.frame(() => {
    /*
    regl.clear({
      color: [0, 0, 0, 255],
      depth: 1
    })
    */
    globalScope(() => {
      let m;
      for (let i = 0; i < meshes.length; i += 1) {
        m = meshes[i];
        if (i !== iSelectedMesh) {
          // draw object normally.
          drawNormal(() => {
            m.mesh.draw(m);
          });
        }
      }

      // we need to render the selected object last.
      if (iSelectedMesh !== -1) {
        m = meshes[iSelectedMesh];

        if (selectedNote !== iSelectedMesh) {
          selectedNote = iSelectedMesh;
        }
        showNote(iSelectedMesh);

        drawOutline(() => {
          m.isRound = (m.mesh !== boxMesh);
          m.mesh.draw(m);
        });

        // then draw object normally.
        drawNormal(() => {
          m.mesh.draw(m);
        });
      }
    });
  });
}

// RENDER THE LINES
function drawTreesLines() {
  Object.keys(plantBuffer).forEach((key,index) => {
    // key: the name of the object key
    // index: the ordinal position of the key within the object
    const drawLines = regl({
      frag: `
      precision mediump float;
      uniform vec4 color;
      void main() {
          gl_FragColor = color;
      }`,

      vert: `
      precision mediump float;
      attribute vec3 position;
      uniform float angle;
      uniform mat4 model, view, projection;
      void main() {
          gl_Position = projection * view * model * vec4(position, 1);
      }`,

      attributes: {
        position: regl.prop('position'),
      },

      uniforms: {
        color: regl.prop('color'),
        angle: ({ tick }) => {
          if (paused === false) {
            savedTick = tick - offset;
          } else {
            offset = tick - savedTick;
          }
          return 0.1 * (tick - offset);
        },
        model: mat4.identity([]),
        view: ({ tick }) => {
          if (paused === false) {
            savedTick = tick - offset;
          } else {
            offset = tick - savedTick;
          }
          const t = 0.01 * (tick - offset);


          viewMatrix = mat4.lookAt(
            [],
            [30 * Math.cos(t), 2.5, 30 * Math.sin(t)],
            [0, 2.5, 0],
            [0, 1, 0],
          );

          return viewMatrix;
        },
        projection: ({ viewportWidth, viewportHeight }) => {
          projectionMatrix = mat4.perspective(
            [],
            Math.PI / 4,
            viewportWidth / viewportHeight,
            0.01,
            1000,
          );
          return projectionMatrix;
        },
      },

      depth: {
        enable: false,
      },

      count: 2,

      primitive: 'lines',
    });

    regl.frame(() => {
      drawLines({
        color: [0, 0, 0, 1],
        position: plantBuffer[key],
      });
    });
  });
}


// RENDER THE MESHES

let pointNum = 0;

const groundBuffer = {};

const groundLines = {};

function initGround() {
  let prevPoint = [0, -2.0, 0];

  for (let i = 0; i < 100; i += 1) {
    const newPoint = [(Math.random() * 40) - 20, -2.0, (Math.random() * 40) - 20];
    groundBuffer[pointNum] = newPoint;

    groundLines[pointNum] = [prevPoint[0], prevPoint[1], prevPoint[2],
      newPoint[0], newPoint[1], newPoint[2]];

    prevPoint = newPoint;
    pointNum += 1;
  }
}


// GROUND POINTS
function drawGroundPoints() {
  Object.keys(groundBuffer).forEach((key) => {
    const drawGround = regl({
      frag: `
      precision lowp float;
      varying vec4 fragColor;
      void main() {
        if (length(gl_PointCoord.xy - 0.5) > 0.5) {
          discard;
        }
        gl_FragColor = vec4(fragColor);
      }`,

      vert: `
      precision mediump float;
      attribute vec3 position;
      attribute vec4 color;
      uniform float angle;
      uniform mat4 model, view, projection;
      varying vec4 fragColor;
      void main() {
          gl_PointSize = 5.0;
          gl_Position = projection * view * model * vec4(position, 1);
          fragColor = color;
      }`,

      attributes: {
        position: regl.prop('position'),
        color: regl.prop('color'),
      },

      uniforms: {
        angle: ({ tick }) => {
          if (paused === false) {
            savedTick = tick - offset;
          } else {
            offset = tick - savedTick;
          }
          return 0.1 * (tick - offset);
        },
        model: mat4.identity([]),
        view: ({ tick }) => {
          if (paused === false) {
            savedTick = tick - offset;
          } else {
            offset = tick - savedTick;
          }
          const t = 0.01 * (tick - offset);


          viewMatrix = mat4.lookAt(
            [],
            [30 * Math.cos(t), 2.5, 30 * Math.sin(t)],
            [0, 2.5, 0],
            [0, 1, 0],
          );

          return viewMatrix;
        },
        projection: ({ viewportWidth, viewportHeight }) => {
          projectionMatrix = mat4.perspective(
            [],
            Math.PI / 4,
            viewportWidth / viewportHeight,
            0.01,
            1000,
          );

          return projectionMatrix;
        },
      },

      depth: {
        enable: false,
      },

      count: 1,

      primitive: 'points',
    });

    regl.frame(() => {
      drawGround({
        color: [0.2, 0.2, 0.2, 1],
        position: groundBuffer[key],
      });
    });
  });
}


// GROUND LINES
function drawGroundLines() {
  Object.keys(groundLines).forEach((key) => {
    // key: the name of the object key
    // index: the ordinal position of the key within the object
    const drawGroundLines = regl({
      frag: `
      precision mediump float;
      uniform vec4 color;
      void main() {
          gl_FragColor = color;
      }`,

      vert: `
      precision mediump float;
      attribute vec3 position;
      uniform float angle;
      uniform mat4 model, view, projection;
      void main() {
          gl_Position = projection * view * model * vec4(position, 1);
      }`,

      attributes: {
        position: regl.prop('position'),
      },

      uniforms: {
        color: regl.prop('color'),
        angle: ({ tick }) => {
          if (paused === false) {
            savedTick = tick - offset;
          } else {
            offset = tick - savedTick;
          }
          return 0.1 * (tick - offset);
        },
        model: mat4.identity([]),
        view: ({ tick }) => {
          if (paused === false) {
            savedTick = tick - offset;
          } else {
            offset = tick - savedTick;
          }
          const t = 0.01 * (tick - offset);

          viewMatrix = mat4.lookAt(
            [],
            [30 * Math.cos(t), 2.5, 30 * Math.sin(t)],
            [0, 2.5, 0],
            [0, 1, 0],
          );

          return viewMatrix;
        },
        projection: ({ viewportWidth, viewportHeight }) => {
          projectionMatrix = mat4.perspective(
            [],
            Math.PI / 4,
            viewportWidth / viewportHeight,
            0.01,
            1000,
          );

          return projectionMatrix;
        },
      },

      depth: {
        enable: false,
      },

      count: 2,

      primitive: 'lines',
    });

    regl.frame(() => {
      drawGroundLines({
        color: [0, 0, 0, 0.1],
        position: groundLines[key],
      });
    });
  });
}

function initNotes() {
  initializeCanvas();
  initBtns();
  plantInit();
  setUpMeshes();
  drawLeafMeshes();
  drawTreesLines();
  initGround();
  drawGroundPoints();
  drawGroundLines();

  // on click ,we raycast.
  mb.on('down', () => {
    const vp = mat4.multiply([], projectionMatrix, viewMatrix);
    const invVp = mat4.invert([], vp);

    // get a single point on the camera ray.
    const rayPoint = vec3.transformMat4(
      [],
      [((2.0 * mp[0]) / nCanvas.width) - 1.0, ((-2.0 * mp[1]) / nCanvas.height) + 1.0, 0.0],
      invVp,
    );

    // get the position of the camera.
    const rayOrigin = vec3.transformMat4([], [0, 0, 0], mat4.invert([], viewMatrix));

    const rayDir = vec3.normalize(
      [],
      vec3.subtract([], rayPoint, rayOrigin),
    );

    // now we iterate through all meshes, and find the closest mesh that intersects the camera ray.
    let minT = 10000000.0;
    for (let i = 0; i < meshes.length; i += 1) {
      const m = meshes[i];

      const modelMatrix = createModelMatrix(m);

      // we must check all triangles of the mesh.
      for (let j = 0; j < m.mesh.elements.length; j += 1) {
        if (m.mesh !== planeMesh) { // we don't allow clicking the plane mesh.
          const f = m.mesh.elements[j];
          // apply model matrix on the triangle.
          const tri =
            [vec3.transformMat4([], m.mesh.position[f[0]], modelMatrix),
              vec3.transformMat4([], m.mesh.position[f[1]], modelMatrix),
              vec3.transformMat4([], m.mesh.position[f[2]], modelMatrix),
            ];
          const res = [];
          const t = intersectTriangle(res, rayPoint, rayDir, tri);
          if (t !== null) {
            if (t <= minT) {
              // mesh was closer than any object thus far.
              // for the time being, make it the selected object.
              minT = t;
              iSelectedMesh = i;
              break;
            }
          }
        }
      }
    }
  });
}

export default initNotes;
