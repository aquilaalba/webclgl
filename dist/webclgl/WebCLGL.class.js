(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
(function (global){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.WebCLGL = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*
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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
* Class for parallelization of calculations using the WebGL context similarly to webcl
* @class
* @param {WebGLRenderingContext} [webglcontext=null]
*/
var WebCLGL = exports.WebCLGL = function () {
    function WebCLGL(webglcontext) {
        var _this = this;

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

        var highPrecisionSupport = this._gl.getShaderPrecisionFormat(this._gl.FRAGMENT_SHADER, this._gl.HIGH_FLOAT);
        this._precision = highPrecisionSupport.precision !== 0 ? 'precision highp float;\n\nprecision highp int;\n\n' : 'precision lowp float;\n\nprecision lowp int;\n\n';

        this.version = this._gl instanceof WebGL2RenderingContext ? "#version 300 es \n " : "";

        this._arrExt = this._gl instanceof WebGL2RenderingContext ? { "EXT_color_buffer_float": null } : { "OES_texture_float": null, "OES_texture_float_linear": null, "OES_element_index_uint": null, "WEBGL_draw_buffers": null };
        for (var key in this._arrExt) {
            this._arrExt[key] = this._gl.getExtension(key);
            if (this._arrExt[key] == null) console.error("extension " + key + " not available");else console.log("using extension " + key);
        }

        this.extDrawBuff = this._gl instanceof WebGL2RenderingContext ? "" : " #extension GL_EXT_draw_buffers : require\n";

        this._maxDrawBuffers = 8;
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

        var attrStr = this._gl instanceof WebGL2RenderingContext === true ? "in" : "attribute";
        var varyingOutStr = this._gl instanceof WebGL2RenderingContext === true ? "out" : "varying";
        var varyingInStr = this._gl instanceof WebGL2RenderingContext === true ? "in" : "varying";
        var intFormat = this._gl instanceof WebGL2RenderingContext ? this._gl.RGBA32F : this._gl.RGBA;

        // SHADER READPIXELS
        var sourceVertex = this.version + this._precision + attrStr + ' vec3 aVertexPosition;\n' + varyingOutStr + ' vec2 vCoord;\n' + 'void main(void) {\n' + 'gl_Position = vec4(aVertexPosition, 1.0);\n' + 'vCoord = aVertexPosition.xy*0.5+0.5;\n' + '}\n';
        var sourceFragment = this.version + this._precision + 'uniform sampler2D sampler_buffer;\n' + varyingInStr + 'in vec2 vCoord;\n' + (this._gl instanceof WebGL2RenderingContext ? 'out vec4 fragmentColor;' : "") + 'void main(void) {\n' + (this._gl instanceof WebGL2RenderingContext ? 'fragmentColor = texture(sampler_buffer, vCoord);' : 'gl_FragColor = texture2D(sampler_buffer, vCoord);') + '}\n';

        this.shader_readpixels = this._gl.createProgram();
        this.utils.createShader(this._gl, "CLGLREADPIXELS", sourceVertex, sourceFragment, this.shader_readpixels);

        this.attr_VertexPos = this._gl.getAttribLocation(this.shader_readpixels, "aVertexPosition");
        this.sampler_buffer = this._gl.getUniformLocation(this.shader_readpixels, "sampler_buffer");

        // SHADER COPYTEXTURE
        var lines_drawBuffersWrite = function lines_drawBuffersWrite() {
            var str = '';
            for (var n = 0, fn = _this._maxDrawBuffers; n < fn; n++) {
                str += _this._gl instanceof WebGL2RenderingContext ? 'outCol' + n + ' = texture(uArrayCT[' + n + '], vCoord);\n' : 'gl_FragData[' + n + '] = texture(uArrayCT[' + n + '], vCoord);\n';
            }return str;
        };

        var lines_drawBuffersWriteInit_GL2 = function lines_drawBuffersWriteInit_GL2() {
            var str = '';
            for (var n = 0, fn = _this._maxDrawBuffers; n < fn; n++) {
                str += 'layout(location = ' + n + ') out vec4 outCol' + n + ';\n';
            }return str;
        };

        sourceVertex = this.version + this._precision + attrStr + ' vec3 aVertexPosition;\n' + varyingOutStr + ' vec2 vCoord;\n' + 'void main(void) {\n' + 'gl_Position = vec4(aVertexPosition, 1.0);\n' + 'vCoord = aVertexPosition.xy*0.5+0.5;\n' + '}';
        sourceFragment = this.version + this.extDrawBuff + this._precision + 'uniform sampler2D uArrayCT[' + this._maxDrawBuffers + '];\n' + varyingInStr + ' vec2 vCoord;\n' + (this._gl instanceof WebGL2RenderingContext ? lines_drawBuffersWriteInit_GL2() : "") + 'void main(void) {\n' + lines_drawBuffersWrite() + '}';
        this.shader_copyTexture = this._gl.createProgram();
        this.utils.createShader(this._gl, "CLGLCOPYTEXTURE", sourceVertex, sourceFragment, this.shader_copyTexture);

        this.attr_copyTexture_pos = this._gl.getAttribLocation(this.shader_copyTexture, "aVertexPosition");

        for (var n = 0, fn = this._maxDrawBuffers; n < fn; n++) {
            this.arrayCopyTex[n] = this._gl.getUniformLocation(this.shader_copyTexture, "uArrayCT[" + n + "]");
        }this.textureDataAux = this._gl.createTexture();
        this._gl.bindTexture(this._gl.TEXTURE_2D, this.textureDataAux);
        this._gl.texImage2D(this._gl.TEXTURE_2D, 0, intFormat, 2, 2, 0, this._gl.RGBA, this._gl.FLOAT, new Float32Array([1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1]));
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
                    if (this._gl instanceof WebGL2RenderingContext) {
                        for (var n = 0, fn = webCLGLBuffers.length; n < fn; n++) {
                            if (webCLGLBuffers[n] !== undefined && webCLGLBuffers[n] !== null) {
                                this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl['COLOR_ATTACHMENT' + n], this._gl.TEXTURE_2D, webCLGLBuffers[n].textureData, 0);
                                arrDBuff[n] = this._gl['COLOR_ATTACHMENT' + n];
                            } else arrDBuff[n] = this._gl['NONE'];
                        }
                        this._gl.drawBuffers(arrDBuff);
                    } else {
                        for (var _n = 0, _fn = webCLGLBuffers.length; _n < _fn; _n++) {
                            if (webCLGLBuffers[_n] !== undefined && webCLGLBuffers[_n] !== null) {
                                this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._arrExt["WEBGL_draw_buffers"]['COLOR_ATTACHMENT' + _n + '_WEBGL'], this._gl.TEXTURE_2D, webCLGLBuffers[_n].textureData, 0);
                                arrDBuff[_n] = this._arrExt["WEBGL_draw_buffers"]['COLOR_ATTACHMENT' + _n + '_WEBGL'];
                            } else arrDBuff[_n] = this._gl['NONE'];
                        }
                        this._arrExt["WEBGL_draw_buffers"].drawBuffersWEBGL(arrDBuff);
                    }
                    if (this.checkFramebufferStatus() === true) {
                        this._gl.useProgram(this.shader_copyTexture);

                        for (var _n2 = 0, _fn2 = webCLGLBuffers.length; _n2 < _fn2; _n2++) {
                            this._gl.activeTexture(this._gl["TEXTURE" + _n2]);
                            if (webCLGLBuffers[_n2] !== undefined && webCLGLBuffers[_n2] !== null) this._gl.bindTexture(this._gl.TEXTURE_2D, webCLGLBuffers[_n2].textureDataTemp);else this._gl.bindTexture(this._gl.TEXTURE_2D, this.textureDataAux);
                            this._gl.uniform1i(this.arrayCopyTex[_n2], _n2);
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
            if (this._gl instanceof WebGL2RenderingContext) {
                this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl['COLOR_ATTACHMENT0'], this._gl.TEXTURE_2D, texture, 0);

                var arrDBuff = [this._gl['COLOR_ATTACHMENT0']];
                this._gl.drawBuffers(arrDBuff);
            } else {
                this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._arrExt["WEBGL_draw_buffers"]['COLOR_ATTACHMENT0_WEBGL'], this._gl.TEXTURE_2D, texture, 0);

                var _arrDBuff = [this._arrExt["WEBGL_draw_buffers"]['COLOR_ATTACHMENT0_WEBGL']];
                this._arrExt["WEBGL_draw_buffers"].drawBuffersWEBGL(_arrDBuff);
            }

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

                            if (this._gl instanceof WebGL2RenderingContext) {
                                this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl['COLOR_ATTACHMENT' + n], this._gl.TEXTURE_2D, o, 0);
                                arrDBuff[n] = this._gl['COLOR_ATTACHMENT' + n];
                            } else {
                                this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._arrExt["WEBGL_draw_buffers"]['COLOR_ATTACHMENT' + n + '_WEBGL'], this._gl.TEXTURE_2D, o, 0);
                                arrDBuff[n] = this._arrExt["WEBGL_draw_buffers"]['COLOR_ATTACHMENT' + n + '_WEBGL'];
                            }
                        } else arrDBuff[n] = this._gl['NONE'];
                    }
                    this._gl instanceof WebGL2RenderingContext ? this._gl.drawBuffers(arrDBuff) : this._arrExt["WEBGL_draw_buffers"].drawBuffersWEBGL(arrDBuff);

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
            if (this._gl instanceof WebGL2RenderingContext) {
                this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl['COLOR_ATTACHMENT0'], this._gl.TEXTURE_2D, buffer.textureDataTemp, 0);

                var arrDBuff = [this._gl['COLOR_ATTACHMENT0']];
                this._gl.drawBuffers(arrDBuff);
            } else {
                this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._arrExt["WEBGL_draw_buffers"]['COLOR_ATTACHMENT0_WEBGL'], this._gl.TEXTURE_2D, buffer.textureDataTemp, 0);

                var _arrDBuff2 = [this._arrExt["WEBGL_draw_buffers"]['COLOR_ATTACHMENT0_WEBGL']];
                this._arrExt["WEBGL_draw_buffers"].drawBuffersWEBGL(_arrDBuff2);
            }
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

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

                // WebGL2: GLenum target, GLenum internalformat, GLsizei width, GLsizei height
                var intFormat = this._gl instanceof WebGL2RenderingContext ? this._gl.DEPTH_COMPONENT32F : this._gl.DEPTH_COMPONENT16;

                this._gl.renderbufferStorage(this._gl.RENDERBUFFER, intFormat, this.W, this.H);

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

            // WebGL2
            // texImage2D(enum target, int level, int internalformat, sizei width, sizei height, int border, enum format, enum type, ArrayBufferView srcData, uint srcOffset)
            // texImage2D(enum target, int level, int internalformat, sizei width, sizei height, int border, enum format, enum type, TexImageSource source);
            // texImage2D(enum target, int level, int internalformat, sizei width, sizei height, int border, enum format, enum type, intptr offset);
            var writeTexNow = function (arr) {
                if (arr instanceof HTMLImageElement) {
                    //this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, arr.width, arr.height, 0, this._gl.RGBA, this._gl.UNSIGNED_BYTE, arr);
                    if (this.type === 'FLOAT4') this._gl instanceof WebGL2RenderingContext ? this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA32F, arr.width, arr.height, 0, this._gl.RGBA, this._supportFormat, arr) : this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._supportFormat, arr);
                } else {
                    //this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this.W, this.H, 0, this._gl.RGBA, this._supportFormat, arr, 0);
                    this._gl instanceof WebGL2RenderingContext ? this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA32F, this.W, this.H, 0, this._gl.RGBA, this._supportFormat, arr) : this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this.W, this.H, 0, this._gl.RGBA, this._supportFormat, arr);
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

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _WebCLGLUtils = require('./WebCLGLUtils.class');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

        this.version = this._gl instanceof WebGL2RenderingContext ? "#version 300 es \n " : "";

        this._arrExt = this._gl instanceof WebGL2RenderingContext ? { "EXT_color_buffer_float": null } : { "OES_texture_float": null, "OES_texture_float_linear": null, "OES_element_index_uint": null, "WEBGL_draw_buffers": null };
        for (var key in this._arrExt) {
            this._arrExt[key] = this._gl.getExtension(key);
            if (this._arrExt[key] == null) console.error("extension " + key + " not available");else console.log("using extension " + key);
        }

        this.extDrawBuff = this._gl instanceof WebGL2RenderingContext ? "" : " #extension GL_EXT_draw_buffers : require\n";

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
            var attrStr = this._gl instanceof WebGL2RenderingContext === true ? "in" : "attribute";
            var varyingOutStr = this._gl instanceof WebGL2RenderingContext === true ? "out" : "varying";
            var varyingInStr = this._gl instanceof WebGL2RenderingContext === true ? "in" : "varying";

            var compile = function () {
                var sourceVertex = this.version + this._precision + attrStr + ' vec3 aVertexPosition;\n' + varyingOutStr + ' vec2 global_id;\n' + 'void main(void) {\n' + 'gl_Position = vec4(aVertexPosition, 1.0);\n' + 'global_id = aVertexPosition.xy*0.5+0.5;\n' + '}\n';
                var sourceFragment = this.version + this.extDrawBuff + this._precision + _WebCLGLUtils.WebCLGLUtils.lines_fragment_attrs(this.in_values) + varyingInStr + ' vec2 global_id;\n' + 'uniform float uBufferWidth;' + 'vec2 get_global_id() {\n' + 'return global_id;\n' + '}\n' + _WebCLGLUtils.WebCLGLUtils.get_global_id3_GLSLFunctionString() + _WebCLGLUtils.WebCLGLUtils.get_global_id2_GLSLFunctionString() + this._head + (this._gl instanceof WebGL2RenderingContext ? _WebCLGLUtils.WebCLGLUtils.lines_drawBuffersWriteInit_GL2(8) : "") + 'void main(void) {\n' + _WebCLGLUtils.WebCLGLUtils.lines_drawBuffersInit(8) + this._source + (this._gl instanceof WebGL2RenderingContext ? _WebCLGLUtils.WebCLGLUtils.lines_drawBuffersWrite_GL2(8) : _WebCLGLUtils.WebCLGLUtils.lines_drawBuffersWrite(8)) + '}\n';

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
            this._head = _WebCLGLUtils.WebCLGLUtils.parseSource(this._head, this.in_values, this._gl instanceof WebGL2RenderingContext);

            // parse source
            this._source = source.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
            this._source = this._source.replace(/^\w* \w*\([\w\s\*,]*\) {/gi, '').replace(/}(\s|\t)*$/gi, '');
            this._source = _WebCLGLUtils.WebCLGLUtils.parseSource(this._source, this.in_values, this._gl instanceof WebGL2RenderingContext);

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

},{}],5:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.WebCLGLVertexFragmentProgram = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _WebCLGLUtils = require('./WebCLGLUtils.class');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

        this.version = this._gl instanceof WebGL2RenderingContext ? "#version 300 es \n " : "";

        this._arrExt = this._gl instanceof WebGL2RenderingContext ? { "EXT_color_buffer_float": null } : { "OES_texture_float": null, "OES_texture_float_linear": null, "OES_element_index_uint": null, "WEBGL_draw_buffers": null };
        for (var key in this._arrExt) {
            this._arrExt[key] = this._gl.getExtension(key);
            if (this._arrExt[key] == null) console.error("extension " + key + " not available");else console.log("using extension " + key);
        }

        this.extDrawBuff = this._gl instanceof WebGL2RenderingContext ? "" : " #extension GL_EXT_draw_buffers : require\n";

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
            var sourceVertex = this.version + this._precision + 'uniform float uOffset;\n' + 'uniform float uBufferWidth;' + _WebCLGLUtils.WebCLGLUtils.lines_vertex_attrs(this.in_vertex_values, this._gl instanceof WebGL2RenderingContext) + _WebCLGLUtils.WebCLGLUtils.unpackGLSLFunctionString() + _WebCLGLUtils.WebCLGLUtils.get_global_id3_GLSLFunctionString() + _WebCLGLUtils.WebCLGLUtils.get_global_id2_GLSLFunctionString() + this._vertexHead + 'void main(void) {\n' + this._vertexSource + '}\n';
            var sourceFragment = this.version + this.extDrawBuff + this._precision + _WebCLGLUtils.WebCLGLUtils.lines_fragment_attrs(this.in_fragment_values) + _WebCLGLUtils.WebCLGLUtils.get_global_id3_GLSLFunctionString() + _WebCLGLUtils.WebCLGLUtils.get_global_id2_GLSLFunctionString() + this._fragmentHead + (this._gl instanceof WebGL2RenderingContext ? _WebCLGLUtils.WebCLGLUtils.lines_drawBuffersWriteInit_GL2(8) : "") + 'void main(void) {\n' + _WebCLGLUtils.WebCLGLUtils.lines_drawBuffersInit(8) + this._fragmentSource + (this._gl instanceof WebGL2RenderingContext ? _WebCLGLUtils.WebCLGLUtils.lines_drawBuffersWrite_GL2(8) : _WebCLGLUtils.WebCLGLUtils.lines_drawBuffersWrite(8)) + '}\n';

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
            this._vertexHead = _WebCLGLUtils.WebCLGLUtils.parseSource(this._vertexHead, this.in_vertex_values, this._gl instanceof WebGL2RenderingContext);

            // parse source
            this._vertexSource = vertexSource.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
            this._vertexSource = this._vertexSource.replace(/^\w* \w*\([\w\s\*,]*\) {/gi, '').replace(/}(\s|\t)*$/gi, '');
            this._vertexSource = _WebCLGLUtils.WebCLGLUtils.parseSource(this._vertexSource, this.in_vertex_values, this._gl instanceof WebGL2RenderingContext);

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
            this._fragmentHead = _WebCLGLUtils.WebCLGLUtils.parseSource(this._fragmentHead, this.in_fragment_values, this._gl instanceof WebGL2RenderingContext);

            // parse source
            this._fragmentSource = fragmentSource.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
            this._fragmentSource = this._fragmentSource.replace(/^\w* \w*\([\w\s\*,]*\) {/gi, '').replace(/}(\s|\t)*$/gi, '');
            this._fragmentSource = _WebCLGLUtils.WebCLGLUtils.parseSource(this._fragmentSource, this.in_fragment_values, this._gl instanceof WebGL2RenderingContext);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvd2ViY2xnbC9XZWJDTEdMLmNsYXNzLmpzIiwic3JjL3dlYmNsZ2wvV2ViQ0xHTEJ1ZmZlci5jbGFzcy5qcyIsInNyYy93ZWJjbGdsL1dlYkNMR0xLZXJuZWwuY2xhc3MuanMiLCJzcmMvd2ViY2xnbC9XZWJDTEdMVXRpbHMuY2xhc3MuanMiLCJzcmMvd2ViY2xnbC9XZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtLmNsYXNzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUM1akJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDcFBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNsSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDdmRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9cmV0dXJuIGV9KSgpIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuV2ViQ0xHTCA9IHVuZGVmaW5lZDtcblxudmFyIF9jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0oKTsgLypcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDb3B5cmlnaHQgKGMpIDwyMDEzPiA8Um9iZXJ0byBHb256YWxlei4gaHR0cDovL3N0b3JtY29sb3VyLmFwcHNwb3QuY29tLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVEhFIFNPRlRXQVJFLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICovXG5cbnZhciBfV2ViQ0xHTEJ1ZmZlciA9IHJlcXVpcmUoXCIuL1dlYkNMR0xCdWZmZXIuY2xhc3NcIik7XG5cbnZhciBfV2ViQ0xHTEtlcm5lbCA9IHJlcXVpcmUoXCIuL1dlYkNMR0xLZXJuZWwuY2xhc3NcIik7XG5cbnZhciBfV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbSA9IHJlcXVpcmUoXCIuL1dlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0uY2xhc3NcIik7XG5cbnZhciBfV2ViQ0xHTFV0aWxzID0gcmVxdWlyZShcIi4vV2ViQ0xHTFV0aWxzLmNsYXNzXCIpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG4vKipcclxuKiBDbGFzcyBmb3IgcGFyYWxsZWxpemF0aW9uIG9mIGNhbGN1bGF0aW9ucyB1c2luZyB0aGUgV2ViR0wgY29udGV4dCBzaW1pbGFybHkgdG8gd2ViY2xcclxuKiBAY2xhc3NcclxuKiBAcGFyYW0ge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gW3dlYmdsY29udGV4dD1udWxsXVxyXG4qL1xudmFyIFdlYkNMR0wgPSBleHBvcnRzLldlYkNMR0wgPSBmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gV2ViQ0xHTCh3ZWJnbGNvbnRleHQpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgV2ViQ0xHTCk7XG5cbiAgICAgICAgdGhpcy51dGlscyA9IG5ldyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscygpO1xuXG4gICAgICAgIHRoaXMuX2dsID0gbnVsbDtcbiAgICAgICAgdGhpcy5lID0gbnVsbDtcbiAgICAgICAgaWYgKHdlYmdsY29udGV4dCA9PT0gdW5kZWZpbmVkIHx8IHdlYmdsY29udGV4dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgICAgICB0aGlzLmUud2lkdGggPSAzMjtcbiAgICAgICAgICAgIHRoaXMuZS5oZWlnaHQgPSAzMjtcbiAgICAgICAgICAgIHRoaXMuX2dsID0gX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuZ2V0V2ViR0xDb250ZXh0RnJvbUNhbnZhcyh0aGlzLmUsIHsgYW50aWFsaWFzOiBmYWxzZSB9KTtcbiAgICAgICAgfSBlbHNlIHRoaXMuX2dsID0gd2ViZ2xjb250ZXh0O1xuXG4gICAgICAgIHZhciBoaWdoUHJlY2lzaW9uU3VwcG9ydCA9IHRoaXMuX2dsLmdldFNoYWRlclByZWNpc2lvbkZvcm1hdCh0aGlzLl9nbC5GUkFHTUVOVF9TSEFERVIsIHRoaXMuX2dsLkhJR0hfRkxPQVQpO1xuICAgICAgICB0aGlzLl9wcmVjaXNpb24gPSBoaWdoUHJlY2lzaW9uU3VwcG9ydC5wcmVjaXNpb24gIT09IDAgPyAncHJlY2lzaW9uIGhpZ2hwIGZsb2F0O1xcblxcbnByZWNpc2lvbiBoaWdocCBpbnQ7XFxuXFxuJyA6ICdwcmVjaXNpb24gbG93cCBmbG9hdDtcXG5cXG5wcmVjaXNpb24gbG93cCBpbnQ7XFxuXFxuJztcblxuICAgICAgICB0aGlzLnZlcnNpb24gPSB0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgPyBcIiN2ZXJzaW9uIDMwMCBlcyBcXG4gXCIgOiBcIlwiO1xuXG4gICAgICAgIHRoaXMuX2FyckV4dCA9IHRoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCA/IHsgXCJFWFRfY29sb3JfYnVmZmVyX2Zsb2F0XCI6IG51bGwgfSA6IHsgXCJPRVNfdGV4dHVyZV9mbG9hdFwiOiBudWxsLCBcIk9FU190ZXh0dXJlX2Zsb2F0X2xpbmVhclwiOiBudWxsLCBcIk9FU19lbGVtZW50X2luZGV4X3VpbnRcIjogbnVsbCwgXCJXRUJHTF9kcmF3X2J1ZmZlcnNcIjogbnVsbCB9O1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5fYXJyRXh0KSB7XG4gICAgICAgICAgICB0aGlzLl9hcnJFeHRba2V5XSA9IHRoaXMuX2dsLmdldEV4dGVuc2lvbihrZXkpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2FyckV4dFtrZXldID09IG51bGwpIGNvbnNvbGUuZXJyb3IoXCJleHRlbnNpb24gXCIgKyBrZXkgKyBcIiBub3QgYXZhaWxhYmxlXCIpO2Vsc2UgY29uc29sZS5sb2coXCJ1c2luZyBleHRlbnNpb24gXCIgKyBrZXkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5leHREcmF3QnVmZiA9IHRoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCA/IFwiXCIgOiBcIiAjZXh0ZW5zaW9uIEdMX0VYVF9kcmF3X2J1ZmZlcnMgOiByZXF1aXJlXFxuXCI7XG5cbiAgICAgICAgdGhpcy5fbWF4RHJhd0J1ZmZlcnMgPSA4O1xuICAgICAgICB0aGlzLl9jdXJyZW50VGV4dHVyZVVuaXQgPSAwO1xuICAgICAgICB0aGlzLl9idWZmZXJXaWR0aCA9IDA7XG5cbiAgICAgICAgLy8gUVVBRFxuICAgICAgICB2YXIgbWVzaCA9IHRoaXMudXRpbHMubG9hZFF1YWQodW5kZWZpbmVkLCAxLjAsIDEuMCk7XG4gICAgICAgIHRoaXMudmVydGV4QnVmZmVyX1FVQUQgPSB0aGlzLl9nbC5jcmVhdGVCdWZmZXIoKTtcbiAgICAgICAgdGhpcy5fZ2wuYmluZEJ1ZmZlcih0aGlzLl9nbC5BUlJBWV9CVUZGRVIsIHRoaXMudmVydGV4QnVmZmVyX1FVQUQpO1xuICAgICAgICB0aGlzLl9nbC5idWZmZXJEYXRhKHRoaXMuX2dsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheShtZXNoLnZlcnRleEFycmF5KSwgdGhpcy5fZ2wuU1RBVElDX0RSQVcpO1xuICAgICAgICB0aGlzLmluZGV4QnVmZmVyX1FVQUQgPSB0aGlzLl9nbC5jcmVhdGVCdWZmZXIoKTtcbiAgICAgICAgdGhpcy5fZ2wuYmluZEJ1ZmZlcih0aGlzLl9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgdGhpcy5pbmRleEJ1ZmZlcl9RVUFEKTtcbiAgICAgICAgdGhpcy5fZ2wuYnVmZmVyRGF0YSh0aGlzLl9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbmV3IFVpbnQxNkFycmF5KG1lc2guaW5kZXhBcnJheSksIHRoaXMuX2dsLlNUQVRJQ19EUkFXKTtcblxuICAgICAgICB0aGlzLmFycmF5Q29weVRleCA9IFtdO1xuXG4gICAgICAgIHZhciBhdHRyU3RyID0gdGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0ID09PSB0cnVlID8gXCJpblwiIDogXCJhdHRyaWJ1dGVcIjtcbiAgICAgICAgdmFyIHZhcnlpbmdPdXRTdHIgPSB0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgPT09IHRydWUgPyBcIm91dFwiIDogXCJ2YXJ5aW5nXCI7XG4gICAgICAgIHZhciB2YXJ5aW5nSW5TdHIgPSB0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgPT09IHRydWUgPyBcImluXCIgOiBcInZhcnlpbmdcIjtcbiAgICAgICAgdmFyIGludEZvcm1hdCA9IHRoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCA/IHRoaXMuX2dsLlJHQkEzMkYgOiB0aGlzLl9nbC5SR0JBO1xuXG4gICAgICAgIC8vIFNIQURFUiBSRUFEUElYRUxTXG4gICAgICAgIHZhciBzb3VyY2VWZXJ0ZXggPSB0aGlzLnZlcnNpb24gKyB0aGlzLl9wcmVjaXNpb24gKyBhdHRyU3RyICsgJyB2ZWMzIGFWZXJ0ZXhQb3NpdGlvbjtcXG4nICsgdmFyeWluZ091dFN0ciArICcgdmVjMiB2Q29vcmQ7XFxuJyArICd2b2lkIG1haW4odm9pZCkge1xcbicgKyAnZ2xfUG9zaXRpb24gPSB2ZWM0KGFWZXJ0ZXhQb3NpdGlvbiwgMS4wKTtcXG4nICsgJ3ZDb29yZCA9IGFWZXJ0ZXhQb3NpdGlvbi54eSowLjUrMC41O1xcbicgKyAnfVxcbic7XG4gICAgICAgIHZhciBzb3VyY2VGcmFnbWVudCA9IHRoaXMudmVyc2lvbiArIHRoaXMuX3ByZWNpc2lvbiArICd1bmlmb3JtIHNhbXBsZXIyRCBzYW1wbGVyX2J1ZmZlcjtcXG4nICsgdmFyeWluZ0luU3RyICsgJ2luIHZlYzIgdkNvb3JkO1xcbicgKyAodGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0ID8gJ291dCB2ZWM0IGZyYWdtZW50Q29sb3I7JyA6IFwiXCIpICsgJ3ZvaWQgbWFpbih2b2lkKSB7XFxuJyArICh0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgPyAnZnJhZ21lbnRDb2xvciA9IHRleHR1cmUoc2FtcGxlcl9idWZmZXIsIHZDb29yZCk7JyA6ICdnbF9GcmFnQ29sb3IgPSB0ZXh0dXJlMkQoc2FtcGxlcl9idWZmZXIsIHZDb29yZCk7JykgKyAnfVxcbic7XG5cbiAgICAgICAgdGhpcy5zaGFkZXJfcmVhZHBpeGVscyA9IHRoaXMuX2dsLmNyZWF0ZVByb2dyYW0oKTtcbiAgICAgICAgdGhpcy51dGlscy5jcmVhdGVTaGFkZXIodGhpcy5fZ2wsIFwiQ0xHTFJFQURQSVhFTFNcIiwgc291cmNlVmVydGV4LCBzb3VyY2VGcmFnbWVudCwgdGhpcy5zaGFkZXJfcmVhZHBpeGVscyk7XG5cbiAgICAgICAgdGhpcy5hdHRyX1ZlcnRleFBvcyA9IHRoaXMuX2dsLmdldEF0dHJpYkxvY2F0aW9uKHRoaXMuc2hhZGVyX3JlYWRwaXhlbHMsIFwiYVZlcnRleFBvc2l0aW9uXCIpO1xuICAgICAgICB0aGlzLnNhbXBsZXJfYnVmZmVyID0gdGhpcy5fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMuc2hhZGVyX3JlYWRwaXhlbHMsIFwic2FtcGxlcl9idWZmZXJcIik7XG5cbiAgICAgICAgLy8gU0hBREVSIENPUFlURVhUVVJFXG4gICAgICAgIHZhciBsaW5lc19kcmF3QnVmZmVyc1dyaXRlID0gZnVuY3Rpb24gbGluZXNfZHJhd0J1ZmZlcnNXcml0ZSgpIHtcbiAgICAgICAgICAgIHZhciBzdHIgPSAnJztcbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmbiA9IF90aGlzLl9tYXhEcmF3QnVmZmVyczsgbiA8IGZuOyBuKyspIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0gX3RoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCA/ICdvdXRDb2wnICsgbiArICcgPSB0ZXh0dXJlKHVBcnJheUNUWycgKyBuICsgJ10sIHZDb29yZCk7XFxuJyA6ICdnbF9GcmFnRGF0YVsnICsgbiArICddID0gdGV4dHVyZSh1QXJyYXlDVFsnICsgbiArICddLCB2Q29vcmQpO1xcbic7XG4gICAgICAgICAgICB9cmV0dXJuIHN0cjtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgbGluZXNfZHJhd0J1ZmZlcnNXcml0ZUluaXRfR0wyID0gZnVuY3Rpb24gbGluZXNfZHJhd0J1ZmZlcnNXcml0ZUluaXRfR0wyKCkge1xuICAgICAgICAgICAgdmFyIHN0ciA9ICcnO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGZuID0gX3RoaXMuX21heERyYXdCdWZmZXJzOyBuIDwgZm47IG4rKykge1xuICAgICAgICAgICAgICAgIHN0ciArPSAnbGF5b3V0KGxvY2F0aW9uID0gJyArIG4gKyAnKSBvdXQgdmVjNCBvdXRDb2wnICsgbiArICc7XFxuJztcbiAgICAgICAgICAgIH1yZXR1cm4gc3RyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHNvdXJjZVZlcnRleCA9IHRoaXMudmVyc2lvbiArIHRoaXMuX3ByZWNpc2lvbiArIGF0dHJTdHIgKyAnIHZlYzMgYVZlcnRleFBvc2l0aW9uO1xcbicgKyB2YXJ5aW5nT3V0U3RyICsgJyB2ZWMyIHZDb29yZDtcXG4nICsgJ3ZvaWQgbWFpbih2b2lkKSB7XFxuJyArICdnbF9Qb3NpdGlvbiA9IHZlYzQoYVZlcnRleFBvc2l0aW9uLCAxLjApO1xcbicgKyAndkNvb3JkID0gYVZlcnRleFBvc2l0aW9uLnh5KjAuNSswLjU7XFxuJyArICd9JztcbiAgICAgICAgc291cmNlRnJhZ21lbnQgPSB0aGlzLnZlcnNpb24gKyB0aGlzLmV4dERyYXdCdWZmICsgdGhpcy5fcHJlY2lzaW9uICsgJ3VuaWZvcm0gc2FtcGxlcjJEIHVBcnJheUNUWycgKyB0aGlzLl9tYXhEcmF3QnVmZmVycyArICddO1xcbicgKyB2YXJ5aW5nSW5TdHIgKyAnIHZlYzIgdkNvb3JkO1xcbicgKyAodGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0ID8gbGluZXNfZHJhd0J1ZmZlcnNXcml0ZUluaXRfR0wyKCkgOiBcIlwiKSArICd2b2lkIG1haW4odm9pZCkge1xcbicgKyBsaW5lc19kcmF3QnVmZmVyc1dyaXRlKCkgKyAnfSc7XG4gICAgICAgIHRoaXMuc2hhZGVyX2NvcHlUZXh0dXJlID0gdGhpcy5fZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuICAgICAgICB0aGlzLnV0aWxzLmNyZWF0ZVNoYWRlcih0aGlzLl9nbCwgXCJDTEdMQ09QWVRFWFRVUkVcIiwgc291cmNlVmVydGV4LCBzb3VyY2VGcmFnbWVudCwgdGhpcy5zaGFkZXJfY29weVRleHR1cmUpO1xuXG4gICAgICAgIHRoaXMuYXR0cl9jb3B5VGV4dHVyZV9wb3MgPSB0aGlzLl9nbC5nZXRBdHRyaWJMb2NhdGlvbih0aGlzLnNoYWRlcl9jb3B5VGV4dHVyZSwgXCJhVmVydGV4UG9zaXRpb25cIik7XG5cbiAgICAgICAgZm9yICh2YXIgbiA9IDAsIGZuID0gdGhpcy5fbWF4RHJhd0J1ZmZlcnM7IG4gPCBmbjsgbisrKSB7XG4gICAgICAgICAgICB0aGlzLmFycmF5Q29weVRleFtuXSA9IHRoaXMuX2dsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnNoYWRlcl9jb3B5VGV4dHVyZSwgXCJ1QXJyYXlDVFtcIiArIG4gKyBcIl1cIik7XG4gICAgICAgIH10aGlzLnRleHR1cmVEYXRhQXV4ID0gdGhpcy5fZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICAgICAgICB0aGlzLl9nbC5iaW5kVGV4dHVyZSh0aGlzLl9nbC5URVhUVVJFXzJELCB0aGlzLnRleHR1cmVEYXRhQXV4KTtcbiAgICAgICAgdGhpcy5fZ2wudGV4SW1hZ2UyRCh0aGlzLl9nbC5URVhUVVJFXzJELCAwLCBpbnRGb3JtYXQsIDIsIDIsIDAsIHRoaXMuX2dsLlJHQkEsIHRoaXMuX2dsLkZMT0FULCBuZXcgRmxvYXQzMkFycmF5KFsxLCAwLCAwLCAxLCAwLCAxLCAwLCAxLCAwLCAwLCAxLCAxLCAxLCAxLCAxLCAxXSkpO1xuICAgICAgICB0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgdGhpcy5fZ2wuTkVBUkVTVCk7XG4gICAgICAgIHRoaXMuX2dsLnRleFBhcmFtZXRlcmkodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy5fZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCB0aGlzLl9nbC5ORUFSRVNUKTtcbiAgICAgICAgdGhpcy5fZ2wudGV4UGFyYW1ldGVyaSh0aGlzLl9nbC5URVhUVVJFXzJELCB0aGlzLl9nbC5URVhUVVJFX1dSQVBfUywgdGhpcy5fZ2wuQ0xBTVBfVE9fRURHRSk7XG4gICAgICAgIHRoaXMuX2dsLnRleFBhcmFtZXRlcmkodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy5fZ2wuVEVYVFVSRV9XUkFQX1QsIHRoaXMuX2dsLkNMQU1QX1RPX0VER0UpO1xuICAgICAgICB0aGlzLl9nbC5iaW5kVGV4dHVyZSh0aGlzLl9nbC5URVhUVVJFXzJELCBudWxsKTtcbiAgICB9XG5cbiAgICAvKipcclxuICAgICAqIGdldENvbnRleHRcclxuICAgICAqIEByZXR1cm5zIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9XHJcbiAgICAgKi9cblxuXG4gICAgX2NyZWF0ZUNsYXNzKFdlYkNMR0wsIFt7XG4gICAgICAgIGtleTogXCJnZXRDb250ZXh0XCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRDb250ZXh0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2dsO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZ2V0TWF4RHJhd0J1ZmZlcnNcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIGdldE1heERyYXdCdWZmZXJzXHJcbiAgICAgICAgICogQHJldHVybnMge2ludH1cclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldE1heERyYXdCdWZmZXJzKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21heERyYXdCdWZmZXJzO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY2hlY2tGcmFtZWJ1ZmZlclN0YXR1c1wiLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogY2hlY2tGcmFtZWJ1ZmZlclN0YXR1c1xyXG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY2hlY2tGcmFtZWJ1ZmZlclN0YXR1cygpIHtcbiAgICAgICAgICAgIHZhciBzdGEgPSB0aGlzLl9nbC5jaGVja0ZyYW1lYnVmZmVyU3RhdHVzKHRoaXMuX2dsLkZSQU1FQlVGRkVSKTtcbiAgICAgICAgICAgIHZhciBmZXJyb3JzID0ge307XG4gICAgICAgICAgICBmZXJyb3JzW3RoaXMuX2dsLkZSQU1FQlVGRkVSX0NPTVBMRVRFXSA9IHRydWU7XG4gICAgICAgICAgICBmZXJyb3JzW3RoaXMuX2dsLkZSQU1FQlVGRkVSX0lOQ09NUExFVEVfQVRUQUNITUVOVF0gPSBcIkZSQU1FQlVGRkVSX0lOQ09NUExFVEVfQVRUQUNITUVOVDogVGhlIGF0dGFjaG1lbnQgdHlwZXMgYXJlIG1pc21hdGNoZWQgb3Igbm90IGFsbCBmcmFtZWJ1ZmZlciBhdHRhY2htZW50IHBvaW50cyBhcmUgZnJhbWVidWZmZXIgYXR0YWNobWVudCBjb21wbGV0ZVwiO1xuICAgICAgICAgICAgZmVycm9yc1t0aGlzLl9nbC5GUkFNRUJVRkZFUl9JTkNPTVBMRVRFX01JU1NJTkdfQVRUQUNITUVOVF0gPSBcIkZSQU1FQlVGRkVSX0lOQ09NUExFVEVfTUlTU0lOR19BVFRBQ0hNRU5UOiBUaGVyZSBpcyBubyBhdHRhY2htZW50XCI7XG4gICAgICAgICAgICBmZXJyb3JzW3RoaXMuX2dsLkZSQU1FQlVGRkVSX0lOQ09NUExFVEVfRElNRU5TSU9OU10gPSBcIkZSQU1FQlVGRkVSX0lOQ09NUExFVEVfRElNRU5TSU9OUzogSGVpZ2h0IGFuZCB3aWR0aCBvZiB0aGUgYXR0YWNobWVudCBhcmUgbm90IHRoZSBzYW1lXCI7XG4gICAgICAgICAgICBmZXJyb3JzW3RoaXMuX2dsLkZSQU1FQlVGRkVSX1VOU1VQUE9SVEVEXSA9IFwiRlJBTUVCVUZGRVJfVU5TVVBQT1JURUQ6IFRoZSBmb3JtYXQgb2YgdGhlIGF0dGFjaG1lbnQgaXMgbm90IHN1cHBvcnRlZCBvciBpZiBkZXB0aCBhbmQgc3RlbmNpbCBhdHRhY2htZW50cyBhcmUgbm90IHRoZSBzYW1lIHJlbmRlcmJ1ZmZlclwiO1xuICAgICAgICAgICAgaWYgKGZlcnJvcnNbc3RhXSAhPT0gdHJ1ZSB8fCBmZXJyb3JzW3N0YV0gPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhmZXJyb3JzW3N0YV0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY29weVwiLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogY29weVxyXG4gICAgICAgICAqIEBwYXJhbSB7V2ViQ0xHTEtlcm5lbHxXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtfSBwZ3JcclxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5PFdlYkNMR0xCdWZmZXI+fSBbd2ViQ0xHTEJ1ZmZlcnM9bnVsbF1cclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNvcHkocGdyLCB3ZWJDTEdMQnVmZmVycykge1xuICAgICAgICAgICAgaWYgKHdlYkNMR0xCdWZmZXJzICE9PSB1bmRlZmluZWQgJiYgd2ViQ0xHTEJ1ZmZlcnMgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAod2ViQ0xHTEJ1ZmZlcnNbMF0gIT09IHVuZGVmaW5lZCAmJiB3ZWJDTEdMQnVmZmVyc1swXSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbC52aWV3cG9ydCgwLCAwLCB3ZWJDTEdMQnVmZmVyc1swXS5XLCB3ZWJDTEdMQnVmZmVyc1swXS5IKTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kRnJhbWVidWZmZXIodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIHdlYkNMR0xCdWZmZXJzWzBdLmZCdWZmZXIpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJyREJ1ZmYgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGZuID0gd2ViQ0xHTEJ1ZmZlcnMubGVuZ3RoOyBuIDwgZm47IG4rKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3ZWJDTEdMQnVmZmVyc1tuXSAhPT0gdW5kZWZpbmVkICYmIHdlYkNMR0xCdWZmZXJzW25dICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCB0aGlzLl9nbFsnQ09MT1JfQVRUQUNITUVOVCcgKyBuXSwgdGhpcy5fZ2wuVEVYVFVSRV8yRCwgd2ViQ0xHTEJ1ZmZlcnNbbl0udGV4dHVyZURhdGEsIDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnJEQnVmZltuXSA9IHRoaXMuX2dsWydDT0xPUl9BVFRBQ0hNRU5UJyArIG5dO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBhcnJEQnVmZltuXSA9IHRoaXMuX2dsWydOT05FJ107XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbC5kcmF3QnVmZmVycyhhcnJEQnVmZik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBfbiA9IDAsIF9mbiA9IHdlYkNMR0xCdWZmZXJzLmxlbmd0aDsgX24gPCBfZm47IF9uKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAod2ViQ0xHTEJ1ZmZlcnNbX25dICE9PSB1bmRlZmluZWQgJiYgd2ViQ0xHTEJ1ZmZlcnNbX25dICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCB0aGlzLl9hcnJFeHRbXCJXRUJHTF9kcmF3X2J1ZmZlcnNcIl1bJ0NPTE9SX0FUVEFDSE1FTlQnICsgX24gKyAnX1dFQkdMJ10sIHRoaXMuX2dsLlRFWFRVUkVfMkQsIHdlYkNMR0xCdWZmZXJzW19uXS50ZXh0dXJlRGF0YSwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyckRCdWZmW19uXSA9IHRoaXMuX2FyckV4dFtcIldFQkdMX2RyYXdfYnVmZmVyc1wiXVsnQ09MT1JfQVRUQUNITUVOVCcgKyBfbiArICdfV0VCR0wnXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgYXJyREJ1ZmZbX25dID0gdGhpcy5fZ2xbJ05PTkUnXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2FyckV4dFtcIldFQkdMX2RyYXdfYnVmZmVyc1wiXS5kcmF3QnVmZmVyc1dFQkdMKGFyckRCdWZmKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5jaGVja0ZyYW1lYnVmZmVyU3RhdHVzKCkgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLnVzZVByb2dyYW0odGhpcy5zaGFkZXJfY29weVRleHR1cmUpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBfbjIgPSAwLCBfZm4yID0gd2ViQ0xHTEJ1ZmZlcnMubGVuZ3RoOyBfbjIgPCBfZm4yOyBfbjIrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLmFjdGl2ZVRleHR1cmUodGhpcy5fZ2xbXCJURVhUVVJFXCIgKyBfbjJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAod2ViQ0xHTEJ1ZmZlcnNbX24yXSAhPT0gdW5kZWZpbmVkICYmIHdlYkNMR0xCdWZmZXJzW19uMl0gIT09IG51bGwpIHRoaXMuX2dsLmJpbmRUZXh0dXJlKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHdlYkNMR0xCdWZmZXJzW19uMl0udGV4dHVyZURhdGFUZW1wKTtlbHNlIHRoaXMuX2dsLmJpbmRUZXh0dXJlKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMudGV4dHVyZURhdGFBdXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLnVuaWZvcm0xaSh0aGlzLmFycmF5Q29weVRleFtfbjJdLCBfbjIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvcHlOb3cod2ViQ0xHTEJ1ZmZlcnMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEZyYW1lYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgdGhpcy5fZ2wuYmluZEZyYW1lYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCBudWxsKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImNvcHlOb3dcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNvcHlOb3cod2ViQ0xHTEJ1ZmZlcnMpIHtcbiAgICAgICAgICAgIHRoaXMuX2dsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHRoaXMuYXR0cl9jb3B5VGV4dHVyZV9wb3MpO1xuICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEJ1ZmZlcih0aGlzLl9nbC5BUlJBWV9CVUZGRVIsIHRoaXMudmVydGV4QnVmZmVyX1FVQUQpO1xuICAgICAgICAgICAgdGhpcy5fZ2wudmVydGV4QXR0cmliUG9pbnRlcih0aGlzLmF0dHJfY29weVRleHR1cmVfcG9zLCAzLCB0aGlzLl9nbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuXG4gICAgICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCB0aGlzLmluZGV4QnVmZmVyX1FVQUQpO1xuICAgICAgICAgICAgdGhpcy5fZ2wuZHJhd0VsZW1lbnRzKHRoaXMuX2dsLlRSSUFOR0xFUywgNiwgdGhpcy5fZ2wuVU5TSUdORURfU0hPUlQsIDApO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY3JlYXRlQnVmZmVyXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBDcmVhdGUgYSBlbXB0eSBXZWJDTEdMQnVmZmVyXHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IFt0eXBlPVwiRkxPQVRcIl0gdHlwZSBGTE9BVDQgT1IgRkxPQVRcclxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtsaW5lYXI9ZmFsc2VdIGxpbmVhciB0ZXhQYXJhbWV0ZXJpIHR5cGUgZm9yIHRoZSBXZWJHTFRleHR1cmVcclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gW21vZGU9XCJTQU1QTEVSXCJdIE1vZGUgZm9yIHRoaXMgYnVmZmVyLiBcIlNBTVBMRVJcIiwgXCJBVFRSSUJVVEVcIiwgXCJWRVJURVhfSU5ERVhcIlxyXG4gICAgICAgICAqIEByZXR1cm5zIHtXZWJDTEdMQnVmZmVyfVxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlQnVmZmVyKHR5cGUsIGxpbmVhciwgbW9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBfV2ViQ0xHTEJ1ZmZlci5XZWJDTEdMQnVmZmVyKHRoaXMuX2dsLCB0eXBlLCBsaW5lYXIsIG1vZGUpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY3JlYXRlS2VybmVsXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBDcmVhdGUgYSBrZXJuZWxcclxuICAgICAgICAgKiBAcmV0dXJucyB7V2ViQ0xHTEtlcm5lbH1cclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gW3NvdXJjZT11bmRlZmluZWRdXHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IFtoZWFkZXI9dW5kZWZpbmVkXSBBZGRpdGlvbmFsIGZ1bmN0aW9uc1xyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlS2VybmVsKHNvdXJjZSwgaGVhZGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IF9XZWJDTEdMS2VybmVsLldlYkNMR0xLZXJuZWwodGhpcy5fZ2wsIHNvdXJjZSwgaGVhZGVyKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImNyZWF0ZVZlcnRleEZyYWdtZW50UHJvZ3JhbVwiLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQ3JlYXRlIGEgdmVydGV4IGFuZCBmcmFnbWVudCBwcm9ncmFtcyBmb3IgYSBXZWJHTCBncmFwaGljYWwgcmVwcmVzZW50YXRpb24gYWZ0ZXIgc29tZSBlbnF1ZXVlTkRSYW5nZUtlcm5lbFxyXG4gICAgICAgICAqIEByZXR1cm5zIHtXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtfVxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBbdmVydGV4U291cmNlPXVuZGVmaW5lZF1cclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gW3ZlcnRleEhlYWRlcj11bmRlZmluZWRdXHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IFtmcmFnbWVudFNvdXJjZT11bmRlZmluZWRdXHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IFtmcmFnbWVudEhlYWRlcj11bmRlZmluZWRdXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjcmVhdGVWZXJ0ZXhGcmFnbWVudFByb2dyYW0odmVydGV4U291cmNlLCB2ZXJ0ZXhIZWFkZXIsIGZyYWdtZW50U291cmNlLCBmcmFnbWVudEhlYWRlcikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBfV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbS5XZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtKHRoaXMuX2dsLCB2ZXJ0ZXhTb3VyY2UsIHZlcnRleEhlYWRlciwgZnJhZ21lbnRTb3VyY2UsIGZyYWdtZW50SGVhZGVyKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImZpbGxCdWZmZXJcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIGZpbGxCdWZmZXIgd2l0aCBjb2xvclxyXG4gICAgICAgICAqIEBwYXJhbSB7V2ViR0xUZXh0dXJlfSB0ZXh0dXJlXHJcbiAgICAgICAgICogQHBhcmFtIHtBcnJheTxGbG9hdD59IGNsZWFyQ29sb3JcclxuICAgICAgICAgKiBAcGFyYW0ge1dlYkdMRnJhbWVidWZmZXJ9IGZCdWZmZXJcclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGZpbGxCdWZmZXIodGV4dHVyZSwgY2xlYXJDb2xvciwgZkJ1ZmZlcikge1xuICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEZyYW1lYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCBmQnVmZmVyKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5mcmFtZWJ1ZmZlclRleHR1cmUyRCh0aGlzLl9nbC5GUkFNRUJVRkZFUiwgdGhpcy5fZ2xbJ0NPTE9SX0FUVEFDSE1FTlQwJ10sIHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRleHR1cmUsIDApO1xuXG4gICAgICAgICAgICAgICAgdmFyIGFyckRCdWZmID0gW3RoaXMuX2dsWydDT0xPUl9BVFRBQ0hNRU5UMCddXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5kcmF3QnVmZmVycyhhcnJEQnVmZik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCB0aGlzLl9hcnJFeHRbXCJXRUJHTF9kcmF3X2J1ZmZlcnNcIl1bJ0NPTE9SX0FUVEFDSE1FTlQwX1dFQkdMJ10sIHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRleHR1cmUsIDApO1xuXG4gICAgICAgICAgICAgICAgdmFyIF9hcnJEQnVmZiA9IFt0aGlzLl9hcnJFeHRbXCJXRUJHTF9kcmF3X2J1ZmZlcnNcIl1bJ0NPTE9SX0FUVEFDSE1FTlQwX1dFQkdMJ11dO1xuICAgICAgICAgICAgICAgIHRoaXMuX2FyckV4dFtcIldFQkdMX2RyYXdfYnVmZmVyc1wiXS5kcmF3QnVmZmVyc1dFQkdMKF9hcnJEQnVmZik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjbGVhckNvbG9yICE9PSB1bmRlZmluZWQgJiYgY2xlYXJDb2xvciAhPT0gbnVsbCkgdGhpcy5fZ2wuY2xlYXJDb2xvcihjbGVhckNvbG9yWzBdLCBjbGVhckNvbG9yWzFdLCBjbGVhckNvbG9yWzJdLCBjbGVhckNvbG9yWzNdKTtcbiAgICAgICAgICAgIHRoaXMuX2dsLmNsZWFyKHRoaXMuX2dsLkNPTE9SX0JVRkZFUl9CSVQpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiYmluZEF0dHJpYnV0ZVZhbHVlXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBiaW5kQXR0cmlidXRlVmFsdWVcclxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5WYWx1ZVxyXG4gICAgICAgICAqIEBwYXJhbSB7V2ViQ0xHTEJ1ZmZlcn0gYnVmZlxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gYmluZEF0dHJpYnV0ZVZhbHVlKGluVmFsdWUsIGJ1ZmYpIHtcbiAgICAgICAgICAgIGlmIChidWZmICE9PSB1bmRlZmluZWQgJiYgYnVmZiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmIChpblZhbHVlLnR5cGUgPT09ICdmbG9hdDRfZnJvbUF0dHInKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGluVmFsdWUubG9jYXRpb25bMF0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkFSUkFZX0JVRkZFUiwgYnVmZi52ZXJ0ZXhEYXRhMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLnZlcnRleEF0dHJpYlBvaW50ZXIoaW5WYWx1ZS5sb2NhdGlvblswXSwgNCwgdGhpcy5fZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGluVmFsdWUudHlwZSA9PT0gJ2Zsb2F0X2Zyb21BdHRyJykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShpblZhbHVlLmxvY2F0aW9uWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEJ1ZmZlcih0aGlzLl9nbC5BUlJBWV9CVUZGRVIsIGJ1ZmYudmVydGV4RGF0YTApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKGluVmFsdWUubG9jYXRpb25bMF0sIDEsIHRoaXMuX2dsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHRoaXMuX2dsLmRpc2FibGVWZXJ0ZXhBdHRyaWJBcnJheShpblZhbHVlLmxvY2F0aW9uWzBdKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImJpbmRTYW1wbGVyVmFsdWVcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIGJpbmRTYW1wbGVyVmFsdWVcclxuICAgICAgICAgKiBAcGFyYW0ge1dlYkdMVW5pZm9ybUxvY2F0aW9ufSB1QnVmZmVyV2lkdGhcclxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5WYWx1ZVxyXG4gICAgICAgICAqIEBwYXJhbSB7V2ViQ0xHTEJ1ZmZlcn0gYnVmZlxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gYmluZFNhbXBsZXJWYWx1ZSh1QnVmZmVyV2lkdGgsIGluVmFsdWUsIGJ1ZmYpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9jdXJyZW50VGV4dHVyZVVuaXQgPCAxNikgdGhpcy5fZ2wuYWN0aXZlVGV4dHVyZSh0aGlzLl9nbFtcIlRFWFRVUkVcIiArIHRoaXMuX2N1cnJlbnRUZXh0dXJlVW5pdF0pO2Vsc2UgdGhpcy5fZ2wuYWN0aXZlVGV4dHVyZSh0aGlzLl9nbFtcIlRFWFRVUkUxNlwiXSk7XG5cbiAgICAgICAgICAgIGlmIChidWZmICE9PSB1bmRlZmluZWQgJiYgYnVmZiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRUZXh0dXJlKHRoaXMuX2dsLlRFWFRVUkVfMkQsIGJ1ZmYudGV4dHVyZURhdGEpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2J1ZmZlcldpZHRoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2J1ZmZlcldpZHRoID0gYnVmZi5XO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbC51bmlmb3JtMWYodUJ1ZmZlcldpZHRoLCB0aGlzLl9idWZmZXJXaWR0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHRoaXMuX2dsLmJpbmRUZXh0dXJlKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMudGV4dHVyZURhdGFBdXgpO1xuICAgICAgICAgICAgdGhpcy5fZ2wudW5pZm9ybTFpKGluVmFsdWUubG9jYXRpb25bMF0sIHRoaXMuX2N1cnJlbnRUZXh0dXJlVW5pdCk7XG5cbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRUZXh0dXJlVW5pdCsrO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiYmluZFVuaWZvcm1WYWx1ZVwiLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogYmluZFVuaWZvcm1WYWx1ZVxyXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpblZhbHVlXHJcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMQnVmZmVyfE51bWJlcnxBcnJheTxmbG9hdD59IGJ1ZmZcclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGJpbmRVbmlmb3JtVmFsdWUoaW5WYWx1ZSwgYnVmZikge1xuICAgICAgICAgICAgaWYgKGJ1ZmYgIT09IHVuZGVmaW5lZCAmJiBidWZmICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGluVmFsdWUudHlwZSA9PT0gJ2Zsb2F0Jykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYnVmZi5jb25zdHJ1Y3RvciA9PT0gQXJyYXkpIHRoaXMuX2dsLnVuaWZvcm0xZnYoaW5WYWx1ZS5sb2NhdGlvblswXSwgYnVmZik7ZWxzZSB0aGlzLl9nbC51bmlmb3JtMWYoaW5WYWx1ZS5sb2NhdGlvblswXSwgYnVmZik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpblZhbHVlLnR5cGUgPT09ICdmbG9hdDQnKSB0aGlzLl9nbC51bmlmb3JtNGYoaW5WYWx1ZS5sb2NhdGlvblswXSwgYnVmZlswXSwgYnVmZlsxXSwgYnVmZlsyXSwgYnVmZlszXSk7ZWxzZSBpZiAoaW5WYWx1ZS50eXBlID09PSAnbWF0NCcpIHRoaXMuX2dsLnVuaWZvcm1NYXRyaXg0ZnYoaW5WYWx1ZS5sb2NhdGlvblswXSwgZmFsc2UsIGJ1ZmYpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiYmluZFZhbHVlXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBiaW5kVmFsdWVcclxuICAgICAgICAgKiBAcGFyYW0ge1dlYkNMR0xLZXJuZWx8V2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbX0gd2ViQ0xHTFByb2dyYW1cclxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5WYWx1ZVxyXG4gICAgICAgICAqIEBwYXJhbSB7V2ViQ0xHTEJ1ZmZlcnxmbG9hdHxBcnJheTxmbG9hdD58RmxvYXQzMkFycmF5fFVpbnQ4QXJyYXl9IGFyZ1ZhbHVlXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBiaW5kVmFsdWUod2ViQ0xHTFByb2dyYW0sIGluVmFsdWUsIGFyZ1ZhbHVlKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGluVmFsdWUuZXhwZWN0ZWRNb2RlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkFUVFJJQlVURVwiOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmJpbmRBdHRyaWJ1dGVWYWx1ZShpblZhbHVlLCBhcmdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJTQU1QTEVSXCI6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYmluZFNhbXBsZXJWYWx1ZSh3ZWJDTEdMUHJvZ3JhbS51QnVmZmVyV2lkdGgsIGluVmFsdWUsIGFyZ1ZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlVOSUZPUk1cIjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5iaW5kVW5pZm9ybVZhbHVlKGluVmFsdWUsIGFyZ1ZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJiaW5kRkJcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIGJpbmRGQlxyXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXk8V2ViQ0xHTEJ1ZmZlcj59IFt3ZWJDTEdMQnVmZmVycz1udWxsXVxyXG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gb3V0cHV0VG9UZW1wXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBiaW5kRkIod2ViQ0xHTEJ1ZmZlcnMsIG91dHB1dFRvVGVtcCkge1xuICAgICAgICAgICAgaWYgKHdlYkNMR0xCdWZmZXJzICE9PSB1bmRlZmluZWQgJiYgd2ViQ0xHTEJ1ZmZlcnMgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAod2ViQ0xHTEJ1ZmZlcnNbMF0gIT09IHVuZGVmaW5lZCAmJiB3ZWJDTEdMQnVmZmVyc1swXSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbC52aWV3cG9ydCgwLCAwLCB3ZWJDTEdMQnVmZmVyc1swXS5XLCB3ZWJDTEdMQnVmZmVyc1swXS5IKTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kRnJhbWVidWZmZXIodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIG91dHB1dFRvVGVtcCA9PT0gdHJ1ZSA/IHdlYkNMR0xCdWZmZXJzWzBdLmZCdWZmZXJUZW1wIDogd2ViQ0xHTEJ1ZmZlcnNbMF0uZkJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcnJEQnVmZiA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBuID0gMCwgZm4gPSB3ZWJDTEdMQnVmZmVycy5sZW5ndGg7IG4gPCBmbjsgbisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAod2ViQ0xHTEJ1ZmZlcnNbbl0gIT09IHVuZGVmaW5lZCAmJiB3ZWJDTEdMQnVmZmVyc1tuXSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvID0gb3V0cHV0VG9UZW1wID09PSB0cnVlID8gd2ViQ0xHTEJ1ZmZlcnNbbl0udGV4dHVyZURhdGFUZW1wIDogd2ViQ0xHTEJ1ZmZlcnNbbl0udGV4dHVyZURhdGE7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCB0aGlzLl9nbFsnQ09MT1JfQVRUQUNITUVOVCcgKyBuXSwgdGhpcy5fZ2wuVEVYVFVSRV8yRCwgbywgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyckRCdWZmW25dID0gdGhpcy5fZ2xbJ0NPTE9SX0FUVEFDSE1FTlQnICsgbl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wuZnJhbWVidWZmZXJUZXh0dXJlMkQodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIHRoaXMuX2FyckV4dFtcIldFQkdMX2RyYXdfYnVmZmVyc1wiXVsnQ09MT1JfQVRUQUNITUVOVCcgKyBuICsgJ19XRUJHTCddLCB0aGlzLl9nbC5URVhUVVJFXzJELCBvLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyREJ1ZmZbbl0gPSB0aGlzLl9hcnJFeHRbXCJXRUJHTF9kcmF3X2J1ZmZlcnNcIl1bJ0NPTE9SX0FUVEFDSE1FTlQnICsgbiArICdfV0VCR0wnXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgYXJyREJ1ZmZbbl0gPSB0aGlzLl9nbFsnTk9ORSddO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCA/IHRoaXMuX2dsLmRyYXdCdWZmZXJzKGFyckRCdWZmKSA6IHRoaXMuX2FyckV4dFtcIldFQkdMX2RyYXdfYnVmZmVyc1wiXS5kcmF3QnVmZmVyc1dFQkdMKGFyckRCdWZmKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jaGVja0ZyYW1lYnVmZmVyU3RhdHVzKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEZyYW1lYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kRnJhbWVidWZmZXIodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZW5xdWV1ZU5EUmFuZ2VLZXJuZWxcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFBlcmZvcm0gY2FsY3VsYXRpb24gYW5kIHNhdmUgdGhlIHJlc3VsdCBvbiBhIFdlYkNMR0xCdWZmZXJcclxuICAgICAgICAgKiBAcGFyYW0ge1dlYkNMR0xLZXJuZWx9IHdlYkNMR0xLZXJuZWxcclxuICAgICAgICAgKiBAcGFyYW0ge1dlYkNMR0xCdWZmZXJ8QXJyYXk8V2ViQ0xHTEJ1ZmZlcj59IFt3ZWJDTEdMQnVmZmVyPW51bGxdXHJcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBvdXRwdXRUb1RlbXBcclxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYXJnVmFsdWVzXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBlbnF1ZXVlTkRSYW5nZUtlcm5lbCh3ZWJDTEdMS2VybmVsLCB3ZWJDTEdMQnVmZmVyLCBvdXRwdXRUb1RlbXAsIGFyZ1ZhbHVlcykge1xuICAgICAgICAgICAgdGhpcy5fYnVmZmVyV2lkdGggPSAwO1xuXG4gICAgICAgICAgICB0aGlzLl9nbC51c2VQcm9ncmFtKHdlYkNMR0xLZXJuZWwua2VybmVsKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuYmluZEZCKHdlYkNMR0xCdWZmZXIsIG91dHB1dFRvVGVtcCkgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50VGV4dHVyZVVuaXQgPSAwO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB3ZWJDTEdMS2VybmVsLmluX3ZhbHVlcykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmJpbmRWYWx1ZSh3ZWJDTEdMS2VybmVsLCB3ZWJDTEdMS2VybmVsLmluX3ZhbHVlc1trZXldLCBhcmdWYWx1ZXNba2V5XSk7XG4gICAgICAgICAgICAgICAgfXRoaXMuX2dsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHdlYkNMR0xLZXJuZWwuYXR0cl9WZXJ0ZXhQb3MpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRCdWZmZXIodGhpcy5fZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnZlcnRleEJ1ZmZlcl9RVUFEKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHdlYkNMR0xLZXJuZWwuYXR0cl9WZXJ0ZXhQb3MsIDMsIHRoaXMuX2dsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCB0aGlzLmluZGV4QnVmZmVyX1FVQUQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmRyYXdFbGVtZW50cyh0aGlzLl9nbC5UUklBTkdMRVMsIDYsIHRoaXMuX2dsLlVOU0lHTkVEX1NIT1JULCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImVucXVldWVWZXJ0ZXhGcmFnbWVudFByb2dyYW1cIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFBlcmZvcm0gV2ViR0wgZ3JhcGhpY2FsIHJlcHJlc2VudGF0aW9uXHJcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtfSB3ZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtXHJcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMQnVmZmVyfSBidWZmZXJJbmQgQnVmZmVyIHRvIGRyYXcgdHlwZSAodHlwZSBpbmRpY2VzIG9yIHZlcnRleClcclxuICAgICAgICAgKiBAcGFyYW0ge2ludH0gW2RyYXdNb2RlPTRdIDA9UE9JTlRTLCAzPUxJTkVfU1RSSVAsIDI9TElORV9MT09QLCAxPUxJTkVTLCA1PVRSSUFOR0xFX1NUUklQLCA2PVRSSUFOR0xFX0ZBTiBhbmQgND1UUklBTkdMRVNcclxuICAgICAgICAgKiBAcGFyYW0ge1dlYkNMR0xCdWZmZXJ8QXJyYXk8V2ViQ0xHTEJ1ZmZlcj59IFt3ZWJDTEdMQnVmZmVyPW51bGxdXHJcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBvdXRwdXRUb1RlbXBcclxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gYXJnVmFsdWVzXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBlbnF1ZXVlVmVydGV4RnJhZ21lbnRQcm9ncmFtKHdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0sIGJ1ZmZlckluZCwgZHJhd01vZGUsIHdlYkNMR0xCdWZmZXIsIG91dHB1dFRvVGVtcCwgYXJnVmFsdWVzKSB7XG4gICAgICAgICAgICB0aGlzLl9idWZmZXJXaWR0aCA9IDA7XG5cbiAgICAgICAgICAgIHRoaXMuX2dsLnVzZVByb2dyYW0od2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbS52ZXJ0ZXhGcmFnbWVudFByb2dyYW0pO1xuXG4gICAgICAgICAgICB2YXIgRG1vZGUgPSBkcmF3TW9kZSAhPT0gdW5kZWZpbmVkICYmIGRyYXdNb2RlICE9PSBudWxsID8gZHJhd01vZGUgOiA0O1xuXG4gICAgICAgICAgICBpZiAodGhpcy5iaW5kRkIod2ViQ0xHTEJ1ZmZlciwgb3V0cHV0VG9UZW1wKSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIGlmIChidWZmZXJJbmQgIT09IHVuZGVmaW5lZCAmJiBidWZmZXJJbmQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudFRleHR1cmVVbml0ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0uaW5fdmVydGV4X3ZhbHVlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5iaW5kVmFsdWUod2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbSwgd2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbS5pbl92ZXJ0ZXhfdmFsdWVzW2tleV0sIGFyZ1ZhbHVlc1trZXldKTtcbiAgICAgICAgICAgICAgICAgICAgfWZvciAodmFyIF9rZXkgaW4gd2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbS5pbl9mcmFnbWVudF92YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYmluZFZhbHVlKHdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0sIHdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0uaW5fZnJhZ21lbnRfdmFsdWVzW19rZXldLCBhcmdWYWx1ZXNbX2tleV0pO1xuICAgICAgICAgICAgICAgICAgICB9aWYgKGJ1ZmZlckluZC5tb2RlID09PSBcIlZFUlRFWF9JTkRFWFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBidWZmZXJJbmQudmVydGV4RGF0YTApO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wuZHJhd0VsZW1lbnRzKERtb2RlLCBidWZmZXJJbmQubGVuZ3RoLCB0aGlzLl9nbC5VTlNJR05FRF9TSE9SVCwgMCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB0aGlzLl9nbC5kcmF3QXJyYXlzKERtb2RlLCAwLCBidWZmZXJJbmQubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJyZWFkQnVmZmVyXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBHZXQgRmxvYXQzMkFycmF5IGFycmF5IGZyb20gYSBXZWJDTEdMQnVmZmVyXHJcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMQnVmZmVyfSBidWZmZXJcclxuICAgICAgICAgKiBAcmV0dXJucyB7RmxvYXQzMkFycmF5fVxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcmVhZEJ1ZmZlcihidWZmZXIpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmUgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmUud2lkdGggPSBidWZmZXIuVztcbiAgICAgICAgICAgICAgICB0aGlzLmUuaGVpZ2h0ID0gYnVmZmVyLkg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX2dsLnVzZVByb2dyYW0odGhpcy5zaGFkZXJfcmVhZHBpeGVscyk7XG5cbiAgICAgICAgICAgIHRoaXMuX2dsLnZpZXdwb3J0KDAsIDAsIGJ1ZmZlci5XLCBidWZmZXIuSCk7XG4gICAgICAgICAgICB0aGlzLl9nbC5iaW5kRnJhbWVidWZmZXIodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIGJ1ZmZlci5mQnVmZmVyVGVtcCk7XG4gICAgICAgICAgICBpZiAodGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuZnJhbWVidWZmZXJUZXh0dXJlMkQodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIHRoaXMuX2dsWydDT0xPUl9BVFRBQ0hNRU5UMCddLCB0aGlzLl9nbC5URVhUVVJFXzJELCBidWZmZXIudGV4dHVyZURhdGFUZW1wLCAwKTtcblxuICAgICAgICAgICAgICAgIHZhciBhcnJEQnVmZiA9IFt0aGlzLl9nbFsnQ09MT1JfQVRUQUNITUVOVDAnXV07XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuZHJhd0J1ZmZlcnMoYXJyREJ1ZmYpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5mcmFtZWJ1ZmZlclRleHR1cmUyRCh0aGlzLl9nbC5GUkFNRUJVRkZFUiwgdGhpcy5fYXJyRXh0W1wiV0VCR0xfZHJhd19idWZmZXJzXCJdWydDT0xPUl9BVFRBQ0hNRU5UMF9XRUJHTCddLCB0aGlzLl9nbC5URVhUVVJFXzJELCBidWZmZXIudGV4dHVyZURhdGFUZW1wLCAwKTtcblxuICAgICAgICAgICAgICAgIHZhciBfYXJyREJ1ZmYyID0gW3RoaXMuX2FyckV4dFtcIldFQkdMX2RyYXdfYnVmZmVyc1wiXVsnQ09MT1JfQVRUQUNITUVOVDBfV0VCR0wnXV07XG4gICAgICAgICAgICAgICAgdGhpcy5fYXJyRXh0W1wiV0VCR0xfZHJhd19idWZmZXJzXCJdLmRyYXdCdWZmZXJzV0VCR0woX2FyckRCdWZmMik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9nbC5hY3RpdmVUZXh0dXJlKHRoaXMuX2dsLlRFWFRVUkUwKTtcbiAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRUZXh0dXJlKHRoaXMuX2dsLlRFWFRVUkVfMkQsIGJ1ZmZlci50ZXh0dXJlRGF0YSk7XG4gICAgICAgICAgICB0aGlzLl9nbC51bmlmb3JtMWkodGhpcy5zYW1wbGVyX2J1ZmZlciwgMCk7XG5cbiAgICAgICAgICAgIHRoaXMuX2dsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHRoaXMuYXR0cl9WZXJ0ZXhQb3MpO1xuICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEJ1ZmZlcih0aGlzLl9nbC5BUlJBWV9CVUZGRVIsIHRoaXMudmVydGV4QnVmZmVyX1FVQUQpO1xuICAgICAgICAgICAgdGhpcy5fZ2wudmVydGV4QXR0cmliUG9pbnRlcih0aGlzLmF0dHJfVmVydGV4UG9zLCAzLCBidWZmZXIuX3N1cHBvcnRGb3JtYXQsIGZhbHNlLCAwLCAwKTtcblxuICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEJ1ZmZlcih0aGlzLl9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgdGhpcy5pbmRleEJ1ZmZlcl9RVUFEKTtcbiAgICAgICAgICAgIHRoaXMuX2dsLmRyYXdFbGVtZW50cyh0aGlzLl9nbC5UUklBTkdMRVMsIDYsIHRoaXMuX2dsLlVOU0lHTkVEX1NIT1JULCAwKTtcblxuICAgICAgICAgICAgaWYgKGJ1ZmZlci5vdXRBcnJheUZsb2F0ID09PSB1bmRlZmluZWQgfHwgYnVmZmVyLm91dEFycmF5RmxvYXQgPT09IG51bGwpIGJ1ZmZlci5vdXRBcnJheUZsb2F0ID0gbmV3IEZsb2F0MzJBcnJheShidWZmZXIuVyAqIGJ1ZmZlci5IICogNCk7XG4gICAgICAgICAgICB0aGlzLl9nbC5yZWFkUGl4ZWxzKDAsIDAsIGJ1ZmZlci5XLCBidWZmZXIuSCwgdGhpcy5fZ2wuUkdCQSwgdGhpcy5fZ2wuRkxPQVQsIGJ1ZmZlci5vdXRBcnJheUZsb2F0KTtcblxuICAgICAgICAgICAgaWYgKGJ1ZmZlci50eXBlID09PSBcIkZMT0FUXCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgZmQgPSBuZXcgRmxvYXQzMkFycmF5KGJ1ZmZlci5vdXRBcnJheUZsb2F0Lmxlbmd0aCAvIDQpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmbiA9IGJ1ZmZlci5vdXRBcnJheUZsb2F0Lmxlbmd0aCAvIDQ7IG4gPCBmbjsgbisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGZkW25dID0gYnVmZmVyLm91dEFycmF5RmxvYXRbbiAqIDRdO1xuICAgICAgICAgICAgICAgIH1idWZmZXIub3V0QXJyYXlGbG9hdCA9IGZkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gYnVmZmVyLm91dEFycmF5RmxvYXQ7XG4gICAgICAgIH1cbiAgICB9XSwgW3tcbiAgICAgICAga2V5OiBcImVucXVldWVSZWFkQnVmZmVyX1dlYkdMVGV4dHVyZVwiLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogR2V0IHRoZSBpbnRlcm5hbGx5IFdlYkdMVGV4dHVyZSAodHlwZSBGTE9BVCksIGlmIHRoZSBXZWJHTFJlbmRlcmluZ0NvbnRleHQgd2FzIGdpdmVuLlxyXG4gICAgICAgICAqIEBwYXJhbSB7V2ViQ0xHTEJ1ZmZlcn0gYnVmZmVyXHJcbiAgICAgICAgICogQHJldHVybnMge1dlYkdMVGV4dHVyZX1cclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGVucXVldWVSZWFkQnVmZmVyX1dlYkdMVGV4dHVyZShidWZmZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBidWZmZXIudGV4dHVyZURhdGE7XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gV2ViQ0xHTDtcbn0oKTtcblxuZ2xvYmFsLldlYkNMR0wgPSBXZWJDTEdMO1xubW9kdWxlLmV4cG9ydHMuV2ViQ0xHTCA9IFdlYkNMR0w7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0oKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuLyoqXHJcbiogV2ViQ0xHTEJ1ZmZlclxyXG4qIEBjbGFzc1xyXG4gKiBAcGFyYW0ge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gZ2xcclxuICogQHBhcmFtIHtTdHJpbmd9IFt0eXBlPVwiRkxPQVRcIl1cclxuICogQHBhcmFtIHtib29sZWFufSBbbGluZWFyPXRydWVdXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBbbW9kZT1cIlNBTVBMRVJcIl0gXCJTQU1QTEVSXCIsIFwiQVRUUklCVVRFXCIsIFwiVkVSVEVYX0lOREVYXCJcclxuKi9cbnZhciBXZWJDTEdMQnVmZmVyID0gZXhwb3J0cy5XZWJDTEdMQnVmZmVyID0gZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFdlYkNMR0xCdWZmZXIoZ2wsIHR5cGUsIGxpbmVhciwgbW9kZSkge1xuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgV2ViQ0xHTEJ1ZmZlcik7XG5cbiAgICAgICAgdGhpcy5fZ2wgPSBnbDtcblxuICAgICAgICB0aGlzLnR5cGUgPSB0eXBlICE9PSB1bmRlZmluZWQgfHwgdHlwZSAhPT0gbnVsbCA/IHR5cGUgOiAnRkxPQVQnO1xuICAgICAgICB0aGlzLl9zdXBwb3J0Rm9ybWF0ID0gdGhpcy5fZ2wuRkxPQVQ7XG5cbiAgICAgICAgdGhpcy5saW5lYXIgPSBsaW5lYXIgIT09IHVuZGVmaW5lZCB8fCBsaW5lYXIgIT09IG51bGwgPyBsaW5lYXIgOiB0cnVlO1xuICAgICAgICB0aGlzLm1vZGUgPSBtb2RlICE9PSB1bmRlZmluZWQgfHwgbW9kZSAhPT0gbnVsbCA/IG1vZGUgOiBcIlNBTVBMRVJcIjtcblxuICAgICAgICB0aGlzLlcgPSBudWxsO1xuICAgICAgICB0aGlzLkggPSBudWxsO1xuXG4gICAgICAgIHRoaXMudGV4dHVyZURhdGEgPSBudWxsO1xuICAgICAgICB0aGlzLnRleHR1cmVEYXRhVGVtcCA9IG51bGw7XG4gICAgICAgIHRoaXMudmVydGV4RGF0YTAgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuZkJ1ZmZlciA9IG51bGw7XG4gICAgICAgIHRoaXMucmVuZGVyQnVmZmVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5mQnVmZmVyVGVtcCA9IG51bGw7XG4gICAgICAgIHRoaXMucmVuZGVyQnVmZmVyVGVtcCA9IG51bGw7XG5cbiAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gXCJTQU1QTEVSXCIpIHtcbiAgICAgICAgICAgIHRoaXMudGV4dHVyZURhdGEgPSB0aGlzLl9nbC5jcmVhdGVUZXh0dXJlKCk7XG4gICAgICAgICAgICB0aGlzLnRleHR1cmVEYXRhVGVtcCA9IHRoaXMuX2dsLmNyZWF0ZVRleHR1cmUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5tb2RlID09PSBcIlNBTVBMRVJcIiB8fCB0aGlzLm1vZGUgPT09IFwiQVRUUklCVVRFXCIgfHwgdGhpcy5tb2RlID09PSBcIlZFUlRFWF9JTkRFWFwiKSB7XG4gICAgICAgICAgICB0aGlzLnZlcnRleERhdGEwID0gdGhpcy5fZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcclxuICAgICAqIGNyZWF0ZUZyYW1lYnVmZmVyQW5kUmVuZGVyYnVmZmVyXHJcbiAgICAgKi9cblxuXG4gICAgX2NyZWF0ZUNsYXNzKFdlYkNMR0xCdWZmZXIsIFt7XG4gICAgICAgIGtleTogXCJjcmVhdGVGcmFtZWJ1ZmZlckFuZFJlbmRlcmJ1ZmZlclwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlRnJhbWVidWZmZXJBbmRSZW5kZXJidWZmZXIoKSB7XG4gICAgICAgICAgICB2YXIgY3JlYXRlV2ViR0xSZW5kZXJCdWZmZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJCdWZmZXIgPSB0aGlzLl9nbC5jcmVhdGVSZW5kZXJidWZmZXIoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kUmVuZGVyYnVmZmVyKHRoaXMuX2dsLlJFTkRFUkJVRkZFUiwgckJ1ZmZlcik7XG5cbiAgICAgICAgICAgICAgICAvLyBXZWJHTDI6IEdMZW51bSB0YXJnZXQsIEdMZW51bSBpbnRlcm5hbGZvcm1hdCwgR0xzaXplaSB3aWR0aCwgR0xzaXplaSBoZWlnaHRcbiAgICAgICAgICAgICAgICB2YXIgaW50Rm9ybWF0ID0gdGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0ID8gdGhpcy5fZ2wuREVQVEhfQ09NUE9ORU5UMzJGIDogdGhpcy5fZ2wuREVQVEhfQ09NUE9ORU5UMTY7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5yZW5kZXJidWZmZXJTdG9yYWdlKHRoaXMuX2dsLlJFTkRFUkJVRkZFUiwgaW50Rm9ybWF0LCB0aGlzLlcsIHRoaXMuSCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kUmVuZGVyYnVmZmVyKHRoaXMuX2dsLlJFTkRFUkJVRkZFUiwgbnVsbCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJCdWZmZXI7XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmZCdWZmZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmRlbGV0ZUZyYW1lYnVmZmVyKHRoaXMuZkJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuZGVsZXRlRnJhbWVidWZmZXIodGhpcy5mQnVmZmVyVGVtcCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5kZWxldGVSZW5kZXJidWZmZXIodGhpcy5yZW5kZXJCdWZmZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmRlbGV0ZVJlbmRlcmJ1ZmZlcih0aGlzLnJlbmRlckJ1ZmZlclRlbXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5mQnVmZmVyID0gdGhpcy5fZ2wuY3JlYXRlRnJhbWVidWZmZXIoKTtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyQnVmZmVyID0gY3JlYXRlV2ViR0xSZW5kZXJCdWZmZXIoKTtcbiAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRGcmFtZWJ1ZmZlcih0aGlzLl9nbC5GUkFNRUJVRkZFUiwgdGhpcy5mQnVmZmVyKTtcbiAgICAgICAgICAgIHRoaXMuX2dsLmZyYW1lYnVmZmVyUmVuZGVyYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCB0aGlzLl9nbC5ERVBUSF9BVFRBQ0hNRU5ULCB0aGlzLl9nbC5SRU5ERVJCVUZGRVIsIHRoaXMucmVuZGVyQnVmZmVyKTtcblxuICAgICAgICAgICAgdGhpcy5mQnVmZmVyVGVtcCA9IHRoaXMuX2dsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XG4gICAgICAgICAgICB0aGlzLnJlbmRlckJ1ZmZlclRlbXAgPSBjcmVhdGVXZWJHTFJlbmRlckJ1ZmZlcigpO1xuICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEZyYW1lYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCB0aGlzLmZCdWZmZXJUZW1wKTtcbiAgICAgICAgICAgIHRoaXMuX2dsLmZyYW1lYnVmZmVyUmVuZGVyYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCB0aGlzLl9nbC5ERVBUSF9BVFRBQ0hNRU5ULCB0aGlzLl9nbC5SRU5ERVJCVUZGRVIsIHRoaXMucmVuZGVyQnVmZmVyVGVtcCk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJ3cml0ZVdlYkdMVGV4dHVyZUJ1ZmZlclwiLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogV3JpdGUgV2ViR0xUZXh0dXJlIGJ1ZmZlclxyXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXk8ZmxvYXQ+fEZsb2F0MzJBcnJheXxVaW50OEFycmF5fFdlYkdMVGV4dHVyZXxIVE1MSW1hZ2VFbGVtZW50fSBhcnJcclxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtmbGlwPWZhbHNlXVxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gd3JpdGVXZWJHTFRleHR1cmVCdWZmZXIoYXJyLCBmbGlwKSB7XG4gICAgICAgICAgICB2YXIgcHMgPSBmdW5jdGlvbiAodGV4LCBmbGlwKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZsaXAgPT09IGZhbHNlIHx8IGZsaXAgPT09IHVuZGVmaW5lZCB8fCBmbGlwID09PSBudWxsKSB0aGlzLl9nbC5waXhlbFN0b3JlaSh0aGlzLl9nbC5VTlBBQ0tfRkxJUF9ZX1dFQkdMLCBmYWxzZSk7ZWxzZSB0aGlzLl9nbC5waXhlbFN0b3JlaSh0aGlzLl9nbC5VTlBBQ0tfRkxJUF9ZX1dFQkdMLCB0cnVlKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2dsLnBpeGVsU3RvcmVpKHRoaXMuX2dsLlVOUEFDS19QUkVNVUxUSVBMWV9BTFBIQV9XRUJHTCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRUZXh0dXJlKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRleCk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgICAgIC8vIFdlYkdMMlxuICAgICAgICAgICAgLy8gdGV4SW1hZ2UyRChlbnVtIHRhcmdldCwgaW50IGxldmVsLCBpbnQgaW50ZXJuYWxmb3JtYXQsIHNpemVpIHdpZHRoLCBzaXplaSBoZWlnaHQsIGludCBib3JkZXIsIGVudW0gZm9ybWF0LCBlbnVtIHR5cGUsIEFycmF5QnVmZmVyVmlldyBzcmNEYXRhLCB1aW50IHNyY09mZnNldClcbiAgICAgICAgICAgIC8vIHRleEltYWdlMkQoZW51bSB0YXJnZXQsIGludCBsZXZlbCwgaW50IGludGVybmFsZm9ybWF0LCBzaXplaSB3aWR0aCwgc2l6ZWkgaGVpZ2h0LCBpbnQgYm9yZGVyLCBlbnVtIGZvcm1hdCwgZW51bSB0eXBlLCBUZXhJbWFnZVNvdXJjZSBzb3VyY2UpO1xuICAgICAgICAgICAgLy8gdGV4SW1hZ2UyRChlbnVtIHRhcmdldCwgaW50IGxldmVsLCBpbnQgaW50ZXJuYWxmb3JtYXQsIHNpemVpIHdpZHRoLCBzaXplaSBoZWlnaHQsIGludCBib3JkZXIsIGVudW0gZm9ybWF0LCBlbnVtIHR5cGUsIGludHB0ciBvZmZzZXQpO1xuICAgICAgICAgICAgdmFyIHdyaXRlVGV4Tm93ID0gZnVuY3Rpb24gKGFycikge1xuICAgICAgICAgICAgICAgIGlmIChhcnIgaW5zdGFuY2VvZiBIVE1MSW1hZ2VFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vdGhpcy5fZ2wudGV4SW1hZ2UyRCh0aGlzLl9nbC5URVhUVVJFXzJELCAwLCB0aGlzLl9nbC5SR0JBLCBhcnIud2lkdGgsIGFyci5oZWlnaHQsIDAsIHRoaXMuX2dsLlJHQkEsIHRoaXMuX2dsLlVOU0lHTkVEX0JZVEUsIGFycik7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnR5cGUgPT09ICdGTE9BVDQnKSB0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgPyB0aGlzLl9nbC50ZXhJbWFnZTJEKHRoaXMuX2dsLlRFWFRVUkVfMkQsIDAsIHRoaXMuX2dsLlJHQkEzMkYsIGFyci53aWR0aCwgYXJyLmhlaWdodCwgMCwgdGhpcy5fZ2wuUkdCQSwgdGhpcy5fc3VwcG9ydEZvcm1hdCwgYXJyKSA6IHRoaXMuX2dsLnRleEltYWdlMkQodGhpcy5fZ2wuVEVYVFVSRV8yRCwgMCwgdGhpcy5fZ2wuUkdCQSwgdGhpcy5fZ2wuUkdCQSwgdGhpcy5fc3VwcG9ydEZvcm1hdCwgYXJyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvL3RoaXMuX2dsLnRleEltYWdlMkQodGhpcy5fZ2wuVEVYVFVSRV8yRCwgMCwgdGhpcy5fZ2wuUkdCQSwgdGhpcy5XLCB0aGlzLkgsIDAsIHRoaXMuX2dsLlJHQkEsIHRoaXMuX3N1cHBvcnRGb3JtYXQsIGFyciwgMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCA/IHRoaXMuX2dsLnRleEltYWdlMkQodGhpcy5fZ2wuVEVYVFVSRV8yRCwgMCwgdGhpcy5fZ2wuUkdCQTMyRiwgdGhpcy5XLCB0aGlzLkgsIDAsIHRoaXMuX2dsLlJHQkEsIHRoaXMuX3N1cHBvcnRGb3JtYXQsIGFycikgOiB0aGlzLl9nbC50ZXhJbWFnZTJEKHRoaXMuX2dsLlRFWFRVUkVfMkQsIDAsIHRoaXMuX2dsLlJHQkEsIHRoaXMuVywgdGhpcy5ILCAwLCB0aGlzLl9nbC5SR0JBLCB0aGlzLl9zdXBwb3J0Rm9ybWF0LCBhcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICAgICAgdmFyIHRwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLnRleFBhcmFtZXRlcmkodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy5fZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCB0aGlzLl9nbC5ORUFSRVNUKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgdGhpcy5fZ2wuTkVBUkVTVCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wudGV4UGFyYW1ldGVyaSh0aGlzLl9nbC5URVhUVVJFXzJELCB0aGlzLl9nbC5URVhUVVJFX1dSQVBfUywgdGhpcy5fZ2wuQ0xBTVBfVE9fRURHRSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wudGV4UGFyYW1ldGVyaSh0aGlzLl9nbC5URVhUVVJFXzJELCB0aGlzLl9nbC5URVhUVVJFX1dSQVBfVCwgdGhpcy5fZ2wuQ0xBTVBfVE9fRURHRSk7XG5cbiAgICAgICAgICAgICAgICAvKnRoaXMuX2dsLnRleFBhcmFtZXRlcmkodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy5fZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCB0aGlzLl9nbC5MSU5FQVIpO1xyXG4gICAgICAgICAgICAgICAgIHRoaXMuX2dsLnRleFBhcmFtZXRlcmkodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy5fZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCB0aGlzLl9nbC5MSU5FQVJfTUlQTUFQX05FQVJFU1QpO1xyXG4gICAgICAgICAgICAgICAgIHRoaXMuX2dsLnRleFBhcmFtZXRlcmkodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy5fZ2wuVEVYVFVSRV9XUkFQX1MsIHRoaXMuX2dsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgICAgICAgICAgICAgIHRoaXMuX2dsLnRleFBhcmFtZXRlcmkodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy5fZ2wuVEVYVFVSRV9XUkFQX1QsIHRoaXMuX2dsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgICAgICAgICAgICAgIHRoaXMuX2dsLmdlbmVyYXRlTWlwbWFwKHRoaXMuX2dsLlRFWFRVUkVfMkQpOyovXG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgICAgIGlmIChhcnIgaW5zdGFuY2VvZiBXZWJHTFRleHR1cmUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRleHR1cmVEYXRhID0gYXJyO1xuICAgICAgICAgICAgICAgIHRoaXMudGV4dHVyZURhdGFUZW1wID0gYXJyO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcyh0aGlzLnRleHR1cmVEYXRhLCBmbGlwKTtcbiAgICAgICAgICAgICAgICB3cml0ZVRleE5vdyhhcnIpO1xuICAgICAgICAgICAgICAgIHRwKCk7XG5cbiAgICAgICAgICAgICAgICBwcyh0aGlzLnRleHR1cmVEYXRhVGVtcCwgZmxpcCk7XG4gICAgICAgICAgICAgICAgd3JpdGVUZXhOb3coYXJyKTtcbiAgICAgICAgICAgICAgICB0cCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9nbC5iaW5kVGV4dHVyZSh0aGlzLl9nbC5URVhUVVJFXzJELCBudWxsKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIndyaXRlQnVmZmVyXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBXcml0ZSBvbiBidWZmZXJcclxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5PGZsb2F0PnxGbG9hdDMyQXJyYXl8VWludDhBcnJheXxXZWJHTFRleHR1cmV8SFRNTEltYWdlRWxlbWVudH0gYXJyXHJcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBbZmxpcD1mYWxzZV1cclxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5PEZsb2F0Mj59IFtvdmVycmlkZURpbWVuc2lvbnM9bmV3IEFycmF5KCl7TWF0aC5zcXJ0KHZhbHVlLmxlbmd0aCksIE1hdGguc3FydCh2YWx1ZS5sZW5ndGgpfV1cclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHdyaXRlQnVmZmVyKGFyciwgZmxpcCwgb3ZlcnJpZGVEaW1lbnNpb25zKSB7XG4gICAgICAgICAgICB2YXIgcHJlcGFyZUFyciA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoIShhcnIgaW5zdGFuY2VvZiBIVE1MSW1hZ2VFbGVtZW50KSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5sZW5ndGguY29uc3RydWN0b3IgPT09IEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxlbmd0aCA9IHRoaXMubGVuZ3RoWzBdICogdGhpcy5sZW5ndGhbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLlcgPSB0aGlzLmxlbmd0aFswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuSCA9IHRoaXMubGVuZ3RoWzFdO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5XID0gTWF0aC5jZWlsKE1hdGguc3FydCh0aGlzLmxlbmd0aCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5IID0gdGhpcy5XO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudHlwZSA9PT0gJ0ZMT0FUNCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyciA9IGFyciBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSA/IGFyciA6IG5ldyBGbG9hdDMyQXJyYXkoYXJyKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGwgPSB0aGlzLlcgKiB0aGlzLkggKiA0O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFyci5sZW5ndGggIT09IGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXJydCA9IG5ldyBGbG9hdDMyQXJyYXkobCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPCBsOyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJydFtuXSA9IGFycltuXSAhPSBudWxsID8gYXJyW25dIDogMC4wO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnIgPSBhcnJ0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMudHlwZSA9PT0gJ0ZMT0FUJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIF9sID0gdGhpcy5XICogdGhpcy5IICogNDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhcnJheVRlbXAgPSBuZXcgRmxvYXQzMkFycmF5KF9sKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9uID0gMCwgZiA9IHRoaXMuVyAqIHRoaXMuSDsgX24gPCBmOyBfbisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlkZCA9IF9uICogNDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnJheVRlbXBbaWRkXSA9IGFycltfbl0gIT0gbnVsbCA/IGFycltfbl0gOiAwLjA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyYXlUZW1wW2lkZCArIDFdID0gMC4wO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFycmF5VGVtcFtpZGQgKyAyXSA9IDAuMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnJheVRlbXBbaWRkICsgM10gPSAwLjA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBhcnIgPSBhcnJheVRlbXA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFycjtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICAgICAgaWYgKG92ZXJyaWRlRGltZW5zaW9ucyA9PT0gdW5kZWZpbmVkIHx8IG92ZXJyaWRlRGltZW5zaW9ucyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmIChhcnIgaW5zdGFuY2VvZiBIVE1MSW1hZ2VFbGVtZW50KSB0aGlzLmxlbmd0aCA9IGFyci53aWR0aCAqIGFyci5oZWlnaHQ7ZWxzZSB0aGlzLmxlbmd0aCA9IHRoaXMudHlwZSA9PT0gXCJGTE9BVDRcIiA/IGFyci5sZW5ndGggLyA0IDogYXJyLmxlbmd0aDtcbiAgICAgICAgICAgIH0gZWxzZSB0aGlzLmxlbmd0aCA9IFtvdmVycmlkZURpbWVuc2lvbnNbMF0sIG92ZXJyaWRlRGltZW5zaW9uc1sxXV07XG5cbiAgICAgICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFwiU0FNUExFUlwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53cml0ZVdlYkdMVGV4dHVyZUJ1ZmZlcihwcmVwYXJlQXJyKGFyciksIGZsaXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gXCJTQU1QTEVSXCIgfHwgdGhpcy5tb2RlID09PSBcIkFUVFJJQlVURVwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEJ1ZmZlcih0aGlzLl9nbC5BUlJBWV9CVUZGRVIsIHRoaXMudmVydGV4RGF0YTApO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJ1ZmZlckRhdGEodGhpcy5fZ2wuQVJSQVlfQlVGRkVSLCBhcnIgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgPyBhcnIgOiBuZXcgRmxvYXQzMkFycmF5KGFyciksIHRoaXMuX2dsLlNUQVRJQ19EUkFXKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFwiVkVSVEVYX0lOREVYXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCB0aGlzLnZlcnRleERhdGEwKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5idWZmZXJEYXRhKHRoaXMuX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBuZXcgVWludDE2QXJyYXkoYXJyKSwgdGhpcy5fZ2wuU1RBVElDX0RSQVcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUZyYW1lYnVmZmVyQW5kUmVuZGVyYnVmZmVyKCk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJyZW1vdmVcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFJlbW92ZSB0aGlzIGJ1ZmZlclxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcmVtb3ZlKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gXCJTQU1QTEVSXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5kZWxldGVUZXh0dXJlKHRoaXMudGV4dHVyZURhdGEpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmRlbGV0ZVRleHR1cmUodGhpcy50ZXh0dXJlRGF0YVRlbXApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5tb2RlID09PSBcIlNBTVBMRVJcIiB8fCB0aGlzLm1vZGUgPT09IFwiQVRUUklCVVRFXCIgfHwgdGhpcy5tb2RlID09PSBcIlZFUlRFWF9JTkRFWFwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuZGVsZXRlQnVmZmVyKHRoaXMudmVydGV4RGF0YTApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9nbC5kZWxldGVGcmFtZWJ1ZmZlcih0aGlzLmZCdWZmZXIpO1xuICAgICAgICAgICAgdGhpcy5fZ2wuZGVsZXRlRnJhbWVidWZmZXIodGhpcy5mQnVmZmVyVGVtcCk7XG5cbiAgICAgICAgICAgIHRoaXMuX2dsLmRlbGV0ZVJlbmRlcmJ1ZmZlcih0aGlzLnJlbmRlckJ1ZmZlcik7XG4gICAgICAgICAgICB0aGlzLl9nbC5kZWxldGVSZW5kZXJidWZmZXIodGhpcy5yZW5kZXJCdWZmZXJUZW1wKTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBXZWJDTEdMQnVmZmVyO1xufSgpO1xuXG5nbG9iYWwuV2ViQ0xHTEJ1ZmZlciA9IFdlYkNMR0xCdWZmZXI7XG5tb2R1bGUuZXhwb3J0cy5XZWJDTEdMQnVmZmVyID0gV2ViQ0xHTEJ1ZmZlcjsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuV2ViQ0xHTEtlcm5lbCA9IHVuZGVmaW5lZDtcblxudmFyIF9jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0oKTtcblxudmFyIF9XZWJDTEdMVXRpbHMgPSByZXF1aXJlKCcuL1dlYkNMR0xVdGlscy5jbGFzcycpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG4vKipcclxuKiBXZWJDTEdMS2VybmVsIE9iamVjdFxyXG4qIEBjbGFzc1xyXG4gKiBAcGFyYW0ge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gZ2xcclxuICogQHBhcmFtIHtTdHJpbmd9IHNvdXJjZVxyXG4gKiBAcGFyYW0ge1N0cmluZ30gaGVhZGVyXHJcbiovXG52YXIgV2ViQ0xHTEtlcm5lbCA9IGV4cG9ydHMuV2ViQ0xHTEtlcm5lbCA9IGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBXZWJDTEdMS2VybmVsKGdsLCBzb3VyY2UsIGhlYWRlcikge1xuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgV2ViQ0xHTEtlcm5lbCk7XG5cbiAgICAgICAgdGhpcy5fZ2wgPSBnbDtcblxuICAgICAgICB2YXIgaGlnaFByZWNpc2lvblN1cHBvcnQgPSB0aGlzLl9nbC5nZXRTaGFkZXJQcmVjaXNpb25Gb3JtYXQodGhpcy5fZ2wuRlJBR01FTlRfU0hBREVSLCB0aGlzLl9nbC5ISUdIX0ZMT0FUKTtcbiAgICAgICAgdGhpcy5fcHJlY2lzaW9uID0gaGlnaFByZWNpc2lvblN1cHBvcnQucHJlY2lzaW9uICE9PSAwID8gJ3ByZWNpc2lvbiBoaWdocCBmbG9hdDtcXG5cXG5wcmVjaXNpb24gaGlnaHAgaW50O1xcblxcbicgOiAncHJlY2lzaW9uIGxvd3AgZmxvYXQ7XFxuXFxucHJlY2lzaW9uIGxvd3AgaW50O1xcblxcbic7XG5cbiAgICAgICAgdGhpcy52ZXJzaW9uID0gdGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0ID8gXCIjdmVyc2lvbiAzMDAgZXMgXFxuIFwiIDogXCJcIjtcblxuICAgICAgICB0aGlzLl9hcnJFeHQgPSB0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgPyB7IFwiRVhUX2NvbG9yX2J1ZmZlcl9mbG9hdFwiOiBudWxsIH0gOiB7IFwiT0VTX3RleHR1cmVfZmxvYXRcIjogbnVsbCwgXCJPRVNfdGV4dHVyZV9mbG9hdF9saW5lYXJcIjogbnVsbCwgXCJPRVNfZWxlbWVudF9pbmRleF91aW50XCI6IG51bGwsIFwiV0VCR0xfZHJhd19idWZmZXJzXCI6IG51bGwgfTtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuX2FyckV4dCkge1xuICAgICAgICAgICAgdGhpcy5fYXJyRXh0W2tleV0gPSB0aGlzLl9nbC5nZXRFeHRlbnNpb24oa2V5KTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9hcnJFeHRba2V5XSA9PSBudWxsKSBjb25zb2xlLmVycm9yKFwiZXh0ZW5zaW9uIFwiICsga2V5ICsgXCIgbm90IGF2YWlsYWJsZVwiKTtlbHNlIGNvbnNvbGUubG9nKFwidXNpbmcgZXh0ZW5zaW9uIFwiICsga2V5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZXh0RHJhd0J1ZmYgPSB0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgPyBcIlwiIDogXCIgI2V4dGVuc2lvbiBHTF9FWFRfZHJhd19idWZmZXJzIDogcmVxdWlyZVxcblwiO1xuXG4gICAgICAgIHRoaXMubmFtZSA9IFwiXCI7XG4gICAgICAgIHRoaXMuZW5hYmxlZCA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5kZXB0aFRlc3QgPSBudWxsO1xuICAgICAgICB0aGlzLmJsZW5kID0gbnVsbDtcbiAgICAgICAgdGhpcy5ibGVuZFNyY01vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLmJsZW5kRHN0TW9kZSA9IG51bGw7XG4gICAgICAgIHRoaXMuYmxlbmRFcXVhdGlvbiA9IG51bGw7XG4gICAgICAgIHRoaXMub25wcmUgPSBudWxsO1xuICAgICAgICB0aGlzLm9ucG9zdCA9IG51bGw7XG4gICAgICAgIHRoaXMudmlld1NvdXJjZSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuaW5fdmFsdWVzID0ge307XG5cbiAgICAgICAgdGhpcy5vdXRwdXQgPSBudWxsOyAvL1N0cmluZyBvciBBcnJheTxTdHJpbmc+IG9mIGFyZyBuYW1lcyB3aXRoIHRoZSBpdGVtcyBpbiBzYW1lIG9yZGVyIHRoYXQgaW4gdGhlIGZpbmFsIHJldHVyblxuICAgICAgICB0aGlzLm91dHB1dFRlbXBNb2RlcyA9IG51bGw7XG4gICAgICAgIHRoaXMuZkJ1ZmZlciA9IG51bGw7XG4gICAgICAgIHRoaXMuZkJ1ZmZlclRlbXAgPSBudWxsO1xuICAgICAgICB0aGlzLmZCdWZmZXJMZW5ndGggPSAwO1xuICAgICAgICB0aGlzLmZCdWZmZXJDb3VudCA9IDA7XG5cbiAgICAgICAgaWYgKHNvdXJjZSAhPT0gdW5kZWZpbmVkICYmIHNvdXJjZSAhPT0gbnVsbCkgdGhpcy5zZXRLZXJuZWxTb3VyY2Uoc291cmNlLCBoZWFkZXIpO1xuICAgIH1cblxuICAgIC8qKlxyXG4gICAgICogVXBkYXRlIHRoZSBrZXJuZWwgc291cmNlXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc291cmNlXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gW2hlYWRlcj11bmRlZmluZWRdIEFkZGl0aW9uYWwgZnVuY3Rpb25zXHJcbiAgICAgKi9cblxuXG4gICAgX2NyZWF0ZUNsYXNzKFdlYkNMR0xLZXJuZWwsIFt7XG4gICAgICAgIGtleTogJ3NldEtlcm5lbFNvdXJjZScsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRLZXJuZWxTb3VyY2Uoc291cmNlLCBoZWFkZXIpIHtcbiAgICAgICAgICAgIHZhciBhdHRyU3RyID0gdGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0ID09PSB0cnVlID8gXCJpblwiIDogXCJhdHRyaWJ1dGVcIjtcbiAgICAgICAgICAgIHZhciB2YXJ5aW5nT3V0U3RyID0gdGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0ID09PSB0cnVlID8gXCJvdXRcIiA6IFwidmFyeWluZ1wiO1xuICAgICAgICAgICAgdmFyIHZhcnlpbmdJblN0ciA9IHRoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCA9PT0gdHJ1ZSA/IFwiaW5cIiA6IFwidmFyeWluZ1wiO1xuXG4gICAgICAgICAgICB2YXIgY29tcGlsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgc291cmNlVmVydGV4ID0gdGhpcy52ZXJzaW9uICsgdGhpcy5fcHJlY2lzaW9uICsgYXR0clN0ciArICcgdmVjMyBhVmVydGV4UG9zaXRpb247XFxuJyArIHZhcnlpbmdPdXRTdHIgKyAnIHZlYzIgZ2xvYmFsX2lkO1xcbicgKyAndm9pZCBtYWluKHZvaWQpIHtcXG4nICsgJ2dsX1Bvc2l0aW9uID0gdmVjNChhVmVydGV4UG9zaXRpb24sIDEuMCk7XFxuJyArICdnbG9iYWxfaWQgPSBhVmVydGV4UG9zaXRpb24ueHkqMC41KzAuNTtcXG4nICsgJ31cXG4nO1xuICAgICAgICAgICAgICAgIHZhciBzb3VyY2VGcmFnbWVudCA9IHRoaXMudmVyc2lvbiArIHRoaXMuZXh0RHJhd0J1ZmYgKyB0aGlzLl9wcmVjaXNpb24gKyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5saW5lc19mcmFnbWVudF9hdHRycyh0aGlzLmluX3ZhbHVlcykgKyB2YXJ5aW5nSW5TdHIgKyAnIHZlYzIgZ2xvYmFsX2lkO1xcbicgKyAndW5pZm9ybSBmbG9hdCB1QnVmZmVyV2lkdGg7JyArICd2ZWMyIGdldF9nbG9iYWxfaWQoKSB7XFxuJyArICdyZXR1cm4gZ2xvYmFsX2lkO1xcbicgKyAnfVxcbicgKyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5nZXRfZ2xvYmFsX2lkM19HTFNMRnVuY3Rpb25TdHJpbmcoKSArIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmdldF9nbG9iYWxfaWQyX0dMU0xGdW5jdGlvblN0cmluZygpICsgdGhpcy5faGVhZCArICh0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgPyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5saW5lc19kcmF3QnVmZmVyc1dyaXRlSW5pdF9HTDIoOCkgOiBcIlwiKSArICd2b2lkIG1haW4odm9pZCkge1xcbicgKyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5saW5lc19kcmF3QnVmZmVyc0luaXQoOCkgKyB0aGlzLl9zb3VyY2UgKyAodGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0ID8gX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMubGluZXNfZHJhd0J1ZmZlcnNXcml0ZV9HTDIoOCkgOiBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5saW5lc19kcmF3QnVmZmVyc1dyaXRlKDgpKSArICd9XFxuJztcblxuICAgICAgICAgICAgICAgIHRoaXMua2VybmVsID0gdGhpcy5fZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBuZXcgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMoKS5jcmVhdGVTaGFkZXIodGhpcy5fZ2wsIFwiV0VCQ0xHTFwiLCBzb3VyY2VWZXJ0ZXgsIHNvdXJjZUZyYWdtZW50LCB0aGlzLmtlcm5lbCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmF0dHJfVmVydGV4UG9zID0gdGhpcy5fZ2wuZ2V0QXR0cmliTG9jYXRpb24odGhpcy5rZXJuZWwsIFwiYVZlcnRleFBvc2l0aW9uXCIpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy51QnVmZmVyV2lkdGggPSB0aGlzLl9nbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy5rZXJuZWwsIFwidUJ1ZmZlcldpZHRoXCIpO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuaW5fdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBleHBlY3RlZE1vZGUgPSB7ICdmbG9hdDRfZnJvbVNhbXBsZXInOiBcIlNBTVBMRVJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICdmbG9hdF9mcm9tU2FtcGxlcic6IFwiU0FNUExFUlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0JzogXCJVTklGT1JNXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAnZmxvYXQ0JzogXCJVTklGT1JNXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAnbWF0NCc6IFwiVU5JRk9STVwiIH1bdGhpcy5pbl92YWx1ZXNba2V5XS50eXBlXTtcblxuICAgICAgICAgICAgICAgICAgICBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5jaGVja0FyZ05hbWVJbml0aWFsaXphdGlvbih0aGlzLmluX3ZhbHVlcywga2V5KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbl92YWx1ZXNba2V5XS5sb2NhdGlvbiA9IFt0aGlzLl9nbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy5rZXJuZWwsIGtleS5yZXBsYWNlKC9cXFtcXGQuKi8sIFwiXCIpKV07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5fdmFsdWVzW2tleV0uZXhwZWN0ZWRNb2RlID0gZXhwZWN0ZWRNb2RlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBcIlZFUlRFWCBQUk9HUkFNXFxuXCIgKyBzb3VyY2VWZXJ0ZXggKyBcIlxcbiBGUkFHTUVOVCBQUk9HUkFNXFxuXCIgKyBzb3VyY2VGcmFnbWVudDtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICAgICAgdmFyIGFyZ3VtZW50c1NvdXJjZSA9IHNvdXJjZS5zcGxpdCgnKScpWzBdLnNwbGl0KCcoJylbMV0uc3BsaXQoJywnKTsgLy8gXCJmbG9hdCogQVwiLCBcImZsb2F0KiBCXCIsIFwiZmxvYXQgQ1wiLCBcImZsb2F0NCogRFwiXG5cbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmID0gYXJndW1lbnRzU291cmNlLmxlbmd0aDsgbiA8IGY7IG4rKykge1xuICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL1xcKi9nbSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFyZ05hbWUgPSBhcmd1bWVudHNTb3VyY2Vbbl0uc3BsaXQoJyonKVsxXS50cmltKCk7XG4gICAgICAgICAgICAgICAgICAgIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uKHRoaXMuaW5fdmFsdWVzLCBhcmdOYW1lKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9mbG9hdDQvZ20pICE9IG51bGwpIHRoaXMuaW5fdmFsdWVzW2FyZ05hbWVdLnR5cGUgPSAnZmxvYXQ0X2Zyb21TYW1wbGVyJztlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0L2dtKSAhPSBudWxsKSB0aGlzLmluX3ZhbHVlc1thcmdOYW1lXS50eXBlID0gJ2Zsb2F0X2Zyb21TYW1wbGVyJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXSAhPT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgX2FyZ05hbWUgPSBhcmd1bWVudHNTb3VyY2Vbbl0uc3BsaXQoJyAnKVsxXS50cmltKCk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLmluX3ZhbHVlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleS5yZXBsYWNlKC9cXFtcXGQuKi8sIFwiXCIpID09PSBfYXJnTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9hcmdOYW1lID0ga2V5OyAvLyBmb3Igbm9ybWFsIHVuaWZvcm0gYXJyYXlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5jaGVja0FyZ05hbWVJbml0aWFsaXphdGlvbih0aGlzLmluX3ZhbHVlcywgX2FyZ05hbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0NC9nbSkgIT0gbnVsbCkgdGhpcy5pbl92YWx1ZXNbX2FyZ05hbWVdLnR5cGUgPSAnZmxvYXQ0JztlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0L2dtKSAhPSBudWxsKSB0aGlzLmluX3ZhbHVlc1tfYXJnTmFtZV0udHlwZSA9ICdmbG9hdCc7ZWxzZSBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9tYXQ0L2dtKSAhPSBudWxsKSB0aGlzLmluX3ZhbHVlc1tfYXJnTmFtZV0udHlwZSA9ICdtYXQ0JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHBhcnNlIGhlYWRlclxuICAgICAgICAgICAgdGhpcy5faGVhZCA9IGhlYWRlciAhPT0gdW5kZWZpbmVkICYmIGhlYWRlciAhPT0gbnVsbCA/IGhlYWRlciA6ICcnO1xuICAgICAgICAgICAgdGhpcy5faGVhZCA9IHRoaXMuX2hlYWQucmVwbGFjZSgvXFxyXFxuL2dpLCAnJykucmVwbGFjZSgvXFxyL2dpLCAnJykucmVwbGFjZSgvXFxuL2dpLCAnJyk7XG4gICAgICAgICAgICB0aGlzLl9oZWFkID0gX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMucGFyc2VTb3VyY2UodGhpcy5faGVhZCwgdGhpcy5pbl92YWx1ZXMsIHRoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCk7XG5cbiAgICAgICAgICAgIC8vIHBhcnNlIHNvdXJjZVxuICAgICAgICAgICAgdGhpcy5fc291cmNlID0gc291cmNlLnJlcGxhY2UoL1xcclxcbi9naSwgJycpLnJlcGxhY2UoL1xcci9naSwgJycpLnJlcGxhY2UoL1xcbi9naSwgJycpO1xuICAgICAgICAgICAgdGhpcy5fc291cmNlID0gdGhpcy5fc291cmNlLnJlcGxhY2UoL15cXHcqIFxcdypcXChbXFx3XFxzXFwqLF0qXFwpIHsvZ2ksICcnKS5yZXBsYWNlKC99KFxcc3xcXHQpKiQvZ2ksICcnKTtcbiAgICAgICAgICAgIHRoaXMuX3NvdXJjZSA9IF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLnBhcnNlU291cmNlKHRoaXMuX3NvdXJjZSwgdGhpcy5pbl92YWx1ZXMsIHRoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCk7XG5cbiAgICAgICAgICAgIHZhciB0cyA9IGNvbXBpbGUoKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMudmlld1NvdXJjZSA9PT0gdHJ1ZSkgY29uc29sZS5sb2coJyVjIEtFUk5FTDogJyArIHRoaXMubmFtZSwgJ2ZvbnQtc2l6ZTogMjBweDsgY29sb3I6IGJsdWUnKSwgY29uc29sZS5sb2coJyVjIFdFQkNMR0wgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nLCAnY29sb3I6IGdyYXknKSwgY29uc29sZS5sb2coJyVjICcgKyBoZWFkZXIgKyBzb3VyY2UsICdjb2xvcjogZ3JheScpLCBjb25zb2xlLmxvZygnJWMgVFJBTlNMQVRFRCBXRUJHTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nLCAnY29sb3I6IGRhcmtncmF5JyksIGNvbnNvbGUubG9nKCclYyAnICsgdHMsICdjb2xvcjogZGFya2dyYXknKTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBXZWJDTEdMS2VybmVsO1xufSgpO1xuXG5nbG9iYWwuV2ViQ0xHTEtlcm5lbCA9IFdlYkNMR0xLZXJuZWw7XG5tb2R1bGUuZXhwb3J0cy5XZWJDTEdMS2VybmVsID0gV2ViQ0xHTEtlcm5lbDsiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG4vKiogXG4qIFV0aWxpdGllc1xuKiBAY2xhc3NcbiogQGNvbnN0cnVjdG9yXG4qL1xudmFyIFdlYkNMR0xVdGlscyA9IGV4cG9ydHMuV2ViQ0xHTFV0aWxzID0gZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFdlYkNMR0xVdGlscygpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFdlYkNMR0xVdGlscyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogbG9hZFF1YWRcbiAgICAgKi9cblxuXG4gICAgX2NyZWF0ZUNsYXNzKFdlYkNMR0xVdGlscywgW3tcbiAgICAgICAga2V5OiBcImxvYWRRdWFkXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBsb2FkUXVhZChub2RlLCBsZW5ndGgsIGhlaWdodCkge1xuICAgICAgICAgICAgdmFyIGwgPSBsZW5ndGggPT09IHVuZGVmaW5lZCB8fCBsZW5ndGggPT09IG51bGwgPyAwLjUgOiBsZW5ndGg7XG4gICAgICAgICAgICB2YXIgaCA9IGhlaWdodCA9PT0gdW5kZWZpbmVkIHx8IGhlaWdodCA9PT0gbnVsbCA/IDAuNSA6IGhlaWdodDtcbiAgICAgICAgICAgIHRoaXMudmVydGV4QXJyYXkgPSBbLWwsIC1oLCAwLjAsIGwsIC1oLCAwLjAsIGwsIGgsIDAuMCwgLWwsIGgsIDAuMF07XG5cbiAgICAgICAgICAgIHRoaXMudGV4dHVyZUFycmF5ID0gWzAuMCwgMC4wLCAwLjAsIDEuMCwgMC4wLCAwLjAsIDEuMCwgMS4wLCAwLjAsIDAuMCwgMS4wLCAwLjBdO1xuXG4gICAgICAgICAgICB0aGlzLmluZGV4QXJyYXkgPSBbMCwgMSwgMiwgMCwgMiwgM107XG5cbiAgICAgICAgICAgIHZhciBtZXNoT2JqZWN0ID0ge307XG4gICAgICAgICAgICBtZXNoT2JqZWN0LnZlcnRleEFycmF5ID0gdGhpcy52ZXJ0ZXhBcnJheTtcbiAgICAgICAgICAgIG1lc2hPYmplY3QudGV4dHVyZUFycmF5ID0gdGhpcy50ZXh0dXJlQXJyYXk7XG4gICAgICAgICAgICBtZXNoT2JqZWN0LmluZGV4QXJyYXkgPSB0aGlzLmluZGV4QXJyYXk7XG5cbiAgICAgICAgICAgIHJldHVybiBtZXNoT2JqZWN0O1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY3JlYXRlU2hhZGVyXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogY3JlYXRlU2hhZGVyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY3JlYXRlU2hhZGVyKGdsLCBuYW1lLCBzb3VyY2VWZXJ0ZXgsIHNvdXJjZUZyYWdtZW50LCBzaGFkZXJQcm9ncmFtKSB7XG4gICAgICAgICAgICB2YXIgX3N2ID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgX3NmID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHZhciBtYWtlRGVidWcgPSBmdW5jdGlvbiAoaW5mb0xvZywgc2hhZGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coaW5mb0xvZyk7XG5cbiAgICAgICAgICAgICAgICB2YXIgYXJyRXJyb3JzID0gW107XG4gICAgICAgICAgICAgICAgdmFyIGVycm9ycyA9IGluZm9Mb2cuc3BsaXQoXCJcXG5cIik7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGYgPSBlcnJvcnMubGVuZ3RoOyBuIDwgZjsgbisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvcnNbbl0ubWF0Y2goL15FUlJPUi9naW0pICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBleHBsID0gZXJyb3JzW25dLnNwbGl0KCc6Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGluZSA9IHBhcnNlSW50KGV4cGxbMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJyRXJyb3JzLnB1c2goW2xpbmUsIGVycm9yc1tuXV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBzb3VyID0gZ2wuZ2V0U2hhZGVyU291cmNlKHNoYWRlcikuc3BsaXQoXCJcXG5cIik7XG4gICAgICAgICAgICAgICAgc291ci51bnNoaWZ0KFwiXCIpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIF9uID0gMCwgX2YgPSBzb3VyLmxlbmd0aDsgX24gPCBfZjsgX24rKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGluZVdpdGhFcnJvciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZXJyb3JTdHIgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgZSA9IDAsIGZlID0gYXJyRXJyb3JzLmxlbmd0aDsgZSA8IGZlOyBlKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChfbiA9PT0gYXJyRXJyb3JzW2VdWzBdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZVdpdGhFcnJvciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JTdHIgPSBhcnJFcnJvcnNbZV1bMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpbmVXaXRoRXJyb3IgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIiVjXCIgKyBfbiArICcgJWMnICsgc291cltfbl0sIFwiY29sb3I6YmxhY2tcIiwgXCJjb2xvcjpibHVlXCIpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJyVj4pa64pa6JWMnICsgX24gKyAnICVjJyArIHNvdXJbX25dICsgJ1xcbiVjJyArIGVycm9yU3RyLCBcImNvbG9yOnJlZFwiLCBcImNvbG9yOmJsYWNrXCIsIFwiY29sb3I6Ymx1ZVwiLCBcImNvbG9yOnJlZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICAgICAgdmFyIHNoYWRlclZlcnRleCA9IGdsLmNyZWF0ZVNoYWRlcihnbC5WRVJURVhfU0hBREVSKTtcbiAgICAgICAgICAgIGdsLnNoYWRlclNvdXJjZShzaGFkZXJWZXJ0ZXgsIHNvdXJjZVZlcnRleCk7XG4gICAgICAgICAgICBnbC5jb21waWxlU2hhZGVyKHNoYWRlclZlcnRleCk7XG4gICAgICAgICAgICBpZiAoIWdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXJWZXJ0ZXgsIGdsLkNPTVBJTEVfU1RBVFVTKSkge1xuICAgICAgICAgICAgICAgIHZhciBpbmZvTG9nID0gZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXJWZXJ0ZXgpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiJWNcIiArIG5hbWUgKyAnIEVSUk9SICh2ZXJ0ZXggcHJvZ3JhbSknLCBcImNvbG9yOnJlZFwiKTtcblxuICAgICAgICAgICAgICAgIGlmIChpbmZvTG9nICE9PSB1bmRlZmluZWQgJiYgaW5mb0xvZyAhPT0gbnVsbCkgbWFrZURlYnVnKGluZm9Mb2csIHNoYWRlclZlcnRleCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGdsLmF0dGFjaFNoYWRlcihzaGFkZXJQcm9ncmFtLCBzaGFkZXJWZXJ0ZXgpO1xuICAgICAgICAgICAgICAgIF9zdiA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBzaGFkZXJGcmFnbWVudCA9IGdsLmNyZWF0ZVNoYWRlcihnbC5GUkFHTUVOVF9TSEFERVIpO1xuICAgICAgICAgICAgZ2wuc2hhZGVyU291cmNlKHNoYWRlckZyYWdtZW50LCBzb3VyY2VGcmFnbWVudCk7XG4gICAgICAgICAgICBnbC5jb21waWxlU2hhZGVyKHNoYWRlckZyYWdtZW50KTtcbiAgICAgICAgICAgIGlmICghZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlckZyYWdtZW50LCBnbC5DT01QSUxFX1NUQVRVUykpIHtcbiAgICAgICAgICAgICAgICB2YXIgX2luZm9Mb2cgPSBnbC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlckZyYWdtZW50KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIiVjXCIgKyBuYW1lICsgJyBFUlJPUiAoZnJhZ21lbnQgcHJvZ3JhbSknLCBcImNvbG9yOnJlZFwiKTtcblxuICAgICAgICAgICAgICAgIGlmIChfaW5mb0xvZyAhPT0gdW5kZWZpbmVkICYmIF9pbmZvTG9nICE9PSBudWxsKSBtYWtlRGVidWcoX2luZm9Mb2csIHNoYWRlckZyYWdtZW50KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZ2wuYXR0YWNoU2hhZGVyKHNoYWRlclByb2dyYW0sIHNoYWRlckZyYWdtZW50KTtcbiAgICAgICAgICAgICAgICBfc2YgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoX3N2ID09PSB0cnVlICYmIF9zZiA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIGdsLmxpbmtQcm9ncmFtKHNoYWRlclByb2dyYW0pO1xuICAgICAgICAgICAgICAgIHZhciBzdWNjZXNzID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihzaGFkZXJQcm9ncmFtLCBnbC5MSU5LX1NUQVRVUyk7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0Vycm9yIHNoYWRlciBwcm9ncmFtICcgKyBuYW1lICsgJzpcXG4gJyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsb2cgPSBnbC5nZXRQcm9ncmFtSW5mb0xvZyhzaGFkZXJQcm9ncmFtKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvZyAhPT0gdW5kZWZpbmVkICYmIGxvZyAhPT0gbnVsbCkgY29uc29sZS5sb2cobG9nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwicGFja1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBhY2sgMWZsb2F0ICgwLjAtMS4wKSB0byA0ZmxvYXQgcmdiYSAoMC4wLTEuMCwgMC4wLTEuMCwgMC4wLTEuMCwgMC4wLTEuMClcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBwYWNrKHYpIHtcbiAgICAgICAgICAgIHZhciBiaWFzID0gWzEuMCAvIDI1NS4wLCAxLjAgLyAyNTUuMCwgMS4wIC8gMjU1LjAsIDAuMF07XG5cbiAgICAgICAgICAgIHZhciByID0gdjtcbiAgICAgICAgICAgIHZhciBnID0gdGhpcy5mcmFjdChyICogMjU1LjApO1xuICAgICAgICAgICAgdmFyIGIgPSB0aGlzLmZyYWN0KGcgKiAyNTUuMCk7XG4gICAgICAgICAgICB2YXIgYSA9IHRoaXMuZnJhY3QoYiAqIDI1NS4wKTtcbiAgICAgICAgICAgIHZhciBjb2xvdXIgPSBbciwgZywgYiwgYV07XG5cbiAgICAgICAgICAgIHZhciBkZCA9IFtjb2xvdXJbMV0gKiBiaWFzWzBdLCBjb2xvdXJbMl0gKiBiaWFzWzFdLCBjb2xvdXJbM10gKiBiaWFzWzJdLCBjb2xvdXJbM10gKiBiaWFzWzNdXTtcblxuICAgICAgICAgICAgcmV0dXJuIFtjb2xvdXJbMF0gLSBkZFswXSwgY29sb3VyWzFdIC0gZGRbMV0sIGNvbG91clsyXSAtIGRkWzJdLCBjb2xvdXJbM10gLSBkZFszXV07XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJ1bnBhY2tcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBVbnBhY2sgNGZsb2F0IHJnYmEgKDAuMC0xLjAsIDAuMC0xLjAsIDAuMC0xLjAsIDAuMC0xLjApIHRvIDFmbG9hdCAoMC4wLTEuMClcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiB1bnBhY2soY29sb3VyKSB7XG4gICAgICAgICAgICB2YXIgYml0U2hpZnRzID0gWzEuMCwgMS4wIC8gMjU1LjAsIDEuMCAvICgyNTUuMCAqIDI1NS4wKSwgMS4wIC8gKDI1NS4wICogMjU1LjAgKiAyNTUuMCldO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZG90NChjb2xvdXIsIGJpdFNoaWZ0cyk7XG4gICAgICAgIH1cbiAgICB9XSwgW3tcbiAgICAgICAga2V5OiBcImdldFdlYkdMQ29udGV4dEZyb21DYW52YXNcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBnZXRXZWJHTENvbnRleHRGcm9tQ2FudmFzXG4gICAgICAgICAqIEBwYXJhbSB7SFRNTENhbnZhc0VsZW1lbnR9IGNhbnZhc1xuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gY3R4T3B0XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0V2ViR0xDb250ZXh0RnJvbUNhbnZhcyhjYW52YXMsIGN0eE9wdCkge1xuICAgICAgICAgICAgdmFyIGdsID0gbnVsbDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKGN0eE9wdCA9PT0gdW5kZWZpbmVkIHx8IGN0eE9wdCA9PT0gbnVsbCkgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsMlwiKTtlbHNlIGdsID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbDJcIiwgY3R4T3B0KTtcblxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGdsID09IG51bGwgPyBcIm5vIHdlYmdsMlwiIDogXCJ1c2luZyB3ZWJnbDJcIik7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgZ2wgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGdsID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3R4T3B0ID09PSB1bmRlZmluZWQgfHwgY3R4T3B0ID09PSBudWxsKSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiZXhwZXJpbWVudGFsLXdlYmdsMlwiKTtlbHNlIGdsID0gY2FudmFzLmdldENvbnRleHQoXCJleHBlcmltZW50YWwtd2ViZ2wyXCIsIGN0eE9wdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZ2wgPT0gbnVsbCA/IFwibm8gZXhwZXJpbWVudGFsLXdlYmdsMlwiIDogXCJ1c2luZyBleHBlcmltZW50YWwtd2ViZ2wyXCIpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZ2wgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChnbCA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN0eE9wdCA9PT0gdW5kZWZpbmVkIHx8IGN0eE9wdCA9PT0gbnVsbCkgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsXCIpO2Vsc2UgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsXCIsIGN0eE9wdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZ2wgPT0gbnVsbCA/IFwibm8gd2ViZ2xcIiA6IFwidXNpbmcgd2ViZ2xcIik7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBnbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGdsID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3R4T3B0ID09PSB1bmRlZmluZWQgfHwgY3R4T3B0ID09PSBudWxsKSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiZXhwZXJpbWVudGFsLXdlYmdsXCIpO2Vsc2UgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcImV4cGVyaW1lbnRhbC13ZWJnbFwiLCBjdHhPcHQpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGdsID09IG51bGwgPyBcIm5vIGV4cGVyaW1lbnRhbC13ZWJnbFwiIDogXCJ1c2luZyBleHBlcmltZW50YWwtd2ViZ2xcIik7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBnbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGdsID09IG51bGwpIGdsID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gZ2w7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJnZXRVaW50OEFycmF5RnJvbUhUTUxJbWFnZUVsZW1lbnRcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgVWludDhBcnJheSBmcm9tIEhUTUxJbWFnZUVsZW1lbnRcbiAgICAgICAgICogQHBhcmFtIHtIVE1MSW1hZ2VFbGVtZW50fSBpbWFnZUVsZW1lbnRcbiAgICAgICAgICogQHJldHVybnMge1VpbnQ4Q2xhbXBlZEFycmF5fVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldFVpbnQ4QXJyYXlGcm9tSFRNTEltYWdlRWxlbWVudChpbWFnZUVsZW1lbnQpIHtcbiAgICAgICAgICAgIHZhciBlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgICAgICBlLndpZHRoID0gaW1hZ2VFbGVtZW50LndpZHRoO1xuICAgICAgICAgICAgZS5oZWlnaHQgPSBpbWFnZUVsZW1lbnQuaGVpZ2h0O1xuICAgICAgICAgICAgdmFyIGN0eDJEX3RleCA9IGUuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgICAgICAgICAgY3R4MkRfdGV4LmRyYXdJbWFnZShpbWFnZUVsZW1lbnQsIDAsIDApO1xuICAgICAgICAgICAgdmFyIGFycmF5VGV4ID0gY3R4MkRfdGV4LmdldEltYWdlRGF0YSgwLCAwLCBpbWFnZUVsZW1lbnQud2lkdGgsIGltYWdlRWxlbWVudC5oZWlnaHQpO1xuXG4gICAgICAgICAgICByZXR1cm4gYXJyYXlUZXguZGF0YTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImRvdDRcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEb3QgcHJvZHVjdCB2ZWN0b3I0ZmxvYXRcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBkb3Q0KHZlY3RvcjRBLCB2ZWN0b3I0Qikge1xuICAgICAgICAgICAgcmV0dXJuIHZlY3RvcjRBWzBdICogdmVjdG9yNEJbMF0gKyB2ZWN0b3I0QVsxXSAqIHZlY3RvcjRCWzFdICsgdmVjdG9yNEFbMl0gKiB2ZWN0b3I0QlsyXSArIHZlY3RvcjRBWzNdICogdmVjdG9yNEJbM107XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJmcmFjdFwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbXB1dGUgdGhlIGZyYWN0aW9uYWwgcGFydCBvZiB0aGUgYXJndW1lbnQuIGZyYWN0KHBpKT0wLjE0MTU5MjY1Li4uXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZnJhY3QobnVtYmVyKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVtYmVyID4gMCA/IG51bWJlciAtIE1hdGguZmxvb3IobnVtYmVyKSA6IG51bWJlciAtIE1hdGguY2VpbChudW1iZXIpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwicGFja0dMU0xGdW5jdGlvblN0cmluZ1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBwYWNrIEdMU0wgZnVuY3Rpb24gc3RyaW5nXG4gICAgICAgICAqIEByZXR1cm5zIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcGFja0dMU0xGdW5jdGlvblN0cmluZygpIHtcbiAgICAgICAgICAgIHJldHVybiAndmVjNCBwYWNrIChmbG9hdCBkZXB0aCkge1xcbicgKyAnY29uc3QgdmVjNCBiaWFzID0gdmVjNCgxLjAgLyAyNTUuMCxcXG4nICsgJzEuMCAvIDI1NS4wLFxcbicgKyAnMS4wIC8gMjU1LjAsXFxuJyArICcwLjApO1xcbicgKyAnZmxvYXQgciA9IGRlcHRoO1xcbicgKyAnZmxvYXQgZyA9IGZyYWN0KHIgKiAyNTUuMCk7XFxuJyArICdmbG9hdCBiID0gZnJhY3QoZyAqIDI1NS4wKTtcXG4nICsgJ2Zsb2F0IGEgPSBmcmFjdChiICogMjU1LjApO1xcbicgKyAndmVjNCBjb2xvdXIgPSB2ZWM0KHIsIGcsIGIsIGEpO1xcbicgKyAncmV0dXJuIGNvbG91ciAtIChjb2xvdXIueXp3dyAqIGJpYXMpO1xcbicgKyAnfVxcbic7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJ1bnBhY2tHTFNMRnVuY3Rpb25TdHJpbmdcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgdW5wYWNrIEdMU0wgZnVuY3Rpb24gc3RyaW5nXG4gICAgICAgICAqIEByZXR1cm5zIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gdW5wYWNrR0xTTEZ1bmN0aW9uU3RyaW5nKCkge1xuICAgICAgICAgICAgcmV0dXJuICdmbG9hdCB1bnBhY2sgKHZlYzQgY29sb3VyKSB7XFxuJyArICdjb25zdCB2ZWM0IGJpdFNoaWZ0cyA9IHZlYzQoMS4wLFxcbicgKyAnMS4wIC8gMjU1LjAsXFxuJyArICcxLjAgLyAoMjU1LjAgKiAyNTUuMCksXFxuJyArICcxLjAgLyAoMjU1LjAgKiAyNTUuMCAqIDI1NS4wKSk7XFxuJyArICdyZXR1cm4gZG90KGNvbG91ciwgYml0U2hpZnRzKTtcXG4nICsgJ31cXG4nO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZ2V0T3V0cHV0QnVmZmVyc1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGdldE91dHB1dEJ1ZmZlcnNcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMS2VybmVsfFdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW19IHByb2dcbiAgICAgICAgICogQHBhcmFtIHtBcnJheTxXZWJDTEdMQnVmZmVyPn0gYnVmZmVyc1xuICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXk8V2ViQ0xHTEJ1ZmZlcj59XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0T3V0cHV0QnVmZmVycyhwcm9nLCBidWZmZXJzKSB7XG4gICAgICAgICAgICB2YXIgb3V0cHV0QnVmZiA9IG51bGw7XG4gICAgICAgICAgICBpZiAocHJvZy5vdXRwdXQgIT09IHVuZGVmaW5lZCAmJiBwcm9nLm91dHB1dCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG91dHB1dEJ1ZmYgPSBbXTtcbiAgICAgICAgICAgICAgICBpZiAocHJvZy5vdXRwdXRbMF0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8IHByb2cub3V0cHV0Lmxlbmd0aDsgbisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2lmKGJ1ZmZlcnMuaGFzT3duUHJvcGVydHkocHJvZy5vdXRwdXRbbl0pID09IGZhbHNlICYmIF9hbGVydGVkID09IGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgX2FsZXJ0ZWQgPSB0cnVlLCBhbGVydChcIm91dHB1dCBhcmd1bWVudCBcIitwcm9nLm91dHB1dFtuXStcIiBub3QgZm91bmQgaW4gYnVmZmVycy4gYWRkIGRlc2lyZWQgYXJndW1lbnQgYXMgc2hhcmVkXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXRCdWZmW25dID0gYnVmZmVyc1twcm9nLm91dHB1dFtuXV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Ugb3V0cHV0QnVmZiA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0QnVmZjtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInBhcnNlU291cmNlXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogcGFyc2VTb3VyY2VcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IHNvdXJjZVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gdmFsdWVzXG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNHTDJcbiAgICAgICAgICogQHJldHVybnMge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBwYXJzZVNvdXJjZShzb3VyY2UsIHZhbHVlcywgaXNHTDIpIHtcbiAgICAgICAgICAgIHZhciB0ZXhTdHIgPSBpc0dMMiA9PT0gdHJ1ZSA/IFwidGV4dHVyZVwiIDogXCJ0ZXh0dXJlMkRcIjtcblxuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHZhbHVlcykge1xuICAgICAgICAgICAgICAgIHZhciByZWdleHAgPSBuZXcgUmVnRXhwKGtleSArIFwiXFxcXFsoPyFcXFxcZCkuKj9cXFxcXVwiLCBcImdtXCIpOyAvLyBhdm9pZCBub3JtYWwgdW5pZm9ybSBhcnJheXNcbiAgICAgICAgICAgICAgICB2YXIgdmFyTWF0Y2hlcyA9IHNvdXJjZS5tYXRjaChyZWdleHApOyAvLyBcIlNlYXJjaCBjdXJyZW50IFwiYXJnTmFtZVwiIGluIHNvdXJjZSBhbmQgc3RvcmUgaW4gYXJyYXkgdmFyTWF0Y2hlc1xuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2codmFyTWF0Y2hlcyk7XG4gICAgICAgICAgICAgICAgaWYgKHZhck1hdGNoZXMgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBuQiA9IDAsIGZCID0gdmFyTWF0Y2hlcy5sZW5ndGg7IG5CIDwgZkI7IG5CKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZvciBlYWNoIHZhck1hdGNoZXMgKFwiQVt4XVwiLCBcIkFbeF1cIilcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZWdleHBOYXRpdmVHTCA9IG5ldyBSZWdFeHAoJ2BgYChcXHN8XFx0KSpnbC4qJyArIHZhck1hdGNoZXNbbkJdICsgJy4qYGBgW15gYGAoXFxzfFxcdCkqZ2xdJywgXCJnbVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZWdleHBOYXRpdmVHTE1hdGNoZXMgPSBzb3VyY2UubWF0Y2gocmVnZXhwTmF0aXZlR0wpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlZ2V4cE5hdGl2ZUdMTWF0Y2hlcyA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWUgPSB2YXJNYXRjaGVzW25CXS5zcGxpdCgnWycpWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YXJpID0gdmFyTWF0Y2hlc1tuQl0uc3BsaXQoJ1snKVsxXS5zcGxpdCgnXScpWzBdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1hcCA9IHsgJ2Zsb2F0NF9mcm9tU2FtcGxlcic6IHNvdXJjZS5yZXBsYWNlKG5hbWUgKyBcIltcIiArIHZhcmkgKyBcIl1cIiwgdGV4U3RyICsgJygnICsgbmFtZSArICcsJyArIHZhcmkgKyAnKScpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZmxvYXRfZnJvbVNhbXBsZXInOiBzb3VyY2UucmVwbGFjZShuYW1lICsgXCJbXCIgKyB2YXJpICsgXCJdXCIsIHRleFN0ciArICcoJyArIG5hbWUgKyAnLCcgKyB2YXJpICsgJykueCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZmxvYXQ0X2Zyb21BdHRyJzogc291cmNlLnJlcGxhY2UobmFtZSArIFwiW1wiICsgdmFyaSArIFwiXVwiLCBuYW1lKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0X2Zyb21BdHRyJzogc291cmNlLnJlcGxhY2UobmFtZSArIFwiW1wiICsgdmFyaSArIFwiXVwiLCBuYW1lKSB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZSA9IG1hcFt2YWx1ZXNba2V5XS50eXBlXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNvdXJjZSA9IHNvdXJjZS5yZXBsYWNlKC9gYGAoXFxzfFxcdCkqZ2wvZ2ksIFwiXCIpLnJlcGxhY2UoL2BgYC9naSwgXCJcIikucmVwbGFjZSgvOy9naSwgXCI7XFxuXCIpLnJlcGxhY2UoL30vZ2ksIFwifVxcblwiKS5yZXBsYWNlKC97L2dpLCBcIntcXG5cIik7XG4gICAgICAgICAgICByZXR1cm4gc291cmNlO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwibGluZXNfdmVydGV4X2F0dHJzXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogbGluZXNfdmVydGV4X2F0dHJzXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZXNcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBpc0dMMlxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGxpbmVzX3ZlcnRleF9hdHRycyh2YWx1ZXMsIGlzR0wyKSB7XG4gICAgICAgICAgICB2YXIgYXR0clN0ciA9IGlzR0wyID09PSB0cnVlID8gXCJpblwiIDogXCJhdHRyaWJ1dGVcIjtcblxuICAgICAgICAgICAgdmFyIHN0ciA9ICcnO1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHZhbHVlcykge1xuICAgICAgICAgICAgICAgIHN0ciArPSB7ICdmbG9hdDRfZnJvbVNhbXBsZXInOiAndW5pZm9ybSBzYW1wbGVyMkQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0X2Zyb21TYW1wbGVyJzogJ3VuaWZvcm0gc2FtcGxlcjJEICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdDRfZnJvbUF0dHInOiBhdHRyU3RyICsgJyB2ZWM0ICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdF9mcm9tQXR0cic6IGF0dHJTdHIgKyAnIGZsb2F0ICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdCc6ICd1bmlmb3JtIGZsb2F0ICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdDQnOiAndW5pZm9ybSB2ZWM0ICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdtYXQ0JzogJ3VuaWZvcm0gbWF0NCAnICsga2V5ICsgJzsnIH1bdmFsdWVzW2tleV0udHlwZV0gKyAnXFxuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJsaW5lc19mcmFnbWVudF9hdHRyc1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGxpbmVzX2ZyYWdtZW50X2F0dHJzXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZXNcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBsaW5lc19mcmFnbWVudF9hdHRycyh2YWx1ZXMpIHtcbiAgICAgICAgICAgIHZhciBzdHIgPSAnJztcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB2YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0geyAnZmxvYXQ0X2Zyb21TYW1wbGVyJzogJ3VuaWZvcm0gc2FtcGxlcjJEICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdF9mcm9tU2FtcGxlcic6ICd1bmlmb3JtIHNhbXBsZXIyRCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXQnOiAndW5pZm9ybSBmbG9hdCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXQ0JzogJ3VuaWZvcm0gdmVjNCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnbWF0NCc6ICd1bmlmb3JtIG1hdDQgJyArIGtleSArICc7JyB9W3ZhbHVlc1trZXldLnR5cGVdICsgJ1xcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwibGluZXNfZHJhd0J1ZmZlcnNJbml0XCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogbGluZXNfZHJhd0J1ZmZlcnNJbml0XG4gICAgICAgICAqIEBwYXJhbSB7aW50fSBtYXhEcmF3QnVmZmVyc1xuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGxpbmVzX2RyYXdCdWZmZXJzSW5pdChtYXhEcmF3QnVmZmVycykge1xuICAgICAgICAgICAgdmFyIHN0ciA9ICcnO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGZuID0gbWF4RHJhd0J1ZmZlcnM7IG4gPCBmbjsgbisrKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9ICcnICsgJ2Zsb2F0IG91dCcgKyBuICsgJ19mbG9hdCA9IC05OTkuOTk5ODk7XFxuJyArICd2ZWM0IG91dCcgKyBuICsgJ19mbG9hdDQ7XFxuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJsaW5lc19kcmF3QnVmZmVyc1dyaXRlSW5pdF9HTDJcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGxpbmVzX2RyYXdCdWZmZXJzV3JpdGVJbml0X0dMMihtYXhEcmF3QnVmZmVycykge1xuICAgICAgICAgICAgdmFyIHN0ciA9ICcnO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGZuID0gbWF4RHJhd0J1ZmZlcnM7IG4gPCBmbjsgbisrKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9ICcnICsgJ2xheW91dChsb2NhdGlvbiA9ICcgKyBuICsgJykgb3V0IHZlYzQgb3V0Q29sJyArIG4gKyAnO1xcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwibGluZXNfZHJhd0J1ZmZlcnNXcml0ZV9HTDJcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBsaW5lc19kcmF3QnVmZmVyc1dyaXRlXG4gICAgICAgICAqIEBwYXJhbSB7aW50fSBtYXhEcmF3QnVmZmVyc1xuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGxpbmVzX2RyYXdCdWZmZXJzV3JpdGVfR0wyKG1heERyYXdCdWZmZXJzKSB7XG4gICAgICAgICAgICB2YXIgc3RyID0gJyc7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMCwgZm4gPSBtYXhEcmF3QnVmZmVyczsgbiA8IGZuOyBuKyspIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0gJycgKyAnaWYob3V0JyArIG4gKyAnX2Zsb2F0ICE9IC05OTkuOTk5ODkpIG91dENvbCcgKyBuICsgJyA9IHZlYzQob3V0JyArIG4gKyAnX2Zsb2F0LDAuMCwwLjAsMS4wKTtcXG4nICsgJyBlbHNlIG91dENvbCcgKyBuICsgJyA9IG91dCcgKyBuICsgJ19mbG9hdDQ7XFxuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJsaW5lc19kcmF3QnVmZmVyc1dyaXRlXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogbGluZXNfZHJhd0J1ZmZlcnNXcml0ZVxuICAgICAgICAgKiBAcGFyYW0ge2ludH0gbWF4RHJhd0J1ZmZlcnNcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBsaW5lc19kcmF3QnVmZmVyc1dyaXRlKG1heERyYXdCdWZmZXJzKSB7XG4gICAgICAgICAgICB2YXIgc3RyID0gJyc7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMCwgZm4gPSBtYXhEcmF3QnVmZmVyczsgbiA8IGZuOyBuKyspIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0gJycgKyAnaWYob3V0JyArIG4gKyAnX2Zsb2F0ICE9IC05OTkuOTk5ODkpIGdsX0ZyYWdEYXRhWycgKyBuICsgJ10gPSB2ZWM0KG91dCcgKyBuICsgJ19mbG9hdCwwLjAsMC4wLDEuMCk7XFxuJyArICcgZWxzZSBnbF9GcmFnRGF0YVsnICsgbiArICddID0gb3V0JyArIG4gKyAnX2Zsb2F0NDtcXG4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogY2hlY2tBcmdOYW1lSW5pdGlhbGl6YXRpb25cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGluVmFsdWVzXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBhcmdOYW1lXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY2hlY2tBcmdOYW1lSW5pdGlhbGl6YXRpb24oaW5WYWx1ZXMsIGFyZ05hbWUpIHtcbiAgICAgICAgICAgIGlmIChpblZhbHVlcy5oYXNPd25Qcm9wZXJ0eShhcmdOYW1lKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBpblZhbHVlc1thcmdOYW1lXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgXCJ0eXBlXCI6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIFwiZXhwZWN0ZWRNb2RlXCI6IG51bGwsIC8vIFwiQVRUUklCVVRFXCIsIFwiU0FNUExFUlwiLCBcIlVOSUZPUk1cIlxuICAgICAgICAgICAgICAgICAgICBcImxvY2F0aW9uXCI6IG51bGwgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImdldF9nbG9iYWxfaWQzX0dMU0xGdW5jdGlvblN0cmluZ1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGdldF9nbG9iYWxfaWQzX0dMU0xGdW5jdGlvblN0cmluZ1xuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldF9nbG9iYWxfaWQzX0dMU0xGdW5jdGlvblN0cmluZygpIHtcbiAgICAgICAgICAgIHJldHVybiAnJyArICd2ZWMyIGdldF9nbG9iYWxfaWQoZmxvYXQgaWQsIGZsb2F0IGJ1ZmZlcldpZHRoLCBmbG9hdCBnZW9tZXRyeUxlbmd0aCkge1xcbicgKyAnZmxvYXQgdGV4ZWxTaXplID0gMS4wL2J1ZmZlcldpZHRoOycgKyAnZmxvYXQgbnVtID0gKGlkKmdlb21ldHJ5TGVuZ3RoKS9idWZmZXJXaWR0aDsnICsgJ2Zsb2F0IGNvbHVtbiA9IGZyYWN0KG51bSkrKHRleGVsU2l6ZS8yLjApOycgKyAnZmxvYXQgcm93ID0gKGZsb29yKG51bSkvYnVmZmVyV2lkdGgpKyh0ZXhlbFNpemUvMi4wKTsnICsgJ3JldHVybiB2ZWMyKGNvbHVtbiwgcm93KTsnICsgJ31cXG4nO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZ2V0X2dsb2JhbF9pZDJfR0xTTEZ1bmN0aW9uU3RyaW5nXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogZ2V0X2dsb2JhbF9pZDJfR0xTTEZ1bmN0aW9uU3RyaW5nXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0X2dsb2JhbF9pZDJfR0xTTEZ1bmN0aW9uU3RyaW5nKCkge1xuICAgICAgICAgICAgcmV0dXJuICcnICsgJ3ZlYzIgZ2V0X2dsb2JhbF9pZCh2ZWMyIGlkLCBmbG9hdCBidWZmZXJXaWR0aCkge1xcbicgKyAnZmxvYXQgdGV4ZWxTaXplID0gMS4wL2J1ZmZlcldpZHRoOycgKyAnZmxvYXQgY29sdW1uID0gKGlkLngvYnVmZmVyV2lkdGgpKyh0ZXhlbFNpemUvMi4wKTsnICsgJ2Zsb2F0IHJvdyA9IChpZC55L2J1ZmZlcldpZHRoKSsodGV4ZWxTaXplLzIuMCk7JyArICdyZXR1cm4gdmVjMihjb2x1bW4sIHJvdyk7JyArICd9XFxuJztcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBXZWJDTEdMVXRpbHM7XG59KCk7XG5cbmdsb2JhbC5XZWJDTEdMVXRpbHMgPSBXZWJDTEdMVXRpbHM7XG5tb2R1bGUuZXhwb3J0cy5XZWJDTEdMVXRpbHMgPSBXZWJDTEdMVXRpbHM7IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLldlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0gPSB1bmRlZmluZWQ7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KCk7XG5cbnZhciBfV2ViQ0xHTFV0aWxzID0gcmVxdWlyZSgnLi9XZWJDTEdMVXRpbHMuY2xhc3MnKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuLyoqXHJcbiogV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbSBPYmplY3RcclxuKiBAY2xhc3NcclxuICogQHBhcmFtIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGdsXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB2ZXJ0ZXhTb3VyY2VcclxuICogQHBhcmFtIHtTdHJpbmd9IHZlcnRleEhlYWRlclxyXG4gKiBAcGFyYW0ge1N0cmluZ30gZnJhZ21lbnRTb3VyY2VcclxuICogQHBhcmFtIHtTdHJpbmd9IGZyYWdtZW50SGVhZGVyXHJcbiovXG52YXIgV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbSA9IGV4cG9ydHMuV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbSA9IGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtKGdsLCB2ZXJ0ZXhTb3VyY2UsIHZlcnRleEhlYWRlciwgZnJhZ21lbnRTb3VyY2UsIGZyYWdtZW50SGVhZGVyKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtKTtcblxuICAgICAgICB0aGlzLl9nbCA9IGdsO1xuXG4gICAgICAgIHZhciBoaWdoUHJlY2lzaW9uU3VwcG9ydCA9IHRoaXMuX2dsLmdldFNoYWRlclByZWNpc2lvbkZvcm1hdCh0aGlzLl9nbC5GUkFHTUVOVF9TSEFERVIsIHRoaXMuX2dsLkhJR0hfRkxPQVQpO1xuICAgICAgICB0aGlzLl9wcmVjaXNpb24gPSBoaWdoUHJlY2lzaW9uU3VwcG9ydC5wcmVjaXNpb24gIT09IDAgPyAncHJlY2lzaW9uIGhpZ2hwIGZsb2F0O1xcblxcbnByZWNpc2lvbiBoaWdocCBpbnQ7XFxuXFxuJyA6ICdwcmVjaXNpb24gbG93cCBmbG9hdDtcXG5cXG5wcmVjaXNpb24gbG93cCBpbnQ7XFxuXFxuJztcblxuICAgICAgICB0aGlzLnZlcnNpb24gPSB0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgPyBcIiN2ZXJzaW9uIDMwMCBlcyBcXG4gXCIgOiBcIlwiO1xuXG4gICAgICAgIHRoaXMuX2FyckV4dCA9IHRoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCA/IHsgXCJFWFRfY29sb3JfYnVmZmVyX2Zsb2F0XCI6IG51bGwgfSA6IHsgXCJPRVNfdGV4dHVyZV9mbG9hdFwiOiBudWxsLCBcIk9FU190ZXh0dXJlX2Zsb2F0X2xpbmVhclwiOiBudWxsLCBcIk9FU19lbGVtZW50X2luZGV4X3VpbnRcIjogbnVsbCwgXCJXRUJHTF9kcmF3X2J1ZmZlcnNcIjogbnVsbCB9O1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5fYXJyRXh0KSB7XG4gICAgICAgICAgICB0aGlzLl9hcnJFeHRba2V5XSA9IHRoaXMuX2dsLmdldEV4dGVuc2lvbihrZXkpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2FyckV4dFtrZXldID09IG51bGwpIGNvbnNvbGUuZXJyb3IoXCJleHRlbnNpb24gXCIgKyBrZXkgKyBcIiBub3QgYXZhaWxhYmxlXCIpO2Vsc2UgY29uc29sZS5sb2coXCJ1c2luZyBleHRlbnNpb24gXCIgKyBrZXkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5leHREcmF3QnVmZiA9IHRoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCA/IFwiXCIgOiBcIiAjZXh0ZW5zaW9uIEdMX0VYVF9kcmF3X2J1ZmZlcnMgOiByZXF1aXJlXFxuXCI7XG5cbiAgICAgICAgdGhpcy5uYW1lID0gXCJcIjtcbiAgICAgICAgdGhpcy52aWV3U291cmNlID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5pbl92ZXJ0ZXhfdmFsdWVzID0ge307XG4gICAgICAgIHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzID0ge307XG5cbiAgICAgICAgdGhpcy5fdmVydGV4UF9yZWFkeSA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9mcmFnbWVudFBfcmVhZHkgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLl92ZXJ0ZXhIZWFkID0gbnVsbDtcbiAgICAgICAgdGhpcy5fdmVydGV4U291cmNlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZnJhZ21lbnRIZWFkID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZnJhZ21lbnRTb3VyY2UgPSBudWxsO1xuXG4gICAgICAgIHRoaXMub3V0cHV0ID0gbnVsbDsgLy9TdHJpbmcgb3IgQXJyYXk8U3RyaW5nPiBvZiBhcmcgbmFtZXMgd2l0aCB0aGUgaXRlbXMgaW4gc2FtZSBvcmRlciB0aGF0IGluIHRoZSBmaW5hbCByZXR1cm5cbiAgICAgICAgdGhpcy5vdXRwdXRUZW1wTW9kZXMgPSBudWxsO1xuICAgICAgICB0aGlzLmZCdWZmZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmZCdWZmZXJUZW1wID0gbnVsbDtcblxuICAgICAgICB0aGlzLmRyYXdNb2RlID0gNDtcblxuICAgICAgICBpZiAodmVydGV4U291cmNlICE9PSB1bmRlZmluZWQgJiYgdmVydGV4U291cmNlICE9PSBudWxsKSB0aGlzLnNldFZlcnRleFNvdXJjZSh2ZXJ0ZXhTb3VyY2UsIHZlcnRleEhlYWRlcik7XG5cbiAgICAgICAgaWYgKGZyYWdtZW50U291cmNlICE9PSB1bmRlZmluZWQgJiYgZnJhZ21lbnRTb3VyY2UgIT09IG51bGwpIHRoaXMuc2V0RnJhZ21lbnRTb3VyY2UoZnJhZ21lbnRTb3VyY2UsIGZyYWdtZW50SGVhZGVyKTtcbiAgICB9XG5cbiAgICAvKipcclxuICAgICAqIGNvbXBpbGVWZXJ0ZXhGcmFnbWVudFNvdXJjZVxyXG4gICAgICovXG5cblxuICAgIF9jcmVhdGVDbGFzcyhXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtLCBbe1xuICAgICAgICBrZXk6ICdjb21waWxlVmVydGV4RnJhZ21lbnRTb3VyY2UnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY29tcGlsZVZlcnRleEZyYWdtZW50U291cmNlKCkge1xuICAgICAgICAgICAgdmFyIHNvdXJjZVZlcnRleCA9IHRoaXMudmVyc2lvbiArIHRoaXMuX3ByZWNpc2lvbiArICd1bmlmb3JtIGZsb2F0IHVPZmZzZXQ7XFxuJyArICd1bmlmb3JtIGZsb2F0IHVCdWZmZXJXaWR0aDsnICsgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMubGluZXNfdmVydGV4X2F0dHJzKHRoaXMuaW5fdmVydGV4X3ZhbHVlcywgdGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0KSArIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLnVucGFja0dMU0xGdW5jdGlvblN0cmluZygpICsgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuZ2V0X2dsb2JhbF9pZDNfR0xTTEZ1bmN0aW9uU3RyaW5nKCkgKyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5nZXRfZ2xvYmFsX2lkMl9HTFNMRnVuY3Rpb25TdHJpbmcoKSArIHRoaXMuX3ZlcnRleEhlYWQgKyAndm9pZCBtYWluKHZvaWQpIHtcXG4nICsgdGhpcy5fdmVydGV4U291cmNlICsgJ31cXG4nO1xuICAgICAgICAgICAgdmFyIHNvdXJjZUZyYWdtZW50ID0gdGhpcy52ZXJzaW9uICsgdGhpcy5leHREcmF3QnVmZiArIHRoaXMuX3ByZWNpc2lvbiArIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmxpbmVzX2ZyYWdtZW50X2F0dHJzKHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzKSArIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmdldF9nbG9iYWxfaWQzX0dMU0xGdW5jdGlvblN0cmluZygpICsgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuZ2V0X2dsb2JhbF9pZDJfR0xTTEZ1bmN0aW9uU3RyaW5nKCkgKyB0aGlzLl9mcmFnbWVudEhlYWQgKyAodGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0ID8gX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMubGluZXNfZHJhd0J1ZmZlcnNXcml0ZUluaXRfR0wyKDgpIDogXCJcIikgKyAndm9pZCBtYWluKHZvaWQpIHtcXG4nICsgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMubGluZXNfZHJhd0J1ZmZlcnNJbml0KDgpICsgdGhpcy5fZnJhZ21lbnRTb3VyY2UgKyAodGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0ID8gX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMubGluZXNfZHJhd0J1ZmZlcnNXcml0ZV9HTDIoOCkgOiBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5saW5lc19kcmF3QnVmZmVyc1dyaXRlKDgpKSArICd9XFxuJztcblxuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhGcmFnbWVudFByb2dyYW0gPSB0aGlzLl9nbC5jcmVhdGVQcm9ncmFtKCk7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gbmV3IF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzKCkuY3JlYXRlU2hhZGVyKHRoaXMuX2dsLCBcIldFQkNMR0wgVkVSVEVYIEZSQUdNRU5UIFBST0dSQU1cIiwgc291cmNlVmVydGV4LCBzb3VyY2VGcmFnbWVudCwgdGhpcy52ZXJ0ZXhGcmFnbWVudFByb2dyYW0pO1xuXG4gICAgICAgICAgICB0aGlzLnVPZmZzZXQgPSB0aGlzLl9nbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy52ZXJ0ZXhGcmFnbWVudFByb2dyYW0sIFwidU9mZnNldFwiKTtcbiAgICAgICAgICAgIHRoaXMudUJ1ZmZlcldpZHRoID0gdGhpcy5fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMudmVydGV4RnJhZ21lbnRQcm9ncmFtLCBcInVCdWZmZXJXaWR0aFwiKTtcblxuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuaW5fdmVydGV4X3ZhbHVlcykge1xuICAgICAgICAgICAgICAgIHZhciBleHBlY3RlZE1vZGUgPSB7ICdmbG9hdDRfZnJvbVNhbXBsZXInOiBcIlNBTVBMRVJcIixcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0X2Zyb21TYW1wbGVyJzogXCJTQU1QTEVSXCIsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdDRfZnJvbUF0dHInOiBcIkFUVFJJQlVURVwiLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXRfZnJvbUF0dHInOiBcIkFUVFJJQlVURVwiLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXQnOiBcIlVOSUZPUk1cIixcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0NCc6IFwiVU5JRk9STVwiLFxuICAgICAgICAgICAgICAgICAgICAnbWF0NCc6IFwiVU5JRk9STVwiIH1bdGhpcy5pbl92ZXJ0ZXhfdmFsdWVzW2tleV0udHlwZV07XG5cbiAgICAgICAgICAgICAgICBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5jaGVja0FyZ05hbWVJbml0aWFsaXphdGlvbih0aGlzLmluX3ZlcnRleF92YWx1ZXMsIGtleSk7XG4gICAgICAgICAgICAgICAgdmFyIGxvYyA9IGV4cGVjdGVkTW9kZSA9PT0gXCJBVFRSSUJVVEVcIiA/IHRoaXMuX2dsLmdldEF0dHJpYkxvY2F0aW9uKHRoaXMudmVydGV4RnJhZ21lbnRQcm9ncmFtLCBrZXkpIDogdGhpcy5fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMudmVydGV4RnJhZ21lbnRQcm9ncmFtLCBrZXkucmVwbGFjZSgvXFxbXFxkLiovLCBcIlwiKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbl92ZXJ0ZXhfdmFsdWVzW2tleV0ubG9jYXRpb24gPSBbbG9jXTtcbiAgICAgICAgICAgICAgICB0aGlzLmluX3ZlcnRleF92YWx1ZXNba2V5XS5leHBlY3RlZE1vZGUgPSBleHBlY3RlZE1vZGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAodmFyIF9rZXkgaW4gdGhpcy5pbl9mcmFnbWVudF92YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgX2V4cGVjdGVkTW9kZSA9IHsgJ2Zsb2F0NF9mcm9tU2FtcGxlcic6IFwiU0FNUExFUlwiLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXRfZnJvbVNhbXBsZXInOiBcIlNBTVBMRVJcIixcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0JzogXCJVTklGT1JNXCIsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdDQnOiBcIlVOSUZPUk1cIixcbiAgICAgICAgICAgICAgICAgICAgJ21hdDQnOiBcIlVOSUZPUk1cIiB9W3RoaXMuaW5fZnJhZ21lbnRfdmFsdWVzW19rZXldLnR5cGVdO1xuXG4gICAgICAgICAgICAgICAgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuY2hlY2tBcmdOYW1lSW5pdGlhbGl6YXRpb24odGhpcy5pbl9mcmFnbWVudF92YWx1ZXMsIF9rZXkpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzW19rZXldLmxvY2F0aW9uID0gW3RoaXMuX2dsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnZlcnRleEZyYWdtZW50UHJvZ3JhbSwgX2tleS5yZXBsYWNlKC9cXFtcXGQuKi8sIFwiXCIpKV07XG4gICAgICAgICAgICAgICAgdGhpcy5pbl9mcmFnbWVudF92YWx1ZXNbX2tleV0uZXhwZWN0ZWRNb2RlID0gX2V4cGVjdGVkTW9kZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIFwiVkVSVEVYIFBST0dSQU1cXG5cIiArIHNvdXJjZVZlcnRleCArIFwiXFxuIEZSQUdNRU5UIFBST0dSQU1cXG5cIiArIHNvdXJjZUZyYWdtZW50O1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdzZXRWZXJ0ZXhTb3VyY2UnLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVXBkYXRlIHRoZSB2ZXJ0ZXggc291cmNlXHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IHZlcnRleFNvdXJjZVxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSB2ZXJ0ZXhIZWFkZXJcclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHNldFZlcnRleFNvdXJjZSh2ZXJ0ZXhTb3VyY2UsIHZlcnRleEhlYWRlcikge1xuICAgICAgICAgICAgdmFyIGFyZ3VtZW50c1NvdXJjZSA9IHZlcnRleFNvdXJjZS5zcGxpdCgnKScpWzBdLnNwbGl0KCcoJylbMV0uc3BsaXQoJywnKTsgLy8gXCJmbG9hdCogQVwiLCBcImZsb2F0KiBCXCIsIFwiZmxvYXQgQ1wiLCBcImZsb2F0NCogRFwiXG5cbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmID0gYXJndW1lbnRzU291cmNlLmxlbmd0aDsgbiA8IGY7IG4rKykge1xuICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL1xcKmF0dHIvZ20pICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcmdOYW1lID0gYXJndW1lbnRzU291cmNlW25dLnNwbGl0KCcqYXR0cicpWzFdLnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuY2hlY2tBcmdOYW1lSW5pdGlhbGl6YXRpb24odGhpcy5pbl92ZXJ0ZXhfdmFsdWVzLCBhcmdOYW1lKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9mbG9hdDQvZ20pICE9IG51bGwpIHRoaXMuaW5fdmVydGV4X3ZhbHVlc1thcmdOYW1lXS50eXBlID0gJ2Zsb2F0NF9mcm9tQXR0cic7ZWxzZSBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9mbG9hdC9nbSkgIT0gbnVsbCkgdGhpcy5pbl92ZXJ0ZXhfdmFsdWVzW2FyZ05hbWVdLnR5cGUgPSAnZmxvYXRfZnJvbUF0dHInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9cXCovZ20pICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfYXJnTmFtZSA9IGFyZ3VtZW50c1NvdXJjZVtuXS5zcGxpdCgnKicpWzFdLnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuY2hlY2tBcmdOYW1lSW5pdGlhbGl6YXRpb24odGhpcy5pbl92ZXJ0ZXhfdmFsdWVzLCBfYXJnTmFtZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvZmxvYXQ0L2dtKSAhPSBudWxsKSB0aGlzLmluX3ZlcnRleF92YWx1ZXNbX2FyZ05hbWVdLnR5cGUgPSAnZmxvYXQ0X2Zyb21TYW1wbGVyJztlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0L2dtKSAhPSBudWxsKSB0aGlzLmluX3ZlcnRleF92YWx1ZXNbX2FyZ05hbWVdLnR5cGUgPSAnZmxvYXRfZnJvbVNhbXBsZXInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzU291cmNlW25dICE9PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfYXJnTmFtZTIgPSBhcmd1bWVudHNTb3VyY2Vbbl0uc3BsaXQoJyAnKVsxXS50cmltKCk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLmluX3ZlcnRleF92YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXkucmVwbGFjZSgvXFxbXFxkLiovLCBcIlwiKSA9PT0gX2FyZ05hbWUyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2FyZ05hbWUyID0ga2V5OyAvLyBmb3Igbm9ybWFsIHVuaWZvcm0gYXJyYXlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5jaGVja0FyZ05hbWVJbml0aWFsaXphdGlvbih0aGlzLmluX3ZlcnRleF92YWx1ZXMsIF9hcmdOYW1lMik7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvZmxvYXQ0L2dtKSAhPSBudWxsKSB0aGlzLmluX3ZlcnRleF92YWx1ZXNbX2FyZ05hbWUyXS50eXBlID0gJ2Zsb2F0NCc7ZWxzZSBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9mbG9hdC9nbSkgIT0gbnVsbCkgdGhpcy5pbl92ZXJ0ZXhfdmFsdWVzW19hcmdOYW1lMl0udHlwZSA9ICdmbG9hdCc7ZWxzZSBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9tYXQ0L2dtKSAhPSBudWxsKSB0aGlzLmluX3ZlcnRleF92YWx1ZXNbX2FyZ05hbWUyXS50eXBlID0gJ21hdDQnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gcGFyc2UgaGVhZGVyXG4gICAgICAgICAgICB0aGlzLl92ZXJ0ZXhIZWFkID0gdmVydGV4SGVhZGVyICE9PSB1bmRlZmluZWQgJiYgdmVydGV4SGVhZGVyICE9PSBudWxsID8gdmVydGV4SGVhZGVyIDogJyc7XG4gICAgICAgICAgICB0aGlzLl92ZXJ0ZXhIZWFkID0gdGhpcy5fdmVydGV4SGVhZC5yZXBsYWNlKC9cXHJcXG4vZ2ksICcnKS5yZXBsYWNlKC9cXHIvZ2ksICcnKS5yZXBsYWNlKC9cXG4vZ2ksICcnKTtcbiAgICAgICAgICAgIHRoaXMuX3ZlcnRleEhlYWQgPSBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5wYXJzZVNvdXJjZSh0aGlzLl92ZXJ0ZXhIZWFkLCB0aGlzLmluX3ZlcnRleF92YWx1ZXMsIHRoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCk7XG5cbiAgICAgICAgICAgIC8vIHBhcnNlIHNvdXJjZVxuICAgICAgICAgICAgdGhpcy5fdmVydGV4U291cmNlID0gdmVydGV4U291cmNlLnJlcGxhY2UoL1xcclxcbi9naSwgJycpLnJlcGxhY2UoL1xcci9naSwgJycpLnJlcGxhY2UoL1xcbi9naSwgJycpO1xuICAgICAgICAgICAgdGhpcy5fdmVydGV4U291cmNlID0gdGhpcy5fdmVydGV4U291cmNlLnJlcGxhY2UoL15cXHcqIFxcdypcXChbXFx3XFxzXFwqLF0qXFwpIHsvZ2ksICcnKS5yZXBsYWNlKC99KFxcc3xcXHQpKiQvZ2ksICcnKTtcbiAgICAgICAgICAgIHRoaXMuX3ZlcnRleFNvdXJjZSA9IF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLnBhcnNlU291cmNlKHRoaXMuX3ZlcnRleFNvdXJjZSwgdGhpcy5pbl92ZXJ0ZXhfdmFsdWVzLCB0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQpO1xuXG4gICAgICAgICAgICB0aGlzLl92ZXJ0ZXhQX3JlYWR5ID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9mcmFnbWVudFBfcmVhZHkgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdHMgPSB0aGlzLmNvbXBpbGVWZXJ0ZXhGcmFnbWVudFNvdXJjZSgpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudmlld1NvdXJjZSA9PT0gdHJ1ZSkgY29uc29sZS5sb2coJyVjIFZGUDogJyArIHRoaXMubmFtZSwgJ2ZvbnQtc2l6ZTogMjBweDsgY29sb3I6IGdyZWVuJyksIGNvbnNvbGUubG9nKCclYyBXRUJDTEdMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJywgJ2NvbG9yOiBncmF5JyksIGNvbnNvbGUubG9nKCclYyAnICsgdmVydGV4SGVhZGVyICsgdmVydGV4U291cmNlLCAnY29sb3I6IGdyYXknKSwgY29uc29sZS5sb2coJyVjIFRSQU5TTEFURUQgV0VCR0wgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJywgJ2NvbG9yOiBkYXJrZ3JheScpLCBjb25zb2xlLmxvZygnJWMgJyArIHRzLCAnY29sb3I6IGRhcmtncmF5Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ3NldEZyYWdtZW50U291cmNlJyxcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFVwZGF0ZSB0aGUgZnJhZ21lbnQgc291cmNlXHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGZyYWdtZW50U291cmNlXHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGZyYWdtZW50SGVhZGVyXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRGcmFnbWVudFNvdXJjZShmcmFnbWVudFNvdXJjZSwgZnJhZ21lbnRIZWFkZXIpIHtcbiAgICAgICAgICAgIHZhciBhcmd1bWVudHNTb3VyY2UgPSBmcmFnbWVudFNvdXJjZS5zcGxpdCgnKScpWzBdLnNwbGl0KCcoJylbMV0uc3BsaXQoJywnKTsgLy8gXCJmbG9hdCogQVwiLCBcImZsb2F0KiBCXCIsIFwiZmxvYXQgQ1wiLCBcImZsb2F0NCogRFwiXG5cbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmID0gYXJndW1lbnRzU291cmNlLmxlbmd0aDsgbiA8IGY7IG4rKykge1xuICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL1xcKi9nbSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFyZ05hbWUgPSBhcmd1bWVudHNTb3VyY2Vbbl0uc3BsaXQoJyonKVsxXS50cmltKCk7XG4gICAgICAgICAgICAgICAgICAgIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uKHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzLCBhcmdOYW1lKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9mbG9hdDQvZ20pICE9IG51bGwpIHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzW2FyZ05hbWVdLnR5cGUgPSAnZmxvYXQ0X2Zyb21TYW1wbGVyJztlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0L2dtKSAhPSBudWxsKSB0aGlzLmluX2ZyYWdtZW50X3ZhbHVlc1thcmdOYW1lXS50eXBlID0gJ2Zsb2F0X2Zyb21TYW1wbGVyJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXSAhPT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgX2FyZ05hbWUzID0gYXJndW1lbnRzU291cmNlW25dLnNwbGl0KCcgJylbMV0udHJpbSgpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5pbl9mcmFnbWVudF92YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXkucmVwbGFjZSgvXFxbXFxkLiovLCBcIlwiKSA9PT0gX2FyZ05hbWUzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2FyZ05hbWUzID0ga2V5OyAvLyBmb3Igbm9ybWFsIHVuaWZvcm0gYXJyYXlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5jaGVja0FyZ05hbWVJbml0aWFsaXphdGlvbih0aGlzLmluX2ZyYWdtZW50X3ZhbHVlcywgX2FyZ05hbWUzKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9mbG9hdDQvZ20pICE9IG51bGwpIHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzW19hcmdOYW1lM10udHlwZSA9ICdmbG9hdDQnO2Vsc2UgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvZmxvYXQvZ20pICE9IG51bGwpIHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzW19hcmdOYW1lM10udHlwZSA9ICdmbG9hdCc7ZWxzZSBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9tYXQ0L2dtKSAhPSBudWxsKSB0aGlzLmluX2ZyYWdtZW50X3ZhbHVlc1tfYXJnTmFtZTNdLnR5cGUgPSAnbWF0NCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBwYXJzZSBoZWFkZXJcbiAgICAgICAgICAgIHRoaXMuX2ZyYWdtZW50SGVhZCA9IGZyYWdtZW50SGVhZGVyICE9PSB1bmRlZmluZWQgJiYgZnJhZ21lbnRIZWFkZXIgIT09IG51bGwgPyBmcmFnbWVudEhlYWRlciA6ICcnO1xuICAgICAgICAgICAgdGhpcy5fZnJhZ21lbnRIZWFkID0gdGhpcy5fZnJhZ21lbnRIZWFkLnJlcGxhY2UoL1xcclxcbi9naSwgJycpLnJlcGxhY2UoL1xcci9naSwgJycpLnJlcGxhY2UoL1xcbi9naSwgJycpO1xuICAgICAgICAgICAgdGhpcy5fZnJhZ21lbnRIZWFkID0gX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMucGFyc2VTb3VyY2UodGhpcy5fZnJhZ21lbnRIZWFkLCB0aGlzLmluX2ZyYWdtZW50X3ZhbHVlcywgdGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0KTtcblxuICAgICAgICAgICAgLy8gcGFyc2Ugc291cmNlXG4gICAgICAgICAgICB0aGlzLl9mcmFnbWVudFNvdXJjZSA9IGZyYWdtZW50U291cmNlLnJlcGxhY2UoL1xcclxcbi9naSwgJycpLnJlcGxhY2UoL1xcci9naSwgJycpLnJlcGxhY2UoL1xcbi9naSwgJycpO1xuICAgICAgICAgICAgdGhpcy5fZnJhZ21lbnRTb3VyY2UgPSB0aGlzLl9mcmFnbWVudFNvdXJjZS5yZXBsYWNlKC9eXFx3KiBcXHcqXFwoW1xcd1xcc1xcKixdKlxcKSB7L2dpLCAnJykucmVwbGFjZSgvfShcXHN8XFx0KSokL2dpLCAnJyk7XG4gICAgICAgICAgICB0aGlzLl9mcmFnbWVudFNvdXJjZSA9IF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLnBhcnNlU291cmNlKHRoaXMuX2ZyYWdtZW50U291cmNlLCB0aGlzLmluX2ZyYWdtZW50X3ZhbHVlcywgdGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0KTtcblxuICAgICAgICAgICAgdGhpcy5fZnJhZ21lbnRQX3JlYWR5ID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICh0aGlzLl92ZXJ0ZXhQX3JlYWR5ID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRzID0gdGhpcy5jb21waWxlVmVydGV4RnJhZ21lbnRTb3VyY2UoKTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnZpZXdTb3VyY2UgPT09IHRydWUpIGNvbnNvbGUubG9nKCclYyBWRlA6ICcsICdmb250LXNpemU6IDIwcHg7IGNvbG9yOiBncmVlbicpLCBjb25zb2xlLmxvZygnJWMgV0VCQ0xHTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScsICdjb2xvcjogZ3JheScpLCBjb25zb2xlLmxvZygnJWMgJyArIGZyYWdtZW50SGVhZGVyICsgZnJhZ21lbnRTb3VyY2UsICdjb2xvcjogZ3JheScpLCBjb25zb2xlLmxvZygnJWMgVFJBTlNMQVRFRCBXRUJHTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nLCAnY29sb3I6IGRhcmtncmF5JyksIGNvbnNvbGUubG9nKCclYyAnICsgdHMsICdjb2xvcjogZGFya2dyYXknKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtO1xufSgpO1xuXG5nbG9iYWwuV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbSA9IFdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW07XG5tb2R1bGUuZXhwb3J0cy5XZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtID0gV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbTsiXX0=
