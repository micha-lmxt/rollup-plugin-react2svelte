# rollup-plugin-react2svelte

Use parts or whole react projects in [svelte](https://svelte.dev).

## Requirements

In the following I assume, that you use vite to set up your projects. Pure rollup projects might work as well, but I did not test, yet.

## Installation

Install the plugin and a necessary dependency to `react-svelte-interop`:

```bash
npm i -D rollup-plugin-react2svelte react-svelte-interop
```

then update your vite.config.ts in root folder like this:

```js
import { defineConfig } from 'vite'

import {svelte} from '@sveltejs/vite-plugin-svelte'
import react2svelte from 'rollup-plugin-react2svelte';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(),react2svelte()],
  resolve:{
    alias:{
      "react":"react-svelte-interop",
      'react-dom/client':"react-svelte-interop/dom",
      'react-dom':"react-svelte-interop/dom"
    }
  }
})
```

If you use sveltekit, keep the sveltekit plugin instead of the svelte plugin. 




