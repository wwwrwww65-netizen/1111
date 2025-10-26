const { withSettingsGradle, withAppBuildGradle, withGradleProperties, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function gradleSetupPlugin(config) {
  // Ensure JVM args and parallel/daemon in gradle.properties
  config = withGradleProperties(config, (config) => {
    const insert = [
      { type: 'property', key: 'org.gradle.jvmargs', value: '-Xmx4g -XX:MaxMetaspaceSize=1g -Dfile.encoding=UTF-8' },
      { type: 'property', key: 'org.gradle.daemon', value: 'true' },
      { type: 'property', key: 'org.gradle.parallel', value: 'true' },
      { type: 'property', key: 'REACT_NATIVE_NPM_PACKAGE', value: '../node_modules/@react-native/gradle-plugin' },
      { type: 'property', key: 'reactNativeDir', value: '../node_modules/react-native' },
    ];

    const items = config.modResults;
    insert.forEach((p) => {
      const exists = items.find((i) => i.type === 'property' && i.key === p.key);
      if (!exists) items.push(p);
    });

    return config;
  });

  // Add/fix includeBuild entries specifically in android/settings.gradle
  config = withSettingsGradle(config, (config) => {
    if (typeof config.modResults.contents !== 'string') return config;
    const rnNeedle = 'includeBuild("../node_modules/@react-native/gradle-plugin")';
    let contents = config.modResults.contents;
    // Hard-replace pluginManagement block to avoid dynamic Node-based resolution that can produce null paths on EAS
    contents = contents.replace(/pluginManagement\s*\{[\s\S]*?\n\}/, (
      'pluginManagement {\n' +
      '  includeBuild("../node_modules/@react-native/gradle-plugin")\n' +
      '  includeBuild(new File(rootDir, "../node_modules/expo-modules-autolinking/android/expo-gradle-plugin").absolutePath)\n' +
      '}'
    ));
    // Guard include of reactNativeGradlePlugin in pluginManagement to avoid null path
    contents = contents.replace(
      /includeBuild\(\s*reactNativeGradlePlugin\s*\)/g,
      'if (reactNativeGradlePlugin != null) { includeBuild(reactNativeGradlePlugin) } else { includeBuild("../node_modules/@react-native/gradle-plugin") }'
    );
    // Guard include of expoAutolinking.reactNativeGradlePlugin to avoid 'null' path
    contents = contents.replace(
      /includeBuild\(expoAutolinking\.reactNativeGradlePlugin\)/g,
      'if (expoAutolinking.reactNativeGradlePlugin != null) { includeBuild(expoAutolinking.reactNativeGradlePlugin) }'
    );
    // Ensure fallback RN gradle plugin include exists
    if (!contents.includes(rnNeedle)) {
      contents += `\n${rnNeedle}\n`;
    }
    config.modResults.contents = contents;
    return config;
  });

  // Ensure correct Android Gradle Plugin version compatibility (optional no-op)
  config = withAppBuildGradle(config, (config) => config);

  // Tweak Gradle wrapper to prefer smaller distribution and higher network timeout
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      try {
        const wrapperPath = path.join(config.modRequest.projectRoot, 'android', 'gradle', 'wrapper', 'gradle-wrapper.properties');
        if (fs.existsSync(wrapperPath)) {
          let contents = fs.readFileSync(wrapperPath, 'utf8');
          // Prefer bin over all to reduce download size
          contents = contents.replace(/gradle-(\d+\.\d+(?:\.\d+)?)-all\.zip/g, 'gradle-$1-bin.zip');
          // Prefer primary Gradle downloads host for broad compatibility
          contents = contents.replace(/https\\?:\/\/services\.gradle\.org\/distributions\//g, 'https://downloads.gradle.org/distributions/');
          contents = contents.replace(/https:\/\/services\.gradle\.org\/distributions\//g, 'https://downloads.gradle.org/distributions/');
          contents = contents.replace(/https:\\:\/\/services\.gradle\.org\\\/distributions\\\//g, 'https://downloads.gradle.org/distributions/');
          // Also normalize any CDN host back to primary
          contents = contents.replace(/https:\/\/downloads\.gradle-dn\.com\/distributions\//g, 'https://downloads.gradle.org/distributions/');
          // Ensure network timeout is generous
          if (/^networkTimeout=\d+/m.test(contents)) {
            contents = contents.replace(/^networkTimeout=\d+/m, 'networkTimeout=600000');
          } else {
            contents += '\nnetworkTimeout=600000\n';
          }
          // Ensure validation is enabled
          if (!/^validateDistributionUrl=true/m.test(contents)) {
            contents += 'validateDistributionUrl=true\n';
          }
          fs.writeFileSync(wrapperPath, contents);
        }
      } catch (e) {
        // Best-effort; don't fail build due to wrapper edits
      }
      return config;
    },
  ]);

  return config;
};
