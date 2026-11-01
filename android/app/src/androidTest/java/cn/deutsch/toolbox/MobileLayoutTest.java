package cn.deutsch.toolbox;

import android.app.Instrumentation;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.os.SystemClock;
import android.view.View;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowCompat;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.File;
import java.io.FileOutputStream;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class MobileLayoutTest {
    private final Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();
    private MainActivity activity;

    private String js(String script) throws Exception {
        CountDownLatch done = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>();
        instrumentation.runOnMainSync(() -> ((WebView) activity.findViewById(R.id.study_webview))
            .evaluateJavascript(script, value -> { result.set(value); done.countDown(); }));
        assertTrue("WebView callback timeout", done.await(10, TimeUnit.SECONDS));
        return result.get();
    }
    private void waitFor(String expression) throws Exception {
        long end = SystemClock.uptimeMillis() + 15000;
        while (SystemClock.uptimeMillis() < end) {
            if ("true".equals(js("Boolean(" + expression + ")"))) return;
            SystemClock.sleep(80);
        }
        fail("Condition not met: " + expression);
    }
    private void safeBounds() {
        instrumentation.runOnMainSync(() -> {
            View root = activity.findViewById(R.id.safe_content);
            WebView web = activity.findViewById(R.id.study_webview);
            WindowInsetsCompat windowInsets = ViewCompat.getRootWindowInsets(root);
            assertNotNull(windowInsets);
            Insets bars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            int[] rootLocation = new int[2], webLocation = new int[2];
            root.getLocationOnScreen(rootLocation); web.getLocationOnScreen(webLocation);
            assertTrue("status bar is visible in this fixture", bars.top > 0);
            assertTrue("HTML viewport starts below status bar", webLocation[1] >= rootLocation[1] + bars.top);
            assertTrue("HTML viewport ends above navigation bar", webLocation[1] + web.getHeight() <= rootLocation[1] + root.getHeight() - bars.bottom);
            assertTrue("dark status icons on light background", WindowCompat.getInsetsController(activity.getWindow(),root).isAppearanceLightStatusBars());
        });
    }
    private void screenshot(String name) throws Exception {
        // JS callbacks confirm DOM state; the compositor can still show the prior frame.
        CountDownLatch painted = new CountDownLatch(1);
        instrumentation.runOnMainSync(() -> ((WebView)activity.findViewById(R.id.study_webview))
            .postVisualStateCallback(SystemClock.uptimeMillis(), new WebView.VisualStateCallback() {
                @Override public void onComplete(long requestId) { painted.countDown(); }
            }));
        assertTrue("WebView visual state timeout", painted.await(10,TimeUnit.SECONDS));
        instrumentation.waitForIdleSync();
        SystemClock.sleep(400);
        Bitmap bitmap = instrumentation.getUiAutomation().takeScreenshot();
        assertNotNull(bitmap);
        File file = new File(activity.getExternalFilesDir(null), name + ".png");
        try (FileOutputStream output = new FileOutputStream(file)) { bitmap.compress(Bitmap.CompressFormat.PNG,100,output); }
        bitmap.recycle();
    }
    private void launcherIcon() throws Exception {
        Bitmap icon = Bitmap.createBitmap(300,300,Bitmap.Config.ARGB_8888);
        instrumentation.runOnMainSync(() -> {
            Drawable drawable = activity.getApplicationInfo().loadIcon(activity.getPackageManager());
            drawable.setBounds(0,0,300,300);
            drawable.draw(new Canvas(icon));
        });
        try (FileOutputStream output = new FileOutputStream(new File(activity.getExternalFilesDir(null), "qa-launcher-icon.png"))) {
            icon.compress(Bitmap.CompressFormat.PNG,100,output);
        }
        icon.recycle();
    }
    @Test public void safeAreaSpacingAndThemedSelect() throws Exception {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            scenario.onActivity(value -> activity = value);
            waitFor("document.querySelector('#view-home h1') && document.getElementById('launch-screen').hidden");
            JSONObject header = new JSONObject(js("(() => { const brand=document.querySelector('.topbar .brand'); const nav=document.querySelector('.nav').getBoundingClientRect(); return {brandHidden:getComputedStyle(brand).display==='none', navTop:nav.top}; })()"));
            assertTrue("mobile header hides app name and icon", header.getBoolean("brandHidden"));
            assertTrue("navigation is first below the native safe area", header.getDouble("navTop") >= 0 && header.getDouble("navTop") <= 20);
            safeBounds(); screenshot("qa-home"); launcherIcon();
            js("location.hash='#/listening'");
            waitFor("document.querySelector('#view-listening.active h1')");
            safeBounds(); screenshot("qa-listening");
            js("location.href='splash.html'");
            waitFor("document.querySelector('.splash-page .launch-icon')?.complete");
            safeBounds(); screenshot("qa-splash");
            js("location.href='index.html'");
            waitFor("document.querySelector('#view-home h1') && document.getElementById('launch-screen').hidden");
            js("location.hash='#/data'");
            waitFor("document.querySelector('[data-select-for=deck-picker]')");
            JSONObject spacing = new JSONObject(js("(() => { const create=document.getElementById('add-deck').getBoundingClientRect(); const manage=document.querySelector('.deck-manage').getBoundingClientRect(); return {gap:manage.top-create.bottom, overflow:document.documentElement.scrollWidth>innerWidth}; })()"));
            assertTrue("creation and management are spaced", spacing.getDouble("gap") >= 20);
            assertFalse("no horizontal page overflow", spacing.getBoolean("overflow"));
            js("document.getElementById('new-deck-name').value='移动测试卡组';document.getElementById('add-deck').click()");
            waitFor("document.querySelector('[data-select-for=new-deck-level]')");
            js("document.querySelector('.deck-create').scrollIntoView({block:'center'})");
            screenshot("qa-data");
            js("document.querySelector('[data-select-for=new-deck-level]').click()");
            waitFor("document.querySelector('dialog[open] .select-option')");
            screenshot("qa-select");
            js("document.querySelector('dialog [data-choice=\"1\"]').click()");
            waitFor("document.getElementById('new-deck-level').value==='B2' && !document.querySelector('dialog[open]')");
            js("location.hash='#/cards'");
            waitFor("document.querySelector('[data-select-for=deck-select]')");
            safeBounds();
            // Rapid async navigation must finish on the most recent route.
            js("location.hash='#/grammar';setTimeout(()=>location.hash='#/stats',0)");
            waitFor("document.querySelector('#view-stats.active h1')");
            assertEquals("0",js("document.querySelectorAll('#view-grammar.active').length"));
            safeBounds();
        }
    }
}
