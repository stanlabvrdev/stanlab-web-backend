import { ServerErrorHandler, ServerResponse } from "../services/response/serverResponse";
import Notification from "../models/notification";
import NotFoundError from "../services/exceptions/not-found";

async function getStudentNotifications(req, res) {
  try {
    const notification = await Notification.find({ recipient: req.student._id, read: false });

    ServerResponse(req, res, 200, notification, "notifications fetched successfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function readStudentsNotification(req, res) {
  try {
    const params = { recipient: req.student._id, read: false, _id: req.params.id };

    const notification = await Notification.findOne(params);

    if (!notification) {
      throw new NotFoundError("notification not found");
    }

    notification.read = true;
    await notification.save();

    ServerResponse(req, res, 200, notification, "notification fetched successfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

export default { getStudentNotifications, readStudentsNotification };
