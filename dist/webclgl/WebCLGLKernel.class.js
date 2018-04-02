(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.WebCLGLKernel = undefined;

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
* WebCLGLKernel Object
* @class
 * @param {WebGLRenderingContext} gl
 * @param {String} source
 * @param {String} header
*/
var WebCLGLKernel = exports.WebCLGLKernel = function () {
    function WebCLGLKernel(gl, source, header) {
        _classCallCheck(this, WebCLGLKernel);

        this._gl = gl;
        var highPrecisionSupport = this._gl.getShaderPrecisionFormat(this._gl.FRAGMENT_SHADER, this._gl.HIGH_FLOAT);
        this._precision = highPrecisionSupport.precision !== 0 ? 'precision highp float;\n\nprecision highp int;\n\n' : 'precision lowp float;\n\nprecision lowp int;\n\n';

        var _glDrawBuff_ext = this._gl.getExtension("WEBGL_draw_buffers");
        this._maxDrawBuffers = null;
        if (_glDrawBuff_ext != null) this._maxDrawBuffers = this._gl.getParameter(_glDrawBuff_ext.MAX_DRAW_BUFFERS_WEBGL);

        this.name = "";
        this.enabled = true;

        this.depthTest = null;
        this.blend = null;
        this.blendSrcMode = null;
        this.blendDstMode = null;
        this.blendEquation = null;
        this.onpre = null;
        this.onpost = null;
        this.viewSource = false;

        this.in_values = {};

        this.output = null; //String or Array<String> of arg names with the items in same order that in the final return
        this.outputTempModes = null;
        this.fBuffer = null;
        this.fBufferTemp = null;
        this.fBufferLength = 0;
        this.fBufferCount = 0;

        if (source !== undefined && source !== null) this.setKernelSource(source, header);
    }

    /**
     * Update the kernel source
     * @param {String} source
     * @param {String} [header=undefined] Additional functions
     */

    _createClass(WebCLGLKernel, [{
        key: 'setKernelSource',
        value: function setKernelSource(source, header) {
            var compile = function () {
                var sourceVertex = "" + this._precision + 'attribute vec3 aVertexPosition;\n' + 'varying vec2 global_id;\n' + 'void main(void) {\n' + 'gl_Position = vec4(aVertexPosition, 1.0);\n' + 'global_id = aVertexPosition.xy*0.5+0.5;\n' + '}\n';
                var sourceFragment = '#extension GL_EXT_draw_buffers : require\n' + this._precision + _WebCLGLUtils.WebCLGLUtils.lines_fragment_attrs(this.in_values) + 'varying vec2 global_id;\n' + 'uniform float uBufferWidth;' + 'vec2 get_global_id() {\n' + 'return global_id;\n' + '}\n' + _WebCLGLUtils.WebCLGLUtils.get_global_id3_GLSLFunctionString() + _WebCLGLUtils.WebCLGLUtils.get_global_id2_GLSLFunctionString() + this._head +

                //WebCLGLUtils.lines_drawBuffersWriteInit(8)+
                'void main(void) {\n' + _WebCLGLUtils.WebCLGLUtils.lines_drawBuffersInit(8) + this._source + _WebCLGLUtils.WebCLGLUtils.lines_drawBuffersWrite(8) + '}\n';

                this.kernel = this._gl.createProgram();
                var result = new _WebCLGLUtils.WebCLGLUtils().createShader(this._gl, "WEBCLGL", sourceVertex, sourceFragment, this.kernel);

                this.attr_VertexPos = this._gl.getAttribLocation(this.kernel, "aVertexPosition");

                this.uBufferWidth = this._gl.getUniformLocation(this.kernel, "uBufferWidth");

                for (var key in this.in_values) {
                    var expectedMode = { 'float4_fromSampler': "SAMPLER",
                        'float_fromSampler': "SAMPLER",
                        'float': "UNIFORM",
                        'float4': "UNIFORM",
                        'mat4': "UNIFORM" }[this.in_values[key].type];

                    _WebCLGLUtils.WebCLGLUtils.checkArgNameInitialization(this.in_values, key);
                    this.in_values[key].location = [this._gl.getUniformLocation(this.kernel, key.replace(/\[\d.*/, ""))];
                    this.in_values[key].expectedMode = expectedMode;
                }

                return "VERTEX PROGRAM\n" + sourceVertex + "\n FRAGMENT PROGRAM\n" + sourceFragment;
            }.bind(this);

            var argumentsSource = source.split(')')[0].split('(')[1].split(','); // "float* A", "float* B", "float C", "float4* D"

            for (var n = 0, f = argumentsSource.length; n < f; n++) {
                if (argumentsSource[n].match(/\*/gm) !== null) {
                    var argName = argumentsSource[n].split('*')[1].trim();
                    _WebCLGLUtils.WebCLGLUtils.checkArgNameInitialization(this.in_values, argName);

                    if (argumentsSource[n].match(/float4/gm) != null) this.in_values[argName].type = 'float4_fromSampler';else if (argumentsSource[n].match(/float/gm) != null) this.in_values[argName].type = 'float_fromSampler';
                } else if (argumentsSource[n] !== "") {
                    var _argName = argumentsSource[n].split(' ')[1].trim();
                    for (var key in this.in_values) {
                        if (key.replace(/\[\d.*/, "") === _argName) {
                            _argName = key; // for normal uniform arrays
                            break;
                        }
                    }

                    _WebCLGLUtils.WebCLGLUtils.checkArgNameInitialization(this.in_values, _argName);

                    if (argumentsSource[n].match(/float4/gm) != null) this.in_values[_argName].type = 'float4';else if (argumentsSource[n].match(/float/gm) != null) this.in_values[_argName].type = 'float';else if (argumentsSource[n].match(/mat4/gm) != null) this.in_values[_argName].type = 'mat4';
                }
            }

            // parse header
            this._head = header !== undefined && header !== null ? header : '';
            this._head = this._head.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
            this._head = _WebCLGLUtils.WebCLGLUtils.parseSource(this._head, this.in_values);

            // parse source
            this._source = source.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
            this._source = this._source.replace(/^\w* \w*\([\w\s\*,]*\) {/gi, '').replace(/}(\s|\t)*$/gi, '');
            this._source = _WebCLGLUtils.WebCLGLUtils.parseSource(this._source, this.in_values);

            var ts = compile();

            if (this.viewSource === true) console.log('%c KERNEL: ' + this.name, 'font-size: 20px; color: blue'), console.log('%c WEBCLGL --------------------------------', 'color: gray'), console.log('%c ' + header + source, 'color: gray'), console.log('%c TRANSLATED WEBGL ------------------------------', 'color: darkgray'), console.log('%c ' + ts, 'color: darkgray');
        }
    }]);

    return WebCLGLKernel;
}();

global.WebCLGLKernel = WebCLGLKernel;
module.exports.WebCLGLKernel = WebCLGLKernel;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./WebCLGLUtils.class":2}],2:[function(require,module,exports){
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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvd2ViY2xnbC9XZWJDTEdMS2VybmVsLmNsYXNzLmpzIiwic3JjL3dlYmNsZ2wvV2ViQ0xHTFV0aWxzLmNsYXNzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBOztBQUVBLE9BQU8sY0FBUCxDQUFzQixPQUF0QixFQUErQixZQUEvQixFQUE2QztBQUN6QyxXQUFPO0FBRGtDLENBQTdDO0FBR0EsUUFBUSxhQUFSLEdBQXdCLFNBQXhCOztBQUVBLElBQUksZUFBZSxZQUFZO0FBQUUsYUFBUyxnQkFBVCxDQUEwQixNQUExQixFQUFrQyxLQUFsQyxFQUF5QztBQUFFLGFBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxNQUFNLE1BQTFCLEVBQWtDLEdBQWxDLEVBQXVDO0FBQUUsZ0JBQUksYUFBYSxNQUFNLENBQU4sQ0FBakIsQ0FBMkIsV0FBVyxVQUFYLEdBQXdCLFdBQVcsVUFBWCxJQUF5QixLQUFqRCxDQUF3RCxXQUFXLFlBQVgsR0FBMEIsSUFBMUIsQ0FBZ0MsSUFBSSxXQUFXLFVBQWYsRUFBMkIsV0FBVyxRQUFYLEdBQXNCLElBQXRCLENBQTRCLE9BQU8sY0FBUCxDQUFzQixNQUF0QixFQUE4QixXQUFXLEdBQXpDLEVBQThDLFVBQTlDO0FBQTREO0FBQUUsS0FBQyxPQUFPLFVBQVUsV0FBVixFQUF1QixVQUF2QixFQUFtQyxXQUFuQyxFQUFnRDtBQUFFLFlBQUksVUFBSixFQUFnQixpQkFBaUIsWUFBWSxTQUE3QixFQUF3QyxVQUF4QyxFQUFxRCxJQUFJLFdBQUosRUFBaUIsaUJBQWlCLFdBQWpCLEVBQThCLFdBQTlCLEVBQTRDLE9BQU8sV0FBUDtBQUFxQixLQUFoTjtBQUFtTixDQUE5aEIsRUFBbkI7O0FBRUEsSUFBSSxnQkFBZ0IsUUFBUSxzQkFBUixDQUFwQjs7QUFFQSxTQUFTLGVBQVQsQ0FBeUIsUUFBekIsRUFBbUMsV0FBbkMsRUFBZ0Q7QUFB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Q0o7QUFoQkYsS0F6UEMsRUEwUUQ7QUFDQyxhQUFLLG1DQUROOztBQUlDOzs7QUFHQSxlQUFPLFNBQVMsaUNBQVQsR0FBNkM7QUFDaEQsbUJBQU8sS0FBSywyRUFBTCxHQUFtRixvQ0FBbkYsR0FBMEgsOENBQTFILEdBQTJLLDRDQUEzSyxHQUEwTix1REFBMU4sR0FBb1IsMkJBQXBSLEdBQWtULEtBQXpUO0FBQ0g7QUFURixLQTFRQyxFQW9SRDtBQUNDLGFBQUssbUNBRE47O0FBSUM7OztBQUdBLGVBQU8sU0FBUyxpQ0FBVCxHQUE2QztBQUNoRCxtQkFBTyxLQUFLLG9EQUFMLEdBQTRELG9DQUE1RCxHQUFtRyxvREFBbkcsR0FBMEosaURBQTFKLEdBQThNLDJCQUE5TSxHQUE0TyxLQUFuUDtBQUNIO0FBVEYsS0FwUkMsQ0FySUo7O0FBcWFBLFdBQU8sWUFBUDtBQUNILENBaGJ5QyxFQUExQzs7QUFrYkEsT0FBTyxZQUFQLEdBQXNCLFlBQXRCO0FBQ0EsT0FBTyxPQUFQLENBQWUsWUFBZixHQUE4QixZQUE5QiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9cmV0dXJuIGV9KSgpIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLldlYkNMR0xLZXJuZWwgPSB1bmRlZmluZWQ7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KCk7XG5cbnZhciBfV2ViQ0xHTFV0aWxzID0gcmVxdWlyZSgnLi9XZWJDTEdMVXRpbHMuY2xhc3MnKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuLyoqXHJcbiogV2ViQ0xHTEtlcm5lbCBPYmplY3RcclxuKiBAY2xhc3NcclxuICogQHBhcmFtIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGdsXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBzb3VyY2VcclxuICogQHBhcmFtIHtTdHJpbmd9IGhlYWRlclxyXG4qL1xudmFyIFdlYkNMR0xLZXJuZWwgPSBleHBvcnRzLldlYkNMR0xLZXJuZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gV2ViQ0xHTEtlcm5lbChnbCwgc291cmNlLCBoZWFkZXIpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFdlYkNMR0xLZXJuZWwpO1xuXG4gICAgICAgIHRoaXMuX2dsID0gZ2w7XG4gICAgICAgIHZhciBoaWdoUHJlY2lzaW9uU3VwcG9ydCA9IHRoaXMuX2dsLmdldFNoYWRlclByZWNpc2lvbkZvcm1hdCh0aGlzLl9nbC5GUkFHTUVOVF9TSEFERVIsIHRoaXMuX2dsLkhJR0hfRkxPQVQpO1xuICAgICAgICB0aGlzLl9wcmVjaXNpb24gPSBoaWdoUHJlY2lzaW9uU3VwcG9ydC5wcmVjaXNpb24gIT09IDAgPyAncHJlY2lzaW9uIGhpZ2hwIGZsb2F0O1xcblxcbnByZWNpc2lvbiBoaWdocCBpbnQ7XFxuXFxuJyA6ICdwcmVjaXNpb24gbG93cCBmbG9hdDtcXG5cXG5wcmVjaXNpb24gbG93cCBpbnQ7XFxuXFxuJztcblxuICAgICAgICB2YXIgX2dsRHJhd0J1ZmZfZXh0ID0gdGhpcy5fZ2wuZ2V0RXh0ZW5zaW9uKFwiV0VCR0xfZHJhd19idWZmZXJzXCIpO1xuICAgICAgICB0aGlzLl9tYXhEcmF3QnVmZmVycyA9IG51bGw7XG4gICAgICAgIGlmIChfZ2xEcmF3QnVmZl9leHQgIT0gbnVsbCkgdGhpcy5fbWF4RHJhd0J1ZmZlcnMgPSB0aGlzLl9nbC5nZXRQYXJhbWV0ZXIoX2dsRHJhd0J1ZmZfZXh0Lk1BWF9EUkFXX0JVRkZFUlNfV0VCR0wpO1xuXG4gICAgICAgIHRoaXMubmFtZSA9IFwiXCI7XG4gICAgICAgIHRoaXMuZW5hYmxlZCA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5kZXB0aFRlc3QgPSBudWxsO1xuICAgICAgICB0aGlzLmJsZW5kID0gbnVsbDtcbiAgICAgICAgdGhpcy5ibGVuZFNyY01vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLmJsZW5kRHN0TW9kZSA9IG51bGw7XG4gICAgICAgIHRoaXMuYmxlbmRFcXVhdGlvbiA9IG51bGw7XG4gICAgICAgIHRoaXMub25wcmUgPSBudWxsO1xuICAgICAgICB0aGlzLm9ucG9zdCA9IG51bGw7XG4gICAgICAgIHRoaXMudmlld1NvdXJjZSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuaW5fdmFsdWVzID0ge307XG5cbiAgICAgICAgdGhpcy5vdXRwdXQgPSBudWxsOyAvL1N0cmluZyBvciBBcnJheTxTdHJpbmc+IG9mIGFyZyBuYW1lcyB3aXRoIHRoZSBpdGVtcyBpbiBzYW1lIG9yZGVyIHRoYXQgaW4gdGhlIGZpbmFsIHJldHVyblxuICAgICAgICB0aGlzLm91dHB1dFRlbXBNb2RlcyA9IG51bGw7XG4gICAgICAgIHRoaXMuZkJ1ZmZlciA9IG51bGw7XG4gICAgICAgIHRoaXMuZkJ1ZmZlclRlbXAgPSBudWxsO1xuICAgICAgICB0aGlzLmZCdWZmZXJMZW5ndGggPSAwO1xuICAgICAgICB0aGlzLmZCdWZmZXJDb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHNvdXJjZSAhPT0gdW5kZWZpbmVkICYmIHNvdXJjZSAhPT0gbnVsbCkgdGhpcy5zZXRLZXJuZWxTb3VyY2Uoc291cmNlLCBoZWFkZXIpO1xuICAgIH1cblxuICAgIC8qKlxyXG4gICAgICogVXBkYXRlIHRoZSBrZXJuZWwgc291cmNlXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc291cmNlXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gW2hlYWRlcj11bmRlZmluZWRdIEFkZGl0aW9uYWwgZnVuY3Rpb25zXHJcbiAgICAgKi9cblxuXG4gICAgX2NyZWF0ZUNsYXNzKFdlYkNMR0xLZXJuZWwsIFt7XG4gICAgICAgIGtleTogJ3NldEtlcm5lbFNvdXJjZScsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRLZXJuZWxTb3VyY2Uoc291cmNlLCBoZWFkZXIpIHtcbiAgICAgICAgICAgIHZhciBjb21waWxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBzb3VyY2VWZXJ0ZXggPSBcIlwiICsgdGhpcy5fcHJlY2lzaW9uICsgJ2F0dHJpYnV0ZSB2ZWMzIGFWZXJ0ZXhQb3NpdGlvbjtcXG4nICsgJ3ZhcnlpbmcgdmVjMiBnbG9iYWxfaWQ7XFxuJyArICd2b2lkIG1haW4odm9pZCkge1xcbicgKyAnZ2xfUG9zaXRpb24gPSB2ZWM0KGFWZXJ0ZXhQb3NpdGlvbiwgMS4wKTtcXG4nICsgJ2dsb2JhbF9pZCA9IGFWZXJ0ZXhQb3NpdGlvbi54eSowLjUrMC41O1xcbicgKyAnfVxcbic7XG4gICAgICAgICAgICAgICAgdmFyIHNvdXJjZUZyYWdtZW50ID0gJyNleHRlbnNpb24gR0xfRVhUX2RyYXdfYnVmZmVycyA6IHJlcXVpcmVcXG4nICsgdGhpcy5fcHJlY2lzaW9uICsgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMubGluZXNfZnJhZ21lbnRfYXR0cnModGhpcy5pbl92YWx1ZXMpICsgJ3ZhcnlpbmcgdmVjMiBnbG9iYWxfaWQ7XFxuJyArICd1bmlmb3JtIGZsb2F0IHVCdWZmZXJXaWR0aDsnICsgJ3ZlYzIgZ2V0X2dsb2JhbF9pZCgpIHtcXG4nICsgJ3JldHVybiBnbG9iYWxfaWQ7XFxuJyArICd9XFxuJyArIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmdldF9nbG9iYWxfaWQzX0dMU0xGdW5jdGlvblN0cmluZygpICsgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuZ2V0X2dsb2JhbF9pZDJfR0xTTEZ1bmN0aW9uU3RyaW5nKCkgKyB0aGlzLl9oZWFkICtcblxuICAgICAgICAgICAgICAgIC8vV2ViQ0xHTFV0aWxzLmxpbmVzX2RyYXdCdWZmZXJzV3JpdGVJbml0KDgpK1xuICAgICAgICAgICAgICAgICd2b2lkIG1haW4odm9pZCkge1xcbicgKyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5saW5lc19kcmF3QnVmZmVyc0luaXQoOCkgKyB0aGlzLl9zb3VyY2UgKyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5saW5lc19kcmF3QnVmZmVyc1dyaXRlKDgpICsgJ31cXG4nO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5rZXJuZWwgPSB0aGlzLl9nbC5jcmVhdGVQcm9ncmFtKCk7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscygpLmNyZWF0ZVNoYWRlcih0aGlzLl9nbCwgXCJXRUJDTEdMXCIsIHNvdXJjZVZlcnRleCwgc291cmNlRnJhZ21lbnQsIHRoaXMua2VybmVsKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuYXR0cl9WZXJ0ZXhQb3MgPSB0aGlzLl9nbC5nZXRBdHRyaWJMb2NhdGlvbih0aGlzLmtlcm5lbCwgXCJhVmVydGV4UG9zaXRpb25cIik7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnVCdWZmZXJXaWR0aCA9IHRoaXMuX2dsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLmtlcm5lbCwgXCJ1QnVmZmVyV2lkdGhcIik7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5pbl92YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGV4cGVjdGVkTW9kZSA9IHsgJ2Zsb2F0NF9mcm9tU2FtcGxlcic6IFwiU0FNUExFUlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0X2Zyb21TYW1wbGVyJzogXCJTQU1QTEVSXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAnZmxvYXQnOiBcIlVOSUZPUk1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICdmbG9hdDQnOiBcIlVOSUZPUk1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICdtYXQ0JzogXCJVTklGT1JNXCIgfVt0aGlzLmluX3ZhbHVlc1trZXldLnR5cGVdO1xuXG4gICAgICAgICAgICAgICAgICAgIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uKHRoaXMuaW5fdmFsdWVzLCBrZXkpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmluX3ZhbHVlc1trZXldLmxvY2F0aW9uID0gW3RoaXMuX2dsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLmtlcm5lbCwga2V5LnJlcGxhY2UoL1xcW1xcZC4qLywgXCJcIikpXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbl92YWx1ZXNba2V5XS5leHBlY3RlZE1vZGUgPSBleHBlY3RlZE1vZGU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiVkVSVEVYIFBST0dSQU1cXG5cIiArIHNvdXJjZVZlcnRleCArIFwiXFxuIEZSQUdNRU5UIFBST0dSQU1cXG5cIiArIHNvdXJjZUZyYWdtZW50O1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgICAgICB2YXIgYXJndW1lbnRzU291cmNlID0gc291cmNlLnNwbGl0KCcpJylbMF0uc3BsaXQoJygnKVsxXS5zcGxpdCgnLCcpOyAvLyBcImZsb2F0KiBBXCIsIFwiZmxvYXQqIEJcIiwgXCJmbG9hdCBDXCIsIFwiZmxvYXQ0KiBEXCJcblxuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGYgPSBhcmd1bWVudHNTb3VyY2UubGVuZ3RoOyBuIDwgZjsgbisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvXFwqL2dtKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJnTmFtZSA9IGFyZ3VtZW50c1NvdXJjZVtuXS5zcGxpdCgnKicpWzFdLnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuY2hlY2tBcmdOYW1lSW5pdGlhbGl6YXRpb24odGhpcy5pbl92YWx1ZXMsIGFyZ05hbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0NC9nbSkgIT0gbnVsbCkgdGhpcy5pbl92YWx1ZXNbYXJnTmFtZV0udHlwZSA9ICdmbG9hdDRfZnJvbVNhbXBsZXInO2Vsc2UgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvZmxvYXQvZ20pICE9IG51bGwpIHRoaXMuaW5fdmFsdWVzW2FyZ05hbWVdLnR5cGUgPSAnZmxvYXRfZnJvbVNhbXBsZXInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzU291cmNlW25dICE9PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfYXJnTmFtZSA9IGFyZ3VtZW50c1NvdXJjZVtuXS5zcGxpdCgnICcpWzFdLnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuaW5fdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5LnJlcGxhY2UoL1xcW1xcZC4qLywgXCJcIikgPT09IF9hcmdOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2FyZ05hbWUgPSBrZXk7IC8vIGZvciBub3JtYWwgdW5pZm9ybSBhcnJheXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uKHRoaXMuaW5fdmFsdWVzLCBfYXJnTmFtZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvZmxvYXQ0L2dtKSAhPSBudWxsKSB0aGlzLmluX3ZhbHVlc1tfYXJnTmFtZV0udHlwZSA9ICdmbG9hdDQnO2Vsc2UgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvZmxvYXQvZ20pICE9IG51bGwpIHRoaXMuaW5fdmFsdWVzW19hcmdOYW1lXS50eXBlID0gJ2Zsb2F0JztlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL21hdDQvZ20pICE9IG51bGwpIHRoaXMuaW5fdmFsdWVzW19hcmdOYW1lXS50eXBlID0gJ21hdDQnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gcGFyc2UgaGVhZGVyXG4gICAgICAgICAgICB0aGlzLl9oZWFkID0gaGVhZGVyICE9PSB1bmRlZmluZWQgJiYgaGVhZGVyICE9PSBudWxsID8gaGVhZGVyIDogJyc7XG4gICAgICAgICAgICB0aGlzLl9oZWFkID0gdGhpcy5faGVhZC5yZXBsYWNlKC9cXHJcXG4vZ2ksICcnKS5yZXBsYWNlKC9cXHIvZ2ksICcnKS5yZXBsYWNlKC9cXG4vZ2ksICcnKTtcbiAgICAgICAgICAgIHRoaXMuX2hlYWQgPSBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5wYXJzZVNvdXJjZSh0aGlzLl9oZWFkLCB0aGlzLmluX3ZhbHVlcyk7XG5cbiAgICAgICAgICAgIC8vIHBhcnNlIHNvdXJjZVxuICAgICAgICAgICAgdGhpcy5fc291cmNlID0gc291cmNlLnJlcGxhY2UoL1xcclxcbi9naSwgJycpLnJlcGxhY2UoL1xcci9naSwgJycpLnJlcGxhY2UoL1xcbi9naSwgJycpO1xuICAgICAgICAgICAgdGhpcy5fc291cmNlID0gdGhpcy5fc291cmNlLnJlcGxhY2UoL15cXHcqIFxcdypcXChbXFx3XFxzXFwqLF0qXFwpIHsvZ2ksICcnKS5yZXBsYWNlKC99KFxcc3xcXHQpKiQvZ2ksICcnKTtcbiAgICAgICAgICAgIHRoaXMuX3NvdXJjZSA9IF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLnBhcnNlU291cmNlKHRoaXMuX3NvdXJjZSwgdGhpcy5pbl92YWx1ZXMpO1xuXG4gICAgICAgICAgICB2YXIgdHMgPSBjb21waWxlKCk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnZpZXdTb3VyY2UgPT09IHRydWUpIGNvbnNvbGUubG9nKCclYyBLRVJORUw6ICcgKyB0aGlzLm5hbWUsICdmb250LXNpemU6IDIwcHg7IGNvbG9yOiBibHVlJyksIGNvbnNvbGUubG9nKCclYyBXRUJDTEdMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJywgJ2NvbG9yOiBncmF5JyksIGNvbnNvbGUubG9nKCclYyAnICsgaGVhZGVyICsgc291cmNlLCAnY29sb3I6IGdyYXknKSwgY29uc29sZS5sb2coJyVjIFRSQU5TTEFURUQgV0VCR0wgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJywgJ2NvbG9yOiBkYXJrZ3JheScpLCBjb25zb2xlLmxvZygnJWMgJyArIHRzLCAnY29sb3I6IGRhcmtncmF5Jyk7XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gV2ViQ0xHTEtlcm5lbDtcbn0oKTtcblxuZ2xvYmFsLldlYkNMR0xLZXJuZWwgPSBXZWJDTEdMS2VybmVsO1xubW9kdWxlLmV4cG9ydHMuV2ViQ0xHTEtlcm5lbCA9IFdlYkNMR0xLZXJuZWw7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0oKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuLyoqIFxuKiBVdGlsaXRpZXNcbiogQGNsYXNzXG4qIEBjb25zdHJ1Y3RvclxuKi9cbnZhciBXZWJDTEdMVXRpbHMgPSBleHBvcnRzLldlYkNMR0xVdGlscyA9IGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBXZWJDTEdMVXRpbHMoKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBXZWJDTEdMVXRpbHMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGxvYWRRdWFkXG4gICAgICovXG5cblxuICAgIF9jcmVhdGVDbGFzcyhXZWJDTEdMVXRpbHMsIFt7XG4gICAgICAgIGtleTogXCJsb2FkUXVhZFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gbG9hZFF1YWQobm9kZSwgbGVuZ3RoLCBoZWlnaHQpIHtcbiAgICAgICAgICAgIHZhciBsID0gbGVuZ3RoID09PSB1bmRlZmluZWQgfHwgbGVuZ3RoID09PSBudWxsID8gMC41IDogbGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGggPSBoZWlnaHQgPT09IHVuZGVmaW5lZCB8fCBoZWlnaHQgPT09IG51bGwgPyAwLjUgOiBoZWlnaHQ7XG4gICAgICAgICAgICB0aGlzLnZlcnRleEFycmF5ID0gWy1sLCAtaCwgMC4wLCBsLCAtaCwgMC4wLCBsLCBoLCAwLjAsIC1sLCBoLCAwLjBdO1xuXG4gICAgICAgICAgICB0aGlzLnRleHR1cmVBcnJheSA9IFswLjAsIDAuMCwgMC4wLCAxLjAsIDAuMCwgMC4wLCAxLjAsIDEuMCwgMC4wLCAwLjAsIDEuMCwgMC4wXTtcblxuICAgICAgICAgICAgdGhpcy5pbmRleEFycmF5ID0gWzAsIDEsIDIsIDAsIDIsIDNdO1xuXG4gICAgICAgICAgICB2YXIgbWVzaE9iamVjdCA9IHt9O1xuICAgICAgICAgICAgbWVzaE9iamVjdC52ZXJ0ZXhBcnJheSA9IHRoaXMudmVydGV4QXJyYXk7XG4gICAgICAgICAgICBtZXNoT2JqZWN0LnRleHR1cmVBcnJheSA9IHRoaXMudGV4dHVyZUFycmF5O1xuICAgICAgICAgICAgbWVzaE9iamVjdC5pbmRleEFycmF5ID0gdGhpcy5pbmRleEFycmF5O1xuXG4gICAgICAgICAgICByZXR1cm4gbWVzaE9iamVjdDtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImNyZWF0ZVNoYWRlclwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGNyZWF0ZVNoYWRlclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNyZWF0ZVNoYWRlcihnbCwgbmFtZSwgc291cmNlVmVydGV4LCBzb3VyY2VGcmFnbWVudCwgc2hhZGVyUHJvZ3JhbSkge1xuICAgICAgICAgICAgdmFyIF9zdiA9IGZhbHNlLFxuICAgICAgICAgICAgICAgIF9zZiA9IGZhbHNlO1xuXG4gICAgICAgICAgICB2YXIgbWFrZURlYnVnID0gZnVuY3Rpb24gKGluZm9Mb2csIHNoYWRlcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGluZm9Mb2cpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGFyckVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIHZhciBlcnJvcnMgPSBpbmZvTG9nLnNwbGl0KFwiXFxuXCIpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmID0gZXJyb3JzLmxlbmd0aDsgbiA8IGY7IG4rKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3JzW25dLm1hdGNoKC9eRVJST1IvZ2ltKSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXhwbCA9IGVycm9yc1tuXS5zcGxpdCgnOicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxpbmUgPSBwYXJzZUludChleHBsWzJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyckVycm9ycy5wdXNoKFtsaW5lLCBlcnJvcnNbbl1dKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgc291ciA9IGdsLmdldFNoYWRlclNvdXJjZShzaGFkZXIpLnNwbGl0KFwiXFxuXCIpO1xuICAgICAgICAgICAgICAgIHNvdXIudW5zaGlmdChcIlwiKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfbiA9IDAsIF9mID0gc291ci5sZW5ndGg7IF9uIDwgX2Y7IF9uKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpbmVXaXRoRXJyb3IgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVycm9yU3RyID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGUgPSAwLCBmZSA9IGFyckVycm9ycy5sZW5ndGg7IGUgPCBmZTsgZSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoX24gPT09IGFyckVycm9yc1tlXVswXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVXaXRoRXJyb3IgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yU3RyID0gYXJyRXJyb3JzW2VdWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChsaW5lV2l0aEVycm9yID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCIlY1wiICsgX24gKyAnICVjJyArIHNvdXJbX25dLCBcImNvbG9yOmJsYWNrXCIsIFwiY29sb3I6Ymx1ZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCclY+KWuuKWuiVjJyArIF9uICsgJyAlYycgKyBzb3VyW19uXSArICdcXG4lYycgKyBlcnJvclN0ciwgXCJjb2xvcjpyZWRcIiwgXCJjb2xvcjpibGFja1wiLCBcImNvbG9yOmJsdWVcIiwgXCJjb2xvcjpyZWRcIik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgICAgIHZhciBzaGFkZXJWZXJ0ZXggPSBnbC5jcmVhdGVTaGFkZXIoZ2wuVkVSVEVYX1NIQURFUik7XG4gICAgICAgICAgICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyVmVydGV4LCBzb3VyY2VWZXJ0ZXgpO1xuICAgICAgICAgICAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXJWZXJ0ZXgpO1xuICAgICAgICAgICAgaWYgKCFnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyVmVydGV4LCBnbC5DT01QSUxFX1NUQVRVUykpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5mb0xvZyA9IGdsLmdldFNoYWRlckluZm9Mb2coc2hhZGVyVmVydGV4KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIiVjXCIgKyBuYW1lICsgJyBFUlJPUiAodmVydGV4IHByb2dyYW0pJywgXCJjb2xvcjpyZWRcIik7XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5mb0xvZyAhPT0gdW5kZWZpbmVkICYmIGluZm9Mb2cgIT09IG51bGwpIG1ha2VEZWJ1ZyhpbmZvTG9nLCBzaGFkZXJWZXJ0ZXgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBnbC5hdHRhY2hTaGFkZXIoc2hhZGVyUHJvZ3JhbSwgc2hhZGVyVmVydGV4KTtcbiAgICAgICAgICAgICAgICBfc3YgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgc2hhZGVyRnJhZ21lbnQgPSBnbC5jcmVhdGVTaGFkZXIoZ2wuRlJBR01FTlRfU0hBREVSKTtcbiAgICAgICAgICAgIGdsLnNoYWRlclNvdXJjZShzaGFkZXJGcmFnbWVudCwgc291cmNlRnJhZ21lbnQpO1xuICAgICAgICAgICAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXJGcmFnbWVudCk7XG4gICAgICAgICAgICBpZiAoIWdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXJGcmFnbWVudCwgZ2wuQ09NUElMRV9TVEFUVVMpKSB7XG4gICAgICAgICAgICAgICAgdmFyIF9pbmZvTG9nID0gZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXJGcmFnbWVudCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCIlY1wiICsgbmFtZSArICcgRVJST1IgKGZyYWdtZW50IHByb2dyYW0pJywgXCJjb2xvcjpyZWRcIik7XG5cbiAgICAgICAgICAgICAgICBpZiAoX2luZm9Mb2cgIT09IHVuZGVmaW5lZCAmJiBfaW5mb0xvZyAhPT0gbnVsbCkgbWFrZURlYnVnKF9pbmZvTG9nLCBzaGFkZXJGcmFnbWVudCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGdsLmF0dGFjaFNoYWRlcihzaGFkZXJQcm9ncmFtLCBzaGFkZXJGcmFnbWVudCk7XG4gICAgICAgICAgICAgICAgX3NmID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKF9zdiA9PT0gdHJ1ZSAmJiBfc2YgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBnbC5saW5rUHJvZ3JhbShzaGFkZXJQcm9ncmFtKTtcbiAgICAgICAgICAgICAgICB2YXIgc3VjY2VzcyA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIoc2hhZGVyUHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMpO1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBzaGFkZXIgcHJvZ3JhbSAnICsgbmFtZSArICc6XFxuICcpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbG9nID0gZ2wuZ2V0UHJvZ3JhbUluZm9Mb2coc2hhZGVyUHJvZ3JhbSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2cgIT09IHVuZGVmaW5lZCAmJiBsb2cgIT09IG51bGwpIGNvbnNvbGUubG9nKGxvZyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInBhY2tcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQYWNrIDFmbG9hdCAoMC4wLTEuMCkgdG8gNGZsb2F0IHJnYmEgKDAuMC0xLjAsIDAuMC0xLjAsIDAuMC0xLjAsIDAuMC0xLjApXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcGFjayh2KSB7XG4gICAgICAgICAgICB2YXIgYmlhcyA9IFsxLjAgLyAyNTUuMCwgMS4wIC8gMjU1LjAsIDEuMCAvIDI1NS4wLCAwLjBdO1xuXG4gICAgICAgICAgICB2YXIgciA9IHY7XG4gICAgICAgICAgICB2YXIgZyA9IHRoaXMuZnJhY3QociAqIDI1NS4wKTtcbiAgICAgICAgICAgIHZhciBiID0gdGhpcy5mcmFjdChnICogMjU1LjApO1xuICAgICAgICAgICAgdmFyIGEgPSB0aGlzLmZyYWN0KGIgKiAyNTUuMCk7XG4gICAgICAgICAgICB2YXIgY29sb3VyID0gW3IsIGcsIGIsIGFdO1xuXG4gICAgICAgICAgICB2YXIgZGQgPSBbY29sb3VyWzFdICogYmlhc1swXSwgY29sb3VyWzJdICogYmlhc1sxXSwgY29sb3VyWzNdICogYmlhc1syXSwgY29sb3VyWzNdICogYmlhc1szXV07XG5cbiAgICAgICAgICAgIHJldHVybiBbY29sb3VyWzBdIC0gZGRbMF0sIGNvbG91clsxXSAtIGRkWzFdLCBjb2xvdXJbMl0gLSBkZFsyXSwgY29sb3VyWzNdIC0gZGRbM11dO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwidW5wYWNrXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogVW5wYWNrIDRmbG9hdCByZ2JhICgwLjAtMS4wLCAwLjAtMS4wLCAwLjAtMS4wLCAwLjAtMS4wKSB0byAxZmxvYXQgKDAuMC0xLjApXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gdW5wYWNrKGNvbG91cikge1xuICAgICAgICAgICAgdmFyIGJpdFNoaWZ0cyA9IFsxLjAsIDEuMCAvIDI1NS4wLCAxLjAgLyAoMjU1LjAgKiAyNTUuMCksIDEuMCAvICgyNTUuMCAqIDI1NS4wICogMjU1LjApXTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRvdDQoY29sb3VyLCBiaXRTaGlmdHMpO1xuICAgICAgICB9XG4gICAgfV0sIFt7XG4gICAgICAgIGtleTogXCJnZXRXZWJHTENvbnRleHRGcm9tQ2FudmFzXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogZ2V0V2ViR0xDb250ZXh0RnJvbUNhbnZhc1xuICAgICAgICAgKiBAcGFyYW0ge0hUTUxDYW52YXNFbGVtZW50fSBjYW52YXNcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGN0eE9wdFxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldFdlYkdMQ29udGV4dEZyb21DYW52YXMoY2FudmFzLCBjdHhPcHQpIHtcbiAgICAgICAgICAgIHZhciBnbCA9IG51bGw7XG4gICAgICAgICAgICAvKnRyeSB7XG4gICAgICAgICAgICAgICAgaWYoY3R4T3B0ID09IHVuZGVmaW5lZCB8fCBjdHhPcHQgPT09IG51bGwpIGdsID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbDJcIik7XG4gICAgICAgICAgICAgICAgZWxzZSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2wyXCIsIGN0eE9wdCk7XG4gICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKChnbCA9PSBudWxsKT9cIm5vIHdlYmdsMlwiOlwidXNpbmcgd2ViZ2wyXCIpO1xuICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgICAgZ2wgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZ2wgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKGN0eE9wdCA9PSB1bmRlZmluZWQgfHwgY3R4T3B0ID09PSBudWxsKSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiZXhwZXJpbWVudGFsLXdlYmdsMlwiKTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiZXhwZXJpbWVudGFsLXdlYmdsMlwiLCBjdHhPcHQpO1xuICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coKGdsID09IG51bGwpP1wibm8gZXhwZXJpbWVudGFsLXdlYmdsMlwiOlwidXNpbmcgZXhwZXJpbWVudGFsLXdlYmdsMlwiKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZ2wgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0qL1xuICAgICAgICAgICAgaWYgKGdsID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3R4T3B0ID09PSB1bmRlZmluZWQgfHwgY3R4T3B0ID09PSBudWxsKSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIik7ZWxzZSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIiwgY3R4T3B0KTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhnbCA9PSBudWxsID8gXCJubyB3ZWJnbFwiIDogXCJ1c2luZyB3ZWJnbFwiKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGdsID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZ2wgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdHhPcHQgPT09IHVuZGVmaW5lZCB8fCBjdHhPcHQgPT09IG51bGwpIGdsID0gY2FudmFzLmdldENvbnRleHQoXCJleHBlcmltZW50YWwtd2ViZ2xcIik7ZWxzZSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiZXhwZXJpbWVudGFsLXdlYmdsXCIsIGN0eE9wdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZ2wgPT0gbnVsbCA/IFwibm8gZXhwZXJpbWVudGFsLXdlYmdsXCIgOiBcInVzaW5nIGV4cGVyaW1lbnRhbC13ZWJnbFwiKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGdsID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZ2wgPT0gbnVsbCkgZ2wgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBnbDtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImdldFVpbnQ4QXJyYXlGcm9tSFRNTEltYWdlRWxlbWVudFwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBVaW50OEFycmF5IGZyb20gSFRNTEltYWdlRWxlbWVudFxuICAgICAgICAgKiBAcGFyYW0ge0hUTUxJbWFnZUVsZW1lbnR9IGltYWdlRWxlbWVudFxuICAgICAgICAgKiBAcmV0dXJucyB7VWludDhDbGFtcGVkQXJyYXl9XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0VWludDhBcnJheUZyb21IVE1MSW1hZ2VFbGVtZW50KGltYWdlRWxlbWVudCkge1xuICAgICAgICAgICAgdmFyIGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgICAgIGUud2lkdGggPSBpbWFnZUVsZW1lbnQud2lkdGg7XG4gICAgICAgICAgICBlLmhlaWdodCA9IGltYWdlRWxlbWVudC5oZWlnaHQ7XG4gICAgICAgICAgICB2YXIgY3R4MkRfdGV4ID0gZS5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgICAgICAgICBjdHgyRF90ZXguZHJhd0ltYWdlKGltYWdlRWxlbWVudCwgMCwgMCk7XG4gICAgICAgICAgICB2YXIgYXJyYXlUZXggPSBjdHgyRF90ZXguZ2V0SW1hZ2VEYXRhKDAsIDAsIGltYWdlRWxlbWVudC53aWR0aCwgaW1hZ2VFbGVtZW50LmhlaWdodCk7XG5cbiAgICAgICAgICAgIHJldHVybiBhcnJheVRleC5kYXRhO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZG90NFwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERvdCBwcm9kdWN0IHZlY3RvcjRmbG9hdFxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGRvdDQodmVjdG9yNEEsIHZlY3RvcjRCKSB7XG4gICAgICAgICAgICByZXR1cm4gdmVjdG9yNEFbMF0gKiB2ZWN0b3I0QlswXSArIHZlY3RvcjRBWzFdICogdmVjdG9yNEJbMV0gKyB2ZWN0b3I0QVsyXSAqIHZlY3RvcjRCWzJdICsgdmVjdG9yNEFbM10gKiB2ZWN0b3I0QlszXTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImZyYWN0XCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogQ29tcHV0ZSB0aGUgZnJhY3Rpb25hbCBwYXJ0IG9mIHRoZSBhcmd1bWVudC4gZnJhY3QocGkpPTAuMTQxNTkyNjUuLi5cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBmcmFjdChudW1iZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBudW1iZXIgPiAwID8gbnVtYmVyIC0gTWF0aC5mbG9vcihudW1iZXIpIDogbnVtYmVyIC0gTWF0aC5jZWlsKG51bWJlcik7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJwYWNrR0xTTEZ1bmN0aW9uU3RyaW5nXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHBhY2sgR0xTTCBmdW5jdGlvbiBzdHJpbmdcbiAgICAgICAgICogQHJldHVybnMge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBwYWNrR0xTTEZ1bmN0aW9uU3RyaW5nKCkge1xuICAgICAgICAgICAgcmV0dXJuICd2ZWM0IHBhY2sgKGZsb2F0IGRlcHRoKSB7XFxuJyArICdjb25zdCB2ZWM0IGJpYXMgPSB2ZWM0KDEuMCAvIDI1NS4wLFxcbicgKyAnMS4wIC8gMjU1LjAsXFxuJyArICcxLjAgLyAyNTUuMCxcXG4nICsgJzAuMCk7XFxuJyArICdmbG9hdCByID0gZGVwdGg7XFxuJyArICdmbG9hdCBnID0gZnJhY3QociAqIDI1NS4wKTtcXG4nICsgJ2Zsb2F0IGIgPSBmcmFjdChnICogMjU1LjApO1xcbicgKyAnZmxvYXQgYSA9IGZyYWN0KGIgKiAyNTUuMCk7XFxuJyArICd2ZWM0IGNvbG91ciA9IHZlYzQociwgZywgYiwgYSk7XFxuJyArICdyZXR1cm4gY29sb3VyIC0gKGNvbG91ci55end3ICogYmlhcyk7XFxuJyArICd9XFxuJztcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInVucGFja0dMU0xGdW5jdGlvblN0cmluZ1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCB1bnBhY2sgR0xTTCBmdW5jdGlvbiBzdHJpbmdcbiAgICAgICAgICogQHJldHVybnMge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiB1bnBhY2tHTFNMRnVuY3Rpb25TdHJpbmcoKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2Zsb2F0IHVucGFjayAodmVjNCBjb2xvdXIpIHtcXG4nICsgJ2NvbnN0IHZlYzQgYml0U2hpZnRzID0gdmVjNCgxLjAsXFxuJyArICcxLjAgLyAyNTUuMCxcXG4nICsgJzEuMCAvICgyNTUuMCAqIDI1NS4wKSxcXG4nICsgJzEuMCAvICgyNTUuMCAqIDI1NS4wICogMjU1LjApKTtcXG4nICsgJ3JldHVybiBkb3QoY29sb3VyLCBiaXRTaGlmdHMpO1xcbicgKyAnfVxcbic7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJnZXRPdXRwdXRCdWZmZXJzXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogZ2V0T3V0cHV0QnVmZmVyc1xuICAgICAgICAgKiBAcGFyYW0ge1dlYkNMR0xLZXJuZWx8V2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbX0gcHJvZ1xuICAgICAgICAgKiBAcGFyYW0ge0FycmF5PFdlYkNMR0xCdWZmZXI+fSBidWZmZXJzXG4gICAgICAgICAqIEByZXR1cm5zIHtBcnJheTxXZWJDTEdMQnVmZmVyPn1cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRPdXRwdXRCdWZmZXJzKHByb2csIGJ1ZmZlcnMpIHtcbiAgICAgICAgICAgIHZhciBvdXRwdXRCdWZmID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChwcm9nLm91dHB1dCAhPT0gdW5kZWZpbmVkICYmIHByb2cub3V0cHV0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0QnVmZiA9IFtdO1xuICAgICAgICAgICAgICAgIGlmIChwcm9nLm91dHB1dFswXSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDwgcHJvZy5vdXRwdXQubGVuZ3RoOyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vaWYoYnVmZmVycy5oYXNPd25Qcm9wZXJ0eShwcm9nLm91dHB1dFtuXSkgPT0gZmFsc2UgJiYgX2FsZXJ0ZWQgPT0gZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICBfYWxlcnRlZCA9IHRydWUsIGFsZXJ0KFwib3V0cHV0IGFyZ3VtZW50IFwiK3Byb2cub3V0cHV0W25dK1wiIG5vdCBmb3VuZCBpbiBidWZmZXJzLiBhZGQgZGVzaXJlZCBhcmd1bWVudCBhcyBzaGFyZWRcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dEJ1ZmZbbl0gPSBidWZmZXJzW3Byb2cub3V0cHV0W25dXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBvdXRwdXRCdWZmID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvdXRwdXRCdWZmO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwicGFyc2VTb3VyY2VcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBwYXJzZVNvdXJjZVxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gc291cmNlXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZXNcbiAgICAgICAgICogQHJldHVybnMge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBwYXJzZVNvdXJjZShzb3VyY2UsIHZhbHVlcykge1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHZhbHVlcykge1xuICAgICAgICAgICAgICAgIHZhciByZWdleHAgPSBuZXcgUmVnRXhwKGtleSArIFwiXFxcXFsoPyFcXFxcZCkuKj9cXFxcXVwiLCBcImdtXCIpOyAvLyBhdm9pZCBub3JtYWwgdW5pZm9ybSBhcnJheXNcbiAgICAgICAgICAgICAgICB2YXIgdmFyTWF0Y2hlcyA9IHNvdXJjZS5tYXRjaChyZWdleHApOyAvLyBcIlNlYXJjaCBjdXJyZW50IFwiYXJnTmFtZVwiIGluIHNvdXJjZSBhbmQgc3RvcmUgaW4gYXJyYXkgdmFyTWF0Y2hlc1xuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2codmFyTWF0Y2hlcyk7XG4gICAgICAgICAgICAgICAgaWYgKHZhck1hdGNoZXMgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBuQiA9IDAsIGZCID0gdmFyTWF0Y2hlcy5sZW5ndGg7IG5CIDwgZkI7IG5CKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZvciBlYWNoIHZhck1hdGNoZXMgKFwiQVt4XVwiLCBcIkFbeF1cIilcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZWdleHBOYXRpdmVHTCA9IG5ldyBSZWdFeHAoJ2BgYChcXHN8XFx0KSpnbC4qJyArIHZhck1hdGNoZXNbbkJdICsgJy4qYGBgW15gYGAoXFxzfFxcdCkqZ2xdJywgXCJnbVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZWdleHBOYXRpdmVHTE1hdGNoZXMgPSBzb3VyY2UubWF0Y2gocmVnZXhwTmF0aXZlR0wpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlZ2V4cE5hdGl2ZUdMTWF0Y2hlcyA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWUgPSB2YXJNYXRjaGVzW25CXS5zcGxpdCgnWycpWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YXJpID0gdmFyTWF0Y2hlc1tuQl0uc3BsaXQoJ1snKVsxXS5zcGxpdCgnXScpWzBdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1hcCA9IHsgJ2Zsb2F0NF9mcm9tU2FtcGxlcic6IHNvdXJjZS5yZXBsYWNlKG5hbWUgKyBcIltcIiArIHZhcmkgKyBcIl1cIiwgJ3RleHR1cmUyRCgnICsgbmFtZSArICcsJyArIHZhcmkgKyAnKScpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZmxvYXRfZnJvbVNhbXBsZXInOiBzb3VyY2UucmVwbGFjZShuYW1lICsgXCJbXCIgKyB2YXJpICsgXCJdXCIsICd0ZXh0dXJlMkQoJyArIG5hbWUgKyAnLCcgKyB2YXJpICsgJykueCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZmxvYXQ0X2Zyb21BdHRyJzogc291cmNlLnJlcGxhY2UobmFtZSArIFwiW1wiICsgdmFyaSArIFwiXVwiLCBuYW1lKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0X2Zyb21BdHRyJzogc291cmNlLnJlcGxhY2UobmFtZSArIFwiW1wiICsgdmFyaSArIFwiXVwiLCBuYW1lKSB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZSA9IG1hcFt2YWx1ZXNba2V5XS50eXBlXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNvdXJjZSA9IHNvdXJjZS5yZXBsYWNlKC9gYGAoXFxzfFxcdCkqZ2wvZ2ksIFwiXCIpLnJlcGxhY2UoL2BgYC9naSwgXCJcIikucmVwbGFjZSgvOy9naSwgXCI7XFxuXCIpLnJlcGxhY2UoL30vZ2ksIFwifVxcblwiKS5yZXBsYWNlKC97L2dpLCBcIntcXG5cIik7XG4gICAgICAgICAgICByZXR1cm4gc291cmNlO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwibGluZXNfdmVydGV4X2F0dHJzXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogbGluZXNfdmVydGV4X2F0dHJzXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZXNcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBsaW5lc192ZXJ0ZXhfYXR0cnModmFsdWVzKSB7XG4gICAgICAgICAgICB2YXIgc3RyID0gJyc7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9IHsgJ2Zsb2F0NF9mcm9tU2FtcGxlcic6ICd1bmlmb3JtIHNhbXBsZXIyRCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXRfZnJvbVNhbXBsZXInOiAndW5pZm9ybSBzYW1wbGVyMkQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0NF9mcm9tQXR0cic6ICdhdHRyaWJ1dGUgdmVjNCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXRfZnJvbUF0dHInOiAnYXR0cmlidXRlIGZsb2F0ICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdCc6ICd1bmlmb3JtIGZsb2F0ICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdDQnOiAndW5pZm9ybSB2ZWM0ICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdtYXQ0JzogJ3VuaWZvcm0gbWF0NCAnICsga2V5ICsgJzsnIH1bdmFsdWVzW2tleV0udHlwZV0gKyAnXFxuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJsaW5lc19mcmFnbWVudF9hdHRyc1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGxpbmVzX2ZyYWdtZW50X2F0dHJzXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZXNcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBsaW5lc19mcmFnbWVudF9hdHRycyh2YWx1ZXMpIHtcbiAgICAgICAgICAgIHZhciBzdHIgPSAnJztcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB2YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0geyAnZmxvYXQ0X2Zyb21TYW1wbGVyJzogJ3VuaWZvcm0gc2FtcGxlcjJEICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdF9mcm9tU2FtcGxlcic6ICd1bmlmb3JtIHNhbXBsZXIyRCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXQnOiAndW5pZm9ybSBmbG9hdCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXQ0JzogJ3VuaWZvcm0gdmVjNCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnbWF0NCc6ICd1bmlmb3JtIG1hdDQgJyArIGtleSArICc7JyB9W3ZhbHVlc1trZXldLnR5cGVdICsgJ1xcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwibGluZXNfZHJhd0J1ZmZlcnNJbml0XCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogbGluZXNfZHJhd0J1ZmZlcnNJbml0XG4gICAgICAgICAqIEBwYXJhbSB7aW50fSBtYXhEcmF3QnVmZmVyc1xuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGxpbmVzX2RyYXdCdWZmZXJzSW5pdChtYXhEcmF3QnVmZmVycykge1xuICAgICAgICAgICAgdmFyIHN0ciA9ICcnO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGZuID0gbWF4RHJhd0J1ZmZlcnM7IG4gPCBmbjsgbisrKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9ICcnICsgJ2Zsb2F0IG91dCcgKyBuICsgJ19mbG9hdCA9IC05OTkuOTk5ODk7XFxuJyArICd2ZWM0IG91dCcgKyBuICsgJ19mbG9hdDQ7XFxuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJsaW5lc19kcmF3QnVmZmVyc1dyaXRlSW5pdFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gbGluZXNfZHJhd0J1ZmZlcnNXcml0ZUluaXQobWF4RHJhd0J1ZmZlcnMpIHtcbiAgICAgICAgICAgIHZhciBzdHIgPSAnJztcbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmbiA9IG1heERyYXdCdWZmZXJzOyBuIDwgZm47IG4rKykge1xuICAgICAgICAgICAgICAgIHN0ciArPSAnJyArICdsYXlvdXQobG9jYXRpb24gPSAnICsgbiArICcpIG91dCB2ZWM0IG91dENvbCcgKyBuICsgJztcXG4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImxpbmVzX2RyYXdCdWZmZXJzV3JpdGVcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBsaW5lc19kcmF3QnVmZmVyc1dyaXRlXG4gICAgICAgICAqIEBwYXJhbSB7aW50fSBtYXhEcmF3QnVmZmVyc1xuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGxpbmVzX2RyYXdCdWZmZXJzV3JpdGUobWF4RHJhd0J1ZmZlcnMpIHtcbiAgICAgICAgICAgIHZhciBzdHIgPSAnJztcbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmbiA9IG1heERyYXdCdWZmZXJzOyBuIDwgZm47IG4rKykge1xuICAgICAgICAgICAgICAgIHN0ciArPSAnJyArICdpZihvdXQnICsgbiArICdfZmxvYXQgIT0gLTk5OS45OTk4OSkgZ2xfRnJhZ0RhdGFbJyArIG4gKyAnXSA9IHZlYzQob3V0JyArIG4gKyAnX2Zsb2F0LDAuMCwwLjAsMS4wKTtcXG4nICsgJyBlbHNlIGdsX0ZyYWdEYXRhWycgKyBuICsgJ10gPSBvdXQnICsgbiArICdfZmxvYXQ0O1xcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY2hlY2tBcmdOYW1lSW5pdGlhbGl6YXRpb25cIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBjaGVja0FyZ05hbWVJbml0aWFsaXphdGlvblxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5WYWx1ZXNcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGFyZ05hbWVcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjaGVja0FyZ05hbWVJbml0aWFsaXphdGlvbihpblZhbHVlcywgYXJnTmFtZSkge1xuICAgICAgICAgICAgaWYgKGluVmFsdWVzLmhhc093blByb3BlcnR5KGFyZ05hbWUpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGluVmFsdWVzW2FyZ05hbWVdID0ge1xuICAgICAgICAgICAgICAgICAgICBcInR5cGVcIjogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgXCJleHBlY3RlZE1vZGVcIjogbnVsbCwgLy8gXCJBVFRSSUJVVEVcIiwgXCJTQU1QTEVSXCIsIFwiVU5JRk9STVwiXG4gICAgICAgICAgICAgICAgICAgIFwibG9jYXRpb25cIjogbnVsbCB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZ2V0X2dsb2JhbF9pZDNfR0xTTEZ1bmN0aW9uU3RyaW5nXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogZ2V0X2dsb2JhbF9pZDNfR0xTTEZ1bmN0aW9uU3RyaW5nXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0X2dsb2JhbF9pZDNfR0xTTEZ1bmN0aW9uU3RyaW5nKCkge1xuICAgICAgICAgICAgcmV0dXJuICcnICsgJ3ZlYzIgZ2V0X2dsb2JhbF9pZChmbG9hdCBpZCwgZmxvYXQgYnVmZmVyV2lkdGgsIGZsb2F0IGdlb21ldHJ5TGVuZ3RoKSB7XFxuJyArICdmbG9hdCB0ZXhlbFNpemUgPSAxLjAvYnVmZmVyV2lkdGg7JyArICdmbG9hdCBudW0gPSAoaWQqZ2VvbWV0cnlMZW5ndGgpL2J1ZmZlcldpZHRoOycgKyAnZmxvYXQgY29sdW1uID0gZnJhY3QobnVtKSsodGV4ZWxTaXplLzIuMCk7JyArICdmbG9hdCByb3cgPSAoZmxvb3IobnVtKS9idWZmZXJXaWR0aCkrKHRleGVsU2l6ZS8yLjApOycgKyAncmV0dXJuIHZlYzIoY29sdW1uLCByb3cpOycgKyAnfVxcbic7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJnZXRfZ2xvYmFsX2lkMl9HTFNMRnVuY3Rpb25TdHJpbmdcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBnZXRfZ2xvYmFsX2lkMl9HTFNMRnVuY3Rpb25TdHJpbmdcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRfZ2xvYmFsX2lkMl9HTFNMRnVuY3Rpb25TdHJpbmcoKSB7XG4gICAgICAgICAgICByZXR1cm4gJycgKyAndmVjMiBnZXRfZ2xvYmFsX2lkKHZlYzIgaWQsIGZsb2F0IGJ1ZmZlcldpZHRoKSB7XFxuJyArICdmbG9hdCB0ZXhlbFNpemUgPSAxLjAvYnVmZmVyV2lkdGg7JyArICdmbG9hdCBjb2x1bW4gPSAoaWQueC9idWZmZXJXaWR0aCkrKHRleGVsU2l6ZS8yLjApOycgKyAnZmxvYXQgcm93ID0gKGlkLnkvYnVmZmVyV2lkdGgpKyh0ZXhlbFNpemUvMi4wKTsnICsgJ3JldHVybiB2ZWMyKGNvbHVtbiwgcm93KTsnICsgJ31cXG4nO1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIFdlYkNMR0xVdGlscztcbn0oKTtcblxuZ2xvYmFsLldlYkNMR0xVdGlscyA9IFdlYkNMR0xVdGlscztcbm1vZHVsZS5leHBvcnRzLldlYkNMR0xVdGlscyA9IFdlYkNMR0xVdGlsczsiXX0=
