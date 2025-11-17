import 'package:flutter/material.dart';
import '../../domain/entities/review.dart';
import '../../domain/repositories/review_repository.dart';

class ReviewProvider with ChangeNotifier {
  final ReviewRepository repository;

  ReviewProvider({required this.repository});

  List<Review> _reviews = [];
  bool _isLoading = false;
  String? _error;

  List<Review> get reviews => _reviews;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchReviews({int? limit, String? sort}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _reviews = await repository.getReviews(
        limit: limit,
        sort: sort,
      );
      _error = null;
    } catch (e) {
      _error = e.toString();
      _reviews = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshReviews() async {
    await fetchReviews(limit: 4, sort: '-rating');
  }
}
