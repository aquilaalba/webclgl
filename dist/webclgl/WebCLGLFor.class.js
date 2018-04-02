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

},{"./WebCLGLBuffer.class":2,"./WebCLGLKernel.class":4,"./WebCLGLUtils.class":5,"./WebCLGLVertexFragmentProgram.class":6}],2:[function(require,module,exports){
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
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.WebCLGLFor = undefined;

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

exports.gpufor = gpufor;

var _WebCLGL = require("./WebCLGL.class");

var _WebCLGLUtils = require("./WebCLGLUtils.class");

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

/**
 * WebCLGLFor
 * @class
 */
var WebCLGLFor = exports.WebCLGLFor = function () {
    function WebCLGLFor(jsonIn) {
        _classCallCheck(this, WebCLGLFor);

        this.kernels = {};
        this.vertexFragmentPrograms = {};
        this._args = {};
        this._argsValues = {};
        this.calledArgs = {};

        this._webCLGL = null;
        this._gl = null;
    }

    /**
     * defineOutputTempModes
     * @returns {Array<boolean>}
     */

    _createClass(WebCLGLFor, [{
        key: "defineOutputTempModes",
        value: function defineOutputTempModes(output, args) {
            var searchInArgs = function searchInArgs(outputName, args) {
                var found = false;
                for (var key in args) {
                    if (key !== "indices") {
                        var expl = key.split(" ");
                        if (expl.length > 0) {
                            var argName = expl[1];
                            if (argName === outputName) {
                                found = true;
                                break;
                            }
                        }
                    }
                }
                return found;
            };

            var outputTempModes = [];
            for (var n = 0; n < output.length; n++) {
                outputTempModes[n] = output[n] != null ? searchInArgs(output[n], args) : false;
            }return outputTempModes;
        }
    }, {
        key: "prepareReturnCode",

        /**
         * prepareReturnCode
         * @returns {String}
         */
        value: function prepareReturnCode(source, outArg) {
            var objOutStr = [];
            var retCode = source.match(new RegExp(/return.*$/gm));
            retCode = retCode[0].replace("return ", ""); // now "varx" or "[varx1,varx2,..]"
            var isArr = retCode.match(new RegExp(/\[/gm));
            if (isArr != null && isArr.length >= 1) {
                // type outputs array
                retCode = retCode.split("[")[1].split("]")[0];
                var itemStr = "",
                    openParenth = 0;
                for (var n = 0; n < retCode.length; n++) {
                    if (retCode[n] === "," && openParenth === 0) {
                        objOutStr.push(itemStr);
                        itemStr = "";
                    } else itemStr += retCode[n];

                    if (retCode[n] === "(") openParenth++;
                    if (retCode[n] === ")") openParenth--;
                }
                objOutStr.push(itemStr); // and the last
            } else // type one output
                objOutStr.push(retCode.replace(/;$/gm, ""));

            var returnCode = "";
            for (var _n = 0; _n < outArg.length; _n++) {
                // set output type float|float4
                var found = false;
                for (var key in this._args) {
                    if (key !== "indices") {
                        var expl = key.split(" ");

                        if (expl[1] === outArg[_n]) {
                            var mt = expl[0].match(new RegExp("float4", "gm"));
                            returnCode += mt != null && mt.length > 0 ? "out" + _n + "_float4 = " + objOutStr[_n] + ";\n" : "out" + _n + "_float = " + objOutStr[_n] + ";\n";

                            found = true;
                            break;
                        }
                    }
                }
                if (found === false) returnCode += "out" + _n + "_float4 = " + objOutStr[_n] + ";\n";
            }
            return returnCode;
        }
    }, {
        key: "addKernel",

        /**
         * Add one WebCLGLKernel to the work
         * @param {Object} kernelJson
         */
        value: function addKernel(kernelJson) {
            var conf = kernelJson.config;
            var idx = conf[0];
            var outArg = conf[1] instanceof Array ? conf[1] : [conf[1]];
            var kH = conf[2];
            var kS = conf[3];

            var kernel = this._webCLGL.createKernel();

            var strArgs = [];
            for (var key in this._args) {
                var expl = key.split(" ");
                var argName = expl[1];

                // search arguments in use
                if (argName !== undefined && argName !== null) {
                    var matches = (kH + kS).match(new RegExp(argName.replace(/\[\d.*/, ""), "gm"));
                    if (key !== "indices" && matches != null && matches.length > 0) {
                        kernel.in_values[argName] = {};
                        strArgs.push(key.replace("*attr ", "* ").replace(/\[\d.*/, "")); // make replace for ensure no *attr in KERNEL
                    }
                }
            }

            kS = 'void main(' + strArgs.toString() + ') {' + 'vec2 ' + idx + ' = get_global_id();' + kS.replace(/return.*$/gm, this.prepareReturnCode(kS, outArg)) + '}';

            kernel.name = kernelJson.name;
            kernel.viewSource = kernelJson.viewSource != null ? kernelJson.viewSource : false;
            kernel.setKernelSource(kS, kH);

            kernel.output = outArg;
            kernel.outputTempModes = this.defineOutputTempModes(outArg, this._args);
            kernel.enabled = true;
            kernel.drawMode = kernelJson.drawMode != null ? kernelJson.drawMode : 4;
            kernel.depthTest = kernelJson.depthTest != null ? kernelJson.depthTest : true;
            kernel.blend = kernelJson.blend != null ? kernelJson.blend : false;
            kernel.blendEquation = kernelJson.blendEquation != null ? kernelJson.blendEquation : "FUNC_ADD";
            kernel.blendSrcMode = kernelJson.blendSrcMode != null ? kernelJson.blendSrcMode : "SRC_ALPHA";
            kernel.blendDstMode = kernelJson.blendDstMode != null ? kernelJson.blendDstMode : "ONE_MINUS_SRC_ALPHA";

            this.kernels[Object.keys(this.kernels).length.toString()] = kernel;
        }
    }, {
        key: "addGraphic",

        /**
         * addGraphic
         * @param {Object} graphicJson
         */
        value: function addGraphic(graphicJson) {
            var conf = graphicJson.config;
            var outArg = [null];
            var VFP_vertexH = void 0;
            var VFP_vertexS = void 0;
            var VFP_fragmentH = void 0;
            var VFP_fragmentS = void 0;
            if (conf.length === 5) {
                outArg = conf[0] instanceof Array ? conf[0] : [conf[0]];
                VFP_vertexH = conf[1];
                VFP_vertexS = conf[2];
                VFP_fragmentH = conf[3];
                VFP_fragmentS = conf[4];
            } else {
                VFP_vertexH = conf[0];
                VFP_vertexS = conf[1];
                VFP_fragmentH = conf[2];
                VFP_fragmentS = conf[3];
            }

            var vfprogram = this._webCLGL.createVertexFragmentProgram();

            var strArgs_v = [],
                strArgs_f = [];
            for (var key in this._args) {
                var expl = key.split(" ");
                var argName = expl[1];

                // search arguments in use
                if (argName !== undefined && argName !== null) {
                    var matches = (VFP_vertexH + VFP_vertexS).match(new RegExp(argName.replace(/\[\d.*/, ""), "gm"));
                    if (key !== "indices" && matches != null && matches.length > 0) {
                        vfprogram.in_vertex_values[argName] = {};
                        strArgs_v.push(key.replace(/\[\d.*/, "")); // make replace for ensure no *attr in KERNEL
                    }
                }
            }
            for (var _key in this._args) {
                var _expl = _key.split(" ");
                var _argName = _expl[1];

                // search arguments in use
                if (_argName !== undefined && _argName !== null) {
                    var _matches = (VFP_fragmentH + VFP_fragmentS).match(new RegExp(_argName.replace(/\[\d.*/, ""), "gm"));
                    if (_key !== "indices" && _matches != null && _matches.length > 0) {
                        vfprogram.in_fragment_values[_argName] = {};
                        strArgs_f.push(_key.replace(/\[\d.*/, "")); // make replace for ensure no *attr in KERNEL
                    }
                }
            }

            VFP_vertexS = 'void main(' + strArgs_v.toString() + ') {' + VFP_vertexS + '}';
            VFP_fragmentS = 'void main(' + strArgs_f.toString() + ') {' + VFP_fragmentS.replace(/return.*$/gm, this.prepareReturnCode(VFP_fragmentS, outArg)) + '}';

            vfprogram.name = graphicJson.name;
            vfprogram.viewSource = graphicJson.viewSource != null ? graphicJson.viewSource : false;
            vfprogram.setVertexSource(VFP_vertexS, VFP_vertexH);
            vfprogram.setFragmentSource(VFP_fragmentS, VFP_fragmentH);

            vfprogram.output = outArg;
            vfprogram.outputTempModes = this.defineOutputTempModes(outArg, this._args);
            vfprogram.enabled = true;
            vfprogram.drawMode = graphicJson.drawMode != null ? graphicJson.drawMode : 4;
            vfprogram.depthTest = graphicJson.depthTest != null ? graphicJson.depthTest : true;
            vfprogram.blend = graphicJson.blend != null ? graphicJson.blend : true;
            vfprogram.blendEquation = graphicJson.blendEquation != null ? graphicJson.blendEquation : "FUNC_ADD";
            vfprogram.blendSrcMode = graphicJson.blendSrcMode != null ? graphicJson.blendSrcMode : "SRC_ALPHA";
            vfprogram.blendDstMode = graphicJson.blendDstMode != null ? graphicJson.blendDstMode : "ONE_MINUS_SRC_ALPHA";

            this.vertexFragmentPrograms[Object.keys(this.vertexFragmentPrograms).length.toString()] = vfprogram;
        }
    }, {
        key: "checkArg",

        /**
         * checkArg
         * @param {String} argument
         * @param {Array<WebCLGLKernel>} kernels
         * @param {Array<WebCLGLVertexFragmentProgram>} vfps
         * @returns {Object}
         */
        value: function checkArg(argument, kernels, vfps) {
            var kernelPr = [];
            var usedInVertex = false;
            var usedInFragment = false;

            for (var key in kernels) {
                for (var keyB in kernels[key].in_values) {
                    var inValues = kernels[key].in_values[keyB];
                    if (keyB === argument) {
                        kernelPr.push(kernels[key]);
                        break;
                    }
                }
            }

            for (var _key2 in vfps) {
                for (var _keyB in vfps[_key2].in_vertex_values) {
                    var _inValues = vfps[_key2].in_vertex_values[_keyB];
                    if (_keyB === argument) {
                        usedInVertex = true;
                        break;
                    }
                }

                for (var _keyB2 in vfps[_key2].in_fragment_values) {
                    var _inValues2 = vfps[_key2].in_fragment_values[_keyB2];
                    if (_keyB2 === argument) {
                        usedInFragment = true;
                        break;
                    }
                }
            }

            return {
                "usedInVertex": usedInVertex,
                "usedInFragment": usedInFragment,
                "kernelPr": kernelPr };
        }
    }, {
        key: "fillArg",

        /**
         * fillArg
         * @param {String} argName
         * @param {Array<float>} clearColor
         */
        value: function fillArg(argName, clearColor) {
            this._webCLGL.fillBuffer(this._argsValues[argName].textureData, clearColor, this._argsValues[argName].fBuffer), this._webCLGL.fillBuffer(this._argsValues[argName].textureDataTemp, clearColor, this._argsValues[argName].fBufferTemp);
        }
    }, {
        key: "getAllArgs",

        /**
         * Get all arguments existing in passed kernels & vertexFragmentPrograms
         * @returns {Object}
         */
        value: function getAllArgs() {
            return this._argsValues;
        }
    }, {
        key: "addArg",

        /**
         * addArg
         * @param {String} arg
         */
        value: function addArg(arg) {
            this._args[arg] = null;
        }
    }, {
        key: "getGPUForArg",

        /**
         * Get argument from other gpufor (instead of addArg & setArg)
         * @param {String} argument Argument to set
         * @param {WebCLGLFor} gpufor
         */
        value: function getGPUForArg(argument, gpufor) {
            if (this.calledArgs.hasOwnProperty(argument) === false) this.calledArgs[argument] = [];
            if (this.calledArgs[argument].indexOf(gpufor) === -1) this.calledArgs[argument].push(gpufor);

            if (gpufor.calledArgs.hasOwnProperty(argument) === false) gpufor.calledArgs[argument] = [];
            if (gpufor.calledArgs[argument].indexOf(this) === -1) gpufor.calledArgs[argument].push(this);

            for (var key in gpufor._args) {
                var argName = key.split(" ")[1];
                if (argName === argument) {
                    this._args[key] = gpufor._args[key];
                    this._argsValues[argName] = gpufor._argsValues[argName];
                    break;
                }
            }
        }
    }, {
        key: "setArg",

        /**
         * Assign value of a argument for all added Kernels and vertexFragmentPrograms
         * @param {String} argument Argument to set
         * @param {float|Array<float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} value
         * @param {Array<float2>} [overrideDimensions=new Array(){Math.sqrt(value.length), Math.sqrt(value.length)}]
         * @param {String} [overrideType="FLOAT4"] - force "FLOAT4" or "FLOAT" (for no graphic program)
         * @returns {float|Array<float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement}
         */
        value: function setArg(argument, value, overrideDimensions, overrideType) {
            if (argument === "indices") {
                this.setIndices(value);
            } else {
                for (var key in this._args) {
                    var completeVarName = key.split(" ")[1];
                    if (completeVarName !== undefined && completeVarName.replace(/\[\d.*/, "") === argument) {
                        if (completeVarName !== argument) argument = completeVarName;

                        var updateCalledArg = false;
                        if (key.match(/\*/gm) != null) {
                            // buffer
                            var checkResult = this.checkArg(argument, this.kernels, this.vertexFragmentPrograms);

                            var mode = "SAMPLER"; // ATTRIBUTE or SAMPLER
                            if (checkResult.usedInVertex === true) {
                                if (checkResult.kernelPr.length === 0 && checkResult.usedInFragment === false) mode = "ATTRIBUTE";
                            }

                            var type = key.split("*")[0].toUpperCase();
                            if (overrideType !== undefined && overrideType !== null) type = overrideType;

                            if (value !== undefined && value !== null) {
                                if (this._argsValues.hasOwnProperty(argument) === false || this._argsValues.hasOwnProperty(argument) === true && this._argsValues[argument] == null) {
                                    this._argsValues[argument] = this._webCLGL.createBuffer(type, false, mode);
                                    this._argsValues[argument].argument = argument;

                                    updateCalledArg = true;
                                }
                                this._argsValues[argument].writeBuffer(value, false, overrideDimensions);
                            } else {
                                this._argsValues[argument] = null;
                            }
                        } else {
                            // UNIFORM
                            if (value !== undefined && value !== null) this._argsValues[argument] = value;

                            updateCalledArg = true;
                        }

                        if (updateCalledArg === true && this.calledArgs.hasOwnProperty(argument) === true) {
                            for (var n = 0; n < this.calledArgs[argument].length; n++) {
                                var _gpufor = this.calledArgs[argument][n];
                                _gpufor._argsValues[argument] = this._argsValues[argument];
                            }
                        }
                        break;
                    }
                }
            }

            return value;
        }
    }, {
        key: "readArg",

        /**
         * Get Float32Array array from a argument
         * @param {String} argument
         * @returns {Float32Array}
         */
        value: function readArg(argument) {
            return this._webCLGL.readBuffer(this._argsValues[argument]);
        }
    }, {
        key: "setIndices",

        /**
         * Set indices for the geometry passed in vertexFragmentProgram
         * @param {Array<float>} arr
         */
        value: function setIndices(arr) {
            this.CLGL_bufferIndices = this._webCLGL.createBuffer("FLOAT", false, "VERTEX_INDEX");
            this.CLGL_bufferIndices.writeBuffer(arr);
        }
    }, {
        key: "getCtx",

        /**
         * getCtx
         * returns {WebGLRenderingContext}
         */
        value: function getCtx() {
            return this._webCLGL.getContext();
        }
    }, {
        key: "setCtx",

        /**
         * setCtx
         * @param {WebGLRenderingContext} gl
         */
        value: function setCtx(gl) {
            this._gl = gl;
        }
    }, {
        key: "getWebCLGL",

        /**
         * getWebCLGL
         * returns {WebCLGL}
         */
        value: function getWebCLGL() {
            return this._webCLGL;
        }
    }, {
        key: "onPreProcessKernel",

        /**
         * onPreProcessKernel
         * @param {int} [kernelNum=0]
         * @param {Function} fn
         */
        value: function onPreProcessKernel(kernelNum, fn) {
            this.kernels[kernelNum].onpre = fn;
        }
    }, {
        key: "onPostProcessKernel",

        /**
         * onPostProcessKernel
         * @param {int} [kernelNum=0]
         * @param {Function} fn
         */
        value: function onPostProcessKernel(kernelNum, fn) {
            this.kernels[kernelNum].onpost = fn;
        }
    }, {
        key: "enableKernel",

        /**
         * enableKernel
         * @param {int} [kernelNum=0]
         */
        value: function enableKernel(kernelNum) {
            this.kernels[kernelNum.toString() | "0"].enabled = true;
        }
    }, {
        key: "disableKernel",

        /**
         * disableKernel
         * @param {int} [kernelNum=0]
         */
        value: function disableKernel(kernelNum) {
            this.kernels[kernelNum.toString() | "0"].enabled = false;
        }
    }, {
        key: "getKernel",

        /**
         * Get one added WebCLGLKernel
         * @param {String} name Get assigned kernel for this argument
         * @returns {WebCLGLKernel}
         */
        value: function getKernel(name) {
            for (var key in this.kernels) {
                if (key === name) return this.kernels[key];
            }

            return null;
        }
    }, {
        key: "getAllKernels",

        /**
         * Get all added WebCLGLKernels
         * @returns {Object}
         */
        value: function getAllKernels() {
            return this.kernels;
        }
    }, {
        key: "onPreProcessGraphic",

        /**
         * onPreProcessGraphic
         * @param {int} [graphicNum=0]
         * @param {Function} fn
         */
        value: function onPreProcessGraphic(graphicNum, fn) {
            this.vertexFragmentPrograms[graphicNum].onpre = fn;
        }
    }, {
        key: "onPostProcessGraphic",

        /**
         * onPostProcessGraphic
         * @param {int} [graphicNum=0]
         * @param {Function} fn
         */
        value: function onPostProcessGraphic(graphicNum, fn) {
            this.vertexFragmentPrograms[graphicNum].onpost = fn;
        }
    }, {
        key: "enableGraphic",

        /**
         * enableGraphic
         * @param {int} [graphicNum=0]
         */
        value: function enableGraphic(graphicNum) {
            this.vertexFragmentPrograms[graphicNum.toString() | "0"].enabled = true;
        }
    }, {
        key: "disableGraphic",

        /**
         * disableGraphic
         * @param {int} [graphicNum=0]
         */
        value: function disableGraphic(graphicNum) {
            this.vertexFragmentPrograms[graphicNum.toString() | "0"].enabled = false;
        }
    }, {
        key: "getVertexFragmentProgram",

        /**
         * Get one added WebCLGLVertexFragmentProgram
         * @param {String} name Get assigned vfp for this argument
         * @returns {WebCLGLVertexFragmentProgram}
         */
        value: function getVertexFragmentProgram(name) {
            for (var key in this.vertexFragmentPrograms) {
                if (key === name) return this.vertexFragmentPrograms[key];
            }

            return null;
        }
    }, {
        key: "getAllVertexFragmentProgram",

        /**
         * Get all added WebCLGLVertexFragmentPrograms
         * @returns {Object}
         */
        value: function getAllVertexFragmentProgram() {
            return this.vertexFragmentPrograms;
        }
    }, {
        key: "processKernel",

        /**
         * Process kernels
         * @param {WebCLGLKernel} kernel
         * @param {boolean} [outputToTemp=null]
         * @param {boolean} [processCop]
         */
        value: function processKernel(kernel, outputToTemp, processCop) {
            if (kernel.enabled === true) {
                if (processCop !== undefined && processCop !== null && processCop === true) this.arrMakeCopy = [];

                //kernel.drawMode
                if (kernel.depthTest === true) this._gl.enable(this._gl.DEPTH_TEST);else this._gl.disable(this._gl.DEPTH_TEST);

                if (kernel.blend === true) this._gl.enable(this._gl.BLEND);else this._gl.disable(this._gl.BLEND);

                this._gl.blendFunc(this._gl[kernel.blendSrcMode], this._gl[kernel.blendDstMode]);
                this._gl.blendEquation(this._gl[kernel.blendEquation]);

                if (kernel.onpre !== undefined && kernel.onpre !== null) kernel.onpre();

                if (outputToTemp === undefined || outputToTemp === null || outputToTemp === true) {
                    var tempsFound = false;
                    for (var n = 0; n < kernel.output.length; n++) {
                        if (kernel.output[n] != null && kernel.outputTempModes[n] === true) {
                            tempsFound = true;
                            break;
                        }
                    }

                    if (tempsFound === true) {
                        this._webCLGL.enqueueNDRangeKernel(kernel, _WebCLGLUtils.WebCLGLUtils.getOutputBuffers(kernel, this._argsValues), true, this._argsValues);
                        this.arrMakeCopy.push(kernel);
                    } else {
                        this._webCLGL.enqueueNDRangeKernel(kernel, _WebCLGLUtils.WebCLGLUtils.getOutputBuffers(kernel, this._argsValues), false, this._argsValues);
                    }
                } else this._webCLGL.enqueueNDRangeKernel(kernel, _WebCLGLUtils.WebCLGLUtils.getOutputBuffers(kernel, this._argsValues), false, this._argsValues);

                if (kernel.onpost !== undefined && kernel.onpost !== null) kernel.onpost();

                if (processCop !== undefined && processCop !== null && processCop === true) this.processCopies();
            }
        }
    }, {
        key: "processCopies",
        value: function processCopies(outputToTemp) {
            for (var n = 0; n < this.arrMakeCopy.length; n++) {
                this._webCLGL.copy(this.arrMakeCopy[n], _WebCLGLUtils.WebCLGLUtils.getOutputBuffers(this.arrMakeCopy[n], this._argsValues));
            }
        }
    }, {
        key: "processKernels",

        /**
         * Process kernels
         * @param {boolean} [outputToTemp=null]
         */
        value: function processKernels(outputToTemp) {
            this.arrMakeCopy = [];

            for (var key in this.kernels) {
                this.processKernel(this.kernels[key], outputToTemp);
            }this.processCopies();
        }
    }, {
        key: "processGraphic",

        /**
         * processGraphic
         * @param {String} [argumentInd=undefined] Argument for vertices count or undefined if argument "indices" exist
         **/
        value: function processGraphic(argumentInd) {
            var arrMakeCopy = [];
            for (var key in this.vertexFragmentPrograms) {
                var vfp = this.vertexFragmentPrograms[key];

                if (vfp.enabled === true) {
                    var buff = (argumentInd === undefined || argumentInd === null) && this.CLGL_bufferIndices !== undefined && this.CLGL_bufferIndices !== null ? this.CLGL_bufferIndices : this._argsValues[argumentInd];

                    if (buff !== undefined && buff !== null && buff.length > 0) {
                        if (vfp.depthTest === true) this._gl.enable(this._gl.DEPTH_TEST);else this._gl.disable(this._gl.DEPTH_TEST);

                        if (vfp.blend === true) this._gl.enable(this._gl.BLEND);else this._gl.disable(this._gl.BLEND);

                        this._gl.blendFunc(this._gl[vfp.blendSrcMode], this._gl[vfp.blendDstMode]);
                        this._gl.blendEquation(this._gl[vfp.blendEquation]);

                        if (vfp.onpre !== undefined && vfp.onpre !== null) vfp.onpre();

                        var tempsFound = false;
                        for (var n = 0; n < vfp.output.length; n++) {
                            if (vfp.output[n] != null && vfp.outputTempModes[n] === true) {
                                tempsFound = true;
                                break;
                            }
                        }

                        if (tempsFound === true) {
                            this._webCLGL.enqueueVertexFragmentProgram(vfp, buff, vfp.drawMode, _WebCLGLUtils.WebCLGLUtils.getOutputBuffers(vfp, this._argsValues), true, this._argsValues);
                            arrMakeCopy.push(vfp);
                        } else {
                            this._webCLGL.enqueueVertexFragmentProgram(vfp, buff, vfp.drawMode, _WebCLGLUtils.WebCLGLUtils.getOutputBuffers(vfp, this._argsValues), false, this._argsValues);
                        }

                        if (vfp.onpost !== undefined && vfp.onpost !== null) vfp.onpost();
                    }
                }
            }

            for (var _n2 = 0; _n2 < arrMakeCopy.length; _n2++) {
                this._webCLGL.copy(arrMakeCopy[_n2], _WebCLGLUtils.WebCLGLUtils.getOutputBuffers(arrMakeCopy[_n2], this._argsValues));
            }
        }
    }, {
        key: "ini",

        /**
         * initialize numeric
         */
        value: function ini() {
            var argumentss = arguments[0];
            var idx = void 0;
            var typOut = void 0;
            var code = void 0;
            if (argumentss.length > 3) {
                this._args = argumentss[0];
                idx = argumentss[1];
                typOut = argumentss[2];
                code = argumentss[3];
            } else {
                this._args = argumentss[0];
                idx = argumentss[1];
                typOut = "FLOAT";
                code = argumentss[2];
            }

            // args
            var buffLength = 0;
            for (var key in this._args) {
                var argVal = this._args[key];

                this.setArg(key.split(" ")[1], argVal);

                if (buffLength === 0 && (argVal instanceof Array || argVal instanceof Float32Array || argVal instanceof Uint8Array || argVal instanceof HTMLImageElement)) buffLength = argVal.length;
            }
            if (typOut === "FLOAT") this.addArg("float* result");else this.addArg("float4* result");
            this.setArg("result", new Float32Array(buffLength), null, typOut);

            // kernel
            this.addKernel({
                "type": "KERNEL",
                "name": "SIMPLE_KERNEL",
                "viewSource": false,
                "config": [idx, ["result"], '', code] });

            // proccess
            this.processKernels();

            return this._webCLGL.readBuffer(this._argsValues["result"]);
        }
    }, {
        key: "iniG",

        /**
         * initialize Graphic
         */
        value: function iniG() {
            this._webCLGL.getContext().depthFunc(this._webCLGL.getContext().LEQUAL);
            this._webCLGL.getContext().clearDepth(1.0);

            var argumentss = arguments[0]; // override
            this._args = argumentss[1]; // first is context or canvas

            // kernel & graphics
            for (var i = 2; i < argumentss.length; i++) {
                if (argumentss[i].type === "KERNEL") this.addKernel(argumentss[i]);else if (argumentss[i].type === "GRAPHIC") // VFP
                    this.addGraphic(argumentss[i]);
            }

            // args
            for (var key in this._args) {
                var argVal = this._args[key];

                if (key === "indices") {
                    if (argVal !== null) this.setIndices(argVal);
                } else this.setArg(key.split(" ")[1], argVal);
            }
        }
    }]);

    return WebCLGLFor;
}();

global.WebCLGLFor = WebCLGLFor;
module.exports.WebCLGLFor = WebCLGLFor;

/**
 * gpufor
 * @returns {WebCLGLFor|Array<float>}
 */
function gpufor() {
    var clglFor = new WebCLGLFor();
    var _gl = null;
    if (arguments[0] instanceof WebGLRenderingContext) {
        _gl = arguments[0];

        clglFor.setCtx(_gl);
        clglFor._webCLGL = new _WebCLGL.WebCLGL(_gl);
        clglFor.iniG(arguments);
        return clglFor;
    } else if (arguments[0] instanceof HTMLCanvasElement) {
        _gl = _WebCLGLUtils.WebCLGLUtils.getWebGLContextFromCanvas(arguments[0]);

        clglFor.setCtx(_gl);
        clglFor._webCLGL = new _WebCLGL.WebCLGL(_gl);
        clglFor.iniG(arguments);
        return clglFor;
    } else {
        _gl = _WebCLGLUtils.WebCLGLUtils.getWebGLContextFromCanvas(document.createElement('canvas'), { antialias: false });

        clglFor.setCtx(_gl);
        clglFor._webCLGL = new _WebCLGL.WebCLGL(_gl);
        return clglFor.ini(arguments);
    }
}
global.gpufor = gpufor;
module.exports.gpufor = gpufor;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./WebCLGL.class":1,"./WebCLGLUtils.class":5}],4:[function(require,module,exports){
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

},{"./WebCLGLUtils.class":5}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{"./WebCLGLUtils.class":5}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvd2ViY2xnbC9XZWJDTEdMLmNsYXNzLmpzIiwic3JjL3dlYmNsZ2wvV2ViQ0xHTEJ1ZmZlci5jbGFzcy5qcyIsInNyYy93ZWJjbGdsL1dlYkNMR0xGb3IuY2xhc3MuanMiLCJzcmMvd2ViY2xnbC9XZWJDTEdMS2VybmVsLmNsYXNzLmpzIiwic3JjL3dlYmNsZ2wvV2ViQ0xHTFV0aWxzLmNsYXNzLmpzIiwic3JjL3dlYmNsZ2wvV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbS5jbGFzcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTs7QUFFQSxPQUFPLGNBQVAsQ0FBc0IsT0FBdEIsRUFBK0IsWUFBL0IsRUFBNkM7QUFDekMsV0FBTztBQURrQyxDQUE3QztBQUdBLFFBQVEsT0FBUixHQUFrQixTQUFsQjs7QUFFQSxJQUFJLGVBQWUsWUFBWTtBQUFFLGFBQVMsZ0JBQVQsQ0FBMEIsTUFBMUIsRUFBa0MsS0FBbEMsRUFBeUM7QUFBRSxhQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksTUFBTSxNQUExQixFQUFrQyxHQUFsQyxFQUF1QztBQUFFLGdCQUFJLGFBQWEsTUFBTSxDQUFOLENBQWpCLENBQTJCLFdBQVcsVUFBWCxHQUF3QixXQUFXLFVBQVgsSUFBeUIsS0FBakQsQ0FBd0QsV0FBVyxZQUFYLEdBQTBCLElBQTFCLENBQWdDLElBQUksV0FBVyxVQUFmLEVBQTJCLFdBQVcsUUFBWCxHQUFzQixJQUF0QixDQUE0QixPQUFPLGNBQVAsQ0FBc0IsTUFBdEIsRUFBOEIsV0FBVyxHQUF6QyxFQUE4QyxVQUE5QztBQUE0RDtBQUFFLEtBQUMsT0FBTyxVQUFVLFdBQVYsRUFBdUIsVUFBdkIsRUFBbUMsV0FBbkMsRUFBZ0Q7QUFBRSxZQUFJLFVBQUosRUFBZ0IsaUJBQWlCLFlBQVksU0FBN0IsRUFBd0MsVUFBeEMsRUFBcUQsSUFBSSxXQUFKLEVBQWlCLGlCQUFpQixXQUFqQixFQUE4QixXQUE5QixFQUE0QyxPQUFPLFdBQVA7QUFBcUIsS0FBaE47QUFBbU4sQ0FBOWhCLEVBQW5CLEMsQ0FBcWpCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF3QnJqQixJQUFJLGlCQUFpQixRQUFRLHVCQUFSLENBQXJCOztBQUVBLElBQUksaUJBQWlCLFFBQVEsdUJBQVIsQ0FBckI7O0FBRUEsSUFBSSxnQ0FBZ0MsUUFBUSxzQ0FBUixDQUFwQzs7QUFFQSxJQUFJLGdCQUFnQixRQUFRLHNCQUFSLENBQXBCOztBQUVBLFNBQVMsZUFBVCxDQUF5QixRQUF6QixFQUFtQyxXQUFuQyxFQUFnRDtBQUFFLFFBQUksRUFBRSxvQkFBb0IsV0FBdEIsQ0FBSixFQUF3QztBQUFFLGNBQU0sSUFBSSxTQUFKLENBQWMsbUNBQWQsQ0FBTjtBQUEyRDtBQUFFOztBQUV6Sjs7Ozs7QUFLQSxJQUFJLFVBQVUsUUFBUSxPQUFSLEdBQWtCLFlBQVk7QUFDeEMsYUFBUyxPQUFULENBQWlCLFlBQWpCLEVBQStCO0FBQzNCLHdCQUFnQixJQUFoQixFQUFzQixPQUF0Qjs7QUFFQSxhQUFLLEtBQUwsR0FBYSxJQUFJLGNBQWMsWUFBbEIsRUFBYjs7QUFFQSxhQUFLLEdBQUwsR0FBVyxJQUFYO0FBQ0EsYUFBSyxDQUFMLEdBQVMsSUFBVDtBQUNBLFlBQUksaUJBQWlCLFNBQWpCLElBQThCLGlCQUFpQixJQUFuRCxFQUF5RDtBQUNyRCxpQkFBSyxDQUFMLEdBQVMsU0FBUyxhQUFULENBQXVCLFFBQXZCLENBQVQ7QUFDQSxpQkFBSyxDQUFMLENBQU8sS0FBUCxHQUFlLEVBQWY7QUFDQSxpQkFBSyxDQUFMLENBQU8sTUFBUCxHQUFnQixFQUFoQjtBQUNBLGlCQUFLLEdBQUwsR0FBVyxjQUFjLFlBQWQsQ0FBMkIseUJBQTNCLENBQXFELEtBQUssQ0FBMUQsRUFBNkQsRUFBRSxXQUFXLEtBQWIsRUFBN0QsQ0FBWDtBQUNILFNBTEQsTUFLTyxLQUFLLEdBQUwsR0FBVyxZQUFYOztBQUVQLGFBQUssT0FBTCxHQUFlLEVBQUUscUJBQXFCLElBQXZCLEVBQTZCLDRCQUE0QixJQUF6RCxFQUErRCwwQkFBMEIsSUFBekYsRUFBK0Ysc0JBQXNCLElBQXJILEVBQWY7QUFDQSxhQUFLLElBQUksR0FBVCxJQUFnQixLQUFLLE9BQXJCLEVBQThCO0FBQzFCLGlCQUFLLE9BQUwsQ0FBYSxHQUFiLElBQW9CLEtBQUssR0FBTCxDQUFTLFlBQVQsQ0FBc0IsR0FBdEIsQ0FBcEI7QUFDQSxnQkFBSSxLQUFLLE9BQUwsQ0FBYSxHQUFiLEtBQXFCLElBQXpCLEVBQStCLFFBQVEsS0FBUixDQUFjLGVBQWUsR0FBZixHQUFxQixnQkFBbkM7QUFDbEM7QUFDRCxhQUFLLGVBQUwsR0FBdUIsSUFBdkI7QUFDQSxZQUFJLEtBQUssT0FBTCxDQUFhLGNBQWIsQ0FBNEIsb0JBQTVCLEtBQXFELEtBQUssT0FBTCxDQUFhLG9CQUFiLEtBQXNDLElBQS9GLEVBQXFHO0FBQ2pHLGlCQUFLLGVBQUwsR0FBdUIsS0FBSyxHQUFMLENBQVMsWUFBVCxDQUFzQixLQUFLLE9BQUwsQ0FBYSxvQkFBYixFQUFtQyxzQkFBekQsQ0FBdkI7QUFDQSxvQkFBUSxHQUFSLENBQVksdUJBQXVCLEtBQUssZUFBeEM7QUFDSCxTQUhELE1BR08sUUFBUSxHQUFSLENBQVkscUJBQVo7O0FBRVAsWUFBSSx1QkFBdUIsS0FBSyxHQUFMLENBQVMsd0JBQVQsQ0FBa0MsS0FBSyxHQUFMLENBQVMsZUFBM0MsRUFBNEQsS0FBSyxHQUFMLENBQVMsVUFBckUsQ0FBM0I7QUFDQSxhQUFLLFNBQUwsR0FBaUIscUJBQXFCLFNBQXJCLEtBQW1DLENBQW5DLEdBQXVDLG9EQUF2QyxHQUE4RixrREFBL0c7QUFDQTtBQUNBLGFBQUssbUJBQUwsR0FBMkIsQ0FBM0I7QUFDQSxhQUFLLFlBQUwsR0FBb0IsQ0FBcEI7O0FBRUE7QUFDQSxZQUFJLE9BQU8sS0FBSyxLQUFMLENBQVcsUUFBWCxDQUFvQixTQUFwQixFQUErQixHQUEvQixFQUFvQyxHQUFwQyxDQUFYO0FBQ0EsYUFBSyxpQkFBTCxHQUF5QixLQUFLLEdBQUwsQ0FBUyxZQUFULEVBQXpCO0FBQ0EsYUFBSyxHQUFMLENBQVMsVUFBVCxDQUFvQixLQUFLLEdBQUwsQ0FBUyxZQUE3QixFQUEyQyxLQUFLLGlCQUFoRDtBQUNBLGFBQUssR0FBTCxDQUFTLFVBQVQsQ0FBb0IsS0FBSyxHQUFMLENBQVMsWUFBN0IsRUFBMkMsSUFBSSxZQUFKLENBQWlCLEtBQUssV0FBdEIsQ0FBM0MsRUFBK0UsS0FBSyxHQUFMLENBQVMsV0FBeEY7QUFDQSxhQUFLLGdCQUFMLEdBQXdCLEtBQUssR0FBTCxDQUFTLFlBQVQsRUFBeEI7QUFDQSxhQUFLLEdBQUwsQ0FBUyxVQUFULENBQW9CLEtBQUssR0FBTCxDQUFTLG9CQUE3QixFQUFtRCxLQUFLLGdCQUF4RDtBQUNBLGFBQUssR0FBTCxDQUFTLFVBQVQsQ0FBb0IsS0FBSyxHQUFMLENBQVMsb0JBQTdCLEVBQW1ELElBQUksV0FBSixDQUFnQixLQUFLLFVBQXJCLENBQW5ELEVBQXFGLEtBQUssR0FBTCxDQUFTLFdBQTlGOztBQUVBLGFBQUssWUFBTCxHQUFvQixFQUFwQjs7QUFFQTtBQUNBLFlBQUksZUFBZSxLQUFLLFNBQUwsR0FBaUIsbUNBQWpCLEdBQXVELHdCQUF2RCxHQUFrRixxQkFBbEYsR0FBMEcsNkNBQTFHLEdBQTBKLHdDQUExSixHQUFxTSxLQUF4TjtBQUNBLFlBQUksaUJBQWlCLEtBQUssU0FBTCxHQUFpQixxQ0FBakIsR0FBeUQsd0JBQXpEOztBQUVyQjtBQUNBLDZCQUhxQixHQUdHLG1EQUhILEdBR3lELEtBSDlFOztBQUtBLGFBQUssaUJBQUwsR0FBeUIsS0FBSyxHQUFMLENBQVMsYUFBVCxFQUF6QjtBQUNBLGFBQUssS0FBTCxDQUFXLFlBQVgsQ0FBd0IsS0FBSyxHQUE3QixFQUFrQyxnQkFBbEMsRUFBb0QsWUFBcEQsRUFBa0UsY0FBbEUsRUFBa0YsS0FBSyxpQkFBdkY7O0FBRUEsYUFBSyxjQUFMLEdBQXNCLEtBQUssR0FBTCxDQUFTLGlCQUFULENBQTJCLEtBQUssaUJBQWhDLEVBQW1ELGlCQUFuRCxDQUF0QjtBQUNBLGFBQUssY0FBTCxHQUFzQixLQUFLLEdBQUwsQ0FBUyxrQkFBVCxDQUE0QixLQUFLLGlCQUFqQyxFQUFvRCxnQkFBcEQsQ0FBdEI7O0FBRUE7QUFDQSxZQUFJLDBCQUEwQixZQUFZO0FBQ3RDLG1CQUFPLEtBQUssZUFBTCxLQUF5QixTQUF6QixJQUFzQyxLQUFLLGVBQUwsS0FBeUIsSUFBL0QsR0FBc0UsNENBQXRFLEdBQXFILEVBQTVIO0FBQ0gsU0FGNkIsQ0FFNUIsSUFGNEIsQ0FFdkIsSUFGdUIsQ0FBOUI7QUFHQSxZQUFJLDZCQUE2QixZQUFZO0FBQ3pDLGdCQUFJLE1BQU0sRUFBVjtBQUNBLGlCQUFLLElBQUksSUFBSSxDQUFSLEVBQVcsS0FBSyxLQUFLLGVBQTFCLEVBQTJDLElBQUksRUFBL0MsRUFBbUQsR0FBbkQsRUFBd0Q7QUFDcEQsdUJBQU8sdUJBQXVCLENBQXZCLEdBQTJCLG1CQUEzQixHQUFpRCxDQUFqRCxHQUFxRCxLQUE1RDtBQUNILG9CQUFPLEdBQVA7QUFDSixTQUxnQyxDQUsvQixJQUwrQixDQUsxQixJQUwwQixDQUFqQztBQU1BLFlBQUkseUJBQXlCLFlBQVk7QUFDckMsZ0JBQUksTUFBTSxFQUFWO0FBQ0EsaUJBQUssSUFBSSxJQUFJLENBQVIsRUFBVyxLQUFLLEtBQUssZUFBMUIsRUFBMkMsSUFBSSxFQUEvQyxFQUFtRCxHQUFuRCxFQUF3RDtBQUNwRCx1QkFBTyxpQkFBaUIsQ0FBakIsR0FBcUIseUJBQXJCLEdBQWlELENBQWpELEdBQXFELGVBQTVEO0FBQ0gsb0JBQU8sR0FBUDtBQUNKLFNBTDRCLENBSzNCLElBTDJCLENBS3RCLElBTHNCLENBQTdCO0FBTUEsdUJBQWUsS0FBSyxLQUFLLFNBQVYsR0FBc0IsbUNBQXRCLEdBQTRELHdCQUE1RCxHQUF1RixxQkFBdkYsR0FBK0csNkNBQS9HLEdBQStKLHdDQUEvSixHQUEwTSxHQUF6TjtBQUNBLHlCQUFpQiw0QkFBNEIsS0FBSyxTQUFqQyxHQUE2Qyw2QkFBN0MsR0FBNkUsS0FBSyxlQUFsRixHQUFvRyxNQUFwRyxHQUE2Ryx3QkFBN0c7O0FBRWpCO0FBQ0EsNkJBSGlCLEdBR08sd0JBSFAsR0FHa0MsR0FIbkQ7QUFJQSxhQUFLLGtCQUFMLEdBQTBCLEtBQUssR0FBTCxDQUFTLGFBQVQsRUFBMUI7QUFDQSxhQUFLLEtBQUwsQ0FBVyxZQUFYLENBQXdCLEtBQUssR0FBN0IsRUFBa0MsaUJBQWxDLEVBQXFELFlBQXJELEVBQW1FLGNBQW5FLEVBQW1GLEtBQUssa0JBQXhGOztBQUVBLGFBQUssb0JBQUwsR0FBNEIsS0FBSyxHQUFMLENBQVMsaUJBQVQsQ0FBMkIsS0FBSyxrQkFBaEMsRUFBb0QsaUJBQXBELENBQTVCOztBQUVBLGFBQUssSUFBSSxJQUFJLENBQVIsRUFBVyxLQUFLLEtBQUssZUFBMUIsRUFBMkMsSUFBSSxFQUEvQyxFQUFtRCxHQUFuRCxFQUF3RDtBQUNwRCxpQkFBSyxZQUFMLENBQWtCLENBQWxCLElBQXVCLEtBQUssR0FBTCxDQUFTLGtCQUFULENBQTRCLEtBQUssa0JBQWpDLEVBQXFELGNBQWMsQ0FBZCxHQUFrQixHQUF2RSxDQUF2QjtBQUNILGNBQUssY0FBTCxHQUFzQixLQUFLLEdBQUwsQ0FBUyxhQUFULEVBQXRCO0FBQ0QsYUFBSyxHQUFMLENBQVMsV0FBVCxDQUFxQixLQUFLLEdBQUwsQ0FBUyxVQUE5QixFQUEwQyxLQUFLLGNBQS9DO0FBQ0EsYUFBSyxHQUFMLENBQVMsVUFBVCxDQUFvQixLQUFLLEdBQUwsQ0FBUyxVQUE3QixFQUF5QyxDQUF6QyxFQUE0QyxLQUFLLEdBQUwsQ0FBUyxJQUFyRCxFQUEyRCxDQUEzRCxFQUE4RCxDQUE5RCxFQUFpRSxDQUFqRSxFQUFvRSxLQUFLLEdBQUwsQ0FBUyxJQUE3RSxFQUFtRixLQUFLLEdBQUwsQ0FBUyxLQUE1RixFQUFtRyxJQUFJLFlBQUosQ0FBaUIsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQixFQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixFQUErQixDQUEvQixFQUFrQyxDQUFsQyxFQUFxQyxDQUFyQyxFQUF3QyxDQUF4QyxFQUEyQyxDQUEzQyxFQUE4QyxDQUE5QyxDQUFqQixDQUFuRztBQUNBLGFBQUssR0FBTCxDQUFTLGFBQVQsQ0FBdUIsS0FBSyxHQUFMLENBQVMsVUFBaEMsRUFBNEMsS0FBSyxHQUFMLENBQVMsa0JBQXJELEVBQXlFLEtBQUssR0FBTCxDQUFTLE9BQWxGO0FBQ0EsYUFBSyxHQUFMLENBQVMsYUFBVCxDQUF1QixLQUFLLEdBQUwsQ0FBUyxVQUFoQyxFQUE0QyxLQUFLLEdBQUwsQ0FBUyxrQkFBckQsRUFBeUUsS0FBSyxHQUFMLENBQVMsT0FBbEY7QUFDQSxhQUFLLEdBQUwsQ0FBUyxhQUFULENBQXVCLEtBQUssR0FBTCxDQUFTLFVBQWhDLEVBQTRDLEtBQUssR0FBTCxDQUFTLGNBQXJELEVBQXFFLEtBQUssR0FBTCxDQUFTLGFBQTlFO0FBQ0EsYUFBSyxHQUFMLENBQVMsYUFBVCxDQUF1QixLQUFLLEdBQUwsQ0FBUyxVQUFoQyxFQUE0QyxLQUFLLEdBQUwsQ0FBUyxjQUFyRCxFQUFxRSxLQUFLLEdBQUwsQ0FBUyxhQUE5RTtBQUNBLGFBQUssR0FBTCxDQUFTLFdBQVQsQ0FBcUIsS0FBSyxHQUFMLENBQVMsVUFBOUIsRUFBMEMsSUFBMUM7QUFDSDs7QUFFRDs7Ozs7QUFNQSxpQkFBYSxPQUFiLEVBQXNCLENBQUM7QUFDbkIsYUFBSyxZQURjO0FBRW5CLGVBQU8sU0FBUyxVQUFULEdBQXNCO0FBQ3pCLG1CQUFPLEtBQUssR0FBWjtBQUNIO0FBSmtCLEtBQUQsRUFLbkI7QUFDQyxhQUFLLG1CQUROOztBQUlDOzs7O0FBSUEsZUFBTyxTQUFTLGlCQUFULEdBQTZCO0FBQ2hDLG1CQUFPLEtBQUssZUFBWjtBQUNIO0FBVkYsS0FMbUIsRUFnQm5CO0FBQ0MsYUFBSyx3QkFETjs7QUFJQzs7OztBQUlBLGVBQU8sU0FBUyxzQkFBVCxHQUFrQztBQUNyQyxnQkFBSSxNQUFNLEtBQUssR0FBTCxDQUFTLHNCQUFULENBQWdDLEtBQUssR0FBTCxDQUFTLFdBQXpDLENBQVY7QUFDQSxnQkFBSSxVQUFVLEVBQWQ7QUFDQSxvQkFBUSxLQUFLLEdBQUwsQ0FBUyxvQkFBakIsSUFBeUMsSUFBekM7QUFDQSxvQkFBUSxLQUFLLEdBQUwsQ0FBUyxpQ0FBakIsSUFBc0QscUpBQXREO0FBQ0Esb0JBQVEsS0FBSyxHQUFMLENBQVMseUNBQWpCLElBQThELG1FQUE5RDtBQUNBLG9CQUFRLEtBQUssR0FBTCxDQUFTLGlDQUFqQixJQUFzRCx3RkFBdEQ7QUFDQSxvQkFBUSxLQUFLLEdBQUwsQ0FBUyx1QkFBakIsSUFBNEMsMElBQTVDO0FBQ0EsZ0JBQUksUUFBUSxHQUFSLE1BQWlCLElBQWpCLElBQXlCLFFBQVEsR0FBUixNQUFpQixJQUE5QyxFQUFvRDtBQUNoRCx3QkFBUSxHQUFSLENBQVksUUFBUSxHQUFSLENBQVo7QUFDQSx1QkFBTyxLQUFQO0FBQ0g7QUFDRCxtQkFBTyxJQUFQO0FBQ0g7QUFyQkYsS0FoQm1CLEVBc0NuQjtBQUNDLGFBQUssTUFETjs7QUFJQzs7Ozs7QUFLQSxlQUFPLFNBQVMsSUFBVCxDQUFjLEdBQWQsRUFBbUIsY0FBbkIsRUFBbUM7QUFDdEMsZ0JBQUksbUJBQW1CLFNBQW5CLElBQWdDLG1CQUFtQixJQUF2RCxFQUE2RDtBQUN6RCxvQkFBSSxlQUFlLENBQWYsTUFBc0IsU0FBdEIsSUFBbUMsZUFBZSxDQUFmLE1BQXNCLElBQTdELEVBQW1FO0FBQy9ELHlCQUFLLEdBQUwsQ0FBUyxRQUFULENBQWtCLENBQWxCLEVBQXFCLENBQXJCLEVBQXdCLGVBQWUsQ0FBZixFQUFrQixDQUExQyxFQUE2QyxlQUFlLENBQWYsRUFBa0IsQ0FBL0Q7O0FBRUEseUJBQUssR0FBTCxDQUFTLGVBQVQsQ0FBeUIsS0FBSyxHQUFMLENBQVMsV0FBbEMsRUFBK0MsZUFBZSxDQUFmLEVBQWtCLE9BQWpFO0FBQ0Esd0JBQUksV0FBVyxFQUFmO0FBQ0EseUJBQUssSUFBSSxJQUFJLENBQVIsRUFBVyxLQUFLLGVBQWUsTUFBcEMsRUFBNEMsSUFBSSxFQUFoRCxFQUFvRCxHQUFwRCxFQUF5RDtBQUNyRCw0QkFBSSxlQUFlLENBQWYsTUFBc0IsU0FBdEIsSUFBbUMsZUFBZSxDQUFmLE1BQXNCLElBQTdELEVBQW1FO0FBQy9ELGlDQUFLLEdBQUwsQ0FBUyxvQkFBVCxDQUE4QixLQUFLLEdBQUwsQ0FBUyxXQUF2QyxFQUFvRCxLQUFLLE9BQUwsQ0FBYSxvQkFBYixFQUFtQyxxQkFBcUIsQ0FBckIsR0FBeUIsUUFBNUQsQ0FBcEQsRUFBMkgsS0FBSyxHQUFMLENBQVMsVUFBcEksRUFBZ0osZUFBZSxDQUFmLEVBQWtCLFdBQWxLLEVBQStLLENBQS9LO0FBQ0EscUNBQVMsQ0FBVCxJQUFjLEtBQUssT0FBTCxDQUFhLG9CQUFiLEVBQW1DLHFCQUFxQixDQUFyQixHQUF5QixRQUE1RCxDQUFkO0FBQ0gseUJBSEQsTUFHTyxTQUFTLENBQVQsSUFBYyxLQUFLLEdBQUwsQ0FBUyxNQUFULENBQWQ7QUFDVjtBQUNELHlCQUFLLE9BQUwsQ0FBYSxvQkFBYixFQUFtQyxnQkFBbkMsQ0FBb0QsUUFBcEQ7O0FBRUEsd0JBQUksS0FBSyxzQkFBTCxPQUFrQyxJQUF0QyxFQUE0QztBQUN4Qyw2QkFBSyxHQUFMLENBQVMsVUFBVCxDQUFvQixLQUFLLGtCQUF6Qjs7QUFFQSw2QkFBSyxJQUFJLEtBQUssQ0FBVCxFQUFZLE1BQU0sZUFBZSxNQUF0QyxFQUE4QyxLQUFLLEdBQW5ELEVBQXdELElBQXhELEVBQThEO0FBQzFELGlDQUFLLEdBQUwsQ0FBUyxhQUFULENBQXVCLEtBQUssR0FBTCxDQUFTLFlBQVksRUFBckIsQ0FBdkI7QUFDQSxnQ0FBSSxlQUFlLEVBQWYsTUFBdUIsU0FBdkIsSUFBb0MsZUFBZSxFQUFmLE1BQXVCLElBQS9ELEVBQXFFLEtBQUssR0FBTCxDQUFTLFdBQVQsQ0FBcUIsS0FBSyxHQUFMLENBQVMsVUFBOUIsRUFBMEMsZUFBZSxFQUFmLEVBQW1CLGVBQTdELEVBQXJFLEtBQXdKLEtBQUssR0FBTCxDQUFTLFdBQVQsQ0FBcUIsS0FBSyxHQUFMLENBQVMsVUFBOUIsRUFBMEMsS0FBSyxjQUEvQztBQUN4SixpQ0FBSyxHQUFMLENBQVMsU0FBVCxDQUFtQixLQUFLLFlBQUwsQ0FBa0IsRUFBbEIsQ0FBbkIsRUFBMEMsRUFBMUM7QUFDSDs7QUFFRCw2QkFBSyxPQUFMLENBQWEsY0FBYjtBQUNIO0FBQ0osaUJBeEJELE1Bd0JPO0FBQ0gseUJBQUssR0FBTCxDQUFTLGVBQVQsQ0FBeUIsS0FBSyxHQUFMLENBQVMsV0FBbEMsRUFBK0MsSUFBL0M7QUFDSDtBQUNKLGFBNUJELE1BNEJPLEtBQUssR0FBTCxDQUFTLGVBQVQsQ0FBeUIsS0FBSyxHQUFMLENBQVMsV0FBbEMsRUFBK0MsSUFBL0M7QUFDVjtBQXZDRixLQXRDbUIsRUE4RW5CO0FBQ0MsYUFBSyxTQUROO0FBRUMsZUFBTyxTQUFTLE9BQVQsQ0FBaUIsY0FBakIsRUFBaUM7QUFDcEMsaUJBQUssR0FBTCxDQUFTLHVCQUFULENBQWlDLEtBQUssb0JBQXRDO0FBQ0EsaUJBQUssR0FBTCxDQUFTLFVBQVQsQ0FBb0IsS0FBSyxHQUFMLENBQVMsWUFBN0IsRUFBMkMsS0FBSyxpQkFBaEQ7QUFDQSxpQkFBSyxHQUFMLENBQVMsbUJBQVQsQ0FBNkIsS0FBSyxvQkFBbEMsRUFBd0QsQ0FBeEQsRUFBMkQsS0FBSyxHQUFMLENBQVMsS0FBcEUsRUFBMkUsS0FBM0UsRUFBa0YsQ0FBbEYsRUFBcUYsQ0FBckY7O0FBRUEsaUJBQUssR0FBTCxDQUFTLFVBQVQsQ0FBb0IsS0FBSyxHQUFMLENBQVMsb0JBQTdCLEVBQW1ELEtBQUssZ0JBQXhEO0FBQ0EsaUJBQUssR0FBTCxDQUFTLFlBQVQsQ0FBc0IsS0FBSyxHQUFMLENBQVMsU0FBL0IsRUFBMEMsQ0FBMUMsRUFBNkMsS0FBSyxHQUFMLENBQVMsY0FBdEQsRUFBc0UsQ0FBdEU7QUFDSDtBQVRGLEtBOUVtQixFQXdGbkI7QUFDQyxhQUFLLGNBRE47O0FBSUM7Ozs7Ozs7QUFPQSxlQUFPLFNBQVMsWUFBVCxDQUFzQixJQUF0QixFQUE0QixNQUE1QixFQUFvQyxJQUFwQyxFQUEwQztBQUM3QyxtQkFBTyxJQUFJLGVBQWUsYUFBbkIsQ0FBaUMsS0FBSyxHQUF0QyxFQUEyQyxJQUEzQyxFQUFpRCxNQUFqRCxFQUF5RCxJQUF6RCxDQUFQO0FBQ0g7QUFiRixLQXhGbUIsRUFzR25CO0FBQ0MsYUFBSyxjQUROOztBQUlDOzs7Ozs7QUFNQSxlQUFPLFNBQVMsWUFBVCxDQUFzQixNQUF0QixFQUE4QixNQUE5QixFQUFzQztBQUN6QyxtQkFBTyxJQUFJLGVBQWUsYUFBbkIsQ0FBaUMsS0FBSyxHQUF0QyxFQUEyQyxNQUEzQyxFQUFtRCxNQUFuRCxDQUFQO0FBQ0g7QUFaRixLQXRHbUIsRUFtSG5CO0FBQ0MsYUFBSyw2QkFETjs7QUFJQzs7Ozs7Ozs7QUFRQSxlQUFPLFNBQVMsMkJBQVQsQ0FBcUMsWUFBckMsRUFBbUQsWUFBbkQsRUFBaUUsY0FBakUsRUFBaUYsY0FBakYsRUFBaUc7QUFDcEcsbUJBQU8sSUFBSSw4QkFBOEIsNEJBQWxDLENBQStELEtBQUssR0FBcEUsRUFBeUUsWUFBekUsRUFBdUYsWUFBdkYsRUFBcUcsY0FBckcsRUFBcUgsY0FBckgsQ0FBUDtBQUNIO0FBZEYsS0FuSG1CLEVBa0luQjtBQUNDLGFBQUssWUFETjs7QUFJQzs7Ozs7O0FBTUEsZUFBTyxTQUFTLFVBQVQsQ0FBb0IsT0FBcEIsRUFBNkIsVUFBN0IsRUFBeUMsT0FBekMsRUFBa0Q7QUFDckQsaUJBQUssR0FBTCxDQUFTLGVBQVQsQ0FBeUIsS0FBSyxHQUFMLENBQVMsV0FBbEMsRUFBK0MsT0FBL0M7QUFDQSxpQkFBSyxHQUFMLENBQVMsb0JBQVQsQ0FBOEIsS0FBSyxHQUFMLENBQVMsV0FBdkMsRUFBb0QsS0FBSyxPQUFMLENBQWEsb0JBQWIsRUFBbUMseUJBQW5DLENBQXBELEVBQW1ILEtBQUssR0FBTCxDQUFTLFVBQTVILEVBQXdJLE9BQXhJLEVBQWlKLENBQWpKOztBQUVBLGdCQUFJLFdBQVcsQ0FBQyxLQUFLLE9BQUwsQ0FBYSxvQkFBYixFQUFtQyx5QkFBbkMsQ0FBRCxDQUFmO0FBQ0EsaUJBQUssT0FBTCxDQUFhLG9CQUFiLEVBQW1DLGdCQUFuQyxDQUFvRCxRQUFwRDs7QUFFQSxnQkFBSSxlQUFlLFNBQWYsSUFBNEIsZUFBZSxJQUEvQyxFQUFxRCxLQUFLLEdBQUwsQ0FBUyxVQUFULENBQW9CLFdBQVcsQ0FBWCxDQUFwQixFQUFtQyxXQUFXLENBQVgsQ0FBbkMsRUFBa0QsV0FBVyxDQUFYLENBQWxELEVBQWlFLFdBQVcsQ0FBWCxDQUFqRTtBQUNyRCxpQkFBSyxHQUFMLENBQVMsS0FBVCxDQUFlLEtBQUssR0FBTCxDQUFTLGdCQUF4QjtBQUNIO0FBbkJGLEtBbEltQixFQXNKbkI7QUFDQyxhQUFLLG9CQUROOztBQUlDOzs7OztBQUtBLGVBQU8sU0FBUyxrQkFBVCxDQUE0QixPQUE1QixFQUFxQyxJQUFyQyxFQUEyQztBQUM5QyxnQkFBSSxTQUFTLFNBQVQsSUFBc0IsU0FBUyxJQUFuQyxFQUF5QztBQUNyQyxvQkFBSSxRQUFRLElBQVIsS0FBaUIsaUJBQXJCLEVBQXdDO0FBQ3BDLHlCQUFLLEdBQUwsQ0FBUyx1QkFBVCxDQUFpQyxRQUFRLFFBQVIsQ0FBaUIsQ0FBakIsQ0FBakM7QUFDQSx5QkFBSyxHQUFMLENBQVMsVUFBVCxDQUFvQixLQUFLLEdBQUwsQ0FBUyxZQUE3QixFQUEyQyxLQUFLLFdBQWhEO0FBQ0EseUJBQUssR0FBTCxDQUFTLG1CQUFULENBQTZCLFFBQVEsUUFBUixDQUFpQixDQUFqQixDQUE3QixFQUFrRCxDQUFsRCxFQUFxRCxLQUFLLEdBQUwsQ0FBUyxLQUE5RCxFQUFxRSxLQUFyRSxFQUE0RSxDQUE1RSxFQUErRSxDQUEvRTtBQUNILGlCQUpELE1BSU8sSUFBSSxRQUFRLElBQVIsS0FBaUIsZ0JBQXJCLEVBQXVDO0FBQzFDLHlCQUFLLEdBQUwsQ0FBUyx1QkFBVCxDQUFpQyxRQUFRLFFBQVIsQ0FBaUIsQ0FBakIsQ0FBakM7QUFDQSx5QkFBSyxHQUFMLENBQVMsVUFBVCxDQUFvQixLQUFLLEdBQUwsQ0FBUyxZQUE3QixFQUEyQyxLQUFLLFdBQWhEO0FBQ0EseUJBQUssR0FBTCxDQUFTLG1CQUFULENBQTZCLFFBQVEsUUFBUixDQUFpQixDQUFqQixDQUE3QixFQUFrRCxDQUFsRCxFQUFxRCxLQUFLLEdBQUwsQ0FBUyxLQUE5RCxFQUFxRSxLQUFyRSxFQUE0RSxDQUE1RSxFQUErRSxDQUEvRTtBQUNIO0FBQ0osYUFWRCxNQVVPLEtBQUssR0FBTCxDQUFTLHdCQUFULENBQWtDLFFBQVEsUUFBUixDQUFpQixDQUFqQixDQUFsQztBQUNWO0FBckJGLEtBdEptQixFQTRLbkI7QUFDQyxhQUFLLGtCQUROOztBQUlDOzs7Ozs7QUFNQSxlQUFPLFNBQVMsZ0JBQVQsQ0FBMEIsWUFBMUIsRUFBd0MsT0FBeEMsRUFBaUQsSUFBakQsRUFBdUQ7QUFDMUQsZ0JBQUksS0FBSyxtQkFBTCxHQUEyQixFQUEvQixFQUFtQyxLQUFLLEdBQUwsQ0FBUyxhQUFULENBQXVCLEtBQUssR0FBTCxDQUFTLFlBQVksS0FBSyxtQkFBMUIsQ0FBdkIsRUFBbkMsS0FBK0csS0FBSyxHQUFMLENBQVMsYUFBVCxDQUF1QixLQUFLLEdBQUwsQ0FBUyxXQUFULENBQXZCOztBQUUvRyxnQkFBSSxTQUFTLFNBQVQsSUFBc0IsU0FBUyxJQUFuQyxFQUF5QztBQUNyQyxxQkFBSyxHQUFMLENBQVMsV0FBVCxDQUFxQixLQUFLLEdBQUwsQ0FBUyxVQUE5QixFQUEwQyxLQUFLLFdBQS9DOztBQUVBLG9CQUFJLEtBQUssWUFBTCxLQUFzQixDQUExQixFQUE2QjtBQUN6Qix5QkFBSyxZQUFMLEdBQW9CLEtBQUssQ0FBekI7QUFDQSx5QkFBSyxHQUFMLENBQVMsU0FBVCxDQUFtQixZQUFuQixFQUFpQyxLQUFLLFlBQXRDO0FBQ0g7QUFDSixhQVBELE1BT08sS0FBSyxHQUFMLENBQVMsV0FBVCxDQUFxQixLQUFLLEdBQUwsQ0FBUyxVQUE5QixFQUEwQyxLQUFLLGNBQS9DO0FBQ1AsaUJBQUssR0FBTCxDQUFTLFNBQVQsQ0FBbUIsUUFBUSxRQUFSLENBQWlCLENBQWpCLENBQW5CLEVBQXdDLEtBQUssbUJBQTdDOztBQUVBLGlCQUFLLG1CQUFMO0FBQ0g7QUF4QkYsS0E1S21CLEVBcU1uQjtBQUNDLGFBQUssa0JBRE47O0FBSUM7Ozs7O0FBS0EsZUFBTyxTQUFTLGdCQUFULENBQTBCLE9BQTFCLEVBQW1DLElBQW5DLEVBQXlDO0FBQzVDLGdCQUFJLFNBQVMsU0FBVCxJQUFzQixTQUFTLElBQW5DLEVBQXlDO0FBQ3JDLG9CQUFJLFFBQVEsSUFBUixLQUFpQixPQUFyQixFQUE4QjtBQUMxQix3QkFBSSxLQUFLLFdBQUwsS0FBcUIsS0FBekIsRUFBZ0MsS0FBSyxHQUFMLENBQVMsVUFBVCxDQUFvQixRQUFRLFFBQVIsQ0FBaUIsQ0FBakIsQ0FBcEIsRUFBeUMsSUFBekMsRUFBaEMsS0FBb0YsS0FBSyxHQUFMLENBQVMsU0FBVCxDQUFtQixRQUFRLFFBQVIsQ0FBaUIsQ0FBakIsQ0FBbkIsRUFBd0MsSUFBeEM7QUFDdkYsaUJBRkQsTUFFTyxJQUFJLFFBQVEsSUFBUixLQUFpQixRQUFyQixFQUErQixLQUFLLEdBQUwsQ0FBUyxTQUFULENBQW1CLFFBQVEsUUFBUixDQUFpQixDQUFqQixDQUFuQixFQUF3QyxLQUFLLENBQUwsQ0FBeEMsRUFBaUQsS0FBSyxDQUFMLENBQWpELEVBQTBELEtBQUssQ0FBTCxDQUExRCxFQUFtRSxLQUFLLENBQUwsQ0FBbkUsRUFBL0IsS0FBZ0gsSUFBSSxRQUFRLElBQVIsS0FBaUIsTUFBckIsRUFBNkIsS0FBSyxHQUFMLENBQVMsZ0JBQVQsQ0FBMEIsUUFBUSxRQUFSLENBQWlCLENBQWpCLENBQTFCLEVBQStDLEtBQS9DLEVBQXNELElBQXREO0FBQ3ZKO0FBQ0o7QUFmRixLQXJNbUIsRUFxTm5CO0FBQ0MsYUFBSyxXQUROOztBQUlDOzs7Ozs7QUFNQSxlQUFPLFNBQVMsU0FBVCxDQUFtQixjQUFuQixFQUFtQyxPQUFuQyxFQUE0QyxRQUE1QyxFQUFzRDtBQUN6RCxvQkFBUSxRQUFRLFlBQWhCO0FBQ0kscUJBQUssV0FBTDtBQUNJLHlCQUFLLGtCQUFMLENBQXdCLE9BQXhCLEVBQWlDLFFBQWpDO0FBQ0E7QUFDSixxQkFBSyxTQUFMO0FBQ0kseUJBQUssZ0JBQUwsQ0FBc0IsZUFBZSxZQUFyQyxFQUFtRCxPQUFuRCxFQUE0RCxRQUE1RDtBQUNBO0FBQ0oscUJBQUssU0FBTDtBQUNJLHlCQUFLLGdCQUFMLENBQXNCLE9BQXRCLEVBQStCLFFBQS9CO0FBQ0E7QUFUUjtBQVdIO0FBdEJGLEtBck5tQixFQTRPbkI7QUFDQyxhQUFLLFFBRE47O0FBSUM7Ozs7O0FBS0EsZUFBTyxTQUFTLE1BQVQsQ0FBZ0IsY0FBaEIsRUFBZ0MsWUFBaEMsRUFBOEM7QUFDakQsZ0JBQUksbUJBQW1CLFNBQW5CLElBQWdDLG1CQUFtQixJQUF2RCxFQUE2RDtBQUN6RCxvQkFBSSxlQUFlLENBQWYsTUFBc0IsU0FBdEIsSUFBbUMsZUFBZSxDQUFmLE1BQXNCLElBQTdELEVBQW1FO0FBQy9ELHlCQUFLLEdBQUwsQ0FBUyxRQUFULENBQWtCLENBQWxCLEVBQXFCLENBQXJCLEVBQXdCLGVBQWUsQ0FBZixFQUFrQixDQUExQyxFQUE2QyxlQUFlLENBQWYsRUFBa0IsQ0FBL0Q7O0FBRUEseUJBQUssR0FBTCxDQUFTLGVBQVQsQ0FBeUIsS0FBSyxHQUFMLENBQVMsV0FBbEMsRUFBK0MsaUJBQWlCLElBQWpCLEdBQXdCLGVBQWUsQ0FBZixFQUFrQixXQUExQyxHQUF3RCxlQUFlLENBQWYsRUFBa0IsT0FBekg7QUFDQSx3QkFBSSxXQUFXLEVBQWY7QUFDQSx5QkFBSyxJQUFJLElBQUksQ0FBUixFQUFXLEtBQUssZUFBZSxNQUFwQyxFQUE0QyxJQUFJLEVBQWhELEVBQW9ELEdBQXBELEVBQXlEO0FBQ3JELDRCQUFJLGVBQWUsQ0FBZixNQUFzQixTQUF0QixJQUFtQyxlQUFlLENBQWYsTUFBc0IsSUFBN0QsRUFBbUU7QUFDL0QsZ0NBQUksSUFBSSxpQkFBaUIsSUFBakIsR0FBd0IsZUFBZSxDQUFmLEVBQWtCLGVBQTFDLEdBQTRELGVBQWUsQ0FBZixFQUFrQixXQUF0RjtBQUNBLGlDQUFLLEdBQUwsQ0FBUyxvQkFBVCxDQUE4QixLQUFLLEdBQUwsQ0FBUyxXQUF2QyxFQUFvRCxLQUFLLE9BQUwsQ0FBYSxvQkFBYixFQUFtQyxxQkFBcUIsQ0FBckIsR0FBeUIsUUFBNUQsQ0FBcEQsRUFBMkgsS0FBSyxHQUFMLENBQVMsVUFBcEksRUFBZ0osQ0FBaEosRUFBbUosQ0FBbko7QUFDQSxxQ0FBUyxDQUFULElBQWMsS0FBSyxPQUFMLENBQWEsb0JBQWIsRUFBbUMscUJBQXFCLENBQXJCLEdBQXlCLFFBQTVELENBQWQ7QUFDSCx5QkFKRCxNQUlPLFNBQVMsQ0FBVCxJQUFjLEtBQUssR0FBTCxDQUFTLE1BQVQsQ0FBZDtBQUNWO0FBQ0QseUJBQUssT0FBTCxDQUFhLG9CQUFiLEVBQW1DLGdCQUFuQyxDQUFvRCxRQUFwRDs7QUFFQSwyQkFBTyxLQUFLLHNCQUFMLEVBQVA7QUFDSCxpQkFmRCxNQWVPO0FBQ0gseUJBQUssR0FBTCxDQUFTLGVBQVQsQ0FBeUIsS0FBSyxHQUFMLENBQVMsV0FBbEMsRUFBK0MsSUFBL0M7QUFDQSwyQkFBTyxJQUFQO0FBQ0g7QUFDSixhQXBCRCxNQW9CTztBQUNILHFCQUFLLEdBQUwsQ0FBUyxlQUFULENBQXlCLEtBQUssR0FBTCxDQUFTLFdBQWxDLEVBQStDLElBQS9DO0FBQ0EsdUJBQU8sSUFBUDtBQUNIO0FBQ0o7QUFsQ0YsS0E1T21CLEVBK1FuQjtBQUNDLGFBQUssc0JBRE47O0FBSUM7Ozs7Ozs7QUFPQSxlQUFPLFNBQVMsb0JBQVQsQ0FBOEIsYUFBOUIsRUFBNkMsYUFBN0MsRUFBNEQsWUFBNUQsRUFBMEUsU0FBMUUsRUFBcUY7QUFDeEYsaUJBQUssWUFBTCxHQUFvQixDQUFwQjs7QUFFQSxpQkFBSyxHQUFMLENBQVMsVUFBVCxDQUFvQixjQUFjLE1BQWxDOztBQUVBLGdCQUFJLEtBQUssTUFBTCxDQUFZLGFBQVosRUFBMkIsWUFBM0IsTUFBNkMsSUFBakQsRUFBdUQ7QUFDbkQscUJBQUssbUJBQUwsR0FBMkIsQ0FBM0I7QUFDQSxxQkFBSyxJQUFJLEdBQVQsSUFBZ0IsY0FBYyxTQUE5QixFQUF5QztBQUNyQyx5QkFBSyxTQUFMLENBQWUsYUFBZixFQUE4QixjQUFjLFNBQWQsQ0FBd0IsR0FBeEIsQ0FBOUIsRUFBNEQsVUFBVSxHQUFWLENBQTVEO0FBQ0gsc0JBQUssR0FBTCxDQUFTLHVCQUFULENBQWlDLGNBQWMsY0FBL0M7QUFDRCxxQkFBSyxHQUFMLENBQVMsVUFBVCxDQUFvQixLQUFLLEdBQUwsQ0FBUyxZQUE3QixFQUEyQyxLQUFLLGlCQUFoRDtBQUNBLHFCQUFLLEdBQUwsQ0FBUyxtQkFBVCxDQUE2QixjQUFjLGNBQTNDLEVBQTJELENBQTNELEVBQThELEtBQUssR0FBTCxDQUFTLEtBQXZFLEVBQThFLEtBQTlFLEVBQXFGLENBQXJGLEVBQXdGLENBQXhGOztBQUVBLHFCQUFLLEdBQUwsQ0FBUyxVQUFULENBQW9CLEtBQUssR0FBTCxDQUFTLG9CQUE3QixFQUFtRCxLQUFLLGdCQUF4RDtBQUNBLHFCQUFLLEdBQUwsQ0FBUyxZQUFULENBQXNCLEtBQUssR0FBTCxDQUFTLFNBQS9CLEVBQTBDLENBQTFDLEVBQTZDLEtBQUssR0FBTCxDQUFTLGNBQXRELEVBQXNFLENBQXRFO0FBQ0g7QUFDSjtBQTNCRixLQS9RbUIsRUEyU25CO0FBQ0MsYUFBSyw4QkFETjs7QUFJQzs7Ozs7Ozs7O0FBU0EsZUFBTyxTQUFTLDRCQUFULENBQXNDLDRCQUF0QyxFQUFvRSxTQUFwRSxFQUErRSxRQUEvRSxFQUF5RixhQUF6RixFQUF3RyxZQUF4RyxFQUFzSCxTQUF0SCxFQUFpSTtBQUNwSSxpQkFBSyxZQUFMLEdBQW9CLENBQXBCOztBQUVBLGlCQUFLLEdBQUwsQ0FBUyxVQUFULENBQW9CLDZCQUE2QixxQkFBakQ7O0FBRUEsZ0JBQUksUUFBUSxhQUFhLFNBQWIsSUFBMEIsYUFBYSxJQUF2QyxHQUE4QyxRQUE5QyxHQUF5RCxDQUFyRTs7QUFFQSxnQkFBSSxLQUFLLE1BQUwsQ0FBWSxhQUFaLEVBQTJCLFlBQTNCLE1BQTZDLElBQWpELEVBQXVEO0FBQ25ELG9CQUFJLGNBQWMsU0FBZCxJQUEyQixjQUFjLElBQTdDLEVBQW1EO0FBQy9DLHlCQUFLLG1CQUFMLEdBQTJCLENBQTNCO0FBQ0EseUJBQUssSUFBSSxHQUFULElBQWdCLDZCQUE2QixnQkFBN0MsRUFBK0Q7QUFDM0QsNkJBQUssU0FBTCxDQUFlLDRCQUFmLEVBQTZDLDZCQUE2QixnQkFBN0IsQ0FBOEMsR0FBOUMsQ0FBN0MsRUFBaUcsVUFBVSxHQUFWLENBQWpHO0FBQ0gsMEJBQUssSUFBSSxJQUFULElBQWlCLDZCQUE2QixrQkFBOUMsRUFBa0U7QUFDL0QsNkJBQUssU0FBTCxDQUFlLDRCQUFmLEVBQTZDLDZCQUE2QixrQkFBN0IsQ0FBZ0QsSUFBaEQsQ0FBN0MsRUFBb0csVUFBVSxJQUFWLENBQXBHO0FBQ0gseUJBQUksVUFBVSxJQUFWLEtBQW1CLGNBQXZCLEVBQXVDO0FBQ3BDLDZCQUFLLEdBQUwsQ0FBUyxVQUFULENBQW9CLEtBQUssR0FBTCxDQUFTLG9CQUE3QixFQUFtRCxVQUFVLFdBQTdEO0FBQ0EsNkJBQUssR0FBTCxDQUFTLFlBQVQsQ0FBc0IsS0FBdEIsRUFBNkIsVUFBVSxNQUF2QyxFQUErQyxLQUFLLEdBQUwsQ0FBUyxjQUF4RCxFQUF3RSxDQUF4RTtBQUNILHFCQUhBLE1BR00sS0FBSyxHQUFMLENBQVMsVUFBVCxDQUFvQixLQUFwQixFQUEyQixDQUEzQixFQUE4QixVQUFVLE1BQXhDO0FBQ1Y7QUFDSjtBQUNKO0FBakNGLEtBM1NtQixFQTZVbkI7QUFDQyxhQUFLLFlBRE47O0FBSUM7Ozs7O0FBS0EsZUFBTyxTQUFTLFVBQVQsQ0FBb0IsTUFBcEIsRUFBNEI7QUFDL0IsZ0JBQUksS0FBSyxDQUFMLEtBQVcsU0FBWCxJQUF3QixLQUFLLENBQUwsS0FBVyxJQUF2QyxFQUE2QztBQUN6QyxxQkFBSyxDQUFMLENBQU8sS0FBUCxHQUFlLE9BQU8sQ0FBdEI7QUFDQSxxQkFBSyxDQUFMLENBQU8sTUFBUCxHQUFnQixPQUFPLENBQXZCO0FBQ0g7O0FBRUQsaUJBQUssR0FBTCxDQUFTLFVBQVQsQ0FBb0IsS0FBSyxpQkFBekI7O0FBRUEsaUJBQUssR0FBTCxDQUFTLFFBQVQsQ0FBa0IsQ0FBbEIsRUFBcUIsQ0FBckIsRUFBd0IsT0FBTyxDQUEvQixFQUFrQyxPQUFPLENBQXpDO0FBQ0EsaUJBQUssR0FBTCxDQUFTLGVBQVQsQ0FBeUIsS0FBSyxHQUFMLENBQVMsV0FBbEMsRUFBK0MsT0FBTyxXQUF0RDtBQUNBLGlCQUFLLEdBQUwsQ0FBUyxvQkFBVCxDQUE4QixLQUFLLEdBQUwsQ0FBUyxXQUF2QyxFQUFvRCxLQUFLLE9BQUwsQ0FBYSxvQkFBYixFQUFtQyx5QkFBbkMsQ0FBcEQsRUFBbUgsS0FBSyxHQUFMLENBQVMsVUFBNUgsRUFBd0ksT0FBTyxlQUEvSSxFQUFnSyxDQUFoSzs7QUFFQSxnQkFBSSxXQUFXLENBQUMsS0FBSyxPQUFMLENBQWEsb0JBQWIsRUFBbUMseUJBQW5DLENBQUQsQ0FBZjtBQUNBLGlCQUFLLE9BQUwsQ0FBYSxvQkFBYixFQUFtQyxnQkFBbkMsQ0FBb0QsUUFBcEQ7O0FBRUEsaUJBQUssR0FBTCxDQUFTLGFBQVQsQ0FBdUIsS0FBSyxHQUFMLENBQVMsUUFBaEM7QUFDQSxpQkFBSyxHQUFMLENBQVMsV0FBVCxDQUFxQixLQUFLLEdBQUwsQ0FBUyxVQUE5QixFQUEwQyxPQUFPLFdBQWpEO0FBQ0EsaUJBQUssR0FBTCxDQUFTLFNBQVQsQ0FBbUIsS0FBSyxjQUF4QixFQUF3QyxDQUF4Qzs7QUFFQSxpQkFBSyxHQUFMLENBQVMsdUJBQVQsQ0FBaUMsS0FBSyxjQUF0QztBQUNBLGlCQUFLLEdBQUwsQ0FBUyxVQUFULENBQW9CLEtBQUssR0FBTCxDQUFTLFlBQTdCLEVBQTJDLEtBQUssaUJBQWhEO0FBQ0EsaUJBQUssR0FBTCxDQUFTLG1CQUFULENBQTZCLEtBQUssY0FBbEMsRUFBa0QsQ0FBbEQsRUFBcUQsT0FBTyxjQUE1RCxFQUE0RSxLQUE1RSxFQUFtRixDQUFuRixFQUFzRixDQUF0Rjs7QUFFQSxpQkFBSyxHQUFMLENBQVMsVUFBVCxDQUFvQixLQUFLLEdBQUwsQ0FBUyxvQkFBN0IsRUFBbUQsS0FBSyxnQkFBeEQ7QUFDQSxpQkFBSyxHQUFMLENBQVMsWUFBVCxDQUFzQixLQUFLLEdBQUwsQ0FBUyxTQUEvQixFQUEwQyxDQUExQyxFQUE2QyxLQUFLLEdBQUwsQ0FBUyxjQUF0RCxFQUFzRSxDQUF0RTs7QUFFQSxnQkFBSSxPQUFPLGFBQVAsS0FBeUIsU0FBekIsSUFBc0MsT0FBTyxhQUFQLEtBQXlCLElBQW5FLEVBQXlFLE9BQU8sYUFBUCxHQUF1QixJQUFJLFlBQUosQ0FBaUIsT0FBTyxDQUFQLEdBQVcsT0FBTyxDQUFsQixHQUFzQixDQUF2QyxDQUF2QjtBQUN6RSxpQkFBSyxHQUFMLENBQVMsVUFBVCxDQUFvQixDQUFwQixFQUF1QixDQUF2QixFQUEwQixPQUFPLENBQWpDLEVBQW9DLE9BQU8sQ0FBM0MsRUFBOEMsS0FBSyxHQUFMLENBQVMsSUFBdkQsRUFBNkQsS0FBSyxHQUFMLENBQVMsS0FBdEUsRUFBNkUsT0FBTyxhQUFwRjs7QUFFQSxnQkFBSSxPQUFPLElBQVAsS0FBZ0IsT0FBcEIsRUFBNkI7QUFDekIsb0JBQUksS0FBSyxJQUFJLFlBQUosQ0FBaUIsT0FBTyxhQUFQLENBQXFCLE1BQXJCLEdBQThCLENBQS9DLENBQVQ7QUFDQSxxQkFBSyxJQUFJLElBQUksQ0FBUixFQUFXLEtBQUssT0FBTyxhQUFQLENBQXFCLE1BQXJCLEdBQThCLENBQW5ELEVBQXNELElBQUksRUFBMUQsRUFBOEQsR0FBOUQsRUFBbUU7QUFDL0QsdUJBQUcsQ0FBSCxJQUFRLE9BQU8sYUFBUCxDQUFxQixJQUFJLENBQXpCLENBQVI7QUFDSCx3QkFBTyxhQUFQLEdBQXVCLEVBQXZCO0FBQ0o7O0FBRUQsbUJBQU8sT0FBTyxhQUFkO0FBQ0g7QUE5Q0YsS0E3VW1CLENBQXRCLEVBNFhJLENBQUM7QUFDRCxhQUFLLGdDQURKOztBQUlEOzs7OztBQUtBLGVBQU8sU0FBUyw4QkFBVCxDQUF3QyxNQUF4QyxFQUFnRDtBQUNuRCxtQkFBTyxPQUFPLFdBQWQ7QUFDSDtBQVhBLEtBQUQsQ0E1WEo7O0FBMFlBLFdBQU8sT0FBUDtBQUNILENBL2UrQixFQUFoQzs7QUFpZkEsT0FBTyxPQUFQLEdBQWlCLE9BQWpCO0FBQ0EsT0FBTyxPQUFQLENBQWUsT0FBZixHQUF5QixPQUF6Qjs7Ozs7O0FDaGlCQTs7QUFFQSxPQUFPLGNBQVAsQ0FBc0IsT0FBdEIsRUFBK0IsWUFBL0IsRUFBNkM7QUFDekMsV0FBTztBQURrQyxDQUE3Qzs7QUFJQSxJQUFJLGVBQWUsWUFBWTtBQUFFLGFBQVMsZ0JBQVQsQ0FBMEIsTUFBMUIsRUFBa0MsS0FBbEMsRUFBeUM7QUFBRSxhQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksTUFBTSxNQUExQixFQUFrQyxHQUFsQyxFQUF1QztBQUFFLGdCQUFJLGFBQWEsTUFBTSxDQUFOLENBQWpCLENBQTJCLFdBQVcsVUFBWCxHQUF3QixXQUFXLFVBQVgsSUFBeUIsS0FBakQsQ0FBd0QsV0FBVyxZQUFYLEdBQTBCLElBQTFCLENBQWdDLElBQUksV0FBVyxVQUFmLEVBQTJCLFdBQVcsUUFBWCxHQUFzQixJQUF0QixDQUE0QixPQUFPLGNBQVAsQ0FBc0IsTUFBdEIsRUFBOEIsV0FBVyxHQUF6QyxFQUE4QyxVQUE5QztBQUE0RDtBQUFFLEtBQUMsT0FBTyxVQUFVLFdBQVYsRUFBdUIsVUFBdkIsRUFBbUMsV0FBbkMsRUFBZ0Q7QUFBRSxZQUFJLFVBQUosRUFBZ0IsaUJBQWlCLFlBQVksU0FBN0IsRUFBd0MsVUFBeEMsRUFBcUQsSUFBSSxXQUFKLEVBQWlCLGlCQUFpQixXQUFqQixFQUE4QixXQUE5QixFQUE0QyxPQUFPLFdBQVA7QUFBcUIsS0FBaE47QUFBbU4sQ0FBOWhCLEVBQW5COztBQUVBLFNBQVMsZUFBVCxDQUF5QixRQUF6QixFQUFtQyxXQUFuQyxFQUFnRDtBQUFFLFFBQUksRUFBRSxvQkFBb0IsV0FBdEIsQ0FBSixFQUF3QztBQUFFLGNBQU0sSUFBSSxTQUFKLENBQWMsbUNBQWQsQ0FBTjtBQUEyRDtBQUFFOztBQUV6Sjs7Ozs7Ozs7QUFRQSxJQUFJLGdCQUFnQixRQUFRLGFBQVIsR0FBd0IsWUFBWTtBQUNwRCxhQUFTLGFBQVQsQ0FBdUIsRUFBdkIsRUFBMkIsSUFBM0IsRUFBaUMsTUFBakMsRUFBeUMsSUFBekMsRUFBK0M7QUFDM0Msd0JBQWdCLElBQWhCLEVBQXNCLGFBQXRCOztBQUVBLGFBQUssR0FBTCxHQUFXLEVBQVg7O0FBRUEsYUFBSyxJQUFMLEdBQVksU0FBUyxTQUFULElBQXNCLFNBQVMsSUFBL0IsR0FBc0MsSUFBdEMsR0FBNkMsT0FBekQ7QUFDQSxhQUFLLGNBQUwsR0FBc0IsS0FBSyxHQUFMLENBQVMsS0FBL0I7O0FBRUEsYUFBSyxNQUFMLEdBQWMsV0FBVyxTQUFYLElBQXdCLFdBQVcsSUFBbkMsR0FBMEMsTUFBMUMsR0FBbUQsSUFBakU7QUFDQSxhQUFLLElBQUwsR0FBWSxTQUFTLFNBQVQsSUFBc0IsU0FBUyxJQUEvQixHQUFzQyxJQUF0QyxHQUE2QyxTQUF6RDs7QUFFQSxhQUFLLENBQUwsR0FBUyxJQUFUO0FBQ0EsYUFBSyxDQUFMLEdBQVMsSUFBVDs7QUFFQSxhQUFLLFdBQUwsR0FBbUIsSUFBbkI7QUFDQSxhQUFLLGVBQUwsR0FBdUIsSUFBdkI7QUFDQSxhQUFLLFdBQUwsR0FBbUIsSUFBbkI7O0FBRUEsYUFBSyxPQUFMLEdBQWUsSUFBZjtBQUNBLGFBQUssWUFBTCxHQUFvQixJQUFwQjtBQUNBLGFBQUssV0FBTCxHQUFtQixJQUFuQjtBQUNBLGFBQUssZ0JBQUwsR0FBd0IsSUFBeEI7O0FBRUEsWUFBSSxLQUFLLElBQUwsS0FBYyxTQUFsQixFQUE2QjtBQUN6QixpQkFBSyxXQUFMLEdBQW1CLEtBQUssR0FBTCxDQUFTLGFBQVQsRUFBbkI7QUFDQSxpQkFBSyxlQUFMLEdBQXVCLEtBQUssR0FBTCxDQUFTLGFBQVQsRUFBdkI7QUFDSDtBQUNELFlBQUksS0FBSyxJQUFMLEtBQWMsU0FBZCxJQUEyQixLQUFLLElBQUwsS0FBYyxXQUF6QyxJQUF3RCxLQUFLLElBQUwsS0FBYyxjQUExRSxFQUEwRjtBQUN0RixpQkFBSyxXQUFMLEdBQW1CLEtBQUssR0FBTCxDQUFTLFlBQVQsRUFBbkI7QUFDSDtBQUNKOztBQUVEOzs7O0FBS0EsaUJBQWEsYUFBYixFQUE0QixDQUFDO0FBQ3pCLGFBQUssa0NBRG9CO0FBRXpCLGVBQU8sU0FBUyxnQ0FBVCxHQUE0QztBQUMvQyxnQkFBSSwwQkFBMEIsWUFBWTtBQUN0QyxvQkFBSSxVQUFVLEtBQUssR0FBTCxDQUFTLGtCQUFULEVBQWQ7QUFDQSxxQkFBSyxHQUFMLENBQVMsZ0JBQVQsQ0FBMEIsS0FBSyxHQUFMLENBQVMsWUFBbkMsRUFBaUQsT0FBakQ7QUFDQSxxQkFBSyxHQUFMLENBQVMsbUJBQVQsQ0FBNkIsS0FBSyxHQUFMLENBQVMsWUFBdEMsRUFBb0QsS0FBSyxHQUFMLENBQVMsaUJBQTdELEVBQWdGLEtBQUssQ0FBckYsRUFBd0YsS0FBSyxDQUE3RjtBQUNBLHFCQUFLLEdBQUwsQ0FBUyxnQkFBVCxDQUEwQixLQUFLLEdBQUwsQ0FBUyxZQUFuQyxFQUFpRCxJQUFqRDtBQUNBLHVCQUFPLE9BQVA7QUFDSCxhQU42QixDQU01QixJQU40QixDQU12QixJQU51QixDQUE5Qjs7QUFRQSxnQkFBSSxLQUFLLE9BQUwsSUFBZ0IsSUFBcEIsRUFBMEI7QUFDdEIscUJBQUssR0FBTCxDQUFTLGlCQUFULENBQTJCLEtBQUssT0FBaEM7QUFDQSxxQkFBSyxHQUFMLENBQVMsaUJBQVQsQ0FBMkIsS0FBSyxXQUFoQzs7QUFFQSxxQkFBSyxHQUFMLENBQVMsa0JBQVQsQ0FBNEIsS0FBSyxZQUFqQztBQUNBLHFCQUFLLEdBQUwsQ0FBUyxrQkFBVCxDQUE0QixLQUFLLGdCQUFqQztBQUNIO0FBQ0QsaUJBQUssT0FBTCxHQUFlLEtBQUssR0FBTCxDQUFTLGlCQUFULEVBQWY7QUFDQSxpQkFBSyxZQUFMLEdBQW9CLHlCQUFwQjtBQUNBLGlCQUFLLEdBQUwsQ0FBUyxlQUFULENBQXlCLEtBQUssR0FBTCxDQUFTLFdBQWxDLEVBQStDLEtBQUssT0FBcEQ7QUFDQSxpQkFBSyxHQUFMLENBQVMsdUJBQVQsQ0FBaUMsS0FBSyxHQUFMLENBQVMsV0FBMUMsRUFBdUQsS0FBSyxHQUFMLENBQVMsZ0JBQWhFLEVBQWtGLEtBQUssR0FBTCxDQUFTLFlBQTNGLEVBQXlHLEtBQUssWUFBOUc7O0FBRUEsaUJBQUssV0FBTCxHQUFtQixLQUFLLEdBQUwsQ0FBUyxpQkFBVCxFQUFuQjtBQUNBLGlCQUFLLGdCQUFMLEdBQXdCLHlCQUF4QjtBQUNBLGlCQUFLLEdBQUwsQ0FBUyxlQUFULENBQXlCLEtBQUssR0FBTCxDQUFTLFdBQWxDLEVBQStDLEtBQUssV0FBcEQ7QUFDQSxpQkFBSyxHQUFMLENBQVMsdUJBQVQsQ0FBaUMsS0FBSyxHQUFMLENBQVMsV0FBMUMsRUFBdUQsS0FBSyxHQUFMLENBQVMsZ0JBQWhFLEVBQWtGLEtBQUssR0FBTCxDQUFTLFlBQTNGLEVBQXlHLEtBQUssZ0JBQTlHO0FBQ0g7QUEzQndCLEtBQUQsRUE0QnpCO0FBQ0MsYUFBSyx5QkFETjs7QUFJQzs7Ozs7QUFLQSxlQUFPLFNBQVMsdUJBQVQsQ0FBaUMsR0FBakMsRUFBc0MsSUFBdEMsRUFBNEM7QUFDL0MsZ0JBQUksS0FBSyxVQUFVLEdBQVYsRUFBZSxJQUFmLEVBQXFCO0FBQzFCLG9CQUFJLFNBQVMsS0FBVCxJQUFrQixTQUFTLFNBQTNCLElBQXdDLFNBQVMsSUFBckQsRUFBMkQsS0FBSyxHQUFMLENBQVMsV0FBVCxDQUFxQixLQUFLLEdBQUwsQ0FBUyxtQkFBOUIsRUFBbUQsS0FBbkQsRUFBM0QsS0FBMEgsS0FBSyxHQUFMLENBQVMsV0FBVCxDQUFxQixLQUFLLEdBQUwsQ0FBUyxtQkFBOUIsRUFBbUQsSUFBbkQ7O0FBRTFILHFCQUFLLEdBQUwsQ0FBUyxXQUFULENBQXFCLEtBQUssR0FBTCxDQUFTLDhCQUE5QixFQUE4RCxLQUE5RDtBQUNBLHFCQUFLLEdBQUwsQ0FBUyxXQUFULENBQXFCLEtBQUssR0FBTCxDQUFTLFVBQTlCLEVBQTBDLEdBQTFDO0FBQ0gsYUFMUSxDQUtQLElBTE8sQ0FLRixJQUxFLENBQVQ7O0FBT0EsZ0JBQUksY0FBYyxVQUFVLEdBQVYsRUFBZTtBQUM3QixvQkFBSSxlQUFlLGdCQUFuQixFQUFxQztBQUNqQztBQUNBLHdCQUFJLEtBQUssSUFBTCxLQUFjLFFBQWxCLEVBQTRCLEtBQUssR0FBTCxDQUFTLFVBQVQsQ0FBb0IsS0FBSyxHQUFMLENBQVMsVUFBN0IsRUFBeUMsQ0FBekMsRUFBNEMsS0FBSyxHQUFMLENBQVMsSUFBckQsRUFBMkQsS0FBSyxHQUFMLENBQVMsSUFBcEUsRUFBMEUsS0FBSyxjQUEvRSxFQUErRixHQUEvRjtBQUMvQixpQkFIRCxNQUdPO0FBQ0g7QUFDQSx5QkFBSyxHQUFMLENBQVMsVUFBVCxDQUFvQixLQUFLLEdBQUwsQ0FBUyxVQUE3QixFQUF5QyxDQUF6QyxFQUE0QyxLQUFLLEdBQUwsQ0FBUyxJQUFyRCxFQUEyRCxLQUFLLENBQWhFLEVBQW1FLEtBQUssQ0FBeEUsRUFBMkUsQ0FBM0UsRUFBOEUsS0FBSyxHQUFMLENBQVMsSUFBdkYsRUFBNkYsS0FBSyxjQUFsRyxFQUFrSCxHQUFsSDtBQUNIO0FBQ0osYUFSaUIsQ0FRaEIsSUFSZ0IsQ0FRWCxJQVJXLENBQWxCOztBQVVBLGdCQUFJLEtBQUssWUFBWTtBQUNqQixxQkFBSyxHQUFMLENBQVMsYUFBVCxDQUF1QixLQUFLLEdBQUwsQ0FBUyxVQUFoQyxFQUE0QyxLQUFLLEdBQUwsQ0FBUyxrQkFBckQsRUFBeUUsS0FBSyxHQUFMLENBQVMsT0FBbEY7QUFDQSxxQkFBSyxHQUFMLENBQVMsYUFBVCxDQUF1QixLQUFLLEdBQUwsQ0FBUyxVQUFoQyxFQUE0QyxLQUFLLEdBQUwsQ0FBUyxrQkFBckQsRUFBeUUsS0FBSyxHQUFMLENBQVMsT0FBbEY7QUFDQSxxQkFBSyxHQUFMLENBQVMsYUFBVCxDQUF1QixLQUFLLEdBQUwsQ0FBUyxVQUFoQyxFQUE0QyxLQUFLLEdBQUwsQ0FBUyxjQUFyRCxFQUFxRSxLQUFLLEdBQUwsQ0FBUyxhQUE5RTtBQUNBLHFCQUFLLEdBQUwsQ0FBUyxhQUFULENBQXVCLEtBQUssR0FBTCxDQUFTLFVBQWhDLEVBQTRDLEtBQUssR0FBTCxDQUFTLGNBQXJELEVBQXFFLEtBQUssR0FBTCxDQUFTLGFBQTlFOztBQUVBOzs7OztBQUtILGFBWFEsQ0FXUCxJQVhPLENBV0YsSUFYRSxDQUFUOztBQWFBLGdCQUFJLGVBQWUsWUFBbkIsRUFBaUM7QUFDN0IscUJBQUssV0FBTCxHQUFtQixHQUFuQjtBQUNBLHFCQUFLLGVBQUwsR0FBdUIsR0FBdkI7QUFDSCxhQUhELE1BR087QUFDSCxtQkFBRyxLQUFLLFdBQVIsRUFBcUIsSUFBckI7QUFDQSw0QkFBWSxHQUFaO0FBQ0E7O0FBRUEsbUJBQUcsS0FBSyxlQUFSLEVBQXlCLElBQXpCO0FBQ0EsNEJBQVksR0FBWjtBQUNBO0FBQ0g7O0FBRUQsaUJBQUssR0FBTCxDQUFTLFdBQVQsQ0FBcUIsS0FBSyxHQUFMLENBQVMsVUFBOUIsRUFBMEMsSUFBMUM7QUFDSDtBQXRERixLQTVCeUIsRUFtRnpCO0FBQ0MsYUFBSyxhQUROOztBQUlDOzs7Ozs7QUFNQSxlQUFPLFNBQVMsV0FBVCxDQUFxQixHQUFyQixFQUEwQixJQUExQixFQUFnQyxrQkFBaEMsRUFBb0Q7QUFDdkQsZ0JBQUksYUFBYSxVQUFVLEdBQVYsRUFBZTtBQUM1QixvQkFBSSxFQUFFLGVBQWUsZ0JBQWpCLENBQUosRUFBd0M7QUFDcEMsd0JBQUksS0FBSyxNQUFMLENBQVksV0FBWixLQUE0QixLQUFoQyxFQUF1QztBQUNuQyw2QkFBSyxNQUFMLEdBQWMsS0FBSyxNQUFMLENBQVksQ0FBWixJQUFpQixLQUFLLE1BQUwsQ0FBWSxDQUFaLENBQS9CO0FBQ0EsNkJBQUssQ0FBTCxHQUFTLEtBQUssTUFBTCxDQUFZLENBQVosQ0FBVDtBQUNBLDZCQUFLLENBQUwsR0FBUyxLQUFLLE1BQUwsQ0FBWSxDQUFaLENBQVQ7QUFDSCxxQkFKRCxNQUlPO0FBQ0gsNkJBQUssQ0FBTCxHQUFTLEtBQUssSUFBTCxDQUFVLEtBQUssSUFBTCxDQUFVLEtBQUssTUFBZixDQUFWLENBQVQ7QUFDQSw2QkFBSyxDQUFMLEdBQVMsS0FBSyxDQUFkO0FBQ0g7O0FBRUQsd0JBQUksS0FBSyxJQUFMLEtBQWMsUUFBbEIsRUFBNEI7QUFDeEIsOEJBQU0sZUFBZSxZQUFmLEdBQThCLEdBQTlCLEdBQW9DLElBQUksWUFBSixDQUFpQixHQUFqQixDQUExQzs7QUFFQSw0QkFBSSxJQUFJLEtBQUssQ0FBTCxHQUFTLEtBQUssQ0FBZCxHQUFrQixDQUExQjtBQUNBLDRCQUFJLElBQUksTUFBSixLQUFlLENBQW5CLEVBQXNCO0FBQ2xCLGdDQUFJLE9BQU8sSUFBSSxZQUFKLENBQWlCLENBQWpCLENBQVg7QUFDQSxpQ0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLENBQXBCLEVBQXVCLEdBQXZCLEVBQTRCO0FBQ3hCLHFDQUFLLENBQUwsSUFBVSxJQUFJLENBQUosS0FBVSxJQUFWLEdBQWlCLElBQUksQ0FBSixDQUFqQixHQUEwQixHQUFwQztBQUNIO0FBQ0Qsa0NBQU0sSUFBTjtBQUNIO0FBQ0oscUJBWEQsTUFXTyxJQUFJLEtBQUssSUFBTCxLQUFjLE9BQWxCLEVBQTJCO0FBQzlCLDRCQUFJLEtBQUssS0FBSyxDQUFMLEdBQVMsS0FBSyxDQUFkLEdBQWtCLENBQTNCO0FBQ0EsNEJBQUksWUFBWSxJQUFJLFlBQUosQ0FBaUIsRUFBakIsQ0FBaEI7QUFDQSw2QkFBSyxJQUFJLEtBQUssQ0FBVCxFQUFZLElBQUksS0FBSyxDQUFMLEdBQVMsS0FBSyxDQUFuQyxFQUFzQyxLQUFLLENBQTNDLEVBQThDLElBQTlDLEVBQW9EO0FBQ2hELGdDQUFJLE1BQU0sS0FBSyxDQUFmO0FBQ0Esc0NBQVUsR0FBVixJQUFpQixJQUFJLEVBQUosS0FBVyxJQUFYLEdBQWtCLElBQUksRUFBSixDQUFsQixHQUE0QixHQUE3QztBQUNBLHNDQUFVLE1BQU0sQ0FBaEIsSUFBcUIsR0FBckI7QUFDQSxzQ0FBVSxNQUFNLENBQWhCLElBQXFCLEdBQXJCO0FBQ0Esc0NBQVUsTUFBTSxDQUFoQixJQUFxQixHQUFyQjtBQUNIO0FBQ0QsOEJBQU0sU0FBTjtBQUNIO0FBQ0o7QUFDRCx1QkFBTyxHQUFQO0FBQ0gsYUFwQ2dCLENBb0NmLElBcENlLENBb0NWLElBcENVLENBQWpCOztBQXNDQSxnQkFBSSx1QkFBdUIsU0FBdkIsSUFBb0MsdUJBQXVCLElBQS9ELEVBQXFFO0FBQ2pFLG9CQUFJLGVBQWUsZ0JBQW5CLEVBQXFDLEtBQUssTUFBTCxHQUFjLElBQUksS0FBSixHQUFZLElBQUksTUFBOUIsQ0FBckMsS0FBK0UsS0FBSyxNQUFMLEdBQWMsS0FBSyxJQUFMLEtBQWMsUUFBZCxHQUF5QixJQUFJLE1BQUosR0FBYSxDQUF0QyxHQUEwQyxJQUFJLE1BQTVEO0FBQ2xGLGFBRkQsTUFFTyxLQUFLLE1BQUwsR0FBYyxDQUFDLG1CQUFtQixDQUFuQixDQUFELEVBQXdCLG1CQUFtQixDQUFuQixDQUF4QixDQUFkOztBQUVQLGdCQUFJLEtBQUssSUFBTCxLQUFjLFNBQWxCLEVBQTZCO0FBQ3pCLHFCQUFLLHVCQUFMLENBQTZCLFdBQVcsR0FBWCxDQUE3QixFQUE4QyxJQUE5QztBQUNIO0FBQ0QsZ0JBQUksS0FBSyxJQUFMLEtBQWMsU0FBZCxJQUEyQixLQUFLLElBQUwsS0FBYyxXQUE3QyxFQUEwRDtBQUN0RCxxQkFBSyxHQUFMLENBQVMsVUFBVCxDQUFvQixLQUFLLEdBQUwsQ0FBUyxZQUE3QixFQUEyQyxLQUFLLFdBQWhEO0FBQ0EscUJBQUssR0FBTCxDQUFTLFVBQVQsQ0FBb0IsS0FBSyxHQUFMLENBQVMsWUFBN0IsRUFBMkMsZUFBZSxZQUFmLEdBQThCLEdBQTlCLEdBQW9DLElBQUksWUFBSixDQUFpQixHQUFqQixDQUEvRSxFQUFzRyxLQUFLLEdBQUwsQ0FBUyxXQUEvRztBQUNIO0FBQ0QsZ0JBQUksS0FBSyxJQUFMLEtBQWMsY0FBbEIsRUFBa0M7QUFDOUIscUJBQUssR0FBTCxDQUFTLFVBQVQsQ0FBb0IsS0FBSyxHQUFMLENBQVMsb0JBQTdCLEVBQW1ELEtBQUssV0FBeEQ7QUFDQSxxQkFBSyxHQUFMLENBQVMsVUFBVCxDQUFvQixLQUFLLEdBQUwsQ0FBUyxvQkFBN0IsRUFBbUQsSUFBSSxXQUFKLENBQWdCLEdBQWhCLENBQW5ELEVBQXlFLEtBQUssR0FBTCxDQUFTLFdBQWxGO0FBQ0g7O0FBRUQsaUJBQUssZ0NBQUw7QUFDSDtBQWxFRixLQW5GeUIsRUFzSnpCO0FBQ0MsYUFBSyxRQUROOztBQUlDOzs7QUFHQSxlQUFPLFNBQVMsTUFBVCxHQUFrQjtBQUNyQixnQkFBSSxLQUFLLElBQUwsS0FBYyxTQUFsQixFQUE2QjtBQUN6QixxQkFBSyxHQUFMLENBQVMsYUFBVCxDQUF1QixLQUFLLFdBQTVCO0FBQ0EscUJBQUssR0FBTCxDQUFTLGFBQVQsQ0FBdUIsS0FBSyxlQUE1QjtBQUNIOztBQUVELGdCQUFJLEtBQUssSUFBTCxLQUFjLFNBQWQsSUFBMkIsS0FBSyxJQUFMLEtBQWMsV0FBekMsSUFBd0QsS0FBSyxJQUFMLEtBQWMsY0FBMUUsRUFBMEY7QUFDdEYscUJBQUssR0FBTCxDQUFTLFlBQVQsQ0FBc0IsS0FBSyxXQUEzQjtBQUNIOztBQUVELGlCQUFLLEdBQUwsQ0FBUyxpQkFBVCxDQUEyQixLQUFLLE9BQWhDO0FBQ0EsaUJBQUssR0FBTCxDQUFTLGlCQUFULENBQTJCLEtBQUssV0FBaEM7O0FBRUEsaUJBQUssR0FBTCxDQUFTLGtCQUFULENBQTRCLEtBQUssWUFBakM7QUFDQSxpQkFBSyxHQUFMLENBQVMsa0JBQVQsQ0FBNEIsS0FBSyxnQkFBakM7QUFDSDtBQXRCRixLQXRKeUIsQ0FBNUI7O0FBK0tBLFdBQU8sYUFBUDtBQUNILENBdE4yQyxFQUE1Qzs7QUF3TkEsT0FBTyxhQUFQLEdBQXVCLGFBQXZCO0FBQ0EsT0FBTyxPQUFQLENBQWUsYUFBZixHQUErQixhQUEvQjs7Ozs7O0FDM09BOztBQUVBLE9BQU8sY0FBUCxDQUFzQixPQUF0QixFQUErQixZQUEvQixFQUE2QztBQUN6QyxXQUFPO0FBRGtDLENBQTdDO0FBR0EsUUFBUSxVQUFSLEdBQXFCLFNBQXJCOztBQUVBLElBQUksZUFBZSxZQUFZO0FBQUUsYUFBUyxnQkFBVCxDQUEwQixNQUExQixFQUFrQyxLQUFsQyxFQUF5QztBQUFFLGFBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxNQUFNLE1BQTFCLEVBQWtDLEdBQWxDLEVBQXVDO0FBQUUsZ0JBQUksYUFBYSxNQUFNLENBQU4sQ0FBakIsQ0FBMkIsV0FBVyxVQUFYLEdBQXdCLFdBQVcsVUFBWCxJQUF5QixLQUFqRCxDQUF3RCxXQUFXLFlBQVgsR0FBMEIsSUFBMUIsQ0FBZ0MsSUFBSSxXQUFXLFVBQWYsRUFBMkIsV0FBVyxRQUFYLEdBQXNCLElBQXRCLENBQTRCLE9BQU8sY0FBUCxDQUFzQixNQUF0QixFQUE4QixXQUFXLEdBQXpDLEVBQThDLFVBQTlDO0FBQTREO0FBQUUsS0FBQyxPQUFPLFVBQVUsV0FBVixFQUF1QixVQUF2QixFQUFtQyxXQUFuQyxFQUFnRDtBQUFFLFlBQUksVUFBSixFQUFnQixpQkFBaUIsWUFBWSxTQUE3QixFQUF3QyxVQUF4QyxFQUFxRCxJQUFJLFdBQUosRUFBaUIsaUJBQWlCLFdBQWpCLEVBQThCLFdBQTlCLEVBQTRDLE9BQU8sV0FBUDtBQUFxQixLQUFoTjtBQUFtTixDQUE5aEIsRUFBbkI7O0FBRUEsUUFBUSxNQUFSLEdBQWlCLE1BQWpCOztBQUVBLElBQUksV0FBVyxRQUFRLGlCQUFSLENBQWY7O0FBRUEsSUFBSSxnQkFBZ0IsUUFBUSxzQkFBUixDQUFwQjs7QUFFQSxTQUFTLGVBQVQsQ0FBeUIsUUFBekIsRUFBbUMsV0FBbkMsRUFBZ0Q7QUFBRSxRQUFJLEVBQUUsb0JBQW9CLFdBQXRCLENBQUosRUFBd0M7QUFBRSxjQUFNLElBQUksU0FBSixDQUFjLG1DQUFkLENBQU47QUFBMkQ7QUFBRTs7QUFFeko7Ozs7QUFJQSxJQUFJLGFBQWEsUUFBUSxVQUFSLEdBQXFCLFlBQVk7QUFDOUMsYUFBUyxVQUFULENBQW9CLE1BQXBCLEVBQTRCO0FBQ3hCLHdCQUFnQixJQUFoQixFQUFzQixVQUF0Qjs7QUFFQSxhQUFLLE9BQUwsR0FBZSxFQUFmO0FBQ0EsYUFBSyxzQkFBTCxHQUE4QixFQUE5QjtBQUNBLGFBQUssS0FBTCxHQUFhLEVBQWI7QUFDQSxhQUFLLFdBQUwsR0FBbUIsRUFBbkI7QUFDQSxhQUFLLFVBQUwsR0FBa0IsRUFBbEI7O0FBRUEsYUFBSyxRQUFMLEdBQWdCLElBQWhCO0FBQ0EsYUFBSyxHQUFMLEdBQVcsSUFBWDtBQUNIOztBQUVEOzs7OztBQU1BLGlCQUFhLFVBQWIsRUFBeUIsQ0FBQztBQUN0QixhQUFLLHVCQURpQjtBQUV0QixlQUFPLFNBQVMscUJBQVQsQ0FBK0IsTUFBL0IsRUFBdUMsSUFBdkMsRUFBNkM7QUFDaEQsZ0JBQUksZUFBZSxTQUFTLFlBQVQsQ0FBc0IsVUFBdEIsRUFBa0MsSUFBbEMsRUFBd0M7QUFDdkQsb0JBQUksUUFBUSxLQUFaO0FBQ0EscUJBQUssSUFBSSxHQUFULElBQWdCLElBQWhCLEVBQXNCO0FBQ2xCLHdCQUFJLFFBQVEsU0FBWixFQUF1QjtBQUNuQiw0QkFBSSxPQUFPLElBQUksS0FBSixDQUFVLEdBQVYsQ0FBWDtBQUNBLDRCQUFJLEtBQUssTUFBTCxHQUFjLENBQWxCLEVBQXFCO0FBQ2pCLGdDQUFJLFVBQVUsS0FBSyxDQUFMLENBQWQ7QUFDQSxnQ0FBSSxZQUFZLFVBQWhCLEVBQTRCO0FBQ3hCLHdDQUFRLElBQVI7QUFDQTtBQUNIO0FBQ0o7QUFDSjtBQUNKO0FBQ0QsdUJBQU8sS0FBUDtBQUNILGFBZkQ7O0FBaUJBLGdCQUFJLGtCQUFrQixFQUF0QjtBQUNBLGlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksT0FBTyxNQUEzQixFQUFtQyxHQUFuQyxFQUF3QztBQUNwQyxnQ0FBZ0IsQ0FBaEIsSUFBcUIsT0FBTyxDQUFQLEtBQWEsSUFBYixHQUFvQixhQUFhLE9BQU8sQ0FBUCxDQUFiLEVBQXdCLElBQXhCLENBQXBCLEdBQW9ELEtBQXpFO0FBQ0gsb0JBQU8sZUFBUDtBQUNKO0FBeEJxQixLQUFELEVBeUJ0QjtBQUNDLGFBQUssbUJBRE47O0FBSUM7Ozs7QUFJQSxlQUFPLFNBQVMsaUJBQVQsQ0FBMkIsTUFBM0IsRUFBbUMsTUFBbkMsRUFBMkM7QUFDOUMsZ0JBQUksWUFBWSxFQUFoQjtBQUNBLGdCQUFJLFVBQVUsT0FBTyxLQUFQLENBQWEsSUFBSSxNQUFKLENBQVcsYUFBWCxDQUFiLENBQWQ7QUFDQSxzQkFBVSxRQUFRLENBQVIsRUFBVyxPQUFYLENBQW1CLFNBQW5CLEVBQThCLEVBQTlCLENBQVYsQ0FIOEMsQ0FHRDtBQUM3QyxnQkFBSSxRQUFRLFFBQVEsS0FBUixDQUFjLElBQUksTUFBSixDQUFXLE1BQVgsQ0FBZCxDQUFaO0FBQ0EsZ0JBQUksU0FBUyxJQUFULElBQWlCLE1BQU0sTUFBTixJQUFnQixDQUFyQyxFQUF3QztBQUNwQztBQUNBLDBCQUFVLFFBQVEsS0FBUixDQUFjLEdBQWQsRUFBbUIsQ0FBbkIsRUFBc0IsS0FBdEIsQ0FBNEIsR0FBNUIsRUFBaUMsQ0FBakMsQ0FBVjtBQUNBLG9CQUFJLFVBQVUsRUFBZDtBQUFBLG9CQUNJLGNBQWMsQ0FEbEI7QUFFQSxxQkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLFFBQVEsTUFBNUIsRUFBb0MsR0FBcEMsRUFBeUM7QUFDckMsd0JBQUksUUFBUSxDQUFSLE1BQWUsR0FBZixJQUFzQixnQkFBZ0IsQ0FBMUMsRUFBNkM7QUFDekMsa0NBQVUsSUFBVixDQUFlLE9BQWY7QUFDQSxrQ0FBVSxFQUFWO0FBQ0gscUJBSEQsTUFHTyxXQUFXLFFBQVEsQ0FBUixDQUFYOztBQUVQLHdCQUFJLFFBQVEsQ0FBUixNQUFlLEdBQW5CLEVBQXdCO0FBQ3hCLHdCQUFJLFFBQVEsQ0FBUixNQUFlLEdBQW5CLEVBQXdCO0FBQzNCO0FBQ0QsMEJBQVUsSUFBVixDQUFlLE9BQWYsRUFkb0MsQ0FjWDtBQUM1QixhQWZELE1BZU87QUFDSCwwQkFBVSxJQUFWLENBQWUsUUFBUSxPQUFSLENBQWdCLE1BQWhCLEVBQXdCLEVBQXhCLENBQWY7O0FBRUosZ0JBQUksYUFBYSxFQUFqQjtBQUNBLGlCQUFLLElBQUksS0FBSyxDQUFkLEVBQWlCLEtBQUssT0FBTyxNQUE3QixFQUFxQyxJQUFyQyxFQUEyQztBQUN2QztBQUNBLG9CQUFJLFFBQVEsS0FBWjtBQUNBLHFCQUFLLElBQUksR0FBVCxJQUFnQixLQUFLLEtBQXJCLEVBQTRCO0FBQ3hCLHdCQUFJLFFBQVEsU0FBWixFQUF1QjtBQUNuQiw0QkFBSSxPQUFPLElBQUksS0FBSixDQUFVLEdBQVYsQ0FBWDs7QUFFQSw0QkFBSSxLQUFLLENBQUwsTUFBWSxPQUFPLEVBQVAsQ0FBaEIsRUFBNEI7QUFDeEIsZ0NBQUksS0FBSyxLQUFLLENBQUwsRUFBUSxLQUFSLENBQWMsSUFBSSxNQUFKLENBQVcsUUFBWCxFQUFxQixJQUFyQixDQUFkLENBQVQ7QUFDQSwwQ0FBYyxNQUFNLElBQU4sSUFBYyxHQUFHLE1BQUgsR0FBWSxDQUExQixHQUE4QixRQUFRLEVBQVIsR0FBYSxZQUFiLEdBQTRCLFVBQVUsRUFBVixDQUE1QixHQUE0QyxLQUExRSxHQUFrRixRQUFRLEVBQVIsR0FBYSxXQUFiLEdBQTJCLFVBQVUsRUFBVixDQUEzQixHQUEyQyxLQUEzSTs7QUFFQSxvQ0FBUSxJQUFSO0FBQ0E7QUFDSDtBQUNKO0FBQ0o7QUFDRCxvQkFBSSxVQUFVLEtBQWQsRUFBcUIsY0FBYyxRQUFRLEVBQVIsR0FBYSxZQUFiLEdBQTRCLFVBQVUsRUFBVixDQUE1QixHQUE0QyxLQUExRDtBQUN4QjtBQUNELG1CQUFPLFVBQVA7QUFDSDtBQW5ERixLQXpCc0IsRUE2RXRCO0FBQ0MsYUFBSyxXQUROOztBQUlDOzs7O0FBSUEsZUFBTyxTQUFTLFNBQVQsQ0FBbUIsVUFBbkIsRUFBK0I7QUFDbEMsZ0JBQUksT0FBTyxXQUFXLE1BQXRCO0FBQ0EsZ0JBQUksTUFBTSxLQUFLLENBQUwsQ0FBVjtBQUNBLGdCQUFJLFNBQVMsS0FBSyxDQUFMLGFBQW1CLEtBQW5CLEdBQTJCLEtBQUssQ0FBTCxDQUEzQixHQUFxQyxDQUFDLEtBQUssQ0FBTCxDQUFELENBQWxEO0FBQ0EsZ0JBQUksS0FBSyxLQUFLLENBQUwsQ0FBVDtBQUNBLGdCQUFJLEtBQUssS0FBSyxDQUFMLENBQVQ7O0FBRUEsZ0JBQUksU0FBUyxLQUFLLFFBQUwsQ0FBYyxZQUFkLEVBQWI7O0FBRUEsZ0JBQUksVUFBVSxFQUFkO0FBQ0EsaUJBQUssSUFBSSxHQUFULElBQWdCLEtBQUssS0FBckIsRUFBNEI7QUFDeEIsb0JBQUksT0FBTyxJQUFJLEtBQUosQ0FBVSxHQUFWLENBQVg7QUFDQSxvQkFBSSxVQUFVLEtBQUssQ0FBTCxDQUFkOztBQUVBO0FBQ0Esb0JBQUksWUFBWSxTQUFaLElBQXlCLFlBQVksSUFBekMsRUFBK0M7QUFDM0Msd0JBQUksVUFBVSxDQUFDLEtBQUssRUFBTixFQUFVLEtBQVYsQ0FBZ0IsSUFBSSxNQUFKLENBQVcsUUFBUSxPQUFSLENBQWdCLFFBQWhCLEVBQTBCLEVBQTFCLENBQVgsRUFBMEMsSUFBMUMsQ0FBaEIsQ0FBZDtBQUNBLHdCQUFJLFFBQVEsU0FBUixJQUFxQixXQUFXLElBQWhDLElBQXdDLFFBQVEsTUFBUixHQUFpQixDQUE3RCxFQUFnRTtBQUM1RCwrQkFBTyxTQUFQLENBQWlCLE9BQWpCLElBQTRCLEVBQTVCO0FBQ0EsZ0NBQVEsSUFBUixDQUFhLElBQUksT0FBSixDQUFZLFFBQVosRUFBc0IsSUFBdEIsRUFBNEIsT0FBNUIsQ0FBb0MsUUFBcEMsRUFBOEMsRUFBOUMsQ0FBYixFQUY0RCxDQUVLO0FBQ3BFO0FBQ0o7QUFDSjs7QUFFRCxpQkFBSyxlQUFlLFFBQVEsUUFBUixFQUFmLEdBQW9DLEtBQXBDLEdBQTRDLE9BQTVDLEdBQXNELEdBQXRELEdBQTRELHFCQUE1RCxHQUFvRixHQUFHLE9BQUgsQ0FBVyxhQUFYLEVBQTBCLEtBQUssaUJBQUwsQ0FBdUIsRUFBdkIsRUFBMkIsTUFBM0IsQ0FBMUIsQ0FBcEYsR0FBb0osR0FBeko7O0FBRUEsbUJBQU8sSUFBUCxHQUFjLFdBQVcsSUFBekI7QUFDQSxtQkFBTyxVQUFQLEdBQW9CLFdBQVcsVUFBWCxJQUF5QixJQUF6QixHQUFnQyxXQUFXLFVBQTNDLEdBQXdELEtBQTVFO0FBQ0EsbUJBQU8sZUFBUCxDQUF1QixFQUF2QixFQUEyQixFQUEzQjs7QUFFQSxtQkFBTyxNQUFQLEdBQWdCLE1BQWhCO0FBQ0EsbUJBQU8sZUFBUCxHQUF5QixLQUFLLHFCQUFMLENBQTJCLE1BQTNCLEVBQW1DLEtBQUssS0FBeEMsQ0FBekI7QUFDQSxtQkFBTyxPQUFQLEdBQWlCLElBQWpCO0FBQ0EsbUJBQU8sUUFBUCxHQUFrQixXQUFXLFFBQVgsSUFBdUIsSUFBdkIsR0FBOEIsV0FBVyxRQUF6QyxHQUFvRCxDQUF0RTtBQUNBLG1CQUFPLFNBQVAsR0FBbUIsV0FBVyxTQUFYLElBQXdCLElBQXhCLEdBQStCLFdBQVcsU0FBMUMsR0FBc0QsSUFBekU7QUFDQSxtQkFBTyxLQUFQLEdBQWUsV0FBVyxLQUFYLElBQW9CLElBQXBCLEdBQTJCLFdBQVcsS0FBdEMsR0FBOEMsS0FBN0Q7QUFDQSxtQkFBTyxhQUFQLEdBQXVCLFdBQVcsYUFBWCxJQUE0QixJQUE1QixHQUFtQyxXQUFXLGFBQTlDLEdBQThELFVBQXJGO0FBQ0EsbUJBQU8sWUFBUCxHQUFzQixXQUFXLFlBQVgsSUFBMkIsSUFBM0IsR0FBa0MsV0FBVyxZQUE3QyxHQUE0RCxXQUFsRjtBQUNBLG1CQUFPLFlBQVAsR0FBc0IsV0FBVyxZQUFYLElBQTJCLElBQTNCLEdBQWtDLFdBQVcsWUFBN0MsR0FBNEQscUJBQWxGOztBQUVBLGlCQUFLLE9BQUwsQ0FBYSxPQUFPLElBQVAsQ0FBWSxLQUFLLE9BQWpCLEVBQTBCLE1BQTFCLENBQWlDLFFBQWpDLEVBQWIsSUFBNEQsTUFBNUQ7QUFDSDtBQWpERixLQTdFc0IsRUErSHRCO0FBQ0MsYUFBSyxZQUROOztBQUlDOzs7O0FBSUEsZUFBTyxTQUFTLFVBQVQsQ0FBb0IsV0FBcEIsRUFBaUM7QUFDcEMsZ0JBQUksT0FBTyxZQUFZLE1BQXZCO0FBQ0EsZ0JBQUksU0FBUyxDQUFDLElBQUQsQ0FBYjtBQUNBLGdCQUFJLGNBQWMsS0FBSyxDQUF2QjtBQUNBLGdCQUFJLGNBQWMsS0FBSyxDQUF2QjtBQUNBLGdCQUFJLGdCQUFnQixLQUFLLENBQXpCO0FBQ0EsZ0JBQUksZ0JBQWdCLEtBQUssQ0FBekI7QUFDQSxnQkFBSSxLQUFLLE1BQUwsS0FBZ0IsQ0FBcEIsRUFBdUI7QUFDbkIseUJBQVMsS0FBSyxDQUFMLGFBQW1CLEtBQW5CLEdBQTJCLEtBQUssQ0FBTCxDQUEzQixHQUFxQyxDQUFDLEtBQUssQ0FBTCxDQUFELENBQTlDO0FBQ0EsOEJBQWMsS0FBSyxDQUFMLENBQWQ7QUFDQSw4QkFBYyxLQUFLLENBQUwsQ0FBZDtBQUNBLGdDQUFnQixLQUFLLENBQUwsQ0FBaEI7QUFDQSxnQ0FBZ0IsS0FBSyxDQUFMLENBQWhCO0FBQ0gsYUFORCxNQU1PO0FBQ0gsOEJBQWMsS0FBSyxDQUFMLENBQWQ7QUFDQSw4QkFBYyxLQUFLLENBQUwsQ0FBZDtBQUNBLGdDQUFnQixLQUFLLENBQUwsQ0FBaEI7QUFDQSxnQ0FBZ0IsS0FBSyxDQUFMLENBQWhCO0FBQ0g7O0FBRUQsZ0JBQUksWUFBWSxLQUFLLFFBQUwsQ0FBYywyQkFBZCxFQUFoQjs7QUFFQSxnQkFBSSxZQUFZLEVBQWhCO0FBQUEsZ0JBQ0ksWUFBWSxFQURoQjtBQUVBLGlCQUFLLElBQUksR0FBVCxJQUFnQixLQUFLLEtBQXJCLEVBQTRCO0FBQ3hCLG9CQUFJLE9BQU8sSUFBSSxLQUFKLENBQVUsR0FBVixDQUFYO0FBQ0Esb0JBQUksVUFBVSxLQUFLLENBQUwsQ0FBZDs7QUFFQTtBQUNBLG9CQUFJLFlBQVksU0FBWixJQUF5QixZQUFZLElBQXpDLEVBQStDO0FBQzNDLHdCQUFJLFVBQVUsQ0FBQyxjQUFjLFdBQWYsRUFBNEIsS0FBNUIsQ0FBa0MsSUFBSSxNQUFKLENBQVcsUUFBUSxPQUFSLENBQWdCLFFBQWhCLEVBQTBCLEVBQTFCLENBQVgsRUFBMEMsSUFBMUMsQ0FBbEMsQ0FBZDtBQUNBLHdCQUFJLFFBQVEsU0FBUixJQUFxQixXQUFXLElBQWhDLElBQXdDLFFBQVEsTUFBUixHQUFpQixDQUE3RCxFQUFnRTtBQUM1RCxrQ0FBVSxnQkFBVixDQUEyQixPQUEzQixJQUFzQyxFQUF0QztBQUNBLGtDQUFVLElBQVYsQ0FBZSxJQUFJLE9BQUosQ0FBWSxRQUFaLEVBQXNCLEVBQXRCLENBQWYsRUFGNEQsQ0FFakI7QUFDOUM7QUFDSjtBQUNKO0FBQ0QsaUJBQUssSUFBSSxJQUFULElBQWlCLEtBQUssS0FBdEIsRUFBNkI7QUFDekIsb0JBQUksUUFBUSxLQUFLLEtBQUwsQ0FBVyxHQUFYLENBQVo7QUFDQSxvQkFBSSxXQUFXLE1BQU0sQ0FBTixDQUFmOztBQUVBO0FBQ0Esb0JBQUksYUFBYSxTQUFiLElBQTBCLGFBQWEsSUFBM0MsRUFBaUQ7QUFDN0Msd0JBQUksV0FBVyxDQUFDLGdCQUFnQixhQUFqQixFQUFnQyxLQUFoQyxDQUFzQyxJQUFJLE1BQUosQ0FBVyxTQUFTLE9BQVQsQ0FBaUIsUUFBakIsRUFBMkIsRUFBM0IsQ0FBWCxFQUEyQyxJQUEzQyxDQUF0QyxDQUFmO0FBQ0Esd0JBQUksU0FBUyxTQUFULElBQXNCLFlBQVksSUFBbEMsSUFBMEMsU0FBUyxNQUFULEdBQWtCLENBQWhFLEVBQW1FO0FBQy9ELGtDQUFVLGtCQUFWLENBQTZCLFFBQTdCLElBQXlDLEVBQXpDO0FBQ0Esa0NBQVUsSUFBVixDQUFlLEtBQUssT0FBTCxDQUFhLFFBQWIsRUFBdUIsRUFBdkIsQ0FBZixFQUYrRCxDQUVuQjtBQUMvQztBQUNKO0FBQ0o7O0FBRUQsMEJBQWMsZUFBZSxVQUFVLFFBQVYsRUFBZixHQUFzQyxLQUF0QyxHQUE4QyxXQUE5QyxHQUE0RCxHQUExRTtBQUNBLDRCQUFnQixlQUFlLFVBQVUsUUFBVixFQUFmLEdBQXNDLEtBQXRDLEdBQThDLGNBQWMsT0FBZCxDQUFzQixhQUF0QixFQUFxQyxLQUFLLGlCQUFMLENBQXVCLGFBQXZCLEVBQXNDLE1BQXRDLENBQXJDLENBQTlDLEdBQW9JLEdBQXBKOztBQUVBLHNCQUFVLElBQVYsR0FBaUIsWUFBWSxJQUE3QjtBQUNBLHNCQUFVLFVBQVYsR0FBdUIsWUFBWSxVQUFaLElBQTBCLElBQTFCLEdBQWlDLFlBQVksVUFBN0MsR0FBMEQsS0FBakY7QUFDQSxzQkFBVSxlQUFWLENBQTBCLFdBQTFCLEVBQXVDLFdBQXZDO0FBQ0Esc0JBQVUsaUJBQVYsQ0FBNEIsYUFBNUIsRUFBMkMsYUFBM0M7O0FBRUEsc0JBQVUsTUFBVixHQUFtQixNQUFuQjtBQUNBLHNCQUFVLGVBQVYsR0FBNEIsS0FBSyxxQkFBTCxDQUEyQixNQUEzQixFQUFtQyxLQUFLLEtBQXhDLENBQTVCO0FBQ0Esc0JBQVUsT0FBVixHQUFvQixJQUFwQjtBQUNBLHNCQUFVLFFBQVYsR0FBcUIsWUFBWSxRQUFaLElBQXdCLElBQXhCLEdBQStCLFlBQVksUUFBM0MsR0FBc0QsQ0FBM0U7QUFDQSxzQkFBVSxTQUFWLEdBQXNCLFlBQVksU0FBWixJQUF5QixJQUF6QixHQUFnQyxZQUFZLFNBQTVDLEdBQXdELElBQTlFO0FBQ0Esc0JBQVUsS0FBVixHQUFrQixZQUFZLEtBQVosSUFBcUIsSUFBckIsR0FBNEIsWUFBWSxLQUF4QyxHQUFnRCxJQUFsRTtBQUNBLHNCQUFVLGFBQVYsR0FBMEIsWUFBWSxhQUFaLElBQTZCLElBQTdCLEdBQW9DLFlBQVksYUFBaEQsR0FBZ0UsVUFBMUY7QUFDQSxzQkFBVSxZQUFWLEdBQXlCLFlBQVksWUFBWixJQUE0QixJQUE1QixHQUFtQyxZQUFZLFlBQS9DLEdBQThELFdBQXZGO0FBQ0Esc0JBQVUsWUFBVixHQUF5QixZQUFZLFlBQVosSUFBNEIsSUFBNUIsR0FBbUMsWUFBWSxZQUEvQyxHQUE4RCxxQkFBdkY7O0FBRUEsaUJBQUssc0JBQUwsQ0FBNEIsT0FBTyxJQUFQLENBQVksS0FBSyxzQkFBakIsRUFBeUMsTUFBekMsQ0FBZ0QsUUFBaEQsRUFBNUIsSUFBMEYsU0FBMUY7QUFDSDtBQTlFRixLQS9Ic0IsRUE4TXRCO0FBQ0MsYUFBSyxVQUROOztBQUlDOzs7Ozs7O0FBT0EsZUFBTyxTQUFTLFFBQVQsQ0FBa0IsUUFBbEIsRUFBNEIsT0FBNUIsRUFBcUMsSUFBckMsRUFBMkM7QUFDOUMsZ0JBQUksV0FBVyxFQUFmO0FBQ0EsZ0JBQUksZUFBZSxLQUFuQjtBQUNBLGdCQUFJLGlCQUFpQixLQUFyQjs7QUFFQSxpQkFBSyxJQUFJLEdBQVQsSUFBZ0IsT0FBaEIsRUFBeUI7QUFDckIscUJBQUssSUFBSSxJQUFULElBQWlCLFFBQVEsR0FBUixFQUFhLFNBQTlCLEVBQXlDO0FBQ3JDLHdCQUFJLFdBQVcsUUFBUSxHQUFSLEVBQWEsU0FBYixDQUF1QixJQUF2QixDQUFmO0FBQ0Esd0JBQUksU0FBUyxRQUFiLEVBQXVCO0FBQ25CLGlDQUFTLElBQVQsQ0FBYyxRQUFRLEdBQVIsQ0FBZDtBQUNBO0FBQ0g7QUFDSjtBQUNKOztBQUVELGlCQUFLLElBQUksS0FBVCxJQUFrQixJQUFsQixFQUF3QjtBQUNwQixxQkFBSyxJQUFJLEtBQVQsSUFBa0IsS0FBSyxLQUFMLEVBQVksZ0JBQTlCLEVBQWdEO0FBQzVDLHdCQUFJLFlBQVksS0FBSyxLQUFMLEVBQVksZ0JBQVosQ0FBNkIsS0FBN0IsQ0FBaEI7QUFDQSx3QkFBSSxVQUFVLFFBQWQsRUFBd0I7QUFDcEIsdUNBQWUsSUFBZjtBQUNBO0FBQ0g7QUFDSjs7QUFFRCxxQkFBSyxJQUFJLE1BQVQsSUFBbUIsS0FBSyxLQUFMLEVBQVksa0JBQS9CLEVBQW1EO0FBQy9DLHdCQUFJLGFBQWEsS0FBSyxLQUFMLEVBQVksa0JBQVosQ0FBK0IsTUFBL0IsQ0FBakI7QUFDQSx3QkFBSSxXQUFXLFFBQWYsRUFBeUI7QUFDckIseUNBQWlCLElBQWpCO0FBQ0E7QUFDSDtBQUNKO0FBQ0o7O0FBRUQsbUJBQU87QUFDSCxnQ0FBZ0IsWUFEYjtBQUVILGtDQUFrQixjQUZmO0FBR0gsNEJBQVksUUFIVCxFQUFQO0FBSUg7QUFoREYsS0E5TXNCLEVBK1B0QjtBQUNDLGFBQUssU0FETjs7QUFJQzs7Ozs7QUFLQSxlQUFPLFNBQVMsT0FBVCxDQUFpQixPQUFqQixFQUEwQixVQUExQixFQUFzQztBQUN6QyxpQkFBSyxRQUFMLENBQWMsVUFBZCxDQUF5QixLQUFLLFdBQUwsQ0FBaUIsT0FBakIsRUFBMEIsV0FBbkQsRUFBZ0UsVUFBaEUsRUFBNEUsS0FBSyxXQUFMLENBQWlCLE9BQWpCLEVBQTBCLE9BQXRHLEdBQWdILEtBQUssUUFBTCxDQUFjLFVBQWQsQ0FBeUIsS0FBSyxXQUFMLENBQWlCLE9BQWpCLEVBQTBCLGVBQW5ELEVBQW9FLFVBQXBFLEVBQWdGLEtBQUssV0FBTCxDQUFpQixPQUFqQixFQUEwQixXQUExRyxDQUFoSDtBQUNIO0FBWEYsS0EvUHNCLEVBMlF0QjtBQUNDLGFBQUssWUFETjs7QUFJQzs7OztBQUlBLGVBQU8sU0FBUyxVQUFULEdBQXNCO0FBQ3pCLG1CQUFPLEtBQUssV0FBWjtBQUNIO0FBVkYsS0EzUXNCLEVBc1J0QjtBQUNDLGFBQUssUUFETjs7QUFJQzs7OztBQUlBLGVBQU8sU0FBUyxNQUFULENBQWdCLEdBQWhCLEVBQXFCO0FBQ3hCLGlCQUFLLEtBQUwsQ0FBVyxHQUFYLElBQWtCLElBQWxCO0FBQ0g7QUFWRixLQXRSc0IsRUFpU3RCO0FBQ0MsYUFBSyxjQUROOztBQUlDOzs7OztBQUtBLGVBQU8sU0FBUyxZQUFULENBQXNCLFFBQXRCLEVBQWdDLE1BQWhDLEVBQXdDO0FBQzNDLGdCQUFJLEtBQUssVUFBTCxDQUFnQixjQUFoQixDQUErQixRQUEvQixNQUE2QyxLQUFqRCxFQUF3RCxLQUFLLFVBQUwsQ0FBZ0IsUUFBaEIsSUFBNEIsRUFBNUI7QUFDeEQsZ0JBQUksS0FBSyxVQUFMLENBQWdCLFFBQWhCLEVBQTBCLE9BQTFCLENBQWtDLE1BQWxDLE1BQThDLENBQUMsQ0FBbkQsRUFBc0QsS0FBSyxVQUFMLENBQWdCLFFBQWhCLEVBQTBCLElBQTFCLENBQStCLE1BQS9COztBQUV0RCxnQkFBSSxPQUFPLFVBQVAsQ0FBa0IsY0FBbEIsQ0FBaUMsUUFBakMsTUFBK0MsS0FBbkQsRUFBMEQsT0FBTyxVQUFQLENBQWtCLFFBQWxCLElBQThCLEVBQTlCO0FBQzFELGdCQUFJLE9BQU8sVUFBUCxDQUFrQixRQUFsQixFQUE0QixPQUE1QixDQUFvQyxJQUFwQyxNQUE4QyxDQUFDLENBQW5ELEVBQXNELE9BQU8sVUFBUCxDQUFrQixRQUFsQixFQUE0QixJQUE1QixDQUFpQyxJQUFqQzs7QUFFdEQsaUJBQUssSUFBSSxHQUFULElBQWdCLE9BQU8sS0FBdkIsRUFBOEI7QUFDMUIsb0JBQUksVUFBVSxJQUFJLEtBQUosQ0FBVSxHQUFWLEVBQWUsQ0FBZixDQUFkO0FBQ0Esb0JBQUksWUFBWSxRQUFoQixFQUEwQjtBQUN0Qix5QkFBSyxLQUFMLENBQVcsR0FBWCxJQUFrQixPQUFPLEtBQVAsQ0FBYSxHQUFiLENBQWxCO0FBQ0EseUJBQUssV0FBTCxDQUFpQixPQUFqQixJQUE0QixPQUFPLFdBQVAsQ0FBbUIsT0FBbkIsQ0FBNUI7QUFDQTtBQUNIO0FBQ0o7QUFDSjtBQXhCRixLQWpTc0IsRUEwVHRCO0FBQ0MsYUFBSyxRQUROOztBQUlDOzs7Ozs7OztBQVFBLGVBQU8sU0FBUyxNQUFULENBQWdCLFFBQWhCLEVBQTBCLEtBQTFCLEVBQWlDLGtCQUFqQyxFQUFxRCxZQUFyRCxFQUFtRTtBQUN0RSxnQkFBSSxhQUFhLFNBQWpCLEVBQTRCO0FBQ3hCLHFCQUFLLFVBQUwsQ0FBZ0IsS0FBaEI7QUFDSCxhQUZELE1BRU87QUFDSCxxQkFBSyxJQUFJLEdBQVQsSUFBZ0IsS0FBSyxLQUFyQixFQUE0QjtBQUN4Qix3QkFBSSxrQkFBa0IsSUFBSSxLQUFKLENBQVUsR0FBVixFQUFlLENBQWYsQ0FBdEI7QUFDQSx3QkFBSSxvQkFBb0IsU0FBcEIsSUFBaUMsZ0JBQWdCLE9BQWhCLENBQXdCLFFBQXhCLEVBQWtDLEVBQWxDLE1BQTBDLFFBQS9FLEVBQXlGO0FBQ3JGLDRCQUFJLG9CQUFvQixRQUF4QixFQUFrQyxXQUFXLGVBQVg7O0FBRWxDLDRCQUFJLGtCQUFrQixLQUF0QjtBQUNBLDRCQUFJLElBQUksS0FBSixDQUFVLE1BQVYsS0FBcUIsSUFBekIsRUFBK0I7QUFDM0I7QUFDQSxnQ0FBSSxjQUFjLEtBQUssUUFBTCxDQUFjLFFBQWQsRUFBd0IsS0FBSyxPQUE3QixFQUFzQyxLQUFLLHNCQUEzQyxDQUFsQjs7QUFFQSxnQ0FBSSxPQUFPLFNBQVgsQ0FKMkIsQ0FJTDtBQUN0QixnQ0FBSSxZQUFZLFlBQVosS0FBNkIsSUFBakMsRUFBdUM7QUFDbkMsb0NBQUksWUFBWSxRQUFaLENBQXFCLE1BQXJCLEtBQWdDLENBQWhDLElBQXFDLFlBQVksY0FBWixLQUErQixLQUF4RSxFQUErRSxPQUFPLFdBQVA7QUFDbEY7O0FBRUQsZ0NBQUksT0FBTyxJQUFJLEtBQUosQ0FBVSxHQUFWLEVBQWUsQ0FBZixFQUFrQixXQUFsQixFQUFYO0FBQ0EsZ0NBQUksaUJBQWlCLFNBQWpCLElBQThCLGlCQUFpQixJQUFuRCxFQUF5RCxPQUFPLFlBQVA7O0FBRXpELGdDQUFJLFVBQVUsU0FBVixJQUF1QixVQUFVLElBQXJDLEVBQTJDO0FBQ3ZDLG9DQUFJLEtBQUssV0FBTCxDQUFpQixjQUFqQixDQUFnQyxRQUFoQyxNQUE4QyxLQUE5QyxJQUF1RCxLQUFLLFdBQUwsQ0FBaUIsY0FBakIsQ0FBZ0MsUUFBaEMsTUFBOEMsSUFBOUMsSUFBc0QsS0FBSyxXQUFMLENBQWlCLFFBQWpCLEtBQThCLElBQS9JLEVBQXFKO0FBQ2pKLHlDQUFLLFdBQUwsQ0FBaUIsUUFBakIsSUFBNkIsS0FBSyxRQUFMLENBQWMsWUFBZCxDQUEyQixJQUEzQixFQUFpQyxLQUFqQyxFQUF3QyxJQUF4QyxDQUE3QjtBQUNBLHlDQUFLLFdBQUwsQ0FBaUIsUUFBakIsRUFBMkIsUUFBM0IsR0FBc0MsUUFBdEM7O0FBRUEsc0RBQWtCLElBQWxCO0FBQ0g7QUFDRCxxQ0FBSyxXQUFMLENBQWlCLFFBQWpCLEVBQTJCLFdBQTNCLENBQXVDLEtBQXZDLEVBQThDLEtBQTlDLEVBQXFELGtCQUFyRDtBQUNILDZCQVJELE1BUU87QUFDSCxxQ0FBSyxXQUFMLENBQWlCLFFBQWpCLElBQTZCLElBQTdCO0FBQ0g7QUFDSix5QkF2QkQsTUF1Qk87QUFDSDtBQUNBLGdDQUFJLFVBQVUsU0FBVixJQUF1QixVQUFVLElBQXJDLEVBQTJDLEtBQUssV0FBTCxDQUFpQixRQUFqQixJQUE2QixLQUE3Qjs7QUFFM0MsOENBQWtCLElBQWxCO0FBQ0g7O0FBRUQsNEJBQUksb0JBQW9CLElBQXBCLElBQTRCLEtBQUssVUFBTCxDQUFnQixjQUFoQixDQUErQixRQUEvQixNQUE2QyxJQUE3RSxFQUFtRjtBQUMvRSxpQ0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEtBQUssVUFBTCxDQUFnQixRQUFoQixFQUEwQixNQUE5QyxFQUFzRCxHQUF0RCxFQUEyRDtBQUN2RCxvQ0FBSSxVQUFVLEtBQUssVUFBTCxDQUFnQixRQUFoQixFQUEwQixDQUExQixDQUFkO0FBQ0Esd0NBQVEsV0FBUixDQUFvQixRQUFwQixJQUFnQyxLQUFLLFdBQUwsQ0FBaUIsUUFBakIsQ0FBaEM7QUFDSDtBQUNKO0FBQ0Q7QUFDSDtBQUNKO0FBQ0o7O0FBRUQsbUJBQU8sS0FBUDtBQUNIO0FBaEVGLEtBMVRzQixFQTJYdEI7QUFDQyxhQUFLLFNBRE47O0FBSUM7Ozs7O0FBS0EsZUFBTyxTQUFTLE9BQVQsQ0FBaUIsUUFBakIsRUFBMkI7QUFDOUIsbUJBQU8sS0FBSyxRQUFMLENBQWMsVUFBZCxDQUF5QixLQUFLLFdBQUwsQ0FBaUIsUUFBakIsQ0FBekIsQ0FBUDtBQUNIO0FBWEYsS0EzWHNCLEVBdVl0QjtBQUNDLGFBQUssWUFETjs7QUFJQzs7OztBQUlBLGVBQU8sU0FBUyxVQUFULENBQW9CLEdBQXBCLEVBQXlCO0FBQzVCLGlCQUFLLGtCQUFMLEdBQTBCLEtBQUssUUFBTCxDQUFjLFlBQWQsQ0FBMkIsT0FBM0IsRUFBb0MsS0FBcEMsRUFBMkMsY0FBM0MsQ0FBMUI7QUFDQSxpQkFBSyxrQkFBTCxDQUF3QixXQUF4QixDQUFvQyxHQUFwQztBQUNIO0FBWEYsS0F2WXNCLEVBbVp0QjtBQUNDLGFBQUssUUFETjs7QUFJQzs7OztBQUlBLGVBQU8sU0FBUyxNQUFULEdBQWtCO0FBQ3JCLG1CQUFPLEtBQUssUUFBTCxDQUFjLFVBQWQsRUFBUDtBQUNIO0FBVkYsS0FuWnNCLEVBOFp0QjtBQUNDLGFBQUssUUFETjs7QUFJQzs7OztBQUlBLGVBQU8sU0FBUyxNQUFULENBQWdCLEVBQWhCLEVBQW9CO0FBQ3ZCLGlCQUFLLEdBQUwsR0FBVyxFQUFYO0FBQ0g7QUFWRixLQTlac0IsRUF5YXRCO0FBQ0MsYUFBSyxZQUROOztBQUlDOzs7O0FBSUEsZUFBTyxTQUFTLFVBQVQsR0FBc0I7QUFDekIsbUJBQU8sS0FBSyxRQUFaO0FBQ0g7QUFWRixLQXphc0IsRUFvYnRCO0FBQ0MsYUFBSyxvQkFETjs7QUFJQzs7Ozs7QUFLQSxlQUFPLFNBQVMsa0JBQVQsQ0FBNEIsU0FBNUIsRUFBdUMsRUFBdkMsRUFBMkM7QUFDOUMsaUJBQUssT0FBTCxDQUFhLFNBQWIsRUFBd0IsS0FBeEIsR0FBZ0MsRUFBaEM7QUFDSDtBQVhGLEtBcGJzQixFQWdjdEI7QUFDQyxhQUFLLHFCQUROOztBQUlDOzs7OztBQUtBLGVBQU8sU0FBUyxtQkFBVCxDQUE2QixTQUE3QixFQUF3QyxFQUF4QyxFQUE0QztBQUMvQyxpQkFBSyxPQUFMLENBQWEsU0FBYixFQUF3QixNQUF4QixHQUFpQyxFQUFqQztBQUNIO0FBWEYsS0FoY3NCLEVBNGN0QjtBQUNDLGFBQUssY0FETjs7QUFJQzs7OztBQUlBLGVBQU8sU0FBUyxZQUFULENBQXNCLFNBQXRCLEVBQWlDO0FBQ3BDLGlCQUFLLE9BQUwsQ0FBYSxVQUFVLFFBQVYsS0FBdUIsR0FBcEMsRUFBeUMsT0FBekMsR0FBbUQsSUFBbkQ7QUFDSDtBQVZGLEtBNWNzQixFQXVkdEI7QUFDQyxhQUFLLGVBRE47O0FBSUM7Ozs7QUFJQSxlQUFPLFNBQVMsYUFBVCxDQUF1QixTQUF2QixFQUFrQztBQUNyQyxpQkFBSyxPQUFMLENBQWEsVUFBVSxRQUFWLEtBQXVCLEdBQXBDLEVBQXlDLE9BQXpDLEdBQW1ELEtBQW5EO0FBQ0g7QUFWRixLQXZkc0IsRUFrZXRCO0FBQ0MsYUFBSyxXQUROOztBQUlDOzs7OztBQUtBLGVBQU8sU0FBUyxTQUFULENBQW1CLElBQW5CLEVBQXlCO0FBQzVCLGlCQUFLLElBQUksR0FBVCxJQUFnQixLQUFLLE9BQXJCLEVBQThCO0FBQzFCLG9CQUFJLFFBQVEsSUFBWixFQUFrQixPQUFPLEtBQUssT0FBTCxDQUFhLEdBQWIsQ0FBUDtBQUNyQjs7QUFFRCxtQkFBTyxJQUFQO0FBQ0g7QUFmRixLQWxlc0IsRUFrZnRCO0FBQ0MsYUFBSyxlQUROOztBQUlDOzs7O0FBSUEsZUFBTyxTQUFTLGFBQVQsR0FBeUI7QUFDNUIsbUJBQU8sS0FBSyxPQUFaO0FBQ0g7QUFWRixLQWxmc0IsRUE2ZnRCO0FBQ0MsYUFBSyxxQkFETjs7QUFJQzs7Ozs7QUFLQSxlQUFPLFNBQVMsbUJBQVQsQ0FBNkIsVUFBN0IsRUFBeUMsRUFBekMsRUFBNkM7QUFDaEQsaUJBQUssc0JBQUwsQ0FBNEIsVUFBNUIsRUFBd0MsS0FBeEMsR0FBZ0QsRUFBaEQ7QUFDSDtBQVhGLEtBN2ZzQixFQXlnQnRCO0FBQ0MsYUFBSyxzQkFETjs7QUFJQzs7Ozs7QUFLQSxlQUFPLFNBQVMsb0JBQVQsQ0FBOEIsVUFBOUIsRUFBMEMsRUFBMUMsRUFBOEM7QUFDakQsaUJBQUssc0JBQUwsQ0FBNEIsVUFBNUIsRUFBd0MsTUFBeEMsR0FBaUQsRUFBakQ7QUFDSDtBQVhGLEtBemdCc0IsRUFxaEJ0QjtBQUNDLGFBQUssZUFETjs7QUFJQzs7OztBQUlBLGVBQU8sU0FBUyxhQUFULENBQXVCLFVBQXZCLEVBQW1DO0FBQ3RDLGlCQUFLLHNCQUFMLENBQTRCLFdBQVcsUUFBWCxLQUF3QixHQUFwRCxFQUF5RCxPQUF6RCxHQUFtRSxJQUFuRTtBQUNIO0FBVkYsS0FyaEJzQixFQWdpQnRCO0FBQ0MsYUFBSyxnQkFETjs7QUFJQzs7OztBQUlBLGVBQU8sU0FBUyxjQUFULENBQXdCLFVBQXhCLEVBQW9DO0FBQ3ZDLGlCQUFLLHNCQUFMLENBQTRCLFdBQVcsUUFBWCxLQUF3QixHQUFwRCxFQUF5RCxPQUF6RCxHQUFtRSxLQUFuRTtBQUNIO0FBVkYsS0FoaUJzQixFQTJpQnRCO0FBQ0MsYUFBSywwQkFETjs7QUFJQzs7Ozs7QUFLQSxlQUFPLFNBQVMsd0JBQVQsQ0FBa0MsSUFBbEMsRUFBd0M7QUFDM0MsaUJBQUssSUFBSSxHQUFULElBQWdCLEtBQUssc0JBQXJCLEVBQTZDO0FBQ3pDLG9CQUFJLFFBQVEsSUFBWixFQUFrQixPQUFPLEtBQUssc0JBQUwsQ0FBNEIsR0FBNUIsQ0FBUDtBQUNyQjs7QUFFRCxtQkFBTyxJQUFQO0FBQ0g7QUFmRixLQTNpQnNCLEVBMmpCdEI7QUFDQyxhQUFLLDZCQUROOztBQUlDOzs7O0FBSUEsZUFBTyxTQUFTLDJCQUFULEdBQXVDO0FBQzFDLG1CQUFPLEtBQUssc0JBQVo7QUFDSDtBQVZGLEtBM2pCc0IsRUFza0J0QjtBQUNDLGFBQUssZUFETjs7QUFJQzs7Ozs7O0FBTUEsZUFBTyxTQUFTLGFBQVQsQ0FBdUIsTUFBdkIsRUFBK0IsWUFBL0IsRUFBNkMsVUFBN0MsRUFBeUQ7QUFDNUQsZ0JBQUksT0FBTyxPQUFQLEtBQW1CLElBQXZCLEVBQTZCO0FBQ3pCLG9CQUFJLGVBQWUsU0FBZixJQUE0QixlQUFlLElBQTNDLElBQW1ELGVBQWUsSUFBdEUsRUFBNEUsS0FBSyxXQUFMLEdBQW1CLEVBQW5COztBQUU1RTtBQUNBLG9CQUFJLE9BQU8sU0FBUCxLQUFxQixJQUF6QixFQUErQixLQUFLLEdBQUwsQ0FBUyxNQUFULENBQWdCLEtBQUssR0FBTCxDQUFTLFVBQXpCLEVBQS9CLEtBQXlFLEtBQUssR0FBTCxDQUFTLE9BQVQsQ0FBaUIsS0FBSyxHQUFMLENBQVMsVUFBMUI7O0FBRXpFLG9CQUFJLE9BQU8sS0FBUCxLQUFpQixJQUFyQixFQUEyQixLQUFLLEdBQUwsQ0FBUyxNQUFULENBQWdCLEtBQUssR0FBTCxDQUFTLEtBQXpCLEVBQTNCLEtBQWdFLEtBQUssR0FBTCxDQUFTLE9BQVQsQ0FBaUIsS0FBSyxHQUFMLENBQVMsS0FBMUI7O0FBRWhFLHFCQUFLLEdBQUwsQ0FBUyxTQUFULENBQW1CLEtBQUssR0FBTCxDQUFTLE9BQU8sWUFBaEIsQ0FBbkIsRUFBa0QsS0FBSyxHQUFMLENBQVMsT0FBTyxZQUFoQixDQUFsRDtBQUNBLHFCQUFLLEdBQUwsQ0FBUyxhQUFULENBQXVCLEtBQUssR0FBTCxDQUFTLE9BQU8sYUFBaEIsQ0FBdkI7O0FBRUEsb0JBQUksT0FBTyxLQUFQLEtBQWlCLFNBQWpCLElBQThCLE9BQU8sS0FBUCxLQUFpQixJQUFuRCxFQUF5RCxPQUFPLEtBQVA7O0FBRXpELG9CQUFJLGlCQUFpQixTQUFqQixJQUE4QixpQkFBaUIsSUFBL0MsSUFBdUQsaUJBQWlCLElBQTVFLEVBQWtGO0FBQzlFLHdCQUFJLGFBQWEsS0FBakI7QUFDQSx5QkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLE9BQU8sTUFBUCxDQUFjLE1BQWxDLEVBQTBDLEdBQTFDLEVBQStDO0FBQzNDLDRCQUFJLE9BQU8sTUFBUCxDQUFjLENBQWQsS0FBb0IsSUFBcEIsSUFBNEIsT0FBTyxlQUFQLENBQXVCLENBQXZCLE1BQThCLElBQTlELEVBQW9FO0FBQ2hFLHlDQUFhLElBQWI7QUFDQTtBQUNIO0FBQ0o7O0FBRUQsd0JBQUksZUFBZSxJQUFuQixFQUF5QjtBQUNyQiw2QkFBSyxRQUFMLENBQWMsb0JBQWQsQ0FBbUMsTUFBbkMsRUFBMkMsY0FBYyxZQUFkLENBQTJCLGdCQUEzQixDQUE0QyxNQUE1QyxFQUFvRCxLQUFLLFdBQXpELENBQTNDLEVBQWtILElBQWxILEVBQXdILEtBQUssV0FBN0g7QUFDQSw2QkFBSyxXQUFMLENBQWlCLElBQWpCLENBQXNCLE1BQXRCO0FBQ0gscUJBSEQsTUFHTztBQUNILDZCQUFLLFFBQUwsQ0FBYyxvQkFBZCxDQUFtQyxNQUFuQyxFQUEyQyxjQUFjLFlBQWQsQ0FBMkIsZ0JBQTNCLENBQTRDLE1BQTVDLEVBQW9ELEtBQUssV0FBekQsQ0FBM0MsRUFBa0gsS0FBbEgsRUFBeUgsS0FBSyxXQUE5SDtBQUNIO0FBQ0osaUJBZkQsTUFlTyxLQUFLLFFBQUwsQ0FBYyxvQkFBZCxDQUFtQyxNQUFuQyxFQUEyQyxjQUFjLFlBQWQsQ0FBMkIsZ0JBQTNCLENBQTRDLE1BQTVDLEVBQW9ELEtBQUssV0FBekQsQ0FBM0MsRUFBa0gsS0FBbEgsRUFBeUgsS0FBSyxXQUE5SDs7QUFFUCxvQkFBSSxPQUFPLE1BQVAsS0FBa0IsU0FBbEIsSUFBK0IsT0FBTyxNQUFQLEtBQWtCLElBQXJELEVBQTJELE9BQU8sTUFBUDs7QUFFM0Qsb0JBQUksZUFBZSxTQUFmLElBQTRCLGVBQWUsSUFBM0MsSUFBbUQsZUFBZSxJQUF0RSxFQUE0RSxLQUFLLGFBQUw7QUFDL0U7QUFDSjtBQTdDRixLQXRrQnNCLEVBb25CdEI7QUFDQyxhQUFLLGVBRE47QUFFQyxlQUFPLFNBQVMsYUFBVCxDQUF1QixZQUF2QixFQUFxQztBQUN4QyxpQkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEtBQUssV0FBTCxDQUFpQixNQUFyQyxFQUE2QyxHQUE3QyxFQUFrRDtBQUM5QyxxQkFBSyxRQUFMLENBQWMsSUFBZCxDQUFtQixLQUFLLFdBQUwsQ0FBaUIsQ0FBakIsQ0FBbkIsRUFBd0MsY0FBYyxZQUFkLENBQTJCLGdCQUEzQixDQUE0QyxLQUFLLFdBQUwsQ0FBaUIsQ0FBakIsQ0FBNUMsRUFBaUUsS0FBSyxXQUF0RSxDQUF4QztBQUNIO0FBQ0o7QUFORixLQXBuQnNCLEVBMm5CdEI7QUFDQyxhQUFLLGdCQUROOztBQUlDOzs7O0FBSUEsZUFBTyxTQUFTLGNBQVQsQ0FBd0IsWUFBeEIsRUFBc0M7QUFDekMsaUJBQUssV0FBTCxHQUFtQixFQUFuQjs7QUFFQSxpQkFBSyxJQUFJLEdBQVQsSUFBZ0IsS0FBSyxPQUFyQixFQUE4QjtBQUMxQixxQkFBSyxhQUFMLENBQW1CLEtBQUssT0FBTCxDQUFhLEdBQWIsQ0FBbkIsRUFBc0MsWUFBdEM7QUFDSCxrQkFBSyxhQUFMO0FBQ0o7QUFkRixLQTNuQnNCLEVBMG9CdEI7QUFDQyxhQUFLLGdCQUROOztBQUlDOzs7O0FBSUEsZUFBTyxTQUFTLGNBQVQsQ0FBd0IsV0FBeEIsRUFBcUM7QUFDeEMsZ0JBQUksY0FBYyxFQUFsQjtBQUNBLGlCQUFLLElBQUksR0FBVCxJQUFnQixLQUFLLHNCQUFyQixFQUE2QztBQUN6QyxvQkFBSSxNQUFNLEtBQUssc0JBQUwsQ0FBNEIsR0FBNUIsQ0FBVjs7QUFFQSxvQkFBSSxJQUFJLE9BQUosS0FBZ0IsSUFBcEIsRUFBMEI7QUFDdEIsd0JBQUksT0FBTyxDQUFDLGdCQUFnQixTQUFoQixJQUE2QixnQkFBZ0IsSUFBOUMsS0FBdUQsS0FBSyxrQkFBTCxLQUE0QixTQUFuRixJQUFnRyxLQUFLLGtCQUFMLEtBQTRCLElBQTVILEdBQW1JLEtBQUssa0JBQXhJLEdBQTZKLEtBQUssV0FBTCxDQUFpQixXQUFqQixDQUF4Szs7QUFFQSx3QkFBSSxTQUFTLFNBQVQsSUFBc0IsU0FBUyxJQUEvQixJQUF1QyxLQUFLLE1BQUwsR0FBYyxDQUF6RCxFQUE0RDtBQUN4RCw0QkFBSSxJQUFJLFNBQUosS0FBa0IsSUFBdEIsRUFBNEIsS0FBSyxHQUFMLENBQVMsTUFBVCxDQUFnQixLQUFLLEdBQUwsQ0FBUyxVQUF6QixFQUE1QixLQUFzRSxLQUFLLEdBQUwsQ0FBUyxPQUFULENBQWlCLEtBQUssR0FBTCxDQUFTLFVBQTFCOztBQUV0RSw0QkFBSSxJQUFJLEtBQUosS0FBYyxJQUFsQixFQUF3QixLQUFLLEdBQUwsQ0FBUyxNQUFULENBQWdCLEtBQUssR0FBTCxDQUFTLEtBQXpCLEVBQXhCLEtBQTZELEtBQUssR0FBTCxDQUFTLE9BQVQsQ0FBaUIsS0FBSyxHQUFMLENBQVMsS0FBMUI7O0FBRTdELDZCQUFLLEdBQUwsQ0FBUyxTQUFULENBQW1CLEtBQUssR0FBTCxDQUFTLElBQUksWUFBYixDQUFuQixFQUErQyxLQUFLLEdBQUwsQ0FBUyxJQUFJLFlBQWIsQ0FBL0M7QUFDQSw2QkFBSyxHQUFMLENBQVMsYUFBVCxDQUF1QixLQUFLLEdBQUwsQ0FBUyxJQUFJLGFBQWIsQ0FBdkI7O0FBRUEsNEJBQUksSUFBSSxLQUFKLEtBQWMsU0FBZCxJQUEyQixJQUFJLEtBQUosS0FBYyxJQUE3QyxFQUFtRCxJQUFJLEtBQUo7O0FBRW5ELDRCQUFJLGFBQWEsS0FBakI7QUFDQSw2QkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLElBQUksTUFBSixDQUFXLE1BQS9CLEVBQXVDLEdBQXZDLEVBQTRDO0FBQ3hDLGdDQUFJLElBQUksTUFBSixDQUFXLENBQVgsS0FBaUIsSUFBakIsSUFBeUIsSUFBSSxlQUFKLENBQW9CLENBQXBCLE1BQTJCLElBQXhELEVBQThEO0FBQzFELDZDQUFhLElBQWI7QUFDQTtBQUNIO0FBQ0o7O0FBRUQsNEJBQUksZUFBZSxJQUFuQixFQUF5QjtBQUNyQixpQ0FBSyxRQUFMLENBQWMsNEJBQWQsQ0FBMkMsR0FBM0MsRUFBZ0QsSUFBaEQsRUFBc0QsSUFBSSxRQUExRCxFQUFvRSxjQUFjLFlBQWQsQ0FBMkIsZ0JBQTNCLENBQTRDLEdBQTVDLEVBQWlELEtBQUssV0FBdEQsQ0FBcEUsRUFBd0ksSUFBeEksRUFBOEksS0FBSyxXQUFuSjtBQUNBLHdDQUFZLElBQVosQ0FBaUIsR0FBakI7QUFDSCx5QkFIRCxNQUdPO0FBQ0gsaUNBQUssUUFBTCxDQUFjLDRCQUFkLENBQTJDLEdBQTNDLEVBQWdELElBQWhELEVBQXNELElBQUksUUFBMUQsRUFBb0UsY0FBYyxZQUFkLENBQTJCLGdCQUEzQixDQUE0QyxHQUE1QyxFQUFpRCxLQUFLLFdBQXRELENBQXBFLEVBQXdJLEtBQXhJLEVBQStJLEtBQUssV0FBcEo7QUFDSDs7QUFFRCw0QkFBSSxJQUFJLE1BQUosS0FBZSxTQUFmLElBQTRCLElBQUksTUFBSixLQUFlLElBQS9DLEVBQXFELElBQUksTUFBSjtBQUN4RDtBQUNKO0FBQ0o7O0FBRUQsaUJBQUssSUFBSSxNQUFNLENBQWYsRUFBa0IsTUFBTSxZQUFZLE1BQXBDLEVBQTRDLEtBQTVDLEVBQW1EO0FBQy9DLHFCQUFLLFFBQUwsQ0FBYyxJQUFkLENBQW1CLFlBQVksR0FBWixDQUFuQixFQUFxQyxjQUFjLFlBQWQsQ0FBMkIsZ0JBQTNCLENBQTRDLFlBQVksR0FBWixDQUE1QyxFQUE4RCxLQUFLLFdBQW5FLENBQXJDO0FBQ0g7QUFDSjtBQWpERixLQTFvQnNCLEVBNHJCdEI7QUFDQyxhQUFLLEtBRE47O0FBSUM7OztBQUdBLGVBQU8sU0FBUyxHQUFULEdBQWU7QUFDbEIsZ0JBQUksYUFBYSxVQUFVLENBQVYsQ0FBakI7QUFDQSxnQkFBSSxNQUFNLEtBQUssQ0FBZjtBQUNBLGdCQUFJLFNBQVMsS0FBSyxDQUFsQjtBQUNBLGdCQUFJLE9BQU8sS0FBSyxDQUFoQjtBQUNBLGdCQUFJLFdBQVcsTUFBWCxHQUFvQixDQUF4QixFQUEyQjtBQUN2QixxQkFBSyxLQUFMLEdBQWEsV0FBVyxDQUFYLENBQWI7QUFDQSxzQkFBTSxXQUFXLENBQVgsQ0FBTjtBQUNBLHlCQUFTLFdBQVcsQ0FBWCxDQUFUO0FBQ0EsdUJBQU8sV0FBVyxDQUFYLENBQVA7QUFDSCxhQUxELE1BS087QUFDSCxxQkFBSyxLQUFMLEdBQWEsV0FBVyxDQUFYLENBQWI7QUFDQSxzQkFBTSxXQUFXLENBQVgsQ0FBTjtBQUNBLHlCQUFTLE9BQVQ7QUFDQSx1QkFBTyxXQUFXLENBQVgsQ0FBUDtBQUNIOztBQUVEO0FBQ0EsZ0JBQUksYUFBYSxDQUFqQjtBQUNBLGlCQUFLLElBQUksR0FBVCxJQUFnQixLQUFLLEtBQXJCLEVBQTRCO0FBQ3hCLG9CQUFJLFNBQVMsS0FBSyxLQUFMLENBQVcsR0FBWCxDQUFiOztBQUVBLHFCQUFLLE1BQUwsQ0FBWSxJQUFJLEtBQUosQ0FBVSxHQUFWLEVBQWUsQ0FBZixDQUFaLEVBQStCLE1BQS9COztBQUVBLG9CQUFJLGVBQWUsQ0FBZixLQUFxQixrQkFBa0IsS0FBbEIsSUFBMkIsa0JBQWtCLFlBQTdDLElBQTZELGtCQUFrQixVQUEvRSxJQUE2RixrQkFBa0IsZ0JBQXBJLENBQUosRUFBMkosYUFBYSxPQUFPLE1BQXBCO0FBQzlKO0FBQ0QsZ0JBQUksV0FBVyxPQUFmLEVBQXdCLEtBQUssTUFBTCxDQUFZLGVBQVosRUFBeEIsS0FBMEQsS0FBSyxNQUFMLENBQVksZ0JBQVo7QUFDMUQsaUJBQUssTUFBTCxDQUFZLFFBQVosRUFBc0IsSUFBSSxZQUFKLENBQWlCLFVBQWpCLENBQXRCLEVBQW9ELElBQXBELEVBQTBELE1BQTFEOztBQUVBO0FBQ0EsaUJBQUssU0FBTCxDQUFlO0FBQ1gsd0JBQVEsUUFERztBQUVYLHdCQUFRLGVBRkc7QUFHWCw4QkFBYyxLQUhIO0FBSVgsMEJBQVUsQ0FBQyxHQUFELEVBQU0sQ0FBQyxRQUFELENBQU4sRUFBa0IsRUFBbEIsRUFBc0IsSUFBdEIsQ0FKQyxFQUFmOztBQU1BO0FBQ0EsaUJBQUssY0FBTDs7QUFFQSxtQkFBTyxLQUFLLFFBQUwsQ0FBYyxVQUFkLENBQXlCLEtBQUssV0FBTCxDQUFpQixRQUFqQixDQUF6QixDQUFQO0FBQ0g7QUEvQ0YsS0E1ckJzQixFQTR1QnRCO0FBQ0MsYUFBSyxNQUROOztBQUlDOzs7QUFHQSxlQUFPLFNBQVMsSUFBVCxHQUFnQjtBQUNuQixpQkFBSyxRQUFMLENBQWMsVUFBZCxHQUEyQixTQUEzQixDQUFxQyxLQUFLLFFBQUwsQ0FBYyxVQUFkLEdBQTJCLE1BQWhFO0FBQ0EsaUJBQUssUUFBTCxDQUFjLFVBQWQsR0FBMkIsVUFBM0IsQ0FBc0MsR0FBdEM7O0FBRUEsZ0JBQUksYUFBYSxVQUFVLENBQVYsQ0FBakIsQ0FKbUIsQ0FJWTtBQUMvQixpQkFBSyxLQUFMLEdBQWEsV0FBVyxDQUFYLENBQWIsQ0FMbUIsQ0FLUzs7QUFFNUI7QUFDQSxpQkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLFdBQVcsTUFBL0IsRUFBdUMsR0FBdkMsRUFBNEM7QUFDeEMsb0JBQUksV0FBVyxDQUFYLEVBQWMsSUFBZCxLQUF1QixRQUEzQixFQUFxQyxLQUFLLFNBQUwsQ0FBZSxXQUFXLENBQVgsQ0FBZixFQUFyQyxLQUF3RSxJQUFJLFdBQVcsQ0FBWCxFQUFjLElBQWQsS0FBdUIsU0FBM0IsRUFBc0M7QUFDMUcseUJBQUssVUFBTCxDQUFnQixXQUFXLENBQVgsQ0FBaEI7QUFDUDs7QUFFRDtBQUNBLGlCQUFLLElBQUksR0FBVCxJQUFnQixLQUFLLEtBQXJCLEVBQTRCO0FBQ3hCLG9CQUFJLFNBQVMsS0FBSyxLQUFMLENBQVcsR0FBWCxDQUFiOztBQUVBLG9CQUFJLFFBQVEsU0FBWixFQUF1QjtBQUNuQix3QkFBSSxXQUFXLElBQWYsRUFBcUIsS0FBSyxVQUFMLENBQWdCLE1BQWhCO0FBQ3hCLGlCQUZELE1BRU8sS0FBSyxNQUFMLENBQVksSUFBSSxLQUFKLENBQVUsR0FBVixFQUFlLENBQWYsQ0FBWixFQUErQixNQUEvQjtBQUNWO0FBQ0o7QUE1QkYsS0E1dUJzQixDQUF6Qjs7QUEyd0JBLFdBQU8sVUFBUDtBQUNILENBaHlCcUMsRUFBdEM7O0FBa3lCQSxPQUFPLFVBQVAsR0FBb0IsVUFBcEI7QUFDQSxPQUFPLE9BQVAsQ0FBZSxVQUFmLEdBQTRCLFVBQTVCOztBQUVBOzs7O0FBSUEsU0FBUyxNQUFULEdBQWtCO0FBQ2QsUUFBSSxVQUFVLElBQUksVUFBSixFQUFkO0FBQ0EsUUFBSSxNQUFNLElBQVY7QUFDQSxRQUFJLFVBQVUsQ0FBVixhQUF3QixxQkFBNUIsRUFBbUQ7QUFDL0MsY0FBTSxVQUFVLENBQVYsQ0FBTjs7QUFFQSxnQkFBUSxNQUFSLENBQWUsR0FBZjtBQUNBLGdCQUFRLFFBQVIsR0FBbUIsSUFBSSxTQUFTLE9BQWIsQ0FBcUIsR0FBckIsQ0FBbkI7QUFDQSxnQkFBUSxJQUFSLENBQWEsU0FBYjtBQUNBLGVBQU8sT0FBUDtBQUNILEtBUEQsTUFPTyxJQUFJLFVBQVUsQ0FBVixhQUF3QixpQkFBNUIsRUFBK0M7QUFDbEQsY0FBTSxjQUFjLFlBQWQsQ0FBMkIseUJBQTNCLENBQXFELFVBQVUsQ0FBVixDQUFyRCxDQUFOOztBQUVBLGdCQUFRLE1BQVIsQ0FBZSxHQUFmO0FBQ0EsZ0JBQVEsUUFBUixHQUFtQixJQUFJLFNBQVMsT0FBYixDQUFxQixHQUFyQixDQUFuQjtBQUNBLGdCQUFRLElBQVIsQ0FBYSxTQUFiO0FBQ0EsZUFBTyxPQUFQO0FBQ0gsS0FQTSxNQU9BO0FBQ0gsY0FBTSxjQUFjLFlBQWQsQ0FBMkIseUJBQTNCLENBQXFELFNBQVMsYUFBVCxDQUF1QixRQUF2QixDQUFyRCxFQUF1RixFQUFFLFdBQVcsS0FBYixFQUF2RixDQUFOOztBQUVBLGdCQUFRLE1BQVIsQ0FBZSxHQUFmO0FBQ0EsZ0JBQVEsUUFBUixHQUFtQixJQUFJLFNBQVMsT0FBYixDQUFxQixHQUFyQixDQUFuQjtBQUNBLGVBQU8sUUFBUSxHQUFSLENBQVksU0FBWixDQUFQO0FBQ0g7QUFDSjtBQUNELE9BQU8sTUFBUCxHQUFnQixNQUFoQjtBQUNBLE9BQU8sT0FBUCxDQUFlLE1BQWYsR0FBd0IsTUFBeEI7Ozs7OztBQ3gxQkE7O0FBRUEsT0FBTyxjQUFQLENBQXNCLE9BQXRCLEVBQStCLFlBQS9CLEVBQTZDO0FBQ3pDLFdBQU87QUFEa0MsQ0FBN0M7QUFHQSxRQUFRLGFBQVIsR0FBd0IsU0FBeEI7O0FBRUEsSUFBSSxlQUFlLFlBQVk7QUFBRSxhQUFTLGdCQUFULENBQTBCLE1BQTFCLEVBQWtDLEtBQWxDLEVBQXlDO0FBQUUsYUFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLE1BQU0sTUFBMUIsRUFBa0MsR0FBbEMsRUFBdUM7QUFBRSxnQkFBSSxhQUFhLE1BQU0sQ0FBTixDQUFqQixDQUEyQixXQUFXLFVBQVgsR0FBd0IsV0FBVyxVQUFYLElBQXlCLEtBQWpELENBQXdELFdBQVcsWUFBWCxHQUEwQixJQUExQixDQUFnQyxJQUFJLFdBQVcsVUFBZixFQUEyQixXQUFXLFFBQVgsR0FBc0IsSUFBdEIsQ0FBNEIsT0FBTyxjQUFQLENBQXNCLE1BQXRCLEVBQThCLFdBQVcsR0FBekMsRUFBOEMsVUFBOUM7QUFBNEQ7QUFBRSxLQUFDLE9BQU8sVUFBVSxXQUFWLEVBQXVCLFVBQXZCLEVBQW1DLFdBQW5DLEVBQWdEO0FBQUUsWUFBSSxVQUFKLEVBQWdCLGlCQUFpQixZQUFZLFNBQTdCLEVBQXdDLFVBQXhDLEVBQXFELElBQUksV0FBSixFQUFpQixpQkFBaUIsV0FBakIsRUFBOEIsV0FBOUIsRUFBNEMsT0FBTyxXQUFQO0FBQXFCLEtBQWhOO0FBQW1OLENBQTloQixFQUFuQjs7QUFFQSxJQUFJLGdCQUFnQixRQUFRLHNCQUFSLENBQXBCOztBQUVBLFNBQVMsZUFBVCxDQUF5QixRQUF6QixFQUFtQyxXQUFuQyxFQUFnRDtBQUFFLFFBQUksRUFBRSxvQkFBb0IsV0FBdEIsQ0FBSixFQUF3QztBQUFFLGNBQU0sSUFBSSxTQUFKLENBQWMsbUNBQWQsQ0FBTjtBQUEyRDtBQUFFOztBQUV6Sjs7Ozs7OztBQU9BLElBQUksZ0JBQWdCLFFBQVEsYUFBUixHQUF3QixZQUFZO0FBQ3BELGFBQVMsYUFBVCxDQUF1QixFQUF2QixFQUEyQixNQUEzQixFQUFtQyxNQUFuQyxFQUEyQztBQUN2Qyx3QkFBZ0IsSUFBaEIsRUFBc0IsYUFBdEI7O0FBRUEsYUFBSyxHQUFMLEdBQVcsRUFBWDtBQUNBLFlBQUksdUJBQXVCLEtBQUssR0FBTCxDQUFTLHdCQUFULENBQWtDLEtBQUssR0FBTCxDQUFTLGVBQTNDLEVBQTRELEtBQUssR0FBTCxDQUFTLFVBQXJFLENBQTNCO0FBQ0EsYUFBSyxVQUFMLEdBQWtCLHFCQUFxQixTQUFyQixLQUFtQyxDQUFuQyxHQUF1QyxvREFBdkMsR0FBOEYsa0RBQWhIOztBQUVBLFlBQUksa0JBQWtCLEtBQUssR0FBTCxDQUFTLFlBQVQsQ0FBc0Isb0JBQXRCLENBQXRCO0FBQ0EsYUFBSyxlQUFMLEdBQXVCLElBQXZCO0FBQ0EsWUFBSSxtQkFBbUIsSUFBdkIsRUFBNkIsS0FBSyxlQUFMLEdBQXVCLEtBQUssR0FBTCxDQUFTLFlBQVQsQ0FBc0IsZ0JBQWdCLHNCQUF0QyxDQUF2Qjs7QUFFN0IsYUFBSyxJQUFMLEdBQVksRUFBWjtBQUNBLGFBQUssT0FBTCxHQUFlLElBQWY7O0FBRUEsYUFBSyxTQUFMLEdBQWlCLElBQWpCO0FBQ0EsYUFBSyxLQUFMLEdBQWEsSUFBYjtBQUNBLGFBQUssWUFBTCxHQUFvQixJQUFwQjtBQUNBLGFBQUssWUFBTCxHQUFvQixJQUFwQjtBQUNBLGFBQUssYUFBTCxHQUFxQixJQUFyQjtBQUNBLGFBQUssS0FBTCxHQUFhLElBQWI7QUFDQSxhQUFLLE1BQUwsR0FBYyxJQUFkO0FBQ0EsYUFBSyxVQUFMLEdBQWtCLEtBQWxCOztBQUVBLGFBQUssU0FBTCxHQUFpQixFQUFqQjs7QUFFQSxhQUFLLE1BQUwsR0FBYyxJQUFkLENBekJ1QyxDQXlCbkI7QUFDcEIsYUFBSyxlQUFMLEdBQXVCLElBQXZCO0FBQ0EsYUFBSyxPQUFMLEdBQWUsSUFBZjtBQUNBLGFBQUssV0FBTCxHQUFtQixJQUFuQjtBQUNBLGFBQUssYUFBTCxHQUFxQixDQUFyQjtBQUNBLGFBQUssWUFBTCxHQUFvQixDQUFwQjs7QUFFQSxZQUFJLFdBQVcsU0FBWCxJQUF3QixXQUFXLElBQXZDLEVBQTZDLEtBQUssZUFBTCxDQUFxQixNQUFyQixFQUE2QixNQUE3QjtBQUNoRDs7QUFFRDs7Ozs7O0FBT0EsaUJBQWEsYUFBYixFQUE0QixDQUFDO0FBQ3pCLGFBQUssaUJBRG9CO0FBRXpCLGVBQU8sU0FBUyxlQUFULENBQXlCLE1BQXpCLEVBQWlDLE1BQWpDLEVBQXlDO0FBQzVDLGdCQUFJLFVBQVUsWUFBWTtBQUN0QixvQkFBSSxlQUFlLEtBQUssS0FBSyxVQUFWLEdBQXVCLG1DQUF2QixHQUE2RCwyQkFBN0QsR0FBMkYscUJBQTNGLEdBQW1ILDZDQUFuSCxHQUFtSywyQ0FBbkssR0FBaU4sS0FBcE87QUFDQSxvQkFBSSxpQkFBaUIsK0NBQStDLEtBQUssVUFBcEQsR0FBaUUsY0FBYyxZQUFkLENBQTJCLG9CQUEzQixDQUFnRCxLQUFLLFNBQXJELENBQWpFLEdBQW1JLDJCQUFuSSxHQUFpSyw2QkFBakssR0FBaU0sMEJBQWpNLEdBQThOLHFCQUE5TixHQUFzUCxLQUF0UCxHQUE4UCxjQUFjLFlBQWQsQ0FBMkIsaUNBQTNCLEVBQTlQLEdBQStULGNBQWMsWUFBZCxDQUEyQixpQ0FBM0IsRUFBL1QsR0FBZ1ksS0FBSyxLQUFyWTs7QUFFckI7QUFDQSxxQ0FIcUIsR0FHRyxjQUFjLFlBQWQsQ0FBMkIscUJBQTNCLENBQWlELENBQWpELENBSEgsR0FHeUQsS0FBSyxPQUg5RCxHQUd3RSxjQUFjLFlBQWQsQ0FBMkIsc0JBQTNCLENBQWtELENBQWxELENBSHhFLEdBRytILEtBSHBKOztBQUtBLHFCQUFLLE1BQUwsR0FBYyxLQUFLLEdBQUwsQ0FBUyxhQUFULEVBQWQ7QUFDQSxvQkFBSSxTQUFTLElBQUksY0FBYyxZQUFsQixHQUFpQyxZQUFqQyxDQUE4QyxLQUFLLEdBQW5ELEVBQXdELFNBQXhELEVBQW1FLFlBQW5FLEVBQWlGLGNBQWpGLEVBQWlHLEtBQUssTUFBdEcsQ0FBYjs7QUFFQSxxQkFBSyxjQUFMLEdBQXNCLEtBQUssR0FBTCxDQUFTLGlCQUFULENBQTJCLEtBQUssTUFBaEMsRUFBd0MsaUJBQXhDLENBQXRCOztBQUVBLHFCQUFLLFlBQUwsR0FBb0IsS0FBSyxHQUFMLENBQVMsa0JBQVQsQ0FBNEIsS0FBSyxNQUFqQyxFQUF5QyxjQUF6QyxDQUFwQjs7QUFFQSxxQkFBSyxJQUFJLEdBQVQsSUFBZ0IsS0FBSyxTQUFyQixFQUFnQztBQUM1Qix3QkFBSSxlQUFlLEVBQUUsc0JBQXNCLFNBQXhCO0FBQ2YsNkNBQXFCLFNBRE47QUFFZixpQ0FBUyxTQUZNO0FBR2Ysa0NBQVUsU0FISztBQUlmLGdDQUFRLFNBSk8sR0FJSyxLQUFLLFNBQUwsQ0FBZSxHQUFmLEVBQW9CLElBSnpCLENBQW5COztBQU1BLGtDQUFjLFlBQWQsQ0FBMkIsMEJBQTNCLENBQXNELEtBQUssU0FBM0QsRUFBc0UsR0FBdEU7QUFDQSx5QkFBSyxTQUFMLENBQWUsR0FBZixFQUFvQixRQUFwQixHQUErQixDQUFDLEtBQUssR0FBTCxDQUFTLGtCQUFULENBQTRCLEtBQUssTUFBakMsRUFBeUMsSUFBSSxPQUFKLENBQVksUUFBWixFQUFzQixFQUF0QixDQUF6QyxDQUFELENBQS9CO0FBQ0EseUJBQUssU0FBTCxDQUFlLEdBQWYsRUFBb0IsWUFBcEIsR0FBbUMsWUFBbkM7QUFDSDs7QUFFRCx1QkFBTyxxQkFBcUIsWUFBckIsR0FBb0MsdUJBQXBDLEdBQThELGNBQXJFO0FBQ0gsYUEzQmEsQ0EyQlosSUEzQlksQ0EyQlAsSUEzQk8sQ0FBZDs7QUE2QkEsZ0JBQUksa0JBQWtCLE9BQU8sS0FBUCxDQUFhLEdBQWIsRUFBa0IsQ0FBbEIsRUFBcUIsS0FBckIsQ0FBMkIsR0FBM0IsRUFBZ0MsQ0FBaEMsRUFBbUMsS0FBbkMsQ0FBeUMsR0FBekMsQ0FBdEIsQ0E5QjRDLENBOEJ5Qjs7QUFFckUsaUJBQUssSUFBSSxJQUFJLENBQVIsRUFBVyxJQUFJLGdCQUFnQixNQUFwQyxFQUE0QyxJQUFJLENBQWhELEVBQW1ELEdBQW5ELEVBQXdEO0FBQ3BELG9CQUFJLGdCQUFnQixDQUFoQixFQUFtQixLQUFuQixDQUF5QixNQUF6QixNQUFxQyxJQUF6QyxFQUErQztBQUMzQyx3QkFBSSxVQUFVLGdCQUFnQixDQUFoQixFQUFtQixLQUFuQixDQUF5QixHQUF6QixFQUE4QixDQUE5QixFQUFpQyxJQUFqQyxFQUFkO0FBQ0Esa0NBQWMsWUFBZCxDQUEyQiwwQkFBM0IsQ0FBc0QsS0FBSyxTQUEzRCxFQUFzRSxPQUF0RTs7QUFFQSx3QkFBSSxnQkFBZ0IsQ0FBaEIsRUFBbUIsS0FBbkIsQ0FBeUIsVUFBekIsS0FBd0MsSUFBNUMsRUFBa0QsS0FBSyxTQUFMLENBQWUsT0FBZixFQUF3QixJQUF4QixHQUErQixvQkFBL0IsQ0FBbEQsS0FBMkcsSUFBSSxnQkFBZ0IsQ0FBaEIsRUFBbUIsS0FBbkIsQ0FBeUIsU0FBekIsS0FBdUMsSUFBM0MsRUFBaUQsS0FBSyxTQUFMLENBQWUsT0FBZixFQUF3QixJQUF4QixHQUErQixtQkFBL0I7QUFDL0osaUJBTEQsTUFLTyxJQUFJLGdCQUFnQixDQUFoQixNQUF1QixFQUEzQixFQUErQjtBQUNsQyx3QkFBSSxXQUFXLGdCQUFnQixDQUFoQixFQUFtQixLQUFuQixDQUF5QixHQUF6QixFQUE4QixDQUE5QixFQUFpQyxJQUFqQyxFQUFmO0FBQ0EseUJBQUssSUFBSSxHQUFULElBQWdCLEtBQUssU0FBckIsRUFBZ0M7QUFDNUIsNEJBQUksSUFBSSxPQUFKLENBQVksUUFBWixFQUFzQixFQUF0QixNQUE4QixRQUFsQyxFQUE0QztBQUN4Qyx1Q0FBVyxHQUFYLENBRHdDLENBQ3hCO0FBQ2hCO0FBQ0g7QUFDSjs7QUFFRCxrQ0FBYyxZQUFkLENBQTJCLDBCQUEzQixDQUFzRCxLQUFLLFNBQTNELEVBQXNFLFFBQXRFOztBQUVBLHdCQUFJLGdCQUFnQixDQUFoQixFQUFtQixLQUFuQixDQUF5QixVQUF6QixLQUF3QyxJQUE1QyxFQUFrRCxLQUFLLFNBQUwsQ0FBZSxRQUFmLEVBQXlCLElBQXpCLEdBQWdDLFFBQWhDLENBQWxELEtBQWdHLElBQUksZ0JBQWdCLENBQWhCLEVBQW1CLEtBQW5CLENBQXlCLFNBQXpCLEtBQXVDLElBQTNDLEVBQWlELEtBQUssU0FBTCxDQUFlLFFBQWYsRUFBeUIsSUFBekIsR0FBZ0MsT0FBaEMsQ0FBakQsS0FBOEYsSUFBSSxnQkFBZ0IsQ0FBaEIsRUFBbUIsS0FBbkIsQ0FBeUIsUUFBekIsS0FBc0MsSUFBMUMsRUFBZ0QsS0FBSyxTQUFMLENBQWUsUUFBZixFQUF5QixJQUF6QixHQUFnQyxNQUFoQztBQUNqUDtBQUNKOztBQUVEO0FBQ0EsaUJBQUssS0FBTCxHQUFhLFdBQVcsU0FBWCxJQUF3QixXQUFXLElBQW5DLEdBQTBDLE1BQTFDLEdBQW1ELEVBQWhFO0FBQ0EsaUJBQUssS0FBTCxHQUFhLEtBQUssS0FBTCxDQUFXLE9BQVgsQ0FBbUIsUUFBbkIsRUFBNkIsRUFBN0IsRUFBaUMsT0FBakMsQ0FBeUMsTUFBekMsRUFBaUQsRUFBakQsRUFBcUQsT0FBckQsQ0FBNkQsTUFBN0QsRUFBcUUsRUFBckUsQ0FBYjtBQUNBLGlCQUFLLEtBQUwsR0FBYSxjQUFjLFlBQWQsQ0FBMkIsV0FBM0IsQ0FBdUMsS0FBSyxLQUE1QyxFQUFtRCxLQUFLLFNBQXhELENBQWI7O0FBRUE7QUFDQSxpQkFBSyxPQUFMLEdBQWUsT0FBTyxPQUFQLENBQWUsUUFBZixFQUF5QixFQUF6QixFQUE2QixPQUE3QixDQUFxQyxNQUFyQyxFQUE2QyxFQUE3QyxFQUFpRCxPQUFqRCxDQUF5RCxNQUF6RCxFQUFpRSxFQUFqRSxDQUFmO0FBQ0EsaUJBQUssT0FBTCxHQUFlLEtBQUssT0FBTCxDQUFhLE9BQWIsQ0FBcUIsNEJBQXJCLEVBQW1ELEVBQW5ELEVBQXVELE9BQXZELENBQStELGNBQS9ELEVBQStFLEVBQS9FLENBQWY7QUFDQSxpQkFBSyxPQUFMLEdBQWUsY0FBYyxZQUFkLENBQTJCLFdBQTNCLENBQXVDLEtBQUssT0FBNUMsRUFBcUQsS0FBSyxTQUExRCxDQUFmOztBQUVBLGdCQUFJLEtBQUssU0FBVDs7QUFFQSxnQkFBSSxLQUFLLFVBQUwsS0FBb0IsSUFBeEIsRUFBOEIsUUFBUSxHQUFSLENBQVksZ0JBQWdCLEtBQUssSUFBakMsRUFBdUMsOEJBQXZDLEdBQXdFLFFBQVEsR0FBUixDQUFZLDZDQUFaLEVBQTJELGFBQTNELENBQXhFLEVBQW1KLFFBQVEsR0FBUixDQUFZLFFBQVEsTUFBUixHQUFpQixNQUE3QixFQUFxQyxhQUFyQyxDQUFuSixFQUF3TSxRQUFRLEdBQVIsQ0FBWSxvREFBWixFQUFrRSxpQkFBbEUsQ0FBeE0sRUFBOFIsUUFBUSxHQUFSLENBQVksUUFBUSxFQUFwQixFQUF3QixpQkFBeEIsQ0FBOVI7QUFDakM7QUFwRXdCLEtBQUQsQ0FBNUI7O0FBdUVBLFdBQU8sYUFBUDtBQUNILENBbkgyQyxFQUE1Qzs7QUFxSEEsT0FBTyxhQUFQLEdBQXVCLGFBQXZCO0FBQ0EsT0FBTyxPQUFQLENBQWUsYUFBZixHQUErQixhQUEvQjs7Ozs7O0FDMUlBOztBQUVBLE9BQU8sY0FBUCxDQUFzQixPQUF0QixFQUErQixZQUEvQixFQUE2QztBQUN6QyxXQUFPO0FBRGtDLENBQTdDOztBQUlBLElBQUksZUFBZSxZQUFZO0FBQUUsYUFBUyxnQkFBVCxDQUEwQixNQUExQixFQUFrQyxLQUFsQyxFQUF5QztBQUFFLGFBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxNQUFNLE1BQTFCLEVBQWtDLEdBQWxDLEVBQXVDO0FBQUUsZ0JBQUksYUFBYSxNQUFNLENBQU4sQ0FBakIsQ0FBMkIsV0FBVyxVQUFYLEdBQXdCLFdBQVcsVUFBWCxJQUF5QixLQUFqRCxDQUF3RCxXQUFXLFlBQVgsR0FBMEIsSUFBMUIsQ0FBZ0MsSUFBSSxXQUFXLFVBQWYsRUFBMkIsV0FBVyxRQUFYLEdBQXNCLElBQXRCLENBQTRCLE9BQU8sY0FBUCxDQUFzQixNQUF0QixFQUE4QixXQUFXLEdBQXpDLEVBQThDLFVBQTlDO0FBQTREO0FBQUUsS0FBQyxPQUFPLFVBQVUsV0FBVixFQUF1QixVQUF2QixFQUFtQyxXQUFuQyxFQUFnRDtBQUFFLFlBQUksVUFBSixFQUFnQixpQkFBaUIsWUFBWSxTQUE3QixFQUF3QyxVQUF4QyxFQUFxRCxJQUFJLFdBQUosRUFBaUIsaUJBQWlCLFdBQWpCLEVBQThCLFdBQTlCLEVBQTRDLE9BQU8sV0FBUDtBQUFxQixLQUFoTjtBQUFtTixDQUE5aEIsRUFBbkI7O0FBRUEsU0FBUyxlQUFULENBQXlCLFFBQXpCLEVBQW1DLFdBQW5DLEVBQWdEO0FBQUUsUUFBSSxFQUFFLG9CQUFvQixXQUF0QixDQUFKLEVBQXdDO0FBQUUsY0FBTSxJQUFJLFNBQUosQ0FBYyxtQ0FBZCxDQUFOO0FBQTJEO0FBQUU7O0FBRXpKOzs7OztBQUtBLElBQUksZUFBZSxRQUFRLFlBQVIsR0FBdUIsWUFBWTtBQUNsRCxhQUFTLFlBQVQsR0FBd0I7QUFDcEIsd0JBQWdCLElBQWhCLEVBQXNCLFlBQXRCO0FBQ0g7O0FBRUQ7Ozs7QUFLQSxpQkFBYSxZQUFiLEVBQTJCLENBQUM7QUFDeEIsYUFBSyxVQURtQjtBQUV4QixlQUFPLFNBQVMsUUFBVCxDQUFrQixJQUFsQixFQUF3QixNQUF4QixFQUFnQyxNQUFoQyxFQUF3QztBQUMzQyxnQkFBSSxJQUFJLFdBQVcsU0FBWCxJQUF3QixXQUFXLElBQW5DLEdBQTBDLEdBQTFDLEdBQWdELE1BQXhEO0FBQ0EsZ0JBQUksSUFBSSxXQUFXLFNBQVgsSUFBd0IsV0FBVyxJQUFuQyxHQUEwQyxHQUExQyxHQUFnRCxNQUF4RDtBQUNBLGlCQUFLLFdBQUwsR0FBbUIsQ0FBQyxDQUFDLENBQUYsRUFBSyxDQUFDLENBQU4sRUFBUyxHQUFULEVBQWMsQ0FBZCxFQUFpQixDQUFDLENBQWxCLEVBQXFCLEdBQXJCLEVBQTBCLENBQTFCLEVBQTZCLENBQTdCLEVBQWdDLEdBQWhDLEVBQXFDLENBQUMsQ0FBdEMsRUFBeUMsQ0FBekMsRUFBNEMsR0FBNUMsQ0FBbkI7O0FBRUEsaUJBQUssWUFBTCxHQUFvQixDQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWCxFQUFnQixHQUFoQixFQUFxQixHQUFyQixFQUEwQixHQUExQixFQUErQixHQUEvQixFQUFvQyxHQUFwQyxFQUF5QyxHQUF6QyxFQUE4QyxHQUE5QyxFQUFtRCxHQUFuRCxFQUF3RCxHQUF4RCxDQUFwQjs7QUFFQSxpQkFBSyxVQUFMLEdBQWtCLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLEVBQVUsQ0FBVixFQUFhLENBQWIsRUFBZ0IsQ0FBaEIsQ0FBbEI7O0FBRUEsZ0JBQUksYUFBYSxFQUFqQjtBQUNBLHVCQUFXLFdBQVgsR0FBeUIsS0FBSyxXQUE5QjtBQUNBLHVCQUFXLFlBQVgsR0FBMEIsS0FBSyxZQUEvQjtBQUNBLHVCQUFXLFVBQVgsR0FBd0IsS0FBSyxVQUE3Qjs7QUFFQSxtQkFBTyxVQUFQO0FBQ0g7QUFqQnVCLEtBQUQsRUFrQnhCO0FBQ0MsYUFBSyxjQUROOztBQUlDOzs7QUFHQSxlQUFPLFNBQVMsWUFBVCxDQUFzQixFQUF0QixFQUEwQixJQUExQixFQUFnQyxZQUFoQyxFQUE4QyxjQUE5QyxFQUE4RCxhQUE5RCxFQUE2RTtBQUNoRixnQkFBSSxNQUFNLEtBQVY7QUFBQSxnQkFDSSxNQUFNLEtBRFY7O0FBR0EsZ0JBQUksWUFBWSxVQUFVLE9BQVYsRUFBbUIsTUFBbkIsRUFBMkI7QUFDdkMsd0JBQVEsR0FBUixDQUFZLE9BQVo7O0FBRUEsb0JBQUksWUFBWSxFQUFoQjtBQUNBLG9CQUFJLFNBQVMsUUFBUSxLQUFSLENBQWMsSUFBZCxDQUFiO0FBQ0EscUJBQUssSUFBSSxJQUFJLENBQVIsRUFBVyxJQUFJLE9BQU8sTUFBM0IsRUFBbUMsSUFBSSxDQUF2QyxFQUEwQyxHQUExQyxFQUErQztBQUMzQyx3QkFBSSxPQUFPLENBQVAsRUFBVSxLQUFWLENBQWdCLFdBQWhCLEtBQWdDLElBQXBDLEVBQTBDO0FBQ3RDLDRCQUFJLE9BQU8sT0FBTyxDQUFQLEVBQVUsS0FBVixDQUFnQixHQUFoQixDQUFYO0FBQ0EsNEJBQUksT0FBTyxTQUFTLEtBQUssQ0FBTCxDQUFULENBQVg7QUFDQSxrQ0FBVSxJQUFWLENBQWUsQ0FBQyxJQUFELEVBQU8sT0FBTyxDQUFQLENBQVAsQ0FBZjtBQUNIO0FBQ0o7QUFDRCxvQkFBSSxPQUFPLEdBQUcsZUFBSCxDQUFtQixNQUFuQixFQUEyQixLQUEzQixDQUFpQyxJQUFqQyxDQUFYO0FBQ0EscUJBQUssT0FBTCxDQUFhLEVBQWI7QUFDQSxxQkFBSyxJQUFJLEtBQUssQ0FBVCxFQUFZLEtBQUssS0FBSyxNQUEzQixFQUFtQyxLQUFLLEVBQXhDLEVBQTRDLElBQTVDLEVBQWtEO0FBQzlDLHdCQUFJLGdCQUFnQixLQUFwQjtBQUNBLHdCQUFJLFdBQVcsRUFBZjtBQUNBLHlCQUFLLElBQUksSUFBSSxDQUFSLEVBQVcsS0FBSyxVQUFVLE1BQS9CLEVBQXVDLElBQUksRUFBM0MsRUFBK0MsR0FBL0MsRUFBb0Q7QUFDaEQsNEJBQUksT0FBTyxVQUFVLENBQVYsRUFBYSxDQUFiLENBQVgsRUFBNEI7QUFDeEIsNENBQWdCLElBQWhCO0FBQ0EsdUNBQVcsVUFBVSxDQUFWLEVBQWEsQ0FBYixDQUFYO0FBQ0E7QUFDSDtBQUNKO0FBQ0Qsd0JBQUksa0JBQWtCLEtBQXRCLEVBQTZCO0FBQ3pCLGdDQUFRLEdBQVIsQ0FBWSxPQUFPLEVBQVAsR0FBWSxLQUFaLEdBQW9CLEtBQUssRUFBTCxDQUFoQyxFQUEwQyxhQUExQyxFQUF5RCxZQUF6RDtBQUNILHFCQUZELE1BRU87QUFDSCxnQ0FBUSxHQUFSLENBQVksV0FBVyxFQUFYLEdBQWdCLEtBQWhCLEdBQXdCLEtBQUssRUFBTCxDQUF4QixHQUFtQyxNQUFuQyxHQUE0QyxRQUF4RCxFQUFrRSxXQUFsRSxFQUErRSxhQUEvRSxFQUE4RixZQUE5RixFQUE0RyxXQUE1RztBQUNIO0FBQ0o7QUFDSixhQTlCZSxDQThCZCxJQTlCYyxDQThCVCxJQTlCUyxDQUFoQjs7QUFnQ0EsZ0JBQUksZUFBZSxHQUFHLFlBQUgsQ0FBZ0IsR0FBRyxhQUFuQixDQUFuQjtBQUNBLGVBQUcsWUFBSCxDQUFnQixZQUFoQixFQUE4QixZQUE5QjtBQUNBLGVBQUcsYUFBSCxDQUFpQixZQUFqQjtBQUNBLGdCQUFJLENBQUMsR0FBRyxrQkFBSCxDQUFzQixZQUF0QixFQUFvQyxHQUFHLGNBQXZDLENBQUwsRUFBNkQ7QUFDekQsb0JBQUksVUFBVSxHQUFHLGdCQUFILENBQW9CLFlBQXBCLENBQWQ7QUFDQSx3QkFBUSxHQUFSLENBQVksT0FBTyxJQUFQLEdBQWMseUJBQTFCLEVBQXFELFdBQXJEOztBQUVBLG9CQUFJLFlBQVksU0FBWixJQUF5QixZQUFZLElBQXpDLEVBQStDLFVBQVUsT0FBVixFQUFtQixZQUFuQjtBQUNsRCxhQUxELE1BS087QUFDSCxtQkFBRyxZQUFILENBQWdCLGFBQWhCLEVBQStCLFlBQS9CO0FBQ0Esc0JBQU0sSUFBTjtBQUNIOztBQUVELGdCQUFJLGlCQUFpQixHQUFHLFlBQUgsQ0FBZ0IsR0FBRyxlQUFuQixDQUFyQjtBQUNBLGVBQUcsWUFBSCxDQUFnQixjQUFoQixFQUFnQyxjQUFoQztBQUNBLGVBQUcsYUFBSCxDQUFpQixjQUFqQjtBQUNBLGdCQUFJLENBQUMsR0FBRyxrQkFBSCxDQUFzQixjQUF0QixFQUFzQyxHQUFHLGNBQXpDLENBQUwsRUFBK0Q7QUFDM0Qsb0JBQUksV0FBVyxHQUFHLGdCQUFILENBQW9CLGNBQXBCLENBQWY7QUFDQSx3QkFBUSxHQUFSLENBQVksT0FBTyxJQUFQLEdBQWMsMkJBQTFCLEVBQXVELFdBQXZEOztBQUVBLG9CQUFJLGFBQWEsU0FBYixJQUEwQixhQUFhLElBQTNDLEVBQWlELFVBQVUsUUFBVixFQUFvQixjQUFwQjtBQUNwRCxhQUxELE1BS087QUFDSCxtQkFBRyxZQUFILENBQWdCLGFBQWhCLEVBQStCLGNBQS9CO0FBQ0Esc0JBQU0sSUFBTjtBQUNIOztBQUVELGdCQUFJLFFBQVEsSUFBUixJQUFnQixRQUFRLElBQTVCLEVBQWtDO0FBQzlCLG1CQUFHLFdBQUgsQ0FBZSxhQUFmO0FBQ0Esb0JBQUksVUFBVSxHQUFHLG1CQUFILENBQXVCLGFBQXZCLEVBQXNDLEdBQUcsV0FBekMsQ0FBZDtBQUNBLG9CQUFJLE9BQUosRUFBYTtBQUNULDJCQUFPLElBQVA7QUFDSCxpQkFGRCxNQUVPO0FBQ0gsNEJBQVEsR0FBUixDQUFZLDBCQUEwQixJQUExQixHQUFpQyxNQUE3QztBQUNBLHdCQUFJLE1BQU0sR0FBRyxpQkFBSCxDQUFxQixhQUFyQixDQUFWO0FBQ0Esd0JBQUksUUFBUSxTQUFSLElBQXFCLFFBQVEsSUFBakMsRUFBdUMsUUFBUSxHQUFSLENBQVksR0FBWjtBQUN2QywyQkFBTyxLQUFQO0FBQ0g7QUFDSixhQVhELE1BV087QUFDSCx1QkFBTyxLQUFQO0FBQ0g7QUFDSjtBQW5GRixLQWxCd0IsRUFzR3hCO0FBQ0MsYUFBSyxNQUROOztBQUlDOzs7QUFHQSxlQUFPLFNBQVMsSUFBVCxDQUFjLENBQWQsRUFBaUI7QUFDcEIsZ0JBQUksT0FBTyxDQUFDLE1BQU0sS0FBUCxFQUFjLE1BQU0sS0FBcEIsRUFBMkIsTUFBTSxLQUFqQyxFQUF3QyxHQUF4QyxDQUFYOztBQUVBLGdCQUFJLElBQUksQ0FBUjtBQUNBLGdCQUFJLElBQUksS0FBSyxLQUFMLENBQVcsSUFBSSxLQUFmLENBQVI7QUFDQSxnQkFBSSxJQUFJLEtBQUssS0FBTCxDQUFXLElBQUksS0FBZixDQUFSO0FBQ0EsZ0JBQUksSUFBSSxLQUFLLEtBQUwsQ0FBVyxJQUFJLEtBQWYsQ0FBUjtBQUNBLGdCQUFJLFNBQVMsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLENBQWI7O0FBRUEsZ0JBQUksS0FBSyxDQUFDLE9BQU8sQ0FBUCxJQUFZLEtBQUssQ0FBTCxDQUFiLEVBQXNCLE9BQU8sQ0FBUCxJQUFZLEtBQUssQ0FBTCxDQUFsQyxFQUEyQyxPQUFPLENBQVAsSUFBWSxLQUFLLENBQUwsQ0FBdkQsRUFBZ0UsT0FBTyxDQUFQLElBQVksS0FBSyxDQUFMLENBQTVFLENBQVQ7O0FBRUEsbUJBQU8sQ0FBQyxPQUFPLENBQVAsSUFBWSxHQUFHLENBQUgsQ0FBYixFQUFvQixPQUFPLENBQVAsSUFBWSxHQUFHLENBQUgsQ0FBaEMsRUFBdUMsT0FBTyxDQUFQLElBQVksR0FBRyxDQUFILENBQW5ELEVBQTBELE9BQU8sQ0FBUCxJQUFZLEdBQUcsQ0FBSCxDQUF0RSxDQUFQO0FBQ0g7QUFuQkYsS0F0R3dCLEVBMEh4QjtBQUNDLGFBQUssUUFETjs7QUFJQzs7O0FBR0EsZUFBTyxTQUFTLE1BQVQsQ0FBZ0IsTUFBaEIsRUFBd0I7QUFDM0IsZ0JBQUksWUFBWSxDQUFDLEdBQUQsRUFBTSxNQUFNLEtBQVosRUFBbUIsT0FBTyxRQUFRLEtBQWYsQ0FBbkIsRUFBMEMsT0FBTyxRQUFRLEtBQVIsR0FBZ0IsS0FBdkIsQ0FBMUMsQ0FBaEI7QUFDQSxtQkFBTyxLQUFLLElBQUwsQ0FBVSxNQUFWLEVBQWtCLFNBQWxCLENBQVA7QUFDSDtBQVZGLEtBMUh3QixDQUEzQixFQXFJSSxDQUFDO0FBQ0QsYUFBSywyQkFESjs7QUFJRDs7Ozs7QUFLQSxlQUFPLFNBQVMseUJBQVQsQ0FBbUMsTUFBbkMsRUFBMkMsTUFBM0MsRUFBbUQ7QUFDdEQsZ0JBQUksS0FBSyxJQUFUO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkEsZ0JBQUksTUFBTSxJQUFWLEVBQWdCO0FBQ1osb0JBQUk7QUFDQSx3QkFBSSxXQUFXLFNBQVgsSUFBd0IsV0FBVyxJQUF2QyxFQUE2QyxLQUFLLE9BQU8sVUFBUCxDQUFrQixPQUFsQixDQUFMLENBQTdDLEtBQWtGLEtBQUssT0FBTyxVQUFQLENBQWtCLE9BQWxCLEVBQTJCLE1BQTNCLENBQUw7O0FBRWxGLDRCQUFRLEdBQVIsQ0FBWSxNQUFNLElBQU4sR0FBYSxVQUFiLEdBQTBCLGFBQXRDO0FBQ0gsaUJBSkQsQ0FJRSxPQUFPLENBQVAsRUFBVTtBQUNSLHlCQUFLLElBQUw7QUFDSDtBQUNKO0FBQ0QsZ0JBQUksTUFBTSxJQUFWLEVBQWdCO0FBQ1osb0JBQUk7QUFDQSx3QkFBSSxXQUFXLFNBQVgsSUFBd0IsV0FBVyxJQUF2QyxFQUE2QyxLQUFLLE9BQU8sVUFBUCxDQUFrQixvQkFBbEIsQ0FBTCxDQUE3QyxLQUErRixLQUFLLE9BQU8sVUFBUCxDQUFrQixvQkFBbEIsRUFBd0MsTUFBeEMsQ0FBTDs7QUFFL0YsNEJBQVEsR0FBUixDQUFZLE1BQU0sSUFBTixHQUFhLHVCQUFiLEdBQXVDLDBCQUFuRDtBQUNILGlCQUpELENBSUUsT0FBTyxDQUFQLEVBQVU7QUFDUix5QkFBSyxJQUFMO0FBQ0g7QUFDSjtBQUNELGdCQUFJLE1BQU0sSUFBVixFQUFnQixLQUFLLEtBQUw7QUFDaEIsbUJBQU8sRUFBUDtBQUNIO0FBL0NBLEtBQUQsRUFnREQ7QUFDQyxhQUFLLG1DQUROOztBQUlDOzs7OztBQUtBLGVBQU8sU0FBUyxpQ0FBVCxDQUEyQyxZQUEzQyxFQUF5RDtBQUM1RCxnQkFBSSxJQUFJLFNBQVMsYUFBVCxDQUF1QixRQUF2QixDQUFSO0FBQ0EsY0FBRSxLQUFGLEdBQVUsYUFBYSxLQUF2QjtBQUNBLGNBQUUsTUFBRixHQUFXLGFBQWEsTUFBeEI7QUFDQSxnQkFBSSxZQUFZLEVBQUUsVUFBRixDQUFhLElBQWIsQ0FBaEI7QUFDQSxzQkFBVSxTQUFWLENBQW9CLFlBQXBCLEVBQWtDLENBQWxDLEVBQXFDLENBQXJDO0FBQ0EsZ0JBQUksV0FBVyxVQUFVLFlBQVYsQ0FBdUIsQ0FBdkIsRUFBMEIsQ0FBMUIsRUFBNkIsYUFBYSxLQUExQyxFQUFpRCxhQUFhLE1BQTlELENBQWY7O0FBRUEsbUJBQU8sU0FBUyxJQUFoQjtBQUNIO0FBbEJGLEtBaERDLEVBbUVEO0FBQ0MsYUFBSyxNQUROOztBQUlDOzs7QUFHQSxlQUFPLFNBQVMsSUFBVCxDQUFjLFFBQWQsRUFBd0IsUUFBeEIsRUFBa0M7QUFDckMsbUJBQU8sU0FBUyxDQUFULElBQWMsU0FBUyxDQUFULENBQWQsR0FBNEIsU0FBUyxDQUFULElBQWMsU0FBUyxDQUFULENBQTFDLEdBQXdELFNBQVMsQ0FBVCxJQUFjLFNBQVMsQ0FBVCxDQUF0RSxHQUFvRixTQUFTLENBQVQsSUFBYyxTQUFTLENBQVQsQ0FBekc7QUFDSDtBQVRGLEtBbkVDLEVBNkVEO0FBQ0MsYUFBSyxPQUROOztBQUlDOzs7QUFHQSxlQUFPLFNBQVMsS0FBVCxDQUFlLE1BQWYsRUFBdUI7QUFDMUIsbUJBQU8sU0FBUyxDQUFULEdBQWEsU0FBUyxLQUFLLEtBQUwsQ0FBVyxNQUFYLENBQXRCLEdBQTJDLFNBQVMsS0FBSyxJQUFMLENBQVUsTUFBVixDQUEzRDtBQUNIO0FBVEYsS0E3RUMsRUF1RkQ7QUFDQyxhQUFLLHdCQUROOztBQUlDOzs7O0FBSUEsZUFBTyxTQUFTLHNCQUFULEdBQWtDO0FBQ3JDLG1CQUFPLGdDQUFnQyx1Q0FBaEMsR0FBMEUsZ0JBQTFFLEdBQTZGLGdCQUE3RixHQUFnSCxTQUFoSCxHQUE0SCxvQkFBNUgsR0FBbUosK0JBQW5KLEdBQXFMLCtCQUFyTCxHQUF1TiwrQkFBdk4sR0FBeVAsbUNBQXpQLEdBQStSLHlDQUEvUixHQUEyVSxLQUFsVjtBQUNIO0FBVkYsS0F2RkMsRUFrR0Q7QUFDQyxhQUFLLDBCQUROOztBQUlDOzs7O0FBSUEsZUFBTyxTQUFTLHdCQUFULEdBQW9DO0FBQ3ZDLG1CQUFPLG1DQUFtQyxvQ0FBbkMsR0FBMEUsZ0JBQTFFLEdBQTZGLDBCQUE3RixHQUEwSCxtQ0FBMUgsR0FBZ0ssa0NBQWhLLEdBQXFNLEtBQTVNO0FBQ0g7QUFWRixLQWxHQyxFQTZHRDtBQUNDLGFBQUssa0JBRE47O0FBSUM7Ozs7OztBQU1BLGVBQU8sU0FBUyxnQkFBVCxDQUEwQixJQUExQixFQUFnQyxPQUFoQyxFQUF5QztBQUM1QyxnQkFBSSxhQUFhLElBQWpCO0FBQ0EsZ0JBQUksS0FBSyxNQUFMLEtBQWdCLFNBQWhCLElBQTZCLEtBQUssTUFBTCxLQUFnQixJQUFqRCxFQUF1RDtBQUNuRCw2QkFBYSxFQUFiO0FBQ0Esb0JBQUksS0FBSyxNQUFMLENBQVksQ0FBWixLQUFrQixJQUF0QixFQUE0QjtBQUN4Qix5QkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEtBQUssTUFBTCxDQUFZLE1BQWhDLEVBQXdDLEdBQXhDLEVBQTZDO0FBQ3pDO0FBQ0E7O0FBRUEsbUNBQVcsQ0FBWCxJQUFnQixRQUFRLEtBQUssTUFBTCxDQUFZLENBQVosQ0FBUixDQUFoQjtBQUNIO0FBQ0osaUJBUEQsTUFPTyxhQUFhLElBQWI7QUFDVjtBQUNELG1CQUFPLFVBQVA7QUFDSDtBQXhCRixLQTdHQyxFQXNJRDtBQUNDLGFBQUssYUFETjs7QUFJQzs7Ozs7O0FBTUEsZUFBTyxTQUFTLFdBQVQsQ0FBcUIsTUFBckIsRUFBNkIsTUFBN0IsRUFBcUM7QUFDeEMsaUJBQUssSUFBSSxHQUFULElBQWdCLE1BQWhCLEVBQXdCO0FBQ3BCLG9CQUFJLFNBQVMsSUFBSSxNQUFKLENBQVcsTUFBTSxrQkFBakIsRUFBcUMsSUFBckMsQ0FBYixDQURvQixDQUNxQztBQUN6RCxvQkFBSSxhQUFhLE9BQU8sS0FBUCxDQUFhLE1BQWIsQ0FBakIsQ0FGb0IsQ0FFbUI7QUFDdkM7QUFDQSxvQkFBSSxjQUFjLElBQWxCLEVBQXdCO0FBQ3BCLHlCQUFLLElBQUksS0FBSyxDQUFULEVBQVksS0FBSyxXQUFXLE1BQWpDLEVBQXlDLEtBQUssRUFBOUMsRUFBa0QsSUFBbEQsRUFBd0Q7QUFDcEQ7QUFDQSw0QkFBSSxpQkFBaUIsSUFBSSxNQUFKLENBQVcsb0JBQW9CLFdBQVcsRUFBWCxDQUFwQixHQUFxQyx1QkFBaEQsRUFBeUUsSUFBekUsQ0FBckI7QUFDQSw0QkFBSSx3QkFBd0IsT0FBTyxLQUFQLENBQWEsY0FBYixDQUE1QjtBQUNBLDRCQUFJLHlCQUF5QixJQUE3QixFQUFtQztBQUMvQixnQ0FBSSxPQUFPLFdBQVcsRUFBWCxFQUFlLEtBQWYsQ0FBcUIsR0FBckIsRUFBMEIsQ0FBMUIsQ0FBWDtBQUNBLGdDQUFJLE9BQU8sV0FBVyxFQUFYLEVBQWUsS0FBZixDQUFxQixHQUFyQixFQUEwQixDQUExQixFQUE2QixLQUE3QixDQUFtQyxHQUFuQyxFQUF3QyxDQUF4QyxDQUFYOztBQUVBLGdDQUFJLE1BQU0sRUFBRSxzQkFBc0IsT0FBTyxPQUFQLENBQWUsT0FBTyxHQUFQLEdBQWEsSUFBYixHQUFvQixHQUFuQyxFQUF3QyxlQUFlLElBQWYsR0FBc0IsR0FBdEIsR0FBNEIsSUFBNUIsR0FBbUMsR0FBM0UsQ0FBeEI7QUFDTixxREFBcUIsT0FBTyxPQUFQLENBQWUsT0FBTyxHQUFQLEdBQWEsSUFBYixHQUFvQixHQUFuQyxFQUF3QyxlQUFlLElBQWYsR0FBc0IsR0FBdEIsR0FBNEIsSUFBNUIsR0FBbUMsS0FBM0UsQ0FEZjtBQUVOLG1EQUFtQixPQUFPLE9BQVAsQ0FBZSxPQUFPLEdBQVAsR0FBYSxJQUFiLEdBQW9CLEdBQW5DLEVBQXdDLElBQXhDLENBRmI7QUFHTixrREFBa0IsT0FBTyxPQUFQLENBQWUsT0FBTyxHQUFQLEdBQWEsSUFBYixHQUFvQixHQUFuQyxFQUF3QyxJQUF4QyxDQUhaLEVBQVY7QUFJQSxxQ0FBUyxJQUFJLE9BQU8sR0FBUCxFQUFZLElBQWhCLENBQVQ7QUFDSDtBQUNKO0FBQ0o7QUFDSjtBQUNELHFCQUFTLE9BQU8sT0FBUCxDQUFlLGlCQUFmLEVBQWtDLEVBQWxDLEVBQXNDLE9BQXRDLENBQThDLE9BQTlDLEVBQXVELEVBQXZELEVBQTJELE9BQTNELENBQW1FLEtBQW5FLEVBQTBFLEtBQTFFLEVBQWlGLE9BQWpGLENBQXlGLEtBQXpGLEVBQWdHLEtBQWhHLEVBQXVHLE9BQXZHLENBQStHLEtBQS9HLEVBQXNILEtBQXRILENBQVQ7QUFDQSxtQkFBTyxNQUFQO0FBQ0g7QUFuQ0YsS0F0SUMsRUEwS0Q7QUFDQyxhQUFLLG9CQUROOztBQUlDOzs7O0FBSUEsZUFBTyxTQUFTLGtCQUFULENBQTRCLE1BQTVCLEVBQW9DO0FBQ3ZDLGdCQUFJLE1BQU0sRUFBVjtBQUNBLGlCQUFLLElBQUksR0FBVCxJQUFnQixNQUFoQixFQUF3QjtBQUNwQix1QkFBTyxFQUFFLHNCQUFzQix1QkFBdUIsR0FBdkIsR0FBNkIsR0FBckQ7QUFDSCx5Q0FBcUIsdUJBQXVCLEdBQXZCLEdBQTZCLEdBRC9DO0FBRUgsdUNBQW1CLG9CQUFvQixHQUFwQixHQUEwQixHQUYxQztBQUdILHNDQUFrQixxQkFBcUIsR0FBckIsR0FBMkIsR0FIMUM7QUFJSCw2QkFBUyxtQkFBbUIsR0FBbkIsR0FBeUIsR0FKL0I7QUFLSCw4QkFBVSxrQkFBa0IsR0FBbEIsR0FBd0IsR0FML0I7QUFNSCw0QkFBUSxrQkFBa0IsR0FBbEIsR0FBd0IsR0FON0IsR0FNbUMsT0FBTyxHQUFQLEVBQVksSUFOL0MsSUFNdUQsSUFOOUQ7QUFPSDtBQUNELG1CQUFPLEdBQVA7QUFDSDtBQXBCRixLQTFLQyxFQStMRDtBQUNDLGFBQUssc0JBRE47O0FBSUM7Ozs7QUFJQSxlQUFPLFNBQVMsb0JBQVQsQ0FBOEIsTUFBOUIsRUFBc0M7QUFDekMsZ0JBQUksTUFBTSxFQUFWO0FBQ0EsaUJBQUssSUFBSSxHQUFULElBQWdCLE1BQWhCLEVBQXdCO0FBQ3BCLHVCQUFPLEVBQUUsc0JBQXNCLHVCQUF1QixHQUF2QixHQUE2QixHQUFyRDtBQUNILHlDQUFxQix1QkFBdUIsR0FBdkIsR0FBNkIsR0FEL0M7QUFFSCw2QkFBUyxtQkFBbUIsR0FBbkIsR0FBeUIsR0FGL0I7QUFHSCw4QkFBVSxrQkFBa0IsR0FBbEIsR0FBd0IsR0FIL0I7QUFJSCw0QkFBUSxrQkFBa0IsR0FBbEIsR0FBd0IsR0FKN0IsR0FJbUMsT0FBTyxHQUFQLEVBQVksSUFKL0MsSUFJdUQsSUFKOUQ7QUFLSDtBQUNELG1CQUFPLEdBQVA7QUFDSDtBQWxCRixLQS9MQyxFQWtORDtBQUNDLGFBQUssdUJBRE47O0FBSUM7Ozs7QUFJQSxlQUFPLFNBQVMscUJBQVQsQ0FBK0IsY0FBL0IsRUFBK0M7QUFDbEQsZ0JBQUksTUFBTSxFQUFWO0FBQ0EsaUJBQUssSUFBSSxJQUFJLENBQVIsRUFBVyxLQUFLLGNBQXJCLEVBQXFDLElBQUksRUFBekMsRUFBNkMsR0FBN0MsRUFBa0Q7QUFDOUMsdUJBQU8sS0FBSyxXQUFMLEdBQW1CLENBQW5CLEdBQXVCLHdCQUF2QixHQUFrRCxVQUFsRCxHQUErRCxDQUEvRCxHQUFtRSxZQUExRTtBQUNIO0FBQ0QsbUJBQU8sR0FBUDtBQUNIO0FBZEYsS0FsTkMsRUFpT0Q7QUFDQyxhQUFLLDRCQUROO0FBRUMsZUFBTyxTQUFTLDBCQUFULENBQW9DLGNBQXBDLEVBQW9EO0FBQ3ZELGdCQUFJLE1BQU0sRUFBVjtBQUNBLGlCQUFLLElBQUksSUFBSSxDQUFSLEVBQVcsS0FBSyxjQUFyQixFQUFxQyxJQUFJLEVBQXpDLEVBQTZDLEdBQTdDLEVBQWtEO0FBQzlDLHVCQUFPLEtBQUssb0JBQUwsR0FBNEIsQ0FBNUIsR0FBZ0MsbUJBQWhDLEdBQXNELENBQXRELEdBQTBELEtBQWpFO0FBQ0g7QUFDRCxtQkFBTyxHQUFQO0FBQ0g7QUFSRixLQWpPQyxFQTBPRDtBQUNDLGFBQUssd0JBRE47O0FBSUM7Ozs7QUFJQSxlQUFPLFNBQVMsc0JBQVQsQ0FBZ0MsY0FBaEMsRUFBZ0Q7QUFDbkQsZ0JBQUksTUFBTSxFQUFWO0FBQ0EsaUJBQUssSUFBSSxJQUFJLENBQVIsRUFBVyxLQUFLLGNBQXJCLEVBQXFDLElBQUksRUFBekMsRUFBNkMsR0FBN0MsRUFBa0Q7QUFDOUMsdUJBQU8sS0FBSyxRQUFMLEdBQWdCLENBQWhCLEdBQW9CLG9DQUFwQixHQUEyRCxDQUEzRCxHQUErRCxjQUEvRCxHQUFnRixDQUFoRixHQUFvRix3QkFBcEYsR0FBK0csb0JBQS9HLEdBQXNJLENBQXRJLEdBQTBJLFNBQTFJLEdBQXNKLENBQXRKLEdBQTBKLFlBQWpLO0FBQ0g7QUFDRCxtQkFBTyxHQUFQO0FBQ0g7QUFkRixLQTFPQyxFQXlQRDtBQUNDLGFBQUssNEJBRE47O0FBSUM7Ozs7O0FBS0EsZUFBTyxTQUFTLDBCQUFULENBQW9DLFFBQXBDLEVBQThDLE9BQTlDLEVBQXVEO0FBQzFELGdCQUFJLFNBQVMsY0FBVCxDQUF3QixPQUF4QixNQUFxQyxLQUF6QyxFQUFnRDtBQUM1Qyx5QkFBUyxPQUFULElBQW9CO0FBQ2hCLDRCQUFRLElBRFE7QUFFaEIsb0NBQWdCLElBRkEsRUFFTTtBQUN0QixnQ0FBWSxJQUhJLEVBQXBCO0FBSUg7QUFDSjtBQWhCRixLQXpQQyxFQTBRRDtBQUNDLGFBQUssbUNBRE47O0FBSUM7OztBQUdBLGVBQU8sU0FBUyxpQ0FBVCxHQUE2QztBQUNoRCxtQkFBTyxLQUFLLDJFQUFMLEdBQW1GLG9DQUFuRixHQUEwSCw4Q0FBMUgsR0FBMkssNENBQTNLLEdBQTBOLHVEQUExTixHQUFvUiwyQkFBcFIsR0FBa1QsS0FBelQ7QUFDSDtBQVRGLEtBMVFDLEVBb1JEO0FBQ0MsYUFBSyxtQ0FETjs7QUFJQzs7O0FBR0EsZUFBTyxTQUFTLGlDQUFULEdBQTZDO0FBQ2hELG1CQUFPLEtBQUssb0RBQUwsR0FBNEQsb0NBQTVELEdBQW1HLG9EQUFuRyxHQUEwSixpREFBMUosR0FBOE0sMkJBQTlNLEdBQTRPLEtBQW5QO0FBQ0g7QUFURixLQXBSQyxDQXJJSjs7QUFxYUEsV0FBTyxZQUFQO0FBQ0gsQ0FoYnlDLEVBQTFDOztBQWtiQSxPQUFPLFlBQVAsR0FBc0IsWUFBdEI7QUFDQSxPQUFPLE9BQVAsQ0FBZSxZQUFmLEdBQThCLFlBQTlCOzs7Ozs7QUNsY0E7O0FBRUEsT0FBTyxjQUFQLENBQXNCLE9BQXRCLEVBQStCLFlBQS9CLEVBQTZDO0FBQ3pDLFdBQU87QUFEa0MsQ0FBN0M7QUFHQSxRQUFRLDRCQUFSLEdBQXVDLFNBQXZDOztBQUVBLElBQUksZUFBZSxZQUFZO0FBQUUsYUFBUyxnQkFBVCxDQUEwQixNQUExQixFQUFrQyxLQUFsQyxFQUF5QztBQUFFLGFBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxNQUFNLE1BQTFCLEVBQWtDLEdBQWxDLEVBQXVDO0FBQUUsZ0JBQUksYUFBYSxNQUFNLENBQU4sQ0FBakIsQ0FBMkIsV0FBVyxVQUFYLEdBQXdCLFdBQVcsVUFBWCxJQUF5QixLQUFqRCxDQUF3RCxXQUFXLFlBQVgsR0FBMEIsSUFBMUIsQ0FBZ0MsSUFBSSxXQUFXLFVBQWYsRUFBMkIsV0FBVyxRQUFYLEdBQXNCLElBQXRCLENBQTRCLE9BQU8sY0FBUCxDQUFzQixNQUF0QixFQUE4QixXQUFXLEdBQXpDLEVBQThDLFVBQTlDO0FBQTREO0FBQUUsS0FBQyxPQUFPLFVBQVUsV0FBVixFQUF1QixVQUF2QixFQUFtQyxXQUFuQyxFQUFnRDtBQUFFLFlBQUksVUFBSixFQUFnQixpQkFBaUIsWUFBWSxTQUE3QixFQUF3QyxVQUF4QyxFQUFxRCxJQUFJLFdBQUosRUFBaUIsaUJBQWlCLFdBQWpCLEVBQThCLFdBQTlCLEVBQTRDLE9BQU8sV0FBUDtBQUFxQixLQUFoTjtBQUFtTixDQUE5aEIsRUFBbkI7O0FBRUEsSUFBSSxnQkFBZ0IsUUFBUSxzQkFBUixDQUFwQjs7QUFFQSxTQUFTLGVBQVQsQ0FBeUIsUUFBekIsRUFBbUMsV0FBbkMsRUFBZ0Q7QUFBRSxRQUFJLEVBQUUsb0JBQW9CLFdBQXRCLENBQUosRUFBd0M7QUFBRSxjQUFNLElBQUksU0FBSixDQUFjLG1DQUFkLENBQU47QUFBMkQ7QUFBRTs7QUFFeko7Ozs7Ozs7OztBQVNBLElBQUksK0JBQStCLFFBQVEsNEJBQVIsR0FBdUMsWUFBWTtBQUNsRixhQUFTLDRCQUFULENBQXNDLEVBQXRDLEVBQTBDLFlBQTFDLEVBQXdELFlBQXhELEVBQXNFLGNBQXRFLEVBQXNGLGNBQXRGLEVBQXNHO0FBQ2xHLHdCQUFnQixJQUFoQixFQUFzQiw0QkFBdEI7O0FBRUEsYUFBSyxHQUFMLEdBQVcsRUFBWDtBQUNBLFlBQUksdUJBQXVCLEtBQUssR0FBTCxDQUFTLHdCQUFULENBQWtDLEtBQUssR0FBTCxDQUFTLGVBQTNDLEVBQTRELEtBQUssR0FBTCxDQUFTLFVBQXJFLENBQTNCO0FBQ0EsYUFBSyxVQUFMLEdBQWtCLHFCQUFxQixTQUFyQixLQUFtQyxDQUFuQyxHQUF1QyxvREFBdkMsR0FBOEYsa0RBQWhIOztBQUVBLFlBQUksa0JBQWtCLEtBQUssR0FBTCxDQUFTLFlBQVQsQ0FBc0Isb0JBQXRCLENBQXRCO0FBQ0EsYUFBSyxlQUFMLEdBQXVCLElBQXZCO0FBQ0EsWUFBSSxtQkFBbUIsSUFBdkIsRUFBNkIsS0FBSyxlQUFMLEdBQXVCLEtBQUssR0FBTCxDQUFTLFlBQVQsQ0FBc0IsZ0JBQWdCLHNCQUF0QyxDQUF2Qjs7QUFFN0IsYUFBSyxJQUFMLEdBQVksRUFBWjtBQUNBLGFBQUssVUFBTCxHQUFrQixLQUFsQjs7QUFFQSxhQUFLLGdCQUFMLEdBQXdCLEVBQXhCO0FBQ0EsYUFBSyxrQkFBTCxHQUEwQixFQUExQjs7QUFFQSxhQUFLLGNBQUwsR0FBc0IsS0FBdEI7QUFDQSxhQUFLLGdCQUFMLEdBQXdCLEtBQXhCOztBQUVBLGFBQUssV0FBTCxHQUFtQixJQUFuQjtBQUNBLGFBQUssYUFBTCxHQUFxQixJQUFyQjtBQUNBLGFBQUssYUFBTCxHQUFxQixJQUFyQjtBQUNBLGFBQUssZUFBTCxHQUF1QixJQUF2Qjs7QUFFQSxhQUFLLE1BQUwsR0FBYyxJQUFkLENBekJrRyxDQXlCOUU7QUFDcEIsYUFBSyxlQUFMLEdBQXVCLElBQXZCO0FBQ0EsYUFBSyxPQUFMLEdBQWUsSUFBZjtBQUNBLGFBQUssV0FBTCxHQUFtQixJQUFuQjs7QUFFQSxhQUFLLFFBQUwsR0FBZ0IsQ0FBaEI7O0FBRUEsWUFBSSxpQkFBaUIsU0FBakIsSUFBOEIsaUJBQWlCLElBQW5ELEVBQXlELEtBQUssZUFBTCxDQUFxQixZQUFyQixFQUFtQyxZQUFuQzs7QUFFekQsWUFBSSxtQkFBbUIsU0FBbkIsSUFBZ0MsbUJBQW1CLElBQXZELEVBQTZELEtBQUssaUJBQUwsQ0FBdUIsY0FBdkIsRUFBdUMsY0FBdkM7QUFDaEU7O0FBRUQ7Ozs7QUFLQSxpQkFBYSw0QkFBYixFQUEyQyxDQUFDO0FBQ3hDLGFBQUssNkJBRG1DO0FBRXhDLGVBQU8sU0FBUywyQkFBVCxHQUF1QztBQUMxQyxnQkFBSSxlQUFlLEtBQUssS0FBSyxVQUFWLEdBQXVCLDBCQUF2QixHQUFvRCw2QkFBcEQsR0FBb0YsY0FBYyxZQUFkLENBQTJCLGtCQUEzQixDQUE4QyxLQUFLLGdCQUFuRCxDQUFwRixHQUEySixjQUFjLFlBQWQsQ0FBMkIsd0JBQTNCLEVBQTNKLEdBQW1OLGNBQWMsWUFBZCxDQUEyQixpQ0FBM0IsRUFBbk4sR0FBb1IsY0FBYyxZQUFkLENBQTJCLGlDQUEzQixFQUFwUixHQUFxVixLQUFLLFdBQTFWLEdBQXdXLHFCQUF4VyxHQUFnWSxLQUFLLGFBQXJZLEdBQXFaLEtBQXhhO0FBQ0EsZ0JBQUksaUJBQWlCLCtDQUErQyxLQUFLLFVBQXBELEdBQWlFLGNBQWMsWUFBZCxDQUEyQixvQkFBM0IsQ0FBZ0QsS0FBSyxrQkFBckQsQ0FBakUsR0FBNEksY0FBYyxZQUFkLENBQTJCLGlDQUEzQixFQUE1SSxHQUE2TSxjQUFjLFlBQWQsQ0FBMkIsaUNBQTNCLEVBQTdNLEdBQThRLEtBQUssYUFBblI7O0FBRXJCO0FBQ0EsaUNBSHFCLEdBR0csY0FBYyxZQUFkLENBQTJCLHFCQUEzQixDQUFpRCxDQUFqRCxDQUhILEdBR3lELEtBQUssZUFIOUQsR0FHZ0YsY0FBYyxZQUFkLENBQTJCLHNCQUEzQixDQUFrRCxDQUFsRCxDQUhoRixHQUd1SSxLQUg1Sjs7QUFLQSxpQkFBSyxxQkFBTCxHQUE2QixLQUFLLEdBQUwsQ0FBUyxhQUFULEVBQTdCO0FBQ0EsZ0JBQUksU0FBUyxJQUFJLGNBQWMsWUFBbEIsR0FBaUMsWUFBakMsQ0FBOEMsS0FBSyxHQUFuRCxFQUF3RCxpQ0FBeEQsRUFBMkYsWUFBM0YsRUFBeUcsY0FBekcsRUFBeUgsS0FBSyxxQkFBOUgsQ0FBYjs7QUFFQSxpQkFBSyxPQUFMLEdBQWUsS0FBSyxHQUFMLENBQVMsa0JBQVQsQ0FBNEIsS0FBSyxxQkFBakMsRUFBd0QsU0FBeEQsQ0FBZjtBQUNBLGlCQUFLLFlBQUwsR0FBb0IsS0FBSyxHQUFMLENBQVMsa0JBQVQsQ0FBNEIsS0FBSyxxQkFBakMsRUFBd0QsY0FBeEQsQ0FBcEI7O0FBRUEsaUJBQUssSUFBSSxHQUFULElBQWdCLEtBQUssZ0JBQXJCLEVBQXVDO0FBQ25DLG9CQUFJLGVBQWUsRUFBRSxzQkFBc0IsU0FBeEI7QUFDZix5Q0FBcUIsU0FETjtBQUVmLHVDQUFtQixXQUZKO0FBR2Ysc0NBQWtCLFdBSEg7QUFJZiw2QkFBUyxTQUpNO0FBS2YsOEJBQVUsU0FMSztBQU1mLDRCQUFRLFNBTk8sR0FNSyxLQUFLLGdCQUFMLENBQXNCLEdBQXRCLEVBQTJCLElBTmhDLENBQW5COztBQVFBLDhCQUFjLFlBQWQsQ0FBMkIsMEJBQTNCLENBQXNELEtBQUssZ0JBQTNELEVBQTZFLEdBQTdFO0FBQ0Esb0JBQUksTUFBTSxpQkFBaUIsV0FBakIsR0FBK0IsS0FBSyxHQUFMLENBQVMsaUJBQVQsQ0FBMkIsS0FBSyxxQkFBaEMsRUFBdUQsR0FBdkQsQ0FBL0IsR0FBNkYsS0FBSyxHQUFMLENBQVMsa0JBQVQsQ0FBNEIsS0FBSyxxQkFBakMsRUFBd0QsSUFBSSxPQUFKLENBQVksUUFBWixFQUFzQixFQUF0QixDQUF4RCxDQUF2RztBQUNBLHFCQUFLLGdCQUFMLENBQXNCLEdBQXRCLEVBQTJCLFFBQTNCLEdBQXNDLENBQUMsR0FBRCxDQUF0QztBQUNBLHFCQUFLLGdCQUFMLENBQXNCLEdBQXRCLEVBQTJCLFlBQTNCLEdBQTBDLFlBQTFDO0FBQ0g7O0FBRUQsaUJBQUssSUFBSSxJQUFULElBQWlCLEtBQUssa0JBQXRCLEVBQTBDO0FBQ3RDLG9CQUFJLGdCQUFnQixFQUFFLHNCQUFzQixTQUF4QjtBQUNoQix5Q0FBcUIsU0FETDtBQUVoQiw2QkFBUyxTQUZPO0FBR2hCLDhCQUFVLFNBSE07QUFJaEIsNEJBQVEsU0FKUSxHQUlJLEtBQUssa0JBQUwsQ0FBd0IsSUFBeEIsRUFBOEIsSUFKbEMsQ0FBcEI7O0FBTUEsOEJBQWMsWUFBZCxDQUEyQiwwQkFBM0IsQ0FBc0QsS0FBSyxrQkFBM0QsRUFBK0UsSUFBL0U7QUFDQSxxQkFBSyxrQkFBTCxDQUF3QixJQUF4QixFQUE4QixRQUE5QixHQUF5QyxDQUFDLEtBQUssR0FBTCxDQUFTLGtCQUFULENBQTRCLEtBQUsscUJBQWpDLEVBQXdELEtBQUssT0FBTCxDQUFhLFFBQWIsRUFBdUIsRUFBdkIsQ0FBeEQsQ0FBRCxDQUF6QztBQUNBLHFCQUFLLGtCQUFMLENBQXdCLElBQXhCLEVBQThCLFlBQTlCLEdBQTZDLGFBQTdDO0FBQ0g7O0FBRUQsbUJBQU8scUJBQXFCLFlBQXJCLEdBQW9DLHVCQUFwQyxHQUE4RCxjQUFyRTtBQUNIO0FBM0N1QyxLQUFELEVBNEN4QztBQUNDLGFBQUssaUJBRE47O0FBSUM7Ozs7O0FBS0EsZUFBTyxTQUFTLGVBQVQsQ0FBeUIsWUFBekIsRUFBdUMsWUFBdkMsRUFBcUQ7QUFDeEQsZ0JBQUksa0JBQWtCLGFBQWEsS0FBYixDQUFtQixHQUFuQixFQUF3QixDQUF4QixFQUEyQixLQUEzQixDQUFpQyxHQUFqQyxFQUFzQyxDQUF0QyxFQUF5QyxLQUF6QyxDQUErQyxHQUEvQyxDQUF0QixDQUR3RCxDQUNtQjs7QUFFM0UsaUJBQUssSUFBSSxJQUFJLENBQVIsRUFBVyxJQUFJLGdCQUFnQixNQUFwQyxFQUE0QyxJQUFJLENBQWhELEVBQW1ELEdBQW5ELEVBQXdEO0FBQ3BELG9CQUFJLGdCQUFnQixDQUFoQixFQUFtQixLQUFuQixDQUF5QixVQUF6QixNQUF5QyxJQUE3QyxFQUFtRDtBQUMvQyx3QkFBSSxVQUFVLGdCQUFnQixDQUFoQixFQUFtQixLQUFuQixDQUF5QixPQUF6QixFQUFrQyxDQUFsQyxFQUFxQyxJQUFyQyxFQUFkO0FBQ0Esa0NBQWMsWUFBZCxDQUEyQiwwQkFBM0IsQ0FBc0QsS0FBSyxnQkFBM0QsRUFBNkUsT0FBN0U7O0FBRUEsd0JBQUksZ0JBQWdCLENBQWhCLEVBQW1CLEtBQW5CLENBQXlCLFVBQXpCLEtBQXdDLElBQTVDLEVBQWtELEtBQUssZ0JBQUwsQ0FBc0IsT0FBdEIsRUFBK0IsSUFBL0IsR0FBc0MsaUJBQXRDLENBQWxELEtBQStHLElBQUksZ0JBQWdCLENBQWhCLEVBQW1CLEtBQW5CLENBQXlCLFNBQXpCLEtBQXVDLElBQTNDLEVBQWlELEtBQUssZ0JBQUwsQ0FBc0IsT0FBdEIsRUFBK0IsSUFBL0IsR0FBc0MsZ0JBQXRDO0FBQ25LLGlCQUxELE1BS08sSUFBSSxnQkFBZ0IsQ0FBaEIsRUFBbUIsS0FBbkIsQ0FBeUIsTUFBekIsTUFBcUMsSUFBekMsRUFBK0M7QUFDbEQsd0JBQUksV0FBVyxnQkFBZ0IsQ0FBaEIsRUFBbUIsS0FBbkIsQ0FBeUIsR0FBekIsRUFBOEIsQ0FBOUIsRUFBaUMsSUFBakMsRUFBZjtBQUNBLGtDQUFjLFlBQWQsQ0FBMkIsMEJBQTNCLENBQXNELEtBQUssZ0JBQTNELEVBQTZFLFFBQTdFOztBQUVBLHdCQUFJLGdCQUFnQixDQUFoQixFQUFtQixLQUFuQixDQUF5QixVQUF6QixLQUF3QyxJQUE1QyxFQUFrRCxLQUFLLGdCQUFMLENBQXNCLFFBQXRCLEVBQWdDLElBQWhDLEdBQXVDLG9CQUF2QyxDQUFsRCxLQUFtSCxJQUFJLGdCQUFnQixDQUFoQixFQUFtQixLQUFuQixDQUF5QixTQUF6QixLQUF1QyxJQUEzQyxFQUFpRCxLQUFLLGdCQUFMLENBQXNCLFFBQXRCLEVBQWdDLElBQWhDLEdBQXVDLG1CQUF2QztBQUN2SyxpQkFMTSxNQUtBLElBQUksZ0JBQWdCLENBQWhCLE1BQXVCLEVBQTNCLEVBQStCO0FBQ2xDLHdCQUFJLFlBQVksZ0JBQWdCLENBQWhCLEVBQW1CLEtBQW5CLENBQXlCLEdBQXpCLEVBQThCLENBQTlCLEVBQWlDLElBQWpDLEVBQWhCO0FBQ0EseUJBQUssSUFBSSxHQUFULElBQWdCLEtBQUssZ0JBQXJCLEVBQXVDO0FBQ25DLDRCQUFJLElBQUksT0FBSixDQUFZLFFBQVosRUFBc0IsRUFBdEIsTUFBOEIsU0FBbEMsRUFBNkM7QUFDekMsd0NBQVksR0FBWixDQUR5QyxDQUN4QjtBQUNqQjtBQUNIO0FBQ0o7O0FBRUQsa0NBQWMsWUFBZCxDQUEyQiwwQkFBM0IsQ0FBc0QsS0FBSyxnQkFBM0QsRUFBNkUsU0FBN0U7O0FBRUEsd0JBQUksZ0JBQWdCLENBQWhCLEVBQW1CLEtBQW5CLENBQXlCLFVBQXpCLEtBQXdDLElBQTVDLEVBQWtELEtBQUssZ0JBQUwsQ0FBc0IsU0FBdEIsRUFBaUMsSUFBakMsR0FBd0MsUUFBeEMsQ0FBbEQsS0FBd0csSUFBSSxnQkFBZ0IsQ0FBaEIsRUFBbUIsS0FBbkIsQ0FBeUIsU0FBekIsS0FBdUMsSUFBM0MsRUFBaUQsS0FBSyxnQkFBTCxDQUFzQixTQUF0QixFQUFpQyxJQUFqQyxHQUF3QyxPQUF4QyxDQUFqRCxLQUFzRyxJQUFJLGdCQUFnQixDQUFoQixFQUFtQixLQUFuQixDQUF5QixRQUF6QixLQUFzQyxJQUExQyxFQUFnRCxLQUFLLGdCQUFMLENBQXNCLFNBQXRCLEVBQWlDLElBQWpDLEdBQXdDLE1BQXhDO0FBQ2pRO0FBQ0o7O0FBRUQ7QUFDQSxpQkFBSyxXQUFMLEdBQW1CLGlCQUFpQixTQUFqQixJQUE4QixpQkFBaUIsSUFBL0MsR0FBc0QsWUFBdEQsR0FBcUUsRUFBeEY7QUFDQSxpQkFBSyxXQUFMLEdBQW1CLEtBQUssV0FBTCxDQUFpQixPQUFqQixDQUF5QixRQUF6QixFQUFtQyxFQUFuQyxFQUF1QyxPQUF2QyxDQUErQyxNQUEvQyxFQUF1RCxFQUF2RCxFQUEyRCxPQUEzRCxDQUFtRSxNQUFuRSxFQUEyRSxFQUEzRSxDQUFuQjtBQUNBLGlCQUFLLFdBQUwsR0FBbUIsY0FBYyxZQUFkLENBQTJCLFdBQTNCLENBQXVDLEtBQUssV0FBNUMsRUFBeUQsS0FBSyxnQkFBOUQsQ0FBbkI7O0FBRUE7QUFDQSxpQkFBSyxhQUFMLEdBQXFCLGFBQWEsT0FBYixDQUFxQixRQUFyQixFQUErQixFQUEvQixFQUFtQyxPQUFuQyxDQUEyQyxNQUEzQyxFQUFtRCxFQUFuRCxFQUF1RCxPQUF2RCxDQUErRCxNQUEvRCxFQUF1RSxFQUF2RSxDQUFyQjtBQUNBLGlCQUFLLGFBQUwsR0FBcUIsS0FBSyxhQUFMLENBQW1CLE9BQW5CLENBQTJCLDRCQUEzQixFQUF5RCxFQUF6RCxFQUE2RCxPQUE3RCxDQUFxRSxjQUFyRSxFQUFxRixFQUFyRixDQUFyQjtBQUNBLGlCQUFLLGFBQUwsR0FBcUIsY0FBYyxZQUFkLENBQTJCLFdBQTNCLENBQXVDLEtBQUssYUFBNUMsRUFBMkQsS0FBSyxnQkFBaEUsQ0FBckI7O0FBRUEsaUJBQUssY0FBTCxHQUFzQixJQUF0QjtBQUNBLGdCQUFJLEtBQUssZ0JBQUwsS0FBMEIsSUFBOUIsRUFBb0M7QUFDaEMsb0JBQUksS0FBSyxLQUFLLDJCQUFMLEVBQVQ7O0FBRUEsb0JBQUksS0FBSyxVQUFMLEtBQW9CLElBQXhCLEVBQThCLFFBQVEsR0FBUixDQUFZLGFBQWEsS0FBSyxJQUE5QixFQUFvQywrQkFBcEMsR0FBc0UsUUFBUSxHQUFSLENBQVksNkNBQVosRUFBMkQsYUFBM0QsQ0FBdEUsRUFBaUosUUFBUSxHQUFSLENBQVksUUFBUSxZQUFSLEdBQXVCLFlBQW5DLEVBQWlELGFBQWpELENBQWpKLEVBQWtOLFFBQVEsR0FBUixDQUFZLG9EQUFaLEVBQWtFLGlCQUFsRSxDQUFsTixFQUF3UyxRQUFRLEdBQVIsQ0FBWSxRQUFRLEVBQXBCLEVBQXdCLGlCQUF4QixDQUF4UztBQUNqQztBQUNKO0FBdERGLEtBNUN3QyxFQW1HeEM7QUFDQyxhQUFLLG1CQUROOztBQUlDOzs7OztBQUtBLGVBQU8sU0FBUyxpQkFBVCxDQUEyQixjQUEzQixFQUEyQyxjQUEzQyxFQUEyRDtBQUM5RCxnQkFBSSxrQkFBa0IsZUFBZSxLQUFmLENBQXFCLEdBQXJCLEVBQTBCLENBQTFCLEVBQTZCLEtBQTdCLENBQW1DLEdBQW5DLEVBQXdDLENBQXhDLEVBQTJDLEtBQTNDLENBQWlELEdBQWpELENBQXRCLENBRDhELENBQ2U7O0FBRTdFLGlCQUFLLElBQUksSUFBSSxDQUFSLEVBQVcsSUFBSSxnQkFBZ0IsTUFBcEMsRUFBNEMsSUFBSSxDQUFoRCxFQUFtRCxHQUFuRCxFQUF3RDtBQUNwRCxvQkFBSSxnQkFBZ0IsQ0FBaEIsRUFBbUIsS0FBbkIsQ0FBeUIsTUFBekIsTUFBcUMsSUFBekMsRUFBK0M7QUFDM0Msd0JBQUksVUFBVSxnQkFBZ0IsQ0FBaEIsRUFBbUIsS0FBbkIsQ0FBeUIsR0FBekIsRUFBOEIsQ0FBOUIsRUFBaUMsSUFBakMsRUFBZDtBQUNBLGtDQUFjLFlBQWQsQ0FBMkIsMEJBQTNCLENBQXNELEtBQUssa0JBQTNELEVBQStFLE9BQS9FOztBQUVBLHdCQUFJLGdCQUFnQixDQUFoQixFQUFtQixLQUFuQixDQUF5QixVQUF6QixLQUF3QyxJQUE1QyxFQUFrRCxLQUFLLGtCQUFMLENBQXdCLE9BQXhCLEVBQWlDLElBQWpDLEdBQXdDLG9CQUF4QyxDQUFsRCxLQUFvSCxJQUFJLGdCQUFnQixDQUFoQixFQUFtQixLQUFuQixDQUF5QixTQUF6QixLQUF1QyxJQUEzQyxFQUFpRCxLQUFLLGtCQUFMLENBQXdCLE9BQXhCLEVBQWlDLElBQWpDLEdBQXdDLG1CQUF4QztBQUN4SyxpQkFMRCxNQUtPLElBQUksZ0JBQWdCLENBQWhCLE1BQXVCLEVBQTNCLEVBQStCO0FBQ2xDLHdCQUFJLFlBQVksZ0JBQWdCLENBQWhCLEVBQW1CLEtBQW5CLENBQXlCLEdBQXpCLEVBQThCLENBQTlCLEVBQWlDLElBQWpDLEVBQWhCO0FBQ0EseUJBQUssSUFBSSxHQUFULElBQWdCLEtBQUssa0JBQXJCLEVBQXlDO0FBQ3JDLDRCQUFJLElBQUksT0FBSixDQUFZLFFBQVosRUFBc0IsRUFBdEIsTUFBOEIsU0FBbEMsRUFBNkM7QUFDekMsd0NBQVksR0FBWixDQUR5QyxDQUN4QjtBQUNqQjtBQUNIO0FBQ0o7O0FBRUQsa0NBQWMsWUFBZCxDQUEyQiwwQkFBM0IsQ0FBc0QsS0FBSyxrQkFBM0QsRUFBK0UsU0FBL0U7O0FBRUEsd0JBQUksZ0JBQWdCLENBQWhCLEVBQW1CLEtBQW5CLENBQXlCLFVBQXpCLEtBQXdDLElBQTVDLEVBQWtELEtBQUssa0JBQUwsQ0FBd0IsU0FBeEIsRUFBbUMsSUFBbkMsR0FBMEMsUUFBMUMsQ0FBbEQsS0FBMEcsSUFBSSxnQkFBZ0IsQ0FBaEIsRUFBbUIsS0FBbkIsQ0FBeUIsU0FBekIsS0FBdUMsSUFBM0MsRUFBaUQsS0FBSyxrQkFBTCxDQUF3QixTQUF4QixFQUFtQyxJQUFuQyxHQUEwQyxPQUExQyxDQUFqRCxLQUF3RyxJQUFJLGdCQUFnQixDQUFoQixFQUFtQixLQUFuQixDQUF5QixRQUF6QixLQUFzQyxJQUExQyxFQUFnRCxLQUFLLGtCQUFMLENBQXdCLFNBQXhCLEVBQW1DLElBQW5DLEdBQTBDLE1BQTFDO0FBQ3JRO0FBQ0o7O0FBRUQ7QUFDQSxpQkFBSyxhQUFMLEdBQXFCLG1CQUFtQixTQUFuQixJQUFnQyxtQkFBbUIsSUFBbkQsR0FBMEQsY0FBMUQsR0FBMkUsRUFBaEc7QUFDQSxpQkFBSyxhQUFMLEdBQXFCLEtBQUssYUFBTCxDQUFtQixPQUFuQixDQUEyQixRQUEzQixFQUFxQyxFQUFyQyxFQUF5QyxPQUF6QyxDQUFpRCxNQUFqRCxFQUF5RCxFQUF6RCxFQUE2RCxPQUE3RCxDQUFxRSxNQUFyRSxFQUE2RSxFQUE3RSxDQUFyQjtBQUNBLGlCQUFLLGFBQUwsR0FBcUIsY0FBYyxZQUFkLENBQTJCLFdBQTNCLENBQXVDLEtBQUssYUFBNUMsRUFBMkQsS0FBSyxrQkFBaEUsQ0FBckI7O0FBRUE7QUFDQSxpQkFBSyxlQUFMLEdBQXVCLGVBQWUsT0FBZixDQUF1QixRQUF2QixFQUFpQyxFQUFqQyxFQUFxQyxPQUFyQyxDQUE2QyxNQUE3QyxFQUFxRCxFQUFyRCxFQUF5RCxPQUF6RCxDQUFpRSxNQUFqRSxFQUF5RSxFQUF6RSxDQUF2QjtBQUNBLGlCQUFLLGVBQUwsR0FBdUIsS0FBSyxlQUFMLENBQXFCLE9BQXJCLENBQTZCLDRCQUE3QixFQUEyRCxFQUEzRCxFQUErRCxPQUEvRCxDQUF1RSxjQUF2RSxFQUF1RixFQUF2RixDQUF2QjtBQUNBLGlCQUFLLGVBQUwsR0FBdUIsY0FBYyxZQUFkLENBQTJCLFdBQTNCLENBQXVDLEtBQUssZUFBNUMsRUFBNkQsS0FBSyxrQkFBbEUsQ0FBdkI7O0FBRUEsaUJBQUssZ0JBQUwsR0FBd0IsSUFBeEI7QUFDQSxnQkFBSSxLQUFLLGNBQUwsS0FBd0IsSUFBNUIsRUFBa0M7QUFDOUIsb0JBQUksS0FBSyxLQUFLLDJCQUFMLEVBQVQ7O0FBRUEsb0JBQUksS0FBSyxVQUFMLEtBQW9CLElBQXhCLEVBQThCLFFBQVEsR0FBUixDQUFZLFVBQVosRUFBd0IsK0JBQXhCLEdBQTBELFFBQVEsR0FBUixDQUFZLDZDQUFaLEVBQTJELGFBQTNELENBQTFELEVBQXFJLFFBQVEsR0FBUixDQUFZLFFBQVEsY0FBUixHQUF5QixjQUFyQyxFQUFxRCxhQUFyRCxDQUFySSxFQUEwTSxRQUFRLEdBQVIsQ0FBWSxvREFBWixFQUFrRSxpQkFBbEUsQ0FBMU0sRUFBZ1MsUUFBUSxHQUFSLENBQVksUUFBUSxFQUFwQixFQUF3QixpQkFBeEIsQ0FBaFM7QUFDakM7QUFDSjtBQWpERixLQW5Hd0MsQ0FBM0M7O0FBdUpBLFdBQU8sNEJBQVA7QUFDSCxDQW5NeUUsRUFBMUU7O0FBcU1BLE9BQU8sNEJBQVAsR0FBc0MsNEJBQXRDO0FBQ0EsT0FBTyxPQUFQLENBQWUsNEJBQWYsR0FBOEMsNEJBQTlDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc31yZXR1cm4gZX0pKCkiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5XZWJDTEdMID0gdW5kZWZpbmVkO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpOyAvKlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVGhlIE1JVCBMaWNlbnNlIChNSVQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIENvcHlyaWdodCAoYykgPDIwMTM+IDxSb2JlcnRvIEdvbnphbGV6LiBodHRwOi8vc3Rvcm1jb2xvdXIuYXBwc3BvdC5jb20vPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUSEUgU09GVFdBUkUuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cblxudmFyIF9XZWJDTEdMQnVmZmVyID0gcmVxdWlyZShcIi4vV2ViQ0xHTEJ1ZmZlci5jbGFzc1wiKTtcblxudmFyIF9XZWJDTEdMS2VybmVsID0gcmVxdWlyZShcIi4vV2ViQ0xHTEtlcm5lbC5jbGFzc1wiKTtcblxudmFyIF9XZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtID0gcmVxdWlyZShcIi4vV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbS5jbGFzc1wiKTtcblxudmFyIF9XZWJDTEdMVXRpbHMgPSByZXF1aXJlKFwiLi9XZWJDTEdMVXRpbHMuY2xhc3NcIik7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbi8qKlxyXG4qIENsYXNzIGZvciBwYXJhbGxlbGl6YXRpb24gb2YgY2FsY3VsYXRpb25zIHVzaW5nIHRoZSBXZWJHTCBjb250ZXh0IHNpbWlsYXJseSB0byB3ZWJjbFxyXG4qIEBjbGFzc1xyXG4qIEBwYXJhbSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBbd2ViZ2xjb250ZXh0PW51bGxdXHJcbiovXG52YXIgV2ViQ0xHTCA9IGV4cG9ydHMuV2ViQ0xHTCA9IGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBXZWJDTEdMKHdlYmdsY29udGV4dCkge1xuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgV2ViQ0xHTCk7XG5cbiAgICAgICAgdGhpcy51dGlscyA9IG5ldyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscygpO1xuXG4gICAgICAgIHRoaXMuX2dsID0gbnVsbDtcbiAgICAgICAgdGhpcy5lID0gbnVsbDtcbiAgICAgICAgaWYgKHdlYmdsY29udGV4dCA9PT0gdW5kZWZpbmVkIHx8IHdlYmdsY29udGV4dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgICAgICB0aGlzLmUud2lkdGggPSAzMjtcbiAgICAgICAgICAgIHRoaXMuZS5oZWlnaHQgPSAzMjtcbiAgICAgICAgICAgIHRoaXMuX2dsID0gX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuZ2V0V2ViR0xDb250ZXh0RnJvbUNhbnZhcyh0aGlzLmUsIHsgYW50aWFsaWFzOiBmYWxzZSB9KTtcbiAgICAgICAgfSBlbHNlIHRoaXMuX2dsID0gd2ViZ2xjb250ZXh0O1xuXG4gICAgICAgIHRoaXMuX2FyckV4dCA9IHsgXCJPRVNfdGV4dHVyZV9mbG9hdFwiOiBudWxsLCBcIk9FU190ZXh0dXJlX2Zsb2F0X2xpbmVhclwiOiBudWxsLCBcIk9FU19lbGVtZW50X2luZGV4X3VpbnRcIjogbnVsbCwgXCJXRUJHTF9kcmF3X2J1ZmZlcnNcIjogbnVsbCB9O1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5fYXJyRXh0KSB7XG4gICAgICAgICAgICB0aGlzLl9hcnJFeHRba2V5XSA9IHRoaXMuX2dsLmdldEV4dGVuc2lvbihrZXkpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2FyckV4dFtrZXldID09IG51bGwpIGNvbnNvbGUuZXJyb3IoXCJleHRlbnNpb24gXCIgKyBrZXkgKyBcIiBub3QgYXZhaWxhYmxlXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX21heERyYXdCdWZmZXJzID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMuX2FyckV4dC5oYXNPd25Qcm9wZXJ0eShcIldFQkdMX2RyYXdfYnVmZmVyc1wiKSAmJiB0aGlzLl9hcnJFeHRbXCJXRUJHTF9kcmF3X2J1ZmZlcnNcIl0gIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fbWF4RHJhd0J1ZmZlcnMgPSB0aGlzLl9nbC5nZXRQYXJhbWV0ZXIodGhpcy5fYXJyRXh0W1wiV0VCR0xfZHJhd19idWZmZXJzXCJdLk1BWF9EUkFXX0JVRkZFUlNfV0VCR0wpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJNYXggZHJhdyBidWZmZXJzOiBcIiArIHRoaXMuX21heERyYXdCdWZmZXJzKTtcbiAgICAgICAgfSBlbHNlIGNvbnNvbGUubG9nKFwiTWF4IGRyYXcgYnVmZmVyczogMVwiKTtcblxuICAgICAgICB2YXIgaGlnaFByZWNpc2lvblN1cHBvcnQgPSB0aGlzLl9nbC5nZXRTaGFkZXJQcmVjaXNpb25Gb3JtYXQodGhpcy5fZ2wuRlJBR01FTlRfU0hBREVSLCB0aGlzLl9nbC5ISUdIX0ZMT0FUKTtcbiAgICAgICAgdGhpcy5wcmVjaXNpb24gPSBoaWdoUHJlY2lzaW9uU3VwcG9ydC5wcmVjaXNpb24gIT09IDAgPyAncHJlY2lzaW9uIGhpZ2hwIGZsb2F0O1xcblxcbnByZWNpc2lvbiBoaWdocCBpbnQ7XFxuXFxuJyA6ICdwcmVjaXNpb24gbG93cCBmbG9hdDtcXG5cXG5wcmVjaXNpb24gbG93cCBpbnQ7XFxuXFxuJztcbiAgICAgICAgLy90aGlzLnByZWNpc2lvbiA9ICcjdmVyc2lvbiAzMDAgZXNcXG5wcmVjaXNpb24gaGlnaHAgZmxvYXQ7XFxuXFxucHJlY2lzaW9uIGhpZ2hwIGludDtcXG5cXG4nO1xuICAgICAgICB0aGlzLl9jdXJyZW50VGV4dHVyZVVuaXQgPSAwO1xuICAgICAgICB0aGlzLl9idWZmZXJXaWR0aCA9IDA7XG5cbiAgICAgICAgLy8gUVVBRFxuICAgICAgICB2YXIgbWVzaCA9IHRoaXMudXRpbHMubG9hZFF1YWQodW5kZWZpbmVkLCAxLjAsIDEuMCk7XG4gICAgICAgIHRoaXMudmVydGV4QnVmZmVyX1FVQUQgPSB0aGlzLl9nbC5jcmVhdGVCdWZmZXIoKTtcbiAgICAgICAgdGhpcy5fZ2wuYmluZEJ1ZmZlcih0aGlzLl9nbC5BUlJBWV9CVUZGRVIsIHRoaXMudmVydGV4QnVmZmVyX1FVQUQpO1xuICAgICAgICB0aGlzLl9nbC5idWZmZXJEYXRhKHRoaXMuX2dsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheShtZXNoLnZlcnRleEFycmF5KSwgdGhpcy5fZ2wuU1RBVElDX0RSQVcpO1xuICAgICAgICB0aGlzLmluZGV4QnVmZmVyX1FVQUQgPSB0aGlzLl9nbC5jcmVhdGVCdWZmZXIoKTtcbiAgICAgICAgdGhpcy5fZ2wuYmluZEJ1ZmZlcih0aGlzLl9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgdGhpcy5pbmRleEJ1ZmZlcl9RVUFEKTtcbiAgICAgICAgdGhpcy5fZ2wuYnVmZmVyRGF0YSh0aGlzLl9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbmV3IFVpbnQxNkFycmF5KG1lc2guaW5kZXhBcnJheSksIHRoaXMuX2dsLlNUQVRJQ19EUkFXKTtcblxuICAgICAgICB0aGlzLmFycmF5Q29weVRleCA9IFtdO1xuXG4gICAgICAgIC8vIFNIQURFUiBSRUFEUElYRUxTXG4gICAgICAgIHZhciBzb3VyY2VWZXJ0ZXggPSB0aGlzLnByZWNpc2lvbiArICdhdHRyaWJ1dGUgdmVjMyBhVmVydGV4UG9zaXRpb247XFxuJyArICd2YXJ5aW5nIHZlYzIgdkNvb3JkO1xcbicgKyAndm9pZCBtYWluKHZvaWQpIHtcXG4nICsgJ2dsX1Bvc2l0aW9uID0gdmVjNChhVmVydGV4UG9zaXRpb24sIDEuMCk7XFxuJyArICd2Q29vcmQgPSBhVmVydGV4UG9zaXRpb24ueHkqMC41KzAuNTtcXG4nICsgJ31cXG4nO1xuICAgICAgICB2YXIgc291cmNlRnJhZ21lbnQgPSB0aGlzLnByZWNpc2lvbiArICd1bmlmb3JtIHNhbXBsZXIyRCBzYW1wbGVyX2J1ZmZlcjtcXG4nICsgJ3ZhcnlpbmcgdmVjMiB2Q29vcmQ7XFxuJyArXG5cbiAgICAgICAgLy8nb3V0IHZlYzQgZnJhZ21lbnRDb2xvcjsnK1xuICAgICAgICAndm9pZCBtYWluKHZvaWQpIHtcXG4nICsgJ2dsX0ZyYWdDb2xvciA9IHRleHR1cmUyRChzYW1wbGVyX2J1ZmZlciwgdkNvb3JkKTsnICsgJ31cXG4nO1xuXG4gICAgICAgIHRoaXMuc2hhZGVyX3JlYWRwaXhlbHMgPSB0aGlzLl9nbC5jcmVhdGVQcm9ncmFtKCk7XG4gICAgICAgIHRoaXMudXRpbHMuY3JlYXRlU2hhZGVyKHRoaXMuX2dsLCBcIkNMR0xSRUFEUElYRUxTXCIsIHNvdXJjZVZlcnRleCwgc291cmNlRnJhZ21lbnQsIHRoaXMuc2hhZGVyX3JlYWRwaXhlbHMpO1xuXG4gICAgICAgIHRoaXMuYXR0cl9WZXJ0ZXhQb3MgPSB0aGlzLl9nbC5nZXRBdHRyaWJMb2NhdGlvbih0aGlzLnNoYWRlcl9yZWFkcGl4ZWxzLCBcImFWZXJ0ZXhQb3NpdGlvblwiKTtcbiAgICAgICAgdGhpcy5zYW1wbGVyX2J1ZmZlciA9IHRoaXMuX2dsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnNoYWRlcl9yZWFkcGl4ZWxzLCBcInNhbXBsZXJfYnVmZmVyXCIpO1xuXG4gICAgICAgIC8vIFNIQURFUiBDT1BZVEVYVFVSRVxuICAgICAgICB2YXIgbGluZXNfZHJhd0J1ZmZlcnNFbmFibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbWF4RHJhd0J1ZmZlcnMgIT09IHVuZGVmaW5lZCAmJiB0aGlzLl9tYXhEcmF3QnVmZmVycyAhPT0gbnVsbCA/ICcjZXh0ZW5zaW9uIEdMX0VYVF9kcmF3X2J1ZmZlcnMgOiByZXF1aXJlXFxuJyA6IFwiXCI7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgdmFyIGxpbmVzX2RyYXdCdWZmZXJzV3JpdGVJbml0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHN0ciA9ICcnO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGZuID0gdGhpcy5fbWF4RHJhd0J1ZmZlcnM7IG4gPCBmbjsgbisrKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9ICdsYXlvdXQobG9jYXRpb24gPSAnICsgbiArICcpIG91dCB2ZWM0IG91dENvbCcgKyBuICsgJztcXG4nO1xuICAgICAgICAgICAgfXJldHVybiBzdHI7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgdmFyIGxpbmVzX2RyYXdCdWZmZXJzV3JpdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgc3RyID0gJyc7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMCwgZm4gPSB0aGlzLl9tYXhEcmF3QnVmZmVyczsgbiA8IGZuOyBuKyspIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0gJ2dsX0ZyYWdEYXRhWycgKyBuICsgJ10gPSB0ZXh0dXJlMkQodUFycmF5Q1RbJyArIG4gKyAnXSwgdkNvb3JkKTtcXG4nO1xuICAgICAgICAgICAgfXJldHVybiBzdHI7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgc291cmNlVmVydGV4ID0gXCJcIiArIHRoaXMucHJlY2lzaW9uICsgJ2F0dHJpYnV0ZSB2ZWMzIGFWZXJ0ZXhQb3NpdGlvbjtcXG4nICsgJ3ZhcnlpbmcgdmVjMiB2Q29vcmQ7XFxuJyArICd2b2lkIG1haW4odm9pZCkge1xcbicgKyAnZ2xfUG9zaXRpb24gPSB2ZWM0KGFWZXJ0ZXhQb3NpdGlvbiwgMS4wKTtcXG4nICsgJ3ZDb29yZCA9IGFWZXJ0ZXhQb3NpdGlvbi54eSowLjUrMC41O1xcbicgKyAnfSc7XG4gICAgICAgIHNvdXJjZUZyYWdtZW50ID0gbGluZXNfZHJhd0J1ZmZlcnNFbmFibGUoKSArIHRoaXMucHJlY2lzaW9uICsgJ3VuaWZvcm0gc2FtcGxlcjJEIHVBcnJheUNUWycgKyB0aGlzLl9tYXhEcmF3QnVmZmVycyArICddO1xcbicgKyAndmFyeWluZyB2ZWMyIHZDb29yZDtcXG4nICtcblxuICAgICAgICAvL2xpbmVzX2RyYXdCdWZmZXJzV3JpdGVJbml0KCkrXG4gICAgICAgICd2b2lkIG1haW4odm9pZCkge1xcbicgKyBsaW5lc19kcmF3QnVmZmVyc1dyaXRlKCkgKyAnfSc7XG4gICAgICAgIHRoaXMuc2hhZGVyX2NvcHlUZXh0dXJlID0gdGhpcy5fZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuICAgICAgICB0aGlzLnV0aWxzLmNyZWF0ZVNoYWRlcih0aGlzLl9nbCwgXCJDTEdMQ09QWVRFWFRVUkVcIiwgc291cmNlVmVydGV4LCBzb3VyY2VGcmFnbWVudCwgdGhpcy5zaGFkZXJfY29weVRleHR1cmUpO1xuXG4gICAgICAgIHRoaXMuYXR0cl9jb3B5VGV4dHVyZV9wb3MgPSB0aGlzLl9nbC5nZXRBdHRyaWJMb2NhdGlvbih0aGlzLnNoYWRlcl9jb3B5VGV4dHVyZSwgXCJhVmVydGV4UG9zaXRpb25cIik7XG5cbiAgICAgICAgZm9yICh2YXIgbiA9IDAsIGZuID0gdGhpcy5fbWF4RHJhd0J1ZmZlcnM7IG4gPCBmbjsgbisrKSB7XG4gICAgICAgICAgICB0aGlzLmFycmF5Q29weVRleFtuXSA9IHRoaXMuX2dsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnNoYWRlcl9jb3B5VGV4dHVyZSwgXCJ1QXJyYXlDVFtcIiArIG4gKyBcIl1cIik7XG4gICAgICAgIH10aGlzLnRleHR1cmVEYXRhQXV4ID0gdGhpcy5fZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICAgICAgICB0aGlzLl9nbC5iaW5kVGV4dHVyZSh0aGlzLl9nbC5URVhUVVJFXzJELCB0aGlzLnRleHR1cmVEYXRhQXV4KTtcbiAgICAgICAgdGhpcy5fZ2wudGV4SW1hZ2UyRCh0aGlzLl9nbC5URVhUVVJFXzJELCAwLCB0aGlzLl9nbC5SR0JBLCAyLCAyLCAwLCB0aGlzLl9nbC5SR0JBLCB0aGlzLl9nbC5GTE9BVCwgbmV3IEZsb2F0MzJBcnJheShbMSwgMCwgMCwgMSwgMCwgMSwgMCwgMSwgMCwgMCwgMSwgMSwgMSwgMSwgMSwgMV0pKTtcbiAgICAgICAgdGhpcy5fZ2wudGV4UGFyYW1ldGVyaSh0aGlzLl9nbC5URVhUVVJFXzJELCB0aGlzLl9nbC5URVhUVVJFX01BR19GSUxURVIsIHRoaXMuX2dsLk5FQVJFU1QpO1xuICAgICAgICB0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgdGhpcy5fZ2wuTkVBUkVTVCk7XG4gICAgICAgIHRoaXMuX2dsLnRleFBhcmFtZXRlcmkodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy5fZ2wuVEVYVFVSRV9XUkFQX1MsIHRoaXMuX2dsLkNMQU1QX1RPX0VER0UpO1xuICAgICAgICB0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfV1JBUF9ULCB0aGlzLl9nbC5DTEFNUF9UT19FREdFKTtcbiAgICAgICAgdGhpcy5fZ2wuYmluZFRleHR1cmUodGhpcy5fZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XG4gICAgfVxuXG4gICAgLyoqXHJcbiAgICAgKiBnZXRDb250ZXh0XHJcbiAgICAgKiBAcmV0dXJucyB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fVxyXG4gICAgICovXG5cblxuICAgIF9jcmVhdGVDbGFzcyhXZWJDTEdMLCBbe1xuICAgICAgICBrZXk6IFwiZ2V0Q29udGV4dFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0Q29udGV4dCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9nbDtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImdldE1heERyYXdCdWZmZXJzXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBnZXRNYXhEcmF3QnVmZmVyc1xyXG4gICAgICAgICAqIEByZXR1cm5zIHtpbnR9XHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRNYXhEcmF3QnVmZmVycygpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9tYXhEcmF3QnVmZmVycztcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImNoZWNrRnJhbWVidWZmZXJTdGF0dXNcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIGNoZWNrRnJhbWVidWZmZXJTdGF0dXNcclxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNoZWNrRnJhbWVidWZmZXJTdGF0dXMoKSB7XG4gICAgICAgICAgICB2YXIgc3RhID0gdGhpcy5fZ2wuY2hlY2tGcmFtZWJ1ZmZlclN0YXR1cyh0aGlzLl9nbC5GUkFNRUJVRkZFUik7XG4gICAgICAgICAgICB2YXIgZmVycm9ycyA9IHt9O1xuICAgICAgICAgICAgZmVycm9yc1t0aGlzLl9nbC5GUkFNRUJVRkZFUl9DT01QTEVURV0gPSB0cnVlO1xuICAgICAgICAgICAgZmVycm9yc1t0aGlzLl9nbC5GUkFNRUJVRkZFUl9JTkNPTVBMRVRFX0FUVEFDSE1FTlRdID0gXCJGUkFNRUJVRkZFUl9JTkNPTVBMRVRFX0FUVEFDSE1FTlQ6IFRoZSBhdHRhY2htZW50IHR5cGVzIGFyZSBtaXNtYXRjaGVkIG9yIG5vdCBhbGwgZnJhbWVidWZmZXIgYXR0YWNobWVudCBwb2ludHMgYXJlIGZyYW1lYnVmZmVyIGF0dGFjaG1lbnQgY29tcGxldGVcIjtcbiAgICAgICAgICAgIGZlcnJvcnNbdGhpcy5fZ2wuRlJBTUVCVUZGRVJfSU5DT01QTEVURV9NSVNTSU5HX0FUVEFDSE1FTlRdID0gXCJGUkFNRUJVRkZFUl9JTkNPTVBMRVRFX01JU1NJTkdfQVRUQUNITUVOVDogVGhlcmUgaXMgbm8gYXR0YWNobWVudFwiO1xuICAgICAgICAgICAgZmVycm9yc1t0aGlzLl9nbC5GUkFNRUJVRkZFUl9JTkNPTVBMRVRFX0RJTUVOU0lPTlNdID0gXCJGUkFNRUJVRkZFUl9JTkNPTVBMRVRFX0RJTUVOU0lPTlM6IEhlaWdodCBhbmQgd2lkdGggb2YgdGhlIGF0dGFjaG1lbnQgYXJlIG5vdCB0aGUgc2FtZVwiO1xuICAgICAgICAgICAgZmVycm9yc1t0aGlzLl9nbC5GUkFNRUJVRkZFUl9VTlNVUFBPUlRFRF0gPSBcIkZSQU1FQlVGRkVSX1VOU1VQUE9SVEVEOiBUaGUgZm9ybWF0IG9mIHRoZSBhdHRhY2htZW50IGlzIG5vdCBzdXBwb3J0ZWQgb3IgaWYgZGVwdGggYW5kIHN0ZW5jaWwgYXR0YWNobWVudHMgYXJlIG5vdCB0aGUgc2FtZSByZW5kZXJidWZmZXJcIjtcbiAgICAgICAgICAgIGlmIChmZXJyb3JzW3N0YV0gIT09IHRydWUgfHwgZmVycm9yc1tzdGFdID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZmVycm9yc1tzdGFdKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImNvcHlcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIGNvcHlcclxuICAgICAgICAgKiBAcGFyYW0ge1dlYkNMR0xLZXJuZWx8V2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbX0gcGdyXHJcbiAgICAgICAgICogQHBhcmFtIHtBcnJheTxXZWJDTEdMQnVmZmVyPn0gW3dlYkNMR0xCdWZmZXJzPW51bGxdXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjb3B5KHBnciwgd2ViQ0xHTEJ1ZmZlcnMpIHtcbiAgICAgICAgICAgIGlmICh3ZWJDTEdMQnVmZmVycyAhPT0gdW5kZWZpbmVkICYmIHdlYkNMR0xCdWZmZXJzICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKHdlYkNMR0xCdWZmZXJzWzBdICE9PSB1bmRlZmluZWQgJiYgd2ViQ0xHTEJ1ZmZlcnNbMF0gIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wudmlld3BvcnQoMCwgMCwgd2ViQ0xHTEJ1ZmZlcnNbMF0uVywgd2ViQ0xHTEJ1ZmZlcnNbMF0uSCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEZyYW1lYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCB3ZWJDTEdMQnVmZmVyc1swXS5mQnVmZmVyKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFyckRCdWZmID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmbiA9IHdlYkNMR0xCdWZmZXJzLmxlbmd0aDsgbiA8IGZuOyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3ZWJDTEdMQnVmZmVyc1tuXSAhPT0gdW5kZWZpbmVkICYmIHdlYkNMR0xCdWZmZXJzW25dICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wuZnJhbWVidWZmZXJUZXh0dXJlMkQodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIHRoaXMuX2FyckV4dFtcIldFQkdMX2RyYXdfYnVmZmVyc1wiXVsnQ09MT1JfQVRUQUNITUVOVCcgKyBuICsgJ19XRUJHTCddLCB0aGlzLl9nbC5URVhUVVJFXzJELCB3ZWJDTEdMQnVmZmVyc1tuXS50ZXh0dXJlRGF0YSwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyREJ1ZmZbbl0gPSB0aGlzLl9hcnJFeHRbXCJXRUJHTF9kcmF3X2J1ZmZlcnNcIl1bJ0NPTE9SX0FUVEFDSE1FTlQnICsgbiArICdfV0VCR0wnXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBhcnJEQnVmZltuXSA9IHRoaXMuX2dsWydOT05FJ107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXJyRXh0W1wiV0VCR0xfZHJhd19idWZmZXJzXCJdLmRyYXdCdWZmZXJzV0VCR0woYXJyREJ1ZmYpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNoZWNrRnJhbWVidWZmZXJTdGF0dXMoKSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wudXNlUHJvZ3JhbSh0aGlzLnNoYWRlcl9jb3B5VGV4dHVyZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9uID0gMCwgX2ZuID0gd2ViQ0xHTEJ1ZmZlcnMubGVuZ3RoOyBfbiA8IF9mbjsgX24rKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLmFjdGl2ZVRleHR1cmUodGhpcy5fZ2xbXCJURVhUVVJFXCIgKyBfbl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3ZWJDTEdMQnVmZmVyc1tfbl0gIT09IHVuZGVmaW5lZCAmJiB3ZWJDTEdMQnVmZmVyc1tfbl0gIT09IG51bGwpIHRoaXMuX2dsLmJpbmRUZXh0dXJlKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHdlYkNMR0xCdWZmZXJzW19uXS50ZXh0dXJlRGF0YVRlbXApO2Vsc2UgdGhpcy5fZ2wuYmluZFRleHR1cmUodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlRGF0YUF1eCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wudW5pZm9ybTFpKHRoaXMuYXJyYXlDb3B5VGV4W19uXSwgX24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvcHlOb3cod2ViQ0xHTEJ1ZmZlcnMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEZyYW1lYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgdGhpcy5fZ2wuYmluZEZyYW1lYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCBudWxsKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImNvcHlOb3dcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNvcHlOb3cod2ViQ0xHTEJ1ZmZlcnMpIHtcbiAgICAgICAgICAgIHRoaXMuX2dsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHRoaXMuYXR0cl9jb3B5VGV4dHVyZV9wb3MpO1xuICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEJ1ZmZlcih0aGlzLl9nbC5BUlJBWV9CVUZGRVIsIHRoaXMudmVydGV4QnVmZmVyX1FVQUQpO1xuICAgICAgICAgICAgdGhpcy5fZ2wudmVydGV4QXR0cmliUG9pbnRlcih0aGlzLmF0dHJfY29weVRleHR1cmVfcG9zLCAzLCB0aGlzLl9nbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuXG4gICAgICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCB0aGlzLmluZGV4QnVmZmVyX1FVQUQpO1xuICAgICAgICAgICAgdGhpcy5fZ2wuZHJhd0VsZW1lbnRzKHRoaXMuX2dsLlRSSUFOR0xFUywgNiwgdGhpcy5fZ2wuVU5TSUdORURfU0hPUlQsIDApO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY3JlYXRlQnVmZmVyXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBDcmVhdGUgYSBlbXB0eSBXZWJDTEdMQnVmZmVyXHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IFt0eXBlPVwiRkxPQVRcIl0gdHlwZSBGTE9BVDQgT1IgRkxPQVRcclxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtsaW5lYXI9ZmFsc2VdIGxpbmVhciB0ZXhQYXJhbWV0ZXJpIHR5cGUgZm9yIHRoZSBXZWJHTFRleHR1cmVcclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gW21vZGU9XCJTQU1QTEVSXCJdIE1vZGUgZm9yIHRoaXMgYnVmZmVyLiBcIlNBTVBMRVJcIiwgXCJBVFRSSUJVVEVcIiwgXCJWRVJURVhfSU5ERVhcIlxyXG4gICAgICAgICAqIEByZXR1cm5zIHtXZWJDTEdMQnVmZmVyfVxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlQnVmZmVyKHR5cGUsIGxpbmVhciwgbW9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBfV2ViQ0xHTEJ1ZmZlci5XZWJDTEdMQnVmZmVyKHRoaXMuX2dsLCB0eXBlLCBsaW5lYXIsIG1vZGUpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY3JlYXRlS2VybmVsXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBDcmVhdGUgYSBrZXJuZWxcclxuICAgICAgICAgKiBAcmV0dXJucyB7V2ViQ0xHTEtlcm5lbH1cclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gW3NvdXJjZT11bmRlZmluZWRdXHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IFtoZWFkZXI9dW5kZWZpbmVkXSBBZGRpdGlvbmFsIGZ1bmN0aW9uc1xyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlS2VybmVsKHNvdXJjZSwgaGVhZGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IF9XZWJDTEdMS2VybmVsLldlYkNMR0xLZXJuZWwodGhpcy5fZ2wsIHNvdXJjZSwgaGVhZGVyKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImNyZWF0ZVZlcnRleEZyYWdtZW50UHJvZ3JhbVwiLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQ3JlYXRlIGEgdmVydGV4IGFuZCBmcmFnbWVudCBwcm9ncmFtcyBmb3IgYSBXZWJHTCBncmFwaGljYWwgcmVwcmVzZW50YXRpb24gYWZ0ZXIgc29tZSBlbnF1ZXVlTkRSYW5nZUtlcm5lbFxyXG4gICAgICAgICAqIEByZXR1cm5zIHtXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtfVxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBbdmVydGV4U291cmNlPXVuZGVmaW5lZF1cclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gW3ZlcnRleEhlYWRlcj11bmRlZmluZWRdXHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IFtmcmFnbWVudFNvdXJjZT11bmRlZmluZWRdXHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IFtmcmFnbWVudEhlYWRlcj11bmRlZmluZWRdXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjcmVhdGVWZXJ0ZXhGcmFnbWVudFByb2dyYW0odmVydGV4U291cmNlLCB2ZXJ0ZXhIZWFkZXIsIGZyYWdtZW50U291cmNlLCBmcmFnbWVudEhlYWRlcikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBfV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbS5XZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtKHRoaXMuX2dsLCB2ZXJ0ZXhTb3VyY2UsIHZlcnRleEhlYWRlciwgZnJhZ21lbnRTb3VyY2UsIGZyYWdtZW50SGVhZGVyKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImZpbGxCdWZmZXJcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIGZpbGxCdWZmZXIgd2l0aCBjb2xvclxyXG4gICAgICAgICAqIEBwYXJhbSB7V2ViR0xUZXh0dXJlfSB0ZXh0dXJlXHJcbiAgICAgICAgICogQHBhcmFtIHtBcnJheTxGbG9hdD59IGNsZWFyQ29sb3JcclxuICAgICAgICAgKiBAcGFyYW0ge1dlYkdMRnJhbWVidWZmZXJ9IGZCdWZmZXJcclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGZpbGxCdWZmZXIodGV4dHVyZSwgY2xlYXJDb2xvciwgZkJ1ZmZlcikge1xuICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEZyYW1lYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCBmQnVmZmVyKTtcbiAgICAgICAgICAgIHRoaXMuX2dsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCB0aGlzLl9hcnJFeHRbXCJXRUJHTF9kcmF3X2J1ZmZlcnNcIl1bJ0NPTE9SX0FUVEFDSE1FTlQwX1dFQkdMJ10sIHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRleHR1cmUsIDApO1xuXG4gICAgICAgICAgICB2YXIgYXJyREJ1ZmYgPSBbdGhpcy5fYXJyRXh0W1wiV0VCR0xfZHJhd19idWZmZXJzXCJdWydDT0xPUl9BVFRBQ0hNRU5UMF9XRUJHTCddXTtcbiAgICAgICAgICAgIHRoaXMuX2FyckV4dFtcIldFQkdMX2RyYXdfYnVmZmVyc1wiXS5kcmF3QnVmZmVyc1dFQkdMKGFyckRCdWZmKTtcblxuICAgICAgICAgICAgaWYgKGNsZWFyQ29sb3IgIT09IHVuZGVmaW5lZCAmJiBjbGVhckNvbG9yICE9PSBudWxsKSB0aGlzLl9nbC5jbGVhckNvbG9yKGNsZWFyQ29sb3JbMF0sIGNsZWFyQ29sb3JbMV0sIGNsZWFyQ29sb3JbMl0sIGNsZWFyQ29sb3JbM10pO1xuICAgICAgICAgICAgdGhpcy5fZ2wuY2xlYXIodGhpcy5fZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJiaW5kQXR0cmlidXRlVmFsdWVcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIGJpbmRBdHRyaWJ1dGVWYWx1ZVxyXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpblZhbHVlXHJcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMQnVmZmVyfSBidWZmXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBiaW5kQXR0cmlidXRlVmFsdWUoaW5WYWx1ZSwgYnVmZikge1xuICAgICAgICAgICAgaWYgKGJ1ZmYgIT09IHVuZGVmaW5lZCAmJiBidWZmICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGluVmFsdWUudHlwZSA9PT0gJ2Zsb2F0NF9mcm9tQXR0cicpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoaW5WYWx1ZS5sb2NhdGlvblswXSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRCdWZmZXIodGhpcy5fZ2wuQVJSQVlfQlVGRkVSLCBidWZmLnZlcnRleERhdGEwKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wudmVydGV4QXR0cmliUG9pbnRlcihpblZhbHVlLmxvY2F0aW9uWzBdLCA0LCB0aGlzLl9nbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5WYWx1ZS50eXBlID09PSAnZmxvYXRfZnJvbUF0dHInKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGluVmFsdWUubG9jYXRpb25bMF0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkFSUkFZX0JVRkZFUiwgYnVmZi52ZXJ0ZXhEYXRhMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLnZlcnRleEF0dHJpYlBvaW50ZXIoaW5WYWx1ZS5sb2NhdGlvblswXSwgMSwgdGhpcy5fZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgdGhpcy5fZ2wuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5KGluVmFsdWUubG9jYXRpb25bMF0pO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiYmluZFNhbXBsZXJWYWx1ZVwiLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogYmluZFNhbXBsZXJWYWx1ZVxyXG4gICAgICAgICAqIEBwYXJhbSB7V2ViR0xVbmlmb3JtTG9jYXRpb259IHVCdWZmZXJXaWR0aFxyXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpblZhbHVlXHJcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMQnVmZmVyfSBidWZmXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBiaW5kU2FtcGxlclZhbHVlKHVCdWZmZXJXaWR0aCwgaW5WYWx1ZSwgYnVmZikge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRUZXh0dXJlVW5pdCA8IDE2KSB0aGlzLl9nbC5hY3RpdmVUZXh0dXJlKHRoaXMuX2dsW1wiVEVYVFVSRVwiICsgdGhpcy5fY3VycmVudFRleHR1cmVVbml0XSk7ZWxzZSB0aGlzLl9nbC5hY3RpdmVUZXh0dXJlKHRoaXMuX2dsW1wiVEVYVFVSRTE2XCJdKTtcblxuICAgICAgICAgICAgaWYgKGJ1ZmYgIT09IHVuZGVmaW5lZCAmJiBidWZmICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuYmluZFRleHR1cmUodGhpcy5fZ2wuVEVYVFVSRV8yRCwgYnVmZi50ZXh0dXJlRGF0YSk7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fYnVmZmVyV2lkdGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnVmZmVyV2lkdGggPSBidWZmLlc7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLnVuaWZvcm0xZih1QnVmZmVyV2lkdGgsIHRoaXMuX2J1ZmZlcldpZHRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgdGhpcy5fZ2wuYmluZFRleHR1cmUodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlRGF0YUF1eCk7XG4gICAgICAgICAgICB0aGlzLl9nbC51bmlmb3JtMWkoaW5WYWx1ZS5sb2NhdGlvblswXSwgdGhpcy5fY3VycmVudFRleHR1cmVVbml0KTtcblxuICAgICAgICAgICAgdGhpcy5fY3VycmVudFRleHR1cmVVbml0Kys7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJiaW5kVW5pZm9ybVZhbHVlXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBiaW5kVW5pZm9ybVZhbHVlXHJcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGluVmFsdWVcclxuICAgICAgICAgKiBAcGFyYW0ge1dlYkNMR0xCdWZmZXJ8TnVtYmVyfEFycmF5PGZsb2F0Pn0gYnVmZlxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gYmluZFVuaWZvcm1WYWx1ZShpblZhbHVlLCBidWZmKSB7XG4gICAgICAgICAgICBpZiAoYnVmZiAhPT0gdW5kZWZpbmVkICYmIGJ1ZmYgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5WYWx1ZS50eXBlID09PSAnZmxvYXQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChidWZmLmNvbnN0cnVjdG9yID09PSBBcnJheSkgdGhpcy5fZ2wudW5pZm9ybTFmdihpblZhbHVlLmxvY2F0aW9uWzBdLCBidWZmKTtlbHNlIHRoaXMuX2dsLnVuaWZvcm0xZihpblZhbHVlLmxvY2F0aW9uWzBdLCBidWZmKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGluVmFsdWUudHlwZSA9PT0gJ2Zsb2F0NCcpIHRoaXMuX2dsLnVuaWZvcm00ZihpblZhbHVlLmxvY2F0aW9uWzBdLCBidWZmWzBdLCBidWZmWzFdLCBidWZmWzJdLCBidWZmWzNdKTtlbHNlIGlmIChpblZhbHVlLnR5cGUgPT09ICdtYXQ0JykgdGhpcy5fZ2wudW5pZm9ybU1hdHJpeDRmdihpblZhbHVlLmxvY2F0aW9uWzBdLCBmYWxzZSwgYnVmZik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJiaW5kVmFsdWVcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIGJpbmRWYWx1ZVxyXG4gICAgICAgICAqIEBwYXJhbSB7V2ViQ0xHTEtlcm5lbHxXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtfSB3ZWJDTEdMUHJvZ3JhbVxyXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpblZhbHVlXHJcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMQnVmZmVyfGZsb2F0fEFycmF5PGZsb2F0PnxGbG9hdDMyQXJyYXl8VWludDhBcnJheX0gYXJnVmFsdWVcclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGJpbmRWYWx1ZSh3ZWJDTEdMUHJvZ3JhbSwgaW5WYWx1ZSwgYXJnVmFsdWUpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoaW5WYWx1ZS5leHBlY3RlZE1vZGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwiQVRUUklCVVRFXCI6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYmluZEF0dHJpYnV0ZVZhbHVlKGluVmFsdWUsIGFyZ1ZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlNBTVBMRVJcIjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5iaW5kU2FtcGxlclZhbHVlKHdlYkNMR0xQcm9ncmFtLnVCdWZmZXJXaWR0aCwgaW5WYWx1ZSwgYXJnVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiVU5JRk9STVwiOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmJpbmRVbmlmb3JtVmFsdWUoaW5WYWx1ZSwgYXJnVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImJpbmRGQlwiLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogYmluZEZCXHJcbiAgICAgICAgICogQHBhcmFtIHtBcnJheTxXZWJDTEdMQnVmZmVyPn0gW3dlYkNMR0xCdWZmZXJzPW51bGxdXHJcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBvdXRwdXRUb1RlbXBcclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGJpbmRGQih3ZWJDTEdMQnVmZmVycywgb3V0cHV0VG9UZW1wKSB7XG4gICAgICAgICAgICBpZiAod2ViQ0xHTEJ1ZmZlcnMgIT09IHVuZGVmaW5lZCAmJiB3ZWJDTEdMQnVmZmVycyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmICh3ZWJDTEdMQnVmZmVyc1swXSAhPT0gdW5kZWZpbmVkICYmIHdlYkNMR0xCdWZmZXJzWzBdICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLnZpZXdwb3J0KDAsIDAsIHdlYkNMR0xCdWZmZXJzWzBdLlcsIHdlYkNMR0xCdWZmZXJzWzBdLkgpO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRGcmFtZWJ1ZmZlcih0aGlzLl9nbC5GUkFNRUJVRkZFUiwgb3V0cHV0VG9UZW1wID09PSB0cnVlID8gd2ViQ0xHTEJ1ZmZlcnNbMF0uZkJ1ZmZlclRlbXAgOiB3ZWJDTEdMQnVmZmVyc1swXS5mQnVmZmVyKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFyckRCdWZmID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmbiA9IHdlYkNMR0xCdWZmZXJzLmxlbmd0aDsgbiA8IGZuOyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3ZWJDTEdMQnVmZmVyc1tuXSAhPT0gdW5kZWZpbmVkICYmIHdlYkNMR0xCdWZmZXJzW25dICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG8gPSBvdXRwdXRUb1RlbXAgPT09IHRydWUgPyB3ZWJDTEdMQnVmZmVyc1tuXS50ZXh0dXJlRGF0YVRlbXAgOiB3ZWJDTEdMQnVmZmVyc1tuXS50ZXh0dXJlRGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbC5mcmFtZWJ1ZmZlclRleHR1cmUyRCh0aGlzLl9nbC5GUkFNRUJVRkZFUiwgdGhpcy5fYXJyRXh0W1wiV0VCR0xfZHJhd19idWZmZXJzXCJdWydDT0xPUl9BVFRBQ0hNRU5UJyArIG4gKyAnX1dFQkdMJ10sIHRoaXMuX2dsLlRFWFRVUkVfMkQsIG8sIDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyckRCdWZmW25dID0gdGhpcy5fYXJyRXh0W1wiV0VCR0xfZHJhd19idWZmZXJzXCJdWydDT0xPUl9BVFRBQ0hNRU5UJyArIG4gKyAnX1dFQkdMJ107XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgYXJyREJ1ZmZbbl0gPSB0aGlzLl9nbFsnTk9ORSddO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2FyckV4dFtcIldFQkdMX2RyYXdfYnVmZmVyc1wiXS5kcmF3QnVmZmVyc1dFQkdMKGFyckRCdWZmKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jaGVja0ZyYW1lYnVmZmVyU3RhdHVzKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEZyYW1lYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kRnJhbWVidWZmZXIodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZW5xdWV1ZU5EUmFuZ2VLZXJuZWxcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFBlcmZvcm0gY2FsY3VsYXRpb24gYW5kIHNhdmUgdGhlIHJlc3VsdCBvbiBhIFdlYkNMR0xCdWZmZXJcclxuICAgICAgICAgKiBAcGFyYW0ge1dlYkNMR0xLZXJuZWx9IHdlYkNMR0xLZXJuZWxcclxuICAgICAgICAgKiBAcGFyYW0ge1dlYkNMR0xCdWZmZXJ8QXJyYXk8V2ViQ0xHTEJ1ZmZlcj59IFt3ZWJDTEdMQnVmZmVyPW51bGxdXHJcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBvdXRwdXRUb1RlbXBcclxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYXJnVmFsdWVzXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBlbnF1ZXVlTkRSYW5nZUtlcm5lbCh3ZWJDTEdMS2VybmVsLCB3ZWJDTEdMQnVmZmVyLCBvdXRwdXRUb1RlbXAsIGFyZ1ZhbHVlcykge1xuICAgICAgICAgICAgdGhpcy5fYnVmZmVyV2lkdGggPSAwO1xuXG4gICAgICAgICAgICB0aGlzLl9nbC51c2VQcm9ncmFtKHdlYkNMR0xLZXJuZWwua2VybmVsKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuYmluZEZCKHdlYkNMR0xCdWZmZXIsIG91dHB1dFRvVGVtcCkgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50VGV4dHVyZVVuaXQgPSAwO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB3ZWJDTEdMS2VybmVsLmluX3ZhbHVlcykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmJpbmRWYWx1ZSh3ZWJDTEdMS2VybmVsLCB3ZWJDTEdMS2VybmVsLmluX3ZhbHVlc1trZXldLCBhcmdWYWx1ZXNba2V5XSk7XG4gICAgICAgICAgICAgICAgfXRoaXMuX2dsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHdlYkNMR0xLZXJuZWwuYXR0cl9WZXJ0ZXhQb3MpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRCdWZmZXIodGhpcy5fZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnZlcnRleEJ1ZmZlcl9RVUFEKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHdlYkNMR0xLZXJuZWwuYXR0cl9WZXJ0ZXhQb3MsIDMsIHRoaXMuX2dsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCB0aGlzLmluZGV4QnVmZmVyX1FVQUQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmRyYXdFbGVtZW50cyh0aGlzLl9nbC5UUklBTkdMRVMsIDYsIHRoaXMuX2dsLlVOU0lHTkVEX1NIT1JULCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImVucXVldWVWZXJ0ZXhGcmFnbWVudFByb2dyYW1cIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFBlcmZvcm0gV2ViR0wgZ3JhcGhpY2FsIHJlcHJlc2VudGF0aW9uXHJcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtfSB3ZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtXHJcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMQnVmZmVyfSBidWZmZXJJbmQgQnVmZmVyIHRvIGRyYXcgdHlwZSAodHlwZSBpbmRpY2VzIG9yIHZlcnRleClcclxuICAgICAgICAgKiBAcGFyYW0ge2ludH0gW2RyYXdNb2RlPTRdIDA9UE9JTlRTLCAzPUxJTkVfU1RSSVAsIDI9TElORV9MT09QLCAxPUxJTkVTLCA1PVRSSUFOR0xFX1NUUklQLCA2PVRSSUFOR0xFX0ZBTiBhbmQgND1UUklBTkdMRVNcclxuICAgICAgICAgKiBAcGFyYW0ge1dlYkNMR0xCdWZmZXJ8QXJyYXk8V2ViQ0xHTEJ1ZmZlcj59IFt3ZWJDTEdMQnVmZmVyPW51bGxdXHJcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBvdXRwdXRUb1RlbXBcclxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYXJnVmFsdWVzXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBlbnF1ZXVlVmVydGV4RnJhZ21lbnRQcm9ncmFtKHdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0sIGJ1ZmZlckluZCwgZHJhd01vZGUsIHdlYkNMR0xCdWZmZXIsIG91dHB1dFRvVGVtcCwgYXJnVmFsdWVzKSB7XG4gICAgICAgICAgICB0aGlzLl9idWZmZXJXaWR0aCA9IDA7XG5cbiAgICAgICAgICAgIHRoaXMuX2dsLnVzZVByb2dyYW0od2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbS52ZXJ0ZXhGcmFnbWVudFByb2dyYW0pO1xuXG4gICAgICAgICAgICB2YXIgRG1vZGUgPSBkcmF3TW9kZSAhPT0gdW5kZWZpbmVkICYmIGRyYXdNb2RlICE9PSBudWxsID8gZHJhd01vZGUgOiA0O1xuXG4gICAgICAgICAgICBpZiAodGhpcy5iaW5kRkIod2ViQ0xHTEJ1ZmZlciwgb3V0cHV0VG9UZW1wKSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIGlmIChidWZmZXJJbmQgIT09IHVuZGVmaW5lZCAmJiBidWZmZXJJbmQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudFRleHR1cmVVbml0ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0uaW5fdmVydGV4X3ZhbHVlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5iaW5kVmFsdWUod2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbSwgd2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbS5pbl92ZXJ0ZXhfdmFsdWVzW2tleV0sIGFyZ1ZhbHVlc1trZXldKTtcbiAgICAgICAgICAgICAgICAgICAgfWZvciAodmFyIF9rZXkgaW4gd2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbS5pbl9mcmFnbWVudF92YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYmluZFZhbHVlKHdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0sIHdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0uaW5fZnJhZ21lbnRfdmFsdWVzW19rZXldLCBhcmdWYWx1ZXNbX2tleV0pO1xuICAgICAgICAgICAgICAgICAgICB9aWYgKGJ1ZmZlckluZC5tb2RlID09PSBcIlZFUlRFWF9JTkRFWFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBidWZmZXJJbmQudmVydGV4RGF0YTApO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wuZHJhd0VsZW1lbnRzKERtb2RlLCBidWZmZXJJbmQubGVuZ3RoLCB0aGlzLl9nbC5VTlNJR05FRF9TSE9SVCwgMCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB0aGlzLl9nbC5kcmF3QXJyYXlzKERtb2RlLCAwLCBidWZmZXJJbmQubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJyZWFkQnVmZmVyXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBHZXQgRmxvYXQzMkFycmF5IGFycmF5IGZyb20gYSBXZWJDTEdMQnVmZmVyXHJcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMQnVmZmVyfSBidWZmZXJcclxuICAgICAgICAgKiBAcmV0dXJucyB7RmxvYXQzMkFycmF5fVxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcmVhZEJ1ZmZlcihidWZmZXIpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmUgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmUud2lkdGggPSBidWZmZXIuVztcbiAgICAgICAgICAgICAgICB0aGlzLmUuaGVpZ2h0ID0gYnVmZmVyLkg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX2dsLnVzZVByb2dyYW0odGhpcy5zaGFkZXJfcmVhZHBpeGVscyk7XG5cbiAgICAgICAgICAgIHRoaXMuX2dsLnZpZXdwb3J0KDAsIDAsIGJ1ZmZlci5XLCBidWZmZXIuSCk7XG4gICAgICAgICAgICB0aGlzLl9nbC5iaW5kRnJhbWVidWZmZXIodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIGJ1ZmZlci5mQnVmZmVyVGVtcCk7XG4gICAgICAgICAgICB0aGlzLl9nbC5mcmFtZWJ1ZmZlclRleHR1cmUyRCh0aGlzLl9nbC5GUkFNRUJVRkZFUiwgdGhpcy5fYXJyRXh0W1wiV0VCR0xfZHJhd19idWZmZXJzXCJdWydDT0xPUl9BVFRBQ0hNRU5UMF9XRUJHTCddLCB0aGlzLl9nbC5URVhUVVJFXzJELCBidWZmZXIudGV4dHVyZURhdGFUZW1wLCAwKTtcblxuICAgICAgICAgICAgdmFyIGFyckRCdWZmID0gW3RoaXMuX2FyckV4dFtcIldFQkdMX2RyYXdfYnVmZmVyc1wiXVsnQ09MT1JfQVRUQUNITUVOVDBfV0VCR0wnXV07XG4gICAgICAgICAgICB0aGlzLl9hcnJFeHRbXCJXRUJHTF9kcmF3X2J1ZmZlcnNcIl0uZHJhd0J1ZmZlcnNXRUJHTChhcnJEQnVmZik7XG5cbiAgICAgICAgICAgIHRoaXMuX2dsLmFjdGl2ZVRleHR1cmUodGhpcy5fZ2wuVEVYVFVSRTApO1xuICAgICAgICAgICAgdGhpcy5fZ2wuYmluZFRleHR1cmUodGhpcy5fZ2wuVEVYVFVSRV8yRCwgYnVmZmVyLnRleHR1cmVEYXRhKTtcbiAgICAgICAgICAgIHRoaXMuX2dsLnVuaWZvcm0xaSh0aGlzLnNhbXBsZXJfYnVmZmVyLCAwKTtcblxuICAgICAgICAgICAgdGhpcy5fZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkodGhpcy5hdHRyX1ZlcnRleFBvcyk7XG4gICAgICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkFSUkFZX0JVRkZFUiwgdGhpcy52ZXJ0ZXhCdWZmZXJfUVVBRCk7XG4gICAgICAgICAgICB0aGlzLl9nbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHRoaXMuYXR0cl9WZXJ0ZXhQb3MsIDMsIGJ1ZmZlci5fc3VwcG9ydEZvcm1hdCwgZmFsc2UsIDAsIDApO1xuXG4gICAgICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCB0aGlzLmluZGV4QnVmZmVyX1FVQUQpO1xuICAgICAgICAgICAgdGhpcy5fZ2wuZHJhd0VsZW1lbnRzKHRoaXMuX2dsLlRSSUFOR0xFUywgNiwgdGhpcy5fZ2wuVU5TSUdORURfU0hPUlQsIDApO1xuXG4gICAgICAgICAgICBpZiAoYnVmZmVyLm91dEFycmF5RmxvYXQgPT09IHVuZGVmaW5lZCB8fCBidWZmZXIub3V0QXJyYXlGbG9hdCA9PT0gbnVsbCkgYnVmZmVyLm91dEFycmF5RmxvYXQgPSBuZXcgRmxvYXQzMkFycmF5KGJ1ZmZlci5XICogYnVmZmVyLkggKiA0KTtcbiAgICAgICAgICAgIHRoaXMuX2dsLnJlYWRQaXhlbHMoMCwgMCwgYnVmZmVyLlcsIGJ1ZmZlci5ILCB0aGlzLl9nbC5SR0JBLCB0aGlzLl9nbC5GTE9BVCwgYnVmZmVyLm91dEFycmF5RmxvYXQpO1xuXG4gICAgICAgICAgICBpZiAoYnVmZmVyLnR5cGUgPT09IFwiRkxPQVRcIikge1xuICAgICAgICAgICAgICAgIHZhciBmZCA9IG5ldyBGbG9hdDMyQXJyYXkoYnVmZmVyLm91dEFycmF5RmxvYXQubGVuZ3RoIC8gNCk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGZuID0gYnVmZmVyLm91dEFycmF5RmxvYXQubGVuZ3RoIC8gNDsgbiA8IGZuOyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgZmRbbl0gPSBidWZmZXIub3V0QXJyYXlGbG9hdFtuICogNF07XG4gICAgICAgICAgICAgICAgfWJ1ZmZlci5vdXRBcnJheUZsb2F0ID0gZmQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBidWZmZXIub3V0QXJyYXlGbG9hdDtcbiAgICAgICAgfVxuICAgIH1dLCBbe1xuICAgICAgICBrZXk6IFwiZW5xdWV1ZVJlYWRCdWZmZXJfV2ViR0xUZXh0dXJlXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBHZXQgdGhlIGludGVybmFsbHkgV2ViR0xUZXh0dXJlICh0eXBlIEZMT0FUKSwgaWYgdGhlIFdlYkdMUmVuZGVyaW5nQ29udGV4dCB3YXMgZ2l2ZW4uXHJcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMQnVmZmVyfSBidWZmZXJcclxuICAgICAgICAgKiBAcmV0dXJucyB7V2ViR0xUZXh0dXJlfVxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZW5xdWV1ZVJlYWRCdWZmZXJfV2ViR0xUZXh0dXJlKGJ1ZmZlcikge1xuICAgICAgICAgICAgcmV0dXJuIGJ1ZmZlci50ZXh0dXJlRGF0YTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBXZWJDTEdMO1xufSgpO1xuXG5nbG9iYWwuV2ViQ0xHTCA9IFdlYkNMR0w7XG5tb2R1bGUuZXhwb3J0cy5XZWJDTEdMID0gV2ViQ0xHTDsiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG4vKipcclxuKiBXZWJDTEdMQnVmZmVyXHJcbiogQGNsYXNzXHJcbiAqIEBwYXJhbSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbFxyXG4gKiBAcGFyYW0ge1N0cmluZ30gW3R5cGU9XCJGTE9BVFwiXVxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtsaW5lYXI9dHJ1ZV1cclxuICogQHBhcmFtIHtTdHJpbmd9IFttb2RlPVwiU0FNUExFUlwiXSBcIlNBTVBMRVJcIiwgXCJBVFRSSUJVVEVcIiwgXCJWRVJURVhfSU5ERVhcIlxyXG4qL1xudmFyIFdlYkNMR0xCdWZmZXIgPSBleHBvcnRzLldlYkNMR0xCdWZmZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gV2ViQ0xHTEJ1ZmZlcihnbCwgdHlwZSwgbGluZWFyLCBtb2RlKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBXZWJDTEdMQnVmZmVyKTtcblxuICAgICAgICB0aGlzLl9nbCA9IGdsO1xuXG4gICAgICAgIHRoaXMudHlwZSA9IHR5cGUgIT09IHVuZGVmaW5lZCB8fCB0eXBlICE9PSBudWxsID8gdHlwZSA6ICdGTE9BVCc7XG4gICAgICAgIHRoaXMuX3N1cHBvcnRGb3JtYXQgPSB0aGlzLl9nbC5GTE9BVDtcblxuICAgICAgICB0aGlzLmxpbmVhciA9IGxpbmVhciAhPT0gdW5kZWZpbmVkIHx8IGxpbmVhciAhPT0gbnVsbCA/IGxpbmVhciA6IHRydWU7XG4gICAgICAgIHRoaXMubW9kZSA9IG1vZGUgIT09IHVuZGVmaW5lZCB8fCBtb2RlICE9PSBudWxsID8gbW9kZSA6IFwiU0FNUExFUlwiO1xuXG4gICAgICAgIHRoaXMuVyA9IG51bGw7XG4gICAgICAgIHRoaXMuSCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy50ZXh0dXJlRGF0YSA9IG51bGw7XG4gICAgICAgIHRoaXMudGV4dHVyZURhdGFUZW1wID0gbnVsbDtcbiAgICAgICAgdGhpcy52ZXJ0ZXhEYXRhMCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5mQnVmZmVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5yZW5kZXJCdWZmZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmZCdWZmZXJUZW1wID0gbnVsbDtcbiAgICAgICAgdGhpcy5yZW5kZXJCdWZmZXJUZW1wID0gbnVsbDtcblxuICAgICAgICBpZiAodGhpcy5tb2RlID09PSBcIlNBTVBMRVJcIikge1xuICAgICAgICAgICAgdGhpcy50ZXh0dXJlRGF0YSA9IHRoaXMuX2dsLmNyZWF0ZVRleHR1cmUoKTtcbiAgICAgICAgICAgIHRoaXMudGV4dHVyZURhdGFUZW1wID0gdGhpcy5fZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFwiU0FNUExFUlwiIHx8IHRoaXMubW9kZSA9PT0gXCJBVFRSSUJVVEVcIiB8fCB0aGlzLm1vZGUgPT09IFwiVkVSVEVYX0lOREVYXCIpIHtcbiAgICAgICAgICAgIHRoaXMudmVydGV4RGF0YTAgPSB0aGlzLl9nbC5jcmVhdGVCdWZmZXIoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxyXG4gICAgICogY3JlYXRlRnJhbWVidWZmZXJBbmRSZW5kZXJidWZmZXJcclxuICAgICAqL1xuXG5cbiAgICBfY3JlYXRlQ2xhc3MoV2ViQ0xHTEJ1ZmZlciwgW3tcbiAgICAgICAga2V5OiBcImNyZWF0ZUZyYW1lYnVmZmVyQW5kUmVuZGVyYnVmZmVyXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjcmVhdGVGcmFtZWJ1ZmZlckFuZFJlbmRlcmJ1ZmZlcigpIHtcbiAgICAgICAgICAgIHZhciBjcmVhdGVXZWJHTFJlbmRlckJ1ZmZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgckJ1ZmZlciA9IHRoaXMuX2dsLmNyZWF0ZVJlbmRlcmJ1ZmZlcigpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRSZW5kZXJidWZmZXIodGhpcy5fZ2wuUkVOREVSQlVGRkVSLCByQnVmZmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5yZW5kZXJidWZmZXJTdG9yYWdlKHRoaXMuX2dsLlJFTkRFUkJVRkZFUiwgdGhpcy5fZ2wuREVQVEhfQ09NUE9ORU5UMTYsIHRoaXMuVywgdGhpcy5IKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kUmVuZGVyYnVmZmVyKHRoaXMuX2dsLlJFTkRFUkJVRkZFUiwgbnVsbCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJCdWZmZXI7XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmZCdWZmZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmRlbGV0ZUZyYW1lYnVmZmVyKHRoaXMuZkJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuZGVsZXRlRnJhbWVidWZmZXIodGhpcy5mQnVmZmVyVGVtcCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5kZWxldGVSZW5kZXJidWZmZXIodGhpcy5yZW5kZXJCdWZmZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmRlbGV0ZVJlbmRlcmJ1ZmZlcih0aGlzLnJlbmRlckJ1ZmZlclRlbXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5mQnVmZmVyID0gdGhpcy5fZ2wuY3JlYXRlRnJhbWVidWZmZXIoKTtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyQnVmZmVyID0gY3JlYXRlV2ViR0xSZW5kZXJCdWZmZXIoKTtcbiAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRGcmFtZWJ1ZmZlcih0aGlzLl9nbC5GUkFNRUJVRkZFUiwgdGhpcy5mQnVmZmVyKTtcbiAgICAgICAgICAgIHRoaXMuX2dsLmZyYW1lYnVmZmVyUmVuZGVyYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCB0aGlzLl9nbC5ERVBUSF9BVFRBQ0hNRU5ULCB0aGlzLl9nbC5SRU5ERVJCVUZGRVIsIHRoaXMucmVuZGVyQnVmZmVyKTtcblxuICAgICAgICAgICAgdGhpcy5mQnVmZmVyVGVtcCA9IHRoaXMuX2dsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XG4gICAgICAgICAgICB0aGlzLnJlbmRlckJ1ZmZlclRlbXAgPSBjcmVhdGVXZWJHTFJlbmRlckJ1ZmZlcigpO1xuICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEZyYW1lYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCB0aGlzLmZCdWZmZXJUZW1wKTtcbiAgICAgICAgICAgIHRoaXMuX2dsLmZyYW1lYnVmZmVyUmVuZGVyYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCB0aGlzLl9nbC5ERVBUSF9BVFRBQ0hNRU5ULCB0aGlzLl9nbC5SRU5ERVJCVUZGRVIsIHRoaXMucmVuZGVyQnVmZmVyVGVtcCk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJ3cml0ZVdlYkdMVGV4dHVyZUJ1ZmZlclwiLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogV3JpdGUgV2ViR0xUZXh0dXJlIGJ1ZmZlclxyXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXk8ZmxvYXQ+fEZsb2F0MzJBcnJheXxVaW50OEFycmF5fFdlYkdMVGV4dHVyZXxIVE1MSW1hZ2VFbGVtZW50fSBhcnJcclxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtmbGlwPWZhbHNlXVxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gd3JpdGVXZWJHTFRleHR1cmVCdWZmZXIoYXJyLCBmbGlwKSB7XG4gICAgICAgICAgICB2YXIgcHMgPSBmdW5jdGlvbiAodGV4LCBmbGlwKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZsaXAgPT09IGZhbHNlIHx8IGZsaXAgPT09IHVuZGVmaW5lZCB8fCBmbGlwID09PSBudWxsKSB0aGlzLl9nbC5waXhlbFN0b3JlaSh0aGlzLl9nbC5VTlBBQ0tfRkxJUF9ZX1dFQkdMLCBmYWxzZSk7ZWxzZSB0aGlzLl9nbC5waXhlbFN0b3JlaSh0aGlzLl9nbC5VTlBBQ0tfRkxJUF9ZX1dFQkdMLCB0cnVlKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2dsLnBpeGVsU3RvcmVpKHRoaXMuX2dsLlVOUEFDS19QUkVNVUxUSVBMWV9BTFBIQV9XRUJHTCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRUZXh0dXJlKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRleCk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgICAgIHZhciB3cml0ZVRleE5vdyA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJyIGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAvL3RoaXMuX2dsLnRleEltYWdlMkQodGhpcy5fZ2wuVEVYVFVSRV8yRCwgMCwgdGhpcy5fZ2wuUkdCQSwgYXJyLndpZHRoLCBhcnIuaGVpZ2h0LCAwLCB0aGlzLl9nbC5SR0JBLCB0aGlzLl9nbC5VTlNJR05FRF9CWVRFLCBhcnIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50eXBlID09PSAnRkxPQVQ0JykgdGhpcy5fZ2wudGV4SW1hZ2UyRCh0aGlzLl9nbC5URVhUVVJFXzJELCAwLCB0aGlzLl9nbC5SR0JBLCB0aGlzLl9nbC5SR0JBLCB0aGlzLl9zdXBwb3J0Rm9ybWF0LCBhcnIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vdGhpcy5fZ2wudGV4SW1hZ2UyRCh0aGlzLl9nbC5URVhUVVJFXzJELCAwLCB0aGlzLl9nbC5SR0JBLCB0aGlzLlcsIHRoaXMuSCwgMCwgdGhpcy5fZ2wuUkdCQSwgdGhpcy5fc3VwcG9ydEZvcm1hdCwgYXJyLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wudGV4SW1hZ2UyRCh0aGlzLl9nbC5URVhUVVJFXzJELCAwLCB0aGlzLl9nbC5SR0JBLCB0aGlzLlcsIHRoaXMuSCwgMCwgdGhpcy5fZ2wuUkdCQSwgdGhpcy5fc3VwcG9ydEZvcm1hdCwgYXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgICAgIHZhciB0cCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgdGhpcy5fZ2wuTkVBUkVTVCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wudGV4UGFyYW1ldGVyaSh0aGlzLl9nbC5URVhUVVJFXzJELCB0aGlzLl9nbC5URVhUVVJFX01JTl9GSUxURVIsIHRoaXMuX2dsLk5FQVJFU1QpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLnRleFBhcmFtZXRlcmkodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy5fZ2wuVEVYVFVSRV9XUkFQX1MsIHRoaXMuX2dsLkNMQU1QX1RPX0VER0UpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLnRleFBhcmFtZXRlcmkodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy5fZ2wuVEVYVFVSRV9XUkFQX1QsIHRoaXMuX2dsLkNMQU1QX1RPX0VER0UpO1xuXG4gICAgICAgICAgICAgICAgLyp0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgdGhpcy5fZ2wuTElORUFSKTtcclxuICAgICAgICAgICAgICAgICB0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgdGhpcy5fZ2wuTElORUFSX01JUE1BUF9ORUFSRVNUKTtcclxuICAgICAgICAgICAgICAgICB0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfV1JBUF9TLCB0aGlzLl9nbC5DTEFNUF9UT19FREdFKTtcclxuICAgICAgICAgICAgICAgICB0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfV1JBUF9ULCB0aGlzLl9nbC5DTEFNUF9UT19FREdFKTtcclxuICAgICAgICAgICAgICAgICB0aGlzLl9nbC5nZW5lcmF0ZU1pcG1hcCh0aGlzLl9nbC5URVhUVVJFXzJEKTsqL1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgICAgICBpZiAoYXJyIGluc3RhbmNlb2YgV2ViR0xUZXh0dXJlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50ZXh0dXJlRGF0YSA9IGFycjtcbiAgICAgICAgICAgICAgICB0aGlzLnRleHR1cmVEYXRhVGVtcCA9IGFycjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcHModGhpcy50ZXh0dXJlRGF0YSwgZmxpcCk7XG4gICAgICAgICAgICAgICAgd3JpdGVUZXhOb3coYXJyKTtcbiAgICAgICAgICAgICAgICB0cCgpO1xuXG4gICAgICAgICAgICAgICAgcHModGhpcy50ZXh0dXJlRGF0YVRlbXAsIGZsaXApO1xuICAgICAgICAgICAgICAgIHdyaXRlVGV4Tm93KGFycik7XG4gICAgICAgICAgICAgICAgdHAoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5fZ2wuYmluZFRleHR1cmUodGhpcy5fZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJ3cml0ZUJ1ZmZlclwiLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogV3JpdGUgb24gYnVmZmVyXHJcbiAgICAgICAgICogQHBhcmFtIHtBcnJheTxmbG9hdD58RmxvYXQzMkFycmF5fFVpbnQ4QXJyYXl8V2ViR0xUZXh0dXJlfEhUTUxJbWFnZUVsZW1lbnR9IGFyclxyXG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2ZsaXA9ZmFsc2VdXHJcbiAgICAgICAgICogQHBhcmFtIHtBcnJheTxGbG9hdDI+fSBbb3ZlcnJpZGVEaW1lbnNpb25zPW5ldyBBcnJheSgpe01hdGguc3FydCh2YWx1ZS5sZW5ndGgpLCBNYXRoLnNxcnQodmFsdWUubGVuZ3RoKX1dXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiB3cml0ZUJ1ZmZlcihhcnIsIGZsaXAsIG92ZXJyaWRlRGltZW5zaW9ucykge1xuICAgICAgICAgICAgdmFyIHByZXBhcmVBcnIgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoYXJyIGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubGVuZ3RoLmNvbnN0cnVjdG9yID09PSBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sZW5ndGggPSB0aGlzLmxlbmd0aFswXSAqIHRoaXMubGVuZ3RoWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5XID0gdGhpcy5sZW5ndGhbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLkggPSB0aGlzLmxlbmd0aFsxXTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuVyA9IE1hdGguY2VpbChNYXRoLnNxcnQodGhpcy5sZW5ndGgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuSCA9IHRoaXMuVztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnR5cGUgPT09ICdGTE9BVDQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcnIgPSBhcnIgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgPyBhcnIgOiBuZXcgRmxvYXQzMkFycmF5KGFycik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsID0gdGhpcy5XICogdGhpcy5IICogNDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcnIubGVuZ3RoICE9PSBsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFycnQgPSBuZXcgRmxvYXQzMkFycmF5KGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDwgbDsgbisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFycnRbbl0gPSBhcnJbbl0gIT0gbnVsbCA/IGFycltuXSA6IDAuMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyID0gYXJydDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnR5cGUgPT09ICdGTE9BVCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBfbCA9IHRoaXMuVyAqIHRoaXMuSCAqIDQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXJyYXlUZW1wID0gbmV3IEZsb2F0MzJBcnJheShfbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBfbiA9IDAsIGYgPSB0aGlzLlcgKiB0aGlzLkg7IF9uIDwgZjsgX24rKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpZGQgPSBfbiAqIDQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyYXlUZW1wW2lkZF0gPSBhcnJbX25dICE9IG51bGwgPyBhcnJbX25dIDogMC4wO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFycmF5VGVtcFtpZGQgKyAxXSA9IDAuMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnJheVRlbXBbaWRkICsgMl0gPSAwLjA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyYXlUZW1wW2lkZCArIDNdID0gMC4wO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYXJyID0gYXJyYXlUZW1wO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhcnI7XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgICAgIGlmIChvdmVycmlkZURpbWVuc2lvbnMgPT09IHVuZGVmaW5lZCB8fCBvdmVycmlkZURpbWVuc2lvbnMgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJyIGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCkgdGhpcy5sZW5ndGggPSBhcnIud2lkdGggKiBhcnIuaGVpZ2h0O2Vsc2UgdGhpcy5sZW5ndGggPSB0aGlzLnR5cGUgPT09IFwiRkxPQVQ0XCIgPyBhcnIubGVuZ3RoIC8gNCA6IGFyci5sZW5ndGg7XG4gICAgICAgICAgICB9IGVsc2UgdGhpcy5sZW5ndGggPSBbb3ZlcnJpZGVEaW1lbnNpb25zWzBdLCBvdmVycmlkZURpbWVuc2lvbnNbMV1dO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5tb2RlID09PSBcIlNBTVBMRVJcIikge1xuICAgICAgICAgICAgICAgIHRoaXMud3JpdGVXZWJHTFRleHR1cmVCdWZmZXIocHJlcGFyZUFycihhcnIpLCBmbGlwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFwiU0FNUExFUlwiIHx8IHRoaXMubW9kZSA9PT0gXCJBVFRSSUJVVEVcIikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRCdWZmZXIodGhpcy5fZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnZlcnRleERhdGEwKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5idWZmZXJEYXRhKHRoaXMuX2dsLkFSUkFZX0JVRkZFUiwgYXJyIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5ID8gYXJyIDogbmV3IEZsb2F0MzJBcnJheShhcnIpLCB0aGlzLl9nbC5TVEFUSUNfRFJBVyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5tb2RlID09PSBcIlZFUlRFWF9JTkRFWFwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEJ1ZmZlcih0aGlzLl9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgdGhpcy52ZXJ0ZXhEYXRhMCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuYnVmZmVyRGF0YSh0aGlzLl9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbmV3IFVpbnQxNkFycmF5KGFyciksIHRoaXMuX2dsLlNUQVRJQ19EUkFXKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jcmVhdGVGcmFtZWJ1ZmZlckFuZFJlbmRlcmJ1ZmZlcigpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwicmVtb3ZlXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSZW1vdmUgdGhpcyBidWZmZXJcclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlbW92ZSgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFwiU0FNUExFUlwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuZGVsZXRlVGV4dHVyZSh0aGlzLnRleHR1cmVEYXRhKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5kZWxldGVUZXh0dXJlKHRoaXMudGV4dHVyZURhdGFUZW1wKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gXCJTQU1QTEVSXCIgfHwgdGhpcy5tb2RlID09PSBcIkFUVFJJQlVURVwiIHx8IHRoaXMubW9kZSA9PT0gXCJWRVJURVhfSU5ERVhcIikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmRlbGV0ZUJ1ZmZlcih0aGlzLnZlcnRleERhdGEwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5fZ2wuZGVsZXRlRnJhbWVidWZmZXIodGhpcy5mQnVmZmVyKTtcbiAgICAgICAgICAgIHRoaXMuX2dsLmRlbGV0ZUZyYW1lYnVmZmVyKHRoaXMuZkJ1ZmZlclRlbXApO1xuXG4gICAgICAgICAgICB0aGlzLl9nbC5kZWxldGVSZW5kZXJidWZmZXIodGhpcy5yZW5kZXJCdWZmZXIpO1xuICAgICAgICAgICAgdGhpcy5fZ2wuZGVsZXRlUmVuZGVyYnVmZmVyKHRoaXMucmVuZGVyQnVmZmVyVGVtcCk7XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gV2ViQ0xHTEJ1ZmZlcjtcbn0oKTtcblxuZ2xvYmFsLldlYkNMR0xCdWZmZXIgPSBXZWJDTEdMQnVmZmVyO1xubW9kdWxlLmV4cG9ydHMuV2ViQ0xHTEJ1ZmZlciA9IFdlYkNMR0xCdWZmZXI7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuV2ViQ0xHTEZvciA9IHVuZGVmaW5lZDtcblxudmFyIF9jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0oKTtcblxuZXhwb3J0cy5ncHVmb3IgPSBncHVmb3I7XG5cbnZhciBfV2ViQ0xHTCA9IHJlcXVpcmUoXCIuL1dlYkNMR0wuY2xhc3NcIik7XG5cbnZhciBfV2ViQ0xHTFV0aWxzID0gcmVxdWlyZShcIi4vV2ViQ0xHTFV0aWxzLmNsYXNzXCIpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG4vKipcbiAqIFdlYkNMR0xGb3JcbiAqIEBjbGFzc1xuICovXG52YXIgV2ViQ0xHTEZvciA9IGV4cG9ydHMuV2ViQ0xHTEZvciA9IGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBXZWJDTEdMRm9yKGpzb25Jbikge1xuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgV2ViQ0xHTEZvcik7XG5cbiAgICAgICAgdGhpcy5rZXJuZWxzID0ge307XG4gICAgICAgIHRoaXMudmVydGV4RnJhZ21lbnRQcm9ncmFtcyA9IHt9O1xuICAgICAgICB0aGlzLl9hcmdzID0ge307XG4gICAgICAgIHRoaXMuX2FyZ3NWYWx1ZXMgPSB7fTtcbiAgICAgICAgdGhpcy5jYWxsZWRBcmdzID0ge307XG5cbiAgICAgICAgdGhpcy5fd2ViQ0xHTCA9IG51bGw7XG4gICAgICAgIHRoaXMuX2dsID0gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBkZWZpbmVPdXRwdXRUZW1wTW9kZXNcbiAgICAgKiBAcmV0dXJucyB7QXJyYXk8Ym9vbGVhbj59XG4gICAgICovXG5cblxuICAgIF9jcmVhdGVDbGFzcyhXZWJDTEdMRm9yLCBbe1xuICAgICAgICBrZXk6IFwiZGVmaW5lT3V0cHV0VGVtcE1vZGVzXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBkZWZpbmVPdXRwdXRUZW1wTW9kZXMob3V0cHV0LCBhcmdzKSB7XG4gICAgICAgICAgICB2YXIgc2VhcmNoSW5BcmdzID0gZnVuY3Rpb24gc2VhcmNoSW5BcmdzKG91dHB1dE5hbWUsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICB2YXIgZm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gYXJncykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ICE9PSBcImluZGljZXNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4cGwgPSBrZXkuc3BsaXQoXCIgXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV4cGwubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhcmdOYW1lID0gZXhwbFsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXJnTmFtZSA9PT0gb3V0cHV0TmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgb3V0cHV0VGVtcE1vZGVzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8IG91dHB1dC5sZW5ndGg7IG4rKykge1xuICAgICAgICAgICAgICAgIG91dHB1dFRlbXBNb2Rlc1tuXSA9IG91dHB1dFtuXSAhPSBudWxsID8gc2VhcmNoSW5BcmdzKG91dHB1dFtuXSwgYXJncykgOiBmYWxzZTtcbiAgICAgICAgICAgIH1yZXR1cm4gb3V0cHV0VGVtcE1vZGVzO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwicHJlcGFyZVJldHVybkNvZGVcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBwcmVwYXJlUmV0dXJuQ29kZVxuICAgICAgICAgKiBAcmV0dXJucyB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHByZXBhcmVSZXR1cm5Db2RlKHNvdXJjZSwgb3V0QXJnKSB7XG4gICAgICAgICAgICB2YXIgb2JqT3V0U3RyID0gW107XG4gICAgICAgICAgICB2YXIgcmV0Q29kZSA9IHNvdXJjZS5tYXRjaChuZXcgUmVnRXhwKC9yZXR1cm4uKiQvZ20pKTtcbiAgICAgICAgICAgIHJldENvZGUgPSByZXRDb2RlWzBdLnJlcGxhY2UoXCJyZXR1cm4gXCIsIFwiXCIpOyAvLyBub3cgXCJ2YXJ4XCIgb3IgXCJbdmFyeDEsdmFyeDIsLi5dXCJcbiAgICAgICAgICAgIHZhciBpc0FyciA9IHJldENvZGUubWF0Y2gobmV3IFJlZ0V4cCgvXFxbL2dtKSk7XG4gICAgICAgICAgICBpZiAoaXNBcnIgIT0gbnVsbCAmJiBpc0Fyci5sZW5ndGggPj0gMSkge1xuICAgICAgICAgICAgICAgIC8vIHR5cGUgb3V0cHV0cyBhcnJheVxuICAgICAgICAgICAgICAgIHJldENvZGUgPSByZXRDb2RlLnNwbGl0KFwiW1wiKVsxXS5zcGxpdChcIl1cIilbMF07XG4gICAgICAgICAgICAgICAgdmFyIGl0ZW1TdHIgPSBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBvcGVuUGFyZW50aCA9IDA7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPCByZXRDb2RlLmxlbmd0aDsgbisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXRDb2RlW25dID09PSBcIixcIiAmJiBvcGVuUGFyZW50aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2JqT3V0U3RyLnB1c2goaXRlbVN0cik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtU3RyID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGl0ZW1TdHIgKz0gcmV0Q29kZVtuXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocmV0Q29kZVtuXSA9PT0gXCIoXCIpIG9wZW5QYXJlbnRoKys7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXRDb2RlW25dID09PSBcIilcIikgb3BlblBhcmVudGgtLTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb2JqT3V0U3RyLnB1c2goaXRlbVN0cik7IC8vIGFuZCB0aGUgbGFzdFxuICAgICAgICAgICAgfSBlbHNlIC8vIHR5cGUgb25lIG91dHB1dFxuICAgICAgICAgICAgICAgIG9iak91dFN0ci5wdXNoKHJldENvZGUucmVwbGFjZSgvOyQvZ20sIFwiXCIpKTtcblxuICAgICAgICAgICAgdmFyIHJldHVybkNvZGUgPSBcIlwiO1xuICAgICAgICAgICAgZm9yICh2YXIgX24gPSAwOyBfbiA8IG91dEFyZy5sZW5ndGg7IF9uKyspIHtcbiAgICAgICAgICAgICAgICAvLyBzZXQgb3V0cHV0IHR5cGUgZmxvYXR8ZmxvYXQ0XG4gICAgICAgICAgICAgICAgdmFyIGZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuX2FyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSAhPT0gXCJpbmRpY2VzXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBleHBsID0ga2V5LnNwbGl0KFwiIFwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV4cGxbMV0gPT09IG91dEFyZ1tfbl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbXQgPSBleHBsWzBdLm1hdGNoKG5ldyBSZWdFeHAoXCJmbG9hdDRcIiwgXCJnbVwiKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuQ29kZSArPSBtdCAhPSBudWxsICYmIG10Lmxlbmd0aCA+IDAgPyBcIm91dFwiICsgX24gKyBcIl9mbG9hdDQgPSBcIiArIG9iak91dFN0cltfbl0gKyBcIjtcXG5cIiA6IFwib3V0XCIgKyBfbiArIFwiX2Zsb2F0ID0gXCIgKyBvYmpPdXRTdHJbX25dICsgXCI7XFxuXCI7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kID09PSBmYWxzZSkgcmV0dXJuQ29kZSArPSBcIm91dFwiICsgX24gKyBcIl9mbG9hdDQgPSBcIiArIG9iak91dFN0cltfbl0gKyBcIjtcXG5cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXR1cm5Db2RlO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiYWRkS2VybmVsXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogQWRkIG9uZSBXZWJDTEdMS2VybmVsIHRvIHRoZSB3b3JrXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBrZXJuZWxKc29uXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gYWRkS2VybmVsKGtlcm5lbEpzb24pIHtcbiAgICAgICAgICAgIHZhciBjb25mID0ga2VybmVsSnNvbi5jb25maWc7XG4gICAgICAgICAgICB2YXIgaWR4ID0gY29uZlswXTtcbiAgICAgICAgICAgIHZhciBvdXRBcmcgPSBjb25mWzFdIGluc3RhbmNlb2YgQXJyYXkgPyBjb25mWzFdIDogW2NvbmZbMV1dO1xuICAgICAgICAgICAgdmFyIGtIID0gY29uZlsyXTtcbiAgICAgICAgICAgIHZhciBrUyA9IGNvbmZbM107XG5cbiAgICAgICAgICAgIHZhciBrZXJuZWwgPSB0aGlzLl93ZWJDTEdMLmNyZWF0ZUtlcm5lbCgpO1xuXG4gICAgICAgICAgICB2YXIgc3RyQXJncyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuX2FyZ3MpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXhwbCA9IGtleS5zcGxpdChcIiBcIik7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ05hbWUgPSBleHBsWzFdO1xuXG4gICAgICAgICAgICAgICAgLy8gc2VhcmNoIGFyZ3VtZW50cyBpbiB1c2VcbiAgICAgICAgICAgICAgICBpZiAoYXJnTmFtZSAhPT0gdW5kZWZpbmVkICYmIGFyZ05hbWUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1hdGNoZXMgPSAoa0ggKyBrUykubWF0Y2gobmV3IFJlZ0V4cChhcmdOYW1lLnJlcGxhY2UoL1xcW1xcZC4qLywgXCJcIiksIFwiZ21cIikpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ICE9PSBcImluZGljZXNcIiAmJiBtYXRjaGVzICE9IG51bGwgJiYgbWF0Y2hlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBrZXJuZWwuaW5fdmFsdWVzW2FyZ05hbWVdID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJBcmdzLnB1c2goa2V5LnJlcGxhY2UoXCIqYXR0ciBcIiwgXCIqIFwiKS5yZXBsYWNlKC9cXFtcXGQuKi8sIFwiXCIpKTsgLy8gbWFrZSByZXBsYWNlIGZvciBlbnN1cmUgbm8gKmF0dHIgaW4gS0VSTkVMXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGtTID0gJ3ZvaWQgbWFpbignICsgc3RyQXJncy50b1N0cmluZygpICsgJykgeycgKyAndmVjMiAnICsgaWR4ICsgJyA9IGdldF9nbG9iYWxfaWQoKTsnICsga1MucmVwbGFjZSgvcmV0dXJuLiokL2dtLCB0aGlzLnByZXBhcmVSZXR1cm5Db2RlKGtTLCBvdXRBcmcpKSArICd9JztcblxuICAgICAgICAgICAga2VybmVsLm5hbWUgPSBrZXJuZWxKc29uLm5hbWU7XG4gICAgICAgICAgICBrZXJuZWwudmlld1NvdXJjZSA9IGtlcm5lbEpzb24udmlld1NvdXJjZSAhPSBudWxsID8ga2VybmVsSnNvbi52aWV3U291cmNlIDogZmFsc2U7XG4gICAgICAgICAgICBrZXJuZWwuc2V0S2VybmVsU291cmNlKGtTLCBrSCk7XG5cbiAgICAgICAgICAgIGtlcm5lbC5vdXRwdXQgPSBvdXRBcmc7XG4gICAgICAgICAgICBrZXJuZWwub3V0cHV0VGVtcE1vZGVzID0gdGhpcy5kZWZpbmVPdXRwdXRUZW1wTW9kZXMob3V0QXJnLCB0aGlzLl9hcmdzKTtcbiAgICAgICAgICAgIGtlcm5lbC5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGtlcm5lbC5kcmF3TW9kZSA9IGtlcm5lbEpzb24uZHJhd01vZGUgIT0gbnVsbCA/IGtlcm5lbEpzb24uZHJhd01vZGUgOiA0O1xuICAgICAgICAgICAga2VybmVsLmRlcHRoVGVzdCA9IGtlcm5lbEpzb24uZGVwdGhUZXN0ICE9IG51bGwgPyBrZXJuZWxKc29uLmRlcHRoVGVzdCA6IHRydWU7XG4gICAgICAgICAgICBrZXJuZWwuYmxlbmQgPSBrZXJuZWxKc29uLmJsZW5kICE9IG51bGwgPyBrZXJuZWxKc29uLmJsZW5kIDogZmFsc2U7XG4gICAgICAgICAgICBrZXJuZWwuYmxlbmRFcXVhdGlvbiA9IGtlcm5lbEpzb24uYmxlbmRFcXVhdGlvbiAhPSBudWxsID8ga2VybmVsSnNvbi5ibGVuZEVxdWF0aW9uIDogXCJGVU5DX0FERFwiO1xuICAgICAgICAgICAga2VybmVsLmJsZW5kU3JjTW9kZSA9IGtlcm5lbEpzb24uYmxlbmRTcmNNb2RlICE9IG51bGwgPyBrZXJuZWxKc29uLmJsZW5kU3JjTW9kZSA6IFwiU1JDX0FMUEhBXCI7XG4gICAgICAgICAgICBrZXJuZWwuYmxlbmREc3RNb2RlID0ga2VybmVsSnNvbi5ibGVuZERzdE1vZGUgIT0gbnVsbCA/IGtlcm5lbEpzb24uYmxlbmREc3RNb2RlIDogXCJPTkVfTUlOVVNfU1JDX0FMUEhBXCI7XG5cbiAgICAgICAgICAgIHRoaXMua2VybmVsc1tPYmplY3Qua2V5cyh0aGlzLmtlcm5lbHMpLmxlbmd0aC50b1N0cmluZygpXSA9IGtlcm5lbDtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImFkZEdyYXBoaWNcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBhZGRHcmFwaGljXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBncmFwaGljSnNvblxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGFkZEdyYXBoaWMoZ3JhcGhpY0pzb24pIHtcbiAgICAgICAgICAgIHZhciBjb25mID0gZ3JhcGhpY0pzb24uY29uZmlnO1xuICAgICAgICAgICAgdmFyIG91dEFyZyA9IFtudWxsXTtcbiAgICAgICAgICAgIHZhciBWRlBfdmVydGV4SCA9IHZvaWQgMDtcbiAgICAgICAgICAgIHZhciBWRlBfdmVydGV4UyA9IHZvaWQgMDtcbiAgICAgICAgICAgIHZhciBWRlBfZnJhZ21lbnRIID0gdm9pZCAwO1xuICAgICAgICAgICAgdmFyIFZGUF9mcmFnbWVudFMgPSB2b2lkIDA7XG4gICAgICAgICAgICBpZiAoY29uZi5sZW5ndGggPT09IDUpIHtcbiAgICAgICAgICAgICAgICBvdXRBcmcgPSBjb25mWzBdIGluc3RhbmNlb2YgQXJyYXkgPyBjb25mWzBdIDogW2NvbmZbMF1dO1xuICAgICAgICAgICAgICAgIFZGUF92ZXJ0ZXhIID0gY29uZlsxXTtcbiAgICAgICAgICAgICAgICBWRlBfdmVydGV4UyA9IGNvbmZbMl07XG4gICAgICAgICAgICAgICAgVkZQX2ZyYWdtZW50SCA9IGNvbmZbM107XG4gICAgICAgICAgICAgICAgVkZQX2ZyYWdtZW50UyA9IGNvbmZbNF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIFZGUF92ZXJ0ZXhIID0gY29uZlswXTtcbiAgICAgICAgICAgICAgICBWRlBfdmVydGV4UyA9IGNvbmZbMV07XG4gICAgICAgICAgICAgICAgVkZQX2ZyYWdtZW50SCA9IGNvbmZbMl07XG4gICAgICAgICAgICAgICAgVkZQX2ZyYWdtZW50UyA9IGNvbmZbM107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB2ZnByb2dyYW0gPSB0aGlzLl93ZWJDTEdMLmNyZWF0ZVZlcnRleEZyYWdtZW50UHJvZ3JhbSgpO1xuXG4gICAgICAgICAgICB2YXIgc3RyQXJnc192ID0gW10sXG4gICAgICAgICAgICAgICAgc3RyQXJnc19mID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5fYXJncykge1xuICAgICAgICAgICAgICAgIHZhciBleHBsID0ga2V5LnNwbGl0KFwiIFwiKTtcbiAgICAgICAgICAgICAgICB2YXIgYXJnTmFtZSA9IGV4cGxbMV07XG5cbiAgICAgICAgICAgICAgICAvLyBzZWFyY2ggYXJndW1lbnRzIGluIHVzZVxuICAgICAgICAgICAgICAgIGlmIChhcmdOYW1lICE9PSB1bmRlZmluZWQgJiYgYXJnTmFtZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbWF0Y2hlcyA9IChWRlBfdmVydGV4SCArIFZGUF92ZXJ0ZXhTKS5tYXRjaChuZXcgUmVnRXhwKGFyZ05hbWUucmVwbGFjZSgvXFxbXFxkLiovLCBcIlwiKSwgXCJnbVwiKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkgIT09IFwiaW5kaWNlc1wiICYmIG1hdGNoZXMgIT0gbnVsbCAmJiBtYXRjaGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZmcHJvZ3JhbS5pbl92ZXJ0ZXhfdmFsdWVzW2FyZ05hbWVdID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJBcmdzX3YucHVzaChrZXkucmVwbGFjZSgvXFxbXFxkLiovLCBcIlwiKSk7IC8vIG1ha2UgcmVwbGFjZSBmb3IgZW5zdXJlIG5vICphdHRyIGluIEtFUk5FTFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgX2tleSBpbiB0aGlzLl9hcmdzKSB7XG4gICAgICAgICAgICAgICAgdmFyIF9leHBsID0gX2tleS5zcGxpdChcIiBcIik7XG4gICAgICAgICAgICAgICAgdmFyIF9hcmdOYW1lID0gX2V4cGxbMV07XG5cbiAgICAgICAgICAgICAgICAvLyBzZWFyY2ggYXJndW1lbnRzIGluIHVzZVxuICAgICAgICAgICAgICAgIGlmIChfYXJnTmFtZSAhPT0gdW5kZWZpbmVkICYmIF9hcmdOYW1lICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfbWF0Y2hlcyA9IChWRlBfZnJhZ21lbnRIICsgVkZQX2ZyYWdtZW50UykubWF0Y2gobmV3IFJlZ0V4cChfYXJnTmFtZS5yZXBsYWNlKC9cXFtcXGQuKi8sIFwiXCIpLCBcImdtXCIpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF9rZXkgIT09IFwiaW5kaWNlc1wiICYmIF9tYXRjaGVzICE9IG51bGwgJiYgX21hdGNoZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmZwcm9ncmFtLmluX2ZyYWdtZW50X3ZhbHVlc1tfYXJnTmFtZV0gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ckFyZ3NfZi5wdXNoKF9rZXkucmVwbGFjZSgvXFxbXFxkLiovLCBcIlwiKSk7IC8vIG1ha2UgcmVwbGFjZSBmb3IgZW5zdXJlIG5vICphdHRyIGluIEtFUk5FTFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBWRlBfdmVydGV4UyA9ICd2b2lkIG1haW4oJyArIHN0ckFyZ3Nfdi50b1N0cmluZygpICsgJykgeycgKyBWRlBfdmVydGV4UyArICd9JztcbiAgICAgICAgICAgIFZGUF9mcmFnbWVudFMgPSAndm9pZCBtYWluKCcgKyBzdHJBcmdzX2YudG9TdHJpbmcoKSArICcpIHsnICsgVkZQX2ZyYWdtZW50Uy5yZXBsYWNlKC9yZXR1cm4uKiQvZ20sIHRoaXMucHJlcGFyZVJldHVybkNvZGUoVkZQX2ZyYWdtZW50Uywgb3V0QXJnKSkgKyAnfSc7XG5cbiAgICAgICAgICAgIHZmcHJvZ3JhbS5uYW1lID0gZ3JhcGhpY0pzb24ubmFtZTtcbiAgICAgICAgICAgIHZmcHJvZ3JhbS52aWV3U291cmNlID0gZ3JhcGhpY0pzb24udmlld1NvdXJjZSAhPSBudWxsID8gZ3JhcGhpY0pzb24udmlld1NvdXJjZSA6IGZhbHNlO1xuICAgICAgICAgICAgdmZwcm9ncmFtLnNldFZlcnRleFNvdXJjZShWRlBfdmVydGV4UywgVkZQX3ZlcnRleEgpO1xuICAgICAgICAgICAgdmZwcm9ncmFtLnNldEZyYWdtZW50U291cmNlKFZGUF9mcmFnbWVudFMsIFZGUF9mcmFnbWVudEgpO1xuXG4gICAgICAgICAgICB2ZnByb2dyYW0ub3V0cHV0ID0gb3V0QXJnO1xuICAgICAgICAgICAgdmZwcm9ncmFtLm91dHB1dFRlbXBNb2RlcyA9IHRoaXMuZGVmaW5lT3V0cHV0VGVtcE1vZGVzKG91dEFyZywgdGhpcy5fYXJncyk7XG4gICAgICAgICAgICB2ZnByb2dyYW0uZW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgICB2ZnByb2dyYW0uZHJhd01vZGUgPSBncmFwaGljSnNvbi5kcmF3TW9kZSAhPSBudWxsID8gZ3JhcGhpY0pzb24uZHJhd01vZGUgOiA0O1xuICAgICAgICAgICAgdmZwcm9ncmFtLmRlcHRoVGVzdCA9IGdyYXBoaWNKc29uLmRlcHRoVGVzdCAhPSBudWxsID8gZ3JhcGhpY0pzb24uZGVwdGhUZXN0IDogdHJ1ZTtcbiAgICAgICAgICAgIHZmcHJvZ3JhbS5ibGVuZCA9IGdyYXBoaWNKc29uLmJsZW5kICE9IG51bGwgPyBncmFwaGljSnNvbi5ibGVuZCA6IHRydWU7XG4gICAgICAgICAgICB2ZnByb2dyYW0uYmxlbmRFcXVhdGlvbiA9IGdyYXBoaWNKc29uLmJsZW5kRXF1YXRpb24gIT0gbnVsbCA/IGdyYXBoaWNKc29uLmJsZW5kRXF1YXRpb24gOiBcIkZVTkNfQUREXCI7XG4gICAgICAgICAgICB2ZnByb2dyYW0uYmxlbmRTcmNNb2RlID0gZ3JhcGhpY0pzb24uYmxlbmRTcmNNb2RlICE9IG51bGwgPyBncmFwaGljSnNvbi5ibGVuZFNyY01vZGUgOiBcIlNSQ19BTFBIQVwiO1xuICAgICAgICAgICAgdmZwcm9ncmFtLmJsZW5kRHN0TW9kZSA9IGdyYXBoaWNKc29uLmJsZW5kRHN0TW9kZSAhPSBudWxsID8gZ3JhcGhpY0pzb24uYmxlbmREc3RNb2RlIDogXCJPTkVfTUlOVVNfU1JDX0FMUEhBXCI7XG5cbiAgICAgICAgICAgIHRoaXMudmVydGV4RnJhZ21lbnRQcm9ncmFtc1tPYmplY3Qua2V5cyh0aGlzLnZlcnRleEZyYWdtZW50UHJvZ3JhbXMpLmxlbmd0aC50b1N0cmluZygpXSA9IHZmcHJvZ3JhbTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImNoZWNrQXJnXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogY2hlY2tBcmdcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGFyZ3VtZW50XG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXk8V2ViQ0xHTEtlcm5lbD59IGtlcm5lbHNcbiAgICAgICAgICogQHBhcmFtIHtBcnJheTxXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtPn0gdmZwc1xuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNoZWNrQXJnKGFyZ3VtZW50LCBrZXJuZWxzLCB2ZnBzKSB7XG4gICAgICAgICAgICB2YXIga2VybmVsUHIgPSBbXTtcbiAgICAgICAgICAgIHZhciB1c2VkSW5WZXJ0ZXggPSBmYWxzZTtcbiAgICAgICAgICAgIHZhciB1c2VkSW5GcmFnbWVudCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4ga2VybmVscykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleUIgaW4ga2VybmVsc1trZXldLmluX3ZhbHVlcykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5WYWx1ZXMgPSBrZXJuZWxzW2tleV0uaW5fdmFsdWVzW2tleUJdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5QiA9PT0gYXJndW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtlcm5lbFByLnB1c2goa2VybmVsc1trZXldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKHZhciBfa2V5MiBpbiB2ZnBzKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX2tleUIgaW4gdmZwc1tfa2V5Ml0uaW5fdmVydGV4X3ZhbHVlcykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgX2luVmFsdWVzID0gdmZwc1tfa2V5Ml0uaW5fdmVydGV4X3ZhbHVlc1tfa2V5Ql07XG4gICAgICAgICAgICAgICAgICAgIGlmIChfa2V5QiA9PT0gYXJndW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZWRJblZlcnRleCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvciAodmFyIF9rZXlCMiBpbiB2ZnBzW19rZXkyXS5pbl9mcmFnbWVudF92YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIF9pblZhbHVlczIgPSB2ZnBzW19rZXkyXS5pbl9mcmFnbWVudF92YWx1ZXNbX2tleUIyXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKF9rZXlCMiA9PT0gYXJndW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZWRJbkZyYWdtZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIFwidXNlZEluVmVydGV4XCI6IHVzZWRJblZlcnRleCxcbiAgICAgICAgICAgICAgICBcInVzZWRJbkZyYWdtZW50XCI6IHVzZWRJbkZyYWdtZW50LFxuICAgICAgICAgICAgICAgIFwia2VybmVsUHJcIjoga2VybmVsUHIgfTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImZpbGxBcmdcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBmaWxsQXJnXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBhcmdOYW1lXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXk8ZmxvYXQ+fSBjbGVhckNvbG9yXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZmlsbEFyZyhhcmdOYW1lLCBjbGVhckNvbG9yKSB7XG4gICAgICAgICAgICB0aGlzLl93ZWJDTEdMLmZpbGxCdWZmZXIodGhpcy5fYXJnc1ZhbHVlc1thcmdOYW1lXS50ZXh0dXJlRGF0YSwgY2xlYXJDb2xvciwgdGhpcy5fYXJnc1ZhbHVlc1thcmdOYW1lXS5mQnVmZmVyKSwgdGhpcy5fd2ViQ0xHTC5maWxsQnVmZmVyKHRoaXMuX2FyZ3NWYWx1ZXNbYXJnTmFtZV0udGV4dHVyZURhdGFUZW1wLCBjbGVhckNvbG9yLCB0aGlzLl9hcmdzVmFsdWVzW2FyZ05hbWVdLmZCdWZmZXJUZW1wKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImdldEFsbEFyZ3NcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgYWxsIGFyZ3VtZW50cyBleGlzdGluZyBpbiBwYXNzZWQga2VybmVscyAmIHZlcnRleEZyYWdtZW50UHJvZ3JhbXNcbiAgICAgICAgICogQHJldHVybnMge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRBbGxBcmdzKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2FyZ3NWYWx1ZXM7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJhZGRBcmdcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBhZGRBcmdcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGFyZ1xuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGFkZEFyZyhhcmcpIHtcbiAgICAgICAgICAgIHRoaXMuX2FyZ3NbYXJnXSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJnZXRHUFVGb3JBcmdcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgYXJndW1lbnQgZnJvbSBvdGhlciBncHVmb3IgKGluc3RlYWQgb2YgYWRkQXJnICYgc2V0QXJnKVxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gYXJndW1lbnQgQXJndW1lbnQgdG8gc2V0XG4gICAgICAgICAqIEBwYXJhbSB7V2ViQ0xHTEZvcn0gZ3B1Zm9yXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0R1BVRm9yQXJnKGFyZ3VtZW50LCBncHVmb3IpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNhbGxlZEFyZ3MuaGFzT3duUHJvcGVydHkoYXJndW1lbnQpID09PSBmYWxzZSkgdGhpcy5jYWxsZWRBcmdzW2FyZ3VtZW50XSA9IFtdO1xuICAgICAgICAgICAgaWYgKHRoaXMuY2FsbGVkQXJnc1thcmd1bWVudF0uaW5kZXhPZihncHVmb3IpID09PSAtMSkgdGhpcy5jYWxsZWRBcmdzW2FyZ3VtZW50XS5wdXNoKGdwdWZvcik7XG5cbiAgICAgICAgICAgIGlmIChncHVmb3IuY2FsbGVkQXJncy5oYXNPd25Qcm9wZXJ0eShhcmd1bWVudCkgPT09IGZhbHNlKSBncHVmb3IuY2FsbGVkQXJnc1thcmd1bWVudF0gPSBbXTtcbiAgICAgICAgICAgIGlmIChncHVmb3IuY2FsbGVkQXJnc1thcmd1bWVudF0uaW5kZXhPZih0aGlzKSA9PT0gLTEpIGdwdWZvci5jYWxsZWRBcmdzW2FyZ3VtZW50XS5wdXNoKHRoaXMpO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gZ3B1Zm9yLl9hcmdzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ05hbWUgPSBrZXkuc3BsaXQoXCIgXCIpWzFdO1xuICAgICAgICAgICAgICAgIGlmIChhcmdOYW1lID09PSBhcmd1bWVudCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hcmdzW2tleV0gPSBncHVmb3IuX2FyZ3Nba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXJnc1ZhbHVlc1thcmdOYW1lXSA9IGdwdWZvci5fYXJnc1ZhbHVlc1thcmdOYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwic2V0QXJnXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogQXNzaWduIHZhbHVlIG9mIGEgYXJndW1lbnQgZm9yIGFsbCBhZGRlZCBLZXJuZWxzIGFuZCB2ZXJ0ZXhGcmFnbWVudFByb2dyYW1zXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBhcmd1bWVudCBBcmd1bWVudCB0byBzZXRcbiAgICAgICAgICogQHBhcmFtIHtmbG9hdHxBcnJheTxmbG9hdD58RmxvYXQzMkFycmF5fFVpbnQ4QXJyYXl8V2ViR0xUZXh0dXJlfEhUTUxJbWFnZUVsZW1lbnR9IHZhbHVlXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXk8ZmxvYXQyPn0gW292ZXJyaWRlRGltZW5zaW9ucz1uZXcgQXJyYXkoKXtNYXRoLnNxcnQodmFsdWUubGVuZ3RoKSwgTWF0aC5zcXJ0KHZhbHVlLmxlbmd0aCl9XVxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gW292ZXJyaWRlVHlwZT1cIkZMT0FUNFwiXSAtIGZvcmNlIFwiRkxPQVQ0XCIgb3IgXCJGTE9BVFwiIChmb3Igbm8gZ3JhcGhpYyBwcm9ncmFtKVxuICAgICAgICAgKiBAcmV0dXJucyB7ZmxvYXR8QXJyYXk8ZmxvYXQ+fEZsb2F0MzJBcnJheXxVaW50OEFycmF5fFdlYkdMVGV4dHVyZXxIVE1MSW1hZ2VFbGVtZW50fVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHNldEFyZyhhcmd1bWVudCwgdmFsdWUsIG92ZXJyaWRlRGltZW5zaW9ucywgb3ZlcnJpZGVUeXBlKSB7XG4gICAgICAgICAgICBpZiAoYXJndW1lbnQgPT09IFwiaW5kaWNlc1wiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXRJbmRpY2VzKHZhbHVlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuX2FyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbXBsZXRlVmFyTmFtZSA9IGtleS5zcGxpdChcIiBcIilbMV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wbGV0ZVZhck5hbWUgIT09IHVuZGVmaW5lZCAmJiBjb21wbGV0ZVZhck5hbWUucmVwbGFjZSgvXFxbXFxkLiovLCBcIlwiKSA9PT0gYXJndW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb21wbGV0ZVZhck5hbWUgIT09IGFyZ3VtZW50KSBhcmd1bWVudCA9IGNvbXBsZXRlVmFyTmFtZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHVwZGF0ZUNhbGxlZEFyZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleS5tYXRjaCgvXFwqL2dtKSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYnVmZmVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNoZWNrUmVzdWx0ID0gdGhpcy5jaGVja0FyZyhhcmd1bWVudCwgdGhpcy5rZXJuZWxzLCB0aGlzLnZlcnRleEZyYWdtZW50UHJvZ3JhbXMpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1vZGUgPSBcIlNBTVBMRVJcIjsgLy8gQVRUUklCVVRFIG9yIFNBTVBMRVJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hlY2tSZXN1bHQudXNlZEluVmVydGV4ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGVja1Jlc3VsdC5rZXJuZWxQci5sZW5ndGggPT09IDAgJiYgY2hlY2tSZXN1bHQudXNlZEluRnJhZ21lbnQgPT09IGZhbHNlKSBtb2RlID0gXCJBVFRSSUJVVEVcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdHlwZSA9IGtleS5zcGxpdChcIipcIilbMF0udG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3ZlcnJpZGVUeXBlICE9PSB1bmRlZmluZWQgJiYgb3ZlcnJpZGVUeXBlICE9PSBudWxsKSB0eXBlID0gb3ZlcnJpZGVUeXBlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2FyZ3NWYWx1ZXMuaGFzT3duUHJvcGVydHkoYXJndW1lbnQpID09PSBmYWxzZSB8fCB0aGlzLl9hcmdzVmFsdWVzLmhhc093blByb3BlcnR5KGFyZ3VtZW50KSA9PT0gdHJ1ZSAmJiB0aGlzLl9hcmdzVmFsdWVzW2FyZ3VtZW50XSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9hcmdzVmFsdWVzW2FyZ3VtZW50XSA9IHRoaXMuX3dlYkNMR0wuY3JlYXRlQnVmZmVyKHR5cGUsIGZhbHNlLCBtb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2FyZ3NWYWx1ZXNbYXJndW1lbnRdLmFyZ3VtZW50ID0gYXJndW1lbnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZUNhbGxlZEFyZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXJnc1ZhbHVlc1thcmd1bWVudF0ud3JpdGVCdWZmZXIodmFsdWUsIGZhbHNlLCBvdmVycmlkZURpbWVuc2lvbnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2FyZ3NWYWx1ZXNbYXJndW1lbnRdID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVOSUZPUk1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCkgdGhpcy5fYXJnc1ZhbHVlc1thcmd1bWVudF0gPSB2YWx1ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZUNhbGxlZEFyZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1cGRhdGVDYWxsZWRBcmcgPT09IHRydWUgJiYgdGhpcy5jYWxsZWRBcmdzLmhhc093blByb3BlcnR5KGFyZ3VtZW50KSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDwgdGhpcy5jYWxsZWRBcmdzW2FyZ3VtZW50XS5sZW5ndGg7IG4rKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgX2dwdWZvciA9IHRoaXMuY2FsbGVkQXJnc1thcmd1bWVudF1bbl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9ncHVmb3IuX2FyZ3NWYWx1ZXNbYXJndW1lbnRdID0gdGhpcy5fYXJnc1ZhbHVlc1thcmd1bWVudF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInJlYWRBcmdcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgRmxvYXQzMkFycmF5IGFycmF5IGZyb20gYSBhcmd1bWVudFxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gYXJndW1lbnRcbiAgICAgICAgICogQHJldHVybnMge0Zsb2F0MzJBcnJheX1cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiByZWFkQXJnKGFyZ3VtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fd2ViQ0xHTC5yZWFkQnVmZmVyKHRoaXMuX2FyZ3NWYWx1ZXNbYXJndW1lbnRdKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInNldEluZGljZXNcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZXQgaW5kaWNlcyBmb3IgdGhlIGdlb21ldHJ5IHBhc3NlZCBpbiB2ZXJ0ZXhGcmFnbWVudFByb2dyYW1cbiAgICAgICAgICogQHBhcmFtIHtBcnJheTxmbG9hdD59IGFyclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHNldEluZGljZXMoYXJyKSB7XG4gICAgICAgICAgICB0aGlzLkNMR0xfYnVmZmVySW5kaWNlcyA9IHRoaXMuX3dlYkNMR0wuY3JlYXRlQnVmZmVyKFwiRkxPQVRcIiwgZmFsc2UsIFwiVkVSVEVYX0lOREVYXCIpO1xuICAgICAgICAgICAgdGhpcy5DTEdMX2J1ZmZlckluZGljZXMud3JpdGVCdWZmZXIoYXJyKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImdldEN0eFwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGdldEN0eFxuICAgICAgICAgKiByZXR1cm5zIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0Q3R4KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlYkNMR0wuZ2V0Q29udGV4dCgpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwic2V0Q3R4XCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogc2V0Q3R4XG4gICAgICAgICAqIEBwYXJhbSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbFxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHNldEN0eChnbCkge1xuICAgICAgICAgICAgdGhpcy5fZ2wgPSBnbDtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImdldFdlYkNMR0xcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBnZXRXZWJDTEdMXG4gICAgICAgICAqIHJldHVybnMge1dlYkNMR0x9XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0V2ViQ0xHTCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWJDTEdMO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwib25QcmVQcm9jZXNzS2VybmVsXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogb25QcmVQcm9jZXNzS2VybmVsXG4gICAgICAgICAqIEBwYXJhbSB7aW50fSBba2VybmVsTnVtPTBdXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gb25QcmVQcm9jZXNzS2VybmVsKGtlcm5lbE51bSwgZm4pIHtcbiAgICAgICAgICAgIHRoaXMua2VybmVsc1trZXJuZWxOdW1dLm9ucHJlID0gZm47XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJvblBvc3RQcm9jZXNzS2VybmVsXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogb25Qb3N0UHJvY2Vzc0tlcm5lbFxuICAgICAgICAgKiBAcGFyYW0ge2ludH0gW2tlcm5lbE51bT0wXVxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIG9uUG9zdFByb2Nlc3NLZXJuZWwoa2VybmVsTnVtLCBmbikge1xuICAgICAgICAgICAgdGhpcy5rZXJuZWxzW2tlcm5lbE51bV0ub25wb3N0ID0gZm47XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJlbmFibGVLZXJuZWxcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBlbmFibGVLZXJuZWxcbiAgICAgICAgICogQHBhcmFtIHtpbnR9IFtrZXJuZWxOdW09MF1cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBlbmFibGVLZXJuZWwoa2VybmVsTnVtKSB7XG4gICAgICAgICAgICB0aGlzLmtlcm5lbHNba2VybmVsTnVtLnRvU3RyaW5nKCkgfCBcIjBcIl0uZW5hYmxlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJkaXNhYmxlS2VybmVsXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogZGlzYWJsZUtlcm5lbFxuICAgICAgICAgKiBAcGFyYW0ge2ludH0gW2tlcm5lbE51bT0wXVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGRpc2FibGVLZXJuZWwoa2VybmVsTnVtKSB7XG4gICAgICAgICAgICB0aGlzLmtlcm5lbHNba2VybmVsTnVtLnRvU3RyaW5nKCkgfCBcIjBcIl0uZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZ2V0S2VybmVsXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IG9uZSBhZGRlZCBXZWJDTEdMS2VybmVsXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIEdldCBhc3NpZ25lZCBrZXJuZWwgZm9yIHRoaXMgYXJndW1lbnRcbiAgICAgICAgICogQHJldHVybnMge1dlYkNMR0xLZXJuZWx9XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0S2VybmVsKG5hbWUpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLmtlcm5lbHMpIHtcbiAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSBuYW1lKSByZXR1cm4gdGhpcy5rZXJuZWxzW2tleV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZ2V0QWxsS2VybmVsc1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBhbGwgYWRkZWQgV2ViQ0xHTEtlcm5lbHNcbiAgICAgICAgICogQHJldHVybnMge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRBbGxLZXJuZWxzKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMua2VybmVscztcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIm9uUHJlUHJvY2Vzc0dyYXBoaWNcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBvblByZVByb2Nlc3NHcmFwaGljXG4gICAgICAgICAqIEBwYXJhbSB7aW50fSBbZ3JhcGhpY051bT0wXVxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIG9uUHJlUHJvY2Vzc0dyYXBoaWMoZ3JhcGhpY051bSwgZm4pIHtcbiAgICAgICAgICAgIHRoaXMudmVydGV4RnJhZ21lbnRQcm9ncmFtc1tncmFwaGljTnVtXS5vbnByZSA9IGZuO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwib25Qb3N0UHJvY2Vzc0dyYXBoaWNcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBvblBvc3RQcm9jZXNzR3JhcGhpY1xuICAgICAgICAgKiBAcGFyYW0ge2ludH0gW2dyYXBoaWNOdW09MF1cbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBvblBvc3RQcm9jZXNzR3JhcGhpYyhncmFwaGljTnVtLCBmbikge1xuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhGcmFnbWVudFByb2dyYW1zW2dyYXBoaWNOdW1dLm9ucG9zdCA9IGZuO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZW5hYmxlR3JhcGhpY1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGVuYWJsZUdyYXBoaWNcbiAgICAgICAgICogQHBhcmFtIHtpbnR9IFtncmFwaGljTnVtPTBdXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZW5hYmxlR3JhcGhpYyhncmFwaGljTnVtKSB7XG4gICAgICAgICAgICB0aGlzLnZlcnRleEZyYWdtZW50UHJvZ3JhbXNbZ3JhcGhpY051bS50b1N0cmluZygpIHwgXCIwXCJdLmVuYWJsZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZGlzYWJsZUdyYXBoaWNcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBkaXNhYmxlR3JhcGhpY1xuICAgICAgICAgKiBAcGFyYW0ge2ludH0gW2dyYXBoaWNOdW09MF1cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBkaXNhYmxlR3JhcGhpYyhncmFwaGljTnVtKSB7XG4gICAgICAgICAgICB0aGlzLnZlcnRleEZyYWdtZW50UHJvZ3JhbXNbZ3JhcGhpY051bS50b1N0cmluZygpIHwgXCIwXCJdLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImdldFZlcnRleEZyYWdtZW50UHJvZ3JhbVwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBvbmUgYWRkZWQgV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbVxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBHZXQgYXNzaWduZWQgdmZwIGZvciB0aGlzIGFyZ3VtZW50XG4gICAgICAgICAqIEByZXR1cm5zIHtXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtfVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldFZlcnRleEZyYWdtZW50UHJvZ3JhbShuYW1lKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy52ZXJ0ZXhGcmFnbWVudFByb2dyYW1zKSB7XG4gICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gbmFtZSkgcmV0dXJuIHRoaXMudmVydGV4RnJhZ21lbnRQcm9ncmFtc1trZXldO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImdldEFsbFZlcnRleEZyYWdtZW50UHJvZ3JhbVwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBhbGwgYWRkZWQgV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbXNcbiAgICAgICAgICogQHJldHVybnMge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRBbGxWZXJ0ZXhGcmFnbWVudFByb2dyYW0oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy52ZXJ0ZXhGcmFnbWVudFByb2dyYW1zO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwicHJvY2Vzc0tlcm5lbFwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFByb2Nlc3Mga2VybmVsc1xuICAgICAgICAgKiBAcGFyYW0ge1dlYkNMR0xLZXJuZWx9IGtlcm5lbFxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvdXRwdXRUb1RlbXA9bnVsbF1cbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBbcHJvY2Vzc0NvcF1cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBwcm9jZXNzS2VybmVsKGtlcm5lbCwgb3V0cHV0VG9UZW1wLCBwcm9jZXNzQ29wKSB7XG4gICAgICAgICAgICBpZiAoa2VybmVsLmVuYWJsZWQgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBpZiAocHJvY2Vzc0NvcCAhPT0gdW5kZWZpbmVkICYmIHByb2Nlc3NDb3AgIT09IG51bGwgJiYgcHJvY2Vzc0NvcCA9PT0gdHJ1ZSkgdGhpcy5hcnJNYWtlQ29weSA9IFtdO1xuXG4gICAgICAgICAgICAgICAgLy9rZXJuZWwuZHJhd01vZGVcbiAgICAgICAgICAgICAgICBpZiAoa2VybmVsLmRlcHRoVGVzdCA9PT0gdHJ1ZSkgdGhpcy5fZ2wuZW5hYmxlKHRoaXMuX2dsLkRFUFRIX1RFU1QpO2Vsc2UgdGhpcy5fZ2wuZGlzYWJsZSh0aGlzLl9nbC5ERVBUSF9URVNUKTtcblxuICAgICAgICAgICAgICAgIGlmIChrZXJuZWwuYmxlbmQgPT09IHRydWUpIHRoaXMuX2dsLmVuYWJsZSh0aGlzLl9nbC5CTEVORCk7ZWxzZSB0aGlzLl9nbC5kaXNhYmxlKHRoaXMuX2dsLkJMRU5EKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJsZW5kRnVuYyh0aGlzLl9nbFtrZXJuZWwuYmxlbmRTcmNNb2RlXSwgdGhpcy5fZ2xba2VybmVsLmJsZW5kRHN0TW9kZV0pO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJsZW5kRXF1YXRpb24odGhpcy5fZ2xba2VybmVsLmJsZW5kRXF1YXRpb25dKTtcblxuICAgICAgICAgICAgICAgIGlmIChrZXJuZWwub25wcmUgIT09IHVuZGVmaW5lZCAmJiBrZXJuZWwub25wcmUgIT09IG51bGwpIGtlcm5lbC5vbnByZSgpO1xuXG4gICAgICAgICAgICAgICAgaWYgKG91dHB1dFRvVGVtcCA9PT0gdW5kZWZpbmVkIHx8IG91dHB1dFRvVGVtcCA9PT0gbnVsbCB8fCBvdXRwdXRUb1RlbXAgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRlbXBzRm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPCBrZXJuZWwub3V0cHV0Lmxlbmd0aDsgbisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2VybmVsLm91dHB1dFtuXSAhPSBudWxsICYmIGtlcm5lbC5vdXRwdXRUZW1wTW9kZXNbbl0gPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wc0ZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0ZW1wc0ZvdW5kID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl93ZWJDTEdMLmVucXVldWVORFJhbmdlS2VybmVsKGtlcm5lbCwgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuZ2V0T3V0cHV0QnVmZmVycyhrZXJuZWwsIHRoaXMuX2FyZ3NWYWx1ZXMpLCB0cnVlLCB0aGlzLl9hcmdzVmFsdWVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXJyTWFrZUNvcHkucHVzaChrZXJuZWwpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fd2ViQ0xHTC5lbnF1ZXVlTkRSYW5nZUtlcm5lbChrZXJuZWwsIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmdldE91dHB1dEJ1ZmZlcnMoa2VybmVsLCB0aGlzLl9hcmdzVmFsdWVzKSwgZmFsc2UsIHRoaXMuX2FyZ3NWYWx1ZXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHRoaXMuX3dlYkNMR0wuZW5xdWV1ZU5EUmFuZ2VLZXJuZWwoa2VybmVsLCBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5nZXRPdXRwdXRCdWZmZXJzKGtlcm5lbCwgdGhpcy5fYXJnc1ZhbHVlcyksIGZhbHNlLCB0aGlzLl9hcmdzVmFsdWVzKTtcblxuICAgICAgICAgICAgICAgIGlmIChrZXJuZWwub25wb3N0ICE9PSB1bmRlZmluZWQgJiYga2VybmVsLm9ucG9zdCAhPT0gbnVsbCkga2VybmVsLm9ucG9zdCgpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHByb2Nlc3NDb3AgIT09IHVuZGVmaW5lZCAmJiBwcm9jZXNzQ29wICE9PSBudWxsICYmIHByb2Nlc3NDb3AgPT09IHRydWUpIHRoaXMucHJvY2Vzc0NvcGllcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwicHJvY2Vzc0NvcGllc1wiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcHJvY2Vzc0NvcGllcyhvdXRwdXRUb1RlbXApIHtcbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDwgdGhpcy5hcnJNYWtlQ29weS5sZW5ndGg7IG4rKykge1xuICAgICAgICAgICAgICAgIHRoaXMuX3dlYkNMR0wuY29weSh0aGlzLmFyck1ha2VDb3B5W25dLCBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5nZXRPdXRwdXRCdWZmZXJzKHRoaXMuYXJyTWFrZUNvcHlbbl0sIHRoaXMuX2FyZ3NWYWx1ZXMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInByb2Nlc3NLZXJuZWxzXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogUHJvY2VzcyBrZXJuZWxzXG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW291dHB1dFRvVGVtcD1udWxsXVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHByb2Nlc3NLZXJuZWxzKG91dHB1dFRvVGVtcCkge1xuICAgICAgICAgICAgdGhpcy5hcnJNYWtlQ29weSA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5rZXJuZWxzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzS2VybmVsKHRoaXMua2VybmVsc1trZXldLCBvdXRwdXRUb1RlbXApO1xuICAgICAgICAgICAgfXRoaXMucHJvY2Vzc0NvcGllcygpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwicHJvY2Vzc0dyYXBoaWNcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBwcm9jZXNzR3JhcGhpY1xuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gW2FyZ3VtZW50SW5kPXVuZGVmaW5lZF0gQXJndW1lbnQgZm9yIHZlcnRpY2VzIGNvdW50IG9yIHVuZGVmaW5lZCBpZiBhcmd1bWVudCBcImluZGljZXNcIiBleGlzdFxuICAgICAgICAgKiovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBwcm9jZXNzR3JhcGhpYyhhcmd1bWVudEluZCkge1xuICAgICAgICAgICAgdmFyIGFyck1ha2VDb3B5ID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy52ZXJ0ZXhGcmFnbWVudFByb2dyYW1zKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZmcCA9IHRoaXMudmVydGV4RnJhZ21lbnRQcm9ncmFtc1trZXldO1xuXG4gICAgICAgICAgICAgICAgaWYgKHZmcC5lbmFibGVkID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBidWZmID0gKGFyZ3VtZW50SW5kID09PSB1bmRlZmluZWQgfHwgYXJndW1lbnRJbmQgPT09IG51bGwpICYmIHRoaXMuQ0xHTF9idWZmZXJJbmRpY2VzICE9PSB1bmRlZmluZWQgJiYgdGhpcy5DTEdMX2J1ZmZlckluZGljZXMgIT09IG51bGwgPyB0aGlzLkNMR0xfYnVmZmVySW5kaWNlcyA6IHRoaXMuX2FyZ3NWYWx1ZXNbYXJndW1lbnRJbmRdO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChidWZmICE9PSB1bmRlZmluZWQgJiYgYnVmZiAhPT0gbnVsbCAmJiBidWZmLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2ZnAuZGVwdGhUZXN0ID09PSB0cnVlKSB0aGlzLl9nbC5lbmFibGUodGhpcy5fZ2wuREVQVEhfVEVTVCk7ZWxzZSB0aGlzLl9nbC5kaXNhYmxlKHRoaXMuX2dsLkRFUFRIX1RFU1QpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmZwLmJsZW5kID09PSB0cnVlKSB0aGlzLl9nbC5lbmFibGUodGhpcy5fZ2wuQkxFTkQpO2Vsc2UgdGhpcy5fZ2wuZGlzYWJsZSh0aGlzLl9nbC5CTEVORCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJsZW5kRnVuYyh0aGlzLl9nbFt2ZnAuYmxlbmRTcmNNb2RlXSwgdGhpcy5fZ2xbdmZwLmJsZW5kRHN0TW9kZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wuYmxlbmRFcXVhdGlvbih0aGlzLl9nbFt2ZnAuYmxlbmRFcXVhdGlvbl0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmZwLm9ucHJlICE9PSB1bmRlZmluZWQgJiYgdmZwLm9ucHJlICE9PSBudWxsKSB2ZnAub25wcmUoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRlbXBzRm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDwgdmZwLm91dHB1dC5sZW5ndGg7IG4rKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2ZnAub3V0cHV0W25dICE9IG51bGwgJiYgdmZwLm91dHB1dFRlbXBNb2Rlc1tuXSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wc0ZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGVtcHNGb3VuZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3dlYkNMR0wuZW5xdWV1ZVZlcnRleEZyYWdtZW50UHJvZ3JhbSh2ZnAsIGJ1ZmYsIHZmcC5kcmF3TW9kZSwgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuZ2V0T3V0cHV0QnVmZmVycyh2ZnAsIHRoaXMuX2FyZ3NWYWx1ZXMpLCB0cnVlLCB0aGlzLl9hcmdzVmFsdWVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnJNYWtlQ29weS5wdXNoKHZmcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3dlYkNMR0wuZW5xdWV1ZVZlcnRleEZyYWdtZW50UHJvZ3JhbSh2ZnAsIGJ1ZmYsIHZmcC5kcmF3TW9kZSwgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuZ2V0T3V0cHV0QnVmZmVycyh2ZnAsIHRoaXMuX2FyZ3NWYWx1ZXMpLCBmYWxzZSwgdGhpcy5fYXJnc1ZhbHVlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2ZnAub25wb3N0ICE9PSB1bmRlZmluZWQgJiYgdmZwLm9ucG9zdCAhPT0gbnVsbCkgdmZwLm9ucG9zdCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKHZhciBfbjIgPSAwOyBfbjIgPCBhcnJNYWtlQ29weS5sZW5ndGg7IF9uMisrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2ViQ0xHTC5jb3B5KGFyck1ha2VDb3B5W19uMl0sIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmdldE91dHB1dEJ1ZmZlcnMoYXJyTWFrZUNvcHlbX24yXSwgdGhpcy5fYXJnc1ZhbHVlcykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiaW5pXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogaW5pdGlhbGl6ZSBudW1lcmljXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gaW5pKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3VtZW50c3MgPSBhcmd1bWVudHNbMF07XG4gICAgICAgICAgICB2YXIgaWR4ID0gdm9pZCAwO1xuICAgICAgICAgICAgdmFyIHR5cE91dCA9IHZvaWQgMDtcbiAgICAgICAgICAgIHZhciBjb2RlID0gdm9pZCAwO1xuICAgICAgICAgICAgaWYgKGFyZ3VtZW50c3MubGVuZ3RoID4gMykge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FyZ3MgPSBhcmd1bWVudHNzWzBdO1xuICAgICAgICAgICAgICAgIGlkeCA9IGFyZ3VtZW50c3NbMV07XG4gICAgICAgICAgICAgICAgdHlwT3V0ID0gYXJndW1lbnRzc1syXTtcbiAgICAgICAgICAgICAgICBjb2RlID0gYXJndW1lbnRzc1szXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYXJncyA9IGFyZ3VtZW50c3NbMF07XG4gICAgICAgICAgICAgICAgaWR4ID0gYXJndW1lbnRzc1sxXTtcbiAgICAgICAgICAgICAgICB0eXBPdXQgPSBcIkZMT0FUXCI7XG4gICAgICAgICAgICAgICAgY29kZSA9IGFyZ3VtZW50c3NbMl07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGFyZ3NcbiAgICAgICAgICAgIHZhciBidWZmTGVuZ3RoID0gMDtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLl9hcmdzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ1ZhbCA9IHRoaXMuX2FyZ3Nba2V5XTtcblxuICAgICAgICAgICAgICAgIHRoaXMuc2V0QXJnKGtleS5zcGxpdChcIiBcIilbMV0sIGFyZ1ZhbCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoYnVmZkxlbmd0aCA9PT0gMCAmJiAoYXJnVmFsIGluc3RhbmNlb2YgQXJyYXkgfHwgYXJnVmFsIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5IHx8IGFyZ1ZhbCBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkgfHwgYXJnVmFsIGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCkpIGJ1ZmZMZW5ndGggPSBhcmdWYWwubGVuZ3RoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cE91dCA9PT0gXCJGTE9BVFwiKSB0aGlzLmFkZEFyZyhcImZsb2F0KiByZXN1bHRcIik7ZWxzZSB0aGlzLmFkZEFyZyhcImZsb2F0NCogcmVzdWx0XCIpO1xuICAgICAgICAgICAgdGhpcy5zZXRBcmcoXCJyZXN1bHRcIiwgbmV3IEZsb2F0MzJBcnJheShidWZmTGVuZ3RoKSwgbnVsbCwgdHlwT3V0KTtcblxuICAgICAgICAgICAgLy8ga2VybmVsXG4gICAgICAgICAgICB0aGlzLmFkZEtlcm5lbCh7XG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiS0VSTkVMXCIsXG4gICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwiU0lNUExFX0tFUk5FTFwiLFxuICAgICAgICAgICAgICAgIFwidmlld1NvdXJjZVwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBcImNvbmZpZ1wiOiBbaWR4LCBbXCJyZXN1bHRcIl0sICcnLCBjb2RlXSB9KTtcblxuICAgICAgICAgICAgLy8gcHJvY2Nlc3NcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc0tlcm5lbHMoKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlYkNMR0wucmVhZEJ1ZmZlcih0aGlzLl9hcmdzVmFsdWVzW1wicmVzdWx0XCJdKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImluaUdcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBpbml0aWFsaXplIEdyYXBoaWNcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBpbmlHKCkge1xuICAgICAgICAgICAgdGhpcy5fd2ViQ0xHTC5nZXRDb250ZXh0KCkuZGVwdGhGdW5jKHRoaXMuX3dlYkNMR0wuZ2V0Q29udGV4dCgpLkxFUVVBTCk7XG4gICAgICAgICAgICB0aGlzLl93ZWJDTEdMLmdldENvbnRleHQoKS5jbGVhckRlcHRoKDEuMCk7XG5cbiAgICAgICAgICAgIHZhciBhcmd1bWVudHNzID0gYXJndW1lbnRzWzBdOyAvLyBvdmVycmlkZVxuICAgICAgICAgICAgdGhpcy5fYXJncyA9IGFyZ3VtZW50c3NbMV07IC8vIGZpcnN0IGlzIGNvbnRleHQgb3IgY2FudmFzXG5cbiAgICAgICAgICAgIC8vIGtlcm5lbCAmIGdyYXBoaWNzXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMjsgaSA8IGFyZ3VtZW50c3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJndW1lbnRzc1tpXS50eXBlID09PSBcIktFUk5FTFwiKSB0aGlzLmFkZEtlcm5lbChhcmd1bWVudHNzW2ldKTtlbHNlIGlmIChhcmd1bWVudHNzW2ldLnR5cGUgPT09IFwiR1JBUEhJQ1wiKSAvLyBWRlBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRHcmFwaGljKGFyZ3VtZW50c3NbaV0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBhcmdzXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5fYXJncykge1xuICAgICAgICAgICAgICAgIHZhciBhcmdWYWwgPSB0aGlzLl9hcmdzW2tleV07XG5cbiAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSBcImluZGljZXNcIikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXJnVmFsICE9PSBudWxsKSB0aGlzLnNldEluZGljZXMoYXJnVmFsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgdGhpcy5zZXRBcmcoa2V5LnNwbGl0KFwiIFwiKVsxXSwgYXJnVmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBXZWJDTEdMRm9yO1xufSgpO1xuXG5nbG9iYWwuV2ViQ0xHTEZvciA9IFdlYkNMR0xGb3I7XG5tb2R1bGUuZXhwb3J0cy5XZWJDTEdMRm9yID0gV2ViQ0xHTEZvcjtcblxuLyoqXG4gKiBncHVmb3JcbiAqIEByZXR1cm5zIHtXZWJDTEdMRm9yfEFycmF5PGZsb2F0Pn1cbiAqL1xuZnVuY3Rpb24gZ3B1Zm9yKCkge1xuICAgIHZhciBjbGdsRm9yID0gbmV3IFdlYkNMR0xGb3IoKTtcbiAgICB2YXIgX2dsID0gbnVsbDtcbiAgICBpZiAoYXJndW1lbnRzWzBdIGluc3RhbmNlb2YgV2ViR0xSZW5kZXJpbmdDb250ZXh0KSB7XG4gICAgICAgIF9nbCA9IGFyZ3VtZW50c1swXTtcblxuICAgICAgICBjbGdsRm9yLnNldEN0eChfZ2wpO1xuICAgICAgICBjbGdsRm9yLl93ZWJDTEdMID0gbmV3IF9XZWJDTEdMLldlYkNMR0woX2dsKTtcbiAgICAgICAgY2xnbEZvci5pbmlHKGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiBjbGdsRm9yO1xuICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzWzBdIGluc3RhbmNlb2YgSFRNTENhbnZhc0VsZW1lbnQpIHtcbiAgICAgICAgX2dsID0gX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuZ2V0V2ViR0xDb250ZXh0RnJvbUNhbnZhcyhhcmd1bWVudHNbMF0pO1xuXG4gICAgICAgIGNsZ2xGb3Iuc2V0Q3R4KF9nbCk7XG4gICAgICAgIGNsZ2xGb3IuX3dlYkNMR0wgPSBuZXcgX1dlYkNMR0wuV2ViQ0xHTChfZ2wpO1xuICAgICAgICBjbGdsRm9yLmluaUcoYXJndW1lbnRzKTtcbiAgICAgICAgcmV0dXJuIGNsZ2xGb3I7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgX2dsID0gX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuZ2V0V2ViR0xDb250ZXh0RnJvbUNhbnZhcyhkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKSwgeyBhbnRpYWxpYXM6IGZhbHNlIH0pO1xuXG4gICAgICAgIGNsZ2xGb3Iuc2V0Q3R4KF9nbCk7XG4gICAgICAgIGNsZ2xGb3IuX3dlYkNMR0wgPSBuZXcgX1dlYkNMR0wuV2ViQ0xHTChfZ2wpO1xuICAgICAgICByZXR1cm4gY2xnbEZvci5pbmkoYXJndW1lbnRzKTtcbiAgICB9XG59XG5nbG9iYWwuZ3B1Zm9yID0gZ3B1Zm9yO1xubW9kdWxlLmV4cG9ydHMuZ3B1Zm9yID0gZ3B1Zm9yOyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5XZWJDTEdMS2VybmVsID0gdW5kZWZpbmVkO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpO1xuXG52YXIgX1dlYkNMR0xVdGlscyA9IHJlcXVpcmUoJy4vV2ViQ0xHTFV0aWxzLmNsYXNzJyk7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbi8qKlxyXG4qIFdlYkNMR0xLZXJuZWwgT2JqZWN0XHJcbiogQGNsYXNzXHJcbiAqIEBwYXJhbSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbFxyXG4gKiBAcGFyYW0ge1N0cmluZ30gc291cmNlXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBoZWFkZXJcclxuKi9cbnZhciBXZWJDTEdMS2VybmVsID0gZXhwb3J0cy5XZWJDTEdMS2VybmVsID0gZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFdlYkNMR0xLZXJuZWwoZ2wsIHNvdXJjZSwgaGVhZGVyKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBXZWJDTEdMS2VybmVsKTtcblxuICAgICAgICB0aGlzLl9nbCA9IGdsO1xuICAgICAgICB2YXIgaGlnaFByZWNpc2lvblN1cHBvcnQgPSB0aGlzLl9nbC5nZXRTaGFkZXJQcmVjaXNpb25Gb3JtYXQodGhpcy5fZ2wuRlJBR01FTlRfU0hBREVSLCB0aGlzLl9nbC5ISUdIX0ZMT0FUKTtcbiAgICAgICAgdGhpcy5fcHJlY2lzaW9uID0gaGlnaFByZWNpc2lvblN1cHBvcnQucHJlY2lzaW9uICE9PSAwID8gJ3ByZWNpc2lvbiBoaWdocCBmbG9hdDtcXG5cXG5wcmVjaXNpb24gaGlnaHAgaW50O1xcblxcbicgOiAncHJlY2lzaW9uIGxvd3AgZmxvYXQ7XFxuXFxucHJlY2lzaW9uIGxvd3AgaW50O1xcblxcbic7XG5cbiAgICAgICAgdmFyIF9nbERyYXdCdWZmX2V4dCA9IHRoaXMuX2dsLmdldEV4dGVuc2lvbihcIldFQkdMX2RyYXdfYnVmZmVyc1wiKTtcbiAgICAgICAgdGhpcy5fbWF4RHJhd0J1ZmZlcnMgPSBudWxsO1xuICAgICAgICBpZiAoX2dsRHJhd0J1ZmZfZXh0ICE9IG51bGwpIHRoaXMuX21heERyYXdCdWZmZXJzID0gdGhpcy5fZ2wuZ2V0UGFyYW1ldGVyKF9nbERyYXdCdWZmX2V4dC5NQVhfRFJBV19CVUZGRVJTX1dFQkdMKTtcblxuICAgICAgICB0aGlzLm5hbWUgPSBcIlwiO1xuICAgICAgICB0aGlzLmVuYWJsZWQgPSB0cnVlO1xuXG4gICAgICAgIHRoaXMuZGVwdGhUZXN0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5ibGVuZCA9IG51bGw7XG4gICAgICAgIHRoaXMuYmxlbmRTcmNNb2RlID0gbnVsbDtcbiAgICAgICAgdGhpcy5ibGVuZERzdE1vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLmJsZW5kRXF1YXRpb24gPSBudWxsO1xuICAgICAgICB0aGlzLm9ucHJlID0gbnVsbDtcbiAgICAgICAgdGhpcy5vbnBvc3QgPSBudWxsO1xuICAgICAgICB0aGlzLnZpZXdTb3VyY2UgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmluX3ZhbHVlcyA9IHt9O1xuXG4gICAgICAgIHRoaXMub3V0cHV0ID0gbnVsbDsgLy9TdHJpbmcgb3IgQXJyYXk8U3RyaW5nPiBvZiBhcmcgbmFtZXMgd2l0aCB0aGUgaXRlbXMgaW4gc2FtZSBvcmRlciB0aGF0IGluIHRoZSBmaW5hbCByZXR1cm5cbiAgICAgICAgdGhpcy5vdXRwdXRUZW1wTW9kZXMgPSBudWxsO1xuICAgICAgICB0aGlzLmZCdWZmZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmZCdWZmZXJUZW1wID0gbnVsbDtcbiAgICAgICAgdGhpcy5mQnVmZmVyTGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5mQnVmZmVyQ291bnQgPSAwO1xuXG4gICAgICAgIGlmIChzb3VyY2UgIT09IHVuZGVmaW5lZCAmJiBzb3VyY2UgIT09IG51bGwpIHRoaXMuc2V0S2VybmVsU291cmNlKHNvdXJjZSwgaGVhZGVyKTtcbiAgICB9XG5cbiAgICAvKipcclxuICAgICAqIFVwZGF0ZSB0aGUga2VybmVsIHNvdXJjZVxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNvdXJjZVxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IFtoZWFkZXI9dW5kZWZpbmVkXSBBZGRpdGlvbmFsIGZ1bmN0aW9uc1xyXG4gICAgICovXG5cblxuICAgIF9jcmVhdGVDbGFzcyhXZWJDTEdMS2VybmVsLCBbe1xuICAgICAgICBrZXk6ICdzZXRLZXJuZWxTb3VyY2UnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gc2V0S2VybmVsU291cmNlKHNvdXJjZSwgaGVhZGVyKSB7XG4gICAgICAgICAgICB2YXIgY29tcGlsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgc291cmNlVmVydGV4ID0gXCJcIiArIHRoaXMuX3ByZWNpc2lvbiArICdhdHRyaWJ1dGUgdmVjMyBhVmVydGV4UG9zaXRpb247XFxuJyArICd2YXJ5aW5nIHZlYzIgZ2xvYmFsX2lkO1xcbicgKyAndm9pZCBtYWluKHZvaWQpIHtcXG4nICsgJ2dsX1Bvc2l0aW9uID0gdmVjNChhVmVydGV4UG9zaXRpb24sIDEuMCk7XFxuJyArICdnbG9iYWxfaWQgPSBhVmVydGV4UG9zaXRpb24ueHkqMC41KzAuNTtcXG4nICsgJ31cXG4nO1xuICAgICAgICAgICAgICAgIHZhciBzb3VyY2VGcmFnbWVudCA9ICcjZXh0ZW5zaW9uIEdMX0VYVF9kcmF3X2J1ZmZlcnMgOiByZXF1aXJlXFxuJyArIHRoaXMuX3ByZWNpc2lvbiArIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmxpbmVzX2ZyYWdtZW50X2F0dHJzKHRoaXMuaW5fdmFsdWVzKSArICd2YXJ5aW5nIHZlYzIgZ2xvYmFsX2lkO1xcbicgKyAndW5pZm9ybSBmbG9hdCB1QnVmZmVyV2lkdGg7JyArICd2ZWMyIGdldF9nbG9iYWxfaWQoKSB7XFxuJyArICdyZXR1cm4gZ2xvYmFsX2lkO1xcbicgKyAnfVxcbicgKyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5nZXRfZ2xvYmFsX2lkM19HTFNMRnVuY3Rpb25TdHJpbmcoKSArIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmdldF9nbG9iYWxfaWQyX0dMU0xGdW5jdGlvblN0cmluZygpICsgdGhpcy5faGVhZCArXG5cbiAgICAgICAgICAgICAgICAvL1dlYkNMR0xVdGlscy5saW5lc19kcmF3QnVmZmVyc1dyaXRlSW5pdCg4KStcbiAgICAgICAgICAgICAgICAndm9pZCBtYWluKHZvaWQpIHtcXG4nICsgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMubGluZXNfZHJhd0J1ZmZlcnNJbml0KDgpICsgdGhpcy5fc291cmNlICsgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMubGluZXNfZHJhd0J1ZmZlcnNXcml0ZSg4KSArICd9XFxuJztcblxuICAgICAgICAgICAgICAgIHRoaXMua2VybmVsID0gdGhpcy5fZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBuZXcgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMoKS5jcmVhdGVTaGFkZXIodGhpcy5fZ2wsIFwiV0VCQ0xHTFwiLCBzb3VyY2VWZXJ0ZXgsIHNvdXJjZUZyYWdtZW50LCB0aGlzLmtlcm5lbCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmF0dHJfVmVydGV4UG9zID0gdGhpcy5fZ2wuZ2V0QXR0cmliTG9jYXRpb24odGhpcy5rZXJuZWwsIFwiYVZlcnRleFBvc2l0aW9uXCIpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy51QnVmZmVyV2lkdGggPSB0aGlzLl9nbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy5rZXJuZWwsIFwidUJ1ZmZlcldpZHRoXCIpO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuaW5fdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBleHBlY3RlZE1vZGUgPSB7ICdmbG9hdDRfZnJvbVNhbXBsZXInOiBcIlNBTVBMRVJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICdmbG9hdF9mcm9tU2FtcGxlcic6IFwiU0FNUExFUlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0JzogXCJVTklGT1JNXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAnZmxvYXQ0JzogXCJVTklGT1JNXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAnbWF0NCc6IFwiVU5JRk9STVwiIH1bdGhpcy5pbl92YWx1ZXNba2V5XS50eXBlXTtcblxuICAgICAgICAgICAgICAgICAgICBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5jaGVja0FyZ05hbWVJbml0aWFsaXphdGlvbih0aGlzLmluX3ZhbHVlcywga2V5KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbl92YWx1ZXNba2V5XS5sb2NhdGlvbiA9IFt0aGlzLl9nbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy5rZXJuZWwsIGtleS5yZXBsYWNlKC9cXFtcXGQuKi8sIFwiXCIpKV07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5fdmFsdWVzW2tleV0uZXhwZWN0ZWRNb2RlID0gZXhwZWN0ZWRNb2RlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBcIlZFUlRFWCBQUk9HUkFNXFxuXCIgKyBzb3VyY2VWZXJ0ZXggKyBcIlxcbiBGUkFHTUVOVCBQUk9HUkFNXFxuXCIgKyBzb3VyY2VGcmFnbWVudDtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICAgICAgdmFyIGFyZ3VtZW50c1NvdXJjZSA9IHNvdXJjZS5zcGxpdCgnKScpWzBdLnNwbGl0KCcoJylbMV0uc3BsaXQoJywnKTsgLy8gXCJmbG9hdCogQVwiLCBcImZsb2F0KiBCXCIsIFwiZmxvYXQgQ1wiLCBcImZsb2F0NCogRFwiXG5cbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmID0gYXJndW1lbnRzU291cmNlLmxlbmd0aDsgbiA8IGY7IG4rKykge1xuICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL1xcKi9nbSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFyZ05hbWUgPSBhcmd1bWVudHNTb3VyY2Vbbl0uc3BsaXQoJyonKVsxXS50cmltKCk7XG4gICAgICAgICAgICAgICAgICAgIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uKHRoaXMuaW5fdmFsdWVzLCBhcmdOYW1lKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9mbG9hdDQvZ20pICE9IG51bGwpIHRoaXMuaW5fdmFsdWVzW2FyZ05hbWVdLnR5cGUgPSAnZmxvYXQ0X2Zyb21TYW1wbGVyJztlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0L2dtKSAhPSBudWxsKSB0aGlzLmluX3ZhbHVlc1thcmdOYW1lXS50eXBlID0gJ2Zsb2F0X2Zyb21TYW1wbGVyJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXSAhPT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgX2FyZ05hbWUgPSBhcmd1bWVudHNTb3VyY2Vbbl0uc3BsaXQoJyAnKVsxXS50cmltKCk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLmluX3ZhbHVlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleS5yZXBsYWNlKC9cXFtcXGQuKi8sIFwiXCIpID09PSBfYXJnTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9hcmdOYW1lID0ga2V5OyAvLyBmb3Igbm9ybWFsIHVuaWZvcm0gYXJyYXlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5jaGVja0FyZ05hbWVJbml0aWFsaXphdGlvbih0aGlzLmluX3ZhbHVlcywgX2FyZ05hbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0NC9nbSkgIT0gbnVsbCkgdGhpcy5pbl92YWx1ZXNbX2FyZ05hbWVdLnR5cGUgPSAnZmxvYXQ0JztlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0L2dtKSAhPSBudWxsKSB0aGlzLmluX3ZhbHVlc1tfYXJnTmFtZV0udHlwZSA9ICdmbG9hdCc7ZWxzZSBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9tYXQ0L2dtKSAhPSBudWxsKSB0aGlzLmluX3ZhbHVlc1tfYXJnTmFtZV0udHlwZSA9ICdtYXQ0JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHBhcnNlIGhlYWRlclxuICAgICAgICAgICAgdGhpcy5faGVhZCA9IGhlYWRlciAhPT0gdW5kZWZpbmVkICYmIGhlYWRlciAhPT0gbnVsbCA/IGhlYWRlciA6ICcnO1xuICAgICAgICAgICAgdGhpcy5faGVhZCA9IHRoaXMuX2hlYWQucmVwbGFjZSgvXFxyXFxuL2dpLCAnJykucmVwbGFjZSgvXFxyL2dpLCAnJykucmVwbGFjZSgvXFxuL2dpLCAnJyk7XG4gICAgICAgICAgICB0aGlzLl9oZWFkID0gX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMucGFyc2VTb3VyY2UodGhpcy5faGVhZCwgdGhpcy5pbl92YWx1ZXMpO1xuXG4gICAgICAgICAgICAvLyBwYXJzZSBzb3VyY2VcbiAgICAgICAgICAgIHRoaXMuX3NvdXJjZSA9IHNvdXJjZS5yZXBsYWNlKC9cXHJcXG4vZ2ksICcnKS5yZXBsYWNlKC9cXHIvZ2ksICcnKS5yZXBsYWNlKC9cXG4vZ2ksICcnKTtcbiAgICAgICAgICAgIHRoaXMuX3NvdXJjZSA9IHRoaXMuX3NvdXJjZS5yZXBsYWNlKC9eXFx3KiBcXHcqXFwoW1xcd1xcc1xcKixdKlxcKSB7L2dpLCAnJykucmVwbGFjZSgvfShcXHN8XFx0KSokL2dpLCAnJyk7XG4gICAgICAgICAgICB0aGlzLl9zb3VyY2UgPSBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5wYXJzZVNvdXJjZSh0aGlzLl9zb3VyY2UsIHRoaXMuaW5fdmFsdWVzKTtcblxuICAgICAgICAgICAgdmFyIHRzID0gY29tcGlsZSgpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy52aWV3U291cmNlID09PSB0cnVlKSBjb25zb2xlLmxvZygnJWMgS0VSTkVMOiAnICsgdGhpcy5uYW1lLCAnZm9udC1zaXplOiAyMHB4OyBjb2xvcjogYmx1ZScpLCBjb25zb2xlLmxvZygnJWMgV0VCQ0xHTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScsICdjb2xvcjogZ3JheScpLCBjb25zb2xlLmxvZygnJWMgJyArIGhlYWRlciArIHNvdXJjZSwgJ2NvbG9yOiBncmF5JyksIGNvbnNvbGUubG9nKCclYyBUUkFOU0xBVEVEIFdFQkdMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScsICdjb2xvcjogZGFya2dyYXknKSwgY29uc29sZS5sb2coJyVjICcgKyB0cywgJ2NvbG9yOiBkYXJrZ3JheScpO1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIFdlYkNMR0xLZXJuZWw7XG59KCk7XG5cbmdsb2JhbC5XZWJDTEdMS2VybmVsID0gV2ViQ0xHTEtlcm5lbDtcbm1vZHVsZS5leHBvcnRzLldlYkNMR0xLZXJuZWwgPSBXZWJDTEdMS2VybmVsOyIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KCk7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbi8qKiBcbiogVXRpbGl0aWVzXG4qIEBjbGFzc1xuKiBAY29uc3RydWN0b3JcbiovXG52YXIgV2ViQ0xHTFV0aWxzID0gZXhwb3J0cy5XZWJDTEdMVXRpbHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gV2ViQ0xHTFV0aWxzKCkge1xuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgV2ViQ0xHTFV0aWxzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBsb2FkUXVhZFxuICAgICAqL1xuXG5cbiAgICBfY3JlYXRlQ2xhc3MoV2ViQ0xHTFV0aWxzLCBbe1xuICAgICAgICBrZXk6IFwibG9hZFF1YWRcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGxvYWRRdWFkKG5vZGUsIGxlbmd0aCwgaGVpZ2h0KSB7XG4gICAgICAgICAgICB2YXIgbCA9IGxlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IGxlbmd0aCA9PT0gbnVsbCA/IDAuNSA6IGxlbmd0aDtcbiAgICAgICAgICAgIHZhciBoID0gaGVpZ2h0ID09PSB1bmRlZmluZWQgfHwgaGVpZ2h0ID09PSBudWxsID8gMC41IDogaGVpZ2h0O1xuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhBcnJheSA9IFstbCwgLWgsIDAuMCwgbCwgLWgsIDAuMCwgbCwgaCwgMC4wLCAtbCwgaCwgMC4wXTtcblxuICAgICAgICAgICAgdGhpcy50ZXh0dXJlQXJyYXkgPSBbMC4wLCAwLjAsIDAuMCwgMS4wLCAwLjAsIDAuMCwgMS4wLCAxLjAsIDAuMCwgMC4wLCAxLjAsIDAuMF07XG5cbiAgICAgICAgICAgIHRoaXMuaW5kZXhBcnJheSA9IFswLCAxLCAyLCAwLCAyLCAzXTtcblxuICAgICAgICAgICAgdmFyIG1lc2hPYmplY3QgPSB7fTtcbiAgICAgICAgICAgIG1lc2hPYmplY3QudmVydGV4QXJyYXkgPSB0aGlzLnZlcnRleEFycmF5O1xuICAgICAgICAgICAgbWVzaE9iamVjdC50ZXh0dXJlQXJyYXkgPSB0aGlzLnRleHR1cmVBcnJheTtcbiAgICAgICAgICAgIG1lc2hPYmplY3QuaW5kZXhBcnJheSA9IHRoaXMuaW5kZXhBcnJheTtcblxuICAgICAgICAgICAgcmV0dXJuIG1lc2hPYmplY3Q7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJjcmVhdGVTaGFkZXJcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBjcmVhdGVTaGFkZXJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjcmVhdGVTaGFkZXIoZ2wsIG5hbWUsIHNvdXJjZVZlcnRleCwgc291cmNlRnJhZ21lbnQsIHNoYWRlclByb2dyYW0pIHtcbiAgICAgICAgICAgIHZhciBfc3YgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICBfc2YgPSBmYWxzZTtcblxuICAgICAgICAgICAgdmFyIG1ha2VEZWJ1ZyA9IGZ1bmN0aW9uIChpbmZvTG9nLCBzaGFkZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhpbmZvTG9nKTtcblxuICAgICAgICAgICAgICAgIHZhciBhcnJFcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgZXJyb3JzID0gaW5mb0xvZy5zcGxpdChcIlxcblwiKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBuID0gMCwgZiA9IGVycm9ycy5sZW5ndGg7IG4gPCBmOyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yc1tuXS5tYXRjaCgvXkVSUk9SL2dpbSkgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4cGwgPSBlcnJvcnNbbl0uc3BsaXQoJzonKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsaW5lID0gcGFyc2VJbnQoZXhwbFsyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcnJFcnJvcnMucHVzaChbbGluZSwgZXJyb3JzW25dXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHNvdXIgPSBnbC5nZXRTaGFkZXJTb3VyY2Uoc2hhZGVyKS5zcGxpdChcIlxcblwiKTtcbiAgICAgICAgICAgICAgICBzb3VyLnVuc2hpZnQoXCJcIik7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX24gPSAwLCBfZiA9IHNvdXIubGVuZ3RoOyBfbiA8IF9mOyBfbisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsaW5lV2l0aEVycm9yID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHZhciBlcnJvclN0ciA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBlID0gMCwgZmUgPSBhcnJFcnJvcnMubGVuZ3RoOyBlIDwgZmU7IGUrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKF9uID09PSBhcnJFcnJvcnNbZV1bMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lV2l0aEVycm9yID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvclN0ciA9IGFyckVycm9yc1tlXVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAobGluZVdpdGhFcnJvciA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiJWNcIiArIF9uICsgJyAlYycgKyBzb3VyW19uXSwgXCJjb2xvcjpibGFja1wiLCBcImNvbG9yOmJsdWVcIik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnJWPilrrilrolYycgKyBfbiArICcgJWMnICsgc291cltfbl0gKyAnXFxuJWMnICsgZXJyb3JTdHIsIFwiY29sb3I6cmVkXCIsIFwiY29sb3I6YmxhY2tcIiwgXCJjb2xvcjpibHVlXCIsIFwiY29sb3I6cmVkXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgICAgICB2YXIgc2hhZGVyVmVydGV4ID0gZ2wuY3JlYXRlU2hhZGVyKGdsLlZFUlRFWF9TSEFERVIpO1xuICAgICAgICAgICAgZ2wuc2hhZGVyU291cmNlKHNoYWRlclZlcnRleCwgc291cmNlVmVydGV4KTtcbiAgICAgICAgICAgIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyVmVydGV4KTtcbiAgICAgICAgICAgIGlmICghZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlclZlcnRleCwgZ2wuQ09NUElMRV9TVEFUVVMpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGluZm9Mb2cgPSBnbC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlclZlcnRleCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCIlY1wiICsgbmFtZSArICcgRVJST1IgKHZlcnRleCBwcm9ncmFtKScsIFwiY29sb3I6cmVkXCIpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGluZm9Mb2cgIT09IHVuZGVmaW5lZCAmJiBpbmZvTG9nICE9PSBudWxsKSBtYWtlRGVidWcoaW5mb0xvZywgc2hhZGVyVmVydGV4KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZ2wuYXR0YWNoU2hhZGVyKHNoYWRlclByb2dyYW0sIHNoYWRlclZlcnRleCk7XG4gICAgICAgICAgICAgICAgX3N2ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHNoYWRlckZyYWdtZW50ID0gZ2wuY3JlYXRlU2hhZGVyKGdsLkZSQUdNRU5UX1NIQURFUik7XG4gICAgICAgICAgICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyRnJhZ21lbnQsIHNvdXJjZUZyYWdtZW50KTtcbiAgICAgICAgICAgIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyRnJhZ21lbnQpO1xuICAgICAgICAgICAgaWYgKCFnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyRnJhZ21lbnQsIGdsLkNPTVBJTEVfU1RBVFVTKSkge1xuICAgICAgICAgICAgICAgIHZhciBfaW5mb0xvZyA9IGdsLmdldFNoYWRlckluZm9Mb2coc2hhZGVyRnJhZ21lbnQpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiJWNcIiArIG5hbWUgKyAnIEVSUk9SIChmcmFnbWVudCBwcm9ncmFtKScsIFwiY29sb3I6cmVkXCIpO1xuXG4gICAgICAgICAgICAgICAgaWYgKF9pbmZvTG9nICE9PSB1bmRlZmluZWQgJiYgX2luZm9Mb2cgIT09IG51bGwpIG1ha2VEZWJ1ZyhfaW5mb0xvZywgc2hhZGVyRnJhZ21lbnQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBnbC5hdHRhY2hTaGFkZXIoc2hhZGVyUHJvZ3JhbSwgc2hhZGVyRnJhZ21lbnQpO1xuICAgICAgICAgICAgICAgIF9zZiA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChfc3YgPT09IHRydWUgJiYgX3NmID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgZ2wubGlua1Byb2dyYW0oc2hhZGVyUHJvZ3JhbSk7XG4gICAgICAgICAgICAgICAgdmFyIHN1Y2Nlc3MgPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHNoYWRlclByb2dyYW0sIGdsLkxJTktfU1RBVFVTKTtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRXJyb3Igc2hhZGVyIHByb2dyYW0gJyArIG5hbWUgKyAnOlxcbiAnKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxvZyA9IGdsLmdldFByb2dyYW1JbmZvTG9nKHNoYWRlclByb2dyYW0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAobG9nICE9PSB1bmRlZmluZWQgJiYgbG9nICE9PSBudWxsKSBjb25zb2xlLmxvZyhsb2cpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJwYWNrXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogUGFjayAxZmxvYXQgKDAuMC0xLjApIHRvIDRmbG9hdCByZ2JhICgwLjAtMS4wLCAwLjAtMS4wLCAwLjAtMS4wLCAwLjAtMS4wKVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHBhY2sodikge1xuICAgICAgICAgICAgdmFyIGJpYXMgPSBbMS4wIC8gMjU1LjAsIDEuMCAvIDI1NS4wLCAxLjAgLyAyNTUuMCwgMC4wXTtcblxuICAgICAgICAgICAgdmFyIHIgPSB2O1xuICAgICAgICAgICAgdmFyIGcgPSB0aGlzLmZyYWN0KHIgKiAyNTUuMCk7XG4gICAgICAgICAgICB2YXIgYiA9IHRoaXMuZnJhY3QoZyAqIDI1NS4wKTtcbiAgICAgICAgICAgIHZhciBhID0gdGhpcy5mcmFjdChiICogMjU1LjApO1xuICAgICAgICAgICAgdmFyIGNvbG91ciA9IFtyLCBnLCBiLCBhXTtcblxuICAgICAgICAgICAgdmFyIGRkID0gW2NvbG91clsxXSAqIGJpYXNbMF0sIGNvbG91clsyXSAqIGJpYXNbMV0sIGNvbG91clszXSAqIGJpYXNbMl0sIGNvbG91clszXSAqIGJpYXNbM11dO1xuXG4gICAgICAgICAgICByZXR1cm4gW2NvbG91clswXSAtIGRkWzBdLCBjb2xvdXJbMV0gLSBkZFsxXSwgY29sb3VyWzJdIC0gZGRbMl0sIGNvbG91clszXSAtIGRkWzNdXTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInVucGFja1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFVucGFjayA0ZmxvYXQgcmdiYSAoMC4wLTEuMCwgMC4wLTEuMCwgMC4wLTEuMCwgMC4wLTEuMCkgdG8gMWZsb2F0ICgwLjAtMS4wKVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHVucGFjayhjb2xvdXIpIHtcbiAgICAgICAgICAgIHZhciBiaXRTaGlmdHMgPSBbMS4wLCAxLjAgLyAyNTUuMCwgMS4wIC8gKDI1NS4wICogMjU1LjApLCAxLjAgLyAoMjU1LjAgKiAyNTUuMCAqIDI1NS4wKV07XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kb3Q0KGNvbG91ciwgYml0U2hpZnRzKTtcbiAgICAgICAgfVxuICAgIH1dLCBbe1xuICAgICAgICBrZXk6IFwiZ2V0V2ViR0xDb250ZXh0RnJvbUNhbnZhc1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGdldFdlYkdMQ29udGV4dEZyb21DYW52YXNcbiAgICAgICAgICogQHBhcmFtIHtIVE1MQ2FudmFzRWxlbWVudH0gY2FudmFzXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjdHhPcHRcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRXZWJHTENvbnRleHRGcm9tQ2FudmFzKGNhbnZhcywgY3R4T3B0KSB7XG4gICAgICAgICAgICB2YXIgZ2wgPSBudWxsO1xuICAgICAgICAgICAgLyp0cnkge1xuICAgICAgICAgICAgICAgIGlmKGN0eE9wdCA9PSB1bmRlZmluZWQgfHwgY3R4T3B0ID09PSBudWxsKSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2wyXCIpO1xuICAgICAgICAgICAgICAgIGVsc2UgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsMlwiLCBjdHhPcHQpO1xuICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygoZ2wgPT0gbnVsbCk/XCJubyB3ZWJnbDJcIjpcInVzaW5nIHdlYmdsMlwiKTtcbiAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgIGdsID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGdsID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZihjdHhPcHQgPT0gdW5kZWZpbmVkIHx8IGN0eE9wdCA9PT0gbnVsbCkgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcImV4cGVyaW1lbnRhbC13ZWJnbDJcIik7XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcImV4cGVyaW1lbnRhbC13ZWJnbDJcIiwgY3R4T3B0KTtcbiAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKChnbCA9PSBudWxsKT9cIm5vIGV4cGVyaW1lbnRhbC13ZWJnbDJcIjpcInVzaW5nIGV4cGVyaW1lbnRhbC13ZWJnbDJcIik7XG4gICAgICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGdsID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9Ki9cbiAgICAgICAgICAgIGlmIChnbCA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN0eE9wdCA9PT0gdW5kZWZpbmVkIHx8IGN0eE9wdCA9PT0gbnVsbCkgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsXCIpO2Vsc2UgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsXCIsIGN0eE9wdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZ2wgPT0gbnVsbCA/IFwibm8gd2ViZ2xcIiA6IFwidXNpbmcgd2ViZ2xcIik7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBnbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGdsID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3R4T3B0ID09PSB1bmRlZmluZWQgfHwgY3R4T3B0ID09PSBudWxsKSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiZXhwZXJpbWVudGFsLXdlYmdsXCIpO2Vsc2UgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcImV4cGVyaW1lbnRhbC13ZWJnbFwiLCBjdHhPcHQpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGdsID09IG51bGwgPyBcIm5vIGV4cGVyaW1lbnRhbC13ZWJnbFwiIDogXCJ1c2luZyBleHBlcmltZW50YWwtd2ViZ2xcIik7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBnbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGdsID09IG51bGwpIGdsID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gZ2w7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJnZXRVaW50OEFycmF5RnJvbUhUTUxJbWFnZUVsZW1lbnRcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgVWludDhBcnJheSBmcm9tIEhUTUxJbWFnZUVsZW1lbnRcbiAgICAgICAgICogQHBhcmFtIHtIVE1MSW1hZ2VFbGVtZW50fSBpbWFnZUVsZW1lbnRcbiAgICAgICAgICogQHJldHVybnMge1VpbnQ4Q2xhbXBlZEFycmF5fVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldFVpbnQ4QXJyYXlGcm9tSFRNTEltYWdlRWxlbWVudChpbWFnZUVsZW1lbnQpIHtcbiAgICAgICAgICAgIHZhciBlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgICAgICBlLndpZHRoID0gaW1hZ2VFbGVtZW50LndpZHRoO1xuICAgICAgICAgICAgZS5oZWlnaHQgPSBpbWFnZUVsZW1lbnQuaGVpZ2h0O1xuICAgICAgICAgICAgdmFyIGN0eDJEX3RleCA9IGUuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgICAgICAgICAgY3R4MkRfdGV4LmRyYXdJbWFnZShpbWFnZUVsZW1lbnQsIDAsIDApO1xuICAgICAgICAgICAgdmFyIGFycmF5VGV4ID0gY3R4MkRfdGV4LmdldEltYWdlRGF0YSgwLCAwLCBpbWFnZUVsZW1lbnQud2lkdGgsIGltYWdlRWxlbWVudC5oZWlnaHQpO1xuXG4gICAgICAgICAgICByZXR1cm4gYXJyYXlUZXguZGF0YTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImRvdDRcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEb3QgcHJvZHVjdCB2ZWN0b3I0ZmxvYXRcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBkb3Q0KHZlY3RvcjRBLCB2ZWN0b3I0Qikge1xuICAgICAgICAgICAgcmV0dXJuIHZlY3RvcjRBWzBdICogdmVjdG9yNEJbMF0gKyB2ZWN0b3I0QVsxXSAqIHZlY3RvcjRCWzFdICsgdmVjdG9yNEFbMl0gKiB2ZWN0b3I0QlsyXSArIHZlY3RvcjRBWzNdICogdmVjdG9yNEJbM107XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJmcmFjdFwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbXB1dGUgdGhlIGZyYWN0aW9uYWwgcGFydCBvZiB0aGUgYXJndW1lbnQuIGZyYWN0KHBpKT0wLjE0MTU5MjY1Li4uXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZnJhY3QobnVtYmVyKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVtYmVyID4gMCA/IG51bWJlciAtIE1hdGguZmxvb3IobnVtYmVyKSA6IG51bWJlciAtIE1hdGguY2VpbChudW1iZXIpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwicGFja0dMU0xGdW5jdGlvblN0cmluZ1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBwYWNrIEdMU0wgZnVuY3Rpb24gc3RyaW5nXG4gICAgICAgICAqIEByZXR1cm5zIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcGFja0dMU0xGdW5jdGlvblN0cmluZygpIHtcbiAgICAgICAgICAgIHJldHVybiAndmVjNCBwYWNrIChmbG9hdCBkZXB0aCkge1xcbicgKyAnY29uc3QgdmVjNCBiaWFzID0gdmVjNCgxLjAgLyAyNTUuMCxcXG4nICsgJzEuMCAvIDI1NS4wLFxcbicgKyAnMS4wIC8gMjU1LjAsXFxuJyArICcwLjApO1xcbicgKyAnZmxvYXQgciA9IGRlcHRoO1xcbicgKyAnZmxvYXQgZyA9IGZyYWN0KHIgKiAyNTUuMCk7XFxuJyArICdmbG9hdCBiID0gZnJhY3QoZyAqIDI1NS4wKTtcXG4nICsgJ2Zsb2F0IGEgPSBmcmFjdChiICogMjU1LjApO1xcbicgKyAndmVjNCBjb2xvdXIgPSB2ZWM0KHIsIGcsIGIsIGEpO1xcbicgKyAncmV0dXJuIGNvbG91ciAtIChjb2xvdXIueXp3dyAqIGJpYXMpO1xcbicgKyAnfVxcbic7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJ1bnBhY2tHTFNMRnVuY3Rpb25TdHJpbmdcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgdW5wYWNrIEdMU0wgZnVuY3Rpb24gc3RyaW5nXG4gICAgICAgICAqIEByZXR1cm5zIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gdW5wYWNrR0xTTEZ1bmN0aW9uU3RyaW5nKCkge1xuICAgICAgICAgICAgcmV0dXJuICdmbG9hdCB1bnBhY2sgKHZlYzQgY29sb3VyKSB7XFxuJyArICdjb25zdCB2ZWM0IGJpdFNoaWZ0cyA9IHZlYzQoMS4wLFxcbicgKyAnMS4wIC8gMjU1LjAsXFxuJyArICcxLjAgLyAoMjU1LjAgKiAyNTUuMCksXFxuJyArICcxLjAgLyAoMjU1LjAgKiAyNTUuMCAqIDI1NS4wKSk7XFxuJyArICdyZXR1cm4gZG90KGNvbG91ciwgYml0U2hpZnRzKTtcXG4nICsgJ31cXG4nO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZ2V0T3V0cHV0QnVmZmVyc1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGdldE91dHB1dEJ1ZmZlcnNcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMS2VybmVsfFdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW19IHByb2dcbiAgICAgICAgICogQHBhcmFtIHtBcnJheTxXZWJDTEdMQnVmZmVyPn0gYnVmZmVyc1xuICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXk8V2ViQ0xHTEJ1ZmZlcj59XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0T3V0cHV0QnVmZmVycyhwcm9nLCBidWZmZXJzKSB7XG4gICAgICAgICAgICB2YXIgb3V0cHV0QnVmZiA9IG51bGw7XG4gICAgICAgICAgICBpZiAocHJvZy5vdXRwdXQgIT09IHVuZGVmaW5lZCAmJiBwcm9nLm91dHB1dCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG91dHB1dEJ1ZmYgPSBbXTtcbiAgICAgICAgICAgICAgICBpZiAocHJvZy5vdXRwdXRbMF0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8IHByb2cub3V0cHV0Lmxlbmd0aDsgbisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2lmKGJ1ZmZlcnMuaGFzT3duUHJvcGVydHkocHJvZy5vdXRwdXRbbl0pID09IGZhbHNlICYmIF9hbGVydGVkID09IGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgX2FsZXJ0ZWQgPSB0cnVlLCBhbGVydChcIm91dHB1dCBhcmd1bWVudCBcIitwcm9nLm91dHB1dFtuXStcIiBub3QgZm91bmQgaW4gYnVmZmVycy4gYWRkIGRlc2lyZWQgYXJndW1lbnQgYXMgc2hhcmVkXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXRCdWZmW25dID0gYnVmZmVyc1twcm9nLm91dHB1dFtuXV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Ugb3V0cHV0QnVmZiA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0QnVmZjtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInBhcnNlU291cmNlXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogcGFyc2VTb3VyY2VcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IHNvdXJjZVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gdmFsdWVzXG4gICAgICAgICAqIEByZXR1cm5zIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcGFyc2VTb3VyY2Uoc291cmNlLCB2YWx1ZXMpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB2YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVnZXhwID0gbmV3IFJlZ0V4cChrZXkgKyBcIlxcXFxbKD8hXFxcXGQpLio/XFxcXF1cIiwgXCJnbVwiKTsgLy8gYXZvaWQgbm9ybWFsIHVuaWZvcm0gYXJyYXlzXG4gICAgICAgICAgICAgICAgdmFyIHZhck1hdGNoZXMgPSBzb3VyY2UubWF0Y2gocmVnZXhwKTsgLy8gXCJTZWFyY2ggY3VycmVudCBcImFyZ05hbWVcIiBpbiBzb3VyY2UgYW5kIHN0b3JlIGluIGFycmF5IHZhck1hdGNoZXNcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKHZhck1hdGNoZXMpO1xuICAgICAgICAgICAgICAgIGlmICh2YXJNYXRjaGVzICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbkIgPSAwLCBmQiA9IHZhck1hdGNoZXMubGVuZ3RoOyBuQiA8IGZCOyBuQisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmb3IgZWFjaCB2YXJNYXRjaGVzIChcIkFbeF1cIiwgXCJBW3hdXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVnZXhwTmF0aXZlR0wgPSBuZXcgUmVnRXhwKCdgYGAoXFxzfFxcdCkqZ2wuKicgKyB2YXJNYXRjaGVzW25CXSArICcuKmBgYFteYGBgKFxcc3xcXHQpKmdsXScsIFwiZ21cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVnZXhwTmF0aXZlR0xNYXRjaGVzID0gc291cmNlLm1hdGNoKHJlZ2V4cE5hdGl2ZUdMKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZWdleHBOYXRpdmVHTE1hdGNoZXMgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuYW1lID0gdmFyTWF0Y2hlc1tuQl0uc3BsaXQoJ1snKVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFyaSA9IHZhck1hdGNoZXNbbkJdLnNwbGl0KCdbJylbMV0uc3BsaXQoJ10nKVswXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtYXAgPSB7ICdmbG9hdDRfZnJvbVNhbXBsZXInOiBzb3VyY2UucmVwbGFjZShuYW1lICsgXCJbXCIgKyB2YXJpICsgXCJdXCIsICd0ZXh0dXJlMkQoJyArIG5hbWUgKyAnLCcgKyB2YXJpICsgJyknKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0X2Zyb21TYW1wbGVyJzogc291cmNlLnJlcGxhY2UobmFtZSArIFwiW1wiICsgdmFyaSArIFwiXVwiLCAndGV4dHVyZTJEKCcgKyBuYW1lICsgJywnICsgdmFyaSArICcpLngnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0NF9mcm9tQXR0cic6IHNvdXJjZS5yZXBsYWNlKG5hbWUgKyBcIltcIiArIHZhcmkgKyBcIl1cIiwgbmFtZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdmbG9hdF9mcm9tQXR0cic6IHNvdXJjZS5yZXBsYWNlKG5hbWUgKyBcIltcIiArIHZhcmkgKyBcIl1cIiwgbmFtZSkgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2UgPSBtYXBbdmFsdWVzW2tleV0udHlwZV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzb3VyY2UgPSBzb3VyY2UucmVwbGFjZSgvYGBgKFxcc3xcXHQpKmdsL2dpLCBcIlwiKS5yZXBsYWNlKC9gYGAvZ2ksIFwiXCIpLnJlcGxhY2UoLzsvZ2ksIFwiO1xcblwiKS5yZXBsYWNlKC99L2dpLCBcIn1cXG5cIikucmVwbGFjZSgvey9naSwgXCJ7XFxuXCIpO1xuICAgICAgICAgICAgcmV0dXJuIHNvdXJjZTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImxpbmVzX3ZlcnRleF9hdHRyc1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGxpbmVzX3ZlcnRleF9hdHRyc1xuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gdmFsdWVzXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gbGluZXNfdmVydGV4X2F0dHJzKHZhbHVlcykge1xuICAgICAgICAgICAgdmFyIHN0ciA9ICcnO1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHZhbHVlcykge1xuICAgICAgICAgICAgICAgIHN0ciArPSB7ICdmbG9hdDRfZnJvbVNhbXBsZXInOiAndW5pZm9ybSBzYW1wbGVyMkQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0X2Zyb21TYW1wbGVyJzogJ3VuaWZvcm0gc2FtcGxlcjJEICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdDRfZnJvbUF0dHInOiAnYXR0cmlidXRlIHZlYzQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0X2Zyb21BdHRyJzogJ2F0dHJpYnV0ZSBmbG9hdCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXQnOiAndW5pZm9ybSBmbG9hdCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXQ0JzogJ3VuaWZvcm0gdmVjNCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnbWF0NCc6ICd1bmlmb3JtIG1hdDQgJyArIGtleSArICc7JyB9W3ZhbHVlc1trZXldLnR5cGVdICsgJ1xcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwibGluZXNfZnJhZ21lbnRfYXR0cnNcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBsaW5lc19mcmFnbWVudF9hdHRyc1xuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gdmFsdWVzXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gbGluZXNfZnJhZ21lbnRfYXR0cnModmFsdWVzKSB7XG4gICAgICAgICAgICB2YXIgc3RyID0gJyc7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9IHsgJ2Zsb2F0NF9mcm9tU2FtcGxlcic6ICd1bmlmb3JtIHNhbXBsZXIyRCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXRfZnJvbVNhbXBsZXInOiAndW5pZm9ybSBzYW1wbGVyMkQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0JzogJ3VuaWZvcm0gZmxvYXQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0NCc6ICd1bmlmb3JtIHZlYzQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ21hdDQnOiAndW5pZm9ybSBtYXQ0ICcgKyBrZXkgKyAnOycgfVt2YWx1ZXNba2V5XS50eXBlXSArICdcXG4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImxpbmVzX2RyYXdCdWZmZXJzSW5pdFwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGxpbmVzX2RyYXdCdWZmZXJzSW5pdFxuICAgICAgICAgKiBAcGFyYW0ge2ludH0gbWF4RHJhd0J1ZmZlcnNcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBsaW5lc19kcmF3QnVmZmVyc0luaXQobWF4RHJhd0J1ZmZlcnMpIHtcbiAgICAgICAgICAgIHZhciBzdHIgPSAnJztcbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmbiA9IG1heERyYXdCdWZmZXJzOyBuIDwgZm47IG4rKykge1xuICAgICAgICAgICAgICAgIHN0ciArPSAnJyArICdmbG9hdCBvdXQnICsgbiArICdfZmxvYXQgPSAtOTk5Ljk5OTg5O1xcbicgKyAndmVjNCBvdXQnICsgbiArICdfZmxvYXQ0O1xcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwibGluZXNfZHJhd0J1ZmZlcnNXcml0ZUluaXRcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGxpbmVzX2RyYXdCdWZmZXJzV3JpdGVJbml0KG1heERyYXdCdWZmZXJzKSB7XG4gICAgICAgICAgICB2YXIgc3RyID0gJyc7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMCwgZm4gPSBtYXhEcmF3QnVmZmVyczsgbiA8IGZuOyBuKyspIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0gJycgKyAnbGF5b3V0KGxvY2F0aW9uID0gJyArIG4gKyAnKSBvdXQgdmVjNCBvdXRDb2wnICsgbiArICc7XFxuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJsaW5lc19kcmF3QnVmZmVyc1dyaXRlXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogbGluZXNfZHJhd0J1ZmZlcnNXcml0ZVxuICAgICAgICAgKiBAcGFyYW0ge2ludH0gbWF4RHJhd0J1ZmZlcnNcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBsaW5lc19kcmF3QnVmZmVyc1dyaXRlKG1heERyYXdCdWZmZXJzKSB7XG4gICAgICAgICAgICB2YXIgc3RyID0gJyc7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMCwgZm4gPSBtYXhEcmF3QnVmZmVyczsgbiA8IGZuOyBuKyspIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0gJycgKyAnaWYob3V0JyArIG4gKyAnX2Zsb2F0ICE9IC05OTkuOTk5ODkpIGdsX0ZyYWdEYXRhWycgKyBuICsgJ10gPSB2ZWM0KG91dCcgKyBuICsgJ19mbG9hdCwwLjAsMC4wLDEuMCk7XFxuJyArICcgZWxzZSBnbF9GcmFnRGF0YVsnICsgbiArICddID0gb3V0JyArIG4gKyAnX2Zsb2F0NDtcXG4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogY2hlY2tBcmdOYW1lSW5pdGlhbGl6YXRpb25cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGluVmFsdWVzXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBhcmdOYW1lXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY2hlY2tBcmdOYW1lSW5pdGlhbGl6YXRpb24oaW5WYWx1ZXMsIGFyZ05hbWUpIHtcbiAgICAgICAgICAgIGlmIChpblZhbHVlcy5oYXNPd25Qcm9wZXJ0eShhcmdOYW1lKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBpblZhbHVlc1thcmdOYW1lXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgXCJ0eXBlXCI6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIFwiZXhwZWN0ZWRNb2RlXCI6IG51bGwsIC8vIFwiQVRUUklCVVRFXCIsIFwiU0FNUExFUlwiLCBcIlVOSUZPUk1cIlxuICAgICAgICAgICAgICAgICAgICBcImxvY2F0aW9uXCI6IG51bGwgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImdldF9nbG9iYWxfaWQzX0dMU0xGdW5jdGlvblN0cmluZ1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGdldF9nbG9iYWxfaWQzX0dMU0xGdW5jdGlvblN0cmluZ1xuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldF9nbG9iYWxfaWQzX0dMU0xGdW5jdGlvblN0cmluZygpIHtcbiAgICAgICAgICAgIHJldHVybiAnJyArICd2ZWMyIGdldF9nbG9iYWxfaWQoZmxvYXQgaWQsIGZsb2F0IGJ1ZmZlcldpZHRoLCBmbG9hdCBnZW9tZXRyeUxlbmd0aCkge1xcbicgKyAnZmxvYXQgdGV4ZWxTaXplID0gMS4wL2J1ZmZlcldpZHRoOycgKyAnZmxvYXQgbnVtID0gKGlkKmdlb21ldHJ5TGVuZ3RoKS9idWZmZXJXaWR0aDsnICsgJ2Zsb2F0IGNvbHVtbiA9IGZyYWN0KG51bSkrKHRleGVsU2l6ZS8yLjApOycgKyAnZmxvYXQgcm93ID0gKGZsb29yKG51bSkvYnVmZmVyV2lkdGgpKyh0ZXhlbFNpemUvMi4wKTsnICsgJ3JldHVybiB2ZWMyKGNvbHVtbiwgcm93KTsnICsgJ31cXG4nO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZ2V0X2dsb2JhbF9pZDJfR0xTTEZ1bmN0aW9uU3RyaW5nXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogZ2V0X2dsb2JhbF9pZDJfR0xTTEZ1bmN0aW9uU3RyaW5nXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0X2dsb2JhbF9pZDJfR0xTTEZ1bmN0aW9uU3RyaW5nKCkge1xuICAgICAgICAgICAgcmV0dXJuICcnICsgJ3ZlYzIgZ2V0X2dsb2JhbF9pZCh2ZWMyIGlkLCBmbG9hdCBidWZmZXJXaWR0aCkge1xcbicgKyAnZmxvYXQgdGV4ZWxTaXplID0gMS4wL2J1ZmZlcldpZHRoOycgKyAnZmxvYXQgY29sdW1uID0gKGlkLngvYnVmZmVyV2lkdGgpKyh0ZXhlbFNpemUvMi4wKTsnICsgJ2Zsb2F0IHJvdyA9IChpZC55L2J1ZmZlcldpZHRoKSsodGV4ZWxTaXplLzIuMCk7JyArICdyZXR1cm4gdmVjMihjb2x1bW4sIHJvdyk7JyArICd9XFxuJztcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBXZWJDTEdMVXRpbHM7XG59KCk7XG5cbmdsb2JhbC5XZWJDTEdMVXRpbHMgPSBXZWJDTEdMVXRpbHM7XG5tb2R1bGUuZXhwb3J0cy5XZWJDTEdMVXRpbHMgPSBXZWJDTEdMVXRpbHM7IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLldlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0gPSB1bmRlZmluZWQ7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KCk7XG5cbnZhciBfV2ViQ0xHTFV0aWxzID0gcmVxdWlyZSgnLi9XZWJDTEdMVXRpbHMuY2xhc3MnKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuLyoqXHJcbiogV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbSBPYmplY3RcclxuKiBAY2xhc3NcclxuICogQHBhcmFtIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGdsXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB2ZXJ0ZXhTb3VyY2VcclxuICogQHBhcmFtIHtTdHJpbmd9IHZlcnRleEhlYWRlclxyXG4gKiBAcGFyYW0ge1N0cmluZ30gZnJhZ21lbnRTb3VyY2VcclxuICogQHBhcmFtIHtTdHJpbmd9IGZyYWdtZW50SGVhZGVyXHJcbiovXG52YXIgV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbSA9IGV4cG9ydHMuV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbSA9IGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtKGdsLCB2ZXJ0ZXhTb3VyY2UsIHZlcnRleEhlYWRlciwgZnJhZ21lbnRTb3VyY2UsIGZyYWdtZW50SGVhZGVyKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtKTtcblxuICAgICAgICB0aGlzLl9nbCA9IGdsO1xuICAgICAgICB2YXIgaGlnaFByZWNpc2lvblN1cHBvcnQgPSB0aGlzLl9nbC5nZXRTaGFkZXJQcmVjaXNpb25Gb3JtYXQodGhpcy5fZ2wuRlJBR01FTlRfU0hBREVSLCB0aGlzLl9nbC5ISUdIX0ZMT0FUKTtcbiAgICAgICAgdGhpcy5fcHJlY2lzaW9uID0gaGlnaFByZWNpc2lvblN1cHBvcnQucHJlY2lzaW9uICE9PSAwID8gJ3ByZWNpc2lvbiBoaWdocCBmbG9hdDtcXG5cXG5wcmVjaXNpb24gaGlnaHAgaW50O1xcblxcbicgOiAncHJlY2lzaW9uIGxvd3AgZmxvYXQ7XFxuXFxucHJlY2lzaW9uIGxvd3AgaW50O1xcblxcbic7XG5cbiAgICAgICAgdmFyIF9nbERyYXdCdWZmX2V4dCA9IHRoaXMuX2dsLmdldEV4dGVuc2lvbihcIldFQkdMX2RyYXdfYnVmZmVyc1wiKTtcbiAgICAgICAgdGhpcy5fbWF4RHJhd0J1ZmZlcnMgPSBudWxsO1xuICAgICAgICBpZiAoX2dsRHJhd0J1ZmZfZXh0ICE9IG51bGwpIHRoaXMuX21heERyYXdCdWZmZXJzID0gdGhpcy5fZ2wuZ2V0UGFyYW1ldGVyKF9nbERyYXdCdWZmX2V4dC5NQVhfRFJBV19CVUZGRVJTX1dFQkdMKTtcblxuICAgICAgICB0aGlzLm5hbWUgPSBcIlwiO1xuICAgICAgICB0aGlzLnZpZXdTb3VyY2UgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmluX3ZlcnRleF92YWx1ZXMgPSB7fTtcbiAgICAgICAgdGhpcy5pbl9mcmFnbWVudF92YWx1ZXMgPSB7fTtcblxuICAgICAgICB0aGlzLl92ZXJ0ZXhQX3JlYWR5ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2ZyYWdtZW50UF9yZWFkeSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuX3ZlcnRleEhlYWQgPSBudWxsO1xuICAgICAgICB0aGlzLl92ZXJ0ZXhTb3VyY2UgPSBudWxsO1xuICAgICAgICB0aGlzLl9mcmFnbWVudEhlYWQgPSBudWxsO1xuICAgICAgICB0aGlzLl9mcmFnbWVudFNvdXJjZSA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5vdXRwdXQgPSBudWxsOyAvL1N0cmluZyBvciBBcnJheTxTdHJpbmc+IG9mIGFyZyBuYW1lcyB3aXRoIHRoZSBpdGVtcyBpbiBzYW1lIG9yZGVyIHRoYXQgaW4gdGhlIGZpbmFsIHJldHVyblxuICAgICAgICB0aGlzLm91dHB1dFRlbXBNb2RlcyA9IG51bGw7XG4gICAgICAgIHRoaXMuZkJ1ZmZlciA9IG51bGw7XG4gICAgICAgIHRoaXMuZkJ1ZmZlclRlbXAgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuZHJhd01vZGUgPSA0O1xuXG4gICAgICAgIGlmICh2ZXJ0ZXhTb3VyY2UgIT09IHVuZGVmaW5lZCAmJiB2ZXJ0ZXhTb3VyY2UgIT09IG51bGwpIHRoaXMuc2V0VmVydGV4U291cmNlKHZlcnRleFNvdXJjZSwgdmVydGV4SGVhZGVyKTtcblxuICAgICAgICBpZiAoZnJhZ21lbnRTb3VyY2UgIT09IHVuZGVmaW5lZCAmJiBmcmFnbWVudFNvdXJjZSAhPT0gbnVsbCkgdGhpcy5zZXRGcmFnbWVudFNvdXJjZShmcmFnbWVudFNvdXJjZSwgZnJhZ21lbnRIZWFkZXIpO1xuICAgIH1cblxuICAgIC8qKlxyXG4gICAgICogY29tcGlsZVZlcnRleEZyYWdtZW50U291cmNlXHJcbiAgICAgKi9cblxuXG4gICAgX2NyZWF0ZUNsYXNzKFdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0sIFt7XG4gICAgICAgIGtleTogJ2NvbXBpbGVWZXJ0ZXhGcmFnbWVudFNvdXJjZScsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjb21waWxlVmVydGV4RnJhZ21lbnRTb3VyY2UoKSB7XG4gICAgICAgICAgICB2YXIgc291cmNlVmVydGV4ID0gXCJcIiArIHRoaXMuX3ByZWNpc2lvbiArICd1bmlmb3JtIGZsb2F0IHVPZmZzZXQ7XFxuJyArICd1bmlmb3JtIGZsb2F0IHVCdWZmZXJXaWR0aDsnICsgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMubGluZXNfdmVydGV4X2F0dHJzKHRoaXMuaW5fdmVydGV4X3ZhbHVlcykgKyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy51bnBhY2tHTFNMRnVuY3Rpb25TdHJpbmcoKSArIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmdldF9nbG9iYWxfaWQzX0dMU0xGdW5jdGlvblN0cmluZygpICsgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuZ2V0X2dsb2JhbF9pZDJfR0xTTEZ1bmN0aW9uU3RyaW5nKCkgKyB0aGlzLl92ZXJ0ZXhIZWFkICsgJ3ZvaWQgbWFpbih2b2lkKSB7XFxuJyArIHRoaXMuX3ZlcnRleFNvdXJjZSArICd9XFxuJztcbiAgICAgICAgICAgIHZhciBzb3VyY2VGcmFnbWVudCA9ICcjZXh0ZW5zaW9uIEdMX0VYVF9kcmF3X2J1ZmZlcnMgOiByZXF1aXJlXFxuJyArIHRoaXMuX3ByZWNpc2lvbiArIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmxpbmVzX2ZyYWdtZW50X2F0dHJzKHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzKSArIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmdldF9nbG9iYWxfaWQzX0dMU0xGdW5jdGlvblN0cmluZygpICsgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuZ2V0X2dsb2JhbF9pZDJfR0xTTEZ1bmN0aW9uU3RyaW5nKCkgKyB0aGlzLl9mcmFnbWVudEhlYWQgK1xuXG4gICAgICAgICAgICAvL1dlYkNMR0xVdGlscy5saW5lc19kcmF3QnVmZmVyc1dyaXRlSW5pdCg4KStcbiAgICAgICAgICAgICd2b2lkIG1haW4odm9pZCkge1xcbicgKyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5saW5lc19kcmF3QnVmZmVyc0luaXQoOCkgKyB0aGlzLl9mcmFnbWVudFNvdXJjZSArIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmxpbmVzX2RyYXdCdWZmZXJzV3JpdGUoOCkgKyAnfVxcbic7XG5cbiAgICAgICAgICAgIHRoaXMudmVydGV4RnJhZ21lbnRQcm9ncmFtID0gdGhpcy5fZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscygpLmNyZWF0ZVNoYWRlcih0aGlzLl9nbCwgXCJXRUJDTEdMIFZFUlRFWCBGUkFHTUVOVCBQUk9HUkFNXCIsIHNvdXJjZVZlcnRleCwgc291cmNlRnJhZ21lbnQsIHRoaXMudmVydGV4RnJhZ21lbnRQcm9ncmFtKTtcblxuICAgICAgICAgICAgdGhpcy51T2Zmc2V0ID0gdGhpcy5fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMudmVydGV4RnJhZ21lbnRQcm9ncmFtLCBcInVPZmZzZXRcIik7XG4gICAgICAgICAgICB0aGlzLnVCdWZmZXJXaWR0aCA9IHRoaXMuX2dsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnZlcnRleEZyYWdtZW50UHJvZ3JhbSwgXCJ1QnVmZmVyV2lkdGhcIik7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLmluX3ZlcnRleF92YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXhwZWN0ZWRNb2RlID0geyAnZmxvYXQ0X2Zyb21TYW1wbGVyJzogXCJTQU1QTEVSXCIsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdF9mcm9tU2FtcGxlcic6IFwiU0FNUExFUlwiLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXQ0X2Zyb21BdHRyJzogXCJBVFRSSUJVVEVcIixcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0X2Zyb21BdHRyJzogXCJBVFRSSUJVVEVcIixcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0JzogXCJVTklGT1JNXCIsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdDQnOiBcIlVOSUZPUk1cIixcbiAgICAgICAgICAgICAgICAgICAgJ21hdDQnOiBcIlVOSUZPUk1cIiB9W3RoaXMuaW5fdmVydGV4X3ZhbHVlc1trZXldLnR5cGVdO1xuXG4gICAgICAgICAgICAgICAgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuY2hlY2tBcmdOYW1lSW5pdGlhbGl6YXRpb24odGhpcy5pbl92ZXJ0ZXhfdmFsdWVzLCBrZXkpO1xuICAgICAgICAgICAgICAgIHZhciBsb2MgPSBleHBlY3RlZE1vZGUgPT09IFwiQVRUUklCVVRFXCIgPyB0aGlzLl9nbC5nZXRBdHRyaWJMb2NhdGlvbih0aGlzLnZlcnRleEZyYWdtZW50UHJvZ3JhbSwga2V5KSA6IHRoaXMuX2dsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnZlcnRleEZyYWdtZW50UHJvZ3JhbSwga2V5LnJlcGxhY2UoL1xcW1xcZC4qLywgXCJcIikpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5fdmVydGV4X3ZhbHVlc1trZXldLmxvY2F0aW9uID0gW2xvY107XG4gICAgICAgICAgICAgICAgdGhpcy5pbl92ZXJ0ZXhfdmFsdWVzW2tleV0uZXhwZWN0ZWRNb2RlID0gZXhwZWN0ZWRNb2RlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKHZhciBfa2V5IGluIHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIF9leHBlY3RlZE1vZGUgPSB7ICdmbG9hdDRfZnJvbVNhbXBsZXInOiBcIlNBTVBMRVJcIixcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0X2Zyb21TYW1wbGVyJzogXCJTQU1QTEVSXCIsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdCc6IFwiVU5JRk9STVwiLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXQ0JzogXCJVTklGT1JNXCIsXG4gICAgICAgICAgICAgICAgICAgICdtYXQ0JzogXCJVTklGT1JNXCIgfVt0aGlzLmluX2ZyYWdtZW50X3ZhbHVlc1tfa2V5XS50eXBlXTtcblxuICAgICAgICAgICAgICAgIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uKHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzLCBfa2V5KTtcbiAgICAgICAgICAgICAgICB0aGlzLmluX2ZyYWdtZW50X3ZhbHVlc1tfa2V5XS5sb2NhdGlvbiA9IFt0aGlzLl9nbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy52ZXJ0ZXhGcmFnbWVudFByb2dyYW0sIF9rZXkucmVwbGFjZSgvXFxbXFxkLiovLCBcIlwiKSldO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzW19rZXldLmV4cGVjdGVkTW9kZSA9IF9leHBlY3RlZE1vZGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBcIlZFUlRFWCBQUk9HUkFNXFxuXCIgKyBzb3VyY2VWZXJ0ZXggKyBcIlxcbiBGUkFHTUVOVCBQUk9HUkFNXFxuXCIgKyBzb3VyY2VGcmFnbWVudDtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAnc2V0VmVydGV4U291cmNlJyxcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFVwZGF0ZSB0aGUgdmVydGV4IHNvdXJjZVxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSB2ZXJ0ZXhTb3VyY2VcclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gdmVydGV4SGVhZGVyXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRWZXJ0ZXhTb3VyY2UodmVydGV4U291cmNlLCB2ZXJ0ZXhIZWFkZXIpIHtcbiAgICAgICAgICAgIHZhciBhcmd1bWVudHNTb3VyY2UgPSB2ZXJ0ZXhTb3VyY2Uuc3BsaXQoJyknKVswXS5zcGxpdCgnKCcpWzFdLnNwbGl0KCcsJyk7IC8vIFwiZmxvYXQqIEFcIiwgXCJmbG9hdCogQlwiLCBcImZsb2F0IENcIiwgXCJmbG9hdDQqIERcIlxuXG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMCwgZiA9IGFyZ3VtZW50c1NvdXJjZS5sZW5ndGg7IG4gPCBmOyBuKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9cXCphdHRyL2dtKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJnTmFtZSA9IGFyZ3VtZW50c1NvdXJjZVtuXS5zcGxpdCgnKmF0dHInKVsxXS50cmltKCk7XG4gICAgICAgICAgICAgICAgICAgIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uKHRoaXMuaW5fdmVydGV4X3ZhbHVlcywgYXJnTmFtZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvZmxvYXQ0L2dtKSAhPSBudWxsKSB0aGlzLmluX3ZlcnRleF92YWx1ZXNbYXJnTmFtZV0udHlwZSA9ICdmbG9hdDRfZnJvbUF0dHInO2Vsc2UgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvZmxvYXQvZ20pICE9IG51bGwpIHRoaXMuaW5fdmVydGV4X3ZhbHVlc1thcmdOYW1lXS50eXBlID0gJ2Zsb2F0X2Zyb21BdHRyJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvXFwqL2dtKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgX2FyZ05hbWUgPSBhcmd1bWVudHNTb3VyY2Vbbl0uc3BsaXQoJyonKVsxXS50cmltKCk7XG4gICAgICAgICAgICAgICAgICAgIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uKHRoaXMuaW5fdmVydGV4X3ZhbHVlcywgX2FyZ05hbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0NC9nbSkgIT0gbnVsbCkgdGhpcy5pbl92ZXJ0ZXhfdmFsdWVzW19hcmdOYW1lXS50eXBlID0gJ2Zsb2F0NF9mcm9tU2FtcGxlcic7ZWxzZSBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9mbG9hdC9nbSkgIT0gbnVsbCkgdGhpcy5pbl92ZXJ0ZXhfdmFsdWVzW19hcmdOYW1lXS50eXBlID0gJ2Zsb2F0X2Zyb21TYW1wbGVyJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXSAhPT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgX2FyZ05hbWUyID0gYXJndW1lbnRzU291cmNlW25dLnNwbGl0KCcgJylbMV0udHJpbSgpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5pbl92ZXJ0ZXhfdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5LnJlcGxhY2UoL1xcW1xcZC4qLywgXCJcIikgPT09IF9hcmdOYW1lMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9hcmdOYW1lMiA9IGtleTsgLy8gZm9yIG5vcm1hbCB1bmlmb3JtIGFycmF5c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuY2hlY2tBcmdOYW1lSW5pdGlhbGl6YXRpb24odGhpcy5pbl92ZXJ0ZXhfdmFsdWVzLCBfYXJnTmFtZTIpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0NC9nbSkgIT0gbnVsbCkgdGhpcy5pbl92ZXJ0ZXhfdmFsdWVzW19hcmdOYW1lMl0udHlwZSA9ICdmbG9hdDQnO2Vsc2UgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvZmxvYXQvZ20pICE9IG51bGwpIHRoaXMuaW5fdmVydGV4X3ZhbHVlc1tfYXJnTmFtZTJdLnR5cGUgPSAnZmxvYXQnO2Vsc2UgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvbWF0NC9nbSkgIT0gbnVsbCkgdGhpcy5pbl92ZXJ0ZXhfdmFsdWVzW19hcmdOYW1lMl0udHlwZSA9ICdtYXQ0JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHBhcnNlIGhlYWRlclxuICAgICAgICAgICAgdGhpcy5fdmVydGV4SGVhZCA9IHZlcnRleEhlYWRlciAhPT0gdW5kZWZpbmVkICYmIHZlcnRleEhlYWRlciAhPT0gbnVsbCA/IHZlcnRleEhlYWRlciA6ICcnO1xuICAgICAgICAgICAgdGhpcy5fdmVydGV4SGVhZCA9IHRoaXMuX3ZlcnRleEhlYWQucmVwbGFjZSgvXFxyXFxuL2dpLCAnJykucmVwbGFjZSgvXFxyL2dpLCAnJykucmVwbGFjZSgvXFxuL2dpLCAnJyk7XG4gICAgICAgICAgICB0aGlzLl92ZXJ0ZXhIZWFkID0gX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMucGFyc2VTb3VyY2UodGhpcy5fdmVydGV4SGVhZCwgdGhpcy5pbl92ZXJ0ZXhfdmFsdWVzKTtcblxuICAgICAgICAgICAgLy8gcGFyc2Ugc291cmNlXG4gICAgICAgICAgICB0aGlzLl92ZXJ0ZXhTb3VyY2UgPSB2ZXJ0ZXhTb3VyY2UucmVwbGFjZSgvXFxyXFxuL2dpLCAnJykucmVwbGFjZSgvXFxyL2dpLCAnJykucmVwbGFjZSgvXFxuL2dpLCAnJyk7XG4gICAgICAgICAgICB0aGlzLl92ZXJ0ZXhTb3VyY2UgPSB0aGlzLl92ZXJ0ZXhTb3VyY2UucmVwbGFjZSgvXlxcdyogXFx3KlxcKFtcXHdcXHNcXCosXSpcXCkgey9naSwgJycpLnJlcGxhY2UoL30oXFxzfFxcdCkqJC9naSwgJycpO1xuICAgICAgICAgICAgdGhpcy5fdmVydGV4U291cmNlID0gX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMucGFyc2VTb3VyY2UodGhpcy5fdmVydGV4U291cmNlLCB0aGlzLmluX3ZlcnRleF92YWx1ZXMpO1xuXG4gICAgICAgICAgICB0aGlzLl92ZXJ0ZXhQX3JlYWR5ID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9mcmFnbWVudFBfcmVhZHkgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdHMgPSB0aGlzLmNvbXBpbGVWZXJ0ZXhGcmFnbWVudFNvdXJjZSgpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudmlld1NvdXJjZSA9PT0gdHJ1ZSkgY29uc29sZS5sb2coJyVjIFZGUDogJyArIHRoaXMubmFtZSwgJ2ZvbnQtc2l6ZTogMjBweDsgY29sb3I6IGdyZWVuJyksIGNvbnNvbGUubG9nKCclYyBXRUJDTEdMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJywgJ2NvbG9yOiBncmF5JyksIGNvbnNvbGUubG9nKCclYyAnICsgdmVydGV4SGVhZGVyICsgdmVydGV4U291cmNlLCAnY29sb3I6IGdyYXknKSwgY29uc29sZS5sb2coJyVjIFRSQU5TTEFURUQgV0VCR0wgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJywgJ2NvbG9yOiBkYXJrZ3JheScpLCBjb25zb2xlLmxvZygnJWMgJyArIHRzLCAnY29sb3I6IGRhcmtncmF5Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ3NldEZyYWdtZW50U291cmNlJyxcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFVwZGF0ZSB0aGUgZnJhZ21lbnQgc291cmNlXHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGZyYWdtZW50U291cmNlXHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGZyYWdtZW50SGVhZGVyXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRGcmFnbWVudFNvdXJjZShmcmFnbWVudFNvdXJjZSwgZnJhZ21lbnRIZWFkZXIpIHtcbiAgICAgICAgICAgIHZhciBhcmd1bWVudHNTb3VyY2UgPSBmcmFnbWVudFNvdXJjZS5zcGxpdCgnKScpWzBdLnNwbGl0KCcoJylbMV0uc3BsaXQoJywnKTsgLy8gXCJmbG9hdCogQVwiLCBcImZsb2F0KiBCXCIsIFwiZmxvYXQgQ1wiLCBcImZsb2F0NCogRFwiXG5cbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmID0gYXJndW1lbnRzU291cmNlLmxlbmd0aDsgbiA8IGY7IG4rKykge1xuICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL1xcKi9nbSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFyZ05hbWUgPSBhcmd1bWVudHNTb3VyY2Vbbl0uc3BsaXQoJyonKVsxXS50cmltKCk7XG4gICAgICAgICAgICAgICAgICAgIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uKHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzLCBhcmdOYW1lKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9mbG9hdDQvZ20pICE9IG51bGwpIHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzW2FyZ05hbWVdLnR5cGUgPSAnZmxvYXQ0X2Zyb21TYW1wbGVyJztlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0L2dtKSAhPSBudWxsKSB0aGlzLmluX2ZyYWdtZW50X3ZhbHVlc1thcmdOYW1lXS50eXBlID0gJ2Zsb2F0X2Zyb21TYW1wbGVyJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXSAhPT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgX2FyZ05hbWUzID0gYXJndW1lbnRzU291cmNlW25dLnNwbGl0KCcgJylbMV0udHJpbSgpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5pbl9mcmFnbWVudF92YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXkucmVwbGFjZSgvXFxbXFxkLiovLCBcIlwiKSA9PT0gX2FyZ05hbWUzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2FyZ05hbWUzID0ga2V5OyAvLyBmb3Igbm9ybWFsIHVuaWZvcm0gYXJyYXlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5jaGVja0FyZ05hbWVJbml0aWFsaXphdGlvbih0aGlzLmluX2ZyYWdtZW50X3ZhbHVlcywgX2FyZ05hbWUzKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9mbG9hdDQvZ20pICE9IG51bGwpIHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzW19hcmdOYW1lM10udHlwZSA9ICdmbG9hdDQnO2Vsc2UgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvZmxvYXQvZ20pICE9IG51bGwpIHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzW19hcmdOYW1lM10udHlwZSA9ICdmbG9hdCc7ZWxzZSBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9tYXQ0L2dtKSAhPSBudWxsKSB0aGlzLmluX2ZyYWdtZW50X3ZhbHVlc1tfYXJnTmFtZTNdLnR5cGUgPSAnbWF0NCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBwYXJzZSBoZWFkZXJcbiAgICAgICAgICAgIHRoaXMuX2ZyYWdtZW50SGVhZCA9IGZyYWdtZW50SGVhZGVyICE9PSB1bmRlZmluZWQgJiYgZnJhZ21lbnRIZWFkZXIgIT09IG51bGwgPyBmcmFnbWVudEhlYWRlciA6ICcnO1xuICAgICAgICAgICAgdGhpcy5fZnJhZ21lbnRIZWFkID0gdGhpcy5fZnJhZ21lbnRIZWFkLnJlcGxhY2UoL1xcclxcbi9naSwgJycpLnJlcGxhY2UoL1xcci9naSwgJycpLnJlcGxhY2UoL1xcbi9naSwgJycpO1xuICAgICAgICAgICAgdGhpcy5fZnJhZ21lbnRIZWFkID0gX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMucGFyc2VTb3VyY2UodGhpcy5fZnJhZ21lbnRIZWFkLCB0aGlzLmluX2ZyYWdtZW50X3ZhbHVlcyk7XG5cbiAgICAgICAgICAgIC8vIHBhcnNlIHNvdXJjZVxuICAgICAgICAgICAgdGhpcy5fZnJhZ21lbnRTb3VyY2UgPSBmcmFnbWVudFNvdXJjZS5yZXBsYWNlKC9cXHJcXG4vZ2ksICcnKS5yZXBsYWNlKC9cXHIvZ2ksICcnKS5yZXBsYWNlKC9cXG4vZ2ksICcnKTtcbiAgICAgICAgICAgIHRoaXMuX2ZyYWdtZW50U291cmNlID0gdGhpcy5fZnJhZ21lbnRTb3VyY2UucmVwbGFjZSgvXlxcdyogXFx3KlxcKFtcXHdcXHNcXCosXSpcXCkgey9naSwgJycpLnJlcGxhY2UoL30oXFxzfFxcdCkqJC9naSwgJycpO1xuICAgICAgICAgICAgdGhpcy5fZnJhZ21lbnRTb3VyY2UgPSBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5wYXJzZVNvdXJjZSh0aGlzLl9mcmFnbWVudFNvdXJjZSwgdGhpcy5pbl9mcmFnbWVudF92YWx1ZXMpO1xuXG4gICAgICAgICAgICB0aGlzLl9mcmFnbWVudFBfcmVhZHkgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKHRoaXMuX3ZlcnRleFBfcmVhZHkgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdHMgPSB0aGlzLmNvbXBpbGVWZXJ0ZXhGcmFnbWVudFNvdXJjZSgpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudmlld1NvdXJjZSA9PT0gdHJ1ZSkgY29uc29sZS5sb2coJyVjIFZGUDogJywgJ2ZvbnQtc2l6ZTogMjBweDsgY29sb3I6IGdyZWVuJyksIGNvbnNvbGUubG9nKCclYyBXRUJDTEdMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJywgJ2NvbG9yOiBncmF5JyksIGNvbnNvbGUubG9nKCclYyAnICsgZnJhZ21lbnRIZWFkZXIgKyBmcmFnbWVudFNvdXJjZSwgJ2NvbG9yOiBncmF5JyksIGNvbnNvbGUubG9nKCclYyBUUkFOU0xBVEVEIFdFQkdMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScsICdjb2xvcjogZGFya2dyYXknKSwgY29uc29sZS5sb2coJyVjICcgKyB0cywgJ2NvbG9yOiBkYXJrZ3JheScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIFdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW07XG59KCk7XG5cbmdsb2JhbC5XZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtID0gV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbTtcbm1vZHVsZS5leHBvcnRzLldlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0gPSBXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtOyJdfQ==
