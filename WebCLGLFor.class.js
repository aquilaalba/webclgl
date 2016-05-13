/**
 * gpufor
 * @class
 * @constructor
 */
var gpufor = function() {
    var _webCLGL;
    var _clglWork;

    /** @private  */
    var ini = (function() {
        var arguments = arguments[0];
        var args;
        var idx;
        var typOut;
        var code;
        if(arguments.length > 3) {
            args = arguments[0];
            idx = arguments[1];
            typOut = arguments[2];
            code = arguments[3];
        } else {
            args = arguments[0];
            idx = arguments[1];
            typOut = "FLOAT";
            code = arguments[2];
        }

        var strArgs = "", sep="";
        for(var key in args)
            strArgs += sep+key, sep=",";

        var ksrc =   'void main('+strArgs+') {'+
                'vec2 '+idx+' = get_global_id();'+
                code.replace("return", ((typOut=="FLOAT")?"out_float":"out_float4")+" = ")+
            '}';
        var kernel = _webCLGL.createKernel();
        kernel.setKernelSource(ksrc);
        _clglWork.addKernel(kernel, "result");


        var buffLength = 0;
        for(var key in args) {
            var argVal = args[key];

            _clglWork.setArg(key.split(" ")[1], argVal);

            if(buffLength == 0 &&
                (argVal instanceof Array || argVal instanceof Float32Array || argVal instanceof Uint8Array || argVal instanceof HTMLImageElement))
                buffLength = argVal.length;
        }

        //_clglWork.setAllowKernelWriting("result");
        _clglWork.setArg("result", new Float32Array(buffLength), null, null, typOut);


        //_clglWork.enqueueNDRangeKernel("result", _clglWork.buffers_TEMP["result"]);
        //_webCLGL.copy(_clglWork.buffers_TEMP["result"], _clglWork.buffers["result"]);

        _clglWork.enqueueNDRangeKernel("result", _clglWork.buffers["result"]);

        if(typOut=="FLOAT")
            return _webCLGL.enqueueReadBuffer_Float(_clglWork.buffers["result"]);
        else
            return _webCLGL.enqueueReadBuffer_Float4(_clglWork.buffers["result"]);
    }).bind(this);

    /** @private  */
    var iniG = (function() {
        var arguments = arguments[0]; // override
        var args = arguments[1]; // first is context or canvas

        // kernels
        for(var i = 2; i < arguments.length; i++) {
            if(arguments[i].type == "KERNEL") {
                var K = arguments[i].config;

                var idx;
                var outArg;
                var argsInThisKernel = {};
                var outStr;
                var kH;
                var kS;

                if(K.length == 1) { // type direct assign
                    idx = "n";
                    outArg = K[0].match(new RegExp(/(([a-z|A-Z])| )*/gm))[0].trim();
                    var rightVar = K[0].match(new RegExp(/=(([a-z|A-Z])| )*$/gm))[0].replace("=","").trim();
                    var operation = K[0].match(new RegExp(/([^a-z|^A-Z])+/gm))[0].trim();
                    kH = "";
                    kS ='vec4 current = '+outArg+'['+idx+'];\n'+
                        'current '+operation+' '+rightVar+'['+idx+'];\n'+
                        'return current;\n';

                    for(var key in args) {
                        var expl = key.split(" ");

                        if(expl[1] == outArg)
                            argsInThisKernel[key] = true;

                        if(expl[1] == rightVar)
                            argsInThisKernel[key] = true;
                    }
                } else { // by code
                    idx = K[0];
                    outArg = K[1];
                    kH = K[2];
                    kS = K[3];

                    for(var key in args) {
                        var expl = key.split(" ");

                        // search arguments in use
                        var matches = kS.match(new RegExp(expl[1], "gm"));
                        if(key != "indices" && matches != null && matches.length > 0)
                            argsInThisKernel[key] = true;
                    }
                }

                var objOutStr;
                var retCode = kS.match(new RegExp(/return.*$/gm));
                retCode = retCode[0].replace("return ", ""); // now "varx" or "[varx1,varx2,..]"
                var isArr = retCode.match(new RegExp(/\[/gm));
                if(isArr != null && isArr.length >= 1) { // type outputs array
                    objOutStr = [];
                    retCode = retCode.split("[")[1].split("]")[0];
                    var itemStr = "", openParenth = 0;
                    for(var n=0; n < retCode.length; n++) {
                        if(retCode[n] == "," && openParenth == 0) {
                            objOutStr.push(itemStr);
                            itemStr = "";
                        } else
                            itemStr += retCode[n];

                        if(retCode[n] == "(")
                            openParenth++;
                        if(retCode[n] == ")")
                            openParenth--;
                    }
                    objOutStr.push(itemStr); // and the last
                } else { // type one output
                    objOutStr = retCode.replace(/;$/gm, "");
                }

                if(outArg instanceof Array) { // type outputs array
                    for(var n = 0; n < outArg.length; n++) {
                        // set output type float|float4
                        _clglWork.setAllowKernelWriting(outArg[n]);
                        for(var key in args) {
                            var expl = key.split(" ");

                            if(expl[1] == outArg[n]) {
                                var mt = expl[0].match(new RegExp("float4", "gm"));
                                if(n==0)
                                    outStr = (mt != null && mt.length > 0) ? "out_float4 = "+objOutStr[n]+";\n" : "out_float = "+objOutStr[n]+";\n";
                                else
                                    outStr += (mt != null && mt.length > 0) ? "out"+n+"_float4 = "+objOutStr[n]+";\n" : "out"+n+"_float = "+objOutStr[n]+";\n";
                            }
                        }
                    }
                } else { // type one output
                    // set output type float|float4
                    if(outArg != undefined) {
                        _clglWork.setAllowKernelWriting(outArg);
                        for(var key in args) {
                            var expl = key.split(" ");

                            if(expl[1] == outArg) {
                                var mt = expl[0].match(new RegExp("float4", "gm"));
                                outStr = (mt != null && mt.length > 0) ? "out_float4 = "+objOutStr+";\n" : "out_float = "+objOutStr+";\n";
                            }
                        }
                    } else
                        outStr = "out_float4 = "+objOutStr+";\n";
                }

                var strArgs = "", sep="";
                for(var key in argsInThisKernel)
                    strArgs += sep+key, sep=",";

                kS = 'void main('+strArgs+') {'+
                    'vec2 '+idx+' = get_global_id();'+
                    kS.replace(/return.*$/gm, outStr)+
                    '}';
                var kernel = _webCLGL.createKernel();
                kernel.setKernelSource(kS, kH);
                _clglWork.addKernel(kernel, outArg);

            } else if(arguments[i].type == "GRAPHIC") { // VFP
                var VFP = arguments[i].config;
                var VFP_vertexH = VFP[0];
                var VFP_vertexS = VFP[1];
                var VFP_fragmentH = VFP[2];
                var VFP_fragmentS = VFP[3];


                var argsInThisVFP_v = {};
                var strArgs_v = "", sep="";
                for(var key in args) {
                    // search arguments in use
                    var matches = VFP_vertexS.match(new RegExp(key.split(" ")[1], "gm"));
                    if(key != "indices" && matches != null && matches.length > 0)
                        argsInThisVFP_v[key] = true;
                }
                for(var key in argsInThisVFP_v)
                    strArgs_v += sep+key, sep=",";

                var argsInThisVFP_f = {};
                var strArgs_f = "", sep="";
                for(var key in args) {
                    // search arguments in use
                    matches = VFP_fragmentS.match(new RegExp(key.split(" ")[1], "gm"));
                    if(key != "indices" && matches != null && matches.length > 0)
                        argsInThisVFP_f[key] = true;
                }
                for(var key in argsInThisVFP_f)
                    strArgs_f += sep+key, sep=",";

                VFP_vertexS = 'void main('+strArgs_v+') {'+
                    VFP_vertexS+
                    '}';
                VFP_fragmentS = 'void main('+strArgs_f+') {'+
                    VFP_fragmentS+
                    '}';


                var vfprogram = _webCLGL.createVertexFragmentProgram();
                vfprogram.setVertexSource(VFP_vertexS, VFP_vertexH);
                vfprogram.setFragmentSource(VFP_fragmentS, VFP_fragmentH);
                _clglWork.addVertexFragmentProgram(vfprogram, "vertexFragmentProgram1");
            }
        }

        // args
        for(var key in args) {
            var argVal = args[key];

            if(key == "indices")
                _clglWork.setIndices(argVal);
            else
                _clglWork.setArg(key.split(" ")[1], argVal);
        }
    }).bind(this);
    if(arguments[0] instanceof HTMLCanvasElement) {
        var _gl = new WebCLGLUtils().getWebGLContextFromCanvas(arguments[0]);
        _webCLGL = new WebCLGL(_gl);
        _clglWork = _webCLGL.createWork(1000);
        iniG(arguments);
    } else if(arguments[0] instanceof WebGLRenderingContext) {
        var _gl = arguments[0];
        _webCLGL = new WebCLGL(_gl);
        _clglWork = _webCLGL.createWork(1000);
        iniG(arguments);
    } else {
        _webCLGL = new WebCLGL();
        _clglWork = _webCLGL.createWork(window.gpufor_precision|0);
        return ini(arguments);
    }

    /**
     * getCtx
     */
    this.getCtx = function() {
        return _gl;
    };

    /**
     * getWebCLGL
     */
    this.getWebCLGL = function() {
        return _webCLGL;
    };

    /**
     * getWork
     */
    this.getWork = function() {
        return _clglWork;
    };

    /**
     * processKernels
     * @param {Int} [buffDest=undefined] - if 0 then output to null screen
     */
    this.processKernels = function(buffDest) {
        _clglWork.enqueueNDRangeKernel(buffDest);
    };

    /**
     * setArg
     * @param {String} argName
     * @param {Array<Float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} value
     * @param {Array<Float>} [splits=[value.length]]
     * @param {Array<Float2>} [overrideDimensions=new Array(){Math.sqrt(value.length), Math.sqrt(value.length)}]
     * @param {String} [overrideType="FLOAT4"] - force "FLOAT4" or "FLOAT"
     * @returns {WebCLGLBuffer}
     */
    this.setArg = function(argName, value, splits, overrideDimensions, overrideType) {
        return _clglWork.setArg(argName, value, splits, overrideDimensions, overrideType);
    };

    /**
     * Set shared argument from other work
     * @param {String} argument Argument to set
     * @param {WebCLGLWork} clglWork
     */
    this.setSharedBufferArg = function(argument, clglWork) {
        _clglWork.setSharedBufferArg(argument, clglWork);
    };

    /**
     * Get all arguments existing in passed kernels & vertexFragmentPrograms
     * @returns {Object}
     */
    this.getAllArgs = function() {
        return _clglWork.getAllArgs();
    };

    /**
     * processGraphic
     * @param {String} [argument=undefined] Argument for vertices count or undefined if indices exist
     * @param {Int} [drawMode=0] 0=POINTS, 3=LINE_STRIP, 2=LINE_LOOP, 1=LINES, 5=TRIANGLE_STRIP, 6=TRIANGLE_FAN and 4=TRIANGLES
     * @param {WebCLGLBuffer} [buffDest=undefined]
     **/
    this.processGraphic = function(argument, drawMode, buffDest) {
        var dmode = (drawMode != undefined) ? drawMode : 0;

        _clglWork.enqueueVertexFragmentProgram(argument, "vertexFragmentProgram1", dmode, buffDest);
    };
};

