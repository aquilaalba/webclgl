import {WebCLGLUtils} from "./WebCLGLUtils.class";

/**
* WebCLGLVertexFragmentProgram Object
* @class
 * @param {WebGLRenderingContext} gl
 * @param {String} vertexSource
 * @param {String} vertexHeader
 * @param {String} fragmentSource
 * @param {String} fragmentHeader
*/
export class WebCLGLVertexFragmentProgram {
    constructor(gl, vertexSource, vertexHeader, fragmentSource, fragmentHeader) {
        this._gl = gl;

        let highPrecisionSupport = this._gl.getShaderPrecisionFormat(this._gl.FRAGMENT_SHADER, this._gl.HIGH_FLOAT);
        this._precision = (highPrecisionSupport.precision !== 0)
            ? 'precision highp float;\n\nprecision highp int;\n\n'
            : 'precision lowp float;\n\nprecision lowp int;\n\n';

        this.version = (this._gl instanceof WebGL2RenderingContext)
            ? "#version 300 es \n "
            : "";

        this._arrExt = (this._gl instanceof WebGL2RenderingContext)
            ? {"EXT_color_buffer_float":null}
            : {"OES_texture_float":null, "OES_texture_float_linear":null, "OES_element_index_uint":null, "WEBGL_draw_buffers":null};
        for(let key in this._arrExt) {
            this._arrExt[key] = this._gl.getExtension(key);
            if(this._arrExt[key] == null)
                console.error("extension "+key+" not available");
            else
                console.log("using extension "+key);
        }

        this.extDrawBuff = (this._gl instanceof WebGL2RenderingContext)
            ? ""
            : " #extension GL_EXT_draw_buffers : require\n";

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

        if(vertexSource !== undefined && vertexSource !== null)
            this.setVertexSource(vertexSource, vertexHeader);

        if(fragmentSource !== undefined && fragmentSource !== null)
            this.setFragmentSource(fragmentSource, fragmentHeader);
    }

    /**
     * compileVertexFragmentSource
     */
    compileVertexFragmentSource() {
        let sourceVertex = this.version+
            this._precision+
            'uniform float uOffset;\n'+
            'uniform float uBufferWidth;'+

            WebCLGLUtils.lines_vertex_attrs(this.in_vertex_values, (this._gl instanceof WebGL2RenderingContext))+

            WebCLGLUtils.unpackGLSLFunctionString()+

            WebCLGLUtils.get_global_id3_GLSLFunctionString()+
            WebCLGLUtils.get_global_id2_GLSLFunctionString()+

            this._vertexHead+

            'void main(void) {\n'+

                this._vertexSource+

            '}\n';
        let sourceFragment = this.version+
            this.extDrawBuff+
            this._precision+

            WebCLGLUtils.lines_fragment_attrs(this.in_fragment_values)+

            WebCLGLUtils.get_global_id3_GLSLFunctionString()+
            WebCLGLUtils.get_global_id2_GLSLFunctionString()+

            this._fragmentHead+

            ((this._gl instanceof WebGL2RenderingContext) ? WebCLGLUtils.lines_drawBuffersWriteInit_GL2(8) : "")+
            'void main(void) {\n'+
                WebCLGLUtils.lines_drawBuffersInit(8)+

                this._fragmentSource+

            ((this._gl instanceof WebGL2RenderingContext) ? WebCLGLUtils.lines_drawBuffersWrite_GL2(8) : WebCLGLUtils.lines_drawBuffersWrite(8))+
            '}\n';

        this.vertexFragmentProgram = this._gl.createProgram();
        let result = new WebCLGLUtils().createShader(this._gl, "WEBCLGL VERTEX FRAGMENT PROGRAM", sourceVertex, sourceFragment, this.vertexFragmentProgram);

        this.uOffset = this._gl.getUniformLocation(this.vertexFragmentProgram, "uOffset");
        this.uBufferWidth = this._gl.getUniformLocation(this.vertexFragmentProgram, "uBufferWidth");

        for(let key in this.in_vertex_values) {
            let loc = (this.in_vertex_values[key].expectedMode === "ATTRIBUTE") ? this._gl.getAttribLocation(this.vertexFragmentProgram, this.in_vertex_values[key].varname) : this._gl.getUniformLocation(this.vertexFragmentProgram, this.in_vertex_values[key].varname);
            this.in_vertex_values[key].location = [loc];
        }

        for(let key in this.in_fragment_values) {
            this.in_fragment_values[key].location = [this._gl.getUniformLocation(this.vertexFragmentProgram, this.in_fragment_values[key].varname)];
        }


        return "VERTEX PROGRAM\n"+sourceVertex+"\n FRAGMENT PROGRAM\n"+sourceFragment;
    };

