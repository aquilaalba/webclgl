(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
(function (global){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
            try {
                if (ctxOpt === undefined || ctxOpt === null) gl = canvas.getContext("webgl2");else gl = canvas.getContext("webgl2", ctxOpt);

                console.log(gl == null ? "no webgl2" : "using webgl2");
            } catch (e) {
                gl = null;
            }
            if (gl == null) {
                try {
                    if (ctxOpt === undefined || ctxOpt === null) gl = canvas.getContext("experimental-webgl2");else gl = canvas.getContext("experimental-webgl2", ctxOpt);

                    console.log(gl == null ? "no experimental-webgl2" : "using experimental-webgl2");
                } catch (e) {
                    gl = null;
                }
            }
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
         * @param {boolean} isGL2
         * @returns {String}
         */
        value: function parseSource(source, values, isGL2) {
            var texStr = isGL2 === true ? "texture" : "texture2D";

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

                            var map = { 'float4_fromSampler': source.replace(name + "[" + vari + "]", texStr + '(' + name + ',' + vari + ')'),
                                'float_fromSampler': source.replace(name + "[" + vari + "]", texStr + '(' + name + ',' + vari + ').x'),
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
         * @param {boolean} isGL2
         */
        value: function lines_vertex_attrs(values, isGL2) {
            var attrStr = isGL2 === true ? "in" : "attribute";

            var str = '';
            for (var key in values) {
                str += { 'float4_fromSampler': 'uniform sampler2D ' + key + ';',
                    'float_fromSampler': 'uniform sampler2D ' + key + ';',
                    'float4_fromAttr': attrStr + ' vec4 ' + key + ';',
                    'float_fromAttr': attrStr + ' float ' + key + ';',
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
        key: "lines_drawBuffersWriteInit_GL2",
        value: function lines_drawBuffersWriteInit_GL2(maxDrawBuffers) {
            var str = '';
            for (var n = 0, fn = maxDrawBuffers; n < fn; n++) {
                str += '' + 'layout(location = ' + n + ') out vec4 outCol' + n + ';\n';
            }
            return str;
        }
    }, {
        key: "lines_drawBuffersWrite_GL2",


        /**
         * lines_drawBuffersWrite
         * @param {int} maxDrawBuffers
         */
        value: function lines_drawBuffersWrite_GL2(maxDrawBuffers) {
            var str = '';
            for (var n = 0, fn = maxDrawBuffers; n < fn; n++) {
                str += '' + 'if(out' + n + '_float != -999.99989) outCol' + n + ' = vec4(out' + n + '_float,0.0,0.0,1.0);\n' + ' else outCol' + n + ' = out' + n + '_float4;\n';
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvd2ViY2xnbC9XZWJDTEdMVXRpbHMuY2xhc3MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfXJldHVybiBlfSkoKSIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KCk7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbi8qKiBcbiogVXRpbGl0aWVzXG4qIEBjbGFzc1xuKiBAY29uc3RydWN0b3JcbiovXG52YXIgV2ViQ0xHTFV0aWxzID0gZXhwb3J0cy5XZWJDTEdMVXRpbHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gV2ViQ0xHTFV0aWxzKCkge1xuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgV2ViQ0xHTFV0aWxzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBsb2FkUXVhZFxuICAgICAqL1xuXG5cbiAgICBfY3JlYXRlQ2xhc3MoV2ViQ0xHTFV0aWxzLCBbe1xuICAgICAgICBrZXk6IFwibG9hZFF1YWRcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGxvYWRRdWFkKG5vZGUsIGxlbmd0aCwgaGVpZ2h0KSB7XG4gICAgICAgICAgICB2YXIgbCA9IGxlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IGxlbmd0aCA9PT0gbnVsbCA/IDAuNSA6IGxlbmd0aDtcbiAgICAgICAgICAgIHZhciBoID0gaGVpZ2h0ID09PSB1bmRlZmluZWQgfHwgaGVpZ2h0ID09PSBudWxsID8gMC41IDogaGVpZ2h0O1xuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhBcnJheSA9IFstbCwgLWgsIDAuMCwgbCwgLWgsIDAuMCwgbCwgaCwgMC4wLCAtbCwgaCwgMC4wXTtcblxuICAgICAgICAgICAgdGhpcy50ZXh0dXJlQXJyYXkgPSBbMC4wLCAwLjAsIDAuMCwgMS4wLCAwLjAsIDAuMCwgMS4wLCAxLjAsIDAuMCwgMC4wLCAxLjAsIDAuMF07XG5cbiAgICAgICAgICAgIHRoaXMuaW5kZXhBcnJheSA9IFswLCAxLCAyLCAwLCAyLCAzXTtcblxuICAgICAgICAgICAgdmFyIG1lc2hPYmplY3QgPSB7fTtcbiAgICAgICAgICAgIG1lc2hPYmplY3QudmVydGV4QXJyYXkgPSB0aGlzLnZlcnRleEFycmF5O1xuICAgICAgICAgICAgbWVzaE9iamVjdC50ZXh0dXJlQXJyYXkgPSB0aGlzLnRleHR1cmVBcnJheTtcbiAgICAgICAgICAgIG1lc2hPYmplY3QuaW5kZXhBcnJheSA9IHRoaXMuaW5kZXhBcnJheTtcblxuICAgICAgICAgICAgcmV0dXJuIG1lc2hPYmplY3Q7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJjcmVhdGVTaGFkZXJcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBjcmVhdGVTaGFkZXJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjcmVhdGVTaGFkZXIoZ2wsIG5hbWUsIHNvdXJjZVZlcnRleCwgc291cmNlRnJhZ21lbnQsIHNoYWRlclByb2dyYW0pIHtcbiAgICAgICAgICAgIHZhciBfc3YgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICBfc2YgPSBmYWxzZTtcblxuICAgICAgICAgICAgdmFyIG1ha2VEZWJ1ZyA9IGZ1bmN0aW9uIChpbmZvTG9nLCBzaGFkZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhpbmZvTG9nKTtcblxuICAgICAgICAgICAgICAgIHZhciBhcnJFcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgZXJyb3JzID0gaW5mb0xvZy5zcGxpdChcIlxcblwiKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBuID0gMCwgZiA9IGVycm9ycy5sZW5ndGg7IG4gPCBmOyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yc1tuXS5tYXRjaCgvXkVSUk9SL2dpbSkgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4cGwgPSBlcnJvcnNbbl0uc3BsaXQoJzonKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsaW5lID0gcGFyc2VJbnQoZXhwbFsyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcnJFcnJvcnMucHVzaChbbGluZSwgZXJyb3JzW25dXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHNvdXIgPSBnbC5nZXRTaGFkZXJTb3VyY2Uoc2hhZGVyKS5zcGxpdChcIlxcblwiKTtcbiAgICAgICAgICAgICAgICBzb3VyLnVuc2hpZnQoXCJcIik7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX24gPSAwLCBfZiA9IHNvdXIubGVuZ3RoOyBfbiA8IF9mOyBfbisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsaW5lV2l0aEVycm9yID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHZhciBlcnJvclN0ciA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBlID0gMCwgZmUgPSBhcnJFcnJvcnMubGVuZ3RoOyBlIDwgZmU7IGUrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKF9uID09PSBhcnJFcnJvcnNbZV1bMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lV2l0aEVycm9yID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvclN0ciA9IGFyckVycm9yc1tlXVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAobGluZVdpdGhFcnJvciA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiJWNcIiArIF9uICsgJyAlYycgKyBzb3VyW19uXSwgXCJjb2xvcjpibGFja1wiLCBcImNvbG9yOmJsdWVcIik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnJWPilrrilrolYycgKyBfbiArICcgJWMnICsgc291cltfbl0gKyAnXFxuJWMnICsgZXJyb3JTdHIsIFwiY29sb3I6cmVkXCIsIFwiY29sb3I6YmxhY2tcIiwgXCJjb2xvcjpibHVlXCIsIFwiY29sb3I6cmVkXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgICAgICB2YXIgc2hhZGVyVmVydGV4ID0gZ2wuY3JlYXRlU2hhZGVyKGdsLlZFUlRFWF9TSEFERVIpO1xuICAgICAgICAgICAgZ2wuc2hhZGVyU291cmNlKHNoYWRlclZlcnRleCwgc291cmNlVmVydGV4KTtcbiAgICAgICAgICAgIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyVmVydGV4KTtcbiAgICAgICAgICAgIGlmICghZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlclZlcnRleCwgZ2wuQ09NUElMRV9TVEFUVVMpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGluZm9Mb2cgPSBnbC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlclZlcnRleCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCIlY1wiICsgbmFtZSArICcgRVJST1IgKHZlcnRleCBwcm9ncmFtKScsIFwiY29sb3I6cmVkXCIpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGluZm9Mb2cgIT09IHVuZGVmaW5lZCAmJiBpbmZvTG9nICE9PSBudWxsKSBtYWtlRGVidWcoaW5mb0xvZywgc2hhZGVyVmVydGV4KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZ2wuYXR0YWNoU2hhZGVyKHNoYWRlclByb2dyYW0sIHNoYWRlclZlcnRleCk7XG4gICAgICAgICAgICAgICAgX3N2ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHNoYWRlckZyYWdtZW50ID0gZ2wuY3JlYXRlU2hhZGVyKGdsLkZSQUdNRU5UX1NIQURFUik7XG4gICAgICAgICAgICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyRnJhZ21lbnQsIHNvdXJjZUZyYWdtZW50KTtcbiAgICAgICAgICAgIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyRnJhZ21lbnQpO1xuICAgICAgICAgICAgaWYgKCFnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyRnJhZ21lbnQsIGdsLkNPTVBJTEVfU1RBVFVTKSkge1xuICAgICAgICAgICAgICAgIHZhciBfaW5mb0xvZyA9IGdsLmdldFNoYWRlckluZm9Mb2coc2hhZGVyRnJhZ21lbnQpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiJWNcIiArIG5hbWUgKyAnIEVSUk9SIChmcmFnbWVudCBwcm9ncmFtKScsIFwiY29sb3I6cmVkXCIpO1xuXG4gICAgICAgICAgICAgICAgaWYgKF9pbmZvTG9nICE9PSB1bmRlZmluZWQgJiYgX2luZm9Mb2cgIT09IG51bGwpIG1ha2VEZWJ1ZyhfaW5mb0xvZywgc2hhZGVyRnJhZ21lbnQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBnbC5hdHRhY2hTaGFkZXIoc2hhZGVyUHJvZ3JhbSwgc2hhZGVyRnJhZ21lbnQpO1xuICAgICAgICAgICAgICAgIF9zZiA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChfc3YgPT09IHRydWUgJiYgX3NmID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgZ2wubGlua1Byb2dyYW0oc2hhZGVyUHJvZ3JhbSk7XG4gICAgICAgICAgICAgICAgdmFyIHN1Y2Nlc3MgPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHNoYWRlclByb2dyYW0sIGdsLkxJTktfU1RBVFVTKTtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRXJyb3Igc2hhZGVyIHByb2dyYW0gJyArIG5hbWUgKyAnOlxcbiAnKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxvZyA9IGdsLmdldFByb2dyYW1JbmZvTG9nKHNoYWRlclByb2dyYW0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAobG9nICE9PSB1bmRlZmluZWQgJiYgbG9nICE9PSBudWxsKSBjb25zb2xlLmxvZyhsb2cpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJwYWNrXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogUGFjayAxZmxvYXQgKDAuMC0xLjApIHRvIDRmbG9hdCByZ2JhICgwLjAtMS4wLCAwLjAtMS4wLCAwLjAtMS4wLCAwLjAtMS4wKVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHBhY2sodikge1xuICAgICAgICAgICAgdmFyIGJpYXMgPSBbMS4wIC8gMjU1LjAsIDEuMCAvIDI1NS4wLCAxLjAgLyAyNTUuMCwgMC4wXTtcblxuICAgICAgICAgICAgdmFyIHIgPSB2O1xuICAgICAgICAgICAgdmFyIGcgPSB0aGlzLmZyYWN0KHIgKiAyNTUuMCk7XG4gICAgICAgICAgICB2YXIgYiA9IHRoaXMuZnJhY3QoZyAqIDI1NS4wKTtcbiAgICAgICAgICAgIHZhciBhID0gdGhpcy5mcmFjdChiICogMjU1LjApO1xuICAgICAgICAgICAgdmFyIGNvbG91ciA9IFtyLCBnLCBiLCBhXTtcblxuICAgICAgICAgICAgdmFyIGRkID0gW2NvbG91clsxXSAqIGJpYXNbMF0sIGNvbG91clsyXSAqIGJpYXNbMV0sIGNvbG91clszXSAqIGJpYXNbMl0sIGNvbG91clszXSAqIGJpYXNbM11dO1xuXG4gICAgICAgICAgICByZXR1cm4gW2NvbG91clswXSAtIGRkWzBdLCBjb2xvdXJbMV0gLSBkZFsxXSwgY29sb3VyWzJdIC0gZGRbMl0sIGNvbG91clszXSAtIGRkWzNdXTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInVucGFja1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFVucGFjayA0ZmxvYXQgcmdiYSAoMC4wLTEuMCwgMC4wLTEuMCwgMC4wLTEuMCwgMC4wLTEuMCkgdG8gMWZsb2F0ICgwLjAtMS4wKVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHVucGFjayhjb2xvdXIpIHtcbiAgICAgICAgICAgIHZhciBiaXRTaGlmdHMgPSBbMS4wLCAxLjAgLyAyNTUuMCwgMS4wIC8gKDI1NS4wICogMjU1LjApLCAxLjAgLyAoMjU1LjAgKiAyNTUuMCAqIDI1NS4wKV07XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kb3Q0KGNvbG91ciwgYml0U2hpZnRzKTtcbiAgICAgICAgfVxuICAgIH1dLCBbe1xuICAgICAgICBrZXk6IFwiZ2V0V2ViR0xDb250ZXh0RnJvbUNhbnZhc1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGdldFdlYkdMQ29udGV4dEZyb21DYW52YXNcbiAgICAgICAgICogQHBhcmFtIHtIVE1MQ2FudmFzRWxlbWVudH0gY2FudmFzXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjdHhPcHRcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRXZWJHTENvbnRleHRGcm9tQ2FudmFzKGNhbnZhcywgY3R4T3B0KSB7XG4gICAgICAgICAgICB2YXIgZ2wgPSBudWxsO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoY3R4T3B0ID09PSB1bmRlZmluZWQgfHwgY3R4T3B0ID09PSBudWxsKSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2wyXCIpO2Vsc2UgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsMlwiLCBjdHhPcHQpO1xuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZ2wgPT0gbnVsbCA/IFwibm8gd2ViZ2wyXCIgOiBcInVzaW5nIHdlYmdsMlwiKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBnbCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZ2wgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdHhPcHQgPT09IHVuZGVmaW5lZCB8fCBjdHhPcHQgPT09IG51bGwpIGdsID0gY2FudmFzLmdldENvbnRleHQoXCJleHBlcmltZW50YWwtd2ViZ2wyXCIpO2Vsc2UgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcImV4cGVyaW1lbnRhbC13ZWJnbDJcIiwgY3R4T3B0KTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhnbCA9PSBudWxsID8gXCJubyBleHBlcmltZW50YWwtd2ViZ2wyXCIgOiBcInVzaW5nIGV4cGVyaW1lbnRhbC13ZWJnbDJcIik7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBnbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGdsID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3R4T3B0ID09PSB1bmRlZmluZWQgfHwgY3R4T3B0ID09PSBudWxsKSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIik7ZWxzZSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIiwgY3R4T3B0KTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhnbCA9PSBudWxsID8gXCJubyB3ZWJnbFwiIDogXCJ1c2luZyB3ZWJnbFwiKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGdsID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZ2wgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdHhPcHQgPT09IHVuZGVmaW5lZCB8fCBjdHhPcHQgPT09IG51bGwpIGdsID0gY2FudmFzLmdldENvbnRleHQoXCJleHBlcmltZW50YWwtd2ViZ2xcIik7ZWxzZSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiZXhwZXJpbWVudGFsLXdlYmdsXCIsIGN0eE9wdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZ2wgPT0gbnVsbCA/IFwibm8gZXhwZXJpbWVudGFsLXdlYmdsXCIgOiBcInVzaW5nIGV4cGVyaW1lbnRhbC13ZWJnbFwiKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGdsID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZ2wgPT0gbnVsbCkgZ2wgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBnbDtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImdldFVpbnQ4QXJyYXlGcm9tSFRNTEltYWdlRWxlbWVudFwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBVaW50OEFycmF5IGZyb20gSFRNTEltYWdlRWxlbWVudFxuICAgICAgICAgKiBAcGFyYW0ge0hUTUxJbWFnZUVsZW1lbnR9IGltYWdlRWxlbWVudFxuICAgICAgICAgKiBAcmV0dXJucyB7VWludDhDbGFtcGVkQXJyYXl9XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0VWludDhBcnJheUZyb21IVE1MSW1hZ2VFbGVtZW50KGltYWdlRWxlbWVudCkge1xuICAgICAgICAgICAgdmFyIGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgICAgIGUud2lkdGggPSBpbWFnZUVsZW1lbnQud2lkdGg7XG4gICAgICAgICAgICBlLmhlaWdodCA9IGltYWdlRWxlbWVudC5oZWlnaHQ7XG4gICAgICAgICAgICB2YXIgY3R4MkRfdGV4ID0gZS5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgICAgICAgICBjdHgyRF90ZXguZHJhd0ltYWdlKGltYWdlRWxlbWVudCwgMCwgMCk7XG4gICAgICAgICAgICB2YXIgYXJyYXlUZXggPSBjdHgyRF90ZXguZ2V0SW1hZ2VEYXRhKDAsIDAsIGltYWdlRWxlbWVudC53aWR0aCwgaW1hZ2VFbGVtZW50LmhlaWdodCk7XG5cbiAgICAgICAgICAgIHJldHVybiBhcnJheVRleC5kYXRhO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZG90NFwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERvdCBwcm9kdWN0IHZlY3RvcjRmbG9hdFxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGRvdDQodmVjdG9yNEEsIHZlY3RvcjRCKSB7XG4gICAgICAgICAgICByZXR1cm4gdmVjdG9yNEFbMF0gKiB2ZWN0b3I0QlswXSArIHZlY3RvcjRBWzFdICogdmVjdG9yNEJbMV0gKyB2ZWN0b3I0QVsyXSAqIHZlY3RvcjRCWzJdICsgdmVjdG9yNEFbM10gKiB2ZWN0b3I0QlszXTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImZyYWN0XCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogQ29tcHV0ZSB0aGUgZnJhY3Rpb25hbCBwYXJ0IG9mIHRoZSBhcmd1bWVudC4gZnJhY3QocGkpPTAuMTQxNTkyNjUuLi5cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBmcmFjdChudW1iZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBudW1iZXIgPiAwID8gbnVtYmVyIC0gTWF0aC5mbG9vcihudW1iZXIpIDogbnVtYmVyIC0gTWF0aC5jZWlsKG51bWJlcik7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJwYWNrR0xTTEZ1bmN0aW9uU3RyaW5nXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHBhY2sgR0xTTCBmdW5jdGlvbiBzdHJpbmdcbiAgICAgICAgICogQHJldHVybnMge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBwYWNrR0xTTEZ1bmN0aW9uU3RyaW5nKCkge1xuICAgICAgICAgICAgcmV0dXJuICd2ZWM0IHBhY2sgKGZsb2F0IGRlcHRoKSB7XFxuJyArICdjb25zdCB2ZWM0IGJpYXMgPSB2ZWM0KDEuMCAvIDI1NS4wLFxcbicgKyAnMS4wIC8gMjU1LjAsXFxuJyArICcxLjAgLyAyNTUuMCxcXG4nICsgJzAuMCk7XFxuJyArICdmbG9hdCByID0gZGVwdGg7XFxuJyArICdmbG9hdCBnID0gZnJhY3QociAqIDI1NS4wKTtcXG4nICsgJ2Zsb2F0IGIgPSBmcmFjdChnICogMjU1LjApO1xcbicgKyAnZmxvYXQgYSA9IGZyYWN0KGIgKiAyNTUuMCk7XFxuJyArICd2ZWM0IGNvbG91ciA9IHZlYzQociwgZywgYiwgYSk7XFxuJyArICdyZXR1cm4gY29sb3VyIC0gKGNvbG91ci55end3ICogYmlhcyk7XFxuJyArICd9XFxuJztcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInVucGFja0dMU0xGdW5jdGlvblN0cmluZ1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCB1bnBhY2sgR0xTTCBmdW5jdGlvbiBzdHJpbmdcbiAgICAgICAgICogQHJldHVybnMge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiB1bnBhY2tHTFNMRnVuY3Rpb25TdHJpbmcoKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2Zsb2F0IHVucGFjayAodmVjNCBjb2xvdXIpIHtcXG4nICsgJ2NvbnN0IHZlYzQgYml0U2hpZnRzID0gdmVjNCgxLjAsXFxuJyArICcxLjAgLyAyNTUuMCxcXG4nICsgJzEuMCAvICgyNTUuMCAqIDI1NS4wKSxcXG4nICsgJzEuMCAvICgyNTUuMCAqIDI1NS4wICogMjU1LjApKTtcXG4nICsgJ3JldHVybiBkb3QoY29sb3VyLCBiaXRTaGlmdHMpO1xcbicgKyAnfVxcbic7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJnZXRPdXRwdXRCdWZmZXJzXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogZ2V0T3V0cHV0QnVmZmVyc1xuICAgICAgICAgKiBAcGFyYW0ge1dlYkNMR0xLZXJuZWx8V2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbX0gcHJvZ1xuICAgICAgICAgKiBAcGFyYW0ge0FycmF5PFdlYkNMR0xCdWZmZXI+fSBidWZmZXJzXG4gICAgICAgICAqIEByZXR1cm5zIHtBcnJheTxXZWJDTEdMQnVmZmVyPn1cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRPdXRwdXRCdWZmZXJzKHByb2csIGJ1ZmZlcnMpIHtcbiAgICAgICAgICAgIHZhciBvdXRwdXRCdWZmID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChwcm9nLm91dHB1dCAhPT0gdW5kZWZpbmVkICYmIHByb2cub3V0cHV0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0QnVmZiA9IFtdO1xuICAgICAgICAgICAgICAgIGlmIChwcm9nLm91dHB1dFswXSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDwgcHJvZy5vdXRwdXQubGVuZ3RoOyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vaWYoYnVmZmVycy5oYXNPd25Qcm9wZXJ0eShwcm9nLm91dHB1dFtuXSkgPT0gZmFsc2UgJiYgX2FsZXJ0ZWQgPT0gZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICBfYWxlcnRlZCA9IHRydWUsIGFsZXJ0KFwib3V0cHV0IGFyZ3VtZW50IFwiK3Byb2cub3V0cHV0W25dK1wiIG5vdCBmb3VuZCBpbiBidWZmZXJzLiBhZGQgZGVzaXJlZCBhcmd1bWVudCBhcyBzaGFyZWRcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dEJ1ZmZbbl0gPSBidWZmZXJzW3Byb2cub3V0cHV0W25dXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBvdXRwdXRCdWZmID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvdXRwdXRCdWZmO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwicGFyc2VTb3VyY2VcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBwYXJzZVNvdXJjZVxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gc291cmNlXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZXNcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBpc0dMMlxuICAgICAgICAgKiBAcmV0dXJucyB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHBhcnNlU291cmNlKHNvdXJjZSwgdmFsdWVzLCBpc0dMMikge1xuICAgICAgICAgICAgdmFyIHRleFN0ciA9IGlzR0wyID09PSB0cnVlID8gXCJ0ZXh0dXJlXCIgOiBcInRleHR1cmUyRFwiO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlZ2V4cCA9IG5ldyBSZWdFeHAoa2V5ICsgXCJcXFxcWyg/IVxcXFxkKS4qP1xcXFxdXCIsIFwiZ21cIik7IC8vIGF2b2lkIG5vcm1hbCB1bmlmb3JtIGFycmF5c1xuICAgICAgICAgICAgICAgIHZhciB2YXJNYXRjaGVzID0gc291cmNlLm1hdGNoKHJlZ2V4cCk7IC8vIFwiU2VhcmNoIGN1cnJlbnQgXCJhcmdOYW1lXCIgaW4gc291cmNlIGFuZCBzdG9yZSBpbiBhcnJheSB2YXJNYXRjaGVzXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyh2YXJNYXRjaGVzKTtcbiAgICAgICAgICAgICAgICBpZiAodmFyTWF0Y2hlcyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG5CID0gMCwgZkIgPSB2YXJNYXRjaGVzLmxlbmd0aDsgbkIgPCBmQjsgbkIrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm9yIGVhY2ggdmFyTWF0Y2hlcyAoXCJBW3hdXCIsIFwiQVt4XVwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlZ2V4cE5hdGl2ZUdMID0gbmV3IFJlZ0V4cCgnYGBgKFxcc3xcXHQpKmdsLionICsgdmFyTWF0Y2hlc1tuQl0gKyAnLipgYGBbXmBgYChcXHN8XFx0KSpnbF0nLCBcImdtXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlZ2V4cE5hdGl2ZUdMTWF0Y2hlcyA9IHNvdXJjZS5tYXRjaChyZWdleHBOYXRpdmVHTCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVnZXhwTmF0aXZlR0xNYXRjaGVzID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZSA9IHZhck1hdGNoZXNbbkJdLnNwbGl0KCdbJylbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhcmkgPSB2YXJNYXRjaGVzW25CXS5zcGxpdCgnWycpWzFdLnNwbGl0KCddJylbMF07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWFwID0geyAnZmxvYXQ0X2Zyb21TYW1wbGVyJzogc291cmNlLnJlcGxhY2UobmFtZSArIFwiW1wiICsgdmFyaSArIFwiXVwiLCB0ZXhTdHIgKyAnKCcgKyBuYW1lICsgJywnICsgdmFyaSArICcpJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdmbG9hdF9mcm9tU2FtcGxlcic6IHNvdXJjZS5yZXBsYWNlKG5hbWUgKyBcIltcIiArIHZhcmkgKyBcIl1cIiwgdGV4U3RyICsgJygnICsgbmFtZSArICcsJyArIHZhcmkgKyAnKS54JyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdmbG9hdDRfZnJvbUF0dHInOiBzb3VyY2UucmVwbGFjZShuYW1lICsgXCJbXCIgKyB2YXJpICsgXCJdXCIsIG5hbWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZmxvYXRfZnJvbUF0dHInOiBzb3VyY2UucmVwbGFjZShuYW1lICsgXCJbXCIgKyB2YXJpICsgXCJdXCIsIG5hbWUpIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlID0gbWFwW3ZhbHVlc1trZXldLnR5cGVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc291cmNlID0gc291cmNlLnJlcGxhY2UoL2BgYChcXHN8XFx0KSpnbC9naSwgXCJcIikucmVwbGFjZSgvYGBgL2dpLCBcIlwiKS5yZXBsYWNlKC87L2dpLCBcIjtcXG5cIikucmVwbGFjZSgvfS9naSwgXCJ9XFxuXCIpLnJlcGxhY2UoL3svZ2ksIFwie1xcblwiKTtcbiAgICAgICAgICAgIHJldHVybiBzb3VyY2U7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJsaW5lc192ZXJ0ZXhfYXR0cnNcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBsaW5lc192ZXJ0ZXhfYXR0cnNcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHZhbHVlc1xuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzR0wyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gbGluZXNfdmVydGV4X2F0dHJzKHZhbHVlcywgaXNHTDIpIHtcbiAgICAgICAgICAgIHZhciBhdHRyU3RyID0gaXNHTDIgPT09IHRydWUgPyBcImluXCIgOiBcImF0dHJpYnV0ZVwiO1xuXG4gICAgICAgICAgICB2YXIgc3RyID0gJyc7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9IHsgJ2Zsb2F0NF9mcm9tU2FtcGxlcic6ICd1bmlmb3JtIHNhbXBsZXIyRCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXRfZnJvbVNhbXBsZXInOiAndW5pZm9ybSBzYW1wbGVyMkQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0NF9mcm9tQXR0cic6IGF0dHJTdHIgKyAnIHZlYzQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0X2Zyb21BdHRyJzogYXR0clN0ciArICcgZmxvYXQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0JzogJ3VuaWZvcm0gZmxvYXQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0NCc6ICd1bmlmb3JtIHZlYzQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ21hdDQnOiAndW5pZm9ybSBtYXQ0ICcgKyBrZXkgKyAnOycgfVt2YWx1ZXNba2V5XS50eXBlXSArICdcXG4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImxpbmVzX2ZyYWdtZW50X2F0dHJzXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogbGluZXNfZnJhZ21lbnRfYXR0cnNcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHZhbHVlc1xuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGxpbmVzX2ZyYWdtZW50X2F0dHJzKHZhbHVlcykge1xuICAgICAgICAgICAgdmFyIHN0ciA9ICcnO1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHZhbHVlcykge1xuICAgICAgICAgICAgICAgIHN0ciArPSB7ICdmbG9hdDRfZnJvbVNhbXBsZXInOiAndW5pZm9ybSBzYW1wbGVyMkQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0X2Zyb21TYW1wbGVyJzogJ3VuaWZvcm0gc2FtcGxlcjJEICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdCc6ICd1bmlmb3JtIGZsb2F0ICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdDQnOiAndW5pZm9ybSB2ZWM0ICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdtYXQ0JzogJ3VuaWZvcm0gbWF0NCAnICsga2V5ICsgJzsnIH1bdmFsdWVzW2tleV0udHlwZV0gKyAnXFxuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJsaW5lc19kcmF3QnVmZmVyc0luaXRcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBsaW5lc19kcmF3QnVmZmVyc0luaXRcbiAgICAgICAgICogQHBhcmFtIHtpbnR9IG1heERyYXdCdWZmZXJzXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gbGluZXNfZHJhd0J1ZmZlcnNJbml0KG1heERyYXdCdWZmZXJzKSB7XG4gICAgICAgICAgICB2YXIgc3RyID0gJyc7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMCwgZm4gPSBtYXhEcmF3QnVmZmVyczsgbiA8IGZuOyBuKyspIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0gJycgKyAnZmxvYXQgb3V0JyArIG4gKyAnX2Zsb2F0ID0gLTk5OS45OTk4OTtcXG4nICsgJ3ZlYzQgb3V0JyArIG4gKyAnX2Zsb2F0NDtcXG4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImxpbmVzX2RyYXdCdWZmZXJzV3JpdGVJbml0X0dMMlwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gbGluZXNfZHJhd0J1ZmZlcnNXcml0ZUluaXRfR0wyKG1heERyYXdCdWZmZXJzKSB7XG4gICAgICAgICAgICB2YXIgc3RyID0gJyc7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMCwgZm4gPSBtYXhEcmF3QnVmZmVyczsgbiA8IGZuOyBuKyspIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0gJycgKyAnbGF5b3V0KGxvY2F0aW9uID0gJyArIG4gKyAnKSBvdXQgdmVjNCBvdXRDb2wnICsgbiArICc7XFxuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJsaW5lc19kcmF3QnVmZmVyc1dyaXRlX0dMMlwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGxpbmVzX2RyYXdCdWZmZXJzV3JpdGVcbiAgICAgICAgICogQHBhcmFtIHtpbnR9IG1heERyYXdCdWZmZXJzXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gbGluZXNfZHJhd0J1ZmZlcnNXcml0ZV9HTDIobWF4RHJhd0J1ZmZlcnMpIHtcbiAgICAgICAgICAgIHZhciBzdHIgPSAnJztcbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmbiA9IG1heERyYXdCdWZmZXJzOyBuIDwgZm47IG4rKykge1xuICAgICAgICAgICAgICAgIHN0ciArPSAnJyArICdpZihvdXQnICsgbiArICdfZmxvYXQgIT0gLTk5OS45OTk4OSkgb3V0Q29sJyArIG4gKyAnID0gdmVjNChvdXQnICsgbiArICdfZmxvYXQsMC4wLDAuMCwxLjApO1xcbicgKyAnIGVsc2Ugb3V0Q29sJyArIG4gKyAnID0gb3V0JyArIG4gKyAnX2Zsb2F0NDtcXG4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImxpbmVzX2RyYXdCdWZmZXJzV3JpdGVcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBsaW5lc19kcmF3QnVmZmVyc1dyaXRlXG4gICAgICAgICAqIEBwYXJhbSB7aW50fSBtYXhEcmF3QnVmZmVyc1xuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGxpbmVzX2RyYXdCdWZmZXJzV3JpdGUobWF4RHJhd0J1ZmZlcnMpIHtcbiAgICAgICAgICAgIHZhciBzdHIgPSAnJztcbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmbiA9IG1heERyYXdCdWZmZXJzOyBuIDwgZm47IG4rKykge1xuICAgICAgICAgICAgICAgIHN0ciArPSAnJyArICdpZihvdXQnICsgbiArICdfZmxvYXQgIT0gLTk5OS45OTk4OSkgZ2xfRnJhZ0RhdGFbJyArIG4gKyAnXSA9IHZlYzQob3V0JyArIG4gKyAnX2Zsb2F0LDAuMCwwLjAsMS4wKTtcXG4nICsgJyBlbHNlIGdsX0ZyYWdEYXRhWycgKyBuICsgJ10gPSBvdXQnICsgbiArICdfZmxvYXQ0O1xcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY2hlY2tBcmdOYW1lSW5pdGlhbGl6YXRpb25cIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBjaGVja0FyZ05hbWVJbml0aWFsaXphdGlvblxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5WYWx1ZXNcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGFyZ05hbWVcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjaGVja0FyZ05hbWVJbml0aWFsaXphdGlvbihpblZhbHVlcywgYXJnTmFtZSkge1xuICAgICAgICAgICAgaWYgKGluVmFsdWVzLmhhc093blByb3BlcnR5KGFyZ05hbWUpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGluVmFsdWVzW2FyZ05hbWVdID0ge1xuICAgICAgICAgICAgICAgICAgICBcInR5cGVcIjogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgXCJleHBlY3RlZE1vZGVcIjogbnVsbCwgLy8gXCJBVFRSSUJVVEVcIiwgXCJTQU1QTEVSXCIsIFwiVU5JRk9STVwiXG4gICAgICAgICAgICAgICAgICAgIFwibG9jYXRpb25cIjogbnVsbCB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZ2V0X2dsb2JhbF9pZDNfR0xTTEZ1bmN0aW9uU3RyaW5nXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogZ2V0X2dsb2JhbF9pZDNfR0xTTEZ1bmN0aW9uU3RyaW5nXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0X2dsb2JhbF9pZDNfR0xTTEZ1bmN0aW9uU3RyaW5nKCkge1xuICAgICAgICAgICAgcmV0dXJuICcnICsgJ3ZlYzIgZ2V0X2dsb2JhbF9pZChmbG9hdCBpZCwgZmxvYXQgYnVmZmVyV2lkdGgsIGZsb2F0IGdlb21ldHJ5TGVuZ3RoKSB7XFxuJyArICdmbG9hdCB0ZXhlbFNpemUgPSAxLjAvYnVmZmVyV2lkdGg7JyArICdmbG9hdCBudW0gPSAoaWQqZ2VvbWV0cnlMZW5ndGgpL2J1ZmZlcldpZHRoOycgKyAnZmxvYXQgY29sdW1uID0gZnJhY3QobnVtKSsodGV4ZWxTaXplLzIuMCk7JyArICdmbG9hdCByb3cgPSAoZmxvb3IobnVtKS9idWZmZXJXaWR0aCkrKHRleGVsU2l6ZS8yLjApOycgKyAncmV0dXJuIHZlYzIoY29sdW1uLCByb3cpOycgKyAnfVxcbic7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJnZXRfZ2xvYmFsX2lkMl9HTFNMRnVuY3Rpb25TdHJpbmdcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBnZXRfZ2xvYmFsX2lkMl9HTFNMRnVuY3Rpb25TdHJpbmdcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRfZ2xvYmFsX2lkMl9HTFNMRnVuY3Rpb25TdHJpbmcoKSB7XG4gICAgICAgICAgICByZXR1cm4gJycgKyAndmVjMiBnZXRfZ2xvYmFsX2lkKHZlYzIgaWQsIGZsb2F0IGJ1ZmZlcldpZHRoKSB7XFxuJyArICdmbG9hdCB0ZXhlbFNpemUgPSAxLjAvYnVmZmVyV2lkdGg7JyArICdmbG9hdCBjb2x1bW4gPSAoaWQueC9idWZmZXJXaWR0aCkrKHRleGVsU2l6ZS8yLjApOycgKyAnZmxvYXQgcm93ID0gKGlkLnkvYnVmZmVyV2lkdGgpKyh0ZXhlbFNpemUvMi4wKTsnICsgJ3JldHVybiB2ZWMyKGNvbHVtbiwgcm93KTsnICsgJ31cXG4nO1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIFdlYkNMR0xVdGlscztcbn0oKTtcblxuZ2xvYmFsLldlYkNMR0xVdGlscyA9IFdlYkNMR0xVdGlscztcbm1vZHVsZS5leHBvcnRzLldlYkNMR0xVdGlscyA9IFdlYkNMR0xVdGlsczsiXX0=
