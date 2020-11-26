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

const ROOM_PARAMS = {
    width: 20,
    length: 40,
    speed: 0.5,
    acceleration: 40,
    randomness: 12
};



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
    const pane1 = new Tweakpane({
        container: document.getElementById('tweakpane1'),
    });
    pane1.addInput(PARAMS1, 'model', {
        options: {
            directSolar: 0,
            meanRadiantTemp: 1,
            winterComfort: 2,
        },
    });

    const pane = new Tweakpane({
        container: document.getElementById('tweakpane2'),
    });

    const f1 = pane.addFolder({
        title: 'Climate',
    });
    f1.addInput(ROOM_PARAMS, 'speed');

    const f2 = pane.addFolder({
        expanded: true,
        title: 'Room',
    });
    f2.addInput(ROOM_PARAMS, 'width');
    f2.addInput(ROOM_PARAMS, 'length');

    pane.on('change', (value) => {
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

function updateRoom(){
    for (let i = ROOM_PARAMS.width / -2; i < ROOM_PARAMS.width / 2; i++) {
        for (let j = ROOM_PARAMS.length / -2; j < ROOM_PARAMS.length / 2; j++) {
            const material = new THREE.MeshBasicMaterial({
                color: 0x000000,
                side: THREE.DoubleSide
            });
            const plane = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
                color: 0xeeeeee
            }));
            plane.position.x = i;
            plane.position.y = j;
            plane.name = "grid";
            plane.userData = {
                loc_i: ROOM_PARAMS.width / 2 + i,
                loc_j: ROOM_PARAMS.length / 2 + j
            }
            scene.add(plane);
        }
    }
}

//CHANGE THIS TO PERSPECTIVE
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

function render() {
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
        console.log(intersects.length)

        if (INTERSECTED != intersects[0].object) {

            console.log(INTERSECTED)

            if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

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