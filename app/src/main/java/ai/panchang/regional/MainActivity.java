package ai.panchang.regional;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // WebView settings. NOTE: keep the default layer type (LAYER_TYPE_NONE) —
        // the manifest already enables window-level hardware acceleration, and
        // forcing a hardware layer on the WebView only adds an offscreen
        // full-screen texture that wastes GPU memory and janks scrolling.
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            webView.setLayerType(View.LAYER_TYPE_NONE, null);
            webView.getSettings().setDomStorageEnabled(true);
            webView.getSettings().setGeolocationEnabled(true);
        }

        // Location permission: deliberately NOT requested here. Capacitor's
        // WebChromeClient (BridgeWebChromeClient.onGeolocationPermissionsShowPrompt)
        // launches the runtime permission request at the moment the page's first
        // navigator.geolocation call fires, and grants the WebView origin once the
        // user answers. Requesting the same permission at onCreate as well raced
        // that flow — Android auto-denies a second concurrent permission request —
        // which left every install stuck on the fallback state (KA) and made the
        // first getCurrentPosition fail while this dialog was still up.
    }
}
