export namespace Classes {
  export class User {
    public Id: string;
    public FirstName: string;
    public LastName: string;
    public UserName: string;
    public Email: string;
    public Password: string;

    constructor(id: string = "", userName: string = "", email: string = "",
     password: string = "", firstName: string = "", lastName: string = "") {
      this.Id = id;
      this.FirstName = firstName;
      this.LastName = lastName;
      this.UserName = userName;
      this.Email = email;
      this.Password = password;
    }
  }

  export class PasswordVerification {
    public CurrentPassword: string;
    public NewPassword: string;
    public VerifyNewPassword: string;

    constructor(currentPassword: string = "", newPassword: string = "", verifyNewPassword: string = "") {
      this.CurrentPassword = currentPassword;
      this.NewPassword = newPassword;
      this.VerifyNewPassword = verifyNewPassword;
    }

    Verify (currentPassword: string): boolean {
      return (this.CurrentPassword === currentPassword && this.NewPassword === this.VerifyNewPassword);
    }
  }

  export class FileItem {
    public name : string;
    public size : string;
    public file : string;

    constructor(name: string = "", size: string = "", file: string) {
      this.name = name;
      this.size = size;
      this.file = file;
    }
  }
  export class AppointmentItem {
    public title : string;
    public description : string;
    public starttime : string;
    public endtime : string;
    public date : string;
    public fname : string;
    public lname : string;

    constructor(title: string = "", description: string = "", date: string, starttime: string, endtime: string, fname: string, lname: string) {
      this.title = title;
      this.description = description;
      this.starttime = starttime;
      this.endtime = endtime;
      this.date = date
      this.fname = fname;
      this.lname = lname;
    }
  }
}
