import 'package:flutter/material.dart';
import '../../domain/entities/news.dart';
import '../../domain/repositories/news_repository.dart';

class NewsProvider with ChangeNotifier {
  final NewsRepository repository;

  NewsProvider({required this.repository});

  List<News> _news = [];
  bool _isLoading = false;
  String? _error;

  List<News> get news => _news;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchNews({int? limit}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _news = await repository.getNews(limit: limit);
      _error = null;
    } catch (e) {
      _error = e.toString();
      _news = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshNews() async {
    await fetchNews(limit: 3);
  }
}
