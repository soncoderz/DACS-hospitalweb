import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'patient',
    gender: '',
    dateOfBirth: '',
    address: '',
    password: '',
    confirmPassword: '',
    isActive: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Simulate API call with sample data
      setTimeout(() => {
        setUsers([
          {
            _id: '1',
            fullName: 'John Doe',
            email: 'john.doe@example.com',
            phoneNumber: '0901234567',
            role: 'patient',
            gender: 'male',
            dateOfBirth: '1985-05-15',
            address: '123 Main St, New York',
            isActive: true,
            createdAt: '2023-01-15'
          },
          {
            _id: '2',
            fullName: 'Dr. Sarah Smith',
            email: 'sarah.smith@example.com',
            phoneNumber: '0912345678',
            role: 'doctor',
            gender: 'female',
            dateOfBirth: '1980-03-10',
            address: '456 Oak Ave, Chicago',
            isActive: true,
            createdAt: '2023-01-20'
          },
          {
            _id: '3',
            fullName: 'Michael Johnson',
            email: 'michael.johnson@example.com',
            phoneNumber: '0923456789',
            role: 'patient',
            gender: 'male',
            dateOfBirth: '1990-08-25',
            address: '789 Pine Rd, Los Angeles',
            isActive: false,
            createdAt: '2023-02-05'
          },
          {
            _id: '4',
            fullName: 'Admin User',
            email: 'admin@example.com',
            phoneNumber: '0934567890',
            role: 'admin',
            gender: 'other',
            dateOfBirth: '1975-12-01',
            address: '321 Elm St, Seattle',
            isActive: true,
            createdAt: '2023-01-10'
          },
          {
            _id: '5',
            fullName: 'Dr. David Lee',
            email: 'david.lee@example.com',
            phoneNumber: '0945678901',
            role: 'doctor',
            gender: 'male',
            dateOfBirth: '1983-07-20',
            address: '654 Maple Ave, Boston',
            isActive: true,
            createdAt: '2023-02-15'
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Could not load users. Please try again later.');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      if (editMode) {
        // Update existing user
        setUsers(prevUsers => prevUsers.map(user => 
          user._id === selectedUser._id ? { 
            ...user, 
            ...formData,
            password: undefined, // Don't update password in UI state
            confirmPassword: undefined
          } : user
        ));
      } else {
        // Create new user
        const newUser = {
          ...formData,
          _id: Date.now().toString(),
          createdAt: new Date().toISOString().split('T')[0]
        };
        setUsers(prevUsers => [...prevUsers, newUser]);
      }

      // Reset form and hide it
      resetForm();
      setShowForm(false);
      setError(null);
    } catch (error) {
      console.error('Error saving user:', error);
      setError('Could not save user information. Please try again later.');
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      role: user.role || 'patient',
      gender: user.gender || '',
      dateOfBirth: user.dateOfBirth || '',
      address: user.address || '',
      password: '',
      confirmPassword: '',
      isActive: user.isActive !== undefined ? user.isActive : true
    });
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      // In real app, call API to delete user
      // await api.delete(`/admin/users/${userId}`);
      
      // Update state
      setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Could not delete user. Please try again later.');
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phoneNumber: '',
      role: 'patient',
      gender: '',
      dateOfBirth: '',
      address: '',
      password: '',
      confirmPassword: '',
      isActive: true
    });
    setEditMode(false);
    setSelectedUser(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
    setError(null);
  };

  const getRoleName = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'doctor':
        return 'Doctor';
      case 'patient':
        return 'Patient';
      default:
        return 'User';
    }
  };

  const getGenderName = (gender) => {
    switch (gender) {
      case 'male':
        return 'Male';
      case 'female':
        return 'Female';
      case 'other':
        return 'Other';
      default:
        return 'Not specified';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter users based on search term and role
  const filteredUsers = users.filter(user => {
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber.includes(searchTerm);
    
    return matchesRole && matchesSearch;
  });

  return (
    <div className="admin-users-management">
      <div className="admin-section-header">
        <h1>User Management</h1>
        <button className="btn btn-primary" onClick={handleAddNew}>
          <i className="fas fa-plus"></i> Add New User
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="admin-filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fas fa-search"></i>
        </div>
        
        <div className="filter-box">
          <label>Role:</label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="patient">Patients</option>
            <option value="doctor">Doctors</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {showForm && (
        <div className="admin-form-card">
          <div className="admin-form-header">
            <h2>{editMode ? 'Update User' : 'Add New User'}</h2>
            <button className="btn-icon" onClick={handleCancel}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fullName">Full Name <span className="required">*</span></label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email <span className="required">*</span></label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number <span className="required">*</span></label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="role">Role <span className="required">*</span></label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            
            {/* Only show password fields when creating new user or explicitly changing password */}
            {(!editMode || formData.changePassword) && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="password">Password {!editMode && <span className="required">*</span>}</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required={!editMode}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password {!editMode && <span className="required">*</span>}</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required={!editMode}
                    />
                  </div>
                </div>
              </>
            )}
            
            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
              <label htmlFor="isActive">Active</label>
            </div>
            
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editMode ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-indicator">Loading...</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Gender</th>
                <th>Status</th>
                <th>Created On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user._id}>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>{user.phoneNumber}</td>
                    <td>
                      <span className={`role-${user.role}`}>{getRoleName(user.role)}</span>
                    </td>
                    <td>{getGenderName(user.gender)}</td>
                    <td>
                      <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon btn-edit" 
                          onClick={() => handleEdit(user)}
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="btn-icon btn-delete" 
                          onClick={() => handleDelete(user._id)}
                          title="Delete"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="no-data">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsersManagement; 