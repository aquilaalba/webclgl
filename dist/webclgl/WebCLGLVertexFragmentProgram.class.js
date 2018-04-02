(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
(function (global){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

/** 
* Utilities
* @class
* @constructor
*/
var WebCLGLUtils = exports.WebCLGLUtils = function () {
    function WebCLGLUtils() {
        _classCallCheck(this, WebCLGLUtils);
    }

    /**
     * loadQuad
     */

    _createClass(WebCLGLUtils, [{
        key: "loadQuad",
        value: function loadQuad(node, length, height) {
            var l = length === undefined || length === null ? 0.5 : length;
            var h = height === undefined || height === null ? 0.5 : height;
            this.vertexArray = [-l, -h, 0.0, l, -h, 0.0, l, h, 0.0, -l, h, 0.0];

            this.textureArray = [0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0];

            this.indexArray = [0, 1, 2, 0, 2, 3];

            var meshObject = {};
            meshObject.vertexArray = this.vertexArray;
            meshObject.textureArray = this.textureArray;
            meshObject.indexArray = this.indexArray;

            return meshObject;
        }
    }, {
        key: "createShader",

        /**
         * createShader
         */
        value: function createShader(gl, name, sourceVertex, sourceFragment, shaderProgram) {
            var _sv = false,
                _sf = false;

            var makeDebug = function (infoLog, shader) {
                console.log(infoLog);

                var arrErrors = [];
                var errors = infoLog.split("\n");
                for (var n = 0, f = errors.length; n < f; n++) {
                    if (errors[n].match(/^ERROR/gim) != null) {
                        var expl = errors[n].split(':');
                        var line = parseInt(expl[2]);
                        arrErrors.push([line, errors[n]]);
                    }
                }
                var sour = gl.getShaderSource(shader).split("\n");
                sour.unshift("");
                for (var _n = 0, _f = sour.length; _n < _f; _n++) {
                    var lineWithError = false;
                    var errorStr = '';
                    for (var e = 0, fe = arrErrors.length; e < fe; e++) {
                        if (_n === arrErrors[e][0]) {
                            lineWithError = true;
                            errorStr = arrErrors[e][1];
                            break;
                        }
                    }
                    if (lineWithError === false) {
                        console.log("%c" + _n + ' %c' + sour[_n], "color:black", "color:blue");
                    } else {
                        console.log('%c►►%c' + _n + ' %c' + sour[_n] + '\n%c' + errorStr, "color:red", "color:black", "color:blue", "color:red");
                    }
                }
            }.bind(this);

            var shaderVertex = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(shaderVertex, sourceVertex);
            gl.compileShader(shaderVertex);
            if (!gl.getShaderParameter(shaderVertex, gl.COMPILE_STATUS)) {
                var infoLog = gl.getShaderInfoLog(shaderVertex);
                console.log("%c" + name + ' ERROR (vertex program)', "color:red");

                if (infoLog !== undefined && infoLog !== null) makeDebug(infoLog, shaderVertex);
            } else {
                gl.attachShader(shaderProgram, shaderVertex);
                _sv = true;
            }

            var shaderFragment = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(shaderFragment, sourceFragment);
            gl.compileShader(shaderFragment);
            if (!gl.getShaderParameter(shaderFragment, gl.COMPILE_STATUS)) {
                var _infoLog = gl.getShaderInfoLog(shaderFragment);
                console.log("%c" + name + ' ERROR (fragment program)', "color:red");

                if (_infoLog !== undefined && _infoLog !== null) makeDebug(_infoLog, shaderFragment);
            } else {
                gl.attachShader(shaderProgram, shaderFragment);
                _sf = true;
            }

            if (_sv === true && _sf === true) {
                gl.linkProgram(shaderProgram);
                var success = gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);
                if (success) {
                    return true;
                } else {
                    console.log('Error shader program ' + name + ':\n ');
                    var log = gl.getProgramInfoLog(shaderProgram);
                    if (log !== undefined && log !== null) console.log(log);
                    return false;
                }
            } else {
                return false;
            }
        }
    }, {
        key: "pack",

        /**
         * Pack 1float (0.0-1.0) to 4float rgba (0.0-1.0, 0.0-1.0, 0.0-1.0, 0.0-1.0)
         */
        value: function pack(v) {
            var bias = [1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0];

            var r = v;
            var g = this.fract(r * 255.0);
            var b = this.fract(g * 255.0);
            var a = this.fract(b * 255.0);
            var colour = [r, g, b, a];

            var dd = [colour[1] * bias[0], colour[2] * bias[1], colour[3] * bias[2], colour[3] * bias[3]];

            return [colour[0] - dd[0], colour[1] - dd[1], colour[2] - dd[2], colour[3] - dd[3]];
        }
    }, {
        key: "unpack",

        /**
         * Unpack 4float rgba (0.0-1.0, 0.0-1.0, 0.0-1.0, 0.0-1.0) to 1float (0.0-1.0)
         */
        value: function unpack(colour) {
            var bitShifts = [1.0, 1.0 / 255.0, 1.0 / (255.0 * 255.0), 1.0 / (255.0 * 255.0 * 255.0)];
            return this.dot4(colour, bitShifts);
        }
    }], [{
        key: "getWebGLContextFromCanvas",

        /**
         * getWebGLContextFromCanvas
         * @param {HTMLCanvasElement} canvas
         * @param {Object} ctxOpt
         */
        value: function getWebGLContextFromCanvas(canvas, ctxOpt) {
            var gl = null;
            /*try {
                if(ctxOpt == undefined || ctxOpt === null) gl = canvas.getContext("webgl2");
                else gl = canvas.getContext("webgl2", ctxOpt);
                 console.log((gl == null)?"no webgl2":"using webgl2");
            } catch(e) {
                gl = null;
            }
            if(gl == null) {
                try {
                    if(ctxOpt == undefined || ctxOpt === null) gl = canvas.getContext("experimental-webgl2");
                    else gl = canvas.getContext("experimental-webgl2", ctxOpt);
                     console.log((gl == null)?"no experimental-webgl2":"using experimental-webgl2");
                } catch(e) {
                    gl = null;
                }
            }*/
            if (gl == null) {
                try {
                    if (ctxOpt === undefined || ctxOpt === null) gl = canvas.getContext("webgl");else gl = canvas.getContext("webgl", ctxOpt);

                    console.log(gl == null ? "no webgl" : "using webgl");
                } catch (e) {
                    gl = null;
                }
            }
            if (gl == null) {
                try {
                    if (ctxOpt === undefined || ctxOpt === null) gl = canvas.getContext("experimental-webgl");else gl = canvas.getContext("experimental-webgl", ctxOpt);

                    console.log(gl == null ? "no experimental-webgl" : "using experimental-webgl");
                } catch (e) {
                    gl = null;
                }
            }
            if (gl == null) gl = false;
            return gl;
        }
    }, {
        key: "getUint8ArrayFromHTMLImageElement",

        /**
         * Get Uint8Array from HTMLImageElement
         * @param {HTMLImageElement} imageElement
         * @returns {Uint8ClampedArray}
         */
        value: function getUint8ArrayFromHTMLImageElement(imageElement) {
            var e = document.createElement('canvas');
            e.width = imageElement.width;
            e.height = imageElement.height;
            var ctx2D_tex = e.getContext("2d");
            ctx2D_tex.drawImage(imageElement, 0, 0);
            var arrayTex = ctx2D_tex.getImageData(0, 0, imageElement.width, imageElement.height);

            return arrayTex.data;
        }
    }, {
        key: "dot4",

        /**
         * Dot product vector4float
         */
        value: function dot4(vector4A, vector4B) {
            return vector4A[0] * vector4B[0] + vector4A[1] * vector4B[1] + vector4A[2] * vector4B[2] + vector4A[3] * vector4B[3];
        }
    }, {
        key: "fract",

        /**
         * Compute the fractional part of the argument. fract(pi)=0.14159265...
         */
        value: function fract(number) {
            return number > 0 ? number - Math.floor(number) : number - Math.ceil(number);
        }
    }, {
        key: "packGLSLFunctionString",

        /**
         * Get pack GLSL function string
         * @returns {String}
         */
        value: function packGLSLFunctionString() {
            return 'vec4 pack (float depth) {\n' + 'const vec4 bias = vec4(1.0 / 255.0,\n' + '1.0 / 255.0,\n' + '1.0 / 255.0,\n' + '0.0);\n' + 'float r = depth;\n' + 'float g = fract(r * 255.0);\n' + 'float b = fract(g * 255.0);\n' + 'float a = fract(b * 255.0);\n' + 'vec4 colour = vec4(r, g, b, a);\n' + 'return colour - (colour.yzww * bias);\n' + '}\n';
        }
    }, {
        key: "unpackGLSLFunctionString",

        /**
         * Get unpack GLSL function string
         * @returns {String}
         */
        value: function unpackGLSLFunctionString() {
            return 'float unpack (vec4 colour) {\n' + 'const vec4 bitShifts = vec4(1.0,\n' + '1.0 / 255.0,\n' + '1.0 / (255.0 * 255.0),\n' + '1.0 / (255.0 * 255.0 * 255.0));\n' + 'return dot(colour, bitShifts);\n' + '}\n';
        }
    }, {
        key: "getOutputBuffers",

        /**
         * getOutputBuffers
         * @param {WebCLGLKernel|WebCLGLVertexFragmentProgram} prog
         * @param {Array<WebCLGLBuffer>} buffers
         * @returns {Array<WebCLGLBuffer>}
         */
        value: function getOutputBuffers(prog, buffers) {
            var outputBuff = null;
            if (prog.output !== undefined && prog.output !== null) {
                outputBuff = [];
                if (prog.output[0] != null) {
                    for (var n = 0; n < prog.output.length; n++) {
                        //if(buffers.hasOwnProperty(prog.output[n]) == false && _alerted == false)
                        //    _alerted = true, alert("output argument "+prog.output[n]+" not found in buffers. add desired argument as shared");

                        outputBuff[n] = buffers[prog.output[n]];
                    }
                } else outputBuff = null;
            }
            return outputBuff;
        }
    }, {
        key: "parseSource",

        /**
         * parseSource
         * @param {String} source
         * @param {Object} values
         * @returns {String}
         */
        value: function parseSource(source, values) {
            for (var key in values) {
                var regexp = new RegExp(key + "\\[(?!\\d).*?\\]", "gm"); // avoid normal uniform arrays
                var varMatches = source.match(regexp); // "Search current "argName" in source and store in array varMatches
                //console.log(varMatches);
                if (varMatches != null) {
                    for (var nB = 0, fB = varMatches.length; nB < fB; nB++) {
                        // for each varMatches ("A[x]", "A[x]")
                        var regexpNativeGL = new RegExp('```(\s|\t)*gl.*' + varMatches[nB] + '.*```[^```(\s|\t)*gl]', "gm");
                        var regexpNativeGLMatches = source.match(regexpNativeGL);
                        if (regexpNativeGLMatches == null) {
                            var name = varMatches[nB].split('[')[0];
                            var vari = varMatches[nB].split('[')[1].split(']')[0];

                            var map = { 'float4_fromSampler': source.replace(name + "[" + vari + "]", 'texture2D(' + name + ',' + vari + ')'),
                                'float_fromSampler': source.replace(name + "[" + vari + "]", 'texture2D(' + name + ',' + vari + ').x'),
                                'float4_fromAttr': source.replace(name + "[" + vari + "]", name),
                                'float_fromAttr': source.replace(name + "[" + vari + "]", name) };
                            source = map[values[key].type];
                        }
                    }
                }
            }
            source = source.replace(/```(\s|\t)*gl/gi, "").replace(/```/gi, "").replace(/;/gi, ";\n").replace(/}/gi, "}\n").replace(/{/gi, "{\n");
            return source;
        }
    }, {
        key: "lines_vertex_attrs",

        /**
         * lines_vertex_attrs
         * @param {Object} values
         */
        value: function lines_vertex_attrs(values) {
            var str = '';
            for (var key in values) {
                str += { 'float4_fromSampler': 'uniform sampler2D ' + key + ';',
                    'float_fromSampler': 'uniform sampler2D ' + key + ';',
                    'float4_fromAttr': 'attribute vec4 ' + key + ';',
                    'float_fromAttr': 'attribute float ' + key + ';',
                    'float': 'uniform float ' + key + ';',
                    'float4': 'uniform vec4 ' + key + ';',
                    'mat4': 'uniform mat4 ' + key + ';' }[values[key].type] + '\n';
            }
            return str;
        }
    }, {
        key: "lines_fragment_attrs",

        /**
         * lines_fragment_attrs
         * @param {Object} values
         */
        value: function lines_fragment_attrs(values) {
            var str = '';
            for (var key in values) {
                str += { 'float4_fromSampler': 'uniform sampler2D ' + key + ';',
                    'float_fromSampler': 'uniform sampler2D ' + key + ';',
                    'float': 'uniform float ' + key + ';',
                    'float4': 'uniform vec4 ' + key + ';',
                    'mat4': 'uniform mat4 ' + key + ';' }[values[key].type] + '\n';
            }
            return str;
        }
    }, {
        key: "lines_drawBuffersInit",

        /**
         * lines_drawBuffersInit
         * @param {int} maxDrawBuffers
         */
        value: function lines_drawBuffersInit(maxDrawBuffers) {
            var str = '';
            for (var n = 0, fn = maxDrawBuffers; n < fn; n++) {
                str += '' + 'float out' + n + '_float = -999.99989;\n' + 'vec4 out' + n + '_float4;\n';
            }
            return str;
        }
    }, {
        key: "lines_drawBuffersWriteInit",
        value: function lines_drawBuffersWriteInit(maxDrawBuffers) {
            var str = '';
            for (var n = 0, fn = maxDrawBuffers; n < fn; n++) {
                str += '' + 'layout(location = ' + n + ') out vec4 outCol' + n + ';\n';
            }
            return str;
        }
    }, {
        key: "lines_drawBuffersWrite",

        /**
         * lines_drawBuffersWrite
         * @param {int} maxDrawBuffers
         */
        value: function lines_drawBuffersWrite(maxDrawBuffers) {
            var str = '';
            for (var n = 0, fn = maxDrawBuffers; n < fn; n++) {
                str += '' + 'if(out' + n + '_float != -999.99989) gl_FragData[' + n + '] = vec4(out' + n + '_float,0.0,0.0,1.0);\n' + ' else gl_FragData[' + n + '] = out' + n + '_float4;\n';
            }
            return str;
        }
    }, {
        key: "checkArgNameInitialization",

        /**
         * checkArgNameInitialization
         * @param {Object} inValues
         * @param {String} argName
         */
        value: function checkArgNameInitialization(inValues, argName) {
            if (inValues.hasOwnProperty(argName) === false) {
                inValues[argName] = {
                    "type": null,
                    "expectedMode": null, // "ATTRIBUTE", "SAMPLER", "UNIFORM"
                    "location": null };
            }
        }
    }, {
        key: "get_global_id3_GLSLFunctionString",

        /**
         * get_global_id3_GLSLFunctionString
         */
        value: function get_global_id3_GLSLFunctionString() {
            return '' + 'vec2 get_global_id(float id, float bufferWidth, float geometryLength) {\n' + 'float texelSize = 1.0/bufferWidth;' + 'float num = (id*geometryLength)/bufferWidth;' + 'float column = fract(num)+(texelSize/2.0);' + 'float row = (floor(num)/bufferWidth)+(texelSize/2.0);' + 'return vec2(column, row);' + '}\n';
        }
    }, {
        key: "get_global_id2_GLSLFunctionString",

        /**
         * get_global_id2_GLSLFunctionString
         */
        value: function get_global_id2_GLSLFunctionString() {
            return '' + 'vec2 get_global_id(vec2 id, float bufferWidth) {\n' + 'float texelSize = 1.0/bufferWidth;' + 'float column = (id.x/bufferWidth)+(texelSize/2.0);' + 'float row = (id.y/bufferWidth)+(texelSize/2.0);' + 'return vec2(column, row);' + '}\n';
        }
    }]);

    return WebCLGLUtils;
}();

global.WebCLGLUtils = WebCLGLUtils;
module.exports.WebCLGLUtils = WebCLGLUtils;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],2:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.WebCLGLVertexFragmentProgram = undefined;

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

var _WebCLGLUtils = require('./WebCLGLUtils.class');

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

/**
* WebCLGLVertexFragmentProgram Object
* @class
 * @param {WebGLRenderingContext} gl
 * @param {String} vertexSource
 * @param {String} vertexHeader
 * @param {String} fragmentSource
 * @param {String} fragmentHeader
*/
var WebCLGLVertexFragmentProgram = exports.WebCLGLVertexFragmentProgram = function () {
    function WebCLGLVertexFragmentProgram(gl, vertexSource, vertexHeader, fragmentSource, fragmentHeader) {
        _classCallCheck(this, WebCLGLVertexFragmentProgram);

        this._gl = gl;
        var highPrecisionSupport = this._gl.getShaderPrecisionFormat(this._gl.FRAGMENT_SHADER, this._gl.HIGH_FLOAT);
        this._precision = highPrecisionSupport.precision !== 0 ? 'precision highp float;\n\nprecision highp int;\n\n' : 'precision lowp float;\n\nprecision lowp int;\n\n';

        var _glDrawBuff_ext = this._gl.getExtension("WEBGL_draw_buffers");
        this._maxDrawBuffers = null;
        if (_glDrawBuff_ext != null) this._maxDrawBuffers = this._gl.getParameter(_glDrawBuff_ext.MAX_DRAW_BUFFERS_WEBGL);

        this.name = "";
        this.viewSource = false;

        this.in_vertex_values = {};
        this.in_fragment_values = {};

        this._vertexP_ready = false;
        this._fragmentP_ready = false;

        this._vertexHead = null;
        this._vertexSource = null;
        this._fragmentHead = null;
        this._fragmentSource = null;

        this.output = null; //String or Array<String> of arg names with the items in same order that in the final return
        this.outputTempModes = null;
        this.fBuffer = null;
        this.fBufferTemp = null;

        this.drawMode = 4;

        if (vertexSource !== undefined && vertexSource !== null) this.setVertexSource(vertexSource, vertexHeader);

        if (fragmentSource !== undefined && fragmentSource !== null) this.setFragmentSource(fragmentSource, fragmentHeader);
    }

    /**
     * compileVertexFragmentSource
     */

    _createClass(WebCLGLVertexFragmentProgram, [{
        key: 'compileVertexFragmentSource',
        value: function compileVertexFragmentSource() {
            var sourceVertex = "" + this._precision + 'uniform float uOffset;\n' + 'uniform float uBufferWidth;' + _WebCLGLUtils.WebCLGLUtils.lines_vertex_attrs(this.in_vertex_values) + _WebCLGLUtils.WebCLGLUtils.unpackGLSLFunctionString() + _WebCLGLUtils.WebCLGLUtils.get_global_id3_GLSLFunctionString() + _WebCLGLUtils.WebCLGLUtils.get_global_id2_GLSLFunctionString() + this._vertexHead + 'void main(void) {\n' + this._vertexSource + '}\n';
            var sourceFragment = '#extension GL_EXT_draw_buffers : require\n' + this._precision + _WebCLGLUtils.WebCLGLUtils.lines_fragment_attrs(this.in_fragment_values) + _WebCLGLUtils.WebCLGLUtils.get_global_id3_GLSLFunctionString() + _WebCLGLUtils.WebCLGLUtils.get_global_id2_GLSLFunctionString() + this._fragmentHead +

            //WebCLGLUtils.lines_drawBuffersWriteInit(8)+
            'void main(void) {\n' + _WebCLGLUtils.WebCLGLUtils.lines_drawBuffersInit(8) + this._fragmentSource + _WebCLGLUtils.WebCLGLUtils.lines_drawBuffersWrite(8) + '}\n';

            this.vertexFragmentProgram = this._gl.createProgram();
            var result = new _WebCLGLUtils.WebCLGLUtils().createShader(this._gl, "WEBCLGL VERTEX FRAGMENT PROGRAM", sourceVertex, sourceFragment, this.vertexFragmentProgram);

            this.uOffset = this._gl.getUniformLocation(this.vertexFragmentProgram, "uOffset");
            this.uBufferWidth = this._gl.getUniformLocation(this.vertexFragmentProgram, "uBufferWidth");

            for (var key in this.in_vertex_values) {
                var expectedMode = { 'float4_fromSampler': "SAMPLER",
                    'float_fromSampler': "SAMPLER",
                    'float4_fromAttr': "ATTRIBUTE",
                    'float_fromAttr': "ATTRIBUTE",
                    'float': "UNIFORM",
                    'float4': "UNIFORM",
                    'mat4': "UNIFORM" }[this.in_vertex_values[key].type];

                _WebCLGLUtils.WebCLGLUtils.checkArgNameInitialization(this.in_vertex_values, key);
                var loc = expectedMode === "ATTRIBUTE" ? this._gl.getAttribLocation(this.vertexFragmentProgram, key) : this._gl.getUniformLocation(this.vertexFragmentProgram, key.replace(/\[\d.*/, ""));
                this.in_vertex_values[key].location = [loc];
                this.in_vertex_values[key].expectedMode = expectedMode;
            }

            for (var _key in this.in_fragment_values) {
                var _expectedMode = { 'float4_fromSampler': "SAMPLER",
                    'float_fromSampler': "SAMPLER",
                    'float': "UNIFORM",
                    'float4': "UNIFORM",
                    'mat4': "UNIFORM" }[this.in_fragment_values[_key].type];

                _WebCLGLUtils.WebCLGLUtils.checkArgNameInitialization(this.in_fragment_values, _key);
                this.in_fragment_values[_key].location = [this._gl.getUniformLocation(this.vertexFragmentProgram, _key.replace(/\[\d.*/, ""))];
                this.in_fragment_values[_key].expectedMode = _expectedMode;
            }

            return "VERTEX PROGRAM\n" + sourceVertex + "\n FRAGMENT PROGRAM\n" + sourceFragment;
        }
    }, {
        key: 'setVertexSource',

        /**
         * Update the vertex source
         * @param {String} vertexSource
         * @param {String} vertexHeader
         */
        value: function setVertexSource(vertexSource, vertexHeader) {
            var argumentsSource = vertexSource.split(')')[0].split('(')[1].split(','); // "float* A", "float* B", "float C", "float4* D"

            for (var n = 0, f = argumentsSource.length; n < f; n++) {
                if (argumentsSource[n].match(/\*attr/gm) !== null) {
                    var argName = argumentsSource[n].split('*attr')[1].trim();
                    _WebCLGLUtils.WebCLGLUtils.checkArgNameInitialization(this.in_vertex_values, argName);

                    if (argumentsSource[n].match(/float4/gm) != null) this.in_vertex_values[argName].type = 'float4_fromAttr';else if (argumentsSource[n].match(/float/gm) != null) this.in_vertex_values[argName].type = 'float_fromAttr';
                } else if (argumentsSource[n].match(/\*/gm) !== null) {
                    var _argName = argumentsSource[n].split('*')[1].trim();
                    _WebCLGLUtils.WebCLGLUtils.checkArgNameInitialization(this.in_vertex_values, _argName);

                    if (argumentsSource[n].match(/float4/gm) != null) this.in_vertex_values[_argName].type = 'float4_fromSampler';else if (argumentsSource[n].match(/float/gm) != null) this.in_vertex_values[_argName].type = 'float_fromSampler';
                } else if (argumentsSource[n] !== "") {
                    var _argName2 = argumentsSource[n].split(' ')[1].trim();
                    for (var key in this.in_vertex_values) {
                        if (key.replace(/\[\d.*/, "") === _argName2) {
                            _argName2 = key; // for normal uniform arrays
                            break;
                        }
                    }

                    _WebCLGLUtils.WebCLGLUtils.checkArgNameInitialization(this.in_vertex_values, _argName2);

                    if (argumentsSource[n].match(/float4/gm) != null) this.in_vertex_values[_argName2].type = 'float4';else if (argumentsSource[n].match(/float/gm) != null) this.in_vertex_values[_argName2].type = 'float';else if (argumentsSource[n].match(/mat4/gm) != null) this.in_vertex_values[_argName2].type = 'mat4';
                }
            }

            // parse header
            this._vertexHead = vertexHeader !== undefined && vertexHeader !== null ? vertexHeader : '';
            this._vertexHead = this._vertexHead.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
            this._vertexHead = _WebCLGLUtils.WebCLGLUtils.parseSource(this._vertexHead, this.in_vertex_values);

            // parse source
            this._vertexSource = vertexSource.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
            this._vertexSource = this._vertexSource.replace(/^\w* \w*\([\w\s\*,]*\) {/gi, '').replace(/}(\s|\t)*$/gi, '');
            this._vertexSource = _WebCLGLUtils.WebCLGLUtils.parseSource(this._vertexSource, this.in_vertex_values);

            this._vertexP_ready = true;
            if (this._fragmentP_ready === true) {
                var ts = this.compileVertexFragmentSource();

                if (this.viewSource === true) console.log('%c VFP: ' + this.name, 'font-size: 20px; color: green'), console.log('%c WEBCLGL --------------------------------', 'color: gray'), console.log('%c ' + vertexHeader + vertexSource, 'color: gray'), console.log('%c TRANSLATED WEBGL ------------------------------', 'color: darkgray'), console.log('%c ' + ts, 'color: darkgray');
            }
        }
    }, {
        key: 'setFragmentSource',

        /**
         * Update the fragment source
         * @param {String} fragmentSource
         * @param {String} fragmentHeader
         */
        value: function setFragmentSource(fragmentSource, fragmentHeader) {
            var argumentsSource = fragmentSource.split(')')[0].split('(')[1].split(','); // "float* A", "float* B", "float C", "float4* D"

            for (var n = 0, f = argumentsSource.length; n < f; n++) {
                if (argumentsSource[n].match(/\*/gm) !== null) {
                    var argName = argumentsSource[n].split('*')[1].trim();
                    _WebCLGLUtils.WebCLGLUtils.checkArgNameInitialization(this.in_fragment_values, argName);

                    if (argumentsSource[n].match(/float4/gm) != null) this.in_fragment_values[argName].type = 'float4_fromSampler';else if (argumentsSource[n].match(/float/gm) != null) this.in_fragment_values[argName].type = 'float_fromSampler';
                } else if (argumentsSource[n] !== "") {
                    var _argName3 = argumentsSource[n].split(' ')[1].trim();
                    for (var key in this.in_fragment_values) {
                        if (key.replace(/\[\d.*/, "") === _argName3) {
                            _argName3 = key; // for normal uniform arrays
                            break;
                        }
                    }

                    _WebCLGLUtils.WebCLGLUtils.checkArgNameInitialization(this.in_fragment_values, _argName3);

                    if (argumentsSource[n].match(/float4/gm) != null) this.in_fragment_values[_argName3].type = 'float4';else if (argumentsSource[n].match(/float/gm) != null) this.in_fragment_values[_argName3].type = 'float';else if (argumentsSource[n].match(/mat4/gm) != null) this.in_fragment_values[_argName3].type = 'mat4';
                }
            }

            // parse header
            this._fragmentHead = fragmentHeader !== undefined && fragmentHeader !== null ? fragmentHeader : '';
            this._fragmentHead = this._fragmentHead.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
            this._fragmentHead = _WebCLGLUtils.WebCLGLUtils.parseSource(this._fragmentHead, this.in_fragment_values);

            // parse source
            this._fragmentSource = fragmentSource.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
            this._fragmentSource = this._fragmentSource.replace(/^\w* \w*\([\w\s\*,]*\) {/gi, '').replace(/}(\s|\t)*$/gi, '');
            this._fragmentSource = _WebCLGLUtils.WebCLGLUtils.parseSource(this._fragmentSource, this.in_fragment_values);

            this._fragmentP_ready = true;
            if (this._vertexP_ready === true) {
                var ts = this.compileVertexFragmentSource();

                if (this.viewSource === true) console.log('%c VFP: ', 'font-size: 20px; color: green'), console.log('%c WEBCLGL --------------------------------', 'color: gray'), console.log('%c ' + fragmentHeader + fragmentSource, 'color: gray'), console.log('%c TRANSLATED WEBGL ------------------------------', 'color: darkgray'), console.log('%c ' + ts, 'color: darkgray');
            }
        }
    }]);

    return WebCLGLVertexFragmentProgram;
}();

global.WebCLGLVertexFragmentProgram = WebCLGLVertexFragmentProgram;
module.exports.WebCLGLVertexFragmentProgram = WebCLGLVertexFragmentProgram;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./WebCLGLUtils.class":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvd2ViY2xnbC9XZWJDTEdMVXRpbHMuY2xhc3MuanMiLCJzcmMvd2ViY2xnbC9XZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtLmNsYXNzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBOztBQUVBLE9BQU8sY0FBUCxDQUFzQixPQUF0QixFQUErQixZQUEvQixFQUE2QztBQUN6QyxXQUFPO0FBRGtDLENBQTdDOztBQUlBLElBQUksZUFBZSxZQUFZO0FBQUUsYUFBUyxnQkFBVCxDQUEwQixNQUExQixFQUFrQyxLQUFsQyxFQUF5QztBQUFFLGFBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxNQUFNLE1BQTFCLEVBQWtDLEdBQWxDLEVBQXVDO0FBQUUsZ0JBQUksYUFBYSxNQUFNLENBQU4sQ0FBakIsQ0FBMkIsV0FBVyxVQUFYLEdBQXdCLFdBQVcsVUFBWCxJQUF5QixLQUFqRCxDQUF3RCxXQUFXLFlBQVgsR0FBMEIsSUFBMUIsQ0FBZ0MsSUFBSSxXQUFXLFVBQWYsRUFBMkIsV0FBVyxRQUFYLEdBQXNCLElBQXRCLENBQTRCLE9BQU8sY0FBUCxDQUFzQixNQUF0QixFQUE4QixXQUFXLEdBQXpDLEVBQThDLFVBQTlDO0FBQTREO0FBQUUsS0FBQyxPQUFPLFVBQVUsV0FBVixFQUF1QixVQUF2QixFQUFtQyxXQUFuQyxFQUFnRDtBQUFFLFlBQUksVUFBSixFQUFnQixpQkFBaUIsWUFBWSxTQUE3QixFQUF3QyxVQUF4QyxFQUFxRCxJQUFJLFdBQUosRUFBaUIsaUJBQWlCLFdBQWpCLEVBQThCLFdBQTlCLEVBQTRDLE9BQU8sV0FBUDtBQUFxQixLQUFoTjtBQUFtTixDQUE5aEIsRUFBbkI7O0FBRUEsU0FBUyxlQUFULENBQXlCLFFBQXpCLEVBQW1DLFdBQW5DLEVBQWdEO0FBQUUsUUFBSSxFQUFFLG9CQUFvQixXQUF0QixDQUFKLEVBQXdDO0FBQUUsY0FBTSxJQUFJLFNBQUosQ0FBYyxtQ0FBZCxDQUFOO0FBQTJEO0FBQUU7O0FBRXpKOzs7OztBQUtBLElBQUksZUFBZSxRQUFRLFlBQVIsR0FBdUIsWUFBWTtBQUNsRCxhQUFTLFlBQVQsR0FBd0I7QUFDcEIsd0JBQWdCLElBQWhCLEVBQXNCLFlBQXRCO0FBQ0g7O0FBRUQ7Ozs7QUFLQSxpQkFBYSxZQUFiLEVBQTJCLENBQUM7QUFDeEIsYUFBSyxVQURtQjtBQUV4QixlQUFPLFNBQVMsUUFBVCxDQUFrQixJQUFsQixFQUF3QixNQUF4QixFQUFnQyxNQUFoQyxFQUF3QztBQUMzQyxnQkFBSSxJQUFJLFdBQVcsU0FBWCxJQUF3QixXQUFXLElBQW5DLEdBQTBDLEdBQTFDLEdBQWdELE1BQXhEO0FBQ0EsZ0JBQUksSUFBSSxXQUFXLFNBQVgsSUFBd0IsV0FBVyxJQUFuQyxHQUEwQyxHQUExQyxHQUFnRCxNQUF4RDtBQUNBLGlCQUFLLFdBQUwsR0FBbUIsQ0FBQyxDQUFDLENBQUYsRUFBSyxDQUFDLENBQU4sRUFBUyxHQUFULEVBQWMsQ0FBZCxFQUFpQixDQUFDLENBQWxCLEVBQXFCLEdBQXJCLEVBQTBCLENBQTFCLEVBQTZCLENBQTdCLEVBQWdDLEdBQWhDLEVBQXFDLENBQUMsQ0FBdEMsRUFBeUMsQ0FBekMsRUFBNEMsR0FBNUMsQ0FBbkI7O0FBRUEsaUJBQUssWUFBTCxHQUFvQixDQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWCxFQUFnQixHQUFoQixFQUFxQixHQUFyQixFQUEwQixHQUExQixFQUErQixHQUEvQixFQUFvQyxHQUFwQyxFQUF5QyxHQUF6QyxFQUE4QyxHQUE5QyxFQUFtRCxHQUFuRCxFQUF3RCxHQUF4RCxDQUFwQjs7QUFFQSxpQkFBSyxVQUFMLEdBQWtCLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLEVBQVUsQ0FBVixFQUFhLENBQWIsRUFBZ0IsQ0FBaEIsQ0FBbEI7O0FBRUEsZ0JBQUksYUFBYSxFQUFqQjtBQUNBLHVCQUFXLFdBQVgsR0FBeUIsS0FBSyxXQUE5QjtBQUNBLHVCQUFXLFlBQVgsR0FBMEIsS0FBSyxZQUEvQjtBQUNBLHVCQUFXLFVBQVgsR0FBd0IsS0FBSyxVQUE3Qjs7QUFFQSxtQkFBTyxVQUFQO0FBQ0g7QUFqQnVCLEtBQUQsRUFrQnhCO0FBQ0MsYUFBSyxjQUROOztBQUlDOzs7QUFHQSxlQUFPLFNBQVMsWUFBVCxDQUFzQixFQUF0QixFQUEwQixJQUExQixFQUFnQyxZQUFoQyxFQUE4QyxjQUE5QyxFQUE4RCxhQUE5RCxFQUE2RTtBQUNoRixnQkFBSSxNQUFNLEtBQVY7QUFBQSxnQkFDSSxNQUFNLEtBRFY7O0FBR0EsZ0JBQUksWUFBWSxVQUFVLE9BQVYsRUFBbUIsTUFBbkIsRUFBMkI7QUFDdkMsd0JBQVEsR0FBUixDQUFZLE9BQVo7O0FBRUEsb0JBQUksWUFBWSxFQUFoQjtBQUNBLG9CQUFJLFNBQVMsUUFBUSxLQUFSLENBQWMsSUFBZCxDQUFiO0FBQ0EscUJBQUssSUFBSSxJQUFJLENBQVIsRUFBVyxJQUFJLE9BQU8sTUFBM0IsRUFBbUMsSUFBSSxDQUF2QyxFQUEwQyxHQUExQyxFQUErQztBQUMzQyx3QkFBSSxPQUFPLENBQVAsRUFBVSxLQUFWLENBQWdCLFdBQWhCLEtBQWdDLElBQXBDLEVBQTBDO0FBQ3RDLDRCQUFJLE9BQU8sT0FBTyxDQUFQLEVBQVUsS0FBVixDQUFnQixHQUFoQixDQUFYO0FBQ0EsNEJBQUksT0FBTyxTQUFTLEtBQUssQ0FBTCxDQUFULENBQVg7QUFDQSxrQ0FBVSxJQUFWLENBQWUsQ0FBQyxJQUFELEVBQU8sT0FBTyxDQUFQLENBQVAsQ0FBZjtBQUNIO0FBQ0o7QUFDRCxvQkFBSSxPQUFPLEdBQUcsZUFBSCxDQUFtQixNQUFuQixFQUEyQixLQUEzQixDQUFpQyxJQUFqQyxDQUFYO0FBQ0EscUJBQUssT0FBTCxDQUFhLEVBQWI7QUFDQSxxQkFBSyxJQUFJLEtBQUssQ0FBVCxFQUFZLEtBQUssS0FBSyxNQUEzQixFQUFtQyxLQUFLLEVBQXhDLEVBQTRDLElBQTVDLEVBQWtEO0FBQzlDLHdCQUFJLGdCQUFnQixLQUFwQjtBQUNBLHdCQUFJLFdBQVcsRUFBZjtBQUNBLHlCQUFLLElBQUksSUFBSSxDQUFSLEVBQVcsS0FBSyxVQUFVLE1BQS9CLEVBQXVDLElBQUksRUFBM0MsRUFBK0MsR0FBL0MsRUFBb0Q7QUFDaEQsNEJBQUksT0FBTyxVQUFVLENBQVYsRUFBYSxDQUFiLENBQVgsRUFBNEI7QUFDeEIsNENBQWdCLElBQWhCO0FBQ0EsdUNBQVcsVUFBVSxDQUFWLEVBQWEsQ0FBYixDQUFYO0FBQ0E7QUFDSDtBQUNKO0FBQ0Qsd0JBQUksa0JBQWtCLEtBQXRCLEVBQTZCO0FBQ3pCLGdDQUFRLEdBQVIsQ0FBWSxPQUFPLEVBQVAsR0FBWSxLQUFaLEdBQW9CLEtBQUssRUFBTCxDQUFoQyxFQUEwQyxhQUExQyxFQUF5RCxZQUF6RDtBQUNILHFCQUZELE1BRU87QUFDSCxnQ0FBUSxHQUFSLENBQVksV0FBVyxFQUFYLEdBQWdCLEtBQWhCLEdBQXdCLEtBQUssRUFBTCxDQUF4QixHQUFtQyxNQUFuQyxHQUE0QyxRQUF4RCxFQUFrRSxXQUFsRSxFQUErRSxhQUEvRSxFQUE4RixZQUE5RixFQUE0RyxXQUE1RztBQUNIO0FBQ0o7QUFDSixhQTlCZSxDQThCZCxJQTlCYyxDQThCVCxJQTlCUyxDQUFoQjs7QUFnQ0EsZ0JBQUksZUFBZSxHQUFHLFlBQUgsQ0FBZ0IsR0FBRyxhQUFuQixDQUFuQjtBQUNBLGVBQUcsWUFBSCxDQUFnQixZQUFoQixFQUE4QixZQUE5QjtBQUNBLGVBQUcsYUFBSCxDQUFpQixZQUFqQjtBQUNBLGdCQUFJLENBQUMsR0FBRyxrQkFBSCxDQUFzQixZQUF0QixFQUFvQyxHQUFHLGNBQXZDLENBQUwsRUFBNkQ7QUFDekQsb0JBQUksVUFBVSxHQUFHLGdCQUFILENBQW9CLFlBQXBCLENBQWQ7QUFDQSx3QkFBUSxHQUFSLENBQVksT0FBTyxJQUFQLEdBQWMseUJBQTFCLEVBQXFELFdBQXJEOztBQUVBLG9CQUFJLFlBQVksU0FBWixJQUF5QixZQUFZLElBQXpDLEVBQStDLFVBQVUsT0FBVixFQUFtQixZQUFuQjtBQUNsRCxhQUxELE1BS087QUFDSCxtQkFBRyxZQUFILENBQWdCLGFBQWhCLEVBQStCLFlBQS9CO0FBQ0Esc0JBQU0sSUFBTjtBQUNIOztBQUVELGdCQUFJLGlCQUFpQixHQUFHLFlBQUgsQ0FBZ0IsR0FBRyxlQUFuQixDQUFyQjtBQUNBLGVBQUcsWUFBSCxDQUFnQixjQUFoQixFQUFnQyxjQUFoQztBQUNBLGVBQUcsYUFBSCxDQUFpQixjQUFqQjtBQUNBLGdCQUFJLENBQUMsR0FBRyxrQkFBSCxDQUFzQixjQUF0QixFQUFzQyxHQUFHLGNBQXpDLENBQUwsRUFBK0Q7QUFDM0Qsb0JBQUksV0FBVyxHQUFHLGdCQUFILENBQW9CLGNBQXBCLENBQWY7QUFDQSx3QkFBUSxHQUFSLENBQVksT0FBTyxJQUFQLEdBQWMsMkJBQTFCLEVBQXVELFdBQXZEOztBQUVBLG9CQUFJLGFBQWEsU0FBYixJQUEwQixhQUFhLElBQTNDLEVBQWlELFVBQVUsUUFBVixFQUFvQixjQUFwQjtBQUNwRCxhQUxELE1BS087QUFDSCxtQkFBRyxZQUFILENBQWdCLGFBQWhCLEVBQStCLGNBQS9CO0FBQ0Esc0JBQU0sSUFBTjtBQUNIOztBQUVELGdCQUFJLFFBQVEsSUFBUixJQUFnQixRQUFRLElBQTVCLEVBQWtDO0FBQzlCLG1CQUFHLFdBQUgsQ0FBZSxhQUFmO0FBQ0Esb0JBQUksVUFBVSxHQUFHLG1CQUFILENBQXVCLGFBQXZCLEVBQXNDLEdBQUcsV0FBekMsQ0FBZDtBQUNBLG9CQUFJLE9BQUosRUFBYTtBQUNULDJCQUFPLElBQVA7QUFDSCxpQkFGRCxNQUVPO0FBQ0gsNEJBQVEsR0FBUixDQUFZLDBCQUEwQixJQUExQixHQUFpQyxNQUE3QztBQUNBLHdCQUFJLE1BQU0sR0FBRyxpQkFBSCxDQUFxQixhQUFyQixDQUFWO0FBQ0Esd0JBQUksUUFBUSxTQUFSLElBQXFCLFFBQVEsSUFBakMsRUFBdUMsUUFBUSxHQUFSLENBQVksR0FBWjtBQUN2QywyQkFBTyxLQUFQO0FBQ0g7QUFDSixhQVhELE1BV087QUFDSCx1QkFBTyxLQUFQO0FBQ0g7QUFDSjtBQW5GRixLQWxCd0IsRUFzR3hCO0FBQ0MsYUFBSyxNQUROOztBQUlDOzs7QUFHQSxlQUFPLFNBQVMsSUFBVCxDQUFjLENBQWQsRUFBaUI7QUFDcEIsZ0JBQUksT0FBTyxDQUFDLE1BQU0sS0FBUCxFQUFjLE1BQU0sS0FBcEIsRUFBMkIsTUFBTSxLQUFqQyxFQUF3QyxHQUF4QyxDQUFYOztBQUVBLGdCQUFJLElBQUksQ0FBUjtBQUNBLGdCQUFJLElBQUksS0FBSyxLQUFMLENBQVcsSUFBSSxLQUFmLENBQVI7QUFDQSxnQkFBSSxJQUFJLEtBQUssS0FBTCxDQUFXLElBQUksS0FBZixDQUFSO0FBQ0EsZ0JBQUksSUFBSSxLQUFLLEtBQUwsQ0FBVyxJQUFJLEtBQWYsQ0FBUjtBQUNBLGdCQUFJLFNBQVMsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLENBQWI7O0FBRUEsZ0JBQUksS0FBSyxDQUFDLE9BQU8sQ0FBUCxJQUFZLEtBQUssQ0FBTCxDQUFiLEVBQXNCLE9BQU8sQ0FBUCxJQUFZLEtBQUssQ0FBTCxDQUFsQyxFQUEyQyxPQUFPLENBQVAsSUFBWSxLQUFLLENBQUwsQ0FBdkQsRUFBZ0UsT0FBTyxDQUFQLElBQVksS0FBSyxDQUFMLENBQTVFLENBQVQ7O0FBRUEsbUJBQU8sQ0FBQyxPQUFPLENBQVAsSUFBWSxHQUFHLENBQUgsQ0FBYixFQUFvQixPQUFPLENBQVAsSUFBWSxHQUFHLENBQUgsQ0FBaEMsRUFBdUMsT0FBTyxDQUFQLElBQVksR0FBRyxDQUFILENBQW5ELEVBQTBELE9BQU8sQ0FBUCxJQUFZLEdBQUcsQ0FBSCxDQUF0RSxDQUFQO0FBQ0g7QUFuQkYsS0F0R3dCLEVBMEh4QjtBQUNDLGFBQUssUUFETjs7QUFJQzs7O0FBR0EsZUFBTyxTQUFTLE1BQVQsQ0FBZ0IsTUFBaEIsRUFBd0I7QUFDM0IsZ0JBQUksWUFBWSxDQUFDLEdBQUQsRUFBTSxNQUFNLEtBQVosRUFBbUIsT0FBTyxRQUFRLEtBQWYsQ0FBbkIsRUFBMEMsT0FBTyxRQUFRLEtBQVIsR0FBZ0IsS0FBdkIsQ0FBMUMsQ0FBaEI7QUFDQSxtQkFBTyxLQUFLLElBQUwsQ0FBVSxNQUFWLEVBQWtCLFNBQWxCLENBQVA7QUFDSDtBQVZGLEtBMUh3QixDQUEzQixFQXFJSSxDQUFDO0FBQ0QsYUFBSywyQkFESjs7QUFJRDs7Ozs7QUFLQSxlQUFPLFNBQVMseUJBQVQsQ0FBbUMsTUFBbkMsRUFBMkMsTUFBM0MsRUFBbUQ7QUFDdEQsZ0JBQUksS0FBSyxJQUFUO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkEsZ0JBQUksTUFBTSxJQUFWLEVBQWdCO0FBQ1osb0JBQUk7QUFDQSx3QkFBSSxXQUFXLFNBQVgsSUFBd0IsV0FBVyxJQUF2QyxFQUE2QyxLQUFLLE9BQU8sVUFBUCxDQUFrQixPQUFsQixDQUFMLENBQTdDLEtBQWtGLEtBQUssT0FBTyxVQUFQLENBQWtCLE9BQWxCLEVBQTJCLE1BQTNCLENBQUw7O0FBRWxGLDRCQUFRLEdBQVIsQ0FBWSxNQUFNLElBQU4sR0FBYSxVQUFiLEdBQTBCLGFBQXRDO0FBQ0gsaUJBSkQsQ0FJRSxPQUFPLENBQVAsRUFBVTtBQUNSLHlCQUFLLElBQUw7QUFDSDtBQUNKO0FBQ0QsZ0JBQUksTUFBTSxJQUFWLEVBQWdCO0FBQ1osb0JBQUk7QUFDQSx3QkFBSSxXQUFXLFNBQVgsSUFBd0IsV0FBVyxJQUF2QyxFQUE2QyxLQUFLLE9BQU8sVUFBUCxDQUFrQixvQkFBbEIsQ0FBTCxDQUE3QyxLQUErRixLQUFLLE9BQU8sVUFBUCxDQUFrQixvQkFBbEIsRUFBd0MsTUFBeEMsQ0FBTDs7QUFFL0YsNEJBQVEsR0FBUixDQUFZLE1BQU0sSUFBTixHQUFhLHVCQUFiLEdBQXVDLDBCQUFuRDtBQUNILGlCQUpELENBSUUsT0FBTyxDQUFQLEVBQVU7QUFDUix5QkFBSyxJQUFMO0FBQ0g7QUFDSjtBQUNELGdCQUFJLE1BQU0sSUFBVixFQUFnQixLQUFLLEtBQUw7QUFDaEIsbUJBQU8sRUFBUDtBQUNIO0FBL0NBLEtBQUQsRUFnREQ7QUFDQyxhQUFLLG1DQUROOztBQUlDOzs7OztBQUtBLGVBQU8sU0FBUyxpQ0FBVCxDQUEyQyxZQUEzQyxFQUF5RDtBQUM1RCxnQkFBSSxJQUFJLFNBQVMsYUFBVCxDQUF1QixRQUF2QixDQUFSO0FBQ0EsY0FBRSxLQUFGLEdBQVUsYUFBYSxLQUF2QjtBQUNBLGNBQUUsTUFBRixHQUFXLGFBQWEsTUFBeEI7QUFDQSxnQkFBSSxZQUFZLEVBQUUsVUFBRixDQUFhLElBQWIsQ0FBaEI7QUFDQSxzQkFBVSxTQUFWLENBQW9CLFlBQXBCLEVBQWtDLENBQWxDLEVBQXFDLENBQXJDO0FBQ0EsZ0JBQUksV0FBVyxVQUFVLFlBQVYsQ0FBdUIsQ0FBdkIsRUFBMEIsQ0FBMUIsRUFBNkIsYUFBYSxLQUExQyxFQUFpRCxhQUFhLE1BQTlELENBQWY7O0FBRUEsbUJBQU8sU0FBUyxJQUFoQjtBQUNIO0FBbEJGLEtBaERDLEVBbUVEO0FBQ0MsYUFBSyxNQUROOztBQUlDOzs7QUFHQSxlQUFPLFNBQVMsSUFBVCxDQUFjLFFBQWQsRUFBd0IsUUFBeEIsRUFBa0M7QUFDckMsbUJBQU8sU0FBUyxDQUFULElBQWMsU0FBUyxDQUFULENBQWQsR0FBNEIsU0FBUyxDQUFULElBQWMsU0FBUyxDQUFULENBQTFDLEdBQXdELFNBQVMsQ0FBVCxJQUFjLFNBQVMsQ0FBVCxDQUF0RSxHQUFvRixTQUFTLENBQVQsSUFBYyxTQUFTLENBQVQsQ0FBekc7QUFDSDtBQVRGLEtBbkVDLEVBNkVEO0FBQ0MsYUFBSyxPQUROOztBQUlDOzs7QUFHQSxlQUFPLFNBQVMsS0FBVCxDQUFlLE1BQWYsRUFBdUI7QUFDMUIsbUJBQU8sU0FBUyxDQUFULEdBQWEsU0FBUyxLQUFLLEtBQUwsQ0FBVyxNQUFYLENBQXRCLEdBQTJDLFNBQVMsS0FBSyxJQUFMLENBQVUsTUFBVixDQUEzRDtBQUNIO0FBVEYsS0E3RUMsRUF1RkQ7QUFDQyxhQUFLLHdCQUROOztBQUlDOzs7O0FBSUEsZUFBTyxTQUFTLHNCQUFULEdBQWtDO0FBQ3JDLG1CQUFPLGdDQUFnQyx1Q0FBaEMsR0FBMEUsZ0JBQTFFLEdBQTZGLGdCQUE3RixHQUFnSCxTQUFoSCxHQUE0SCxvQkFBNUgsR0FBbUosK0JBQW5KLEdBQXFMLCtCQUFyTCxHQUF1TiwrQkFBdk4sR0FBeVAsbUNBQXpQLEdBQStSLHlDQUEvUixHQUEyVSxLQUFsVjtBQUNIO0FBVkYsS0F2RkMsRUFrR0Q7QUFDQyxhQUFLLDBCQUROOztBQUlDOzs7O0FBSUEsZUFBTyxTQUFTLHdCQUFULEdBQW9DO0FBQ3ZDLG1CQUFPLG1DQUFtQyxvQ0FBbkMsR0FBMEUsZ0JBQTFFLEdBQTZGLDBCQUE3RixHQUEwSCxtQ0FBMUgsR0FBZ0ssa0NBQWhLLEdBQXFNLEtBQTVNO0FBQ0g7QUFWRixLQWxHQyxFQTZHRDtBQUNDLGFBQUssa0JBRE47O0FBSUM7Ozs7OztBQU1BLGVBQU8sU0FBUyxnQkFBVCxDQUEwQixJQUExQixFQUFnQyxPQUFoQyxFQUF5QztBQUM1QyxnQkFBSSxhQUFhLElBQWpCO0FBQ0EsZ0JBQUksS0FBSyxNQUFMLEtBQWdCLFNBQWhCLElBQTZCLEtBQUssTUFBTCxLQUFnQixJQUFqRCxFQUF1RDtBQUNuRCw2QkFBYSxFQUFiO0FBQ0Esb0JBQUksS0FBSyxNQUFMLENBQVksQ0FBWixLQUFrQixJQUF0QixFQUE0QjtBQUN4Qix5QkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEtBQUssTUFBTCxDQUFZLE1BQWhDLEVBQXdDLEdBQXhDLEVBQTZDO0FBQ3pDO0FBQ0E7O0FBRUEsbUNBQVcsQ0FBWCxJQUFnQixRQUFRLEtBQUssTUFBTCxDQUFZLENBQVosQ0FBUixDQUFoQjtBQUNIO0FBQ0osaUJBUEQsTUFPTyxhQUFhLElBQWI7QUFDVjtBQUNELG1CQUFPLFVBQVA7QUFDSDtBQXhCRixLQTdHQyxFQXNJRDtBQUNDLGFBQUssYUFETjs7QUFJQzs7Ozs7O0FBTUEsZUFBTyxTQUFTLFdBQVQsQ0FBcUIsTUFBckIsRUFBNkIsTUFBN0IsRUFBcUM7QUFDeEMsaUJBQUssSUFBSSxHQUFULElBQWdCLE1BQWhCLEVBQXdCO0FBQ3BCLG9CQUFJLFNBQVMsSUFBSSxNQUFKLENBQVcsTUFBTSxrQkFBakIsRUFBcUMsSUFBckMsQ0FBYixDQURvQixDQUNxQztBQUN6RCxvQkFBSSxhQUFhLE9BQU8sS0FBUCxDQUFhLE1BQWIsQ0FBakIsQ0FGb0IsQ0FFbUI7QUFDdkM7QUFDQSxvQkFBSSxjQUFjLElBQWxCLEVBQXdCO0FBQ3BCLHlCQUFLLElBQUksS0FBSyxDQUFULEVBQVksS0FBSyxXQUFXLE1BQWpDLEVBQXlDLEtBQUssRUFBOUMsRUFBa0QsSUFBbEQsRUFBd0Q7QUFDcEQ7QUFDQSw0QkFBSSxpQkFBaUIsSUFBSSxNQUFKLENBQVcsb0JBQW9CLFdBQVcsRUFBWCxDQUFwQixHQUFxQyx1QkFBaEQsRUFBeUUsSUFBekUsQ0FBckI7QUFDQSw0QkFBSSx3QkFBd0IsT0FBTyxLQUFQLENBQWEsY0FBYixDQUE1QjtBQUNBLDRCQUFJLHlCQUF5QixJQUE3QixFQUFtQztBQUMvQixnQ0FBSSxPQUFPLFdBQVcsRUFBWCxFQUFlLEtBQWYsQ0FBcUIsR0FBckIsRUFBMEIsQ0FBMUIsQ0FBWDtBQUNBLGdDQUFJLE9BQU8sV0FBVyxFQUFYLEVBQWUsS0FBZixDQUFxQixHQUFyQixFQUEwQixDQUExQixFQUE2QixLQUE3QixDQUFtQyxHQUFuQyxFQUF3QyxDQUF4QyxDQUFYOztBQUVBLGdDQUFJLE1BQU0sRUFBRSxzQkFBc0IsT0FBTyxPQUFQLENBQWUsT0FBTyxHQUFQLEdBQWEsSUFBYixHQUFvQixHQUFuQyxFQUF3QyxlQUFlLElBQWYsR0FBc0IsR0FBdEIsR0FBNEIsSUFBNUIsR0FBbUMsR0FBM0UsQ0FBeEI7QUFDTixxREFBcUIsT0FBTyxPQUFQLENBQWUsT0FBTyxHQUFQLEdBQWEsSUFBYixHQUFvQixHQUFuQyxFQUF3QyxlQUFlLElBQWYsR0FBc0IsR0FBdEIsR0FBNEIsSUFBNUIsR0FBbUMsS0FBM0UsQ0FEZjtBQUVOLG1EQUFtQixPQUFPLE9BQVAsQ0FBZSxPQUFPLEdBQVAsR0FBYSxJQUFiLEdBQW9CLEdBQW5DLEVBQXdDLElBQXhDLENBRmI7QUFHTixrREFBa0IsT0FBTyxPQUFQLENBQWUsT0FBTyxHQUFQLEdBQWEsSUFBYixHQUFvQixHQUFuQyxFQUF3QyxJQUF4QyxDQUhaLEVBQVY7QUFJQSxxQ0FBUyxJQUFJLE9BQU8sR0FBUCxFQUFZLElBQWhCLENBQVQ7QUFDSDtBQUNKO0FBQ0o7QUFDSjtBQUNELHFCQUFTLE9BQU8sT0FBUCxDQUFlLGlCQUFmLEVBQWtDLEVBQWxDLEVBQXNDLE9BQXRDLENBQThDLE9BQTlDLEVBQXVELEVBQXZELEVBQTJELE9BQTNELENBQW1FLEtBQW5FLEVBQTBFLEtBQTFFLEVBQWlGLE9BQWpGLENBQXlGLEtBQXpGLEVBQWdHLEtBQWhHLEVBQXVHLE9BQXZHLENBQStHLEtBQS9HLEVBQXNILEtBQXRILENBQVQ7QUFDQSxtQkFBTyxNQUFQO0FBQ0g7QUFuQ0YsS0F0SUMsRUEwS0Q7QUFDQyxhQUFLLG9CQUROOztBQUlDOzs7O0FBSUEsZUFBTyxTQUFTLGtCQUFULENBQTRCLE1BQTVCLEVBQW9DO0FBQ3ZDLGdCQUFJLE1BQU0sRUFBVjtBQUNBLGlCQUFLLElBQUksR0FBVCxJQUFnQixNQUFoQixFQUF3QjtBQUNwQix1QkFBTyxFQUFFLHNCQUFzQix1QkFBdUIsR0FBdkIsR0FBNkIsR0FBckQ7QUFDSCx5Q0FBcUIsdUJBQXVCLEdBQXZCLEdBQTZCLEdBRC9DO0FBRUgsdUNBQW1CLG9CQUFvQixHQUFwQixHQUEwQixHQUYxQztBQUdILHNDQUFrQixxQkFBcUIsR0FBckIsR0FBMkIsR0FIMUM7QUFJSCw2QkFBUyxtQkFBbUIsR0FBbkIsR0FBeUIsR0FKL0I7QUFLSCw4QkFBVSxrQkFBa0IsR0FBbEIsR0FBd0IsR0FML0I7QUFNSCw0QkFBUSxrQkFBa0IsR0FBbEIsR0FBd0IsR0FON0IsR0FNbUMsT0FBTyxHQUFQLEVBQVksSUFOL0MsSUFNdUQsSUFOOUQ7QUFPSDtBQUNELG1CQUFPLEdBQVA7QUFDSDtBQXBCRixLQTFLQyxFQStMRDtBQUNDLGFBQUssc0JBRE47O0FBSUM7Ozs7QUFJQSxlQUFPLFNBQVMsb0JBQVQsQ0FBOEIsTUFBOUIsRUFBc0M7QUFDekMsZ0JBQUksTUFBTSxFQUFWO0FBQ0EsaUJBQUssSUFBSSxHQUFULElBQWdCLE1BQWhCLEVBQXdCO0FBQ3BCLHVCQUFPLEVBQUUsc0JBQXNCLHVCQUF1QixHQUF2QixHQUE2QixHQUFyRDtBQUNILHlDQUFxQix1QkFBdUIsR0FBdkIsR0FBNkIsR0FEL0M7QUFFSCw2QkFBUyxtQkFBbUIsR0FBbkIsR0FBeUIsR0FGL0I7QUFHSCw4QkFBVSxrQkFBa0IsR0FBbEIsR0FBd0IsR0FIL0I7QUFJSCw0QkFBUSxrQkFBa0IsR0FBbEIsR0FBd0IsR0FKN0IsR0FJbUMsT0FBTyxHQUFQLEVBQVksSUFKL0MsSUFJdUQsSUFKOUQ7QUFLSDtBQUNELG1CQUFPLEdBQVA7QUFDSDtBQWxCRixLQS9MQyxFQWtORDtBQUNDLGFBQUssdUJBRE47O0FBSUM7Ozs7QUFJQSxlQUFPLFNBQVMscUJBQVQsQ0FBK0IsY0FBL0IsRUFBK0M7QUFDbEQsZ0JBQUksTUFBTSxFQUFWO0FBQ0EsaUJBQUssSUFBSSxJQUFJLENBQVIsRUFBVyxLQUFLLGNBQXJCLEVBQXFDLElBQUksRUFBekMsRUFBNkMsR0FBN0MsRUFBa0Q7QUFDOUMsdUJBQU8sS0FBSyxXQUFMLEdBQW1CLENBQW5CLEdBQXVCLHdCQUF2QixHQUFrRCxVQUFsRCxHQUErRCxDQUEvRCxHQUFtRSxZQUExRTtBQUNIO0FBQ0QsbUJBQU8sR0FBUDtBQUNIO0FBZEYsS0FsTkMsRUFpT0Q7QUFDQyxhQUFLLDRCQUROO0FBRUMsZUFBTyxTQUFTLDBCQUFULENBQW9DLGNBQXBDLEVBQW9EO0FBQ3ZELGdCQUFJLE1BQU0sRUFBVjtBQUNBLGlCQUFLLElBQUksSUFBSSxDQUFSLEVBQVcsS0FBSyxjQUFyQixFQUFxQyxJQUFJLEVBQXpDLEVBQTZDLEdBQTdDLEVBQWtEO0FBQzlDLHVCQUFPLEtBQUssb0JBQUwsR0FBNEIsQ0FBNUIsR0FBZ0MsbUJBQWhDLEdBQXNELENBQXRELEdBQTBELEtBQWpFO0FBQ0g7QUFDRCxtQkFBTyxHQUFQO0FBQ0g7QUFSRixLQWpPQyxFQTBPRDtBQUNDLGFBQUssd0JBRE47O0FBSUM7Ozs7QUFJQSxlQUFPLFNBQVMsc0JBQVQsQ0FBZ0MsY0FBaEMsRUFBZ0Q7QUFDbkQsZ0JBQUksTUFBTSxFQUFWO0FBQ0EsaUJBQUssSUFBSSxJQUFJLENBQVIsRUFBVyxLQUFLLGNBQXJCLEVBQXFDLElBQUksRUFBekMsRUFBNkMsR0FBN0MsRUFBa0Q7QUFDOUMsdUJBQU8sS0FBSyxRQUFMLEdBQWdCLENBQWhCLEdBQW9CLG9DQUFwQixHQUEyRCxDQUEzRCxHQUErRCxjQUEvRCxHQUFnRixDQUFoRixHQUFvRix3QkFBcEYsR0FBK0csb0JBQS9HLEdBQXNJLENBQXRJLEdBQTBJLFNBQTFJLEdBQXNKLENBQXRKLEdBQTBKLFlBQWpLO0FBQ0g7QUFDRCxtQkFBTyxHQUFQO0FBQ0g7QUFkRixLQTFPQyxFQXlQRDtBQUNDLGFBQUssNEJBRE47O0FBSUM7Ozs7O0FBS0EsZUFBTyxTQUFTLDBCQUFULENBQW9DLFFBQXBDLEVBQThDLE9BQTlDLEVBQXVEO0FBQzFELGdCQUFJLFNBQVMsY0FBVCxDQUF3QixPQUF4QixNQUFxQyxLQUF6QyxFQUFnRDtBQUM1Qyx5QkFBUyxPQUFULElBQW9CO0FBQ2hCLDRCQUFRLElBRFE7QUFFaEIsb0NBQWdCLElBRkEsRUFFTTtBQUN0QixnQ0FBWSxJQUhJLEVBQXBCO0FBSUg7QUFDSjtBQWhCRixLQXpQQyxFQTBRRDtBQUNDLGFBQUssbUNBRE47O0FBSUM7OztBQUdBLGVBQU8sU0FBUyxpQ0FBVCxHQUE2QztBQUNoRCxtQkFBTyxLQUFLLDJFQUFMLEdBQW1GLG9DQUFuRixHQUEwSCw4Q0FBMUgsR0FBMkssNENBQTNLLEdBQTBOLHVEQUExTixHQUFvUiwyQkFBcFIsR0FBa1QsS0FBelQ7QUFDSDtBQVRGLEtBMVFDLEVBb1JEO0FBQ0MsYUFBSyxtQ0FETjs7QUFJQzs7O0FBR0EsZUFBTyxTQUFTLGlDQUFULEdBQTZDO0FBQ2hELG1CQUFPLEtBQUssb0RBQUwsR0FBNEQsb0NBQTVELEdBQW1HLG9EQUFuRyxHQUEwSixpREFBMUosR0FBOE0sMkJBQTlNLEdBQTRPLEtBQW5QO0FBQ0g7QUFURixLQXBSQyxDQXJJSjs7QUFxYUEsV0FBTyxZQUFQO0FBQ0gsQ0FoYnlDLEVBQTFDOztBQWtiQSxPQUFPLFlBQVAsR0FBc0IsWUFBdEI7QUFDQSxPQUFPLE9BQVAsQ0FBZSxZQUFmLEdBQThCLFlBQTlCOzs7Ozs7QUNsY0E7O0FBRUEsT0FBTyxjQUFQLENBQXNCLE9BQXRCLEVBQStCLFlBQS9CLEVBQTZDO0FBQ3pDLFdBQU87QUFEa0MsQ0FBN0M7QUFHQSxRQUFRLDRCQUFSLEdBQXVDLFNBQXZDOztBQUVBLElBQUksZUFBZSxZQUFZO0FBQUUsYUFBUyxnQkFBVCxDQUEwQixNQUExQixFQUFrQyxLQUFsQyxFQUF5QztBQUFFLGFBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxNQUFNLE1BQTFCLEVBQWtDLEdBQWxDLEVBQXVDO0FBQUUsZ0JBQUksYUFBYSxNQUFNLENBQU4sQ0FBakIsQ0FBMkIsV0FBVyxVQUFYLEdBQXdCLFdBQVcsVUFBWCxJQUF5QixLQUFqRCxDQUF3RCxXQUFXLFlBQVgsR0FBMEIsSUFBMUIsQ0FBZ0MsSUFBSSxXQUFXLFVBQWYsRUFBMkIsV0FBVyxRQUFYLEdBQXNCLElBQXRCLENBQTRCLE9BQU8sY0FBUCxDQUFzQixNQUF0QixFQUE4QixXQUFXLEdBQXpDLEVBQThDLFVBQTlDO0FBQTREO0FBQUUsS0FBQyxPQUFPLFVBQVUsV0FBVixFQUF1QixVQUF2QixFQUFtQyxXQUFuQyxFQUFnRDtBQUFFLFlBQUksVUFBSixFQUFnQixpQkFBaUIsWUFBWSxTQUE3QixFQUF3QyxVQUF4QyxFQUFxRCxJQUFJLFdBQUosRUFBaUIsaUJBQWlCLFdBQWpCLEVBQThCLFdBQTlCLEVBQTRDLE9BQU8sV0FBUDtBQUFxQixLQUFoTjtBQUFtTixDQUE5aEIsRUFBbkI7O0FBRUEsSUFBSSxnQkFBZ0IsUUFBUSxzQkFBUixDQUFwQjs7QUFFQSxTQUFTLGVBQVQsQ0FBeUIsUUFBekIsRUFBbUMsV0FBbkMsRUFBZ0Q7QUFBRSxRQUFJLEVBQUUsb0JBQW9CLFdBQXRCLENBQUosRUFBd0M7QUFBRSxjQUFNLElBQUksU0FBSixDQUFjLG1DQUFkLENBQU47QUFBMkQ7QUFBRTs7QUFFeko7Ozs7Ozs7OztBQVNBLElBQUksK0JBQStCLFFBQVEsNEJBQVIsR0FBdUMsWUFBWTtBQUNsRixhQUFTLDRCQUFULENBQXNDLEVBQXRDLEVBQTBDLFlBQTFDLEVBQXdELFlBQXhELEVBQXNFLGNBQXRFLEVBQXNGLGNBQXRGLEVBQXNHO0FBQ2xHLHdCQUFnQixJQUFoQixFQUFzQiw0QkFBdEI7O0FBRUEsYUFBSyxHQUFMLEdBQVcsRUFBWDtBQUNBLFlBQUksdUJBQXVCLEtBQUssR0FBTCxDQUFTLHdCQUFULENBQWtDLEtBQUssR0FBTCxDQUFTLGVBQTNDLEVBQTRELEtBQUssR0FBTCxDQUFTLFVBQXJFLENBQTNCO0FBQ0EsYUFBSyxVQUFMLEdBQWtCLHFCQUFxQixTQUFyQixLQUFtQyxDQUFuQyxHQUF1QyxvREFBdkMsR0FBOEYsa0RBQWhIOztBQUVBLFlBQUksa0JBQWtCLEtBQUssR0FBTCxDQUFTLFlBQVQsQ0FBc0Isb0JBQXRCLENBQXRCO0FBQ0EsYUFBSyxlQUFMLEdBQXVCLElBQXZCO0FBQ0EsWUFBSSxtQkFBbUIsSUFBdkIsRUFBNkIsS0FBSyxlQUFMLEdBQXVCLEtBQUssR0FBTCxDQUFTLFlBQVQsQ0FBc0IsZ0JBQWdCLHNCQUF0QyxDQUF2Qjs7QUFFN0IsYUFBSyxJQUFMLEdBQVksRUFBWjtBQUNBLGFBQUssVUFBTCxHQUFrQixLQUFsQjs7QUFFQSxhQUFLLGdCQUFMLEdBQXdCLEVBQXhCO0FBQ0EsYUFBSyxrQkFBTCxHQUEwQixFQUExQjs7QUFFQSxhQUFLLGNBQUwsR0FBc0IsS0FBdEI7QUFDQSxhQUFLLGdCQUFMLEdBQXdCLEtBQXhCOztBQUVBLGFBQUssV0FBTCxHQUFtQixJQUFuQjtBQUNBLGFBQUssYUFBTCxHQUFxQixJQUFyQjtBQUNBLGFBQUssYUFBTCxHQUFxQixJQUFyQjtBQUNBLGFBQUssZUFBTCxHQUF1QixJQUF2Qjs7QUFFQSxhQUFLLE1BQUwsR0FBYyxJQUFkLENBekJrRyxDQXlCOUU7QUFDcEIsYUFBSyxlQUFMLEdBQXVCLElBQXZCO0FBQ0EsYUFBSyxPQUFMLEdBQWUsSUFBZjtBQUNBLGFBQUssV0FBTCxHQUFtQixJQUFuQjs7QUFFQSxhQUFLLFFBQUwsR0FBZ0IsQ0FBaEI7O0FBRUEsWUFBSSxpQkFBaUIsU0FBakIsSUFBOEIsaUJBQWlCLElBQW5ELEVBQXlELEtBQUssZUFBTCxDQUFxQixZQUFyQixFQUFtQyxZQUFuQzs7QUFFekQsWUFBSSxtQkFBbUIsU0FBbkIsSUFBZ0MsbUJBQW1CLElBQXZELEVBQTZELEtBQUssaUJBQUwsQ0FBdUIsY0FBdkIsRUFBdUMsY0FBdkM7QUFDaEU7O0FBRUQ7Ozs7QUFLQSxpQkFBYSw0QkFBYixFQUEyQyxDQUFDO0FBQ3hDLGFBQUssNkJBRG1DO0FBRXhDLGVBQU8sU0FBUywyQkFBVCxHQUF1QztBQUMxQyxnQkFBSSxlQUFlLEtBQUssS0FBSyxVQUFWLEdBQXVCLDBCQUF2QixHQUFvRCw2QkFBcEQsR0FBb0YsY0FBYyxZQUFkLENBQTJCLGtCQUEzQixDQUE4QyxLQUFLLGdCQUFuRCxDQUFwRixHQUEySixjQUFjLFlBQWQsQ0FBMkIsd0JBQTNCLEVBQTNKLEdBQW1OLGNBQWMsWUFBZCxDQUEyQixpQ0FBM0IsRUFBbk4sR0FBb1IsY0FBYyxZQUFkLENBQTJCLGlDQUEzQixFQUFwUixHQUFxVixLQUFLLFdBQTFWLEdBQXdXLHFCQUF4VyxHQUFnWSxLQUFLLGFBQXJZLEdBQXFaLEtBQXhhO0FBQ0EsZ0JBQUksaUJBQWlCLCtDQUErQyxLQUFLLFVBQXBELEdBQWlFLGNBQWMsWUFBZCxDQUEyQixvQkFBM0IsQ0FBZ0QsS0FBSyxrQkFBckQsQ0FBakUsR0FBNEksY0FBYyxZQUFkLENBQTJCLGlDQUEzQixFQUE1SSxHQUE2TSxjQUFjLFlBQWQsQ0FBMkIsaUNBQTNCLEVBQTdNLEdBQThRLEtBQUssYUFBblI7O0FBRXJCO0FBQ0EsaUNBSHFCLEdBR0csY0FBYyxZQUFkLENBQTJCLHFCQUEzQixDQUFpRCxDQUFqRCxDQUhILEdBR3lELEtBQUssZUFIOUQsR0FHZ0YsY0FBYyxZQUFkLENBQTJCLHNCQUEzQixDQUFrRCxDQUFsRCxDQUhoRixHQUd1SSxLQUg1Sjs7QUFLQSxpQkFBSyxxQkFBTCxHQUE2QixLQUFLLEdBQUwsQ0FBUyxhQUFULEVBQTdCO0FBQ0EsZ0JBQUksU0FBUyxJQUFJLGNBQWMsWUFBbEIsR0FBaUMsWUFBakMsQ0FBOEMsS0FBSyxHQUFuRCxFQUF3RCxpQ0FBeEQsRUFBMkYsWUFBM0YsRUFBeUcsY0FBekcsRUFBeUgsS0FBSyxxQkFBOUgsQ0FBYjs7QUFFQSxpQkFBSyxPQUFMLEdBQWUsS0FBSyxHQUFMLENBQVMsa0JBQVQsQ0FBNEIsS0FBSyxxQkFBakMsRUFBd0QsU0FBeEQsQ0FBZjtBQUNBLGlCQUFLLFlBQUwsR0FBb0IsS0FBSyxHQUFMLENBQVMsa0JBQVQsQ0FBNEIsS0FBSyxxQkFBakMsRUFBd0QsY0FBeEQsQ0FBcEI7O0FBRUEsaUJBQUssSUFBSSxHQUFULElBQWdCLEtBQUssZ0JBQXJCLEVBQXVDO0FBQ25DLG9CQUFJLGVBQWUsRUFBRSxzQkFBc0IsU0FBeEI7QUFDZix5Q0FBcUIsU0FETjtBQUVmLHVDQUFtQixXQUZKO0FBR2Ysc0NBQWtCLFdBSEg7QUFJZiw2QkFBUyxTQUpNO0FBS2YsOEJBQVUsU0FMSztBQU1mLDRCQUFRLFNBTk8sR0FNSyxLQUFLLGdCQUFMLENBQXNCLEdBQXRCLEVBQTJCLElBTmhDLENBQW5COztBQVFBLDhCQUFjLFlBQWQsQ0FBMkIsMEJBQTNCLENBQXNELEtBQUssZ0JBQTNELEVBQTZFLEdBQTdFO0FBQ0Esb0JBQUksTUFBTSxpQkFBaUIsV0FBakIsR0FBK0IsS0FBSyxHQUFMLENBQVMsaUJBQVQsQ0FBMkIsS0FBSyxxQkFBaEMsRUFBdUQsR0FBdkQsQ0FBL0IsR0FBNkYsS0FBSyxHQUFMLENBQVMsa0JBQVQsQ0FBNEIsS0FBSyxxQkFBakMsRUFBd0QsSUFBSSxPQUFKLENBQVksUUFBWixFQUFzQixFQUF0QixDQUF4RCxDQUF2RztBQUNBLHFCQUFLLGdCQUFMLENBQXNCLEdBQXRCLEVBQTJCLFFBQTNCLEdBQXNDLENBQUMsR0FBRCxDQUF0QztBQUNBLHFCQUFLLGdCQUFMLENBQXNCLEdBQXRCLEVBQTJCLFlBQTNCLEdBQTBDLFlBQTFDO0FBQ0g7O0FBRUQsaUJBQUssSUFBSSxJQUFULElBQWlCLEtBQUssa0JBQXRCLEVBQTBDO0FBQ3RDLG9CQUFJLGdCQUFnQixFQUFFLHNCQUFzQixTQUF4QjtBQUNoQix5Q0FBcUIsU0FETDtBQUVoQiw2QkFBUyxTQUZPO0FBR2hCLDhCQUFVLFNBSE07QUFJaEIsNEJBQVEsU0FKUSxHQUlJLEtBQUssa0JBQUwsQ0FBd0IsSUFBeEIsRUFBOEIsSUFKbEMsQ0FBcEI7O0FBTUEsOEJBQWMsWUFBZCxDQUEyQiwwQkFBM0IsQ0FBc0QsS0FBSyxrQkFBM0QsRUFBK0UsSUFBL0U7QUFDQSxxQkFBSyxrQkFBTCxDQUF3QixJQUF4QixFQUE4QixRQUE5QixHQUF5QyxDQUFDLEtBQUssR0FBTCxDQUFTLGtCQUFULENBQTRCLEtBQUsscUJBQWpDLEVBQXdELEtBQUssT0FBTCxDQUFhLFFBQWIsRUFBdUIsRUFBdkIsQ0FBeEQsQ0FBRCxDQUF6QztBQUNBLHFCQUFLLGtCQUFMLENBQXdCLElBQXhCLEVBQThCLFlBQTlCLEdBQTZDLGFBQTdDO0FBQ0g7O0FBRUQsbUJBQU8scUJBQXFCLFlBQXJCLEdBQW9DLHVCQUFwQyxHQUE4RCxjQUFyRTtBQUNIO0FBM0N1QyxLQUFELEVBNEN4QztBQUNDLGFBQUssaUJBRE47O0FBSUM7Ozs7O0FBS0EsZUFBTyxTQUFTLGVBQVQsQ0FBeUIsWUFBekIsRUFBdUMsWUFBdkMsRUFBcUQ7QUFDeEQsZ0JBQUksa0JBQWtCLGFBQWEsS0FBYixDQUFtQixHQUFuQixFQUF3QixDQUF4QixFQUEyQixLQUEzQixDQUFpQyxHQUFqQyxFQUFzQyxDQUF0QyxFQUF5QyxLQUF6QyxDQUErQyxHQUEvQyxDQUF0QixDQUR3RCxDQUNtQjs7QUFFM0UsaUJBQUssSUFBSSxJQUFJLENBQVIsRUFBVyxJQUFJLGdCQUFnQixNQUFwQyxFQUE0QyxJQUFJLENBQWhELEVBQW1ELEdBQW5ELEVBQXdEO0FBQ3BELG9CQUFJLGdCQUFnQixDQUFoQixFQUFtQixLQUFuQixDQUF5QixVQUF6QixNQUF5QyxJQUE3QyxFQUFtRDtBQUMvQyx3QkFBSSxVQUFVLGdCQUFnQixDQUFoQixFQUFtQixLQUFuQixDQUF5QixPQUF6QixFQUFrQyxDQUFsQyxFQUFxQyxJQUFyQyxFQUFkO0FBQ0Esa0NBQWMsWUFBZCxDQUEyQiwwQkFBM0IsQ0FBc0QsS0FBSyxnQkFBM0QsRUFBNkUsT0FBN0U7O0FBRUEsd0JBQUksZ0JBQWdCLENBQWhCLEVBQW1CLEtBQW5CLENBQXlCLFVBQXpCLEtBQXdDLElBQTVDLEVBQWtELEtBQUssZ0JBQUwsQ0FBc0IsT0FBdEIsRUFBK0IsSUFBL0IsR0FBc0MsaUJBQXRDLENBQWxELEtBQStHLElBQUksZ0JBQWdCLENBQWhCLEVBQW1CLEtBQW5CLENBQXlCLFNBQXpCLEtBQXVDLElBQTNDLEVBQWlELEtBQUssZ0JBQUwsQ0FBc0IsT0FBdEIsRUFBK0IsSUFBL0IsR0FBc0MsZ0JBQXRDO0FBQ25LLGlCQUxELE1BS08sSUFBSSxnQkFBZ0IsQ0FBaEIsRUFBbUIsS0FBbkIsQ0FBeUIsTUFBekIsTUFBcUMsSUFBekMsRUFBK0M7QUFDbEQsd0JBQUksV0FBVyxnQkFBZ0IsQ0FBaEIsRUFBbUIsS0FBbkIsQ0FBeUIsR0FBekIsRUFBOEIsQ0FBOUIsRUFBaUMsSUFBakMsRUFBZjtBQUNBLGtDQUFjLFlBQWQsQ0FBMkIsMEJBQTNCLENBQXNELEtBQUssZ0JBQTNELEVBQTZFLFFBQTdFOztBQUVBLHdCQUFJLGdCQUFnQixDQUFoQixFQUFtQixLQUFuQixDQUF5QixVQUF6QixLQUF3QyxJQUE1QyxFQUFrRCxLQUFLLGdCQUFMLENBQXNCLFFBQXRCLEVBQWdDLElBQWhDLEdBQXVDLG9CQUF2QyxDQUFsRCxLQUFtSCxJQUFJLGdCQUFnQixDQUFoQixFQUFtQixLQUFuQixDQUF5QixTQUF6QixLQUF1QyxJQUEzQyxFQUFpRCxLQUFLLGdCQUFMLENBQXNCLFFBQXRCLEVBQWdDLElBQWhDLEdBQXVDLG1CQUF2QztBQUN2SyxpQkFMTSxNQUtBLElBQUksZ0JBQWdCLENBQWhCLE1BQXVCLEVBQTNCLEVBQStCO0FBQ2xDLHdCQUFJLFlBQVksZ0JBQWdCLENBQWhCLEVBQW1CLEtBQW5CLENBQXlCLEdBQXpCLEVBQThCLENBQTlCLEVBQWlDLElBQWpDLEVBQWhCO0FBQ0EseUJBQUssSUFBSSxHQUFULElBQWdCLEtBQUssZ0JBQXJCLEVBQXVDO0FBQ25DLDRCQUFJLElBQUksT0FBSixDQUFZLFFBQVosRUFBc0IsRUFBdEIsTUFBOEIsU0FBbEMsRUFBNkM7QUFDekMsd0NBQVksR0FBWixDQUR5QyxDQUN4QjtBQUNqQjtBQUNIO0FBQ0o7O0FBRUQsa0NBQWMsWUFBZCxDQUEyQiwwQkFBM0IsQ0FBc0QsS0FBSyxnQkFBM0QsRUFBNkUsU0FBN0U7O0FBRUEsd0JBQUksZ0JBQWdCLENBQWhCLEVBQW1CLEtBQW5CLENBQXlCLFVBQXpCLEtBQXdDLElBQTVDLEVBQWtELEtBQUssZ0JBQUwsQ0FBc0IsU0FBdEIsRUFBaUMsSUFBakMsR0FBd0MsUUFBeEMsQ0FBbEQsS0FBd0csSUFBSSxnQkFBZ0IsQ0FBaEIsRUFBbUIsS0FBbkIsQ0FBeUIsU0FBekIsS0FBdUMsSUFBM0MsRUFBaUQsS0FBSyxnQkFBTCxDQUFzQixTQUF0QixFQUFpQyxJQUFqQyxHQUF3QyxPQUF4QyxDQUFqRCxLQUFzRyxJQUFJLGdCQUFnQixDQUFoQixFQUFtQixLQUFuQixDQUF5QixRQUF6QixLQUFzQyxJQUExQyxFQUFnRCxLQUFLLGdCQUFMLENBQXNCLFNBQXRCLEVBQWlDLElBQWpDLEdBQXdDLE1BQXhDO0FBQ2pRO0FBQ0o7O0FBRUQ7QUFDQSxpQkFBSyxXQUFMLEdBQW1CLGlCQUFpQixTQUFqQixJQUE4QixpQkFBaUIsSUFBL0MsR0FBc0QsWUFBdEQsR0FBcUUsRUFBeEY7QUFDQSxpQkFBSyxXQUFMLEdBQW1CLEtBQUssV0FBTCxDQUFpQixPQUFqQixDQUF5QixRQUF6QixFQUFtQyxFQUFuQyxFQUF1QyxPQUF2QyxDQUErQyxNQUEvQyxFQUF1RCxFQUF2RCxFQUEyRCxPQUEzRCxDQUFtRSxNQUFuRSxFQUEyRSxFQUEzRSxDQUFuQjtBQUNBLGlCQUFLLFdBQUwsR0FBbUIsY0FBYyxZQUFkLENBQTJCLFdBQTNCLENBQXVDLEtBQUssV0FBNUMsRUFBeUQsS0FBSyxnQkFBOUQsQ0FBbkI7O0FBRUE7QUFDQSxpQkFBSyxhQUFMLEdBQXFCLGFBQWEsT0FBYixDQUFxQixRQUFyQixFQUErQixFQUEvQixFQUFtQyxPQUFuQyxDQUEyQyxNQUEzQyxFQUFtRCxFQUFuRCxFQUF1RCxPQUF2RCxDQUErRCxNQUEvRCxFQUF1RSxFQUF2RSxDQUFyQjtBQUNBLGlCQUFLLGFBQUwsR0FBcUIsS0FBSyxhQUFMLENBQW1CLE9BQW5CLENBQTJCLDRCQUEzQixFQUF5RCxFQUF6RCxFQUE2RCxPQUE3RCxDQUFxRSxjQUFyRSxFQUFxRixFQUFyRixDQUFyQjtBQUNBLGlCQUFLLGFBQUwsR0FBcUIsY0FBYyxZQUFkLENBQTJCLFdBQTNCLENBQXVDLEtBQUssYUFBNUMsRUFBMkQsS0FBSyxnQkFBaEUsQ0FBckI7O0FBRUEsaUJBQUssY0FBTCxHQUFzQixJQUF0QjtBQUNBLGdCQUFJLEtBQUssZ0JBQUwsS0FBMEIsSUFBOUIsRUFBb0M7QUFDaEMsb0JBQUksS0FBSyxLQUFLLDJCQUFMLEVBQVQ7O0FBRUEsb0JBQUksS0FBSyxVQUFMLEtBQW9CLElBQXhCLEVBQThCLFFBQVEsR0FBUixDQUFZLGFBQWEsS0FBSyxJQUE5QixFQUFvQywrQkFBcEMsR0FBc0UsUUFBUSxHQUFSLENBQVksNkNBQVosRUFBMkQsYUFBM0QsQ0FBdEUsRUFBaUosUUFBUSxHQUFSLENBQVksUUFBUSxZQUFSLEdBQXVCLFlBQW5DLEVBQWlELGFBQWpELENBQWpKLEVBQWtOLFFBQVEsR0FBUixDQUFZLG9EQUFaLEVBQWtFLGlCQUFsRSxDQUFsTixFQUF3UyxRQUFRLEdBQVIsQ0FBWSxRQUFRLEVBQXBCLEVBQXdCLGlCQUF4QixDQUF4UztBQUNqQztBQUNKO0FBdERGLEtBNUN3QyxFQW1HeEM7QUFDQyxhQUFLLG1CQUROOztBQUlDOzs7OztBQUtBLGVBQU8sU0FBUyxpQkFBVCxDQUEyQixjQUEzQixFQUEyQyxjQUEzQyxFQUEyRDtBQUM5RCxnQkFBSSxrQkFBa0IsZUFBZSxLQUFmLENBQXFCLEdBQXJCLEVBQTBCLENBQTFCLEVBQTZCLEtBQTdCLENBQW1DLEdBQW5DLEVBQXdDLENBQXhDLEVBQTJDLEtBQTNDLENBQWlELEdBQWpELENBQXRCLENBRDhELENBQ2U7O0FBRTdFLGlCQUFLLElBQUksSUFBSSxDQUFSLEVBQVcsSUFBSSxnQkFBZ0IsTUFBcEMsRUFBNEMsSUFBSSxDQUFoRCxFQUFtRCxHQUFuRCxFQUF3RDtBQUNwRCxvQkFBSSxnQkFBZ0IsQ0FBaEIsRUFBbUIsS0FBbkIsQ0FBeUIsTUFBekIsTUFBcUMsSUFBekMsRUFBK0M7QUFDM0Msd0JBQUksVUFBVSxnQkFBZ0IsQ0FBaEIsRUFBbUIsS0FBbkIsQ0FBeUIsR0FBekIsRUFBOEIsQ0FBOUIsRUFBaUMsSUFBakMsRUFBZDtBQUNBLGtDQUFjLFlBQWQsQ0FBMkIsMEJBQTNCLENBQXNELEtBQUssa0JBQTNELEVBQStFLE9BQS9FOztBQUVBLHdCQUFJLGdCQUFnQixDQUFoQixFQUFtQixLQUFuQixDQUF5QixVQUF6QixLQUF3QyxJQUE1QyxFQUFrRCxLQUFLLGtCQUFMLENBQXdCLE9BQXhCLEVBQWlDLElBQWpDLEdBQXdDLG9CQUF4QyxDQUFsRCxLQUFvSCxJQUFJLGdCQUFnQixDQUFoQixFQUFtQixLQUFuQixDQUF5QixTQUF6QixLQUF1QyxJQUEzQyxFQUFpRCxLQUFLLGtCQUFMLENBQXdCLE9BQXhCLEVBQWlDLElBQWpDLEdBQXdDLG1CQUF4QztBQUN4SyxpQkFMRCxNQUtPLElBQUksZ0JBQWdCLENBQWhCLE1BQXVCLEVBQTNCLEVBQStCO0FBQ2xDLHdCQUFJLFlBQVksZ0JBQWdCLENBQWhCLEVBQW1CLEtBQW5CLENBQXlCLEdBQXpCLEVBQThCLENBQTlCLEVBQWlDLElBQWpDLEVBQWhCO0FBQ0EseUJBQUssSUFBSSxHQUFULElBQWdCLEtBQUssa0JBQXJCLEVBQXlDO0FBQ3JDLDRCQUFJLElBQUksT0FBSixDQUFZLFFBQVosRUFBc0IsRUFBdEIsTUFBOEIsU0FBbEMsRUFBNkM7QUFDekMsd0NBQVksR0FBWixDQUR5QyxDQUN4QjtBQUNqQjtBQUNIO0FBQ0o7O0FBRUQsa0NBQWMsWUFBZCxDQUEyQiwwQkFBM0IsQ0FBc0QsS0FBSyxrQkFBM0QsRUFBK0UsU0FBL0U7O0FBRUEsd0JBQUksZ0JBQWdCLENBQWhCLEVBQW1CLEtBQW5CLENBQXlCLFVBQXpCLEtBQXdDLElBQTVDLEVBQWtELEtBQUssa0JBQUwsQ0FBd0IsU0FBeEIsRUFBbUMsSUFBbkMsR0FBMEMsUUFBMUMsQ0FBbEQsS0FBMEcsSUFBSSxnQkFBZ0IsQ0FBaEIsRUFBbUIsS0FBbkIsQ0FBeUIsU0FBekIsS0FBdUMsSUFBM0MsRUFBaUQsS0FBSyxrQkFBTCxDQUF3QixTQUF4QixFQUFtQyxJQUFuQyxHQUEwQyxPQUExQyxDQUFqRCxLQUF3RyxJQUFJLGdCQUFnQixDQUFoQixFQUFtQixLQUFuQixDQUF5QixRQUF6QixLQUFzQyxJQUExQyxFQUFnRCxLQUFLLGtCQUFMLENBQXdCLFNBQXhCLEVBQW1DLElBQW5DLEdBQTBDLE1BQTFDO0FBQ3JRO0FBQ0o7O0FBRUQ7QUFDQSxpQkFBSyxhQUFMLEdBQXFCLG1CQUFtQixTQUFuQixJQUFnQyxtQkFBbUIsSUFBbkQsR0FBMEQsY0FBMUQsR0FBMkUsRUFBaEc7QUFDQSxpQkFBSyxhQUFMLEdBQXFCLEtBQUssYUFBTCxDQUFtQixPQUFuQixDQUEyQixRQUEzQixFQUFxQyxFQUFyQyxFQUF5QyxPQUF6QyxDQUFpRCxNQUFqRCxFQUF5RCxFQUF6RCxFQUE2RCxPQUE3RCxDQUFxRSxNQUFyRSxFQUE2RSxFQUE3RSxDQUFyQjtBQUNBLGlCQUFLLGFBQUwsR0FBcUIsY0FBYyxZQUFkLENBQTJCLFdBQTNCLENBQXVDLEtBQUssYUFBNUMsRUFBMkQsS0FBSyxrQkFBaEUsQ0FBckI7O0FBRUE7QUFDQSxpQkFBSyxlQUFMLEdBQXVCLGVBQWUsT0FBZixDQUF1QixRQUF2QixFQUFpQyxFQUFqQyxFQUFxQyxPQUFyQyxDQUE2QyxNQUE3QyxFQUFxRCxFQUFyRCxFQUF5RCxPQUF6RCxDQUFpRSxNQUFqRSxFQUF5RSxFQUF6RSxDQUF2QjtBQUNBLGlCQUFLLGVBQUwsR0FBdUIsS0FBSyxlQUFMLENBQXFCLE9BQXJCLENBQTZCLDRCQUE3QixFQUEyRCxFQUEzRCxFQUErRCxPQUEvRCxDQUF1RSxjQUF2RSxFQUF1RixFQUF2RixDQUF2QjtBQUNBLGlCQUFLLGVBQUwsR0FBdUIsY0FBYyxZQUFkLENBQTJCLFdBQTNCLENBQXVDLEtBQUssZUFBNUMsRUFBNkQsS0FBSyxrQkFBbEUsQ0FBdkI7O0FBRUEsaUJBQUssZ0JBQUwsR0FBd0IsSUFBeEI7QUFDQSxnQkFBSSxLQUFLLGNBQUwsS0FBd0IsSUFBNUIsRUFBa0M7QUFDOUIsb0JBQUksS0FBSyxLQUFLLDJCQUFMLEVBQVQ7O0FBRUEsb0JBQUksS0FBSyxVQUFMLEtBQW9CLElBQXhCLEVBQThCLFFBQVEsR0FBUixDQUFZLFVBQVosRUFBd0IsK0JBQXhCLEdBQTBELFFBQVEsR0FBUixDQUFZLDZDQUFaLEVBQTJELGFBQTNELENBQTFELEVBQXFJLFFBQVEsR0FBUixDQUFZLFFBQVEsY0FBUixHQUF5QixjQUFyQyxFQUFxRCxhQUFyRCxDQUFySSxFQUEwTSxRQUFRLEdBQVIsQ0FBWSxvREFBWixFQUFrRSxpQkFBbEUsQ0FBMU0sRUFBZ1MsUUFBUSxHQUFSLENBQVksUUFBUSxFQUFwQixFQUF3QixpQkFBeEIsQ0FBaFM7QUFDakM7QUFDSjtBQWpERixLQW5Hd0MsQ0FBM0M7O0FBdUpBLFdBQU8sNEJBQVA7QUFDSCxDQW5NeUUsRUFBMUU7O0FBcU1BLE9BQU8sNEJBQVAsR0FBc0MsNEJBQXRDO0FBQ0EsT0FBTyxPQUFQLENBQWUsNEJBQWYsR0FBOEMsNEJBQTlDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc31yZXR1cm4gZX0pKCkiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG4vKiogXG4qIFV0aWxpdGllc1xuKiBAY2xhc3NcbiogQGNvbnN0cnVjdG9yXG4qL1xudmFyIFdlYkNMR0xVdGlscyA9IGV4cG9ydHMuV2ViQ0xHTFV0aWxzID0gZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFdlYkNMR0xVdGlscygpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFdlYkNMR0xVdGlscyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogbG9hZFF1YWRcbiAgICAgKi9cblxuXG4gICAgX2NyZWF0ZUNsYXNzKFdlYkNMR0xVdGlscywgW3tcbiAgICAgICAga2V5OiBcImxvYWRRdWFkXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBsb2FkUXVhZChub2RlLCBsZW5ndGgsIGhlaWdodCkge1xuICAgICAgICAgICAgdmFyIGwgPSBsZW5ndGggPT09IHVuZGVmaW5lZCB8fCBsZW5ndGggPT09IG51bGwgPyAwLjUgOiBsZW5ndGg7XG4gICAgICAgICAgICB2YXIgaCA9IGhlaWdodCA9PT0gdW5kZWZpbmVkIHx8IGhlaWdodCA9PT0gbnVsbCA/IDAuNSA6IGhlaWdodDtcbiAgICAgICAgICAgIHRoaXMudmVydGV4QXJyYXkgPSBbLWwsIC1oLCAwLjAsIGwsIC1oLCAwLjAsIGwsIGgsIDAuMCwgLWwsIGgsIDAuMF07XG5cbiAgICAgICAgICAgIHRoaXMudGV4dHVyZUFycmF5ID0gWzAuMCwgMC4wLCAwLjAsIDEuMCwgMC4wLCAwLjAsIDEuMCwgMS4wLCAwLjAsIDAuMCwgMS4wLCAwLjBdO1xuXG4gICAgICAgICAgICB0aGlzLmluZGV4QXJyYXkgPSBbMCwgMSwgMiwgMCwgMiwgM107XG5cbiAgICAgICAgICAgIHZhciBtZXNoT2JqZWN0ID0ge307XG4gICAgICAgICAgICBtZXNoT2JqZWN0LnZlcnRleEFycmF5ID0gdGhpcy52ZXJ0ZXhBcnJheTtcbiAgICAgICAgICAgIG1lc2hPYmplY3QudGV4dHVyZUFycmF5ID0gdGhpcy50ZXh0dXJlQXJyYXk7XG4gICAgICAgICAgICBtZXNoT2JqZWN0LmluZGV4QXJyYXkgPSB0aGlzLmluZGV4QXJyYXk7XG5cbiAgICAgICAgICAgIHJldHVybiBtZXNoT2JqZWN0O1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY3JlYXRlU2hhZGVyXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogY3JlYXRlU2hhZGVyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlU2hhZGVyKGdsLCBuYW1lLCBzb3VyY2VWZXJ0ZXgsIHNvdXJjZUZyYWdtZW50LCBzaGFkZXJQcm9ncmFtKSB7XG4gICAgICAgICAgICB2YXIgX3N2ID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgX3NmID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHZhciBtYWtlRGVidWcgPSBmdW5jdGlvbiAoaW5mb0xvZywgc2hhZGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coaW5mb0xvZyk7XG5cbiAgICAgICAgICAgICAgICB2YXIgYXJyRXJyb3JzID0gW107XG4gICAgICAgICAgICAgICAgdmFyIGVycm9ycyA9IGluZm9Mb2cuc3BsaXQoXCJcXG5cIik7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGYgPSBlcnJvcnMubGVuZ3RoOyBuIDwgZjsgbisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvcnNbbl0ubWF0Y2goL15FUlJPUi9naW0pICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBleHBsID0gZXJyb3JzW25dLnNwbGl0KCc6Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGluZSA9IHBhcnNlSW50KGV4cGxbMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJyRXJyb3JzLnB1c2goW2xpbmUsIGVycm9yc1tuXV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBzb3VyID0gZ2wuZ2V0U2hhZGVyU291cmNlKHNoYWRlcikuc3BsaXQoXCJcXG5cIik7XG4gICAgICAgICAgICAgICAgc291ci51bnNoaWZ0KFwiXCIpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIF9uID0gMCwgX2YgPSBzb3VyLmxlbmd0aDsgX24gPCBfZjsgX24rKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGluZVdpdGhFcnJvciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZXJyb3JTdHIgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgZSA9IDAsIGZlID0gYXJyRXJyb3JzLmxlbmd0aDsgZSA8IGZlOyBlKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChfbiA9PT0gYXJyRXJyb3JzW2VdWzBdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZVdpdGhFcnJvciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JTdHIgPSBhcnJFcnJvcnNbZV1bMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpbmVXaXRoRXJyb3IgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIiVjXCIgKyBfbiArICcgJWMnICsgc291cltfbl0sIFwiY29sb3I6YmxhY2tcIiwgXCJjb2xvcjpibHVlXCIpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJyVj4pa64pa6JWMnICsgX24gKyAnICVjJyArIHNvdXJbX25dICsgJ1xcbiVjJyArIGVycm9yU3RyLCBcImNvbG9yOnJlZFwiLCBcImNvbG9yOmJsYWNrXCIsIFwiY29sb3I6Ymx1ZVwiLCBcImNvbG9yOnJlZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICAgICAgdmFyIHNoYWRlclZlcnRleCA9IGdsLmNyZWF0ZVNoYWRlcihnbC5WRVJURVhfU0hBREVSKTtcbiAgICAgICAgICAgIGdsLnNoYWRlclNvdXJjZShzaGFkZXJWZXJ0ZXgsIHNvdXJjZVZlcnRleCk7XG4gICAgICAgICAgICBnbC5jb21waWxlU2hhZGVyKHNoYWRlclZlcnRleCk7XG4gICAgICAgICAgICBpZiAoIWdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXJWZXJ0ZXgsIGdsLkNPTVBJTEVfU1RBVFVTKSkge1xuICAgICAgICAgICAgICAgIHZhciBpbmZvTG9nID0gZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXJWZXJ0ZXgpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiJWNcIiArIG5hbWUgKyAnIEVSUk9SICh2ZXJ0ZXggcHJvZ3JhbSknLCBcImNvbG9yOnJlZFwiKTtcblxuICAgICAgICAgICAgICAgIGlmIChpbmZvTG9nICE9PSB1bmRlZmluZWQgJiYgaW5mb0xvZyAhPT0gbnVsbCkgbWFrZURlYnVnKGluZm9Mb2csIHNoYWRlclZlcnRleCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGdsLmF0dGFjaFNoYWRlcihzaGFkZXJQcm9ncmFtLCBzaGFkZXJWZXJ0ZXgpO1xuICAgICAgICAgICAgICAgIF9zdiA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBzaGFkZXJGcmFnbWVudCA9IGdsLmNyZWF0ZVNoYWRlcihnbC5GUkFHTUVOVF9TSEFERVIpO1xuICAgICAgICAgICAgZ2wuc2hhZGVyU291cmNlKHNoYWRlckZyYWdtZW50LCBzb3VyY2VGcmFnbWVudCk7XG4gICAgICAgICAgICBnbC5jb21waWxlU2hhZGVyKHNoYWRlckZyYWdtZW50KTtcbiAgICAgICAgICAgIGlmICghZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlckZyYWdtZW50LCBnbC5DT01QSUxFX1NUQVRVUykpIHtcbiAgICAgICAgICAgICAgICB2YXIgX2luZm9Mb2cgPSBnbC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlckZyYWdtZW50KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIiVjXCIgKyBuYW1lICsgJyBFUlJPUiAoZnJhZ21lbnQgcHJvZ3JhbSknLCBcImNvbG9yOnJlZFwiKTtcblxuICAgICAgICAgICAgICAgIGlmIChfaW5mb0xvZyAhPT0gdW5kZWZpbmVkICYmIF9pbmZvTG9nICE9PSBudWxsKSBtYWtlRGVidWcoX2luZm9Mb2csIHNoYWRlckZyYWdtZW50KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZ2wuYXR0YWNoU2hhZGVyKHNoYWRlclByb2dyYW0sIHNoYWRlckZyYWdtZW50KTtcbiAgICAgICAgICAgICAgICBfc2YgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoX3N2ID09PSB0cnVlICYmIF9zZiA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIGdsLmxpbmtQcm9ncmFtKHNoYWRlclByb2dyYW0pO1xuICAgICAgICAgICAgICAgIHZhciBzdWNjZXNzID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihzaGFkZXJQcm9ncmFtLCBnbC5MSU5LX1NUQVRVUyk7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0Vycm9yIHNoYWRlciBwcm9ncmFtICcgKyBuYW1lICsgJzpcXG4gJyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsb2cgPSBnbC5nZXRQcm9ncmFtSW5mb0xvZyhzaGFkZXJQcm9ncmFtKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvZyAhPT0gdW5kZWZpbmVkICYmIGxvZyAhPT0gbnVsbCkgY29uc29sZS5sb2cobG9nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwicGFja1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBhY2sgMWZsb2F0ICgwLjAtMS4wKSB0byA0ZmxvYXQgcmdiYSAoMC4wLTEuMCwgMC4wLTEuMCwgMC4wLTEuMCwgMC4wLTEuMClcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBwYWNrKHYpIHtcbiAgICAgICAgICAgIHZhciBiaWFzID0gWzEuMCAvIDI1NS4wLCAxLjAgLyAyNTUuMCwgMS4wIC8gMjU1LjAsIDAuMF07XG5cbiAgICAgICAgICAgIHZhciByID0gdjtcbiAgICAgICAgICAgIHZhciBnID0gdGhpcy5mcmFjdChyICogMjU1LjApO1xuICAgICAgICAgICAgdmFyIGIgPSB0aGlzLmZyYWN0KGcgKiAyNTUuMCk7XG4gICAgICAgICAgICB2YXIgYSA9IHRoaXMuZnJhY3QoYiAqIDI1NS4wKTtcbiAgICAgICAgICAgIHZhciBjb2xvdXIgPSBbciwgZywgYiwgYV07XG5cbiAgICAgICAgICAgIHZhciBkZCA9IFtjb2xvdXJbMV0gKiBiaWFzWzBdLCBjb2xvdXJbMl0gKiBiaWFzWzFdLCBjb2xvdXJbM10gKiBiaWFzWzJdLCBjb2xvdXJbM10gKiBiaWFzWzNdXTtcblxuICAgICAgICAgICAgcmV0dXJuIFtjb2xvdXJbMF0gLSBkZFswXSwgY29sb3VyWzFdIC0gZGRbMV0sIGNvbG91clsyXSAtIGRkWzJdLCBjb2xvdXJbM10gLSBkZFszXV07XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJ1bnBhY2tcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBVbnBhY2sgNGZsb2F0IHJnYmEgKDAuMC0xLjAsIDAuMC0xLjAsIDAuMC0xLjAsIDAuMC0xLjApIHRvIDFmbG9hdCAoMC4wLTEuMClcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiB1bnBhY2soY29sb3VyKSB7XG4gICAgICAgICAgICB2YXIgYml0U2hpZnRzID0gWzEuMCwgMS4wIC8gMjU1LjAsIDEuMCAvICgyNTUuMCAqIDI1NS4wKSwgMS4wIC8gKDI1NS4wICogMjU1LjAgKiAyNTUuMCldO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZG90NChjb2xvdXIsIGJpdFNoaWZ0cyk7XG4gICAgICAgIH1cbiAgICB9XSwgW3tcbiAgICAgICAga2V5OiBcImdldFdlYkdMQ29udGV4dEZyb21DYW52YXNcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBnZXRXZWJHTENvbnRleHRGcm9tQ2FudmFzXG4gICAgICAgICAqIEBwYXJhbSB7SFRNTENhbnZhc0VsZW1lbnR9IGNhbnZhc1xuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gY3R4T3B0XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0V2ViR0xDb250ZXh0RnJvbUNhbnZhcyhjYW52YXMsIGN0eE9wdCkge1xuICAgICAgICAgICAgdmFyIGdsID0gbnVsbDtcbiAgICAgICAgICAgIC8qdHJ5IHtcbiAgICAgICAgICAgICAgICBpZihjdHhPcHQgPT0gdW5kZWZpbmVkIHx8IGN0eE9wdCA9PT0gbnVsbCkgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsMlwiKTtcbiAgICAgICAgICAgICAgICBlbHNlIGdsID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbDJcIiwgY3R4T3B0KTtcbiAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coKGdsID09IG51bGwpP1wibm8gd2ViZ2wyXCI6XCJ1c2luZyB3ZWJnbDJcIik7XG4gICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICBnbCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihnbCA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgaWYoY3R4T3B0ID09IHVuZGVmaW5lZCB8fCBjdHhPcHQgPT09IG51bGwpIGdsID0gY2FudmFzLmdldENvbnRleHQoXCJleHBlcmltZW50YWwtd2ViZ2wyXCIpO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIGdsID0gY2FudmFzLmdldENvbnRleHQoXCJleHBlcmltZW50YWwtd2ViZ2wyXCIsIGN0eE9wdCk7XG4gICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygoZ2wgPT0gbnVsbCk/XCJubyBleHBlcmltZW50YWwtd2ViZ2wyXCI6XCJ1c2luZyBleHBlcmltZW50YWwtd2ViZ2wyXCIpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgICAgICBnbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSovXG4gICAgICAgICAgICBpZiAoZ2wgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdHhPcHQgPT09IHVuZGVmaW5lZCB8fCBjdHhPcHQgPT09IG51bGwpIGdsID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbFwiKTtlbHNlIGdsID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbFwiLCBjdHhPcHQpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGdsID09IG51bGwgPyBcIm5vIHdlYmdsXCIgOiBcInVzaW5nIHdlYmdsXCIpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZ2wgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChnbCA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN0eE9wdCA9PT0gdW5kZWZpbmVkIHx8IGN0eE9wdCA9PT0gbnVsbCkgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcImV4cGVyaW1lbnRhbC13ZWJnbFwiKTtlbHNlIGdsID0gY2FudmFzLmdldENvbnRleHQoXCJleHBlcmltZW50YWwtd2ViZ2xcIiwgY3R4T3B0KTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhnbCA9PSBudWxsID8gXCJubyBleHBlcmltZW50YWwtd2ViZ2xcIiA6IFwidXNpbmcgZXhwZXJpbWVudGFsLXdlYmdsXCIpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZ2wgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChnbCA9PSBudWxsKSBnbCA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGdsO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZ2V0VWludDhBcnJheUZyb21IVE1MSW1hZ2VFbGVtZW50XCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IFVpbnQ4QXJyYXkgZnJvbSBIVE1MSW1hZ2VFbGVtZW50XG4gICAgICAgICAqIEBwYXJhbSB7SFRNTEltYWdlRWxlbWVudH0gaW1hZ2VFbGVtZW50XG4gICAgICAgICAqIEByZXR1cm5zIHtVaW50OENsYW1wZWRBcnJheX1cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRVaW50OEFycmF5RnJvbUhUTUxJbWFnZUVsZW1lbnQoaW1hZ2VFbGVtZW50KSB7XG4gICAgICAgICAgICB2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICAgICAgZS53aWR0aCA9IGltYWdlRWxlbWVudC53aWR0aDtcbiAgICAgICAgICAgIGUuaGVpZ2h0ID0gaW1hZ2VFbGVtZW50LmhlaWdodDtcbiAgICAgICAgICAgIHZhciBjdHgyRF90ZXggPSBlLmdldENvbnRleHQoXCIyZFwiKTtcbiAgICAgICAgICAgIGN0eDJEX3RleC5kcmF3SW1hZ2UoaW1hZ2VFbGVtZW50LCAwLCAwKTtcbiAgICAgICAgICAgIHZhciBhcnJheVRleCA9IGN0eDJEX3RleC5nZXRJbWFnZURhdGEoMCwgMCwgaW1hZ2VFbGVtZW50LndpZHRoLCBpbWFnZUVsZW1lbnQuaGVpZ2h0KTtcblxuICAgICAgICAgICAgcmV0dXJuIGFycmF5VGV4LmRhdGE7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJkb3Q0XCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogRG90IHByb2R1Y3QgdmVjdG9yNGZsb2F0XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZG90NCh2ZWN0b3I0QSwgdmVjdG9yNEIpIHtcbiAgICAgICAgICAgIHJldHVybiB2ZWN0b3I0QVswXSAqIHZlY3RvcjRCWzBdICsgdmVjdG9yNEFbMV0gKiB2ZWN0b3I0QlsxXSArIHZlY3RvcjRBWzJdICogdmVjdG9yNEJbMl0gKyB2ZWN0b3I0QVszXSAqIHZlY3RvcjRCWzNdO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZnJhY3RcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb21wdXRlIHRoZSBmcmFjdGlvbmFsIHBhcnQgb2YgdGhlIGFyZ3VtZW50LiBmcmFjdChwaSk9MC4xNDE1OTI2NS4uLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGZyYWN0KG51bWJlcikge1xuICAgICAgICAgICAgcmV0dXJuIG51bWJlciA+IDAgPyBudW1iZXIgLSBNYXRoLmZsb29yKG51bWJlcikgOiBudW1iZXIgLSBNYXRoLmNlaWwobnVtYmVyKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInBhY2tHTFNMRnVuY3Rpb25TdHJpbmdcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgcGFjayBHTFNMIGZ1bmN0aW9uIHN0cmluZ1xuICAgICAgICAgKiBAcmV0dXJucyB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHBhY2tHTFNMRnVuY3Rpb25TdHJpbmcoKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3ZlYzQgcGFjayAoZmxvYXQgZGVwdGgpIHtcXG4nICsgJ2NvbnN0IHZlYzQgYmlhcyA9IHZlYzQoMS4wIC8gMjU1LjAsXFxuJyArICcxLjAgLyAyNTUuMCxcXG4nICsgJzEuMCAvIDI1NS4wLFxcbicgKyAnMC4wKTtcXG4nICsgJ2Zsb2F0IHIgPSBkZXB0aDtcXG4nICsgJ2Zsb2F0IGcgPSBmcmFjdChyICogMjU1LjApO1xcbicgKyAnZmxvYXQgYiA9IGZyYWN0KGcgKiAyNTUuMCk7XFxuJyArICdmbG9hdCBhID0gZnJhY3QoYiAqIDI1NS4wKTtcXG4nICsgJ3ZlYzQgY29sb3VyID0gdmVjNChyLCBnLCBiLCBhKTtcXG4nICsgJ3JldHVybiBjb2xvdXIgLSAoY29sb3VyLnl6d3cgKiBiaWFzKTtcXG4nICsgJ31cXG4nO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwidW5wYWNrR0xTTEZ1bmN0aW9uU3RyaW5nXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHVucGFjayBHTFNMIGZ1bmN0aW9uIHN0cmluZ1xuICAgICAgICAgKiBAcmV0dXJucyB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHVucGFja0dMU0xGdW5jdGlvblN0cmluZygpIHtcbiAgICAgICAgICAgIHJldHVybiAnZmxvYXQgdW5wYWNrICh2ZWM0IGNvbG91cikge1xcbicgKyAnY29uc3QgdmVjNCBiaXRTaGlmdHMgPSB2ZWM0KDEuMCxcXG4nICsgJzEuMCAvIDI1NS4wLFxcbicgKyAnMS4wIC8gKDI1NS4wICogMjU1LjApLFxcbicgKyAnMS4wIC8gKDI1NS4wICogMjU1LjAgKiAyNTUuMCkpO1xcbicgKyAncmV0dXJuIGRvdChjb2xvdXIsIGJpdFNoaWZ0cyk7XFxuJyArICd9XFxuJztcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImdldE91dHB1dEJ1ZmZlcnNcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBnZXRPdXRwdXRCdWZmZXJzXG4gICAgICAgICAqIEBwYXJhbSB7V2ViQ0xHTEtlcm5lbHxXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtfSBwcm9nXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXk8V2ViQ0xHTEJ1ZmZlcj59IGJ1ZmZlcnNcbiAgICAgICAgICogQHJldHVybnMge0FycmF5PFdlYkNMR0xCdWZmZXI+fVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldE91dHB1dEJ1ZmZlcnMocHJvZywgYnVmZmVycykge1xuICAgICAgICAgICAgdmFyIG91dHB1dEJ1ZmYgPSBudWxsO1xuICAgICAgICAgICAgaWYgKHByb2cub3V0cHV0ICE9PSB1bmRlZmluZWQgJiYgcHJvZy5vdXRwdXQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRCdWZmID0gW107XG4gICAgICAgICAgICAgICAgaWYgKHByb2cub3V0cHV0WzBdICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPCBwcm9nLm91dHB1dC5sZW5ndGg7IG4rKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9pZihidWZmZXJzLmhhc093blByb3BlcnR5KHByb2cub3V0cHV0W25dKSA9PSBmYWxzZSAmJiBfYWxlcnRlZCA9PSBmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgIF9hbGVydGVkID0gdHJ1ZSwgYWxlcnQoXCJvdXRwdXQgYXJndW1lbnQgXCIrcHJvZy5vdXRwdXRbbl0rXCIgbm90IGZvdW5kIGluIGJ1ZmZlcnMuIGFkZCBkZXNpcmVkIGFyZ3VtZW50IGFzIHNoYXJlZFwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0QnVmZltuXSA9IGJ1ZmZlcnNbcHJvZy5vdXRwdXRbbl1dO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIG91dHB1dEJ1ZmYgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG91dHB1dEJ1ZmY7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJwYXJzZVNvdXJjZVwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIHBhcnNlU291cmNlXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzb3VyY2VcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHZhbHVlc1xuICAgICAgICAgKiBAcmV0dXJucyB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHBhcnNlU291cmNlKHNvdXJjZSwgdmFsdWVzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlZ2V4cCA9IG5ldyBSZWdFeHAoa2V5ICsgXCJcXFxcWyg/IVxcXFxkKS4qP1xcXFxdXCIsIFwiZ21cIik7IC8vIGF2b2lkIG5vcm1hbCB1bmlmb3JtIGFycmF5c1xuICAgICAgICAgICAgICAgIHZhciB2YXJNYXRjaGVzID0gc291cmNlLm1hdGNoKHJlZ2V4cCk7IC8vIFwiU2VhcmNoIGN1cnJlbnQgXCJhcmdOYW1lXCIgaW4gc291cmNlIGFuZCBzdG9yZSBpbiBhcnJheSB2YXJNYXRjaGVzXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyh2YXJNYXRjaGVzKTtcbiAgICAgICAgICAgICAgICBpZiAodmFyTWF0Y2hlcyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG5CID0gMCwgZkIgPSB2YXJNYXRjaGVzLmxlbmd0aDsgbkIgPCBmQjsgbkIrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm9yIGVhY2ggdmFyTWF0Y2hlcyAoXCJBW3hdXCIsIFwiQVt4XVwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlZ2V4cE5hdGl2ZUdMID0gbmV3IFJlZ0V4cCgnYGBgKFxcc3xcXHQpKmdsLionICsgdmFyTWF0Y2hlc1tuQl0gKyAnLipgYGBbXmBgYChcXHN8XFx0KSpnbF0nLCBcImdtXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlZ2V4cE5hdGl2ZUdMTWF0Y2hlcyA9IHNvdXJjZS5tYXRjaChyZWdleHBOYXRpdmVHTCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVnZXhwTmF0aXZlR0xNYXRjaGVzID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZSA9IHZhck1hdGNoZXNbbkJdLnNwbGl0KCdbJylbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhcmkgPSB2YXJNYXRjaGVzW25CXS5zcGxpdCgnWycpWzFdLnNwbGl0KCddJylbMF07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWFwID0geyAnZmxvYXQ0X2Zyb21TYW1wbGVyJzogc291cmNlLnJlcGxhY2UobmFtZSArIFwiW1wiICsgdmFyaSArIFwiXVwiLCAndGV4dHVyZTJEKCcgKyBuYW1lICsgJywnICsgdmFyaSArICcpJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdmbG9hdF9mcm9tU2FtcGxlcic6IHNvdXJjZS5yZXBsYWNlKG5hbWUgKyBcIltcIiArIHZhcmkgKyBcIl1cIiwgJ3RleHR1cmUyRCgnICsgbmFtZSArICcsJyArIHZhcmkgKyAnKS54JyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdmbG9hdDRfZnJvbUF0dHInOiBzb3VyY2UucmVwbGFjZShuYW1lICsgXCJbXCIgKyB2YXJpICsgXCJdXCIsIG5hbWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZmxvYXRfZnJvbUF0dHInOiBzb3VyY2UucmVwbGFjZShuYW1lICsgXCJbXCIgKyB2YXJpICsgXCJdXCIsIG5hbWUpIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlID0gbWFwW3ZhbHVlc1trZXldLnR5cGVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc291cmNlID0gc291cmNlLnJlcGxhY2UoL2BgYChcXHN8XFx0KSpnbC9naSwgXCJcIikucmVwbGFjZSgvYGBgL2dpLCBcIlwiKS5yZXBsYWNlKC87L2dpLCBcIjtcXG5cIikucmVwbGFjZSgvfS9naSwgXCJ9XFxuXCIpLnJlcGxhY2UoL3svZ2ksIFwie1xcblwiKTtcbiAgICAgICAgICAgIHJldHVybiBzb3VyY2U7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJsaW5lc192ZXJ0ZXhfYXR0cnNcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBsaW5lc192ZXJ0ZXhfYXR0cnNcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHZhbHVlc1xuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGxpbmVzX3ZlcnRleF9hdHRycyh2YWx1ZXMpIHtcbiAgICAgICAgICAgIHZhciBzdHIgPSAnJztcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB2YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0geyAnZmxvYXQ0X2Zyb21TYW1wbGVyJzogJ3VuaWZvcm0gc2FtcGxlcjJEICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdF9mcm9tU2FtcGxlcic6ICd1bmlmb3JtIHNhbXBsZXIyRCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXQ0X2Zyb21BdHRyJzogJ2F0dHJpYnV0ZSB2ZWM0ICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdF9mcm9tQXR0cic6ICdhdHRyaWJ1dGUgZmxvYXQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0JzogJ3VuaWZvcm0gZmxvYXQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0NCc6ICd1bmlmb3JtIHZlYzQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ21hdDQnOiAndW5pZm9ybSBtYXQ0ICcgKyBrZXkgKyAnOycgfVt2YWx1ZXNba2V5XS50eXBlXSArICdcXG4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImxpbmVzX2ZyYWdtZW50X2F0dHJzXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogbGluZXNfZnJhZ21lbnRfYXR0cnNcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHZhbHVlc1xuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGxpbmVzX2ZyYWdtZW50X2F0dHJzKHZhbHVlcykge1xuICAgICAgICAgICAgdmFyIHN0ciA9ICcnO1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHZhbHVlcykge1xuICAgICAgICAgICAgICAgIHN0ciArPSB7ICdmbG9hdDRfZnJvbVNhbXBsZXInOiAndW5pZm9ybSBzYW1wbGVyMkQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0X2Zyb21TYW1wbGVyJzogJ3VuaWZvcm0gc2FtcGxlcjJEICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdCc6ICd1bmlmb3JtIGZsb2F0ICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdDQnOiAndW5pZm9ybSB2ZWM0ICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdtYXQ0JzogJ3VuaWZvcm0gbWF0NCAnICsga2V5ICsgJzsnIH1bdmFsdWVzW2tleV0udHlwZV0gKyAnXFxuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJsaW5lc19kcmF3QnVmZmVyc0luaXRcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBsaW5lc19kcmF3QnVmZmVyc0luaXRcbiAgICAgICAgICogQHBhcmFtIHtpbnR9IG1heERyYXdCdWZmZXJzXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gbGluZXNfZHJhd0J1ZmZlcnNJbml0KG1heERyYXdCdWZmZXJzKSB7XG4gICAgICAgICAgICB2YXIgc3RyID0gJyc7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMCwgZm4gPSBtYXhEcmF3QnVmZmVyczsgbiA8IGZuOyBuKyspIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0gJycgKyAnZmxvYXQgb3V0JyArIG4gKyAnX2Zsb2F0ID0gLTk5OS45OTk4OTtcXG4nICsgJ3ZlYzQgb3V0JyArIG4gKyAnX2Zsb2F0NDtcXG4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImxpbmVzX2RyYXdCdWZmZXJzV3JpdGVJbml0XCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBsaW5lc19kcmF3QnVmZmVyc1dyaXRlSW5pdChtYXhEcmF3QnVmZmVycykge1xuICAgICAgICAgICAgdmFyIHN0ciA9ICcnO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGZuID0gbWF4RHJhd0J1ZmZlcnM7IG4gPCBmbjsgbisrKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9ICcnICsgJ2xheW91dChsb2NhdGlvbiA9ICcgKyBuICsgJykgb3V0IHZlYzQgb3V0Q29sJyArIG4gKyAnO1xcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwibGluZXNfZHJhd0J1ZmZlcnNXcml0ZVwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGxpbmVzX2RyYXdCdWZmZXJzV3JpdGVcbiAgICAgICAgICogQHBhcmFtIHtpbnR9IG1heERyYXdCdWZmZXJzXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gbGluZXNfZHJhd0J1ZmZlcnNXcml0ZShtYXhEcmF3QnVmZmVycykge1xuICAgICAgICAgICAgdmFyIHN0ciA9ICcnO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGZuID0gbWF4RHJhd0J1ZmZlcnM7IG4gPCBmbjsgbisrKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9ICcnICsgJ2lmKG91dCcgKyBuICsgJ19mbG9hdCAhPSAtOTk5Ljk5OTg5KSBnbF9GcmFnRGF0YVsnICsgbiArICddID0gdmVjNChvdXQnICsgbiArICdfZmxvYXQsMC4wLDAuMCwxLjApO1xcbicgKyAnIGVsc2UgZ2xfRnJhZ0RhdGFbJyArIG4gKyAnXSA9IG91dCcgKyBuICsgJ19mbG9hdDQ7XFxuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJjaGVja0FyZ05hbWVJbml0aWFsaXphdGlvblwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpblZhbHVlc1xuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gYXJnTmFtZVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uKGluVmFsdWVzLCBhcmdOYW1lKSB7XG4gICAgICAgICAgICBpZiAoaW5WYWx1ZXMuaGFzT3duUHJvcGVydHkoYXJnTmFtZSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgaW5WYWx1ZXNbYXJnTmFtZV0gPSB7XG4gICAgICAgICAgICAgICAgICAgIFwidHlwZVwiOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBcImV4cGVjdGVkTW9kZVwiOiBudWxsLCAvLyBcIkFUVFJJQlVURVwiLCBcIlNBTVBMRVJcIiwgXCJVTklGT1JNXCJcbiAgICAgICAgICAgICAgICAgICAgXCJsb2NhdGlvblwiOiBudWxsIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJnZXRfZ2xvYmFsX2lkM19HTFNMRnVuY3Rpb25TdHJpbmdcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBnZXRfZ2xvYmFsX2lkM19HTFNMRnVuY3Rpb25TdHJpbmdcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRfZ2xvYmFsX2lkM19HTFNMRnVuY3Rpb25TdHJpbmcoKSB7XG4gICAgICAgICAgICByZXR1cm4gJycgKyAndmVjMiBnZXRfZ2xvYmFsX2lkKGZsb2F0IGlkLCBmbG9hdCBidWZmZXJXaWR0aCwgZmxvYXQgZ2VvbWV0cnlMZW5ndGgpIHtcXG4nICsgJ2Zsb2F0IHRleGVsU2l6ZSA9IDEuMC9idWZmZXJXaWR0aDsnICsgJ2Zsb2F0IG51bSA9IChpZCpnZW9tZXRyeUxlbmd0aCkvYnVmZmVyV2lkdGg7JyArICdmbG9hdCBjb2x1bW4gPSBmcmFjdChudW0pKyh0ZXhlbFNpemUvMi4wKTsnICsgJ2Zsb2F0IHJvdyA9IChmbG9vcihudW0pL2J1ZmZlcldpZHRoKSsodGV4ZWxTaXplLzIuMCk7JyArICdyZXR1cm4gdmVjMihjb2x1bW4sIHJvdyk7JyArICd9XFxuJztcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImdldF9nbG9iYWxfaWQyX0dMU0xGdW5jdGlvblN0cmluZ1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGdldF9nbG9iYWxfaWQyX0dMU0xGdW5jdGlvblN0cmluZ1xuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldF9nbG9iYWxfaWQyX0dMU0xGdW5jdGlvblN0cmluZygpIHtcbiAgICAgICAgICAgIHJldHVybiAnJyArICd2ZWMyIGdldF9nbG9iYWxfaWQodmVjMiBpZCwgZmxvYXQgYnVmZmVyV2lkdGgpIHtcXG4nICsgJ2Zsb2F0IHRleGVsU2l6ZSA9IDEuMC9idWZmZXJXaWR0aDsnICsgJ2Zsb2F0IGNvbHVtbiA9IChpZC54L2J1ZmZlcldpZHRoKSsodGV4ZWxTaXplLzIuMCk7JyArICdmbG9hdCByb3cgPSAoaWQueS9idWZmZXJXaWR0aCkrKHRleGVsU2l6ZS8yLjApOycgKyAncmV0dXJuIHZlYzIoY29sdW1uLCByb3cpOycgKyAnfVxcbic7XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gV2ViQ0xHTFV0aWxzO1xufSgpO1xuXG5nbG9iYWwuV2ViQ0xHTFV0aWxzID0gV2ViQ0xHTFV0aWxzO1xubW9kdWxlLmV4cG9ydHMuV2ViQ0xHTFV0aWxzID0gV2ViQ0xHTFV0aWxzOyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5XZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtID0gdW5kZWZpbmVkO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpO1xuXG52YXIgX1dlYkNMR0xVdGlscyA9IHJlcXVpcmUoJy4vV2ViQ0xHTFV0aWxzLmNsYXNzJyk7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbi8qKlxyXG4qIFdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0gT2JqZWN0XHJcbiogQGNsYXNzXHJcbiAqIEBwYXJhbSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbFxyXG4gKiBAcGFyYW0ge1N0cmluZ30gdmVydGV4U291cmNlXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB2ZXJ0ZXhIZWFkZXJcclxuICogQHBhcmFtIHtTdHJpbmd9IGZyYWdtZW50U291cmNlXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBmcmFnbWVudEhlYWRlclxyXG4qL1xudmFyIFdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0gPSBleHBvcnRzLldlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0gPSBmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbShnbCwgdmVydGV4U291cmNlLCB2ZXJ0ZXhIZWFkZXIsIGZyYWdtZW50U291cmNlLCBmcmFnbWVudEhlYWRlcikge1xuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbSk7XG5cbiAgICAgICAgdGhpcy5fZ2wgPSBnbDtcbiAgICAgICAgdmFyIGhpZ2hQcmVjaXNpb25TdXBwb3J0ID0gdGhpcy5fZ2wuZ2V0U2hhZGVyUHJlY2lzaW9uRm9ybWF0KHRoaXMuX2dsLkZSQUdNRU5UX1NIQURFUiwgdGhpcy5fZ2wuSElHSF9GTE9BVCk7XG4gICAgICAgIHRoaXMuX3ByZWNpc2lvbiA9IGhpZ2hQcmVjaXNpb25TdXBwb3J0LnByZWNpc2lvbiAhPT0gMCA/ICdwcmVjaXNpb24gaGlnaHAgZmxvYXQ7XFxuXFxucHJlY2lzaW9uIGhpZ2hwIGludDtcXG5cXG4nIDogJ3ByZWNpc2lvbiBsb3dwIGZsb2F0O1xcblxcbnByZWNpc2lvbiBsb3dwIGludDtcXG5cXG4nO1xuXG4gICAgICAgIHZhciBfZ2xEcmF3QnVmZl9leHQgPSB0aGlzLl9nbC5nZXRFeHRlbnNpb24oXCJXRUJHTF9kcmF3X2J1ZmZlcnNcIik7XG4gICAgICAgIHRoaXMuX21heERyYXdCdWZmZXJzID0gbnVsbDtcbiAgICAgICAgaWYgKF9nbERyYXdCdWZmX2V4dCAhPSBudWxsKSB0aGlzLl9tYXhEcmF3QnVmZmVycyA9IHRoaXMuX2dsLmdldFBhcmFtZXRlcihfZ2xEcmF3QnVmZl9leHQuTUFYX0RSQVdfQlVGRkVSU19XRUJHTCk7XG5cbiAgICAgICAgdGhpcy5uYW1lID0gXCJcIjtcbiAgICAgICAgdGhpcy52aWV3U291cmNlID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5pbl92ZXJ0ZXhfdmFsdWVzID0ge307XG4gICAgICAgIHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzID0ge307XG5cbiAgICAgICAgdGhpcy5fdmVydGV4UF9yZWFkeSA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9mcmFnbWVudFBfcmVhZHkgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLl92ZXJ0ZXhIZWFkID0gbnVsbDtcbiAgICAgICAgdGhpcy5fdmVydGV4U291cmNlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZnJhZ21lbnRIZWFkID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZnJhZ21lbnRTb3VyY2UgPSBudWxsO1xuXG4gICAgICAgIHRoaXMub3V0cHV0ID0gbnVsbDsgLy9TdHJpbmcgb3IgQXJyYXk8U3RyaW5nPiBvZiBhcmcgbmFtZXMgd2l0aCB0aGUgaXRlbXMgaW4gc2FtZSBvcmRlciB0aGF0IGluIHRoZSBmaW5hbCByZXR1cm5cbiAgICAgICAgdGhpcy5vdXRwdXRUZW1wTW9kZXMgPSBudWxsO1xuICAgICAgICB0aGlzLmZCdWZmZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmZCdWZmZXJUZW1wID0gbnVsbDtcblxuICAgICAgICB0aGlzLmRyYXdNb2RlID0gNDtcblxuICAgICAgICBpZiAodmVydGV4U291cmNlICE9PSB1bmRlZmluZWQgJiYgdmVydGV4U291cmNlICE9PSBudWxsKSB0aGlzLnNldFZlcnRleFNvdXJjZSh2ZXJ0ZXhTb3VyY2UsIHZlcnRleEhlYWRlcik7XG5cbiAgICAgICAgaWYgKGZyYWdtZW50U291cmNlICE9PSB1bmRlZmluZWQgJiYgZnJhZ21lbnRTb3VyY2UgIT09IG51bGwpIHRoaXMuc2V0RnJhZ21lbnRTb3VyY2UoZnJhZ21lbnRTb3VyY2UsIGZyYWdtZW50SGVhZGVyKTtcbiAgICB9XG5cbiAgICAvKipcclxuICAgICAqIGNvbXBpbGVWZXJ0ZXhGcmFnbWVudFNvdXJjZVxyXG4gICAgICovXG5cblxuICAgIF9jcmVhdGVDbGFzcyhXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtLCBbe1xuICAgICAgICBrZXk6ICdjb21waWxlVmVydGV4RnJhZ21lbnRTb3VyY2UnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY29tcGlsZVZlcnRleEZyYWdtZW50U291cmNlKCkge1xuICAgICAgICAgICAgdmFyIHNvdXJjZVZlcnRleCA9IFwiXCIgKyB0aGlzLl9wcmVjaXNpb24gKyAndW5pZm9ybSBmbG9hdCB1T2Zmc2V0O1xcbicgKyAndW5pZm9ybSBmbG9hdCB1QnVmZmVyV2lkdGg7JyArIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmxpbmVzX3ZlcnRleF9hdHRycyh0aGlzLmluX3ZlcnRleF92YWx1ZXMpICsgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMudW5wYWNrR0xTTEZ1bmN0aW9uU3RyaW5nKCkgKyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5nZXRfZ2xvYmFsX2lkM19HTFNMRnVuY3Rpb25TdHJpbmcoKSArIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmdldF9nbG9iYWxfaWQyX0dMU0xGdW5jdGlvblN0cmluZygpICsgdGhpcy5fdmVydGV4SGVhZCArICd2b2lkIG1haW4odm9pZCkge1xcbicgKyB0aGlzLl92ZXJ0ZXhTb3VyY2UgKyAnfVxcbic7XG4gICAgICAgICAgICB2YXIgc291cmNlRnJhZ21lbnQgPSAnI2V4dGVuc2lvbiBHTF9FWFRfZHJhd19idWZmZXJzIDogcmVxdWlyZVxcbicgKyB0aGlzLl9wcmVjaXNpb24gKyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5saW5lc19mcmFnbWVudF9hdHRycyh0aGlzLmluX2ZyYWdtZW50X3ZhbHVlcykgKyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5nZXRfZ2xvYmFsX2lkM19HTFNMRnVuY3Rpb25TdHJpbmcoKSArIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmdldF9nbG9iYWxfaWQyX0dMU0xGdW5jdGlvblN0cmluZygpICsgdGhpcy5fZnJhZ21lbnRIZWFkICtcblxuICAgICAgICAgICAgLy9XZWJDTEdMVXRpbHMubGluZXNfZHJhd0J1ZmZlcnNXcml0ZUluaXQoOCkrXG4gICAgICAgICAgICAndm9pZCBtYWluKHZvaWQpIHtcXG4nICsgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMubGluZXNfZHJhd0J1ZmZlcnNJbml0KDgpICsgdGhpcy5fZnJhZ21lbnRTb3VyY2UgKyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5saW5lc19kcmF3QnVmZmVyc1dyaXRlKDgpICsgJ31cXG4nO1xuXG4gICAgICAgICAgICB0aGlzLnZlcnRleEZyYWdtZW50UHJvZ3JhbSA9IHRoaXMuX2dsLmNyZWF0ZVByb2dyYW0oKTtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBuZXcgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMoKS5jcmVhdGVTaGFkZXIodGhpcy5fZ2wsIFwiV0VCQ0xHTCBWRVJURVggRlJBR01FTlQgUFJPR1JBTVwiLCBzb3VyY2VWZXJ0ZXgsIHNvdXJjZUZyYWdtZW50LCB0aGlzLnZlcnRleEZyYWdtZW50UHJvZ3JhbSk7XG5cbiAgICAgICAgICAgIHRoaXMudU9mZnNldCA9IHRoaXMuX2dsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnZlcnRleEZyYWdtZW50UHJvZ3JhbSwgXCJ1T2Zmc2V0XCIpO1xuICAgICAgICAgICAgdGhpcy51QnVmZmVyV2lkdGggPSB0aGlzLl9nbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy52ZXJ0ZXhGcmFnbWVudFByb2dyYW0sIFwidUJ1ZmZlcldpZHRoXCIpO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5pbl92ZXJ0ZXhfdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGV4cGVjdGVkTW9kZSA9IHsgJ2Zsb2F0NF9mcm9tU2FtcGxlcic6IFwiU0FNUExFUlwiLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXRfZnJvbVNhbXBsZXInOiBcIlNBTVBMRVJcIixcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0NF9mcm9tQXR0cic6IFwiQVRUUklCVVRFXCIsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdF9mcm9tQXR0cic6IFwiQVRUUklCVVRFXCIsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdCc6IFwiVU5JRk9STVwiLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXQ0JzogXCJVTklGT1JNXCIsXG4gICAgICAgICAgICAgICAgICAgICdtYXQ0JzogXCJVTklGT1JNXCIgfVt0aGlzLmluX3ZlcnRleF92YWx1ZXNba2V5XS50eXBlXTtcblxuICAgICAgICAgICAgICAgIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uKHRoaXMuaW5fdmVydGV4X3ZhbHVlcywga2V5KTtcbiAgICAgICAgICAgICAgICB2YXIgbG9jID0gZXhwZWN0ZWRNb2RlID09PSBcIkFUVFJJQlVURVwiID8gdGhpcy5fZ2wuZ2V0QXR0cmliTG9jYXRpb24odGhpcy52ZXJ0ZXhGcmFnbWVudFByb2dyYW0sIGtleSkgOiB0aGlzLl9nbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy52ZXJ0ZXhGcmFnbWVudFByb2dyYW0sIGtleS5yZXBsYWNlKC9cXFtcXGQuKi8sIFwiXCIpKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluX3ZlcnRleF92YWx1ZXNba2V5XS5sb2NhdGlvbiA9IFtsb2NdO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5fdmVydGV4X3ZhbHVlc1trZXldLmV4cGVjdGVkTW9kZSA9IGV4cGVjdGVkTW9kZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yICh2YXIgX2tleSBpbiB0aGlzLmluX2ZyYWdtZW50X3ZhbHVlcykge1xuICAgICAgICAgICAgICAgIHZhciBfZXhwZWN0ZWRNb2RlID0geyAnZmxvYXQ0X2Zyb21TYW1wbGVyJzogXCJTQU1QTEVSXCIsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdF9mcm9tU2FtcGxlcic6IFwiU0FNUExFUlwiLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXQnOiBcIlVOSUZPUk1cIixcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0NCc6IFwiVU5JRk9STVwiLFxuICAgICAgICAgICAgICAgICAgICAnbWF0NCc6IFwiVU5JRk9STVwiIH1bdGhpcy5pbl9mcmFnbWVudF92YWx1ZXNbX2tleV0udHlwZV07XG5cbiAgICAgICAgICAgICAgICBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5jaGVja0FyZ05hbWVJbml0aWFsaXphdGlvbih0aGlzLmluX2ZyYWdtZW50X3ZhbHVlcywgX2tleSk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbl9mcmFnbWVudF92YWx1ZXNbX2tleV0ubG9jYXRpb24gPSBbdGhpcy5fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMudmVydGV4RnJhZ21lbnRQcm9ncmFtLCBfa2V5LnJlcGxhY2UoL1xcW1xcZC4qLywgXCJcIikpXTtcbiAgICAgICAgICAgICAgICB0aGlzLmluX2ZyYWdtZW50X3ZhbHVlc1tfa2V5XS5leHBlY3RlZE1vZGUgPSBfZXhwZWN0ZWRNb2RlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gXCJWRVJURVggUFJPR1JBTVxcblwiICsgc291cmNlVmVydGV4ICsgXCJcXG4gRlJBR01FTlQgUFJPR1JBTVxcblwiICsgc291cmNlRnJhZ21lbnQ7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ3NldFZlcnRleFNvdXJjZScsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBVcGRhdGUgdGhlIHZlcnRleCBzb3VyY2VcclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gdmVydGV4U291cmNlXHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IHZlcnRleEhlYWRlclxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gc2V0VmVydGV4U291cmNlKHZlcnRleFNvdXJjZSwgdmVydGV4SGVhZGVyKSB7XG4gICAgICAgICAgICB2YXIgYXJndW1lbnRzU291cmNlID0gdmVydGV4U291cmNlLnNwbGl0KCcpJylbMF0uc3BsaXQoJygnKVsxXS5zcGxpdCgnLCcpOyAvLyBcImZsb2F0KiBBXCIsIFwiZmxvYXQqIEJcIiwgXCJmbG9hdCBDXCIsIFwiZmxvYXQ0KiBEXCJcblxuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGYgPSBhcmd1bWVudHNTb3VyY2UubGVuZ3RoOyBuIDwgZjsgbisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvXFwqYXR0ci9nbSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFyZ05hbWUgPSBhcmd1bWVudHNTb3VyY2Vbbl0uc3BsaXQoJyphdHRyJylbMV0udHJpbSgpO1xuICAgICAgICAgICAgICAgICAgICBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5jaGVja0FyZ05hbWVJbml0aWFsaXphdGlvbih0aGlzLmluX3ZlcnRleF92YWx1ZXMsIGFyZ05hbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0NC9nbSkgIT0gbnVsbCkgdGhpcy5pbl92ZXJ0ZXhfdmFsdWVzW2FyZ05hbWVdLnR5cGUgPSAnZmxvYXQ0X2Zyb21BdHRyJztlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0L2dtKSAhPSBudWxsKSB0aGlzLmluX3ZlcnRleF92YWx1ZXNbYXJnTmFtZV0udHlwZSA9ICdmbG9hdF9mcm9tQXR0cic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL1xcKi9nbSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIF9hcmdOYW1lID0gYXJndW1lbnRzU291cmNlW25dLnNwbGl0KCcqJylbMV0udHJpbSgpO1xuICAgICAgICAgICAgICAgICAgICBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5jaGVja0FyZ05hbWVJbml0aWFsaXphdGlvbih0aGlzLmluX3ZlcnRleF92YWx1ZXMsIF9hcmdOYW1lKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9mbG9hdDQvZ20pICE9IG51bGwpIHRoaXMuaW5fdmVydGV4X3ZhbHVlc1tfYXJnTmFtZV0udHlwZSA9ICdmbG9hdDRfZnJvbVNhbXBsZXInO2Vsc2UgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvZmxvYXQvZ20pICE9IG51bGwpIHRoaXMuaW5fdmVydGV4X3ZhbHVlc1tfYXJnTmFtZV0udHlwZSA9ICdmbG9hdF9mcm9tU2FtcGxlcic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0gIT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIF9hcmdOYW1lMiA9IGFyZ3VtZW50c1NvdXJjZVtuXS5zcGxpdCgnICcpWzFdLnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuaW5fdmVydGV4X3ZhbHVlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleS5yZXBsYWNlKC9cXFtcXGQuKi8sIFwiXCIpID09PSBfYXJnTmFtZTIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfYXJnTmFtZTIgPSBrZXk7IC8vIGZvciBub3JtYWwgdW5pZm9ybSBhcnJheXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uKHRoaXMuaW5fdmVydGV4X3ZhbHVlcywgX2FyZ05hbWUyKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9mbG9hdDQvZ20pICE9IG51bGwpIHRoaXMuaW5fdmVydGV4X3ZhbHVlc1tfYXJnTmFtZTJdLnR5cGUgPSAnZmxvYXQ0JztlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0L2dtKSAhPSBudWxsKSB0aGlzLmluX3ZlcnRleF92YWx1ZXNbX2FyZ05hbWUyXS50eXBlID0gJ2Zsb2F0JztlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL21hdDQvZ20pICE9IG51bGwpIHRoaXMuaW5fdmVydGV4X3ZhbHVlc1tfYXJnTmFtZTJdLnR5cGUgPSAnbWF0NCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBwYXJzZSBoZWFkZXJcbiAgICAgICAgICAgIHRoaXMuX3ZlcnRleEhlYWQgPSB2ZXJ0ZXhIZWFkZXIgIT09IHVuZGVmaW5lZCAmJiB2ZXJ0ZXhIZWFkZXIgIT09IG51bGwgPyB2ZXJ0ZXhIZWFkZXIgOiAnJztcbiAgICAgICAgICAgIHRoaXMuX3ZlcnRleEhlYWQgPSB0aGlzLl92ZXJ0ZXhIZWFkLnJlcGxhY2UoL1xcclxcbi9naSwgJycpLnJlcGxhY2UoL1xcci9naSwgJycpLnJlcGxhY2UoL1xcbi9naSwgJycpO1xuICAgICAgICAgICAgdGhpcy5fdmVydGV4SGVhZCA9IF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLnBhcnNlU291cmNlKHRoaXMuX3ZlcnRleEhlYWQsIHRoaXMuaW5fdmVydGV4X3ZhbHVlcyk7XG5cbiAgICAgICAgICAgIC8vIHBhcnNlIHNvdXJjZVxuICAgICAgICAgICAgdGhpcy5fdmVydGV4U291cmNlID0gdmVydGV4U291cmNlLnJlcGxhY2UoL1xcclxcbi9naSwgJycpLnJlcGxhY2UoL1xcci9naSwgJycpLnJlcGxhY2UoL1xcbi9naSwgJycpO1xuICAgICAgICAgICAgdGhpcy5fdmVydGV4U291cmNlID0gdGhpcy5fdmVydGV4U291cmNlLnJlcGxhY2UoL15cXHcqIFxcdypcXChbXFx3XFxzXFwqLF0qXFwpIHsvZ2ksICcnKS5yZXBsYWNlKC99KFxcc3xcXHQpKiQvZ2ksICcnKTtcbiAgICAgICAgICAgIHRoaXMuX3ZlcnRleFNvdXJjZSA9IF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLnBhcnNlU291cmNlKHRoaXMuX3ZlcnRleFNvdXJjZSwgdGhpcy5pbl92ZXJ0ZXhfdmFsdWVzKTtcblxuICAgICAgICAgICAgdGhpcy5fdmVydGV4UF9yZWFkeSA9IHRydWU7XG4gICAgICAgICAgICBpZiAodGhpcy5fZnJhZ21lbnRQX3JlYWR5ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRzID0gdGhpcy5jb21waWxlVmVydGV4RnJhZ21lbnRTb3VyY2UoKTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnZpZXdTb3VyY2UgPT09IHRydWUpIGNvbnNvbGUubG9nKCclYyBWRlA6ICcgKyB0aGlzLm5hbWUsICdmb250LXNpemU6IDIwcHg7IGNvbG9yOiBncmVlbicpLCBjb25zb2xlLmxvZygnJWMgV0VCQ0xHTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScsICdjb2xvcjogZ3JheScpLCBjb25zb2xlLmxvZygnJWMgJyArIHZlcnRleEhlYWRlciArIHZlcnRleFNvdXJjZSwgJ2NvbG9yOiBncmF5JyksIGNvbnNvbGUubG9nKCclYyBUUkFOU0xBVEVEIFdFQkdMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScsICdjb2xvcjogZGFya2dyYXknKSwgY29uc29sZS5sb2coJyVjICcgKyB0cywgJ2NvbG9yOiBkYXJrZ3JheScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdzZXRGcmFnbWVudFNvdXJjZScsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBVcGRhdGUgdGhlIGZyYWdtZW50IHNvdXJjZVxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBmcmFnbWVudFNvdXJjZVxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBmcmFnbWVudEhlYWRlclxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gc2V0RnJhZ21lbnRTb3VyY2UoZnJhZ21lbnRTb3VyY2UsIGZyYWdtZW50SGVhZGVyKSB7XG4gICAgICAgICAgICB2YXIgYXJndW1lbnRzU291cmNlID0gZnJhZ21lbnRTb3VyY2Uuc3BsaXQoJyknKVswXS5zcGxpdCgnKCcpWzFdLnNwbGl0KCcsJyk7IC8vIFwiZmxvYXQqIEFcIiwgXCJmbG9hdCogQlwiLCBcImZsb2F0IENcIiwgXCJmbG9hdDQqIERcIlxuXG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMCwgZiA9IGFyZ3VtZW50c1NvdXJjZS5sZW5ndGg7IG4gPCBmOyBuKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9cXCovZ20pICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcmdOYW1lID0gYXJndW1lbnRzU291cmNlW25dLnNwbGl0KCcqJylbMV0udHJpbSgpO1xuICAgICAgICAgICAgICAgICAgICBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5jaGVja0FyZ05hbWVJbml0aWFsaXphdGlvbih0aGlzLmluX2ZyYWdtZW50X3ZhbHVlcywgYXJnTmFtZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvZmxvYXQ0L2dtKSAhPSBudWxsKSB0aGlzLmluX2ZyYWdtZW50X3ZhbHVlc1thcmdOYW1lXS50eXBlID0gJ2Zsb2F0NF9mcm9tU2FtcGxlcic7ZWxzZSBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9mbG9hdC9nbSkgIT0gbnVsbCkgdGhpcy5pbl9mcmFnbWVudF92YWx1ZXNbYXJnTmFtZV0udHlwZSA9ICdmbG9hdF9mcm9tU2FtcGxlcic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0gIT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIF9hcmdOYW1lMyA9IGFyZ3VtZW50c1NvdXJjZVtuXS5zcGxpdCgnICcpWzFdLnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5LnJlcGxhY2UoL1xcW1xcZC4qLywgXCJcIikgPT09IF9hcmdOYW1lMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9hcmdOYW1lMyA9IGtleTsgLy8gZm9yIG5vcm1hbCB1bmlmb3JtIGFycmF5c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuY2hlY2tBcmdOYW1lSW5pdGlhbGl6YXRpb24odGhpcy5pbl9mcmFnbWVudF92YWx1ZXMsIF9hcmdOYW1lMyk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvZmxvYXQ0L2dtKSAhPSBudWxsKSB0aGlzLmluX2ZyYWdtZW50X3ZhbHVlc1tfYXJnTmFtZTNdLnR5cGUgPSAnZmxvYXQ0JztlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0L2dtKSAhPSBudWxsKSB0aGlzLmluX2ZyYWdtZW50X3ZhbHVlc1tfYXJnTmFtZTNdLnR5cGUgPSAnZmxvYXQnO2Vsc2UgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvbWF0NC9nbSkgIT0gbnVsbCkgdGhpcy5pbl9mcmFnbWVudF92YWx1ZXNbX2FyZ05hbWUzXS50eXBlID0gJ21hdDQnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gcGFyc2UgaGVhZGVyXG4gICAgICAgICAgICB0aGlzLl9mcmFnbWVudEhlYWQgPSBmcmFnbWVudEhlYWRlciAhPT0gdW5kZWZpbmVkICYmIGZyYWdtZW50SGVhZGVyICE9PSBudWxsID8gZnJhZ21lbnRIZWFkZXIgOiAnJztcbiAgICAgICAgICAgIHRoaXMuX2ZyYWdtZW50SGVhZCA9IHRoaXMuX2ZyYWdtZW50SGVhZC5yZXBsYWNlKC9cXHJcXG4vZ2ksICcnKS5yZXBsYWNlKC9cXHIvZ2ksICcnKS5yZXBsYWNlKC9cXG4vZ2ksICcnKTtcbiAgICAgICAgICAgIHRoaXMuX2ZyYWdtZW50SGVhZCA9IF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLnBhcnNlU291cmNlKHRoaXMuX2ZyYWdtZW50SGVhZCwgdGhpcy5pbl9mcmFnbWVudF92YWx1ZXMpO1xuXG4gICAgICAgICAgICAvLyBwYXJzZSBzb3VyY2VcbiAgICAgICAgICAgIHRoaXMuX2ZyYWdtZW50U291cmNlID0gZnJhZ21lbnRTb3VyY2UucmVwbGFjZSgvXFxyXFxuL2dpLCAnJykucmVwbGFjZSgvXFxyL2dpLCAnJykucmVwbGFjZSgvXFxuL2dpLCAnJyk7XG4gICAgICAgICAgICB0aGlzLl9mcmFnbWVudFNvdXJjZSA9IHRoaXMuX2ZyYWdtZW50U291cmNlLnJlcGxhY2UoL15cXHcqIFxcdypcXChbXFx3XFxzXFwqLF0qXFwpIHsvZ2ksICcnKS5yZXBsYWNlKC99KFxcc3xcXHQpKiQvZ2ksICcnKTtcbiAgICAgICAgICAgIHRoaXMuX2ZyYWdtZW50U291cmNlID0gX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMucGFyc2VTb3VyY2UodGhpcy5fZnJhZ21lbnRTb3VyY2UsIHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzKTtcblxuICAgICAgICAgICAgdGhpcy5fZnJhZ21lbnRQX3JlYWR5ID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICh0aGlzLl92ZXJ0ZXhQX3JlYWR5ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRzID0gdGhpcy5jb21waWxlVmVydGV4RnJhZ21lbnRTb3VyY2UoKTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnZpZXdTb3VyY2UgPT09IHRydWUpIGNvbnNvbGUubG9nKCclYyBWRlA6ICcsICdmb250LXNpemU6IDIwcHg7IGNvbG9yOiBncmVlbicpLCBjb25zb2xlLmxvZygnJWMgV0VCQ0xHTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScsICdjb2xvcjogZ3JheScpLCBjb25zb2xlLmxvZygnJWMgJyArIGZyYWdtZW50SGVhZGVyICsgZnJhZ21lbnRTb3VyY2UsICdjb2xvcjogZ3JheScpLCBjb25zb2xlLmxvZygnJWMgVFJBTlNMQVRFRCBXRUJHTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nLCAnY29sb3I6IGRhcmtncmF5JyksIGNvbnNvbGUubG9nKCclYyAnICsgdHMsICdjb2xvcjogZGFya2dyYXknKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtO1xufSgpO1xuXG5nbG9iYWwuV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbSA9IFdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW07XG5tb2R1bGUuZXhwb3J0cy5XZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtID0gV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbTsiXX0=
