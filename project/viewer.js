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
    length: 40,
    depth: 20
};

const WINDOW_PARAMS = {
    heightFromSill: 7.0,
    sillHeight: 2.0,
    glazingBy: 0,
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
    camera = new THREE.PerspectiveCamera(0.1, window.innerWidth / window.innerHeight, 1, 100000);
    camera.position.x = 20000;
    camera.position.y = 20000;
    camera.position.z = 20000;
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
    renderer = new THREE.WebGLRenderer();
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
    let count = 0;
    var selectedObject = scene.getObjectByName("grid");
    do {
        scene.remove(selectedObject);
        selectedObject = scene.getObjectByName("grid");
        count++;
    } while (selectedObject != null)

    updateRoom()

    
    animate();
}

//UPDATE ROOM SIZE
function updateRoom(){
    for (let i = ROOM_PARAMS.depth / -2; i < ROOM_PARAMS.depth / 2; i++) {
        for (let j = ROOM_PARAMS.length / -2; j < ROOM_PARAMS.length / 2; j++) {
            const material = new THREE.MeshBasicMaterial({
                color: 0x000000,
                side: THREE.DoubleSide
            });
            const plane = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
                color: 0xeeeeee
            }));
            plane.position.y = i;
            plane.position.x = j;
            plane.name = "grid";
            plane.userData = {
                loc_i: ROOM_PARAMS.width / 2 + i,
                loc_j: ROOM_PARAMS.length / 2 + j
            }
            scene.add(plane);
        }
    }
}

// CHECKS INTERSECTIONS
function render() {
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {

        if (INTERSECTED != intersects[0].object) {

            if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

            if(INTERSECTED != null){
                console.log(INTERSECTED)
            }

            

            INTERSECTED = intersects[0].object;
            INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
            INTERSECTED.material.emissive.setHex(0xff0000);
        }

    } else {
        if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
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