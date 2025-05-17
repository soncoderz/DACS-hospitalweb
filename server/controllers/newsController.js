const News = require('../models/News');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const { cloudinary, uploadImage, deleteImage } = require('../config/cloudinary');
const slugify = require('slugify');

/**
 * Tạo tin tức mới
 * @route POST /api/news
 * @access Admin
 */
exports.createNews = async (req, res) => {
  try {
    const { title, content, summary, category, tags, hospitalId, doctorId, isPublished } = req.body;
    
    // Tạo slug từ tiêu đề
    let slug = slugify(title, {
      lower: true,
      strict: true,
      locale: 'vi',
      remove: /[*+~.()'"!:@]/g
    });
    
    // Kiểm tra slug đã tồn tại chưa
    const existingNews = await News.findOne({ slug });
    if (existingNews) {
      // Nếu slug đã tồn tại, thêm timestamp vào slug
      slug = `${slug}-${Date.now()}`;
    }
    
    let imageData = null;
    
    // Xử lý upload ảnh nếu có
    if (req.file) {
      try {
        // Convert buffer to base64 string for Cloudinary upload
        const base64Image = req.file.buffer.toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;
        
        // Upload to Cloudinary
        imageData = await uploadImage(dataURI, 'news');
      } catch (error) {
        console.error('Lỗi khi upload ảnh:', error);
        return res.status(500).json({ message: 'Không thể tải ảnh lên', error: error.message });
      }
    }
    
    // Tạo tin tức mới
    const newsItem = new News({
      title,
      content,
      summary,
      slug,
      category: category || 'general',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      publishDate: new Date(),
      isPublished: isPublished !== undefined ? isPublished : true,
      hospital: hospitalId || null,
      author: doctorId || null,
      image: imageData
    });
    
    await newsItem.save();
    
    res.status(201).json({
      message: 'Tạo tin tức thành công',
      news: newsItem
    });
  } catch (error) {
    console.error('Lỗi tạo tin tức:', error);
    res.status(500).json({ message: 'Lỗi tạo tin tức', error: error.message });
  }
};

/**
 * Lấy danh sách tin tức (có phân trang và lọc)
 * @route GET /api/news
 * @access Public
 */
exports.getNews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Thêm các bộ lọc
    if (req.query.category) filter.category = req.query.category;
    if (req.query.hospitalId) filter.hospital = req.query.hospitalId;
    if (req.query.doctorId) filter.author = req.query.doctorId;
    if (req.query.isPublished) filter.isPublished = req.query.isPublished === 'true';
    
    // Tìm kiếm theo từ khóa
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }
    
    // Tính tổng số tin tức
    const total = await News.countDocuments(filter);
    
    // Lấy danh sách tin tức với phân trang
    const news = await News.find(filter)
      .sort({ publishDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'title user')
      .populate({
        path: 'author',
        populate: {
          path: 'user',
          select: 'fullName avatar'
        }
      })
      .populate('hospital', 'name image');
    
    res.status(200).json({
      news,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách tin tức:', error);
    res.status(500).json({ message: 'Lỗi lấy danh sách tin tức', error: error.message });
  }
};

/**
 * Lấy chi tiết tin tức theo ID hoặc slug
 * @route GET /api/news/:id
 * @access Public
 */
exports.getNewsById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if id is a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    // Create query based on whether id is a valid ObjectId
    let query;
    if (isValidObjectId) {
      query = { $or: [{ _id: id }, { slug: id }] };
    } else {
      query = { slug: id };
    }
    
    // Find news item
    const newsItem = await News.findOne(query)
      .populate('author', 'title user')
      .populate({
        path: 'author',
        populate: {
          path: 'user',
          select: 'fullName avatar'
        }
      })
      .populate('hospital', 'name description imageUrl');
    
    if (!newsItem) {
      return res.status(404).json({ message: 'Không tìm thấy tin tức' });
    }
    
    // Tăng lượt xem
    newsItem.viewCount += 1;
    await newsItem.save();
    
    res.status(200).json({ news: newsItem });
  } catch (error) {
    console.error('Lỗi lấy chi tiết tin tức:', error);
    res.status(500).json({ message: 'Lỗi lấy chi tiết tin tức', error: error.message });
  }
};

/**
 * Cập nhật tin tức
 * @route PUT /api/news/:id
 * @access Admin
 */
exports.updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, summary, category, tags, hospitalId, doctorId, isPublished } = req.body;
    
    // Tìm tin tức cần cập nhật
    const newsItem = await News.findById(id);
    if (!newsItem) {
      return res.status(404).json({ message: 'Không tìm thấy tin tức' });
    }
    
    // Cập nhật slug nếu tiêu đề thay đổi
    if (title && title !== newsItem.title) {
      let slug = slugify(title, {
        lower: true,
        strict: true,
        locale: 'vi',
        remove: /[*+~.()'"!:@]/g
      });
      
      // Kiểm tra slug đã tồn tại chưa
      const existingNews = await News.findOne({ slug, _id: { $ne: id } });
      if (existingNews) {
        // Nếu slug đã tồn tại, thêm timestamp vào slug
        slug = `${slug}-${Date.now()}`;
      }
      
      newsItem.slug = slug;
    }
    
    // Xử lý upload ảnh mới nếu có
    if (req.file) {
      try {
        // Xóa ảnh cũ nếu có
        if (newsItem.image && newsItem.image.publicId) {
          await deleteImage(newsItem.image.publicId);
        }
        
        // Convert buffer to base64 string for Cloudinary upload
        const base64Image = req.file.buffer.toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;
        
        // Upload to Cloudinary
        const imageData = await uploadImage(dataURI, 'news');
        newsItem.image = imageData;
      } catch (error) {
        console.error('Lỗi khi upload ảnh:', error);
        return res.status(500).json({ message: 'Không thể tải ảnh lên', error: error.message });
      }
    }
    
    // Cập nhật thông tin
    if (title) newsItem.title = title;
    if (content) newsItem.content = content;
    if (summary) newsItem.summary = summary;
    if (category) newsItem.category = category;
    if (tags) newsItem.tags = tags.split(',').map(tag => tag.trim());
    if (hospitalId !== undefined) newsItem.hospital = hospitalId || null;
    if (doctorId !== undefined) newsItem.author = doctorId || null;
    if (isPublished !== undefined) newsItem.isPublished = isPublished;
    
    await newsItem.save();
    
    res.status(200).json({
      message: 'Cập nhật tin tức thành công',
      news: newsItem
    });
  } catch (error) {
    console.error('Lỗi cập nhật tin tức:', error);
    res.status(500).json({ message: 'Lỗi cập nhật tin tức', error: error.message });
  }
};

/**
 * Xóa tin tức
 * @route DELETE /api/news/:id
 * @access Admin
 */
exports.deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Tìm tin tức cần xóa
    const newsItem = await News.findById(id);
    if (!newsItem) {
      return res.status(404).json({ message: 'Không tìm thấy tin tức' });
    }
    
    // Xóa ảnh từ Cloudinary nếu có
    if (newsItem.image && newsItem.image.publicId) {
      await deleteImage(newsItem.image.publicId);
    }
    
    // Xóa tin tức
    await News.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Xóa tin tức thành công' });
  } catch (error) {
    console.error('Lỗi xóa tin tức:', error);
    res.status(500).json({ message: 'Lỗi xóa tin tức', error: error.message });
  }
}; 