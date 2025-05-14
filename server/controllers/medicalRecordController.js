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

// POST /api/medical-records - Tạo hồ sơ bệnh án mới
exports.createMedicalRecord = async (req, res) => {
  try {
    const { patientId, appointmentId, diagnosis, treatment, prescription, notes } = req.body;
    const userId = req.user.id;
    
    // Validate các trường bắt buộc
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'ID bệnh nhân là bắt buộc'
      });
    }
    
    // Xác thực prescription là mảng nếu được cung cấp
    if (prescription && !Array.isArray(prescription)) {
      return res.status(400).json({
        success: false,
        message: 'Đơn thuốc phải là một mảng các loại thuốc'
      });
    }
    
    // Validate dữ liệu đơn thuốc
    if (prescription && Array.isArray(prescription)) {
      for (const med of prescription) {
        if (!med.medicine) {
          return res.status(400).json({
            success: false,
            message: 'Mỗi thuốc trong đơn thuốc phải có tên thuốc'
          });
        }
      }
    }
    
    // Validate patientId
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bệnh nhân không hợp lệ'
      });
    }
    
    // Tìm bệnh nhân
    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bệnh nhân'
      });
    }
    
    // Tìm doctor record dựa vào user id
    const doctor = await Doctor.findOne({ user: userId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }
    
    // Nếu có appointmentId, kiểm tra và cập nhật trạng thái
    let appointment;
    if (appointmentId) {
      if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
        return res.status(400).json({
          success: false,
          message: 'ID lịch hẹn không hợp lệ'
        });
      }
      
      appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lịch hẹn'
        });
      }
      
      // Kiểm tra lịch hẹn có phải của bác sĩ này không
      if (appointment.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền tạo hồ sơ bệnh án cho lịch hẹn này'
        });
      }
      
      // Kiểm tra lịch hẹn có phải của bệnh nhân này không
      if (appointment.patientId.toString() !== patientId) {
        return res.status(400).json({
          success: false,
          message: 'Lịch hẹn không phải của bệnh nhân này'
        });
      }
      
      // Kiểm tra trạng thái lịch hẹn
      if (appointment.status !== 'confirmed' && appointment.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: `Không thể tạo hồ sơ bệnh án cho lịch hẹn có trạng thái ${appointment.status}`
        });
      }
      
      // Cập nhật trạng thái lịch hẹn thành completed nếu chưa
      if (appointment.status !== 'completed') {
        appointment.status = 'completed';
        appointment.completionDate = new Date();
        appointment.medicalRecord = {
          diagnosis: diagnosis || '',
          treatment: treatment || '',
          prescription: prescription || [],
          notes: notes || '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await appointment.save();
      }
    } else {
      // Kiểm tra xem bệnh nhân đã từng khám với bác sĩ này chưa
      const hasAppointment = await Appointment.findOne({
        patientId: patientId,
        doctorId: doctor._id
      });
      
      if (!hasAppointment && req.user.roleType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Bệnh nhân chưa từng khám với bác sĩ này'
        });
      }
    }
    
    // Tạo hồ sơ bệnh án mới
    const medicalRecord = new MedicalRecord({
      patientId,
      doctorId: doctor._id,
      appointmentId: appointmentId || null,
      diagnosis: diagnosis || '',
      treatment: treatment || '',
      prescription: prescription || [],
      notes: notes || ''
    });
    
    await medicalRecord.save();
    
    return res.status(201).json({
      success: true,
      data: medicalRecord,
      message: 'Tạo hồ sơ bệnh án thành công'
    });
  } catch (error) {
    console.error('Create medical record error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo hồ sơ bệnh án',
      error: error.message
    });
  }
};

// PUT /api/medical-records/:id - Cập nhật hồ sơ bệnh án
exports.updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { diagnosis, treatment, prescription, notes } = req.body;
    const userId = req.user.id;
    
    // Validate id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID hồ sơ bệnh án không hợp lệ'
      });
    }
    
    // Xác thực prescription là mảng nếu được cung cấp
    if (prescription && !Array.isArray(prescription)) {
      return res.status(400).json({
        success: false,
        message: 'Đơn thuốc phải là một mảng các loại thuốc'
      });
    }
    
    // Validate dữ liệu đơn thuốc
    if (prescription && Array.isArray(prescription)) {
      for (const med of prescription) {
        if (!med.medicine) {
          return res.status(400).json({
            success: false,
            message: 'Mỗi thuốc trong đơn thuốc phải có tên thuốc'
          });
        }
      }
    }
    
    // Tìm hồ sơ bệnh án
    const medicalRecord = await MedicalRecord.findById(id);
    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ bệnh án'
      });
    }
    
    // Tìm doctor record dựa vào user id
    const doctor = await Doctor.findOne({ user: userId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }
    
    // Kiểm tra hồ sơ có phải do bác sĩ này tạo không
    if (medicalRecord.doctorId.toString() !== doctor._id.toString() && req.user.roleType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật hồ sơ bệnh án này'
      });
    }
    
    // Cập nhật hồ sơ bệnh án
    if (diagnosis !== undefined) medicalRecord.diagnosis = diagnosis;
    if (treatment !== undefined) medicalRecord.treatment = treatment;
    if (prescription !== undefined) medicalRecord.prescription = prescription;
    if (notes !== undefined) medicalRecord.notes = notes;
    
    await medicalRecord.save();
    
    // Nếu có liên kết với một lịch hẹn, cập nhật thông tin trong lịch hẹn đó
    if (medicalRecord.appointmentId) {
      const appointment = await Appointment.findById(medicalRecord.appointmentId);
      if (appointment) {
        appointment.medicalRecord = {
          diagnosis: medicalRecord.diagnosis,
          treatment: medicalRecord.treatment,
          prescription: medicalRecord.prescription,
          notes: medicalRecord.notes,
          updatedAt: new Date()
        };
        
        // Nếu chưa đánh dấu hoàn thành, cập nhật
        if (appointment.status !== 'completed') {
          appointment.status = 'completed';
          appointment.completionDate = new Date();
        }
        
        await appointment.save();
      }
    }
    
    return res.status(200).json({
      success: true,
      data: medicalRecord,
      message: 'Cập nhật hồ sơ bệnh án thành công'
    });
  } catch (error) {
    console.error('Update medical record error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật hồ sơ bệnh án',
      error: error.message
    });
  }
}; 