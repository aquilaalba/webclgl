(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
(function (global){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.WebCLGL = undefined;

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}(); /*
     The MIT License (MIT)
     
     Copyright (c) <2013> <Roberto Gonzalez. http://stormcolour.appspot.com/>
     
     Permission is hereby granted, free of charge, to any person obtaining a copy
     of this software and associated documentation files (the "Software"), to deal
     in the Software without restriction, including without limitation the rights
     to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     copies of the Software, and to permit persons to whom the Software is
     furnished to do so, subject to the following conditions:
     
     The above copyright notice and this permission notice shall be included in
     all copies or substantial portions of the Software.
     
     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     THE SOFTWARE.
      */

var _WebCLGLBuffer = require("./WebCLGLBuffer.class");

var _WebCLGLKernel = require("./WebCLGLKernel.class");

var _WebCLGLVertexFragmentProgram = require("./WebCLGLVertexFragmentProgram.class");

var _WebCLGLUtils = require("./WebCLGLUtils.class");

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

/**
* Class for parallelization of calculations using the WebGL context similarly to webcl
* @class
* @param {WebGLRenderingContext} [webglcontext=null]
*/
var WebCLGL = exports.WebCLGL = function () {
    function WebCLGL(webglcontext) {
        _classCallCheck(this, WebCLGL);

        this.utils = new _WebCLGLUtils.WebCLGLUtils();

        this._gl = null;
        this.e = null;
        if (webglcontext === undefined || webglcontext === null) {
            this.e = document.createElement('canvas');
            this.e.width = 32;
            this.e.height = 32;
            this._gl = _WebCLGLUtils.WebCLGLUtils.getWebGLContextFromCanvas(this.e, { antialias: false });
        } else this._gl = webglcontext;

        this._arrExt = { "OES_texture_float": null, "OES_texture_float_linear": null, "OES_element_index_uint": null, "WEBGL_draw_buffers": null };
        for (var key in this._arrExt) {
            this._arrExt[key] = this._gl.getExtension(key);
            if (this._arrExt[key] == null) console.error("extension " + key + " not available");
        }
        this._maxDrawBuffers = null;
        if (this._arrExt.hasOwnProperty("WEBGL_draw_buffers") && this._arrExt["WEBGL_draw_buffers"] != null) {
            this._maxDrawBuffers = this._gl.getParameter(this._arrExt["WEBGL_draw_buffers"].MAX_DRAW_BUFFERS_WEBGL);
            console.log("Max draw buffers: " + this._maxDrawBuffers);
        } else console.log("Max draw buffers: 1");

        var highPrecisionSupport = this._gl.getShaderPrecisionFormat(this._gl.FRAGMENT_SHADER, this._gl.HIGH_FLOAT);
        this.precision = highPrecisionSupport.precision !== 0 ? 'precision highp float;\n\nprecision highp int;\n\n' : 'precision lowp float;\n\nprecision lowp int;\n\n';
        //this.precision = '#version 300 es\nprecision highp float;\n\nprecision highp int;\n\n';
        this._currentTextureUnit = 0;
        this._bufferWidth = 0;

        // QUAD
        var mesh = this.utils.loadQuad(undefined, 1.0, 1.0);
        this.vertexBuffer_QUAD = this._gl.createBuffer();
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.vertexBuffer_QUAD);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(mesh.vertexArray), this._gl.STATIC_DRAW);
        this.indexBuffer_QUAD = this._gl.createBuffer();
        this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer_QUAD);
        this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indexArray), this._gl.STATIC_DRAW);

        this.arrayCopyTex = [];

        // SHADER READPIXELS
        var sourceVertex = this.precision + 'attribute vec3 aVertexPosition;\n' + 'varying vec2 vCoord;\n' + 'void main(void) {\n' + 'gl_Position = vec4(aVertexPosition, 1.0);\n' + 'vCoord = aVertexPosition.xy*0.5+0.5;\n' + '}\n';
        var sourceFragment = this.precision + 'uniform sampler2D sampler_buffer;\n' + 'varying vec2 vCoord;\n' +

        //'out vec4 fragmentColor;'+
        'void main(void) {\n' + 'gl_FragColor = texture2D(sampler_buffer, vCoord);' + '}\n';

        this.shader_readpixels = this._gl.createProgram();
        this.utils.createShader(this._gl, "CLGLREADPIXELS", sourceVertex, sourceFragment, this.shader_readpixels);

        this.attr_VertexPos = this._gl.getAttribLocation(this.shader_readpixels, "aVertexPosition");
        this.sampler_buffer = this._gl.getUniformLocation(this.shader_readpixels, "sampler_buffer");

        // SHADER COPYTEXTURE
        var lines_drawBuffersEnable = function () {
            return this._maxDrawBuffers !== undefined && this._maxDrawBuffers !== null ? '#extension GL_EXT_draw_buffers : require\n' : "";
        }.bind(this);
        var lines_drawBuffersWriteInit = function () {
            var str = '';
            for (var n = 0, fn = this._maxDrawBuffers; n < fn; n++) {
                str += 'layout(location = ' + n + ') out vec4 outCol' + n + ';\n';
            }return str;
        }.bind(this);
        var lines_drawBuffersWrite = function () {
            var str = '';
            for (var n = 0, fn = this._maxDrawBuffers; n < fn; n++) {
                str += 'gl_FragData[' + n + '] = texture2D(uArrayCT[' + n + '], vCoord);\n';
            }return str;
        }.bind(this);
        sourceVertex = "" + this.precision + 'attribute vec3 aVertexPosition;\n' + 'varying vec2 vCoord;\n' + 'void main(void) {\n' + 'gl_Position = vec4(aVertexPosition, 1.0);\n' + 'vCoord = aVertexPosition.xy*0.5+0.5;\n' + '}';
        sourceFragment = lines_drawBuffersEnable() + this.precision + 'uniform sampler2D uArrayCT[' + this._maxDrawBuffers + '];\n' + 'varying vec2 vCoord;\n' +

        //lines_drawBuffersWriteInit()+
        'void main(void) {\n' + lines_drawBuffersWrite() + '}';
        this.shader_copyTexture = this._gl.createProgram();
        this.utils.createShader(this._gl, "CLGLCOPYTEXTURE", sourceVertex, sourceFragment, this.shader_copyTexture);

        this.attr_copyTexture_pos = this._gl.getAttribLocation(this.shader_copyTexture, "aVertexPosition");

        for (var n = 0, fn = this._maxDrawBuffers; n < fn; n++) {
            this.arrayCopyTex[n] = this._gl.getUniformLocation(this.shader_copyTexture, "uArrayCT[" + n + "]");
        }this.textureDataAux = this._gl.createTexture();
        this._gl.bindTexture(this._gl.TEXTURE_2D, this.textureDataAux);
        this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, 2, 2, 0, this._gl.RGBA, this._gl.FLOAT, new Float32Array([1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1]));
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.NEAREST);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.NEAREST);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);
        this._gl.bindTexture(this._gl.TEXTURE_2D, null);
    }

    /**
     * getContext
     * @returns {WebGLRenderingContext}
     */

    _createClass(WebCLGL, [{
        key: "getContext",
        value: function getContext() {
            return this._gl;
        }
    }, {
        key: "getMaxDrawBuffers",

        /**
         * getMaxDrawBuffers
         * @returns {int}
         */
        value: function getMaxDrawBuffers() {
            return this._maxDrawBuffers;
        }
    }, {
        key: "checkFramebufferStatus",

        /**
         * checkFramebufferStatus
         * @returns {boolean}
         */
        value: function checkFramebufferStatus() {
            var sta = this._gl.checkFramebufferStatus(this._gl.FRAMEBUFFER);
            var ferrors = {};
            ferrors[this._gl.FRAMEBUFFER_COMPLETE] = true;
            ferrors[this._gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT] = "FRAMEBUFFER_INCOMPLETE_ATTACHMENT: The attachment types are mismatched or not all framebuffer attachment points are framebuffer attachment complete";
            ferrors[this._gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT] = "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: There is no attachment";
            ferrors[this._gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS] = "FRAMEBUFFER_INCOMPLETE_DIMENSIONS: Height and width of the attachment are not the same";
            ferrors[this._gl.FRAMEBUFFER_UNSUPPORTED] = "FRAMEBUFFER_UNSUPPORTED: The format of the attachment is not supported or if depth and stencil attachments are not the same renderbuffer";
            if (ferrors[sta] !== true || ferrors[sta] === null) {
                console.log(ferrors[sta]);
                return false;
            }
            return true;
        }
    }, {
        key: "copy",

        /**
         * copy
         * @param {WebCLGLKernel|WebCLGLVertexFragmentProgram} pgr
         * @param {Array<WebCLGLBuffer>} [webCLGLBuffers=null]
         */
        value: function copy(pgr, webCLGLBuffers) {
            if (webCLGLBuffers !== undefined && webCLGLBuffers !== null) {
                if (webCLGLBuffers[0] !== undefined && webCLGLBuffers[0] !== null) {
                    this._gl.viewport(0, 0, webCLGLBuffers[0].W, webCLGLBuffers[0].H);

                    this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, webCLGLBuffers[0].fBuffer);
                    var arrDBuff = [];
                    for (var n = 0, fn = webCLGLBuffers.length; n < fn; n++) {
                        if (webCLGLBuffers[n] !== undefined && webCLGLBuffers[n] !== null) {
                            this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._arrExt["WEBGL_draw_buffers"]['COLOR_ATTACHMENT' + n + '_WEBGL'], this._gl.TEXTURE_2D, webCLGLBuffers[n].textureData, 0);
                            arrDBuff[n] = this._arrExt["WEBGL_draw_buffers"]['COLOR_ATTACHMENT' + n + '_WEBGL'];
                        } else arrDBuff[n] = this._gl['NONE'];
                    }
                    this._arrExt["WEBGL_draw_buffers"].drawBuffersWEBGL(arrDBuff);

                    if (this.checkFramebufferStatus() === true) {
                        this._gl.useProgram(this.shader_copyTexture);

                        for (var _n = 0, _fn = webCLGLBuffers.length; _n < _fn; _n++) {
                            this._gl.activeTexture(this._gl["TEXTURE" + _n]);
                            if (webCLGLBuffers[_n] !== undefined && webCLGLBuffers[_n] !== null) this._gl.bindTexture(this._gl.TEXTURE_2D, webCLGLBuffers[_n].textureDataTemp);else this._gl.bindTexture(this._gl.TEXTURE_2D, this.textureDataAux);
                            this._gl.uniform1i(this.arrayCopyTex[_n], _n);
                        }

                        this.copyNow(webCLGLBuffers);
                    }
                } else {
                    this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
                }
            } else this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
        }
    }, {
        key: "copyNow",
        value: function copyNow(webCLGLBuffers) {
            this._gl.enableVertexAttribArray(this.attr_copyTexture_pos);
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.vertexBuffer_QUAD);
            this._gl.vertexAttribPointer(this.attr_copyTexture_pos, 3, this._gl.FLOAT, false, 0, 0);

            this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer_QUAD);
            this._gl.drawElements(this._gl.TRIANGLES, 6, this._gl.UNSIGNED_SHORT, 0);
        }
    }, {
        key: "createBuffer",

        /**
         * Create a empty WebCLGLBuffer
         * @param {String} [type="FLOAT"] type FLOAT4 OR FLOAT
         * @param {boolean} [linear=false] linear texParameteri type for the WebGLTexture
         * @param {String} [mode="SAMPLER"] Mode for this buffer. "SAMPLER", "ATTRIBUTE", "VERTEX_INDEX"
         * @returns {WebCLGLBuffer}
         */
        value: function createBuffer(type, linear, mode) {
            return new _WebCLGLBuffer.WebCLGLBuffer(this._gl, type, linear, mode);
        }
    }, {
        key: "createKernel",

        /**
         * Create a kernel
         * @returns {WebCLGLKernel}
         * @param {String} [source=undefined]
         * @param {String} [header=undefined] Additional functions
         */
        value: function createKernel(source, header) {
            return new _WebCLGLKernel.WebCLGLKernel(this._gl, source, header);
        }
    }, {
        key: "createVertexFragmentProgram",

        /**
         * Create a vertex and fragment programs for a WebGL graphical representation after some enqueueNDRangeKernel
         * @returns {WebCLGLVertexFragmentProgram}
         * @param {String} [vertexSource=undefined]
         * @param {String} [vertexHeader=undefined]
         * @param {String} [fragmentSource=undefined]
         * @param {String} [fragmentHeader=undefined]
         */
        value: function createVertexFragmentProgram(vertexSource, vertexHeader, fragmentSource, fragmentHeader) {
            return new _WebCLGLVertexFragmentProgram.WebCLGLVertexFragmentProgram(this._gl, vertexSource, vertexHeader, fragmentSource, fragmentHeader);
        }
    }, {
        key: "fillBuffer",

        /**
         * fillBuffer with color
         * @param {WebGLTexture} texture
         * @param {Array<Float>} clearColor
         * @param {WebGLFramebuffer} fBuffer
         */
        value: function fillBuffer(texture, clearColor, fBuffer) {
            this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, fBuffer);
            this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._arrExt["WEBGL_draw_buffers"]['COLOR_ATTACHMENT0_WEBGL'], this._gl.TEXTURE_2D, texture, 0);

            var arrDBuff = [this._arrExt["WEBGL_draw_buffers"]['COLOR_ATTACHMENT0_WEBGL']];
            this._arrExt["WEBGL_draw_buffers"].drawBuffersWEBGL(arrDBuff);

            if (clearColor !== undefined && clearColor !== null) this._gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
            this._gl.clear(this._gl.COLOR_BUFFER_BIT);
        }
    }, {
        key: "bindAttributeValue",

        /**
         * bindAttributeValue
         * @param {Object} inValue
         * @param {WebCLGLBuffer} buff
         */
        value: function bindAttributeValue(inValue, buff) {
            if (buff !== undefined && buff !== null) {
                if (inValue.type === 'float4_fromAttr') {
                    this._gl.enableVertexAttribArray(inValue.location[0]);
                    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, buff.vertexData0);
                    this._gl.vertexAttribPointer(inValue.location[0], 4, this._gl.FLOAT, false, 0, 0);
                } else if (inValue.type === 'float_fromAttr') {
                    this._gl.enableVertexAttribArray(inValue.location[0]);
                    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, buff.vertexData0);
                    this._gl.vertexAttribPointer(inValue.location[0], 1, this._gl.FLOAT, false, 0, 0);
                }
            } else this._gl.disableVertexAttribArray(inValue.location[0]);
        }
    }, {
        key: "bindSamplerValue",

        /**
         * bindSamplerValue
         * @param {WebGLUniformLocation} uBufferWidth
         * @param {Object} inValue
         * @param {WebCLGLBuffer} buff
         */
        value: function bindSamplerValue(uBufferWidth, inValue, buff) {
            if (this._currentTextureUnit < 16) this._gl.activeTexture(this._gl["TEXTURE" + this._currentTextureUnit]);else this._gl.activeTexture(this._gl["TEXTURE16"]);

            if (buff !== undefined && buff !== null) {
                this._gl.bindTexture(this._gl.TEXTURE_2D, buff.textureData);

                if (this._bufferWidth === 0) {
                    this._bufferWidth = buff.W;
                    this._gl.uniform1f(uBufferWidth, this._bufferWidth);
                }
            } else this._gl.bindTexture(this._gl.TEXTURE_2D, this.textureDataAux);
            this._gl.uniform1i(inValue.location[0], this._currentTextureUnit);

            this._currentTextureUnit++;
        }
    }, {
        key: "bindUniformValue",

        /**
         * bindUniformValue
         * @param {Object} inValue
         * @param {WebCLGLBuffer|Number|Array<float>} buff
         */
        value: function bindUniformValue(inValue, buff) {
            if (buff !== undefined && buff !== null) {
                if (inValue.type === 'float') {
                    if (buff.constructor === Array) this._gl.uniform1fv(inValue.location[0], buff);else this._gl.uniform1f(inValue.location[0], buff);
                } else if (inValue.type === 'float4') this._gl.uniform4f(inValue.location[0], buff[0], buff[1], buff[2], buff[3]);else if (inValue.type === 'mat4') this._gl.uniformMatrix4fv(inValue.location[0], false, buff);
            }
        }
    }, {
        key: "bindValue",

        /**
         * bindValue
         * @param {WebCLGLKernel|WebCLGLVertexFragmentProgram} webCLGLProgram
         * @param {Object} inValue
         * @param {WebCLGLBuffer|float|Array<float>|Float32Array|Uint8Array} argValue
         */
        value: function bindValue(webCLGLProgram, inValue, argValue) {
            switch (inValue.expectedMode) {
                case "ATTRIBUTE":
                    this.bindAttributeValue(inValue, argValue);
                    break;
                case "SAMPLER":
                    this.bindSamplerValue(webCLGLProgram.uBufferWidth, inValue, argValue);
                    break;
                case "UNIFORM":
                    this.bindUniformValue(inValue, argValue);
                    break;
            }
        }
    }, {
        key: "bindFB",

        /**
         * bindFB
         * @param {Array<WebCLGLBuffer>} [webCLGLBuffers=null]
         * @param {boolean} outputToTemp
         */
        value: function bindFB(webCLGLBuffers, outputToTemp) {
            if (webCLGLBuffers !== undefined && webCLGLBuffers !== null) {
                if (webCLGLBuffers[0] !== undefined && webCLGLBuffers[0] !== null) {
                    this._gl.viewport(0, 0, webCLGLBuffers[0].W, webCLGLBuffers[0].H);

                    this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, outputToTemp === true ? webCLGLBuffers[0].fBufferTemp : webCLGLBuffers[0].fBuffer);
                    var arrDBuff = [];
                    for (var n = 0, fn = webCLGLBuffers.length; n < fn; n++) {
                        if (webCLGLBuffers[n] !== undefined && webCLGLBuffers[n] !== null) {
                            var o = outputToTemp === true ? webCLGLBuffers[n].textureDataTemp : webCLGLBuffers[n].textureData;
                            this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._arrExt["WEBGL_draw_buffers"]['COLOR_ATTACHMENT' + n + '_WEBGL'], this._gl.TEXTURE_2D, o, 0);
                            arrDBuff[n] = this._arrExt["WEBGL_draw_buffers"]['COLOR_ATTACHMENT' + n + '_WEBGL'];
                        } else arrDBuff[n] = this._gl['NONE'];
                    }
                    this._arrExt["WEBGL_draw_buffers"].drawBuffersWEBGL(arrDBuff);

                    return this.checkFramebufferStatus();
                } else {
                    this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
                    return true;
                }
            } else {
                this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
                return true;
            }
        }
    }, {
        key: "enqueueNDRangeKernel",

        /**
         * Perform calculation and save the result on a WebCLGLBuffer
         * @param {WebCLGLKernel} webCLGLKernel
         * @param {WebCLGLBuffer|Array<WebCLGLBuffer>} [webCLGLBuffer=null]
         * @param {boolean} outputToTemp
         * @param {Object} argValues
         */
        value: function enqueueNDRangeKernel(webCLGLKernel, webCLGLBuffer, outputToTemp, argValues) {
            this._bufferWidth = 0;

            this._gl.useProgram(webCLGLKernel.kernel);

            if (this.bindFB(webCLGLBuffer, outputToTemp) === true) {
                this._currentTextureUnit = 0;
                for (var key in webCLGLKernel.in_values) {
                    this.bindValue(webCLGLKernel, webCLGLKernel.in_values[key], argValues[key]);
                }this._gl.enableVertexAttribArray(webCLGLKernel.attr_VertexPos);
                this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.vertexBuffer_QUAD);
                this._gl.vertexAttribPointer(webCLGLKernel.attr_VertexPos, 3, this._gl.FLOAT, false, 0, 0);

                this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer_QUAD);
                this._gl.drawElements(this._gl.TRIANGLES, 6, this._gl.UNSIGNED_SHORT, 0);
            }
        }
    }, {
        key: "enqueueVertexFragmentProgram",

        /**
         * Perform WebGL graphical representation
         * @param {WebCLGLVertexFragmentProgram} webCLGLVertexFragmentProgram
         * @param {WebCLGLBuffer} bufferInd Buffer to draw type (type indices or vertex)
         * @param {int} [drawMode=4] 0=POINTS, 3=LINE_STRIP, 2=LINE_LOOP, 1=LINES, 5=TRIANGLE_STRIP, 6=TRIANGLE_FAN and 4=TRIANGLES
         * @param {WebCLGLBuffer|Array<WebCLGLBuffer>} [webCLGLBuffer=null]
         * @param {boolean} outputToTemp
         * @param {Object} argValues
         */
        value: function enqueueVertexFragmentProgram(webCLGLVertexFragmentProgram, bufferInd, drawMode, webCLGLBuffer, outputToTemp, argValues) {
            this._bufferWidth = 0;

            this._gl.useProgram(webCLGLVertexFragmentProgram.vertexFragmentProgram);

            var Dmode = drawMode !== undefined && drawMode !== null ? drawMode : 4;

            if (this.bindFB(webCLGLBuffer, outputToTemp) === true) {
                if (bufferInd !== undefined && bufferInd !== null) {
                    this._currentTextureUnit = 0;
                    for (var key in webCLGLVertexFragmentProgram.in_vertex_values) {
                        this.bindValue(webCLGLVertexFragmentProgram, webCLGLVertexFragmentProgram.in_vertex_values[key], argValues[key]);
                    }for (var _key in webCLGLVertexFragmentProgram.in_fragment_values) {
                        this.bindValue(webCLGLVertexFragmentProgram, webCLGLVertexFragmentProgram.in_fragment_values[_key], argValues[_key]);
                    }if (bufferInd.mode === "VERTEX_INDEX") {
                        this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, bufferInd.vertexData0);
                        this._gl.drawElements(Dmode, bufferInd.length, this._gl.UNSIGNED_SHORT, 0);
                    } else this._gl.drawArrays(Dmode, 0, bufferInd.length);
                }
            }
        }
    }, {
        key: "readBuffer",

        /**
         * Get Float32Array array from a WebCLGLBuffer
         * @param {WebCLGLBuffer} buffer
         * @returns {Float32Array}
         */
        value: function readBuffer(buffer) {
            if (this.e !== undefined && this.e !== null) {
                this.e.width = buffer.W;
                this.e.height = buffer.H;
            }

            this._gl.useProgram(this.shader_readpixels);

            this._gl.viewport(0, 0, buffer.W, buffer.H);
            this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, buffer.fBufferTemp);
            this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._arrExt["WEBGL_draw_buffers"]['COLOR_ATTACHMENT0_WEBGL'], this._gl.TEXTURE_2D, buffer.textureDataTemp, 0);

            var arrDBuff = [this._arrExt["WEBGL_draw_buffers"]['COLOR_ATTACHMENT0_WEBGL']];
            this._arrExt["WEBGL_draw_buffers"].drawBuffersWEBGL(arrDBuff);

            this._gl.activeTexture(this._gl.TEXTURE0);
            this._gl.bindTexture(this._gl.TEXTURE_2D, buffer.textureData);
            this._gl.uniform1i(this.sampler_buffer, 0);

            this._gl.enableVertexAttribArray(this.attr_VertexPos);
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.vertexBuffer_QUAD);
            this._gl.vertexAttribPointer(this.attr_VertexPos, 3, buffer._supportFormat, false, 0, 0);

            this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer_QUAD);
            this._gl.drawElements(this._gl.TRIANGLES, 6, this._gl.UNSIGNED_SHORT, 0);

            if (buffer.outArrayFloat === undefined || buffer.outArrayFloat === null) buffer.outArrayFloat = new Float32Array(buffer.W * buffer.H * 4);
            this._gl.readPixels(0, 0, buffer.W, buffer.H, this._gl.RGBA, this._gl.FLOAT, buffer.outArrayFloat);

            if (buffer.type === "FLOAT") {
                var fd = new Float32Array(buffer.outArrayFloat.length / 4);
                for (var n = 0, fn = buffer.outArrayFloat.length / 4; n < fn; n++) {
                    fd[n] = buffer.outArrayFloat[n * 4];
                }buffer.outArrayFloat = fd;
            }

            return buffer.outArrayFloat;
        }
    }], [{
        key: "enqueueReadBuffer_WebGLTexture",

        /**
         * Get the internally WebGLTexture (type FLOAT), if the WebGLRenderingContext was given.
         * @param {WebCLGLBuffer} buffer
         * @returns {WebGLTexture}
         */
        value: function enqueueReadBuffer_WebGLTexture(buffer) {
            return buffer.textureData;
        }
    }]);

    return WebCLGL;
}();

