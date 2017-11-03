'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
var Classes;
(function (Classes) {
  var User = (function () {
    function User (id, userName, email, password, firstName, lastName) {
      if (id === void 0) { id = '' }
      if (userName === void 0) { userName = '' }
      if (email === void 0) { email = '' }
      if (password === void 0) { password = '' }
      if (firstName === void 0) { firstName = '' }
      if (lastName === void 0) { lastName = '' }
      this.Id = id
      this.FirstName = firstName
      this.LastName = lastName
      this.UserName = userName
      this.Email = email
      this.Password = password
    }
    return User
  }())
  Classes.User = User
  var PasswordVerification = (function () {
    function PasswordVerification (currentPassword, newPassword, verifyNewPassword) {
      if (currentPassword === void 0) { currentPassword = '' }
      if (newPassword === void 0) { newPassword = '' }
      if (verifyNewPassword === void 0) { verifyNewPassword = '' }
      this.CurrentPassword = currentPassword
      this.NewPassword = newPassword
      this.VerifyNewPassword = verifyNewPassword
    }
    PasswordVerification.prototype.Verify = function (currentPassword) {
      return (this.CurrentPassword === currentPassword && this.NewPassword === this.VerifyNewPassword)
    }
    return PasswordVerification
  }())
  Classes.PasswordVerification = PasswordVerification
  var FileItem = (function () {
    function FileItem (name, size, file) {
      if (name === void 0) { name = '' }
      if (size === void 0) { size = '' }
      if (file === void 0) { file = '' }
      this.name = name
      this.size = size
      this.file = file
    }
    return FileItem
  }())
  Classes.FileItem = FileItem

  var AppointmentItem = (function () {
    function AppointmentItem (title, description, date, time, fname, lname) {
      if (title === void 0) { title = '' }
      if (description === void 0) { description = '' }
      if (date === void 0) { date = '' }
      if (time === void 0) { time = '' }
      if (fname === void 0) { fname = '' }
      if (lname === void 0) { lname = '' }
      this.title = title
      this.description = description
      this.date = date
      this.time = time
      this.fname = fname
      this.lname = lname
    }
    return AppointmentItem
  }())
  Classes.AppointmentItem = AppointmentItem
})(Classes = exports.Classes || (exports.Classes = {}))
