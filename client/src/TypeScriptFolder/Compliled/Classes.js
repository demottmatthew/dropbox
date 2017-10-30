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
  var Item = (function () {
    function Item (productName, itemDescription, immageURL) {
      if (productName === void 0) { productName = '' }
      if (itemDescription === void 0) { itemDescription = '' }
      this.ProductName = productName
      this.ItemDescription = itemDescription
      this.ImmageURL = immageURL
    }
    return Item
  }())
  Classes.Item = Item
})(Classes = exports.Classes || (exports.Classes = {}))