global.WebCLGL = WebCLGL;
module.exports.WebCLGL = WebCLGL;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./WebCLGLBuffer.class":2,"./WebCLGLKernel.class":3,"./WebCLGLUtils.class":4,"./WebCLGLVertexFragmentProgram.class":5}],2:[function(require,module,exports){
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
* WebCLGLBuffer
* @class
 * @param {WebGLRenderingContext} gl
 * @param {String} [type="FLOAT"]
 * @param {boolean} [linear=true]
 * @param {String} [mode="SAMPLER"] "SAMPLER", "ATTRIBUTE", "VERTEX_INDEX"
*/
var WebCLGLBuffer = exports.WebCLGLBuffer = function () {
    function WebCLGLBuffer(gl, type, linear, mode) {
        _classCallCheck(this, WebCLGLBuffer);

        this._gl = gl;

        this.type = type !== undefined || type !== null ? type : 'FLOAT';
        this._supportFormat = this._gl.FLOAT;

        this.linear = linear !== undefined || linear !== null ? linear : true;
        this.mode = mode !== undefined || mode !== null ? mode : "SAMPLER";

        this.W = null;
        this.H = null;

        this.textureData = null;
        this.textureDataTemp = null;
        this.vertexData0 = null;

        this.fBuffer = null;
        this.renderBuffer = null;
        this.fBufferTemp = null;
        this.renderBufferTemp = null;

        if (this.mode === "SAMPLER") {
            this.textureData = this._gl.createTexture();
            this.textureDataTemp = this._gl.createTexture();
        }
        if (this.mode === "SAMPLER" || this.mode === "ATTRIBUTE" || this.mode === "VERTEX_INDEX") {
            this.vertexData0 = this._gl.createBuffer();
        }
    }

    /**
     * createFramebufferAndRenderbuffer
     */

    _createClass(WebCLGLBuffer, [{
        key: "createFramebufferAndRenderbuffer",
        value: function createFramebufferAndRenderbuffer() {
            var createWebGLRenderBuffer = function () {
                var rBuffer = this._gl.createRenderbuffer();
                this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, rBuffer);
                this._gl.renderbufferStorage(this._gl.RENDERBUFFER, this._gl.DEPTH_COMPONENT16, this.W, this.H);
                this._gl.bindRenderbuffer(this._gl.RENDERBUFFER, null);
                return rBuffer;
            }.bind(this);

            if (this.fBuffer != null) {
                this._gl.deleteFramebuffer(this.fBuffer);
                this._gl.deleteFramebuffer(this.fBufferTemp);

                this._gl.deleteRenderbuffer(this.renderBuffer);
                this._gl.deleteRenderbuffer(this.renderBufferTemp);
            }
            this.fBuffer = this._gl.createFramebuffer();
            this.renderBuffer = createWebGLRenderBuffer();
            this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this.fBuffer);
            this._gl.framebufferRenderbuffer(this._gl.FRAMEBUFFER, this._gl.DEPTH_ATTACHMENT, this._gl.RENDERBUFFER, this.renderBuffer);

            this.fBufferTemp = this._gl.createFramebuffer();
            this.renderBufferTemp = createWebGLRenderBuffer();
            this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this.fBufferTemp);
            this._gl.framebufferRenderbuffer(this._gl.FRAMEBUFFER, this._gl.DEPTH_ATTACHMENT, this._gl.RENDERBUFFER, this.renderBufferTemp);
        }
    }, {
        key: "writeWebGLTextureBuffer",

        /**
         * Write WebGLTexture buffer
         * @param {Array<float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} arr
         * @param {boolean} [flip=false]
         */
        value: function writeWebGLTextureBuffer(arr, flip) {
            var ps = function (tex, flip) {
                if (flip === false || flip === undefined || flip === null) this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, false);else this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, true);

                this._gl.pixelStorei(this._gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
                this._gl.bindTexture(this._gl.TEXTURE_2D, tex);
            }.bind(this);

            var writeTexNow = function (arr) {
                if (arr instanceof HTMLImageElement) {
                    //this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, arr.width, arr.height, 0, this._gl.RGBA, this._gl.UNSIGNED_BYTE, arr);
                    if (this.type === 'FLOAT4') this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._supportFormat, arr);
                } else {
                    //this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this.W, this.H, 0, this._gl.RGBA, this._supportFormat, arr, 0);
                    this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this.W, this.H, 0, this._gl.RGBA, this._supportFormat, arr);
                }
            }.bind(this);

            var tp = function () {
                this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.NEAREST);
                this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.NEAREST);
                this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
                this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);

                /*this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.LINEAR);
                 this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.LINEAR_MIPMAP_NEAREST);
                 this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
                 this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);
                 this._gl.generateMipmap(this._gl.TEXTURE_2D);*/
            }.bind(this);

            if (arr instanceof WebGLTexture) {
                this.textureData = arr;
                this.textureDataTemp = arr;
            } else {
                ps(this.textureData, flip);
                writeTexNow(arr);
                tp();

                ps(this.textureDataTemp, flip);
                writeTexNow(arr);
                tp();
            }

            this._gl.bindTexture(this._gl.TEXTURE_2D, null);
        }
    }, {
        key: "writeBuffer",

        /**
         * Write on buffer
         * @param {Array<float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} arr
         * @param {boolean} [flip=false]
         * @param {Array<Float2>} [overrideDimensions=new Array(){Math.sqrt(value.length), Math.sqrt(value.length)}]
         */
        value: function writeBuffer(arr, flip, overrideDimensions) {
            var prepareArr = function (arr) {
                if (!(arr instanceof HTMLImageElement)) {
                    if (this.length.constructor === Array) {
                        this.length = this.length[0] * this.length[1];
                        this.W = this.length[0];
                        this.H = this.length[1];
                    } else {
                        this.W = Math.ceil(Math.sqrt(this.length));
                        this.H = this.W;
                    }

                    if (this.type === 'FLOAT4') {
                        arr = arr instanceof Float32Array ? arr : new Float32Array(arr);

                        var l = this.W * this.H * 4;
                        if (arr.length !== l) {
                            var arrt = new Float32Array(l);
                            for (var n = 0; n < l; n++) {
                                arrt[n] = arr[n] != null ? arr[n] : 0.0;
                            }
                            arr = arrt;
                        }
                    } else if (this.type === 'FLOAT') {
                        var _l = this.W * this.H * 4;
                        var arrayTemp = new Float32Array(_l);
                        for (var _n = 0, f = this.W * this.H; _n < f; _n++) {
                            var idd = _n * 4;
                            arrayTemp[idd] = arr[_n] != null ? arr[_n] : 0.0;
                            arrayTemp[idd + 1] = 0.0;
                            arrayTemp[idd + 2] = 0.0;
                            arrayTemp[idd + 3] = 0.0;
                        }
                        arr = arrayTemp;
                    }
                }
                return arr;
            }.bind(this);

            if (overrideDimensions === undefined || overrideDimensions === null) {
                if (arr instanceof HTMLImageElement) this.length = arr.width * arr.height;else this.length = this.type === "FLOAT4" ? arr.length / 4 : arr.length;
            } else this.length = [overrideDimensions[0], overrideDimensions[1]];

            if (this.mode === "SAMPLER") {
                this.writeWebGLTextureBuffer(prepareArr(arr), flip);
            }
            if (this.mode === "SAMPLER" || this.mode === "ATTRIBUTE") {
                this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.vertexData0);
                this._gl.bufferData(this._gl.ARRAY_BUFFER, arr instanceof Float32Array ? arr : new Float32Array(arr), this._gl.STATIC_DRAW);
            }
            if (this.mode === "VERTEX_INDEX") {
                this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this.vertexData0);
                this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(arr), this._gl.STATIC_DRAW);
            }

            this.createFramebufferAndRenderbuffer();
        }
    }, {
        key: "remove",

        /**
         * Remove this buffer
         */
        value: function remove() {
            if (this.mode === "SAMPLER") {
                this._gl.deleteTexture(this.textureData);
                this._gl.deleteTexture(this.textureDataTemp);
            }

            if (this.mode === "SAMPLER" || this.mode === "ATTRIBUTE" || this.mode === "VERTEX_INDEX") {
                this._gl.deleteBuffer(this.vertexData0);
            }

            this._gl.deleteFramebuffer(this.fBuffer);
            this._gl.deleteFramebuffer(this.fBufferTemp);

            this._gl.deleteRenderbuffer(this.renderBuffer);
            this._gl.deleteRenderbuffer(this.renderBufferTemp);
        }
    }]);

    return WebCLGLBuffer;
}();

