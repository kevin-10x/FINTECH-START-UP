import 'package:flutter/material.dart';
import 'screens/login_screen.dart';

void main() {
  runApp(const MicroBankApp());
}

class MicroBankApp extends StatelessWidget {
  const MicroBankApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AI MicroBank',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(primarySwatch: Colors.green),
      home: const LoginScreen(),
    );
  }
}
