const { withProjectBuildGradle, withAppBuildGradle, withGradleProperties, withDangerousMod } = require('expo/config-plugins');
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

  // Add includeBuild to settings.gradle
  config = withProjectBuildGradle(config, (config) => {
    if (typeof config.modResults.contents !== 'string') return config;
    const needle = 'includeBuild("../node_modules/@react-native/gradle-plugin")';
    let contents = config.modResults.contents;
    if (!contents.includes('includeBuild')) {
      contents += `\n${needle}\n`;
      config.modResults.contents = contents;
    }
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
          // Use Gradle CDN mirror to reduce failures on services.gradle.org
          contents = contents.replace(/https\\?:\/\/services\.gradle\.org\/distributions\//g, 'https://downloads.gradle-dn.com/distributions/');
          contents = contents.replace(/https:\/\/services\.gradle\.org\/distributions\//g, 'https://downloads.gradle-dn.com/distributions/');
          contents = contents.replace(/https:\\:\/\/services\.gradle\.org\\\/distributions\\\//g, 'https://downloads.gradle-dn.com/distributions/');
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
