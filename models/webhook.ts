import mongoose from "mongoose";

interface WebhookAttrs {
  txId: string;
  reference: string;
  isActive: boolean;
  createdAt: Date;
}

interface WebhookDoc extends mongoose.Document {
  txId: string;
  reference: string;
  isActive: boolean;
  createdAt: Date;
}

interface WebhookModel extends mongoose.Model<WebhookDoc> {
  build(attrs: WebhookAttrs): WebhookDoc;
}

const webhookSchema = new mongoose.Schema({
  txId: { type: String },
  reference: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now, required: true },
});

const Webhook = mongoose.model("Webhook", webhookSchema);

export { Webhook };
