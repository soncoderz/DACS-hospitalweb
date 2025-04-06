import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Form, Button, Input, Select, DatePicker, Checkbox } from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { toastError, toastSuccess } from '../utils/toast';

dayjs.extend(customParseFormat);

const Register = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    
    try {
      // Ensure proper date formatting for iOS
      const formattedDate = values.dateOfBirth ? dayjs(values.dateOfBirth).format('YYYY-MM-DD') : null;
      
      const formData = {
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        password: values.password,
        dateOfBirth: formattedDate,
        gender: values.gender,
        address: values.address
      };

      console.log('Submitting registration form:', {
        ...formData,
        password: '[HIDDEN]'
      });
      
      const response = await api.post('/auth/register', formData);
      
      if (response.data.success) {
        toastSuccess('Đăng ký thành công! Vui lòng xác thực email của bạn.');
        navigate('/need-verification', { 
          state: { email: values.email }
        });
      } else {
        toastError(response.data.message || 'Đăng ký không thành công');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response) {
        const { data } = error.response;
        
        if (data.field) {
          form.setFields([{
            name: data.field,
            errors: [data.message]
          }]);
          toastError(data.message);
        } else if (data.errors) {
          Object.keys(data.errors).forEach(field => {
            form.setFields([{
              name: field,
              errors: [data.errors[field]]
            }]);
          });
          toastError('Vui lòng kiểm tra lại thông tin đăng ký');
        } else {
          toastError(data.message || 'Đăng ký không thành công');
        }
      } else if (error.request) {
        toastError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else {
        toastError('Đăng ký không thành công. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Disallow future dates
  const disabledDate = (current) => {
    return current && current > dayjs().endOf('day');
  };

  return (
    <div className="form-section">
      <div className="form-header">
        <h2>Đăng Ký</h2>
        <p className="form-description">Tạo tài khoản để đặt lịch khám và quản lý hồ sơ sức khỏe</p>
      </div>

      <Form
        form={form}
        onFinish={onFinish}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          name="fullName"
          label="Họ và Tên"
          rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
        >
          <Input placeholder="Nhập họ và tên" size="large" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Vui lòng nhập email' },
            { type: 'email', message: 'Email không hợp lệ' }
          ]}
        >
          <Input placeholder="Nhập địa chỉ email" size="large" />
        </Form.Item>

        <Form.Item
          name="phoneNumber"
          label="Số Điện Thoại"
          rules={[
            { required: true, message: 'Vui lòng nhập số điện thoại' },
            { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' }
          ]}
        >
          <Input placeholder="Nhập số điện thoại" size="large" />
        </Form.Item>

        <Form.Item
          name="dateOfBirth"
          label="Ngày Sinh"
          rules={[{ required: true, message: 'Vui lòng chọn ngày sinh' }]}
        >
          <DatePicker 
            size="large" 
            style={{ width: '100%' }}
            placeholder="Chọn ngày sinh"
            format="DD/MM/YYYY"
            disabledDate={disabledDate}
            inputReadOnly={true}
          />
        </Form.Item>

        <Form.Item
          name="gender"
          label="Giới Tính"
          rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
        >
          <Select size="large" placeholder="Chọn giới tính">
            <Select.Option value="male">Nam</Select.Option>
            <Select.Option value="female">Nữ</Select.Option>
            <Select.Option value="other">Khác</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="address"
          label="Địa Chỉ"
        >
          <Input placeholder="Nhập địa chỉ (không bắt buộc)" size="large" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Mật Khẩu"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu' },
            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
          ]}
        >
          <Input.Password placeholder="Tạo mật khẩu" size="large" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Xác Nhận Mật Khẩu"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Vui lòng xác nhận mật khẩu' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Mật khẩu không khớp'));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Nhập lại mật khẩu" size="large" />
        </Form.Item>

        <Form.Item
          name="acceptTerms"
          valuePropName="checked"
          rules={[
            { 
              validator: (_, value) =>
                value ? Promise.resolve() : Promise.reject(new Error('Bạn phải đồng ý với các điều khoản và điều kiện')),
            },
          ]}
        >
          <Checkbox>
            Tôi đồng ý với <Link to="/terms">Điều khoản dịch vụ</Link> và <Link to="/privacy">Chính sách bảo mật</Link>
          </Checkbox>
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            className="btn btn-primary btn-block" 
            loading={loading}
            size="large"
          >
            {loading ? 'Đang xử lý...' : 'Đăng Ký'}
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <span>Đã có tài khoản? </span>
        <Button type="link" onClick={onLoginClick} style={{ padding: 0 }}>
          Đăng nhập
        </Button>
      </div>
    </div>
  );
};

export default Register; 