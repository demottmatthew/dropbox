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
    function AppointmentItem (id, title, description, date, starttime, endtime, fname, lname) {
      if (id === void 0) { id = '' }
      if (title === void 0) { title = '' }
      if (description === void 0) { description = '' }
      if (date === void 0) { date = '' }
      if (starttime === void 0) { starttime = '' }
      if (endtime === void 0) { endtime = '' }
      if (fname === void 0) { fname = '' }
      if (lname === void 0) { lname = '' }
      this.id = id
      this.title = title
      this.description = description
      this.date = date
      this.endtime = endtime
      this.starttime = starttime
      this.fname = fname
      this.lname = lname
    }
    return AppointmentItem
  }())
  Classes.AppointmentItem = AppointmentItem
})(Classes = exports.Classes || (exports.Classes = {}))
