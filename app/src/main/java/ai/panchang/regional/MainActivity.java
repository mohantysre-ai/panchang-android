package ai.panchang.regional;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int LOCATION_PERMISSION_REQUEST_CODE = 1001;

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

    /**
     * When the user grants location permission at the Android OS dialog,
     * notify the JS side so it can immediately re-run GPS detection without
     * requiring an app restart. The first navigator.geolocation.getCurrentPosition()
     * call silently fails while the permission dialog is still showing; this
     * callback is the only reliable way to re-trigger it once the user taps "Allow".
     */
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        boolean locationGranted = false;
        for (int i = 0; i < permissions.length; i++) {
            if ((Manifest.permission.ACCESS_FINE_LOCATION.equals(permissions[i])
                    || Manifest.permission.ACCESS_COARSE_LOCATION.equals(permissions[i]))
                    && grantResults[i] == PackageManager.PERMISSION_GRANTED) {
                locationGranted = true;
                break;
            }
        }

        if (locationGranted && this.bridge != null && this.bridge.getWebView() != null) {
            // Run on UI thread — evaluateJavascript must be called from the main thread.
            final WebView webView = this.bridge.getWebView();
            webView.post(() -> webView.evaluateJavascript(
                "if (typeof window.__onLocationPermissionGranted === 'function') { window.__onLocationPermissionGranted(); }",
                null
            ));
        }
    }
}
