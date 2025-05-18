const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const mongoose = require('mongoose');

// GET /api/patients/:id/medical-records - Lấy hồ sơ bệnh án của bệnh nhân
exports.getPatientMedicalRecords = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Validate patientId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID bệnh nhân không hợp lệ'
      });
    }
    
    // Tìm bệnh nhân
    const patient = await User.findById(id).select('fullName email phoneNumber gender dateOfBirth address avatarUrl');
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bệnh nhân'
      });
    }
    
    // Kiểm tra quyền truy cập
    const user = req.user;
    let medicalRecords;
    
    if (user.roleType === 'admin') {
      // Admin có thể xem tất cả hồ sơ
      medicalRecords = await MedicalRecord.find({ patientId: id })
        .populate({
          path: 'doctorId',
          select: 'title experience education specialtyId hospitalId',
          populate: [
            {
            path: 'user',
              select: 'fullName email phoneNumber avatarUrl'
            },
            {
              path: 'specialtyId',
              select: 'name description'
            },
            {
              path: 'hospitalId',
              select: 'name address contactInfo'
            }
          ]
        })
        .populate({
          path: 'appointmentId',
          select: 'appointmentDate timeSlot bookingCode status hospitalId specialtyId serviceId roomId',
          populate: [
            {
              path: 'hospitalId',
              select: 'name address'
            },
            {
              path: 'specialtyId',
              select: 'name'
            },
            {
              path: 'serviceId',
              select: 'name price'
            },
            {
              path: 'roomId',
              select: 'name number floor'
            }
          ]
        })
        .sort({ createdAt: -1 });
    } else if (user.roleType === 'doctor') {
      // Bác sĩ chỉ xem hồ sơ do mình tạo
      const doctor = await Doctor.findOne({ user: userId });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin bác sĩ'
        });
      }
      
      medicalRecords = await MedicalRecord.find({ 
        patientId: id,
        doctorId: doctor._id
      })
        .populate({
          path: 'doctorId',
          select: 'title experience education specialtyId hospitalId',
          populate: [
            {
            path: 'user',
              select: 'fullName email phoneNumber avatarUrl'
            },
            {
              path: 'specialtyId',
              select: 'name description'
            },
            {
              path: 'hospitalId',
              select: 'name address contactInfo'
            }
          ]
        })
        .populate({
          path: 'appointmentId',
          select: 'appointmentDate timeSlot bookingCode status hospitalId specialtyId serviceId roomId',
          populate: [
            {
              path: 'hospitalId',
              select: 'name address'
            },
            {
              path: 'specialtyId',
              select: 'name'
            },
            {
              path: 'serviceId',
              select: 'name price'
            },
            {
              path: 'roomId',
              select: 'name number floor'
            }
          ]
        })
        .sort({ createdAt: -1 });
    } else {
      // Bệnh nhân chỉ xem hồ sơ của mình
      if (user._id.toString() !== id) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền xem hồ sơ bệnh án của người khác'
        });
      }
      
      medicalRecords = await MedicalRecord.find({ patientId: id })
        .populate({
          path: 'doctorId',
          select: 'title experience education specialtyId hospitalId',
          populate: [
            {
            path: 'user',
              select: 'fullName email phoneNumber avatarUrl'
            },
            {
              path: 'specialtyId',
              select: 'name description'
            },
            {
              path: 'hospitalId',
              select: 'name address contactInfo'
            }
          ]
        })
        .populate({
          path: 'appointmentId',
          select: 'appointmentDate timeSlot bookingCode status hospitalId specialtyId serviceId roomId',
          populate: [
            {
              path: 'hospitalId',
              select: 'name address'
            },
            {
              path: 'specialtyId',
              select: 'name'
            },
            {
              path: 'serviceId',
              select: 'name price'
            },
            {
              path: 'roomId',
              select: 'name number floor'
            }
          ]
        })
        .sort({ createdAt: -1 });
    }
    
    return res.status(200).json({
      success: true,
      count: medicalRecords.length,
      patient: patient,
      data: medicalRecords
    });
  } catch (error) {
    console.error('Get patient medical records error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy hồ sơ bệnh án',
      error: error.message
    });
  }
};


