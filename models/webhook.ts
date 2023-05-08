import mongoose from "mongoose";

interface WebhookAttrs {
  txId: string;
  reference: string;
  isActive: boolean;
}

interface WebhookDoc extends mongoose.Document {
  txId: string;
  reference: string;
  isActive: boolean;
}

interface WebhookModel extends mongoose.Model<WebhookDoc> {
  build(attrs: WebhookAttrs): WebhookDoc;
}

const webhookSchema = new mongoose.Schema({
  txId: { type: String },
  reference: { type: String },
  isActive: { type: Boolean, default: true },
});

const Webhook = mongoose.model("Webhook", webhookSchema);

export { Webhook };
