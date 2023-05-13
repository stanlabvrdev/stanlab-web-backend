import { Teacher } from "../../models/teacher";
import NotFoundError from "../exceptions/not-found";
import { passwordService } from "../passwordService";
import generateRandomString from "../../utils/randomStr";
import { StudentTeacher } from "../../models/teacherStudent";
import Logger from "../../utils/logger";
import { Student } from "../../models/student";
import { Profile } from "../../models/profile";
import { SchoolTeacher } from "../../models/schoolTeacher";
import { SchoolAdmin } from "../../models/schoolAdmin";

class TeacherProfileService {
  async update(teacherId: string, data: { school_id: string }) {
    let profile = await Profile.findOne({ teacher: teacherId });

    await this.checkIsSchoolValid(data.school_id);

    if (!profile) {
      profile = await this.create(teacherId);
    }

    return Profile.findByIdAndUpdate(
      profile._id, // the id of the record to update
      { selectedSchool: data.school_id },
      { new: true } // return the updated record
    );
  }

  async create(teacherId: string) {
    const profile = new Profile({
      teacher: teacherId,
    });

    return profile.save();
  }

  async checkIsSchoolValid(schoolId: string) {
    const school = await SchoolAdmin.findOne({ _id: schoolId });

    if (!school) throw new NotFoundError("school not found");

    return school;
  }
}
const teacherProfileService = new TeacherProfileService();
export default teacherProfileService;