    /**
     * Update the vertex source
     * @param {String} vertexSource
     * @param {String} vertexHeader
     */
    setVertexSource(vertexSource, vertexHeader) {
        let argumentsSource = vertexSource.split(')')[0].split('(')[1].split(','); // "float* A", "float* B", "float C", "float4* D"

        for(let n = 0, f = argumentsSource.length; n < f; n++) {
            if(argumentsSource[n].match(/\*attr/gm) !== null) {
                let argName = argumentsSource[n].split('*attr')[1].trim();
                WebCLGLUtils.checkArgNameInitialization(this.in_vertex_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_vertex_values[argName].type = 'float4_fromAttr';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_vertex_values[argName].type = 'float_fromAttr';
            } else if(argumentsSource[n].match(/\*/gm) !== null) {
                let argName = argumentsSource[n].split('*')[1].trim();
                WebCLGLUtils.checkArgNameInitialization(this.in_vertex_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_vertex_values[argName].type = 'float4_fromSampler';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_vertex_values[argName].type = 'float_fromSampler';
            } else if(argumentsSource[n] !== "") {
                let argName = argumentsSource[n].split(' ')[1].trim();
                for(let key in this.in_vertex_values) {
                    if(key.replace(/\[\d.*/, "") === argName) {
                        argName = key; // for normal uniform arrays
                        break;
                    }
                }

                WebCLGLUtils.checkArgNameInitialization(this.in_vertex_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_vertex_values[argName].type = 'float4';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_vertex_values[argName].type = 'float';
                else if(argumentsSource[n].match(/mat4/gm) != null)
                    this.in_vertex_values[argName].type = 'mat4';
            }
        }

        // parse header
        this._vertexHead = (vertexHeader !== undefined && vertexHeader !== null) ? vertexHeader : '';
        this._vertexHead = this._vertexHead.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        this._vertexHead = WebCLGLUtils.parseSource(this._vertexHead, this.in_vertex_values, (this._gl instanceof WebGL2RenderingContext));

        // parse source
        this._vertexSource = vertexSource.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        this._vertexSource = this._vertexSource.replace(/^\w* \w*\([\w\s\*,]*\) {/gi, '').replace(/}(\s|\t)*$/gi, '');
        this._vertexSource = WebCLGLUtils.parseSource(this._vertexSource, this.in_vertex_values, (this._gl instanceof WebGL2RenderingContext));

        for(let key in this.in_vertex_values) {
            let expectedMode = {'float4_fromSampler': "SAMPLER",
                'float_fromSampler': "SAMPLER",
                'float4_fromAttr': "ATTRIBUTE",
                'float_fromAttr': "ATTRIBUTE",
                'float': "UNIFORM",
                'float4': "UNIFORM",
                'mat4': "UNIFORM"}[this.in_vertex_values[key].type];

            this.in_vertex_values[key].varname = (expectedMode === "ATTRIBUTE") ? key : key.replace(/\[\d.*/, "");
            this.in_vertex_values[key].varnameC = key;
            this.in_vertex_values[key].expectedMode = expectedMode;
        }

        this._vertexP_ready = true;
        if(this._fragmentP_ready === true) {
            let ts = this.compileVertexFragmentSource();

            if(this.viewSource === true)
                console.log('%c VFP: '+this.name, 'font-size: 20px; color: green'),
                console.log('%c WEBCLGL --------------------------------', 'color: gray'),
                console.log('%c '+vertexHeader+vertexSource, 'color: gray'),
                console.log('%c TRANSLATED WEBGL ------------------------------', 'color: darkgray'),
                console.log('%c '+ts, 'color: darkgray');
        }
    };

    /**
     * Update the fragment source
     * @param {String} fragmentSource
     * @param {String} fragmentHeader
     */
    setFragmentSource(fragmentSource, fragmentHeader) {
        let argumentsSource = fragmentSource.split(')')[0].split('(')[1].split(','); // "float* A", "float* B", "float C", "float4* D"

        for(let n = 0, f = argumentsSource.length; n < f; n++) {
            if(argumentsSource[n].match(/\*/gm) !== null) {
                let argName = argumentsSource[n].split('*')[1].trim();
                WebCLGLUtils.checkArgNameInitialization(this.in_fragment_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_fragment_values[argName].type = 'float4_fromSampler';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_fragment_values[argName].type = 'float_fromSampler';
            } else if(argumentsSource[n] !== "") {
                let argName = argumentsSource[n].split(' ')[1].trim();
                for(let key in this.in_fragment_values) {
                    if(key.replace(/\[\d.*/, "") === argName) {
                        argName = key; // for normal uniform arrays
                        break;
                    }
                }

                WebCLGLUtils.checkArgNameInitialization(this.in_fragment_values, argName);

                if(argumentsSource[n].match(/float4/gm) != null)
                    this.in_fragment_values[argName].type = 'float4';
                else if(argumentsSource[n].match(/float/gm) != null)
                    this.in_fragment_values[argName].type = 'float';
                else if(argumentsSource[n].match(/mat4/gm) != null)
                    this.in_fragment_values[argName].type = 'mat4';
            }
        }

        // parse header
        this._fragmentHead = (fragmentHeader !== undefined && fragmentHeader !== null) ? fragmentHeader : '';
        this._fragmentHead = this._fragmentHead.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        this._fragmentHead = WebCLGLUtils.parseSource(this._fragmentHead, this.in_fragment_values, (this._gl instanceof WebGL2RenderingContext));

        // parse source
        this._fragmentSource = fragmentSource.replace(/\r\n/gi, '').replace(/\r/gi, '').replace(/\n/gi, '');
        this._fragmentSource = this._fragmentSource.replace(/^\w* \w*\([\w\s\*,]*\) {/gi, '').replace(/}(\s|\t)*$/gi, '');
        this._fragmentSource = WebCLGLUtils.parseSource(this._fragmentSource, this.in_fragment_values, (this._gl instanceof WebGL2RenderingContext));

        for(let key in this.in_fragment_values) {
            let expectedMode = {'float4_fromSampler': "SAMPLER",
                'float_fromSampler': "SAMPLER",
                'float': "UNIFORM",
                'float4': "UNIFORM",
                'mat4': "UNIFORM"}[this.in_fragment_values[key].type];

            this.in_fragment_values[key].varname = key.replace(/\[\d.*/, "");
            this.in_fragment_values[key].varnameC = key;
            this.in_fragment_values[key].expectedMode = expectedMode;
        }

        this._fragmentP_ready = true;
        if(this._vertexP_ready === true) {
            let ts = this.compileVertexFragmentSource();

            if(this.viewSource === true)
                console.log('%c VFP: ', 'font-size: 20px; color: green'),
                console.log('%c WEBCLGL --------------------------------', 'color: gray'),
                console.log('%c '+fragmentHeader+fragmentSource, 'color: gray'),
                console.log('%c TRANSLATED WEBGL ------------------------------', 'color: darkgray'),
                console.log('%c '+ts, 'color: darkgray');
        }
    };

}
global.WebCLGLVertexFragmentProgram = WebCLGLVertexFragmentProgram;
module.exports.WebCLGLVertexFragmentProgram = WebCLGLVertexFragmentProgram;