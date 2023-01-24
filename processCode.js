import { walk } from "estree-walker";
import MagicString from "magic-string";
import { isComponent, isCreateElement } from "./isCreateElement.js";
import { transpileComponent } from "./transpile.js";
import { getId, next } from "./propCounter.js";
import { parse } from "./parse.js";
import { $getProps, $props, $Interop, importInterop, $classHook, importReact, $React, $interopRefresh } from "./symbols.js";
import { currentFile } from "./currentFile.js";
import { handleCreateComponent } from "./handleCreateComponent.js";
import { isReplacedKeyword } from "./replaceKeywords.js";

export const processCode = (code, jsximports = ["jsx", "jsxs", "createElement$"], nested = false) => {
  const canHandle = [/*"ConditionalExpression", "LogicalExpression"/*,"ArrayExpression"*/];
  const jsxImports = jsximports;
  const cod = new MagicString(code);
  if (currentFile.debug) {
    console.log("---------------------------------------------------")
    console.log(code)
    console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++")
  }
  const cd = parse.current(code);
  const imports = [];
  let hasTransformation = false;
  let foundTranspilable = false;

  const process = (node) => {
    hasTransformation = true;

    if (isComponent(node)) {
      const handled = handleCreateComponent(node, cod, jsxImports, nested);
      cod.update(node.start, node.end,
        `new ${$Interop}(${$React},{fc:${handled.name},` +
        `props:${handled.cleanedProps},noSlot:true${nested ? "," + $interopRefresh : ""},displayName:'${handled.name}'},` +
        `(${$props},${$getProps})=>{
        let ${$interopRefresh} = 0;
        return ({type:${$props}.fc,props:{...${$props}.props,children:${handled.props}.props?.children}})
      },
        '${handled.name}')`
      )
      imports.push(importReact);
      if (handled.imports) {
        handled.imports.forEach(v => imports.push(v));
      }

    } else {

      const j = next();

      const { filename, props, exports, assignments } = transpileComponent(
        node,
        cod,
        jsxImports, j
      );
      if (currentFile.debug) {
        console.log("transpile")
        console.log(filename)
        console.log(props)
        console.log(exports)
        console.log(assignments)
      }
      const cleanProps = Object.entries(exports)
        .map((v) => {
          // trick to accept statement
          const k = processCode("x=" + cod.slice(v[1].start, v[1].end), jsxImports);

          if (k.imports.length > 0) {
            k.imports.forEach((w) => imports.push(w));
            return v[0] + ":" + k.cod.toString().slice(2);
          } else {
            return v[0] + ":" + cod.slice(v[1].start, v[1].end);
          }
        })
        .concat(Array.from(assignments || new Set([]))
          .map(v => isReplacedKeyword(v) ? v + ":" + v.slice(2, -2) : v))
        .filter(v => nested || v !== $interopRefresh)
        .join(",");

      /*cod.update(node.start, node.end, "{$sig:'ReactJSX',component:Q_Q_Q_" + (j) +
                  `,$props:{${cleanProps}}, get props(){
                      const _$p$_ = this.$props;
                      return ${props}
                  }}`);
              */
      cod.update(
        node.start,
        node.end,
        `new ${$Interop}(Q_Q_Q_${j},{${cleanProps}},` +
        `(${$props},${$getProps})=>{
          let ${$interopRefresh} = 0;
          const {${[...assignments].filter(v => v !== $interopRefresh).join(",")}}=${$props};return ${props}},` +
        `'${getId()}',${assignments.has($interopRefresh)})`
      );
      imports.push(
        "import Q_Q_Q_" +
        j +
        " from '" +
        filename +
        `';
                `
      );




      //console.log(cod.toString());
    }
    imports.push(importInterop);
  }
  walk(cd, {

    enter(node, parent, prop, index) {

      // Simplify namespace imports, since they don't seem to work well with 'react-svelte-interop', eg.
      // import * as React from 'react'
      // to 
      // import React from 'react'
      if (node.type === "ImportDeclaration" && (
        node.source?.value === "react" || node.source?.value === "react-dom/client"
        || node.source?.value === "react-dom" || node.source?.value === "react-dom/server")) {
        (node.specifiers || []).forEach(v => {
          if (v.type === "ImportNamespaceSpecifier") {
            cod.update(v.start, v.end, " "+v.local?.name);
            //console.log(cod.slice(node.start,node.end),cod.slice(v.start,v.end),v.local)
          }
        })
        //cod.update(node.source.start,node.source.end,'"react-svelte-interop"');
      }

      // save basic imports for some functionalities
      // default from 'react'
      // createElement
      // Fragment
      if (node.type === "ImportDeclaration" &&
        (node.source?.value === "react" || node.source?.value === "react-svelte-interop")) {

        (node.specifiers || []).forEach(v => {
          if (v.type === "ImportSpecifier" && 
          (v.imported?.name === "Component" || v.imported?.name === "PureComponent")&& v.local?.name) {
            currentFile.components.push(v.local?.name)

          } else if ((v.type === "ImportNamespaceSpecifier" || v.type === "ImportDefaultSpecifier" ||
            (v.type === "ImportSpecifier" && v.imported?.name === "default")) && v.local?.name) {

            currentFile.react.push(v.local?.name)

            if (v.local?.name === "React") {
              currentFile.hasReactNameImport = true;
            }
          } else if (v.type === "ImportSpecifier" && v.imported?.name === "createElement" && v.local?.name) {
            currentFile.createElement.push(v.local?.name)
          } else if (v.type === "ImportSpecifier" && v.imported?.name === "Fragment" && v.local?.name) {
            currentFile.Fragment.push(v.local?.name)
          }
        });


      }
      // handle something like 
      // export default class ABC extend Component{...}
      // but also 
      // class XYZ extends React.Component{...}
      // export default XYZ
      if (node.type === "ClassDeclaration" && ((node.superClass?.name &&
        currentFile.components.includes(node.superClass?.name)) ||
        (node.superClass?.type === 'MemberExpression' &&
          node.superClass?.property?.name === "Component" &&
          currentFile.react.includes(node.superClass?.object?.name)))) {
        const prefix = (node.id?.name) ? "const " + node.id.name + " = " : "";
        imports.push(`import {classHook as ${$classHook}} from 'react-svelte-interop';`)
        cod.prependLeft(node.start, prefix + $classHook + "(");
        cod.appendRight(node.end, ")")
        //cod.update(node.start,node.end,$classHook + "("+cod.slice(node.start,node.end)+")")
      }

      // handle something like
      // const X = class Y extends Component {...}
      if (node.type === "ClassExpression" && ((node.superClass?.name &&
        currentFile.components.includes(node.superClass?.name)) ||
        (node.superClass?.type === 'MemberExpression' &&
          node.superClass?.property?.name === "Component" &&
          currentFile.react.includes(node.superClass?.object?.name)))) {

        imports.push(`import {classHook as ${$classHook}} from 'react-svelte-interop';`)
        cod.prependLeft(node.start, $classHook + "(");
        cod.appendRight(node.end, ")")
        //cod.update(node.start,node.end,$classHook + "("+cod.slice(node.start,node.end)+")")
      }

      // newer React import style with jsx import instead of React.createElement
      // jsx does not use additional args as children but puts all children into props.
      // in dev mode, jsx accepts additional arguments for debugging purposes. Do not hanlde as children
      if (node.type === "ImportDeclaration" && (
        node.source?.value === "react/jsx-runtime" ||
        node.source?.value === "react/jsx-dev-runtime" ||
        node.source?.value.endsWith("react-svelte-interop/package/jsx-runtime/index.js") ||
        node.source?.value.endsWith("react-svelte-interop/jsx-runtime/index.js")
      )) {

        (node.specifiers || []).forEach(v => {
          if (v.imported?.name) {
            currentFile.reactJSXImportStyle = true;
            jsxImports.push(v.local?.name)
          }
        });
      }



      if (!isCreateElement(node, jsxImports)) return;

      this.skip();

      if (foundTranspilable) return;

      if (canHandle.includes(parent.type) &&
        !(parent.type === "LogicalExpression" && parent.operator === "||")) {
        foundTranspilable = node;
        return;
      }

      process(node)

    },
    leave: (node) => {
      if (!foundTranspilable) return;

      if (
        node.start <= foundTranspilable.start &&
        node.end >= foundTranspilable.end &&
        (node.end !== foundTranspilable.end || node.start !== foundTranspilable.start) &&
        canHandle.includes(node.type) &&
        !(node.type === "LogicalExpression" && node.operator === "||")
      ) {
        foundTranspilable = node;

      } else {
        const k = foundTranspilable;
        foundTranspilable = false;
        process(k)

      }


    }
  });

  return { cod, imports, hasTransformation };
};

