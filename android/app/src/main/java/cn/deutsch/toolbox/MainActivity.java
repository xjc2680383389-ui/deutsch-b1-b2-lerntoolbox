package cn.deutsch.toolbox;

import android.app.Activity;
import android.app.AlertDialog;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.webkit.WebViewAssetLoader;
import java.io.ByteArrayInputStream;

public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private WebView web;

    private static boolean isLocal(Uri uri) {
        return "https".equals(uri.getScheme()) && HOST.equals(uri.getHost())
            && uri.getPort() == -1 && uri.getPath() != null && uri.getPath().startsWith("/assets/");
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        FrameLayout safeContent = new FrameLayout(this);
        safeContent.setId(R.id.safe_content);
        safeContent.setBackgroundColor(Color.rgb(247, 248, 245));
        web = new WebView(this);
        web.setId(R.id.study_webview);
        web.setBackgroundColor(Color.rgb(247, 248, 245));
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (isLocal(request.getUrl())) {
                    WebResourceResponse response = loader.shouldInterceptRequest(request.getUrl());
                    if (response != null) return response;
                }
                return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found",
                    java.util.Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !isLocal(request.getUrl());
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
                new AlertDialog.Builder(MainActivity.this).setMessage(message)
                    .setPositiveButton("确定", (dialog, which) -> result.confirm())
                    .setNegativeButton("取消", (dialog, which) -> result.cancel())
                    .setOnCancelListener(dialog -> result.cancel()).show();
                return true;
            }
        });
        // Padding belongs to the container: WebView padding does not reliably constrain
        // its scrolling HTML viewport. Forward zero insets so keyboard close also resets it.
        final int handled = WindowInsetsCompat.Type.systemBars()
            | WindowInsetsCompat.Type.displayCutout() | WindowInsetsCompat.Type.ime();
        ViewCompat.setOnApplyWindowInsetsListener(safeContent, (view, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars()
                | WindowInsetsCompat.Type.displayCutout());
            Insets keyboard = insets.getInsets(WindowInsetsCompat.Type.ime());
            view.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, keyboard.bottom));
            return new WindowInsetsCompat.Builder(insets).setInsets(handled, Insets.NONE).build();
        });
        safeContent.addView(web, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(safeContent);
        WindowCompat.getInsetsController(getWindow(), safeContent).setAppearanceLightStatusBars(true);
        WindowCompat.getInsetsController(getWindow(), safeContent).setAppearanceLightNavigationBars(true);
        ViewCompat.requestApplyInsets(safeContent);
        web.loadUrl("https://" + HOST + "/assets/www/index.html");
    }

    @Override public void onBackPressed() {
        if (web == null) { super.onBackPressed(); return; }
        web.evaluateJavascript("(() => { const dialog = document.querySelector('dialog[open]');"
            + "if (dialog) { dialog.close(); return true; } return false; })()", closed -> {
                if ("true".equals(closed)) return;
                if (web.canGoBack()) web.goBack();
                else MainActivity.super.onBackPressed();
            });
    }
    @Override protected void onPause() { web.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
    @Override protected void onDestroy() { if (web != null) web.destroy(); super.onDestroy(); }
}
