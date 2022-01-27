# Texture packer plugin for Webpack v5

Plugin that packs your textures into atlases. Viva la GameDev!
 
## Installation

- `npm i webpack-texture-packer --save-dev`
- `yarn add webpack-texture-packer --dev`

## Usage

```js webpack.config.js
const {WebpackTexturePackerPlugin, PackerExporterType} = require('webpack-texture-packer');

module.exports = {
  entry: 'index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'index_bundle.js'
  },
  plugins: [
    new WebpackTexturePackerPlugin({
    rootDir: path.join(__dirname, "fixtures/simple/assets"),
      items: [
        {
          outDir: "assets/atlases",
          name: "enemies",
          source: "enemies",
          packerOptions: {exporter: PackerExporterType.PIXI, removeFileExtension: true},
        },
        {
          name: "environment",
          outDir: "assets/atlases",
          source: [
            {
              path: "environment",
            },
            {
              path: "weapons",
              exclude: "weapon_r*",
              recursive: true,
            },
          ],
        },
        {
          rootDir: "ui",
          name: "ui",
          outDir: "assets/ui",
        },
      ],
    }),
  ],
};
```

This will generate:

 - dist/assets/atlases/enemies.json
 - dist/assets/atlases/enemies.png
 - dist/assets/atlases/environment.json
 - dist/assets/atlases/environment.png
 - dist/assets/ui/ui.json
 - dist/assets/ui/ui.png

## Configuration

### IAssetsConfiguration

| Name          |                      Type                       | Optional | Description                                                                                                                                                                                                                                              |
|:--------------|:-----------------------------------------------:|:--------:|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| outDir        |                     String                      |   true   | Output directory. Will be used to combine result output path.<br/> ***Notice***: path should be defined as relative to webpack output path. If you defined webpack output.path as "dist" and outDir as "assets", final output path will be "dist/assets" |
| rootDir       |                     String                      |   true   | Assets root directory                                                                                                                                                                                                                                    |
| items         |  [IAtlasConfiguration[]](#iatlasconfiguration)  |  false   | Atlas configurations                                                                                                                                                                                                                                     |
| packerOptions | [ITexturePackerOptions](#itexturepackeroptions) |   true   | Global texture packer options                                                                                                                                                                                                                            |


### IAtlasConfiguration

| Name          |                                                                                  Type                                                                                   | Optional | Description                                                                                                                                                                                                                                                                                           |
|:--------------|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------:|:--------:|:------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| name          |                                                                                 String                                                                                  |  false   | Atlas name. Will be used to create atlas scheme and atlas texture.                                                                                                                                                                                                                                    |
| outDir        |                                                                                 String                                                                                  |   true   | Output directory. Will be used as part of output path for atlas.                                                                                                                                                                                                                                      |
| rootDir       |                                                                                 String                                                                                  |   true   | Assets root directory. Will be used to combine rootDir path for atlas assets.                                                                                                                                                                                                                         |
| source        | String<br/>String[]<br/>[IAssetsSourceConfiguration](#iassetssourceconfiguration)<br/>[IAssetsSourceConfiguration](#iassetssourceconfiguration)[] |  true   | Asset source(s).<br/>Defines path(s) where texture packer should search for asset files.<br/>Search will be recursive by default (all assets in the nested folders will added to final atlas), if you want to prevent recursive search see [IAssetsSourceConfiguration](#iassetssourceconfiguration). |
| recursive     |                                                                                 Boolean                                                                                 |   true   | Applies recursive search for every source.<br>**By default**: true                                                                                                                                                                                                                                    |
| packerOptions |                                                             [ITexturePackerOptions](#itexturepackeroptions)                                                             |   true   | Texture packer options                                                                                                                                                                                                                                                                                |
| overwrite     |                                                                                 Boolean                                                                                 |   true   | Value indicates whether overwrite global texture packer options for this atlas or merge its values with global one<br>**By default:** false                                                                                                                                                           |

#### Assets rootDir and source notice
Atlas configuration `rootDir` is relative to main configuration `rootDir`.

**For example**
If you'll define:
 - `rootDir` in main configuration as `assets-source`
 - and `rootDir` for atlas configuration as `enemies` 
 
Then the final rootDir path will be `assets-source/enemies`

#### Output paths parts example
If you'll define:
 - `assetsConfiguration.outDir` as "assets"
 - `outDir` as "gameplay"
 - and `name` as "enemies"

Then the result artifacts names will be
- `assets/gameplay/enemies.png` - for atlas
- `assets/gameplay/enemies.json` - for scheme

### IAssetsSourceConfiguration
TBD

### ITexturePackerOptions
TBD
