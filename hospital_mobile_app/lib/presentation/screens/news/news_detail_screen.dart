import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/constants/app_constants.dart';
import '../../providers/news_provider.dart';
import '../../../domain/entities/news.dart';
import '../../widgets/common/full_screen_image_viewer.dart';

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

  void _openFullScreenImage() {
    if (_selectedNews?.imageUrl != null) {
      FullScreenImageViewer.show(
        context,
        _selectedNews!.imageUrl!,
        heroTag: 'news_image_${widget.newsId}',
        title: _selectedNews!.title,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _selectedNews == null
          ? const Center(child: CircularProgressIndicator())
          : CustomScrollView(
              slivers: [
                // Hero Image Header
                SliverAppBar(
                  expandedHeight: 280,
                  pinned: true,
                  backgroundColor: Colors.indigo.shade700,
                  actions: [
                    IconButton(
                      icon: const Icon(Icons.share),
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Tính năng chia sẻ sẽ sớm có mặt'),
                            duration: Duration(seconds: 2),
                          ),
                        );
                      },
                    ),
                  ],
                  flexibleSpace: FlexibleSpaceBar(
                    background: GestureDetector(
                      onTap: _openFullScreenImage,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          // News Image
                          if (_selectedNews!.imageUrl != null)
                            Hero(
                              tag: 'news_image_${widget.newsId}',
                              child: CachedNetworkImage(
                                imageUrl: _selectedNews!.imageUrl!,
                                fit: BoxFit.cover,
                                placeholder: (context, url) => Container(
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [Colors.indigo.shade300, Colors.indigo.shade600],
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                    ),
                                  ),
                                  child: const Center(
                                    child: CircularProgressIndicator(color: Colors.white),
                                  ),
                                ),
                                errorWidget: (context, url, error) => Container(
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [Colors.indigo.shade300, Colors.indigo.shade600],
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                    ),
                                  ),
                                  child: Icon(Icons.article, size: 80, color: Colors.white.withOpacity(0.5)),
                                ),
                              ),
                            )
                          else
                            Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [Colors.indigo.shade300, Colors.indigo.shade700],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                              ),
                              child: Icon(Icons.article, size: 80, color: Colors.white.withOpacity(0.5)),
                            ),
                          // Gradient Overlay
                          Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Colors.transparent,
                                  Colors.black.withOpacity(0.7),
                                ],
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                stops: const [0.3, 1.0],
                              ),
                            ),
                          ),
                          // Category Badge
                          Positioned(
                            left: 16,
                            bottom: 16,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: Colors.blue.withOpacity(0.9),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                _selectedNews!.category.toUpperCase(),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                          ),
                          // Tap hint
                          if (_selectedNews!.imageUrl != null)
                            Positioned(
                              right: 16,
                              bottom: 16,
                              child: Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: Colors.black.withOpacity(0.4),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(Icons.fullscreen, color: Colors.white, size: 20),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
                // Content
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(AppConstants.defaultPadding),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Title
                        Text(
                          _selectedNews!.title,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            height: 1.3,
                          ),
                        ),
                        const SizedBox(height: 12),
                        // Meta info row (date, views)
                        Row(
                          children: [
                            Icon(Icons.calendar_today, size: 16, color: Colors.grey.shade600),
                            const SizedBox(width: 6),
                            Text(
                              DateFormat('dd/MM/yyyy, HH:mm').format(_selectedNews!.createdAt),
                              style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
                            ),
                            const SizedBox(width: 16),
                            Icon(Icons.remove_red_eye_outlined, size: 16, color: Colors.grey.shade600),
                            const SizedBox(width: 6),
                            Text(
                              '${(_selectedNews!.createdAt.millisecondsSinceEpoch % 1000) + 100} lượt xem',
                              style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        // Tags
                        _buildTagsSection(),
                        const SizedBox(height: 16),
                        Divider(color: Colors.grey.shade300),
                        const SizedBox(height: 16),
                        // Content
                        Text(
                          _selectedNews!.content,
                          style: TextStyle(
                            fontSize: 16,
                            height: 1.7,
                            color: Colors.grey.shade800,
                          ),
                        ),
                        const SizedBox(height: 32),
                        const Divider(),
                        const SizedBox(height: 20),
                        // Related News
                        const Text(
                          'Tin Tức Liên Quan',
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 16),
                        _buildRelatedNews(),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildRelatedNews() {
    return Consumer<NewsProvider>(
      builder: (context, newsProvider, child) {
        final relatedNews = newsProvider.news
            .where((n) => n.id != widget.newsId && n.category == _selectedNews!.category)
            .take(3)
            .toList();

        if (relatedNews.isEmpty) {
          return Text(
            'Không có tin tức liên quan',
            style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
          );
        }

        return Column(
          children: relatedNews.map((news) => _buildRelatedNewsCard(news)).toList(),
        );
      },
    );
  }

  Widget _buildRelatedNewsCard(News news) {
    return InkWell(
      onTap: () {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => NewsDetailScreen(newsId: news.id),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            ClipRRect(
              borderRadius: const BorderRadius.horizontal(left: Radius.circular(12)),
              child: news.imageUrl != null
                  ? CachedNetworkImage(
                      imageUrl: news.imageUrl!,
                      width: 100,
                      height: 100,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        width: 100,
                        height: 100,
                        color: Colors.grey.shade200,
                        child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                      ),
                      errorWidget: (context, url, error) => Container(
                        width: 100,
                        height: 100,
                        color: Colors.grey.shade200,
                        child: const Icon(Icons.article, size: 30, color: Colors.grey),
                      ),
                    )
                  : Container(
                      width: 100,
                      height: 100,
                      color: Colors.grey.shade200,
                      child: const Icon(Icons.article, size: 30, color: Colors.grey),
                    ),
            ),
            // Content
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      news.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, height: 1.3),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.access_time, size: 12, color: Colors.grey.shade500),
                        const SizedBox(width: 4),
                        Text(
                          DateFormat('dd/MM/yyyy').format(news.createdAt),
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTagsSection() {
    // Generate tags based on category
    final List<String> tags = [
      _selectedNews!.category,
      'Sức khỏe',
      'Bệnh viện',
      if (_selectedNews!.category == 'Tin tức') 'Thời sự',
      if (_selectedNews!.category == 'Sức khỏe') 'Y tế',
    ];

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: tags.map((tag) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.shade300),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.tag, size: 14, color: Colors.grey.shade600),
            const SizedBox(width: 4),
            Text(
              tag,
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey.shade700,
              ),
            ),
          ],
        ),
      )).toList(),
    );
  }
}
