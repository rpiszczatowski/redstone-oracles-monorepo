import { Schema, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB
export interface ITransaction {
  _id: string; // hash of the transaction
  timestamp: number;
  sender: string;
  recipient: string;
  value: string;
  blockNumber: number;
}

// 2. Create a Schema corresponding to the document interface
const transactionSchema = new Schema<ITransaction>({
  _id: { type: String, required: true },
  timestamp: { type: Number, required: true, index: true },
  sender: { type: String, required: true, index: true },
  recipient: { type: String, required: true, index: true },
  value: { type: String, required: true },
  blockNumber: { type: Number, required: true },
});

transactionSchema.index({ sender: 1, blockNumber: -1 });

// 3. Create a Model
export const Transaction = model<ITransaction>(
  "Transaction",
  transactionSchema
);
