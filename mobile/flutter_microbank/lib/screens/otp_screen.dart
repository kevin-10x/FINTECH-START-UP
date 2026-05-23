import 'package:flutter/material.dart';
import '../services/api.dart';

class OtpScreen extends StatefulWidget {
  final String phone;
  const OtpScreen({super.key, required this.phone});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final TextEditingController codeController = TextEditingController();

  void verify() async {
    final code = codeController.text.trim();
    if (code.isEmpty) return;
    final resp = await ApiService.verifyOtp(widget.phone, code);
    if (resp != null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Login successful')));
      // TODO: navigate to dashboard
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Invalid OTP')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Verify OTP')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(children: [
          Text('OTP sent to ${widget.phone}'),
          const SizedBox(height: 16),
          TextField(controller: codeController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Enter OTP')),
          const SizedBox(height: 20),
          SizedBox(width: double.infinity, child: ElevatedButton(onPressed: verify, child: const Text('VERIFY'))),
        ]),
      ),
    );
  }
}
