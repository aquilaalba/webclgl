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
                    "varname": null,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvd2ViY2xnbC9XZWJDTEdMVXRpbHMuY2xhc3MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9cmV0dXJuIGV9KSgpIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0oKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuLyoqIFxuKiBVdGlsaXRpZXNcbiogQGNsYXNzXG4qIEBjb25zdHJ1Y3RvclxuKi9cbnZhciBXZWJDTEdMVXRpbHMgPSBleHBvcnRzLldlYkNMR0xVdGlscyA9IGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBXZWJDTEdMVXRpbHMoKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBXZWJDTEdMVXRpbHMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGxvYWRRdWFkXG4gICAgICovXG5cblxuICAgIF9jcmVhdGVDbGFzcyhXZWJDTEdMVXRpbHMsIFt7XG4gICAgICAgIGtleTogXCJsb2FkUXVhZFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gbG9hZFF1YWQobm9kZSwgbGVuZ3RoLCBoZWlnaHQpIHtcbiAgICAgICAgICAgIHZhciBsID0gbGVuZ3RoID09PSB1bmRlZmluZWQgfHwgbGVuZ3RoID09PSBudWxsID8gMC41IDogbGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGggPSBoZWlnaHQgPT09IHVuZGVmaW5lZCB8fCBoZWlnaHQgPT09IG51bGwgPyAwLjUgOiBoZWlnaHQ7XG4gICAgICAgICAgICB0aGlzLnZlcnRleEFycmF5ID0gWy1sLCAtaCwgMC4wLCBsLCAtaCwgMC4wLCBsLCBoLCAwLjAsIC1sLCBoLCAwLjBdO1xuXG4gICAgICAgICAgICB0aGlzLnRleHR1cmVBcnJheSA9IFswLjAsIDAuMCwgMC4wLCAxLjAsIDAuMCwgMC4wLCAxLjAsIDEuMCwgMC4wLCAwLjAsIDEuMCwgMC4wXTtcblxuICAgICAgICAgICAgdGhpcy5pbmRleEFycmF5ID0gWzAsIDEsIDIsIDAsIDIsIDNdO1xuXG4gICAgICAgICAgICB2YXIgbWVzaE9iamVjdCA9IHt9O1xuICAgICAgICAgICAgbWVzaE9iamVjdC52ZXJ0ZXhBcnJheSA9IHRoaXMudmVydGV4QXJyYXk7XG4gICAgICAgICAgICBtZXNoT2JqZWN0LnRleHR1cmVBcnJheSA9IHRoaXMudGV4dHVyZUFycmF5O1xuICAgICAgICAgICAgbWVzaE9iamVjdC5pbmRleEFycmF5ID0gdGhpcy5pbmRleEFycmF5O1xuXG4gICAgICAgICAgICByZXR1cm4gbWVzaE9iamVjdDtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImNyZWF0ZVNoYWRlclwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGNyZWF0ZVNoYWRlclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNyZWF0ZVNoYWRlcihnbCwgbmFtZSwgc291cmNlVmVydGV4LCBzb3VyY2VGcmFnbWVudCwgc2hhZGVyUHJvZ3JhbSkge1xuICAgICAgICAgICAgdmFyIF9zdiA9IGZhbHNlLFxuICAgICAgICAgICAgICAgIF9zZiA9IGZhbHNlO1xuXG4gICAgICAgICAgICB2YXIgbWFrZURlYnVnID0gZnVuY3Rpb24gKGluZm9Mb2csIHNoYWRlcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGluZm9Mb2cpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGFyckVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIHZhciBlcnJvcnMgPSBpbmZvTG9nLnNwbGl0KFwiXFxuXCIpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmID0gZXJyb3JzLmxlbmd0aDsgbiA8IGY7IG4rKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3JzW25dLm1hdGNoKC9eRVJST1IvZ2ltKSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXhwbCA9IGVycm9yc1tuXS5zcGxpdCgnOicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxpbmUgPSBwYXJzZUludChleHBsWzJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyckVycm9ycy5wdXNoKFtsaW5lLCBlcnJvcnNbbl1dKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgc291ciA9IGdsLmdldFNoYWRlclNvdXJjZShzaGFkZXIpLnNwbGl0KFwiXFxuXCIpO1xuICAgICAgICAgICAgICAgIHNvdXIudW5zaGlmdChcIlwiKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfbiA9IDAsIF9mID0gc291ci5sZW5ndGg7IF9uIDwgX2Y7IF9uKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpbmVXaXRoRXJyb3IgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVycm9yU3RyID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGUgPSAwLCBmZSA9IGFyckVycm9ycy5sZW5ndGg7IGUgPCBmZTsgZSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoX24gPT09IGFyckVycm9yc1tlXVswXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVXaXRoRXJyb3IgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yU3RyID0gYXJyRXJyb3JzW2VdWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChsaW5lV2l0aEVycm9yID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCIlY1wiICsgX24gKyAnICVjJyArIHNvdXJbX25dLCBcImNvbG9yOmJsYWNrXCIsIFwiY29sb3I6Ymx1ZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCclY+KWuuKWuiVjJyArIF9uICsgJyAlYycgKyBzb3VyW19uXSArICdcXG4lYycgKyBlcnJvclN0ciwgXCJjb2xvcjpyZWRcIiwgXCJjb2xvcjpibGFja1wiLCBcImNvbG9yOmJsdWVcIiwgXCJjb2xvcjpyZWRcIik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgICAgIHZhciBzaGFkZXJWZXJ0ZXggPSBnbC5jcmVhdGVTaGFkZXIoZ2wuVkVSVEVYX1NIQURFUik7XG4gICAgICAgICAgICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyVmVydGV4LCBzb3VyY2VWZXJ0ZXgpO1xuICAgICAgICAgICAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXJWZXJ0ZXgpO1xuICAgICAgICAgICAgaWYgKCFnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyVmVydGV4LCBnbC5DT01QSUxFX1NUQVRVUykpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5mb0xvZyA9IGdsLmdldFNoYWRlckluZm9Mb2coc2hhZGVyVmVydGV4KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIiVjXCIgKyBuYW1lICsgJyBFUlJPUiAodmVydGV4IHByb2dyYW0pJywgXCJjb2xvcjpyZWRcIik7XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5mb0xvZyAhPT0gdW5kZWZpbmVkICYmIGluZm9Mb2cgIT09IG51bGwpIG1ha2VEZWJ1ZyhpbmZvTG9nLCBzaGFkZXJWZXJ0ZXgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBnbC5hdHRhY2hTaGFkZXIoc2hhZGVyUHJvZ3JhbSwgc2hhZGVyVmVydGV4KTtcbiAgICAgICAgICAgICAgICBfc3YgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgc2hhZGVyRnJhZ21lbnQgPSBnbC5jcmVhdGVTaGFkZXIoZ2wuRlJBR01FTlRfU0hBREVSKTtcbiAgICAgICAgICAgIGdsLnNoYWRlclNvdXJjZShzaGFkZXJGcmFnbWVudCwgc291cmNlRnJhZ21lbnQpO1xuICAgICAgICAgICAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXJGcmFnbWVudCk7XG4gICAgICAgICAgICBpZiAoIWdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXJGcmFnbWVudCwgZ2wuQ09NUElMRV9TVEFUVVMpKSB7XG4gICAgICAgICAgICAgICAgdmFyIF9pbmZvTG9nID0gZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXJGcmFnbWVudCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCIlY1wiICsgbmFtZSArICcgRVJST1IgKGZyYWdtZW50IHByb2dyYW0pJywgXCJjb2xvcjpyZWRcIik7XG5cbiAgICAgICAgICAgICAgICBpZiAoX2luZm9Mb2cgIT09IHVuZGVmaW5lZCAmJiBfaW5mb0xvZyAhPT0gbnVsbCkgbWFrZURlYnVnKF9pbmZvTG9nLCBzaGFkZXJGcmFnbWVudCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGdsLmF0dGFjaFNoYWRlcihzaGFkZXJQcm9ncmFtLCBzaGFkZXJGcmFnbWVudCk7XG4gICAgICAgICAgICAgICAgX3NmID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKF9zdiA9PT0gdHJ1ZSAmJiBfc2YgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBnbC5saW5rUHJvZ3JhbShzaGFkZXJQcm9ncmFtKTtcbiAgICAgICAgICAgICAgICB2YXIgc3VjY2VzcyA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIoc2hhZGVyUHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMpO1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBzaGFkZXIgcHJvZ3JhbSAnICsgbmFtZSArICc6XFxuICcpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbG9nID0gZ2wuZ2V0UHJvZ3JhbUluZm9Mb2coc2hhZGVyUHJvZ3JhbSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2cgIT09IHVuZGVmaW5lZCAmJiBsb2cgIT09IG51bGwpIGNvbnNvbGUubG9nKGxvZyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInBhY2tcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQYWNrIDFmbG9hdCAoMC4wLTEuMCkgdG8gNGZsb2F0IHJnYmEgKDAuMC0xLjAsIDAuMC0xLjAsIDAuMC0xLjAsIDAuMC0xLjApXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcGFjayh2KSB7XG4gICAgICAgICAgICB2YXIgYmlhcyA9IFsxLjAgLyAyNTUuMCwgMS4wIC8gMjU1LjAsIDEuMCAvIDI1NS4wLCAwLjBdO1xuXG4gICAgICAgICAgICB2YXIgciA9IHY7XG4gICAgICAgICAgICB2YXIgZyA9IHRoaXMuZnJhY3QociAqIDI1NS4wKTtcbiAgICAgICAgICAgIHZhciBiID0gdGhpcy5mcmFjdChnICogMjU1LjApO1xuICAgICAgICAgICAgdmFyIGEgPSB0aGlzLmZyYWN0KGIgKiAyNTUuMCk7XG4gICAgICAgICAgICB2YXIgY29sb3VyID0gW3IsIGcsIGIsIGFdO1xuXG4gICAgICAgICAgICB2YXIgZGQgPSBbY29sb3VyWzFdICogYmlhc1swXSwgY29sb3VyWzJdICogYmlhc1sxXSwgY29sb3VyWzNdICogYmlhc1syXSwgY29sb3VyWzNdICogYmlhc1szXV07XG5cbiAgICAgICAgICAgIHJldHVybiBbY29sb3VyWzBdIC0gZGRbMF0sIGNvbG91clsxXSAtIGRkWzFdLCBjb2xvdXJbMl0gLSBkZFsyXSwgY29sb3VyWzNdIC0gZGRbM11dO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwidW5wYWNrXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogVW5wYWNrIDRmbG9hdCByZ2JhICgwLjAtMS4wLCAwLjAtMS4wLCAwLjAtMS4wLCAwLjAtMS4wKSB0byAxZmxvYXQgKDAuMC0xLjApXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gdW5wYWNrKGNvbG91cikge1xuICAgICAgICAgICAgdmFyIGJpdFNoaWZ0cyA9IFsxLjAsIDEuMCAvIDI1NS4wLCAxLjAgLyAoMjU1LjAgKiAyNTUuMCksIDEuMCAvICgyNTUuMCAqIDI1NS4wICogMjU1LjApXTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRvdDQoY29sb3VyLCBiaXRTaGlmdHMpO1xuICAgICAgICB9XG4gICAgfV0sIFt7XG4gICAgICAgIGtleTogXCJnZXRXZWJHTENvbnRleHRGcm9tQ2FudmFzXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogZ2V0V2ViR0xDb250ZXh0RnJvbUNhbnZhc1xuICAgICAgICAgKiBAcGFyYW0ge0hUTUxDYW52YXNFbGVtZW50fSBjYW52YXNcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGN0eE9wdFxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldFdlYkdMQ29udGV4dEZyb21DYW52YXMoY2FudmFzLCBjdHhPcHQpIHtcbiAgICAgICAgICAgIHZhciBnbCA9IG51bGw7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmIChjdHhPcHQgPT09IHVuZGVmaW5lZCB8fCBjdHhPcHQgPT09IG51bGwpIGdsID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbDJcIik7ZWxzZSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2wyXCIsIGN0eE9wdCk7XG5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhnbCA9PSBudWxsID8gXCJubyB3ZWJnbDJcIiA6IFwidXNpbmcgd2ViZ2wyXCIpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGdsID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChnbCA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN0eE9wdCA9PT0gdW5kZWZpbmVkIHx8IGN0eE9wdCA9PT0gbnVsbCkgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcImV4cGVyaW1lbnRhbC13ZWJnbDJcIik7ZWxzZSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiZXhwZXJpbWVudGFsLXdlYmdsMlwiLCBjdHhPcHQpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGdsID09IG51bGwgPyBcIm5vIGV4cGVyaW1lbnRhbC13ZWJnbDJcIiA6IFwidXNpbmcgZXhwZXJpbWVudGFsLXdlYmdsMlwiKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGdsID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZ2wgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdHhPcHQgPT09IHVuZGVmaW5lZCB8fCBjdHhPcHQgPT09IG51bGwpIGdsID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbFwiKTtlbHNlIGdsID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbFwiLCBjdHhPcHQpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGdsID09IG51bGwgPyBcIm5vIHdlYmdsXCIgOiBcInVzaW5nIHdlYmdsXCIpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZ2wgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChnbCA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN0eE9wdCA9PT0gdW5kZWZpbmVkIHx8IGN0eE9wdCA9PT0gbnVsbCkgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcImV4cGVyaW1lbnRhbC13ZWJnbFwiKTtlbHNlIGdsID0gY2FudmFzLmdldENvbnRleHQoXCJleHBlcmltZW50YWwtd2ViZ2xcIiwgY3R4T3B0KTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhnbCA9PSBudWxsID8gXCJubyBleHBlcmltZW50YWwtd2ViZ2xcIiA6IFwidXNpbmcgZXhwZXJpbWVudGFsLXdlYmdsXCIpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZ2wgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChnbCA9PSBudWxsKSBnbCA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGdsO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZ2V0VWludDhBcnJheUZyb21IVE1MSW1hZ2VFbGVtZW50XCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IFVpbnQ4QXJyYXkgZnJvbSBIVE1MSW1hZ2VFbGVtZW50XG4gICAgICAgICAqIEBwYXJhbSB7SFRNTEltYWdlRWxlbWVudH0gaW1hZ2VFbGVtZW50XG4gICAgICAgICAqIEByZXR1cm5zIHtVaW50OENsYW1wZWRBcnJheX1cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRVaW50OEFycmF5RnJvbUhUTUxJbWFnZUVsZW1lbnQoaW1hZ2VFbGVtZW50KSB7XG4gICAgICAgICAgICB2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICAgICAgZS53aWR0aCA9IGltYWdlRWxlbWVudC53aWR0aDtcbiAgICAgICAgICAgIGUuaGVpZ2h0ID0gaW1hZ2VFbGVtZW50LmhlaWdodDtcbiAgICAgICAgICAgIHZhciBjdHgyRF90ZXggPSBlLmdldENvbnRleHQoXCIyZFwiKTtcbiAgICAgICAgICAgIGN0eDJEX3RleC5kcmF3SW1hZ2UoaW1hZ2VFbGVtZW50LCAwLCAwKTtcbiAgICAgICAgICAgIHZhciBhcnJheVRleCA9IGN0eDJEX3RleC5nZXRJbWFnZURhdGEoMCwgMCwgaW1hZ2VFbGVtZW50LndpZHRoLCBpbWFnZUVsZW1lbnQuaGVpZ2h0KTtcblxuICAgICAgICAgICAgcmV0dXJuIGFycmF5VGV4LmRhdGE7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJkb3Q0XCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogRG90IHByb2R1Y3QgdmVjdG9yNGZsb2F0XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZG90NCh2ZWN0b3I0QSwgdmVjdG9yNEIpIHtcbiAgICAgICAgICAgIHJldHVybiB2ZWN0b3I0QVswXSAqIHZlY3RvcjRCWzBdICsgdmVjdG9yNEFbMV0gKiB2ZWN0b3I0QlsxXSArIHZlY3RvcjRBWzJdICogdmVjdG9yNEJbMl0gKyB2ZWN0b3I0QVszXSAqIHZlY3RvcjRCWzNdO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZnJhY3RcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb21wdXRlIHRoZSBmcmFjdGlvbmFsIHBhcnQgb2YgdGhlIGFyZ3VtZW50LiBmcmFjdChwaSk9MC4xNDE1OTI2NS4uLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGZyYWN0KG51bWJlcikge1xuICAgICAgICAgICAgcmV0dXJuIG51bWJlciA+IDAgPyBudW1iZXIgLSBNYXRoLmZsb29yKG51bWJlcikgOiBudW1iZXIgLSBNYXRoLmNlaWwobnVtYmVyKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInBhY2tHTFNMRnVuY3Rpb25TdHJpbmdcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgcGFjayBHTFNMIGZ1bmN0aW9uIHN0cmluZ1xuICAgICAgICAgKiBAcmV0dXJucyB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHBhY2tHTFNMRnVuY3Rpb25TdHJpbmcoKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3ZlYzQgcGFjayAoZmxvYXQgZGVwdGgpIHtcXG4nICsgJ2NvbnN0IHZlYzQgYmlhcyA9IHZlYzQoMS4wIC8gMjU1LjAsXFxuJyArICcxLjAgLyAyNTUuMCxcXG4nICsgJzEuMCAvIDI1NS4wLFxcbicgKyAnMC4wKTtcXG4nICsgJ2Zsb2F0IHIgPSBkZXB0aDtcXG4nICsgJ2Zsb2F0IGcgPSBmcmFjdChyICogMjU1LjApO1xcbicgKyAnZmxvYXQgYiA9IGZyYWN0KGcgKiAyNTUuMCk7XFxuJyArICdmbG9hdCBhID0gZnJhY3QoYiAqIDI1NS4wKTtcXG4nICsgJ3ZlYzQgY29sb3VyID0gdmVjNChyLCBnLCBiLCBhKTtcXG4nICsgJ3JldHVybiBjb2xvdXIgLSAoY29sb3VyLnl6d3cgKiBiaWFzKTtcXG4nICsgJ31cXG4nO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwidW5wYWNrR0xTTEZ1bmN0aW9uU3RyaW5nXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHVucGFjayBHTFNMIGZ1bmN0aW9uIHN0cmluZ1xuICAgICAgICAgKiBAcmV0dXJucyB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHVucGFja0dMU0xGdW5jdGlvblN0cmluZygpIHtcbiAgICAgICAgICAgIHJldHVybiAnZmxvYXQgdW5wYWNrICh2ZWM0IGNvbG91cikge1xcbicgKyAnY29uc3QgdmVjNCBiaXRTaGlmdHMgPSB2ZWM0KDEuMCxcXG4nICsgJzEuMCAvIDI1NS4wLFxcbicgKyAnMS4wIC8gKDI1NS4wICogMjU1LjApLFxcbicgKyAnMS4wIC8gKDI1NS4wICogMjU1LjAgKiAyNTUuMCkpO1xcbicgKyAncmV0dXJuIGRvdChjb2xvdXIsIGJpdFNoaWZ0cyk7XFxuJyArICd9XFxuJztcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImdldE91dHB1dEJ1ZmZlcnNcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBnZXRPdXRwdXRCdWZmZXJzXG4gICAgICAgICAqIEBwYXJhbSB7V2ViQ0xHTEtlcm5lbHxXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtfSBwcm9nXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXk8V2ViQ0xHTEJ1ZmZlcj59IGJ1ZmZlcnNcbiAgICAgICAgICogQHJldHVybnMge0FycmF5PFdlYkNMR0xCdWZmZXI+fVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldE91dHB1dEJ1ZmZlcnMocHJvZywgYnVmZmVycykge1xuICAgICAgICAgICAgdmFyIG91dHB1dEJ1ZmYgPSBudWxsO1xuICAgICAgICAgICAgaWYgKHByb2cub3V0cHV0ICE9PSB1bmRlZmluZWQgJiYgcHJvZy5vdXRwdXQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRCdWZmID0gW107XG4gICAgICAgICAgICAgICAgaWYgKHByb2cub3V0cHV0WzBdICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPCBwcm9nLm91dHB1dC5sZW5ndGg7IG4rKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9pZihidWZmZXJzLmhhc093blByb3BlcnR5KHByb2cub3V0cHV0W25dKSA9PSBmYWxzZSAmJiBfYWxlcnRlZCA9PSBmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgIF9hbGVydGVkID0gdHJ1ZSwgYWxlcnQoXCJvdXRwdXQgYXJndW1lbnQgXCIrcHJvZy5vdXRwdXRbbl0rXCIgbm90IGZvdW5kIGluIGJ1ZmZlcnMuIGFkZCBkZXNpcmVkIGFyZ3VtZW50IGFzIHNoYXJlZFwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0QnVmZltuXSA9IGJ1ZmZlcnNbcHJvZy5vdXRwdXRbbl1dO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIG91dHB1dEJ1ZmYgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG91dHB1dEJ1ZmY7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJwYXJzZVNvdXJjZVwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIHBhcnNlU291cmNlXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzb3VyY2VcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHZhbHVlc1xuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzR0wyXG4gICAgICAgICAqIEByZXR1cm5zIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcGFyc2VTb3VyY2Uoc291cmNlLCB2YWx1ZXMsIGlzR0wyKSB7XG4gICAgICAgICAgICB2YXIgdGV4U3RyID0gaXNHTDIgPT09IHRydWUgPyBcInRleHR1cmVcIiA6IFwidGV4dHVyZTJEXCI7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB2YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVnZXhwID0gbmV3IFJlZ0V4cChrZXkgKyBcIlxcXFxbKD8hXFxcXGQpLio/XFxcXF1cIiwgXCJnbVwiKTsgLy8gYXZvaWQgbm9ybWFsIHVuaWZvcm0gYXJyYXlzXG4gICAgICAgICAgICAgICAgdmFyIHZhck1hdGNoZXMgPSBzb3VyY2UubWF0Y2gocmVnZXhwKTsgLy8gXCJTZWFyY2ggY3VycmVudCBcImFyZ05hbWVcIiBpbiBzb3VyY2UgYW5kIHN0b3JlIGluIGFycmF5IHZhck1hdGNoZXNcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKHZhck1hdGNoZXMpO1xuICAgICAgICAgICAgICAgIGlmICh2YXJNYXRjaGVzICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbkIgPSAwLCBmQiA9IHZhck1hdGNoZXMubGVuZ3RoOyBuQiA8IGZCOyBuQisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmb3IgZWFjaCB2YXJNYXRjaGVzIChcIkFbeF1cIiwgXCJBW3hdXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVnZXhwTmF0aXZlR0wgPSBuZXcgUmVnRXhwKCdgYGAoXFxzfFxcdCkqZ2wuKicgKyB2YXJNYXRjaGVzW25CXSArICcuKmBgYFteYGBgKFxcc3xcXHQpKmdsXScsIFwiZ21cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVnZXhwTmF0aXZlR0xNYXRjaGVzID0gc291cmNlLm1hdGNoKHJlZ2V4cE5hdGl2ZUdMKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZWdleHBOYXRpdmVHTE1hdGNoZXMgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuYW1lID0gdmFyTWF0Y2hlc1tuQl0uc3BsaXQoJ1snKVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFyaSA9IHZhck1hdGNoZXNbbkJdLnNwbGl0KCdbJylbMV0uc3BsaXQoJ10nKVswXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtYXAgPSB7ICdmbG9hdDRfZnJvbVNhbXBsZXInOiBzb3VyY2UucmVwbGFjZShuYW1lICsgXCJbXCIgKyB2YXJpICsgXCJdXCIsIHRleFN0ciArICcoJyArIG5hbWUgKyAnLCcgKyB2YXJpICsgJyknKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0X2Zyb21TYW1wbGVyJzogc291cmNlLnJlcGxhY2UobmFtZSArIFwiW1wiICsgdmFyaSArIFwiXVwiLCB0ZXhTdHIgKyAnKCcgKyBuYW1lICsgJywnICsgdmFyaSArICcpLngnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0NF9mcm9tQXR0cic6IHNvdXJjZS5yZXBsYWNlKG5hbWUgKyBcIltcIiArIHZhcmkgKyBcIl1cIiwgbmFtZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdmbG9hdF9mcm9tQXR0cic6IHNvdXJjZS5yZXBsYWNlKG5hbWUgKyBcIltcIiArIHZhcmkgKyBcIl1cIiwgbmFtZSkgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2UgPSBtYXBbdmFsdWVzW2tleV0udHlwZV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzb3VyY2UgPSBzb3VyY2UucmVwbGFjZSgvYGBgKFxcc3xcXHQpKmdsL2dpLCBcIlwiKS5yZXBsYWNlKC9gYGAvZ2ksIFwiXCIpLnJlcGxhY2UoLzsvZ2ksIFwiO1xcblwiKS5yZXBsYWNlKC99L2dpLCBcIn1cXG5cIikucmVwbGFjZSgvey9naSwgXCJ7XFxuXCIpO1xuICAgICAgICAgICAgcmV0dXJuIHNvdXJjZTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImxpbmVzX3ZlcnRleF9hdHRyc1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGxpbmVzX3ZlcnRleF9hdHRyc1xuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gdmFsdWVzXG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNHTDJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBsaW5lc192ZXJ0ZXhfYXR0cnModmFsdWVzLCBpc0dMMikge1xuICAgICAgICAgICAgdmFyIGF0dHJTdHIgPSBpc0dMMiA9PT0gdHJ1ZSA/IFwiaW5cIiA6IFwiYXR0cmlidXRlXCI7XG5cbiAgICAgICAgICAgIHZhciBzdHIgPSAnJztcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB2YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0geyAnZmxvYXQ0X2Zyb21TYW1wbGVyJzogJ3VuaWZvcm0gc2FtcGxlcjJEICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdF9mcm9tU2FtcGxlcic6ICd1bmlmb3JtIHNhbXBsZXIyRCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXQ0X2Zyb21BdHRyJzogYXR0clN0ciArICcgdmVjNCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXRfZnJvbUF0dHInOiBhdHRyU3RyICsgJyBmbG9hdCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXQnOiAndW5pZm9ybSBmbG9hdCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXQ0JzogJ3VuaWZvcm0gdmVjNCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnbWF0NCc6ICd1bmlmb3JtIG1hdDQgJyArIGtleSArICc7JyB9W3ZhbHVlc1trZXldLnR5cGVdICsgJ1xcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwibGluZXNfZnJhZ21lbnRfYXR0cnNcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBsaW5lc19mcmFnbWVudF9hdHRyc1xuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gdmFsdWVzXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gbGluZXNfZnJhZ21lbnRfYXR0cnModmFsdWVzKSB7XG4gICAgICAgICAgICB2YXIgc3RyID0gJyc7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9IHsgJ2Zsb2F0NF9mcm9tU2FtcGxlcic6ICd1bmlmb3JtIHNhbXBsZXIyRCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXRfZnJvbVNhbXBsZXInOiAndW5pZm9ybSBzYW1wbGVyMkQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0JzogJ3VuaWZvcm0gZmxvYXQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0NCc6ICd1bmlmb3JtIHZlYzQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ21hdDQnOiAndW5pZm9ybSBtYXQ0ICcgKyBrZXkgKyAnOycgfVt2YWx1ZXNba2V5XS50eXBlXSArICdcXG4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImxpbmVzX2RyYXdCdWZmZXJzSW5pdFwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGxpbmVzX2RyYXdCdWZmZXJzSW5pdFxuICAgICAgICAgKiBAcGFyYW0ge2ludH0gbWF4RHJhd0J1ZmZlcnNcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBsaW5lc19kcmF3QnVmZmVyc0luaXQobWF4RHJhd0J1ZmZlcnMpIHtcbiAgICAgICAgICAgIHZhciBzdHIgPSAnJztcbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmbiA9IG1heERyYXdCdWZmZXJzOyBuIDwgZm47IG4rKykge1xuICAgICAgICAgICAgICAgIHN0ciArPSAnJyArICdmbG9hdCBvdXQnICsgbiArICdfZmxvYXQgPSAtOTk5Ljk5OTg5O1xcbicgKyAndmVjNCBvdXQnICsgbiArICdfZmxvYXQ0O1xcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwibGluZXNfZHJhd0J1ZmZlcnNXcml0ZUluaXRfR0wyXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBsaW5lc19kcmF3QnVmZmVyc1dyaXRlSW5pdF9HTDIobWF4RHJhd0J1ZmZlcnMpIHtcbiAgICAgICAgICAgIHZhciBzdHIgPSAnJztcbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmbiA9IG1heERyYXdCdWZmZXJzOyBuIDwgZm47IG4rKykge1xuICAgICAgICAgICAgICAgIHN0ciArPSAnJyArICdsYXlvdXQobG9jYXRpb24gPSAnICsgbiArICcpIG91dCB2ZWM0IG91dENvbCcgKyBuICsgJztcXG4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImxpbmVzX2RyYXdCdWZmZXJzV3JpdGVfR0wyXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogbGluZXNfZHJhd0J1ZmZlcnNXcml0ZVxuICAgICAgICAgKiBAcGFyYW0ge2ludH0gbWF4RHJhd0J1ZmZlcnNcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBsaW5lc19kcmF3QnVmZmVyc1dyaXRlX0dMMihtYXhEcmF3QnVmZmVycykge1xuICAgICAgICAgICAgdmFyIHN0ciA9ICcnO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGZuID0gbWF4RHJhd0J1ZmZlcnM7IG4gPCBmbjsgbisrKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9ICcnICsgJ2lmKG91dCcgKyBuICsgJ19mbG9hdCAhPSAtOTk5Ljk5OTg5KSBvdXRDb2wnICsgbiArICcgPSB2ZWM0KG91dCcgKyBuICsgJ19mbG9hdCwwLjAsMC4wLDEuMCk7XFxuJyArICcgZWxzZSBvdXRDb2wnICsgbiArICcgPSBvdXQnICsgbiArICdfZmxvYXQ0O1xcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwibGluZXNfZHJhd0J1ZmZlcnNXcml0ZVwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGxpbmVzX2RyYXdCdWZmZXJzV3JpdGVcbiAgICAgICAgICogQHBhcmFtIHtpbnR9IG1heERyYXdCdWZmZXJzXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gbGluZXNfZHJhd0J1ZmZlcnNXcml0ZShtYXhEcmF3QnVmZmVycykge1xuICAgICAgICAgICAgdmFyIHN0ciA9ICcnO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGZuID0gbWF4RHJhd0J1ZmZlcnM7IG4gPCBmbjsgbisrKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9ICcnICsgJ2lmKG91dCcgKyBuICsgJ19mbG9hdCAhPSAtOTk5Ljk5OTg5KSBnbF9GcmFnRGF0YVsnICsgbiArICddID0gdmVjNChvdXQnICsgbiArICdfZmxvYXQsMC4wLDAuMCwxLjApO1xcbicgKyAnIGVsc2UgZ2xfRnJhZ0RhdGFbJyArIG4gKyAnXSA9IG91dCcgKyBuICsgJ19mbG9hdDQ7XFxuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJjaGVja0FyZ05hbWVJbml0aWFsaXphdGlvblwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpblZhbHVlc1xuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gYXJnTmFtZVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uKGluVmFsdWVzLCBhcmdOYW1lKSB7XG4gICAgICAgICAgICBpZiAoaW5WYWx1ZXMuaGFzT3duUHJvcGVydHkoYXJnTmFtZSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgaW5WYWx1ZXNbYXJnTmFtZV0gPSB7XG4gICAgICAgICAgICAgICAgICAgIFwidmFybmFtZVwiOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBcInR5cGVcIjogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgXCJleHBlY3RlZE1vZGVcIjogbnVsbCwgLy8gXCJBVFRSSUJVVEVcIiwgXCJTQU1QTEVSXCIsIFwiVU5JRk9STVwiXG4gICAgICAgICAgICAgICAgICAgIFwibG9jYXRpb25cIjogbnVsbCB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZ2V0X2dsb2JhbF9pZDNfR0xTTEZ1bmN0aW9uU3RyaW5nXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogZ2V0X2dsb2JhbF9pZDNfR0xTTEZ1bmN0aW9uU3RyaW5nXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0X2dsb2JhbF9pZDNfR0xTTEZ1bmN0aW9uU3RyaW5nKCkge1xuICAgICAgICAgICAgcmV0dXJuICcnICsgJ3ZlYzIgZ2V0X2dsb2JhbF9pZChmbG9hdCBpZCwgZmxvYXQgYnVmZmVyV2lkdGgsIGZsb2F0IGdlb21ldHJ5TGVuZ3RoKSB7XFxuJyArICdmbG9hdCB0ZXhlbFNpemUgPSAxLjAvYnVmZmVyV2lkdGg7JyArICdmbG9hdCBudW0gPSAoaWQqZ2VvbWV0cnlMZW5ndGgpL2J1ZmZlcldpZHRoOycgKyAnZmxvYXQgY29sdW1uID0gZnJhY3QobnVtKSsodGV4ZWxTaXplLzIuMCk7JyArICdmbG9hdCByb3cgPSAoZmxvb3IobnVtKS9idWZmZXJXaWR0aCkrKHRleGVsU2l6ZS8yLjApOycgKyAncmV0dXJuIHZlYzIoY29sdW1uLCByb3cpOycgKyAnfVxcbic7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJnZXRfZ2xvYmFsX2lkMl9HTFNMRnVuY3Rpb25TdHJpbmdcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBnZXRfZ2xvYmFsX2lkMl9HTFNMRnVuY3Rpb25TdHJpbmdcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRfZ2xvYmFsX2lkMl9HTFNMRnVuY3Rpb25TdHJpbmcoKSB7XG4gICAgICAgICAgICByZXR1cm4gJycgKyAndmVjMiBnZXRfZ2xvYmFsX2lkKHZlYzIgaWQsIGZsb2F0IGJ1ZmZlcldpZHRoKSB7XFxuJyArICdmbG9hdCB0ZXhlbFNpemUgPSAxLjAvYnVmZmVyV2lkdGg7JyArICdmbG9hdCBjb2x1bW4gPSAoaWQueC9idWZmZXJXaWR0aCkrKHRleGVsU2l6ZS8yLjApOycgKyAnZmxvYXQgcm93ID0gKGlkLnkvYnVmZmVyV2lkdGgpKyh0ZXhlbFNpemUvMi4wKTsnICsgJ3JldHVybiB2ZWMyKGNvbHVtbiwgcm93KTsnICsgJ31cXG4nO1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIFdlYkNMR0xVdGlscztcbn0oKTtcblxuZ2xvYmFsLldlYkNMR0xVdGlscyA9IFdlYkNMR0xVdGlscztcbm1vZHVsZS5leHBvcnRzLldlYkNMR0xVdGlscyA9IFdlYkNMR0xVdGlsczsiXX0=
