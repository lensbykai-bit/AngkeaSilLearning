package com.sppro;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.MediaController;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.VideoView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final int PICK_VIDEO = 1001;
    private static final int PICK_SRT = 1002;
    private static final int SAVE_SRT = 1003;

    private final int bg = Color.rgb(13, 14, 19);
    private final int panel = Color.rgb(24, 26, 35);
    private final int text = Color.rgb(240, 240, 245);
    private final int muted = Color.rgb(180, 181, 195);

    private VideoView videoView;
    private EditText sourceEditor;
    private EditText translatedEditor;
    private EditText apiField;
    private EditText modelField;
    private EditText targetField;
    private TextView status;
    private TextToSpeech tts;
    private SharedPreferences prefs;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences("sp_pro_settings", MODE_PRIVATE);
        buildUi();
        initTts();
        loadSettings();
    }

    private void buildUi() {
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(bg);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(16), dp(18), dp(16), dp(24));
        root.setBackgroundColor(bg);
        scroll.addView(root);

        TextView title = textView("SP Pro", 26, text);
        title.setGravity(Gravity.START);
        root.addView(title);

        TextView sub = textView("Video • Subtitle • Dubbing Studio", 13, muted);
        root.addView(sub);

        TextView noLicense = textView("✓ No License • No Activation • No Expiry", 13, Color.rgb(146, 255, 183));
        noLicense.setPadding(0, dp(8), 0, dp(14));
        root.addView(noLicense);

        root.addView(sectionTitle("Project"));
        LinearLayout row = horizontalRow();
        row.addView(button("Import Video", v -> pickVideo()), weighted());
        row.addView(button("Import SRT", v -> pickSrt()), weighted());
        root.addView(row);

        videoView = new VideoView(this);
        videoView.setBackgroundColor(Color.BLACK);
        LinearLayout.LayoutParams videoLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, dp(220));
        videoLp.setMargins(0, dp(10), 0, dp(14));
        root.addView(videoView, videoLp);
        MediaController controls = new MediaController(this);
        controls.setAnchorView(videoView);
        videoView.setMediaController(controls);

        root.addView(sectionTitle("Subtitle Source (SRT)"));
        sourceEditor = editor("Import or paste SRT here…", 190);
        root.addView(sourceEditor);

        LinearLayout translateRow = horizontalRow();
        translateRow.addView(button("Translate → Khmer", v -> translateSrt()), weighted());
        translateRow.addView(button("Export SRT", v -> exportSrt()), weighted());
        root.addView(translateRow);

        root.addView(sectionTitle("Translated SRT"));
        translatedEditor = editor("Gemini translation will appear here…", 190);
        root.addView(translatedEditor);

        LinearLayout voiceRow = horizontalRow();
        voiceRow.addView(button("▶ Play Voice", v -> speakPreview()), weighted());
        voiceRow.addView(button("■ Stop Voice", v -> stopVoice()), weighted());
        root.addView(voiceRow);

        root.addView(sectionTitle("Gemini Settings"));
        apiField = editor("Gemini API Key", 54);
        apiField.setSingleLine(true);
        root.addView(apiField);

        modelField = editor("Gemini model (example: gemini-2.5-flash)", 54);
        modelField.setSingleLine(true);
        root.addView(modelField);

        targetField = editor("Target language (Khmer)", 54);
        targetField.setSingleLine(true);
        root.addView(targetField);

        Button saveSettings = button("Save Settings", v -> saveSettings());
        LinearLayout.LayoutParams saveLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        saveLp.setMargins(0, dp(8), 0, dp(10));
        root.addView(saveSettings, saveLp);

        status = textView("Ready — no license or activation required.", 12, muted);
        status.setBackgroundColor(panel);
        status.setPadding(dp(12), dp(10), dp(12), dp(10));
        root.addView(status);

        setContentView(scroll);
    }

    private void initTts() {
        tts = new TextToSpeech(this, state -> {
            if (state == TextToSpeech.SUCCESS) {
                tts.setLanguage(Locale.forLanguageTag("km-KH"));
                tts.setSpeechRate(0.9f);
                tts.setPitch(1.0f);
            }
        });
    }

    private void loadSettings() {
        apiField.setText(prefs.getString("api_key", ""));
        modelField.setText(prefs.getString("model", "gemini-2.5-flash"));
        targetField.setText(prefs.getString("target", "Khmer"));
    }

    private void saveSettings() {
        prefs.edit()
                .putString("api_key", apiField.getText().toString().trim())
                .putString("model", valueOr(modelField, "gemini-2.5-flash"))
                .putString("target", valueOr(targetField, "Khmer"))
                .apply();
        status("Settings saved locally on this device.");
    }

    private String valueOr(EditText e, String fallback) {
        String v = e.getText().toString().trim();
        return v.isEmpty() ? fallback : v;
    }

    private void pickVideo() {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("video/*");
        startActivityForResult(i, PICK_VIDEO);
    }

    private void pickSrt() {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("*/*");
        i.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/x-subrip", "text/plain", "application/octet-stream"});
        startActivityForResult(i, PICK_SRT);
    }

    private void exportSrt() {
        String out = translatedEditor.getText().toString().trim();
        if (out.isEmpty()) out = sourceEditor.getText().toString().trim();
        if (out.isEmpty()) {
            status("Nothing to export.");
            return;
        }
        Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("text/plain");
        i.putExtra(Intent.EXTRA_TITLE, "SP_Pro_translated.srt");
        startActivityForResult(i, SAVE_SRT);
    }

    private void translateSrt() {
        final String source = sourceEditor.getText().toString().trim();
        final String key = apiField.getText().toString().trim();
        final String model = valueOr(modelField, "gemini-2.5-flash");
        final String target = valueOr(targetField, "Khmer");

        if (source.isEmpty()) {
            status("Import or paste an SRT file first.");
            return;
        }
        if (key.isEmpty()) {
            status("Add your Gemini API Key first.");
            return;
        }

        saveSettings();
        status("Translating subtitles…");
        new Thread(() -> {
            HttpURLConnection connection = null;
            try {
                String prompt = "You are a professional subtitle translator. Translate ONLY the spoken subtitle text in this SRT into "
                        + target
                        + ". Preserve every subtitle index and timestamp exactly. Do not merge or split entries. Return only valid SRT text with no markdown fences.\n\n"
                        + source;

                String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/"
                        + Uri.encode(model)
                        + ":generateContent?key=" + Uri.encode(key);
                URL url = new URL(endpoint);
                connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");
                connection.setConnectTimeout(20000);
                connection.setReadTimeout(120000);
                connection.setDoOutput(true);
                connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");

                JSONObject body = new JSONObject();
                JSONArray contents = new JSONArray();
                JSONObject content = new JSONObject();
                JSONArray parts = new JSONArray();
                parts.put(new JSONObject().put("text", prompt));
                content.put("parts", parts);
                contents.put(content);
                body.put("contents", contents);
                body.put("generationConfig", new JSONObject().put("temperature", 0.2));

                try (OutputStream os = connection.getOutputStream()) {
                    os.write(body.toString().getBytes(StandardCharsets.UTF_8));
                }

                int code = connection.getResponseCode();
                InputStream input = (code >= 200 && code < 300)
                        ? connection.getInputStream()
                        : connection.getErrorStream();
                String response = readAll(input);
                if (code < 200 || code >= 300) {
                    throw new Exception("Gemini error " + code + ": " + response);
                }

                JSONObject decoded = new JSONObject(response);
                JSONArray candidates = decoded.optJSONArray("candidates");
                if (candidates == null || candidates.length() == 0) {
                    throw new Exception("Gemini returned no result.");
                }
                JSONObject first = candidates.getJSONObject(0);
                JSONObject c = first.getJSONObject("content");
                JSONArray p = c.getJSONArray("parts");
                String translated = p.getJSONObject(0).optString("text", "").trim();
                translated = stripFences(translated);
                final String finalTranslated = translated;
                runOnUiThread(() -> {
                    translatedEditor.setText(finalTranslated);
                    status("Translation complete.");
                });
            } catch (Exception e) {
                runOnUiThread(() -> status("Translation failed: " + e.getMessage()));
            } finally {
                if (connection != null) connection.disconnect();
            }
        }).start();
    }

    private String stripFences(String s) {
        String out = s.trim();
        if (out.startsWith("```")) {
            int firstNewline = out.indexOf('\n');
            if (firstNewline >= 0) out = out.substring(firstNewline + 1);
        }
        if (out.endsWith("```")) out = out.substring(0, out.length() - 3);
        return out.trim();
    }

    private void speakPreview() {
        String content = translatedEditor.getText().toString().trim();
        if (content.isEmpty()) content = sourceEditor.getText().toString().trim();
        if (content.isEmpty()) {
            status("No subtitle text to speak.");
            return;
        }
        String spoken = srtToPlainText(content);
        if (spoken.length() > 3500) spoken = spoken.substring(0, 3500);
        tts.speak(spoken, TextToSpeech.QUEUE_FLUSH, null, "sp-pro-preview");
        status("Playing local TTS preview.");
    }

    private String srtToPlainText(String srt) {
        StringBuilder b = new StringBuilder();
        String[] lines = srt.replace("\r", "").split("\n");
        for (String line : lines) {
            String t = line.trim();
            if (t.isEmpty()) continue;
            if (t.matches("\\d+")) continue;
            if (t.contains(" --> ")) continue;
            b.append(t).append(' ');
        }
        return b.toString().trim();
    }

    private void stopVoice() {
        if (tts != null) tts.stop();
        status("Voice stopped.");
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode != RESULT_OK || data == null || data.getData() == null) return;
        Uri uri = data.getData();
        try {
            if (requestCode == PICK_VIDEO) {
                getContentResolver().takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
                videoView.setVideoURI(uri);
                videoView.start();
                status("Video loaded.");
            } else if (requestCode == PICK_SRT) {
                getContentResolver().takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
                try (InputStream in = getContentResolver().openInputStream(uri)) {
                    sourceEditor.setText(readAll(in));
                }
                status("SRT imported.");
            } else if (requestCode == SAVE_SRT) {
                String out = translatedEditor.getText().toString().trim();
                if (out.isEmpty()) out = sourceEditor.getText().toString().trim();
                try (OutputStream os = getContentResolver().openOutputStream(uri)) {
                    if (os != null) os.write(out.getBytes(StandardCharsets.UTF_8));
                }
                status("SRT exported successfully.");
            }
        } catch (Exception e) {
            status("File error: " + e.getMessage());
        }
    }

    private String readAll(InputStream in) throws Exception {
        if (in == null) return "";
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int n;
        while ((n = in.read(buffer)) >= 0) out.write(buffer, 0, n);
        return out.toString("UTF-8");
    }

    private void status(String message) {
        status.setText(message);
    }

    private TextView sectionTitle(String value) {
        TextView v = textView(value, 17, text);
        v.setPadding(0, dp(12), 0, dp(8));
        return v;
    }

    private TextView textView(String value, int size, int color) {
        TextView v = new TextView(this);
        v.setText(value);
        v.setTextSize(size);
        v.setTextColor(color);
        return v;
    }

    private EditText editor(String hint, int heightDp) {
        EditText e = new EditText(this);
        e.setHint(hint);
        e.setHintTextColor(Color.rgb(125, 127, 142));
        e.setTextColor(text);
        e.setTextSize(14);
        e.setGravity(Gravity.TOP | Gravity.START);
        e.setBackgroundColor(panel);
        e.setPadding(dp(12), dp(10), dp(12), dp(10));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, dp(heightDp));
        lp.setMargins(0, 0, 0, dp(10));
        e.setLayoutParams(lp);
        return e;
    }

    private Button button(String label, View.OnClickListener listener) {
        Button b = new Button(this);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextColor(text);
        b.setOnClickListener(listener);
        return b;
    }

    private LinearLayout horizontalRow() {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        return row;
    }

    private LinearLayout.LayoutParams weighted() {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        lp.setMargins(dp(2), dp(2), dp(2), dp(8));
        return lp;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    @Override
    protected void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        super.onDestroy();
    }
}
