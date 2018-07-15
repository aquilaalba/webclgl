(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvd2ViY2xnbC9XZWJDTEdMQnVmZmVyLmNsYXNzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfXJldHVybiBlfSkoKSIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KCk7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbi8qKlxyXG4qIFdlYkNMR0xCdWZmZXJcclxuKiBAY2xhc3NcclxuICogQHBhcmFtIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGdsXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBbdHlwZT1cIkZMT0FUXCJdXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2xpbmVhcj10cnVlXVxyXG4gKiBAcGFyYW0ge1N0cmluZ30gW21vZGU9XCJTQU1QTEVSXCJdIFwiU0FNUExFUlwiLCBcIkFUVFJJQlVURVwiLCBcIlZFUlRFWF9JTkRFWFwiXHJcbiovXG52YXIgV2ViQ0xHTEJ1ZmZlciA9IGV4cG9ydHMuV2ViQ0xHTEJ1ZmZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBXZWJDTEdMQnVmZmVyKGdsLCB0eXBlLCBsaW5lYXIsIG1vZGUpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFdlYkNMR0xCdWZmZXIpO1xuXG4gICAgICAgIHRoaXMuX2dsID0gZ2w7XG5cbiAgICAgICAgdGhpcy50eXBlID0gdHlwZSAhPT0gdW5kZWZpbmVkIHx8IHR5cGUgIT09IG51bGwgPyB0eXBlIDogJ0ZMT0FUJztcbiAgICAgICAgdGhpcy5fc3VwcG9ydEZvcm1hdCA9IHRoaXMuX2dsLkZMT0FUO1xuXG4gICAgICAgIHRoaXMubGluZWFyID0gbGluZWFyICE9PSB1bmRlZmluZWQgfHwgbGluZWFyICE9PSBudWxsID8gbGluZWFyIDogdHJ1ZTtcbiAgICAgICAgdGhpcy5tb2RlID0gbW9kZSAhPT0gdW5kZWZpbmVkIHx8IG1vZGUgIT09IG51bGwgPyBtb2RlIDogXCJTQU1QTEVSXCI7XG5cbiAgICAgICAgdGhpcy5XID0gbnVsbDtcbiAgICAgICAgdGhpcy5IID0gbnVsbDtcblxuICAgICAgICB0aGlzLnRleHR1cmVEYXRhID0gbnVsbDtcbiAgICAgICAgdGhpcy50ZXh0dXJlRGF0YVRlbXAgPSBudWxsO1xuICAgICAgICB0aGlzLnZlcnRleERhdGEwID0gbnVsbDtcblxuICAgICAgICB0aGlzLmZCdWZmZXIgPSBudWxsO1xuICAgICAgICB0aGlzLnJlbmRlckJ1ZmZlciA9IG51bGw7XG4gICAgICAgIHRoaXMuZkJ1ZmZlclRlbXAgPSBudWxsO1xuICAgICAgICB0aGlzLnJlbmRlckJ1ZmZlclRlbXAgPSBudWxsO1xuXG4gICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFwiU0FNUExFUlwiKSB7XG4gICAgICAgICAgICB0aGlzLnRleHR1cmVEYXRhID0gdGhpcy5fZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICAgICAgICAgICAgdGhpcy50ZXh0dXJlRGF0YVRlbXAgPSB0aGlzLl9nbC5jcmVhdGVUZXh0dXJlKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gXCJTQU1QTEVSXCIgfHwgdGhpcy5tb2RlID09PSBcIkFUVFJJQlVURVwiIHx8IHRoaXMubW9kZSA9PT0gXCJWRVJURVhfSU5ERVhcIikge1xuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhEYXRhMCA9IHRoaXMuX2dsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXHJcbiAgICAgKiBjcmVhdGVGcmFtZWJ1ZmZlckFuZFJlbmRlcmJ1ZmZlclxyXG4gICAgICovXG5cblxuICAgIF9jcmVhdGVDbGFzcyhXZWJDTEdMQnVmZmVyLCBbe1xuICAgICAgICBrZXk6IFwiY3JlYXRlRnJhbWVidWZmZXJBbmRSZW5kZXJidWZmZXJcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNyZWF0ZUZyYW1lYnVmZmVyQW5kUmVuZGVyYnVmZmVyKCkge1xuICAgICAgICAgICAgdmFyIGNyZWF0ZVdlYkdMUmVuZGVyQnVmZmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciByQnVmZmVyID0gdGhpcy5fZ2wuY3JlYXRlUmVuZGVyYnVmZmVyKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuYmluZFJlbmRlcmJ1ZmZlcih0aGlzLl9nbC5SRU5ERVJCVUZGRVIsIHJCdWZmZXIpO1xuXG4gICAgICAgICAgICAgICAgLy8gV2ViR0wyOiBHTGVudW0gdGFyZ2V0LCBHTGVudW0gaW50ZXJuYWxmb3JtYXQsIEdMc2l6ZWkgd2lkdGgsIEdMc2l6ZWkgaGVpZ2h0XG4gICAgICAgICAgICAgICAgdmFyIGludEZvcm1hdCA9IHRoaXMuX2dsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCA/IHRoaXMuX2dsLkRFUFRIX0NPTVBPTkVOVDMyRiA6IHRoaXMuX2dsLkRFUFRIX0NPTVBPTkVOVDE2O1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wucmVuZGVyYnVmZmVyU3RvcmFnZSh0aGlzLl9nbC5SRU5ERVJCVUZGRVIsIGludEZvcm1hdCwgdGhpcy5XLCB0aGlzLkgpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuYmluZFJlbmRlcmJ1ZmZlcih0aGlzLl9nbC5SRU5ERVJCVUZGRVIsIG51bGwpO1xuICAgICAgICAgICAgICAgIHJldHVybiByQnVmZmVyO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5mQnVmZmVyICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5kZWxldGVGcmFtZWJ1ZmZlcih0aGlzLmZCdWZmZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmRlbGV0ZUZyYW1lYnVmZmVyKHRoaXMuZkJ1ZmZlclRlbXApO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuZGVsZXRlUmVuZGVyYnVmZmVyKHRoaXMucmVuZGVyQnVmZmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5kZWxldGVSZW5kZXJidWZmZXIodGhpcy5yZW5kZXJCdWZmZXJUZW1wKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZkJ1ZmZlciA9IHRoaXMuX2dsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XG4gICAgICAgICAgICB0aGlzLnJlbmRlckJ1ZmZlciA9IGNyZWF0ZVdlYkdMUmVuZGVyQnVmZmVyKCk7XG4gICAgICAgICAgICB0aGlzLl9nbC5iaW5kRnJhbWVidWZmZXIodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIHRoaXMuZkJ1ZmZlcik7XG4gICAgICAgICAgICB0aGlzLl9nbC5mcmFtZWJ1ZmZlclJlbmRlcmJ1ZmZlcih0aGlzLl9nbC5GUkFNRUJVRkZFUiwgdGhpcy5fZ2wuREVQVEhfQVRUQUNITUVOVCwgdGhpcy5fZ2wuUkVOREVSQlVGRkVSLCB0aGlzLnJlbmRlckJ1ZmZlcik7XG5cbiAgICAgICAgICAgIHRoaXMuZkJ1ZmZlclRlbXAgPSB0aGlzLl9nbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJCdWZmZXJUZW1wID0gY3JlYXRlV2ViR0xSZW5kZXJCdWZmZXIoKTtcbiAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRGcmFtZWJ1ZmZlcih0aGlzLl9nbC5GUkFNRUJVRkZFUiwgdGhpcy5mQnVmZmVyVGVtcCk7XG4gICAgICAgICAgICB0aGlzLl9nbC5mcmFtZWJ1ZmZlclJlbmRlcmJ1ZmZlcih0aGlzLl9nbC5GUkFNRUJVRkZFUiwgdGhpcy5fZ2wuREVQVEhfQVRUQUNITUVOVCwgdGhpcy5fZ2wuUkVOREVSQlVGRkVSLCB0aGlzLnJlbmRlckJ1ZmZlclRlbXApO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwid3JpdGVXZWJHTFRleHR1cmVCdWZmZXJcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFdyaXRlIFdlYkdMVGV4dHVyZSBidWZmZXJcclxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5PGZsb2F0PnxGbG9hdDMyQXJyYXl8VWludDhBcnJheXxXZWJHTFRleHR1cmV8SFRNTEltYWdlRWxlbWVudH0gYXJyXHJcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBbZmxpcD1mYWxzZV1cclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHdyaXRlV2ViR0xUZXh0dXJlQnVmZmVyKGFyciwgZmxpcCkge1xuICAgICAgICAgICAgdmFyIHBzID0gZnVuY3Rpb24gKHRleCwgZmxpcCkge1xuICAgICAgICAgICAgICAgIGlmIChmbGlwID09PSBmYWxzZSB8fCBmbGlwID09PSB1bmRlZmluZWQgfHwgZmxpcCA9PT0gbnVsbCkgdGhpcy5fZ2wucGl4ZWxTdG9yZWkodGhpcy5fZ2wuVU5QQUNLX0ZMSVBfWV9XRUJHTCwgZmFsc2UpO2Vsc2UgdGhpcy5fZ2wucGl4ZWxTdG9yZWkodGhpcy5fZ2wuVU5QQUNLX0ZMSVBfWV9XRUJHTCwgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5waXhlbFN0b3JlaSh0aGlzLl9nbC5VTlBBQ0tfUFJFTVVMVElQTFlfQUxQSEFfV0VCR0wsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kVGV4dHVyZSh0aGlzLl9nbC5URVhUVVJFXzJELCB0ZXgpO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgICAgICAvLyBXZWJHTDJcbiAgICAgICAgICAgIC8vIHRleEltYWdlMkQoZW51bSB0YXJnZXQsIGludCBsZXZlbCwgaW50IGludGVybmFsZm9ybWF0LCBzaXplaSB3aWR0aCwgc2l6ZWkgaGVpZ2h0LCBpbnQgYm9yZGVyLCBlbnVtIGZvcm1hdCwgZW51bSB0eXBlLCBBcnJheUJ1ZmZlclZpZXcgc3JjRGF0YSwgdWludCBzcmNPZmZzZXQpXG4gICAgICAgICAgICAvLyB0ZXhJbWFnZTJEKGVudW0gdGFyZ2V0LCBpbnQgbGV2ZWwsIGludCBpbnRlcm5hbGZvcm1hdCwgc2l6ZWkgd2lkdGgsIHNpemVpIGhlaWdodCwgaW50IGJvcmRlciwgZW51bSBmb3JtYXQsIGVudW0gdHlwZSwgVGV4SW1hZ2VTb3VyY2Ugc291cmNlKTtcbiAgICAgICAgICAgIC8vIHRleEltYWdlMkQoZW51bSB0YXJnZXQsIGludCBsZXZlbCwgaW50IGludGVybmFsZm9ybWF0LCBzaXplaSB3aWR0aCwgc2l6ZWkgaGVpZ2h0LCBpbnQgYm9yZGVyLCBlbnVtIGZvcm1hdCwgZW51bSB0eXBlLCBpbnRwdHIgb2Zmc2V0KTtcbiAgICAgICAgICAgIHZhciB3cml0ZVRleE5vdyA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJyIGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAvL3RoaXMuX2dsLnRleEltYWdlMkQodGhpcy5fZ2wuVEVYVFVSRV8yRCwgMCwgdGhpcy5fZ2wuUkdCQSwgYXJyLndpZHRoLCBhcnIuaGVpZ2h0LCAwLCB0aGlzLl9nbC5SR0JBLCB0aGlzLl9nbC5VTlNJR05FRF9CWVRFLCBhcnIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50eXBlID09PSAnRkxPQVQ0JykgdGhpcy5fZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0ID8gdGhpcy5fZ2wudGV4SW1hZ2UyRCh0aGlzLl9nbC5URVhUVVJFXzJELCAwLCB0aGlzLl9nbC5SR0JBMzJGLCBhcnIud2lkdGgsIGFyci5oZWlnaHQsIDAsIHRoaXMuX2dsLlJHQkEsIHRoaXMuX3N1cHBvcnRGb3JtYXQsIGFycikgOiB0aGlzLl9nbC50ZXhJbWFnZTJEKHRoaXMuX2dsLlRFWFRVUkVfMkQsIDAsIHRoaXMuX2dsLlJHQkEsIHRoaXMuX2dsLlJHQkEsIHRoaXMuX3N1cHBvcnRGb3JtYXQsIGFycik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy90aGlzLl9nbC50ZXhJbWFnZTJEKHRoaXMuX2dsLlRFWFRVUkVfMkQsIDAsIHRoaXMuX2dsLlJHQkEsIHRoaXMuVywgdGhpcy5ILCAwLCB0aGlzLl9nbC5SR0JBLCB0aGlzLl9zdXBwb3J0Rm9ybWF0LCBhcnIsIDApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgPyB0aGlzLl9nbC50ZXhJbWFnZTJEKHRoaXMuX2dsLlRFWFRVUkVfMkQsIDAsIHRoaXMuX2dsLlJHQkEzMkYsIHRoaXMuVywgdGhpcy5ILCAwLCB0aGlzLl9nbC5SR0JBLCB0aGlzLl9zdXBwb3J0Rm9ybWF0LCBhcnIpIDogdGhpcy5fZ2wudGV4SW1hZ2UyRCh0aGlzLl9nbC5URVhUVVJFXzJELCAwLCB0aGlzLl9nbC5SR0JBLCB0aGlzLlcsIHRoaXMuSCwgMCwgdGhpcy5fZ2wuUkdCQSwgdGhpcy5fc3VwcG9ydEZvcm1hdCwgYXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgICAgIHZhciB0cCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgdGhpcy5fZ2wuTkVBUkVTVCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wudGV4UGFyYW1ldGVyaSh0aGlzLl9nbC5URVhUVVJFXzJELCB0aGlzLl9nbC5URVhUVVJFX01JTl9GSUxURVIsIHRoaXMuX2dsLk5FQVJFU1QpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLnRleFBhcmFtZXRlcmkodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy5fZ2wuVEVYVFVSRV9XUkFQX1MsIHRoaXMuX2dsLkNMQU1QX1RPX0VER0UpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLnRleFBhcmFtZXRlcmkodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy5fZ2wuVEVYVFVSRV9XUkFQX1QsIHRoaXMuX2dsLkNMQU1QX1RPX0VER0UpO1xuXG4gICAgICAgICAgICAgICAgLyp0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgdGhpcy5fZ2wuTElORUFSKTtcclxuICAgICAgICAgICAgICAgICB0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgdGhpcy5fZ2wuTElORUFSX01JUE1BUF9ORUFSRVNUKTtcclxuICAgICAgICAgICAgICAgICB0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfV1JBUF9TLCB0aGlzLl9nbC5DTEFNUF9UT19FREdFKTtcclxuICAgICAgICAgICAgICAgICB0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfV1JBUF9ULCB0aGlzLl9nbC5DTEFNUF9UT19FREdFKTtcclxuICAgICAgICAgICAgICAgICB0aGlzLl9nbC5nZW5lcmF0ZU1pcG1hcCh0aGlzLl9nbC5URVhUVVJFXzJEKTsqL1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgICAgICBpZiAoYXJyIGluc3RhbmNlb2YgV2ViR0xUZXh0dXJlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50ZXh0dXJlRGF0YSA9IGFycjtcbiAgICAgICAgICAgICAgICB0aGlzLnRleHR1cmVEYXRhVGVtcCA9IGFycjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcHModGhpcy50ZXh0dXJlRGF0YSwgZmxpcCk7XG4gICAgICAgICAgICAgICAgd3JpdGVUZXhOb3coYXJyKTtcbiAgICAgICAgICAgICAgICB0cCgpO1xuXG4gICAgICAgICAgICAgICAgcHModGhpcy50ZXh0dXJlRGF0YVRlbXAsIGZsaXApO1xuICAgICAgICAgICAgICAgIHdyaXRlVGV4Tm93KGFycik7XG4gICAgICAgICAgICAgICAgdHAoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5fZ2wuYmluZFRleHR1cmUodGhpcy5fZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJ3cml0ZUJ1ZmZlclwiLFxuXG5cbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogV3JpdGUgb24gYnVmZmVyXHJcbiAgICAgICAgICogQHBhcmFtIHtBcnJheTxmbG9hdD58RmxvYXQzMkFycmF5fFVpbnQ4QXJyYXl8V2ViR0xUZXh0dXJlfEhUTUxJbWFnZUVsZW1lbnR9IGFyclxyXG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2ZsaXA9ZmFsc2VdXHJcbiAgICAgICAgICogQHBhcmFtIHtBcnJheTxGbG9hdDI+fSBbb3ZlcnJpZGVEaW1lbnNpb25zPW5ldyBBcnJheSgpe01hdGguc3FydCh2YWx1ZS5sZW5ndGgpLCBNYXRoLnNxcnQodmFsdWUubGVuZ3RoKX1dXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiB3cml0ZUJ1ZmZlcihhcnIsIGZsaXAsIG92ZXJyaWRlRGltZW5zaW9ucykge1xuICAgICAgICAgICAgdmFyIHByZXBhcmVBcnIgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoYXJyIGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubGVuZ3RoLmNvbnN0cnVjdG9yID09PSBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sZW5ndGggPSB0aGlzLmxlbmd0aFswXSAqIHRoaXMubGVuZ3RoWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5XID0gdGhpcy5sZW5ndGhbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLkggPSB0aGlzLmxlbmd0aFsxXTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuVyA9IE1hdGguY2VpbChNYXRoLnNxcnQodGhpcy5sZW5ndGgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuSCA9IHRoaXMuVztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnR5cGUgPT09ICdGTE9BVDQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcnIgPSBhcnIgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgPyBhcnIgOiBuZXcgRmxvYXQzMkFycmF5KGFycik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsID0gdGhpcy5XICogdGhpcy5IICogNDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcnIubGVuZ3RoICE9PSBsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFycnQgPSBuZXcgRmxvYXQzMkFycmF5KGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDwgbDsgbisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFycnRbbl0gPSBhcnJbbl0gIT0gbnVsbCA/IGFycltuXSA6IDAuMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyID0gYXJydDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnR5cGUgPT09ICdGTE9BVCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBfbCA9IHRoaXMuVyAqIHRoaXMuSCAqIDQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXJyYXlUZW1wID0gbmV3IEZsb2F0MzJBcnJheShfbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBfbiA9IDAsIGYgPSB0aGlzLlcgKiB0aGlzLkg7IF9uIDwgZjsgX24rKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpZGQgPSBfbiAqIDQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyYXlUZW1wW2lkZF0gPSBhcnJbX25dICE9IG51bGwgPyBhcnJbX25dIDogMC4wO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFycmF5VGVtcFtpZGQgKyAxXSA9IDAuMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnJheVRlbXBbaWRkICsgMl0gPSAwLjA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyYXlUZW1wW2lkZCArIDNdID0gMC4wO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYXJyID0gYXJyYXlUZW1wO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhcnI7XG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgICAgIGlmIChvdmVycmlkZURpbWVuc2lvbnMgPT09IHVuZGVmaW5lZCB8fCBvdmVycmlkZURpbWVuc2lvbnMgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJyIGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCkgdGhpcy5sZW5ndGggPSBhcnIud2lkdGggKiBhcnIuaGVpZ2h0O2Vsc2UgdGhpcy5sZW5ndGggPSB0aGlzLnR5cGUgPT09IFwiRkxPQVQ0XCIgPyBhcnIubGVuZ3RoIC8gNCA6IGFyci5sZW5ndGg7XG4gICAgICAgICAgICB9IGVsc2UgdGhpcy5sZW5ndGggPSBbb3ZlcnJpZGVEaW1lbnNpb25zWzBdLCBvdmVycmlkZURpbWVuc2lvbnNbMV1dO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5tb2RlID09PSBcIlNBTVBMRVJcIikge1xuICAgICAgICAgICAgICAgIHRoaXMud3JpdGVXZWJHTFRleHR1cmVCdWZmZXIocHJlcGFyZUFycihhcnIpLCBmbGlwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFwiU0FNUExFUlwiIHx8IHRoaXMubW9kZSA9PT0gXCJBVFRSSUJVVEVcIikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRCdWZmZXIodGhpcy5fZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnZlcnRleERhdGEwKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5idWZmZXJEYXRhKHRoaXMuX2dsLkFSUkFZX0JVRkZFUiwgYXJyIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5ID8gYXJyIDogbmV3IEZsb2F0MzJBcnJheShhcnIpLCB0aGlzLl9nbC5TVEFUSUNfRFJBVyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5tb2RlID09PSBcIlZFUlRFWF9JTkRFWFwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEJ1ZmZlcih0aGlzLl9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgdGhpcy52ZXJ0ZXhEYXRhMCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuYnVmZmVyRGF0YSh0aGlzLl9nbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbmV3IFVpbnQxNkFycmF5KGFyciksIHRoaXMuX2dsLlNUQVRJQ19EUkFXKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jcmVhdGVGcmFtZWJ1ZmZlckFuZFJlbmRlcmJ1ZmZlcigpO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwicmVtb3ZlXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSZW1vdmUgdGhpcyBidWZmZXJcclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlbW92ZSgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFwiU0FNUExFUlwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuZGVsZXRlVGV4dHVyZSh0aGlzLnRleHR1cmVEYXRhKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5kZWxldGVUZXh0dXJlKHRoaXMudGV4dHVyZURhdGFUZW1wKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gXCJTQU1QTEVSXCIgfHwgdGhpcy5tb2RlID09PSBcIkFUVFJJQlVURVwiIHx8IHRoaXMubW9kZSA9PT0gXCJWRVJURVhfSU5ERVhcIikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmRlbGV0ZUJ1ZmZlcih0aGlzLnZlcnRleERhdGEwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5fZ2wuZGVsZXRlRnJhbWVidWZmZXIodGhpcy5mQnVmZmVyKTtcbiAgICAgICAgICAgIHRoaXMuX2dsLmRlbGV0ZUZyYW1lYnVmZmVyKHRoaXMuZkJ1ZmZlclRlbXApO1xuXG4gICAgICAgICAgICB0aGlzLl9nbC5kZWxldGVSZW5kZXJidWZmZXIodGhpcy5yZW5kZXJCdWZmZXIpO1xuICAgICAgICAgICAgdGhpcy5fZ2wuZGVsZXRlUmVuZGVyYnVmZmVyKHRoaXMucmVuZGVyQnVmZmVyVGVtcCk7XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gV2ViQ0xHTEJ1ZmZlcjtcbn0oKTtcblxuZ2xvYmFsLldlYkNMR0xCdWZmZXIgPSBXZWJDTEdMQnVmZmVyO1xubW9kdWxlLmV4cG9ydHMuV2ViQ0xHTEJ1ZmZlciA9IFdlYkNMR0xCdWZmZXI7Il19
