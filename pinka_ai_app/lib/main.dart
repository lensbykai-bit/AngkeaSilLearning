import 'dart:convert';
import 'dart:math' as math;

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Color(0xFF0B0E13),
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Color(0xFF0B0E13),
    systemNavigationBarIconBrightness: Brightness.light,
  ));
  runApp(const PinkaAiApp());
}

class PinkaAiApp extends StatelessWidget {
  const PinkaAiApp({super.key});

  static const pink = Color(0xFFFF3E9D);
  static const pinkSoft = Color(0xFFFF8CC7);
  static const bg = Color(0xFF0B0E13);
  static const card = Color(0xFF141821);
  static const border = Color(0xFF2A303B);
  static const secondary = Color(0xFFAAB1BD);

  @override
  Widget build(BuildContext context) {
    final base = ThemeData.dark(useMaterial3: true);
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'PINKA Ai',
      theme: base.copyWith(
        scaffoldBackgroundColor: bg,
        colorScheme: const ColorScheme.dark(
          primary: pink,
          secondary: pinkSoft,
          surface: card,
        ),
        textTheme: base.textTheme.apply(
          bodyColor: const Color(0xFFF5F6F8),
          displayColor: const Color(0xFFF5F6F8),
        ),
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  PlatformFile? video;
  PlatformFile? subtitle;

  Future<void> pickVideo() async {
    final result = await FilePicker.platform.pickFiles(type: FileType.video);
    if (!mounted || result == null || result.files.isEmpty) return;
    setState(() => video = result.files.single);
  }

  Future<void> pickSubtitle() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['srt', 'vtt'],
      withData: true,
    );
    if (!mounted || result == null || result.files.isEmpty) return;
    setState(() => subtitle = result.files.single);
  }

  bool get canContinue => video != null || subtitle != null;

