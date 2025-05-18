import React, { useState, useEffect } from 'react';
import {
  Button,
  Table,
  Space,
  Modal,
  Form,
  Input,
  Upload,
  Select,
  message,
  Tag,
  Tooltip,
  Popconfirm,
  Row,
  Col,
  DatePicker,
  Switch
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined
} from '@ant-design/icons';
import api from '../../utils/api';
import dayjs from 'dayjs';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const { Option } = Select;
const { TextArea } = Input;

const News = () => {
  const [loading, setLoading] = useState(false);
  const [newsList, setNewsList] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [hospitalsList, setHospitalsList] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState(null);
  const [fileList, setFileList] = useState([]);

  // Rich text editor modules
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'link', 'image', 'align'
  ];

  useEffect(() => {
    fetchNews();
    fetchDoctors();
    fetchHospitals();
  }, [pagination.current, pagination.pageSize]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await api.get('/news/all', {
        params: {
          page: pagination.current,
          limit: pagination.pageSize
        }
      });
      setNewsList(response.data.news);
      setPagination({
        ...pagination,
        total: response.data.pagination.total
      });
    } catch (error) {
      console.error('Error fetching news:', error);
      message.error('Không thể tải danh sách tin tức');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/doctors');
      setDoctorsList(response.data.data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchHospitals = async () => {
    try {
      const response = await api.get('/hospitals');
      setHospitalsList(response.data.data.hospitals || []);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

  const handleTableChange = (pagination) => {
    setPagination({
      ...pagination,
      current: pagination.current
    });
  };

  const showModal = (record = null) => {
    setEditingNews(record);
    setIsModalVisible(true);
    
    if (record) {
      form.setFieldsValue({
        ...record,
        tags: record.tags ? record.tags.join(', ') : '',
        doctorId: record.author?._id || null,
        hospitalId: record.hospital?._id || null
      });
      
      // Set image preview if exists
      if (record.image && record.image.secureUrl) {
        setImageUrl(record.image.secureUrl);
        setFileList([{
          uid: '-1',
          name: 'image.png',
          status: 'done',
          url: record.image.secureUrl,
        }]);
      } else {
        setImageUrl(null);
        setFileList([]);
      }
    } else {
      form.resetFields();
      setImageUrl(null);
      setFileList([]);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingNews(null);
    form.resetFields();
    setImageUrl(null);
    setFileList([]);
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const formData = new FormData();

      // Add form fields to formData
      Object.keys(values).forEach(key => {
        if (key !== 'image' && values[key] !== undefined) {
          formData.append(key, values[key]);
        }
      });

      // Add image file if exists
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('image', fileList[0].originFileObj);
      }

      let response;
      if (editingNews) {
        response = await api.put(`/news/${editingNews._id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        message.success('Cập nhật tin tức thành công');
      } else {
        response = await api.post('/news', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        message.success('Tạo tin tức thành công');
      }

      setIsModalVisible(false);
      fetchNews();
    } catch (error) {
      console.error('Error saving news:', error);
      message.error('Lỗi khi lưu tin tức');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/news/${id}`);
      message.success('Xóa tin tức thành công');
      fetchNews();
    } catch (error) {
      console.error('Error deleting news:', error);
      message.error('Lỗi khi xóa tin tức');
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload
  const handleImageChange = ({ fileList }) => {
    const list = fileList.slice(-1);
    setFileList(list);
    
    if (list.length > 0 && list[0].status === 'done' && list[0].url) {
      setImageUrl(list[0].url);
    } else if (list.length > 0 && list[0].originFileObj) {
      getBase64(list[0].originFileObj, url => {
        setImageUrl(url);
      });
    } else {
      setImageUrl(null);
    }
  };

  const getBase64 = (file, callback) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(file);
  };

  const uploadButton = (
    <div>
      <UploadOutlined />
      <div style={{ marginTop: 8 }}>Tải lên</div>
    </div>
  );

  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <Tooltip title={text}>{text.length > 40 ? `${text.substring(0, 40)}...` : text}</Tooltip>,
    },
    {
      title: 'Tóm tắt',
      dataIndex: 'summary',
      key: 'summary',
      render: (text) => <Tooltip title={text}>{text.length > 40 ? `${text.substring(0, 40)}...` : text}</Tooltip>,
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      render: (category) => {
        let color;
        switch (category) {
          case 'general':
            color = 'blue';
            break;
          case 'medical':
            color = 'green';
            break;
          case 'hospital':
            color = 'purple';
            break;
          case 'doctor':
            color = 'red';
            break;
          case 'service':
            color = 'orange';
            break;
          default:
            color = 'default';
        }
        return <Tag color={color}>{category}</Tag>;
      }
    },
    {
      title: 'Tác giả (Bác sĩ)',
      dataIndex: ['author', 'user', 'fullName'],
      key: 'author',
      render: (text, record) => {
        if (record.author && record.author.user) {
          return `${record.author.title || ''} ${record.author.user.fullName}`;
        }
        return 'N/A';
      }
    },
    {
      title: 'Bệnh viện',
      dataIndex: ['hospital', 'name'],
      key: 'hospital',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Ngày đăng',
      dataIndex: 'publishDate',
      key: 'publishDate',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isPublished',
      key: 'isPublished',
      render: (isPublished) => (
        <Tag color={isPublished ? 'green' : 'red'}>
          {isPublished ? 'Đã đăng' : 'Nháp'}
        </Tag>
      ),
    },
    {
      title: 'Lượt xem',
      dataIndex: 'viewCount',
      key: 'viewCount',
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => window.open(`/tin-tuc/${record.slug}`, '_blank')}
          />
          <Button 
            icon={<EditOutlined />} 
            onClick={() => showModal(record)}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa tin tức này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Có"
            cancelText="Không"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Quản lý Tin tức</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
        >
          Tạo tin tức mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={newsList}
        rowKey="_id"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />

      <Modal
        title={editingNews ? "Cập nhật tin tức" : "Thêm tin tức mới"}
        open={isModalVisible}
        onCancel={handleCancel}
        width={1000}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            category: 'general',
            isPublished: true
          }}
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="title"
                label="Tiêu đề"
                rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
              >
                <Input placeholder="Nhập tiêu đề tin tức" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="category"
                label="Danh mục"
                rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
              >
                <Select placeholder="Chọn danh mục">
                  <Option value="general">Tin tức chung</Option>
                  <Option value="medical">Y tế - Sức khỏe</Option>
                  <Option value="hospital">Bệnh viện</Option>
                  <Option value="doctor">Bác sĩ</Option>
                  <Option value="service">Dịch vụ y tế</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="summary"
            label="Tóm tắt"
            rules={[{ required: true, message: 'Vui lòng nhập tóm tắt' }]}
          >
            <TextArea 
              placeholder="Nhập tóm tắt nội dung tin tức" 
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
          >
            <TextArea 
              placeholder="Nhập nội dung chi tiết tin tức..."
              autoSize={{ minRows: 6, maxRows: 20 }}
              style={{ height: 200, marginBottom: 40 }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="doctorId"
                label="Bác sĩ (Tác giả)"
              >
                <Select 
                  placeholder="Chọn bác sĩ liên quan" 
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {doctorsList.map(doctor => (
                    <Option key={doctor._id} value={doctor._id}>
                      {doctor.title} {doctor.user?.fullName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="hospitalId"
                label="Bệnh viện liên quan"
              >
                <Select 
                  placeholder="Chọn bệnh viện liên quan" 
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {hospitalsList.map(hospital => (
                    <Option key={hospital._id} value={hospital._id}>
                      {hospital.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tags"
                label="Thẻ"
              >
                <Input placeholder="Các thẻ cách nhau bởi dấu phẩy" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="isPublished"
                label="Trạng thái"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren="Đã đăng" 
                  unCheckedChildren="Nháp"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Ảnh đại diện">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleImageChange}
              beforeUpload={() => false}
              maxCount={1}
            >
              {fileList.length >= 1 ? null : uploadButton}
            </Upload>
            {imageUrl && (
              <img src={imageUrl} alt="Ảnh đại diện" style={{ width: '100%', maxHeight: 200 }} />
            )}
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={handleCancel}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingNews ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default News; 