// GET /api/patients/:id - Lấy thông tin bệnh nhân
exports.getPatientInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Validate patientId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID bệnh nhân không hợp lệ'
      });
    }
    
    // Kiểm tra quyền truy cập
    const user = req.user;
    
    // Nếu không phải admin hoặc bác sĩ, chỉ được xem thông tin của mình
    if (user.roleType === 'user' && user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem thông tin bệnh nhân khác'
      });
    }
    
    // Tìm bệnh nhân
    const patient = await User.findById(id).select('-passwordHash -verificationToken -verificationTokenExpires -resetPasswordToken -resetPasswordExpires -otpCode -otpExpires');
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bệnh nhân'
      });
    }
    
    // Nếu là bác sĩ, kiểm tra xem bệnh nhân đã từng khám với bác sĩ này chưa
    if (user.roleType === 'doctor') {
      const doctor = await Doctor.findOne({ user: userId });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin bác sĩ'
        });
      }
      
      const hasAppointment = await Appointment.findOne({
        patientId: id,
        doctorId: doctor._id
      });
      
      if (!hasAppointment && user.roleType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem thông tin của bệnh nhân này'
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Get patient info error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin bệnh nhân',
      error: error.message
    });
  }
};

// Get medical history for the logged-in user
exports.getMedicalHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await MedicalRecord.countDocuments({ patientId: userId });

    // Find all medical records for this user with pagination
    const medicalRecords = await MedicalRecord.find({ patientId: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate({
        path: 'doctorId',
        select: 'user title specialtyId',
        populate: [
          {
            path: 'user',
            select: 'fullName email phoneNumber avatarUrl'
          },
          {
            path: 'specialtyId',
            select: 'name'
          }
        ]
      })
      .populate({
        path: 'appointmentId',
        select: 'appointmentDate appointmentTime status specialtyName serviceId serviceName',
        populate: [
          {
            path: 'serviceId',
            select: 'name price description'
          }
        ]
      })
      .populate({
        path: 'specialty',
        select: 'name'
      });

    // Transform the data to ensure doctor information is formatted correctly
    const formattedRecords = medicalRecords.map(record => {
      const formattedRecord = record.toObject();
      
      // Check if doctorId exists and has user data
      if (formattedRecord.doctorId && formattedRecord.doctorId.user) {
        // Create a flattened doctor object with needed fields
        formattedRecord.doctor = {
          fullName: formattedRecord.doctorId.user.fullName,
          email: formattedRecord.doctorId.user.email,
          phoneNumber: formattedRecord.doctorId.user.phoneNumber,
          avatarUrl: formattedRecord.doctorId.user.avatarUrl,
          title: formattedRecord.doctorId.title
        };

        // Add specialty information
        if (formattedRecord.doctorId.specialtyId) {
          formattedRecord.specialtyName = formattedRecord.doctorId.specialtyId.name;
        } else if (formattedRecord.specialty) {
          formattedRecord.specialtyName = formattedRecord.specialty.name;
        }
      }
      
      // Add service information
      if (formattedRecord.appointmentId) {
        if (formattedRecord.appointmentId.serviceId) {
          formattedRecord.serviceName = formattedRecord.appointmentId.serviceId.name;
          formattedRecord.servicePrice = formattedRecord.appointmentId.serviceId.price;
        } else if (formattedRecord.appointmentId.serviceName) {
          formattedRecord.serviceName = formattedRecord.appointmentId.serviceName;
        }
      }
      
      // Ensure status is present for filtering
      if (!formattedRecord.status && formattedRecord.appointmentId) {
        formattedRecord.status = formattedRecord.appointmentId.status;
      }
      
      return formattedRecord;
    });

    res.status(200).json({
      records: formattedRecords,
      pagination: {
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        pageSize: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching medical history:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy lịch sử khám bệnh',
      error: error.message
    });
  }
};

// Get specific medical record by ID
exports.getMedicalRecordById = async (req, res) => {
  try {
    const recordId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const medicalRecord = await MedicalRecord.findById(recordId)
      .populate({
        path: 'doctorId',
        select: 'user title specialtyId hospitalId',
        populate: [
          {
            path: 'user',
            select: 'fullName email phoneNumber avatarUrl'
          },
          {
            path: 'specialtyId',
            select: 'name'
          },
          {
            path: 'hospitalId',
            select: 'name address contactInfo'
          }
        ]
      })
      .populate({
        path: 'patientId',
        select: 'fullName email phoneNumber gender dateOfBirth address'
      })
      .populate({
        path: 'appointmentId',
        select: 'appointmentDate appointmentTime status hospitalId specialtyId serviceId serviceName fee',
        populate: [
          {
            path: 'hospitalId',
            select: 'name address contactInfo'
          },
          {
            path: 'specialtyId',
            select: 'name'
          },
          {
            path: 'serviceId',
            select: 'name price description'
          }
        ]
      })
      .populate({
        path: 'specialty',
        select: 'name'
      });

    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ bệnh án'
      });
    }

    // Check if user has permission to view this record
    if (userRole !== 'admin' && userRole !== 'doctor' && 
        medicalRecord.patientId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem hồ sơ bệnh án này'
      });
    }

    // Transform the record to include flattened doctor and hospital information
    const recordObj = medicalRecord.toObject();
    
    // Process doctor information
    if (recordObj.doctorId && recordObj.doctorId.user) {
      recordObj.doctor = {
        fullName: recordObj.doctorId.user.fullName,
        email: recordObj.doctorId.user.email,
        phoneNumber: recordObj.doctorId.user.phoneNumber,
        avatarUrl: recordObj.doctorId.user.avatarUrl,
        title: recordObj.doctorId.title
      };

      // Add specialty information
      if (recordObj.doctorId.specialtyId) {
        recordObj.specialtyName = recordObj.doctorId.specialtyId.name;
      } else if (recordObj.specialty) {
        recordObj.specialtyName = recordObj.specialty.name;
      }
    }
    
    // Process hospital information
    if (recordObj.doctorId && recordObj.doctorId.hospitalId) {
      recordObj.hospital = recordObj.doctorId.hospitalId;
    } else if (recordObj.appointmentId && recordObj.appointmentId.hospitalId) {
      recordObj.hospital = recordObj.appointmentId.hospitalId;
    }
    
    // Process service information
    if (recordObj.appointmentId) {
      if (recordObj.appointmentId.serviceId) {
        recordObj.service = {
          name: recordObj.appointmentId.serviceId.name,
          price: recordObj.appointmentId.serviceId.price,
          description: recordObj.appointmentId.serviceId.description
        };
      } else if (recordObj.appointmentId.serviceName) {
        recordObj.service = {
          name: recordObj.appointmentId.serviceName,
          price: recordObj.appointmentId.fee?.totalAmount
        };
      }
    }

    res.status(200).json(recordObj);
  } catch (error) {
    console.error('Error fetching medical record:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin hồ sơ bệnh án',
      error: error.message
    });
  }
};

