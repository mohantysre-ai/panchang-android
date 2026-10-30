package ai.panchang.regional;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Optimize WebView settings for smooth scrolling and animations.
        // NOTE: do NOT force LAYER_TYPE_HARDWARE on the WebView — window-level
        // hardware acceleration (manifest) is already on, and the extra
        // offscreen GPU layer only wastes memory and janks scrolling.
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            webView.setLayerType(View.LAYER_TYPE_NONE, null);
            webView.getSettings().setDomStorageEnabled(true);
        }
    }
}
