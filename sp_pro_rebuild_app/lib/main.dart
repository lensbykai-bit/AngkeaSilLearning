import 'dart:convert';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:video_player/video_player.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const SpProApp());
}

class SubtitleEntry {
  SubtitleEntry({
    required this.start,
    required this.end,
    required this.original,
    this.translated = '',
  });

  Duration start;
  Duration end;
  String original;
  String translated;
}

class SpProApp extends StatelessWidget {
  const SpProApp({super.key});

  @override
  Widget build(BuildContext context) {
    final scheme = ColorScheme.fromSeed(
      seedColor: const Color(0xFF7057FF),
      brightness: Brightness.dark,
    );
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'SP Pro',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: scheme,
        scaffoldBackgroundColor: const Color(0xFF0D0E13),
      ),
      home: const StudioScreen(),
    );
  }
}

class StudioScreen extends StatefulWidget {
  const StudioScreen({super.key});

  @override
  State<StudioScreen> createState() => _StudioScreenState();
}

class _StudioScreenState extends State<StudioScreen> {
  final FlutterTts _tts = FlutterTts();
  final TextEditingController _apiController = TextEditingController();
  final TextEditingController _modelController = TextEditingController();
  final TextEditingController _targetController = TextEditingController();

  List<SubtitleEntry> _subtitles = [];
  VideoPlayerController? _videoController;
  String? _videoPath;
  int _tab = 0;
  bool _busy = false;
  String _status = 'Ready — no license or activation required.';
  String _apiKey = '';
  String _model = 'gemini-2.5-flash';
  String _target = 'Khmer';
  String _ttsLanguage = 'km-KH';
  double _speechRate = 0.45;
  double _pitch = 1.0;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  @override
  void dispose() {
    _videoController?.dispose();
    _tts.stop();
    _apiController.dispose();
    _modelController.dispose();
    _targetController.dispose();
    super.dispose();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _apiKey = prefs.getString('gemini_api_key') ?? '';
      _model = prefs.getString('gemini_model') ?? 'gemini-2.5-flash';
      _target = prefs.getString('target_language') ?? 'Khmer';
      _ttsLanguage = prefs.getString('tts_language') ?? 'km-KH';
      _speechRate = prefs.getDouble('speech_rate') ?? 0.45;
      _pitch = prefs.getDouble('speech_pitch') ?? 1.0;
      _apiController.text = _apiKey;
      _modelController.text = _model;
      _targetController.text = _target;
    });
  }

  Future<void> _saveSettings() async {
    final prefs = await SharedPreferences.getInstance();
    _apiKey = _apiController.text.trim();
    _model = _modelController.text.trim().isEmpty
        ? 'gemini-2.5-flash'
        : _modelController.text.trim();
    _target = _targetController.text.trim().isEmpty
        ? 'Khmer'
        : _targetController.text.trim();
    await prefs.setString('gemini_api_key', _apiKey);
    await prefs.setString('gemini_model', _model);
    await prefs.setString('target_language', _target);
    await prefs.setString('tts_language', _ttsLanguage);
    await prefs.setDouble('speech_rate', _speechRate);
    await prefs.setDouble('speech_pitch', _pitch);
    if (!mounted) return;
    setState(() => _status = 'Settings saved on this device.');
    _snack('Settings saved.');
  }

  Future<void> _pickVideo() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['mp4', 'mov', 'mkv', 'webm', 'm4v'],
    );
    final path = result?.files.single.path;
    if (path == null) return;

    await _videoController?.dispose();
    final controller = VideoPlayerController.file(File(path));
    try {
      await controller.initialize();
      if (!mounted) return;
      setState(() {
        _videoPath = path;
        _videoController = controller;
        _status = 'Video loaded.';
      });
    } catch (e) {
      await controller.dispose();
      _snack('Cannot open this video: $e');
    }
  }

  Future<void> _importSrt() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['srt'],
      withData: true,
    );
    if (result == null) return;
    final file = result.files.single;
    String content;
    if (file.bytes != null) {
      content = utf8.decode(file.bytes!, allowMalformed: true);
    } else if (file.path != null) {
      content = await File(file.path!).readAsString();
    } else {
      return;
    }
    final parsed = _parseSrt(content);
    setState(() {
      _subtitles = parsed;
      _tab = 1;
      _status = 'Imported ${parsed.length} subtitle lines.';
    });
  }

  List<SubtitleEntry> _parseSrt(String input) {
    final normalized = input.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
    final blocks = normalized.split(RegExp(r'\n\s*\n'));
    final entries = <SubtitleEntry>[];
    final timePattern = RegExp(
      r'^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})$',
    );

    Duration readTime(RegExpMatch m, int g) {
      return Duration(
        hours: int.parse(m.group(g)!),
        minutes: int.parse(m.group(g + 1)!),
        seconds: int.parse(m.group(g + 2)!),
        milliseconds: int.parse(m.group(g + 3)!),
      );
    }

    for (final block in blocks) {
      final lines = block.split('\n').where((e) => e.trim().isNotEmpty).toList();
      if (lines.length < 2) continue;
      var cursor = int.tryParse(lines.first.trim()) != null ? 1 : 0;
      if (cursor >= lines.length) continue;
      final match = timePattern.firstMatch(lines[cursor].trim());
      if (match == null) continue;
      cursor++;
      final text = lines.skip(cursor).join('\n').trim();
      if (text.isEmpty) continue;
      entries.add(SubtitleEntry(
        start: readTime(match, 1),
        end: readTime(match, 5),
        original: text,
      ));
    }
    return entries;
  }

  String _formatTime(Duration d) {
    String two(int n) => n.toString().padLeft(2, '0');
    String three(int n) => n.toString().padLeft(3, '0');
    return '${two(d.inHours)}:${two(d.inMinutes.remainder(60))}:${two(d.inSeconds.remainder(60))},${three(d.inMilliseconds.remainder(1000))}';
  }

  String _formatSrt() {
    final b = StringBuffer();
    for (var i = 0; i < _subtitles.length; i++) {
      final e = _subtitles[i];
      b.writeln(i + 1);
      b.writeln('${_formatTime(e.start)} --> ${_formatTime(e.end)}');
      b.writeln(e.translated.trim().isEmpty ? e.original.trim() : e.translated.trim());
      b.writeln();
    }
    return b.toString();
  }

  Future<void> _exportSrt() async {
    if (_subtitles.isEmpty) {
      _snack('No subtitles to export.');
      return;
    }
    final dir = await getApplicationDocumentsDirectory();
    final out = Directory('${dir.path}/SP_Pro_Exports');
    await out.create(recursive: true);
    final file = File('${out.path}/translated_${DateTime.now().millisecondsSinceEpoch}.srt');
    await file.writeAsString(_formatSrt());
    if (!mounted) return;
    setState(() => _status = 'SRT exported: ${file.path}');
    _snack('SRT saved successfully.');
  }

  Future<void> _translateAll() async {
    if (_subtitles.isEmpty) {
      _snack('Import an SRT file first.');
      return;
    }
    if (_apiKey.trim().isEmpty) {
      setState(() => _tab = 3);
      _snack('Add your Gemini API key in Settings first.');
      return;
    }

    setState(() {
      _busy = true;
      _status = 'Translating subtitles…';
    });
    try {
      const batchSize = 25;
      for (var start = 0; start < _subtitles.length; start += batchSize) {
        final end = (start + batchSize < _subtitles.length)
            ? start + batchSize
            : _subtitles.length;
        final batch = _subtitles.sublist(start, end);
        final payload = <Map<String, dynamic>>[
          for (var i = 0; i < batch.length; i++)
            {'id': i, 'text': batch[i].original}
        ];
        final prompt = '''
You are a professional cinematic subtitle translator.
Translate every item into $_target.
Preserve meaning, emotion, names, and natural spoken phrasing.
Do not merge or split items. Return ONLY valid JSON in exactly this form:
[{"id":0,"text":"translated text"}]
Input JSON:
${jsonEncode(payload)}
''';
        final uri = Uri.parse(
          'https://generativelanguage.googleapis.com/v1beta/models/$_model:generateContent?key=${Uri.encodeQueryComponent(_apiKey)}',
        );
        final response = await http.post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'contents': [
              {
                'role': 'user',
                'parts': [
                  {'text': prompt}
                ]
              }
            ],
            'generationConfig': {
              'temperature': 0.2,
              'responseMimeType': 'application/json',
            }
          }),
        );
        if (response.statusCode < 200 || response.statusCode >= 300) {
          throw Exception('Gemini error ${response.statusCode}: ${response.body}');
        }
        final decoded = jsonDecode(response.body) as Map<String, dynamic>;
        final candidates = decoded['candidates'] as List<dynamic>?;
        if (candidates == null || candidates.isEmpty) {
          throw Exception('Gemini returned no result.');
        }
        final content = candidates.first['content'] as Map<String, dynamic>?;
        final parts = content?['parts'] as List<dynamic>?;
        if (parts == null || parts.isEmpty) {
          throw Exception('Gemini returned no text.');
        }
        var text = (parts.first['text'] ?? '').toString().trim();
        text = text.replaceFirst(RegExp(r'^```(?:json)?\s*'), '');
        text = text.replaceFirst(RegExp(r'\s*```$'), '');
        final list = jsonDecode(text) as List<dynamic>;
        final byId = <int, String>{};
        for (final item in list) {
          if (item is Map) {
            final id = item['id'];
            final translated = item['text'];
            if (id is int && translated is String) byId[id] = translated;
          }
        }
        for (var i = 0; i < batch.length; i++) {
          _subtitles[start + i].translated = byId[i] ?? '';
        }
        if (mounted) {
          setState(() => _status = 'Translated $end / ${_subtitles.length} lines…');
        }
      }
      if (mounted) setState(() => _status = 'Translation complete.');
    } catch (e) {
      _snack(e.toString());
      if (mounted) setState(() => _status = 'Translation failed.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _speak(String text) async {
    if (text.trim().isEmpty) return;
    await _tts.stop();
    await _tts.setLanguage(_ttsLanguage);
    await _tts.setSpeechRate(_speechRate);
    await _tts.setPitch(_pitch);
    await _tts.speak(text);
  }

  void _snack(String text) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      _projectPage(),
      _subtitlePage(),
      _voicePage(),
      _settingsPage(),
    ];
    return Scaffold(
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('SP Pro', style: TextStyle(fontWeight: FontWeight.w800)),
            Text('Video • Subtitle • Dubbing Studio', style: TextStyle(fontSize: 11)),
          ],
        ),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 12),
            child: Chip(
              avatar: Icon(Icons.verified_user_outlined, size: 16),
              label: Text('No License'),
              side: BorderSide.none,
            ),
          )
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (_busy) const LinearProgressIndicator(minHeight: 2),
            Expanded(child: pages[_tab]),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: Theme.of(context).colorScheme.outlineVariant)),
              ),
              child: Text(_status, maxLines: 2, overflow: TextOverflow.ellipsis),
            ),
          ],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (v) => setState(() => _tab = v),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.movie_creation_outlined), label: 'Project'),
          NavigationDestination(icon: Icon(Icons.subtitles_outlined), label: 'Subtitles'),
          NavigationDestination(icon: Icon(Icons.record_voice_over_outlined), label: 'Voice'),
          NavigationDestination(icon: Icon(Icons.settings_outlined), label: 'Settings'),
        ],
      ),
    );
  }

  Widget _card(String title, Widget child) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }

  Widget _projectPage() {
    final controller = _videoController;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _card(
          'Project',
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              FilledButton.icon(
                onPressed: _pickVideo,
                icon: const Icon(Icons.video_file_outlined),
                label: const Text('Import Video'),
              ),
              OutlinedButton.icon(
                onPressed: _importSrt,
                icon: const Icon(Icons.subtitles_outlined),
                label: const Text('Import SRT'),
              ),
              OutlinedButton.icon(
                onPressed: _exportSrt,
                icon: const Icon(Icons.download_outlined),
                label: const Text('Export SRT'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        _card(
          'Video Preview',
          controller == null || !controller.value.isInitialized
              ? Container(
                  height: 230,
                  alignment: Alignment.center,
                  color: Colors.black26,
                  child: const Text('Import a video to preview it here.'),
                )
              : Column(
                  children: [
                    AspectRatio(
                      aspectRatio: controller.value.aspectRatio,
                      child: VideoPlayer(controller),
                    ),
                    Row(
                      children: [
                        IconButton(
                          onPressed: () async {
                            if (controller.value.isPlaying) {
                              await controller.pause();
                            } else {
                              await controller.play();
                            }
                            if (mounted) setState(() {});
                          },
                          icon: Icon(controller.value.isPlaying ? Icons.pause : Icons.play_arrow),
                        ),
                        Expanded(
                          child: VideoProgressIndicator(
                            controller,
                            allowScrubbing: true,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
        ),
        const SizedBox(height: 12),
        _card(
          'Project Summary',
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Video: ${_videoPath ?? 'Not selected'}'),
              const SizedBox(height: 6),
              Text('Subtitle lines: ${_subtitles.length}'),
              const SizedBox(height: 6),
              Text('Gemini model: $_model'),
              const SizedBox(height: 6),
              const Text('License/activation: Not included'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _subtitlePage() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Expanded(child: Text('${_subtitles.length} subtitle lines')),
              FilledButton.icon(
                onPressed: _busy ? null : _translateAll,
                icon: const Icon(Icons.translate),
                label: Text('Translate → $_target'),
              ),
            ],
          ),
        ),
        Expanded(
          child: _subtitles.isEmpty
              ? const Center(child: Text('Import an SRT file to start editing.'))
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                  itemCount: _subtitles.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final item = _subtitles[index];
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('#${index + 1}  ${_formatTime(item.start)} → ${_formatTime(item.end)}'),
                            const SizedBox(height: 8),
                            TextFormField(
                              initialValue: item.original,
                              maxLines: null,
                              decoration: const InputDecoration(
                                labelText: 'Original',
                                border: OutlineInputBorder(),
                              ),
                              onChanged: (v) => item.original = v,
                            ),
                            const SizedBox(height: 8),
                            TextFormField(
                              key: ValueKey('translated_${index}_${item.translated.hashCode}'),
                              initialValue: item.translated,
                              maxLines: null,
                              decoration: const InputDecoration(
                                labelText: 'Translated',
                                border: OutlineInputBorder(),
                              ),
                              onChanged: (v) => item.translated = v,
                            ),
                            Align(
                              alignment: Alignment.centerRight,
                              child: IconButton.filledTonal(
                                onPressed: () => _speak(
                                  item.translated.trim().isEmpty ? item.original : item.translated,
                                ),
                                icon: const Icon(Icons.volume_up_outlined),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _voicePage() {
    final preview = _subtitles.isEmpty
        ? 'សួស្តី! នេះគឺជាការសាកល្បងសំឡេងរបស់ SP Pro។'
        : (_subtitles.first.translated.trim().isEmpty
            ? _subtitles.first.original
            : _subtitles.first.translated);
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _card(
          'Local TTS Preview',
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(preview),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: () => _speak(preview),
                icon: const Icon(Icons.play_arrow),
                label: const Text('Play Voice'),
              ),
              const SizedBox(height: 16),
              Text('Speech rate: ${_speechRate.toStringAsFixed(2)}'),
              Slider(
                min: 0.2,
                max: 0.8,
                value: _speechRate,
                onChanged: (v) => setState(() => _speechRate = v),
              ),
              Text('Pitch: ${_pitch.toStringAsFixed(2)}'),
              Slider(
                min: 0.5,
                max: 2.0,
                value: _pitch,
                onChanged: (v) => setState(() => _pitch = v),
              ),
              TextFormField(
                initialValue: _ttsLanguage,
                decoration: const InputDecoration(
                  labelText: 'TTS language',
                  hintText: 'km-KH',
                ),
                onChanged: (v) => _ttsLanguage = v.trim().isEmpty ? 'km-KH' : v.trim(),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _settingsPage() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _card(
          'Gemini Settings',
          Column(
            children: [
              TextField(
                controller: _apiController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Gemini API Key',
                  hintText: 'Paste your own API key',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _modelController,
                decoration: const InputDecoration(
                  labelText: 'Gemini model',
                  hintText: 'gemini-2.5-flash',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _targetController,
                decoration: const InputDecoration(
                  labelText: 'Target language',
                  hintText: 'Khmer',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: _saveSettings,
                  icon: const Icon(Icons.save_outlined),
                  label: const Text('Save Settings'),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        _card(
          'Access',
          const Text(
            'This rebuild does not include a license key, activation screen, expiry check, or device binding.',
          ),
        ),
      ],
    );
  }
}
