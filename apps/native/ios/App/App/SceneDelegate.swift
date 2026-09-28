import UIKit
import Capacitor
import os

/**
 * FV-589: UIScene-lifecycle adoption.
 *
 * Beginning with iOS 27, apps built against the iOS 27 SDK without scene
 * adoption crash at launch (EXC_BREAKPOINT in
 * __UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption). This
 * delegate is storyboard-preserving: `UIApplicationSceneManifest` in
 * Info.plist points UIKit at `Main` (the same storyboard the pre-scene
 * app used), so UIKit builds `window` and `FVBridgeViewController` for
 * us — no window-construction code here.
 *
 * URL / user-activity delivery is forwarded through Capacitor's public
 * `ApplicationDelegateProxy` (see node_modules/@capacitor/ios/Capacitor/
 * Capacitor/CAPApplicationDelegateProxy.swift), replicating exactly what
 * the removed AppDelegate `application(_:open:)` / `application(_:continue:
 * restorationHandler:)` handlers used to do, so the App plugin's open-URL
 * and universal-link support keeps working under scenes.
 */
class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    private let logger = os.Logger(subsystem: Bundle.main.bundleIdentifier ?? "app", category: "scene")

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = (scene as? UIWindowScene) else { return }
        window = windowScene.windows.first

        // Force the storyboard root VC to load now, so the Capacitor
        // bridge + the App plugin's notification observers exist before
        // we forward any pending open-URL / user-activity below.
        _ = window?.rootViewController?.view

        let rootType: String
        if let rootViewController = window?.rootViewController {
            rootType = String(describing: Swift.type(of: rootViewController))
        } else {
            rootType = "nil"
        }
        logger.info("scene willConnect; root=\(rootType, privacy: .public)")

        for context in connectionOptions.urlContexts {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: context.url, options: [:])
        }
        for activity in connectionOptions.userActivities {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: activity, restorationHandler: { _ in })
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        for context in URLContexts {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: context.url, options: [:])
        }
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        logger.info("sceneDidBecomeActive")
    }

    func sceneWillResignActive(_ scene: UIScene) {
        logger.info("sceneWillResignActive")
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
        logger.info("sceneDidEnterBackground")
    }

    func sceneWillEnterForeground(_ scene: UIScene) {
        logger.info("sceneWillEnterForeground")
    }
}
