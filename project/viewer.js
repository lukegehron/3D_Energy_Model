import * as THREE from '../build/three.module.js';
import {
    OrbitControls
} from "./jsm/controls/OrbitControls.js";
import Stats from './jsm/libs/stats.module.js';

var container, stats;
var camera, scene, raycaster, renderer, geometry;
var cameraControls;


var mouse = new THREE.Vector2(),
    INTERSECTED;
var frustumSize = 1000;

let Lon, Lat, Hour, Day, Month, TimeZone, roomOrientationValue, currentStudy;
let dateCounter, annualCoordinates, currentFrame, xPointLoc, yPointLoc, coordinates;

let hour = TIME_PARAMS.hour;
let timestep = TIME_PARAMS.timeStep;
let offset = TIME_PARAMS.offset;
let singleHour = 1;

let myCheck = 1;

let r;

let gridColorArray = [];

var case1Data = {
	ceilingHeightValue: ROOM_PARAMS.ceilHeight,
	wallLen: ROOM_PARAMS.length,
	windowHeightValue: WINDOW_PARAMS.heightFromSill,
	windowWidthValue: WINDOW_PARAMS.width,
	glzRatioValue: WINDOW_PARAMS.glazingRatio,
	sillHeightValue: WINDOW_PARAMS.sillHeight,
	distanceWindows: WINDOW_PARAMS.separation,

	occDistToWallCenter: WINTER_COMFORT_PARAMS.occDistToWallCenter,

	uvalueValue: WINTER_COMFORT_PARAMS.uvalueValue,
	calcUVal: WINTER_COMFORT_PARAMS.calcUVal,
	intLowEChecked: WINTER_COMFORT_PARAMS.intLowEChecked,
	intLowEEmissivity: WINTER_COMFORT_PARAMS.intLowEEmissivity,

	outdoorTempValue: WINTER_COMFORT_PARAMS.outdoorTempValue,
	airtempValue: WINTER_COMFORT_PARAMS.airtempValue,
	humidityValue: WINTER_COMFORT_PARAMS.humidityValue,

	rvalueValue: WINTER_COMFORT_PARAMS.rvalueValue,
	airspeedValue: WINTER_COMFORT_PARAMS.airspeedValue,
	clothingValue: WINTER_COMFORT_PARAMS.clothingValue,
	metabolic: WINTER_COMFORT_PARAMS.metabolic
}



init();
animate();

function init() {

    container = document.createElement('div');
    document.body.appendChild(container);

    //THREE_CAMERA
    // var aspect = window.innerWidth / window.innerHeight;
    // camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 0.1, 10000 );
    camera = new THREE.PerspectiveCamera(1, window.innerWidth / window.innerHeight, 1, 100000);
    camera.position.x = 2000;
    camera.position.y = 2000;
    camera.position.z = 2000;
    camera.up.set(0, 0, 1);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    //THREE_LIGHTS
    var light = new THREE.DirectionalLight(0xffffff, 0.45);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    light = new THREE.DirectionalLight(0xffffff, 0.45);
    light.position.set(1, -1, 1).normalize();
    scene.add(light);

    light = new THREE.DirectionalLight(0xffffff, 0.45);
    light.position.set(-1, -1, 1).normalize();
    scene.add(light);

    light = new THREE.DirectionalLight(0xffffff, 0.45);
    light.position.set(-1, 1, 1).normalize();
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.40));

    //THREE_GEOMETRY
    geometry = new THREE.PlaneBufferGeometry(0.9, 0.9);
    updateRoom();

    raycaster = new THREE.Raycaster();

    //THREE_RENDERER
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    //THREE_CONTROLS
    cameraControls = new OrbitControls(camera, renderer.domElement);
    cameraControls.addEventListener('change', render);

    //THREE_STATS
    stats = new Stats();
    container.appendChild(stats.dom);

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);

    //TWEAKPANE_PANELS
    initTweakPane();

}

//INITIALIZE TWEAKPANE PANELS
function initTweakPane() {
    const global_pane = new Tweakpane({
        container: document.getElementById('global_pane'),
        title: 'Model Type',
    });
    global_pane.addInput(PARAMS1, 'model', {
        options: {
            directSolar: 0,
            meanRadiantTemp: 1,
            winterComfort: 2,
        },
    });

    const climate_pane = new Tweakpane({
        container: document.getElementById('climate_pane'),
        title: 'Climate',
    })

    climate_pane.addInput(CLIMATE_PARAMS, 'longitude');
    climate_pane.addInput(CLIMATE_PARAMS, 'latitude');
    climate_pane.addInput(CLIMATE_PARAMS, 'timeZoneOffset');

    const time_pane = new Tweakpane({
        container: document.getElementById('time_pane'),
        title: 'Time',
    })
    time_pane.addInput(TIME_PARAMS, 'studyType');
    time_pane.addInput(TIME_PARAMS, 'hour');
    time_pane.addInput(TIME_PARAMS, 'day');
    time_pane.addInput(TIME_PARAMS, 'month');

    const geometry_pane = new Tweakpane({
        container: document.getElementById('room_pane'),
    });

    const room_pane = geometry_pane.addFolder({
        title: 'Geometry',
    });

    const roomPanel = room_pane.addFolder({
        title: 'Room',
    });
    roomPanel.addInput(ROOM_PARAMS, 'orientation');
    roomPanel.addInput(ROOM_PARAMS, 'ceilHeight');
    roomPanel.addInput(ROOM_PARAMS, 'gridHeight');
    roomPanel.addInput(ROOM_PARAMS, 'depth');
    roomPanel.addInput(ROOM_PARAMS, 'length');

    const windowPanel = room_pane.addFolder({
        expanded: false,
        title: 'Window',
    });
    windowPanel.addInput(WINDOW_PARAMS, 'heightFromSill');
    windowPanel.addInput(WINDOW_PARAMS, 'sillHeight');
    windowPanel.addInput(WINDOW_PARAMS, 'glazingBy');
    windowPanel.addInput(WINDOW_PARAMS, 'separation');

    const hshadePanel = room_pane.addFolder({
        expanded: false,
        title: 'Horizontal Shade',
    });
    hshadePanel.addInput(HORIZONTAL_SHADE_PARAMS, 'depth');
    hshadePanel.addInput(HORIZONTAL_SHADE_PARAMS, 'number');
    hshadePanel.addInput(HORIZONTAL_SHADE_PARAMS, 'spacing');
    hshadePanel.addInput(HORIZONTAL_SHADE_PARAMS, 'dist');
    hshadePanel.addInput(HORIZONTAL_SHADE_PARAMS, 'heightAbove');
    hshadePanel.addInput(HORIZONTAL_SHADE_PARAMS, 'angle');

    const vshadePanel = room_pane.addFolder({
        expanded: false,
        title: 'Vertical Shade',
    });
    vshadePanel.addInput(VERTICAL_SHADE_PARAMS, 'depth');
    vshadePanel.addInput(VERTICAL_SHADE_PARAMS, 'number');
    vshadePanel.addInput(VERTICAL_SHADE_PARAMS, 'spacing');
    vshadePanel.addInput(VERTICAL_SHADE_PARAMS, 'leftRight');
    vshadePanel.addInput(VERTICAL_SHADE_PARAMS, 'lrShift');
    vshadePanel.addInput(VERTICAL_SHADE_PARAMS, 'dist');
    vshadePanel.addInput(VERTICAL_SHADE_PARAMS, 'fullHeight');
    vshadePanel.addInput(VERTICAL_SHADE_PARAMS, 'heightAbove');
    vshadePanel.addInput(VERTICAL_SHADE_PARAMS, 'relativeHeight');
    vshadePanel.addInput(VERTICAL_SHADE_PARAMS, 'angle');

    const mrt_pane = new Tweakpane({
      container: document.getElementById('mrt_pane'),
      title: 'MRT',
  })

  mrt_pane.addInput(SUMMER_COMFORT_PARAMS, 'directNormalIrradiance');
  mrt_pane.addInput(SUMMER_COMFORT_PARAMS, 'fractionOfBodyExposed');
  mrt_pane.addInput(SUMMER_COMFORT_PARAMS, 'shortWaveAbsorpivity');
  mrt_pane.addInput(SUMMER_COMFORT_PARAMS, 'TSol');
  mrt_pane.addInput(SUMMER_COMFORT_PARAMS, 'SHGCIndirect');
  mrt_pane.addInput(SUMMER_COMFORT_PARAMS, 'TSolShading');
  

    climate_pane.on('change', (value) => {
        // console.log('changed: ' + String(value));
        // console.log(ROOM_PARAMS)
        updateParams();
    });

    time_pane.on('change', (value) => {
        // console.log('changed: ' + String(value));
        // console.log(ROOM_PARAMS)
        updateParams();
    });


    geometry_pane.on('change', (value) => {
        // console.log('changed: ' + String(value));
        // console.log(ROOM_PARAMS)
        updateParams();
    });

    mrt_pane.on('change', (value) => {
      // console.log('changed: ' + String(value));
      // console.log(ROOM_PARAMS)
      updateParams();
  });

}

