import UIKit
import Capacitor

/**
 * FV-573: app-local plugin registration.
 *
 * Capacitor's auto-registration reads ONLY the generated
 * capacitor.config.json `packageClassList`, which the CLI rebuilds from
 * detected npm plugin packages on every sync/copy — a user-supplied
 * `packageClassList` in capacitor.config.ts is overwritten (verified
 * empirically against Capacitor CLI 7.4.x output). App-local plugins that
 * are not npm packages therefore register here, via the documented
 * CAPBridgeViewController subclass hook. Main.storyboard's view controller
 * class points at this subclass (customModule "App").
 *
 * Adding a plugin here is a privacy-reviewed act — the same allowlist
 * discipline as capacitor.config.ts's plugin list applies.
 */
class FVBridgeViewController: CAPBridgeViewController {

    override open func capacitorDidLoad() {
        // Deployment target is iOS 15.0 (StoreKit 2 floor), so the
        // availability guard is belt-and-suspenders for the annotated class.
        if #available(iOS 15.0, *) {
            bridge?.registerPluginInstance(FVAppleIAPPlugin())
        }
    }
}
