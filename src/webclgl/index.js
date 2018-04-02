"use strict";
import {WebCLGL} from "./WebCLGL.class";
import {WebCLGLBuffer} from "./WebCLGLBuffer.class";
import {WebCLGLFor} from "./WebCLGLFor.class";
import {WebCLGLKernel} from "./WebCLGLKernel.class";
import {WebCLGLUtils} from "./WebCLGLUtils.class";
import {WebCLGLVertexFragmentProgram} from "./WebCLGLVertexFragmentProgram.class";

Object.defineProperty(exports, "__esModule", { value: true });

var exp = { "WebCLGL": "./WebCLGL.class",
            "WebCLGLBuffer": "./WebCLGLBuffer.class.js",
            "WebCLGLFor": "./WebCLGLFor.class.js",
            "WebCLGLKernel": "./WebCLGLKernel.class.js",
            "WebCLGLUtils": "./WebCLGLUtils.class.js",
            "WebCLGLVertexFragmentProgram": "./WebCLGLVertexFragmentProgram.class.js"
};

for(var key in exp)
    exports[key] = require(exp[key]);
