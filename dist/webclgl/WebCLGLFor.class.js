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

},{"./WebCLGLBuffer.class":2,"./WebCLGLKernel.class":4,"./WebCLGLUtils.class":5,"./WebCLGLVertexFragmentProgram.class":6}],2:[function(require,module,exports){
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
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.WebCLGLFor = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.gpufor = gpufor;

var _WebCLGL = require("./WebCLGL.class");

var _WebCLGLUtils = require("./WebCLGLUtils.class");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
    if (arguments[0] instanceof WebGLRenderingContext || arguments[0] instanceof WebGL2RenderingContext) {
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

},{"./WebCLGLUtils.class":5}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{"./WebCLGLUtils.class":5}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvd2ViY2xnbC9XZWJDTEdMLmNsYXNzLmpzIiwic3JjL3dlYmNsZ2wvV2ViQ0xHTEJ1ZmZlci5jbGFzcy5qcyIsInNyYy93ZWJjbGdsL1dlYkNMR0xGb3IuY2xhc3MuanMiLCJzcmMvd2ViY2xnbC9XZWJDTEdMS2VybmVsLmNsYXNzLmpzIiwic3JjL3dlYmNsZ2wvV2ViQ0xHTFV0aWxzLmNsYXNzLmpzIiwic3JjL3dlYmNsZ2wvV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbS5jbGFzcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDNWpCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3BQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3gxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ2xKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUN2ZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc31yZXR1cm4gZX0pKCkiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5XZWJDTEdMID0gdW5kZWZpbmVkO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpOyAvKlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVGhlIE1JVCBMaWNlbnNlIChNSVQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIENvcHlyaWdodCAoYykgPDIwMTM+IDxSb2JlcnRvIEdvbnphbGV6LiBodHRwOi8vc3Rvcm1jb2xvdXIuYXBwc3BvdC5jb20vPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUSEUgU09GVFdBUkUuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cblxudmFyIF9XZWJDTEdMQnVmZmVyID0gcmVxdWlyZShcIi4vV2ViQ0xHTEJ1ZmZlci5jbGFzc1wiKTtcblxudmFyIF9XZWJDTEdMS2VybmVsID0gcmVxdWlyZShcIi4vV2ViQ0xHTEtlcm5lbC5jbGFzc1wiKTtcblxudmFyIF9XZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtID0gcmVxdWlyZShcIi4vV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbS5jbGFzc1wiKTtcblxudmFyIF9XZWJDTEdMVXRpbHMgPSByZXF1aXJlKFwiLi9XZWJDTEdMVXRpbHMuY2xhc3NcIik7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbi8qKlxyXG4qIENsYXNzIGZvciBwYXJhbGxlbGl6YXRpb24gb2YgY2FsY3VsYXRpb25zIHVzaW5nIHRoZSBXZWJHTCBjb250ZXh0IHNpbWlsYXJseSB0byB3ZWJjbFxyXG4qIEBjbGFzc1xyXG4qIEBwYXJhbSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBbd2ViZ2xjb250ZXh0PW51bGxdXHJcbiovXG52YXIgV2ViQ0xHTCA9IGV4cG9ydHMuV2ViQ0xHTCA9IGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBXZWJDTEdMKHdlYmdsY29udGV4dCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBXZWJDTEdMKTtcblxuICAgICAgICB0aGlzLnV0aWxzID0gbmV3IF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzKCk7XG5cbiAgICAgICAgdGhpcy5fZ2wgPSBudWxsO1xuICAgICAgICB0aGlzLmUgPSBudWxsO1xuICAgICAgICBpZiAod2ViZ2xjb250ZXh0ID09PSB1bmRlZmluZWQgfHwgd2ViZ2xjb250ZXh0ID09PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgICAgIHRoaXMuZS53aWR0aCA9IDMyO1xuICAgICAgICAgICAgdGhpcy5lLmhlaWdodCA9IDMyO1xuICAgICAgICAgICAgdGhpcy5fZ2wgPSBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5nZXRXZWJHTENvbnRleHRGcm9tQ2FudmFzKHRoaXMuZSwgeyBhbnRpYWxpYXM6IGZhbHNlIH0pO1xuICAgICAgICB9IGVsc2UgdGhpcy5fZ2wgPSB3ZWJnbGNvbnRleHQ7XG5cbiAgICAgICAgdmFyIGhpZ2hQcmVjaXNpb25TdXBwb3J0ID0gdGhpcy5fZ2wuZ2V0U2hhZGVyUHJlY2lzaW9uRm9ybWF0KHRoaXMuX2dsLkZSQUdNRU5UX1NIQURFUiwgdGhpcy5fZ2wuSElHSF9GTE9BVCk7XG4gICAgICAgIHRoaXMuX3ByZWNpc2lvbiA9IGhpZ2hQcmVjaXNpb25TdXBwb3J0LnByZWNpc2lvbiAhPT0gMCA/ICdwcmVjaXNpb24gaGlnaHAgZmxvYXQ7XFxuXFxucHJlY2lzaW9uIGhpZ2hwIGludDtcXG5cXG4nIDogJ3ByZWNpc2lvbiBsb3dwIGZsb2F0O1xcblxcbnByZWNpc2lvbiBsb3dwIGludDtcXG5cXG4nO1xuXG4gICAgICAgIHRoaXMudmVyc2lvbiA9IHRoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCA/IFwiI3ZlcnNpb24gMzAwIGVzIFxcbiBcIiA6IFwiXCI7XG5cbiAgICAgICAgdGhpcy5fYXJyRXh0ID0gdGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0ID8geyBcIkVYVF9jb2xvcl9idWZmZXJfZmxvYXRcIjogbnVsbCB9IDogeyBcIk9FU190ZXh0dXJlX2Zsb2F0XCI6IG51bGwsIFwiT0VTX3RleHR1cmVfZmxvYXRfbGluZWFyXCI6IG51bGwsIFwiT0VTX2VsZW1lbnRfaW5kZXhfdWludFwiOiBudWxsLCBcIldFQkdMX2RyYXdfYnVmZmVyc1wiOiBudWxsIH07XG4gICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLl9hcnJFeHQpIHtcbiAgICAgICAgICAgIHRoaXMuX2FyckV4dFtrZXldID0gdGhpcy5fZ2wuZ2V0RXh0ZW5zaW9uKGtleSk7XG4gICAgICAgICAgICBpZiAodGhpcy5fYXJyRXh0W2tleV0gPT0gbnVsbCkgY29uc29sZS5lcnJvcihcImV4dGVuc2lvbiBcIiArIGtleSArIFwiIG5vdCBhdmFpbGFibGVcIik7ZWxzZSBjb25zb2xlLmxvZyhcInVzaW5nIGV4dGVuc2lvbiBcIiArIGtleSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmV4dERyYXdCdWZmID0gdGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0ID8gXCJcIiA6IFwiICNleHRlbnNpb24gR0xfRVhUX2RyYXdfYnVmZmVycyA6IHJlcXVpcmVcXG5cIjtcblxuICAgICAgICB0aGlzLl9tYXhEcmF3QnVmZmVycyA9IDg7XG4gICAgICAgIHRoaXMuX2N1cnJlbnRUZXh0dXJlVW5pdCA9IDA7XG4gICAgICAgIHRoaXMuX2J1ZmZlcldpZHRoID0gMDtcblxuICAgICAgICAvLyBRVUFEXG4gICAgICAgIHZhciBtZXNoID0gdGhpcy51dGlscy5sb2FkUXVhZCh1bmRlZmluZWQsIDEuMCwgMS4wKTtcbiAgICAgICAgdGhpcy52ZXJ0ZXhCdWZmZXJfUVVBRCA9IHRoaXMuX2dsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkFSUkFZX0JVRkZFUiwgdGhpcy52ZXJ0ZXhCdWZmZXJfUVVBRCk7XG4gICAgICAgIHRoaXMuX2dsLmJ1ZmZlckRhdGEodGhpcy5fZ2wuQVJSQVlfQlVGRkVSLCBuZXcgRmxvYXQzMkFycmF5KG1lc2gudmVydGV4QXJyYXkpLCB0aGlzLl9nbC5TVEFUSUNfRFJBVyk7XG4gICAgICAgIHRoaXMuaW5kZXhCdWZmZXJfUVVBRCA9IHRoaXMuX2dsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCB0aGlzLmluZGV4QnVmZmVyX1FVQUQpO1xuICAgICAgICB0aGlzLl9nbC5idWZmZXJEYXRhKHRoaXMuX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBuZXcgVWludDE2QXJyYXkobWVzaC5pbmRleEFycmF5KSwgdGhpcy5fZ2wuU1RBVElDX0RSQVcpO1xuXG4gICAgICAgIHRoaXMuYXJyYXlDb3B5VGV4ID0gW107XG5cbiAgICAgICAgdmFyIGF0dHJTdHIgPSB0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgPT09IHRydWUgPyBcImluXCIgOiBcImF0dHJpYnV0ZVwiO1xuICAgICAgICB2YXIgdmFyeWluZ091dFN0ciA9IHRoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCA9PT0gdHJ1ZSA/IFwib3V0XCIgOiBcInZhcnlpbmdcIjtcbiAgICAgICAgdmFyIHZhcnlpbmdJblN0ciA9IHRoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCA9PT0gdHJ1ZSA/IFwiaW5cIiA6IFwidmFyeWluZ1wiO1xuICAgICAgICB2YXIgaW50Rm9ybWF0ID0gdGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0ID8gdGhpcy5fZ2wuUkdCQTMyRiA6IHRoaXMuX2dsLlJHQkE7XG5cbiAgICAgICAgLy8gU0hBREVSIFJFQURQSVhFTFNcbiAgICAgICAgdmFyIHNvdXJjZVZlcnRleCA9IHRoaXMudmVyc2lvbiArIHRoaXMuX3ByZWNpc2lvbiArIGF0dHJTdHIgKyAnIHZlYzMgYVZlcnRleFBvc2l0aW9uO1xcbicgKyB2YXJ5aW5nT3V0U3RyICsgJyB2ZWMyIHZDb29yZDtcXG4nICsgJ3ZvaWQgbWFpbih2b2lkKSB7XFxuJyArICdnbF9Qb3NpdGlvbiA9IHZlYzQoYVZlcnRleFBvc2l0aW9uLCAxLjApO1xcbicgKyAndkNvb3JkID0gYVZlcnRleFBvc2l0aW9uLnh5KjAuNSswLjU7XFxuJyArICd9XFxuJztcbiAgICAgICAgdmFyIHNvdXJjZUZyYWdtZW50ID0gdGhpcy52ZXJzaW9uICsgdGhpcy5fcHJlY2lzaW9uICsgJ3VuaWZvcm0gc2FtcGxlcjJEIHNhbXBsZXJfYnVmZmVyO1xcbicgKyB2YXJ5aW5nSW5TdHIgKyAnaW4gdmVjMiB2Q29vcmQ7XFxuJyArICh0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgPyAnb3V0IHZlYzQgZnJhZ21lbnRDb2xvcjsnIDogXCJcIikgKyAndm9pZCBtYWluKHZvaWQpIHtcXG4nICsgKHRoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCA/ICdmcmFnbWVudENvbG9yID0gdGV4dHVyZShzYW1wbGVyX2J1ZmZlciwgdkNvb3JkKTsnIDogJ2dsX0ZyYWdDb2xvciA9IHRleHR1cmUyRChzYW1wbGVyX2J1ZmZlciwgdkNvb3JkKTsnKSArICd9XFxuJztcblxuICAgICAgICB0aGlzLnNoYWRlcl9yZWFkcGl4ZWxzID0gdGhpcy5fZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuICAgICAgICB0aGlzLnV0aWxzLmNyZWF0ZVNoYWRlcih0aGlzLl9nbCwgXCJDTEdMUkVBRFBJWEVMU1wiLCBzb3VyY2VWZXJ0ZXgsIHNvdXJjZUZyYWdtZW50LCB0aGlzLnNoYWRlcl9yZWFkcGl4ZWxzKTtcblxuICAgICAgICB0aGlzLmF0dHJfVmVydGV4UG9zID0gdGhpcy5fZ2wuZ2V0QXR0cmliTG9jYXRpb24odGhpcy5zaGFkZXJfcmVhZHBpeGVscywgXCJhVmVydGV4UG9zaXRpb25cIik7XG4gICAgICAgIHRoaXMuc2FtcGxlcl9idWZmZXIgPSB0aGlzLl9nbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy5zaGFkZXJfcmVhZHBpeGVscywgXCJzYW1wbGVyX2J1ZmZlclwiKTtcblxuICAgICAgICAvLyBTSEFERVIgQ09QWVRFWFRVUkVcbiAgICAgICAgdmFyIGxpbmVzX2RyYXdCdWZmZXJzV3JpdGUgPSBmdW5jdGlvbiBsaW5lc19kcmF3QnVmZmVyc1dyaXRlKCkge1xuICAgICAgICAgICAgdmFyIHN0ciA9ICcnO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGZuID0gX3RoaXMuX21heERyYXdCdWZmZXJzOyBuIDwgZm47IG4rKykge1xuICAgICAgICAgICAgICAgIHN0ciArPSBfdGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0ID8gJ291dENvbCcgKyBuICsgJyA9IHRleHR1cmUodUFycmF5Q1RbJyArIG4gKyAnXSwgdkNvb3JkKTtcXG4nIDogJ2dsX0ZyYWdEYXRhWycgKyBuICsgJ10gPSB0ZXh0dXJlKHVBcnJheUNUWycgKyBuICsgJ10sIHZDb29yZCk7XFxuJztcbiAgICAgICAgICAgIH1yZXR1cm4gc3RyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBsaW5lc19kcmF3QnVmZmVyc1dyaXRlSW5pdF9HTDIgPSBmdW5jdGlvbiBsaW5lc19kcmF3QnVmZmVyc1dyaXRlSW5pdF9HTDIoKSB7XG4gICAgICAgICAgICB2YXIgc3RyID0gJyc7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMCwgZm4gPSBfdGhpcy5fbWF4RHJhd0J1ZmZlcnM7IG4gPCBmbjsgbisrKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9ICdsYXlvdXQobG9jYXRpb24gPSAnICsgbiArICcpIG91dCB2ZWM0IG91dENvbCcgKyBuICsgJztcXG4nO1xuICAgICAgICAgICAgfXJldHVybiBzdHI7XG4gICAgICAgIH07XG5cbiAgICAgICAgc291cmNlVmVydGV4ID0gdGhpcy52ZXJzaW9uICsgdGhpcy5fcHJlY2lzaW9uICsgYXR0clN0ciArICcgdmVjMyBhVmVydGV4UG9zaXRpb247XFxuJyArIHZhcnlpbmdPdXRTdHIgKyAnIHZlYzIgdkNvb3JkO1xcbicgKyAndm9pZCBtYWluKHZvaWQpIHtcXG4nICsgJ2dsX1Bvc2l0aW9uID0gdmVjNChhVmVydGV4UG9zaXRpb24sIDEuMCk7XFxuJyArICd2Q29vcmQgPSBhVmVydGV4UG9zaXRpb24ueHkqMC41KzAuNTtcXG4nICsgJ30nO1xuICAgICAgICBzb3VyY2VGcmFnbWVudCA9IHRoaXMudmVyc2lvbiArIHRoaXMuZXh0RHJhd0J1ZmYgKyB0aGlzLl9wcmVjaXNpb24gKyAndW5pZm9ybSBzYW1wbGVyMkQgdUFycmF5Q1RbJyArIHRoaXMuX21heERyYXdCdWZmZXJzICsgJ107XFxuJyArIHZhcnlpbmdJblN0ciArICcgdmVjMiB2Q29vcmQ7XFxuJyArICh0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgPyBsaW5lc19kcmF3QnVmZmVyc1dyaXRlSW5pdF9HTDIoKSA6IFwiXCIpICsgJ3ZvaWQgbWFpbih2b2lkKSB7XFxuJyArIGxpbmVzX2RyYXdCdWZmZXJzV3JpdGUoKSArICd9JztcbiAgICAgICAgdGhpcy5zaGFkZXJfY29weVRleHR1cmUgPSB0aGlzLl9nbC5jcmVhdGVQcm9ncmFtKCk7XG4gICAgICAgIHRoaXMudXRpbHMuY3JlYXRlU2hhZGVyKHRoaXMuX2dsLCBcIkNMR0xDT1BZVEVYVFVSRVwiLCBzb3VyY2VWZXJ0ZXgsIHNvdXJjZUZyYWdtZW50LCB0aGlzLnNoYWRlcl9jb3B5VGV4dHVyZSk7XG5cbiAgICAgICAgdGhpcy5hdHRyX2NvcHlUZXh0dXJlX3BvcyA9IHRoaXMuX2dsLmdldEF0dHJpYkxvY2F0aW9uKHRoaXMuc2hhZGVyX2NvcHlUZXh0dXJlLCBcImFWZXJ0ZXhQb3NpdGlvblwiKTtcblxuICAgICAgICBmb3IgKHZhciBuID0gMCwgZm4gPSB0aGlzLl9tYXhEcmF3QnVmZmVyczsgbiA8IGZuOyBuKyspIHtcbiAgICAgICAgICAgIHRoaXMuYXJyYXlDb3B5VGV4W25dID0gdGhpcy5fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMuc2hhZGVyX2NvcHlUZXh0dXJlLCBcInVBcnJheUNUW1wiICsgbiArIFwiXVwiKTtcbiAgICAgICAgfXRoaXMudGV4dHVyZURhdGFBdXggPSB0aGlzLl9nbC5jcmVhdGVUZXh0dXJlKCk7XG4gICAgICAgIHRoaXMuX2dsLmJpbmRUZXh0dXJlKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMudGV4dHVyZURhdGFBdXgpO1xuICAgICAgICB0aGlzLl9nbC50ZXhJbWFnZTJEKHRoaXMuX2dsLlRFWFRVUkVfMkQsIDAsIGludEZvcm1hdCwgMiwgMiwgMCwgdGhpcy5fZ2wuUkdCQSwgdGhpcy5fZ2wuRkxPQVQsIG5ldyBGbG9hdDMyQXJyYXkoWzEsIDAsIDAsIDEsIDAsIDEsIDAsIDEsIDAsIDAsIDEsIDEsIDEsIDEsIDEsIDFdKSk7XG4gICAgICAgIHRoaXMuX2dsLnRleFBhcmFtZXRlcmkodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy5fZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCB0aGlzLl9nbC5ORUFSRVNUKTtcbiAgICAgICAgdGhpcy5fZ2wudGV4UGFyYW1ldGVyaSh0aGlzLl9nbC5URVhUVVJFXzJELCB0aGlzLl9nbC5URVhUVVJFX01JTl9GSUxURVIsIHRoaXMuX2dsLk5FQVJFU1QpO1xuICAgICAgICB0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfV1JBUF9TLCB0aGlzLl9nbC5DTEFNUF9UT19FREdFKTtcbiAgICAgICAgdGhpcy5fZ2wudGV4UGFyYW1ldGVyaSh0aGlzLl9nbC5URVhUVVJFXzJELCB0aGlzLl9nbC5URVhUVVJFX1dSQVBfVCwgdGhpcy5fZ2wuQ0xBTVBfVE9fRURHRSk7XG4gICAgICAgIHRoaXMuX2dsLmJpbmRUZXh0dXJlKHRoaXMuX2dsLlRFWFRVUkVfMkQsIG51bGwpO1xuICAgIH1cblxuICAgIC8qKlxyXG4gICAgICogZ2V0Q29udGV4dFxyXG4gICAgICogQHJldHVybnMge1dlYkdMUmVuZGVyaW5nQ29udGV4dH1cclxuICAgICAqL1xuXG5cbiAgICBfY3JlYXRlQ2xhc3MoV2ViQ0xHTCwgW3tcbiAgICAgICAga2V5OiBcImdldENvbnRleHRcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldENvbnRleHQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZ2w7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJnZXRNYXhEcmF3QnVmZmVyc1wiLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogZ2V0TWF4RHJhd0J1ZmZlcnNcclxuICAgICAgICAgKiBAcmV0dXJucyB7aW50fVxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0TWF4RHJhd0J1ZmZlcnMoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbWF4RHJhd0J1ZmZlcnM7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJjaGVja0ZyYW1lYnVmZmVyU3RhdHVzXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBjaGVja0ZyYW1lYnVmZmVyU3RhdHVzXHJcbiAgICAgICAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjaGVja0ZyYW1lYnVmZmVyU3RhdHVzKCkge1xuICAgICAgICAgICAgdmFyIHN0YSA9IHRoaXMuX2dsLmNoZWNrRnJhbWVidWZmZXJTdGF0dXModGhpcy5fZ2wuRlJBTUVCVUZGRVIpO1xuICAgICAgICAgICAgdmFyIGZlcnJvcnMgPSB7fTtcbiAgICAgICAgICAgIGZlcnJvcnNbdGhpcy5fZ2wuRlJBTUVCVUZGRVJfQ09NUExFVEVdID0gdHJ1ZTtcbiAgICAgICAgICAgIGZlcnJvcnNbdGhpcy5fZ2wuRlJBTUVCVUZGRVJfSU5DT01QTEVURV9BVFRBQ0hNRU5UXSA9IFwiRlJBTUVCVUZGRVJfSU5DT01QTEVURV9BVFRBQ0hNRU5UOiBUaGUgYXR0YWNobWVudCB0eXBlcyBhcmUgbWlzbWF0Y2hlZCBvciBub3QgYWxsIGZyYW1lYnVmZmVyIGF0dGFjaG1lbnQgcG9pbnRzIGFyZSBmcmFtZWJ1ZmZlciBhdHRhY2htZW50IGNvbXBsZXRlXCI7XG4gICAgICAgICAgICBmZXJyb3JzW3RoaXMuX2dsLkZSQU1FQlVGRkVSX0lOQ09NUExFVEVfTUlTU0lOR19BVFRBQ0hNRU5UXSA9IFwiRlJBTUVCVUZGRVJfSU5DT01QTEVURV9NSVNTSU5HX0FUVEFDSE1FTlQ6IFRoZXJlIGlzIG5vIGF0dGFjaG1lbnRcIjtcbiAgICAgICAgICAgIGZlcnJvcnNbdGhpcy5fZ2wuRlJBTUVCVUZGRVJfSU5DT01QTEVURV9ESU1FTlNJT05TXSA9IFwiRlJBTUVCVUZGRVJfSU5DT01QTEVURV9ESU1FTlNJT05TOiBIZWlnaHQgYW5kIHdpZHRoIG9mIHRoZSBhdHRhY2htZW50IGFyZSBub3QgdGhlIHNhbWVcIjtcbiAgICAgICAgICAgIGZlcnJvcnNbdGhpcy5fZ2wuRlJBTUVCVUZGRVJfVU5TVVBQT1JURURdID0gXCJGUkFNRUJVRkZFUl9VTlNVUFBPUlRFRDogVGhlIGZvcm1hdCBvZiB0aGUgYXR0YWNobWVudCBpcyBub3Qgc3VwcG9ydGVkIG9yIGlmIGRlcHRoIGFuZCBzdGVuY2lsIGF0dGFjaG1lbnRzIGFyZSBub3QgdGhlIHNhbWUgcmVuZGVyYnVmZmVyXCI7XG4gICAgICAgICAgICBpZiAoZmVycm9yc1tzdGFdICE9PSB0cnVlIHx8IGZlcnJvcnNbc3RhXSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGZlcnJvcnNbc3RhXSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJjb3B5XCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBjb3B5XHJcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMS2VybmVsfFdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW19IHBnclxyXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXk8V2ViQ0xHTEJ1ZmZlcj59IFt3ZWJDTEdMQnVmZmVycz1udWxsXVxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY29weShwZ3IsIHdlYkNMR0xCdWZmZXJzKSB7XG4gICAgICAgICAgICBpZiAod2ViQ0xHTEJ1ZmZlcnMgIT09IHVuZGVmaW5lZCAmJiB3ZWJDTEdMQnVmZmVycyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmICh3ZWJDTEdMQnVmZmVyc1swXSAhPT0gdW5kZWZpbmVkICYmIHdlYkNMR0xCdWZmZXJzWzBdICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLnZpZXdwb3J0KDAsIDAsIHdlYkNMR0xCdWZmZXJzWzBdLlcsIHdlYkNMR0xCdWZmZXJzWzBdLkgpO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRGcmFtZWJ1ZmZlcih0aGlzLl9nbC5GUkFNRUJVRkZFUiwgd2ViQ0xHTEJ1ZmZlcnNbMF0uZkJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcnJEQnVmZiA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBuID0gMCwgZm4gPSB3ZWJDTEdMQnVmZmVycy5sZW5ndGg7IG4gPCBmbjsgbisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdlYkNMR0xCdWZmZXJzW25dICE9PSB1bmRlZmluZWQgJiYgd2ViQ0xHTEJ1ZmZlcnNbbl0gIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wuZnJhbWVidWZmZXJUZXh0dXJlMkQodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIHRoaXMuX2dsWydDT0xPUl9BVFRBQ0hNRU5UJyArIG5dLCB0aGlzLl9nbC5URVhUVVJFXzJELCB3ZWJDTEdMQnVmZmVyc1tuXS50ZXh0dXJlRGF0YSwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyckRCdWZmW25dID0gdGhpcy5fZ2xbJ0NPTE9SX0FUVEFDSE1FTlQnICsgbl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGFyckRCdWZmW25dID0gdGhpcy5fZ2xbJ05PTkUnXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLmRyYXdCdWZmZXJzKGFyckRCdWZmKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9uID0gMCwgX2ZuID0gd2ViQ0xHTEJ1ZmZlcnMubGVuZ3RoOyBfbiA8IF9mbjsgX24rKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3ZWJDTEdMQnVmZmVyc1tfbl0gIT09IHVuZGVmaW5lZCAmJiB3ZWJDTEdMQnVmZmVyc1tfbl0gIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wuZnJhbWVidWZmZXJUZXh0dXJlMkQodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIHRoaXMuX2FyckV4dFtcIldFQkdMX2RyYXdfYnVmZmVyc1wiXVsnQ09MT1JfQVRUQUNITUVOVCcgKyBfbiArICdfV0VCR0wnXSwgdGhpcy5fZ2wuVEVYVFVSRV8yRCwgd2ViQ0xHTEJ1ZmZlcnNbX25dLnRleHR1cmVEYXRhLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyREJ1ZmZbX25dID0gdGhpcy5fYXJyRXh0W1wiV0VCR0xfZHJhd19idWZmZXJzXCJdWydDT0xPUl9BVFRBQ0hNRU5UJyArIF9uICsgJ19XRUJHTCddO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBhcnJEQnVmZltfbl0gPSB0aGlzLl9nbFsnTk9ORSddO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXJyRXh0W1wiV0VCR0xfZHJhd19idWZmZXJzXCJdLmRyYXdCdWZmZXJzV0VCR0woYXJyREJ1ZmYpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNoZWNrRnJhbWVidWZmZXJTdGF0dXMoKSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wudXNlUHJvZ3JhbSh0aGlzLnNoYWRlcl9jb3B5VGV4dHVyZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9uMiA9IDAsIF9mbjIgPSB3ZWJDTEdMQnVmZmVycy5sZW5ndGg7IF9uMiA8IF9mbjI7IF9uMisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wuYWN0aXZlVGV4dHVyZSh0aGlzLl9nbFtcIlRFWFRVUkVcIiArIF9uMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3ZWJDTEdMQnVmZmVyc1tfbjJdICE9PSB1bmRlZmluZWQgJiYgd2ViQ0xHTEJ1ZmZlcnNbX24yXSAhPT0gbnVsbCkgdGhpcy5fZ2wuYmluZFRleHR1cmUodGhpcy5fZ2wuVEVYVFVSRV8yRCwgd2ViQ0xHTEJ1ZmZlcnNbX24yXS50ZXh0dXJlRGF0YVRlbXApO2Vsc2UgdGhpcy5fZ2wuYmluZFRleHR1cmUodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlRGF0YUF1eCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wudW5pZm9ybTFpKHRoaXMuYXJyYXlDb3B5VGV4W19uMl0sIF9uMik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29weU5vdyh3ZWJDTEdMQnVmZmVycyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kRnJhbWVidWZmZXIodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB0aGlzLl9nbC5iaW5kRnJhbWVidWZmZXIodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY29weU5vd1wiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY29weU5vdyh3ZWJDTEdMQnVmZmVycykge1xuICAgICAgICAgICAgdGhpcy5fZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkodGhpcy5hdHRyX2NvcHlUZXh0dXJlX3Bvcyk7XG4gICAgICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkFSUkFZX0JVRkZFUiwgdGhpcy52ZXJ0ZXhCdWZmZXJfUVVBRCk7XG4gICAgICAgICAgICB0aGlzLl9nbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHRoaXMuYXR0cl9jb3B5VGV4dHVyZV9wb3MsIDMsIHRoaXMuX2dsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG5cbiAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRCdWZmZXIodGhpcy5fZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIHRoaXMuaW5kZXhCdWZmZXJfUVVBRCk7XG4gICAgICAgICAgICB0aGlzLl9nbC5kcmF3RWxlbWVudHModGhpcy5fZ2wuVFJJQU5HTEVTLCA2LCB0aGlzLl9nbC5VTlNJR05FRF9TSE9SVCwgMCk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJjcmVhdGVCdWZmZXJcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIENyZWF0ZSBhIGVtcHR5IFdlYkNMR0xCdWZmZXJcclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gW3R5cGU9XCJGTE9BVFwiXSB0eXBlIEZMT0FUNCBPUiBGTE9BVFxyXG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2xpbmVhcj1mYWxzZV0gbGluZWFyIHRleFBhcmFtZXRlcmkgdHlwZSBmb3IgdGhlIFdlYkdMVGV4dHVyZVxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBbbW9kZT1cIlNBTVBMRVJcIl0gTW9kZSBmb3IgdGhpcyBidWZmZXIuIFwiU0FNUExFUlwiLCBcIkFUVFJJQlVURVwiLCBcIlZFUlRFWF9JTkRFWFwiXHJcbiAgICAgICAgICogQHJldHVybnMge1dlYkNMR0xCdWZmZXJ9XHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjcmVhdGVCdWZmZXIodHlwZSwgbGluZWFyLCBtb2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IF9XZWJDTEdMQnVmZmVyLldlYkNMR0xCdWZmZXIodGhpcy5fZ2wsIHR5cGUsIGxpbmVhciwgbW9kZSk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJjcmVhdGVLZXJuZWxcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIENyZWF0ZSBhIGtlcm5lbFxyXG4gICAgICAgICAqIEByZXR1cm5zIHtXZWJDTEdMS2VybmVsfVxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBbc291cmNlPXVuZGVmaW5lZF1cclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gW2hlYWRlcj11bmRlZmluZWRdIEFkZGl0aW9uYWwgZnVuY3Rpb25zXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjcmVhdGVLZXJuZWwoc291cmNlLCBoZWFkZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgX1dlYkNMR0xLZXJuZWwuV2ViQ0xHTEtlcm5lbCh0aGlzLl9nbCwgc291cmNlLCBoZWFkZXIpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY3JlYXRlVmVydGV4RnJhZ21lbnRQcm9ncmFtXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBDcmVhdGUgYSB2ZXJ0ZXggYW5kIGZyYWdtZW50IHByb2dyYW1zIGZvciBhIFdlYkdMIGdyYXBoaWNhbCByZXByZXNlbnRhdGlvbiBhZnRlciBzb21lIGVucXVldWVORFJhbmdlS2VybmVsXHJcbiAgICAgICAgICogQHJldHVybnMge1dlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW19XHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IFt2ZXJ0ZXhTb3VyY2U9dW5kZWZpbmVkXVxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBbdmVydGV4SGVhZGVyPXVuZGVmaW5lZF1cclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gW2ZyYWdtZW50U291cmNlPXVuZGVmaW5lZF1cclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gW2ZyYWdtZW50SGVhZGVyPXVuZGVmaW5lZF1cclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNyZWF0ZVZlcnRleEZyYWdtZW50UHJvZ3JhbSh2ZXJ0ZXhTb3VyY2UsIHZlcnRleEhlYWRlciwgZnJhZ21lbnRTb3VyY2UsIGZyYWdtZW50SGVhZGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IF9XZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtLldlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0odGhpcy5fZ2wsIHZlcnRleFNvdXJjZSwgdmVydGV4SGVhZGVyLCBmcmFnbWVudFNvdXJjZSwgZnJhZ21lbnRIZWFkZXIpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZmlsbEJ1ZmZlclwiLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogZmlsbEJ1ZmZlciB3aXRoIGNvbG9yXHJcbiAgICAgICAgICogQHBhcmFtIHtXZWJHTFRleHR1cmV9IHRleHR1cmVcclxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5PEZsb2F0Pn0gY2xlYXJDb2xvclxyXG4gICAgICAgICAqIEBwYXJhbSB7V2ViR0xGcmFtZWJ1ZmZlcn0gZkJ1ZmZlclxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZmlsbEJ1ZmZlcih0ZXh0dXJlLCBjbGVhckNvbG9yLCBmQnVmZmVyKSB7XG4gICAgICAgICAgICB0aGlzLl9nbC5iaW5kRnJhbWVidWZmZXIodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIGZCdWZmZXIpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCB0aGlzLl9nbFsnQ09MT1JfQVRUQUNITUVOVDAnXSwgdGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZSwgMCk7XG5cbiAgICAgICAgICAgICAgICB2YXIgYXJyREJ1ZmYgPSBbdGhpcy5fZ2xbJ0NPTE9SX0FUVEFDSE1FTlQwJ11dO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmRyYXdCdWZmZXJzKGFyckRCdWZmKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuZnJhbWVidWZmZXJUZXh0dXJlMkQodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIHRoaXMuX2FyckV4dFtcIldFQkdMX2RyYXdfYnVmZmVyc1wiXVsnQ09MT1JfQVRUQUNITUVOVDBfV0VCR0wnXSwgdGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZSwgMCk7XG5cbiAgICAgICAgICAgICAgICB2YXIgX2FyckRCdWZmID0gW3RoaXMuX2FyckV4dFtcIldFQkdMX2RyYXdfYnVmZmVyc1wiXVsnQ09MT1JfQVRUQUNITUVOVDBfV0VCR0wnXV07XG4gICAgICAgICAgICAgICAgdGhpcy5fYXJyRXh0W1wiV0VCR0xfZHJhd19idWZmZXJzXCJdLmRyYXdCdWZmZXJzV0VCR0woX2FyckRCdWZmKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGNsZWFyQ29sb3IgIT09IHVuZGVmaW5lZCAmJiBjbGVhckNvbG9yICE9PSBudWxsKSB0aGlzLl9nbC5jbGVhckNvbG9yKGNsZWFyQ29sb3JbMF0sIGNsZWFyQ29sb3JbMV0sIGNsZWFyQ29sb3JbMl0sIGNsZWFyQ29sb3JbM10pO1xuICAgICAgICAgICAgdGhpcy5fZ2wuY2xlYXIodGhpcy5fZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJiaW5kQXR0cmlidXRlVmFsdWVcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIGJpbmRBdHRyaWJ1dGVWYWx1ZVxyXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpblZhbHVlXHJcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMQnVmZmVyfSBidWZmXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBiaW5kQXR0cmlidXRlVmFsdWUoaW5WYWx1ZSwgYnVmZikge1xuICAgICAgICAgICAgaWYgKGJ1ZmYgIT09IHVuZGVmaW5lZCAmJiBidWZmICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGluVmFsdWUudHlwZSA9PT0gJ2Zsb2F0NF9mcm9tQXR0cicpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoaW5WYWx1ZS5sb2NhdGlvblswXSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRCdWZmZXIodGhpcy5fZ2wuQVJSQVlfQlVGRkVSLCBidWZmLnZlcnRleERhdGEwKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wudmVydGV4QXR0cmliUG9pbnRlcihpblZhbHVlLmxvY2F0aW9uWzBdLCA0LCB0aGlzLl9nbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5WYWx1ZS50eXBlID09PSAnZmxvYXRfZnJvbUF0dHInKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGluVmFsdWUubG9jYXRpb25bMF0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkFSUkFZX0JVRkZFUiwgYnVmZi52ZXJ0ZXhEYXRhMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLnZlcnRleEF0dHJpYlBvaW50ZXIoaW5WYWx1ZS5sb2NhdGlvblswXSwgMSwgdGhpcy5fZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgdGhpcy5fZ2wuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5KGluVmFsdWUubG9jYXRpb25bMF0pO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiYmluZFNhbXBsZXJWYWx1ZVwiLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogYmluZFNhbXBsZXJWYWx1ZVxyXG4gICAgICAgICAqIEBwYXJhbSB7V2ViR0xVbmlmb3JtTG9jYXRpb259IHVCdWZmZXJXaWR0aFxyXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpblZhbHVlXHJcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMQnVmZmVyfSBidWZmXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBiaW5kU2FtcGxlclZhbHVlKHVCdWZmZXJXaWR0aCwgaW5WYWx1ZSwgYnVmZikge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRUZXh0dXJlVW5pdCA8IDE2KSB0aGlzLl9nbC5hY3RpdmVUZXh0dXJlKHRoaXMuX2dsW1wiVEVYVFVSRVwiICsgdGhpcy5fY3VycmVudFRleHR1cmVVbml0XSk7ZWxzZSB0aGlzLl9nbC5hY3RpdmVUZXh0dXJlKHRoaXMuX2dsW1wiVEVYVFVSRTE2XCJdKTtcblxuICAgICAgICAgICAgaWYgKGJ1ZmYgIT09IHVuZGVmaW5lZCAmJiBidWZmICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuYmluZFRleHR1cmUodGhpcy5fZ2wuVEVYVFVSRV8yRCwgYnVmZi50ZXh0dXJlRGF0YSk7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fYnVmZmVyV2lkdGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnVmZmVyV2lkdGggPSBidWZmLlc7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLnVuaWZvcm0xZih1QnVmZmVyV2lkdGgsIHRoaXMuX2J1ZmZlcldpZHRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgdGhpcy5fZ2wuYmluZFRleHR1cmUodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlRGF0YUF1eCk7XG4gICAgICAgICAgICB0aGlzLl9nbC51bmlmb3JtMWkoaW5WYWx1ZS5sb2NhdGlvblswXSwgdGhpcy5fY3VycmVudFRleHR1cmVVbml0KTtcblxuICAgICAgICAgICAgdGhpcy5fY3VycmVudFRleHR1cmVVbml0Kys7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJiaW5kVW5pZm9ybVZhbHVlXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBiaW5kVW5pZm9ybVZhbHVlXHJcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGluVmFsdWVcclxuICAgICAgICAgKiBAcGFyYW0ge1dlYkNMR0xCdWZmZXJ8TnVtYmVyfEFycmF5PGZsb2F0Pn0gYnVmZlxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gYmluZFVuaWZvcm1WYWx1ZShpblZhbHVlLCBidWZmKSB7XG4gICAgICAgICAgICBpZiAoYnVmZiAhPT0gdW5kZWZpbmVkICYmIGJ1ZmYgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5WYWx1ZS50eXBlID09PSAnZmxvYXQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChidWZmLmNvbnN0cnVjdG9yID09PSBBcnJheSkgdGhpcy5fZ2wudW5pZm9ybTFmdihpblZhbHVlLmxvY2F0aW9uWzBdLCBidWZmKTtlbHNlIHRoaXMuX2dsLnVuaWZvcm0xZihpblZhbHVlLmxvY2F0aW9uWzBdLCBidWZmKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGluVmFsdWUudHlwZSA9PT0gJ2Zsb2F0NCcpIHRoaXMuX2dsLnVuaWZvcm00ZihpblZhbHVlLmxvY2F0aW9uWzBdLCBidWZmWzBdLCBidWZmWzFdLCBidWZmWzJdLCBidWZmWzNdKTtlbHNlIGlmIChpblZhbHVlLnR5cGUgPT09ICdtYXQ0JykgdGhpcy5fZ2wudW5pZm9ybU1hdHJpeDRmdihpblZhbHVlLmxvY2F0aW9uWzBdLCBmYWxzZSwgYnVmZik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJiaW5kVmFsdWVcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIGJpbmRWYWx1ZVxyXG4gICAgICAgICAqIEBwYXJhbSB7V2ViQ0xHTEtlcm5lbHxXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtfSB3ZWJDTEdMUHJvZ3JhbVxyXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpblZhbHVlXHJcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMQnVmZmVyfGZsb2F0fEFycmF5PGZsb2F0PnxGbG9hdDMyQXJyYXl8VWludDhBcnJheX0gYXJnVmFsdWVcclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGJpbmRWYWx1ZSh3ZWJDTEdMUHJvZ3JhbSwgaW5WYWx1ZSwgYXJnVmFsdWUpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoaW5WYWx1ZS5leHBlY3RlZE1vZGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwiQVRUUklCVVRFXCI6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYmluZEF0dHJpYnV0ZVZhbHVlKGluVmFsdWUsIGFyZ1ZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlNBTVBMRVJcIjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5iaW5kU2FtcGxlclZhbHVlKHdlYkNMR0xQcm9ncmFtLnVCdWZmZXJXaWR0aCwgaW5WYWx1ZSwgYXJnVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiVU5JRk9STVwiOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmJpbmRVbmlmb3JtVmFsdWUoaW5WYWx1ZSwgYXJnVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImJpbmRGQlwiLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogYmluZEZCXHJcbiAgICAgICAgICogQHBhcmFtIHtBcnJheTxXZWJDTEdMQnVmZmVyPn0gW3dlYkNMR0xCdWZmZXJzPW51bGxdXHJcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBvdXRwdXRUb1RlbXBcclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGJpbmRGQih3ZWJDTEdMQnVmZmVycywgb3V0cHV0VG9UZW1wKSB7XG4gICAgICAgICAgICBpZiAod2ViQ0xHTEJ1ZmZlcnMgIT09IHVuZGVmaW5lZCAmJiB3ZWJDTEdMQnVmZmVycyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmICh3ZWJDTEdMQnVmZmVyc1swXSAhPT0gdW5kZWZpbmVkICYmIHdlYkNMR0xCdWZmZXJzWzBdICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLnZpZXdwb3J0KDAsIDAsIHdlYkNMR0xCdWZmZXJzWzBdLlcsIHdlYkNMR0xCdWZmZXJzWzBdLkgpO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRGcmFtZWJ1ZmZlcih0aGlzLl9nbC5GUkFNRUJVRkZFUiwgb3V0cHV0VG9UZW1wID09PSB0cnVlID8gd2ViQ0xHTEJ1ZmZlcnNbMF0uZkJ1ZmZlclRlbXAgOiB3ZWJDTEdMQnVmZmVyc1swXS5mQnVmZmVyKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFyckRCdWZmID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmbiA9IHdlYkNMR0xCdWZmZXJzLmxlbmd0aDsgbiA8IGZuOyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3ZWJDTEdMQnVmZmVyc1tuXSAhPT0gdW5kZWZpbmVkICYmIHdlYkNMR0xCdWZmZXJzW25dICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG8gPSBvdXRwdXRUb1RlbXAgPT09IHRydWUgPyB3ZWJDTEdMQnVmZmVyc1tuXS50ZXh0dXJlRGF0YVRlbXAgOiB3ZWJDTEdMQnVmZmVyc1tuXS50ZXh0dXJlRGF0YTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wuZnJhbWVidWZmZXJUZXh0dXJlMkQodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIHRoaXMuX2dsWydDT0xPUl9BVFRBQ0hNRU5UJyArIG5dLCB0aGlzLl9nbC5URVhUVVJFXzJELCBvLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyREJ1ZmZbbl0gPSB0aGlzLl9nbFsnQ09MT1JfQVRUQUNITUVOVCcgKyBuXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbC5mcmFtZWJ1ZmZlclRleHR1cmUyRCh0aGlzLl9nbC5GUkFNRUJVRkZFUiwgdGhpcy5fYXJyRXh0W1wiV0VCR0xfZHJhd19idWZmZXJzXCJdWydDT0xPUl9BVFRBQ0hNRU5UJyArIG4gKyAnX1dFQkdMJ10sIHRoaXMuX2dsLlRFWFRVUkVfMkQsIG8sIDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnJEQnVmZltuXSA9IHRoaXMuX2FyckV4dFtcIldFQkdMX2RyYXdfYnVmZmVyc1wiXVsnQ09MT1JfQVRUQUNITUVOVCcgKyBuICsgJ19XRUJHTCddO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBhcnJEQnVmZltuXSA9IHRoaXMuX2dsWydOT05FJ107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0ID8gdGhpcy5fZ2wuZHJhd0J1ZmZlcnMoYXJyREJ1ZmYpIDogdGhpcy5fYXJyRXh0W1wiV0VCR0xfZHJhd19idWZmZXJzXCJdLmRyYXdCdWZmZXJzV0VCR0woYXJyREJ1ZmYpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNoZWNrRnJhbWVidWZmZXJTdGF0dXMoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kRnJhbWVidWZmZXIodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRGcmFtZWJ1ZmZlcih0aGlzLl9nbC5GUkFNRUJVRkZFUiwgbnVsbCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJlbnF1ZXVlTkRSYW5nZUtlcm5lbFwiLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUGVyZm9ybSBjYWxjdWxhdGlvbiBhbmQgc2F2ZSB0aGUgcmVzdWx0IG9uIGEgV2ViQ0xHTEJ1ZmZlclxyXG4gICAgICAgICAqIEBwYXJhbSB7V2ViQ0xHTEtlcm5lbH0gd2ViQ0xHTEtlcm5lbFxyXG4gICAgICAgICAqIEBwYXJhbSB7V2ViQ0xHTEJ1ZmZlcnxBcnJheTxXZWJDTEdMQnVmZmVyPn0gW3dlYkNMR0xCdWZmZXI9bnVsbF1cclxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IG91dHB1dFRvVGVtcFxyXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBhcmdWYWx1ZXNcclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGVucXVldWVORFJhbmdlS2VybmVsKHdlYkNMR0xLZXJuZWwsIHdlYkNMR0xCdWZmZXIsIG91dHB1dFRvVGVtcCwgYXJnVmFsdWVzKSB7XG4gICAgICAgICAgICB0aGlzLl9idWZmZXJXaWR0aCA9IDA7XG5cbiAgICAgICAgICAgIHRoaXMuX2dsLnVzZVByb2dyYW0od2ViQ0xHTEtlcm5lbC5rZXJuZWwpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5iaW5kRkIod2ViQ0xHTEJ1ZmZlciwgb3V0cHV0VG9UZW1wKSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRUZXh0dXJlVW5pdCA9IDA7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHdlYkNMR0xLZXJuZWwuaW5fdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYmluZFZhbHVlKHdlYkNMR0xLZXJuZWwsIHdlYkNMR0xLZXJuZWwuaW5fdmFsdWVzW2tleV0sIGFyZ1ZhbHVlc1trZXldKTtcbiAgICAgICAgICAgICAgICB9dGhpcy5fZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkod2ViQ0xHTEtlcm5lbC5hdHRyX1ZlcnRleFBvcyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEJ1ZmZlcih0aGlzLl9nbC5BUlJBWV9CVUZGRVIsIHRoaXMudmVydGV4QnVmZmVyX1FVQUQpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLnZlcnRleEF0dHJpYlBvaW50ZXIod2ViQ0xHTEtlcm5lbC5hdHRyX1ZlcnRleFBvcywgMywgdGhpcy5fZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRCdWZmZXIodGhpcy5fZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIHRoaXMuaW5kZXhCdWZmZXJfUVVBRCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuZHJhd0VsZW1lbnRzKHRoaXMuX2dsLlRSSUFOR0xFUywgNiwgdGhpcy5fZ2wuVU5TSUdORURfU0hPUlQsIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZW5xdWV1ZVZlcnRleEZyYWdtZW50UHJvZ3JhbVwiLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUGVyZm9ybSBXZWJHTCBncmFwaGljYWwgcmVwcmVzZW50YXRpb25cclxuICAgICAgICAgKiBAcGFyYW0ge1dlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW19IHdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW1cclxuICAgICAgICAgKiBAcGFyYW0ge1dlYkNMR0xCdWZmZXJ9IGJ1ZmZlckluZCBCdWZmZXIgdG8gZHJhdyB0eXBlICh0eXBlIGluZGljZXMgb3IgdmVydGV4KVxyXG4gICAgICAgICAqIEBwYXJhbSB7aW50fSBbZHJhd01vZGU9NF0gMD1QT0lOVFMsIDM9TElORV9TVFJJUCwgMj1MSU5FX0xPT1AsIDE9TElORVMsIDU9VFJJQU5HTEVfU1RSSVAsIDY9VFJJQU5HTEVfRkFOIGFuZCA0PVRSSUFOR0xFU1xyXG4gICAgICAgICAqIEBwYXJhbSB7V2ViQ0xHTEJ1ZmZlcnxBcnJheTxXZWJDTEdMQnVmZmVyPn0gW3dlYkNMR0xCdWZmZXI9bnVsbF1cclxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IG91dHB1dFRvVGVtcFxyXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBhcmdWYWx1ZXNcclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGVucXVldWVWZXJ0ZXhGcmFnbWVudFByb2dyYW0od2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbSwgYnVmZmVySW5kLCBkcmF3TW9kZSwgd2ViQ0xHTEJ1ZmZlciwgb3V0cHV0VG9UZW1wLCBhcmdWYWx1ZXMpIHtcbiAgICAgICAgICAgIHRoaXMuX2J1ZmZlcldpZHRoID0gMDtcblxuICAgICAgICAgICAgdGhpcy5fZ2wudXNlUHJvZ3JhbSh3ZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtLnZlcnRleEZyYWdtZW50UHJvZ3JhbSk7XG5cbiAgICAgICAgICAgIHZhciBEbW9kZSA9IGRyYXdNb2RlICE9PSB1bmRlZmluZWQgJiYgZHJhd01vZGUgIT09IG51bGwgPyBkcmF3TW9kZSA6IDQ7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmJpbmRGQih3ZWJDTEdMQnVmZmVyLCBvdXRwdXRUb1RlbXApID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGJ1ZmZlckluZCAhPT0gdW5kZWZpbmVkICYmIGJ1ZmZlckluZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50VGV4dHVyZVVuaXQgPSAwO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gd2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbS5pbl92ZXJ0ZXhfdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmJpbmRWYWx1ZSh3ZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtLCB3ZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtLmluX3ZlcnRleF92YWx1ZXNba2V5XSwgYXJnVmFsdWVzW2tleV0pO1xuICAgICAgICAgICAgICAgICAgICB9Zm9yICh2YXIgX2tleSBpbiB3ZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtLmluX2ZyYWdtZW50X3ZhbHVlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5iaW5kVmFsdWUod2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbSwgd2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbS5pbl9mcmFnbWVudF92YWx1ZXNbX2tleV0sIGFyZ1ZhbHVlc1tfa2V5XSk7XG4gICAgICAgICAgICAgICAgICAgIH1pZiAoYnVmZmVySW5kLm1vZGUgPT09IFwiVkVSVEVYX0lOREVYXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRCdWZmZXIodGhpcy5fZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGJ1ZmZlckluZC52ZXJ0ZXhEYXRhMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbC5kcmF3RWxlbWVudHMoRG1vZGUsIGJ1ZmZlckluZC5sZW5ndGgsIHRoaXMuX2dsLlVOU0lHTkVEX1NIT1JULCAwKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHRoaXMuX2dsLmRyYXdBcnJheXMoRG1vZGUsIDAsIGJ1ZmZlckluZC5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInJlYWRCdWZmZXJcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEdldCBGbG9hdDMyQXJyYXkgYXJyYXkgZnJvbSBhIFdlYkNMR0xCdWZmZXJcclxuICAgICAgICAgKiBAcGFyYW0ge1dlYkNMR0xCdWZmZXJ9IGJ1ZmZlclxyXG4gICAgICAgICAqIEByZXR1cm5zIHtGbG9hdDMyQXJyYXl9XHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiByZWFkQnVmZmVyKGJ1ZmZlcikge1xuICAgICAgICAgICAgaWYgKHRoaXMuZSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZS53aWR0aCA9IGJ1ZmZlci5XO1xuICAgICAgICAgICAgICAgIHRoaXMuZS5oZWlnaHQgPSBidWZmZXIuSDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5fZ2wudXNlUHJvZ3JhbSh0aGlzLnNoYWRlcl9yZWFkcGl4ZWxzKTtcblxuICAgICAgICAgICAgdGhpcy5fZ2wudmlld3BvcnQoMCwgMCwgYnVmZmVyLlcsIGJ1ZmZlci5IKTtcbiAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRGcmFtZWJ1ZmZlcih0aGlzLl9nbC5GUkFNRUJVRkZFUiwgYnVmZmVyLmZCdWZmZXJUZW1wKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5mcmFtZWJ1ZmZlclRleHR1cmUyRCh0aGlzLl9nbC5GUkFNRUJVRkZFUiwgdGhpcy5fZ2xbJ0NPTE9SX0FUVEFDSE1FTlQwJ10sIHRoaXMuX2dsLlRFWFRVUkVfMkQsIGJ1ZmZlci50ZXh0dXJlRGF0YVRlbXAsIDApO1xuXG4gICAgICAgICAgICAgICAgdmFyIGFyckRCdWZmID0gW3RoaXMuX2dsWydDT0xPUl9BVFRBQ0hNRU5UMCddXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5kcmF3QnVmZmVycyhhcnJEQnVmZik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCB0aGlzLl9hcnJFeHRbXCJXRUJHTF9kcmF3X2J1ZmZlcnNcIl1bJ0NPTE9SX0FUVEFDSE1FTlQwX1dFQkdMJ10sIHRoaXMuX2dsLlRFWFRVUkVfMkQsIGJ1ZmZlci50ZXh0dXJlRGF0YVRlbXAsIDApO1xuXG4gICAgICAgICAgICAgICAgdmFyIF9hcnJEQnVmZjIgPSBbdGhpcy5fYXJyRXh0W1wiV0VCR0xfZHJhd19idWZmZXJzXCJdWydDT0xPUl9BVFRBQ0hNRU5UMF9XRUJHTCddXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9hcnJFeHRbXCJXRUJHTF9kcmF3X2J1ZmZlcnNcIl0uZHJhd0J1ZmZlcnNXRUJHTChfYXJyREJ1ZmYyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2dsLmFjdGl2ZVRleHR1cmUodGhpcy5fZ2wuVEVYVFVSRTApO1xuICAgICAgICAgICAgdGhpcy5fZ2wuYmluZFRleHR1cmUodGhpcy5fZ2wuVEVYVFVSRV8yRCwgYnVmZmVyLnRleHR1cmVEYXRhKTtcbiAgICAgICAgICAgIHRoaXMuX2dsLnVuaWZvcm0xaSh0aGlzLnNhbXBsZXJfYnVmZmVyLCAwKTtcblxuICAgICAgICAgICAgdGhpcy5fZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkodGhpcy5hdHRyX1ZlcnRleFBvcyk7XG4gICAgICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkFSUkFZX0JVRkZFUiwgdGhpcy52ZXJ0ZXhCdWZmZXJfUVVBRCk7XG4gICAgICAgICAgICB0aGlzLl9nbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHRoaXMuYXR0cl9WZXJ0ZXhQb3MsIDMsIGJ1ZmZlci5fc3VwcG9ydEZvcm1hdCwgZmFsc2UsIDAsIDApO1xuXG4gICAgICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCB0aGlzLmluZGV4QnVmZmVyX1FVQUQpO1xuICAgICAgICAgICAgdGhpcy5fZ2wuZHJhd0VsZW1lbnRzKHRoaXMuX2dsLlRSSUFOR0xFUywgNiwgdGhpcy5fZ2wuVU5TSUdORURfU0hPUlQsIDApO1xuXG4gICAgICAgICAgICBpZiAoYnVmZmVyLm91dEFycmF5RmxvYXQgPT09IHVuZGVmaW5lZCB8fCBidWZmZXIub3V0QXJyYXlGbG9hdCA9PT0gbnVsbCkgYnVmZmVyLm91dEFycmF5RmxvYXQgPSBuZXcgRmxvYXQzMkFycmF5KGJ1ZmZlci5XICogYnVmZmVyLkggKiA0KTtcbiAgICAgICAgICAgIHRoaXMuX2dsLnJlYWRQaXhlbHMoMCwgMCwgYnVmZmVyLlcsIGJ1ZmZlci5ILCB0aGlzLl9nbC5SR0JBLCB0aGlzLl9nbC5GTE9BVCwgYnVmZmVyLm91dEFycmF5RmxvYXQpO1xuXG4gICAgICAgICAgICBpZiAoYnVmZmVyLnR5cGUgPT09IFwiRkxPQVRcIikge1xuICAgICAgICAgICAgICAgIHZhciBmZCA9IG5ldyBGbG9hdDMyQXJyYXkoYnVmZmVyLm91dEFycmF5RmxvYXQubGVuZ3RoIC8gNCk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGZuID0gYnVmZmVyLm91dEFycmF5RmxvYXQubGVuZ3RoIC8gNDsgbiA8IGZuOyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgZmRbbl0gPSBidWZmZXIub3V0QXJyYXlGbG9hdFtuICogNF07XG4gICAgICAgICAgICAgICAgfWJ1ZmZlci5vdXRBcnJheUZsb2F0ID0gZmQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBidWZmZXIub3V0QXJyYXlGbG9hdDtcbiAgICAgICAgfVxuICAgIH1dLCBbe1xuICAgICAgICBrZXk6IFwiZW5xdWV1ZVJlYWRCdWZmZXJfV2ViR0xUZXh0dXJlXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBHZXQgdGhlIGludGVybmFsbHkgV2ViR0xUZXh0dXJlICh0eXBlIEZMT0FUKSwgaWYgdGhlIFdlYkdMUmVuZGVyaW5nQ29udGV4dCB3YXMgZ2l2ZW4uXHJcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMQnVmZmVyfSBidWZmZXJcclxuICAgICAgICAgKiBAcmV0dXJucyB7V2ViR0xUZXh0dXJlfVxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZW5xdWV1ZVJlYWRCdWZmZXJfV2ViR0xUZXh0dXJlKGJ1ZmZlcikge1xuICAgICAgICAgICAgcmV0dXJuIGJ1ZmZlci50ZXh0dXJlRGF0YTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBXZWJDTEdMO1xufSgpO1xuXG5nbG9iYWwuV2ViQ0xHTCA9IFdlYkNMR0w7XG5tb2R1bGUuZXhwb3J0cy5XZWJDTEdMID0gV2ViQ0xHTDsiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG4vKipcclxuKiBXZWJDTEdMQnVmZmVyXHJcbiogQGNsYXNzXHJcbiAqIEBwYXJhbSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbFxyXG4gKiBAcGFyYW0ge1N0cmluZ30gW3R5cGU9XCJGTE9BVFwiXVxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtsaW5lYXI9dHJ1ZV1cclxuICogQHBhcmFtIHtTdHJpbmd9IFttb2RlPVwiU0FNUExFUlwiXSBcIlNBTVBMRVJcIiwgXCJBVFRSSUJVVEVcIiwgXCJWRVJURVhfSU5ERVhcIlxyXG4qL1xudmFyIFdlYkNMR0xCdWZmZXIgPSBleHBvcnRzLldlYkNMR0xCdWZmZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gV2ViQ0xHTEJ1ZmZlcihnbCwgdHlwZSwgbGluZWFyLCBtb2RlKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBXZWJDTEdMQnVmZmVyKTtcblxuICAgICAgICB0aGlzLl9nbCA9IGdsO1xuXG4gICAgICAgIHRoaXMudHlwZSA9IHR5cGUgIT09IHVuZGVmaW5lZCB8fCB0eXBlICE9PSBudWxsID8gdHlwZSA6ICdGTE9BVCc7XG4gICAgICAgIHRoaXMuX3N1cHBvcnRGb3JtYXQgPSB0aGlzLl9nbC5GTE9BVDtcblxuICAgICAgICB0aGlzLmxpbmVhciA9IGxpbmVhciAhPT0gdW5kZWZpbmVkIHx8IGxpbmVhciAhPT0gbnVsbCA/IGxpbmVhciA6IHRydWU7XG4gICAgICAgIHRoaXMubW9kZSA9IG1vZGUgIT09IHVuZGVmaW5lZCB8fCBtb2RlICE9PSBudWxsID8gbW9kZSA6IFwiU0FNUExFUlwiO1xuXG4gICAgICAgIHRoaXMuVyA9IG51bGw7XG4gICAgICAgIHRoaXMuSCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy50ZXh0dXJlRGF0YSA9IG51bGw7XG4gICAgICAgIHRoaXMudGV4dHVyZURhdGFUZW1wID0gbnVsbDtcbiAgICAgICAgdGhpcy52ZXJ0ZXhEYXRhMCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5mQnVmZmVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5yZW5kZXJCdWZmZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmZCdWZmZXJUZW1wID0gbnVsbDtcbiAgICAgICAgdGhpcy5yZW5kZXJCdWZmZXJUZW1wID0gbnVsbDtcblxuICAgICAgICBpZiAodGhpcy5tb2RlID09PSBcIlNBTVBMRVJcIikge1xuICAgICAgICAgICAgdGhpcy50ZXh0dXJlRGF0YSA9IHRoaXMuX2dsLmNyZWF0ZVRleHR1cmUoKTtcbiAgICAgICAgICAgIHRoaXMudGV4dHVyZURhdGFUZW1wID0gdGhpcy5fZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFwiU0FNUExFUlwiIHx8IHRoaXMubW9kZSA9PT0gXCJBVFRSSUJVVEVcIiB8fCB0aGlzLm1vZGUgPT09IFwiVkVSVEVYX0lOREVYXCIpIHtcbiAgICAgICAgICAgIHRoaXMudmVydGV4RGF0YTAgPSB0aGlzLl9nbC5jcmVhdGVCdWZmZXIoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxyXG4gICAgICogY3JlYXRlRnJhbWVidWZmZXJBbmRSZW5kZXJidWZmZXJcclxuICAgICAqL1xuXG5cbiAgICBfY3JlYXRlQ2xhc3MoV2ViQ0xHTEJ1ZmZlciwgW3tcbiAgICAgICAga2V5OiBcImNyZWF0ZUZyYW1lYnVmZmVyQW5kUmVuZGVyYnVmZmVyXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjcmVhdGVGcmFtZWJ1ZmZlckFuZFJlbmRlcmJ1ZmZlcigpIHtcbiAgICAgICAgICAgIHZhciBjcmVhdGVXZWJHTFJlbmRlckJ1ZmZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgckJ1ZmZlciA9IHRoaXMuX2dsLmNyZWF0ZVJlbmRlcmJ1ZmZlcigpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRSZW5kZXJidWZmZXIodGhpcy5fZ2wuUkVOREVSQlVGRkVSLCByQnVmZmVyKTtcblxuICAgICAgICAgICAgICAgIC8vIFdlYkdMMjogR0xlbnVtIHRhcmdldCwgR0xlbnVtIGludGVybmFsZm9ybWF0LCBHTHNpemVpIHdpZHRoLCBHTHNpemVpIGhlaWdodFxuICAgICAgICAgICAgICAgIHZhciBpbnRGb3JtYXQgPSB0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgPyB0aGlzLl9nbC5ERVBUSF9DT01QT05FTlQzMkYgOiB0aGlzLl9nbC5ERVBUSF9DT01QT05FTlQxNjtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2dsLnJlbmRlcmJ1ZmZlclN0b3JhZ2UodGhpcy5fZ2wuUkVOREVSQlVGRkVSLCBpbnRGb3JtYXQsIHRoaXMuVywgdGhpcy5IKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRSZW5kZXJidWZmZXIodGhpcy5fZ2wuUkVOREVSQlVGRkVSLCBudWxsKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gckJ1ZmZlcjtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuZkJ1ZmZlciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuZGVsZXRlRnJhbWVidWZmZXIodGhpcy5mQnVmZmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5kZWxldGVGcmFtZWJ1ZmZlcih0aGlzLmZCdWZmZXJUZW1wKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmRlbGV0ZVJlbmRlcmJ1ZmZlcih0aGlzLnJlbmRlckJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuZGVsZXRlUmVuZGVyYnVmZmVyKHRoaXMucmVuZGVyQnVmZmVyVGVtcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmZCdWZmZXIgPSB0aGlzLl9nbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJCdWZmZXIgPSBjcmVhdGVXZWJHTFJlbmRlckJ1ZmZlcigpO1xuICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEZyYW1lYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCB0aGlzLmZCdWZmZXIpO1xuICAgICAgICAgICAgdGhpcy5fZ2wuZnJhbWVidWZmZXJSZW5kZXJidWZmZXIodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIHRoaXMuX2dsLkRFUFRIX0FUVEFDSE1FTlQsIHRoaXMuX2dsLlJFTkRFUkJVRkZFUiwgdGhpcy5yZW5kZXJCdWZmZXIpO1xuXG4gICAgICAgICAgICB0aGlzLmZCdWZmZXJUZW1wID0gdGhpcy5fZ2wuY3JlYXRlRnJhbWVidWZmZXIoKTtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyQnVmZmVyVGVtcCA9IGNyZWF0ZVdlYkdMUmVuZGVyQnVmZmVyKCk7XG4gICAgICAgICAgICB0aGlzLl9nbC5iaW5kRnJhbWVidWZmZXIodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIHRoaXMuZkJ1ZmZlclRlbXApO1xuICAgICAgICAgICAgdGhpcy5fZ2wuZnJhbWVidWZmZXJSZW5kZXJidWZmZXIodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIHRoaXMuX2dsLkRFUFRIX0FUVEFDSE1FTlQsIHRoaXMuX2dsLlJFTkRFUkJVRkZFUiwgdGhpcy5yZW5kZXJCdWZmZXJUZW1wKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIndyaXRlV2ViR0xUZXh0dXJlQnVmZmVyXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBXcml0ZSBXZWJHTFRleHR1cmUgYnVmZmVyXHJcbiAgICAgICAgICogQHBhcmFtIHtBcnJheTxmbG9hdD58RmxvYXQzMkFycmF5fFVpbnQ4QXJyYXl8V2ViR0xUZXh0dXJlfEhUTUxJbWFnZUVsZW1lbnR9IGFyclxyXG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2ZsaXA9ZmFsc2VdXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiB3cml0ZVdlYkdMVGV4dHVyZUJ1ZmZlcihhcnIsIGZsaXApIHtcbiAgICAgICAgICAgIHZhciBwcyA9IGZ1bmN0aW9uICh0ZXgsIGZsaXApIHtcbiAgICAgICAgICAgICAgICBpZiAoZmxpcCA9PT0gZmFsc2UgfHwgZmxpcCA9PT0gdW5kZWZpbmVkIHx8IGZsaXAgPT09IG51bGwpIHRoaXMuX2dsLnBpeGVsU3RvcmVpKHRoaXMuX2dsLlVOUEFDS19GTElQX1lfV0VCR0wsIGZhbHNlKTtlbHNlIHRoaXMuX2dsLnBpeGVsU3RvcmVpKHRoaXMuX2dsLlVOUEFDS19GTElQX1lfV0VCR0wsIHRydWUpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wucGl4ZWxTdG9yZWkodGhpcy5fZ2wuVU5QQUNLX1BSRU1VTFRJUExZX0FMUEhBX1dFQkdMLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuYmluZFRleHR1cmUodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGV4KTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICAgICAgLy8gV2ViR0wyXG4gICAgICAgICAgICAvLyB0ZXhJbWFnZTJEKGVudW0gdGFyZ2V0LCBpbnQgbGV2ZWwsIGludCBpbnRlcm5hbGZvcm1hdCwgc2l6ZWkgd2lkdGgsIHNpemVpIGhlaWdodCwgaW50IGJvcmRlciwgZW51bSBmb3JtYXQsIGVudW0gdHlwZSwgQXJyYXlCdWZmZXJWaWV3IHNyY0RhdGEsIHVpbnQgc3JjT2Zmc2V0KVxuICAgICAgICAgICAgLy8gdGV4SW1hZ2UyRChlbnVtIHRhcmdldCwgaW50IGxldmVsLCBpbnQgaW50ZXJuYWxmb3JtYXQsIHNpemVpIHdpZHRoLCBzaXplaSBoZWlnaHQsIGludCBib3JkZXIsIGVudW0gZm9ybWF0LCBlbnVtIHR5cGUsIFRleEltYWdlU291cmNlIHNvdXJjZSk7XG4gICAgICAgICAgICAvLyB0ZXhJbWFnZTJEKGVudW0gdGFyZ2V0LCBpbnQgbGV2ZWwsIGludCBpbnRlcm5hbGZvcm1hdCwgc2l6ZWkgd2lkdGgsIHNpemVpIGhlaWdodCwgaW50IGJvcmRlciwgZW51bSBmb3JtYXQsIGVudW0gdHlwZSwgaW50cHRyIG9mZnNldCk7XG4gICAgICAgICAgICB2YXIgd3JpdGVUZXhOb3cgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyciBpbnN0YW5jZW9mIEhUTUxJbWFnZUVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy90aGlzLl9nbC50ZXhJbWFnZTJEKHRoaXMuX2dsLlRFWFRVUkVfMkQsIDAsIHRoaXMuX2dsLlJHQkEsIGFyci53aWR0aCwgYXJyLmhlaWdodCwgMCwgdGhpcy5fZ2wuUkdCQSwgdGhpcy5fZ2wuVU5TSUdORURfQllURSwgYXJyKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudHlwZSA9PT0gJ0ZMT0FUNCcpIHRoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCA/IHRoaXMuX2dsLnRleEltYWdlMkQodGhpcy5fZ2wuVEVYVFVSRV8yRCwgMCwgdGhpcy5fZ2wuUkdCQTMyRiwgYXJyLndpZHRoLCBhcnIuaGVpZ2h0LCAwLCB0aGlzLl9nbC5SR0JBLCB0aGlzLl9zdXBwb3J0Rm9ybWF0LCBhcnIpIDogdGhpcy5fZ2wudGV4SW1hZ2UyRCh0aGlzLl9nbC5URVhUVVJFXzJELCAwLCB0aGlzLl9nbC5SR0JBLCB0aGlzLl9nbC5SR0JBLCB0aGlzLl9zdXBwb3J0Rm9ybWF0LCBhcnIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vdGhpcy5fZ2wudGV4SW1hZ2UyRCh0aGlzLl9nbC5URVhUVVJFXzJELCAwLCB0aGlzLl9nbC5SR0JBLCB0aGlzLlcsIHRoaXMuSCwgMCwgdGhpcy5fZ2wuUkdCQSwgdGhpcy5fc3VwcG9ydEZvcm1hdCwgYXJyLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0ID8gdGhpcy5fZ2wudGV4SW1hZ2UyRCh0aGlzLl9nbC5URVhUVVJFXzJELCAwLCB0aGlzLl9nbC5SR0JBMzJGLCB0aGlzLlcsIHRoaXMuSCwgMCwgdGhpcy5fZ2wuUkdCQSwgdGhpcy5fc3VwcG9ydEZvcm1hdCwgYXJyKSA6IHRoaXMuX2dsLnRleEltYWdlMkQodGhpcy5fZ2wuVEVYVFVSRV8yRCwgMCwgdGhpcy5fZ2wuUkdCQSwgdGhpcy5XLCB0aGlzLkgsIDAsIHRoaXMuX2dsLlJHQkEsIHRoaXMuX3N1cHBvcnRGb3JtYXQsIGFycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgICAgICB2YXIgdHAgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wudGV4UGFyYW1ldGVyaSh0aGlzLl9nbC5URVhUVVJFXzJELCB0aGlzLl9nbC5URVhUVVJFX01BR19GSUxURVIsIHRoaXMuX2dsLk5FQVJFU1QpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLnRleFBhcmFtZXRlcmkodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy5fZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCB0aGlzLl9nbC5ORUFSRVNUKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfV1JBUF9TLCB0aGlzLl9nbC5DTEFNUF9UT19FREdFKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfV1JBUF9ULCB0aGlzLl9nbC5DTEFNUF9UT19FREdFKTtcblxuICAgICAgICAgICAgICAgIC8qdGhpcy5fZ2wudGV4UGFyYW1ldGVyaSh0aGlzLl9nbC5URVhUVVJFXzJELCB0aGlzLl9nbC5URVhUVVJFX01BR19GSUxURVIsIHRoaXMuX2dsLkxJTkVBUik7XHJcbiAgICAgICAgICAgICAgICAgdGhpcy5fZ2wudGV4UGFyYW1ldGVyaSh0aGlzLl9nbC5URVhUVVJFXzJELCB0aGlzLl9nbC5URVhUVVJFX01JTl9GSUxURVIsIHRoaXMuX2dsLkxJTkVBUl9NSVBNQVBfTkVBUkVTVCk7XHJcbiAgICAgICAgICAgICAgICAgdGhpcy5fZ2wudGV4UGFyYW1ldGVyaSh0aGlzLl9nbC5URVhUVVJFXzJELCB0aGlzLl9nbC5URVhUVVJFX1dSQVBfUywgdGhpcy5fZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgICAgICAgICAgICAgICAgdGhpcy5fZ2wudGV4UGFyYW1ldGVyaSh0aGlzLl9nbC5URVhUVVJFXzJELCB0aGlzLl9nbC5URVhUVVJFX1dSQVBfVCwgdGhpcy5fZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgICAgICAgICAgICAgICAgdGhpcy5fZ2wuZ2VuZXJhdGVNaXBtYXAodGhpcy5fZ2wuVEVYVFVSRV8yRCk7Ki9cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICAgICAgaWYgKGFyciBpbnN0YW5jZW9mIFdlYkdMVGV4dHVyZSkge1xuICAgICAgICAgICAgICAgIHRoaXMudGV4dHVyZURhdGEgPSBhcnI7XG4gICAgICAgICAgICAgICAgdGhpcy50ZXh0dXJlRGF0YVRlbXAgPSBhcnI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBzKHRoaXMudGV4dHVyZURhdGEsIGZsaXApO1xuICAgICAgICAgICAgICAgIHdyaXRlVGV4Tm93KGFycik7XG4gICAgICAgICAgICAgICAgdHAoKTtcblxuICAgICAgICAgICAgICAgIHBzKHRoaXMudGV4dHVyZURhdGFUZW1wLCBmbGlwKTtcbiAgICAgICAgICAgICAgICB3cml0ZVRleE5vdyhhcnIpO1xuICAgICAgICAgICAgICAgIHRwKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRUZXh0dXJlKHRoaXMuX2dsLlRFWFRVUkVfMkQsIG51bGwpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwid3JpdGVCdWZmZXJcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFdyaXRlIG9uIGJ1ZmZlclxyXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXk8ZmxvYXQ+fEZsb2F0MzJBcnJheXxVaW50OEFycmF5fFdlYkdMVGV4dHVyZXxIVE1MSW1hZ2VFbGVtZW50fSBhcnJcclxuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtmbGlwPWZhbHNlXVxyXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXk8RmxvYXQyPn0gW292ZXJyaWRlRGltZW5zaW9ucz1uZXcgQXJyYXkoKXtNYXRoLnNxcnQodmFsdWUubGVuZ3RoKSwgTWF0aC5zcXJ0KHZhbHVlLmxlbmd0aCl9XVxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gd3JpdGVCdWZmZXIoYXJyLCBmbGlwLCBvdmVycmlkZURpbWVuc2lvbnMpIHtcbiAgICAgICAgICAgIHZhciBwcmVwYXJlQXJyID0gZnVuY3Rpb24gKGFycikge1xuICAgICAgICAgICAgICAgIGlmICghKGFyciBpbnN0YW5jZW9mIEhUTUxJbWFnZUVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmxlbmd0aC5jb25zdHJ1Y3RvciA9PT0gQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGVuZ3RoID0gdGhpcy5sZW5ndGhbMF0gKiB0aGlzLmxlbmd0aFsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuVyA9IHRoaXMubGVuZ3RoWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5IID0gdGhpcy5sZW5ndGhbMV07XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLlcgPSBNYXRoLmNlaWwoTWF0aC5zcXJ0KHRoaXMubGVuZ3RoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLkggPSB0aGlzLlc7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50eXBlID09PSAnRkxPQVQ0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJyID0gYXJyIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5ID8gYXJyIDogbmV3IEZsb2F0MzJBcnJheShhcnIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbCA9IHRoaXMuVyAqIHRoaXMuSCAqIDQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXJyLmxlbmd0aCAhPT0gbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhcnJ0ID0gbmV3IEZsb2F0MzJBcnJheShsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8IGw7IG4rKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnJ0W25dID0gYXJyW25dICE9IG51bGwgPyBhcnJbbl0gOiAwLjA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyciA9IGFycnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy50eXBlID09PSAnRkxPQVQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgX2wgPSB0aGlzLlcgKiB0aGlzLkggKiA0O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFycmF5VGVtcCA9IG5ldyBGbG9hdDMyQXJyYXkoX2wpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgX24gPSAwLCBmID0gdGhpcy5XICogdGhpcy5IOyBfbiA8IGY7IF9uKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaWRkID0gX24gKiA0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFycmF5VGVtcFtpZGRdID0gYXJyW19uXSAhPSBudWxsID8gYXJyW19uXSA6IDAuMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnJheVRlbXBbaWRkICsgMV0gPSAwLjA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyYXlUZW1wW2lkZCArIDJdID0gMC4wO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFycmF5VGVtcFtpZGQgKyAzXSA9IDAuMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGFyciA9IGFycmF5VGVtcDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYXJyO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgICAgICBpZiAob3ZlcnJpZGVEaW1lbnNpb25zID09PSB1bmRlZmluZWQgfHwgb3ZlcnJpZGVEaW1lbnNpb25zID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyciBpbnN0YW5jZW9mIEhUTUxJbWFnZUVsZW1lbnQpIHRoaXMubGVuZ3RoID0gYXJyLndpZHRoICogYXJyLmhlaWdodDtlbHNlIHRoaXMubGVuZ3RoID0gdGhpcy50eXBlID09PSBcIkZMT0FUNFwiID8gYXJyLmxlbmd0aCAvIDQgOiBhcnIubGVuZ3RoO1xuICAgICAgICAgICAgfSBlbHNlIHRoaXMubGVuZ3RoID0gW292ZXJyaWRlRGltZW5zaW9uc1swXSwgb3ZlcnJpZGVEaW1lbnNpb25zWzFdXTtcblxuICAgICAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gXCJTQU1QTEVSXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndyaXRlV2ViR0xUZXh0dXJlQnVmZmVyKHByZXBhcmVBcnIoYXJyKSwgZmxpcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5tb2RlID09PSBcIlNBTVBMRVJcIiB8fCB0aGlzLm1vZGUgPT09IFwiQVRUUklCVVRFXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkFSUkFZX0JVRkZFUiwgdGhpcy52ZXJ0ZXhEYXRhMCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuYnVmZmVyRGF0YSh0aGlzLl9nbC5BUlJBWV9CVUZGRVIsIGFyciBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSA/IGFyciA6IG5ldyBGbG9hdDMyQXJyYXkoYXJyKSwgdGhpcy5fZ2wuU1RBVElDX0RSQVcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gXCJWRVJURVhfSU5ERVhcIikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRCdWZmZXIodGhpcy5fZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIHRoaXMudmVydGV4RGF0YTApO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJ1ZmZlckRhdGEodGhpcy5fZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG5ldyBVaW50MTZBcnJheShhcnIpLCB0aGlzLl9nbC5TVEFUSUNfRFJBVyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY3JlYXRlRnJhbWVidWZmZXJBbmRSZW5kZXJidWZmZXIoKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInJlbW92ZVwiLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUmVtb3ZlIHRoaXMgYnVmZmVyXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiByZW1vdmUoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5tb2RlID09PSBcIlNBTVBMRVJcIikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmRlbGV0ZVRleHR1cmUodGhpcy50ZXh0dXJlRGF0YSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuZGVsZXRlVGV4dHVyZSh0aGlzLnRleHR1cmVEYXRhVGVtcCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFwiU0FNUExFUlwiIHx8IHRoaXMubW9kZSA9PT0gXCJBVFRSSUJVVEVcIiB8fCB0aGlzLm1vZGUgPT09IFwiVkVSVEVYX0lOREVYXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5kZWxldGVCdWZmZXIodGhpcy52ZXJ0ZXhEYXRhMCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX2dsLmRlbGV0ZUZyYW1lYnVmZmVyKHRoaXMuZkJ1ZmZlcik7XG4gICAgICAgICAgICB0aGlzLl9nbC5kZWxldGVGcmFtZWJ1ZmZlcih0aGlzLmZCdWZmZXJUZW1wKTtcblxuICAgICAgICAgICAgdGhpcy5fZ2wuZGVsZXRlUmVuZGVyYnVmZmVyKHRoaXMucmVuZGVyQnVmZmVyKTtcbiAgICAgICAgICAgIHRoaXMuX2dsLmRlbGV0ZVJlbmRlcmJ1ZmZlcih0aGlzLnJlbmRlckJ1ZmZlclRlbXApO1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIFdlYkNMR0xCdWZmZXI7XG59KCk7XG5cbmdsb2JhbC5XZWJDTEdMQnVmZmVyID0gV2ViQ0xHTEJ1ZmZlcjtcbm1vZHVsZS5leHBvcnRzLldlYkNMR0xCdWZmZXIgPSBXZWJDTEdMQnVmZmVyOyIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLldlYkNMR0xGb3IgPSB1bmRlZmluZWQ7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KCk7XG5cbmV4cG9ydHMuZ3B1Zm9yID0gZ3B1Zm9yO1xuXG52YXIgX1dlYkNMR0wgPSByZXF1aXJlKFwiLi9XZWJDTEdMLmNsYXNzXCIpO1xuXG52YXIgX1dlYkNMR0xVdGlscyA9IHJlcXVpcmUoXCIuL1dlYkNMR0xVdGlscy5jbGFzc1wiKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuLyoqXG4gKiBXZWJDTEdMRm9yXG4gKiBAY2xhc3NcbiAqL1xudmFyIFdlYkNMR0xGb3IgPSBleHBvcnRzLldlYkNMR0xGb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gV2ViQ0xHTEZvcihqc29uSW4pIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFdlYkNMR0xGb3IpO1xuXG4gICAgICAgIHRoaXMua2VybmVscyA9IHt9O1xuICAgICAgICB0aGlzLnZlcnRleEZyYWdtZW50UHJvZ3JhbXMgPSB7fTtcbiAgICAgICAgdGhpcy5fYXJncyA9IHt9O1xuICAgICAgICB0aGlzLl9hcmdzVmFsdWVzID0ge307XG4gICAgICAgIHRoaXMuY2FsbGVkQXJncyA9IHt9O1xuXG4gICAgICAgIHRoaXMuX3dlYkNMR0wgPSBudWxsO1xuICAgICAgICB0aGlzLl9nbCA9IG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogZGVmaW5lT3V0cHV0VGVtcE1vZGVzXG4gICAgICogQHJldHVybnMge0FycmF5PGJvb2xlYW4+fVxuICAgICAqL1xuXG5cbiAgICBfY3JlYXRlQ2xhc3MoV2ViQ0xHTEZvciwgW3tcbiAgICAgICAga2V5OiBcImRlZmluZU91dHB1dFRlbXBNb2Rlc1wiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZGVmaW5lT3V0cHV0VGVtcE1vZGVzKG91dHB1dCwgYXJncykge1xuICAgICAgICAgICAgdmFyIHNlYXJjaEluQXJncyA9IGZ1bmN0aW9uIHNlYXJjaEluQXJncyhvdXRwdXROYW1lLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSAhPT0gXCJpbmRpY2VzXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBleHBsID0ga2V5LnNwbGl0KFwiIFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChleHBsLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXJnTmFtZSA9IGV4cGxbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ05hbWUgPT09IG91dHB1dE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvdW5kO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIG91dHB1dFRlbXBNb2RlcyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPCBvdXRwdXQubGVuZ3RoOyBuKyspIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRUZW1wTW9kZXNbbl0gPSBvdXRwdXRbbl0gIT0gbnVsbCA/IHNlYXJjaEluQXJncyhvdXRwdXRbbl0sIGFyZ3MpIDogZmFsc2U7XG4gICAgICAgICAgICB9cmV0dXJuIG91dHB1dFRlbXBNb2RlcztcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInByZXBhcmVSZXR1cm5Db2RlXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogcHJlcGFyZVJldHVybkNvZGVcbiAgICAgICAgICogQHJldHVybnMge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBwcmVwYXJlUmV0dXJuQ29kZShzb3VyY2UsIG91dEFyZykge1xuICAgICAgICAgICAgdmFyIG9iak91dFN0ciA9IFtdO1xuICAgICAgICAgICAgdmFyIHJldENvZGUgPSBzb3VyY2UubWF0Y2gobmV3IFJlZ0V4cCgvcmV0dXJuLiokL2dtKSk7XG4gICAgICAgICAgICByZXRDb2RlID0gcmV0Q29kZVswXS5yZXBsYWNlKFwicmV0dXJuIFwiLCBcIlwiKTsgLy8gbm93IFwidmFyeFwiIG9yIFwiW3ZhcngxLHZhcngyLC4uXVwiXG4gICAgICAgICAgICB2YXIgaXNBcnIgPSByZXRDb2RlLm1hdGNoKG5ldyBSZWdFeHAoL1xcWy9nbSkpO1xuICAgICAgICAgICAgaWYgKGlzQXJyICE9IG51bGwgJiYgaXNBcnIubGVuZ3RoID49IDEpIHtcbiAgICAgICAgICAgICAgICAvLyB0eXBlIG91dHB1dHMgYXJyYXlcbiAgICAgICAgICAgICAgICByZXRDb2RlID0gcmV0Q29kZS5zcGxpdChcIltcIilbMV0uc3BsaXQoXCJdXCIpWzBdO1xuICAgICAgICAgICAgICAgIHZhciBpdGVtU3RyID0gXCJcIixcbiAgICAgICAgICAgICAgICAgICAgb3BlblBhcmVudGggPSAwO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDwgcmV0Q29kZS5sZW5ndGg7IG4rKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmV0Q29kZVtuXSA9PT0gXCIsXCIgJiYgb3BlblBhcmVudGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iak91dFN0ci5wdXNoKGl0ZW1TdHIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbVN0ciA9IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpdGVtU3RyICs9IHJldENvZGVbbl07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHJldENvZGVbbl0gPT09IFwiKFwiKSBvcGVuUGFyZW50aCsrO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmV0Q29kZVtuXSA9PT0gXCIpXCIpIG9wZW5QYXJlbnRoLS07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG9iak91dFN0ci5wdXNoKGl0ZW1TdHIpOyAvLyBhbmQgdGhlIGxhc3RcbiAgICAgICAgICAgIH0gZWxzZSAvLyB0eXBlIG9uZSBvdXRwdXRcbiAgICAgICAgICAgICAgICBvYmpPdXRTdHIucHVzaChyZXRDb2RlLnJlcGxhY2UoLzskL2dtLCBcIlwiKSk7XG5cbiAgICAgICAgICAgIHZhciByZXR1cm5Db2RlID0gXCJcIjtcbiAgICAgICAgICAgIGZvciAodmFyIF9uID0gMDsgX24gPCBvdXRBcmcubGVuZ3RoOyBfbisrKSB7XG4gICAgICAgICAgICAgICAgLy8gc2V0IG91dHB1dCB0eXBlIGZsb2F0fGZsb2F0NFxuICAgICAgICAgICAgICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLl9hcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkgIT09IFwiaW5kaWNlc1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXhwbCA9IGtleS5zcGxpdChcIiBcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChleHBsWzFdID09PSBvdXRBcmdbX25dKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG10ID0gZXhwbFswXS5tYXRjaChuZXcgUmVnRXhwKFwiZmxvYXQ0XCIsIFwiZ21cIikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybkNvZGUgKz0gbXQgIT0gbnVsbCAmJiBtdC5sZW5ndGggPiAwID8gXCJvdXRcIiArIF9uICsgXCJfZmxvYXQ0ID0gXCIgKyBvYmpPdXRTdHJbX25dICsgXCI7XFxuXCIgOiBcIm91dFwiICsgX24gKyBcIl9mbG9hdCA9IFwiICsgb2JqT3V0U3RyW19uXSArIFwiO1xcblwiO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChmb3VuZCA9PT0gZmFsc2UpIHJldHVybkNvZGUgKz0gXCJvdXRcIiArIF9uICsgXCJfZmxvYXQ0ID0gXCIgKyBvYmpPdXRTdHJbX25dICsgXCI7XFxuXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmV0dXJuQ29kZTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImFkZEtlcm5lbFwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFkZCBvbmUgV2ViQ0xHTEtlcm5lbCB0byB0aGUgd29ya1xuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0ga2VybmVsSnNvblxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGFkZEtlcm5lbChrZXJuZWxKc29uKSB7XG4gICAgICAgICAgICB2YXIgY29uZiA9IGtlcm5lbEpzb24uY29uZmlnO1xuICAgICAgICAgICAgdmFyIGlkeCA9IGNvbmZbMF07XG4gICAgICAgICAgICB2YXIgb3V0QXJnID0gY29uZlsxXSBpbnN0YW5jZW9mIEFycmF5ID8gY29uZlsxXSA6IFtjb25mWzFdXTtcbiAgICAgICAgICAgIHZhciBrSCA9IGNvbmZbMl07XG4gICAgICAgICAgICB2YXIga1MgPSBjb25mWzNdO1xuXG4gICAgICAgICAgICB2YXIga2VybmVsID0gdGhpcy5fd2ViQ0xHTC5jcmVhdGVLZXJuZWwoKTtcblxuICAgICAgICAgICAgdmFyIHN0ckFyZ3MgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLl9hcmdzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGV4cGwgPSBrZXkuc3BsaXQoXCIgXCIpO1xuICAgICAgICAgICAgICAgIHZhciBhcmdOYW1lID0gZXhwbFsxXTtcblxuICAgICAgICAgICAgICAgIC8vIHNlYXJjaCBhcmd1bWVudHMgaW4gdXNlXG4gICAgICAgICAgICAgICAgaWYgKGFyZ05hbWUgIT09IHVuZGVmaW5lZCAmJiBhcmdOYW1lICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXRjaGVzID0gKGtIICsga1MpLm1hdGNoKG5ldyBSZWdFeHAoYXJnTmFtZS5yZXBsYWNlKC9cXFtcXGQuKi8sIFwiXCIpLCBcImdtXCIpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSAhPT0gXCJpbmRpY2VzXCIgJiYgbWF0Y2hlcyAhPSBudWxsICYmIG1hdGNoZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAga2VybmVsLmluX3ZhbHVlc1thcmdOYW1lXSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RyQXJncy5wdXNoKGtleS5yZXBsYWNlKFwiKmF0dHIgXCIsIFwiKiBcIikucmVwbGFjZSgvXFxbXFxkLiovLCBcIlwiKSk7IC8vIG1ha2UgcmVwbGFjZSBmb3IgZW5zdXJlIG5vICphdHRyIGluIEtFUk5FTFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBrUyA9ICd2b2lkIG1haW4oJyArIHN0ckFyZ3MudG9TdHJpbmcoKSArICcpIHsnICsgJ3ZlYzIgJyArIGlkeCArICcgPSBnZXRfZ2xvYmFsX2lkKCk7JyArIGtTLnJlcGxhY2UoL3JldHVybi4qJC9nbSwgdGhpcy5wcmVwYXJlUmV0dXJuQ29kZShrUywgb3V0QXJnKSkgKyAnfSc7XG5cbiAgICAgICAgICAgIGtlcm5lbC5uYW1lID0ga2VybmVsSnNvbi5uYW1lO1xuICAgICAgICAgICAga2VybmVsLnZpZXdTb3VyY2UgPSBrZXJuZWxKc29uLnZpZXdTb3VyY2UgIT0gbnVsbCA/IGtlcm5lbEpzb24udmlld1NvdXJjZSA6IGZhbHNlO1xuICAgICAgICAgICAga2VybmVsLnNldEtlcm5lbFNvdXJjZShrUywga0gpO1xuXG4gICAgICAgICAgICBrZXJuZWwub3V0cHV0ID0gb3V0QXJnO1xuICAgICAgICAgICAga2VybmVsLm91dHB1dFRlbXBNb2RlcyA9IHRoaXMuZGVmaW5lT3V0cHV0VGVtcE1vZGVzKG91dEFyZywgdGhpcy5fYXJncyk7XG4gICAgICAgICAgICBrZXJuZWwuZW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgICBrZXJuZWwuZHJhd01vZGUgPSBrZXJuZWxKc29uLmRyYXdNb2RlICE9IG51bGwgPyBrZXJuZWxKc29uLmRyYXdNb2RlIDogNDtcbiAgICAgICAgICAgIGtlcm5lbC5kZXB0aFRlc3QgPSBrZXJuZWxKc29uLmRlcHRoVGVzdCAhPSBudWxsID8ga2VybmVsSnNvbi5kZXB0aFRlc3QgOiB0cnVlO1xuICAgICAgICAgICAga2VybmVsLmJsZW5kID0ga2VybmVsSnNvbi5ibGVuZCAhPSBudWxsID8ga2VybmVsSnNvbi5ibGVuZCA6IGZhbHNlO1xuICAgICAgICAgICAga2VybmVsLmJsZW5kRXF1YXRpb24gPSBrZXJuZWxKc29uLmJsZW5kRXF1YXRpb24gIT0gbnVsbCA/IGtlcm5lbEpzb24uYmxlbmRFcXVhdGlvbiA6IFwiRlVOQ19BRERcIjtcbiAgICAgICAgICAgIGtlcm5lbC5ibGVuZFNyY01vZGUgPSBrZXJuZWxKc29uLmJsZW5kU3JjTW9kZSAhPSBudWxsID8ga2VybmVsSnNvbi5ibGVuZFNyY01vZGUgOiBcIlNSQ19BTFBIQVwiO1xuICAgICAgICAgICAga2VybmVsLmJsZW5kRHN0TW9kZSA9IGtlcm5lbEpzb24uYmxlbmREc3RNb2RlICE9IG51bGwgPyBrZXJuZWxKc29uLmJsZW5kRHN0TW9kZSA6IFwiT05FX01JTlVTX1NSQ19BTFBIQVwiO1xuXG4gICAgICAgICAgICB0aGlzLmtlcm5lbHNbT2JqZWN0LmtleXModGhpcy5rZXJuZWxzKS5sZW5ndGgudG9TdHJpbmcoKV0gPSBrZXJuZWw7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJhZGRHcmFwaGljXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogYWRkR3JhcGhpY1xuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gZ3JhcGhpY0pzb25cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBhZGRHcmFwaGljKGdyYXBoaWNKc29uKSB7XG4gICAgICAgICAgICB2YXIgY29uZiA9IGdyYXBoaWNKc29uLmNvbmZpZztcbiAgICAgICAgICAgIHZhciBvdXRBcmcgPSBbbnVsbF07XG4gICAgICAgICAgICB2YXIgVkZQX3ZlcnRleEggPSB2b2lkIDA7XG4gICAgICAgICAgICB2YXIgVkZQX3ZlcnRleFMgPSB2b2lkIDA7XG4gICAgICAgICAgICB2YXIgVkZQX2ZyYWdtZW50SCA9IHZvaWQgMDtcbiAgICAgICAgICAgIHZhciBWRlBfZnJhZ21lbnRTID0gdm9pZCAwO1xuICAgICAgICAgICAgaWYgKGNvbmYubGVuZ3RoID09PSA1KSB7XG4gICAgICAgICAgICAgICAgb3V0QXJnID0gY29uZlswXSBpbnN0YW5jZW9mIEFycmF5ID8gY29uZlswXSA6IFtjb25mWzBdXTtcbiAgICAgICAgICAgICAgICBWRlBfdmVydGV4SCA9IGNvbmZbMV07XG4gICAgICAgICAgICAgICAgVkZQX3ZlcnRleFMgPSBjb25mWzJdO1xuICAgICAgICAgICAgICAgIFZGUF9mcmFnbWVudEggPSBjb25mWzNdO1xuICAgICAgICAgICAgICAgIFZGUF9mcmFnbWVudFMgPSBjb25mWzRdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBWRlBfdmVydGV4SCA9IGNvbmZbMF07XG4gICAgICAgICAgICAgICAgVkZQX3ZlcnRleFMgPSBjb25mWzFdO1xuICAgICAgICAgICAgICAgIFZGUF9mcmFnbWVudEggPSBjb25mWzJdO1xuICAgICAgICAgICAgICAgIFZGUF9mcmFnbWVudFMgPSBjb25mWzNdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdmZwcm9ncmFtID0gdGhpcy5fd2ViQ0xHTC5jcmVhdGVWZXJ0ZXhGcmFnbWVudFByb2dyYW0oKTtcblxuICAgICAgICAgICAgdmFyIHN0ckFyZ3NfdiA9IFtdLFxuICAgICAgICAgICAgICAgIHN0ckFyZ3NfZiA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuX2FyZ3MpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXhwbCA9IGtleS5zcGxpdChcIiBcIik7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ05hbWUgPSBleHBsWzFdO1xuXG4gICAgICAgICAgICAgICAgLy8gc2VhcmNoIGFyZ3VtZW50cyBpbiB1c2VcbiAgICAgICAgICAgICAgICBpZiAoYXJnTmFtZSAhPT0gdW5kZWZpbmVkICYmIGFyZ05hbWUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1hdGNoZXMgPSAoVkZQX3ZlcnRleEggKyBWRlBfdmVydGV4UykubWF0Y2gobmV3IFJlZ0V4cChhcmdOYW1lLnJlcGxhY2UoL1xcW1xcZC4qLywgXCJcIiksIFwiZ21cIikpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ICE9PSBcImluZGljZXNcIiAmJiBtYXRjaGVzICE9IG51bGwgJiYgbWF0Y2hlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2ZnByb2dyYW0uaW5fdmVydGV4X3ZhbHVlc1thcmdOYW1lXSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RyQXJnc192LnB1c2goa2V5LnJlcGxhY2UoL1xcW1xcZC4qLywgXCJcIikpOyAvLyBtYWtlIHJlcGxhY2UgZm9yIGVuc3VyZSBubyAqYXR0ciBpbiBLRVJORUxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAodmFyIF9rZXkgaW4gdGhpcy5fYXJncykge1xuICAgICAgICAgICAgICAgIHZhciBfZXhwbCA9IF9rZXkuc3BsaXQoXCIgXCIpO1xuICAgICAgICAgICAgICAgIHZhciBfYXJnTmFtZSA9IF9leHBsWzFdO1xuXG4gICAgICAgICAgICAgICAgLy8gc2VhcmNoIGFyZ3VtZW50cyBpbiB1c2VcbiAgICAgICAgICAgICAgICBpZiAoX2FyZ05hbWUgIT09IHVuZGVmaW5lZCAmJiBfYXJnTmFtZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgX21hdGNoZXMgPSAoVkZQX2ZyYWdtZW50SCArIFZGUF9mcmFnbWVudFMpLm1hdGNoKG5ldyBSZWdFeHAoX2FyZ05hbWUucmVwbGFjZSgvXFxbXFxkLiovLCBcIlwiKSwgXCJnbVwiKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfa2V5ICE9PSBcImluZGljZXNcIiAmJiBfbWF0Y2hlcyAhPSBudWxsICYmIF9tYXRjaGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZmcHJvZ3JhbS5pbl9mcmFnbWVudF92YWx1ZXNbX2FyZ05hbWVdID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJBcmdzX2YucHVzaChfa2V5LnJlcGxhY2UoL1xcW1xcZC4qLywgXCJcIikpOyAvLyBtYWtlIHJlcGxhY2UgZm9yIGVuc3VyZSBubyAqYXR0ciBpbiBLRVJORUxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgVkZQX3ZlcnRleFMgPSAndm9pZCBtYWluKCcgKyBzdHJBcmdzX3YudG9TdHJpbmcoKSArICcpIHsnICsgVkZQX3ZlcnRleFMgKyAnfSc7XG4gICAgICAgICAgICBWRlBfZnJhZ21lbnRTID0gJ3ZvaWQgbWFpbignICsgc3RyQXJnc19mLnRvU3RyaW5nKCkgKyAnKSB7JyArIFZGUF9mcmFnbWVudFMucmVwbGFjZSgvcmV0dXJuLiokL2dtLCB0aGlzLnByZXBhcmVSZXR1cm5Db2RlKFZGUF9mcmFnbWVudFMsIG91dEFyZykpICsgJ30nO1xuXG4gICAgICAgICAgICB2ZnByb2dyYW0ubmFtZSA9IGdyYXBoaWNKc29uLm5hbWU7XG4gICAgICAgICAgICB2ZnByb2dyYW0udmlld1NvdXJjZSA9IGdyYXBoaWNKc29uLnZpZXdTb3VyY2UgIT0gbnVsbCA/IGdyYXBoaWNKc29uLnZpZXdTb3VyY2UgOiBmYWxzZTtcbiAgICAgICAgICAgIHZmcHJvZ3JhbS5zZXRWZXJ0ZXhTb3VyY2UoVkZQX3ZlcnRleFMsIFZGUF92ZXJ0ZXhIKTtcbiAgICAgICAgICAgIHZmcHJvZ3JhbS5zZXRGcmFnbWVudFNvdXJjZShWRlBfZnJhZ21lbnRTLCBWRlBfZnJhZ21lbnRIKTtcblxuICAgICAgICAgICAgdmZwcm9ncmFtLm91dHB1dCA9IG91dEFyZztcbiAgICAgICAgICAgIHZmcHJvZ3JhbS5vdXRwdXRUZW1wTW9kZXMgPSB0aGlzLmRlZmluZU91dHB1dFRlbXBNb2RlcyhvdXRBcmcsIHRoaXMuX2FyZ3MpO1xuICAgICAgICAgICAgdmZwcm9ncmFtLmVuYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgdmZwcm9ncmFtLmRyYXdNb2RlID0gZ3JhcGhpY0pzb24uZHJhd01vZGUgIT0gbnVsbCA/IGdyYXBoaWNKc29uLmRyYXdNb2RlIDogNDtcbiAgICAgICAgICAgIHZmcHJvZ3JhbS5kZXB0aFRlc3QgPSBncmFwaGljSnNvbi5kZXB0aFRlc3QgIT0gbnVsbCA/IGdyYXBoaWNKc29uLmRlcHRoVGVzdCA6IHRydWU7XG4gICAgICAgICAgICB2ZnByb2dyYW0uYmxlbmQgPSBncmFwaGljSnNvbi5ibGVuZCAhPSBudWxsID8gZ3JhcGhpY0pzb24uYmxlbmQgOiB0cnVlO1xuICAgICAgICAgICAgdmZwcm9ncmFtLmJsZW5kRXF1YXRpb24gPSBncmFwaGljSnNvbi5ibGVuZEVxdWF0aW9uICE9IG51bGwgPyBncmFwaGljSnNvbi5ibGVuZEVxdWF0aW9uIDogXCJGVU5DX0FERFwiO1xuICAgICAgICAgICAgdmZwcm9ncmFtLmJsZW5kU3JjTW9kZSA9IGdyYXBoaWNKc29uLmJsZW5kU3JjTW9kZSAhPSBudWxsID8gZ3JhcGhpY0pzb24uYmxlbmRTcmNNb2RlIDogXCJTUkNfQUxQSEFcIjtcbiAgICAgICAgICAgIHZmcHJvZ3JhbS5ibGVuZERzdE1vZGUgPSBncmFwaGljSnNvbi5ibGVuZERzdE1vZGUgIT0gbnVsbCA/IGdyYXBoaWNKc29uLmJsZW5kRHN0TW9kZSA6IFwiT05FX01JTlVTX1NSQ19BTFBIQVwiO1xuXG4gICAgICAgICAgICB0aGlzLnZlcnRleEZyYWdtZW50UHJvZ3JhbXNbT2JqZWN0LmtleXModGhpcy52ZXJ0ZXhGcmFnbWVudFByb2dyYW1zKS5sZW5ndGgudG9TdHJpbmcoKV0gPSB2ZnByb2dyYW07XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJjaGVja0FyZ1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGNoZWNrQXJnXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBhcmd1bWVudFxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5PFdlYkNMR0xLZXJuZWw+fSBrZXJuZWxzXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXk8V2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbT59IHZmcHNcbiAgICAgICAgICogQHJldHVybnMge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjaGVja0FyZyhhcmd1bWVudCwga2VybmVscywgdmZwcykge1xuICAgICAgICAgICAgdmFyIGtlcm5lbFByID0gW107XG4gICAgICAgICAgICB2YXIgdXNlZEluVmVydGV4ID0gZmFsc2U7XG4gICAgICAgICAgICB2YXIgdXNlZEluRnJhZ21lbnQgPSBmYWxzZTtcblxuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGtlcm5lbHMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXlCIGluIGtlcm5lbHNba2V5XS5pbl92YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluVmFsdWVzID0ga2VybmVsc1trZXldLmluX3ZhbHVlc1trZXlCXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleUIgPT09IGFyZ3VtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBrZXJuZWxQci5wdXNoKGtlcm5lbHNba2V5XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yICh2YXIgX2tleTIgaW4gdmZwcykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIF9rZXlCIGluIHZmcHNbX2tleTJdLmluX3ZlcnRleF92YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIF9pblZhbHVlcyA9IHZmcHNbX2tleTJdLmluX3ZlcnRleF92YWx1ZXNbX2tleUJdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoX2tleUIgPT09IGFyZ3VtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VkSW5WZXJ0ZXggPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfa2V5QjIgaW4gdmZwc1tfa2V5Ml0uaW5fZnJhZ21lbnRfdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfaW5WYWx1ZXMyID0gdmZwc1tfa2V5Ml0uaW5fZnJhZ21lbnRfdmFsdWVzW19rZXlCMl07XG4gICAgICAgICAgICAgICAgICAgIGlmIChfa2V5QjIgPT09IGFyZ3VtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VkSW5GcmFnbWVudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBcInVzZWRJblZlcnRleFwiOiB1c2VkSW5WZXJ0ZXgsXG4gICAgICAgICAgICAgICAgXCJ1c2VkSW5GcmFnbWVudFwiOiB1c2VkSW5GcmFnbWVudCxcbiAgICAgICAgICAgICAgICBcImtlcm5lbFByXCI6IGtlcm5lbFByIH07XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJmaWxsQXJnXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogZmlsbEFyZ1xuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gYXJnTmFtZVxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5PGZsb2F0Pn0gY2xlYXJDb2xvclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGZpbGxBcmcoYXJnTmFtZSwgY2xlYXJDb2xvcikge1xuICAgICAgICAgICAgdGhpcy5fd2ViQ0xHTC5maWxsQnVmZmVyKHRoaXMuX2FyZ3NWYWx1ZXNbYXJnTmFtZV0udGV4dHVyZURhdGEsIGNsZWFyQ29sb3IsIHRoaXMuX2FyZ3NWYWx1ZXNbYXJnTmFtZV0uZkJ1ZmZlciksIHRoaXMuX3dlYkNMR0wuZmlsbEJ1ZmZlcih0aGlzLl9hcmdzVmFsdWVzW2FyZ05hbWVdLnRleHR1cmVEYXRhVGVtcCwgY2xlYXJDb2xvciwgdGhpcy5fYXJnc1ZhbHVlc1thcmdOYW1lXS5mQnVmZmVyVGVtcCk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJnZXRBbGxBcmdzXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IGFsbCBhcmd1bWVudHMgZXhpc3RpbmcgaW4gcGFzc2VkIGtlcm5lbHMgJiB2ZXJ0ZXhGcmFnbWVudFByb2dyYW1zXG4gICAgICAgICAqIEByZXR1cm5zIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0QWxsQXJncygpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9hcmdzVmFsdWVzO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiYWRkQXJnXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogYWRkQXJnXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBhcmdcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBhZGRBcmcoYXJnKSB7XG4gICAgICAgICAgICB0aGlzLl9hcmdzW2FyZ10gPSBudWxsO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZ2V0R1BVRm9yQXJnXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IGFyZ3VtZW50IGZyb20gb3RoZXIgZ3B1Zm9yIChpbnN0ZWFkIG9mIGFkZEFyZyAmIHNldEFyZylcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGFyZ3VtZW50IEFyZ3VtZW50IHRvIHNldFxuICAgICAgICAgKiBAcGFyYW0ge1dlYkNMR0xGb3J9IGdwdWZvclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldEdQVUZvckFyZyhhcmd1bWVudCwgZ3B1Zm9yKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5jYWxsZWRBcmdzLmhhc093blByb3BlcnR5KGFyZ3VtZW50KSA9PT0gZmFsc2UpIHRoaXMuY2FsbGVkQXJnc1thcmd1bWVudF0gPSBbXTtcbiAgICAgICAgICAgIGlmICh0aGlzLmNhbGxlZEFyZ3NbYXJndW1lbnRdLmluZGV4T2YoZ3B1Zm9yKSA9PT0gLTEpIHRoaXMuY2FsbGVkQXJnc1thcmd1bWVudF0ucHVzaChncHVmb3IpO1xuXG4gICAgICAgICAgICBpZiAoZ3B1Zm9yLmNhbGxlZEFyZ3MuaGFzT3duUHJvcGVydHkoYXJndW1lbnQpID09PSBmYWxzZSkgZ3B1Zm9yLmNhbGxlZEFyZ3NbYXJndW1lbnRdID0gW107XG4gICAgICAgICAgICBpZiAoZ3B1Zm9yLmNhbGxlZEFyZ3NbYXJndW1lbnRdLmluZGV4T2YodGhpcykgPT09IC0xKSBncHVmb3IuY2FsbGVkQXJnc1thcmd1bWVudF0ucHVzaCh0aGlzKTtcblxuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGdwdWZvci5fYXJncykge1xuICAgICAgICAgICAgICAgIHZhciBhcmdOYW1lID0ga2V5LnNwbGl0KFwiIFwiKVsxXTtcbiAgICAgICAgICAgICAgICBpZiAoYXJnTmFtZSA9PT0gYXJndW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXJnc1trZXldID0gZ3B1Zm9yLl9hcmdzW2tleV07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2FyZ3NWYWx1ZXNbYXJnTmFtZV0gPSBncHVmb3IuX2FyZ3NWYWx1ZXNbYXJnTmFtZV07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInNldEFyZ1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFzc2lnbiB2YWx1ZSBvZiBhIGFyZ3VtZW50IGZvciBhbGwgYWRkZWQgS2VybmVscyBhbmQgdmVydGV4RnJhZ21lbnRQcm9ncmFtc1xuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gYXJndW1lbnQgQXJndW1lbnQgdG8gc2V0XG4gICAgICAgICAqIEBwYXJhbSB7ZmxvYXR8QXJyYXk8ZmxvYXQ+fEZsb2F0MzJBcnJheXxVaW50OEFycmF5fFdlYkdMVGV4dHVyZXxIVE1MSW1hZ2VFbGVtZW50fSB2YWx1ZVxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5PGZsb2F0Mj59IFtvdmVycmlkZURpbWVuc2lvbnM9bmV3IEFycmF5KCl7TWF0aC5zcXJ0KHZhbHVlLmxlbmd0aCksIE1hdGguc3FydCh2YWx1ZS5sZW5ndGgpfV1cbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IFtvdmVycmlkZVR5cGU9XCJGTE9BVDRcIl0gLSBmb3JjZSBcIkZMT0FUNFwiIG9yIFwiRkxPQVRcIiAoZm9yIG5vIGdyYXBoaWMgcHJvZ3JhbSlcbiAgICAgICAgICogQHJldHVybnMge2Zsb2F0fEFycmF5PGZsb2F0PnxGbG9hdDMyQXJyYXl8VWludDhBcnJheXxXZWJHTFRleHR1cmV8SFRNTEltYWdlRWxlbWVudH1cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRBcmcoYXJndW1lbnQsIHZhbHVlLCBvdmVycmlkZURpbWVuc2lvbnMsIG92ZXJyaWRlVHlwZSkge1xuICAgICAgICAgICAgaWYgKGFyZ3VtZW50ID09PSBcImluZGljZXNcIikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0SW5kaWNlcyh2YWx1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLl9hcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb21wbGV0ZVZhck5hbWUgPSBrZXkuc3BsaXQoXCIgXCIpWzFdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29tcGxldGVWYXJOYW1lICE9PSB1bmRlZmluZWQgJiYgY29tcGxldGVWYXJOYW1lLnJlcGxhY2UoL1xcW1xcZC4qLywgXCJcIikgPT09IGFyZ3VtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29tcGxldGVWYXJOYW1lICE9PSBhcmd1bWVudCkgYXJndW1lbnQgPSBjb21wbGV0ZVZhck5hbWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB1cGRhdGVDYWxsZWRBcmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXkubWF0Y2goL1xcKi9nbSkgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGJ1ZmZlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjaGVja1Jlc3VsdCA9IHRoaXMuY2hlY2tBcmcoYXJndW1lbnQsIHRoaXMua2VybmVscywgdGhpcy52ZXJ0ZXhGcmFnbWVudFByb2dyYW1zKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtb2RlID0gXCJTQU1QTEVSXCI7IC8vIEFUVFJJQlVURSBvciBTQU1QTEVSXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoZWNrUmVzdWx0LnVzZWRJblZlcnRleCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2hlY2tSZXN1bHQua2VybmVsUHIubGVuZ3RoID09PSAwICYmIGNoZWNrUmVzdWx0LnVzZWRJbkZyYWdtZW50ID09PSBmYWxzZSkgbW9kZSA9IFwiQVRUUklCVVRFXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHR5cGUgPSBrZXkuc3BsaXQoXCIqXCIpWzBdLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG92ZXJyaWRlVHlwZSAhPT0gdW5kZWZpbmVkICYmIG92ZXJyaWRlVHlwZSAhPT0gbnVsbCkgdHlwZSA9IG92ZXJyaWRlVHlwZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9hcmdzVmFsdWVzLmhhc093blByb3BlcnR5KGFyZ3VtZW50KSA9PT0gZmFsc2UgfHwgdGhpcy5fYXJnc1ZhbHVlcy5oYXNPd25Qcm9wZXJ0eShhcmd1bWVudCkgPT09IHRydWUgJiYgdGhpcy5fYXJnc1ZhbHVlc1thcmd1bWVudF0gPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXJnc1ZhbHVlc1thcmd1bWVudF0gPSB0aGlzLl93ZWJDTEdMLmNyZWF0ZUJ1ZmZlcih0eXBlLCBmYWxzZSwgbW9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9hcmdzVmFsdWVzW2FyZ3VtZW50XS5hcmd1bWVudCA9IGFyZ3VtZW50O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVDYWxsZWRBcmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2FyZ3NWYWx1ZXNbYXJndW1lbnRdLndyaXRlQnVmZmVyKHZhbHVlLCBmYWxzZSwgb3ZlcnJpZGVEaW1lbnNpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9hcmdzVmFsdWVzW2FyZ3VtZW50XSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVTklGT1JNXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwpIHRoaXMuX2FyZ3NWYWx1ZXNbYXJndW1lbnRdID0gdmFsdWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVDYWxsZWRBcmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodXBkYXRlQ2FsbGVkQXJnID09PSB0cnVlICYmIHRoaXMuY2FsbGVkQXJncy5oYXNPd25Qcm9wZXJ0eShhcmd1bWVudCkgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8IHRoaXMuY2FsbGVkQXJnc1thcmd1bWVudF0ubGVuZ3RoOyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIF9ncHVmb3IgPSB0aGlzLmNhbGxlZEFyZ3NbYXJndW1lbnRdW25dO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfZ3B1Zm9yLl9hcmdzVmFsdWVzW2FyZ3VtZW50XSA9IHRoaXMuX2FyZ3NWYWx1ZXNbYXJndW1lbnRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJyZWFkQXJnXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IEZsb2F0MzJBcnJheSBhcnJheSBmcm9tIGEgYXJndW1lbnRcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGFyZ3VtZW50XG4gICAgICAgICAqIEByZXR1cm5zIHtGbG9hdDMyQXJyYXl9XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcmVhZEFyZyhhcmd1bWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dlYkNMR0wucmVhZEJ1ZmZlcih0aGlzLl9hcmdzVmFsdWVzW2FyZ3VtZW50XSk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJzZXRJbmRpY2VzXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogU2V0IGluZGljZXMgZm9yIHRoZSBnZW9tZXRyeSBwYXNzZWQgaW4gdmVydGV4RnJhZ21lbnRQcm9ncmFtXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXk8ZmxvYXQ+fSBhcnJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRJbmRpY2VzKGFycikge1xuICAgICAgICAgICAgdGhpcy5DTEdMX2J1ZmZlckluZGljZXMgPSB0aGlzLl93ZWJDTEdMLmNyZWF0ZUJ1ZmZlcihcIkZMT0FUXCIsIGZhbHNlLCBcIlZFUlRFWF9JTkRFWFwiKTtcbiAgICAgICAgICAgIHRoaXMuQ0xHTF9idWZmZXJJbmRpY2VzLndyaXRlQnVmZmVyKGFycik7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJnZXRDdHhcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBnZXRDdHhcbiAgICAgICAgICogcmV0dXJucyB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldEN0eCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWJDTEdMLmdldENvbnRleHQoKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInNldEN0eFwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIHNldEN0eFxuICAgICAgICAgKiBAcGFyYW0ge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gZ2xcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRDdHgoZ2wpIHtcbiAgICAgICAgICAgIHRoaXMuX2dsID0gZ2w7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJnZXRXZWJDTEdMXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogZ2V0V2ViQ0xHTFxuICAgICAgICAgKiByZXR1cm5zIHtXZWJDTEdMfVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldFdlYkNMR0woKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fd2ViQ0xHTDtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIm9uUHJlUHJvY2Vzc0tlcm5lbFwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIG9uUHJlUHJvY2Vzc0tlcm5lbFxuICAgICAgICAgKiBAcGFyYW0ge2ludH0gW2tlcm5lbE51bT0wXVxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIG9uUHJlUHJvY2Vzc0tlcm5lbChrZXJuZWxOdW0sIGZuKSB7XG4gICAgICAgICAgICB0aGlzLmtlcm5lbHNba2VybmVsTnVtXS5vbnByZSA9IGZuO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwib25Qb3N0UHJvY2Vzc0tlcm5lbFwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIG9uUG9zdFByb2Nlc3NLZXJuZWxcbiAgICAgICAgICogQHBhcmFtIHtpbnR9IFtrZXJuZWxOdW09MF1cbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBvblBvc3RQcm9jZXNzS2VybmVsKGtlcm5lbE51bSwgZm4pIHtcbiAgICAgICAgICAgIHRoaXMua2VybmVsc1trZXJuZWxOdW1dLm9ucG9zdCA9IGZuO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZW5hYmxlS2VybmVsXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogZW5hYmxlS2VybmVsXG4gICAgICAgICAqIEBwYXJhbSB7aW50fSBba2VybmVsTnVtPTBdXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZW5hYmxlS2VybmVsKGtlcm5lbE51bSkge1xuICAgICAgICAgICAgdGhpcy5rZXJuZWxzW2tlcm5lbE51bS50b1N0cmluZygpIHwgXCIwXCJdLmVuYWJsZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZGlzYWJsZUtlcm5lbFwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGRpc2FibGVLZXJuZWxcbiAgICAgICAgICogQHBhcmFtIHtpbnR9IFtrZXJuZWxOdW09MF1cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBkaXNhYmxlS2VybmVsKGtlcm5lbE51bSkge1xuICAgICAgICAgICAgdGhpcy5rZXJuZWxzW2tlcm5lbE51bS50b1N0cmluZygpIHwgXCIwXCJdLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImdldEtlcm5lbFwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBvbmUgYWRkZWQgV2ViQ0xHTEtlcm5lbFxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBHZXQgYXNzaWduZWQga2VybmVsIGZvciB0aGlzIGFyZ3VtZW50XG4gICAgICAgICAqIEByZXR1cm5zIHtXZWJDTEdMS2VybmVsfVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldEtlcm5lbChuYW1lKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5rZXJuZWxzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gbmFtZSkgcmV0dXJuIHRoaXMua2VybmVsc1trZXldO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImdldEFsbEtlcm5lbHNcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgYWxsIGFkZGVkIFdlYkNMR0xLZXJuZWxzXG4gICAgICAgICAqIEByZXR1cm5zIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0QWxsS2VybmVscygpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmtlcm5lbHM7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJvblByZVByb2Nlc3NHcmFwaGljXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogb25QcmVQcm9jZXNzR3JhcGhpY1xuICAgICAgICAgKiBAcGFyYW0ge2ludH0gW2dyYXBoaWNOdW09MF1cbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBvblByZVByb2Nlc3NHcmFwaGljKGdyYXBoaWNOdW0sIGZuKSB7XG4gICAgICAgICAgICB0aGlzLnZlcnRleEZyYWdtZW50UHJvZ3JhbXNbZ3JhcGhpY051bV0ub25wcmUgPSBmbjtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIm9uUG9zdFByb2Nlc3NHcmFwaGljXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogb25Qb3N0UHJvY2Vzc0dyYXBoaWNcbiAgICAgICAgICogQHBhcmFtIHtpbnR9IFtncmFwaGljTnVtPTBdXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gb25Qb3N0UHJvY2Vzc0dyYXBoaWMoZ3JhcGhpY051bSwgZm4pIHtcbiAgICAgICAgICAgIHRoaXMudmVydGV4RnJhZ21lbnRQcm9ncmFtc1tncmFwaGljTnVtXS5vbnBvc3QgPSBmbjtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImVuYWJsZUdyYXBoaWNcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBlbmFibGVHcmFwaGljXG4gICAgICAgICAqIEBwYXJhbSB7aW50fSBbZ3JhcGhpY051bT0wXVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGVuYWJsZUdyYXBoaWMoZ3JhcGhpY051bSkge1xuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhGcmFnbWVudFByb2dyYW1zW2dyYXBoaWNOdW0udG9TdHJpbmcoKSB8IFwiMFwiXS5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImRpc2FibGVHcmFwaGljXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogZGlzYWJsZUdyYXBoaWNcbiAgICAgICAgICogQHBhcmFtIHtpbnR9IFtncmFwaGljTnVtPTBdXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZGlzYWJsZUdyYXBoaWMoZ3JhcGhpY051bSkge1xuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhGcmFnbWVudFByb2dyYW1zW2dyYXBoaWNOdW0udG9TdHJpbmcoKSB8IFwiMFwiXS5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJnZXRWZXJ0ZXhGcmFnbWVudFByb2dyYW1cIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgb25lIGFkZGVkIFdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW1cbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgR2V0IGFzc2lnbmVkIHZmcCBmb3IgdGhpcyBhcmd1bWVudFxuICAgICAgICAgKiBAcmV0dXJucyB7V2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbX1cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRWZXJ0ZXhGcmFnbWVudFByb2dyYW0obmFtZSkge1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMudmVydGV4RnJhZ21lbnRQcm9ncmFtcykge1xuICAgICAgICAgICAgICAgIGlmIChrZXkgPT09IG5hbWUpIHJldHVybiB0aGlzLnZlcnRleEZyYWdtZW50UHJvZ3JhbXNba2V5XTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJnZXRBbGxWZXJ0ZXhGcmFnbWVudFByb2dyYW1cIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgYWxsIGFkZGVkIFdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW1zXG4gICAgICAgICAqIEByZXR1cm5zIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0QWxsVmVydGV4RnJhZ21lbnRQcm9ncmFtKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmVydGV4RnJhZ21lbnRQcm9ncmFtcztcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInByb2Nlc3NLZXJuZWxcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQcm9jZXNzIGtlcm5lbHNcbiAgICAgICAgICogQHBhcmFtIHtXZWJDTEdMS2VybmVsfSBrZXJuZWxcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBbb3V0cHV0VG9UZW1wPW51bGxdXG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3Byb2Nlc3NDb3BdXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcHJvY2Vzc0tlcm5lbChrZXJuZWwsIG91dHB1dFRvVGVtcCwgcHJvY2Vzc0NvcCkge1xuICAgICAgICAgICAgaWYgKGtlcm5lbC5lbmFibGVkID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHByb2Nlc3NDb3AgIT09IHVuZGVmaW5lZCAmJiBwcm9jZXNzQ29wICE9PSBudWxsICYmIHByb2Nlc3NDb3AgPT09IHRydWUpIHRoaXMuYXJyTWFrZUNvcHkgPSBbXTtcblxuICAgICAgICAgICAgICAgIC8va2VybmVsLmRyYXdNb2RlXG4gICAgICAgICAgICAgICAgaWYgKGtlcm5lbC5kZXB0aFRlc3QgPT09IHRydWUpIHRoaXMuX2dsLmVuYWJsZSh0aGlzLl9nbC5ERVBUSF9URVNUKTtlbHNlIHRoaXMuX2dsLmRpc2FibGUodGhpcy5fZ2wuREVQVEhfVEVTVCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoa2VybmVsLmJsZW5kID09PSB0cnVlKSB0aGlzLl9nbC5lbmFibGUodGhpcy5fZ2wuQkxFTkQpO2Vsc2UgdGhpcy5fZ2wuZGlzYWJsZSh0aGlzLl9nbC5CTEVORCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5ibGVuZEZ1bmModGhpcy5fZ2xba2VybmVsLmJsZW5kU3JjTW9kZV0sIHRoaXMuX2dsW2tlcm5lbC5ibGVuZERzdE1vZGVdKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5ibGVuZEVxdWF0aW9uKHRoaXMuX2dsW2tlcm5lbC5ibGVuZEVxdWF0aW9uXSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoa2VybmVsLm9ucHJlICE9PSB1bmRlZmluZWQgJiYga2VybmVsLm9ucHJlICE9PSBudWxsKSBrZXJuZWwub25wcmUoKTtcblxuICAgICAgICAgICAgICAgIGlmIChvdXRwdXRUb1RlbXAgPT09IHVuZGVmaW5lZCB8fCBvdXRwdXRUb1RlbXAgPT09IG51bGwgfHwgb3V0cHV0VG9UZW1wID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0ZW1wc0ZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDwga2VybmVsLm91dHB1dC5sZW5ndGg7IG4rKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtlcm5lbC5vdXRwdXRbbl0gIT0gbnVsbCAmJiBrZXJuZWwub3V0cHV0VGVtcE1vZGVzW25dID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcHNGb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAodGVtcHNGb3VuZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fd2ViQ0xHTC5lbnF1ZXVlTkRSYW5nZUtlcm5lbChrZXJuZWwsIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmdldE91dHB1dEJ1ZmZlcnMoa2VybmVsLCB0aGlzLl9hcmdzVmFsdWVzKSwgdHJ1ZSwgdGhpcy5fYXJnc1ZhbHVlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFyck1ha2VDb3B5LnB1c2goa2VybmVsKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3dlYkNMR0wuZW5xdWV1ZU5EUmFuZ2VLZXJuZWwoa2VybmVsLCBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5nZXRPdXRwdXRCdWZmZXJzKGtlcm5lbCwgdGhpcy5fYXJnc1ZhbHVlcyksIGZhbHNlLCB0aGlzLl9hcmdzVmFsdWVzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB0aGlzLl93ZWJDTEdMLmVucXVldWVORFJhbmdlS2VybmVsKGtlcm5lbCwgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuZ2V0T3V0cHV0QnVmZmVycyhrZXJuZWwsIHRoaXMuX2FyZ3NWYWx1ZXMpLCBmYWxzZSwgdGhpcy5fYXJnc1ZhbHVlcyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoa2VybmVsLm9ucG9zdCAhPT0gdW5kZWZpbmVkICYmIGtlcm5lbC5vbnBvc3QgIT09IG51bGwpIGtlcm5lbC5vbnBvc3QoKTtcblxuICAgICAgICAgICAgICAgIGlmIChwcm9jZXNzQ29wICE9PSB1bmRlZmluZWQgJiYgcHJvY2Vzc0NvcCAhPT0gbnVsbCAmJiBwcm9jZXNzQ29wID09PSB0cnVlKSB0aGlzLnByb2Nlc3NDb3BpZXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInByb2Nlc3NDb3BpZXNcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHByb2Nlc3NDb3BpZXMob3V0cHV0VG9UZW1wKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8IHRoaXMuYXJyTWFrZUNvcHkubGVuZ3RoOyBuKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLl93ZWJDTEdMLmNvcHkodGhpcy5hcnJNYWtlQ29weVtuXSwgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuZ2V0T3V0cHV0QnVmZmVycyh0aGlzLmFyck1ha2VDb3B5W25dLCB0aGlzLl9hcmdzVmFsdWVzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJwcm9jZXNzS2VybmVsc1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFByb2Nlc3Mga2VybmVsc1xuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvdXRwdXRUb1RlbXA9bnVsbF1cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBwcm9jZXNzS2VybmVscyhvdXRwdXRUb1RlbXApIHtcbiAgICAgICAgICAgIHRoaXMuYXJyTWFrZUNvcHkgPSBbXTtcblxuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMua2VybmVscykge1xuICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc0tlcm5lbCh0aGlzLmtlcm5lbHNba2V5XSwgb3V0cHV0VG9UZW1wKTtcbiAgICAgICAgICAgIH10aGlzLnByb2Nlc3NDb3BpZXMoKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInByb2Nlc3NHcmFwaGljXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogcHJvY2Vzc0dyYXBoaWNcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IFthcmd1bWVudEluZD11bmRlZmluZWRdIEFyZ3VtZW50IGZvciB2ZXJ0aWNlcyBjb3VudCBvciB1bmRlZmluZWQgaWYgYXJndW1lbnQgXCJpbmRpY2VzXCIgZXhpc3RcbiAgICAgICAgICoqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcHJvY2Vzc0dyYXBoaWMoYXJndW1lbnRJbmQpIHtcbiAgICAgICAgICAgIHZhciBhcnJNYWtlQ29weSA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMudmVydGV4RnJhZ21lbnRQcm9ncmFtcykge1xuICAgICAgICAgICAgICAgIHZhciB2ZnAgPSB0aGlzLnZlcnRleEZyYWdtZW50UHJvZ3JhbXNba2V5XTtcblxuICAgICAgICAgICAgICAgIGlmICh2ZnAuZW5hYmxlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYnVmZiA9IChhcmd1bWVudEluZCA9PT0gdW5kZWZpbmVkIHx8IGFyZ3VtZW50SW5kID09PSBudWxsKSAmJiB0aGlzLkNMR0xfYnVmZmVySW5kaWNlcyAhPT0gdW5kZWZpbmVkICYmIHRoaXMuQ0xHTF9idWZmZXJJbmRpY2VzICE9PSBudWxsID8gdGhpcy5DTEdMX2J1ZmZlckluZGljZXMgOiB0aGlzLl9hcmdzVmFsdWVzW2FyZ3VtZW50SW5kXTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYnVmZiAhPT0gdW5kZWZpbmVkICYmIGJ1ZmYgIT09IG51bGwgJiYgYnVmZi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmZwLmRlcHRoVGVzdCA9PT0gdHJ1ZSkgdGhpcy5fZ2wuZW5hYmxlKHRoaXMuX2dsLkRFUFRIX1RFU1QpO2Vsc2UgdGhpcy5fZ2wuZGlzYWJsZSh0aGlzLl9nbC5ERVBUSF9URVNUKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZmcC5ibGVuZCA9PT0gdHJ1ZSkgdGhpcy5fZ2wuZW5hYmxlKHRoaXMuX2dsLkJMRU5EKTtlbHNlIHRoaXMuX2dsLmRpc2FibGUodGhpcy5fZ2wuQkxFTkQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbC5ibGVuZEZ1bmModGhpcy5fZ2xbdmZwLmJsZW5kU3JjTW9kZV0sIHRoaXMuX2dsW3ZmcC5ibGVuZERzdE1vZGVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJsZW5kRXF1YXRpb24odGhpcy5fZ2xbdmZwLmJsZW5kRXF1YXRpb25dKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZmcC5vbnByZSAhPT0gdW5kZWZpbmVkICYmIHZmcC5vbnByZSAhPT0gbnVsbCkgdmZwLm9ucHJlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0ZW1wc0ZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8IHZmcC5vdXRwdXQubGVuZ3RoOyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmZwLm91dHB1dFtuXSAhPSBudWxsICYmIHZmcC5vdXRwdXRUZW1wTW9kZXNbbl0gPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcHNGb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRlbXBzRm91bmQgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl93ZWJDTEdMLmVucXVldWVWZXJ0ZXhGcmFnbWVudFByb2dyYW0odmZwLCBidWZmLCB2ZnAuZHJhd01vZGUsIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmdldE91dHB1dEJ1ZmZlcnModmZwLCB0aGlzLl9hcmdzVmFsdWVzKSwgdHJ1ZSwgdGhpcy5fYXJnc1ZhbHVlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyTWFrZUNvcHkucHVzaCh2ZnApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl93ZWJDTEdMLmVucXVldWVWZXJ0ZXhGcmFnbWVudFByb2dyYW0odmZwLCBidWZmLCB2ZnAuZHJhd01vZGUsIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmdldE91dHB1dEJ1ZmZlcnModmZwLCB0aGlzLl9hcmdzVmFsdWVzKSwgZmFsc2UsIHRoaXMuX2FyZ3NWYWx1ZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmZwLm9ucG9zdCAhPT0gdW5kZWZpbmVkICYmIHZmcC5vbnBvc3QgIT09IG51bGwpIHZmcC5vbnBvc3QoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yICh2YXIgX24yID0gMDsgX24yIDwgYXJyTWFrZUNvcHkubGVuZ3RoOyBfbjIrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuX3dlYkNMR0wuY29weShhcnJNYWtlQ29weVtfbjJdLCBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5nZXRPdXRwdXRCdWZmZXJzKGFyck1ha2VDb3B5W19uMl0sIHRoaXMuX2FyZ3NWYWx1ZXMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImluaVwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGluaXRpYWxpemUgbnVtZXJpY1xuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGluaSgpIHtcbiAgICAgICAgICAgIHZhciBhcmd1bWVudHNzID0gYXJndW1lbnRzWzBdO1xuICAgICAgICAgICAgdmFyIGlkeCA9IHZvaWQgMDtcbiAgICAgICAgICAgIHZhciB0eXBPdXQgPSB2b2lkIDA7XG4gICAgICAgICAgICB2YXIgY29kZSA9IHZvaWQgMDtcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHNzLmxlbmd0aCA+IDMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9hcmdzID0gYXJndW1lbnRzc1swXTtcbiAgICAgICAgICAgICAgICBpZHggPSBhcmd1bWVudHNzWzFdO1xuICAgICAgICAgICAgICAgIHR5cE91dCA9IGFyZ3VtZW50c3NbMl07XG4gICAgICAgICAgICAgICAgY29kZSA9IGFyZ3VtZW50c3NbM107XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FyZ3MgPSBhcmd1bWVudHNzWzBdO1xuICAgICAgICAgICAgICAgIGlkeCA9IGFyZ3VtZW50c3NbMV07XG4gICAgICAgICAgICAgICAgdHlwT3V0ID0gXCJGTE9BVFwiO1xuICAgICAgICAgICAgICAgIGNvZGUgPSBhcmd1bWVudHNzWzJdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBhcmdzXG4gICAgICAgICAgICB2YXIgYnVmZkxlbmd0aCA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5fYXJncykge1xuICAgICAgICAgICAgICAgIHZhciBhcmdWYWwgPSB0aGlzLl9hcmdzW2tleV07XG5cbiAgICAgICAgICAgICAgICB0aGlzLnNldEFyZyhrZXkuc3BsaXQoXCIgXCIpWzFdLCBhcmdWYWwpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGJ1ZmZMZW5ndGggPT09IDAgJiYgKGFyZ1ZhbCBpbnN0YW5jZW9mIEFycmF5IHx8IGFyZ1ZhbCBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSB8fCBhcmdWYWwgaW5zdGFuY2VvZiBVaW50OEFycmF5IHx8IGFyZ1ZhbCBpbnN0YW5jZW9mIEhUTUxJbWFnZUVsZW1lbnQpKSBidWZmTGVuZ3RoID0gYXJnVmFsLmxlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBPdXQgPT09IFwiRkxPQVRcIikgdGhpcy5hZGRBcmcoXCJmbG9hdCogcmVzdWx0XCIpO2Vsc2UgdGhpcy5hZGRBcmcoXCJmbG9hdDQqIHJlc3VsdFwiKTtcbiAgICAgICAgICAgIHRoaXMuc2V0QXJnKFwicmVzdWx0XCIsIG5ldyBGbG9hdDMyQXJyYXkoYnVmZkxlbmd0aCksIG51bGwsIHR5cE91dCk7XG5cbiAgICAgICAgICAgIC8vIGtlcm5lbFxuICAgICAgICAgICAgdGhpcy5hZGRLZXJuZWwoe1xuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcIktFUk5FTFwiLFxuICAgICAgICAgICAgICAgIFwibmFtZVwiOiBcIlNJTVBMRV9LRVJORUxcIixcbiAgICAgICAgICAgICAgICBcInZpZXdTb3VyY2VcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgXCJjb25maWdcIjogW2lkeCwgW1wicmVzdWx0XCJdLCAnJywgY29kZV0gfSk7XG5cbiAgICAgICAgICAgIC8vIHByb2NjZXNzXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NLZXJuZWxzKCk7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLl93ZWJDTEdMLnJlYWRCdWZmZXIodGhpcy5fYXJnc1ZhbHVlc1tcInJlc3VsdFwiXSk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJpbmlHXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogaW5pdGlhbGl6ZSBHcmFwaGljXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gaW5pRygpIHtcbiAgICAgICAgICAgIHRoaXMuX3dlYkNMR0wuZ2V0Q29udGV4dCgpLmRlcHRoRnVuYyh0aGlzLl93ZWJDTEdMLmdldENvbnRleHQoKS5MRVFVQUwpO1xuICAgICAgICAgICAgdGhpcy5fd2ViQ0xHTC5nZXRDb250ZXh0KCkuY2xlYXJEZXB0aCgxLjApO1xuXG4gICAgICAgICAgICB2YXIgYXJndW1lbnRzcyA9IGFyZ3VtZW50c1swXTsgLy8gb3ZlcnJpZGVcbiAgICAgICAgICAgIHRoaXMuX2FyZ3MgPSBhcmd1bWVudHNzWzFdOyAvLyBmaXJzdCBpcyBjb250ZXh0IG9yIGNhbnZhc1xuXG4gICAgICAgICAgICAvLyBrZXJuZWwgJiBncmFwaGljc1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDI7IGkgPCBhcmd1bWVudHNzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50c3NbaV0udHlwZSA9PT0gXCJLRVJORUxcIikgdGhpcy5hZGRLZXJuZWwoYXJndW1lbnRzc1tpXSk7ZWxzZSBpZiAoYXJndW1lbnRzc1tpXS50eXBlID09PSBcIkdSQVBISUNcIikgLy8gVkZQXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkR3JhcGhpYyhhcmd1bWVudHNzW2ldKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gYXJnc1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuX2FyZ3MpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJnVmFsID0gdGhpcy5fYXJnc1trZXldO1xuXG4gICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gXCJpbmRpY2VzXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ1ZhbCAhPT0gbnVsbCkgdGhpcy5zZXRJbmRpY2VzKGFyZ1ZhbCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHRoaXMuc2V0QXJnKGtleS5zcGxpdChcIiBcIilbMV0sIGFyZ1ZhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gV2ViQ0xHTEZvcjtcbn0oKTtcblxuZ2xvYmFsLldlYkNMR0xGb3IgPSBXZWJDTEdMRm9yO1xubW9kdWxlLmV4cG9ydHMuV2ViQ0xHTEZvciA9IFdlYkNMR0xGb3I7XG5cbi8qKlxuICogZ3B1Zm9yXG4gKiBAcmV0dXJucyB7V2ViQ0xHTEZvcnxBcnJheTxmbG9hdD59XG4gKi9cbmZ1bmN0aW9uIGdwdWZvcigpIHtcbiAgICB2YXIgY2xnbEZvciA9IG5ldyBXZWJDTEdMRm9yKCk7XG4gICAgdmFyIF9nbCA9IG51bGw7XG4gICAgaWYgKGFyZ3VtZW50c1swXSBpbnN0YW5jZW9mIFdlYkdMUmVuZGVyaW5nQ29udGV4dCB8fCBhcmd1bWVudHNbMF0gaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0KSB7XG4gICAgICAgIF9nbCA9IGFyZ3VtZW50c1swXTtcblxuICAgICAgICBjbGdsRm9yLnNldEN0eChfZ2wpO1xuICAgICAgICBjbGdsRm9yLl93ZWJDTEdMID0gbmV3IF9XZWJDTEdMLldlYkNMR0woX2dsKTtcbiAgICAgICAgY2xnbEZvci5pbmlHKGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiBjbGdsRm9yO1xuICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzWzBdIGluc3RhbmNlb2YgSFRNTENhbnZhc0VsZW1lbnQpIHtcbiAgICAgICAgX2dsID0gX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuZ2V0V2ViR0xDb250ZXh0RnJvbUNhbnZhcyhhcmd1bWVudHNbMF0pO1xuXG4gICAgICAgIGNsZ2xGb3Iuc2V0Q3R4KF9nbCk7XG4gICAgICAgIGNsZ2xGb3IuX3dlYkNMR0wgPSBuZXcgX1dlYkNMR0wuV2ViQ0xHTChfZ2wpO1xuICAgICAgICBjbGdsRm9yLmluaUcoYXJndW1lbnRzKTtcbiAgICAgICAgcmV0dXJuIGNsZ2xGb3I7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgX2dsID0gX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuZ2V0V2ViR0xDb250ZXh0RnJvbUNhbnZhcyhkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKSwgeyBhbnRpYWxpYXM6IGZhbHNlIH0pO1xuXG4gICAgICAgIGNsZ2xGb3Iuc2V0Q3R4KF9nbCk7XG4gICAgICAgIGNsZ2xGb3IuX3dlYkNMR0wgPSBuZXcgX1dlYkNMR0wuV2ViQ0xHTChfZ2wpO1xuICAgICAgICByZXR1cm4gY2xnbEZvci5pbmkoYXJndW1lbnRzKTtcbiAgICB9XG59XG5nbG9iYWwuZ3B1Zm9yID0gZ3B1Zm9yO1xubW9kdWxlLmV4cG9ydHMuZ3B1Zm9yID0gZ3B1Zm9yOyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5XZWJDTEdMS2VybmVsID0gdW5kZWZpbmVkO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpO1xuXG52YXIgX1dlYkNMR0xVdGlscyA9IHJlcXVpcmUoJy4vV2ViQ0xHTFV0aWxzLmNsYXNzJyk7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbi8qKlxyXG4qIFdlYkNMR0xLZXJuZWwgT2JqZWN0XHJcbiogQGNsYXNzXHJcbiAqIEBwYXJhbSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbFxyXG4gKiBAcGFyYW0ge1N0cmluZ30gc291cmNlXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBoZWFkZXJcclxuKi9cbnZhciBXZWJDTEdMS2VybmVsID0gZXhwb3J0cy5XZWJDTEdMS2VybmVsID0gZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFdlYkNMR0xLZXJuZWwoZ2wsIHNvdXJjZSwgaGVhZGVyKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBXZWJDTEdMS2VybmVsKTtcblxuICAgICAgICB0aGlzLl9nbCA9IGdsO1xuXG4gICAgICAgIHZhciBoaWdoUHJlY2lzaW9uU3VwcG9ydCA9IHRoaXMuX2dsLmdldFNoYWRlclByZWNpc2lvbkZvcm1hdCh0aGlzLl9nbC5GUkFHTUVOVF9TSEFERVIsIHRoaXMuX2dsLkhJR0hfRkxPQVQpO1xuICAgICAgICB0aGlzLl9wcmVjaXNpb24gPSBoaWdoUHJlY2lzaW9uU3VwcG9ydC5wcmVjaXNpb24gIT09IDAgPyAncHJlY2lzaW9uIGhpZ2hwIGZsb2F0O1xcblxcbnByZWNpc2lvbiBoaWdocCBpbnQ7XFxuXFxuJyA6ICdwcmVjaXNpb24gbG93cCBmbG9hdDtcXG5cXG5wcmVjaXNpb24gbG93cCBpbnQ7XFxuXFxuJztcblxuICAgICAgICB0aGlzLnZlcnNpb24gPSB0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgPyBcIiN2ZXJzaW9uIDMwMCBlcyBcXG4gXCIgOiBcIlwiO1xuXG4gICAgICAgIHRoaXMuX2FyckV4dCA9IHRoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCA/IHsgXCJFWFRfY29sb3JfYnVmZmVyX2Zsb2F0XCI6IG51bGwgfSA6IHsgXCJPRVNfdGV4dHVyZV9mbG9hdFwiOiBudWxsLCBcIk9FU190ZXh0dXJlX2Zsb2F0X2xpbmVhclwiOiBudWxsLCBcIk9FU19lbGVtZW50X2luZGV4X3VpbnRcIjogbnVsbCwgXCJXRUJHTF9kcmF3X2J1ZmZlcnNcIjogbnVsbCB9O1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5fYXJyRXh0KSB7XG4gICAgICAgICAgICB0aGlzLl9hcnJFeHRba2V5XSA9IHRoaXMuX2dsLmdldEV4dGVuc2lvbihrZXkpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2FyckV4dFtrZXldID09IG51bGwpIGNvbnNvbGUuZXJyb3IoXCJleHRlbnNpb24gXCIgKyBrZXkgKyBcIiBub3QgYXZhaWxhYmxlXCIpO2Vsc2UgY29uc29sZS5sb2coXCJ1c2luZyBleHRlbnNpb24gXCIgKyBrZXkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5leHREcmF3QnVmZiA9IHRoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCA/IFwiXCIgOiBcIiAjZXh0ZW5zaW9uIEdMX0VYVF9kcmF3X2J1ZmZlcnMgOiByZXF1aXJlXFxuXCI7XG5cbiAgICAgICAgdGhpcy5uYW1lID0gXCJcIjtcbiAgICAgICAgdGhpcy5lbmFibGVkID0gdHJ1ZTtcblxuICAgICAgICB0aGlzLmRlcHRoVGVzdCA9IG51bGw7XG4gICAgICAgIHRoaXMuYmxlbmQgPSBudWxsO1xuICAgICAgICB0aGlzLmJsZW5kU3JjTW9kZSA9IG51bGw7XG4gICAgICAgIHRoaXMuYmxlbmREc3RNb2RlID0gbnVsbDtcbiAgICAgICAgdGhpcy5ibGVuZEVxdWF0aW9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5vbnByZSA9IG51bGw7XG4gICAgICAgIHRoaXMub25wb3N0ID0gbnVsbDtcbiAgICAgICAgdGhpcy52aWV3U291cmNlID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5pbl92YWx1ZXMgPSB7fTtcblxuICAgICAgICB0aGlzLm91dHB1dCA9IG51bGw7IC8vU3RyaW5nIG9yIEFycmF5PFN0cmluZz4gb2YgYXJnIG5hbWVzIHdpdGggdGhlIGl0ZW1zIGluIHNhbWUgb3JkZXIgdGhhdCBpbiB0aGUgZmluYWwgcmV0dXJuXG4gICAgICAgIHRoaXMub3V0cHV0VGVtcE1vZGVzID0gbnVsbDtcbiAgICAgICAgdGhpcy5mQnVmZmVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5mQnVmZmVyVGVtcCA9IG51bGw7XG4gICAgICAgIHRoaXMuZkJ1ZmZlckxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuZkJ1ZmZlckNvdW50ID0gMDtcblxuICAgICAgICBpZiAoc291cmNlICE9PSB1bmRlZmluZWQgJiYgc291cmNlICE9PSBudWxsKSB0aGlzLnNldEtlcm5lbFNvdXJjZShzb3VyY2UsIGhlYWRlcik7XG4gICAgfVxuXG4gICAgLyoqXHJcbiAgICAgKiBVcGRhdGUgdGhlIGtlcm5lbCBzb3VyY2VcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzb3VyY2VcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBbaGVhZGVyPXVuZGVmaW5lZF0gQWRkaXRpb25hbCBmdW5jdGlvbnNcclxuICAgICAqL1xuXG5cbiAgICBfY3JlYXRlQ2xhc3MoV2ViQ0xHTEtlcm5lbCwgW3tcbiAgICAgICAga2V5OiAnc2V0S2VybmVsU291cmNlJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHNldEtlcm5lbFNvdXJjZShzb3VyY2UsIGhlYWRlcikge1xuICAgICAgICAgICAgdmFyIGF0dHJTdHIgPSB0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgPT09IHRydWUgPyBcImluXCIgOiBcImF0dHJpYnV0ZVwiO1xuICAgICAgICAgICAgdmFyIHZhcnlpbmdPdXRTdHIgPSB0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgPT09IHRydWUgPyBcIm91dFwiIDogXCJ2YXJ5aW5nXCI7XG4gICAgICAgICAgICB2YXIgdmFyeWluZ0luU3RyID0gdGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0ID09PSB0cnVlID8gXCJpblwiIDogXCJ2YXJ5aW5nXCI7XG5cbiAgICAgICAgICAgIHZhciBjb21waWxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBzb3VyY2VWZXJ0ZXggPSB0aGlzLnZlcnNpb24gKyB0aGlzLl9wcmVjaXNpb24gKyBhdHRyU3RyICsgJyB2ZWMzIGFWZXJ0ZXhQb3NpdGlvbjtcXG4nICsgdmFyeWluZ091dFN0ciArICcgdmVjMiBnbG9iYWxfaWQ7XFxuJyArICd2b2lkIG1haW4odm9pZCkge1xcbicgKyAnZ2xfUG9zaXRpb24gPSB2ZWM0KGFWZXJ0ZXhQb3NpdGlvbiwgMS4wKTtcXG4nICsgJ2dsb2JhbF9pZCA9IGFWZXJ0ZXhQb3NpdGlvbi54eSowLjUrMC41O1xcbicgKyAnfVxcbic7XG4gICAgICAgICAgICAgICAgdmFyIHNvdXJjZUZyYWdtZW50ID0gdGhpcy52ZXJzaW9uICsgdGhpcy5leHREcmF3QnVmZiArIHRoaXMuX3ByZWNpc2lvbiArIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmxpbmVzX2ZyYWdtZW50X2F0dHJzKHRoaXMuaW5fdmFsdWVzKSArIHZhcnlpbmdJblN0ciArICcgdmVjMiBnbG9iYWxfaWQ7XFxuJyArICd1bmlmb3JtIGZsb2F0IHVCdWZmZXJXaWR0aDsnICsgJ3ZlYzIgZ2V0X2dsb2JhbF9pZCgpIHtcXG4nICsgJ3JldHVybiBnbG9iYWxfaWQ7XFxuJyArICd9XFxuJyArIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmdldF9nbG9iYWxfaWQzX0dMU0xGdW5jdGlvblN0cmluZygpICsgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuZ2V0X2dsb2JhbF9pZDJfR0xTTEZ1bmN0aW9uU3RyaW5nKCkgKyB0aGlzLl9oZWFkICsgKHRoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCA/IF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmxpbmVzX2RyYXdCdWZmZXJzV3JpdGVJbml0X0dMMig4KSA6IFwiXCIpICsgJ3ZvaWQgbWFpbih2b2lkKSB7XFxuJyArIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmxpbmVzX2RyYXdCdWZmZXJzSW5pdCg4KSArIHRoaXMuX3NvdXJjZSArICh0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgPyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5saW5lc19kcmF3QnVmZmVyc1dyaXRlX0dMMig4KSA6IF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmxpbmVzX2RyYXdCdWZmZXJzV3JpdGUoOCkpICsgJ31cXG4nO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5rZXJuZWwgPSB0aGlzLl9nbC5jcmVhdGVQcm9ncmFtKCk7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscygpLmNyZWF0ZVNoYWRlcih0aGlzLl9nbCwgXCJXRUJDTEdMXCIsIHNvdXJjZVZlcnRleCwgc291cmNlRnJhZ21lbnQsIHRoaXMua2VybmVsKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuYXR0cl9WZXJ0ZXhQb3MgPSB0aGlzLl9nbC5nZXRBdHRyaWJMb2NhdGlvbih0aGlzLmtlcm5lbCwgXCJhVmVydGV4UG9zaXRpb25cIik7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnVCdWZmZXJXaWR0aCA9IHRoaXMuX2dsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLmtlcm5lbCwgXCJ1QnVmZmVyV2lkdGhcIik7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5pbl92YWx1ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGV4cGVjdGVkTW9kZSA9IHsgJ2Zsb2F0NF9mcm9tU2FtcGxlcic6IFwiU0FNUExFUlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0X2Zyb21TYW1wbGVyJzogXCJTQU1QTEVSXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAnZmxvYXQnOiBcIlVOSUZPUk1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICdmbG9hdDQnOiBcIlVOSUZPUk1cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICdtYXQ0JzogXCJVTklGT1JNXCIgfVt0aGlzLmluX3ZhbHVlc1trZXldLnR5cGVdO1xuXG4gICAgICAgICAgICAgICAgICAgIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uKHRoaXMuaW5fdmFsdWVzLCBrZXkpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmluX3ZhbHVlc1trZXldLmxvY2F0aW9uID0gW3RoaXMuX2dsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLmtlcm5lbCwga2V5LnJlcGxhY2UoL1xcW1xcZC4qLywgXCJcIikpXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbl92YWx1ZXNba2V5XS5leHBlY3RlZE1vZGUgPSBleHBlY3RlZE1vZGU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiVkVSVEVYIFBST0dSQU1cXG5cIiArIHNvdXJjZVZlcnRleCArIFwiXFxuIEZSQUdNRU5UIFBST0dSQU1cXG5cIiArIHNvdXJjZUZyYWdtZW50O1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgICAgICB2YXIgYXJndW1lbnRzU291cmNlID0gc291cmNlLnNwbGl0KCcpJylbMF0uc3BsaXQoJygnKVsxXS5zcGxpdCgnLCcpOyAvLyBcImZsb2F0KiBBXCIsIFwiZmxvYXQqIEJcIiwgXCJmbG9hdCBDXCIsIFwiZmxvYXQ0KiBEXCJcblxuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGYgPSBhcmd1bWVudHNTb3VyY2UubGVuZ3RoOyBuIDwgZjsgbisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvXFwqL2dtKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJnTmFtZSA9IGFyZ3VtZW50c1NvdXJjZVtuXS5zcGxpdCgnKicpWzFdLnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuY2hlY2tBcmdOYW1lSW5pdGlhbGl6YXRpb24odGhpcy5pbl92YWx1ZXMsIGFyZ05hbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0NC9nbSkgIT0gbnVsbCkgdGhpcy5pbl92YWx1ZXNbYXJnTmFtZV0udHlwZSA9ICdmbG9hdDRfZnJvbVNhbXBsZXInO2Vsc2UgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvZmxvYXQvZ20pICE9IG51bGwpIHRoaXMuaW5fdmFsdWVzW2FyZ05hbWVdLnR5cGUgPSAnZmxvYXRfZnJvbVNhbXBsZXInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzU291cmNlW25dICE9PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfYXJnTmFtZSA9IGFyZ3VtZW50c1NvdXJjZVtuXS5zcGxpdCgnICcpWzFdLnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuaW5fdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5LnJlcGxhY2UoL1xcW1xcZC4qLywgXCJcIikgPT09IF9hcmdOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2FyZ05hbWUgPSBrZXk7IC8vIGZvciBub3JtYWwgdW5pZm9ybSBhcnJheXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uKHRoaXMuaW5fdmFsdWVzLCBfYXJnTmFtZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvZmxvYXQ0L2dtKSAhPSBudWxsKSB0aGlzLmluX3ZhbHVlc1tfYXJnTmFtZV0udHlwZSA9ICdmbG9hdDQnO2Vsc2UgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvZmxvYXQvZ20pICE9IG51bGwpIHRoaXMuaW5fdmFsdWVzW19hcmdOYW1lXS50eXBlID0gJ2Zsb2F0JztlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL21hdDQvZ20pICE9IG51bGwpIHRoaXMuaW5fdmFsdWVzW19hcmdOYW1lXS50eXBlID0gJ21hdDQnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gcGFyc2UgaGVhZGVyXG4gICAgICAgICAgICB0aGlzLl9oZWFkID0gaGVhZGVyICE9PSB1bmRlZmluZWQgJiYgaGVhZGVyICE9PSBudWxsID8gaGVhZGVyIDogJyc7XG4gICAgICAgICAgICB0aGlzLl9oZWFkID0gdGhpcy5faGVhZC5yZXBsYWNlKC9cXHJcXG4vZ2ksICcnKS5yZXBsYWNlKC9cXHIvZ2ksICcnKS5yZXBsYWNlKC9cXG4vZ2ksICcnKTtcbiAgICAgICAgICAgIHRoaXMuX2hlYWQgPSBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5wYXJzZVNvdXJjZSh0aGlzLl9oZWFkLCB0aGlzLmluX3ZhbHVlcywgdGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0KTtcblxuICAgICAgICAgICAgLy8gcGFyc2Ugc291cmNlXG4gICAgICAgICAgICB0aGlzLl9zb3VyY2UgPSBzb3VyY2UucmVwbGFjZSgvXFxyXFxuL2dpLCAnJykucmVwbGFjZSgvXFxyL2dpLCAnJykucmVwbGFjZSgvXFxuL2dpLCAnJyk7XG4gICAgICAgICAgICB0aGlzLl9zb3VyY2UgPSB0aGlzLl9zb3VyY2UucmVwbGFjZSgvXlxcdyogXFx3KlxcKFtcXHdcXHNcXCosXSpcXCkgey9naSwgJycpLnJlcGxhY2UoL30oXFxzfFxcdCkqJC9naSwgJycpO1xuICAgICAgICAgICAgdGhpcy5fc291cmNlID0gX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMucGFyc2VTb3VyY2UodGhpcy5fc291cmNlLCB0aGlzLmluX3ZhbHVlcywgdGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0KTtcblxuICAgICAgICAgICAgdmFyIHRzID0gY29tcGlsZSgpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy52aWV3U291cmNlID09PSB0cnVlKSBjb25zb2xlLmxvZygnJWMgS0VSTkVMOiAnICsgdGhpcy5uYW1lLCAnZm9udC1zaXplOiAyMHB4OyBjb2xvcjogYmx1ZScpLCBjb25zb2xlLmxvZygnJWMgV0VCQ0xHTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScsICdjb2xvcjogZ3JheScpLCBjb25zb2xlLmxvZygnJWMgJyArIGhlYWRlciArIHNvdXJjZSwgJ2NvbG9yOiBncmF5JyksIGNvbnNvbGUubG9nKCclYyBUUkFOU0xBVEVEIFdFQkdMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScsICdjb2xvcjogZGFya2dyYXknKSwgY29uc29sZS5sb2coJyVjICcgKyB0cywgJ2NvbG9yOiBkYXJrZ3JheScpO1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIFdlYkNMR0xLZXJuZWw7XG59KCk7XG5cbmdsb2JhbC5XZWJDTEdMS2VybmVsID0gV2ViQ0xHTEtlcm5lbDtcbm1vZHVsZS5leHBvcnRzLldlYkNMR0xLZXJuZWwgPSBXZWJDTEdMS2VybmVsOyIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KCk7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbi8qKiBcbiogVXRpbGl0aWVzXG4qIEBjbGFzc1xuKiBAY29uc3RydWN0b3JcbiovXG52YXIgV2ViQ0xHTFV0aWxzID0gZXhwb3J0cy5XZWJDTEdMVXRpbHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gV2ViQ0xHTFV0aWxzKCkge1xuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgV2ViQ0xHTFV0aWxzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBsb2FkUXVhZFxuICAgICAqL1xuXG5cbiAgICBfY3JlYXRlQ2xhc3MoV2ViQ0xHTFV0aWxzLCBbe1xuICAgICAgICBrZXk6IFwibG9hZFF1YWRcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGxvYWRRdWFkKG5vZGUsIGxlbmd0aCwgaGVpZ2h0KSB7XG4gICAgICAgICAgICB2YXIgbCA9IGxlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IGxlbmd0aCA9PT0gbnVsbCA/IDAuNSA6IGxlbmd0aDtcbiAgICAgICAgICAgIHZhciBoID0gaGVpZ2h0ID09PSB1bmRlZmluZWQgfHwgaGVpZ2h0ID09PSBudWxsID8gMC41IDogaGVpZ2h0O1xuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhBcnJheSA9IFstbCwgLWgsIDAuMCwgbCwgLWgsIDAuMCwgbCwgaCwgMC4wLCAtbCwgaCwgMC4wXTtcblxuICAgICAgICAgICAgdGhpcy50ZXh0dXJlQXJyYXkgPSBbMC4wLCAwLjAsIDAuMCwgMS4wLCAwLjAsIDAuMCwgMS4wLCAxLjAsIDAuMCwgMC4wLCAxLjAsIDAuMF07XG5cbiAgICAgICAgICAgIHRoaXMuaW5kZXhBcnJheSA9IFswLCAxLCAyLCAwLCAyLCAzXTtcblxuICAgICAgICAgICAgdmFyIG1lc2hPYmplY3QgPSB7fTtcbiAgICAgICAgICAgIG1lc2hPYmplY3QudmVydGV4QXJyYXkgPSB0aGlzLnZlcnRleEFycmF5O1xuICAgICAgICAgICAgbWVzaE9iamVjdC50ZXh0dXJlQXJyYXkgPSB0aGlzLnRleHR1cmVBcnJheTtcbiAgICAgICAgICAgIG1lc2hPYmplY3QuaW5kZXhBcnJheSA9IHRoaXMuaW5kZXhBcnJheTtcblxuICAgICAgICAgICAgcmV0dXJuIG1lc2hPYmplY3Q7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJjcmVhdGVTaGFkZXJcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBjcmVhdGVTaGFkZXJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjcmVhdGVTaGFkZXIoZ2wsIG5hbWUsIHNvdXJjZVZlcnRleCwgc291cmNlRnJhZ21lbnQsIHNoYWRlclByb2dyYW0pIHtcbiAgICAgICAgICAgIHZhciBfc3YgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICBfc2YgPSBmYWxzZTtcblxuICAgICAgICAgICAgdmFyIG1ha2VEZWJ1ZyA9IGZ1bmN0aW9uIChpbmZvTG9nLCBzaGFkZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhpbmZvTG9nKTtcblxuICAgICAgICAgICAgICAgIHZhciBhcnJFcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgZXJyb3JzID0gaW5mb0xvZy5zcGxpdChcIlxcblwiKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBuID0gMCwgZiA9IGVycm9ycy5sZW5ndGg7IG4gPCBmOyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yc1tuXS5tYXRjaCgvXkVSUk9SL2dpbSkgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4cGwgPSBlcnJvcnNbbl0uc3BsaXQoJzonKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsaW5lID0gcGFyc2VJbnQoZXhwbFsyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcnJFcnJvcnMucHVzaChbbGluZSwgZXJyb3JzW25dXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHNvdXIgPSBnbC5nZXRTaGFkZXJTb3VyY2Uoc2hhZGVyKS5zcGxpdChcIlxcblwiKTtcbiAgICAgICAgICAgICAgICBzb3VyLnVuc2hpZnQoXCJcIik7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX24gPSAwLCBfZiA9IHNvdXIubGVuZ3RoOyBfbiA8IF9mOyBfbisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsaW5lV2l0aEVycm9yID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHZhciBlcnJvclN0ciA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBlID0gMCwgZmUgPSBhcnJFcnJvcnMubGVuZ3RoOyBlIDwgZmU7IGUrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKF9uID09PSBhcnJFcnJvcnNbZV1bMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lV2l0aEVycm9yID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvclN0ciA9IGFyckVycm9yc1tlXVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAobGluZVdpdGhFcnJvciA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiJWNcIiArIF9uICsgJyAlYycgKyBzb3VyW19uXSwgXCJjb2xvcjpibGFja1wiLCBcImNvbG9yOmJsdWVcIik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnJWPilrrilrolYycgKyBfbiArICcgJWMnICsgc291cltfbl0gKyAnXFxuJWMnICsgZXJyb3JTdHIsIFwiY29sb3I6cmVkXCIsIFwiY29sb3I6YmxhY2tcIiwgXCJjb2xvcjpibHVlXCIsIFwiY29sb3I6cmVkXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgICAgICB2YXIgc2hhZGVyVmVydGV4ID0gZ2wuY3JlYXRlU2hhZGVyKGdsLlZFUlRFWF9TSEFERVIpO1xuICAgICAgICAgICAgZ2wuc2hhZGVyU291cmNlKHNoYWRlclZlcnRleCwgc291cmNlVmVydGV4KTtcbiAgICAgICAgICAgIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyVmVydGV4KTtcbiAgICAgICAgICAgIGlmICghZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlclZlcnRleCwgZ2wuQ09NUElMRV9TVEFUVVMpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGluZm9Mb2cgPSBnbC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlclZlcnRleCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCIlY1wiICsgbmFtZSArICcgRVJST1IgKHZlcnRleCBwcm9ncmFtKScsIFwiY29sb3I6cmVkXCIpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGluZm9Mb2cgIT09IHVuZGVmaW5lZCAmJiBpbmZvTG9nICE9PSBudWxsKSBtYWtlRGVidWcoaW5mb0xvZywgc2hhZGVyVmVydGV4KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZ2wuYXR0YWNoU2hhZGVyKHNoYWRlclByb2dyYW0sIHNoYWRlclZlcnRleCk7XG4gICAgICAgICAgICAgICAgX3N2ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHNoYWRlckZyYWdtZW50ID0gZ2wuY3JlYXRlU2hhZGVyKGdsLkZSQUdNRU5UX1NIQURFUik7XG4gICAgICAgICAgICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyRnJhZ21lbnQsIHNvdXJjZUZyYWdtZW50KTtcbiAgICAgICAgICAgIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyRnJhZ21lbnQpO1xuICAgICAgICAgICAgaWYgKCFnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyRnJhZ21lbnQsIGdsLkNPTVBJTEVfU1RBVFVTKSkge1xuICAgICAgICAgICAgICAgIHZhciBfaW5mb0xvZyA9IGdsLmdldFNoYWRlckluZm9Mb2coc2hhZGVyRnJhZ21lbnQpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiJWNcIiArIG5hbWUgKyAnIEVSUk9SIChmcmFnbWVudCBwcm9ncmFtKScsIFwiY29sb3I6cmVkXCIpO1xuXG4gICAgICAgICAgICAgICAgaWYgKF9pbmZvTG9nICE9PSB1bmRlZmluZWQgJiYgX2luZm9Mb2cgIT09IG51bGwpIG1ha2VEZWJ1ZyhfaW5mb0xvZywgc2hhZGVyRnJhZ21lbnQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBnbC5hdHRhY2hTaGFkZXIoc2hhZGVyUHJvZ3JhbSwgc2hhZGVyRnJhZ21lbnQpO1xuICAgICAgICAgICAgICAgIF9zZiA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChfc3YgPT09IHRydWUgJiYgX3NmID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgZ2wubGlua1Byb2dyYW0oc2hhZGVyUHJvZ3JhbSk7XG4gICAgICAgICAgICAgICAgdmFyIHN1Y2Nlc3MgPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHNoYWRlclByb2dyYW0sIGdsLkxJTktfU1RBVFVTKTtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRXJyb3Igc2hhZGVyIHByb2dyYW0gJyArIG5hbWUgKyAnOlxcbiAnKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxvZyA9IGdsLmdldFByb2dyYW1JbmZvTG9nKHNoYWRlclByb2dyYW0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAobG9nICE9PSB1bmRlZmluZWQgJiYgbG9nICE9PSBudWxsKSBjb25zb2xlLmxvZyhsb2cpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJwYWNrXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogUGFjayAxZmxvYXQgKDAuMC0xLjApIHRvIDRmbG9hdCByZ2JhICgwLjAtMS4wLCAwLjAtMS4wLCAwLjAtMS4wLCAwLjAtMS4wKVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHBhY2sodikge1xuICAgICAgICAgICAgdmFyIGJpYXMgPSBbMS4wIC8gMjU1LjAsIDEuMCAvIDI1NS4wLCAxLjAgLyAyNTUuMCwgMC4wXTtcblxuICAgICAgICAgICAgdmFyIHIgPSB2O1xuICAgICAgICAgICAgdmFyIGcgPSB0aGlzLmZyYWN0KHIgKiAyNTUuMCk7XG4gICAgICAgICAgICB2YXIgYiA9IHRoaXMuZnJhY3QoZyAqIDI1NS4wKTtcbiAgICAgICAgICAgIHZhciBhID0gdGhpcy5mcmFjdChiICogMjU1LjApO1xuICAgICAgICAgICAgdmFyIGNvbG91ciA9IFtyLCBnLCBiLCBhXTtcblxuICAgICAgICAgICAgdmFyIGRkID0gW2NvbG91clsxXSAqIGJpYXNbMF0sIGNvbG91clsyXSAqIGJpYXNbMV0sIGNvbG91clszXSAqIGJpYXNbMl0sIGNvbG91clszXSAqIGJpYXNbM11dO1xuXG4gICAgICAgICAgICByZXR1cm4gW2NvbG91clswXSAtIGRkWzBdLCBjb2xvdXJbMV0gLSBkZFsxXSwgY29sb3VyWzJdIC0gZGRbMl0sIGNvbG91clszXSAtIGRkWzNdXTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInVucGFja1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFVucGFjayA0ZmxvYXQgcmdiYSAoMC4wLTEuMCwgMC4wLTEuMCwgMC4wLTEuMCwgMC4wLTEuMCkgdG8gMWZsb2F0ICgwLjAtMS4wKVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHVucGFjayhjb2xvdXIpIHtcbiAgICAgICAgICAgIHZhciBiaXRTaGlmdHMgPSBbMS4wLCAxLjAgLyAyNTUuMCwgMS4wIC8gKDI1NS4wICogMjU1LjApLCAxLjAgLyAoMjU1LjAgKiAyNTUuMCAqIDI1NS4wKV07XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kb3Q0KGNvbG91ciwgYml0U2hpZnRzKTtcbiAgICAgICAgfVxuICAgIH1dLCBbe1xuICAgICAgICBrZXk6IFwiZ2V0V2ViR0xDb250ZXh0RnJvbUNhbnZhc1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGdldFdlYkdMQ29udGV4dEZyb21DYW52YXNcbiAgICAgICAgICogQHBhcmFtIHtIVE1MQ2FudmFzRWxlbWVudH0gY2FudmFzXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjdHhPcHRcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRXZWJHTENvbnRleHRGcm9tQ2FudmFzKGNhbnZhcywgY3R4T3B0KSB7XG4gICAgICAgICAgICB2YXIgZ2wgPSBudWxsO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoY3R4T3B0ID09PSB1bmRlZmluZWQgfHwgY3R4T3B0ID09PSBudWxsKSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2wyXCIpO2Vsc2UgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsMlwiLCBjdHhPcHQpO1xuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZ2wgPT0gbnVsbCA/IFwibm8gd2ViZ2wyXCIgOiBcInVzaW5nIHdlYmdsMlwiKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBnbCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZ2wgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdHhPcHQgPT09IHVuZGVmaW5lZCB8fCBjdHhPcHQgPT09IG51bGwpIGdsID0gY2FudmFzLmdldENvbnRleHQoXCJleHBlcmltZW50YWwtd2ViZ2wyXCIpO2Vsc2UgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcImV4cGVyaW1lbnRhbC13ZWJnbDJcIiwgY3R4T3B0KTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhnbCA9PSBudWxsID8gXCJubyBleHBlcmltZW50YWwtd2ViZ2wyXCIgOiBcInVzaW5nIGV4cGVyaW1lbnRhbC13ZWJnbDJcIik7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBnbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGdsID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3R4T3B0ID09PSB1bmRlZmluZWQgfHwgY3R4T3B0ID09PSBudWxsKSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIik7ZWxzZSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIiwgY3R4T3B0KTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhnbCA9PSBudWxsID8gXCJubyB3ZWJnbFwiIDogXCJ1c2luZyB3ZWJnbFwiKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGdsID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZ2wgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdHhPcHQgPT09IHVuZGVmaW5lZCB8fCBjdHhPcHQgPT09IG51bGwpIGdsID0gY2FudmFzLmdldENvbnRleHQoXCJleHBlcmltZW50YWwtd2ViZ2xcIik7ZWxzZSBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiZXhwZXJpbWVudGFsLXdlYmdsXCIsIGN0eE9wdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZ2wgPT0gbnVsbCA/IFwibm8gZXhwZXJpbWVudGFsLXdlYmdsXCIgOiBcInVzaW5nIGV4cGVyaW1lbnRhbC13ZWJnbFwiKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGdsID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZ2wgPT0gbnVsbCkgZ2wgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBnbDtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImdldFVpbnQ4QXJyYXlGcm9tSFRNTEltYWdlRWxlbWVudFwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBVaW50OEFycmF5IGZyb20gSFRNTEltYWdlRWxlbWVudFxuICAgICAgICAgKiBAcGFyYW0ge0hUTUxJbWFnZUVsZW1lbnR9IGltYWdlRWxlbWVudFxuICAgICAgICAgKiBAcmV0dXJucyB7VWludDhDbGFtcGVkQXJyYXl9XG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0VWludDhBcnJheUZyb21IVE1MSW1hZ2VFbGVtZW50KGltYWdlRWxlbWVudCkge1xuICAgICAgICAgICAgdmFyIGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgICAgIGUud2lkdGggPSBpbWFnZUVsZW1lbnQud2lkdGg7XG4gICAgICAgICAgICBlLmhlaWdodCA9IGltYWdlRWxlbWVudC5oZWlnaHQ7XG4gICAgICAgICAgICB2YXIgY3R4MkRfdGV4ID0gZS5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgICAgICAgICBjdHgyRF90ZXguZHJhd0ltYWdlKGltYWdlRWxlbWVudCwgMCwgMCk7XG4gICAgICAgICAgICB2YXIgYXJyYXlUZXggPSBjdHgyRF90ZXguZ2V0SW1hZ2VEYXRhKDAsIDAsIGltYWdlRWxlbWVudC53aWR0aCwgaW1hZ2VFbGVtZW50LmhlaWdodCk7XG5cbiAgICAgICAgICAgIHJldHVybiBhcnJheVRleC5kYXRhO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZG90NFwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERvdCBwcm9kdWN0IHZlY3RvcjRmbG9hdFxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGRvdDQodmVjdG9yNEEsIHZlY3RvcjRCKSB7XG4gICAgICAgICAgICByZXR1cm4gdmVjdG9yNEFbMF0gKiB2ZWN0b3I0QlswXSArIHZlY3RvcjRBWzFdICogdmVjdG9yNEJbMV0gKyB2ZWN0b3I0QVsyXSAqIHZlY3RvcjRCWzJdICsgdmVjdG9yNEFbM10gKiB2ZWN0b3I0QlszXTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImZyYWN0XCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogQ29tcHV0ZSB0aGUgZnJhY3Rpb25hbCBwYXJ0IG9mIHRoZSBhcmd1bWVudC4gZnJhY3QocGkpPTAuMTQxNTkyNjUuLi5cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBmcmFjdChudW1iZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBudW1iZXIgPiAwID8gbnVtYmVyIC0gTWF0aC5mbG9vcihudW1iZXIpIDogbnVtYmVyIC0gTWF0aC5jZWlsKG51bWJlcik7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJwYWNrR0xTTEZ1bmN0aW9uU3RyaW5nXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHBhY2sgR0xTTCBmdW5jdGlvbiBzdHJpbmdcbiAgICAgICAgICogQHJldHVybnMge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBwYWNrR0xTTEZ1bmN0aW9uU3RyaW5nKCkge1xuICAgICAgICAgICAgcmV0dXJuICd2ZWM0IHBhY2sgKGZsb2F0IGRlcHRoKSB7XFxuJyArICdjb25zdCB2ZWM0IGJpYXMgPSB2ZWM0KDEuMCAvIDI1NS4wLFxcbicgKyAnMS4wIC8gMjU1LjAsXFxuJyArICcxLjAgLyAyNTUuMCxcXG4nICsgJzAuMCk7XFxuJyArICdmbG9hdCByID0gZGVwdGg7XFxuJyArICdmbG9hdCBnID0gZnJhY3QociAqIDI1NS4wKTtcXG4nICsgJ2Zsb2F0IGIgPSBmcmFjdChnICogMjU1LjApO1xcbicgKyAnZmxvYXQgYSA9IGZyYWN0KGIgKiAyNTUuMCk7XFxuJyArICd2ZWM0IGNvbG91ciA9IHZlYzQociwgZywgYiwgYSk7XFxuJyArICdyZXR1cm4gY29sb3VyIC0gKGNvbG91ci55end3ICogYmlhcyk7XFxuJyArICd9XFxuJztcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcInVucGFja0dMU0xGdW5jdGlvblN0cmluZ1wiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCB1bnBhY2sgR0xTTCBmdW5jdGlvbiBzdHJpbmdcbiAgICAgICAgICogQHJldHVybnMge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiB1bnBhY2tHTFNMRnVuY3Rpb25TdHJpbmcoKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2Zsb2F0IHVucGFjayAodmVjNCBjb2xvdXIpIHtcXG4nICsgJ2NvbnN0IHZlYzQgYml0U2hpZnRzID0gdmVjNCgxLjAsXFxuJyArICcxLjAgLyAyNTUuMCxcXG4nICsgJzEuMCAvICgyNTUuMCAqIDI1NS4wKSxcXG4nICsgJzEuMCAvICgyNTUuMCAqIDI1NS4wICogMjU1LjApKTtcXG4nICsgJ3JldHVybiBkb3QoY29sb3VyLCBiaXRTaGlmdHMpO1xcbicgKyAnfVxcbic7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJnZXRPdXRwdXRCdWZmZXJzXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogZ2V0T3V0cHV0QnVmZmVyc1xuICAgICAgICAgKiBAcGFyYW0ge1dlYkNMR0xLZXJuZWx8V2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbX0gcHJvZ1xuICAgICAgICAgKiBAcGFyYW0ge0FycmF5PFdlYkNMR0xCdWZmZXI+fSBidWZmZXJzXG4gICAgICAgICAqIEByZXR1cm5zIHtBcnJheTxXZWJDTEdMQnVmZmVyPn1cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRPdXRwdXRCdWZmZXJzKHByb2csIGJ1ZmZlcnMpIHtcbiAgICAgICAgICAgIHZhciBvdXRwdXRCdWZmID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChwcm9nLm91dHB1dCAhPT0gdW5kZWZpbmVkICYmIHByb2cub3V0cHV0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0QnVmZiA9IFtdO1xuICAgICAgICAgICAgICAgIGlmIChwcm9nLm91dHB1dFswXSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDwgcHJvZy5vdXRwdXQubGVuZ3RoOyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vaWYoYnVmZmVycy5oYXNPd25Qcm9wZXJ0eShwcm9nLm91dHB1dFtuXSkgPT0gZmFsc2UgJiYgX2FsZXJ0ZWQgPT0gZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICBfYWxlcnRlZCA9IHRydWUsIGFsZXJ0KFwib3V0cHV0IGFyZ3VtZW50IFwiK3Byb2cub3V0cHV0W25dK1wiIG5vdCBmb3VuZCBpbiBidWZmZXJzLiBhZGQgZGVzaXJlZCBhcmd1bWVudCBhcyBzaGFyZWRcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dEJ1ZmZbbl0gPSBidWZmZXJzW3Byb2cub3V0cHV0W25dXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBvdXRwdXRCdWZmID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBvdXRwdXRCdWZmO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwicGFyc2VTb3VyY2VcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBwYXJzZVNvdXJjZVxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gc291cmNlXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZXNcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBpc0dMMlxuICAgICAgICAgKiBAcmV0dXJucyB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHBhcnNlU291cmNlKHNvdXJjZSwgdmFsdWVzLCBpc0dMMikge1xuICAgICAgICAgICAgdmFyIHRleFN0ciA9IGlzR0wyID09PSB0cnVlID8gXCJ0ZXh0dXJlXCIgOiBcInRleHR1cmUyRFwiO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlZ2V4cCA9IG5ldyBSZWdFeHAoa2V5ICsgXCJcXFxcWyg/IVxcXFxkKS4qP1xcXFxdXCIsIFwiZ21cIik7IC8vIGF2b2lkIG5vcm1hbCB1bmlmb3JtIGFycmF5c1xuICAgICAgICAgICAgICAgIHZhciB2YXJNYXRjaGVzID0gc291cmNlLm1hdGNoKHJlZ2V4cCk7IC8vIFwiU2VhcmNoIGN1cnJlbnQgXCJhcmdOYW1lXCIgaW4gc291cmNlIGFuZCBzdG9yZSBpbiBhcnJheSB2YXJNYXRjaGVzXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyh2YXJNYXRjaGVzKTtcbiAgICAgICAgICAgICAgICBpZiAodmFyTWF0Y2hlcyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG5CID0gMCwgZkIgPSB2YXJNYXRjaGVzLmxlbmd0aDsgbkIgPCBmQjsgbkIrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm9yIGVhY2ggdmFyTWF0Y2hlcyAoXCJBW3hdXCIsIFwiQVt4XVwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlZ2V4cE5hdGl2ZUdMID0gbmV3IFJlZ0V4cCgnYGBgKFxcc3xcXHQpKmdsLionICsgdmFyTWF0Y2hlc1tuQl0gKyAnLipgYGBbXmBgYChcXHN8XFx0KSpnbF0nLCBcImdtXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlZ2V4cE5hdGl2ZUdMTWF0Y2hlcyA9IHNvdXJjZS5tYXRjaChyZWdleHBOYXRpdmVHTCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVnZXhwTmF0aXZlR0xNYXRjaGVzID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZSA9IHZhck1hdGNoZXNbbkJdLnNwbGl0KCdbJylbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhcmkgPSB2YXJNYXRjaGVzW25CXS5zcGxpdCgnWycpWzFdLnNwbGl0KCddJylbMF07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWFwID0geyAnZmxvYXQ0X2Zyb21TYW1wbGVyJzogc291cmNlLnJlcGxhY2UobmFtZSArIFwiW1wiICsgdmFyaSArIFwiXVwiLCB0ZXhTdHIgKyAnKCcgKyBuYW1lICsgJywnICsgdmFyaSArICcpJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdmbG9hdF9mcm9tU2FtcGxlcic6IHNvdXJjZS5yZXBsYWNlKG5hbWUgKyBcIltcIiArIHZhcmkgKyBcIl1cIiwgdGV4U3RyICsgJygnICsgbmFtZSArICcsJyArIHZhcmkgKyAnKS54JyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdmbG9hdDRfZnJvbUF0dHInOiBzb3VyY2UucmVwbGFjZShuYW1lICsgXCJbXCIgKyB2YXJpICsgXCJdXCIsIG5hbWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZmxvYXRfZnJvbUF0dHInOiBzb3VyY2UucmVwbGFjZShuYW1lICsgXCJbXCIgKyB2YXJpICsgXCJdXCIsIG5hbWUpIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlID0gbWFwW3ZhbHVlc1trZXldLnR5cGVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc291cmNlID0gc291cmNlLnJlcGxhY2UoL2BgYChcXHN8XFx0KSpnbC9naSwgXCJcIikucmVwbGFjZSgvYGBgL2dpLCBcIlwiKS5yZXBsYWNlKC87L2dpLCBcIjtcXG5cIikucmVwbGFjZSgvfS9naSwgXCJ9XFxuXCIpLnJlcGxhY2UoL3svZ2ksIFwie1xcblwiKTtcbiAgICAgICAgICAgIHJldHVybiBzb3VyY2U7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJsaW5lc192ZXJ0ZXhfYXR0cnNcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBsaW5lc192ZXJ0ZXhfYXR0cnNcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHZhbHVlc1xuICAgICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzR0wyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gbGluZXNfdmVydGV4X2F0dHJzKHZhbHVlcywgaXNHTDIpIHtcbiAgICAgICAgICAgIHZhciBhdHRyU3RyID0gaXNHTDIgPT09IHRydWUgPyBcImluXCIgOiBcImF0dHJpYnV0ZVwiO1xuXG4gICAgICAgICAgICB2YXIgc3RyID0gJyc7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9IHsgJ2Zsb2F0NF9mcm9tU2FtcGxlcic6ICd1bmlmb3JtIHNhbXBsZXIyRCAnICsga2V5ICsgJzsnLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXRfZnJvbVNhbXBsZXInOiAndW5pZm9ybSBzYW1wbGVyMkQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0NF9mcm9tQXR0cic6IGF0dHJTdHIgKyAnIHZlYzQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0X2Zyb21BdHRyJzogYXR0clN0ciArICcgZmxvYXQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0JzogJ3VuaWZvcm0gZmxvYXQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0NCc6ICd1bmlmb3JtIHZlYzQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ21hdDQnOiAndW5pZm9ybSBtYXQ0ICcgKyBrZXkgKyAnOycgfVt2YWx1ZXNba2V5XS50eXBlXSArICdcXG4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImxpbmVzX2ZyYWdtZW50X2F0dHJzXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogbGluZXNfZnJhZ21lbnRfYXR0cnNcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHZhbHVlc1xuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGxpbmVzX2ZyYWdtZW50X2F0dHJzKHZhbHVlcykge1xuICAgICAgICAgICAgdmFyIHN0ciA9ICcnO1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHZhbHVlcykge1xuICAgICAgICAgICAgICAgIHN0ciArPSB7ICdmbG9hdDRfZnJvbVNhbXBsZXInOiAndW5pZm9ybSBzYW1wbGVyMkQgJyArIGtleSArICc7JyxcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0X2Zyb21TYW1wbGVyJzogJ3VuaWZvcm0gc2FtcGxlcjJEICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdCc6ICd1bmlmb3JtIGZsb2F0ICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdDQnOiAndW5pZm9ybSB2ZWM0ICcgKyBrZXkgKyAnOycsXG4gICAgICAgICAgICAgICAgICAgICdtYXQ0JzogJ3VuaWZvcm0gbWF0NCAnICsga2V5ICsgJzsnIH1bdmFsdWVzW2tleV0udHlwZV0gKyAnXFxuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJsaW5lc19kcmF3QnVmZmVyc0luaXRcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBsaW5lc19kcmF3QnVmZmVyc0luaXRcbiAgICAgICAgICogQHBhcmFtIHtpbnR9IG1heERyYXdCdWZmZXJzXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gbGluZXNfZHJhd0J1ZmZlcnNJbml0KG1heERyYXdCdWZmZXJzKSB7XG4gICAgICAgICAgICB2YXIgc3RyID0gJyc7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMCwgZm4gPSBtYXhEcmF3QnVmZmVyczsgbiA8IGZuOyBuKyspIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0gJycgKyAnZmxvYXQgb3V0JyArIG4gKyAnX2Zsb2F0ID0gLTk5OS45OTk4OTtcXG4nICsgJ3ZlYzQgb3V0JyArIG4gKyAnX2Zsb2F0NDtcXG4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImxpbmVzX2RyYXdCdWZmZXJzV3JpdGVJbml0X0dMMlwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gbGluZXNfZHJhd0J1ZmZlcnNXcml0ZUluaXRfR0wyKG1heERyYXdCdWZmZXJzKSB7XG4gICAgICAgICAgICB2YXIgc3RyID0gJyc7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMCwgZm4gPSBtYXhEcmF3QnVmZmVyczsgbiA8IGZuOyBuKyspIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0gJycgKyAnbGF5b3V0KGxvY2F0aW9uID0gJyArIG4gKyAnKSBvdXQgdmVjNCBvdXRDb2wnICsgbiArICc7XFxuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJsaW5lc19kcmF3QnVmZmVyc1dyaXRlX0dMMlwiLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGxpbmVzX2RyYXdCdWZmZXJzV3JpdGVcbiAgICAgICAgICogQHBhcmFtIHtpbnR9IG1heERyYXdCdWZmZXJzXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gbGluZXNfZHJhd0J1ZmZlcnNXcml0ZV9HTDIobWF4RHJhd0J1ZmZlcnMpIHtcbiAgICAgICAgICAgIHZhciBzdHIgPSAnJztcbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmbiA9IG1heERyYXdCdWZmZXJzOyBuIDwgZm47IG4rKykge1xuICAgICAgICAgICAgICAgIHN0ciArPSAnJyArICdpZihvdXQnICsgbiArICdfZmxvYXQgIT0gLTk5OS45OTk4OSkgb3V0Q29sJyArIG4gKyAnID0gdmVjNChvdXQnICsgbiArICdfZmxvYXQsMC4wLDAuMCwxLjApO1xcbicgKyAnIGVsc2Ugb3V0Q29sJyArIG4gKyAnID0gb3V0JyArIG4gKyAnX2Zsb2F0NDtcXG4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImxpbmVzX2RyYXdCdWZmZXJzV3JpdGVcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBsaW5lc19kcmF3QnVmZmVyc1dyaXRlXG4gICAgICAgICAqIEBwYXJhbSB7aW50fSBtYXhEcmF3QnVmZmVyc1xuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGxpbmVzX2RyYXdCdWZmZXJzV3JpdGUobWF4RHJhd0J1ZmZlcnMpIHtcbiAgICAgICAgICAgIHZhciBzdHIgPSAnJztcbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwLCBmbiA9IG1heERyYXdCdWZmZXJzOyBuIDwgZm47IG4rKykge1xuICAgICAgICAgICAgICAgIHN0ciArPSAnJyArICdpZihvdXQnICsgbiArICdfZmxvYXQgIT0gLTk5OS45OTk4OSkgZ2xfRnJhZ0RhdGFbJyArIG4gKyAnXSA9IHZlYzQob3V0JyArIG4gKyAnX2Zsb2F0LDAuMCwwLjAsMS4wKTtcXG4nICsgJyBlbHNlIGdsX0ZyYWdEYXRhWycgKyBuICsgJ10gPSBvdXQnICsgbiArICdfZmxvYXQ0O1xcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY2hlY2tBcmdOYW1lSW5pdGlhbGl6YXRpb25cIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBjaGVja0FyZ05hbWVJbml0aWFsaXphdGlvblxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5WYWx1ZXNcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGFyZ05hbWVcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjaGVja0FyZ05hbWVJbml0aWFsaXphdGlvbihpblZhbHVlcywgYXJnTmFtZSkge1xuICAgICAgICAgICAgaWYgKGluVmFsdWVzLmhhc093blByb3BlcnR5KGFyZ05hbWUpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGluVmFsdWVzW2FyZ05hbWVdID0ge1xuICAgICAgICAgICAgICAgICAgICBcInR5cGVcIjogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgXCJleHBlY3RlZE1vZGVcIjogbnVsbCwgLy8gXCJBVFRSSUJVVEVcIiwgXCJTQU1QTEVSXCIsIFwiVU5JRk9STVwiXG4gICAgICAgICAgICAgICAgICAgIFwibG9jYXRpb25cIjogbnVsbCB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiZ2V0X2dsb2JhbF9pZDNfR0xTTEZ1bmN0aW9uU3RyaW5nXCIsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogZ2V0X2dsb2JhbF9pZDNfR0xTTEZ1bmN0aW9uU3RyaW5nXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0X2dsb2JhbF9pZDNfR0xTTEZ1bmN0aW9uU3RyaW5nKCkge1xuICAgICAgICAgICAgcmV0dXJuICcnICsgJ3ZlYzIgZ2V0X2dsb2JhbF9pZChmbG9hdCBpZCwgZmxvYXQgYnVmZmVyV2lkdGgsIGZsb2F0IGdlb21ldHJ5TGVuZ3RoKSB7XFxuJyArICdmbG9hdCB0ZXhlbFNpemUgPSAxLjAvYnVmZmVyV2lkdGg7JyArICdmbG9hdCBudW0gPSAoaWQqZ2VvbWV0cnlMZW5ndGgpL2J1ZmZlcldpZHRoOycgKyAnZmxvYXQgY29sdW1uID0gZnJhY3QobnVtKSsodGV4ZWxTaXplLzIuMCk7JyArICdmbG9hdCByb3cgPSAoZmxvb3IobnVtKS9idWZmZXJXaWR0aCkrKHRleGVsU2l6ZS8yLjApOycgKyAncmV0dXJuIHZlYzIoY29sdW1uLCByb3cpOycgKyAnfVxcbic7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJnZXRfZ2xvYmFsX2lkMl9HTFNMRnVuY3Rpb25TdHJpbmdcIixcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBnZXRfZ2xvYmFsX2lkMl9HTFNMRnVuY3Rpb25TdHJpbmdcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRfZ2xvYmFsX2lkMl9HTFNMRnVuY3Rpb25TdHJpbmcoKSB7XG4gICAgICAgICAgICByZXR1cm4gJycgKyAndmVjMiBnZXRfZ2xvYmFsX2lkKHZlYzIgaWQsIGZsb2F0IGJ1ZmZlcldpZHRoKSB7XFxuJyArICdmbG9hdCB0ZXhlbFNpemUgPSAxLjAvYnVmZmVyV2lkdGg7JyArICdmbG9hdCBjb2x1bW4gPSAoaWQueC9idWZmZXJXaWR0aCkrKHRleGVsU2l6ZS8yLjApOycgKyAnZmxvYXQgcm93ID0gKGlkLnkvYnVmZmVyV2lkdGgpKyh0ZXhlbFNpemUvMi4wKTsnICsgJ3JldHVybiB2ZWMyKGNvbHVtbiwgcm93KTsnICsgJ31cXG4nO1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIFdlYkNMR0xVdGlscztcbn0oKTtcblxuZ2xvYmFsLldlYkNMR0xVdGlscyA9IFdlYkNMR0xVdGlscztcbm1vZHVsZS5leHBvcnRzLldlYkNMR0xVdGlscyA9IFdlYkNMR0xVdGlsczsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbSA9IHVuZGVmaW5lZDtcblxudmFyIF9jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0oKTtcblxudmFyIF9XZWJDTEdMVXRpbHMgPSByZXF1aXJlKCcuL1dlYkNMR0xVdGlscy5jbGFzcycpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG4vKipcclxuKiBXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtIE9iamVjdFxyXG4qIEBjbGFzc1xyXG4gKiBAcGFyYW0ge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gZ2xcclxuICogQHBhcmFtIHtTdHJpbmd9IHZlcnRleFNvdXJjZVxyXG4gKiBAcGFyYW0ge1N0cmluZ30gdmVydGV4SGVhZGVyXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBmcmFnbWVudFNvdXJjZVxyXG4gKiBAcGFyYW0ge1N0cmluZ30gZnJhZ21lbnRIZWFkZXJcclxuKi9cbnZhciBXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtID0gZXhwb3J0cy5XZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtID0gZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0oZ2wsIHZlcnRleFNvdXJjZSwgdmVydGV4SGVhZGVyLCBmcmFnbWVudFNvdXJjZSwgZnJhZ21lbnRIZWFkZXIpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0pO1xuXG4gICAgICAgIHRoaXMuX2dsID0gZ2w7XG5cbiAgICAgICAgdmFyIGhpZ2hQcmVjaXNpb25TdXBwb3J0ID0gdGhpcy5fZ2wuZ2V0U2hhZGVyUHJlY2lzaW9uRm9ybWF0KHRoaXMuX2dsLkZSQUdNRU5UX1NIQURFUiwgdGhpcy5fZ2wuSElHSF9GTE9BVCk7XG4gICAgICAgIHRoaXMuX3ByZWNpc2lvbiA9IGhpZ2hQcmVjaXNpb25TdXBwb3J0LnByZWNpc2lvbiAhPT0gMCA/ICdwcmVjaXNpb24gaGlnaHAgZmxvYXQ7XFxuXFxucHJlY2lzaW9uIGhpZ2hwIGludDtcXG5cXG4nIDogJ3ByZWNpc2lvbiBsb3dwIGZsb2F0O1xcblxcbnByZWNpc2lvbiBsb3dwIGludDtcXG5cXG4nO1xuXG4gICAgICAgIHRoaXMudmVyc2lvbiA9IHRoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCA/IFwiI3ZlcnNpb24gMzAwIGVzIFxcbiBcIiA6IFwiXCI7XG5cbiAgICAgICAgdGhpcy5fYXJyRXh0ID0gdGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0ID8geyBcIkVYVF9jb2xvcl9idWZmZXJfZmxvYXRcIjogbnVsbCB9IDogeyBcIk9FU190ZXh0dXJlX2Zsb2F0XCI6IG51bGwsIFwiT0VTX3RleHR1cmVfZmxvYXRfbGluZWFyXCI6IG51bGwsIFwiT0VTX2VsZW1lbnRfaW5kZXhfdWludFwiOiBudWxsLCBcIldFQkdMX2RyYXdfYnVmZmVyc1wiOiBudWxsIH07XG4gICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLl9hcnJFeHQpIHtcbiAgICAgICAgICAgIHRoaXMuX2FyckV4dFtrZXldID0gdGhpcy5fZ2wuZ2V0RXh0ZW5zaW9uKGtleSk7XG4gICAgICAgICAgICBpZiAodGhpcy5fYXJyRXh0W2tleV0gPT0gbnVsbCkgY29uc29sZS5lcnJvcihcImV4dGVuc2lvbiBcIiArIGtleSArIFwiIG5vdCBhdmFpbGFibGVcIik7ZWxzZSBjb25zb2xlLmxvZyhcInVzaW5nIGV4dGVuc2lvbiBcIiArIGtleSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmV4dERyYXdCdWZmID0gdGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0ID8gXCJcIiA6IFwiICNleHRlbnNpb24gR0xfRVhUX2RyYXdfYnVmZmVycyA6IHJlcXVpcmVcXG5cIjtcblxuICAgICAgICB0aGlzLm5hbWUgPSBcIlwiO1xuICAgICAgICB0aGlzLnZpZXdTb3VyY2UgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmluX3ZlcnRleF92YWx1ZXMgPSB7fTtcbiAgICAgICAgdGhpcy5pbl9mcmFnbWVudF92YWx1ZXMgPSB7fTtcblxuICAgICAgICB0aGlzLl92ZXJ0ZXhQX3JlYWR5ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2ZyYWdtZW50UF9yZWFkeSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuX3ZlcnRleEhlYWQgPSBudWxsO1xuICAgICAgICB0aGlzLl92ZXJ0ZXhTb3VyY2UgPSBudWxsO1xuICAgICAgICB0aGlzLl9mcmFnbWVudEhlYWQgPSBudWxsO1xuICAgICAgICB0aGlzLl9mcmFnbWVudFNvdXJjZSA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5vdXRwdXQgPSBudWxsOyAvL1N0cmluZyBvciBBcnJheTxTdHJpbmc+IG9mIGFyZyBuYW1lcyB3aXRoIHRoZSBpdGVtcyBpbiBzYW1lIG9yZGVyIHRoYXQgaW4gdGhlIGZpbmFsIHJldHVyblxuICAgICAgICB0aGlzLm91dHB1dFRlbXBNb2RlcyA9IG51bGw7XG4gICAgICAgIHRoaXMuZkJ1ZmZlciA9IG51bGw7XG4gICAgICAgIHRoaXMuZkJ1ZmZlclRlbXAgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuZHJhd01vZGUgPSA0O1xuXG4gICAgICAgIGlmICh2ZXJ0ZXhTb3VyY2UgIT09IHVuZGVmaW5lZCAmJiB2ZXJ0ZXhTb3VyY2UgIT09IG51bGwpIHRoaXMuc2V0VmVydGV4U291cmNlKHZlcnRleFNvdXJjZSwgdmVydGV4SGVhZGVyKTtcblxuICAgICAgICBpZiAoZnJhZ21lbnRTb3VyY2UgIT09IHVuZGVmaW5lZCAmJiBmcmFnbWVudFNvdXJjZSAhPT0gbnVsbCkgdGhpcy5zZXRGcmFnbWVudFNvdXJjZShmcmFnbWVudFNvdXJjZSwgZnJhZ21lbnRIZWFkZXIpO1xuICAgIH1cblxuICAgIC8qKlxyXG4gICAgICogY29tcGlsZVZlcnRleEZyYWdtZW50U291cmNlXHJcbiAgICAgKi9cblxuXG4gICAgX2NyZWF0ZUNsYXNzKFdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0sIFt7XG4gICAgICAgIGtleTogJ2NvbXBpbGVWZXJ0ZXhGcmFnbWVudFNvdXJjZScsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjb21waWxlVmVydGV4RnJhZ21lbnRTb3VyY2UoKSB7XG4gICAgICAgICAgICB2YXIgc291cmNlVmVydGV4ID0gdGhpcy52ZXJzaW9uICsgdGhpcy5fcHJlY2lzaW9uICsgJ3VuaWZvcm0gZmxvYXQgdU9mZnNldDtcXG4nICsgJ3VuaWZvcm0gZmxvYXQgdUJ1ZmZlcldpZHRoOycgKyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5saW5lc192ZXJ0ZXhfYXR0cnModGhpcy5pbl92ZXJ0ZXhfdmFsdWVzLCB0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQpICsgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMudW5wYWNrR0xTTEZ1bmN0aW9uU3RyaW5nKCkgKyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5nZXRfZ2xvYmFsX2lkM19HTFNMRnVuY3Rpb25TdHJpbmcoKSArIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmdldF9nbG9iYWxfaWQyX0dMU0xGdW5jdGlvblN0cmluZygpICsgdGhpcy5fdmVydGV4SGVhZCArICd2b2lkIG1haW4odm9pZCkge1xcbicgKyB0aGlzLl92ZXJ0ZXhTb3VyY2UgKyAnfVxcbic7XG4gICAgICAgICAgICB2YXIgc291cmNlRnJhZ21lbnQgPSB0aGlzLnZlcnNpb24gKyB0aGlzLmV4dERyYXdCdWZmICsgdGhpcy5fcHJlY2lzaW9uICsgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMubGluZXNfZnJhZ21lbnRfYXR0cnModGhpcy5pbl9mcmFnbWVudF92YWx1ZXMpICsgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuZ2V0X2dsb2JhbF9pZDNfR0xTTEZ1bmN0aW9uU3RyaW5nKCkgKyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5nZXRfZ2xvYmFsX2lkMl9HTFNMRnVuY3Rpb25TdHJpbmcoKSArIHRoaXMuX2ZyYWdtZW50SGVhZCArICh0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgPyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5saW5lc19kcmF3QnVmZmVyc1dyaXRlSW5pdF9HTDIoOCkgOiBcIlwiKSArICd2b2lkIG1haW4odm9pZCkge1xcbicgKyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5saW5lc19kcmF3QnVmZmVyc0luaXQoOCkgKyB0aGlzLl9mcmFnbWVudFNvdXJjZSArICh0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgPyBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5saW5lc19kcmF3QnVmZmVyc1dyaXRlX0dMMig4KSA6IF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmxpbmVzX2RyYXdCdWZmZXJzV3JpdGUoOCkpICsgJ31cXG4nO1xuXG4gICAgICAgICAgICB0aGlzLnZlcnRleEZyYWdtZW50UHJvZ3JhbSA9IHRoaXMuX2dsLmNyZWF0ZVByb2dyYW0oKTtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBuZXcgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMoKS5jcmVhdGVTaGFkZXIodGhpcy5fZ2wsIFwiV0VCQ0xHTCBWRVJURVggRlJBR01FTlQgUFJPR1JBTVwiLCBzb3VyY2VWZXJ0ZXgsIHNvdXJjZUZyYWdtZW50LCB0aGlzLnZlcnRleEZyYWdtZW50UHJvZ3JhbSk7XG5cbiAgICAgICAgICAgIHRoaXMudU9mZnNldCA9IHRoaXMuX2dsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnZlcnRleEZyYWdtZW50UHJvZ3JhbSwgXCJ1T2Zmc2V0XCIpO1xuICAgICAgICAgICAgdGhpcy51QnVmZmVyV2lkdGggPSB0aGlzLl9nbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy52ZXJ0ZXhGcmFnbWVudFByb2dyYW0sIFwidUJ1ZmZlcldpZHRoXCIpO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5pbl92ZXJ0ZXhfdmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGV4cGVjdGVkTW9kZSA9IHsgJ2Zsb2F0NF9mcm9tU2FtcGxlcic6IFwiU0FNUExFUlwiLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXRfZnJvbVNhbXBsZXInOiBcIlNBTVBMRVJcIixcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0NF9mcm9tQXR0cic6IFwiQVRUUklCVVRFXCIsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdF9mcm9tQXR0cic6IFwiQVRUUklCVVRFXCIsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdCc6IFwiVU5JRk9STVwiLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXQ0JzogXCJVTklGT1JNXCIsXG4gICAgICAgICAgICAgICAgICAgICdtYXQ0JzogXCJVTklGT1JNXCIgfVt0aGlzLmluX3ZlcnRleF92YWx1ZXNba2V5XS50eXBlXTtcblxuICAgICAgICAgICAgICAgIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uKHRoaXMuaW5fdmVydGV4X3ZhbHVlcywga2V5KTtcbiAgICAgICAgICAgICAgICB2YXIgbG9jID0gZXhwZWN0ZWRNb2RlID09PSBcIkFUVFJJQlVURVwiID8gdGhpcy5fZ2wuZ2V0QXR0cmliTG9jYXRpb24odGhpcy52ZXJ0ZXhGcmFnbWVudFByb2dyYW0sIGtleSkgOiB0aGlzLl9nbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy52ZXJ0ZXhGcmFnbWVudFByb2dyYW0sIGtleS5yZXBsYWNlKC9cXFtcXGQuKi8sIFwiXCIpKTtcbiAgICAgICAgICAgICAgICB0aGlzLmluX3ZlcnRleF92YWx1ZXNba2V5XS5sb2NhdGlvbiA9IFtsb2NdO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5fdmVydGV4X3ZhbHVlc1trZXldLmV4cGVjdGVkTW9kZSA9IGV4cGVjdGVkTW9kZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yICh2YXIgX2tleSBpbiB0aGlzLmluX2ZyYWdtZW50X3ZhbHVlcykge1xuICAgICAgICAgICAgICAgIHZhciBfZXhwZWN0ZWRNb2RlID0geyAnZmxvYXQ0X2Zyb21TYW1wbGVyJzogXCJTQU1QTEVSXCIsXG4gICAgICAgICAgICAgICAgICAgICdmbG9hdF9mcm9tU2FtcGxlcic6IFwiU0FNUExFUlwiLFxuICAgICAgICAgICAgICAgICAgICAnZmxvYXQnOiBcIlVOSUZPUk1cIixcbiAgICAgICAgICAgICAgICAgICAgJ2Zsb2F0NCc6IFwiVU5JRk9STVwiLFxuICAgICAgICAgICAgICAgICAgICAnbWF0NCc6IFwiVU5JRk9STVwiIH1bdGhpcy5pbl9mcmFnbWVudF92YWx1ZXNbX2tleV0udHlwZV07XG5cbiAgICAgICAgICAgICAgICBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5jaGVja0FyZ05hbWVJbml0aWFsaXphdGlvbih0aGlzLmluX2ZyYWdtZW50X3ZhbHVlcywgX2tleSk7XG4gICAgICAgICAgICAgICAgdGhpcy5pbl9mcmFnbWVudF92YWx1ZXNbX2tleV0ubG9jYXRpb24gPSBbdGhpcy5fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMudmVydGV4RnJhZ21lbnRQcm9ncmFtLCBfa2V5LnJlcGxhY2UoL1xcW1xcZC4qLywgXCJcIikpXTtcbiAgICAgICAgICAgICAgICB0aGlzLmluX2ZyYWdtZW50X3ZhbHVlc1tfa2V5XS5leHBlY3RlZE1vZGUgPSBfZXhwZWN0ZWRNb2RlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gXCJWRVJURVggUFJPR1JBTVxcblwiICsgc291cmNlVmVydGV4ICsgXCJcXG4gRlJBR01FTlQgUFJPR1JBTVxcblwiICsgc291cmNlRnJhZ21lbnQ7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ3NldFZlcnRleFNvdXJjZScsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBVcGRhdGUgdGhlIHZlcnRleCBzb3VyY2VcclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gdmVydGV4U291cmNlXHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IHZlcnRleEhlYWRlclxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gc2V0VmVydGV4U291cmNlKHZlcnRleFNvdXJjZSwgdmVydGV4SGVhZGVyKSB7XG4gICAgICAgICAgICB2YXIgYXJndW1lbnRzU291cmNlID0gdmVydGV4U291cmNlLnNwbGl0KCcpJylbMF0uc3BsaXQoJygnKVsxXS5zcGxpdCgnLCcpOyAvLyBcImZsb2F0KiBBXCIsIFwiZmxvYXQqIEJcIiwgXCJmbG9hdCBDXCIsIFwiZmxvYXQ0KiBEXCJcblxuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGYgPSBhcmd1bWVudHNTb3VyY2UubGVuZ3RoOyBuIDwgZjsgbisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvXFwqYXR0ci9nbSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFyZ05hbWUgPSBhcmd1bWVudHNTb3VyY2Vbbl0uc3BsaXQoJyphdHRyJylbMV0udHJpbSgpO1xuICAgICAgICAgICAgICAgICAgICBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5jaGVja0FyZ05hbWVJbml0aWFsaXphdGlvbih0aGlzLmluX3ZlcnRleF92YWx1ZXMsIGFyZ05hbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0NC9nbSkgIT0gbnVsbCkgdGhpcy5pbl92ZXJ0ZXhfdmFsdWVzW2FyZ05hbWVdLnR5cGUgPSAnZmxvYXQ0X2Zyb21BdHRyJztlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0L2dtKSAhPSBudWxsKSB0aGlzLmluX3ZlcnRleF92YWx1ZXNbYXJnTmFtZV0udHlwZSA9ICdmbG9hdF9mcm9tQXR0cic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL1xcKi9nbSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIF9hcmdOYW1lID0gYXJndW1lbnRzU291cmNlW25dLnNwbGl0KCcqJylbMV0udHJpbSgpO1xuICAgICAgICAgICAgICAgICAgICBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5jaGVja0FyZ05hbWVJbml0aWFsaXphdGlvbih0aGlzLmluX3ZlcnRleF92YWx1ZXMsIF9hcmdOYW1lKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9mbG9hdDQvZ20pICE9IG51bGwpIHRoaXMuaW5fdmVydGV4X3ZhbHVlc1tfYXJnTmFtZV0udHlwZSA9ICdmbG9hdDRfZnJvbVNhbXBsZXInO2Vsc2UgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvZmxvYXQvZ20pICE9IG51bGwpIHRoaXMuaW5fdmVydGV4X3ZhbHVlc1tfYXJnTmFtZV0udHlwZSA9ICdmbG9hdF9mcm9tU2FtcGxlcic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0gIT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIF9hcmdOYW1lMiA9IGFyZ3VtZW50c1NvdXJjZVtuXS5zcGxpdCgnICcpWzFdLnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuaW5fdmVydGV4X3ZhbHVlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleS5yZXBsYWNlKC9cXFtcXGQuKi8sIFwiXCIpID09PSBfYXJnTmFtZTIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfYXJnTmFtZTIgPSBrZXk7IC8vIGZvciBub3JtYWwgdW5pZm9ybSBhcnJheXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uKHRoaXMuaW5fdmVydGV4X3ZhbHVlcywgX2FyZ05hbWUyKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9mbG9hdDQvZ20pICE9IG51bGwpIHRoaXMuaW5fdmVydGV4X3ZhbHVlc1tfYXJnTmFtZTJdLnR5cGUgPSAnZmxvYXQ0JztlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0L2dtKSAhPSBudWxsKSB0aGlzLmluX3ZlcnRleF92YWx1ZXNbX2FyZ05hbWUyXS50eXBlID0gJ2Zsb2F0JztlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL21hdDQvZ20pICE9IG51bGwpIHRoaXMuaW5fdmVydGV4X3ZhbHVlc1tfYXJnTmFtZTJdLnR5cGUgPSAnbWF0NCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBwYXJzZSBoZWFkZXJcbiAgICAgICAgICAgIHRoaXMuX3ZlcnRleEhlYWQgPSB2ZXJ0ZXhIZWFkZXIgIT09IHVuZGVmaW5lZCAmJiB2ZXJ0ZXhIZWFkZXIgIT09IG51bGwgPyB2ZXJ0ZXhIZWFkZXIgOiAnJztcbiAgICAgICAgICAgIHRoaXMuX3ZlcnRleEhlYWQgPSB0aGlzLl92ZXJ0ZXhIZWFkLnJlcGxhY2UoL1xcclxcbi9naSwgJycpLnJlcGxhY2UoL1xcci9naSwgJycpLnJlcGxhY2UoL1xcbi9naSwgJycpO1xuICAgICAgICAgICAgdGhpcy5fdmVydGV4SGVhZCA9IF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLnBhcnNlU291cmNlKHRoaXMuX3ZlcnRleEhlYWQsIHRoaXMuaW5fdmVydGV4X3ZhbHVlcywgdGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0KTtcblxuICAgICAgICAgICAgLy8gcGFyc2Ugc291cmNlXG4gICAgICAgICAgICB0aGlzLl92ZXJ0ZXhTb3VyY2UgPSB2ZXJ0ZXhTb3VyY2UucmVwbGFjZSgvXFxyXFxuL2dpLCAnJykucmVwbGFjZSgvXFxyL2dpLCAnJykucmVwbGFjZSgvXFxuL2dpLCAnJyk7XG4gICAgICAgICAgICB0aGlzLl92ZXJ0ZXhTb3VyY2UgPSB0aGlzLl92ZXJ0ZXhTb3VyY2UucmVwbGFjZSgvXlxcdyogXFx3KlxcKFtcXHdcXHNcXCosXSpcXCkgey9naSwgJycpLnJlcGxhY2UoL30oXFxzfFxcdCkqJC9naSwgJycpO1xuICAgICAgICAgICAgdGhpcy5fdmVydGV4U291cmNlID0gX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMucGFyc2VTb3VyY2UodGhpcy5fdmVydGV4U291cmNlLCB0aGlzLmluX3ZlcnRleF92YWx1ZXMsIHRoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCk7XG5cbiAgICAgICAgICAgIHRoaXMuX3ZlcnRleFBfcmVhZHkgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2ZyYWdtZW50UF9yZWFkeSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHZhciB0cyA9IHRoaXMuY29tcGlsZVZlcnRleEZyYWdtZW50U291cmNlKCk7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy52aWV3U291cmNlID09PSB0cnVlKSBjb25zb2xlLmxvZygnJWMgVkZQOiAnICsgdGhpcy5uYW1lLCAnZm9udC1zaXplOiAyMHB4OyBjb2xvcjogZ3JlZW4nKSwgY29uc29sZS5sb2coJyVjIFdFQkNMR0wgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nLCAnY29sb3I6IGdyYXknKSwgY29uc29sZS5sb2coJyVjICcgKyB2ZXJ0ZXhIZWFkZXIgKyB2ZXJ0ZXhTb3VyY2UsICdjb2xvcjogZ3JheScpLCBjb25zb2xlLmxvZygnJWMgVFJBTlNMQVRFRCBXRUJHTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nLCAnY29sb3I6IGRhcmtncmF5JyksIGNvbnNvbGUubG9nKCclYyAnICsgdHMsICdjb2xvcjogZGFya2dyYXknKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAnc2V0RnJhZ21lbnRTb3VyY2UnLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVXBkYXRlIHRoZSBmcmFnbWVudCBzb3VyY2VcclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gZnJhZ21lbnRTb3VyY2VcclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gZnJhZ21lbnRIZWFkZXJcclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHNldEZyYWdtZW50U291cmNlKGZyYWdtZW50U291cmNlLCBmcmFnbWVudEhlYWRlcikge1xuICAgICAgICAgICAgdmFyIGFyZ3VtZW50c1NvdXJjZSA9IGZyYWdtZW50U291cmNlLnNwbGl0KCcpJylbMF0uc3BsaXQoJygnKVsxXS5zcGxpdCgnLCcpOyAvLyBcImZsb2F0KiBBXCIsIFwiZmxvYXQqIEJcIiwgXCJmbG9hdCBDXCIsIFwiZmxvYXQ0KiBEXCJcblxuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDAsIGYgPSBhcmd1bWVudHNTb3VyY2UubGVuZ3RoOyBuIDwgZjsgbisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvXFwqL2dtKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJnTmFtZSA9IGFyZ3VtZW50c1NvdXJjZVtuXS5zcGxpdCgnKicpWzFdLnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMuY2hlY2tBcmdOYW1lSW5pdGlhbGl6YXRpb24odGhpcy5pbl9mcmFnbWVudF92YWx1ZXMsIGFyZ05hbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0NC9nbSkgIT0gbnVsbCkgdGhpcy5pbl9mcmFnbWVudF92YWx1ZXNbYXJnTmFtZV0udHlwZSA9ICdmbG9hdDRfZnJvbVNhbXBsZXInO2Vsc2UgaWYgKGFyZ3VtZW50c1NvdXJjZVtuXS5tYXRjaCgvZmxvYXQvZ20pICE9IG51bGwpIHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzW2FyZ05hbWVdLnR5cGUgPSAnZmxvYXRfZnJvbVNhbXBsZXInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzU291cmNlW25dICE9PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfYXJnTmFtZTMgPSBhcmd1bWVudHNTb3VyY2Vbbl0uc3BsaXQoJyAnKVsxXS50cmltKCk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLmluX2ZyYWdtZW50X3ZhbHVlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleS5yZXBsYWNlKC9cXFtcXGQuKi8sIFwiXCIpID09PSBfYXJnTmFtZTMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfYXJnTmFtZTMgPSBrZXk7IC8vIGZvciBub3JtYWwgdW5pZm9ybSBhcnJheXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIF9XZWJDTEdMVXRpbHMuV2ViQ0xHTFV0aWxzLmNoZWNrQXJnTmFtZUluaXRpYWxpemF0aW9uKHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzLCBfYXJnTmFtZTMpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL2Zsb2F0NC9nbSkgIT0gbnVsbCkgdGhpcy5pbl9mcmFnbWVudF92YWx1ZXNbX2FyZ05hbWUzXS50eXBlID0gJ2Zsb2F0NCc7ZWxzZSBpZiAoYXJndW1lbnRzU291cmNlW25dLm1hdGNoKC9mbG9hdC9nbSkgIT0gbnVsbCkgdGhpcy5pbl9mcmFnbWVudF92YWx1ZXNbX2FyZ05hbWUzXS50eXBlID0gJ2Zsb2F0JztlbHNlIGlmIChhcmd1bWVudHNTb3VyY2Vbbl0ubWF0Y2goL21hdDQvZ20pICE9IG51bGwpIHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzW19hcmdOYW1lM10udHlwZSA9ICdtYXQ0JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHBhcnNlIGhlYWRlclxuICAgICAgICAgICAgdGhpcy5fZnJhZ21lbnRIZWFkID0gZnJhZ21lbnRIZWFkZXIgIT09IHVuZGVmaW5lZCAmJiBmcmFnbWVudEhlYWRlciAhPT0gbnVsbCA/IGZyYWdtZW50SGVhZGVyIDogJyc7XG4gICAgICAgICAgICB0aGlzLl9mcmFnbWVudEhlYWQgPSB0aGlzLl9mcmFnbWVudEhlYWQucmVwbGFjZSgvXFxyXFxuL2dpLCAnJykucmVwbGFjZSgvXFxyL2dpLCAnJykucmVwbGFjZSgvXFxuL2dpLCAnJyk7XG4gICAgICAgICAgICB0aGlzLl9mcmFnbWVudEhlYWQgPSBfV2ViQ0xHTFV0aWxzLldlYkNMR0xVdGlscy5wYXJzZVNvdXJjZSh0aGlzLl9mcmFnbWVudEhlYWQsIHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzLCB0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQpO1xuXG4gICAgICAgICAgICAvLyBwYXJzZSBzb3VyY2VcbiAgICAgICAgICAgIHRoaXMuX2ZyYWdtZW50U291cmNlID0gZnJhZ21lbnRTb3VyY2UucmVwbGFjZSgvXFxyXFxuL2dpLCAnJykucmVwbGFjZSgvXFxyL2dpLCAnJykucmVwbGFjZSgvXFxuL2dpLCAnJyk7XG4gICAgICAgICAgICB0aGlzLl9mcmFnbWVudFNvdXJjZSA9IHRoaXMuX2ZyYWdtZW50U291cmNlLnJlcGxhY2UoL15cXHcqIFxcdypcXChbXFx3XFxzXFwqLF0qXFwpIHsvZ2ksICcnKS5yZXBsYWNlKC99KFxcc3xcXHQpKiQvZ2ksICcnKTtcbiAgICAgICAgICAgIHRoaXMuX2ZyYWdtZW50U291cmNlID0gX1dlYkNMR0xVdGlscy5XZWJDTEdMVXRpbHMucGFyc2VTb3VyY2UodGhpcy5fZnJhZ21lbnRTb3VyY2UsIHRoaXMuaW5fZnJhZ21lbnRfdmFsdWVzLCB0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQpO1xuXG4gICAgICAgICAgICB0aGlzLl9mcmFnbWVudFBfcmVhZHkgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKHRoaXMuX3ZlcnRleFBfcmVhZHkgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdHMgPSB0aGlzLmNvbXBpbGVWZXJ0ZXhGcmFnbWVudFNvdXJjZSgpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudmlld1NvdXJjZSA9PT0gdHJ1ZSkgY29uc29sZS5sb2coJyVjIFZGUDogJywgJ2ZvbnQtc2l6ZTogMjBweDsgY29sb3I6IGdyZWVuJyksIGNvbnNvbGUubG9nKCclYyBXRUJDTEdMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJywgJ2NvbG9yOiBncmF5JyksIGNvbnNvbGUubG9nKCclYyAnICsgZnJhZ21lbnRIZWFkZXIgKyBmcmFnbWVudFNvdXJjZSwgJ2NvbG9yOiBncmF5JyksIGNvbnNvbGUubG9nKCclYyBUUkFOU0xBVEVEIFdFQkdMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScsICdjb2xvcjogZGFya2dyYXknKSwgY29uc29sZS5sb2coJyVjICcgKyB0cywgJ2NvbG9yOiBkYXJrZ3JheScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIFdlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW07XG59KCk7XG5cbmdsb2JhbC5XZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtID0gV2ViQ0xHTFZlcnRleEZyYWdtZW50UHJvZ3JhbTtcbm1vZHVsZS5leHBvcnRzLldlYkNMR0xWZXJ0ZXhGcmFnbWVudFByb2dyYW0gPSBXZWJDTEdMVmVydGV4RnJhZ21lbnRQcm9ncmFtOyJdfQ==
