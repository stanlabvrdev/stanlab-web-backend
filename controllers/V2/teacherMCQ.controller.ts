import studentMCQ from "../../models/studentMCQ";
import teacherMCQ from "../../models/teacherMCQ";
import { ServerResponse, ServerErrorHandler } from "../../services/response/serverResponse";
import NotFoundError from "../../services/exceptions/not-found";

function updateAssignment(assignment, updates) {
  assignment.startDate = updates.startDate;
  assignment.dueDate = updates.dueDate;
  assignment.instruction = updates.instruction;
  assignment.type = updates.type;
}
async function editAssignment(req, res) {
  try {
    const { id } = req.params;
    const assignment = await teacherMCQ.findOne({
      teacher: req.teacher._id,
      _id: id,
    });
    if (!assignment) throw new NotFoundError("Assignment not found");
    const studentAssignments = await studentMCQ.find({
      teacherAssignment: assignment._id,
    });
    const savePromises = studentAssignments.map((eachAssignment) => {
      updateAssignment(eachAssignment, req.body);
      return eachAssignment.save();
    });
    updateAssignment(assignment, req.body);
    savePromises.push(assignment.save());
    await Promise.all(savePromises);
    ServerResponse(req, res, 200, assignment, "Assignment updated successfully");
  } catch (err) {
    ServerErrorHandler(req, res, err);
  }
}

async function deleteAssignment(req, res) {
  try {
    const { id } = req.params;
    const assignment = await teacherMCQ.findOne({
      teacher: req.teacher._id,
      _id: id,
    });
    if (!assignment) throw new NotFoundError("Assignment not found");
    const studentAssigments = await studentMCQ.find({
      teacherAssignment: assignment._id,
    });
    const deletePromises = studentAssigments.map((eachAssignment) => eachAssignment.deleteOne());
    deletePromises.push(assignment.deleteOne());
    await Promise.all(deletePromises);
    ServerResponse(req, res, 200, null, "Assignment Deleted successfully");
  } catch (err) {
    ServerErrorHandler(req, res, err);
  }
}

export { editAssignment, deleteAssignment };
