import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Row, Col, Breadcrumb, Tag, Spin, Card, Divider, Typography, Avatar, Button } from 'antd';
import { 
  ClockCircleOutlined, 
  EyeOutlined, 
  TagOutlined,
  HomeOutlined,
  UserOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';
import api from '../../utils/api';
import dayjs from 'dayjs';
import NotFound from './NotFound';

const { Title, Paragraph, Text } = Typography;

const NewsDetail = () => {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState(null);
  const [relatedNews, setRelatedNews] = useState([]);
  const [notFound, setNotFound] = useState(false);
  
  useEffect(() => {
    fetchNewsDetail();
  }, [slug]);
  
  const fetchNewsDetail = async () => {
    try {
      setLoading(true);
      
      // Remove the params as they may be causing conflicts with URL parameters
      const response = await api.get(`/news/news/${slug}`);
      
      setNews(response.data.news);
      
      // Nếu tìm thấy tin tức, tải tin tức liên quan
      if (response.data.news) {
        fetchRelatedNews(response.data.news.category, response.data.news._id);
      }
    } catch (error) {
      console.error('Lỗi khi tải chi tiết tin tức:', error);
      if (error.response && (error.response.status === 404 || error.response.status === 500)) {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRelatedNews = async (category, currentId) => {
    try {
      const response = await api.get('/news/all', {
        params: {
          category,
          limit: 3,
          isPublished: true
        }
      });
      
      // Lọc bỏ tin tức hiện tại
      const filtered = response.data.news.filter(item => item._id !== currentId);
      setRelatedNews(filtered.slice(0, 3));
    } catch (error) {
      console.error('Lỗi khi tải tin tức liên quan:', error);
    }
  };
  
  if (notFound) {
    return <NotFound />;
  }
  
  // Helper function to get category text and color
  const getCategoryInfo = (category) => {
    const categoryMap = {
      general: { text: 'Tin tức chung', color: 'blue' },
      medical: { text: 'Y tế - Sức khỏe', color: 'green' },
      hospital: { text: 'Bệnh viện', color: 'purple' },
      doctor: { text: 'Bác sĩ', color: 'red' },
      service: { text: 'Dịch vụ y tế', color: 'orange' }
    };
    
    return categoryMap[category] || { text: 'Tin tức chung', color: 'blue' };
  };
  
  return (
    <div className="bg-white py-10">
      <div className="container mx-auto px-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : news ? (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <div className="mb-4">
                <Breadcrumb items={[
                  { title: <Link to="/"><HomeOutlined /> Trang chủ</Link> },
                  { title: <Link to="/tin-tuc">Tin tức</Link> },
                  { title: news.title }
                ]} />
              </div>
              
              <div className="mb-6">
                <Tag color={getCategoryInfo(news.category).color}>
                  {getCategoryInfo(news.category).text}
                </Tag>
                
                <Title level={1} className="my-4">
                  {news.title}
                </Title>
                
                <div className="flex flex-wrap gap-4 text-gray-500 mb-4">
                  <div className="flex items-center">
                    <ClockCircleOutlined className="mr-1" />
                    {dayjs(news.publishDate).format('DD/MM/YYYY')}
                  </div>
                  
                  <div className="flex items-center">
                    <EyeOutlined className="mr-1" />
                    {news.viewCount} lượt xem
                  </div>
                  
                  {news.author && news.author.user && (
                    <div className="flex items-center">
                      <UserOutlined className="mr-1" />
                      {news.author.title} {news.author.user.fullName}
                    </div>
                  )}
                  
                  {news.hospital && (
                    <div className="flex items-center">
                      <MedicineBoxOutlined className="mr-1" />
                      {news.hospital.name}
                    </div>
                  )}
                </div>
              </div>
              
              {news.image && news.image.secureUrl && (
                <div className="mb-6">
                  <img 
                    src={news.image.secureUrl} 
                    alt={news.title} 
                    className="w-full rounded-lg max-h-96 object-cover"
                  />
                </div>
              )}
              
              <div className="mb-6">
                <Paragraph className="text-lg font-medium mb-6">
                  {news.summary}
                </Paragraph>
                
                <div 
                  className="news-content"
                  dangerouslySetInnerHTML={{ __html: news.content }}
                />
              </div>
              
              {news.tags && news.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  <TagOutlined className="mr-1" />
                  {news.tags.map((tag, index) => (
                    <Tag key={index}>{tag}</Tag>
                  ))}
                </div>
              )}
              
              <Divider />
              
              {news.author && news.author.user && (
                <div className="mb-8">
                  <Card variant="borderless" className="bg-gray-50">
                    <div className="flex items-center mb-4">
                      <Avatar 
                        size={64} 
                        src={news.author.user.avatar?.url}
                        icon={!news.author.user.avatar?.url && <UserOutlined />}
                      />
                      <div className="ml-4">
                        <Title level={4} className="m-0">
                          {news.author.title} {news.author.user.fullName}
                        </Title>
                        <Text className="text-gray-500">
                          {news.author.specialtyId?.name || 'Bác sĩ'}
                        </Text>
                      </div>
                    </div>
                    
                    <Paragraph className="mb-2">
                      {news.author.description || 'Bác sĩ tại bệnh viện của chúng tôi.'}
                    </Paragraph>
                    
                    <Button type="primary">
                      <Link to={`/doctors/${news.author._id}`}>
                        Xem thông tin bác sĩ
                      </Link>
                    </Button>
                  </Card>
                </div>
              )}
              
              {news.hospital && (
                <div className="mb-8">
                  <Card variant="borderless" className="bg-gray-50">
                    <div className="flex items-center mb-4">
                      <Avatar 
                        size={64} 
                        src={news.hospital.imageUrl}
                        icon={!news.hospital.imageUrl && <MedicineBoxOutlined />}
                      />
                      <div className="ml-4">
                        <Title level={4} className="m-0">
                          {news.hospital.name}
                        </Title>
                        <Text className="text-gray-500">
                          {news.hospital.address}
                        </Text>
                      </div>
                    </div>
                    
                    <Paragraph className="mb-2">
                      {news.hospital.description || 'Bệnh viện chất lượng cao với đội ngũ y bác sĩ chuyên nghiệp.'}
                    </Paragraph>
                    
                    <Button type="primary">
                      <Link to={`/branches/${news.hospital._id}`}>
                        Xem thông tin bệnh viện
                      </Link>
                    </Button>
                  </Card>
                </div>
              )}
            </Col>
            
            <Col xs={24} lg={8}>
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <Title level={4} className="mb-4">Tin tức liên quan</Title>
                
                {relatedNews.length > 0 ? (
                  <div className="space-y-4">
                    {relatedNews.map(item => (
                      <Link to={`/news/${item.slug}`} key={item._id}>
                        <Card 
                          hoverable 
                          className="mb-4"
                          cover={
                            item.image && item.image.secureUrl ? (
                              <img
                                alt={item.title}
                                src={item.image.secureUrl}
                                className="h-40 object-cover"
                              />
                            ) : null
                          }
                        >
                          <Tag color={getCategoryInfo(item.category).color} className="mb-2">
                            {getCategoryInfo(item.category).text}
                          </Tag>
                          
                          <Title level={5} className="mb-2 line-clamp-2">
                            {item.title}
                          </Title>
                          
                          <div className="flex justify-between text-gray-500 text-sm">
                            <div className="flex items-center">
                              <ClockCircleOutlined className="mr-1" />
                              {dayjs(item.publishDate).format('DD/MM/YYYY')}
                            </div>
                            <div className="flex items-center">
                              <EyeOutlined className="mr-1" />
                              {item.viewCount}
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Paragraph className="text-gray-500">
                    Không có tin tức liên quan.
                  </Paragraph>
                )}
                
                <div className="text-center mt-4">
                  <Button type="primary">
                    <Link to="/tin-tuc">Xem tất cả tin tức</Link>
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        ) : (
          <NotFound />
        )}
      </div>
    </div>
  );
};

export default NewsDetail; 