//UPDATE TWEAKPANE PARAMETERS
function updateParams() {
    // let count = 0;
    var selectedObject = scene.getObjectByName("grid");
    do {
        scene.remove(selectedObject);
        selectedObject = scene.getObjectByName("grid");
        // count++;
    } while (selectedObject != null)

    var selectedObject = scene.getObjectByName("outline");
    do {
        scene.remove(selectedObject);
        selectedObject = scene.getObjectByName("outline");
        // count++;
    } while (selectedObject != null)

    var selectedObject = scene.getObjectByName("window");
    do {
        scene.remove(selectedObject);
        selectedObject = scene.getObjectByName("window");
        // count++;
    } while (selectedObject != null)

    var selectedObject = scene.getObjectByName("shade");
    do {
        scene.remove(selectedObject);
        selectedObject = scene.getObjectByName("shade");
        // count++;
    } while (selectedObject != null)

    updateRoom()


    animate();
}

//UPDATE ROOM SIZE
function updateRoom() {
    case1Data = {
        ceilingHeightValue: ROOM_PARAMS.ceilHeight,
        wallLen: ROOM_PARAMS.length,
        windowHeightValue: WINDOW_PARAMS.heightFromSill,
        windowWidthValue: WINDOW_PARAMS.width,
        glzRatioValue: WINDOW_PARAMS.glazingRatio,
        sillHeightValue: WINDOW_PARAMS.sillHeight,
        distanceWindows: WINDOW_PARAMS.separation,
    
        occDistToWallCenter: WINTER_COMFORT_PARAMS.occDistToWallCenter,
    
        uvalueValue: WINTER_COMFORT_PARAMS.uvalueValue,
        calcUVal: WINTER_COMFORT_PARAMS.calcUVal,
        intLowEChecked: WINTER_COMFORT_PARAMS.intLowEChecked,
        intLowEEmissivity: WINTER_COMFORT_PARAMS.intLowEEmissivity,
    
        outdoorTempValue: WINTER_COMFORT_PARAMS.outdoorTempValue,
        airtempValue: WINTER_COMFORT_PARAMS.airtempValue,
        humidityValue: WINTER_COMFORT_PARAMS.humidityValue,
    
        rvalueValue: WINTER_COMFORT_PARAMS.rvalueValue,
        airspeedValue: WINTER_COMFORT_PARAMS.airspeedValue,
        clothingValue: WINTER_COMFORT_PARAMS.clothingValue,
        metabolic: WINTER_COMFORT_PARAMS.metabolic
    }

    var geoResult = geo.createGlazingForRect(
        parseFloat(ROOM_PARAMS.ceilHeight),
        parseFloat(ROOM_PARAMS.length),
        WINDOW_PARAMS.glazingRatio / 100.0,
        parseFloat(WINDOW_PARAMS.width),
        parseFloat(WINDOW_PARAMS.heightFromSill),
        parseFloat(WINDOW_PARAMS.sillHeight),
        parseFloat(WINDOW_PARAMS.separation),
        WINDOW_PARAMS.glazingBy
    );
    r = {}
    r.wallCoords = geoResult.wallCoords;
    r.glzCoords = geoResult.glzCoords;
    r.glzRatio = geoResult.glzRatio;
    r.windowWidth = geoResult.windowWidth;
    r.windowHeight = geoResult.windowHeight;
    r.sillHeight = geoResult.sillHeight;
    r.centLineDist = geoResult.centLineDist;

    // console.log(r);
    getSolar();
    doTrig();
    updateData(case1Data);
    // console.log(case1Data);

    let colorCount = 0;

    //CREATE GRID AT Z-HEIGHT 0
    const gridMaterial = new THREE.MeshLambertMaterial({
        color: 0xeeeeee,
        transparent: true,
        opacity: 0.7
    });

    let prevN = ROOM_PARAMS.length / 2;
    for (let i = ROOM_PARAMS.depth / -2; i < ROOM_PARAMS.depth / 2; i++) {
        for (let j = ROOM_PARAMS.length / -2; j < ROOM_PARAMS.length / 2; j++) {
            // const material = new THREE.MeshBasicMaterial({
            //     color: 0x000000,
            //     side: THREE.DoubleSide
            // });
            // const plane = new THREE.Mesh(geometry, gridMaterial);
            if(isNaN(gridColorArray[colorCount])){
                gridColorArray[colorCount] = gridColorArray[ROOM_PARAMS.length];
            }
            

            // if(typeof resultsArray[colorCount] === 'undefined' || isNaN(resultsArray[colorCount].mrt)){
            //     resultsArray[colorCount] = resultsArray[colorCount - 1];
            // }

            // console.log(resultsArray[colorCount].mrt)
            // console.log(colorCount)
            // console.log(multiDimResults)
            // console.log(i*-2 / ROOM_PARAMS.depth -1 )
            let k = ROOM_PARAMS.length / 2 + j
            let m = ROOM_PARAMS.depth / 2 + i

            let n = parseInt(ROOM_PARAMS.length / 2 - 1) - k;

            if(ROOM_PARAMS.length % 2 != 1){
                if(n < 0){
                    n = Math.abs(n+1)
                   
                }
            }else{
                if(n < 0){
                    n = Math.abs(n+1)
                    if(n >= Math.floor(ROOM_PARAMS.length / 2)){
                        n= Math.floor(ROOM_PARAMS.length / 2-1)
                        // console.log(n)
                    }
                }
            }           
            
            // console.log(n,m)
            
            if(typeof multiDimResults[n][m] === 'undefined' || isNaN(multiDimResults[n][m].ppd)){
                multiDimResults[n][m] = multiDimResults[n][m-1];
            }

            const plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
                    // color: new THREE.Color(`rgb(255,`+parseInt(255 -multiDimResults[n][m].dwnSpd*2)+`,`+parseInt(255 -multiDimResults[n][m].dwnSpd*2)+`)`),
                    color: new THREE.Color(`rgb(255,`+(255 - gridColorArray[colorCount]*2)+`,`+(255 - gridColorArray[colorCount]*2)+`)`),
                    side: THREE.DoubleSide
                }));
                
            
            plane.setRotationFromAxisAngle(new THREE.Vector3(0,0,1), util.degrees_to_radians(ROOM_PARAMS.orientation));
            plane.translateX (j);
            plane.translateY(i);
            
            plane.name = "grid";
            plane.userData = {
                loc_i: ROOM_PARAMS.depth / 2 + i,
                loc_j: ROOM_PARAMS.length / 2 + j,
                direct_solar: gridColorArray[colorCount],
                dwnSpd: multiDimResults[n][m].dwnSpd,
                dwnTmp: multiDimResults[n][m].dwnTmp,
                glzfac: multiDimResults[n][m].glzfac,
                govPPD: multiDimResults[n][m].govPPD,
                mrt: multiDimResults[n][m].mrt,
                mrtppd: multiDimResults[n][m].mrtppd,
                pmv: multiDimResults[n][m].pmv,
                ppd: multiDimResults[n][m].ppd,
                tarDist: multiDimResults[n][m].tarDist,
            }
            scene.add(plane);
            colorCount++;
        }
    }
    // console.log(multiDimResults)

    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xaaaaaa
    });

    const corner1 = []
    const corner2 = []
    const corner3 = []
    const corner4 = []
    const floor = []
    const ceil = []

    const points = [];
    corner1.push(new THREE.Vector3(ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / -2 - .5, -ROOM_PARAMS.gridHeight));
    corner1.push(new THREE.Vector3(ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / -2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight));

    let lineGeometry = new THREE.BufferGeometry().setFromPoints(corner1);
    let line = new THREE.Line(lineGeometry, lineMaterial);
    line.name = "outline"
    line.setRotationFromAxisAngle(new THREE.Vector3(0,0,1), util.degrees_to_radians(ROOM_PARAMS.orientation));
    scene.add(line);

    corner2.push(new THREE.Vector3(ROOM_PARAMS.length / 2 - .5, ROOM_PARAMS.depth / 2 - .5, -ROOM_PARAMS.gridHeight));
    corner2.push(new THREE.Vector3(ROOM_PARAMS.length / 2 - .5, ROOM_PARAMS.depth / 2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight));

    lineGeometry = new THREE.BufferGeometry().setFromPoints(corner2);
    line = new THREE.Line(lineGeometry, lineMaterial);
    line.name = "outline"
    line.setRotationFromAxisAngle(new THREE.Vector3(0,0,1), util.degrees_to_radians(ROOM_PARAMS.orientation));
    scene.add(line);

    corner3.push(new THREE.Vector3(ROOM_PARAMS.length / 2 - .5, ROOM_PARAMS.depth / -2 - .5, -ROOM_PARAMS.gridHeight));
    corner3.push(new THREE.Vector3(ROOM_PARAMS.length / 2 - .5, ROOM_PARAMS.depth / -2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight));

    lineGeometry = new THREE.BufferGeometry().setFromPoints(corner3);
    line = new THREE.Line(lineGeometry, lineMaterial);
    line.name = "outline"
    line.setRotationFromAxisAngle(new THREE.Vector3(0,0,1), util.degrees_to_radians(ROOM_PARAMS.orientation));
    scene.add(line);

    corner4.push(new THREE.Vector3(ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / 2 - .5, -ROOM_PARAMS.gridHeight));
    corner4.push(new THREE.Vector3(ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / 2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight));

    lineGeometry = new THREE.BufferGeometry().setFromPoints(corner4);
    line = new THREE.Line(lineGeometry, lineMaterial);
    line.name = "outline"
    line.setRotationFromAxisAngle(new THREE.Vector3(0,0,1), util.degrees_to_radians(ROOM_PARAMS.orientation));
    scene.add(line);

    //FLOOR OUTLINE
    floor.push(new THREE.Vector3(ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / 2 - .5, -ROOM_PARAMS.gridHeight));
    floor.push(new THREE.Vector3(ROOM_PARAMS.length / 2 - .5, ROOM_PARAMS.depth / 2 - .5, -ROOM_PARAMS.gridHeight));
    floor.push(new THREE.Vector3(ROOM_PARAMS.length / 2 - .5, ROOM_PARAMS.depth / -2 - .5, -ROOM_PARAMS.gridHeight));
    floor.push(new THREE.Vector3(ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / -2 - .5, -ROOM_PARAMS.gridHeight));
    floor.push(new THREE.Vector3(ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / 2 - .5, -ROOM_PARAMS.gridHeight));

    lineGeometry = new THREE.BufferGeometry().setFromPoints(floor);
    line = new THREE.Line(lineGeometry, lineMaterial);
    line.name = "outline"
    line.setRotationFromAxisAngle(new THREE.Vector3(0,0,1), util.degrees_to_radians(ROOM_PARAMS.orientation));
    scene.add(line);

    //CEILING OUTLINE
    ceil.push(new THREE.Vector3(ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / 2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight));
    ceil.push(new THREE.Vector3(ROOM_PARAMS.length / 2 - .5, ROOM_PARAMS.depth / 2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight));
    ceil.push(new THREE.Vector3(ROOM_PARAMS.length / 2 - .5, ROOM_PARAMS.depth / -2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight));
    ceil.push(new THREE.Vector3(ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / -2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight));
    ceil.push(new THREE.Vector3(ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / 2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight));

    lineGeometry = new THREE.BufferGeometry().setFromPoints(ceil);
    line = new THREE.Line(lineGeometry, lineMaterial);
    line.name = "outline"
    line.setRotationFromAxisAngle(new THREE.Vector3(0,0,1), util.degrees_to_radians(ROOM_PARAMS.orientation));
    scene.add(line);

    //GEO Result - TAKES DATA FROM THE GEO.JS FILE
    //geo.createGlazingForRect = function(rectHeight, wallLength, glazingRatio, windowWidth, winHeight, silHeight, distBreakup, ratioOrWidth, changedVar)
   


    let windowMaterial = new THREE.MeshLambertMaterial({
        color: 0xccccff,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
    });
    for (let i = 0; i < r.glzCoords.length; i++) {
        const window = [];

        window.push(new THREE.Vector3(r.glzCoords[i][0][0] - 0.5, r.glzCoords[i][0][1] - ROOM_PARAMS.depth / 2 - 0.5, r.glzCoords[i][0][2] - ROOM_PARAMS.gridHeight));
        window.push(new THREE.Vector3(r.glzCoords[i][1][0] - 0.5, r.glzCoords[i][1][1] - ROOM_PARAMS.depth / 2 - 0.5, r.glzCoords[i][1][2] - ROOM_PARAMS.gridHeight));
        window.push(new THREE.Vector3(r.glzCoords[i][2][0] - 0.5, r.glzCoords[i][2][1] - ROOM_PARAMS.depth / 2 - 0.5, r.glzCoords[i][2][2] - ROOM_PARAMS.gridHeight));
        window.push(new THREE.Vector3(r.glzCoords[i][3][0] - 0.5, r.glzCoords[i][3][1] - ROOM_PARAMS.depth / 2 - 0.5, r.glzCoords[i][3][2] - ROOM_PARAMS.gridHeight));
        window.push(new THREE.Vector3(r.glzCoords[i][0][0] - 0.5, r.glzCoords[i][0][1] - ROOM_PARAMS.depth / 2 - 0.5, r.glzCoords[i][0][2] - ROOM_PARAMS.gridHeight));

        lineGeometry = new THREE.BufferGeometry().setFromPoints(window);
        line = new THREE.Line(lineGeometry, lineMaterial);
        line.name = "outline"
        line.setRotationFromAxisAngle(new THREE.Vector3(0,0,1), util.degrees_to_radians(ROOM_PARAMS.orientation));
        scene.add(line);

        const geometry1 = new THREE.PlaneBufferGeometry(r.windowWidth, r.windowHeight);
        geometry1.translate(((r.glzCoords[i][0][0] + r.glzCoords[i][1][0]) / 2) - 0.5, +ROOM_PARAMS.gridHeight - r.windowHeight / 2 - WINDOW_PARAMS.sillHeight, r.glzCoords[i][0][1] - ROOM_PARAMS.depth / 2 - 0.5);
        geometry1.rotateX(Math.PI * -0.5);
        const plane1 = new THREE.Mesh(geometry1, windowMaterial);

        plane1.name = "window";
        plane1.setRotationFromAxisAngle(new THREE.Vector3(0,0,1), util.degrees_to_radians(ROOM_PARAMS.orientation));
        scene.add(plane1);
    }

    //HORIZONTAL SHADES

    let shadeMaterial = new THREE.MeshLambertMaterial({
      color: 0x999999,
      // transparent: true,
      // opacity: 0.7,
      side: THREE.DoubleSide
  });

    for (let i = 0; i < r.glzCoords.length; i++) {
      for(let j = 0; j < HORIZONTAL_SHADE_PARAMS.number; j++){
        const geometry1 = new THREE.PlaneBufferGeometry(r.windowWidth, HORIZONTAL_SHADE_PARAMS.depth);
        geometry1.translate(0,-HORIZONTAL_SHADE_PARAMS.depth/2,0);
        geometry1.rotateX(util.degrees_to_radians(HORIZONTAL_SHADE_PARAMS.angle));
      geometry1.translate(((r.glzCoords[i][0][0] + r.glzCoords[i][1][0]) / 2) - 0.5,ROOM_PARAMS.depth/-2 - 0.5 - .01 - HORIZONTAL_SHADE_PARAMS.dist, WINDOW_PARAMS.sillHeight - ROOM_PARAMS.gridHeight + WINDOW_PARAMS.heightFromSill - (HORIZONTAL_SHADE_PARAMS.spacing*j));
      // geometry1.rotateOnAxis()
      // geometry1.rotateX(Math.PI * -0.5);
      const plane1 = new THREE.Mesh(geometry1, shadeMaterial);

      plane1.name = "shade";
      plane1.setRotationFromAxisAngle(new THREE.Vector3(0,0,1), util.degrees_to_radians(ROOM_PARAMS.orientation));
      scene.add(plane1);
      }
  }

   //VERTICAL SHADES

   shadeMaterial = new THREE.MeshLambertMaterial({
    color: 0xeeeeee,
    // transparent: true,
    // opacity: 0.7,
    side: THREE.DoubleSide
});


  for (let i = 0; i < r.glzCoords.length; i++) {
    for(let j = 0; j < VERTICAL_SHADE_PARAMS.number; j++){
      let shadeHeight = r.windowHeight;
      if(VERTICAL_SHADE_PARAMS.fullHeight == 1){
        shadeHeight = ROOM_PARAMS.ceilHeight;
      }
      const geometry1 = new THREE.PlaneBufferGeometry(VERTICAL_SHADE_PARAMS.depth, shadeHeight);
      geometry1.rotateX(Math.PI * -0.5);
      geometry1.rotateZ(Math.PI * -0.5);
    geometry1.translate(((r.glzCoords[i][0][0] + r.glzCoords[i][1][0])/2) - 0.5 +WINDOW_PARAMS.width/2 - (VERTICAL_SHADE_PARAMS.spacing*j) - VERTICAL_SHADE_PARAMS.lrShift, ROOM_PARAMS.depth/-2 - 0.5 - VERTICAL_SHADE_PARAMS.depth/2 - .01 - VERTICAL_SHADE_PARAMS.dist, WINDOW_PARAMS.sillHeight - ROOM_PARAMS.gridHeight + WINDOW_PARAMS.heightFromSill/2);
    // geometry1.rotateOnAxis()
    // geometry1.rotateX(Math.PI * -0.5);
    const plane1 = new THREE.Mesh(geometry1, shadeMaterial);

    plane1.name = "shade";
    plane1.setRotationFromAxisAngle(new THREE.Vector3(0,0,1), util.degrees_to_radians(ROOM_PARAMS.orientation));
    scene.add(plane1);
    }
}

    

}

