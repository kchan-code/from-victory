import AVFoundation
import Capacitor
import Foundation
import WebKit

/// App-local playback of the assembled narration WAV. No music-provider access:
/// the system mixes our narration with whatever the athlete already plays.
/// Contract: apps/web/lib/native/narration.ts. All mutable state is main-queue
/// confined, including bridge calls, audio delegates, and interruption handlers.
@objc(FVNarrationPlugin)
public class FVNarrationPlugin: CAPPlugin, CAPBridgedPlugin, AVAudioPlayerDelegate {
    public let identifier = "FVNarrationPlugin"
    public let jsName = "FVNarration"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "begin", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "append", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "prepare", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "play", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pause", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "dispose", returnType: CAPPluginReturnPromise),
    ]

    private static let maxBytes = 64 * 1024 * 1024
    private static let chunkBytes = 192 * 1024
    private var sessionId: String?
    private var fileURL: URL?
    private var writer: FileHandle?
    private var expectedBytes = 0
    private var receivedBytes = 0
    private var nextIndex = 0
    private var player: AVAudioPlayer?
    private var state = "ready"
    private var failure: String?
    private var ownsAudioSession = false
    private var observers: [NSObjectProtocol] = []

    public override func load() {
        // A force-quit bypasses deinit. Sweep only this plugin's generated
        // filenames in the app's private temp directory on the next launch.
        let temp = FileManager.default.temporaryDirectory
        if let files = try? FileManager.default.contentsOfDirectory(at: temp,
                includingPropertiesForKeys: nil, options: [.skipsHiddenFiles]) {
            for file in files {
                let name = file.deletingPathExtension().lastPathComponent
                let prefix = "fv-narration-"
                guard file.pathExtension == "wav", name.hasPrefix(prefix),
                      UUID(uuidString: String(name.dropFirst(prefix.count))) != nil else { continue }
                try? FileManager.default.removeItem(at: file)
            }
        }
        let center = NotificationCenter.default
        observers.append(center.addObserver(forName: AVAudioSession.interruptionNotification,
                                            object: nil, queue: .main) { [weak self] notification in
            guard let value = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
                  value == AVAudioSession.InterruptionType.began.rawValue else { return }
            self?.pauseForInterruption()
        })
        observers.append(center.addObserver(forName: AVAudioSession.routeChangeNotification,
                                            object: nil, queue: .main) { [weak self] notification in
            guard let value = notification.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
                  value == AVAudioSession.RouteChangeReason.oldDeviceUnavailable.rawValue else { return }
            self?.pauseForInterruption()
        })
        observers.append(center.addObserver(forName: AVAudioSession.mediaServicesWereResetNotification,
                                            object: nil, queue: .main) { [weak self] _ in
            guard let self, self.sessionId != nil else { return }
            self.player?.stop()
            self.player = nil
            self.ownsAudioSession = false
            self.state = "error"
            self.failure = "Audio became unavailable. Start the session again."
        })
    }

    /// A document reload must not leave an orphan narrator behind. Client-side
    /// route changes dispose through the hook instead; do not intercept links.
    public override func shouldOverrideLoad(_ navigationAction: WKNavigationAction) -> NSNumber? {
        if navigationAction.targetFrame?.isMainFrame == true { cleanUp() }
        return nil
    }

    @objc func begin(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let id = call.getString("sessionId"), UUID(uuidString: id) != nil,
                  let size = call.getInt("byteLength"), size >= 44, size <= Self.maxBytes else {
                call.reject("Invalid narration transfer.")
                return
            }
            self.cleanUp()
            // The caller never selects a path. The UUID below is generated
            // natively and the temporary file is excluded from backup.
            let url = FileManager.default.temporaryDirectory
                .appendingPathComponent("fv-narration-\(UUID().uuidString).wav")
            do {
                guard FileManager.default.createFile(atPath: url.path, contents: nil,
                    attributes: [.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication]) else {
                    throw CocoaError(.fileWriteUnknown)
                }
                self.fileURL = url
                self.writer = try FileHandle(forWritingTo: url)
                self.sessionId = id
                self.expectedBytes = size
                call.resolve()
            } catch {
                self.cleanUp()
                call.reject("Could not prepare narration storage.")
            }
        }
    }

    @objc func append(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.matches(call) else { return }
            guard self.player == nil, self.failure == nil, let writer = self.writer,
                  call.getInt("index") == self.nextIndex,
                  let encoded = call.getString("data"), !encoded.isEmpty,
                  encoded.utf8.count <= (Self.chunkBytes / 3) * 4,
                  let bytes = Data(base64Encoded: encoded), !bytes.isEmpty,
                  bytes.count <= Self.chunkBytes,
                  self.receivedBytes + bytes.count <= self.expectedBytes else {
                self.fail("Invalid narration chunk.")
                call.reject("Invalid narration chunk.")
                return
            }
            do {
                try writer.write(contentsOf: bytes)
                self.receivedBytes += bytes.count
                self.nextIndex += 1
                call.resolve()
            } catch {
                self.fail("Could not save narration.")
                call.reject("Could not save narration.")
            }
        }
    }

    @objc func prepare(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.matches(call) else { return }
            if let player = self.player {
                call.resolve(["duration": player.duration])
                return
            }
            guard self.failure == nil, self.receivedBytes == self.expectedBytes,
                  let url = self.fileURL else {
                call.reject("Narration transfer is incomplete.")
                return
            }
            do {
                try self.writer?.close()
                self.writer = nil
                guard try self.isSupportedWav(url) else { throw CocoaError(.fileReadCorruptFile) }
                let player = try AVAudioPlayer(contentsOf: url)
                guard player.duration.isFinite, player.duration > 0 else {
                    throw CocoaError(.fileReadCorruptFile)
                }
                player.delegate = self
                self.player = player
                self.state = "ready"
                // Do not call prepareToPlay: it can activate the hardware before
                // the athlete taps Play. Session activation belongs only in play.
                call.resolve(["duration": player.duration])
            } catch {
                self.fail("Could not prepare narration audio.")
                call.reject("Could not prepare narration audio.")
            }
        }
    }

    @objc func play(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.matches(call) else { return }
            guard self.state != "ended" else { call.resolve(); return }
            guard self.failure == nil, let player = self.player else {
                call.reject("Narration is not ready.")
                return
            }
            do {
                let session = AVAudioSession.sharedInstance()
                try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
                try session.setActive(true)
                self.ownsAudioSession = true
                guard player.play() else { throw CocoaError(.fileReadUnknown) }
                self.state = "playing"
                call.resolve()
            } catch {
                self.player?.pause()
                self.state = "paused"
                self.deactivateAudioSession()
                call.reject("Narration could not start. Tap Play to try again.")
            }
        }
    }

    @objc func pause(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.matches(call) else { return }
            self.pauseForInterruption()
            call.resolve()
        }
    }

    @objc func getStatus(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.matches(call) else { return }
            let duration = self.player?.duration ?? 0
            let position = self.state == "ended" ? duration : (self.player?.currentTime ?? 0)
            var result: [String: Any] = ["position": position, "duration": duration, "state": self.state]
            if let failure = self.failure { result["error"] = failure }
            call.resolve(result)
        }
    }

    @objc func dispose(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            // Cleanup from an old React effect must never stop a newer session.
            if let id = call.getString("sessionId"), id == self.sessionId { self.cleanUp() }
            call.resolve()
        }
    }

    public func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        DispatchQueue.main.async {
            guard player === self.player else { return }
            self.state = flag ? "ended" : "error"
            if !flag { self.failure = "Narration playback failed." }
            self.deactivateAudioSession()
        }
    }

    public func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        DispatchQueue.main.async {
            guard player === self.player else { return }
            self.fail("Narration playback failed.")
        }
    }

    private func matches(_ call: CAPPluginCall) -> Bool {
        guard let id = call.getString("sessionId"), id == sessionId else {
            call.reject("Narration session is no longer active.")
            return false
        }
        return true
    }

    private func pauseForInterruption() {
        guard state == "playing" else { return }
        player?.pause()
        state = "paused"
        // Never auto-resume after calls or unplugging headphones. The athlete
        // resumes explicitly, preserving their control and the music app's.
        deactivateAudioSession()
    }

    private func deactivateAudioSession() {
        guard ownsAudioSession else { return }
        try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
        ownsAudioSession = false
    }

    private func fail(_ message: String) {
        player?.stop()
        player = nil
        try? writer?.close()
        writer = nil
        if let url = fileURL { try? FileManager.default.removeItem(at: url) }
        fileURL = nil
        failure = message
        state = "error"
        deactivateAudioSession()
    }

    private func cleanUp() {
        player?.stop()
        player = nil
        try? writer?.close()
        writer = nil
        if let url = fileURL { try? FileManager.default.removeItem(at: url) }
        fileURL = nil
        sessionId = nil
        expectedBytes = 0
        receivedBytes = 0
        nextIndex = 0
        failure = nil
        state = "ready"
        deactivateAudioSession()
    }

    /// Accept only our encoder's canonical PCM16 WAV, not arbitrary media.
    /// Validate the header without mapping the whole (up to 64 MiB) file.
    private func isSupportedWav(_ url: URL) throws -> Bool {
        let reader = try FileHandle(forReadingFrom: url)
        defer { try? reader.close() }
        guard let header = try reader.read(upToCount: 44), header.count == 44 else { return false }
        let b = [UInt8](header)
        func word(_ offset: Int) -> Int { Int(b[offset]) | (Int(b[offset + 1]) << 8) }
        func dword(_ offset: Int) -> Int { word(offset) | (word(offset + 2) << 16) }
        func tag(_ offset: Int, _ text: String) -> Bool { Array(b[offset..<(offset + 4)]) == Array(text.utf8) }
        let channels = word(22)
        let rate = dword(24)
        let blockAlign = channels * 2
        return tag(0, "RIFF") && tag(8, "WAVE") && tag(12, "fmt ") && tag(36, "data")
            && dword(4) == expectedBytes - 8 && dword(16) == 16 && word(20) == 1
            && (channels == 1 || channels == 2) && rate >= 8000 && rate <= 96000
            && word(34) == 16 && word(32) == blockAlign && dword(28) == rate * blockAlign
            && dword(40) == expectedBytes - 44 && (expectedBytes - 44) % blockAlign == 0
    }

    deinit {
        observers.forEach { NotificationCenter.default.removeObserver($0) }
        player?.stop()
        try? writer?.close()
        if let url = fileURL { try? FileManager.default.removeItem(at: url) }
        if ownsAudioSession {
            try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
        }
    }
}
