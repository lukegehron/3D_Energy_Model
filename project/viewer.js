import * as THREE from '../build/three.module.js';
import { OrbitControls } from "./jsm/controls/OrbitControls.js";
import Stats from './jsm/libs/stats.module.js';

var container, stats;
var camera, scene, raycaster, renderer, geometry;
var cameraControls;





// TWEAKPANE Parameter objects
const PARAMS1 = {
    model: 0,
};

const CLIMATE_PARAMS = {
    longitude: -71,
    latitude: 42,
    timeZoneOffset: -5
};

const TIME_PARAMS = {
    studyType: 1,
    hour: 12,
    day: 21,
    month: 9,
    timeStep: 4
};

const ROOM_PARAMS = {
    orientation: 0,
    ceilHeight: 12,
    gridHeight:3,
    length: 30,
    depth: 20
};

const WINDOW_PARAMS = {
    heightFromSill: 7.0,
    sillHeight: 2.0,
    glazingBy: 0,
    glazingRatio: 40,
    width: 14,
    separation: 12
}

const HORIZONTAL_SHADE_PARAMS = {
    depth: 1,
    number: 0,
    spacing: 3,
    dist: 0,
    heightAbove: 0,
    angle: 90
}

const VERTICAL_SHADE_PARAMS = {
    depth: 3,
    number: 0,
    spacing: 3,
    leftRight: 0,
    lrShift: 0,
    dist: 0,
    fullHeight: 1,
    heightAbove: 0,
    relativeHeight: 0,
    angle: 90
}

