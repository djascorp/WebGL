/**
 * auteur DJasnive
 * Ce fichier JS permet d'inclure la notion d'objet dans le context actuel
 * Il nous permettrait de mieux progammer en WebGL
 */
function DjasGL(canvasId) {


    this.initGL = function (canvasId) {
        this.id = canvasId;
        var canvas = document.getElementById(canvasId);
        gl = canvas.getContext("webgl");
        if (!gl) {
            alert("Votre navigateur ne supporte pas WebGL");
        } else {
            console.log("VERSION: " + gl.getParameter(gl.VERSION));
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;
        }
    };
    this.getShader = function (id) {
        var shaderScript = document.getElementById(id);
        if (!shaderScript) {
            return null;
        }

        var str = "";
        var k = shaderScript.firstChild;
        while (k) {
            if (k.nodeType == 3) {
                str += k.textContent;
            }
            k = k.nextSibling;
        }

        var shader;
        if (shaderScript.type == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            return null;
        }


        gl.shaderSource(shader, str);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    };
    this.createProgram = function (id) {
        var programShader = gl.createProgram();
        var vert = this.getShader(id + "-vs");
        var frag = this.getShader(id + "-fs");
        gl.attachShader(programShader, vert);
        gl.attachShader(programShader, frag);
        gl.linkProgram(programShader);
        if (!gl.getProgramParameter(programShader, gl.LINK_STATUS)) {
            alert(gl.getProgramInfoLog(programShader));
            return null;
        }
        return programShader;
    };



    this.setMatrixUniforms = function (shaderProgram,pMatrix, mvMatrix) {
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    };

    this.initGL(canvasId);
}

function Scene(djasGL) {
    this.objets = new Array();
    this.lumieres = new Array();
    this.camera = new Camera();
    this.uniformLocation = new Array();

    this.clearColor = [0.2, 0.2, 0.2, 1.0];
    this.clearDepth = 1.0;
    this.toEnables = new Array([gl.DEPTH_TEST]);

    // TODO CHANGER EN Parametre
    this.djasGL = djasGL;
    this.mvMatrix = mat4.create();
    this.pMatrix = mat4.create();

    this.mvMatrixStack = [];

    this.mvPushMatrix = function() {
        var copy = mat4.create();
        mat4.set(this.mvMatrix, copy);
        this.mvMatrixStack.push(copy);
    };

    this.mvPopMatrix = function() {
        if (this.mvMatrixStack.length === 0) {
            throw "Incorrect popMatrix!";
        }
        this.mvMatrix = this.mvMatrixStack.pop();
    };


    this.setMatrixUniforms = function () {
        this.djasGL.setMatrixUniforms(this.shaderProgram,this.mvMatrix, this.pMatrix);
    };

    this.addUniformLocation = function (variable, value) {
        this.uniformLocation.push([variable, value]);
    };

    this.clearView = function () {
        gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3]);
        gl.clearDepth(this.clearDepth);
        this.toEnables.forEach(function (value) {
            gl.enable(value);
        });

        //gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    };
    this.draw = function () {
       this.initShaders();
       this.initBuffers();

       this.clearView();

       this.drawScene();
       //this.loop();
    };

    this.initialize = function(){
        this.addUniformLocation(this.shaderProgram.pMatrixUniform,"uPMatrix");
        this.addUniformLocation(this.shaderProgram.mvMatrixUniform,"uMVMatrix");
    };

    this.drawScene = function () {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, this.pMatrix);
        mat4.identity(this.mvMatrix);

        // afficher les objets attacher a la scene
        this.objets.forEach(function (objet) {
            objet.drawObjet();
        })
    };
    this.initShaders = function () {
        this.shaderProgram = this.djasGL.createProgram(this.djasGL.id);
        gl.useProgram(this.shaderProgram);
        this.initialize();

        console.log(this.shaderProgram);
        // Initialisation de chaque Shaders des objets rattachés a notre scene
        this.objets.forEach(function (objet) {
            objet.initShader();
        });

        // Obtenir les variables du Shader
        var shaderProgram = this.shaderProgram;
        this.uniformLocation.forEach(function (tab) {
            tab[0] = gl.getUniformLocation(shaderProgram, tab[1]);
        });

        console.log(shaderProgram);
    };
    this.initBuffers = function () {
        this.objets.forEach(function (objet) {
            objet.initBuffer();
        });
    };

     this.loop = function() {
        this.drawScene();
        window.requestAnimationFrame(this.loop);
    };
     this.add = function (objet) {
         objet.attachTo(this);
     };

     // Constructeur


}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

