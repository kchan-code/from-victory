import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    // FV-589: scene-lifecycle adoption (required for iOS 27 launch).
    // App-level foreground/background callbacks and the open-URL /
    // continue-userActivity handlers that used to live here are dead code
    // once UIApplicationSceneManifest is present in Info.plist — UIKit
    // routes lifecycle and URL/activity delivery to SceneDelegate instead.
    // See App/SceneDelegate.swift.
    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

}