var mouse = new THREE.Vector2(), INTERSECTED;
var frustumSize = 1000;

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
    var light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.40));

    //THREE_GEOMETRY
    geometry = new THREE.PlaneBufferGeometry(0.9, 0.9);
    updateRoom();

    raycaster = new THREE.Raycaster();

    //THREE_RENDERER
    renderer = new THREE.WebGLRenderer( {antialias: true});
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

    geometry_pane.on('change', (value) => {
        console.log('changed: ' + String(value));
        console.log(ROOM_PARAMS)
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

    updateRoom()

    
    animate();
}

//UPDATE ROOM SIZE
function updateRoom(){

    //CREATE GRID AT Z-HEIGHT 0
    const gridMaterial = new THREE.MeshLambertMaterial({
        color: 0xeeeeee,
        transparent: true,
        opacity: 0.7
    });
    for (let i = ROOM_PARAMS.length / -2; i < ROOM_PARAMS.length / 2; i++) {
        for (let j = ROOM_PARAMS.depth / -2; j < ROOM_PARAMS.depth / 2; j++) {
            // const material = new THREE.MeshBasicMaterial({
            //     color: 0x000000,
            //     side: THREE.DoubleSide
            // });
            const plane = new THREE.Mesh(geometry, gridMaterial);
            plane.position.x = i;
            plane.position.y = j;
            plane.name = "grid";
            plane.userData = {
                loc_i: ROOM_PARAMS.depth / 2 + i,
                loc_j: ROOM_PARAMS.length / 2 + j
            }
            scene.add(plane);
        }
    }

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
    corner1.push( new THREE.Vector3( ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / -2 - .5, - ROOM_PARAMS.gridHeight ) );
    corner1.push( new THREE.Vector3( ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / -2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight ) );

    let lineGeometry = new THREE.BufferGeometry().setFromPoints( corner1 );
    let line = new THREE.Line( lineGeometry, lineMaterial );
    line.name = "outline"
    scene.add( line );

    corner2.push( new THREE.Vector3( ROOM_PARAMS.length / 2 - .5, ROOM_PARAMS.depth / 2 - .5, - ROOM_PARAMS.gridHeight ) );
    corner2.push( new THREE.Vector3( ROOM_PARAMS.length / 2 - .5, ROOM_PARAMS.depth / 2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight ) );

    lineGeometry = new THREE.BufferGeometry().setFromPoints( corner2 );
    line = new THREE.Line( lineGeometry, lineMaterial );
    line.name = "outline"
    scene.add( line );

    corner3.push( new THREE.Vector3( ROOM_PARAMS.length / 2 - .5, ROOM_PARAMS.depth / -2 - .5, - ROOM_PARAMS.gridHeight ) );
    corner3.push( new THREE.Vector3( ROOM_PARAMS.length / 2 - .5, ROOM_PARAMS.depth / -2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight ) );

    lineGeometry = new THREE.BufferGeometry().setFromPoints( corner3 );
    line = new THREE.Line( lineGeometry, lineMaterial );
    line.name = "outline"
    scene.add( line );

    corner4.push( new THREE.Vector3( ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / 2 - .5, - ROOM_PARAMS.gridHeight ) );
    corner4.push( new THREE.Vector3( ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / 2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight ) );

    lineGeometry = new THREE.BufferGeometry().setFromPoints( corner4 );
    line = new THREE.Line( lineGeometry, lineMaterial );
    line.name = "outline"
    scene.add( line );

    //FLOOR OUTLINE
    floor.push( new THREE.Vector3( ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / 2 - .5, - ROOM_PARAMS.gridHeight ) );
    floor.push( new THREE.Vector3( ROOM_PARAMS.length / 2 - .5, ROOM_PARAMS.depth / 2 - .5, - ROOM_PARAMS.gridHeight ) );
    floor.push( new THREE.Vector3( ROOM_PARAMS.length / 2 - .5, ROOM_PARAMS.depth / -2 - .5, - ROOM_PARAMS.gridHeight ) );
    floor.push( new THREE.Vector3( ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / -2 - .5, - ROOM_PARAMS.gridHeight ) );
    floor.push( new THREE.Vector3( ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / 2 - .5, - ROOM_PARAMS.gridHeight ) );
    
    lineGeometry = new THREE.BufferGeometry().setFromPoints( floor );
    line = new THREE.Line( lineGeometry, lineMaterial );
    line.name = "outline"
    scene.add( line );

    //CEILING OUTLINE
    ceil.push( new THREE.Vector3( ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / 2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight ) );
    ceil.push( new THREE.Vector3( ROOM_PARAMS.length / 2 - .5, ROOM_PARAMS.depth / 2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight ) );
    ceil.push( new THREE.Vector3( ROOM_PARAMS.length / 2 - .5, ROOM_PARAMS.depth / -2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight ) );
    ceil.push( new THREE.Vector3( ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / -2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight ) );
    ceil.push( new THREE.Vector3( ROOM_PARAMS.length / -2 - .5, ROOM_PARAMS.depth / 2 - .5, ROOM_PARAMS.ceilHeight - ROOM_PARAMS.gridHeight ) );

    lineGeometry = new THREE.BufferGeometry().setFromPoints( ceil );
    line = new THREE.Line( lineGeometry, lineMaterial );
    line.name = "outline"
    scene.add( line );

    //GEO Result - TAKES DATA FROM THE GEO.JS FILE
    //geo.createGlazingForRect = function(rectHeight, wallLength, glazingRatio, windowWidth, winHeight, silHeight, distBreakup, ratioOrWidth, changedVar)
    var geoResult = geo.createGlazingForRect(
        parseFloat(ROOM_PARAMS.ceilHeight), 
        parseFloat(ROOM_PARAMS.depth), 
        WINDOW_PARAMS.glazingRatio/100.0, 
        parseFloat(WINDOW_PARAMS.width), 
        parseFloat(WINDOW_PARAMS.heightFromSill), 
        parseFloat(WINDOW_PARAMS.sillHeight), 
        parseFloat(WINDOW_PARAMS.separation), 
        WINDOW_PARAMS.glazingBy
    );
    var r = {}
    r.wallCoords = geoResult.wallCoords;
    r.glzCoords = geoResult.glzCoords;
    r.glzRatio = geoResult.glzRatio;
    r.windowWidth = geoResult.windowWidth;
    r.windowHeight = geoResult.windowHeight;
    r.sillHeight = geoResult.sillHeight;
    r.centLineDist = geoResult.centLineDist;

    

    for(let i = 0; i < r.glzCoords.length; i++){
        const window = [];

            window.push( new THREE.Vector3( r.glzCoords[i][0][0], r.glzCoords[i][0][1], r.glzCoords[i][0][2] ) );
            window.push( new THREE.Vector3( r.glzCoords[i][1][0], r.glzCoords[i][1][1], r.glzCoords[i][1][2] ) );
            window.push( new THREE.Vector3( r.glzCoords[i][2][0], r.glzCoords[i][2][1], r.glzCoords[i][2][2] ) );
            window.push( new THREE.Vector3( r.glzCoords[i][3][0], r.glzCoords[i][3][1], r.glzCoords[i][3][2] ) );
            window.push( new THREE.Vector3( r.glzCoords[i][0][0], r.glzCoords[i][0][1], r.glzCoords[i][0][2] ) );
            
            lineGeometry = new THREE.BufferGeometry().setFromPoints( window );
            line = new THREE.Line( lineGeometry, lineMaterial );
            line.name = "outline"
            scene.add( line );
    }

    console.log(r);
}

// CHECKS INTERSECTIONS
function render() {
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {

        if (INTERSECTED != intersects[0].object) {

            // if (INTERSECTED) INTERSECTED.material.color.setHex(INTERSECTED.currentHex);

            if(INTERSECTED != null && INTERSECTED.name == "grid"){
                // console.log(INTERSECTED)
                console.log(INTERSECTED.userData.loc_i, INTERSECTED.userData.loc_j)
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