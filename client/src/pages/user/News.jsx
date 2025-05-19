import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Pagination, Tag, Input, Spin, Empty, Select } from 'antd';
import { SearchOutlined, ClockCircleOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../../utils/api';
import dayjs from 'dayjs';
import AOS from 'aos';
import 'aos/dist/aos.css';

const { Search } = Input;
const { Option } = Select;

const News = () => {
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 9,
    total: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  
  // Initialize AOS animation library
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: 'ease-out-cubic'
    });
  }, []);
  
  useEffect(() => {
    fetchNews();
  }, [pagination.current, searchTerm, category]);
  
  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await api.get('/news/all', {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
          search: searchTerm,
          category: category,
          isPublished: true
        }
      });
      
      setNews(response.data.news);
      setPagination({
        ...pagination,
        total: response.data.pagination.total
      });
    } catch (error) {
      console.error('Lỗi khi tải tin tức:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (value) => {
    setSearchTerm(value);
    setPagination({ ...pagination, current: 1 });
  };
  
  const handleCategoryChange = (value) => {
    setCategory(value);
    setPagination({ ...pagination, current: 1 });
  };
  
  const handlePageChange = (page) => {
    setPagination({ ...pagination, current: page });
  };
  
  // Render category tag
  const getCategoryTag = (category) => {
    let color = 'blue';
    let text = 'Tin tức chung';
    
    switch (category) {
      case 'medical':
        color = 'green';
        text = 'Y tế - Sức khỏe';
        break;
      case 'hospital':
        color = 'purple';
        text = 'Bệnh viện';
        break;
      case 'doctor':
        color = 'red';
        text = 'Bác sĩ';
        break;
      case 'service':
        color = 'orange';
        text = 'Dịch vụ y tế';
        break;
      default:
        break;
    }
    
    return <Tag color={color}>{text}</Tag>;
  };
  
  return (
    <div className="bg-white py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8" data-aos="fade-up">
          Tin tức & Sự kiện
        </h1>
        
        <div className="mb-8" data-aos="fade-up" data-aos-delay="100">
          <Row gutter={[16, 16]} className="mb-4">
            <Col xs={24} sm={16} md={18}>
              <Search
                placeholder="Tìm kiếm tin tức..."
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                allowClear
              />
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Select
                placeholder="Danh mục"
                style={{ width: '100%' }}
                size="large"
                onChange={handleCategoryChange}
                allowClear
              >
                <Option value="">Tất cả</Option>
                <Option value="general">Tin tức chung</Option>
                <Option value="medical">Y tế - Sức khỏe</Option>
                <Option value="hospital">Bệnh viện</Option>
                <Option value="doctor">Bác sĩ</Option>
                <Option value="service">Dịch vụ y tế</Option>
              </Select>
            </Col>
          </Row>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20" data-aos="fade-up">
            <Spin size="large" />
          </div>
        ) : news.length > 0 ? (
          <>
            <Row gutter={[24, 24]}>
              {news.map((item, index) => (
                <Col xs={24} sm={12} md={8} key={item._id} data-aos="fade-up" data-aos-delay={index % 3 * 100}>
                  <Link to={`/tin-tuc/${item.slug}`}>
                    <Card 
                      hoverable 
                      cover={
                        item.image && item.image.secureUrl ? (
                          <div className="overflow-hidden h-48">
                            <img
                              alt={item.title}
                              src={item.image.secureUrl}
                              className="w-full h-full object-cover transition-transform hover:scale-105"
                            />
                          </div>
                        ) : (
                          <div className="bg-gray-200 h-48 flex items-center justify-center">
                            <span className="text-gray-500">Không có ảnh</span>
                          </div>
                        )
                      }
                      className="h-full flex flex-col"
                    >
                      <div className="flex justify-between items-center mb-2">
                        {getCategoryTag(item.category)}
                        <div className="flex items-center text-gray-500 text-sm">
                          <EyeOutlined className="mr-1" /> {item.viewCount}
                        </div>
                      </div>
                      
                      <h2 className="text-xl font-semibold mb-2 line-clamp-2">
                        {item.title}
                      </h2>
                      
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {item.summary}
                      </p>
                      
                      <div className="mt-auto flex justify-between items-center text-gray-500 text-sm">
                        <div>
                          {item.author && item.author.user ? (
                            <span>
                              {item.author.title} {item.author.user.fullName}
                            </span>
                          ) : item.hospital ? (
                            <span>{item.hospital.name}</span>
                          ) : (
                            <span>Admin</span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <ClockCircleOutlined className="mr-1" />
                          {dayjs(item.publishDate).format('DD/MM/YYYY')}
                        </div>
                      </div>
                    </Card>
                  </Link>
                </Col>
              ))}
            </Row>
            
            <div className="flex justify-center mt-8" data-aos="fade-up" data-aos-delay="200">
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={handlePageChange}
                showSizeChanger={false}
              />
            </div>
          </>
        ) : (
          <div data-aos="fade-up">
          <Empty 
            description="Không tìm thấy tin tức nào" 
            className="py-20"
          />
          </div>
        )}
      </div>
    </div>
  );
};

export default News; 