// Create new medical record (doctor/admin only)
exports.createMedicalRecord = async (req, res) => {
  try {
    const {
      patientId,
      appointmentId,
      diagnosis,
      symptoms,
      treatment,
      notes,
      prescription,
      followUpDate,
      specialtyId
    } = req.body;

    // Xử lý dữ liệu prescription
    let prescriptionData = [];
    if (prescription && Array.isArray(prescription)) {
      prescriptionData = prescription.map(item => ({
        medicine: item.medicine,
        dosage: item.dosage || '',
        usage: item.usage || '',
        duration: item.duration || '',
        notes: item.notes || '',
        quantity: item.quantity || 1,
        medicationId: item.medicationId || null,
        frequency: item.frequency || ''
      }));
    }

    const newMedicalRecord = new MedicalRecord({
      patientId,
      doctorId: req.user.id,
      appointmentId,
      diagnosis,
      symptoms,
      treatment,
      notes,
      prescription: prescriptionData,
      followUpDate,
      specialty: specialtyId
    });

    const savedRecord = await newMedicalRecord.save();

    // Update the appointment status if needed
    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, {
        status: 'completed',
        medicalRecord: savedRecord._id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Tạo hồ sơ bệnh án thành công',
      medicalRecord: savedRecord
    });
  } catch (error) {
    console.error('Error creating medical record:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tạo hồ sơ bệnh án',
      error: error.message
    });
  }
};

