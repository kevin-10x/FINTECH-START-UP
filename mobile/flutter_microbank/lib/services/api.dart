import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const base = 'http://10.0.2.2:5000'; // emulator -> host

  static Future<bool> requestOtp(String phone) async {
    final res = await http.post(Uri.parse('$base/api/auth/request-otp'), headers: {'Content-Type': 'application/json'}, body: jsonEncode({'phone': phone}));
    return res.statusCode == 200;
  }

  static Future<dynamic> verifyOtp(String phone, String code) async {
    final res = await http.post(Uri.parse('$base/api/auth/verify-otp'), headers: {'Content-Type': 'application/json'}, body: jsonEncode({'phone': phone, 'code': code}));
    if (res.statusCode == 200) return jsonDecode(res.body);
    return null;
  }
}