// CHECKS INTERSECTIONS
function render() {
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {

        if (INTERSECTED != intersects[0].object) {

            // if (INTERSECTED) INTERSECTED.material.color.setHex(INTERSECTED.currentHex);

            if (INTERSECTED != null && INTERSECTED.name == "grid") {
                // console.log(INTERSECTED)
                console.log(INTERSECTED.userData);
                let myDiv = document.getElementById("mdata");
                let txt = "";
                txt += "MRT: " + INTERSECTED.userData.mrt.toString() + "\n";
                txt += "Direct Solar: " + INTERSECTED.userData.direct_solar.toString() + "\n";
                txt += "Location: " + INTERSECTED.userData.loc_i.toString() + ", " + INTERSECTED.userData.loc_j.toString() + "\n";
                txt += "Glazing Factor " + INTERSECTED.userData.glzfac.toString() + "\n";
                txt += "MRTPPD: " + INTERSECTED.userData.mrtppd.toString() + "\n";
                txt += "PMV: " + INTERSECTED.userData.pmv.toString() + "\n";
                txt += "PPD: " + INTERSECTED.userData.ppd.toString() + "\n";
                txt += "PPD2: " + determinePPD(INTERSECTED.userData.pmv) + "\n";
                
                if(TIME_PARAMS.studyType == 1){
                  txt += "Azmuth Altitute: " + coordinates[0] + "\n";
                  var mRes = coordinates[0].toString().split(",");
                  var mNum = parseFloat(mRes[1])
                  txt += "Direct Normal Irradiance: " + directNormalIrradiance(parseFloat(mNum)).toString();
                }
                
                myDiv.innerText = txt;
            }

            INTERSECTED = intersects[0].object;
            // INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
            // INTERSECTED.material.color.setHex(0xff0000);
        }

    } else {
        // if (INTERSECTED) INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
        INTERSECTED = null;
    }
    renderer.render(scene, camera);
}

