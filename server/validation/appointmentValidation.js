const Joi = require('joi');

const validateAppointment = (data) => {
  const schema = Joi.object({
    doctorId: Joi.string()
      .required()
      .messages({
        'string.empty': 'Vui lòng chọn bác sĩ',
        'any.required': 'Vui lòng chọn bác sĩ'
      }),

    department: Joi.string()
      .required()
      .messages({
        'string.empty': 'Vui lòng chọn chuyên khoa',
        'any.required': 'Vui lòng chọn chuyên khoa'
      }),

    appointmentDate: Joi.date()
      .greater('now')
      .required()
      .messages({
        'date.greater': 'Ngày khám phải sau ngày hiện tại',
        'any.required': 'Vui lòng chọn ngày khám'
      }),

    timeSlot: Joi.string()
      .required()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .messages({
        'string.empty': 'Vui lòng chọn giờ khám',
        'string.pattern.base': 'Giờ khám không hợp lệ',
        'any.required': 'Vui lòng chọn giờ khám'
      }),

    symptoms: Joi.string()
      .required()
      .min(10)
      .max(1000)
      .messages({
        'string.empty': 'Vui lòng mô tả triệu chứng',
        'string.min': 'Mô tả triệu chứng phải có ít nhất {#limit} ký tự',
        'string.max': 'Mô tả triệu chứng không được vượt quá {#limit} ký tự',
        'any.required': 'Vui lòng mô tả triệu chứng'
      }),

    medicalHistory: Joi.string()
      .allow('')
      .max(1000)
      .messages({
        'string.max': 'Tiền sử bệnh không được vượt quá {#limit} ký tự'
      }),

    note: Joi.string()
      .allow('')
      .max(500)
      .messages({
        'string.max': 'Ghi chú không được vượt quá {#limit} ký tự'
      })
  });

  return schema.validate(data);
};

module.exports = {
  validateAppointment
}; 