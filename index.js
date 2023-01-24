//var walk = require('estree-walker').walk;
import { processCode } from "./processCode.js";
import { emitList } from "./transpile.js";
import { parse } from "./parse.js";
import { currentFile, setCurrentfile } from "./currentFile.js";
import { transpiledFolder } from "./symbols.js";
import path from 'path';

export let i = 0;

export default function react2svelte(options) {
  if (options && options.outputFolder){
    let fol = path.resolve( options.outputFolder);
    if (!fol.endsWith("/")){
      fol += "/"
    }
    transpiledFolder.current = fol
    transpiledFolder.default=false;
  }
  return {
    name: "react2svelte", // this name will show up in warnings and errors

    resolveId: {
      order: "pre",
      enforce: "pre",
      handler(source) {
        
        if (transpiledFolder.default && source.endsWith("_Q_Q_.svelte")) {
          
          return source; // this signals that rollup should not ask other plugins or check the file system to find this id
        }

        /*if (source.endsWith("Anything.svelte")){
          console.log("found Anything: "+ source)
          return source;
        }*/

        return null; // other ids should be handled as usually
      },
    },
    load: {
      order: "pre",
      enforce: "pre",
      handler(id) {

        if (transpiledFolder.default && id.endsWith("_Q_Q_.svelte")) {
          const item = emitList.find((v) => v.filename.endsWith(id));

          if (!item) {
            return null;
          }
          return item.source; // the source code for "virtual-module"
        }
        /*
        if (id.endsWith("Anything.svelte")){
          console.log(id)
          return AnythingSource;
        }
        */
        return null; // other ids should be handled as usually
      },
    },
    transform: {

      //order: "pre",
      //enforce:"pre",
      handler(code, _id, x, y, z) {

        const id = _id.split("?")[0]

        if (
          (id.endsWith(".jsx") ||
            id.endsWith(".tsx") ||
            id.endsWith(".js") ||
            id.endsWith(".mjs") ||
            id.endsWith(".ts")) && (
            !id.endsWith(".d.ts")
          )
        ) {
          setCurrentfile(id);

          parse.current = this.parse;
          if (_id.includes("AnimatePresence") && _id.includes("index")) {
            console.log(_id)
            console.log(code)
            currentFile.debug = true;
          }
          const { cod, imports, hasTransformation } = processCode(code);

          if (hasTransformation && !currentFile.hasReactNameImport) {
            imports.push("import React from 'react-svelte-interop'")
          }
          const im = Array.from(new Set(imports)).map(v => v.endsWith(";") ? v : (v + ";"));

          im.forEach((v) => cod.prepend(v));

          parse.current = undefined;

          /*
          if (
            id.endsWith(".jsx") 
            //id.includes("classComponent.jsx")
            ){
            console.log("__________________________________"+id)
            console.log(cod.toString())
            console.log("__________________________________")
          }
          */
          // console.log(cod.toString())
          if (currentFile.debug) {
            console.log(cod.toString())
          }
          return {
            code: cod.toString(),
            map: cod.generateMap({ hires: true }),
          };
        }
        if (transpiledFolder.default && id.endsWith("_Q_Q_.svelte")) {
          const item = emitList.find((v) => v.filename.endsWith(id));
          //TODO redirect source map. This is not good:

          const map = this.getCombinedSourcemap()
          map.sources = [item.codeSource]
          return {
            code,
            map
          }
        }
        return null;
      },
    },
  };
}
