import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_constants.dart';
import '../../providers/news_provider.dart';
import '../../../domain/entities/news.dart';

class NewsDetailScreen extends StatefulWidget {
  final String newsId;

  const NewsDetailScreen({
    super.key,
    required this.newsId,
  });

  @override
  State<NewsDetailScreen> createState() => _NewsDetailScreenState();
}

class _NewsDetailScreenState extends State<NewsDetailScreen> {
  News? _selectedNews;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadNewsDetail();
    });
  }

  void _loadNewsDetail() {
    final newsProvider = context.read<NewsProvider>();
    final news = newsProvider.news.firstWhere(
      (n) => n.id == widget.newsId,
      orElse: () => newsProvider.news.first,
    );
    setState(() {
      _selectedNews = news;
    });
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isSmallScreen = screenWidth < 360;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Chi Tiết Tin Tức'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () {
              // Share functionality
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Tính năng chia sẻ sẽ sớm có mặt'),
                  duration: Duration(seconds: 2),
                ),
              );
            },
          ),
        ],
      ),
      body: _selectedNews == null
          ? const Center(
              child: CircularProgressIndicator(),
            )
          : SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Image
                  if (_selectedNews!.imageUrl != null)
                    Image.network(
                      _selectedNews!.imageUrl!,
                      width: double.infinity,
                      height: isSmallScreen ? 200 : 250,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          width: double.infinity,
                          height: isSmallScreen ? 200 : 250,
                          color: Colors.grey[300],
                          child: const Icon(
                            Icons.article,
                            size: 80,
                            color: Colors.grey,
                          ),
                        );
                      },
                    ),

                  // Content
                  Padding(
                    padding: EdgeInsets.all(
                      isSmallScreen ? 16.0 : AppConstants.defaultPadding,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Category badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.blue.withAlpha(26),
                            borderRadius: BorderRadius.circular(
                              AppConstants.borderRadius / 2,
                            ),
                          ),
                          child: Text(
                            _selectedNews!.category.toUpperCase(),
                            style: TextStyle(
                              fontSize: isSmallScreen ? 11 : 12,
                              fontWeight: FontWeight.bold,
                              color: Colors.blue[700],
                            ),
                          ),
                        ),

                        SizedBox(height: isSmallScreen ? 12 : 16),

                        // Title
                        Text(
                          _selectedNews!.title,
                          style: TextStyle(
                            fontSize: isSmallScreen ? 22 : 26,
                            fontWeight: FontWeight.bold,
                            height: 1.3,
                          ),
                        ),

                        SizedBox(height: isSmallScreen ? 10 : 12),

                        // Date
                        Row(
                          children: [
                            Icon(
                              Icons.calendar_today,
                              size: isSmallScreen ? 16 : 18,
                              color: Colors.grey[600],
                            ),
                            const SizedBox(width: 6),
                            Text(
                              DateFormat('dd/MM/yyyy, HH:mm')
                                  .format(_selectedNews!.createdAt),
                              style: TextStyle(
                                fontSize: isSmallScreen ? 13 : 14,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),

                        SizedBox(height: isSmallScreen ? 20 : 24),

                        // Divider
                        Divider(
                          thickness: 1,
                          color: Colors.grey[300],
                        ),

                        SizedBox(height: isSmallScreen ? 16 : 20),

                        // Content
                        Text(
                          _selectedNews!.content,
                          style: TextStyle(
                            fontSize: isSmallScreen ? 15 : 16,
                            height: 1.6,
                            color: Colors.grey[800],
                          ),
                        ),

                        SizedBox(height: isSmallScreen ? 24 : 32),

                        // Related news section
                        const Divider(thickness: 1),

                        SizedBox(height: isSmallScreen ? 16 : 20),

                        Text(
                          'Tin Tức Liên Quan',
                          style: TextStyle(
                            fontSize: isSmallScreen ? 18 : 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),

                        SizedBox(height: isSmallScreen ? 12 : 16),

                        Consumer<NewsProvider>(
                          builder: (context, newsProvider, child) {
                            final relatedNews = newsProvider.news
                                .where((n) =>
                                    n.id != widget.newsId &&
                                    n.category == _selectedNews!.category)
                                .take(3)
                                .toList();

                            if (relatedNews.isEmpty) {
                              return Text(
                                'Không có tin tức liên quan',
                                style: TextStyle(
                                  fontSize: isSmallScreen ? 13 : 14,
                                  color: Colors.grey[600],
                                ),
                              );
                            }

                            return Column(
                              children: relatedNews.map((news) {
                                return InkWell(
                                  onTap: () {
                                    Navigator.pushReplacement(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) =>
                                            NewsDetailScreen(newsId: news.id),
                                      ),
                                    );
                                  },
                                  child: Container(
                                    margin: const EdgeInsets.only(bottom: 12),
                                    decoration: BoxDecoration(
                                      border: Border.all(
                                        color: Colors.grey[300]!,
                                      ),
                                      borderRadius: BorderRadius.circular(
                                        AppConstants.borderRadius,
                                      ),
                                    ),
                                    child: Row(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        if (news.imageUrl != null)
                                          ClipRRect(
                                            borderRadius:
                                                const BorderRadius.horizontal(
                                              left: Radius.circular(
                                                AppConstants.borderRadius,
                                              ),
                                            ),
                                            child: Image.network(
                                              news.imageUrl!,
                                              width: isSmallScreen ? 80 : 90,
                                              height: isSmallScreen ? 80 : 90,
                                              fit: BoxFit.cover,
                                              errorBuilder: (context, error,
                                                  stackTrace) {
                                                return Container(
                                                  width: isSmallScreen ? 80 : 90,
                                                  height:
                                                      isSmallScreen ? 80 : 90,
                                                  color: Colors.grey[300],
                                                  child: const Icon(
                                                    Icons.article,
                                                    size: 30,
                                                  ),
                                                );
                                              },
                                            ),
                                          ),
                                        Expanded(
                                          child: Padding(
                                            padding: EdgeInsets.all(
                                              isSmallScreen ? 10.0 : 12.0,
                                            ),
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  news.title,
                                                  maxLines: 2,
                                                  overflow:
                                                      TextOverflow.ellipsis,
                                                  style: TextStyle(
                                                    fontSize:
                                                        isSmallScreen ? 13 : 14,
                                                    fontWeight: FontWeight.w600,
                                                    height: 1.3,
                                                  ),
                                                ),
                                                const SizedBox(height: 4),
                                                Text(
                                                  DateFormat('dd/MM/yyyy')
                                                      .format(news.createdAt),
                                                  style: TextStyle(
                                                    fontSize:
                                                        isSmallScreen ? 11 : 12,
                                                    color: Colors.grey[600],
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              }).toList(),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
