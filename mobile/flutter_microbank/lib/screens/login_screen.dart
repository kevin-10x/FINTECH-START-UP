import 'package:flutter/material.dart';
import '../services/api.dart';
import 'otp_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController phoneController = TextEditingController();

  void requestOtp() async {
    final phone = phoneController.text.trim();
    if (phone.isEmpty) return;
    await ApiService.requestOtp(phone);
    Navigator.push(context, MaterialPageRoute(builder: (_) => OtpScreen(phone: phone)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('AI MicroBank', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            TextField(controller: phoneController, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Phone Number')),
            const SizedBox(height: 20),
            SizedBox(width: double.infinity, child: ElevatedButton(onPressed: requestOtp, child: const Text('REQUEST OTP'))),
          ],
        ),
      ),
    );
  }
}