  void openWorkspace() {
    if (!canContinue) return;
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => WorkspaceScreen(video: video, subtitle: subtitle),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            const SliverToBoxAdapter(child: PinkaHeader()),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 4, 24, 40),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  const Text(
                    'បកប្រែសំឡេង',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 34, fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'ជ្រើសរើសវីដេអូ ឬឯកសារ Subtitle ដើម្បីចាប់ផ្តើមការងារ AI របស់អ្នក',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: PinkaAiApp.secondary,
                      fontSize: 16,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 30),
                  StepCard(
                    step: 'ជំហាន 1',
                    title: 'វីដេអូ',
                    subtitle: 'ជ្រើសរើសវីដេអូដែលអ្នកចង់បកប្រែ',
                    icon: Icons.video_library_outlined,
                    selected: video != null,
                    fileName: video?.name,
                    onTap: pickVideo,
                  ),
                  const SizedBox(height: 18),
                  StepCard(
                    step: 'ជំហាន 2',
                    title: 'ចំណងជើង',
                    subtitle: 'បញ្ចូល .srt / .vtt ឬប្រើ Transcribe នៅជំហានបន្ទាប់',
                    icon: Icons.subtitles_outlined,
                    selected: subtitle != null,
                    fileName: subtitle?.name,
                    onTap: pickSubtitle,
                  ),
                  const SizedBox(height: 26),
                  SizedBox(
                    height: 64,
                    child: FilledButton.icon(
                      onPressed: canContinue ? openWorkspace : null,
                      icon: const Icon(Icons.arrow_forward_rounded),
                      label: const Text(
                        'ចូលទៅកាន់ការបកប្រែ',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                      ),
                      style: FilledButton.styleFrom(
                        backgroundColor: PinkaAiApp.pink,
                        disabledBackgroundColor: const Color(0xFF2A2D34),
                        disabledForegroundColor: const Color(0xFF777B84),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(22),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Divider(color: Color(0xFF252A33)),
                  const SizedBox(height: 18),
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.auto_awesome_rounded,
                          size: 18, color: PinkaAiApp.pink),
                      SizedBox(width: 8),
                      Text(
                        'PINKA Ai • AI Dubbing Workspace',
                        style: TextStyle(
                          color: PinkaAiApp.secondary,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 40),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class PinkaHeader extends StatelessWidget {
  const PinkaHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 250,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          CustomPaint(painter: NetworkPainter()),
          Align(
            alignment: const Alignment(0, -0.18),
            child: Container(
              width: 138,
              height: 138,
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(32),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x77FF3E9D),
                    blurRadius: 34,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(27),
                child: Image.asset(
                  'assets/images/pinka_logo.png',
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class NetworkPainter extends CustomPainter {
  final math.Random random = math.Random(23);

  @override
  void paint(Canvas canvas, Size size) {
    final line = Paint()
      ..color = const Color(0x352E3D87)
      ..strokeWidth = 1.2;
    final node = Paint()..color = const Color(0xFF656DDB);
    final glow = Paint()..color = const Color(0x344D55EC);

    final points = <Offset>[];
    for (var i = 0; i < 24; i++) {
      points.add(Offset(
        18 + random.nextDouble() * (size.width - 36),
        18 + random.nextDouble() * (size.height - 34),
      ));
    }
    for (var i = 0; i < points.length; i++) {
      if (i < points.length - 1 && i % 2 == 0) {
        canvas.drawLine(points[i], points[i + 1], line);
      }
      canvas.drawCircle(points[i], 10, glow);
      canvas.drawCircle(points[i], 4, node);
    }

    void drawWave(double start, double end, double y, Color color) {
      final p = Path()..moveTo(start, y);
      for (double x = start; x <= end; x += 4) {
        p.lineTo(x, y + math.sin(x / 11) * 8 + math.sin(x / 4.3) * 2);
      }
      canvas.drawPath(
        p,
        Paint()
          ..color = color
          ..style = PaintingStyle.stroke
          ..strokeWidth = 4
          ..strokeCap = StrokeCap.round,
      );
    }

    drawWave(size.width * .04, size.width * .31, size.height * .43,
        const Color(0x66727AE5));
    drawWave(size.width * .69, size.width * .96, size.height * .45,
        const Color(0xFF5962CB));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class StepCard extends StatelessWidget {
  final String step;
  final String title;
  final String subtitle;
  final IconData icon;
  final bool selected;
  final String? fileName;
  final VoidCallback onTap;

  const StepCard({
    super.key,
    required this.step,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
    this.selected = false,
    this.fileName,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(26),
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF1C1620) : PinkaAiApp.card,
          borderRadius: BorderRadius.circular(26),
          border: Border.all(
            color: selected ? PinkaAiApp.pink : PinkaAiApp.border,
            width: selected ? 1.4 : 1,
          ),
          boxShadow: selected
              ? const [
                  BoxShadow(color: Color(0x32FF3E9D), blurRadius: 24),
                ]
              : const [],
        ),
        child: Row(
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: const Color(0xFF1E2430),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(
                icon,
                color: selected ? PinkaAiApp.pinkSoft : PinkaAiApp.secondary,
                size: 30,
              ),
            ),
            const SizedBox(width: 18),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        step,
                        style: const TextStyle(
                          color: PinkaAiApp.secondary,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          title,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 7),
                  Text(
                    fileName ?? subtitle,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: fileName != null
                          ? PinkaAiApp.pinkSoft
                          : PinkaAiApp.secondary,
                      fontSize: 15,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Icon(
              selected ? Icons.check_circle_rounded : Icons.chevron_right_rounded,
              color: selected ? PinkaAiApp.pink : PinkaAiApp.secondary,
              size: 30,
            ),
          ],
        ),
      ),
    );
  }
}

class WorkspaceScreen extends StatefulWidget {
  final PlatformFile? video;
  final PlatformFile? subtitle;

  const WorkspaceScreen({super.key, this.video, this.subtitle});

  @override
  State<WorkspaceScreen> createState() => _WorkspaceScreenState();
}

class _WorkspaceScreenState extends State<WorkspaceScreen> {
  late final TextEditingController controller;
  String language = 'Khmer';

  @override
  void initState() {
    super.initState();
    var text = '';
    final bytes = widget.subtitle?.bytes;
    if (bytes != null) {
      text = utf8.decode(bytes, allowMalformed: true);
    }
    controller = TextEditingController(text: text);
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  void showAiNotice() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFF151922),
      showDragHandle: true,
      builder: (context) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 36),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.auto_awesome_rounded, color: PinkaAiApp.pink),
                SizedBox(width: 10),
                Text(
                  'PINKA Ai Translation',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                ),
              ],
            ),
            const SizedBox(height: 14),
            const Text(
              'ជំនាន់ APK នេះមាន UI, Upload Video និង Import Subtitle រួច។ មុខងារ Gemini AI ត្រូវភ្ជាប់ API នៅជំនាន់បន្ទាប់ ដើម្បីបកប្រែពិតប្រាកដ។',
              style: TextStyle(color: PinkaAiApp.secondary, height: 1.55),
            ),
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('យល់ព្រម'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: PinkaAiApp.bg,
        title: const Text(
          'PINKA Ai Workspace',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 30),
          children: [
            if (widget.video != null)
              InfoTile(
                icon: Icons.movie_creation_outlined,
                title: 'Video',
                value: widget.video!.name,
              ),
            if (widget.video != null && widget.subtitle != null)
              const SizedBox(height: 12),
            if (widget.subtitle != null)
              InfoTile(
                icon: Icons.subtitles_outlined,
                title: 'Subtitle',
                value: widget.subtitle!.name,
              ),
            const SizedBox(height: 20),
            Panel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'ភាសាគោលដៅ',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                  ),
                  const SizedBox(height: 10),
                  DropdownButtonFormField<String>(
                    initialValue: language,
                    dropdownColor: const Color(0xFF1A1F28),
                    decoration: const InputDecoration(
                      filled: true,
                      fillColor: Color(0xFF1A1F28),
                      border: OutlineInputBorder(borderSide: BorderSide.none),
                    ),
                    items: const [
                      'Khmer',
                      'English',
                      'Chinese',
                      'Thai',
                      'Vietnamese',
                    ]
                        .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                        .toList(),
                    onChanged: (value) {
                      setState(() => language = value ?? 'Khmer');
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            Panel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Subtitle / Script',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: controller,
                    minLines: 10,
                    maxLines: 18,
                    decoration: const InputDecoration(
                      hintText: 'បញ្ចូល subtitle ឬ script នៅទីនេះ…',
                      filled: true,
                      fillColor: Color(0xFF10141B),
                      border: OutlineInputBorder(borderSide: BorderSide.none),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              height: 58,
              child: FilledButton.icon(
                onPressed: showAiNotice,
                icon: const Icon(Icons.auto_awesome_rounded),
                label: Text(
                  'បកប្រែទៅ $language',
                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                ),
                style: FilledButton.styleFrom(
                  backgroundColor: PinkaAiApp.pink,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class Panel extends StatelessWidget {
  final Widget child;
  const Panel({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: PinkaAiApp.card,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: PinkaAiApp.border),
      ),
      child: child,
    );
  }
}

class InfoTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;

  const InfoTile({
    super.key,
    required this.icon,
    required this.title,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: PinkaAiApp.card,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: PinkaAiApp.border),
      ),
      child: Row(
        children: [
          Icon(icon, color: PinkaAiApp.pink),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: PinkaAiApp.secondary,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
