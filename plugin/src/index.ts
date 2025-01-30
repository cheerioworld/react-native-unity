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

const withUnity: ConfigPlugin<PluginSettings> = (
  config,
  { name = 'react-native-unity', unityExportDir, quest } = {}
) => {
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
    if (modConfig.modResults.contents.includes(REPOSITORIES_END_LINE)) {
      // use the last known line in expo's build.gradle file to append the newline after
      modConfig.modResults.contents = modConfig.modResults.contents.replace(
        REPOSITORIES_END_LINE,
        REPOSITORIES_END_LINE +
        '\nflatDir { dirs "${project(\':unityLibrary\').projectDir}/libs" }\n'
      );
    } else {
      throw new Error(
        'Failed to find the end of repositories in the android/build.gradle file`'
      );
    }
    return modConfig;
  });

const withSettingsGradleMod: ConfigPlugin<{ unityExportDir: PluginSettings['unityExportDir'] }> = (config, { unityExportDir }) =>
  withSettingsGradle(config, (modConfig) => {
    modConfig.modResults.contents += `
include ':unityLibrary'
project(':unityLibrary').projectDir=new File('${unityExportDir}')
    `;
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
      const manifestTag = androidManifest.manifest['$'];

      // console.log(androidManifest);
      // Add the xmlns:tools attribute if it doesn't exist
      if (!manifestTag['xmlns:tools']) {
        manifestTag['xmlns:tools'] = 'http://schemas.android.com/tools';
      }
    }

    return config;
  });

export default withUnity;
