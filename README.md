# Super Splat

![](https://github.com/playcanvas/super-splat/assets/697563/b68bfc02-c651-4488-8ad7-80868decfdee)

The PlayCanvas Super Splat tool is used to edit gaussian splat PLY files.

See https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/ for more information on gaussian splats.

A live version of this tool is available at:
https://playcanvas.com/super-splat

# Loading Scenes

To load a gaussian splat PLY file, drag & drop it onto the application page. Alternatively click the "Choose file" button bottom left.

If you disable the "Load all PLY data" option before loading the file, then the PLY data not required by the editor is excluded (for example the spherical harmonic data). This can save on browser memory.

# Editing Scenes

Once a PLY file is loaded you can use the selection tools to modify splat selection and then delete splats from the scene.

You can also reorient the scene using the SCENE Position/Rotation/Scale controls.

# Saving results

Once you're done editing the scene, click the Export -> "Ply file" button to export the edited splat scene to the local file system.

# Current limitations

This editor is in beta and so currently has a number of limitations:
- Only supports gaussian splat PLY files
- Spherical harmonic data is not rotated on export

# Local Development

The engine's splat rendering code is in a state of flux so we currently reference it by git submodule.

The steps required to clone the repo and run a local development server are as follows:
```
git clone https://github.com/playcanvas/super-splat.git
cd super-splat
git submodule update --init
npm i --prefix submodules/engine
npm run build --prefix submodules/engine
npm i
npm run develop
```

The last command `npm run develop` will build and run a local version of the editor on port 3000. Changes to the source are detected and the editor is automatically rebuilt.

To access the local editor instance, open a browser tab and navigate to `http://localhost:3000`.
