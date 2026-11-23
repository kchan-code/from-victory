import Foundation

// Off-device check for NarrationFinish. The iOS project has no XCTest target
// and CI does not build iOS, so run this by hand on a Mac from the repo root:
//
//   swiftc apps/native/ios/App/App/NarrationFinish.swift \
//     apps/native/ios/App/Tests/NarrationFinishCheck/main.swift \
//     -o /tmp/narration-finish-check && /tmp/narration-finish-check
//
// Exits non-zero and lists each failed case.

var failures = 0

func expect(_ name: String, _ actual: NarrationFinish.Outcome, _ expected: NarrationFinish.Outcome) {
    if actual == expected {
        print("ok    \(name)")
    } else {
        failures += 1
        print("FAIL  \(name): got \(actual), expected \(expected)")
    }
}

let fiveMinutes: TimeInterval = 300

// The bug: unplugging wired CarPlay 40 seconds into a five-minute reading makes
// AVAudioPlayer report a successful finish. That is a pause, not the end.
expect("finish reported mid-reading while playing holds the spot",
       NarrationFinish.classify(successfully: true, wasPlaying: true, position: 40, duration: fiveMinutes),
       .paused(at: 40))

// The route-loss handler can pause first and the finish report can land after.
expect("finish reported after the plugin already paused holds the spot",
       NarrationFinish.classify(successfully: true, wasPlaying: false, position: 40, duration: fiveMinutes),
       .paused(at: 40))

// A paused reading cannot finish on its own, however close to the end it is.
expect("finish reported while paused near the end still holds the spot",
       NarrationFinish.classify(successfully: true, wasPlaying: false, position: 299.5, duration: fiveMinutes),
       .paused(at: 299.5))

expect("finish reported at the end while playing completes the session",
       NarrationFinish.classify(successfully: true, wasPlaying: true, position: fiveMinutes, duration: fiveMinutes),
       .ended)

// The plugin's playhead is a clock estimate, so allow it to trail the true end.
expect("finish reported just short of the end while playing completes the session",
       NarrationFinish.classify(successfully: true, wasPlaying: true, position: 298.7, duration: fiveMinutes),
       .ended)

expect("a held spot is never before the start",
       NarrationFinish.classify(successfully: true, wasPlaying: true, position: -3, duration: fiveMinutes),
       .paused(at: 0))

expect("an unsuccessful finish is still a failure",
       NarrationFinish.classify(successfully: false, wasPlaying: true, position: 40, duration: fiveMinutes),
       .failed)

if failures > 0 {
    print("\(failures) case(s) failed")
    exit(1)
}
print("all cases passed")
