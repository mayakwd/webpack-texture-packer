import * as fs from "fs";
import * as path from "path";
import {Stats} from "webpack";
import webpack = require("webpack");
import {PackerExporterType, WebpackTexturePackerPlugin} from "../src";

jest.setTimeout(30000);

describe("plugin tests", () => {
  it("running", (done) => {
    const assetsConfiguration = {
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
    };
    const webpackOutDir = path.join(__dirname, "temp");
    webpack({
        mode: "production",
        entry: path.join(__dirname, "fixtures/index.js"),
        output: {
          path: webpackOutDir,
          filename: "index_bundle.js",
        },
        plugins: [new WebpackTexturePackerPlugin(assetsConfiguration)],
      },
      (error: Error, stats: Stats) => {
        expect(error)
          .toBeNull();
        for (const atlas of assetsConfiguration.items) {
          const {name, outDir} = atlas;
          expect(fs.existsSync(path.join(webpackOutDir, outDir, name + ".png"))).toBeTruthy();
          expect(fs.existsSync(path.join(webpackOutDir, outDir, name + ".json"))).toBeTruthy();
        }
        done();
      });
  });
});
