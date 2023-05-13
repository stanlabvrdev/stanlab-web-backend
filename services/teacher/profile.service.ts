import NotFoundError from "../exceptions/not-found";

import { Profile, ProfileAttr } from "../../models/profile";

import { SchoolAdmin } from "../../models/schoolAdmin";

class TeacherProfileService {
  async findById(id: string): Promise<ProfileAttr | null> {
    return Profile.findOne({ teacher: id });
  }
  async update(teacherId: string, data: { school_id: string }) {
    let profile = await this.findById(teacherId);
    if (data.school_id) await this.checkIsSchoolValid(data.school_id);

    if (!profile) {
      profile = await this.create(teacherId);
    }

    return Profile.findByIdAndUpdate(
      profile._id, // the id of the record to update
      { selectedSchool: data.school_id },
      { new: true } // return the updated record
    );
  }

  async create(teacherId: string): Promise<ProfileAttr> {
    const profile: any = new Profile({
      teacher: teacherId,
    });

    return profile.save();
  }

  async checkIsSchoolValid(schoolId: string) {
    const school = await SchoolAdmin.findOne({ _id: schoolId });

    if (!school) throw new NotFoundError("school not found");

    return school;
  }

  async getSelectedSchool(id: string): Promise<string | null> {
    const profile = await this.findById(id);

    if (!profile) return null;

    return profile.selectedSchool?.toString() || null;
  }
}
const teacherProfileService = new TeacherProfileService();
export default teacherProfileService;
