import { currentFile } from "./currentFile.js";
import { nodeToSvelte } from "./nodeToSvelte.js";
import { transpiledFolder } from "./symbols.js";
import {writeFileSync} from 'fs'

export const emitList = [];
let compcount = 0;

export const transpileComponent = (node, code, jsxImports, i) => {
  const beforeInline = currentFile.inline;
  currentFile.inline=false;
  //const i = compcount++;
  const svelteCode = nodeToSvelte(node, code, jsxImports);

  const filename = transpiledFolder.current + "Q" + i + "_Q_Q_.svelte";


    if (transpiledFolder.default){
    emitList.push({
      filename,
      type: "asset",
      source: svelteCode.code,
      codeSource: currentFile.current
    });
    }else{
      writeFileSync(
        filename,
        svelteCode.code,
        {encoding:"utf-8"}
      )
    }
  if (filename === "virtuxal:Q80_Q_Q_.svelte") {
    console.log("----------------" + filename + "----------"+currentFile.current+"---------")
    console.log(svelteCode.code)
    console.log("-----------------------------------")
  }
  currentFile.inline = beforeInline;
  return {
    filename,
    props: svelteCode.props,
    exports: svelteCode.exports,
    assignments: svelteCode.assignments
  };
};
