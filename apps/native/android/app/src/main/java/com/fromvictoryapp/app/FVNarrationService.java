package com.fromvictoryapp.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Binder;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.util.Base64;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import java.io.File;
import java.io.IOException;

/** One app-private prepared narration. All state transitions run on the main looper. */
public class FVNarrationService extends Service {
    private static final String CHANNEL = "fv-guided-narration";
    private static final String ACTION_PLAY = "com.fromvictoryapp.app.NARRATION_PLAY";
    private static final String ACTION_PAUSE = "com.fromvictoryapp.app.NARRATION_PAUSE";
    private static final int NOTIFICATION_ID = 4621;
    private final LocalBinder binder = new LocalBinder();
    private NarrationTransfer transfer;
    private MediaPlayer player;
    private AudioManager audioManager;
    private AudioFocusRequest focusRequest;
    private boolean hasFocus;
    private String state = "ready";
    private double duration;
    private double lastPosition;
    private double volume = 1;
    private PluginCall preparing;
    private PluginCall starting;
    private long playRequest;
    private final AudioAttributes attributes = new AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build();
    private AudioManager.OnAudioFocusChangeListener focusListener;
    private long focusGeneration;
    private final BroadcastReceiver noisy = new BroadcastReceiver() {
        @Override public void onReceive(Context context, Intent intent) { pausePlayback(); }
    };
    public final class LocalBinder extends Binder { FVNarrationService getService() { return FVNarrationService.this; } }
    @Override public IBinder onBind(Intent intent) { return binder; }
    @Override public void onCreate() {
        super.onCreate();
        audioManager = (AudioManager) getSystemService(AUDIO_SERVICE);
        ContextCompat.registerReceiver(this, noisy, new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY), ContextCompat.RECEIVER_NOT_EXPORTED);
        // Files are disposable narration, never user data. Remove leftovers from a killed process.
        File[] leftovers = getCacheDir().listFiles((directory, name) -> name.startsWith("fv-narration-") && name.endsWith(".wav"));
        if (leftovers != null) for (File file : leftovers) file.delete();
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(CHANNEL, "Guided narration", NotificationManager.IMPORTANCE_LOW);
            channel.setSound(null, null);
            getSystemService(NotificationManager.class).createNotificationChannel(channel);
        }
    }
    private String requireSession(PluginCall call) {
        String id = call.getString("sessionId");
        if (transfer == null || id == null || !id.equals(transfer.sessionId)) throw new IllegalArgumentException("Inactive narration session");
        return id;
    }
    void begin(PluginCall call) throws IOException {
        String id = call.getString("sessionId");
        Integer bytes = call.getInt("byteLength");
        if (bytes == null) throw new IllegalArgumentException("Missing WAV size");
        NarrationTransfer.validateBegin(id, bytes);
        reset();
        transfer = new NarrationTransfer(getCacheDir(), id, bytes);
        call.resolve();
    }
    void append(PluginCall call) throws IOException {
        requireSession(call);
        String data = call.getString("data");
        Integer index = call.getInt("index");
        if (data == null || data.length() > 262144 || index == null || player != null) throw new IllegalArgumentException("Invalid WAV chunk");
        transfer.append(index, Base64.decode(data, Base64.NO_WRAP));
        call.resolve();
    }
    void prepare(PluginCall call) throws IOException {
        requireSession(call);
        if (player != null) throw new IllegalArgumentException("Already prepared");
        transfer.finish();
        MediaPlayer candidate = new MediaPlayer();
        player = candidate;
        preparing = call;
        candidate.setAudioAttributes(attributes);
        candidate.setWakeMode(this, PowerManager.PARTIAL_WAKE_LOCK);
        candidate.setOnPreparedListener(value -> {
            if (value != player) return;
            duration = value.getDuration() / 1000.0;
            state = "ready";
            PluginCall ready = preparing;
            preparing = null;
            if (ready != null) ready.resolve(new JSObject().put("duration", duration));
        });
        candidate.setOnCompletionListener(value -> {
            if (value != player) return;
            lastPosition = duration;
            state = "ended";
            releaseFocus();
            stopPlaybackService();
        });
        candidate.setOnErrorListener((value, what, extra) -> {
            if (value != player) return true;
            state = "error";
            if (preparing != null) { preparing.reject("Cannot prepare narration"); preparing = null; }
            if (starting != null) { starting.reject("Cannot play narration"); starting = null; }
            releaseFocus();
            stopPlaybackService();
            return true;
        });
        try {
            candidate.setDataSource(transfer.file.getAbsolutePath());
            candidate.prepareAsync();
        } catch (IOException | RuntimeException exception) {
            preparing = null;
            state = "error";
            candidate.release();
            player = null;
            throw exception;
        }
    }
    void play(PluginCall call) {
        String id = requireSession(call);
        if ("ended".equals(state) || "playing".equals(state)) { call.resolve(); return; }
        if (player == null || preparing != null || "error".equals(state)) throw new IllegalStateException("Narration not ready");
        if (starting != null) { call.reject("Narration is starting"); return; }
        starting = call;
        try {
            Intent intent = new Intent(this, FVNarrationService.class).setAction(ACTION_PLAY)
                .putExtra("sessionId", id).putExtra("playRequest", ++playRequest);
            ContextCompat.startForegroundService(this, intent);
        } catch (RuntimeException exception) {
            starting = null;
            call.reject("Open From Victory to start narration", "NARRATION_START_FAILED", exception);
        }
    }
    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_PAUSE.equals(intent.getAction())) {
            if (transfer != null && transfer.sessionId.equals(intent.getStringExtra("sessionId"))) pausePlayback();
            return START_NOT_STICKY;
        }
        // Fulfil the foreground-service handshake even if a queued play was cancelled.
        try {
            if (Build.VERSION.SDK_INT >= 29) startForeground(NOTIFICATION_ID, notification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            else startForeground(NOTIFICATION_ID, notification());
            if (intent == null || !ACTION_PLAY.equals(intent.getAction()) || transfer == null ||
                !transfer.sessionId.equals(intent.getStringExtra("sessionId")) || starting == null ||
                intent.getLongExtra("playRequest", -1) != playRequest) {
                // An older queued start must not tear down a later active playback.
                if (!"playing".equals(state)) stopPlaybackService();
                return START_NOT_STICKY;
            }
            if (!requestFocus()) throw new IllegalStateException("Audio focus unavailable");
            player.start();
            state = "playing";
            PluginCall started = starting;
            starting = null;
            started.resolve();
        } catch (RuntimeException exception) {
            if (starting != null) { starting.reject("Cannot start narration", "NARRATION_START_FAILED", exception); starting = null; }
            state = "paused";
            releaseFocus();
            stopPlaybackService();
        }
        return START_NOT_STICKY;
    }
    private Notification notification() {
        Intent open = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent content = PendingIntent.getActivity(this, 4621, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        String sessionId = transfer == null ? "" : transfer.sessionId;
        // Extras do not participate in PendingIntent identity. A session-specific
        // URI prevents an old notification action from acquiring a new session ID.
        Intent pause = new Intent(this, FVNarrationService.class).setAction(ACTION_PAUSE)
            .setData(new Uri.Builder().scheme("fv-narration").authority("pause").appendPath(sessionId).build())
            .putExtra("sessionId", sessionId);
        PendingIntent action = PendingIntent.getService(this, 4622, pause, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder builder = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL) : new Notification.Builder(this);
        return builder.setSmallIcon(android.R.drawable.ic_media_play).setContentTitle("From Victory")
            .setContentText("Guided narration is playing").setContentIntent(content).setOngoing(true)
            .setCategory(Notification.CATEGORY_SERVICE).setVisibility(Notification.VISIBILITY_PUBLIC)
            .addAction(new Notification.Action.Builder(android.R.drawable.ic_media_pause, "Pause", action).build()).build();
        // No MediaSession: the athlete's music retains its transport controls.
    }
    @SuppressWarnings("deprecation")
    private boolean requestFocus() {
        long generation = ++focusGeneration;
        focusListener = change -> {
            // Ignore callbacks queued for an abandoned, older playback request.
            if (generation == focusGeneration && change < 0) pausePlayback();
        };
        int result;
        if (Build.VERSION.SDK_INT >= 26) {
            focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                .setAudioAttributes(attributes).setWillPauseWhenDucked(true)
                .setOnAudioFocusChangeListener(focusListener, new Handler(Looper.getMainLooper())).build();
            result = audioManager.requestAudioFocus(focusRequest);
        } else result = audioManager.requestAudioFocus(focusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK);
        hasFocus = result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
        return hasFocus;
    }
    @SuppressWarnings("deprecation")
    private void releaseFocus() {
        ++focusGeneration;
        if (hasFocus) {
            if (Build.VERSION.SDK_INT >= 26 && focusRequest != null) audioManager.abandonAudioFocusRequest(focusRequest);
            else audioManager.abandonAudioFocus(focusListener);
        }
        focusRequest = null;
        focusListener = null;
        hasFocus = false;
    }
    private void stopPlaybackService() {
        stopForeground(STOP_FOREGROUND_REMOVE);
        stopSelf(); // A bound service keeps the prepared session for an explicit resume.
    }
    private void pausePlayback() {
        if (starting != null) { starting.reject("Narration start cancelled"); starting = null; }
        if (player != null && "playing".equals(state)) {
            lastPosition = player.getCurrentPosition() / 1000.0;
            player.pause();
            state = "paused";
        }
        releaseFocus();
        stopPlaybackService();
    }
    void pause(PluginCall call) { requireSession(call); pausePlayback(); call.resolve(); }
    void setVolume(PluginCall call) {
        double nextVolume = NarrationVolume.validate(
            call.getString("sessionId"), transfer == null ? null : transfer.sessionId,
            player != null && preparing == null && !"error".equals(state) && !"ended".equals(state),
            call.getData().opt("volume")
        );
        // Per-player gain only: never change the system/music stream, request
        // audio focus, or start/resume playback when the slider moves.
        player.setVolume((float) nextVolume, (float) nextVolume);
        volume = nextVolume;
        call.resolve(new JSObject().put("volume", volume));
    }
    void getStatus(PluginCall call) {
        requireSession(call);
        if (player != null && "playing".equals(state)) lastPosition = player.getCurrentPosition() / 1000.0;
        JSObject result = new JSObject().put("position", lastPosition).put("duration", duration).put("state", state).put("volume", volume);
        if ("error".equals(state)) result.put("error", "Narration playback failed");
        call.resolve(result);
    }
    void dispose(PluginCall call) {
        String id = call.getString("sessionId");
        if (transfer != null && transfer.sessionId.equals(id)) reset();
        call.resolve(); // Stale cleanup must never stop a newer session.
    }
    void reset() {
        if (preparing != null) { preparing.reject("Narration preparation cancelled"); preparing = null; }
        if (starting != null) { starting.reject("Narration start cancelled"); starting = null; }
        if (player != null) { player.release(); player = null; }
        releaseFocus();
        stopPlaybackService();
        if (transfer != null) { transfer.close(); transfer = null; }
        state = "ready";
        duration = 0;
        lastPosition = 0;
        volume = 1;
    }
    @Override public void onTaskRemoved(Intent rootIntent) { reset(); super.onTaskRemoved(rootIntent); }
    @Override public void onDestroy() { reset(); unregisterReceiver(noisy); super.onDestroy(); }
}
