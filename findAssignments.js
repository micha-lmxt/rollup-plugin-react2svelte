import globals from 'acorn-globals';
import { processCode } from "./processCode.js";
import MagicString from "magic-string";
import { $Interop, $React, transpiledFolder } from "./symbols.js";
import { hasKeywords, replaceKeywords } from './replaceKeywords.js';
import { currentFile } from './currentFile.js';

/**
 *
 * @param {BaseNode} n
 * @param {MagicString} code
 * @param {string[]} jsxImports
 * @returns {{assignments:Set<string>,imports:string[],text:string,props:string}}
 */
export function findAssignments(n, code, jsxImports,nested=true) {
  const t = code.slice(n.start, n.end);


  let text = t;
  const k = processCode("x=" + t, jsxImports,nested)

 
    //found something, which needed transformation
  text = k.cod.toString().slice(2);

  let gl = globals("let __unlykeliToHitSomethingeLse=" + text).map(v => v.name);
  
  if (!currentFile.inline && hasKeywords(gl)) {
    const repKW = replaceKeywords(gl, text);
    gl = repKW.list
    text = repKW.text;
  }

  
  code.update(n.start, n.end, text)
  
  gl = gl
    .filter(v => !(v.startsWith("Q_Q_Q_") && k.imports.find(w => w.startsWith("import " + v))) && v !== $Interop && v !== $React)

  const unfound = gl.filter(v => v.startsWith("Q_Q_Q_"))

  if (unfound.length > 0) {
    unfound.forEach(v => {
      k.imports.push(`import ${v} from '${transpiledFolder.current}Q${v.slice(6)}_Q_Q_.svelte';\n`)
    })
    gl = gl.filter(v => !v.startsWith("Q_Q_Q_"))
  }
  return {
    assignments: new Set(gl), imports: k.imports || [], text,
    props: text};
}
