import {
  AndroidConfig,
  withGradleProperties,
  withProjectBuildGradle,
  withSettingsGradle,
  withStringsXml,
  withAndroidManifest,
} from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
import type { PluginSettings } from './types';
import { withMetaQuest } from './metaQuest';
import fs from 'node:fs';
import path from 'node:path';

const withUnity: ConfigPlugin<PluginSettings> = (
  config,
  { name = 'react-native-unity', unityExportDir, quest } = {}
) => {
  if (!unityExportDir) {
    throw new Error(
      'Unity export directory is required. Set `unityExportDir` in the plugin config for react-native-unity.'
    );
  }
  config.name = name;
  config = withXmlnsTools(config);
  if (quest && quest.enabled !== false) {
    config = withMetaQuest(config, quest);
  }
  config = withProjectBuildGradleMod(config);
  config = withSettingsGradleMod(config, { unityExportDir });
  config = withGradlePropertiesMod(config);
  config = withStringsXMLMod(config);
  return config;
};

const REPOSITORIES_END_LINE = `maven { url 'https://www.jitpack.io' }`;

const withProjectBuildGradleMod: ConfigPlugin = (config) =>
  withProjectBuildGradle(config, (modConfig) => {
    const unityLibFlatDir =
      'flatDir { dirs "${project(\':unityLibrary\').projectDir}/libs" }';
    if (
      modConfig.modResults.contents.includes(REPOSITORIES_END_LINE) &&
      !modConfig.modResults.contents.includes(unityLibFlatDir)
    ) {
      // use the last known line in expo's build.gradle file to append the newline after
      modConfig.modResults.contents = modConfig.modResults.contents.replace(
        REPOSITORIES_END_LINE,
        REPOSITORIES_END_LINE + `\n${unityLibFlatDir}\n`
      );
    }
    return modConfig;
  });

const withSettingsGradleMod: ConfigPlugin<{
  unityExportDir: string;
}> = (config, { unityExportDir }) =>
  withSettingsGradle(config, (modConfig) => {
    if (!modConfig.modResults.contents.includes(`include ':unityLibrary'`)) {
      modConfig.modResults.contents += `include ':unityLibrary'\n`;
    }
    const unityLibPath = path.resolve(unityExportDir, 'unityLibrary');
    // 🔥 Regular Expression to find `project(':unityLibrary').projectDir=new File('${unityExportDir}')`
    const unityDirRegex =
      /project\(':unityLibrary'\)\.projectDir\s*=\s*new File\('.*?'\)/;
    if (unityDirRegex.test(modConfig.modResults.contents)) {
      console.log('replacing');
      modConfig.modResults.contents = modConfig.modResults.contents.replace(
        unityDirRegex,
        `project(':unityLibrary').projectDir=new File('${unityLibPath}')`
      );
    } else {
      modConfig.modResults.contents += `project(':unityLibrary').projectDir=new File('${unityLibPath}')`;
    }

    const subprojectDeps = readUnitySubprojectDependencies(unityLibPath);
    if (subprojectDeps.length > 0) {
      for (const subDep of subprojectDeps) {
        if (!modConfig.modResults.contents.includes(subDep)) {
          modConfig.modResults.contents += `\ninclude '${subDep}'`;
        }
      }
    }

    return modConfig;
  });

const withGradlePropertiesMod: ConfigPlugin = (config) =>
  withGradleProperties(config, (modConfig) => {
    modConfig.modResults.push({
      type: 'property',
      key: 'unityStreamingAssets',
      value: '.unity3d',
    });
    return modConfig;
  });

// add string
const withStringsXMLMod: ConfigPlugin = (config) =>
  withStringsXml(config, (config) => {
    config.modResults = AndroidConfig.Strings.setStringItem(
      [
        {
          _: 'Game View',
          $: {
            name: 'game_view_content_description',
          },
        },
      ],
      config.modResults
    );
    return config;
  });

const withXmlnsTools: ConfigPlugin = (config) =>
  withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    if (androidManifest && androidManifest.manifest) {
      const manifestTag = androidManifest.manifest.$;

      // console.log(androidManifest);
      // Add the xmlns:tools attribute if it doesn't exist
      if (!manifestTag['xmlns:tools']) {
        manifestTag['xmlns:tools'] = 'http://schemas.android.com/tools';
      }
    }

    return config;
  });

/**
 * Reads and extracts subproject dependencies from :unityLibrary's `build.gradle` file.
 */
const readUnitySubprojectDependencies = (unityLibPath: string) => {
  const buildGradlePath = path.resolve(unityLibPath, 'build.gradle');
  if (!fs.existsSync(buildGradlePath)) {
    throw new Error(`build.gradle not found at: ${buildGradlePath}`);
  }

  const gradleContent = fs.readFileSync(buildGradlePath, 'utf-8');
  // Extracting `:unityLibrary:*` subproject deps
  const extractRegex = /implementation project\(['"]:(unityLibrary.*?)['"]\)/g;
  const subprojectDepMatches = gradleContent.match(extractRegex);
  const subprojectDeps = subprojectDepMatches
    ? subprojectDepMatches.map((match) => match.replace(extractRegex, '$1'))
    : [];

  // console.log(`📜 Found in build.gradle subproject deps: ${subprojectDeps}`);

  return subprojectDeps;
};

export default withUnity;