// Update medical record (doctor/admin only)
exports.updateMedicalRecord = async (req, res) => {
  try {
    const recordId = req.params.id;
    const updatedData = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;

    // Find record first to check permissions
    const existingRecord = await MedicalRecord.findById(recordId);

    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ bệnh án'
      });
    }

    // Handle prescription field
    if (updatedData.prescription && Array.isArray(updatedData.prescription)) {
      // Ensure all required fields are properly formatted
      updatedData.prescription = updatedData.prescription.map(item => ({
        medicine: item.medicine,
        dosage: item.dosage || '',
        usage: item.usage || '',
        duration: item.duration || '',
        notes: item.notes || '',
        quantity: item.quantity || 1,
        medicationId: item.medicationId || null,
        frequency: item.frequency || ''
      }));
    }

    // Xóa trường prescriptions nếu có
    if (updatedData.prescriptions) {
      delete updatedData.prescriptions;
    }

    // Update the record
    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
      recordId,
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật hồ sơ bệnh án thành công',
      medicalRecord: updatedRecord
    });
  } catch (error) {
    console.error('Error updating medical record:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật hồ sơ bệnh án',
      error: error.message
    });
  }
};

// Get all medical records (admin only)
exports.getAllMedicalRecords = async (req, res) => {
  try {
    const { page = 1, limit = 10, patientId, doctorId, startDate, endDate } = req.query;
    
    const query = {};
    
    // Add filters if provided
    if (patientId) query.patientId = patientId;
    if (doctorId) query.doctorId = doctorId;
    
    // Date range filter
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      populate: [
        { path: 'patientId', select: 'fullName' },
        { path: 'doctorId', select: 'fullName specialtyName' },
        { path: 'specialty', select: 'name' }
      ]
    };
    
    const records = await MedicalRecord.paginate(query, options);
    
    res.status(200).json({
      success: true,
      data: records.docs,
      pagination: {
        total: records.totalDocs,
        limit: records.limit,
        page: records.page,
        pages: records.totalPages,
        hasNextPage: records.hasNextPage,
        hasPrevPage: records.hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách hồ sơ bệnh án',
      error: error.message
    });
  }
};

// Delete medical record (admin only)
exports.deleteMedicalRecord = async (req, res) => {
  try {
    const recordId = req.params.id;
    
    const medicalRecord = await MedicalRecord.findById(recordId);
    
    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ bệnh án'
      });
    }
    
    // If record is linked to an appointment, remove the reference
    if (medicalRecord.appointmentId) {
      await Appointment.findByIdAndUpdate(medicalRecord.appointmentId, {
        $unset: { medicalRecord: "" }
      });
    }
    
    await MedicalRecord.findByIdAndDelete(recordId);
    
    res.status(200).json({
      success: true,
      message: 'Xóa hồ sơ bệnh án thành công'
    });
  } catch (error) {
    console.error('Error deleting medical record:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa hồ sơ bệnh án',
      error: error.message
    });
  }
}; 