function Lumiere() {

}

function Camera() {

}

function Cube(sizeX = 1.0, sizeY = 1.0, sizeZ = 1.0) {
    this.vertex = [

        // Front face
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0, 1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, -1.0, -1.0,

        // Top face
        -1.0, 1.0, -1.0,
        -1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, 1.0,
        -1.0, -1.0, 1.0,

        // Right face
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0,
        -1.0, 1.0, 1.0,
        -1.0, 1.0, -1.0,

    ];

    this.color = [
        [0.2,0.7,0.7,1],
        [0.2,0.7,0.7,1],
        [0.2,0.7,0.7,1],
        [0.2,0.7,0.7,1],
        [0.2,0.7,0.7,1],
        [0.2,0.7,0.7,1]
    ];

    this.vertexIndice = [
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23  // Left face
    ];
    this.shaderProgram = null;

    this.attachTo = function (scene = new Scene()) {
        this.scene = scene;
        this.scene.objets.push(this);

    };
    this.initShader = function () {

        this.scene.shaderProgram.vertexPositionAttribute = gl.getAttribLocation(this.scene.shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(this.scene.shaderProgram.vertexPositionAttribute);

        this.scene.shaderProgram.vertexColorAttribute = gl.getAttribLocation(this.scene.shaderProgram, "aVertexColor");
        gl.enableVertexAttribArray(this.scene.shaderProgram.vertexColorAttribute);

    };
    this.initBuffer = function () {
        this.vertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertex), gl.STATIC_DRAW);
        this.vertexPositionBuffer.itemSize = 3;
        this.vertexPositionBuffer.numItems = 24;

        var unpackedColors = [];
        for (var i in this.color) {
            var color = this.color[i];
            for (var j=0; j < 4; j++) {
                unpackedColors = unpackedColors.concat(color);
            }
        }

        this.vertexColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexColorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
        this.vertexColorBuffer.itemSize = 4;
        this.vertexColorBuffer.numItems = 24;

        this.vertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.vertexIndice), gl.STATIC_DRAW);
        this.vertexIndexBuffer.itemSize = 1;
        this.vertexIndexBuffer.numItems = 36;
    };


    this.drawObjet = function(){
        this.scene.mvPushMatrix();
        mat4.translate(this.scene.mvMatrix,this.vecPos);
        mat4.rotate(this.scene.mvMatrix, degToRad(this.angleRot), this.vecRot);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        gl.vertexAttribPointer(this.scene.shaderProgram.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexColorBuffer);
        gl.vertexAttribPointer(this.scene.shaderProgram.vertexColorAttribute, this.vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        this.scene.setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, this.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

        this.scene.mvPopMatrix();
    };



    this.rotate = function(angleRot = 0,vec = [0,1,0]){
        this.angleRot = angleRot;
        this.vecRot = vec;
    };
    this.vecPos = [0,0,0];
    this.vecRot = [0,0,0];
    this.angleRot = 0;
    this.translate = function (vec = [3,0,0]) {
        this.vecPos = vec;
    };


}



var gl;
var djasGL = new DjasGL("webgl");
var scene = new Scene(djasGL);
var cube = new Cube();

scene.add(cube);
scene.draw();