global.WebCLGLBuffer = WebCLGLBuffer;
module.exports.WebCLGLBuffer = WebCLGLBuffer;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],3:[function(require,module,exports){
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

},{"./WebCLGLUtils.class":4}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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

},{"./WebCLGLUtils.class":4}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvd2ViY2xnbC9XZWJDTEdMLmNsYXNzLmpzIiwic3JjL3dlYmNsZ2wvV2ViQ0xHTEJ1ZmZlci5jbGFzcy5qcyIsInNyYy93ZWJjbGdsL1dlYkNMR0xLZXJuZWwuY2xhc3MuanMiLCJzcmMvd2ViY2xnbC9XZWJDTEdMVXRpbHMuY2xhc3MuanMiLCJzcmMvd2ViY2xnbC9XZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtLmNsYXNzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBOztBQUVBLE9BQU8sY0FBUCxDQUFzQixPQUF0QixFQUErQixZQUEvQixFQUE2QztBQUN6QyxXQUFPO0FBRGtDLENBQTdDO0FBR0EsUUFBUSxPQUFSLEdBQWtCLFNBQWxCOztBQUVBLElBQUksZUFBZSxZQUFZO0FBQUUsYUFBUyxnQkFBVCxDQUEwQixNQUExQixFQUFrQyxLQUFsQyxFQUF5QztBQUFFLGFBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxNQUFNLE1BQTFCLEVBQWtDLEdBQWxDLEVBQXVDO0FBQUUsZ0JBQUksYUFBYSxNQUFNLENBQU4sQ0FBakIsQ0FBMkIsV0FBVyxVQUFYLEdBQXdCLFdBQVcsVUFBWCxJQUF5QixLQUFqRCxDQUF3RCxXQUFXLFlBQVgsR0FBMEIsSUFBMUIsQ0FBZ0MsSUFBSSxXQUFXLFVBQWYsRUFBMkIsV0FBVyxRQUFYLEdBQXNCLElBQXRCLENBQTRCLE9BQU8sY0FBUCxDQUFzQixNQUF0QixFQUE4QixXQUFXLEdBQXpDLEVBQThDLFVBQTlDO0FBQTREO0FBQUUsS0FBQyxPQUFPLFVBQVUsV0FBVixFQUF1QixVQUF2QixFQUFtQyxXQUFuQyxFQUFnRDtBQUFFLFlBQUksVUFBSixFQUFnQixpQkFBaUIsWUFBWSxTQUE3QixFQUF3QyxVQUF4QyxFQUFxRCxJQUFJLFdBQUosRUFBaUIsaUJBQWlCLFdBQWpCLEVBQThCLFdBQTlCLEVBQTRDLE9BQU8s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QUFMLENBQXFCLE9BQXJCLENBQTZCLDRCQUE3QixFQUEyRCxFQUEzRCxFQUErRCxPQUEvRCxDQUF1RSxjQUF2RSxFQUF1RixFQUF2RixDQUF2QjtBQUNBLGlCQUFLLGVBQUwsR0FBdUIsY0FBYyxZQUFkLENBQTJCLFdBQTNCLENBQXVDLEtBQUssZUFBNUMsRUFBNkQsS0FBSyxrQkFBbEUsQ0FBdkI7O0FBRUEsaUJBQUssZ0JBQUwsR0FBd0IsSUFBeEI7QUFDQSxnQkFBSSxLQUFLLGNBQUwsS0FBd0IsSUFBNUIsRUFBa0M7QUFDOUIsb0JBQUksS0FBSyxLQUFLLDJCQUFMLEVBQVQ7O0FBRUEsb0JBQUksS0FBSyxVQUFMLEtBQW9CLElBQXhCLEVBQThCLFFBQVEsR0FBUixDQUFZLFVBQVosRUFBd0IsK0JBQXhCLEdBQTBELFFBQVEsR0FBUixDQUFZLDZDQUFaLEVBQTJELGFBQTNELENBQTFELEVBQXFJLFFBQVEsR0FBUixDQUFZLFFBQVEsY0FBUixHQUF5QixjQUFyQyxFQUFxRCxhQUFyRCxDQUFySSxFQUEwTSxRQUFRLEdBQVIsQ0FBWSxvREFBWixFQUFrRSxpQkFBbEUsQ0FBMU0sRUFBZ1MsUUFBUSxHQUFSLENBQVksUUFBUSxFQUFwQixFQUF3QixpQkFBeEIsQ0FBaFM7QUFDakM7QUFDSjtBQWpERixLQW5Hd0MsQ0FBM0M7O0FBdUpBLFdBQU8sNEJBQVA7QUFDSCxDQW5NeUUsRUFBMUU7O0FBcU1BLE9BQU8sNEJBQVAsR0FBc0MsNEJBQXRDO0FBQ0EsT0FBTyxPQUFQLENBQWUsNEJBQWYsR0FBOEMsNEJBQTlDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc31yZXR1cm4gZX0pKCkiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5XZWJDTEdMID0gdW5kZWZpbmVkO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpOyAvKlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVGhlIE1JVCBMaWNlbnNlIChNSVQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIENvcHlyaWdodCAoYykgPDIwMTM+IDxSb2JlcnRvIEdvbnphbGV6LiBodHRwOi8vc3Rvcm1jb2xvdXIuYXBwc3BvdC5jb20vPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUSEUgU09GVFdBUkUuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cblxudmFyIF9XZWJDTEdMQnVmZmVyID0gcmVxdWlyZShcIi4vV2ViQ0xHTEJ1ZmZlci5jbGFzc1wiKTtcblxudmFyIF9XZWJDTEdMS2VybmVsID0gcmVxdWlyZShcIi4vV2ViQ0xHTEtlcm5lbC5jbGFzc1wiKTtcblxudmFyIF9XZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtID0gcmVxdWlyZShcIi4vV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbS5jbGFzc1wiKTtcblxudmFyIF9XZWJDTEdMVXRpbHMgPSByZXF1aXJlKFwiLi9XZWJDTEdMVXRpbHMuY2xhc3NcIik7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbi8qKlxyXG4qIENsYXNzIGZvciBwYXJhbGxlbGl6YXRpb24gb2YgY2FsY3VsYXRpb25zIHVzaW5nIHRoZSBXZWJHTCBjb250ZXh0IHNpbWlsYXJseSB0byB3ZWJjbFxyXG4qIEBjbGFzc1xyXG4qIEBwYXJhbSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBbd2ViZ2xjb250ZXh0PW51bGxdXHJcbiovXG52YXIgV2ViQ0xHTCA9IGV4cG9ydHMuV2ViQ0xHTCA9IGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBXZWJDTEdMKHdlYmdsY29udGV4dCkge1xuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgV2ViQ0xHTCk7XG5cbiAgICAgICAgdGhpcy51dGlscyA9IG5ldyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscygpO1xuXG4gICAgICAgIHRoaXMuX2dsID0gbnVsbDtcbiAgICAgICAgdGhpcy5lID0gbnVsbDtcbiAgICAgICAgaWYgKHdlYmdsY29udGV4dCA9PT0gdW5kZWZpbmVkIHx8IHdlYmdsY29udGV4dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgICAgICB0aGlzLmUud2lkdGggPSAzMjtcbiAgICAgICAgICAgIHRoaXMuZS5oZWlnaHQgPSAzMjtcbiAgICAgICAgICAgIHRoaXMuX2dsID0gX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuZ2V0V2ViR0xDb250ZXh0RnJvbUNhbnZhcyh0aGlzLmUsIHsgYW50aWFsaWFzOiBmYWxzZSB9KTtcbiAgICAgICAgfSBlbHNlIHRoaXMuX2dsID0gd2ViZ2xjb250ZXh0O1xuXG4gICAgICAgIHRoaXMuX2FyckV4dCA9IHsgXCJPRVNfdGV4dHVyZV9mbG9hdFwiOiBudWxsLCBcIk9FU190ZXh0dXJlX2Zsb2F0X2xpbmVhclwiOiBudWxsLCBcIk9FU19lbGVtZW50X2luZGV4X3VpbnRcIjogbnVsbCwgXCJXRUJHTF9kcmF3X2J1ZmZlcnNcIjogbnVsbCB9O1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5fYXJyRXh0KSB7XG4gICAgICAgICAgICB0aGlzLl9hcnJFeHRba2V5XSA9IHRoaXMuX2dsLmdldEV4dGVuc2lvbihrZXkpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2FyckV4dFtrZXldID09IG51bGwpIGNvbnNvbGUuZXJyb3IoXCJleHRlbnNpb24gXCIgKyBrZXkgKyBcIiBub3QgYXZhaWxhYmxlXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX21heERyYXdCdWZmZXJzID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMuX2FyckV4dC5oYXNPd25Qcm9wZXJ0eShcIldFQkdMX2RyYXdfYnVmZmVyc1wiKSAmJiB0aGlzLl9hcnJFeHRbXCJXRUJHTF9kcmF3X2J1ZmZlcnNcIl0gIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fbWF4RHJhd0J1ZmZlcnMgPSB0aGlzLl9nbC5nZXRQYXJhbWV0ZXIodGhpcy5fYXJyRXh0W1wiV0VCR0xfZHJhd19idWZmZXJzXCJdLk1BWF9EUkFXX0JVRkZFUlNfV0VCR0wpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJNYXggZHJhdyBidWZmZXJzOiBcIiArIHRoaXMuX21heERyYXdCdWZmZXJzKTtcbiAgICAgICAgfSBlbHNlIGNvbnNvbGUubG9nKFwiTWF4IGRyYXcgYnVmZmVyczogMVwiKTtcblxuICAgICAgICB2YXIgaGlnaFByZWNpc2lvblN1cHBvcnQgPSB0aGlzLl9nbC5nZXRTaGFkZXJQcmVjaXNpb25Gb3JtYXQodGhpcy5fZ2wuRlJBR01FTlRfU0hBREVSLCB0aGlzLl9nbC5ISUdIX0ZMT0FUKTtcbiAgICAgICAgdGhpcy5wcmVjaXNpb24gPSBoaWdoUHJlY2lzaW9uU3VwcG9ydC5wcmVjaXNpb24gIT09IDAgPyAncHJlY2lzaW9uIGhpZ2hwIGZsb2F0O1xcblxcbnByZWNpc2lvbiBoaWdocCBpbnQ7XFxuXFxuJyA6ICdwcmVjaXNpb24gbG93cCBmbG9hdDtcXG5cXG5wcmVjaXNpb24gbG93cCBpbnQ7XFxuXFxuJztcbiAgICAgICAgLy90aGlzLnByZWNpc2lvbiA9ICcjdmVyc2lvbiAzMDAgZXNcXG5wcmVjaXNpb24gaGlnaHAgZmxvYXQ7XFxuXFxucHJlY2lzaW9uIGhpZ2hwIGludDtcXG5cXG4nO1xuICAgICAgICB0aGlzLl9jdXJyZW50VGV4dHVyZVVuaXQgPSAwO1xuICAgICAgICB0aGlzLl9idWZmZXJXaWR0aCA9IDA7XG5cbiAgICAgICAgLy8gUVVBRFxuICAgICAgICB2YXIgbWVzaCA9IHRoaXMudXRpbHMubG9hZFF1YWQodW5kZWZpbmVkLCAxLjAsIDEuMCk7XG4gICAgICAgIHRoaXMudmVydGV4QnVmZmVyX1FVQUQgPSB0aGlzLl9nbC5jcmVhdGVCdWZmZXIoKTtcbiAgICAgICAgdGhpcy5fZ2wuYmluZEJ1ZmZlcih0aGlzLl9nbC5BUlJBWV9CVUZGRVIsIHRoaXMudmVydGV4QnVmZmVyX1FVQUQpO1xuICAgICAgICB0aGlzLl9nbC5idWZmZXJEYXRhKHRoaXMuX2dsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheShtZXNoLnZlcnRleEFycmF5KSwgdGhpcy5fZ2wuU1RBVElDX0RSQVcpO1xuICAgICAgICB0aGlzLmluZGV4QnVmZmVyX1FVQUQgPSB0aGlzLl9nbC5jcmVhdGVCdWZmZXIoKTtcbiAgICAgICAgdGhpcy5fZ2wuYmluZEJ1ZmZlcih0aGlzLl9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgdGhpcy5pbmRleEJ1ZmZlcl9RVUFEKTtcbiAgICAgICAgdGhpcy5fZ2wuYnVmZmVyRGF0YSh0aGlzLl9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbmV3IFVpbnQxNkFycmF5KG1lc2guaW5kZXhBcnJheSksIHRoaXMuX2dsLlNUQVRJQ19EUkFXKTtcblxuICAgICAgICB0aGlzLmFycmF5Q29weVRleCA9IFtdO1xuXG4gICAgICAgIC8vIFNIQURFUiBSRUFEUElYRUxTXG4gICAgICAgIHZhciBzb3VyY2VWZXJ0ZXggPSB0aGlzLnByZWNpc2lvbiArICdhdHRyaWJ1dGUgdmVjMyBhVmVydGV4UG9zaXRpb247XFxuJyArICd2YXJ5aW5nIHZlYzIgdkNvb3JkO1xcbicgKyAndm9pZCBtYWluKHZvaWQpIHtcXG4nICsgJ2dsX1Bvc2l0aW9uID0gdmVjNChhVmVydGV4UG9zaXRpb24sIDEuMCk7XFxuJyArICd2Q29vcmQgPSBhVmVydGV4UG9zaXRpb24ueHkqMC41KzAuNTtcXG4nICsgJ31cXG4nO1xuICAgICAgICB2YXIgc291cmNlRnJhZ21lbnQgPSB0aGlzLnByZWNpc2lvbiArICd1bmlmb3JtIHNhbXBsZXIyRCBzYW1wbGVyX2J1ZmZlcjtcXG4nICsgJ3ZhcnlpbmcgdmVjMiB2Q29vcmQ7XFxuJyArXG5cbiAgICAgICAgLy8nb3V0IHZlYzQgZnJhZ21lbnRDb2xvcjsnK1xuICAgICAgICAndm9pZCBtYWluKHZvaWQpIHtcXG4nICsgJ2dsX0ZyYWdDb2xvciA9IHRleHR1cmUyRChzYW1wbGVyX2J1ZmZlciwgdkNvb3JkKTsnICsgJ31cXG4nO1xuXG4gICAgICAgIHRoaXMuc2hhZGVyX3JlYWRwaXhlbHMgPSB0aGlzLl9nbC5jcmVhdGVQcm9ncmFtKCk7XG4gICAgICAgIHRoaXMudXRpbHMuY3JlYXRlU2hhZGVyKHRoaXMuX2dsLCBcIkNMR0xSRUFEUElYRUxTXCIsIHNvdXJjZVZlcnRleCwgc291cmNlRnJhZ21lbnQsIHRoaXMuc2hhZGVyX3JlYWRwaXhlbHMpO1xuXG4gICAgICAgIHRoaXMuYXR0cl9WZXJ0ZXhQb3MgPSB0aGlzLl9nbC5nZXRBdHRyaWJMb2NhdGlvbih0aGlzLnNoYWRlcl9yZWFkcGl4ZWxzLCBcImFWZXJ0ZXhQb3NpdGlvblwiKTtcbiAgICAgICAgdGhpcy5zYW1wbGVyX2J1ZmZlciA9IHRoaXMuX2dsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnNoYWRlcl9yZWFkcGl4ZWxzLCBcInNhbXBsZXJfYnVmZmVyXCIpO1xuXG4gICAgICAgIC8vIFNIQURFUiBDT1BZVEVYVFVSRVxuICAgICAgICB2YXIgbGluZXNfZHJhd0J1ZmZlcnNFbmFibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbWF4RHJhd0J1ZmZlcnMgIT09IHVuZGVmaW5lZCAmJiB0aGlzLl9tYXhEcmF3QnVmZmVycyAhPT0gbnVsbCA/ICcjZXh0ZW5zaW9uIEdMX0VYVF9kcmF3X2J1ZmZlcnMgOiByZXF1aXJlXFxuJyA6IFwiXCI7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgdmFyIGxpbmVzX2RyYXdCdWZmZXJzV3JpdGVJbml0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHN0ciA9ICcnO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGZuID0gdGhpcy5fbWF4RHJhd0J1ZmZlcnM7IG4gPCBmbjsgbisrKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9ICdsYXlvdXQobG9jYXRpb24gPSAnICsgbiArICcpIG91dCB2ZWM0IG91dENvbCcgKyBuICsgJztcXG4nO1xuICAgICAgICAgICAgfXJldHVybiBzdHI7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgdmFyIGxpbmVzX2RyYXdCdWZmZXJzV3JpdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgc3RyID0gJyc7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMCwgZm4gPSB0aGlzLl9tYXhEcmF3QnVmZmVyczsgbiA8IGZuOyBuKyspIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0gJ2dsX0ZyYWdEYXRhWycgKyBuICsgJ10gPSB0ZXh0dXJlMkQodUFycmF5Q1RbJyArIG4gKyAnXSwgdkNvb3JkKTtcXG4nO1xuICAgICAgICAgICAgfXJldHVybiBzdHI7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgc291cmNlVmVydGV4ID0gXCJcIiArIHRoaXMucHJlY2lzaW9uICsgJ2F0dHJpYnV0ZSB2ZWMzIGFWZXJ0ZXhQb3NpdGlvbjtcXG4nICsgJ3ZhcnlpbmcgdmVjMiB2Q29vcmQ7XFxuJyArICd2b2lkIG1haW4odm9pZCkge1xcbicgKyAnZ2xfUG9zaXRpb24gPSB2ZWM0KGFWZXJ0ZXhQb3NpdGlvbiwgMS4wKTtcXG4nICsgJ3ZDb29yZCA9IGFWZXJ0ZXhQb3NpdGlvbi54eSowLjUrMC41O1xcbicgKyAnfSc7XG4gICAgICAgIHNvdXJjZUZyYWdtZW50ID0gbGluZXNfZHJhd0J1ZmZlcnNFbmFibGUoKSArIHRoaXMucHJlY2lzaW9uICsgJ3VuaWZvcm0gc2FtcGxlcjJEIHVBcnJheUNUWycgKyB0aGlzLl9tYXhEcmF3QnVmZmVycyArICddO1xcbicgKyAndmFyeWluZyB2ZWMyIHZDb29yZDtcXG4nICtcblxuICAgICAgICAvL2xpbmVzX2RyYXdCdWZmZXJzV3JpdGVJbml0KCkrXG4gICAgICAgICd2b2lkIG1haW4odm9pZCkge1xcbicgKyBsaW5lc19kcmF3QnVmZmVyc1dyaXRlKCkgKyAnfSc7XG4gICAgICAgIHRoaXMuc2hhZGVyX2NvcHlUZXh0dXJlID0gdGhpcy5fZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuICAgICAgICB0aGlzLnV0aWxzLmNyZWF0ZVNoYWRlcih0aGlzLl9nbCwgXCJDTEdMQ09QWVRFWFRVUkVcIiwgc291cmNlVmVydGV4LCBzb3VyY2VGcmFnbWVudCwgdGhpcy5zaGFkZXJfY29weVRleHR1cmUpO1xuXG4gICAgICAgIHRoaXMuYXR0cl9jb3B5VGV4dHVyZV9wb3MgPSB0aGlzLl9nbC5nZXRBdHRyaWJMb2NhdGlvbih0aGlzLnNoYWRlcl9jb3B5VGV4dHVyZSwgXCJhVmVydGV4UG9zaXRpb25cIik7XG5cbiAgICAgICAgZm9yICh2YXIgbiA9IDAsIGZuID0gdGhpcy5fbWF4RHJhd0J1ZmZlcnM7IG4gPCBmbjsgbisrKSB7XG4gICAgICAgICAgICB0aGlzLmFycmF5Q29weVRleFtuXSA9IHRoaXMuX2dsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnNoYWRlcl9jb3B5VGV4dHVyZSwgXCJ1QXJyYXlDVFtcIiArIG4gKyBcIl1cIik7XG4gICAgICAgIH10aGlzLnRleHR1cmVEYXRhQXV4ID0gdGhpcy5fZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICAgICAgICB0aGlzLl9nbC5iaW5kVGV4dHVyZSh0aGlzLl9nbC5URVhUVVJFXzJELCB0aGlzLnRleHR1cmVEYXRhQXV4KTtcbiAgICAgICAgdGhpcy5fZ2wudGV4SW1hZ2UyRCh0aGlzLl9nbC5URVhUVVJFXzJELCAwLCB0aGlzLl9nbC5SR0JBLCAyLCAyLCAwLCB0aGlzLl9nbC5SR0JBLCB0aGlzLl9nbC5GTE9BVCwgbmV3IEZsb2F0MzJBcnJheShbMSwgMCwgMCwgMSwgMCwgMSwgMCwgMSwgMCwgMCwgMSwgMSwgMSwgMSwgMSwgMV0pKTtcbiAgICAgICAgdGhpcy5fZ2wudGV4UGFyYW1ldGVyaSh0aGlzLl9nbC5URVhUVVJFXzJELCB0aGlzLl9nbC5URVhUVVJFX01BR19GSUxURVIsIHRoaXMuX2dsLk5FQVJFU1QpO1xuICAgICAgICB0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgdGhpcy5fZ2wuTkVBUkVTVCk7XG4gICAgICAgIHRoaXMuX2dsLnRleFBhcmFtZXRlcmkodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy5fZ2wuVEVYVFVSRV9XUkFQX1MsIHRoaXMuX2dsLkNMQU1QX1RPX0VER0UpO1xuICAgICAgICB0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfV1JBUF9ULCB0aGlzLl9nbC5DTEFNUF9UT19FREdFKTtcbiAgICAgICAgdGhpcy5fZ2wuYmluZFRleHR1cmUodGhpcy5fZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XG4gICAgfVxuXG4gICAgLyoqXHJcbiAgICAgKiBnZXRDb250ZXh0XHJcbiAgICAgKiBAcmV0dXJucyB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fVxyXG4gICAgICovXG5cblxuICAgIF9jcmVhdGVDbGFzcyhXZWJDTEdMLCBbe1xuICAgICAgICBrZXk6IFwiZ2V0Q29udGV4dFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0Q29udGV4dCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9nbDtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImdldE1heERyYXdCdWZmZXJzXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBnZXRNYXhEcmF3QnVmZmVyc1xyXG4gICAgICAgICAqIEByZXR1cm5zIHtpbnR9XHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRNYXhEcmF3QnVmZmVycygpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9tYXhEcmF3QnVmZmVycztcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImNoZWNrRnJhbWVidWZmZXJTdGF0dXNcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIGNoZWNrRnJhbWVidWZmZXJTdGF0dXNcclxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNoZWNrRnJhbWVidWZmZXJTdGF0dXMoKSB7XG4gICAgICAgICAgICB2YXIgc3RhID0gdGhpcy5fZ2wuY2hlY2tGcmFtZWJ1ZmZlclN0YXR1cyh0aGlzLl9nbC5GUkFNRUJVRkZFUik7XG4gICAgICAgICAgICB2YXIgZmVycm9ycyA9IHt9O1xuICAgICAgICAgICAgZmVycm9yc1t0aGlzLl9nbC5GUkFNRUJVRkZFUl9DT01QTEVURV0gPSB0cnVlO1xuICAgICAgICAgICAgZmVycm9yc1t0aGlzLl9nbC5GUkFNRUJVRkZFUl9JTkNPTVBMRVRFX0FUVEFDSE1FTlRdID0gXCJGUkFNRUJVRkZFUl9JTkNPTVBMRVRFX0FUVEFDSE1FTlQ6IFRoZSBhdHRhY2htZW50IHR5cGVzIGFyZSBtaXNtYXRjaGVkIG9yIG5vdCBhbGwgZnJhbWVidWZmZXIgYXR0YWNobWVudCBwb2ludHMgYXJlIGZyYW1lYnVmZmVyIGF0dGFjaG1lbnQgY29tcGxldGVcIjtcbiAgICAgICAgICAgIGZlcnJvcnNbdGhpcy5fZ2wuRlJBTUVCVUZGRVJfSU5DT01QTEVURV9NSVNTSU5HX0FUVEFDSE1FTlRdID0gXCJGUkFNRUJVRkZFUl9JTkNPTVBMRVRFX01JU1NJTkdfQVRUQUNITUVOVDogVGhlcmUgaXMgbm8gYXR0YWNobWVudFwiO1xuICAgICAgICAgICAgZmVycm9yc1t0aGlzLl9nbC5GUkFNRUJVRkZFUl9JTkNPTVBMRVRFX0RJTUVOU0lPTlNdID0gXCJGUkFNRUJVRkZFUl9JTkNPTVBMRVRFX0RJTUVOU0lPTlM6IEhlaWdodCBhbmQgd2lkdGggb2YgdGhlIGF0dGFjaG1lbnQgYXJlIG5vdCB0aGUgc2FtZVwiO1xuICAgICAgICAgICAgZmVycm9yc1t0aGlzLl9nbC5GUkFNRUJVRkZFUl9VTlNVUFBPUlRFRF0gPSBcIkZSQU1FQlVGRkVSX1VOU1VQUE9SVEVEOiBUaGUgZm9ybWF0IG9mIHRoZSBhdHRhY2htZW50IGlzIG5vdCBzdXBwb3J0ZWQgb3IgaWYgZGVwdGggYW5kIHN0ZW5jaWwgYXR0YWNobWVudHMgYXJlIG5vdCB0aGUgc2FtZSByZW5kZXJidWZmZXJcIjtcbiAgICAgICAgICAgIGlmIChmZXJyb3JzW3N0YV0gIT09IHRydWUgfHwgZmVycm9yc1tzdGFdID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZmVycm9yc1tzdGFdKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImNvcHlcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIGNvcHlcclxuICAgICAgICAgKiBAcGFyYW0ge1dlYkNMR0xLZXJuZWx8V2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbX0gcGdyXHJcbiAgICAgICAgICogQHBhcmFtIHtBcnJheTxXZWJDTEdMQnVmZmVyPn0gW3dlYkNMR0xCdWZmZXJzPW51bGxdXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjb3B5KHBnciwgd2ViQ0xHTEJ1ZmZlcnMpIHtcbiAgICAgICAgICAgIGlmICh3ZWJDTEdMQnVmZmVycyAhPT0gdW5kZWZpbmVkICYmIHdlYkNMR0xCdWZmZXJzICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKHdlYkNMR0xCdWZmZXJzWzBdICE9PSB1bmRlZmluZWQgJiYgd2ViQ0xHTEJ1ZmZlcnNbMF0gIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wudmlld3BvcnQoMCwgMCwgd2ViQ0xHTEJ1ZmZlcnNbMF0uVywgd2ViQ0xHTEJ1ZmZlcnNbMF0uSCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEZyYW1lYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCB3ZWJDTEdMQnVmZmVyc1swXS5mQnVmZmVyKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFyckRCdWZmID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmbiA9IHdlYkNMR0xCdWZmZXJzLmxlbmd0aDsgbiA8IGZuOyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3ZWJDTEdMQnVmZmVyc1tuXSAhPT0gdW5kZWZpbmVkICYmIHdlYkNMR0xCdWZmZXJzW25dICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wuZnJhbWVidWZmZXJUZXh0dXJlMkQodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIHRoaXMuX2FyckV4dFtcIldFQkdMX2RyYXdfYnVmZmVyc1wiXVsnQ09MT1JfQVRUQUNITUVOVCcgKyBuICsgJ19XRUJHTCddLCB0aGlzLl9nbC5URVhUVVJFXzJELCB3ZWJDTEdMQnVmZmVyc1tuXS50ZXh0dXJlRGF0YSwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyREJ1ZmZbbl0gPSB0aGlzLl9hcnJFeHRbXCJXRUJHTF9kcmF3X2J1ZmZlcnNcIl1bJ0NPTE9SX0FUVEFDSE1FTlQnICsgbiArICdfV0VCR0wnXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBhcnJEQnVmZltuXSA9IHRoaXMuX2dsWydOT05FJ107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXJyRXh0W1wiV0VCR0xfZHJhd19idWZmZXJzXCJdLmRyYXdCdWZmZXJzV0VCR0woYXJyREJ1ZmYpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNoZWNrRnJhbWVidWZmZXJTdGF0dXMoKSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wudXNlUHJvZ3JhbSh0aGlzLnNoYWRlcl9jb3B5VGV4dHVyZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9uID0gMCwgX2ZuID0gd2ViQ0xHTEJ1ZmZlcnMubGVuZ3RoOyBfbiA8IF9mbjsgX24rKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLmFjdGl2ZVRleHR1cmUodGhpcy5fZ2xbXCJURVhUVVJFXCIgKyBfbl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3ZWJDTEdMQnVmZmVyc1tfbl0gIT09IHVuZGVmaW5lZCAmJiB3ZWJDTEdMQnVmZmVyc1tfbl0gIT09IG51bGwpIHRoaXMuX2dsLmJpbmRUZXh0dXJlKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHdlYkNMR0xCdWZmZXJzW19uXS50ZXh0dXJlRGF0YVRlbXApO2Vsc2UgdGhpcy5fZ2wuYmluZFRleHR1cmUodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlRGF0YUF1eCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wudW5pZm9ybTFpKHRoaXMuYXJyYXlDb3B5VGV4W19uXSwgX24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvcHlOb3cod2ViQ0xHTEJ1ZmZlcnMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEZyYW1lYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgdGhpcy5fZ2wuYmluZEZyYW1lYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCBudWxsKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImNvcHlOb3dcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNvcHlOb3cod2ViQ0xHTEJ1ZmZlcnMpIHtcbiAgICAgICAgICAgIHRoaXMuX2dsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHRoaXMuYXR0cl9jb3B5VGV4dHVyZV9wb3MpO1xuICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEJ1ZmZlcih0aGlzLl9nbC5BUlJBWV9CVUZGRVIsIHRoaXMudmVydGV4QnVmZmVyX1FVQUQpO1xuICAgICAgICAgICAgdGhpcy5fZ2wudmVydGV4QXR0cmliUG9pbnRlcih0aGlzLmF0dHJfY29weVRleHR1cmVfcG9zLCAzLCB0aGlzLl9nbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuXG4gICAgICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCB0aGlzLmluZGV4QnVmZmVyX1FVQUQpO1xuICAgICAgICAgICAgdGhpcy5fZ2wuZHJhd0VsZW1lbnRzKHRoaXMuX2dsLlRSSUFOR0xFUywgNiwgdGhpcy5fZ2wuVU5TSUdORURfU0hPUlQsIDApO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY3JlYXRlQnVmZmVyXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBDcmVhdGUgYSBlbXB0eSBXZWJDTEdMQnVmZmVyXHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IFt0eXBlPVwiRkxPQVRcIl0gdHlwZSBGTE9BVDQgT1IgRkxPQVRcclxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtsaW5lYXI9ZmFsc2VdIGxpbmVhciB0ZXhQYXJhbWV0ZXJpIHR5cGUgZm9yIHRoZSBXZWJHTFRleHR1cmVcclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gW21vZGU9XCJTQU1QTEVSXCJdIE1vZGUgZm9yIHRoaXMgYnVmZmVyLiBcIlNBTVBMRVJcIiwgXCJBVFRSSUJVVEVcIiwgXCJWRVJURVhfSU5ERVhcIlxyXG4gICAgICAgICAqIEByZXR1cm5zIHtXZWJDTEdMQnVmZmVyfVxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlQnVmZmVyKHR5cGUsIGxpbmVhciwgbW9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBfV2ViQ0xHTEJ1ZmZlci5XZWJDTEdMQnVmZmVyKHRoaXMuX2dsLCB0eXBlLCBsaW5lYXIsIG1vZGUpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY3JlYXRlS2VybmVsXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBDcmVhdGUgYSBrZXJuZWxcclxuICAgICAgICAgKiBAcmV0dXJucyB7V2ViQ0xHTEtlcm5lbH1cclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gW3NvdXJjZT11bmRlZmluZWRdXHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IFtoZWFkZXI9dW5kZWZpbmVkXSBBZGRpdGlvbmFsIGZ1bmN0aW9uc1xyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlS2VybmVsKHNvdXJjZSwgaGVhZGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IF9XZWJDTEdMS2VybmVsLldlYkNMR0xLZXJuZWwodGhpcy5fZ2wsIHNvdXJjZSwgaGVhZGVyKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImNyZWF0ZVZlcnRleEZyYWdtZW50UHJvZ3JhbVwiLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQ3JlYXRlIGEgdmVydGV4IGFuZCBmcmFnbWVudCBwcm9ncmFtcyBmb3IgYSBXZWJHTCBncmFwaGljYWwgcmVwcmVzZW50YXRpb24gYWZ0ZXIgc29tZSBlbnF1ZXVlTkRSYW5nZUtlcm5lbFxyXG4gICAgICAgICAqIEByZXR1cm5zIHtXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtfVxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBbdmVydGV4U291cmNlPXVuZGVmaW5lZF1cclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gW3ZlcnRleEhlYWRlcj11bmRlZmluZWRdXHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IFtmcmFnbWVudFNvdXJjZT11bmRlZmluZWRdXHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IFtmcmFnbWVudEhlYWRlcj11bmRlZmluZWRdXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjcmVhdGVWZXJ0ZXhGcmFnbWVudFByb2dyYW0odmVydGV4U291cmNlLCB2ZXJ0ZXhIZWFkZXIsIGZyYWdtZW50U291cmNlLCBmcmFnbWVudEhlYWRlcikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBfV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbS5XZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtKHRoaXMuX2dsLCB2ZXJ0ZXhTb3VyY2UsIHZlcnRleEhlYWRlciwgZnJhZ21lbnRTb3VyY2UsIGZyYWdtZW50SGVhZGVyKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImZpbGxCdWZmZXJcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIGZpbGxCdWZmZXIgd2l0aCBjb2xvclxyXG4gICAgICAgICAqIEBwYXJhbSB7V2ViR0xUZXh0dXJlfSB0ZXh0dXJlXHJcbiAgICAgICAgICogQHBhcmFtIHtBcnJheTxGbG9hdD59IGNsZWFyQ29sb3JcclxuICAgICAgICAgKiBAcGFyYW0ge1dlYkdMRnJhbWVidWZmZXJ9IGZCdWZmZXJcclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGZpbGxCdWZmZXIodGV4dHVyZSwgY2xlYXJDb2xvciwgZkJ1ZmZlcikge1xuICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEZyYW1lYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCBmQnVmZmVyKTtcbiAgICAgICAgICAgIHRoaXMuX2dsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCB0aGlzLl9hcnJFeHRbXCJXRUJHTF9kcmF3X2J1ZmZlcnNcIl1bJ0NPTE9SX0FUVEFDSE1FTlQwX1dFQkdMJ10sIHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRleHR1cmUsIDApO1xuXG4gICAgICAgICAgICB2YXIgYXJyREJ1ZmYgPSBbdGhpcy5fYXJyRXh0W1wiV0VCR0xfZHJhd19idWZmZXJzXCJdWydDT0xPUl9BVFRBQ0hNRU5UMF9XRUJHTCddXTtcbiAgICAgICAgICAgIHRoaXMuX2FyckV4dFtcIldFQkdMX2RyYXdfYnVmZmVyc1wiXS5kcmF3QnVmZmVyc1dFQkdMKGFyckRCdWZmKTtcblxuICAgICAgICAgICAgaWYgKGNsZWFyQ29sb3IgIT09IHVuZGVmaW5lZCAmJiBjbGVhckNvbG9yICE9PSBudWxsKSB0aGlzLl9nbC5jbGVhckNvbG9yKGNsZWFyQ29sb3JbMF0sIGNsZWFyQ29sb3JbMV0sIGNsZWFyQ29sb3JbMl0sIGNsZWFyQ29sb3JbM10pO1xuICAgICAgICAgICAgdGhpcy5fZ2wuY2xlYXIodGhpcy5fZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJiaW5kQXR0cmlidXRlVmFsdWVcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIGJpbmRBdHRyaWJ1dGVWYWx1ZVxyXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpblZhbHVlXHJcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMQnVmZmVyfSBidWZmXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBiaW5kQXR0cmlidXRlVmFsdWUoaW5WYWx1ZSwgYnVmZikge1xuICAgICAgICAgICAgaWYgKGJ1ZmYgIT09IHVuZGVmaW5lZCAmJiBidWZmICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGluVmFsdWUudHlwZSA9PT0gJ2Zsb2F0NF9mcm9tQXR0cicpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoaW5WYWx1ZS5sb2NhdGlvblswXSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRCdWZmZXIodGhpcy5fZ2wuQVJSQVlfQlVGRkVSLCBidWZmLnZlcnRleERhdGEwKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wudmVydGV4QXR0cmliUG9pbnRlcihpblZhbHVlLmxvY2F0aW9uWzBdLCA0LCB0aGlzLl9nbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5WYWx1ZS50eXBlID09PSAnZmxvYXRfZnJvbUF0dHInKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGluVmFsdWUubG9jYXRpb25bMF0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkFSUkFZX0JVRkZFUiwgYnVmZi52ZXJ0ZXhEYXRhMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLnZlcnRleEF0dHJpYlBvaW50ZXIoaW5WYWx1ZS5sb2NhdGlvblswXSwgMSwgdGhpcy5fZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgdGhpcy5fZ2wuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5KGluVmFsdWUubG9jYXRpb25bMF0pO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiYmluZFNhbXBsZXJWYWx1ZVwiLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogYmluZFNhbXBsZXJWYWx1ZVxyXG4gICAgICAgICAqIEBwYXJhbSB7V2ViR0xVbmlmb3JtTG9jYXRpb259IHVCdWZmZXJXaWR0aFxyXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpblZhbHVlXHJcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMQnVmZmVyfSBidWZmXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBiaW5kU2FtcGxlclZhbHVlKHVCdWZmZXJXaWR0aCwgaW5WYWx1ZSwgYnVmZikge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRUZXh0dXJlVW5pdCA8IDE2KSB0aGlzLl9nbC5hY3RpdmVUZXh0dXJlKHRoaXMuX2dsW1wiVEVYVFVSRVwiICsgdGhpcy5fY3VycmVudFRleHR1cmVVbml0XSk7ZWxzZSB0aGlzLl9nbC5hY3RpdmVUZXh0dXJlKHRoaXMuX2dsW1wiVEVYVFVSRTE2XCJdKTtcblxuICAgICAgICAgICAgaWYgKGJ1ZmYgIT09IHVuZGVmaW5lZCAmJiBidWZmICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuYmluZFRleHR1cmUodGhpcy5fZ2wuVEVYVFVSRV8yRCwgYnVmZi50ZXh0dXJlRGF0YSk7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fYnVmZmVyV2lkdGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnVmZmVyV2lkdGggPSBidWZmLlc7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLnVuaWZvcm0xZih1QnVmZmVyV2lkdGgsIHRoaXMuX2J1ZmZlcldpZHRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgdGhpcy5fZ2wuYmluZFRleHR1cmUodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlRGF0YUF1eCk7XG4gICAgICAgICAgICB0aGlzLl9nbC51bmlmb3JtMWkoaW5WYWx1ZS5sb2NhdGlvblswXSwgdGhpcy5fY3VycmVudFRleHR1cmVVbml0KTtcblxuICAgICAgICAgICAgdGhpcy5fY3VycmVudFRleHR1cmVVbml0Kys7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJiaW5kVW5pZm9ybVZhbHVlXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBiaW5kVW5pZm9ybVZhbHVlXHJcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGluVmFsdWVcclxuICAgICAgICAgKiBAcGFyYW0ge1dlYkNMR0xCdWZmZXJ8TnVtYmVyfEFycmF5PGZsb2F0Pn0gYnVmZlxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gYmluZFVuaWZvcm1WYWx1ZShpblZhbHVlLCBidWZmKSB7XG4gICAgICAgICAgICBpZiAoYnVmZiAhPT0gdW5kZWZpbmVkICYmIGJ1ZmYgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5WYWx1ZS50eXBlID09PSAnZmxvYXQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChidWZmLmNvbnN0cnVjdG9yID09PSBBcnJheSkgdGhpcy5fZ2wudW5pZm9ybTFmdihpblZhbHVlLmxvY2F0aW9uWzBdLCBidWZmKTtlbHNlIHRoaXMuX2dsLnVuaWZvcm0xZihpblZhbHVlLmxvY2F0aW9uWzBdLCBidWZmKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGluVmFsdWUudHlwZSA9PT0gJ2Zsb2F0NCcpIHRoaXMuX2dsLnVuaWZvcm00ZihpblZhbHVlLmxvY2F0aW9uWzBdLCBidWZmWzBdLCBidWZmWzFdLCBidWZmWzJdLCBidWZmWzNdKTtlbHNlIGlmIChpblZhbHVlLnR5cGUgPT09ICdtYXQ0JykgdGhpcy5fZ2wudW5pZm9ybU1hdHJpeDRmdihpblZhbHVlLmxvY2F0aW9uWzBdLCBmYWxzZSwgYnVmZik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJiaW5kVmFsdWVcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIGJpbmRWYWx1ZVxyXG4gICAgICAgICAqIEBwYXJhbSB7V2ViQ0xHTEtlcm5lbHxXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtfSB3ZWJDTEdMUHJvZ3JhbVxyXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpblZhbHVlXHJcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMQnVmZmVyfGZsb2F0fEFycmF5PGZsb2F0PnxGbG9hdDMyQXJyYXl8VWludDhBcnJheX0gYXJnVmFsdWVcclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGJpbmRWYWx1ZSh3ZWJDTEdMUHJvZ3JhbSwgaW5WYWx1ZSwgYXJnVmFsdWUpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoaW5WYWx1ZS5leHBlY3RlZE1vZGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwiQVRUUklCVVRFXCI6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYmluZEF0dHJpYnV0ZVZhbHVlKGluVmFsdWUsIGFyZ1ZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlNBTVBMRVJcIjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5iaW5kU2FtcGxlclZhbHVlKHdlYkNMR0xQcm9ncmFtLnVCdWZmZXJXaWR0aCwgaW5WYWx1ZSwgYXJnVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiVU5JRk9STVwiOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmJpbmRVbmlmb3JtVmFsdWUoaW5WYWx1ZSwgYXJnVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImJpbmRGQlwiLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogYmluZEZCXHJcbiAgICAgICAgICogQHBhcmFtIHtBcnJheTxXZWJDTEdMQnVmZmVyPn0gW3dlYkNMR0xCdWZmZXJzPW51bGxdXHJcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBvdXRwdXRUb1RlbXBcclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGJpbmRGQih3ZWJDTEdMQnVmZmVycywgb3V0cHV0VG9UZW1wKSB7XG4gICAgICAgICAgICBpZiAod2ViQ0xHTEJ1ZmZlcnMgIT09IHVuZGVmaW5lZCAmJiB3ZWJDTEdMQnVmZmVycyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmICh3ZWJDTEdMQnVmZmVyc1swXSAhPT0gdW5kZWZpbmVkICYmIHdlYkNMR0xCdWZmZXJzWzBdICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLnZpZXdwb3J0KDAsIDAsIHdlYkNMR0xCdWZmZXJzWzBdLlcsIHdlYkNMR0xCdWZmZXJzWzBdLkgpO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRGcmFtZWJ1ZmZlcih0aGlzLl9nbC5GUkFNRUJVRkZFUiwgb3V0cHV0VG9UZW1wID09PSB0cnVlID8gd2ViQ0xHTEJ1ZmZlcnNbMF0uZkJ1ZmZlclRlbXAgOiB3ZWJDTEdMQnVmZmVyc1swXS5mQnVmZmVyKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFyckRCdWZmID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmbiA9IHdlYkNMR0xCdWZmZXJzLmxlbmd0aDsgbiA8IGZuOyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3ZWJDTEdMQnVmZmVyc1tuXSAhPT0gdW5kZWZpbmVkICYmIHdlYkNMR0xCdWZmZXJzW25dICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG8gPSBvdXRwdXRUb1RlbXAgPT09IHRydWUgPyB3ZWJDTEdMQnVmZmVyc1tuXS50ZXh0dXJlRGF0YVRlbXAgOiB3ZWJDTEdMQnVmZmVyc1tuXS50ZXh0dXJlRGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbC5mcmFtZWJ1ZmZlclRleHR1cmUyRCh0aGlzLl9nbC5GUkFNRUJVRkZFUiwgdGhpcy5fYXJyRXh0W1wiV0VCR0xfZHJhd19idWZmZXJzXCJdWydDT0xPUl9BVFRBQ0hNRU5UJyArIG4gKyAnX1dFQkdMJ10sIHRoaXMuX2dsLlRFWFRVUkVfMkQsIG8sIDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyckRCdWZmW25dID0gdGhpcy5fYXJyRXh0W1wiV0VCR0xfZHJhd19idWZmZXJzXCJdWydDT0xPUl9BVFRBQ0hNRU5UJyArIG4gKyAnX1dFQkdMJ107XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgYXJyREJ1ZmZbbl0gPSB0aGlzLl9nbFsnTk9ORSddO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2FyckV4dFtcIldFQkdMX2RyYXdfYnVmZmVyc1wiXS5kcmF3QnVmZmVyc1dFQkdMKGFyckRCdWZmKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jaGVja0ZyYW1lYnVmZmVyU3RhdHVzKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEZyYW1lYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kRnJhbWVidWZmZXIodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZW5xdWV1ZU5EUmFuZ2VLZXJuZWxcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFBlcmZvcm0gY2FsY3VsYXRpb24gYW5kIHNhdmUgdGhlIHJlc3VsdCBvbiBhIFdlYkNMR0xCdWZmZXJcclxuICAgICAgICAgKiBAcGFyYW0ge1dlYkNMR0xLZXJuZWx9IHdlYkNMR0xLZXJuZWxcclxuICAgICAgICAgKiBAcGFyYW0ge1dlYkNMR0xCdWZmZXJ8QXJyYXk8V2ViQ0xHTEJ1ZmZlcj59IFt3ZWJDTEdMQnVmZmVyPW51bGxdXHJcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBvdXRwdXRUb1RlbXBcclxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYXJnVmFsdWVzXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBlbnF1ZXVlTkRSYW5nZUtlcm5lbCh3ZWJDTEdMS2VybmVsLCB3ZWJDTEdMQnVmZmVyLCBvdXRwdXRUb1RlbXAsIGFyZ1ZhbHVlcykge1xuICAgICAgICAgICAgdGhpcy5fYnVmZmVyV2lkdGggPSAwO1xuXG4gICAgICAgICAgICB0aGlzLl9nbC51c2VQcm9ncmFtKHdlYkNMR0xLZXJuZWwua2VybmVsKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuYmluZEZCKHdlYkNMR0xCdWZmZXIsIG91dHB1dFRvVGVtcCkgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50VGV4dHVyZVVuaXQgPSAwO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB3ZWJDTEdMS2VybmVsLmluX3ZhbHVlcykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmJpbmRWYWx1ZSh3ZWJDTEdMS2VybmVsLCB3ZWJDTEdMS2VybmVsLmluX3ZhbHVlc1trZXldLCBhcmdWYWx1ZXNba2V5XSk7XG4gICAgICAgICAgICAgICAgfXRoaXMuX2dsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHdlYkNMR0xLZXJuZWwuYXR0cl9WZXJ0ZXhQb3MpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRCdWZmZXIodGhpcy5fZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnZlcnRleEJ1ZmZlcl9RVUFEKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHdlYkNMR0xLZXJuZWwuYXR0cl9WZXJ0ZXhQb3MsIDMsIHRoaXMuX2dsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCB0aGlzLmluZGV4QnVmZmVyX1FVQUQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmRyYXdFbGVtZW50cyh0aGlzLl9nbC5UUklBTkdMRVMsIDYsIHRoaXMuX2dsLlVOU0lHTkVEX1NIT1JULCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImVucXVldWVWZXJ0ZXhGcmFnbWVudFByb2dyYW1cIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFBlcmZvcm0gV2ViR0wgZ3JhcGhpY2FsIHJlcHJlc2VudGF0aW9uXHJcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtfSB3ZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtXHJcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMQnVmZmVyfSBidWZmZXJJbmQgQnVmZmVyIHRvIGRyYXcgdHlwZSAodHlwZSBpbmRpY2VzIG9yIHZlcnRleClcclxuICAgICAgICAgKiBAcGFyYW0ge2ludH0gW2RyYXdNb2RlPTRdIDA9UE9JTlRTLCAzPUxJTkVfU1RSSVAsIDI9TElORV9MT09QLCAxPUxJTkVTLCA1PVRSSUFOR0xFX1NUUklQLCA2PVRSSUFOR0xFX0ZBTiBhbmQgND1UUklBTkdMRVNcclxuICAgICAgICAgKiBAcGFyYW0ge1dlYkNMR0xCdWZmZXJ8QXJyYXk8V2ViQ0xHTEJ1ZmZlcj59IFt3ZWJDTEdMQnVmZmVyPW51bGxdXHJcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBvdXRwdXRUb1RlbXBcclxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYXJnVmFsdWVzXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBlbnF1ZXVlVmVydGV4RnJhZ21lbnRQcm9ncmFtKHdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0sIGJ1ZmZlckluZCwgZHJhd01vZGUsIHdlYkNMR0xCdWZmZXIsIG91dHB1dFRvVGVtcCwgYXJnVmFsdWVzKSB7XG4gICAgICAgICAgICB0aGlzLl9idWZmZXJXaWR0aCA9IDA7XG5cbiAgICAgICAgICAgIHRoaXMuX2dsLnVzZVByb2dyYW0od2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbS52ZXJ0ZXhGcmFnbWVudFByb2dyYW0pO1xuXG4gICAgICAgICAgICB2YXIgRG1vZGUgPSBkcmF3TW9kZSAhPT0gdW5kZWZpbmVkICYmIGRyYXdNb2RlICE9PSBudWxsID8gZHJhd01vZGUgOiA0O1xuXG4gICAgICAgICAgICBpZiAodGhpcy5iaW5kRkIod2ViQ0xHTEJ1ZmZlciwgb3V0cHV0VG9UZW1wKSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIGlmIChidWZmZXJJbmQgIT09IHVuZGVmaW5lZCAmJiBidWZmZXJJbmQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudFRleHR1cmVVbml0ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0uaW5fdmVydGV4X3ZhbHVlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5iaW5kVmFsdWUod2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbSwgd2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbS5pbl92ZXJ0ZXhfdmFsdWVzW2tleV0sIGFyZ1ZhbHVlc1trZXldKTtcbiAgICAgICAgICAgICAgICAgICAgfWZvciAodmFyIF9rZXkgaW4gd2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbS5pbl9mcmFnbWVudF92YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYmluZFZhbHVlKHdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0sIHdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0uaW5fZnJhZ21lbnRfdmFsdWVzW19rZXldLCBhcmdWYWx1ZXNbX2tleV0pO1xuICAgICAgICAgICAgICAgICAgICB9aWYgKGJ1ZmZlckluZC5tb2RlID09PSBcIlZFUlRFWF9JTkRFWFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBidWZmZXJJbmQudmVydGV4RGF0YTApO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wuZHJhd0VsZW1lbnRzKERtb2RlLCBidWZmZXJJbmQubGVuZ3RoLCB0aGlzLl9nbC5VTlNJR05FRF9TSE9SVCwgMCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB0aGlzLl9nbC5kcmF3QXJyYXlzKERtb2RlLCAwLCBidWZmZXJJbmQubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJyZWFkQnVmZmVyXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBHZXQgRmxvYXQzMkFycmF5IGFycmF5IGZyb20gYSBXZWJDTEdMQnVmZmVyXHJcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMQnVmZmVyfSBidWZmZXJcclxuICAgICAgICAgKiBAcmV0dXJucyB7RmxvYXQzMkFycmF5fVxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcmVhZEJ1ZmZlcihidWZmZXIpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmUgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmUud2lkdGggPSBidWZmZXIuVztcbiAgICAgICAgICAgICAgICB0aGlzLmUuaGVpZ2h0ID0gYnVmZmVyLkg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX2dsLnVzZVByb2dyYW0odGhpcy5zaGFkZXJfcmVhZHBpeGVscyk7XG5cbiAgICAgICAgICAgIHRoaXMuX2dsLnZpZXdwb3J0KDAsIDAsIGJ1ZmZlci5XLCBidWZmZXIuSCk7XG4gICAgICAgICAgICB0aGlzLl9nbC5iaW5kRnJhbWVidWZmZXIodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIGJ1ZmZlci5mQnVmZmVyVGVtcCk7XG4gICAgICAgICAgICB0aGlzLl9nbC5mcmFtZWJ1ZmZlclRleHR1cmUyRCh0aGlzLl9nbC5GUkFNRUJVRkZFUiwgdGhpcy5fYXJyRXh0W1wiV0VCR0xfZHJhd19idWZmZXJzXCJdWydDT0xPUl9BVFRBQ0hNRU5UMF9XRUJHTCddLCB0aGlzLl9nbC5URVhUVVJFXzJELCBidWZmZXIudGV4dHVyZURhdGFUZW1wLCAwKTtcblxuICAgICAgICAgICAgdmFyIGFyckRCdWZmID0gW3RoaXMuX2FyckV4dFtcIldFQkdMX2RyYXdfYnVmZmVyc1wiXVsnQ09MT1JfQVRUQUNITUVOVDBfV0VCR0wnXV07XG4gICAgICAgICAgICB0aGlzLl9hcnJFeHRbXCJXRUJHTF9kcmF3X2J1ZmZlcnNcIl0uZHJhd0J1ZmZlcnNXRUJHTChhcnJEQnVmZik7XG5cbiAgICAgICAgICAgIHRoaXMuX2dsLmFjdGl2ZVRleHR1cmUodGhpcy5fZ2wuVEVYVFVSRTApO1xuICAgICAgICAgICAgdGhpcy5fZ2wuYmluZFRleHR1cmUodGhpcy5fZ2wuVEVYVFVSRV8yRCwgYnVmZmVyLnRleHR1cmVEYXRhKTtcbiAgICAgICAgICAgIHRoaXMuX2dsLnVuaWZvcm0xaSh0aGlzLnNhbXBsZXJfYnVmZmVyLCAwKTtcblxuICAgICAgICAgICAgdGhpcy5fZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkodGhpcy5hdHRyX1ZlcnRleFBvcyk7XG4gICAgICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkFSUkFZX0JVRkZFUiwgdGhpcy52ZXJ0ZXhCdWZmZXJfUVVBRCk7XG4gICAgICAgICAgICB0aGlzLl9nbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHRoaXMuYXR0cl9WZXJ0ZXhQb3MsIDMsIGJ1ZmZlci5fc3VwcG9ydEZvcm1hdCwgZmFsc2UsIDAsIDApO1xuXG4gICAgICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCB0aGlzLmluZGV4QnVmZmVyX1FVQUQpO1xuICAgICAgICAgICAgdGhpcy5fZ2wuZHJhd0VsZW1lbnRzKHRoaXMuX2dsLlRSSUFOR0xFUywgNiwgdGhpcy5fZ2wuVU5TSUdORURfU0hPUlQsIDApO1xuXG4gICAgICAgICAgICBpZiAoYnVmZmVyLm91dEFycmF5RmxvYXQgPT09IHVuZGVmaW5lZCB8fCBidWZmZXIub3V0QXJyYXlGbG9hdCA9PT0gbnVsbCkgYnVmZmVyLm91dEFycmF5RmxvYXQgPSBuZXcgRmxvYXQzMkFycmF5KGJ1ZmZlci5XICogYnVmZmVyLkggKiA0KTtcbiAgICAgICAgICAgIHRoaXMuX2dsLnJlYWRQaXhlbHMoMCwgMCwgYnVmZmVyLlcsIGJ1ZmZlci5ILCB0aGlzLl9nbC5SR0JBLCB0aGlzLl9nbC5GTE9BVCwgYnVmZmVyLm91dEFycmF5RmxvYXQpO1xuXG4gICAgICAgICAgICBpZiAoYnVmZmVyLnR5cGUgPT09IFwiRkxPQVRcIikge1xuICAgICAgICAgICAgICAgIHZhciBmZCA9IG5ldyBGbG9hdDMyQXJyYXkoYnVmZmVyLm91dEFycmF5RmxvYXQubGVuZ3RoIC8gNCk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGZuID0gYnVmZmVyLm91dEFycmF5RmxvYXQubGVuZ3RoIC8gNDsgbiA8IGZuOyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgZmRbbl0gPSBidWZmZXIub3V0QXJyYXlGbG9hdFtuICogNF07XG4gICAgICAgICAgICAgICAgfWJ1ZmZlci5vdXRBcnJheUZsb2F0ID0gZmQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBidWZmZXIub3V0QXJyYXlGbG9hdDtcbiAgICAgICAgfVxuICAgIH1dLCBbe1xuICAgICAgICBrZXk6IFwiZW5xdWV1ZVJlYWRCdWZmZXJfV2ViR0xUZXh0dXJlXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBHZXQgdGhlIGludGVybmFsbHkgV2ViR0xUZXh0dXJlICh0eXBlIEZMT0FUKSwgaWYgdGhlIFdlYkdMUmVuZGVyaW5nQ29udGV4dCB3YXMgZ2l2ZW4uXHJcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMQnVmZmVyfSBidWZmZXJcclxuICAgICAgICAgKiBAcmV0dXJucyB7V2ViR0xUZXh0dXJlfVxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZW5xdWV1ZVJlYWRCdWZmZXJfV2ViR0xUZXh0dXJlKGJ1ZmZlcikge1xuICAgICAgICAgICAgcmV0dXJuIGJ1ZmZlci50ZXh0dXJlRGF0YTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBXZWJDTEdMO1xufSgpO1xuXG5nbG9iYWwuV2ViQ0xHTCA9IFdlYkNMR0w7XG5tb2R1bGUuZXhwb3J0cy5XZWJDTEdMID0gV2ViQ0xHTDsiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG4vKipcclxuKiBXZWJDTEdMQnVmZmVyXHJcbiogQGNsYXNzXHJcbiAqIEBwYXJhbSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbFxyXG4gKiBAcGFyYW0ge1N0cmluZ30gW3R5cGU9XCJGTE9BVFwiXVxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtsaW5lYXI9dHJ1ZV1cclxuICogQHBhcmFtIHtTdHJpbmd9IFttb2RlPVwiU0FNUExFUlwiXSBcIlNBTVBMRVJcIiwgXCJBVFRSSUJVVEVcIiwgXCJWRVJURVhfSU5ERVhcIlxyXG4qL1xudmFyIFdlYkNMR0xCdWZmZXIgPSBleHBvcnRzLldlYkNMR0xCdWZmZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gV2ViQ0xHTEJ1ZmZlcihnbCwgdHlwZSwgbGluZWFyLCBtb2RlKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBXZWJDTEdMQnVmZmVyKTtcblxuICAgICAgICB0aGlzLl9nbCA9IGdsO1xuXG4gICAgICAgIHRoaXMudHlwZSA9IHR5cGUgIT09IHVuZGVmaW5lZCB8fCB0eXBlICE9PSBudWxsID8gdHlwZSA6ICdGTE9BVCc7XG4gICAgICAgIHRoaXMuX3N1cHBvcnRGb3JtYXQgPSB0aGlzLl9nbC5GTE9BVDtcblxuICAgICAgICB0aGlzLmxpbmVhciA9IGxpbmVhciAhPT0gdW5kZWZpbmVkIHx8IGxpbmVhciAhPT0gbnVsbCA/IGxpbmVhciA6IHRydWU7XG4gICAgICAgIHRoaXMubW9kZSA9IG1vZGUgIT09IHVuZGVmaW5lZCB8fCBtb2RlICE9PSBudWxsID8gbW9kZSA6IFwiU0FNUExFUlwiO1xuXG4gICAgICAgIHRoaXMuVyA9IG51bGw7XG4gICAgICAgIHRoaXMuSCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy50ZXh0dXJlRGF0YSA9IG51bGw7XG4gICAgICAgIHRoaXMudGV4dHVyZURhdGFUZW1wID0gbnVsbDtcbiAgICAgICAgdGhpcy52ZXJ0ZXhEYXRhMCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5mQnVmZmVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5yZW5kZXJCdWZmZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmZCdWZmZXJUZW1wID0gbnVsbDtcbiAgICAgICAgdGhpcy5yZW5kZXJCdWZmZXJUZW1wID0gbnVsbDtcblxuICAgICAgICBpZiAodGhpcy5tb2RlID09PSBcIlNBTVBMRVJcIikge1xuICAgICAgICAgICAgdGhpcy50ZXh0dXJlRGF0YSA9IHRoaXMuX2dsLmNyZWF0ZVRleHR1cmUoKTtcbiAgICAgICAgICAgIHRoaXMudGV4dHVyZURhdGFUZW1wID0gdGhpcy5fZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFwiU0FNUExFUlwiIHx8IHRoaXMubW9kZSA9PT0gXCJBVFRSSUJVVEVcIiB8fCB0aGlzLm1vZGUgPT09IFwiVkVSVEVYX0lOREVYXCIpIHtcbiAgICAgICAgICAgIHRoaXMudmVydGV4RGF0YTAgPSB0aGlzLl9nbC5jcmVhdGVCdWZmZXIoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxyXG4gICAgICogY3JlYXRlRnJhbWVidWZmZXJBbmRSZW5kZXJidWZmZXJcclxuICAgICAqL1xuXG5cbiAgICBfY3JlYXRlQ2xhc3MoV2ViQ0xHTEJ1ZmZlciwgW3tcbiAgICAgICAga2V5OiBcImNyZWF0ZUZyYW1lYnVmZmVyQW5kUmVuZGVyYnVmZmVyXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjcmVhdGVGcmFtZWJ1ZmZlckFuZFJlbmRlcmJ1ZmZlcigpIHtcbiAgICAgICAgICAgIHZhciBjcmVhdGVXZWJHTFJlbmRlckJ1ZmZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgckJ1ZmZlciA9IHRoaXMuX2dsLmNyZWF0ZVJlbmRlcmJ1ZmZlcigpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRSZW5kZXJidWZmZXIodGhpcy5fZ2wuUkVOREVSQlVGRkVSLCByQnVmZmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5yZW5kZXJidWZmZXJTdG9yYWdlKHRoaXMuX2dsLlJFTkRFUkJVRkZFUiwgdGhpcy5fZ2wuREVQVEhfQ09NUE9ORU5UMTYsIHRoaXMuVywgdGhpcy5IKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kUmVuZGVyYnVmZmVyKHRoaXMuX2dsLlJFTkRFUkJVRkZFUiwgbnVsbCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJCdWZmZXI7XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmZCdWZmZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmRlbGV0ZUZyYW1lYnVmZmVyKHRoaXMuZkJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuZGVsZXRlRnJhbWVidWZmZXIodGhpcy5mQnVmZmVyVGVtcCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5kZWxldGVSZW5kZXJidWZmZXIodGhpcy5yZW5kZXJCdWZmZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmRlbGV0ZVJlbmRlcmJ1ZmZlcih0aGlzLnJlbmRlckJ1ZmZlclRlbXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5mQnVmZmVyID0gdGhpcy5fZ2wuY3JlYXRlRnJhbWVidWZmZXIoKTtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyQnVmZmVyID0gY3JlYXRlV2ViR0xSZW5kZXJCdWZmZXIoKTtcbiAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRGcmFtZWJ1ZmZlcih0aGlzLl9nbC5GUkFNRUJVRkZFUiwgdGhpcy5mQnVmZmVyKTtcbiAgICAgICAgICAgIHRoaXMuX2dsLmZyYW1lYnVmZmVyUmVuZGVyYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCB0aGlzLl9nbC5ERVBUSF9BVFRBQ0hNRU5ULCB0aGlzLl9nbC5SRU5ERVJCVUZGRVIsIHRoaXMucmVuZGVyQnVmZmVyKTtcblxuICAgICAgICAgICAgdGhpcy5mQnVmZmVyVGVtcCA9IHRoaXMuX2dsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XG4gICAgICAgICAgICB0aGlzLnJlbmRlckJ1ZmZlclRlbXAgPSBjcmVhdGVXZWJHTFJlbmRlckJ1ZmZlcigpO1xuICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEZyYW1lYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCB0aGlzLmZCdWZmZXJUZW1wKTtcbiAgICAgICAgICAgIHRoaXMuX2dsLmZyYW1lYnVmZmVyUmVuZGVyYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCB0aGlzLl9nbC5ERVBUSF9BVFRBQ0hNRU5ULCB0aGlzLl9nbC5SRU5ERVJCVUZGRVIsIHRoaXMucmVuZGVyQnVmZmVyVGVtcCk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJ3cml0ZVdlYkdMVGV4dHVyZUJ1ZmZlclwiLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogV3JpdGUgV2ViR0xUZXh0dXJlIGJ1ZmZlclxyXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXk8ZmxvYXQ+fEZsb2F0MzJBcnJheXxVaW50OEFycmF5fFdlYkdMVGV4dHVyZXxIVE1MSW1hZ2VFbGVtZW50fSBhcnJcclxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtmbGlwPWZhbHNlXVxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gd3JpdGVXZWJHTFRleHR1cmVCdWZmZXIoYXJyLCBmbGlwKSB7XG4gICAgICAgICAgICB2YXIgcHMgPSBmdW5jdGlvbiAodGV4LCBmbGlwKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZsaXAgPT09IGZhbHNlIHx8IGZsaXAgPT09IHVuZGVmaW5lZCB8fCBmbGlwID09PSBudWxsKSB0aGlzLl9nbC5waXhlbFN0b3JlaSh0aGlzLl9nbC5VTlBBQ0tfRkxJUF9ZX1dFQkdMLCBmYWxzZSk7ZWxzZSB0aGlzLl9nbC5waXhlbFN0b3JlaSh0aGlzLl9nbC5VTlBBQ0tfRkxJUF9ZX1dFQkdMLCB0cnVlKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2dsLnBpeGVsU3RvcmVpKHRoaXMuX2dsLlVOUEFDS19QUkVNVUxUSVBMWV9BTFBIQV9XRUJHTCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRUZXh0dXJlKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRleCk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgICAgIHZhciB3cml0ZVRleE5vdyA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJyIGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAvL3RoaXMuX2dsLnRleEltYWdlMkQodGhpcy5fZ2wuVEVYVFVSRV8yRCwgMCwgdGhpcy5fZ2wuUkdCQSwgYXJyLndpZHRoLCBhcnIuaGVpZ2h0LCAwLCB0aGlzLl9nbC5SR0JBLCB0aGlzLl9nbC5VTlNJR05FRF9CWVRFLCBhcnIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50eXBlID09PSAnRkxPQVQ0JykgdGhpcy5fZ2wudGV4SW1hZ2UyRCh0aGlzLl9nbC5URVhUVVJFXzJELCAwLCB0aGlzLl9nbC5SR0JBLCB0aGlzLl9nbC5SR0JBLCB0aGlzLl9zdXBwb3J0Rm9ybWF0LCBhcnIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vdGhpcy5fZ2wudGV4SW1hZ2UyRCh0aGlzLl9nbC5URVhUVVJFXzJELCAwLCB0aGlzLl9nbC5SR0JBLCB0aGlzLlcsIHRoaXMuSCwgMCwgdGhpcy5fZ2wuUkdCQSwgdGhpcy5fc3VwcG9ydEZvcm1hdCwgYXJyLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wudGV4SW1hZ2UyRCh0aGlzLl9nbC5URVhUVVJFXzJELCAwLCB0aGlzLl9nbC5SR0JBLCB0aGlzLlcsIHRoaXMuSCwgMCwgdGhpcy5fZ2wuUkdCQSwgdGhpcy5fc3VwcG9ydEZvcm1hdCwgYXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgICAgIHZhciB0cCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgdGhpcy5fZ2wuTkVBUkVTVCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wudGV4UGFyYW1ldGVyaSh0aGlzLl9nbC5URVhUVVJFXzJELCB0aGlzLl9nbC5URVhUVVJFX01JTl9GSUxURVIsIHRoaXMuX2dsLk5FQVJFU1QpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLnRleFBhcmFtZXRlcmkodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy5fZ2wuVEVYVFVSRV9XUkFQX1MsIHRoaXMuX2dsLkNMQU1QX1RPX0VER0UpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLnRleFBhcmFtZXRlcmkodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy5fZ2wuVEVYVFVSRV9XUkFQX1QsIHRoaXMuX2dsLkNMQU1QX1RPX0VER0UpO1xuXG4gICAgICAgICAgICAgICAgLyp0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgdGhpcy5fZ2wuTElORUFSKTtcclxuICAgICAgICAgICAgICAgICB0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgdGhpcy5fZ2wuTElORUFSX01JUE1BUF9ORUFSRVNUKTtcclxuICAgICAgICAgICAgICAgICB0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfV1JBUF9TLCB0aGlzLl9nbC5DTEFNUF9UT19FREdFKTtcclxuICAgICAgICAgICAgICAgICB0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfV1JBUF9ULCB0aGlzLl9nbC5DTEFNUF9UT19FREdFKTtcclxuICAgICAgICAgICAgICAgICB0aGlzLl9nbC5nZW5lcmF0ZU1pcG1hcCh0aGlzLl9nbC5URVhUVVJFXzJEKTsqL1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgICAgICBpZiAoYXJyIGluc3RhbmNlb2YgV2ViR0xUZXh0dXJlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50ZXh0dXJlRGF0YSA9IGFycjtcbiAgICAgICAgICAgICAgICB0aGlzLnRleHR1cmVEYXRhVGVtcCA9IGFycjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcHModGhpcy50ZXh0dXJlRGF0YSwgZmxpcCk7XG4gICAgICAgICAgICAgICAgd3JpdGVUZXhOb3coYXJyKTtcbiAgICAgICAgICAgICAgICB0cCgpO1xuXG4gICAgICAgICAgICAgICAgcHModGhpcy50ZXh0dXJlRGF0YVRlbXAsIGZsaXApO1xuICAgICAgICAgICAgICAgIHdyaXRlVGV4Tm93KGFycik7XG4gICAgICAgICAgICAgICAgdHAoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5fZ2wuYmluZFRleHR1cmUodGhpcy5fZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJ3cml0ZUJ1ZmZlclwiLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogV3JpdGUgb24gYnVmZmVyXHJcbiAgICAgICAgICogQHBhcmFtIHtBcnJheTxmbG9hdD58RmxvYXQzMkFycmF5fFVpbnQ4QXJyYXl8V2ViR0xUZXh0dXJlfEhUTUxJbWFnZUVsZW1lbnR9IGFyclxyXG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2ZsaXA9ZmFsc2VdXHJcbiAgICAgICAgICogQHBhcmFtIHtBcnJheTxGbG9hdDI+fSBbb3ZlcnJpZGVEaW1lbnNpb25zPW5ldyBBcnJheSgpe01hdGguc3FydCh2YWx1ZS5sZW5ndGgpLCBNYXRoLnNxcnQodmFsdWUubGVuZ3RoKX1dXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiB3cml0ZUJ1ZmZlcihhcnIsIGZsaXAsIG92ZXJyaWRlRGltZW5zaW9ucykge1xuICAgICAgICAgICAgdmFyIHByZXBhcmVBcnIgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoYXJyIGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubGVuZ3RoLmNvbnN0cnVjdG9yID09PSBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sZW5ndGggPSB0aGlzLmxlbmd0aFswXSAqIHRoaXMubGVuZ3RoWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5XID0gdGhpcy5sZW5ndGhbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLkggPSB0aGlzLmxlbmd0aFsxXTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuVyA9IE1hdGguY2VpbChNYXRoLnNxcnQodGhpcy5sZW5ndGgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuSCA9IHRoaXMuVztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnR5cGUgPT09ICdGTE9BVDQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcnIgPSBhcnIgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgPyBhcnIgOiBuZXcgRmxvYXQzMkFycmF5KGFycik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsID0gdGhpcy5XICogdGhpcy5IICogNDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcnIubGVuZ3RoICE9PSBsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFycnQgPSBuZXcgRmxvYXQzMkFycmF5KGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDwgbDsgbisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFycnRbbl0gPSBhcnJbbl0gIT0gbnVsbCA/IGFycltuXSA6IDAuMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyID0gYXJydDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnR5cGUgPT09ICdGTE9BVCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBfbCA9IHRoaXMuVyAqIHRoaXMuSCAqIDQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXJyYXlUZW1wID0gbmV3IEZsb2F0MzJBcnJheShfbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBfbiA9IDAsIGYgPSB0aGlzLlcgKiB0aGlzLkg7IF9uIDwgZjsgX24rKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpZGQgPSBfbiAqIDQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyYXlUZW1wW2lkZF0gPSBhcnJbX25dICE9IG51bGwgPyBhcnJbX25dIDogMC4wO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFycmF5VGVtcFtpZGQgKyAxXSA9IDAuMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnJheVRlbXBbaWRkICsgMl0gPSAwLjA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyYXlUZW1wW2lkZCArIDNdID0gMC4wO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYXJyID0gYXJyYXlUZW1wO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhcnI7XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgICAgIGlmIChvdmVycmlkZURpbWVuc2lvbnMgPT09IHVuZGVmaW5lZCB8fCBvdmVycmlkZURpbWVuc2lvbnMgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJyIGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCkgdGhpcy5sZW5ndGggPSBhcnIud2lkdGggKiBhcnIuaGVpZ2h0O2Vsc2UgdGhpcy5sZW5ndGggPSB0aGlzLnR5cGUgPT09IFwiRkxPQVQ0XCIgPyBhcnIubGVuZ3RoIC8gNCA6IGFyci5sZW5ndGg7XG4gICAgICAgICAgICB9IGVsc2UgdGhpcy5sZW5ndGggPSBbb3ZlcnJpZGVEaW1lbnNpb25zWzBdLCBvdmVycmlkZURpbWVuc2lvbnNbMV1dO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5tb2RlID09PSBcIlNBTVBMRVJcIikge1xuICAgICAgICAgICAgICAgIHRoaXMud3JpdGVXZWJHTFRleHR1cmVCdWZmZXIocHJlcGFyZUFycihhcnIpLCBmbGlwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFwiU0FNUExFUlwiIHx8IHRoaXMubW9kZSA9PT0gXCJBVFRSSUJVVEVcIikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRCdWZmZXIodGhpcy5fZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnZlcnRleERhdGEwKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5idWZmZXJEYXRhKHRoaXMuX2dsLkFSUkFZX0JVRkZFUiwgYXJyIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5ID8gYXJyIDogbmV3IEZsb2F0MzJBcnJheShhcnIpLCB0aGlzLl9nbC5TVEFUSUNfRFJBVyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5tb2RlID09PSBcIlZFUlRFWF9JTkRFWFwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEJ1ZmZlcih0aGlzLl9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgdGhpcy52ZXJ0ZXhEYXRhMCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuYnVmZmVyRGF0YSh0aGlzLl9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbmV3IFVpbnQxNkFycmF5KGFyciksIHRoaXMuX2dsLlNUQVRJQ19EUkFXKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jcmVhdGVGcmFtZWJ1ZmZlckFuZFJlbmRlcmJ1ZmZlcigpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwicmVtb3ZlXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSZW1vdmUgdGhpcyBidWZmZXJcclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlbW92ZSgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFwiU0FNUExFUlwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuZGVsZXRlVGV4dHVyZSh0aGlzLnRleHR1cmVEYXRhKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5kZWxldGVUZXh0dXJlKHRoaXMudGV4dHVyZURhdGFUZW1wKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gXCJTQU1QTEVSXCIgfHwgdGhpcy5tb2RlID09PSBcIkFUVFJJQlVURVwiIHx8IHRoaXMubW9kZSA9PT0gXCJWRVJURVhfSU5ERVhcIikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmRlbGV0ZUJ1ZmZlcih0aGlzLnZlcnRleERhdGEwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5fZ2wuZGVsZXRlRnJhbWVidWZmZXIodGhpcy5mQnVmZmVyKTtcbiAgICAgICAgICAgIHRoaXMuX2dsLmRlbGV0ZUZyYW1lYnVmZmVyKHRoaXMuZkJ1ZmZlclRlbXApO1xuXG4gICAgICAgICAgICB0aGlzLl9nbC5kZWxldGVSZW5kZXJidWZmZXIodGhpcy5yZW5kZXJCdWZmZXIpO1xuICAgICAgICAgICAgdGhpcy5fZ2wuZGVsZXRlUmVuZGVyYnVmZmVyKHRoaXMucmVuZGVyQnVmZmVyVGVtcCk7XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gV2ViQ0xHTEJ1ZmZlcjtcbn0oKTtcblxuZ2xvYmFsLldlYkNMR0xCdWZmZXIgPSBXZWJDTEdMQnVmZmVyO1xubW9kdWxlLmV4cG9ydHMuV2ViQ0xHTEJ1ZmZlciA9IFdlYkNMR0xCdWZmZXI7IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLldlYkNMR0xLZXJuZWwgPSB1bmRlZmluZWQ7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KCk7XG5cbnZhciBfV2ViQ0xHTFV0aWxzID0gcmVxdWlyZSgnLi9XZWJDTEdMVXRpbHMuY2xhc3MnKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuLyoqXHJcbiogV2ViQ0xHTEtlcm5lbCBPYmplY3RcclxuKiBAY2xhc3NcclxuICogQHBhcmFtIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGdsXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBzb3VyY2VcclxuICogQHBhcmFtIHtTdHJpbmd9IGhlYWRlclxyXG4qL1xudmFyIFdlYkNMR0xLZXJuZWwgPSBleHBvcnRzLldlYkNMR0xLZXJuZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gV2ViQ0xHTEtlcm5lbChnbCwgc291cmNlLCBoZWFkZXIpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFdlYkNMR0xLZXJuZWwpO1xuXG4gICAgICAgIHRoaXMuX2dsID0gZ2w7XG4gICAgICAgIHZhciBoaWdoUHJlY2lzaW9uU3VwcG9ydCA9IHRoaXMuX2dsLmdldFNoYWRlclByZWNpc2lvbkZvcm1hdCh0aGlzLl9nbC5GUkFHTUVOVF9TSEFERVIsIHRoaXMuX2dsLkhJR0hfRkxPQVQpO1xuICAgICAgICB0aGlzLl9wcmVjaXNpb24gPSBoaWdoUHJlY2lzaW9uU3VwcG9ydC5wcmVjaXNpb24gIT09IDAgPyAncHJlY2lzaW9uIGhpZ2hwIGZsb2F0O1xcblxcbnByZWNpc2lvbiBoaWdocCBpbnQ7XFxuXFxuJyA6ICdwcmVjaXNpb24gbG93cCBmbG9hdDtcXG5cXG5wcmVjaXNpb24gbG93cCBpbnQ7XFxuXFxuJztcblxuICAgICAgICB2YXIgX2dsRHJhd0J1ZmZfZXh0ID0gdGhpcy5fZ2wuZ2V0RXh0ZW5zaW9uKFwiV0VCR0xfZHJhd19idWZmZXJzXCIpO1xuICAgICAgICB0aGlzLl9tYXhEcmF3QnVmZmVycyA9IG51bGw7XG4gICAgICAgIGlmIChfZ2xEcmF3QnVmZl9leHQgIT0gbnVsbCkgdGhpcy5fbWF4RHJhd0J1ZmZlcnMgPSB0aGlzLl9nbC5nZXRQYXJhbWV0ZXIoX2dsRHJhd0J1ZmZfZXh0Lk1BWF9EUkFXX0JVRkZFUlNfV0VCR0wpO1xuXG4gICAgICAgIHRoaXMubmFtZSA9IFwiXCI7XG4gICAgICAgIHRoaXMuZW5hYmxlZCA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5kZXB0aFRlc3QgPSBudWxsO1xuICAgICAgICB0aGlzLmJsZW5kID0gbnVsbDtcbiAgICAgICAgdGhpcy5ibGVuZFNyY01vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLmJsZW5kRHN0TW9kZSA9IG51bGw7XG4gICAgICAgIHRoaXMuYmxlbmRFcXVhdGlvbiA9IG51bGw7XG4gICAgICAgIHRoaXMub25wcmUgPSBudWxsO1xuICAgICAgICB0aGlzLm9ucG9zdCA9IG51bGw7XG4gICAgICAgIHRoaXMudmlld1NvdXJjZSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuaW5fdmFsdWVzID0ge307XG5cbiAgICAgICAgdGhpcy5vdXRwdXQgPSBudWxsOyAvL1N0cmluZyBvciBBcnJheTxTdHJpbmc+IG9mIGFyZyBuYW1lcyB3aXRoIHRoZSBpdGVtcyBpbiBzYW1lIG9yZGVyIHRoYXQgaW4gdGhlIGZpbmFsIHJldHVyblxuICAgICAgICB0aGlzLm91dHB1dFRlbXBNb2RlcyA9IG51bGw7XG4gICAgICAgIHRoaXMuZkJ1ZmZlciA9IG51bGw7XG4gICAgICAgIHRoaXMuZkJ1ZmZlclRlbXAgPSBudWxsO1xuICAgICAgICB0aGlzLmZCdWZmZXJMZW5ndGggPSAwO1xuICAgICAgICB0aGlzLmZCdWZmZXJDb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHNvdXJjZSAhPT0gdW5kZWZpbmVkICYmIHNvdXJjZSAhPT0gbnVsbCkgdGhpcy5zZXRLZXJuZWxTb3VyY2Uoc291cmNlLCBoZWFkZXIpO1xuICAgIH1cblxuICAgIC8qKlxyXG4gICAgICogVXBkYXRlIHRoZSBrZXJuZWwgc291cmNlXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc291cmNlXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gW2hlYWRlcj11bmRlZmluZWRdIEFkZGl0aW9uYWwgZnVuY3Rpb25zXHJcbiAgICAgKi9cblxuXG4gICAgX2NyZWF0ZUNsYXNzKFdlYkNMR0xLZXJuZWwsIFt7XG4gICAgICAgIGtleTogJ3NldEtlcm5lbFNvdXJjZScsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRLZXJuZWxTb3VyY2Uoc291cmNlLCBoZWFkZXIpIHtcbiAgICAgICAgICAgIHZhciBjb21waWxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBzb3VyY2VWZXJ0ZXggPSBcIlwiICsgdGhpcy5fcHJlY2lzaW9uICsgJ2F0dHJpYnV0ZSB2ZWMzIGFWZXJ0ZXhQb3NpdGlvbjtcXG4nICsgJ3ZhcnlpbmcgdmVjMiBnbG9iYWxfaWQ7XFxuJyArICd2b2lkIG1haW4odm9pZCkge1xcbicgKyAnZ2xfUG9zaXRpb24gPSB2ZWM0KGFWZXJ0ZXhQb3NpdGlvbiwgMS4wKTtcXG4nICsgJ2dsb2JhbF9pZCA9IGFWZXJ0ZXhQb3NpdGlvbi54eSowLjUrMC41O1xcbicgKyAnfVxcbic7XG4gICAgICAgICAgICAgICAgdmFyIHNvdXJjZUZyYWdtZW50ID0gJyNleHRlbnNpb24gR0xfRVhUX2RyYXdfYnVmZmVycyA6IHJlcXVpcmVcXG4nICsgdGhpcy5fcHJlY2lzaW9uICsgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMubGluZXNfZnJhZ21lbnRfYXR0cnModGhpcy5pbl92YWx1ZXMpICsgJ3ZhcnlpbmcgdmVjMiBnbG9iYWxfaWQ7XFxuJyArICd1bmlmb3JtIGZsb2F0IHVCdWZmZXJXaWR0aDsnICsgJ3ZlYzIgZ2V0X2dsb2JhbF9pZCgpIHtcXG4nICsgJ3JldHVybiBnbG9iYWxfaWQ7XFxuJyArICd9XFxuJyArIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmdldF9nbG9iYWxfaWQzX0dMU0xGdW5jdGlvblN0cmluZygpICsgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuZ2V0X2dsb2JhbF9pZDJfR0xTTEZ1bmN0aW9uU3RyaW5nKCkgKyB0aGlzLl9oZWFkICtcblxuICAgICAgICAgICAgICAgIC8vV2ViQ0xHTFV0aWxzLmxpbmVzX2RyYXdCdWZmZXJzV3JpdGVJbml0KDgpK1xuICAgICAgICAgICAgICAgICd2b2lkIG1haW4odm9pZCkge1xcbicgKyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5saW5lc19kcmF3QnVmZmVyc0luaXQoOCkgKyB0aGlzLl9zb3VyY2UgKyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5saW5lc19kcmF3QnVmZmVyc1dyaXRlKDgpICsgJ31cXG4nO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5rZXJuZWwgPSB0aGlzLl9nbC5jcmVhdGVQcm9ncmFtKCk7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscygpLmNyZWF0ZVNoYWRlcih0aGlzLl9nbCwgXCJXRUJDTEdMXCIsIHNvdXJjZVZlcnRleCwgc291cmNlRnJhZ21lbnQsIHRoaXMua2VybmVsKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuYXR0cl9WZXJ0ZXhQb3MgPSB0aGlzLl9nbC5nZXRBdHRyaWJMb2NhdGlvbih0aGlzLmtlcm5lbCwgXCJhVmVydGV4UG9zaXRpb25cIik7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnVCdWZmZXJXaWR0aCA9IHRoaXMuX2dsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLmtlcm5lbCwgXCJ1QnVmZmVyV2lkdGhcIik7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5pbl92YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGV4cGVjdGVkTW9kZSA9IHsgJ2Zsb2F0NF9mcm9tU2FtcGxlcic6IFwiU0FNUExFUlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0X2Zyb21TYW1wbGVyJzogXCJTQU1QTEVSXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAnZmxvYXQnOiBcIlVOSUZPUk1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICdmbG9hdDQnOiBcIlVOSUZPUk1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICdtYXQ0JzogXCJVTklGT1JNXCIgfVt0aGlzLmluX3ZhbHVlc1trZXldLnR5cGVdO1xuXG4gICAgICAgICAgICAgICAgICAgIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uKHRoaXMuaW5fdmFsdWVzLCBrZXkpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmluX3ZhbHVlc1trZXldLmxvY2F0aW9uID0gW3RoaXMuX2dsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLmtlcm5lbCwga2V5LnJlcGxhY2UoL1xcW1xcZC4qLywgXCJcIikpXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbl92YWx1ZXNba2V5XS5leHBlY3RlZE1vZGUgPSBleHBlY3RlZE1vZGU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiVkVSVEVYIFBST0dSQU1cXG5cIiArIHNvdXJjZVZlcnRleCArIFwiXFxuIEZSQUdNRU5UIFBST0dSQU1cXG5cIiArIHNvdXJjZUZyYWdtZW50O1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgICAgICB2YXIgYXJndW1lbnRzU291cmNlID0gc291cmNlLnNwbGl0KCcpJylbMF0uc3BsaXQoJygnKVsxXS5zcGxpdCgnLCcpOyAvLyBcImZsb2F0KiBBXCIsIFwiZmxvYXQqIEJcIiwgXCJmbG9hdCBDXCIsIFwiZmxvYXQ0KiBEXCJcblxuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGYgPSBhcmd1bWVudHNTb3VyY2UubGVuZ3RoOyBuIDwgZjsgbisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvXFwqL2dtKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJnTmFtZSA9IGFyZ3VtZW50c1NvdXJjZVtuXS5zcGxpdCgnKicpWzFdLnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuY2hlY2tBcmdOYW1lSW5pdGlhbGl6YXRpb24odGhpcy5pbl92YWx1ZXMsIGFyZ05hbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0NC9nbSkgIT0gbnVsbCkgdGhpcy5pbl92YWx1ZXNbYXJnTmFtZV0udHlwZSA9ICdmbG9hdDRfZnJvbVNhbXBsZXInO2Vsc2UgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvZmxvYXQvZ20pICE9IG51bGwpIHRoaXMuaW5fdmFsdWVzW2FyZ05hbWVdLnR5cGUgPSAnZmxvYXRfZnJvbVNhbXBsZXInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzU291cmNlW25dICE9PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfYXJnTmFtZSA9IGFyZ3VtZW50c1NvdXJjZVtuXS5zcGxpdCgnICcpWzFdLnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuaW5fdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5LnJlcGxhY2UoL1xcW1xcZC4qLywgXCJcIikgPT09IF9hcmdOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2FyZ05hbWUgPSBrZXk7IC8vIGZvciBub3JtYWwgdW5pZm9ybSBhcnJheXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uKHRoaXMuaW5fdmFsdWVzLCBfYXJnTmFtZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvZmxvYXQ0L2dtKSAhPSBudWxsKSB0aGlzLmluX3ZhbHVlc1tfYXJnTmFtZV0udHlwZSA9ICdmbG9hdDQnO2Vsc2UgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvZmxvYXQvZ20pICE9IG51bGwpIHRoaXMuaW5fdmFsdWVzW19hcmdOYW1lXS50eXBlID0gJ2Zsb2F0JztlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL21hdDQvZ20pICE9IG51bGwpIHRoaXMuaW5fdmFsdWVzW19hcmdOYW1lXS50eXBlID0gJ21hdDQnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gcGFyc2UgaGVhZGVyXG4gICAgICAgICAgICB0aGlzLl9oZWFkID0gaGVhZGVyICE9PSB1bmRlZmluZWQgJiYgaGVhZGVyICE9PSBudWxsID8gaGVhZGVyIDogJyc7XG4gICAgICAgICAgICB0aGlzLl9oZWFkID0gdGhpcy5faGVhZC5yZXBsYWNlKC9cXHJcXG4vZ2ksICcnKS5yZXBsYWNlKC9cXHIvZ2ksICcnKS5yZXBsYWNlKC9cXG4vZ2ksICcnKTtcbiAgICAgICAgICAgIHRoaXMuX2hlYWQgPSBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5wYXJzZVNvdXJjZSh0aGlzLl9oZWFkLCB0aGlzLmluX3ZhbHVlcyk7XG5cbiAgICAgICAgICAgIC8vIHBhcnNlIHNvdXJjZVxuICAgICAgICAgICAgdGhpcy5fc291cmNlID0gc291cmNlLnJlcGxhY2UoL1xcclxcbi9naSwgJycpLnJlcGxhY2UoL1xcci9naSwgJycpLnJlcGxhY2UoL1xcbi9naSwgJycpO1xuICAgICAgICAgICAgdGhpcy5fc291cmNlID0gdGhpcy5fc291cmNlLnJlcGxhY2UoL15cXHcqIFxcdypcXChbXFx3XFxzXFwqLF0qXFwpIHsvZ2ksICcnKS5yZXBsYWNlKC99KFxcc3xcXHQpKiQvZ2ksICcnKTtcbiAgICAgICAgICAgIHRoaXMuX3NvdXJjZSA9IF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLnBhcnNlU291cmNlKHRoaXMuX3NvdXJjZSwgdGhpcy5pbl92YWx1ZXMpO1xuXG4gICAgICAgICAgICB2YXIgdHMgPSBjb21waWxlKCk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnZpZXdTb3VyY2UgPT09IHRydWUpIGNvbnNvbGUubG9nKCclYyBLRVJORUw6ICcgKyB0aGlzLm5hbWUsICdmb250LXNpemU6IDIwcHg7IGNvbG9yOiBibHVlJyksIGNvbnNvbGUubG9nKCclYyBXRUJDTEdMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJywgJ2NvbG9yOiBncmF5JyksIGNvbnNvbGUubG9nKCclYyAnICsgaGVhZGVyICsgc291cmNlLCAnY29sb3I6IGdyYXknKSwgY29uc29sZS5sb2coJyVjIFRSQU5TTEFURUQgV0VCR0wgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJywgJ2NvbG9yOiBkYXJrZ3JheScpLCBjb25zb2xlLmxvZygnJWMgJyArIHRzLCAnY29sb3I6IGRhcmtncmF5Jyk7XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gV2ViQ0xHTEtlcm5lbDtcbn0oKTtcblxuZ2xvYmFsLldlYkNMR0xLZXJuZWwgPSBXZWJDTEdMS2VybmVsO1xubW9kdWxlLmV4cG9ydHMuV2ViQ0xHTEtlcm5lbCA9IFdlYkNMR0xLZXJuZWw7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0oKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuLyoqIFxuKiBVdGlsaXRpZXNcbiogQGNsYXNzXG4qIEBjb25zdHJ1Y3RvclxuKi9cbnZhciBXZWJDTEdMVXRpbHMgPSBleHBvcnRzLldlYkNMR0xVdGlscyA9IGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBXZWJDTEdMVXRpbHMoKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBXZWJDTEdMVXRpbHMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGxvYWRRdWFkXG4gICAgICovXG5cblxuICAgIF9jcmVhdGVDbGFzcyhXZWJDTEdMVXRpbHMsIFt7XG4gICAgICAgIGtleTogXCJsb2FkUXVhZFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gbG9hZFF1YWQobm9kZSwgbGVuZ3RoLCBoZWlnaHQpIHtcbiAgICAgICAgICAgIHZhciBsID0gbGVuZ3RoID09PSB1bmRlZmluZWQgfHwgbGVuZ3RoID09PSBudWxsID8gMC41IDogbGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGggPSBoZWlnaHQgPT09IHVuZGVmaW5lZCB8fCBoZWlnaHQgPT09IG51bGwgPyAwLjUgOiBoZWlnaHQ7XG4gICAgICAgICAgICB0aGlzLnZlcnRleEFycmF5ID0gWy1sLCAtaCwgMC4wLCBsLCAtaCwgMC4wLCBsLCBoLCAwLjAsIC1sLCBoLCAwLjBdO1xuXG4gICAgICAgICAgICB0aGlzLnRleHR1cmVBcnJheSA9IFswLjAsIDAuMCwgMC4wLCAxLjAsIDAuMCwgMC4wLCAxLjAsIDEuMCwgMC4wLCAwLjAsIDEuMCwgMC4wXTtcblxuICAgICAgICAgICAgdGhpcy5pbmRleEFycmF5ID0gWzAsIDEsIDIsIDAsIDIsIDNdO1xuXG4gICAgICAgICAgICB2YXIgbWVzaE9iamVjdCA9IHt9O1xuICAgICAgICAgICAgbWVzaE9iamVjdC52ZXJ0ZXhBcnJheSA9IHRoaXMudmVydGV4QXJyYXk7XG4gICAgICAgICAgICBtZXNoT2JqZWN0LnRleHR1cmVBcnJheSA9IHRoaXMudGV4dHVyZUFycmF5O1xuICAgICAgICAgICAgbWVzaE9iamVjdC5pbmRleEFycmF5ID0gdGhpcy5pbmRleEFycmF5O1xuXG4gICAgICAgICAgICByZXR1cm4gbWVzaE9iamVjdDtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImNyZWF0ZVNoYWRlclwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGNyZWF0ZVNoYWRlclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNyZWF0ZVNoYWRlcihnbCwgbmFtZSwgc291cmNlVmVydGV4LCBzb3VyY2VGcmFnbWVudCwgc2hhZGVyUHJvZ3JhbSkge1xuICAgICAgICAgICAgdmFyIF9zdiA9IGZhbHNlLFxuICAgICAgICAgICAgICAgIF9zZiA9IGZhbHNlO1xuXG4gICAgICAgICAgICB2YXIgbWFrZURlYnVnID0gZnVuY3Rpb24gKGluZm9Mb2csIHNoYWRlcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGluZm9Mb2cpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGFyckVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIHZhciBlcnJvcnMgPSBpbmZvTG9nLnNwbGl0KFwiXFxuXCIpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmID0gZXJyb3JzLmxlbmd0aDsgbiA8IGY7IG4rKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3JzW25dLm1hdGNoKC9eRVJST1IvZ2ltKSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXhwbCA9IGVycm9yc1tuXS5zcGxpdCgnOicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxpbmUgPSBwYXJzZUludChleHBsWzJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyckVycm9ycy5wdXNoKFtsaW5lLCBlcnJvcnNbbl1dKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgc291ciA9IGdsLmdldFNoYWRlclNvdXJjZShzaGFkZXIpLnNwbGl0KFwiXFxuXCIpO1xuICAgICAgICAgICAgICAgIHNvdXIudW5zaGlmdChcIlwiKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfbiA9IDAsIF9mID0gc291ci5sZW5ndGg7IF9uIDwgX2Y7IF9uKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpbmVXaXRoRXJyb3IgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVycm9yU3RyID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGUgPSAwLCBmZSA9IGFyckVycm9ycy5sZW5ndGg7IGUgPCBmZTsgZSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoX24gPT09IGFyckVycm9yc1tlXVswXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVXaXRoRXJyb3IgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yU3RyID0gYXJyRXJyb3JzW2VdWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChsaW5lV2l0aEVycm9yID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCIlY1wiICsgX24gKyAnICVjJyArIHNvdXJbX25dLCBcImNvbG9yOmJsYWNrXCIsIFwiY29sb3I6Ymx1ZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCclY+KWuuKWuiVjJyArIF9uICsgJyAlYycgKyBzb3VyW19uXSArICdcXG4lYycgKyBlcnJvclN0ciwgXCJjb2xvcjpyZWRcIiwgXCJjb2xvcjpibGFja1wiLCBcImNvbG9yOmJsdWVcIiwgXCJjb2xvcjpyZWRcIik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgICAgIHZhciBzaGFkZXJWZXJ0ZXggPSBnbC5jcmVhdGVTaGFkZXIoZ2wuVkVSVEVYX1NIQURFUik7XG4gICAgICAgICAgICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyVmVydGV4LCBzb3VyY2VWZXJ0ZXgpO1xuICAgICAgICAgICAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXJWZXJ0ZXgpO1xuICAgICAgICAgICAgaWYgKCFnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyVmVydGV4LCBnbC5DT01QSUxFX1NUQVRVUykpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5mb0xvZyA9IGdsLmdldFNoYWRlckluZm9Mb2coc2hhZGVyVmVydGV4KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIiVjXCIgKyBuYW1lICsgJyBFUlJPUiAodmVydGV4IHByb2dyYW0pJywgXCJjb2xvcjpyZWRcIik7XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5mb0xvZyAhPT0gdW5kZWZpbmVkICYmIGluZm9Mb2cgIT09IG51bGwpIG1ha2VEZWJ1ZyhpbmZvTG9nLCBzaGFkZXJWZXJ0ZXgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBnbC5hdHRhY2hTaGFkZXIoc2hhZGVyUHJvZ3JhbSwgc2hhZGVyVmVydGV4KTtcbiAgICAgICAgICAgICAgICBfc3YgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgc2hhZGVyRnJhZ21lbnQgPSBnbC5jcmVhdGVTaGFkZXIoZ2wuRlJBR01FTlRfU0hBREVSKTtcbiAgICAgICAgICAgIGdsLnNoYWRlclNvdXJjZShzaGFkZXJGcmFnbWVudCwgc291cmNlRnJhZ21lbnQpO1xuICAgICAgICAgICAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXJGcmFnbWVudCk7XG4gICAgICAgICAgICBpZiAoIWdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXJGcmFnbWVudCwgZ2wuQ09NUElMRV9TVEFUVVMpKSB7XG4gICAgICAgICAgICAgICAgdmFyIF9pbmZvTG9nID0gZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXJGcmFnbWVudCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCIlY1wiICsgbmFtZSArICcgRVJST1IgKGZyYWdtZW50IHByb2dyYW0pJywgXCJjb2xvcjpyZWRcIik7XG5cbiAgICAgICAgICAgICAgICBpZiAoX2luZm9Mb2cgIT09IHVuZGVmaW5lZCAmJiBfaW5mb0xvZyAhPT0gbnVsbCkgbWFrZURlYnVnKF9pbmZvTG9nLCBzaGFkZXJGcmFnbWVudCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGdsLmF0dGFjaFNoYWRlcihzaGFkZXJQcm9ncmFtLCBzaGFkZXJGcmFnbWVudCk7XG4gICAgICAgICAgICAgICAgX3NmID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKF9zdiA9PT0gdHJ1ZSAmJiBfc2YgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBnbC5saW5rUHJvZ3JhbShzaGFkZXJQcm9ncmFtKTtcbiAgICAgICAgICAgICAgICB2YXIgc3VjY2VzcyA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIoc2hhZGVyUHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMpO1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBzaGFkZXIgcHJvZ3JhbSAnICsgbmFtZSArICc6XFxuICcpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbG9nID0gZ2wuZ2V0UHJvZ3JhbUluZm9Mb2coc2hhZGVyUHJvZ3JhbSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2cgIT09IHVuZGVmaW5lZCAmJiBsb2cgIT09IG51bGwpIGNvbnNvbGUubG9nKGxvZyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInBhY2tcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQYWNrIDFmbG9hdCAoMC4wLTEuMCkgdG8gNGZsb2F0IHJnYmEgKDAuMC0xLjAsIDAuMC0xLjAsIDAuMC0xLjAsIDAuMC0xLjApXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcGFjayh2KSB7XG4gICAgICAgICAgICB2YXIgYmlhcyA9IFsxLjAgLyAyNTUuMCwgMS4wIC8gMjU1LjAsIDEuMCAvIDI1NS4wLCAwLjBdO1xuXG4gICAgICAgICAgICB2YXIgciA9IHY7XG4gICAgICAgICAgICB2YXIgZyA9IHRoaXMuZnJhY3QociAqIDI1NS4wKTtcbiAgICAgICAgICAgIHZhciBiID0gdGhpcy5mcmFjdChnICogMjU1LjApO1xuICAgICAgICAgICAgdmFyIGEgPSB0aGlzLmZyYWN0KGIgKiAyNTUuMCk7XG4gICAgICAgICAgICB2YXIgY29sb3VyID0gW3IsIGcsIGIsIGFdO1xuXG4gICAgICAgICAgICB2YXIgZGQgPSBbY29sb3VyWzFdICogYmlhc1swXSwgY29sb3VyWzJdICogYmlhc1sxXSwgY29sb3VyWzNdICogYmlhc1syXSwgY29sb3VyWzNdICogYmlhc1szXV07XG5cbiAgICAgICAgICAgIHJldHVybiBbY29sb3VyWzBdIC0gZGRbMF0sIGNvbG91clsxXSAtIGRkWzFdLCBjb2xvdXJbMl0gLSBkZFsyXSwgY29sb3VyWzNdIC0gZGRbM11dO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwidW5wYWNrXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogVW5wYWNrIDRmbG9hdCByZ2JhICgwLjAtMS4wLCAwLjAtMS4wLCAwLjAtMS4wLCAwLjAtMS4wKSB0byAxZmxvYXQgKDAuMC0xLjApXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gdW5wYWNrKGNvbG91cikge1xuICAgICAgICAgICAgdmFyIGJpdFNoaWZ0cyA9IFsxLjAsIDEuMCAvIDI1NS4wLCAxLjAgLyAoMjU1LjAgKiAyNTUuMCksIDEuMCAvICgyNTUuMCAqIDI1NS4wICogMjU1LjApXTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRvdDQoY29sb3VyLCBiaXRTaGlmdHMpO1xuICAgICAgICB9XG4gICAgfV0sIFt7XG4gICAgICAgIGtleTogXCJnZXRXZWJHTENvbnRleHRGcm9tQ2FudmFzXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogZ2V0V2ViR0xDb250ZXh0RnJvbUNhbnZhc1xuICAgICAgICAgKiBAcGFyYW0ge0hUTUxDYW52YXNFbGVtZW50fSBjYW52YXNcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGN0eE9wdFxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldFdlYkdMQ29udGV4dEZyb21DYW52YXMoY2FudmFzLCBjdHhPcHQpIHtcbiAgICAgICAgICAgIHZhciBnbCA9IG51bGw7XG4gICAgICAgICAgICAvKnRyeSB7XG4gICAgICAgICAgICAgICAgaWYoY3R4T3B0ID09IHVuZGVmaW5lZCB8fCBjdHhPcHQgPT09IG51bGwpIGdsID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbDJcIik7XG4gICAgICAgICAgICAgICAgZWxzZSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2wyXCIsIGN0eE9wdCk7XG4gICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKChnbCA9PSBudWxsKT9cIm5vIHdlYmdsMlwiOlwidXNpbmcgd2ViZ2wyXCIpO1xuICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgICAgZ2wgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZ2wgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKGN0eE9wdCA9PSB1bmRlZmluZWQgfHwgY3R4T3B0ID09PSBudWxsKSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiZXhwZXJpbWVudGFsLXdlYmdsMlwiKTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiZXhwZXJpbWVudGFsLXdlYmdsMlwiLCBjdHhPcHQpO1xuICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coKGdsID09IG51bGwpP1wibm8gZXhwZXJpbWVudGFsLXdlYmdsMlwiOlwidXNpbmcgZXhwZXJpbWVudGFsLXdlYmdsMlwiKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZ2wgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0qL1xuICAgICAgICAgICAgaWYgKGdsID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3R4T3B0ID09PSB1bmRlZmluZWQgfHwgY3R4T3B0ID09PSBudWxsKSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIik7ZWxzZSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIiwgY3R4T3B0KTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhnbCA9PSBudWxsID8gXCJubyB3ZWJnbFwiIDogXCJ1c2luZyB3ZWJnbFwiKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGdsID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZ2wgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdHhPcHQgPT09IHVuZGVmaW5lZCB8fCBjdHhPcHQgPT09IG51bGwpIGdsID0gY2FudmFzLmdldENvbnRleHQoXCJleHBlcmltZW50YWwtd2ViZ2xcIik7ZWxzZSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiZXhwZXJpbWVudGFsLXdlYmdsXCIsIGN0eE9wdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZ2wgPT0gbnVsbCA/IFwibm8gZXhwZXJpbWVudGFsLXdlYmdsXCIgOiBcInVzaW5nIGV4cGVyaW1lbnRhbC13ZWJnbFwiKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGdsID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZ2wgPT0gbnVsbCkgZ2wgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBnbDtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImdldFVpbnQ4QXJyYXlGcm9tSFRNTEltYWdlRWxlbWVudFwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBVaW50OEFycmF5IGZyb20gSFRNTEltYWdlRWxlbWVudFxuICAgICAgICAgKiBAcGFyYW0ge0hUTUxJbWFnZUVsZW1lbnR9IGltYWdlRWxlbWVudFxuICAgICAgICAgKiBAcmV0dXJucyB7VWludDhDbGFtcGVkQXJyYXl9XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0VWludDhBcnJheUZyb21IVE1MSW1hZ2VFbGVtZW50KGltYWdlRWxlbWVudCkge1xuICAgICAgICAgICAgdmFyIGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgICAgIGUud2lkdGggPSBpbWFnZUVsZW1lbnQud2lkdGg7XG4gICAgICAgICAgICBlLmhlaWdodCA9IGltYWdlRWxlbWVudC5oZWlnaHQ7XG4gICAgICAgICAgICB2YXIgY3R4MkRfdGV4ID0gZS5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgICAgICAgICBjdHgyRF90ZXguZHJhd0ltYWdlKGltYWdlRWxlbWVudCwgMCwgMCk7XG4gICAgICAgICAgICB2YXIgYXJyYXlUZXggPSBjdHgyRF90ZXguZ2V0SW1hZ2VEYXRhKDAsIDAsIGltYWdlRWxlbWVudC53aWR0aCwgaW1hZ2VFbGVtZW50LmhlaWdodCk7XG5cbiAgICAgICAgICAgIHJldHVybiBhcnJheVRleC5kYXRhO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZG90NFwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERvdCBwcm9kdWN0IHZlY3RvcjRmbG9hdFxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGRvdDQodmVjdG9yNEEsIHZlY3RvcjRCKSB7XG4gICAgICAgICAgICByZXR1cm4gdmVjdG9yNEFbMF0gKiB2ZWN0b3I0QlswXSArIHZlY3RvcjRBWzFdICogdmVjdG9yNEJbMV0gKyB2ZWN0b3I0QVsyXSAqIHZlY3RvcjRCWzJdICsgdmVjdG9yNEFbM10gKiB2ZWN0b3I0QlszXTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImZyYWN0XCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogQ29tcHV0ZSB0aGUgZnJhY3Rpb25hbCBwYXJ0IG9mIHRoZSBhcmd1bWVudC4gZnJhY3QocGkpPTAuMTQxNTkyNjUuLi5cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBmcmFjdChudW1iZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBudW1iZXIgPiAwID8gbnVtYmVyIC0gTWF0aC5mbG9vcihudW1iZXIpIDogbnVtYmVyIC0gTWF0aC5jZWlsKG51bWJlcik7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJwYWNrR0xTTEZ1bmN0aW9uU3RyaW5nXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHBhY2sgR0xTTCBmdW5jdGlvbiBzdHJpbmdcbiAgICAgICAgICogQHJldHVybnMge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBwYWNrR0xTTEZ1bmN0aW9uU3RyaW5nKCkge1xuICAgICAgICAgICAgcmV0dXJuICd2ZWM0IHBhY2sgKGZsb2F0IGRlcHRoKSB7XFxuJyArICdjb25zdCB2ZWM0IGJpYXMgPSB2ZWM0KDEuMCAvIDI1NS4wLFxcbicgKyAnMS4wIC8gMjU1LjAsXFxuJyArICcxLjAgLyAyNTUuMCxcXG4nICsgJzAuMCk7XFxuJyArICdmbG9hdCByID0gZGVwdGg7XFxuJyArICdmbG9hdCBnID0gZnJhY3QociAqIDI1NS4wKTtcXG4nICsgJ2Zsb2F0IGIgPSBmcmFjdChnICogMjU1LjApO1xcbicgKyAnZmxvYXQgYSA9IGZyYWN0KGIgKiAyNTUuMCk7XFxuJyArICd2ZWM0IGNvbG91ciA9IHZlYzQociwgZywgYiwgYSk7XFxuJyArICdyZXR1cm4gY29sb3VyIC0gKGNvbG91ci55end3ICogYmlhcyk7XFxuJyArICd9XFxuJztcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInVucGFja0dMU0xGdW5jdGlvblN0cmluZ1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCB1bnBhY2sgR0xTTCBmdW5jdGlvbiBzdHJpbmdcbiAgICAgICAgICogQHJldHVybnMge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiB1bnBhY2tHTFNMRnVuY3Rpb25TdHJpbmcoKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2Zsb2F0IHVucGFjayAodmVjNCBjb2xvdXIpIHtcXG4nICsgJ2NvbnN0IHZlYzQgYml0U2hpZnRzID0gdmVjNCgxLjAsXFxuJyArICcxLjAgLyAyNTUuMCxcXG4nICsgJzEuMCAvICgyNTUuMCAqIDI1NS4wKSxcXG4nICsgJzEuMCAvICgyNTUuMCAqIDI1NS4wICogMjU1LjApKTtcXG4nICsgJ3JldHVybiBkb3QoY29sb3VyLCBiaXRTaGlmdHMpO1xcbicgKyAnfVxcbic7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJnZXRPdXRwdXRCdWZmZXJzXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogZ2V0T3V0cHV0QnVmZmVyc1xuICAgICAgICAgKiBAcGFyYW0ge1dlYkNMR0xLZXJuZWx8V2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbX0gcHJvZ1xuICAgICAgICAgKiBAcGFyYW0ge0FycmF5PFdlYkNMR0xCdWZmZXI+fSBidWZmZXJzXG4gICAgICAgICAqIEByZXR1cm5zIHtBcnJheTxXZWJDTEdMQnVmZmVyPn1cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRPdXRwdXRCdWZmZXJzKHByb2csIGJ1ZmZlcnMpIHtcbiAgICAgICAgICAgIHZhciBvdXRwdXRCdWZmID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChwcm9nLm91dHB1dCAhPT0gdW5kZWZpbmVkICYmIHByb2cub3V0cHV0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0QnVmZiA9IFtdO1xuICAgICAgICAgICAgICAgIGlmIChwcm9nLm91dHB1dFswXSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDwgcHJvZy5vdXRwdXQubGVuZ3RoOyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vaWYoYnVmZmVycy5oYXNPd25Qcm9wZXJ0eShwcm9nLm91dHB1dFtuXSkgPT0gZmFsc2UgJiYgX2FsZXJ0ZWQgPT0gZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICBfYWxlcnRlZCA9IHRydWUsIGFsZXJ0KFwib3V0cHV0IGFyZ3VtZW50IFwiK3Byb2cub3V0cHV0W25dK1wiIG5vdCBmb3VuZCBpbiBidWZmZXJzLiBhZGQgZGVzaXJlZCBhcmd1bWVudCBhcyBzaGFyZWRcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dEJ1ZmZbbl0gPSBidWZmZXJzW3Byb2cub3V0cHV0W25dXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBvdXRwdXRCdWZmID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvdXRwdXRCdWZmO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwicGFyc2VTb3VyY2VcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBwYXJzZVNvdXJjZVxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gc291cmNlXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZXNcbiAgICAgICAgICogQHJldHVybnMge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBwYXJzZVNvdXJjZShzb3VyY2UsIHZhbHVlcykge1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHZhbHVlcykge1xuICAgICAgICAgICAgICAgIHZhciByZWdleHAgPSBuZXcgUmVnRXhwKGtleSArIFwiXFxcXFsoPyFcXFxcZCkuKj9cXFxcXVwiLCBcImdtXCIpOyAvLyBhdm9pZCBub3JtYWwgdW5pZm9ybSBhcnJheXNcbiAgICAgICAgICAgICAgICB2YXIgdmFyTWF0Y2hlcyA9IHNvdXJjZS5tYXRjaChyZWdleHApOyAvLyBcIlNlYXJjaCBjdXJyZW50IFwiYXJnTmFtZVwiIGluIHNvdXJjZSBhbmQgc3RvcmUgaW4gYXJyYXkgdmFyTWF0Y2hlc1xuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2codmFyTWF0Y2hlcyk7XG4gICAgICAgICAgICAgICAgaWYgKHZhck1hdGNoZXMgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBuQiA9IDAsIGZCID0gdmFyTWF0Y2hlcy5sZW5ndGg7IG5CIDwgZkI7IG5CKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZvciBlYWNoIHZhck1hdGNoZXMgKFwiQVt4XVwiLCBcIkFbeF1cIilcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZWdleHBOYXRpdmVHTCA9IG5ldyBSZWdFeHAoJ2BgYChcXHN8XFx0KSpnbC4qJyArIHZhck1hdGNoZXNbbkJdICsgJy4qYGBgW15gYGAoXFxzfFxcdCkqZ2xdJywgXCJnbVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZWdleHBOYXRpdmVHTE1hdGNoZXMgPSBzb3VyY2UubWF0Y2gocmVnZXhwTmF0aXZlR0wpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlZ2V4cE5hdGl2ZUdMTWF0Y2hlcyA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWUgPSB2YXJNYXRjaGVzW25CXS5zcGxpdCgnWycpWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YXJpID0gdmFyTWF0Y2hlc1tuQl0uc3BsaXQoJ1snKVsxXS5zcGxpdCgnXScpWzBdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1hcCA9IHsgJ2Zsb2F0NF9mcm9tU2FtcGxlcic6IHNvdXJjZS5yZXBsYWNlKG5hbWUgKyBcIltcIiArIHZhcmkgKyBcIl1cIiwgJ3RleHR1cmUyRCgnICsgbmFtZSArICcsJyArIHZhcmkgKyAnKScpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZmxvYXRfZnJvbVNhbXBsZXInOiBzb3VyY2UucmVwbGFjZShuYW1lICsgXCJbXCIgKyB2YXJpICsgXCJdXCIsICd0ZXh0dXJlMkQoJyArIG5hbWUgKyAnLCcgKyB2YXJpICsgJykueCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZmxvYXQ0X2Zyb21BdHRyJzogc291cmNlLnJlcGxhY2UobmFtZSArIFwiW1wiICsgdmFyaSArIFwiXVwiLCBuYW1lKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0X2Zyb21BdHRyJzogc291cmNlLnJlcGxhY2UobmFtZSArIFwiW1wiICsgdmFyaSArIFwiXVwiLCBuYW1lKSB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZSA9IG1hcFt2YWx1ZXNba2V5XS50eXBlXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNvdXJjZSA9IHNvdXJjZS5yZXBsYWNlKC9gYGAoXFxzfFxcdCkqZ2wvZ2ksIFwiXCIpLnJlcGxhY2UoL2BgYC9naSwgXCJcIikucmVwbGFjZSgvOy9naSwgXCI7XFxuXCIpLnJlcGxhY2UoL30vZ2ksIFwifVxcblwiKS5yZXBsYWNlKC97L2dpLCBcIntcXG5cIik7XG4gICAgICAgICAgICByZXR1cm4gc291cmNlO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwibGluZXNfdmVydGV4X2F0dHJzXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogbGluZXNfdmVydGV4X2F0dHJzXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZXNcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBsaW5lc192ZXJ0ZXhfYXR0cnModmFsdWVzKSB7XG4gICAgICAgICAgICB2YXIgc3RyID0gJyc7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9IHsgJ2Zsb2F0NF9mcm9tU2FtcGxlcic6ICd1bmlmb3JtIHNhbXBsZXIyRCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXRfZnJvbVNhbXBsZXInOiAndW5pZm9ybSBzYW1wbGVyMkQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0NF9mcm9tQXR0cic6ICdhdHRyaWJ1dGUgdmVjNCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXRfZnJvbUF0dHInOiAnYXR0cmlidXRlIGZsb2F0ICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdCc6ICd1bmlmb3JtIGZsb2F0ICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdDQnOiAndW5pZm9ybSB2ZWM0ICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdtYXQ0JzogJ3VuaWZvcm0gbWF0NCAnICsga2V5ICsgJzsnIH1bdmFsdWVzW2tleV0udHlwZV0gKyAnXFxuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJsaW5lc19mcmFnbWVudF9hdHRyc1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGxpbmVzX2ZyYWdtZW50X2F0dHJzXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZXNcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBsaW5lc19mcmFnbWVudF9hdHRycyh2YWx1ZXMpIHtcbiAgICAgICAgICAgIHZhciBzdHIgPSAnJztcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB2YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0geyAnZmxvYXQ0X2Zyb21TYW1wbGVyJzogJ3VuaWZvcm0gc2FtcGxlcjJEICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdF9mcm9tU2FtcGxlcic6ICd1bmlmb3JtIHNhbXBsZXIyRCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXQnOiAndW5pZm9ybSBmbG9hdCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXQ0JzogJ3VuaWZvcm0gdmVjNCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnbWF0NCc6ICd1bmlmb3JtIG1hdDQgJyArIGtleSArICc7JyB9W3ZhbHVlc1trZXldLnR5cGVdICsgJ1xcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwibGluZXNfZHJhd0J1ZmZlcnNJbml0XCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogbGluZXNfZHJhd0J1ZmZlcnNJbml0XG4gICAgICAgICAqIEBwYXJhbSB7aW50fSBtYXhEcmF3QnVmZmVyc1xuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGxpbmVzX2RyYXdCdWZmZXJzSW5pdChtYXhEcmF3QnVmZmVycykge1xuICAgICAgICAgICAgdmFyIHN0ciA9ICcnO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGZuID0gbWF4RHJhd0J1ZmZlcnM7IG4gPCBmbjsgbisrKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9ICcnICsgJ2Zsb2F0IG91dCcgKyBuICsgJ19mbG9hdCA9IC05OTkuOTk5ODk7XFxuJyArICd2ZWM0IG91dCcgKyBuICsgJ19mbG9hdDQ7XFxuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJsaW5lc19kcmF3QnVmZmVyc1dyaXRlSW5pdFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gbGluZXNfZHJhd0J1ZmZlcnNXcml0ZUluaXQobWF4RHJhd0J1ZmZlcnMpIHtcbiAgICAgICAgICAgIHZhciBzdHIgPSAnJztcbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmbiA9IG1heERyYXdCdWZmZXJzOyBuIDwgZm47IG4rKykge1xuICAgICAgICAgICAgICAgIHN0ciArPSAnJyArICdsYXlvdXQobG9jYXRpb24gPSAnICsgbiArICcpIG91dCB2ZWM0IG91dENvbCcgKyBuICsgJztcXG4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImxpbmVzX2RyYXdCdWZmZXJzV3JpdGVcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBsaW5lc19kcmF3QnVmZmVyc1dyaXRlXG4gICAgICAgICAqIEBwYXJhbSB7aW50fSBtYXhEcmF3QnVmZmVyc1xuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGxpbmVzX2RyYXdCdWZmZXJzV3JpdGUobWF4RHJhd0J1ZmZlcnMpIHtcbiAgICAgICAgICAgIHZhciBzdHIgPSAnJztcbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmbiA9IG1heERyYXdCdWZmZXJzOyBuIDwgZm47IG4rKykge1xuICAgICAgICAgICAgICAgIHN0ciArPSAnJyArICdpZihvdXQnICsgbiArICdfZmxvYXQgIT0gLTk5OS45OTk4OSkgZ2xfRnJhZ0RhdGFbJyArIG4gKyAnXSA9IHZlYzQob3V0JyArIG4gKyAnX2Zsb2F0LDAuMCwwLjAsMS4wKTtcXG4nICsgJyBlbHNlIGdsX0ZyYWdEYXRhWycgKyBuICsgJ10gPSBvdXQnICsgbiArICdfZmxvYXQ0O1xcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY2hlY2tBcmdOYW1lSW5pdGlhbGl6YXRpb25cIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBjaGVja0FyZ05hbWVJbml0aWFsaXphdGlvblxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5WYWx1ZXNcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGFyZ05hbWVcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjaGVja0FyZ05hbWVJbml0aWFsaXphdGlvbihpblZhbHVlcywgYXJnTmFtZSkge1xuICAgICAgICAgICAgaWYgKGluVmFsdWVzLmhhc093blByb3BlcnR5KGFyZ05hbWUpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGluVmFsdWVzW2FyZ05hbWVdID0ge1xuICAgICAgICAgICAgICAgICAgICBcInR5cGVcIjogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgXCJleHBlY3RlZE1vZGVcIjogbnVsbCwgLy8gXCJBVFRSSUJVVEVcIiwgXCJTQU1QTEVSXCIsIFwiVU5JRk9STVwiXG4gICAgICAgICAgICAgICAgICAgIFwibG9jYXRpb25cIjogbnVsbCB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZ2V0X2dsb2JhbF9pZDNfR0xTTEZ1bmN0aW9uU3RyaW5nXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogZ2V0X2dsb2JhbF9pZDNfR0xTTEZ1bmN0aW9uU3RyaW5nXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0X2dsb2JhbF9pZDNfR0xTTEZ1bmN0aW9uU3RyaW5nKCkge1xuICAgICAgICAgICAgcmV0dXJuICcnICsgJ3ZlYzIgZ2V0X2dsb2JhbF9pZChmbG9hdCBpZCwgZmxvYXQgYnVmZmVyV2lkdGgsIGZsb2F0IGdlb21ldHJ5TGVuZ3RoKSB7XFxuJyArICdmbG9hdCB0ZXhlbFNpemUgPSAxLjAvYnVmZmVyV2lkdGg7JyArICdmbG9hdCBudW0gPSAoaWQqZ2VvbWV0cnlMZW5ndGgpL2J1ZmZlcldpZHRoOycgKyAnZmxvYXQgY29sdW1uID0gZnJhY3QobnVtKSsodGV4ZWxTaXplLzIuMCk7JyArICdmbG9hdCByb3cgPSAoZmxvb3IobnVtKS9idWZmZXJXaWR0aCkrKHRleGVsU2l6ZS8yLjApOycgKyAncmV0dXJuIHZlYzIoY29sdW1uLCByb3cpOycgKyAnfVxcbic7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJnZXRfZ2xvYmFsX2lkMl9HTFNMRnVuY3Rpb25TdHJpbmdcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBnZXRfZ2xvYmFsX2lkMl9HTFNMRnVuY3Rpb25TdHJpbmdcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRfZ2xvYmFsX2lkMl9HTFNMRnVuY3Rpb25TdHJpbmcoKSB7XG4gICAgICAgICAgICByZXR1cm4gJycgKyAndmVjMiBnZXRfZ2xvYmFsX2lkKHZlYzIgaWQsIGZsb2F0IGJ1ZmZlcldpZHRoKSB7XFxuJyArICdmbG9hdCB0ZXhlbFNpemUgPSAxLjAvYnVmZmVyV2lkdGg7JyArICdmbG9hdCBjb2x1bW4gPSAoaWQueC9idWZmZXJXaWR0aCkrKHRleGVsU2l6ZS8yLjApOycgKyAnZmxvYXQgcm93ID0gKGlkLnkvYnVmZmVyV2lkdGgpKyh0ZXhlbFNpemUvMi4wKTsnICsgJ3JldHVybiB2ZWMyKGNvbHVtbiwgcm93KTsnICsgJ31cXG4nO1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIFdlYkNMR0xVdGlscztcbn0oKTtcblxuZ2xvYmFsLldlYkNMR0xVdGlscyA9IFdlYkNMR0xVdGlscztcbm1vZHVsZS5leHBvcnRzLldlYkNMR0xVdGlscyA9IFdlYkNMR0xVdGlsczsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbSA9IHVuZGVmaW5lZDtcblxudmFyIF9jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0oKTtcblxudmFyIF9XZWJDTEdMVXRpbHMgPSByZXF1aXJlKCcuL1dlYkNMR0xVdGlscy5jbGFzcycpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG4vKipcclxuKiBXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtIE9iamVjdFxyXG4qIEBjbGFzc1xyXG4gKiBAcGFyYW0ge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gZ2xcclxuICogQHBhcmFtIHtTdHJpbmd9IHZlcnRleFNvdXJjZVxyXG4gKiBAcGFyYW0ge1N0cmluZ30gdmVydGV4SGVhZGVyXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBmcmFnbWVudFNvdXJjZVxyXG4gKiBAcGFyYW0ge1N0cmluZ30gZnJhZ21lbnRIZWFkZXJcclxuKi9cbnZhciBXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtID0gZXhwb3J0cy5XZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtID0gZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0oZ2wsIHZlcnRleFNvdXJjZSwgdmVydGV4SGVhZGVyLCBmcmFnbWVudFNvdXJjZSwgZnJhZ21lbnRIZWFkZXIpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0pO1xuXG4gICAgICAgIHRoaXMuX2dsID0gZ2w7XG4gICAgICAgIHZhciBoaWdoUHJlY2lzaW9uU3VwcG9ydCA9IHRoaXMuX2dsLmdldFNoYWRlclByZWNpc2lvbkZvcm1hdCh0aGlzLl9nbC5GUkFHTUVOVF9TSEFERVIsIHRoaXMuX2dsLkhJR0hfRkxPQVQpO1xuICAgICAgICB0aGlzLl9wcmVjaXNpb24gPSBoaWdoUHJlY2lzaW9uU3VwcG9ydC5wcmVjaXNpb24gIT09IDAgPyAncHJlY2lzaW9uIGhpZ2hwIGZsb2F0O1xcblxcbnByZWNpc2lvbiBoaWdocCBpbnQ7XFxuXFxuJyA6ICdwcmVjaXNpb24gbG93cCBmbG9hdDtcXG5cXG5wcmVjaXNpb24gbG93cCBpbnQ7XFxuXFxuJztcblxuICAgICAgICB2YXIgX2dsRHJhd0J1ZmZfZXh0ID0gdGhpcy5fZ2wuZ2V0RXh0ZW5zaW9uKFwiV0VCR0xfZHJhd19idWZmZXJzXCIpO1xuICAgICAgICB0aGlzLl9tYXhEcmF3QnVmZmVycyA9IG51bGw7XG4gICAgICAgIGlmIChfZ2xEcmF3QnVmZl9leHQgIT0gbnVsbCkgdGhpcy5fbWF4RHJhd0J1ZmZlcnMgPSB0aGlzLl9nbC5nZXRQYXJhbWV0ZXIoX2dsRHJhd0J1ZmZfZXh0Lk1BWF9EUkFXX0JVRkZFUlNfV0VCR0wpO1xuXG4gICAgICAgIHRoaXMubmFtZSA9IFwiXCI7XG4gICAgICAgIHRoaXMudmlld1NvdXJjZSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuaW5fdmVydGV4X3ZhbHVlcyA9IHt9O1xuICAgICAgICB0aGlzLmluX2ZyYWdtZW50X3ZhbHVlcyA9IHt9O1xuXG4gICAgICAgIHRoaXMuX3ZlcnRleFBfcmVhZHkgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fZnJhZ21lbnRQX3JlYWR5ID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5fdmVydGV4SGVhZCA9IG51bGw7XG4gICAgICAgIHRoaXMuX3ZlcnRleFNvdXJjZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX2ZyYWdtZW50SGVhZCA9IG51bGw7XG4gICAgICAgIHRoaXMuX2ZyYWdtZW50U291cmNlID0gbnVsbDtcblxuICAgICAgICB0aGlzLm91dHB1dCA9IG51bGw7IC8vU3RyaW5nIG9yIEFycmF5PFN0cmluZz4gb2YgYXJnIG5hbWVzIHdpdGggdGhlIGl0ZW1zIGluIHNhbWUgb3JkZXIgdGhhdCBpbiB0aGUgZmluYWwgcmV0dXJuXG4gICAgICAgIHRoaXMub3V0cHV0VGVtcE1vZGVzID0gbnVsbDtcbiAgICAgICAgdGhpcy5mQnVmZmVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5mQnVmZmVyVGVtcCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5kcmF3TW9kZSA9IDQ7XG5cbiAgICAgICAgaWYgKHZlcnRleFNvdXJjZSAhPT0gdW5kZWZpbmVkICYmIHZlcnRleFNvdXJjZSAhPT0gbnVsbCkgdGhpcy5zZXRWZXJ0ZXhTb3VyY2UodmVydGV4U291cmNlLCB2ZXJ0ZXhIZWFkZXIpO1xuXG4gICAgICAgIGlmIChmcmFnbWVudFNvdXJjZSAhPT0gdW5kZWZpbmVkICYmIGZyYWdtZW50U291cmNlICE9PSBudWxsKSB0aGlzLnNldEZyYWdtZW50U291cmNlKGZyYWdtZW50U291cmNlLCBmcmFnbWVudEhlYWRlcik7XG4gICAgfVxuXG4gICAgLyoqXHJcbiAgICAgKiBjb21waWxlVmVydGV4RnJhZ21lbnRTb3VyY2VcclxuICAgICAqL1xuXG5cbiAgICBfY3JlYXRlQ2xhc3MoV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbSwgW3tcbiAgICAgICAga2V5OiAnY29tcGlsZVZlcnRleEZyYWdtZW50U291cmNlJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNvbXBpbGVWZXJ0ZXhGcmFnbWVudFNvdXJjZSgpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2VWZXJ0ZXggPSBcIlwiICsgdGhpcy5fcHJlY2lzaW9uICsgJ3VuaWZvcm0gZmxvYXQgdU9mZnNldDtcXG4nICsgJ3VuaWZvcm0gZmxvYXQgdUJ1ZmZlcldpZHRoOycgKyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5saW5lc192ZXJ0ZXhfYXR0cnModGhpcy5pbl92ZXJ0ZXhfdmFsdWVzKSArIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLnVucGFja0dMU0xGdW5jdGlvblN0cmluZygpICsgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuZ2V0X2dsb2JhbF9pZDNfR0xTTEZ1bmN0aW9uU3RyaW5nKCkgKyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5nZXRfZ2xvYmFsX2lkMl9HTFNMRnVuY3Rpb25TdHJpbmcoKSArIHRoaXMuX3ZlcnRleEhlYWQgKyAndm9pZCBtYWluKHZvaWQpIHtcXG4nICsgdGhpcy5fdmVydGV4U291cmNlICsgJ31cXG4nO1xuICAgICAgICAgICAgdmFyIHNvdXJjZUZyYWdtZW50ID0gJyNleHRlbnNpb24gR0xfRVhUX2RyYXdfYnVmZmVycyA6IHJlcXVpcmVcXG4nICsgdGhpcy5fcHJlY2lzaW9uICsgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMubGluZXNfZnJhZ21lbnRfYXR0cnModGhpcy5pbl9mcmFnbWVudF92YWx1ZXMpICsgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuZ2V0X2dsb2JhbF9pZDNfR0xTTEZ1bmN0aW9uU3RyaW5nKCkgKyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5nZXRfZ2xvYmFsX2lkMl9HTFNMRnVuY3Rpb25TdHJpbmcoKSArIHRoaXMuX2ZyYWdtZW50SGVhZCArXG5cbiAgICAgICAgICAgIC8vV2ViQ0xHTFV0aWxzLmxpbmVzX2RyYXdCdWZmZXJzV3JpdGVJbml0KDgpK1xuICAgICAgICAgICAgJ3ZvaWQgbWFpbih2b2lkKSB7XFxuJyArIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmxpbmVzX2RyYXdCdWZmZXJzSW5pdCg4KSArIHRoaXMuX2ZyYWdtZW50U291cmNlICsgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMubGluZXNfZHJhd0J1ZmZlcnNXcml0ZSg4KSArICd9XFxuJztcblxuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhGcmFnbWVudFByb2dyYW0gPSB0aGlzLl9nbC5jcmVhdGVQcm9ncmFtKCk7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gbmV3IF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzKCkuY3JlYXRlU2hhZGVyKHRoaXMuX2dsLCBcIldFQkNMR0wgVkVSVEVYIEZSQUdNRU5UIFBST0dSQU1cIiwgc291cmNlVmVydGV4LCBzb3VyY2VGcmFnbWVudCwgdGhpcy52ZXJ0ZXhGcmFnbWVudFByb2dyYW0pO1xuXG4gICAgICAgICAgICB0aGlzLnVPZmZzZXQgPSB0aGlzLl9nbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy52ZXJ0ZXhGcmFnbWVudFByb2dyYW0sIFwidU9mZnNldFwiKTtcbiAgICAgICAgICAgIHRoaXMudUJ1ZmZlcldpZHRoID0gdGhpcy5fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMudmVydGV4RnJhZ21lbnRQcm9ncmFtLCBcInVCdWZmZXJXaWR0aFwiKTtcblxuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuaW5fdmVydGV4X3ZhbHVlcykge1xuICAgICAgICAgICAgICAgIHZhciBleHBlY3RlZE1vZGUgPSB7ICdmbG9hdDRfZnJvbVNhbXBsZXInOiBcIlNBTVBMRVJcIixcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0X2Zyb21TYW1wbGVyJzogXCJTQU1QTEVSXCIsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdDRfZnJvbUF0dHInOiBcIkFUVFJJQlVURVwiLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXRfZnJvbUF0dHInOiBcIkFUVFJJQlVURVwiLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXQnOiBcIlVOSUZPUk1cIixcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0NCc6IFwiVU5JRk9STVwiLFxuICAgICAgICAgICAgICAgICAgICAnbWF0NCc6IFwiVU5JRk9STVwiIH1bdGhpcy5pbl92ZXJ0ZXhfdmFsdWVzW2tleV0udHlwZV07XG5cbiAgICAgICAgICAgICAgICBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5jaGVja0FyZ05hbWVJbml0aWFsaXphdGlvbih0aGlzLmluX3ZlcnRleF92YWx1ZXMsIGtleSk7XG4gICAgICAgICAgICAgICAgdmFyIGxvYyA9IGV4cGVjdGVkTW9kZSA9PT0gXCJBVFRSSUJVVEVcIiA/IHRoaXMuX2dsLmdldEF0dHJpYkxvY2F0aW9uKHRoaXMudmVydGV4RnJhZ21lbnRQcm9ncmFtLCBrZXkpIDogdGhpcy5fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMudmVydGV4RnJhZ21lbnRQcm9ncmFtLCBrZXkucmVwbGFjZSgvXFxbXFxkLiovLCBcIlwiKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbl92ZXJ0ZXhfdmFsdWVzW2tleV0ubG9jYXRpb24gPSBbbG9jXTtcbiAgICAgICAgICAgICAgICB0aGlzLmluX3ZlcnRleF92YWx1ZXNba2V5XS5leHBlY3RlZE1vZGUgPSBleHBlY3RlZE1vZGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAodmFyIF9rZXkgaW4gdGhpcy5pbl9mcmFnbWVudF92YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgX2V4cGVjdGVkTW9kZSA9IHsgJ2Zsb2F0NF9mcm9tU2FtcGxlcic6IFwiU0FNUExFUlwiLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXRfZnJvbVNhbXBsZXInOiBcIlNBTVBMRVJcIixcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0JzogXCJVTklGT1JNXCIsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdDQnOiBcIlVOSUZPUk1cIixcbiAgICAgICAgICAgICAgICAgICAgJ21hdDQnOiBcIlVOSUZPUk1cIiB9W3RoaXMuaW5fZnJhZ21lbnRfdmFsdWVzW19rZXldLnR5cGVdO1xuXG4gICAgICAgICAgICAgICAgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuY2hlY2tBcmdOYW1lSW5pdGlhbGl6YXRpb24odGhpcy5pbl9mcmFnbWVudF92YWx1ZXMsIF9rZXkpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzW19rZXldLmxvY2F0aW9uID0gW3RoaXMuX2dsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnZlcnRleEZyYWdtZW50UHJvZ3JhbSwgX2tleS5yZXBsYWNlKC9cXFtcXGQuKi8sIFwiXCIpKV07XG4gICAgICAgICAgICAgICAgdGhpcy5pbl9mcmFnbWVudF92YWx1ZXNbX2tleV0uZXhwZWN0ZWRNb2RlID0gX2V4cGVjdGVkTW9kZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIFwiVkVSVEVYIFBST0dSQU1cXG5cIiArIHNvdXJjZVZlcnRleCArIFwiXFxuIEZSQUdNRU5UIFBST0dSQU1cXG5cIiArIHNvdXJjZUZyYWdtZW50O1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdzZXRWZXJ0ZXhTb3VyY2UnLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVXBkYXRlIHRoZSB2ZXJ0ZXggc291cmNlXHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IHZlcnRleFNvdXJjZVxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSB2ZXJ0ZXhIZWFkZXJcclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHNldFZlcnRleFNvdXJjZSh2ZXJ0ZXhTb3VyY2UsIHZlcnRleEhlYWRlcikge1xuICAgICAgICAgICAgdmFyIGFyZ3VtZW50c1NvdXJjZSA9IHZlcnRleFNvdXJjZS5zcGxpdCgnKScpWzBdLnNwbGl0KCcoJylbMV0uc3BsaXQoJywnKTsgLy8gXCJmbG9hdCogQVwiLCBcImZsb2F0KiBCXCIsIFwiZmxvYXQgQ1wiLCBcImZsb2F0NCogRFwiXG5cbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmID0gYXJndW1lbnRzU291cmNlLmxlbmd0aDsgbiA8IGY7IG4rKykge1xuICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL1xcKmF0dHIvZ20pICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcmdOYW1lID0gYXJndW1lbnRzU291cmNlW25dLnNwbGl0KCcqYXR0cicpWzFdLnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuY2hlY2tBcmdOYW1lSW5pdGlhbGl6YXRpb24odGhpcy5pbl92ZXJ0ZXhfdmFsdWVzLCBhcmdOYW1lKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9mbG9hdDQvZ20pICE9IG51bGwpIHRoaXMuaW5fdmVydGV4X3ZhbHVlc1thcmdOYW1lXS50eXBlID0gJ2Zsb2F0NF9mcm9tQXR0cic7ZWxzZSBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9mbG9hdC9nbSkgIT0gbnVsbCkgdGhpcy5pbl92ZXJ0ZXhfdmFsdWVzW2FyZ05hbWVdLnR5cGUgPSAnZmxvYXRfZnJvbUF0dHInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9cXCovZ20pICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfYXJnTmFtZSA9IGFyZ3VtZW50c1NvdXJjZVtuXS5zcGxpdCgnKicpWzFdLnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuY2hlY2tBcmdOYW1lSW5pdGlhbGl6YXRpb24odGhpcy5pbl92ZXJ0ZXhfdmFsdWVzLCBfYXJnTmFtZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvZmxvYXQ0L2dtKSAhPSBudWxsKSB0aGlzLmluX3ZlcnRleF92YWx1ZXNbX2FyZ05hbWVdLnR5cGUgPSAnZmxvYXQ0X2Zyb21TYW1wbGVyJztlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0L2dtKSAhPSBudWxsKSB0aGlzLmluX3ZlcnRleF92YWx1ZXNbX2FyZ05hbWVdLnR5cGUgPSAnZmxvYXRfZnJvbVNhbXBsZXInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzU291cmNlW25dICE9PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfYXJnTmFtZTIgPSBhcmd1bWVudHNTb3VyY2Vbbl0uc3BsaXQoJyAnKVsxXS50cmltKCk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLmluX3ZlcnRleF92YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXkucmVwbGFjZSgvXFxbXFxkLiovLCBcIlwiKSA9PT0gX2FyZ05hbWUyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2FyZ05hbWUyID0ga2V5OyAvLyBmb3Igbm9ybWFsIHVuaWZvcm0gYXJyYXlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5jaGVja0FyZ05hbWVJbml0aWFsaXphdGlvbih0aGlzLmluX3ZlcnRleF92YWx1ZXMsIF9hcmdOYW1lMik7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvZmxvYXQ0L2dtKSAhPSBudWxsKSB0aGlzLmluX3ZlcnRleF92YWx1ZXNbX2FyZ05hbWUyXS50eXBlID0gJ2Zsb2F0NCc7ZWxzZSBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9mbG9hdC9nbSkgIT0gbnVsbCkgdGhpcy5pbl92ZXJ0ZXhfdmFsdWVzW19hcmdOYW1lMl0udHlwZSA9ICdmbG9hdCc7ZWxzZSBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9tYXQ0L2dtKSAhPSBudWxsKSB0aGlzLmluX3ZlcnRleF92YWx1ZXNbX2FyZ05hbWUyXS50eXBlID0gJ21hdDQnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gcGFyc2UgaGVhZGVyXG4gICAgICAgICAgICB0aGlzLl92ZXJ0ZXhIZWFkID0gdmVydGV4SGVhZGVyICE9PSB1bmRlZmluZWQgJiYgdmVydGV4SGVhZGVyICE9PSBudWxsID8gdmVydGV4SGVhZGVyIDogJyc7XG4gICAgICAgICAgICB0aGlzLl92ZXJ0ZXhIZWFkID0gdGhpcy5fdmVydGV4SGVhZC5yZXBsYWNlKC9cXHJcXG4vZ2ksICcnKS5yZXBsYWNlKC9cXHIvZ2ksICcnKS5yZXBsYWNlKC9cXG4vZ2ksICcnKTtcbiAgICAgICAgICAgIHRoaXMuX3ZlcnRleEhlYWQgPSBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5wYXJzZVNvdXJjZSh0aGlzLl92ZXJ0ZXhIZWFkLCB0aGlzLmluX3ZlcnRleF92YWx1ZXMpO1xuXG4gICAgICAgICAgICAvLyBwYXJzZSBzb3VyY2VcbiAgICAgICAgICAgIHRoaXMuX3ZlcnRleFNvdXJjZSA9IHZlcnRleFNvdXJjZS5yZXBsYWNlKC9cXHJcXG4vZ2ksICcnKS5yZXBsYWNlKC9cXHIvZ2ksICcnKS5yZXBsYWNlKC9cXG4vZ2ksICcnKTtcbiAgICAgICAgICAgIHRoaXMuX3ZlcnRleFNvdXJjZSA9IHRoaXMuX3ZlcnRleFNvdXJjZS5yZXBsYWNlKC9eXFx3KiBcXHcqXFwoW1xcd1xcc1xcKixdKlxcKSB7L2dpLCAnJykucmVwbGFjZSgvfShcXHN8XFx0KSokL2dpLCAnJyk7XG4gICAgICAgICAgICB0aGlzLl92ZXJ0ZXhTb3VyY2UgPSBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5wYXJzZVNvdXJjZSh0aGlzLl92ZXJ0ZXhTb3VyY2UsIHRoaXMuaW5fdmVydGV4X3ZhbHVlcyk7XG5cbiAgICAgICAgICAgIHRoaXMuX3ZlcnRleFBfcmVhZHkgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2ZyYWdtZW50UF9yZWFkeSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHZhciB0cyA9IHRoaXMuY29tcGlsZVZlcnRleEZyYWdtZW50U291cmNlKCk7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy52aWV3U291cmNlID09PSB0cnVlKSBjb25zb2xlLmxvZygnJWMgVkZQOiAnICsgdGhpcy5uYW1lLCAnZm9udC1zaXplOiAyMHB4OyBjb2xvcjogZ3JlZW4nKSwgY29uc29sZS5sb2coJyVjIFdFQkNMR0wgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nLCAnY29sb3I6IGdyYXknKSwgY29uc29sZS5sb2coJyVjICcgKyB2ZXJ0ZXhIZWFkZXIgKyB2ZXJ0ZXhTb3VyY2UsICdjb2xvcjogZ3JheScpLCBjb25zb2xlLmxvZygnJWMgVFJBTlNMQVRFRCBXRUJHTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nLCAnY29sb3I6IGRhcmtncmF5JyksIGNvbnNvbGUubG9nKCclYyAnICsgdHMsICdjb2xvcjogZGFya2dyYXknKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAnc2V0RnJhZ21lbnRTb3VyY2UnLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVXBkYXRlIHRoZSBmcmFnbWVudCBzb3VyY2VcclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gZnJhZ21lbnRTb3VyY2VcclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gZnJhZ21lbnRIZWFkZXJcclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHNldEZyYWdtZW50U291cmNlKGZyYWdtZW50U291cmNlLCBmcmFnbWVudEhlYWRlcikge1xuICAgICAgICAgICAgdmFyIGFyZ3VtZW50c1NvdXJjZSA9IGZyYWdtZW50U291cmNlLnNwbGl0KCcpJylbMF0uc3BsaXQoJygnKVsxXS5zcGxpdCgnLCcpOyAvLyBcImZsb2F0KiBBXCIsIFwiZmxvYXQqIEJcIiwgXCJmbG9hdCBDXCIsIFwiZmxvYXQ0KiBEXCJcblxuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGYgPSBhcmd1bWVudHNTb3VyY2UubGVuZ3RoOyBuIDwgZjsgbisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvXFwqL2dtKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJnTmFtZSA9IGFyZ3VtZW50c1NvdXJjZVtuXS5zcGxpdCgnKicpWzFdLnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuY2hlY2tBcmdOYW1lSW5pdGlhbGl6YXRpb24odGhpcy5pbl9mcmFnbWVudF92YWx1ZXMsIGFyZ05hbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0NC9nbSkgIT0gbnVsbCkgdGhpcy5pbl9mcmFnbWVudF92YWx1ZXNbYXJnTmFtZV0udHlwZSA9ICdmbG9hdDRfZnJvbVNhbXBsZXInO2Vsc2UgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvZmxvYXQvZ20pICE9IG51bGwpIHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzW2FyZ05hbWVdLnR5cGUgPSAnZmxvYXRfZnJvbVNhbXBsZXInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzU291cmNlW25dICE9PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfYXJnTmFtZTMgPSBhcmd1bWVudHNTb3VyY2Vbbl0uc3BsaXQoJyAnKVsxXS50cmltKCk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLmluX2ZyYWdtZW50X3ZhbHVlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleS5yZXBsYWNlKC9cXFtcXGQuKi8sIFwiXCIpID09PSBfYXJnTmFtZTMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfYXJnTmFtZTMgPSBrZXk7IC8vIGZvciBub3JtYWwgdW5pZm9ybSBhcnJheXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uKHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzLCBfYXJnTmFtZTMpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0NC9nbSkgIT0gbnVsbCkgdGhpcy5pbl9mcmFnbWVudF92YWx1ZXNbX2FyZ05hbWUzXS50eXBlID0gJ2Zsb2F0NCc7ZWxzZSBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9mbG9hdC9nbSkgIT0gbnVsbCkgdGhpcy5pbl9mcmFnbWVudF92YWx1ZXNbX2FyZ05hbWUzXS50eXBlID0gJ2Zsb2F0JztlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL21hdDQvZ20pICE9IG51bGwpIHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzW19hcmdOYW1lM10udHlwZSA9ICdtYXQ0JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHBhcnNlIGhlYWRlclxuICAgICAgICAgICAgdGhpcy5fZnJhZ21lbnRIZWFkID0gZnJhZ21lbnRIZWFkZXIgIT09IHVuZGVmaW5lZCAmJiBmcmFnbWVudEhlYWRlciAhPT0gbnVsbCA/IGZyYWdtZW50SGVhZGVyIDogJyc7XG4gICAgICAgICAgICB0aGlzLl9mcmFnbWVudEhlYWQgPSB0aGlzLl9mcmFnbWVudEhlYWQucmVwbGFjZSgvXFxyXFxuL2dpLCAnJykucmVwbGFjZSgvXFxyL2dpLCAnJykucmVwbGFjZSgvXFxuL2dpLCAnJyk7XG4gICAgICAgICAgICB0aGlzLl9mcmFnbWVudEhlYWQgPSBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5wYXJzZVNvdXJjZSh0aGlzLl9mcmFnbWVudEhlYWQsIHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzKTtcblxuICAgICAgICAgICAgLy8gcGFyc2Ugc291cmNlXG4gICAgICAgICAgICB0aGlzLl9mcmFnbWVudFNvdXJjZSA9IGZyYWdtZW50U291cmNlLnJlcGxhY2UoL1xcclxcbi9naSwgJycpLnJlcGxhY2UoL1xcci9naSwgJycpLnJlcGxhY2UoL1xcbi9naSwgJycpO1xuICAgICAgICAgICAgdGhpcy5fZnJhZ21lbnRTb3VyY2UgPSB0aGlzLl9mcmFnbWVudFNvdXJjZS5yZXBsYWNlKC9eXFx3KiBcXHcqXFwoW1xcd1xcc1xcKixdKlxcKSB7L2dpLCAnJykucmVwbGFjZSgvfShcXHN8XFx0KSokL2dpLCAnJyk7XG4gICAgICAgICAgICB0aGlzLl9mcmFnbWVudFNvdXJjZSA9IF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLnBhcnNlU291cmNlKHRoaXMuX2ZyYWdtZW50U291cmNlLCB0aGlzLmluX2ZyYWdtZW50X3ZhbHVlcyk7XG5cbiAgICAgICAgICAgIHRoaXMuX2ZyYWdtZW50UF9yZWFkeSA9IHRydWU7XG4gICAgICAgICAgICBpZiAodGhpcy5fdmVydGV4UF9yZWFkeSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHZhciB0cyA9IHRoaXMuY29tcGlsZVZlcnRleEZyYWdtZW50U291cmNlKCk7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy52aWV3U291cmNlID09PSB0cnVlKSBjb25zb2xlLmxvZygnJWMgVkZQOiAnLCAnZm9udC1zaXplOiAyMHB4OyBjb2xvcjogZ3JlZW4nKSwgY29uc29sZS5sb2coJyVjIFdFQkNMR0wgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nLCAnY29sb3I6IGdyYXknKSwgY29uc29sZS5sb2coJyVjICcgKyBmcmFnbWVudEhlYWRlciArIGZyYWdtZW50U291cmNlLCAnY29sb3I6IGdyYXknKSwgY29uc29sZS5sb2coJyVjIFRSQU5TTEFURUQgV0VCR0wgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJywgJ2NvbG9yOiBkYXJrZ3JheScpLCBjb25zb2xlLmxvZygnJWMgJyArIHRzLCAnY29sb3I6IGRhcmtncmF5Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbTtcbn0oKTtcblxuZ2xvYmFsLldlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0gPSBXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtO1xubW9kdWxlLmV4cG9ydHMuV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbSA9IFdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW07Il19
