import Foundation

/// What an AVAudioPlayer "finished playing" report means for the session.
/// Pure logic with no AVFoundation, so it can be checked off-device:
///   apps/native/ios/App/Tests/NarrationFinishCheck/main.swift
enum NarrationFinish {
    enum Outcome: Equatable {
        /// The reading played through. The session completes.
        case ended
        /// The system stopped the player early. Hold the reading at this spot.
        case paused(at: TimeInterval)
        /// Playback failed.
        case failed
    }

    /// - Parameters:
    ///   - successfully: the delegate's flag.
    ///   - wasPlaying: whether the plugin still believed it was playing.
    ///   - position: the plugin's own playhead when the report arrived, in seconds.
    ///   - duration: the reading's length, in seconds.
    static func classify(successfully: Bool, wasPlaying: Bool,
                         position: TimeInterval, duration: TimeInterval) -> Outcome {
        guard successfully else { return .failed }
        // Only a reading that was playing and had reached its end has finished.
        // Unplugging wired CarPlay mid-reading also arrives here as a finish.
        if wasPlaying, position >= duration - endTolerance { return .ended }
        return .paused(at: min(max(0, position), max(0, duration)))
    }

    /// The plugin's playhead is a clock estimate, so it can trail the true end.
    static let endTolerance: TimeInterval = 2
}
