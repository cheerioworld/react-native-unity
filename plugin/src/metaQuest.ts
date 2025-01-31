import {
  // AndroidConfig,
  withGradleProperties,
  // withProjectBuildGradle,
  withSettingsGradle,
  // withStringsXml,
  withAndroidManifest,
} from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
import type { QuestSettings } from './types';


export const withMetaQuest: ConfigPlugin<QuestSettings> = (config, questProps) => {
  config = withQuestAndroidManifestMod(config, questProps);
  config = withQuestGradlePropertiesMod(config);
  return config;
};


const withQuestAndroidManifestMod: ConfigPlugin<
  QuestSettings | undefined
> = (config, props) =>
  withAndroidManifest(config, (config) => {
    if (!props || props.enabled === false) {
      return config;
    }
    const manifest = config.modResults;

    /*** Add tools:replace="android:allowBackup" to <application> to avoid conflicts with unityLibrary ***/
    const application = manifest.manifest.application?.[0];
    if (!application) {
      console.error(
        'Failed to find the application tag in AndroidManifest.xml',
      );
      return config;
    }
    application.$ = application.$ || {};
    application.$['tools:replace'] = 'android:allowBackup,android:icon';
    application.$['tools:remove'] = 'android:networkSecurityConfig';

    /*** Remove <meta-data android:name="com.samsung.android.vr.application.mode" android:value="vr_only" /> to prevent OS from trying to launch in VR ***/
    if (
      !application['meta-data']?.find(
        (meta) =>
          meta.$['android:name'] === 'com.samsung.android.vr.application.mode',
      )
    ) {
      application['meta-data']?.push({
        $: {
          'android:name': 'com.samsung.android.vr.application.mode',
          'tools:node': 'remove',
        },
      });
    }

    /*** Add com.oculus.intent.category.2D to the main activity's intent-filter ***/
    const mainActivity = manifest.manifest.application
      ?.at(0)
      ?.activity?.find(
        (activity) => activity.$['android:name'] === '.MainActivity',
      );
    if (mainActivity) {
      // Add the intent-filter
      mainActivity['intent-filter'] = mainActivity['intent-filter'] || [];
      const existingFilterIndex = mainActivity['intent-filter'].findIndex(
        (filter) =>
          filter.action?.some(
            (action) =>
              action.$['android:name'] === 'android.intent.action.MAIN',
          ),
      );
      if (existingFilterIndex >= 0) {
        // @ts-ignore
        const existing = mainActivity['intent-filter'][
          existingFilterIndex
        ].category?.find(
          (category) =>
            category.$['android:name'] === 'com.oculus.intent.category.2D',
        );
        if (!existing) {
          // @ts-ignore
          mainActivity['intent-filter'][existingFilterIndex].category?.push({
            $: {
              'android:name': 'com.oculus.intent.category.2D',
            },
          });
        }
      }
      //  else {
      //   mainActivity["intent-filter"].push({
      //     category: [
      //       {
      //         $: {
      //           "android:name": "com.oculus.intent.category.2D",
      //         },
      //       },
      //     ],
      //   });
      // }
    }

    /*** Add 2D panel metadata to control dimensions and resizing behavior ***/
    if (props.panel) {
      /* @ts-expect-error tmp */
      const metadatas = mainActivity['meta-data'] || [];
      if (props.panel.freeResizing?.enabled) {
        if (props.panel.freeResizing.lockAspectRatio !== undefined) {
          if (
            !metadatas.find(
              (meta: any) =>
                meta.$['android:name'] ===
                'com.oculus.vrshell.free_resizing_lock_aspect_ratio',
            )
          ) {
            metadatas.push({
              $: {
                'android:name':
                  'com.oculus.vrshell.free_resizing_lock_aspect_ratio',
                'android:value': `${props.panel.freeResizing.lockAspectRatio}`,
              },
            });
          }
        }
        if (props.panel.freeResizing.limits !== undefined) {
          if (
            !metadatas.find(
              (meta: any) =>
                meta.$['android:name'] ===
                'com.oculus.vrshell.free_resizing_limits',
            )
          ) {
            const { minWidth, maxWidth, minHeight, maxHeight } =
              props.panel.freeResizing.limits;
            metadatas.push({
              $: {
                'android:name': 'com.oculus.vrshell.free_resizing_limits',
                'android:value': `${minWidth},${maxWidth},${minHeight},${maxHeight}`,
              },
            });
          }
        }
      }
      /* @ts-ignore */
      mainActivity['meta-data'] = metadatas;
      // end of adding metadata tags

      /** TODO: this isn't working because <layout> elements arent supposed to be inside <activity> so it is stripped */
      if (props.panel.layout) {
        const { defaultHeight, defaultWidth } = props.panel.layout;
        /* @ts-ignore */
        const layouts = mainActivity['layout'] || [];
        if (
          !layouts.find(
            (layout: any) =>
              layout.$['android:defaultHeight'] === defaultHeight ||
              layout.$['android:defaultWidth'] === defaultWidth,
          )
        ) {
          layouts.push({
            $: {
              'android:defaultHeight': defaultHeight,
              'android:defaultWidth': defaultWidth,
            },
          });
        }
        /* @ts-ignore */
        mainActivity['layout'] = layouts;
      }
    }

    return config;
  });

const withQuestGradlePropertiesMod: ConfigPlugin = (config) => {
  config = withGradleProperties(config, (config) => {
    config.modResults.push({
      type: 'property',
      key: 'android.minSdkVersion',
      value: '32',
    });
    config.modResults.push({
      type: 'property',
      key: 'android.targetSdkVersion',
      value: '32',
    })
    return config;
  });
  return config;
}