//TODO CHANGE THIS TO PERSPECTIVE
function onWindowResize() {

    var aspect = window.innerWidth / window.innerHeight;

    camera.left = -frustumSize * aspect / 2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;

    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function onDocumentMouseMove(event) {

    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function animate() {

    requestAnimationFrame(animate);

    render();
    stats.update();

}

function getSolar() {
    Lon = CLIMATE_PARAMS.longitude;
    Lat = CLIMATE_PARAMS.latitude;
    Hour = TIME_PARAMS.hour;
    Day = TIME_PARAMS.day;
    Month = TIME_PARAMS.month;
    TimeZone = CLIMATE_PARAMS.timeZoneOffset;
    roomOrientationValue = ROOM_PARAMS.orientation;
    currentStudy = singleHour; // singleHour

    dateCounter = 0;
    annualCoordinates = [];
    currentFrame = 0;

    singleHour = TIME_PARAMS.studyType;

    

    //SunVectors - TAKEN FROM THE OLD SUNVECTORS.JS FILE

    offset = (new Date().getTimezoneOffset()) / 60;
    
    var dates = []
    var date;
    var date2;
    for (let i = 1; i <= 24 * timestep; i++) {
        hour = i / timestep;
        // console.log(hour)
        if (i == ((parseInt(24 - Hour)) * timestep)) {
            date = new Date(2000, Month - 1, Day, hour - offset - TimeZone, (hour % parseInt(hour)) * 60);
            // console.log((hour%parseInt(hour))*60 + " " + Hour);
            let mytime = 24 - hour;
            date2 = new Date(2000, Month - 1, Day, Hour - offset - TimeZone, 0);
        }
        dates.push(new Date(2000, Month - 1, Day, hour - offset - TimeZone, (hour % parseInt(hour)) * 60));
        // console.log(2000, Month - 1, Day, hour - offset - TimeZone, (hour % parseInt(hour)) * 60);
        // console.log(offset, TimeZone)
    }
    // console.log(dates);
    //console.log(date);


    xPointLoc = [];
    yPointLoc = [];

    coordinates = [];
    for (let i = 1; i <= (24 * timestep) - 1; i++) {
        coordinates.push(solarCalculator([Lon, Lat]).position(dates[i]));
    }
   

    for (let i = 0; i < coordinates.length; i += parseInt(timestep)) {
        if (coordinates[i][1] > 0) {
            xPointLoc.push((36 - (36 * (coordinates[i][1] / 180))) * Math.sin((coordinates[i][0] - 45 - roomOrientationValue) * (-3.1415926 / 180)));
            yPointLoc.push(((22 - (22 * (coordinates[i][1] / 180))) * Math.cos((coordinates[i][0] - 45 - roomOrientationValue) * (-3.1415926 / 180))) - (coordinates[i][1] * .3));
            //p.point((36-(36*(coordinates[i][1]/180)))*p.sin((coordinates[i][0]-45+roomOrientationValue)*(-3.1415926 / 180)), ((22-(22*(coordinates[i][1]/180)))*p.cos((coordinates[i][0]-45+roomOrientationValue)*(-3.1415926 / 180)))-(coordinates[i][1]*.3));
        }
    }

    if (singleHour == 1) {
        coordinates = [];
        let coordinates2 = [];
        for (let i = 1; i <= 9; i++) {
            coordinates.push(solarCalculator([Lon, Lat]).position(date));
        }
        for (let i = 1; i <= 9; i++) {
            coordinates2.push(solarCalculator([Lon, Lat]).position(date2));
        }
        xPointLoc = [];
        yPointLoc = [];
        for (let i = 0; i < coordinates2.length; i += parseInt(timestep)) {
            if (coordinates2[i][1] > 0) {
                xPointLoc.push((36 - (36 * (coordinates2[i][1] / 180))) * Math.sin((coordinates2[i][0] - 45 - roomOrientationValue) * (-3.1415926 / 180)));
                yPointLoc.push(((22 - (22 * (coordinates2[i][1] / 180))) * Math.cos((coordinates2[i][0] - 45 - roomOrientationValue) * (-3.1415926 / 180))) - (coordinates2[i][1] * .3));
                //p.point((36-(36*(coordinates[i][1]/180)))*p.sin((coordinates[i][0]-45+roomOrientationValue)*(-3.1415926 / 180)), ((22-(22*(coordinates[i][1]/180)))*p.cos((coordinates[i][0]-45+roomOrientationValue)*(-3.1415926 / 180)))-(coordinates[i][1]*.3));
            }
        }
    }

    // console.log(coordinates)
}

function doTrig(){

    let gridX = ROOM_PARAMS.depth;
    let gridY = ROOM_PARAMS.length;

    // let vertShadeNum = VERTICAL_SHADE_PARAMS.number;
    let wallDepVal = ROOM_PARAMS.length;
    let gridHt = ROOM_PARAMS.gridHeight;
    let horzShadeNum = HORIZONTAL_SHADE_PARAMS.number;
    let horzShadeDist = HORIZONTAL_SHADE_PARAMS.dist;
    let horzShadeDep = HORIZONTAL_SHADE_PARAMS.depth;
    let horzShadeAngle = HORIZONTAL_SHADE_PARAMS.angle;
    let horzShadeHeight = HORIZONTAL_SHADE_PARAMS.heightAbove;
    let horzShadeSpace = HORIZONTAL_SHADE_PARAMS.spacing;
    let bigArrayColor = [];

    let vertShadeDep = VERTICAL_SHADE_PARAMS.depth;
    let vertShadeDist = VERTICAL_SHADE_PARAMS.dist;
    let vertShadeHeight = VERTICAL_SHADE_PARAMS.fullHeight;
    let vertShadeNum = VERTICAL_SHADE_PARAMS.number;
    let vertShadeShift = VERTICAL_SHADE_PARAMS.lrShift;
    let vertShadeStart = VERTICAL_SHADE_PARAMS.leftRight; 
    let vertShadeSpace = VERTICAL_SHADE_PARAMS.spacing;

    //TIME FOR SOME TRIG
    let VecXArray = [];
    let VecYArray = [];
    let VecZArray = [];
    let angleZ;
    let angleHeight; //the height of the sun vector starting from the grid sq
    let angleHeightTest = [];



  //THIS IS A FIX THAT ALLOWS THE ROOM ORIENTATION TO ROTATE A FULL 360 DEGREES
  let newCoordinateArray = [];
  for (let k = 0; k<coordinates.length; k++){
    //console.log(coordinates[k][0]+float(roomOrientationValue-180))
    if (coordinates[k][0]+parseFloat(roomOrientationValue-180) < -180){
      newCoordinateArray.push(coordinates[k][0]+parseFloat(roomOrientationValue-180)+360);
    }else if (coordinates[k][0]+parseFloat(roomOrientationValue-180)>180){
      newCoordinateArray.push(coordinates[k][0]+parseFloat(roomOrientationValue-180)-360);
    }else{
      newCoordinateArray.push(coordinates[k][0]+parseFloat(roomOrientationValue-180));
    }
  }


  let LouverList1 = [];
  let XYLouverTest = [];


  



  if(myCheck == 1){
    // VERTICAL SHADES XY

          let b1;
          let Xloc1 = [];
          let XYtest1 = [];
          let AWArray1 = [];
          let ZAdd = [];
          let bigB = 0;
          let superB = [];
          let superD = [];
          let filledList = [];
          for (let i = 0; i<gridX; i++) {
            let YdistanceFromWall = (i+1); // grid distance from window wall in Y direction
            b1 = 0;
            filledList.push(0);
            for (let j = 0; j<gridY; j++){
              b1 = 0;
              for (let k = 0; k<coordinates.length; k++){
                let XYLouver1 = 0;
                let XlocationOnWall = 180; // this is a safe angle for the point to start from.. 180 means that it is perpindicular from the point (towards the wall?)
                if (newCoordinateArray[k]<88.0 && newCoordinateArray[k]> -88.0){
                    XlocationOnWall = Math.tan(newCoordinateArray[k]*(3.1415926 / 180))*YdistanceFromWall; //this is real point at the window wall relative to the grid point. Add j to get the real location on the window wall
                }
                AWArray1.push(XlocationOnWall);
                let xCoord = 0;
                let bigBArray = [];
                let superC = [];

                for (let n = 0; n<r.glzCoords.length; n++){ //cycle through each window
                  // if (XlocationOnWall+(j+1) > r.glzCoords[n][0][0]+(wallDepVal/2)  && XlocationOnWall+(j+1) < r.glzCoords[n][1][0]+(wallDepVal/2)){ //cycle through all the windows, check if the wall position exists within the bounds of the window
                  //   xCoord = n+1; //we really only care about if a point gets hit 1x per timestep so this number could go crazy high, but it only needs to go up by 1 to count.. if it gets sun from multiple windows it doesnt really matter
                  // }
                  // xCoord = 1;
                //}if(xCoord > 0){ //if this specific gridpoint and sun angle goes through a window...
                let newBigBArray = [];
                    for (let p = 0; p<parseInt(vertShadeNum); p++){ //for each shade in this window...

                      let angleA = abs(newCoordinateArray[k]);
                      let angleB = 90.0-abs(newCoordinateArray[k]);
                      if (newCoordinateArray[k] > 0){
                        angleB = angleB * -1;
                      }
                      let bigA;
                      if(vertShadeStart == "L"){
                        bigA = ((XlocationOnWall+(j+1)+(r.glzCoords[n][0][0]-(wallDepVal/2))+(p*parseInt(vertShadeSpace)-vertShadeShift)));
                      }else{
                        bigA = ((XlocationOnWall+(j+1)-(r.glzCoords[n][0][0]+(wallDepVal/2))+(-p*parseInt(vertShadeSpace)-vertShadeShift)));
                      }
                      bigB = ((Math.sin(angleB*(3.1415926 / 180))*bigA)/(Math.sin(angleA*(3.1415926 / 180))));
                      bigBArray.push(bigB);
                      newBigBArray.push(bigB);
                    }superC.push(newBigBArray);
                }//console.log(bigBArray.length);
                superB.push(bigBArray);
                superD.push(superC);
                for (let q = 0; q < superC.length; q++){ // I think the problem exists here... need a second layer of for loop?
                  for (let g = 0; g < superC[0].length; g++){
                    if (superC[q][g] > parseInt(vertShadeDist) && superC[q][g] < (parseInt(vertShadeDist) + parseInt(vertShadeDep))){
                      XYLouver1 = XYLouver1 + 1;
                  }else{
                    }
                  }
                }//ZAdd.push(bigB)
                if (XYLouver1 > 0){
                  b1 = 1;
                }else{
                  b1 =  0;
                }LouverList1.push(b1);
              }
            }
          }
          //console.log(filledListI);


  //END OF VERTICAL SHADES




      //START PYTHAGOREAM THEORM FOR XY
      //ASSUME +Y IS DUE NORTH and is the wall opposite the windowwall is N (windowwall is S)

      let b;
      let Xloc = []
      let XYtest = []
      let AWArray = []
      for (let i = 0; i<gridX; i++) {
        let YdistanceFromWall = (i+1); // grid distance from window wall in Y direction
        b = 0;
        for (let j = 0; j<gridY; j++){
          b = 0;
          for (let k = 0; k<coordinates.length; k++){
            let XlocationOnWall = 180; // this is a safe angle for the point to start from.. 180 means that it is perpindicular from the point (towards the wall?)
            if (newCoordinateArray[k]<88.0 && newCoordinateArray[k]> -88.0){
                XlocationOnWall = Math.tan(newCoordinateArray[k]*(3.1415926 / 180))*YdistanceFromWall; //this is real point at the window wall relative to the grid point. Add j to get the real location on the window wall
                //console.log(XlocationOnWall);
            }
            AWArray.push(XlocationOnWall);
            let xCoord = 0;
            let vertLouverXdistance = [];
            for (let m = 0; m<r.glzCoords.length; m++){

              if (XlocationOnWall+(j+1) > r.glzCoords[m][0][0]+(wallDepVal/2)  && XlocationOnWall+(j+1) < r.glzCoords[m][1][0]+(wallDepVal/2)){ //cycle through all the windows, check if the wall position exists within the bounds of the window
                xCoord = xCoord + 1; //we really only care about if a point gets hit 1x per timestep so this number could go crazy high, but it only needs to go up by 1 to count.. if it gets sun from multiple windows it doesnt really matter
              }
            }
            if (xCoord > 0){
              b = 1;
            }else{
              b =  0;
            }XYtest.push(b);

          }
        }
      }
      //END PYTHAGOREM THEORM FOR XY


      //START PYTHAGOREAM THEORM FOR Z

      let a;
      let Ztest = [];
      let AHArray = [];
      for (let i = 0; i<gridX; i++) {
        let distanceFromWall = (i+1)/4;
        a = 0;
        for (let j = 0; j<gridY; j++){
          a = 0;
          for (let k = 0; k<coordinates.length; k++){
            let angleHeight = Math.tan((coordinates[k][1])*(3.1415926 / 180))*distanceFromWall;
            AHArray.push(coordinates[k][1]);
            if (coordinates[k][1] < 0 ){
              a = 0;
            }else if (angleHeight > r.glzCoords[0][0][2]-gridHt && angleHeight < (r.glzCoords[0][2][2] -gridHt)){
              let testArray1 = [1];
              for (let n = 0; n < horzShadeNum; n++){
                let sinLawDist = (horzShadeDist*(Math.sin(3.1415926-(((90)-coordinates[k][1])*(3.1415926 / 180))-(90*(3.1415926 / 180)))))/Math.sin(((90)-coordinates[k][1])*(3.1415926 / 180));
                let sinLawAngle = (horzShadeDep*(Math.sin(3.1415926-(((90)-coordinates[k][1])*(3.1415926 / 180))-(horzShadeAngle*(3.1415926 / 180)))))/Math.sin(((90)-coordinates[k][1])*(3.1415926 / 180));

                if (angleHeight < (r.glzCoords[0][2][2]-gridHt)-(horzShadeSpace*n)-(sinLawDist)+(parseFloat(horzShadeHeight)*.5) && angleHeight > ((r.glzCoords[0][2][2]-gridHt)-(horzShadeSpace*n)-(sinLawDist)-(sinLawAngle)+(parseFloat(horzShadeHeight)*.5))){
                  testArray1.push(0);
                }else{
                  testArray1.push(1);
                }
              }
              let SortedArray = testArray1.sort();
              let SALength = testArray1.length;
              let itemArray = SortedArray[0];
              a = itemArray;

              //console.log(SortedArray);
            }else{
              a = 0;
            }Ztest.push(a);
          }
        }
      }
    //END PYTHAGOREAM THEROM FOR Z

      //START XY and Z check
      let gridColor;
      gridColorArray = []
      for (let i = 0; i < XYtest.length; i++){

        let XYLouv = LouverList1[i];
        let XYcolor = XYtest[i];
        let Zcolor = Ztest[i];

        if (XYcolor == 1 && Zcolor == 1 && XYLouv == 0){
          gridColor = gridColor + 1;
        }else{
          gridColor = gridColor + 0;
        }if (i % coordinates.length == (coordinates.length)-1){
          gridColorArray.push(gridColor);
          gridColor = 0;
      }
    }

    if (dateCounter == 1){
      for (let i = 0; i < gridColorArray.length; i++){
        bigArrayColor.push(gridColor);
      }
    }else if (dateCounter < 365){
      for (let i = 0; i < gridColorArray.length; i++){
        bigArrayColor[i] += gridColorArray[i];
    }
  }

}else{

  bigArrayColor = [];






if (vertShadeOn == 1){ // Variable height louvers

  // VERTICAL SHADES XY
  let XYLouverTest = [];
        let b1;
        let Xloc1 = [];
        let XYtest1 = [];
        let AWArray1 = [];
        let ZAdd = [];
        let bigB = 0;
        let superB = [];
        let superD = [];
        let filledList = [];
        let filledListI = [];
        for (let i = 0; i<gridX; i++) {
          let filledListJ = [];
          for (let j = 0; j<gridY; j++){
            let filledListK = [];
            for (let k = 0; k<coordinates.length; k++){
              let filledListN = [];
              for (let n = 0; n<r.glzCoords.length; n++){
                let filledListP = [];
                for (let p = 0; p<parseInt(vertShadeNum); p++){
                  filledListP.push(0);
                }
                filledListN.push(filledListP);
              }
              filledListK.push(filledListN);
            }
            filledListJ.push(filledListK);
          }
          filledListI.push(filledListJ);
        }

        let filledListZ = [];
        for (let i = 0; i<gridX; i++) {
          let filledListJ = [];
          for (let j = 0; j<gridY; j++){
            let filledListK = [];
            for (let k = 0; k<coordinates.length; k++){
              let filledListN = [];
              for (let n = 0; n<r.glzCoords.length; n++){
                let filledListP = [];
                for (let p = 0; p<parseInt(vertShadeNum); p++){
                  filledListP.push(0);
                }
                filledListN.push(filledListP);
              }
              filledListK.push(filledListN);
            }
            filledListJ.push(filledListK);
          }
          filledListZ.push(filledListJ);
        }

        for (let i = 0; i<gridX; i++) {
          let YdistanceFromWall = (i+1); // grid distance from window wall in Y direction
          b1 = 0;
          filledList.push(0);
          for (let j = 0; j<gridY; j++){
            b1 = 0;
            for (let k = 0; k<coordinates.length; k++){
              let XYLouver1 = 0;
              let XlocationOnWall = 180; // this is a safe angle for the point to start from.. 180 means that it is perpindicular from the point (towards the wall?)
              if (newCoordinateArray[k]<88.0 && newCoordinateArray[k]> -88.0){
                  XlocationOnWall = Math.tan(newCoordinateArray[k]*(3.1415926 / 180))*YdistanceFromWall; //this is real point at the window wall relative to the grid point. Add j to get the real location on the window wall
              }
              AWArray1.push(XlocationOnWall);
              let xCoord = 0;
              let bigBArray = [];
              let superC = [];

              for (let n = 0; n<r.glzCoords.length; n++){ //cycle through each window
                // if (XlocationOnWall+(j+1) > r.glzCoords[n][0][0]+(wallDepVal/2)  && XlocationOnWall+(j+1) < r.glzCoords[n][1][0]+(wallDepVal/2)){ //cycle through all the windows, check if the wall position exists within the bounds of the window
                //   xCoord = n+1; //we really only care about if a point gets hit 1x per timestep so this number could go crazy high, but it only needs to go up by 1 to count.. if it gets sun from multiple windows it doesnt really matter
                // }
                // xCoord = 1;
              //}if(xCoord > 0){ //if this specific gridpoint and sun angle goes through a window...
              let newBigBArray = [];
                  for (let p = 0; p<parseInt(vertShadeNum); p++){ //for each shade in this window...

                    let angleA = abs(newCoordinateArray[k]);
                    let angleB = 90.0-abs(newCoordinateArray[k]);
                    if (newCoordinateArray[k] > 0){
                      angleB = angleB * -1;
                    }
                    let bigA;
                    if(vertShadeStart == "L"){
                      bigA = ((XlocationOnWall+(j+1)+(r.glzCoords[n][0][0]-(wallDepVal/2))+(p*parseInt(vertShadeSpace)-vertShadeShift)));
                    }else{
                      bigA = ((XlocationOnWall+(j+1)-(r.glzCoords[n][0][0]+(wallDepVal/2))+(-p*parseInt(vertShadeSpace)-vertShadeShift)));
                    }
                    bigB = ((Math.sin(angleB*(3.1415926 / 180))*bigA)/(Math.sin(angleA*(3.1415926 / 180))));
                    bigBArray.push(bigB);
                    newBigBArray.push(bigB);
                  }superC.push(newBigBArray);
              }//console.log(bigBArray.length);
              superB.push(bigBArray);
              superD.push(superC);
              for (let q = 0; q < superC.length; q++){ // I think the problem exists here... need a second layer of for loop?
                for (let g = 0; g < superC[0].length; g++){
                  if (superC[q][g] > parseInt(vertShadeDist) && superC[q][g] < (parseInt(vertShadeDist) + parseInt(vertShadeDep))){
                    XYLouver1 = XYLouver1 + 1;
                    filledListI[i][j][k][q][g] = 1;
                }else{
                  filledListI[i][j][k][q][g] = 0;
                }
                }
              }//ZAdd.push(bigB)
              if (XYLouver1 > 0){
                b1 = 1;
              }else{
                b1 =  0;
              }XYLouverTest.push(b1);
            }
          }
        }
        //console.log(filledListI);
  // VERTICAL SHADES Z

  let a1;
  let Ztest1 = [];
  let AHArray1 = [];
  let newCounter = 0;
  let emptyList = [];
    for (let i = 0; i<gridX; i++) {
    let distanceFromWall = (i+1)/4;
    a1 = 0;
    for (let j = 0; j<gridY; j++){
      a1 = 0;
      for (let k = 0; k<coordinates.length; k++){
        let distanceBeyondWall = 0;
        let anotherCounter = 0;
        let angleHeight = Math.tan((coordinates[k][1])*(3.1415926 / 180))*distanceFromWall;

        for (let n = 0; n<r.glzCoords.length; n++){

          for (let ru = 0; ru < vertShadeNum; ru ++){
            distanceBeyondWall = (superD[newCounter][n][ru]);

            let angleHeight2 = Math.tan((coordinates[k][1])*(3.1415926 / 180))*distanceBeyondWall;


            let myVar;
              if (angleHeight + angleHeight2  > (r.glzCoords[0][0][2]-gridHt) - parseInt(vertShadeScale) + parseInt(vertShadeHeight) && angleHeight + angleHeight2  < (r.glzCoords[0][2][2]-gridHt)   + parseInt(vertShadeHeight)){
                myVar = 0;
                 //if this condintion, it hits the full size louver
              }else{
                myVar = 1;
                anotherCounter = anotherCounter + 1
              }
              filledListZ[i][j][k][n][ru] = myVar;
          }
        }
        if (anotherCounter > 0 + vertShadeNum){
          XYLouverTest[newCounter-1] = 0;
        }
        newCounter = newCounter + 1;

      }
    }
  }


let decider = 0;
  for (let i = 0; i<gridX; i++) {
    for (let j = 0; j<gridY; j++){
      for (let k = 0; k<coordinates.length; k++){
        let nextLevel = 0;
        for (let n = 0; n < r.glzCoords.length; n++){
          for (let p = 0; p < parseInt(vertShadeNum); p++){
            decider = 0;
            if (filledListI[i][j][k][n][p] == 1){
              decider = 1;
              if (filledListZ[i][j][k][n][p] == 1){
                decider = 2;
              }
            }
            if (decider == 1){
              nextLevel = nextLevel + 1;
            }
          }
        }if (nextLevel > 0){
          LouverList1.push(1);
        }else{
          LouverList1.push(0);
        }
      }
    }
  }
}else{ //baseline --- louvers extend to infinty
  // VERTICAL SHADES XY

        let b1;
        let Xloc1 = [];
        let XYtest1 = [];
        let AWArray1 = [];
        let ZAdd = [];
        let bigB = 0;
        let superB = [];
        let superD = [];
        let filledList = [];
        for (let i = 0; i<gridX; i++) {
          let YdistanceFromWall = (i+1); // grid distance from window wall in Y direction
          b1 = 0;
          filledList.push(0);
          for (let j = 0; j<gridY; j++){
            b1 = 0;
            for (let k = 0; k<coordinates.length; k++){
              let XYLouver1 = 0;
              let XlocationOnWall = 180; // this is a safe angle for the point to start from.. 180 means that it is perpindicular from the point (towards the wall?)
              if (newCoordinateArray[k]<88.0 && newCoordinateArray[k]> -88.0){
                  XlocationOnWall = Math.tan(newCoordinateArray[k]*(3.1415926 / 180))*YdistanceFromWall; //this is real point at the window wall relative to the grid point. Add j to get the real location on the window wall
              }
              AWArray1.push(XlocationOnWall);
              let xCoord = 0;
              let bigBArray = [];
              let superC = [];

              for (let n = 0; n<r.glzCoords.length; n++){ //cycle through each window
                // if (XlocationOnWall+(j+1) > r.glzCoords[n][0][0]+(wallDepVal/2)  && XlocationOnWall+(j+1) < r.glzCoords[n][1][0]+(wallDepVal/2)){ //cycle through all the windows, check if the wall position exists within the bounds of the window
                //   xCoord = n+1; //we really only care about if a point gets hit 1x per timestep so this number could go crazy high, but it only needs to go up by 1 to count.. if it gets sun from multiple windows it doesnt really matter
                // }
                // xCoord = 1;
              //}if(xCoord > 0){ //if this specific gridpoint and sun angle goes through a window...
              let newBigBArray = [];
                  for (let p = 0; p<parseInt(vertShadeNum); p++){ //for each shade in this window...

                    let angleA = abs(newCoordinateArray[k]);
                    let angleB = 90.0-abs(newCoordinateArray[k]);
                    if (newCoordinateArray[k] > 0){
                      angleB = angleB * -1;
                    }
                    let bigA;
                    if(vertShadeStart == "L"){
                      bigA = ((XlocationOnWall+(j+1)+(r.glzCoords[n][0][0]-(wallDepVal/2))+(p*parseInt(vertShadeSpace)-vertShadeShift)));
                    }else{
                      bigA = ((XlocationOnWall+(j+1)-(r.glzCoords[n][0][0]+(wallDepVal/2))+(-p*parseInt(vertShadeSpace)-vertShadeShift)));
                    }
                    bigB = ((Math.sin(angleB*(3.1415926 / 180))*bigA)/(Math.sin(angleA*(3.1415926 / 180))));
                    bigBArray.push(bigB);
                    newBigBArray.push(bigB);
                  }superC.push(newBigBArray);
              }//console.log(bigBArray.length);
              superB.push(bigBArray);
              superD.push(superC);
              for (let q = 0; q < superC.length; q++){ // I think the problem exists here... need a second layer of for loop?
                for (let g = 0; g < superC[0].length; g++){
                  if (superC[q][g] > parseInt(vertShadeDist) && superC[q][g] < (parseInt(vertShadeDist) + parseInt(vertShadeDep))){
                    XYLouver1 = XYLouver1 + 1;
                }else{
                  }
                }
              }//ZAdd.push(bigB)
              if (XYLouver1 > 0){
                b1 = 1;
              }else{
                b1 =  0;
              }LouverList1.push(b1);
            }
          }
        }
        //console.log(filledListI);

}

//END OF VERTICAL SHADES




    //START PYTHAGOREAM THEORM FOR XY
    //ASSUME +Y IS DUE NORTH and is the wall opposite the windowwall is N (windowwall is S)

    let b;
    let Xloc = []
    let XYtest = []
    let AWArray = []
    for (let i = 0; i<gridX; i++) {
      let YdistanceFromWall = (i+1); // grid distance from window wall in Y direction
      b = 0;
      for (let j = 0; j<gridY; j++){
        b = 0;
        for (let k = 0; k<coordinates.length; k++){
          let XlocationOnWall = 180; // this is a safe angle for the point to start from.. 180 means that it is perpindicular from the point (towards the wall?)
          if (newCoordinateArray[k]<88.0 && newCoordinateArray[k]> -88.0){
              XlocationOnWall = Math.tan(newCoordinateArray[k]*(3.1415926 / 180))*YdistanceFromWall; //this is real point at the window wall relative to the grid point. Add j to get the real location on the window wall
              //console.log(XlocationOnWall);
          }
          AWArray.push(XlocationOnWall);
          let xCoord = 0;
          let vertLouverXdistance = [];
          for (let m = 0; m<r.glzCoords.length; m++){

            if (XlocationOnWall+(j+1) > r.glzCoords[m][0][0]+(wallDepVal/2)  && XlocationOnWall+(j+1) < r.glzCoords[m][1][0]+(wallDepVal/2)){ //cycle through all the windows, check if the wall position exists within the bounds of the window
              xCoord = xCoord + 1; //we really only care about if a point gets hit 1x per timestep so this number could go crazy high, but it only needs to go up by 1 to count.. if it gets sun from multiple windows it doesnt really matter
            }
          }
          if (xCoord > 0){
            b = 1;
          }else{
            b =  0;
          }XYtest.push(b);

        }
      }
    }
    //END PYTHAGOREM THEORM FOR XY


    //START PYTHAGOREAM THEORM FOR Z

    let a;
    let Ztest = [];
    let AHArray = [];
    for (let i = 0; i<gridX; i++) {
      let distanceFromWall = (i+1)/4;
      a = 0;
      for (let j = 0; j<gridY; j++){
        a = 0;
        for (let k = 0; k<coordinates.length; k++){
          let angleHeight = Math.tan((coordinates[k][1])*(3.1415926 / 180))*distanceFromWall;
          AHArray.push(coordinates[k][1]);
          if (coordinates[k][1] < 0 ){
            a = 0;
          }else if (angleHeight > r.glzCoords[0][0][2]-gridHt && angleHeight < (r.glzCoords[0][2][2] -gridHt)){
            let testArray1 = [1];
            for (let n = 0; n < horzShadeNum; n++){
              let sinLawDist = (horzShadeDist*(Math.sin(3.1415926-(((90)-coordinates[k][1])*(3.1415926 / 180))-(90*(3.1415926 / 180)))))/Math.sin(((90)-coordinates[k][1])*(3.1415926 / 180));
              let sinLawAngle = (horzShadeDep*(Math.sin(3.1415926-(((90)-coordinates[k][1])*(3.1415926 / 180))-(horzShadeAngle*(3.1415926 / 180)))))/Math.sin(((90)-coordinates[k][1])*(3.1415926 / 180));

              if (angleHeight < (r.glzCoords[0][2][2]-gridHt)-(horzShadeSpace*n)-(sinLawDist)+(p.float(horzShadeHeight)*.5) && angleHeight > ((r.glzCoords[0][2][2]-gridHt)-(horzShadeSpace*n)-(sinLawDist)-(sinLawAngle)+(p.float(horzShadeHeight)*.5))){
                testArray1.push(0);
              }else{
                testArray1.push(1);
              }
            }
            let SortedArray = testArray1.sort();
            let SALength = testArray1.length;
            let itemArray = SortedArray[0];
            a = itemArray;

            //console.log(SortedArray);
          }else{
            a = 0;
          }Ztest.push(a);
        }
      }
    }
  //END PYTHAGOREAM THEROM FOR Z

    //START XY and Z check
    let gridColor;
    //let gridColorArray = []
    for (let i = 0; i < XYtest.length; i++){

      let XYLouv = LouverList1[i];
      let XYcolor = XYtest[i];
      let Zcolor = Ztest[i];

      if (XYcolor == 1 && Zcolor == 1 && XYLouv == 0){
        gridColor = gridColor + 1;
      }else{
        gridColor = gridColor + 0;
      }if (i % coordinates.length == (coordinates.length)-1){
        gridColorArray.push(gridColor);
        gridColor = 0;
    }
  }


}






// console.log(gridColorArray.length);
// console.log(gridColorArray)





  //END OF TRIG
}

/* ------ FUNCTIONS TO UPDATE DATA ------ */
  // Called after adjusting values based on change events
  function updateData(object) {
    // Re-run the functions with the new inputs.
    var fullData = script.computeData(object);

    //update datasets with new value
    var newDataset = fullData.dataSet;

    var newGlzCoords = fullData.glzCoords;
    var newGlzWidth = fullData.windowWidth;
    var newGlzHeight = fullData.windowHeight;
    var newGlzRatio = fullData.glzRatio;
    var newSillHeight = fullData.sillHeight;
    var newCentLineDist = fullData.centLineDist;
    var newOccLocData = fullData.occPtInfo;
    var newCondensation = fullData.condensation;


    // Update values in object
    //update window width
    object.windowWidthValue = newGlzWidth;
    //update glazing ratio
    object.glzRatioValue = newGlzRatio*100;
    //update window height
    object.windowHeightValue = newGlzHeight;
    //update sill height
    object.sillHeightValue = newSillHeight;
    //update dist btwn windows.
    object.distanceWindows = newCentLineDist;

    autocalcUValues();



  }


  function autocalcUValues() {
    // Re-run the functions with the new inputs.
    var fullDataCase1 = script.computeData(case1Data);

    //Compute the U-Value required to make the occupant comfortable.
    var numPtsLen = (fullDataCase1.wallViews.length)-1
    case1Data.calcUVal = uVal.uValFinal(fullDataCase1.wallViews[numPtsLen], fullDataCase1.glzViews[numPtsLen], fullDataCase1.facadeDist[numPtsLen], fullDataCase1.dwnPPDFac, parseFloat(case1Data.windowHeightValue), parseFloat(case1Data.sillHeightValue), case1Data.airtempValue, case1Data.outdoorTempValue, case1Data.rvalueValue, case1Data.intLowEChecked, case1Data.intLowEEmissivity, case1Data.airspeedValue, case1Data.humidityValue, case1Data.metabolic, case1Data.clothingValue, ppdValue, ppdValue2);

  }


  function directNormalIrradiance(solarAngle){
    let Idir;
    if(solarAngle <= 5){
      Idir = map_range(solarAngle, 0, 5, 0, 210);
    } else if(solarAngle <= 10){
      Idir = map_range(solarAngle, 5, 10, 210, 390);
    }else if(solarAngle <= 20){
      Idir = map_range(solarAngle, 10, 20, 390, 620);
    }else if(solarAngle <= 30){
      Idir = map_range(solarAngle, 20, 30, 620, 740);
    }else if(solarAngle <= 40){
      Idir = map_range(solarAngle, 30, 40, 740, 810);
    }else if(solarAngle <= 50){
      Idir = map_range(solarAngle, 40, 50, 810, 860);
    }else if(solarAngle <= 60){
      Idir = map_range(solarAngle, 50, 60, 860, 890);
    }else if(solarAngle <= 70){
      Idir = map_range(solarAngle, 60, 70, 890, 910);
    }else if(solarAngle <= 80){
      Idir = map_range(solarAngle, 70, 80, 910, 920);
    }else if(solarAngle <= 90){
      Idir = map_range(solarAngle, 80, 90, 920, 925);
    }
    return Idir;
    
  }
  
  
  function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
  }


  function determinePPD(PMV){

    let PPD = 100 - 95*Math.E**(-1*(0.03353*(PMV**4)+0.2179*(PMV**2)))
    return PPD;
  
  }
