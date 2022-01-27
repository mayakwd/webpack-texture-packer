import * as fs from "fs";
import * as path from "path";
import {PackerExporterType, ScaleMethod, WebpackTexturePackerPlugin} from "../src";
import {IAssetsConfiguration} from "../src/plugin/config/IAssetsConfiguration";
import webpack = require("webpack");

jest.setTimeout(30000);

const assetsConfiguration: IAssetsConfiguration = {
  rootDir: path.join(__dirname, "fixtures/simple/assets"),
  items: [
    {
      outDir: "assets/atlases",
      name: "enemies",
      source: "enemies",
      packerOptions: {
        scale: 2,
        scaleMethod: ScaleMethod.NEAREST_NEIGHBOR,
        exporter: PackerExporterType.PIXI,
        removeFileExtension: true,
      },
      overwrite: false,
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
      packerOptions: {
        scale: 0.75,
        scaleMethod: ScaleMethod.BEZIER,
      },
    },
    {
      rootDir: "ui",
      name: "ui",
      outDir: "assets/ui",
      packerOptions: {
        scale: 4,
        scaleMethod: ScaleMethod.NEAREST_NEIGHBOR,
      },
    },
  ],
};
describe("plugin tests", () => {
  it("running", (done) => {
    const webpackOutDir = path.join(__dirname, "temp");
    webpack({
        mode: "production",
        cache: { type: 'filesystem' },
        entry: path.join(__dirname, "fixtures/index.js"),
        output: {
          path: webpackOutDir,
          filename: "index_bundle.js",
        },
        plugins: [new WebpackTexturePackerPlugin(assetsConfiguration)],
      },
      (error?: Error) => {
      expect(error)
          .toBeNull();
        for (const atlas of assetsConfiguration.items) {
          const {name, outDir} = atlas;
          expect(fs.existsSync(path.join(webpackOutDir, outDir!, name + ".png"))).toBeTruthy();
          expect(fs.existsSync(path.join(webpackOutDir, outDir!, name + ".json"))).toBeTruthy();
        }
        done();
      });
  });
});
