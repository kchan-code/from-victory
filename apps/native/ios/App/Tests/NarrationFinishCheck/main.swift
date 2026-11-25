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

func classify(_ successfully: Bool, at position: TimeInterval,
              of duration: TimeInterval = fiveMinutes) -> NarrationFinish.Outcome {
    NarrationFinish.classify(successfully: successfully, position: position, duration: duration)
}

// The bug: unplugging wired CarPlay 40 seconds into a five-minute reading makes
// AVAudioPlayer report a successful finish. That is a pause, not the end.
expect("finish reported mid-reading holds the spot", classify(true, at: 40), .paused(at: 40))

expect("finish reported at the very start holds the spot", classify(true, at: 0), .paused(at: 0))

expect("a held spot is never before the start", classify(true, at: -3), .paused(at: 0))

expect("finish reported just outside the end tolerance holds the spot",
       classify(true, at: 297.9), .paused(at: 297.9))

expect("finish reported at the end completes the session", classify(true, at: fiveMinutes), .ended)

// The plugin's playhead is a clock estimate, so allow it to trail the true end.
expect("finish reported just short of the end completes the session", classify(true, at: 298.7), .ended)

expect("finish reported exactly at the tolerance completes the session", classify(true, at: 298), .ended)

expect("a playhead past the end completes the session", classify(true, at: 301), .ended)

// At a real end, a status poll can mark the stopped player paused a moment
// before the finish report lands. The playhead is at the end either way, so
// the session must still complete. The rule takes no "was playing" input.
expect("a real end completes even if the plugin had already marked it paused",
       classify(true, at: 299.5), .ended)

expect("a reading shorter than the tolerance completes", classify(true, at: 0, of: 1.5), .ended)

expect("an unsuccessful finish is still a failure", classify(false, at: 40), .failed)

expect("an unsuccessful finish at the end is still a failure", classify(false, at: fiveMinutes), .failed)

if failures > 0 {
    print("\(failures) case(s) failed")
    exit(1)
}
print("all cases passed")
