# 3D Face Viewer

A Svelte-based 3D face model viewer that allows you to view and interact with 3D face models in your browser. Built with Three.js and Vite.

![Screenshot of the application](public/screenshot.png)

## Features

- Interactive 3D face model viewing
- Smooth animations and transitions
- Built with modern web technologies (Svelte, Three.js, Vite)
- Responsive design that works on desktop and mobile

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm (v7 or later) or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/danBot.git
   cd danBot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

To start the development server:

```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

- `src/` - Source files
  - `lib/` - Reusable components
    - `FaceViewer.svelte` - 3D face viewer component
    - `QA.svelte` - Question/Answer component
    - `Counter.svelte` - Example counter component
  - `App.svelte` - Main application component
  - `main.js` - Application entry point
- `public/` - Static assets (place your 3D models and screenshots here)

## Adding 3D Models

To add new 3D face models:

1. Place your `.glb` or `.gltf` files in the `public/` directory
2. Update the `FaceViewer.svelte` component to reference your new models

## Technologies Used

- [Svelte](https://svelte.dev/) - Frontend framework
- [Three.js](https://threejs.org/) - 3D library
- [Vite](https://vitejs.dev/) - Build tool and dev server
- [GLTF Transform](https://github.com/donmccurdy/glTF-Transform) - For working with 3D models

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Should you later need the extended capabilities and extensibility provided by SvelteKit, the template has been structured similarly to SvelteKit so that it is easy to migrate.

**Why include `.vscode/extensions.json`?**

Other templates indirectly recommend extensions via the README, but this file allows VS Code to prompt the user to install the recommended extension upon opening the project.

**Why enable `checkJs` in the JS template?**

It is likely that most cases of changing variable types in runtime are likely to be accidental, rather than deliberate. This provides advanced typechecking out of the box. Should you like to take advantage of the dynamically-typed nature of JavaScript, it is trivial to change the configuration.

**Why is HMR not preserving my local component state?**

HMR state preservation comes with a number of gotchas! It has been disabled by default in both `svelte-hmr` and `@sveltejs/vite-plugin-svelte` due to its often surprising behavior. You can read the details [here](https://github.com/sveltejs/svelte-hmr/tree/master/packages/svelte-hmr#preservation-of-local-state).

If you have state that's important to retain within a component, consider creating an external store which would not be replaced by HMR.

```js
// store.js
// An extremely simple external store
import { writable } from 'svelte/store'
export default writable(0)
```
