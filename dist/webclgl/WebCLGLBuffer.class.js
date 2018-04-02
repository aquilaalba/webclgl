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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvd2ViY2xnbC9XZWJDTEdMQnVmZmVyLmNsYXNzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfXJldHVybiBlfSkoKSIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KCk7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbi8qKlxyXG4qIFdlYkNMR0xCdWZmZXJcclxuKiBAY2xhc3NcclxuICogQHBhcmFtIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGdsXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBbdHlwZT1cIkZMT0FUXCJdXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2xpbmVhcj10cnVlXVxyXG4gKiBAcGFyYW0ge1N0cmluZ30gW21vZGU9XCJTQU1QTEVSXCJdIFwiU0FNUExFUlwiLCBcIkFUVFJJQlVURVwiLCBcIlZFUlRFWF9JTkRFWFwiXHJcbiovXG52YXIgV2ViQ0xHTEJ1ZmZlciA9IGV4cG9ydHMuV2ViQ0xHTEJ1ZmZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBXZWJDTEdMQnVmZmVyKGdsLCB0eXBlLCBsaW5lYXIsIG1vZGUpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFdlYkNMR0xCdWZmZXIpO1xuXG4gICAgICAgIHRoaXMuX2dsID0gZ2w7XG5cbiAgICAgICAgdGhpcy50eXBlID0gdHlwZSAhPT0gdW5kZWZpbmVkIHx8IHR5cGUgIT09IG51bGwgPyB0eXBlIDogJ0ZMT0FUJztcbiAgICAgICAgdGhpcy5fc3VwcG9ydEZvcm1hdCA9IHRoaXMuX2dsLkZMT0FUO1xuXG4gICAgICAgIHRoaXMubGluZWFyID0gbGluZWFyICE9PSB1bmRlZmluZWQgfHwgbGluZWFyICE9PSBudWxsID8gbGluZWFyIDogdHJ1ZTtcbiAgICAgICAgdGhpcy5tb2RlID0gbW9kZSAhPT0gdW5kZWZpbmVkIHx8IG1vZGUgIT09IG51bGwgPyBtb2RlIDogXCJTQU1QTEVSXCI7XG5cbiAgICAgICAgdGhpcy5XID0gbnVsbDtcbiAgICAgICAgdGhpcy5IID0gbnVsbDtcblxuICAgICAgICB0aGlzLnRleHR1cmVEYXRhID0gbnVsbDtcbiAgICAgICAgdGhpcy50ZXh0dXJlRGF0YVRlbXAgPSBudWxsO1xuICAgICAgICB0aGlzLnZlcnRleERhdGEwID0gbnVsbDtcblxuICAgICAgICB0aGlzLmZCdWZmZXIgPSBudWxsO1xuICAgICAgICB0aGlzLnJlbmRlckJ1ZmZlciA9IG51bGw7XG4gICAgICAgIHRoaXMuZkJ1ZmZlclRlbXAgPSBudWxsO1xuICAgICAgICB0aGlzLnJlbmRlckJ1ZmZlclRlbXAgPSBudWxsO1xuXG4gICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFwiU0FNUExFUlwiKSB7XG4gICAgICAgICAgICB0aGlzLnRleHR1cmVEYXRhID0gdGhpcy5fZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICAgICAgICAgICAgdGhpcy50ZXh0dXJlRGF0YVRlbXAgPSB0aGlzLl9nbC5jcmVhdGVUZXh0dXJlKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gXCJTQU1QTEVSXCIgfHwgdGhpcy5tb2RlID09PSBcIkFUVFJJQlVURVwiIHx8IHRoaXMubW9kZSA9PT0gXCJWRVJURVhfSU5ERVhcIikge1xuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhEYXRhMCA9IHRoaXMuX2dsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXHJcbiAgICAgKiBjcmVhdGVGcmFtZWJ1ZmZlckFuZFJlbmRlcmJ1ZmZlclxyXG4gICAgICovXG5cblxuICAgIF9jcmVhdGVDbGFzcyhXZWJDTEdMQnVmZmVyLCBbe1xuICAgICAgICBrZXk6IFwiY3JlYXRlRnJhbWVidWZmZXJBbmRSZW5kZXJidWZmZXJcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNyZWF0ZUZyYW1lYnVmZmVyQW5kUmVuZGVyYnVmZmVyKCkge1xuICAgICAgICAgICAgdmFyIGNyZWF0ZVdlYkdMUmVuZGVyQnVmZmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciByQnVmZmVyID0gdGhpcy5fZ2wuY3JlYXRlUmVuZGVyYnVmZmVyKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuYmluZFJlbmRlcmJ1ZmZlcih0aGlzLl9nbC5SRU5ERVJCVUZGRVIsIHJCdWZmZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLnJlbmRlcmJ1ZmZlclN0b3JhZ2UodGhpcy5fZ2wuUkVOREVSQlVGRkVSLCB0aGlzLl9nbC5ERVBUSF9DT01QT05FTlQxNiwgdGhpcy5XLCB0aGlzLkgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJpbmRSZW5kZXJidWZmZXIodGhpcy5fZ2wuUkVOREVSQlVGRkVSLCBudWxsKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gckJ1ZmZlcjtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuZkJ1ZmZlciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuZGVsZXRlRnJhbWVidWZmZXIodGhpcy5mQnVmZmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5kZWxldGVGcmFtZWJ1ZmZlcih0aGlzLmZCdWZmZXJUZW1wKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmRlbGV0ZVJlbmRlcmJ1ZmZlcih0aGlzLnJlbmRlckJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuZGVsZXRlUmVuZGVyYnVmZmVyKHRoaXMucmVuZGVyQnVmZmVyVGVtcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmZCdWZmZXIgPSB0aGlzLl9nbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJCdWZmZXIgPSBjcmVhdGVXZWJHTFJlbmRlckJ1ZmZlcigpO1xuICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEZyYW1lYnVmZmVyKHRoaXMuX2dsLkZSQU1FQlVGRkVSLCB0aGlzLmZCdWZmZXIpO1xuICAgICAgICAgICAgdGhpcy5fZ2wuZnJhbWVidWZmZXJSZW5kZXJidWZmZXIodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIHRoaXMuX2dsLkRFUFRIX0FUVEFDSE1FTlQsIHRoaXMuX2dsLlJFTkRFUkJVRkZFUiwgdGhpcy5yZW5kZXJCdWZmZXIpO1xuXG4gICAgICAgICAgICB0aGlzLmZCdWZmZXJUZW1wID0gdGhpcy5fZ2wuY3JlYXRlRnJhbWVidWZmZXIoKTtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyQnVmZmVyVGVtcCA9IGNyZWF0ZVdlYkdMUmVuZGVyQnVmZmVyKCk7XG4gICAgICAgICAgICB0aGlzLl9nbC5iaW5kRnJhbWVidWZmZXIodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIHRoaXMuZkJ1ZmZlclRlbXApO1xuICAgICAgICAgICAgdGhpcy5fZ2wuZnJhbWVidWZmZXJSZW5kZXJidWZmZXIodGhpcy5fZ2wuRlJBTUVCVUZGRVIsIHRoaXMuX2dsLkRFUFRIX0FUVEFDSE1FTlQsIHRoaXMuX2dsLlJFTkRFUkJVRkZFUiwgdGhpcy5yZW5kZXJCdWZmZXJUZW1wKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIndyaXRlV2ViR0xUZXh0dXJlQnVmZmVyXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBXcml0ZSBXZWJHTFRleHR1cmUgYnVmZmVyXHJcbiAgICAgICAgICogQHBhcmFtIHtBcnJheTxmbG9hdD58RmxvYXQzMkFycmF5fFVpbnQ4QXJyYXl8V2ViR0xUZXh0dXJlfEhUTUxJbWFnZUVsZW1lbnR9IGFyclxyXG4gICAgICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2ZsaXA9ZmFsc2VdXHJcbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiB3cml0ZVdlYkdMVGV4dHVyZUJ1ZmZlcihhcnIsIGZsaXApIHtcbiAgICAgICAgICAgIHZhciBwcyA9IGZ1bmN0aW9uICh0ZXgsIGZsaXApIHtcbiAgICAgICAgICAgICAgICBpZiAoZmxpcCA9PT0gZmFsc2UgfHwgZmxpcCA9PT0gdW5kZWZpbmVkIHx8IGZsaXAgPT09IG51bGwpIHRoaXMuX2dsLnBpeGVsU3RvcmVpKHRoaXMuX2dsLlVOUEFDS19GTElQX1lfV0VCR0wsIGZhbHNlKTtlbHNlIHRoaXMuX2dsLnBpeGVsU3RvcmVpKHRoaXMuX2dsLlVOUEFDS19GTElQX1lfV0VCR0wsIHRydWUpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wucGl4ZWxTdG9yZWkodGhpcy5fZ2wuVU5QQUNLX1BSRU1VTFRJUExZX0FMUEhBX1dFQkdMLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuYmluZFRleHR1cmUodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGV4KTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICAgICAgdmFyIHdyaXRlVGV4Tm93ID0gZnVuY3Rpb24gKGFycikge1xuICAgICAgICAgICAgICAgIGlmIChhcnIgaW5zdGFuY2VvZiBIVE1MSW1hZ2VFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vdGhpcy5fZ2wudGV4SW1hZ2UyRCh0aGlzLl9nbC5URVhUVVJFXzJELCAwLCB0aGlzLl9nbC5SR0JBLCBhcnIud2lkdGgsIGFyci5oZWlnaHQsIDAsIHRoaXMuX2dsLlJHQkEsIHRoaXMuX2dsLlVOU0lHTkVEX0JZVEUsIGFycik7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnR5cGUgPT09ICdGTE9BVDQnKSB0aGlzLl9nbC50ZXhJbWFnZTJEKHRoaXMuX2dsLlRFWFRVUkVfMkQsIDAsIHRoaXMuX2dsLlJHQkEsIHRoaXMuX2dsLlJHQkEsIHRoaXMuX3N1cHBvcnRGb3JtYXQsIGFycik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy90aGlzLl9nbC50ZXhJbWFnZTJEKHRoaXMuX2dsLlRFWFRVUkVfMkQsIDAsIHRoaXMuX2dsLlJHQkEsIHRoaXMuVywgdGhpcy5ILCAwLCB0aGlzLl9nbC5SR0JBLCB0aGlzLl9zdXBwb3J0Rm9ybWF0LCBhcnIsIDApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9nbC50ZXhJbWFnZTJEKHRoaXMuX2dsLlRFWFRVUkVfMkQsIDAsIHRoaXMuX2dsLlJHQkEsIHRoaXMuVywgdGhpcy5ILCAwLCB0aGlzLl9nbC5SR0JBLCB0aGlzLl9zdXBwb3J0Rm9ybWF0LCBhcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICAgICAgdmFyIHRwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLnRleFBhcmFtZXRlcmkodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy5fZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCB0aGlzLl9nbC5ORUFSRVNUKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC50ZXhQYXJhbWV0ZXJpKHRoaXMuX2dsLlRFWFRVUkVfMkQsIHRoaXMuX2dsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgdGhpcy5fZ2wuTkVBUkVTVCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wudGV4UGFyYW1ldGVyaSh0aGlzLl9nbC5URVhUVVJFXzJELCB0aGlzLl9nbC5URVhUVVJFX1dSQVBfUywgdGhpcy5fZ2wuQ0xBTVBfVE9fRURHRSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wudGV4UGFyYW1ldGVyaSh0aGlzLl9nbC5URVhUVVJFXzJELCB0aGlzLl9nbC5URVhUVVJFX1dSQVBfVCwgdGhpcy5fZ2wuQ0xBTVBfVE9fRURHRSk7XG5cbiAgICAgICAgICAgICAgICAvKnRoaXMuX2dsLnRleFBhcmFtZXRlcmkodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy5fZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCB0aGlzLl9nbC5MSU5FQVIpO1xyXG4gICAgICAgICAgICAgICAgIHRoaXMuX2dsLnRleFBhcmFtZXRlcmkodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy5fZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCB0aGlzLl9nbC5MSU5FQVJfTUlQTUFQX05FQVJFU1QpO1xyXG4gICAgICAgICAgICAgICAgIHRoaXMuX2dsLnRleFBhcmFtZXRlcmkodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy5fZ2wuVEVYVFVSRV9XUkFQX1MsIHRoaXMuX2dsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgICAgICAgICAgICAgIHRoaXMuX2dsLnRleFBhcmFtZXRlcmkodGhpcy5fZ2wuVEVYVFVSRV8yRCwgdGhpcy5fZ2wuVEVYVFVSRV9XUkFQX1QsIHRoaXMuX2dsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgICAgICAgICAgICAgIHRoaXMuX2dsLmdlbmVyYXRlTWlwbWFwKHRoaXMuX2dsLlRFWFRVUkVfMkQpOyovXG4gICAgICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgICAgIGlmIChhcnIgaW5zdGFuY2VvZiBXZWJHTFRleHR1cmUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRleHR1cmVEYXRhID0gYXJyO1xuICAgICAgICAgICAgICAgIHRoaXMudGV4dHVyZURhdGFUZW1wID0gYXJyO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcyh0aGlzLnRleHR1cmVEYXRhLCBmbGlwKTtcbiAgICAgICAgICAgICAgICB3cml0ZVRleE5vdyhhcnIpO1xuICAgICAgICAgICAgICAgIHRwKCk7XG5cbiAgICAgICAgICAgICAgICBwcyh0aGlzLnRleHR1cmVEYXRhVGVtcCwgZmxpcCk7XG4gICAgICAgICAgICAgICAgd3JpdGVUZXhOb3coYXJyKTtcbiAgICAgICAgICAgICAgICB0cCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9nbC5iaW5kVGV4dHVyZSh0aGlzLl9nbC5URVhUVVJFXzJELCBudWxsKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIndyaXRlQnVmZmVyXCIsXG5cblxuICAgICAgICAvKipcclxuICAgICAgICAgKiBXcml0ZSBvbiBidWZmZXJcclxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5PGZsb2F0PnxGbG9hdDMyQXJyYXl8VWludDhBcnJheXxXZWJHTFRleHR1cmV8SFRNTEltYWdlRWxlbWVudH0gYXJyXHJcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBbZmxpcD1mYWxzZV1cclxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5PEZsb2F0Mj59IFtvdmVycmlkZURpbWVuc2lvbnM9bmV3IEFycmF5KCl7TWF0aC5zcXJ0KHZhbHVlLmxlbmd0aCksIE1hdGguc3FydCh2YWx1ZS5sZW5ndGgpfV1cclxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHdyaXRlQnVmZmVyKGFyciwgZmxpcCwgb3ZlcnJpZGVEaW1lbnNpb25zKSB7XG4gICAgICAgICAgICB2YXIgcHJlcGFyZUFyciA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoIShhcnIgaW5zdGFuY2VvZiBIVE1MSW1hZ2VFbGVtZW50KSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5sZW5ndGguY29uc3RydWN0b3IgPT09IEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxlbmd0aCA9IHRoaXMubGVuZ3RoWzBdICogdGhpcy5sZW5ndGhbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLlcgPSB0aGlzLmxlbmd0aFswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuSCA9IHRoaXMubGVuZ3RoWzFdO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5XID0gTWF0aC5jZWlsKE1hdGguc3FydCh0aGlzLmxlbmd0aCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5IID0gdGhpcy5XO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudHlwZSA9PT0gJ0ZMT0FUNCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyciA9IGFyciBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSA/IGFyciA6IG5ldyBGbG9hdDMyQXJyYXkoYXJyKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGwgPSB0aGlzLlcgKiB0aGlzLkggKiA0O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFyci5sZW5ndGggIT09IGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXJydCA9IG5ldyBGbG9hdDMyQXJyYXkobCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPCBsOyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJydFtuXSA9IGFycltuXSAhPSBudWxsID8gYXJyW25dIDogMC4wO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnIgPSBhcnJ0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMudHlwZSA9PT0gJ0ZMT0FUJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIF9sID0gdGhpcy5XICogdGhpcy5IICogNDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhcnJheVRlbXAgPSBuZXcgRmxvYXQzMkFycmF5KF9sKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIF9uID0gMCwgZiA9IHRoaXMuVyAqIHRoaXMuSDsgX24gPCBmOyBfbisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlkZCA9IF9uICogNDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnJheVRlbXBbaWRkXSA9IGFycltfbl0gIT0gbnVsbCA/IGFycltfbl0gOiAwLjA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyYXlUZW1wW2lkZCArIDFdID0gMC4wO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFycmF5VGVtcFtpZGQgKyAyXSA9IDAuMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnJheVRlbXBbaWRkICsgM10gPSAwLjA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBhcnIgPSBhcnJheVRlbXA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFycjtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICAgICAgaWYgKG92ZXJyaWRlRGltZW5zaW9ucyA9PT0gdW5kZWZpbmVkIHx8IG92ZXJyaWRlRGltZW5zaW9ucyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmIChhcnIgaW5zdGFuY2VvZiBIVE1MSW1hZ2VFbGVtZW50KSB0aGlzLmxlbmd0aCA9IGFyci53aWR0aCAqIGFyci5oZWlnaHQ7ZWxzZSB0aGlzLmxlbmd0aCA9IHRoaXMudHlwZSA9PT0gXCJGTE9BVDRcIiA/IGFyci5sZW5ndGggLyA0IDogYXJyLmxlbmd0aDtcbiAgICAgICAgICAgIH0gZWxzZSB0aGlzLmxlbmd0aCA9IFtvdmVycmlkZURpbWVuc2lvbnNbMF0sIG92ZXJyaWRlRGltZW5zaW9uc1sxXV07XG5cbiAgICAgICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFwiU0FNUExFUlwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53cml0ZVdlYkdMVGV4dHVyZUJ1ZmZlcihwcmVwYXJlQXJyKGFyciksIGZsaXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gXCJTQU1QTEVSXCIgfHwgdGhpcy5tb2RlID09PSBcIkFUVFJJQlVURVwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuYmluZEJ1ZmZlcih0aGlzLl9nbC5BUlJBWV9CVUZGRVIsIHRoaXMudmVydGV4RGF0YTApO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmJ1ZmZlckRhdGEodGhpcy5fZ2wuQVJSQVlfQlVGRkVSLCBhcnIgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgPyBhcnIgOiBuZXcgRmxvYXQzMkFycmF5KGFyciksIHRoaXMuX2dsLlNUQVRJQ19EUkFXKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFwiVkVSVEVYX0lOREVYXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5iaW5kQnVmZmVyKHRoaXMuX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCB0aGlzLnZlcnRleERhdGEwKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5idWZmZXJEYXRhKHRoaXMuX2dsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBuZXcgVWludDE2QXJyYXkoYXJyKSwgdGhpcy5fZ2wuU1RBVElDX0RSQVcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUZyYW1lYnVmZmVyQW5kUmVuZGVyYnVmZmVyKCk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJyZW1vdmVcIixcblxuXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFJlbW92ZSB0aGlzIGJ1ZmZlclxyXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcmVtb3ZlKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gXCJTQU1QTEVSXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9nbC5kZWxldGVUZXh0dXJlKHRoaXMudGV4dHVyZURhdGEpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2dsLmRlbGV0ZVRleHR1cmUodGhpcy50ZXh0dXJlRGF0YVRlbXApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5tb2RlID09PSBcIlNBTVBMRVJcIiB8fCB0aGlzLm1vZGUgPT09IFwiQVRUUklCVVRFXCIgfHwgdGhpcy5tb2RlID09PSBcIlZFUlRFWF9JTkRFWFwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZ2wuZGVsZXRlQnVmZmVyKHRoaXMudmVydGV4RGF0YTApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9nbC5kZWxldGVGcmFtZWJ1ZmZlcih0aGlzLmZCdWZmZXIpO1xuICAgICAgICAgICAgdGhpcy5fZ2wuZGVsZXRlRnJhbWVidWZmZXIodGhpcy5mQnVmZmVyVGVtcCk7XG5cbiAgICAgICAgICAgIHRoaXMuX2dsLmRlbGV0ZVJlbmRlcmJ1ZmZlcih0aGlzLnJlbmRlckJ1ZmZlcik7XG4gICAgICAgICAgICB0aGlzLl9nbC5kZWxldGVSZW5kZXJidWZmZXIodGhpcy5yZW5kZXJCdWZmZXJUZW1wKTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBXZWJDTEdMQnVmZmVyO1xufSgpO1xuXG5nbG9iYWwuV2ViQ0xHTEJ1ZmZlciA9IFdlYkNMR0xCdWZmZXI7XG5tb2R1bGUuZXhwb3J0cy5XZWJDTEdMQnVmZmVyID0gV2ViQ0xHTEJ1ZmZlcjsiXX0=
