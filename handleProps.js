import { next } from "./propCounter.js";
import { mergeImports } from "./mergeUtils.js";
import { findAssignments } from "./findAssignments.js";
import { skipPropValue } from "./handleCreateElement.js";
import { $refAction, importAnything } from "./symbols.js";

/**
 *
 * @param {MagicString} code
 * @param {string[]} jsxImports
 * @param {any} node
 * @param {string|undefined} prefix
 * @returns
 */
export const handleProps = (code, jsxImports, node, prefix = undefined) => {
  if (!prefix) {
    prefix = "c" + next();
  }
  if ((node.type === "Literal" || node.type === "TemplateLiteral") && node.value === null) {
    return { export: {}, toTag: {}, props: "" };
  }
  if (node.type === "ObjectExpression") {
    return handlePropsObject(code, jsxImports, node, prefix);
  }
  // handle like spread case
  //console.log("other Props: " + currentFile.current);
  const p = { imports: [], export: {}, toTag: {}, props: "" };
  const assign = findAssignments(node, code, jsxImports);
  p.imports.push(
    "import {EventAction, ClassAndStyle} from 'react-svelte-interop'"
  );
  assign.imports.forEach(v => p.imports.push(v));

  const chunk = assign.text;

  p.assignments = new Set([
    ...(assign.assignments || [])
  ]);
  p.props += `...${assign.text},`;
  p.toTag[`{...ClassAndStyle(${chunk})}`] = skipPropValue;
  p.toTag["use:EventAction"] = chunk;
  p.hasSpread = `{...(${chunk})}`;
  p.imports.push(importAnything);

  return p;

};
/**
 *
 * @param {string} string
 * @returns {boolean}
 */
const isUpperCase = (string) => /^[A-Z]$/.test(string);
/**
 *
 * @param {MagicString} code
 * @param {string[]} jsxImports
 * @param {any} node
 * @param {string} prefix
 * @returns {{hasSpread?:string,assignments:Set<string>,imports?:string[],export:{[key:string]:{start:number,end:number}},toTag:{[key:string]:string},props:string}}
 */
const handlePropsObject = (code, jsxImports, node, prefix) => {
  let j = 0;
  return node.properties.reduce(
    (p, v) => {
      if (v.key?.name === "children") {
        //TODO: handle children case

        return p;
      }
      const prop = prefix + "_" + j++;
      if (v.type === "SpreadElement") {

        if (v.argument.type === "ObjectExpression") {
          const nested = handlePropsObject(code, v.argument, prop);
          p.export = { ...p.export, ...nested.export };
          p.toTag = { ...p.toTag, ...nested.toTag };
          p.assignments = new Set([
            ...(p.assignments || []),
            ...(nested.assignments || []),
          ]);
          p.props =
            p.props && nested.props
              ? p.props + "," + nested.props
              : p.props + nested.props;
          p.imports = mergeImports(p, nested);
          p.imports.push(importAnything);

          p.hasSpread = nested.hasSpread;
          return p;
        }

        //pure spread case
        const assign = findAssignments(v.argument, code, jsxImports);
        p.imports.push(
          "import {EventAction, ClassAndStyle} from 'react-svelte-interop'"
        );
        assign.imports.forEach(v => p.imports.push(v));

        const chunk = assign.text;

        p.assignments = new Set([
          ...(assign.assignments || []),
          ...(p.assignments || []),
        ]);
        p.props += `...${assign.text},`;
        p.toTag[`{...ClassAndStyle(${chunk})}`] = skipPropValue;
        p.toTag["use:EventAction"] = chunk;
        p.hasSpread = `{...${chunk}}`;
        p.imports.push(importAnything);
        p.toTag[`use:${$refAction}`] = chunk+".ref";
        p.imports.push(`import {refAction as ${$refAction}} from 'react-svelte-interop'`);
        return p;
      }
      const assign = findAssignments(v.value, code, jsxImports);

      const chunk = assign.text;

      assign.imports.forEach(v => p.imports.push(v));
      p.assignments = new Set([
        ...(assign.assignments || []),
        ...(p.assignments || []),
      ]);
      if (v.key?.name) {
        p.props += `${v.key.name}:${assign.text},`;
      }


      //console.log(p.assignments)
      //
      if (v.key?.name === "className") {
        p.toTag["class"] = chunk;
      } else if (v.key?.name === "style") {
        p.toTag.style = `StyleString(${chunk})`;
        p.imports.push(`import {StyleString} from 'react-svelte-interop'`);
      } else if (v.key?.name?.startsWith("on") &&
        isUpperCase(v.key?.name?.slice(2, 3))) {
        // should probably be more specific than this.
        p.toTag["on:" + v.key.name.slice(2).toLowerCase()] = `(e)=>{e.nativeEvent=e;(${chunk})(e)}`;
      } else if (v.key?.name === "ref") {

        //p.toTag["bind:this"] = `typeof ${chunk}!=='function' && ${chunk}.current`;
        p.toTag[`use:${$refAction}`] = chunk;
        p.imports.push(`import {refAction as ${$refAction}} from 'react-svelte-interop'`);
      } else if (v.key?.name === "dangerouslySetInnerHTML") {
        //todo: handle special case
      } else if (v.key?.name) {
        p.toTag[v.key.name] = chunk;
      } else if (v.key?.value?.includes(":")) {
        const val = v.key.value;
        if (val.startsWith("in:") ||
          val.startsWith("out:") ||
          val.startsWith("transition:") ||
          val.startsWith("animate:") ||
          val.startsWith("use:")) {
          const sp = val.split(":");
          const offset = sp[0].length + 2;
          const action = sp[1].split("|")[0];
          const len = action.length;
          p.export[action] = {
            start: v.key.start + offset,
            end: v.key.start + offset + len,
          };
        }
        p.toTag[v.key.value] = chunk;
        p.props += `'${v.key.value}':${assign.text},`;
      } else {
        p.toTag[v.key.value] = chunk;
        p.props += `'${v.key.value}':${assign.text},`;
      }
      return p;
    },
    { imports: [], export: {}, toTag: {}, props: "" }
  );
};
