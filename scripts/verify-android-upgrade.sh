#!/usr/bin/env bash
set -euo pipefail

# A lower version and the final APK are built from clean outputs using one key.
mkdir -p android-ui-qa
adb install "$RUNNER_TEMP/upgrade-baseline.apk"
adb install android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
adb shell am instrument -w -e class cn.deutsch.toolbox.UpgradePersistenceTest#prepareData \
  cn.deutsch.toolbox.test/androidx.test.runner.AndroidJUnitRunner | tee android-ui-qa/upgrade-before.txt
grep -Fq 'OK (1 test)' android-ui-qa/upgrade-before.txt
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am instrument -w -e class cn.deutsch.toolbox.UpgradePersistenceTest#verifyData \
  cn.deutsch.toolbox.test/androidx.test.runner.AndroidJUnitRunner | tee android-ui-qa/upgrade-after.txt
grep -Fq 'OK (1 test)' android-ui-qa/upgrade-after.txt
