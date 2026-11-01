package cn.deutsch.toolbox;

import android.app.Instrumentation;
import android.content.Context;
import android.os.SystemClock;
import android.webkit.WebView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

// Invoked in two separate instrumentation sessions around adb install -r.
@RunWith(AndroidJUnit4.class)
public class UpgradePersistenceTest {
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

    private void openData() throws Exception {
        waitFor("document.querySelector('#view-home h1') && document.getElementById('launch-screen').hidden");
        js("location.hash='#/data'");
        waitFor("document.getElementById('goal')");
    }

    @Test public void prepareData() throws Exception {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            scenario.onActivity(value -> activity = value);
            assertEquals(3, activity.getPackageManager().getPackageInfo(activity.getPackageName(), 0).versionCode);
            openData();
            js("document.getElementById('goal').value='47';document.getElementById('goal').dispatchEvent(new Event('change'));"
                + "document.getElementById('new-deck-name').value='CI upgrade retained deck';document.getElementById('add-deck').click()");
            waitFor("JSON.parse(localStorage.getItem('dwt.db.v1')).userDecks.some(d=>d.name==='CI upgrade retained deck')");
            String database = js("localStorage.getItem('dwt.db.v1')");
            assertNotEquals("null", database);
            assertTrue(activity.getSharedPreferences("upgrade-check", Context.MODE_PRIVATE)
                .edit().putString("database", database).commit());
        }
    }

    @Test public void verifyData() throws Exception {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            scenario.onActivity(value -> activity = value);
            assertEquals(4, activity.getPackageManager().getPackageInfo(activity.getPackageName(), 0).versionCode);
            openData();
            String expected = activity.getSharedPreferences("upgrade-check", Context.MODE_PRIVATE)
                .getString("database", null);
            assertNotNull("The original installation's data must remain", expected);
            assertEquals("The complete learning database survives the update", expected,
                js("localStorage.getItem('dwt.db.v1')"));
            assertEquals("\"47\"", js("document.getElementById('goal').value"));
            assertEquals("true", js("JSON.parse(localStorage.getItem('dwt.db.v1')).userDecks.some(d=>d.name==='CI upgrade retained deck')"));
        }
    }
}
